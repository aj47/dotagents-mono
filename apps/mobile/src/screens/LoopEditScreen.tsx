import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius } from '../ui/theme';
import {
  AgentProfile,
  ExtendedSettingsApiClient,
  Loop,
  LoopCreateRequest,
  LoopUpdateRequest,
} from '../lib/settingsApi';
import { useConfigContext } from '../store/config';
import { createButtonAccessibilityLabel, createMinimumTouchTargetStyle, createSwitchAccessibilityLabel } from '../lib/accessibility';

type LoopFormData = {
  name: string;
  prompt: string;
  intervalMinutes: string;
  enabled: boolean;
  profileId: string;
};

const defaultFormData: LoopFormData = {
  name: '',
  prompt: '',
  intervalMinutes: '60',
  enabled: true,
  profileId: '',
};

function formatLoopIntervalLabel(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 1) return 'Every minute';
  if (minutes === 1) return 'Every minute';
  if (minutes === 60) return 'Hourly';
  if (minutes === 1440) return 'Daily';
  if (minutes === 10080) return 'Weekly';
  if (minutes < 60) return `Every ${minutes} min`;

  if (minutes < 1440 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `Every ${hours} hr`;
  }

  if (minutes < 10080 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `Every ${days} day${days === 1 ? '' : 's'}`;
  }

  if (minutes % 10080 === 0) {
    const weeks = minutes / 10080;
    return `Every ${weeks} week${weeks === 1 ? '' : 's'}`;
  }

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;
  const parts = [
    days > 0 ? `${days}d` : null,
    hours > 0 ? `${hours}h` : null,
    remainingMinutes > 0 ? `${remainingMinutes}m` : null,
  ].filter(Boolean);

  return `Every ${parts.join(' ')}`;
}

function getLoopIntervalPreview(intervalInput: string): { text: string; isInvalid: boolean } {
  const trimmed = intervalInput.trim();

  if (!trimmed) {
    return { text: 'Examples: 60 = Hourly • 1440 = Daily', isInvalid: false };
  }

  if (!/^\d+$/.test(trimmed)) {
    return { text: 'Use whole minutes, like 60 for Hourly or 1440 for Daily.', isInvalid: true };
  }

  const minutes = Number(trimmed);
  if (!Number.isInteger(minutes) || minutes < 1) {
    return { text: 'Use a positive whole number of minutes.', isInvalid: true };
  }

  return { text: `Schedule: ${formatLoopIntervalLabel(minutes)}`, isInvalid: false };
}

export default function LoopEditScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { config } = useConfigContext();

  const loopFromRoute = route.params?.loop as Loop | undefined;
  const loopId = route.params?.loopId as string | undefined;
  const effectiveLoopId = loopId ?? loopFromRoute?.id;
  const isEditing = !!effectiveLoopId;

  const [formData, setFormData] = useState<LoopFormData>(() =>
    loopFromRoute
      ? {
        name: loopFromRoute.name,
        prompt: loopFromRoute.prompt,
        intervalMinutes: String(loopFromRoute.intervalMinutes),
        enabled: loopFromRoute.enabled,
        profileId: loopFromRoute.profileId || '',
      }
      : defaultFormData
  );
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing && !loopFromRoute);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const settingsClient = useMemo(() => {
    if (config.baseUrl && config.apiKey) {
      return new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
    }
    return null;
  }, [config.baseUrl, config.apiKey]);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Loop' : 'Create Loop' });
  }, [isEditing, navigation]);

  useEffect(() => {
    if (isEditing && !loopFromRoute && !settingsClient) {
      setIsLoading(false);
      setError('Configure Base URL and API key to load and save loops');
    }
  }, [isEditing, loopFromRoute, settingsClient]);

  useEffect(() => {
    if (!settingsClient) return;
    let cancelled = false;
    setProfileLoadError(null);
    setIsLoadingProfiles(true);
    settingsClient.getAgentProfiles()
      .then((res) => {
        if (!cancelled) {
          setProfiles(res.profiles);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setProfileLoadError(err.message || 'Failed to load agent profiles');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProfiles(false);
      });

    return () => { cancelled = true; };
  }, [settingsClient]);

  useEffect(() => {
    if (!isEditing || loopFromRoute || !settingsClient || !effectiveLoopId) {
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    settingsClient.getLoops()
      .then((res) => {
        if (cancelled) return;
        const loop = res.loops.find(l => l.id === effectiveLoopId);
        if (!loop) {
          setError('Loop not found');
          return;
        }
        setFormData({
          name: loop.name,
          prompt: loop.prompt,
          intervalMinutes: String(loop.intervalMinutes),
          enabled: loop.enabled,
          profileId: loop.profileId || '',
        });
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load loop');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [effectiveLoopId, isEditing, loopFromRoute, settingsClient]);

  const updateField = useCallback(<K extends keyof LoopFormData>(key: K, value: LoopFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const renderSwitchVisual = (enabled: boolean) => {
    if (Platform.OS === 'web') {
      return (
        <View
          style={[styles.switchTrack, enabled && styles.switchTrackActive]}
          accessible={false}
        >
          <View
            style={[styles.switchThumb, enabled && styles.switchThumbActive]}
            accessible={false}
          />
        </View>
      );
    }

    return (
      <Switch
        accessible={false}
        value={enabled}
        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
        thumbColor={enabled ? theme.colors.primaryForeground : theme.colors.background}
      />
    );
  };

  const handleSave = useCallback(async () => {
    if (!settingsClient) {
      setError('Configure Base URL and API key in Settings before saving');
      return;
    }

    const name = formData.name.trim();
    const prompt = formData.prompt.trim();
    const intervalInput = formData.intervalMinutes.trim();
    const intervalMinutes = Number(intervalInput);
    if (!name || !prompt) {
      setError('Name and prompt are required');
      return;
    }
    if (!/^\d+$/.test(intervalInput) || !Number.isInteger(intervalMinutes) || intervalMinutes < 1) {
      setError('Interval must be a positive whole number of minutes');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (isEditing && effectiveLoopId) {
        const updatePayload: LoopUpdateRequest = {
          name,
          prompt,
          intervalMinutes,
          enabled: formData.enabled,
          profileId: formData.profileId || undefined,
        };
        await settingsClient.updateLoop(effectiveLoopId, updatePayload);
      } else {
        const createPayload: LoopCreateRequest = {
          name,
          prompt,
          intervalMinutes,
          enabled: formData.enabled,
          profileId: formData.profileId || undefined,
        };
        await settingsClient.createLoop(createPayload);
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to save loop');
    } finally {
      setIsSaving(false);
    }
  }, [effectiveLoopId, formData, isEditing, navigation, settingsClient]);

  const trimmedName = formData.name.trim();
  const trimmedPrompt = formData.prompt.trim();
  const trimmedIntervalMinutes = formData.intervalMinutes.trim();
  const intervalPreview = getLoopIntervalPreview(formData.intervalMinutes);
  const showProfileLoadErrorHelper = !!settingsClient && !isLoadingProfiles && !!profileLoadError;
  const showNoProfileSelectedHelper = !!settingsClient && !isLoadingProfiles && !profileLoadError && profiles.length > 0 && !formData.profileId;
  const showNoSavedProfilesHelper = !!settingsClient && !isLoadingProfiles && !profileLoadError && profiles.length === 0;
  const saveValidationMessage = !trimmedName && !trimmedPrompt
    ? 'Add a name and prompt to enable saving.'
    : !trimmedName
      ? 'Add a name to enable saving.'
      : !trimmedPrompt
        ? 'Add a prompt to enable saving.'
        : !trimmedIntervalMinutes || intervalPreview.isInvalid
          ? 'Enter a valid interval in whole minutes to enable saving.'
          : null;
  const isSaveDisabled = isSaving || !settingsClient || !!saveValidationMessage;
  const saveButtonAccessibilityLabel = createButtonAccessibilityLabel(isEditing ? 'Save loop changes' : 'Create loop');
  const saveButtonAccessibilityHint = !settingsClient
    ? 'Configure Base URL and API key in Settings before saving this loop.'
    : isSaving
      ? 'Saving this loop now.'
      : saveValidationMessage
        ? saveValidationMessage
      : isEditing
        ? 'Saves your changes to this loop.'
        : 'Creates this loop with the current settings.';

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading loop...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      {error && <Text style={styles.errorText}>⚠️ {error}</Text>}
      {!settingsClient && <Text style={styles.helperText}>Configure Base URL and API key in Settings to save changes.</Text>}

      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={v => updateField('name', v)}
        placeholder="Daily review"
        placeholderTextColor={theme.colors.mutedForeground}
      />

      <Text style={styles.label}>Prompt *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.prompt}
        onChangeText={v => updateField('prompt', v)}
        placeholder="Summarize the latest updates and notify me"
        placeholderTextColor={theme.colors.mutedForeground}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Interval (minutes) *</Text>
      <TextInput
        style={styles.input}
        value={formData.intervalMinutes}
        onChangeText={v => updateField('intervalMinutes', v)}
        placeholder="60"
        placeholderTextColor={theme.colors.mutedForeground}
        keyboardType="numeric"
      />
      <Text style={[styles.intervalHelperText, intervalPreview.isInvalid && styles.intervalHelperTextWarning]}>
        {intervalPreview.text}
      </Text>

      <View style={styles.switchRow}>
        <View style={styles.switchLabelGroup}>
          <Text style={styles.switchLabel}>Enabled</Text>
          <Text style={styles.switchHelperText}>Pause or resume this loop&apos;s schedule without deleting it</Text>
        </View>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => updateField('enabled', !formData.enabled)}
          accessibilityRole="switch"
          accessibilityLabel={createSwitchAccessibilityLabel('Loop enabled')}
          accessibilityHint="Pauses or resumes this loop&apos;s schedule without deleting it."
          accessibilityState={{ checked: formData.enabled }}
          activeOpacity={0.7}
        >
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {renderSwitchVisual(formData.enabled)}
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Agent Profile (optional)</Text>
      <View style={styles.profileOptions}>
        <TouchableOpacity
          style={[styles.profileOption, !formData.profileId && styles.profileOptionActive]}
          onPress={() => updateField('profileId', '')}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel('Select no profile')}
          accessibilityHint="Keeps this loop unassigned so it runs without a specific saved profile."
          accessibilityState={{ selected: !formData.profileId }}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.profileOptionText, !formData.profileId && styles.profileOptionTextActive]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            No profile
          </Text>
        </TouchableOpacity>
        {profiles.map(profile => (
          <TouchableOpacity
            key={profile.id}
            style={[styles.profileOption, formData.profileId === profile.id && styles.profileOptionActive]}
            onPress={() => updateField('profileId', profile.id)}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel(`Use ${profile.displayName} profile`)}
            accessibilityHint="Assigns this loop to run with the selected saved profile."
            accessibilityState={{ selected: formData.profileId === profile.id }}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.profileOptionText, formData.profileId === profile.id && styles.profileOptionTextActive]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {profile.displayName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoadingProfiles && <Text style={styles.helperText}>Loading profiles...</Text>}
      {showProfileLoadErrorHelper && (
        <Text style={[styles.helperText, styles.helperTextWarning]}>
          Saved profiles couldn't load right now. You can still save this loop with No profile.
        </Text>
      )}
      {showNoProfileSelectedHelper && (
        <Text style={styles.helperText}>No profile selected. This loop will run without a saved profile until you choose one.</Text>
      )}
      {showNoSavedProfilesHelper && (
        <Text style={styles.helperText}>No saved profiles yet. Create one in Settings → Agents to assign it here.</Text>
      )}

      {settingsClient && saveValidationMessage && (
        <Text style={styles.saveHelperText}>{saveValidationMessage}</Text>
      )}

      <TouchableOpacity
        style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaveDisabled}
        accessibilityRole="button"
        accessibilityLabel={saveButtonAccessibilityLabel}
        accessibilityHint={saveButtonAccessibilityHint}
        accessibilityState={{ disabled: isSaveDisabled, busy: isSaving }}
      >
        {isSaving ? <ActivityIndicator color={theme.colors.primaryForeground} size="small" /> : <Text style={styles.saveButtonText}>{isEditing ? 'Save Loop' : 'Create Loop'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const selectionChipTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: spacing.md,
    verticalPadding: spacing.xs,
    horizontalMargin: 0,
  });

  const switchTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: spacing.xs,
    verticalPadding: spacing.xs,
    horizontalMargin: 0,
  });

  return StyleSheet.create({
    container: { padding: spacing.lg },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: spacing.md, color: theme.colors.mutedForeground, fontSize: 14 },
    errorText: { color: theme.colors.destructive, marginBottom: spacing.sm },
    label: { fontSize: 14, fontWeight: '500', color: theme.colors.foreground, marginBottom: spacing.xs, marginTop: spacing.md },
    helperText: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: spacing.xs },
    helperTextWarning: { color: theme.colors.destructive, lineHeight: 17 },
    saveHelperText: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: spacing.md },
    intervalHelperText: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: spacing.xs, lineHeight: 17 },
    intervalHelperTextWarning: { color: theme.colors.destructive },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: theme.colors.foreground, backgroundColor: theme.colors.background },
    textArea: { minHeight: 110 },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    switchLabelGroup: { flex: 1, minWidth: 0 },
    switchLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.foreground },
    switchHelperText: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: 2 },
    switchButton: {
      ...switchTouchTarget,
      borderRadius: radius.full,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    switchTrack: {
      width: 36,
      height: 20,
      borderRadius: radius.full,
      padding: 2,
      justifyContent: 'center',
      backgroundColor: theme.colors.muted,
    },
    switchTrackActive: { backgroundColor: theme.colors.primary },
    switchThumb: {
      width: 16,
      height: 16,
      borderRadius: radius.full,
      backgroundColor: theme.colors.background,
      transform: [{ translateX: 0 }],
    },
    switchThumbActive: {
      backgroundColor: theme.colors.primaryForeground,
      transform: [{ translateX: 16 }],
    },
    profileOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'flex-start' },
    profileOption: {
      ...selectionChipTouchTarget,
      maxWidth: '100%',
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
    },
    profileOptionActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    profileOptionText: { color: theme.colors.foreground, fontSize: 13, maxWidth: '100%', flexShrink: 1 },
    profileOptionTextActive: { color: theme.colors.primaryForeground, fontWeight: '600' },
    saveButton: { marginTop: spacing.xl, backgroundColor: theme.colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: theme.colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  });
}
