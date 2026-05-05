import {
  getTtsSpeakFailureStatusCode,
  parseTtsSpeakRequestBody,
} from "@dotagents/shared/tts-api"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { generateTTS } from "./tts-service"

export type TtsActionResult = MobileApiActionResult

function error(statusCode: number, message: string): TtsActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

export async function synthesizeSpeech(body: unknown): Promise<TtsActionResult> {
  try {
    const parsedRequest = parseTtsSpeakRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const result = await generateTTS(
      parsedRequest.request,
      configStore.get(),
    )

    return {
      statusCode: 200,
      headers: {
        "Content-Type": result.mimeType,
        "X-TTS-Provider": result.provider,
      },
      body: Buffer.from(result.audio),
    }
  } catch (caughtError: any) {
    diagnosticsService.logError("tts-actions", "TTS request failed", caughtError)
    const message = caughtError?.message || "TTS generation failed"
    return error(getTtsSpeakFailureStatusCode(message), message)
  }
}
