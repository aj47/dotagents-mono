/**
 * LLM Fetch Module - Vercel AI SDK Implementation
 *
 * This module provides LLM functionality using Vercel AI SDK for:
 * - Tool calling with automatic structured output
 * - Streaming responses
 * - Provider flexibility (OpenAI, Groq, Gemini, Anthropic)
 * - Automatic retry with exponential backoff
 *
 * Migrated from custom fetch-based implementation to use @ai-sdk packages.
 */

import { generateText, streamText, tool as aiTool } from "ai"
import type { ModelMessage, UserContent } from "ai"
import { jsonSchema } from "ai"
import { randomUUID } from "crypto"
import fs from "fs"
import type { AgentRetryProgressCallback } from "@dotagents/shared/agent-progress"
import {
  normalizeProviderToolInputSchema,
  restoreProviderToolName,
  sanitizeProviderToolName,
} from "@dotagents/shared/provider-tool-utils"
import {
  createLanguageModel,
  getCurrentProviderId,
  getCurrentModelName,
  getPromptCachingConfig,
  getReasoningEffortProviderOptions,
  getTranscriptProviderId,
  mergeProviderOptions,
  type ProviderType,
} from "./ai-sdk-provider"
import { configStore } from "./config"
import type { LLMToolCallResponse, MCPTool } from "./mcp-service"
import { diagnosticsService } from "./diagnostics"
import { isDebugLLM, logLLM } from "./debug"
import { getErrorMessage, normalizeError } from "@dotagents/shared/error-utils"
import { normalizeVerificationResultForCompletion } from "@dotagents/shared/llm-continuation-guards"
import { state, agentSessionStateManager, llmRequestAbortManager } from "@dotagents/core"
import { calculateLlmRetryBackoffDelay } from "@dotagents/shared/agent-run-utils"
import type { AgentConversationState } from "@dotagents/shared/conversation-state"
import {
  isEmptyResponseError,
  isRateLimitError,
  isRetryableLlmProviderError,
} from "@dotagents/shared/api-key-error-utils"
import { hasRawToolCallMarkerTokens, stripRawToolMarkerTokens } from "@dotagents/shared/chat-utils"
import {
  extractConversationImageMarkdownReferences,
  getConversationImageMimeTypeFromFileName,
  parseDataImageUrl,
  parseConversationImageAssetUrl,
} from "@dotagents/shared/conversation-media-assets"
import {
  createLLMGeneration,
  endLLMGeneration,
  isLangfuseEnabled,
} from "./langfuse-service"
import { recordActualTokenUsage } from "./context-budget"
import { getCurrentChatGptWebModelName, isChatGptWebProvider, makeChatGptWebCompletion, makeChatGptWebResponse } from "./chatgpt-web-provider"
import { getConversationImageAssetPath } from "./conversation-image-assets"

/**
 * Extended usage type that includes cache token details from AI SDK providers.
 * OpenAI, Anthropic, and Gemini all populate these fields when prompt caching is active.
 */
interface ExtendedUsage {
  inputTokens?: number
  outputTokens?: number
  inputTokenDetails?: {
    cacheReadTokens?: number
    cacheWriteTokens?: number
    noCacheTokens?: number
  }
  totalTokens?: number
}

/**
 * Build token usage object for Langfuse, only including it when at least one token field is present.
 * This avoids reporting 0 tokens when the provider doesn't return usage data.
 * Also extracts prompt caching metrics (cache read/write tokens) when available.
 */
function buildTokenUsage(usage?: ExtendedUsage): {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
} | undefined {
  const inputTokens = usage?.inputTokens
  const outputTokens = usage?.outputTokens

  // Only include usage when at least one token field is present
  if (inputTokens === undefined && outputTokens === undefined) {
    return undefined
  }

  return {
    promptTokens: inputTokens,
    completionTokens: outputTokens,
    totalTokens: (inputTokens ?? 0) + (outputTokens ?? 0),
  }
}

/**
 * Log prompt cache hit/miss metrics from AI SDK usage data.
 * OpenAI, Anthropic, and Gemini populate inputTokenDetails when caching is active.
 * This helps monitor whether prompt caching is actually saving costs.
 */
function logCacheMetrics(
  usage: ExtendedUsage | undefined,
  strategy: string | undefined,
  providerId: string,
): void {
  if (!usage?.inputTokenDetails) return

  const { cacheReadTokens, cacheWriteTokens } = usage.inputTokenDetails
  // Only log when we have actual cache data
  if (cacheReadTokens === undefined && cacheWriteTokens === undefined) return

  const inputTokens = usage.inputTokens ?? 0
  const cacheRead = cacheReadTokens ?? 0
  const cacheWrite = cacheWriteTokens ?? 0
  const cacheHitRate = inputTokens > 0 ? Math.round((cacheRead / inputTokens) * 100) : 0

  diagnosticsService.logInfo("prompt-cache", `Cache metrics: ${cacheHitRate}% hit rate`, {
    provider: providerId,
    strategy,
    inputTokens,
    cacheReadTokens: cacheRead,
    cacheWriteTokens: cacheWrite,
    cacheHitRate,
  })

  if (isDebugLLM()) {
    logLLM("📦 Prompt cache metrics", {
      provider: providerId,
      strategy,
      inputTokens,
      cacheReadTokens: cacheRead,
      cacheWriteTokens: cacheWrite,
      cacheHitRate: `${cacheHitRate}%`,
    })
  }
}

/**
 * Result of converting MCP tools to AI SDK format
 */
interface ConvertedTools {
  tools: Record<string, ReturnType<typeof aiTool>>
  /** Map from sanitized name back to original MCP tool name */
  nameMap: Map<string, string>
}

/**
 * Convert MCP tools to AI SDK tool format
 * Uses dynamicTool pattern since MCP tool schemas are JSON Schema, not Zod
 * Returns both the tools and a map for restoring original names
 */
function convertMCPToolsToAISDKTools(mcpTools: MCPTool[]): ConvertedTools {
  const tools: Record<string, ReturnType<typeof aiTool>> = {}
  const nameMap = new Map<string, string>()
  // Track collision counts for disambiguation
  const collisionCount = new Map<string, number>()

  for (const mcpTool of mcpTools) {
    // Sanitize tool name to avoid provider compatibility issues
    // (OpenAI/Groq reject tool names containing ':')
    let sanitizedName = sanitizeProviderToolName(mcpTool.name)

    // Handle collision: if this sanitized name already exists with a different original name,
    // add a deterministic disambiguation suffix to make it unique
    if (nameMap.has(sanitizedName) && nameMap.get(sanitizedName) !== mcpTool.name) {
      const existingOriginal = nameMap.get(sanitizedName)
      logLLM(`⚠️ Tool name collision detected: "${mcpTool.name}" and "${existingOriginal}" both sanitize to "${sanitizedName}"`)

      // Get or initialize collision counter for this base name
      const count = (collisionCount.get(sanitizedName) || 0) + 1
      collisionCount.set(sanitizedName, count)

      // Generate a unique name with numeric suffix
      sanitizedName = sanitizeProviderToolName(mcpTool.name, { suffix: String(count) })
      logLLM(`   Disambiguated to: "${sanitizedName}"`)
    }

    // Store the mapping from sanitized name to original name
    nameMap.set(sanitizedName, mcpTool.name)

    // Create AI SDK tool with JSON schema (not Zod)
    tools[sanitizedName] = aiTool({
      description: mcpTool.description || `Tool: ${mcpTool.name}`,
      inputSchema: jsonSchema(normalizeProviderToolInputSchema(mcpTool.inputSchema)),
      // No execute function - we handle execution separately via MCP
    })
  }

  return { tools, nameMap }
}

/**
 * Callback for streaming content updates
 */
export type StreamingCallback = (chunk: string, accumulated: string) => void

export type CompletionVerification = {
  isComplete: boolean
  conversationState?: AgentConversationState
  confidence?: number
  missingItems?: string[]
  reason?: string
}

/**
 * Sleep for the specified delay while allowing the kill switch to interrupt.
 * Checks both the global stop flag and session-specific stop flag immediately
 * and roughly every 100ms during the wait.
 * Throws an error if the emergency stop is triggered.
 */
async function interruptibleDelay(delay: number, sessionId?: string): Promise<void> {
  // Compute the stop reason once to avoid double-check races and mislabeling
  const getStopReason = (): string | null => {
    // Check session-specific stop first (only when session ID is known and registered)
    if (sessionId != null && agentSessionStateManager.isSessionRegistered(sessionId) && agentSessionStateManager.shouldStopSession(sessionId)) {
      return "Session stopped by kill switch"
    }
    if (state.shouldStopAgent) {
      return "Aborted by emergency stop"
    }
    return null
  }

  // Immediate check (also covers delay === 0 case semantics)
  const immediateReason = getStopReason()
  if (immediateReason) {
    throw new Error(immediateReason)
  }

  if (delay <= 0) {
    return
  }

  const startTime = Date.now()
  while (Date.now() - startTime < delay) {
    const reason = getStopReason()
    if (reason) {
      throw new Error(reason)
    }
    const remaining = delay - (Date.now() - startTime)
    await new Promise(resolve => setTimeout(resolve, Math.min(100, Math.max(0, remaining))))
  }
}

/**
 * Execute an async function with retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    onRetryProgress?: AgentRetryProgressCallback
    sessionId?: string
  } = {}
): Promise<T> {
  const config = configStore.get()
  const maxRetries = options.maxRetries ?? config.apiRetryCount ?? 3
  const baseDelay = options.baseDelay ?? config.apiRetryBaseDelay ?? 1000
  const maxDelay = options.maxDelay ?? config.apiRetryMaxDelay ?? 30000

  let lastError: unknown
  let attempt = 0

  const clearRetryStatus = () => {
    if (options.onRetryProgress) {
      options.onRetryProgress({
        isRetrying: false,
        attempt: 0,
        delaySeconds: 0,
        reason: "",
        startedAt: 0,
      })
    }
  }

  // Helper to get the stop reason string, checking session-specific stop before global
  const getStopReason = (): string | null => {
    if (
      options.sessionId &&
      agentSessionStateManager.isSessionRegistered(options.sessionId) &&
      agentSessionStateManager.shouldStopSession(options.sessionId)
    ) {
      return "Session stopped by kill switch"
    }
    if (state.shouldStopAgent) {
      return "Aborted by emergency stop"
    }
    return null
  }

  while (true) {
    // Check for stop conditions before each attempt
    const stopReason = getStopReason()
    if (stopReason) {
      clearRetryStatus()
      throw new Error(stopReason)
    }

    try {
      const result = await fn()
      clearRetryStatus()
      return result
    } catch (error) {
      lastError = error

      // Don't retry aborts or stopped sessions
      if ((error as any)?.name === "AbortError") {
        clearRetryStatus()
        // Check if the abort was caused by the kill switch — if so, surface the cleaner stop reason
        const abortStopReason = getStopReason()
        if (abortStopReason) {
          throw new Error(abortStopReason)
        }
        throw error
      }

      // If a stop was triggered, surface a clear stop reason instead of the underlying error
      const catchStopReason = getStopReason()
      if (catchStopReason) {
        clearRetryStatus()
        throw new Error(catchStopReason)
      }

      // Check if retryable
      if (!isRetryableLlmProviderError(error)) {
        diagnosticsService.logError(
          "llm-fetch",
          "Non-retryable API error",
          error
        )
        clearRetryStatus()
        throw error
      }

      // Check for empty response errors - these skip backoff entirely
      // See: https://github.com/aj47/dotagents-mono/issues/964
      const isEmptyResponse = isEmptyResponseError(error)

      // Check for rate limit (429) using structured status and message fallback.
      const isRateLimit = isRateLimitError(error)

      // Rate limits retry indefinitely, other errors respect the limit
      // Empty response errors also respect the limit but skip backoff
      if (!isRateLimit && attempt >= maxRetries) {
        diagnosticsService.logError(
          "llm-fetch",
          "API call failed after all retries",
          { attempts: attempt + 1, error, isEmptyResponse }
        )
        clearRetryStatus()
        throw lastError
      }

      // Empty response errors retry immediately without backoff
      // These typically indicate API/auth issues that won't resolve by waiting
      if (isEmptyResponse) {
        logLLM(
          `⚡ Empty response - retrying immediately (attempt ${attempt + 1}/${maxRetries + 1})`
        )
        if (options.onRetryProgress) {
          options.onRetryProgress({
            isRetrying: true,
            attempt: attempt + 1,
            maxAttempts: maxRetries + 1,
            delaySeconds: 0,
            reason: "Empty response - retrying immediately",
            startedAt: Date.now(),
          })
        }
        attempt++
        continue
      }

      const delay = calculateLlmRetryBackoffDelay(attempt, baseDelay, maxDelay)
      const waitTimeSeconds = Math.round(delay / 1000)

      logLLM(
        `⏳ ${isRateLimit ? "Rate limit" : "Error"} - waiting ${waitTimeSeconds}s before retry (attempt ${attempt + 1})`
      )

      if (options.onRetryProgress) {
        options.onRetryProgress({
          isRetrying: true,
          attempt: attempt + 1,
          maxAttempts: isRateLimit ? undefined : maxRetries + 1,
          delaySeconds: waitTimeSeconds,
          reason: isRateLimit ? "Rate limit exceeded" : "Request failed",
          startedAt: Date.now(),
        })
      }

      // Wait before retrying with interruptible delay
      // Wrap in try-catch to ensure clearRetryStatus is called on emergency stop
      try {
        await interruptibleDelay(delay, options.sessionId)
      } catch (abortError) {
        clearRetryStatus()
        throw abortError
      }
      attempt++
    }
  }
}

/**
 * Convert messages to AI SDK format, extracting system messages separately
 * This is needed for compatibility with Anthropic/Claude APIs which expect
 * system prompts as a separate parameter, not in the messages array
 *
 * Also ensures the conversation never ends with an assistant message.
 * OpenAI-compatible APIs (including OpenRouter) do not support "assistant
 * message prefill" and require the conversation to end with a user message.
 * See: https://github.com/aj47/dotagents-mono/issues/1035
 */
type MarkdownImageForModel = { image: string | URL; mediaType?: string }

const MAX_CONVERSATION_IMAGE_ASSET_SIZE_BYTES = 8 * 1024 * 1024

function resolveAssetsImageUrlForModel(imageUrl: string): MarkdownImageForModel | null {
  try {
    const assetRef = parseConversationImageAssetUrl(imageUrl)
    if (!assetRef) return null

    const assetPath = getConversationImageAssetPath(assetRef.conversationId, assetRef.fileName)
    const mimeType = getConversationImageMimeTypeFromFileName(assetRef.fileName) || "image/png"
    const buffer = fs.readFileSync(assetPath)
    if (buffer.length > MAX_CONVERSATION_IMAGE_ASSET_SIZE_BYTES) {
      if (isDebugLLM()) {
        logLLM("Conversation image asset exceeds size limit for LLM", { imageUrl, size: buffer.length })
      }
      return null
    }
    return { image: buffer.toString("base64"), mediaType: mimeType }
  } catch (error) {
    if (isDebugLLM()) {
      logLLM("Failed to resolve conversation image asset for LLM", { imageUrl, error })
    }
    return null
  }
}

function resolveMarkdownImageForModel(imageUrl: string): MarkdownImageForModel | null {
  if (imageUrl.startsWith("data:image/")) {
    const dataImage = parseDataImageUrl(imageUrl)
    return dataImage
      ? { image: dataImage.base64, mediaType: dataImage.mimeType }
      : null
  }
  if (imageUrl.startsWith("assets://")) return resolveAssetsImageUrlForModel(imageUrl)
  return null
}

function convertMarkdownImagesToModelContent(content: string): UserContent {
  const parts: Exclude<UserContent, string> = []
  let lastIndex = 0
  let hasResolvedImage = false

  for (const reference of extractConversationImageMarkdownReferences(content)) {
    const before = content.slice(lastIndex, reference.index)
    if (before) parts.push({ type: "text", text: before })

    const image = resolveMarkdownImageForModel(reference.url)
    if (image) {
      parts.push({ type: "image", ...image })
      hasResolvedImage = true
    } else {
      parts.push({ type: "text", text: reference.fullMatch })
    }
    lastIndex = reference.index + reference.fullMatch.length
  }

  const after = content.slice(lastIndex)
  if (after) parts.push({ type: "text", text: after })

  return hasResolvedImage && parts.length > 0 ? parts : content
}

function convertMessages(messages: Array<{ role: string; content: string }>): {
  system: string | undefined
  messages: ModelMessage[]
} {
  const systemMessages: string[] = []
  const otherMessages: ModelMessage[] = []

  for (const msg of messages) {
    if (msg.role === "system") {
      systemMessages.push(msg.content)
    } else if (msg.role === "assistant") {
      otherMessages.push({
        role: "assistant",
        content: msg.content,
      })
    } else {
      otherMessages.push({
        role: "user",
        content: convertMarkdownImagesToModelContent(msg.content),
      })
    }
  }

  // Ensure the conversation doesn't end with an assistant message.
  // Some providers (e.g., OpenRouter proxying to Claude models) don't support
  // assistant message prefill and require the last message to be from the user.
  if (otherMessages.length > 0 && otherMessages[otherMessages.length - 1].role === "assistant") {
    otherMessages.push({
      role: "user",
      content: "Continue from your most recent step using the existing context. Do not restart.",
    })
  }

  return {
    system: systemMessages.length > 0 ? systemMessages.join("\n\n") : undefined,
    messages: otherMessages,
  }
}

/**
 * Create and register an abort controller for session management
 */
function createSessionAbortController(sessionId?: string): AbortController {
  const controller = new AbortController()
  if (sessionId) {
    agentSessionStateManager.registerAbortController(sessionId, controller)
  } else {
    llmRequestAbortManager.register(controller)
  }
return controller
}

/**
 * Unregister an abort controller from session management
 */
function unregisterSessionAbortController(controller: AbortController, sessionId?: string): void {
  if (sessionId) {
    agentSessionStateManager.unregisterAbortController(sessionId, controller)
  } else {
    llmRequestAbortManager.unregister(controller)
  }
}

/**
 * Extract JSON object from a string response
 */
function extractJsonObject(str: string): any | null {
  let braceCount = 0
  let startIndex = -1

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (char === "{") {
      if (braceCount === 0) startIndex = i
      braceCount++
    } else if (char === "}") {
      braceCount--
      if (braceCount === 0 && startIndex !== -1) {
        const jsonStr = str.substring(startIndex, i + 1)
        try {
          return JSON.parse(jsonStr)
        } catch {
          startIndex = -1
        }
      }
    }
  }
  return null
}

/**
 * Main function to make LLM calls using AI SDK with automatic retry
 * Now supports native AI SDK tool calling when tools are provided
 */
export async function makeLLMCallWithFetch(
  messages: Array<{ role: string; content: string }>,
  providerId?: string,
  onRetryProgress?: AgentRetryProgressCallback,
  sessionId?: string,
  tools?: MCPTool[]
): Promise<LLMToolCallResponse> {
  const effectiveProviderId = (providerId ||
    getCurrentProviderId()) as ProviderType

  return withRetry(
    async () => {
      const abortController = createSessionAbortController(sessionId)

      try {
        // Check for stop signal before starting
        if (
          state.shouldStopAgent ||
          (sessionId && agentSessionStateManager.shouldStopSession(sessionId))
        ) {
          abortController.abort()
        }

        if (isChatGptWebProvider(effectiveProviderId)) {
          const modelName = getCurrentChatGptWebModelName("mcp")
          const generationId = isLangfuseEnabled() ? randomUUID() : null
          if (generationId) {
            createLLMGeneration(sessionId || null, generationId, {
              name: "LLM Call",
              model: modelName,
              modelParameters: {
                provider: effectiveProviderId,
                hasTools: !!(tools && tools.length > 0),
                toolCount: tools?.length || 0,
              },
              input: { messages },
            })
          }

          let result
          try {
            result = await makeChatGptWebResponse(messages, {
              modelContext: "mcp",
              signal: abortController.signal,
              tools,
            })
          } catch (error) {
            if (generationId) {
              endLLMGeneration(generationId, {
                level: "ERROR",
                statusMessage: error instanceof Error ? error.message : "chatgpt-web call failed",
              })
            }
            throw error
          }

          const text = result.text.trim()

          if (!text && !result.toolCalls?.length && !result.reasoningSummary) {
            if (generationId) {
              endLLMGeneration(generationId, {
                level: "ERROR",
                statusMessage: "LLM returned empty response",
              })
            }
            throw new Error("LLM returned empty response")
          }

          if (result.toolCalls?.length) {
            const response = {
              content: text || undefined,
              toolCalls: result.toolCalls,
              reasoningSummary: result.reasoningSummary,
            } satisfies LLMToolCallResponse

            if (generationId) {
              endLLMGeneration(generationId, {
                output: JSON.stringify(response),
                usage: buildTokenUsage(result.usage),
              })
            }
            return response
          }

          const hasToolMarkers = hasRawToolCallMarkerTokens(text)
          const cleaned = stripRawToolMarkerTokens(text, { trim: true })

          if (generationId) {
            endLLMGeneration(generationId, {
              output: hasToolMarkers ? text : (cleaned || text),
              usage: buildTokenUsage(result.usage),
            })
          }

          if (hasToolMarkers) {
            return { content: text, reasoningSummary: result.reasoningSummary }
          }

          return {
            content: cleaned || text,
            reasoningSummary: result.reasoningSummary,
          }
        }

        const model = createLanguageModel(effectiveProviderId)
        const { system, messages: convertedMessages } = convertMessages(messages)
        const promptCaching = getPromptCachingConfig(effectiveProviderId)
        const reasoningOptions = getReasoningEffortProviderOptions(effectiveProviderId)
        const mergedProviderOptions = mergeProviderOptions(
          promptCaching?.providerOptions,
          reasoningOptions,
        )

        // Convert MCP tools to AI SDK format if provided
        const convertedTools = tools && tools.length > 0
          ? convertMCPToolsToAISDKTools(tools)
          : undefined

        const modelName = getCurrentModelName(effectiveProviderId)

        if (isDebugLLM()) {
          logLLM("🚀 AI SDK generateText call", {
            provider: effectiveProviderId,
            messagesCount: messages.length,
            hasSystem: !!system,
            hasTools: !!convertedTools,
            toolCount: tools?.length || 0,
          })
        }

        // Create Langfuse generation if enabled
        const generationId = isLangfuseEnabled() ? randomUUID() : null
        if (generationId) {
          createLLMGeneration(sessionId || null, generationId, {
            name: "LLM Call",
            model: modelName,
            modelParameters: {
              provider: effectiveProviderId,
              hasTools: !!convertedTools,
              toolCount: tools?.length || 0,
              promptCaching: promptCaching?.strategy,
              reasoningEffort: (reasoningOptions?.openai as any)?.reasoningEffort,
            },
            input: { system, messages: convertedMessages },
          })
        }

        let result
        try {
          result = await generateText({
            model,
            system,
            messages: convertedMessages,
            abortSignal: abortController.signal,
            providerOptions: mergedProviderOptions as any,
            tools: convertedTools?.tools,
            // Allow the model to choose whether to use tools or respond with text
            toolChoice: convertedTools?.tools ? "auto" : undefined,
          })
        } catch (error) {
          // End Langfuse generation with error before rethrowing
          if (generationId) {
            endLLMGeneration(generationId, {
              level: "ERROR",
              statusMessage: error instanceof Error ? error.message : "generateText failed",
            })
          }
          throw error
        }

        // Log prompt cache metrics from usage data
        logCacheMetrics(result.usage as ExtendedUsage, promptCaching?.strategy, effectiveProviderId)

        const text = result.text?.trim() || ""

        // Check for native AI SDK tool calls first
        if (result.toolCalls && result.toolCalls.length > 0) {
          if (isDebugLLM()) {
            logLLM("✅ AI SDK native tool calls received", {
              toolCallCount: result.toolCalls.length,
              toolNames: result.toolCalls.map(tc => tc.toolName),
              textContent: text.substring(0, 100),
            })
          }

          // Convert AI SDK tool calls to our MCPToolCall format
          // Restore original tool names using the nameMap for accurate lookup
          const toolCalls = result.toolCalls.map(tc => ({
            name: restoreProviderToolName(tc.toolName, convertedTools?.nameMap),
            arguments: tc.input,
          }))

          // End Langfuse generation with tool calls
          if (generationId) {
            endLLMGeneration(generationId, {
              output: JSON.stringify({ content: text, toolCalls }),
              usage: buildTokenUsage(result.usage),
            })
          }

          // Record actual token usage for context budget calibration
          if (sessionId && result.usage?.inputTokens) {
            recordActualTokenUsage(sessionId, result.usage.inputTokens, result.usage.outputTokens ?? 0)
          }

          return {
            content: text || undefined,
            toolCalls,
          }
        }

        // No tool calls - process as text response
        if (!text && !result.toolCalls?.length && !result.reasoningSummary) {
          if (generationId) {
            endLLMGeneration(generationId, {
              level: "ERROR",
              statusMessage: "LLM returned empty response",
            })
          }
          throw new Error("LLM returned empty response")
        }

        if (isDebugLLM()) {
          logLLM("✅ AI SDK text response received", {
            textLength: text.length,
            textPreview: text.substring(0, 200),
          })
        }

        // Try to parse JSON from the response (fallback for models that respond with JSON).
        // Use `in` operator so that `{"content":""}` (empty string) is still recognised as
        // a structured response rather than falling through as raw text.
        const jsonObject = extractJsonObject(text)
        if (jsonObject && ("toolCalls" in jsonObject || "content" in jsonObject)) {
          const response = {
            content: typeof jsonObject.content === "string" ? jsonObject.content : undefined,
            toolCalls: Array.isArray(jsonObject.toolCalls)
              ? jsonObject.toolCalls
              : undefined,
          } as LLMToolCallResponse
          // Restore original tool names using nameMap if available, otherwise fallback to pattern replacement.
          // Filter out malformed items (missing/non-string name) so a bad model JSON response
          // can't crash the fetch layer.
          if (response.toolCalls) {
            response.toolCalls = response.toolCalls
              .filter(tc => tc && typeof tc.name === "string" && tc.name.length > 0)
              .map(tc => ({
                ...tc,
                name: restoreProviderToolName(tc.name, convertedTools?.nameMap),
              }))
          }
          // End Langfuse generation with JSON response
          if (generationId) {
            endLLMGeneration(generationId, {
              output: JSON.stringify(response),
              usage: buildTokenUsage(result.usage),
            })
          }
          return response
        }

        // Check for tool markers in plain text response
        const hasToolMarkers = hasRawToolCallMarkerTokens(text)
        const cleaned = stripRawToolMarkerTokens(text, { trim: true })

        // End Langfuse generation with text response.
        // When tool markers are present, log the raw text so traces accurately
        // reflect what triggered the marker-recovery path.
        if (generationId) {
          endLLMGeneration(generationId, {
            output: hasToolMarkers ? text : (cleaned || text),
            usage: buildTokenUsage(result.usage),
          })
        }

        if (hasToolMarkers) {
          // Return raw text (with markers) so the caller's own marker detection
          // can trigger the tool-marker recovery path. If we return `cleaned`
          // (markers stripped), it may be empty and the caller won't know
          // markers were present, treating it as a null/empty response instead.
          return { content: text }
        }

        return {
          content: cleaned || text,
        }
      } finally {
        unregisterSessionAbortController(abortController, sessionId)
      }
    },
    { onRetryProgress, sessionId }
  )
}

/**
 * Make a streaming LLM call with tool support using AI SDK.
 *
 * Replaces the previous two-call pattern (parallel streaming + generateText) with a
 * single streamText call that delivers both real-time text streaming AND tool calls from
 * the same model response. This eliminates the divergence between what the user sees
 * streaming and what actually executes.
 */
export async function makeLLMCallWithStreamingAndTools(
  messages: Array<{ role: string; content: string }>,
  onChunk: StreamingCallback,
  providerId?: string,
  onRetryProgress?: AgentRetryProgressCallback,
  sessionId?: string,
  tools?: MCPTool[]
): Promise<LLMToolCallResponse> {
  const effectiveProviderId = (providerId || getCurrentProviderId()) as ProviderType

  return withRetry(
    async () => {
      const abortController = createSessionAbortController(sessionId)

      const modelName = isChatGptWebProvider(effectiveProviderId)
        ? getCurrentChatGptWebModelName("mcp")
        : getCurrentModelName(effectiveProviderId)
      const convertedTools = tools && tools.length > 0
        ? convertMCPToolsToAISDKTools(tools)
        : undefined

      if (isChatGptWebProvider(effectiveProviderId)) {
        const generationId = isLangfuseEnabled() ? randomUUID() : null
        if (generationId) {
          createLLMGeneration(sessionId || null, generationId, {
            name: "Streaming LLM Call",
            model: modelName,
            modelParameters: {
              provider: effectiveProviderId,
              hasTools: !!convertedTools,
              toolCount: tools?.length || 0,
            },
            input: { messages },
          })
        }

        try {
          if (
            state.shouldStopAgent ||
            (sessionId && agentSessionStateManager.shouldStopSession(sessionId))
          ) {
            abortController.abort()
          }

          const result = await makeChatGptWebResponse(messages, {
            modelContext: "mcp",
            signal: abortController.signal,
            onTextChunk: onChunk,
            tools,
          })
          const text = result.text

          if (generationId) {
            endLLMGeneration(generationId, {
              output: result.toolCalls?.length
                ? JSON.stringify({ content: text, toolCalls: result.toolCalls })
                : text,
              usage: buildTokenUsage(result.usage),
            })
          }

          if (!text.trim() && !result.toolCalls?.length && !result.reasoningSummary) {
            throw new Error("LLM returned empty response")
          }

          if (result.toolCalls?.length) {
            return {
              content: text || undefined,
              toolCalls: result.toolCalls,
              reasoningSummary: result.reasoningSummary,
            }
          }

          return {
            content: text.trim(),
            reasoningSummary: result.reasoningSummary,
          }
        } catch (error: any) {
          if (generationId) {
            endLLMGeneration(generationId, {
              level: "ERROR",
              statusMessage: getErrorMessage(error, "Streaming+tools LLM call failed"),
            })
          }
          throw error
        } finally {
          unregisterSessionAbortController(abortController, sessionId)
        }
      }

      const model = createLanguageModel(effectiveProviderId)
      const { system, messages: convertedMessages } = convertMessages(messages)
      const promptCaching = getPromptCachingConfig(effectiveProviderId)
      const reasoningOptions = getReasoningEffortProviderOptions(effectiveProviderId)
      const mergedProviderOptions = mergeProviderOptions(
        promptCaching?.providerOptions,
        reasoningOptions,
      )

      if (isDebugLLM()) {
        logLLM("🚀 AI SDK streamText+tools call", {
          provider: effectiveProviderId,
          messagesCount: messages.length,
          hasSystem: !!system,
          hasTools: !!convertedTools,
          toolCount: tools?.length || 0,
        })
      }

      const generationId = isLangfuseEnabled() ? randomUUID() : null
      if (generationId) {
        createLLMGeneration(sessionId || null, generationId, {
          name: "Streaming LLM Call",
          model: modelName,
          modelParameters: {
            provider: effectiveProviderId,
            hasTools: !!convertedTools,
            toolCount: tools?.length || 0,
            promptCaching: promptCaching?.strategy,
            reasoningEffort: (reasoningOptions?.openai as any)?.reasoningEffort,
          },
          input: { system, messages: convertedMessages },
        })
      }

      try {
        if (
          state.shouldStopAgent ||
          (sessionId && agentSessionStateManager.shouldStopSession(sessionId))
        ) {
          abortController.abort()
        }

        const streamResult = streamText({
          model,
          system,
          messages: convertedMessages,
          abortSignal: abortController.signal,
          providerOptions: mergedProviderOptions as any,
          tools: convertedTools?.tools,
          toolChoice: convertedTools?.tools ? "auto" : undefined,
        })

        let accumulated = ""
        const collectedToolCalls: Array<{ name: string; arguments: Record<string, unknown> }> = []
        let finishUsage: { inputTokens?: number; outputTokens?: number } | undefined

        for await (const event of streamResult.fullStream) {
          if (
            state.shouldStopAgent ||
            (sessionId && agentSessionStateManager.shouldStopSession(sessionId))
          ) {
            abortController.abort()
            break
          }

          if (event.type === "text-delta") {
            accumulated += event.text
            onChunk(event.text, accumulated)
          } else if (event.type === "tool-call") {
            collectedToolCalls.push({
              name: restoreProviderToolName(event.toolName, convertedTools?.nameMap),
              arguments: event.input as Record<string, unknown>,
            })
          } else if (event.type === "finish") {
            finishUsage = event.totalUsage
          } else if (event.type === "error") {
            throw normalizeError(event.error, "Streaming request failed")
          }
        }

        if (isDebugLLM()) {
          if (collectedToolCalls.length > 0) {
            logLLM("✅ AI SDK streamText+tools: tool calls", {
              toolCallCount: collectedToolCalls.length,
              toolNames: collectedToolCalls.map(tc => tc.name),
              textContent: accumulated.substring(0, 100),
            })
          } else {
            logLLM("✅ AI SDK streamText+tools: text response", {
              textLength: accumulated.length,
              textPreview: accumulated.substring(0, 200),
            })
          }
        }

        // Log prompt cache metrics from streaming usage data
        logCacheMetrics(finishUsage as ExtendedUsage, promptCaching?.strategy, effectiveProviderId)

        if (generationId) {
          endLLMGeneration(generationId, {
            output: collectedToolCalls.length > 0
              ? JSON.stringify({ content: accumulated, toolCalls: collectedToolCalls })
              : accumulated,
            usage: buildTokenUsage(finishUsage),
          })
        }

        // Record actual token usage for context budget calibration
        if (sessionId && finishUsage?.inputTokens) {
          recordActualTokenUsage(sessionId, finishUsage.inputTokens, finishUsage.outputTokens ?? 0)
        }

        if (!accumulated && collectedToolCalls.length === 0) {
          throw new Error("LLM returned empty response")
        }

        return {
          content: accumulated || undefined,
          toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
        }
      } catch (error: any) {
        if (generationId) {
          endLLMGeneration(generationId, {
            level: "ERROR",
            statusMessage: getErrorMessage(error, "Streaming+tools LLM call failed"),
          })
        }
        throw error
      } finally {
        unregisterSessionAbortController(abortController, sessionId)
      }
    },
    { onRetryProgress, sessionId }
  )
}


/**
 * Make a simple text completion call using AI SDK
 * Used for transcript post-processing and similar text completion tasks.
 * Includes automatic retry with exponential backoff for transient failures.
 */
export async function makeTextCompletionWithFetch(
  prompt: string,
  providerId?: string,
  sessionId?: string,
  onRetryProgress?: AgentRetryProgressCallback
): Promise<string> {
  // Use transcript provider as default since this is primarily used for transcript post-processing
  const effectiveProviderId = (providerId ||
    getTranscriptProviderId()) as ProviderType

  return withRetry(
    async () => {
      const abortController = createSessionAbortController(sessionId)

      // Create Langfuse generation if enabled
      const generationId = isLangfuseEnabled() ? randomUUID() : null
      const modelName = isChatGptWebProvider(effectiveProviderId)
        ? getCurrentChatGptWebModelName("transcript")
        : getCurrentModelName(effectiveProviderId, "transcript")

      if (generationId) {
        createLLMGeneration(sessionId || null, generationId, {
          name: "Text Completion",
          model: modelName,
          modelParameters: { provider: effectiveProviderId },
          input: prompt,
        })
      }

      try {
        // Check for stop signal before starting
        if (
          state.shouldStopAgent ||
          (sessionId && agentSessionStateManager.shouldStopSession(sessionId))
        ) {
          abortController.abort()
        }

        let usage: ExtendedUsage | undefined
        const text = isChatGptWebProvider(effectiveProviderId)
          ? (await makeChatGptWebCompletion(
              [{ role: "user", content: prompt }],
              {
                modelContext: "transcript",
                signal: abortController.signal,
              },
            )).trim()
          : await (async () => {
              const model = createLanguageModel(effectiveProviderId, "transcript")
              const promptCaching = getPromptCachingConfig(effectiveProviderId, "transcript")
              const reasoningOptions = getReasoningEffortProviderOptions(effectiveProviderId, "transcript")
              const mergedProviderOptions = mergeProviderOptions(
                promptCaching?.providerOptions,
                reasoningOptions,
              )

              if (isDebugLLM()) {
                logLLM("🚀 AI SDK text completion call", {
                  provider: effectiveProviderId,
                  promptLength: prompt.length,
                })
              }

              const result = await generateText({
                model,
                prompt,
                abortSignal: abortController.signal,
                providerOptions: mergedProviderOptions as any,
              })

              // Log prompt cache metrics
              logCacheMetrics(result.usage as ExtendedUsage, promptCaching?.strategy, effectiveProviderId)
              usage = result.usage as ExtendedUsage

              return result.text?.trim() || ""
            })()

        // End Langfuse generation
        if (generationId) {
          endLLMGeneration(generationId, {
            output: text,
            usage: buildTokenUsage(usage),
          })
        }

        return text
      } catch (error) {
        // End Langfuse generation with error
        if (generationId) {
          endLLMGeneration(generationId, {
            level: "ERROR",
            statusMessage: error instanceof Error ? error.message : "Text completion failed",
          })
        }
        diagnosticsService.logError("llm-fetch", "Text completion failed", error)
        throw error
      } finally {
        unregisterSessionAbortController(abortController, sessionId)
      }
    },
    { onRetryProgress, sessionId }
  )
}

/**
 * Verify completion using AI SDK
 * Includes automatic retry with exponential backoff for transient failures.
 */
export async function verifyCompletionWithFetch(
  messages: Array<{ role: string; content: string }>,
  providerId?: string,
  sessionId?: string,
  onRetryProgress?: AgentRetryProgressCallback
): Promise<CompletionVerification> {
  const effectiveProviderId = (providerId ||
    getCurrentProviderId()) as ProviderType

  return withRetry(
    async () => {
      const abortController = createSessionAbortController(sessionId)

      try {
        // Check for stop signal before starting
        if (
          state.shouldStopAgent ||
          (sessionId && agentSessionStateManager.shouldStopSession(sessionId))
        ) {
          abortController.abort()
        }

        const modelName = isChatGptWebProvider(effectiveProviderId)
          ? getCurrentChatGptWebModelName("mcp")
          : getCurrentModelName(effectiveProviderId)

        // Create Langfuse generation if enabled
        const generationId = isLangfuseEnabled() ? randomUUID() : null
        const promptCaching = isChatGptWebProvider(effectiveProviderId)
          ? undefined
          : getPromptCachingConfig(effectiveProviderId)
        const reasoningOptions = isChatGptWebProvider(effectiveProviderId)
          ? undefined
          : getReasoningEffortProviderOptions(effectiveProviderId)
        const mergedProviderOptions = mergeProviderOptions(
          promptCaching?.providerOptions,
          reasoningOptions,
        )
        const { system, messages: convertedMessages } = convertMessages(messages)
        if (generationId) {
          createLLMGeneration(sessionId || null, generationId, {
            name: "Verification Call",
            model: modelName,
            modelParameters: {
              provider: effectiveProviderId,
              promptCaching: promptCaching?.strategy,
              reasoningEffort: (reasoningOptions?.openai as any)?.reasoningEffort,
            },
            input: { system, messages: convertedMessages },
          })
        }

        if (isDebugLLM()) {
          logLLM("🚀 AI SDK verification call", {
            provider: effectiveProviderId,
            messagesCount: messages.length,
            hasSystem: !!system,
          })
        }

        let text = ""
        let usage: ExtendedUsage | undefined
        try {
          if (isChatGptWebProvider(effectiveProviderId)) {
            text = (await makeChatGptWebCompletion(messages, {
              modelContext: "mcp",
              signal: abortController.signal,
            })).trim()
          } else {
            const model = createLanguageModel(effectiveProviderId)
            const result = await generateText({
              model,
              system,
              messages: convertedMessages,
              abortSignal: abortController.signal,
              providerOptions: mergedProviderOptions as any,
            })
            usage = result.usage as ExtendedUsage
            // Log prompt cache metrics
            logCacheMetrics(usage, promptCaching?.strategy, effectiveProviderId)
            text = result.text?.trim() || ""
          }
        } catch (error) {
          // End Langfuse generation with error before rethrowing
          if (generationId) {
            endLLMGeneration(generationId, {
              level: "ERROR",
              statusMessage: error instanceof Error ? error.message : "verification generateText failed",
            })
          }
          throw error
        }

        const jsonObject = extractJsonObject(text)

        if (jsonObject && (typeof jsonObject.isComplete === "boolean" || typeof jsonObject.conversationState === "string")) {
          const normalizedVerification = normalizeVerificationResultForCompletion(jsonObject)

          // End Langfuse generation with success
          if (generationId) {
            endLLMGeneration(generationId, {
              output: JSON.stringify(normalizedVerification),
              usage: buildTokenUsage(usage),
            })
          }
          return normalizedVerification as CompletionVerification
        }

        // End Langfuse generation with parse failure
        if (generationId) {
          endLLMGeneration(generationId, {
            output: text,
            usage: buildTokenUsage(usage),
            level: "WARNING",
            statusMessage: "Failed to parse verification response as JSON",
          })
        }

        // Conservative default
        return {
          isComplete: false,
          conversationState: "running",
          reason: "Failed to parse verification response",
        }
      } catch (error) {
        diagnosticsService.logError("llm-fetch", "Verification call failed", error)
        return {
          isComplete: false,
          reason: (error as any)?.message || "Verification failed",
        }
      } finally {
        unregisterSessionAbortController(abortController, sessionId)
      }
    },
    { onRetryProgress, sessionId }
  )
}
