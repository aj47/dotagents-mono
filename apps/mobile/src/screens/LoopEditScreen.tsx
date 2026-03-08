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
import { createMinimumTouchTargetStyle } from '../lib/accessibility';
import { useConfigContext } from '../store/config';

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
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}
      {!settingsClient && (
        <View style={styles.helperContainer}>
          <Text style={styles.helperText}>Configure Base URL and API key in Settings to save changes.</Text>
        </View>
      )}

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
      <View style={styles.profileOptions}>
        <TouchableOpacity
          style={[styles.profileOption, !formData.profileId && styles.profileOptionActive]}
          onPress={() => updateField('profileId', '')}
        >
          <Text style={[styles.profileOptionText, !formData.profileId && styles.profileOptionTextActive]}>No profile</Text>
        </TouchableOpacity>
        {profiles.map(profile => (
          <TouchableOpacity
            key={profile.id}
            style={[styles.profileOption, formData.profileId === profile.id && styles.profileOptionActive]}
            onPress={() => updateField('profileId', profile.id)}
          >
            <Text
              style={[styles.profileOptionText, formData.profileId === profile.id && styles.profileOptionTextActive]}
              numberOfLines={2}
            >
              {profile.displayName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoadingProfiles && <Text style={styles.inlineHelperText}>Loading profiles...</Text>}

      <TouchableOpacity style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaveDisabled}>
        {isSaving ? <ActivityIndicator color={theme.colors.primaryForeground} size="small" /> : <Text style={styles.saveButtonText}>{isEditing ? 'Save Loop' : 'Create Loop'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const profileOptionTouchTarget = createMinimumTouchTargetStyle({
    horizontalPadding: spacing.md,
    verticalPadding: spacing.xs,
    horizontalMargin: 0,
  });

  return StyleSheet.create({
    container: { padding: spacing.lg },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: spacing.md, color: theme.colors.mutedForeground, fontSize: 14 },
    errorContainer: {
      backgroundColor: theme.colors.destructive + '14',
      borderWidth: 1,
      borderColor: theme.colors.destructive + '33',
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorText: { color: theme.colors.destructive, fontSize: 14, lineHeight: 20 },
    label: { fontSize: 14, fontWeight: '500', color: theme.colors.foreground, marginBottom: spacing.xs, marginTop: spacing.md },
    helperContainer: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    helperText: { fontSize: 12, lineHeight: 18, color: theme.colors.mutedForeground },
    inlineHelperText: { fontSize: 12, lineHeight: 18, color: theme.colors.mutedForeground, marginTop: spacing.xs },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: theme.colors.foreground, backgroundColor: theme.colors.background },
    textArea: { minHeight: 110 },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    switchLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.foreground },
    profileOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    profileOption: { ...profileOptionTouchTarget, maxWidth: '100%', alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md },
    profileOptionActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    profileOptionText: { color: theme.colors.foreground, fontSize: 13, lineHeight: 18, textAlign: 'center', flexShrink: 1 },
    profileOptionTextActive: { color: theme.colors.primaryForeground, fontWeight: '600' },
    saveButton: { marginTop: spacing.xl, backgroundColor: theme.colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: theme.colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  });
}
