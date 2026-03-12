import { afterEach, describe, expect, it, vi } from "vitest"

type EffectRecord = { callback?: () => void | (() => void); deps?: any[]; nextDeps?: any[]; cleanup?: void | (() => void); hasRun: boolean }

function createHookRuntime() {
  const states: any[] = []; const refs: Array<{ current: any }> = []; const effects: EffectRecord[] = []
  let mounted = true; let unmountedStateUpdates = 0; let stateIndex = 0; let refIndex = 0; let effectIndex = 0
  const depsChanged = (prev?: any[], next?: any[]) => !prev || !next || prev.length !== next.length || prev.some((value, index) => !Object.is(value, next[index]))
  const useState = <T,>(initial: T | (() => T)) => { const idx = stateIndex++; if (states[idx] === undefined) states[idx] = typeof initial === "function" ? (initial as () => T)() : initial; return [states[idx] as T, (update: T | ((prev: T) => T)) => { if (!mounted) { unmountedStateUpdates++; return } states[idx] = typeof update === "function" ? (update as (prev: T) => T)(states[idx]) : update }] as const }
  const useRef = <T,>(initial: T) => { const idx = refIndex++; refs[idx] ??= { current: initial }; return refs[idx] as { current: T } }
  const useEffect = (callback: () => void | (() => void), deps?: any[]) => { const idx = effectIndex++; const record = effects[idx] ?? { hasRun: false }; record.callback = callback; record.nextDeps = deps; effects[idx] = record }
  const reactMock: any = { __esModule: true, default: {} as any, useState, useRef, useEffect, useMemo: (factory: () => any) => factory() }
  reactMock.default = reactMock
  const Fragment = Symbol.for("react.fragment")
  const invoke = (type: any, props: any) => (type === Fragment ? props?.children ?? null : typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {} })
  return {
    render<P,>(Component: (props: P) => any, props: P) { stateIndex = 0; refIndex = 0; effectIndex = 0; return Component(props) },
    commitEffects() { for (const record of effects) { if (!record?.callback) continue; const shouldRun = !record.hasRun || depsChanged(record.deps, record.nextDeps); if (!shouldRun) continue; if (typeof record.cleanup === "function") record.cleanup(); record.cleanup = record.callback(); record.deps = record.nextDeps; record.hasRun = true } },
    unmount() { mounted = false; for (const record of [...effects].reverse()) { if (typeof record?.cleanup === "function") record.cleanup() } },
    getUnmountedStateUpdates: () => unmountedStateUpdates,
    reactMock,
    jsxRuntimeMock: { __esModule: true, Fragment, jsx: invoke, jsxs: invoke, jsxDEV: invoke },
  }
}

async function flushPromises(times = 4) { for (let i = 0; i < times; i += 1) await Promise.resolve() }

async function loadSessionActionDialog(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()
  const recorderInstances: MockRecorder[] = []

  class MockRecorder {
    listeners: Record<string, Array<(...args: any[]) => void>> = {}
    constructor() { recorderInstances.push(this) }
    on(eventName: string, listener: (...args: any[]) => void) { this.listeners[eventName] ??= []; this.listeners[eventName].push(listener); return () => undefined }
    emit(eventName: string, ...args: any[]) { for (const listener of this.listeners[eventName] ?? []) listener(...args) }
    async startRecording() {}
    stopRecording() { queueMicrotask(() => { this.emit("visualizer-data", 0.7); this.emit("record-end", new Blob(["audio"]), 250) }) }
  }

  const Null = () => null
  const utilsMock = { cn: (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ") }
  const soundMock = { playSound: vi.fn(async () => undefined) }
  const tipcClientMock = { tipcClient: { createMcpTextInput: vi.fn(), createMcpRecording: vi.fn(), getConfig: vi.fn(async () => null) } }
  const queryClientMock = { queryClient: { invalidateQueries: vi.fn(async () => undefined) } }
  const storeMock = { useAgentStore: { getState: () => ({ appendUserMessageToSession: vi.fn() }) } }

  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("lucide-react", () => ({ Bot: Null, Loader2: Null, Mic: Null, Send: Null }))
  vi.doMock("sonner", () => ({ toast: { error: vi.fn() } }))
  vi.doMock("./ui/dialog", () => ({ Dialog: (props: any) => ({ type: "Dialog", props }), DialogContent: (props: any) => ({ type: "DialogContent", props }), DialogDescription: (props: any) => ({ type: "DialogDescription", props }), DialogHeader: (props: any) => ({ type: "DialogHeader", props }), DialogTitle: (props: any) => ({ type: "DialogTitle", props }) }))
  vi.doMock("./text-input-panel", () => ({ TextInputPanel: Null }))
  vi.doMock("@renderer/lib/recorder", () => ({ Recorder: MockRecorder }))
  vi.doMock("../lib/recorder", () => ({ Recorder: MockRecorder }))
  vi.doMock("@renderer/lib/audio-utils", () => ({ decodeBlobToPcm: vi.fn() }))
  vi.doMock("../lib/audio-utils", () => ({ decodeBlobToPcm: vi.fn() }))
  vi.doMock("@renderer/lib/tipc-client", () => tipcClientMock)
  vi.doMock("../lib/tipc-client", () => tipcClientMock)
  vi.doMock("@renderer/lib/queries", () => queryClientMock)
  vi.doMock("../lib/queries", () => queryClientMock)
  vi.doMock("@renderer/lib/utils", () => utilsMock)
  vi.doMock("../lib/utils", () => utilsMock)
  vi.doMock("@renderer/lib/sound", () => soundMock)
  vi.doMock("../lib/sound", () => soundMock)
  vi.doMock("@renderer/stores", () => storeMock)
  vi.doMock("../stores", () => storeMock)

  const mod = await import("./session-action-dialog")
  return { SessionActionDialog: mod.SessionActionDialog, recorderInstances }
}

afterEach(() => { vi.restoreAllMocks(); vi.resetModules(); vi.unstubAllGlobals() })

describe("SessionActionDialog voice cleanup", () => {
  it("ignores async recorder callbacks after unmount", async () => {
    const ipcInvoke = vi.fn()
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      electron: { ipcRenderer: { invoke: ipcInvoke, on: vi.fn(), send: vi.fn() } },
    })
    const runtime = createHookRuntime()
    const { SessionActionDialog, recorderInstances } = await loadSessionActionDialog(runtime)

    runtime.render(SessionActionDialog, { open: true, mode: "voice", onOpenChange: vi.fn() } as any)
    runtime.commitEffects()
    await flushPromises()

    expect(recorderInstances).toHaveLength(1)

    runtime.unmount()
    await flushPromises()

    expect(runtime.getUnmountedStateUpdates()).toBe(0)
    expect(ipcInvoke).not.toHaveBeenCalled()
  })
})