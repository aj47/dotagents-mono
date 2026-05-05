import {
  float32ToWav,
  generateTTS as generateSharedTTS,
  type GenerateTtsInput,
  type GenerateTtsOutput,
  type TtsGenerationResult,
} from "@dotagents/shared/tts-api"
import type { Config } from "../shared/types"
import { generateEdgeTTS } from "./edge-tts"
import { preprocessTextForTTSWithLLM } from "./tts-llm-preprocessing"

export type TTSInput = GenerateTtsInput
export type TTSOutput = GenerateTtsOutput
export type { TtsGenerationResult as TTSGenerationResult }

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
  return generateSharedTTS(input, config, {
    preprocessTextForTTSWithLLM,
    providerHandlers: {
      edge: (processedText, providerInput, providerConfig) =>
        generateEdgeTTS(processedText, providerInput, providerConfig),
      kitten: async (processedText, providerInput, providerConfig) => {
        const { synthesize } = await import("./kitten-tts")
        const voiceId = providerConfig.kittenVoiceId ?? 0
        const result = await synthesize(processedText, voiceId, providerInput.speed)
        return { audio: float32ToWav(result.samples, result.sampleRate), mimeType: "audio/wav" }
      },
      supertonic: async (processedText, providerInput, providerConfig) => {
        const { synthesize } = await import("./supertonic-tts")
        const voice = providerConfig.supertonicVoice ?? "M1"
        const lang = providerConfig.supertonicLanguage ?? "en"
        const speed = providerInput.speed ?? providerConfig.supertonicSpeed ?? 1.05
        const steps = providerConfig.supertonicSteps ?? 5
        const result = await synthesize(processedText, voice, lang, speed, steps)
        return { audio: float32ToWav(result.samples, result.sampleRate), mimeType: "audio/wav" }
      },
    },
  })
}
