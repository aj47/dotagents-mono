import type { ChatMessage } from '../lib/openaiClient';

type PersistibleChatMessage = Pick<
  ChatMessage,
  'role' | 'content' | 'timestamp' | 'toolCalls' | 'toolResults'
>;

export function createChatMessagePersistenceSignature(
  messages: readonly ChatMessage[],
): string {
  const persistibleMessages: PersistibleChatMessage[] = messages.map((message) => ({
    role: message.role,
    content: message.content || '',
    timestamp: typeof message.timestamp === 'number' ? message.timestamp : undefined,
    toolCalls: message.toolCalls,
    toolResults: message.toolResults,
  }));

  return JSON.stringify(persistibleMessages);
}

export function shouldPersistChatMessages(options: {
  messages: readonly ChatMessage[];
  previousMessageCount: number;
  lastPersistedSignature: string | null;
  responding: boolean;
}): boolean {
  const { messages, previousMessageCount, lastPersistedSignature, responding } = options;

  if (messages.length === 0) {
    return false;
  }

  if (messages.length !== previousMessageCount) {
    return true;
  }

  if (responding) {
    return false;
  }

  return createChatMessagePersistenceSignature(messages) !== lastPersistedSignature;
}