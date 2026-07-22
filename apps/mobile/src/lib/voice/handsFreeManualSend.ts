import { normalizeVoicePhrase } from './phraseMatcher';
import { mergeVoiceText } from './mergeVoiceText';

export type HandsFreeManualDraftResolution =
  | { type: 'draft'; text: string }
  | { type: 'send'; text: string }
  | { type: 'empty' };

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
): HandsFreeManualDraftResolution {
  const cleanedPendingDraft = pendingDraft.trim();
  if (matchesHandsFreeSendPhrase(transcript, sendPhrase)) {
    return cleanedPendingDraft
      ? { type: 'send', text: cleanedPendingDraft }
      : { type: 'empty' };
  }

  const nextDraft = mergeVoiceText(cleanedPendingDraft, transcript);
  return nextDraft ? { type: 'draft', text: nextDraft } : { type: 'empty' };
}
