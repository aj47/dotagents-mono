import { afterEach, describe, expect, it, vi } from "vitest"

type EffectRecord = { callback?: () => void | (() => void); deps?: any[]; nextDeps?: any[]; cleanup?: void | (() => void); hasRun: boolean }

function createHookRuntime() {
  const states: any[] = []; const refs: Array<{ current: any }> = []; const effects: EffectRecord[] = []
  let stateIndex = 0; let refIndex = 0; let effectIndex = 0
  const depsChanged = (prev?: any[], next?: any[]) => !prev || !next || prev.length !== next.length || prev.some((value, index) => !Object.is(value, next[index]))
  const useState = <T,>(initial: T | (() => T)) => { const idx = stateIndex++; if (states[idx] === undefined) states[idx] = typeof initial === "function" ? (initial as () => T)() : initial; return [states[idx] as T, (update: T | ((prev: T) => T)) => { states[idx] = typeof update === "function" ? (update as (prev: T) => T)(states[idx]) : update }] as const }
  const useRef = <T,>(initial: T) => { const idx = refIndex++; refs[idx] ??= { current: initial }; return refs[idx] as { current: T } }
  const useEffect = (callback: () => void | (() => void), deps?: any[]) => { const idx = effectIndex++; const record = effects[idx] ?? { hasRun: false }; record.callback = callback; record.nextDeps = deps; effects[idx] = record }
  const reactMock: any = {
    __esModule: true,
    default: {} as any,
    useState,
    useRef,
    useEffect,
    useCallback: (fn: any) => fn,
    useMemo: (factory: any) => factory(),
    forwardRef: (render: any) => {
      const ForwardRefComponent = (props: any) => render(props, null)
      ForwardRefComponent.displayName = render.displayName || render.name || "ForwardRef"
      return ForwardRefComponent
    },
  }
  reactMock.default = reactMock
  const Fragment = Symbol.for("react.fragment")
  const invoke = (type: any, props: any) => (type === Fragment ? props?.children ?? null : typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {} })
  return {
    render<P,>(Component: (props: P) => any, props: P) { stateIndex = 0; refIndex = 0; effectIndex = 0; return Component(props) },
    commitEffects() { for (const record of effects) { if (!record?.callback) continue; const shouldRun = !record.hasRun || depsChanged(record.deps, record.nextDeps); if (!shouldRun) continue; if (typeof record.cleanup === "function") record.cleanup(); record.cleanup = record.callback(); record.deps = record.nextDeps; record.hasRun = true } },
    reactMock,
    jsxRuntimeMock: { __esModule: true, Fragment, jsx: invoke, jsxs: invoke, jsxDEV: invoke },
  }
}

function findNodes(node: any, predicate: (node: any) => boolean): any[] { if (node == null) return []; if (Array.isArray(node)) return node.flatMap(child => findNodes(child, predicate)); if (typeof node === "object") return [ ...(predicate(node) ? [node] : []), ...findNodes(node.props?.children, predicate) ]; return [] }
function findNode(node: any, predicate: (node: any) => boolean): any { return findNodes(node, predicate)[0] ?? null }
function findCustomInput(node: any) {
  return findNode(
    node,
    candidate =>
      (candidate.type === "Input" || candidate.type === "input") &&
      candidate.props?.placeholder === "Enter custom model name (e.g., gpt-4.1, claude-sonnet-4)",
  )
}

async function loadModelSelector(runtime: ReturnType<typeof createHookRuntime>, models = [{ id: "llama-3.1-70b", name: "Llama 3.1 70B" }]) {
  vi.resetModules()
  const Null = () => null
  const selectMock = { Select: Null, SelectContent: Null, SelectItem: Null, SelectTrigger: Null, SelectValue: Null }
  const labelMock = { Label: (props: any) => ({ type: "Label", props }) }
  const inputMock = { Input: (props: any) => ({ type: "Input", props }) }
  const buttonMock = { Button: (props: any) => ({ type: "Button", props }) }
  const queryClientMock = {
    useAvailableModelsQuery: () => ({ data: models, isLoading: false, isError: false, refetch: vi.fn() }),
    useConfigQuery: () => ({ data: { currentModelPresetId: "default" } }),
  }
  const debugMock = { logUI: vi.fn(), logFocus: vi.fn(), logStateChange: vi.fn(), logRender: vi.fn() }
  vi.doMock("react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react")>()
    const fallbackForwardRef = <P,>(renderFn: (props: P, ref: unknown) => any) => (props: P) => renderFn(props, null)
    const fallbackUseContext = (context: { _currentValue?: unknown; _currentValue2?: unknown }) =>
      context?._currentValue ?? context?._currentValue2 ?? null
    const fallbackUseMemo = <T,>(factory: () => T) => factory()
    const fallbackUseCallback = <T extends (...args: any[]) => any>(callback: T) => callback
    const merged = {
      ...actual,
      ...runtime.reactMock,
      forwardRef: runtime.reactMock.forwardRef ?? fallbackForwardRef,
      useContext: runtime.reactMock.useContext ?? fallbackUseContext,
      useMemo: runtime.reactMock.useMemo ?? fallbackUseMemo,
      useCallback: runtime.reactMock.useCallback ?? fallbackUseCallback,
    } as any
    merged.default = merged
    return merged
  })
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@renderer/components/ui/select", () => selectMock)
  vi.doMock("./ui/select", () => selectMock)
  vi.doMock("@renderer/components/ui/label", () => labelMock)
  vi.doMock("./ui/label", () => labelMock)
  vi.doMock("@renderer/components/ui/input", () => inputMock)
  vi.doMock("./ui/input", () => inputMock)
  vi.doMock("@renderer/components/ui/button", () => buttonMock)
  vi.doMock("./ui/button", () => buttonMock)
  vi.doMock("@renderer/lib/query-client", () => queryClientMock)
  vi.doMock("../lib/query-client", () => queryClientMock)
  vi.doMock("@renderer/lib/debug", () => debugMock)
  vi.doMock("../lib/debug", () => debugMock)
  vi.doMock("lucide-react", () => ({ AlertCircle: Null, RefreshCw: Null, Search: Null, Edit3: Null }))
  vi.doMock("@dotagents/shared", () => ({ __esModule: true, DEFAULT_MODEL_PRESET_ID: "default" }))
  const mod = await import("./model-selector")
  return { ModelSelector: mod.ModelSelector }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  vi.unstubAllGlobals()
  delete (globalThis as any).window
})

describe("ModelSelector custom input draft behavior", () => {
  it("keeps custom model edits local until blur", async () => {
    ;(globalThis as any).window = { electron: { ipcRenderer: { invoke: vi.fn() } } }
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 0 })
    const runtime = createHookRuntime()
    const onValueChange = vi.fn()
    const { ModelSelector } = await loadModelSelector(runtime)
    const props = { providerId: "groq", value: "custom-old", onValueChange, label: "Groq Model" }

    let tree = runtime.render(ModelSelector, props)
    runtime.commitEffects()
    tree = runtime.render(ModelSelector, props)
    runtime.commitEffects()

    let input = findCustomInput(tree)
    expect(input.props.value).toBe("custom-old")

    input.props.onChange({ target: { value: "custom-new" } })
    tree = runtime.render(ModelSelector, props)
    runtime.commitEffects()
    input = findCustomInput(tree)

    expect(input.props.value).toBe("custom-new")
    expect(onValueChange).not.toHaveBeenCalled()

    input.props.onBlur({ currentTarget: { value: "custom-new" }, relatedTarget: null })

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith("custom-new")
  })

  it("skips blur commits when focus moves to the custom-mode toggle", async () => {
    ;(globalThis as any).window = { electron: { ipcRenderer: { invoke: vi.fn() } } }
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 0 })
    const runtime = createHookRuntime()
    const onValueChange = vi.fn()
    const { ModelSelector } = await loadModelSelector(runtime)
    const props = { providerId: "groq", value: "custom-old", onValueChange, label: "Groq Model" }

    let tree = runtime.render(ModelSelector, props)
    runtime.commitEffects()
    tree = runtime.render(ModelSelector, props)
    runtime.commitEffects()

    let input = findCustomInput(tree)
    input.props.onChange({ target: { value: "custom-new" } })
    tree = runtime.render(ModelSelector, props)
    runtime.commitEffects()
    input = findCustomInput(tree)

    input.props.onBlur({
      currentTarget: { value: "custom-new" },
      relatedTarget: { getAttribute: (name: string) => name === "data-custom-model-toggle" ? "true" : null },
    })

    expect(onValueChange).not.toHaveBeenCalled()
  })
})
