import { afterEach, describe, expect, it, vi } from "vitest"

type EffectRecord = {
  callback?: () => void | (() => void)
  cleanup?: void | (() => void)
  deps?: any[]
  nextDeps?: any[]
  hasRun: boolean
}

function createHookRuntime() {
  const states: any[] = []
  const refs: Array<{ current: any }> = []
  const effects: EffectRecord[] = []
  let stateIndex = 0
  let refIndex = 0
  let effectIndex = 0

  const depsChanged = (prev?: any[], next?: any[]) => !prev || !next || prev.length !== next.length || prev.some((value, index) => !Object.is(value, next[index]))
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
  const registerEffect = (callback: () => void | (() => void), deps?: any[]) => {
    const idx = effectIndex++
    const record = effects[idx] ?? { hasRun: false }
    record.callback = callback
    record.nextDeps = deps
    effects[idx] = record
  }

  const Fragment = Symbol.for("react.fragment")
  const assignRef = (ref: any, value: any) => {
    if (typeof ref === "function") ref(value)
    else if (ref && typeof ref === "object") ref.current = value
  }
  const createRefValue = (type: any) => type === "audio"
    ? { addEventListener: vi.fn(), removeEventListener: vi.fn(), pause: vi.fn(), currentTime: 0, src: "" }
    : { scrollTop: 0, scrollHeight: 100, clientHeight: 100 }
  const invoke = (type: any, props: any) => {
    if (type === Fragment) return props?.children ?? null
    if (typeof type === "function") return type(props ?? {})
    const normalizedProps = { ...(props ?? {}) }
    if (normalizedProps.ref) assignRef(normalizedProps.ref, createRefValue(type))
    return { type, props: normalizedProps }
  }

  const reactMock: any = {
    __esModule: true,
    default: {} as any,
    createContext: (defaultValue: any) => ({ Provider: ({ children }: any) => children, Consumer: ({ children }: any) => children(defaultValue), _currentValue: defaultValue }),
    useContext: (context: any) => context?._currentValue,
    useState,
    useRef,
    useEffect: registerEffect,
    useLayoutEffect: registerEffect,
    useCallback: <T extends (...args: any[]) => any>(callback: T) => callback,
    useMemo: <T,>(factory: () => T) => factory(),
    memo: (component: any) => component,
    forwardRef: (render: any) => (props: any) => render(props, null),
    Fragment,
  }
  reactMock.default = reactMock

  return {
    render<P,>(Component: (props: P) => any, props: P) {
      stateIndex = 0
      refIndex = 0
      effectIndex = 0
      return Component(props)
    },
    commitEffects() {
      for (const record of effects) {
        if (!record?.callback) continue
        const shouldRun = !record.hasRun || depsChanged(record.deps, record.nextDeps)
        if (!shouldRun) continue
        if (typeof record.cleanup === "function") record.cleanup()
        record.cleanup = record.callback()
        record.deps = record.nextDeps
        record.hasRun = true
      }
    },
    reactMock,
    jsxRuntimeMock: { __esModule: true, Fragment, jsx: invoke, jsxs: invoke, jsxDEV: invoke },
  }
}

function walkTree(node: any, visit: (value: any) => void) {
  if (node == null || node === false) return
  if (Array.isArray(node)) {
    node.forEach((child) => walkTree(child, visit))
    return
  }
  if (typeof node === "object" && "type" in node && "props" in node) {
    visit(node)
    walkTree(node.props?.children, visit)
    return
  }
  visit(node)
}

function findAll(node: any, predicate: (value: any) => boolean) {
  const matches: any[] = []
  walkTree(node, (value) => {
    if (predicate(value)) matches.push(value)
  })
  return matches
}

function getTextContent(node: any): string {
  const parts: string[] = []
  walkTree(node, (value) => {
    if (typeof value === "string" || typeof value === "number") parts.push(String(value))
  })
  return parts.join(" ").replace(/\s+/g, " ").trim()
}

function countTextOccurrences(text: string, needle: string) {
  return text.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))?.length ?? 0
}

function findResponseHistoryToggle(tree: any) {
  const toggle = findAll(tree, (value) => value?.type === "button" && getTextContent(value).includes("Agent Responses"))[0]
  if (!toggle) throw new Error("Response history toggle not found")
  return toggle
}

async function loadAgentProgress(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()

  const Null = () => null
  const icon = (name: string) => (props: any) => ({ type: name, props })
  const tipcMock = { tipcClient: new Proxy({ generateSpeech: vi.fn(), setPanelFocusable: vi.fn() }, { get: (target, key) => (target as any)[key] ?? vi.fn() }) }
  const queriesMock = { useConfigQuery: () => ({ data: { ttsEnabled: false, ttsAutoPlay: false, dualModelEnabled: false } }) }
  const themeContextMock = { useTheme: () => ({ isDark: false }) }
  const storesMock = {
    useAgentStore: (selector: any) => selector({ setFocusedSessionId: vi.fn(), setSessionSnoozed: vi.fn() }),
    useMessageQueue: () => [],
    useIsQueuePaused: () => false,
  }

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("../../../shared/builtin-tool-names", () => ({
    INTERNAL_COMPLETION_NUDGE_TEXT: "__complete__",
    RESPOND_TO_USER_TOOL: "respond_to_user",
    MARK_WORK_COMPLETE_TOOL: "mark_work_complete",
  }))
  vi.doMock("lucide-react", () => ({
    ChevronDown: icon("ChevronDown"),
    ChevronUp: icon("ChevronUp"),
    ChevronRight: icon("ChevronRight"),
    X: icon("X"),
    AlertTriangle: icon("AlertTriangle"),
    Minimize2: icon("Minimize2"),
    Shield: icon("Shield"),
    Check: icon("Check"),
    XCircle: icon("XCircle"),
    Loader2: icon("Loader2"),
    Clock: icon("Clock"),
    Copy: icon("Copy"),
    CheckCheck: icon("CheckCheck"),
    GripHorizontal: icon("GripHorizontal"),
    Activity: icon("Activity"),
    Moon: icon("Moon"),
    Maximize2: icon("Maximize2"),
    RefreshCw: icon("RefreshCw"),
    Bot: icon("Bot"),
    OctagonX: icon("OctagonX"),
    MessageSquare: icon("MessageSquare"),
    Brain: icon("Brain"),
    Volume2: icon("Volume2"),
    Wrench: icon("Wrench"),
  }))
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ") }))
  vi.doMock("@renderer/components/markdown-renderer", () => ({ MarkdownRenderer: ({ content }: any) => ({ type: "MarkdownRenderer", props: { content, children: content } }) }))
  vi.doMock("./ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
  vi.doMock("./ui/badge", () => ({ Badge: (props: any) => ({ type: "Badge", props }) }))
  vi.doMock("./ui/dialog", () => ({ Dialog: Null, DialogContent: Null, DialogDescription: Null, DialogHeader: Null, DialogTitle: Null }))
  vi.doMock("../lib/tipc-client", () => tipcMock)
  vi.doMock("@renderer/lib/tipc-client", () => tipcMock)
  vi.doMock("@renderer/lib/clipboard", () => ({ copyTextToClipboard: vi.fn() }))
  vi.doMock("../stores", () => storesMock)
  vi.doMock("@renderer/stores", () => storesMock)
  vi.doMock("@renderer/components/audio-player", () => ({ AudioPlayer: (props: any) => ({ type: "AudioPlayer", props }) }))
  vi.doMock("../lib/queries", () => queriesMock)
  vi.doMock("@renderer/lib/queries", () => queriesMock)
  vi.doMock("../contexts/theme-context", () => themeContextMock)
  vi.doMock("@renderer/contexts/theme-context", () => themeContextMock)
  vi.doMock("@renderer/lib/debug", () => ({ logUI: vi.fn(), logExpand: vi.fn() }))
  vi.doMock("./tile-follow-up-input", () => ({ TileFollowUpInput: Null }))
  vi.doMock("./overlay-follow-up-input", () => ({ OverlayFollowUpInput: Null }))
  vi.doMock("@renderer/components/message-queue-panel", () => ({ MessageQueuePanel: Null }))
  vi.doMock("@renderer/hooks/use-resizable", () => ({
    TILE_DIMENSIONS: { height: { default: 360, min: 240, max: 720 } },
    useResizable: () => ({ height: 360, isResizing: false, handleHeightResizeStart: vi.fn() }),
  }))
  vi.doMock("@dotagents/shared", () => ({ getToolResultsSummary: () => "" }))
  vi.doMock("./tool-execution-stats", () => ({ ToolExecutionStats: Null }))
  vi.doMock("./acp-session-badge", () => ({ ACPSessionBadge: Null }))
  vi.doMock("./agent-summary-view", () => ({ AgentSummaryView: Null }))
  vi.doMock("@renderer/lib/tts-tracking", () => ({ hasTTSPlayed: () => false, markTTSPlayed: vi.fn(), removeTTSKey: vi.fn() }))
  vi.doMock("@renderer/lib/tts-manager", () => ({ ttsManager: { stopAll: vi.fn(), registerAudio: () => () => {}, registerStopCallback: () => () => {}, playExclusive: vi.fn() } }))
  vi.doMock("@shared/message-display-utils", () => ({ sanitizeMessageContentForSpeech: (text: string) => text }))
  vi.doMock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

  const mod = await import("./agent-progress")
  return { AgentProgress: mod.AgentProgress }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("agent progress response history", () => {
  it("renders repeated past responses distinctly and lets the history panel collapse and re-open", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-1",
      conversationId: "conversation-1",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: true,
      finalContent: "done",
      conversationHistory: [],
      userResponse: "Final answer",
      userResponseHistory: ["Repeated draft", "Repeated draft"],
    }
    const props = { progress }

    let tree = runtime.render(AgentProgress, props)
    let text = getTextContent(tree)

    expect(text).toContain("Final answer")
    expect(text).toContain("Response 2")
    expect(text).toContain("Response 1")
    expect(countTextOccurrences(text, "Repeated draft")).toBe(2)

    let toggle = findResponseHistoryToggle(tree)
    expect(toggle.props.title).toBe("Full height")

    toggle.props.onClick()
    tree = runtime.render(AgentProgress, props)
    text = getTextContent(tree)
    toggle = findResponseHistoryToggle(tree)
    expect(toggle.props.title).toBe("Collapse")
    expect(countTextOccurrences(text, "Repeated draft")).toBe(2)

    toggle.props.onClick()
    tree = runtime.render(AgentProgress, props)
    text = getTextContent(tree)
    toggle = findResponseHistoryToggle(tree)
    expect(toggle.props.title).toBe("Expand")
    expect(text).not.toContain("Final answer")
    expect(text).not.toContain("Response 2")
    expect(countTextOccurrences(text, "Repeated draft")).toBe(0)

    toggle.props.onClick()
    tree = runtime.render(AgentProgress, props)
    text = getTextContent(tree)
    toggle = findResponseHistoryToggle(tree)
    expect(toggle.props.title).toBe("Full height")
    expect(countTextOccurrences(text, "Repeated draft")).toBe(2)
  })

  it("keeps response history visible when only past responses exist", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-2",
      conversationId: "conversation-2",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: true,
      finalContent: "done",
      conversationHistory: [],
      userResponseHistory: ["Older response", "Newest archived response"],
    }

    const tree = runtime.render(AgentProgress, { progress })
    const text = getTextContent(tree)

    expect(text).toContain("Agent Responses")
    expect(text).toContain("Response 2")
    expect(text).toContain("Newest archived response")
    expect(text).toContain("Response 1")
    expect(text).toContain("Older response")
  })
})