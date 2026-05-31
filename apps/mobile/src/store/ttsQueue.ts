/**
 * Global multi-agent TTS queue manager.
 *
 * The app can have several agent sessions producing spoken output at once.
 * This module owns the ordering, identity, and lifecycle of every utterance
 * so that:
 *   - utterances from different agents never overlap (one speaker at a time);
 *   - each utterance keeps its agent identity so the UI and the spoken
 *     prefix can say *who* is talking;
 *   - the user can pause/resume, skip, stop everything, mute/solo a specific
 *     agent, replay, and choose how conflicts are handled when a second agent
 *     finishes while another is still speaking.
 *
 * The manager is engine-agnostic: it never calls expo-speech / remote TTS
 * directly. The owner registers a {@link TtsSpeaker} that performs the actual
 * audio, and the manager drives the sequencing. This keeps all the ordering
 * logic pure and unit-testable.
 */

export type TtsConflictPolicy = 'queue' | 'announce' | 'interrupt';
export type TtsQueueSource = 'auto' | 'message' | 'history' | 'settings';
export type TtsActiveStatus = 'loading' | 'speaking';

export interface TtsQueueItem {
  id: string;
  source: TtsQueueSource;
  sessionId: string | null;
  sessionTitle: string | null;
  /** Display name of the agent that produced this utterance, if known. */
  agentName: string | null;
  /** Higher = spoken sooner. Defaults to 0. */
  priority: number;
  text: string;
  textPreview: string;
  enqueuedAt: number;
  requestId?: number | null;
  messageIndex?: number | null;
  /** Internal: short spoken announcement instead of the full text. */
  announceOnly?: boolean;
  /** User explicitly requested this item ("read X now") — bypasses mute/solo. */
  forced?: boolean;
}

export interface TtsQueueState {
  active: TtsQueueItem | null;
  activeStatus: TtsActiveStatus | null;
  queue: TtsQueueItem[];
  /** Items withheld from auto-read under the "announce" policy. */
  deferred: TtsQueueItem[];
  paused: boolean;
  mutedAgents: string[];
  soloAgent: string | null;
  conflictPolicy: TtsConflictPolicy;
  lastSpoken: TtsQueueItem | null;
}

export interface TtsSpeakHandle {
  onLoading(): void;
  onSpeaking(): void;
  onDone(): void;
  onError(error?: unknown): void;
}

export interface TtsSpeaker {
  /** Begin speaking an item. Returns nothing; report progress via handle. */
  speak(item: TtsQueueItem, handle: TtsSpeakHandle): void;
  /** Stop whatever is currently playing (idempotent). */
  cancel(): void;
}

export type EnqueueInput = {
  source: TtsQueueSource;
  sessionId?: string | null;
  sessionTitle?: string | null;
  agentName?: string | null;
  text: string;
  priority?: number;
  requestId?: number | null;
  messageIndex?: number | null;
  /** Stable id; auto-generated when omitted. */
  id?: string;
};

export interface TtsQueueControllerOptions {
  now?: () => number;
  conflictPolicy?: TtsConflictPolicy;
}

const PUNCTUATION = /[^a-z0-9 ]+/gi;

export function normalizeAgentKey(name: string | null | undefined): string {
  return (name || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(PUNCTUATION, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function previewOf(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 140);
}

/**
 * Build the spoken identity prefix for an utterance. Only prefix when more
 * than one agent is in play so single-agent flows stay terse.
 */
export function formatAgentSpokenPrefix(
  agentName: string | null | undefined,
  opts: { multiAgent: boolean } = { multiAgent: false },
): string {
  const name = (agentName || '').trim();
  if (!name || !opts.multiAgent) return '';
  // Avoid doubling "agent" if the name already ends with it.
  const suffix = /agent$/i.test(name) ? '' : ' agent';
  return `${name}${suffix}: `;
}

export function createTtsQueueController(options: TtsQueueControllerOptions = {}) {
  const now = options.now ?? (() => Date.now());
  let counter = 0;

  const state: TtsQueueState = {
    active: null,
    activeStatus: null,
    queue: [],
    deferred: [],
    paused: false,
    mutedAgents: [],
    soloAgent: null,
    conflictPolicy: options.conflictPolicy ?? 'queue',
    lastSpoken: null,
  };

  const listeners = new Set<() => void>();
  let speaker: TtsSpeaker | null = null;
  // Generation guards stale speaker callbacks after cancel/skip/stop.
  let generation = 0;

  function emit() {
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getState(): TtsQueueState {
    return state;
  }

  function setSpeaker(next: TtsSpeaker | null) {
    speaker = next;
  }

  function isAgentAudible(agentName: string | null): boolean {
    const key = normalizeAgentKey(agentName);
    if (state.soloAgent && key !== state.soloAgent) return false;
    if (key && state.mutedAgents.includes(key)) return false;
    return true;
  }

  function distinctActiveAgentCount(): number {
    const keys = new Set<string>();
    if (state.active?.agentName) keys.add(normalizeAgentKey(state.active.agentName));
    for (const item of state.queue) {
      if (item.agentName) keys.add(normalizeAgentKey(item.agentName));
    }
    keys.delete('');
    return keys.size;
  }

  function makeItem(input: EnqueueInput, announceOnly = false): TtsQueueItem {
    counter += 1;
    return {
      id: input.id ?? `tts-${now()}-${counter}`,
      source: input.source,
      sessionId: input.sessionId ?? null,
      sessionTitle: input.sessionTitle ?? null,
      agentName: input.agentName ?? null,
      priority: input.priority ?? 0,
      text: input.text,
      textPreview: previewOf(input.text),
      enqueuedAt: now(),
      requestId: input.requestId ?? null,
      messageIndex: input.messageIndex ?? null,
      announceOnly,
    };
  }

  /** Insert respecting priority (desc) then FIFO. */
  function insertByPriority(item: TtsQueueItem) {
    const idx = state.queue.findIndex((q) => q.priority < item.priority);
    if (idx === -1) state.queue.push(item);
    else state.queue.splice(idx, 0, item);
  }

  function startSpeaking(item: TtsQueueItem) {
    state.active = item;
    state.activeStatus = 'loading';
    const gen = generation;
    emit();
    if (!speaker) {
      // No engine registered yet — treat as immediately done so the queue
      // does not wedge. The owner should register a speaker before enqueueing.
      finishActive(gen);
      return;
    }
    speaker.speak(item, {
      onLoading: () => {
        if (gen !== generation) return;
        state.activeStatus = 'loading';
        emit();
      },
      onSpeaking: () => {
        if (gen !== generation) return;
        state.activeStatus = 'speaking';
        emit();
      },
      onDone: () => {
        if (gen !== generation) return;
        finishActive(gen);
      },
      onError: () => {
        if (gen !== generation) return;
        finishActive(gen);
      },
    });
  }

  function finishActive(gen: number) {
    if (gen !== generation) return;
    if (state.active) state.lastSpoken = state.active;
    state.active = null;
    state.activeStatus = null;
    pump();
  }

  /** Drive the queue: pop the next audible item and speak it. */
  function pump() {
    if (state.paused) {
      emit();
      return;
    }
    if (state.active) {
      emit();
      return;
    }
    while (state.queue.length > 0) {
      const next = state.queue.shift()!;
      if (!next.forced && !isAgentAudible(next.agentName)) {
        // Skip muted/non-solo items silently.
        continue;
      }
      startSpeaking(next);
      return;
    }
    emit();
  }

  function enqueue(input: EnqueueInput): TtsQueueItem | null {
    const item = makeItem(input);

    if (!isAgentAudible(item.agentName)) {
      // Muted/non-solo: keep as deferred so "read <agent>" can recover it,
      // but never auto-speak.
      state.deferred.push(item);
      emit();
      return null;
    }

    // Conflict handling when something is already speaking.
    if (state.active && item.source === 'auto') {
      if (state.conflictPolicy === 'announce') {
        state.deferred.push(item);
        const announce = makeItem(
          {
            source: 'auto',
            sessionId: item.sessionId,
            sessionTitle: item.sessionTitle,
            agentName: item.agentName,
            text: `${item.agentName || item.sessionTitle || 'An agent'} finished.`,
            priority: item.priority,
          },
          true,
        );
        insertByPriority(announce);
        pump();
        return announce;
      }
      if (state.conflictPolicy === 'interrupt' && item.priority > (state.active.priority ?? 0)) {
        // Preempt: stop current, push it back to the front, then play item.
        const preempted = state.active;
        cancelActive();
        state.queue.unshift(preempted);
        insertByPriority(item);
        pump();
        return item;
      }
    }

    insertByPriority(item);
    pump();
    return item;
  }

  function cancelActive() {
    generation += 1;
    speaker?.cancel();
    state.active = null;
    state.activeStatus = null;
  }

  /** Stop the current utterance and advance to the next. */
  function skip() {
    if (!state.active) return;
    const skipped = state.active;
    cancelActive();
    state.lastSpoken = skipped;
    pump();
  }

  /** Stop current playback entirely and clear the queue. */
  function stopAll() {
    cancelActive();
    state.queue = [];
    state.deferred = [];
    emit();
  }

  function pause() {
    if (state.paused) return;
    state.paused = true;
    if (state.active) {
      // Re-queue the active item at the front so resume restarts it cleanly.
      const item = state.active;
      cancelActive();
      state.queue.unshift(item);
    }
    emit();
  }

  function resume() {
    if (!state.paused) return;
    state.paused = false;
    pump();
  }

  function togglePause() {
    if (state.paused) resume();
    else pause();
  }

  function muteAgent(agentName: string) {
    const key = normalizeAgentKey(agentName);
    if (!key) return;
    if (!state.mutedAgents.includes(key)) state.mutedAgents.push(key);
    // Defer queued items from this agent and skip if currently active.
    state.deferred.push(...state.queue.filter((q) => normalizeAgentKey(q.agentName) === key));
    state.queue = state.queue.filter((q) => normalizeAgentKey(q.agentName) !== key);
    if (state.active && normalizeAgentKey(state.active.agentName) === key) {
      skip();
    } else {
      emit();
    }
  }

  function unmuteAgent(agentName: string) {
    const key = normalizeAgentKey(agentName);
    state.mutedAgents = state.mutedAgents.filter((k) => k !== key);
    emit();
  }

  /** Solo an agent: only that agent is audible. Pass null to clear. */
  function soloAgent(agentName: string | null) {
    state.soloAgent = agentName ? normalizeAgentKey(agentName) : null;
    if (state.soloAgent) {
      state.deferred.push(
        ...state.queue.filter((q) => normalizeAgentKey(q.agentName) !== state.soloAgent),
      );
      state.queue = state.queue.filter((q) => normalizeAgentKey(q.agentName) === state.soloAgent);
      if (state.active && normalizeAgentKey(state.active.agentName) !== state.soloAgent) {
        skip();
        return;
      }
    }
    emit();
  }

  /** Move an agent's most recent (deferred or queued) utterance to the front. */
  function readAgent(agentName: string): boolean {
    const key = normalizeAgentKey(agentName);
    if (!key) return false;
    // Prefer a deferred (withheld) item, newest first.
    let item: TtsQueueItem | undefined;
    for (let i = state.deferred.length - 1; i >= 0; i -= 1) {
      if (normalizeAgentKey(state.deferred[i].agentName) === key && !state.deferred[i].announceOnly) {
        item = state.deferred.splice(i, 1)[0];
        break;
      }
    }
    if (!item) {
      const qIdx = state.queue.findIndex((q) => normalizeAgentKey(q.agentName) === key);
      if (qIdx !== -1) item = state.queue.splice(qIdx, 1)[0];
    }
    if (!item && state.lastSpoken && normalizeAgentKey(state.lastSpoken.agentName) === key) {
      item = { ...state.lastSpoken, id: `${state.lastSpoken.id}-replay-${(counter += 1)}` };
    }
    if (!item) return false;
    item.priority = Math.max(item.priority, (state.active?.priority ?? 0) + 1);
    // Explicit user request: play even if this agent is muted/soloed out.
    item.forced = true;
    state.queue.unshift(item);
    pump();
    return true;
  }

  /** Read every withheld/deferred item (switch to catching up). */
  function readAllDeferred() {
    const items = state.deferred.filter((d) => !d.announceOnly);
    state.deferred = [];
    for (const item of items) insertByPriority(item);
    pump();
  }

  /** Replay the last spoken utterance (optionally for a specific agent). */
  function repeatLast(agentName?: string): boolean {
    let base: TtsQueueItem | null = state.lastSpoken;
    if (agentName) {
      const key = normalizeAgentKey(agentName);
      base = state.lastSpoken && normalizeAgentKey(state.lastSpoken.agentName) === key
        ? state.lastSpoken
        : null;
    }
    if (!base) return false;
    counter += 1;
    const replay: TtsQueueItem = {
      ...base,
      id: `${base.id}-repeat-${counter}`,
      priority: (state.active?.priority ?? 0) + 1,
      announceOnly: false,
      forced: true,
    };
    state.queue.unshift(replay);
    pump();
    return true;
  }

  function setConflictPolicy(policy: TtsConflictPolicy) {
    state.conflictPolicy = policy;
    emit();
  }

  return {
    subscribe,
    getState,
    setSpeaker,
    enqueue,
    skip,
    stopAll,
    pause,
    resume,
    togglePause,
    muteAgent,
    unmuteAgent,
    soloAgent,
    readAgent,
    readAllDeferred,
    repeatLast,
    setConflictPolicy,
    distinctActiveAgentCount,
    isAgentAudible,
  };
}

export type TtsQueueController = ReturnType<typeof createTtsQueueController>;
