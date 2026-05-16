/**
 * AgentSelectorSheet - Modal/ActionSheet for selecting the active agent profile.
 * Used in ChatScreen and SessionListScreen headers to allow quick agent switching.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';
import { useConfigContext } from '../store/config';
import { ExtendedSettingsApiClient, SettingsApiClient } from '../lib/settingsApi';
import { useProfile } from '../store/profile';
import {
  buildSelectorProfiles,
  formatAgentSelectorSelectAccessibilityLabel,
  getAgentSelectorMobileFallbackAvatarBackgroundColor,
  getAgentSelectorMobileRenderState,
  type AgentSelectorMobileSurfaceColors,
  type SelectableAgentProfile as SelectableProfile,
} from '@dotagents/shared/agent-selector-options';
import { getAgentAvatarColors } from '@dotagents/shared/agent-avatar-colors';

interface AgentSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AgentSelectorSheet({ visible, onClose }: AgentSelectorSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { config } = useConfigContext();
  const { currentProfile, setCurrentProfile } = useProfile();

  const [profiles, setProfiles] = useState<SelectableProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectorMode, setSelectorMode] = useState<'profile' | 'acpx'>('profile');
  const agentSelectorRenderState = React.useMemo(
    () => getAgentSelectorMobileRenderState({
      selectorMode,
      colors: theme.colors,
    }),
    [selectorMode, theme.colors],
  );
  const agentSelectorCopy = agentSelectorRenderState.copy;
  const agentSelectorSurface = agentSelectorRenderState.surface;
  const agentSelectorColors = agentSelectorRenderState.colors;
  const agentSelectorCloseButton = agentSelectorRenderState.closeButton;
  const styles = React.useMemo(() => createStyles(agentSelectorColors), [agentSelectorColors]);
  const hasApiConfig = Boolean(config.baseUrl && config.apiKey);
  const missingConfigError = agentSelectorCopy.missingConfigError;

  const fetchProfiles = useCallback(async () => {
    if (!hasApiConfig) {
      setIsLoading(false);
      setProfiles([]);
      setError(missingConfigError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
      const [settings, agentProfilesResponse] = await Promise.all([
        client.getSettings(),
        client.getAgentProfiles().catch(() => ({ profiles: [] })),
      ]);
      const nextState = buildSelectorProfiles(settings, agentProfilesResponse.profiles || []);
      setSelectorMode(nextState.selectorMode);
      setProfiles(nextState.profiles);
    } catch (err: any) {
      console.warn('[AgentSelectorSheet] Failed to fetch profiles:', err);
      setError(err?.message || agentSelectorCopy.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [config.baseUrl, config.apiKey, hasApiConfig, missingConfigError]);

  useEffect(() => {
    if (visible) {
      fetchProfiles();
    }
  }, [visible, fetchProfiles]);

  const handleSelectProfile = async (profile: SelectableProfile) => {
    if (!hasApiConfig) {
      setProfiles([]);
      setError(missingConfigError);
      return;
    }
    if (currentProfile?.id === profile.id) {
      onClose();
      return;
    }

    setIsSwitching(true);
    try {
      const client = new SettingsApiClient(config.baseUrl, config.apiKey);
      if (profile.selectorMode === 'acpx' && profile.selectionValue) {
        await client.updateSettings({ mainAgentName: profile.selectionValue });
        setCurrentProfile(profile);
      } else {
        await client.setCurrentProfile(profile.id);
        setCurrentProfile(profile);
      }
      onClose();
    } catch (err: any) {
      console.error('[AgentSelectorSheet] Failed to switch profile:', err);
      setError(err?.message || agentSelectorCopy.switchFailed);
    } finally {
      setIsSwitching(false);
    }
  };

  const renderProfile = ({ item }: { item: SelectableProfile }) => {
    const isSelected = currentProfile?.id === item.id;
    const profileSummary = item.description || item.guidelines;
    const fallbackAvatarColor = getAgentAvatarColors(item.id)[0];
    const fallbackAvatarBackgroundColor = getAgentSelectorMobileFallbackAvatarBackgroundColor(fallbackAvatarColor);
    return (
      <TouchableOpacity
        style={[styles.profileItem, isSelected && styles.profileItemSelected]}
        onPress={() => handleSelectProfile(item)}
        disabled={isSwitching}
        activeOpacity={agentSelectorSurface.profileItem.pressedOpacity}
        accessibilityRole={agentSelectorSurface.profileItem.accessibilityRole}
        accessibilityLabel={formatAgentSelectorSelectAccessibilityLabel(item.name)}
        accessibilityState={{ selected: isSelected, disabled: isSwitching }}
      >
        <View
          style={[
            styles.profileAvatar,
            !item.avatarDataUrl && {
              backgroundColor: fallbackAvatarBackgroundColor,
            },
          ]}
        >
          {item.avatarDataUrl ? (
            <Image
              source={{ uri: item.avatarDataUrl }}
              style={styles.profileAvatarImage}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Ionicons
              name={agentSelectorSurface.avatar.fallbackIconName}
              size={agentSelectorSurface.avatar.fallbackIconSize}
              color={agentSelectorColors.avatar.fallbackIconColor}
            />
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text
            style={[styles.profileName, isSelected && styles.profileNameSelected]}
            numberOfLines={agentSelectorSurface.profileName.numberOfLines}
          >
            {item.name}
          </Text>
          {profileSummary && (
            <Text
              style={styles.profileDescription}
              numberOfLines={agentSelectorSurface.profileDescription.numberOfLines}
            >
              {profileSummary}
            </Text>
          )}
        </View>
        {isSelected && (
          <Ionicons
            name={agentSelectorSurface.checkIcon.name}
            size={agentSelectorSurface.checkIcon.size}
            color={agentSelectorColors.checkIcon.color}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.backdropSpacer} />
      </Pressable>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[agentSelectorSurface.sheet.bottomPadding] }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={agentSelectorSurface.title.numberOfLines}>
            {agentSelectorRenderState.title}
          </Text>
          <TouchableOpacity
            style={styles.headerCloseButton}
            onPress={onClose}
            activeOpacity={agentSelectorCloseButton.activeOpacity}
            accessibilityRole={agentSelectorCloseButton.accessibilityRole}
            accessibilityLabel={agentSelectorCloseButton.accessibilityLabel}
          >
            <Ionicons
              name={agentSelectorCloseButton.icon.name}
              size={agentSelectorCloseButton.icon.size}
              color={agentSelectorCloseButton.icon.color}
            />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={agentSelectorColors.activityIndicator.color} />
            <Text style={styles.loadingText}>{agentSelectorCopy.loadingLabel}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchProfiles}>
              <Text style={styles.retryButtonText}>{agentSelectorCopy.retryLabel}</Text>
            </TouchableOpacity>
          </View>
        ) : profiles.length === 0 ? (
          <Text style={styles.emptyText}>
            {agentSelectorRenderState.emptyLabel}
          </Text>
        ) : (
          <FlatList
            data={profiles}
            renderItem={renderProfile}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

function createStyles(agentSelectorColors: AgentSelectorMobileSurfaceColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: agentSelectorColors.backdrop.backgroundColor,
    },
    backdropSpacer: {
      flex: agentSelectorSurface.backdropSpacer.flex,
    },
    sheet: {
      backgroundColor: agentSelectorColors.sheet.backgroundColor,
      borderTopLeftRadius: radius[agentSelectorSurface.sheet.borderTopRadius],
      borderTopRightRadius: radius[agentSelectorSurface.sheet.borderTopRadius],
      paddingHorizontal: spacing[agentSelectorSurface.sheet.paddingHorizontal],
      paddingTop: spacing[agentSelectorSurface.sheet.paddingTop],
      maxHeight: agentSelectorSurface.sheet.maxHeight,
    },
    handle: {
      width: agentSelectorSurface.handle.width,
      height: agentSelectorSurface.handle.height,
      backgroundColor: agentSelectorColors.handle.backgroundColor,
      borderRadius: agentSelectorSurface.handle.borderRadius,
      alignSelf: agentSelectorSurface.handle.alignSelf,
      marginBottom: spacing[agentSelectorSurface.handle.marginBottom],
    },
    header: {
      flexDirection: agentSelectorSurface.header.flexDirection,
      alignItems: agentSelectorSurface.header.alignItems,
      gap: spacing[agentSelectorSurface.header.gap],
      marginBottom: spacing[agentSelectorSurface.header.marginBottom],
    },
    title: {
      flex: agentSelectorSurface.title.flex,
      minWidth: agentSelectorSurface.title.minWidth,
      fontSize: agentSelectorSurface.title.fontSize,
      fontWeight: agentSelectorSurface.title.fontWeight,
      lineHeight: agentSelectorSurface.title.lineHeight,
      color: agentSelectorColors.title.color,
    },
    headerCloseButton: {
      width: agentSelectorSurface.headerCloseButton.width,
      height: agentSelectorSurface.headerCloseButton.height,
      borderRadius: radius[agentSelectorSurface.headerCloseButton.borderRadius],
      alignItems: agentSelectorSurface.headerCloseButton.alignItems,
      justifyContent: agentSelectorSurface.headerCloseButton.justifyContent,
      paddingHorizontal: spacing[agentSelectorSurface.headerCloseButton.paddingHorizontal],
      paddingVertical: spacing[agentSelectorSurface.headerCloseButton.paddingVertical],
      marginRight: -spacing[agentSelectorSurface.headerCloseButton.negativeMarginRight],
    },
    list: {
      maxHeight: agentSelectorSurface.list.maxHeight,
    },
    profileItem: {
      flexDirection: agentSelectorSurface.profileItem.flexDirection,
      alignItems: agentSelectorSurface.profileItem.alignItems,
      justifyContent: agentSelectorSurface.profileItem.justifyContent,
      gap: spacing[agentSelectorSurface.profileItem.gap],
      paddingVertical: spacing[agentSelectorSurface.profileItem.paddingVertical],
      paddingHorizontal: spacing[agentSelectorSurface.profileItem.paddingHorizontal],
      borderRadius: radius[agentSelectorSurface.profileItem.borderRadius],
      marginBottom: spacing[agentSelectorSurface.profileItem.marginBottom],
    },
    profileItemSelected: {
      backgroundColor: agentSelectorColors.profileItem.selectedBackgroundColor,
    },
    profileAvatar: {
      width: agentSelectorSurface.avatar.size,
      height: agentSelectorSurface.avatar.size,
      borderRadius: radius[agentSelectorSurface.avatar.borderRadius],
      alignItems: agentSelectorSurface.avatar.alignItems,
      justifyContent: agentSelectorSurface.avatar.justifyContent,
      overflow: agentSelectorSurface.avatar.overflow,
      flexShrink: agentSelectorSurface.avatar.flexShrink,
    },
    profileAvatarImage: {
      width: agentSelectorSurface.avatarImage.width,
      height: agentSelectorSurface.avatarImage.height,
    },
    profileInfo: {
      flex: agentSelectorSurface.profileInfo.flex,
      minWidth: agentSelectorSurface.profileInfo.minWidth,
    },
    profileName: {
      fontSize: agentSelectorSurface.profileName.fontSize,
      fontWeight: agentSelectorSurface.profileName.fontWeight,
      color: agentSelectorColors.profileName.color,
    },
    profileNameSelected: {
      color: agentSelectorColors.profileName.selectedColor,
      fontWeight: agentSelectorSurface.profileName.selectedFontWeight,
    },
    profileDescription: {
      fontSize: agentSelectorSurface.profileDescription.fontSize,
      color: agentSelectorColors.profileDescription.color,
      marginTop: agentSelectorSurface.profileDescription.marginTop,
    },
    loadingContainer: {
      alignItems: agentSelectorSurface.loadingContainer.alignItems,
      paddingVertical: spacing[agentSelectorSurface.loadingContainer.paddingVertical],
      gap: spacing[agentSelectorSurface.loadingContainer.gap],
    },
    loadingText: {
      color: agentSelectorColors.loadingText.color,
    },
    errorContainer: {
      alignItems: agentSelectorSurface.errorContainer.alignItems,
      paddingVertical: spacing[agentSelectorSurface.errorContainer.paddingVertical],
      gap: spacing[agentSelectorSurface.errorContainer.gap],
    },
    errorText: {
      color: agentSelectorColors.errorText.color,
    },
    retryButton: {
      paddingHorizontal: spacing[agentSelectorSurface.retryButton.paddingHorizontal],
      paddingVertical: spacing[agentSelectorSurface.retryButton.paddingVertical],
    },
    retryButtonText: {
      color: agentSelectorColors.retryButtonText.color,
      fontWeight: agentSelectorSurface.retryButtonText.fontWeight,
    },
    emptyText: {
      textAlign: agentSelectorSurface.emptyText.textAlign,
      color: agentSelectorColors.emptyText.color,
      paddingVertical: spacing[agentSelectorSurface.emptyText.paddingVertical],
    },
  });
}
