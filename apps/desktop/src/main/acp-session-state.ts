/**
 * ACP Session State Manager
 *
 * Manages mapping between DotAgents conversations and ACP sessions.
 * This allows maintaining context across multiple prompts in the same conversation
 * when using an ACP agent as the main agent.
 */

import { logApp } from "./debug"

/**
 * Information about an active ACP session
 */
export interface ACPSessionInfo {
  /** The ACP session ID */
  sessionId: string
  /** Name of the ACP agent */
  agentName: string
  /** Timestamp when the session was created */
  createdAt: number
  /** Timestamp when the session was last used */
  lastUsedAt: number
}

// In-memory storage for conversation-to-session mapping
const conversationSessions: Map<string, ACPSessionInfo> = new Map()

// Mapping from ACP session ID → DotAgents session ID
// This is needed for routing tool approval requests to the correct UI session
const acpToAppSession: Map<string, string> = new Map()
// Mapping from ACP session ID → DotAgents run ID
// Used so ACP-originated updates can be tagged with the originating run.
const acpToAppRunId: Map<string, number> = new Map()

// Mapping from injected MCP client token → ACP session ID.
// The token is embedded in the injected MCP base URL so remote MCP requests can
// resolve back to the correct ACP session, then to the DotAgents session/profile.
const acpClientTokenToSession: Map<string, string> = new Map()
const acpSessionToClientToken: Map<string, string> = new Map()
const pendingClientTokenToAppSession: Map<string, string> = new Map()

/**
 * Get the ACP session for a conversation (if any).
 * @param conversationId The DotAgents conversation ID
 * @returns Session info if exists, undefined otherwise
 */
export function getSessionForConversation(conversationId: string): ACPSessionInfo | undefined {
  return conversationSessions.get(conversationId)
}

/**
 * Set/update the ACP session for a conversation.
 * @param conversationId The DotAgents conversation ID
 * @param sessionId The ACP session ID
 * @param agentName The name of the ACP agent
 */
export function setSessionForConversation(
  conversationId: string,
  sessionId: string,
  agentName: string
): void {
  const now = Date.now()
  const existing = conversationSessions.get(conversationId)

  if (existing) {
    // Update existing session info
    existing.sessionId = sessionId
    existing.agentName = agentName
    existing.lastUsedAt = now
    logApp(`[ACP Session] Updated session for conversation ${conversationId}: ${sessionId}`)
  } else {
    // Create new session info
    conversationSessions.set(conversationId, {
      sessionId,
      agentName,
      createdAt: now,
      lastUsedAt: now,
    })
    logApp(`[ACP Session] Created session mapping for conversation ${conversationId}: ${sessionId}`)
  }
}

/**
 * Clear the session for a conversation.
 * Use when user explicitly requests a new session or when conversation is deleted.
 * @param conversationId The DotAgents conversation ID
 */
export function clearSessionForConversation(conversationId: string): void {
  if (conversationSessions.has(conversationId)) {
    conversationSessions.delete(conversationId)
    logApp(`[ACP Session] Cleared session for conversation ${conversationId}`)
  }
}

/**
 * Clear all sessions.
 * Use on app shutdown or when ACP agent is restarted.
 */
export function clearAllSessions(): void {
  const count = conversationSessions.size
  conversationSessions.clear()
  logApp(`[ACP Session] Cleared all ${count} sessions`)
}

/**
 * Get all active sessions.
 * Useful for debugging and UI display.
 * @returns Map of conversation ID to session info
 */
export function getAllSessions(): Map<string, ACPSessionInfo> {
  return new Map(conversationSessions)
}

/**
 * Update the last used timestamp for a session.
 * @param conversationId The DotAgents conversation ID
 */
export function touchSession(conversationId: string): void {
  const session = conversationSessions.get(conversationId)
  if (session) {
    session.lastUsedAt = Date.now()
  }
}

/**
 * Map an ACP session ID to a DotAgents session ID.
 * This is needed for routing tool approval requests to the correct UI session.
 * @param acpSessionId The ACP agent's session ID
 * @param appSessionId The DotAgents internal session ID (for UI progress tracking)
 */
export function setAcpToAppSessionMapping(
  acpSessionId: string,
  appSessionId: string,
  appRunId?: number,
): void {
  acpToAppSession.set(acpSessionId, appSessionId)
  if (typeof appRunId === "number") {
    acpToAppRunId.set(acpSessionId, appRunId)
  } else {
    acpToAppRunId.delete(acpSessionId)
  }
  logApp(`[ACP Session] Mapped ACP session ${acpSessionId} → app session ${appSessionId}`)
}

/** @deprecated Use setAcpToAppSessionMapping instead */
export const setAcpToSpeakMcpSessionMapping = setAcpToAppSessionMapping

/**
 * Register the client-side token embedded in an injected MCP server URL.
 */
export function setAcpClientSessionTokenMapping(clientSessionToken: string, acpSessionId: string): void {
  const previousToken = acpSessionToClientToken.get(acpSessionId)
  if (previousToken && previousToken !== clientSessionToken) {
    clearAcpClientSessionTokenMapping(previousToken)
  }

  acpClientTokenToSession.set(clientSessionToken, acpSessionId)
  acpSessionToClientToken.set(acpSessionId, clientSessionToken)
}

/**
 * Register the app session associated with a pending injected MCP client token.
 * This lets injected MCP routes resolve the profile context during session/new-time
 * tool discovery before the ACP session ID is available for ACP→app mapping.
 */
export function setPendingAcpClientSessionTokenMapping(clientSessionToken: string, appSessionId: string): void {
  pendingClientTokenToAppSession.set(clientSessionToken, appSessionId)
}

/**
 * Resolve the ACP session associated with an injected MCP client token.
 */
export function getAcpSessionForClientSessionToken(clientSessionToken: string): string | undefined {
  return acpClientTokenToSession.get(clientSessionToken)
}

/**
 * Resolve the pending app session associated with an injected MCP client token.
 */
export function getPendingAppSessionForClientSessionToken(clientSessionToken: string): string | undefined {
  return pendingClientTokenToAppSession.get(clientSessionToken)
}

/**
 * Get the DotAgents session ID for a given ACP session ID.
 * @param acpSessionId The ACP agent's session ID
 * @returns The DotAgents session ID, or undefined if not mapped
 */
export function getAppSessionForAcpSession(acpSessionId: string): string | undefined {
  return acpToAppSession.get(acpSessionId)
}

/** @deprecated Use getAppSessionForAcpSession instead */
export const getSpeakMcpSessionForAcpSession = getAppSessionForAcpSession

/**
 * Get the DotAgents run ID for a given ACP session ID.
 * @param acpSessionId The ACP agent's session ID
 * @returns The DotAgents run ID, or undefined if not mapped
 */
export function getAppRunIdForAcpSession(acpSessionId: string): number | undefined {
  return acpToAppRunId.get(acpSessionId)
}

/**
 * Clear all mappings associated with an injected MCP client token.
 */
export function clearAcpClientSessionTokenMapping(clientSessionToken: string): void {
  const acpSessionId = acpClientTokenToSession.get(clientSessionToken)
  if (acpSessionId && acpSessionToClientToken.get(acpSessionId) === clientSessionToken) {
    acpSessionToClientToken.delete(acpSessionId)
  }

  acpClientTokenToSession.delete(clientSessionToken)
  pendingClientTokenToAppSession.delete(clientSessionToken)
}

/**
 * Clear the ACP → DotAgents session mapping.
 * @param acpSessionId The ACP session ID to remove
 */
export function clearAcpToAppSessionMapping(acpSessionId: string): void {
  const removedAppSession = acpToAppSession.delete(acpSessionId)
  const removedRunId = acpToAppRunId.delete(acpSessionId)

  const clientSessionToken = acpSessionToClientToken.get(acpSessionId)
  if (clientSessionToken) {
    clearAcpClientSessionTokenMapping(clientSessionToken)
  }

  if (removedAppSession || removedRunId || clientSessionToken) {
    logApp(`[ACP Session] Cleared ACP → app session mapping for ${acpSessionId}`)
  }
}

/** @deprecated Use clearAcpToAppSessionMapping instead */
export const clearAcpToSpeakMcpSessionMapping = clearAcpToAppSessionMapping
