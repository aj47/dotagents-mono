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

async function loadSidebar(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()

  const toast = { error: vi.fn() }
  const stopAgentSession = vi.fn(async () => {
    throw new Error("backend offline")
  })
  const setFocusedSessionId = vi.fn()

  const store = {
    focusedSessionId: "session-1",
    setFocusedSessionId,
    setScrollToSessionId: vi.fn(),
    setSessionSnoozed: vi.fn(),
    agentProgressById: new Map(),
  }

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("sonner", () => ({ toast }))
  vi.doMock("@tanstack/react-query", () => ({
    useQuery: () => ({
      data: {
        activeSessions: [{ id: "session-1", conversationTitle: "Investigate bug", status: "active", startTime: 0 }],
        recentSessions: [],
      },
      refetch: vi.fn(),
    }),
  }))
  vi.doMock("@renderer/lib/tipc-client", () => ({
    tipcClient: { stopAgentSession },
    rendererHandlers: { agentSessionsUpdated: { listen: () => vi.fn() } },
  }))
  vi.doMock("@renderer/lib/queries", () => ({ useConversationHistoryQuery: () => ({ data: [] }) }))
  vi.doMock("@renderer/stores", () => ({ useAgentStore: (selector: any) => selector(store) }))
  vi.doMock("@renderer/lib/debug", () => ({ logUI: vi.fn(), logStateChange: vi.fn(), logExpand: vi.fn() }))
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ") }))
  vi.doMock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
  vi.doMock("lucide-react", () => {
    const Icon = () => null
    return { ChevronDown: Icon, ChevronRight: Icon, X: Icon, Minimize2: Icon, Maximize2: Icon, Clock: Icon, Archive: Icon, Bot: Icon }
  })

  const mod = await import("./active-agents-sidebar")
  return { ActiveAgentsSidebar: mod.ActiveAgentsSidebar, toast, stopAgentSession, setFocusedSessionId }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("ActiveAgentsSidebar stop-session feedback", () => {
  it("shows a visible error when stopping a session fails", async () => {
    const runtime = createHookRuntime()
    const { ActiveAgentsSidebar, toast, stopAgentSession, setFocusedSessionId } = await loadSidebar(runtime)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    })

    const tree = runtime.render(ActiveAgentsSidebar, {} as any)
    runtime.commitEffects()

    const stopButton = findNode(tree, (node) => node.type === "button" && node.props?.title === "Stop this agent session")
    stopButton.props.onClick({ stopPropagation: vi.fn() })
    await flushPromises()

    expect(stopAgentSession).toHaveBeenCalledWith({ sessionId: "session-1" })
    expect(setFocusedSessionId).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("Failed to stop session. backend offline")
    expect(consoleError).toHaveBeenCalled()
  })
})