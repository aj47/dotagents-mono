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
    forwardRef: (render: any) => {
      const ForwardRefComponent = (props: any) => render(props, null)
      ForwardRefComponent.displayName = render.displayName || render.name || "ForwardRef"
      return ForwardRefComponent
    },
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
  return findNode(
    node,
    candidate =>
      (candidate.type === "Input" || candidate.type === "input") &&
      candidate.props?.placeholder === placeholder,
  )
}

function findTextareaByPlaceholder(node: any, placeholder: string) {
  return findNode(
    node,
    candidate =>
      (candidate.type === "Textarea" || candidate.type === "textarea") &&
      candidate.props?.placeholder === placeholder,
  )
}

function findMaxIterationsInput(node: any) {
  return findNode(
    node,
    candidate =>
      (candidate.type === "Input" || candidate.type === "input") &&
      candidate.props?.type === "number" &&
      candidate.props?.placeholder === "10",
  )
}

function findControlByLabel(node: any, label: string) {
  return findNode(
    node,
    candidate => candidate.type === "Control" && candidate.props?.label === label,
  )
}

const GROQ_STT_PROMPT_PLACEHOLDER = "Optional prompt to guide the model's style or specify how to spell unfamiliar words (limited to 224 tokens)"

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

async function loadSettingsGeneral(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()

  const Null = () => null
  const PassThrough = (props: any) => props?.children ?? null
  const mutate = vi.fn()
  let currentConfig: any = {
    langfuseEnabled: true,
    localTraceLoggingEnabled: false,
    langfusePublicKey: "pk-lf-old",
    langfuseSecretKey: "sk-lf-old",
    langfuseBaseUrl: "",
    sttProviderId: "groq",
    groqSttPrompt: "Spell DotAgents correctly",
    transcriptPostProcessingEnabled: true,
    transcriptPostProcessingPrompt: "Prompt old",
    launchAtLogin: false,
    mcpUnlimitedIterations: false,
    acpAgents: [],
  }
  const queryClientMock = {
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate }),
  }
  const controlMock = {
    Control: (props: any) => ({ type: "Control", props }),
    ControlGroup: (props: any) => props.children,
    ControlLabel: (props: any) => props.label,
    SettingsSearchContext: { Provider: PassThrough },
  }
  const inputMock = { Input: (props: any) => ({ type: "Input", props }) }
  const switchMock = { Switch: (props: any) => ({ type: "Switch", props }) }
  const buttonMock = { Button: (props: any) => ({ type: "Button", props }) }
  const selectMock = { Select: Null, SelectContent: Null, SelectItem: Null, SelectTrigger: Null, SelectValue: Null }
  const textareaMock = { Textarea: (props: any) => ({ type: "Textarea", props }) }
  const dialogMock = { Dialog: PassThrough, DialogContent: PassThrough, DialogHeader: PassThrough, DialogTitle: PassThrough, DialogTrigger: PassThrough }
  const ttsManagerMock = { ttsManager: { stopAll: vi.fn() } }
  const tipcClientMock = { tipcClient: { getAgentsFolders: vi.fn(async () => ({})), getExternalAgents: vi.fn(async () => []) } }

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
  vi.doMock("@tanstack/react-query", () => ({
    QueryClient: class QueryClient {
      constructor(_options?: any) {}
    },
    useQuery: ({ queryKey }: any) => {
      const key = Array.isArray(queryKey) ? queryKey[0] : queryKey
      if (key === "langfuseInstalled") return { data: true, isLoading: false }
      if (key === "agentsFolders") return { data: { global: { agentsDir: "/tmp/global/.agents" }, workspace: null }, isLoading: false }
      if (key === "externalAgents") return { data: [], isLoading: false }
      return { data: undefined, isLoading: false }
    },
    useMutation: () => ({ mutate: vi.fn() }),
    focusManager: { setEventListener: vi.fn() },
  }))
  vi.doMock("@renderer/lib/query-client", () => queryClientMock)
  vi.doMock("../lib/query-client", () => queryClientMock)
  vi.doMock("@renderer/lib/tts-manager", () => ttsManagerMock)
  vi.doMock("../lib/tts-manager", () => ttsManagerMock)
  vi.doMock("@renderer/lib/tipc-client", () => tipcClientMock)
  vi.doMock("../lib/tipc-client", () => tipcClientMock)
  vi.doMock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
  vi.doMock("lucide-react", () => ({ ExternalLink: Null, AlertCircle: Null, FolderOpen: Null, FolderUp: Null, FileText: Null, Search: Null }))
  vi.doMock("@dotagents/shared", () => ({
    __esModule: true,
    MCP_MAX_ITERATIONS_DEFAULT: 10,
    MCP_MAX_ITERATIONS_MAX: 100,
    MCP_MAX_ITERATIONS_MIN: 1,
    STT_PROVIDER_ID: {},
    SUPPORTED_LANGUAGES: [],
    parseMcpMaxIterationsDraft: (value: string) => {
      const parsedValue = Number.parseInt(value, 10)
      if (Number.isNaN(parsedValue)) return null
      if (parsedValue < 1 || parsedValue > 100) return null
      return parsedValue
    },
  }))
  vi.doMock("@shared/key-utils", () => ({ getEffectiveShortcut: () => "", formatKeyComboForDisplay: () => "" }))
  vi.doMock("../shared/key-utils", () => ({ getEffectiveShortcut: () => "", formatKeyComboForDisplay: () => "" }))
  vi.doMock("@renderer/hooks/use-audio-devices", () => ({
    useAudioDevices: () => ({ inputDevices: [], outputDevices: [], error: null, refresh: vi.fn() }),
  }))
  vi.doMock("../hooks/use-audio-devices", () => ({
    useAudioDevices: () => ({ inputDevices: [], outputDevices: [], error: null, refresh: vi.fn() }),
  }))
  vi.doMock("@renderer/components/ui/control", () => controlMock)
  vi.doMock("../components/ui/control", () => controlMock)
  vi.doMock("@renderer/components/ui/input", () => inputMock)
  vi.doMock("../components/ui/input", () => inputMock)
  vi.doMock("@renderer/components/ui/switch", () => switchMock)
  vi.doMock("../components/ui/switch", () => switchMock)
  vi.doMock("@renderer/components/ui/button", () => buttonMock)
  vi.doMock("../components/ui/button", () => buttonMock)
  vi.doMock("@renderer/components/ui/select", () => selectMock)
  vi.doMock("../components/ui/select", () => selectMock)
  vi.doMock("@renderer/components/ui/tooltip", () => ({ Tooltip: Null, TooltipContent: Null, TooltipProvider: Null, TooltipTrigger: Null }))
  vi.doMock("@renderer/components/ui/textarea", () => textareaMock)
  vi.doMock("../components/ui/textarea", () => textareaMock)
  vi.doMock("@renderer/components/ui/dialog", () => dialogMock)
  vi.doMock("../components/ui/dialog", () => dialogMock)
  vi.doMock("@renderer/components/model-selector", () => ({ ModelSelector: Null }))
  vi.doMock("../components/model-selector", () => ({ ModelSelector: Null }))
  vi.doMock("@renderer/components/key-recorder", () => ({ KeyRecorder: Null }))
  vi.doMock("../components/key-recorder", () => ({ KeyRecorder: Null }))
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
  ;(globalThis as any).window = {
    electron: { ipcRenderer: { invoke: vi.fn() } },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
  ;(globalThis as any).localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  }
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.resetModules()
  delete (globalThis as any).window
  delete (globalThis as any).localStorage
})

describe("desktop general settings draft behavior", () => {
  it("saves the local trace logging toggle from general settings", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig } = await loadSettingsGeneral(runtime)

    const tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    const localTraceLoggingControl = findControlByLabel(tree, "Local trace logging")
    expect(localTraceLoggingControl).toBeTruthy()
    const toggle = findNode(localTraceLoggingControl, candidate => candidate.type === "Switch")
    expect(toggle.props.checked).toBe(false)

    toggle.props.onCheckedChange(true)

    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        localTraceLoggingEnabled: true,
      },
    })
  })

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

  it("keeps the max-iterations draft local, allows temporary empty input, and debounces valid saves", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, setConfig, getCurrentConfig } = await loadSettingsGeneral(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let maxIterationsInput = findMaxIterationsInput(tree)
    expect(maxIterationsInput.props.value).toBe("10")

    maxIterationsInput.props.onChange({ currentTarget: { value: "" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    maxIterationsInput = findMaxIterationsInput(tree)
    expect(maxIterationsInput.props.value).toBe("")
    expect(mutate).not.toHaveBeenCalled()

    maxIterationsInput.props.onChange({ currentTarget: { value: "25" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    maxIterationsInput = findMaxIterationsInput(tree)
    expect(maxIterationsInput.props.value).toBe("25")
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
        mcpMaxIterations: 25,
      },
    })
  })

  it("flushes the latest valid max-iterations draft on blur without waiting for a rerender", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig } = await loadSettingsGeneral(runtime)

    const tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    const maxIterationsInput = findMaxIterationsInput(tree)
    maxIterationsInput.props.onChange({ currentTarget: { value: "18" } })
    maxIterationsInput.props.onBlur({ currentTarget: { value: "18" } })

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        mcpMaxIterations: 18,
      },
    })
  })

  it("cancels pending max-iterations saves when the draft becomes invalid", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate } = await loadSettingsGeneral(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let maxIterationsInput = findMaxIterationsInput(tree)
    maxIterationsInput.props.onChange({ currentTarget: { value: "25" } })
    maxIterationsInput.props.onChange({ currentTarget: { value: "" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    maxIterationsInput = findMaxIterationsInput(tree)
    expect(maxIterationsInput.props.value).toBe("")

    vi.advanceTimersByTime(400)
    expect(mutate).not.toHaveBeenCalled()
  })

  it("resets invalid max-iterations drafts back to the saved config on blur", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate } = await loadSettingsGeneral(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let maxIterationsInput = findMaxIterationsInput(tree)
    maxIterationsInput.props.onChange({ currentTarget: { value: "0" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    maxIterationsInput = findMaxIterationsInput(tree)
    expect(maxIterationsInput.props.value).toBe("0")

    maxIterationsInput.props.onBlur({ currentTarget: { value: "0" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    maxIterationsInput = findMaxIterationsInput(tree)
    expect(maxIterationsInput.props.value).toBe("10")
    expect(mutate).not.toHaveBeenCalled()
  })

  it("keeps the Groq STT prompt draft local, debounces saves, and merges with the latest config", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, setConfig, getCurrentConfig } = await loadSettingsGeneral(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let groqPromptTextarea = findTextareaByPlaceholder(tree, GROQ_STT_PROMPT_PLACEHOLDER)
    expect(groqPromptTextarea.props.value).toBe("Spell DotAgents correctly")

    groqPromptTextarea.props.onChange({ currentTarget: { value: "Spell DotAgents as two words" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    groqPromptTextarea = findTextareaByPlaceholder(tree, GROQ_STT_PROMPT_PLACEHOLDER)
    expect(groqPromptTextarea.props.value).toBe("Spell DotAgents as two words")
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
        groqSttPrompt: "Spell DotAgents as two words",
      },
    })
  })

  it("flushes the latest Groq STT prompt on blur without waiting for a rerender", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig } = await loadSettingsGeneral(runtime)

    const tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    const groqPromptTextarea = findTextareaByPlaceholder(tree, GROQ_STT_PROMPT_PLACEHOLDER)
    groqPromptTextarea.props.onChange({ currentTarget: { value: "Prefer agent names verbatim" } })
    groqPromptTextarea.props.onBlur({ currentTarget: { value: "Prefer agent names verbatim" } })

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        groqSttPrompt: "Prefer agent names verbatim",
      },
    })
  })

  it("resyncs the Groq STT prompt draft from saved config updates", async () => {
    const runtime = createHookRuntime()
    const { Component, setConfig, getCurrentConfig } = await loadSettingsGeneral(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    setConfig({
      ...getCurrentConfig(),
      groqSttPrompt: "Use product names exactly as written",
    })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    tree = runtime.render(Component, {} as any)

    expect(findTextareaByPlaceholder(tree, GROQ_STT_PROMPT_PLACEHOLDER).props.value).toBe(
      "Use product names exactly as written",
    )
  })

})
