import type { OpenAITtsResponseFormat, TtsSpeakRequest } from './api-types';
import {
  getTTSPreprocessingOptionsFromConfig,
  preprocessTextForTTS,
  validateTTSText,
  type TTSPreprocessingConfigLike,
} from './tts-preprocessing';
import {
  DEFAULT_OPENAI_TTS_RESPONSE_FORMAT,
  DEFAULT_TTS_PREPROCESSING_ENABLED,
  DEFAULT_TTS_USE_LLM_PREPROCESSING,
  GROQ_ARABIC_TTS_MODEL,
  getTextToSpeechModelDefault,
  getTextToSpeechSpeedDefault,
  getTextToSpeechVoiceDefault,
} from './text-to-speech-settings';

export type { OpenAITtsResponseFormat } from './api-types';

export const TTS_SPEAK_MAX_TEXT_BYTES = 32 * 1024;

export type TtsGenerationResult = {
  audio: ArrayBuffer;
  mimeType: string;
};

export type TtsProviderInput = {
  voice?: string;
  model?: string;
  speed?: number;
};

export type GenerateTtsInput = TtsProviderInput & {
  text: string;
  providerId?: string;
};

export type GenerateTtsOutput = TtsGenerationResult & {
  processedText: string;
  provider: string;
};

export type OpenAITtsConfigLike = {
  openaiTtsModel?: string;
  openaiTtsVoice?: string;
  openaiTtsSpeed?: number;
  openaiTtsResponseFormat?: OpenAITtsResponseFormat;
  openaiBaseUrl?: string;
  openaiApiKey?: string;
};

export type GroqTtsConfigLike = {
  groqTtsModel?: string;
  groqTtsVoice?: string;
  groqBaseUrl?: string;
  groqApiKey?: string;
};

export type GeminiTtsConfigLike = {
  geminiTtsModel?: string;
  geminiTtsVoice?: string;
  geminiBaseUrl?: string;
  geminiApiKey?: string;
};

export type GenerateTtsConfigLike = TTSPreprocessingConfigLike
  & OpenAITtsConfigLike
  & GroqTtsConfigLike
  & GeminiTtsConfigLike
  & {
    ttsProviderId?: string;
    ttsPreprocessingEnabled?: boolean;
    ttsUseLLMPreprocessing?: boolean;
    ttsLLMPreprocessingProviderId?: string;
  };

export type TtsProviderHandler<TConfig extends GenerateTtsConfigLike = GenerateTtsConfigLike> = (
  text: string,
  input: TtsProviderInput,
  config: TConfig,
) => Promise<TtsGenerationResult>;

export type GenerateTtsOptions<TConfig extends GenerateTtsConfigLike = GenerateTtsConfigLike> = {
  preprocessTextForTTSWithLLM?: (text: string, providerId?: string) => Promise<string>;
  providerHandlers?: Record<string, TtsProviderHandler<TConfig>>;
};

export type TtsFetchResponseLike = {
  ok: boolean;
  statusText?: string;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  json(): Promise<unknown>;
};

export type TtsFetchLike = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  },
) => Promise<TtsFetchResponseLike>;

export type TtsProviderRequestOptions = {
  fetchImpl?: TtsFetchLike;
};

export type GeminiTtsProviderRequestOptions = TtsProviderRequestOptions & {
  atobImpl?: (data: string) => string;
};

export type ParsedTtsSpeakRequest =
  | {
    ok: true;
    request: TtsSpeakRequest;
  }
  | {
    ok: false;
    statusCode: 400 | 413;
    error: string;
  };

export type TtsActionResult = {
  statusCode: number;
  body?: unknown;
  headers?: Record<string, string>;
};

export interface TtsActionDiagnostics {
  logError(source: string, message: string, error: unknown): void;
}

export interface TtsActionService {
  generateSpeech(request: TtsSpeakRequest): Promise<GenerateTtsOutput>;
  encodeAudioBody(audio: ArrayBuffer): unknown;
}

export interface TtsActionServiceOptions<TConfig extends GenerateTtsConfigLike = GenerateTtsConfigLike> {
  getConfig(): TConfig;
  generateSpeech(request: TtsSpeakRequest, config: TConfig): Promise<GenerateTtsOutput>;
  encodeAudioBody(audio: ArrayBuffer): unknown;
}

export function createTtsActionService<TConfig extends GenerateTtsConfigLike>(
  options: TtsActionServiceOptions<TConfig>,
): TtsActionService {
  return {
    generateSpeech: (request) => options.generateSpeech(request, options.getConfig()),
    encodeAudioBody: (audio) => options.encodeAudioBody(audio),
  };
}

export interface TtsActionOptions {
  service: TtsActionService;
  diagnostics: TtsActionDiagnostics;
}

export interface TtsRouteActions {
  synthesizeSpeech(body: unknown): Promise<TtsActionResult>;
}

function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function getDefaultFetch(): TtsFetchLike {
  const fetchImpl = globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('TTS provider requests require a fetch implementation');
  }
  return (url, init) => fetchImpl(url, init);
}

function decodeBase64ToArrayBuffer(
  value: string,
  atobImpl: (data: string) => string,
): ArrayBuffer {
  const binaryString = atobImpl(value);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function parseTtsSpeakRequestBody(
  body: unknown,
  options: { maxTextBytes?: number } = {},
): ParsedTtsSpeakRequest {
  const requestBody = body && typeof body === 'object'
    ? body as {
      text?: unknown;
      providerId?: unknown;
      voice?: unknown;
      model?: unknown;
      speed?: unknown;
    }
    : {};

  if (typeof requestBody.text !== 'string' || !requestBody.text.trim()) {
    return { ok: false, statusCode: 400, error: "Missing or invalid 'text'" };
  }

  const maxTextBytes = options.maxTextBytes ?? TTS_SPEAK_MAX_TEXT_BYTES;
  if (getUtf8ByteLength(requestBody.text) > maxTextBytes) {
    return { ok: false, statusCode: 413, error: `Text too large (max ${Math.round(maxTextBytes / 1024)} KB)` };
  }

  return {
    ok: true,
    request: {
      text: requestBody.text,
      providerId: typeof requestBody.providerId === 'string' ? requestBody.providerId : undefined,
      voice: typeof requestBody.voice === 'string' ? requestBody.voice : undefined,
      model: typeof requestBody.model === 'string' ? requestBody.model : undefined,
      speed: typeof requestBody.speed === 'number' ? requestBody.speed : undefined,
    },
  };
}

export function getTtsSpeakFailureStatusCode(message: string): 400 | 502 {
  return /not enabled|validation failed|Unsupported TTS provider|API key is required/i.test(message) ? 400 : 502;
}

function ttsActionError(statusCode: number, message: string): TtsActionResult {
  return {
    statusCode,
    body: { error: message },
  };
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function synthesizeSpeechAction(
  body: unknown,
  options: TtsActionOptions,
): Promise<TtsActionResult> {
  try {
    const parsedRequest = parseTtsSpeakRequestBody(body);
    if (parsedRequest.ok === false) {
      return ttsActionError(parsedRequest.statusCode, parsedRequest.error);
    }

    const result = await options.service.generateSpeech(parsedRequest.request);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': result.mimeType,
        'X-TTS-Provider': result.provider,
      },
      body: options.service.encodeAudioBody(result.audio),
    };
  } catch (caughtError) {
    options.diagnostics.logError('tts-actions', 'TTS request failed', caughtError);
    const message = getUnknownErrorMessage(caughtError, 'TTS generation failed');
    return ttsActionError(getTtsSpeakFailureStatusCode(message), message);
  }
}

export function createTtsRouteActions(options: TtsActionOptions): TtsRouteActions {
  return {
    synthesizeSpeech: (body) => synthesizeSpeechAction(body, options),
  };
}

export function getOpenAITTSMimeType(responseFormat: OpenAITtsResponseFormat): string {
  switch (responseFormat) {
    case 'mp3':
      return 'audio/mpeg';
    case 'opus':
      return 'audio/opus';
    case 'aac':
      return 'audio/aac';
    case 'flac':
      return 'audio/flac';
    case 'pcm':
      return 'audio/L16';
    case 'wav':
    default:
      return 'audio/wav';
  }
}

export function getAudioFileExtensionFromMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  if (normalized === 'audio/mpeg' || normalized === 'audio/mp3') return 'mp3';
  if (normalized === 'audio/wav' || normalized === 'audio/x-wav' || normalized === 'audio/wave') return 'wav';
  if (normalized === 'audio/aac') return 'aac';
  if (normalized === 'audio/opus' || normalized === 'audio/ogg') return 'ogg';
  if (normalized === 'audio/flac') return 'flac';
  return 'bin';
}

export async function generateTTS<TConfig extends GenerateTtsConfigLike>(
  input: GenerateTtsInput,
  config: TConfig,
  options: GenerateTtsOptions<TConfig> = {},
): Promise<GenerateTtsOutput> {
  const provider = input.providerId || config.ttsProviderId || 'openai';

  let processedText = input.text;
  if (config.ttsPreprocessingEnabled ?? DEFAULT_TTS_PREPROCESSING_ENABLED) {
    if ((config.ttsUseLLMPreprocessing ?? DEFAULT_TTS_USE_LLM_PREPROCESSING) && options.preprocessTextForTTSWithLLM) {
      processedText = await options.preprocessTextForTTSWithLLM(input.text, config.ttsLLMPreprocessingProviderId);
    } else {
      processedText = preprocessTextForTTS(input.text, getTTSPreprocessingOptionsFromConfig(config));
    }
  }

  const validation = validateTTSText(processedText);
  if (!validation.isValid) {
    throw new Error(`TTS validation failed: ${validation.issues.join(', ')}`);
  }

  const providerHandler = options.providerHandlers?.[provider]
    ?? getDefaultTtsProviderHandler(provider);
  if (!providerHandler) {
    throw new Error(`Unsupported TTS provider: ${provider}`);
  }

  const result = await providerHandler(processedText, input, config);
  return {
    audio: result.audio,
    mimeType: result.mimeType,
    processedText,
    provider,
  };
}

function getDefaultTtsProviderHandler<TConfig extends GenerateTtsConfigLike>(
  provider: string,
): TtsProviderHandler<TConfig> | undefined {
  if (provider === 'openai') {
    return generateOpenAITTS as TtsProviderHandler<TConfig>;
  }
  if (provider === 'groq') {
    return generateGroqTTS as TtsProviderHandler<TConfig>;
  }
  if (provider === 'gemini') {
    return generateGeminiTTS as TtsProviderHandler<TConfig>;
  }
  return undefined;
}

export async function generateOpenAITTS(
  text: string,
  input: TtsProviderInput,
  config: OpenAITtsConfigLike,
  options: TtsProviderRequestOptions = {},
): Promise<TtsGenerationResult> {
  const model = input.model || config.openaiTtsModel || getTextToSpeechModelDefault('openai')!;
  const voice = input.voice || config.openaiTtsVoice || String(getTextToSpeechVoiceDefault('openai'));
  const speed = input.speed || config.openaiTtsSpeed || getTextToSpeechSpeedDefault('openai');
  const responseFormat = config.openaiTtsResponseFormat || DEFAULT_OPENAI_TTS_RESPONSE_FORMAT;
  const baseUrl = config.openaiBaseUrl || 'https://api.openai.com/v1';
  const apiKey = config.openaiApiKey;

  if (!apiKey) {
    throw new Error('OpenAI API key is required for TTS');
  }

  const fetchImpl = options.fetchImpl ?? getDefaultFetch();
  const response = await fetchImpl(`${baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      speed,
      response_format: responseFormat,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI TTS API error: ${response.statusText} - ${errorText}`);
  }

  return {
    audio: await response.arrayBuffer(),
    mimeType: getOpenAITTSMimeType(responseFormat),
  };
}

export async function generateGroqTTS(
  text: string,
  input: TtsProviderInput,
  config: GroqTtsConfigLike,
  options: TtsProviderRequestOptions = {},
): Promise<TtsGenerationResult> {
  const model = input.model || config.groqTtsModel || getTextToSpeechModelDefault('groq')!;
  const defaultVoice = String(getTextToSpeechVoiceDefault('groq', model));
  const voice = input.voice || config.groqTtsVoice || defaultVoice;
  const baseUrl = config.groqBaseUrl || 'https://api.groq.com/openai/v1';
  const apiKey = config.groqApiKey;

  if (!apiKey) {
    throw new Error('Groq API key is required for TTS');
  }

  const fetchImpl = options.fetchImpl ?? getDefaultFetch();
  const response = await fetchImpl(`${baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, input: text, voice, response_format: 'wav' }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (errorText.includes('requires terms acceptance')) {
      const modelParam = model === GROQ_ARABIC_TTS_MODEL
        ? 'canopylabs%2Forpheus-arabic-saudi'
        : 'canopylabs%2Forpheus-v1-english';
      throw new Error(`Groq TTS model requires terms acceptance. Please visit https://console.groq.com/playground?model=${modelParam} and accept the terms when prompted, then try again.`);
    }
    throw new Error(`Groq TTS API error: ${response.statusText} - ${errorText}`);
  }

  return {
    audio: await response.arrayBuffer(),
    mimeType: 'audio/wav',
  };
}

export async function generateGeminiTTS(
  text: string,
  input: TtsProviderInput,
  config: GeminiTtsConfigLike,
  options: GeminiTtsProviderRequestOptions = {},
): Promise<TtsGenerationResult> {
  const model = input.model || config.geminiTtsModel || getTextToSpeechModelDefault('gemini')!;
  const voice = input.voice || config.geminiTtsVoice || String(getTextToSpeechVoiceDefault('gemini'));
  const baseUrl = config.geminiBaseUrl || 'https://generativelanguage.googleapis.com';
  const apiKey = config.geminiApiKey;

  if (!apiKey) {
    throw new Error('Gemini API key is required for TTS');
  }

  const fetchImpl = options.fetchImpl ?? getDefaultFetch();
  const response = await fetchImpl(
    `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini TTS API error: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: {
            data?: string;
            mimeType?: string;
          };
        }>;
      };
    }>;
  };
  const inlineAudioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  const audioData = inlineAudioData?.data;
  if (!audioData) {
    throw new Error('No audio data received from Gemini TTS API');
  }

  const atobImpl = options.atobImpl ?? globalThis.atob;
  if (typeof atobImpl !== 'function') {
    throw new Error('Gemini TTS audio decoding requires an atob implementation');
  }

  return {
    audio: decodeBase64ToArrayBuffer(audioData, atobImpl),
    mimeType: inlineAudioData?.mimeType || 'audio/L16',
  };
}

export function float32ToWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  const writeString = (value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset, value.charCodeAt(i));
      offset += 1;
    }
  };

  writeString('RIFF');
  view.setUint32(offset, totalSize - 8, true); offset += 4;
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitsPerSample, true); offset += 2;
  writeString('data');
  view.setUint32(offset, dataSize, true); offset += 4;

  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const intSample = Math.round(sample * 32767);
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return buffer;
}
