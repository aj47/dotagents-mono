import { afterEach, describe, expect, it, vi } from "vitest"

type EffectRecord = { callback?: () => void | (() => void) }

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

async function loadAppLayout(
  runtime: ReturnType<typeof createHookRuntime>,
  options?: {
    stopAllTtsImpl?: () => Promise<unknown>
    emergencyStopAgentImpl?: () => Promise<unknown>
    configData?: Record<string, unknown>
  },
) {
  vi.resetModules()

  const toast = { error: vi.fn() }
  const stopAllTts = vi.fn(options?.stopAllTtsImpl ?? (async () => undefined))
  const emergencyStopAgent = vi.fn(options?.emergencyStopAgentImpl ?? (async () => {
    throw new Error("backend offline")
  }))
  const configData = options?.configData ?? { ttsEnabled: true, whatsappEnabled: false }
  const saveConfigMutate = vi.fn()
  const setFocusedSessionId = vi.fn()
  const ttsManagerStopAll = vi.fn()

  const store = {
    focusedSessionId: "session-1",
    setFocusedSessionId,
    setScrollToSessionId: vi.fn(),
    agentProgressById: new Map(),
  }

  const Null = () => null

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("sonner", () => ({ toast }))
  vi.doMock("@tanstack/react-query", () => ({
    useQuery: () => ({
      data: { activeSessions: [] },
      refetch: vi.fn(),
    }),
  }))
  vi.doMock("@renderer/lib/tipc-client", () => ({
    tipcClient: {
      getAgentSessions: vi.fn(async () => ({ activeSessions: [] })),
      stopAllTts,
      emergencyStopAgent,
    },
    rendererHandlers: { agentSessionsUpdated: { listen: () => vi.fn() } },
  }))
  vi.doMock("@renderer/lib/query-client", () => ({
    useConfigQuery: () => ({ data: configData }),
    useSaveConfigMutation: () => ({ mutate: saveConfigMutate, isPending: false }),
  }))
  vi.doMock("@renderer/lib/tts-manager", () => ({ ttsManager: { stopAll: ttsManagerStopAll } }))
  vi.doMock("@renderer/stores", () => ({ useAgentStore: (selector: any) => selector(store) }))
  vi.doMock("@renderer/hooks/use-sidebar", () => ({
    useSidebar: () => ({
      isCollapsed: false,
      width: 280,
      isResizing: false,
      toggleCollapse: vi.fn(),
      handleResizeStart: vi.fn(),
    }),
    SIDEBAR_DIMENSIONS: { width: { collapsed: 64 } },
  }))
  vi.doMock("@renderer/lib/utils", () => ({
    cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" "),
  }))
  vi.doMock("@renderer/components/ui/loading-spinner", () => ({ LoadingSpinner: Null }))
  vi.doMock("@renderer/components/settings-drag-bar", () => ({ SettingsDragBar: Null }))
  vi.doMock("@renderer/components/active-agents-sidebar", () => ({ ActiveAgentsSidebar: Null }))
  vi.doMock("@renderer/components/agent-capabilities-sidebar", () => ({ AgentCapabilitiesSidebar: Null }))
  vi.doMock("@renderer/components/past-sessions-dialog", () => ({ PastSessionsDialog: Null }))
  vi.doMock("react-router-dom", () => ({
    NavLink: (props: any) => ({ type: "NavLink", props }),
    Outlet: (props: any) => ({ type: "Outlet", props }),
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: "/settings" }),
  }))
  vi.doMock("lucide-react", () => {
    const Icon = () => null
    return { Clock: Icon, PanelLeftClose: Icon, PanelLeft: Icon, Volume2: Icon, VolumeX: Icon, OctagonX: Icon, Loader2: Icon }
  })

  const mod = await import("./app-layout")
  return {
    Component: mod.Component,
    toast,
    stopAllTts,
    emergencyStopAgent,
    saveConfigMutate,
    setFocusedSessionId,
    ttsManagerStopAll,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("AppLayout emergency stop feedback", () => {
  it("warns when disabling global TTS cannot stop speech in other windows", async () => {
    const runtime = createHookRuntime()
    const {
      Component,
      toast,
      stopAllTts,
      emergencyStopAgent,
      saveConfigMutate,
      ttsManagerStopAll,
    } = await loadAppLayout(runtime, {
      stopAllTtsImpl: async () => {
        throw new Error("panel unreachable")
      },
      emergencyStopAgentImpl: async () => ({ success: true }),
    })
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    const tree = runtime.render(Component, {} as any)
    runtime.commitEffects()

    const toggleButton = findNode(
      tree,
      (node) => node.type === "button" && node.props?.title === "Disable global TTS",
    )

    await toggleButton.props.onClick({ stopPropagation: vi.fn() })

    expect(ttsManagerStopAll).toHaveBeenCalledWith("collapsed-sidebar-global-tts-disabled")
    expect(stopAllTts).toHaveBeenCalledOnce()
    expect(emergencyStopAgent).not.toHaveBeenCalled()
    expect(saveConfigMutate).toHaveBeenCalledWith({
      config: { ttsEnabled: false, whatsappEnabled: false },
    })
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to stop TTS in all windows:",
      expect.any(Error),
    )
    expect(toast.error).toHaveBeenCalledWith(
      "Disabled TTS for this window, but failed to stop speech in other windows. panel unreachable",
    )
  })

  it("shows a visible error when the global emergency stop action fails", async () => {
    const runtime = createHookRuntime()
    const { Component, toast, stopAllTts, emergencyStopAgent, setFocusedSessionId } = await loadAppLayout(runtime)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()

    const stopButton = findNode(
      tree,
      (node) => node.type === "button" && node.props?.title === "Emergency stop all agent sessions",
    )

    await stopButton.props.onClick({ stopPropagation: vi.fn() })

    tree = runtime.render(Component, {} as any)
    const retryButton = findNode(
      tree,
      (node) => node.type === "button" && node.props?.title === "Emergency stop all agent sessions",
    )

    expect(stopAllTts).toHaveBeenCalledOnce()
    expect(emergencyStopAgent).toHaveBeenCalledOnce()
    expect(setFocusedSessionId).not.toHaveBeenCalled()
    expect(retryButton.props.disabled).toBe(false)
    expect(consoleError).toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("Failed to stop all agent sessions. backend offline")
  })
})