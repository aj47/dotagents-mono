import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appLayoutSource = readFileSync(new URL("../components/app-layout.tsx", import.meta.url), "utf8")
const sidebarSource = readFileSync(new URL("../components/active-agents-sidebar.tsx", import.meta.url), "utf8")
const agentProgressSource = readFileSync(new URL("../components/agent-progress.tsx", import.meta.url), "utf8")
const sessionsSource = readFileSync(new URL("./sessions.tsx", import.meta.url), "utf8")
const tileFollowUpSource = readFileSync(new URL("../components/tile-follow-up-input.tsx", import.meta.url), "utf8")

describe("sessions in-app actions", () => {
  it("opens the in-app session action dialog from shared layout handlers instead of the hover panel", () => {
    expect(appLayoutSource).toContain("<SessionActionDialog")
    expect(appLayoutSource).toContain("const handleStartTextSession = useCallback(async () => {")
    expect(appLayoutSource).toContain("const handleStartVoiceSession = useCallback(async () => {")
    expect(appLayoutSource).toContain("openSessionActionDialog({ mode: \"text\" })")
    expect(appLayoutSource).toContain("openSessionActionDialog({ mode: \"voice\" })")
    expect(appLayoutSource).not.toContain("await tipcClient.showPanelWindowWithTextInput({})")
    expect(appLayoutSource).not.toContain("await tipcClient.triggerMcpRecording({})")
  })

  it("uses adaptive grid layout with compact cards for session overview", () => {
    expect(sessionsSource).toContain("calculateAdaptiveColumns")
    expect(sessionsSource).toContain("SessionCompactCard")
    expect(sessionsSource).toContain("expandedSessionId")
  })

  it("handles expand/collapse of session cards", () => {
    expect(sessionsSource).toContain("handleExpandSession")
    expect(sessionsSource).toContain("handleCollapseExpanded")
    expect(sessionsSource).toContain("onCollapse={handleCollapseExpanded}")
  })

  it("routes start and prompt controls through the sidebar instead of the sessions top bar", () => {
    expect(sidebarSource).toContain("<AgentSelector")
    expect(sidebarSource).toContain("<PredefinedPromptsMenu")
    expect(sidebarSource).toContain("onStartTextSession")
    expect(sidebarSource).toContain("onStartVoiceSession")
    expect(sidebarSource).toContain("onCycleTileLayout")
    expect(sidebarSource).toContain('aria-label="Start text session"')
    expect(sidebarSource).toContain('aria-label="Start voice session"')
    expect(sidebarSource).toContain('aria-label="Cycle tile layout"')
    expect(sidebarSource).not.toContain("<span>Start Text</span>")
    expect(sidebarSource).not.toContain("<span>Start Voice</span>")
    expect(sessionsSource).not.toContain('aria-label="Cycle tile layout"')
  })

  it("uses adaptive grid layout with SessionGrid", () => {
    expect(sessionsSource).toContain('className="px-3 py-3"')
    expect(sessionsSource).toContain("adaptiveLayoutMode")
  })

  it("filters completed non-pinned sessions from the main view", () => {
    expect(sessionsSource).toContain("pinnedSessionIds.has(convId)")
  })

  it("keeps pinned tiles at the top of the active sessions grid and exposes a tile pin control", () => {
    expect(sessionsSource).toContain("orderActiveSessionsByPinnedFirst(")
    expect(agentProgressSource).toContain('title={isPinned ? "Unpin session" : "Pin session"}')
    expect(agentProgressSource).toContain("togglePinSession(conversationId)")
  })

  it("lets tile voice continuation use the in-app dialog path while keeping the IPC fallback", () => {
    expect(tileFollowUpSource).toContain("if (onVoiceContinue) {")
    expect(tileFollowUpSource).toContain("continueConversationTitle: conversationTitle")
    expect(tileFollowUpSource).toContain(
      "await tipcClient.triggerMcpRecording({ conversationId, sessionId: realSessionId, fromTile: true })"
    )
  })
})
