/**
 * AI SDK Provider Adapter
 * Provides a unified interface for creating language models using Vercel AI SDK
 * with support for OpenAI, OpenAI-compatible endpoints, Groq, and Google.
 */

import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { LanguageModel } from "ai"
import {
  CHAT_PROVIDER_ID,
  resolveChatModelSelection,
  resolveChatProviderId,
} from "@dotagents/shared"
import { configStore } from "./config"
import { isDebugLLM, logLLM } from "./debug"

export type ProviderType = CHAT_PROVIDER_ID

interface ProviderConfig {
  apiKey: string
  baseURL?: string
  model: string
}

export interface PromptCachingConfig {
  strategy: string
  providerOptions?: Record<string, unknown>
}

/**
 * Get provider configuration from app config
 */
function getProviderConfig(
  providerId: ProviderType,
  modelContext: "mcp" | "transcript" = "mcp",
): ProviderConfig {
  const config = configStore.get()
  const { model } = resolveChatModelSelection(config, modelContext, providerId)

  switch (providerId) {
    case "openai":
      return {
        apiKey: config.openaiApiKey || "",
        baseURL: config.openaiBaseUrl || undefined,
        model,
      }

    case "groq":
      return {
        apiKey: config.groqApiKey || "",
        baseURL: config.groqBaseUrl || "https://api.groq.com/openai/v1",
        model,
      }

    case "gemini":
      return {
        apiKey: config.geminiApiKey || "",
        baseURL: config.geminiBaseUrl || undefined,
        model,
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
  modelContext: "mcp" | "transcript" = "mcp",
): LanguageModel {
  const config = configStore.get()
  const effectiveProviderId =
    providerId || resolveChatProviderId(config, modelContext)

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

    default:
      throw new Error(`Unknown provider: ${effectiveProviderId}`)
  }
}

/**
 * Get the current provider ID from config (for MCP tools)
 */
export function getCurrentProviderId(): ProviderType {
  const config = configStore.get()
  return resolveChatProviderId(config, "mcp")
}

/**
 * Get the transcript post-processing provider ID from config
 */
export function getTranscriptProviderId(): ProviderType {
  const config = configStore.get()
  return resolveChatProviderId(config, "transcript")
}

/**
 * Get the current model name for the provider
 */
export function getCurrentModelName(
  providerId?: ProviderType,
  modelContext: "mcp" | "transcript" = "mcp",
): string {
  const config = configStore.get()
  const effectiveProviderId =
    providerId || resolveChatProviderId(config, modelContext)

  return getProviderConfig(effectiveProviderId, modelContext).model
}

export function getPromptCachingConfig(
  providerId?: ProviderType,
  modelContext: "mcp" | "transcript" = "mcp",
): PromptCachingConfig | undefined {
  const config = configStore.get()
  const effectiveProviderId =
    providerId || resolveChatProviderId(config, modelContext)
  const providerConfig = getProviderConfig(effectiveProviderId, modelContext)
  const normalizedBaseURL = (providerConfig.baseURL || "").trim().toLowerCase()

  if (normalizedBaseURL.includes("ai-gateway.vercel.sh")) {
    return {
      strategy: "gateway-auto",
      providerOptions: {
        gateway: {
          caching: "auto",
        },
      },
    }
  }

  if (
    effectiveProviderId === "openai" &&
    (!normalizedBaseURL || normalizedBaseURL.includes("api.openai.com"))
  ) {
    return {
      strategy: "openai-implicit-prefix",
    }
  }

  if (effectiveProviderId === "gemini") {
    return {
      strategy: "gemini-stable-prefix",
    }
  }

  return undefined
}
