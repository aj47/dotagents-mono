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
  messageCount: number;
  lastMessage: string;
  preview: string;
}

export function sortSessionsByPinnedFirst<T extends Pick<Session, 'updatedAt' | 'isPinned'>>(sessions: T[]): T[] {
  return [...sessions].sort((a, b) => {
    const pinOrder = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
    if (pinOrder !== 0) {
      return pinOrder;
    }

    return b.updatedAt - a.updatedAt;
  });
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
 * Create a new session with an optional first message
 */
export function createSession(firstMessage?: string): Session {
  const now = Date.now();
  const session: Session = {
    id: generateSessionId(),
    title: firstMessage ? generateSessionTitle(firstMessage) : 'New Chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  if (firstMessage) {
    session.messages.push({
      id: generateMessageId(),
      role: 'user',
      content: firstMessage,
      timestamp: now,
    });
  }

  return session;
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

