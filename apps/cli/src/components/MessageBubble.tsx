import type { ChatMessage } from '../types/chat';

/**
 * MessageBubble — renders a single chat message (user or assistant).
 *
 * User messages are labeled "You" with a cyan accent.
 * Assistant messages are labeled "Agent" with a green accent.
 * Streaming messages display a block cursor (▍) at the end.
 */
export interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const label = isUser ? 'You' : 'Agent';
  const labelColor = isUser ? '#7dcfff' : '#9ece6a';
  const contentColor = isUser ? '#a9b1d6' : '#c0caf5';

  const displayContent =
    message.isStreaming && message.content.length === 0
      ? '▍'
      : message.isStreaming
        ? message.content + '▍'
        : message.content;

  return (
    <box flexDirection="column" width="100%" marginBottom={1}>
      <text fg={labelColor}>
        <strong>{label}</strong>
      </text>
      <box paddingLeft={2} width="100%">
        <text fg={contentColor} wrapMode="word">{displayContent}</text>
      </box>
    </box>
  );
}
