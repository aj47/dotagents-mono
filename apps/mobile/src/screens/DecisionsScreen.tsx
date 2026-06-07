import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius, type Theme } from '../ui/theme';
import { Decision, ExtendedSettingsApiClient, Goal } from '../lib/settingsApi';
import { useConfigContext } from '../store/config';

type Tab = 'pending' | 'history';

export default function DecisionsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { config } = useConfigContext();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [tab, setTab] = useState<Tab>('pending');
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => {
    if (!config.baseUrl || !config.apiKey) return null;
    return new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
  }, [config.baseUrl, config.apiKey]);

  const load = useCallback(async () => {
    if (!client) {
      setError('Configure Base URL and API key to load decisions');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [decisionResponse, goalResponse] = await Promise.all([
        client.getDecisions(tab),
        client.getGoals(),
      ]);
      setDecisions(decisionResponse.decisions);
      setGoals(goalResponse.goals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decisions');
    } finally {
      setIsLoading(false);
    }
  }, [client, tab]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [load, navigation]);

  useEffect(() => {
    void load();
  }, [load]);

  const goalsById = useMemo(() => new Map(goals.map(goal => [goal.id, goal] as const)), [goals]);

  const respond = async (decision: Decision, answer: string) => {
    if (!client) return;
    await client.respondToDecision(decision.id, { answer, answerSource: 'aj' });
    await load();
  };

  const setAside = async (decision: Decision, action: 'defer' | 'cancel') => {
    if (!client) return;
    if (action === 'defer') await client.deferDecision(decision.id);
    else await client.cancelDecision(decision.id);
    await load();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={theme.colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>Decision Queue</Text>
        <Text style={styles.title}>Decisions</Text>
        <Text style={styles.subtitle}>Fast answers for irreversible, path-changing, or expensive-to-revert calls.</Text>
      </View>

      <View style={styles.segmented}>
        {(['pending', 'history'] as Tab[]).map((item) => (
          <TouchableOpacity key={item} style={[styles.segment, tab === item && styles.segmentActive]} onPress={() => setTab(item)}>
            <Text style={[styles.segmentText, tab === item && styles.segmentTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && decisions.length === 0 ? <ActivityIndicator color={theme.colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {decisions.length === 0 ? <Text style={styles.empty}>No {tab} decisions.</Text> : null}

      {decisions.map((decision) => (
        <DecisionCard
          key={decision.id}
          decision={decision}
          goal={decision.goalId ? goalsById.get(decision.goalId) : undefined}
          styles={styles}
          onRespond={respond}
          onSetAside={setAside}
        />
      ))}
    </ScrollView>
  );
}

function DecisionCard({
  decision,
  goal,
  styles,
  onRespond,
  onSetAside,
}: {
  decision: Decision;
  goal?: Goal;
  styles: ReturnType<typeof createStyles>;
  onRespond: (decision: Decision, answer: string) => void;
  onSetAside: (decision: Decision, action: 'defer' | 'cancel') => void;
}) {
  const [customAnswer, setCustomAnswer] = useState('');
  const isPending = decision.status === 'pending';
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{decision.question}</Text>
          <Text style={styles.muted}>{goal ? `Goal: ${goal.title}` : decision.goalId || 'No linked goal'}</Text>
        </View>
        <Text style={styles.badge}>{decision.urgent ? 'urgent' : decision.type}</Text>
      </View>
      {decision.recommendation ? <Text style={styles.bodyText}>Recommendation: {decision.recommendation}</Text> : null}
      {decision.why ? <Text style={styles.muted}>Why: {decision.why}</Text> : null}
      {decision.risk ? <Text style={styles.muted}>Risk: {decision.risk}</Text> : null}
      <Text style={styles.muted}>Default: {decision.defaultAction || 'None'}</Text>
      {isPending ? (
        <>
          <View style={styles.actionGrid}>
            {decision.recommendation ? (
              <TouchableOpacity style={styles.primaryButton} onPress={() => onRespond(decision, decision.recommendation || '')}>
                <Text style={styles.primaryButtonText}>Accept</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.bigButton} onPress={() => onRespond(decision, 'yes')}><Text style={styles.bigButtonText}>Yes</Text></TouchableOpacity>
            <TouchableOpacity style={styles.bigButton} onPress={() => onRespond(decision, 'no')}><Text style={styles.bigButtonText}>No</Text></TouchableOpacity>
            <TouchableOpacity style={styles.bigButton} onPress={() => onSetAside(decision, 'defer')}><Text style={styles.bigButtonText}>Defer</Text></TouchableOpacity>
          </View>
          <View style={styles.customRow}>
            <TextInput
              value={customAnswer}
              onChangeText={setCustomAnswer}
              placeholder="Custom answer"
              placeholderTextColor={styles.placeholder.color}
              style={styles.input}
            />
            <TouchableOpacity style={styles.smallButton} onPress={() => {
              if (!customAnswer.trim()) return;
              onRespond(decision, customAnswer.trim());
              setCustomAnswer('');
            }}>
              <Text style={styles.smallButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => onSetAside(decision, 'cancel')}>
            <Text style={styles.cancelText}>Cancel decision</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.bodyText}>Answer: {decision.answer || 'None'}</Text>
      )}
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
    segmented: { flexDirection: 'row', gap: spacing.sm },
    segment: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
    segmentActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    segmentText: { ...theme.typography.label, textTransform: 'capitalize' },
    segmentTextActive: { color: theme.colors.primaryForeground },
    card: { ...theme.card, gap: spacing.sm },
    cardHeader: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    cardTitle: { ...theme.typography.label, fontSize: 17 },
    muted: { ...theme.typography.bodyMuted },
    bodyText: { ...theme.typography.body },
    badge: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '700' },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    primaryButton: { backgroundColor: theme.colors.primary, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    primaryButtonText: { color: theme.colors.primaryForeground, fontWeight: '700' },
    bigButton: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    bigButtonText: { ...theme.typography.label },
    customRow: { flexDirection: 'row', gap: spacing.sm },
    input: { ...theme.input, flex: 1, color: theme.colors.foreground },
    placeholder: { color: theme.colors.mutedForeground },
    smallButton: { backgroundColor: theme.colors.secondary, borderRadius: radius.md, paddingHorizontal: spacing.md, justifyContent: 'center' },
    smallButtonText: { color: theme.colors.secondaryForeground, fontWeight: '700' },
    cancelText: { ...theme.typography.caption, color: theme.colors.destructive },
    empty: { ...theme.typography.bodyMuted },
    error: { ...theme.typography.body, color: theme.colors.destructive },
  });
}
