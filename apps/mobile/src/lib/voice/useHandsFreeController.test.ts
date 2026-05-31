import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createInitialHandsFreeState,
  isExpectedHandsFreeRecognizerStopError,
  resolveHandsFreeUtterance,
} from './useHandsFreeController';

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

  const reactMock: any = {
    __esModule: true,
    default: {} as any,
    useState,
    useRef,
    useEffect,
    useCallback: (fn: any) => fn,
    useMemo: (factory: () => any) => factory(),
  };
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

async function loadUseHandsFreeController(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules();
  vi.doMock('react', () => runtime.reactMock);
  return import('./useHandsFreeController');
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unmock('react');
});

describe('resolveHandsFreeUtterance', () => {
  it('keeps sleeping when no wake phrase is present', () => {
    const result = resolveHandsFreeUtterance({
      state: createInitialHandsFreeState(),
      transcript: 'tell me a joke',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 100,
    });

    expect(result.action).toEqual({ type: 'none' });
    expect(result.nextState.phase).toBe('sleeping');
    expect(result.nextState.lastTranscript).toBe('tell me a joke');
  });

  it('sends direct foreground speech while sleeping when explicitly allowed', () => {
    const result = resolveHandsFreeUtterance({
      state: createInitialHandsFreeState(),
      transcript: 'tell me a joke',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      allowDirectSpeechWhileSleeping: true,
      now: 100,
    });

    expect(result.action).toEqual({ type: 'send', text: 'tell me a joke' });
    expect(result.nextState.phase).toBe('processing');
    expect(result.nextState.resumePhase).toBe('listening');
    expect(result.nextState.awakeSince).toBe(100);
  });

  it('wakes without sending when only the wake phrase is heard', () => {
    const result = resolveHandsFreeUtterance({
      state: createInitialHandsFreeState(),
      transcript: 'hey dot agents',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 100,
    });

    expect(result.action).toEqual({ type: 'none' });
    expect(result.nextState.phase).toBe('waking');
    expect(result.matchedWake).toBe(true);
  });

  it('sends the remainder when wake phrase and request are combined', () => {
    const result = resolveHandsFreeUtterance({
      state: createInitialHandsFreeState(),
      transcript: 'hey dot agents what is the weather',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 100,
    });

    expect(result.action).toEqual({ type: 'send', text: 'what is the weather' });
    expect(result.nextState.phase).toBe('processing');
    expect(result.nextState.resumePhase).toBe('listening');
  });

  it('returns to sleep when the sleep phrase is spoken while awake', () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: 'listening', awakeSince: 100 },
      transcript: 'go to sleep',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 200,
    });

    expect(result.action).toEqual({ type: 'none' });
    expect(result.nextState.phase).toBe('sleeping');
    expect(result.matchedSleep).toBe(true);
  });

  it('sends a normal utterance while awake', () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: 'listening', awakeSince: 100 },
      transcript: 'summarize my unread email',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 200,
    });

    expect(result.action).toEqual({ type: 'send', text: 'summarize my unread email' });
    expect(result.nextState.phase).toBe('processing');
  });

  it('sends non-control speech while already processing so the chat queue can capture follow-ups', () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: 'processing', awakeSince: 100, resumePhase: 'listening' },
      transcript: 'also draft a summary email',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 250,
    });

    expect(result.action).toEqual({ type: 'send', text: 'also draft a summary email' });
    expect(result.nextState.phase).toBe('processing');
    expect(result.nextState.lastTranscript).toBe('also draft a summary email');
  });

  it('sends the wake phrase remainder while already processing', () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: 'processing', awakeSince: 100, resumePhase: 'listening' },
      transcript: 'hey dot agents also check my calendar',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 255,
    });

    expect(result.action).toEqual({ type: 'send', text: 'also check my calendar' });
    expect(result.nextState.phase).toBe('processing');
    expect(result.matchedWake).toBe(true);
  });

  it('ignores non-control speech while assistant audio is speaking', () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: 'speaking', awakeSince: 100, resumePhase: 'listening' },
      transcript: 'this sounds like assistant audio leaking back into the mic',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 250,
    });

    expect(result.action).toEqual({ type: 'none' });
    expect(result.nextState.phase).toBe('speaking');
    expect(result.nextState.lastTranscript).toBe('this sounds like assistant audio leaking back into the mic');
  });

  it('honors sleep phrase while processing', () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: 'processing', awakeSince: 100, resumePhase: 'listening' },
      transcript: 'go to sleep',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 260,
    });

    expect(result.action).toEqual({ type: 'none' });
    expect(result.nextState.phase).toBe('sleeping');
    expect(result.matchedSleep).toBe(true);
  });

  it('emits a command action when the user says "stop" while processing instead of sending it as a message', () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: 'processing', awakeSince: 100, resumePhase: 'listening' },
      transcript: 'stop',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 270,
    });

    expect(result.action.type).toBe('command');
    if (result.action.type === 'command') {
      expect(result.action.command).toBe('stop-agent-turn');
    }
    expect(result.matchedCommand).toBe('stop-agent-turn');
    expect(result.nextState.phase).toBe('processing');
  });

  it('emits a stop-tts command while the assistant is speaking', () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: 'speaking', awakeSince: 100, resumePhase: 'listening' },
      transcript: 'stop talking',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 280,
    });

    expect(result.action.type).toBe('command');
    if (result.action.type === 'command') {
      expect(result.action.command).toBe('stop-tts');
    }
    expect(result.matchedCommand).toBe('stop-tts');
    expect(result.nextState.phase).toBe('speaking');
  });

  it('emits a new-session command while awake instead of treating it as chat input', () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: 'listening', awakeSince: 100 },
      transcript: 'new chat',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 290,
    });

    expect(result.action.type).toBe('command');
    if (result.action.type === 'command') {
      expect(result.action.command).toBe('new-session');
    }
    expect(result.nextState.phase).toBe('listening');
  });

  it('emits a command after the wake phrase from sleep without round-tripping through the assistant', () => {
    const result = resolveHandsFreeUtterance({
      state: createInitialHandsFreeState(),
      transcript: 'hey dot agents stop talking',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 100,
    });

    expect(result.matchedWake).toBe(true);
    expect(result.action.type).toBe('command');
    if (result.action.type === 'command') {
      expect(result.action.command).toBe('stop-tts');
    }
    expect(result.nextState.phase).toBe('listening');
  });

  it('does not send a bare wake phrase while already processing', () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: 'processing', awakeSince: 100, resumePhase: 'listening' },
      transcript: 'hey dot agents',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 270,
    });

    expect(result.action).toEqual({ type: 'none' });
    expect(result.nextState.phase).toBe('processing');
    expect(result.matchedWake).toBe(true);
  });

  it('resets controller state when hands-free is disabled after waking up', async () => {
    const runtime = createHookRuntime();
    const { useHandsFreeController: useHook } = await loadUseHandsFreeController(runtime);
    const options = {
      runtimeActive: true,
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
    };

    let controller = runtime.render(useHook, { ...options, enabled: true });
    runtime.commitEffects();
    controller = runtime.render(useHook, { ...options, enabled: true });

    expect(controller.shouldKeepRecognizerActive).toBe(true);

    expect(controller.handleFinalTranscript('hey dot agents what is the weather')).toEqual({
      type: 'send',
      text: 'what is the weather',
    });

    controller = runtime.render(useHook, { ...options, enabled: true });
    expect(controller.state.phase).toBe('processing');
    expect(controller.state.resumePhase).toBe('listening');

    controller = runtime.render(useHook, { ...options, enabled: false, runtimeActive: false });
    runtime.commitEffects();
    controller = runtime.render(useHook, { ...options, enabled: false, runtimeActive: false });

    expect(controller.state).toEqual(createInitialHandsFreeState());
    expect(controller.shouldKeepRecognizerActive).toBe(false);
  });

  it('lets the user wake hands-free mode from a sleeping state', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(500);
    const runtime = createHookRuntime();
    const { useHandsFreeController: useHook } = await loadUseHandsFreeController(runtime);
    const options = {
      enabled: true,
      runtimeActive: true,
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
    };

    let controller = runtime.render(useHook, options);
    runtime.commitEffects();

    controller.wakeByUser();
    controller = runtime.render(useHook, options);

    expect(controller.state.phase).toBe('listening');
    expect(controller.state.awakeSince).toBe(500);
    expect(controller.shouldKeepRecognizerActive).toBe(true);
  });

  it('keeps a user-woken session awake after a no-speech recognizer cycle', async () => {
    const runtime = createHookRuntime();
    const { useHandsFreeController: useHook } = await loadUseHandsFreeController(runtime);
    const options = {
      enabled: true,
      runtimeActive: true,
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
    };

    let controller = runtime.render(useHook, options);
    runtime.commitEffects();
    controller.wakeByUser();

    controller = runtime.render(useHook, options);
    controller.onRecognizerError('no-speech');

    controller = runtime.render(useHook, options);
    expect(controller.state.phase).toBe('listening');
    expect(controller.state.lastError).toBeNull();
    expect(controller.state.recognizerErrorCount).toBe(0);
    expect(controller.shouldKeepRecognizerActive).toBe(true);
  });

  it('treats Android server-disconnected recognizer errors as recoverable', async () => {
    const runtime = createHookRuntime();
    const { useHandsFreeController: useHook } = await loadUseHandsFreeController(runtime);
    const options = {
      enabled: true,
      runtimeActive: true,
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
    };

    let controller = runtime.render(useHook, options);
    runtime.commitEffects();
    controller.wakeByUser();

    controller = runtime.render(useHook, options);
    controller.onRecognizerError('Server disconnected');

    controller = runtime.render(useHook, options);
    expect(controller.state.phase).toBe('listening');
    expect(controller.state.lastError).toBeNull();
    expect(controller.state.recognizerErrorCount).toBe(0);
    expect(controller.shouldKeepRecognizerActive).toBe(true);
  });

  it('identifies recognizer stop errors expected during assistant speech handoff', () => {
    expect(isExpectedHandsFreeRecognizerStopError('client')).toBe(true);
    expect(isExpectedHandsFreeRecognizerStopError('Other client side errors.')).toBe(true);
    expect(isExpectedHandsFreeRecognizerStopError('CANCELLED')).toBe(true);
    expect(isExpectedHandsFreeRecognizerStopError('network')).toBe(false);
  });

  it('treats expected Android stop/cancel recognizer errors as recoverable', async () => {
    const runtime = createHookRuntime();
    const { useHandsFreeController: useHook } = await loadUseHandsFreeController(runtime);
    const options = {
      enabled: true,
      runtimeActive: true,
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
    };

    let controller = runtime.render(useHook, options);
    runtime.commitEffects();
    controller.wakeByUser();

    controller = runtime.render(useHook, options);
    controller.onRecognizerError('Other client side errors.');

    controller = runtime.render(useHook, options);
    expect(controller.state.phase).toBe('listening');
    expect(controller.state.lastError).toBeNull();
    expect(controller.state.recognizerErrorCount).toBe(0);
    expect(controller.shouldKeepRecognizerActive).toBe(true);
  });

  it('does not automatically return an idle awake session to sleep', async () => {
    vi.useFakeTimers();
    const runtime = createHookRuntime();
    const { useHandsFreeController: useHook } = await loadUseHandsFreeController(runtime);
    const options = {
      enabled: true,
      runtimeActive: true,
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
    };

    let controller = runtime.render(useHook, options);
    runtime.commitEffects();
    controller.wakeByUser();

    controller = runtime.render(useHook, options);
    runtime.commitEffects();
    vi.advanceTimersByTime(11 * 60 * 1000);

    controller = runtime.render(useHook, options);
    expect(controller.state.phase).toBe('listening');
    expect(controller.shouldKeepRecognizerActive).toBe(true);
  });

  it('recovers from a recognizer error back to the prior awake phase', async () => {
    const runtime = createHookRuntime();
    const { useHandsFreeController: useHook } = await loadUseHandsFreeController(runtime);
    const options = {
      enabled: true,
      runtimeActive: true,
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      repeatedErrorThreshold: 1,
    };

    let controller = runtime.render(useHook, options);
    runtime.commitEffects();
    controller.wakeByUser();

    controller = runtime.render(useHook, options);
    controller.onRecognizerError('network');

    controller = runtime.render(useHook, options);
    expect(controller.state.phase).toBe('error');
    expect(controller.state.resumePhase).toBe('listening');

    controller.resetError();
    controller = runtime.render(useHook, options);
    expect(controller.state.phase).toBe('listening');
    expect(controller.shouldKeepRecognizerActive).toBe(true);
  });

  it('resumes to listening after a request completes while user-paused during processing', async () => {
    const runtime = createHookRuntime();
    const { useHandsFreeController: useHook } = await loadUseHandsFreeController(runtime);
    const options = {
      enabled: true,
      runtimeActive: true,
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
    };

    let controller = runtime.render(useHook, options);
    runtime.commitEffects();
    controller.wakeByUser();

    controller = runtime.render(useHook, options);
    controller.onRequestStarted();

    controller = runtime.render(useHook, options);
    expect(controller.state.phase).toBe('processing');

    controller.pauseByUser();

    controller = runtime.render(useHook, options);
    expect(controller.state.phase).toBe('paused');
    expect(controller.state.resumePhase).toBe('processing');

    controller.onRequestCompleted();

    controller = runtime.render(useHook, options);
    expect(controller.state.phase).toBe('paused');
    expect(controller.state.resumePhase).toBe('listening');

    controller.resumeByUser();

    controller = runtime.render(useHook, options);
    expect(controller.state.phase).toBe('listening');
    expect(controller.shouldKeepRecognizerActive).toBe(true);
  });

  it('keeps the recognizer armed while assistant speech is active for stop/wait barge-in commands', async () => {
    const runtime = createHookRuntime();
    const { useHandsFreeController: useHook } = await loadUseHandsFreeController(runtime);
    const options = {
      enabled: true,
      runtimeActive: true,
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
    };

    let controller = runtime.render(useHook, options);
    runtime.commitEffects();
    controller.wakeByUser();
    controller = runtime.render(useHook, options);

    expect(controller.shouldKeepRecognizerActive).toBe(true);

    controller.onSpeechStarted();
    controller = runtime.render(useHook, options);

    expect(controller.state.phase).toBe('speaking');
    expect(controller.shouldKeepRecognizerActive).toBe(true);

    controller.onSpeechFinished();
    controller = runtime.render(useHook, options);

    expect(controller.state.phase).toBe('listening');
    expect(controller.shouldKeepRecognizerActive).toBe(true);
  });

  it('keeps the recognizer armed while processing to avoid audio route churn', async () => {
    const runtime = createHookRuntime();
    const { useHandsFreeController: useHook } = await loadUseHandsFreeController(runtime);
    const options = {
      runtimeActive: true,
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
    };

    let controller = runtime.render(useHook, { ...options, enabled: true });
    runtime.commitEffects();
    controller = runtime.render(useHook, { ...options, enabled: true });

    expect(controller.handleFinalTranscript('hey dot agents what is the weather')).toEqual({
      type: 'send',
      text: 'what is the weather',
    });

    controller = runtime.render(useHook, { ...options, enabled: true });
    expect(controller.state.phase).toBe('processing');
    expect(controller.shouldKeepRecognizerActive).toBe(true);
  });
});
