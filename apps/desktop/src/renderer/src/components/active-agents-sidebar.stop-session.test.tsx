import { afterEach, describe, expect, it, vi } from "vitest"

type EffectRecord = {
  callback?: () => void | (() => void)
  cleanup?: void | (() => void)
}

function createHookRuntime() {
  const states: any[] = []
  const effects: EffectRecord[] = []
  let stateIndex = 0
  let effectIndex = 0

  const useState = <T,>(initial: T | (() => T)) => {
    const idx = stateIndex++
    if (states[idx] === undefined) states[idx] = typeof initial === "function" ? (initial as () => T)() : initial
    return [states[idx] as T, (update: T | ((prev: T) => T)) => {
      states[idx] = typeof update === "function" ? (update as (prev: T) => T)(states[idx]) : update
    }] as const
  }

  const reactMock: any = {
    __esModule: true,
    default: {} as any,
    useState,
    useEffect: (callback: () => void | (() => void)) => {
      effects[effectIndex++] = { callback }
    },
    useMemo: (factory: () => any) => factory(),
    useCallback: (fn: any) => fn,
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
      effectIndex = 0
      return Component(props)
    },
    commitEffects() {
      for (const effect of effects) {
        effect?.callback?.()
      }
    },
    reactMock,
    jsxRuntimeMock: { __esModule: true, Fragment, jsx: invoke, jsxs: invoke, jsxDEV: invoke },
  }
}

function findNode(node: any, predicate: (node: any) => boolean): any {
  if (node == null) return null
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findNode(child, predicate)
      if (match) return match
    }
    return null
  }
  if (typeof node === "object") {
    if (predicate(node)) return node
    return findNode(node.props?.children, predicate)
  }
  return null
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

async function loadSidebar(
  runtime: ReturnType<typeof createHookRuntime>,
  options: {
    activeSessions?: Array<{
      id: string
      conversationTitle: string
      status: "active" | "completed" | "error" | "stopped"
      startTime: number
      isSnoozed?: boolean
    }>
    focusedSessionId?: string | null
    stopAgentSession?: ReturnType<typeof vi.fn>
    snoozeAgentSession?: ReturnType<typeof vi.fn>
    unsnoozeAgentSession?: ReturnType<typeof vi.fn>
    hidePanelWindow?: ReturnType<typeof vi.fn>
    focusAgentSession?: ReturnType<typeof vi.fn>
  } = {},
) {
  vi.resetModules()

  const toast = { error: vi.fn() }
  const stopAgentSession =
    options.stopAgentSession ??
    vi.fn(async () => {
      throw new Error("backend offline")
    })
  const snoozeAgentSession = options.snoozeAgentSession ?? vi.fn(async () => undefined)
  const unsnoozeAgentSession = options.unsnoozeAgentSession ?? vi.fn(async () => undefined)
  const hidePanelWindow = options.hidePanelWindow ?? vi.fn(async () => undefined)
  const focusAgentSession = options.focusAgentSession ?? vi.fn(async () => undefined)
  const setFocusedSessionId = vi.fn()
  const setSessionSnoozed = vi.fn()

  const store = {
    focusedSessionId:
      options.focusedSessionId === undefined ? "session-1" : options.focusedSessionId,
    setFocusedSessionId,
    setScrollToSessionId: vi.fn(),
    setSessionSnoozed,
    agentProgressById: new Map(),
  }

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("sonner", () => ({ toast }))
  vi.doMock("@tanstack/react-query", () => ({
    useQuery: () => ({
      data: {
        activeSessions:
          options.activeSessions ??
          [
            {
              id: "session-1",
              conversationTitle: "Investigate bug",
              status: "active",
              startTime: 0,
            },
          ],
        recentSessions: [],
      },
      refetch: vi.fn(),
    }),
  }))
  vi.doMock("@renderer/lib/tipc-client", () => ({
    tipcClient: {
      stopAgentSession,
      snoozeAgentSession,
      unsnoozeAgentSession,
      hidePanelWindow,
      focusAgentSession,
    },
    rendererHandlers: { agentSessionsUpdated: { listen: () => vi.fn() } },
  }))
  vi.doMock("@renderer/lib/queries", () => ({ useConversationHistoryQuery: () => ({ data: [] }) }))
  vi.doMock("@renderer/stores", () => ({ useAgentStore: (selector: any) => selector(store) }))
  vi.doMock("@renderer/lib/debug", () => ({ logUI: vi.fn(), logStateChange: vi.fn(), logExpand: vi.fn() }))
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ") }))
  vi.doMock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
  vi.doMock("lucide-react", () => {
    const Icon = () => null
    return {
      ChevronDown: Icon,
      ChevronRight: Icon,
      X: Icon,
      Minimize2: Icon,
      Maximize2: Icon,
      Clock: Icon,
      Archive: Icon,
      Bot: Icon,
    }
  })

  const mod = await import("./active-agents-sidebar")
  return {
    ActiveAgentsSidebar: mod.ActiveAgentsSidebar,
    toast,
    stopAgentSession,
    snoozeAgentSession,
    unsnoozeAgentSession,
    hidePanelWindow,
    focusAgentSession,
    setFocusedSessionId,
    setSessionSnoozed,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("ActiveAgentsSidebar session-action feedback", () => {
  it("shows a visible error when stopping a session fails", async () => {
    const runtime = createHookRuntime()
    const { ActiveAgentsSidebar, toast, stopAgentSession, setFocusedSessionId } =
      await loadSidebar(runtime)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    })

    const tree = runtime.render(ActiveAgentsSidebar, {} as any)
    runtime.commitEffects()

    const stopButton = findNode(
      tree,
      (node) => node.type === "button" && node.props?.title === "Stop this agent session",
    )
    stopButton.props.onClick({ stopPropagation: vi.fn() })
    await flushPromises()

    expect(stopAgentSession).toHaveBeenCalledWith({ sessionId: "session-1" })
    expect(setFocusedSessionId).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("Failed to stop session. backend offline")
    expect(consoleError).toHaveBeenCalled()
  })

  it("shows a visible error when minimizing a session fails", async () => {
    const runtime = createHookRuntime()
    const snoozeAgentSession = vi.fn(async () => {
      throw new Error("backend offline")
    })
    const {
      ActiveAgentsSidebar,
      toast,
      setFocusedSessionId,
      setSessionSnoozed,
      hidePanelWindow,
    } = await loadSidebar(runtime, { snoozeAgentSession })
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    })

    const tree = runtime.render(ActiveAgentsSidebar, {} as any)
    runtime.commitEffects()

    const snoozeButton = findNode(
      tree,
      (node) => node.type === "button" && node.props?.title === "Minimize - run in background",
    )
    snoozeButton.props.onClick({ stopPropagation: vi.fn() })
    await flushPromises()

    expect(snoozeAgentSession).toHaveBeenCalledWith({ sessionId: "session-1" })
    expect(setSessionSnoozed).toHaveBeenNthCalledWith(1, "session-1", true)
    expect(setSessionSnoozed).toHaveBeenNthCalledWith(2, "session-1", false)
    expect(setFocusedSessionId).not.toHaveBeenCalled()
    expect(hidePanelWindow).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("Failed to minimize session. backend offline")
    expect(consoleError).toHaveBeenCalled()
  })

  it("restores the previous focus and shows a visible error when restoring a snoozed session fails", async () => {
    const runtime = createHookRuntime()
    const unsnoozeAgentSession = vi.fn(async () => {
      throw new Error("session store unavailable")
    })
    const {
      ActiveAgentsSidebar,
      toast,
      setFocusedSessionId,
      setSessionSnoozed,
      focusAgentSession,
    } = await loadSidebar(runtime, {
      focusedSessionId: "session-2",
      unsnoozeAgentSession,
      activeSessions: [
        {
          id: "session-1",
          conversationTitle: "Investigate bug",
          status: "active",
          startTime: 0,
          isSnoozed: true,
        },
        {
          id: "session-2",
          conversationTitle: "Other task",
          status: "active",
          startTime: 1,
        },
      ],
    })
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    })

    const tree = runtime.render(ActiveAgentsSidebar, {} as any)
    runtime.commitEffects()

    const restoreButton = findNode(
      tree,
      (node) => node.type === "button" && node.props?.title === "Restore",
    )
    restoreButton.props.onClick({ stopPropagation: vi.fn() })
    await flushPromises()

    expect(unsnoozeAgentSession).toHaveBeenCalledWith({ sessionId: "session-1" })
    expect(setSessionSnoozed).toHaveBeenNthCalledWith(1, "session-1", false)
    expect(setFocusedSessionId).toHaveBeenNthCalledWith(1, "session-1")
    expect(setSessionSnoozed).toHaveBeenNthCalledWith(2, "session-1", true)
    expect(setFocusedSessionId).toHaveBeenNthCalledWith(2, "session-2")
    expect(focusAgentSession).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      "Failed to restore session. session store unavailable",
    )
    expect(consoleError).toHaveBeenCalled()
  })

  it("shows a visible error when restore succeeds but panel focus sync fails", async () => {
    const runtime = createHookRuntime()
    const focusAgentSession = vi.fn(async () => ({
      success: false,
      error: "Panel window is unavailable.",
    }))
    const {
      ActiveAgentsSidebar,
      toast,
      unsnoozeAgentSession,
      setFocusedSessionId,
      setSessionSnoozed,
    } = await loadSidebar(runtime, {
      focusedSessionId: "session-2",
      focusAgentSession,
      activeSessions: [
        {
          id: "session-1",
          conversationTitle: "Investigate bug",
          status: "active",
          startTime: 0,
          isSnoozed: true,
        },
        {
          id: "session-2",
          conversationTitle: "Other task",
          status: "active",
          startTime: 1,
        },
      ],
    })
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    })

    const tree = runtime.render(ActiveAgentsSidebar, {} as any)
    runtime.commitEffects()

    const restoreButton = findNode(
      tree,
      (node) => node.type === "button" && node.props?.title === "Restore",
    )
    restoreButton.props.onClick({ stopPropagation: vi.fn() })
    await flushPromises()

    expect(unsnoozeAgentSession).toHaveBeenCalledWith({ sessionId: "session-1" })
    expect(focusAgentSession).toHaveBeenCalledWith({ sessionId: "session-1" })
    expect(setSessionSnoozed).toHaveBeenCalledTimes(1)
    expect(setSessionSnoozed).toHaveBeenCalledWith("session-1", false)
    expect(setFocusedSessionId).toHaveBeenCalledTimes(1)
    expect(setFocusedSessionId).toHaveBeenCalledWith("session-1")
    expect(toast.error).toHaveBeenCalledWith(
      "Session restored, but failed to sync panel focus. Panel window is unavailable.",
    )
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to sync panel focus after unsnooze:",
      "Panel window is unavailable.",
    )
  })
})
