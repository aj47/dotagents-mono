/**
 * App-wide singleton wrapper around {@link createTtsQueueController}.
 *
 * ChatScreen registers the actual speaking engine via {@link setTtsQueueSpeaker}
 * and feeds it utterances; the rest of the app (status dock, voice commands)
 * reads state through {@link useTtsQueueState} and drives it through the
 * exported control helpers. Keeping a single instance means a background
 * agent that finishes while another is speaking still lands in the same queue
 * instead of being dropped.
 */
import { useEffect, useState } from 'react';
import {
  createTtsQueueController,
  type TtsConflictPolicy,
  type TtsQueueState,
  type TtsSpeaker,
} from './ttsQueue';

export const globalTtsQueue = createTtsQueueController();

export function setTtsQueueSpeaker(speaker: TtsSpeaker | null): void {
  globalTtsQueue.setSpeaker(speaker);
}

export function useTtsQueueState(): TtsQueueState {
  const [state, setState] = useState<TtsQueueState>(() => ({ ...globalTtsQueue.getState() }));
  useEffect(() => {
    // Sync immediately in case state changed between render and subscribe.
    setState({ ...globalTtsQueue.getState() });
    return globalTtsQueue.subscribe(() => {
      // Shallow clone so React sees a new reference and re-renders.
      setState({ ...globalTtsQueue.getState() });
    });
  }, []);
  return state;
}

export function setTtsQueueConflictPolicy(policy: TtsConflictPolicy): void {
  globalTtsQueue.setConflictPolicy(policy);
}

/**
 * Human / spoken summary of what is playing and waiting, used by the
 * "what's playing" voice command and accessibility hints.
 */
export function describeTtsQueue(state: TtsQueueState = globalTtsQueue.getState()): string {
  const nameOf = (item: { agentName: string | null; sessionTitle: string | null } | null) =>
    item?.agentName || item?.sessionTitle || 'an agent';

  if (state.paused) {
    const held = state.queue.length + (state.active ? 1 : 0);
    return held > 0
      ? `Playback paused. ${held} ${held === 1 ? 'message' : 'messages'} waiting.`
      : 'Playback paused. Nothing waiting.';
  }

  if (!state.active && state.queue.length === 0) {
    const deferred = state.deferred.filter((d) => !d.announceOnly).length;
    if (deferred > 0) {
      return `Nothing playing. ${deferred} withheld — say "read everything" to catch up.`;
    }
    return 'Nothing is playing.';
  }

  const parts: string[] = [];
  if (state.active) parts.push(`${nameOf(state.active)} is talking now`);
  if (state.queue.length > 0) {
    const waiting = state.queue.map((q) => q.agentName || q.sessionTitle || 'an agent');
    const unique = Array.from(new Set(waiting));
    parts.push(`${state.queue.length} waiting${unique.length ? `: ${unique.join(', ')}` : ''}`);
  }
  return `${parts.join('. ')}.`;
}
