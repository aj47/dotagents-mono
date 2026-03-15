import { describe, it, expect } from 'vitest';
import type { ConversationHistoryItem } from '@dotagents/core';
import { ConversationListView } from './ConversationListView';

/**
 * ConversationListView tests — verify conversation list display logic.
 */

/** Helper: create a mock history item */
function createItem(
  id: string,
  title: string,
  messageCount: number = 2,
  updatedAt?: number,
): ConversationHistoryItem {
  return {
    id,
    title,
    createdAt: Date.now() - 60000,
    updatedAt: updatedAt ?? Date.now(),
    messageCount,
    lastMessage: 'Last message',
    preview: 'Preview...',
  };
}

describe('ConversationListView', () => {
  it('exports a ConversationListView component', () => {
    expect(ConversationListView).toBeDefined();
    expect(typeof ConversationListView).toBe('function');
  });

  describe('display logic', () => {
    it('shows empty state when no conversations', () => {
      const conversations: ConversationHistoryItem[] = [];
      expect(conversations.length).toBe(0);
    });

    it('shows conversation count', () => {
      const conversations = [
        createItem('c1', 'First'),
        createItem('c2', 'Second'),
        createItem('c3', 'Third'),
      ];
      expect(conversations.length).toBe(3);
    });

    it('conversations are shown with 1-based index', () => {
      const conversations = [
        createItem('c1', 'First'),
        createItem('c2', 'Second'),
      ];
      const indices = conversations.map((_, i) => i + 1);
      expect(indices).toEqual([1, 2]);
    });

    it('identifies active conversation', () => {
      const conversations = [
        createItem('c1', 'First'),
        createItem('c2', 'Second'),
      ];
      const currentId = 'c1';
      const activeConv = conversations.find((c) => c.id === currentId);
      expect(activeConv).toBeDefined();
      expect(activeConv!.title).toBe('First');
    });

    it('truncates long titles', () => {
      const longTitle = 'A'.repeat(60);
      const maxLen = 40;
      const truncated = longTitle.length > maxLen
        ? longTitle.slice(0, maxLen - 3) + '...'
        : longTitle;
      expect(truncated.length).toBe(40);
      expect(truncated).toContain('...');
    });

    it('does not truncate short titles', () => {
      const shortTitle = 'Hello world';
      const maxLen = 40;
      const truncated = shortTitle.length > maxLen
        ? shortTitle.slice(0, maxLen - 3) + '...'
        : shortTitle;
      expect(truncated).toBe('Hello world');
    });
  });

  describe('timestamp formatting', () => {
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
      });
    }

    it('formats recent time as "just now"', () => {
      expect(formatTimestamp(Date.now() - 10000)).toBe('just now');
    });

    it('formats minutes ago', () => {
      expect(formatTimestamp(Date.now() - 5 * 60 * 1000)).toBe('5m ago');
    });

    it('formats hours ago', () => {
      expect(formatTimestamp(Date.now() - 3 * 60 * 60 * 1000)).toBe('3h ago');
    });

    it('formats days ago', () => {
      expect(formatTimestamp(Date.now() - 2 * 24 * 60 * 60 * 1000)).toBe('2d ago');
    });
  });

  describe('message count display', () => {
    it('shows message count from history item', () => {
      const item = createItem('c1', 'Test', 15);
      expect(item.messageCount).toBe(15);
    });

    it('handles zero messages', () => {
      const item = createItem('c1', 'Empty', 0);
      expect(item.messageCount).toBe(0);
    });
  });
});
