import { BrowserWindow } from "electron"
import { diagnosticsService } from "./diagnostics"
import { configStore } from "./config"
import {
  buildSamplingChatMessages,
  stripSamplingToolMarkerTokens,
  type SamplingRequest,
  type SamplingResult,
} from "@dotagents/shared/mcp-api"
import { resolveMcpSamplingModelSelection } from "@dotagents/shared/providers"

interface PendingSampling {
  request: SamplingRequest
  resolve: (result: SamplingResult) => void
  reject: (error: Error) => void
  timeoutId?: ReturnType<typeof setTimeout>
}

// Store pending sampling requests by requestId
const pendingSamplingRequests = new Map<string, PendingSampling>()

// Default timeout for sampling requests (2 minutes)
const SAMPLING_TIMEOUT_MS = 2 * 60 * 1000

/**
 * Request sampling approval from the user and execute the LLM call
 */
export async function requestSampling(
  request: SamplingRequest
): Promise<SamplingResult> {
  diagnosticsService.logInfo(
    "mcp-sampling",
    `Sampling request from server ${request.serverName}: ${request.messages.length} messages, maxTokens=${request.maxTokens}`
  )

  const config = configStore.get()
  
  // Check if approval is required
  if (config.mcpRequireApprovalBeforeToolCall) {
    // Send to UI for approval
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        pendingSamplingRequests.delete(request.requestId)
        resolve({ approved: false })
      }, SAMPLING_TIMEOUT_MS)

      pendingSamplingRequests.set(request.requestId, {
        request,
        resolve,
        reject,
        timeoutId,
      })

      const mainWindow = BrowserWindow.getAllWindows().find(w => !w.isDestroyed())
      if (mainWindow) {
        mainWindow.webContents.send("mcp:sampling-request", request)
      } else {
        clearTimeout(timeoutId)
        pendingSamplingRequests.delete(request.requestId)
        resolve({ approved: false })
      }
    })
  }

  // Auto-approve and execute
  return executeSampling(request)
}

/**
 * Execute the actual sampling (LLM call)
 */
export async function executeSampling(
  request: SamplingRequest
): Promise<SamplingResult> {
  try {
    // Import LLM functions dynamically to avoid circular dependencies
    const { makeLLMCallWithFetch } = await import("./llm-fetch")
    const config = configStore.get()

    const messages = buildSamplingChatMessages(request)

    const { providerId, model } = resolveMcpSamplingModelSelection(config, request.modelPreferences?.hints)

    // Execute the LLM call
    const result = await makeLLMCallWithFetch(messages, providerId)

    // Strip any raw tool-marker tokens (e.g. <|tool_call_begin|>) that
    // makeLLMCallWithFetch now preserves for the agent loop's recovery path.
    // Sampling responses go back to MCP servers and should never contain them.
    // Only strip and trim when markers are actually present to preserve exact
    // whitespace/formatting for MCP servers that depend on it.
    const cleanContent = stripSamplingToolMarkerTokens(result.content)

    return {
      approved: true,
      model,
      content: {
        type: "text",
        text: cleanContent,
      },
      stopReason: "endTurn",
    }
  } catch (error) {
    diagnosticsService.logError(
      "mcp-sampling",
      "Failed to execute sampling request",
      error
    )
    return {
      approved: true,
      model: "unknown",
      content: {
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
      stopReason: "endTurn",
    }
  }
}

/**
 * Resolve a pending sampling request with user decision
 */
export async function resolveSampling(
  requestId: string,
  approved: boolean
): Promise<boolean> {
  const pending = pendingSamplingRequests.get(requestId)
  if (!pending) {
    diagnosticsService.logWarning(
      "mcp-sampling",
      `No pending sampling request found for requestId: ${requestId}`
    )
    return false
  }

  if (pending.timeoutId) {
    clearTimeout(pending.timeoutId)
  }
  pendingSamplingRequests.delete(requestId)

  if (approved) {
    // Execute the sampling and resolve with result
    const result = await executeSampling(pending.request)
    pending.resolve(result)
  } else {
    pending.resolve({ approved: false })
  }

  return true
}

/**
 * Cancel all pending sampling requests
 */
export function cancelAllSamplingRequests(serverName?: string): void {
  for (const [requestId, pending] of pendingSamplingRequests.entries()) {
    if (!serverName || pending.request.serverName === serverName) {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId)
      }
      pendingSamplingRequests.delete(requestId)
      pending.resolve({ approved: false })
    }
  }
}
