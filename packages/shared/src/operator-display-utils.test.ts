import { describe, expect, it } from "vitest"

import {
  OPERATOR_AGENT_SESSIONS_PANEL_METADATA,
  OPERATOR_CONVERSATIONS_PANEL_METADATA,
  OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA,
  OPERATOR_EMPTY_VALUE_LABEL,
  OPERATOR_ERRORS_PANEL_METADATA,
  OPERATOR_LOGS_PANEL_METADATA,
  OPERATOR_MCP_SERVERS_PANEL_METADATA,
  OPERATOR_RUNTIME_STATUS_PANEL_METADATA,
  OPERATOR_TUNNEL_STATUS_PANEL_METADATA,
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
    })
    expect(OPERATOR_DIAGNOSTIC_REPORT_ACTION_METADATA.formatGeneratedMessage(3)).toBe(
      "Diagnostic report generated with 3 log entries.",
    )
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
    })
  })

  it("exports operator agent sessions panel metadata", () => {
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA).toEqual({
      panelTitle: "Agent sessions",
      formatSummary: expect.any(Function),
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
      dismissConfirmTitle: "Dismiss Agent Session",
      formatDismissConfirmMessage: expect.any(Function),
      dismissConfirmButtonLabel: "Dismiss",
      formatDismissAccessibilityLabel: expect.any(Function),
      dismissPendingLabel: "Dismissing...",
      dismissButtonLabel: "Dismiss",
      noActiveSessionsText: "No active agent sessions",
    })
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatSummary(2, 5)).toBe("Active: 2 • Recent: 5")
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
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatDismissConfirmMessage("Build release")).toBe(
      "Dismiss Build release from desktop agent progress?",
    )
    expect(OPERATOR_AGENT_SESSIONS_PANEL_METADATA.formatDismissAccessibilityLabel("Build release")).toBe(
      "Dismiss Build release agent session progress on desktop",
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
    })
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

  it("exports operator MCP server panel metadata", () => {
    expect(OPERATOR_MCP_SERVERS_PANEL_METADATA).toEqual({
      panelTitle: "MCP servers",
      formatSummary: expect.any(Function),
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
