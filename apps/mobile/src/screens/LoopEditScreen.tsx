import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useTheme } from '../ui/ThemeProvider';
import { AppShellEditorLayout } from '../ui/AppShellEditorLayout';
import { getAppShellEditorTitle } from '../ui/appShell';
import { spacing, radius } from '../ui/theme';
import {
  AgentSessionCandidate,
  AgentSessionCandidatesResponse,
  AgentProfile,
  ExtendedSettingsApiClient,
  Loop,
  LoopCreateRequest,
  LoopSchedule,
  LoopUpdateRequest,
} from '../lib/settingsApi';
import { createButtonAccessibilityLabel, createMinimumTouchTargetStyle } from '../lib/accessibility';
import { useConfigContext } from '../store/config';

type ScheduleMode = 'continuous' | 'interval' | 'daily' | 'weekly';

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
  adversarialCritique: boolean;
  criticProfileId: string;
  maxIterations: string;
  scheduleMode: ScheduleMode;
  scheduleTimes: string[];
  scheduleDaysOfWeek: number[];
};

type SessionCandidateOption = AgentSessionCandidate & {
  group: 'Active' | 'Recent' | 'Selected';
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DEFAULT_INTERVAL_MINUTES = 60;

const defaultFormData: LoopFormData = {
  name: '',
  prompt: '',
  intervalMinutes: String(DEFAULT_INTERVAL_MINUTES),
  enabled: true,
  profileId: '',
  runOnStartup: false,
  speakOnTrigger: false,
  continueInSession: false,
  lastSessionId: '',
  adversarialCritique: false,
  criticProfileId: '',
  maxIterations: '',
  scheduleMode: 'interval',
  scheduleTimes: ['09:00'],
  scheduleDaysOfWeek: [1, 2, 3, 4, 5],
};

function sanitizeScheduleTimes(times: string[]): string[] {
  const out: string[] = [];
  for (const t of times) {
    const trimmed = t.trim();
    if (TIME_RE.test(trimmed) && !out.includes(trimmed)) out.push(trimmed);
  }
  return out.sort();
}

function parseMaxIterationsDraft(input: string): number | null | 'invalid' {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!/^\d+$/.test(trimmed) || !Number.isInteger(value) || value < 1) {
    return 'invalid';
  }
  return value;
}

function formatSessionCandidateTitle(candidate: AgentSessionCandidate): string {
  return candidate.conversationTitle?.trim() || candidate.conversationId || candidate.id;
}

function formatSessionCandidateTime(candidate: AgentSessionCandidate): string {
  const timestamp = candidate.endTime ?? candidate.startTime;
  if (!timestamp) return candidate.id;
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildSessionCandidateOptions(
  candidates: AgentSessionCandidatesResponse | null,
  selectedSessionId: string,
): SessionCandidateOption[] {
  const selectedId = selectedSessionId.trim();
  const seen = new Set<string>();
  const options: SessionCandidateOption[] = [];

  const addCandidates = (items: AgentSessionCandidate[] | undefined, group: SessionCandidateOption['group']) => {
    for (const candidate of items ?? []) {
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      options.push({ ...candidate, group });
    }
  };

  addCandidates(candidates?.activeSessions, 'Active');
  addCandidates(candidates?.completedSessions, 'Recent');

  if (selectedId && !seen.has(selectedId)) {
    options.unshift({
      id: selectedId,
      status: 'unknown',
      startTime: 0,
      group: 'Selected',
    });
  }

  return options;
}

function loopToFormData(loop: Loop): LoopFormData {
  const scheduleMode: ScheduleMode = loop.runContinuously ? 'continuous' : (loop.schedule?.type ?? 'interval');
  const scheduleTimes = loop.schedule?.times.length ? [...loop.schedule.times] : ['09:00'];
  const scheduleDaysOfWeek = loop.schedule?.type === 'weekly'
    ? [...loop.schedule.daysOfWeek]
    : [1, 2, 3, 4, 5];
  return {
    name: loop.name,
    prompt: loop.prompt,
    intervalMinutes: String(loop.intervalMinutes),
    enabled: loop.enabled,
    profileId: loop.profileId || '',
    runOnStartup: !!loop.runOnStartup,
    speakOnTrigger: !!loop.speakOnTrigger,
    continueInSession: !!loop.continueInSession,
    lastSessionId: loop.lastSessionId || '',
    adversarialCritique: !!loop.adversarialCritique,
    criticProfileId: loop.criticProfileId || '',
    maxIterations: loop.maxIterations ? String(loop.maxIterations) : '',
    scheduleMode,
    scheduleTimes,
    scheduleDaysOfWeek,
  };
}

export default function LoopEditScreen({ navigation, route }: any) {
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
  const sessionCandidateOptions = useMemo(
    () => buildSessionCandidateOptions(sessionCandidates, formData.lastSessionId),
    [formData.lastSessionId, sessionCandidates],
  );

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
          setSessionCandidateError(err.message || 'Failed to load recent sessions');
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
    const intervalInput = formData.intervalMinutes.trim();
    const intervalMinutes = Number(intervalInput);
    if (!name || !prompt) {
      setError('Name and prompt are required');
      return;
    }
    const hasValidInterval = /^\d+$/.test(intervalInput) && Number.isInteger(intervalMinutes) && intervalMinutes >= 1;
    if (formData.scheduleMode === 'interval' && !hasValidInterval) {
      setError('Interval must be a positive whole number of minutes');
      return;
    }
    const maxIterations = parseMaxIterationsDraft(formData.maxIterations);
    if (maxIterations === 'invalid') {
      setError('Max iterations must be blank or a positive whole number');
      return;
    }
    const savedIntervalMinutes = hasValidInterval
      ? intervalMinutes
      : isEditing && existingLoopIntervalMinutes !== null
        ? existingLoopIntervalMinutes
        : DEFAULT_INTERVAL_MINUTES;

    let schedule: LoopSchedule | null = null;
    if (formData.scheduleMode !== 'interval' && formData.scheduleMode !== 'continuous') {
      const times = sanitizeScheduleTimes(formData.scheduleTimes);
      if (times.length === 0) {
        setError('Add at least one time in HH:MM format');
        return;
      }
      if (formData.scheduleMode === 'weekly') {
        if (formData.scheduleDaysOfWeek.length === 0) {
          setError('Select at least one day of the week');
          return;
        }
        schedule = { type: 'weekly', times, daysOfWeek: [...formData.scheduleDaysOfWeek].sort() };
      } else {
        schedule = { type: 'daily', times };
      }
    }

    setIsSaving(true);
    setError(null);
    try {
      if (isEditing && effectiveLoopId) {
        const updatePayload: LoopUpdateRequest = {
          name,
          prompt,
          intervalMinutes: savedIntervalMinutes,
          enabled: formData.enabled,
          profileId: formData.profileId || undefined,
          runOnStartup: formData.runOnStartup,
          speakOnTrigger: formData.speakOnTrigger,
          continueInSession: formData.continueInSession,
          lastSessionId: formData.continueInSession ? (formData.lastSessionId.trim() || null) : null,
          adversarialCritique: formData.adversarialCritique,
          criticProfileId: formData.adversarialCritique ? (formData.criticProfileId.trim() || null) : null,
          maxIterations,
          runContinuously: formData.scheduleMode === 'continuous',
          schedule,
        };
        await settingsClient.updateLoop(effectiveLoopId, updatePayload);
      } else {
        const createPayload: LoopCreateRequest = {
          name,
          prompt,
          intervalMinutes: savedIntervalMinutes,
          enabled: formData.enabled,
          profileId: formData.profileId || undefined,
          runOnStartup: formData.runOnStartup,
          speakOnTrigger: formData.speakOnTrigger,
          continueInSession: formData.continueInSession,
          ...(formData.continueInSession && formData.lastSessionId.trim() ? { lastSessionId: formData.lastSessionId.trim() } : {}),
          adversarialCritique: formData.adversarialCritique,
          ...(formData.adversarialCritique && formData.criticProfileId.trim() ? { criticProfileId: formData.criticProfileId.trim() } : {}),
          ...(maxIterations ? { maxIterations } : {}),
          runContinuously: formData.scheduleMode === 'continuous',
          schedule,
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
    <AppShellEditorLayout title={getAppShellEditorTitle('loop', isEditing)} keyboardShouldPersistTaps="handled">
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
            onPress={() => updateField('scheduleTimes', [...formData.scheduleTimes, '09:00'])}
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
            {DAY_LABELS.map((label, dayIdx) => {
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
          <Text style={styles.switchHelperText}>Start this repeat task as soon as the desktop app opens.</Text>
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
          <Text style={styles.switchHelperText}>Bring the session forward after the run so desktop TTS can read it aloud.</Text>
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
          <Text style={styles.switchLabel}>Continue in session</Text>
          <Text style={styles.switchHelperText}>Reuse a previous agent session instead of creating a fresh one for each run.</Text>
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
              accessibilityLabel={createButtonAccessibilityLabel('Automatically continue from the most recent task session')}
              accessibilityHint={!formData.lastSessionId ? 'Currently selected for this loop.' : 'Uses the most recent task session when this loop runs.'}
              accessibilityState={{ selected: !formData.lastSessionId }}
            >
              <View style={styles.profileOptionInfo}>
                <Text style={[styles.profileOptionText, !formData.lastSessionId && styles.profileOptionTextActive]}>Auto</Text>
                <Text style={[styles.profileOptionHelperText, !formData.lastSessionId && styles.profileOptionHelperTextActive]}>Use the most recent task session after the first run.</Text>
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
                  accessibilityLabel={createButtonAccessibilityLabel(`Continue from ${formatSessionCandidateTitle(candidate)}`)}
                  accessibilityHint={active ? 'Currently selected for this loop.' : 'Pins this session for the next loop run.'}
                  accessibilityState={{ selected: active }}
                >
                  <View style={styles.profileOptionInfo}>
                    <Text style={[styles.profileOptionText, active && styles.profileOptionTextActive]} numberOfLines={1}>
                      {formatSessionCandidateTitle(candidate)}
                    </Text>
                    <Text style={[styles.profileOptionHelperText, active && styles.profileOptionHelperTextActive]} numberOfLines={1}>
                      {candidate.group} - {candidate.status} - {formatSessionCandidateTime(candidate)}
                    </Text>
                  </View>
                  {active && <Text style={styles.profileOptionCheckmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
          {isLoadingSessionCandidates && <Text style={styles.helperText}>Loading recent sessions...</Text>}
          {sessionCandidateError && <Text style={styles.helperText}>{sessionCandidateError}</Text>}
          {!isLoadingSessionCandidates && !sessionCandidateError && sessionCandidateOptions.length === 0 && (
            <Text style={styles.helperText}>No recent sessions available yet.</Text>
          )}
        </>
      )}

      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Adversarial critique</Text>
          <Text style={styles.switchHelperText}>Run a separate critic session, then ask the worker to revise with the critique.</Text>
        </View>
        <Switch
          value={formData.adversarialCritique}
          onValueChange={value => {
            updateField('adversarialCritique', value);
            if (!value) updateField('criticProfileId', '');
          }}
          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
          thumbColor={formData.adversarialCritique ? theme.colors.primaryForeground : theme.colors.background}
        />
      </View>
      {formData.adversarialCritique && (
        <>
          <Text style={styles.label}>Critic Agent (optional)</Text>
          <Text style={styles.sectionHelperText}>Choose a dedicated critic agent, or leave it on the default agent.</Text>
          <View style={styles.profileOptions}>
            <TouchableOpacity
              style={[styles.profileOption, !formData.criticProfileId && styles.profileOptionActive]}
              onPress={() => updateField('criticProfileId', '')}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Use the default agent as critic')}
              accessibilityHint={!formData.criticProfileId ? 'Currently selected for this loop.' : 'Uses the default agent for the critique pass.'}
              accessibilityState={{ selected: !formData.criticProfileId, disabled: isSaveDisabled }}
              disabled={isSaveDisabled}
            >
              <View style={styles.profileOptionInfo}>
                <Text style={[styles.profileOptionText, !formData.criticProfileId && styles.profileOptionTextActive]}>Default critic</Text>
                <Text style={[styles.profileOptionHelperText, !formData.criticProfileId && styles.profileOptionHelperTextActive]}>Uses the default active agent for critique.</Text>
              </View>
              {!formData.criticProfileId && <Text style={styles.profileOptionCheckmark}>✓</Text>}
            </TouchableOpacity>
            {profiles.map(profile => (
              <TouchableOpacity
                key={profile.id}
                style={[styles.profileOption, formData.criticProfileId === profile.id && styles.profileOptionActive]}
                onPress={() => updateField('criticProfileId', profile.id)}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(`Use ${profile.displayName || profile.name} as critic`)}
                accessibilityHint={formData.criticProfileId === profile.id ? 'Currently selected as critic.' : 'Assigns this profile to the critique pass.'}
                accessibilityState={{ selected: formData.criticProfileId === profile.id, disabled: isSaveDisabled }}
                disabled={isSaveDisabled}
              >
                <View style={styles.profileOptionInfo}>
                  <Text style={[styles.profileOptionText, formData.criticProfileId === profile.id && styles.profileOptionTextActive]}>{profile.displayName || profile.name}</Text>
                  {!!(profile.description || profile.guidelines || profile.name) && (
                    <Text
                      style={[styles.profileOptionHelperText, formData.criticProfileId === profile.id && styles.profileOptionHelperTextActive]}
                      numberOfLines={2}
                    >
                      {profile.description || profile.guidelines || profile.name}
                    </Text>
                  )}
                </View>
                {formData.criticProfileId === profile.id && <Text style={styles.profileOptionCheckmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Max iterations</Text>
      <TextInput
        style={styles.input}
        value={formData.maxIterations}
        onChangeText={v => updateField('maxIterations', v)}
        placeholder="Use desktop default"
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
    </AppShellEditorLayout>
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
