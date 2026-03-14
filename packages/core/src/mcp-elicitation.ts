/**
 * MCP Elicitation — platform-agnostic elicitation request management.
 *
 * Desktop (Electron): sends elicitation requests to renderer via BrowserWindow.
 * CLI: uses terminal prompts.
 *
 * This module uses the UserInteraction and ProgressEmitter interfaces
 * instead of direct Electron APIs.
 */

import { diagnosticsService } from "./diagnostics"
import type { ElicitationRequest, ElicitationResult, ElicitationUrlRequest } from "./types"
import type { UserInteraction } from "./interfaces/user-interaction"
import type { ProgressEmitter } from "./interfaces/progress-emitter"

interface PendingElicitation {
  request: ElicitationRequest
  resolve: (result: ElicitationResult) => void
  reject: (error: Error) => void
  timeoutId?: ReturnType<typeof setTimeout>
}

// Store pending elicitations by requestId
const pendingElicitations = new Map<string, PendingElicitation>()

// Default timeout for elicitation requests (5 minutes)
const ELICITATION_TIMEOUT_MS = 5 * 60 * 1000

// Injected platform adapters
let _userInteraction: UserInteraction | null = null
let _progressEmitter: ProgressEmitter | null = null

/**
 * Set the UserInteraction adapter for elicitation.
 * Must be called at app startup before any elicitation requests.
 */
export function setElicitationUserInteraction(ui: UserInteraction): void {
  _userInteraction = ui
}

/**
 * Set the ProgressEmitter adapter for elicitation UI notifications.
 */
export function setElicitationProgressEmitter(emitter: ProgressEmitter): void {
  _progressEmitter = emitter
}

/**
 * Request elicitation from the user via the UI
 * Returns a promise that resolves when the user responds
 */
export async function requestElicitation(
  request: ElicitationRequest
): Promise<ElicitationResult> {
  diagnosticsService.logInfo(
    "mcp-elicitation",
    `Requesting ${request.mode} elicitation from server ${request.serverName}: ${request.message}`
  )

  return new Promise((resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      pendingElicitations.delete(request.requestId)
      resolve({ action: "cancel" })
    }, ELICITATION_TIMEOUT_MS)

    // Store the pending elicitation
    pendingElicitations.set(request.requestId, {
      request,
      resolve,
      reject,
      timeoutId,
    })

    // Emit elicitation request event for the UI layer to handle
    if (_progressEmitter) {
      _progressEmitter.emitEvent("mcp:elicitation-request", request)
    }

    // For URL mode, also open the URL in the default browser
    if (request.mode === "url" && _userInteraction) {
      _userInteraction.openExternal((request as ElicitationUrlRequest).url)
    }

    // If no progress emitter is available, cancel the elicitation
    if (!_progressEmitter) {
      clearTimeout(timeoutId)
      pendingElicitations.delete(request.requestId)
      resolve({ action: "cancel" })
    }
  })
}

/**
 * Resolve a pending elicitation with a user response
 * Called from the UI when user submits/cancels the dialog
 */
export function resolveElicitation(
  requestId: string,
  result: ElicitationResult
): boolean {
  const pending = pendingElicitations.get(requestId)
  if (!pending) {
    diagnosticsService.logWarning(
      "mcp-elicitation",
      `No pending elicitation found for requestId: ${requestId}`
    )
    return false
  }

  // Clear timeout and remove from pending
  if (pending.timeoutId) {
    clearTimeout(pending.timeoutId)
  }
  pendingElicitations.delete(requestId)

  // Resolve the promise
  diagnosticsService.logInfo(
    "mcp-elicitation",
    `Elicitation ${requestId} resolved with action: ${result.action}`
  )
  pending.resolve(result)
  return true
}

/**
 * Handle URL elicitation completion notification from server
 * Called when server sends notifications/elicitation/complete
 */
export function handleElicitationComplete(elicitationId: string): void {
  // Find pending elicitation with matching elicitationId
  for (const [requestId, pending] of pendingElicitations.entries()) {
    if (
      pending.request.mode === "url" &&
      (pending.request as ElicitationUrlRequest).elicitationId === elicitationId
    ) {
      // Auto-resolve URL elicitations on completion
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId)
      }
      pendingElicitations.delete(requestId)
      pending.resolve({ action: "accept" })
      
      diagnosticsService.logInfo(
        "mcp-elicitation",
        `URL elicitation ${elicitationId} completed by server`
      )
      
      // Notify UI to close the dialog
      if (_progressEmitter) {
        _progressEmitter.emitEvent("mcp:elicitation-complete", { elicitationId, requestId })
      }
      return
    }
  }
}

/**
 * Cancel all pending elicitations (e.g., on server disconnect)
 */
export function cancelAllElicitations(serverName?: string): void {
  for (const [requestId, pending] of pendingElicitations.entries()) {
    if (!serverName || pending.request.serverName === serverName) {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId)
      }
      pendingElicitations.delete(requestId)
      pending.resolve({ action: "cancel" })
    }
  }
}

/**
 * Get pending elicitation count (for debugging/status)
 */
export function getPendingElicitationCount(): number {
  return pendingElicitations.size
}
