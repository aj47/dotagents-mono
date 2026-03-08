import { afterEach, describe, expect, it, vi } from "vitest"

function createHookRuntime() {
  const states: any[] = []
  let stateIndex = 0

  const useState = <T,>(initial: T | (() => T)) => {
    const idx = stateIndex++
    if (states[idx] === undefined) states[idx] = typeof initial === "function" ? (initial as () => T)() : initial
    return [states[idx] as T, (update: T | ((prev: T) => T)) => {
      states[idx] = typeof update === "function" ? (update as (prev: T) => T)(states[idx]) : update
    }] as const
  }

  const reactMock: any = { __esModule: true, default: {} as any, useState }
  reactMock.default = reactMock

  const Fragment = Symbol.for("react.fragment")
  const invoke = (type: any, props: any) => {
    if (type === Fragment) return props?.children ?? null
    return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {} }
  }

  return {
    render<P,>(Component: (props: P) => any, props: P) {
      stateIndex = 0
      return Component(props)
    },
    reactMock,
    jsxRuntimeMock: { __esModule: true, Fragment, jsx: invoke, jsxs: invoke, jsxDEV: invoke },
  }
}

function getText(node: any): string {
  if (node == null) return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getText).join("")
  return getText(node.props?.children)
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

async function loadAgentProcessingView(
  runtime: ReturnType<typeof createHookRuntime>,
  emergencyStopError: Error,
) {
  vi.resetModules()

  const toast = { error: vi.fn() }
  const emergencyStopAgent = vi.fn(async () => {
    throw emergencyStopError
  })
  const stopAgentSession = vi.fn(async () => undefined)
  const Null = () => null

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("sonner", () => ({ toast }))
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ") }))
  vi.doMock("@renderer/contexts/theme-context", () => ({ useTheme: () => ({ isDark: false }) }))
  vi.doMock("@renderer/components/ui/spinner", () => ({ Spinner: Null }))
  vi.doMock("@renderer/components/agent-progress", () => ({ AgentProgress: Null }))
  vi.doMock("@renderer/components/ui/button", () => ({ Button: (props: any) => ({ type: "button", props }) }))
  vi.doMock("@renderer/lib/tipc-client", () => ({ tipcClient: { emergencyStopAgent, stopAgentSession } }))
  vi.doMock("lucide-react", () => {
    const Icon = () => null
    return { X: Icon, AlertTriangle: Icon }
  })

  const mod = await import("./agent-processing-view")
  return { AgentProcessingView: mod.AgentProcessingView, toast, emergencyStopAgent, stopAgentSession }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("AgentProcessingView stop-session fallback", () => {
  it("falls back to emergency stop and shows visible feedback when the pending-session stop fails", async () => {
    const runtime = createHookRuntime()
    const error = new Error("backend offline")
    const { AgentProcessingView, toast, emergencyStopAgent, stopAgentSession } = await loadAgentProcessingView(runtime, error)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const props = { agentProgress: null, isProcessing: true }

    let tree = runtime.render(AgentProcessingView, props as any)
    const openDialogButton = findNode(
      tree,
      (node) => node.type === "button" && node.props?.title === "Stop agent execution",
    )
    openDialogButton.props.onClick()

    tree = runtime.render(AgentProcessingView, props as any)
    expect(getText(tree)).toContain("this may stop all running agent sessions")

    const confirmButton = findNode(tree, (node) => node.type === "button" && getText(node) === "Stop Agent")
    await confirmButton.props.onClick()
    await flushPromises()

    tree = runtime.render(AgentProcessingView, props as any)
    const retryButton = findNode(tree, (node) => node.type === "button" && getText(node) === "Stop Agent")

    expect(stopAgentSession).not.toHaveBeenCalled()
    expect(emergencyStopAgent).toHaveBeenCalledOnce()
    expect(consoleError).toHaveBeenCalledWith("Failed to stop agent (via emergencyStopAgent):", error)
    expect(toast.error).toHaveBeenCalledWith("Failed to stop agent. backend offline")
    expect(retryButton.props.disabled).toBe(false)
  })
})