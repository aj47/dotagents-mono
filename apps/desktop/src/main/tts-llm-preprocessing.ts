/**
 * LLM-driven TTS text preprocessing
 * Uses an LLM to intelligently convert text to speech-friendly format
 * for more natural and context-aware speech output.
 */

import { makeTextCompletionWithFetch } from "./llm-fetch"
import { getCurrentProviderId } from "./ai-sdk-provider"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import {
  buildTTSPreprocessingPrompt,
  getTTSPreprocessingOptionsFromConfig,
  preprocessTextForTTS as regexPreprocessTextForTTS,
} from "@dotagents/shared/tts-preprocessing"

/**
 * Preprocesses text for TTS using an LLM for more natural speech output.
 * Falls back to regex-based preprocessing if LLM call fails.
 * 
 * @param text The raw text to preprocess for TTS
 * @param providerId Optional provider ID for the LLM call
 * @returns Preprocessed text suitable for TTS
 */
export async function preprocessTextForTTSWithLLM(
  text: string,
  providerId?: string
): Promise<string> {
  const config = configStore.get()

  // Use the configured TTS LLM provider, or fall back to transcript post-processing
  // provider, or the active agent (MCP tools) provider as a last resort. Falling
  // back to a literal "openai" burned rate limits whenever the agent was running
  // on ChatGPT-Web (see issue #310).
  const llmProviderId =
    providerId ||
    config.ttsLLMPreprocessingProviderId ||
    config.transcriptPostProcessingProviderId ||
    getCurrentProviderId()

  try {
    // Build the dynamic prompt based on user config, then append the text
    const prompt = buildTTSPreprocessingPrompt(config) + text

    // Make the LLM call
    const result = await makeTextCompletionWithFetch(prompt, llmProviderId)
    
    // If we got a result, return it
    if (result && result.trim().length > 0) {
      diagnosticsService.logInfo("tts-llm-preprocessing", "LLM preprocessing succeeded", {
        inputLength: text.length,
        outputLength: result.length,
        provider: llmProviderId
      })
      return result.trim()
    }
    
    // If empty result, fall back to regex
    throw new Error("LLM returned empty result")
  } catch (error) {
    // Log the error and fall back to regex-based preprocessing
    diagnosticsService.logWarning(
      "tts-llm-preprocessing",
      "LLM preprocessing failed, falling back to regex",
      error
    )

    // Fall back to regex-based preprocessing with user-configured options
    return regexPreprocessTextForTTS(text, getTTSPreprocessingOptionsFromConfig(config))
  }
}
