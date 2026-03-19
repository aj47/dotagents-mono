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

export type ProviderType = "openai" | "groq" | "gemini"

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
} as const

const TRANSCRIPTION_ONLY_MODEL_PATTERNS = {
  openai: ["gpt-4o-transcribe", "gpt-4o-mini-transcribe", "whisper-1"],
  groq: ["whisper-large-v3", "whisper-large-v3-turbo", "distil-whisper-large-v3-en"],
} as const

interface ProviderConfig {
  apiKey: string
  baseURL?: string
  model: string
}

export interface PromptCachingConfig {
  strategy: string
  providerOptions?: Record<string, unknown>
}

function isTranscriptionOnlyModel(providerId: ProviderType, model: string): boolean {
  const patterns = TRANSCRIPTION_ONLY_MODEL_PATTERNS[providerId as keyof typeof TRANSCRIPTION_ONLY_MODEL_PATTERNS]
  if (!patterns) {
    return false
  }

  const normalizedModel = model.trim().toLowerCase()
  return patterns.some(pattern => normalizedModel.includes(pattern))
}

function sanitizeChatModelSelection(
  providerId: ProviderType,
  model: string,
  modelContext: "mcp" | "transcript",
): string {
  if (!isTranscriptionOnlyModel(providerId, model)) {
    return model
  }

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

/**
 * Get provider configuration from app config
 */
function getProviderConfig(
  providerId: ProviderType,
  modelContext: "mcp" | "transcript" = "mcp"
): ProviderConfig {
  const config = configStore.get()

  switch (providerId) {
    case "openai":
      return {
        apiKey: config.openaiApiKey || "",
        baseURL: config.openaiBaseUrl || undefined,
        model: sanitizeChatModelSelection(
          "openai",
          modelContext === "mcp"
            ? config.mcpToolsOpenaiModel || DEFAULT_CHAT_MODELS.openai.mcp
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
            ? config.mcpToolsGroqModel || DEFAULT_CHAT_MODELS.groq.mcp
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
            ? config.mcpToolsGeminiModel || DEFAULT_CHAT_MODELS.gemini.mcp
            : config.transcriptPostProcessingGeminiModel || DEFAULT_CHAT_MODELS.gemini.transcript,
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
  const effectiveProviderId =
    providerId || (config.mcpToolsProviderId as ProviderType) || "openai"

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
  return (config.mcpToolsProviderId as ProviderType) || "openai"
}

/**
 * Get the transcript post-processing provider ID from config
 */
export function getTranscriptProviderId(): ProviderType {
  const config = configStore.get()
  return (config.transcriptPostProcessingProviderId as ProviderType) || "openai"
}

/**
 * Get the current model name for the provider
 */
export function getCurrentModelName(
  providerId?: ProviderType,
  modelContext: "mcp" | "transcript" = "mcp"
): string {
  const config = configStore.get()
  const effectiveProviderId =
    providerId || (config.mcpToolsProviderId as ProviderType) || "openai"

  return getProviderConfig(effectiveProviderId, modelContext).model
}

export function getPromptCachingConfig(
  providerId?: ProviderType,
  modelContext: "mcp" | "transcript" = "mcp",
): PromptCachingConfig | undefined {
  const config = configStore.get()
  const effectiveProviderId =
    providerId || (config.mcpToolsProviderId as ProviderType) || "openai"
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

  if (effectiveProviderId === "openai" && (!normalizedBaseURL || normalizedBaseURL.includes("api.openai.com"))) {
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
