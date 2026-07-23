/**
 * AI SDK Provider Adapter
 * Provides a unified interface for creating language models using Vercel AI SDK
 * with support for OpenAI, OpenAI-compatible endpoints, Groq, and Google.
 */

import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { LanguageModel } from "ai"
import { configStore } from "./config"
import { isDebugLLM, logLLM } from "./debug"
import type { OPENAI_COMPATIBLE_PROMPT_CACHING } from "@dotagents/shared"

export type ProviderType = "openai" | "groq" | "gemini" | "chatgpt-web"

const DEFAULT_CHAT_MODELS = {
  openai: {
    mcp: "gpt-4.1-mini",
    transcript: "gpt-4.1-mini",
  },
  groq: {
    mcp: "openai/gpt-oss-120b",
    transcript: "openai/gpt-oss-120b",
  },
  gemini: {
    mcp: "gemini-2.5-flash",
    transcript: "gemini-2.5-flash",
  },
  "chatgpt-web": {
    mcp: "gpt-5.6",
    transcript: "gpt-5.6",
  },
} as const

const TRANSCRIPTION_ONLY_MODEL_PATTERNS = {
  openai: ["gpt-4o-transcribe", "gpt-4o-mini-transcribe", "whisper-1"],
  groq: ["whisper-large-v3", "whisper-large-v3-turbo", "distil-whisper-large-v3-en"],
} as const

/**
 * Model families that only exist inside the ChatGPT-Web transport. Routing these
 * through the direct OpenAI REST endpoint always fails and burns retry budget.
 * See issue #310.
 */
const CHATGPT_WEB_ONLY_MODEL_PATTERNS = [
  "codex-spark",
  "-codex",
] as const

interface ProviderConfig {
  apiKey: string
  baseURL?: string
  model: string
}

export interface PromptCachingConfig {
  strategy: string
  enabled: boolean
  capability: "implicit-prefix" | "disabled"
  baseUrlClass: "provider-default" | "official-openai" | "vercel-ai-gateway" | "known-openrouter" | "custom-compatible"
  reason?: string
  providerOptions?: Record<string, unknown>
  headers?: Record<string, string>
}

export interface PromptCachingRequestContext {
  /** Stable DotAgents conversation/session identity, never logged or sent as a prompt. */
  conversationId?: string
}

function normalizeProviderType(providerId: string): ProviderType {
  const normalized = providerId.trim().toLowerCase()
  if (normalized === "openai" || normalized === "groq" || normalized === "gemini" || normalized === "chatgpt-web") {
    return normalized
  }
  throw new Error(`Unknown provider: ${providerId}`)
}

function isTranscriptionOnlyModel(providerId: ProviderType, model: string): boolean {
  const patterns = TRANSCRIPTION_ONLY_MODEL_PATTERNS[providerId as keyof typeof TRANSCRIPTION_ONLY_MODEL_PATTERNS]
  if (!patterns) {
    return false
  }

  const normalizedModel = model.trim().toLowerCase()
  return patterns.some(pattern => normalizedModel.includes(pattern))
}

function isChatGptWebOnlyModel(model: string): boolean {
  const normalized = model.trim().toLowerCase()
  return CHATGPT_WEB_ONLY_MODEL_PATTERNS.some(pattern => normalized.includes(pattern))
}

function sanitizeChatModelSelection(
  providerId: ProviderType,
  model: string,
  modelContext: "mcp" | "transcript",
): string {
  if (isTranscriptionOnlyModel(providerId, model)) {
    const fallbackModel = DEFAULT_CHAT_MODELS[providerId][modelContext]

    if (isDebugLLM()) {
      logLLM("Replacing STT-only model configured for chat/text usage", {
        providerId,
        modelContext,
        invalidModel: model,
        fallbackModel,
      })
    }

    return fallbackModel
  }

  // A ChatGPT-Web-only model cannot be served by any non-chatgpt-web transport.
  // Fall back to the provider's default chat model so we never emit a guaranteed
  // failing HTTP call through the AI SDK (see issue #310).
  if (providerId !== "chatgpt-web" && isChatGptWebOnlyModel(model)) {
    const fallbackModel = DEFAULT_CHAT_MODELS[providerId][modelContext]

    if (isDebugLLM()) {
      logLLM("Replacing ChatGPT-Web-only model configured for non-chatgpt-web provider", {
        providerId,
        modelContext,
        invalidModel: model,
        fallbackModel,
      })
    }

    return fallbackModel
  }

  return model
}

/**
 * Get provider configuration from app config
 */
function getProviderConfig(
  providerId: ProviderType,
  modelContext: "mcp" | "transcript" = "mcp"
): ProviderConfig {
  const config = configStore.get()
  const normalizedProviderId = normalizeProviderType(providerId)

  switch (normalizedProviderId) {
    case "openai":
      return {
        apiKey: config.openaiApiKey || "",
        baseURL: config.openaiBaseUrl || undefined,
        model: sanitizeChatModelSelection(
          "openai",
          modelContext === "mcp"
            ? config.agentOpenaiModel || config.mcpToolsOpenaiModel || DEFAULT_CHAT_MODELS.openai.mcp
            : config.transcriptPostProcessingOpenaiModel || DEFAULT_CHAT_MODELS.openai.transcript,
          modelContext,
        ),
      }

    case "groq":
      return {
        apiKey: config.groqApiKey || "",
        baseURL: config.groqBaseUrl || "https://api.groq.com/openai/v1",
        model: sanitizeChatModelSelection(
          "groq",
          modelContext === "mcp"
            ? config.agentGroqModel || config.mcpToolsGroqModel || DEFAULT_CHAT_MODELS.groq.mcp
            : config.transcriptPostProcessingGroqModel || DEFAULT_CHAT_MODELS.groq.transcript,
          modelContext,
        ),
      }

    case "gemini":
      return {
        apiKey: config.geminiApiKey || "",
        baseURL: config.geminiBaseUrl || undefined,
        model:
          modelContext === "mcp"
            ? config.agentGeminiModel || config.mcpToolsGeminiModel || DEFAULT_CHAT_MODELS.gemini.mcp
            : config.transcriptPostProcessingGeminiModel || DEFAULT_CHAT_MODELS.gemini.transcript,
      }

    case "chatgpt-web":
      return {
        apiKey: config.chatgptWebAccessToken || config.chatgptWebSessionToken || "",
        baseURL: config.chatgptWebBaseUrl || "https://chatgpt.com",
        model:
          modelContext === "mcp"
            ? config.agentChatgptWebModel || config.mcpToolsChatgptWebModel || DEFAULT_CHAT_MODELS["chatgpt-web"].mcp
            : config.transcriptPostProcessingChatgptWebModel || DEFAULT_CHAT_MODELS["chatgpt-web"].transcript,
      }

    default:
      throw new Error(`Unknown provider: ${providerId}`)
  }
}

/**
 * Create a language model instance for the specified provider
 */
export function createLanguageModel(
  providerId?: ProviderType,
  modelContext: "mcp" | "transcript" = "mcp"
): LanguageModel {
  const config = configStore.get()
  const effectiveProviderId = normalizeProviderType(
    providerId || (config.agentProviderId as ProviderType) || (config.mcpToolsProviderId as ProviderType) || "openai",
  )

  const providerConfig = getProviderConfig(effectiveProviderId, modelContext)

  if (!providerConfig.apiKey) {
    throw new Error(`API key is required for ${effectiveProviderId}`)
  }

  if (isDebugLLM()) {
    logLLM(`Creating ${effectiveProviderId} model:`, {
      model: providerConfig.model,
      baseURL: providerConfig.baseURL,
    })
  }

  switch (effectiveProviderId) {
    case "openai":
    case "groq": {
      // Both OpenAI and Groq use OpenAI-compatible API
      // Use .chat() to use the Chat Completions API instead of the Responses API
      // This is required for compatibility with Claude/Anthropic proxies and other
      // OpenAI-compatible endpoints that don't support the Responses API
      const openai = createOpenAI({
        apiKey: providerConfig.apiKey,
        baseURL: providerConfig.baseURL,
      })
      return openai.chat(providerConfig.model)
    }

    case "gemini": {
      const google = createGoogleGenerativeAI({
        apiKey: providerConfig.apiKey,
        baseURL: providerConfig.baseURL,
      })
      return google(providerConfig.model)
    }

    case "chatgpt-web":
      throw new Error("chatgpt-web provider uses a custom fetch transport, not AI SDK createLanguageModel")

    default:
      throw new Error(`Unknown provider: ${effectiveProviderId}`)
  }
}

/**
 * Get the current agent provider ID from config.
 */
export function getCurrentProviderId(): ProviderType {
  const config = configStore.get()
  return normalizeProviderType((config.agentProviderId as ProviderType) || (config.mcpToolsProviderId as ProviderType) || "openai")
}

/**
 * Get the transcript post-processing provider ID from config
 */
export function getTranscriptProviderId(): ProviderType {
  const config = configStore.get()
  return normalizeProviderType((config.transcriptPostProcessingProviderId as ProviderType) || "openai")
}

/**
 * Get the current model name for the provider
 */
export function getCurrentModelName(
  providerId?: ProviderType,
  modelContext: "mcp" | "transcript" = "mcp"
): string {
  const config = configStore.get()
  const effectiveProviderId = normalizeProviderType(
    providerId || (config.agentProviderId as ProviderType) || (config.mcpToolsProviderId as ProviderType) || "openai",
  )

  return getProviderConfig(effectiveProviderId, modelContext).model
}

function classifyBaseUrl(baseURL: string): PromptCachingConfig["baseUrlClass"] {
  if (!baseURL) return "provider-default"
  try {
    const hostname = new URL(baseURL).hostname.toLowerCase()
    if (hostname === "api.openai.com") return "official-openai"
    if (hostname === "ai-gateway.vercel.sh") return "vercel-ai-gateway"
    if (hostname === "openrouter.ai" || hostname.endsWith(".openrouter.ai")) return "known-openrouter"
  } catch {
    // Treat malformed/custom values as an unknown compatible endpoint.
  }
  return "custom-compatible"
}

export function getPromptCachingConfig(
  providerId?: ProviderType,
  modelContext: "mcp" | "transcript" = "mcp",
  requestContext: PromptCachingRequestContext = {},
): PromptCachingConfig | undefined {
  const config = configStore.get()
  const effectiveProviderId = normalizeProviderType(
    providerId || (config.agentProviderId as ProviderType) || (config.mcpToolsProviderId as ProviderType) || "openai",
  )
  const providerConfig = getProviderConfig(effectiveProviderId, modelContext)
  const normalizedBaseURL = (providerConfig.baseURL || "").trim().toLowerCase()
  const baseUrlClass = classifyBaseUrl(normalizedBaseURL)
  const configuredCapability = config.openaiCompatiblePromptCaching as OPENAI_COMPATIBLE_PROMPT_CACHING | undefined
  const promptCacheKey = requestContext.conversationId?.trim() || undefined
  const isCustomOpenAIEndpoint = effectiveProviderId === "openai" &&
    (baseUrlClass === "custom-compatible" || baseUrlClass === "known-openrouter")

  if (effectiveProviderId === "chatgpt-web") {
    return {
      strategy: "disabled-chatgpt-web-transport",
      enabled: false,
      capability: "disabled",
      baseUrlClass,
      reason: "chatgpt-web uses a separate transport whose cache contract is not exposed here",
    }
  }

  // Vercel AI Gateway handles caching automatically for all providers.
  if (baseUrlClass === "vercel-ai-gateway") {
    return {
      strategy: "gateway-auto",
      enabled: true,
      capability: "implicit-prefix",
      baseUrlClass,
      providerOptions: {
        gateway: {
          caching: "auto",
        },
      },
    }
  }

  // Direct OpenAI — automatic prefix caching, no API changes needed (≥1,024 tokens)
  if (effectiveProviderId === "openai" && (baseUrlClass === "provider-default" || baseUrlClass === "official-openai")) {
    return {
      strategy: "openai-implicit-prefix",
      enabled: true,
      capability: "implicit-prefix",
      baseUrlClass,
      ...(promptCacheKey ? { providerOptions: { openai: { promptCacheKey } } } : {}),
    }
  }

  // Gemini — automatic caching for prompts ≥32,768 tokens
  if (effectiveProviderId === "gemini") {
    return {
      strategy: "gemini-stable-prefix",
      enabled: true,
      capability: "implicit-prefix",
      baseUrlClass,
    }
  }

  if (isCustomOpenAIEndpoint && (configuredCapability === "openai" || configuredCapability === "cliproxy")) {
    return {
      strategy: configuredCapability === "cliproxy" ? "cliproxy-openai-prefix" : "openai-compatible-prefix",
      enabled: true,
      capability: "implicit-prefix",
      baseUrlClass,
      reason: "enabled by explicit endpoint capability configuration",
      ...(promptCacheKey
        ? {
            providerOptions: { openai: { promptCacheKey } },
            ...(configuredCapability === "cliproxy" ? { headers: { session_id: promptCacheKey } } : {}),
          }
        : {}),
    }
  }

  return {
    strategy: configuredCapability === "unsupported"
      ? "disabled-unsupported-compatible-endpoint"
      : "disabled-unknown-compatible-endpoint",
    enabled: false,
    capability: "disabled",
    baseUrlClass,
    reason: configuredCapability === "unsupported"
      ? "endpoint is explicitly declared not to provide reliable prompt-cache telemetry"
      : "custom OpenAI-compatible endpoint has no explicit prompt-cache capability declaration",
  }
}

/**
 * Model families that benefit from an explicit `reasoning.effort` when driven
 * via the OpenAI Chat Completions API. GPT-5.x reasoning models default to
 * `none`, which causes them to answer too quickly on agentic tasks (issue #297).
 * Newer series like GPT-5.4 also benefit from being run with an explicit effort
 * so they spend time gathering context before responding.
 */
const OPENAI_REASONING_MODEL_PATTERNS = [
  "gpt-5",
  "o1",
  "o3",
  "o4",
] as const

function isOpenAiReasoningModel(model: string): boolean {
  const normalized = model.trim().toLowerCase()
  return OPENAI_REASONING_MODEL_PATTERNS.some(pattern => normalized.startsWith(pattern))
}

export type OpenAiReasoningEffort = "none" | "minimal" | "low" | "medium" | "high" | "xhigh"

/**
 * Compute provider options contributed by the reasoning-effort setting for
 * OpenAI (or OpenAI-compatible) reasoning-capable chat models. Returns
 * `undefined` when no reasoning override applies so the caller can skip merging.
 * See issue #297.
 */
export function getReasoningEffortProviderOptions(
  providerId?: ProviderType,
  modelContext: "mcp" | "transcript" = "mcp",
): Record<string, any> | undefined {
  const config = configStore.get()
  const effectiveProviderId = normalizeProviderType(
    providerId || (config.agentProviderId as ProviderType) || (config.mcpToolsProviderId as ProviderType) || "openai",
  )

  // Only OpenAI-compatible Chat Completions path supports this option.
  // Gemini/chatgpt-web use different transports.
  if (effectiveProviderId !== "openai" && effectiveProviderId !== "groq") {
    return undefined
  }

  const providerConfig = getProviderConfig(effectiveProviderId, modelContext)
  if (!isOpenAiReasoningModel(providerConfig.model)) {
    return undefined
  }

  // User override wins — including the sentinel "none" which keeps the
  // provider default and is a no-op for us (return undefined).
  const override = (config as any).openaiReasoningEffort as OpenAiReasoningEffort | undefined
  if (override === "none") {
    return undefined
  }
  const effort: OpenAiReasoningEffort = override || "medium"

  if (isDebugLLM()) {
    logLLM("Applying OpenAI reasoning effort override", {
      providerId: effectiveProviderId,
      modelContext,
      model: providerConfig.model,
      effort,
      source: override ? "user-config" : "default",
    })
  }

  return {
    openai: {
      reasoningEffort: effort,
    },
  }
}

/**
 * Merge multiple provider-option records, giving later entries precedence on
 * conflicts within the same provider namespace. Helper used by llm-fetch so
 * that prompt caching and reasoning effort can coexist in a single
 * `providerOptions` payload (issue #297).
 */
export function mergeProviderOptions(
  ...sources: Array<Record<string, any> | undefined>
): Record<string, any> | undefined {
  const merged: Record<string, any> = {}
  let hasAny = false
  for (const source of sources) {
    if (!source) continue
    for (const [provider, options] of Object.entries(source)) {
      merged[provider] = { ...(merged[provider] || {}), ...(options || {}) }
      hasAny = true
    }
  }
  return hasAny ? merged : undefined
}
