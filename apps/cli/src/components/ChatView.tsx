import type { ChatMessage, ChatStatus, ToolApprovalInfo } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ToolApprovalPrompt } from './ToolApprovalPrompt';

/**
 * ChatView — main chat interface component.
 *
 * Composes a scrollable message history area (ScrollBox) with
 * a message input bar at the bottom. Handles:
 * - Empty state (welcome message)
 * - Message list rendering via MessageBubble
 * - Tool call display (in-progress, completed, error) inline with messages
 * - Tool approval prompt with Y/N keybindings
 * - Status bar (streaming/error/approval indicators)
 * - Input disabling during streaming or approval
 */
export interface ChatViewProps {
  messages: ChatMessage[];
  status: ChatStatus;
  error?: string;
  pendingApproval?: ToolApprovalInfo;
  onSendMessage: (message: string) => void;
  onApprove?: () => void;
  onDeny?: () => void;
}

export function ChatView({
  messages,
  status,
  error,
  pendingApproval,
  onSendMessage,
  onApprove,
  onDeny,
}: ChatViewProps) {
  const isStreaming = status === 'streaming';
  const isAwaitingApproval = status === 'awaiting_approval';
  const inputDisabled = isStreaming || isAwaitingApproval;
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

      {/* Tool approval prompt */}
      {isAwaitingApproval && pendingApproval && onApprove && onDeny && (
        <box width="100%" paddingX={1} paddingY={0}>
          <ToolApprovalPrompt
            approval={pendingApproval}
            onApprove={onApprove}
            onDeny={onDeny}
          />
        </box>
      )}

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
            : isAwaitingApproval
              ? '● Awaiting tool approval...'
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
        borderColor={inputDisabled ? '#414868' : '#7aa2f7'}
        paddingX={1}
      >
        <ChatInput
          onSubmit={onSendMessage}
          disabled={inputDisabled}
          placeholder={
            isStreaming
              ? 'Waiting for response...'
              : isAwaitingApproval
                ? 'Approve or deny the tool above...'
                : 'Type a message...'
          }
        />
      </box>
    </box>
  );
}
