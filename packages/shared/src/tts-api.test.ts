import { describe, expect, it } from 'vitest';
import {
  TTS_SPEAK_MAX_TEXT_BYTES,
  generateGeminiTTS,
  generateGroqTTS,
  generateOpenAITTS,
  generateTTS,
  float32ToWav,
  getAudioFileExtensionFromMimeType,
  getOpenAITTSMimeType,
  getTtsSpeakFailureStatusCode,
  parseTtsSpeakRequestBody,
  synthesizeSpeechAction,
  type TtsFetchLike,
} from './tts-api';

function arrayBufferFromBytes(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function createFetchResponse(options: {
  ok?: boolean;
  statusText?: string;
  text?: string;
  bytes?: number[];
  json?: unknown;
}) {
  return {
    ok: options.ok ?? true,
    statusText: options.statusText ?? 'OK',
    text: async () => options.text ?? '',
    arrayBuffer: async () => arrayBufferFromBytes(options.bytes ?? []),
    json: async () => options.json,
  };
}

describe('parseTtsSpeakRequestBody', () => {
  it('normalizes valid TTS speak requests', () => {
    expect(parseTtsSpeakRequestBody({
      text: ' Hello ',
      providerId: 'edge',
      voice: 'en-US-AriaNeural',
      model: 'edge-default',
      speed: 1.15,
      ignored: true,
    })).toEqual({
      ok: true,
      request: {
        text: ' Hello ',
        providerId: 'edge',
        voice: 'en-US-AriaNeural',
        model: 'edge-default',
        speed: 1.15,
      },
    });
  });

  it('rejects missing, blank, or oversized text', () => {
    expect(parseTtsSpeakRequestBody({})).toEqual({
      ok: false,
      statusCode: 400,
      error: "Missing or invalid 'text'",
    });
    expect(parseTtsSpeakRequestBody({ text: '   ' })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Missing or invalid 'text'",
    });
    expect(parseTtsSpeakRequestBody({ text: 'a'.repeat(TTS_SPEAK_MAX_TEXT_BYTES + 1) })).toEqual({
      ok: false,
      statusCode: 413,
      error: 'Text too large (max 32 KB)',
    });
  });

  it('drops non-string optional fields and non-number speed', () => {
    expect(parseTtsSpeakRequestBody({
      text: 'Speak',
      providerId: 123,
      voice: false,
      model: null,
      speed: 'fast',
    })).toEqual({
      ok: true,
      request: {
        text: 'Speak',
        providerId: undefined,
        voice: undefined,
        model: undefined,
        speed: undefined,
      },
    });
  });
});

describe('getTtsSpeakFailureStatusCode', () => {
  it('classifies validation errors as 400 and provider failures as 502', () => {
    expect(getTtsSpeakFailureStatusCode('Unsupported TTS provider: nope')).toBe(400);
    expect(getTtsSpeakFailureStatusCode('API key is required')).toBe(400);
    expect(getTtsSpeakFailureStatusCode('upstream timeout')).toBe(502);
  });
});

describe('synthesizeSpeechAction', () => {
  it('uses shared parsing and adapters to produce TTS route responses', async () => {
    const config = { ttsProviderId: 'custom' };
    const encodedBody = { encoded: true };
    const calls: unknown[] = [];
    const result = await synthesizeSpeechAction(
      { text: 'Hello', providerId: 'edge', voice: 'nova', speed: 1.2 },
      {
        getConfig: () => config,
        generateSpeech: async (request, actionConfig) => {
          calls.push({ request, actionConfig });
          return {
            audio: arrayBufferFromBytes([1, 2, 3]),
            mimeType: 'audio/wav',
            processedText: 'Hello.',
            provider: request.providerId ?? 'fallback',
          };
        },
        encodeAudioBody: (audio) => {
          expect(Array.from(new Uint8Array(audio))).toEqual([1, 2, 3]);
          return encodedBody;
        },
        diagnostics: {
          logError: () => {
            throw new Error('unexpected diagnostics log');
          },
        },
      },
    );

    expect(calls).toEqual([{
      request: {
        text: 'Hello',
        providerId: 'edge',
        voice: 'nova',
        model: undefined,
        speed: 1.2,
      },
      actionConfig: config,
    }]);
    expect(result).toEqual({
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'X-TTS-Provider': 'edge',
      },
      body: encodedBody,
    });
  });

  it('returns shared request validation errors before generation', async () => {
    const result = await synthesizeSpeechAction(
      { text: '' },
      {
        getConfig: () => ({}),
        generateSpeech: async () => {
          throw new Error('unexpected generation');
        },
        encodeAudioBody: () => {
          throw new Error('unexpected encoding');
        },
        diagnostics: {
          logError: () => {
            throw new Error('unexpected diagnostics log');
          },
        },
      },
    );

    expect(result).toEqual({
      statusCode: 400,
      body: { error: "Missing or invalid 'text'" },
    });
  });

  it('logs generation failures and maps provider errors to route status codes', async () => {
    const error = new Error('Unsupported TTS provider: local');
    const loggedErrors: unknown[] = [];
    const result = await synthesizeSpeechAction(
      { text: 'Hello' },
      {
        getConfig: () => ({}),
        generateSpeech: async () => {
          throw error;
        },
        encodeAudioBody: () => {
          throw new Error('unexpected encoding');
        },
        diagnostics: {
          logError: (source, message, caughtError) => {
            loggedErrors.push({ source, message, caughtError });
          },
        },
      },
    );

    expect(result).toEqual({
      statusCode: 400,
      body: { error: 'Unsupported TTS provider: local' },
    });
    expect(loggedErrors).toEqual([{
      source: 'tts-actions',
      message: 'TTS request failed',
      caughtError: error,
    }]);
  });
});

describe('shared TTS provider generation', () => {
  it('maps OpenAI response formats to MIME types', () => {
    expect(getOpenAITTSMimeType('mp3')).toBe('audio/mpeg');
    expect(getOpenAITTSMimeType('opus')).toBe('audio/opus');
    expect(getOpenAITTSMimeType('aac')).toBe('audio/aac');
    expect(getOpenAITTSMimeType('flac')).toBe('audio/flac');
    expect(getOpenAITTSMimeType('pcm')).toBe('audio/L16');
    expect(getOpenAITTSMimeType('wav')).toBe('audio/wav');
  });

  it('maps audio MIME types to cache file extensions', () => {
    expect(getAudioFileExtensionFromMimeType('audio/mpeg')).toBe('mp3');
    expect(getAudioFileExtensionFromMimeType('audio/mp3; charset=binary')).toBe('mp3');
    expect(getAudioFileExtensionFromMimeType('audio/x-wav')).toBe('wav');
    expect(getAudioFileExtensionFromMimeType('audio/opus')).toBe('ogg');
    expect(getAudioFileExtensionFromMimeType('audio/flac')).toBe('flac');
    expect(getAudioFileExtensionFromMimeType('application/octet-stream')).toBe('bin');
  });

  it('generates OpenAI TTS through an injectable fetch implementation', async () => {
    const calls: Array<{ url: string; body: unknown; headers: Record<string, string> }> = [];
    const fetchImpl: TtsFetchLike = async (url, init) => {
      calls.push({
        url,
        body: JSON.parse(init.body),
        headers: init.headers,
      });
      return createFetchResponse({ bytes: [1, 2, 3] });
    };

    const result = await generateOpenAITTS(
      'Hello',
      { voice: 'nova', speed: 1.2 },
      { openaiApiKey: 'key', openaiBaseUrl: 'https://api.example/v1', openaiTtsResponseFormat: 'opus' },
      { fetchImpl },
    );

    expect(calls).toEqual([{
      url: 'https://api.example/v1/audio/speech',
      headers: {
        Authorization: 'Bearer key',
        'Content-Type': 'application/json',
      },
      body: {
        model: 'gpt-4o-mini-tts',
        input: 'Hello',
        voice: 'nova',
        speed: 1.2,
        response_format: 'opus',
      },
    }]);
    expect(Array.from(new Uint8Array(result.audio))).toEqual([1, 2, 3]);
    expect(result.mimeType).toBe('audio/opus');
  });

  it('keeps Groq terms-acceptance errors actionable', async () => {
    const fetchImpl: TtsFetchLike = async () => createFetchResponse({
      ok: false,
      statusText: 'Bad Request',
      text: 'model requires terms acceptance',
    });

    await expect(generateGroqTTS(
      'Hello',
      { model: 'canopylabs/orpheus-arabic-saudi' },
      { groqApiKey: 'key' },
      { fetchImpl },
    )).rejects.toThrow('https://console.groq.com/playground?model=canopylabs%2Forpheus-arabic-saudi');
  });

  it('generates Gemini TTS and decodes inline base64 audio', async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const fetchImpl: TtsFetchLike = async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return createFetchResponse({
        json: {
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  data: 'AQID',
                  mimeType: 'audio/wav',
                },
              }],
            },
          }],
        },
      });
    };

    const result = await generateGeminiTTS(
      'Hello',
      { voice: 'Kore' },
      { geminiApiKey: 'key', geminiBaseUrl: 'https://generativelanguage.example' },
      { fetchImpl, atobImpl: () => '\x01\x02\x03' },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://generativelanguage.example/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=key');
    expect(calls[0].body).toMatchObject({
      generationConfig: {
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore',
            },
          },
        },
      },
    });
    expect(Array.from(new Uint8Array(result.audio))).toEqual([1, 2, 3]);
    expect(result.mimeType).toBe('audio/wav');
  });
});

describe('shared TTS service orchestration', () => {
  it('preprocesses, validates, and dispatches to custom providers', async () => {
    const result = await generateTTS(
      { text: 'Use **bold** text', providerId: 'custom', voice: 'voice-a' },
      {},
      {
        providerHandlers: {
          custom: async (text, input) => ({
            audio: arrayBufferFromBytes([7, 8]),
            mimeType: `audio/${input.voice}:${text}`,
          }),
        },
      },
    );

    expect(result.processedText).toBe('Use bold text.');
    expect(result.provider).toBe('custom');
    expect(result.mimeType).toBe('audio/voice-a:Use bold text.');
    expect(Array.from(new Uint8Array(result.audio))).toEqual([7, 8]);
  });

  it('uses injected LLM preprocessing when enabled', async () => {
    const result = await generateTTS(
      { text: 'Raw text', providerId: 'custom' },
      { ttsUseLLMPreprocessing: true, ttsLLMPreprocessingProviderId: 'provider-a' },
      {
        preprocessTextForTTSWithLLM: async (text, providerId) => `${providerId}:${text}`,
        providerHandlers: {
          custom: async (text) => ({
            audio: arrayBufferFromBytes([1]),
            mimeType: text,
          }),
        },
      },
    );

    expect(result.processedText).toBe('provider-a:Raw text');
    expect(result.mimeType).toBe('provider-a:Raw text');
  });

  it('rejects invalid processed text and unsupported providers', async () => {
    await expect(generateTTS(
      { text: 'Visit https://example.com', providerId: 'custom' },
      { ttsPreprocessingEnabled: false },
      {
        providerHandlers: {
          custom: async () => ({ audio: arrayBufferFromBytes([]), mimeType: 'audio/wav' }),
        },
      },
    )).rejects.toThrow('TTS validation failed: Contains unprocessed URLs');

    await expect(generateTTS(
      { text: 'Hello', providerId: 'missing' },
      {},
    )).rejects.toThrow('Unsupported TTS provider: missing');
  });

  it('packs Float32 samples into a mono 16-bit WAV ArrayBuffer', () => {
    const wav = new Uint8Array(float32ToWav(new Float32Array([-1, 0, 1]), 24000));
    const textDecoder = new TextDecoder();

    expect(textDecoder.decode(wav.slice(0, 4))).toBe('RIFF');
    expect(textDecoder.decode(wav.slice(8, 12))).toBe('WAVE');
    expect(textDecoder.decode(wav.slice(36, 40))).toBe('data');
    expect(wav.byteLength).toBe(50);

    const view = new DataView(wav.buffer);
    expect(view.getUint32(24, true)).toBe(24000);
    expect(view.getInt16(44, true)).toBe(-32767);
    expect(view.getInt16(46, true)).toBe(0);
    expect(view.getInt16(48, true)).toBe(32767);
  });
});
