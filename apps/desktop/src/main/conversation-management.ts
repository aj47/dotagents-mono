import {
  sanitizeSessionIdList,
  setSessionIdMembership,
} from "@dotagents/shared"
import { agentSessionTracker } from "./agent-session-tracker"
import { configStore } from "./config"
import { conversationService } from "./conversation-service"
import type { Conversation, Config } from "@shared/types"

function areStringListsEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function saveConversationSessionState(config: Config): void {
  configStore.save(config)
}

function removeConversationFromSessionState(conversationId: string): void {
  const currentConfig = configStore.get()
  const nextPinnedSessionIds = setSessionIdMembership(
    sanitizeSessionIdList(currentConfig.pinnedSessionIds),
    conversationId,
    false,
  )
  const nextArchivedSessionIds = setSessionIdMembership(
    sanitizeSessionIdList(currentConfig.archivedSessionIds),
    conversationId,
    false,
  )

  if (
    areStringListsEqual(
      nextPinnedSessionIds,
      sanitizeSessionIdList(currentConfig.pinnedSessionIds),
    ) &&
    areStringListsEqual(
      nextArchivedSessionIds,
      sanitizeSessionIdList(currentConfig.archivedSessionIds),
    )
  ) {
    return
  }

  saveConversationSessionState({
    ...currentConfig,
    pinnedSessionIds: nextPinnedSessionIds,
    archivedSessionIds: nextArchivedSessionIds,
  })
}

function clearConversationSessionState(): void {
  const currentConfig = configStore.get()
  const currentPinnedSessionIds = sanitizeSessionIdList(
    currentConfig.pinnedSessionIds,
  )
  const currentArchivedSessionIds = sanitizeSessionIdList(
    currentConfig.archivedSessionIds,
  )

  if (
    currentPinnedSessionIds.length === 0 &&
    currentArchivedSessionIds.length === 0
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

export async function renameConversationTitleAndSyncSession(
  conversationId: string,
  title: string,
): Promise<Conversation | null> {
  const conversation = await conversationService.renameConversationTitle(
    conversationId,
    title,
  )

  if (conversation) {
    syncConversationTitleAcrossTrackedSessions(conversationId, conversation.title)
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
