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

function findTextareaByPlaceholder(node: any, placeholder: string) {
  return findNode(node, candidate => candidate.type === "Textarea" && candidate.props?.placeholder === placeholder)
}

function findTextarea(node: any) {
  return findNode(node, candidate => candidate.type === "Textarea" && candidate.props?.rows === 10)
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
    langfusePublicKey: "pk-lf-old",
    langfuseSecretKey: "sk-lf-old",
    langfuseBaseUrl: "",
    sttProviderId: "groq",
    groqSttPrompt: "Spell DotAgents correctly",
    transcriptPostProcessingEnabled: true,
    transcriptPostProcessingPrompt: "Prompt old",
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
  vi.doMock("@renderer/components/ui/textarea", () => ({ Textarea: (props: any) => ({ type: "Textarea", props }) }))
  vi.doMock("@renderer/components/ui/dialog", () => ({ Dialog: PassThrough, DialogContent: PassThrough, DialogHeader: PassThrough, DialogTitle: PassThrough, DialogTrigger: PassThrough }))
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

describe("desktop general settings draft behavior", () => {
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

  it("keeps the transcript post-processing prompt draft local, debounces saves, and merges with the latest config", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, setConfig, getCurrentConfig } = await loadSettingsGeneral(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let promptTextarea = findTextarea(tree)
    expect(promptTextarea.props.value).toBe("Prompt old")

    promptTextarea.props.onChange({ currentTarget: { value: "Prompt new" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    promptTextarea = findTextarea(tree)
    expect(promptTextarea.props.value).toBe("Prompt new")
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
        transcriptPostProcessingPrompt: "Prompt new",
      },
    })
  })

  it("flushes the latest transcript post-processing prompt on blur without waiting for a rerender", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig } = await loadSettingsGeneral(runtime)

    const tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    const promptTextarea = findTextarea(tree)
    promptTextarea.props.onChange({ currentTarget: { value: "Prompt blur" } })
    promptTextarea.props.onBlur({ currentTarget: { value: "Prompt blur" } })

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        transcriptPostProcessingPrompt: "Prompt blur",
      },
    })
  })

  it("resyncs the transcript post-processing prompt draft from saved config updates", async () => {
    const runtime = createHookRuntime()
    const { Component, setConfig, getCurrentConfig } = await loadSettingsGeneral(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    setConfig({
      ...getCurrentConfig(),
      transcriptPostProcessingPrompt: "Prompt synced",
    })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    tree = runtime.render(Component, {} as any)

    expect(findTextarea(tree).props.value).toBe("Prompt synced")
  })
})