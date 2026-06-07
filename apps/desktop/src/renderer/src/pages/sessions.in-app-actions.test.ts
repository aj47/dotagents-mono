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

const compactSource = (source: string) => source.replace(/\s+/g, " ")

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
    const compactSessionsSource = compactSource(sessionsSource)
    expect(
      compactSessionsSource.indexOf("if (focusedSessionId && displayedSessionIds.has(focusedSessionId)) return focusedSessionId")
    ).toBeLessThan(
      compactSessionsSource.indexOf("if (expandedSessionId && displayedSessionIds.has(expandedSessionId)) return expandedSessionId")
    )
    expect(sessionsSource).toContain("const handleClearInactiveSessions = useCallback(async () => {")
    expect(sessionsSource).toContain("}, [inactiveSessionCount, handleClearInactiveSessions])")
  })

  it("keeps sidebar active-session clicks selecting the session while past-session opens clear active focus", () => {
    expect(sidebarSource).toContain("setExpandedSessionId(sessionId)")
    expect(sidebarSource).toContain('navigate("/", { state: { clearPendingConversation: true } })')
    expect(sidebarSource).toContain("const focusSidebarSessionComposer = useCallback(() => {")
    expect(sidebarSource).toContain("focusSidebarSessionComposer()")
    expect(sidebarSource).toContain("window.setTimeout(tryFocusComposer, 75)")
    expect(sidebarSource).toContain('document.querySelector<HTMLTextAreaElement>(\'textarea[data-composer="true"]\')')
    expect(sidebarSource).toContain("setExpandedSessionId(null)")
  })

  it("clears stale pending past-session state when returning to an active session", () => {
    expect(appLayoutSource).toContain('navigate("/", { state: { clearPendingConversation: true } })')
    expect(sessionsSource).toContain("if (!navigationState?.clearPendingConversation) return")
    const compactSessionsSource = compactSource(sessionsSource)
    expect(compactSessionsSource).toContain('navigate(`${location.pathname}${location.search}`, {')
    expect(compactSessionsSource).toContain("replace: true")
    expect(compactSessionsSource).toContain("state: null")
  })

  it("routes start and prompt controls through the sidebar instead of the sessions top bar", () => {
    expect(sidebarSource).toContain("<AgentSelector")
    expect(sidebarSource).toContain("<PredefinedPromptsMenu")
    expect(sidebarSource).toContain("onStartTextSession")
    expect(sidebarSource).toContain("onStartVoiceSession")
    expect(sidebarSource).toContain('className="ml-auto flex items-center gap-2"')
    expect(sidebarSource).toContain('aria-label="Start text session"')
    expect(sidebarSource).toContain('aria-label="Start voice session"')
    expect(sidebarSource).not.toContain('variant="secondary"')
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
    expect(sidebarSource).toContain("getSidebarActivityPresentation")
    expect(sidebarSource).toContain("const sessionPreview = sidebarActivity.detail")
    expect(sidebarSource).toContain("title={sessionPreview}")
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

  it("preserves display-only thinking blocks when saved conversations become session history", () => {
    expect(sessionsSource).toContain("...(m.displayContent ? { displayContent: m.displayContent } : {}),")
    expect(tipcSource).toContain("...(msg.displayContent ? { displayContent: msg.displayContent } : {}),")
  })

  it("keeps pinned tiles at the top of the active sessions grid and exposes a tile pin control", () => {
    expect(sessionsSource).toContain("orderActiveSessionsByPinnedFirst(")
    expect(agentProgressSource).toContain('title={isPinned ? "Unpin session" : "Pin session"}')
    expect(agentProgressSource).toContain("togglePinSession(conversationId)")
  })

  it("lets tile voice continuation use the in-app dialog path while keeping the IPC fallback", () => {
    expect(tileFollowUpSource).toContain("if (onVoiceContinue) {")
    expect(tileFollowUpSource).toContain("continueConversationTitle: conversationTitle")
    const compactTileFollowUpSource = compactSource(tileFollowUpSource)
    expect(compactTileFollowUpSource).toContain("await tipcClient.triggerMcpRecording({")
    expect(compactTileFollowUpSource).toContain("sessionId: realSessionId")
    expect(compactTileFollowUpSource).toContain("fromTile: true")
  })

  it("navigates to a newly branched conversation so it becomes the focused session", () => {
    expect(agentProgressSource).toContain('const navigate = useNavigate()')
    expect(agentProgressSource).toContain('navigate(`/${branched.id}`)')
    expect(agentProgressSource).not.toContain('Conversation branched — find it in Saved Conversations')
  })

  it("keeps SessionActionDialog sessions audible while suppressing hover-panel auto-show", () => {
    // The dialog description literally promises "without opening the hover panel",
    // but interactive submits should still be foreground/audible for TTS.
    // So both text and voice submit paths should keep fromTile:true while
    // explicitly sending startSnoozed:false.
    const textSubmitIndex = sessionActionDialogSource.indexOf("const handleTextSubmit")
    const voiceCreateIndex = sessionActionDialogSource.indexOf("tipcClient.createMcpRecording")
    expect(textSubmitIndex).toBeGreaterThan(-1)
    expect(voiceCreateIndex).toBeGreaterThan(-1)

    const textSubmitBlock = sessionActionDialogSource.slice(textSubmitIndex, textSubmitIndex + 800)
    expect(textSubmitBlock).toContain("tipcClient.createMcpTextInput")
    expect(textSubmitBlock).toContain("fromTile: true")
    expect(textSubmitBlock).toContain("startSnoozed: false")
    expect(textSubmitBlock).toContain("preserveMainWindowFocus: true")

    const voiceSubmitBlock = sessionActionDialogSource.slice(voiceCreateIndex, voiceCreateIndex + 600)
    expect(voiceSubmitBlock).toContain("fromTile: true")
    expect(voiceSubmitBlock).toContain("startSnoozed: false")
    expect(voiceSubmitBlock).toContain("preserveMainWindowFocus: true")
    expect(sessionActionDialogSource).toContain('host="main"')

    // The fromTile prop must NOT be destructured into a local variable — the
    // dialog should always preserve the hardcoded panel-suppression hint.
    expect(sessionActionDialogSource).not.toContain("fromTile = false,")
    // Sanity: both submit paths must not pass a plain `fromTile` identifier,
    // which would bypass the hardcoded true.
    expect(textSubmitBlock).not.toContain("fromTile,\n      })")
  })

  it("decouples tile origin from background snooze state", () => {
    const compactTileFollowUpSource = compactSource(tileFollowUpSource)
    expect(compactTileFollowUpSource).toContain("fromTile: true")
    expect(compactTileFollowUpSource).toContain("startSnoozed: false")
    expect(compactTileFollowUpSource).toContain("preserveMainWindowFocus: true")
    expect(tipcSource).toContain("fromTile?: boolean // Origin hint")
    expect(tipcSource).toContain("startSnoozed?: boolean // True background mode")
    expect(tipcSource).toContain("preserveMainWindowFocus?: boolean")
    expect(tipcSource).toContain("startSnoozed || input.suppressPanelAutoShow === true || input.fromTile === true")
    expect(tipcSource).toContain("suppressPanelAutoShow: launchState.shouldSuppressPanelAutoShow")
    expect(tipcSource).toContain("createMainWindowForegroundPreserver(")
    expect(tipcSource).toContain("processWithAgentMode(agentInputText, conversationId, existingSessionId, launchState)")
  })

  it("time-suppresses panel auto-show from explicit launch state without forcing snooze", () => {
    // Defensive safety net: panel suppression is a separate launch-state axis.
    // It can be true for tile-origin sessions even when startSnoozed is false.
    const textInputIndex = tipcSource.indexOf("createMcpTextInput: t.procedure")
    const recordingIndex = tipcSource.indexOf("createMcpRecording: t.procedure")
    expect(textInputIndex).toBeGreaterThan(-1)
    expect(recordingIndex).toBeGreaterThan(-1)

    const textInputBlock = tipcSource.slice(textInputIndex, textInputIndex + 2000)
    const recordingBlock = tipcSource.slice(recordingIndex, recordingIndex + 2000)

    expect(textInputBlock).toContain("const launchState = resolveAgentLaunchState(input)")
    expect(textInputBlock).toContain("if (launchState.shouldSuppressPanelAutoShow) {")
    expect(textInputBlock).toContain("suppressPanelAutoShow(2000)")
    expect(recordingBlock).toContain("const launchState = resolveAgentLaunchState(input)")
    expect(recordingBlock).toContain("if (launchState.shouldSuppressPanelAutoShow) {")
    expect(recordingBlock).toContain("suppressPanelAutoShow(2000)")
  })

  it("reports centralized TTS IPC delivery only when handlers are available", () => {
    expect(tipcSource).toContain("const handler = getRendererHandlers<RendererHandlers>(win.webContents).ttsPlaybackStateChanged")
    expect(tipcSource).toContain("handler.send(state)")
    expect(tipcSource).toContain("windowsNotified += 1")
    expect(tipcSource).toContain("const handler = getRendererHandlers<RendererHandlers>(main.webContents).ttsPlaybackCommand")
    expect(tipcSource).toContain("Main renderer has no TTS playback command handler")
    expect(tipcSource).toContain("Main renderer has no TTS playback request handler")
  })

  it("derives the active session tile's isFocused from the focusedSessionId store rather than hardcoding true", () => {
    expect(sessionsSource).toContain("const focusedSessionId = useAgentStore((state) => state.focusedSessionId)")
    expect(sessionsSource).toContain("const isFocused = focusedSessionId === sessionId")
    expect(sessionsSource).toContain("isFocused={isFocused}")
    expect(sessionsSource).not.toContain("isFocused={true}")
  })

  it("lets tracker-active fallback state revive stale completed store progress", () => {
    const compactSessionsSource = compactSource(sessionsSource)
    expect(compactSessionsSource).toContain(
      "storeProgress && fallbackProgress ? mergeTrackedActiveSessionProgress(fallbackProgress, storeProgress) : storeProgress ?? fallbackProgress",
    )
  })

  it("wires lazy earlier-history loading for active session tiles", () => {
    expect(sessionsSource).toContain("const [activeHistoryMessageLimit, setActiveHistoryMessageLimit]")
    expect(sessionsSource).toContain("const progressForExpandedHistoryDecision = useMemo")
    expect(sessionsSource).toContain("const shouldLoadExpandedConversationHistory =")
    expect(sessionsSource.indexOf("const progressForExpandedHistoryDecision = useMemo")).toBeLessThan(
      sessionsSource.indexOf("const shouldLoadExpandedConversationHistory ="),
    )
    expect(sessionsSource).toContain("messageLimit: activeHistoryMessageLimit")
    expect(sessionsSource).toContain("replaceExistingHistory:")
    expect(sessionsSource).toContain("activeHistoryMessageLimit > baseConversationHistoryCount")
    expect(sessionsSource).toContain("onLoadEarlierConversationHistory={handleLoadEarlierConversationHistory}")
    expect(sessionsSource).toContain("isLoadingEarlierConversationHistory={")
  })

  it("hands pending saved-conversation history to the real session before removing the pending tile", () => {
    expect(sessionsSource).toContain("getConversationHydrationQueryKey")
    expect(sessionsSource).toContain("const hydrationConversationQuery")
    expect(sessionsSource).toContain('queryKey: hydrationQueryKey ?? ["conversation", "__missing__", "hydrate"]')
    expect(sessionsSource).toContain("const cachedHydrationConversation")
    expect(sessionsSource).toContain("!!cachedHydrationConversation")
    expect(sessionsSource).not.toContain("hasLiveSessionForPendingResume")
    expect(sessionsSource).toContain("queryClient.setQueryData(")
    expect(sessionsSource).toContain("if (!pendingResumeConversationQuery.data) return")
    expect(
      sessionsSource.indexOf("queryClient.setQueryData(")
    ).toBeLessThan(
      sessionsSource.indexOf("setPendingResumeConversationId(null)", sessionsSource.indexOf("if (realEntry) {")),
    )
    expect(sessionsSource).toContain("onFollowUpSubmitStarted={handlePendingContinuationStarted}")
    expect(sessionsSource).toContain("onFollowUpSubmitFailed={handlePendingContinuationFailed}")
    expect(agentProgressSource).toContain("onMessageSubmitStarted={handleFollowUpSubmitStarted}")
    expect(tileFollowUpSource).toContain("onMessageSubmitStarted?.()")
    expect(tileFollowUpSource).toContain("onMessageSubmitFailed?.()")
  })
})
