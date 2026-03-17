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

function findLatestResponseToggle(tree: any, previewText: string) {
  const toggle = findAll(
    tree,
    (value) => typeof value?.props?.onClick === "function"
      && typeof value?.props?.className === "string"
      && value.props.className.includes("bg-green-100/50")
      && getTextContent(value).includes(previewText),
  )[0]
  if (!toggle) throw new Error("Latest response toggle not found")
  return toggle
}

function findPastResponsesToggle(tree: any) {
  const toggle = findAll(tree, (value) => value?.type === "button" && getTextContent(value).includes("Past Responses"))[0]
  if (!toggle) throw new Error("Past responses toggle not found")
  return toggle
}

function findElementByTitle(tree: any, title: string) {
  const match = findAll(tree, (value) => value?.props?.title === title)[0]
  if (!match) throw new Error(`Element with title \"${title}\" not found`)
  return match
}

async function loadAgentProgress(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()
  const captured = { tileFollowUpInputProps: null as any }

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
  })

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
    LayoutGrid: icon("LayoutGrid"),
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
  vi.doMock("./tile-follow-up-input", () => ({
    TileFollowUpInput: (props: any) => {
      captured.tileFollowUpInputProps = props
      return { type: "TileFollowUpInput", props }
    },
  }))
  vi.doMock("./overlay-follow-up-input", () => ({ OverlayFollowUpInput: Null }))
  vi.doMock("@renderer/components/message-queue-panel", () => ({ MessageQueuePanel: Null }))
  vi.doMock("@renderer/hooks/use-resizable", () => ({
    TILE_DIMENSIONS: { height: { default: 360, min: 240, max: 720 } },
    useResizable: () => ({ height: 360, isResizing: false, handleHeightResizeStart: vi.fn() }),
  }))
  vi.doMock("@dotagents/shared", () => ({
    extractRespondToUserResponseEvents: () => [],
    getAgentConversationStateLabel: (state: string) => state,
    getToolResultsSummary: () => "",
    normalizeAgentConversationState: (state: string | null | undefined, fallback: string) => state ?? fallback,
  }))
  vi.doMock("./tool-execution-stats", () => ({ ToolExecutionStats: Null }))
  vi.doMock("./acp-session-badge", () => ({ ACPSessionBadge: Null }))
  vi.doMock("./agent-summary-view", () => ({ AgentSummaryView: Null }))
  vi.doMock("@renderer/lib/tts-tracking", () => ({ hasTTSPlayed: () => false, markTTSPlayed: vi.fn(), removeTTSKey: vi.fn() }))
  vi.doMock("@renderer/lib/tts-manager", () => ({ ttsManager: { stopAll: vi.fn(), registerAudio: () => () => {}, registerStopCallback: () => () => {}, playExclusive: vi.fn() } }))
  vi.doMock("@dotagents/shared/message-display-utils", () => ({ sanitizeMessageContentForSpeech: (text: string) => text }))
  vi.doMock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

  const mod = await import("./agent-progress")
  return { AgentProgress: mod.AgentProgress, captured }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("agent progress response history", () => {
  it("keeps the latest response collapsed by default, then reveals nested past responses when expanded", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-1",
      conversationId: "conversation-1",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: false,
      finalContent: "",
      conversationHistory: [],
      userResponse: "Final answer",
      userResponseHistory: ["Repeated draft", "Repeated draft"],
    }

    let tree = runtime.render(AgentProgress, { progress })
    let text = getTextContent(tree)

    expect(text).toContain("Final answer")
    expect(text).not.toContain("Past Responses")

    const latestResponseToggle = findLatestResponseToggle(tree, "Final answer")
    latestResponseToggle.props.onClick({ stopPropagation: vi.fn() })

    tree = runtime.render(AgentProgress, { progress })
    text = getTextContent(tree)

    expect(text).toContain("Past Responses")
    expect(countTextOccurrences(text, "Repeated draft")).toBe(0)
    const pastResponsesToggle = findPastResponsesToggle(tree)
    expect(pastResponsesToggle.props.title).toBe("Expand past responses")
    expect(pastResponsesToggle.props["aria-expanded"]).toBe(false)
  })

  it("lets the nested past responses section collapse and re-open independently", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-2",
      conversationId: "conversation-2",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: false,
      finalContent: "",
      conversationHistory: [],
      userResponse: "Final answer",
      userResponseHistory: ["Earlier draft", "Another draft"],
    }

    let tree = runtime.render(AgentProgress, { progress })
    const latestResponseToggle = findLatestResponseToggle(tree, "Final answer")

    latestResponseToggle.props.onClick({ stopPropagation: vi.fn() })
    tree = runtime.render(AgentProgress, { progress })

    let pastResponsesToggle = findPastResponsesToggle(tree)
    expect(pastResponsesToggle.props.title).toBe("Expand past responses")
    expect(pastResponsesToggle.props["aria-expanded"]).toBe(false)

    pastResponsesToggle.props.onClick()
    tree = runtime.render(AgentProgress, { progress })

    pastResponsesToggle = findPastResponsesToggle(tree)
    expect(pastResponsesToggle.props.title).toBe("Collapse past responses")
    expect(pastResponsesToggle.props["aria-expanded"]).toBe(true)

    pastResponsesToggle.props.onClick()
    tree = runtime.render(AgentProgress, { progress })

    pastResponsesToggle = findPastResponsesToggle(tree)
    expect(pastResponsesToggle.props.title).toBe("Expand past responses")
    expect(pastResponsesToggle.props["aria-expanded"]).toBe(false)
  })

  it("keeps duplicated archived responses visible as distinct entries when the section is open", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-3",
      conversationId: "conversation-3",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: false,
      finalContent: "",
      conversationHistory: [],
      userResponse: "Final answer",
      userResponseHistory: ["Repeated draft", "Repeated draft"],
    }

    let tree = runtime.render(AgentProgress, { progress })
    const latestResponseToggle = findLatestResponseToggle(tree, "Final answer")
    latestResponseToggle.props.onClick({ stopPropagation: vi.fn() })
    tree = runtime.render(AgentProgress, { progress })

    const pastResponsesToggle = findPastResponsesToggle(tree)
    pastResponsesToggle.props.onClick()
    tree = runtime.render(AgentProgress, { progress })

    const text = getTextContent(tree)
    expect(countTextOccurrences(text, "Repeated draft")).toBe(2)
  })

  it("collapses expanded agent responses after a tile follow-up is sent", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress, captured } = await loadAgentProgress(runtime)
    const onFollowUpSent = vi.fn()
    const progress = {
      sessionId: "session-4",
      conversationId: "conversation-4",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: false,
      finalContent: "",
      conversationHistory: [],
      userResponse: "Final answer",
      userResponseHistory: ["Earlier draft"],
    }

    let tree = runtime.render(AgentProgress, { progress, variant: "tile", onFollowUpSent })
    const latestResponseToggle = findLatestResponseToggle(tree, "Final answer")

    latestResponseToggle.props.onClick({ stopPropagation: vi.fn() })
    tree = runtime.render(AgentProgress, { progress, variant: "tile", onFollowUpSent })
    expect(getTextContent(tree)).toContain("Latest response")

    expect(typeof captured.tileFollowUpInputProps?.onMessageSent).toBe("function")
    captured.tileFollowUpInputProps.onMessageSent()

    tree = runtime.render(AgentProgress, { progress, variant: "tile", onFollowUpSent })
    expect(getTextContent(tree)).not.toContain("Latest response")
    expect(onFollowUpSent).toHaveBeenCalledTimes(1)
  })

  it("maximizes a running tile from pointer-down without waiting for click", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const onExpand = vi.fn()
    const progress = {
      sessionId: "session-5",
      conversationId: "conversation-5",
      currentIteration: 1,
      maxIterations: 2,
      steps: [],
      isComplete: false,
      finalContent: "",
      conversationHistory: [],
    }

    const tree = runtime.render(AgentProgress, { progress, variant: "tile", onExpand, isExpanded: false })
    const maximizeButton = findElementByTitle(tree, "Maximize tile")

    maximizeButton.props.onPointerDown({
      button: 0,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    })

    await Promise.resolve()
    await Promise.resolve()

    expect(onExpand).toHaveBeenCalledTimes(1)
  })

  it("exposes maximize for snoozed in-progress tiles without a separate restore button", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-5b",
      conversationId: "conversation-5b",
      currentIteration: 1,
      maxIterations: 2,
      steps: [],
      isComplete: false,
      isSnoozed: true,
      finalContent: "",
      conversationHistory: [],
    }

    const tree = runtime.render(AgentProgress, { progress, variant: "tile", onExpand: vi.fn(), isExpanded: false })
    expect(findElementByTitle(tree, "Maximize tile")).toBeTruthy()
    expect(findAll(tree, (value) => value?.props?.title === "Restore session")).toHaveLength(0)
  })

  it("shows a restore tile layout button when the tile is already maximized", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-5c",
      conversationId: "conversation-5c",
      currentIteration: 1,
      maxIterations: 2,
      steps: [],
      isComplete: false,
      finalContent: "",
      conversationHistory: [],
    }

    const tree = runtime.render(AgentProgress, { progress, variant: "tile", onExpand: vi.fn(), isExpanded: true })
    expect(findElementByTitle(tree, "Restore tile layout")).toBeTruthy()
  })

  it("maximizes the running latest-response bubble once per pointer interaction while preserving keyboard click support", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const onExpand = vi.fn()
    const progress = {
      sessionId: "session-6",
      conversationId: "conversation-6",
      currentIteration: 1,
      maxIterations: 2,
      steps: [],
      isComplete: false,
      finalContent: "",
      conversationHistory: [],
      userResponse: "Need your confirmation",
    }

    const tree = runtime.render(AgentProgress, { progress, variant: "tile", onExpand, isExpanded: false })
    const maximizeButton = findElementByTitle(tree, "Maximize")

    maximizeButton.props.onPointerDown({
      button: 0,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    })
    maximizeButton.props.onClick({
      detail: 1,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    })
    maximizeButton.props.onClick({
      detail: 0,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    })

    expect(onExpand).toHaveBeenCalledTimes(2)
  })

  it("clears the latest-response pointer-down maximize guard when the pointer interaction is canceled", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const onExpand = vi.fn()
    const progress = {
      sessionId: "session-7",
      conversationId: "conversation-7",
      currentIteration: 1,
      maxIterations: 2,
      steps: [],
      isComplete: false,
      finalContent: "",
      conversationHistory: [],
      userResponse: "Still waiting on you",
    }

    const tree = runtime.render(AgentProgress, { progress, variant: "tile", onExpand, isExpanded: false })
    const maximizeButton = findElementByTitle(tree, "Maximize")

    maximizeButton.props.onPointerDown({
      button: 0,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    })
    maximizeButton.props.onPointerCancel()
    maximizeButton.props.onClick({
      detail: 0,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    })

    expect(onExpand).toHaveBeenCalledTimes(2)
  })
})
