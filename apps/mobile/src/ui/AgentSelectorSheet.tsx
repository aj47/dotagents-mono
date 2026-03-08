/**
 * AgentSelectorSheet - Modal/ActionSheet for selecting the active agent profile.
 * Used in ChatScreen and SessionListScreen headers to allow quick agent switching.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeProvider';
import { spacing, radius, Theme } from './theme';
import { createButtonAccessibilityLabel, createMinimumTouchTargetStyle } from '../lib/accessibility';
import { useConfigContext } from '../store/config';
import { ExtendedSettingsApiClient, SettingsApiClient, Profile } from '../lib/settingsApi';
import { useProfile } from '../store/profile';
import { getAcpMainAgentOptions, toMainAgentProfile } from '../lib/mainAgentOptions';

interface SelectableProfile extends Profile {
  selectorMode?: 'profile' | 'acp';
  selectionValue?: string;
}

interface AgentSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AgentSelectorSheet({ visible, onClose }: AgentSelectorSheetProps) {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { config } = useConfigContext();
  const { currentProfile, setCurrentProfile, refresh } = useProfile();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const hasApiConfig = Boolean(config.baseUrl && config.apiKey);
  const missingConfigError = 'Configure server URL and API key in Settings to switch agents.';

  const [profiles, setProfiles] = useState<SelectableProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const [pendingProfileName, setPendingProfileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectorMode, setSelectorMode] = useState<'profile' | 'acp'>('profile');

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
      const settings = await client.getSettings();

      if (settings.mainAgentMode === 'acp') {
        setSelectorMode('acp');
        const agentProfilesResponse = await client.getAgentProfiles().catch(() => ({ profiles: [] }));
        const mainAgentOptions = getAcpMainAgentOptions(settings, agentProfilesResponse.profiles || []);
        setProfiles(mainAgentOptions.map((option) => ({
          ...toMainAgentProfile(option),
          selectorMode: 'acp',
          selectionValue: option.name,
        })));
      } else {
        setSelectorMode('profile');
        const res = await client.getProfiles();
        setProfiles((res.profiles || []).map((profile) => ({
          ...profile,
          selectorMode: 'profile',
          selectionValue: profile.id,
        })));
      }
    } catch (err: any) {
      console.warn('[AgentSelectorSheet] Failed to fetch profiles:', err);
      setError(err?.message || 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  }, [config.baseUrl, config.apiKey, hasApiConfig, missingConfigError]);

  useEffect(() => {
    if (visible) {
      void Promise.all([refresh(), fetchProfiles()]);
    }
  }, [visible, fetchProfiles, refresh]);

  const currentAgentName = currentProfile?.name || (selectorMode === 'acp' ? 'Main Agent' : 'Default Agent');
  const isMissingConfigError = error === missingConfigError;
  const emptyStateMessage = selectorMode === 'acp'
    ? 'No enabled command-based agents are available yet. Add or enable an ACP or Stdio agent in Settings → Agents to use it as your main agent.'
    : 'No switchable chat profiles were returned for this server. Manage delegation agents in Settings → Agents.';
  const errorSupportText = isMissingConfigError
    ? 'Your current agent stays active. Open Settings to finish connecting this server and review agent mode.'
    : 'Your current agent stays active while you retry loading the available options.';

  const handleOpenAgentSettings = () => {
    onClose();
    navigation.navigate('Settings');
  };

  const handleDismiss = useCallback(() => {
    if (isSwitching) return;
    onClose();
  }, [isSwitching, onClose]);

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

    setError(null);
    setPendingProfileId(profile.id);
    setPendingProfileName(profile.name);
    setIsSwitching(true);
    try {
      const client = new SettingsApiClient(config.baseUrl, config.apiKey);
      if (profile.selectorMode === 'acp' && profile.selectionValue) {
        await client.updateSettings({ mainAgentName: profile.selectionValue });
        setCurrentProfile(toMainAgentProfile({ name: profile.selectionValue, displayName: profile.name }));
      } else {
        await client.setCurrentProfile(profile.id);
        setCurrentProfile(profile);
      }
      onClose();
    } catch (err: any) {
      console.error('[AgentSelectorSheet] Failed to switch profile:', err);
      setError(err?.message || 'Failed to switch agent');
    } finally {
      setIsSwitching(false);
      setPendingProfileId(null);
      setPendingProfileName(null);
    }
  };

  const switchingMessage = pendingProfileName
    ? `Switching to ${pendingProfileName}…`
    : 'Switching agents…';

  const orderedProfiles = useMemo(() => {
    if (profiles.length <= 1) return profiles;
    const currentProfileId = currentProfile?.id;
    if (!currentProfileId) return profiles;

    const currentProfileIndex = profiles.findIndex(profile => profile.id === currentProfileId);
    if (currentProfileIndex <= 0) return profiles;

    const reorderedProfiles = profiles.slice();
    const [currentProfileOption] = reorderedProfiles.splice(currentProfileIndex, 1);

    return currentProfileOption ? [currentProfileOption, ...reorderedProfiles] : profiles;
  }, [profiles, currentProfile?.id]);

  const renderProfile = ({ item }: { item: SelectableProfile }) => {
    const isSelected = currentProfile?.id === item.id;
    const isPending = pendingProfileId === item.id;
    const isBlockedBySwitch = isSwitching && !isPending && !isSelected;
    const secondaryDescription = item.guidelines && item.guidelines !== 'ACP main agent'
      ? item.guidelines
      : null;
    const selectionAccessibilityLabel = isPending
      ? `Switching to ${item.name} agent`
      : isSelected
        ? `Current ${item.name} agent`
        : `Select ${item.name} agent`;
    const selectionAccessibilityHint = isPending
      ? 'Agent switch in progress. Wait for the current request to finish.'
      : isSwitching
        ? 'Another agent switch is in progress. Wait for it to finish before changing this selection.'
      : isSelected
        ? 'Currently selected. Double tap to close this selector and keep this agent.'
        : 'Switches the current agent to this option.';

    return (
      <TouchableOpacity
        style={[
          styles.profileItem,
          isSelected && styles.profileItemSelected,
          isPending && styles.profileItemPending,
          isBlockedBySwitch && styles.profileItemBlocked,
        ]}
        onPress={() => handleSelectProfile(item)}
        disabled={isSwitching}
        accessibilityRole="button"
        accessibilityLabel={selectionAccessibilityLabel}
        accessibilityHint={selectionAccessibilityHint}
        accessibilityState={{ selected: isSelected, disabled: isSwitching, busy: isPending }}
      >
        <View style={styles.profileInfo}>
          <Text
            style={[styles.profileName, isSelected && styles.profileNameSelected]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          {secondaryDescription && (
            <Text style={styles.profileDescription} numberOfLines={1} ellipsizeMode="tail">
              {secondaryDescription}
            </Text>
          )}
        </View>
        {isPending ? (
          <View style={styles.profilePendingBadge}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.profilePendingBadgeText}>Switching…</Text>
          </View>
        ) : isSelected && (
          <View style={styles.profileCurrentBadge}>
            <Text style={styles.profileCurrentBadgeText}>Current</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={handleDismiss} disabled={isSwitching}>
        <View style={{ flex: 1 }} />
      </Pressable>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{selectorMode === 'acp' ? 'Select Main Agent' : 'Select Agent'}</Text>
        <Text style={styles.subtitle}>
          {selectorMode === 'acp'
            ? 'Choose which enabled command-based agent should act as the main agent for new chats.'
            : 'Switch between saved chat profiles. Delegation agents stay available from Settings → Agents.'}
        </Text>

        {isSwitching && (
          <View style={styles.switchingStatus}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.switchingStatusText}>{switchingMessage}</Text>
          </View>
        )}

        {isLoading ? (
          <View
            style={styles.loadingStateCard}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Loading available agents"
            accessibilityHint="Your current agent stays active while the available agent options load."
            accessibilityState={{ busy: true }}
          >
            <View style={styles.currentAgentBadge}>
              <Text style={styles.currentAgentBadgeLabel}>Current agent</Text>
              <Text
                style={styles.currentAgentBadgeText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {currentAgentName}
              </Text>
            </View>
            <View style={styles.loadingStatusRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingStatusText}>Loading available agents…</Text>
            </View>
            <Text style={styles.loadingText}>Your current agent stays active while options load.</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={styles.currentAgentBadge}>
              <Text style={styles.currentAgentBadgeLabel}>Current agent</Text>
              <Text
                style={styles.currentAgentBadgeText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {currentAgentName}
              </Text>
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSupportText}>{errorSupportText}</Text>
            {isMissingConfigError ? (
              <TouchableOpacity
                style={styles.manageAgentsButton}
                onPress={handleOpenAgentSettings}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Open agent settings')}
                accessibilityHint="Returns to Settings so you can add server details and review agent mode."
                activeOpacity={0.7}
              >
                <Text style={styles.manageAgentsButtonText}>Open Agent Settings</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchProfiles}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Retry loading agents')}
                accessibilityHint="Attempts to load the available agents again."
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : profiles.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <View style={styles.currentAgentBadge}>
              <Text style={styles.currentAgentBadgeLabel}>Current agent</Text>
              <Text
                style={styles.currentAgentBadgeText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {currentAgentName}
              </Text>
            </View>
            <Text style={styles.emptyStateTitle}>
              {selectorMode === 'acp' ? 'No main agents ready yet' : 'No switchable agents yet'}
            </Text>
            <Text style={styles.emptyText}>{emptyStateMessage}</Text>
            <TouchableOpacity
              style={styles.manageAgentsButton}
              onPress={handleOpenAgentSettings}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Open agent settings')}
              accessibilityHint="Returns to Settings so you can review agents and agent mode."
              activeOpacity={0.7}
            >
              <Text style={styles.manageAgentsButtonText}>Open Agent Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orderedProfiles}
            renderItem={renderProfile}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity
          style={[styles.closeButton, isSwitching && styles.closeButtonDisabled]}
          onPress={handleDismiss}
          disabled={isSwitching}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel('Close agent selector')}
          accessibilityHint={isSwitching
            ? 'Wait for the current agent switch to finish before dismissing this sheet.'
            : 'Dismisses this sheet and returns to the current screen.'}
          accessibilityState={{ disabled: isSwitching }}
          activeOpacity={isSwitching ? 1 : 0.7}
        >
          <Text style={[styles.closeButtonText, isSwitching && styles.closeButtonTextDisabled]}>
            {isSwitching ? 'Switching…' : 'Cancel'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  const actionButtonTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: spacing.lg,
    verticalPadding: spacing.sm,
    horizontalMargin: 0,
  });

  const profileItemTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: spacing.sm,
    verticalPadding: spacing.md,
    horizontalMargin: 0,
  });

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    sheet: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      maxHeight: '60%',
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.foreground,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.mutedForeground,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    list: {
      maxHeight: 300,
    },
    profileItem: {
      ...profileItemTouchTarget,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: radius.lg,
      marginBottom: spacing.xs,
    },
    profileItemSelected: {
      backgroundColor: theme.colors.primary + '20',
      borderWidth: 1,
      borderColor: theme.colors.primary + '33',
    },
    profileItemPending: {
      backgroundColor: theme.colors.primary + '12',
      borderWidth: 1,
      borderColor: theme.colors.primary + '2E',
    },
    profileItemBlocked: {
      opacity: 0.6,
    },
    profileInfo: {
      flex: 1,
      minWidth: 0,
      marginRight: spacing.sm,
    },
    profileName: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '500',
      color: theme.colors.foreground,
      flexShrink: 1,
    },
    profileNameSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    profileDescription: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: 2,
      flexShrink: 1,
    },
    profileCurrentBadge: {
      alignSelf: 'flex-start',
      flexShrink: 0,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: theme.colors.primary + '16',
      borderWidth: 1,
      borderColor: theme.colors.primary + '33',
    },
    profileCurrentBadgeText: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '700',
      flexShrink: 0,
    },
    profilePendingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      flexShrink: 0,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: theme.colors.primary + '12',
      borderWidth: 1,
      borderColor: theme.colors.primary + '2E',
    },
    profilePendingBadgeText: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '700',
      flexShrink: 0,
    },
    loadingStateCard: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.sm,
      gap: spacing.sm,
    },
    loadingStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    loadingStatusText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    switchingStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.primary + '22',
      backgroundColor: theme.colors.primary + '10',
    },
    switchingStatusText: {
      marginLeft: spacing.sm,
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: '500',
      textAlign: 'center',
      flexShrink: 1,
    },
    loadingText: {
      color: theme.colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorContainer: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.sm,
      gap: spacing.sm,
    },
    errorText: {
      color: theme.colors.destructive,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorSupportText: {
      color: theme.colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
    },
    retryButton: {
      ...actionButtonTouchTarget,
    },
    retryButtonText: {
      color: theme.colors.primary,
      fontWeight: '500',
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.mutedForeground,
      lineHeight: 20,
    },
    emptyStateCard: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.sm,
      gap: spacing.sm,
    },
    emptyStateTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.foreground,
      textAlign: 'center',
    },
    currentAgentBadge: {
      backgroundColor: theme.colors.primary + '18',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.primary + '33',
      maxWidth: '100%',
      alignItems: 'center',
      gap: 2,
    },
    currentAgentBadgeLabel: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '700',
    },
    currentAgentBadgeText: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      maxWidth: '100%',
      flexShrink: 1,
    },
    manageAgentsButton: {
      ...actionButtonTouchTarget,
      alignSelf: 'stretch',
      borderRadius: radius.lg,
      backgroundColor: theme.colors.primary + '14',
      alignItems: 'center',
      justifyContent: 'center',
    },
    manageAgentsButtonText: {
      color: theme.colors.primary,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },
    closeButton: {
      ...actionButtonTouchTarget,
      width: '100%',
      alignItems: 'center',
      marginTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    closeButtonDisabled: {
      opacity: 0.75,
    },
    closeButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
    closeButtonTextDisabled: {
      color: theme.colors.mutedForeground,
    },
  });
}
