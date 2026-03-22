import { describe, expect, it } from 'vitest';
import { buildChatMessagesFromHistory } from './conversationHistory';

describe('buildChatMessagesFromHistory', () => {
  it('merges queued failed tool results into the preceding assistant tool call', () => {
    const messages = buildChatMessagesFromHistory([
      { role: 'user', content: 'First queued request', timestamp: 100 },
      { role: 'assistant', content: 'First request complete.', timestamp: 200 },
      { role: 'user', content: 'Second queued request', timestamp: 300 },
      {
        role: 'assistant',
        content: '',
        timestamp: 400,
        toolCalls: [{ name: 'read_file', arguments: { path: 'package.json.missing' } }],
      },
      {
        role: 'tool',
        content: 'ENOENT: package.json.missing',
        timestamp: 500,
        toolResults: [{ success: false, content: '', error: 'ENOENT: package.json.missing' }],
      },
    ], { latestTurnOnly: true });

    expect(messages).toEqual([
      {
        id: undefined,
        role: 'assistant',
        content: '',
        timestamp: 400,
        toolCalls: [{ name: 'read_file', arguments: { path: 'package.json.missing' } }],
        toolResults: [{ success: false, content: '', error: 'ENOENT: package.json.missing' }],
      },
    ]);
  });

  it('includes user messages when requested for full conversation recovery', () => {
    const messages = buildChatMessagesFromHistory([
      { id: 'user-1', role: 'user', content: 'hello', timestamp: 100 },
      {
        id: 'assistant-1',
        role: 'assistant',
        content: '',
        timestamp: 200,
        toolCalls: [{ name: 'read_file', arguments: { path: 'README.md' } }],
      },
      {
        id: 'tool-1',
        role: 'tool',
        content: '',
        timestamp: 300,
        toolResults: [{ success: true, content: '# README' }],
      },
    ], { includeUsers: true });

    expect(messages).toEqual([
      { id: 'user-1', role: 'user', content: 'hello', timestamp: 100, toolCalls: undefined, toolResults: undefined },
      {
        id: 'assistant-1',
        role: 'assistant',
        content: '',
        timestamp: 200,
        toolCalls: [{ name: 'read_file', arguments: { path: 'README.md' } }],
        toolResults: [{ success: true, content: '# README' }],
      },
    ]);
  });
});

