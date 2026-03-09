import { afterEach, describe, expect, it, vi } from 'vitest';
import { mergeVoiceText } from './mergeVoiceText';

const sameDeps = (a?: unknown[], b?: unknown[]) => (
  a?.length === b?.length && (a ?? []).every((value, index) => Object.is(value, b?.[index]))
);

function createHookRuntime() {
  const state: unknown[] = [];
  const refs: unknown[] = [];
  const effects: Array<{ deps?: unknown[]; fn: () => void | (() => void); cleanup?: () => void; pending: boolean }> = [];
  let cursor = 0;

  return {
    reactExports: {
      useState<T>(initial: T) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index] as T, (value: T | ((current: T) => T)) => {
          state[index] = typeof value === 'function' ? (value as (current: T) => T)(state[index] as T) : value;
        }] as const;
      },
      useRef<T>(initial: T) {
        const index = cursor++;
        if (!(index in refs)) refs[index] = { current: initial };
        return refs[index] as { current: T };
      },
      useEffect(fn: () => void | (() => void), deps?: unknown[]) {
        const index = cursor++;
        const previous = effects[index];
        const pending = !previous || !sameDeps(previous.deps, deps);
        effects[index] = { fn, deps, cleanup: previous?.cleanup, pending };
      },
      useCallback<T extends (...args: any[]) => any>(fn: T) {
        cursor += 1;
        return fn;
      },
    },
    render<TProps, TResult>(component: (props: TProps) => TResult, props: TProps) {
      cursor = 0;
      return component(props);
    },
    commitEffects() {
      effects.forEach((effect) => {
        if (!effect?.pending) return;
        effect.cleanup?.();
        effect.cleanup = effect.fn() || undefined;
        effect.pending = false;
      });
    },
    cleanup() {
      effects.forEach((effect) => effect?.cleanup?.());
    },
  };
}

function createSpeechRecognitionMock() {
  const instances: any[] = [];

  class FakeSpeechRecognition {
    continuous = false;
    interimResults = false;
    lang = 'en-US';
    onstart?: () => void;
    onerror?: (event: any) => void;
    onresult?: (event: any) => void;
    onend?: () => void;
    start = vi.fn(() => this.onstart?.());
    stop = vi.fn(() => this.onend?.());

    constructor() {
      instances.push(this);
    }
  }

  return { instances, FakeSpeechRecognition };
}

async function loadSpeechRecognizer(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules();
  vi.doMock('react', () => runtime.reactExports);
  vi.doMock('react-native', () => ({ Alert: { alert: vi.fn() }, Platform: { OS: 'web' }, View: class View {} }));
  vi.doMock('expo-modules-core', () => ({ EventEmitter: class EventEmitter {} }));
  return import('./useSpeechRecognizer');
}

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
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
  it('uses the latest hands-free mode when reusing the web recognizer after toggle-off', async () => {
    vi.useFakeTimers();

    const runtime = createHookRuntime();
    const { instances, FakeSpeechRecognition } = createSpeechRecognitionMock();
    vi.stubGlobal('window', {
      SpeechRecognition: FakeSpeechRecognition,
      webkitSpeechRecognition: FakeSpeechRecognition,
    });

    const { useSpeechRecognizer } = await loadSpeechRecognizer(runtime);
    const onVoiceFinalized = vi.fn();
    const Harness = (props: Parameters<typeof useSpeechRecognizer>[0]) => useSpeechRecognizer(props);

    let hook = runtime.render(Harness, {
      handsFree: true,
      willCancel: false,
      onVoiceFinalized,
    });
    runtime.commitEffects();

    await hook.startRecording();
    expect(instances).toHaveLength(1);

    await hook.stopRecognitionOnly();

    hook = runtime.render(Harness, {
      handsFree: false,
      willCancel: false,
      onVoiceFinalized,
    });
    runtime.commitEffects();

    hook.handlePushToTalkPressIn({} as any);
    await Promise.resolve();

    const finalResult = Object.assign([{ transcript: 'send this now' }], { isFinal: true });
    instances[0].onresult?.({ resultIndex: 0, results: [finalResult] });

    vi.advanceTimersByTime(250);
    hook.handlePushToTalkPressOut();
    await Promise.resolve();

    expect(onVoiceFinalized).toHaveBeenCalledTimes(1);
    expect(onVoiceFinalized).toHaveBeenLastCalledWith({
      text: 'send this now',
      mode: 'send',
      source: 'web',
    });

    runtime.cleanup();
  });
});
