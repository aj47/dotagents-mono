import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  ExtendedSettingsApiClient,
  OperatorAuditEntry,
  OperatorDiscordIntegrationSummary,
  OperatorDiscordLogEntry,
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
const ACTION_REFRESH_DELAY_MS = 1200;

type RemoteAccessDrafts = {
  remoteServerPort: string;
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
  const [auditEntries, setAuditEntries] = useState<OperatorAuditEntry[]>([]);
  const [drafts, setDrafts] = useState<RemoteAccessDrafts>(buildDrafts(null));
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingSetting, setPendingSetting] = useState<string | null>(null);

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
      setAuditEntries([]);
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
      settingsResult,
      tunnelSetupResult,
      discordResult,
      discordLogsResult,
      whatsAppResult,
      auditResult,
    ] = await Promise.allSettled([
      settingsClient.getOperatorStatus(),
      settingsClient.getOperatorErrors(RECENT_ERROR_COUNT),
      settingsClient.getSettings(),
      settingsClient.getOperatorTunnelSetup(),
      settingsClient.getOperatorDiscord(),
      settingsClient.getOperatorDiscordLogs(DISCORD_LOG_PREVIEW_COUNT),
      settingsClient.getOperatorWhatsApp(),
      settingsClient.getOperatorAudit(RECENT_AUDIT_ENTRY_COUNT),
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

  useEffect(() => {
    setDrafts(buildDrafts(settings));
  }, [settings]);

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