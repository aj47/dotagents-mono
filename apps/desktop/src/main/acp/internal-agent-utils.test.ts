import { describe, expect, it } from 'vitest';
import {
  countPersistedSeedMessages,
  resolveQueuedSubSessionTarget,
} from './internal-agent-utils';
import type { ACPSubAgentMessage } from '../../shared/types';

describe('countPersistedSeedMessages', () => {
  it('matches persisted tool batches that include tool-name prefixes', () => {
    const seedHistory: ACPSubAgentMessage[] = [
      { role: 'user', content: 'Run checks', timestamp: 1 },
      {
        role: 'tool',
        toolName: 'execute_command',
        content: 'build passed',
        timestamp: 2,
      },
      {
        role: 'tool',
        toolName: 'read_file',
        content: 'config value',
        timestamp: 3,
      },
      { role: 'assistant', content: 'Done', timestamp: 4 },
    ];

    const persistedMessages = [
      { role: 'user', content: 'Run checks' },
      { role: 'tool', content: '[execute_command] build passed\n\n[read_file] config value' },
      { role: 'assistant', content: 'Done' },
    ];

    expect(countPersistedSeedMessages(seedHistory, persistedMessages)).toBe(4);
  });

  it('normalizes whitespace before deciding a seed message is missing', () => {
    const seedHistory: ACPSubAgentMessage[] = [
      { role: 'user', content: 'Line one\n\nLine two', timestamp: 1 },
      { role: 'assistant', content: 'Ready', timestamp: 2 },
    ];

    const persistedMessages = [
      { role: 'user', content: 'Line one Line two' },
      { role: 'assistant', content: 'Ready' },
    ];

    expect(countPersistedSeedMessages(seedHistory, persistedMessages)).toBe(2);
  });
});

describe('resolveQueuedSubSessionTarget', () => {
  const subSessions = new Map([
    ['subsession_done', { id: 'subsession_done', conversationId: 'conv-1', status: 'completed' as const }],
    ['subsession_running', { id: 'subsession_running', conversationId: 'conv-1', status: 'running' as const }],
    ['subsession_other_conv', { id: 'subsession_other_conv', conversationId: 'conv-2', status: 'completed' as const }],
  ]);

  it('uses the current sub-session when the queued message has no sub-session target', () => {
    expect(resolveQueuedSubSessionTarget(
      'subsession_current',
      'conv-1',
      undefined,
      id => subSessions.get(id),
    )).toEqual({ status: 'ready', subSessionId: 'subsession_current' });
  });

  it('routes FIFO work to a retained completed target sub-session', () => {
    expect(resolveQueuedSubSessionTarget(
      'subsession_current',
      'conv-1',
      'subsession_done',
      id => subSessions.get(id),
    )).toEqual({ status: 'ready', subSessionId: 'subsession_done' });
  });

  it('waits for active target sub-sessions to finish their own drain', () => {
    expect(resolveQueuedSubSessionTarget(
      'subsession_current',
      'conv-1',
      'subsession_running',
      id => subSessions.get(id),
    )).toEqual({ status: 'wait', subSessionId: 'subsession_running' });
  });

  it('fails stale or mismatched queue heads explicitly', () => {
    expect(resolveQueuedSubSessionTarget(
      'subsession_current',
      'conv-1',
      'subsession_missing',
      id => subSessions.get(id),
    )).toEqual({
      status: 'failed',
      error: 'Queued sub-session target no longer exists: subsession_missing',
    });

    expect(resolveQueuedSubSessionTarget(
      'subsession_current',
      'conv-1',
      'subsession_other_conv',
      id => subSessions.get(id),
    )).toEqual({
      status: 'failed',
      error: 'Queued message target subsession_other_conv belongs to conversation conv-2, not conv-1',
    });
  });
});
