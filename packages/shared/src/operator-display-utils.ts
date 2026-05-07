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
