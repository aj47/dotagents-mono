import { normalizeVoicePhrase } from './phraseMatcher';
import { mergeVoiceText } from './mergeVoiceText';

export type HandsFreeManualDraftResolution =
  | { type: 'draft'; text: string }
  | { type: 'send'; text: string }
  | { type: 'clear'; text: string }
  | { type: 'empty' };

export const DEFAULT_HANDS_FREE_CLEAR_DRAFT_PHRASE = 'clear';

export function matchesHandsFreeSendPhrase(
  transcript: string,
  sendPhrase: string,
): boolean {
  const normalizedTranscript = normalizeVoicePhrase(transcript);
  const normalizedSendPhrase = normalizeVoicePhrase(sendPhrase);
  return !!normalizedTranscript
    && !!normalizedSendPhrase
    && normalizedTranscript === normalizedSendPhrase;
}

export function resolveHandsFreeManualDraft(
  pendingDraft: string,
  transcript: string,
  sendPhrase: string,
  options?: {
    clearPhrase?: string;
    finalSegmentText?: string;
  },
): HandsFreeManualDraftResolution {
  const cleanedPendingDraft = pendingDraft.trim();
  const clearPhrase = options?.clearPhrase ?? DEFAULT_HANDS_FREE_CLEAR_DRAFT_PHRASE;
  const commandCandidate = options?.finalSegmentText || transcript;
  const cleanedTranscript = transcript.trim();
  const cleanedFinalSegment = options?.finalSegmentText?.trim() || '';
  const transcriptBeforeFinalSegment = cleanedFinalSegment
    && cleanedTranscript.toLocaleLowerCase().endsWith(cleanedFinalSegment.toLocaleLowerCase())
    ? cleanedTranscript.slice(0, -cleanedFinalSegment.length).trim()
    : '';
  const draftBeforeCommand = mergeVoiceText(cleanedPendingDraft, transcriptBeforeFinalSegment);

  if (matchesHandsFreeSendPhrase(commandCandidate, clearPhrase)) {
    return { type: 'clear', text: draftBeforeCommand };
  }
  if (matchesHandsFreeSendPhrase(commandCandidate, sendPhrase)) {
    return draftBeforeCommand
      ? { type: 'send', text: draftBeforeCommand }
      : { type: 'empty' };
  }

  const nextDraft = mergeVoiceText(cleanedPendingDraft, transcript);
  return nextDraft ? { type: 'draft', text: nextDraft } : { type: 'empty' };
}
