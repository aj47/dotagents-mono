import { afterEach, describe, expect, it, vi } from 'vitest';

import { mergeVoiceText, normalizeVoiceText } from './mergeVoiceText';

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
  static nextStartError: Error | null = null;
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
    if (FakeSpeechRecognition.nextStartError) {
      const error = FakeSpeechRecognition.nextStartError;
      FakeSpeechRecognition.nextStartError = null;
      throw error;
    }
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

class FakeNativeSpeechEventEmitter {
  static instances: FakeNativeSpeechEventEmitter[] = [];
  private listeners = new Map<string, Set<(event: any) => void>>();

  constructor() {
    FakeNativeSpeechEventEmitter.instances.push(this);
  }

  addListener(eventName: string, listener: (event: any) => void) {
    const eventListeners = this.listeners.get(eventName) ?? new Set<(event: any) => void>();
    eventListeners.add(listener);
    this.listeners.set(eventName, eventListeners);
    return {
      remove: () => eventListeners.delete(listener),
    };
  }

  emit(eventName: string, event: any) {
    this.listeners.get(eventName)?.forEach((listener) => listener(event));
  }

  listenerCount(eventName: string) {
    return this.listeners.get(eventName)?.size ?? 0;
  }
}

async function loadUseSpeechRecognizer(
  runtime: ReturnType<typeof createHookRuntime>,
  options: {
    platform?: 'android' | 'ios' | 'web';
    eventEmitterClass?: typeof FakeNativeSpeechEventEmitter;
    speechRecognitionModule?: Record<string, any>;
    androidHandsFreeService?: Record<string, any>;
  } = {},
) {
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
  vi.doMock('react-native', () => ({
    Alert: { alert: vi.fn() },
    Platform: { OS: options.platform ?? 'web' },
    View: function MockView() { return null; },
  }));
  vi.doMock('expo-modules-core', () => ({ EventEmitter: options.eventEmitterClass ?? class MockEventEmitter {} }));
  vi.doMock('expo-speech-recognition', () => ({
    ExpoSpeechRecognitionModule: options.speechRecognitionModule,
  }));
  vi.doMock('@react-native-async-storage/async-storage', () => ({
    default: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
  }));
  vi.doMock('./androidHandsFreeService', () => ({
    setAndroidHandsFreeAudioRoutingEnabled: options.androidHandsFreeService?.setAndroidHandsFreeAudioRoutingEnabled ?? vi.fn(),
  }));
  return import('./useSpeechRecognizer');
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unmock('react');
  vi.unmock('react-native');
  vi.unmock('expo-modules-core');
  vi.unmock('expo-speech-recognition');
  vi.unmock('@react-native-async-storage/async-storage');
  vi.unmock('./androidHandsFreeService');
  FakeSpeechRecognition.instances = [];
  FakeSpeechRecognition.nextStartError = null;
  FakeNativeSpeechEventEmitter.instances = [];
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
  it('collapses repeated word runs in a single recognizer candidate', () => {
    expect(normalizeVoiceText('what is the weather what is the weather today')).toBe('what is the weather today');
    expect(normalizeVoiceText('go to to settings')).toBe('go to settings');
  });
  it('collapses repeated cumulative prefixes before sending', () => {
    expect(mergeVoiceText('open settings', 'open settings open settings and turn on hands free')).toBe(
      'open settings and turn on hands free',
    );
  });
  it('uses recognizer final rewrites instead of appending them as new speech', () => {
    expect(mergeVoiceText(
      'can you give me some dope points about',
      'can you give me some points about it',
    )).toBe('can you give me some points about it');
  });
  it('keeps separate utterances that only share a short opener', () => {
    expect(mergeVoiceText('can you open settings', 'can you start a timer')).toBe(
      'can you open settings can you start a timer',
    );
  });
  it('matches overlap despite case or punctuation changes', () => {
    expect(mergeVoiceText('Turn on the lights.', 'lights in the kitchen')).toBe('Turn on the lights in the kitchen');
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

  it('cancels a pending hands-free debounce when capture is invalidated mid-debounce', async () => {
    vi.useFakeTimers();
    (globalThis as any).window = { SpeechRecognition: FakeSpeechRecognition };
    const runtime = createHookRuntime();
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime);
    const onVoiceFinalized = vi.fn();
    const log = vi.fn();

    const recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
      log,
    });
    runtime.commitEffects();

    await recognizer.startRecording();
    const speechRecognition = FakeSpeechRecognition.instances[0];

    speechRecognition.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: 'pending request' }, isFinal: true }],
    });

    vi.advanceTimersByTime(250);
    recognizer.invalidateHandsFreeCapture('tts-started');

    vi.advanceTimersByTime(500);
    expect(onVoiceFinalized).not.toHaveBeenCalled();
    const eventTypes = log.mock.calls.map(([type]) => type);
    expect(eventTypes).toContain('finalization-cancelled');
    expect(eventTypes).not.toContain('finalization-fired');
  });

  it('does not finalize a hands-free debounce after the listening turn becomes ineligible', async () => {
    vi.useFakeTimers();
    (globalThis as any).window = { SpeechRecognition: FakeSpeechRecognition };
    const runtime = createHookRuntime();
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime);
    const onVoiceFinalized = vi.fn();
    const log = vi.fn();

    const props = {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
      shouldFinalizeHandsFreeTranscript: vi.fn(() => true),
      log,
    };
    let recognizer = runtime.render(useSpeechRecognizer, props);
    runtime.commitEffects();

    await recognizer.startRecording();
    const speechRecognition = FakeSpeechRecognition.instances[0];

    speechRecognition.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: 'stale request' }, isFinal: true }],
    });

    recognizer = runtime.render(useSpeechRecognizer, {
      ...props,
      shouldFinalizeHandsFreeTranscript: vi.fn(() => false),
    });
    runtime.commitEffects();

    vi.advanceTimersByTime(500);

    expect(recognizer).toBeDefined();
    expect(onVoiceFinalized).not.toHaveBeenCalled();
    expect(log.mock.calls.map(([type]) => type)).not.toContain('transcript-finalized');
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

  it('logs the web hands-free recognizer lifecycle with transcript context', async () => {
    vi.useFakeTimers();
    (globalThis as any).window = { SpeechRecognition: FakeSpeechRecognition };
    const runtime = createHookRuntime();
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime);
    const onVoiceFinalized = vi.fn();
    const log = vi.fn();

    const recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
      log,
    });
    runtime.commitEffects();

    await recognizer.startRecording();
    const speechRecognition = FakeSpeechRecognition.instances[0];

    speechRecognition.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: 'hello world' }, isFinal: true }],
    });
    speechRecognition.onend?.();
    vi.advanceTimersByTime(500);

    const eventTypes = log.mock.calls.map(([type]) => type);
    expect(eventTypes).toEqual(expect.arrayContaining([
      'recognizer-start',
      'recognizer-result',
      'finalization-scheduled',
      'recognizer-end',
      'recognizer-restart',
      'finalization-fired',
      'transcript-finalized',
    ]));
    expect(log.mock.calls.find(([type]) => type === 'recognizer-result')?.[2]).toMatchObject({
      source: 'web',
      handsFree: true,
      finalText: 'hello world',
    });
    expect(log.mock.calls.find(([type]) => type === 'finalization-scheduled')?.[2]).toMatchObject({
      source: 'web',
      debounceMs: 500,
      text: 'hello world',
    });
    expect(onVoiceFinalized).toHaveBeenCalledWith({ text: 'hello world', mode: 'handsfree', source: 'web' });
  });

  it('finalizes native hands-free partial results after the silence delay when no final event arrives', async () => {
    vi.useFakeTimers();
    const runtime = createHookRuntime();
    const speechRecognitionModule = {
      getPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
      requestPermissionsAsync: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime, {
      platform: 'android',
      eventEmitterClass: FakeNativeSpeechEventEmitter,
      speechRecognitionModule,
    });
    const onVoiceFinalized = vi.fn();

    const recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
    });
    runtime.commitEffects();

    await recognizer.startRecording();
    expect(speechRecognitionModule.start).toHaveBeenCalledWith(expect.objectContaining({
      continuous: true,
      interimResults: true,
      volumeChangeEventOptions: { enabled: true, intervalMillis: 250 },
    }));

    const eventEmitter = FakeNativeSpeechEventEmitter.instances[0];
    eventEmitter.emit('result', {
      isFinal: false,
      results: [{ transcript: 'send this message' }],
    });

    vi.advanceTimersByTime(499);
    expect(onVoiceFinalized).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onVoiceFinalized).toHaveBeenCalledWith({
      text: 'send this message',
      mode: 'handsfree',
      source: 'native',
    });
  });

  it('finalizes configured native hands-free control phrases immediately', async () => {
    vi.useFakeTimers();
    const runtime = createHookRuntime();
    const speechRecognitionModule = {
      getPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
      requestPermissionsAsync: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime, {
      platform: 'android',
      eventEmitterClass: FakeNativeSpeechEventEmitter,
      speechRecognitionModule,
    });
    const onVoiceFinalized = vi.fn();
    const log = vi.fn();

    const recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 5_000,
      willCancel: false,
      onVoiceFinalized,
      shouldImmediatelyFinalizeHandsFreeTranscript: ({ text }) => text === 'hey bro',
      log,
    });
    runtime.commitEffects();

    await recognizer.startRecording();
    const eventEmitter = FakeNativeSpeechEventEmitter.instances[0];
    eventEmitter.emit('result', {
      isFinal: false,
      results: [{ transcript: 'hey bro' }],
    });

    expect(onVoiceFinalized).toHaveBeenCalledWith({
      text: 'hey bro',
      mode: 'handsfree',
      source: 'native',
    });
    expect(log.mock.calls.find(([, summary]) => summary === 'Hands-free transcript finalized immediately.')?.[2]).toMatchObject({
      source: 'native',
      isFinal: false,
      text: 'hey bro',
    });

    vi.advanceTimersByTime(5_000);
    expect(onVoiceFinalized).toHaveBeenCalledTimes(1);
  });

  it('keeps a pending native hands-free final when the recognizer is auto-disarmed before debounce fires', async () => {
    vi.useFakeTimers();
    const runtime = createHookRuntime();
    const speechRecognitionModule = {
      getPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
      requestPermissionsAsync: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime, {
      platform: 'android',
      eventEmitterClass: FakeNativeSpeechEventEmitter,
      speechRecognitionModule,
    });
    const onVoiceFinalized = vi.fn();

    const recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
    });
    runtime.commitEffects();

    await recognizer.startRecording();
    const eventEmitter = FakeNativeSpeechEventEmitter.instances[0];
    eventEmitter.emit('result', {
      isFinal: true,
      results: [{ transcript: 'what were we even trying to do' }],
    });

    await recognizer.stopRecognitionOnly({ preservePendingHandsFreeFinal: true });
    vi.advanceTimersByTime(499);
    expect(onVoiceFinalized).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onVoiceFinalized).toHaveBeenCalledWith({
      text: 'what were we even trying to do',
      mode: 'handsfree',
      source: 'native',
    });
  });

  it('removes native speech listeners when foreground recognition is disarmed', async () => {
    vi.useFakeTimers();
    const runtime = createHookRuntime();
    const speechRecognitionModule = {
      getPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
      requestPermissionsAsync: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime, {
      platform: 'android',
      eventEmitterClass: FakeNativeSpeechEventEmitter,
      speechRecognitionModule,
    });
    const onVoiceFinalized = vi.fn();
    const log = vi.fn();

    const recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
      log,
    });
    runtime.commitEffects();

    await recognizer.startRecording();
    const eventEmitter = FakeNativeSpeechEventEmitter.instances[0];
    expect(eventEmitter.listenerCount('result')).toBe(1);

    await recognizer.stopRecognitionOnly();
    expect(eventEmitter.listenerCount('result')).toBe(0);

    eventEmitter.emit('result', {
      isFinal: true,
      results: [{ transcript: 'hey bro' }],
    });
    vi.advanceTimersByTime(500);

    expect(onVoiceFinalized).not.toHaveBeenCalled();
    expect(log.mock.calls.map(([, summary]) => summary)).not.toContain('Native speech recognizer produced a result.');
  });

  it('clears the STT preview immediately without leaving an expiry timer active', async () => {
    vi.useFakeTimers();
    const runtime = createHookRuntime();
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime);
    const onVoiceFinalized = vi.fn();

    let recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
    });

    recognizer.setSttPreviewWithExpiry('follow up prompt');
    recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
    });
    expect(recognizer.sttPreview).toBe('follow up prompt');

    recognizer.setSttPreviewWithExpiry('');
    recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
    });
    expect(recognizer.sttPreview).toBe('');

    vi.advanceTimersByTime(5_000);
    recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
    });
    expect(recognizer.sttPreview).toBe('');
  });

  it('suppresses native hands-free partial results while the assistant is busy or speaking', async () => {
    vi.useFakeTimers();
    const runtime = createHookRuntime();
    const speechRecognitionModule = {
      getPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
      requestPermissionsAsync: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime, {
      platform: 'android',
      eventEmitterClass: FakeNativeSpeechEventEmitter,
      speechRecognitionModule,
    });
    const onVoiceFinalized = vi.fn();
    const log = vi.fn();
    const shouldSuppressHandsFreeTranscript = vi.fn(() => true);
    const props = {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
      shouldSuppressHandsFreeTranscript,
      log,
    };

    let recognizer = runtime.render(useSpeechRecognizer, props);
    runtime.commitEffects();

    await recognizer.startRecording();
    const eventEmitter = FakeNativeSpeechEventEmitter.instances[0];
    eventEmitter.emit('result', {
      isFinal: false,
      results: [{ transcript: 'assistant speech should not queue' }],
    });

    recognizer = runtime.render(useSpeechRecognizer, props);
    expect(recognizer.sttPreview).toBe('');

    vi.advanceTimersByTime(500);
    expect(onVoiceFinalized).not.toHaveBeenCalled();
    expect(log.mock.calls.find(([type]) => type === 'transcript-ignored')?.[2]).toMatchObject({
      source: 'native',
      text: 'assistant speech should not queue',
    });
  });

  it('acquires Android hands-free audio routing before foreground native recognition starts', async () => {
    const runtime = createHookRuntime();
    const speechRecognitionModule = {
      getPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
      requestPermissionsAsync: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const setAndroidHandsFreeAudioRoutingEnabled = vi.fn().mockResolvedValue(null);
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime, {
      platform: 'android',
      eventEmitterClass: FakeNativeSpeechEventEmitter,
      speechRecognitionModule,
      androidHandsFreeService: { setAndroidHandsFreeAudioRoutingEnabled },
    });
    const onVoiceFinalized = vi.fn();

    const recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
    });
    runtime.commitEffects();

    await recognizer.startRecording();

    expect(setAndroidHandsFreeAudioRoutingEnabled).toHaveBeenCalledWith(true, 'foreground');
    expect(setAndroidHandsFreeAudioRoutingEnabled.mock.invocationCallOrder[0]).toBeLessThan(
      speechRecognitionModule.start.mock.invocationCallOrder[0],
    );

    await recognizer.stopRecognitionOnly();

    expect(setAndroidHandsFreeAudioRoutingEnabled).toHaveBeenLastCalledWith(false, 'foreground');
  });

  it('treats Chrome already-started web recognizer errors as an idempotent active state', async () => {
    (globalThis as any).window = { SpeechRecognition: FakeSpeechRecognition };
    FakeSpeechRecognition.nextStartError = new Error(
      "Failed to execute 'start' on 'SpeechRecognition': recognition has already started.",
    );
    const runtime = createHookRuntime();
    const { useSpeechRecognizer } = await loadUseSpeechRecognizer(runtime);
    const onVoiceFinalized = vi.fn();
    const onRecognizerError = vi.fn();
    const log = vi.fn();

    const recognizer = runtime.render(useSpeechRecognizer, {
      handsFree: true,
      handsFreeDebounceMs: 500,
      willCancel: false,
      onVoiceFinalized,
      onRecognizerError,
      log,
    });
    runtime.commitEffects();

    await recognizer.startRecording();

    expect(onRecognizerError).not.toHaveBeenCalled();
    expect(log.mock.calls.find(([, summary]) => summary === 'Web speech recognizer was already active.')?.[2]).toMatchObject({
      source: 'web',
      reason: 'initial-start',
    });
    expect(FakeSpeechRecognition.instances[0].startCalls).toBe(1);
  });
});
