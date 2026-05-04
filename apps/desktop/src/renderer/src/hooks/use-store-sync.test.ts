import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type EffectRecord = {
  deps?: any[]
  nextDeps?: any[]
  callback?: () => void | (() => void)
  cleanup?: void | (() => void)
  hasRun: boolean
}

function createHookRuntime() {
  const refs: Array<{ current: any }> = []
  const effects: EffectRecord[] = []
  let refIndex = 0
  let effectIndex = 0

  const useRef = <T,>(initial: T) => {
    const idx = refIndex++
    if (!refs[idx]) refs[idx] = { current: initial }
    return refs[idx] as { current: T }
  }

  const depsChanged = (prev: any[] | undefined, next: any[] | undefined) => {
    if (prev === undefined || next === undefined) return true
    if (prev.length !== next.length) return true
    for (let i = 0; i < prev.length; i += 1) {
      if (!Object.is(prev[i], next[i])) return true
    }
    return false
  }

  const useEffect = (callback: EffectRecord['callback'], deps?: any[]) => {
    const idx = effectIndex++
    const record = effects[idx] ?? { hasRun: false }
    record.callback = callback
    record.nextDeps = deps
    effects[idx] = record
  }

  const render = (hook: () => void) => {
    refIndex = 0
    effectIndex = 0
    hook()
  }

  const commitEffects = () => {
    for (const record of effects) {
      if (!record?.callback) continue
      const shouldRun = !record.hasRun || depsChanged(record.deps, record.nextDeps)
      if (!shouldRun) continue
      if (typeof record.cleanup === 'function') record.cleanup()
      record.cleanup = record.callback()
      record.deps = record.nextDeps
      record.hasRun = true
    }
  }

  const cleanupAllEffects = () => {
    for (const record of effects) {
      if (typeof record?.cleanup === 'function') record.cleanup()
    }
  }

  const reactMock = { __esModule: true, default: {} as any, useEffect, useRef }
  reactMock.default = reactMock

  const simulateRemount = () => {
    refs.length = 0
    effectIndex = 0
    refIndex = 0
    for (const record of effects) {
      if (typeof record?.cleanup === 'function') record.cleanup()
      record.hasRun = false
      record.deps = undefined
      record.nextDeps = undefined
      record.callback = undefined
      record.cleanup = undefined
    }
  }

  return { render, commitEffects, cleanupAllEffects, reactMock, simulateRemount }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

const flushPromises = async () => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve()
  }
}

describe('useStoreSync pinned session persistence', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('hydrates pinned session ids from config without immediately re-saving them', async () => {
    const runtime = createHookRuntime()
    const storeState = createAgentStoreState()
    const loaded = await loadUseStoreSync(runtime, storeState, { pinnedSessionIds: ['session-1', 'session-2'] })

    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()
    await flushPromises()
    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()

    expect(storeState.setPinnedSessionIds).toHaveBeenCalledWith(['session-1', 'session-2'])
    expect(loaded.tipcClient.saveConfig).not.toHaveBeenCalled()

    runtime.cleanupAllEffects()
  })

  it('persists pinned session id updates after hydration completes', async () => {
    const runtime = createHookRuntime()
    const storeState = createAgentStoreState()
    const loaded = await loadUseStoreSync(runtime, storeState, { pinnedSessionIds: ['session-1'] })

    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()
    await flushPromises()
    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()

    storeState.pinnedSessionIds = new Set(['session-1', 'session-2'])
    storeState.pinnedSessionIdsRevision += 1
    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()
    await flushPromises()

    expect(loaded.tipcClient.saveConfig).toHaveBeenCalledWith({
      config: { pinnedSessionIds: ['session-1', 'session-2'] },
    })

    const updateCachedConfig = loaded.queryClient.setQueryData.mock.calls[0]?.[1]
    expect(updateCachedConfig({ themePreference: 'dark' })).toEqual({
      themePreference: 'dark',
      pinnedSessionIds: ['session-1', 'session-2'],
    })

    runtime.cleanupAllEffects()
  })

  it('does not let late hydration overwrite a local pin toggle', async () => {
    const runtime = createHookRuntime()
    const storeState = createAgentStoreState()
    const deferredConfig = createDeferred<{ pinnedSessionIds: string[] }>()
    const loaded = await loadUseStoreSync(runtime, storeState, deferredConfig.promise)

    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()

    storeState.pinnedSessionIds = new Set(['local-session'])
    storeState.pinnedSessionIdsRevision += 1
    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()

    deferredConfig.resolve({ pinnedSessionIds: ['persisted-session'] })
    await flushPromises()

    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()
    await flushPromises()

    expect(storeState.setPinnedSessionIds).toHaveBeenCalledWith(['local-session'])
    expect(storeState.pinnedSessionIds).toEqual(new Set(['local-session']))
    // Pre-hydration local changes should not immediately overwrite persisted
    // config on disk; only post-hydration changes should trigger saves.
    expect(loaded.tipcClient.saveConfig).not.toHaveBeenCalled()

    // A subsequent post-hydration change should still trigger a save
    storeState.pinnedSessionIds = new Set(['local-session', 'post-session'])
    storeState.pinnedSessionIdsRevision += 1
    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()
    await flushPromises()

    expect(loaded.tipcClient.saveConfig).toHaveBeenCalledWith({
      config: { pinnedSessionIds: ['local-session', 'post-session'] },
    })

    runtime.cleanupAllEffects()
  })

  it('does not let late hydration restore stale pins after a pre-hydration toggle cycle', async () => {
    const runtime = createHookRuntime()
    const storeState = createAgentStoreState()
    const deferredConfig = createDeferred<{ pinnedSessionIds: string[] }>()
    const loaded = await loadUseStoreSync(runtime, storeState, deferredConfig.promise)

    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()

    storeState.pinnedSessionIds = new Set(['temporary-session'])
    storeState.pinnedSessionIdsRevision += 1
    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()

    storeState.pinnedSessionIds = new Set()
    storeState.pinnedSessionIdsRevision += 1
    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()

    deferredConfig.resolve({ pinnedSessionIds: ['persisted-session'] })
    await flushPromises()

    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()
    await flushPromises()

    expect(storeState.setPinnedSessionIds).not.toHaveBeenCalledWith(['persisted-session'])
    expect(storeState.setPinnedSessionIds).toHaveBeenCalledWith([])
    expect(storeState.pinnedSessionIds).toEqual(new Set())
    // The accidental pre-hydration empty state must not overwrite the persisted
    // pins on disk. It should stay unsaved until a post-hydration change.
    expect(loaded.tipcClient.saveConfig).not.toHaveBeenCalled()

    runtime.cleanupAllEffects()
  })

  it('does not overwrite user pins when the component remounts during hydration', async () => {
    const runtime = createHookRuntime()
    const storeState = createAgentStoreState()
    const deferredConfig = createDeferred<{ pinnedSessionIds: string[] }>()
    const loaded = await loadUseStoreSync(runtime, storeState, deferredConfig.promise)

    // First mount
    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()

    // User toggles a pin before hydration resolves
    storeState.pinnedSessionIds = new Set(['user-session'])
    storeState.pinnedSessionIdsRevision += 1
    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()

    // Simulate a React remount (e.g. Strict Mode or HMR): refs and effects reset,
    // but the module-level snapshot must survive.
    runtime.simulateRemount()

    // Remount renders with fresh refs
    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()

    // Hydration resolves with stale/empty config
    deferredConfig.resolve({ pinnedSessionIds: [] })
    await flushPromises()

    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()
    await flushPromises()

    // The module-level snapshot still knows the store was mutated pre-hydration,
    // so the empty config must not overwrite the user's pin.
    expect(storeState.setPinnedSessionIds).not.toHaveBeenCalledWith([])
    expect(storeState.pinnedSessionIds).toEqual(new Set(['user-session']))
    expect(loaded.tipcClient.saveConfig).not.toHaveBeenCalled()

    // A subsequent post-hydration change should still trigger a save
    storeState.pinnedSessionIds = new Set(['user-session', 'post-session'])
    storeState.pinnedSessionIdsRevision += 1
    runtime.render(loaded.useStoreSync)
    runtime.commitEffects()
    await flushPromises()

    expect(loaded.tipcClient.saveConfig).toHaveBeenCalledWith({
      config: { pinnedSessionIds: ['user-session', 'post-session'] },
    })

    runtime.cleanupAllEffects()
  })
})

function createAgentStoreState() {
  const state = {
    updateSessionProgress: vi.fn(),
    clearAllProgress: vi.fn(),
    clearSessionProgress: vi.fn(),
    clearInactiveSessions: vi.fn(),
    setFocusedSessionId: vi.fn(),
    setSessionSnoozed: vi.fn(),
    setScrollToSessionId: vi.fn(),
    setFloatingPanelVisible: vi.fn(),
    updateMessageQueue: vi.fn(),
    pinnedSessionIds: new Set<string>(),
    pinnedSessionIdsRevision: 0,
    setPinnedSessionIds: vi.fn((sessionIds: Iterable<string>) => {
      state.pinnedSessionIds = new Set(sessionIds)
    }),
    archivedSessionIds: new Set<string>(),
    archivedSessionIdsRevision: 0,
    setArchivedSessionIds: vi.fn((sessionIds: Iterable<string>) => {
      state.archivedSessionIds = new Set(sessionIds)
    }),
  }

  return state
}

async function loadUseStoreSync(
  runtime: ReturnType<typeof createHookRuntime>,
  storeState: ReturnType<typeof createAgentStoreState>,
  config: Promise<{ pinnedSessionIds: string[] }> | { pinnedSessionIds: string[] },
) {
  const listen = vi.fn(() => vi.fn())
  const tipcClient = {
    getAllMessageQueues: vi.fn().mockResolvedValue([]),
    getFloatingPanelVisibility: vi.fn().mockResolvedValue({ visible: false }),
    getConfig: vi.fn().mockImplementation(() => Promise.resolve(config)),
    saveConfig: vi.fn().mockResolvedValue(undefined),
  }
  const queryClient = {
    fetchQuery: vi.fn(({ queryFn }: { queryFn: () => Promise<unknown> }) => queryFn()),
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  }
  const conversationStore = {
    markConversationCompleted: vi.fn(),
  }
  const reportConfigSaveError = vi.fn()

  vi.doMock('react', () => runtime.reactMock)
  const tipcClientMock = {
    __esModule: true,
    tipcClient,
    rendererHandlers: {
      agentProgressUpdate: { listen },
      clearAgentProgress: { listen },
      clearAgentSessionProgress: { listen },
      clearInactiveSessions: { listen },
      stopAllTts: { listen },
      panelVisibilityChanged: { listen },
      focusAgentSession: { listen },
      setAgentSessionSnoozed: { listen },
      clearSessionTTSKeys: { listen },
      onMessageQueueUpdate: { listen },
      conversationHistoryChanged: { listen },
    },
  }
  vi.doMock('@renderer/lib/tipc-client', () => tipcClientMock)
  vi.doMock('../lib/tipc-client', () => tipcClientMock)
  const storesMock = {
    __esModule: true,
    useAgentStore: Object.assign(
      (selector: (state: typeof storeState) => unknown) => selector(storeState),
      {
        getState: () => storeState,
      },
    ),
    useConversationStore: (selector: (state: typeof conversationStore) => unknown) => selector(conversationStore),
  }
  vi.doMock('@renderer/stores', () => storesMock)
  vi.doMock('../stores', () => storesMock)
  vi.doMock('@renderer/lib/queries', () => ({ __esModule: true, queryClient }))
  vi.doMock('../lib/queries', () => ({ __esModule: true, queryClient }))
  const ttsManagerMock = {
    __esModule: true,
    ttsManager: { getAudioCount: vi.fn(() => 0), stopAll: vi.fn() },
  }
  vi.doMock('@renderer/lib/tts-manager', () => ttsManagerMock)
  vi.doMock('../lib/tts-manager', () => ttsManagerMock)
  vi.doMock('@renderer/lib/tts-tracking', () => ({ __esModule: true, clearSessionTTSTracking: vi.fn() }))
  vi.doMock('../lib/tts-tracking', () => ({ __esModule: true, clearSessionTTSTracking: vi.fn() }))
  vi.doMock('@renderer/lib/debug', () => ({ __esModule: true, logUI: vi.fn() }))
  vi.doMock('../lib/debug', () => ({ __esModule: true, logUI: vi.fn() }))
  vi.doMock('@renderer/lib/config-save-error', () => ({ __esModule: true, reportConfigSaveError }))
  vi.doMock('../lib/config-save-error', () => ({ __esModule: true, reportConfigSaveError }))

  const module = await import('./use-store-sync')
  return { useStoreSync: module.useStoreSync, tipcClient, queryClient, reportConfigSaveError }
}