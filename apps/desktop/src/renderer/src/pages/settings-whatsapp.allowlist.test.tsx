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

function getNodeText(node: any): string {
  return collectText(node).join(" ").replace(/\s+/g, " ").trim()
}

function findButtonByText(node: any, text: string) {
  return findNode(node, (candidate) => candidate.type === "Button" && getNodeText(candidate.props?.children).includes(text))
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function collectText(node: any, results: string[] = []): string[] {
  if (typeof node === "string") {
    results.push(node)
    return results
  }
  if (Array.isArray(node)) {
    for (const child of node) collectText(child, results)
    return results
  }
  if (node && typeof node === "object") {
    collectText(node.props?.children, results)
  }
  return results
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

async function loadSettingsWhatsApp(
  runtime: ReturnType<typeof createHookRuntime>,
  options?: {
    initialConfig?: Record<string, any>
    whatsappGetStatus?: ReturnType<typeof vi.fn>
    whatsappConnect?: ReturnType<typeof vi.fn>
    whatsappDisconnect?: ReturnType<typeof vi.fn>
    whatsappLogout?: ReturnType<typeof vi.fn>
  },
) {
  vi.resetModules()

  const Null = () => null
  const mutate = vi.fn()
  const whatsappGetStatus = options?.whatsappGetStatus ?? vi.fn(async () => ({ available: true, connected: false }))
  const whatsappConnect = options?.whatsappConnect ?? vi.fn(async () => ({ success: true }))
  const whatsappDisconnect = options?.whatsappDisconnect ?? vi.fn(async () => ({ success: true }))
  const whatsappLogout = options?.whatsappLogout ?? vi.fn(async () => ({ success: true }))
  let currentConfig: any = {
    whatsappEnabled: true,
    whatsappAllowFrom: ["14155551234"],
    whatsappAutoReply: false,
    whatsappLogMessages: false,
    remoteServerEnabled: false,
    remoteServerApiKey: "",
    streamerModeEnabled: false,
    ...options?.initialConfig,
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
      whatsappConnect,
      whatsappDisconnect,
      whatsappLogout,
    },
  }))
  vi.doMock("../lib/tipc-client", () => ({
    tipcClient: {
      whatsappGetStatus,
      whatsappConnect,
      whatsappDisconnect,
      whatsappLogout,
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
    whatsappConnect,
    whatsappDisconnect,
    whatsappLogout,
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
  it("shows a loading state before the first WhatsApp status check resolves", async () => {
    const runtime = createHookRuntime()
    const statusDeferred = createDeferred<{ available: boolean; connected: boolean }>()
    const { Component } = await loadSettingsWhatsApp(runtime, {
      whatsappGetStatus: vi.fn(() => statusDeferred.promise),
    })

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    tree = runtime.render(Component, {} as any)

    expect(collectText(tree)).toContain("Checking WhatsApp status...")
    expect(collectText(tree)).not.toContain("WhatsApp server not available")

    const refreshButton = findButtonByText(tree, "Checking...")
    expect(refreshButton.props.disabled).toBe(true)

    statusDeferred.resolve({ available: true, connected: false })
    await flushPromises()

    tree = runtime.render(Component, {} as any)
    expect(collectText(tree)).toContain("Not connected")
  })

  it("shows guidance that formatted phone numbers are accepted", async () => {
    const runtime = createHookRuntime()
    const { Component } = await loadSettingsWhatsApp(runtime)

    const tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    const input = findInput(tree)
    expect(input.props.placeholder).toBe("+14155551234, 98389177934034")
    expect(collectText(tree)).toContain("Enter phone numbers or LIDs separated by commas. Phone numbers can include formatting like +, spaces, or punctuation.")
  })

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
    input.props.onBlur({ currentTarget: { value: "14155551234, 98389177934034" } })

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

  it("flushes the latest draft on blur even without an intervening rerender", async () => {
    const runtime = createHookRuntime()
    const { Component, mutate, getCurrentConfig } = await loadSettingsWhatsApp(runtime)

    const tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    const input = findInput(tree)
    input.props.onChange({ currentTarget: { value: "14155551234, +442071838750" } })
    input.props.onBlur({ currentTarget: { value: "14155551234, +442071838750" } })

    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        whatsappAllowFrom: ["14155551234", "+442071838750"],
      },
    })
  })

  it("disables conflicting connection actions while disconnect is pending", async () => {
    const runtime = createHookRuntime()
    const disconnectDeferred = createDeferred<{ success: boolean }>()
    let statusCallCount = 0
    const { Component } = await loadSettingsWhatsApp(runtime, {
      whatsappGetStatus: vi.fn(async () => {
        statusCallCount += 1
        return statusCallCount === 1
          ? { available: true, connected: true, hasCredentials: true, userName: "AJ", phoneNumber: "+14155551234" }
          : { available: true, connected: false, hasCredentials: true }
      }),
      whatsappDisconnect: vi.fn(() => disconnectDeferred.promise),
    })

    let tree = runtime.render(Component, {} as any)
    runtime.commitEffects()
    await flushPromises()

    tree = runtime.render(Component, {} as any)
    findButtonByText(tree, "Disconnect").props.onClick()

    tree = runtime.render(Component, {} as any)
    expect(findButtonByText(tree, "Disconnecting...").props.disabled).toBe(true)
    expect(findButtonByText(tree, "Refresh").props.disabled).toBe(true)
    expect(findButtonByText(tree, "Logout").props.disabled).toBe(true)

    disconnectDeferred.resolve({ success: true })
    await flushPromises()

    tree = runtime.render(Component, {} as any)
    expect(collectText(tree)).toContain("Not connected")
    expect(findButtonByText(tree, "Refresh").props.disabled).toBe(false)
  })
})