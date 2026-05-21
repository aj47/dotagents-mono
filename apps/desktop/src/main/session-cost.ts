/**
 * Per-session running cost accounting.
 *
 * Accumulates token usage from every LLM call in a session and converts it
 * to USD using the active model's per-million-token pricing from models.dev.
 * The cumulative figure is surfaced in `AgentProgressUpdate.sessionCost`
 * so the renderer can display the running cost alongside the turn duration.
 */

import { configStore } from "./config"
import { getModelPricing, type ModelPricing } from "./models-service"
import type { SessionCost } from "../shared/types"

/** Token usage reported by a single LLM call. All fields are optional. */
export interface SessionTokenUsage {
  inputTokens?: number
  outputTokens?: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
  reasoningTokens?: number
}

const sessionCostBySession = new Map<string, SessionCost>()

function emptyCost(): SessionCost {
  return {
    usd: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
  }
}

function computeDeltaUsd(usage: SessionTokenUsage, pricing: ModelPricing | undefined): number {
  if (!pricing) return 0
  const perMillion = (tokens: number | undefined, costPerMillion: number | undefined): number => {
    if (!tokens || !costPerMillion) return 0
    return (tokens * costPerMillion) / 1_000_000
  }
  // AI SDK reports cache read/write tokens as a SUBSET of `inputTokens`
  // (OpenAI / Anthropic / Gemini all populate `inputTokenDetails` this way),
  // so charge only the non-cached remainder at the full input rate and bill
  // cached portions separately. Callers using raw-protocol semantics (where
  // input/cache are non-overlapping) must sum them into `inputTokens` first.
  // Reasoning tokens, where reported, are a subset of output tokens; we only
  // add a delta when reasoningCost differs from outputCost to avoid double-billing.
  let usd = 0
  const cacheRead = usage.cacheReadTokens ?? 0
  const cacheWrite = usage.cacheWriteTokens ?? 0
  const nonCachedInput = Math.max(0, (usage.inputTokens ?? 0) - cacheRead - cacheWrite)
  usd += perMillion(nonCachedInput, pricing.inputCost)
  usd += perMillion(usage.outputTokens, pricing.outputCost)
  usd += perMillion(usage.cacheReadTokens, pricing.cacheReadCost)
  usd += perMillion(usage.cacheWriteTokens, pricing.cacheWriteCost)
  if (
    usage.reasoningTokens &&
    pricing.reasoningCost !== undefined &&
    pricing.outputCost !== undefined &&
    pricing.reasoningCost > pricing.outputCost
  ) {
    usd += perMillion(usage.reasoningTokens, pricing.reasoningCost - pricing.outputCost)
  }
  return usd
}

/**
 * Record token usage from a single LLM call against a session's running total.
 * Looks up the model's pricing from models.dev and increments the cumulative
 * USD figure when pricing is available; token counts are accumulated either
 * way so the UI can still surface usage when pricing is missing.
 */
export function recordSessionTokenUsage(
  sessionId: string | undefined,
  providerId: string | undefined,
  modelId: string | undefined,
  usage: SessionTokenUsage,
): void {
  if (!sessionId) return
  const hasAnyTokens =
    !!(usage.inputTokens || usage.outputTokens || usage.cacheReadTokens || usage.cacheWriteTokens || usage.reasoningTokens)
  if (!hasAnyTokens) return

  const current = sessionCostBySession.get(sessionId) ?? emptyCost()
  current.inputTokens += usage.inputTokens ?? 0
  current.outputTokens += usage.outputTokens ?? 0
  current.cacheReadTokens += usage.cacheReadTokens ?? 0
  current.cacheWriteTokens += usage.cacheWriteTokens ?? 0
  current.reasoningTokens += usage.reasoningTokens ?? 0

  // Look up pricing only when we have a provider+model hint. Resolves OpenRouter
  // (and similar) via the configured baseUrl so the right models.dev entry is hit.
  if (providerId && modelId) {
    const baseUrl = providerId === "openai" ? configStore.get().openaiBaseUrl : undefined
    const pricing = getModelPricing(providerId, modelId, baseUrl)
    current.usd += computeDeltaUsd(usage, pricing)
  }

  sessionCostBySession.set(sessionId, current)
}

/** Return the current running cost for a session, or undefined when no usage has been recorded. */
export function getSessionCost(sessionId: string | undefined): SessionCost | undefined {
  if (!sessionId) return undefined
  const entry = sessionCostBySession.get(sessionId)
  if (!entry) return undefined
  // Defensive copy so consumers can't mutate the cached object.
  return { ...entry }
}

/** Clear the running cost for a session (call on session end / cleanup). */
export function clearSessionCost(sessionId: string): void {
  sessionCostBySession.delete(sessionId)
}

/**
 * Map an ACP agent name to a best-guess models.dev provider id used as the
 * lookup hint when recording usage. `getModelFromModelsDevByProviderId` falls
 * back to cross-provider fuzzy matching, so a wrong hint is non-fatal — it just
 * costs a fuzzy-match round trip.
 */
export function providerHintForAcpAgent(agentName: string | undefined): string {
  const n = (agentName || "").toLowerCase()
  if (n.includes("claude")) return "anthropic"
  if (n.includes("codex") || n.includes("openai")) return "openai"
  if (n.includes("gemini") || n.includes("google")) return "google"
  return "anthropic"
}
