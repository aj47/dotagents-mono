import { describe, expect, it } from 'vitest';
import { describeTtsQueue } from './globalTtsQueue';
import type { TtsQueueItem, TtsQueueState } from './ttsQueue';

function item(partial: Partial<TtsQueueItem>): TtsQueueItem {
  return {
    id: partial.id ?? 'i',
    source: 'auto',
    sessionId: partial.sessionId ?? null,
    sessionTitle: partial.sessionTitle ?? null,
    agentName: partial.agentName ?? null,
    priority: partial.priority ?? 0,
    text: partial.text ?? '',
    textPreview: partial.textPreview ?? '',
    enqueuedAt: 0,
    announceOnly: partial.announceOnly,
  };
}

function state(partial: Partial<TtsQueueState>): TtsQueueState {
  return {
    active: null,
    activeStatus: null,
    queue: [],
    deferred: [],
    paused: false,
    mutedAgents: [],
    soloAgent: null,
    conflictPolicy: 'queue',
    lastSpoken: null,
    ...partial,
  };
}

describe('describeTtsQueue', () => {
  it('reports nothing playing', () => {
    expect(describeTtsQueue(state({}))).toBe('Nothing is playing.');
  });

  it('reports the active agent', () => {
    expect(describeTtsQueue(state({ active: item({ agentName: 'Calendar' }) }))).toBe(
      'Calendar is talking now.',
    );
  });

  it('reports active plus waiting agents by name', () => {
    const s = state({
      active: item({ agentName: 'Calendar' }),
      queue: [item({ agentName: 'Travel' }), item({ agentName: 'Email' })],
    });
    expect(describeTtsQueue(s)).toBe('Calendar is talking now. 2 waiting: Travel, Email.');
  });

  it('reports paused state with count', () => {
    const s = state({ paused: true, queue: [item({ agentName: 'A' })] });
    expect(describeTtsQueue(s)).toBe('Playback paused. 1 message waiting.');
  });

  it('mentions withheld items when idle', () => {
    const s = state({ deferred: [item({ agentName: 'A', text: 'x' })] });
    expect(describeTtsQueue(s)).toContain('withheld');
  });

  it('ignores announce-only items in withheld count', () => {
    const s = state({ deferred: [item({ agentName: 'A', announceOnly: true })] });
    expect(describeTtsQueue(s)).toBe('Nothing is playing.');
  });
});
