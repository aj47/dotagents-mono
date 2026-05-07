import type { UpdateDownloadedEvent } from "electron-updater"
import type { AgentProgressUpdate } from "@dotagents/shared/agent-progress"
import type { ElicitationRequest, SamplingRequest } from "@dotagents/shared/mcp-api"
import type { QueuedMessage } from "@dotagents/shared/message-queue-utils"
import type { AgentSession } from "./agent-session-types"

export type RendererHandlers = {
  startRecording: (data?: { fromButtonClick?: boolean }) => void
  finishRecording: () => void
  stopRecording: () => void
  startOrFinishRecording: (data?: { fromButtonClick?: boolean }) => void
  refreshRecordingHistory: () => void

  startMcpRecording: (data?: { conversationId?: string; conversationTitle?: string; sessionId?: string; fromTile?: boolean; fromButtonClick?: boolean; screenshot?: { name?: string; dataUrl: string } }) => void
  finishMcpRecording: () => void
  startOrFinishMcpRecording: (data?: { conversationId?: string; sessionId?: string; fromTile?: boolean; fromButtonClick?: boolean; screenshot?: { name?: string; dataUrl: string } }) => void

  showTextInput: (data?: { initialText?: string; conversationId?: string; conversationTitle?: string }) => void
  hideTextInput: () => void

  agentProgressUpdate: (update: AgentProgressUpdate) => void
  clearAgentProgress: () => void
  emergencyStopAgent: () => void
  onPanelSizeChanged: (size: { width: number; height: number }) => void
  clearAgentSessionProgress: (sessionId: string) => void
  clearInactiveSessions: () => void

  stopAllTts: () => void

  panelVisibilityChanged: (data: { visible: boolean }) => void

  agentSessionsUpdated: (data: {
    activeSessions: AgentSession[]
    recentCompletedSessions: AgentSession[]
    recentSessions?: AgentSession[]
  }) => void

  focusAgentSession: (sessionId: string) => void
  setAgentSessionSnoozed: (data: { sessionId: string; isSnoozed: boolean }) => void

  clearSessionTTSKeys: (sessionId: string) => void

  onMessageQueueUpdate: (data: { conversationId: string; queue: QueuedMessage[]; isPaused: boolean }) => void

  transcriptionPreviewUpdate: (data: { text: string }) => void

  updateAvailable: (e: UpdateDownloadedEvent) => void
  navigate: (url: string) => void

  "mcp:elicitation-request": (request: ElicitationRequest) => void
  "mcp:elicitation-complete": (data: { elicitationId: string; requestId: string }) => void

  "mcp:sampling-request": (request: SamplingRequest) => void

  conversationHistoryChanged: () => void

  skillsFolderChanged: () => void

  loopsFolderChanged: () => void

  themeChanged: (themeMode: string) => void
}
