import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-agent-sessions-client.ts", import.meta.url), "utf8")
const activeAgentsSidebarSource = readFileSync(new URL("../components/active-agents-sidebar.tsx", import.meta.url), "utf8")
const appLayoutSource = readFileSync(new URL("../components/app-layout.tsx", import.meta.url), "utf8")
const pastSessionsDialogSource = readFileSync(new URL("../components/past-sessions-dialog.tsx", import.meta.url), "utf8")
const sessionsPageSource = readFileSync(new URL("../pages/sessions.tsx", import.meta.url), "utf8")

describe("desktop agent sessions renderer client", () => {
  it("centralizes agent-session list and cleanup IPC channels", () => {
    expect(clientSource).toContain("tipcClient.getAgentSessions()")
    expect(clientSource).toContain("tipcClient.clearInactiveSessions()")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps session list and cleanup surfaces off direct session list IPC channels", () => {
    const combinedSource = [
      activeAgentsSidebarSource,
      appLayoutSource,
      pastSessionsDialogSource,
      sessionsPageSource,
    ].join("\n")

    expect(activeAgentsSidebarSource).toContain("desktopAgentSessionsClient.getAgentSessions()")
    expect(appLayoutSource).toContain("desktopAgentSessionsClient.getAgentSessions()")
    expect(pastSessionsDialogSource).toContain("desktopAgentSessionsClient.getAgentSessions()")
    expect(sessionsPageSource).toContain("desktopAgentSessionsClient.getAgentSessions()")
    expect(sessionsPageSource).toContain("desktopAgentSessionsClient.clearInactiveSessions()")
    expect(combinedSource).not.toContain("tipcClient.getAgentSessions(")
    expect(combinedSource).not.toContain("tipcClient.clearInactiveSessions(")
  })
})
