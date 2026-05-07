import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-agent-sessions-client.ts", import.meta.url), "utf8")
const activeAgentsSidebarSource = readFileSync(new URL("../components/active-agents-sidebar.tsx", import.meta.url), "utf8")
const appLayoutSource = readFileSync(new URL("../components/app-layout.tsx", import.meta.url), "utf8")
const pastSessionsDialogSource = readFileSync(new URL("../components/past-sessions-dialog.tsx", import.meta.url), "utf8")
const agentProcessingViewSource = readFileSync(new URL("../components/agent-processing-view.tsx", import.meta.url), "utf8")
const agentProgressSource = readFileSync(new URL("../components/agent-progress.tsx", import.meta.url), "utf8")
const multiAgentProgressViewSource = readFileSync(
  new URL("../components/multi-agent-progress-view.tsx", import.meta.url),
  "utf8",
)
const overlayFollowUpInputSource = readFileSync(
  new URL("../components/overlay-follow-up-input.tsx", import.meta.url),
  "utf8",
)
const sessionsPageSource = readFileSync(new URL("../pages/sessions.tsx", import.meta.url), "utf8")
const tileFollowUpInputSource = readFileSync(
  new URL("../components/tile-follow-up-input.tsx", import.meta.url),
  "utf8",
)

describe("desktop agent sessions renderer client", () => {
  it("centralizes agent-session list and cleanup IPC channels", () => {
    expect(clientSource).toContain("rendererHandlers.agentSessionsUpdated.listen(listener)")
    expect(clientSource).toContain("tipcClient.getAgentSessions()")
    expect(clientSource).toContain("tipcClient.clearInactiveSessions()")
    expect(clientSource).toContain("tipcClient.stopAgentSession({ sessionId })")
    expect(clientSource).toContain("tipcClient.clearAgentSessionProgress({ sessionId })")
    expect(clientSource).toContain("tipcClient.emergencyStopAgent()")
    expect(clientSource).toContain("tipcClient.unsnoozeAgentSession({ sessionId })")
    expect(clientSource).toContain("tipcClient.respondToToolApproval(request)")
    expect(clientSource).toContain("tipcClient.focusAgentSession({ sessionId })")
    expect(clientSource).toContain("tipcClient.closeAgentModeAndHidePanelWindow()")
    expect(clientSource).toContain("tipcClient.snoozeAgentSessionsAndHidePanelWindow({")
    expect(clientSource).toContain('tipcClient.setPanelMode({ mode: "agent" })')
    expect(clientSource).toContain("tipcClient.showPanelWindow({})")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps session list and cleanup surfaces off direct session list IPC channels", () => {
    const combinedSource = [
      activeAgentsSidebarSource,
      appLayoutSource,
      pastSessionsDialogSource,
      agentProcessingViewSource,
      agentProgressSource,
      multiAgentProgressViewSource,
      overlayFollowUpInputSource,
      sessionsPageSource,
      tileFollowUpInputSource,
    ].join("\n")

    expect(activeAgentsSidebarSource).toContain("desktopAgentSessionsClient.getAgentSessions()")
    expect(appLayoutSource).toContain("desktopAgentSessionsClient.getAgentSessions()")
    expect(pastSessionsDialogSource).toContain("desktopAgentSessionsClient.getAgentSessions()")
    expect(sessionsPageSource).toContain("desktopAgentSessionsClient.getAgentSessions()")
    expect(activeAgentsSidebarSource).toContain("desktopAgentSessionsClient.onAgentSessionsUpdated(")
    expect(appLayoutSource).toContain("desktopAgentSessionsClient.onAgentSessionsUpdated(")
    expect(pastSessionsDialogSource).toContain("desktopAgentSessionsClient.onAgentSessionsUpdated(")
    expect(sessionsPageSource).toContain("desktopAgentSessionsClient.onAgentSessionsUpdated(")
    expect(sessionsPageSource).toContain("desktopAgentSessionsClient.clearInactiveSessions()")
    expect(activeAgentsSidebarSource).toContain("desktopAgentSessionsClient.stopAgentSession(sessionId)")
    expect(activeAgentsSidebarSource).toContain("desktopAgentSessionsClient.clearAgentSessionProgress(sessionId)")
    expect(appLayoutSource).toContain("desktopAgentSessionsClient.emergencyStopAgent()")
    expect(agentProcessingViewSource).toContain("desktopAgentSessionsClient.stopAgentSession(agentProgress.sessionId)")
    expect(agentProgressSource).toContain("desktopAgentSessionsClient.stopAgentSession(progress.sessionId)")
    expect(agentProgressSource).toContain("desktopAgentSessionsClient.emergencyStopAgent()")
    expect(agentProgressSource).toContain("desktopAgentSessionsClient.unsnoozeAgentSession(progress.sessionId)")
    expect(agentProgressSource).toContain("desktopAgentSessionsClient.respondToToolApproval({")
    expect(agentProgressSource).toContain("desktopAgentSessionsClient.focusAgentSession(progress.sessionId)")
    expect(agentProgressSource).toContain("desktopAgentSessionsClient.clearAgentSessionProgress(thisId)")
    expect(agentProgressSource).toContain("desktopAgentSessionsClient.closeAgentModeAndHidePanelWindow()")
    expect(multiAgentProgressViewSource).toContain("desktopAgentSessionsClient.snoozeAgentSessionsAndHidePanelWindow(")
    expect(overlayFollowUpInputSource).toContain("desktopAgentSessionsClient.emergencyStopAgent()")
    expect(overlayFollowUpInputSource).toContain("desktopAgentSessionsClient.stopAgentSession(sessionId)")
    expect(sessionsPageSource).toContain("desktopAgentSessionsClient.focusAgentSessionInPanel(sessionId)")
    expect(sessionsPageSource).toContain("desktopAgentSessionsClient.clearAgentSessionProgress(sessionId)")
    expect(tileFollowUpInputSource).toContain("desktopAgentSessionsClient.emergencyStopAgent()")
    expect(tileFollowUpInputSource).toContain("desktopAgentSessionsClient.stopAgentSession(sessionId)")
    expect(combinedSource).not.toContain("tipcClient.getAgentSessions(")
    expect(combinedSource).not.toContain("rendererHandlers.agentSessionsUpdated")
    expect(combinedSource).not.toContain("tipcClient.clearInactiveSessions(")
    expect(combinedSource).not.toContain("tipcClient.stopAgentSession(")
    expect(combinedSource).not.toContain("tipcClient.clearAgentSessionProgress(")
    expect(combinedSource).not.toContain("tipcClient.focusAgentSession(")
    expect(agentProgressSource).not.toContain("tipcClient.emergencyStopAgent(")
    expect(agentProgressSource).not.toContain("tipcClient.unsnoozeAgentSession(")
    expect(agentProgressSource).not.toContain("tipcClient.respondToToolApproval(")
    expect(agentProgressSource).not.toContain("tipcClient.closeAgentModeAndHidePanelWindow(")
    expect(multiAgentProgressViewSource).not.toContain("tipcClient.snoozeAgentSessionsAndHidePanelWindow(")
    expect(appLayoutSource).not.toContain("tipcClient.emergencyStopAgent(")
  })
})
