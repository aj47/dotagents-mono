import { Platform } from 'react-native';
import {
  AudioPlayer,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';
import { File, Paths } from 'expo-file-system';

// Remote TTS client. Audio synthesis happens on the paired desktop's
// remote-server (POST /v1/tts/speak); this module only handles the HTTP
// round-trip and playback. Web browsers can't set the Origin/User-Agent
// headers Microsoft's Edge TTS endpoint requires, and mobile shouldn't need
// provider API keys locally, so going through the desktop is the one path
// that works on every platform without duplicating provider integrations.

// Edge voices the UI still surfaces. Validated here (rather than only on the
// desktop) so stale persisted values like 'en-US-DavisNeural' fall back
// gracefully without a server round-trip.
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

function summarizeRemoteTtsError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack?.split('\n').slice(0, 3).join(' | ') };
  }
  return { message: String(error) };
}

function summarizePlaybackStatus(status: unknown): Record<string, unknown> {
  const value = status as Record<string, unknown> | null;
  if (!value || typeof value !== 'object') return { statusType: typeof status };
  return {
    playing: value.playing,
    isBuffering: value.isBuffering,
    didJustFinish: value.didJustFinish,
    duration: value.duration,
    currentTime: value.currentTime,
    error: value.error,
  };
}

function safePlayerNumber(read: () => number): number | undefined {
  try {
    const value = read();
    return Number.isFinite(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function safePlayerBoolean(read: () => boolean): boolean | undefined {
  try {
    return read();
  } catch {
    return undefined;
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
  onStart?: () => void;
  onDone?: () => void;
  onError?: () => void;
  onStopped?: () => void;
};

type WebPlayback = {
  kind: 'web';
  audio: HTMLAudioElement;
  objectUrl: string;
  stopped: boolean;
  onStopped?: () => void;
};

type NativePlayback = {
  kind: 'native';
  player: AudioPlayer;
  file: File;
  subscription: { remove: () => void } | null;
  stopped: boolean;
  onStopped?: () => void;
};

const NATIVE_PLAYBACK_STARTUP_STALL_MS = 1800;
const NATIVE_PLAYBACK_STARTUP_FAIL_MS = 4200;
const NATIVE_PLAYBACK_ZERO_PROGRESS_STOP_RETRY_MS = 3600;

let currentPlayback: WebPlayback | NativePlayback | null = null;
let audioModeConfigured = false;
let playbackGeneration = 0;

export async function ensureNativeTtsAudioMode(): Promise<void> {
  if (audioModeConfigured || Platform.OS === 'web') return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });
    audioModeConfigured = true;
    logRemoteTts('info', 'native audio mode configured', { platform: Platform.OS });
  } catch (error) {
    logRemoteTts('warn', 'native audio mode configuration failed', summarizeRemoteTtsError(error));
    // Non-fatal: the audio will still play, but it may not survive backgrounding.
  }
}

export async function speakRemoteTts(text: string, options: RemoteSpeakOptions): Promise<boolean> {
  if (!text.trim()) return false;
  if (!options.baseUrl || !options.apiKey) {
    logRemoteTts('warn', 'missing baseUrl/apiKey; cannot reach paired desktop');
    options.onError?.();
    return false;
  }

  const requestGeneration = ++playbackGeneration;
  logRemoteTts('info', 'speakRemoteTts start', {
    generation: requestGeneration,
    platform: Platform.OS,
    providerId: options.providerId,
    voice: options.voice,
    model: options.model,
    rate: options.rate,
    textLength: text.length,
  });
  stopCurrentRemotePlayback(true);

  try {
    const { audio, mimeType } = await fetchRemoteTtsAudio(text, options);
    if (requestGeneration !== playbackGeneration) {
      options.onStopped?.();
      return false;
    }
    logRemoteTts('info', 'remote audio fetched', {
      generation: requestGeneration,
      mimeType,
      bytes: audio.byteLength,
    });
    if (Platform.OS === 'web') {
      return startWebPlayback(audio, mimeType, options);
    }
    await ensureNativeTtsAudioMode();
    if (requestGeneration !== playbackGeneration) {
      options.onStopped?.();
      return false;
    }
    return startNativePlayback(audio, mimeType, options);
  } catch (error) {
    if (requestGeneration !== playbackGeneration) {
      options.onStopped?.();
      return false;
    }
    logRemoteTts('warn', 'speakRemoteTts failed', summarizeRemoteTtsError(error));
    options.onError?.();
    return false;
  }
}

export async function fetchRemoteTtsAudio(
  text: string,
  options: RemoteSpeakOptions,
): Promise<{ audio: ArrayBuffer; mimeType: string }> {
  const base = options.baseUrl.replace(/\/+$/, '');
  const url = `${base}/tts/speak`;
  logRemoteTts('info', 'fetchRemoteTts request', {
    host: safeUrlHost(url),
    providerId: options.providerId,
    voice: options.voice,
    model: options.model,
    rate: options.rate,
    textLength: text.length,
  });
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
      Accept: 'audio/*',
    },
    body: JSON.stringify({
      text,
      providerId: options.providerId,
      voice: options.voice,
      model: options.model,
      speed: options.rate,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`Remote TTS returned ${response.status}: ${detail}`);
  }

  const mimeType = response.headers.get('content-type') || 'audio/mpeg';
  const audio = await response.arrayBuffer();
  logRemoteTts('info', 'fetchRemoteTts response', {
    status: response.status,
    mimeType,
    bytes: audio.byteLength,
    contentLength: response.headers.get('content-length'),
  });
  return { audio, mimeType };
}

function safeUrlHost(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return 'invalid-url';
  }
}

function startWebPlayback(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  options: RemoteSpeakOptions,
): boolean {
  const blob = new Blob([audioBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  const playback: WebPlayback = {
    kind: 'web',
    audio,
    objectUrl: url,
    stopped: false,
    onStopped: options.onStopped,
  };
  currentPlayback = playback;
  let hasStartedPlaying = false;
  let lastLoggedTimeUpdate = -1;

  const summarizeWebAudio = () => ({
    currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : null,
    duration: Number.isFinite(audio.duration) ? audio.duration : null,
    readyState: audio.readyState,
    networkState: audio.networkState,
    paused: audio.paused,
    ended: audio.ended,
    playbackRate: audio.playbackRate,
    errorCode: audio.error?.code ?? null,
    errorMessage: audio.error?.message ?? null,
  });

  const logWebAudioEvent = (event: string) => {
    logRemoteTts('info', `web playback ${event}`, summarizeWebAudio());
  };

  const markStarted = () => {
    if (hasStartedPlaying || playback.stopped) return;
    hasStartedPlaying = true;
    options.onStart?.();
  };

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

  audio.onplaying = markStarted;
  audio.onloadedmetadata = () => logWebAudioEvent('loadedmetadata');
  audio.oncanplay = () => logWebAudioEvent('canplay');
  audio.onplay = () => logWebAudioEvent('play');
  audio.onwaiting = () => logWebAudioEvent('waiting');
  audio.onstalled = () => logWebAudioEvent('stalled');
  audio.onsuspend = () => logWebAudioEvent('suspend');
  audio.ontimeupdate = () => {
    if (audio.currentTime - lastLoggedTimeUpdate < 0.25) return;
    lastLoggedTimeUpdate = audio.currentTime;
    logWebAudioEvent('timeupdate');
  };
  audio.onended = () => {
    logWebAudioEvent('ended');
    playback.stopped = true;
    cleanup();
    options.onDone?.();
  };
  audio.onerror = () => {
    logWebAudioEvent('error');
    playback.stopped = true;
    cleanup();
    options.onError?.();
  };
  audio.onpause = () => {
    logWebAudioEvent('pause');
    if (!audio.ended && !playback.stopped) {
      playback.stopped = true;
      cleanup();
      options.onStopped?.();
    }
  };

  void audio.play()
    .then(() => {
      logWebAudioEvent('play-resolved');
      markStarted();
    })
    .catch((error) => {
      logRemoteTts('warn', 'web playback play rejected', {
        ...summarizeWebAudio(),
        message: error instanceof Error ? error.message : String(error),
      });
      if (playback.stopped) return;
      playback.stopped = true;
      cleanup();
      options.onError?.();
    });
  return true;
}

function startNativePlayback(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  options: RemoteSpeakOptions,
): boolean {
  let file: File;
  try {
    file = writeRemoteTtsAudioFile(audioBuffer, mimeType);
  } catch (error) {
    logRemoteTts('warn', 'native playback file write failed', summarizeRemoteTtsError(error));
    options.onError?.();
    return false;
  }
  const filename = file.uri;

  let player: AudioPlayer;
  try {
    player = createAudioPlayer({ uri: file.uri });
    logRemoteTts('info', 'native playback player created', { filename });
  } catch (error) {
    logRemoteTts('warn', 'native playback player create failed', summarizeRemoteTtsError(error));
    try { file.delete(); } catch {}
    options.onError?.();
    return false;
  }

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
    onStopped: options.onStopped,
  };
  let hasStartedPlaying = false;
  let hasAdvancedPlayback = false;
  let hasLoggedFirstStatus = false;
  let startedAtMs: number | null = null;
  let transientStopRetries = 0;
  let startupReplayAttempts = 0;
  let startupStallTimer: ReturnType<typeof setTimeout> | null = null;
  let startupFailTimer: ReturnType<typeof setTimeout> | null = null;

  const clearStartupTimers = () => {
    if (startupStallTimer) {
      clearTimeout(startupStallTimer);
      startupStallTimer = null;
    }
    if (startupFailTimer) {
      clearTimeout(startupFailTimer);
      startupFailTimer = null;
    }
  };

  const finalize = (reason: 'done' | 'error' | 'stopped') => {
    clearStartupTimers();
    logRemoteTts(reason === 'error' ? 'warn' : 'info', 'native playback finalize', {
      reason,
      filename,
      started: hasStartedPlaying,
      advanced: hasAdvancedPlayback,
    });
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

  const scheduleStartupWatchdog = () => {
    if (startupStallTimer || startupFailTimer) return;
    startupStallTimer = setTimeout(() => {
      startupStallTimer = null;
      if (playback.stopped || hasAdvancedPlayback) return;
      const currentTime = safePlayerNumber(() => player.currentTime);
      const playing = safePlayerBoolean(() => player.playing);
      startupReplayAttempts += 1;
      logRemoteTts('warn', 'native playback startup stalled', {
        filename,
        playing,
        currentTime,
        attempt: startupReplayAttempts,
        elapsedSinceStartMs: startedAtMs ? Date.now() - startedAtMs : null,
      });
      try {
        void player.seekTo(0);
      } catch (error) {
        logRemoteTts('warn', 'native playback startup seek failed', summarizeRemoteTtsError(error));
      }
      try {
        player.play();
      } catch (error) {
        logRemoteTts('warn', 'native playback startup replay failed', summarizeRemoteTtsError(error));
      }
    }, NATIVE_PLAYBACK_STARTUP_STALL_MS);

    startupFailTimer = setTimeout(() => {
      startupFailTimer = null;
      if (playback.stopped || hasAdvancedPlayback) return;
      logRemoteTts('warn', 'native playback startup failed to advance', {
        filename,
        playing: safePlayerBoolean(() => player.playing),
        currentTime: safePlayerNumber(() => player.currentTime),
        duration: safePlayerNumber(() => player.duration),
        elapsedSinceStartMs: startedAtMs ? Date.now() - startedAtMs : null,
      });
      playback.stopped = true;
      finalize('error');
    }, NATIVE_PLAYBACK_STARTUP_FAIL_MS);
  };

  try {
    playback.subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (playback.stopped) return;
      const statusAny = status as Record<string, unknown>;
      if (!hasLoggedFirstStatus) {
        hasLoggedFirstStatus = true;
        logRemoteTts('info', 'native playback first status', summarizePlaybackStatus(status));
      }
      if (statusAny.error) {
        logRemoteTts('warn', 'native playback status error', summarizePlaybackStatus(status));
        playback.stopped = true;
        finalize('error');
        return;
      }
      if (status.playing) {
        if (!hasStartedPlaying) {
          hasStartedPlaying = true;
          startedAtMs = Date.now();
          logRemoteTts('info', 'native playback started', summarizePlaybackStatus(status));
          options.onStart?.();
          scheduleStartupWatchdog();
        }
        if (!hasAdvancedPlayback && status.currentTime > 0.25) {
          hasAdvancedPlayback = true;
          clearStartupTimers();
          logRemoteTts('info', 'native playback advanced', summarizePlaybackStatus(status));
        }
      }
      if (status.didJustFinish) {
        playback.stopped = true;
        finalize('done');
        return;
      }
      if (hasStartedPlaying && !status.playing && !status.isBuffering) {
        const reachedEnd = status.duration > 0 && status.currentTime >= Math.max(0, status.duration - 0.25);
        const elapsedSinceStartMs = startedAtMs ? Date.now() - startedAtMs : null;
        const stoppedAtStart = status.currentTime <= 0.25 && !reachedEnd;
        const stillWithinStartupRetryWindow =
          !hasAdvancedPlayback
          && stoppedAtStart
          && (elapsedSinceStartMs === null || elapsedSinceStartMs < NATIVE_PLAYBACK_ZERO_PROGRESS_STOP_RETRY_MS);
        if (
          stoppedAtStart
          && transientStopRetries < 2
          && (elapsedSinceStartMs === null || elapsedSinceStartMs < 1500)
        ) {
          transientStopRetries += 1;
          logRemoteTts('info', 'native playback transient stop ignored', {
            ...summarizePlaybackStatus(status),
            elapsedSinceStartMs,
            retry: transientStopRetries,
          });
          try {
            player.play();
          } catch (error) {
            logRemoteTts('warn', 'native playback transient resume failed', summarizeRemoteTtsError(error));
          }
          return;
        }
        if (stillWithinStartupRetryWindow) {
          startupReplayAttempts += 1;
          logRemoteTts('warn', 'native playback zero-progress stop ignored while startup watchdog is active', {
            ...summarizePlaybackStatus(status),
            elapsedSinceStartMs,
            attempt: startupReplayAttempts,
          });
          try {
            player.play();
          } catch (error) {
            logRemoteTts('warn', 'native playback zero-progress resume failed', summarizeRemoteTtsError(error));
          }
          return;
        }
        playback.stopped = true;
        logRemoteTts('info', 'native playback stopped status', {
          ...summarizePlaybackStatus(status),
          reachedEnd,
          elapsedSinceStartMs,
        });
        finalize(reachedEnd ? 'done' : 'stopped');
      }
    });
  } catch (error) {
    logRemoteTts('warn', 'native playback status listener failed', summarizeRemoteTtsError(error));
    // If we can't subscribe to status updates, cleanup will still happen on stopRemoteTts().
  }

  currentPlayback = playback;
  try {
    logRemoteTts('info', 'native playback play invoked', { filename });
    player.play();
  } catch (error) {
    logRemoteTts('warn', 'native playback play threw', summarizeRemoteTtsError(error));
    playback.stopped = true;
    finalize('error');
    return false;
  }
  return true;
}

export function writeRemoteTtsAudioFile(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  prefix = 'remote-tts',
): File {
  const ext = mimeTypeToExtension(mimeType);
  const filename = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
  const file = new File(Paths.cache, filename);
  logRemoteTts('info', 'native playback preparing file', {
    filename,
    mimeType,
    ext,
    bytes: audioBuffer.byteLength,
  });
  try {
    file.create({ overwrite: true });
  } catch (error) {
    logRemoteTts('warn', 'native playback file create failed; continuing', summarizeRemoteTtsError(error));
    // File may already exist as a fresh handle; write() will still succeed.
  }
  file.write(new Uint8Array(audioBuffer));
  return file;
}

export function stopRemoteTts(): void {
  playbackGeneration += 1;
  stopCurrentRemotePlayback(true);
}

function stopCurrentRemotePlayback(notifyStopped: boolean): void {
  const playback = currentPlayback;
  if (!playback) return;
  currentPlayback = null;
  const shouldNotifyStopped = notifyStopped && !playback.stopped;
  playback.stopped = true;
  logRemoteTts('info', 'stop current playback', {
    kind: playback.kind,
    notifyStopped,
    shouldNotifyStopped,
  });

  if (playback.kind === 'web') {
    try { playback.audio.pause(); } catch {}
    try { playback.audio.currentTime = 0; } catch {}
    try { URL.revokeObjectURL(playback.objectUrl); } catch {}
    if (shouldNotifyStopped) playback.onStopped?.();
    return;
  }

  try { playback.subscription?.remove(); } catch {}
  try { playback.player.pause(); } catch {}
  try { playback.player.remove(); } catch {}
  try { playback.file.delete(); } catch {}
  if (shouldNotifyStopped) playback.onStopped?.();
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
