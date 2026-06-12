import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius, type Theme } from '../ui/theme';
import { ExtendedSettingsApiClient, Goal, Decision } from '../lib/settingsApi';
import { useConfigContext } from '../store/config';

const LEVEL_LABELS = {
  goal: 'Big Goals',
  week: 'This Week',
  today: "Today's Focus",
} as const;

export default function GoalsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { config } = useConfigContext();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [pendingDecisions, setPendingDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => {
    if (!config.baseUrl || !config.apiKey) return null;
    return new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
  }, [config.baseUrl, config.apiKey]);

  const load = useCallback(async () => {
    if (!client) {
      setError('Configure Base URL and API key to load goals');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [goalsResponse, decisionsResponse] = await Promise.all([
        client.getGoals(),
        client.getDecisions('pending'),
      ]);
      setGoals(goalsResponse.goals);
      setPendingDecisions(decisionsResponse.decisions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [load, navigation]);

  const pendingByGoalId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const decision of pendingDecisions) {
      if (!decision.goalId) continue;
      counts.set(decision.goalId, (counts.get(decision.goalId) ?? 0) + 1);
    }
    return counts;
  }, [pendingDecisions]);

  const grouped = useMemo(() => {
    const groups: Record<Goal['level'], Goal[]> = { goal: [], week: [], today: [] };
    for (const goal of goals) groups[goal.level].push(goal);
    for (const level of Object.keys(groups) as Goal['level'][]) {
      groups[level].sort((a, b) => a.priority - b.priority || b.updatedAt - a.updatedAt);
    }
    return groups;
  }, [goals]);

  const updateStatus = async (goal: Goal, status: Goal['status']) => {
    if (!client) return;
    await client.updateGoal(goal.id, { status });
    await load();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={theme.colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>Goal OS</Text>
        <Text style={styles.title}>Goals</Text>
        <Text style={styles.subtitle}>Active goals with success criteria are visible to repeat-task loops.</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Active" value={goals.filter(goal => goal.status === 'active').length} styles={styles} />
        <StatCard label="Today" value={grouped.today.length} styles={styles} />
        <StatCard label="Blocked" value={new Set(pendingDecisions.map(d => d.goalId).filter(Boolean)).size} styles={styles} />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('GoalEdit')}
        accessibilityRole="button"
        accessibilityLabel="Create goal"
      >
        <Text style={styles.primaryButtonText}>Create Goal</Text>
      </TouchableOpacity>

      {isLoading && goals.length === 0 ? <ActivityIndicator color={theme.colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {(Object.keys(LEVEL_LABELS) as Goal['level'][]).map((level) => (
        <View key={level} style={styles.section}>
          <Text style={styles.sectionTitle}>{LEVEL_LABELS[level]}</Text>
          {grouped[level].length === 0 ? (
            <Text style={styles.empty}>No {LEVEL_LABELS[level].toLowerCase()} yet.</Text>
          ) : grouped[level].map((goal) => (
            <View key={goal.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{goal.title}</Text>
                  <Text style={styles.muted}>{goal.description || 'No description yet.'}</Text>
                </View>
                <Text style={styles.badge}>P{goal.priority}</Text>
              </View>
              <Text style={styles.bodyText}>Success: {goal.successCriteria || 'Hidden from loops until defined.'}</Text>
              {(pendingByGoalId.get(goal.id) ?? 0) > 0 ? (
                <Text style={styles.warning}>{pendingByGoalId.get(goal.id)} pending decision(s)</Text>
              ) : null}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('GoalEdit', { goal })}>
                  <Text style={styles.secondaryButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => updateStatus(goal, goal.status === 'active' ? 'paused' : 'active')}>
                  <Text style={styles.secondaryButtonText}>{goal.status === 'active' ? 'Pause' : 'Activate'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => updateStatus(goal, 'done')}>
                  <Text style={styles.secondaryButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function StatCard({ label, value, styles }: { label: string; value: number; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
    header: { gap: spacing.xs },
    kicker: { ...theme.typography.caption, textTransform: 'uppercase', letterSpacing: 2 },
    title: { ...theme.typography.h1 },
    subtitle: { ...theme.typography.bodyMuted },
    statsGrid: { flexDirection: 'row', gap: spacing.sm },
    statCard: { ...theme.card, flex: 1, padding: spacing.md },
    statLabel: { ...theme.typography.caption },
    statValue: { ...theme.typography.h2 },
    primaryButton: { backgroundColor: theme.colors.primary, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
    primaryButtonText: { color: theme.colors.primaryForeground, fontWeight: '700' },
    section: { gap: spacing.sm },
    sectionTitle: { ...theme.typography.h2 },
    card: { ...theme.card, gap: spacing.sm },
    cardHeader: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    cardTitle: { ...theme.typography.label, fontSize: 16 },
    muted: { ...theme.typography.bodyMuted },
    bodyText: { ...theme.typography.body },
    warning: { ...theme.typography.body, color: theme.colors.warning ?? theme.colors.primary },
    badge: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '700' },
    actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    secondaryButton: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    secondaryButtonText: { ...theme.typography.label },
    empty: { ...theme.typography.bodyMuted },
    error: { ...theme.typography.body, color: theme.colors.destructive },
  });
}
