/**
 * AgentSelectorSheet - Modal/ActionSheet for selecting the active agent profile.
 * Used in ChatScreen and SessionListScreen headers to allow quick agent switching.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useChatRuntimeAgentSelectorSheetMobileStyleSlots,
  type ChatRuntimeAgentSelectorSheetMobileRenderState,
} from './ChatRuntimeMobileStyles';
import { useConfigContext } from '../store/config';
import { ExtendedSettingsApiClient, SettingsApiClient } from '../lib/settingsApi';
import { useProfile } from '../store/profile';
import {
  buildSelectorProfiles,
  createAgentSelectorProfileItemMobilePropsParts,
  createAgentSelectorSheetMobilePropsParts,
  getAgentSelectorMobileProfileItemRenderState,
  type AgentSelectorMobileStyleSheetSlots,
  type AgentSelectorProfileItemMobilePropsParts,
  type AgentSelectorSheetMobilePropsParts,
  type SelectableAgentProfile as SelectableProfile,
} from '@dotagents/shared/session-presentation';

interface AgentSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
}

type AgentSelectorSheetCloseHandler = () => void;
type AgentSelectorSheetRetryHandler = () => void | Promise<void>;
type AgentSelectorProfilePressHandler = () => void | Promise<void>;

type AgentSelectorAvatarImageSource = {
  uri: string;
};

type AgentSelectorSheetStyles = AgentSelectorMobileStyleSheetSlots;

type AgentSelectorSheetParts =
  AgentSelectorSheetMobilePropsParts<
    AgentSelectorSheetStyles,
    AgentSelectorSheetCloseHandler,
    AgentSelectorSheetRetryHandler
  >;

type AgentSelectorProfileItemParts =
  AgentSelectorProfileItemMobilePropsParts<
    AgentSelectorSheetStyles,
    AgentSelectorAvatarImageSource,
    AgentSelectorProfilePressHandler
  >;

interface AgentSelectorProfileRowProps {
  item: SelectableProfile;
  currentProfileId?: string;
  isSwitching: boolean;
  renderState: ChatRuntimeAgentSelectorSheetMobileRenderState;
  styles: AgentSelectorSheetStyles;
  onSelectProfile: (profile: SelectableProfile) => void | Promise<void>;
}

const AgentSelectorProfileRow = React.memo(function AgentSelectorProfileRow({
  item,
  currentProfileId,
  isSwitching,
  renderState,
  styles,
  onSelectProfile,
}: AgentSelectorProfileRowProps) {
  const profileItemRenderState = useMemo(
    () => getAgentSelectorMobileProfileItemRenderState({
      profile: item,
      currentProfileId,
      isSwitching,
    }),
    [currentProfileId, isSwitching, item],
  );
  const avatarImageSource = useMemo(
    () => (item.avatarDataUrl ? { uri: item.avatarDataUrl } : null),
    [item.avatarDataUrl],
  );
  const handlePress = useCallback(() => {
    void onSelectProfile(item);
  }, [item, onSelectProfile]);
  const profileItemParts = useMemo<AgentSelectorProfileItemParts>(
    () => createAgentSelectorProfileItemMobilePropsParts({
      profile: item,
      renderState,
      profileRenderState: profileItemRenderState,
      styles,
      avatarImageSource,
      onPress: handlePress,
    }),
    [avatarImageSource, handlePress, item, profileItemRenderState, renderState, styles],
  );
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
});

export function AgentSelectorSheet({ visible, onClose }: AgentSelectorSheetProps) {
  const insets = useSafeAreaInsets();
  const { config } = useConfigContext();
  const { currentProfile, setCurrentProfile } = useProfile();

  const [profiles, setProfiles] = useState<SelectableProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectorMode, setSelectorMode] = useState<'profile' | 'acpx'>('profile');
  const {
    agentSelectorRenderState,
    agentSelectorStyles: styles,
    agentSelectorSheetBottomPadding,
  } = useChatRuntimeAgentSelectorSheetMobileStyleSlots({
    selectorMode,
  });
  const agentSelectorCopy = agentSelectorRenderState.copy;
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
  }, [agentSelectorCopy.loadFailed, config.baseUrl, config.apiKey, hasApiConfig, missingConfigError]);

  useEffect(() => {
    if (visible) {
      fetchProfiles();
    }
  }, [visible, fetchProfiles]);

  const agentSelectorSheetParts = useMemo<AgentSelectorSheetParts>(
    () => createAgentSelectorSheetMobilePropsParts({
      visible,
      renderState: agentSelectorRenderState,
      styles,
      sheetBottomPadding: agentSelectorSheetBottomPadding,
      safeAreaBottom: insets.bottom,
      isLoading,
      error,
      hasProfiles: profiles.length > 0,
      onClose,
      onRetry: fetchProfiles,
    }),
    [
      agentSelectorRenderState,
      agentSelectorSheetBottomPadding,
      error,
      fetchProfiles,
      insets.bottom,
      isLoading,
      onClose,
      profiles.length,
      styles,
      visible,
    ],
  );

  const handleSelectProfile = useCallback(async (profile: SelectableProfile) => {
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
  }, [
    agentSelectorCopy.switchFailed,
    config.apiKey,
    config.baseUrl,
    currentProfile?.id,
    hasApiConfig,
    missingConfigError,
    onClose,
    setCurrentProfile,
  ]);

  const renderProfile = useCallback(({ item }: { item: SelectableProfile }) => (
    <AgentSelectorProfileRow
      item={item}
      currentProfileId={currentProfile?.id}
      isSwitching={isSwitching}
      renderState={agentSelectorRenderState}
      styles={styles}
      onSelectProfile={handleSelectProfile}
    />
  ), [
    agentSelectorRenderState,
    currentProfile?.id,
    handleSelectProfile,
    isSwitching,
    styles,
  ]);

  const keyExtractor = useCallback((item: SelectableProfile) => item.id, []);

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
            keyExtractor={keyExtractor}
            {...agentSelectorSheetParts.list.props}
          />
        ) : null}
      </View>
    </Modal>
  );
}
