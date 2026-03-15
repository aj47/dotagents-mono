import type { ChatMessage, ChatStatus } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

/**
 * ChatView — main chat interface component.
 *
 * Composes a scrollable message history area (ScrollBox) with
 * a message input bar at the bottom. Handles:
 * - Empty state (welcome message)
 * - Message list rendering via MessageBubble
 * - Status bar (streaming/error indicators)
 * - Input disabling during streaming
 */
export interface ChatViewProps {
  messages: ChatMessage[];
  status: ChatStatus;
  error?: string;
  onSendMessage: (message: string) => void;
}

export function ChatView({ messages, status, error, onSendMessage }: ChatViewProps) {
  const isStreaming = status === 'streaming';
  const hasMessages = messages.length > 0;

  return (
    <box flexDirection="column" flexGrow={1} width="100%">
      {/* Message history area */}
      <scrollbox
        flexGrow={1}
        width="100%"
        stickyScroll
        stickyStart="bottom"
        padding={1}
      >
        {!hasMessages && (
          <box flexDirection="column" width="100%">
            <text fg="#565f89">
              Type a message below to start chatting with your agent.
            </text>
          </box>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </scrollbox>

      {/* Error display */}
      {error && (
        <box width="100%" paddingX={1}>
          <text fg="#f7768e">⚠ Error: {error}</text>
        </box>
      )}

      {/* Status bar */}
      <box width="100%" paddingX={1}>
        <text fg="#565f89">
          {isStreaming
            ? '● Streaming response...'
            : status === 'error'
              ? '● Error occurred — you can retry'
              : ''}
        </text>
      </box>

      {/* Input area */}
      <box
        width="100%"
        border
        borderStyle="single"
        borderColor={isStreaming ? '#414868' : '#7aa2f7'}
        paddingX={1}
      >
        <ChatInput
          onSubmit={onSendMessage}
          disabled={isStreaming}
          placeholder={
            isStreaming
              ? 'Waiting for response...'
              : 'Type a message...'
          }
        />
      </box>
    </box>
  );
}
