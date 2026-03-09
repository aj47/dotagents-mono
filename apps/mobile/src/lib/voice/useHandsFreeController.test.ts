import { describe, expect, it } from 'vitest';
import { createInitialHandsFreeState, resolveHandsFreeUtterance } from './useHandsFreeController';

describe('resolveHandsFreeUtterance', () => {
  it('keeps sleeping when no wake phrase is present', () => {
    const result = resolveHandsFreeUtterance({
      state: createInitialHandsFreeState(),
      transcript: 'tell me a joke',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 100,
    });

    expect(result.action).toEqual({ type: 'none' });
    expect(result.nextState.phase).toBe('sleeping');
    expect(result.nextState.lastTranscript).toBe('tell me a joke');
  });

  it('wakes without sending when only the wake phrase is heard', () => {
    const result = resolveHandsFreeUtterance({
      state: createInitialHandsFreeState(),
      transcript: 'hey dot agents',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 100,
    });

    expect(result.action).toEqual({ type: 'none' });
    expect(result.nextState.phase).toBe('waking');
    expect(result.matchedWake).toBe(true);
  });

  it('sends the remainder when wake phrase and request are combined', () => {
    const result = resolveHandsFreeUtterance({
      state: createInitialHandsFreeState(),
      transcript: 'hey dot agents what is the weather',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 100,
    });

    expect(result.action).toEqual({ type: 'send', text: 'what is the weather' });
    expect(result.nextState.phase).toBe('processing');
    expect(result.nextState.resumePhase).toBe('listening');
  });

  it('returns to sleep when the sleep phrase is spoken while awake', () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: 'listening', awakeSince: 100 },
      transcript: 'go to sleep',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 200,
    });

    expect(result.action).toEqual({ type: 'none' });
    expect(result.nextState.phase).toBe('sleeping');
    expect(result.matchedSleep).toBe(true);
  });

  it('sends a normal utterance while awake', () => {
    const result = resolveHandsFreeUtterance({
      state: { ...createInitialHandsFreeState(), phase: 'listening', awakeSince: 100 },
      transcript: 'summarize my unread email',
      wakePhrase: 'hey dot agents',
      sleepPhrase: 'go to sleep',
      now: 200,
    });

    expect(result.action).toEqual({ type: 'send', text: 'summarize my unread email' });
    expect(result.nextState.phase).toBe('processing');
  });
});