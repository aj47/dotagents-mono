export type TtsVoiceLike = {
  identifier: string;
  name: string;
  language?: string;
  quality?: string;
};

const PREFERRED_GOOGLE_VOICE_NAMES = [
  'Google US English',
  'Google UK English Female',
  'Google UK English Male',
] as const;

const normalize = (value: string | undefined) => (value || '').toLowerCase();

export const isEnglishVoice = (voice: TtsVoiceLike): boolean => {
  return normalize(voice.language).startsWith('en');
};

export const isGoogleChromeVoice = (voice: TtsVoiceLike): boolean => {
  const haystack = `${voice.name} ${voice.identifier}`.toLowerCase();
  return haystack.includes('google');
};

type SortOptions = {
  preferGoogleVoices?: boolean;
};

const scoreVoice = (voice: TtsVoiceLike, options: SortOptions): number => {
  let score = 0;

  if (isEnglishVoice(voice)) {
    score += 20;
  }

  if (normalize(voice.language).startsWith('en-us')) {
    score += 10;
  }

  if (voice.quality === 'Enhanced') {
    score += 5;
  }

  if (options.preferGoogleVoices && isGoogleChromeVoice(voice)) {
    score += 100;
  }

  return score;
};

export const sortVoicesForTtsPicker = <T extends TtsVoiceLike>(
  voices: readonly T[],
  options: SortOptions = {}
): T[] => {
  return [...voices].sort((a, b) => {
    const scoreDiff = scoreVoice(b, options) - scoreVoice(a, options);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return a.name.localeCompare(b.name);
  });
};

export const pickPreferredWebGoogleVoice = <T extends TtsVoiceLike>(
  voices: readonly T[]
): T | null => {
  const englishVoices = voices.filter(isEnglishVoice);
  const candidateVoices = englishVoices.length > 0 ? englishVoices : [...voices];

  for (const preferredName of PREFERRED_GOOGLE_VOICE_NAMES) {
    const preferredVoice = candidateVoices.find(
      (voice) => voice.name === preferredName && isGoogleChromeVoice(voice)
    );
    if (preferredVoice) {
      return preferredVoice;
    }
  }

  const sortedVoices = sortVoicesForTtsPicker(candidateVoices, {
    preferGoogleVoices: true,
  });

  return sortedVoices.find(isGoogleChromeVoice) || null;
};

