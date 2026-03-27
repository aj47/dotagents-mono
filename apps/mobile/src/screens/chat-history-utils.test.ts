import { describe, expect, it } from 'vitest';
import { buildChatMessagesFromHistory, isSyntheticToolFailureSummary } from './chat-history-utils';

describe('chat-history-utils', () => {
  it('drops synthetic tool failure summaries when structured tool results already exist', () => {
    const messages = buildChatMessagesFromHistory([
      { role: 'user', content: 'Search for the latest status', timestamp: 1 },
      {
        role: 'assistant',
        content: '',
        timestamp: 2,
        toolCalls: [{ name: 'search_query', arguments: { q: 'latest status' } }],
      },
      {
        role: 'tool',
        content: '[search_query] ERROR: Request timed out while fetching search results.',
        timestamp: 3,
        toolResults: [
          {
            success: false,
            content: 'Request timed out while fetching search results.',
            error: 'Request timed out while fetching search results.',
          },
        ],
      },
      {
        role: 'tool',
        content: 'TOOL FAILED: search_query (attempt 1/3)\nError: Request timed out while fetching search results.',
        timestamp: 4,
      },
    ]);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      role: 'assistant',
      toolCalls: [{ name: 'search_query' }],
      toolResults: [
        expect.objectContaining({
          success: false,
          error: 'Request timed out while fetching search results.',
        }),
      ],
    });
  });

  it('keeps synthetic tool failure summaries when they are the only failure signal', () => {
    const messages = buildChatMessagesFromHistory([
      { role: 'user', content: 'Open the missing file', timestamp: 1 },
      {
        role: 'assistant',
        content: '',
        timestamp: 2,
        toolCalls: [{ name: 'read_file', arguments: { path: 'package.json.missing' } }],
      },
      {
        role: 'tool',
        content: 'TOOL FAILED: read_file (attempt 1/3)\nError: ENOENT: package.json.missing',
        timestamp: 3,
      },
    ]);

    expect(messages).toEqual([
      expect.objectContaining({
        role: 'assistant',
        toolCalls: [{ name: 'read_file', arguments: { path: 'package.json.missing' } }],
      }),
      expect.objectContaining({
        role: 'assistant',
        content: 'TOOL FAILED: read_file (attempt 1/3)\nError: ENOENT: package.json.missing',
      }),
    ]);
  });

  it('keeps user messages when requested', () => {
    const messages = buildChatMessagesFromHistory(
      [
        { role: 'user', content: 'Hello', timestamp: 1 },
        { role: 'assistant', content: 'Hi', timestamp: 2 },
      ],
      { includeUserMessages: true, startFromLastUser: false },
    );

    expect(messages).toEqual([
      expect.objectContaining({ role: 'user', content: 'Hello' }),
      expect.objectContaining({ role: 'assistant', content: 'Hi' }),
    ]);
  });

  it('detects the synthetic failure marker', () => {
    expect(isSyntheticToolFailureSummary('TOOL FAILED: search_query')).toBe(true);
    expect(isSyntheticToolFailureSummary('Tool failed softly')).toBe(false);
  });
});
