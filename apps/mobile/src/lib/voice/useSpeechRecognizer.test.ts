import { afterEach, describe, expect, it, vi } from 'vitest';

import { mergeVoiceText } from './mergeVoiceText';

type EffectRecord = {
  callback?: () => void | (() => void);
  deps?: any[];
  nextDeps?: any[];
  cleanup?: void | (() => void);
  hasRun: boolean;
};

function createHookRuntime() {
  const states: any[] = [];
  const refs: Array<{ current: any }> = [];
  const effects: EffectRecord[] = [];
  let stateIndex = 0;
  let refIndex = 0;
  let effectIndex = 0;
  const depsChanged = (prev?: any[], next?: any[]) => !prev || !next || prev.length !== next.length || prev.some((value, index) => !Object.is(value, next[index]));
  const useState = <T,>(initial: T | (() => T)) => {
    const idx = stateIndex++;
    if (states[idx] === undefined) states[idx] = typeof initial === 'function' ? (initial as () => T)() : initial;
    return [states[idx] as T, (update: T | ((prev: T) => T)) => {
      states[idx] = typeof update === 'function' ? (update as (prev: T) => T)(states[idx]) : update;
    }] as const;
  };
  const useRef = <T,>(initial: T) => {
    const idx = refIndex++;
    refs[idx] ??= { current: initial };
    return refs[idx] as { current: T };
  };
  const useEffect = (callback: () => void | (() => void), deps?: any[]) => {
    const idx = effectIndex++;
    const record = effects[idx] ?? { hasRun: false };
    record.callback = callback;
    record.nextDeps = deps;
    effects[idx] = record;
  };
  const reactMock: any = { __esModule: true, default: {} as any, useState, useRef, useEffect, useCallback: (fn: any) => fn };
  reactMock.default = reactMock;
  return {
    render<P, Result>(hook: (props: P) => Result, props: P) {
      stateIndex = 0;
      refIndex = 0;
      effectIndex = 0;
      return hook(props);
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

class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = [];
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  onstart?: () => void;
  onresult?: (event: any) => void;
  onend?: () => void;
  startCalls = 0;
  failNextStart = false;
  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }
  start() {
    this.startCalls += 1;
    if (this.failNextStart) {
      this.failNextStart = false;
      throw new Error('restart failed');
    }
    this.onstart?.();
  }
  stop() {
    this.onend?.();
  }
}

async function loadUseSpeechRecognizer(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules();
  vi.doMock('react', async () => {
    const actual = await vi.importActual<typeof import('react')>('react');
    return {
      ...actual,
      ...runtime.reactMock,
      default: {
        ...(actual as any).default,
        ...runtime.reactMock,
      },
    };
  });
  vi.doMock('react-native', () => ({ Alert: { alert: vi.fn() }, Platform: { OS: 'web' }, View: function MockView() { return null; } }));
  vi.doMock('expo-modules-core', () => ({ EventEmitter: class MockEventEmitter {} }));
  return import('./useSpeechRecognizer');
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unmock('react');
  vi.unmock('react-native');
  vi.unmock('expo-modules-core');
  FakeSpeechRecognition.instances = [];
  delete (globalThis as any).window;
});

describe('mergeVoiceText', () => {
  it('keeps cumulative recognizer results from duplicating words', () => {
    expect(mergeVoiceText('hello', 'hello world')).toBe('hello world');
  });
  it('merges overlapping transcript chunks without repeating the overlap', () => {
    expect(mergeVoiceText('turn on', 'on the lights')).toBe('turn on the lights');
  });
  it('preserves non-overlapping chunks in order', () => {
    expect(mergeVoiceText('summarize my', 'latest emails')).toBe('summarize my latest emails');
  });
});

describe('useSpeechRecognizer', () => {
  it('waits for push-to-talk release before finalizing if the recognizer ends mid-hold', async () => {
    vi.useFakeTimers();
    let now = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    (globalThis as any).window = { SpeechRecognition: FakeSpeechRecognition };
    const runtime = createHookRuntime();
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime);
    const onVoiceFinalized = vi.fn();
    const recognizer = runtime.render(useSpeechRecognizer, { handsFree: false, willCancel: false, onVoiceFinalized });
    runtime.commitEffects();
    recognizer.handlePushToTalkPressIn({} as any);
    const speechRecognition = FakeSpeechRecognition.instances[0];
    speechRecognition.onresult?.({ resultIndex: 0, results: [{ 0: { transcript: 'hello world' }, isFinal: true }] });
    speechRecognition.failNextStart = true;
    speechRecognition.onend?.();
    expect(onVoiceFinalized).not.toHaveBeenCalled();
    now = 1_300;
    recognizer.handlePushToTalkPressOut();
    expect(onVoiceFinalized).toHaveBeenCalledWith({ text: 'hello world', mode: 'send', source: 'web' });
    expect(speechRecognition.startCalls).toBe(2);
  });

  it('respects the configured hands-free silence delay even after recognizer end fires', async () => {
    vi.useFakeTimers();
    (globalThis as any).window = { SpeechRecognition: FakeSpeechRecognition };
    const runtime = createHookRuntime();
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime);
    const onVoiceFinalized = vi.fn();
    const recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 10_000,
      willCancel: false,
      onVoiceFinalized,
    });
    runtime.commitEffects();

    await recognizer.startRecording();
    const speechRecognition = FakeSpeechRecognition.instances[0];

    speechRecognition.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: 'hello world' }, isFinal: true }],
    });

    vi.advanceTimersByTime(1_500);
    speechRecognition.onend?.();

    expect(onVoiceFinalized).not.toHaveBeenCalled();

    vi.advanceTimersByTime(8_499);
    expect(onVoiceFinalized).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onVoiceFinalized).toHaveBeenCalledWith({ text: 'hello world', mode: 'handsfree', source: 'web' });
  });

  it('restarts hands-free recognition after recognizer end so follow-up speech extends the pending transcript', async () => {
    vi.useFakeTimers();
    (globalThis as any).window = { SpeechRecognition: FakeSpeechRecognition };
    const runtime = createHookRuntime();
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime);
    const onVoiceFinalized = vi.fn();
    const recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 10_000,
      willCancel: false,
      onVoiceFinalized,
    });
    runtime.commitEffects();

    await recognizer.startRecording();
    const speechRecognition = FakeSpeechRecognition.instances[0];

    speechRecognition.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: 'hello world' }, isFinal: true }],
    });

    vi.advanceTimersByTime(1_500);
    speechRecognition.onend?.();

    expect(speechRecognition.startCalls).toBe(2);
    expect(onVoiceFinalized).not.toHaveBeenCalled();

    speechRecognition.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: 'again' }, isFinal: true }],
    });

    vi.advanceTimersByTime(9_999);
    expect(onVoiceFinalized).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onVoiceFinalized).toHaveBeenCalledWith({ text: 'hello world again', mode: 'handsfree', source: 'web' });
  });

  it('updates an existing web recognizer to use hands-free mode after rerendering', async () => {
    vi.useFakeTimers();
    (globalThis as any).window = { SpeechRecognition: FakeSpeechRecognition };
    const runtime = createHookRuntime();
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime);
    const onVoiceFinalized = vi.fn();

    let recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: false,
      willCancel: false,
      onVoiceFinalized,
    });
    runtime.commitEffects();

    await recognizer.startRecording();
    const speechRecognition = FakeSpeechRecognition.instances[0];

    recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 250,
      willCancel: false,
      onVoiceFinalized,
    });
    runtime.commitEffects();

    speechRecognition.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: 'hello world' }, isFinal: true }],
    });
    speechRecognition.onend?.();

    expect(FakeSpeechRecognition.instances).toHaveLength(1);
    expect(onVoiceFinalized).not.toHaveBeenCalled();

    vi.advanceTimersByTime(249);
    expect(onVoiceFinalized).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onVoiceFinalized).toHaveBeenCalledWith({ text: 'hello world', mode: 'handsfree', source: 'web' });
  });

  it('updates an existing web recognizer to use the latest hands-free silence delay after rerendering', async () => {
    vi.useFakeTimers();
    (globalThis as any).window = { SpeechRecognition: FakeSpeechRecognition };
    const runtime = createHookRuntime();
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime);
    const onVoiceFinalized = vi.fn();

    let recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 10_000,
      willCancel: false,
      onVoiceFinalized,
    });
    runtime.commitEffects();

    await recognizer.startRecording();
    const speechRecognition = FakeSpeechRecognition.instances[0];

    recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 250,
      willCancel: false,
      onVoiceFinalized,
    });
    runtime.commitEffects();

    speechRecognition.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: 'hello world' }, isFinal: true }],
    });
    speechRecognition.onend?.();

    vi.advanceTimersByTime(249);
    expect(onVoiceFinalized).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onVoiceFinalized).toHaveBeenCalledWith({ text: 'hello world', mode: 'handsfree', source: 'web' });
  });
});
