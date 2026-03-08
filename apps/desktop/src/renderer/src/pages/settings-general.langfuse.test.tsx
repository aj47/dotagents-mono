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
        const cleanup = record.callback()
        record.cleanup = cleanup
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
  return findNode(
    node,
    (candidate) => candidate.type === "Input" && candidate.props?.placeholder === placeholder,
  )
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

async function loadSettingsGeneral(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()

  const Null = (props: any) => props?.children ?? null
  const mutate = vi.fn()
  let currentConfig: any = {
    mainAgentMode: "api",
    mcpUnlimitedIterations: true,
    transcriptPostProcessingEnabled: false,
    ttsEnabled: false,
    toggleVoiceDictationEnabled: false,
    textInputEnabled: false,
    settingsHotkeyEnabled: false,
    whatsappEnabled: false,
    langfuseEnabled: true,
    langfusePublicKey: "pk-lf-old",
    langfuseSecretKey: "sk-lf-old",
    langfuseBaseUrl: "https://old.langfuse.example",
  }

  ;(globalThis as any).localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  }
  ;(globalThis as any).window = {
    dispatchEvent: vi.fn(),
    electron: { ipcRenderer: { invoke: vi.fn(async () => true) } },
  }

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@renderer/components/ui/control", () => ({ Control: Null, ControlGroup: Null, ControlLabel: Null }))
  vi.doMock("@renderer/components/ui/select", () => ({ Select: Null, SelectContent: Null, SelectItem: Null, SelectTrigger: Null, SelectValue: Null }))
  vi.doMock("@renderer/components/ui/switch", () => ({ Switch: (props: any) => ({ type: "Switch", props }) }))
  vi.doMock("@renderer/components/ui/tooltip", () => ({ Tooltip: Null, TooltipContent: Null, TooltipProvider: Null, TooltipTrigger: Null }))
  vi.doMock("@renderer/components/ui/textarea", () => ({ Textarea: (props: any) => ({ type: "Textarea", props }) }))
  vi.doMock("@renderer/components/ui/input", () => ({ Input: (props: any) => ({ type: "Input", props }) }))
  vi.doMock("@renderer/components/ui/dialog", () => ({ Dialog: Null, DialogContent: Null, DialogHeader: Null, DialogTitle: Null, DialogTrigger: Null }))
  vi.doMock("@renderer/components/model-selector", () => ({ ModelSelector: Null }))
  vi.doMock("@renderer/components/ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
  vi.doMock("@renderer/lib/query-client", () => ({
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate }),
  }))
  vi.doMock("./settings-general-main-agent-options", () => ({ getSelectableMainAcpAgents: () => [] }))
  vi.doMock("@renderer/lib/tts-manager", () => ({ ttsManager: { stop: vi.fn() } }))
  vi.doMock("@renderer/lib/tipc-client", () => ({
    tipcClient: {
      getAgentsFolders: vi.fn(async () => ({ global: { agentsDir: "~/.agents" } })),
      getExternalAgents: vi.fn(async () => []),
      setPanelPosition: vi.fn(),
      resetFloatingPanel: vi.fn(async () => ({ success: true })),
      showPanelWindow: vi.fn(async () => ({})),
      resizePanelToNormal: vi.fn(async () => ({})),
      openAgentsFolder: vi.fn(async () => ({ success: true })),
      openWorkspaceAgentsFolder: vi.fn(async () => ({ success: true })),
      openSystemPromptFile: vi.fn(async () => ({ success: true })),
      openAgentsGuidelinesFile: vi.fn(async () => ({ success: true })),
    },
  }))
  vi.doMock("lucide-react", () => {
    const Icon = () => null
    return { ExternalLink: Icon, AlertCircle: Icon, FolderOpen: Icon, FolderUp: Icon, FileText: Icon }
  })
  vi.doMock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
  vi.doMock("@tanstack/react-query", () => ({
    useQuery: ({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "langfuseInstalled") return { data: true }
      if (queryKey[0] === "agentsFolders") return { data: { global: { agentsDir: "~/.agents" } } }
      if (queryKey[0] === "externalAgents") return { data: [] }
      return { data: undefined }
    },
  }))
  vi.doMock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
  vi.doMock("@renderer/components/key-recorder", () => ({ KeyRecorder: Null }))
  vi.doMock("@shared/index", () => ({ STT_PROVIDER_ID: {} }))
  vi.doMock("@shared/languages", () => ({ SUPPORTED_LANGUAGES: [{ code: "auto", name: "Auto" }] }))
  vi.doMock("@shared/key-utils", () => ({
    getEffectiveShortcut: () => "Hold Ctrl",
    formatKeyComboForDisplay: (value: string) => value,
  }))
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

describe("desktop general settings Langfuse inputs", () => {
  it("keeps a local draft and debounces public-key config saves while editing", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig } = await loadSettingsGeneral(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let input = findInputByPlaceholder(tree, "pk-lf-...")
    expect(input.props.value).toBe("pk-lf-old")

    input.props.onChange({ currentTarget: { value: "pk-lf-new" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    input = findInputByPlaceholder(tree, "pk-lf-...")
    expect(input.props.value).toBe("pk-lf-new")
    expect(mutate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(399)
    expect(mutate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        langfusePublicKey: "pk-lf-new",
      },
    })
  })

  it("flushes the latest secret-key draft on blur without requiring a rerender", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig } = await loadSettingsGeneral(runtime)

    const tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    const input = findInputByPlaceholder(tree, "sk-lf-...")
    input.props.onChange({ currentTarget: { value: "sk-lf-latest" } })
    input.props.onBlur({ currentTarget: { value: "sk-lf-latest" } })

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        langfuseSecretKey: "sk-lf-latest",
      },
    })
  })

  it("uses the latest config snapshot when a delayed Langfuse save fires", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig, setConfig } = await loadSettingsGeneral(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    const input = findInputByPlaceholder(tree, "https://cloud.langfuse.com (default)")
    input.props.onChange({ currentTarget: { value: "https://self-hosted.langfuse" } })

    setConfig({
      ...getCurrentConfig(),
      streamerModeEnabled: true,
    })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()

    vi.advanceTimersByTime(400)

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        langfuseBaseUrl: "https://self-hosted.langfuse",
      },
    })
  })
})