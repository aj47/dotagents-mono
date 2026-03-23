import type { ChatMessage } from '../lib/openaiClient';

type HistoryMessageLike = {
  id?: string;
  role: 'user' | 'assistant' | 'tool';
  content?: string;
  timestamp?: number;
  toolCalls?: ChatMessage['toolCalls'];
  toolResults?: ChatMessage['toolResults'];
};

type BuildChatMessagesOptions = {
  includeUserMessages?: boolean;
  startFromLastUser?: boolean;
};

const SYNTHETIC_TOOL_FAILURE_SUMMARY_REGEX = /^TOOL FAILED:/i;

export function isSyntheticToolFailureSummary(content?: string): boolean {
  return SYNTHETIC_TOOL_FAILURE_SUMMARY_REGEX.test(content?.trim() ?? '');
}

export function buildChatMessagesFromHistory(
  history: Array<HistoryMessageLike | null | undefined>,
  options: BuildChatMessagesOptions = {},
): ChatMessage[] {
  const { includeUserMessages = false, startFromLastUser = true } = options;

  if (!history.length) {
    return [];
  }

  let startIndex = 0;
  if (startFromLastUser) {
    for (let i = 0; i < history.length; i += 1) {
      if (history[i]?.role === 'user') {
        startIndex = i;
      }
    }
  }

  const messages: ChatMessage[] = [];
  for (let i = startIndex; i < history.length; i += 1) {
    const historyMsg = history[i];
    if (!historyMsg) continue;
    if (!includeUserMessages && historyMsg.role === 'user') continue;

    if (historyMsg.role === 'tool' && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && (lastMessage.toolCalls?.length ?? 0) > 0) {
        if ((historyMsg.toolResults?.length ?? 0) > 0) {
          lastMessage.toolResults = [
            ...(lastMessage.toolResults || []),
            ...historyMsg.toolResults!,
          ];
          continue;
        }

        if (
          isSyntheticToolFailureSummary(historyMsg.content)
          && (lastMessage.toolResults?.length ?? 0) > 0
        ) {
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
