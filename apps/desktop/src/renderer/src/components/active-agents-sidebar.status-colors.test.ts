import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sidebarSource = readFileSync(new URL("./active-agents-sidebar.tsx", import.meta.url), "utf8")

describe("active agents sidebar status colors", () => {
  it("keeps the selected or expanded sidebar session green even if a stale snooze flag remains", () => {
    expect(sidebarSource).toContain("const isVisiblyActive = isSessionExpanded || isFocused || !isSnoozed")
    expect(sidebarSource).toContain('? "bg-green-500"')
    expect(sidebarSource).toContain(': "bg-muted-foreground"')
  })

  it("promotes store-backed sessions into the active list until dismissed", () => {
    expect(sidebarSource).toContain("const trackedActiveSessions = data?.activeSessions || []")
    expect(sidebarSource).toContain("for (const [sessionId, progress] of agentProgressById.entries())")
    expect(sidebarSource).toContain('status: "active"')
  })

  it("keeps active sidebar sessions running even if a stale progress packet claims completion", () => {
    expect(sidebarSource).toContain('const progressLifecycleState = session.status === "active"')
    expect(sidebarSource).toContain('? "running"')
    expect(sidebarSource).toContain(': (sessionProgress?.isComplete ? "complete" : "running")')
  })

  it("uses gray for completed past sessions", () => {
    expect(sidebarSource).toContain('session.status === "error"')
    expect(sidebarSource).toContain(': "bg-muted-foreground"')
  })

  it("shows unread agent responses as a blue active-session status", () => {
    expect(sidebarSource).toContain("const hasUnreadResponse = hasUnreadAgentResponse(")
    expect(sidebarSource).toContain(': hasUnreadResponse\n                  ? "bg-blue-500"')
    expect(sidebarSource).toContain("const shouldPulseStatus =")
  })
})
