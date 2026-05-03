import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sidebarSource = readFileSync(new URL("./active-agents-sidebar.tsx", import.meta.url), "utf8")
const presentationSource = readFileSync(new URL("../lib/session-presentation.ts", import.meta.url), "utf8")

describe("active agents sidebar status colors", () => {
  it("centralizes active-session colors through sidebar presentation semantics", () => {
    expect(sidebarSource).toContain("getSidebarStatusPresentation")
    expect(sidebarSource).toContain("const statusRailColor = sidebarStatusPresentation.railClassName")
    expect(sidebarSource).toContain("const shouldPulseStatus = sidebarStatusPresentation.shouldPulse")
    expect(sidebarSource).not.toContain("const isVisiblyActive =")
    expect(sidebarSource).not.toContain('? "bg-green-500"')
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

  it("keeps active sidebar lifecycle inputs explicit before handing off to presentation", () => {
    expect(sidebarSource).toContain("const progressLifecycleState =")
    expect(sidebarSource).toContain('session.status === "active" || hasActiveChildProgress')
    expect(sidebarSource).toContain('? "running"')
    expect(sidebarSource).toContain(': (sessionProgress?.isComplete ? "complete" : "running")')
    expect(sidebarSource).toContain("conversationState: sessionProgress?.conversationState ?? progressLifecycleState")
  })

  it("uses gray for completed past sessions", () => {
    expect(sidebarSource).toContain('session.status === "error"')
    expect(sidebarSource).toContain(': "bg-muted-foreground/60"')
  })

  it("passes unread and derived live activity attention to the blue foreground status", () => {
    expect(sidebarSource).toContain("const hasUnreadResponse = hasUnreadAgentResponse(")
    expect(sidebarSource).toContain("hasUnreadResponse,")
    expect(sidebarSource).toContain("const sidebarActivity = getSidebarActivityPresentation(sessionProgress)")
    expect(sidebarSource).toContain("hasForegroundActivity: sidebarActivity.isForegroundActivity")
    expect(presentationSource).toContain('railClassName: "bg-blue-500"')
    expect(presentationSource).toContain("shouldPulse: true")
  })

  it("uses semantic activity for rail attention and preview without cramped text badges", () => {
    expect(sidebarSource).toContain("const sessionPreview = sidebarActivity.detail")
    expect(sidebarSource).not.toContain("showInlineActivityBadge")
    expect(sidebarSource).not.toContain("sidebarActivity.badgeClassName")
    expect(sidebarSource).not.toContain("{sidebarActivity.label}")
  })

  it("retains recent final responses before settling back to the normal complete rail", () => {
    expect(sidebarSource).toContain("getLatestAgentResponseTimestamp")
    expect(sidebarSource).toContain("const FINAL_RESPONSE_RETENTION_MS = 10_000")
    expect(sidebarSource).toContain("const hasRecentFinalResponse = recentFinalResponseState.sessionIds.has(session.id)")
    expect(sidebarSource).toContain("hasRecentFinalResponse,")
    expect(presentationSource).toContain('intent: "response", railClassName: "bg-emerald-500"')
  })

  it("makes the final agent response the visually primary sidebar copy", () => {
    expect(sidebarSource).toContain('const isFinalResponsePreview = hasRecentFinalResponse && !!sessionPreview')
    expect(sidebarSource).toContain(
      'isFinalResponsePreview && !isNestedSubagent && "text-[11px] font-normal text-muted-foreground"',
    )
    expect(sidebarSource).toContain('? "text-[12px] font-medium text-foreground"')
  })

  it("uses muted gray for background-running and green only for complete/success", () => {
    expect(presentationSource).toContain('railClassName: "bg-muted-foreground/60"')
    expect(presentationSource).toContain('intent: "success", railClassName: "bg-green-500"')
    expect(presentationSource).not.toContain('intent: "active", railClassName: "bg-green-500"')
  })
})
