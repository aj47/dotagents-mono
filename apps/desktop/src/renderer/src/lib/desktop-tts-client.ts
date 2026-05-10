import type { GenerateTtsInput, GenerateTtsOutput } from "@dotagents/shared/tts-api"
import type { DesktopTTSPlaybackCommand, DesktopTTSPlaybackRequest, DesktopTTSPlaybackState } from "@shared/types"
import type { RendererHandlers } from "@shared/renderer-handlers"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"

export const desktopTtsClient = {
  onStopAllTts(listener: RendererHandlers["stopAllTts"]): () => void {
    return rendererHandlers.stopAllTts.listen(listener)
  },

  onClearSessionTtsKeys(listener: RendererHandlers["clearSessionTTSKeys"]): () => void {
    return rendererHandlers.clearSessionTTSKeys.listen(listener)
  },

  onPlaybackStateChanged(listener: (state: DesktopTTSPlaybackState) => void): () => void {
    return rendererHandlers.ttsPlaybackStateChanged.listen(listener)
  },

  generateSpeech(request: GenerateTtsInput): Promise<GenerateTtsOutput> {
    return tipcClient.generateSpeech(request) as Promise<GenerateTtsOutput>
  },

  claimPlaybackKeys(request: { ttsKeys: string[]; sessionId?: string; forced?: boolean }): Promise<{ claimed: boolean }> {
    return tipcClient.claimTTSPlaybackKeys(request) as Promise<{ claimed: boolean }>
  },

  releasePlaybackKeys(request: { ttsKeys: string[] }): Promise<unknown> {
    return tipcClient.releaseTTSPlaybackKeys(request)
  },

  requestPlayback(request: DesktopTTSPlaybackRequest): Promise<{ success?: boolean; error?: string } | undefined> {
    return tipcClient.requestTTSPlayback(request) as Promise<{ success?: boolean; error?: string } | undefined>
  },

  controlPlayback(command: DesktopTTSPlaybackCommand): Promise<unknown> {
    return tipcClient.controlTTSPlayback(command)
  },

  getPlaybackState(): Promise<DesktopTTSPlaybackState | undefined> {
    return tipcClient.getTTSPlaybackState?.() as Promise<DesktopTTSPlaybackState | undefined>
  },
}
