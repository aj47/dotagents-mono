import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sidebarSource = readFileSync(new URL("./active-agents-sidebar.tsx", import.meta.url), "utf8")

describe("active agents sidebar status colors", () => {
  it("keeps the selected or expanded sidebar session green even if a stale snooze flag remains", () => {
    expect(sidebarSource).toContain("const isVisiblyActive =")
    expect(sidebarSource).toContain("isSessionExpanded || isFocused || !isSnoozed || hasActiveChildProgress")
    expect(sidebarSource).toContain('? "bg-green-500"')
    expect(sidebarSource).toContain(': "bg-muted-foreground"')
  })

  it("keeps parent sessions visually active while child progress is running", () => {
    expect(sidebarSource).toContain("getSessionIdsWithActiveChildProgress")
    expect(sidebarSource).toContain("const sessionsWithActiveChildProgress = useMemo")
    expect(sidebarSource).toContain("const hasActiveChildProgress = sessionsWithActiveChildProgress.has")
    expect(sidebarSource).toContain('session.status === "active" || hasActiveChildProgress')
  })

  it("promotes store-backed sessions into the active list until dismissed", () => {
    expect(sidebarSource).toContain("const trackedActiveSessions = data?.activeSessions || []")
    expect(sidebarSource).toContain("for (const [sessionId, progress] of agentProgressById.entries())")
    expect(sidebarSource).toContain('status: "active"')
  })

  it("keeps active sidebar sessions running even if a stale progress packet claims completion", () => {
    expect(sidebarSource).toContain("const progressLifecycleState =")
    expect(sidebarSource).toContain('session.status === "active" || hasActiveChildProgress')
    expect(sidebarSource).toContain('? "running"')
    expect(sidebarSource).toContain(': (sessionProgress?.isComplete ? "complete" : "running")')
  })

  it("uses gray for completed past sessions", () => {
    expect(sidebarSource).toContain('session.status === "error"')
    expect(sidebarSource).toContain(': "bg-muted-foreground"')
  })

  it("shows unread agent responses as a blue active-session status", () => {
    expect(sidebarSource).toContain("const hasUnreadResponse = hasUnreadAgentResponse(")
    expect(sidebarSource).toContain("const usesActiveStatusBlue =")
    expect(sidebarSource).toContain("hasUnreadResponse || hasAnalyzingOrPlanningProgress")
    expect(sidebarSource).toContain(': usesActiveStatusBlue\n                  ? "bg-blue-500"')
    expect(sidebarSource).toContain("const shouldPulseStatus =")
  })

  it("treats analyzing/planning progress as an active blue sidebar status", () => {
    expect(sidebarSource).toContain("function isAnalyzingOrPlanningProgress")
    expect(sidebarSource).toContain('latestStep.status !== "in_progress"')
    expect(sidebarSource).toContain('activeStepText.includes("analyzing")')
    expect(sidebarSource).toContain('activeStepText.includes("planning")')
  })
})
