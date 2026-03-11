import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius } from '../ui/theme';
import {
  ExtendedSettingsApiClient,
  Memory,
  MemoryCreateRequest,
  MemoryImportance,
  MemoryUpdateRequest,
} from '../lib/settingsApi';
import { createButtonAccessibilityLabel, createMinimumTouchTargetStyle } from '../lib/accessibility';
import { useConfigContext } from '../store/config';
import { getMemoryEditRouteContext } from './edit-route-params';

const IMPORTANCE_OPTIONS: { label: string; value: MemoryImportance; description: string }[] = [
  { label: 'Low', value: 'low', description: 'Background context the agent can use when space allows.' },
  { label: 'Medium', value: 'medium', description: 'Default priority for useful context that matters regularly.' },
  { label: 'High', value: 'high', description: 'Important guidance or preferences the agent should surface early.' },
  { label: 'Critical', value: 'critical', description: 'Must-not-miss context that should stay at the front of retrieval.' },
];

type MemoryFormData = {
  title: string;
  content: string;
  importance: MemoryImportance;
  tagsInput: string;
};

const defaultFormData: MemoryFormData = {
  title: '',
  content: '',
  importance: 'medium',
  tagsInput: '',
};

const tagsToInput = (tags?: string[]) => (Array.isArray(tags) ? tags.join(', ') : '');

const parseTags = (input: string) =>
  Array.from(new Set(input.split(',').map(tag => tag.trim()).filter(Boolean)));

export default function MemoryEditScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { config } = useConfigContext();

  const { memoryFromRoute, effectiveMemoryId } = getMemoryEditRouteContext(route.params);
  const isEditing = !!effectiveMemoryId;

  const [formData, setFormData] = useState<MemoryFormData>(() =>
    memoryFromRoute
      ? {
        title: memoryFromRoute.title,
        content: memoryFromRoute.content,
        importance: memoryFromRoute.importance,
        tagsInput: tagsToInput(memoryFromRoute.tags),
      }
      : defaultFormData
  );
  const [isLoading, setIsLoading] = useState(isEditing && !memoryFromRoute);
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
    navigation.setOptions({ title: isEditing ? 'Edit Memory' : 'Create Memory' });
  }, [isEditing, navigation]);

  useEffect(() => {
    if (isEditing && !memoryFromRoute && !settingsClient) {
      setIsLoading(false);
      setError('Configure Base URL and API key to load and save memories');
    }
  }, [isEditing, memoryFromRoute, settingsClient]);

  useEffect(() => {
    if (!isEditing || memoryFromRoute || !settingsClient || !effectiveMemoryId) {
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    settingsClient.getMemories()
      .then((res) => {
        if (cancelled) return;
        const memory = res.memories.find(m => m.id === effectiveMemoryId);
        if (!memory) {
          setError('Memory not found');
          return;
        }
        setFormData({
          title: memory.title,
          content: memory.content,
          importance: memory.importance,
          tagsInput: tagsToInput(memory.tags),
        });
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load memory');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [effectiveMemoryId, isEditing, memoryFromRoute, settingsClient]);

  const updateField = useCallback(<K extends keyof MemoryFormData>(key: K, value: MemoryFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!settingsClient) {
      setError('Configure Base URL and API key in Settings before saving');
      return;
    }
    const title = formData.title.trim();
    const content = formData.content.trim();
    if (!title || !content) {
      setError('Title and content are required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const tags = parseTags(formData.tagsInput);
      if (isEditing && effectiveMemoryId) {
        const updatePayload: MemoryUpdateRequest = {
          title,
          content,
          importance: formData.importance,
          tags,
        };
        await settingsClient.updateMemory(effectiveMemoryId, updatePayload);
      } else {
        const createPayload: MemoryCreateRequest = {
          title,
          content,
          importance: formData.importance,
          tags,
        };
        await settingsClient.createMemory(createPayload);
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to save memory');
    } finally {
      setIsSaving(false);
    }
  }, [effectiveMemoryId, formData, isEditing, navigation, settingsClient]);

  const isSaveDisabled = isSaving || !settingsClient;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading memory...</Text>
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
      {!settingsClient && (
        <Text style={styles.helperText}>Configure Base URL and API key in Settings to save changes.</Text>
      )}

      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        value={formData.title}
        onChangeText={v => updateField('title', v)}
        placeholder="Memory title"
        placeholderTextColor={theme.colors.mutedForeground}
      />

      <Text style={styles.label}>Content *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.content}
        onChangeText={v => updateField('content', v)}
        placeholder="What should the agent remember?"
        placeholderTextColor={theme.colors.mutedForeground}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Importance</Text>
      <Text style={styles.sectionHelperText}>Higher-priority memories are surfaced first when the agent loads context.</Text>
      <View style={styles.importanceOptions}>
        {IMPORTANCE_OPTIONS.map(option => {
          const isSelected = formData.importance === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.importanceOption, isSelected && styles.importanceOptionActive]}
              onPress={() => updateField('importance', option.value)}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(`Set memory importance to ${option.label}`)}
              accessibilityHint={isSelected ? `Currently selected. ${option.description}` : option.description}
              accessibilityState={{ selected: isSelected, disabled: isSaving }}
              disabled={isSaving}
            >
              <View style={styles.importanceOptionInfo}>
                <Text style={[styles.importanceOptionText, isSelected && styles.importanceOptionTextActive]}>{option.label}</Text>
                <Text style={[styles.importanceOptionHelperText, isSelected && styles.importanceOptionHelperTextActive]}>{option.description}</Text>
              </View>
              {isSelected && <Text style={styles.importanceOptionCheckmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Tags</Text>
      <TextInput
        style={styles.input}
        value={formData.tagsInput}
        onChangeText={v => updateField('tagsInput', v)}
        placeholder="project, preference, follow-up"
        placeholderTextColor={theme.colors.mutedForeground}
        autoCapitalize="none"
      />

      <TouchableOpacity style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaveDisabled}>
        {isSaving ? <ActivityIndicator color={theme.colors.primaryForeground} size="small" /> : <Text style={styles.saveButtonText}>{isEditing ? 'Save Memory' : 'Create Memory'}</Text>}
      </TouchableOpacity>
    </ScrollView>
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
    textArea: { minHeight: 120 },
    importanceOptions: { width: '100%' as const, gap: spacing.xs },
    importanceOption: {
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
    importanceOptionActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    importanceOptionInfo: { flex: 1, minWidth: 0 },
    importanceOptionText: { color: theme.colors.foreground, fontSize: 14, fontWeight: '500' },
    importanceOptionTextActive: { color: theme.colors.primaryForeground, fontWeight: '600' },
    importanceOptionHelperText: { color: theme.colors.mutedForeground, fontSize: 12, marginTop: 2 },
    importanceOptionHelperTextActive: { color: theme.colors.primaryForeground },
    importanceOptionCheckmark: { color: theme.colors.primaryForeground, fontSize: 16, fontWeight: '700', marginLeft: spacing.sm },
    saveButton: { marginTop: spacing.xl, backgroundColor: theme.colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: theme.colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  });
}
