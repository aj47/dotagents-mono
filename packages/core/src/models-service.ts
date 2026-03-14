/**
 * Models Service
 *
 * Fetches available models from provider APIs (OpenAI, Groq, Gemini)
 * and enhances them with data from models.dev.
 *
 * Extracted to @dotagents/core — no Electron dependencies.
 */

import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { fetchModelsDevData, getModelFromModelsDevByProviderId } from "./models-dev-service"
import type { ModelsDevModel } from "./models-dev-service"
import { isKnownSttModel, KNOWN_STT_MODEL_IDS } from "@dotagents/shared"
import type { ModelInfo, EnhancedModelInfo } from "./types"

// Re-export ModelInfo for backward compatibility
export type { ModelInfo, EnhancedModelInfo } from "./types"

interface ModelsResponse {
  data: ModelInfo[]
  object: string
}

// Cache for models to avoid frequent API calls
const modelsCache = new Map<
  string,
  { models: ModelInfo[]; timestamp: number }
>()
const CACHE_DURATION = 5 * 60 * 1000

/**
 * Map our provider IDs to models.dev provider IDs
 */
function mapToModelsDevProviderId(providerId: string, baseUrl?: string): string {
  if (providerId === "openai" && baseUrl?.includes("openrouter.ai")) {
    return "openrouter"
  }
  const providerMap: Record<string, string> = {
    openai: "openai",
    groq: "groq",
    gemini: "google",
  }
  return providerMap[providerId] || providerId
}

/**
 * Enhance a ModelInfo object with data from models.dev
 */
function enhanceModelWithModelsDevData(
  model: ModelInfo,
  providerId: string,
  baseUrl?: string
): EnhancedModelInfo {
  const modelsDevProviderId = mapToModelsDevProviderId(providerId, baseUrl)
  const modelsDevModel = getModelFromModelsDevByProviderId(model.id, modelsDevProviderId)

  if (!modelsDevModel) {
    return model
  }

  const enhanced: EnhancedModelInfo = {
    ...model,
    name: model.name,
    family: modelsDevModel.family,
    supportsAttachment: modelsDevModel.attachment,
    supportsReasoning: modelsDevModel.reasoning,
    supportsToolCalls: modelsDevModel.tool_call,
    supportsStructuredOutput: modelsDevModel.structured_output,
    supportsTemperature: modelsDevModel.temperature,
    knowledge: modelsDevModel.knowledge,
    releaseDate: modelsDevModel.release_date,
    lastUpdated: modelsDevModel.last_updated,
    openWeights: modelsDevModel.open_weights,
    inputCost: modelsDevModel.cost?.input,
    outputCost: modelsDevModel.cost?.output,
    reasoningCost: modelsDevModel.cost?.reasoning,
    cacheReadCost: modelsDevModel.cost?.cache_read,
    cacheWriteCost: modelsDevModel.cost?.cache_write,
    contextLimit: modelsDevModel.limit?.context,
    outputLimit: modelsDevModel.limit?.output,
    inputModalities: modelsDevModel.modalities?.input,
    outputModalities: modelsDevModel.modalities?.output,
  }

  if (!enhanced.context_length && modelsDevModel.limit?.context) {
    enhanced.context_length = modelsDevModel.limit.context
  }

  return enhanced
}

async function fetchOpenAIModels(
  baseUrl?: string,
  apiKey?: string,
): Promise<ModelInfo[]> {
  if (!apiKey) {
    throw new Error("OpenAI API key is required")
  }

  const url = `${baseUrl || "https://api.openai.com/v1"}/models`
  const isOpenRouter = baseUrl?.includes("openrouter.ai")
  const isCerebras = baseUrl?.includes("cerebras.ai")
  const isNativeOpenAI =
    !isOpenRouter && !isCerebras && (!baseUrl || baseUrl.includes("api.openai.com"))
  const isGenericOpenAICompatible =
    !isOpenRouter && !isCerebras && !!baseUrl && !baseUrl.includes("api.openai.com")

  diagnosticsService.logInfo(
    "models-service",
    `Fetching models from: ${url}`,
    {
      baseUrl,
      isOpenRouter,
      isCerebras,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...` : "none",
    },
  )

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  })

  diagnosticsService.logInfo(
    "models-service",
    `Models API response: ${response.status} ${response.statusText}`,
    {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    diagnosticsService.logError(
      "models-service",
      `Models API request failed`,
      {
        url,
        status: response.status,
        statusText: response.statusText,
        errorText,
      },
    )
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }

  const data = await response.json() as ModelsResponse

  diagnosticsService.logInfo(
    "models-service",
    `Models API response data`,
    {
      url,
      dataKeys: Object.keys(data),
      modelsCount: data.data?.length || 0,
      firstFewModels: data.data?.slice(0, 3).map(m => ({ id: m.id, name: m.name || formatModelName(m.id) })) || [],
    },
  )

  let filteredModels = data.data

  if (isOpenRouter) {
    filteredModels = data.data.filter(
      (model) =>
        !model.id.includes(":ft-") &&
        !model.id.includes("instruct-beta") &&
        !model.id.includes("preview") &&
        model.id.length > 0,
    )
  } else if (isCerebras) {
    filteredModels = data.data.filter(
      (model) =>
        model.id && model.id.length > 0,
    )

    diagnosticsService.logInfo(
      "models-service",
      `Cerebras models after filtering`,
      {
        totalModels: data.data.length,
        filteredCount: filteredModels.length,
        modelIds: filteredModels.map(m => m.id),
      },
    )
  } else if (isNativeOpenAI) {
    filteredModels = data.data.filter(
      (model) =>
        !model.id.includes(":") &&
        !model.id.includes("instruct") &&
        (
          model.id.includes("gpt") ||
          model.id.includes("o1") ||
          KNOWN_STT_MODEL_IDS.openai.some(transcriptionModel =>
            model.id.includes(transcriptionModel),
          )
        ),
    )
  } else if (isGenericOpenAICompatible) {
    filteredModels = data.data.filter(
      (model) => model.id && model.id.length > 0,
    )
  } else {
    filteredModels = data.data.filter(
      (model) => model.id && model.id.length > 0,
    )
  }

  const finalModels = filteredModels
    .map((model) => ({
      id: model.id,
      name: formatModelName(model.id),
      description: model.description,
      context_length: model.context_length,
      created: model.created,
      supportsTranscription: isKnownSttModel("openai", model.id),
    }))
    .sort((a, b) => {
      if (isOpenRouter) {
        const getOpenRouterPriority = (id: string) => {
          if (id.includes("gpt-5")) return 0
          if (id.includes("gpt-4.1")) return 1
          if (id.includes("claude-sonnet-4")) return 2
          if (id.includes("gemini-2.5-flash")) return 3
          if (id.includes("gpt-oss-120b")) return 4
          if (id.includes("gpt-4o")) return 5
          if (id.includes("claude")) return 6
          if (id.includes("llama-3.1") && id.includes("405b")) return 7
          if (id.includes("llama-3.1") && id.includes("70b")) return 8
          if (id.includes("gemini-1.5-pro")) return 9
          if (id.includes("o1")) return 10
          if (id.includes("gpt-3.5")) return 11
          return 10
        }
        const priorityDiff =
          getOpenRouterPriority(a.id) - getOpenRouterPriority(b.id)
        if (priorityDiff !== 0) return priorityDiff
        return a.name.localeCompare(b.name)
      } else if (isCerebras) {
        return a.name.localeCompare(b.name)
      } else {
        const getModelPriority = (id: string) => {
          if (id.includes("o1")) return 0
          if (id.includes("gpt-4")) return 1
          if (id.includes("gpt-3.5")) return 2
          return 3
        }
        return getModelPriority(a.id) - getModelPriority(b.id)
      }
    })

  const providerLabel = isOpenRouter
    ? "OpenRouter"
    : isCerebras
      ? "Cerebras"
      : isNativeOpenAI
        ? "OpenAI"
        : "OpenAI-compatible"

  diagnosticsService.logInfo(
    "models-service",
    `Final models list for ${providerLabel}`,
    {
      url,
      totalCount: finalModels.length,
      modelIds: finalModels.map(m => m.id),
      modelNames: finalModels.map(m => m.name),
    },
  )

  return finalModels
}

async function fetchGroqModels(
  baseUrl?: string,
  apiKey?: string,
): Promise<ModelInfo[]> {
  if (!apiKey) {
    throw new Error("Groq API key is required")
  }

  const url = `${baseUrl || "https://api.groq.com/openai/v1"}/models`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }

  const data = await response.json() as ModelsResponse
  return data.data
    .map((model) => ({
      id: model.id,
      name: formatModelName(model.id),
      description: model.description,
      context_length: model.context_length,
      created: model.created,
      supportsTranscription: isKnownSttModel("groq", model.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

async function fetchGeminiModels(
  baseUrl?: string,
  apiKey?: string,
): Promise<ModelInfo[]> {
  if (!apiKey) {
    throw new Error("Gemini API key is required")
  }

  const url = `${baseUrl || "https://generativelanguage.googleapis.com"}/v1beta/models?key=${apiKey}`

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await response.json() as any

  if (!data.models || !Array.isArray(data.models)) {
    return []
  }

  return data.models
    .filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (model: any) =>
        model.name &&
        model.name.includes("gemini") &&
        model.supportedGenerationMethods?.includes("generateContent"),
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((model: any) => {
      const modelId = model.name.split("/").pop()
      return {
        id: modelId,
        name: formatModelName(modelId),
        description: model.description,
        context_length: model.inputTokenLimit,
      }
    })
    .sort((a: ModelInfo, b: ModelInfo) => a.name.localeCompare(b.name))
}

/**
 * Format model ID into a human-readable name
 */
export function formatModelName(modelId: string): string {
  const nameMap: Record<string, string> = {
    "gpt-5": "GPT-5",
    "gpt-5-mini": "GPT-5 Mini",
    "gpt-4.1": "GPT-4.1",
    "gpt-4.1-mini": "GPT-4.1 Mini",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "gpt-4-turbo": "GPT-4 Turbo",
    "gpt-4": "GPT-4",
    "gpt-3.5-turbo": "GPT-3.5 Turbo",
    "o1-preview": "o1 Preview",
    "o1-mini": "o1 Mini",
    "anthropic/claude-sonnet-4": "Claude Sonnet 4",
    "anthropic/claude-3.5-sonnet": "Claude 3.5 Sonnet",
    "anthropic/claude-3-opus": "Claude 3 Opus",
    "anthropic/claude-3-sonnet": "Claude 3 Sonnet",
    "anthropic/claude-3-haiku": "Claude 3 Haiku",
    "google/gemini-2.5-flash": "Gemini 2.5 Flash",
    "google/gemini-1.5-pro": "Gemini 1.5 Pro",
    "google/gemini-1.5-flash": "Gemini 1.5 Flash",
    "google/gemini-1.0-pro": "Gemini 1.0 Pro",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gemini-1.5-pro": "Gemini 1.5 Pro",
    "gemini-1.5-flash": "Gemini 1.5 Flash",
    "gemini-1.0-pro": "Gemini 1.0 Pro",
    "meta-llama/llama-3.1-405b-instruct": "Llama 3.1 405B Instruct",
    "meta-llama/llama-3.1-70b-instruct": "Llama 3.1 70B Instruct",
    "meta-llama/llama-3.1-8b-instruct": "Llama 3.1 8B Instruct",
    "meta-llama/llama-3-70b-instruct": "Llama 3 70B Instruct",
    "meta-llama/llama-3-8b-instruct": "Llama 3 8B Instruct",
    "moonshotai/kimi-k2-instruct": "Kimi K2 Instruct (Moonshot AI)",
    "openai/gpt-oss-20b": "GPT-OSS 20B (OpenAI)",
    "openai/gpt-oss-120b": "GPT-OSS 120B (OpenAI)",
    "gemma2-9b-it": "Gemma2 9B IT",
    "llama-3.3-70b-versatile": "Llama 3.3 70B Versatile",
    "llama-3.1-70b-versatile": "Llama 3.1 70B Versatile",
    "mixtral-8x7b-32768": "Mixtral 8x7B",
    "mistralai/mistral-7b-instruct": "Mistral 7B Instruct",
    "mistralai/mixtral-8x7b-instruct": "Mixtral 8x7B Instruct",
    "mistralai/mixtral-8x22b-instruct": "Mixtral 8x22B Instruct",
  }

  if (nameMap[modelId]) {
    return nameMap[modelId]
  }

  if (modelId.includes("/")) {
    const [provider, model] = modelId.split("/")
    const providerNames: Record<string, string> = {
      anthropic: "Anthropic",
      openai: "OpenAI",
      google: "Google",
      "meta-llama": "Meta",
      mistralai: "Mistral",
      cohere: "Cohere",
      perplexity: "Perplexity",
    }

    const formattedProvider =
      providerNames[provider] ||
      provider.charAt(0).toUpperCase() + provider.slice(1)
    const formattedModel = model
      .split("-")
      .map((part) => {
        if (part === "instruct") return "Instruct"
        if (part === "turbo") return "Turbo"
        if (part.match(/^\d+b$/)) return part.toUpperCase()
        if (part.match(/^\d+\.\d+$/)) return part
        return part.charAt(0).toUpperCase() + part.slice(1)
      })
      .join(" ")

    return `${formattedModel} (${formattedProvider})`
  }

  return modelId
    .split("-")
    .map((part) => {
      if (part === "instruct") return "Instruct"
      if (part === "turbo") return "Turbo"
      if (part.match(/^\d+b$/)) return part.toUpperCase()
      if (part.match(/^\d+\.\d+$/)) return part
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(" ")
}

/**
 * Main function to fetch available models for a provider
 */
export async function fetchAvailableModels(
  providerId: string,
): Promise<ModelInfo[]> {
  const config = configStore.get()

  const cacheKeyParts = [providerId]
  if (providerId === "openai") {
    const baseUrl = config.openaiBaseUrl || "https://api.openai.com/v1"
    const apiKey = config.openaiApiKey || ""
    cacheKeyParts.push(baseUrl)
    if (apiKey) {
      cacheKeyParts.push(apiKey.slice(0, 8))
    }
  } else if (providerId === "groq") {
    const baseUrl = config.groqBaseUrl || "https://api.groq.com/openai/v1"
    const apiKey = config.groqApiKey || ""
    cacheKeyParts.push(baseUrl)
    if (apiKey) {
      cacheKeyParts.push(apiKey.slice(0, 8))
    }
  } else if (providerId === "gemini") {
    const baseUrl = config.geminiBaseUrl || "https://generativelanguage.googleapis.com"
    const apiKey = config.geminiApiKey || ""
    cacheKeyParts.push(baseUrl)
    if (apiKey) {
      cacheKeyParts.push(apiKey.slice(0, 8))
    }
  }

  const cacheKey = cacheKeyParts.join("|")
  const cached = modelsCache.get(cacheKey)
  const now = Date.now()
  const cacheValid =
    !!cached &&
    now - cached.timestamp < CACHE_DURATION &&
    cached.models.length > 0

  diagnosticsService.logInfo(
    "models-service",
    `Fetching models for provider: ${providerId}`,
    {
      providerId,
      cacheKey,
      hasCached: !!cached,
      cacheAge: cached ? now - cached.timestamp : null,
      cacheValid,
    },
  )

  if (cacheValid) {
    diagnosticsService.logInfo(
      "models-service",
      `Returning cached models for ${providerId}`,
      { count: cached?.models.length || 0 },
    )
    return cached!.models
  }

  try {
    let models: ModelInfo[] = []

    diagnosticsService.logInfo(
      "models-service",
      `Config for ${providerId}`,
      {
        providerId,
        openaiBaseUrl: config.openaiBaseUrl,
        hasOpenaiApiKey: !!config.openaiApiKey,
        hasGroqApiKey: !!config.groqApiKey,
        hasGeminiApiKey: !!config.geminiApiKey,
      },
    )

    let baseUrl: string | undefined
    switch (providerId) {
      case "openai":
        baseUrl = config.openaiBaseUrl
        models = await fetchOpenAIModels(baseUrl, config.openaiApiKey)
        break
      case "groq":
        baseUrl = config.groqBaseUrl
        models = await fetchGroqModels(baseUrl, config.groqApiKey)
        break
      case "gemini":
        baseUrl = config.geminiBaseUrl
        models = await fetchGeminiModels(baseUrl, config.geminiApiKey)
        break
      default:
        throw new Error(`Unsupported provider: ${providerId}`)
    }

    fetchModelsDevData().catch((err) => {
      diagnosticsService.logInfo(
        "models-service",
        `Background models.dev fetch failed (non-blocking)`,
        { error: err instanceof Error ? err.message : String(err) }
      )
    })

    const enhancedModels = models.map((model) =>
      enhanceModelWithModelsDevData(model, providerId, baseUrl)
    )

    diagnosticsService.logInfo(
      "models-service",
      `Successfully fetched ${enhancedModels.length} models for ${providerId}`,
      {
        providerId,
        count: enhancedModels.length,
        modelIds: enhancedModels.map(m => m.id),
      },
    )

    if (enhancedModels.length > 0) {
      modelsCache.set(cacheKey, {
        models: enhancedModels,
        timestamp: now,
      })
    } else {
      diagnosticsService.logInfo(
        "models-service",
        `Not caching empty models list for ${providerId}`,
        {
          providerId,
          cacheKey,
        },
      )
    }

    return enhancedModels
  } catch (error) {
    diagnosticsService.logError(
      "models-service",
      `Failed to fetch models for ${providerId}`,
      {
        providerId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    )

    try {
      const fallbackModels = await getFallbackModelsAsync(providerId)
      diagnosticsService.logInfo(
        "models-service",
        `Returning ${fallbackModels.length} fallback models (from models.dev) for ${providerId}`,
        {
          providerId,
          fallbackCount: fallbackModels.length,
          fallbackIds: fallbackModels.map(m => m.id),
        },
      )
      return fallbackModels
    } catch {
      const fallbackModels = getFallbackModels(providerId)
      diagnosticsService.logInfo(
        "models-service",
        `Returning ${fallbackModels.length} fallback models (hardcoded) for ${providerId}`,
        {
          providerId,
          fallbackCount: fallbackModels.length,
          fallbackIds: fallbackModels.map(m => m.id),
        },
      )
      return fallbackModels
    }
  }
}

const HARDCODED_FALLBACK_MODELS: Record<string, ModelInfo[]> = {
  openai: [
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
  ],
  openrouter: [
    { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini (OpenAI)" },
    { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4 (Anthropic)" },
  ],
  groq: [
    { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B (OpenAI)" },
  ],
  google: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  ],
}

async function getFallbackModelsAsync(providerId: string): Promise<ModelInfo[]> {
  const config = configStore.get()
  const isOpenRouter =
    providerId === "openai" && config.openaiBaseUrl?.includes("openrouter.ai")

  const modelsDevProviderId = isOpenRouter ? "openrouter" : mapToModelsDevProviderId(providerId)

  try {
    const modelsDevData = await fetchModelsDevData()
    const provider = modelsDevData[modelsDevProviderId]

    if (provider && provider.models && Object.keys(provider.models).length > 0) {
      const models = Object.entries(provider.models).map(([modelId, modelData]) => {
        const model: ModelInfo = {
          id: modelId,
          name: modelData.name || formatModelName(modelId),
          context_length: modelData.limit?.context,
        }
        return enhanceModelWithModelsDevData(model, providerId, isOpenRouter ? config.openaiBaseUrl : undefined)
      })

      diagnosticsService.logInfo(
        "models-service",
        `Using ${models.length} fallback models from models.dev for ${modelsDevProviderId}`,
        { providerId, modelsDevProviderId, count: models.length }
      )

      return models
    }
  } catch (error) {
    diagnosticsService.logInfo(
      "models-service",
      `Failed to get fallback models from models.dev, using hardcoded fallbacks`,
      { providerId, error: error instanceof Error ? error.message : String(error) }
    )
  }

  const hardcodedKey = isOpenRouter ? "openrouter" : modelsDevProviderId
  return HARDCODED_FALLBACK_MODELS[hardcodedKey] || HARDCODED_FALLBACK_MODELS[providerId] || []
}

function getFallbackModels(providerId: string): ModelInfo[] {
  const config = configStore.get()
  const isOpenRouter =
    providerId === "openai" && config.openaiBaseUrl?.includes("openrouter.ai")

  const hardcodedKey = isOpenRouter ? "openrouter" : mapToModelsDevProviderId(providerId)
  return HARDCODED_FALLBACK_MODELS[hardcodedKey] || HARDCODED_FALLBACK_MODELS[providerId] || []
}

/**
 * Clear the models cache (useful for testing or when credentials change)
 */
export function clearModelsCache(): void {
  modelsCache.clear()
}

/**
 * Fetch models for a specific preset (base URL + API key combination)
 */
export async function fetchModelsForPreset(
  baseUrl: string,
  apiKey: string,
): Promise<ModelInfo[]> {
  if (!baseUrl || !apiKey) {
    throw new Error("Base URL and API key are required")
  }

  try {
    const models = await fetchOpenAIModels(baseUrl, apiKey)
    return models
  } catch (error) {
    diagnosticsService.logError(
      "models-service",
      `Failed to fetch models for preset`,
      {
        baseUrl,
        error: error instanceof Error ? error.message : String(error),
      },
    )
    throw error
  }
}
