import type { ConversationHistoryItem } from '@dotagents/core';

/**
 * ConversationListView — displays a list of conversations in the TUI.
 *
 * Shows each conversation with its index (for /switch <n>), ID, title,
 * message count, and last updated timestamp. Highlights the currently
 * active conversation.
 */
export interface ConversationListViewProps {
  conversations: ConversationHistoryItem[];
  currentConversationId: string | null;
}

/**
 * Format a timestamp into a human-readable relative or absolute date string.
 */
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Truncate a string to a max length with ellipsis.
 */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export function ConversationListView({
  conversations,
  currentConversationId,
}: ConversationListViewProps) {
  if (conversations.length === 0) {
    return (
      <box flexDirection="column" width="100%" padding={1}>
        <text fg="#565f89">No conversations found. Type a message to start one.</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" width="100%" padding={1}>
      <text fg="#7aa2f7">
        <strong>Conversations</strong>
        <text fg="#565f89"> ({conversations.length} total)</text>
      </text>
      <text fg="#565f89">Use /switch {'<'}number{'>'} or /switch {'<'}id{'>'} to switch.</text>
      <box height={1} />
      {conversations.map((conv, index) => {
        const isActive = conv.id === currentConversationId;
        const indicator = isActive ? '▸' : ' ';
        const idxStr = String(index + 1).padStart(2, ' ');
        const title = truncate(conv.title || '(untitled)', 40);
        const time = formatTimestamp(conv.updatedAt);

        return (
          <box key={conv.id} flexDirection="row" width="100%">
            <text fg={isActive ? '#7aa2f7' : '#a9b1d6'}>
              {indicator} {idxStr}. {title}
            </text>
            <text fg="#565f89">
              {'  '}[{conv.messageCount} msgs] {time}
            </text>
          </box>
        );
      })}
    </box>
  );
}
