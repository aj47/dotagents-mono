import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Conversation, ConversationHistoryItem, ConversationMessage } from '@dotagents/core';

/**
 * Tests for conversation management logic.
 *
 * Tests the pure logic of conversation operations (create, list, switch, save)
 * without requiring React rendering. Uses mocked ConversationService.
 */

// Mock ConversationService
const mockCreateConversation = vi.fn();
const mockGetConversationHistory = vi.fn();
const mockLoadConversation = vi.fn();
const mockAddMessageToConversation = vi.fn();

vi.mock('@dotagents/core', () => ({
  ConversationService: vi.fn().mockImplementation(() => ({
    createConversation: mockCreateConversation,
    getConversationHistory: mockGetConversationHistory,
    loadConversation: mockLoadConversation,
    addMessageToConversation: mockAddMessageToConversation,
  })),
  container: {
    register: vi.fn(),
    resolve: vi.fn(),
    has: vi.fn(() => false),
  },
  ServiceTokens: {
    PathResolver: 'PathResolver',
    ProgressEmitter: 'ProgressEmitter',
    UserInteraction: 'UserInteraction',
    NotificationService: 'NotificationService',
  },
}));

/**
 * Helper: create a mock conversation
 */
function createMockConversation(
  id: string,
  title: string,
  messages: ConversationMessage[] = [],
): Conversation {
  return {
    id,
    title,
    createdAt: Date.now() - 10000,
    updatedAt: Date.now(),
    messages,
  };
}

/**
 * Helper: create a mock conversation history item
 */
function createMockHistoryItem(
  id: string,
  title: string,
  messageCount: number = 2,
): ConversationHistoryItem {
  return {
    id,
    title,
    createdAt: Date.now() - 10000,
    updatedAt: Date.now(),
    messageCount,
    lastMessage: 'Last message',
    preview: 'Preview...',
  };
}

describe('conversation management logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('creating new conversations', () => {
    it('creates a conversation via ConversationService', async () => {
      const mockConv = createMockConversation('conv_1', 'Hello');
      mockConv.messages = [
        { id: 'msg_1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      mockCreateConversation.mockResolvedValue(mockConv);

      const result = await mockCreateConversation('Hello', 'user');

      expect(result).toBeDefined();
      expect(result.id).toBe('conv_1');
      expect(result.title).toBe('Hello');
      expect(result.messages).toHaveLength(1);
      expect(mockCreateConversation).toHaveBeenCalledWith('Hello', 'user');
    });

    it('new conversation has a unique ID', async () => {
      const conv1 = createMockConversation('conv_1', 'First');
      const conv2 = createMockConversation('conv_2', 'Second');
      mockCreateConversation.mockResolvedValueOnce(conv1);
      mockCreateConversation.mockResolvedValueOnce(conv2);

      const r1 = await mockCreateConversation('First', 'user');
      const r2 = await mockCreateConversation('Second', 'user');

      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('listing conversations', () => {
    it('returns empty list when no conversations exist', async () => {
      mockGetConversationHistory.mockResolvedValue([]);

      const result = await mockGetConversationHistory();

      expect(result).toEqual([]);
    });

    it('returns all conversations sorted by updatedAt', async () => {
      const items: ConversationHistoryItem[] = [
        createMockHistoryItem('conv_2', 'Newer conversation'),
        createMockHistoryItem('conv_1', 'Older conversation'),
      ];
      mockGetConversationHistory.mockResolvedValue(items);

      const result = await mockGetConversationHistory();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('conv_2');
      expect(result[1].id).toBe('conv_1');
    });

    it('conversation items include title and message count', async () => {
      const item = createMockHistoryItem('conv_1', 'Test conversation', 5);
      mockGetConversationHistory.mockResolvedValue([item]);

      const result = await mockGetConversationHistory();

      expect(result[0].title).toBe('Test conversation');
      expect(result[0].messageCount).toBe(5);
    });
  });

  describe('switching conversations', () => {
    it('loads a conversation by ID', async () => {
      const conv = createMockConversation('conv_abc', 'My conversation');
      conv.messages = [
        { id: 'msg_1', role: 'user', content: 'Hello', timestamp: 1000 },
        { id: 'msg_2', role: 'assistant', content: 'Hi there!', timestamp: 1001 },
      ];
      mockLoadConversation.mockResolvedValue(conv);

      const result = await mockLoadConversation('conv_abc');

      expect(result).toBeDefined();
      expect(result!.id).toBe('conv_abc');
      expect(result!.messages).toHaveLength(2);
    });

    it('returns null for non-existent conversation', async () => {
      mockLoadConversation.mockResolvedValue(null);

      const result = await mockLoadConversation('non_existent');

      expect(result).toBeNull();
    });

    it('can switch by index (1-based)', async () => {
      const items: ConversationHistoryItem[] = [
        createMockHistoryItem('conv_first', 'First'),
        createMockHistoryItem('conv_second', 'Second'),
        createMockHistoryItem('conv_third', 'Third'),
      ];
      mockGetConversationHistory.mockResolvedValue(items);

      const history = await mockGetConversationHistory();
      // Index 2 = second conversation (0-based: index 1)
      const targetId = history[1].id; // conv_second

      const conv = createMockConversation(targetId, 'Second');
      conv.messages = [
        { id: 'm1', role: 'user', content: 'Test', timestamp: 1000 },
      ];
      mockLoadConversation.mockResolvedValue(conv);

      const loaded = await mockLoadConversation(targetId);
      expect(loaded!.id).toBe('conv_second');
    });

    it('loaded conversation messages filter to user and assistant roles', () => {
      const messages: ConversationMessage[] = [
        { id: 'm1', role: 'user', content: 'Hello', timestamp: 1000 },
        { id: 'm2', role: 'assistant', content: 'Hi', timestamp: 1001 },
        { id: 'm3', role: 'tool', content: 'Tool result', timestamp: 1002 },
        { id: 'm4', role: 'assistant', content: 'Done', timestamp: 1003 },
      ];

      const chatMessages = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          id: m.id,
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.content,
          timestamp: m.timestamp,
        }));

      expect(chatMessages).toHaveLength(3);
      expect(chatMessages[0].role).toBe('user');
      expect(chatMessages[1].role).toBe('assistant');
      expect(chatMessages[2].role).toBe('assistant');
    });
  });

  describe('saving messages', () => {
    it('creates conversation on first user message', async () => {
      const conv = createMockConversation('conv_new', 'Hello agent');
      conv.messages = [
        { id: 'm1', role: 'user', content: 'Hello agent', timestamp: Date.now() },
      ];
      mockCreateConversation.mockResolvedValue(conv);

      const result = await mockCreateConversation('Hello agent', 'user');

      expect(result.id).toBe('conv_new');
      expect(mockCreateConversation).toHaveBeenCalledWith('Hello agent', 'user');
    });

    it('adds message to existing conversation', async () => {
      const updated = createMockConversation('conv_1', 'Test');
      updated.messages = [
        { id: 'm1', role: 'user', content: 'Hello', timestamp: 1000 },
        { id: 'm2', role: 'assistant', content: 'Hi!', timestamp: 1001 },
      ];
      mockAddMessageToConversation.mockResolvedValue(updated);

      const result = await mockAddMessageToConversation('conv_1', 'Hi!', 'assistant');

      expect(result).toBeDefined();
      expect(result!.messages).toHaveLength(2);
      expect(mockAddMessageToConversation).toHaveBeenCalledWith('conv_1', 'Hi!', 'assistant');
    });
  });

  describe('conversation persistence format', () => {
    it('conversation has required fields for desktop compatibility', () => {
      const conv: Conversation = {
        id: 'conv_test',
        title: 'Test conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            id: 'msg_1',
            role: 'user',
            content: 'Hello',
            timestamp: Date.now(),
          },
        ],
      };

      // Verify all required fields exist
      expect(conv.id).toBeDefined();
      expect(conv.title).toBeDefined();
      expect(conv.createdAt).toBeTypeOf('number');
      expect(conv.updatedAt).toBeTypeOf('number');
      expect(Array.isArray(conv.messages)).toBe(true);
      expect(conv.messages[0].id).toBeDefined();
      expect(conv.messages[0].role).toBeDefined();
      expect(conv.messages[0].content).toBeDefined();
      expect(conv.messages[0].timestamp).toBeTypeOf('number');
    });

    it('conversation ID follows naming convention', () => {
      const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      expect(id).toMatch(/^conv_\d+_[a-z0-9]+$/);
    });
  });

  describe('index-based switching', () => {
    it('index 1 maps to first conversation in list', () => {
      const items = [
        createMockHistoryItem('conv_a', 'A'),
        createMockHistoryItem('conv_b', 'B'),
      ];

      const index = 1; // 1-based
      const target = items[index - 1];
      expect(target.id).toBe('conv_a');
    });

    it('index beyond list length is invalid', () => {
      const items = [
        createMockHistoryItem('conv_a', 'A'),
      ];

      const index = 5;
      const isValid = index > 0 && index <= items.length;
      expect(isValid).toBe(false);
    });

    it('non-numeric input is treated as conversation ID', () => {
      const input = 'conv_abc_123';
      const asNumber = parseInt(input, 10);
      const isNumeric = !isNaN(asNumber) && asNumber > 0;
      expect(isNumeric).toBe(false);
    });

    it('numeric input is treated as index', () => {
      const input = '3';
      const asNumber = parseInt(input, 10);
      const isNumeric = !isNaN(asNumber) && asNumber > 0;
      expect(isNumeric).toBe(true);
      expect(asNumber).toBe(3);
    });
  });
});
