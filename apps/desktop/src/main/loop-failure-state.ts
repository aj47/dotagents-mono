import { isMissingApiKeyErrorMessage } from "@dotagents/shared"
import type { LoopConfig } from "../shared/types"

export const LOOP_AUTO_PAUSE_FAILURE_THRESHOLD = 3

export type LoopRunKind = "automatic" | "manual"

export type LoopRunClassification = {
  failed: boolean
  failureMessage?: string
}

const LOOP_INCOMPLETE_MARKERS = [
  "i couldn't complete the request after multiple attempts",
  "task incomplete due to repeated tool failures",
  "task may not be fully complete - reached maximum iteration limit",
]

const LOOP_FAILURE_PATTERNS = [
  /task stopped due to iteration limit/i,
  /failed to create acp session/i,
  /failed to start acp agent/i,
  /acp agent .* is not ready/i,
  /authentication required:/i,
  /configured acp main agent .* not found/i,
  /no acp main agent configured/i,
  /no acp main agent selected/i,
  /available acp agents:/i,
]

function sanitizeFailureMessage(raw: string | undefined): string | undefined {
  const compact = (raw ?? "").replace(/\s+/g, " ").trim()
  if (!compact) return undefined
  return compact.length > 240 ? `${compact.slice(0, 237).trimEnd()}...` : compact
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return String(error)
}

export function classifyLoopRunOutcome(input: {
  content?: string | null
  error?: unknown
}): LoopRunClassification {
  if (input.error !== undefined) {
    return {
      failed: true,
      failureMessage: sanitizeFailureMessage(getErrorMessage(input.error)),
    }
  }

  const content = input.content?.trim()
  if (!content) return { failed: false }

  const normalized = content.toLowerCase()
  if (normalized.startsWith("error:")) {
    return {
      failed: true,
      failureMessage: sanitizeFailureMessage(content.replace(/^error:\s*/i, "")),
    }
  }

  if (
    LOOP_INCOMPLETE_MARKERS.some((marker) => normalized.includes(marker))
    || LOOP_FAILURE_PATTERNS.some((pattern) => pattern.test(content))
    || isMissingApiKeyErrorMessage(content)
  ) {
    return {
      failed: true,
      failureMessage: sanitizeFailureMessage(content),
    }
  }

  return { failed: false }
}

export function prepareLoopForSave(loop: LoopConfig, previousLoop?: LoopConfig): LoopConfig {
  if (!previousLoop || previousLoop.enabled || !loop.enabled) {
    return loop
  }

  return {
    ...loop,
    consecutiveFailures: 0,
    lastFailureAt: undefined,
    lastFailureMessage: undefined,
    autoPausedAt: undefined,
  }
}

export function applyLoopRunClassification(
  loop: LoopConfig,
  classification: LoopRunClassification,
  runKind: LoopRunKind,
  timestamp: number = Date.now(),
): LoopConfig {
  if (!classification.failed) {
    return {
      ...loop,
      consecutiveFailures: 0,
      lastFailureAt: undefined,
      lastFailureMessage: undefined,
      autoPausedAt: undefined,
    }
  }

  const nextAutomaticFailureCount = runKind === "automatic"
    ? (loop.consecutiveFailures ?? 0) + 1
    : (loop.consecutiveFailures ?? 0)
  const shouldAutoPause = runKind === "automatic"
    && loop.enabled
    && nextAutomaticFailureCount >= LOOP_AUTO_PAUSE_FAILURE_THRESHOLD

  return {
    ...loop,
    enabled: shouldAutoPause ? false : loop.enabled,
    consecutiveFailures: nextAutomaticFailureCount || undefined,
    lastFailureAt: timestamp,
    lastFailureMessage: sanitizeFailureMessage(classification.failureMessage),
    autoPausedAt: shouldAutoPause ? timestamp : loop.autoPausedAt,
  }
}
