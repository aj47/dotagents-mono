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
  addRepeatTaskScheduleTime,
  buildRepeatTaskEditFormSavePayload,
  DEFAULT_REPEAT_TASK_EDIT_FORM_DATA,
  REPEAT_TASK_DAY_LABELS,
  formatRepeatTaskEditFormData,
  removeRepeatTaskScheduleTimeAt,
  toggleRepeatTaskScheduleDayOfWeek,
  type RepeatTaskEditFormData,
  updateRepeatTaskScheduleTimeAt,
} from '@dotagents/shared/repeat-task-utils';
import {
  APP_SHELL_LOOP_EDITOR_PRESENTATION,
  getAppShellEditorActionLabel,
  getAppShellEditorTitle,
} from '@dotagents/shared/app-shell';

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
  const { theme } = useTheme();
  const { config } = useConfigContext();

  const loopFromRoute = route.params?.loop as Loop | undefined;
  const loopId = route.params?.loopId as string | undefined;
  const effectiveLoopId = loopId ?? loopFromRoute?.id;
  const isEditing = !!effectiveLoopId;

  const [formData, setFormData] = useState<RepeatTaskEditFormData>(() =>
    loopFromRoute ? formatRepeatTaskEditFormData(loopFromRoute) : DEFAULT_REPEAT_TASK_EDIT_FORM_DATA
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
    navigation.setOptions({ title: getAppShellEditorTitle('loop', isEditing) });
  }, [isEditing, navigation]);

  useEffect(() => {
    if (isEditing && !loopFromRoute && !settingsClient) {
      setIsLoading(false);
      setError(APP_SHELL_LOOP_EDITOR_PRESENTATION.unavailableLoadSaveError);
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
          setError(err.message || APP_SHELL_LOOP_EDITOR_PRESENTATION.errors.loadProfilesFailed);
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
          setSessionCandidateError(err.message || APP_SHELL_LOOP_EDITOR_PRESENTATION.errors.loadSessionsFailed);
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
          setError(APP_SHELL_LOOP_EDITOR_PRESENTATION.errors.notFound);
          return;
        }
        setFormData(formatRepeatTaskEditFormData(loop));
        setExistingLoopIntervalMinutes(loop.intervalMinutes);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || APP_SHELL_LOOP_EDITOR_PRESENTATION.errors.loadFailed);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [effectiveLoopId, isEditing, loopFromRoute, settingsClient]);

  const updateField = useCallback(<K extends keyof RepeatTaskEditFormData>(key: K, value: RepeatTaskEditFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!settingsClient) {
      setError(APP_SHELL_LOOP_EDITOR_PRESENTATION.unavailableSaveError);
      return;
    }

    const savePayloadResult = buildRepeatTaskEditFormSavePayload(formData, {
      existingIntervalMinutes: isEditing ? existingLoopIntervalMinutes : null,
    });
    if (savePayloadResult.ok === false) {
      setError(savePayloadResult.message);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = savePayloadResult.payload;
      if (isEditing && effectiveLoopId) {
        const updatePayload: LoopUpdateRequest = {
          name: payload.name,
          prompt: payload.prompt,
          intervalMinutes: payload.intervalMinutes,
          enabled: payload.enabled,
          profileId: payload.profileId || undefined,
          runOnStartup: payload.runOnStartup,
          speakOnTrigger: payload.speakOnTrigger,
          continueInSession: payload.continueInSession,
          lastSessionId: payload.continueInSession ? (payload.lastSessionId || null) : null,
          maxIterations: payload.maxIterations ?? null,
          runContinuously: payload.runContinuously,
          schedule: payload.schedule,
        };
        await settingsClient.updateLoop(effectiveLoopId, updatePayload);
      } else {
        const createPayload: LoopCreateRequest = {
          name: payload.name,
          prompt: payload.prompt,
          intervalMinutes: payload.intervalMinutes,
          enabled: payload.enabled,
          profileId: payload.profileId || undefined,
          runOnStartup: payload.runOnStartup,
          speakOnTrigger: payload.speakOnTrigger,
          continueInSession: payload.continueInSession,
          ...(payload.continueInSession && payload.lastSessionId ? { lastSessionId: payload.lastSessionId } : {}),
          ...(payload.maxIterations ? { maxIterations: payload.maxIterations } : {}),
          runContinuously: payload.runContinuously,
          schedule: payload.schedule,
        };
        await settingsClient.createLoop(createPayload);
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || APP_SHELL_LOOP_EDITOR_PRESENTATION.errors.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }, [effectiveLoopId, existingLoopIntervalMinutes, formData, isEditing, navigation, settingsClient]);

  const isSaveDisabled = isSaving || !settingsClient;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.loadingLabel}</Text>
      </View>
    );
  }

  return (
    <AppShellEditorLayout title={getAppShellEditorTitle('loop', isEditing)}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!settingsClient && <Text style={styles.helperText}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.unavailableSaveHelper}</Text>}

      <Text style={styles.label}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.name.requiredLabel}</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={v => updateField('name', v)}
        placeholder={APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.name.placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
      />

      <Text style={styles.label}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.prompt.requiredLabel}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.prompt}
        onChangeText={v => updateField('prompt', v)}
        placeholder={APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.prompt.placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <Text style={styles.label}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.schedule.label}</Text>
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
                {APP_SHELL_LOOP_EDITOR_PRESENTATION.scheduleModes[mode]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {formData.scheduleMode === 'interval' && (
        <>
          <Text style={styles.label}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.interval.requiredLabel}</Text>
          <TextInput
            style={styles.input}
            value={formData.intervalMinutes}
            onChangeText={v => updateField('intervalMinutes', v)}
            placeholder={APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.interval.placeholder}
            placeholderTextColor={theme.colors.mutedForeground}
            keyboardType="numeric"
          />
        </>
      )}

      {formData.scheduleMode === 'continuous' && (
        <Text style={styles.helperText}>
          {APP_SHELL_LOOP_EDITOR_PRESENTATION.schedule.continuousHelper}
        </Text>
      )}

      {formData.scheduleMode !== 'interval' && formData.scheduleMode !== 'continuous' && (
        <>
          <Text style={styles.label}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.times.label}</Text>
          {formData.scheduleTimes.map((time, idx) => (
            <View key={idx} style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={time}
                onChangeText={v => {
                  updateField('scheduleTimes', updateRepeatTaskScheduleTimeAt(formData.scheduleTimes, idx, v));
                }}
                placeholder={APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.times.placeholder}
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {formData.scheduleTimes.length > 1 && (
                <TouchableOpacity
                  onPress={() => {
                    updateField('scheduleTimes', removeRepeatTaskScheduleTimeAt(formData.scheduleTimes, idx));
                  }}
                  style={styles.timeRemoveBtn}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(APP_SHELL_LOOP_EDITOR_PRESENTATION.actions.removeTime)}
                >
                  <Text style={styles.timeRemoveText}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.actions.removeTime}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={() =>
              updateField('scheduleTimes', addRepeatTaskScheduleTime(formData.scheduleTimes))
            }
            style={styles.addTimeBtn}
            accessibilityRole="button"
          >
            <Text style={styles.addTimeText}>+ {APP_SHELL_LOOP_EDITOR_PRESENTATION.actions.addTime}</Text>
          </TouchableOpacity>
        </>
      )}

      {formData.scheduleMode === 'weekly' && (
        <>
          <Text style={styles.label}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.daysOfWeek.label}</Text>
          <View style={styles.modeRow}>
            {REPEAT_TASK_DAY_LABELS.map((label, dayIdx) => {
              const active = formData.scheduleDaysOfWeek.includes(dayIdx);
              return (
                <TouchableOpacity
                  key={dayIdx}
                  onPress={() => {
                    updateField(
                      'scheduleDaysOfWeek',
                      toggleRepeatTaskScheduleDayOfWeek(formData.scheduleDaysOfWeek, dayIdx),
                    );
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
        <Text style={styles.switchLabel}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.switches.enabled.label}</Text>
        <Switch
          value={formData.enabled}
          onValueChange={value => updateField('enabled', value)}
          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
          thumbColor={formData.enabled ? theme.colors.primaryForeground : theme.colors.background}
        />
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.switches.runOnStartup.label}</Text>
          <Text style={styles.switchHelperText}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.switches.runOnStartup.helper}</Text>
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
          <Text style={styles.switchLabel}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.switches.speakOnTrigger.label}</Text>
          <Text style={styles.switchHelperText}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.switches.speakOnTrigger.helper}</Text>
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
          <Text style={styles.switchLabel}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.switches.continueInSession.label}</Text>
          <Text style={styles.switchHelperText}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.switches.continueInSession.helper}</Text>
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
          <Text style={styles.label}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.continueFromSession.label}</Text>
          <View style={styles.profileOptions}>
            <TouchableOpacity
              style={[styles.profileOption, !formData.lastSessionId && styles.profileOptionActive]}
              onPress={() => updateField('lastSessionId', '')}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(APP_SHELL_LOOP_EDITOR_PRESENTATION.sessionPicker.autoAccessibilityLabel)}
              accessibilityHint={!formData.lastSessionId ? APP_SHELL_LOOP_EDITOR_PRESENTATION.sessionPicker.autoSelectedHint : APP_SHELL_LOOP_EDITOR_PRESENTATION.sessionPicker.autoUnselectedHint}
              accessibilityState={{ selected: !formData.lastSessionId }}
            >
              <View style={styles.profileOptionInfo}>
                <Text style={[styles.profileOptionText, !formData.lastSessionId && styles.profileOptionTextActive]}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.sessionPicker.autoLabel}</Text>
                <Text style={[styles.profileOptionHelperText, !formData.lastSessionId && styles.profileOptionHelperTextActive]}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.sessionPicker.autoHelper}</Text>
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
          {isLoadingSessionCandidates && <Text style={styles.helperText}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.sessionPicker.loadingLabel}</Text>}
          {sessionCandidateError && <Text style={styles.helperText}>{sessionCandidateError}</Text>}
          {!isLoadingSessionCandidates && !sessionCandidateError && sessionCandidateOptions.length === 0 && (
            <Text style={styles.helperText}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.sessionPicker.emptyLabel}</Text>
          )}
        </>
      )}
      <Text style={styles.label}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.maxIterations.label}</Text>
      <TextInput
        style={styles.input}
        value={formData.maxIterations}
        onChangeText={v => updateField('maxIterations', v)}
        placeholder={APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.maxIterations.placeholder}
        placeholderTextColor={theme.colors.mutedForeground}
        keyboardType="numeric"
      />

      <Text style={styles.label}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.agentProfile.label}</Text>
      <Text style={styles.sectionHelperText}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.agentProfile.helper}</Text>
      <View style={styles.profileOptions}>
        <TouchableOpacity
          style={[styles.profileOption, !formData.profileId && styles.profileOptionActive]}
          onPress={() => updateField('profileId', '')}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel(APP_SHELL_LOOP_EDITOR_PRESENTATION.agentProfile.defaultAccessibilityLabel)}
          accessibilityHint={!formData.profileId ? APP_SHELL_LOOP_EDITOR_PRESENTATION.agentProfile.defaultSelectedHint : APP_SHELL_LOOP_EDITOR_PRESENTATION.agentProfile.defaultUnselectedHint}
          accessibilityState={{ selected: !formData.profileId, disabled: isSaveDisabled }}
          disabled={isSaveDisabled}
        >
          <View style={styles.profileOptionInfo}>
            <Text style={[styles.profileOptionText, !formData.profileId && styles.profileOptionTextActive]}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.agentProfile.defaultLabel}</Text>
            <Text style={[styles.profileOptionHelperText, !formData.profileId && styles.profileOptionHelperTextActive]}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.agentProfile.defaultHelper}</Text>
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
        <Text style={styles.helperText}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.agentProfile.emptyLabel}</Text>
      )}
      {isLoadingProfiles && <Text style={styles.helperText}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.agentProfile.loadingLabel}</Text>}

      <TouchableOpacity style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaveDisabled}>
        {isSaving ? <ActivityIndicator color={theme.colors.primaryForeground} size="small" /> : <Text style={styles.saveButtonText}>{getAppShellEditorActionLabel('loop', isEditing)}</Text>}
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
