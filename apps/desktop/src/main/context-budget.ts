import { configStore } from "./config"
import { isDebugLLM, logLLM } from "./debug"
import { makeTextCompletionWithFetch } from "./llm-fetch"
import { fetchModelsDevData, getModelFromModelsDevByProviderId } from "./models-dev-service"
import { constructMinimalSystemPrompt } from "./system-prompts"
import { agentSessionStateManager } from "./state"
import { summarizationService } from "./summarization-service"
import { sanitizeMessageContentForDisplay } from "@dotagents/shared"

export type LLMMessage = { role: string; content: string }

type ContextRefKind = "truncated_tool" | "truncated_payload" | "batch_summary" | "dropped_messages" | "archived_history"

interface ContextRefEntry {
  ref: string
  kind: ContextRefKind
  createdAt: number
  role: string
  content: string
  preview: string
  totalChars: number
  toolName?: string
  messageCount?: number
}

interface ReadMoreContextOptions {
  mode?: "overview" | "head" | "tail" | "window" | "search"
  offset?: number
  length?: number
  query?: string
  maxChars?: number
}

// Simple in-memory cache for provider/model context windows
const contextWindowCache = new Map<string, number>()
const contextRefRegistryBySession = new Map<string, Map<string, ContextRefEntry>>()
const archiveFrontierCountBySession = new Map<string, number>()
const archiveHistoryRefBySession = new Map<string, string>()

function key(providerId: string, model: string) {
  return `${providerId}|${model}`
}

function mapToModelsDevProviderId(providerId: string): string {
  if (providerId === "openai") {
    const baseUrl = configStore.get().openaiBaseUrl
    if (baseUrl?.includes("openrouter.ai")) return "openrouter"
  }

  if (providerId === "gemini") return "google"

  return providerId
}

// ============================================================================
// MODEL REGISTRY - Comprehensive context windows for known models
// ============================================================================

interface ModelSpec {
  contextWindow: number
  maxOutputTokens?: number
}

/**
 * Model registry with known context windows.
 * Keys are normalized patterns that will be matched against model names.
 * Order matters: more specific patterns should come first.
 */
const MODEL_REGISTRY: Record<string, ModelSpec> = {
  // -------------------------------------------------------------------------
  // Anthropic Claude models (all 200K context)
  // -------------------------------------------------------------------------
  // Claude 4.x series
  "claude-opus-4.5": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  "claude-opus-4-5": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  "claude-opus-4.1": { contextWindow: 200_000, maxOutputTokens: 32_000 },
  "claude-opus-4-1": { contextWindow: 200_000, maxOutputTokens: 32_000 },
  "claude-opus-4.0": { contextWindow: 200_000, maxOutputTokens: 32_000 },
  "claude-opus-4-0": { contextWindow: 200_000, maxOutputTokens: 32_000 },
  "claude-opus-4": { contextWindow: 200_000, maxOutputTokens: 32_000 },
  "claude-sonnet-4.5": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  "claude-sonnet-4-5": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  "claude-sonnet-4.0": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  "claude-sonnet-4-0": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  "claude-sonnet-4": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  "claude-haiku-4.5": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  "claude-haiku-4-5": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  // Claude 3.x series
  "claude-3.7-sonnet": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  "claude-3-7-sonnet": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  "claude-3.5-sonnet": { contextWindow: 200_000, maxOutputTokens: 8_192 },
  "claude-3-5-sonnet": { contextWindow: 200_000, maxOutputTokens: 8_192 },
  "claude-3.5-haiku": { contextWindow: 200_000, maxOutputTokens: 8_192 },
  "claude-3-5-haiku": { contextWindow: 200_000, maxOutputTokens: 8_192 },
  "claude-3-opus": { contextWindow: 200_000, maxOutputTokens: 4_096 },
  "claude-3-sonnet": { contextWindow: 200_000, maxOutputTokens: 4_096 },
  "claude-3-haiku": { contextWindow: 200_000, maxOutputTokens: 4_096 },
  // Generic Claude fallbacks (match any claude model)
  "claude-opus": { contextWindow: 200_000, maxOutputTokens: 32_000 },
  "claude-sonnet": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  "claude-haiku": { contextWindow: 200_000, maxOutputTokens: 64_000 },
  "claude": { contextWindow: 200_000, maxOutputTokens: 8_192 },

  // -------------------------------------------------------------------------
  // OpenAI models
  // -------------------------------------------------------------------------
  // GPT-5.x series (future-proofing based on pi-mono registry)
  "gpt-5.2": { contextWindow: 128_000, maxOutputTokens: 64_000 },
  "gpt-5.1": { contextWindow: 128_000, maxOutputTokens: 128_000 },
  "gpt-5-codex": { contextWindow: 128_000, maxOutputTokens: 128_000 },
  "gpt-5-mini": { contextWindow: 128_000, maxOutputTokens: 64_000 },
  "gpt-5": { contextWindow: 128_000, maxOutputTokens: 128_000 },
  // GPT-4.x series
  "gpt-4.1": { contextWindow: 128_000, maxOutputTokens: 16_384 },
  "gpt-4.1-mini": { contextWindow: 128_000, maxOutputTokens: 16_384 },
  "gpt-4o-mini": { contextWindow: 128_000, maxOutputTokens: 16_384 },
  "gpt-4o": { contextWindow: 128_000, maxOutputTokens: 16_384 },
  "gpt-4-turbo": { contextWindow: 128_000, maxOutputTokens: 4_096 },
  "gpt-4-32k": { contextWindow: 32_768, maxOutputTokens: 4_096 },
  "gpt-4": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  // GPT-3.5 series
  "gpt-3.5-turbo-16k": { contextWindow: 16_384, maxOutputTokens: 4_096 },
  "gpt-3.5-turbo": { contextWindow: 16_384, maxOutputTokens: 4_096 },
  "gpt-3.5": { contextWindow: 16_384, maxOutputTokens: 4_096 },
  // o-series reasoning models
  // Note: Include "o-1" and "o-3" patterns because normalizeModelName() inserts
  // hyphens between letters and digits (e.g., "o1" -> "o-1")
  "o3-mini": { contextWindow: 200_000, maxOutputTokens: 100_000 },
  "o-3-mini": { contextWindow: 200_000, maxOutputTokens: 100_000 },
  "o3": { contextWindow: 200_000, maxOutputTokens: 100_000 },
  "o-3": { contextWindow: 200_000, maxOutputTokens: 100_000 },
  "o1-mini": { contextWindow: 128_000, maxOutputTokens: 65_536 },
  "o-1-mini": { contextWindow: 128_000, maxOutputTokens: 65_536 },
  "o1-preview": { contextWindow: 128_000, maxOutputTokens: 32_768 },
  "o-1-preview": { contextWindow: 128_000, maxOutputTokens: 32_768 },
  "o1": { contextWindow: 200_000, maxOutputTokens: 100_000 },
  "o-1": { contextWindow: 200_000, maxOutputTokens: 100_000 },

  // -------------------------------------------------------------------------
  // Google Gemini models
  // -------------------------------------------------------------------------
  "gemini-3-pro": { contextWindow: 1_000_000, maxOutputTokens: 64_000 },
  "gemini-3-flash": { contextWindow: 1_048_576, maxOutputTokens: 65_536 },
  "gemini-2.5-pro": { contextWindow: 1_048_576, maxOutputTokens: 65_536 },
  "gemini-2.5-flash-lite": { contextWindow: 1_048_576, maxOutputTokens: 65_536 },
  "gemini-2.5-flash": { contextWindow: 1_048_576, maxOutputTokens: 65_536 },
  "gemini-2.0-flash-lite": { contextWindow: 1_048_576, maxOutputTokens: 8_192 },
  "gemini-2.0-flash": { contextWindow: 1_048_576, maxOutputTokens: 8_192 },
  "gemini-1.5-pro": { contextWindow: 1_000_000, maxOutputTokens: 8_192 },
  "gemini-1.5-flash-8b": { contextWindow: 1_000_000, maxOutputTokens: 8_192 },
  "gemini-1.5-flash": { contextWindow: 1_000_000, maxOutputTokens: 8_192 },
  "gemini-flash": { contextWindow: 1_048_576, maxOutputTokens: 65_536 },
  "gemini-pro": { contextWindow: 1_000_000, maxOutputTokens: 8_192 },
  "gemini": { contextWindow: 1_000_000, maxOutputTokens: 8_192 },

  // -------------------------------------------------------------------------
  // xAI Grok models
  // -------------------------------------------------------------------------
  "grok-4.1-fast": { contextWindow: 2_000_000, maxOutputTokens: 30_000 },
  "grok-4-fast": { contextWindow: 2_000_000, maxOutputTokens: 30_000 },
  "grok-4": { contextWindow: 256_000, maxOutputTokens: 64_000 },
  "grok-3-mini": { contextWindow: 131_072, maxOutputTokens: 8_192 },
  "grok-3": { contextWindow: 131_072, maxOutputTokens: 8_192 },
  "grok-2-vision": { contextWindow: 8_192, maxOutputTokens: 4_096 },
  "grok-2": { contextWindow: 131_072, maxOutputTokens: 8_192 },
  "grok-code-fast": { contextWindow: 256_000, maxOutputTokens: 10_000 },
  "grok": { contextWindow: 131_072, maxOutputTokens: 8_192 },

  // -------------------------------------------------------------------------
  // Meta Llama models (commonly via Groq, Together, etc.)
  // -------------------------------------------------------------------------
  "openai/gpt-oss-120b": { contextWindow: 131_072, maxOutputTokens: 65_536 },
  "llama-3.3-70b": { contextWindow: 128_000, maxOutputTokens: 32_768 },
  "llama-3.2-90b": { contextWindow: 128_000, maxOutputTokens: 4_096 },
  "llama-3.2-11b": { contextWindow: 128_000, maxOutputTokens: 4_096 },
  "llama-3.2-3b": { contextWindow: 128_000, maxOutputTokens: 4_096 },
  "llama-3.2-1b": { contextWindow: 128_000, maxOutputTokens: 4_096 },
  "llama-3.1-405b": { contextWindow: 128_000, maxOutputTokens: 4_096 },
  "llama-3.1-70b": { contextWindow: 128_000, maxOutputTokens: 4_096 },
  "llama-3.1-8b": { contextWindow: 128_000, maxOutputTokens: 4_096 },
  "llama-3-70b": { contextWindow: 8_192, maxOutputTokens: 2_048 },
  "llama-3-8b": { contextWindow: 8_192, maxOutputTokens: 2_048 },
  // Note: "llama3" becomes "llama-3" after normalization, but we keep both
  // for inputs that already have the hyphen or come from different sources
  "llama3": { contextWindow: 8_192, maxOutputTokens: 2_048 },
  "llama-3": { contextWindow: 8_192, maxOutputTokens: 2_048 },
  "llama-70b": { contextWindow: 32_768, maxOutputTokens: 4_096 },
  "llama-8b": { contextWindow: 8_192, maxOutputTokens: 2_048 },
  "llama": { contextWindow: 8_192, maxOutputTokens: 2_048 },

  // -------------------------------------------------------------------------
  // Mistral models
  // -------------------------------------------------------------------------
  "mistral-large": { contextWindow: 128_000, maxOutputTokens: 4_096 },
  "mistral-medium": { contextWindow: 32_000, maxOutputTokens: 4_096 },
  "mistral-small": { contextWindow: 32_000, maxOutputTokens: 4_096 },
  "mixtral-8x22b": { contextWindow: 65_536, maxOutputTokens: 4_096 },
  "mixtral-8x7b": { contextWindow: 32_768, maxOutputTokens: 4_096 },
  "mixtral": { contextWindow: 32_768, maxOutputTokens: 4_096 },
  "mistral-7b": { contextWindow: 8_192, maxOutputTokens: 2_048 },
  "mistral": { contextWindow: 32_000, maxOutputTokens: 4_096 },

  // -------------------------------------------------------------------------
  // DeepSeek models
  // -------------------------------------------------------------------------
  // Note: "deepseek-v3" becomes "deepseek-3" after normalization (v(\d+) -> $1)
  "deepseek-r1": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "deepseek-r-1": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "deepseek-v3": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "deepseek-3": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "deepseek-coder": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "deepseek-chat": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "deepseek": { contextWindow: 128_000, maxOutputTokens: 8_192 },

  // -------------------------------------------------------------------------
  // Qwen models
  // -------------------------------------------------------------------------
  // Note: "qwen3" becomes "qwen-3" after normalization (letter-digit hyphen insertion)
  "qwen3-coder": { contextWindow: 262_144, maxOutputTokens: 262_144 },
  "qwen-3-coder": { contextWindow: 262_144, maxOutputTokens: 262_144 },
  "qwen3-max": { contextWindow: 256_000, maxOutputTokens: 32_768 },
  "qwen-3-max": { contextWindow: 256_000, maxOutputTokens: 32_768 },
  "qwen3-235b": { contextWindow: 262_144, maxOutputTokens: 4_096 },
  "qwen-3-235b": { contextWindow: 262_144, maxOutputTokens: 4_096 },
  "qwen3-72b": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "qwen-3-72b": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "qwen3-32b": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "qwen-3-32b": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "qwen3-8b": { contextWindow: 128_000, maxOutputTokens: 20_000 },
  "qwen-3-8b": { contextWindow: 128_000, maxOutputTokens: 20_000 },
  "qwen3": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "qwen-3": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "qwen2.5": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "qwen-2.5": { contextWindow: 128_000, maxOutputTokens: 8_192 },
  "qwen2": { contextWindow: 32_768, maxOutputTokens: 4_096 },
  "qwen-2": { contextWindow: 32_768, maxOutputTokens: 4_096 },
  "qwen": { contextWindow: 32_768, maxOutputTokens: 4_096 },
  "qwq": { contextWindow: 32_768, maxOutputTokens: 4_096 },

  // -------------------------------------------------------------------------
  // Cohere models
  // -------------------------------------------------------------------------
  "command-r-plus": { contextWindow: 128_000, maxOutputTokens: 4_096 },
  "command-r": { contextWindow: 128_000, maxOutputTokens: 4_096 },
  "command": { contextWindow: 4_096, maxOutputTokens: 4_096 },
}

/**
 * Normalize a model name for fuzzy matching.
 * Handles variations like:
 * - claude-haiku-4-5-20251001 -> claude-haiku-4-5
 * - claude-haiku-4.5-20251001 -> claude-haiku-4.5
 * - anthropic/claude-3.5-sonnet -> claude-3.5-sonnet
 * - accounts/fireworks/models/llama-v3p1-70b -> llama-v3p1-70b
 * - gpt4 -> gpt-4 (inserts hyphen between letters and digits)
 * - gpt4o -> gpt-4o
 */
function normalizeModelName(model: string): string {
  let normalized = model.toLowerCase()

  // Remove provider prefixes (e.g., "anthropic/", "openai/", "accounts/fireworks/models/")
  // Try patterns from most specific to least specific, stop after first match
  const prefixPatterns = [
    /^accounts\/[^/]+\/models\//, // Fireworks: accounts/fireworks/models/...
    /^[a-z0-9]+\/[a-z0-9-]+\//, // Two-level: provider/subtype/ (e.g., openrouter/anthropic/)
    /^[a-z0-9-]+\//, // Simple prefix: anthropic/, openai/, etc.
  ]
  for (const pattern of prefixPatterns) {
    if (pattern.test(normalized)) {
      normalized = normalized.replace(pattern, "")
      break // Stop after first match to avoid double-stripping
    }
  }

  // Remove date suffixes (e.g., "-20251001", "-2024-06-20")
  normalized = normalized.replace(/-\d{8}$/, "") // YYYYMMDD
  normalized = normalized.replace(/-\d{4}-\d{2}-\d{2}$/, "") // YYYY-MM-DD
  normalized = normalized.replace(/-\d{6}$/, "") // YYMMDD

  // Remove version suffixes like ":latest", ":free", ":exacto"
  normalized = normalized.replace(/:[a-z]+$/, "")

  // Normalize version separators (v3p1 -> 3.1, v3-1 -> 3.1)
  normalized = normalized.replace(/v(\d+)p(\d+)/g, "$1.$2")
  normalized = normalized.replace(/v(\d+)-(\d+)/g, "$1.$2")
  normalized = normalized.replace(/v(\d+)/g, "$1")

  // Insert hyphen between letters and digits where missing (gpt4 -> gpt-4, gpt35 -> gpt-3.5)
  // This handles common variations like "gpt4", "gpt4o", "gpt35" which should match "gpt-4", etc.
  // Pattern: letter followed by digit (without hyphen between them)
  normalized = normalized.replace(/([a-z])(\d)/g, "$1-$2")

  return normalized
}

/**
 * Calculate a match score between a normalized model name and a registry pattern.
 * Higher score = better match.
 * Returns 0 if no match.
 */
function calculateMatchScore(normalizedModel: string, pattern: string): number {
  // Exact match is best
  if (normalizedModel === pattern) return 1000

  // Check if model contains the pattern
  if (!normalizedModel.includes(pattern)) return 0

  // Score based on:
  // 1. Pattern length (longer = more specific = better)
  // 2. Position in model name (earlier = better)
  // 3. Whether it's a word boundary match
  const position = normalizedModel.indexOf(pattern)
  const lengthScore = pattern.length * 10
  const positionScore = (normalizedModel.length - position) // Earlier is better
  const boundaryBonus = (position === 0 || normalizedModel[position - 1] === "-") ? 50 : 0

  return lengthScore + positionScore + boundaryBonus
}

/**
 * Look up context window for a model using fuzzy matching.
 * Returns the best matching spec or undefined if no match.
 */
function lookupModelSpec(model: string): ModelSpec | undefined {
  const normalized = normalizeModelName(model)

  let bestMatch: { pattern: string; spec: ModelSpec; score: number } | undefined

  for (const [pattern, spec] of Object.entries(MODEL_REGISTRY)) {
    const score = calculateMatchScore(normalized, pattern)
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { pattern, spec, score }
    }
  }

  if (bestMatch && isDebugLLM()) {
    logLLM("ModelRegistry: matched", {
      original: model,
      normalized,
      matchedPattern: bestMatch.pattern,
      score: bestMatch.score,
      contextWindow: bestMatch.spec.contextWindow,
    })
  }

  return bestMatch?.spec
}

/**
 * Get context window for a model, with fuzzy matching and provider fallbacks.
 */
function getModelContextWindow(providerId: string, model: string): number {
  // Try fuzzy match in registry first
  const spec = lookupModelSpec(model)
  if (spec) return spec.contextWindow

  // Provider-specific fallbacks for models not in registry
  const lower = model.toLowerCase()

  if (providerId === "groq") {
    // Groq models - conservative defaults
    if (lower.includes("70b") || lower.includes("405b")) return 32_768
    if (lower.includes("8b") || lower.includes("9b")) return 8_192
    return 32_768
  }

  if (providerId === "openai") {
    // Unknown OpenAI model - use conservative default to avoid oversized requests
    // (legacy models like GPT-3.5 have 16K, embedding models even less)
    return 16_000
  }

  if (providerId === "anthropic") {
    // Unknown Anthropic model - use conservative default
    // (older Claude models may have smaller contexts)
    return 100_000
  }

  if (providerId === "gemini" || providerId === "google") {
    // Unknown Google model - use conservative default
    // (some Gemini variants have smaller contexts than the flagship)
    return 128_000
  }

  // Generic fallback - conservative
  if (isDebugLLM()) {
    logLLM("ModelRegistry: no match, using fallback", { providerId, model, fallback: 64_000 })
  }
  return 64_000
}

async function fetchGroqContextWindow(model: string): Promise<number | undefined> {
  try {
    const config = configStore.get()
    const baseURL = config.groqBaseUrl || "https://api.groq.com/openai/v1"
    const apiKey = config.groqApiKey
    if (!apiKey) return undefined
    const resp = await fetch(`${baseURL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!resp.ok) return undefined
    const data = await resp.json() as any
    const list = Array.isArray(data?.data) ? data.data : []
    const entry = list.find((m: any) => m?.id === model)
    const ctx = entry?.context_length || entry?.max_context_tokens || entry?.context_window
    if (typeof ctx === "number") return ctx
  } catch {}
  return undefined
}

async function fetchModelsDevContextWindow(providerId: string, model: string): Promise<number | undefined> {
  try {
    await fetchModelsDevData()
    const modelsDevProviderId = mapToModelsDevProviderId(providerId)
    const modelsDevModel = getModelFromModelsDevByProviderId(model, modelsDevProviderId)
    const contextWindow = modelsDevModel?.limit?.context

    if (typeof contextWindow === "number" && contextWindow > 0) {
      return contextWindow
    }
  } catch {}

  return undefined
}

async function getMaxContextTokens(providerId: string, model: string): Promise<number> {
  const cfg = configStore.get()
  const override = cfg.mcpMaxContextTokensOverride
  if (override && typeof override === "number" && override > 0) return override

  const k = key(providerId, model)
  if (contextWindowCache.has(k)) return contextWindowCache.get(k)!

  let result: number | undefined
  if (providerId === "groq") {
    result = await fetchGroqContextWindow(model)
  }
  if (!result) {
    result = await fetchModelsDevContextWindow(providerId, model)
  }
  // Use model registry with fuzzy matching for context window lookup
  if (!result) result = getModelContextWindow(providerId, model)

  contextWindowCache.set(k, result)
  return result
}

export function estimateTokensFromMessages(messages: LLMMessage[]): number {
  // Rough estimate: 4 chars ≈ 1 token
  const totalChars = messages.reduce((sum, m) => {
    const budgetContent = sanitizeMessageContentForDisplay(m.content || "")
    return sum + budgetContent.length
  }, 0)
  return Math.ceil(totalChars / 4)
}

// ============================================================================
// ACTUAL TOKEN TRACKING
// ============================================================================

/**
 * Track actual API-reported token counts per session.
 * Used to calibrate context budget decisions with real data instead of estimates.
 */
const actualTokenUsageBySession = new Map<string, { inputTokens: number; outputTokens: number; timestamp: number }>()

/**
 * Record actual token usage from an API response for a session.
 * Called from llm-fetch.ts after each LLM call completes.
 */
export function recordActualTokenUsage(sessionId: string, inputTokens: number, outputTokens: number): void {
  actualTokenUsageBySession.set(sessionId, { inputTokens, outputTokens, timestamp: Date.now() })
}

/**
 * Get the last known actual input token count for a session.
 * Returns undefined if no actual usage has been recorded.
 */
function getActualInputTokens(sessionId?: string): number | undefined {
  if (!sessionId) return undefined
  return actualTokenUsageBySession.get(sessionId)?.inputTokens
}

/**
 * Clear actual token tracking for a session (call on session end).
 */
export function clearActualTokenUsage(sessionId: string): void {
  actualTokenUsageBySession.delete(sessionId)
}

function buildContextPreview(content: string, maxChars: number = 180): string {
  const normalized = content.replace(/\s+/g, " ").trim()
  return normalized.length > maxChars ? `${normalized.slice(0, maxChars)}…` : normalized
}

function getSessionContextRefRegistry(sessionId: string): Map<string, ContextRefEntry> {
  let registry = contextRefRegistryBySession.get(sessionId)
  if (!registry) {
    registry = new Map<string, ContextRefEntry>()
    contextRefRegistryBySession.set(sessionId, registry)
  }
  return registry
}

function makeContextRef(): string {
  return `ctx_${Math.random().toString(36).slice(2, 10)}`
}

function registerContextRef(
  sessionId: string | undefined,
  input: {
    kind: ContextRefKind
    role: string
    content: string
    toolName?: string
    messageCount?: number
  },
): string | undefined {
  if (!sessionId) return undefined

  const ref = makeContextRef()
  const registry = getSessionContextRefRegistry(sessionId)
  registry.set(ref, {
    ref,
    kind: input.kind,
    createdAt: Date.now(),
    role: input.role,
    content: input.content,
    preview: buildContextPreview(input.content),
    totalChars: input.content.length,
    toolName: input.toolName,
    messageCount: input.messageCount,
  })
  return ref
}

function addContextRefNote(message: string, contextRef?: string): string {
  if (!contextRef) return message
  return `${message}\nContext ref: ${contextRef}`
}

export function clearContextRefs(sessionId: string): void {
  contextRefRegistryBySession.delete(sessionId)
  archiveHistoryRefBySession.delete(sessionId)
}

export function clearArchiveFrontier(sessionId: string): void {
  archiveFrontierCountBySession.delete(sessionId)
  archiveHistoryRefBySession.delete(sessionId)
}

function getContextRefEntry(sessionId: string | undefined, contextRef: string): ContextRefEntry | undefined {
  if (!sessionId) return undefined
  return contextRefRegistryBySession.get(sessionId)?.get(contextRef)
}

function buildArchivedMessagesContent(messages: LLMMessage[], label: string = "Archived"): string {
  return messages
    .map((message, idx) => `[${label} ${idx + 1} | role=${message.role}]\n${message.content || ""}`)
    .join("\n\n---\n\n")
}

function upsertArchiveHistoryRef(sessionId: string, archivedMessages: LLMMessage[]): string | undefined {
  if (archivedMessages.length === 0) {
    return archiveHistoryRefBySession.get(sessionId)
  }

  const registry = getSessionContextRefRegistry(sessionId)
  const nextChunk = buildArchivedMessagesContent(archivedMessages)
  const existingRef = archiveHistoryRefBySession.get(sessionId)

  if (existingRef) {
    const existing = registry.get(existingRef)
    if (existing) {
      const combined = existing.content
        ? `${existing.content}\n\n===\n\n${nextChunk}`
        : nextChunk
      registry.set(existingRef, {
        ...existing,
        kind: "archived_history",
        content: combined,
        preview: buildContextPreview(combined),
        totalChars: combined.length,
        messageCount: (existing.messageCount || 0) + archivedMessages.length,
      })
      return existingRef
    }
  }

  const ref = makeContextRef()
  registry.set(ref, {
    ref,
    kind: "archived_history",
    createdAt: Date.now(),
    role: "assistant",
    content: nextChunk,
    preview: buildContextPreview(nextChunk),
    totalChars: nextChunk.length,
    messageCount: archivedMessages.length,
  })
  archiveHistoryRefBySession.set(sessionId, ref)
  return ref
}

export function readMoreContext(
  sessionId: string | undefined,
  contextRef: string,
  options: ReadMoreContextOptions = {},
): Record<string, unknown> {
  const entry = getContextRefEntry(sessionId, contextRef)
  if (!entry) {
    return {
      success: false,
      contextRef,
      error: sessionId
        ? `Context ref not found for this session: ${contextRef}`
        : "read_more_context requires an active session",
    }
  }

  const mode = options.mode ?? "overview"
  const maxChars = Math.max(100, Math.min(options.maxChars ?? 1200, 4000))
  const totalChars = entry.totalChars

  if (mode === "overview") {
    return {
      success: true,
      contextRef,
      mode,
      kind: entry.kind,
      role: entry.role,
      toolName: entry.toolName,
      messageCount: entry.messageCount,
      totalChars,
      preview: entry.preview,
    }
  }

  if (mode === "head") {
    return {
      success: true,
      contextRef,
      mode,
      totalChars,
      returnedChars: Math.min(maxChars, totalChars),
      excerpt: entry.content.slice(0, maxChars),
    }
  }

  if (mode === "tail") {
    const start = Math.max(0, totalChars - maxChars)
    return {
      success: true,
      contextRef,
      mode,
      totalChars,
      start,
      returnedChars: totalChars - start,
      excerpt: entry.content.slice(start),
    }
  }

  if (mode === "window") {
    const safeLength = Math.max(100, Math.min(options.length ?? maxChars, maxChars))
    const safeOffset = Math.max(0, Math.min(options.offset ?? 0, Math.max(0, totalChars - 1)))
    const start = Math.max(0, Math.min(safeOffset, Math.max(0, totalChars - safeLength)))
    const end = Math.min(totalChars, start + safeLength)
    return {
      success: true,
      contextRef,
      mode,
      totalChars,
      start,
      end,
      returnedChars: end - start,
      excerpt: entry.content.slice(start, end),
    }
  }

  if (mode === "search") {
    const query = typeof options.query === "string" ? options.query.trim() : ""
    if (!query) {
      return {
        success: false,
        contextRef,
        mode,
        error: "query is required for search mode",
      }
    }

    const haystack = entry.content.toLowerCase()
    const needle = query.toLowerCase()
    const matches: Array<{ start: number; end: number; excerpt: string }> = []
    let cursor = 0
    while (cursor < haystack.length && matches.length < 5) {
      const foundAt = haystack.indexOf(needle, cursor)
      if (foundAt === -1) break
      const desiredBefore = Math.floor(maxChars / 4)
      const desiredAfter = Math.floor(maxChars / 2)
      let start = foundAt
      let end = Math.min(totalChars, foundAt + maxChars)

      if (needle.length < maxChars) {
        const totalDesiredContext = desiredBefore + desiredAfter
        const availableContextChars = maxChars - needle.length
        const contextBefore = Math.min(
          desiredBefore,
          Math.floor((availableContextChars * desiredBefore) / Math.max(1, totalDesiredContext)),
        )
        const contextAfter = availableContextChars - contextBefore

        start = Math.max(0, foundAt - contextBefore)
        end = Math.min(totalChars, foundAt + needle.length + contextAfter)
      }

      matches.push({
        start,
        end,
        excerpt: entry.content.slice(start, end),
      })
      cursor = foundAt + needle.length
    }

    return {
      success: true,
      contextRef,
      mode,
      query,
      totalChars,
      matchCount: matches.length,
      matches,
    }
  }

  return {
    success: false,
    contextRef,
    mode,
    error: `Unsupported mode: ${mode}`,
  }
}

// ============================================================================
// ITERATIVE SUMMARY CACHE (Pi-style)
// ============================================================================

/**
 * Store running summaries per session. Each compaction merges with the previous
 * summary instead of re-summarizing from scratch, preserving cumulative history.
 */
const iterativeSummaryCache = new Map<string, string>()

/**
 * Clear iterative summary for a session (call on session end).
 */
export function clearIterativeSummary(sessionId: string): void {
  iterativeSummaryCache.delete(sessionId)
}

function getProviderAndModel(): { providerId: string; model: string } {
  const config = configStore.get()
  const providerId = config.mcpToolsProviderId || "openai"
  let model = "gpt-4.1-mini"
  if (providerId === "openai") {
    model = config.mcpToolsOpenaiModel || "gpt-4.1-mini"
  } else if (providerId === "groq") {
    model = config.mcpToolsGroqModel || "openai/gpt-oss-120b"
  } else if (providerId === "gemini") {
    model = config.mcpToolsGeminiModel || "gemini-2.5-flash"
  }
  return { providerId, model }
}

export async function summarizeContent(content: string, sessionId?: string): Promise<string> {
  const { providerId: provider } = getProviderAndModel() // align with agent provider
  const MAX_TOKENS_HINT = 400 // soft guidance via prompt only
  const CHUNK_SIZE = 16000 // ~4k tokens per chunk (roughly)

  const makePrompt = (src: string) => `Summarize tool output or conversation focusing on WHAT WAS LEARNED, not what was executed.

PRESERVE (exact format):
- Tool names with prefixes: [server:tool_name] - keep this exact format
- IDs, file paths, URLs, numeric values
- Key data points and findings

FOCUS ON:
- What information was discovered or retrieved
- What elements/data are visible or available
- What actions succeeded or failed and WHY
- Key observations that inform next steps

DO NOT:
- Just say "tool executed successfully" - describe what it returned
- Lose the [toolName] prefix format
- Invent or hallucinate values

Target: ~${MAX_TOKENS_HINT} tokens. Be concise but preserve actionable information.

SOURCE:
${src}`

  const summarizeOnce = async (src: string): Promise<string> => {
    try {
      // Check if session should stop before making LLM call
      if (sessionId && agentSessionStateManager.shouldStopSession(sessionId)) {
        return src
      }
      const summary = await makeTextCompletionWithFetch(makePrompt(src), provider, sessionId)
      return summary?.trim() || src
    } catch (e) {
      return src
    }
  }

  // Small enough: single pass
  if (content.length <= CHUNK_SIZE) {
    return await summarizeOnce(content)
  }

  // Very large content (>100K): truncate to first + last chunks to avoid dozens of LLM calls
  const MAX_CHUNKS = 6
  const LARGE_CONTENT_THRESHOLD = CHUNK_SIZE * MAX_CHUNKS // ~96K chars
  let contentToSummarize = content
  if (content.length > LARGE_CONTENT_THRESHOLD) {
    const halfChunks = Math.floor(MAX_CHUNKS / 2)
    const headSize = CHUNK_SIZE * halfChunks
    const tailSize = CHUNK_SIZE * halfChunks
    contentToSummarize =
      content.slice(0, headSize) +
      `\n\n[... ${content.length - headSize - tailSize} chars truncated for summarization ...]\n\n` +
      content.slice(content.length - tailSize)
  }

  // Large content: chunk then combine
  const parts: string[] = []
  for (let i = 0; i < contentToSummarize.length; i += CHUNK_SIZE) {
    parts.push(contentToSummarize.slice(i, i + CHUNK_SIZE))
  }

  const partials: string[] = []
  for (const p of parts) {
    partials.push(await summarizeOnce(p))
  }

  let combined = partials.join("\n")

  // If combined is still large, compress once more
  if (combined.length > CHUNK_SIZE) {
    combined = await summarizeOnce(combined)
  }

  return combined
}

interface SummaryCandidate {
  i: number
  len: number
  role: string
  contentForSummary: string
}

interface SummaryBatch {
  startIndex: number
  endIndex: number
  items: SummaryCandidate[]
}

const TOOL_TRUNCATE_MARKER = "[Large tool result truncated for context management. If more detail is needed, re-run the tool with narrower input or inspect the source directly.]"
const PAYLOAD_TRUNCATE_MARKER = "[Large payload truncated for context management. Keep only the most relevant leading content here and fetch narrower details if needed.]"
const AGGRESSIVE_TRUNCATE_THRESHOLD = 5000
const AGGRESSIVE_TRUNCATE_KEEP_CHARS = 4000
const TOOL_RESULT_TRUNCATE_THRESHOLD = 3000
const TOOL_RESULT_KEEP_CHARS = 1800
const BATCH_SUMMARY_MAX_INPUT_CHARS = 12000
const BATCH_SUMMARY_MAX_MESSAGES = 8
const ARCHIVE_FRONTIER_KEEP_LIVE_MESSAGES = 20
const ARCHIVE_FRONTIER_TRIGGER_MESSAGE_COUNT = 40
const ARCHIVE_FRONTIER_TRIGGER_TOKEN_RATIO = 0.9
const ARCHIVE_FRONTIER_MIN_ARCHIVE_BATCH = 8
const MAPPED_TOOL_RESULT_PREFIX_RE = /^\[((?=[^\]]*[a-z])[A-Za-z0-9._:/-]+)\]\s(?:ERROR:\s*)?/

function parseMappedToolResultContent(content: string): { toolName: string; resultContent: string } | null {
  const trimmed = content.trimStart()
  const match = trimmed.match(MAPPED_TOOL_RESULT_PREFIX_RE)
  if (!match) return null

  return {
    toolName: match[1],
    resultContent: trimmed.slice(match[0].length),
  }
}

function hasMappedToolResultPrefix(content: string): boolean {
  return parseMappedToolResultContent(content) !== null
}

function startsWithJsonLikeArray(content: string): boolean {
  return /^\[\s*(?:\{|\[|"|-?\d|true\b|false\b|null\b)/.test(content.trim())
}

function isLikelyPayloadLikeMessage(message: LLMMessage): boolean {
  const content = message.content || ""
  return message.role === "tool"
    || hasMappedToolResultPrefix(content) // Tool results mapped to user role
    || content.includes('"url":')
    || content.includes('"id":')
    || content.includes("```json")
    || content.trim().startsWith("{")
    || startsWithJsonLikeArray(content)
}

function truncateWithMarker(content: string, keepChars: number, marker: string): string {
  if (content.length <= keepChars) return content
  const head = content.slice(0, keepChars).trimEnd()
  const removedChars = content.length - keepChars
  return `${head}\n\n${marker} (${removedChars} chars omitted)`
}

function isTruncationProtectedMessage(message: LLMMessage): boolean {
  const content = message.content || ""
  return content.includes(TOOL_TRUNCATE_MARKER) || content.includes(PAYLOAD_TRUNCATE_MARKER)
}

function collectTruncationProtectedIndices(messages: LLMMessage[]): Set<number> {
  const protectedIndices = new Set<number>()
  messages.forEach((message, index) => {
    if (isTruncationProtectedMessage(message)) {
      protectedIndices.add(index)
    }
  })
  return protectedIndices
}

function formatBatchSummaryInput(items: SummaryCandidate[]): string {
  return items.map((item, idx) => (
    `[Message ${idx + 1} | role=${item.role} | original_index=${item.i} | chars=${item.len}]\n${item.contentForSummary}`
  )).join("\n\n---\n\n")
}

function formatBatchSourceMessages(items: SummaryCandidate[], allMessages: LLMMessage[]): string {
  return items.map((item, idx) => (
    `[Message ${idx + 1} | role=${item.role} | original_index=${item.i}]\n${allMessages[item.i]?.content || item.contentForSummary}`
  )).join("\n\n---\n\n")
}

function estimateBatchInputLength(items: SummaryCandidate[]): number {
  return formatBatchSummaryInput(items).length
}

function buildSummaryBatches(candidates: SummaryCandidate[]): SummaryBatch[] {
  if (candidates.length === 0) return []

  const ordered = [...candidates].sort((a, b) => a.i - b.i)
  const batches: SummaryBatch[] = []
  let current: SummaryCandidate[] = []

  const flush = () => {
    if (current.length === 0) return
    batches.push({
      startIndex: current[0].i,
      endIndex: current[current.length - 1].i,
      items: current,
    })
    current = []
  }

  for (const candidate of ordered) {
    if (current.length === 0) {
      current = [candidate]
      continue
    }

    const last = current[current.length - 1]
    const nextItems = [...current, candidate]
    const wouldExceedAdjacency = candidate.i !== last.i + 1
    const wouldExceedSize = estimateBatchInputLength(nextItems) > BATCH_SUMMARY_MAX_INPUT_CHARS
    const wouldExceedCount = nextItems.length > BATCH_SUMMARY_MAX_MESSAGES

    if (wouldExceedAdjacency || wouldExceedSize || wouldExceedCount) {
      flush()
      current = [candidate]
      continue
    }

    current = nextItems
  }

  flush()
  return batches
}

function buildSummaryMessage(batch: SummaryBatch, summary: string, contextRef?: string): LLMMessage {
  const count = batch.items.length
  const label = count === 1 ? "message" : "messages"
  return {
    role: "assistant",
    content: addContextRefNote(`[Earlier Context Summary: ${count} ${label}]\n${summary.trim()}`, contextRef),
  }
}

function buildBatchSummaryFallback(items: SummaryCandidate[]): string {
  return items
    .map((item) => `${item.role}: ${item.contentForSummary.split("\n")[0].trim().slice(0, 120)}`)
    .join("\n")
    .slice(0, 800)
}

async function summarizeMessageBatch(items: SummaryCandidate[], sessionId?: string): Promise<string> {
  const { providerId } = getProviderAndModel()
  const source = formatBatchSummaryInput(items)
  const fallback = buildBatchSummaryFallback(items)
  const prompt = `Compress these earlier conversation messages into one concise context block.

KEEP:
- decisions, findings, errors, constraints, unresolved questions, next steps
- file paths, tool names, IDs, URLs only when important
- chronological relationships when they matter

DO NOT:
- reproduce raw logs, large payloads, full code blocks, or bulky JSON unless tiny and essential
- reproduce secrets, API keys, tokens, passwords, or full credentials
- waste space narrating every message separately

Target: <=250 tokens.

MESSAGES:
${source}`

  try {
    if (sessionId && agentSessionStateManager.shouldStopSession(sessionId)) {
      return fallback
    }
    const summary = await makeTextCompletionWithFetch(prompt, providerId, sessionId)
    return summary?.trim() || fallback
  } catch {
    return fallback
  }
}

function buildArchiveEligibleIndices(messages: LLMMessage[], systemIdx: number, firstUserIdx: number): number[] {
  const indices: number[] = []
  for (let i = 0; i < messages.length; i++) {
    if (i === systemIdx || i === firstUserIdx) continue
    indices.push(i)
  }
  return indices
}

interface ArchiveFrontierState {
  systemIdx: number
  firstUserIdx: number
  eligibleIndices: number[]
  archivedCount: number
  liveCount: number
  keepLiveCount: number
  overflowCount: number
  hasArchiveState: boolean
}

function getArchiveFrontierState(
  messages: LLMMessage[],
  sessionId: string | undefined,
  lastN: number,
): ArchiveFrontierState | null {
  if (!sessionId) return null

  const systemIdx = messages.findIndex((m) => m.role === "system")
  const firstUserIdx = messages.findIndex((m, idx) => m.role === "user" && idx !== systemIdx)
  const eligibleIndices = buildArchiveEligibleIndices(messages, systemIdx, firstUserIdx)
  const archivedCount = Math.min(archiveFrontierCountBySession.get(sessionId) ?? 0, eligibleIndices.length)
  const liveCount = Math.max(0, eligibleIndices.length - archivedCount)
  const keepLiveCount = Math.max(lastN, ARCHIVE_FRONTIER_KEEP_LIVE_MESSAGES)
  const overflowCount = Math.max(0, liveCount - keepLiveCount)

  return {
    systemIdx,
    firstUserIdx,
    eligibleIndices,
    archivedCount,
    liveCount,
    keepLiveCount,
    overflowCount,
    hasArchiveState: archivedCount > 0 || iterativeSummaryCache.has(sessionId),
  }
}

function shouldAdvanceArchiveFrontier(
  state: ArchiveFrontierState | null,
  messagesLength: number,
  tokens: number,
  targetTokens: number,
): boolean {
  if (!state) return false
  if (state.overflowCount < ARCHIVE_FRONTIER_MIN_ARCHIVE_BATCH) return false

  return messagesLength > ARCHIVE_FRONTIER_TRIGGER_MESSAGE_COUNT
    || tokens > targetTokens
    || tokens > Math.floor(targetTokens * ARCHIVE_FRONTIER_TRIGGER_TOKEN_RATIO)
}

function shouldApplyArchiveFrontier(
  state: ArchiveFrontierState | null,
  messagesLength: number,
  tokens: number,
  targetTokens: number,
): boolean {
  if (!state) return false
  return state.hasArchiveState || shouldAdvanceArchiveFrontier(state, messagesLength, tokens, targetTokens)
}

async function updateIterativeSummaryForDroppedMessages(
  sessionId: string,
  droppedMessages: LLMMessage[],
  onSummarizationProgress?: ShrinkOptions["onSummarizationProgress"],
): Promise<void> {
  if (droppedMessages.length === 0) return

  const previousSummary = iterativeSummaryCache.get(sessionId)
  const droppedText = droppedMessages
    .map(m => {
      const content = sanitizeMessageContentForDisplay(m.content || "")
      return `${m.role}: ${content.substring(0, 300)}`
    })
    .join("\n")

  try {
    if (agentSessionStateManager.shouldStopSession(sessionId)) {
      return
    }

    const updatePrompt = previousSummary
      ? `You are maintaining a running summary of an AI agent session.

PREVIOUS SUMMARY:
${previousSummary}

NEW MESSAGES BEING ARCHIVED OUT OF RAW CONTEXT:
${droppedText.substring(0, 4000)}

Update the summary to incorporate the new information. Preserve all important details from the previous summary. Focus on:
- What tasks were attempted and their outcomes
- Key files, paths, IDs, and values discovered
- Errors encountered and how they were resolved
- Current state and what the agent should do next

Keep the summary under 1000 characters. Be factual and specific.`
      : `Summarize these AI agent conversation messages that are being archived out of raw context:

${droppedText.substring(0, 4000)}

Focus on:
- What tasks were attempted and their outcomes
- Key files, paths, IDs, and values discovered
- Errors encountered and how they were resolved
- Current state and what the agent should do next

Keep the summary under 1000 characters. Be factual and specific.`

    if (onSummarizationProgress) {
      onSummarizationProgress(0, 1, "Updating archived session summary...")
    }

    const iterativeSummary = await makeTextCompletionWithFetch(updatePrompt, getProviderAndModel().providerId, sessionId)
    if (iterativeSummary?.trim()) {
      iterativeSummaryCache.set(sessionId, iterativeSummary.trim())
      if (isDebugLLM()) logLLM("[Context Budget] Updated iterative session summary", { length: iterativeSummary.length })
    }
  } catch (e) {
    if (isDebugLLM()) logLLM("[Context Budget] Iterative summary generation failed, continuing", { error: String(e) })
  }
}

function buildSessionProgressSummaryMessage(sessionId: string): LLMMessage | null {
  const iterSummary = iterativeSummaryCache.get(sessionId)
  if (!iterSummary) return null

  const archiveRef = archiveHistoryRefBySession.get(sessionId)
  return {
    role: "assistant",
    content: addContextRefNote(`[Session Progress Summary]\n${iterSummary}`, archiveRef),
  }
}

/**
 * Build a context summary from stored session summaries
 * This allows the LLM to know what work was accomplished even if messages were dropped
 */
function buildContextFromSummaries(sessionId: string): string | null {
  const MAX_ACTION_SUMMARY_LENGTH = 150
  const MAX_TOTAL_SUMMARY_LENGTH = 2000

  const summaries = summarizationService.getSummaries(sessionId)
  if (summaries.length === 0) return null

  // Get important summaries
  const important = summarizationService.getImportantSummaries(sessionId)
  const toInclude = important.length > 0 ? important : summaries.slice(-5)

  if (toInclude.length === 0) return null

  const lines = toInclude.map(s => {
    const status = s.importance === "critical" ? "⚠️" : "✓"
    // Truncate actionSummary if it exceeds max length
    const truncatedSummary =
      s.actionSummary.length > MAX_ACTION_SUMMARY_LENGTH
        ? s.actionSummary.slice(0, MAX_ACTION_SUMMARY_LENGTH - 3) + "..."
        : s.actionSummary
    return `${status} Step ${s.stepNumber}: ${truncatedSummary}`
  })

  const result = `[Session Progress Summary]\n${lines.join("\n")}`

  // Truncate total summary if it exceeds max length
  if (result.length > MAX_TOTAL_SUMMARY_LENGTH) {
    return result.slice(0, MAX_TOTAL_SUMMARY_LENGTH - 3) + "..."
  }

  return result
}

/**
 * Parse tool name from llm.ts mapped tool-result content:
 * [toolName] content... or [toolName] ERROR: content...
 */
function parseToolNameFromContent(content: string): { toolName: string; resultContent: string } {
  const parsed = parseMappedToolResultContent(content)
  if (parsed) return parsed
  return { toolName: 'unknown', resultContent: content }
}

/**
 * Summarize tool messages that would be dropped during context shrinking.
 * Creates semantic summaries preserving tool names and what was learned.
 * Format: [toolName] brief description of outcome/data
 * @param toolMessages Array of tool messages that would be dropped
 * @returns A summary string under 800 chars
 */
function summarizeToolMessagesForDropping(toolMessages: LLMMessage[]): string {
  if (toolMessages.length === 0) return ""

  const summaries: string[] = []
  let totalLength = 0
  const MAX_SUMMARY_LENGTH = 800

  for (const msg of toolMessages) {
    const content = msg.content || ""
    const { toolName, resultContent } = parseToolNameFromContent(content)

    // Detect error status from content
    const isError = content.toLowerCase().includes("[error]") ||
                    content.toLowerCase().includes("] error:") ||
                    resultContent.toLowerCase().startsWith("error")

    // Extract semantic brief - focus on what was learned/returned
    let brief: string
    const firstLine = resultContent.split("\n")[0].trim()

    if (isError) {
      // For errors, extract the error type/message
      brief = `FAILED: ${firstLine.substring(0, 60)}`
    } else if (resultContent.length === 0 || resultContent === "[No output]") {
      brief = "completed (no output)"
    } else {
      // Extract meaningful brief - first 80 chars of first line
      brief = firstLine.length > 80 ? firstLine.substring(0, 77) + "..." : firstLine
    }

    const entry = `[${toolName}] ${brief}`

    // Check if adding this would exceed limit
    if (totalLength + entry.length + 2 > MAX_SUMMARY_LENGTH) {
      summaries.push(`... and ${toolMessages.length - summaries.length} more tool results`)
      break
    }

    summaries.push(entry)
    totalLength += entry.length + 2 // +2 for newline
  }

  return `Previously executed tools:\n${summaries.join("\n")}`
}

export interface ShrinkOptions {
  messages: LLMMessage[]
  availableTools?: Array<{ name: string; description?: string; inputSchema?: any }>
  relevantTools?: Array<{ name: string; description?: string; inputSchema?: any }>
  /** Optional compact skill index (IDs) so Tier-3 minimal prompts don't drop skills entirely. */
  skillsIndex?: string
  isAgentMode?: boolean
  targetRatio?: number // default 0.4
  lastNMessages?: number // default 3
  summarizeCharThreshold?: number // default 2000
  sessionId?: string // optional session ID for abort control and progress injection
  onSummarizationProgress?: (current: number, total: number, message: string) => void // callback for progress updates
  /** Actual input tokens from last API response (overrides chars/4 estimate when available) */
  actualInputTokens?: number
}

export interface ShrinkResult {
  messages: LLMMessage[]
  appliedStrategies: string[]
  estTokensBefore: number
  estTokensAfter: number
  maxTokens: number
  toolResultsSummarized?: boolean
}

export async function shrinkMessagesForLLM(opts: ShrinkOptions): Promise<ShrinkResult> {
  const config = configStore.get()
  const applied: string[] = []

  const enabled = config.mcpContextReductionEnabled ?? true
  // CHANGED: Default target ratio lowered from 0.7 to 0.4
  // Research shows LLM quality degrades significantly past 30-50% of context window
  // for complex agentic tasks (tool calling + multi-step reasoning).
  // See: "Maximum Effective Context Window" (Paulsen 2026), "Context Length Alone Hurts" (Du et al. 2025)
  const targetRatio = opts.targetRatio ?? (config.mcpContextTargetRatio ?? 0.4)
  const lastN = opts.lastNMessages ?? (config.mcpContextLastNMessages ?? 3)
  const summarizeThreshold = opts.summarizeCharThreshold ?? (config.mcpContextSummarizeCharThreshold ?? 2000)

  const { providerId, model } = getProviderAndModel()
  if (!enabled) {
    const est = estimateTokensFromMessages(opts.messages)
    const maxTokens = await getMaxContextTokens(providerId, model)
    return { messages: opts.messages, appliedStrategies: [], estTokensBefore: est, estTokensAfter: est, maxTokens }
  }
  const maxTokens = await getMaxContextTokens(providerId, model)
  const targetTokens = Math.floor(maxTokens * targetRatio)

  let messages = [...opts.messages]
  const estimatedTokensBefore = estimateTokensFromMessages(messages)

  // Use actual API-reported token count when available (more accurate than chars/4)
  const actualTokens = opts.actualInputTokens ?? getActualInputTokens(opts.sessionId)
  const scaleTokensWithActual = (estimatedTokens: number): number => {
    if (actualTokens === undefined || actualTokens <= 0) return estimatedTokens
    if (estimatedTokensBefore <= 0) return Math.max(estimatedTokens, actualTokens)

    const scaledActualTokens = Math.floor(actualTokens * (estimatedTokens / estimatedTokensBefore))
    return Math.max(estimatedTokens, scaledActualTokens)
  }

  let tokens = scaleTokensWithActual(estimatedTokensBefore)
  const estTokensBefore = tokens

  if (actualTokens !== undefined && actualTokens > 0) {
    // Use the higher of estimate vs actual to be conservative
    if (isDebugLLM()) {
      logLLM("ContextBudget: using actual token count", { estimated: estimatedTokensBefore, actual: actualTokens, used: tokens })
    }
  }

  if (isDebugLLM()) {
    logLLM("ContextBudget: initial", { providerId, model, maxTokens, targetTokens, estTokens: tokens, count: messages.length, totalChars: messages.reduce((s, m) => s + (m.content?.length || 0), 0) })
  }

  // ========================================================================
  // Tier 0a: MICROCOMPACTION (always-on, no LLM needed)
  // Like Claude Code: replace old tool results with a brief marker.
  // Keep only the last MICROCOMPACT_KEEP_RECENT tool/assistant messages intact.
  // This runs ALWAYS, regardless of budget, to prevent context bloat.
  // ========================================================================
  const MICROCOMPACT_KEEP_RECENT = 5 // keep last 5 tool results verbatim
  const MICROCOMPACT_MIN_CHARS = 500 // only compact messages longer than this
  const MICROCOMPACT_CLEARED_MARKER = "[Tool result cleared for context management]"

  // Find all tool-role messages and large assistant messages with tool-like content
  const toolMessageIndices: number[] = []
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role === "system") continue
    if (msg.role === "tool" && msg.content && msg.content.length > MICROCOMPACT_MIN_CHARS) {
      toolMessageIndices.push(i)
    }
  }

  // Clear old tool results, keeping only the most recent ones
  if (toolMessageIndices.length > MICROCOMPACT_KEEP_RECENT) {
    const toClear = toolMessageIndices.slice(0, toolMessageIndices.length - MICROCOMPACT_KEEP_RECENT)
    for (const idx of toClear) {
      const original = messages[idx]
      // Extract tool name if present for a more informative marker
      const { toolName } = parseToolNameFromContent(original.content || "")
      messages[idx] = {
        ...original,
        content: toolName !== "unknown"
          ? `[${toolName}] ${MICROCOMPACT_CLEARED_MARKER}`
          : MICROCOMPACT_CLEARED_MARKER,
      }
    }
    applied.push("microcompact")
    tokens = scaleTokensWithActual(estimateTokensFromMessages(messages))
  }

  // Tier 0b: Truncate large payload-like messages before any LLM summarization.
  // We run this BEFORE the targetTokens early return so context never inflates needlessly.
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role === "system" || !msg.content) continue

    const isPayloadLike = isLikelyPayloadLikeMessage(msg)

    // NOTE: tool messages are mapped to 'user' role by llm.ts with a '[toolName] ' prefix.
    const isToolResultLike = msg.role === "tool" || (msg.role === "user" && hasMappedToolResultPrefix(msg.content))

    const shouldTruncateToolResult = isToolResultLike && msg.content.length > TOOL_RESULT_TRUNCATE_THRESHOLD
    const shouldAggressivelyTruncatePayload = isPayloadLike && msg.content.length > AGGRESSIVE_TRUNCATE_THRESHOLD

    if (!shouldTruncateToolResult && !shouldAggressivelyTruncatePayload) continue

    const marker = isToolResultLike ? TOOL_TRUNCATE_MARKER : PAYLOAD_TRUNCATE_MARKER
    const keepChars = isToolResultLike ? TOOL_RESULT_KEEP_CHARS : AGGRESSIVE_TRUNCATE_KEEP_CHARS
    const { toolName } = parseToolNameFromContent(msg.content)
    const contextRef = registerContextRef(opts.sessionId, {
      kind: isToolResultLike ? "truncated_tool" : "truncated_payload",
      role: msg.role,
      content: msg.content,
      toolName: toolName !== "unknown" ? toolName : undefined,
    })
    const truncatedContent = addContextRefNote(
      truncateWithMarker(msg.content, keepChars, marker),
      contextRef,
    )

    if (truncatedContent !== msg.content) {
      messages[i] = {
        ...msg,
        content: truncatedContent,
      }
      if (!applied.includes("aggressive_truncate")) {
        applied.push("aggressive_truncate")
      }
    }
  }

  tokens = scaleTokensWithActual(estimateTokensFromMessages(messages))

  if (tokens <= targetTokens && !shouldApplyArchiveFrontier(getArchiveFrontierState(messages, opts.sessionId, lastN), messages.length, tokens, targetTokens)) {
    if (isDebugLLM()) logLLM("ContextBudget: after microcompact and aggressive_truncate", { estTokens: tokens, count: messages.length })
    return { messages, appliedStrategies: applied, estTokensBefore, estTokensAfter: tokens, maxTokens }
  }

  // Tier 0c: Archive older raw history behind a rolling summary frontier.
  // This keeps a bounded live tail even when token count is technically under target.
  const sessionId = opts.sessionId
  const archiveFrontierState = getArchiveFrontierState(messages, sessionId, lastN)
  if (sessionId && shouldApplyArchiveFrontier(archiveFrontierState, messages.length, tokens, targetTokens)) {
    const systemIdx = archiveFrontierState!.systemIdx
    const firstUserIdx = archiveFrontierState!.firstUserIdx
    const eligibleIndices = archiveFrontierState!.eligibleIndices
    const previousArchivedCount = archiveFrontierState!.archivedCount
    const unarchivedIndices = eligibleIndices.slice(previousArchivedCount)
    const overflowCount = archiveFrontierState!.overflowCount

    let nextArchivedCount = previousArchivedCount
    let newlyArchivedMessages: LLMMessage[] = []

    if (shouldAdvanceArchiveFrontier(archiveFrontierState, messages.length, tokens, targetTokens)) {
      const archiveIndices = unarchivedIndices.slice(0, overflowCount)
      newlyArchivedMessages = archiveIndices.map((index) => messages[index])

      if (newlyArchivedMessages.length > 0) {
        await updateIterativeSummaryForDroppedMessages(sessionId, newlyArchivedMessages, opts.onSummarizationProgress)
        upsertArchiveHistoryRef(sessionId, newlyArchivedMessages)
        nextArchivedCount = Math.min(eligibleIndices.length, previousArchivedCount + newlyArchivedMessages.length)
        archiveFrontierCountBySession.set(sessionId, nextArchivedCount)
      }
    }

    if (nextArchivedCount > 0 || iterativeSummaryCache.has(sessionId)) {
      const ordered: LLMMessage[] = []
      if (systemIdx >= 0) ordered.push(messages[systemIdx])
      if (firstUserIdx >= 0 && firstUserIdx !== systemIdx) ordered.push(messages[firstUserIdx])

      const summaryMessage = buildSessionProgressSummaryMessage(sessionId)
      if (summaryMessage) ordered.push(summaryMessage)

      const progressSummary = buildContextFromSummaries(sessionId)
      if (progressSummary) {
        ordered.push({ role: "assistant", content: progressSummary })
      }

      for (const index of eligibleIndices.slice(nextArchivedCount)) {
        ordered.push(messages[index])
      }

      messages = ordered
      if (!applied.includes("archive_frontier")) applied.push("archive_frontier")
      tokens = scaleTokensWithActual(estimateTokensFromMessages(messages))
    }
  }

  if (tokens <= targetTokens) {
    if (isDebugLLM()) logLLM("ContextBudget: after archive_frontier", { estTokens: tokens, kept: messages.length })
    return { messages, appliedStrategies: applied, estTokensBefore, estTokensAfter: tokens, maxTokens }
  }

  // Tier 1: Batch-summarize oversized conversational messages.
  // Tool/payload blobs are truncated above and protected from LLM summarization here.
  const firstTierOneProtectedUserIdx = messages.findIndex((m) => m.role === "user")
  const recentTierOneProtectedIndices = new Set<number>()
  const truncationProtectedIndices = collectTruncationProtectedIndices(messages)
  for (let k = messages.length - lastN; k < messages.length; k++) {
    if (k >= 0) recentTierOneProtectedIndices.add(k)
  }

  const summaryCandidates = messages
    .map((m, i) => {
      const originalContent = m.content || ""
      const budgetContent = sanitizeMessageContentForDisplay(originalContent)
      return {
        i,
        len: budgetContent.length,
        role: m.role,
        contentForSummary: budgetContent,
      }
    })
    .filter((x) => x.len > summarizeThreshold && x.role !== "system")
    .filter((x) => x.role !== "tool")
    .filter((x) => !truncationProtectedIndices.has(x.i))
    .filter((x) => x.i !== firstTierOneProtectedUserIdx)
    .filter((x) => !recentTierOneProtectedIndices.has(x.i))

  const summaryBatches = buildSummaryBatches(summaryCandidates)
  const originalMessagesForBatchRefs = [...messages]
  const totalToSummarize = summaryBatches.length
  let summarizedCount = 0
  let indexOffset = 0

  for (const batch of summaryBatches) {
    // Check if session should stop before summarizing
    if (opts.sessionId && agentSessionStateManager.shouldStopSession(opts.sessionId)) {
      break
    }

    // Emit progress update before summarization
    summarizedCount++
    if (opts.onSummarizationProgress) {
      const messagePreview = batch.items
        .map((item) => item.contentForSummary.substring(0, 40).replace(/\n/g, " "))
        .join(" | ")
      opts.onSummarizationProgress(
        summarizedCount,
        totalToSummarize,
        `Summarizing context batch ${summarizedCount}/${totalToSummarize} (${batch.items.length} messages): ${messagePreview}...`
      )
    }

    const summarized = await summarizeMessageBatch(batch.items, opts.sessionId)
    const contextRef = registerContextRef(opts.sessionId, {
      kind: "batch_summary",
      role: "assistant",
      content: formatBatchSourceMessages(batch.items, originalMessagesForBatchRefs),
      messageCount: batch.items.length,
    })
    const startIndex = batch.startIndex + indexOffset
    const deleteCount = batch.endIndex - batch.startIndex + 1
    messages.splice(startIndex, deleteCount, buildSummaryMessage(batch, summarized, contextRef))
    indexOffset -= deleteCount - 1

    applied.push("batch_summarize")
    tokens = scaleTokensWithActual(estimateTokensFromMessages(messages))
    if (tokens <= targetTokens) break
  }

  if (tokens <= targetTokens) {
    if (isDebugLLM()) logLLM("ContextBudget: after batch_summarize", { estTokens: tokens })
    return { messages, appliedStrategies: applied, estTokensBefore, estTokensAfter: tokens, maxTokens }
  }

  // Tier 2: Remove middle messages (keep system, first user, last N)
  // If still over budget, reduce lastN to be more aggressive
  const effectiveLastN = tokens > targetTokens * 1.5 ? Math.max(1, Math.floor(lastN / 2)) : lastN

  const systemIdx = messages.findIndex((m) => m.role === "system")
  const firstUserIdx = messages.findIndex((m, idx) => m.role === "user" && idx !== systemIdx)

  const keptSet = new Set<number>()
  if (systemIdx >= 0) keptSet.add(systemIdx)
  if (firstUserIdx >= 0) keptSet.add(firstUserIdx)
  // Add indices for last N
  const baseLen = messages.length
  for (let k = baseLen - effectiveLastN; k < baseLen; k++) {
    if (k >= 0) keptSet.add(k)
  }

  // Collect messages that would be dropped for iterative summary
  const droppedMessages: LLMMessage[] = []
  const toolMessagesToBeDropped: LLMMessage[] = []
  for (let i = 0; i < messages.length; i++) {
    if (!keptSet.has(i)) {
      droppedMessages.push(messages[i])
      if (messages[i].role === "tool") {
        toolMessagesToBeDropped.push(messages[i])
      }
    }
  }

  // Summarize tool messages before dropping them
  let toolResultsSummarized = false
  let toolSummaryMessage: LLMMessage | null = null
  if (toolMessagesToBeDropped.length > 0) {
    const summary = summarizeToolMessagesForDropping(toolMessagesToBeDropped)
    if (summary) {
      toolSummaryMessage = { role: "assistant", content: summary }
      toolResultsSummarized = true
      logLLM(`[Context Budget] Summarized ${toolMessagesToBeDropped.length} tool results before drop_middle`)
    }
  }

  if (opts.sessionId && droppedMessages.length > 0) {
    await updateIterativeSummaryForDroppedMessages(opts.sessionId, droppedMessages, opts.onSummarizationProgress)
    upsertArchiveHistoryRef(opts.sessionId, droppedMessages)
  }

  // Preserve order: system -> first user -> iterative summary -> tool summary -> (chronological tail)
  const ordered: LLMMessage[] = []
  if (systemIdx >= 0) ordered.push(messages[systemIdx])
  if (firstUserIdx >= 0 && firstUserIdx !== systemIdx) ordered.push(messages[firstUserIdx])

  if (opts.sessionId) {
    const summaryMessage = buildSessionProgressSummaryMessage(opts.sessionId)
    if (summaryMessage) {
      ordered.push(summaryMessage)
    }
  }

  // Also inject dual-model summaries if available (backwards compatible)
  if (toolResultsSummarized && opts.sessionId) {
    const progressSummary = buildContextFromSummaries(opts.sessionId)
    if (progressSummary) {
      ordered.push({ role: "assistant", content: progressSummary })
    }
  }

  // Insert tool summary
  if (toolSummaryMessage) ordered.push(toolSummaryMessage)

  for (let k = baseLen - effectiveLastN; k < baseLen; k++) {
    if (k >= 0 && k !== systemIdx && k !== firstUserIdx) ordered.push(messages[k])
  }

  messages = ordered
  applied.push("drop_middle")
  tokens = scaleTokensWithActual(estimateTokensFromMessages(messages))

  if (tokens <= targetTokens) {
    if (isDebugLLM()) logLLM("ContextBudget: after drop_middle", { estTokens: tokens, kept: messages.length })
    return { messages, appliedStrategies: applied, estTokensBefore, estTokensAfter: tokens, maxTokens, toolResultsSummarized }
  }

  // Tier 3: Minimal system prompt
  const systemMsgIdx = messages.findIndex((m) => m.role === "system")
  const minimal = constructMinimalSystemPrompt(
    opts.availableTools || [],
    !!opts.isAgentMode,
    opts.relevantTools,
    opts.skillsIndex,
  )
  if (systemMsgIdx >= 0) {
    messages[systemMsgIdx] = { role: "system", content: minimal }
  } else {
    messages.unshift({ role: "system", content: minimal })
  }
  applied.push("minimal_system_prompt")
  tokens = scaleTokensWithActual(estimateTokensFromMessages(messages))

  if (isDebugLLM()) logLLM("ContextBudget: after minimal_system_prompt", { estTokens: tokens })

  return { messages, appliedStrategies: applied, estTokensBefore, estTokensAfter: tokens, maxTokens, toolResultsSummarized }
}
