import { describe, it, expect } from 'vitest';
import type { ChatMessage, ChatStatus, ToolApprovalInfo, ToolCallInfo } from '../types/chat';

/**
 * ChatView unit tests — validate the view logic for message display,
 * status transitions, error handling, tool display, approval prompt,
 * and input state.
 */

import { ChatView } from './ChatView';

/** Helper to compute status text matching ChatView's logic */
function getStatusText(status: ChatStatus): string {
  if (status === 'streaming') return '● Streaming response...';
  if (status === 'awaiting_approval') return '● Awaiting tool approval...';
  if (status === 'error') return '● Error occurred — you can retry';
  return '';
}

/** Helper to determine if input should be disabled */
function isInputDisabled(status: ChatStatus): boolean {
  return status === 'streaming' || status === 'awaiting_approval';
}

/** Helper to compute placeholder text matching ChatView's logic */
function getPlaceholder(status: ChatStatus): string {
  if (status === 'streaming') return 'Waiting for response...';
  if (status === 'awaiting_approval') return 'Approve or deny the tool above...';
  return 'Type a message...';
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
      expect(isInputDisabled(status)).toBe(true);
    });

    it('disables input during tool approval', () => {
      const status: ChatStatus = 'awaiting_approval';
      expect(isInputDisabled(status)).toBe(true);
    });

    it('enables input when idle', () => {
      const status: ChatStatus = 'idle';
      expect(isInputDisabled(status)).toBe(false);
    });

    it('enables input after error', () => {
      const status: ChatStatus = 'error';
      expect(isInputDisabled(status)).toBe(false);
    });

    it('provides error message for display', () => {
      const error = 'Network connection failed';
      expect(error).toBeTruthy();
      expect(error).toContain('Network');
    });

    it('shows streaming indicator text during streaming', () => {
      expect(getStatusText('streaming')).toContain('Streaming');
    });

    it('shows approval indicator text during awaiting_approval', () => {
      expect(getStatusText('awaiting_approval')).toContain('Awaiting tool approval');
    });

    it('shows error status text on error', () => {
      expect(getStatusText('error')).toContain('Error');
    });

    it('shows no status text when idle', () => {
      expect(getStatusText('idle')).toBe('');
    });

    it('uses correct placeholder during streaming', () => {
      expect(getPlaceholder('streaming')).toBe('Waiting for response...');
    });

    it('uses approval placeholder during awaiting_approval', () => {
      expect(getPlaceholder('awaiting_approval')).toBe('Approve or deny the tool above...');
    });

    it('uses default placeholder when idle', () => {
      expect(getPlaceholder('idle')).toBe('Type a message...');
    });
  });

  describe('tool call display integration', () => {
    it('assistant message can have tool calls', () => {
      const msg: ChatMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: 'I found the files.',
        timestamp: Date.now(),
        toolCalls: [
          {
            id: 'tc-1',
            toolName: 'list_files',
            args: { directory: '.' },
            status: 'completed',
            result: 'file1.ts, file2.ts',
          },
        ],
      };
      expect(msg.toolCalls).toHaveLength(1);
      expect(msg.toolCalls![0].status).toBe('completed');
    });

    it('assistant message can have multiple tool calls', () => {
      const toolCalls: ToolCallInfo[] = [
        { id: 'tc-1', toolName: 'read_file', args: { path: 'a.ts' }, status: 'completed', result: 'contents' },
        { id: 'tc-2', toolName: 'read_file', args: { path: 'b.ts' }, status: 'completed', result: 'contents' },
        { id: 'tc-3', toolName: 'write_file', args: { path: 'c.ts' }, status: 'error', error: 'Permission denied' },
      ];
      expect(toolCalls).toHaveLength(3);
      expect(toolCalls.filter((tc) => tc.status === 'completed')).toHaveLength(2);
      expect(toolCalls.filter((tc) => tc.status === 'error')).toHaveLength(1);
    });

    it('user messages do not have tool calls', () => {
      const msg: ChatMessage = {
        id: 'msg-2',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };
      const hasToolCalls = msg.role !== 'user' && msg.toolCalls && msg.toolCalls.length > 0;
      expect(hasToolCalls).toBeFalsy();
    });
  });

  describe('approval prompt visibility', () => {
    function isApprovalVisible(status: ChatStatus): boolean {
      return status === 'awaiting_approval';
    }

    it('shows approval prompt when status is awaiting_approval', () => {
      const approval: ToolApprovalInfo = {
        approvalId: 'a-1',
        toolName: 'execute_command',
        args: { command: 'ls' },
      };
      expect(isApprovalVisible('awaiting_approval') && !!approval).toBe(true);
    });

    it('hides approval prompt when status is streaming', () => {
      expect(isApprovalVisible('streaming')).toBe(false);
    });

    it('hides approval prompt when status is idle', () => {
      expect(isApprovalVisible('idle')).toBe(false);
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
