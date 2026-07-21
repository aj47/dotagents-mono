import type {
  AgentProgressStep,
  ConversationHistoryMessage,
} from '@dotagents/shared';
import type { ChatMessage } from './openaiClient';

export type LiveProgressHistoryState = {
  startIndex: number;
  messages: ConversationHistoryMessage[];
};

const mergeDefinedProgressFields = (
  previous: AgentProgressStep,
  incoming: AgentProgressStep,
): AgentProgressStep => ({
  ...previous,
  ...incoming,
  toolCall: incoming.toolCall ?? previous.toolCall,
  toolResult: incoming.toolResult ?? previous.toolResult,
  executionStats: incoming.executionStats ?? previous.executionStats,
  delegation: incoming.delegation ?? previous.delegation,
});

/**
 * Progress updates are intentionally windowed by the desktop runtime. Keep the
 * first-seen order and update steps in place so older thinking/tool activity
 * does not disappear when it falls outside a later window.
 */
export const mergeLiveProgressSteps = (
  previous: AgentProgressStep[],
  incoming: AgentProgressStep[] = [],
): AgentProgressStep[] => {
  if (incoming.length === 0) return previous;

  const merged = [...previous];
  const indexById = new Map(merged.map((step, index) => [step.id, index]));

  for (const step of incoming) {
    const existingIndex = indexById.get(step.id);
    if (existingIndex === undefined) {
      indexById.set(step.id, merged.length);
      merged.push(step);
      continue;
    }
    merged[existingIndex] = mergeDefinedProgressFields(merged[existingIndex], step);
  }

  return merged;
};

const mergeDefinedHistoryFields = (
  previous: ConversationHistoryMessage,
  incoming: ConversationHistoryMessage,
): ConversationHistoryMessage => ({
  ...previous,
  ...incoming,
  displayContent: incoming.displayContent ?? previous.displayContent,
  toolCalls: incoming.toolCalls ?? previous.toolCalls,
  toolResults: incoming.toolResults ?? previous.toolResults,
});

/**
 * Conversation history is also sent as a moving window. Reconstruct the
 * absolute window by index so a long-running turn retains earlier tool calls.
 */
export const mergeLiveProgressHistory = (
  previous: LiveProgressHistoryState | null,
  incoming?: ConversationHistoryMessage[],
  incomingStartIndex = 0,
): LiveProgressHistoryState | null => {
  if (!incoming) return previous;
  if (!previous) {
    return {
      startIndex: incomingStartIndex,
      messages: [...incoming],
    };
  }

  const messagesByIndex = new Map<number, ConversationHistoryMessage>();
  previous.messages.forEach((message, offset) => {
    messagesByIndex.set(previous.startIndex + offset, message);
  });
  incoming.forEach((message, offset) => {
    const absoluteIndex = incomingStartIndex + offset;
    const existing = messagesByIndex.get(absoluteIndex);
    messagesByIndex.set(
      absoluteIndex,
      existing ? mergeDefinedHistoryFields(existing, message) : message,
    );
  });

  const orderedEntries = [...messagesByIndex.entries()].sort(([a], [b]) => a - b);
  return {
    startIndex: orderedEntries[0]?.[0] ?? incomingStartIndex,
    messages: orderedEntries.map(([, message]) => message),
  };
};

/** Keep token streaming in its own stable block instead of overwriting the
 * most recent assistant message, which may be an in-flight tool call. */
export const upsertLiveStreamingMessage = (
  messages: ChatMessage[],
  messageId: string,
  content: string,
  turnStartIndex: number,
): ChatMessage[] => {
  const next = [...messages];
  const existingIndex = next.findIndex((message) => message.id === messageId);
  const streamingMessage: ChatMessage = {
    ...(existingIndex >= 0 ? next[existingIndex] : {}),
    id: messageId,
    role: 'assistant',
    content,
  };

  if (existingIndex >= 0) {
    next[existingIndex] = streamingMessage;
    return next;
  }

  const placeholderIndex = next.findIndex((message, index) => (
    index >= turnStartIndex
    && message.role === 'assistant'
    && !message.content
    && !message.toolCalls?.length
    && !message.toolResults?.length
  ));
  if (placeholderIndex >= 0) {
    next[placeholderIndex] = streamingMessage;
    return next;
  }

  next.push(streamingMessage);
  return next;
};
