const MAX_REPEAT_WORD_RUN = 12;

const normalizeVoiceWhitespace = (text?: string) => (text || '').replace(/\s+/g, ' ').trim();

const getWordKey = (word: string) =>
  word.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');

const wordRunsMatch = (
  leftWords: string[],
  leftStart: number,
  rightWords: string[],
  rightStart: number,
  length: number,
) => {
  for (let index = 0; index < length; index += 1) {
    const leftKey = getWordKey(leftWords[leftStart + index] || '');
    const rightKey = getWordKey(rightWords[rightStart + index] || '');
    if (!leftKey || leftKey !== rightKey) {
      return false;
    }
  }
  return true;
};

const containsWordRun = (haystack: string[], needle: string[]) => {
  if (!needle.length || needle.length > haystack.length) {
    return false;
  }
  for (let start = 0; start <= haystack.length - needle.length; start += 1) {
    if (wordRunsMatch(haystack, start, needle, 0, needle.length)) {
      return true;
    }
  }
  return false;
};

const dedupeRepeatedWordRuns = (text: string) => {
  const words = normalizeVoiceWhitespace(text).split(' ').filter(Boolean);
  if (words.length < 2) {
    return words.join(' ');
  }

  let index = 0;
  while (index < words.length) {
    const maxRun = Math.min(MAX_REPEAT_WORD_RUN, Math.floor((words.length - index) / 2));
    let repeatedRunLength = 0;

    for (let runLength = maxRun; runLength > 0; runLength -= 1) {
      if (wordRunsMatch(words, index, words, index + runLength, runLength)) {
        repeatedRunLength = runLength;
        break;
      }
    }

    if (repeatedRunLength > 0) {
      words.splice(index + repeatedRunLength, repeatedRunLength);
      continue;
    }

    index += 1;
  }

  return words.join(' ');
};

export const normalizeVoiceText = (text?: string) =>
  dedupeRepeatedWordRuns(normalizeVoiceWhitespace(text));

export function mergeVoiceText(finalText?: string, liveText?: string): string {
  const finalClean = normalizeVoiceText(finalText);
  const liveClean = normalizeVoiceText(liveText);

  if (!finalClean) return liveClean;
  if (!liveClean) return finalClean;

  const finalWords = finalClean.split(' ');
  const liveWords = liveClean.split(' ');
  if (wordRunsMatch(liveWords, 0, finalWords, 0, finalWords.length)) {
    return liveClean;
  }
  if (wordRunsMatch(finalWords, 0, liveWords, 0, liveWords.length)) {
    return finalClean;
  }
  if (containsWordRun(finalWords, liveWords)) {
    return finalClean;
  }
  if (containsWordRun(liveWords, finalWords)) {
    return liveClean;
  }

  const maxOverlap = Math.min(finalWords.length, liveWords.length);

  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    if (wordRunsMatch(finalWords, finalWords.length - overlap, liveWords, 0, overlap)) {
      return normalizeVoiceText(`${finalWords.slice(0, finalWords.length - overlap).join(' ')} ${liveClean}`);
    }
  }

  return normalizeVoiceText(`${finalClean} ${liveClean}`);
}
