import { tipcClient } from "@renderer/lib/tipc-client"

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
