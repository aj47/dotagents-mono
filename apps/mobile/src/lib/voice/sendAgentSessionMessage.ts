import type { SettingsApiClient } from '../settingsApi';
import type { SessionStore } from '../../store/sessions';
import type { ConnectionManagerContextValue } from '../../store/connectionManager';
import {
  sanitizeMessagesForRequest,
  type ChatMessage,
  type ConversationHistoryMessage,
} from '../openaiClient';

export type SendAgentSessionMessageOptions = {
  sessionId: string;
  text: string;
  sessionStore: SessionStore;
  connectionManager: ConnectionManagerContextValue;
  settingsClient?: SettingsApiClient | null;
};

export type SendAgentSessionMessageResult = {
  responseText: string;
};

function historyToTurnMessages(history: ConversationHistoryMessage[]): ChatMessage[] {
  let currentTurnStartIndex = -1;
  for (let index = 0; index < history.length; index += 1) {
    if (history[index]?.role === 'user') currentTurnStartIndex = index;
  }

  return history
    .slice(currentTurnStartIndex + 1)
    .map((message) => ({
      role: message.role === 'tool' ? 'assistant' : message.role,
      content: message.content || '',
      timestamp: message.timestamp,
      toolCalls: message.toolCalls,
      toolResults: message.toolResults,
    }));
}

/** Send to an agent session while keeping the current UI focus unchanged. */
export async function sendMessageToAgentSession({
  sessionId,
  text,
  sessionStore,
  connectionManager,
  settingsClient,
}: SendAgentSessionMessageOptions): Promise<SendAgentSessionMessageResult> {
  const trimmedText = text.trim();
  if (!trimmedText) throw new Error('The agent message cannot be empty.');

  let session = sessionStore.sessions.find((candidate) => candidate.id === sessionId);
  if (!session) throw new Error('That agent session is no longer available.');

  if (session.serverConversationId && session.messages.length === 0 && settingsClient) {
    await sessionStore.loadSessionMessages(sessionId, settingsClient);
    session = sessionStore.sessions.find((candidate) => candidate.id === sessionId) || session;
  }

  const userMessage: ChatMessage = { role: 'user', content: trimmedText };
  const previousMessages = session.messages as ChatMessage[];
  const requestMessages = sanitizeMessagesForRequest([...previousMessages, userMessage]);
  const connection = connectionManager.getOrCreateConnection(sessionId);
  const requestId = Date.now();
  connectionManager.setLatestRequestId(sessionId, requestId);
  connectionManager.incrementActiveRequests(sessionId);

  try {
    const response = await connection.client.chat(
      requestMessages,
      undefined,
      undefined,
      session.serverConversationId,
    );
    if (connectionManager.getLatestRequestId(sessionId) !== requestId) {
      throw new Error('The background agent request was superseded.');
    }

    const responseText = (response.content || '').trim();
    const turnMessages = response.conversationHistory?.length
      ? historyToTurnMessages(response.conversationHistory)
      : (responseText ? [{ role: 'assistant' as const, content: responseText }] : []);
    const finalMessages = [...previousMessages, userMessage, ...turnMessages];

    await sessionStore.setMessagesForSession(sessionId, finalMessages);
    if (response.conversationId) {
      await sessionStore.setServerConversationIdForSession(sessionId, response.conversationId);
    }

    return { responseText };
  } finally {
    connectionManager.decrementActiveRequests(sessionId);
  }
}
