/**
 * AgentSelectorSheet - Modal/ActionSheet for selecting the active agent profile.
 * Used in ChatScreen and SessionListScreen headers to allow quick agent switching.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
    ? 'No enabled ACP agents are available yet. Add or enable one in Settings → Agents to use it as your main agent.'
    : 'No switchable chat profiles were returned for this server. Manage delegation agents in Settings → Agents.';

  const handleOpenAgentSettings = () => {
    onClose();
    navigation.navigate('Settings');
  };

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
    }
  };

  const renderProfile = ({ item }: { item: SelectableProfile }) => {
    const isSelected = currentProfile?.id === item.id;
    const secondaryDescription = item.guidelines && item.guidelines !== 'ACP main agent'
      ? item.guidelines
      : null;
    return (
      <TouchableOpacity
        style={[styles.profileItem, isSelected && styles.profileItemSelected]}
        onPress={() => handleSelectProfile(item)}
        disabled={isSwitching}
        accessibilityRole="button"
        accessibilityLabel={`Select ${item.name} agent`}
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.profileInfo}>
          <Text
            style={[styles.profileName, isSelected && styles.profileNameSelected]}
            numberOfLines={1}
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
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
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
        <View style={{ flex: 1 }} />
      </Pressable>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{selectorMode === 'acp' ? 'Select Main Agent' : 'Select Agent'}</Text>
        <Text style={styles.subtitle}>
          {selectorMode === 'acp'
            ? 'Choose which enabled ACP agent should act as the main agent for new chats.'
            : 'Switch between saved chat profiles. Delegation agents stay available from Settings → Agents.'}
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading agents...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
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
              <Text style={styles.currentAgentBadgeText}>Current: {currentAgentName}</Text>
            </View>
            <Text style={styles.emptyStateTitle}>
              {selectorMode === 'acp' ? 'No ACP agents ready yet' : 'No switchable agents yet'}
            </Text>
            <Text style={styles.emptyText}>{emptyStateMessage}</Text>
            <TouchableOpacity
              style={styles.manageAgentsButton}
              onPress={handleOpenAgentSettings}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Open agent settings')}
              accessibilityHint="Returns to Settings so you can review agents and agent mode."
            >
              <Text style={styles.manageAgentsButtonText}>Open Agent Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={profiles}
            renderItem={renderProfile}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel('Close agent selector')}
          accessibilityHint="Dismisses this sheet and returns to the current screen."
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>Cancel</Text>
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg,
      marginBottom: spacing.xs,
    },
    profileItemSelected: {
      backgroundColor: theme.colors.primary + '20',
    },
    profileInfo: {
      flex: 1,
      minWidth: 0,
      marginRight: spacing.sm,
    },
    profileName: {
      fontSize: 16,
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
    checkmark: {
      fontSize: 18,
      color: theme.colors.primary,
      fontWeight: '600',
      flexShrink: 0,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    loadingText: {
      marginTop: spacing.sm,
      color: theme.colors.mutedForeground,
    },
    errorContainer: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    errorText: {
      color: theme.colors.destructive,
      marginBottom: spacing.sm,
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
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: theme.colors.primary + '33',
    },
    currentAgentBadgeText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    manageAgentsButton: {
      minHeight: 44,
      minWidth: 180,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: theme.colors.primary + '14',
      alignItems: 'center',
      justifyContent: 'center',
    },
    manageAgentsButtonText: {
      color: theme.colors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    closeButton: {
      ...actionButtonTouchTarget,
      width: '100%',
      alignItems: 'center',
      marginTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    closeButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
  });
}
