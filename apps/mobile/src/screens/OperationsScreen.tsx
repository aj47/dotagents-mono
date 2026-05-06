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
} from '@dotagents/shared/accessibility-utils';
import { getDeviceIdentity } from '../lib/deviceIdentity';
import {
  ExtendedSettingsApiClient,
  OperatorAuditEntry,
  OperatorConversationItem,
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
import { formatConfigListInput, parseConfigListInput } from '@dotagents/shared/config-list-input';
import { getErrorMessage } from '@dotagents/shared/error-utils';
import {
  formatOperatorAuditDetails as formatAuditDetails,
  formatOperatorAuditSource as formatAuditSource,
  formatOperatorDurationSeconds as formatDuration,
  formatOperatorLogSummary as formatLogSummary,
  formatOperatorTimestamp as formatTimestamp,
  formatOperatorYesNo as formatYesNo,
  getOperatorTunnelStateLabel as getTunnelStateLabel,
} from '@dotagents/shared/operator-display-utils';
import {
  CLOUDFLARE_TUNNEL_MODE_OPTIONS,
  DEFAULT_CLOUDFLARE_TUNNEL_AUTO_START,
  DEFAULT_CLOUDFLARE_TUNNEL_MODE,
  DEFAULT_REMOTE_SERVER_AUTO_SHOW_PANEL,
  DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
  DEFAULT_REMOTE_SERVER_CORS_ORIGINS,
  DEFAULT_REMOTE_SERVER_ENABLED,
  DEFAULT_REMOTE_SERVER_PORT,
  DEFAULT_REMOTE_SERVER_LOG_LEVEL,
  DEFAULT_REMOTE_SERVER_TERMINAL_QR_ENABLED,
  isRemoteServerPortUpdateValue,
  REMOTE_SERVER_BIND_ADDRESS_OPTIONS,
  REMOTE_SERVER_LOG_LEVEL_OPTIONS,
  REMOTE_SERVER_PORT_MAX,
  REMOTE_SERVER_PORT_MIN,
  type CloudflareTunnelMode,
  type RemoteServerBindAddress,
  type RemoteServerLogLevel,
} from '@dotagents/shared/remote-pairing';
import {
  buildOperatorRemoteAccessDrafts as buildDrafts,
  type OperatorRemoteAccessDrafts as RemoteAccessDrafts,
} from '@dotagents/shared/operator-remote-access-drafts';

const RECENT_ERROR_COUNT = 8;
const RECENT_LOG_COUNT = 10;
const RECENT_AUDIT_ENTRY_COUNT = 10;
const DISCORD_LOG_PREVIEW_COUNT = 6;
const MCP_LOG_PREVIEW_COUNT = 20;
const ACTION_REFRESH_DELAY_MS = 1200;
const AUTO_REFRESH_INTERVAL_MS = 30_000;

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
  const [operatorLogs, setOperatorLogs] = useState<OperatorRecentError[]>([]);
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
  const [operatorAgentPrompt, setOperatorAgentPrompt] = useState('');
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
      setOperatorLogs([]);
      setAuditEntries([]);
      setConversations([]);
      setMessageQueues([]);
      setEditingQueuedMessage(null);
      setMcpServers([]);
      setMcpServerLogs({});
      setExpandedMcpLogs(new Set());
      setMcpServerTools({});
      setExpandedMcpTools(new Set());
      setDrafts(buildDrafts(null));
      setError(null);
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
      logsResult,
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
      settingsClient.getOperatorLogs(RECENT_LOG_COUNT),
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

    if (logsResult.status === 'fulfilled') {
      setOperatorLogs(logsResult.value.logs);
    } else {
      setOperatorLogs([]);
      issues.push(getErrorMessage(logsResult.reason));
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

  const fetchMcpLogsForServer = useCallback(async (serverName: string) => {
    if (!settingsClient) {
      Alert.alert('Connection Required', 'Configure your desktop server connection before viewing MCP logs.');
      return;
    }

    const action = `mcp-logs:${serverName}`;
    setPendingAction(action);
    try {
      const response = await settingsClient.getOperatorMCPServerLogs(serverName, MCP_LOG_PREVIEW_COUNT);
      setMcpServerLogs((current) => ({ ...current, [serverName]: response.logs }));
    } catch (actionError) {
      Alert.alert('Action Failed', getErrorMessage(actionError));
    } finally {
      setPendingAction(null);
    }
  }, [settingsClient]);

  const toggleMcpLogsForServer = useCallback((serverName: string) => {
    setExpandedMcpLogs((current) => {
      const next = new Set(current);
      if (next.has(serverName)) {
        next.delete(serverName);
      } else {
        next.add(serverName);
        void fetchMcpLogsForServer(serverName);
      }
      return next;
    });
  }, [fetchMcpLogsForServer]);

  const fetchMcpToolsForServer = useCallback(async (serverName: string) => {
    if (!settingsClient) {
      Alert.alert('Connection Required', 'Configure your desktop server connection before viewing MCP tools.');
      return;
    }

    const action = `mcp-tools:${serverName}`;
    setPendingAction(action);
    try {
      const response = await settingsClient.getOperatorMCPTools(serverName);
      setMcpServerTools((current) => ({ ...current, [serverName]: response.tools }));
    } catch (actionError) {
      Alert.alert('Action Failed', getErrorMessage(actionError));
    } finally {
      setPendingAction(null);
    }
  }, [settingsClient]);

  const toggleMcpToolsForServer = useCallback((serverName: string) => {
    setExpandedMcpTools((current) => {
      const next = new Set(current);
      if (next.has(serverName)) {
        next.delete(serverName);
      } else {
        next.add(serverName);
        void fetchMcpToolsForServer(serverName);
      }
      return next;
    });
  }, [fetchMcpToolsForServer]);

  const setMcpToolEnabled = useCallback(async (serverName: string, toolName: string, enabled: boolean) => {
    if (!settingsClient) {
      Alert.alert('Connection Required', 'Configure your desktop server connection before changing MCP tools.');
      return;
    }

    const action = `mcp-tool-toggle:${toolName}`;
    setPendingAction(action);
    try {
      const response = await settingsClient.setOperatorMCPToolEnabled(toolName, enabled);
      if (!response.success) {
        throw new Error(response.error || response.message || 'Tool toggle failed');
      }
      setMcpServerTools((current) => ({
        ...current,
        [serverName]: (current[serverName] ?? []).map((tool) => (
          tool.name === toolName ? { ...tool, enabled } : tool
        )),
      }));
      setActionFeedback(response.message);
    } catch (actionError) {
      Alert.alert('Action Failed', getErrorMessage(actionError));
      void fetchMcpToolsForServer(serverName);
    } finally {
      setPendingAction(null);
    }
  }, [fetchMcpToolsForServer, settingsClient]);

  const runOperatorAgent = useCallback(async () => {
    if (!settingsClient) {
      Alert.alert('Connection Required', 'Configure your desktop server connection before running an agent.');
      return;
    }

    const prompt = operatorAgentPrompt.trim();
    if (!prompt) {
      Alert.alert('Prompt Required', 'Enter a prompt for the desktop agent to run.');
      return;
    }

    setPendingAction('run-agent');
    setActionFeedback(null);
    try {
      const response = await settingsClient.runOperatorAgent({ prompt });
      if (!response.success) {
        throw new Error(response.error || 'Agent run failed');
      }

      const preview = response.content.trim().replace(/\s+/g, ' ').slice(0, 140);
      setActionFeedback(
        `Agent run finished in ${response.conversationId} (${response.messageCount} messages).${preview ? ` ${preview}` : ''}`,
      );
      setOperatorAgentPrompt('');
      setTimeout(() => {
        void loadOperatorData(true);
      }, ACTION_REFRESH_DELAY_MS);
    } catch (actionError) {
      Alert.alert('Action Failed', getErrorMessage(actionError));
    } finally {
      setPendingAction(null);
    }
  }, [loadOperatorData, operatorAgentPrompt, settingsClient]);

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
    if (!isRemoteServerPortUpdateValue(parsed)) {
      Alert.alert('Invalid Port', `Enter a whole number between ${REMOTE_SERVER_PORT_MIN} and ${REMOTE_SERVER_PORT_MAX}.`);
      setDrafts((current) => ({
        ...current,
        remoteServerPort: String(settings?.remoteServerPort ?? DEFAULT_REMOTE_SERVER_PORT),
      }));
      return;
    }

    void applySettingsUpdate({ remoteServerPort: parsed }, 'remote server port', `Remote server port saved as ${parsed}.`);
  }, [applySettingsUpdate, drafts.remoteServerPort, settings?.remoteServerPort]);

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
              {status.sessions.activeSessionDetails.map((s) => {
                const stopAction = `agent-session-stop:${s.id}`;
                return (
                  <View key={s.id} style={styles.agentSessionRow}>
                    <View style={styles.agentSessionCopy}>
                      <Text style={styles.detailText}>
                        {s.title ?? s.id} — {s.status} ({s.currentIteration ?? 0}/{s.maxIterations ?? '?'})
                      </Text>
                      <Text style={styles.mutedText}>Since {formatTimestamp(s.startTime)}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.sessionStopButton,
                        styles.secondaryActionButton,
                        controlsDisabled && styles.actionButtonDisabled,
                      ]}
                      onPress={() => confirmAction(
                        'Stop Agent Session',
                        `Stop ${s.title ?? s.id} on the desktop app? The conversation queue for this session will be paused.`,
                        'Stop Session',
                        false,
                        () => runAction(stopAction, () => settingsClient.stopOperatorAgentSession(s.id)),
                      )}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityLabel={createButtonAccessibilityLabel(`Stop ${s.title ?? s.id} agent session`)}
                    >
                      <Text style={styles.secondaryActionText}>
                        {pendingAction === stopAction ? 'Stopping...' : 'Stop'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              {status.sessions.activeSessions === 0 && (
                <Text style={styles.mutedText}>No active agent sessions</Text>
              )}
            </View>
          )}

          {messageQueues.length > 0 && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Desktop message queues</Text>
              <Text style={styles.detailText}>
                {messageQueues.reduce((sum, queue) => sum + queue.messageCount, 0)} queued messages across {messageQueues.length} conversations
              </Text>
              {messageQueues.map((queue) => {
                const clearAction = `message-queue-clear:${queue.conversationId}`;
                const pauseAction = `message-queue-pause:${queue.conversationId}`;
                const resumeAction = `message-queue-resume:${queue.conversationId}`;
                const hasProcessingMessage = queue.messages.some((message) => message.status === 'processing');
                return (
                  <View key={queue.conversationId} style={styles.agentSessionRow}>
                    <View style={styles.agentSessionCopy}>
                      <Text style={styles.detailText}>
                        {queue.conversationId}: {queue.messageCount} queued{queue.isPaused ? ' (paused)' : ''}
                      </Text>
                      <View style={styles.queueMessageList}>
                        {queue.messages.map((message) => {
                          const isEditingMessage = editingQueuedMessage?.conversationId === queue.conversationId
                            && editingQueuedMessage.messageId === message.id;
                          const editedText = isEditingMessage ? editingQueuedMessage.text : message.text;
                          const retryAction = `message-queue-message-retry:${queue.conversationId}:${message.id}`;
                          const removeAction = `message-queue-message-remove:${queue.conversationId}:${message.id}`;
                          const updateAction = `message-queue-message-update:${queue.conversationId}:${message.id}`;
                          const canMutateMessage = message.status !== 'processing';
                          const canEditMessage = canMutateMessage && !message.addedToHistory;

                          return (
                            <View key={message.id} style={styles.queueMessageItem}>
                              <View style={styles.queueMessageCopy}>
                                {isEditingMessage ? (
                                  <TextInput
                                    style={styles.queueMessageInput}
                                    value={editedText}
                                    onChangeText={(text) => setEditingQueuedMessage({ conversationId: queue.conversationId, messageId: message.id, text })}
                                    multiline
                                    accessibilityLabel={createTextInputAccessibilityLabel(`Queued message ${message.id}`)}
                                  />
                                ) : (
                                  <>
                                    <Text
                                      style={message.status === 'failed' ? styles.warningText : styles.mutedText}
                                      numberOfLines={2}
                                    >
                                      {message.status}: {message.text}
                                    </Text>
                                    {message.errorMessage ? (
                                      <Text style={styles.warningText} numberOfLines={1}>{message.errorMessage}</Text>
                                    ) : null}
                                  </>
                                )}
                              </View>
                              <View style={styles.queueMessageActionRow}>
                                {isEditingMessage ? (
                                  <>
                                    <TouchableOpacity
                                      style={[styles.queueMessageButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                                      onPress={() => setEditingQueuedMessage(null)}
                                      disabled={controlsDisabled}
                                      accessibilityRole="button"
                                      accessibilityLabel={createButtonAccessibilityLabel(`Cancel editing queued message ${message.id}`)}
                                    >
                                      <Text style={styles.secondaryActionText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[
                                        styles.queueMessageButton,
                                        styles.secondaryActionButton,
                                        (controlsDisabled || !editedText.trim()) && styles.actionButtonDisabled,
                                      ]}
                                      onPress={() => void runAction(updateAction, async () => {
                                        const response = await settingsClient.updateOperatorQueuedMessageText(queue.conversationId, message.id, editedText);
                                        if (response.success) {
                                          setEditingQueuedMessage(null);
                                          setMessageQueues((current) => current.map((entry) => (
                                            entry.conversationId === queue.conversationId
                                              ? {
                                                ...entry,
                                                messages: entry.messages.map((queuedMessage) => (
                                                  queuedMessage.id === message.id
                                                    ? { ...queuedMessage, text: editedText.trim(), status: queuedMessage.status === 'failed' ? 'pending' : queuedMessage.status }
                                                    : queuedMessage
                                                )),
                                              }
                                              : entry
                                          )));
                                        }
                                        return response;
                                      })}
                                      disabled={controlsDisabled || !editedText.trim()}
                                      accessibilityRole="button"
                                      accessibilityLabel={createButtonAccessibilityLabel(`Save queued message ${message.id}`)}
                                    >
                                      <Text style={styles.secondaryActionText}>
                                        {pendingAction === updateAction ? 'Saving...' : 'Save'}
                                      </Text>
                                    </TouchableOpacity>
                                  </>
                                ) : (
                                  <>
                                    {message.status === 'failed' ? (
                                      <TouchableOpacity
                                        style={[styles.queueMessageButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                                        onPress={() => void runAction(retryAction, async () => {
                                          const response = await settingsClient.retryOperatorQueuedMessage(queue.conversationId, message.id);
                                          if (response.success) {
                                            setMessageQueues((current) => current.map((entry) => (
                                              entry.conversationId === queue.conversationId
                                                ? {
                                                  ...entry,
                                                  messages: entry.messages.map((queuedMessage) => (
                                                    queuedMessage.id === message.id
                                                      ? (() => {
                                                        const { errorMessage: _errorMessage, ...queuedMessageWithoutError } = queuedMessage;
                                                        return { ...queuedMessageWithoutError, status: 'pending' as const };
                                                      })()
                                                      : queuedMessage
                                                  )),
                                                }
                                                : entry
                                            )));
                                          }
                                          return response;
                                        })}
                                        disabled={controlsDisabled}
                                        accessibilityRole="button"
                                        accessibilityLabel={createButtonAccessibilityLabel(`Retry queued message ${message.id}`)}
                                      >
                                        <Text style={styles.secondaryActionText}>
                                          {pendingAction === retryAction ? 'Retrying...' : 'Retry'}
                                        </Text>
                                      </TouchableOpacity>
                                    ) : null}
                                    {canEditMessage ? (
                                      <TouchableOpacity
                                        style={[styles.queueMessageButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                                        onPress={() => setEditingQueuedMessage({ conversationId: queue.conversationId, messageId: message.id, text: message.text })}
                                        disabled={controlsDisabled}
                                        accessibilityRole="button"
                                        accessibilityLabel={createButtonAccessibilityLabel(`Edit queued message ${message.id}`)}
                                      >
                                        <Text style={styles.secondaryActionText}>Edit</Text>
                                      </TouchableOpacity>
                                    ) : null}
                                    {canMutateMessage ? (
                                      <TouchableOpacity
                                        style={[styles.queueMessageButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                                        onPress={() => confirmAction(
                                          'Remove Queued Message',
                                          `Remove queued message ${message.id} from ${queue.conversationId}?`,
                                          'Remove',
                                          true,
                                          () => runAction(removeAction, async () => {
                                            const response = await settingsClient.removeOperatorQueuedMessage(queue.conversationId, message.id);
                                            if (response.success) {
                                              setMessageQueues((current) => current
                                                .map((entry) => (
                                                  entry.conversationId === queue.conversationId
                                                    ? {
                                                      ...entry,
                                                      messageCount: Math.max(0, entry.messageCount - 1),
                                                      messages: entry.messages.filter((queuedMessage) => queuedMessage.id !== message.id),
                                                    }
                                                    : entry
                                                ))
                                                .filter((entry) => entry.messageCount > 0));
                                            }
                                            return response;
                                          }, false),
                                        )}
                                        disabled={controlsDisabled}
                                        accessibilityRole="button"
                                        accessibilityLabel={createButtonAccessibilityLabel(`Remove queued message ${message.id}`)}
                                      >
                                        <Text style={styles.secondaryActionText}>
                                          {pendingAction === removeAction ? 'Removing...' : 'Remove'}
                                        </Text>
                                      </TouchableOpacity>
                                    ) : null}
                                  </>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                    <View style={styles.mcpActionRow}>
                      {queue.isPaused ? (
                        <TouchableOpacity
                          style={[
                            styles.mcpRestartButton,
                            styles.secondaryActionButton,
                            controlsDisabled && styles.actionButtonDisabled,
                          ]}
                          onPress={() => void runAction(resumeAction, async () => {
                            const response = await settingsClient.resumeOperatorMessageQueue(queue.conversationId);
                            if (response.success) {
                              setMessageQueues((current) => current.map((entry) => (
                                entry.conversationId === queue.conversationId
                                  ? { ...entry, isPaused: false }
                                  : entry
                              )));
                            }
                            return response;
                          })}
                          disabled={controlsDisabled}
                          accessibilityRole="button"
                          accessibilityLabel={createButtonAccessibilityLabel(`Resume ${queue.conversationId} desktop message queue`)}
                        >
                          <Text style={styles.secondaryActionText}>
                            {pendingAction === resumeAction ? 'Resuming...' : 'Resume'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.mcpRestartButton,
                            styles.secondaryActionButton,
                            (controlsDisabled || hasProcessingMessage) && styles.actionButtonDisabled,
                          ]}
                          onPress={() => void runAction(pauseAction, async () => {
                            const response = await settingsClient.pauseOperatorMessageQueue(queue.conversationId);
                            if (response.success) {
                              setMessageQueues((current) => current.map((entry) => (
                                entry.conversationId === queue.conversationId
                                  ? { ...entry, isPaused: true }
                                  : entry
                              )));
                            }
                            return response;
                          }, false)}
                          disabled={controlsDisabled || hasProcessingMessage}
                          accessibilityRole="button"
                          accessibilityLabel={createButtonAccessibilityLabel(`Pause ${queue.conversationId} desktop message queue`)}
                        >
                          <Text style={styles.secondaryActionText}>
                            {pendingAction === pauseAction ? 'Pausing...' : 'Pause'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.mcpRestartButton,
                          styles.secondaryActionButton,
                          (controlsDisabled || hasProcessingMessage) && styles.actionButtonDisabled,
                        ]}
                        onPress={() => confirmAction(
                          'Clear Message Queue',
                          `Clear the queued desktop messages for ${queue.conversationId}? Processing messages cannot be cleared.`,
                          'Clear Queue',
                          true,
                          () => runAction(clearAction, async () => {
                            const response = await settingsClient.clearOperatorMessageQueue(queue.conversationId);
                            if (response.success) {
                              setMessageQueues((current) => current.filter((entry) => entry.conversationId !== queue.conversationId));
                            }
                            return response;
                          }, false),
                        )}
                        disabled={controlsDisabled || hasProcessingMessage}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(`Clear ${queue.conversationId} desktop message queue`)}
                      >
                        <Text style={styles.secondaryActionText}>
                          {pendingAction === clearAction ? 'Clearing...' : 'Clear'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {mcpServers.length > 0 && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>MCP servers</Text>
              <Text style={styles.detailText}>
                {mcpServers.filter((s) => s.connected).length}/{mcpServers.length} connected • {mcpServers.reduce((sum, s) => sum + s.toolCount, 0)} tools
              </Text>
              {mcpServers.map((s) => {
                const startAction = `mcp-start:${s.name}`;
                const stopAction = `mcp-stop:${s.name}`;
                const restartAction = `mcp-restart:${s.name}`;
                const testAction = `mcp-test:${s.name}`;
                const logsAction = `mcp-logs:${s.name}`;
                const toolsAction = `mcp-tools:${s.name}`;
                const clearLogsAction = `mcp-clear-logs:${s.name}`;
                const configDisabled = !!s.configDisabled;
                const runtimeEnabled = s.runtimeEnabled !== false;
                const startDisabled = controlsDisabled || configDisabled || runtimeEnabled;
                const stopDisabled = controlsDisabled || configDisabled || !runtimeEnabled;
                const restartDisabled = controlsDisabled || configDisabled || !runtimeEnabled;
                const logsExpanded = expandedMcpLogs.has(s.name);
                const toolsExpanded = expandedMcpTools.has(s.name);
                const logs = mcpServerLogs[s.name] ?? [];
                const tools = mcpServerTools[s.name] ?? [];

                return (
                  <View key={s.name} style={styles.mcpServerCard}>
                    <View style={styles.mcpServerRow}>
                      <View style={styles.mcpServerCopy}>
                        <Text style={styles.detailText}>
                          {s.connected ? '✓' : s.enabled ? '✗' : '○'} {s.name}: {s.toolCount} tools{!s.enabled ? ' (disabled)' : ''}
                        </Text>
                        {s.error ? <Text style={styles.warningText}>{s.error}</Text> : null}
                      </View>
                      <View style={styles.mcpActionRow}>
                        {runtimeEnabled ? (
                          <>
                            <TouchableOpacity
                              style={[
                                styles.mcpRestartButton,
                                styles.secondaryActionButton,
                                restartDisabled && styles.actionButtonDisabled,
                              ]}
                              onPress={() => void runAction(restartAction, async () => {
                                const response = await settingsClient.restartMCPServer(s.name);
                                return response.success
                                  ? { ...response, message: `Restarted ${s.name}` }
                                  : response;
                              })}
                              disabled={restartDisabled}
                              accessibilityRole="button"
                              accessibilityLabel={createButtonAccessibilityLabel(`Restart ${s.name} MCP server`)}
                            >
                              <Text style={styles.secondaryActionText}>
                                {pendingAction === restartAction ? 'Restarting...' : 'Restart'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.mcpRestartButton,
                                styles.secondaryActionButton,
                                stopDisabled && styles.actionButtonDisabled,
                              ]}
                              onPress={() => confirmAction(
                                'Stop MCP Server',
                                `Stop ${s.name} on the desktop app? Its tools will be hidden until the server is started again.`,
                                'Stop Server',
                                false,
                                () => runAction(stopAction, () => settingsClient.stopMCPServer(s.name)),
                              )}
                              disabled={stopDisabled}
                              accessibilityRole="button"
                              accessibilityLabel={createButtonAccessibilityLabel(`Stop ${s.name} MCP server`)}
                            >
                              <Text style={styles.secondaryActionText}>
                                {pendingAction === stopAction ? 'Stopping...' : 'Stop'}
                              </Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.mcpRestartButton,
                              styles.secondaryActionButton,
                              startDisabled && styles.actionButtonDisabled,
                            ]}
                            onPress={() => void runAction(startAction, () => settingsClient.startMCPServer(s.name))}
                            disabled={startDisabled}
                            accessibilityRole="button"
                            accessibilityLabel={createButtonAccessibilityLabel(`Start ${s.name} MCP server`)}
                          >
                            <Text style={styles.secondaryActionText}>
                              {pendingAction === startAction ? 'Starting...' : 'Start'}
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[
                            styles.mcpRestartButton,
                            styles.secondaryActionButton,
                            controlsDisabled && styles.actionButtonDisabled,
                          ]}
                          onPress={() => void runAction(testAction, async () => {
                            const response = await settingsClient.testOperatorMCPServer(s.name);
                            return response.success
                              ? {
                                success: true,
                                message: typeof response.toolCount === 'number'
                                  ? `Connection test passed for ${s.name} (${response.toolCount} tools)`
                                  : `Connection test passed for ${s.name}`,
                              }
                              : {
                                success: false,
                                message: response.message,
                                error: response.error || response.message,
                              };
                          }, false)}
                          disabled={controlsDisabled}
                          accessibilityRole="button"
                          accessibilityLabel={createButtonAccessibilityLabel(`Test ${s.name} MCP server connection`)}
                        >
                          <Text style={styles.secondaryActionText}>
                            {pendingAction === testAction ? 'Testing...' : 'Test'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.mcpRestartButton,
                            styles.secondaryActionButton,
                            controlsDisabled && styles.actionButtonDisabled,
                          ]}
                          onPress={() => toggleMcpLogsForServer(s.name)}
                          disabled={controlsDisabled}
                          accessibilityRole="button"
                          accessibilityLabel={createButtonAccessibilityLabel(`${logsExpanded ? 'Hide' : 'Show'} ${s.name} MCP server logs`)}
                        >
                          <Text style={styles.secondaryActionText}>
                            {pendingAction === logsAction ? 'Loading...' : logsExpanded ? 'Hide logs' : 'Logs'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.mcpRestartButton,
                            styles.secondaryActionButton,
                            controlsDisabled && styles.actionButtonDisabled,
                          ]}
                          onPress={() => toggleMcpToolsForServer(s.name)}
                          disabled={controlsDisabled}
                          accessibilityRole="button"
                          accessibilityLabel={createButtonAccessibilityLabel(`${toolsExpanded ? 'Hide' : 'Show'} ${s.name} MCP server tools`)}
                        >
                          <Text style={styles.secondaryActionText}>
                            {pendingAction === toolsAction ? 'Loading...' : toolsExpanded ? 'Hide tools' : 'Tools'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {logsExpanded ? (
                      <View style={styles.mcpLogsPanel}>
                        <View style={styles.logHeader}>
                          <Text style={styles.sectionCaption}>Server logs</Text>
                          <TouchableOpacity
                            style={[
                              styles.mcpClearLogsButton,
                              styles.secondaryActionButton,
                              (controlsDisabled || logs.length === 0) && styles.actionButtonDisabled,
                            ]}
                            onPress={() => confirmAction(
                              'Clear MCP Logs',
                              `Clear logs for ${s.name} on the desktop app?`,
                              'Clear Logs',
                              true,
                              () => runAction(clearLogsAction, async () => {
                                const response = await settingsClient.clearOperatorMCPServerLogs(s.name);
                                if (response.success) {
                                  setMcpServerLogs((current) => ({ ...current, [s.name]: [] }));
                                }
                                return response;
                              }, false),
                            )}
                            disabled={controlsDisabled || logs.length === 0}
                            accessibilityRole="button"
                            accessibilityLabel={createButtonAccessibilityLabel(`Clear ${s.name} MCP server logs`)}
                          >
                            <Text style={styles.secondaryActionText}>
                              {pendingAction === clearLogsAction ? 'Clearing...' : 'Clear'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        {pendingAction === logsAction ? (
                          <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={styles.mutedText}>Loading MCP logs...</Text>
                          </View>
                        ) : logs.length === 0 ? (
                          <Text style={styles.mutedText}>No logs returned for this server.</Text>
                        ) : (
                          logs.map((entry, index) => (
                            <View key={`${entry.timestamp}-${index}`} style={styles.logItem}>
                              <Text style={styles.logTimestamp}>{formatTimestamp(entry.timestamp)}</Text>
                              <Text style={styles.logMessage}>{entry.message}</Text>
                            </View>
                          ))
                        )}
                      </View>
                    ) : null}
                    {toolsExpanded ? (
                      <View style={styles.mcpToolsPanel}>
                        <Text style={styles.sectionCaption}>Server tools</Text>
                        {pendingAction === toolsAction ? (
                          <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={styles.mutedText}>Loading MCP tools...</Text>
                          </View>
                        ) : tools.length === 0 ? (
                          <Text style={styles.mutedText}>No tools returned for this server.</Text>
                        ) : (
                          tools.map((tool) => {
                            const toolAction = `mcp-tool-toggle:${tool.name}`;
                            const toolDisabled = controlsDisabled || !tool.serverEnabled || pendingAction === toolAction;
                            return (
                              <View key={tool.name} style={styles.mcpToolRow}>
                                <View style={styles.mcpToolCopy}>
                                  <Text style={styles.detailText}>{tool.name}</Text>
                                  {tool.description ? (
                                    <Text style={styles.helperText}>{tool.description}</Text>
                                  ) : (
                                    <Text style={styles.helperText}>{tool.sourceLabel}</Text>
                                  )}
                                  {!tool.serverEnabled ? (
                                    <Text style={styles.mutedText}>Server disabled</Text>
                                  ) : null}
                                </View>
                                <Switch
                                  value={tool.enabled}
                                  onValueChange={(nextEnabled) => void setMcpToolEnabled(s.name, tool.name, nextEnabled)}
                                  disabled={toolDisabled}
                                  accessibilityLabel={createSwitchAccessibilityLabel(`Enable ${tool.name} MCP tool`)}
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
            <Text style={styles.label}>Run Agent on Desktop</Text>
            <TextInput
              style={[styles.input, styles.promptInput]}
              value={operatorAgentPrompt}
              onChangeText={setOperatorAgentPrompt}
              placeholder="Ask the desktop agent to run a task"
              placeholderTextColor={theme.colors.mutedForeground}
              multiline
              textAlignVertical="top"
              editable={pendingAction === null}
              accessibilityLabel={createTextInputAccessibilityLabel('Desktop agent prompt')}
              accessibilityHint="Enter a task for the connected desktop agent to run through the operator API."
            />
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.primaryActionButton,
                  (pendingAction !== null || !operatorAgentPrompt.trim()) && styles.actionButtonDisabled,
                ]}
                onPress={runOperatorAgent}
                disabled={pendingAction !== null || !operatorAgentPrompt.trim()}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Run agent on desktop')}
              >
                <Text style={styles.primaryActionText}>
                  {pendingAction === 'run-agent' ? 'Running agent…' : 'Run agent'}
                </Text>
              </TouchableOpacity>

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
                  value={settings.remoteServerEnabled ?? DEFAULT_REMOTE_SERVER_ENABLED}
                  onValueChange={handleRemoteServerEnabledToggle}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Remote Server')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.remoteServerEnabled ?? DEFAULT_REMOTE_SERVER_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
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
                placeholder={String(DEFAULT_REMOTE_SERVER_PORT)}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Remote server port')}
              />
              <Text style={styles.helperText}>Changing the port can temporarily disconnect this mobile session.</Text>

              <Text style={styles.label}>Bind Address</Text>
              <View style={styles.chipRow}>
                {REMOTE_SERVER_BIND_ADDRESS_OPTIONS.map((value) => {
                  const selected = (settings.remoteServerBindAddress ?? DEFAULT_REMOTE_SERVER_BIND_ADDRESS) === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.chipButton,
                        selected && styles.chipButtonActive,
                        controlsDisabled && styles.actionButtonDisabled,
                      ]}
                      onPress={() => void applySettingsUpdate(
                        { remoteServerBindAddress: value as RemoteServerBindAddress },
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

              <Text style={styles.label}>Log Level</Text>
              <View style={styles.chipRow}>
                {REMOTE_SERVER_LOG_LEVEL_OPTIONS.map((value) => {
                  const selected = (settings.remoteServerLogLevel ?? DEFAULT_REMOTE_SERVER_LOG_LEVEL) === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.chipButton,
                        selected && styles.chipButtonActive,
                        controlsDisabled && styles.actionButtonDisabled,
                      ]}
                      onPress={() => void applySettingsUpdate(
                        { remoteServerLogLevel: value as RemoteServerLogLevel },
                        'remote server log level',
                        `Remote server log level saved as ${value}.`,
                      )}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: controlsDisabled }}
                      accessibilityLabel={createButtonAccessibilityLabel(`Use ${value} remote server log level`)}
                    >
                      <Text style={[styles.chipButtonText, selected && styles.chipButtonTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>CORS Origins</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.remoteServerCorsOrigins}
                onChangeText={(value) => setDrafts((current) => ({ ...current, remoteServerCorsOrigins: value }))}
                onEndEditing={() => {
                  const origins = parseConfigListInput(drafts.remoteServerCorsOrigins, { unique: true });
                  void applySettingsUpdate(
                    { remoteServerCorsOrigins: origins.length > 0 ? origins : [...DEFAULT_REMOTE_SERVER_CORS_ORIGINS] },
                    'remote server CORS origins',
                    'Remote server CORS origins updated.',
                  );
                }}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="* or http://localhost:8081"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Remote server CORS origins')}
              />
              <Text style={styles.helperText}>Use * for development or comma-separated allowed origins.</Text>

              <Text style={styles.subsectionTitle}>Trusted operator devices</Text>
              <Text style={styles.helperText}>If this list is empty, any authenticated client can use operator/admin routes. Once set, non-loopback operator access requires a matching stable device ID.</Text>
              <Text style={styles.detailText}>Current device ID: {currentDeviceId ?? 'Loading…'}</Text>
              <Text style={styles.label}>Trusted Device IDs</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.remoteServerOperatorAllowDeviceIds}
                onChangeText={(value) => setDrafts((current) => ({ ...current, remoteServerOperatorAllowDeviceIds: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { remoteServerOperatorAllowDeviceIds: parseConfigListInput(drafts.remoteServerOperatorAllowDeviceIds, { unique: true }) },
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
                    setDrafts((current) => ({ ...current, remoteServerOperatorAllowDeviceIds: formatConfigListInput(nextIds) }));
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
                  value={settings.remoteServerAutoShowPanel ?? DEFAULT_REMOTE_SERVER_AUTO_SHOW_PANEL}
                  onValueChange={(value) => void applySettingsUpdate(
                    { remoteServerAutoShowPanel: value },
                    'auto-show panel',
                    'Remote panel auto-show updated.',
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Auto-Show Panel')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.remoteServerAutoShowPanel ?? DEFAULT_REMOTE_SERVER_AUTO_SHOW_PANEL) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>Terminal QR</Text>
                  <Text style={styles.helperText}>Print a pairing QR code in the desktop terminal when supported.</Text>
                </View>
                <Switch
                  value={settings.remoteServerTerminalQrEnabled ?? DEFAULT_REMOTE_SERVER_TERMINAL_QR_ENABLED}
                  onValueChange={(value) => void applySettingsUpdate(
                    { remoteServerTerminalQrEnabled: value },
                    'terminal QR',
                    'Terminal QR preference updated.',
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Terminal QR')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.remoteServerTerminalQrEnabled ?? DEFAULT_REMOTE_SERVER_TERMINAL_QR_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <Text style={styles.subsectionTitle}>Cloudflare tunnel</Text>
              <Text style={styles.label}>Tunnel Mode</Text>
              <View style={styles.chipRow}>
                {CLOUDFLARE_TUNNEL_MODE_OPTIONS.map((value) => {
                  const selected = (settings.cloudflareTunnelMode ?? DEFAULT_CLOUDFLARE_TUNNEL_MODE) === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.chipButton,
                        selected && styles.chipButtonActive,
                        controlsDisabled && styles.actionButtonDisabled,
                      ]}
                      onPress={() => void applySettingsUpdate(
                        { cloudflareTunnelMode: value as CloudflareTunnelMode },
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
                  value={settings.cloudflareTunnelAutoStart ?? DEFAULT_CLOUDFLARE_TUNNEL_AUTO_START}
                  onValueChange={(value) => void applySettingsUpdate(
                    { cloudflareTunnelAutoStart: value },
                    'tunnel auto-start',
                    'Tunnel auto-start updated.',
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel('Auto-Start Tunnel')}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.cloudflareTunnelAutoStart ?? DEFAULT_CLOUDFLARE_TUNNEL_AUTO_START) ? theme.colors.primaryForeground : theme.colors.background}
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

              <Text style={styles.label}>Tunnel Name</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.cloudflareTunnelName}
                onChangeText={(value) => setDrafts((current) => ({ ...current, cloudflareTunnelName: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { cloudflareTunnelName: drafts.cloudflareTunnelName.trim() },
                  'tunnel name',
                  'Tunnel name saved.',
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="my-dotagents-tunnel"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Cloudflare tunnel name')}
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
                  { discordOperatorAllowUserIds: parseConfigListInput(drafts.discordOperatorAllowUserIds, { unique: true }) },
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
                  { discordOperatorAllowGuildIds: parseConfigListInput(drafts.discordOperatorAllowGuildIds, { unique: true }) },
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
                  { discordOperatorAllowChannelIds: parseConfigListInput(drafts.discordOperatorAllowChannelIds, { unique: true }) },
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

              <Text style={styles.label}>Discord Operator Role IDs</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.discordOperatorAllowRoleIds}
                onChangeText={(value) => setDrafts((current) => ({ ...current, discordOperatorAllowRoleIds: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { discordOperatorAllowRoleIds: parseConfigListInput(drafts.discordOperatorAllowRoleIds, { unique: true }) },
                  'Discord operator role IDs',
                  'Discord operator role allowlist updated.',
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="9988776655"
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel('Discord operator role IDs')}
              />

              <Text style={styles.label}>WhatsApp Operator Allowlist</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.whatsappOperatorAllowFrom}
                onChangeText={(value) => setDrafts((current) => ({ ...current, whatsappOperatorAllowFrom: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { whatsappOperatorAllowFrom: parseConfigListInput(drafts.whatsappOperatorAllowFrom, { unique: true }) },
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
            <Text style={styles.panelTitle}>Recent operator logs</Text>
            {operatorLogs.length === 0 ? (
              <Text style={styles.mutedText}>No recent operator log entries returned by the desktop server.</Text>
            ) : (
              operatorLogs.map((entry) => (
                <View key={`${entry.timestamp}-${entry.component}-${entry.level}-${entry.message}`} style={styles.logItem}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logLevel}>{entry.level} • {entry.component}</Text>
                    <Text style={styles.logTimestamp}>{formatTimestamp(entry.timestamp)}</Text>
                  </View>
                  <Text style={styles.logMessage}>{entry.message}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Recent errors</Text>
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
    promptInput: {
      minHeight: 96,
      lineHeight: 20,
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
    mcpServerCard: {
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing.sm,
    },
    agentSessionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing.sm,
    },
    agentSessionCopy: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    queueMessageList: {
      gap: spacing.xs,
    },
    queueMessageItem: {
      gap: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing.xs,
    },
    queueMessageCopy: {
      minWidth: 0,
      gap: spacing.xs,
    },
    queueMessageInput: {
      minHeight: 72,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      color: theme.colors.foreground,
      backgroundColor: theme.colors.background,
      textAlignVertical: 'top',
    },
    queueMessageActionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: spacing.xs,
    },
    queueMessageButton: {
      minHeight: 32,
      minWidth: 72,
      flexGrow: 0,
      borderRadius: radius.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    sessionStopButton: {
      minHeight: 36,
      minWidth: 78,
      flexGrow: 0,
      borderRadius: radius.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    mcpServerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    mcpServerCopy: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    mcpActionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      gap: spacing.xs,
    },
    mcpRestartButton: {
      minHeight: 36,
      minWidth: 82,
      flexGrow: 0,
      borderRadius: radius.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    mcpClearLogsButton: {
      minHeight: 32,
      minWidth: 72,
      flexGrow: 0,
      borderRadius: radius.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    mcpLogsPanel: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    mcpToolsPanel: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    mcpToolRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing.sm,
    },
    mcpToolCopy: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
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
