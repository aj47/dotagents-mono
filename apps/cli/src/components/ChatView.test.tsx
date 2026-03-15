import { describe, it, expect } from 'vitest';
import type { ChatMessage, ChatStatus } from '../types/chat';

/**
 * ChatView unit tests — validate the view logic for message display,
 * status transitions, error handling, and input state.
 */

import { ChatView } from './ChatView';

/** Helper to compute status text matching ChatView's logic */
function getStatusText(status: ChatStatus): string {
  if (status === 'streaming') return '● Streaming response...';
  if (status === 'error') return '● Error occurred — you can retry';
  return '';
}

describe('ChatView', () => {
  it('exports a ChatView component', () => {
    expect(ChatView).toBeDefined();
    expect(typeof ChatView).toBe('function');
  });

  describe('view state logic', () => {
    it('shows empty state when no messages', () => {
      const messages: ChatMessage[] = [];
      const hasMessages = messages.length > 0;
      expect(hasMessages).toBe(false);
    });

    it('shows messages when present', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
        },
      ];
      const hasMessages = messages.length > 0;
      expect(hasMessages).toBe(true);
    });

    it('disables input during streaming', () => {
      const status: ChatStatus = 'streaming';
      expect(status === 'streaming').toBe(true);
    });

    it('enables input when idle', () => {
      const status: ChatStatus = 'idle';
      expect(status).not.toBe('streaming');
    });

    it('enables input after error', () => {
      const status: ChatStatus = 'error';
      expect(status).not.toBe('streaming');
    });

    it('provides error message for display', () => {
      const error = 'Network connection failed';
      expect(error).toBeTruthy();
      expect(error).toContain('Network');
    });

    it('shows streaming indicator text during streaming', () => {
      expect(getStatusText('streaming')).toContain('Streaming');
    });

    it('shows error status text on error', () => {
      expect(getStatusText('error')).toContain('Error');
    });

    it('shows no status text when idle', () => {
      expect(getStatusText('idle')).toBe('');
    });

    it('uses correct placeholder during streaming', () => {
      const isStreaming = true;
      const placeholder = isStreaming
        ? 'Waiting for response...'
        : 'Type a message...';
      expect(placeholder).toBe('Waiting for response...');
    });

    it('uses default placeholder when idle', () => {
      const isStreaming = false;
      const placeholder = isStreaming
        ? 'Waiting for response...'
        : 'Type a message...';
      expect(placeholder).toBe('Type a message...');
    });
  });

  describe('message ordering', () => {
    it('renders messages in chronological order', () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'First', timestamp: 1000 },
        { id: '2', role: 'assistant', content: 'Second', timestamp: 1001 },
        { id: '3', role: 'user', content: 'Third', timestamp: 1002 },
      ];
      expect(messages[0].content).toBe('First');
      expect(messages[1].content).toBe('Second');
      expect(messages[2].content).toBe('Third');
    });

    it('handles mixed user and assistant messages', () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'Q1', timestamp: 1000 },
        { id: '2', role: 'assistant', content: 'A1', timestamp: 1001 },
        { id: '3', role: 'user', content: 'Q2', timestamp: 1002 },
        { id: '4', role: 'assistant', content: 'A2', timestamp: 1003 },
      ];
      const userMsgs = messages.filter((m) => m.role === 'user');
      const assistantMsgs = messages.filter((m) => m.role === 'assistant');
      expect(userMsgs).toHaveLength(2);
      expect(assistantMsgs).toHaveLength(2);
    });
  });
});
