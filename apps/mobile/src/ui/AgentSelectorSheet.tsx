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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeProvider';
import { spacing, radius, Theme } from './theme';
import { hasConfiguredConnection, useConfigContext } from '../store/config';
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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { config } = useConfigContext();
  const { currentProfile, setCurrentProfile, refresh } = useProfile();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const hasApiConfig = hasConfiguredConnection(config);
  const missingConfigError = 'Configure server URL and API key to switch agents';

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
          <Text style={[styles.profileName, isSelected && styles.profileNameSelected]}>
            {item.name}
          </Text>
          {item.guidelines && (
            <Text style={styles.profileDescription} numberOfLines={1}>
              {item.guidelines}
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
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {selectorMode === 'acp' ? 'Select Main Agent' : 'Select Agent'}
          </Text>
          <TouchableOpacity
            style={styles.headerCloseButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close agent selector"
          >
            <Text style={styles.headerCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading agents...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchProfiles}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : profiles.length === 0 ? (
          <Text style={styles.emptyText}>
            {selectorMode === 'acp' ? 'No ACP agents available' : 'No agents available'}
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

function createStyles(theme: Theme) {
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
      marginBottom: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 22,
      color: theme.colors.foreground,
    },
    headerCloseButton: {
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      marginRight: -spacing.xs,
    },
    headerCloseButtonText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
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
      marginRight: spacing.sm,
    },
    profileName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.foreground,
    },
    profileNameSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    profileDescription: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    checkmark: {
      fontSize: 18,
      color: theme.colors.primary,
      fontWeight: '600',
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
    },
    retryButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    retryButtonText: {
      color: theme.colors.primary,
      fontWeight: '500',
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.mutedForeground,
      paddingVertical: spacing.lg,
    },
  });
}
