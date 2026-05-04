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
  const audioRefs: any[] = []
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
  const createRefValue = (type: any) => {
    if (type === "audio") {
      const listeners = new Map<string, Set<(...args: any[]) => void>>()
      const audioRef = {
        addEventListener: vi.fn((event: string, handler: (...args: any[]) => void) => {
          const set = listeners.get(event) ?? new Set<(...args: any[]) => void>()
          set.add(handler)
          listeners.set(event, set)
        }),
        removeEventListener: vi.fn((event: string, handler: (...args: any[]) => void) => {
          listeners.get(event)?.delete(handler)
        }),
        dispatchEvent(event: string) {
          listeners.get(event)?.forEach((handler) => handler())
        },
        pause: vi.fn(),
        currentTime: 0,
        src: "",
      }
      audioRefs.push(audioRef)
      return audioRef
    }

    return { scrollTop: 0, scrollHeight: 100, clientHeight: 100, scrollIntoView: vi.fn() }
  }
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
    useId: () => "test-id",
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
    audioRefs,
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

function findToolRow(tree: any, toolName: string) {
  const match = findAll(
    tree,
    (value) => value?.type === "div"
      && typeof value?.props?.className === "string"
      && value.props.className.includes("text-[11px]")
      && value.props.className.includes("cursor-pointer")
      && getTextContent(value).includes(toolName),
  )[0]
  if (!match) throw new Error(`Tool row for \"${toolName}\" not found`)
  return match
}

async function loadAgentProgress(
  runtime: ReturnType<typeof createHookRuntime>,
  options?: { ttsEnabled?: boolean; ttsAutoPlay?: boolean },
) {
  vi.resetModules()
  const captured = { tileFollowUpInputProps: null as any }

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
  })
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      callback(0)
      return 0
    },
  })
  Object.defineProperty(globalThis, "cancelAnimationFrame", {
    configurable: true,
    value: vi.fn(),
  })

  const Null = () => null
  const icon = (name: string) => (props: any) => ({ type: name, props })
  const tipcMock = { tipcClient: new Proxy({ generateSpeech: vi.fn(), setPanelFocusable: vi.fn() }, { get: (target, key) => (target as any)[key] ?? vi.fn() }) }
  const queriesMock = {
    useConfigQuery: () => ({ data: { ttsEnabled: options?.ttsEnabled ?? false, ttsAutoPlay: options?.ttsAutoPlay ?? false, dualModelEnabled: false } }),
    useAvailableModelsQuery: () => ({ data: [{ id: "gpt-4.1-mini", name: "GPT 4.1 Mini" }], isLoading: false }),
    queryClient: { invalidateQueries: vi.fn(async () => undefined) },
  }
  const themeContextMock = { useTheme: () => ({ isDark: false }) }
  const ttsManagerMock = {
    ttsManager: {
      stopAll: vi.fn(),
      registerAudio: () => () => {},
      registerStopCallback: () => () => {},
      playExclusive: vi.fn(async (audio: any) => {
        audio.dispatchEvent?.("play")
      }),
    },
  }
  const storesMock = {
    useAgentStore: (selector: any) => selector({
      pinnedSessionIds: new Set<string>(),
      togglePinSession: vi.fn(),
      setFocusedSessionId: vi.fn(),
      setSessionSnoozed: vi.fn(),
    }),
    useMessageQueue: () => [],
    useIsQueuePaused: () => false,
  }

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("../../../shared/runtime-tool-names", () => ({
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
    Play: icon("Play"),
    Pause: icon("Pause"),
    Pin: icon("Pin"),
  }))
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ") }))
  vi.doMock("@renderer/components/markdown-renderer", () => ({ MarkdownRenderer: ({ content }: any) => ({ type: "MarkdownRenderer", props: { content, children: content } }) }))
  vi.doMock("./ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
  vi.doMock("./ui/badge", () => ({ Badge: (props: any) => ({ type: "Badge", props }) }))
  vi.doMock("./ui/dialog", () => ({ Dialog: Null, DialogContent: Null, DialogDescription: Null, DialogHeader: Null, DialogTitle: Null }))
  vi.doMock("./ui/select", () => ({ Select: (props: any) => ({ type: "Select", props }), SelectContent: (props: any) => ({ type: "SelectContent", props }), SelectItem: (props: any) => ({ type: "SelectItem", props }), SelectTrigger: (props: any) => ({ type: "SelectTrigger", props }), SelectValue: (props: any) => ({ type: "SelectValue", props }) }))
  vi.doMock("../lib/tipc-client", () => tipcMock)
  vi.doMock("@renderer/lib/tipc-client", () => tipcMock)
  vi.doMock("@renderer/lib/clipboard", () => ({ copyTextToClipboard: vi.fn() }))
  vi.doMock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
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
    getToolActivitySummaryLine: () => "",
    normalizeAgentConversationState: (state: string | null | undefined, fallback: string) => state ?? fallback,
    getBuiltInModelPresets: () => [{ id: "default", name: "OpenAI", baseUrl: "https://api.openai.com/v1", agentModel: "gpt-4.1-mini", isBuiltIn: true }],
    DEFAULT_MODEL_PRESET_ID: "default",
    TOOL_GROUP_PREVIEW_COUNT: 3,
    TOOL_GROUP_MIN_SIZE: 2,
  }))
  vi.doMock("./tool-execution-stats", () => ({ ToolExecutionStats: Null }))
  vi.doMock("./acp-session-badge", () => ({ ACPSessionBadge: Null }))
  vi.doMock("./agent-summary-view", () => ({ AgentSummaryView: Null }))
  vi.doMock("@renderer/lib/tts-tracking", () => ({
    hasTTSPlayed: () => false,
    markTTSPlayed: vi.fn(),
    removeTTSKey: vi.fn(),
    buildResponseEventTTSKey: vi.fn(() => null),
    buildContentTTSKey: vi.fn(() => null),
  }))
  vi.doMock("@renderer/lib/tts-manager", () => ttsManagerMock)
  vi.doMock("@dotagents/shared/message-display-utils", () => ({
    sanitizeMessageContentForDisplay: (text: string) => text.replace(/!\[([^\]]*)\]\(data:image\/[^)]+\)/gi, (_match: string, alt: string) => `[Image: ${alt}]`),
    sanitizeMessageContentForSpeech: (text: string) => text,
  }))
  vi.doMock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

  const mod = await import("./agent-progress")
  return { AgentProgress: mod.AgentProgress, captured, tipcMock, ttsManagerMock, audioRefs: runtime.audioRefs }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("agent progress response history", () => {
  it("shows a compact live thinking placeholder when an active turn has no stream text yet", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-live-placeholder",
      conversationId: "conversation-live-placeholder",
      currentIteration: 1,
      maxIterations: 10,
      steps: [],
      isComplete: false,
      finalContent: "",
      conversationHistory: [
        { role: "user", content: "Do the next thing", timestamp: 100 },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress, variant: "tile" })
    const text = getTextContent(tree)

    expect(text).toContain("Thinking...")
    expect(text).not.toContain("Generating response...")
  })

  it("keeps the completed streamed response visible while verification is running", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-verifying-stream",
      conversationId: "conversation-verifying-stream",
      currentIteration: 1,
      maxIterations: 2,
      steps: [
        {
          id: "verify-1",
          type: "thinking",
          title: "Verifying completion",
          status: "in_progress",
          timestamp: 200,
        },
      ],
      isComplete: false,
      finalContent: "",
      conversationHistory: [
        { role: "user", content: "Question", timestamp: 100 },
      ],
      streamingContent: {
        text: "Streamed answer awaiting verification",
        isStreaming: false,
      },
    }

    const tree = runtime.render(AgentProgress, { progress })
    const text = getTextContent(tree)

    expect(text).toContain("Streamed answer awaiting verification")
    expect(text).toContain("Response")
  })

  it("keeps unresolved mid-turn responses in chronological order within the conversation", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-mid-order",
      conversationId: "conversation-mid-order",
      currentIteration: 1,
      maxIterations: 2,
      steps: [],
      isComplete: false,
      finalContent: "",
      responseEvents: [
        {
          id: "resp-1",
          sessionId: "session-mid-order",
          ordinal: 1,
          text: "Mid-turn answer",
          timestamp: 200,
        },
      ],
      conversationHistory: [
        { role: "assistant", content: "Before response", timestamp: 100 },
        { role: "assistant", content: "After response", timestamp: 300 },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress })
    const text = getTextContent(tree)

    expect(text.indexOf("Before response")).toBeGreaterThanOrEqual(0)
    expect(text.indexOf("Mid-turn answer")).toBeGreaterThan(text.indexOf("Before response"))
    expect(text.indexOf("After response")).toBeGreaterThan(text.indexOf("Mid-turn answer"))
  })

  it("does not double-render the final response when it already exists as an assistant message", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-final-dedupe",
      conversationId: "conversation-final-dedupe",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: true,
      finalContent: "",
      responseEvents: [
        {
          id: "resp-final",
          sessionId: "session-final-dedupe",
          ordinal: 1,
          text: "Final answer",
          timestamp: 200,
        },
      ],
      conversationHistory: [
        { role: "assistant", content: "Final answer", timestamp: 300 },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress })
    const text = getTextContent(tree)

    expect(countTextOccurrences(text, "Final answer")).toBe(1)
  })

  it("does not double-render the final response when completion timestamps arrive out of order", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-final-dedupe-out-of-order",
      conversationId: "conversation-final-dedupe-out-of-order",
      currentIteration: 2,
      maxIterations: 2,
      steps: [],
      isComplete: true,
      finalContent: "Final answer",
      responseEvents: [
        {
          id: "resp-final-out-of-order",
          sessionId: "session-final-dedupe-out-of-order",
          ordinal: 1,
          text: "Final answer",
          timestamp: 300,
        },
      ],
      conversationHistory: [
        { role: "assistant", content: "Final answer", timestamp: 200 },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress })
    const text = getTextContent(tree)

    expect(countTextOccurrences(text, "Final answer")).toBe(1)
  })

  it("renders a repeated final answer when the duplicate appears earlier in history but not as the latest assistant message", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-final-repeat",
      conversationId: "conversation-final-repeat",
      currentIteration: 2,
      maxIterations: 2,
      steps: [],
      isComplete: true,
      finalContent: "Done",
      conversationHistory: [
        { role: "user", content: "First request", timestamp: 90 },
        { role: "assistant", content: "Done", timestamp: 100 },
        { role: "user", content: "Do it again", timestamp: 200 },
        { role: "assistant", content: "On it", timestamp: 210 },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress })
    const text = getTextContent(tree)

    expect(countTextOccurrences(text, "Done")).toBe(1)
    expect(text).toContain("On it")
  })

  it("does not synthesize a duplicate final response when only whitespace differs", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-final-dedupe-whitespace",
      conversationId: "conversation-final-dedupe-whitespace",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: true,
      finalContent: "Final answer",
      responseEvents: [
        {
          id: "resp-final-whitespace",
          sessionId: "session-final-dedupe-whitespace",
          ordinal: 1,
          text: "Final answer",
          timestamp: 200,
        },
      ],
      conversationHistory: [
        { role: "assistant", content: "Final\n\nanswer ", timestamp: 200 },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress })
    const text = getTextContent(tree)

    expect(countTextOccurrences(text, "Final answer")).toBe(1)
  })

  it("shows completion-tool responses as plain text without respond_to_user or mark_work_complete rows", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-control-tools-hidden",
      conversationId: "conversation-control-tools-hidden",
      currentIteration: 1,
      maxIterations: 2,
      steps: [],
      isComplete: false,
      finalContent: "",
      responseEvents: [
        {
          id: "resp-control",
          sessionId: "session-control-tools-hidden",
          ordinal: 1,
          text: "Need your approval",
          timestamp: 100,
        },
      ],
      conversationHistory: [
        {
          role: "assistant",
          content: "",
          timestamp: 90,
          toolCalls: [
            { name: "respond_to_user", arguments: { message: "Need your approval" } },
            { name: "mark_work_complete", arguments: {} },
          ],
        },
        {
          role: "tool",
          content: "",
          timestamp: 95,
          toolResults: [
            { success: true, content: "ok" },
            { success: true, content: "ok" },
          ],
        },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress })
    const text = getTextContent(tree)

    expect(text).toContain("Need your approval")
    expect(text).not.toContain("respond_to_user")
    expect(text).not.toContain("mark_work_complete")
  })

  it("renders display-only thinking blocks from progress history without replacing stored content", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-thinking-display-content",
      conversationId: "conversation-thinking-display-content",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: true,
      finalContent: "",
      conversationHistory: [
        {
          role: "assistant",
          content: "Stored final answer",
          displayContent: "<think>\nCodex reasoning summary\n</think>\n\nDisplayed final answer",
          timestamp: 100,
        },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress })
    const text = getTextContent(tree)

    expect(text).toContain("Thinking")
    expect(text).toContain("Displayed final answer")
    expect(text).not.toContain("Stored final answer")
  })

  it("renders tool-call turns as a single-line tool summary distinct from the user-facing response", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-tool-processing-labels",
      conversationId: "conversation-tool-processing-labels",
      currentIteration: 1,
      maxIterations: 2,
      steps: [],
      isComplete: true,
      finalContent: "",
      conversationHistory: [
        { role: "user", content: "Figure this out", timestamp: 100 },
        {
          role: "assistant",
          content: "Need to inspect a few files first",
          timestamp: 200,
          toolCalls: [
            { name: "search_repo", arguments: { query: "session view" } },
          ],
        },
        {
          role: "tool",
          content: "",
          timestamp: 210,
          toolResults: [
            { success: true, content: "match" },
          ],
        },
        { role: "assistant", content: "Found the issue", timestamp: 300 },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress })
    const text = getTextContent(tree)

    expect(text).not.toContain("Processing with tools")
    expect(text).not.toContain("Thinking first")
    expect(text).not.toContain("Tool activity")
    expect(text).toContain("search_repo")
    expect(text).not.toContain("1 tool")
    expect(text.indexOf("search_repo")).toBeLessThan(text.indexOf("Found the issue"))
  })

  it("renders a single-line summary for collapsed groups of multiple tool steps", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-grouped-tool-processing",
      conversationId: "conversation-grouped-tool-processing",
      currentIteration: 1,
      maxIterations: 3,
      steps: [],
      isComplete: true,
      finalContent: "",
      conversationHistory: [
        {
          role: "assistant",
          content: "First tool thought",
          timestamp: 100,
          toolCalls: [
            { name: "search_repo", arguments: { query: "thinking blocks" } },
          ],
        },
        {
          role: "tool",
          content: "",
          timestamp: 110,
          toolResults: [
            { success: true, content: "first result" },
          ],
        },
        {
          role: "assistant",
          content: "Second tool thought",
          timestamp: 120,
          toolCalls: [
            { name: "open_file", arguments: { path: "agent-progress.tsx" } },
          ],
        },
        {
          role: "tool",
          content: "",
          timestamp: 130,
          toolResults: [
            { success: true, content: "second result" },
          ],
        },
        { role: "assistant", content: "Now here is the answer", timestamp: 200 },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress })
    const text = getTextContent(tree)

    expect(text).not.toContain("Processing with tools")
    expect(text).not.toContain("Includes thinking")
    expect(text).not.toMatch(/2 step(?:\s*s)?/)
    expect(text).not.toContain("First tool thought")
    expect(text).not.toContain("Second tool thought")
    expect(text).toContain("search_repo")
    expect(text.indexOf("search_repo")).toBeLessThan(text.indexOf("Now here is the answer"))
  })

  it("lets expanded tool groups collapse from the bottom", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-bottom-collapse-tool-group",
      conversationId: "conversation-bottom-collapse-tool-group",
      currentIteration: 1,
      maxIterations: 3,
      steps: [],
      isComplete: true,
      finalContent: "",
      conversationHistory: [
        {
          role: "assistant",
          content: "First tool thought",
          timestamp: 100,
          toolCalls: [
            { name: "search_repo", arguments: { query: "tool group collapse" } },
          ],
        },
        {
          role: "tool",
          content: "",
          timestamp: 110,
          toolResults: [
            { success: true, content: "first result" },
          ],
        },
        {
          role: "assistant",
          content: "Second tool thought",
          timestamp: 120,
          toolCalls: [
            { name: "open_file", arguments: { path: "agent-progress.tsx" } },
          ],
        },
        {
          role: "tool",
          content: "",
          timestamp: 130,
          toolResults: [
            { success: true, content: "second result" },
          ],
        },
      ],
    }

    let tree = runtime.render(AgentProgress, { progress })
    const expandButton = findAll(
      tree,
      (value) => value?.type === "button" && value.props?.["aria-label"] === "Expand tool group",
    )[0]
    expect(expandButton).toBeTruthy()

    expandButton.props.onClick({ stopPropagation: vi.fn() })
    tree = runtime.render(AgentProgress, { progress })

    expect(getTextContent(tree)).toContain("First tool thought")
    const bottomCollapseButton = findAll(
      tree,
      (value) => value?.type === "button" && value.props?.["aria-label"] === "Collapse tool group from bottom",
    )[0]
    expect(bottomCollapseButton).toBeTruthy()

    bottomCollapseButton.props.onClick({ stopPropagation: vi.fn() })
    tree = runtime.render(AgentProgress, { progress })

    expect(getTextContent(tree)).not.toContain("First tool thought")
  })

  it("does not collapse short image responses because of embedded data URL size", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const imageResponse = `Rendered a preview frame.\n\n![Preview](data:image/png;base64,${"A".repeat(2000)})`
    const progress = {
      sessionId: "session-image-response",
      conversationId: "conversation-image-response",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: true,
      finalContent: "",
      responseEvents: [
        {
          id: "resp-image",
          sessionId: "session-image-response",
          ordinal: 1,
          text: imageResponse,
          timestamp: 100,
        },
      ],
      conversationHistory: [
        { role: "assistant", content: "Rendered a preview frame.\n\n[Image: Preview]", timestamp: 110 },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress })
    const clampedMessageContent = findAll(
      tree,
      (value) => value?.type === "div"
        && typeof value?.props?.className === "string"
        && value.props.className.includes("leading-relaxed")
        && value.props.className.includes("line-clamp-2"),
    )

    expect(getTextContent(tree)).toContain("Rendered a preview frame.")
    expect(countTextOccurrences(getTextContent(tree), "Rendered a preview frame.")).toBe(1)
    expect(getTextContent(tree)).not.toContain("[Image: Preview]")
    expect(clampedMessageContent).toHaveLength(0)
  })

  it("keeps visible tool result status aligned after hiding completion-control tools", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-tool-pairing",
      conversationId: "conversation-tool-pairing",
      currentIteration: 1,
      maxIterations: 2,
      steps: [],
      isComplete: false,
      finalContent: "",
      conversationHistory: [
        {
          role: "assistant",
          content: "",
          timestamp: 90,
          toolCalls: [
            { name: "respond_to_user", arguments: { message: "Working on it" } },
            { name: "visible_pending_tool", arguments: { id: "pending" } },
            { name: "visible_success_tool", arguments: { id: "success" } },
          ],
        },
        {
          role: "tool",
          content: "",
          timestamp: 95,
          toolResults: [
            { success: true, content: "meta ok" },
            undefined,
            { success: true, content: "visible success" },
          ],
        },
      ],
    }

    let tree = runtime.render(AgentProgress, { progress })
    const compactToolSummary = findAll(
      tree,
      (value) => value?.type === "button"
        && typeof value?.props?.title === "string"
        && value.props.title.includes("visible_pending_tool")
        && value.props.title.includes("visible_success_tool"),
    )[0]
    expect(compactToolSummary).toBeTruthy()
    compactToolSummary.props.onClick({ stopPropagation: vi.fn() })
    tree = runtime.render(AgentProgress, { progress })

    const pendingRow = findToolRow(tree, "visible_pending_tool")
    const successRow = findToolRow(tree, "visible_success_tool")

    expect(pendingRow.props.className).toContain("text-blue-600")
    expect(successRow.props.className).toContain("text-green-600")
    expect(getTextContent(tree)).not.toContain("respond_to_user")
  })

  it("keeps reloaded completed sessions from showing completion-tool rows or duplicate final output", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-reloaded-complete",
      conversationId: "conversation-reloaded-complete",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: true,
      finalContent: "",
      responseEvents: [
        {
          id: "resp-reloaded-complete",
          sessionId: "session-reloaded-complete",
          ordinal: 1,
          text: "Final answer",
          timestamp: 100,
        },
      ],
      conversationHistory: [
        {
          role: "assistant",
          content: "",
          timestamp: 90,
          toolCalls: [
            { name: "respond_to_user", arguments: { message: "Final answer" } },
            { name: "mark_work_complete", arguments: {} },
          ],
        },
        {
          role: "tool",
          content: "",
          timestamp: 95,
          toolResults: [
            { success: true, content: "ok" },
            { success: true, content: "ok" },
          ],
        },
        { role: "assistant", content: "Final answer", timestamp: 110 },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress })
    const text = getTextContent(tree)

    expect(countTextOccurrences(text, "Final answer")).toBe(1)
    expect(text).not.toContain("respond_to_user")
    expect(text).not.toContain("mark_work_complete")
  })

  it("shows a lazy history window control for partial conversation history", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const onLoadEarlierConversationHistory = vi.fn()
    const progress = {
      sessionId: "pending-conv-1",
      conversationId: "conv-1",
      currentIteration: 0,
      maxIterations: 2,
      steps: [],
      isComplete: true,
      conversationHistoryTotalCount: 5,
      conversationHistoryStartIndex: 3,
      conversationHistory: [
        { role: "user", content: "Recent question", timestamp: 300 },
        { role: "assistant", content: "Recent answer", timestamp: 400 },
      ],
    }

    const tree = runtime.render(AgentProgress, { progress, onLoadEarlierConversationHistory })
    const text = getTextContent(tree)
    const loadButton = findAll(
      tree,
      (value) => value?.type === "button" && getTextContent(value).includes("Load 3 earlier"),
    )[0]

    expect(text).toContain("Showing latest 2 of 5 messages")
    expect(loadButton).toBeTruthy()

    loadButton.props.onClick({ preventDefault: vi.fn(), stopPropagation: vi.fn() })
    expect(onLoadEarlierConversationHistory).toHaveBeenCalledTimes(1)
  })

  it("smartly auto-speaks response-linked assistant messages and keeps replay available before completion", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress, tipcMock } = await loadAgentProgress(runtime, { ttsEnabled: true, ttsAutoPlay: true })
    ;(tipcMock.tipcClient.generateSpeech as any).mockResolvedValue({ audio: new Uint8Array([1, 2, 3]), mimeType: "audio/wav" })

    const progress = {
      sessionId: "session-response-tts",
      conversationId: "conversation-response-tts",
      currentIteration: 1,
      maxIterations: 2,
      steps: [],
      isComplete: false,
      finalContent: "",
      responseEvents: [
        {
          id: "resp-represented",
          sessionId: "session-response-tts",
          ordinal: 1,
          text: "Mid-conversation answer",
          timestamp: 100,
        },
      ],
      conversationHistory: [
        { role: "assistant", content: "Mid-conversation answer", timestamp: 120 },
      ],
    }

    let tree = runtime.render(AgentProgress, { progress, variant: "overlay" })
    runtime.commitEffects()
    await Promise.resolve()

    expect(tipcMock.tipcClient.generateSpeech).toHaveBeenCalledWith({ text: "Mid-conversation answer" })
  })

  it("removes tile maximize controls from the simplified session layout", async () => {
    const runtime = createHookRuntime()
    const { AgentProgress } = await loadAgentProgress(runtime)
    const progress = {
      sessionId: "session-5",
      conversationId: "conversation-5",
      currentIteration: 1,
      maxIterations: 2,
      steps: [],
      isComplete: false,
      finalContent: "",
      conversationHistory: [],
      userResponse: "Need your confirmation",
    }

    const tree = runtime.render(AgentProgress, { progress, variant: "tile", onExpand: vi.fn(), isExpanded: true })

    expect(findAll(tree, (value) => value?.props?.title === "Maximize tile")).toHaveLength(0)
    expect(findAll(tree, (value) => value?.props?.title === "Restore tile layout")).toHaveLength(0)
    expect(findAll(tree, (value) => value?.props?.title === "Maximize")).toHaveLength(0)
  })
})
