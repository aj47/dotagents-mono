export type PhraseMatchResult = {
  matched: boolean
  normalizedTranscript: string
  normalizedPhrase: string
  remainder: string
}

const PUNCTUATION_REGEX = /[^a-z0-9 ]+/gi

export function normalizeVoicePhrase(text?: string | null): string {
  return (text || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(PUNCTUATION_REGEX, " ")
    .replace(/\s+/g, " ")
    .trim()
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
  }
}

export function matchWakePhrase(transcript: string, phrase: string): PhraseMatchResult {
  const normalizedTranscript = normalizeVoicePhrase(transcript)
  const normalizedPhrase = normalizeVoicePhrase(phrase)

  if (!normalizedTranscript || !normalizedPhrase) {
    return {
      matched: false,
      normalizedTranscript,
      normalizedPhrase,
      remainder: "",
    }
  }

  if (normalizedTranscript === normalizedPhrase) {
    return buildPhraseMatchResult(normalizedTranscript, normalizedPhrase, "")
  }

  if (normalizedTranscript.startsWith(`${normalizedPhrase} `)) {
    return buildPhraseMatchResult(
      normalizedTranscript,
      normalizedPhrase,
      normalizedTranscript.slice(normalizedPhrase.length + 1),
    )
  }

  return {
    matched: false,
    normalizedTranscript,
    normalizedPhrase,
    remainder: "",
  }
}

export function matchSleepPhrase(transcript: string, phrase: string): PhraseMatchResult {
  const normalizedTranscript = normalizeVoicePhrase(transcript)
  const normalizedPhrase = normalizeVoicePhrase(phrase)

  if (!normalizedTranscript || !normalizedPhrase) {
    return {
      matched: false,
      normalizedTranscript,
      normalizedPhrase,
      remainder: "",
    }
  }

  if (
    normalizedTranscript === normalizedPhrase
    || normalizedTranscript.startsWith(`${normalizedPhrase} `)
    || normalizedTranscript.endsWith(` ${normalizedPhrase}`)
  ) {
    return buildPhraseMatchResult(normalizedTranscript, normalizedPhrase, "")
  }

  return {
    matched: false,
    normalizedTranscript,
    normalizedPhrase,
    remainder: "",
  }
}
