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
import type {
  AgentSessionCandidatesResponse,
  ApiAgentProfile as AgentProfile,
  Loop,
  LoopCreateRequest,
  LoopUpdateRequest,
} from '@dotagents/shared/api-types';
import {
  ExtendedSettingsApiClient,
} from '../lib/settingsApi';
import { createButtonAccessibilityLabel, createMinimumTouchTargetStyle } from '@dotagents/shared/accessibility-utils';
import { useConfigContext } from '../store/config';
import {
  buildAgentSessionCandidateOptions,
  formatAgentSessionCandidateTime,
  formatAgentSessionCandidateTitle,
  type AgentSessionCandidateOption,
} from '@dotagents/shared/agent-session-candidates';
import {
  buildRepeatTaskScheduleFromDraft,
  DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS,
  DEFAULT_REPEAT_TASK_INTERVAL_MINUTES,
  DEFAULT_REPEAT_TASK_SCHEDULE_TIMES,
  DEFAULT_REPEAT_TASK_WEEKDAYS,
  REPEAT_TASK_DAY_LABELS,
  getLoopScheduleDaysOfWeek,
  getLoopScheduleMode,
  getLoopScheduleTimes,
  parseLoopIntervalDraft,
  resolveRepeatTaskIntervalMinutesDraft,
  type RepeatTaskScheduleMode,
} from '@dotagents/shared/repeat-task-utils';

type LoopFormData = {
  name: string;
  prompt: string;
  intervalMinutes: string;
  enabled: boolean;
  profileId: string;
  runOnStartup: boolean;
  speakOnTrigger: boolean;
  continueInSession: boolean;
  lastSessionId: string;
  maxIterations: string;
  scheduleMode: RepeatTaskScheduleMode;
  scheduleTimes: string[];
  scheduleDaysOfWeek: number[];
};

const defaultFormData: LoopFormData = {
  name: '',
  prompt: '',
  intervalMinutes: String(DEFAULT_REPEAT_TASK_INTERVAL_MINUTES),
  enabled: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.enabled,
  profileId: '',
  runOnStartup: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.runOnStartup,
  speakOnTrigger: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.speakOnTrigger,
  continueInSession: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.continueInSession,
  lastSessionId: '',
  maxIterations: '',
  scheduleMode: 'interval',
  scheduleTimes: [...DEFAULT_REPEAT_TASK_SCHEDULE_TIMES],
  scheduleDaysOfWeek: [...DEFAULT_REPEAT_TASK_WEEKDAYS],
};

function loopToFormData(loop: Loop): LoopFormData {
  const scheduleMode = getLoopScheduleMode(loop);
  const scheduleTimes = getLoopScheduleTimes(loop);
  const scheduleDaysOfWeek = getLoopScheduleDaysOfWeek(loop);
  return {
    name: loop.name,
    prompt: loop.prompt,
    intervalMinutes: String(loop.intervalMinutes),
    enabled: loop.enabled,
    profileId: loop.profileId || '',
    runOnStartup: loop.runOnStartup ?? DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.runOnStartup,
    speakOnTrigger: loop.speakOnTrigger ?? DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.speakOnTrigger,
    continueInSession: loop.continueInSession ?? DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.continueInSession,
    lastSessionId: loop.lastSessionId || '',
    maxIterations: loop.maxIterations ? String(loop.maxIterations) : '',
    scheduleMode,
    scheduleTimes,
    scheduleDaysOfWeek,
  };
}

function formatMobileSessionCandidateTime(candidate: AgentSessionCandidateOption): string {
  return formatAgentSessionCandidateTime(candidate, {
    dateTimeFormatOptions: {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    },
  });
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
    loopFromRoute ? loopToFormData(loopFromRoute) : defaultFormData
  );
  const [existingLoopIntervalMinutes, setExistingLoopIntervalMinutes] = useState<number | null>(() =>
    loopFromRoute?.intervalMinutes ?? null
  );
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [sessionCandidates, setSessionCandidates] = useState<AgentSessionCandidatesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing && !loopFromRoute);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isLoadingSessionCandidates, setIsLoadingSessionCandidates] = useState(false);
  const [sessionCandidateError, setSessionCandidateError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const sessionCandidateOptions = useMemo(() => buildAgentSessionCandidateOptions(
    sessionCandidates,
    formData.lastSessionId.trim(),
  ), [formData.lastSessionId, sessionCandidates]);

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
    if (!settingsClient) return;
    let cancelled = false;
    setIsLoadingSessionCandidates(true);
    setSessionCandidateError(null);
    settingsClient.getAgentSessionCandidates(20)
      .then((res) => {
        if (!cancelled) {
          setSessionCandidates(res);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setSessionCandidateError(err.message || 'Failed to load sessions');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSessionCandidates(false);
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
        setFormData(loopToFormData(loop));
        setExistingLoopIntervalMinutes(loop.intervalMinutes);
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
    if (!name || !prompt) {
      setError('Name and prompt are required');
      return;
    }
    const intervalResolution = resolveRepeatTaskIntervalMinutesDraft(formData.intervalMinutes, {
      existingIntervalMinutes: isEditing ? existingLoopIntervalMinutes : null,
      fallbackIntervalMinutes: DEFAULT_REPEAT_TASK_INTERVAL_MINUTES,
    });
    if (formData.scheduleMode === 'interval' && !intervalResolution.isValid) {
      setError('Interval must be a positive whole number of minutes');
      return;
    }
    const maxIterationsInput = formData.maxIterations.trim();
    const parsedMaxIterations = maxIterationsInput ? parseLoopIntervalDraft(maxIterationsInput) : null;
    if (maxIterationsInput && parsedMaxIterations === null) {
      setError('Max iterations must be a positive whole number');
      return;
    }

    const scheduleResult = buildRepeatTaskScheduleFromDraft({
      scheduleMode: formData.scheduleMode,
      scheduleTimes: formData.scheduleTimes,
      scheduleDaysOfWeek: formData.scheduleDaysOfWeek,
    });
    if (scheduleResult.ok === false) {
      const message = scheduleResult.error === 'missing-schedule-times'
        ? 'Add at least one time in HH:MM format'
        : 'Select at least one day of the week';
      setError(message);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const lastSessionId = formData.lastSessionId.trim();
      if (isEditing && effectiveLoopId) {
        const updatePayload: LoopUpdateRequest = {
          name,
          prompt,
          intervalMinutes: intervalResolution.intervalMinutes,
          enabled: formData.enabled,
          profileId: formData.profileId || undefined,
          runOnStartup: formData.runOnStartup,
          speakOnTrigger: formData.speakOnTrigger,
          continueInSession: formData.continueInSession,
          lastSessionId: formData.continueInSession ? (lastSessionId || null) : null,
          maxIterations: parsedMaxIterations ?? null,
          runContinuously: scheduleResult.runContinuously,
          schedule: scheduleResult.schedule,
        };
        await settingsClient.updateLoop(effectiveLoopId, updatePayload);
      } else {
        const createPayload: LoopCreateRequest = {
          name,
          prompt,
          intervalMinutes: intervalResolution.intervalMinutes,
          enabled: formData.enabled,
          profileId: formData.profileId || undefined,
          runOnStartup: formData.runOnStartup,
          speakOnTrigger: formData.speakOnTrigger,
          continueInSession: formData.continueInSession,
          ...(formData.continueInSession && lastSessionId ? { lastSessionId } : {}),
          ...(parsedMaxIterations ? { maxIterations: parsedMaxIterations } : {}),
          runContinuously: scheduleResult.runContinuously,
          schedule: scheduleResult.schedule,
        };
        await settingsClient.createLoop(createPayload);
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to save loop');
    } finally {
      setIsSaving(false);
    }
  }, [effectiveLoopId, existingLoopIntervalMinutes, formData, isEditing, navigation, settingsClient]);

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

      <Text style={styles.label}>Schedule</Text>
      <View style={styles.modeRow}>
        {(['interval', 'continuous', 'daily', 'weekly'] as const).map(mode => {
          const active = formData.scheduleMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              onPress={() => updateField('scheduleMode', mode)}
              style={[styles.modeChip, active && styles.modeChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>
                {mode === 'interval' ? 'Interval' : mode === 'continuous' ? 'Continuous' : mode === 'daily' ? 'Daily' : 'Weekly'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {formData.scheduleMode === 'interval' && (
        <>
          <Text style={styles.label}>Interval (minutes) *</Text>
          <TextInput
            style={styles.input}
            value={formData.intervalMinutes}
            onChangeText={v => updateField('intervalMinutes', v)}
            placeholder="60"
            placeholderTextColor={theme.colors.mutedForeground}
            keyboardType="numeric"
          />
        </>
      )}

      {formData.scheduleMode === 'continuous' && (
        <Text style={styles.helperText}>
          Starts the next run as soon as the previous run finishes. Only one run of this task executes at a time.
        </Text>
      )}

      {formData.scheduleMode !== 'interval' && formData.scheduleMode !== 'continuous' && (
        <>
          <Text style={styles.label}>Time(s) (HH:MM, local)</Text>
          {formData.scheduleTimes.map((time, idx) => (
            <View key={idx} style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={time}
                onChangeText={v => {
                  const next = [...formData.scheduleTimes];
                  next[idx] = v;
                  updateField('scheduleTimes', next);
                }}
                placeholder="09:00"
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {formData.scheduleTimes.length > 1 && (
                <TouchableOpacity
                  onPress={() => {
                    const next = formData.scheduleTimes.filter((_, i) => i !== idx);
                    updateField('scheduleTimes', next);
                  }}
                  style={styles.timeRemoveBtn}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Remove time')}
                >
                  <Text style={styles.timeRemoveText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={() =>
              updateField('scheduleTimes', [...formData.scheduleTimes, DEFAULT_REPEAT_TASK_SCHEDULE_TIMES[0]])
            }
            style={styles.addTimeBtn}
            accessibilityRole="button"
          >
            <Text style={styles.addTimeText}>+ Add time</Text>
          </TouchableOpacity>
        </>
      )}

      {formData.scheduleMode === 'weekly' && (
        <>
          <Text style={styles.label}>Days of week</Text>
          <View style={styles.modeRow}>
            {REPEAT_TASK_DAY_LABELS.map((label, dayIdx) => {
              const active = formData.scheduleDaysOfWeek.includes(dayIdx);
              return (
                <TouchableOpacity
                  key={dayIdx}
                  onPress={() => {
                    const next = active
                      ? formData.scheduleDaysOfWeek.filter(d => d !== dayIdx)
                      : [...formData.scheduleDaysOfWeek, dayIdx].sort();
                    updateField('scheduleDaysOfWeek', next);
                  }}
                  style={[styles.modeChip, active && styles.modeChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enabled</Text>
        <Switch
          value={formData.enabled}
          onValueChange={value => updateField('enabled', value)}
          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
          thumbColor={formData.enabled ? theme.colors.primaryForeground : theme.colors.background}
        />
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Run on startup</Text>
          <Text style={styles.switchHelperText}>Runs once when the desktop repeat task service starts.</Text>
        </View>
        <Switch
          value={formData.runOnStartup}
          onValueChange={value => updateField('runOnStartup', value)}
          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
          thumbColor={formData.runOnStartup ? theme.colors.primaryForeground : theme.colors.background}
        />
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Speak on trigger</Text>
          <Text style={styles.switchHelperText}>Unsnoozes the completed task session so desktop TTS can play the result.</Text>
        </View>
        <Switch
          value={formData.speakOnTrigger}
          onValueChange={value => updateField('speakOnTrigger', value)}
          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
          thumbColor={formData.speakOnTrigger ? theme.colors.primaryForeground : theme.colors.background}
        />
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Continue in same session</Text>
          <Text style={styles.switchHelperText}>Appends future runs to the last task session when it can be revived.</Text>
        </View>
        <Switch
          value={formData.continueInSession}
          onValueChange={value => updateField('continueInSession', value)}
          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
          thumbColor={formData.continueInSession ? theme.colors.primaryForeground : theme.colors.background}
        />
      </View>
      {formData.continueInSession && (
        <>
          <Text style={styles.label}>Continue from session</Text>
          <View style={styles.profileOptions}>
            <TouchableOpacity
              style={[styles.profileOption, !formData.lastSessionId && styles.profileOptionActive]}
              onPress={() => updateField('lastSessionId', '')}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Auto select this loop most recent session')}
              accessibilityHint={!formData.lastSessionId ? 'Currently selected. Future runs use this task most recent session.' : 'Clears the pinned session for this loop.'}
              accessibilityState={{ selected: !formData.lastSessionId }}
            >
              <View style={styles.profileOptionInfo}>
                <Text style={[styles.profileOptionText, !formData.lastSessionId && styles.profileOptionTextActive]}>Auto</Text>
                <Text style={[styles.profileOptionHelperText, !formData.lastSessionId && styles.profileOptionHelperTextActive]}>Uses this task's most recent session when it can be revived.</Text>
              </View>
              {!formData.lastSessionId && <Text style={styles.profileOptionCheckmark}>✓</Text>}
            </TouchableOpacity>
            {sessionCandidateOptions.map(candidate => {
              const active = formData.lastSessionId === candidate.id;
              return (
                <TouchableOpacity
                  key={`${candidate.group}:${candidate.id}`}
                  style={[styles.profileOption, active && styles.profileOptionActive]}
                  onPress={() => updateField('lastSessionId', candidate.id)}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(`Continue from ${formatAgentSessionCandidateTitle(candidate)}`)}
                  accessibilityHint={active ? 'Currently selected for this loop.' : 'Pins this session for the next loop run.'}
                  accessibilityState={{ selected: active }}
                >
                  <View style={styles.profileOptionInfo}>
                    <Text style={[styles.profileOptionText, active && styles.profileOptionTextActive]} numberOfLines={1}>
                      {formatAgentSessionCandidateTitle(candidate)}
                    </Text>
                    <Text style={[styles.profileOptionHelperText, active && styles.profileOptionHelperTextActive]} numberOfLines={1}>
                      {candidate.group} - {candidate.status} - {formatMobileSessionCandidateTime(candidate)}
                    </Text>
                  </View>
                  {active && <Text style={styles.profileOptionCheckmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
          {isLoadingSessionCandidates && <Text style={styles.helperText}>Loading sessions...</Text>}
          {sessionCandidateError && <Text style={styles.helperText}>{sessionCandidateError}</Text>}
          {!isLoadingSessionCandidates && !sessionCandidateError && sessionCandidateOptions.length === 0 && (
            <Text style={styles.helperText}>No active or recent desktop sessions found. Auto still tracks the next session this loop creates.</Text>
          )}
        </>
      )}
      <Text style={styles.label}>Max iterations (optional)</Text>
      <TextInput
        style={styles.input}
        value={formData.maxIterations}
        onChangeText={v => updateField('maxIterations', v)}
        placeholder="Uses desktop default"
        placeholderTextColor={theme.colors.mutedForeground}
        keyboardType="numeric"
      />

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
    switchInfo: { flex: 1, marginRight: spacing.md },
    switchLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.foreground },
    switchHelperText: { fontSize: 12, color: theme.colors.mutedForeground, marginTop: 2 },
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
    modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
    modeChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    modeChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    modeChipText: { color: theme.colors.foreground, fontSize: 13, fontWeight: '500' },
    modeChipTextActive: { color: theme.colors.primaryForeground, fontWeight: '600' },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    timeInput: { flex: 1 },
    timeRemoveBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
    timeRemoveText: { color: theme.colors.destructive, fontSize: 13 },
    addTimeBtn: { paddingVertical: spacing.xs, alignSelf: 'flex-start' },
    addTimeText: { color: theme.colors.primary, fontSize: 13, fontWeight: '500' },
  });
}
