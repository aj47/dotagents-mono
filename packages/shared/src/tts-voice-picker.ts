export type TtsVoiceLike = {
  identifier: string;
  name: string;
  language?: string;
  quality?: string;
};

export type TtsVoiceSortOptions = {
  preferGoogleVoices?: boolean;
};

export const PREFERRED_GOOGLE_TTS_VOICE_NAMES = [
  'Google US English',
  'Google UK English Female',
  'Google UK English Male',
] as const;

function normalizeTtsVoiceValue(value: string | undefined): string {
  return (value || '').toLowerCase();
}

export function isEnglishTtsVoice(voice: TtsVoiceLike): boolean {
  return normalizeTtsVoiceValue(voice.language).startsWith('en');
}

export function isGoogleChromeTtsVoice(voice: TtsVoiceLike): boolean {
  const haystack = `${voice.name} ${voice.identifier}`.toLowerCase();
  return haystack.includes('google');
}

function scoreTtsVoice(voice: TtsVoiceLike, options: TtsVoiceSortOptions): number {
  let score = 0;

  if (isEnglishTtsVoice(voice)) {
    score += 20;
  }

  if (normalizeTtsVoiceValue(voice.language).startsWith('en-us')) {
    score += 10;
  }

  if (voice.quality === 'Enhanced') {
    score += 5;
  }

  if (options.preferGoogleVoices && isGoogleChromeTtsVoice(voice)) {
    score += 100;
  }

  return score;
}

export function sortVoicesForTtsPicker<T extends TtsVoiceLike>(
  voices: readonly T[],
  options: TtsVoiceSortOptions = {},
): T[] {
  return [...voices].sort((a, b) => {
    const scoreDiff = scoreTtsVoice(b, options) - scoreTtsVoice(a, options);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return a.name.localeCompare(b.name);
  });
}

export function pickPreferredWebGoogleVoice<T extends TtsVoiceLike>(
  voices: readonly T[],
): T | null {
  const englishVoices = voices.filter(isEnglishTtsVoice);
  const candidateVoices = englishVoices.length > 0 ? englishVoices : [...voices];

  for (const preferredName of PREFERRED_GOOGLE_TTS_VOICE_NAMES) {
    const preferredVoice = candidateVoices.find(
      (voice) => voice.name === preferredName && isGoogleChromeTtsVoice(voice),
    );
    if (preferredVoice) {
      return preferredVoice;
    }
  }

  const sortedVoices = sortVoicesForTtsPicker(candidateVoices, {
    preferGoogleVoices: true,
  });

  return sortedVoices.find(isGoogleChromeTtsVoice) || null;
}
