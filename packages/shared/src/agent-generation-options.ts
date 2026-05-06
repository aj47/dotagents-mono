import type { CHAT_PROVIDER_ID } from "./providers"
import type { CodexTextVerbosity, OpenAiReasoningEffort } from "./api-types"

export type { CodexTextVerbosity, OpenAiReasoningEffort } from "./api-types"

export const OPENAI_REASONING_EFFORT_OPTIONS: readonly { value: OpenAiReasoningEffort; label: string }[] = [
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Extra high" },
]

export const CODEX_TEXT_VERBOSITY_OPTIONS: readonly { value: CodexTextVerbosity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

export const DEFAULT_OPENAI_REASONING_EFFORT: OpenAiReasoningEffort = "medium"
export const DEFAULT_CODEX_REASONING_EFFORT: OpenAiReasoningEffort = "low"
export const DEFAULT_CODEX_TEXT_VERBOSITY: CodexTextVerbosity = "medium"

export function getOpenAiReasoningEffortDefault(providerId?: CHAT_PROVIDER_ID | string): OpenAiReasoningEffort {
  return providerId === "chatgpt-web"
    ? DEFAULT_CODEX_REASONING_EFFORT
    : DEFAULT_OPENAI_REASONING_EFFORT
}

export function isOpenAiReasoningEffortUpdateValue(value: unknown): value is OpenAiReasoningEffort {
  return typeof value === "string"
    && OPENAI_REASONING_EFFORT_OPTIONS.some((option) => option.value === value)
}

export function isCodexTextVerbosityUpdateValue(value: unknown): value is CodexTextVerbosity {
  return typeof value === "string"
    && CODEX_TEXT_VERBOSITY_OPTIONS.some((option) => option.value === value)
}
