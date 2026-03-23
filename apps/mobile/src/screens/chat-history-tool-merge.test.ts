import { describe, expect, it } from 'vitest';

import type { ChatMessage } from '../types/session';

import { mergeToolHistoryMessageIntoPreviousAssistant } from './chat-history-tool-merge';

describe('chat-history-tool-merge', () => {
  it('merges structured tool results into the previous assistant tool call message', () => {
    const messages: ChatMessage[] = [
      {
        id: 'assistant-1',
        role: 'assistant',
        content: '',
        timestamp: 1,
        toolCalls: [{ name: 'read_file', arguments: { path: 'README.md' } }],
      },
    ];

    expect(mergeToolHistoryMessageIntoPreviousAssistant(messages, {
      content: '',
      toolResults: [{ success: true, content: 'hello world' }],
    })).toBe(true);

    expect(messages[0].toolResults).toEqual([{ success: true, content: 'hello world' }]);
  });

  it('aligns structured tool results to the first unresolved visible tool call', () => {
    const messages: ChatMessage[] = [
      {
        id: 'assistant-structured-hidden',
        role: 'assistant',
        content: '',
        timestamp: 1,
        toolCalls: [
          { name: 'respond_to_user', arguments: { text: 'Working on it' } },
          { name: 'read_file', arguments: { path: 'package.json' } },
        ],
      },
    ];

    expect(mergeToolHistoryMessageIntoPreviousAssistant(
      messages,
      {
        content: '',
        toolResults: [{ success: true, content: '{"name":"dotagents-mono"}' }],
      },
      new Set(['respond_to_user', 'mark_work_complete']),
    )).toBe(true);

    expect(messages[0].toolResults).toHaveLength(2);
    expect(messages[0].toolResults?.[0]).toBeUndefined();
    expect(messages[0].toolResults?.[1]).toEqual({
      success: true,
      content: '{"name":"dotagents-mono"}',
    });
  });

  it('synthesizes a failed tool result from a legacy content-only tool message', () => {
    const messages: ChatMessage[] = [
      {
        id: 'assistant-2',
        role: 'assistant',
        content: '',
        timestamp: 2,
        toolCalls: [{ name: 'execute_command', arguments: { command: 'false' } }],
      },
    ];

    expect(mergeToolHistoryMessageIntoPreviousAssistant(messages, {
      content: '[execute_command] ERROR: permission denied',
    })).toBe(true);

    expect(messages[0].toolResults).toEqual([
      {
        success: false,
        content: 'permission denied',
        error: 'permission denied',
      },
    ]);
  });

  it('keeps synthesized results aligned with the first unresolved visible tool call', () => {
    const messages: ChatMessage[] = [
      {
        id: 'assistant-3',
        role: 'assistant',
        content: '',
        timestamp: 3,
        toolCalls: [
          { name: 'respond_to_user', arguments: { text: 'Working on it' } },
          { name: 'execute_command', arguments: { command: 'false' } },
        ],
      },
    ];

    expect(mergeToolHistoryMessageIntoPreviousAssistant(
      messages,
      { content: 'Tool: execute_command\nResult: permission denied' },
      new Set(['respond_to_user', 'mark_work_complete']),
    )).toBe(true);

    expect(messages[0].toolResults).toHaveLength(2);
    expect(messages[0].toolResults?.[0]).toBeUndefined();
    expect(messages[0].toolResults?.[1]).toEqual({
      success: false,
      content: 'permission denied',
      error: 'permission denied',
    });
  });

  it('keeps structured result batches aligned after an earlier visible result is already filled', () => {
    const existingToolResults: NonNullable<ChatMessage['toolResults']> = [];
    existingToolResults[1] = { success: true, content: '{"name":"dotagents-mono"}' };

    const messages: ChatMessage[] = [
      {
        id: 'assistant-structured-batch',
        role: 'assistant',
        content: '',
        timestamp: 4,
        toolCalls: [
          { name: 'respond_to_user', arguments: { text: 'Working on it' } },
          { name: 'read_file', arguments: { path: 'package.json' } },
          { name: 'execute_command', arguments: { command: 'pwd' } },
        ],
        toolResults: existingToolResults,
      },
    ];

    expect(mergeToolHistoryMessageIntoPreviousAssistant(
      messages,
      {
        content: '',
        toolResults: [{ success: true, content: '/tmp/electron-ui-recording' }],
      },
      new Set(['respond_to_user', 'mark_work_complete']),
    )).toBe(true);

    expect(messages[0].toolResults).toHaveLength(3);
    expect(messages[0].toolResults?.[0]).toBeUndefined();
    expect(messages[0].toolResults?.[1]).toEqual({
      success: true,
      content: '{"name":"dotagents-mono"}',
    });
    expect(messages[0].toolResults?.[2]).toEqual({
      success: true,
      content: '/tmp/electron-ui-recording',
    });
  });
});
