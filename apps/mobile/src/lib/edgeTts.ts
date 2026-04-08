import { Platform } from 'react-native';
import {
  AudioPlayer,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

// Microsoft's consumer Edge TTS endpoint rejects requests without a rolling
// Sec-MS-GEC token and a handful of Edge-lookalike headers. These constants are
// reverse-engineered from the real Edge Read Aloud extension via the canonical
// `rany2/edge-tts` Python library.
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const SEC_MS_GEC_VERSION = '1-143.0.3650.75';
const WSS_BASE_URL =
  'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const WSS_FAKE_ORIGIN = 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold';
const WSS_FAKE_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0';

// Unix timestamp of the Windows file time epoch (1601-01-01 00:00:00 UTC).
const WIN_EPOCH_SECONDS = 11644473600n;

// Allow-list of Edge Neural voices shipped with the app. Microsoft's consumer
// endpoint returns close code 1007 ("Unsupported voice") for any voice not in
// its active catalog, so we validate here and fall back gracefully for stale
// persisted values (e.g. 'en-US-DavisNeural', which Microsoft deprecated).
const SUPPORTED_EDGE_VOICES: ReadonlySet<string> = new Set([
  'en-US-AriaNeural',
  'en-US-GuyNeural',
  'en-US-JennyNeural',
  'en-US-BrianNeural',
  'en-GB-SoniaNeural',
  'en-GB-RyanNeural',
]);
const DEFAULT_EDGE_VOICE = 'en-US-AriaNeural';

/** Returns `voice` if it's in the supported catalog, otherwise the default. */
export function resolveEdgeTtsVoice(voice: string | undefined | null): string {
  if (voice && SUPPORTED_EDGE_VOICES.has(voice)) return voice;
  return DEFAULT_EDGE_VOICE;
}

function logEdgeTts(level: 'warn' | 'info', message: string, extra?: unknown): void {
  const prefix = '[edge-tts]';
  if (extra !== undefined) {
    if (level === 'warn') console.warn(prefix, message, extra);
    else console.log(prefix, message, extra);
  } else {
    if (level === 'warn') console.warn(prefix, message);
    else console.log(prefix, message);
  }
}

/**
 * Generate the Sec-MS-GEC token value. Microsoft's server accepts any token
 * generated within the current 5-minute window (the token rounds the timestamp
 * down to the nearest 300 seconds before hashing, so it's stable within that
 * window). Uses BigInt to avoid floating-point precision loss when converting
 * seconds to Windows 100-nanosecond ticks (~1.36e17, above Number.MAX_SAFE_INTEGER).
 *
 * @see https://github.com/rany2/edge-tts/issues/290#issuecomment-2464956570
 */
async function generateSecMsGec(): Promise<string> {
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  let ticks = nowSec + WIN_EPOCH_SECONDS;
  ticks -= ticks % 300n;
  ticks *= 10000000n; // seconds -> 100-nanosecond intervals
  const strToHash = ticks.toString() + TRUSTED_CLIENT_TOKEN;
  const hex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    strToHash,
  );
  return hex.toUpperCase();
}

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
    // Platform.OS === 'web' has to round-trip through the Metro dev-server
    // proxy (see apps/mobile/metro.config.js) because browsers cannot set
    // the Origin/User-Agent headers Microsoft requires on the WebSocket.
    // Native platforms open the WebSocket directly with custom headers.
    // resolveEdgeTtsVoice() falls back to the default for any value not in
    // the supported catalog (e.g. the deprecated 'en-US-DavisNeural').
    const voice = resolveEdgeTtsVoice(options.voice);
    const rate = options.rate ?? 1.0;
    const audioBuffer =
      Platform.OS === 'web'
        ? await synthesizeEdgeTtsViaDevProxy(text, voice, rate)
        : await synthesizeEdgeTts(text, voice, rate);
    stopEdgeTts();

    if (Platform.OS === 'web') {
      return startWebPlayback(audioBuffer, options);
    }
    await ensureNativeAudioMode();
    return startNativePlayback(audioBuffer, options);
  } catch (error) {
    logEdgeTts('warn', 'speakEdgeTts failed', error);
    options.onError?.();
    return false;
  }
}

/**
 * Fetches Edge TTS audio via the dev-server middleware at POST /edge-tts.
 * Used on Expo Web where a direct WebSocket to Microsoft is blocked by
 * browser Origin restrictions.
 */
async function synthesizeEdgeTtsViaDevProxy(
  text: string,
  voice: string,
  rate: number,
): Promise<ArrayBuffer> {
  const response = await fetch('/edge-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, rate }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(
      `Edge TTS dev proxy returned ${response.status}: ${detail}. ` +
        'Make sure the Metro dev server is running (pnpm --filter @dotagents/mobile web).',
    );
  }
  return await response.arrayBuffer();
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

  const connectionId = generateUuidHex();
  const requestId = generateUuidHex();
  const timestamp = new Date().toISOString();

  // Required by Microsoft's consumer endpoint as of late 2024. Without the
  // Sec-MS-GEC token the server responds 403 Forbidden during the WebSocket
  // handshake.
  const secMsGec = await generateSecMsGec();
  const wsUrl =
    `${WSS_BASE_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}` +
    `&Sec-MS-GEC=${secMsGec}` +
    `&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}` +
    `&ConnectionId=${connectionId}`;

  const audioChunks: Uint8Array[] = [];

  await new Promise<void>((resolve, reject) => {
    // Microsoft also validates the WebSocket handshake `Origin` and
    // `User-Agent` headers against what the real Edge Read Aloud extension
    // sends. React Native's WebSocket accepts a third options argument for
    // custom headers, but the DOM `WebSocket` constructor type does not — we
    // cast so both platforms compile. Browsers forbid setting these headers,
    // so on web this call still goes out with the page's own Origin and will
    // be rejected until a same-origin proxy is set up (see `speakEdgeTts`).
    const wsOptions = {
      headers: {
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        Origin: WSS_FAKE_ORIGIN,
        'User-Agent': WSS_FAKE_USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    };
    const ws =
      Platform.OS === 'web'
        ? new WebSocket(wsUrl)
        : new (WebSocket as unknown as {
            new (url: string, protocols: string[] | undefined, opts: typeof wsOptions): WebSocket;
          })(wsUrl, undefined, wsOptions);

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

      // Edge TTS binary frames are framed as:
      //   [uint16 BE header length][header text][audio bytes]
      // The header text contains lines like "Path:audio\r\n" (no blank line
      // terminator); the audio data starts immediately after the header.
      if (buffer.length < 2) return;
      const headerLength = (buffer[0] << 8) | buffer[1];
      if (headerLength <= 0 || headerLength + 2 > buffer.length) return;
      const headerText = new TextDecoder().decode(buffer.subarray(2, 2 + headerLength));
      if (!headerText.includes('Path:audio')) return;
      const audioData = buffer.subarray(2 + headerLength);
      if (audioData.length > 0) audioChunks.push(audioData);
    };

    ws.onerror = (event) => {
      // Most browsers don't expose the underlying failure reason on the
      // `error` event (CORS, 403, DNS, etc). Log whatever we have and the
      // `close` handler will often follow up with a richer `code`/`reason`.
      logEdgeTts('warn', 'websocket onerror', event);
      reject(new Error('Edge TTS websocket failed'));
    };
    ws.onclose = (event) => {
      if (audioChunks.length === 0) {
        const code = (event as CloseEvent).code ?? 'unknown';
        const reasonText = (event as CloseEvent).reason || '(empty)';
        logEdgeTts('warn', `websocket closed with no audio (code=${code}, reason=${reasonText})`);
        reject(
          new Error(
            `Edge TTS websocket closed without audio (code=${code}, reason=${reasonText}). ` +
              'Microsoft likely rejected the handshake — check Sec-MS-GEC token or Origin/User-Agent headers.',
          ),
        );
      }
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


