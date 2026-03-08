const USER_ACTION_VERB_PATTERN = /\b(?:log\s?in|sign\s?in|authenticate|approve|authorize|grant|confirm|complete|open|click|enter|select|connect|install|run|share|paste|provide|send|upload)\b/
const USER_ACTION_WAIT_PATTERN = /\b(?:let me know|tell me when|once you(?:'re| are) done|when you(?:'re| are) done|before i can continue|before i can proceed|i can(?:'t|not) proceed until you|then i(?:'ll| will)|after that i(?:'ll| will))\b/

export function isWaitingOnUserActionResponse(content: string): boolean {
  const normalized = content.toLowerCase().replace(/\s+/g, " ").trim()
  if (!normalized) return false

  return USER_ACTION_VERB_PATTERN.test(normalized) && USER_ACTION_WAIT_PATTERN.test(normalized)
}