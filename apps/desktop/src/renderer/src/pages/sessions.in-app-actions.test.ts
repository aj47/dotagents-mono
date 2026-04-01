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

  it("renders a single full-height session view instead of the old card grid", () => {
    expect(sessionsSource).toContain("const selectedSessionId = useMemo(() => {")
    expect(sessionsSource).toContain('className="flex h-full min-h-0 flex-col p-3"')
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
    expect(sessionsSource).toContain('if (recentStatus === "stopped") {')
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
})
