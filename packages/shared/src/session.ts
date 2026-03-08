/**
 * Session types and utilities for DotAgents apps
 */

import type { ToolCall, ToolResult } from './types';

const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*\]\((?:data:image\/[^)]+|[^)]+)\)/gi;
const FALLBACK_SESSION_TITLE_LIMIT = 60;

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
  messageCount: number;
  lastMessage: string;
  preview: string;
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

function getPreviewTitleCandidate(preview: string): string | null {
  const previewSegments = preview.split(/\s+\|\s+/);

  for (const segment of previewSegments) {
    const candidate = sanitizeSessionText(segment.replace(/^(user|assistant|tool):\s*/i, ''));
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function getSessionListDisplayTitle(session: Session, preview: string): string {
  const title = session.title.trim();
  if (title) {
    return title;
  }

  const firstUserMessage = session.messages.find(message => message.role === 'user');
  if (firstUserMessage?.content) {
    const generatedTitle = generateSessionTitle(firstUserMessage.content);
    if (generatedTitle.trim() && generatedTitle !== 'New Chat') {
      return generatedTitle;
    }
  }

  const previewTitle = getPreviewTitleCandidate(preview);
  if (previewTitle) {
    return previewTitle.length > FALLBACK_SESSION_TITLE_LIMIT
      ? `${previewTitle.substring(0, FALLBACK_SESSION_TITLE_LIMIT - 3)}...`
      : previewTitle;
  }

  return `Session ${session.id.slice(0, 8)}`;
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
    const preview = sanitizeSessionText(session.serverMetadata.preview || '');

    return {
      id: session.id,
      title: getSessionListDisplayTitle(session, preview),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.serverMetadata.messageCount,
      lastMessage: session.serverMetadata.lastMessage,
      preview,
    };
  }

  const lastMsg = session.messages[session.messages.length - 1];
  const preview = sanitizeSessionText(lastMsg?.content || '');

  return {
    id: session.id,
    title: getSessionListDisplayTitle(session, preview),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
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

