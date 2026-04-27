import { preprocessTextForTTS, validateTTSText } from "@dotagents/shared"
import type { Config } from "../shared/types"
import { generateEdgeTTS, type TTSGenerationResult } from "./edge-tts"
import { preprocessTextForTTSWithLLM } from "./tts-llm-preprocessing"

export type TTSInput = {
  text: string
  providerId?: string
  voice?: string
  model?: string
  speed?: number
}

export type TTSOutput = {
  audio: ArrayBuffer
  mimeType: string
  processedText: string
  provider: string
}

export type { TTSGenerationResult }

/**
 * Server-side TTS generation used by both the tipc `generateSpeech` procedure
 * and the remote-server `POST /v1/tts/speak` route. Runs the same
 * preprocessing, validation, and provider dispatch so desktop-initiated and
 * remote-initiated TTS stay behaviorally identical.
 *
 * Note: the `config.ttsEnabled` toggle gates *desktop-local* TTS usage and is
 * enforced by callers (see tipc `generateSpeech`). It is intentionally not
 * enforced here so remote clients (e.g. the paired mobile app) can request
 * synthesis regardless of the desktop user's local auto-play preference.
 */
export async function generateTTS(input: TTSInput, config: Config): Promise<TTSOutput> {
  const providerId = input.providerId || config.ttsProviderId || "openai"

  let processedText = input.text
  if (config.ttsPreprocessingEnabled !== false) {
    if (config.ttsUseLLMPreprocessing) {
      processedText = await preprocessTextForTTSWithLLM(input.text, config.ttsLLMPreprocessingProviderId)
    } else {
      processedText = preprocessTextForTTS(input.text, {
        removeCodeBlocks: config.ttsRemoveCodeBlocks ?? true,
        removeUrls: config.ttsRemoveUrls ?? true,
        convertMarkdown: config.ttsConvertMarkdown ?? true,
      })
    }
  }

  const validation = validateTTSText(processedText)
  if (!validation.isValid) {
    throw new Error(`TTS validation failed: ${validation.issues.join(", ")}`)
  }

  let ttsResult: TTSGenerationResult
  if (providerId === "openai") {
    ttsResult = await generateOpenAITTS(processedText, input, config)
  } else if (providerId === "groq") {
    ttsResult = await generateGroqTTS(processedText, input, config)
  } else if (providerId === "gemini") {
    ttsResult = await generateGeminiTTS(processedText, input, config)
  } else if (providerId === "edge") {
    ttsResult = await generateEdgeTTS(processedText, input, config)
  } else if (providerId === "kitten") {
    const { synthesize } = await import("./kitten-tts")
    const voiceId = config.kittenVoiceId ?? 0
    const result = await synthesize(processedText, voiceId, input.speed)
    const wavBuffer = float32ToWav(result.samples, result.sampleRate)
    ttsResult = { audio: new Uint8Array(wavBuffer).buffer, mimeType: "audio/wav" }
  } else if (providerId === "supertonic") {
    const { synthesize } = await import("./supertonic-tts")
    const voice = config.supertonicVoice ?? "M1"
    const lang = config.supertonicLanguage ?? "en"
    const speed = input.speed ?? config.supertonicSpeed ?? 1.05
    const steps = config.supertonicSteps ?? 5
    const result = await synthesize(processedText, voice, lang, speed, steps)
    const wavBuffer = float32ToWav(result.samples, result.sampleRate)
    ttsResult = { audio: new Uint8Array(wavBuffer).buffer, mimeType: "audio/wav" }
  } else {
    throw new Error(`Unsupported TTS provider: ${providerId}`)
  }

  return {
    audio: ttsResult.audio,
    mimeType: ttsResult.mimeType,
    processedText,
    provider: providerId,
  }
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

  buffer.write("RIFF", offset); offset += 4
  buffer.writeUInt32LE(totalSize - 8, offset); offset += 4
  buffer.write("WAVE", offset); offset += 4

  buffer.write("fmt ", offset); offset += 4
  buffer.writeUInt32LE(16, offset); offset += 4
  buffer.writeUInt16LE(1, offset); offset += 2
  buffer.writeUInt16LE(numChannels, offset); offset += 2
  buffer.writeUInt32LE(sampleRate, offset); offset += 4
  buffer.writeUInt32LE(byteRate, offset); offset += 4
  buffer.writeUInt16LE(blockAlign, offset); offset += 2
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2

  buffer.write("data", offset); offset += 4
  buffer.writeUInt32LE(dataSize, offset); offset += 4

  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    const intSample = Math.round(sample * 32767)
    buffer.writeInt16LE(intSample, offset)
    offset += 2
  }

  return buffer
}

function getOpenAITTSMimeType(responseFormat: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm"): string {
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


async function generateOpenAITTS(
  text: string,
  input: { voice?: string; model?: string; speed?: number },
  config: Config
): Promise<TTSGenerationResult> {
  const model = input.model || config.openaiTtsModel || "gpt-4o-mini-tts"
  const voice = input.voice || config.openaiTtsVoice || "alloy"
  const speed = input.speed || config.openaiTtsSpeed || 1.0
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
    throw new Error(`OpenAI TTS API error: ${response.statusText} - ${errorText}`)
  }

  const audioBuffer = await response.arrayBuffer()
  return { audio: audioBuffer, mimeType: getOpenAITTSMimeType(responseFormat) }
}

async function generateGroqTTS(
  text: string,
  input: { voice?: string; model?: string },
  config: Config
): Promise<TTSGenerationResult> {
  const model = input.model || config.groqTtsModel || "canopylabs/orpheus-v1-english"
  const defaultVoice = model === "canopylabs/orpheus-arabic-saudi" ? "fahad" : "troy"
  const voice = input.voice || config.groqTtsVoice || defaultVoice

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
    body: JSON.stringify({ model, input: text, voice, response_format: "wav" }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    if (errorText.includes("requires terms acceptance")) {
      const modelParam = model === "canopylabs/orpheus-arabic-saudi"
        ? "canopylabs%2Forpheus-arabic-saudi"
        : "canopylabs%2Forpheus-v1-english"
      throw new Error(`Groq TTS model requires terms acceptance. Please visit https://console.groq.com/playground?model=${modelParam} and accept the terms when prompted, then try again.`)
    }
    throw new Error(`Groq TTS API error: ${response.statusText} - ${errorText}`)
  }

  const audioBuffer = await response.arrayBuffer()
  return { audio: audioBuffer, mimeType: "audio/wav" }
}

async function generateGeminiTTS(
  text: string,
  input: { voice?: string; model?: string },
  config: Config
): Promise<TTSGenerationResult> {
  const model = input.model || config.geminiTtsModel || "gemini-2.5-flash-preview-tts"
  const voice = input.voice || config.geminiTtsVoice || "Kore"

  const baseUrl = config.geminiBaseUrl || "https://generativelanguage.googleapis.com"
  const apiKey = config.geminiApiKey

  if (!apiKey) {
    throw new Error("Gemini API key is required for TTS")
  }

  const response = await fetch(
    `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini TTS API error: ${response.statusText} - ${errorText}`)
  }

  const result = await response.json()
  const inlineAudioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData
  const audioData = inlineAudioData?.data
  if (!audioData) {
    throw new Error("No audio data received from Gemini TTS API")
  }

  const binaryString = atob(audioData)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return { audio: bytes.buffer, mimeType: inlineAudioData?.mimeType || "audio/L16" }
}
