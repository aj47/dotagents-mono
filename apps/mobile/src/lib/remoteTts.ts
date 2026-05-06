import { Platform } from 'react-native';
import {
  AudioPlayer,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { createExtendedSettingsApiClient } from './settingsApi';

export { resolveEdgeTtsVoice } from '@dotagents/shared/providers';

// Remote TTS client. Audio synthesis happens on the paired desktop's
// remote-server (POST /v1/tts/speak); this module only handles the HTTP
// round-trip and playback. Web browsers can't set the Origin/User-Agent
// headers Microsoft's Edge TTS endpoint requires, and mobile shouldn't need
// provider API keys locally, so going through the desktop is the one path
// that works on every platform without duplicating provider integrations.

function logRemoteTts(level: 'warn' | 'info', message: string, extra?: unknown): void {
  const prefix = '[remote-tts]';
  if (extra !== undefined) {
    if (level === 'warn') console.warn(prefix, message, extra);
    else console.log(prefix, message, extra);
  } else {
    if (level === 'warn') console.warn(prefix, message);
    else console.log(prefix, message);
  }
}

export type RemoteSpeakOptions = {
  /** Paired desktop remote-server base URL including /v1. From AppConfig.baseUrl. */
  baseUrl: string;
  /** Bearer token for the remote server. From AppConfig.apiKey. */
  apiKey: string;
  providerId?: string;
  voice?: string;
  model?: string;
  rate?: number;
  onDone?: () => void;
  onError?: () => void;
  onStopped?: () => void;
};

type WebPlayback = {
  kind: 'web';
  audio: HTMLAudioElement;
  objectUrl: string;
};

type NativePlayback = {
  kind: 'native';
  player: AudioPlayer;
  file: File;
  subscription: { remove: () => void } | null;
  stopped: boolean;
};

let currentPlayback: WebPlayback | NativePlayback | null = null;
let audioModeConfigured = false;

async function ensureNativeAudioMode(): Promise<void> {
  if (audioModeConfigured || Platform.OS === 'web') return;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    audioModeConfigured = true;
  } catch {
    // Non-fatal: the audio will still play, it just might be muted by the switch.
  }
}

export async function speakRemoteTts(text: string, options: RemoteSpeakOptions): Promise<boolean> {
  if (!text.trim()) return false;
  if (!options.baseUrl || !options.apiKey) {
    logRemoteTts('warn', 'missing baseUrl/apiKey; cannot reach paired desktop');
    options.onError?.();
    return false;
  }

  try {
    const { audio, mimeType } = await fetchRemoteTts(text, options);
    stopRemoteTts();
    if (Platform.OS === 'web') {
      return startWebPlayback(audio, mimeType, options);
    }
    await ensureNativeAudioMode();
    return startNativePlayback(audio, mimeType, options);
  } catch (error) {
    logRemoteTts('warn', 'speakRemoteTts failed', error);
    options.onError?.();
    return false;
  }
}

async function fetchRemoteTts(
  text: string,
  options: RemoteSpeakOptions,
): Promise<{ audio: ArrayBuffer; mimeType: string }> {
  const client = createExtendedSettingsApiClient(options.baseUrl, options.apiKey);
  return client.synthesizeSpeech({
    text,
    providerId: options.providerId,
    voice: options.voice,
    model: options.model,
    speed: options.rate,
  });
}

function startWebPlayback(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  options: RemoteSpeakOptions,
): boolean {
  const blob = new Blob([audioBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  const playback: WebPlayback = { kind: 'web', audio, objectUrl: url };
  currentPlayback = playback;

  try {
    const rate = Math.min(2.0, Math.max(0.5, options.rate ?? 1.0));
    audio.playbackRate = rate;
  } catch {
    // Some browsers restrict playbackRate changes; playback still works at 1x.
  }

  const cleanup = () => {
    try { URL.revokeObjectURL(url); } catch {}
    if (currentPlayback === playback) {
      currentPlayback = null;
    }
  };

  audio.onended = () => {
    cleanup();
    options.onDone?.();
  };
  audio.onerror = () => {
    cleanup();
    options.onError?.();
  };
  audio.onpause = () => {
    if (!audio.ended) options.onStopped?.();
  };

  void audio.play();
  return true;
}

function startNativePlayback(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  options: RemoteSpeakOptions,
): boolean {
  const ext = mimeTypeToExtension(mimeType);
  const filename = `remote-tts-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
  const file = new File(Paths.cache, filename);
  try {
    file.create({ overwrite: true });
  } catch {
    // File may already exist as a fresh handle; write() will still succeed.
  }
  file.write(new Uint8Array(audioBuffer));

  const player = createAudioPlayer({ uri: file.uri });

  const desiredRate = Math.min(2.0, Math.max(0.5, options.rate ?? 1.0));
  try {
    player.playbackRate = desiredRate;
  } catch {
    // Some platforms/builds may throw until the source is loaded. Ignore.
  }

  const playback: NativePlayback = {
    kind: 'native',
    player,
    file,
    subscription: null,
    stopped: false,
  };

  const finalize = (reason: 'done' | 'error' | 'stopped') => {
    try { playback.subscription?.remove(); } catch {}
    try { player.remove(); } catch {}
    try { file.delete(); } catch {}
    if (currentPlayback === playback) {
      currentPlayback = null;
    }
    if (reason === 'done') options.onDone?.();
    else if (reason === 'error') options.onError?.();
    else options.onStopped?.();
  };

  try {
    playback.subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (playback.stopped) return;
      if (status.didJustFinish) {
        playback.stopped = true;
        finalize('done');
      }
    });
  } catch {
    // If we can't subscribe to status updates, cleanup will still happen on stopRemoteTts().
  }

  currentPlayback = playback;
  try {
    player.play();
  } catch {
    playback.stopped = true;
    finalize('error');
    return false;
  }
  return true;
}

export function stopRemoteTts(): void {
  const playback = currentPlayback;
  if (!playback) return;
  currentPlayback = null;

  if (playback.kind === 'web') {
    try { playback.audio.pause(); } catch {}
    try { playback.audio.currentTime = 0; } catch {}
    try { URL.revokeObjectURL(playback.objectUrl); } catch {}
    return;
  }

  playback.stopped = true;
  try { playback.subscription?.remove(); } catch {}
  try { playback.player.pause(); } catch {}
  try { playback.player.remove(); } catch {}
  try { playback.file.delete(); } catch {}
}

function mimeTypeToExtension(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  if (normalized === 'audio/mpeg' || normalized === 'audio/mp3') return 'mp3';
  if (normalized === 'audio/wav' || normalized === 'audio/x-wav' || normalized === 'audio/wave') return 'wav';
  if (normalized === 'audio/aac') return 'aac';
  if (normalized === 'audio/opus' || normalized === 'audio/ogg') return 'ogg';
  if (normalized === 'audio/flac') return 'flac';
  return 'bin';
}
