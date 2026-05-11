import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../ui/ThemeProvider';
import { AppShellEditorLayout } from '../ui/AppShellEditorLayout';
import { spacing, radius } from '../ui/theme';
import type {
  Skill,
  SkillCreateRequest,
  SkillUpdateRequest,
} from '@dotagents/shared/api-types';
import { ExtendedSettingsApiClient } from '../lib/settingsApi';
import { createButtonAccessibilityLabel } from '@dotagents/shared/accessibility-utils';
import { useConfigContext } from '../store/config';
import {
  DEFAULT_SKILL_EDIT_FORM_DATA,
  formatSkillEditFormData,
  type SkillEditFormData,
} from '@dotagents/shared/skills-api';
import {
  APP_SHELL_SKILL_EDITOR_PRESENTATION,
  getAppShellEditorActionLabel,
  getAppShellEditorTitle,
} from '@dotagents/shared/app-shell';

export default function SkillEditScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { config } = useConfigContext();

  const skillFromRoute = route.params?.skill as Skill | undefined;
  const skillId = route.params?.skillId as string | undefined;
  const effectiveSkillId = skillId ?? skillFromRoute?.id;
  const isEditing = !!effectiveSkillId;

  const [formData, setFormData] = useState<SkillEditFormData>(() =>
    skillFromRoute ? formatSkillEditFormData(skillFromRoute) : DEFAULT_SKILL_EDIT_FORM_DATA
  );
  const [isLoading, setIsLoading] = useState(isEditing && !skillFromRoute);
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
    navigation.setOptions({ title: getAppShellEditorTitle('skill', isEditing) });
  }, [isEditing, navigation]);

  useEffect(() => {
    if (isEditing && !skillFromRoute && !settingsClient) {
      setIsLoading(false);
      setError(APP_SHELL_SKILL_EDITOR_PRESENTATION.unavailableLoadSaveError);
    }
  }, [isEditing, skillFromRoute, settingsClient]);

  useEffect(() => {
    if (!isEditing || skillFromRoute || !settingsClient || !effectiveSkillId) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    settingsClient.getSkill(effectiveSkillId)
      .then((res) => {
        if (cancelled) return;
        setFormData(formatSkillEditFormData(res.skill));
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || APP_SHELL_SKILL_EDITOR_PRESENTATION.errors.loadFailed);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [effectiveSkillId, isEditing, skillFromRoute, settingsClient]);

  const updateField = useCallback(<K extends keyof SkillEditFormData>(key: K, value: SkillEditFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!settingsClient) {
      setError(APP_SHELL_SKILL_EDITOR_PRESENTATION.unavailableSaveError);
      return;
    }

    const name = formData.name.trim();
    const description = formData.description.trim();
    const instructions = formData.instructions.trim();

    if (!name || !instructions) {
      setError(APP_SHELL_SKILL_EDITOR_PRESENTATION.validation.nameAndInstructionsRequired);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && effectiveSkillId) {
        const updatePayload: SkillUpdateRequest = {
          name,
          description,
          instructions,
        };
        await settingsClient.updateSkill(effectiveSkillId, updatePayload);
      } else {
        const createPayload: SkillCreateRequest = {
          name,
          description,
          instructions,
        };
        await settingsClient.createSkill(createPayload);
      }

      navigation.goBack();
    } catch (err: any) {
      setError(err.message || APP_SHELL_SKILL_EDITOR_PRESENTATION.errors.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }, [effectiveSkillId, formData, isEditing, navigation, settingsClient]);

  const isSaveDisabled = isSaving || !settingsClient;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{APP_SHELL_SKILL_EDITOR_PRESENTATION.loadingLabel}</Text>
      </View>
    );
  }

  return (
    <AppShellEditorLayout title={getAppShellEditorTitle('skill', isEditing)}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!settingsClient && (
          <Text style={styles.helperText}>{APP_SHELL_SKILL_EDITOR_PRESENTATION.unavailableSaveHelper}</Text>
        )}

        {isEditing && effectiveSkillId && (
          <>
            <Text style={styles.label}>{APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.id.label}</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={effectiveSkillId}
              editable={false}
              autoCapitalize="none"
            />
            <Text style={styles.sectionHelperText}>{APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.id.helper}</Text>
          </>
        )}

        <Text style={styles.label}>{APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.name.requiredLabel}</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={value => updateField('name', value)}
          placeholder={APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.name.placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
        />

        <Text style={styles.label}>{APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.description.label}</Text>
        <TextInput
          style={styles.input}
          value={formData.description}
          onChangeText={value => updateField('description', value)}
          placeholder={APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.description.placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
          multiline
        />

        <Text style={styles.label}>{APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.instructions.requiredLabel}</Text>
        <TextInput
          style={[styles.input, styles.instructionsInput]}
          value={formData.instructions}
          onChangeText={value => updateField('instructions', value)}
          placeholder={APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.instructions.placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
          multiline
          numberOfLines={14}
          textAlignVertical="top"
          autoCapitalize="sentences"
        />
        <Text style={styles.sectionHelperText}>{APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.instructions.helper}</Text>

        <TouchableOpacity
          style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaveDisabled}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel(getAppShellEditorActionLabel('skill', isEditing))}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.colors.primaryForeground} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>{getAppShellEditorActionLabel('skill', isEditing)}</Text>
          )}
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
    helperText: { fontSize: 12, color: theme.colors.mutedForeground, marginBottom: spacing.sm },
    label: { fontSize: 14, fontWeight: '500', color: theme.colors.foreground, marginBottom: spacing.xs, marginTop: spacing.md },
    sectionHelperText: { fontSize: 12, color: theme.colors.mutedForeground, marginBottom: spacing.sm },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 14,
      color: theme.colors.foreground,
      backgroundColor: theme.colors.background,
    },
    disabledInput: { opacity: 0.7 },
    instructionsInput: {
      minHeight: 240,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: undefined }),
    },
    saveButton: { marginTop: spacing.xl, backgroundColor: theme.colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: theme.colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  });
}
