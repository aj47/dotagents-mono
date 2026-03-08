import { afterEach, describe, expect, it, vi } from "vitest"

type EffectRecord = { callback?: () => void | (() => void), deps?: any[], nextDeps?: any[], cleanup?: void | (() => void), hasRun: boolean }

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
  const useRef = <T,>(initial: T) => {
    const idx = refIndex++
    refs[idx] ??= { current: initial }
    return refs[idx] as { current: T }
  }
  const useEffect = (callback: () => void | (() => void), deps?: any[]) => {
    const idx = effectIndex++
    effects[idx] ??= { hasRun: false }
    effects[idx].callback = callback
    effects[idx].nextDeps = deps
  }
  const reactMock: any = { __esModule: true, useState, useRef, useEffect, createContext: (v: any) => ({ _currentValue: v }), useContext: (c: any) => c?._currentValue }
  reactMock.default = reactMock
  const Fragment = Symbol.for("react.fragment")
  const invoke = (type: any, props: any) => type === Fragment ? (props?.children ?? null) : typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {} }
  return {
    render<P,>(Component: (props: P) => any, props: P) { stateIndex = 0; refIndex = 0; effectIndex = 0; return Component(props) },
    commitEffects() {
      for (const effect of effects) {
        if (!effect?.callback) continue
        const shouldRun = !effect.hasRun || depsChanged(effect.deps, effect.nextDeps)
        if (!shouldRun) continue
        if (typeof effect.cleanup === "function") effect.cleanup()
        effect.cleanup = effect.callback()
        effect.deps = effect.nextDeps
        effect.hasRun = true
      }
    },
    reactMock,
    jsxRuntimeMock: { __esModule: true, Fragment, jsx: invoke, jsxs: invoke, jsxDEV: invoke },
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function findNode(node: any, predicate: (node: any) => boolean): any {
  if (node == null) return null
  if (Array.isArray(node)) return node.map((child) => findNode(child, predicate)).find(Boolean) ?? null
  if (typeof node === "object") return predicate(node) ? node : findNode(node.props?.children, predicate)
  return null
}

function findTextInput(tree: any) {
  return findNode(tree, (node) => node.type === "input" && node.props?.type === "text")
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

function renderWithEffects(runtime: ReturnType<typeof createHookRuntime>, Component: (props: any) => any, props: any) {
  let tree = runtime.render(Component, props)
  runtime.commitEffects()
  tree = runtime.render(Component, props)
  return tree
}

async function loadOverlayFollowUpInput(runtime: ReturnType<typeof createHookRuntime>, createMcpTextInput: ReturnType<typeof vi.fn>) {
  vi.resetModules()
  const appendUserMessageToSession = vi.fn()
  const invalidateQueries = vi.fn()
  const Icon = () => null
  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ") }))
  vi.doMock("@renderer/components/ui/button", () => ({ Button: (props: any) => ({ type: "button", props }) }))
  vi.doMock("lucide-react", () => ({ Send: Icon, Mic: Icon, OctagonX: Icon, ImagePlus: Icon, X: Icon, Bot: Icon }))
  vi.doMock("@tanstack/react-query", () => ({ useMutation: (options: any) => ({ get isPending() { return false }, mutateAsync: (value: string) => options.mutationFn(value) }) }))
  vi.doMock("@renderer/lib/tipc-client", () => ({ tipcClient: { createMcpTextInput, setPanelFocusable: vi.fn(), triggerMcpRecording: vi.fn(), stopAgentSession: vi.fn(), emergencyStopAgent: vi.fn() } }))
  vi.doMock("@renderer/lib/queries", () => ({ queryClient: { invalidateQueries }, useConfigQuery: () => ({ data: { mcpMessageQueueEnabled: true } }) }))
  vi.doMock("@renderer/stores", () => ({ useAgentStore: { getState: () => ({ appendUserMessageToSession }) } }))
  vi.doMock("@renderer/lib/debug", () => ({ logUI: vi.fn() }))
  vi.doMock("./predefined-prompts-menu", () => ({ PredefinedPromptsMenu: () => null }))
  vi.doMock("@renderer/lib/message-image-utils", () => ({ buildMessageWithImages: (text: string) => text.trim(), MAX_IMAGE_ATTACHMENTS: 4, readImageAttachments: vi.fn() }))
  const module = await import("./overlay-follow-up-input")
  return { OverlayFollowUpInput: module.OverlayFollowUpInput, appendUserMessageToSession, invalidateQueries }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("OverlayFollowUpInput session scope", () => {
  it("clears stale local state when the focused session changes", async () => {
    const runtime = createHookRuntime()
    const { OverlayFollowUpInput } = await loadOverlayFollowUpInput(runtime, vi.fn())

    let tree = renderWithEffects(runtime, OverlayFollowUpInput, { conversationId: "conversation-a", sessionId: "session-a" } as any)
    findTextInput(tree).props.onChange({ target: { value: "Leaky draft" } })
    tree = renderWithEffects(runtime, OverlayFollowUpInput, { conversationId: "conversation-a", sessionId: "session-a" } as any)
    expect(findTextInput(tree).props.value).toBe("Leaky draft")

    tree = renderWithEffects(runtime, OverlayFollowUpInput, { conversationId: "conversation-b", sessionId: "session-b" } as any)
    expect(findTextInput(tree).props.value).toBe("")
    expect(findNode(tree, (node) => node.props?.role === "alert")).toBeNull()
  })

  it("ignores stale async submit completions after switching sessions", async () => {
    const runtime = createHookRuntime()
    const pending = deferred<void>()
    const createMcpTextInput = vi.fn(() => pending.promise)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { OverlayFollowUpInput, appendUserMessageToSession, invalidateQueries } = await loadOverlayFollowUpInput(runtime, createMcpTextInput)

    let tree = renderWithEffects(runtime, OverlayFollowUpInput, { conversationId: "conversation-a", sessionId: "session-a" } as any)
    findTextInput(tree).props.onChange({ target: { value: "Session A draft" } })
    tree = renderWithEffects(runtime, OverlayFollowUpInput, { conversationId: "conversation-a", sessionId: "session-a" } as any)
    findNode(tree, (node) => node.type === "form").props.onSubmit({ preventDefault: () => undefined })
    await flushPromises()

    tree = renderWithEffects(runtime, OverlayFollowUpInput, { conversationId: "conversation-b", sessionId: "session-b" } as any)
    expect(findTextInput(tree).props.value).toBe("")
    findTextInput(tree).props.onChange({ target: { value: "Session B draft" } })
    tree = renderWithEffects(runtime, OverlayFollowUpInput, { conversationId: "conversation-b", sessionId: "session-b" } as any)
    expect(findTextInput(tree).props.value).toBe("Session B draft")

    pending.resolve()
    await flushPromises()
    tree = renderWithEffects(runtime, OverlayFollowUpInput, { conversationId: "conversation-b", sessionId: "session-b" } as any)
    expect(findTextInput(tree).props.value).toBe("Session B draft")
    expect(findNode(tree, (node) => node.props?.role === "alert")).toBeNull()
    expect(appendUserMessageToSession).toHaveBeenCalledWith("session-a", "Session A draft")
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["conversation", "conversation-a"] })

    const failed = deferred<void>()
    createMcpTextInput.mockImplementationOnce(() => failed.promise)
    findNode(tree, (node) => node.type === "form").props.onSubmit({ preventDefault: () => undefined })
    await flushPromises()

    tree = renderWithEffects(runtime, OverlayFollowUpInput, { conversationId: "conversation-c", sessionId: "session-c" } as any)
    findTextInput(tree).props.onChange({ target: { value: "Session C draft" } })
    tree = renderWithEffects(runtime, OverlayFollowUpInput, { conversationId: "conversation-c", sessionId: "session-c" } as any)

    failed.reject(new Error("Network down"))
    await flushPromises()
    tree = renderWithEffects(runtime, OverlayFollowUpInput, { conversationId: "conversation-c", sessionId: "session-c" } as any)
    expect(findTextInput(tree).props.value).toBe("Session C draft")
    expect(findNode(tree, (node) => node.props?.role === "alert")).toBeNull()
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to submit overlay follow-up message:",
      expect.any(Error),
    )
  })
})