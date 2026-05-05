import {
  synthesizeSpeechAction,
  type TtsActionOptions,
} from "@dotagents/shared/tts-api"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import type { Config } from "../shared/types"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { generateTTS } from "./tts-service"

export type TtsActionResult = MobileApiActionResult

const ttsActionOptions: TtsActionOptions<Config> = {
  getConfig: () => configStore.get(),
  generateSpeech: generateTTS,
  encodeAudioBody: (audio) => Buffer.from(audio),
  diagnostics: diagnosticsService,
}

export async function synthesizeSpeech(body: unknown): Promise<TtsActionResult> {
  return synthesizeSpeechAction(body, ttsActionOptions)
}
