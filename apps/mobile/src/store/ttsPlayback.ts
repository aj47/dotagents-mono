import { useEffect, useState } from 'react';
import * as Speech from 'expo-speech';
import { stopRemoteTts } from '../lib/remoteTts';
import { stopAndroidHandsFreeTts } from '../lib/voice/androidHandsFreeService';

export type GlobalTtsPlaybackSource = 'auto' | 'message' | 'history' | 'settings';
export type GlobalTtsPlaybackStatus = 'loading' | 'speaking';

export interface GlobalTtsPlayback {
  id: string;
  source: GlobalTtsPlaybackSource;
  status: GlobalTtsPlaybackStatus;
  sessionId?: string | null;
  sessionTitle?: string | null;
  messageIndex?: number | null;
  textPreview: string;
  startedAt: number;
}

type BeginGlobalTtsPlaybackInput = {
  source: GlobalTtsPlaybackSource;
  status?: GlobalTtsPlaybackStatus;
  sessionId?: string | null;
  sessionTitle?: string | null;
  messageIndex?: number | null;
  text: string;
};

type Listener = () => void;

const listeners = new Set<Listener>();
let currentPlayback: GlobalTtsPlayback | null = null;
let playbackCounter = 0;
let stopGeneration = 0;

function normalizePreview(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 140);
}

function emit(): void {
  listeners.forEach(listener => listener());
}

export function getGlobalTtsPlayback(): GlobalTtsPlayback | null {
  return currentPlayback;
}

export function getGlobalTtsStopGeneration(): number {
  return stopGeneration;
}

export function beginGlobalTtsPlayback(input: BeginGlobalTtsPlaybackInput): string {
  playbackCounter += 1;
  const id = `tts-${Date.now()}-${playbackCounter}`;
  currentPlayback = {
    id,
    source: input.source,
    status: input.status ?? 'speaking',
    sessionId: input.sessionId ?? null,
    sessionTitle: input.sessionTitle ?? null,
    messageIndex: input.messageIndex ?? null,
    textPreview: normalizePreview(input.text),
    startedAt: Date.now(),
  };
  emit();
  return id;
}

export function markGlobalTtsPlaybackSpeaking(id: string): void {
  if (currentPlayback?.id !== id || currentPlayback.status === 'speaking') {
    return;
  }
  currentPlayback = { ...currentPlayback, status: 'speaking' };
  emit();
}

export function completeGlobalTtsPlayback(id?: string | null): void {
  if (!currentPlayback) {
    return;
  }
  if (id && currentPlayback.id !== id) {
    return;
  }
  currentPlayback = null;
  emit();
}

export function stopGlobalTtsPlayback(): void {
  const stack = new Error('global TTS stop requested').stack
    ?.split('\n')
    .slice(1, 7)
    .map((line) => line.trim())
    .join(' <- ');
  console.info(
    `[DotAgentsTTS] global stop active=${currentPlayback?.id ?? 'none'}`
    + ` source=${currentPlayback?.source ?? 'none'}`
    + ` status=${currentPlayback?.status ?? 'none'}`
    + ` stack=${stack ?? 'unavailable'}`,
  );
  stopGeneration += 1;
  Speech.stop();
  stopRemoteTts();
  void stopAndroidHandsFreeTts();
  completeGlobalTtsPlayback();
}

export function useGlobalTtsPlayback(): GlobalTtsPlayback | null {
  const [playback, setPlayback] = useState<GlobalTtsPlayback | null>(() => currentPlayback);

  useEffect(() => {
    const listener = () => setPlayback(currentPlayback);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return playback;
}
