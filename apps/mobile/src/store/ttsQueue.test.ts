import { describe, expect, it } from 'vitest';
import {
  createTtsQueueController,
  formatAgentSpokenPrefix,
  normalizeAgentKey,
  type TtsQueueItem,
  type TtsSpeaker,
  type TtsSpeakHandle,
} from './ttsQueue';

/**
 * A controllable mock speaker. By default it auto-completes each utterance
 * synchronously so queue ordering is easy to assert. When `manual` is true,
 * the test drives completion via `finish()`.
 */
function makeSpeaker(opts: { manual?: boolean } = {}) {
  const spoken: TtsQueueItem[] = [];
  let pending: { item: TtsQueueItem; handle: TtsSpeakHandle } | null = null;
  let cancels = 0;

  const speaker: TtsSpeaker = {
    speak(item, handle) {
      spoken.push(item);
      if (opts.manual) {
        pending = { item, handle };
      } else {
        handle.onSpeaking();
        handle.onDone();
      }
    },
    cancel() {
      cancels += 1;
      pending = null;
    },
  };

  return {
    speaker,
    spoken,
    cancels: () => cancels,
    finish() {
      const p = pending;
      pending = null;
      p?.handle.onDone();
    },
    speaking() {
      pending?.handle.onSpeaking();
    },
    pendingItem: () => pending?.item ?? null,
  };
}

describe('normalizeAgentKey', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeAgentKey("Calendar's Bot!")).toBe('calendars bot');
    expect(normalizeAgentKey(null)).toBe('');
  });
});

describe('formatAgentSpokenPrefix', () => {
  it('returns empty when single agent', () => {
    expect(formatAgentSpokenPrefix('Calendar', { multiAgent: false })).toBe('');
  });
  it('prefixes with agent name when multi-agent', () => {
    expect(formatAgentSpokenPrefix('Calendar', { multiAgent: true })).toBe('Calendar agent: ');
  });
  it('does not double the word agent', () => {
    expect(formatAgentSpokenPrefix('Travel agent', { multiAgent: true })).toBe('Travel agent: ');
  });
  it('returns empty for blank names', () => {
    expect(formatAgentSpokenPrefix('', { multiAgent: true })).toBe('');
  });
});

describe('createTtsQueueController — ordering', () => {
  it('plays a single utterance to completion', () => {
    const mock = makeSpeaker();
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'hello', agentName: 'A' });
    expect(mock.spoken.map((s) => s.text)).toEqual(['hello']);
    expect(c.getState().active).toBeNull();
  });

  it('serializes concurrent agents — one speaks while others wait', () => {
    const mock = makeSpeaker({ manual: true });
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'A1', agentName: 'A' });
    c.enqueue({ source: 'auto', text: 'B1', agentName: 'B' });
    // Only the first is speaking; the second is queued.
    expect(c.getState().active?.text).toBe('A1');
    expect(c.getState().queue.map((q) => q.text)).toEqual(['B1']);
    mock.finish();
    expect(c.getState().active?.text).toBe('B1');
    mock.finish();
    expect(c.getState().active).toBeNull();
  });

  it('orders by priority then FIFO', () => {
    const mock = makeSpeaker({ manual: true });
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'first', agentName: 'A' });
    c.enqueue({ source: 'auto', text: 'low', agentName: 'B', priority: 0 });
    c.enqueue({ source: 'auto', text: 'high', agentName: 'C', priority: 5 });
    expect(c.getState().active?.text).toBe('first');
    mock.finish();
    expect(c.getState().active?.text).toBe('high');
    mock.finish();
    expect(c.getState().active?.text).toBe('low');
  });
});

describe('createTtsQueueController — controls', () => {
  it('skip advances to the next item', () => {
    const mock = makeSpeaker({ manual: true });
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'A1', agentName: 'A' });
    c.enqueue({ source: 'auto', text: 'B1', agentName: 'B' });
    c.skip();
    expect(mock.cancels()).toBe(1);
    expect(c.getState().active?.text).toBe('B1');
  });

  it('stopAll clears queue and active', () => {
    const mock = makeSpeaker({ manual: true });
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'A1', agentName: 'A' });
    c.enqueue({ source: 'auto', text: 'B1', agentName: 'B' });
    c.stopAll();
    expect(c.getState().active).toBeNull();
    expect(c.getState().queue).toEqual([]);
  });

  it('pause/resume restarts the active item', () => {
    const mock = makeSpeaker({ manual: true });
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'A1', agentName: 'A' });
    c.pause();
    expect(c.getState().paused).toBe(true);
    expect(c.getState().active).toBeNull();
    expect(c.getState().queue[0].text).toBe('A1');
    c.resume();
    expect(c.getState().active?.text).toBe('A1');
    // A1 was spoken twice (initial + after resume).
    expect(mock.spoken.filter((s) => s.text === 'A1').length).toBe(2);
  });
});

describe('createTtsQueueController — mute / solo', () => {
  it('mutes an agent: future items are deferred, not spoken', () => {
    const mock = makeSpeaker({ manual: true });
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.muteAgent('Spammy');
    c.enqueue({ source: 'auto', text: 'noise', agentName: 'Spammy' });
    expect(c.getState().active).toBeNull();
    expect(c.getState().deferred.map((d) => d.text)).toEqual(['noise']);
  });

  it('muting the active agent skips it', () => {
    const mock = makeSpeaker({ manual: true });
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'A1', agentName: 'A' });
    c.enqueue({ source: 'auto', text: 'B1', agentName: 'B' });
    c.muteAgent('A');
    expect(c.getState().active?.text).toBe('B1');
  });

  it('solo silences everyone else', () => {
    const mock = makeSpeaker({ manual: true });
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'A1', agentName: 'A' });
    c.enqueue({ source: 'auto', text: 'B1', agentName: 'B' });
    c.soloAgent('A');
    expect(c.getState().active?.text).toBe('A1');
    expect(c.getState().queue.find((q) => q.agentName === 'B')).toBeUndefined();
    expect(c.getState().deferred.map((d) => d.text)).toContain('B1');
  });

  it('readAgent surfaces a deferred muted item to the front', () => {
    const mock = makeSpeaker({ manual: true });
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.muteAgent('Quiet');
    c.enqueue({ source: 'auto', text: 'held', agentName: 'Quiet' });
    expect(c.getState().active).toBeNull();
    const ok = c.readAgent('Quiet');
    expect(ok).toBe(true);
    expect(c.getState().active?.text).toBe('held');
  });
});

describe('createTtsQueueController — conflict policies', () => {
  it('announce policy defers the body and queues a short announcement', () => {
    const mock = makeSpeaker({ manual: true });
    const c = createTtsQueueController({ conflictPolicy: 'announce' });
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'long A response', agentName: 'A' });
    c.enqueue({ source: 'auto', text: 'long B response', agentName: 'B' });
    // B's body is deferred; an announcement is queued.
    expect(c.getState().deferred.map((d) => d.text)).toContain('long B response');
    mock.finish(); // finish A
    expect(c.getState().active?.text).toContain('finished');
    // readAllDeferred catches up.
    mock.finish();
    c.readAllDeferred();
    expect(c.getState().active?.text).toBe('long B response');
  });

  it('interrupt policy preempts lower-priority active item', () => {
    const mock = makeSpeaker({ manual: true });
    const c = createTtsQueueController({ conflictPolicy: 'interrupt' });
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'low', agentName: 'A', priority: 0 });
    c.enqueue({ source: 'auto', text: 'urgent', agentName: 'B', priority: 9 });
    expect(c.getState().active?.text).toBe('urgent');
    expect(c.getState().queue.map((q) => q.text)).toContain('low');
  });
});

describe('createTtsQueueController — repeat', () => {
  it('repeatLast replays the last spoken item', () => {
    const mock = makeSpeaker();
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'remember me', agentName: 'A' });
    expect(c.repeatLast()).toBe(true);
    expect(mock.spoken.filter((s) => s.text === 'remember me').length).toBe(2);
  });

  it('repeatLast for an agent returns false when last speaker differs', () => {
    const mock = makeSpeaker();
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'from A', agentName: 'A' });
    expect(c.repeatLast('B')).toBe(false);
  });
});

describe('createTtsQueueController — agent counting', () => {
  it('counts distinct active agents', () => {
    const mock = makeSpeaker({ manual: true });
    const c = createTtsQueueController();
    c.setSpeaker(mock.speaker);
    c.enqueue({ source: 'auto', text: 'A1', agentName: 'A' });
    c.enqueue({ source: 'auto', text: 'B1', agentName: 'B' });
    expect(c.distinctActiveAgentCount()).toBe(2);
  });
});
