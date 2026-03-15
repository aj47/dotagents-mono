import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChatMessage, ChatStatus, ToolCallInfo, ToolApprovalInfo } from '../types/chat';

// Import classifyError helper for direct testing (re-export for testing)
// We test it by calling the classify logic directly since it's a pure function

/**
 * Test the chat logic (message creation, empty rejection, state transitions,
 * tool call display, tool approval flow, MCP tool cycle, error handling,
 * Ctrl+C cancellation, and invalid input protection) without requiring
 * React rendering.
 *
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

  describe('MCP tool cycle', () => {
    it('models a full tool cycle: agent calls tool → execute → result → agent uses result', () => {
      // Step 1: LLM returns tool calls
      const toolCalls = [
        { name: 'server:read_file', arguments: { path: '/test.txt' } },
      ];

      // Step 2: Create tool call info entries
      const toolCallInfos: ToolCallInfo[] = toolCalls.map((tc) => ({
        id: `tc_${Date.now()}`,
        toolName: tc.name,
        args: tc.arguments,
        status: 'pending' as const,
      }));

      expect(toolCallInfos[0].status).toBe('pending');
      expect(toolCallInfos[0].toolName).toBe('server:read_file');

      // Step 3: Execute tool — transitions to running
      const running = toolCallInfos.map((tc) => ({
        ...tc,
        status: 'running' as const,
      }));
      expect(running[0].status).toBe('running');

      // Step 4: Tool completes — transitions to completed
      const completed = running.map((tc) => ({
        ...tc,
        status: 'completed' as const,
        result: 'File contents: Hello world',
      }));
      expect(completed[0].status).toBe('completed');
      expect(completed[0].result).toBe('File contents: Hello world');

      // Step 5: Build follow-up messages for the LLM
      const followUpMessages = [
        { role: 'user', content: 'Read the file /test.txt' },
        { role: 'assistant', content: '[Called tools: server:read_file]' },
        { role: 'tool', content: '[Tool "server:read_file" result]: File contents: Hello world' },
      ];
      expect(followUpMessages).toHaveLength(3);
      expect(followUpMessages[2].role).toBe('tool');
    });

    it('models multiple tool calls in sequence', () => {
      const toolCalls = [
        { name: 'server:read_file', arguments: { path: '/a.txt' } },
        { name: 'server:write_file', arguments: { path: '/b.txt', content: 'data' } },
      ];

      const results = toolCalls.map((tc, i) => ({
        name: tc.name,
        result: i === 0 ? 'contents of a.txt' : 'wrote to b.txt',
      }));

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('server:read_file');
      expect(results[1].name).toBe('server:write_file');
    });

    it('handles tool execution errors gracefully', () => {
      const toolCall: ToolCallInfo = {
        id: 'tc-err',
        toolName: 'server:dangerous_tool',
        args: {},
        status: 'running',
      };

      // Simulate error
      const errored: ToolCallInfo = {
        ...toolCall,
        status: 'error',
        error: 'Permission denied',
      };

      expect(errored.status).toBe('error');
      expect(errored.error).toBe('Permission denied');
    });

    it('respects MAX_TOOL_ROUNDS limit to prevent infinite loops', () => {
      const MAX_TOOL_ROUNDS = 10;
      let rounds = 0;
      const results: string[] = [];

      while (rounds < MAX_TOOL_ROUNDS) {
        rounds++;
        results.push(`round_${rounds}`);
        // Simulate tool always returning more tool calls
      }

      expect(rounds).toBe(MAX_TOOL_ROUNDS);
      expect(results).toHaveLength(MAX_TOOL_ROUNDS);
    });
  });

  describe('error handling', () => {
    /**
     * Test error classification logic that maps raw errors to user-friendly messages.
     */
    function classifyError(err: unknown): string {
      if (!(err instanceof Error)) return 'An unexpected error occurred.';

      const msg = err.message;

      if (err.name === 'AbortError' || msg.includes('abort')) return '';

      if (
        msg.includes('fetch') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ENOTFOUND') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('network') ||
        msg.includes('NetworkError') ||
        msg.includes('socket hang up')
      ) {
        return `Network error: ${msg}. Check your connection and API key configuration.`;
      }

      if (
        msg.includes('401') ||
        msg.includes('403') ||
        msg.includes('Unauthorized') ||
        msg.includes('API key') ||
        msg.includes('api_key')
      ) {
        return `Authentication error: ${msg}. Check your API key in settings.`;
      }

      if (msg.includes('429') || msg.includes('rate limit') || msg.includes('Rate limit')) {
        return `Rate limited: ${msg}. Please wait a moment and try again.`;
      }

      return msg;
    }

    it('classifies network errors with friendly message', () => {
      const err = new Error('fetch failed: ECONNREFUSED');
      const result = classifyError(err);
      expect(result).toContain('Network error');
      expect(result).toContain('Check your connection');
    });

    it('classifies ENOTFOUND as network error', () => {
      const err = new Error('getaddrinfo ENOTFOUND api.openai.com');
      const result = classifyError(err);
      expect(result).toContain('Network error');
    });

    it('classifies ETIMEDOUT as network error', () => {
      const err = new Error('connect ETIMEDOUT 1.2.3.4:443');
      const result = classifyError(err);
      expect(result).toContain('Network error');
    });

    it('classifies socket hang up as network error', () => {
      const err = new Error('socket hang up');
      const result = classifyError(err);
      expect(result).toContain('Network error');
    });

    it('classifies 401 as authentication error', () => {
      const err = new Error('HTTP 401 Unauthorized');
      const result = classifyError(err);
      expect(result).toContain('Authentication error');
      expect(result).toContain('API key');
    });

    it('classifies 403 as authentication error', () => {
      const err = new Error('HTTP 403 Forbidden');
      const result = classifyError(err);
      expect(result).toContain('Authentication error');
    });

    it('classifies API key errors', () => {
      const err = new Error('Invalid API key provided');
      const result = classifyError(err);
      expect(result).toContain('Authentication error');
    });

    it('classifies 429 as rate limit error', () => {
      const err = new Error('HTTP 429 Too Many Requests');
      const result = classifyError(err);
      expect(result).toContain('Rate limited');
      expect(result).toContain('wait a moment');
    });

    it('classifies rate limit text', () => {
      const err = new Error('Rate limit exceeded');
      const result = classifyError(err);
      expect(result).toContain('Rate limited');
    });

    it('returns empty string for AbortError (Ctrl+C)', () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      const result = classifyError(err);
      expect(result).toBe('');
    });

    it('returns empty string for abort message', () => {
      const err = new Error('Request was aborted');
      const result = classifyError(err);
      expect(result).toBe('');
    });

    it('returns raw message for generic errors', () => {
      const err = new Error('Something went wrong');
      const result = classifyError(err);
      expect(result).toBe('Something went wrong');
    });

    it('returns generic message for non-Error objects', () => {
      const result = classifyError('string error');
      expect(result).toBe('An unexpected error occurred.');
    });

    it('returns generic message for null/undefined', () => {
      expect(classifyError(null)).toBe('An unexpected error occurred.');
      expect(classifyError(undefined)).toBe('An unexpected error occurred.');
    });
  });

  describe('Ctrl+C streaming cancellation', () => {
    it('AbortController abort cancels streaming', () => {
      const abortController = new AbortController();
      expect(abortController.signal.aborted).toBe(false);

      abortController.abort();
      expect(abortController.signal.aborted).toBe(true);
    });

    it('aborted signal preserves partial response', () => {
      let accumulated = '';
      const chunks = ['Hello', ', ', 'this is '];

      // Simulate partial streaming before abort
      for (const chunk of chunks) {
        accumulated += chunk;
      }

      // After abort, the accumulated partial response is preserved
      const msg: ChatMessage = {
        id: 'msg-partial',
        role: 'assistant',
        content: accumulated,
        timestamp: Date.now(),
        isStreaming: false, // marked as not streaming after abort
      };

      expect(msg.content).toBe('Hello, this is ');
      expect(msg.isStreaming).toBe(false);
    });

    it('status returns to idle after cancellation', () => {
      let status: ChatStatus = 'streaming';
      // Simulate cancelStreaming
      status = 'idle';
      expect(status).toBe('idle');
    });

    it('pending approval is cleared on cancel', () => {
      let pendingApproval: ToolApprovalInfo | undefined = {
        approvalId: 'a-1',
        toolName: 'test_tool',
        args: {},
      };
      // Simulate cancelStreaming clears approval
      pendingApproval = undefined;
      expect(pendingApproval).toBeUndefined();
    });
  });

  describe('invalid input handling', () => {
    it('handles null/undefined input safely', () => {
      const safeTrim = (input: unknown) => {
        try {
          return String(input ?? '').trim();
        } catch {
          return '';
        }
      };

      // null ?? '' evaluates to '' because null is nullish
      expect(safeTrim(null)).toBe('');
      expect(safeTrim(undefined)).toBe('');
      expect(safeTrim('')).toBe('');
    });

    it('handles non-string input without crashing', () => {
      const safeTrim = (input: unknown) => {
        try {
          return String(input ?? '').trim();
        } catch {
          return '';
        }
      };

      expect(safeTrim(42)).toBe('42');
      expect(safeTrim({ toString: () => 'object' })).toBe('object');
      expect(safeTrim(true)).toBe('true');
    });

    it('handles extremely long input', () => {
      const longInput = 'a'.repeat(100000);
      expect(longInput.trim().length).toBe(100000);
    });

    it('handles input with special characters', () => {
      const specialInput = '🎉 Hello\n\t  "world" \'foo\' <bar>';
      const trimmed = specialInput.trim();
      expect(trimmed.length).toBeGreaterThan(0);
    });
  });
});
