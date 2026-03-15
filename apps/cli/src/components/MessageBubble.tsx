import type { ChatMessage } from '../types/chat';
import { ToolCallView } from './ToolCallView';

/**
 * MessageBubble — renders a single chat message (user or assistant).
 *
 * User messages are labeled "You" with a cyan accent.
 * Assistant messages are labeled "Agent" with a green accent.
 * Streaming messages display a block cursor (▍) at the end.
 * Assistant messages may include tool calls rendered inline.
 */
export interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const label = isUser ? 'You' : 'Agent';
  const labelColor = isUser ? '#7dcfff' : '#9ece6a';
  const contentColor = isUser ? '#a9b1d6' : '#c0caf5';

  const hasToolCalls = !isUser && message.toolCalls && message.toolCalls.length > 0;

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

      {/* Tool calls (shown before the text content) */}
      {hasToolCalls && (
        <box flexDirection="column" width="100%">
          {message.toolCalls!.map((tc) => (
            <ToolCallView key={tc.id} toolCall={tc} />
          ))}
        </box>
      )}

      {/* Text content */}
      {displayContent.length > 0 && (
        <box paddingLeft={2} width="100%">
          <text fg={contentColor} wrapMode="word">{displayContent}</text>
        </box>
      )}
    </box>
  );
}
