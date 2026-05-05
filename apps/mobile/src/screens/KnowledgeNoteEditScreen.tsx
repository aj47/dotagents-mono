import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius } from '../ui/theme';
import {
  ExtendedSettingsApiClient,
  KnowledgeNote,
  KnowledgeNoteContext,
  KnowledgeNoteCreateRequest,
  KnowledgeNoteUpdateRequest,
} from '../lib/settingsApi';
import { createButtonAccessibilityLabel, createMinimumTouchTargetStyle } from '../lib/accessibility';
import { useConfigContext } from '../store/config';
import {
  formatKnowledgeNoteReferencesInput,
  formatKnowledgeNoteTagsInput,
  parseKnowledgeNoteReferencesInput,
  parseKnowledgeNoteTagsInput,
} from '@dotagents/shared/knowledge-note-form';

const CONTEXT_OPTIONS: { label: string; value: KnowledgeNoteContext; description: string }[] = [
  { label: 'Search only', value: 'search-only', description: 'Keep this note available for search and explicit retrieval.' },
  { label: 'Auto', value: 'auto', description: 'Allow this note to be considered for automatic runtime loading.' },
];

type KnowledgeNoteFormData = {
  noteId: string;
  title: string;
  context: KnowledgeNoteContext;
  summary: string;
  body: string;
  tagsInput: string;
  referencesInput: string;
};

const defaultFormData: KnowledgeNoteFormData = {
  noteId: '',
  title: '',
  context: 'search-only',
  summary: '',
  body: '',
  tagsInput: '',
  referencesInput: '',
};

const toFormData = (note: KnowledgeNote): KnowledgeNoteFormData => ({
  noteId: note.id,
  title: note.title,
  context: note.context ?? 'search-only',
  summary: note.summary ?? '',
  body: note.body,
  tagsInput: formatKnowledgeNoteTagsInput(note.tags),
  referencesInput: formatKnowledgeNoteReferencesInput(note.references, 'comma'),
});

export default function KnowledgeNoteEditScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { config } = useConfigContext();

  const noteFromRoute = route.params?.note as KnowledgeNote | undefined;
  const noteId = route.params?.noteId as string | undefined;
  const effectiveNoteId = noteId ?? noteFromRoute?.id;
  const isEditing = !!effectiveNoteId;

  const [formData, setFormData] = useState<KnowledgeNoteFormData>(() =>
    noteFromRoute ? toFormData(noteFromRoute) : defaultFormData
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
    navigation.setOptions({ title: isEditing ? 'Edit Note' : 'Create Note' });
  }, [isEditing, navigation]);

  useEffect(() => {
    if (isEditing && !noteFromRoute && !settingsClient) {
      setIsLoading(false);
      setError('Configure Base URL and API key to load and save notes');
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
          setError(err.message || 'Failed to load note');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [effectiveNoteId, isEditing, noteFromRoute, settingsClient]);

  const updateField = useCallback(<K extends keyof KnowledgeNoteFormData>(key: K, value: KnowledgeNoteFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!settingsClient) {
      setError('Configure Base URL and API key in Settings before saving this note');
      return;
    }

    const noteIdValue = formData.noteId.trim();
    const title = formData.title.trim();
    const summary = formData.summary.trim();
    const body = formData.body.trim();

    if (!title || !body) {
      setError('Title and body are required');
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
      setError(err.message || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }, [effectiveNoteId, formData, isEditing, navigation, settingsClient]);

  const isSaveDisabled = isSaving || !settingsClient;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading note...</Text>
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
        {!settingsClient && (
          <Text style={styles.helperText}>Configure Base URL and API key in Settings to save note changes.</Text>
        )}

        <Text style={styles.label}>Note ID</Text>
        <TextInput
          style={[styles.input, isEditing && styles.disabledInput]}
          value={formData.noteId}
          onChangeText={value => updateField('noteId', value)}
          placeholder="optional-custom-note-id"
          placeholderTextColor={theme.colors.mutedForeground}
          autoCapitalize="none"
          editable={!isEditing}
        />
        <Text style={styles.sectionHelperText}>
          {isEditing ? 'Note IDs are fixed after creation.' : 'Optional. Leave blank to derive an ID from the title.'}
        </Text>

        <Text style={styles.label}>Note title *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={value => updateField('title', value)}
          placeholder="Project architecture"
          placeholderTextColor={theme.colors.mutedForeground}
        />

        <Text style={styles.label}>Context</Text>
        <Text style={styles.sectionHelperText}>Context controls retrieval behavior. Use auto only when the note should be considered for automatic runtime loading.</Text>
        <View style={styles.noteContextOptions}>
          {CONTEXT_OPTIONS.map(option => {
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

        <Text style={styles.label}>Summary</Text>
        <TextInput
          style={[styles.input, styles.summaryInput]}
          value={formData.summary}
          onChangeText={value => updateField('summary', value)}
          placeholder="Short note summary"
          placeholderTextColor={theme.colors.mutedForeground}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.sectionHelperText}>Canonical files live at .agents/knowledge/&lt;slug&gt;/&lt;slug&gt;.md.</Text>

        <Text style={styles.label}>Body *</Text>
        <TextInput
          style={[styles.input, styles.bodyInput]}
          value={formData.body}
          onChangeText={value => updateField('body', value)}
          placeholder="Detailed knowledge note body"
          placeholderTextColor={theme.colors.mutedForeground}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Tags</Text>
        <TextInput
          style={styles.input}
          value={formData.tagsInput}
          onChangeText={value => updateField('tagsInput', value)}
          placeholder="project, preference, follow-up"
          placeholderTextColor={theme.colors.mutedForeground}
          autoCapitalize="none"
        />

        <Text style={styles.label}>References</Text>
        <TextInput
          style={styles.input}
          value={formData.referencesInput}
          onChangeText={value => updateField('referencesInput', value)}
          placeholder="docs/architecture.md, https://example.com/design"
          placeholderTextColor={theme.colors.mutedForeground}
          autoCapitalize="none"
        />

        <TouchableOpacity style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaveDisabled}>
          {isSaving ? <ActivityIndicator color={theme.colors.primaryForeground} size="small" /> : <Text style={styles.saveButtonText}>{isEditing ? 'Save Note' : 'Create Note'}</Text>}
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
