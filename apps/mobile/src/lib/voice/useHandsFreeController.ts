import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_HANDS_FREE_MAX_AWAKE_MS,
  DEFAULT_HANDS_FREE_NO_SPEECH_TIMEOUT_MS,
  DEFAULT_HANDS_FREE_REPEATED_ERROR_THRESHOLD,
  createInitialHandsFreeState,
  getHandsFreeResumePhase,
  getHandsFreeStatusLabel,
  resolveHandsFreeUtterance,
  transitionHandsFreeToSleeping,
  type HandsFreeControllerState,
  type HandsFreeUtteranceAction,
} from '@dotagents/shared/hands-free-controller';
import type { VoiceDebugLog } from './voiceDebug';

export {
  DEFAULT_HANDS_FREE_MAX_AWAKE_MS,
  DEFAULT_HANDS_FREE_NO_SPEECH_TIMEOUT_MS,
  DEFAULT_HANDS_FREE_REPEATED_ERROR_THRESHOLD,
  createInitialHandsFreeState,
  getHandsFreeResumePhase,
  getHandsFreeStatusLabel,
  resolveHandsFreeUtterance,
  transitionHandsFreeToSleeping,
};
export type { HandsFreeControllerState, HandsFreeUtteranceAction } from '@dotagents/shared/hands-free-controller';

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

export function useHandsFreeController(options: HandsFreeControllerOptions) {
  const {
    enabled,
    runtimeActive,
    wakePhrase,
    sleepPhrase,
    log,
    maxAwakeMs = DEFAULT_HANDS_FREE_MAX_AWAKE_MS,
    noSpeechTimeoutMs = DEFAULT_HANDS_FREE_NO_SPEECH_TIMEOUT_MS,
    repeatedErrorThreshold = DEFAULT_HANDS_FREE_REPEATED_ERROR_THRESHOLD,
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
          resumePhase: getHandsFreeResumePhase(prev.phase, prev.resumePhase),
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
          updateState((prev) => transitionHandsFreeToSleeping(prev));
          log?.('session-timeout', 'Handsfree session timed out and returned to sleep.');
        }, Math.max(0, maxAwakeMs - (Date.now() - state.awakeSince)))
      : null;

    const noSpeechTimer = state.phase === 'listening'
      ? setTimeout(() => {
          updateState((prev) => transitionHandsFreeToSleeping(prev));
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
      resumePhase: getHandsFreeResumePhase(prev.phase, prev.resumePhase),
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
      resumePhase: getHandsFreeResumePhase(prev.phase, prev.resumePhase),
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
      recognizerErrorCount: 0,
    }));
  }, [updateState]);

  const sleepByUser = useCallback(() => {
    updateState((prev) => transitionHandsFreeToSleeping(prev));
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
