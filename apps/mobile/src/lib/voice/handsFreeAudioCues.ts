import { Platform } from 'react-native';
import {
  AudioPlayer,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';
import { File, Paths } from 'expo-file-system';

export type HandsFreeAudioCue =
  | 'enabled'
  | 'disabled'
  | 'session-ready'
  | 'prompt-submitted'
  | 'tool-called'
  | 'agent-response'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'stopped'
  | 'paused'
  | 'sleeping'
  | 'error';

type CueTone = {
  frequency: number;
  durationMs: number;
  gain?: number;
};

const SAMPLE_RATE = 22_050;
const MAX_CUE_MS = 900;
const CUE_MIN_INTERVAL_MS = 250;
const CUE_GAIN = 0.18;
const CUE_DEFINITIONS: Record<HandsFreeAudioCue, CueTone[]> = {
  enabled: [
    { frequency: 660, durationMs: 70 },
    { frequency: 0, durationMs: 28 },
    { frequency: 880, durationMs: 90 },
  ],
  disabled: [
    { frequency: 560, durationMs: 80 },
    { frequency: 0, durationMs: 30 },
    { frequency: 330, durationMs: 110 },
  ],
  'session-ready': [
    { frequency: 660, durationMs: 55 },
    { frequency: 0, durationMs: 24 },
    { frequency: 880, durationMs: 55 },
    { frequency: 0, durationMs: 24 },
    { frequency: 1_100, durationMs: 80, gain: 0.14 },
  ],
  'prompt-submitted': [
    { frequency: 880, durationMs: 110, gain: 0.38 },
    { frequency: 0, durationMs: 45 },
    { frequency: 1_240, durationMs: 150, gain: 0.42 },
    { frequency: 0, durationMs: 40 },
    { frequency: 1_560, durationMs: 190, gain: 0.36 },
  ],
  'tool-called': [
    { frequency: 520, durationMs: 42 },
    { frequency: 0, durationMs: 36 },
    { frequency: 740, durationMs: 42 },
    { frequency: 0, durationMs: 36 },
    { frequency: 520, durationMs: 42 },
  ],
  'agent-response': [
    { frequency: 1_120, durationMs: 45, gain: 0.14 },
    { frequency: 0, durationMs: 20 },
    { frequency: 1_320, durationMs: 65, gain: 0.14 },
  ],
  listening: [
    { frequency: 740, durationMs: 55 },
    { frequency: 0, durationMs: 22 },
    { frequency: 980, durationMs: 70 },
  ],
  processing: [
    { frequency: 520, durationMs: 48 },
    { frequency: 0, durationMs: 40 },
    { frequency: 520, durationMs: 48 },
  ],
  speaking: [
    { frequency: 1_080, durationMs: 80, gain: 0.14 },
  ],
  stopped: [
    { frequency: 980, durationMs: 45 },
    { frequency: 0, durationMs: 24 },
    { frequency: 520, durationMs: 95 },
  ],
  paused: [
    { frequency: 440, durationMs: 120 },
  ],
  sleeping: [
    { frequency: 620, durationMs: 65 },
    { frequency: 0, durationMs: 28 },
    { frequency: 360, durationMs: 115 },
  ],
  error: [
    { frequency: 220, durationMs: 70 },
    { frequency: 0, durationMs: 35 },
    { frequency: 220, durationMs: 70 },
    { frequency: 0, durationMs: 35 },
    { frequency: 220, durationMs: 110 },
  ],
};

type NativeCuePlayback = {
  player: AudioPlayer;
  subscription: { remove: () => void } | null;
  timeout: ReturnType<typeof setTimeout>;
};

const cueFiles = new Map<HandsFreeAudioCue, File>();
const activeNativeCuePlaybacks = new Set<NativeCuePlayback>();
const lastCuePlayedAt = new Map<HandsFreeAudioCue, number>();
let audioModeConfigured = false;

export function playHandsFreeAudioCue(cue: HandsFreeAudioCue): void {
  const now = Date.now();
  const lastPlayedAt = lastCuePlayedAt.get(cue) ?? 0;
  if (now - lastPlayedAt < CUE_MIN_INTERVAL_MS) {
    return;
  }
  lastCuePlayedAt.set(cue, now);

  if (Platform.OS === 'web') {
    playWebCue(cue);
    return;
  }

  void playNativeCue(cue);
}

async function ensureCueAudioMode(): Promise<void> {
  if (audioModeConfigured) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });
    audioModeConfigured = true;
  } catch {
    // Cues are best-effort; hands-free mode must keep working without them.
  }
}

async function playNativeCue(cue: HandsFreeAudioCue): Promise<void> {
  try {
    await ensureCueAudioMode();
    const file = ensureCueFile(cue);
    const player = createAudioPlayer({ uri: file.uri });
    const playback: NativeCuePlayback = {
      player,
      subscription: null,
      timeout: setTimeout(() => cleanupNativeCuePlayback(playback), MAX_CUE_MS),
    };

    playback.subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        cleanupNativeCuePlayback(playback);
      }
    });
    activeNativeCuePlaybacks.add(playback);
    player.play();
  } catch {
    // Audio cues are non-critical and should never break voice control.
  }
}

function cleanupNativeCuePlayback(playback: NativeCuePlayback): void {
  if (!activeNativeCuePlaybacks.delete(playback)) {
    return;
  }
  clearTimeout(playback.timeout);
  try { playback.subscription?.remove(); } catch {}
  try { playback.player.remove(); } catch {}
}

function ensureCueFile(cue: HandsFreeAudioCue): File {
  const cached = cueFiles.get(cue);
  if (cached) return cached;

  const file = new File(Paths.cache, `handsfree-cue-${cue}.wav`);
  try {
    file.create({ overwrite: true });
  } catch {
    // Existing cache file is fine; write() below refreshes it.
  }
  file.write(createWavFile(CUE_DEFINITIONS[cue]));
  cueFiles.set(cue, file);
  return file;
}

function playWebCue(cue: HandsFreeAudioCue): void {
  try {
    const host = globalThis as any;
    const AudioContextCtor = host.AudioContext || host.webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    let cursor = context.currentTime;

    for (const tone of CUE_DEFINITIONS[cue]) {
      const duration = Math.max(0, tone.durationMs) / 1_000;
      if (tone.frequency <= 0) {
        cursor += duration;
        continue;
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = tone.frequency;
      gain.gain.setValueAtTime(0, cursor);
      gain.gain.linearRampToValueAtTime(tone.gain ?? CUE_GAIN, cursor + 0.01);
      gain.gain.setValueAtTime(tone.gain ?? CUE_GAIN, Math.max(cursor, cursor + duration - 0.02));
      gain.gain.linearRampToValueAtTime(0, cursor + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(cursor);
      oscillator.stop(cursor + duration);
      cursor += duration;
    }

    setTimeout(() => {
      void context.close?.();
    }, MAX_CUE_MS);
  } catch {
    // Best-effort only.
  }
}

function createWavFile(tones: CueTone[]): Uint8Array {
  const sampleCount = tones.reduce(
    (total, tone) => total + Math.max(1, Math.round((tone.durationMs / 1_000) * SAMPLE_RATE)),
    0,
  );
  const bytesPerSample = 2;
  const headerBytes = 44;
  const dataBytes = sampleCount * bytesPerSample;
  const output = new Uint8Array(headerBytes + dataBytes);
  const view = new DataView(output.buffer);

  writeAscii(output, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(output, 8, 'WAVE');
  writeAscii(output, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(output, 36, 'data');
  view.setUint32(40, dataBytes, true);

  let sampleOffset = 0;
  for (const tone of tones) {
    const toneSamples = Math.max(1, Math.round((tone.durationMs / 1_000) * SAMPLE_RATE));
    const rampSamples = Math.max(1, Math.round(SAMPLE_RATE * 0.008));
    const amplitude = 32_767 * (tone.gain ?? CUE_GAIN);

    for (let i = 0; i < toneSamples; i += 1) {
      const envelope = tone.frequency <= 0
        ? 0
        : Math.min(1, i / rampSamples, (toneSamples - i - 1) / rampSamples);
      const value = tone.frequency <= 0
        ? 0
        : Math.sin((2 * Math.PI * tone.frequency * i) / SAMPLE_RATE) * amplitude * envelope;
      view.setInt16(headerBytes + (sampleOffset * bytesPerSample), Math.round(value), true);
      sampleOffset += 1;
    }
  }

  return output;
}

function writeAscii(output: Uint8Array, offset: number, text: string): void {
  for (let i = 0; i < text.length; i += 1) {
    output[offset + i] = text.charCodeAt(i);
  }
}
