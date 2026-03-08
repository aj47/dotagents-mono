import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type EffectRecord = { callback?: () => void | (() => void); deps?: any[]; nextDeps?: any[]; cleanup?: void | (() => void); hasRun: boolean }

function createHookRuntime() {
  const states: any[] = []; const refs: Array<{ current: any }> = []; const effects: EffectRecord[] = []
  let stateIndex = 0; let refIndex = 0; let effectIndex = 0
  const depsChanged = (prev?: any[], next?: any[]) => !prev || !next || prev.length !== next.length || prev.some((value, index) => !Object.is(value, next[index]))
  const useState = <T,>(initial: T | (() => T)) => { const idx = stateIndex++; if (states[idx] === undefined) states[idx] = typeof initial === "function" ? (initial as () => T)() : initial; return [states[idx] as T, (update: T | ((prev: T) => T)) => { states[idx] = typeof update === "function" ? (update as (prev: T) => T)(states[idx]) : update }] as const }
  const useRef = <T,>(initial: T) => { const idx = refIndex++; refs[idx] ??= { current: initial }; return refs[idx] as { current: T } }
  const useEffect = (callback: () => void | (() => void), deps?: any[]) => { const idx = effectIndex++; const record = effects[idx] ?? { hasRun: false }; record.callback = callback; record.nextDeps = deps; effects[idx] = record }
  const reactMock: any = { __esModule: true, default: {} as any, useState, useRef, useEffect, useCallback: (fn: any) => fn, useMemo: (factory: any) => factory() }
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

function findNode(node: any, predicate: (node: any) => boolean): any { if (node == null) return null; if (Array.isArray(node)) return node.map(child => findNode(child, predicate)).find(Boolean) ?? null; if (typeof node === "object") return predicate(node) ? node : findNode(node.props?.children, predicate); return null }
function findPortInput(node: any) { return findNode(node, candidate => candidate.type === "Input" && candidate.props?.type === "number" && candidate.props?.min === 1 && candidate.props?.max === 65535) }
function findCorsInput(node: any) { return findNode(node, candidate => candidate.type === "Input" && candidate.props?.placeholder === "* or http://localhost:8081, http://example.com") }

async function loadRemoteServerSettings(runtime: ReturnType<typeof createHookRuntime>, overrides: Record<string, any> = {}) {
  vi.resetModules()
  const Null = () => null
  const mutate = vi.fn()
  const queryData = { "cloudflared-installed": false, "cloudflared-logged-in": false, "cloudflare-tunnel-list": { tunnels: [] }, "cloudflare-tunnel-status": null, "remote-server-status": { running: false } } as Record<string, any>
  let currentConfig: any = { remoteServerEnabled: true, remoteServerPort: 3210, remoteServerBindAddress: "127.0.0.1", remoteServerCorsOrigins: ["https://old.example.test"], streamerModeEnabled: false, ...overrides }
  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@tanstack/react-query", () => ({ useQuery: (options: { queryKey?: string[] }) => ({ data: queryData[options?.queryKey?.[0] ?? ""], isLoading: false }), useMutation: () => ({ mutate: vi.fn(), isPending: false }), useQueryClient: () => ({ invalidateQueries: vi.fn() }) }))
  vi.doMock("@renderer/lib/query-client", () => ({ useConfigQuery: () => ({ data: currentConfig }), useSaveConfigMutation: () => ({ mutate }) }))
  vi.doMock("@renderer/components/ui/control", () => ({ Control: (props: any) => ({ type: "Control", props }), ControlGroup: (props: any) => props.children, ControlLabel: (props: any) => props.label }))
  vi.doMock("@renderer/components/ui/input", () => ({ Input: (props: any) => ({ type: "Input", props }) }))
  vi.doMock("@renderer/components/ui/select", () => ({ Select: Null, SelectContent: Null, SelectItem: Null, SelectTrigger: Null, SelectValue: Null }))
  vi.doMock("@renderer/components/ui/switch", () => ({ Switch: Null }))
  vi.doMock("@renderer/components/ui/button", () => ({ Button: Null }))
  vi.doMock("@renderer/lib/clipboard", () => ({ copyTextToClipboard: vi.fn(async () => {}) }))
  vi.doMock("@renderer/lib/tipc-client", () => ({ tipcClient: {} }))
  vi.doMock("qrcode.react", () => ({ QRCodeSVG: Null }))
  vi.doMock("lucide-react", () => ({ EyeOff: Null, ExternalLink: Null }))
  const mod = await import("./settings-remote-server")
  return { RemoteServerSettingsGroups: mod.RemoteServerSettingsGroups, mutate, setConfig(nextConfig: any) { currentConfig = nextConfig }, getCurrentConfig() { return currentConfig } }
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.resetModules() })

describe("desktop remote server port draft behavior", () => {
  it("keeps an empty port draft local and resets invalid blur states back to the saved port", async () => {
    const runtime = createHookRuntime()
    const { RemoteServerSettingsGroups, mutate } = await loadRemoteServerSettings(runtime)
    let tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    let input = findPortInput(tree)
    expect(input.props.value).toBe("3210")
    input.props.onChange({ currentTarget: { value: "" } })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    input = findPortInput(tree)
    expect(input.props.value).toBe("")
    expect(mutate).not.toHaveBeenCalled()
    input.props.onBlur({ currentTarget: { value: "" } })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    input = findPortInput(tree)
    expect(input.props.value).toBe("3210")
    expect(mutate).not.toHaveBeenCalled()
  })

  it("debounces valid port saves and resyncs the visible draft from saved config", async () => {
    const runtime = createHookRuntime()
    const { RemoteServerSettingsGroups, mutate, setConfig, getCurrentConfig } = await loadRemoteServerSettings(runtime)
    let tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    let input = findPortInput(tree)
    input.props.onChange({ currentTarget: { value: "8080" } })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    input = findPortInput(tree)
    expect(input.props.value).toBe("8080")
    vi.advanceTimersByTime(399)
    expect(mutate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(mutate).toHaveBeenCalledWith({ config: { ...getCurrentConfig(), remoteServerPort: 8080 } })
    setConfig({ ...getCurrentConfig(), remoteServerPort: 9443 })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    input = findPortInput(tree)
    expect(input.props.value).toBe("9443")
  })

  it("cancels a pending port save when a once-valid draft becomes invalid before the debounce fires", async () => {
    const runtime = createHookRuntime()
    const { RemoteServerSettingsGroups, mutate } = await loadRemoteServerSettings(runtime)
    let tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    let input = findPortInput(tree)
    input.props.onChange({ currentTarget: { value: "8080" } })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    input = findPortInput(tree)
    input.props.onChange({ currentTarget: { value: "" } })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    input = findPortInput(tree)
    expect(input.props.value).toBe("")
    vi.advanceTimersByTime(400)
    expect(mutate).not.toHaveBeenCalled()
  })
})

describe("desktop remote server CORS origins draft behavior", () => {
  it("keeps an empty draft local while the user is replacing the CORS origins list", async () => {
    const runtime = createHookRuntime()
    const { RemoteServerSettingsGroups, mutate, getCurrentConfig } = await loadRemoteServerSettings(runtime)
    let tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    let input = findCorsInput(tree)
    expect(input.props.value).toBe("https://old.example.test")
    input.props.onChange({ currentTarget: { value: "" } })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    input = findCorsInput(tree)
    expect(input.props.value).toBe("")
    expect(mutate).not.toHaveBeenCalled()
    input.props.onBlur({ currentTarget: { value: "" } })
    expect(mutate).toHaveBeenCalledWith({ config: { ...getCurrentConfig(), remoteServerCorsOrigins: ["*"] } })
  })

  it("debounces CORS origins saves and resyncs the visible draft from saved config", async () => {
    const runtime = createHookRuntime()
    const { RemoteServerSettingsGroups, mutate, setConfig, getCurrentConfig } = await loadRemoteServerSettings(runtime)
    let tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    let input = findCorsInput(tree)
    input.props.onChange({ currentTarget: { value: "http://localhost:8081, http://example.com" } })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    input = findCorsInput(tree)
    expect(input.props.value).toBe("http://localhost:8081, http://example.com")
    vi.advanceTimersByTime(399)
    expect(mutate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(mutate).toHaveBeenCalledWith({ config: { ...getCurrentConfig(), remoteServerCorsOrigins: ["http://localhost:8081", "http://example.com"] } })
    setConfig({ ...getCurrentConfig(), remoteServerCorsOrigins: ["https://saved.example.test"] })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    input = findCorsInput(tree)
    expect(input.props.value).toBe("https://saved.example.test")
  })
})