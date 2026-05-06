import { useCallback, useState } from 'react';
import {
  prependVoiceDebugEntry,
  type VoiceDebugEntry,
  type VoiceDebugLog,
} from '@dotagents/shared/voice-debug-log';

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
      return prependVoiceDebugEntry(prev, next);
    });
  }, [enabled]);

  const clear = useCallback(() => setEvents([]), []);

  return { events, log, clear } as const;
}
