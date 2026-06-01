/**
 * Conversation Sync Service
 * Handles syncing chat sessions between mobile and desktop.
 */

import { isFallbackTitleSource, isTitleSource, type Session, type ChatMessage, type TitleSource } from '../types/session';
import {
  SettingsApiClient,
  ServerConversation,
  ServerConversationFull,
  ServerConversationMessage
} from './settingsApi';

export interface SyncResult {
  pulled: number;  // Number of conversations pulled from server
  pushed: number;  // Number of conversations pushed to server
  updated: number; // Number of conversations updated
  errors: string[];
}

export interface SyncableSession extends Session {
  // Session already has serverConversationId optional field
}

export interface SyncConversationOptions {
  /**
   * Session IDs that are in the middle of creating their first server-side
   * conversation through /v1/chat/completions.
   *
   * While that request is still linking its returned conversationId back into
   * local state, sync must not create another server conversation or pull an
   * unmatched server conversation into a duplicate local stub.
   */
  pendingCreateSessionIds?: ReadonlySet<string>;
}

const VALID_ROLES = ['user', 'assistant', 'tool'] as const;

function getServerConversationActivityTimestamp(item: ServerConversation): number {
  const updatedAt = Number.isFinite(item.updatedAt) ? item.updatedAt : 0;
  const lastMessageAt =
    typeof item.lastMessageAt === 'number' && Number.isFinite(item.lastMessageAt)
      ? item.lastMessageAt
      : 0;

  return Math.max(updatedAt, lastMessageAt);
}

function normalizeTitleText(title: string): string {
  return title.replace(/\s+/g, ' ').trim().slice(0, 80);
}

function getSessionTitleSource(session: Session): TitleSource | undefined {
  return isTitleSource(session.titleSource) ? session.titleSource : undefined;
}

function isSessionFallbackTitle(session: Session): boolean {
  const titleSource = getSessionTitleSource(session);
  return titleSource ? isFallbackTitleSource(titleSource) : false;
}

function shouldPreferServerTitle(
  session: Session,
  serverTitle: string | undefined,
  serverTitleSource?: TitleSource,
): serverTitle is string {
  const normalizedServerTitle = serverTitle?.trim();
  if (!normalizedServerTitle || normalizeTitleText(normalizedServerTitle) === normalizeTitleText(session.title)) {
    return false;
  }
  const normalizedServerTitleSource = isTitleSource(serverTitleSource) ? serverTitleSource : undefined;
  return isSessionFallbackTitle(session)
    && !!normalizedServerTitleSource
    && !isFallbackTitleSource(normalizedServerTitleSource);
}

function getTitleSourceForPushedSession(session: Session): TitleSource {
  return getSessionTitleSource(session) ?? 'manual';
}

function applyServerTitleIfAllowed(
  session: Session,
  serverTitle: string | undefined,
  serverTitleSource?: TitleSource,
): Session {
  if (!shouldPreferServerTitle(session, serverTitle, serverTitleSource)) {
    if (
      serverTitle &&
      normalizeTitleText(serverTitle) === normalizeTitleText(session.title) &&
      serverTitleSource &&
      !isFallbackTitleSource(serverTitleSource) &&
      isSessionFallbackTitle(session)
    ) {
      return {
        ...session,
        titleSource: serverTitleSource,
      };
    }
    return session;
  }

  return {
    ...session,
    title: serverTitle,
    titleSource: serverTitleSource ?? 'server_generated',
  };
}

function logServerTitlePreferred(session: Session, serverConversationId: string, serverTitle: string, reason: string): void {
  console.info('[syncService] Preserving server conversation title over mobile fallback title.', {
    sessionId: session.id,
    serverConversationId,
    localTitle: session.title,
    serverTitle,
    reason,
  });
}

/**
 * Convert a mobile ChatMessage to server message format
 */
function toServerMessage(msg: ChatMessage): ServerConversationMessage {
  // Normalize role to valid values - default to 'user' for legacy/invalid data
  const role: 'user' | 'assistant' | 'tool' = VALID_ROLES.includes(msg.role as any)
    ? (msg.role as 'user' | 'assistant' | 'tool')
    : 'user';

  return {
    role,
    content: msg.content,
    timestamp: msg.timestamp,
    toolCalls: msg.toolCalls,
    toolResults: msg.toolResults,
  };
}

/**
 * Convert a server message to mobile ChatMessage format
 */
function fromServerMessage(msg: ServerConversationMessage, index: number): ChatMessage {
  // Use nullish coalescing (??) so that timestamp=0 is not treated as "missing"
  const ts = msg.timestamp ?? Date.now();
  return {
    id: `msg_${ts}_${index}_${Math.random().toString(36).substr(2, 9)}`,
    role: msg.role,
    content: msg.content,
    timestamp: ts,
    toolCalls: msg.toolCalls as any,
    toolResults: msg.toolResults as any,
  };
}

/**
 * Convert a full server conversation to a mobile Session (with messages)
 */
function serverConversationToSession(conv: ServerConversationFull): Session {
  return {
    id: conv.clientSessionId ?? `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: conv.title,
    titleSource: conv.titleSource ?? 'server_generated',
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    messages: conv.messages.map(fromServerMessage),
    serverConversationId: conv.id,
    metadata: conv.metadata as Session['metadata'],
  };
}

/**
 * Convert a server conversation list item to a lazy stub Session (no messages, just metadata)
 */
function serverConversationToStubSession(item: ServerConversation): Session {
  return {
    id: item.clientSessionId ?? `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: item.title,
    titleSource: item.titleSource ?? 'server_generated',
    createdAt: item.createdAt,
    updatedAt: getServerConversationActivityTimestamp(item),
    messages: [],
    serverConversationId: item.id,
    serverMetadata: {
      messageCount: item.messageCount,
      lastMessage: (item.lastMessage || '').substring(0, 100),
      preview: (item.preview || '').substring(0, 200),
    },
  };
}

function applyServerListItemToLocalSession(session: Session, item: ServerConversation): Session {
  return {
    ...session,
    title: item.title,
    titleSource: item.titleSource ?? 'server_generated',
    updatedAt: getServerConversationActivityTimestamp(item),
    serverConversationId: item.id,
    serverMetadata: {
      messageCount: item.messageCount,
      lastMessage: (item.lastMessage || '').substring(0, 100),
      preview: (item.preview || '').substring(0, 200),
    },
  };
}

/**
 * Sync conversations between mobile and server.
 *
 * Strategy:
 * 1. Fetch list of all server conversations
 * 2. For each local session:
 *    - If it has a serverConversationId: compare updatedAt, sync if needed
 *    - If no serverConversationId and has messages: push to server
 * 3. For each server conversation not in local sessions: pull and create local session
 *
 * @param client - The settings API client with valid credentials
 * @param localSessions - Current local sessions
 * @returns SyncResult with pulled/pushed counts and updated sessions
 */
export async function syncConversations(
  client: SettingsApiClient,
  localSessions: Session[],
  options: SyncConversationOptions = {}
): Promise<{ result: SyncResult; sessions: Session[] }> {
  const result: SyncResult = {
    pulled: 0,
    pushed: 0,
    updated: 0,
    errors: [],
  };

  const updatedSessions: Session[] = [...localSessions];
  const pendingCreateSessionIds = options.pendingCreateSessionIds ?? new Set<string>();
  const shouldDeferUnmatchedPulls = pendingCreateSessionIds.size > 0;

  try {
    // Step 1: Fetch server conversation list
    const { conversations: serverList } = await client.getConversations();

    // Create a map of serverConversationId -> local session
    const localByServerId = new Map<string, { session: Session; index: number }>();
    localSessions.forEach((session, index) => {
      if (session.serverConversationId) {
        localByServerId.set(session.serverConversationId, { session, index });
      }
    });
    const localByClientSessionId = new Map(localSessions.map((session, index) => [
      session.id,
      { session, index },
    ] as const));

    const serverByClientSessionId = new Map<string, ServerConversation>();
    for (const sc of serverList) {
      if (!sc.clientSessionId) continue;
      const existing = serverByClientSessionId.get(sc.clientSessionId);
      if (
        !existing ||
        getServerConversationActivityTimestamp(sc) >
          getServerConversationActivityTimestamp(existing)
      ) {
        serverByClientSessionId.set(sc.clientSessionId, sc);
      }
    }

    // Step 2: Process local sessions
    for (let i = 0; i < updatedSessions.length; i++) {
      const session = updatedSessions[i];

      if (session.serverConversationId) {
        // Session is linked to server - check if we need to sync
        const serverItem = serverList.find(c => c.id === session.serverConversationId);

        if (serverItem) {
          // Both exist - compare timestamps to see who's newer
          const serverActivityAt = getServerConversationActivityTimestamp(serverItem);

          if (serverActivityAt > session.updatedAt) {
            // Server is newer - pull full conversation
            try {
              const fullConv = await client.getConversation(session.serverConversationId);
              const titleUpdatedSession = applyServerTitleIfAllowed(session, fullConv.title, fullConv.titleSource);
              updatedSessions[i] = {
                ...titleUpdatedSession,
                updatedAt: fullConv.updatedAt,
                messages: fullConv.messages.map(fromServerMessage),
              };
              result.updated++;
            } catch (err: any) {
              result.errors.push(`Failed to pull ${session.serverConversationId}: ${err.message}`);
            }
          } else if (session.updatedAt > serverActivityAt && session.messages.length > 0) {
            // Local is newer - push to server
            try {
              const outgoingTitle = shouldPreferServerTitle(session, serverItem.title, serverItem.titleSource)
                ? serverItem.title
                : session.title;
              if (outgoingTitle !== session.title) {
                logServerTitlePreferred(session, session.serverConversationId, outgoingTitle, 'local-newer-push');
              }
              const shouldAdoptServerTitleSource =
                outgoingTitle === session.title &&
                serverItem.titleSource &&
                !isFallbackTitleSource(serverItem.titleSource) &&
                isSessionFallbackTitle(session) &&
                normalizeTitleText(serverItem.title) === normalizeTitleText(session.title);
              const outgoingTitleSource = outgoingTitle !== session.title
                ? (serverItem.titleSource ?? 'server_generated')
                : shouldAdoptServerTitleSource
                  ? serverItem.titleSource
                  : getTitleSourceForPushedSession(session);
              const updated = await client.updateConversation(session.serverConversationId, {
                clientSessionId: session.id,
                title: outgoingTitle,
                titleSource: outgoingTitleSource,
                messages: session.messages.map(toServerMessage),
                updatedAt: session.updatedAt,
              });
              // Update local session with server-returned updatedAt to prevent sync oscillation
              updatedSessions[i] = {
                ...session,
                title: updated.title || outgoingTitle,
                titleSource: updated.titleSource ?? outgoingTitleSource,
                updatedAt: updated.updatedAt,
              };
              result.updated++;
            } catch (err: any) {
              result.errors.push(`Failed to push ${session.serverConversationId}: ${err.message}`);
            }
          } else if (shouldPreferServerTitle(session, serverItem.title, serverItem.titleSource)) {
            // Equal timestamps can still hide a better server-generated title.
            // Keep local messages, but replace the first-message mobile fallback title.
            logServerTitlePreferred(session, session.serverConversationId, serverItem.title, 'same-timestamp-title-only');
            updatedSessions[i] = {
              ...session,
              title: serverItem.title,
              titleSource: serverItem.titleSource ?? 'server_generated',
            };
            result.updated++;
          } else {
            const titleSourceUpdatedSession = applyServerTitleIfAllowed(session, serverItem.title, serverItem.titleSource);
            if (titleSourceUpdatedSession !== session) {
              updatedSessions[i] = titleSourceUpdatedSession;
              result.updated++;
            }
          }
          // If timestamps and title are equal, no action needed
        }
        // If server item not found, the conversation may have been deleted on server
        // We could handle this by either deleting locally or re-pushing
        // For now, we leave it as is
      } else if (session.messages.length > 0) {
        if (pendingCreateSessionIds.has(session.id)) {
          continue;
        }

        const existingMatch = serverByClientSessionId.get(session.id);
        if (existingMatch && !localByServerId.has(existingMatch.id)) {
          // Found a matching server conversation — re-link instead of creating a duplicate
          if (shouldPreferServerTitle(session, existingMatch.title, existingMatch.titleSource)) {
            logServerTitlePreferred(session, existingMatch.id, existingMatch.title, 'unlinked-existing-match');
          }
          updatedSessions[i] = {
            ...session,
            ...(shouldPreferServerTitle(session, existingMatch.title, existingMatch.titleSource)
              ? { title: existingMatch.title, titleSource: existingMatch.titleSource ?? ('server_generated' as const) }
              : {}),
            serverConversationId: existingMatch.id,
            updatedAt: getServerConversationActivityTimestamp(existingMatch),
          };
          // Mark this server ID as claimed so Step 3 won't pull it as a new stub
          localByServerId.set(existingMatch.id, { session: updatedSessions[i], index: i });
          result.updated++;
        } else {
          // Truly new local-only session - push to server
          try {
            const created = await client.createConversation({
              clientSessionId: session.id,
              title: session.title,
              titleSource: getTitleSourceForPushedSession(session),
              messages: session.messages.map(toServerMessage),
              createdAt: session.createdAt,
              updatedAt: session.updatedAt,
            });

            // Update local session with server ID and updatedAt
            updatedSessions[i] = {
              ...session,
              title: created.title || session.title,
              titleSource: created.titleSource ?? getTitleSourceForPushedSession(session),
              serverConversationId: created.id,
              updatedAt: created.updatedAt,
            };
            result.pushed++;
          } catch (err: any) {
            result.errors.push(`Failed to create on server: ${err.message}`);
          }
        }
      }
      // Empty sessions without serverConversationId are ignored
    }

    // Step 3: Pull new server conversations not in local (lazy - stubs only)
    const newSessions: Session[] = [];
    for (const serverItem of serverList) {
      if (!localByServerId.has(serverItem.id)) {
        if (shouldDeferUnmatchedPulls) {
          continue;
        }

        const localClientMatch = serverItem.clientSessionId
          ? localByClientSessionId.get(serverItem.clientSessionId)
          : undefined;
        if (localClientMatch && !localClientMatch.session.serverConversationId) {
          updatedSessions[localClientMatch.index] = applyServerListItemToLocalSession(
            localClientMatch.session,
            serverItem,
          );
          localByServerId.set(serverItem.id, {
            session: updatedSessions[localClientMatch.index],
            index: localClientMatch.index,
          });
          result.updated++;
          continue;
        }

        // Server conversation not in local - create a lazy stub (no message fetch)
        const stubSession = serverConversationToStubSession(serverItem);
        newSessions.push(stubSession);
        result.pulled++;
      }
    }
    // Add all new sessions to the beginning, preserving server order
    updatedSessions.unshift(...newSessions);

  } catch (err: any) {
    result.errors.push(`Sync failed: ${err.message}`);
  }

  return { result, sessions: updatedSessions };
}



/**
 * Fetch full conversation messages from server for a lazy-loaded session.
 * Used when user opens a stub session that only has metadata.
 *
 * @param client - The settings API client
 * @param serverConversationId - The server-side conversation ID
 * @returns The messages and updated metadata, or null on failure
 */
export async function fetchFullConversation(
  client: SettingsApiClient,
  serverConversationId: string
): Promise<{ messages: ChatMessage[]; title: string; titleSource?: TitleSource; updatedAt: number } | null> {
  try {
    const fullConv = await client.getConversation(serverConversationId);
    return {
      messages: fullConv.messages.map(fromServerMessage),
      title: fullConv.title,
      titleSource: fullConv.titleSource,
      updatedAt: fullConv.updatedAt,
    };
  } catch (err: any) {
    console.error(`[syncService] Failed to fetch conversation ${serverConversationId}:`, err.message);
    return null;
  }
}
