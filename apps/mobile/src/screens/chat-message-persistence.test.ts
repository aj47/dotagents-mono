import { describe, expect, it } from 'vitest';

import type { ChatMessage } from '../lib/openaiClient';
import {
  createChatMessagePersistenceSignature,
  shouldPersistChatMessages,
} from './chat-message-persistence';

describe('shouldPersistChatMessages', () => {
  it('persists when a new placeholder message is appended', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: '' },
    ];

    expect(
      shouldPersistChatMessages({
        messages,
        previousMessageCount: 0,
        lastPersistedSignature: null,
        responding: true,
      }),
    ).toBe(true);
  });

  it('does not persist same-length streaming updates while the assistant is still responding', () => {
    const previousMessages: ChatMessage[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: '' },
    ];
    const streamingMessages: ChatMessage[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'Hel' },
    ];

    expect(
      shouldPersistChatMessages({
        messages: streamingMessages,
        previousMessageCount: previousMessages.length,
        lastPersistedSignature: createChatMessagePersistenceSignature(previousMessages),
        responding: true,
      }),
    ).toBe(false);
  });

  it('persists settled same-length updates when the placeholder becomes an error', () => {
    const placeholderMessages: ChatMessage[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: '' },
    ];
    const failedMessages: ChatMessage[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'Error: Chat failed: 401' },
    ];

    expect(
      shouldPersistChatMessages({
        messages: failedMessages,
        previousMessageCount: placeholderMessages.length,
        lastPersistedSignature: createChatMessagePersistenceSignature(placeholderMessages),
        responding: false,
      }),
    ).toBe(true);
  });
});