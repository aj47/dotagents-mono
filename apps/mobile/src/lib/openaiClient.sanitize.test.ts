import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  },
  Platform: {
    OS: 'ios',
    select: <T,>(value: { ios?: T; android?: T; default?: T }) => value.ios ?? value.default,
  },
}));

const eventSourceMockState = vi.hoisted(() => ({
  constructorCalls: [] as Array<{ url: string; options: any }>,
}));

vi.mock('react-native-sse', () => ({
  default: class EventSourceMock {
    private listeners = new Map<string, Array<(event: any) => void>>();

    constructor(url: string, options: any) {
      eventSourceMockState.constructorCalls.push({ url, options });
      setTimeout(() => {
        this.emit('open', { type: 'open' });
        this.emit('done', { type: 'done' });
      }, 0);
    }

    addEventListener(type: string, listener: (event: any) => void) {
      this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
    }

    close() {}

    private emit(type: string, event: any) {
      for (const listener of this.listeners.get(type) ?? []) {
        listener(event);
      }
    }
  },
}));

import { sanitizeMessagesForRequest } from '@dotagents/shared/chat-utils';
import { OpenAIClient, type ChatMessage } from './openaiClient';

afterEach(() => {
  vi.unstubAllGlobals();
  eventSourceMockState.constructorCalls = [];
});

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

  it('removes display-only thinking content from request messages', () => {
    const messages: ChatMessage[] = [{
      role: 'assistant',
      content: 'Final answer',
      displayContent: '<think>reasoning</think>\n\nFinal answer',
    }];

    const sanitized = sanitizeMessagesForRequest(messages);

    expect(sanitized[0].content).toBe('Final answer');
    expect(sanitized[0].displayContent).toBeUndefined();
  });
});

describe('OpenAIClient remote API routes', () => {
  it('uses the shared chat completions route for streaming chat requests', async () => {
    vi.stubGlobal('__DEV__', false);

    const client = new OpenAIClient({ baseUrl: 'https://example.com', apiKey: 'secret-token', model: 'test-model' });

    await expect(client.chat([{ role: 'user', content: 'Hello' }], undefined, undefined, 'conv/with slash')).resolves.toEqual({
      content: '',
      conversationId: undefined,
      conversationHistory: undefined,
    });

    expect(eventSourceMockState.constructorCalls).toHaveLength(1);
    expect(eventSourceMockState.constructorCalls[0]?.url).toBe('https://example.com/v1/chat/completions');
    expect(eventSourceMockState.constructorCalls[0]?.options.method).toBe('POST');
    expect(eventSourceMockState.constructorCalls[0]?.options.body).toBe(JSON.stringify({
      model: 'test-model',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true,
      conversation_id: 'conv/with slash',
    }));
  });

  it('uses the shared models route for health checks', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenAIClient({ baseUrl: 'https://example.com', apiKey: 'secret-token' });

    await expect(client.health()).resolves.toBe(true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://example.com/v1/models');
  });

  it('uses shared recovery and emergency-stop routes', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'conv/with slash',
        title: 'Recovered',
        createdAt: 1,
        updatedAt: 2,
        messages: [],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: true,
        message: 'Emergency stop executed',
        processesKilled: 1,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenAIClient({ baseUrl: 'https://example.com/v1', apiKey: 'secret-token' });

    await client.getConversation('conv/with slash');
    await client.killSwitch();

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method])).toEqual([
      ['https://example.com/v1/conversations/conv%2Fwith%20slash', 'GET'],
      ['https://example.com/v1/emergency-stop', 'POST'],
    ]);
  });
});
