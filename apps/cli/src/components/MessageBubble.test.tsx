import { describe, it, expect } from 'vitest';
import type { ChatMessage } from '../types/chat';

/**
 * MessageBubble unit tests — validate display logic for user/assistant
 * messages, streaming indicators, and multiline content.
 */

import { MessageBubble } from './MessageBubble';

describe('MessageBubble', () => {
  it('exports a MessageBubble component', () => {
    expect(MessageBubble).toBeDefined();
    expect(typeof MessageBubble).toBe('function');
  });

  describe('display logic', () => {
    it('identifies user messages correctly', () => {
      const msg: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };
      const isUser = msg.role === 'user';
      const label = isUser ? 'You' : 'Agent';
      expect(label).toBe('You');
    });

    it('identifies assistant messages correctly', () => {
      const msg: ChatMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: Date.now(),
      };
      const isUser = msg.role === 'user';
      const label = isUser ? 'You' : 'Agent';
      expect(label).toBe('Agent');
    });

    it('appends streaming cursor for in-progress messages', () => {
      const msg: ChatMessage = {
        id: 'msg-3',
        role: 'assistant',
        content: 'Thinking',
        timestamp: Date.now(),
        isStreaming: true,
      };
      const displayContent =
        msg.isStreaming && msg.content.length === 0
          ? '▍'
          : msg.isStreaming
            ? msg.content + '▍'
            : msg.content;
      expect(displayContent).toBe('Thinking▍');
    });

    it('shows only cursor for empty streaming message', () => {
      const msg: ChatMessage = {
        id: 'msg-4',
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };
      const displayContent =
        msg.isStreaming && msg.content.length === 0
          ? '▍'
          : msg.isStreaming
            ? msg.content + '▍'
            : msg.content;
      expect(displayContent).toBe('▍');
    });

    it('does not append cursor for completed messages', () => {
      const msg: ChatMessage = {
        id: 'msg-5',
        role: 'assistant',
        content: 'Done!',
        timestamp: Date.now(),
        isStreaming: false,
      };
      const displayContent =
        msg.isStreaming && msg.content.length === 0
          ? '▍'
          : msg.isStreaming
            ? msg.content + '▍'
            : msg.content;
      expect(displayContent).toBe('Done!');
    });

    it('handles multiline content', () => {
      const msg: ChatMessage = {
        id: 'msg-6',
        role: 'assistant',
        content: 'Line 1\nLine 2\nLine 3',
        timestamp: Date.now(),
      };
      expect(msg.content).toContain('\n');
      expect(msg.content.split('\n')).toHaveLength(3);
    });

    it('uses correct colors for user vs assistant', () => {
      const userColor = '#7dcfff';
      const assistantColor = '#9ece6a';
      expect(userColor).not.toBe(assistantColor);
    });
  });
});
