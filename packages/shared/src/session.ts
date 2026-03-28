/**
 * Session types and utilities for DotAgents apps
 */

import type { ToolCall, ToolResult } from './types';

const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*\]\((?:data:image\/[^)]+|[^)]+)\)/gi;

export function sanitizeSessionText(content: string): string {
  return content
    .replace(MARKDOWN_IMAGE_REGEX, '[Image]')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SessionChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
  messages: SessionChatMessage[];
  /** Server-side conversation ID for continuing conversations on the DotAgents server */
  serverConversationId?: string;
  /** Optional metadata about the session */
  metadata?: {
    model?: string;
    totalTokens?: number;
  };
  /** Cached server metadata for lazy-loaded sessions (messages not yet fetched) */
  serverMetadata?: {
    messageCount: number;
    lastMessage: string;
    preview: string;
  };
}

export interface SessionListItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
  messageCount: number;
  lastMessage: string;
  preview: string;
}

export type ConversationSessionStateKey =
  | 'pinnedSessionIds'
  | 'archivedSessionIds';

export interface ConversationSessionState {
  pinnedSessionIds: string[];
  archivedSessionIds: string[];
}

type ConversationSessionStateLike =
  | Partial<Record<ConversationSessionStateKey, unknown>>
  | null
  | undefined;

export function orderItemsByPinnedFirst<T>(
  items: readonly T[],
  isPinned: (item: T) => boolean,
): T[] {
  if (items.length <= 1) {
    return [...items];
  }

  const pinnedItems: T[] = [];
  const unpinnedItems: T[] = [];

  for (const item of items) {
    if (isPinned(item)) {
      pinnedItems.push(item);
    } else {
      unpinnedItems.push(item);
    }
  }

  if (pinnedItems.length === 0 || unpinnedItems.length === 0) {
    return [...items];
  }

  return [...pinnedItems, ...unpinnedItems];
}

export function sortSessionsByPinnedFirst<T extends Pick<Session, 'updatedAt' | 'isPinned'>>(sessions: T[]): T[] {
  const sortedByRecency = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  return orderItemsByPinnedFirst(
    sortedByRecency,
    (session) => Boolean(session.isPinned),
  );
}

export function sanitizeSessionIdList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((sessionId): sessionId is string => typeof sessionId === 'string')
    : [];
}

export function sanitizeConversationSessionState(
  value: ConversationSessionStateLike,
): ConversationSessionState {
  return {
    pinnedSessionIds: sanitizeSessionIdList(value?.pinnedSessionIds),
    archivedSessionIds: sanitizeSessionIdList(value?.archivedSessionIds),
  };
}

export function setSessionIdMembership(
  sessionIds: Iterable<string>,
  sessionId: string,
  isIncluded: boolean,
): string[] {
  const nextSessionIds = new Set(sessionIds);
  if (isIncluded) {
    nextSessionIds.add(sessionId);
  } else {
    nextSessionIds.delete(sessionId);
  }

  return [...nextSessionIds];
}

export function setConversationSessionStateMembership(
  value: ConversationSessionStateLike,
  stateKey: ConversationSessionStateKey,
  sessionId: string,
  isIncluded: boolean,
): ConversationSessionState {
  const sessionState = sanitizeConversationSessionState(value);
  const nextSessionIds = setSessionIdMembership(
    sessionState[stateKey],
    sessionId,
    isIncluded,
  );

  return stateKey === 'pinnedSessionIds'
    ? { ...sessionState, pinnedSessionIds: nextSessionIds }
    : { ...sessionState, archivedSessionIds: nextSessionIds };
}

export function removeSessionIdFromConversationSessionState(
  value: ConversationSessionStateLike,
  sessionId: string,
): ConversationSessionState {
  const sessionState = sanitizeConversationSessionState(value);

  return {
    pinnedSessionIds: setSessionIdMembership(
      sessionState.pinnedSessionIds,
      sessionId,
      false,
    ),
    archivedSessionIds: setSessionIdMembership(
      sessionState.archivedSessionIds,
      sessionId,
      false,
    ),
  };
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a session title from the first message
 */
export function generateSessionTitle(firstMessage: string): string {
  const maxLength = 50;
  const trimmed = sanitizeSessionText(firstMessage);
  if (!trimmed) {
    return 'New Chat';
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.substring(0, maxLength - 3) + '...';
}

/**
 * Convert a Session to a SessionListItem for display in list
 */
export function sessionToListItem(session: Session): SessionListItem {
  // For lazy-loaded sessions (stub sessions with no messages), use cached server metadata
  if (session.messages.length === 0 && session.serverMetadata) {
    return {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      isPinned: session.isPinned,
      isArchived: session.isArchived,
      messageCount: session.serverMetadata.messageCount,
      lastMessage: session.serverMetadata.lastMessage,
      preview: session.serverMetadata.preview,
    };
  }

  const lastMsg = session.messages[session.messages.length - 1];
  const preview = sanitizeSessionText(lastMsg?.content || '');

  return {
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    isPinned: session.isPinned,
    isArchived: session.isArchived,
    messageCount: session.messages.length,
    lastMessage: preview.substring(0, 100),
    preview: preview.substring(0, 200),
  };
}

/**
 * Check if a session is a lazy stub (has serverConversationId but no messages loaded)
 */
export function isStubSession(session: Session): boolean {
  return session.messages.length === 0 && !!session.serverConversationId && !!session.serverMetadata;
}
