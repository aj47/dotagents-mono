import { createContext, useContext, useState, useCallback } from 'react';

export type CommandQueueEntryKind = 'new' | 'steer' | 'reply';

export interface CommandQueueEntry {
  kind: CommandQueueEntryKind;
  sessionId?: string;
  conversationId?: string;
  title?: string;
}

export interface CommandQueueSessionInput {
  sessionId: string;
  conversationId?: string;
  title?: string;
  isComplete: boolean;
  conversationState?: string;
}

export interface CommandQueueStore {
  isActive: boolean;
  queue: CommandQueueEntry[];
  index: number;
  current: CommandQueueEntry | null;
  total: number;
  enterCommandQueue: (sessions: CommandQueueSessionInput[]) => void;
  exitCommandQueue: () => void;
  advanceQueue: () => void;
  goBackQueue: () => void;
  skipCurrent: () => void;
  appendNewSlot: () => void;
}

export function useCommandQueue(): CommandQueueStore {
  const [isActive, setIsActive] = useState(false);
  const [queue, setQueue] = useState<CommandQueueEntry[]>([]);
  const [index, setIndex] = useState(0);

  const enterCommandQueue = useCallback((sessions: CommandQueueSessionInput[]) => {
    const entries: CommandQueueEntry[] = [];

    for (const s of sessions) {
      if (s.conversationState === 'needs_input') {
        entries.push({ kind: 'reply', sessionId: s.sessionId, conversationId: s.conversationId, title: s.title });
      }
    }
    for (const s of sessions) {
      if (s.isComplete && s.conversationState !== 'needs_input') {
        entries.push({ kind: 'reply', sessionId: s.sessionId, conversationId: s.conversationId, title: s.title });
      }
    }
    for (const s of sessions) {
      if (!s.isComplete && (!s.conversationState || s.conversationState === 'running')) {
        entries.push({ kind: 'steer', sessionId: s.sessionId, conversationId: s.conversationId, title: s.title });
      }
    }
    entries.push({ kind: 'new' });

    setQueue(entries);
    setIndex(0);
    setIsActive(true);
  }, []);

  const exitCommandQueue = useCallback(() => {
    setIsActive(false);
    setQueue([]);
    setIndex(0);
  }, []);

  const advanceQueue = useCallback(() => {
    setIndex((prev) => {
      const next = prev + 1;
      if (next >= queue.length) {
        setIsActive(false);
        setQueue([]);
        return 0;
      }
      return next;
    });
  }, [queue.length]);

  const goBackQueue = useCallback(() => {
    setIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const skipCurrent = useCallback(() => {
    setQueue((prev) => {
      if (prev.length <= 1) return prev;
      const current = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [...rest, current];
    });
    setIndex((prev) => Math.min(prev, queue.length - 1));
  }, [index, queue.length]);

  const appendNewSlot = useCallback(() => {
    setQueue((prev) => {
      let lastNewIdx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].kind === 'new') { lastNewIdx = i; break; }
      }
      if (lastNewIdx !== -1) {
        setIndex(lastNewIdx);
        return prev;
      }
      setIndex(prev.length);
      return [...prev, { kind: 'new' }];
    });
  }, []);

  return {
    isActive,
    queue,
    index,
    current: queue[index] ?? null,
    total: queue.length,
    enterCommandQueue,
    exitCommandQueue,
    advanceQueue,
    goBackQueue,
    skipCurrent,
    appendNewSlot,
  };
}

export const CommandQueueContext = createContext<CommandQueueStore | null>(null);

export function useCommandQueueContext(): CommandQueueStore {
  const ctx = useContext(CommandQueueContext);
  if (!ctx) throw new Error('CommandQueueContext missing');
  return ctx;
}
