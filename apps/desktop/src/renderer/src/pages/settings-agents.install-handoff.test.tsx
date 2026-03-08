import { afterEach, describe, expect, it, vi } from "vitest"

type EffectRecord = { callback?: () => void | (() => void); deps?: any[]; nextDeps?: any[]; cleanup?: void | (() => void); hasRun: boolean }

function createHookRuntime() {
  const states: any[] = []
  const refs: Array<{ current: any }> = []
  const effects: EffectRecord[] = []
  let stateIndex = 0, refIndex = 0, effectIndex = 0
  const depsChanged = (prev?: any[], next?: any[]) => !prev || !next || prev.length !== next.length || prev.some((v, i) => !Object.is(v, next[i]))
  const useState = <T,>(initial: T | (() => T)) => {
    const idx = stateIndex++
    if (states[idx] === undefined) states[idx] = typeof initial === "function" ? (initial as () => T)() : initial
    return [states[idx] as T, (update: T | ((prev: T) => T)) => { states[idx] = typeof update === "function" ? (update as (prev: T) => T)(states[idx]) : update }] as const
  }
  const useRef = <T,>(initial: T) => (refs[refIndex] ??= { current: initial }) as { current: T }
  const useEffect = (callback: EffectRecord["callback"], deps?: any[]) => { effects[effectIndex] = { ...(effects[effectIndex] ?? { hasRun: false }), callback, nextDeps: deps }; effectIndex += 1 }
  const render = <P,>(Component: (props: P) => any, props: P) => { stateIndex = 0; refIndex = 0; effectIndex = 0; return Component(props) }
  const commitEffects = () => { for (const effect of effects) { if (!effect?.callback) continue; if (!effect.hasRun || depsChanged(effect.deps, effect.nextDeps)) { if (typeof effect.cleanup === "function") effect.cleanup(); effect.cleanup = effect.callback(); effect.deps = effect.nextDeps; effect.hasRun = true } } }
  const invoke = (type: any, props: any) => typeof type === "function" ? type(props) : null
  return {
    render,
    commitEffects,
    reactMock: { __esModule: true, default: {} as any, useState, useRef: <T,>(initial: T) => { const ref = useRef(initial); refIndex += 1; return ref }, useEffect },
    jsxRuntimeMock: { __esModule: true, jsx: invoke, jsxs: invoke, jsxDEV: invoke, Fragment: Symbol.for("react.fragment") },
  }
}

async function flushPromises() { await Promise.resolve(); await Promise.resolve() }

async function loadSettingsAgents(
  runtime: ReturnType<typeof createHookRuntime>,
  installBundlePath: string,
  installBundleSource?: string,
) {
  vi.resetModules()
  const Null = () => null
  let currentSearchParams = installBundlePath
    ? new URLSearchParams([
      ["installBundle", installBundlePath],
      ...(installBundleSource ? [["installBundleSource", installBundleSource]] as const : []),
    ])
    : new URLSearchParams()
  const setSearchParams = vi.fn((next: URLSearchParams) => { currentSearchParams = new URLSearchParams(next) })
  const dialogProps = { current: null as any }
  const exportDialogProps = { current: null as any }
  const publishDialogProps = { current: null as any }
  const buttonProps = new Map<string, any>()
  const collectText = (children: any): string => {
    if (typeof children === "string" || typeof children === "number") return String(children)
    if (Array.isArray(children)) return children.map(collectText).join("")
    return ""
  }
  runtime.reactMock.default = runtime.reactMock
  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react-router-dom", () => ({ useNavigate: () => vi.fn(), useSearchParams: () => [currentSearchParams, setSearchParams] }))
  vi.doMock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }))
  const settingsTipcMock = { tipcClient: { getAgentProfiles: vi.fn(async () => []), getDefaultSystemPrompt: vi.fn(async () => "") } }
  vi.doMock("../lib/tipc-client", () => settingsTipcMock)
  vi.doMock("@renderer/lib/tipc-client", () => settingsTipcMock)
  vi.doMock("../components/bundle-import-dialog", () => ({ BundleImportDialog: (props: any) => { dialogProps.current = props; return null } }))
  vi.doMock("../components/bundle-export-dialog", () => ({ BundleExportDialog: (props: any) => { exportDialogProps.current = props; return null } }))
  vi.doMock("@renderer/components/bundle-export-dialog", () => ({ BundleExportDialog: (props: any) => { exportDialogProps.current = props; return null } }))
  vi.doMock("../components/bundle-publish-dialog", () => ({ BundlePublishDialog: (props: any) => { publishDialogProps.current = props; return null } }))
  vi.doMock("@renderer/components/bundle-publish-dialog", () => ({ BundlePublishDialog: (props: any) => { publishDialogProps.current = props; return null } }))
  vi.doMock("../components/model-selector", () => ({ ModelSelector: Null }))
  vi.doMock("../components/ui/button", () => ({ Button: (props: any) => { const label = collectText(props.children).trim(); if (label) buttonProps.set(label, props); return null } }))
  vi.doMock("../components/ui/input", () => ({ Input: Null }))
  vi.doMock("../components/ui/label", () => ({ Label: Null }))
  vi.doMock("../components/ui/textarea", () => ({ Textarea: Null }))
  vi.doMock("../components/ui/switch", () => ({ Switch: Null }))
  vi.doMock("../components/ui/select", () => ({ Select: Null, SelectContent: Null, SelectItem: Null, SelectTrigger: Null, SelectValue: Null }))
  vi.doMock("../components/ui/card", () => ({ Card: Null, CardContent: Null, CardDescription: Null, CardHeader: Null, CardTitle: Null }))
  vi.doMock("../components/ui/badge", () => ({ Badge: Null }))
  vi.doMock("../components/ui/tabs", () => ({ Tabs: Null, TabsList: Null, TabsTrigger: Null, TabsContent: Null }))
  vi.doMock("facehash", () => ({ Facehash: Null }))
  vi.doMock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
  vi.doMock("lucide-react", () => { const Icon = () => null; return { Trash2: Icon, Plus: Icon, Edit2: Icon, Save: Icon, X: Icon, Server: Icon, Sparkles: Icon, Brain: Icon, Settings2: Icon, ChevronDown: Icon, ChevronRight: Icon, Wrench: Icon, RefreshCw: Icon, ExternalLink: Icon, Download: Icon, Upload: Icon, Globe: Icon } })
  const mod = await import("./settings-agents")
  return { SettingsAgents: mod.SettingsAgents, dialogProps, exportDialogProps, publishDialogProps, buttonProps, setSearchParams }
}

async function loadBundleImportDialogHelper() {
  vi.resetModules()
  vi.doUnmock("../components/bundle-import-dialog")
  vi.doUnmock("react")
  vi.doUnmock("react/jsx-runtime")
  vi.doUnmock("react/jsx-dev-runtime")
  const Null = () => null
  const previewBundleWithConflicts = vi.fn(async ({ filePath }: { filePath: string }) => ({ filePath, bundle: null, manifest: { version: 1, name: "Hub Bundle", createdAt: "", exportedFrom: "", components: { agentProfiles: 1, mcpServers: 0, skills: 0, repeatTasks: 0, memories: 0 } }, conflicts: { agentProfiles: [], mcpServers: [], skills: [], repeatTasks: [], memories: [] } }))
  const bundleTipcMock = { tipcClient: { previewBundleWithConflicts, previewBundleFromDialog: vi.fn(), importBundle: vi.fn() } }
  vi.doMock("../lib/tipc-client", () => bundleTipcMock)
  vi.doMock("@renderer/lib/tipc-client", () => bundleTipcMock)
  vi.doMock("../components/ui/dialog", () => ({ Dialog: Null, DialogContent: Null, DialogDescription: Null, DialogFooter: Null, DialogHeader: Null, DialogTitle: Null }))
  vi.doMock("../components/ui/button", () => ({ Button: Null }))
  vi.doMock("../components/ui/label", () => ({ Label: Null }))
  vi.doMock("../components/ui/switch", () => ({ Switch: Null }))
  vi.doMock("../components/ui/badge", () => ({ Badge: Null }))
  vi.doMock("../components/ui/select", () => ({ Select: Null, SelectContent: Null, SelectItem: Null, SelectTrigger: Null, SelectValue: Null }))
  vi.doMock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
  vi.doMock("lucide-react", () => { const Icon = () => null; return { Loader2: Icon, AlertTriangle: Icon, Package: Icon, Bot: Icon, Server: Icon, Sparkles: Icon, Clock: Icon, Brain: Icon, ExternalLink: Icon } })
  const mod = await import("../components/bundle-import-dialog")
  return { previewProvidedBundleFile: mod.previewProvidedBundleFile, previewBundleWithConflicts }
}

afterEach(() => { vi.restoreAllMocks(); vi.resetModules() })

describe("settings-agents Hub install handoff", () => {
  it("opens the existing bundle import dialog from the installBundle query param", async () => {
    const runtime = createHookRuntime()
    const bundlePath = "/tmp/from-hub.dotagents"
    const bundleSource = "https://hub.dotagentsprotocol.com/bundles/from-hub.dotagents"
    const { SettingsAgents, dialogProps, setSearchParams } = await loadSettingsAgents(runtime, bundlePath, bundleSource)
    runtime.render(SettingsAgents, {})
    runtime.commitEffects()
    await flushPromises()
    runtime.render(SettingsAgents, {})

    expect(dialogProps.current.open).toBe(true)
    expect(dialogProps.current.initialFilePath).toBe(bundlePath)
    expect(dialogProps.current.title).toBe("Install Hub Bundle")
    expect(dialogProps.current.confirmLabel).toBe("Install")
    expect(dialogProps.current.successVerb).toBe("installed")
    expect(dialogProps.current.sourceLabel).toBe("Downloaded from Hub")
    expect(dialogProps.current.sourceUrl).toBe(bundleSource)
    expect(setSearchParams).toHaveBeenCalled()
    expect(setSearchParams.mock.calls[0][0].get("installBundle")).toBeNull()
    expect(setSearchParams.mock.calls[0][0].get("installBundleSource")).toBeNull()
  })

  it("keeps Export Bundle and Export for Hub as separate configurable flows", async () => {
    const runtime = createHookRuntime()
    const {
      SettingsAgents,
      exportDialogProps,
      publishDialogProps,
      buttonProps,
    } = await loadSettingsAgents(runtime, "")

    runtime.render(SettingsAgents, {})
    runtime.commitEffects()
    await flushPromises()
    runtime.render(SettingsAgents, {})

    expect(exportDialogProps.current.open).toBe(false)
    expect(publishDialogProps.current.open).toBe(false)

    buttonProps.get("Export Bundle").onClick()
    runtime.render(SettingsAgents, {})
    expect(exportDialogProps.current.open).toBe(true)
    expect(publishDialogProps.current.open).toBe(false)

    buttonProps.get("Export for Hub").onClick()
    runtime.render(SettingsAgents, {})
    expect(publishDialogProps.current.open).toBe(true)
  })

  it("previews a provided Hub bundle path through the existing conflict-aware dialog flow", async () => {
    const bundlePath = "/tmp/from-hub.dotagents"
    const { previewProvidedBundleFile, previewBundleWithConflicts } = await loadBundleImportDialogHelper()
    await previewProvidedBundleFile(bundlePath)

    expect(previewBundleWithConflicts).toHaveBeenCalledWith({ filePath: bundlePath })
  })
})