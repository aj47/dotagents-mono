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

const getCommonPrefixLength = (leftWords: string[], rightWords: string[]) => {
  const maxLength = Math.min(leftWords.length, rightWords.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftKey = getWordKey(leftWords[index] || '');
    const rightKey = getWordKey(rightWords[index] || '');
    if (!leftKey || leftKey !== rightKey) {
      return index;
    }
  }
  return maxLength;
};

const getOrderedSharedWordCount = (leftWords: string[], rightWords: string[]) => {
  const leftKeys = leftWords.map(getWordKey).filter(Boolean);
  const rightKeys = rightWords.map(getWordKey).filter(Boolean);
  const lengths = Array.from({ length: leftKeys.length + 1 }, () =>
    Array(rightKeys.length + 1).fill(0),
  );

  for (let leftIndex = leftKeys.length - 1; leftIndex >= 0; leftIndex -= 1) {
    for (let rightIndex = rightKeys.length - 1; rightIndex >= 0; rightIndex -= 1) {
      lengths[leftIndex][rightIndex] = leftKeys[leftIndex] === rightKeys[rightIndex]
        ? lengths[leftIndex + 1][rightIndex + 1] + 1
        : Math.max(lengths[leftIndex + 1][rightIndex], lengths[leftIndex][rightIndex + 1]);
    }
  }

  return lengths[0][0];
};

const getPartialWordRewrite = (leftWords: string[], rightWords: string[]) => {
  const overlapLength = Math.min(leftWords.length, rightWords.length);
  if (overlapLength === 0) {
    return null;
  }

  const partialIndex = overlapLength - 1;
  if (!wordRunsMatch(leftWords, 0, rightWords, 0, partialIndex)) {
    return null;
  }

  const leftKey = getWordKey(leftWords[partialIndex] || '');
  const rightKey = getWordKey(rightWords[partialIndex] || '');
  if (!leftKey || !rightKey || leftKey === rightKey) {
    return null;
  }

  const shorterKey = leftKey.length <= rightKey.length ? leftKey : rightKey;
  const longerKey = leftKey.length > rightKey.length ? leftKey : rightKey;
  // Require at least two characters so ordinary short words such as "a"
  // do not get treated as partial rewrites of unrelated words.
  if (shorterKey.length < 2 || !longerKey.startsWith(shorterKey)) {
    return null;
  }

  return leftKey.length >= rightKey.length ? 'left' : 'right';
};

const isLikelyCumulativeRewrite = (previousWords: string[], nextWords: string[]) => {
  const shorterLength = Math.min(previousWords.length, nextWords.length);
  if (shorterLength < 4) {
    return false;
  }

  const commonPrefixLength = getCommonPrefixLength(previousWords, nextWords);
  if (commonPrefixLength >= Math.min(5, Math.ceil(shorterLength * 0.6))) {
    return true;
  }

  return commonPrefixLength >= 2 &&
    getOrderedSharedWordCount(previousWords, nextWords) >= Math.ceil(shorterLength * 0.75);
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
  const partialWordRewrite = getPartialWordRewrite(finalWords, liveWords);
  if (partialWordRewrite === 'left') {
    return finalClean;
  }
  if (partialWordRewrite === 'right') {
    return liveClean;
  }
  if (isLikelyCumulativeRewrite(finalWords, liveWords)) {
    return liveClean;
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
