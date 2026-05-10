import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopMcpTextInputRequest {
  text: string
  conversationId?: string
  sessionId?: string
  fromTile?: boolean
  startSnoozed?: boolean
}

export interface DesktopMcpSessionActionResult {
  conversationId?: string
  queued?: boolean
  queuedMessageId?: string
}

export interface DesktopMcpRecordingRequest {
  recording: ArrayBuffer
  pcmRecording?: ArrayBuffer
  duration: number
  conversationId?: string
  sessionId?: string
  screenshot?: {
    name?: string
    dataUrl: string
  }
  fromTile?: boolean
  startSnoozed?: boolean
}

export interface DesktopMcpTriggerRecordingRequest {
  conversationId?: string
  sessionId?: string
  fromTile?: boolean
}

export const desktopMcpSessionActionsClient = {
  createMcpTextInput(request: DesktopMcpTextInputRequest): Promise<DesktopMcpSessionActionResult> {
    return tipcClient.createMcpTextInput(request) as Promise<DesktopMcpSessionActionResult>
  },

  createMcpRecording(request: DesktopMcpRecordingRequest): Promise<DesktopMcpSessionActionResult> {
    return tipcClient.createMcpRecording(request) as Promise<DesktopMcpSessionActionResult>
  },

  triggerMcpRecording(request: DesktopMcpTriggerRecordingRequest): Promise<void> {
    return tipcClient.triggerMcpRecording(request) as Promise<void>
  },
}
