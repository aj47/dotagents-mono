/**
 * Session types and utilities for DotAgents apps
 */

import type { ToolCall, ToolResult } from './types';
import { filterVisibleChatMessages } from './chat-utils';
import {
  sanitizeMessageContentForDisplay,
  sanitizeMessageMediaContentForPreview,
} from './message-display-utils';
import { replaceMarkdownImageReferences } from './conversation-media-assets';

export function sanitizeSessionText(content: string): string {
  return sanitizeMessageMediaContentForPreview(content);
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

export interface ConversationPreviewMessage {
  role: string;
  content?: string | null;
}

export interface BuildConversationPreviewOptions {
  maxMessages?: number;
  maxMessageChars?: number;
  maxPreviewChars?: number;
}

export interface GenerateConversationTitleOptions {
  maxChars?: number;
  fallbackTitle?: string;
}

export interface NormalizeConversationTitleOptions {
  maxChars?: number;
  maxWords?: number;
}

export type SessionSearchMatchedField = 'title' | 'preview' | 'message';

export type SessionSearchResult = SessionListItem & {
  matchedField?: SessionSearchMatchedField;
  searchPreview?: string;
};

export type SessionArchiveMode = 'active' | 'archived';

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

function replaceMarkdownImagesWithAltText(content: string): string {
  return replaceMarkdownImageReferences(content, (reference) => reference.altText);
}

function normalizeGeneratedImageTitlePlaceholder(title: string): string {
  return title
    .replace(/^\[Image\]$/i, 'Image')
    .replace(/^\[Image:\s*([^\]]+)\]$/i, 'Image: $1')
    .trim();
}

export function generateConversationTitleFromMessage(
  firstMessage: string,
  options: GenerateConversationTitleOptions = {},
): string {
  const maxChars = options.maxChars ?? 50;
  const fallbackTitle = options.fallbackTitle ?? 'Image';
  const cleanedMessage = normalizeGeneratedImageTitlePlaceholder(
    replaceMarkdownImagesWithAltText(sanitizeMessageContentForDisplay(firstMessage)).trim(),
  );
  const fallbackMessage = normalizeGeneratedImageTitlePlaceholder(
    replaceMarkdownImagesWithAltText(firstMessage).trim(),
  );
  const source = cleanedMessage || fallbackMessage || fallbackTitle;
  const title = source.slice(0, maxChars);
  return title.length < source.length ? `${title}...` : title;
}

export function normalizeConversationTitleText(
  title: string,
  options: NormalizeConversationTitleOptions = {},
): string {
  const maxChars = options.maxChars ?? 80;
  const cleaned = sanitizeMessageContentForDisplay(title)
    .replace(/\s+/g, ' ')
    .replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '')
    .trim();

  if (!cleaned) {
    return '';
  }

  const wordLimited = options.maxWords
    ? cleaned.split(' ').filter(Boolean).slice(0, options.maxWords).join(' ')
    : cleaned;

  return wordLimited.slice(0, maxChars).trim();
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

  const visibleMessages = filterVisibleChatMessages(session.messages);
  const lastMsg = visibleMessages[visibleMessages.length - 1];
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

function normalizeSessionSearchValue(value: string): string {
  return sanitizeSessionText(value).toLowerCase();
}

export function createSessionSearchSnippet(text: string, query: string, maxLength: number = 140): string {
  const sanitized = sanitizeSessionText(text);
  if (!sanitized) return '';

  const normalizedText = sanitized.toLowerCase();
  const normalizedQuery = normalizeSessionSearchValue(query);
  const matchIndex = normalizedText.indexOf(normalizedQuery);
  if (!normalizedQuery || matchIndex < 0 || sanitized.length <= maxLength) {
    return sanitized.slice(0, maxLength);
  }

  const contextRadius = Math.max(24, Math.floor((maxLength - normalizedQuery.length) / 2));
  const start = Math.max(0, matchIndex - contextRadius);
  const end = Math.min(sanitized.length, matchIndex + normalizedQuery.length + contextRadius);

  const prefix = start > 0 ? '…' : '';
  const suffix = end < sanitized.length ? '…' : '';
  return `${prefix}${sanitized.slice(start, end).trim()}${suffix}`;
}

function findSessionSearchMatch(
  session: Session,
  normalizedQuery: string,
): Omit<SessionSearchResult, keyof SessionListItem> | null {
  const listItem = sessionToListItem(session);

  if (normalizeSessionSearchValue(listItem.title).includes(normalizedQuery)) {
    return { matchedField: 'title' };
  }

  if (normalizeSessionSearchValue(listItem.preview).includes(normalizedQuery)) {
    return {
      matchedField: 'preview',
      searchPreview: createSessionSearchSnippet(listItem.preview, normalizedQuery),
    };
  }

  for (let index = session.messages.length - 1; index >= 0; index -= 1) {
    const message = session.messages[index];
    if (!normalizeSessionSearchValue(message.content).includes(normalizedQuery)) continue;

    return {
      matchedField: 'message',
      searchPreview: createSessionSearchSnippet(message.content, normalizedQuery),
    };
  }

  return null;
}

export function filterSessionSearchResults(sessions: Session[], searchQuery: string): SessionSearchResult[] {
  const normalizedQuery = normalizeSessionSearchValue(searchQuery);
  const sortedSessions = sortSessionsByPinnedFirst(sessions);

  if (!normalizedQuery) {
    return sortedSessions.map(sessionToListItem);
  }

  return sortedSessions.flatMap((session) => {
    const listItem = sessionToListItem(session);
    const match = findSessionSearchMatch(session, normalizedQuery);
    if (!match) return [];
    return [{ ...listItem, ...match }];
  });
}

export function filterSessionsByArchiveMode<T extends { isArchived?: boolean }>(
  sessions: T[],
  mode: SessionArchiveMode,
): T[] {
  return sessions.filter((session) => (
    mode === 'archived'
      ? !!session.isArchived
      : !session.isArchived
  ));
}

export function buildConversationPreview(
  messages: ConversationPreviewMessage[],
  options: BuildConversationPreviewOptions = {},
): string {
  const maxMessages = options.maxMessages ?? 3;
  const maxMessageChars = options.maxMessageChars ?? 100;
  const maxPreviewChars = options.maxPreviewChars ?? 200;

  const preview = messages
    .slice(0, maxMessages)
    .map((message) => `${message.role}: ${sanitizeSessionText(message.content || '').slice(0, maxMessageChars)}`)
    .join(' | ');

  return preview.length > maxPreviewChars
    ? `${preview.slice(0, maxPreviewChars)}...`
    : preview;
}

/**
 * Check if a session is a lazy stub (has serverConversationId but no messages loaded)
 */
export function isStubSession(session: Session): boolean {
  return session.messages.length === 0 && !!session.serverConversationId && !!session.serverMetadata;
}
