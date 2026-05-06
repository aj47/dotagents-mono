import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"

const settingsDiscordSource = readFileSync(new URL("./settings-discord.tsx", import.meta.url), "utf8")

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

function findButton(node: any, label: string) {
  return findNode(node, (candidate) => candidate.type === "Button" && collectText(candidate.props?.children).join(" ").includes(label))
}

function findInput(node: any, placeholder: string) {
  return findNode(node, (candidate) => candidate.type === "Input" && candidate.props?.placeholder === placeholder)
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

async function renderSettled(runtime: ReturnType<typeof createHookRuntime>, Component: (props: any) => any) {
  let tree = runtime.render(Component, {} as any)
  runtime.commitEffects()
  await flushPromises()
  await flushPromises()
  tree = runtime.render(Component, {} as any)
  return tree
}

async function loadSettingsDiscord(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()

  const Icon = () => null
  const mutate = vi.fn()
  const mutateAsync = vi.fn(async ({ config }: { config: any }) => {
    currentConfig = config
  })
  const discordConnect = vi.fn(async () => ({ success: true }))
  let currentStatus: any = {
    available: true,
    enabled: true,
    connected: false,
    connecting: false,
  }
  let currentConfig: any = {
    discordEnabled: true,
    discordBotToken: "",
    discordAllowUserIds: [],
    discordAllowGuildIds: [],
    discordAllowChannelIds: [],
    discordDmEnabled: true,
    discordRequireMention: true,
    discordLogMessages: false,
    discordDefaultProfileId: undefined,
  }

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@renderer/components/ui/control", () => ({
    Control: (props: any) => ({ type: "Control", props }),
    ControlGroup: (props: any) => ({ type: "ControlGroup", props }),
  }))
  vi.doMock("../components/ui/control", () => ({
    Control: (props: any) => ({ type: "Control", props }),
    ControlGroup: (props: any) => ({ type: "ControlGroup", props }),
  }))
  vi.doMock("@renderer/components/ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
  vi.doMock("../components/ui/button", () => ({ Button: (props: any) => ({ type: "Button", props }) }))
  vi.doMock("@renderer/components/ui/input", () => ({ Input: (props: any) => ({ type: "Input", props }) }))
  vi.doMock("../components/ui/input", () => ({ Input: (props: any) => ({ type: "Input", props }) }))
  vi.doMock("@renderer/components/ui/select", () => ({
    Select: (props: any) => ({ type: "Select", props }),
    SelectContent: (props: any) => ({ type: "SelectContent", props }),
    SelectItem: (props: any) => ({ type: "SelectItem", props }),
    SelectTrigger: (props: any) => ({ type: "SelectTrigger", props }),
    SelectValue: (props: any) => ({ type: "SelectValue", props }),
  }))
  vi.doMock("../components/ui/select", () => ({
    Select: (props: any) => ({ type: "Select", props }),
    SelectContent: (props: any) => ({ type: "SelectContent", props }),
    SelectItem: (props: any) => ({ type: "SelectItem", props }),
    SelectTrigger: (props: any) => ({ type: "SelectTrigger", props }),
    SelectValue: (props: any) => ({ type: "SelectValue", props }),
  }))
  vi.doMock("@renderer/components/ui/switch", () => ({ Switch: (props: any) => ({ type: "Switch", props }) }))
  vi.doMock("../components/ui/switch", () => ({ Switch: (props: any) => ({ type: "Switch", props }) }))
  vi.doMock("@renderer/components/ui/textarea", () => ({ Textarea: (props: any) => ({ type: "Textarea", props }) }))
  vi.doMock("../components/ui/textarea", () => ({ Textarea: (props: any) => ({ type: "Textarea", props }) }))
  vi.doMock("@renderer/lib/queries", () => ({
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate, mutateAsync }),
  }))
  vi.doMock("../lib/queries", () => ({
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate, mutateAsync }),
  }))
  vi.doMock("@renderer/lib/queries", () => ({
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate, mutateAsync }),
  }))
  vi.doMock("../lib/queries", () => ({
    useConfigQuery: () => ({ data: currentConfig }),
    useSaveConfigMutation: () => ({ mutate, mutateAsync }),
  }))
  vi.doMock("@renderer/lib/tipc-client", () => ({
    tipcClient: {
      discordGetStatus: vi.fn(async () => currentStatus),
      discordGetLogs: vi.fn(async () => []),
      getAgentProfiles: vi.fn(async () => []),
      discordConnect,
      discordDisconnect: vi.fn(async () => ({ success: true })),
      discordClearLogs: vi.fn(),
    },
  }))
  vi.doMock("../lib/tipc-client", () => ({
    tipcClient: {
      discordGetStatus: vi.fn(async () => currentStatus),
      discordGetLogs: vi.fn(async () => []),
      getAgentProfiles: vi.fn(async () => []),
      discordConnect,
      discordDisconnect: vi.fn(async () => ({ success: true })),
      discordClearLogs: vi.fn(),
    },
  }))
  vi.doMock("lucide-react", () => ({
    AlertTriangle: Icon,
    CheckCircle2: Icon,
    RefreshCw: Icon,
    Trash2: Icon,
    XCircle: Icon,
  }))

  const mod = await import("./settings-discord")
  return {
    Component: mod.Component,
    mutate,
    mutateAsync,
    discordConnect,
    setStatus(nextStatus: any) {
      currentStatus = nextStatus
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

describe("desktop Discord settings review comment fixes", () => {
  it("uses shared chat-agent filtering for Discord profile choices", () => {
    expect(settingsDiscordSource).toContain("getEnabledChatAgentProfiles(nextProfiles as AgentProfile[])")
    expect(settingsDiscordSource).not.toContain("profile.enabled !== false && (profile.role === \"chat-agent\"")
  })

  it("shows Discord as unavailable and disables connect actions when the dependency is missing", async () => {
    const runtime = createHookRuntime()
    const { Component, setStatus } = await loadSettingsDiscord(runtime)
    setStatus({
      available: false,
      enabled: true,
      connected: false,
      connecting: false,
      lastError: "Discord support is unavailable because the optional discord.js package is not installed in this build.",
    })

    const tree = await renderSettled(runtime, Component)
    const connectButton = findButton(tree, "Connect")
    const disconnectButton = findButton(tree, "Disconnect")
    const treeText = collectText(tree).join(" ")

    expect(treeText).toContain("Discord support unavailable")
    expect(treeText).toContain("optional discord.js package is not installed")
    expect(connectButton.props.disabled).toBe(true)
    expect(disconnectButton.props.disabled).toBe(true)
  })

  it("flushes the token draft before connecting", async () => {
    const runtime = createHookRuntime()
    const { Component, mutateAsync, discordConnect } = await loadSettingsDiscord(runtime)

    let tree = await renderSettled(runtime, Component)
    const input = findInput(tree, "Paste your Discord bot token")
    input.props.onChange({ target: { value: "updated-token" } })

    tree = runtime.render(Component, {} as any)
    const connectButton = findButton(tree, "Connect")
    connectButton.props.onClick()

    await flushPromises()
    await flushPromises()

    expect(mutateAsync).toHaveBeenCalledWith({
      config: expect.objectContaining({
        discordBotToken: "updated-token",
      }),
    })
    expect(discordConnect).toHaveBeenCalledTimes(1)
    expect(mutateAsync.mock.invocationCallOrder[0]).toBeLessThan(discordConnect.mock.invocationCallOrder[0])
  })
})
