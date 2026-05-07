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
  DEFAULT_FLOATING_PANEL_AUTO_SHOW,
  DEFAULT_HIDE_DOCK_ICON,
  DEFAULT_HIDE_PANEL_WHEN_MAIN_FOCUSED,
  DEFAULT_LAUNCH_AT_LOGIN,
  DEFAULT_PANEL_DRAG_ENABLED,
  DEFAULT_PANEL_POSITION,
  DESKTOP_FLOATING_PANEL_SETTINGS_SECTION_METADATA,
  DESKTOP_SHELL_SETTINGS_SECTION_METADATA,
  PANEL_POSITION_OPTIONS,
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
} from '@dotagents/shared/api-types';
import { ExtendedSettingsApiClient } from '../lib/settingsApi';
import { saveConfig, useConfigContext } from '../store/config';
import { useTheme } from '../ui/ThemeProvider';
import { radius, spacing } from '../ui/theme';
import { formatConfigListInput, parseConfigListInput } from '@dotagents/shared/config-list-input';
import { getErrorMessage } from '@dotagents/shared/error-utils';
import {
  DESKTOP_TEXT_INPUT_FIELD_METADATA,
  DEFAULT_TEXT_INPUT_ENABLED,
} from '@dotagents/shared/key-utils';
import {
  DESKTOP_THEME_PREFERENCE_FIELD_METADATA,
  DEFAULT_THEME_PREFERENCE,
  THEME_PREFERENCE_OPTIONS,
} from '@dotagents/shared/theme-preference';
import {
  OPERATOR_ACTIONS_PANEL_METADATA,
  OPERATOR_AGENT_SESSIONS_PANEL_METADATA,
  OPERATOR_ALERT_METADATA,
  OPERATOR_AUDIT_PANEL_METADATA,
  OPERATOR_CONNECTION_REQUIRED_PANEL_METADATA,
  OPERATOR_CONVERSATIONS_PANEL_METADATA,
  OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA,
  OPERATOR_DISCORD_PANEL_METADATA,
  OPERATOR_ERRORS_PANEL_METADATA,
  OPERATOR_HEALTH_CHECKS_PANEL_METADATA,
  OPERATOR_LOGS_PANEL_METADATA,
  OPERATOR_MCP_SERVERS_PANEL_METADATA,
  OPERATOR_MESSAGE_QUEUES_PANEL_METADATA,
  OPERATOR_REMOTE_ACCESS_SETTINGS_PANEL_METADATA,
  OPERATOR_RUNTIME_STATUS_PANEL_METADATA,
  OPERATOR_STATUS_PANEL_METADATA,
  OPERATOR_SYSTEM_PANEL_METADATA,
  OPERATOR_TUNNEL_STATUS_PANEL_METADATA,
  OPERATOR_UPDATER_PANEL_METADATA,
  OPERATOR_WHATSAPP_PANEL_METADATA,
  formatOperatorActiveAgentSessionSummary as formatActiveAgentSessionSummary,
  formatOperatorAuditDetails as formatAuditDetails,
  formatOperatorAuditSource as formatAuditSource,
  formatOperatorLogSummary as formatLogSummary,
  formatOperatorRecentAgentSessionSummary as formatRecentAgentSessionSummary,
  formatOperatorTimestamp as formatTimestamp,
  formatOperatorYesNo as formatYesNo,
  getOperatorAgentSessionDisplayName as getAgentSessionDisplayName,
  getOperatorTunnelStateLabel as getTunnelStateLabel,
} from '@dotagents/shared/operator-display-utils';
import {
  CHANNEL_OPERATOR_ALLOWLISTS_SECTION_METADATA,
  CLOUDFLARE_TUNNEL_AUTO_START_FIELD_METADATA,
  CLOUDFLARE_TUNNEL_CREDENTIALS_PATH_FIELD_METADATA,
  CLOUDFLARE_TUNNEL_HOSTNAME_FIELD_METADATA,
  CLOUDFLARE_TUNNEL_ID_FIELD_METADATA,
  CLOUDFLARE_TUNNEL_MODE_DISPLAY_OPTIONS,
  CLOUDFLARE_TUNNEL_MODE_FIELD_METADATA,
  CLOUDFLARE_TUNNEL_NAME_FIELD_METADATA,
  CLOUDFLARE_TUNNEL_SECTION_METADATA,
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
  REMOTE_SERVER_API_KEY_FIELD_METADATA,
  REMOTE_SERVER_AUTO_SHOW_PANEL_FIELD_METADATA,
  REMOTE_SERVER_BIND_ADDRESS_DISPLAY_OPTIONS,
  REMOTE_SERVER_BIND_ADDRESS_FIELD_METADATA,
  REMOTE_SERVER_CORS_ORIGINS_FIELD_METADATA,
  REMOTE_SERVER_ENABLED_FIELD_METADATA,
  REMOTE_SERVER_LOG_LEVEL_DISPLAY_OPTIONS,
  REMOTE_SERVER_LOG_LEVEL_FIELD_METADATA,
  REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA,
  REMOTE_SERVER_PORT_FIELD_METADATA,
  REMOTE_SERVER_TERMINAL_QR_FIELD_METADATA,
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
      setDiagnosticReport(null);
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
        Alert.alert(OPERATOR_ALERT_METADATA.actionFailedTitle, getErrorMessage(actionError));
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
      { text: OPERATOR_ALERT_METADATA.cancelButtonLabel, style: 'cancel' },
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
      Alert.alert(OPERATOR_ALERT_METADATA.connectionRequiredTitle, OPERATOR_ALERT_METADATA.connectionRequiredMessages.rotateApiKey);
      return;
    }

    setPendingAction('rotate-api-key');
    setActionFeedback(null);

    try {
      const response = await settingsClient.rotateOperatorApiKey();
      if (!response.success) {
        throw new Error(response.error || response.message || OPERATOR_ALERT_METADATA.defaultApiKeyRotationFailureMessage);
      }

      const nextConfig = {
        ...config,
        apiKey: response.apiKey,
      };

      setConfig(nextConfig);
      await saveConfig(nextConfig);
      setActionFeedback(REMOTE_SERVER_API_KEY_FIELD_METADATA.formatRotateSuccessMessage(response.restartScheduled));
    } catch (actionError) {
      Alert.alert(OPERATOR_ALERT_METADATA.actionFailedTitle, getErrorMessage(actionError));
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
      Alert.alert(OPERATOR_ALERT_METADATA.connectionRequiredTitle, OPERATOR_ALERT_METADATA.connectionRequiredMessages.operatorActions);
      return;
    }

    setPendingAction(action);
    setActionFeedback(null);
    try {
      const response = await request();
      if (!response.success) {
        throw new Error(response.error || response.message || OPERATOR_ALERT_METADATA.defaultActionFailureMessage);
      }

      setActionFeedback(response.message || OPERATOR_ALERT_METADATA.defaultActionCompletedMessage);

      if (refreshAfter) {
        setTimeout(() => {
          void loadOperatorData(true);
        }, ACTION_REFRESH_DELAY_MS);
      }
    } catch (actionError) {
      Alert.alert(OPERATOR_ALERT_METADATA.actionFailedTitle, getErrorMessage(actionError));
    } finally {
      setPendingAction(null);
    }
  }, [loadOperatorData, settingsClient]);

  const loadDiagnosticReport = useCallback(async () => {
    if (!settingsClient) {
      Alert.alert(OPERATOR_ALERT_METADATA.connectionRequiredTitle, OPERATOR_ALERT_METADATA.connectionRequiredMessages.operatorActions);
      return;
    }

    setPendingAction('diagnostic-report');
    setActionFeedback(null);
    try {
      const report = await settingsClient.getOperatorDiagnosticReport();
      setDiagnosticReport(report);
      setActionFeedback(OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.formatGeneratedMessage(report.errors.length));
    } catch (actionError) {
      Alert.alert(OPERATOR_ALERT_METADATA.actionFailedTitle, getErrorMessage(actionError));
    } finally {
      setPendingAction(null);
    }
  }, [settingsClient]);

  const fetchMcpLogsForServer = useCallback(async (serverName: string) => {
    if (!settingsClient) {
      Alert.alert(OPERATOR_ALERT_METADATA.connectionRequiredTitle, OPERATOR_ALERT_METADATA.connectionRequiredMessages.mcpLogs);
      return;
    }

    const action = `mcp-logs:${serverName}`;
    setPendingAction(action);
    try {
      const response = await settingsClient.getOperatorMCPServerLogs(serverName, MCP_LOG_PREVIEW_COUNT);
      setMcpServerLogs((current) => ({ ...current, [serverName]: response.logs }));
    } catch (actionError) {
      Alert.alert(OPERATOR_ALERT_METADATA.actionFailedTitle, getErrorMessage(actionError));
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
      Alert.alert(OPERATOR_ALERT_METADATA.connectionRequiredTitle, OPERATOR_ALERT_METADATA.connectionRequiredMessages.mcpTools);
      return;
    }

    const action = `mcp-tools:${serverName}`;
    setPendingAction(action);
    try {
      const response = await settingsClient.getOperatorMCPTools(serverName);
      setMcpServerTools((current) => ({ ...current, [serverName]: response.tools }));
    } catch (actionError) {
      Alert.alert(OPERATOR_ALERT_METADATA.actionFailedTitle, getErrorMessage(actionError));
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
      Alert.alert(OPERATOR_ALERT_METADATA.connectionRequiredTitle, OPERATOR_ALERT_METADATA.connectionRequiredMessages.mcpToolChange);
      return;
    }

    const action = `mcp-tool-toggle:${toolName}`;
    setPendingAction(action);
    try {
      const response = await settingsClient.setOperatorMCPToolEnabled(toolName, enabled);
      if (!response.success) {
        throw new Error(response.error || response.message || OPERATOR_ALERT_METADATA.defaultMcpToolToggleFailureMessage);
      }
      setMcpServerTools((current) => ({
        ...current,
        [serverName]: (current[serverName] ?? []).map((tool) => (
          tool.name === toolName ? { ...tool, enabled } : tool
        )),
      }));
      setActionFeedback(response.message);
    } catch (actionError) {
      Alert.alert(OPERATOR_ALERT_METADATA.actionFailedTitle, getErrorMessage(actionError));
      void fetchMcpToolsForServer(serverName);
    } finally {
      setPendingAction(null);
    }
  }, [fetchMcpToolsForServer, settingsClient]);

  const runOperatorAgent = useCallback(async () => {
    if (!settingsClient) {
      Alert.alert(OPERATOR_ALERT_METADATA.connectionRequiredTitle, OPERATOR_ALERT_METADATA.connectionRequiredMessages.runAgent);
      return;
    }

    const prompt = operatorAgentPrompt.trim();
    if (!prompt) {
      Alert.alert(OPERATOR_ALERT_METADATA.promptRequiredTitle, OPERATOR_ALERT_METADATA.promptRequiredMessage);
      return;
    }

    setPendingAction('run-agent');
    setActionFeedback(null);
    try {
      const response = await settingsClient.runOperatorAgent({ prompt });
      if (!response.success) {
        throw new Error(response.error || OPERATOR_ALERT_METADATA.defaultAgentRunFailureMessage);
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
      Alert.alert(OPERATOR_ALERT_METADATA.actionFailedTitle, getErrorMessage(actionError));
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
      Alert.alert(OPERATOR_ALERT_METADATA.connectionRequiredTitle, OPERATOR_ALERT_METADATA.connectionRequiredMessages.settingsSave);
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
          ? `${successMessage} ${OPERATOR_ALERT_METADATA.connectionSettlingSuffix}`
          : successMessage,
      );

      if (!touchesConnection) {
        setTimeout(() => {
          void loadOperatorData(true);
        }, 150);
      }
    } catch (updateError) {
      setSettings(previousSettings);
      Alert.alert(OPERATOR_ALERT_METADATA.updateFailedTitle, getErrorMessage(updateError));
      void loadOperatorData(true);
    } finally {
      setPendingSetting(null);
    }
  }, [loadOperatorData, settings, settingsClient]);

  const handleRemoteServerEnabledToggle = useCallback((nextValue: boolean) => {
    if (!settings?.remoteServerEnabled && nextValue) {
      void applySettingsUpdate(
        { remoteServerEnabled: true },
        REMOTE_SERVER_ENABLED_FIELD_METADATA.pendingLabel,
        REMOTE_SERVER_ENABLED_FIELD_METADATA.enableSuccessMessage,
      );
      return;
    }

    if (settings?.remoteServerEnabled && !nextValue) {
      confirmAction(
        REMOTE_SERVER_ENABLED_FIELD_METADATA.disableConfirmTitle,
        REMOTE_SERVER_ENABLED_FIELD_METADATA.disableConfirmMessage,
        REMOTE_SERVER_ENABLED_FIELD_METADATA.disableConfirmButtonLabel,
        true,
        () => applySettingsUpdate(
          { remoteServerEnabled: false },
          REMOTE_SERVER_ENABLED_FIELD_METADATA.pendingLabel,
          REMOTE_SERVER_ENABLED_FIELD_METADATA.disableSuccessMessage,
        ),
      );
      return;
    }

    void applySettingsUpdate(
      { remoteServerEnabled: nextValue },
      REMOTE_SERVER_ENABLED_FIELD_METADATA.pendingLabel,
      REMOTE_SERVER_ENABLED_FIELD_METADATA.updateSuccessMessage,
    );
  }, [applySettingsUpdate, confirmAction, settings?.remoteServerEnabled]);

  const handleRemoteServerPortSave = useCallback(() => {
    const parsed = Number.parseInt(drafts.remoteServerPort.trim(), 10);
    if (!isRemoteServerPortUpdateValue(parsed)) {
      Alert.alert(REMOTE_SERVER_PORT_FIELD_METADATA.invalidTitle, REMOTE_SERVER_PORT_FIELD_METADATA.invalidMessage);
      setDrafts((current) => ({
        ...current,
        remoteServerPort: String(settings?.remoteServerPort ?? DEFAULT_REMOTE_SERVER_PORT),
      }));
      return;
    }

    void applySettingsUpdate(
      { remoteServerPort: parsed },
      REMOTE_SERVER_PORT_FIELD_METADATA.pendingLabel,
      REMOTE_SERVER_PORT_FIELD_METADATA.formatSuccessMessage(parsed),
    );
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
  const isDesktopMac = status?.system.platform === 'darwin';
  const trustedDeviceIds = settings?.remoteServerOperatorAllowDeviceIds ?? [];
  const currentDeviceTrusted = currentDeviceId ? trustedDeviceIds.includes(currentDeviceId) : false;
  const channelAllowlistFields = CHANNEL_OPERATOR_ALLOWLISTS_SECTION_METADATA.fields;
  const desktopShellFields = DESKTOP_SHELL_SETTINGS_SECTION_METADATA.fields;
  const desktopFloatingPanelFields = DESKTOP_FLOATING_PANEL_SETTINGS_SECTION_METADATA.fields;

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
          <Text style={styles.panelTitle}>{OPERATOR_CONNECTION_REQUIRED_PANEL_METADATA.panelTitle}</Text>
          <Text style={styles.bodyText}>{OPERATOR_CONNECTION_REQUIRED_PANEL_METADATA.bodyText}</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={() => navigation.navigate('ConnectionSettings')}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_CONNECTION_REQUIRED_PANEL_METADATA.openSettingsAccessibilityLabel)}
          >
            <Text style={styles.primaryActionText}>{OPERATOR_CONNECTION_REQUIRED_PANEL_METADATA.openSettingsButtonLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

      {settingsClient && (
        <>
          <View style={styles.panel}>
            <View style={styles.headerRow}>
              <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
              <View style={styles.headerCopy}>
                <Text style={styles.panelTitle}>{OPERATOR_STATUS_PANEL_METADATA.panelTitle}</Text>
                <Text style={styles.mutedText}>
                  {status ? OPERATOR_STATUS_PANEL_METADATA.formatUpdatedText(status.health.overall, status.timestamp) : OPERATOR_STATUS_PANEL_METADATA.waitingText}
                </Text>
              </View>
            </View>
            {status && (
              <Text style={styles.detailText}>
                {OPERATOR_STATUS_PANEL_METADATA.formatIntegrationSummary(status.integrations.pushNotifications.tokenCount, status.recentErrors.total)}
              </Text>
            )}
            {actionFeedback && <Text style={styles.successText}>{actionFeedback}</Text>}
            {error && <Text style={styles.warningText}>{error}</Text>}
            {pendingSetting && <Text style={styles.mutedText}>{OPERATOR_STATUS_PANEL_METADATA.formatPendingSettingText(pendingSetting)}</Text>}
          </View>

          {status?.system && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{OPERATOR_SYSTEM_PANEL_METADATA.panelTitle}</Text>
              <Text style={styles.detailText}>
                {OPERATOR_SYSTEM_PANEL_METADATA.formatPlatformSummary(status.system)}
              </Text>
              <Text style={styles.detailText}>
                {OPERATOR_SYSTEM_PANEL_METADATA.formatRuntimeSummary(status.system)}
              </Text>
              <Text style={styles.detailText}>
                {OPERATOR_SYSTEM_PANEL_METADATA.formatMemorySummary(status.system)}
              </Text>
              <Text style={styles.mutedText}>
                {OPERATOR_SYSTEM_PANEL_METADATA.formatUptimeSummary(status.system)}
              </Text>
            </View>
          )}

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.sectionTitle}</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void loadDiagnosticReport()}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.generateAccessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'diagnostic-report'
                    ? OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.generatePendingLabel
                    : OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.generateButtonLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => confirmAction(
                  OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.saveConfirmTitle,
                  OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.saveConfirmMessage,
                  OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.saveConfirmButtonLabel,
                  false,
                  () => runAction('diagnostic-report-save', () => settingsClient.saveOperatorDiagnosticReport(), false),
                )}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.saveAccessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'diagnostic-report-save'
                    ? OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.savePendingLabel
                    : OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.saveButtonLabel}
                </Text>
              </TouchableOpacity>
            </View>
            {diagnosticReport ? (
              <>
                <Text style={styles.detailText}>
                  {OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.formatGeneratedAt(diagnosticReport.timestamp)}
                </Text>
                <Text style={styles.detailText}>
                  {OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.formatMcpSummary(
                    diagnosticReport.mcp.availableTools,
                    Object.keys(diagnosticReport.mcp.serverStatus).length,
                    diagnosticReport.config.mcpServersCount,
                  )}
                </Text>
                <Text style={styles.detailText}>
                  {OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.formatLogEntries(diagnosticReport.errors.length)}
                </Text>
                {diagnosticReport.mcp.toolDiscoveryError ? (
                  <Text style={styles.warningText}>
                    {OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.formatToolDiscoveryError(diagnosticReport.mcp.toolDiscoveryError)}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.mutedText}>{OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.emptyReportText}</Text>
            )}
          </View>

          {status?.sessions && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{OPERATOR_AGENT_SESSIONS_PANEL_METADATA.panelTitle}</Text>
              <Text style={styles.detailText}>
                {OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatSummary(status.sessions.activeSessions, status.sessions.recentSessions)}
              </Text>
              <View style={styles.mcpActionRow}>
                <TouchableOpacity
                  style={[
                    styles.sessionStopButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || status.sessions.recentSessions === 0) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    OPERATOR_AGENT_SESSIONS_PANEL_METADATA.clearInactiveConfirmTitle,
                    OPERATOR_AGENT_SESSIONS_PANEL_METADATA.clearInactiveConfirmMessage,
                    OPERATOR_AGENT_SESSIONS_PANEL_METADATA.clearInactiveConfirmButtonLabel,
                    false,
                    () => runAction(
                      'agent-sessions-clear-inactive',
                      () => settingsClient.clearInactiveOperatorAgentSessions(),
                    ),
                  )}
                  disabled={controlsDisabled || status.sessions.recentSessions === 0}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.clearInactiveAccessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>
                    {pendingAction === 'agent-sessions-clear-inactive'
                      ? OPERATOR_AGENT_SESSIONS_PANEL_METADATA.clearInactivePendingLabel
                      : OPERATOR_AGENT_SESSIONS_PANEL_METADATA.clearInactiveButtonLabel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sessionStopButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || status.sessions.activeSessions === 0) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => void runAction(
                    'agent-sessions-snooze-hide-panel',
                    () => settingsClient.snoozeOperatorAgentSessionsAndHidePanel(
                      status.sessions.activeSessionDetails.map((s) => s.id),
                    ),
                    false,
                  )}
                  disabled={controlsDisabled || status.sessions.activeSessions === 0}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.hideActiveAccessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>
                    {pendingAction === 'agent-sessions-snooze-hide-panel'
                      ? OPERATOR_AGENT_SESSIONS_PANEL_METADATA.hideActivePendingLabel
                      : OPERATOR_AGENT_SESSIONS_PANEL_METADATA.hideActiveButtonLabel}
                  </Text>
                </TouchableOpacity>
              </View>
              {status.sessions.activeSessionDetails.map((s) => {
                const stopAction = `agent-session-stop:${s.id}`;
                const showAction = `agent-session-show:${s.id}`;
                const snoozeAction = `agent-session-snooze:${s.id}`;
                const isSnoozed = s.isSnoozed === true;
                const sessionName = getAgentSessionDisplayName(s);
                return (
                  <View key={s.id} style={styles.agentSessionRow}>
                    <View style={styles.agentSessionCopy}>
                      <Text style={styles.detailText}>
                        {formatActiveAgentSessionSummary(s)}
                      </Text>
                      <Text style={styles.mutedText}>
                        {OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatActiveStartedAt(s.startTime)}
                      </Text>
                    </View>
                    <View style={styles.mcpActionRow}>
                      <TouchableOpacity
                        style={[
                          styles.sessionStopButton,
                          styles.secondaryActionButton,
                          controlsDisabled && styles.actionButtonDisabled,
                        ]}
                        onPress={() => void runAction(showAction, () => settingsClient.showOperatorAgentSession(s.id))}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatShowAccessibilityLabel(sessionName))}
                      >
                        <Text style={styles.secondaryActionText}>
                          {pendingAction === showAction
                            ? OPERATOR_AGENT_SESSIONS_PANEL_METADATA.showPendingLabel
                            : OPERATOR_AGENT_SESSIONS_PANEL_METADATA.showButtonLabel}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.sessionStopButton,
                          styles.secondaryActionButton,
                          controlsDisabled && styles.actionButtonDisabled,
                        ]}
                        onPress={() => void runAction(
                          snoozeAction,
                          () => isSnoozed
                            ? settingsClient.unsnoozeOperatorAgentSession(s.id)
                            : settingsClient.snoozeOperatorAgentSession(s.id),
                        )}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatSnoozeAccessibilityLabel(sessionName, isSnoozed))}
                      >
                        <Text style={styles.secondaryActionText}>
                          {pendingAction === snoozeAction
                            ? OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatSnoozePendingLabel(isSnoozed)
                            : OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatSnoozeButtonLabel(isSnoozed)}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.sessionStopButton,
                          styles.secondaryActionButton,
                          controlsDisabled && styles.actionButtonDisabled,
                        ]}
                        onPress={() => confirmAction(
                          OPERATOR_AGENT_SESSIONS_PANEL_METADATA.stopConfirmTitle,
                          OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatStopConfirmMessage(sessionName),
                          OPERATOR_AGENT_SESSIONS_PANEL_METADATA.stopConfirmButtonLabel,
                          false,
                          () => runAction(stopAction, () => settingsClient.stopOperatorAgentSession(s.id)),
                        )}
                        disabled={controlsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatStopAccessibilityLabel(sessionName))}
                      >
                        <Text style={styles.secondaryActionText}>
                          {pendingAction === stopAction
                            ? OPERATOR_AGENT_SESSIONS_PANEL_METADATA.stopPendingLabel
                            : OPERATOR_AGENT_SESSIONS_PANEL_METADATA.stopButtonLabel}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              {(status.sessions.recentSessionDetails ?? []).length > 0 && (
                <>
                  <Text style={styles.mutedText}>{OPERATOR_AGENT_SESSIONS_PANEL_METADATA.recentSessionsLabel}</Text>
                  {(status.sessions.recentSessionDetails ?? []).map((s) => {
                    const clearAction = `agent-session-clear:${s.id}`;
                    const sessionName = getAgentSessionDisplayName(s);
                    return (
                      <View key={s.id} style={styles.agentSessionRow}>
                        <View style={styles.agentSessionCopy}>
                          <Text style={styles.detailText}>
                            {formatRecentAgentSessionSummary(s)}
                          </Text>
                          <Text style={styles.mutedText}>
                            {OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatRecentTime(s.startTime, s.endTime)}
                          </Text>
                        </View>
                        <View style={styles.mcpActionRow}>
                          <TouchableOpacity
                            style={[
                              styles.sessionStopButton,
                              styles.secondaryActionButton,
                              controlsDisabled && styles.actionButtonDisabled,
                            ]}
                            onPress={() => confirmAction(
                              OPERATOR_AGENT_SESSIONS_PANEL_METADATA.dismissConfirmTitle,
                              OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatDismissConfirmMessage(sessionName),
                              OPERATOR_AGENT_SESSIONS_PANEL_METADATA.dismissConfirmButtonLabel,
                              false,
                              () => runAction(clearAction, () => settingsClient.clearOperatorAgentSession(s.id)),
                            )}
                            disabled={controlsDisabled}
                            accessibilityRole="button"
                            accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatDismissAccessibilityLabel(sessionName))}
                          >
                            <Text style={styles.secondaryActionText}>
                              {pendingAction === clearAction
                                ? OPERATOR_AGENT_SESSIONS_PANEL_METADATA.dismissPendingLabel
                                : OPERATOR_AGENT_SESSIONS_PANEL_METADATA.dismissButtonLabel}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
              {status.sessions.activeSessions === 0 && (
                <Text style={styles.mutedText}>{OPERATOR_AGENT_SESSIONS_PANEL_METADATA.noActiveSessionsText}</Text>
              )}
            </View>
          )}

          {messageQueues.length > 0 && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.panelTitle}</Text>
              <Text style={styles.detailText}>
                {OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatSummary(
                  messageQueues.reduce((sum, queue) => sum + queue.messageCount, 0),
                  messageQueues.length,
                )}
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
                        {OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatQueueSummary(queue.conversationId, queue.messageCount, queue.isPaused)}
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
                                    accessibilityLabel={createTextInputAccessibilityLabel(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatMessageInputAccessibilityLabel(message.id))}
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
                                      accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatCancelEditAccessibilityLabel(message.id))}
                                    >
                                      <Text style={styles.secondaryActionText}>{OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.cancelEditButtonLabel}</Text>
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
                                      accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatSaveMessageAccessibilityLabel(message.id))}
                                    >
                                      <Text style={styles.secondaryActionText}>
                                        {pendingAction === updateAction
                                          ? OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.saveMessagePendingLabel
                                          : OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.saveMessageButtonLabel}
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
                                        accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatRetryMessageAccessibilityLabel(message.id))}
                                      >
                                        <Text style={styles.secondaryActionText}>
                                          {pendingAction === retryAction
                                            ? OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.retryMessagePendingLabel
                                            : OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.retryMessageButtonLabel}
                                        </Text>
                                      </TouchableOpacity>
                                    ) : null}
                                    {canEditMessage ? (
                                      <TouchableOpacity
                                        style={[styles.queueMessageButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                                        onPress={() => setEditingQueuedMessage({ conversationId: queue.conversationId, messageId: message.id, text: message.text })}
                                        disabled={controlsDisabled}
                                        accessibilityRole="button"
                                        accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatEditMessageAccessibilityLabel(message.id))}
                                      >
                                        <Text style={styles.secondaryActionText}>{OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.editMessageButtonLabel}</Text>
                                      </TouchableOpacity>
                                    ) : null}
                                    {canMutateMessage ? (
                                      <TouchableOpacity
                                        style={[styles.queueMessageButton, styles.secondaryActionButton, controlsDisabled && styles.actionButtonDisabled]}
                                        onPress={() => confirmAction(
                                          OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.removeMessageConfirmTitle,
                                          OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatRemoveMessageConfirmMessage(message.id, queue.conversationId),
                                          OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.removeMessageConfirmButtonLabel,
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
                                        accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatRemoveMessageAccessibilityLabel(message.id))}
                                      >
                                        <Text style={styles.secondaryActionText}>
                                          {pendingAction === removeAction
                                            ? OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.removeMessagePendingLabel
                                            : OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.removeMessageButtonLabel}
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
                          accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatResumeQueueAccessibilityLabel(queue.conversationId))}
                        >
                          <Text style={styles.secondaryActionText}>
                            {pendingAction === resumeAction
                              ? OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.resumeQueuePendingLabel
                              : OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.resumeQueueButtonLabel}
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
                          accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatPauseQueueAccessibilityLabel(queue.conversationId))}
                        >
                          <Text style={styles.secondaryActionText}>
                            {pendingAction === pauseAction
                              ? OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.pauseQueuePendingLabel
                              : OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.pauseQueueButtonLabel}
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
                          OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.clearQueueConfirmTitle,
                          OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatClearQueueConfirmMessage(queue.conversationId),
                          OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.clearQueueConfirmButtonLabel,
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
                        accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatClearQueueAccessibilityLabel(queue.conversationId))}
                      >
                        <Text style={styles.secondaryActionText}>
                          {pendingAction === clearAction
                            ? OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.clearQueuePendingLabel
                            : OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.clearQueueButtonLabel}
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
              <Text style={styles.panelTitle}>{OPERATOR_MCP_SERVERS_PANEL_METADATA.panelTitle}</Text>
              <Text style={styles.detailText}>
                {OPERATOR_MCP_SERVERS_PANEL_METADATA.formatSummary(
                  mcpServers.filter((s) => s.connected).length,
                  mcpServers.length,
                  mcpServers.reduce((sum, s) => sum + s.toolCount, 0),
                )}
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
                          {s.connected ? '✓' : s.enabled ? '✗' : '○'} {s.name}: {s.toolCount} tools{!s.enabled ? OPERATOR_MCP_SERVERS_PANEL_METADATA.disabledSuffix : ''}
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
                                  ? { ...response, message: OPERATOR_MCP_SERVERS_PANEL_METADATA.formatRestartedMessage(s.name) }
                                  : response;
                              })}
                              disabled={restartDisabled}
                              accessibilityRole="button"
                              accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatRestartAccessibilityLabel(s.name))}
                            >
                              <Text style={styles.secondaryActionText}>
                                {pendingAction === restartAction
                                  ? OPERATOR_MCP_SERVERS_PANEL_METADATA.restartPendingLabel
                                  : OPERATOR_MCP_SERVERS_PANEL_METADATA.restartButtonLabel}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.mcpRestartButton,
                                styles.secondaryActionButton,
                                stopDisabled && styles.actionButtonDisabled,
                              ]}
                              onPress={() => confirmAction(
                                OPERATOR_MCP_SERVERS_PANEL_METADATA.stopConfirmTitle,
                                OPERATOR_MCP_SERVERS_PANEL_METADATA.formatStopConfirmMessage(s.name),
                                OPERATOR_MCP_SERVERS_PANEL_METADATA.stopConfirmButtonLabel,
                                false,
                                () => runAction(stopAction, () => settingsClient.stopMCPServer(s.name)),
                              )}
                              disabled={stopDisabled}
                              accessibilityRole="button"
                              accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatStopAccessibilityLabel(s.name))}
                            >
                              <Text style={styles.secondaryActionText}>
                                {pendingAction === stopAction
                                  ? OPERATOR_MCP_SERVERS_PANEL_METADATA.stopPendingLabel
                                  : OPERATOR_MCP_SERVERS_PANEL_METADATA.stopButtonLabel}
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
                            accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatStartAccessibilityLabel(s.name))}
                          >
                            <Text style={styles.secondaryActionText}>
                              {pendingAction === startAction
                                ? OPERATOR_MCP_SERVERS_PANEL_METADATA.startPendingLabel
                                : OPERATOR_MCP_SERVERS_PANEL_METADATA.startButtonLabel}
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
                                message: OPERATOR_MCP_SERVERS_PANEL_METADATA.formatTestSuccessMessage(s.name, response.toolCount),
                              }
                              : {
                                success: false,
                                message: response.message,
                                error: response.error || response.message,
                              };
                          }, false)}
                          disabled={controlsDisabled}
                          accessibilityRole="button"
                          accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatTestAccessibilityLabel(s.name))}
                        >
                          <Text style={styles.secondaryActionText}>
                            {pendingAction === testAction
                              ? OPERATOR_MCP_SERVERS_PANEL_METADATA.testPendingLabel
                              : OPERATOR_MCP_SERVERS_PANEL_METADATA.testButtonLabel}
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
                          accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatLogsAccessibilityLabel(s.name, logsExpanded))}
                        >
                          <Text style={styles.secondaryActionText}>
                            {pendingAction === logsAction
                              ? OPERATOR_MCP_SERVERS_PANEL_METADATA.logsPendingLabel
                              : logsExpanded
                                ? OPERATOR_MCP_SERVERS_PANEL_METADATA.logsExpandedButtonLabel
                                : OPERATOR_MCP_SERVERS_PANEL_METADATA.logsButtonLabel}
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
                          accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatToolsAccessibilityLabel(s.name, toolsExpanded))}
                        >
                          <Text style={styles.secondaryActionText}>
                            {pendingAction === toolsAction
                              ? OPERATOR_MCP_SERVERS_PANEL_METADATA.toolsPendingLabel
                              : toolsExpanded
                                ? OPERATOR_MCP_SERVERS_PANEL_METADATA.toolsExpandedButtonLabel
                                : OPERATOR_MCP_SERVERS_PANEL_METADATA.toolsButtonLabel}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {logsExpanded ? (
                      <View style={styles.mcpLogsPanel}>
                        <View style={styles.logHeader}>
                          <Text style={styles.sectionCaption}>{OPERATOR_MCP_SERVERS_PANEL_METADATA.logsSectionTitle}</Text>
                          <TouchableOpacity
                            style={[
                              styles.mcpClearLogsButton,
                              styles.secondaryActionButton,
                              (controlsDisabled || logs.length === 0) && styles.actionButtonDisabled,
                            ]}
                            onPress={() => confirmAction(
                              OPERATOR_MCP_SERVERS_PANEL_METADATA.clearLogsConfirmTitle,
                              OPERATOR_MCP_SERVERS_PANEL_METADATA.formatClearLogsConfirmMessage(s.name),
                              OPERATOR_MCP_SERVERS_PANEL_METADATA.clearLogsConfirmButtonLabel,
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
                            accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatClearLogsAccessibilityLabel(s.name))}
                          >
                            <Text style={styles.secondaryActionText}>
                              {pendingAction === clearLogsAction
                                ? OPERATOR_MCP_SERVERS_PANEL_METADATA.clearLogsPendingLabel
                                : OPERATOR_MCP_SERVERS_PANEL_METADATA.clearLogsButtonLabel}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        {pendingAction === logsAction ? (
                          <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={styles.mutedText}>{OPERATOR_MCP_SERVERS_PANEL_METADATA.logsLoadingText}</Text>
                          </View>
                        ) : logs.length === 0 ? (
                          <Text style={styles.mutedText}>{OPERATOR_MCP_SERVERS_PANEL_METADATA.logsEmptyText}</Text>
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
                        <Text style={styles.sectionCaption}>{OPERATOR_MCP_SERVERS_PANEL_METADATA.toolsSectionTitle}</Text>
                        {pendingAction === toolsAction ? (
                          <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={styles.mutedText}>{OPERATOR_MCP_SERVERS_PANEL_METADATA.toolsLoadingText}</Text>
                          </View>
                        ) : tools.length === 0 ? (
                          <Text style={styles.mutedText}>{OPERATOR_MCP_SERVERS_PANEL_METADATA.toolsEmptyText}</Text>
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
                                    <Text style={styles.mutedText}>{OPERATOR_MCP_SERVERS_PANEL_METADATA.serverDisabledText}</Text>
                                  ) : null}
                                </View>
                                <Switch
                                  value={tool.enabled}
                                  onValueChange={(nextEnabled) => void setMcpToolEnabled(s.name, tool.name, nextEnabled)}
                                  disabled={toolDisabled}
                                  accessibilityLabel={createSwitchAccessibilityLabel(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatToolAccessibilityLabel(tool.name))}
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
              <Text style={styles.panelTitle}>{OPERATOR_CONVERSATIONS_PANEL_METADATA.panelTitle}</Text>
              {conversations.map((c) => (
                <View key={c.id} style={{ marginBottom: 6 }}>
                  <Text style={styles.detailText}>
                    {OPERATOR_CONVERSATIONS_PANEL_METADATA.formatConversationSummary(c.title, c.messageCount)}
                  </Text>
                  <Text style={styles.mutedText}>
                    {OPERATOR_CONVERSATIONS_PANEL_METADATA.formatConversationUpdatedPreview(c.updatedAt, c.preview)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{OPERATOR_ACTIONS_PANEL_METADATA.panelTitle}</Text>
            <Text style={styles.label}>{OPERATOR_ACTIONS_PANEL_METADATA.runAgentLabel}</Text>
            <TextInput
              style={[styles.input, styles.promptInput]}
              value={operatorAgentPrompt}
              onChangeText={setOperatorAgentPrompt}
              placeholder={OPERATOR_ACTIONS_PANEL_METADATA.runAgentPromptPlaceholder}
              placeholderTextColor={theme.colors.mutedForeground}
              multiline
              textAlignVertical="top"
              editable={pendingAction === null}
              accessibilityLabel={createTextInputAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.runAgentPromptAccessibilityLabel)}
              accessibilityHint={OPERATOR_ACTIONS_PANEL_METADATA.runAgentPromptAccessibilityHint}
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
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.runAgentButton.accessibilityLabel)}
              >
                <Text style={styles.primaryActionText}>
                  {pendingAction === 'run-agent'
                    ? OPERATOR_ACTIONS_PANEL_METADATA.runAgentButton.pendingLabel
                    : OPERATOR_ACTIONS_PANEL_METADATA.runAgentButton.buttonLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.primaryActionButton, pendingAction === 'refresh' && styles.actionButtonDisabled]}
                onPress={handleRefresh}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.refreshButton.accessibilityLabel)}
              >
                <Text style={styles.primaryActionText}>
                  {pendingAction === 'refresh'
                    ? OPERATOR_ACTIONS_PANEL_METADATA.refreshButton.pendingLabel
                    : OPERATOR_ACTIONS_PANEL_METADATA.refreshButton.buttonLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('stop-tts-playback', () => settingsClient.stopOperatorTtsPlayback(), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.stopSpeechButton.accessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'stop-tts-playback'
                    ? OPERATOR_ACTIONS_PANEL_METADATA.stopSpeechButton.pendingLabel
                    : OPERATOR_ACTIONS_PANEL_METADATA.stopSpeechButton.buttonLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('desktop-main-window-show', () => settingsClient.showOperatorMainWindow(), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.showAppButton.accessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'desktop-main-window-show'
                    ? OPERATOR_ACTIONS_PANEL_METADATA.showAppButton.pendingLabel
                    : OPERATOR_ACTIONS_PANEL_METADATA.showAppButton.buttonLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('desktop-main-window-history-show', () => settingsClient.showOperatorMainWindow('/'), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.showHistoryButton.accessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'desktop-main-window-history-show'
                    ? OPERATOR_ACTIONS_PANEL_METADATA.showHistoryButton.pendingLabel
                    : OPERATOR_ACTIONS_PANEL_METADATA.showHistoryButton.buttonLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('desktop-main-window-settings-show', () => settingsClient.showOperatorMainWindow('/settings'), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.showSettingsButton.accessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'desktop-main-window-settings-show'
                    ? OPERATOR_ACTIONS_PANEL_METADATA.showSettingsButton.pendingLabel
                    : OPERATOR_ACTIONS_PANEL_METADATA.showSettingsButton.buttonLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('desktop-panel-window-show', () => settingsClient.showOperatorPanelWindow(), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.showPanelButton.accessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'desktop-panel-window-show'
                    ? OPERATOR_ACTIONS_PANEL_METADATA.showPanelButton.pendingLabel
                    : OPERATOR_ACTIONS_PANEL_METADATA.showPanelButton.buttonLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('desktop-panel-window-hide', () => settingsClient.hideOperatorPanelWindow(), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.hidePanelButton.accessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'desktop-panel-window-hide'
                    ? OPERATOR_ACTIONS_PANEL_METADATA.hidePanelButton.pendingLabel
                    : OPERATOR_ACTIONS_PANEL_METADATA.hidePanelButton.buttonLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => void runAction('desktop-panel-window-reset', () => settingsClient.resetOperatorPanelWindow(), false)}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.resetPanelButton.accessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'desktop-panel-window-reset'
                    ? OPERATOR_ACTIONS_PANEL_METADATA.resetPanelButton.pendingLabel
                    : OPERATOR_ACTIONS_PANEL_METADATA.resetPanelButton.buttonLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => confirmAction(
                  OPERATOR_ACTIONS_PANEL_METADATA.restartRemoteServerAction.confirmTitle,
                  OPERATOR_ACTIONS_PANEL_METADATA.restartRemoteServerAction.confirmMessage,
                  OPERATOR_ACTIONS_PANEL_METADATA.restartRemoteServerAction.confirmButtonLabel,
                  false,
                  () => runAction('restart-remote-server', () => settingsClient.restartRemoteServer()),
                )}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.restartRemoteServerAction.accessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>{OPERATOR_ACTIONS_PANEL_METADATA.restartRemoteServerAction.buttonLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => confirmAction(
                  OPERATOR_ACTIONS_PANEL_METADATA.restartAppAction.confirmTitle,
                  OPERATOR_ACTIONS_PANEL_METADATA.restartAppAction.confirmMessage,
                  OPERATOR_ACTIONS_PANEL_METADATA.restartAppAction.confirmButtonLabel,
                  false,
                  () => runAction('restart-app', () => settingsClient.restartApp(), false),
                )}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.restartAppAction.accessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>{OPERATOR_ACTIONS_PANEL_METADATA.restartAppAction.buttonLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.destructiveActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => confirmAction(
                  OPERATOR_ACTIONS_PANEL_METADATA.emergencyStopAction.confirmTitle,
                  OPERATOR_ACTIONS_PANEL_METADATA.emergencyStopAction.confirmMessage,
                  OPERATOR_ACTIONS_PANEL_METADATA.emergencyStopAction.confirmButtonLabel,
                  true,
                  () => runAction('emergency-stop', () => settingsClient.emergencyStop()),
                )}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_ACTIONS_PANEL_METADATA.emergencyStopAction.accessibilityLabel)}
              >
                <Text style={styles.destructiveActionText}>{OPERATOR_ACTIONS_PANEL_METADATA.emergencyStopAction.buttonLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => confirmAction(
                  REMOTE_SERVER_API_KEY_FIELD_METADATA.rotateConfirmTitle,
                  REMOTE_SERVER_API_KEY_FIELD_METADATA.rotateConfirmMessage,
                  REMOTE_SERVER_API_KEY_FIELD_METADATA.rotateConfirmButtonLabel,
                  true,
                  rotateApiKey,
                )}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(REMOTE_SERVER_API_KEY_FIELD_METADATA.rotateAccessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'rotate-api-key' ? REMOTE_SERVER_API_KEY_FIELD_METADATA.rotatePendingButtonLabel : REMOTE_SERVER_API_KEY_FIELD_METADATA.rotateButtonLabel}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>{REMOTE_SERVER_API_KEY_FIELD_METADATA.rotateHelperText}</Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{OPERATOR_AUDIT_PANEL_METADATA.panelTitle}</Text>
            <Text style={styles.helperText}>{OPERATOR_AUDIT_PANEL_METADATA.helperText}</Text>
            {auditEntries.length === 0 ? (
              <Text style={styles.mutedText}>{OPERATOR_AUDIT_PANEL_METADATA.emptyText}</Text>
            ) : (
              auditEntries.map((entry) => {
                const sourceText = formatAuditSource(entry);
                const detailsText = formatAuditDetails(entry.details);

                return (
                  <View key={`${entry.timestamp}-${entry.action}-${entry.path}`} style={styles.auditItem}>
                    <View style={styles.auditHeader}>
                      <Text style={styles.auditAction}>{entry.action}</Text>
                      <Text style={[styles.auditStatus, entry.success ? styles.auditStatusSuccess : styles.auditStatusFailure]}>
                        {entry.success
                          ? OPERATOR_AUDIT_PANEL_METADATA.successStatusLabel
                          : OPERATOR_AUDIT_PANEL_METADATA.failedStatusLabel}
                      </Text>
                    </View>
                    <Text style={styles.auditPath}>{entry.path}</Text>
                    <Text style={styles.auditTimestamp}>{formatTimestamp(entry.timestamp)}</Text>
                    {sourceText ? (
                      <Text style={styles.helperText}>{OPERATOR_AUDIT_PANEL_METADATA.formatSource(sourceText)}</Text>
                    ) : null}
                    {detailsText ? (
                      <Text style={styles.helperText}>{OPERATOR_AUDIT_PANEL_METADATA.formatDetails(detailsText)}</Text>
                    ) : null}
                    {entry.failureReason ? (
                      <Text style={styles.warningText}>{OPERATOR_AUDIT_PANEL_METADATA.formatFailure(entry.failureReason)}</Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>

          {isLoading && !status && !settings ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.mutedText}>{OPERATOR_STATUS_PANEL_METADATA.loadingText}</Text>
            </View>
          ) : null}

          {settings && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{OPERATOR_REMOTE_ACCESS_SETTINGS_PANEL_METADATA.panelTitle}</Text>
              <Text style={styles.helperText}>{OPERATOR_REMOTE_ACCESS_SETTINGS_PANEL_METADATA.helperText}</Text>

              <Text style={styles.subsectionTitle}>{OPERATOR_REMOTE_ACCESS_SETTINGS_PANEL_METADATA.remoteServerSectionTitle}</Text>
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>{REMOTE_SERVER_ENABLED_FIELD_METADATA.label}</Text>
                  <Text style={styles.helperText}>{REMOTE_SERVER_ENABLED_FIELD_METADATA.helperText}</Text>
                </View>
                <Switch
                  value={settings.remoteServerEnabled ?? DEFAULT_REMOTE_SERVER_ENABLED}
                  onValueChange={handleRemoteServerEnabledToggle}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel(REMOTE_SERVER_ENABLED_FIELD_METADATA.accessibilityLabel)}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.remoteServerEnabled ?? DEFAULT_REMOTE_SERVER_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <Text style={styles.label}>{REMOTE_SERVER_PORT_FIELD_METADATA.label}</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.remoteServerPort}
                onChangeText={(value) => setDrafts((current) => ({ ...current, remoteServerPort: value }))}
                onEndEditing={handleRemoteServerPortSave}
                editable={!controlsDisabled}
                keyboardType="number-pad"
                placeholder={REMOTE_SERVER_PORT_FIELD_METADATA.placeholder}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel(REMOTE_SERVER_PORT_FIELD_METADATA.accessibilityLabel)}
              />
              <Text style={styles.helperText}>{OPERATOR_REMOTE_ACCESS_SETTINGS_PANEL_METADATA.portDisconnectHelperText}</Text>

              <Text style={styles.label}>{REMOTE_SERVER_BIND_ADDRESS_FIELD_METADATA.label}</Text>
              <View style={styles.chipRow}>
                {REMOTE_SERVER_BIND_ADDRESS_DISPLAY_OPTIONS.map((option) => {
                  const selected = (settings.remoteServerBindAddress ?? DEFAULT_REMOTE_SERVER_BIND_ADDRESS) === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chipButton,
                        selected && styles.chipButtonActive,
                        controlsDisabled && styles.actionButtonDisabled,
                      ]}
                      onPress={() => void applySettingsUpdate(
                        { remoteServerBindAddress: option.value },
                        REMOTE_SERVER_BIND_ADDRESS_FIELD_METADATA.pendingLabel,
                        option.successMessage,
                      )}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: controlsDisabled }}
                      accessibilityLabel={createButtonAccessibilityLabel(`Use ${option.compactLabel} for ${REMOTE_SERVER_BIND_ADDRESS_FIELD_METADATA.accessibilityLabel}`)}
                    >
                      <Text style={[styles.chipButtonText, selected && styles.chipButtonTextActive]}>
                        {option.compactLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.helperText}>{REMOTE_SERVER_BIND_ADDRESS_FIELD_METADATA.helperText}</Text>

              <Text style={styles.label}>{REMOTE_SERVER_LOG_LEVEL_FIELD_METADATA.label}</Text>
              <View style={styles.chipRow}>
                {REMOTE_SERVER_LOG_LEVEL_DISPLAY_OPTIONS.map((option) => {
                  const selected = (settings.remoteServerLogLevel ?? DEFAULT_REMOTE_SERVER_LOG_LEVEL) === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chipButton,
                        selected && styles.chipButtonActive,
                        controlsDisabled && styles.actionButtonDisabled,
                      ]}
                      onPress={() => void applySettingsUpdate(
                        { remoteServerLogLevel: option.value },
                        REMOTE_SERVER_LOG_LEVEL_FIELD_METADATA.pendingLabel,
                        option.successMessage,
                      )}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: controlsDisabled }}
                      accessibilityLabel={createButtonAccessibilityLabel(`Use ${option.label} ${REMOTE_SERVER_LOG_LEVEL_FIELD_METADATA.accessibilityLabel}`)}
                    >
                      <Text style={[styles.chipButtonText, selected && styles.chipButtonTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>{REMOTE_SERVER_CORS_ORIGINS_FIELD_METADATA.label}</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.remoteServerCorsOrigins}
                onChangeText={(value) => setDrafts((current) => ({ ...current, remoteServerCorsOrigins: value }))}
                onEndEditing={() => {
                  const origins = parseConfigListInput(drafts.remoteServerCorsOrigins, { unique: true });
                  void applySettingsUpdate(
                    { remoteServerCorsOrigins: origins.length > 0 ? origins : [...DEFAULT_REMOTE_SERVER_CORS_ORIGINS] },
                    REMOTE_SERVER_CORS_ORIGINS_FIELD_METADATA.pendingLabel,
                    REMOTE_SERVER_CORS_ORIGINS_FIELD_METADATA.successMessage,
                  );
                }}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={REMOTE_SERVER_CORS_ORIGINS_FIELD_METADATA.placeholder}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel(REMOTE_SERVER_CORS_ORIGINS_FIELD_METADATA.accessibilityLabel)}
              />
              <Text style={styles.helperText}>{REMOTE_SERVER_CORS_ORIGINS_FIELD_METADATA.helperText}</Text>

              <Text style={styles.subsectionTitle}>{REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.sectionTitle}</Text>
              <Text style={styles.helperText}>{REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.helperText}</Text>
              <Text style={styles.detailText}>
                {REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.currentDeviceLabel}: {currentDeviceId ?? REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.currentDeviceLoadingText}
              </Text>
              <Text style={styles.label}>{REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.label}</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.remoteServerOperatorAllowDeviceIds}
                onChangeText={(value) => setDrafts((current) => ({ ...current, remoteServerOperatorAllowDeviceIds: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { remoteServerOperatorAllowDeviceIds: parseConfigListInput(drafts.remoteServerOperatorAllowDeviceIds, { unique: true }) },
                  REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.pendingLabel,
                  REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.updateSuccessMessage,
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.placeholder}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel(REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.accessibilityLabel)}
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
                      REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.pendingLabel,
                      REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.trustSuccessMessage,
                    );
                  }}
                  disabled={controlsDisabled || !currentDeviceId || currentDeviceTrusted}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.trustAccessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>
                    {currentDeviceTrusted
                      ? REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.trustedButtonLabel
                      : REMOTE_SERVER_OPERATOR_DEVICE_ALLOWLIST_FIELD_METADATA.trustButtonLabel}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.subsectionTitle}>{DESKTOP_SHELL_SETTINGS_SECTION_METADATA.sectionTitle}</Text>
              {isDesktopMac ? (
                <View style={styles.row}>
                  <View style={styles.rowCopy}>
                    <Text style={styles.label}>{desktopShellFields.hideDockIcon.label}</Text>
                    <Text style={styles.helperText}>{desktopShellFields.hideDockIcon.helperText}</Text>
                  </View>
                  <Switch
                    value={settings.hideDockIcon ?? DEFAULT_HIDE_DOCK_ICON}
                    onValueChange={(value) => void applySettingsUpdate(
                      { hideDockIcon: value },
                      desktopShellFields.hideDockIcon.pendingLabel,
                      desktopShellFields.hideDockIcon.successMessage,
                    )}
                    disabled={controlsDisabled}
                    accessibilityLabel={createSwitchAccessibilityLabel(desktopShellFields.hideDockIcon.accessibilityLabel)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(settings.hideDockIcon ?? DEFAULT_HIDE_DOCK_ICON) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
              ) : null}

              <Text style={styles.label}>{DESKTOP_THEME_PREFERENCE_FIELD_METADATA.label}</Text>
              <View style={styles.chipRow}>
                {THEME_PREFERENCE_OPTIONS.map((option) => {
                  const isActive = (settings.themePreference ?? DEFAULT_THEME_PREFERENCE) === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chipButton,
                        isActive && styles.chipButtonActive,
                        controlsDisabled && styles.actionButtonDisabled,
                      ]}
                      onPress={() => void applySettingsUpdate(
                        { themePreference: option.value },
                        DESKTOP_THEME_PREFERENCE_FIELD_METADATA.pendingLabel,
                        DESKTOP_THEME_PREFERENCE_FIELD_METADATA.formatSuccessMessage(option.label),
                      )}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityLabel={createButtonAccessibilityLabel(DESKTOP_THEME_PREFERENCE_FIELD_METADATA.formatButtonAccessibilityLabel(option.label))}
                    >
                      <Text style={[styles.chipButtonText, isActive && styles.chipButtonTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>{desktopShellFields.launchAtLogin.label}</Text>
                  <Text style={styles.helperText}>{desktopShellFields.launchAtLogin.helperText}</Text>
                </View>
                <Switch
                  value={settings.launchAtLogin ?? DEFAULT_LAUNCH_AT_LOGIN}
                  onValueChange={(value) => void applySettingsUpdate(
                    { launchAtLogin: value },
                    desktopShellFields.launchAtLogin.pendingLabel,
                    desktopShellFields.launchAtLogin.successMessage,
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel(desktopShellFields.launchAtLogin.accessibilityLabel)}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.launchAtLogin ?? DEFAULT_LAUNCH_AT_LOGIN) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>{DESKTOP_TEXT_INPUT_FIELD_METADATA.label}</Text>
                  <Text style={styles.helperText}>{DESKTOP_TEXT_INPUT_FIELD_METADATA.helperText}</Text>
                </View>
                <Switch
                  value={settings.textInputEnabled ?? DEFAULT_TEXT_INPUT_ENABLED}
                  onValueChange={(value) => void applySettingsUpdate(
                    { textInputEnabled: value },
                    DESKTOP_TEXT_INPUT_FIELD_METADATA.pendingLabel,
                    DESKTOP_TEXT_INPUT_FIELD_METADATA.successMessage,
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel(DESKTOP_TEXT_INPUT_FIELD_METADATA.accessibilityLabel)}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.textInputEnabled ?? DEFAULT_TEXT_INPUT_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <Text style={styles.subsectionTitle}>{DESKTOP_FLOATING_PANEL_SETTINGS_SECTION_METADATA.sectionTitle}</Text>
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>{desktopFloatingPanelFields.floatingPanelAutoShow.label}</Text>
                  <Text style={styles.helperText}>{desktopFloatingPanelFields.floatingPanelAutoShow.helperText}</Text>
                </View>
                <Switch
                  value={settings.floatingPanelAutoShow ?? DEFAULT_FLOATING_PANEL_AUTO_SHOW}
                  onValueChange={(value) => void applySettingsUpdate(
                    { floatingPanelAutoShow: value },
                    desktopFloatingPanelFields.floatingPanelAutoShow.pendingLabel,
                    desktopFloatingPanelFields.floatingPanelAutoShow.successMessage,
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel(desktopFloatingPanelFields.floatingPanelAutoShow.accessibilityLabel)}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.floatingPanelAutoShow ?? DEFAULT_FLOATING_PANEL_AUTO_SHOW) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>{desktopFloatingPanelFields.hidePanelWhenMainFocused.label}</Text>
                  <Text style={styles.helperText}>{desktopFloatingPanelFields.hidePanelWhenMainFocused.helperText}</Text>
                </View>
                <Switch
                  value={settings.hidePanelWhenMainFocused ?? DEFAULT_HIDE_PANEL_WHEN_MAIN_FOCUSED}
                  onValueChange={(value) => void applySettingsUpdate(
                    { hidePanelWhenMainFocused: value },
                    desktopFloatingPanelFields.hidePanelWhenMainFocused.pendingLabel,
                    desktopFloatingPanelFields.hidePanelWhenMainFocused.successMessage,
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel(desktopFloatingPanelFields.hidePanelWhenMainFocused.accessibilityLabel)}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.hidePanelWhenMainFocused ?? DEFAULT_HIDE_PANEL_WHEN_MAIN_FOCUSED) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>{desktopFloatingPanelFields.panelDragEnabled.label}</Text>
                  <Text style={styles.helperText}>{desktopFloatingPanelFields.panelDragEnabled.helperText}</Text>
                </View>
                <Switch
                  value={settings.panelDragEnabled ?? DEFAULT_PANEL_DRAG_ENABLED}
                  onValueChange={(value) => void applySettingsUpdate(
                    { panelDragEnabled: value },
                    desktopFloatingPanelFields.panelDragEnabled.pendingLabel,
                    desktopFloatingPanelFields.panelDragEnabled.successMessage,
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel(desktopFloatingPanelFields.panelDragEnabled.accessibilityLabel)}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.panelDragEnabled ?? DEFAULT_PANEL_DRAG_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <Text style={styles.label}>{desktopFloatingPanelFields.panelPosition.label}</Text>
              <View style={styles.chipRow}>
                {PANEL_POSITION_OPTIONS.map((option) => {
                  const isActive = (settings.panelPosition ?? DEFAULT_PANEL_POSITION) === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chipButton,
                        isActive && styles.chipButtonActive,
                        controlsDisabled && styles.actionButtonDisabled,
                      ]}
                      onPress={() => void applySettingsUpdate(
                        { panelPosition: option.value },
                        desktopFloatingPanelFields.panelPosition.pendingLabel,
                        desktopFloatingPanelFields.panelPosition.formatSuccessMessage(option.compactLabel),
                      )}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityLabel={createButtonAccessibilityLabel(desktopFloatingPanelFields.panelPosition.formatButtonAccessibilityLabel(option.compactLabel))}
                    >
                      <Text style={[styles.chipButtonText, isActive && styles.chipButtonTextActive]}>
                        {option.compactLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>{REMOTE_SERVER_AUTO_SHOW_PANEL_FIELD_METADATA.label}</Text>
                  <Text style={styles.helperText}>{REMOTE_SERVER_AUTO_SHOW_PANEL_FIELD_METADATA.helperText}</Text>
                </View>
                <Switch
                  value={settings.remoteServerAutoShowPanel ?? DEFAULT_REMOTE_SERVER_AUTO_SHOW_PANEL}
                  onValueChange={(value) => void applySettingsUpdate(
                    { remoteServerAutoShowPanel: value },
                    REMOTE_SERVER_AUTO_SHOW_PANEL_FIELD_METADATA.pendingLabel,
                    REMOTE_SERVER_AUTO_SHOW_PANEL_FIELD_METADATA.successMessage,
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel(REMOTE_SERVER_AUTO_SHOW_PANEL_FIELD_METADATA.accessibilityLabel)}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.remoteServerAutoShowPanel ?? DEFAULT_REMOTE_SERVER_AUTO_SHOW_PANEL) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>{REMOTE_SERVER_TERMINAL_QR_FIELD_METADATA.label}</Text>
                  <Text style={styles.helperText}>{REMOTE_SERVER_TERMINAL_QR_FIELD_METADATA.helperText}</Text>
                </View>
                <Switch
                  value={settings.remoteServerTerminalQrEnabled ?? DEFAULT_REMOTE_SERVER_TERMINAL_QR_ENABLED}
                  onValueChange={(value) => void applySettingsUpdate(
                    { remoteServerTerminalQrEnabled: value },
                    REMOTE_SERVER_TERMINAL_QR_FIELD_METADATA.pendingLabel,
                    REMOTE_SERVER_TERMINAL_QR_FIELD_METADATA.successMessage,
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel(REMOTE_SERVER_TERMINAL_QR_FIELD_METADATA.accessibilityLabel)}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.remoteServerTerminalQrEnabled ?? DEFAULT_REMOTE_SERVER_TERMINAL_QR_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <Text style={styles.subsectionTitle}>{CLOUDFLARE_TUNNEL_SECTION_METADATA.sectionTitle}</Text>
              <Text style={styles.label}>{CLOUDFLARE_TUNNEL_MODE_FIELD_METADATA.label}</Text>
              <View style={styles.chipRow}>
                {CLOUDFLARE_TUNNEL_MODE_DISPLAY_OPTIONS.map((option) => {
                  const selected = (settings.cloudflareTunnelMode ?? DEFAULT_CLOUDFLARE_TUNNEL_MODE) === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chipButton,
                        selected && styles.chipButtonActive,
                        controlsDisabled && styles.actionButtonDisabled,
                      ]}
                      onPress={() => void applySettingsUpdate(
                        { cloudflareTunnelMode: option.value },
                        CLOUDFLARE_TUNNEL_MODE_FIELD_METADATA.pendingLabel,
                        option.successMessage,
                      )}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: controlsDisabled }}
                      accessibilityLabel={createButtonAccessibilityLabel(`Use ${option.compactLabel} ${CLOUDFLARE_TUNNEL_MODE_FIELD_METADATA.accessibilityLabel}`)}
                    >
                      <Text style={[styles.chipButtonText, selected && styles.chipButtonTextActive]}>
                        {option.compactLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.label}>{CLOUDFLARE_TUNNEL_AUTO_START_FIELD_METADATA.label}</Text>
                  <Text style={styles.helperText}>{CLOUDFLARE_TUNNEL_AUTO_START_FIELD_METADATA.helperText}</Text>
                </View>
                <Switch
                  value={settings.cloudflareTunnelAutoStart ?? DEFAULT_CLOUDFLARE_TUNNEL_AUTO_START}
                  onValueChange={(value) => void applySettingsUpdate(
                    { cloudflareTunnelAutoStart: value },
                    CLOUDFLARE_TUNNEL_AUTO_START_FIELD_METADATA.pendingLabel,
                    CLOUDFLARE_TUNNEL_AUTO_START_FIELD_METADATA.successMessage,
                  )}
                  disabled={controlsDisabled}
                  accessibilityLabel={createSwitchAccessibilityLabel(CLOUDFLARE_TUNNEL_AUTO_START_FIELD_METADATA.accessibilityLabel)}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={(settings.cloudflareTunnelAutoStart ?? DEFAULT_CLOUDFLARE_TUNNEL_AUTO_START) ? theme.colors.primaryForeground : theme.colors.background}
                />
              </View>

              <Text style={styles.label}>{CLOUDFLARE_TUNNEL_ID_FIELD_METADATA.label}</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.cloudflareTunnelId}
                onChangeText={(value) => setDrafts((current) => ({ ...current, cloudflareTunnelId: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { cloudflareTunnelId: drafts.cloudflareTunnelId.trim() },
                  CLOUDFLARE_TUNNEL_ID_FIELD_METADATA.pendingLabel,
                  CLOUDFLARE_TUNNEL_ID_FIELD_METADATA.successMessage,
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={CLOUDFLARE_TUNNEL_ID_FIELD_METADATA.mobilePlaceholder}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel(CLOUDFLARE_TUNNEL_ID_FIELD_METADATA.accessibilityLabel)}
              />

              <Text style={styles.label}>{CLOUDFLARE_TUNNEL_HOSTNAME_FIELD_METADATA.label}</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.cloudflareTunnelHostname}
                onChangeText={(value) => setDrafts((current) => ({ ...current, cloudflareTunnelHostname: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { cloudflareTunnelHostname: drafts.cloudflareTunnelHostname.trim() },
                  CLOUDFLARE_TUNNEL_HOSTNAME_FIELD_METADATA.pendingLabel,
                  CLOUDFLARE_TUNNEL_HOSTNAME_FIELD_METADATA.successMessage,
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={CLOUDFLARE_TUNNEL_HOSTNAME_FIELD_METADATA.mobilePlaceholder}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel(CLOUDFLARE_TUNNEL_HOSTNAME_FIELD_METADATA.accessibilityLabel)}
              />

              <Text style={styles.label}>{CLOUDFLARE_TUNNEL_NAME_FIELD_METADATA.label}</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.cloudflareTunnelName}
                onChangeText={(value) => setDrafts((current) => ({ ...current, cloudflareTunnelName: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { cloudflareTunnelName: drafts.cloudflareTunnelName.trim() },
                  CLOUDFLARE_TUNNEL_NAME_FIELD_METADATA.pendingLabel,
                  CLOUDFLARE_TUNNEL_NAME_FIELD_METADATA.successMessage,
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={CLOUDFLARE_TUNNEL_NAME_FIELD_METADATA.mobilePlaceholder}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel(CLOUDFLARE_TUNNEL_NAME_FIELD_METADATA.accessibilityLabel)}
              />

              <Text style={styles.label}>{CLOUDFLARE_TUNNEL_CREDENTIALS_PATH_FIELD_METADATA.label}</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.cloudflareTunnelCredentialsPath}
                onChangeText={(value) => setDrafts((current) => ({ ...current, cloudflareTunnelCredentialsPath: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { cloudflareTunnelCredentialsPath: drafts.cloudflareTunnelCredentialsPath.trim() },
                  CLOUDFLARE_TUNNEL_CREDENTIALS_PATH_FIELD_METADATA.pendingLabel,
                  CLOUDFLARE_TUNNEL_CREDENTIALS_PATH_FIELD_METADATA.successMessage,
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={CLOUDFLARE_TUNNEL_CREDENTIALS_PATH_FIELD_METADATA.mobilePlaceholder}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel(CLOUDFLARE_TUNNEL_CREDENTIALS_PATH_FIELD_METADATA.accessibilityLabel)}
              />
              <Text style={styles.helperText}>{CLOUDFLARE_TUNNEL_SECTION_METADATA.namedTunnelHelperText}</Text>

              <Text style={styles.subsectionTitle}>{CHANNEL_OPERATOR_ALLOWLISTS_SECTION_METADATA.sectionTitle}</Text>
              <Text style={styles.helperText}>{CHANNEL_OPERATOR_ALLOWLISTS_SECTION_METADATA.helperText}</Text>

              <Text style={styles.label}>{channelAllowlistFields.discordOperatorAllowUserIds.label}</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.discordOperatorAllowUserIds}
                onChangeText={(value) => setDrafts((current) => ({ ...current, discordOperatorAllowUserIds: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { discordOperatorAllowUserIds: parseConfigListInput(drafts.discordOperatorAllowUserIds, { unique: true }) },
                  channelAllowlistFields.discordOperatorAllowUserIds.pendingLabel,
                  channelAllowlistFields.discordOperatorAllowUserIds.successMessage,
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={channelAllowlistFields.discordOperatorAllowUserIds.placeholder}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel(channelAllowlistFields.discordOperatorAllowUserIds.accessibilityLabel)}
              />

              <Text style={styles.label}>{channelAllowlistFields.discordOperatorAllowGuildIds.label}</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.discordOperatorAllowGuildIds}
                onChangeText={(value) => setDrafts((current) => ({ ...current, discordOperatorAllowGuildIds: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { discordOperatorAllowGuildIds: parseConfigListInput(drafts.discordOperatorAllowGuildIds, { unique: true }) },
                  channelAllowlistFields.discordOperatorAllowGuildIds.pendingLabel,
                  channelAllowlistFields.discordOperatorAllowGuildIds.successMessage,
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={channelAllowlistFields.discordOperatorAllowGuildIds.placeholder}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel(channelAllowlistFields.discordOperatorAllowGuildIds.accessibilityLabel)}
              />

              <Text style={styles.label}>{channelAllowlistFields.discordOperatorAllowChannelIds.label}</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.discordOperatorAllowChannelIds}
                onChangeText={(value) => setDrafts((current) => ({ ...current, discordOperatorAllowChannelIds: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { discordOperatorAllowChannelIds: parseConfigListInput(drafts.discordOperatorAllowChannelIds, { unique: true }) },
                  channelAllowlistFields.discordOperatorAllowChannelIds.pendingLabel,
                  channelAllowlistFields.discordOperatorAllowChannelIds.successMessage,
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={channelAllowlistFields.discordOperatorAllowChannelIds.placeholder}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel(channelAllowlistFields.discordOperatorAllowChannelIds.accessibilityLabel)}
              />

              <Text style={styles.label}>{channelAllowlistFields.discordOperatorAllowRoleIds.label}</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.discordOperatorAllowRoleIds}
                onChangeText={(value) => setDrafts((current) => ({ ...current, discordOperatorAllowRoleIds: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { discordOperatorAllowRoleIds: parseConfigListInput(drafts.discordOperatorAllowRoleIds, { unique: true }) },
                  channelAllowlistFields.discordOperatorAllowRoleIds.pendingLabel,
                  channelAllowlistFields.discordOperatorAllowRoleIds.successMessage,
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={channelAllowlistFields.discordOperatorAllowRoleIds.placeholder}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel(channelAllowlistFields.discordOperatorAllowRoleIds.accessibilityLabel)}
              />

              <Text style={styles.label}>{channelAllowlistFields.whatsappOperatorAllowFrom.label}</Text>
              <TextInput
                style={[styles.input, controlsDisabled && styles.inputDisabled]}
                value={drafts.whatsappOperatorAllowFrom}
                onChangeText={(value) => setDrafts((current) => ({ ...current, whatsappOperatorAllowFrom: value }))}
                onEndEditing={() => void applySettingsUpdate(
                  { whatsappOperatorAllowFrom: parseConfigListInput(drafts.whatsappOperatorAllowFrom, { unique: true }) },
                  channelAllowlistFields.whatsappOperatorAllowFrom.pendingLabel,
                  channelAllowlistFields.whatsappOperatorAllowFrom.successMessage,
                )}
                editable={!controlsDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={channelAllowlistFields.whatsappOperatorAllowFrom.placeholder}
                placeholderTextColor={theme.colors.mutedForeground}
                accessibilityLabel={createTextInputAccessibilityLabel(channelAllowlistFields.whatsappOperatorAllowFrom.accessibilityLabel)}
              />
              <Text style={styles.helperText}>{CHANNEL_OPERATOR_ALLOWLISTS_SECTION_METADATA.footerText}</Text>
            </View>
          )}

          {status && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{OPERATOR_RUNTIME_STATUS_PANEL_METADATA.panelTitle}</Text>
              <Text style={styles.detailText}>
                {OPERATOR_RUNTIME_STATUS_PANEL_METADATA.configuredLabel}: {settings?.remoteServerEnabled
                  ? OPERATOR_RUNTIME_STATUS_PANEL_METADATA.enabledValue
                  : OPERATOR_RUNTIME_STATUS_PANEL_METADATA.disabledValue}
              </Text>
              <Text style={styles.detailText}>{OPERATOR_RUNTIME_STATUS_PANEL_METADATA.runningLabel}: {formatYesNo(status.remoteServer.running)}</Text>
              <Text style={styles.detailText}>{OPERATOR_RUNTIME_STATUS_PANEL_METADATA.bindLabel}: {status.remoteServer.bind}:{status.remoteServer.port}</Text>
              <Text style={styles.detailText}>{OPERATOR_RUNTIME_STATUS_PANEL_METADATA.connectableUrlLabel}: {status.remoteServer.connectableUrl || status.remoteServer.url || '—'}</Text>
              {status.remoteServer.lastError && (
                <Text style={styles.warningText}>{OPERATOR_RUNTIME_STATUS_PANEL_METADATA.lastErrorLabel}: {status.remoteServer.lastError}</Text>
              )}
            </View>
          )}

          {(tunnelStatus || tunnelSetup) && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.panelTitle}</Text>
              <Text style={styles.detailText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.stateLabel}: {getTunnelStateLabel(tunnelStatus)}</Text>
              <Text style={styles.detailText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.modeLabel}: {tunnelStatus?.mode || tunnelSetup?.mode || settings?.cloudflareTunnelMode || '—'}</Text>
              <Text style={styles.detailText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.urlLabel}: {tunnelStatus?.url || '—'}</Text>
              <Text style={styles.detailText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.remoteServerRunningLabel}: {formatYesNo(status?.remoteServer.running)}</Text>
              <Text style={styles.sectionCaption}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.setupTitle}</Text>
              <Text style={styles.detailText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.installedLabel}: {formatYesNo(tunnelSetup?.installed)}</Text>
              <Text style={styles.detailText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.loggedInLabel}: {formatYesNo(tunnelSetup?.loggedIn)}</Text>
              <Text style={styles.detailText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.namedTunnelConfiguredLabel}: {formatYesNo(tunnelSetup?.namedTunnelConfigured)}</Text>
              <Text style={styles.detailText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.credentialsPathConfiguredLabel}: {formatYesNo(tunnelSetup?.credentialsPathConfigured)}</Text>
              <Text style={styles.detailText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.discoveredNamedTunnelsLabel}: {tunnelSetup?.tunnelCount ?? 0}</Text>
              {tunnelSetup?.configuredTunnelId ? <Text style={styles.detailText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.configuredTunnelIdLabel}: {tunnelSetup.configuredTunnelId}</Text> : null}
              {tunnelSetup?.configuredHostname ? <Text style={styles.detailText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.configuredHostnameLabel}: {tunnelSetup.configuredHostname}</Text> : null}
              {tunnelSetup?.tunnels.slice(0, 3).map((tunnel) => (
                <Text key={tunnel.id} style={styles.helperText}>• {tunnel.name} ({tunnel.id})</Text>
              ))}
              {tunnelStatus?.error && <Text style={styles.warningText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.tunnelErrorLabel}: {tunnelStatus.error}</Text>}
              {tunnelSetup?.error && <Text style={styles.warningText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.setupErrorLabel}: {tunnelSetup.error}</Text>}

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
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_TUNNEL_STATUS_PANEL_METADATA.startAccessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.startButtonLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || (!tunnelStatus?.running && !tunnelStatus?.starting)) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    OPERATOR_TUNNEL_STATUS_PANEL_METADATA.stopConfirmTitle,
                    OPERATOR_TUNNEL_STATUS_PANEL_METADATA.stopConfirmMessage,
                    OPERATOR_TUNNEL_STATUS_PANEL_METADATA.stopConfirmButtonLabel,
                    false,
                    () => runAction('tunnel-stop', () => settingsClient.stopOperatorTunnel()),
                  )}
                  disabled={controlsDisabled || (!tunnelStatus?.running && !tunnelStatus?.starting)}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_TUNNEL_STATUS_PANEL_METADATA.stopAccessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.stopButtonLabel}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>{OPERATOR_TUNNEL_STATUS_PANEL_METADATA.helperText}</Text>
            </View>
          )}

          {discord && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{OPERATOR_DISCORD_PANEL_METADATA.panelTitle}</Text>
              <Text style={styles.detailText}>{OPERATOR_DISCORD_PANEL_METADATA.formatStatus(discord)}</Text>
              <Text style={styles.detailText}>{OPERATOR_DISCORD_PANEL_METADATA.formatAvailable(discord.available)}</Text>
              <Text style={styles.detailText}>{OPERATOR_DISCORD_PANEL_METADATA.formatTokenConfigured(discord.tokenConfigured)}</Text>
              <Text style={styles.detailText}>{OPERATOR_DISCORD_PANEL_METADATA.formatBotUsername(discord.botUsername)}</Text>
              <Text style={styles.detailText}>{OPERATOR_DISCORD_PANEL_METADATA.formatDefaultProfile(discord.defaultProfileName, discord.defaultProfileId)}</Text>
              <Text style={styles.detailText}>{OPERATOR_DISCORD_PANEL_METADATA.formatLogs(discord.logs)}</Text>
              <Text style={styles.detailText}>{OPERATOR_DISCORD_PANEL_METADATA.formatLastEvent(discord.lastEventAt)}</Text>
              {discord.lastError && <Text style={styles.warningText}>{OPERATOR_DISCORD_PANEL_METADATA.formatLastError(discord.lastError)}</Text>}

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
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_DISCORD_PANEL_METADATA.connectButton.accessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>{OPERATOR_DISCORD_PANEL_METADATA.connectButton.buttonLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || !discord.connected) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    OPERATOR_DISCORD_PANEL_METADATA.disconnectAction.confirmTitle,
                    OPERATOR_DISCORD_PANEL_METADATA.disconnectAction.confirmMessage,
                    OPERATOR_DISCORD_PANEL_METADATA.disconnectAction.confirmButtonLabel,
                    true,
                    () => runAction('discord-disconnect', () => settingsClient.disconnectOperatorDiscord()),
                  )}
                  disabled={controlsDisabled || !discord.connected}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_DISCORD_PANEL_METADATA.disconnectAction.accessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>{OPERATOR_DISCORD_PANEL_METADATA.disconnectAction.buttonLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || (discord.logs.total === 0 && discordLogs.length === 0)) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    OPERATOR_DISCORD_PANEL_METADATA.clearLogsAction.confirmTitle,
                    OPERATOR_DISCORD_PANEL_METADATA.clearLogsAction.confirmMessage,
                    OPERATOR_DISCORD_PANEL_METADATA.clearLogsAction.confirmButtonLabel,
                    true,
                    () => runAction('discord-clear-logs', () => settingsClient.clearOperatorDiscordLogs()),
                  )}
                  disabled={controlsDisabled || (discord.logs.total === 0 && discordLogs.length === 0)}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_DISCORD_PANEL_METADATA.clearLogsAction.accessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>{OPERATOR_DISCORD_PANEL_METADATA.clearLogsAction.buttonLabel}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionCaption}>{OPERATOR_DISCORD_PANEL_METADATA.logsSectionTitle}</Text>
              {discordLogs.length === 0 ? (
                <Text style={styles.mutedText}>{OPERATOR_DISCORD_PANEL_METADATA.emptyLogsText}</Text>
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
              <Text style={styles.panelTitle}>{OPERATOR_WHATSAPP_PANEL_METADATA.panelTitle}</Text>
              <Text style={styles.detailText}>{OPERATOR_WHATSAPP_PANEL_METADATA.formatStatus(whatsApp)}</Text>
              <Text style={styles.detailText}>{OPERATOR_WHATSAPP_PANEL_METADATA.formatServerConfigured(whatsApp.serverConfigured)}</Text>
              <Text style={styles.detailText}>{OPERATOR_WHATSAPP_PANEL_METADATA.formatServerConnected(whatsApp.serverConnected)}</Text>
              <Text style={styles.detailText}>{OPERATOR_WHATSAPP_PANEL_METADATA.formatAvailable(whatsApp.available)}</Text>
              <Text style={styles.detailText}>{OPERATOR_WHATSAPP_PANEL_METADATA.formatAutoReply(whatsApp.autoReplyEnabled)}</Text>
              <Text style={styles.detailText}>{OPERATOR_WHATSAPP_PANEL_METADATA.formatLogMessages(whatsApp.logMessagesEnabled)}</Text>
              <Text style={styles.detailText}>{OPERATOR_WHATSAPP_PANEL_METADATA.formatAllowedSenders(whatsApp.allowedSenderCount)}</Text>
              <Text style={styles.detailText}>{OPERATOR_WHATSAPP_PANEL_METADATA.formatCredentialsPresent(whatsApp.hasCredentials)}</Text>
              <Text style={styles.detailText}>{OPERATOR_WHATSAPP_PANEL_METADATA.formatLogs(whatsApp.logs)}</Text>
              {whatsApp.lastError && <Text style={styles.warningText}>{OPERATOR_WHATSAPP_PANEL_METADATA.formatLastError(whatsApp.lastError)}</Text>}

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
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_WHATSAPP_PANEL_METADATA.connectButton.accessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>{OPERATOR_WHATSAPP_PANEL_METADATA.connectButton.buttonLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (controlsDisabled || !whatsApp.connected) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    OPERATOR_WHATSAPP_PANEL_METADATA.logoutAction.confirmTitle,
                    OPERATOR_WHATSAPP_PANEL_METADATA.logoutAction.confirmMessage,
                    OPERATOR_WHATSAPP_PANEL_METADATA.logoutAction.confirmButtonLabel,
                    true,
                    () => runAction('whatsapp-logout', () => settingsClient.logoutOperatorWhatsApp()),
                  )}
                  disabled={controlsDisabled || !whatsApp.connected}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_WHATSAPP_PANEL_METADATA.logoutAction.accessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>{OPERATOR_WHATSAPP_PANEL_METADATA.logoutAction.buttonLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {status && (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{OPERATOR_HEALTH_CHECKS_PANEL_METADATA.panelTitle}</Text>
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
              <Text style={styles.panelTitle}>{OPERATOR_UPDATER_PANEL_METADATA.panelTitle}</Text>
              <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatMode(status.updater.mode)}</Text>
              <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatCurrentVersion(status.updater.currentVersion)}</Text>
              <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatUpdateAvailable(status.updater.updateAvailable)}</Text>
              <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatLastChecked(status.updater.lastCheckedAt)}</Text>
              {status.updater.latestRelease ? (
                <>
                  <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatLatestRelease(status.updater.latestRelease.tagName)}</Text>
                  <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatPublished(status.updater.latestRelease.publishedAt)}</Text>
                  <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatAssets(status.updater.latestRelease.assetCount)}</Text>
                  <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatReleaseUrl(status.updater.latestRelease.url)}</Text>
                </>
              ) : null}
              {status.updater.preferredAsset ? (
                <>
                  <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatRecommendedAsset(status.updater.preferredAsset.name)}</Text>
                  <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatAssetUrl(status.updater.preferredAsset.downloadUrl)}</Text>
                </>
              ) : null}
              {status.updater.lastDownloadedFileName ? (
                <>
                  <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatLastDownloadedFile(status.updater.lastDownloadedFileName)}</Text>
                  <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatDownloadedAt(status.updater.lastDownloadedAt)}</Text>
                </>
              ) : null}
              {status.updater.lastCheckError ? <Text style={styles.warningText}>{OPERATOR_UPDATER_PANEL_METADATA.formatLastCheckError(status.updater.lastCheckError)}</Text> : null}
              {status.updater.manualReleasesUrl ? (
                <Text style={styles.detailText}>{OPERATOR_UPDATER_PANEL_METADATA.formatManualReleases(status.updater.manualReleasesUrl)}</Text>
              ) : null}
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                  onPress={() => void runAction('check-latest-release', () => settingsClient.checkOperatorUpdater())}
                  disabled={pendingAction !== null}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_UPDATER_PANEL_METADATA.checkLatestReleaseButton.accessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>
                    {pendingAction === 'check-latest-release'
                      ? OPERATOR_UPDATER_PANEL_METADATA.checkLatestReleaseButton.pendingLabel
                      : OPERATOR_UPDATER_PANEL_METADATA.checkLatestReleaseButton.buttonLabel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (pendingAction !== null || !status.updater.preferredAsset) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    OPERATOR_UPDATER_PANEL_METADATA.downloadLatestInstallerAction.confirmTitle,
                    OPERATOR_UPDATER_PANEL_METADATA.downloadLatestInstallerAction.confirmMessage,
                    OPERATOR_UPDATER_PANEL_METADATA.downloadLatestInstallerAction.confirmButtonLabel,
                    false,
                    () => runAction('download-latest-release', () => settingsClient.downloadOperatorUpdateAsset()),
                  )}
                  disabled={pendingAction !== null || !status.updater.preferredAsset}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_UPDATER_PANEL_METADATA.downloadLatestInstallerAction.accessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>
                    {pendingAction === 'download-latest-release'
                      ? OPERATOR_UPDATER_PANEL_METADATA.downloadLatestInstallerAction.pendingLabel
                      : OPERATOR_UPDATER_PANEL_METADATA.downloadLatestInstallerAction.buttonLabel}
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
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_UPDATER_PANEL_METADATA.revealDownloadedInstallerButton.accessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>
                    {pendingAction === 'reveal-downloaded-installer'
                      ? OPERATOR_UPDATER_PANEL_METADATA.revealDownloadedInstallerButton.pendingLabel
                      : OPERATOR_UPDATER_PANEL_METADATA.revealDownloadedInstallerButton.buttonLabel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.secondaryActionButton,
                    (pendingAction !== null || !status.updater.lastDownloadedFileName) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => confirmAction(
                    OPERATOR_UPDATER_PANEL_METADATA.openDownloadedInstallerAction.confirmTitle,
                    OPERATOR_UPDATER_PANEL_METADATA.openDownloadedInstallerAction.confirmMessage,
                    OPERATOR_UPDATER_PANEL_METADATA.openDownloadedInstallerAction.confirmButtonLabel,
                    false,
                    () => runAction('open-downloaded-installer', () => settingsClient.openOperatorUpdateAsset()),
                  )}
                  disabled={pendingAction !== null || !status.updater.lastDownloadedFileName}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_UPDATER_PANEL_METADATA.openDownloadedInstallerAction.accessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>
                    {pendingAction === 'open-downloaded-installer'
                      ? OPERATOR_UPDATER_PANEL_METADATA.openDownloadedInstallerAction.pendingLabel
                      : OPERATOR_UPDATER_PANEL_METADATA.openDownloadedInstallerAction.buttonLabel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                  onPress={() => void runAction('open-release-page', () => settingsClient.openOperatorReleasesPage())}
                  disabled={pendingAction !== null}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_UPDATER_PANEL_METADATA.openReleasePageButton.accessibilityLabel)}
                >
                  <Text style={styles.secondaryActionText}>
                    {pendingAction === 'open-release-page'
                      ? OPERATOR_UPDATER_PANEL_METADATA.openReleasePageButton.pendingLabel
                      : OPERATOR_UPDATER_PANEL_METADATA.openReleasePageButton.buttonLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{OPERATOR_LOGS_PANEL_METADATA.panelTitle}</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryActionButton, pendingAction !== null && styles.actionButtonDisabled]}
                onPress={() => confirmAction(
                  OPERATOR_LOGS_PANEL_METADATA.clearConfirmTitle,
                  OPERATOR_LOGS_PANEL_METADATA.clearConfirmMessage,
                  OPERATOR_LOGS_PANEL_METADATA.clearConfirmButtonLabel,
                  true,
                  () => runAction('operator-clear-errors', () => settingsClient.clearOperatorErrors()),
                )}
                disabled={pendingAction !== null}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(OPERATOR_LOGS_PANEL_METADATA.clearAccessibilityLabel)}
              >
                <Text style={styles.secondaryActionText}>
                  {pendingAction === 'operator-clear-errors'
                    ? OPERATOR_LOGS_PANEL_METADATA.clearPendingLabel
                    : OPERATOR_LOGS_PANEL_METADATA.clearButtonLabel}
                </Text>
              </TouchableOpacity>
            </View>
            {operatorLogs.length === 0 ? (
              <Text style={styles.mutedText}>{OPERATOR_LOGS_PANEL_METADATA.emptyText}</Text>
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
            <Text style={styles.panelTitle}>{OPERATOR_ERRORS_PANEL_METADATA.panelTitle}</Text>
            {recentErrors.length === 0 ? (
              <Text style={styles.mutedText}>{OPERATOR_ERRORS_PANEL_METADATA.emptyText}</Text>
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
