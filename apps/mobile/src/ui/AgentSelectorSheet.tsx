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
  createAgentSelectorMobileStyleSlots,
  getAgentSelectorMobileProfileItemRenderState,
  getAgentSelectorMobileRenderState,
  type SelectableAgentProfile as SelectableProfile,
} from '@dotagents/shared/session-presentation';

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
  const agentSelectorStyleSlots = React.useMemo(
    () => createAgentSelectorMobileStyleSlots({
      renderState: agentSelectorRenderState,
      spacing,
      radius,
    }),
    [agentSelectorRenderState],
  );
  const styles = React.useMemo(
    () => StyleSheet.create({
      backdrop: {
        ...agentSelectorStyleSlots.backdrop,
      },
      backdropSpacer: {
        ...agentSelectorStyleSlots.backdropSpacer,
      },
      sheet: {
        ...agentSelectorStyleSlots.sheet,
      },
      handle: {
        ...agentSelectorStyleSlots.handle,
      },
      header: {
        ...agentSelectorStyleSlots.header,
      },
      title: {
        ...agentSelectorStyleSlots.title,
      },
      headerCloseButton: {
        ...agentSelectorStyleSlots.headerCloseButton,
      },
      list: {
        ...agentSelectorStyleSlots.list,
      },
      profileItem: {
        ...agentSelectorStyleSlots.profileItem,
      },
      profileItemSelected: {
        ...agentSelectorStyleSlots.profileItemSelected,
      },
      profileAvatar: {
        ...agentSelectorStyleSlots.profileAvatar,
      },
      profileAvatarImage: {
        ...agentSelectorStyleSlots.profileAvatarImage,
      },
      profileInfo: {
        ...agentSelectorStyleSlots.profileInfo,
      },
      profileName: {
        ...agentSelectorStyleSlots.profileName,
      },
      profileNameSelected: {
        ...agentSelectorStyleSlots.profileNameSelected,
      },
      profileDescription: {
        ...agentSelectorStyleSlots.profileDescription,
      },
      loadingContainer: {
        ...agentSelectorStyleSlots.loadingContainer,
      },
      loadingText: {
        ...agentSelectorStyleSlots.loadingText,
      },
      errorContainer: {
        ...agentSelectorStyleSlots.errorContainer,
      },
      errorText: {
        ...agentSelectorStyleSlots.errorText,
      },
      retryButton: {
        ...agentSelectorStyleSlots.retryButton,
      },
      retryButtonText: {
        ...agentSelectorStyleSlots.retryButtonText,
      },
      emptyText: {
        ...agentSelectorStyleSlots.emptyText,
      },
    }),
    [agentSelectorStyleSlots],
  );
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
    const profileItemRenderState = getAgentSelectorMobileProfileItemRenderState({
      profile: item,
      currentProfileId: currentProfile?.id,
      isSwitching,
    });
    return (
      <TouchableOpacity
        style={[styles.profileItem, profileItemRenderState.isSelected && styles.profileItemSelected]}
        onPress={() => handleSelectProfile(item)}
        disabled={profileItemRenderState.isDisabled}
        activeOpacity={profileItemRenderState.activeOpacity}
        accessibilityRole={profileItemRenderState.accessibilityRole}
        accessibilityLabel={profileItemRenderState.accessibilityLabel}
        accessibilityState={profileItemRenderState.accessibilityState}
      >
        <View
          style={[
            styles.profileAvatar,
            !item.avatarDataUrl && {
              backgroundColor: profileItemRenderState.fallbackAvatar.backgroundColor,
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
            style={[styles.profileName, profileItemRenderState.isSelected && styles.profileNameSelected]}
            numberOfLines={agentSelectorSurface.profileName.numberOfLines}
          >
            {item.name}
          </Text>
          {profileItemRenderState.shouldRenderProfileSummary && (
            <Text
              style={styles.profileDescription}
              numberOfLines={agentSelectorSurface.profileDescription.numberOfLines}
            >
              {profileItemRenderState.profileSummary}
            </Text>
          )}
        </View>
        {profileItemRenderState.isSelected && (
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
      <View style={[styles.sheet, { paddingBottom: insets.bottom + agentSelectorStyleSlots.sheet.paddingBottom }]}>
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
