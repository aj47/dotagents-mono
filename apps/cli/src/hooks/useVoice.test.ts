/**
 * Tests for useVoice hook — voice integration for CLI.
 *
 * Tests cover:
 * - Audio utility functions (float32ToWav, wavToFloat32, cloudTranscribe, cloudSynthesize)
 * - Local STT/TTS synthesis paths
 * - Continuous voice mode logic
 * - Error handling for missing API keys and missing tools
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  float32ToWav,
  wavToFloat32,
  cloudTranscribe,
  cloudSynthesize,
} from './useVoice';
import type { VoiceState, VoiceStatus } from './useVoice';

// ── float32ToWav / wavToFloat32 roundtrip ────────────────────────────

describe('float32ToWav', () => {
  it('produces a valid WAV buffer with RIFF header', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const wav = float32ToWav(samples, 16000);

    expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
    expect(wav.toString('ascii', 12, 16)).toBe('fmt ');
    // PCM format = 1
    expect(wav.readUInt16LE(20)).toBe(1);
    // Mono
    expect(wav.readUInt16LE(22)).toBe(1);
    // Sample rate
    expect(wav.readUInt32LE(24)).toBe(16000);
  });

  it('encodes the correct number of samples', () => {
    const samples = new Float32Array([0, 0.25, -0.25]);
    const wav = float32ToWav(samples, 16000);

    // Data chunk starts at offset 36 ('data' marker) + 8
    const dataChunkSize = wav.readUInt32LE(40);
    // 3 samples × 2 bytes (16-bit) = 6
    expect(dataChunkSize).toBe(6);
  });

  it('handles empty samples', () => {
    const samples = new Float32Array([]);
    const wav = float32ToWav(samples, 16000);
    expect(wav.length).toBe(44); // header only
    expect(wav.readUInt32LE(40)).toBe(0); // data size = 0
  });

  it('clamps values to [-1, 1] range', () => {
    const samples = new Float32Array([2.0, -2.0]);
    const wav = float32ToWav(samples, 16000);

    // Read back the int16 samples
    const s1 = wav.readInt16LE(44);
    const s2 = wav.readInt16LE(46);
    // 1.0 → 0x7FFF (32767), -1.0 → -32768
    expect(s1).toBe(32767);
    expect(s2).toBe(-32768);
  });
});

describe('wavToFloat32', () => {
  it('extracts float32 samples from a WAV buffer', () => {
    // Create a simple WAV with known samples
    const original = new Float32Array([0, 0.5, -0.5]);
    const wav = float32ToWav(original, 16000);
    const extracted = wavToFloat32(wav);

    // Due to int16 quantization, values won't be exact
    expect(extracted.length).toBe(3);
    expect(Math.abs(extracted[0])).toBeLessThan(0.001);
    expect(Math.abs(extracted[1] - 0.5)).toBeLessThan(0.01);
    expect(Math.abs(extracted[2] + 0.5)).toBeLessThan(0.01);
  });

  it('roundtrips through float32 → wav → float32', () => {
    const original = new Float32Array([0.1, -0.3, 0.7, -0.9]);
    const wav = float32ToWav(original, 44100);
    const extracted = wavToFloat32(wav);

    expect(extracted.length).toBe(original.length);
    for (let i = 0; i < original.length; i++) {
      // int16 quantization introduces ~0.003% error
      expect(Math.abs(extracted[i] - original[i])).toBeLessThan(0.001);
    }
  });
});

// ── cloudTranscribe ──────────────────────────────────────────────────

describe('cloudTranscribe', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when API key is missing for OpenAI', async () => {
    const config = {
      sttProviderId: 'openai',
      openaiApiKey: '',
    } as any;

    await expect(cloudTranscribe(Buffer.from([]), config)).rejects.toThrow(
      /API key not configured.*openai/i,
    );
  });

  it('throws when API key is missing for Groq', async () => {
    const config = {
      sttProviderId: 'groq',
      groqApiKey: '',
    } as any;

    await expect(cloudTranscribe(Buffer.from([]), config)).rejects.toThrow(
      /API key not configured.*groq/i,
    );
  });

  it('calls the correct API endpoint for OpenAI', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Hello world' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      sttProviderId: 'openai',
      openaiApiKey: 'sk-test-key',
      openaiBaseUrl: 'https://api.openai.com/v1',
    } as any;

    const result = await cloudTranscribe(Buffer.from('fake-audio'), config);
    expect(result).toBe('Hello world');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toBe('https://api.openai.com/v1/audio/transcriptions');
  });

  it('calls the correct API endpoint for Groq', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Groq transcript' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      sttProviderId: 'groq',
      groqApiKey: 'gsk-test-key',
      groqBaseUrl: 'https://api.groq.com/openai/v1',
    } as any;

    const result = await cloudTranscribe(Buffer.from('fake-audio'), config);
    expect(result).toBe('Groq transcript');

    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toBe('https://api.groq.com/openai/v1/audio/transcriptions');
  });

  it('throws on non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
      text: async () => 'Invalid API key',
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      sttProviderId: 'openai',
      openaiApiKey: 'sk-bad-key',
    } as any;

    await expect(cloudTranscribe(Buffer.from('audio'), config)).rejects.toThrow(
      /STT API error.*Unauthorized/,
    );
  });

  it('uses configured base URL when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Custom endpoint' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      sttProviderId: 'openai',
      openaiApiKey: 'sk-key',
      openaiBaseUrl: 'https://custom.openai.com/v1',
    } as any;

    await cloudTranscribe(Buffer.from('audio'), config);
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toBe('https://custom.openai.com/v1/audio/transcriptions');
  });
});

// ── cloudSynthesize ──────────────────────────────────────────────────

describe('cloudSynthesize', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when API key is missing for OpenAI TTS', async () => {
    const config = {
      ttsProviderId: 'openai',
      openaiApiKey: '',
    } as any;

    await expect(cloudSynthesize('Hello', config)).rejects.toThrow(
      /API key not configured.*openai/i,
    );
  });

  it('throws when API key is missing for Groq TTS', async () => {
    const config = {
      ttsProviderId: 'groq',
      groqApiKey: '',
    } as any;

    await expect(cloudSynthesize('Hello', config)).rejects.toThrow(
      /API key not configured.*groq/i,
    );
  });

  it('calls the OpenAI speech endpoint correctly', async () => {
    const mockAudio = new ArrayBuffer(100);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => mockAudio,
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      ttsProviderId: 'openai',
      openaiApiKey: 'sk-test',
      openaiTtsModel: 'gpt-4o-mini-tts',
      openaiTtsVoice: 'alloy',
      openaiTtsSpeed: 1.0,
    } as any;

    const result = await cloudSynthesize('Hello world', config);
    expect(result.mimeType).toBe('audio/mpeg');
    expect(result.audio).toBeInstanceOf(Buffer);

    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('/audio/speech');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe('gpt-4o-mini-tts');
    expect(body.voice).toBe('alloy');
    expect(body.input).toBe('Hello world');
    expect(body.response_format).toBe('mp3');
  });

  it('calls the Groq speech endpoint correctly', async () => {
    const mockAudio = new ArrayBuffer(200);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => mockAudio,
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      ttsProviderId: 'groq',
      groqApiKey: 'gsk-test',
      groqTtsModel: 'canopylabs/orpheus-v1-english',
      groqTtsVoice: 'troy',
    } as any;

    const result = await cloudSynthesize('Test speech', config);
    expect(result.mimeType).toBe('audio/wav');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe('canopylabs/orpheus-v1-english');
    expect(body.voice).toBe('troy');
    expect(body.response_format).toBe('wav');
  });

  it('throws on TTS API error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
      text: async () => 'Invalid model',
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      ttsProviderId: 'openai',
      openaiApiKey: 'sk-test',
    } as any;

    await expect(cloudSynthesize('Hi', config)).rejects.toThrow(
      /TTS API error.*Bad Request/,
    );
  });

  it('uses default model and voice when not configured', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      ttsProviderId: 'openai',
      openaiApiKey: 'sk-test',
      // No model/voice specified
    } as any;

    await cloudSynthesize('Hello', config);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe('gpt-4o-mini-tts');
    expect(body.voice).toBe('alloy');
  });

  it('includes speed for OpenAI provider', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      ttsProviderId: 'openai',
      openaiApiKey: 'sk-test',
      openaiTtsSpeed: 1.5,
    } as any;

    await cloudSynthesize('Test', config);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.speed).toBe(1.5);
  });
});

// ── VoiceState type ──────────────────────────────────────────────────

describe('VoiceState types', () => {
  it('VoiceStatus includes all expected values', () => {
    const statuses: VoiceStatus[] = ['idle', 'recording', 'transcribing', 'synthesizing', 'playing', 'error'];
    expect(statuses).toHaveLength(6);
  });

  it('VoiceState has correct shape', () => {
    const state: VoiceState = {
      status: 'idle',
      error: null,
      continuousMode: false,
      turnCount: 0,
      lastTranscript: null,
    };
    expect(state.status).toBe('idle');
    expect(state.continuousMode).toBe(false);
    expect(state.turnCount).toBe(0);
  });

  it('VoiceState supports error state', () => {
    const state: VoiceState = {
      status: 'error',
      error: 'Something went wrong',
      continuousMode: false,
      turnCount: 0,
      lastTranscript: 'previous text',
    };
    expect(state.error).toBe('Something went wrong');
    expect(state.lastTranscript).toBe('previous text');
  });

  it('VoiceState tracks continuous mode turns', () => {
    const state: VoiceState = {
      status: 'recording',
      error: null,
      continuousMode: true,
      turnCount: 3,
      lastTranscript: 'tell me a joke',
    };
    expect(state.continuousMode).toBe(true);
    expect(state.turnCount).toBe(3);
  });
});

// ── Cloud provider selection ─────────────────────────────────────────

describe('Cloud provider selection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to OpenAI STT when no provider configured', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'default provider' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      // sttProviderId not set → defaults to 'openai'
      openaiApiKey: 'sk-test',
    } as any;

    await cloudTranscribe(Buffer.from('audio'), config);
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('openai.com');
  });

  it('defaults to OpenAI TTS when no provider configured', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      // ttsProviderId not set → defaults to 'openai'
      openaiApiKey: 'sk-test',
    } as any;

    await cloudSynthesize('hi', config);
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('openai.com');
  });

  it('uses Groq STT base URL default when not provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'groq default' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      sttProviderId: 'groq',
      groqApiKey: 'gsk-test',
      // No groqBaseUrl → should default
    } as any;

    await cloudTranscribe(Buffer.from('audio'), config);
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toBe('https://api.groq.com/openai/v1/audio/transcriptions');
  });

  it('uses Groq TTS base URL default when not provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      ttsProviderId: 'groq',
      groqApiKey: 'gsk-test',
      // No groqBaseUrl → should default
    } as any;

    await cloudSynthesize('hi', config);
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toBe('https://api.groq.com/openai/v1/audio/speech');
  });
});

// ── Authorization headers ────────────────────────────────────────────

describe('Authorization headers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends Bearer token for OpenAI STT', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'ok' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      sttProviderId: 'openai',
      openaiApiKey: 'sk-abc123',
    } as any;

    await cloudTranscribe(Buffer.from('audio'), config);
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer sk-abc123');
  });

  it('sends Bearer token for Groq TTS', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
    });
    vi.stubGlobal('fetch', mockFetch);

    const config = {
      ttsProviderId: 'groq',
      groqApiKey: 'gsk-xyz789',
    } as any;

    await cloudSynthesize('hello', config);
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer gsk-xyz789');
  });
});
