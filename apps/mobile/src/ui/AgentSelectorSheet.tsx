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
  createAgentSelectorProfileItemMobilePropsParts,
  createAgentSelectorSheetMobilePropsParts,
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

  const agentSelectorSheetParts = createAgentSelectorSheetMobilePropsParts({
    visible,
    renderState: agentSelectorRenderState,
    styles,
    sheetBottomPadding: agentSelectorStyleSlots.sheet.paddingBottom,
    safeAreaBottom: insets.bottom,
    isLoading,
    error,
    hasProfiles: profiles.length > 0,
    onClose,
    onRetry: fetchProfiles,
  });

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
    const profileItemParts = createAgentSelectorProfileItemMobilePropsParts({
      profile: item,
      renderState: agentSelectorRenderState,
      profileRenderState: profileItemRenderState,
      styles,
      avatarImageSource: item.avatarDataUrl ? { uri: item.avatarDataUrl } : null,
      onPress: () => handleSelectProfile(item),
    });
    const profileItemContent = profileItemParts.touchable.content;
    const avatar = profileItemContent.avatar;
    const profileInfo = profileItemContent.profileInfo;
    const profileDescription = profileInfo.description;
    const checkIcon = profileItemContent.checkIcon;

    return (
      <TouchableOpacity
        {...profileItemParts.touchable.props}
      >
        <View {...avatar.props}>
          {avatar.image.shouldRender ? (
            <Image
              {...avatar.image.props}
            />
          ) : (
            <Ionicons
              {...avatar.fallbackIcon.props}
            />
          )}
        </View>
        <View {...profileInfo.props}>
          <Text {...profileInfo.name.props}>
            {profileInfo.name.text}
          </Text>
          {profileDescription.shouldRender ? (
            <Text {...profileDescription.props}>
              {profileDescription.text}
            </Text>
          ) : null}
        </View>
        {checkIcon.shouldRender ? (
          <Ionicons
            {...checkIcon.props}
          />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      {...agentSelectorSheetParts.modal.props}
    >
      <Pressable {...agentSelectorSheetParts.backdrop.props}>
        <View {...agentSelectorSheetParts.backdropSpacer.props} />
      </Pressable>
      <View {...agentSelectorSheetParts.sheet.props}>
        <View {...agentSelectorSheetParts.handle.props} />
        <View {...agentSelectorSheetParts.header.props}>
          <Text {...agentSelectorSheetParts.title.props}>
            {agentSelectorSheetParts.title.text}
          </Text>
          <TouchableOpacity {...agentSelectorSheetParts.closeButton.props}>
            <Ionicons
              {...agentSelectorSheetParts.closeButton.icon.props}
            />
          </TouchableOpacity>
        </View>

        {agentSelectorSheetParts.loading.shouldRender ? (
          <View {...agentSelectorSheetParts.loading.container.props}>
            <ActivityIndicator {...agentSelectorSheetParts.loading.indicator.props} />
            <Text {...agentSelectorSheetParts.loading.label.props}>
              {agentSelectorSheetParts.loading.label.text}
            </Text>
          </View>
        ) : agentSelectorSheetParts.error.shouldRender ? (
          <View {...agentSelectorSheetParts.error.container.props}>
            <Text {...agentSelectorSheetParts.error.message.props}>
              {agentSelectorSheetParts.error.message.text}
            </Text>
            <TouchableOpacity {...agentSelectorSheetParts.error.retryButton.props}>
              <Text {...agentSelectorSheetParts.error.retryLabel.props}>
                {agentSelectorSheetParts.error.retryLabel.text}
              </Text>
            </TouchableOpacity>
          </View>
        ) : agentSelectorSheetParts.empty.shouldRender ? (
          <Text {...agentSelectorSheetParts.empty.props}>
            {agentSelectorSheetParts.empty.text}
          </Text>
        ) : agentSelectorSheetParts.list.shouldRender ? (
          <FlatList
            data={profiles}
            renderItem={renderProfile}
            keyExtractor={(item) => item.id}
            {...agentSelectorSheetParts.list.props}
          />
        ) : null}
      </View>
    </Modal>
  );
}
