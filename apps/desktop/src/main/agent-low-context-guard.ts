export interface LowContextPromptGuardResult {
  response: string
  progressTitle: string
  progressDescription: string
}

const ACTIONABLE_FOLLOW_UP_PREFIX = /^(?:can|could|would|please|run|start|stop|check|open|use|create|fix|read|write|show|list|pause|resume|continue|what|why|where|when|how|is|are|do|does|did|should|need|want|let'?s)\b/i
const COMPLETE_FOLLOW_UP_PREFIX = /^(?:you|i|we|it|this|that)\s+(?:have|has|had|can|could|should|would|did|do|does|are|were|is|was)\b/i
const FRAGMENTARY_FOLLOW_UP_PREFIX = /^(?:the|a|an|and|then|so|but)\b/i
const FRAGMENTARY_FOLLOW_UP_CONNECTOR = /\b(?:and|then|but)\b/i
const FRAGMENTARY_FOLLOW_UP_TRAILING_WORDS = new Set([
  "the",
  "a",
  "an",
  "to",
  "for",
  "with",
  "of",
  "in",
  "on",
  "at",
  "from",
  "and",
  "or",
  "but",
  "then",
])
const FOLLOW_UP_OVERLAP_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "for",
  "from",
  "have",
  "in",
  "it",
  "of",
  "on",
  "or",
  "so",
  "that",
  "the",
  "then",
  "these",
  "this",
  "those",
  "to",
  "we",
  "with",
  "you",
])

const CONTINUE_WITHOUT_CONTEXT_PATTERNS = [
  /^(continue|keep going|go on|carry on|resume)\s*[.!?]*$/i,
]

const PAUSE_OR_DEFER_PATTERNS = [
  /^(?:i|we)\s+(?:actually\s+)?(?:have to\s+)?hold(?:\s+off)?\s+on\s+(?:this|that|it)(?:\s+for\s+now)?\s*[.!?]*$/i,
  /^(?:let'?s\s+)?pause\s+(?:this|that|it|here)(?:\s+for\s+now)?\s*[.!?]*$/i,
  /^(?:let'?s\s+)?park\s+(?:this|that|it)(?:\s+for\s+now)?\s*[.!?]*$/i,
  /^(?:let'?s\s+)?table\s+(?:this|that|it)(?:\s+for\s+now)?\s*[.!?]*$/i,
]

const NEXT_STEP_WITHOUT_CONTEXT_PATTERNS = [
  /^(what should (i|we) do next|what should (i|we) work on next)\s*[.!?]*$/i,
  /^(what next|what now|next step)\s*[.!?]*$/i,
]

function normalizeComparisonToken(token: string): string {
  const normalized = token.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
  if (normalized.length > 4 && normalized.endsWith("s")) {
    return normalized.slice(0, -1)
  }
  return normalized
}

function tokenizeForOverlap(text: string): string[] {
  return text
    .split(/\s+/)
    .map(normalizeComparisonToken)
    .filter((token) => token.length > 0 && !FOLLOW_UP_OVERLAP_STOPWORDS.has(token))
}

function hasStrongRecentUserOverlap(transcript: string, recentUserMessages: string[]): boolean {
  const transcriptTokens = Array.from(new Set(tokenizeForOverlap(transcript)))
  if (transcriptTokens.length < 4) return false

  return recentUserMessages.some((message) => {
    const messageTokens = new Set(tokenizeForOverlap(message))
    let overlapCount = 0

    for (const token of transcriptTokens) {
      if (messageTokens.has(token)) {
        overlapCount += 1
      }
    }

    return overlapCount >= 4
  })
}

function looksLikeFragmentaryFollowUp(transcript: string, recentUserMessages: string[]): boolean {
  const words = transcript.split(/\s+/).filter(Boolean)
  if (words.length < 4 || words.length > 12) return false
  if (ACTIONABLE_FOLLOW_UP_PREFIX.test(transcript)) return false
  if (COMPLETE_FOLLOW_UP_PREFIX.test(transcript)) return false

  const lastWord = normalizeComparisonToken(words[words.length - 1] || "")
  if (FRAGMENTARY_FOLLOW_UP_TRAILING_WORDS.has(lastWord)) {
    return true
  }

  if (!hasStrongRecentUserOverlap(transcript, recentUserMessages)) {
    return false
  }

  return FRAGMENTARY_FOLLOW_UP_PREFIX.test(transcript) || FRAGMENTARY_FOLLOW_UP_CONNECTOR.test(transcript)
}

export function getLowContextPromptGuardResponse(
  transcript: string,
  hasPriorConversationHistory: boolean,
  recentUserMessages: string[] = [],
): LowContextPromptGuardResult | null {
  const trimmedTranscript = transcript.trim()
  if (!trimmedTranscript) return null

  if (PAUSE_OR_DEFER_PATTERNS.some((pattern) => pattern.test(trimmedTranscript))) {
    return {
      response:
        "Understood — we can pause this for now. When you want to resume, tell me what to pick back up and I’ll continue from there.",
      progressTitle: "Paused for now",
      progressDescription:
        "Acknowledged the user’s request to pause instead of starting a new tool-driven run.",
    }
  }

  if (hasPriorConversationHistory && looksLikeFragmentaryFollowUp(trimmedTranscript, recentUserMessages)) {
    return {
      response:
        "I think that last message may have been cut off. Restate the exact action you want me to take, and if it’s about the previous topic include the specific task, loop, or window setup you want.",
      progressTitle: "Need clarification",
      progressDescription:
        "Asked the user to restate a fragmentary follow-up instead of starting a tool-driven run on partial context.",
    }
  }

  if (hasPriorConversationHistory) return null

  if (CONTINUE_WITHOUT_CONTEXT_PATTERNS.some((pattern) => pattern.test(trimmedTranscript))) {
    return {
      response:
        "I don’t have enough context to continue yet. Tell me which task, file, or result you want to resume, or paste the last goal/error and I’ll pick it up from there.",
      progressTitle: "Need more context",
      progressDescription:
        "Asked the user which task or result to continue before starting a tool-driven run.",
    }
  }

  if (NEXT_STEP_WITHOUT_CONTEXT_PATTERNS.some((pattern) => pattern.test(trimmedTranscript))) {
    return {
      response:
        "I need a bit more context before I can suggest the next step. If this is about the current repo, tell me the goal or bug, or pick one: inspect code, run relevant tests, debug an error, or plan the change.",
      progressTitle: "Need more context",
      progressDescription:
        "Asked for the missing goal before starting a tool-driven run from a low-context next-step prompt.",
    }
  }

  return null
}