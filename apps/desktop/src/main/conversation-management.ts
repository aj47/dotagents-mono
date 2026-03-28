import {
  removeSessionIdFromConversationSessionState,
  sanitizeConversationSessionState,
} from "@dotagents/shared"
import { agentSessionTracker } from "./agent-session-tracker"
import { configStore } from "./config"
import { conversationService } from "./conversation-service"
import type {
  Conversation,
  ConversationHistoryItem,
  Config,
} from "@shared/types"

function areStringListsEqual(
  a: readonly string[],
  b: readonly string[],
): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function saveConversationSessionState(config: Config): void {
  configStore.save(config)
}

function removeConversationFromSessionState(conversationId: string): void {
  const currentConfig = configStore.get()
  const currentSessionState = sanitizeConversationSessionState(currentConfig)
  const nextSessionState = removeSessionIdFromConversationSessionState(
    currentSessionState,
    conversationId,
  )

  if (
    areStringListsEqual(
      nextSessionState.pinnedSessionIds,
      currentSessionState.pinnedSessionIds,
    ) &&
    areStringListsEqual(
      nextSessionState.archivedSessionIds,
      currentSessionState.archivedSessionIds,
    )
  ) {
    return
  }

  saveConversationSessionState({
    ...currentConfig,
    ...nextSessionState,
  })
}

function clearConversationSessionState(): void {
  const currentConfig = configStore.get()
  const currentSessionState = sanitizeConversationSessionState(currentConfig)

  if (
    currentSessionState.pinnedSessionIds.length === 0 &&
    currentSessionState.archivedSessionIds.length === 0
  ) {
    return
  }

  saveConversationSessionState({
    ...currentConfig,
    pinnedSessionIds: [],
    archivedSessionIds: [],
  })
}

function syncConversationTitleAcrossTrackedSessions(
  conversationId: string,
  title: string,
): void {
  for (const session of agentSessionTracker.getActiveSessions()) {
    if (session.conversationId !== conversationId) {
      continue
    }

    agentSessionTracker.updateSession(session.id, {
      conversationTitle: title,
    })
  }
}

export async function getManagedConversationHistory(): Promise<
  ConversationHistoryItem[]
> {
  return conversationService.getConversationHistory()
}

export async function getManagedConversation(
  conversationId: string,
): Promise<Conversation | null> {
  return conversationService.loadConversation(conversationId)
}

export async function saveManagedConversation(
  conversation: Conversation,
  options: {
    preserveTimestamp?: boolean
  } = {},
): Promise<void> {
  await conversationService.saveConversation(
    conversation,
    options.preserveTimestamp ?? false,
  )
}

export async function createManagedConversation(
  firstMessage: string,
  role: "user" | "assistant" = "user",
): Promise<Conversation> {
  return conversationService.createConversation(firstMessage, role)
}

export async function addManagedMessageToConversation(
  conversationId: string,
  content: string,
  role: "user" | "assistant" | "tool",
  toolCalls?: Array<{ name: string; arguments: any }>,
  toolResults?: Array<{ success: boolean; content: string; error?: string }>,
): Promise<Conversation | null> {
  return conversationService.addMessageToConversation(
    conversationId,
    content,
    role,
    toolCalls,
    toolResults,
  )
}

export async function renameConversationTitleAndSyncSession(
  conversationId: string,
  title: string,
): Promise<Conversation | null> {
  const conversation = await conversationService.renameConversationTitle(
    conversationId,
    title,
  )

  if (conversation) {
    syncConversationTitleAcrossTrackedSessions(
      conversationId,
      conversation.title,
    )
  }

  return conversation
}

export async function deleteConversationAndSyncSessionState(
  conversationId: string,
): Promise<void> {
  await conversationService.deleteConversation(conversationId)
  removeConversationFromSessionState(conversationId)
}

export async function deleteAllConversationsAndSyncSessionState(): Promise<void> {
  await conversationService.deleteAllConversations()
  clearConversationSessionState()
}
