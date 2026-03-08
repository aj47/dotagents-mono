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

function findNodes(node: any, predicate: (node: any) => boolean): any[] { if (node == null) return []; if (Array.isArray(node)) return node.flatMap(child => findNodes(child, predicate)); if (typeof node === "object") return [ ...(predicate(node) ? [node] : []), ...findNodes(node.props?.children, predicate) ]; return [] }
function findNode(node: any, predicate: (node: any) => boolean): any { return findNodes(node, predicate)[0] ?? null }
function findButtonsByText(node: any, text: string) { return findNodes(node, candidate => candidate.type === "Button" && candidate.props?.children === text) }
function findPortInput(node: any) { return findNode(node, candidate => candidate.type === "Input" && candidate.props?.type === "number" && candidate.props?.min === 1 && candidate.props?.max === 65535) }
function findCorsInput(node: any) { return findNode(node, candidate => candidate.type === "Input" && candidate.props?.placeholder === "* or http://localhost:8081, http://example.com") }
function findNamedTunnelIdInput(node: any) { return findNode(node, candidate => candidate.type === "Input" && candidate.props?.placeholder === "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx") }
function findNamedTunnelHostnameInput(node: any) { return findNode(node, candidate => candidate.type === "Input" && candidate.props?.placeholder === "myapp.example.com") }
function findNamedTunnelCredentialsInput(node: any) { return findNode(node, candidate => candidate.type === "Input" && candidate.props?.placeholder === "~/.cloudflared/<tunnel-id>.json (default)") }
function findStartTunnelButton(node: any) { return findNode(node, candidate => candidate.type === "Button" && candidate.props?.children === "Start Tunnel") }
function findStopTunnelButton(node: any) { return findNode(node, candidate => candidate.type === "Button" && candidate.props?.children === "Stop Tunnel") }
function hasText(node: any, text: string): boolean { if (node == null) return false; if (Array.isArray(node)) return node.some(child => hasText(child, text)); if (typeof node === "string") return node.includes(text); if (typeof node === "object") return hasText(node.props?.children, text); return false }

async function flushPromises() { await Promise.resolve(); await Promise.resolve() }

async function loadRemoteServerSettings(runtime: ReturnType<typeof createHookRuntime>, overrides: Record<string, any> = {}, queryOverrides: Record<string, any> = {}, tipcOverrides: Record<string, any> = {}) {
  vi.resetModules()
  const Null = () => null
  const mutate = vi.fn()
  const actionMutate = vi.fn()
  const copyTextToClipboard = vi.fn(async () => {})
  const toastError = vi.fn()
  const invalidateQueries = vi.fn()
  const queryData = { "cloudflared-installed": false, "cloudflared-logged-in": false, "cloudflare-tunnel-list": { tunnels: [] }, "cloudflare-tunnel-status": null, "remote-server-status": { running: false }, ...queryOverrides } as Record<string, any>
  let currentConfig: any = { remoteServerEnabled: true, remoteServerPort: 3210, remoteServerBindAddress: "127.0.0.1", remoteServerCorsOrigins: ["https://old.example.test"], streamerModeEnabled: false, ...overrides }
  const tipcClient = {
    checkCloudflaredInstalled: vi.fn(async () => queryData["cloudflared-installed"]),
    checkCloudflaredLoggedIn: vi.fn(async () => queryData["cloudflared-logged-in"]),
    listCloudflareTunnels: vi.fn(async () => queryData["cloudflare-tunnel-list"]),
    getCloudflareTunnelStatus: vi.fn(async () => queryData["cloudflare-tunnel-status"]),
    getRemoteServerStatus: vi.fn(async () => queryData["remote-server-status"]),
    startCloudflareTunnel: vi.fn(async () => ({ success: true })),
    startNamedCloudflareTunnel: vi.fn(async () => ({ success: true })),
    stopCloudflareTunnel: vi.fn(async () => undefined),
    printRemoteServerQRCode: vi.fn(),
    ...tipcOverrides,
  }
  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@tanstack/react-query", () => ({
    useQuery: (options: { queryKey?: string[] }) => ({ data: queryData[options?.queryKey?.[0] ?? ""], isLoading: false }),
    useMutation: (options: { mutationFn?: (args?: any) => any; onSuccess?: (result: any, args: any, context: any) => void; onError?: (error: any, args: any, context: any) => void }) => ({
      mutate: (args?: any) => {
        actionMutate(args)
        Promise.resolve()
          .then(() => options.mutationFn?.(args))
          .then((result) => options.onSuccess?.(result, args, undefined))
          .catch((error) => options.onError?.(error, args, undefined))
      },
      isPending: false,
    }),
    useQueryClient: () => ({ invalidateQueries }),
  }))
  vi.doMock("@renderer/lib/query-client", () => ({ useConfigQuery: () => ({ data: currentConfig }), useSaveConfigMutation: () => ({ mutate }) }))
  vi.doMock("@renderer/components/ui/control", () => ({ Control: (props: any) => ({ type: "Control", props }), ControlGroup: (props: any) => props.children, ControlLabel: (props: any) => props.label }))
  vi.doMock("@renderer/components/ui/input", () => ({ Input: (props: any) => ({ type: "Input", props }) }))
  vi.doMock("@renderer/components/ui/select", () => ({ Select: Null, SelectContent: Null, SelectItem: Null, SelectTrigger: Null, SelectValue: Null }))
  vi.doMock("@renderer/components/ui/switch", () => ({ Switch: Null }))
  vi.doMock("@renderer/components/ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
  vi.doMock("@renderer/lib/clipboard", () => ({ copyTextToClipboard }))
  vi.doMock("@renderer/lib/tipc-client", () => ({ tipcClient }))
  vi.doMock("qrcode.react", () => ({ QRCodeSVG: Null }))
  vi.doMock("lucide-react", () => ({ EyeOff: Null, ExternalLink: Null }))
  vi.doMock("sonner", () => ({ toast: { error: toastError } }))
  const mod = await import("./settings-remote-server")
  return { RemoteServerSettingsGroups: mod.RemoteServerSettingsGroups, mutate, actionMutate, copyTextToClipboard, toastError, tipcClient, invalidateQueries, setConfig(nextConfig: any) { currentConfig = nextConfig }, getCurrentConfig() { return currentConfig } }
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

describe("desktop named tunnel draft behavior", () => {
  it("keeps an empty tunnel-id draft local and only saves it on blur", async () => {
    const runtime = createHookRuntime()
    const { RemoteServerSettingsGroups, mutate, getCurrentConfig } = await loadRemoteServerSettings(
      runtime,
      { cloudflareTunnelMode: "named", cloudflareTunnelId: "old-tunnel-id" },
      { "cloudflared-logged-in": true },
    )
    let tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    let input = findNamedTunnelIdInput(tree)
    expect(input.props.value).toBe("old-tunnel-id")
    input.props.onChange({ currentTarget: { value: "" } })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    input = findNamedTunnelIdInput(tree)
    expect(input.props.value).toBe("")
    expect(mutate).not.toHaveBeenCalled()
    input.props.onBlur({ currentTarget: { value: "" } })
    expect(mutate).toHaveBeenCalledWith({ config: { ...getCurrentConfig(), cloudflareTunnelId: "" } })
  })

  it("debounces hostname saves and resyncs the visible draft from saved config", async () => {
    const runtime = createHookRuntime()
    const { RemoteServerSettingsGroups, mutate, setConfig, getCurrentConfig } = await loadRemoteServerSettings(
      runtime,
      { cloudflareTunnelMode: "named", cloudflareTunnelHostname: "old.example.test" },
      { "cloudflared-logged-in": true },
    )
    let tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    let input = findNamedTunnelHostnameInput(tree)
    input.props.onChange({ currentTarget: { value: "new.example.test" } })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    input = findNamedTunnelHostnameInput(tree)
    expect(input.props.value).toBe("new.example.test")
    vi.advanceTimersByTime(399)
    expect(mutate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(mutate).toHaveBeenCalledWith({ config: { ...getCurrentConfig(), cloudflareTunnelHostname: "new.example.test" } })
    setConfig({ ...getCurrentConfig(), cloudflareTunnelHostname: "saved.example.test" })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    input = findNamedTunnelHostnameInput(tree)
    expect(input.props.value).toBe("saved.example.test")
  })

  it("uses current named-tunnel drafts for validation and start without waiting for config refetch", async () => {
    const runtime = createHookRuntime()
    const { RemoteServerSettingsGroups, mutate, actionMutate, getCurrentConfig } = await loadRemoteServerSettings(
      runtime,
      { cloudflareTunnelMode: "named", cloudflareTunnelId: "", cloudflareTunnelHostname: "", cloudflareTunnelCredentialsPath: "" },
      { "cloudflared-logged-in": true },
    )
    let tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    findNamedTunnelIdInput(tree).props.onChange({ currentTarget: { value: "new-tunnel-id" } })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    expect(hasText(tree, "Enter Hostname to start")).toBe(true)
    findNamedTunnelHostnameInput(tree).props.onChange({ currentTarget: { value: "app.example.com" } })
    findNamedTunnelCredentialsInput(tree).props.onChange({ currentTarget: { value: "/tmp/cloudflare-tunnel.json" } })
    tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()
    const startButton = findStartTunnelButton(tree)
    expect(startButton.props.disabled).toBe(false)
    expect(mutate).not.toHaveBeenCalled()
    startButton.props.onClick()
    expect(mutate).toHaveBeenCalledWith({
      config: {
        ...getCurrentConfig(),
        cloudflareTunnelId: "new-tunnel-id",
        cloudflareTunnelHostname: "app.example.com",
        cloudflareTunnelCredentialsPath: "/tmp/cloudflare-tunnel.json",
      },
    })
    expect(actionMutate).toHaveBeenCalledWith({
      tunnelId: "new-tunnel-id",
      hostname: "app.example.com",
      credentialsPath: "/tmp/cloudflare-tunnel.json",
    })
  })
})

describe("desktop remote server copy failure feedback", () => {
  it("shows visible error toasts when copy actions reject", async () => {
    const runtime = createHookRuntime()
    const { RemoteServerSettingsGroups, copyTextToClipboard, toastError } = await loadRemoteServerSettings(
      runtime,
      { remoteServerApiKey: "secret-key" },
      {
        "cloudflared-installed": true,
        "cloudflare-tunnel-status": { running: true, url: "https://public.example.test", mode: "quick" },
        "remote-server-status": { running: true, connectableUrl: "http://192.168.1.50:3210/v1" },
      },
    )
    copyTextToClipboard.mockRejectedValue(new Error("clipboard unavailable"))

    const tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()

    const [apiKeyCopyButton, tunnelUrlCopyButton] = findButtonsByText(tree, "Copy")
    const [localDeepLinkButton, tunnelDeepLinkButton] = findButtonsByText(tree, "Copy Deep Link")

    apiKeyCopyButton.props.onClick()
    localDeepLinkButton.props.onClick()
    tunnelUrlCopyButton.props.onClick()
    tunnelDeepLinkButton.props.onClick()
    await Promise.resolve()
    await Promise.resolve()

    expect(copyTextToClipboard).toHaveBeenNthCalledWith(1, "secret-key")
    expect(copyTextToClipboard).toHaveBeenNthCalledWith(2, "dotagents://config?baseUrl=http%3A%2F%2F192.168.1.50%3A3210%2Fv1&apiKey=secret-key")
    expect(copyTextToClipboard).toHaveBeenNthCalledWith(3, "https://public.example.test/v1")
    expect(copyTextToClipboard).toHaveBeenNthCalledWith(4, "dotagents://config?baseUrl=https%3A%2F%2Fpublic.example.test%2Fv1&apiKey=secret-key")
    expect(toastError).toHaveBeenNthCalledWith(1, "Failed to copy remote server API key: clipboard unavailable")
    expect(toastError).toHaveBeenNthCalledWith(2, "Failed to copy deep link: clipboard unavailable")
    expect(toastError).toHaveBeenNthCalledWith(3, "Failed to copy tunnel URL: clipboard unavailable")
    expect(toastError).toHaveBeenNthCalledWith(4, "Failed to copy tunnel deep link: clipboard unavailable")
  })
})

describe("desktop remote tunnel action failure feedback", () => {
  it("shows a visible toast when starting a tunnel resolves with success false", async () => {
    const runtime = createHookRuntime()
    const { RemoteServerSettingsGroups, toastError, tipcClient, invalidateQueries } = await loadRemoteServerSettings(
      runtime,
      {},
      { "cloudflared-installed": true },
      {
        startCloudflareTunnel: vi.fn(async () => ({ success: false, error: "cloudflared is not installed" })),
      },
    )

    const tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()

    findStartTunnelButton(tree).props.onClick()
    await flushPromises()

    expect(tipcClient.startCloudflareTunnel).toHaveBeenCalledOnce()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["cloudflare-tunnel-status"] })
    expect(toastError).toHaveBeenCalledWith("Failed to start tunnel: cloudflared is not installed")
  })

  it("shows a visible toast when stopping a tunnel rejects", async () => {
    const runtime = createHookRuntime()
    const { RemoteServerSettingsGroups, toastError, tipcClient } = await loadRemoteServerSettings(
      runtime,
      {},
      {
        "cloudflared-installed": true,
        "cloudflare-tunnel-status": { running: true, starting: false, url: "https://public.example.test", error: null, mode: "quick" },
      },
      {
        stopCloudflareTunnel: vi.fn(async () => {
          throw new Error("IPC unavailable")
        }),
      },
    )

    const tree = runtime.render(RemoteServerSettingsGroups, {} as any)
    runtime.commitEffects()

    findStopTunnelButton(tree).props.onClick()
    await flushPromises()

    expect(tipcClient.stopCloudflareTunnel).toHaveBeenCalledOnce()
    expect(toastError).toHaveBeenCalledWith("Failed to stop tunnel: IPC unavailable")
  })
})