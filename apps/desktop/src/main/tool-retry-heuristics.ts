import type { MCPToolCall, MCPToolResult } from "./mcp-service"

const SELECTOR_REF_REGEX = /@[a-z][0-9]+\b/i
const SELECTOR_FAILURE_REGEX = /\b(timeout|unsupported token|not interactable|still loading|locator\.|selector|stale element|element is detached)\b/i
const INFRA_RETRY_REGEX = /\b(timeout|connection|network|temporary|busy|econnreset|socket hang up|gateway timeout|service unavailable)\b/i
const INFRA_ONLY_REGEX = /\b(connection|network|temporary|busy|econnreset|socket hang up|gateway timeout|service unavailable)\b/i
const INTERNAL_RECOVERY_SIGNAL = "Take a fresh browser snapshot"
const ERROR_CONTEXT_REGEX = /\b(error|failed|timeout|unsupported token|not interactable|still loading|locator\.|selector)\b/i

type SelectorHistoryEntry = {
  role?: "user" | "assistant" | "tool"
  content?: string
  ephemeral?: boolean
}

function collectStringValues(value: unknown, bucket: string[]): void {
  if (typeof value === "string") {
    bucket.push(value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStringValues(item, bucket)
    }
    return
  }

  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) {
      collectStringValues(nested, bucket)
    }
  }
}

function extractSelectorRefFromUnknown(value: unknown): string | undefined {
  const strings: string[] = []
  collectStringValues(value, strings)

  for (const candidate of strings) {
    const match = candidate.match(SELECTOR_REF_REGEX)?.[0]
    if (match) return match
  }

  return undefined
}

function getToolErrorText(result: Pick<MCPToolResult, "content" | "isError">): string {
  if (!result.isError) return ""
  return result.content?.map((item) => item.text).join(" ").trim() || ""
}

function buildRecoveryMessage(selectorRef?: string): string {
  if (selectorRef) {
    return `Browser interaction using ${selectorRef} failed. Do not retry the same selector blindly. Take a fresh browser snapshot before the next browser tool call, and only reuse ${selectorRef} if the refreshed page confirms it is still valid.`
  }

  return "Browser interaction failed. Do not retry the same selector blindly. Take a fresh browser snapshot before the next browser tool call."
}

export function getToolRetryHeuristic(
  toolCall: Pick<MCPToolCall, "name" | "arguments">,
  result: Pick<MCPToolResult, "content" | "isError">,
): {
  shouldAutoRetry: boolean
  recoveryMessage?: string
} {
  const errorText = getToolErrorText(result)
  if (!errorText) {
    return { shouldAutoRetry: false }
  }

  const normalizedError = errorText.toLowerCase()
  const selectorRef = extractSelectorRefFromUnknown(toolCall.arguments)
    ?? errorText.match(SELECTOR_REF_REGEX)?.[0]

  const hasSelectorSpecificFailure =
    Boolean(selectorRef) &&
    SELECTOR_FAILURE_REGEX.test(normalizedError) &&
    !INFRA_ONLY_REGEX.test(normalizedError)

  if (hasSelectorSpecificFailure) {
    return {
      shouldAutoRetry: false,
      recoveryMessage: buildRecoveryMessage(selectorRef),
    }
  }

  return {
    shouldAutoRetry: INFRA_RETRY_REGEX.test(normalizedError),
  }
}

export function extractLatestReusableSelectorRef(
  history: SelectorHistoryEntry[],
  currentPromptIndex: number,
): string | undefined {
  for (let i = history.length - 1; i >= currentPromptIndex; i--) {
    const entry = history[i]
    const content = typeof entry?.content === "string" ? entry.content : ""
    if (!content) continue
    if (entry?.ephemeral) continue
    if (entry?.role === "tool") continue
    if (content.includes(INTERNAL_RECOVERY_SIGNAL)) continue
    if (ERROR_CONTEXT_REGEX.test(content)) continue

    const selectorRef = content.match(SELECTOR_REF_REGEX)?.[0]
    if (selectorRef) return selectorRef
  }

  return undefined
}
