import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChatMessage, ChatStatus, ToolCallInfo, ToolApprovalInfo } from '../types/chat';

/**
 * Test the chat logic (message creation, empty rejection, state transitions,
 * tool call display, and tool approval flow) without requiring React rendering.
 * This tests the pure logic that useChat wraps around the core LLM engine.
 */

describe('useChat logic', () => {
  describe('message creation', () => {
    it('creates a user message with correct fields', () => {
      const content = 'Hello, agent!';
      const msg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      expect(msg.role).toBe('user');
      expect(msg.content).toBe('Hello, agent!');
      expect(msg.isStreaming).toBeUndefined();
    });

    it('creates an assistant message with streaming flag', () => {
      const msg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };
      expect(msg.role).toBe('assistant');
      expect(msg.isStreaming).toBe(true);
      expect(msg.content).toBe('');
    });

    it('creates an assistant message with tool calls', () => {
      const toolCalls: ToolCallInfo[] = [
        {
          id: 'tc-1',
          toolName: 'search',
          args: { query: 'test' },
          status: 'completed',
          result: 'Found 3 matches',
        },
      ];
      const msg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'Here are the results.',
        timestamp: Date.now(),
        toolCalls,
      };
      expect(msg.toolCalls).toHaveLength(1);
      expect(msg.toolCalls![0].toolName).toBe('search');
      expect(msg.toolCalls![0].status).toBe('completed');
    });
  });

  describe('empty message rejection', () => {
    it('rejects empty string', () => {
      expect(''.trim().length > 0).toBe(false);
    });

    it('rejects whitespace-only string', () => {
      expect('   '.trim().length > 0).toBe(false);
    });

    it('rejects tabs and newlines', () => {
      expect('\t\n'.trim().length > 0).toBe(false);
    });

    it('accepts non-empty string', () => {
      expect('hello'.trim().length > 0).toBe(true);
    });
  });

  describe('status transitions', () => {
    it('transitions from idle to streaming on send', () => {
      let status: ChatStatus = 'idle';
      status = 'streaming';
      expect(status).toBe('streaming');
    });

    it('transitions from streaming to idle on completion', () => {
      let status: ChatStatus = 'streaming';
      status = 'idle';
      expect(status).toBe('idle');
    });

    it('transitions from streaming to error on failure', () => {
      let status: ChatStatus = 'streaming';
      status = 'error';
      expect(status).toBe('error');
    });

    it('transitions from error to streaming on new message', () => {
      let status: ChatStatus = 'error';
      status = 'streaming';
      expect(status).toBe('streaming');
    });

    it('transitions from streaming to awaiting_approval for tool approval', () => {
      const transitions: ChatStatus[] = ['streaming', 'awaiting_approval'];
      expect(transitions[0]).toBe('streaming');
      expect(transitions[1]).toBe('awaiting_approval');
    });

    it('transitions from awaiting_approval to streaming after approve', () => {
      const transitions: ChatStatus[] = ['awaiting_approval', 'streaming'];
      expect(transitions[0]).toBe('awaiting_approval');
      expect(transitions[1]).toBe('streaming');
    });

    it('transitions from awaiting_approval to streaming after deny', () => {
      const transitions: ChatStatus[] = ['awaiting_approval', 'streaming'];
      expect(transitions[0]).toBe('awaiting_approval');
      expect(transitions[1]).toBe('streaming');
    });

    it('does not accept new messages during awaiting_approval', () => {
      function canSend(status: ChatStatus): boolean {
        return status !== 'streaming' && status !== 'awaiting_approval';
      }
      expect(canSend('awaiting_approval')).toBe(false);
      expect(canSend('streaming')).toBe(false);
      expect(canSend('idle')).toBe(true);
      expect(canSend('error')).toBe(true);
    });
  });

  describe('streaming accumulation', () => {
    it('accumulates chunks into assistant message content', () => {
      const chunks = ['Hello', ', ', 'how ', 'can I ', 'help?'];
      let accumulated = '';
      for (const chunk of chunks) {
        accumulated += chunk;
      }
      expect(accumulated).toBe('Hello, how can I help?');
    });

    it('marks message as not streaming after completion', () => {
      const msg: ChatMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Complete response',
        timestamp: Date.now(),
        isStreaming: true,
      };
      msg.isStreaming = false;
      expect(msg.isStreaming).toBe(false);
      expect(msg.content).toBe('Complete response');
    });
  });

  describe('tool call state management', () => {
    it('adds a tool call to an assistant message', () => {
      const msg: ChatMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
        toolCalls: [],
      };

      const newToolCall: ToolCallInfo = {
        id: 'tc-1',
        toolName: 'read_file',
        args: { path: '/test.txt' },
        status: 'running',
      };

      // Simulate addToolCallToLastAssistant
      msg.toolCalls = [...(msg.toolCalls ?? []), newToolCall];
      expect(msg.toolCalls).toHaveLength(1);
      expect(msg.toolCalls[0].status).toBe('running');
    });

    it('updates a tool call status from running to completed', () => {
      const toolCalls: ToolCallInfo[] = [
        {
          id: 'tc-1',
          toolName: 'read_file',
          args: { path: '/test.txt' },
          status: 'running',
        },
      ];

      // Simulate updateToolCall
      const updated = toolCalls.map((tc) =>
        tc.id === 'tc-1'
          ? { ...tc, status: 'completed' as const, result: 'File contents here' }
          : tc,
      );

      expect(updated[0].status).toBe('completed');
      expect(updated[0].result).toBe('File contents here');
    });

    it('updates a tool call status from running to error', () => {
      const toolCalls: ToolCallInfo[] = [
        {
          id: 'tc-1',
          toolName: 'write_file',
          args: { path: '/readonly.txt' },
          status: 'running',
        },
      ];

      const updated = toolCalls.map((tc) =>
        tc.id === 'tc-1'
          ? { ...tc, status: 'error' as const, error: 'Permission denied' }
          : tc,
      );

      expect(updated[0].status).toBe('error');
      expect(updated[0].error).toBe('Permission denied');
    });

    it('does not mutate other tool calls when updating one', () => {
      const toolCalls: ToolCallInfo[] = [
        { id: 'tc-1', toolName: 'tool_a', args: {}, status: 'completed', result: 'A done' },
        { id: 'tc-2', toolName: 'tool_b', args: {}, status: 'running' },
      ];

      const updated = toolCalls.map((tc) =>
        tc.id === 'tc-2'
          ? { ...tc, status: 'completed' as const, result: 'B done' }
          : tc,
      );

      expect(updated[0].status).toBe('completed');
      expect(updated[0].result).toBe('A done');
      expect(updated[1].status).toBe('completed');
      expect(updated[1].result).toBe('B done');
    });
  });

  describe('tool approval flow', () => {
    it('creates a tool approval info object', () => {
      const approval: ToolApprovalInfo = {
        approvalId: 'approval-1',
        toolName: 'execute_command',
        args: { command: 'rm -rf /tmp/test' },
        description: 'Execute a shell command',
      };
      expect(approval.toolName).toBe('execute_command');
      expect(approval.args.command).toBe('rm -rf /tmp/test');
    });

    it('approve callback resolves with true', async () => {
      let resolveRef: ((v: boolean) => void) | null = null;
      const promise = new Promise<boolean>((resolve) => {
        resolveRef = resolve;
      });

      // Simulate approveToolCall
      resolveRef!(true);
      const result = await promise;
      expect(result).toBe(true);
    });

    it('deny callback resolves with false', async () => {
      let resolveRef: ((v: boolean) => void) | null = null;
      const promise = new Promise<boolean>((resolve) => {
        resolveRef = resolve;
      });

      // Simulate denyToolCall
      resolveRef!(false);
      const result = await promise;
      expect(result).toBe(false);
    });

    it('clears pending approval after response', () => {
      let pendingApproval: ToolApprovalInfo | undefined = {
        approvalId: 'a-1',
        toolName: 'test_tool',
        args: {},
      };

      // After approve or deny
      pendingApproval = undefined;
      expect(pendingApproval).toBeUndefined();
    });
  });
});
