import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type EffectRecord = {
  callback?: () => void | (() => void)
  deps?: any[]
  nextDeps?: any[]
  cleanup?: void | (() => void)
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
  const useEffect = (callback: () => void | (() => void), deps?: any[]) => {
    const idx = effectIndex++
    const record = effects[idx] ?? { hasRun: false }
    record.callback = callback
    record.nextDeps = deps
    effects[idx] = record
  }

  const reactMock: any = {
    __esModule: true,
    default: {} as any,
    useState,
    useRef,
    useEffect,
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

function findInputByPlaceholder(node: any, placeholder: string) {
  return findNode(node, candidate => candidate.type === "Input" && candidate.props?.placeholder === placeholder)
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

async function loadSettingsGeneral(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()

  const Null = () => null
  const mutate = vi.fn()
  let currentConfig: any = {
    langfuseEnabled: true,
    langfusePublicKey: "pk-lf-old",
    langfuseSecretKey: "sk-lf-old",
    langfuseBaseUrl: "",
    launchAtLogin: false,
    acpAgents: [],
  }

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
  vi.doMock("@tanstack/react-query", () => ({
    useQuery: ({ queryKey }: any) => {
      const key = Array.isArray(queryKey) ? queryKey[0] : queryKey
      if (key === "langfuseInstalled") return { data: true, isLoading: false }
      if (key === "agentsFolders") return { data: { global: { agentsDir: "/tmp/global/.agents" }, workspace: null }, isLoading: false }
      if (key === "externalAgents") return { data: [], isLoading: false }
      return { data: undefined, isLoading: false }
    },
  }))
  vi.doMock("@renderer/lib/query-client", () => ({
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate }),
  }))
  vi.doMock("./settings-general-main-agent-options", () => ({ getSelectableMainAcpAgents: () => [] }))
  vi.doMock("@renderer/lib/tts-manager", () => ({ ttsManager: { stopAll: vi.fn() } }))
  vi.doMock("@renderer/lib/tipc-client", () => ({ tipcClient: { getAgentsFolders: vi.fn(async () => ({})), getExternalAgents: vi.fn(async () => []) } }))
  vi.doMock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
  vi.doMock("lucide-react", () => ({ ExternalLink: Null, AlertCircle: Null, FolderOpen: Null, FolderUp: Null, FileText: Null }))
  vi.doMock("@shared/index", () => ({ STT_PROVIDER_ID: {} }))
  vi.doMock("@shared/languages", () => ({ SUPPORTED_LANGUAGES: [] }))
  vi.doMock("@shared/key-utils", () => ({ getEffectiveShortcut: () => "", formatKeyComboForDisplay: () => "" }))
  vi.doMock("@renderer/components/ui/control", () => ({ Control: (props: any) => ({ type: "Control", props }), ControlGroup: (props: any) => props.children, ControlLabel: (props: any) => props.label }))
  vi.doMock("@renderer/components/ui/input", () => ({ Input: (props: any) => ({ type: "Input", props }) }))
  vi.doMock("@renderer/components/ui/switch", () => ({ Switch: (props: any) => ({ type: "Switch", props }) }))
  vi.doMock("@renderer/components/ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
  vi.doMock("@renderer/components/ui/select", () => ({ Select: Null, SelectContent: Null, SelectItem: Null, SelectTrigger: Null, SelectValue: Null }))
  vi.doMock("@renderer/components/ui/tooltip", () => ({ Tooltip: Null, TooltipContent: Null, TooltipProvider: Null, TooltipTrigger: Null }))
  vi.doMock("@renderer/components/ui/textarea", () => ({ Textarea: Null }))
  vi.doMock("@renderer/components/ui/dialog", () => ({ Dialog: Null, DialogContent: Null, DialogHeader: Null, DialogTitle: Null, DialogTrigger: Null }))
  vi.doMock("@renderer/components/model-selector", () => ({ ModelSelector: Null }))
  vi.doMock("@renderer/components/key-recorder", () => ({ KeyRecorder: Null }))
  vi.doMock("./settings-remote-server", () => ({ RemoteServerSettingsGroups: Null }))

  const mod = await import("./settings-general")
  return {
    Component: mod.Component,
    mutate,
    setConfig(nextConfig: any) {
      currentConfig = nextConfig
    },
    getCurrentConfig() {
      return currentConfig
    },
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("desktop general settings langfuse drafts", () => {
  it("keeps the public key draft local, debounces saves, and merges with the latest config", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, setConfig, getCurrentConfig } = await loadSettingsGeneral(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let publicKeyInput = findInputByPlaceholder(tree, "pk-lf-...")
    expect(publicKeyInput.props.value).toBe("pk-lf-old")

    publicKeyInput.props.onChange({ currentTarget: { value: "pk-lf-new" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    publicKeyInput = findInputByPlaceholder(tree, "pk-lf-...")
    expect(publicKeyInput.props.value).toBe("pk-lf-new")
    expect(mutate).not.toHaveBeenCalled()

    setConfig({ ...getCurrentConfig(), launchAtLogin: true })
    runtime.render(Component, {} as any)
    runtime.commitEffects()

    vi.advanceTimersByTime(399)
    expect(mutate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        langfusePublicKey: "pk-lf-new",
      },
    })
  })

  it("flushes the latest secret key on blur without waiting for a rerender", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig } = await loadSettingsGeneral(runtime)

    const tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    const secretKeyInput = findInputByPlaceholder(tree, "sk-lf-...")
    secretKeyInput.props.onChange({ currentTarget: { value: "sk-lf-new" } })
    secretKeyInput.props.onBlur({ currentTarget: { value: "sk-lf-new" } })

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        langfuseSecretKey: "sk-lf-new",
      },
    })
  })

  it("resyncs the displayed drafts from saved config updates", async () => {
    const runtime = createHookRuntime()
    const { Component, setConfig, getCurrentConfig } = await loadSettingsGeneral(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    setConfig({
      ...getCurrentConfig(),
      langfusePublicKey: "pk-lf-synced",
      langfuseBaseUrl: "https://langfuse.example",
    })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    tree = runtime.render(Component, {} as any)

    expect(findInputByPlaceholder(tree, "pk-lf-...").props.value).toBe("pk-lf-synced")
    expect(findInputByPlaceholder(tree, "https://cloud.langfuse.com (default)").props.value).toBe("https://langfuse.example")
  })
})