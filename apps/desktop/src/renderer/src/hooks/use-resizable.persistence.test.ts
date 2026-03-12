import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type EffectRecord = {
  deps?: any[]
  nextDeps?: any[]
  callback?: () => void | (() => void)
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

  const registerEffect = (callback: EffectRecord["callback"], deps?: any[]) => {
    const idx = effectIndex++
    const record = effects[idx] ?? { hasRun: false }
    record.callback = callback
    record.nextDeps = deps
    effects[idx] = record
  }

  const render = <T,>(hook: () => T) => {
    stateIndex = 0
    refIndex = 0
    effectIndex = 0
    return hook()
  }

  const commitEffects = () => {
    for (const record of effects) {
      if (!record?.callback) continue
      const shouldRun = !record.hasRun || depsChanged(record.deps, record.nextDeps)
      if (!shouldRun) continue
      if (typeof record.cleanup === "function") record.cleanup()
      record.cleanup = record.callback()
      record.deps = record.nextDeps
      record.hasRun = true
    }
  }

  const reactMock: any = {
    __esModule: true,
    default: {} as any,
    useState,
    useRef,
    useEffect: registerEffect,
    useLayoutEffect: registerEffect,
    useCallback: <T extends (...args: any[]) => any>(callback: T) => callback,
  }
  reactMock.default = reactMock

  return { render, commitEffects, reactMock }
}

function createLocalStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed))
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
  }
}

async function loadUseResizable(runtime: ReturnType<typeof createHookRuntime>) {
  await vi.resetModules()
  vi.doMock("react", () => runtime.reactMock)
  return import("./use-resizable")
}

beforeEach(() => {
  delete (globalThis as any).localStorage
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  delete (globalThis as any).localStorage
})

describe("useResizable persistence", () => {
  it("does not overwrite a persisted size when setSize is called programmatically", async () => {
    const runtime = createHookRuntime()
    const mod = await loadUseResizable(runtime)
    const storageKey = mod.STORAGE_KEY_PREFIX + "session-tile"
    ;(globalThis as any).localStorage = createLocalStorage({
      [storageKey]: JSON.stringify({ width: 777, height: 666 }),
    })

    let result = runtime.render(() => mod.useResizable({ initialWidth: 320, initialHeight: 300, storageKey: "session-tile" }))
    runtime.commitEffects()
    expect(result.width).toBe(777)
    expect(result.height).toBe(666)
    expect(result.hasPersistedSize).toBe(true)

    result.setSize({ width: 900, height: 840 })
    result = runtime.render(() => mod.useResizable({ initialWidth: 320, initialHeight: 300, storageKey: "session-tile" }))
    runtime.commitEffects()

    expect(result.width).toBe(900)
    expect(result.height).toBe(840)
    expect(globalThis.localStorage.getItem(storageKey)).toBe(JSON.stringify({ width: 777, height: 666 }))
    expect(globalThis.localStorage.setItem).not.toHaveBeenCalled()
  })

  it("re-applies the persisted size when the storage key toggles back on", async () => {
    const runtime = createHookRuntime()
    const mod = await loadUseResizable(runtime)
    const storageKey = mod.STORAGE_KEY_PREFIX + "session-tile"
    ;(globalThis as any).localStorage = createLocalStorage({
      [storageKey]: JSON.stringify({ width: 777, height: 666 }),
    })

    let activeStorageKey: string | undefined = "session-tile"
    let result = runtime.render(() => mod.useResizable({ initialWidth: 320, initialHeight: 300, storageKey: activeStorageKey }))
    runtime.commitEffects()
    expect(result.width).toBe(777)

    activeStorageKey = undefined
    result = runtime.render(() => mod.useResizable({ initialWidth: 320, initialHeight: 300, storageKey: activeStorageKey }))
    runtime.commitEffects()
    result.setSize({ width: 500, height: 420 })
    result = runtime.render(() => mod.useResizable({ initialWidth: 320, initialHeight: 300, storageKey: activeStorageKey }))
    runtime.commitEffects()
    expect(result.width).toBe(500)

    activeStorageKey = "session-tile"
    result = runtime.render(() => mod.useResizable({ initialWidth: 320, initialHeight: 300, storageKey: activeStorageKey }))
    runtime.commitEffects()
    result = runtime.render(() => mod.useResizable({ initialWidth: 320, initialHeight: 300, storageKey: activeStorageKey }))
    runtime.commitEffects()

    expect(result.width).toBe(777)
    expect(result.height).toBe(666)
  })
})