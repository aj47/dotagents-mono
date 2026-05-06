import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SIDEBAR_STORAGE_KEY } from "@dotagents/shared/sidebar-persistence"

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

  const depsChanged = (prev?: any[], next?: any[]) =>
    !prev || !next || prev.length !== next.length || prev.some((value, index) => !Object.is(value, next[index]))

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

async function loadUseSidebar(runtime: ReturnType<typeof createHookRuntime>) {
  await vi.resetModules()
  vi.doMock("react", () => runtime.reactMock)
  return import("./use-sidebar")
}

beforeEach(() => {
  delete (globalThis as any).localStorage
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  delete (globalThis as any).localStorage
})

describe("useSidebar persistence", () => {
  it("hydrates a persisted sidebar state and clamps width", async () => {
    const runtime = createHookRuntime()
    const mod = await loadUseSidebar(runtime)
    ;(globalThis as any).localStorage = createLocalStorage({
      [SIDEBAR_STORAGE_KEY]: JSON.stringify({ isCollapsed: true, width: 999 }),
    })

    const result = runtime.render(() => mod.useSidebar({ initialWidth: 176, initialCollapsed: false }))
    runtime.commitEffects()

    expect(result.isCollapsed).toBe(true)
    expect(result.width).toBe(mod.SIDEBAR_DIMENSIONS.width.max)
  })

  it("clears the persisted sidebar state when reset", async () => {
    const runtime = createHookRuntime()
    const mod = await loadUseSidebar(runtime)
    ;(globalThis as any).localStorage = createLocalStorage({
      [SIDEBAR_STORAGE_KEY]: JSON.stringify({ isCollapsed: true, width: 240 }),
    })

    const result = runtime.render(() => mod.useSidebar({ initialWidth: 176, initialCollapsed: false }))
    runtime.commitEffects()
    result.reset()

    expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith(SIDEBAR_STORAGE_KEY)
  })
})
