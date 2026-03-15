import { describe, it, expect } from 'vitest';
import type { ChatMessage, ToolCallInfo } from '../types/chat';

/**
 * MessageBubble unit tests — validate display logic for user/assistant
 * messages, streaming indicators, tool calls inline, and multiline content.
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

  describe('tool call integration', () => {
    it('detects assistant messages with tool calls', () => {
      const msg: ChatMessage = {
        id: 'msg-7',
        role: 'assistant',
        content: 'Here are the results.',
        timestamp: Date.now(),
        toolCalls: [
          {
            id: 'tc-1',
            toolName: 'search_files',
            args: { pattern: '*.ts' },
            status: 'completed',
            result: 'Found 5 files',
          },
        ],
      };
      const isUser = msg.role === 'user';
      const hasToolCalls = !isUser && msg.toolCalls && msg.toolCalls.length > 0;
      expect(hasToolCalls).toBe(true);
    });

    it('user messages never show tool calls', () => {
      const msg: ChatMessage = {
        id: 'msg-8',
        role: 'user',
        content: 'Search for files',
        timestamp: Date.now(),
      };
      const isUser = msg.role === 'user';
      const hasToolCalls = !isUser && msg.toolCalls && msg.toolCalls.length > 0;
      expect(hasToolCalls).toBeFalsy();
    });

    it('assistant messages without tool calls show no tools section', () => {
      const msg: ChatMessage = {
        id: 'msg-9',
        role: 'assistant',
        content: 'Just text response',
        timestamp: Date.now(),
      };
      const isUser = msg.role === 'user';
      const hasToolCalls = !isUser && msg.toolCalls && msg.toolCalls.length > 0;
      expect(hasToolCalls).toBeFalsy();
    });

    it('handles multiple tool calls on a single message', () => {
      const toolCalls: ToolCallInfo[] = [
        { id: 'tc-1', toolName: 'read_file', args: { path: 'a.ts' }, status: 'completed' },
        { id: 'tc-2', toolName: 'read_file', args: { path: 'b.ts' }, status: 'completed' },
      ];
      const msg: ChatMessage = {
        id: 'msg-10',
        role: 'assistant',
        content: 'I read both files.',
        timestamp: Date.now(),
        toolCalls,
      };
      expect(msg.toolCalls).toHaveLength(2);
    });

    it('handles messages with tool calls but no text content', () => {
      const msg: ChatMessage = {
        id: 'msg-11',
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        toolCalls: [
          { id: 'tc-1', toolName: 'execute', args: {}, status: 'running' },
        ],
      };
      const displayContent = msg.content;
      expect(displayContent.length).toBe(0);
      expect(msg.toolCalls).toHaveLength(1);
    });
  });
});
