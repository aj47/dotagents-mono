import { readFileSync } from "node:fs"
import { afterEach, describe, expect, it, vi } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")
const acpSessionBadgeSource = readFileSync(new URL("./acp-session-badge.tsx", import.meta.url), "utf8")
const messageQueuePanelSource = readFileSync(new URL("./message-queue-panel.tsx", import.meta.url), "utf8")
const audioPlayerSource = readFileSync(new URL("./audio-player.tsx", import.meta.url), "utf8")
const sessionTileSource = readFileSync(new URL("./session-tile.tsx", import.meta.url), "utf8")

function createHookRuntime() {
  const states: any[] = []
  const refs: Array<{ current: any }> = []
  let stateIndex = 0
  let refIndex = 0

  const useState = <T,>(initial: T | (() => T)) => {
    const idx = stateIndex++
    if (states[idx] === undefined) states[idx] = typeof initial === "function" ? (initial as () => T)() : initial
    return [states[idx] as T, (update: T | ((prev: T) => T)) => {
      states[idx] = typeof update === "function" ? (update as (prev: T) => T)(states[idx]) : update
    }] as const
  }

  const useRef = <T,>(initial: T) => {
    const idx = refIndex++
    refs[idx] ??= { current: initial }
    return refs[idx] as { current: T }
  }

  const reactMock: any = {
    __esModule: true,
    createContext: (defaultValue: any) => ({ _currentValue: defaultValue ?? { isDark: false } }),
    useState,
    useRef,
    useContext: (context: { _currentValue: any }) => context?._currentValue,
    useEffect: () => undefined,
    useLayoutEffect: () => undefined,
    useMemo: (factory: () => unknown) => factory(),
    useCallback: (callback: (...args: any[]) => any) => callback,
    memo: (component: unknown) => component,
  }
  reactMock.default = reactMock

  const Fragment = Symbol.for("react.fragment")
  const invoke = (type: any, props: any) => {
    if (type === Fragment) return props?.children ?? null
    return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {} }
  }

  return {
    render<P,>(Component: (props: P) => any, props: P) {
      stateIndex = 0
      refIndex = 0
      return Component(props)
    },
    reactMock,
    jsxRuntimeMock: { __esModule: true, Fragment, jsx: invoke, jsxs: invoke, jsxDEV: invoke },
  }
}

function findNodes(node: any, predicate: (node: any) => boolean): any[] {
  if (node == null) return []
  if (Array.isArray(node)) return node.flatMap((child) => findNodes(child, predicate))
  if (typeof node === "object") {
    return [
      ...(predicate(node) ? [node] : []),
      ...findNodes(node.props?.children, predicate),
    ]
  }
  return []
}

function getButtonTitles(node: any) {
  return findNodes(node, (candidate) => candidate.type === "button")
    .map((button) => button.props?.title)
    .filter((title): title is string => typeof title === "string")
}

function createProgress(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: "session-1",
    conversationId: "conversation-1",
    currentIteration: 1,
    maxIterations: 10,
    steps: [],
    isComplete: true,
    finalContent: "Done",
    conversationTitle: "Duplicate maximize icons",
    conversationHistory: [
      { role: "user", content: "In a GitHub issue, there are still two maximize icons on the sessions tile in some cases.", timestamp: 1 },
    ],
    sessionStartIndex: 0,
    contextInfo: null,
    modelInfo: null,
    profileName: "Main Agent",
    acpSessionInfo: null,
    isSnoozed: false,
    ...overrides,
  }
}

async function loadAgentProgress(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()
  const Null = () => null
  const Icon = (props: any) => ({ type: "Icon", props })
  const useAgentStore = (selector: (state: any) => unknown) => selector({
    setFocusedSessionId: vi.fn(),
    setSessionSnoozed: vi.fn(),
  })
  useAgentStore.getState = () => ({ agentProgressById: new Map() })

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("zustand", () => ({
    create: (initializer: (set: (update: any) => void, get: () => any) => any) => {
      let state: any
      const get = () => state
      const set = (update: any) => {
        const next = typeof update === "function" ? update(state) : update
        state = { ...state, ...next }
      }
      state = initializer(set, get)
      const store = (selector?: (value: any) => any) => selector ? selector(state) : state
      store.getState = get
      store.setState = set
      return store
    },
  }))
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    electron: {
      ipcRenderer: {
        invoke: vi.fn(),
        on: vi.fn(),
        send: vi.fn(),
      },
    },
  })
  vi.doMock("@egoist/tipc/renderer", () => ({
    createClient: () => ({}),
    createEventHandlers: () => ({}),
  }))
  vi.doMock("../../../shared/types", () => ({}))
  vi.doMock("../../../shared/builtin-tool-names", () => ({
    INTERNAL_COMPLETION_NUDGE_TEXT: "INTERNAL_COMPLETION_NUDGE_TEXT",
    RESPOND_TO_USER_TOOL: "respond_to_user",
    MARK_WORK_COMPLETE_TOOL: "mark_work_complete",
  }))
  vi.doMock("lucide-react", () => ({
    ChevronDown: Icon,
    ChevronUp: Icon,
    ChevronRight: Icon,
    X: Icon,
    AlertTriangle: Icon,
    Minimize2: Icon,
    Shield: Icon,
    Check: Icon,
    XCircle: Icon,
    Loader2: Icon,
    Clock: Icon,
    Copy: Icon,
    CheckCheck: Icon,
    GripHorizontal: Icon,
    Activity: Icon,
    Moon: Icon,
    Maximize2: Icon,
    RefreshCw: Icon,
    Bot: Icon,
    OctagonX: Icon,
    MessageSquare: Icon,
    Brain: Icon,
    Volume2: Icon,
    Wrench: Icon,
  }))
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ") }))
  vi.doMock("@renderer/components/markdown-renderer", () => ({ MarkdownRenderer: Null }))
  vi.doMock("./ui/button", () => ({ Button: (props: any) => ({ type: "button", props }) }))
  vi.doMock("./ui/badge", () => ({ Badge: (props: any) => ({ type: "Badge", props }) }))
  vi.doMock("./ui/dialog", () => ({ Dialog: Null, DialogContent: Null, DialogDescription: Null, DialogHeader: Null, DialogTitle: Null }))
  vi.doMock("@renderer/lib/tipc-client", () => ({
    tipcClient: {
      stopAgentSession: vi.fn(),
      emergencyStopAgent: vi.fn(),
      snoozeAgentSession: vi.fn(),
      hidePanelWindow: vi.fn(),
      clearAgentSessionProgress: vi.fn(),
      closeAgentModeAndHidePanelWindow: vi.fn(),
      respondToToolApproval: vi.fn(),
      unsnoozeAgentSession: vi.fn(),
      focusAgentSession: vi.fn(),
      setPanelFocusable: vi.fn(),
    },
  }))
  vi.doMock("@renderer/lib/clipboard", () => ({ copyTextToClipboard: vi.fn() }))
  vi.doMock("@renderer/stores", () => ({
    __esModule: true,
    useAgentStore,
    useMessageQueue: () => [],
    useIsQueuePaused: () => false,
  }))
  vi.doMock("@renderer/components/audio-player", () => ({ AudioPlayer: Null }))
  vi.doMock("@renderer/lib/queries", () => ({ useConfigQuery: () => ({ data: { ttsEnabled: false } }) }))
  vi.doMock("@renderer/contexts/theme-context", () => ({ useTheme: () => ({ isDark: false }) }))
  vi.doMock("@renderer/lib/debug", () => ({ logUI: vi.fn(), logExpand: vi.fn() }))
  vi.doMock("./tile-follow-up-input", () => ({ TileFollowUpInput: Null }))
  vi.doMock("./overlay-follow-up-input", () => ({ OverlayFollowUpInput: Null }))
  vi.doMock("@renderer/components/message-queue-panel", () => ({ MessageQueuePanel: Null }))
  vi.doMock("@renderer/hooks/use-resizable", () => ({
    useResizable: () => ({ height: 320, isResizing: false, handleHeightResizeStart: vi.fn() }),
    TILE_DIMENSIONS: { height: { default: 320, min: 160, max: 640 } },
  }))
  vi.doMock("@dotagents/shared", () => ({ getToolResultsSummary: () => "" }))
  vi.doMock("./tool-execution-stats", () => ({ ToolExecutionStats: Null }))
  vi.doMock("./acp-session-badge", () => ({ ACPSessionBadge: Null }))
  vi.doMock("./agent-summary-view", () => ({ AgentSummaryView: Null }))
  vi.doMock("@renderer/lib/tts-tracking", () => ({ hasTTSPlayed: () => false, markTTSPlayed: vi.fn(), removeTTSKey: vi.fn(), clearSessionTTSTracking: vi.fn() }))
  vi.doMock("@renderer/lib/tts-manager", () => ({ ttsManager: { stop: vi.fn() } }))
  vi.doMock("@shared/message-display-utils", () => ({ sanitizeMessageContentForSpeech: (content: string) => content }))
  vi.doMock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

  return import("./agent-progress")
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe("agent progress tile layout", () => {
  it("wraps the tile header chrome for narrow session widths and zoomed text", () => {
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-start gap-2 px-3 py-2 border-b bg-muted/30 flex-shrink-0 cursor-pointer"'
    )
    expect(agentProgressSource).toContain('className="flex min-w-0 flex-1 items-start gap-2"')
    expect(agentProgressSource).toContain('className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1"')
  })

  it("wraps the tile footer metadata row and preserves trailing status visibility", () => {
    expect(agentProgressSource).toContain('className="flex flex-wrap items-center justify-between gap-2"')
    expect(agentProgressSource).toContain('className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1"')
    expect(agentProgressSource).toContain('<ACPSessionBadge info={acpSessionInfo} className="min-w-0 max-w-full" />')
    expect(agentProgressSource).toContain('className="shrink-0 whitespace-nowrap">Step')
  })

  it("lets the tile chat-summary switcher and delegation preview adapt to narrow widths", () => {
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-1 border-b border-border/30 bg-muted/5 px-2.5 py-1.5"'
    )
    expect(agentProgressSource).toContain(
      '"inline-flex min-w-0 max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"'
    )
    expect(agentProgressSource).toContain('<span className="truncate">Summary</span>')
    expect(agentProgressSource).toContain(
      '"flex flex-wrap items-center gap-2 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/50 transition-colors"'
    )
    expect(agentProgressSource).toContain('alwaysOpen ? "cursor-default" : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"')
    expect(agentProgressSource).toContain('className="min-w-0 flex flex-1 items-center gap-2"')
    expect(agentProgressSource).toContain(
      'className="min-w-0 flex-1 truncate text-[11px] font-medium text-gray-600 dark:text-gray-400"'
    )
  })

  it("surfaces latest delegated activity and a richer live details dialog from the tile chat area", () => {
    expect(agentProgressSource).toContain('Latest delegated activity')
    expect(agentProgressSource).toContain('Open details')
    expect(agentProgressSource).toContain('<DelegationSummaryStrip')
    expect(agentProgressSource).toContain('<DelegationDetailsDialog')
    expect(agentProgressSource).toContain('alwaysOpen')
    expect(agentProgressSource).toContain('defaultShowAll')
  })

  it("caps ACP session badges to the available tile width and truncates long labels", () => {
    expect(acpSessionBadgeSource).toContain(
      '"inline-flex max-w-full min-w-0 flex-wrap items-center gap-1.5 cursor-help"'
    )
    expect(acpSessionBadgeSource).toContain("function getConfigOptionLabel")
    expect(acpSessionBadgeSource).toContain("Array.isArray(option.options)")
    expect(acpSessionBadgeSource).toContain(
      'className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-medium"'
    )
    expect(acpSessionBadgeSource).toContain(
      'className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-mono"'
    )
    expect(acpSessionBadgeSource).toContain('className="truncate"')
  })

  it("keeps tile message-stream tool execution rows readable at narrow widths and zoom", () => {
    expect(agentProgressSource).toContain(
      '"flex min-w-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] cursor-pointer hover:bg-muted/30"'
    )
    expect(agentProgressSource).toContain(
      '"flex min-w-0 items-center gap-1.5 rounded px-1 py-0.5 text-[11px] cursor-pointer hover:bg-muted/30"'
    )
    expect(agentProgressSource).toContain('className="min-w-0 shrink truncate font-mono font-medium"')
    expect(agentProgressSource).toContain('className="min-w-0 flex-1 truncate text-[10px] font-mono opacity-50"')
    expect(agentProgressSource).toContain('className="mb-1 flex flex-wrap items-center gap-2"')
    expect(agentProgressSource).toContain('className="ml-auto flex shrink-0 flex-wrap items-center gap-2"')
    expect(agentProgressSource).toContain('className="shrink-0 whitespace-nowrap opacity-50 text-[10px]"')
  })

  it("wraps expanded tool detail chrome and caps tool output blocks inside narrow tiles", () => {
    expect(agentProgressSource).toContain(
      'className="mb-1 ml-3 mt-0.5 space-y-1 border-l border-border/50 pl-2 text-[10px]"'
    )
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center justify-between gap-1.5"'
    )
    expect(agentProgressSource).toContain(
      'className="mt-1 ml-3 space-y-1 border-l border-border/50 pl-2"'
    )
    expect(agentProgressSource).toContain(
      'overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full max-h-32 scrollbar-thin text-[10px]'
    )
  })

  it("shows only the restore control when a tile is already snoozed", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)

    const activeTile = runtime.render(AgentProgress, {
      progress: createProgress(),
      variant: "tile",
      isFocused: false,
      isExpanded: false,
      isCollapsed: true,
      onFocus: vi.fn(),
      onDismiss: vi.fn(),
      onExpand: vi.fn(),
      onCollapsedChange: vi.fn(),
    } as any)
    expect(getButtonTitles(activeTile)).toContain("Maximize tile")
    expect(getButtonTitles(activeTile)).not.toContain("Restore session")

    const snoozedTile = runtime.render(AgentProgress, {
      progress: createProgress({ isSnoozed: true }),
      variant: "tile",
      isFocused: false,
      isExpanded: false,
      isCollapsed: true,
      onFocus: vi.fn(),
      onDismiss: vi.fn(),
      onExpand: vi.fn(),
      onCollapsedChange: vi.fn(),
    } as any)
    expect(getButtonTitles(snoozedTile)).toContain("Restore session")
    expect(getButtonTitles(snoozedTile)).not.toContain("Maximize tile")
  })

  it("keeps inline tool approval cards readable in narrow tiles and under zoom", () => {
    expect(agentProgressSource).toContain(
      'className="min-w-0 max-w-full overflow-hidden rounded-lg border border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30"'
    )
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30"'
    )
    expect(agentProgressSource).toContain('className="mb-2 flex flex-wrap items-center gap-2"')
    expect(agentProgressSource).toContain(
      'className="max-w-full min-w-0 truncate rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono font-medium text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"'
    )
    expect(agentProgressSource).toContain(
      'className="mb-2 rounded-md border border-amber-200/70 bg-amber-100/40 px-2 py-1.5 text-[11px] font-mono leading-relaxed text-amber-700/80 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300/80 line-clamp-2 break-words [overflow-wrap:anywhere]"'
    )
    expect(agentProgressSource).toContain('className="space-y-1.5"')
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-1.5 text-[10px] text-amber-700/80 dark:text-amber-300/80"'
    )
  })

  it("keeps mid-turn response cards and past-response history readable in narrow tiles", () => {
    expect(agentProgressSource).toContain(
      'className="min-w-0 max-w-full overflow-hidden rounded-lg border-2 border-green-400 bg-green-50/50 dark:bg-green-950/30"'
    )
    expect(agentProgressSource).toContain(
      '"flex min-w-0 flex-wrap items-start gap-2 cursor-pointer bg-green-100/50 px-3 py-2 transition-colors hover:bg-green-100/70 dark:bg-green-900/30 dark:hover:bg-green-900/40"'
    )
    expect(agentProgressSource).toContain(
      '<MessageSquare className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />'
    )
    expect(agentProgressSource).toContain('className="min-w-0 flex-1 space-y-1 text-left"')
    expect(agentProgressSource).toContain(
      '"line-clamp-2 break-words [overflow-wrap:anywhere]"'
    )
    expect(agentProgressSource).toContain('className={cn("min-w-0 px-3", isExpanded ? "pb-2" : "hidden")}')
    expect(agentProgressSource).toContain(
      'className="mt-1 rounded-md bg-red-50 p-2 text-xs text-red-700 break-words [overflow-wrap:anywhere] dark:bg-red-900/20 dark:text-red-300"'
    )
    expect(agentProgressSource).toContain('className="mb-1.5 flex flex-wrap items-center gap-1.5"')
    expect(agentProgressSource).toContain(
      'className="min-w-0 max-w-full overflow-hidden rounded-md border border-green-200/60 dark:border-green-800/40"'
    )
    expect(agentProgressSource).toContain(
      'className="flex min-w-0 items-start gap-2 cursor-pointer px-2.5 py-1.5 transition-colors hover:bg-green-50/50 dark:hover:bg-green-900/20"'
    )
    expect(agentProgressSource).toContain(
      'className="min-w-0 flex-1 text-xs text-green-700/70 dark:text-green-300/60 line-clamp-2 break-words [overflow-wrap:anywhere]"'
    )
  })

  it("uses a lightweight plain-text path for active streaming bubbles before final markdown rendering", () => {
    expect(agentProgressSource).toContain('const contentNode = streamingContent.isStreaming')
    expect(agentProgressSource).toContain('className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]"')
    expect(agentProgressSource).toContain(': <MarkdownRenderer content={streamingContent.text} />')
  })

  it("wraps retry banners and queue chrome safely in narrow tile footers", () => {
    expect(agentProgressSource).toContain(
      'className="min-w-0 max-w-full overflow-hidden rounded-lg border border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30"'
    )
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30"'
    )
    expect(agentProgressSource).toContain('className="min-w-0 px-3 py-2"')
    expect(agentProgressSource).toContain('className="flex flex-wrap items-center gap-2"')
    expect(messageQueuePanelSource).toContain(
      '"flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-xs"'
    )
    expect(messageQueuePanelSource).toContain(
      '"min-w-0 flex-1"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="ml-auto flex shrink-0 items-center gap-1"'
    )
    expect(messageQueuePanelSource).toContain(
      '"flex flex-wrap items-start justify-between gap-2 px-3 py-2"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="flex min-w-0 flex-1 items-center gap-2"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="border-b border-orange-200 bg-orange-100/30 px-3 py-2 text-xs text-orange-700 break-words dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="flex min-w-0 items-start gap-2"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="flex min-w-0 flex-1 flex-col"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="mt-2 flex w-full flex-wrap items-center gap-1.5"'
    )
    expect(messageQueuePanelSource).not.toContain(
      '"ml-auto flex shrink-0 flex-wrap items-center gap-1 self-start transition-opacity"'
    )
  })

  it("keeps shared audio player and compact TTS errors readable under width pressure", () => {
    expect(audioPlayerSource).toContain('const compactStatusText = hasAudio')
    expect(audioPlayerSource).toContain(
      '"flex min-w-0 max-w-full flex-wrap items-start gap-2 rounded-md bg-muted/40 px-2 py-1.5"'
    )
    expect(audioPlayerSource).toContain('className="h-8 w-8 shrink-0 p-0"')
    expect(audioPlayerSource).toContain(
      'className={cn("min-w-0 max-w-full space-y-2 rounded-lg bg-muted/50 p-3", className)}'
    )
    expect(audioPlayerSource).toContain('className="flex flex-wrap items-center gap-3"')
    expect(audioPlayerSource).toContain('className="min-w-0 flex-1 space-y-1"')
    expect(audioPlayerSource).toContain('className="ml-auto flex min-w-0 max-w-full items-center gap-2"')
    expect(audioPlayerSource).toContain('aria-label="Audio position"')
    expect(audioPlayerSource).toContain('aria-label="Audio volume"')
    expect(agentProgressSource).toContain('className="mt-2 min-w-0 space-y-1"')
    expect(agentProgressSource).toContain(
      'className="rounded-md bg-red-50 p-2 text-xs text-red-700 break-words [overflow-wrap:anywhere] dark:bg-red-900/20 dark:text-red-300"'
    )
    expect(sessionTileSource).toContain('className="mt-2 min-w-0 space-y-1"')
    expect(sessionTileSource).toContain(
      'className="rounded-md bg-red-50 p-2 text-xs text-red-700 break-words [overflow-wrap:anywhere] dark:bg-red-900/20 dark:text-red-300"'
    )
  })
})
