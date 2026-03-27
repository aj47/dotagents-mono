import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HandsFreePhase, HandsFreeResumePhase } from '@dotagents/shared';
import { matchSleepPhrase, matchWakePhrase, normalizeVoicePhrase } from './phraseMatcher';
import type { VoiceDebugLog } from './voiceDebug';

export type HandsFreeControllerState = {
  phase: HandsFreePhase;
  resumePhase: HandsFreeResumePhase | null;
  pauseReason: 'user' | 'background' | null;
  awakeSince: number | null;
  lastError: string | null;
  lastTranscript: string;
  recognizerErrorCount: number;
};

export type HandsFreeUtteranceAction =
  | { type: 'none' }
  | { type: 'send'; text: string };

type ResolveHandsFreeUtteranceArgs = {
  state: HandsFreeControllerState;
  transcript: string;
  wakePhrase: string;
  sleepPhrase: string;
  now: number;
};

type HandsFreeControllerOptions = {
  enabled: boolean;
  runtimeActive: boolean;
  wakePhrase: string;
  sleepPhrase: string;
  log?: VoiceDebugLog;
  maxAwakeMs?: number;
  noSpeechTimeoutMs?: number;
  repeatedErrorThreshold?: number;
};

export const DEFAULT_HANDS_FREE_MAX_AWAKE_MS = 10 * 60 * 1000;
export const DEFAULT_HANDS_FREE_NO_SPEECH_TIMEOUT_MS = 45 * 1000;
const DEFAULT_REPEATED_ERROR_THRESHOLD = 3;

export function createInitialHandsFreeState(): HandsFreeControllerState {
  return {
    phase: 'sleeping',
    resumePhase: null,
    pauseReason: null,
    awakeSince: null,
    lastError: null,
    lastTranscript: '',
    recognizerErrorCount: 0,
  };
}

function resumablePhase(phase: HandsFreePhase, resumePhase: HandsFreeResumePhase | null): HandsFreeResumePhase {
  if (phase === 'processing') return 'processing';
  if (phase === 'listening' || phase === 'waking' || phase === 'speaking') return 'listening';
  return resumePhase ?? 'sleeping';
}

function transitionToSleeping(state: HandsFreeControllerState): HandsFreeControllerState {
  return {
    ...state,
    phase: 'sleeping',
    resumePhase: null,
    pauseReason: null,
    awakeSince: null,
    lastError: null,
  };
}

export function getHandsFreeStatusLabel(phase: HandsFreePhase): string {
  switch (phase) {
    case 'sleeping':
      return 'Sleeping';
    case 'waking':
      return 'Wake phrase heard';
    case 'listening':
      return 'Listening';
    case 'processing':
      return 'Thinking';
    case 'speaking':
      return 'Speaking';
    case 'paused':
      return 'Paused';
    case 'error':
      return 'Voice error';
    default:
      return 'Sleeping';
  }
}

export function resolveHandsFreeUtterance({
  state,
  transcript,
  wakePhrase,
  sleepPhrase,
  now,
}: ResolveHandsFreeUtteranceArgs): {
  nextState: HandsFreeControllerState;
  action: HandsFreeUtteranceAction;
  matchedWake: boolean;
  matchedSleep: boolean;
} {
  const normalizedTranscript = normalizeVoicePhrase(transcript);
  if (!normalizedTranscript) {
    return { nextState: state, action: { type: 'none' }, matchedWake: false, matchedSleep: false };
  }

  if (state.pauseReason === 'user' || state.phase === 'paused' || state.phase === 'error') {
    return {
      nextState: { ...state, lastTranscript: normalizedTranscript },
      action: { type: 'none' },
      matchedWake: false,
      matchedSleep: false,
    };
  }

  if (state.phase === 'sleeping') {
    const wakeMatch = matchWakePhrase(normalizedTranscript, wakePhrase);
    if (!wakeMatch.matched) {
      return {
        nextState: { ...state, lastTranscript: normalizedTranscript },
        action: { type: 'none' },
        matchedWake: false,
        matchedSleep: false,
      };
    }

    if (wakeMatch.remainder) {
      return {
        nextState: {
          ...state,
          phase: 'processing',
          resumePhase: 'listening',
          awakeSince: state.awakeSince ?? now,
          lastTranscript: wakeMatch.remainder,
          lastError: null,
          recognizerErrorCount: 0,
        },
        action: { type: 'send', text: wakeMatch.remainder },
        matchedWake: true,
        matchedSleep: false,
      };
    }

    return {
      nextState: {
        ...state,
        phase: 'waking',
        awakeSince: state.awakeSince ?? now,
        lastTranscript: wakeMatch.normalizedTranscript,
        lastError: null,
        recognizerErrorCount: 0,
      },
      action: { type: 'none' },
      matchedWake: true,
      matchedSleep: false,
    };
  }

  if (state.phase === 'waking' || state.phase === 'listening') {
    const sleepMatch = matchSleepPhrase(normalizedTranscript, sleepPhrase);
    if (sleepMatch.matched) {
      return {
        nextState: {
          ...transitionToSleeping(state),
          lastTranscript: sleepMatch.normalizedTranscript,
        },
        action: { type: 'none' },
        matchedWake: false,
        matchedSleep: true,
      };
    }

    return {
      nextState: {
        ...state,
        phase: 'processing',
        resumePhase: 'listening',
        awakeSince: state.awakeSince ?? now,
        lastTranscript: normalizedTranscript,
        lastError: null,
        recognizerErrorCount: 0,
      },
      action: { type: 'send', text: normalizedTranscript },
      matchedWake: false,
      matchedSleep: false,
    };
  }

  if (state.phase === 'processing' || state.phase === 'speaking') {
    const sleepMatch = matchSleepPhrase(normalizedTranscript, sleepPhrase);
    if (sleepMatch.matched) {
      return {
        nextState: {
          ...transitionToSleeping(state),
          lastTranscript: sleepMatch.normalizedTranscript,
        },
        action: { type: 'none' },
        matchedWake: false,
        matchedSleep: true,
      };
    }

    const wakeMatch = matchWakePhrase(normalizedTranscript, wakePhrase);
    if (wakeMatch.matched) {
      if (wakeMatch.remainder) {
        return {
          nextState: {
            ...state,
            lastTranscript: wakeMatch.remainder,
          },
          action: { type: 'send', text: wakeMatch.remainder },
          matchedWake: true,
          matchedSleep: false,
        };
      }

      return {
        nextState: {
          ...state,
          lastTranscript: wakeMatch.normalizedTranscript,
        },
        action: { type: 'none' },
        matchedWake: true,
        matchedSleep: false,
      };
    }

    return {
      nextState: {
        ...state,
        lastTranscript: normalizedTranscript,
      },
      action: { type: 'send', text: normalizedTranscript },
      matchedWake: false,
      matchedSleep: false,
    };
  }

  return {
    nextState: { ...state, lastTranscript: normalizedTranscript },
    action: { type: 'none' },
    matchedWake: false,
    matchedSleep: false,
  };
}

export function useHandsFreeController(options: HandsFreeControllerOptions) {
  const {
    enabled,
    runtimeActive,
    wakePhrase,
    sleepPhrase,
    log,
    maxAwakeMs = DEFAULT_HANDS_FREE_MAX_AWAKE_MS,
    noSpeechTimeoutMs = DEFAULT_HANDS_FREE_NO_SPEECH_TIMEOUT_MS,
    repeatedErrorThreshold = DEFAULT_REPEATED_ERROR_THRESHOLD,
  } = options;

  const [state, setState] = useState<HandsFreeControllerState>(createInitialHandsFreeState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateState = useCallback((updater: (prev: HandsFreeControllerState) => HandsFreeControllerState) => {
    setState((prev) => {
      const next = updater(prev);
      stateRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      updateState(() => createInitialHandsFreeState());
      return;
    }

    if (!runtimeActive) {
      updateState((prev) => {
        if (prev.pauseReason === 'user' || prev.phase === 'paused') {
          return prev;
        }
        log?.('background-pause', 'Handsfree paused while Chat left the foreground.');
        return {
          ...prev,
          phase: 'paused',
          pauseReason: 'background',
          resumePhase: resumablePhase(prev.phase, prev.resumePhase),
        };
      });
      return;
    }

    updateState((prev) => {
      if (prev.pauseReason !== 'background') {
        return prev;
      }
      const nextPhase = prev.resumePhase ?? (prev.awakeSince ? 'listening' : 'sleeping');
      log?.('foreground-resume', 'Handsfree resumed after Chat returned to the foreground.');
      return {
        ...prev,
        phase: nextPhase,
        pauseReason: null,
        resumePhase: null,
      };
    });
  }, [enabled, runtimeActive, updateState, log]);

  useEffect(() => {
    if (state.phase !== 'waking') {
      return;
    }

    const timer = setTimeout(() => {
      updateState((prev) => (prev.phase === 'waking'
        ? { ...prev, phase: 'listening' }
        : prev));
    }, 900);

    return () => clearTimeout(timer);
  }, [state.phase, updateState]);

  useEffect(() => {
    if (!enabled || !runtimeActive || state.pauseReason === 'user') {
      return;
    }
    if (state.phase !== 'listening' && state.phase !== 'waking' && state.phase !== 'processing' && state.phase !== 'speaking') {
      return;
    }

    const sessionTimer = state.awakeSince
      ? setTimeout(() => {
          updateState((prev) => transitionToSleeping(prev));
          log?.('session-timeout', 'Handsfree session timed out and returned to sleep.');
        }, Math.max(0, maxAwakeMs - (Date.now() - state.awakeSince)))
      : null;

    const noSpeechTimer = state.phase === 'listening'
      ? setTimeout(() => {
          updateState((prev) => transitionToSleeping(prev));
          log?.('no-speech-timeout', 'No speech heard; handsfree returned to sleep.');
        }, noSpeechTimeoutMs)
      : null;

    return () => {
      if (sessionTimer) clearTimeout(sessionTimer);
      if (noSpeechTimer) clearTimeout(noSpeechTimer);
    };
  }, [
    enabled,
    runtimeActive,
    state.phase,
    state.awakeSince,
    state.pauseReason,
    updateState,
    log,
    maxAwakeMs,
    noSpeechTimeoutMs,
  ]);

  const handleFinalTranscript = useCallback((transcript: string): HandsFreeUtteranceAction => {
    const result = resolveHandsFreeUtterance({
      state: stateRef.current,
      transcript,
      wakePhrase,
      sleepPhrase,
      now: Date.now(),
    });
    updateState(() => result.nextState);

    if (result.matchedWake) {
      log?.('wake-phrase-matched', 'Wake phrase matched.', { transcript: result.nextState.lastTranscript });
    }
    if (result.matchedSleep) {
      log?.('sleep-phrase-matched', 'Sleep phrase matched.', { transcript: result.nextState.lastTranscript });
    }
    if (result.action.type === 'send') {
      log?.('auto-send', 'Handsfree request captured.', { text: result.action.text });
    }

    return result.action;
  }, [log, sleepPhrase, updateState, wakePhrase]);

  const onRequestStarted = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      phase: prev.phase === 'speaking' ? prev.phase : 'processing',
      resumePhase: prev.phase === 'speaking' ? prev.resumePhase : 'listening',
      awakeSince: prev.awakeSince ?? Date.now(),
      lastError: null,
    }));
  }, [updateState]);

  const onRequestCompleted = useCallback(() => {
    updateState((prev) => {
      if (prev.phase === 'speaking') {
        return { ...prev, resumePhase: 'listening' };
      }
      if (prev.pauseReason === 'user') {
        return prev;
      }
      return { ...prev, phase: 'listening', resumePhase: null, lastError: null };
    });
  }, [updateState]);

  const onSpeechStarted = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      phase: 'speaking',
      resumePhase: resumablePhase(prev.phase, prev.resumePhase),
    }));
  }, [updateState]);

  const onSpeechFinished = useCallback(() => {
    updateState((prev) => {
      if (prev.pauseReason === 'user') {
        return { ...prev, phase: 'paused', resumePhase: prev.resumePhase ?? 'sleeping' };
      }
      const nextPhase = prev.resumePhase ?? (prev.awakeSince ? 'listening' : 'sleeping');
      return {
        ...prev,
        phase: nextPhase,
        resumePhase: null,
      };
    });
  }, [updateState]);

  const pauseByUser = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      phase: 'paused',
      pauseReason: 'user',
      resumePhase: resumablePhase(prev.phase, prev.resumePhase),
    }));
  }, [updateState]);

  const resumeByUser = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      phase: prev.resumePhase ?? (prev.awakeSince ? 'listening' : 'sleeping'),
      pauseReason: null,
      resumePhase: null,
      lastError: null,
    }));
  }, [updateState]);

  const wakeByUser = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      phase: 'listening',
      pauseReason: null,
      resumePhase: null,
      awakeSince: Date.now(),
      lastError: null,
    }));
  }, [updateState]);

  const sleepByUser = useCallback(() => {
    updateState((prev) => transitionToSleeping(prev));
  }, [updateState]);

  const onRecognizerError = useCallback((message: string) => {
    updateState((prev) => {
      const recognizerErrorCount = prev.recognizerErrorCount + 1;
      if (recognizerErrorCount >= repeatedErrorThreshold) {
        return {
          ...prev,
          phase: 'error',
          resumePhase: 'sleeping',
          lastError: message,
          recognizerErrorCount,
        };
      }

      return {
        ...prev,
        phase: 'sleeping',
        resumePhase: null,
        lastError: message,
        recognizerErrorCount,
      };
    });
    log?.('recognizer-error', 'Speech recognizer error.', { message });
  }, [log, repeatedErrorThreshold, updateState]);

  const reset = useCallback(() => {
    updateState(() => createInitialHandsFreeState());
  }, [updateState]);

  const resetError = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      phase: 'sleeping',
      resumePhase: null,
      pauseReason: null,
      lastError: null,
      recognizerErrorCount: 0,
    }));
  }, [updateState]);

  const shouldKeepRecognizerActive = useMemo(
    () => enabled
      && runtimeActive
      && state.pauseReason !== 'user'
      && (state.phase === 'sleeping'
        || state.phase === 'waking'
        || state.phase === 'listening'
        || state.phase === 'processing'),
    [enabled, runtimeActive, state.phase, state.pauseReason],
  );

  return {
    state,
    statusLabel: getHandsFreeStatusLabel(state.phase),
    shouldKeepRecognizerActive,
    handleFinalTranscript,
    onRequestStarted,
    onRequestCompleted,
    onSpeechStarted,
    onSpeechFinished,
    onRecognizerError,
    pauseByUser,
    resumeByUser,
    wakeByUser,
    sleepByUser,
    reset,
    resetError,
  } as const;
}
