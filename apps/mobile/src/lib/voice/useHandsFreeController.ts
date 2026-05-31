import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  matchVoiceCommand,
  type HandsFreePhase,
  type HandsFreeResumePhase,
  type VoiceCommandDefinition,
  type VoiceCommandId,
} from '@dotagents/shared';
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
  | { type: 'send'; text: string }
  | { type: 'command'; command: VoiceCommandId; label: string; remainder: string };

type ResolveHandsFreeUtteranceArgs = {
  state: HandsFreeControllerState;
  transcript: string;
  wakePhrase: string;
  sleepPhrase: string;
  allowDirectSpeechWhileSleeping?: boolean;
  voiceCommands?: readonly VoiceCommandDefinition[];
  now: number;
};

type HandsFreeControllerOptions = {
  enabled: boolean;
  runtimeActive: boolean;
  wakePhrase: string;
  sleepPhrase: string;
  allowDirectSpeechWhileSleeping?: boolean;
  voiceCommands?: readonly VoiceCommandDefinition[];
  log?: VoiceDebugLog;
  repeatedErrorThreshold?: number;
};

const DEFAULT_REPEATED_ERROR_THRESHOLD = 3;
const BENIGN_RECOGNIZER_ERRORS = new Set(['no-speech', 'aborted']);
const BENIGN_RECOGNIZER_ERROR_PATTERNS = [
  /server\s+disconnected/i,
  /server[_-]disconnected/i,
];

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

function hasHandsFreeStateChanged(prev: HandsFreeControllerState, next: HandsFreeControllerState) {
  return prev.phase !== next.phase
    || prev.resumePhase !== next.resumePhase
    || prev.pauseReason !== next.pauseReason
    || prev.awakeSince !== next.awakeSince
    || prev.lastError !== next.lastError
    || prev.recognizerErrorCount !== next.recognizerErrorCount;
}

function createHandsFreeStateTransitionDetail(prev: HandsFreeControllerState, next: HandsFreeControllerState) {
  return {
    fromPhase: prev.phase,
    toPhase: next.phase,
    fromPauseReason: prev.pauseReason,
    toPauseReason: next.pauseReason,
    fromResumePhase: prev.resumePhase,
    toResumePhase: next.resumePhase,
    awakeSince: next.awakeSince,
    lastError: next.lastError,
    recognizerErrorCount: next.recognizerErrorCount,
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

export function isBenignHandsFreeRecognizerError(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return BENIGN_RECOGNIZER_ERRORS.has(normalized)
    || BENIGN_RECOGNIZER_ERROR_PATTERNS.some((pattern) => pattern.test(message));
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

function buildCommandAction(
  match: ReturnType<typeof matchVoiceCommand>,
): HandsFreeUtteranceAction {
  if (!match) return { type: 'none' };
  return {
    type: 'command',
    command: match.command,
    label: match.label,
    remainder: match.remainder,
  };
}

export function resolveHandsFreeUtterance({
  state,
  transcript,
  wakePhrase,
  sleepPhrase,
  allowDirectSpeechWhileSleeping = false,
  voiceCommands,
  now,
}: ResolveHandsFreeUtteranceArgs): {
  nextState: HandsFreeControllerState;
  action: HandsFreeUtteranceAction;
  matchedWake: boolean;
  matchedSleep: boolean;
  matchedCommand: VoiceCommandId | null;
} {
  const normalizedTranscript = normalizeVoicePhrase(transcript);
  if (!normalizedTranscript) {
    return {
      nextState: state,
      action: { type: 'none' },
      matchedWake: false,
      matchedSleep: false,
      matchedCommand: null,
    };
  }

  if (state.pauseReason === 'user' || state.phase === 'paused' || state.phase === 'error') {
    return {
      nextState: { ...state, lastTranscript: normalizedTranscript },
      action: { type: 'none' },
      matchedWake: false,
      matchedSleep: false,
      matchedCommand: null,
    };
  }

  if (state.phase === 'sleeping') {
    const wakeMatch = matchWakePhrase(normalizedTranscript, wakePhrase);
    if (!wakeMatch.matched) {
      if (allowDirectSpeechWhileSleeping) {
        const commandMatch = matchVoiceCommand(normalizedTranscript, voiceCommands);
        if (commandMatch) {
          return {
            nextState: {
              ...state,
              awakeSince: state.awakeSince ?? now,
              lastTranscript: normalizedTranscript,
              lastError: null,
              recognizerErrorCount: 0,
            },
            action: buildCommandAction(commandMatch),
            matchedWake: false,
            matchedSleep: false,
            matchedCommand: commandMatch.command,
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
          matchedCommand: null,
        };
      }

      return {
        nextState: { ...state, lastTranscript: normalizedTranscript },
        action: { type: 'none' },
        matchedWake: false,
        matchedSleep: false,
        matchedCommand: null,
      };
    }

    if (wakeMatch.remainder) {
      const commandMatch = matchVoiceCommand(wakeMatch.remainder, voiceCommands);
      if (commandMatch) {
        return {
          nextState: {
            ...state,
            phase: 'listening',
            resumePhase: null,
            awakeSince: state.awakeSince ?? now,
            lastTranscript: wakeMatch.remainder,
            lastError: null,
            recognizerErrorCount: 0,
          },
          action: buildCommandAction(commandMatch),
          matchedWake: true,
          matchedSleep: false,
          matchedCommand: commandMatch.command,
        };
      }
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
        matchedCommand: null,
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
      matchedCommand: null,
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
        matchedCommand: null,
      };
    }

    const commandMatch = matchVoiceCommand(normalizedTranscript, voiceCommands);
    if (commandMatch) {
      return {
        nextState: {
          ...state,
          phase: 'listening',
          awakeSince: state.awakeSince ?? now,
          lastTranscript: normalizedTranscript,
          lastError: null,
          recognizerErrorCount: 0,
        },
        action: buildCommandAction(commandMatch),
        matchedWake: false,
        matchedSleep: false,
        matchedCommand: commandMatch.command,
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
      matchedCommand: null,
    };
  }

  if (state.phase === 'speaking') {
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
        matchedCommand: null,
      };
    }

    const commandMatch = matchVoiceCommand(normalizedTranscript, voiceCommands);
    if (commandMatch) {
      return {
        nextState: {
          ...state,
          lastTranscript: normalizedTranscript,
        },
        action: buildCommandAction(commandMatch),
        matchedWake: false,
        matchedSleep: false,
        matchedCommand: commandMatch.command,
      };
    }

    const wakeMatch = matchWakePhrase(normalizedTranscript, wakePhrase);
    if (wakeMatch.matched) {
      return {
        nextState: {
          ...state,
          lastTranscript: wakeMatch.remainder || wakeMatch.normalizedTranscript,
        },
        action: { type: 'none' },
        matchedWake: true,
        matchedSleep: false,
        matchedCommand: null,
      };
    }

    return {
      nextState: {
        ...state,
        lastTranscript: normalizedTranscript,
      },
      action: { type: 'none' },
      matchedWake: false,
      matchedSleep: false,
      matchedCommand: null,
    };
  }

  if (state.phase === 'processing') {
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
        matchedCommand: null,
      };
    }

    const commandMatch = matchVoiceCommand(normalizedTranscript, voiceCommands);
    if (commandMatch) {
      return {
        nextState: {
          ...state,
          lastTranscript: normalizedTranscript,
        },
        action: buildCommandAction(commandMatch),
        matchedWake: false,
        matchedSleep: false,
        matchedCommand: commandMatch.command,
      };
    }

    const wakeMatch = matchWakePhrase(normalizedTranscript, wakePhrase);
    if (wakeMatch.matched) {
      const remainderCommand = wakeMatch.remainder
        ? matchVoiceCommand(wakeMatch.remainder, voiceCommands)
        : null;
      if (remainderCommand) {
        return {
          nextState: {
            ...state,
            lastTranscript: wakeMatch.remainder,
          },
          action: buildCommandAction(remainderCommand),
          matchedWake: true,
          matchedSleep: false,
          matchedCommand: remainderCommand.command,
        };
      }
      return {
        nextState: {
          ...state,
          lastTranscript: wakeMatch.remainder || wakeMatch.normalizedTranscript,
        },
        action: wakeMatch.remainder
          ? { type: 'send', text: wakeMatch.remainder }
          : { type: 'none' },
        matchedWake: true,
        matchedSleep: false,
        matchedCommand: null,
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
      matchedCommand: null,
    };
  }

  return {
    nextState: { ...state, lastTranscript: normalizedTranscript },
    action: { type: 'none' },
    matchedWake: false,
    matchedSleep: false,
    matchedCommand: null,
  };
}

export function useHandsFreeController(options: HandsFreeControllerOptions) {
  const {
    enabled,
    runtimeActive,
    wakePhrase,
    sleepPhrase,
    allowDirectSpeechWhileSleeping = false,
    voiceCommands,
    log,
    repeatedErrorThreshold = DEFAULT_REPEATED_ERROR_THRESHOLD,
  } = options;

  const [state, setState] = useState<HandsFreeControllerState>(createInitialHandsFreeState);
  const stateRef = useRef(state);
  const loggedStateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const previous = loggedStateRef.current;
    if (hasHandsFreeStateChanged(previous, state)) {
      log?.(
        'state-transition',
        `Handsfree ${previous.phase} -> ${state.phase}.`,
        createHandsFreeStateTransitionDetail(previous, state),
      );
    }
    loggedStateRef.current = state;
  }, [log, state]);

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

  const handleFinalTranscript = useCallback((transcript: string): HandsFreeUtteranceAction => {
    const result = resolveHandsFreeUtterance({
      state: stateRef.current,
      transcript,
      wakePhrase,
      sleepPhrase,
      allowDirectSpeechWhileSleeping,
      voiceCommands,
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
    } else if (result.action.type === 'command') {
      log?.('handsfree-control', 'Handsfree voice command recognized.', {
        command: result.action.command,
        label: result.action.label,
        remainder: result.action.remainder,
        phase: result.nextState.phase,
      });
    } else if (!result.matchedWake && !result.matchedSleep) {
      log?.('transcript-ignored', 'Handsfree transcript did not produce an action.', {
        phase: result.nextState.phase,
        transcript: result.nextState.lastTranscript,
      });
    }

    return result.action;
  }, [allowDirectSpeechWhileSleeping, log, sleepPhrase, updateState, voiceCommands, wakePhrase]);

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
    log?.('handsfree-control', 'Handsfree paused by user.');
  }, [log, updateState]);

  const resumeByUser = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      phase: prev.resumePhase ?? (prev.awakeSince ? 'listening' : 'sleeping'),
      pauseReason: null,
      resumePhase: null,
      lastError: null,
    }));
    log?.('handsfree-control', 'Handsfree resumed by user.');
  }, [log, updateState]);

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
    log?.('handsfree-control', 'Handsfree woken by user.');
  }, [log, updateState]);

  const sleepByUser = useCallback(() => {
    updateState((prev) => transitionToSleeping(prev));
    log?.('handsfree-control', 'Handsfree put to sleep by user.');
  }, [log, updateState]);

  const onRecognizerError = useCallback((message: string) => {
    updateState((prev) => {
      if (isBenignHandsFreeRecognizerError(message)) {
        return {
          ...prev,
          lastError: null,
          recognizerErrorCount: 0,
        };
      }

      const recognizerErrorCount = prev.recognizerErrorCount + 1;
      if (recognizerErrorCount >= repeatedErrorThreshold) {
        return {
          ...prev,
          phase: 'error',
          resumePhase: resumablePhase(prev.phase, prev.resumePhase),
          lastError: message,
          recognizerErrorCount,
        };
      }

      return {
        ...prev,
        lastError: message,
        recognizerErrorCount,
      };
    });
    log?.('recognizer-error', 'Speech recognizer error.', { message });
  }, [log, repeatedErrorThreshold, updateState]);

  const reset = useCallback(() => {
    updateState(() => createInitialHandsFreeState());
    log?.('handsfree-control', 'Handsfree controller reset.');
  }, [log, updateState]);

  const resetError = useCallback(() => {
    updateState((prev) => {
      const nextPhase = prev.resumePhase ?? (prev.awakeSince ? 'listening' : 'sleeping');
      return {
        ...prev,
        phase: nextPhase,
        resumePhase: null,
        pauseReason: null,
        lastError: null,
        recognizerErrorCount: 0,
      };
    });
    log?.('handsfree-control', 'Handsfree recognizer error reset.');
  }, [log, updateState]);

  const shouldKeepRecognizerActive = useMemo(
    () => enabled
      && runtimeActive
      && state.pauseReason !== 'user'
      && state.phase !== 'paused'
      && state.phase !== 'error',
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
