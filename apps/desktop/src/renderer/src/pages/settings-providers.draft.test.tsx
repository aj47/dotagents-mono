import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type EffectRecord = { callback?: () => void | (() => void); deps?: any[]; nextDeps?: any[]; cleanup?: void | (() => void); hasRun: boolean }

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
    return [states[idx] as T, (update: T | ((prev: T) => T)) => { states[idx] = typeof update === "function" ? (update as (prev: T) => T)(states[idx]) : update }] as const
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
    useMemo: (factory: any) => factory(),
  }
  reactMock.default = reactMock
  const Fragment = Symbol.for("react.fragment")
  const invoke = (type: any, props: any) => (type === Fragment ? props?.children ?? null : typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {} })
  return {
    render<P,>(Component: (props: P) => any, props: P) { stateIndex = 0; refIndex = 0; effectIndex = 0; return Component(props) },
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
  if (Array.isArray(node)) return node.map(child => findNode(child, predicate)).find(Boolean) ?? null
  if (typeof node === "object") return predicate(node) ? node : findNode(node.props?.children, predicate)
  return null
}

function findInputByType(node: any, type: string) {
  return findNode(node, candidate => candidate.type === "Input" && candidate.props?.type === type)
}

function findInputByPlaceholder(node: any, placeholder: string) {
  return findNode(node, candidate => candidate.type === "Input" && candidate.props?.placeholder === placeholder)
}

function findNumberInput(node: any, min: string | number, max: string | number) {
  return findNode(
    node,
    candidate => candidate.type === "Input"
      && candidate.props?.type === "number"
      && String(candidate.props?.min) === String(min)
      && String(candidate.props?.max) === String(max),
  )
}

async function flushPromises() { await Promise.resolve(); await Promise.resolve() }

async function loadSettingsProviders(runtime: ReturnType<typeof createHookRuntime>, overrides: Record<string, any> = {}) {
  vi.resetModules()
  const Null = () => null
  const mutate = vi.fn()
  let currentConfig: any = {
    mainAgentMode: "api",
    sttProviderId: "groq",
    transcriptPostProcessingProviderId: "openai",
    mcpToolsProviderId: "openai",
    ttsProviderId: "openai",
    providerSectionCollapsedOpenai: true,
    providerSectionCollapsedGroq: false,
    providerSectionCollapsedGemini: true,
    groqApiKey: "groq-old",
    groqBaseUrl: "https://api.groq.com/openai/v1",
    geminiApiKey: "gemini-old",
    geminiBaseUrl: "https://generativelanguage.googleapis.com",
    modelPresets: [],
    acpAgents: [],
    agentProfiles: [],
    ...overrides,
  }
  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@tanstack/react-query", () => ({
    useQuery: (options: { queryKey?: string[] }) => {
      const key = options?.queryKey?.[0]
      if (key === "supertonicModelStatus") {
        return { data: { downloaded: true }, isLoading: false }
      }

      return { data: undefined, isLoading: false }
    },
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  }))
  vi.doMock("@renderer/lib/query-client", () => ({ useConfigQuery: () => ({ data: currentConfig }), useSaveConfigMutation: () => ({ mutate }) }))
  vi.doMock("@renderer/components/ui/control", () => ({ Control: (props: any) => ({ type: "Control", props }), ControlGroup: (props: any) => props.children, ControlLabel: (props: any) => props.label }))
  vi.doMock("@renderer/components/ui/input", () => ({ Input: (props: any) => ({ type: "Input", props }) }))
  vi.doMock("@renderer/components/ui/select", () => ({ Select: Null, SelectContent: Null, SelectItem: Null, SelectTrigger: Null, SelectValue: Null }))
  vi.doMock("@renderer/components/ui/switch", () => ({ Switch: Null }))
  vi.doMock("@renderer/components/ui/button", () => ({ Button: Null }))
  vi.doMock("@renderer/components/model-preset-manager", () => ({ ModelPresetManager: Null }))
  vi.doMock("@renderer/components/model-selector", () => ({ ProviderModelSelector: Null }))
  vi.doMock("@renderer/components/preset-model-selector", () => ({ PresetModelSelector: Null }))
  vi.doMock("./settings-general-main-agent-options", () => ({ getSelectableMainAcpAgents: () => [] }))
  vi.doMock("lucide-react", () => ({ Mic: Null, Bot: Null, Volume2: Null, FileText: Null, CheckCircle2: Null, ChevronDown: Null, ChevronRight: Null, Brain: Null, Zap: Null, BookOpen: Null, Settings2: Null, Cpu: Null, Download: Null, Loader2: Null }))
  vi.doMock("@shared/index", () => ({
    STT_PROVIDERS: [{ label: "OpenAI", value: "openai" }, { label: "Groq", value: "groq" }],
    CHAT_PROVIDERS: [{ label: "OpenAI", value: "openai" }, { label: "Groq", value: "groq" }, { label: "Gemini", value: "gemini" }],
    TTS_PROVIDERS: [{ label: "OpenAI", value: "openai" }],
    OPENAI_TTS_MODELS: [], OPENAI_TTS_VOICES: [], GROQ_TTS_MODELS: [], GROQ_TTS_VOICES_ENGLISH: [], GROQ_TTS_VOICES_ARABIC: [], GEMINI_TTS_MODELS: [], GEMINI_TTS_VOICES: [], KITTEN_TTS_VOICES: [], SUPERTONIC_TTS_VOICES: [], SUPERTONIC_TTS_LANGUAGES: [],
    getBuiltInModelPresets: () => [], DEFAULT_MODEL_PRESET_ID: "default",
  }))
  const mod = await import("./settings-providers")
  return {
    Component: mod.Component,
    mutate,
    setConfig(nextConfig: any) { currentConfig = nextConfig },
    getCurrentConfig() { return currentConfig },
  }
}

beforeEach(() => { vi.useFakeTimers() })

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("desktop provider settings draft behavior", () => {
  it("keeps the groq API key draft local, debounces saves, and merges with the latest config", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, setConfig, getCurrentConfig } = await loadSettingsProviders(runtime)
    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()
    let apiKeyInput = findInputByType(tree, "password")
    expect(apiKeyInput.props.value).toBe("groq-old")
    apiKeyInput.props.onChange({ currentTarget: { value: "groq-new" } })
    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    apiKeyInput = findInputByType(tree, "password")
    expect(apiKeyInput.props.value).toBe("groq-new")
    expect(mutate).not.toHaveBeenCalled()
    setConfig({ ...getCurrentConfig(), launchAtLogin: true })
    runtime.render(Component, {} as any)
    runtime.commitEffects()
    vi.advanceTimersByTime(399)
    expect(mutate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(mutate).toHaveBeenCalledWith({ config: { ...getCurrentConfig(), groqApiKey: "groq-new" } })
  })

  it("flushes the gemini base URL draft on blur in the inactive section and resyncs from saved config", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, setConfig, getCurrentConfig } = await loadSettingsProviders(runtime, {
      sttProviderId: "openai",
      transcriptPostProcessingProviderId: "openai",
      mcpToolsProviderId: "openai",
      ttsProviderId: "openai",
      providerSectionCollapsedGroq: true,
      providerSectionCollapsedGemini: false,
    })
    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()
    let baseUrlInput = findInputByPlaceholder(tree, "https://generativelanguage.googleapis.com")
    expect(baseUrlInput.props.value).toBe("https://generativelanguage.googleapis.com")
    baseUrlInput.props.onChange({ currentTarget: { value: "https://gemini.example.test" } })
    expect(mutate).not.toHaveBeenCalled()
    baseUrlInput.props.onBlur({ currentTarget: { value: "https://gemini.example.test" } })
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({ config: { ...getCurrentConfig(), geminiBaseUrl: "https://gemini.example.test" } })
    setConfig({ ...getCurrentConfig(), geminiBaseUrl: "https://saved.example.test" })
    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    tree = runtime.render(Component, {} as any)
    baseUrlInput = findInputByPlaceholder(tree, "https://generativelanguage.googleapis.com")
    expect(baseUrlInput.props.value).toBe("https://saved.example.test")
  })

  it("lets Supertonic quality steps keep an intermediate keyboard draft before saving a valid final value", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig } = await loadSettingsProviders(runtime, {
      ttsProviderId: "supertonic",
      providerSectionCollapsedSupertonic: false,
      supertonicSteps: 5,
    })

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let stepsInput = findNumberInput(tree, 2, 10)
    expect(stepsInput.props.value).toBe("5")

    stepsInput.props.onChange({ currentTarget: { value: "1" } })
    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    stepsInput = findNumberInput(tree, 2, 10)
    expect(stepsInput.props.value).toBe("1")
    expect(mutate).not.toHaveBeenCalled()

    stepsInput.props.onChange({ currentTarget: { value: "10" } })
    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    stepsInput = findNumberInput(tree, 2, 10)
    expect(stepsInput.props.value).toBe("10")

    vi.advanceTimersByTime(399)
    expect(mutate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(mutate).toHaveBeenCalledWith({ config: { ...getCurrentConfig(), supertonicSteps: 10 } })
  })

  it("lets Supertonic speed keep an out-of-range prefix locally and resets invalid blur states", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate } = await loadSettingsProviders(runtime, {
      ttsProviderId: "supertonic",
      providerSectionCollapsedSupertonic: false,
      supertonicSpeed: 1.05,
    })

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let speedInput = findNumberInput(tree, 0.5, 2)
    expect(speedInput.props.value).toBe("1.05")

    speedInput.props.onChange({ currentTarget: { value: "0" } })
    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    speedInput = findNumberInput(tree, 0.5, 2)
    expect(speedInput.props.value).toBe("0")
    expect(mutate).not.toHaveBeenCalled()

    speedInput.props.onBlur({ currentTarget: { value: "0" } })
    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    speedInput = findNumberInput(tree, 0.5, 2)
    expect(speedInput.props.value).toBe("1.05")
  })
})