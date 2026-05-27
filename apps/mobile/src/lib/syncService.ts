/**
 * Conversation Sync Service
 * Handles syncing chat sessions between mobile and desktop.
 */

import { generateSessionTitle, type Session, type ChatMessage } from '../types/session';
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

function getFirstUserMessageText(session: Session): string {
  return session.messages.find(message => message.role === 'user')?.content?.trim() ?? '';
}

function normalizeTitleText(title: string): string {
  return title.replace(/\s+/g, ' ').trim().slice(0, 80);
}

function generateDesktopFallbackSessionTitle(firstMessage: string): string {
  const normalized = firstMessage.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'New Chat';
  }
  return normalized.length > 50 ? `${normalized.slice(0, 50)}...` : normalized;
}

function isLikelyFallbackTitleForSession(session: Session, title: string): boolean {
  const firstUserMessage = getFirstUserMessageText(session);
  const normalizedTitle = normalizeTitleText(title);
  if (!firstUserMessage) {
    return normalizedTitle === 'New Chat';
  }
  return normalizedTitle === normalizeTitleText(generateSessionTitle(firstUserMessage))
    || normalizedTitle === normalizeTitleText(generateDesktopFallbackSessionTitle(firstUserMessage));
}

function isLikelyMobileFallbackTitle(session: Session): boolean {
  return isLikelyFallbackTitleForSession(session, session.title);
}

function shouldPreferServerTitle(session: Session, serverTitle: string | undefined): serverTitle is string {
  const normalizedServerTitle = serverTitle?.trim();
  if (!normalizedServerTitle || normalizeTitleText(normalizedServerTitle) === normalizeTitleText(session.title)) {
    return false;
  }
  return isLikelyMobileFallbackTitle(session)
    && !isLikelyFallbackTitleForSession(session, normalizedServerTitle);
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
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: conv.title,
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
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: item.title,
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

    // Build a content-based lookup for dedup: find server conversations that
    // match an unlinked local session by (createdAt, title). This prevents
    // duplicate server conversations when the local serverConversationId
    // mapping is lost (e.g. app restart before AsyncStorage save completes).
    // Key: "createdAt|title" → most recently updated ServerConversation
    const serverByContentKey = new Map<string, ServerConversation>();
    const serverByCreatedAt = new Map<number, ServerConversation[]>();
    for (const sc of serverList) {
      const key = `${sc.createdAt}|${sc.title}`;
      const existing = serverByContentKey.get(key);
      // Keep the most recently updated match
      if (
        !existing ||
        getServerConversationActivityTimestamp(sc) >
          getServerConversationActivityTimestamp(existing)
      ) {
        serverByContentKey.set(key, sc);
      }

      const createdAtMatches = serverByCreatedAt.get(sc.createdAt) ?? [];
      createdAtMatches.push(sc);
      serverByCreatedAt.set(sc.createdAt, createdAtMatches);
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
              updatedSessions[i] = {
                ...session,
                title: fullConv.title,
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
              const outgoingTitle = shouldPreferServerTitle(session, serverItem.title)
                ? serverItem.title
                : session.title;
              if (outgoingTitle !== session.title) {
                logServerTitlePreferred(session, session.serverConversationId, outgoingTitle, 'local-newer-push');
              }
              const updated = await client.updateConversation(session.serverConversationId, {
                title: outgoingTitle,
                messages: session.messages.map(toServerMessage),
                updatedAt: session.updatedAt,
              });
              // Update local session with server-returned updatedAt to prevent sync oscillation
              updatedSessions[i] = {
                ...session,
                title: updated.title || outgoingTitle,
                updatedAt: updated.updatedAt,
              };
              result.updated++;
            } catch (err: any) {
              result.errors.push(`Failed to push ${session.serverConversationId}: ${err.message}`);
            }
          } else if (shouldPreferServerTitle(session, serverItem.title)) {
            // Equal timestamps can still hide a better server-generated title.
            // Keep local messages, but replace the first-message mobile fallback title.
            logServerTitlePreferred(session, session.serverConversationId, serverItem.title, 'same-timestamp-title-only');
            updatedSessions[i] = {
              ...session,
              title: serverItem.title,
            };
            result.updated++;
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

        // Before creating a new server conversation, check if one already
        // exists with the same createdAt + title (content-based dedup).
        // This handles the case where a previous sync pushed this session
        // but the serverConversationId mapping was lost locally.
        const contentKey = `${session.createdAt}|${session.title}`;
        let existingMatch = serverByContentKey.get(contentKey);
        if (!existingMatch && isLikelyMobileFallbackTitle(session)) {
          const createdAtMatches = serverByCreatedAt.get(session.createdAt) ?? [];
          const titleUpgradeMatches = createdAtMatches.filter(candidate => shouldPreferServerTitle(session, candidate.title));
          if (titleUpgradeMatches.length === 1) {
            existingMatch = titleUpgradeMatches[0];
          }
        }

        if (existingMatch && !localByServerId.has(existingMatch.id)) {
          // Found a matching server conversation — re-link instead of creating a duplicate
          if (existingMatch.title !== session.title) {
            logServerTitlePreferred(session, existingMatch.id, existingMatch.title, 'unlinked-existing-match');
          }
          updatedSessions[i] = {
            ...session,
            title: existingMatch.title,
            serverConversationId: existingMatch.id,
            updatedAt: existingMatch.updatedAt,
          };
          // Mark this server ID as claimed so Step 3 won't pull it as a new stub
          localByServerId.set(existingMatch.id, { session: updatedSessions[i], index: i });
          result.updated++;
        } else {
          // Truly new local-only session - push to server
          try {
            const created = await client.createConversation({
              title: session.title,
              messages: session.messages.map(toServerMessage),
              createdAt: session.createdAt,
              updatedAt: session.updatedAt,
            });

            // Update local session with server ID and updatedAt
            updatedSessions[i] = {
              ...session,
              title: created.title || session.title,
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
): Promise<{ messages: ChatMessage[]; title: string; updatedAt: number } | null> {
  try {
    const fullConv = await client.getConversation(serverConversationId);
    return {
      messages: fullConv.messages.map(fromServerMessage),
      title: fullConv.title,
      updatedAt: fullConv.updatedAt,
    };
  } catch (err: any) {
    console.error(`[syncService] Failed to fetch conversation ${serverConversationId}:`, err.message);
    return null;
  }
}
