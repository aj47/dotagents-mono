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
import { jsonSchema } from "ai"
import { randomUUID } from "crypto"
import {
  createLanguageModel,
  getCurrentProviderId,
  getCurrentModelName,
  getPromptCachingConfig,
  getTranscriptProviderId,
  type ProviderType,
} from "./ai-sdk-provider"
import { configStore } from "./config"
import type { LLMToolCallResponse, MCPTool } from "./mcp-service"
import { diagnosticsService } from "./diagnostics"
import { isDebugLLM, logLLM } from "./debug"
import { getErrorMessage, normalizeError } from "./error-utils"
import { normalizeVerificationResultForCompletion } from "./llm-continuation-guards"
import { state, agentSessionStateManager, llmRequestAbortManager } from "./state"
import type { AgentConversationState } from "@dotagents/shared"
import {
  createLLMGeneration,
  endLLMGeneration,
  isLangfuseEnabled,
} from "./langfuse-service"
import { recordActualTokenUsage } from "./context-budget"
import { isChatGptWebProvider, makeChatGptWebCompletion } from "./chatgpt-web-provider"

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
 * Sanitize tool name for provider compatibility.
 * Providers require tool names matching pattern: ^[a-zA-Z0-9_-]{1,128}$
 * MCP tool names often include server prefixes like "server:tool_name" and may
 * contain spaces or other special characters.
 * We replace ':' with '__COLON__' and other invalid characters with '__'
 * to ensure compatibility while maintaining reversibility through the nameMap.
 *
 * @param name - Original tool name
 * @param suffix - Optional disambiguation suffix for collision handling
 */
function sanitizeToolName(name: string, suffix?: string): string {
  // First replace colons with __COLON__ to preserve server prefix distinction
  let sanitized = name.replace(/:/g, "__COLON__")
  // Replace any remaining characters that don't match [a-zA-Z0-9_-] with underscore
  sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, "_")

  // If we have a suffix, ensure it survives truncation by reserving space for it
  // The suffix is added after truncation to prevent it from being cut off
  if (suffix) {
    const suffixStr = `_${suffix}`
    const maxBaseLength = 128 - suffixStr.length
    if (sanitized.length > maxBaseLength) {
      sanitized = sanitized.substring(0, maxBaseLength)
    }
    sanitized = `${sanitized}${suffixStr}`
  } else {
    // No suffix - simple truncation
    if (sanitized.length > 128) {
      sanitized = sanitized.substring(0, 128)
    }
  }

  return sanitized
}

/**
 * Restore original tool name from sanitized version using the provided map.
 * Falls back to simple replacement if no map is provided (for JSON response parsing).
 *
 * Note: Some LLM proxies (e.g., certain OpenAI-compatible gateways) may prepend
 * "proxy_" to tool names in responses. We strip this prefix only when we have
 * a toolNameMap to verify the mapping, to avoid conflicts with legitimate tools
 * whose names actually start with "proxy_".
 */
function restoreToolName(sanitizedName: string, toolNameMap?: Map<string, string>): string {
  // First, try exact match with the sanitized name (handles legitimate "proxy_" prefixed tools)
  if (toolNameMap && toolNameMap.has(sanitizedName)) {
    return toolNameMap.get(sanitizedName)!
  }

  // If no exact match, we have a map, and name starts with "proxy_", try stripping the prefix
  // This handles LLM proxies that prepend "proxy_" to tool names in responses
  // We only do this when toolNameMap is provided so we can verify the stripped name exists
  if (toolNameMap && sanitizedName.startsWith("proxy_")) {
    const cleanedName = sanitizedName.slice(6) // Remove "proxy_" prefix (6 chars)
    if (toolNameMap.has(cleanedName)) {
      return toolNameMap.get(cleanedName)!
    }
  }

  // Fallback: reverse the sanitization for JSON responses where we don't have the map
  // We don't strip "proxy_" here since we can't verify if it's a legitimate tool name
  return sanitizedName.replace(/__COLON__/g, ":")
}

/**
 * Normalize tool JSON schema for OpenAI-compatible function calling.
 *
 * Some providers reject top-level composition keywords (`anyOf`/`oneOf`/`allOf`/`not`/`enum`)
 * even when the schema is otherwise valid JSON Schema. We keep runtime validation in the
 * tool implementation and send a provider-safe shape here to avoid hard 400 failures.
 */
function normalizeToolInputSchema(inputSchema: unknown): Record<string, unknown> {
  const fallback: Record<string, unknown> = { type: "object", properties: {}, required: [] }

  if (!inputSchema || typeof inputSchema !== "object" || Array.isArray(inputSchema)) {
    return fallback
  }

  const schema = { ...(inputSchema as Record<string, unknown>) }
  const schemaType = schema.type

  // OpenAI function tools expect top-level object schemas.
  if (schemaType !== undefined && schemaType !== "object") {
    return fallback
  }
  schema.type = "object"

  if (!schema.properties || typeof schema.properties !== "object" || Array.isArray(schema.properties)) {
    schema.properties = {}
  }

  if (!Array.isArray(schema.required)) {
    schema.required = []
  }

  // Remove top-level combinators that OpenAI-compatible gateways may reject.
  delete schema.anyOf
  delete schema.oneOf
  delete schema.allOf
  delete schema.not
  delete schema.enum

  return schema
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
    let sanitizedName = sanitizeToolName(mcpTool.name)

    // Handle collision: if this sanitized name already exists with a different original name,
    // add a deterministic disambiguation suffix to make it unique
    if (nameMap.has(sanitizedName) && nameMap.get(sanitizedName) !== mcpTool.name) {
      const existingOriginal = nameMap.get(sanitizedName)
      logLLM(`⚠️ Tool name collision detected: "${mcpTool.name}" and "${existingOriginal}" both sanitize to "${sanitizedName}"`)

      // Get or initialize collision counter for this base name
      const count = (collisionCount.get(sanitizedName) || 0) + 1
      collisionCount.set(sanitizedName, count)

      // Generate a unique name with numeric suffix
      sanitizedName = sanitizeToolName(mcpTool.name, String(count))
      logLLM(`   Disambiguated to: "${sanitizedName}"`)
    }

    // Store the mapping from sanitized name to original name
    nameMap.set(sanitizedName, mcpTool.name)

    // Create AI SDK tool with JSON schema (not Zod)
    tools[sanitizedName] = aiTool({
      description: mcpTool.description || `Tool: ${mcpTool.name}`,
      inputSchema: jsonSchema(normalizeToolInputSchema(mcpTool.inputSchema)),
      // No execute function - we handle execution separately via MCP
    })
  }

  return { tools, nameMap }
}

/**
 * Callback for reporting retry progress to the UI
 */
export type RetryProgressCallback = (info: {
  isRetrying: boolean
  attempt: number
  maxAttempts?: number // undefined for rate limits (infinite retries)
  delaySeconds: number
  reason: string
  startedAt: number
}) => void

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
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt)
  const cappedDelay = Math.min(exponentialDelay, maxDelay)
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1)
  return Math.max(0, cappedDelay + jitter)
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
 * Check if an error is an empty response error.
 * Empty responses should fail fast without backoff since they typically indicate:
 * - API endpoint issues
 * - Authentication problems
 * - Malformed requests
 * These won't resolve by waiting, so exponential backoff wastes time.
 * See: https://github.com/aj47/dotagents-mono/issues/964
 */
function isEmptyResponseError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes("empty response") ||
      message.includes("empty content") ||
      message.includes("no text") ||
      message.includes("no content")
    )
  }
  return false
}

/**
 * Check if an error is retryable.
 * Uses AI SDK structured error fields (statusCode, isRetryable) when available,
 * with fallback to message-based detection for consistency across providers.
 *
 * NOTE: Empty response errors are handled separately - they retry immediately
 * without backoff (see withRetry function).
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Abort errors should never be retried
    if (
      error.name === "AbortError" ||
      error.message.toLowerCase().includes("abort")
    ) {
      return false
    }

    // Empty response errors are retryable but WITHOUT backoff
    // They are handled specially in withRetry - return true here so they're not rejected outright
    if (isEmptyResponseError(error)) {
      return true
    }

    // Check for AI SDK structured error fields (AI_APICallError, etc.)
    // These errors have statusCode and isRetryable properties
    const errorWithStatus = error as { statusCode?: number; isRetryable?: boolean; status?: number }

    // If the error has an explicit isRetryable flag, use it
    if (typeof errorWithStatus.isRetryable === "boolean") {
      return errorWithStatus.isRetryable
    }

    // Check for statusCode or status field (AI SDK errors use statusCode)
    const statusCode = errorWithStatus.statusCode ?? errorWithStatus.status
    if (typeof statusCode === "number") {
      // Rate limits (429) are always retryable
      if (statusCode === 429) {
        return true
      }
      // Server errors (5xx) are retryable
      if (statusCode >= 500 && statusCode < 600) {
        return true
      }
      // Timeout errors
      if (statusCode === 408 || statusCode === 504) {
        return true
      }
      // Client errors (4xx except 429, 408) are not retryable
      if (statusCode >= 400 && statusCode < 500) {
        return false
      }
    }

    // Fallback: message-based detection for transient network issues
    // NOTE: empty response/content removed - handled separately without backoff
    const message = error.message.toLowerCase()
    return (
      message.includes("rate limit") ||
      message.includes("429") ||
      message.includes("500") ||
      message.includes("502") ||
      message.includes("503") ||
      message.includes("504") ||
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("connection")
    )
  }
  return false
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
    onRetryProgress?: RetryProgressCallback
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
      if (!isRetryableError(error)) {
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

      // Check for rate limit (429) using structured error fields when available
      let isRateLimit = false
      if (error instanceof Error) {
        // Check for AI SDK structured error fields (AI_APICallError, etc.)
        const errorWithStatus = error as { statusCode?: number; status?: number }
        const statusCode = errorWithStatus.statusCode ?? errorWithStatus.status

        if (typeof statusCode === "number" && statusCode === 429) {
          isRateLimit = true
        } else {
          // Fallback to message-based detection for errors without structured fields
          const message = error.message.toLowerCase()
          isRateLimit = message.includes("429") || message.includes("rate limit")
        }
      }

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

      const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay)
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
function convertMessages(messages: Array<{ role: string; content: string }>): {
  system: string | undefined
  messages: Array<{ role: "user" | "assistant"; content: string }>
} {
  const systemMessages: string[] = []
  const otherMessages: Array<{ role: "user" | "assistant"; content: string }> =
    []

  for (const msg of messages) {
    if (msg.role === "system") {
      systemMessages.push(msg.content)
    } else {
      otherMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
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
  onRetryProgress?: RetryProgressCallback,
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
          const modelName = getCurrentModelName(effectiveProviderId)
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

          let text: string
          try {
            text = (await makeChatGptWebCompletion(messages, {
              modelContext: "mcp",
              signal: abortController.signal,
            })).trim()
          } catch (error) {
            if (generationId) {
              endLLMGeneration(generationId, {
                level: "ERROR",
                statusMessage: error instanceof Error ? error.message : "chatgpt-web call failed",
              })
            }
            throw error
          }

          if (!text) {
            if (generationId) {
              endLLMGeneration(generationId, {
                level: "ERROR",
                statusMessage: "LLM returned empty response",
              })
            }
            throw new Error("LLM returned empty response")
          }

          const jsonObject = extractJsonObject(text)
          if (jsonObject && ("toolCalls" in jsonObject || "content" in jsonObject)) {
            const response = {
              content: typeof jsonObject.content === "string" ? jsonObject.content : undefined,
              toolCalls: Array.isArray(jsonObject.toolCalls)
                ? jsonObject.toolCalls.filter(tc => tc && typeof tc.name === "string" && tc.name.length > 0)
                : undefined,
            } as LLMToolCallResponse

            if (generationId) {
              endLLMGeneration(generationId, {
                output: JSON.stringify(response),
              })
            }
            return response
          }

          const hasToolMarkers =
            /<\|tool_calls_section_begin\|>|<\|tool_call_begin\|>/i.test(text)
          const cleaned = text.replace(/<\|[^|]*\|>/g, "").trim()

          if (generationId) {
            endLLMGeneration(generationId, {
              output: hasToolMarkers ? text : (cleaned || text),
            })
          }

          if (hasToolMarkers) {
            return { content: text }
          }

          return {
            content: cleaned || text,
          }
        }

        const model = createLanguageModel(effectiveProviderId)
        const { system, messages: convertedMessages } = convertMessages(messages)
        const promptCaching = getPromptCachingConfig(effectiveProviderId)

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
            providerOptions: promptCaching?.providerOptions as any,
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
            name: restoreToolName(tc.toolName, convertedTools?.nameMap),
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
        if (!text && !result.toolCalls?.length) {
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
                name: restoreToolName(tc.name, convertedTools?.nameMap),
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
        const hasToolMarkers =
          /<\|tool_calls_section_begin\|>|<\|tool_call_begin\|>/i.test(text)
        const cleaned = text.replace(/<\|[^|]*\|>/g, "").trim()

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
  onRetryProgress?: RetryProgressCallback,
  sessionId?: string,
  tools?: MCPTool[]
): Promise<LLMToolCallResponse> {
  const effectiveProviderId = (providerId || getCurrentProviderId()) as ProviderType

  return withRetry(
    async () => {
      const abortController = createSessionAbortController(sessionId)

      const modelName = getCurrentModelName(effectiveProviderId)
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

          const text = await makeChatGptWebCompletion(messages, {
            modelContext: "mcp",
            signal: abortController.signal,
            onTextChunk: onChunk,
          })

          if (generationId) {
            endLLMGeneration(generationId, { output: text })
          }

          if (!text.trim()) {
            throw new Error("LLM returned empty response")
          }

          const jsonObject = extractJsonObject(text)
          if (jsonObject && ("toolCalls" in jsonObject || "content" in jsonObject)) {
            const toolCalls = Array.isArray(jsonObject.toolCalls)
              ? jsonObject.toolCalls
                  .filter(tc => tc && typeof tc.name === "string" && tc.name.length > 0)
                  .map(tc => ({
                    ...tc,
                    name: restoreToolName(tc.name, convertedTools?.nameMap),
                  }))
              : undefined
            return {
              content: typeof jsonObject.content === "string" ? jsonObject.content : undefined,
              toolCalls,
            }
          }

          return {
            content: text.trim(),
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
          providerOptions: promptCaching?.providerOptions as any,
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
              name: restoreToolName(event.toolName, convertedTools?.nameMap),
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
  onRetryProgress?: RetryProgressCallback
): Promise<string> {
  // Use transcript provider as default since this is primarily used for transcript post-processing
  const effectiveProviderId = (providerId ||
    getTranscriptProviderId()) as ProviderType

  return withRetry(
    async () => {
      const abortController = createSessionAbortController(sessionId)

      // Create Langfuse generation if enabled
      const generationId = isLangfuseEnabled() ? randomUUID() : null
      const modelName = getCurrentModelName(effectiveProviderId, "transcript")

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
                providerOptions: promptCaching?.providerOptions as any,
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
  onRetryProgress?: RetryProgressCallback
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

        const modelName = getCurrentModelName(effectiveProviderId)

        // Create Langfuse generation if enabled
        const generationId = isLangfuseEnabled() ? randomUUID() : null
        const promptCaching = isChatGptWebProvider(effectiveProviderId)
          ? undefined
          : getPromptCachingConfig(effectiveProviderId)
        const { system, messages: convertedMessages } = convertMessages(messages)
        if (generationId) {
          createLLMGeneration(sessionId || null, generationId, {
            name: "Verification Call",
            model: modelName,
            modelParameters: {
              provider: effectiveProviderId,
              promptCaching: promptCaching?.strategy,
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
              providerOptions: promptCaching?.providerOptions as any,
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
