/**
 * AI SDK Provider Adapter
 * Provides a unified interface for creating language models using Vercel AI SDK
 * with support for OpenAI, OpenAI-compatible endpoints, Groq, and Google.
 */

import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { LanguageModel } from "ai"
import {
  DEFAULT_CHAT_MODELS,
  normalizeChatProviderId,
  resolveChatModelForTextUsage,
  resolvePromptCachingConfig,
  type CHAT_PROVIDER_ID,
  type ChatModelContext,
  type PromptCachingConfig,
} from "@dotagents/shared/providers"
import { configStore } from "./config"
import { isDebugLLM, logLLM } from "./debug"

export type ProviderType = CHAT_PROVIDER_ID

interface ProviderConfig {
  apiKey: string
  baseURL?: string
  model: string
}

function normalizeProviderType(providerId: string): ProviderType {
  return normalizeChatProviderId(providerId)
}

function sanitizeChatModelSelection(
  providerId: ProviderType,
  model: string,
  modelContext: ChatModelContext,
): string {
  const resolution = resolveChatModelForTextUsage(providerId, model, modelContext)
  if (resolution.reason === "transcription-only") {
    if (isDebugLLM()) {
      logLLM("Replacing STT-only model configured for chat/text usage", {
        providerId,
        modelContext,
        invalidModel: model,
        fallbackModel: resolution.fallbackModel,
      })
    }

    return resolution.model
  }

  if (resolution.reason === "chatgpt-web-only") {
    if (isDebugLLM()) {
      logLLM("Replacing ChatGPT-Web-only model configured for non-chatgpt-web provider", {
        providerId,
        modelContext,
        invalidModel: model,
        fallbackModel: resolution.fallbackModel,
      })
    }

    return resolution.model
  }

  return resolution.model
}

/**
 * Get provider configuration from app config
 */
function getProviderConfig(
  providerId: ProviderType,
  modelContext: ChatModelContext = "mcp"
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
  modelContext: ChatModelContext = "mcp"
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
  modelContext: ChatModelContext = "mcp"
): string {
  const config = configStore.get()
  const effectiveProviderId = normalizeProviderType(
    providerId || (config.agentProviderId as ProviderType) || (config.mcpToolsProviderId as ProviderType) || "openai",
  )

  return getProviderConfig(effectiveProviderId, modelContext).model
}

export function getPromptCachingConfig(
  providerId?: ProviderType,
  modelContext: ChatModelContext = "mcp",
): PromptCachingConfig | undefined {
  const config = configStore.get()
  const effectiveProviderId = normalizeProviderType(
    providerId || (config.agentProviderId as ProviderType) || (config.mcpToolsProviderId as ProviderType) || "openai",
  )
  const providerConfig = getProviderConfig(effectiveProviderId, modelContext)
  return resolvePromptCachingConfig(effectiveProviderId, providerConfig.model, providerConfig.baseURL)
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
  modelContext: ChatModelContext = "mcp",
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
