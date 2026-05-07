import type { OperatorAuditEntry, OperatorRuntimeStatus } from "./api-types"

export const OPERATOR_EMPTY_VALUE_LABEL = "—"

export type OperatorDiagnosticReportActionMetadata = {
  sectionTitle: string
  generateAccessibilityLabel: string
  generatePendingLabel: string
  generateButtonLabel: string
  saveConfirmTitle: string
  saveConfirmMessage: string
  saveConfirmButtonLabel: string
  saveAccessibilityLabel: string
  savePendingLabel: string
  saveButtonLabel: string
  emptyReportText: string
  formatGeneratedMessage: (logEntryCount: number) => string
}

export const OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA: OperatorDiagnosticReportActionMetadata = {
  sectionTitle: "Diagnostics",
  generateAccessibilityLabel: "Generate desktop diagnostic report",
  generatePendingLabel: "Generating report…",
  generateButtonLabel: "Generate report",
  saveConfirmTitle: "Save Diagnostic Report",
  saveConfirmMessage: "Save a diagnostic report JSON file on the desktop machine now?",
  saveConfirmButtonLabel: "Save Report",
  saveAccessibilityLabel: "Save diagnostic report on desktop",
  savePendingLabel: "Saving report…",
  saveButtonLabel: "Save report",
  emptyReportText: "No diagnostic report generated in this mobile session.",
  formatGeneratedMessage: (logEntryCount) => `Diagnostic report generated with ${logEntryCount} log entries.`,
}

export type OperatorLogsPanelMetadata = {
  panelTitle: string
  clearConfirmTitle: string
  clearConfirmMessage: string
  clearConfirmButtonLabel: string
  clearAccessibilityLabel: string
  clearPendingLabel: string
  clearButtonLabel: string
  emptyText: string
}

export const OPERATOR_LOGS_PANEL_METADATA: OperatorLogsPanelMetadata = {
  panelTitle: "Recent operator logs",
  clearConfirmTitle: "Clear Operator Log",
  clearConfirmMessage: "Clear the desktop operator error log now?",
  clearConfirmButtonLabel: "Clear Log",
  clearAccessibilityLabel: "Clear desktop operator error log",
  clearPendingLabel: "Clearing log…",
  clearButtonLabel: "Clear log",
  emptyText: "No recent operator log entries returned by the desktop server.",
}

export type OperatorErrorsPanelMetadata = {
  panelTitle: string
  emptyText: string
}

export const OPERATOR_ERRORS_PANEL_METADATA: OperatorErrorsPanelMetadata = {
  panelTitle: "Recent errors",
  emptyText: "No recent errors returned by the desktop server.",
}

export type OperatorConversationsPanelMetadata = {
  panelTitle: string
}

export const OPERATOR_CONVERSATIONS_PANEL_METADATA: OperatorConversationsPanelMetadata = {
  panelTitle: "Recent conversations",
}

export type OperatorAgentSessionReference = {
  id: string
  title?: string
}

export type OperatorActiveAgentSessionSummary = OperatorAgentSessionReference & {
  status: string
  currentIteration?: number
  maxIterations?: number
  isSnoozed?: boolean
  profileName?: string
}

export type OperatorRecentAgentSessionSummary = OperatorAgentSessionReference & {
  status: string
  profileName?: string
}

export type OperatorAgentSessionsPanelMetadata = {
  panelTitle: string
  formatSummary: (activeSessions: number, recentSessions: number) => string
  clearInactiveConfirmTitle: string
  clearInactiveConfirmMessage: string
  clearInactiveConfirmButtonLabel: string
  clearInactiveAccessibilityLabel: string
  clearInactivePendingLabel: string
  clearInactiveButtonLabel: string
  hideActiveAccessibilityLabel: string
  hideActivePendingLabel: string
  hideActiveButtonLabel: string
  formatShowAccessibilityLabel: (sessionName: string) => string
  showPendingLabel: string
  showButtonLabel: string
  formatSnoozeAccessibilityLabel: (sessionName: string, isSnoozed: boolean) => string
  formatSnoozePendingLabel: (isSnoozed: boolean) => string
  formatSnoozeButtonLabel: (isSnoozed: boolean) => string
  stopConfirmTitle: string
  formatStopConfirmMessage: (sessionName: string) => string
  stopConfirmButtonLabel: string
  formatStopAccessibilityLabel: (sessionName: string) => string
  stopPendingLabel: string
  stopButtonLabel: string
  recentSessionsLabel: string
  dismissConfirmTitle: string
  formatDismissConfirmMessage: (sessionName: string) => string
  dismissConfirmButtonLabel: string
  formatDismissAccessibilityLabel: (sessionName: string) => string
  dismissPendingLabel: string
  dismissButtonLabel: string
  noActiveSessionsText: string
}

export const OPERATOR_AGENT_SESSIONS_PANEL_METADATA: OperatorAgentSessionsPanelMetadata = {
  panelTitle: "Agent sessions",
  formatSummary: (activeSessions, recentSessions) => `Active: ${activeSessions} • Recent: ${recentSessions}`,
  clearInactiveConfirmTitle: "Clear Inactive Sessions",
  clearInactiveConfirmMessage: "Clear recent inactive agent sessions on the desktop app? Sessions with queued follow-ups are kept.",
  clearInactiveConfirmButtonLabel: "Clear Sessions",
  clearInactiveAccessibilityLabel: "Clear inactive agent sessions on desktop",
  clearInactivePendingLabel: "Clearing...",
  clearInactiveButtonLabel: "Clear inactive",
  hideActiveAccessibilityLabel: "Hide active agent sessions and desktop panel",
  hideActivePendingLabel: "Hiding...",
  hideActiveButtonLabel: "Hide active",
  formatShowAccessibilityLabel: (sessionName) => `Show ${sessionName} agent session on desktop`,
  showPendingLabel: "Showing...",
  showButtonLabel: "Show",
  formatSnoozeAccessibilityLabel: (sessionName, isSnoozed) => `${isSnoozed ? "Restore" : "Hide"} ${sessionName} agent session`,
  formatSnoozePendingLabel: (isSnoozed) => isSnoozed ? "Restoring..." : "Hiding...",
  formatSnoozeButtonLabel: (isSnoozed) => isSnoozed ? "Restore" : "Hide",
  stopConfirmTitle: "Stop Agent Session",
  formatStopConfirmMessage: (sessionName) => `Stop ${sessionName} on the desktop app? The conversation queue for this session will be paused.`,
  stopConfirmButtonLabel: "Stop Session",
  formatStopAccessibilityLabel: (sessionName) => `Stop ${sessionName} agent session`,
  stopPendingLabel: "Stopping...",
  stopButtonLabel: "Stop",
  recentSessionsLabel: "Recent sessions",
  dismissConfirmTitle: "Dismiss Agent Session",
  formatDismissConfirmMessage: (sessionName) => `Dismiss ${sessionName} from desktop agent progress?`,
  dismissConfirmButtonLabel: "Dismiss",
  formatDismissAccessibilityLabel: (sessionName) => `Dismiss ${sessionName} agent session progress on desktop`,
  dismissPendingLabel: "Dismissing...",
  dismissButtonLabel: "Dismiss",
  noActiveSessionsText: "No active agent sessions",
}

export type OperatorRuntimeStatusPanelMetadata = {
  panelTitle: string
  configuredLabel: string
  enabledValue: string
  disabledValue: string
  runningLabel: string
  bindLabel: string
  connectableUrlLabel: string
  lastErrorLabel: string
}

export const OPERATOR_RUNTIME_STATUS_PANEL_METADATA: OperatorRuntimeStatusPanelMetadata = {
  panelTitle: "Remote server runtime",
  configuredLabel: "Configured",
  enabledValue: "Enabled",
  disabledValue: "Disabled",
  runningLabel: "Running",
  bindLabel: "Bind",
  connectableUrlLabel: "Connectable URL",
  lastErrorLabel: "Last error",
}

export type OperatorTunnelStatusPanelMetadata = {
  panelTitle: string
  stateLabel: string
  modeLabel: string
  urlLabel: string
  remoteServerRunningLabel: string
  setupTitle: string
  installedLabel: string
  loggedInLabel: string
  namedTunnelConfiguredLabel: string
  credentialsPathConfiguredLabel: string
  discoveredNamedTunnelsLabel: string
  configuredTunnelIdLabel: string
  configuredHostnameLabel: string
  tunnelErrorLabel: string
  setupErrorLabel: string
  startButtonLabel: string
  startAccessibilityLabel: string
  stopConfirmTitle: string
  stopConfirmMessage: string
  stopConfirmButtonLabel: string
  stopButtonLabel: string
  stopAccessibilityLabel: string
  helperText: string
}

export const OPERATOR_TUNNEL_STATUS_PANEL_METADATA: OperatorTunnelStatusPanelMetadata = {
  panelTitle: "Tunnel status",
  stateLabel: "State",
  modeLabel: "Mode",
  urlLabel: "URL",
  remoteServerRunningLabel: "Remote server running",
  setupTitle: "Tunnel Setup",
  installedLabel: "Installed",
  loggedInLabel: "Logged in",
  namedTunnelConfiguredLabel: "Named tunnel configured",
  credentialsPathConfiguredLabel: "Credentials path configured",
  discoveredNamedTunnelsLabel: "Discovered named tunnels",
  configuredTunnelIdLabel: "Configured tunnel ID",
  configuredHostnameLabel: "Configured hostname",
  tunnelErrorLabel: "Tunnel error",
  setupErrorLabel: "Setup error",
  startButtonLabel: "Start tunnel",
  startAccessibilityLabel: "Start tunnel",
  stopConfirmTitle: "Stop Tunnel",
  stopConfirmMessage: "Stop the active Cloudflare tunnel? Mobile access through the tunnel will drop until it is started again.",
  stopConfirmButtonLabel: "Stop Tunnel",
  stopButtonLabel: "Stop tunnel",
  stopAccessibilityLabel: "Stop tunnel",
  helperText: "The remote server must be running before a tunnel can start.",
}

export type OperatorMcpServersPanelMetadata = {
  panelTitle: string
  formatSummary: (connectedCount: number, serverCount: number, toolCount: number) => string
  disabledSuffix: string
  restartPendingLabel: string
  restartButtonLabel: string
  formatRestartAccessibilityLabel: (serverName: string) => string
  formatRestartedMessage: (serverName: string) => string
  stopConfirmTitle: string
  formatStopConfirmMessage: (serverName: string) => string
  stopConfirmButtonLabel: string
  stopPendingLabel: string
  stopButtonLabel: string
  formatStopAccessibilityLabel: (serverName: string) => string
  startPendingLabel: string
  startButtonLabel: string
  formatStartAccessibilityLabel: (serverName: string) => string
  testPendingLabel: string
  testButtonLabel: string
  formatTestAccessibilityLabel: (serverName: string) => string
  formatTestSuccessMessage: (serverName: string, toolCount?: number) => string
  logsPendingLabel: string
  logsExpandedButtonLabel: string
  logsButtonLabel: string
  formatLogsAccessibilityLabel: (serverName: string, expanded: boolean) => string
  toolsPendingLabel: string
  toolsExpandedButtonLabel: string
  toolsButtonLabel: string
  formatToolsAccessibilityLabel: (serverName: string, expanded: boolean) => string
  logsSectionTitle: string
  clearLogsConfirmTitle: string
  formatClearLogsConfirmMessage: (serverName: string) => string
  clearLogsConfirmButtonLabel: string
  clearLogsPendingLabel: string
  clearLogsButtonLabel: string
  formatClearLogsAccessibilityLabel: (serverName: string) => string
  logsLoadingText: string
  logsEmptyText: string
  toolsSectionTitle: string
  toolsLoadingText: string
  toolsEmptyText: string
  serverDisabledText: string
  formatToolAccessibilityLabel: (toolName: string) => string
}

export const OPERATOR_MCP_SERVERS_PANEL_METADATA: OperatorMcpServersPanelMetadata = {
  panelTitle: "MCP servers",
  formatSummary: (connectedCount, serverCount, toolCount) => `${connectedCount}/${serverCount} connected • ${toolCount} tools`,
  disabledSuffix: " (disabled)",
  restartPendingLabel: "Restarting...",
  restartButtonLabel: "Restart",
  formatRestartAccessibilityLabel: (serverName) => `Restart ${serverName} MCP server`,
  formatRestartedMessage: (serverName) => `Restarted ${serverName}`,
  stopConfirmTitle: "Stop MCP Server",
  formatStopConfirmMessage: (serverName) => `Stop ${serverName} on the desktop app? Its tools will be hidden until the server is started again.`,
  stopConfirmButtonLabel: "Stop Server",
  stopPendingLabel: "Stopping...",
  stopButtonLabel: "Stop",
  formatStopAccessibilityLabel: (serverName) => `Stop ${serverName} MCP server`,
  startPendingLabel: "Starting...",
  startButtonLabel: "Start",
  formatStartAccessibilityLabel: (serverName) => `Start ${serverName} MCP server`,
  testPendingLabel: "Testing...",
  testButtonLabel: "Test",
  formatTestAccessibilityLabel: (serverName) => `Test ${serverName} MCP server connection`,
  formatTestSuccessMessage: (serverName, toolCount) =>
    typeof toolCount === "number"
      ? `Connection test passed for ${serverName} (${toolCount} tools)`
      : `Connection test passed for ${serverName}`,
  logsPendingLabel: "Loading...",
  logsExpandedButtonLabel: "Hide logs",
  logsButtonLabel: "Logs",
  formatLogsAccessibilityLabel: (serverName, expanded) => `${expanded ? "Hide" : "Show"} ${serverName} MCP server logs`,
  toolsPendingLabel: "Loading...",
  toolsExpandedButtonLabel: "Hide tools",
  toolsButtonLabel: "Tools",
  formatToolsAccessibilityLabel: (serverName, expanded) => `${expanded ? "Hide" : "Show"} ${serverName} MCP server tools`,
  logsSectionTitle: "Server logs",
  clearLogsConfirmTitle: "Clear MCP Logs",
  formatClearLogsConfirmMessage: (serverName) => `Clear logs for ${serverName} on the desktop app?`,
  clearLogsConfirmButtonLabel: "Clear Logs",
  clearLogsPendingLabel: "Clearing...",
  clearLogsButtonLabel: "Clear",
  formatClearLogsAccessibilityLabel: (serverName) => `Clear ${serverName} MCP server logs`,
  logsLoadingText: "Loading MCP logs...",
  logsEmptyText: "No logs returned for this server.",
  toolsSectionTitle: "Server tools",
  toolsLoadingText: "Loading MCP tools...",
  toolsEmptyText: "No tools returned for this server.",
  serverDisabledText: "Server disabled",
  formatToolAccessibilityLabel: (toolName) => `Enable ${toolName} MCP tool`,
}

export function getOperatorAgentSessionDisplayName(session: OperatorAgentSessionReference): string {
  return session.title ?? session.id
}

export function formatOperatorActiveAgentSessionSummary(session: OperatorActiveAgentSessionSummary): string {
  const sessionName = getOperatorAgentSessionDisplayName(session)
  const profileName = session.profileName ? ` · ${session.profileName}` : ""
  const snoozedLabel = session.isSnoozed === true ? " · background" : ""
  return `${sessionName} — ${session.status}${profileName}${snoozedLabel} (${session.currentIteration ?? 0}/${session.maxIterations ?? "?"})`
}

export function formatOperatorRecentAgentSessionSummary(session: OperatorRecentAgentSessionSummary): string {
  const sessionName = getOperatorAgentSessionDisplayName(session)
  const profileName = session.profileName ? ` · ${session.profileName}` : ""
  return `${sessionName} — ${session.status}${profileName}`
}

export function formatOperatorTimestamp(timestamp?: number): string {
  if (!timestamp) return OPERATOR_EMPTY_VALUE_LABEL
  return new Date(timestamp).toLocaleString()
}

export function formatOperatorDurationSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

export function formatOperatorYesNo(value?: boolean): string {
  if (value === undefined) return OPERATOR_EMPTY_VALUE_LABEL
  return value ? "Yes" : "No"
}

export function getOperatorTunnelStateLabel(status?: OperatorRuntimeStatus["tunnel"] | null): string {
  if (!status) return "Unknown"
  if (status.running) return "Running"
  if (status.starting) return "Starting"
  return "Stopped"
}

export function formatOperatorLogSummary(logs?: {
  total: number
  errorCount?: number
  warningCount?: number
  infoCount?: number
}): string {
  if (!logs) return OPERATOR_EMPTY_VALUE_LABEL
  const parts = [`${logs.total} total`]
  if (typeof logs.errorCount === "number") parts.push(`${logs.errorCount} error`)
  if (typeof logs.warningCount === "number") parts.push(`${logs.warningCount} warning`)
  if (typeof logs.infoCount === "number") parts.push(`${logs.infoCount} info`)
  return parts.join(" • ")
}

export function formatOperatorAuditSource(entry: OperatorAuditEntry): string | null {
  const parts = [entry.deviceId, entry.source?.ip, entry.source?.origin].filter(Boolean)
  return parts.length > 0 ? parts.join(" • ") : null
}

export function formatOperatorAuditDetails(details?: Record<string, unknown>): string | null {
  if (!details || Object.keys(details).length === 0) return null

  return Object.entries(details)
    .map(([key, value]) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return `${key}: ${value}`
      }

      try {
        return `${key}: ${JSON.stringify(value)}`
      } catch {
        return `${key}: [unserializable]`
      }
    })
    .join(" • ")
}
