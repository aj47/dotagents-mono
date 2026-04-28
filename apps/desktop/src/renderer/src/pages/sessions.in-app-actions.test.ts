import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appLayoutSource = readFileSync(new URL("../components/app-layout.tsx", import.meta.url), "utf8")
const sidebarSource = readFileSync(new URL("../components/active-agents-sidebar.tsx", import.meta.url), "utf8")
const agentProgressSource = readFileSync(new URL("../components/agent-progress.tsx", import.meta.url), "utf8")
const sessionsSource = readFileSync(new URL("./sessions.tsx", import.meta.url), "utf8")
const tileFollowUpSource = readFileSync(new URL("../components/tile-follow-up-input.tsx", import.meta.url), "utf8")
const sessionActionDialogSource = readFileSync(
  new URL("../components/session-action-dialog.tsx", import.meta.url),
  "utf8",
)
const tipcSource = readFileSync(
  new URL("../../../main/tipc.ts", import.meta.url),
  "utf8",
)

describe("sessions in-app actions", () => {
  it("opens the in-app session action dialog from shared layout handlers instead of the hover panel", () => {
    expect(appLayoutSource).toContain("<SessionActionDialog")
    expect(appLayoutSource).toContain("const handleStartTextSession = useCallback(async () => {")
    expect(appLayoutSource).toContain("const handleStartVoiceSession = useCallback(async (options?: {")
    expect(appLayoutSource).toContain("openSessionActionDialog({ mode: \"text\" })")
    expect(appLayoutSource).toContain('mode: "voice"')
    expect(appLayoutSource).toContain("continueConversationTitle: options?.continueConversationTitle")
    expect(appLayoutSource).not.toContain("await tipcClient.showPanelWindowWithTextInput({})")
    expect(appLayoutSource).not.toContain("await tipcClient.triggerMcpRecording({})")
  })

  it("renders a single full-height session view instead of the old card grid", () => {
    expect(sessionsSource).toContain("const selectedSessionId = useMemo(() => {")
    expect(sessionsSource).toContain('className="flex h-full min-h-0 flex-col"')
    expect(sessionsSource).not.toContain("SessionCompactCard")
    expect(sessionsSource).not.toContain("calculateAdaptiveColumns")
  })

  it("prefers focused sessions over stale expanded selection and refreshes clear-inactive handlers", () => {
    expect(
      sessionsSource.indexOf("if (focusedSessionId && displayedSessionIds.has(focusedSessionId)) return focusedSessionId")
    ).toBeLessThan(
      sessionsSource.indexOf("if (expandedSessionId && displayedSessionIds.has(expandedSessionId)) return expandedSessionId")
    )
    expect(sessionsSource).toContain("const handleClearInactiveSessions = useCallback(async () => {")
    expect(sessionsSource).toContain("}, [inactiveSessionCount, handleClearInactiveSessions])")
  })

  it("keeps sidebar active-session clicks selecting the session while past-session opens clear active focus", () => {
    expect(sidebarSource).toContain("setExpandedSessionId(sessionId)")
    expect(sidebarSource).toContain('navigate("/", { state: { clearPendingConversation: true } })')
    expect(sidebarSource).toContain("setExpandedSessionId(null)")
  })

  it("clears stale pending past-session state when returning to an active session", () => {
    expect(appLayoutSource).toContain('navigate("/", { state: { clearPendingConversation: true } })')
    expect(sessionsSource).toContain("if (!navigationState?.clearPendingConversation) return")
    expect(sessionsSource).toContain('navigate(`${location.pathname}${location.search}`, { replace: true, state: null })')
  })

  it("routes start and prompt controls through the sidebar instead of the sessions top bar", () => {
    expect(sidebarSource).toContain("<AgentSelector")
    expect(sidebarSource).toContain("<PredefinedPromptsMenu")
    expect(sidebarSource).toContain("onStartTextSession")
    expect(sidebarSource).toContain("onStartVoiceSession")
    expect(sidebarSource).toContain('className="ml-auto flex items-center gap-2"')
    expect(sidebarSource).toContain('aria-label="Start text session"')
    expect(sidebarSource).toContain('aria-label="Start voice session"')
    expect(sidebarSource).not.toContain('aria-label="Cycle tile layout"')
    expect(appLayoutSource).not.toContain("onCycleTileLayout")
    expect(sidebarSource).not.toContain("<span>Start Text</span>")
    expect(sidebarSource).not.toContain("<span>Start Voice</span>")
    expect(sessionsSource).not.toContain('aria-label="Cycle tile layout"')
  })

  it("keeps expanded sidebar settings headings compact", () => {
    expect(appLayoutSource).toContain(
      'flex w-full items-center gap-1 rounded px-1.5 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wide transition-colors',
    )
    expect(appLayoutSource).toContain('<div className="mt-1 grid gap-0.5 text-xs">')
    expect(appLayoutSource).toContain('flex h-6 items-center rounded px-1.5 text-[11px] font-medium transition-all duration-200')
    expect(appLayoutSource).toContain('isCollapsed ? "justify-center" : "gap-1.5"')
    expect(appLayoutSource).toContain('h-3.5 w-3.5 shrink-0')
    expect(appLayoutSource).toContain('<span className="truncate text-[11px] font-medium leading-4">')
    expect(appLayoutSource).toContain('<span className="select-none">Settings</span>')
    expect(appLayoutSource).not.toContain('i-mingcute-settings-3-line"></span>')
  })

  it("shows sidebar session previews and removes sidebar minimize controls", () => {
    expect(sidebarSource).toContain("getSidebarSessionPreview")
    expect(sidebarSource).toContain('className="min-w-0 flex-1 truncate text-[11px] leading-4 text-muted-foreground"')
    expect(sidebarSource).toContain('className="shrink-0 text-[10px] tabular-nums text-muted-foreground/80"')
    expect(sidebarSource).not.toContain("Minimize - run in background")
  })

  it("does NOT filter completed sessions — they persist until explicitly dismissed", () => {
    expect(sessionsSource).not.toContain("pinnedSessionIds.has(convId)")
  })

  it("keeps errored resumed sessions visible and focused so their error state is shown", () => {
    expect(sessionsSource).toContain("Keep errored AND user-stopped sessions visible")
    expect(sessionsSource).not.toContain('recentStatus === "stopped" || recentStatus === "error"')
    expect(sessionsSource).toContain("setExpandedSessionId(realEntry.sessionId)")
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

  it("navigates to a newly branched conversation so it becomes the focused session", () => {
    expect(agentProgressSource).toContain('const navigate = useNavigate()')
    expect(agentProgressSource).toContain('navigate(`/${branched.id}`)')
    expect(agentProgressSource).not.toContain('Conversation branched — find it in Saved Conversations')
  })

  it("forces sessions started from SessionActionDialog to stay snoozed so the hover panel never auto-shows", () => {
    // The dialog description literally promises "without opening the hover panel",
    // so both text and voice submit paths must hardcode fromTile: true regardless
    // of the prop value. Guards against the regression where sidebar + modal
    // submits would surface the floating panel and drop the app from Cmd+Tab.
    const textSubmitIndex = sessionActionDialogSource.indexOf("const handleTextSubmit")
    const voiceCreateIndex = sessionActionDialogSource.indexOf("tipcClient.createMcpRecording")
    expect(textSubmitIndex).toBeGreaterThan(-1)
    expect(voiceCreateIndex).toBeGreaterThan(-1)

    const textSubmitBlock = sessionActionDialogSource.slice(textSubmitIndex, textSubmitIndex + 800)
    expect(textSubmitBlock).toContain("tipcClient.createMcpTextInput")
    expect(textSubmitBlock).toContain("fromTile: true")

    const voiceSubmitBlock = sessionActionDialogSource.slice(voiceCreateIndex, voiceCreateIndex + 600)
    expect(voiceSubmitBlock).toContain("fromTile: true")

    // The fromTile prop must NOT be destructured into a local variable — the
    // dialog always ignores it in favor of the hardcoded snoozed flag.
    expect(sessionActionDialogSource).not.toContain("fromTile = false,")
    // Sanity: both submit paths must not pass a plain `fromTile` identifier,
    // which would bypass the hardcoded true.
    expect(textSubmitBlock).not.toContain("fromTile,\n      })")
  })

  it("time-suppresses panel auto-show in createMcpTextInput/createMcpRecording when fromTile is true", () => {
    // Defensive safety net: even with the session starting snoozed, an early
    // progress update can race the flag on the main process. suppressPanelAutoShow
    // closes that window so the floating panel cannot briefly flash.
    const textInputIndex = tipcSource.indexOf("createMcpTextInput: t.procedure")
    const recordingIndex = tipcSource.indexOf("createMcpRecording: t.procedure")
    expect(textInputIndex).toBeGreaterThan(-1)
    expect(recordingIndex).toBeGreaterThan(-1)

    const textInputBlock = tipcSource.slice(textInputIndex, textInputIndex + 2000)
    const recordingBlock = tipcSource.slice(recordingIndex, recordingIndex + 2000)

    expect(textInputBlock).toContain("if (input.fromTile === true) {")
    expect(textInputBlock).toContain("suppressPanelAutoShow(2000)")
    expect(recordingBlock).toContain("if (input.fromTile === true) {")
    expect(recordingBlock).toContain("suppressPanelAutoShow(2000)")
  })

  it("derives the active session tile's isFocused from the focusedSessionId store rather than hardcoding true", () => {
    expect(sessionsSource).toContain("const focusedSessionId = useAgentStore((state) => state.focusedSessionId)")
    expect(sessionsSource).toContain("const isFocused = focusedSessionId === sessionId")
    expect(sessionsSource).toContain("isFocused={isFocused}")
    expect(sessionsSource).not.toContain("isFocused={true}")
  })
})
