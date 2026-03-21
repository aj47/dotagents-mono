import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionsSource = readFileSync(
  new URL("./sessions.tsx", import.meta.url),
  "utf8",
)
const tileFollowUpSource = readFileSync(
  new URL("../components/tile-follow-up-input.tsx", import.meta.url),
  "utf8",
)
const agentProgressSource = readFileSync(
  new URL("../components/agent-progress.tsx", import.meta.url),
  "utf8",
)

describe("sessions in-app actions", () => {
  it("opens the in-app session action dialog for start actions instead of the hover panel", () => {
    expect(sessionsSource).toContain("<SessionActionDialog")
    expect(sessionsSource).toContain('setSessionActionDialog({ mode: "text" })')
    expect(sessionsSource).toContain(
      'setSessionActionDialog({ mode: "voice" })',
    )
    expect(sessionsSource).not.toContain(
      "await tipcClient.showPanelWindowWithTextInput({})",
    )
    expect(sessionsSource).not.toContain(
      "await tipcClient.triggerMcpRecording({})",
    )
  })

  it("resets persisted maximized tile width when entering the 1x1 layout", () => {
    expect(sessionsSource).toContain('clearPersistedSize("session-tile")')
  })

  it("always passes the tile layout toggle handler into AgentProgress", () => {
    expect(sessionsSource).toContain("onExpand={handleMaximize}")
  })

  it("opens sidebar-triggered start actions from route search params", () => {
    expect(sessionsSource).toContain('const startAction = params.get("start")')
    expect(sessionsSource).toContain("await handleVoiceStart()")
    expect(sessionsSource).toContain("await handleSelectPrompt(prompt)")
    expect(sessionsSource).toContain("void navigate(")
  })

  it("pins tiles through the shared pinned-session state and tile header action", () => {
    expect(sessionsSource).toContain(
      "const pinnedSessionIds = useAgentStore((s) => s.pinnedSessionIds)",
    )
    expect(sessionsSource).toContain("const comparePinnedFirst =")
    expect(sessionsSource).toContain(
      "onTogglePinned={conversationId ? handleTogglePinned : undefined}",
    )
    expect(agentProgressSource).toContain(
      'title={isPinned ? "Unpin tile" : "Pin tile to top"}',
    )
  })

  it("preserves an explicitly restored tile layout if it remains viable at the minimum tile size", () => {
    expect(sessionsSource).toContain(
      'isTileLayoutModeViable(gridMetrics.width, gridMetrics.height, gridMetrics.gap, tileLayoutMode, "min")',
    )
  })

  it("lets tile voice continuation use the in-app dialog path while keeping the IPC fallback", () => {
    expect(tileFollowUpSource).toContain("if (onVoiceContinue) {")
    expect(tileFollowUpSource).toContain(
      "continueConversationTitle: conversationTitle",
    )
    expect(tileFollowUpSource).toContain(
      "await tipcClient.triggerMcpRecording({ conversationId, sessionId: realSessionId, fromTile: true })",
    )
  })
})
