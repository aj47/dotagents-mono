import type { HandsFreePhase, HandsFreeResumePhase } from './types';

export const DEFAULT_HANDS_FREE_WAKE_PHRASE = 'hey dot agents';
export const DEFAULT_HANDS_FREE_SLEEP_PHRASE = 'go to sleep';
export const DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS = 1500;
export const MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS = 0;

export type HandsFreeConfig = {
  handsFree?: boolean;
  handsFreeMessageDebounceMs?: number;
  handsFreeWakePhrase?: string;
  handsFreeSleepPhrase?: string;
  handsFreeDebug?: boolean;
  handsFreeForegroundOnly?: boolean;
  handsFreeForegroundOnlyConfigured?: boolean;
};

export const DEFAULT_HANDS_FREE_CONFIG: Required<HandsFreeConfig> = {
  handsFree: false,
  handsFreeMessageDebounceMs: DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  handsFreeWakePhrase: DEFAULT_HANDS_FREE_WAKE_PHRASE,
  handsFreeSleepPhrase: DEFAULT_HANDS_FREE_SLEEP_PHRASE,
  handsFreeDebug: false,
  handsFreeForegroundOnly: true,
  handsFreeForegroundOnlyConfigured: false,
};

export function normalizeHandsFreeMessageDebounceMs(value?: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS;
  }

  return Math.max(MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS, Math.round(value as number));
}

export function normalizeHandsFreeConfig(config: HandsFreeConfig = {}): Required<HandsFreeConfig> {
  return {
    handsFree: config.handsFree ?? DEFAULT_HANDS_FREE_CONFIG.handsFree,
    handsFreeMessageDebounceMs: normalizeHandsFreeMessageDebounceMs(config.handsFreeMessageDebounceMs),
    handsFreeWakePhrase: config.handsFreeWakePhrase?.trim() || DEFAULT_HANDS_FREE_WAKE_PHRASE,
    handsFreeSleepPhrase: config.handsFreeSleepPhrase?.trim() || DEFAULT_HANDS_FREE_SLEEP_PHRASE,
    handsFreeDebug: config.handsFreeDebug ?? DEFAULT_HANDS_FREE_CONFIG.handsFreeDebug,
    handsFreeForegroundOnly: config.handsFreeForegroundOnly ?? DEFAULT_HANDS_FREE_CONFIG.handsFreeForegroundOnly,
    handsFreeForegroundOnlyConfigured: config.handsFreeForegroundOnlyConfigured === true,
  };
}

export type PhraseMatchResult = {
  matched: boolean;
  normalizedTranscript: string;
  normalizedPhrase: string;
  remainder: string;
};

const PUNCTUATION_REGEX = /[^a-z0-9 ]+/gi;

export function normalizeVoicePhrase(text?: string | null): string {
  return (text || '')
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(PUNCTUATION_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPhraseMatchResult(
  normalizedTranscript: string,
  normalizedPhrase: string,
  remainder: string,
): PhraseMatchResult {
  return {
    matched: true,
    normalizedTranscript,
    normalizedPhrase,
    remainder: normalizeVoicePhrase(remainder),
  };
}

export function matchWakePhrase(transcript: string, phrase: string): PhraseMatchResult {
  const normalizedTranscript = normalizeVoicePhrase(transcript);
  const normalizedPhrase = normalizeVoicePhrase(phrase);

  if (!normalizedTranscript || !normalizedPhrase) {
    return {
      matched: false,
      normalizedTranscript,
      normalizedPhrase,
      remainder: '',
    };
  }

  if (normalizedTranscript === normalizedPhrase) {
    return buildPhraseMatchResult(normalizedTranscript, normalizedPhrase, '');
  }

  if (normalizedTranscript.startsWith(`${normalizedPhrase} `)) {
    return buildPhraseMatchResult(
      normalizedTranscript,
      normalizedPhrase,
      normalizedTranscript.slice(normalizedPhrase.length + 1),
    );
  }

  return {
    matched: false,
    normalizedTranscript,
    normalizedPhrase,
    remainder: '',
  };
}

export function matchSleepPhrase(transcript: string, phrase: string): PhraseMatchResult {
  const normalizedTranscript = normalizeVoicePhrase(transcript);
  const normalizedPhrase = normalizeVoicePhrase(phrase);

  if (!normalizedTranscript || !normalizedPhrase) {
    return {
      matched: false,
      normalizedTranscript,
      normalizedPhrase,
      remainder: '',
    };
  }

  if (
    normalizedTranscript === normalizedPhrase
    || normalizedTranscript.startsWith(`${normalizedPhrase} `)
    || normalizedTranscript.endsWith(` ${normalizedPhrase}`)
  ) {
    return buildPhraseMatchResult(normalizedTranscript, normalizedPhrase, '');
  }

  return {
    matched: false,
    normalizedTranscript,
    normalizedPhrase,
    remainder: '',
  };
}

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

export type ResolveHandsFreeUtteranceArgs = {
  state: HandsFreeControllerState;
  transcript: string;
  wakePhrase: string;
  sleepPhrase: string;
  allowDirectSpeechWhileSleeping?: boolean;
  now: number;
};

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

export function hasHandsFreeStateChanged(prev: HandsFreeControllerState, next: HandsFreeControllerState): boolean {
  return prev.phase !== next.phase
    || prev.resumePhase !== next.resumePhase
    || prev.pauseReason !== next.pauseReason
    || prev.awakeSince !== next.awakeSince
    || prev.lastError !== next.lastError
    || prev.recognizerErrorCount !== next.recognizerErrorCount;
}

export function createHandsFreeStateTransitionDetail(prev: HandsFreeControllerState, next: HandsFreeControllerState) {
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

export function getHandsFreeResumablePhase(
  phase: HandsFreePhase,
  resumePhase: HandsFreeResumePhase | null,
): HandsFreeResumePhase {
  if (phase === 'processing') return 'processing';
  if (phase === 'listening' || phase === 'waking' || phase === 'speaking') return 'listening';
  return resumePhase ?? 'sleeping';
}

export function transitionHandsFreeToSleeping(state: HandsFreeControllerState): HandsFreeControllerState {
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

export function resolveHandsFreeUtterance({
  state,
  transcript,
  wakePhrase,
  sleepPhrase,
  allowDirectSpeechWhileSleeping = false,
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
      if (allowDirectSpeechWhileSleeping) {
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
          ...transitionHandsFreeToSleeping(state),
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

  if (state.phase === 'speaking') {
    const sleepMatch = matchSleepPhrase(normalizedTranscript, sleepPhrase);
    if (sleepMatch.matched) {
      return {
        nextState: {
          ...transitionHandsFreeToSleeping(state),
          lastTranscript: sleepMatch.normalizedTranscript,
        },
        action: { type: 'none' },
        matchedWake: false,
        matchedSleep: true,
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
    };
  }

  if (state.phase === 'processing') {
    const sleepMatch = matchSleepPhrase(normalizedTranscript, sleepPhrase);
    if (sleepMatch.matched) {
      return {
        nextState: {
          ...transitionHandsFreeToSleeping(state),
          lastTranscript: sleepMatch.normalizedTranscript,
        },
        action: { type: 'none' },
        matchedWake: false,
        matchedSleep: true,
      };
    }

    const wakeMatch = matchWakePhrase(normalizedTranscript, wakePhrase);
    if (wakeMatch.matched) {
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
