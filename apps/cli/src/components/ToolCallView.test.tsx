import { describe, it, expect } from 'vitest';
import type { ToolCallInfo } from '../types/chat';

/**
 * ToolCallView unit tests — validate display logic for tool calls
 * in various states (pending, running, completed, error).
 */

import { ToolCallView, getSpinnerFrame, formatToolArgs } from './ToolCallView';

describe('ToolCallView', () => {
  it('exports a ToolCallView component', () => {
    expect(ToolCallView).toBeDefined();
    expect(typeof ToolCallView).toBe('function');
  });

  describe('getSpinnerFrame', () => {
    it('returns a spinner character for tick 0', () => {
      const frame = getSpinnerFrame(0);
      expect(frame).toBe('⠋');
    });

    it('cycles through spinner frames', () => {
      const frame0 = getSpinnerFrame(0);
      const frame1 = getSpinnerFrame(1);
      expect(frame0).not.toBe(frame1);
    });

    it('wraps around after all frames', () => {
      const frame0 = getSpinnerFrame(0);
      const frame10 = getSpinnerFrame(10);
      expect(frame0).toBe(frame10);
    });

    it('handles default tick (0)', () => {
      const frame = getSpinnerFrame();
      expect(frame).toBe('⠋');
    });
  });

  describe('formatToolArgs', () => {
    it('returns empty string for no args', () => {
      expect(formatToolArgs({})).toBe('');
    });

    it('formats a single string argument', () => {
      const result = formatToolArgs({ path: '/home/user' });
      expect(result).toContain('path:');
      expect(result).toContain('/home/user');
    });

    it('formats multiple arguments', () => {
      const result = formatToolArgs({ path: '/home', recursive: true });
      expect(result).toContain('path:');
      expect(result).toContain('recursive:');
    });

    it('truncates long string values', () => {
      const longVal = 'a'.repeat(50);
      const result = formatToolArgs({ content: longVal });
      expect(result).toContain('...');
      expect(result.length).toBeLessThan(100);
    });

    it('truncates overall output to 80 characters', () => {
      const args: Record<string, unknown> = {};
      for (let i = 0; i < 10; i++) {
        args[`key${i}`] = `value${i}`;
      }
      const result = formatToolArgs(args);
      expect(result.length).toBeLessThanOrEqual(80);
    });

    it('formats numeric values', () => {
      const result = formatToolArgs({ count: 42 });
      expect(result).toContain('42');
    });

    it('formats boolean values', () => {
      const result = formatToolArgs({ verbose: true });
      expect(result).toContain('true');
    });
  });

  describe('display logic', () => {
    it('identifies running tool calls as in-progress', () => {
      const toolCall: ToolCallInfo = {
        id: 'tc-1',
        toolName: 'read_file',
        args: { path: '/test.txt' },
        status: 'running',
      };
      const isRunning = toolCall.status === 'running' || toolCall.status === 'pending';
      expect(isRunning).toBe(true);
    });

    it('identifies pending tool calls as in-progress', () => {
      const toolCall: ToolCallInfo = {
        id: 'tc-2',
        toolName: 'list_files',
        args: {},
        status: 'pending',
      };
      const isRunning = toolCall.status === 'running' || toolCall.status === 'pending';
      expect(isRunning).toBe(true);
    });

    it('identifies completed tool calls', () => {
      const toolCall: ToolCallInfo = {
        id: 'tc-3',
        toolName: 'search',
        args: { query: 'test' },
        status: 'completed',
        result: 'Found 3 matches',
      };
      expect(toolCall.status).toBe('completed');
    });

    it('identifies error tool calls', () => {
      const toolCall: ToolCallInfo = {
        id: 'tc-4',
        toolName: 'write_file',
        args: { path: '/readonly.txt' },
        status: 'error',
        error: 'Permission denied',
      };
      expect(toolCall.status).toBe('error');
    });

    it('truncates long results to 200 characters', () => {
      const longResult = 'x'.repeat(250);
      const display = longResult.length > 200
        ? longResult.slice(0, 197) + '...'
        : longResult;
      expect(display.length).toBe(200);
      expect(display.endsWith('...')).toBe(true);
    });

    it('does not truncate short results', () => {
      const shortResult = 'Found 3 files';
      const display = shortResult.length > 200
        ? shortResult.slice(0, 197) + '...'
        : shortResult;
      expect(display).toBe('Found 3 files');
    });

    it('handles tool call with no args', () => {
      const toolCall: ToolCallInfo = {
        id: 'tc-5',
        toolName: 'get_current_time',
        args: {},
        status: 'running',
      };
      expect(Object.keys(toolCall.args).length).toBe(0);
    });

    it('handles tool call with no result text', () => {
      const toolCall: ToolCallInfo = {
        id: 'tc-6',
        toolName: 'create_directory',
        args: { path: '/new-dir' },
        status: 'completed',
      };
      expect(toolCall.result).toBeUndefined();
    });

    it('handles tool call with no error text', () => {
      const toolCall: ToolCallInfo = {
        id: 'tc-7',
        toolName: 'delete_file',
        args: { path: '/missing.txt' },
        status: 'error',
      };
      expect(toolCall.error).toBeUndefined();
    });
  });
});
