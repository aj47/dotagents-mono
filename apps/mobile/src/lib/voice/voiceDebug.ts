import { useCallback, useState } from 'react';
import type { HandsFreeDebugEventType } from '@dotagents/shared';

export const VOICE_DEBUG_GLOBAL_KEY = '__DOTAGENTS_VOICE_DEBUG_EVENTS__';

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

const MAX_VOICE_DEBUG_EVENTS = 50;
const MAX_VOICE_DEBUG_DETAIL_LENGTH = 220;
const MAX_VOICE_DEBUG_STRING_LENGTH = 140;

function createVoiceDebugEntry(
  type: HandsFreeDebugEventType,
  summary: string,
  detail?: Record<string, unknown>,
): VoiceDebugEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    type,
    summary,
    detail,
  };
}

function compactVoiceDebugDetail(detail?: Record<string, unknown>): string | null {
  if (!detail) return null;

  try {
    const serialized = JSON.stringify(detail, (_key, value) => {
      if (typeof value === 'string' && value.length > MAX_VOICE_DEBUG_STRING_LENGTH) {
        return `${value.slice(0, MAX_VOICE_DEBUG_STRING_LENGTH)}...`;
      }
      return value;
    });
    if (!serialized || serialized === '{}') return null;
    return serialized.length > MAX_VOICE_DEBUG_DETAIL_LENGTH
      ? `${serialized.slice(0, MAX_VOICE_DEBUG_DETAIL_LENGTH)}...`
      : serialized;
  } catch {
    return null;
  }
}

function appendGlobalVoiceDebugEvent(entry: VoiceDebugEntry) {
  const host = globalThis as any;
  const previous = Array.isArray(host[VOICE_DEBUG_GLOBAL_KEY])
    ? host[VOICE_DEBUG_GLOBAL_KEY]
    : [];
  host[VOICE_DEBUG_GLOBAL_KEY] = [entry, ...previous].slice(0, MAX_VOICE_DEBUG_EVENTS);
}

export function formatVoiceDebugEntry(entry: VoiceDebugEntry): string {
  const timestamp = new Date(entry.at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const detail = compactVoiceDebugDetail(entry.detail);
  return detail
    ? `${timestamp} · ${entry.summary} · ${detail}`
    : `${timestamp} · ${entry.summary}`;
}

export function useVoiceDebug(enabled: boolean) {
  const [events, setEvents] = useState<VoiceDebugEntry[]>([]);

  const log = useCallback<VoiceDebugLog>((type, summary, detail) => {
    const entry = createVoiceDebugEntry(type, summary, detail);

    if (__DEV__) {
      if (detail) {
        console.log(`[VoiceDebug] ${type}: ${summary}`, detail);
      } else {
        console.log(`[VoiceDebug] ${type}: ${summary}`);
      }
      appendGlobalVoiceDebugEvent(entry);
    }

    if (!enabled) {
      return;
    }

    setEvents((prev) => {
      return [entry, ...prev].slice(0, MAX_VOICE_DEBUG_EVENTS);
    });
  }, [enabled]);

  const clear = useCallback(() => setEvents([]), []);

  return { events, log, clear } as const;
}
