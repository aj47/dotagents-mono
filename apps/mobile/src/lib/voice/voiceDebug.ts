import { useCallback, useState } from 'react';
import type { HandsFreeDebugEventType } from '@dotagents/shared';

export type VoiceDebugEntry = {
  id: string;
  at: number;
  type: HandsFreeDebugEventType;
  summary: string;
  detail?: Record<string, unknown>;
};

export type VoiceDebugLog = (
  type: HandsFreeDebugEventType,
  summary: string,
  detail?: Record<string, unknown>,
) => void;

const MAX_VOICE_DEBUG_EVENTS = 20;

export function formatVoiceDebugEntry(entry: VoiceDebugEntry): string {
  const timestamp = new Date(entry.at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${timestamp} · ${entry.summary}`;
}

export function useVoiceDebug(enabled: boolean) {
  const [events, setEvents] = useState<VoiceDebugEntry[]>([]);

  const log = useCallback<VoiceDebugLog>((type, summary, detail) => {
    if (__DEV__) {
      if (detail) {
        console.log(`[VoiceDebug] ${type}: ${summary}`, detail);
      } else {
        console.log(`[VoiceDebug] ${type}: ${summary}`);
      }
    }

    if (!enabled) {
      return;
    }

    setEvents((prev) => {
      const next: VoiceDebugEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: Date.now(),
        type,
        summary,
        detail,
      };
      return [next, ...prev].slice(0, MAX_VOICE_DEBUG_EVENTS);
    });
  }, [enabled]);

  const clear = useCallback(() => setEvents([]), []);

  return { events, log, clear } as const;
}