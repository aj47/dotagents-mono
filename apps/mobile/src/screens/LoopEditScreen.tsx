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
  KeyboardAvoidingView,
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
import { createButtonAccessibilityLabel, createMinimumTouchTargetStyle } from '../lib/accessibility';
import { useConfigContext } from '../store/config';
import { useTunnelConnection } from '../store/tunnelConnection';

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

export default function LoopEditScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { config } = useConfigContext();
  const { connectionInfo } = useTunnelConnection();
  const isDotAgentsConnected = connectionInfo.state === 'connected';

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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const settingsClient = useMemo(() => {
    if (isDotAgentsConnected && config.baseUrl && config.apiKey) {
      return new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
    }
    return null;
  }, [config.baseUrl, config.apiKey, isDotAgentsConnected]);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Loop' : 'Create Loop' });
  }, [isEditing, navigation]);

  useEffect(() => {
    if (isEditing && !loopFromRoute && !settingsClient) {
      setIsLoading(false);
      setError('Connect to a DotAgents server in Settings to load and save loops');
    }
  }, [isEditing, loopFromRoute, settingsClient]);

  useEffect(() => {
    if (!settingsClient) return;
    let cancelled = false;
    setIsLoadingProfiles(true);
    settingsClient.getAgentProfiles()
      .then((res) => {
        if (!cancelled) {
          setProfiles(res.profiles);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load agent profiles');
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

  const handleSave = useCallback(async () => {
    if (!settingsClient) {
      setError('Connect to a DotAgents server in Settings before saving');
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

  const isSaveDisabled = isSaving || !settingsClient;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading loop...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!settingsClient && <Text style={styles.helperText}>Connect to a DotAgents server in Settings to save changes.</Text>}

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

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enabled</Text>
        <Switch
          value={formData.enabled}
          onValueChange={value => updateField('enabled', value)}
          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
          thumbColor={formData.enabled ? theme.colors.primaryForeground : theme.colors.background}
        />
      </View>

      <Text style={styles.label}>Agent Profile (optional)</Text>
      <Text style={styles.sectionHelperText}>Choose a dedicated agent for this loop, or leave it on the default agent.</Text>
      <View style={styles.profileOptions}>
        <TouchableOpacity
          style={[styles.profileOption, !formData.profileId && styles.profileOptionActive]}
          onPress={() => updateField('profileId', '')}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel('Use the default agent for this loop')}
          accessibilityHint={!formData.profileId ? 'Currently selected. The loop runs with the default active agent.' : 'Leaves this loop on the default active agent instead of a dedicated profile.'}
          accessibilityState={{ selected: !formData.profileId, disabled: isSaveDisabled }}
          disabled={isSaveDisabled}
        >
          <View style={styles.profileOptionInfo}>
            <Text style={[styles.profileOptionText, !formData.profileId && styles.profileOptionTextActive]}>No dedicated agent</Text>
            <Text style={[styles.profileOptionHelperText, !formData.profileId && styles.profileOptionHelperTextActive]}>Uses the default active agent when this loop runs.</Text>
          </View>
          {!formData.profileId && <Text style={styles.profileOptionCheckmark}>✓</Text>}
        </TouchableOpacity>
        {profiles.map(profile => (
          <TouchableOpacity
            key={profile.id}
            style={[styles.profileOption, formData.profileId === profile.id && styles.profileOptionActive]}
            onPress={() => updateField('profileId', profile.id)}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel(`Use ${profile.displayName || profile.name} for this loop`)}
            accessibilityHint={formData.profileId === profile.id ? 'Currently selected for this loop.' : 'Assigns this loop to the selected agent profile.'}
            accessibilityState={{ selected: formData.profileId === profile.id, disabled: isSaveDisabled }}
            disabled={isSaveDisabled}
          >
            <View style={styles.profileOptionInfo}>
              <Text style={[styles.profileOptionText, formData.profileId === profile.id && styles.profileOptionTextActive]}>{profile.displayName || profile.name}</Text>
              {!!(profile.description || profile.guidelines || profile.name) && (
                <Text
                  style={[styles.profileOptionHelperText, formData.profileId === profile.id && styles.profileOptionHelperTextActive]}
                  numberOfLines={2}
                >
                  {profile.description || profile.guidelines || profile.name}
                </Text>
              )}
            </View>
            {formData.profileId === profile.id && <Text style={styles.profileOptionCheckmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>
      {!isLoadingProfiles && settingsClient && profiles.length === 0 && (
        <Text style={styles.helperText}>No saved agent profiles yet. This loop will use the default agent until you create one.</Text>
      )}
      {isLoadingProfiles && <Text style={styles.helperText}>Loading profiles...</Text>}

      <TouchableOpacity style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaveDisabled}>
        {isSaving ? <ActivityIndicator color={theme.colors.primaryForeground} size="small" /> : <Text style={styles.saveButtonText}>{isEditing ? 'Save Loop' : 'Create Loop'}</Text>}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: { padding: spacing.lg },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: spacing.md, color: theme.colors.mutedForeground, fontSize: 14 },
    errorText: { color: theme.colors.destructive, marginBottom: spacing.sm },
    label: { fontSize: 14, fontWeight: '500', color: theme.colors.foreground, marginBottom: spacing.xs, marginTop: spacing.md },
    helperText: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: spacing.xs },
    sectionHelperText: { fontSize: 12, color: theme.colors.mutedForeground, marginBottom: spacing.sm },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: theme.colors.foreground, backgroundColor: theme.colors.background },
    textArea: { minHeight: 110 },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    switchLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.foreground },
    profileOptions: { width: '100%' as const, gap: spacing.xs },
    profileOption: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.md,
        verticalPadding: spacing.sm,
        horizontalMargin: 0,
      }),
      width: '100%' as const,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      backgroundColor: theme.colors.background,
    },
    profileOptionActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    profileOptionInfo: { flex: 1, minWidth: 0 },
    profileOptionText: { color: theme.colors.foreground, fontSize: 14, fontWeight: '500' },
    profileOptionTextActive: { color: theme.colors.primaryForeground, fontWeight: '600' },
    profileOptionHelperText: { color: theme.colors.mutedForeground, fontSize: 12, marginTop: 2 },
    profileOptionHelperTextActive: { color: theme.colors.primaryForeground },
    profileOptionCheckmark: { color: theme.colors.primaryForeground, fontSize: 16, fontWeight: '700', marginLeft: spacing.sm },
    saveButton: { marginTop: spacing.xl, backgroundColor: theme.colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: theme.colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  });
}
