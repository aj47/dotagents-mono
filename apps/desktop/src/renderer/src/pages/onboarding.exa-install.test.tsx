import { afterEach, describe, expect, it, vi } from "vitest"

function createHookRuntime() {
  const states: any[] = []
  const refs: Array<{ current: any }> = []
  const effects: Array<() => void | (() => void)> = []
  let stateIndex = 0
  let refIndex = 0
  let effectIndex = 0

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
    useState,
    useRef,
    useEffect: (callback: () => void | (() => void)) => {
      effects[effectIndex++] = callback
    },
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
      refIndex = 0
      effectIndex = 0
      return Component(props)
    },
    commitEffects() {
      for (const effect of effects) effect?.()
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

function findButton(node: any, text: string) {
  return findNode(node, (candidate) => candidate.type === "button" && getText(candidate) === text)
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

async function loadOnboarding(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()

  let currentConfig: any = {
    mcpConfig: { mcpServers: {} },
    mcpToolsShortcut: "hold-ctrl-alt",
  }
  const mutateAsync = vi.fn(async ({ config }: any) => {
    currentConfig = config
  })
  const setMcpServerRuntimeEnabled = vi.fn(async () => {
    throw new Error("Server failed to start")
  })
  const navigate = vi.fn()

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@renderer/components/ui/button", () => ({ Button: (props: any) => ({ type: "button", props }) }))
  vi.doMock("@renderer/components/ui/input", () => ({ Input: (props: any) => ({ type: "Input", props }) }))
  vi.doMock("@renderer/components/ui/textarea", () => ({ Textarea: (props: any) => ({ type: "Textarea", props }) }))
  vi.doMock("@renderer/components/ui/select", () => ({
    Select: (props: any) => ({ type: "Select", props }),
    SelectContent: (props: any) => props.children ?? null,
    SelectItem: (props: any) => ({ type: "SelectItem", props }),
    SelectTrigger: (props: any) => props.children ?? null,
    SelectValue: () => null,
  }))
  vi.doMock("@renderer/components/key-recorder", () => ({ KeyRecorder: () => null }))
  vi.doMock("@renderer/lib/query-client", () => ({
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate: vi.fn(), mutateAsync }),
  }))
  vi.doMock("@renderer/lib/audio-utils", () => ({ decodeBlobToPcm: vi.fn() }))
  vi.doMock("react-router-dom", () => ({ useNavigate: () => navigate }))
  vi.doMock("@tanstack/react-query", () => ({ useMutation: () => ({ mutate: vi.fn() }) }))
  vi.doMock("@shared/key-utils", () => ({ getMcpToolsShortcutDisplay: () => "Hold Ctrl+Alt" }))
  vi.doMock("@renderer/lib/tipc-client", () => ({
    tipcClient: {
      getConfig: vi.fn(async () => currentConfig),
      createRecording: vi.fn(),
      createMcpTextInput: vi.fn(),
      setMcpServerRuntimeEnabled,
      restartMcpServer: vi.fn(),
    },
  }))
  vi.doMock("@renderer/lib/recorder", () => ({
    Recorder: class {
      on() {}
      async startRecording() {}
      stopRecording() {}
    },
  }))

  const mod = await import("./onboarding")
  return { Component: mod.Component, mutateAsync, setMcpServerRuntimeEnabled, navigate }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("Onboarding Exa install errors", () => {
  it("shows a visible recovery message when Exa is saved but fails to start", async () => {
    const runtime = createHookRuntime()
    const { Component, mutateAsync, setMcpServerRuntimeEnabled } = await loadOnboarding(runtime)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()

    findButton(tree, "Get Started").props.onClick()
    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()

    findButton(tree, "Skip for Now").props.onClick()
    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()

    findButton(tree, "Skip Demo").props.onClick()
    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()

    findButton(tree, "Install").props.onClick()
    await flushPromises()

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()

    expect(mutateAsync).toHaveBeenCalledOnce()
    expect(setMcpServerRuntimeEnabled).toHaveBeenCalledWith({ serverName: "exa", enabled: true })
    expect(getText(tree)).toContain("Exa was added to Settings, but we couldn't start it.")
    expect(getText(tree)).toContain("You can retry from Settings → MCP Tools.")
    expect(findButton(tree, "Installed").props.disabled).toBe(true)
    expect(consoleError).toHaveBeenCalledWith("Failed to install Exa:", expect.any(Error))
  })
})