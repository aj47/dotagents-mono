import { UpdateDownloadedEvent } from "electron-updater"
import { AgentProgressUpdate, ElicitationRequest, SamplingRequest, QueuedMessage } from "../shared/types"
import type { AgentSession } from "./agent-session-tracker"

export type RendererHandlers = {
  startRecording: (data?: { fromButtonClick?: boolean }) => void
  finishRecording: () => void
  stopRecording: () => void
  startOrFinishRecording: (data?: { fromButtonClick?: boolean }) => void
  refreshRecordingHistory: () => void

  startMcpRecording: (data?: { conversationId?: string; conversationTitle?: string; sessionId?: string; fromTile?: boolean; fromButtonClick?: boolean }) => void
  finishMcpRecording: () => void
  startOrFinishMcpRecording: (data?: { conversationId?: string; sessionId?: string; fromTile?: boolean; fromButtonClick?: boolean }) => void

  showTextInput: (data?: { initialText?: string; conversationId?: string; conversationTitle?: string }) => void
  hideTextInput: () => void

  agentProgressUpdate: (update: AgentProgressUpdate) => void
  clearAgentProgress: () => void
  emergencyStopAgent: () => void
  onPanelSizeChanged: (size: { width: number; height: number }) => void
  clearAgentSessionProgress: (sessionId: string) => void
  clearInactiveSessions: () => void

  // Stop all in-progress TTS playback in this renderer window
  stopAllTts: () => void

  // Floating panel visibility changed (broadcast to all windows)
  panelVisibilityChanged: (data: { visible: boolean }) => void

  agentSessionsUpdated: (data: {
    activeSessions: AgentSession[]
    recentCompletedSessions: AgentSession[]
    recentSessions?: AgentSession[]
  }) => void

  focusAgentSession: (sessionId: string) => void
  setAgentSessionSnoozed: (data: { sessionId: string; isSnoozed: boolean }) => void

  // Message Queue handlers
  onMessageQueueUpdate: (data: { conversationId: string; queue: QueuedMessage[]; isPaused: boolean }) => void

  // Transcription preview - live partial transcript during recording
  transcriptionPreviewUpdate: (data: { text: string }) => void

  updateAvailable: (e: UpdateDownloadedEvent) => void
  navigate: (url: string) => void

  // MCP Elicitation handlers (Protocol 2025-11-25)
  "mcp:elicitation-request": (request: ElicitationRequest) => void
  "mcp:elicitation-complete": (data: { elicitationId: string; requestId: string }) => void

  // MCP Sampling handlers (Protocol 2025-11-25)
  "mcp:sampling-request": (request: SamplingRequest) => void

  // Conversation history changed (e.g. from remote server / mobile sync)
  conversationHistoryChanged: () => void

  // Skills folder change notification
  skillsFolderChanged: () => void

  // Repeat tasks folder change notification
  loopsFolderChanged: () => void

  // Theme sync across windows
  themeChanged: (themeMode: string) => void
}
