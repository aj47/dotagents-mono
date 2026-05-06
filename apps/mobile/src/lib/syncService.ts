/**
 * Conversation sync service.
 *
 * The shared package owns the app/server conversation mapping. This mobile
 * barrel preserves existing import paths for stores and tests.
 */

export {
  fetchFullConversation,
  fromServerConversationMessage,
  serverConversationToSession,
  serverConversationToStubSession,
  syncConversations,
  toServerConversationMessage,
} from '@dotagents/shared/conversation-sync';

export type {
  ConversationSyncClient,
  SyncConversationOptions,
  SyncResult,
  SyncableSession,
} from '@dotagents/shared/conversation-sync';
