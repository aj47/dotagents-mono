export interface LowContextPromptGuardResult {
  response: string
  progressTitle: string
  progressDescription: string
}

const CONTINUE_WITHOUT_CONTEXT_PATTERNS = [
  /^(continue|keep going|go on|carry on|resume)\s*[.!?]*$/i,
]

const NEXT_STEP_WITHOUT_CONTEXT_PATTERNS = [
  /^(what should (i|we) do next|what should (i|we) work on next)\s*[.!?]*$/i,
  /^(what next|what now|next step)\s*[.!?]*$/i,
]

export function getLowContextPromptGuardResponse(
  transcript: string,
  hasPriorConversationHistory: boolean,
): LowContextPromptGuardResult | null {
  if (hasPriorConversationHistory) return null

  const trimmedTranscript = transcript.trim()
  if (!trimmedTranscript) return null

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