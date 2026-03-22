import type { ChatMessage } from './openaiClient';

type ConversationHistoryLikeMessage = {
  id?: string;
  role: ChatMessage['role'];
  content?: string;
  timestamp?: number;
  toolCalls?: ChatMessage['toolCalls'];
  toolResults?: ChatMessage['toolResults'];
};

export interface BuildChatMessagesFromHistoryOptions {
  includeUsers?: boolean;
  latestTurnOnly?: boolean;
}

export function buildChatMessagesFromHistory(
  history: ConversationHistoryLikeMessage[] | undefined,
  options: BuildChatMessagesFromHistoryOptions = {}
): ChatMessage[] {
  if (!history?.length) {
    return [];
  }

  const { includeUsers = false, latestTurnOnly = false } = options;
  let startIndex = 0;

  if (latestTurnOnly) {
    for (let i = 0; i < history.length; i++) {
      if (history[i]?.role === 'user') {
        startIndex = i;
      }
    }
  }

  const messages: ChatMessage[] = [];
  for (let i = startIndex; i < history.length; i++) {
    const historyMsg = history[i];
    if (!historyMsg) {
      continue;
    }

    if (!includeUsers && historyMsg.role === 'user') {
      continue;
    }

    if (historyMsg.role === 'tool' && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.toolCalls && lastMessage.toolCalls.length > 0) {
        const hasToolResults = historyMsg.toolResults && historyMsg.toolResults.length > 0;
        if (hasToolResults) {
          lastMessage.toolResults = [
            ...(lastMessage.toolResults || []),
            ...(historyMsg.toolResults || []),
          ];
          continue;
        }
      }
    }

    messages.push({
      id: historyMsg.id,
      role: historyMsg.role === 'tool' ? 'assistant' : historyMsg.role,
      content: historyMsg.content || '',
      timestamp: historyMsg.timestamp,
      toolCalls: historyMsg.toolCalls,
      toolResults: historyMsg.toolResults,
    });
  }

  return messages;
}
