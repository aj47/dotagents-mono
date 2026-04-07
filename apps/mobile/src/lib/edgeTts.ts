import { Platform } from 'react-native';
import {
  AudioPlayer,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

type EdgeSpeakOptions = {
  voice?: string;
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
    // Make sure Edge TTS is audible even when the iOS silent switch is on.
    await setAudioModeAsync({ playsInSilentMode: true });
    audioModeConfigured = true;
  } catch {
    // Non-fatal: the audio will still play, it just might be muted by the switch.
  }
}

export async function speakEdgeTts(text: string, options: EdgeSpeakOptions = {}): Promise<boolean> {
  if (!text.trim()) return false;

  try {
    const audioBuffer = await synthesizeEdgeTts(
      text,
      options.voice ?? 'en-US-AriaNeural',
      options.rate ?? 1.0,
    );
    stopEdgeTts();

    if (Platform.OS === 'web') {
      return startWebPlayback(audioBuffer, options);
    }
    await ensureNativeAudioMode();
    return startNativePlayback(audioBuffer, options);
  } catch {
    options.onError?.();
    return false;
  }
}

function startWebPlayback(audioBuffer: ArrayBuffer, options: EdgeSpeakOptions): boolean {
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  const playback: WebPlayback = { kind: 'web', audio, objectUrl: url };
  currentPlayback = playback;

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

function startNativePlayback(audioBuffer: ArrayBuffer, options: EdgeSpeakOptions): boolean {
  const filename = `edge-tts-${Date.now()}-${Math.floor(Math.random() * 1e6)}.mp3`;
  const file = new File(Paths.cache, filename);
  try {
    // Overwrite if a previous file with the same name somehow exists.
    file.create({ overwrite: true });
  } catch {
    // File may already exist as a fresh handle; write() will still succeed.
  }
  file.write(new Uint8Array(audioBuffer));

  const player = createAudioPlayer({ uri: file.uri });

  // Clamp the playback rate to the intersection of supported ranges (0.5 - 2.0).
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
    // If we can't subscribe to status updates, cleanup will still happen on stopEdgeTts().
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

export function stopEdgeTts(): void {
  const playback = currentPlayback;
  if (!playback) return;
  currentPlayback = null;

  if (playback.kind === 'web') {
    try { playback.audio.pause(); } catch {}
    try { playback.audio.currentTime = 0; } catch {}
    try { URL.revokeObjectURL(playback.objectUrl); } catch {}
    return;
  }

  // Native
  playback.stopped = true;
  try { playback.subscription?.remove(); } catch {}
  try { playback.player.pause(); } catch {}
  try { playback.player.remove(); } catch {}
  try { playback.file.delete(); } catch {}
}

async function synthesizeEdgeTts(text: string, voice: string, speed: number): Promise<ArrayBuffer> {
  const clampedSpeed = Math.min(2.0, Math.max(0.5, speed));
  const ratePercent = Math.round((clampedSpeed - 1) * 100);
  const rate = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`;

  const trustedClientToken = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
  const connectionId = generateUuidHex();
  const requestId = generateUuidHex();
  const timestamp = new Date().toISOString();
  const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${trustedClientToken}&ConnectionId=${connectionId}`;

  const audioChunks: Uint8Array[] = [];

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    // On React Native the default binary type can be 'blob' and blob.arrayBuffer() is
    // not always implemented; force arraybuffer so we get ArrayBuffer everywhere.
    try {
      ws.binaryType = 'arraybuffer';
    } catch {}

    ws.onopen = () => {
      const speechConfig = [
        `X-Timestamp:${timestamp}`,
        'Content-Type:application/json; charset=utf-8',
        'Path:speech.config',
        '',
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: 'false',
                  wordBoundaryEnabled: 'false',
                },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
              },
            },
          },
        }),
      ].join('\r\n');

      const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='${escapeXml(voice)}'><prosody rate='${escapeXml(rate)}'>${escapeXml(text)}</prosody></voice></speak>`;
      const ssmlRequest = [
        `X-RequestId:${requestId}`,
        'Content-Type:application/ssml+xml',
        `X-Timestamp:${timestamp}`,
        'Path:ssml',
        '',
        ssml,
      ].join('\r\n');

      ws.send(speechConfig);
      ws.send(ssmlRequest);
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) {
          ws.close();
          resolve();
        }
        return;
      }

      // Binary frame. With binaryType='arraybuffer' we get an ArrayBuffer directly,
      // but fall back to Blob.arrayBuffer() just in case a platform overrides it.
      let buffer: Uint8Array;
      if (event.data instanceof ArrayBuffer) {
        buffer = new Uint8Array(event.data);
      } else {
        try {
          buffer = new Uint8Array(await (event.data as Blob).arrayBuffer());
        } catch {
          return;
        }
      }

      const headerEndIndex = findHeaderBoundary(buffer);
      if (headerEndIndex < 0) return;
      const headerText = new TextDecoder().decode(buffer.subarray(0, headerEndIndex));
      if (!headerText.includes('Path:audio')) return;
      const audioData = buffer.subarray(headerEndIndex + 4);
      if (audioData.length > 0) audioChunks.push(audioData);
    };

    ws.onerror = () => reject(new Error('Edge TTS websocket failed'));
    ws.onclose = () => {
      if (audioChunks.length === 0) reject(new Error('No Edge TTS audio received'));
    };
  });

  const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of audioChunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged.buffer;
}

function generateUuidHex(): string {
  // Prefer the Web Crypto API when available (web + modern Hermes).
  try {
    const g = globalThis as { crypto?: { randomUUID?: () => string } };
    if (g.crypto && typeof g.crypto.randomUUID === 'function') {
      return g.crypto.randomUUID().replace(/-/g, '');
    }
  } catch {}
  // Fallback to expo-crypto which works across iOS/Android/web.
  try {
    return Crypto.randomUUID().replace(/-/g, '');
  } catch {}
  // Last-resort non-crypto fallback; Edge TTS only needs a unique token per request.
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function findHeaderBoundary(buffer: Uint8Array): number {
  for (let i = 0; i < buffer.length - 3; i++) {
    if (buffer[i] === 13 && buffer[i + 1] === 10 && buffer[i + 2] === 13 && buffer[i + 3] === 10) {
      return i;
    }
  }
  return -1;
}
