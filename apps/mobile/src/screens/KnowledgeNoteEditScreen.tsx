import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../ui/ThemeProvider';
import { AppShellEditorLayout } from '../ui/AppShellEditorLayout';
import { spacing, radius } from '../ui/theme';
import type {
  KnowledgeNote,
  KnowledgeNoteCreateRequest,
  KnowledgeNoteUpdateRequest,
} from '@dotagents/shared/api-types';
import { ExtendedSettingsApiClient } from '../lib/settingsApi';
import { createButtonAccessibilityLabel, createMinimumTouchTargetStyle } from '@dotagents/shared/accessibility-utils';
import { useConfigContext } from '../store/config';
import {
  DEFAULT_KNOWLEDGE_NOTE_EDIT_FORM_DATA,
  formatKnowledgeNoteEditFormData,
  KNOWLEDGE_NOTE_EDIT_CONTEXT_OPTIONS,
  parseKnowledgeNoteReferencesInput,
  parseKnowledgeNoteTagsInput,
  type KnowledgeNoteEditFormData,
} from '@dotagents/shared/knowledge-note-form';
import {
  APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION,
  getAppShellEditorActionLabel,
  getAppShellEditorTitle,
} from '@dotagents/shared/app-shell';

const toFormData = (note: KnowledgeNote): KnowledgeNoteEditFormData =>
  formatKnowledgeNoteEditFormData(note, { referencesInputFormat: 'comma' });

export default function KnowledgeNoteEditScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { config } = useConfigContext();

  const noteFromRoute = route.params?.note as KnowledgeNote | undefined;
  const noteId = route.params?.noteId as string | undefined;
  const effectiveNoteId = noteId ?? noteFromRoute?.id;
  const isEditing = !!effectiveNoteId;

  const [formData, setFormData] = useState<KnowledgeNoteEditFormData>(() =>
    noteFromRoute ? toFormData(noteFromRoute) : DEFAULT_KNOWLEDGE_NOTE_EDIT_FORM_DATA
  );
  const [isLoading, setIsLoading] = useState(isEditing && !noteFromRoute);
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
    navigation.setOptions({ title: getAppShellEditorTitle('knowledgeNote', isEditing) });
  }, [isEditing, navigation]);

  useEffect(() => {
    if (isEditing && !noteFromRoute && !settingsClient) {
      setIsLoading(false);
      setError(APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.unavailableLoadSaveError);
    }
  }, [isEditing, noteFromRoute, settingsClient]);

  useEffect(() => {
    if (!isEditing || noteFromRoute || !settingsClient || !effectiveNoteId) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    settingsClient.getKnowledgeNote(effectiveNoteId)
      .then((res) => {
        if (cancelled) return;
        setFormData(toFormData(res.note));
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.errors.loadFailed);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [effectiveNoteId, isEditing, noteFromRoute, settingsClient]);

  const updateField = useCallback(<K extends keyof KnowledgeNoteEditFormData>(key: K, value: KnowledgeNoteEditFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!settingsClient) {
      setError(APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.unavailableSaveError);
      return;
    }

    const noteIdValue = formData.noteId.trim();
    const title = formData.title.trim();
    const summary = formData.summary.trim();
    const body = formData.body.trim();

    if (!title || !body) {
      setError(APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.validation.titleAndBodyRequired);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const tags = parseKnowledgeNoteTagsInput(formData.tagsInput);
      const references = parseKnowledgeNoteReferencesInput(formData.referencesInput);

      if (isEditing && effectiveNoteId) {
        const updatePayload: KnowledgeNoteUpdateRequest = {
          title,
          summary: summary || undefined,
          body,
          context: formData.context,
          tags,
          references,
        };
        await settingsClient.updateKnowledgeNote(effectiveNoteId, updatePayload);
      } else {
        const createPayload: KnowledgeNoteCreateRequest = {
          id: noteIdValue || undefined,
          title,
          summary: summary || undefined,
          body,
          context: formData.context,
          tags,
          references,
        };
        await settingsClient.createKnowledgeNote(createPayload);
      }

      navigation.goBack();
    } catch (err: any) {
      setError(err.message || APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.errors.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }, [effectiveNoteId, formData, isEditing, navigation, settingsClient]);

  const isSaveDisabled = isSaving || !settingsClient;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.loadingLabel}</Text>
      </View>
    );
  }

  return (
    <AppShellEditorLayout title={getAppShellEditorTitle('knowledgeNote', isEditing)}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!settingsClient && (
          <Text style={styles.helperText}>{APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.unavailableSaveHelper}</Text>
        )}

        <Text style={styles.label}>{APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.noteId.label}</Text>
        <TextInput
          style={[styles.input, isEditing && styles.disabledInput]}
          value={formData.noteId}
          onChangeText={value => updateField('noteId', value)}
          placeholder={APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.noteId.placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
          autoCapitalize="none"
          editable={!isEditing}
        />
        <Text style={styles.sectionHelperText}>
          {isEditing
            ? APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.noteId.editHelper
            : APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.noteId.createHelper}
        </Text>

        <Text style={styles.label}>{APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.title.requiredLabel}</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={value => updateField('title', value)}
          placeholder={APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.title.placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
        />

        <Text style={styles.label}>{APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.context.label}</Text>
        <Text style={styles.sectionHelperText}>{APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.context.helper}</Text>
        <View style={styles.noteContextOptions}>
          {KNOWLEDGE_NOTE_EDIT_CONTEXT_OPTIONS.map(option => {
            const isSelected = formData.context === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.noteContextOption, isSelected && styles.noteContextOptionActive]}
                onPress={() => updateField('context', option.value)}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(`Set note context to ${option.label}`)}
                accessibilityHint={isSelected ? `Currently selected. ${option.description}` : option.description}
                accessibilityState={{ selected: isSelected, disabled: isSaving }}
                disabled={isSaving}
              >
                <View style={styles.noteContextOptionInfo}>
                  <Text style={[styles.noteContextOptionText, isSelected && styles.noteContextOptionTextActive]}>{option.label}</Text>
                  <Text style={[styles.noteContextOptionHelperText, isSelected && styles.noteContextOptionHelperTextActive]}>{option.description}</Text>
                </View>
                {isSelected && <Text style={styles.noteContextOptionCheckmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>{APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.summary.label}</Text>
        <TextInput
          style={[styles.input, styles.summaryInput]}
          value={formData.summary}
          onChangeText={value => updateField('summary', value)}
          placeholder={APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.summary.placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.sectionHelperText}>{APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.summary.helper}</Text>

        <Text style={styles.label}>{APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.body.requiredLabel}</Text>
        <TextInput
          style={[styles.input, styles.bodyInput]}
          value={formData.body}
          onChangeText={value => updateField('body', value)}
          placeholder={APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.body.placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />

        <Text style={styles.label}>{APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.tags.label}</Text>
        <TextInput
          style={styles.input}
          value={formData.tagsInput}
          onChangeText={value => updateField('tagsInput', value)}
          placeholder={APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.tags.placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
          autoCapitalize="none"
        />

        <Text style={styles.label}>{APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.references.label}</Text>
        <TextInput
          style={styles.input}
          value={formData.referencesInput}
          onChangeText={value => updateField('referencesInput', value)}
          placeholder={APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.references.placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
          autoCapitalize="none"
        />

        <TouchableOpacity style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaveDisabled}>
          {isSaving ? <ActivityIndicator color={theme.colors.primaryForeground} size="small" /> : <Text style={styles.saveButtonText}>{getAppShellEditorActionLabel('knowledgeNote', isEditing)}</Text>}
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
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: theme.colors.foreground, backgroundColor: theme.colors.background },
    disabledInput: { opacity: 0.7 },
    summaryInput: { minHeight: 100 },
    bodyInput: { minHeight: 180 },
    noteContextOptions: { width: '100%' as const, gap: spacing.xs },
    noteContextOption: {
      ...createMinimumTouchTargetStyle({ minSize: 44, horizontalPadding: spacing.md, verticalPadding: spacing.sm, horizontalMargin: 0 }),
      width: '100%' as const,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      backgroundColor: theme.colors.background,
    },
    noteContextOptionActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    noteContextOptionInfo: { flex: 1, minWidth: 0 },
    noteContextOptionText: { color: theme.colors.foreground, fontSize: 14, fontWeight: '500' },
    noteContextOptionTextActive: { color: theme.colors.primaryForeground, fontWeight: '600' },
    noteContextOptionHelperText: { color: theme.colors.mutedForeground, fontSize: 12, marginTop: 2 },
    noteContextOptionHelperTextActive: { color: theme.colors.primaryForeground },
    noteContextOptionCheckmark: { color: theme.colors.primaryForeground, fontSize: 16, fontWeight: '700', marginLeft: spacing.sm },
    saveButton: { marginTop: spacing.xl, backgroundColor: theme.colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: theme.colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  });
}
