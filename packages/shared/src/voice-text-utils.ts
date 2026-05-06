export function normalizeVoiceText(text?: string | null): string {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export function normalizeAutoTtsTextKey(value: string): string {
  return normalizeVoiceText(value).toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsWholePhrase(text: string, phrase: string): boolean {
  return new RegExp(`(?:^|\\s)${escapeRegExp(phrase)}(?:\\s|$)`).test(text);
}

export function mergeVoiceText(base?: string | null, live?: string | null): string {
  const baseText = normalizeVoiceText(base);
  const liveText = normalizeVoiceText(live);

  if (!baseText) return liveText;
  if (!liveText) return baseText;
  if (baseText === liveText) return baseText;
  if (liveText.startsWith(baseText)) return liveText;
  if (baseText.startsWith(liveText)) return baseText;
  if (containsWholePhrase(baseText, liveText)) return baseText;
  if (containsWholePhrase(liveText, baseText)) return liveText;

  const baseWords = baseText.split(' ');
  const liveWords = liveText.split(' ');
  const maxOverlap = Math.min(baseWords.length, liveWords.length);

  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    const baseSuffix = baseWords.slice(-overlap).join(' ');
    const livePrefix = liveWords.slice(0, overlap).join(' ');
    if (baseSuffix === livePrefix) {
      const prefix = baseWords.slice(0, baseWords.length - overlap).join(' ');
      return normalizeVoiceText(`${prefix} ${liveText}`);
    }
  }

  return normalizeVoiceText(`${baseText} ${liveText}`);
}
