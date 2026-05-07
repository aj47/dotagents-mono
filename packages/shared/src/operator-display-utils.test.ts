import { describe, expect, it } from "vitest"

import {
  OPERATOR_ACTIONS_PANEL_METADATA,
  OPERATOR_AGENT_SESSIONS_PANEL_METADATA,
  OPERATOR_ALERT_METADATA,
  OPERATOR_AUDIT_PANEL_METADATA,
  OPERATOR_CONNECTION_REQUIRED_PANEL_METADATA,
  OPERATOR_CONVERSATIONS_PANEL_METADATA,
  OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA,
  OPERATOR_DISCORD_PANEL_METADATA,
  OPERATOR_EMPTY_VALUE_LABEL,
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
  formatOperatorActiveAgentSessionSummary,
  formatOperatorAuditDetails,
  formatOperatorAuditSource,
  formatOperatorDurationSeconds,
  formatOperatorLogSummary,
  formatOperatorRecentAgentSessionSummary,
  formatOperatorTimestamp,
  formatOperatorYesNo,
  getOperatorAgentSessionDisplayName,
  getOperatorTunnelStateLabel,
} from "./operator-display-utils"

describe("operator display utils", () => {
  it("exports operator connection, status, and system panel metadata", () => {
    expect(OPERATOR_CONNECTION_REQUIRED_PANEL_METADATA).toEqual({
      panelTitle: "Connection required",
      bodyText: "Connect the mobile app to a DotAgents desktop server before using operator controls.",
      openSettingsAccessibilityLabel: "Open connection settings",
      openSettingsButtonLabel: "Open connection settings",
    })
    expect(OPERATOR_REMOTE_ACCESS_SETTINGS_PANEL_METADATA).toEqual({
      panelTitle: "Remote access settings",
      helperText: "These controls use the desktop settings API and keep the layout intentionally compact for phone screens.",
      remoteServerSectionTitle: "Remote server",
      portDisconnectHelperText: "Changing the port can temporarily disconnect this mobile session.",
    })
    expect(OPERATOR_STATUS_PANEL_METADATA).toEqual({
      panelTitle: "Operator status",
      waitingText: "Waiting for operator status…",
      loadingText: "Loading operator data…",
      formatUpdatedText: expect.any(Function),
      formatIntegrationSummary: expect.any(Function),
      formatPendingSettingText: expect.any(Function),
    })
    expect(OPERATOR_STATUS_PANEL_METADATA.formatUpdatedText("healthy", Date.UTC(2026, 4, 6, 16, 30, 0))).toContain(
      "healthy • Updated ",
    )
    expect(OPERATOR_STATUS_PANEL_METADATA.formatIntegrationSummary(2, 3)).toBe("Push tokens: 2 • Recent errors: 3")
    expect(OPERATOR_STATUS_PANEL_METADATA.formatPendingSettingText("remote server")).toBe("Saving remote server…")

    expect(OPERATOR_ALERT_METADATA).toEqual({
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
    })

    const system = {
      platform: "darwin",
      arch: "arm64",
      nodeVersion: "22.0.0",
      electronVersion: "35.0.0",
      appVersion: "1.2.3",
      uptimeSeconds: 3720,
      processUptimeSeconds: 120,
      memoryUsage: {
        heapUsedMB: 100,
        heapTotalMB: 200,
        rssMB: 300,
      },
      cpuCount: 10,
      totalMemoryMB: 16000,
      freeMemoryMB: 8000,
      hostname: "aj-mac",
    }
    expect(OPERATOR_SYSTEM_PANEL_METADATA).toEqual({
      panelTitle: "System",
      formatPlatformSummary: expect.any(Function),
      formatRuntimeSummary: expect.any(Function),
      formatMemorySummary: expect.any(Function),
      formatUptimeSummary: expect.any(Function),
    })
    expect(OPERATOR_SYSTEM_PANEL_METADATA.formatPlatformSummary(system)).toBe("aj-mac • darwin/arm64")
    expect(OPERATOR_SYSTEM_PANEL_METADATA.formatRuntimeSummary(system)).toBe("App 1.2.3 • Electron 35.0.0 • Node 22.0.0")
    expect(OPERATOR_SYSTEM_PANEL_METADATA.formatRuntimeSummary({ ...system, appVersion: undefined, electronVersion: undefined })).toBe(
      "App ? • Electron ? • Node 22.0.0",
    )
    expect(OPERATOR_SYSTEM_PANEL_METADATA.formatMemorySummary(system)).toBe("Memory: 300 MB RSS • 8000/16000 MB free • 10 CPUs")
    expect(OPERATOR_SYSTEM_PANEL_METADATA.formatUptimeSummary(system)).toBe("Process uptime: 2m • System uptime: 1h 2m")
  })

  it("exports operator actions panel metadata", () => {
    expect(OPERATOR_ACTIONS_PANEL_METADATA).toEqual({
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
    })
  })

  it("exports operator updater panel metadata", () => {
    expect(OPERATOR_UPDATER_PANEL_METADATA).toEqual({
      panelTitle: "Updater",
      formatMode: expect.any(Function),
      formatCurrentVersion: expect.any(Function),
      formatUpdateAvailable: expect.any(Function),
      formatLastChecked: expect.any(Function),
      formatLatestRelease: expect.any(Function),
      formatPublished: expect.any(Function),
      formatAssets: expect.any(Function),
      formatReleaseUrl: expect.any(Function),
      formatRecommendedAsset: expect.any(Function),
      formatAssetUrl: expect.any(Function),
      formatLastDownloadedFile: expect.any(Function),
      formatDownloadedAt: expect.any(Function),
      formatLastCheckError: expect.any(Function),
      formatManualReleases: expect.any(Function),
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
    })
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatMode("manual")).toBe("Mode: manual")
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatCurrentVersion("1.2.3")).toBe("Current version: 1.2.3")
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatCurrentVersion()).toBe(`Current version: ${OPERATOR_EMPTY_VALUE_LABEL}`)
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatUpdateAvailable()).toBe("Update available: Unknown")
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatUpdateAvailable(true)).toBe("Update available: Yes")
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatUpdateAvailable(false)).toBe("Update available: No")
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatLastChecked()).toBe(`Last checked: ${OPERATOR_EMPTY_VALUE_LABEL}`)
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatLatestRelease("v1.2.3")).toBe("Latest release: v1.2.3")
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatPublished()).toBe(`Published: ${OPERATOR_EMPTY_VALUE_LABEL}`)
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatAssets()).toBe("Assets: 0")
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatAssets(3)).toBe("Assets: 3")
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatReleaseUrl("https://example.com/release")).toBe(
      "Release URL: https://example.com/release",
    )
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatRecommendedAsset("DotAgents.dmg")).toBe("Recommended asset: DotAgents.dmg")
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatAssetUrl("https://example.com/asset")).toBe(
      "Asset URL: https://example.com/asset",
    )
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatLastDownloadedFile("DotAgents.dmg")).toBe(
      "Last downloaded file: DotAgents.dmg",
    )
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatDownloadedAt()).toBe(`Downloaded at: ${OPERATOR_EMPTY_VALUE_LABEL}`)
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatLastCheckError("network failed")).toBe("Last check error: network failed")
    expect(OPERATOR_UPDATER_PANEL_METADATA.formatManualReleases("https://example.com/releases")).toBe(
      "Manual releases: https://example.com/releases",
    )
  })

  it("exports operator audit panel metadata", () => {
    expect(OPERATOR_AUDIT_PANEL_METADATA).toEqual({
      panelTitle: "Recent operator audit",
      helperText: "Recent operator actions from the desktop audit log, including the stable device ID attached by this mobile client.",
      emptyText: "No recent operator audit entries returned by the desktop server.",
      successStatusLabel: "success",
      failedStatusLabel: "failed",
      formatSource: expect.any(Function),
      formatDetails: expect.any(Function),
      formatFailure: expect.any(Function),
    })
    expect(OPERATOR_AUDIT_PANEL_METADATA.formatSource("device • 127.0.0.1")).toBe("Source: device • 127.0.0.1")
    expect(OPERATOR_AUDIT_PANEL_METADATA.formatDetails("enabled: true")).toBe("Details: enabled: true")
    expect(OPERATOR_AUDIT_PANEL_METADATA.formatFailure("denied")).toBe("Failure: denied")
  })

  it("exports diagnostic report action metadata", () => {
    expect(OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA).toEqual({
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
      formatGeneratedMessage: expect.any(Function),
      formatGeneratedAt: expect.any(Function),
      formatMcpSummary: expect.any(Function),
      formatLogEntries: expect.any(Function),
      formatToolDiscoveryError: expect.any(Function),
    })
    expect(OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.formatGeneratedMessage(3)).toBe(
      "Diagnostic report generated with 3 log entries.",
    )
    expect(OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.formatGeneratedAt()).toBe(`Generated: ${OPERATOR_EMPTY_VALUE_LABEL}`)
    expect(OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.formatMcpSummary(4, 2, 3)).toBe("MCP tools: 4 • Servers: 2/3")
    expect(OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.formatLogEntries(5)).toBe("Log entries: 5")
    expect(OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.formatToolDiscoveryError("timeout")).toBe("Tool discovery: timeout")
  })

  it("exports operator logs panel metadata", () => {
    expect(OPERATOR_LOGS_PANEL_METADATA).toEqual({
      panelTitle: "Recent operator logs",
      clearConfirmTitle: "Clear Operator Log",
      clearConfirmMessage: "Clear the desktop operator error log now?",
      clearConfirmButtonLabel: "Clear Log",
      clearAccessibilityLabel: "Clear desktop operator error log",
      clearPendingLabel: "Clearing log…",
      clearButtonLabel: "Clear log",
      emptyText: "No recent operator log entries returned by the desktop server.",
    })
  })

  it("exports operator errors panel metadata", () => {
    expect(OPERATOR_ERRORS_PANEL_METADATA).toEqual({
      panelTitle: "Recent errors",
      emptyText: "No recent errors returned by the desktop server.",
    })
  })

  it("exports operator conversations panel metadata", () => {
    expect(OPERATOR_CONVERSATIONS_PANEL_METADATA).toEqual({
      panelTitle: "Recent conversations",
      formatConversationSummary: expect.any(Function),
      formatConversationUpdatedPreview: expect.any(Function),
    })
    expect(OPERATOR_CONVERSATIONS_PANEL_METADATA.formatConversationSummary("Build release", 3)).toBe(
      "Build release (3 msgs)",
    )
    expect(OPERATOR_CONVERSATIONS_PANEL_METADATA.formatConversationSummary(undefined, 1)).toBe("Untitled (1 msgs)")
    expect(
      OPERATOR_CONVERSATIONS_PANEL_METADATA.formatConversationUpdatedPreview(
        undefined,
        "A long preview that stays under the truncation limit",
      ),
    ).toBe(`${OPERATOR_EMPTY_VALUE_LABEL} — A long preview that stays under the truncation limit`)
  })

  it("exports operator agent sessions panel metadata", () => {
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA).toEqual({
      panelTitle: "Agent sessions",
      formatSummary: expect.any(Function),
      formatActiveStartedAt: expect.any(Function),
      clearInactiveConfirmTitle: "Clear Inactive Sessions",
      clearInactiveConfirmMessage: "Clear recent inactive agent sessions on the desktop app? Sessions with queued follow-ups are kept.",
      clearInactiveConfirmButtonLabel: "Clear Sessions",
      clearInactiveAccessibilityLabel: "Clear inactive agent sessions on desktop",
      clearInactivePendingLabel: "Clearing...",
      clearInactiveButtonLabel: "Clear inactive",
      hideActiveAccessibilityLabel: "Hide active agent sessions and desktop panel",
      hideActivePendingLabel: "Hiding...",
      hideActiveButtonLabel: "Hide active",
      formatShowAccessibilityLabel: expect.any(Function),
      showPendingLabel: "Showing...",
      showButtonLabel: "Show",
      formatSnoozeAccessibilityLabel: expect.any(Function),
      formatSnoozePendingLabel: expect.any(Function),
      formatSnoozeButtonLabel: expect.any(Function),
      stopConfirmTitle: "Stop Agent Session",
      formatStopConfirmMessage: expect.any(Function),
      stopConfirmButtonLabel: "Stop Session",
      formatStopAccessibilityLabel: expect.any(Function),
      stopPendingLabel: "Stopping...",
      stopButtonLabel: "Stop",
      recentSessionsLabel: "Recent sessions",
      formatRecentTime: expect.any(Function),
      dismissConfirmTitle: "Dismiss Agent Session",
      formatDismissConfirmMessage: expect.any(Function),
      dismissConfirmButtonLabel: "Dismiss",
      formatDismissAccessibilityLabel: expect.any(Function),
      dismissPendingLabel: "Dismissing...",
      dismissButtonLabel: "Dismiss",
      noActiveSessionsText: "No active agent sessions",
    })
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatSummary(2, 5)).toBe("Active: 2 • Recent: 5")
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatActiveStartedAt()).toBe(`Since ${OPERATOR_EMPTY_VALUE_LABEL}`)
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatShowAccessibilityLabel("Build release")).toBe(
      "Show Build release agent session on desktop",
    )
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatSnoozeAccessibilityLabel("Build release", false)).toBe(
      "Hide Build release agent session",
    )
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatSnoozeAccessibilityLabel("Build release", true)).toBe(
      "Restore Build release agent session",
    )
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatSnoozePendingLabel(false)).toBe("Hiding...")
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatSnoozePendingLabel(true)).toBe("Restoring...")
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatSnoozeButtonLabel(false)).toBe("Hide")
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatSnoozeButtonLabel(true)).toBe("Restore")
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatStopConfirmMessage("Build release")).toBe(
      "Stop Build release on the desktop app? The conversation queue for this session will be paused.",
    )
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatStopAccessibilityLabel("Build release")).toBe(
      "Stop Build release agent session",
    )
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatRecentTime(undefined, 1_776_000_000_000)).toContain("Ended ")
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatRecentTime(1_776_000_000_000)).toContain("Started ")
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatDismissConfirmMessage("Build release")).toBe(
      "Dismiss Build release from desktop agent progress?",
    )
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatDismissAccessibilityLabel("Build release")).toBe(
      "Dismiss Build release agent session progress on desktop",
    )
  })

  it("exports operator message queues panel metadata", () => {
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA).toEqual({
      panelTitle: "Desktop message queues",
      formatSummary: expect.any(Function),
      formatQueueSummary: expect.any(Function),
      formatMessageSummary: expect.any(Function),
      formatMessageInputAccessibilityLabel: expect.any(Function),
      formatCancelEditAccessibilityLabel: expect.any(Function),
      cancelEditButtonLabel: "Cancel",
      formatSaveMessageAccessibilityLabel: expect.any(Function),
      saveMessagePendingLabel: "Saving...",
      saveMessageButtonLabel: "Save",
      formatRetryMessageAccessibilityLabel: expect.any(Function),
      retryMessagePendingLabel: "Retrying...",
      retryMessageButtonLabel: "Retry",
      formatEditMessageAccessibilityLabel: expect.any(Function),
      editMessageButtonLabel: "Edit",
      removeMessageConfirmTitle: "Remove Queued Message",
      formatRemoveMessageConfirmMessage: expect.any(Function),
      removeMessageConfirmButtonLabel: "Remove",
      formatRemoveMessageAccessibilityLabel: expect.any(Function),
      removeMessagePendingLabel: "Removing...",
      removeMessageButtonLabel: "Remove",
      formatResumeQueueAccessibilityLabel: expect.any(Function),
      resumeQueuePendingLabel: "Resuming...",
      resumeQueueButtonLabel: "Resume",
      formatPauseQueueAccessibilityLabel: expect.any(Function),
      pauseQueuePendingLabel: "Pausing...",
      pauseQueueButtonLabel: "Pause",
      clearQueueConfirmTitle: "Clear Message Queue",
      formatClearQueueConfirmMessage: expect.any(Function),
      clearQueueConfirmButtonLabel: "Clear Queue",
      formatClearQueueAccessibilityLabel: expect.any(Function),
      clearQueuePendingLabel: "Clearing...",
      clearQueueButtonLabel: "Clear",
    })
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatSummary(4, 2)).toBe("4 queued messages across 2 conversations")
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatQueueSummary("conversation-1", 3, false)).toBe(
      "conversation-1: 3 queued",
    )
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatQueueSummary("conversation-1", 3, true)).toBe(
      "conversation-1: 3 queued (paused)",
    )
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatMessageSummary("pending", "Ship it")).toBe("pending: Ship it")
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatMessageInputAccessibilityLabel("message-1")).toBe(
      "Queued message message-1",
    )
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatCancelEditAccessibilityLabel("message-1")).toBe(
      "Cancel editing queued message message-1",
    )
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatSaveMessageAccessibilityLabel("message-1")).toBe(
      "Save queued message message-1",
    )
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatRetryMessageAccessibilityLabel("message-1")).toBe(
      "Retry queued message message-1",
    )
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatEditMessageAccessibilityLabel("message-1")).toBe(
      "Edit queued message message-1",
    )
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatRemoveMessageConfirmMessage("message-1", "conversation-1")).toBe(
      "Remove queued message message-1 from conversation-1?",
    )
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatRemoveMessageAccessibilityLabel("message-1")).toBe(
      "Remove queued message message-1",
    )
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatResumeQueueAccessibilityLabel("conversation-1")).toBe(
      "Resume conversation-1 desktop message queue",
    )
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatPauseQueueAccessibilityLabel("conversation-1")).toBe(
      "Pause conversation-1 desktop message queue",
    )
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatClearQueueConfirmMessage("conversation-1")).toBe(
      "Clear the queued desktop messages for conversation-1? Processing messages cannot be cleared.",
    )
    expect(OPERATOR_MESSAGE_QUEUES_PANEL_METADATA.formatClearQueueAccessibilityLabel("conversation-1")).toBe(
      "Clear conversation-1 desktop message queue",
    )
  })

  it("exports operator runtime and tunnel status panel metadata", () => {
    expect(OPERATOR_RUNTIME_STATUS_PANEL_METADATA).toEqual({
      panelTitle: "Remote server runtime",
      configuredLabel: "Configured",
      enabledValue: "Enabled",
      disabledValue: "Disabled",
      runningLabel: "Running",
      bindLabel: "Bind",
      connectableUrlLabel: "Connectable URL",
      lastErrorLabel: "Last error",
      formatConfigured: expect.any(Function),
      formatRunning: expect.any(Function),
      formatBind: expect.any(Function),
      formatConnectableUrl: expect.any(Function),
      formatLastError: expect.any(Function),
    })
    expect(OPERATOR_RUNTIME_STATUS_PANEL_METADATA.formatConfigured(true)).toBe("Configured: Enabled")
    expect(OPERATOR_RUNTIME_STATUS_PANEL_METADATA.formatConfigured(false)).toBe("Configured: Disabled")
    expect(OPERATOR_RUNTIME_STATUS_PANEL_METADATA.formatRunning(true)).toBe("Running: Yes")
    expect(OPERATOR_RUNTIME_STATUS_PANEL_METADATA.formatRunning()).toBe(`Running: ${OPERATOR_EMPTY_VALUE_LABEL}`)
    expect(OPERATOR_RUNTIME_STATUS_PANEL_METADATA.formatBind("127.0.0.1", 3210)).toBe("Bind: 127.0.0.1:3210")
    expect(OPERATOR_RUNTIME_STATUS_PANEL_METADATA.formatConnectableUrl()).toBe(`Connectable URL: ${OPERATOR_EMPTY_VALUE_LABEL}`)
    expect(OPERATOR_RUNTIME_STATUS_PANEL_METADATA.formatConnectableUrl("http://lan", "http://local")).toBe(
      "Connectable URL: http://lan",
    )
    expect(OPERATOR_RUNTIME_STATUS_PANEL_METADATA.formatConnectableUrl(undefined, "http://local")).toBe(
      "Connectable URL: http://local",
    )
    expect(OPERATOR_RUNTIME_STATUS_PANEL_METADATA.formatLastError("port unavailable")).toBe("Last error: port unavailable")
    expect(OPERATOR_TUNNEL_STATUS_PANEL_METADATA).toEqual({
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
    })
  })

  it("exports operator Discord and WhatsApp panel metadata", () => {
    expect(OPERATOR_DISCORD_PANEL_METADATA).toEqual({
      panelTitle: "Discord",
      formatStatus: expect.any(Function),
      formatAvailable: expect.any(Function),
      formatTokenConfigured: expect.any(Function),
      formatBotUsername: expect.any(Function),
      formatDefaultProfile: expect.any(Function),
      formatLogs: expect.any(Function),
      formatLastEvent: expect.any(Function),
      formatLastError: expect.any(Function),
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
    })
    expect(OPERATOR_DISCORD_PANEL_METADATA.formatStatus({ connected: true, connecting: false, enabled: true })).toBe(
      "Status: Connected",
    )
    expect(OPERATOR_DISCORD_PANEL_METADATA.formatStatus({ connected: false, connecting: true, enabled: true })).toBe(
      "Status: Connecting",
    )
    expect(OPERATOR_DISCORD_PANEL_METADATA.formatStatus({ connected: false, connecting: false, enabled: true })).toBe(
      "Status: Enabled, not connected",
    )
    expect(OPERATOR_DISCORD_PANEL_METADATA.formatStatus({ connected: false, connecting: false, enabled: false })).toBe(
      "Status: Disabled",
    )
    expect(OPERATOR_DISCORD_PANEL_METADATA.formatAvailable(true)).toBe("Available: Yes")
    expect(OPERATOR_DISCORD_PANEL_METADATA.formatTokenConfigured(false)).toBe("Token configured: No")
    expect(OPERATOR_DISCORD_PANEL_METADATA.formatBotUsername()).toBe(`Bot username: ${OPERATOR_EMPTY_VALUE_LABEL}`)
    expect(OPERATOR_DISCORD_PANEL_METADATA.formatDefaultProfile(undefined, "profile-1")).toBe("Default profile: profile-1")
    expect(OPERATOR_DISCORD_PANEL_METADATA.formatLogs({ total: 3, errorCount: 1 })).toBe("Logs: 3 total • 1 error")
    expect(OPERATOR_DISCORD_PANEL_METADATA.formatLastEvent()).toBe(`Last event: ${OPERATOR_EMPTY_VALUE_LABEL}`)
    expect(OPERATOR_DISCORD_PANEL_METADATA.formatLastError("token missing")).toBe("Last error: token missing")

    expect(OPERATOR_WHATSAPP_PANEL_METADATA).toEqual({
      panelTitle: "WhatsApp",
      formatStatus: expect.any(Function),
      formatServerConfigured: expect.any(Function),
      formatServerConnected: expect.any(Function),
      formatAvailable: expect.any(Function),
      formatAutoReply: expect.any(Function),
      formatLogMessages: expect.any(Function),
      formatAllowedSenders: expect.any(Function),
      formatCredentialsPresent: expect.any(Function),
      formatLogs: expect.any(Function),
      formatLastError: expect.any(Function),
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
    })
    expect(OPERATOR_WHATSAPP_PANEL_METADATA.formatStatus({ connected: true, enabled: true })).toBe("Status: Connected")
    expect(OPERATOR_WHATSAPP_PANEL_METADATA.formatStatus({ connected: false, enabled: true })).toBe(
      "Status: Enabled, not connected",
    )
    expect(OPERATOR_WHATSAPP_PANEL_METADATA.formatStatus({ connected: false, enabled: false })).toBe("Status: Disabled")
    expect(OPERATOR_WHATSAPP_PANEL_METADATA.formatServerConfigured(true)).toBe("Server configured: Yes")
    expect(OPERATOR_WHATSAPP_PANEL_METADATA.formatServerConnected(false)).toBe("Server connected: No")
    expect(OPERATOR_WHATSAPP_PANEL_METADATA.formatAvailable()).toBe(`Available: ${OPERATOR_EMPTY_VALUE_LABEL}`)
    expect(OPERATOR_WHATSAPP_PANEL_METADATA.formatAutoReply(true)).toBe("Auto-reply: Yes")
    expect(OPERATOR_WHATSAPP_PANEL_METADATA.formatLogMessages(false)).toBe("Log messages: No")
    expect(OPERATOR_WHATSAPP_PANEL_METADATA.formatAllowedSenders(2)).toBe("Allowed senders: 2")
    expect(OPERATOR_WHATSAPP_PANEL_METADATA.formatCredentialsPresent()).toBe(`Credentials present: ${OPERATOR_EMPTY_VALUE_LABEL}`)
    expect(OPERATOR_WHATSAPP_PANEL_METADATA.formatLogs({ total: 2, infoCount: 2 })).toBe("Logs: 2 total • 2 info")
    expect(OPERATOR_WHATSAPP_PANEL_METADATA.formatLastError("not paired")).toBe("Last error: not paired")
  })

  it("exports operator health checks panel metadata", () => {
    expect(OPERATOR_HEALTH_CHECKS_PANEL_METADATA).toEqual({
      panelTitle: "Health checks",
    })
  })

  it("exports operator MCP server panel metadata", () => {
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA).toEqual({
      panelTitle: "MCP servers",
      formatSummary: expect.any(Function),
      formatServerSummary: expect.any(Function),
      disabledSuffix: " (disabled)",
      restartPendingLabel: "Restarting...",
      restartButtonLabel: "Restart",
      formatRestartAccessibilityLabel: expect.any(Function),
      formatRestartedMessage: expect.any(Function),
      stopConfirmTitle: "Stop MCP Server",
      formatStopConfirmMessage: expect.any(Function),
      stopConfirmButtonLabel: "Stop Server",
      stopPendingLabel: "Stopping...",
      stopButtonLabel: "Stop",
      formatStopAccessibilityLabel: expect.any(Function),
      startPendingLabel: "Starting...",
      startButtonLabel: "Start",
      formatStartAccessibilityLabel: expect.any(Function),
      testPendingLabel: "Testing...",
      testButtonLabel: "Test",
      formatTestAccessibilityLabel: expect.any(Function),
      formatTestSuccessMessage: expect.any(Function),
      logsPendingLabel: "Loading...",
      logsExpandedButtonLabel: "Hide logs",
      logsButtonLabel: "Logs",
      formatLogsAccessibilityLabel: expect.any(Function),
      toolsPendingLabel: "Loading...",
      toolsExpandedButtonLabel: "Hide tools",
      toolsButtonLabel: "Tools",
      formatToolsAccessibilityLabel: expect.any(Function),
      logsSectionTitle: "Server logs",
      clearLogsConfirmTitle: "Clear MCP Logs",
      formatClearLogsConfirmMessage: expect.any(Function),
      clearLogsConfirmButtonLabel: "Clear Logs",
      clearLogsPendingLabel: "Clearing...",
      clearLogsButtonLabel: "Clear",
      formatClearLogsAccessibilityLabel: expect.any(Function),
      logsLoadingText: "Loading MCP logs...",
      logsEmptyText: "No logs returned for this server.",
      toolsSectionTitle: "Server tools",
      toolsLoadingText: "Loading MCP tools...",
      toolsEmptyText: "No tools returned for this server.",
      serverDisabledText: "Server disabled",
      formatToolAccessibilityLabel: expect.any(Function),
    })
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatSummary(2, 3, 9)).toBe("2/3 connected • 9 tools")
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatServerSummary(true, true, "filesystem", 4)).toBe(
      "✓ filesystem: 4 tools",
    )
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatServerSummary(false, true, "filesystem", 4)).toBe(
      "✗ filesystem: 4 tools",
    )
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatServerSummary(false, false, "filesystem", 4)).toBe(
      "○ filesystem: 4 tools (disabled)",
    )
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatRestartAccessibilityLabel("filesystem")).toBe("Restart filesystem MCP server")
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatRestartedMessage("filesystem")).toBe("Restarted filesystem")
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatStopConfirmMessage("filesystem")).toBe(
      "Stop filesystem on the desktop app? Its tools will be hidden until the server is started again.",
    )
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatTestSuccessMessage("filesystem", 2)).toBe(
      "Connection test passed for filesystem (2 tools)",
    )
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatTestSuccessMessage("filesystem")).toBe(
      "Connection test passed for filesystem",
    )
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatLogsAccessibilityLabel("filesystem", true)).toBe(
      "Hide filesystem MCP server logs",
    )
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatToolsAccessibilityLabel("filesystem", false)).toBe(
      "Show filesystem MCP server tools",
    )
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatClearLogsConfirmMessage("filesystem")).toBe(
      "Clear logs for filesystem on the desktop app?",
    )
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatClearLogsAccessibilityLabel("filesystem")).toBe(
      "Clear filesystem MCP server logs",
    )
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA.formatToolAccessibilityLabel("search")).toBe("Enable search MCP tool")
  })

  it("formats operator agent session summaries", () => {
    expect(getOperatorAgentSessionDisplayName({ id: "session-1" })).toBe("session-1")
    expect(getOperatorAgentSessionDisplayName({ id: "session-1", title: "Build release" })).toBe("Build release")
    expect(formatOperatorActiveAgentSessionSummary({
      id: "session-1",
      title: "Build release",
      status: "running",
      currentIteration: 2,
      maxIterations: 4,
      isSnoozed: true,
      profileName: "Release agent",
    })).toBe("Build release — running · Release agent · background (2/4)")
    expect(formatOperatorActiveAgentSessionSummary({
      id: "session-2",
      status: "pending",
    })).toBe("session-2 — pending (0/?)")
    expect(formatOperatorRecentAgentSessionSummary({
      id: "session-3",
      title: "Fix bug",
      status: "complete",
      profileName: "Bug agent",
    })).toBe("Fix bug — complete · Bug agent")
  })

  it("formats timestamps with the empty fallback", () => {
    expect(formatOperatorTimestamp()).toBe(OPERATOR_EMPTY_VALUE_LABEL)
    expect(formatOperatorTimestamp(0)).toBe(OPERATOR_EMPTY_VALUE_LABEL)
    expect(formatOperatorTimestamp(Date.UTC(2026, 4, 6, 16, 30, 0))).toBeTruthy()
  })

  it("formats operator durations from seconds", () => {
    expect(formatOperatorDurationSeconds(45)).toBe("45s")
    expect(formatOperatorDurationSeconds(120)).toBe("2m")
    expect(formatOperatorDurationSeconds(3720)).toBe("1h 2m")
    expect(formatOperatorDurationSeconds(7200)).toBe("2h")
  })

  it("formats booleans and tunnel state labels", () => {
    expect(formatOperatorYesNo()).toBe(OPERATOR_EMPTY_VALUE_LABEL)
    expect(formatOperatorYesNo(true)).toBe("Yes")
    expect(formatOperatorYesNo(false)).toBe("No")
    expect(getOperatorTunnelStateLabel(null)).toBe("Unknown")
    expect(getOperatorTunnelStateLabel({ running: true, starting: false } as any)).toBe("Running")
    expect(getOperatorTunnelStateLabel({ running: false, starting: true } as any)).toBe("Starting")
    expect(getOperatorTunnelStateLabel({ running: false, starting: false } as any)).toBe("Stopped")
  })

  it("formats operator log summaries", () => {
    expect(formatOperatorLogSummary()).toBe(OPERATOR_EMPTY_VALUE_LABEL)
    expect(formatOperatorLogSummary({
      total: 12,
      errorCount: 2,
      warningCount: 3,
      infoCount: 7,
    })).toBe("12 total • 2 error • 3 warning • 7 info")
  })

  it("formats audit source and detail summaries", () => {
    expect(formatOperatorAuditSource({
      timestamp: 1,
      action: "rotate",
      path: "/operator",
      success: true,
      deviceId: "device-1",
      source: { ip: "127.0.0.1", origin: "app" },
    })).toBe("device-1 • 127.0.0.1 • app")

    expect(formatOperatorAuditDetails({
      ok: true,
      count: 2,
      nested: { value: "x" },
    })).toBe('ok: true • count: 2 • nested: {"value":"x"}')
    expect(formatOperatorAuditDetails()).toBeNull()
  })
})
