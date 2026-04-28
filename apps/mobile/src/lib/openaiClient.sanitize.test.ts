import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: <T,>(value: { ios?: T; android?: T; default?: T }) => value.ios ?? value.default,
  },
}));

vi.mock('react-native-sse', () => ({
  default: class EventSourceMock {},
}));

import { sanitizeMessagesForRequest, type ChatMessage } from './openaiClient';

describe('sanitizeMessagesForRequest', () => {
  it('removes render-only toolExecutions from request messages', () => {
    const messages: ChatMessage[] = [{
      role: 'assistant',
      content: '',
      toolCalls: [
        { name: 'first_tool', arguments: { a: 1 } },
        { name: 'second_tool', arguments: { b: 2 } },
      ],
      toolResults: [{ success: true, content: 'ok' }],
      toolExecutions: [
        { toolCall: { name: 'first_tool', arguments: { a: 1 } } },
        { toolCall: { name: 'second_tool', arguments: { b: 2 } }, result: { success: true, content: 'ok' } },
      ],
    }];

    const sanitized = sanitizeMessagesForRequest(messages);

    expect(sanitized[0].toolExecutions).toBeUndefined();
    expect(sanitized[0].toolCalls).toBeUndefined();
    expect(sanitized[0].toolResults).toBeUndefined();
  });

  it('drops misaligned toolCalls when lengths differ without placeholder filtering', () => {
    const messages: ChatMessage[] = [{
      role: 'assistant',
      content: '',
      toolCalls: [
        { name: 'first_tool', arguments: { a: 1 } },
        { name: 'second_tool', arguments: { b: 2 } },
      ],
      toolResults: [{ success: true, content: 'single-result' }],
    }];

    const sanitized = sanitizeMessagesForRequest(messages);

    expect(sanitized[0].toolCalls).toBeUndefined();
    expect(sanitized[0].toolResults).toEqual([
      { success: true, content: 'single-result' },
    ]);
  });

  it('keeps aligned toolCalls and toolResults', () => {
    const messages: ChatMessage[] = [{
      role: 'assistant',
      content: '',
      toolCalls: [
        { name: 'first_tool', arguments: { a: 1 } },
      ],
      toolResults: [
        { success: true, content: 'first-result' },
      ],
    }];

    const sanitized = sanitizeMessagesForRequest(messages);

    expect(sanitized[0].toolCalls).toEqual([
      { name: 'first_tool', arguments: { a: 1 } },
    ]);
    expect(sanitized[0].toolResults).toEqual([
      { success: true, content: 'first-result' },
    ]);
  });

  it('removes both toolCalls and toolResults when results are empty', () => {
    const messages: ChatMessage[] = [{
      role: 'assistant',
      content: '',
      toolCalls: [
        { name: 'pending_tool', arguments: {} },
      ],
      toolResults: [],
    }];

    const sanitized = sanitizeMessagesForRequest(messages);

    expect(sanitized[0].toolCalls).toBeUndefined();
    expect(sanitized[0].toolResults).toBeUndefined();
  });

  it('strips toolExecutions even when no toolResults are present', () => {
    const messages: ChatMessage[] = [{
      role: 'assistant',
      content: '',
      toolExecutions: [
        { toolCall: { name: 'pending_tool', arguments: {} } },
      ],
    }];

    const sanitized = sanitizeMessagesForRequest(messages);

    expect(sanitized[0].toolExecutions).toBeUndefined();
    expect(sanitized[0].toolResults).toBeUndefined();
  });
});
