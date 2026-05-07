import type {
  OperatorAuditEntry,
  OperatorDiscordIntegrationSummary,
  OperatorRuntimeStatus,
  OperatorWhatsAppIntegrationSummary,
} from "./api-types"

export const OPERATOR_EMPTY_VALUE_LABEL = "—"

export type OperatorConnectionRequiredPanelMetadata = {
  panelTitle: string
  bodyText: string
  openSettingsAccessibilityLabel: string
  openSettingsButtonLabel: string
}

export const OPERATOR_CONNECTION_REQUIRED_PANEL_METADATA: OperatorConnectionRequiredPanelMetadata = {
  panelTitle: "Connection required",
  bodyText: "Connect the mobile app to a DotAgents desktop server before using operator controls.",
  openSettingsAccessibilityLabel: "Open connection settings",
  openSettingsButtonLabel: "Open connection settings",
}

export type OperatorStatusPanelMetadata = {
  panelTitle: string
  waitingText: string
  formatUpdatedText: (overall: string, timestamp: number) => string
  formatIntegrationSummary: (pushTokenCount: number, recentErrorCount: number) => string
  formatPendingSettingText: (settingName: string) => string
}

export const OPERATOR_STATUS_PANEL_METADATA: OperatorStatusPanelMetadata = {
  panelTitle: "Operator status",
  waitingText: "Waiting for operator status…",
  formatUpdatedText: (overall, timestamp) => `${overall} • Updated ${formatOperatorTimestamp(timestamp)}`,
  formatIntegrationSummary: (pushTokenCount, recentErrorCount) => `Push tokens: ${pushTokenCount} • Recent errors: ${recentErrorCount}`,
  formatPendingSettingText: (settingName) => `Saving ${settingName}…`,
}

export type OperatorAlertMetadata = {
  actionFailedTitle: string
  updateFailedTitle: string
  connectionRequiredTitle: string
  promptRequiredTitle: string
  promptRequiredMessage: string
  cancelButtonLabel: string
  connectionRequiredMessages: {
    rotateApiKey: string
    operatorActions: string
    mcpLogs: string
    mcpTools: string
    mcpToolChange: string
    runAgent: string
    settingsSave: string
  }
  defaultApiKeyRotationFailureMessage: string
  defaultActionFailureMessage: string
  defaultActionCompletedMessage: string
  defaultMcpToolToggleFailureMessage: string
  defaultAgentRunFailureMessage: string
  connectionSettlingSuffix: string
}

export const OPERATOR_ALERT_METADATA: OperatorAlertMetadata = {
  actionFailedTitle: "Action Failed",
  updateFailedTitle: "Update Failed",
  connectionRequiredTitle: "Connection Required",
  promptRequiredTitle: "Prompt Required",
  promptRequiredMessage: "Enter a prompt for the desktop agent to run.",
  cancelButtonLabel: "Cancel",
  connectionRequiredMessages: {
    rotateApiKey: "Configure your desktop server connection before rotating the API key.",
    operatorActions: "Configure your desktop server connection before using operator actions.",
    mcpLogs: "Configure your desktop server connection before viewing MCP logs.",
    mcpTools: "Configure your desktop server connection before viewing MCP tools.",
    mcpToolChange: "Configure your desktop server connection before changing MCP tools.",
    runAgent: "Configure your desktop server connection before running an agent.",
    settingsSave: "Load the connected desktop settings before saving operator changes.",
  },
  defaultApiKeyRotationFailureMessage: "API key rotation failed",
  defaultActionFailureMessage: "Action failed",
  defaultActionCompletedMessage: "Action completed",
  defaultMcpToolToggleFailureMessage: "Tool toggle failed",
  defaultAgentRunFailureMessage: "Agent run failed",
  connectionSettlingSuffix: "Connection details may take a moment to settle.",
}

export type OperatorSystemPanelMetadata = {
  panelTitle: string
  formatPlatformSummary: (system: OperatorRuntimeStatus["system"]) => string
  formatRuntimeSummary: (system: OperatorRuntimeStatus["system"]) => string
  formatMemorySummary: (system: OperatorRuntimeStatus["system"]) => string
  formatUptimeSummary: (system: OperatorRuntimeStatus["system"]) => string
}

export const OPERATOR_SYSTEM_PANEL_METADATA: OperatorSystemPanelMetadata = {
  panelTitle: "System",
  formatPlatformSummary: (system) => `${system.hostname} • ${system.platform}/${system.arch}`,
  formatRuntimeSummary: (system) =>
    `App ${system.appVersion ?? "?"} • Electron ${system.electronVersion ?? "?"} • Node ${system.nodeVersion}`,
  formatMemorySummary: (system) =>
    `Memory: ${system.memoryUsage.rssMB} MB RSS • ${system.freeMemoryMB}/${system.totalMemoryMB} MB free • ${system.cpuCount} CPUs`,
  formatUptimeSummary: (system) =>
    `Process uptime: ${formatOperatorDurationSeconds(system.processUptimeSeconds)} • System uptime: ${formatOperatorDurationSeconds(system.uptimeSeconds)}`,
}

export type OperatorActionButtonMetadata = {
  accessibilityLabel: string
  pendingLabel: string
  buttonLabel: string
}

export type OperatorConfirmedActionMetadata = {
  confirmTitle: string
  confirmMessage: string
  confirmButtonLabel: string
  accessibilityLabel: string
  buttonLabel: string
}

export type OperatorConfirmedActionButtonMetadata = OperatorConfirmedActionMetadata & {
  pendingLabel: string
}

export type OperatorSimpleActionMetadata = {
  accessibilityLabel: string
  buttonLabel: string
}

export type OperatorActionsPanelMetadata = {
  panelTitle: string
  runAgentLabel: string
  runAgentPromptPlaceholder: string
  runAgentPromptAccessibilityLabel: string
  runAgentPromptAccessibilityHint: string
  runAgentButton: OperatorActionButtonMetadata
  refreshButton: OperatorActionButtonMetadata
  stopSpeechButton: OperatorActionButtonMetadata
  showAppButton: OperatorActionButtonMetadata
  showHistoryButton: OperatorActionButtonMetadata
  showSettingsButton: OperatorActionButtonMetadata
  showPanelButton: OperatorActionButtonMetadata
  hidePanelButton: OperatorActionButtonMetadata
  resetPanelButton: OperatorActionButtonMetadata
  restartRemoteServerAction: OperatorConfirmedActionMetadata
  restartAppAction: OperatorConfirmedActionMetadata
  emergencyStopAction: OperatorConfirmedActionMetadata
}

export const OPERATOR_ACTIONS_PANEL_METADATA: OperatorActionsPanelMetadata = {
  panelTitle: "Actions",
  runAgentLabel: "Run Agent on Desktop",
  runAgentPromptPlaceholder: "Ask the desktop agent to run a task",
  runAgentPromptAccessibilityLabel: "Desktop agent prompt",
  runAgentPromptAccessibilityHint: "Enter a task for the connected desktop agent to run through the operator API.",
  runAgentButton: {
    accessibilityLabel: "Run agent on desktop",
    pendingLabel: "Running agent…",
    buttonLabel: "Run agent",
  },
  refreshButton: {
    accessibilityLabel: "Refresh operator console",
    pendingLabel: "Refreshing…",
    buttonLabel: "Refresh",
  },
  stopSpeechButton: {
    accessibilityLabel: "Stop desktop speech playback",
    pendingLabel: "Stopping speech…",
    buttonLabel: "Stop speech",
  },
  showAppButton: {
    accessibilityLabel: "Show desktop app window",
    pendingLabel: "Showing app…",
    buttonLabel: "Show app",
  },
  showHistoryButton: {
    accessibilityLabel: "Show desktop conversation history",
    pendingLabel: "Opening history…",
    buttonLabel: "History",
  },
  showSettingsButton: {
    accessibilityLabel: "Show desktop settings",
    pendingLabel: "Opening settings…",
    buttonLabel: "Settings",
  },
  showPanelButton: {
    accessibilityLabel: "Show desktop floating panel",
    pendingLabel: "Showing panel…",
    buttonLabel: "Show panel",
  },
  hidePanelButton: {
    accessibilityLabel: "Hide desktop floating panel",
    pendingLabel: "Hiding panel…",
    buttonLabel: "Hide panel",
  },
  resetPanelButton: {
    accessibilityLabel: "Reset desktop floating panel",
    pendingLabel: "Resetting panel…",
    buttonLabel: "Reset panel",
  },
  restartRemoteServerAction: {
    confirmTitle: "Restart Remote Server",
    confirmMessage: "Restart the desktop remote server? Mobile clients may reconnect automatically after a short interruption.",
    confirmButtonLabel: "Restart Server",
    accessibilityLabel: "Restart remote server",
    buttonLabel: "Restart remote server",
  },
  restartAppAction: {
    confirmTitle: "Restart App",
    confirmMessage: "Restart the DotAgents desktop app now? The connection may drop while the app relaunches.",
    confirmButtonLabel: "Restart App",
    accessibilityLabel: "Restart app",
    buttonLabel: "Restart app",
  },
  emergencyStopAction: {
    confirmTitle: "Emergency Stop",
    confirmMessage: "Stop active agent work across the desktop app? Use this when the operator needs an immediate halt.",
    confirmButtonLabel: "Emergency Stop",
    accessibilityLabel: "Emergency stop",
    buttonLabel: "Emergency stop",
  },
}

export type OperatorUpdaterPanelMetadata = {
  panelTitle: string
  formatMode: (mode: OperatorRuntimeStatus["updater"]["mode"]) => string
  formatCurrentVersion: (version?: string) => string
  formatUpdateAvailable: (updateAvailable?: boolean) => string
  formatLastChecked: (lastCheckedAt?: number) => string
  formatLatestRelease: (tagName: string) => string
  formatPublished: (publishedAt?: string) => string
  formatAssets: (assetCount?: number) => string
  formatReleaseUrl: (url: string) => string
  formatRecommendedAsset: (name: string) => string
  formatAssetUrl: (downloadUrl: string) => string
  formatLastDownloadedFile: (fileName: string) => string
  formatDownloadedAt: (downloadedAt?: number) => string
  formatLastCheckError: (error: string) => string
  formatManualReleases: (url: string) => string
  checkLatestReleaseButton: OperatorActionButtonMetadata
  downloadLatestInstallerAction: OperatorConfirmedActionButtonMetadata
  revealDownloadedInstallerButton: OperatorActionButtonMetadata
  openDownloadedInstallerAction: OperatorConfirmedActionButtonMetadata
  openReleasePageButton: OperatorActionButtonMetadata
}

export const OPERATOR_UPDATER_PANEL_METADATA: OperatorUpdaterPanelMetadata = {
  panelTitle: "Updater",
  formatMode: (mode) => `Mode: ${mode}`,
  formatCurrentVersion: (version) => `Current version: ${version || OPERATOR_EMPTY_VALUE_LABEL}`,
  formatUpdateAvailable: (updateAvailable) =>
    `Update available: ${updateAvailable === undefined ? "Unknown" : updateAvailable ? "Yes" : "No"}`,
  formatLastChecked: (lastCheckedAt) => `Last checked: ${formatOperatorTimestamp(lastCheckedAt)}`,
  formatLatestRelease: (tagName) => `Latest release: ${tagName}`,
  formatPublished: (publishedAt) => `Published: ${publishedAt || OPERATOR_EMPTY_VALUE_LABEL}`,
  formatAssets: (assetCount) => `Assets: ${assetCount ?? 0}`,
  formatReleaseUrl: (url) => `Release URL: ${url}`,
  formatRecommendedAsset: (name) => `Recommended asset: ${name}`,
  formatAssetUrl: (downloadUrl) => `Asset URL: ${downloadUrl}`,
  formatLastDownloadedFile: (fileName) => `Last downloaded file: ${fileName}`,
  formatDownloadedAt: (downloadedAt) => `Downloaded at: ${formatOperatorTimestamp(downloadedAt)}`,
  formatLastCheckError: (error) => `Last check error: ${error}`,
  formatManualReleases: (url) => `Manual releases: ${url}`,
  checkLatestReleaseButton: {
    accessibilityLabel: "Check latest release",
    pendingLabel: "Checking latest release…",
    buttonLabel: "Check latest release",
  },
  downloadLatestInstallerAction: {
    confirmTitle: "Download Latest Installer",
    confirmMessage: "Download the recommended release asset onto the desktop machine now? This does not install it automatically.",
    confirmButtonLabel: "Download",
    accessibilityLabel: "Download latest installer",
    pendingLabel: "Downloading installer…",
    buttonLabel: "Download latest installer",
  },
  revealDownloadedInstallerButton: {
    accessibilityLabel: "Reveal downloaded installer",
    pendingLabel: "Revealing installer…",
    buttonLabel: "Reveal downloaded installer",
  },
  openDownloadedInstallerAction: {
    confirmTitle: "Open Downloaded Installer",
    confirmMessage: "Open the downloaded installer on the desktop machine now? This may launch the installer UI on that machine.",
    confirmButtonLabel: "Open Installer",
    accessibilityLabel: "Open downloaded installer",
    pendingLabel: "Opening installer…",
    buttonLabel: "Open downloaded installer",
  },
  openReleasePageButton: {
    accessibilityLabel: "Open release page",
    pendingLabel: "Opening release page…",
    buttonLabel: "Open release page",
  },
}

export type OperatorAuditPanelMetadata = {
  panelTitle: string
  helperText: string
  emptyText: string
}

export const OPERATOR_AUDIT_PANEL_METADATA: OperatorAuditPanelMetadata = {
  panelTitle: "Recent operator audit",
  helperText: "Recent operator actions from the desktop audit log, including the stable device ID attached by this mobile client.",
  emptyText: "No recent operator audit entries returned by the desktop server.",
}

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
  formatGeneratedAt: (timestamp?: number) => string
  formatMcpSummary: (availableTools: number, serverStatusCount: number, configuredServerCount: number) => string
  formatLogEntries: (logEntryCount: number) => string
  formatToolDiscoveryError: (error: string) => string
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
  formatGeneratedAt: (timestamp) => `Generated: ${formatOperatorTimestamp(timestamp)}`,
  formatMcpSummary: (availableTools, serverStatusCount, configuredServerCount) =>
    `MCP tools: ${availableTools} • Servers: ${serverStatusCount}/${configuredServerCount}`,
  formatLogEntries: (logEntryCount) => `Log entries: ${logEntryCount}`,
  formatToolDiscoveryError: (error) => `Tool discovery: ${error}`,
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

export type OperatorMessageQueuesPanelMetadata = {
  panelTitle: string
  formatSummary: (queuedMessageCount: number, conversationCount: number) => string
  formatQueueSummary: (conversationId: string, messageCount: number, isPaused: boolean) => string
  formatMessageInputAccessibilityLabel: (messageId: string) => string
  formatCancelEditAccessibilityLabel: (messageId: string) => string
  cancelEditButtonLabel: string
  formatSaveMessageAccessibilityLabel: (messageId: string) => string
  saveMessagePendingLabel: string
  saveMessageButtonLabel: string
  formatRetryMessageAccessibilityLabel: (messageId: string) => string
  retryMessagePendingLabel: string
  retryMessageButtonLabel: string
  formatEditMessageAccessibilityLabel: (messageId: string) => string
  editMessageButtonLabel: string
  removeMessageConfirmTitle: string
  formatRemoveMessageConfirmMessage: (messageId: string, conversationId: string) => string
  removeMessageConfirmButtonLabel: string
  formatRemoveMessageAccessibilityLabel: (messageId: string) => string
  removeMessagePendingLabel: string
  removeMessageButtonLabel: string
  formatResumeQueueAccessibilityLabel: (conversationId: string) => string
  resumeQueuePendingLabel: string
  resumeQueueButtonLabel: string
  formatPauseQueueAccessibilityLabel: (conversationId: string) => string
  pauseQueuePendingLabel: string
  pauseQueueButtonLabel: string
  clearQueueConfirmTitle: string
  formatClearQueueConfirmMessage: (conversationId: string) => string
  clearQueueConfirmButtonLabel: string
  formatClearQueueAccessibilityLabel: (conversationId: string) => string
  clearQueuePendingLabel: string
  clearQueueButtonLabel: string
}

export const OPERATOR_MESSAGE_QUEUES_PANEL_METADATA: OperatorMessageQueuesPanelMetadata = {
  panelTitle: "Desktop message queues",
  formatSummary: (queuedMessageCount, conversationCount) =>
    `${queuedMessageCount} queued messages across ${conversationCount} conversations`,
  formatQueueSummary: (conversationId, messageCount, isPaused) =>
    `${conversationId}: ${messageCount} queued${isPaused ? " (paused)" : ""}`,
  formatMessageInputAccessibilityLabel: (messageId) => `Queued message ${messageId}`,
  formatCancelEditAccessibilityLabel: (messageId) => `Cancel editing queued message ${messageId}`,
  cancelEditButtonLabel: "Cancel",
  formatSaveMessageAccessibilityLabel: (messageId) => `Save queued message ${messageId}`,
  saveMessagePendingLabel: "Saving...",
  saveMessageButtonLabel: "Save",
  formatRetryMessageAccessibilityLabel: (messageId) => `Retry queued message ${messageId}`,
  retryMessagePendingLabel: "Retrying...",
  retryMessageButtonLabel: "Retry",
  formatEditMessageAccessibilityLabel: (messageId) => `Edit queued message ${messageId}`,
  editMessageButtonLabel: "Edit",
  removeMessageConfirmTitle: "Remove Queued Message",
  formatRemoveMessageConfirmMessage: (messageId, conversationId) => `Remove queued message ${messageId} from ${conversationId}?`,
  removeMessageConfirmButtonLabel: "Remove",
  formatRemoveMessageAccessibilityLabel: (messageId) => `Remove queued message ${messageId}`,
  removeMessagePendingLabel: "Removing...",
  removeMessageButtonLabel: "Remove",
  formatResumeQueueAccessibilityLabel: (conversationId) => `Resume ${conversationId} desktop message queue`,
  resumeQueuePendingLabel: "Resuming...",
  resumeQueueButtonLabel: "Resume",
  formatPauseQueueAccessibilityLabel: (conversationId) => `Pause ${conversationId} desktop message queue`,
  pauseQueuePendingLabel: "Pausing...",
  pauseQueueButtonLabel: "Pause",
  clearQueueConfirmTitle: "Clear Message Queue",
  formatClearQueueConfirmMessage: (conversationId) =>
    `Clear the queued desktop messages for ${conversationId}? Processing messages cannot be cleared.`,
  clearQueueConfirmButtonLabel: "Clear Queue",
  formatClearQueueAccessibilityLabel: (conversationId) => `Clear ${conversationId} desktop message queue`,
  clearQueuePendingLabel: "Clearing...",
  clearQueueButtonLabel: "Clear",
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

export type OperatorDiscordPanelMetadata = {
  panelTitle: string
  formatStatus: (discord: Pick<OperatorDiscordIntegrationSummary, "connected" | "connecting" | "enabled">) => string
  formatAvailable: (available?: boolean) => string
  formatTokenConfigured: (tokenConfigured?: boolean) => string
  formatBotUsername: (botUsername?: string) => string
  formatDefaultProfile: (defaultProfileName?: string, defaultProfileId?: string) => string
  formatLogs: (logs?: OperatorDiscordIntegrationSummary["logs"]) => string
  formatLastEvent: (lastEventAt?: number) => string
  formatLastError: (lastError: string) => string
  connectButton: OperatorSimpleActionMetadata
  disconnectAction: OperatorConfirmedActionMetadata
  clearLogsAction: OperatorConfirmedActionMetadata
  logsSectionTitle: string
  emptyLogsText: string
}

export const OPERATOR_DISCORD_PANEL_METADATA: OperatorDiscordPanelMetadata = {
  panelTitle: "Discord",
  formatStatus: (discord) =>
    `Status: ${discord.connected ? "Connected" : discord.connecting ? "Connecting" : discord.enabled ? "Enabled, not connected" : "Disabled"}`,
  formatAvailable: (available) => `Available: ${formatOperatorYesNo(available)}`,
  formatTokenConfigured: (tokenConfigured) => `Token configured: ${formatOperatorYesNo(tokenConfigured)}`,
  formatBotUsername: (botUsername) => `Bot username: ${botUsername || OPERATOR_EMPTY_VALUE_LABEL}`,
  formatDefaultProfile: (defaultProfileName, defaultProfileId) =>
    `Default profile: ${defaultProfileName || defaultProfileId || OPERATOR_EMPTY_VALUE_LABEL}`,
  formatLogs: (logs) => `Logs: ${formatOperatorLogSummary(logs)}`,
  formatLastEvent: (lastEventAt) => `Last event: ${formatOperatorTimestamp(lastEventAt)}`,
  formatLastError: (lastError) => `Last error: ${lastError}`,
  connectButton: {
    accessibilityLabel: "Connect Discord",
    buttonLabel: "Connect Discord",
  },
  disconnectAction: {
    confirmTitle: "Disconnect Discord",
    confirmMessage: "Disconnect the Discord bot from the desktop app now?",
    confirmButtonLabel: "Disconnect",
    accessibilityLabel: "Disconnect Discord",
    buttonLabel: "Disconnect",
  },
  clearLogsAction: {
    confirmTitle: "Clear Discord Logs",
    confirmMessage: "Clear the Discord operator log preview on the desktop app?",
    confirmButtonLabel: "Clear Logs",
    accessibilityLabel: "Clear Discord logs",
    buttonLabel: "Clear logs",
  },
  logsSectionTitle: "Discord log preview",
  emptyLogsText: "No Discord log entries returned.",
}

export type OperatorWhatsAppPanelMetadata = {
  panelTitle: string
  formatStatus: (whatsApp: Pick<OperatorWhatsAppIntegrationSummary, "connected" | "enabled">) => string
  formatServerConfigured: (serverConfigured?: boolean) => string
  formatServerConnected: (serverConnected?: boolean) => string
  formatAvailable: (available?: boolean) => string
  formatAutoReply: (autoReplyEnabled?: boolean) => string
  formatLogMessages: (logMessagesEnabled?: boolean) => string
  formatAllowedSenders: (allowedSenderCount: number) => string
  formatCredentialsPresent: (hasCredentials?: boolean) => string
  formatLogs: (logs?: OperatorWhatsAppIntegrationSummary["logs"]) => string
  formatLastError: (lastError: string) => string
  connectButton: OperatorSimpleActionMetadata
  logoutAction: OperatorConfirmedActionMetadata
}

export const OPERATOR_WHATSAPP_PANEL_METADATA: OperatorWhatsAppPanelMetadata = {
  panelTitle: "WhatsApp",
  formatStatus: (whatsApp) =>
    `Status: ${whatsApp.connected ? "Connected" : whatsApp.enabled ? "Enabled, not connected" : "Disabled"}`,
  formatServerConfigured: (serverConfigured) => `Server configured: ${formatOperatorYesNo(serverConfigured)}`,
  formatServerConnected: (serverConnected) => `Server connected: ${formatOperatorYesNo(serverConnected)}`,
  formatAvailable: (available) => `Available: ${formatOperatorYesNo(available)}`,
  formatAutoReply: (autoReplyEnabled) => `Auto-reply: ${formatOperatorYesNo(autoReplyEnabled)}`,
  formatLogMessages: (logMessagesEnabled) => `Log messages: ${formatOperatorYesNo(logMessagesEnabled)}`,
  formatAllowedSenders: (allowedSenderCount) => `Allowed senders: ${allowedSenderCount}`,
  formatCredentialsPresent: (hasCredentials) => `Credentials present: ${formatOperatorYesNo(hasCredentials)}`,
  formatLogs: (logs) => `Logs: ${formatOperatorLogSummary(logs)}`,
  formatLastError: (lastError) => `Last error: ${lastError}`,
  connectButton: {
    accessibilityLabel: "Connect WhatsApp",
    buttonLabel: "Connect WhatsApp",
  },
  logoutAction: {
    confirmTitle: "Log Out of WhatsApp",
    confirmMessage: "Log out the active WhatsApp session on the desktop app?",
    confirmButtonLabel: "Log Out",
    accessibilityLabel: "Log out of WhatsApp",
    buttonLabel: "Log out",
  },
}

export type OperatorHealthChecksPanelMetadata = {
  panelTitle: string
}

export const OPERATOR_HEALTH_CHECKS_PANEL_METADATA: OperatorHealthChecksPanelMetadata = {
  panelTitle: "Health checks",
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
