import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius, type Theme } from '../ui/theme';
import { ExtendedSettingsApiClient, Goal, GoalCreateRequest, GoalLevel } from '../lib/settingsApi';
import { useConfigContext } from '../store/config';

export default function GoalEditScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { config } = useConfigContext();
  const goal = route.params?.goal as Goal | undefined;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [title, setTitle] = useState(goal?.title ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [level, setLevel] = useState<GoalLevel>(goal?.level ?? 'goal');
  const [priority, setPriority] = useState(String(goal?.priority ?? 3));
  const [successCriteria, setSuccessCriteria] = useState(goal?.successCriteria ?? '');
  const [abandonIf, setAbandonIf] = useState(goal?.abandonIf ?? '');
  const [body, setBody] = useState(goal?.body ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const client = useMemo(() => {
    if (!config.baseUrl || !config.apiKey) return null;
    return new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
  }, [config.baseUrl, config.apiKey]);

  const save = async () => {
    if (!client) {
      setError('Configure Base URL and API key to save goals');
      return;
    }
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setIsSaving(true);
    setError(null);
    const payload: GoalCreateRequest = {
      title: title.trim(),
      description: description.trim(),
      level,
      priority: Number(priority) || 3,
      successCriteria: successCriteria.trim() || undefined,
      abandonIf: abandonIf.trim() || undefined,
      body: body.trim(),
      createdBy: 'aj',
      createdFrom: 'manual',
      linkedTaskIds: [],
    };
    try {
      if (goal) await client.updateGoal(goal.id, payload);
      else await client.createGoal(payload);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{goal ? 'Edit Goal' : 'Create Goal'}</Text>
      <Field label="Title" value={title} onChangeText={setTitle} styles={styles} />
      <Field label="Description" value={description} onChangeText={setDescription} styles={styles} />
      <View style={styles.segmented}>
        {(['goal', 'week', 'today'] as GoalLevel[]).map((item) => (
          <TouchableOpacity key={item} style={[styles.segment, level === item && styles.segmentActive]} onPress={() => setLevel(item)}>
            <Text style={[styles.segmentText, level === item && styles.segmentTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Field label="Priority 1-5" value={priority} onChangeText={setPriority} keyboardType="number-pad" styles={styles} />
      <Field label="Success Criteria" value={successCriteria} onChangeText={setSuccessCriteria} styles={styles} />
      <Field label="Abandon If" value={abandonIf} onChangeText={setAbandonIf} styles={styles} />
      <Field label="Context" value={body} onChangeText={setBody} multiline styles={styles} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.primaryButton} onPress={save} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color={theme.colors.primaryForeground} /> : <Text style={styles.primaryButtonText}>Save Goal</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, styles, ...props }: { label: string; styles: ReturnType<typeof createStyles> } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={[styles.input, props.multiline && styles.textarea]} placeholderTextColor={styles.placeholder.color} />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
    title: { ...theme.typography.h1 },
    field: { gap: spacing.xs },
    label: { ...theme.typography.label },
    input: { ...theme.input, color: theme.colors.foreground },
    textarea: { minHeight: 120, textAlignVertical: 'top' },
    placeholder: { color: theme.colors.mutedForeground },
    segmented: { flexDirection: 'row', gap: spacing.sm },
    segment: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
    segmentActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    segmentText: { ...theme.typography.label },
    segmentTextActive: { color: theme.colors.primaryForeground },
    primaryButton: { backgroundColor: theme.colors.primary, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
    primaryButtonText: { color: theme.colors.primaryForeground, fontWeight: '700' },
    error: { ...theme.typography.body, color: theme.colors.destructive },
  });
}
