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
import { useConfigContext } from '../store/config';
import { SettingsApiClient, Profile } from '../lib/settingsApi';
import { useProfile } from '../store/profile';

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
  const hasApiConfig = Boolean(config.baseUrl && config.apiKey);
  const missingConfigError = 'Configure server URL and API key to switch agents';

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const client = new SettingsApiClient(config.baseUrl, config.apiKey);
      const res = await client.getProfiles();
      setProfiles(res.profiles || []);
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

  const handleSelectProfile = async (profile: Profile) => {
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
      await client.setCurrentProfile(profile.id);
      setCurrentProfile(profile);
      onClose();
    } catch (err: any) {
      console.error('[AgentSelectorSheet] Failed to switch profile:', err);
      setError(err?.message || 'Failed to switch agent');
    } finally {
      setIsSwitching(false);
    }
  };

  const renderProfile = ({ item }: { item: Profile }) => {
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
        <Text style={styles.title}>Select Agent</Text>

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
          <Text style={styles.emptyText}>No agents available</Text>
        ) : (
          <FlatList
            data={profiles}
            renderItem={renderProfile}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Cancel</Text>
        </TouchableOpacity>
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
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.foreground,
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
    closeButton: {
      alignItems: 'center',
      paddingVertical: spacing.md,
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
