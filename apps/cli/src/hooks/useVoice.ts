/**
 * useVoice — Voice integration hook for CLI
 *
 * Provides:
 * - STT: Record from microphone and transcribe via cloud (OpenAI/Groq) or local (Parakeet)
 * - TTS: Synthesize and play speech via cloud (OpenAI/Groq) or local (Supertonic/Kitten)
 * - Continuous voice mode: alternating listen → transcribe → respond → speak cycles
 *
 * Microphone recording uses `sox` (SoX) via `rec` command.
 * Audio playback uses `afplay` (macOS) / `aplay` (Linux) / `ffplay` (fallback).
 */

import { useState, useCallback, useRef } from 'react';
import { configStore } from '@dotagents/core';
import type { Config } from '@dotagents/core';
import {
  DEFAULT_STT_MODELS,
  getConfiguredSttModel,
} from '@dotagents/shared';

// ── Types ────────────────────────────────────────────────────────────

export type VoiceStatus =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'synthesizing'
  | 'playing'
  | 'error';

export interface VoiceState {
  /** Current voice subsystem status */
  status: VoiceStatus;
  /** Last error message, if any */
  error: string | null;
  /** Whether continuous voice mode is active */
  continuousMode: boolean;
  /** Number of completed voice turns in current continuous session */
  turnCount: number;
  /** Last transcribed text from STT */
  lastTranscript: string | null;
}

export interface UseVoiceReturn {
  state: VoiceState;
  /** Start a single STT recording → returns transcribed text */
  startRecording: () => Promise<string | null>;
  /** Stop the current recording (for manual stop) */
  stopRecording: () => void;
  /** Synthesize and play text via TTS */
  speak: (text: string) => Promise<void>;
  /** Stop any currently playing audio */
  stopPlayback: () => void;
  /** Start continuous voice mode */
  startContinuousMode: (onTranscript: (text: string) => void) => void;
  /** Stop continuous voice mode */
  stopContinuousMode: () => void;
  /** Increment turn count (called after agent responds in continuous mode) */
  completeTurn: () => void;
}

// ── Audio utilities (child_process based) ────────────────────────────

type ChildProcess = import('child_process').ChildProcess;

/** Record audio from microphone using sox `rec` command, returns WAV buffer */
export async function recordAudio(
  durationSeconds: number,
  abortSignal?: { aborted: boolean },
): Promise<Buffer> {
  const { spawn } = await import('child_process');
  const { join } = await import('path');
  const { tmpdir } = await import('os');
  const { randomUUID } = await import('crypto');
  const fs = await import('fs');

  const tmpFile = join(tmpdir(), `dotagents-rec-${randomUUID()}.wav`);

  return new Promise<Buffer>((resolve, reject) => {
    // sox rec command: record mono 16-bit 16kHz WAV
    const proc = spawn('rec', [
      '-q',            // quiet
      '-r', '16000',   // sample rate 16kHz
      '-c', '1',       // mono
      '-b', '16',      // 16 bit
      tmpFile,         // output file
      'trim', '0', String(durationSeconds), // max duration
    ], { stdio: 'pipe' });

    let finished = false;
    const cleanup = () => {
      if (!finished) {
        finished = true;
        try { proc.kill('SIGTERM'); } catch { /* ignore */ }
      }
    };

    // Check abort signal periodically
    if (abortSignal) {
      const interval = setInterval(() => {
        if (abortSignal.aborted) {
          clearInterval(interval);
          cleanup();
        }
      }, 200);
      proc.on('close', () => clearInterval(interval));
    }

    proc.on('close', (code) => {
      finished = true;
      try {
        if (fs.existsSync(tmpFile)) {
          const buf = fs.readFileSync(tmpFile);
          fs.unlinkSync(tmpFile);
          resolve(buf);
        } else {
          reject(new Error(`Recording failed: output file not created (exit code ${code})`));
        }
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });

    proc.on('error', (err) => {
      finished = true;
      if (err.message.includes('ENOENT')) {
        reject(new Error(
          'sox (rec) not found. Install SoX for microphone recording:\n' +
          '  macOS:  brew install sox\n' +
          '  Linux:  apt install sox libsox-fmt-all',
        ));
      } else {
        reject(err);
      }
    });
  });
}

/** Play audio buffer via system command. Returns a handle to stop playback. */
export async function playAudio(
  audioBuffer: Buffer,
  mimeType: string,
): Promise<{ proc: ChildProcess; wait: Promise<void> }> {
  const { spawn } = await import('child_process');
  const { join } = await import('path');
  const { tmpdir } = await import('os');
  const { randomUUID } = await import('crypto');
  const fs = await import('fs');

  const ext = mimeType.includes('wav') ? 'wav' : mimeType.includes('mp3') || mimeType.includes('mpeg') ? 'mp3' : 'wav';
  const tmpFile = join(tmpdir(), `dotagents-tts-${randomUUID()}.${ext}`);

  fs.writeFileSync(tmpFile, audioBuffer);

  const platform = process.platform;
  let cmd: string;
  let args: string[];

  if (platform === 'darwin') {
    cmd = 'afplay';
    args = [tmpFile];
  } else if (platform === 'linux') {
    cmd = 'aplay';
    args = [tmpFile];
  } else {
    // Fallback to ffplay (cross-platform)
    cmd = 'ffplay';
    args = ['-nodisp', '-autoexit', tmpFile];
  }

  const proc = spawn(cmd, args, { stdio: 'pipe' });

  const wait = new Promise<void>((resolve, reject) => {
    proc.on('close', () => {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
      resolve();
    });
    proc.on('error', (err) => {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
      if (err.message.includes('ENOENT')) {
        reject(new Error(
          `Audio player (${cmd}) not found. Install an audio player:\n` +
          '  macOS: afplay is built-in\n' +
          '  Linux: apt install alsa-utils (aplay)',
        ));
      } else {
        reject(err);
      }
    });
  });

  return { proc, wait };
}

/** Convert Float32Array samples to WAV buffer */
export function float32ToWav(samples: Float32Array, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const headerSize = 44;

  const buffer = Buffer.alloc(headerSize + dataSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(36 + dataSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt subchunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;
  buffer.writeUInt16LE(1, offset); offset += 2;  // PCM
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;

  // data subchunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  // Write PCM samples (float32 → int16)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.round(val), offset);
    offset += 2;
  }

  return buffer;
}

// ── Cloud STT transcription ──────────────────────────────────────────

/** Transcribe audio via cloud API (OpenAI or Groq Whisper) */
export async function cloudTranscribe(
  audioBuffer: Buffer,
  config: Config,
): Promise<string> {
  const providerId = config.sttProviderId ?? 'openai';
  const model = getConfiguredSttModel(config) || DEFAULT_STT_MODELS.openai;

  let apiKey: string | undefined;
  let baseUrl: string;

  if (providerId === 'groq') {
    apiKey = config.groqApiKey;
    baseUrl = config.groqBaseUrl || 'https://api.groq.com/openai/v1';
  } else {
    apiKey = config.openaiApiKey;
    baseUrl = config.openaiBaseUrl || 'https://api.openai.com/v1';
  }

  if (!apiKey) {
    throw new Error(
      `API key not configured for STT provider "${providerId}". ` +
      'Set it in /settings → Providers.',
    );
  }

  // Build multipart form data using Node.js globals (Node 18+)
  const form = new FormData();
  form.append(
    'file',
    new File([audioBuffer], 'recording.wav', { type: 'audio/wav' }),
  );
  form.append('model', model);

  const response = await fetch(`${baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: form as any,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`STT API error (${providerId}): ${response.statusText} — ${errorText}`);
  }

  const result = (await response.json()) as { text?: string };
  return result.text?.trim() ?? '';
}

// ── Cloud TTS synthesis ──────────────────────────────────────────────

/** Synthesize speech via cloud API (OpenAI or Groq) */
export async function cloudSynthesize(
  text: string,
  config: Config,
): Promise<{ audio: Buffer; mimeType: string }> {
  const providerId = config.ttsProviderId ?? 'openai';

  let apiKey: string | undefined;
  let baseUrl: string;
  let model: string;
  let voice: string;

  if (providerId === 'groq') {
    apiKey = config.groqApiKey;
    baseUrl = config.groqBaseUrl || 'https://api.groq.com/openai/v1';
    model = config.groqTtsModel || 'canopylabs/orpheus-v1-english';
    voice = config.groqTtsVoice || 'troy';
  } else {
    apiKey = config.openaiApiKey;
    baseUrl = config.openaiBaseUrl || 'https://api.openai.com/v1';
    model = config.openaiTtsModel || 'gpt-4o-mini-tts';
    voice = config.openaiTtsVoice || 'alloy';
  }

  if (!apiKey) {
    throw new Error(
      `API key not configured for TTS provider "${providerId}". ` +
      'Set it in /settings → Providers.',
    );
  }

  const requestBody: Record<string, unknown> = {
    model,
    input: text,
    voice,
    response_format: providerId === 'groq' ? 'wav' : 'mp3',
  };

  if (providerId === 'openai') {
    const speed = config.openaiTtsSpeed ?? 1.0;
    requestBody.speed = speed;
  }

  const response = await fetch(`${baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS API error (${providerId}): ${response.statusText} — ${errorText}`);
  }

  const arrayBuf = await response.arrayBuffer();
  const mimeType = providerId === 'groq' ? 'audio/wav' : 'audio/mpeg';

  return { audio: Buffer.from(arrayBuf), mimeType };
}

// ── Local STT (Parakeet) ─────────────────────────────────────────────

/** Transcribe audio locally via Parakeet (sherpa-onnx) */
export async function localTranscribe(audioBuffer: Buffer): Promise<string> {
  const {
    isParakeetModelReady,
    initializeRecognizer,
    transcribe,
  } = await import('@dotagents/core');

  if (!isParakeetModelReady()) {
    throw new Error(
      'Parakeet model not downloaded. Download it from /settings or switch to a cloud STT provider.',
    );
  }

  await initializeRecognizer();

  // Parakeet expects float32 PCM. Parse WAV header to get raw PCM samples.
  const pcm = wavToFloat32(audioBuffer);
  const text = await transcribe(pcm.buffer as ArrayBuffer, 16000);
  return text.trim();
}

/** Extract float32 PCM data from a WAV buffer */
export function wavToFloat32(wavBuffer: Buffer): Float32Array {
  // Find the 'data' chunk
  let dataOffset = 44; // standard WAV header
  const headerStr = wavBuffer.toString('ascii', 0, 4);
  if (headerStr === 'RIFF') {
    // Search for 'data' chunk marker
    for (let i = 12; i < wavBuffer.length - 8; i++) {
      if (wavBuffer.toString('ascii', i, i + 4) === 'data') {
        dataOffset = i + 8; // skip 'data' + chunk size (4 bytes)
        break;
      }
    }
  }

  const bitsPerSample = wavBuffer.readUInt16LE(34);
  const numSamples = (wavBuffer.length - dataOffset) / (bitsPerSample / 8);
  const samples = new Float32Array(numSamples);

  if (bitsPerSample === 16) {
    for (let i = 0; i < numSamples; i++) {
      const val = wavBuffer.readInt16LE(dataOffset + i * 2);
      samples[i] = val / 32768;
    }
  } else if (bitsPerSample === 32) {
    for (let i = 0; i < numSamples; i++) {
      samples[i] = wavBuffer.readFloatLE(dataOffset + i * 4);
    }
  }

  return samples;
}

// ── Local TTS (Supertonic / Kitten) ──────────────────────────────────

/** Synthesize speech locally via Supertonic or Kitten */
export async function localSynthesize(
  text: string,
  config: Config,
): Promise<{ audio: Buffer; mimeType: string }> {
  const providerId = config.ttsProviderId ?? 'supertonic';

  if (providerId === 'kitten') {
    const { kittenSynthesize } = await import('@dotagents/core');
    const voiceId = config.kittenVoiceId ?? 0;
    const speed = config.kittenSpeed ?? 1.0;
    const result = await kittenSynthesize(text, voiceId, speed);
    const wav = float32ToWav(result.samples, result.sampleRate);
    return { audio: wav, mimeType: 'audio/wav' };
  }

  // Default: Supertonic
  const { supertonicSynthesize } = await import('@dotagents/core');
  const voice = config.supertonicVoice ?? 'M1';
  const lang = config.supertonicLanguage ?? 'en';
  const speed = config.supertonicSpeed ?? 1.05;
  const result = await supertonicSynthesize(text, voice, lang, speed);
  const wav = float32ToWav(result.samples, result.sampleRate);
  return { audio: wav, mimeType: 'audio/wav' };
}

// ── Main hook ────────────────────────────────────────────────────────

const RECORDING_DURATION_SECONDS = 10;

export function useVoice(): UseVoiceReturn {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);

  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });
  const playbackRef = useRef<ChildProcess | null>(null);
  const continuousModeRef = useRef(false);
  const onTranscriptRef = useRef<((text: string) => void) | null>(null);

  /**
   * Perform STT: record from mic and transcribe.
   * Returns the transcribed text or null on failure.
   */
  const startRecording = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      setStatus('recording');
      abortRef.current = { aborted: false };

      const audioBuffer = await recordAudio(RECORDING_DURATION_SECONDS, abortRef.current);

      if (abortRef.current.aborted) {
        setStatus('idle');
        return null;
      }

      setStatus('transcribing');

      const config = configStore.get();
      const providerId = config.sttProviderId ?? 'openai';
      let transcript: string;

      if (providerId === 'parakeet') {
        transcript = await localTranscribe(audioBuffer);
      } else {
        transcript = await cloudTranscribe(audioBuffer, config);
      }

      setLastTranscript(transcript);
      setStatus('idle');
      return transcript;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus('error');
      return null;
    }
  }, []);

  /** Stop the current recording */
  const stopRecording = useCallback(() => {
    abortRef.current.aborted = true;
  }, []);

  /**
   * Perform TTS: synthesize text to speech and play it.
   */
  const speak = useCallback(async (text: string): Promise<void> => {
    try {
      setError(null);
      setStatus('synthesizing');

      const config = configStore.get();
      const providerId = config.ttsProviderId ?? 'openai';

      let audio: Buffer;
      let mimeType: string;

      if (providerId === 'supertonic' || providerId === 'kitten') {
        const result = await localSynthesize(text, config);
        audio = result.audio;
        mimeType = result.mimeType;
      } else {
        const result = await cloudSynthesize(text, config);
        audio = result.audio;
        mimeType = result.mimeType;
      }

      setStatus('playing');
      const { proc, wait } = await playAudio(audio, mimeType);
      playbackRef.current = proc;

      await wait;
      playbackRef.current = null;
      setStatus('idle');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus('error');
      playbackRef.current = null;
    }
  }, []);

  /** Stop currently playing audio */
  const stopPlayback = useCallback(() => {
    if (playbackRef.current) {
      try { playbackRef.current.kill('SIGTERM'); } catch { /* ignore */ }
      playbackRef.current = null;
    }
    setStatus('idle');
  }, []);

  /**
   * Start continuous voice mode: record → transcribe → callback → wait for speak → repeat
   */
  const startContinuousMode = useCallback((onTranscript: (text: string) => void) => {
    setContinuousMode(true);
    continuousModeRef.current = true;
    onTranscriptRef.current = onTranscript;
    setTurnCount(0);
    setError(null);

    // Kick off the first recording cycle
    void runContinuousCycle();
  }, []);

  /** Internal: run one listen cycle in continuous mode */
  const runContinuousCycle = useCallback(async () => {
    if (!continuousModeRef.current) return;

    const transcript = await startRecording();
    if (!continuousModeRef.current) return;

    if (transcript && transcript.trim().length > 0) {
      onTranscriptRef.current?.(transcript);
    } else if (continuousModeRef.current) {
      // Empty transcript — try again
      void runContinuousCycle();
    }
  }, [startRecording]);

  /** Called after agent responds in continuous mode to trigger next listen cycle */
  const completeTurn = useCallback(() => {
    setTurnCount((prev) => prev + 1);
    if (continuousModeRef.current) {
      // Schedule next recording after a brief delay
      setTimeout(() => {
        if (continuousModeRef.current) {
          void runContinuousCycle();
        }
      }, 300);
    }
  }, [runContinuousCycle]);

  /** Stop continuous voice mode */
  const stopContinuousMode = useCallback(() => {
    continuousModeRef.current = false;
    setContinuousMode(false);
    onTranscriptRef.current = null;
    stopRecording();
    stopPlayback();
  }, [stopRecording, stopPlayback]);

  return {
    state: {
      status,
      error,
      continuousMode,
      turnCount,
      lastTranscript,
    },
    startRecording,
    stopRecording,
    speak,
    stopPlayback,
    startContinuousMode,
    stopContinuousMode,
    completeTurn,
  };
}
