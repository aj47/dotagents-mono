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
    forwardRef: (render: (props: any, ref: any) => any) => (props: any) => render(props, null),
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

function findInput(node: any) {
  return findNode(node, (candidate) => candidate.type === "Input")
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

async function loadSettingsWhatsApp(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()

  const Null = () => null
  const mutate = vi.fn()
  const whatsappGetStatus = vi.fn(async () => ({ available: true, connected: false }))
  let currentConfig: any = {
    whatsappEnabled: true,
    whatsappAllowFrom: ["14155551234"],
    whatsappAutoReply: false,
    whatsappLogMessages: false,
    remoteServerEnabled: false,
    remoteServerApiKey: "",
    streamerModeEnabled: false,
  }

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@renderer/components/ui/control", () => ({
    Control: (props: any) => ({ type: "Control", props }),
    ControlGroup: (props: any) => ({ type: "ControlGroup", props }),
    ControlLabel: (props: any) => ({ type: "ControlLabel", props }),
  }))
  vi.doMock("../components/ui/control", () => ({
    Control: (props: any) => ({ type: "Control", props }),
    ControlGroup: (props: any) => ({ type: "ControlGroup", props }),
    ControlLabel: (props: any) => ({ type: "ControlLabel", props }),
  }))
  vi.doMock("@renderer/components/ui/switch", () => ({ Switch: (props: any) => ({ type: "Switch", props }) }))
  vi.doMock("../components/ui/switch", () => ({ Switch: (props: any) => ({ type: "Switch", props }) }))
  vi.doMock("@renderer/components/ui/input", () => ({ Input: (props: any) => ({ type: "Input", props }) }))
  vi.doMock("../components/ui/input", () => ({ Input: (props: any) => ({ type: "Input", props }) }))
  vi.doMock("@renderer/components/ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
  vi.doMock("../components/ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
  vi.doMock("@renderer/lib/query-client", () => ({
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate }),
  }))
  vi.doMock("../lib/query-client", () => ({
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate }),
  }))
  vi.doMock("@renderer/lib/queries", () => ({
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate }),
  }))
  vi.doMock("../lib/queries", () => ({
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate }),
  }))
  vi.doMock("@renderer/lib/tipc-client", () => ({
    tipcClient: {
      whatsappGetStatus,
      whatsappConnect: vi.fn(async () => ({ success: true })),
      whatsappDisconnect: vi.fn(async () => ({ success: true })),
      whatsappLogout: vi.fn(async () => ({ success: true })),
    },
  }))
  vi.doMock("../lib/tipc-client", () => ({
    tipcClient: {
      whatsappGetStatus,
      whatsappConnect: vi.fn(async () => ({ success: true })),
      whatsappDisconnect: vi.fn(async () => ({ success: true })),
      whatsappLogout: vi.fn(async () => ({ success: true })),
    },
  }))
  vi.doMock("lucide-react", () => {
    const Icon = () => null
    return {
      AlertTriangle: Icon,
      Loader2: Icon,
      CheckCircle2: Icon,
      XCircle: Icon,
      RefreshCw: Icon,
      LogOut: Icon,
      QrCode: Icon,
      EyeOff: Icon,
    }
  })
  vi.doMock("qrcode.react", () => ({ QRCodeSVG: Null }))

  const mod = await import("./settings-whatsapp")
  return {
    Component: mod.Component,
    mutate,
    setConfig(nextConfig: any) {
      currentConfig = nextConfig
    },
    getCurrentConfig() {
      return currentConfig
    },
    whatsappGetStatus,
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

describe("desktop WhatsApp settings allowlist", () => {
  it("keeps a local draft and debounces config saves while editing", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig } = await loadSettingsWhatsApp(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let input = findInput(tree)
    expect(input.props.value).toBe("14155551234")

    input.props.onChange({ currentTarget: { value: "14155551234, +442071838750" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    input = findInput(tree)
    expect(input.props.value).toBe("14155551234, +442071838750")
    expect(mutate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(399)
    expect(mutate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        whatsappAllowFrom: ["14155551234", "+442071838750"],
      },
    })
  })

  it("flushes pending edits on blur and resyncs from updated config", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, setConfig, getCurrentConfig } = await loadSettingsWhatsApp(runtime)

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    let input = findInput(tree)
    input.props.onChange({ currentTarget: { value: "14155551234, 98389177934034" } })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    input = findInput(tree)
    input.props.onBlur()

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        whatsappAllowFrom: ["14155551234", "98389177934034"],
      },
    })

    setConfig({
      ...getCurrentConfig(),
      whatsappAllowFrom: ["98389177934034"],
    })

    tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    tree = runtime.render(Component, {} as any)
    input = findInput(tree)
    expect(input.props.value).toBe("98389177934034")
  })
})