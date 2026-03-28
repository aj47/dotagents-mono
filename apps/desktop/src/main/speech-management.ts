import {
  preprocessTextForTTS,
  resolveTtsProviderId,
  resolveTtsSelection,
  validateTTSText,
} from "@dotagents/shared"
import type { Config } from "../shared/types"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { preprocessTextForTTSWithLLM } from "./tts-llm-preprocessing"

export type ManagedSpeechProviderId =
  | "openai"
  | "groq"
  | "gemini"
  | "kitten"
  | "supertonic"

export interface ManagedSpeechGenerationInput {
  text: string
  providerId?: ManagedSpeechProviderId
  voice?: string
  voiceId?: number
  model?: string
  speed?: number
  lang?: string
  steps?: number
}

export interface ManagedSpeechGenerationResult {
  audio: ArrayBuffer
  mimeType: string
  processedText: string
  provider: ManagedSpeechProviderId
}

export interface ManagedKittenSpeechInput {
  text: string
  voiceId?: number
  speed?: number
}

export interface ManagedSupertonicSpeechInput {
  text: string
  voice?: string
  lang?: string
  speed?: number
  steps?: number
}

export interface ManagedSpeechPreviewResult {
  audio: ArrayBuffer
  mimeType: "audio/wav"
  sampleRate: number
}

type TTSGenerationResult = {
  audio: ArrayBuffer
  mimeType: string
}

function float32ToWav(samples: Float32Array, sampleRate: number): Buffer {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const dataSize = samples.length * (bitsPerSample / 8)
  const headerSize = 44
  const totalSize = headerSize + dataSize

  const buffer = Buffer.alloc(totalSize)
  let offset = 0

  buffer.write("RIFF", offset)
  offset += 4
  buffer.writeUInt32LE(totalSize - 8, offset)
  offset += 4
  buffer.write("WAVE", offset)
  offset += 4

  buffer.write("fmt ", offset)
  offset += 4
  buffer.writeUInt32LE(16, offset)
  offset += 4
  buffer.writeUInt16LE(1, offset)
  offset += 2
  buffer.writeUInt16LE(numChannels, offset)
  offset += 2
  buffer.writeUInt32LE(sampleRate, offset)
  offset += 4
  buffer.writeUInt32LE(byteRate, offset)
  offset += 4
  buffer.writeUInt16LE(blockAlign, offset)
  offset += 2
  buffer.writeUInt16LE(bitsPerSample, offset)
  offset += 2

  buffer.write("data", offset)
  offset += 4
  buffer.writeUInt32LE(dataSize, offset)
  offset += 4

  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    const intSample = Math.round(sample * 32767)
    buffer.writeInt16LE(intSample, offset)
    offset += 2
  }

  return buffer
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return Uint8Array.from(buffer).buffer
}

function getOpenAITTSMimeType(
  responseFormat: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm",
): string {
  switch (responseFormat) {
    case "mp3":
      return "audio/mpeg"
    case "opus":
      return "audio/opus"
    case "aac":
      return "audio/aac"
    case "flac":
      return "audio/flac"
    case "pcm":
      return "audio/L16"
    case "wav":
    default:
      return "audio/wav"
  }
}

async function preprocessManagedSpeechText(
  text: string,
  config: Config,
): Promise<string> {
  if (config.ttsPreprocessingEnabled === false) {
    return text
  }

  if (config.ttsUseLLMPreprocessing) {
    return preprocessTextForTTSWithLLM(
      text,
      config.ttsLLMPreprocessingProviderId,
    )
  }

  return preprocessTextForTTS(text, {
    removeCodeBlocks: config.ttsRemoveCodeBlocks ?? true,
    removeUrls: config.ttsRemoveUrls ?? true,
    convertMarkdown: config.ttsConvertMarkdown ?? true,
  })
}

async function generateOpenAITTS(
  text: string,
  input: ManagedSpeechGenerationInput,
  config: Config,
): Promise<TTSGenerationResult> {
  const selection = resolveTtsSelection(config, "openai")
  const model = input.model || selection.model
  const voice = input.voice || selection.voice
  const speed = input.speed ?? selection.speed
  const responseFormat = config.openaiTtsResponseFormat || "mp3"

  const baseUrl = config.openaiBaseUrl || "https://api.openai.com/v1"
  const apiKey = config.openaiApiKey

  if (!apiKey) {
    throw new Error("OpenAI API key is required for TTS")
  }

  const response = await fetch(`${baseUrl}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      speed,
      response_format: responseFormat,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `OpenAI TTS API error: ${response.statusText} - ${errorText}`,
    )
  }

  return {
    audio: await response.arrayBuffer(),
    mimeType: getOpenAITTSMimeType(responseFormat),
  }
}

async function generateGroqTTS(
  text: string,
  input: ManagedSpeechGenerationInput,
  config: Config,
): Promise<TTSGenerationResult> {
  const selection = resolveTtsSelection(config, "groq")
  const model = input.model || selection.model
  const voice =
    input.voice ||
    resolveTtsSelection(
      {
        ...config,
        groqTtsModel: model,
      },
      "groq",
    ).voice

  const baseUrl = config.groqBaseUrl || "https://api.groq.com/openai/v1"
  const apiKey = config.groqApiKey

  if (!apiKey) {
    throw new Error("Groq API key is required for TTS")
  }

  const response = await fetch(`${baseUrl}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      response_format: "wav",
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    if (errorText.includes("requires terms acceptance")) {
      const modelParam =
        model === "canopylabs/orpheus-arabic-saudi"
          ? "canopylabs%2Forpheus-arabic-saudi"
          : "canopylabs%2Forpheus-v1-english"
      throw new Error(
        `Groq TTS model requires terms acceptance. Please visit https://console.groq.com/playground?model=${modelParam} and accept the terms when prompted, then try again.`,
      )
    }

    throw new Error(`Groq TTS API error: ${response.statusText} - ${errorText}`)
  }

  return {
    audio: await response.arrayBuffer(),
    mimeType: "audio/wav",
  }
}

async function generateGeminiTTS(
  text: string,
  input: ManagedSpeechGenerationInput,
  config: Config,
): Promise<TTSGenerationResult> {
  const selection = resolveTtsSelection(config, "gemini")
  const model = input.model || selection.model
  const voice = input.voice || selection.voice

  const baseUrl =
    config.geminiBaseUrl || "https://generativelanguage.googleapis.com"
  const apiKey = config.geminiApiKey

  if (!apiKey) {
    throw new Error("Gemini API key is required for TTS")
  }

  const response = await fetch(
    `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text }],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
        },
      }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Gemini TTS API error: ${response.statusText} - ${errorText}`,
    )
  }

  const result = await response.json()
  const inlineAudioData =
    result.candidates?.[0]?.content?.parts?.[0]?.inlineData
  const audioData = inlineAudioData?.data

  if (!audioData) {
    throw new Error("No audio data received from Gemini TTS API")
  }

  return {
    audio: bufferToArrayBuffer(Buffer.from(audioData, "base64")),
    mimeType: inlineAudioData?.mimeType || "audio/L16",
  }
}

export async function synthesizeManagedKittenSpeech(
  input: ManagedKittenSpeechInput,
  config: Config = configStore.get(),
): Promise<ManagedSpeechPreviewResult> {
  const { synthesize } = await import("./kitten-tts")
  const selection = resolveTtsSelection(config, "kitten")
  const result = await synthesize(
    input.text,
    input.voiceId ?? selection.voiceId,
    input.speed,
  )
  const wavBuffer = float32ToWav(result.samples, result.sampleRate)

  return {
    audio: bufferToArrayBuffer(wavBuffer),
    mimeType: "audio/wav",
    sampleRate: result.sampleRate,
  }
}

export async function synthesizeManagedSupertonicSpeech(
  input: ManagedSupertonicSpeechInput,
  config: Config = configStore.get(),
): Promise<ManagedSpeechPreviewResult> {
  const { synthesize } = await import("./supertonic-tts")
  const selection = resolveTtsSelection(config, "supertonic")
  const result = await synthesize(
    input.text,
    input.voice ?? selection.voice,
    input.lang ?? selection.language,
    input.speed ?? selection.speed,
    input.steps ?? selection.steps,
  )
  const wavBuffer = float32ToWav(result.samples, result.sampleRate)

  return {
    audio: bufferToArrayBuffer(wavBuffer),
    mimeType: "audio/wav",
    sampleRate: result.sampleRate,
  }
}

export async function generateManagedSpeech(
  input: ManagedSpeechGenerationInput,
  config: Config = configStore.get(),
): Promise<ManagedSpeechGenerationResult> {
  if (!config.ttsEnabled) {
    throw new Error("Text-to-Speech is not enabled")
  }

  const provider = input.providerId || resolveTtsProviderId(config)
  const processedText = await preprocessManagedSpeechText(input.text, config)
  const validation = validateTTSText(processedText)

  if (!validation.isValid) {
    throw new Error(`TTS validation failed: ${validation.issues.join(", ")}`)
  }

  try {
    let ttsResult: TTSGenerationResult

    if (provider === "openai") {
      ttsResult = await generateOpenAITTS(processedText, input, config)
    } else if (provider === "groq") {
      ttsResult = await generateGroqTTS(processedText, input, config)
    } else if (provider === "gemini") {
      ttsResult = await generateGeminiTTS(processedText, input, config)
    } else if (provider === "kitten") {
      ttsResult = await synthesizeManagedKittenSpeech(
        {
          text: processedText,
          voiceId: input.voiceId,
          speed: input.speed,
        },
        config,
      )
    } else if (provider === "supertonic") {
      ttsResult = await synthesizeManagedSupertonicSpeech(
        {
          text: processedText,
          voice: input.voice,
          lang: input.lang,
          speed: input.speed,
          steps: input.steps,
        },
        config,
      )
    } else {
      throw new Error(`Unsupported TTS provider: ${provider}`)
    }

    return {
      audio: ttsResult.audio,
      mimeType: ttsResult.mimeType,
      processedText,
      provider,
    }
  } catch (error) {
    diagnosticsService.logError("tts", "TTS generation failed", error)
    throw error
  }
}
