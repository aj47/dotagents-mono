import { normalizeVoiceText } from './mergeVoiceText';

export type WebSpeechTranscriptResult = {
  isFinal?: boolean;
  0?: { transcript?: string };
};

export type WebSpeechTranscriptEvent = {
  resultIndex?: number;
  results: ArrayLike<WebSpeechTranscriptResult>;
};

export type WebSpeechTranscriptState = {
  finalSegments: Record<number, string>;
  interimSegments: Record<number, string>;
};

export const createWebSpeechTranscriptState = (): WebSpeechTranscriptState => ({
  finalSegments: {},
  interimSegments: {},
});

export const resetWebSpeechTranscriptState = (state: WebSpeechTranscriptState) => {
  state.finalSegments = {};
  state.interimSegments = {};
};

const readTranscript = (result?: WebSpeechTranscriptResult) => normalizeVoiceText(result?.[0]?.transcript);

const readOrderedSegments = (state: WebSpeechTranscriptState) => Array.from(new Set([
  ...Object.keys(state.finalSegments).map(Number),
  ...Object.keys(state.interimSegments).map(Number),
])).sort((left, right) => left - right)
  .map((index) => state.finalSegments[index] || state.interimSegments[index])
  .filter(Boolean);

/**
 * Apply one Web Speech API result event. Result indexes are stable within a
 * recognition session, so an interim rewrite replaces the previous value
 * instead of being merged into it as a second sentence.
 */
export const applyWebSpeechTranscriptEvent = (
  state: WebSpeechTranscriptState,
  event: WebSpeechTranscriptEvent,
) => {
  const startIndex = Math.max(0, event.resultIndex ?? 0);
  const resultCount = Math.max(0, event.results?.length ?? 0);

  for (let index = startIndex; index < resultCount; index += 1) {
    const result = event.results[index];
    const transcript = readTranscript(result);

    if (result?.isFinal) {
      delete state.interimSegments[index];
      if (transcript) state.finalSegments[index] = transcript;
      else delete state.finalSegments[index];
    } else {
      delete state.finalSegments[index];
      if (transcript) state.interimSegments[index] = transcript;
      else delete state.interimSegments[index];
    }
  }

  return getWebSpeechTranscriptText(state);
};

export const getWebSpeechTranscriptText = (state: WebSpeechTranscriptState) => normalizeVoiceText([
  ...readOrderedSegments(state),
].join(' '));

/** Add one completed recognition session to the current hands-free capture. */
export const appendWebSpeechSessionText = (captureText: string, sessionText: string) => {
  const capture = normalizeVoiceText(captureText);
  const session = normalizeVoiceText(sessionText);
  if (!capture) return session;
  if (!session) return capture;
  return `${capture} ${session}`;
};
