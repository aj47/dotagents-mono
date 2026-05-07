import type { RendererHandlers } from "@shared/renderer-handlers"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopCreateRecordingRequest {
  recording: ArrayBuffer
  pcmRecording?: ArrayBuffer
  duration: number
}

export interface DesktopCreateRecordingResult {
  transcript?: string
}

export interface DesktopCreateTextInputRequest {
  text: string
}

export interface DesktopRecordEventRequest {
  type: "start" | "end"
  mcpMode?: boolean
}

export interface DesktopTranscribeChunkRequest {
  recording: ArrayBuffer
  pcmRecording?: ArrayBuffer
}

export interface DesktopTranscribeChunkResult {
  text?: string
}

export const desktopDictationClient = {
  onStartRecording(listener: RendererHandlers["startRecording"]): () => void {
    return rendererHandlers.startRecording.listen(listener)
  },

  onFinishRecording(listener: RendererHandlers["finishRecording"]): () => void {
    return rendererHandlers.finishRecording.listen(listener)
  },

  onStopRecording(listener: RendererHandlers["stopRecording"]): () => void {
    return rendererHandlers.stopRecording.listen(listener)
  },

  onStartOrFinishRecording(listener: RendererHandlers["startOrFinishRecording"]): () => void {
    return rendererHandlers.startOrFinishRecording.listen(listener)
  },

  onStartMcpRecording(listener: RendererHandlers["startMcpRecording"]): () => void {
    return rendererHandlers.startMcpRecording.listen(listener)
  },

  onFinishMcpRecording(listener: RendererHandlers["finishMcpRecording"]): () => void {
    return rendererHandlers.finishMcpRecording.listen(listener)
  },

  onStartOrFinishMcpRecording(listener: RendererHandlers["startOrFinishMcpRecording"]): () => void {
    return rendererHandlers.startOrFinishMcpRecording.listen(listener)
  },

  createRecording(request: DesktopCreateRecordingRequest): Promise<DesktopCreateRecordingResult> {
    return tipcClient.createRecording(request) as Promise<DesktopCreateRecordingResult>
  },

  createTextInput(request: DesktopCreateTextInputRequest): Promise<void> {
    return tipcClient.createTextInput(request) as Promise<void>
  },

  recordEvent(request: DesktopRecordEventRequest): Promise<void> {
    return tipcClient.recordEvent(request) as Promise<void>
  },

  transcribeChunk(request: DesktopTranscribeChunkRequest): Promise<DesktopTranscribeChunkResult> {
    return tipcClient.transcribeChunk(request) as Promise<DesktopTranscribeChunkResult>
  },
}
