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
import { useConfigContext } from '../store/config';

const IMPORTANCE_OPTIONS: { label: string; value: MemoryImportance }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
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

  const memoryFromRoute = route.params?.memory as Memory | undefined;
  const memoryId = route.params?.memoryId as string | undefined;
  const effectiveMemoryId = memoryId ?? memoryFromRoute?.id;
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
    if (!settingsClient) return;
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
      <View style={styles.optionRow}>
        {IMPORTANCE_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[styles.option, formData.importance === option.value && styles.optionActive]}
            onPress={() => updateField('importance', option.value)}
          >
            <Text style={[styles.optionText, formData.importance === option.value && styles.optionTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
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

      <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
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
    label: { fontSize: 14, fontWeight: '500', color: theme.colors.foreground, marginBottom: spacing.xs, marginTop: spacing.md },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 14, color: theme.colors.foreground, backgroundColor: theme.colors.background },
    textArea: { minHeight: 120 },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    option: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    optionActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    optionText: { color: theme.colors.foreground, fontSize: 13 },
    optionTextActive: { color: theme.colors.primaryForeground, fontWeight: '600' },
    saveButton: { marginTop: spacing.xl, backgroundColor: theme.colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: theme.colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  });
}
