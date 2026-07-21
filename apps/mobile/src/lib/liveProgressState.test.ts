import { describe, expect, it } from 'vitest';

import {
  mergeLiveProgressHistory,
  mergeLiveProgressSteps,
  upsertLiveStreamingMessage,
} from './liveProgressState';

describe('mergeLiveProgressSteps', () => {
  it('retains steps that fall out of a later progress window', () => {
    const first = mergeLiveProgressSteps([], [
      {
        id: 'thinking-1',
        type: 'thinking',
        title: 'Planning',
        status: 'completed',
        timestamp: 1,
        content: 'Inspect the current state',
      },
      {
        id: 'tool-1',
        type: 'tool_call',
        title: 'Run search',
        status: 'in_progress',
        timestamp: 2,
        toolCall: { name: 'rg', arguments: { pattern: 'progress' } },
      },
    ]);

    const merged = mergeLiveProgressSteps(first, [
      {
        id: 'thinking-2',
        type: 'thinking',
        title: 'Reviewing results',
        status: 'in_progress',
        timestamp: 3,
        content: 'Check the renderer merge path',
      },
    ]);

    expect(merged.map((step) => step.id)).toEqual(['thinking-1', 'tool-1', 'thinking-2']);
  });

  it('updates a running tool in place without dropping its structured call', () => {
    const first = mergeLiveProgressSteps([], [{
      id: 'tool-1',
      type: 'tool_call',
      title: 'Run search',
      status: 'in_progress',
      timestamp: 1,
      toolCall: { name: 'rg', arguments: { pattern: 'progress' } },
    }]);

    const merged = mergeLiveProgressSteps(first, [{
      id: 'tool-1',
      type: 'tool_call',
      title: 'Run search',
      status: 'completed',
      timestamp: 2,
      toolResult: { success: true, content: '2 matches' },
    }]);

    expect(merged).toHaveLength(1);
    expect(merged[0].toolCall?.name).toBe('rg');
    expect(merged[0].toolResult?.content).toBe('2 matches');
  });
});

describe('mergeLiveProgressHistory', () => {
  it('retains messages from older history windows and updates overlap in place', () => {
    const first = mergeLiveProgressHistory(null, [
      { role: 'user', content: 'Fix it', timestamp: 1 },
      {
        role: 'assistant',
        content: '',
        timestamp: 2,
        toolCalls: [{ name: 'rg', arguments: { pattern: 'progress' } }],
      },
    ], 40);

    const merged = mergeLiveProgressHistory(first, [
      {
        role: 'assistant',
        content: '',
        timestamp: 2,
        toolResults: [{ success: true, content: '2 matches' }],
      },
      { role: 'assistant', content: 'Thinking about the result', timestamp: 3 },
    ], 41);

    expect(merged?.startIndex).toBe(40);
    expect(merged?.messages).toHaveLength(3);
    expect(merged?.messages[1].toolCalls?.[0].name).toBe('rg');
    expect(merged?.messages[1].toolResults?.[0].content).toBe('2 matches');
    expect(merged?.messages[2].content).toBe('Thinking about the result');
  });
});

describe('upsertLiveStreamingMessage', () => {
  it('adds and updates a stable streaming block without replacing an in-progress tool call', () => {
    const toolMessage = {
      id: 'tool-message',
      role: 'assistant' as const,
      content: '',
      toolCalls: [{ name: 'rg', arguments: { pattern: 'progress' } }],
    };

    const first = upsertLiveStreamingMessage(
      [{ role: 'user', content: 'Fix it' }, toolMessage],
      'stream-request-1',
      'Thinking about the merge',
      1,
    );
    const second = upsertLiveStreamingMessage(
      first,
      'stream-request-1',
      'Thinking about the merge and stable identity',
      1,
    );

    expect(second).toHaveLength(3);
    expect(second[1]).toEqual(toolMessage);
    expect(second[2]).toMatchObject({
      id: 'stream-request-1',
      content: 'Thinking about the merge and stable identity',
    });
  });
});
