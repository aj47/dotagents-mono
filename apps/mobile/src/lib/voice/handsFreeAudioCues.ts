import { Platform } from 'react-native';
import {
  AudioPlayer,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { playAndroidHandsFreeCue } from './androidHandsFreeService';

export type HandsFreeAudioCue =
  | 'enabled'
  | 'disabled'
  | 'session-ready'
  | 'preview-submitted'
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
  harmonicGain?: number;
};

// 24 kHz mono PCM keeps the short cues crisp on small speakers while keeping
// each generated file comfortably below the size of a typical bundled asset.
const SAMPLE_RATE = 24_000;
const MAX_CUE_MS = 900;
const CUE_MIN_INTERVAL_MS = 250;
const CUE_GAIN = 0.12;
const CUE_HARMONIC_GAIN = 0.055;
const CUE_DECAY_LEVEL = 0.76;

// A small pentatonic palette stays consonant across every cue and avoids the
// sharp, unresolved feeling of semitone-heavy notification sounds.
const NOTE = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392.00,
  A4: 440.00,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880.00,
} as const;

const CUE_DEFINITIONS: Record<HandsFreeAudioCue, CueTone[]> = {
  enabled: [
    { frequency: NOTE.C5, durationMs: 94, gain: 0.11 },
    { frequency: 0, durationMs: 24 },
    { frequency: NOTE.E5, durationMs: 136, gain: 0.10 },
  ],
  disabled: [
    { frequency: NOTE.E5, durationMs: 82, gain: 0.10 },
    { frequency: 0, durationMs: 28 },
    { frequency: NOTE.C5, durationMs: 148, gain: 0.085 },
  ],
  'session-ready': [
    { frequency: NOTE.G4, durationMs: 78, gain: 0.10 },
    { frequency: 0, durationMs: 20 },
    { frequency: NOTE.C5, durationMs: 88, gain: 0.105 },
    { frequency: 0, durationMs: 20 },
    { frequency: NOTE.E5, durationMs: 146, gain: 0.095 },
  ],
  'preview-submitted': [
    { frequency: NOTE.C5, durationMs: 82, gain: 0.10 },
    { frequency: 0, durationMs: 18 },
    { frequency: NOTE.D5, durationMs: 102, gain: 0.105 },
    { frequency: 0, durationMs: 18 },
    { frequency: NOTE.G5, durationMs: 154, gain: 0.09 },
  ],
  'prompt-submitted': [
    { frequency: NOTE.C5, durationMs: 88, gain: 0.10 },
    { frequency: 0, durationMs: 20 },
    { frequency: NOTE.E5, durationMs: 118, gain: 0.105 },
    { frequency: 0, durationMs: 18 },
    { frequency: NOTE.A5, durationMs: 168, gain: 0.085 },
  ],
  'tool-called': [
    { frequency: NOTE.A4, durationMs: 58, gain: 0.09 },
    { frequency: 0, durationMs: 26 },
    { frequency: NOTE.C5, durationMs: 64, gain: 0.095 },
    { frequency: 0, durationMs: 26 },
    { frequency: NOTE.A4, durationMs: 84, gain: 0.08 },
  ],
  'agent-response': [
    { frequency: NOTE.G4, durationMs: 72, gain: 0.09 },
    { frequency: 0, durationMs: 20 },
    { frequency: NOTE.C5, durationMs: 112, gain: 0.09 },
  ],
  listening: [
    { frequency: NOTE.C5, durationMs: 92, gain: 0.10 },
    { frequency: 0, durationMs: 22 },
    { frequency: NOTE.G5, durationMs: 138, gain: 0.095 },
  ],
  processing: [
    { frequency: NOTE.D4, durationMs: 68, gain: 0.08 },
    { frequency: 0, durationMs: 36 },
    { frequency: NOTE.D4, durationMs: 88, gain: 0.075 },
  ],
  speaking: [
    { frequency: NOTE.E5, durationMs: 118, gain: 0.09 },
  ],
  stopped: [
    { frequency: NOTE.G5, durationMs: 70, gain: 0.095 },
    { frequency: 0, durationMs: 24 },
    { frequency: NOTE.C5, durationMs: 134, gain: 0.085 },
  ],
  paused: [
    { frequency: NOTE.D4, durationMs: 156, gain: 0.075 },
  ],
  sleeping: [
    { frequency: NOTE.E4, durationMs: 86, gain: 0.08 },
    { frequency: 0, durationMs: 26 },
    { frequency: NOTE.C4, durationMs: 168, gain: 0.07 },
  ],
  error: [
    { frequency: NOTE.D4, durationMs: 62, gain: 0.085 },
    { frequency: 0, durationMs: 32 },
    { frequency: NOTE.D4, durationMs: 62, gain: 0.08 },
    { frequency: 0, durationMs: 32 },
    { frequency: NOTE.C4, durationMs: 98, gain: 0.075 },
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
let androidServiceCueRoutingEnabled = false;

// When the Android hands-free foreground service is active, the JS-side
// expo-audio playback path becomes unreliable: the JS thread may be throttled
// while the app is backgrounded, and the service's audio routing for capture
// can pre-empt cue playback. Routing through the service makes cue playback
// run inside the foreground service via Android MediaPlayer, which is what
// keeps foreground and background hands-free audibly consistent.
export function setAndroidHandsFreeCueRoutingEnabled(enabled: boolean): void {
  androidServiceCueRoutingEnabled = enabled && Platform.OS === 'android';
}

export function isAndroidHandsFreeCueRoutingEnabled(): boolean {
  return androidServiceCueRoutingEnabled;
}

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

    if (androidServiceCueRoutingEnabled) {
      const routed = await playAndroidHandsFreeCue({ cueId: cue, filePath: file.uri })
        .catch(() => false);
      if (routed) return;
      // Service was unavailable (not running, or method missing on older
      // builds); fall through to the expo-audio path.
    }

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
      const harmonicOscillator = context.createOscillator();
      const harmonicGain = context.createGain();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = tone.frequency;
      harmonicOscillator.type = 'sine';
      harmonicOscillator.frequency.value = tone.frequency * 2;
      harmonicGain.gain.value = tone.harmonicGain ?? CUE_HARMONIC_GAIN;
      gain.gain.setValueAtTime(0, cursor);
      gain.gain.linearRampToValueAtTime(tone.gain ?? CUE_GAIN, cursor + Math.min(0.016, duration / 3));
      gain.gain.linearRampToValueAtTime(
        (tone.gain ?? CUE_GAIN) * CUE_DECAY_LEVEL,
        Math.max(cursor, cursor + duration - 0.04),
      );
      gain.gain.linearRampToValueAtTime(0, cursor + duration);
      oscillator.connect(gain);
      harmonicOscillator.connect(harmonicGain);
      harmonicGain.connect(gain);
      gain.connect(context.destination);
      oscillator.start(cursor);
      oscillator.stop(cursor + duration);
      harmonicOscillator.start(cursor);
      harmonicOscillator.stop(cursor + duration);
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
    const attackSamples = Math.max(1, Math.round(SAMPLE_RATE * 0.016));
    const releaseSamples = Math.max(1, Math.round(SAMPLE_RATE * 0.04));
    const amplitude = 32_767 * (tone.gain ?? CUE_GAIN);
    const harmonicGain = tone.harmonicGain ?? CUE_HARMONIC_GAIN;

    for (let i = 0; i < toneSamples; i += 1) {
      const attack = Math.min(1, i / attackSamples);
      const release = Math.min(1, (toneSamples - i - 1) / releaseSamples);
      const envelope = tone.frequency <= 0 ? 0 : smoothstep(Math.min(attack, release));
      const progress = toneSamples <= 1 ? 1 : i / (toneSamples - 1);
      const decay = CUE_DECAY_LEVEL + ((1 - CUE_DECAY_LEVEL) * Math.exp(-3 * progress));
      const value = tone.frequency <= 0
        ? 0
        : (
          Math.sin((2 * Math.PI * tone.frequency * i) / SAMPLE_RATE)
          + Math.sin((4 * Math.PI * tone.frequency * i) / SAMPLE_RATE) * harmonicGain
        ) * amplitude * envelope * decay;
      view.setInt16(headerBytes + (sampleOffset * bytesPerSample), Math.round(value), true);
      sampleOffset += 1;
    }
  }

  return output;
}

function smoothstep(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - (2 * clamped));
}

function writeAscii(output: Uint8Array, offset: number, text: string): void {
  for (let i = 0; i < text.length; i += 1) {
    output[offset + i] = text.charCodeAt(i);
  }
}
