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

function findPasswordInputByValue(node: any, value: string) {
  return findNode(node, (candidate) => candidate.type === "Input" && candidate.props?.type === "password" && candidate.props?.value === value)
}

function findInputByPlaceholder(node: any, placeholder: string) {
  return findNode(node, (candidate) => candidate.type === "Input" && candidate.props?.placeholder === placeholder)
}

function findInputByRange(node: any, min: string | number, max: string | number) {
  return findNode(
    node,
    (candidate) => candidate.type === "Input" && candidate.props?.min === min && candidate.props?.max === max,
  )
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

async function loadSettingsProviders(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()

  const Null = (props: any) => props?.children ?? null
  const mutate = vi.fn()
  let currentConfig: any = {
    mainAgentMode: "api",
    sttProviderId: "openai",
    transcriptPostProcessingProviderId: "openai",
    mcpToolsProviderId: "groq",
    ttsProviderId: "openai",
    providerSectionCollapsedOpenai: false,
    providerSectionCollapsedGroq: false,
    providerSectionCollapsedGemini: true,
    providerSectionCollapsedParakeet: true,
    providerSectionCollapsedKitten: true,
    providerSectionCollapsedSupertonic: false,
    groqApiKey: "gr-old",
    groqBaseUrl: "https://old.groq.example",
    geminiApiKey: "gm-old",
    geminiBaseUrl: "https://old.gemini.example",
    openaiTtsSpeed: 1,
    supertonicSpeed: 1.05,
    supertonicSteps: 5,
    streamerModeEnabled: false,
    modelPresets: [],
    agentProfiles: [],
    acpAgents: [],
  }

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@tanstack/react-query", () => ({
    useQuery: ({ queryKey }: { queryKey?: string[] }) => {
      if (queryKey?.[0] === "supertonicModelStatus") {
        return { data: { downloaded: true }, isLoading: false }
      }

      return { data: undefined, isLoading: false }
    },
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  }))
  vi.doMock("@renderer/components/ui/control", () => ({
    Control: (props: any) => ({ type: "Control", props }),
    ControlGroup: Null,
    ControlLabel: Null,
  }))
  vi.doMock("@renderer/components/ui/input", () => ({ Input: (props: any) => ({ type: "Input", props }) }))
  vi.doMock("@renderer/components/ui/select", () => ({ Select: Null, SelectContent: Null, SelectItem: Null, SelectTrigger: Null, SelectValue: Null }))
  vi.doMock("@renderer/components/ui/switch", () => ({ Switch: (props: any) => ({ type: "Switch", props }) }))
  vi.doMock("@renderer/components/ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
  vi.doMock("@renderer/lib/query-client", () => ({
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate }),
  }))
  vi.doMock("@renderer/components/model-preset-manager", () => ({ ModelPresetManager: Null }))
  vi.doMock("@renderer/components/model-selector", () => ({ ProviderModelSelector: Null }))
  vi.doMock("@renderer/components/preset-model-selector", () => ({ PresetModelSelector: Null }))
  vi.doMock("./settings-general-main-agent-options", () => ({ getSelectableMainAcpAgents: () => [] }))
  vi.doMock("lucide-react", () => {
    const Icon = () => null
    return {
      Mic: Icon,
      Bot: Icon,
      Volume2: Icon,
      FileText: Icon,
      CheckCircle2: Icon,
      ChevronDown: Icon,
      ChevronRight: Icon,
      Brain: Icon,
      Zap: Icon,
      BookOpen: Icon,
      Settings2: Icon,
      Cpu: Icon,
      Download: Icon,
      Loader2: Icon,
    }
  })
  vi.doMock("@shared/index", () => ({
    STT_PROVIDERS: [{ label: "OpenAI", value: "openai" }],
    CHAT_PROVIDERS: [{ label: "OpenAI", value: "openai" }, { label: "Groq", value: "groq" }, { label: "Gemini", value: "gemini" }],
    TTS_PROVIDERS: [{ label: "OpenAI", value: "openai" }],
    STT_PROVIDER_ID: {},
    CHAT_PROVIDER_ID: {},
    TTS_PROVIDER_ID: {},
    OPENAI_TTS_MODELS: [],
    OPENAI_TTS_VOICES: [],
    GROQ_TTS_MODELS: [],
    GROQ_TTS_VOICES_ENGLISH: [],
    GROQ_TTS_VOICES_ARABIC: [],
    GEMINI_TTS_MODELS: [],
    GEMINI_TTS_VOICES: [],
    KITTEN_TTS_VOICES: [],
    SUPERTONIC_TTS_VOICES: [],
    SUPERTONIC_TTS_LANGUAGES: [],
    getBuiltInModelPresets: () => [],
    DEFAULT_MODEL_PRESET_ID: "default",
  }))

  const mod = await import("./settings-providers")
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

describe("desktop provider credential inputs", () => {
  it("keeps a local draft and debounces Groq API key saves while editing", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig } = await loadSettingsProviders(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let input = findPasswordInputByValue(tree, "gr-old")
    expect(input.props.value).toBe("gr-old")

    input.props.onChange({ currentTarget: { value: "gr-new" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    input = findPasswordInputByValue(tree, "gr-new")
    expect(input.props.value).toBe("gr-new")
    expect(mutate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(399)
    expect(mutate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        groqApiKey: "gr-new",
      },
    })
  })

  it("flushes inactive Gemini base-url drafts on blur and resyncs from updated config", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, setConfig, getCurrentConfig } = await loadSettingsProviders(runtime)

    setConfig({
      ...getCurrentConfig(),
      providerSectionCollapsedGemini: false,
    })

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let input = findInputByPlaceholder(tree, "https://generativelanguage.googleapis.com")
    expect(input.props.value).toBe("https://old.gemini.example")

    input.props.onChange({ currentTarget: { value: "https://new.gemini.example" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    input = findInputByPlaceholder(tree, "https://generativelanguage.googleapis.com")
    expect(input.props.value).toBe("https://new.gemini.example")

    input.props.onBlur({ currentTarget: { value: "https://new.gemini.example" } })

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        geminiBaseUrl: "https://new.gemini.example",
      },
    })

    setConfig({
      ...getCurrentConfig(),
      providerSectionCollapsedGemini: false,
      geminiBaseUrl: "https://remote.gemini.example",
    })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    tree = runtime.render(Component, {} as any)
    input = findInputByPlaceholder(tree, "https://generativelanguage.googleapis.com")
    expect(input.props.value).toBe("https://remote.gemini.example")
  })

  it("uses the latest config snapshot when a delayed provider save fires", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, setConfig, getCurrentConfig } = await loadSettingsProviders(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    const input = findInputByPlaceholder(tree, "https://api.groq.com/openai/v1")
    input.props.onChange({ currentTarget: { value: "https://new.groq.example" } })

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
        groqBaseUrl: "https://new.groq.example",
      },
    })
  })

  it("keeps a local draft and debounces OpenAI TTS speed saves while editing", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig } = await loadSettingsProviders(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let input = findInputByPlaceholder(tree, "1.0")
    expect(input.props.value).toBe("1")

    input.props.onChange({ currentTarget: { value: "1.5" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    input = findInputByPlaceholder(tree, "1.0")
    expect(input.props.value).toBe("1.5")
    expect(mutate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(399)
    expect(mutate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        openaiTtsSpeed: 1.5,
      },
    })
  })

  it("restores the last saved Supertonic steps value when blur leaves an invalid draft", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate } = await loadSettingsProviders(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let input = findInputByRange(tree, 2, 10)
    expect(input.props.value).toBe("5")

    input.props.onChange({ currentTarget: { value: "" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    input = findInputByRange(tree, 2, 10)
    expect(input.props.value).toBe("")
    expect(mutate).not.toHaveBeenCalled()

    input.props.onBlur({ currentTarget: { value: "" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    input = findInputByRange(tree, 2, 10)
    expect(input.props.value).toBe("5")
    expect(mutate).not.toHaveBeenCalled()
  })

  it("uses the latest config snapshot when a delayed Supertonic numeric save fires", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, setConfig, getCurrentConfig } = await loadSettingsProviders(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    const input = findInputByRange(tree, 0.5, 2)
    input.props.onChange({ currentTarget: { value: "1.25" } })

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
        supertonicSpeed: 1.25,
      },
    })
  })
})
