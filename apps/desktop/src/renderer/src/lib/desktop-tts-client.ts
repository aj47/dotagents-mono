import type { GenerateTtsInput, GenerateTtsOutput } from "@dotagents/shared/tts-api"
import type { RendererHandlers } from "@shared/renderer-handlers"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"

export const desktopTtsClient = {
  onStopAllTts(listener: RendererHandlers["stopAllTts"]): () => void {
    return rendererHandlers.stopAllTts.listen(listener)
  },

  onClearSessionTtsKeys(listener: RendererHandlers["clearSessionTTSKeys"]): () => void {
    return rendererHandlers.clearSessionTTSKeys.listen(listener)
  },

  generateSpeech(request: GenerateTtsInput): Promise<GenerateTtsOutput> {
    return tipcClient.generateSpeech(request) as Promise<GenerateTtsOutput>
  },
}
