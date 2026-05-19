import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createButtonAccessibilityLabel,
  createSwitchAccessibilityLabel,
  createTextInputAccessibilityLabel,
} from '../lib/accessibility';
import { getDeviceIdentity } from '../lib/deviceIdentity';
import {
  ExtendedSettingsApiClient,
  OperatorAuditEntry,
  OperatorConversationItem,
  OperatorDiagnosticReport,
  OperatorDiscordIntegrationSummary,
  OperatorDiscordLogEntry,
  OperatorMessageQueueSummary,
  OperatorMCPServerLogEntry,
  OperatorMCPServerSummary,
  OperatorMCPToolSummary,
  OperatorRecentError,
  OperatorRuntimeStatus,
  OperatorTunnelSetupSummary,
  OperatorWhatsAppIntegrationSummary,
  Settings,
  SettingsUpdate,
} from '../lib/settingsApi';
import { saveConfig, useConfigContext } from '../store/config';
import { useTheme } from '../ui/ThemeProvider';
import { radius, spacing } from '../ui/theme';

const RECENT_ERROR_COUNT = 8;
const RECENT_AUDIT_ENTRY_COUNT = 10;
const DISCORD_LOG_PREVIEW_COUNT = 6;
const MCP_LOG_PREVIEW_COUNT = 20;
const ACTION_REFRESH_DELAY_MS = 1200;
const AUTO_REFRESH_INTERVAL_MS = 30_000;

type RemoteAccessDrafts = {
  remoteServerPort: string;
  remoteServerOperatorAllowDeviceIds: string;
  mcpAutoPasteDelay: string;
  cloudflareTunnelId: string;
  cloudflareTunnelHostname: string;
  cloudflareTunnelCredentialsPath: string;
  whatsappOperatorAllowFrom: string;
  discordOperatorAllowUserIds: string;
  discordOperatorAllowGuildIds: string;
  discordOperatorAllowChannelIds: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString();
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatYesNo(value?: boolean): string {
  if (value === undefined) return '—';
  return value ? 'Yes' : 'No';
}

function getTunnelStateLabel(status?: OperatorRuntimeStatus['tunnel'] | null): string {
  if (!status) return 'Unknown';
  if (status.running) return 'Running';
  if (status.starting) return 'Starting';
  return 'Stopped';
}

function formatLogSummary(logs?: { total: number; errorCount?: number; warningCount?: number; infoCount?: number }): string {
  if (!logs) return '—';
  const parts = [`${logs.total} total`];
  if (typeof logs.errorCount === 'number') parts.push(`${logs.errorCount} error`);
  if (typeof logs.warningCount === 'number') parts.push(`${logs.warningCount} warning`);
  if (typeof logs.infoCount === 'number') parts.push(`${logs.infoCount} info`);
  return parts.join(' • ');
}

function formatAuditSource(entry: OperatorAuditEntry): string | null {
  const parts = [entry.deviceId, entry.source?.ip, entry.source?.origin].filter(Boolean);
  return parts.length > 0 ? parts.join(' • ') : null;
}

function formatAuditDetails(details?: Record<string, unknown>): string | null {
  if (!details || Object.keys(details).length === 0) return null;

  return Object.entries(details)
    .map(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return `${key}: ${value}`;
      }

      try {
        return `${key}: ${JSON.stringify(value)}`;
      } catch {
        return `${key}: [unserializable]`;
      }
    })
    .join(' • ');
}

function buildDrafts(settings: Settings | null): RemoteAccessDrafts {
  return {
    remoteServerPort: String(settings?.remoteServerPort ?? 3210),
    remoteServerOperatorAllowDeviceIds: (settings?.remoteServerOperatorAllowDeviceIds ?? []).join(', '),
    mcpAutoPasteDelay: String(settings?.mcpAutoPasteDelay ?? 1000),
    cloudflareTunnelId: settings?.cloudflareTunnelId ?? '',
    cloudflareTunnelHostname: settings?.cloudflareTunnelHostname ?? '',
    cloudflareTunnelCredentialsPath: settings?.cloudflareTunnelCredentialsPath ?? '',
    whatsappOperatorAllowFrom: (settings?.whatsappOperatorAllowFrom ?? []).join(', '),
    discordOperatorAllowUserIds: (settings?.discordOperatorAllowUserIds ?? []).join(', '),
    discordOperatorAllowGuildIds: (settings?.discordOperatorAllowGuildIds ?? []).join(', '),
    discordOperatorAllowChannelIds: (settings?.discordOperatorAllowChannelIds ?? []).join(', '),
  };
}

function parseCommaSeparatedList(value: string): string[] {
  return [...new Set(
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  )];
}

function getOperatorMessageQueueTotalMessageCount(queues: OperatorMessageQueueSummary[]): number {
  return queues.reduce((sum, queue) => sum + queue.messageCount, 0);
}

function hasProcessingQueuedMessage(queue: OperatorMessageQueueSummary): boolean {
  return queue.messages.some((message) => message.status === 'processing');
}

function canMutateQueuedMessage(message: OperatorMessageQueueSummary['messages'][number]): boolean {
  return message.status !== 'processing';
}

function canEditQueuedMessage(message: OperatorMessageQueueSummary['messages'][number]): boolean {
  return message.status !== 'processing' && !message.addedToHistory;
}

function formatQueuedMessageStatus(message: OperatorMessageQueueSummary['messages'][number]): string {
  if (message.status === 'failed') return message.errorMessage ? `Failed: ${message.errorMessage}` : 'Failed';
  if (message.status === 'processing') return 'Processing';
  if (message.status === 'cancelled') return 'Cancelled';
  return 'Pending';
}

function previewQueuedMessage(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export default function OperationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { config, setConfig } = useConfigContext();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [status, setStatus] = useState<OperatorRuntimeStatus | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tunnelSetup, setTunnelSetup] = useState<OperatorTunnelSetupSummary | null>(null);
  const [discordSummary, setDiscordSummary] = useState<OperatorDiscordIntegrationSummary | null>(null);
  const [discordLogs, setDiscordLogs] = useState<OperatorDiscordLogEntry[]>([]);
  const [whatsAppSummary, setWhatsAppSummary] = useState<OperatorWhatsAppIntegrationSummary | null>(null);
  const [recentErrors, setRecentErrors] = useState<OperatorRecentError[]>([]);
  const [diagnosticReport, setDiagnosticReport] = useState<OperatorDiagnosticReport | null>(null);
  const [auditEntries, setAuditEntries] = useState<OperatorAuditEntry[]>([]);
  const [conversations, setConversations] = useState<OperatorConversationItem[]>([]);
  const [messageQueues, setMessageQueues] = useState<OperatorMessageQueueSummary[]>([]);
  const [mcpServers, setMcpServers] = useState<OperatorMCPServerSummary[]>([]);
  const [mcpServerLogs, setMcpServerLogs] = useState<Record<string, OperatorMCPServerLogEntry[]>>({});
  const [expandedMcpLogs, setExpandedMcpLogs] = useState<Set<string>>(new Set());
  const [mcpServerTools, setMcpServerTools] = useState<Record<string, OperatorMCPToolSummary[]>>({});
  const [expandedMcpTools, setExpandedMcpTools] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<RemoteAccessDrafts>(buildDrafts(null));
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingSetting, setPendingSetting] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [editingQueuedMessage, setEditingQueuedMessage] = useState<{
    conversationId: string;
    messageId: string;
    text: string;
  } | null>(null);

  const settingsClient = useMemo(() => {
    if (!config.baseUrl || !config.apiKey) {
      return null;
    }
    return new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
  }, [config.baseUrl, config.apiKey]);

  const loadOperatorData = useCallback(async (refresh: boolean = false) => {
    if (!settingsClient) {
      setStatus(null);
      setSettings(null);
      setTunnelSetup(null);
      setDiscordSummary(null);
      setDiscordLogs([]);
      setWhatsAppSummary(null);
      setRecentErrors([]);
      setDiagnosticReport(null);
      setAuditEntries([]);
      setConversations([]);
      setMessageQueues([]);
      setMcpServers([]);
      setMcpServerLogs({});
      setExpandedMcpLogs(new Set());
      setMcpServerTools({});
      setExpandedMcpTools(new Set());
      setDrafts(buildDrafts(null));
      setError(null);
      setEditingQueuedMessage(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    const [
      statusResult,
      errorsResult,
      settingsResult,
      tunnelSetupResult,
      discordResult,
      discordLogsResult,
      whatsAppResult,
      auditResult,
      conversationsResult,
      messageQueuesResult,
      mcpResult,
    ] = await Promise.allSettled([
      settingsClient.getOperatorStatus(),
      settingsClient.getOperatorErrors(RECENT_ERROR_COUNT),
      settingsClient.getSettings(),
      settingsClient.getOperatorTunnelSetup(),
      settingsClient.getOperatorDiscord(),
      settingsClient.getOperatorDiscordLogs(DISCORD_LOG_PREVIEW_COUNT),
      settingsClient.getOperatorWhatsApp(),
      settingsClient.getOperatorAudit(RECENT_AUDIT_ENTRY_COUNT),
      settingsClient.getOperatorConversations(10),
      settingsClient.getOperatorMessageQueues(),
      settingsClient.getOperatorMCP(),
    ]);

    const issues: string[] = [];

    if (statusResult.status === 'fulfilled') {
      setStatus(statusResult.value);
    } else {
      setStatus(null);
      issues.push(getErrorMessage(statusResult.reason));
    }

    if (errorsResult.status === 'fulfilled') {
      setRecentErrors(errorsResult.value.errors);
    } else {
      setRecentErrors([]);
      issues.push(getErrorMessage(errorsResult.reason));
    }

    if (settingsResult.status === 'fulfilled') {
      setSettings(settingsResult.value);
    } else {
      setSettings(null);
      issues.push(getErrorMessage(settingsResult.reason));
    }

    if (tunnelSetupResult.status === 'fulfilled') {
      setTunnelSetup(tunnelSetupResult.value);
    } else {
      setTunnelSetup(null);
      issues.push(getErrorMessage(tunnelSetupResult.reason));
    }

    if (discordResult.status === 'fulfilled') {
      setDiscordSummary(discordResult.value);
    } else {
      setDiscordSummary(null);
      issues.push(getErrorMessage(discordResult.reason));
    }

    if (discordLogsResult.status === 'fulfilled') {
      setDiscordLogs(discordLogsResult.value.logs);
    } else {
      setDiscordLogs([]);
      issues.push(getErrorMessage(discordLogsResult.reason));
    }

    if (whatsAppResult.status === 'fulfilled') {
      setWhatsAppSummary(whatsAppResult.value);
    } else {
      setWhatsAppSummary(null);
      issues.push(getErrorMessage(whatsAppResult.reason));
    }

    if (auditResult.status === 'fulfilled') {
      setAuditEntries(auditResult.value.entries);
    } else {
      setAuditEntries([]);
      issues.push(getErrorMessage(auditResult.reason));
    }

    if (conversationsResult.status === 'fulfilled') {
      setConversations(conversationsResult.value.conversations);
    } else {
      setConversations([]);
    }

    if (messageQueuesResult.status === 'fulfilled') {
      setMessageQueues(messageQueuesResult.value.queues);
    } else {
      setMessageQueues([]);
    }

    if (mcpResult.status === 'fulfilled') {
      setMcpServers(mcpResult.value.servers);
    } else {
      setMcpServers([]);
    }

    setError(issues.length > 0 ? issues.join(' • ') : null);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [settingsClient]);

  useEffect(() => {
    void loadOperatorData();
  }, [loadOperatorData]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      void loadOperatorData(true);
    });
    return unsubscribe;
  }, [loadOperatorData, navigation]);

  // Auto-refresh heartbeat — silently polls every 30 s while the screen is mounted
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!settingsClient) {
      return;
    }
    autoRefreshRef.current = setInterval(() => {
      void loadOperatorData(true);
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    };
  }, [loadOperatorData, settingsClient]);

  useEffect(() => {
    setDrafts(buildDrafts(settings));
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    void getDeviceIdentity()
      .then((identity) => {
        if (!cancelled) {
          setCurrentDeviceId(identity.deviceId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentDeviceId(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const confirmAction = useCallback((
    title: string,
    message: string,
    confirmLabel: string,
    destructive: boolean,
    onConfirm: () => void | Promise<void>,
  ) => {
    const runConfirmedAction = () => {
      void Promise.resolve(onConfirm()).catch((actionError) => {
        Alert.alert('Action Failed', getErrorMessage(actionError));
      });
    };

    if (Platform.OS === 'web') {
      const confirmFn = (globalThis as { confirm?: (text?: string) => boolean }).confirm;
      if (confirmFn && !confirmFn(`${title}\n\n${message}`)) {
        return;
      }
      runConfirmedAction();
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: runConfirmedAction },
    ]);
  }, []);

  const handleRefresh = useCallback(async () => {
    setPendingAction('refresh');
    setActionFeedback(null);
    try {
      await loadOperatorData(true);
    } finally {
      setPendingAction(null);
    }
  }, [loadOperatorData]);

  const rotateApiKey = useCallback(async () => {
    if (!settingsClient) {
      Alert.alert('Connection Required', 'Configure your desktop server connection before rotating the API key.');
      return;
    }

    setPendingAction('rotate-api-key');
    setActionFeedback(null);

    try {
      const response = await settingsClient.rotateOperatorApiKey();
      if (!response.success) {
        throw new Error(response.error || response.message || 'API key rotation failed');
      }

      const nextConfig = {
        ...config,
        apiKey: response.apiKey,
      };

      setConfig(nextConfig);
      await saveConfig(nextConfig);
      setActionFeedback(
        response.restartScheduled
          ? 'API key rotated and saved locally. The desktop remote server is restarting with the new key.'
          : 'API key rotated and saved locally.',
      );
    } catch (actionError) {
      Alert.alert('Action Failed', getErrorMessage(actionError));
    } finally {
      setPendingAction(null);
    }
  }, [config, setConfig, settingsClient]);

  const runAction = useCallback(async (
    action: string,
    request: () => Promise<{ success: boolean; message?: string; error?: string }>,
    refreshAfter: boolean = true,
  ) => {
    if (!settingsClient) {
      Alert.alert('Connection Required', 'Configure your desktop server connection before using operator actions.');
      return;
    }

    setPendingAction(action);
    setActionFeedback(null);
    try {
      const response = await request();
      if (!response.success) {
        throw new Error(response.error || response.message || 'Action failed');
      }

      setActionFeedback(response.message || 'Action completed');

      if (refreshAfter) {
        setTimeout(() => {
          void loadOperatorData(true);
        }, ACTION_REFRESH_DELAY_MS);
      }
    } catch (actionError) {
      Alert.alert('Action Failed', getErrorMessage(actionError));
    } finally {
      setPendingAction(null);
    }
  }, [loadOperatorData, settingsClient]);

  const loadDiagnosticReport = useCallback(async () => {
    if (!settingsClient) {
      Alert.alert('Connection Required', 'Configure your desktop server connection before loading diagnostics.');
      return;
    }

    setPendingAction('diagnostic-report');
    setActionFeedback(null);
    try {
      const report = await settingsClient.getOperatorDiagnosticReport();
      setDiagnosticReport(report);
      setActionFeedback(`Diagnostic report generated with ${report.errors.length} logged events.`);
    } catch (actionError) {
      Alert.alert('Action Failed', getErrorMessage(actionError));
    } finally {
      setPendingAction(null);
    }
  }, [settingsClient]);

  const applySettingsUpdate = useCallback(async (
    updates: SettingsUpdate,
    fieldLabel: string,
    successMessage: string,
  ) => {
    if (!settingsClient || !settings) {
      Alert.alert('Connection Required', 'Load the connected desktop settings before saving operator changes.');
      return;
    }

    const previousSettings = settings;
    const touchesConnection =
      Object.prototype.hasOwnProperty.call(updates, 'remoteServerEnabled')
      || Object.prototype.hasOwnProperty.call(updates, 'remoteServerPort')
      || Object.prototype.hasOwnProperty.call(updates, 'remoteServerBindAddress');

    setPendingSetting(fieldLabel);
    setActionFeedback(null);
    setSettings({ ...settings, ...updates });

    try {
      await settingsClient.updateSettings(updates);
      setActionFeedback(
        touchesConnection
          ? `${successMessage} Connection details may take a moment to settle.`
          : successMessage,
      );

      if (!touchesConnection) {
        setTimeout(() => {
          void loadOperatorData(true);
        }, 150);
      }
    } catch (updateError) {
      setSettings(previousSettings);
      Alert.alert('Update Failed', getErrorMessage(updateError));
      void loadOperatorData(true);
    } finally {
      setPendingSetting(null);
    }
  }, [loadOperatorData, settings, settingsClient]);

  const handleAutoPasteDelaySave = useCallback(() => {
    const parsed = Number.parseInt(drafts.mcpAutoPasteDelay.trim(), 10);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 60000) {
      Alert.alert('Invalid Delay', 'Enter a delay between 0 and 60000 milliseconds.');
      setDrafts((current) => ({
        ...current,
        mcpAutoPasteDelay: String(settings?.mcpAutoPasteDelay ?? 1000),
      }));
      return;
    }

    void applySettingsUpdate({ mcpAutoPasteDelay: parsed }, 'auto-paste delay', `Auto-paste delay saved as ${parsed} ms.`);
  }, [applySettingsUpdate, drafts.mcpAutoPasteDelay, settings?.mcpAutoPasteDelay]);

  const handleRemoteServerEnabledToggle = useCallback((nextValue: boolean) => {
    if (!settings?.remoteServerEnabled && nextValue) {
      void applySettingsUpdate({ remoteServerEnabled: true }, 'remote server', 'Remote server enabled.');
      return;
    }

    if (settings?.remoteServerEnabled && !nextValue) {
      confirmAction(
        'Disable Remote Server',
        'Turn off the desktop remote server? This mobile operator session may disconnect immediately.',
        'Disable Server',
        true,
        () => applySettingsUpdate({ remoteServerEnabled: false }, 'remote server', 'Remote server disable scheduled.'),
      );
      return;
    }

    void applySettingsUpdate({ remoteServerEnabled: nextValue }, 'remote server', 'Remote server updated.');
  }, [applySettingsUpdate, confirmAction, settings?.remoteServerEnabled]);

  const handleRemoteServerPortSave = useCallback(() => {
    const parsed = Number.parseInt(drafts.remoteServerPort.trim(), 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      Alert.alert('Invalid Port', 'Enter a whole number between 1 and 65535.');
      setDrafts((current) => ({
        ...current,
        remoteServerPort: String(settings?.remoteServerPort ?? 3210),
      }));
      return;
    }

    void applySettingsUpdate({ remoteServerPort: parsed }, 'remote server port', `Remote server port saved as ${parsed}.`);
  }, [applySettingsUpdate, drafts.remoteServerPort, settings?.remoteServerPort]);

  const loadMcpServerLogs = useCallback(async (serverName: string) => {
    if (!settingsClient) {
      Alert.alert('Connection Required', 'Configure your desktop server connection before loading MCP logs.');
      return;
    }

    const action = `mcp-logs:${serverName}`;
    setPendingAction(action);
    setActionFeedback(null);
    try {
      const response = await settingsClient.getOperatorMCPServerLogs(serverName, MCP_LOG_PREVIEW_COUNT);
      setMcpServerLogs((current) => ({ ...current, [serverName]: response.logs }));
      setExpandedMcpLogs((current) => new Set(current).add(serverName));
    } catch (actionError) {
      Alert.alert('Action Failed', getErrorMessage(actionError));
    } finally {
      setPendingAction(null);
    }
  }, [settingsClient]);

  const toggleMcpServerLogs = useCallback((serverName: string) => {
    if (expandedMcpLogs.has(serverName)) {
      setExpandedMcpLogs((current) => {
        const next = new Set(current);
        next.delete(serverName);
        return next;
      });
      return;
    }

    void loadMcpServerLogs(serverName);
  }, [expandedMcpLogs, loadMcpServerLogs]);

  const loadMcpServerTools = useCallback(async (serverName: string) => {
    if (!settingsClient) {
      Alert.alert('Connection Required', 'Configure your desktop server connection before loading MCP tools.');
      return;
    }

    const action = `mcp-tools:${serverName}`;
    setPendingAction(action);
    setActionFeedback(null);
    try {
      const response = await settingsClient.getOperatorMCPTools(serverName);
      setMcpServerTools((current) => ({
        ...current,
        [serverName]: response.tools
          .filter((tool) => tool.sourceKind === 'mcp')
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));
      setExpandedMcpTools((current) => new Set(current).add(serverName));
    } catch (actionError) {
      Alert.alert('Action Failed', getErrorMessage(actionError));
    } finally {
      setPendingAction(null);
    }
  }, [settingsClient]);

  const toggleMcpServerTools = useCallback((serverName: string) => {
    if (expandedMcpTools.has(serverName)) {
      setExpandedMcpTools((current) => {
        const next = new Set(current);
        next.delete(serverName);
        return next;
      });
      return;
    }

    void loadMcpServerTools(serverName);
  }, [expandedMcpTools, loadMcpServerTools]);

  const toggleMcpToolEnabled = useCallback(async (tool: OperatorMCPToolSummary, enabled: boolean) => {
    if (!settingsClient) {
      Alert.alert('Connection Required', 'Configure your desktop server connection before changing MCP tools.');
      return;
    }

    const action = `mcp-tool-toggle:${tool.name}`;
    setPendingAction(action);
    setActionFeedback(null);
    try {
      const response = await settingsClient.setOperatorMCPToolEnabled(tool.name, enabled);
      const nextTool = response.tool ?? { ...tool, enabled };
      setMcpServerTools((current) => {
        const next: Record<string, OperatorMCPToolSummary[]> = {};
        Object.entries(current).forEach(([serverName, tools]) => {
          next[serverName] = tools.map((entry) => entry.name === nextTool.name ? nextTool : entry);
        });
        return next;
      });
      setActionFeedback(enabled ? `${tool.name} enabled.` : `${tool.name} disabled.`);
    } catch (actionError) {
      Alert.alert('Action Failed', getErrorMessage(actionError));
    } finally {
      setPendingAction(null);
    }
  }, [settingsClient]);

  const healthColor = !status
    ? theme.colors.mutedForeground
    : status.health.overall === 'healthy'
      ? '#22c55e'
      : status.health.overall === 'warning'
        ? '#f59e0b'
        : '#ef4444';

  const controlsDisabled = pendingAction !== null || pendingSetting !== null;
  const discord = discordSummary ?? status?.integrations.discord ?? null;
  const whatsApp = whatsAppSummary ?? status?.integrations.whatsapp ?? null;
  const tunnelStatus = status?.tunnel ?? null;
  const trustedDeviceIds = settings?.remoteServerOperatorAllowDeviceIds ?? [];
  const currentDeviceTrusted = currentDeviceId ? trustedDeviceIds.includes(currentDeviceId) : false;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing['3xl'] }]}
      refreshControl={(
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      )}
    >
      {!settingsClient && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Connection required</Text>
          <Text style={styles.bodyText}>Connect the mobile app to a DotAgents desktop server before using operator controls.</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={() => navigation.navigate('ConnectionSettings')}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel('Open connection settings')}
          >
            <Text style={styles.primaryActionText}>Open connection settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {settingsClient && (
        <>
          <View style={styles.panel}>
            <View style={styles.headerRow}>
              <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
              <View style={styles.headerCopy}>
                <Text style={styles.panelTitle}>Operator status</Text>
                <Text style={styles.mutedText}>
                  {status ? `${status.health.overall} • Updated ${formatTimestamp(status.timestamp)}` : 'Waiting for operator status…'}
                </Text>
              </View>
            </View>
            {status && (
              <Text style={styles.detailText}>
                Push tokens: {status.integrations.pushNotifications.tokenCount} • Recent errors: {status.recentErrors.total}
              </Text>
            )}
            {actionFeedback && <Text style={styles.successText}>{actionFeedback}</Text>}
            {error && <Text style={styles.warningText}>{error}</Text>}
            {pendingSetting && <Text style={styles.mutedText}>Saving {pendingSetting}…</Text>}
          </View>

          {status?.system && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>System</Text>
              <Text style={styles.detailText}>
                {status.system.hostname} • {status.system.platform}/{status.system.arch}
              </Text>
              <Text style={styles.detailText}>
                App {status.system.appVersion ?? '?'} • Electron {status.system.electronVersion ?? '?'} • Node {status.system.nodeVersion}
              </Text>
              <Text style={styles.detailText}>
                Memory: {status.system.memoryUsage.rssMB} MB RSS • {status.system.freeMemoryMB}/{status.system.totalMemoryMB} MB free • {status.system.cpuCount} CPUs
              </Text>
              <Text style={styles.mutedText}>
                Process uptime: {formatDuration(status.system.processUptimeSeconds)} • System uptime: {formatDuration(status.system.uptimeSeconds)}
              </Text>
            </View>
          )}

          {status?.sessions && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Agent sessions</Text>
              <Text style={styles.detailText}>
                Active: {status.sessions.activeSessions} • Recent: {status.sessions.recentSessions}
              </Text>
              {status.sessions.activeSessions > 0 ? (
                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                    onPress={() => void runAction(
                      'agent-sessions-snooze-hide-panel',
                      () => settingsClient.snoozeOperatorAgentSessionsAndHidePanel(
                        status.sessions.activeSessionDetails.map((session) => session.id),
                      ),
                    )}
                    disabled={controlsDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={createButtonAccessibilityLabel('Snooze active agent sessions and hide panel')}
                  >
                    <Text style={styles.secondaryActionText}>Hide active sessions</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {status.sessions.activeSessionDetails.map((s) => {
                const sessionName = s.title || s.id;
                const snoozeAction = `agent-session-snooze:${s.id}`;
                const showAction = `agent-session-show:${s.id}`;
                const isSnoozed = s.isSnoozed === true;
                return (
                  <View key={s.id} style={styles.agentSessionRow}>
                    <View style={styles.agentSessionCopy}>
                      <Text style={styles.detailText}>
                        {sessionName} — {s.status}{s.profileName ? ` • ${s.profileName}` : ''}
                      </Text>
                      <Text style={styles.mutedText}>
                        {isSnoozed ? 'Snoozed' : 'Visible'} • Iteration {s.currentIteration ?? 0}/{s.maxIterations ?? '?'} • Started {formatTimestamp(s.startTime)}
                      </Text>
                    </View>
                    <View style={styles.mcpActionRow}>
                      <TouchableOpacity
                        style={[styles.mcpActionButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                        onPress={() => void runAction(showAction, () => settingsClient.showOperatorAgentSession(s.id))}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(`Show ${sessionName} agent session`)}
                      >
                        <Text style={styles.secondaryActionText}>Show</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.mcpActionButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                        onPress={() => void runAction(
                          snoozeAction,
                          () => isSnoozed
                            ? settingsClient.unsnoozeOperatorAgentSession(s.id)
                            : settingsClient.snoozeOperatorAgentSession(s.id),
                        )}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(`${isSnoozed ? 'Unsnooze' : 'Snooze'} ${sessionName} agent session`)}
                      >
                        <Text style={styles.secondaryActionText}>{isSnoozed ? 'Unsnooze' : 'Snooze'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              {status.sessions.activeSessions === 0 && (
                <Text style={styles.mutedText}>No active agent sessions</Text>
              )}
              {(status.sessions.recentSessionDetails ?? []).slice(0, 4).map((s) => {
                const sessionName = s.title || s.id;
                return (
                  <View key={s.id} style={styles.agentSessionRow}>
                    <View style={styles.agentSessionCopy}>
                      <Text style={styles.detailText}>{sessionName} — {s.status}</Text>
                      <Text style={styles.mutedText}>
                        {s.profileName ? `${s.profileName} • ` : ''}{formatTimestamp(s.endTime ?? s.startTime)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.mcpActionButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                      onPress={() => void runAction(`agent-session-clear:${s.id}`, () => settingsClient.clearOperatorAgentSession(s.id))}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityLabel={createButtonAccessibilityLabel(`Dismiss ${sessionName} agent session`)}
                    >
                      <Text style={styles.secondaryActionText}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              {(status.sessions.recentSessionDetails?.length ?? 0) > 0 ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                  onPress={() => void runAction('agent-sessions-clear-inactive', () => settingsClient.clearInactiveOperatorAgentSessions())}
                  disabled={controlsDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Clear inactive agent sessions')}
                >
                  <Text style={styles.secondaryActionText}>Clear inactive sessions</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {mcpServers.length > 0 && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>MCP servers</Text>
              <Text style={styles.detailText}>
                {mcpServers.filter((s) => s.connected).length}/{mcpServers.length} connected • {mcpServers.reduce((sum, s) => sum + s.toolCount, 0)} tools
              </Text>
              {mcpServers.map((s) => {
                const runtimeEnabled = s.enabled;
                const startAction = `mcp-start:${s.name}`;
                const stopAction = `mcp-stop:${s.name}`;
                const restartAction = `mcp-restart:${s.name}`;
                const testAction = `mcp-test:${s.name}`;
                const logsAction = `mcp-logs:${s.name}`;
                const toolsAction = `mcp-tools:${s.name}`;
                const clearLogsAction = `mcp-clear-logs:${s.name}`;
                const logsExpanded = expandedMcpLogs.has(s.name);
                const toolsExpanded = expandedMcpTools.has(s.name);
                const logs = mcpServerLogs[s.name] ?? [];
                const tools = mcpServerTools[s.name] ?? [];
                const startDisabled = controlsDisabled || runtimeEnabled;
                const stopDisabled = controlsDisabled || !runtimeEnabled;
                const restartDisabled = controlsDisabled || !runtimeEnabled;

                return (
                  <View key={s.name} style={styles.mcpServerCard}>
                    <View style={styles.mcpServerRow}>
                      <View style={styles.mcpServerCopy}>
                        <Text style={styles.detailText}>
                          {s.connected ? 'Connected' : runtimeEnabled ? 'Disconnected' : 'Stopped'} • {s.name}
                        </Text>
                        <Text style={styles.mutedText}>
                          {s.toolCount} tools{!runtimeEnabled ? ' • disabled for runtime' : ''}{s.error ? ` • ${s.error}` : ''}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.mcpActionRow}>
                      <TouchableOpacity
                        style={[styles.mcpActionButton, styles.secondaryActionButton, restartDisabled && styles.actionButtonDisabled]}
                        onPress={() => void runAction(restartAction, () => settingsClient.restartMCPServer(s.name))}
                        disabled={restartDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(`Restart ${s.name} MCP server`)}
                      >
                        <Text style={styles.secondaryActionText}>{pendingAction === restartAction ? 'Restarting...' : 'Restart'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.mcpActionButton, styles.secondaryActionButton, stopDisabled && styles.actionButtonDisabled]}
                        onPress={() => confirmAction(
                          'Stop MCP Server',
                          `Stop ${s.name} and hide its tools from the current runtime?`,
                          'Stop',
                          false,
                          () => runAction(stopAction, () => settingsClient.stopMCPServer(s.name)),
                        )}
                        disabled={stopDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(`Stop ${s.name} MCP server`)}
                      >
                        <Text style={styles.secondaryActionText}>{pendingAction === stopAction ? 'Stopping...' : 'Stop'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.mcpActionButton, styles.secondaryActionButton, startDisabled && styles.actionButtonDisabled]}
                        onPress={() => void runAction(startAction, () => settingsClient.startMCPServer(s.name))}
                        disabled={startDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(`Start ${s.name} MCP server`)}
                      >
                        <Text style={styles.secondaryActionText}>{pendingAction === startAction ? 'Starting...' : 'Start'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.mcpActionButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                        onPress={() => void runAction(testAction, async () => {
                          const response = await settingsClient.testOperatorMCPServer(s.name);
                          return {
                            ...response,
                            message: `${s.name} connection test passed with ${response.toolCount ?? 0} tools.`,
                          };
                        }, false)}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(`Test ${s.name} MCP server`)}
                      >
                        <Text style={styles.secondaryActionText}>{pendingAction === testAction ? 'Testing...' : 'Test'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.mcpActionButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                        onPress={() => toggleMcpServerLogs(s.name)}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(`${logsExpanded ? 'Hide' : 'Show'} ${s.name} MCP logs`)}
                      >
                        <Text style={styles.secondaryActionText}>
                          {pendingAction === logsAction ? 'Loading...' : logsExpanded ? 'Hide logs' : 'Logs'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.mcpActionButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                        onPress={() => toggleMcpServerTools(s.name)}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(`${toolsExpanded ? 'Hide' : 'Show'} ${s.name} MCP tools`)}
                      >
                        <Text style={styles.secondaryActionText}>
                          {pendingAction === toolsAction ? 'Loading...' : toolsExpanded ? 'Hide tools' : 'Tools'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {logsExpanded ? (
                      <View style={styles.mcpDetailPanel}>
                        <View style={styles.mcpPanelHeader}>
                          <Text style={styles.sectionCaption}>Server logs</Text>
                          <TouchableOpacity
                            style={[styles.mcpSmallButton, styles.secondaryActionButton, (controlsDisabled || logs.length === 0) && styles.actionButtonDisabled]}
                            onPress={() => confirmAction(
                              'Clear MCP Logs',
                              `Clear the recent log preview for ${s.name}?`,
                              'Clear Logs',
                              true,
                              () => runAction(clearLogsAction, async () => {
                                const response = await settingsClient.clearOperatorMCPServerLogs(s.name);
                                setMcpServerLogs((current) => ({ ...current, [s.name]: [] }));
                                return response;
                              }, false),
                            )}
                            disabled={controlsDisabled || logs.length === 0}
                            accessibilityRole="button"
                            accessibilityLabel={createButtonAccessibilityLabel(`Clear ${s.name} MCP logs`)}
                          >
                            <Text style={styles.secondaryActionText}>{pendingAction === clearLogsAction ? 'Clearing...' : 'Clear'}</Text>
                          </TouchableOpacity>
                        </View>
                        {logs.length === 0 ? (
                          <Text style={styles.mutedText}>No MCP log entries returned.</Text>
                        ) : (
                          logs.map((entry, index) => (
                            <View key={`${entry.timestamp}-${index}`} style={styles.logItem}>
                              <View style={styles.logHeader}>
                                <Text style={styles.logLevel}>MCP</Text>
                                <Text style={styles.logTimestamp}>{formatTimestamp(entry.timestamp)}</Text>
                              </View>
                              <Text style={styles.logMessage}>{entry.message}</Text>
                            </View>
                          ))
                        )}
                      </View>
                    ) : null}

                    {toolsExpanded ? (
                      <View style={styles.mcpDetailPanel}>
                        <Text style={styles.sectionCaption}>Server tools</Text>
                        {tools.length === 0 ? (
                          <Text style={styles.mutedText}>No tools returned for this server.</Text>
                        ) : (
                          tools.map((tool) => {
                            const toolAction = `mcp-tool-toggle:${tool.name}`;
                            return (
                              <View key={tool.name} style={styles.mcpToolRow}>
                                <View style={styles.mcpToolCopy}>
                                  <Text style={styles.detailText}>{tool.name}</Text>
                                  {tool.description ? <Text style={styles.mutedText} numberOfLines={2}>{tool.description}</Text> : null}
                                  {!tool.serverEnabled ? <Text style={styles.warningText}>Server disabled</Text> : null}
                                </View>
                                <Switch
                                  value={tool.enabled}
                                  onValueChange={(enabled) => void toggleMcpToolEnabled(tool, enabled)}
                                  disabled={controlsDisabled || !tool.serverEnabled || pendingAction === toolAction}
                                  accessibilityLabel={createSwitchAccessibilityLabel(`${tool.name} MCP tool`)}
                                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                                  thumbColor={tool.enabled ? theme.colors.primaryForeground : theme.colors.background}
                                />
                              </View>
                            );
                          })
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}

          {messageQueues.length > 0 && (
            <>
              <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Queued messages</Text>
                  <Text style={styles.mutedText}>
                    {getOperatorMessageQueueTotalMessageCount(messageQueues)} message{getOperatorMessageQueueTotalMessageCount(messageQueues) === 1 ? '' : 's'} across {messageQueues.length} conversation{messageQueues.length === 1 ? '' : 's'}
                  </Text>
                  {messageQueues.map((queue) => {
                    const hasProcessingMessage = hasProcessingQueuedMessage(queue);
                    const queueControlsDisabled = controlsDisabled || hasProcessingMessage;
                    const pauseAction = `message-queue-pause:${queue.conversationId}`;
                    const resumeAction = `message-queue-resume:${queue.conversationId}`;
                    const clearAction = `message-queue-clear:${queue.conversationId}`;
                    return (
                      <View key={queue.conversationId} style={styles.mcpServerCard}>
                        <View style={styles.mcpServerRow}>
                          <View style={styles.mcpServerCopy}>
                            <Text style={styles.detailText}>
                              {queue.conversationId} • {queue.messageCount} message{queue.messageCount === 1 ? '' : 's'}
                            </Text>
                            <Text style={queue.isPaused ? styles.warningText : styles.mutedText}>
                              {queue.isPaused ? 'Paused' : hasProcessingMessage ? 'Processing' : 'Ready'}
                            </Text>
                          </View>
                        </View>

                        {queue.messages.map((message) => {
                          const isEditing = editingQueuedMessage?.conversationId === queue.conversationId
                            && editingQueuedMessage?.messageId === message.id;
                          const editingDraft = isEditing ? editingQueuedMessage : null;
                          const editedText = editingDraft?.text ?? message.text;
                          const canMutateMessage = canMutateQueuedMessage(message);
                          const canEditMessage = canEditQueuedMessage(message);
                          const retryAction = `message-queue-retry:${queue.conversationId}:${message.id}`;
                          const removeAction = `message-queue-remove:${queue.conversationId}:${message.id}`;
                          const updateAction = `message-queue-update:${queue.conversationId}:${message.id}`;

                          return (
                            <View key={message.id} style={styles.queueMessageCard}>
                              {isEditing ? (
                                <>
                                  <TextInput
                                    style={styles.input}
                                    value={editedText}
                                    onChangeText={(text) => setEditingQueuedMessage({
                                      conversationId: queue.conversationId,
                                      messageId: message.id,
                                      text,
                                    })}
                                    editable={pendingAction === null}
                                    multiline
                                    accessibilityLabel={createTextInputAccessibilityLabel('queued message text')}
                                  />
                                  <View style={styles.mcpActionRow}>
                                    <TouchableOpacity
                                      style={[styles.mcpActionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                                      onPress={() => setEditingQueuedMessage(null)}
                                      disabled={pendingAction !== null}
                                      accessibilityRole="button"
                                      accessibilityLabel={createButtonAccessibilityLabel('Cancel queued message edit')}
                                    >
                                      <Text style={styles.secondaryActionText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[
                                        styles.mcpActionButton,
                                        styles.secondaryActionButton,
                                        (pendingAction !== null || !editedText.trim()) && styles.actionButtonDisabled,
                                      ]}
                                      onPress={() => void runAction(updateAction, () =>
                                        settingsClient.updateOperatorQueuedMessageText(queue.conversationId, message.id, editedText),
                                      )}
                                      disabled={pendingAction !== null || !editedText.trim()}
                                      accessibilityRole="button"
                                      accessibilityLabel={createButtonAccessibilityLabel('Save queued message edit')}
                                    >
                                      <Text style={styles.secondaryActionText}>{pendingAction === updateAction ? 'Saving...' : 'Save'}</Text>
                                    </TouchableOpacity>
                                  </View>
                                </>
                              ) : (
                                <>
                                  <Text style={styles.detailText} numberOfLines={3}>
                                    {previewQueuedMessage(message.text)}
                                  </Text>
                                  <Text style={message.status === 'failed' ? styles.warningText : styles.mutedText}>
                                    {formatQueuedMessageStatus(message)}
                                  </Text>
                                  <View style={styles.mcpActionRow}>
                                    {message.status === 'failed' ? (
                                      <TouchableOpacity
                                        style={[styles.mcpActionButton, styles.secondaryActionButton, (controlsDisabled || !canMutateMessage) && styles.actionButtonDisabled]}
                                        onPress={() => void runAction(retryAction, () =>
                                          settingsClient.retryOperatorQueuedMessage(queue.conversationId, message.id),
                                        )}
                                        disabled={controlsDisabled || !canMutateMessage}
                                        accessibilityRole="button"
                                        accessibilityLabel={createButtonAccessibilityLabel('Retry queued message')}
                                      >
                                        <Text style={styles.secondaryActionText}>{pendingAction === retryAction ? 'Retrying...' : 'Retry'}</Text>
                                      </TouchableOpacity>
                                    ) : (
                                      <TouchableOpacity
                                        style={[styles.mcpActionButton, styles.secondaryActionButton, (controlsDisabled || !canEditMessage) && styles.actionButtonDisabled]}
                                        onPress={() => setEditingQueuedMessage({ conversationId: queue.conversationId, messageId: message.id, text: message.text })}
                                        disabled={controlsDisabled || !canEditMessage}
                                        accessibilityRole="button"
                                        accessibilityLabel={createButtonAccessibilityLabel('Edit queued message')}
                                      >
                                        <Text style={styles.secondaryActionText}>Edit</Text>
                                      </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                      style={[styles.mcpActionButton, styles.destructiveActionButton, (controlsDisabled || !canMutateMessage) && styles.actionButtonDisabled]}
                                      onPress={() => confirmAction(
                                        'Remove Queued Message',
                                        'Remove this queued message from the desktop queue?',
                                        'Remove',
                                        true,
                                        () => runAction(removeAction, () =>
                                          settingsClient.removeOperatorQueuedMessage(queue.conversationId, message.id),
                                        ),
                                      )}
                                      disabled={controlsDisabled || !canMutateMessage}
                                      accessibilityRole="button"
                                      accessibilityLabel={createButtonAccessibilityLabel('Remove queued message')}
                                    >
                                      <Text style={styles.destructiveActionText}>{pendingAction === removeAction ? 'Removing...' : 'Remove'}</Text>
                                    </TouchableOpacity>
                                  </View>
                                </>
                              )}
                            </View>
                          );
                        })}

                        <View style={styles.mcpActionRow}>
                          {queue.isPaused ? (
                            <TouchableOpacity
                              style={[styles.mcpActionButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                              onPress={() => void runAction(resumeAction, () => settingsClient.resumeOperatorMessageQueue(queue.conversationId))}
                              disabled={controlsDisabled}
                              accessibilityRole="button"
                              accessibilityLabel={createButtonAccessibilityLabel('Resume queued messages')}
                            >
                              <Text style={styles.secondaryActionText}>{pendingAction === resumeAction ? 'Resuming...' : 'Resume'}</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={[styles.mcpActionButton, styles.secondaryActionButton, queueControlsDisabled && styles.actionButtonDisabled]}
                              onPress={() => void runAction(pauseAction, () => settingsClient.pauseOperatorMessageQueue(queue.conversationId))}
                              disabled={queueControlsDisabled}
                              accessibilityRole="button"
                              accessibilityLabel={createButtonAccessibilityLabel('Pause queued messages')}
                            >
                              <Text style={styles.secondaryActionText}>{pendingAction === pauseAction ? 'Pausing...' : 'Pause'}</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={[styles.mcpActionButton, styles.destructiveActionButton, queueControlsDisabled && styles.actionButtonDisabled]}
                            onPress={() => confirmAction(
                              'Clear Queue',
                              `Clear ${queue.messageCount} queued message${queue.messageCount === 1 ? '' : 's'} for ${queue.conversationId}?`,
                              'Clear Queue',
                              true,
                              () => runAction(clearAction, () => settingsClient.clearOperatorMessageQueue(queue.conversationId)),
                            )}
                            disabled={queueControlsDisabled}
                            accessibilityRole="button"
                            accessibilityLabel={createButtonAccessibilityLabel('Clear queued messages')}
                          >
                            <Text style={styles.destructiveActionText}>{pendingAction === clearAction ? 'Clearing...' : 'Clear'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </>
          )}

          {conversations.length > 0 && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Recent conversations</Text>
              {conversations.map((c) => (
                <View key={c.id} style={{ marginBottom: 6 }}>
                  <Text style={styles.detailText}>
                    {c.title || 'Untitled'} ({c.messageCount} msgs)
                  </Text>
                  <Text style={styles.mutedText}>
                    {formatTimestamp(c.updatedAt)}{c.preview ? ` — ${c.preview.slice(0, 80)}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryActionButton, pendingAction === 'refresh' && styles.actionButtonDisabled]}
                onPress={handleRefresh}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Refresh operator console')}
              >
                <Text style={styles.primaryActionText}>{pendingAction === 'refresh' ? 'Refreshing…' : 'Refresh'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => confirmAction(
                  'Restart Remote Server',
                  'Restart the desktop remote server? Mobile clients may reconnect automatically after a short interruption.',
                  'Restart Server',
                  false,
                  () => runAction('restart-remote-server', () => settingsClient.restartRemoteServer()),
                )}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Restart remote server')}
              >
                <Text style={styles.secondaryActionText}>Restart remote server</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => confirmAction(
                  'Restart App',
                  'Restart the DotAgents desktop app now? The connection may drop while the app relaunches.',
                  'Restart App',
                  false,
                  () => runAction('restart-app', () => settingsClient.restartApp(), false),
                )}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Restart app')}
              >
                <Text style={styles.secondaryActionText}>Restart app</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('stop-tts', () => settingsClient.stopOperatorTtsPlayback(), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Stop desktop speech playback')}
              >
                <Text style={styles.secondaryActionText}>Stop speech</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('show-main-window', () => settingsClient.showOperatorMainWindow('/'), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Show main window')}
              >
                <Text style={styles.secondaryActionText}>Show main</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('show-panel-window', () => settingsClient.showOperatorPanelWindow(), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Show floating panel')}
              >
                <Text style={styles.secondaryActionText}>Show panel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('hide-panel-window', () => settingsClient.hideOperatorPanelWindow(), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Hide floating panel')}
              >
                <Text style={styles.secondaryActionText}>Hide panel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('reset-panel-window', () => settingsClient.resetOperatorPanelWindow(), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Reset floating panel')}
              >
                <Text style={styles.secondaryActionText}>Reset panel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.destructiveActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => confirmAction(
                  'Emergency Stop',
                  'Stop active agent work across the desktop app? Use this when the operator needs an immediate halt.',
                  'Emergency Stop',
                  true,
                  () => runAction('emergency-stop', () => settingsClient.emergencyStop()),
                )}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Emergency stop')}
              >
                <Text style={styles.destructiveActionText}>Emergency stop</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => confirmAction(
                  'Rotate API Key',
                  'Rotate the desktop remote server API key now? This phone will save the returned key locally, and any clients still using the old key will need to reconnect.',
                  'Rotate Key',
                  true,
                  rotateApiKey,
                )}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Rotate API key')}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'rotate-api-key' ? 'Rotating API key…' : 'Rotate API key'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Rotating the API key revokes the previous mobile/remote credential. This phone saves the new key automatically after confirmation.</Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Recent operator audit</Text>
            <Text style={styles.helperText}>Recent operator actions from the desktop audit log, including the stable device ID attached by this mobile client.</Text>
            {auditEntries.length === 0 ? (
              <Text style={styles.mutedText}>No recent operator audit entries returned by the desktop server.</Text>
            ) : (
              auditEntries.map((entry) => {
                const sourceText = formatAuditSource(entry);
                const detailsText = formatAuditDetails(entry.details);

                return (
                  <View key={`${entry.timestamp}-${entry.action}-${entry.path}`} style={styles.auditItem}>
                    <View style={styles.auditHeader}>
                      <Text style={styles.auditAction}>{entry.action}</Text>
                      <Text style={[styles.auditStatus, entry.success ? styles.auditStatusSuccess : styles.auditStatusFailure]}>
                        {entry.success ? 'success' : 'failed'}
                      </Text>
                    </View>
                    <Text style={styles.auditPath}>{entry.path}</Text>
                    <Text style={styles.auditTimestamp}>{formatTimestamp(entry.timestamp)}</Text>
                    {sourceText ? <Text style={styles.helperText}>Source: {sourceText}</Text> : null}
                    {detailsText ? <Text style={styles.helperText}>Details: {detailsText}</Text> : null}
                    {entry.failureReason ? <Text style={styles.warningText}>Failure: {entry.failureReason}</Text> : null}
                  </View>
                );
              })
            )}
          </View>

          {isLoading && !status && !settings ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.mutedText}>Loading operator data…</Text>
            </View>
          ) : null}

          {settings && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Remote access settings</Text>
              <Text style={styles.helperText}>These controls use the desktop settings API and keep the layout intentionally compact for phone screens.</Text>

              <Text style={styles.subsectionTitle}>Remote server</Text>
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Remote Server</Text>
                  <Text style={styles.helperText}>Enable the desktop server that powers mobile operator access.</Text>
                </View>
                <Switch
                  value={settings.remoteServerEnabled ?? false}
                  onValueChange={handleRemoteServerEnabledToggle}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Remote Server')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={settings.remoteServerEnabled ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <Text style={styles.label}>Port</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.remoteServerPort}
                onChangeText={(value) => setDrafts((current) => ({ ...current, remoteServerPort: value }))}
                onEndEditing={handleRemoteServerPortSave}
                editable={!controlsDisabled}
                keyboardType="number-pad"
                placeholder="3210"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Remote server port')}
              />
              <Text style={styles.helperText}>Changing the port can temporarily disconnect this mobile session.</Text>

              <Text style={styles.label}>Bind Address</Text>
              <View style={styles.chipRow}>
                {(['127.0.0.1', '0.0.0.0'] as const).map((value) => {
                  const selected = (settings.remoteServerBindAddress ?? '127.0.0.1') === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.chipButton,
                        selected && styles.chipButtonActive,
                        controlsDisabled && styles.actionButtonDisabled,
                      ]}
                      onPress={() => void applySettingsUpdate(
                        { remoteServerBindAddress: value },
                        'bind address',
                        value === '0.0.0.0'
                          ? 'Bind address saved for LAN/mobile access.'
                          : 'Bind address saved for local-only access.',
                      )}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: controlsDisabled }}
                      accessibilityLabel={createButtonAccessibilityLabel(`Use ${value} for remote server bind address`)}
                    >
                      <Text style={[styles.chipButtonText, selected && styles.chipButtonTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.helperText}>Use 0.0.0.0 for LAN/mobile access. 127.0.0.1 keeps the server on the desktop only.</Text>

              <Text style={styles.subsectionTitle}>Trusted operator devices</Text>
              <Text style={styles.helperText}>If this list is empty, any authenticated client can use operator/admin routes. Once set, non-loopback operator access requires a matching stable device ID.</Text>
              <Text style={styles.detailText}>Current device ID: {currentDeviceId ?? 'Loading…'}</Text>
              <Text style={styles.label}>Trusted Device IDs</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.remoteServerOperatorAllowDeviceIds}
                onChangeText={(value) => setDrafts((current) => ({ ...current, remoteServerOperatorAllowDeviceIds: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { remoteServerOperatorAllowDeviceIds: parseCommaSeparatedList(drafts.remoteServerOperatorAllowDeviceIds) },
                  'trusted operator devices',
                  'Trusted operator device allowlist updated.',
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="device-id-1, device-id-2"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Trusted operator device IDs')}
              />
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || !currentDeviceId || currentDeviceTrusted) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => {
                    if (!currentDeviceId) return;
                    const nextIds = [...new Set([...(settings?.remoteServerOperatorAllowDeviceIds ?? []), currentDeviceId])];
                    setDrafts((current) => ({ ...current, remoteServerOperatorAllowDeviceIds: nextIds.join(', ') }));
                    void applySettingsUpdate(
                      { remoteServerOperatorAllowDeviceIds: nextIds },
                      'trusted operator devices',
                      'This mobile device is now trusted for operator access.',
                    );
                  }}
                  disabled={controlsDisabled || !currentDeviceId || currentDeviceTrusted}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Trust this device for operator access')}
                >
                  <Text style={styles.secondaryActionText}>{currentDeviceTrusted ? 'This device is trusted' : 'Trust this device'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Auto-Show Panel</Text>
                  <Text style={styles.helperText}>Show the desktop operator panel when new remote work begins.</Text>
                </View>
                <Switch
                  value={settings.remoteServerAutoShowPanel ?? false}
                  onValueChange={(value) => void applySettingsUpdate(
                    { remoteServerAutoShowPanel: value },
                    'auto-show panel',
                    'Remote panel auto-show updated.',
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Auto-Show Panel')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={settings.remoteServerAutoShowPanel ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Terminal QR</Text>
                  <Text style={styles.helperText}>Print a pairing QR code in the desktop terminal when supported.</Text>
                </View>
                <Switch
                  value={settings.remoteServerTerminalQrEnabled ?? false}
                  onValueChange={(value) => void applySettingsUpdate(
                    { remoteServerTerminalQrEnabled: value },
                    'terminal QR',
                    'Terminal QR preference updated.',
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Terminal QR')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={settings.remoteServerTerminalQrEnabled ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <Text style={styles.subsectionTitle}>Desktop app</Text>
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Launch at Login</Text>
                  <Text style={styles.helperText}>Open the desktop app automatically when you sign in.</Text>
                </View>
                <Switch
                  value={settings.launchAtLogin ?? false}
                  onValueChange={(value) => void applySettingsUpdate({ launchAtLogin: value }, 'launch at login', 'Launch at login updated.')}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Launch at Login')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={settings.launchAtLogin ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Hide Dock Icon</Text>
                  <Text style={styles.helperText}>Keep the desktop app out of the Dock when the main window is hidden.</Text>
                </View>
                <Switch
                  value={settings.hideDockIcon ?? false}
                  onValueChange={(value) => void applySettingsUpdate({ hideDockIcon: value }, 'dock icon', 'Dock icon preference updated.')}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Hide Dock Icon')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={settings.hideDockIcon ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <Text style={styles.label}>Desktop Theme</Text>
              <View style={styles.chipRow}>
                {(['system', 'light', 'dark'] as const).map((value) => {
                  const selected = (settings.themePreference ?? 'system') === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.chipButton, selected && styles.chipButtonActive, controlsDisabled && styles.actionButtonDisabled]}
                      onPress={() => void applySettingsUpdate({ themePreference: value }, 'desktop theme', `Desktop theme set to ${value}.`)}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: controlsDisabled }}
                      accessibilityLabel={createButtonAccessibilityLabel(`Use ${value} desktop theme`)}
                    >
                      <Text style={[styles.chipButtonText, selected && styles.chipButtonTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.subsectionTitle}>Floating panel</Text>
              <Text style={styles.label}>Panel Position</Text>
              <View style={styles.chipRow}>
                {(['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const).map((value) => {
                  const selected = (settings.panelPosition ?? 'top-right') === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.chipButton, selected && styles.chipButtonActive, controlsDisabled && styles.actionButtonDisabled]}
                      onPress={() => void applySettingsUpdate({ panelPosition: value }, 'panel position', `Panel position set to ${value}.`)}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: controlsDisabled }}
                      accessibilityLabel={createButtonAccessibilityLabel(`Use ${value} panel position`)}
                    >
                      <Text style={[styles.chipButtonText, selected && styles.chipButtonTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Draggable Panel</Text>
                  <Text style={styles.helperText}>Allow dragging the floating panel on desktop.</Text>
                </View>
                <Switch
                  value={settings.panelDragEnabled ?? true}
                  onValueChange={(value) => void applySettingsUpdate({ panelDragEnabled: value }, 'panel drag', 'Panel drag preference updated.')}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Draggable Panel')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.panelDragEnabled ?? true) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Panel Auto-Show</Text>
                  <Text style={styles.helperText}>Let foreground desktop work reopen the floating panel.</Text>
                </View>
                <Switch
                  value={settings.floatingPanelAutoShow ?? true}
                  onValueChange={(value) => void applySettingsUpdate({ floatingPanelAutoShow: value }, 'panel auto-show', 'Panel auto-show updated.')}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Panel Auto-Show')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.floatingPanelAutoShow ?? true) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Hide Panel with Main</Text>
                  <Text style={styles.helperText}>Hide the floating panel when the main desktop window is focused.</Text>
                </View>
                <Switch
                  value={settings.hidePanelWhenMainFocused ?? true}
                  onValueChange={(value) => void applySettingsUpdate({ hidePanelWhenMainFocused: value }, 'panel focus behavior', 'Panel focus behavior updated.')}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Hide Panel with Main')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.hidePanelWhenMainFocused ?? true) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <Text style={styles.subsectionTitle}>Text input</Text>
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Desktop Text Input</Text>
                  <Text style={styles.helperText}>Enable the global desktop text-input panel.</Text>
                </View>
                <Switch
                  value={settings.textInputEnabled ?? true}
                  onValueChange={(value) => void applySettingsUpdate({ textInputEnabled: value }, 'desktop text input', 'Desktop text input updated.')}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Desktop Text Input')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.textInputEnabled ?? true) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Auto-Paste Response</Text>
                  <Text style={styles.helperText}>Paste desktop agent responses back into the app that was focused before recording.</Text>
                </View>
                <Switch
                  value={settings.mcpAutoPasteEnabled ?? false}
                  onValueChange={(value) => void applySettingsUpdate({ mcpAutoPasteEnabled: value }, 'auto-paste', 'Auto-paste preference updated.')}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Auto-Paste Response')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={settings.mcpAutoPasteEnabled ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <Text style={styles.label}>Auto-Paste Delay</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.mcpAutoPasteDelay}
                onChangeText={(value) => setDrafts((current) => ({ ...current, mcpAutoPasteDelay: value }))}
                onEndEditing={handleAutoPasteDelaySave}
                editable={!controlsDisabled}
                keyboardType="number-pad"
                placeholder="1000"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Auto-paste delay')}
              />
              <Text style={styles.helperText}>Delay in milliseconds before pasting a desktop response.</Text>

              <Text style={styles.subsectionTitle}>Cloudflare tunnel</Text>
              <Text style={styles.label}>Tunnel Mode</Text>
              <View style={styles.chipRow}>
                {(['quick', 'named'] as const).map((value) => {
                  const selected = (settings.cloudflareTunnelMode ?? 'quick') === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.chipButton,
                        selected && styles.chipButtonActive,
                        controlsDisabled && styles.actionButtonDisabled,
                      ]}
                      onPress={() => void applySettingsUpdate(
                        { cloudflareTunnelMode: value },
                        'tunnel mode',
                        `Cloudflare tunnel mode set to ${value}.`,
                      )}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: controlsDisabled }}
                      accessibilityLabel={createButtonAccessibilityLabel(`Use ${value} Cloudflare tunnel mode`)}
                    >
                      <Text style={[styles.chipButtonText, selected && styles.chipButtonTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Auto-Start Tunnel</Text>
                  <Text style={styles.helperText}>Start the configured tunnel automatically when the desktop app is ready.</Text>
                </View>
                <Switch
                  value={settings.cloudflareTunnelAutoStart ?? false}
                  onValueChange={(value) => void applySettingsUpdate(
                    { cloudflareTunnelAutoStart: value },
                    'tunnel auto-start',
                    'Tunnel auto-start updated.',
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Auto-Start Tunnel')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={settings.cloudflareTunnelAutoStart ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <Text style={styles.label}>Tunnel ID</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.cloudflareTunnelId}
                onChangeText={(value) => setDrafts((current) => ({ ...current, cloudflareTunnelId: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { cloudflareTunnelId: drafts.cloudflareTunnelId.trim() },
                  'tunnel id',
                  'Tunnel ID saved.',
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Tunnel UUID"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Cloudflare tunnel ID')}
              />

              <Text style={styles.label}>Hostname</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.cloudflareTunnelHostname}
                onChangeText={(value) => setDrafts((current) => ({ ...current, cloudflareTunnelHostname: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { cloudflareTunnelHostname: drafts.cloudflareTunnelHostname.trim() },
                  'tunnel hostname',
                  'Tunnel hostname saved.',
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="agent.example.com"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Cloudflare tunnel hostname')}
              />

              <Text style={styles.label}>Credentials Path</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.cloudflareTunnelCredentialsPath}
                onChangeText={(value) => setDrafts((current) => ({ ...current, cloudflareTunnelCredentialsPath: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { cloudflareTunnelCredentialsPath: drafts.cloudflareTunnelCredentialsPath.trim() },
                  'tunnel credentials path',
                  'Tunnel credentials path saved.',
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="/path/to/credentials.json"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Cloudflare tunnel credentials path')}
              />
              <Text style={styles.helperText}>Named tunnels need a tunnel ID and hostname. Credentials path is optional if the desktop already knows where to find the credentials file.</Text>

              <Text style={styles.subsectionTitle}>Channel operator allowlists</Text>
              <Text style={styles.helperText}>If left blank, /ops uses the current channel access rules. Once you add values here, /ops becomes restricted to the matching identities.</Text>

              <Text style={styles.label}>Discord Operator User IDs</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.discordOperatorAllowUserIds}
                onChangeText={(value) => setDrafts((current) => ({ ...current, discordOperatorAllowUserIds: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { discordOperatorAllowUserIds: parseCommaSeparatedList(drafts.discordOperatorAllowUserIds) },
                  'Discord operator user IDs',
                  'Discord operator user allowlist updated.',
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="1234567890, 9876543210"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Discord operator user IDs')}
              />

              <Text style={styles.label}>Discord Operator Guild IDs</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.discordOperatorAllowGuildIds}
                onChangeText={(value) => setDrafts((current) => ({ ...current, discordOperatorAllowGuildIds: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { discordOperatorAllowGuildIds: parseCommaSeparatedList(drafts.discordOperatorAllowGuildIds) },
                  'Discord operator guild IDs',
                  'Discord operator guild allowlist updated.',
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="1122334455"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Discord operator guild IDs')}
              />

              <Text style={styles.label}>Discord Operator Channel IDs</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.discordOperatorAllowChannelIds}
                onChangeText={(value) => setDrafts((current) => ({ ...current, discordOperatorAllowChannelIds: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { discordOperatorAllowChannelIds: parseCommaSeparatedList(drafts.discordOperatorAllowChannelIds) },
                  'Discord operator channel IDs',
                  'Discord operator channel allowlist updated.',
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="5566778899"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Discord operator channel IDs')}
              />

              <Text style={styles.label}>WhatsApp Operator Allowlist</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.whatsappOperatorAllowFrom}
                onChangeText={(value) => setDrafts((current) => ({ ...current, whatsappOperatorAllowFrom: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { whatsappOperatorAllowFrom: parseCommaSeparatedList(drafts.whatsappOperatorAllowFrom) },
                  'WhatsApp operator allowlist',
                  'WhatsApp operator allowlist updated.',
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="61400111222, 61400999888"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('WhatsApp operator allowlist')}
              />
              <Text style={styles.helperText}>Use exact Discord IDs and WhatsApp sender numbers/LIDs. For WhatsApp, the sender or chat must match one of these identities once the operator allowlist is set.</Text>
            </View>
          )}

          {status && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Remote server runtime</Text>
              <Text style={styles.detailText}>Configured: {settings?.remoteServerEnabled ? 'Enabled' : 'Disabled'}</Text>
              <Text style={styles.detailText}>Running: {status.remoteServer.running ? 'Yes' : 'No'}</Text>
              <Text style={styles.detailText}>Bind: {status.remoteServer.bind}:{status.remoteServer.port}</Text>
              <Text style={styles.detailText}>Connectable URL: {status.remoteServer.connectableUrl || status.remoteServer.url || '—'}</Text>
              {status.remoteServer.lastError && <Text style={styles.warningText}>Last error: {status.remoteServer.lastError}</Text>}
            </View>
          )}

          {(tunnelStatus || tunnelSetup) && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Tunnel status</Text>
              <Text style={styles.detailText}>State: {getTunnelStateLabel(tunnelStatus)}</Text>
              <Text style={styles.detailText}>Mode: {tunnelStatus?.mode || tunnelSetup?.mode || settings?.cloudflareTunnelMode || '—'}</Text>
              <Text style={styles.detailText}>URL: {tunnelStatus?.url || '—'}</Text>
              <Text style={styles.detailText}>Remote server running: {status?.remoteServer.running ? 'Yes' : 'No'}</Text>
              <Text style={styles.sectionCaption}>Tunnel Setup</Text>
              <Text style={styles.detailText}>Installed: {formatYesNo(tunnelSetup?.installed)}</Text>
              <Text style={styles.detailText}>Logged in: {formatYesNo(tunnelSetup?.loggedIn)}</Text>
              <Text style={styles.detailText}>Named tunnel configured: {formatYesNo(tunnelSetup?.namedTunnelConfigured)}</Text>
              <Text style={styles.detailText}>Credentials path configured: {formatYesNo(tunnelSetup?.credentialsPathConfigured)}</Text>
              <Text style={styles.detailText}>Discovered named tunnels: {tunnelSetup?.tunnelCount ?? 0}</Text>
              {tunnelSetup?.configuredTunnelId ? <Text style={styles.detailText}>Configured tunnel ID: {tunnelSetup.configuredTunnelId}</Text> : null}
              {tunnelSetup?.configuredHostname ? <Text style={styles.detailText}>Configured hostname: {tunnelSetup.configuredHostname}</Text> : null}
              {tunnelSetup?.tunnels.slice(0, 3).map((tunnel) => (
                <Text key={tunnel.id} style={styles.helperText}>• {tunnel.name} ({tunnel.id})</Text>
              ))}
              {tunnelStatus?.error && <Text style={styles.warningText}>Tunnel error: {tunnelStatus.error}</Text>}
              {tunnelSetup?.error && <Text style={styles.warningText}>Setup error: {tunnelSetup.error}</Text>}

              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || !status?.remoteServer.running || !!tunnelStatus?.running || !!tunnelStatus?.starting) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => void runAction('tunnel-start', () => settingsClient.startOperatorTunnel())}
                  disabled={controlsDisabled || !status?.remoteServer.running || !!tunnelStatus?.running || !!tunnelStatus?.starting}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Start tunnel')}
                >
                  <Text style={styles.secondaryActionText}>Start tunnel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || (!tunnelStatus?.running && !tunnelStatus?.starting)) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    'Stop Tunnel',
                    'Stop the active Cloudflare tunnel? Mobile access through the tunnel will drop until it is started again.',
                    'Stop Tunnel',
                    false,
                    () => runAction('tunnel-stop', () => settingsClient.stopOperatorTunnel()),
                  )}
                  disabled={controlsDisabled || (!tunnelStatus?.running && !tunnelStatus?.starting)}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Stop tunnel')}
                >
                  <Text style={styles.secondaryActionText}>Stop tunnel</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>The remote server must be running before a tunnel can start.</Text>
            </View>
          )}

          {discord && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Discord</Text>
              <Text style={styles.detailText}>
                Status: {discord.connected ? 'Connected' : discord.connecting ? 'Connecting' : discord.enabled ? 'Enabled, not connected' : 'Disabled'}
              </Text>
              <Text style={styles.detailText}>Available: {formatYesNo(discord.available)}</Text>
              <Text style={styles.detailText}>Token configured: {formatYesNo(discord.tokenConfigured)}</Text>
              <Text style={styles.detailText}>Bot username: {discord.botUsername || '—'}</Text>
              <Text style={styles.detailText}>Default profile: {discord.defaultProfileName || discord.defaultProfileId || '—'}</Text>
              <Text style={styles.detailText}>Logs: {formatLogSummary(discord.logs)}</Text>
              <Text style={styles.detailText}>Last event: {formatTimestamp(discord.lastEventAt)}</Text>
              {discord.lastError && <Text style={styles.warningText}>Last error: {discord.lastError}</Text>}

              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || discord.connected || discord.connecting) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => void runAction('discord-connect', () => settingsClient.connectOperatorDiscord())}
                  disabled={controlsDisabled || discord.connected || discord.connecting}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Connect Discord')}
                >
                  <Text style={styles.secondaryActionText}>Connect Discord</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || !discord.connected) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    'Disconnect Discord',
                    'Disconnect the Discord bot from the desktop app now?',
                    'Disconnect',
                    true,
                    () => runAction('discord-disconnect', () => settingsClient.disconnectOperatorDiscord()),
                  )}
                  disabled={controlsDisabled || !discord.connected}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Disconnect Discord')}
                >
                  <Text style={styles.secondaryActionText}>Disconnect</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || (discord.logs.total === 0 && discordLogs.length === 0)) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    'Clear Discord Logs',
                    'Clear the Discord operator log preview on the desktop app?',
                    'Clear Logs',
                    true,
                    () => runAction('discord-clear-logs', () => settingsClient.clearOperatorDiscordLogs()),
                  )}
                  disabled={controlsDisabled || (discord.logs.total === 0 && discordLogs.length === 0)}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Clear Discord logs')}
                >
                  <Text style={styles.secondaryActionText}>Clear logs</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionCaption}>Discord log preview</Text>
              {discordLogs.length === 0 ? (
                <Text style={styles.mutedText}>No Discord log entries returned.</Text>
              ) : (
                discordLogs.map((entry) => (
                  <View key={entry.id} style={styles.logItem}>
                    <View style={styles.logHeader}>
                      <Text style={styles.logLevel}>{entry.level}</Text>
                      <Text style={styles.logTimestamp}>{formatTimestamp(entry.timestamp)}</Text>
                    </View>
                    <Text style={styles.logMessage}>{entry.message}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {whatsApp && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>WhatsApp</Text>
              <Text style={styles.detailText}>
                Status: {whatsApp.connected ? 'Connected' : whatsApp.enabled ? 'Enabled, not connected' : 'Disabled'}
              </Text>
              <Text style={styles.detailText}>Server configured: {formatYesNo(whatsApp.serverConfigured)}</Text>
              <Text style={styles.detailText}>Server connected: {formatYesNo(whatsApp.serverConnected)}</Text>
              <Text style={styles.detailText}>Available: {formatYesNo(whatsApp.available)}</Text>
              <Text style={styles.detailText}>Auto-reply: {formatYesNo(whatsApp.autoReplyEnabled)}</Text>
              <Text style={styles.detailText}>Log messages: {formatYesNo(whatsApp.logMessagesEnabled)}</Text>
              <Text style={styles.detailText}>Allowed senders: {whatsApp.allowedSenderCount}</Text>
              <Text style={styles.detailText}>Credentials present: {formatYesNo(whatsApp.hasCredentials)}</Text>
              <Text style={styles.detailText}>Logs: {formatLogSummary(whatsApp.logs)}</Text>
              {whatsApp.lastError && <Text style={styles.warningText}>Last error: {whatsApp.lastError}</Text>}

              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || whatsApp.connected) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => void runAction('whatsapp-connect', () => settingsClient.connectOperatorWhatsApp())}
                  disabled={controlsDisabled || whatsApp.connected}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Connect WhatsApp')}
                >
                  <Text style={styles.secondaryActionText}>Connect WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || !whatsApp.connected) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    'Log Out of WhatsApp',
                    'Log out the active WhatsApp session on the desktop app?',
                    'Log Out',
                    true,
                    () => runAction('whatsapp-logout', () => settingsClient.logoutOperatorWhatsApp()),
                  )}
                  disabled={controlsDisabled || !whatsApp.connected}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Log out of WhatsApp')}
                >
                  <Text style={styles.secondaryActionText}>Log out</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {status && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Health checks</Text>
              {Object.entries(status.health.checks).map(([name, check]) => (
                <View key={name} style={styles.listRow}>
                  <Text style={styles.listLabel}>{name}</Text>
                  <Text style={[
                    styles.listValue,
                    {
                      color: check.status === 'pass'
                        ? '#22c55e'
                        : check.status === 'warning'
                          ? '#f59e0b'
                          : theme.colors.destructive,
                    },
                  ]}
                  >
                    {check.status}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {status && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Updater</Text>
              <Text style={styles.detailText}>Mode: {status.updater.mode}</Text>
              <Text style={styles.detailText}>Current version: {status.updater.currentVersion || '—'}</Text>
              <Text style={styles.detailText}>Update available: {status.updater.updateAvailable === undefined ? 'Unknown' : status.updater.updateAvailable ? 'Yes' : 'No'}</Text>
              <Text style={styles.detailText}>Last checked: {formatTimestamp(status.updater.lastCheckedAt)}</Text>
              {status.updater.latestRelease ? (
                <>
                  <Text style={styles.detailText}>Latest release: {status.updater.latestRelease.tagName}</Text>
                  <Text style={styles.detailText}>Published: {status.updater.latestRelease.publishedAt || '—'}</Text>
                  <Text style={styles.detailText}>Assets: {status.updater.latestRelease.assetCount ?? 0}</Text>
                  <Text style={styles.detailText}>Release URL: {status.updater.latestRelease.url}</Text>
                </>
              ) : null}
              {status.updater.preferredAsset ? (
                <>
                  <Text style={styles.detailText}>Recommended asset: {status.updater.preferredAsset.name}</Text>
                  <Text style={styles.detailText}>Asset URL: {status.updater.preferredAsset.downloadUrl}</Text>
                </>
              ) : null}
              {status.updater.lastDownloadedFileName ? (
                <>
                  <Text style={styles.detailText}>Last downloaded file: {status.updater.lastDownloadedFileName}</Text>
                  <Text style={styles.detailText}>Downloaded at: {formatTimestamp(status.updater.lastDownloadedAt)}</Text>
                </>
              ) : null}
              {status.updater.lastCheckError ? <Text style={styles.warningText}>Last check error: {status.updater.lastCheckError}</Text> : null}
              {status.updater.manualReleasesUrl ? (
                <Text style={styles.detailText}>Manual releases: {status.updater.manualReleasesUrl}</Text>
              ) : null}
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                  onPress={() => void runAction('check-latest-release', () => settingsClient.checkOperatorUpdater())}
                  disabled={pendingAction !== null}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Check latest release')}
                >
                  <Text style={styles.secondaryActionText}>
                    {pendingAction === 'check-latest-release' ? 'Checking latest release…' : 'Check latest release'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (pendingAction !== null || !status.updater.preferredAsset) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    'Download Latest Installer',
                    'Download the recommended release asset onto the desktop machine now? This does not install it automatically.',
                    'Download',
                    false,
                    () => runAction('download-latest-release', () => settingsClient.downloadOperatorUpdateAsset()),
                  )}
                  disabled={pendingAction !== null || !status.updater.preferredAsset}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Download latest installer')}
                >
                  <Text style={styles.secondaryActionText}>
                    {pendingAction === 'download-latest-release' ? 'Downloading installer…' : 'Download latest installer'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (pendingAction !== null || !status.updater.lastDownloadedFileName) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => void runAction('reveal-downloaded-installer', () => settingsClient.revealOperatorUpdateAsset())}
                  disabled={pendingAction !== null || !status.updater.lastDownloadedFileName}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Reveal downloaded installer')}
                >
                  <Text style={styles.secondaryActionText}>
                    {pendingAction === 'reveal-downloaded-installer' ? 'Revealing installer…' : 'Reveal downloaded installer'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (pendingAction !== null || !status.updater.lastDownloadedFileName) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    'Open Downloaded Installer',
                    'Open the downloaded installer on the desktop machine now? This may launch the installer UI on that machine.',
                    'Open Installer',
                    false,
                    () => runAction('open-downloaded-installer', () => settingsClient.openOperatorUpdateAsset()),
                  )}
                  disabled={pendingAction !== null || !status.updater.lastDownloadedFileName}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Open downloaded installer')}
                >
                  <Text style={styles.secondaryActionText}>
                    {pendingAction === 'open-downloaded-installer' ? 'Opening installer…' : 'Open downloaded installer'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                  onPress={() => void runAction('open-release-page', () => settingsClient.openOperatorReleasesPage())}
                  disabled={pendingAction !== null}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Open release page')}
                >
                  <Text style={styles.secondaryActionText}>
                    {pendingAction === 'open-release-page' ? 'Opening release page…' : 'Open release page'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Recent errors</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void loadDiagnosticReport()}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Generate diagnostic report')}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'diagnostic-report' ? 'Generating…' : 'Diagnostics'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('diagnostic-report-save', () => settingsClient.saveOperatorDiagnosticReport(), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Save diagnostic report')}
              >
                <Text style={styles.secondaryActionText}>Save report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryActionButton,
                  (pendingAction !== null || recentErrors.length === 0) && styles.actionButtonDisabled,
                ]}
                onPress={() => confirmAction(
                  'Clear Recent Errors',
                  'Clear the desktop operator error log?',
                  'Clear Errors',
                  true,
                  () => runAction('operator-errors-clear', async () => {
                    const response = await settingsClient.clearOperatorErrors();
                    setRecentErrors([]);
                    setDiagnosticReport(null);
                    return response;
                  }, false),
                )}
                disabled={pendingAction !== null || recentErrors.length === 0}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Clear recent errors')}
              >
                <Text style={styles.secondaryActionText}>Clear errors</Text>
              </TouchableOpacity>
            </View>
            {diagnosticReport ? (
              <View style={styles.diagnosticSummary}>
                <Text style={styles.detailText}>
                  Diagnostic report • {diagnosticReport.mcp.availableTools} tools • {diagnosticReport.errors.length} logged events
                </Text>
                <Text style={styles.mutedText}>
                  MCP servers: {Object.keys(diagnosticReport.mcp.serverStatus).length} • Generated {formatTimestamp(diagnosticReport.timestamp)}
                </Text>
              </View>
            ) : null}
            {recentErrors.length === 0 ? (
              <Text style={styles.mutedText}>No recent errors returned by the desktop server.</Text>
            ) : (
              recentErrors.map((entry) => (
                <View key={`${entry.timestamp}-${entry.component}-${entry.message}`} style={styles.errorItem}>
                  <View style={styles.errorHeader}>
                    <Text style={styles.errorComponent}>{entry.component}</Text>
                    <Text style={styles.errorLevel}>{entry.level}</Text>
                  </View>
                  <Text style={styles.errorMessage}>{entry.message}</Text>
                  <Text style={styles.errorTimestamp}>{formatTimestamp(entry.timestamp)}</Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    panel: {
      backgroundColor: theme.colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: spacing.sm,
    },
    panelTitle: {
      ...theme.typography.label,
      fontSize: 16,
      color: theme.colors.foreground,
    },
    subsectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.foreground,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginTop: spacing.xs,
    },
    sectionCaption: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.foreground,
      marginTop: spacing.xs,
    },
    bodyText: {
      ...theme.typography.body,
      color: theme.colors.foreground,
    },
    mutedText: {
      ...theme.typography.bodyMuted,
      color: theme.colors.mutedForeground,
    },
    helperText: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.mutedForeground,
    },
    successText: {
      fontSize: 13,
      color: '#22c55e',
      fontWeight: '500',
    },
    warningText: {
      fontSize: 13,
      color: theme.colors.destructive,
      lineHeight: 18,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    healthDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    rowCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.input,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: theme.colors.background,
      color: theme.colors.foreground,
      fontSize: 15,
    },
    inputDisabled: {
      opacity: 0.65,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chipButton: {
      flexGrow: 1,
      minHeight: 40,
      minWidth: 110,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    chipButtonTextActive: {
      color: theme.colors.primaryForeground,
    },
    actionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    actionButton: {
      minHeight: 44,
      minWidth: 136,
      flexGrow: 1,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
    primaryActionButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    secondaryActionButton: {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
    },
    mcpServerCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      backgroundColor: theme.colors.background,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    mcpServerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    mcpServerCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    mcpActionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    mcpActionButton: {
      minHeight: 40,
      minWidth: 86,
      flexGrow: 1,
      borderRadius: radius.md,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mcpSmallButton: {
      minHeight: 36,
      minWidth: 72,
      borderRadius: radius.md,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    agentSessionRow: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      backgroundColor: theme.colors.background,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    agentSessionCopy: {
      gap: 2,
      minWidth: 0,
    },
    mcpDetailPanel: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing.sm,
      gap: spacing.sm,
    },
    mcpPanelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    mcpToolRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    mcpToolCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    queueMessageCard: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing.sm,
      gap: spacing.sm,
    },
    destructiveActionButton: {
      backgroundColor: theme.colors.destructive + '10',
      borderColor: theme.colors.destructive,
    },
    primaryActionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primaryForeground,
      textAlign: 'center',
    },
    secondaryActionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.foreground,
      textAlign: 'center',
    },
    destructiveActionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.destructive,
      textAlign: 'center',
    },
    detailText: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.foreground,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    listLabel: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.foreground,
      textTransform: 'capitalize',
    },
    listValue: {
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    logItem: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing.sm,
      gap: spacing.xs,
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    logLevel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.mutedForeground,
      textTransform: 'uppercase',
    },
    logTimestamp: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      flexShrink: 1,
      textAlign: 'right',
    },
    logMessage: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.foreground,
    },
    auditItem: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing.sm,
      gap: spacing.xs,
    },
    auditHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
      alignItems: 'center',
    },
    auditAction: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    auditStatus: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    auditStatusSuccess: {
      color: '#22c55e',
    },
    auditStatusFailure: {
      color: theme.colors.destructive,
    },
    auditPath: {
      fontSize: 13,
      color: theme.colors.foreground,
    },
    auditTimestamp: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
    },
    diagnosticSummary: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      backgroundColor: theme.colors.background,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    errorItem: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing.sm,
      gap: spacing.xs,
    },
    errorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    errorComponent: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    errorLevel: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      textTransform: 'uppercase',
    },
    errorMessage: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.foreground,
    },
    errorTimestamp: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
    },
  });
}
