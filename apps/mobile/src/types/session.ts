/**
 * Session types and utilities - re-exports from @dotagents/shared
 * This file is a barrel that re-exports from the shared package,
 * keeping backward compatibility for existing importers.
 */

// Re-export session functions from shared
export {
  generateSessionId,
  generateMessageId,
  generateSessionTitle,
  orderItemsByPinnedFirst,
  sanitizeSessionIdList,
  setSessionIdMembership,
  sessionToListItem,
  sortSessionsByPinnedFirst,
  isStubSession,
} from '@dotagents/shared';

// Re-export session types from shared
// Note: SessionChatMessage is re-exported as ChatMessage for backward compatibility
export type { Session, SessionListItem, SessionChatMessage as ChatMessage } from '@dotagents/shared';

// Re-export ToolCall/ToolResult for backward compat
export type { ToolCall, ToolResult } from '@dotagents/shared';
