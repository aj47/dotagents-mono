import type { GenerateTtsInput, GenerateTtsOutput } from "@dotagents/shared/tts-api"
import { tipcClient } from "@renderer/lib/tipc-client"

export const desktopTtsClient = {
  generateSpeech(request: GenerateTtsInput): Promise<GenerateTtsOutput> {
    return tipcClient.generateSpeech(request) as Promise<GenerateTtsOutput>
  },
}
