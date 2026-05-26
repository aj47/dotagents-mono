import { afterEach, describe, expect, it, vi } from 'vitest';

type EffectRecord = {
  callback?: () => void | (() => void);
  deps?: any[];
  nextDeps?: any[];
  cleanup?: void | (() => void);
  hasRun: boolean;
};

function createHookRuntime() {
  const states: any[] = [];
  const effects: EffectRecord[] = [];
  let stateIndex = 0;
  let effectIndex = 0;

  const depsChanged = (prev?: any[], next?: any[]) => !prev
    || !next
    || prev.length !== next.length
    || prev.some((value, index) => !Object.is(value, next[index]));

  const useState = <T,>(initial: T | (() => T)) => {
    const idx = stateIndex++;
    if (states[idx] === undefined) states[idx] = typeof initial === 'function' ? (initial as () => T)() : initial;
    return [states[idx] as T, (update: T | ((prev: T) => T)) => {
      states[idx] = typeof update === 'function' ? (update as (prev: T) => T)(states[idx]) : update;
    }] as const;
  };

  const useEffect = (callback: () => void | (() => void), deps?: any[]) => {
    const idx = effectIndex++;
    const record = effects[idx] ?? { hasRun: false };
    record.callback = callback;
    record.nextDeps = deps;
    effects[idx] = record;
  };

  const reactMock: any = {
    __esModule: true,
    default: {} as any,
    useState,
    useEffect,
  };
  reactMock.default = reactMock;

  return {
    render<Result>(hook: () => Result) {
      stateIndex = 0;
      effectIndex = 0;
      return hook();
    },
    commitEffects() {
      for (const record of effects) {
        if (!record?.callback) continue;
        const shouldRun = !record.hasRun || depsChanged(record.deps, record.nextDeps);
        if (!shouldRun) continue;
        if (typeof record.cleanup === 'function') record.cleanup();
        record.cleanup = record.callback();
        record.deps = record.nextDeps;
        record.hasRun = true;
      }
    },
    reactMock,
  };
}

async function loadUseStableForeground(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules();
  vi.doMock('react', () => runtime.reactMock);
  return import('./useStableForeground');
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unmock('react');
});

describe('useStableForeground', () => {
  it('does not become stable for a transient foreground blip', async () => {
    vi.useFakeTimers();
    const runtime = createHookRuntime();
    const { useStableForeground } = await loadUseStableForeground(runtime);

    let isForeground = false;
    let stable = runtime.render(() => useStableForeground(isForeground, 1000));
    runtime.commitEffects();
    expect(stable).toBe(false);

    isForeground = true;
    stable = runtime.render(() => useStableForeground(isForeground, 1000));
    runtime.commitEffects();
    expect(stable).toBe(false);

    isForeground = false;
    stable = runtime.render(() => useStableForeground(isForeground, 1000));
    runtime.commitEffects();
    vi.advanceTimersByTime(1000);

    stable = runtime.render(() => useStableForeground(isForeground, 1000));
    runtime.commitEffects();
    expect(stable).toBe(false);
  });

  it('becomes stable after the foreground state remains active', async () => {
    vi.useFakeTimers();
    const runtime = createHookRuntime();
    const { useStableForeground } = await loadUseStableForeground(runtime);

    let isForeground = false;
    runtime.render(() => useStableForeground(isForeground, 1000));
    runtime.commitEffects();

    isForeground = true;
    let stable = runtime.render(() => useStableForeground(isForeground, 1000));
    runtime.commitEffects();
    expect(stable).toBe(false);

    vi.advanceTimersByTime(999);
    stable = runtime.render(() => useStableForeground(isForeground, 1000));
    runtime.commitEffects();
    expect(stable).toBe(false);

    vi.advanceTimersByTime(1);
    stable = runtime.render(() => useStableForeground(isForeground, 1000));
    runtime.commitEffects();
    expect(stable).toBe(true);
  });
});
