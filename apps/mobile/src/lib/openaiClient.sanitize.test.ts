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
  it('keeps toolCalls and toolResults index-aligned when filtering pending placeholders', () => {
    const messages: ChatMessage[] = [{
      role: 'assistant',
      content: '',
      toolCalls: [
        { name: 'first_tool', arguments: { a: 1 } },
        { name: 'second_tool', arguments: { b: 2 } },
      ],
      toolResults: [undefined, { success: true, content: 'ok' }],
    }];

    const sanitized = sanitizeMessagesForRequest(messages);

    expect(sanitized[0].toolCalls).toEqual([
      { name: 'second_tool', arguments: { b: 2 } },
    ]);
    expect(sanitized[0].toolResults).toEqual([
      { success: true, content: 'ok' },
    ]);
  });

  it('drops misaligned toolCalls when toolResults are filtered but arrays cannot be safely aligned', () => {
    const messages: ChatMessage[] = [{
      role: 'assistant',
      content: '',
      toolCalls: [
        { name: 'stale_tool_call', arguments: { stale: true } },
      ],
      toolResults: [undefined, { success: true, content: 'orphan-result' }],
    }];

    const sanitized = sanitizeMessagesForRequest(messages);

    expect(sanitized[0].toolCalls).toBeUndefined();
    expect(sanitized[0].toolResults).toEqual([
      { success: true, content: 'orphan-result' },
    ]);
  });

  it('removes both toolCalls and toolResults when all results are pending placeholders', () => {
    const messages: ChatMessage[] = [{
      role: 'assistant',
      content: '',
      toolCalls: [
        { name: 'pending_tool', arguments: {} },
      ],
      toolResults: [undefined],
    }];

    const sanitized = sanitizeMessagesForRequest(messages);

    expect(sanitized[0].toolCalls).toBeUndefined();
    expect(sanitized[0].toolResults).toBeUndefined();
  });
});
