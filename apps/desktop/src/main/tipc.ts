import fs from "fs"
import { logApp, logLLM, getDebugFlags } from "./debug"
import { getErrorMessage } from "./error-utils"
import { getRendererHandlers, tipc } from "@egoist/tipc/main"
import {
  showPanelWindow,
  showMainWindow,
  WINDOWS,
  resizePanelForAgentMode,
  resizePanelToNormal,
  closeAgentModeAndHidePanelWindow,
  getWindowRendererHandlers,
  setPanelMode,
  getCurrentPanelMode,
  hideFloatingPanelWindow,
  markManualResize,
  resetFloatingPanelPositionAndSize,
  setPanelFocusable,
  emergencyStopAgentMode,
  showPanelWindowAndShowTextInput,
  showPanelWindowAndStartMcpRecording,
  WAVEFORM_MIN_HEIGHT,
  TEXT_INPUT_MIN_WIDTH,
  TEXT_INPUT_MIN_HEIGHT,
  PROGRESS_MIN_HEIGHT,
  MIN_WAVEFORM_WIDTH,
  LEGACY_WAVEFORM_SIZE_MAX_WIDTH,
  LEGACY_WAVEFORM_SIZE_MAX_HEIGHT,
  PANEL_SAVED_SIZE_MAX_WIDTH,
  PANEL_SAVED_SIZE_MAX_HEIGHT,
  clearPanelOpenedWithMain,
  resizePanelForWaveformPreview,
} from "./window"
import {
  setTrackedAgentSessionSnoozed,
  snoozeAgentSessionsAndHidePanelWindow,
} from "./floating-panel-session-state"
import {
  app,
  clipboard,
  Menu,
  shell,
  systemPreferences,
  dialog,
  BrowserWindow,
} from "electron"
import path from "path"
import { configStore, recordingsFolder, conversationsFolder } from "./config"
import type { AgentProgressUpdate, AgentStepSummary } from "@dotagents/shared/agent-progress"
import type {
  Conversation,
  ConversationHistoryItem,
  ConversationMessage,
} from "@dotagents/shared/conversation-domain"
import type {
  KnowledgeNote,
  KnowledgeNoteContext,
  KnowledgeNoteDateFilter,
  KnowledgeNoteSort,
} from "@dotagents/shared/knowledge-note-domain"
import type { MCPConfig, MCPServerConfig } from "@dotagents/shared/mcp-utils"
import type { RecordingHistoryItem } from "@dotagents/shared/types"
import type { Config } from "../shared/types"
import type { PanelPosition } from "@dotagents/shared/api-types"
import type {
  AgentProfile,
  AgentProfileConnection,
  AgentProfileRole,
  AgentProfileToolConfig,
  LoopConfig,
  ProfileModelConfig,
  ProfileSkillsConfig,
  SessionProfileSnapshot,
} from "@dotagents/core"
import { DEFAULT_STT_MODELS, getConfiguredSttModel } from "@dotagents/shared/stt-models"
import { DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED } from "@dotagents/shared/providers"
import { DEFAULT_TTS_ENABLED } from "@dotagents/shared/text-to-speech-settings"
import { buildConversationImageMarkdownMessage } from "@dotagents/shared/conversation-media-assets"
import {
  DEFAULT_MCP_AUTO_PASTE_DELAY,
  DEFAULT_MCP_AUTO_PASTE_ENABLED,
  DEFAULT_MCP_MESSAGE_QUEUE_ENABLED,
  parseMcpServerConfigImportRequestBody,
} from "@dotagents/shared/mcp-api"
import { conversationService } from "./conversation-service"
import { RendererHandlers } from "./renderer-handlers"
import {
  postProcessTranscript,
  processTranscriptWithTools,
} from "./llm"
import { mcpService, WHATSAPP_SERVER_NAME, getInternalWhatsAppServerPath } from "./mcp-service"
import {
  saveCustomPosition,
  updatePanelPosition,
  constrainPositionToScreen,
} from "./panel-position"
import { state, agentProcessManager, suppressPanelAutoShow, isPanelAutoShowSuppressed, toolApprovalManager, agentSessionStateManager } from "./state"
import { generateTTS } from "./tts-service"


import { startRemoteServer, stopRemoteServer, restartRemoteServer, printQRCodeToTerminal, getRemoteServerStatus, getRemoteServerPairingApiKey } from "./remote-server"
import { getDiscordLifecycleAction } from "./discord-config"
import { discordService } from "./discord-service"
import { applyDesktopShellSettings } from "./desktop-shell-settings"
import { emitAgentProgress } from "./emit-agent-progress"
import { agentSessionTracker } from "./agent-session-tracker"
import { messageQueueService } from "./message-queue-service"
import { agentProfileService, createSessionSnapshotFromProfile, toolConfigToMcpServerConfig } from "./agent-profile-service"
import { processWithAgentMode } from "./agent-loop-runner"
import {
  processQueuedMessages,
  pauseMessageQueueByConversationId,
  removeQueuedMessageById,
  retryQueuedMessageById,
  resumeMessageQueueByConversationId,
  updateQueuedMessageTextById,
} from "./message-queue-actions"
import { fetchModelsDevData, getModelFromModelsDevByProviderId, findBestModelMatch, refreshModelsDevCache } from "./models-dev-service"
import * as parakeetStt from "./parakeet-stt"
import { loopService } from "./loop-service"
import { clearSessionUserResponse } from "./session-user-response-store"
import { isMissingApiKeyErrorMessage } from "@dotagents/shared/api-key-error-utils"
import { hasRepeatTaskTitlePrefix } from "@dotagents/shared/repeat-task-utils"
import { stopAgentSessionById } from "./agent-session-actions"
import { describeAgentSessionId } from "./agent-run-utils"

export { runAgentLoopSession } from "./agent-loop-runner"

function parseMcpConfigImportBody(body: unknown): MCPConfig {
  const parsedRequest = parseMcpServerConfigImportRequestBody(body)
  if (parsedRequest.ok === false) {
    throw new Error(parsedRequest.error)
  }
  return parsedRequest.request.config as MCPConfig
}

async function withRepeatTaskSessionFlag<T extends {
  conversationId?: string
  conversationTitle?: string
}>(session: T): Promise<T & { isRepeatTask?: boolean }> {
  if (hasRepeatTaskTitlePrefix(session.conversationTitle)) {
    return { ...session, isRepeatTask: true }
  }

  const loops = loopService.getLoops()
  const title = session.conversationTitle?.trim()
  if (title && loops.some((loop) => loop.name.trim() === title)) {
    return { ...session, isRepeatTask: true }
  }

  if (session.conversationId) {
    try {
      const conversation = await conversationService.loadConversation(session.conversationId)
      const firstUserMessage = conversation?.messages
        ?.find((message) => message.role === "user" && message.content.trim())
        ?.content.trim()
      if (
        firstUserMessage &&
        loops.some((loop) => loop.prompt.trim() === firstUserMessage)
      ) {
        return { ...session, isRepeatTask: true }
      }
    } catch (error) {
      logApp("[tipc] Failed to inspect session conversation for repeat-task grouping", {
        conversationId: session.conversationId,
        error,
      })
    }
  }

  return session
}

const isFinitePanelSize = (value: unknown): value is { width: number; height: number } =>
  !!value &&
  typeof value === "object" &&
  "width" in value &&
  "height" in value &&
  typeof (value as { width: unknown }).width === "number" &&
  typeof (value as { height: unknown }).height === "number" &&
  Number.isFinite((value as { width: number }).width) &&
  Number.isFinite((value as { height: number }).height)

const isBoundedPanelSize = (value: unknown): value is { width: number; height: number } =>
  isFinitePanelSize(value) &&
  value.width <= PANEL_SAVED_SIZE_MAX_WIDTH &&
  value.height <= PANEL_SAVED_SIZE_MAX_HEIGHT

type PanelSizeMode = "normal" | "agent" | "textInput"

const isPanelSizeMode = (value: unknown): value is PanelSizeMode =>
  value === "normal" || value === "agent" || value === "textInput"

const getPanelMinWidthForMode = (mode: PanelSizeMode) =>
  mode === "textInput" ? TEXT_INPUT_MIN_WIDTH : Math.max(200, MIN_WAVEFORM_WIDTH)

const getPanelMinHeightForMode = (mode: PanelSizeMode) =>
  mode === "agent"
    ? PROGRESS_MIN_HEIGHT
    : mode === "textInput"
      ? TEXT_INPUT_MIN_HEIGHT
      : WAVEFORM_MIN_HEIGHT

const normalizePanelSize = (
  input: { width: number; height: number },
  minWidth: number,
  minHeight: number,
) => ({
  width: Math.min(PANEL_SAVED_SIZE_MAX_WIDTH, Math.max(minWidth, Math.round(input.width))),
  height: Math.min(PANEL_SAVED_SIZE_MAX_HEIGHT, Math.max(minHeight, Math.round(input.height))),
})

/**
 * Convert Float32Array audio samples to WAV format buffer
 */
function float32ToWav(samples: Float32Array, sampleRate: number): Buffer {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const dataSize = samples.length * (bitsPerSample / 8)
  const headerSize = 44
  const totalSize = headerSize + dataSize

  const buffer = Buffer.alloc(totalSize)
  let offset = 0

  // RIFF header
  buffer.write('RIFF', offset); offset += 4
  buffer.writeUInt32LE(totalSize - 8, offset); offset += 4
  buffer.write('WAVE', offset); offset += 4

  // fmt subchunk
  buffer.write('fmt ', offset); offset += 4
  buffer.writeUInt32LE(16, offset); offset += 4 // subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, offset); offset += 2  // audioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, offset); offset += 2
  buffer.writeUInt32LE(sampleRate, offset); offset += 4
  buffer.writeUInt32LE(byteRate, offset); offset += 4
  buffer.writeUInt16LE(blockAlign, offset); offset += 2
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2

  // data subchunk
  buffer.write('data', offset); offset += 4
  buffer.writeUInt32LE(dataSize, offset); offset += 4

  // Convert Float32 samples to 16-bit PCM
  for (let i = 0; i < samples.length; i++) {
    // Clamp to [-1, 1] and scale to 16-bit signed integer range
    const sample = Math.max(-1, Math.min(1, samples[i]))
    const intSample = Math.round(sample * 32767)
    buffer.writeInt16LE(intSample, offset)
    offset += 2
  }

  return buffer
}

async function postProcessTranscriptSafely(transcript: string, context: string): Promise<string> {
  const config = configStore.get()

  if (!(config.transcriptPostProcessingEnabled ?? DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED)) {
    return transcript
  }

  try {
    return await postProcessTranscript(transcript)
  } catch (error) {
    logLLM(`[${context}] Transcript post-processing failed, using raw transcript instead:`, error)
    return transcript
  }
}

function getRemoteSttModel(config: Config): string {
  return getConfiguredSttModel(config) || DEFAULT_STT_MODELS.openai
}

import { diagnosticsService } from "./diagnostics"
import { knowledgeNotesService } from "./knowledge-notes-service"
import { summarizationService } from "./summarization-service"
import { updateTrayIcon } from "./tray"
import { isAccessibilityGranted } from "./utils"
import { writeText, writeTextWithFocusRestore } from "./keyboard"



const t = tipc.create()

type ScreenshotAttachmentInput = { name?: string; dataUrl: string }

function appendScreenshotToTranscript(transcript: string, screenshot?: ScreenshotAttachmentInput): string {
  if (!screenshot?.dataUrl) return transcript

  return buildConversationImageMarkdownMessage(transcript, [{
    url: screenshot.dataUrl,
    altText: screenshot.name,
    fallbackAltText: "Screen selection",
  }])
}

function getLatestStoredUserMessageContent(conversation: Conversation | null, fallback: string): string {
  const latestUserMessage = conversation?.messages
    ?.slice()
    .reverse()
    .find((message) => message.role === "user")
  return latestUserMessage?.content || fallback
}

const getRecordingHistory = () => {
  try {
    const history = JSON.parse(
      fs.readFileSync(path.join(recordingsFolder, "history.json"), "utf8"),
    ) as RecordingHistoryItem[]

    // sort desc by createdAt
    return history.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

const saveRecordingsHitory = (history: RecordingHistoryItem[]) => {
  fs.writeFileSync(
    path.join(recordingsFolder, "history.json"),
    JSON.stringify(history),
  )
}

async function refreshRuntimeAfterBundleImport(): Promise<void> {
  try {
    configStore.reload()
  } catch (error) {
    logApp("[tipc] Failed to reload config after bundle load", { error })
  }

  try {
    agentProfileService.reload()
  } catch (error) {
    logApp("[tipc] Failed to reload agent profiles after bundle load", { error })
  }

  try {
    const { skillsService } = await import("./skills-service")
    skillsService.scanSkillsFolder()
  } catch (error) {
    logApp("[tipc] Failed to reload skills after bundle load", { error })
  }

  try {
    loopService.stopAllLoops()
    loopService.reload()
    loopService.resumeScheduling()
    loopService.startAllLoops()
  } catch (error) {
    logApp("[tipc] Failed to reload repeat tasks after bundle load", { error })
    // Avoid leaving loop scheduling paused if stopAllLoops() succeeded but reload/start failed.
    try {
      loopService.resumeScheduling()
    } catch {
      // best-effort
    }
  }

  try {
    await knowledgeNotesService.reload()
  } catch (error) {
    logApp("[tipc] Failed to reload knowledge notes after bundle load", { error })
  }

  try {
    const config = configStore.get()
    const configuredServers = config.mcpConfig?.mcpServers || {}
    const serverStatusBeforeRefresh = mcpService.getServerStatus()

    // Stop servers that were removed/disabled by the imported bundle.
    for (const [serverName, status] of Object.entries(serverStatusBeforeRefresh)) {
      const serverConfig = configuredServers[serverName]
      const shouldBeStopped = !serverConfig || !!(serverConfig as MCPServerConfig).disabled
      if (!shouldBeStopped) continue

      const stopResult = await mcpService.stopServer(serverName)
      if (!stopResult.success) {
        logApp("[tipc] Failed to stop MCP server after bundle load", {
          serverName,
          error: stopResult.error,
          wasConnected: status.connected,
        })
      }
    }

    const serverStatusAfterStops = mcpService.getServerStatus()

    // Restart currently connected enabled servers so overwritten configs take effect immediately.
    for (const [serverName, serverConfig] of Object.entries(configuredServers)) {
      if ((serverConfig as MCPServerConfig).disabled) continue
      const status = serverStatusAfterStops[serverName]
      if (status?.runtimeEnabled === false) continue
      if (!status?.connected) continue

      const restartResult = await mcpService.restartServer(serverName)
      if (!restartResult.success) {
        logApp("[tipc] Failed to restart MCP server after bundle load", {
          serverName,
          error: restartResult.error,
        })
      }
    }

    // Start any newly imported enabled servers that were previously absent.
    await mcpService.initialize()
  } catch (error) {
    logApp("[tipc] Failed to reinitialize MCP after bundle load", { error })
  }
}

type BundleConflictItem = {
  id: string
  name: string
  existingName?: string
}

type BundleConflictMap = {
  agentProfiles: BundleConflictItem[]
  mcpServers: BundleConflictItem[]
  skills: BundleConflictItem[]
  repeatTasks: BundleConflictItem[]
  knowledgeNotes: BundleConflictItem[]
}

type BundleConflictPreview = {
  success: boolean
  conflicts?: BundleConflictMap
}

const BUNDLE_CONFLICT_KEYS: Array<keyof BundleConflictMap> = [
  "agentProfiles",
  "mcpServers",
  "skills",
  "repeatTasks",
  "knowledgeNotes",
]

function mergeConflictItems(
  primary: BundleConflictItem[] | undefined,
  secondary: BundleConflictItem[] | undefined
): BundleConflictItem[] {
  const merged = new Map<string, BundleConflictItem>()

  for (const item of primary || []) {
    if (!item?.id) continue
    merged.set(item.id, item)
  }
  for (const item of secondary || []) {
    if (!item?.id) continue
    merged.set(item.id, item)
  }

  return Array.from(merged.values())
}

function mergeConflictMaps(
  primary: BundleConflictMap | undefined,
  secondary: BundleConflictMap | undefined
): BundleConflictMap | undefined {
  if (!primary && !secondary) return undefined

  const merged: BundleConflictMap = {
    agentProfiles: [],
    mcpServers: [],
    skills: [],
    repeatTasks: [],
    knowledgeNotes: [],
  }

  for (const key of BUNDLE_CONFLICT_KEYS) {
    merged[key] = mergeConflictItems(primary?.[key], secondary?.[key])
  }

  return merged
}

type OpenFileResult = {
  success: boolean
  error?: string
  path?: string
}

function revealFileInFolder(filePath: string): OpenFileResult {
  if (!fs.existsSync(filePath)) {
    return { success: false, path: filePath, error: "File does not exist" }
  }

  try {
    shell.showItemInFolder(filePath)
    return { success: true, path: filePath }
  } catch (error) {
    return {
      success: false,
      path: filePath,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export const router = {
  restartApp: t.procedure.action(async () => {
    app.relaunch()
    app.quit()
  }),

  getUpdateInfo: t.procedure.action(async () => {
    const { getUpdateInfo } = await import("./updater")
    return getUpdateInfo()
  }),

  quitAndInstall: t.procedure.action(async () => {
    const { quitAndInstall } = await import("./updater")

    quitAndInstall()
  }),

  checkForUpdatesAndDownload: t.procedure.action(async () => {
    const { checkForUpdatesAndDownload } = await import("./updater")

    return checkForUpdatesAndDownload()
  }),

  openMicrophoneInSystemPreferences: t.procedure.action(async () => {
    await shell.openExternal(
      "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone",
    )
  }),

  hidePanelWindow: t.procedure.action(async () => {
    logApp("[hidePanelWindow] Hiding floating panel", {
      panelMode: getCurrentPanelMode(),
      panelVisible: WINDOWS.get("panel")?.isVisible?.() ?? false,
      textInputActive: state.isTextInputActive,
    })
    hideFloatingPanelWindow()
  }),

  getFloatingPanelVisibility: t.procedure.action(async () => {
    return { visible: WINDOWS.get("panel")?.isVisible?.() ?? false }
  }),

  snoozeAgentSessionsAndHidePanelWindow: t.procedure
    .input<{ sessionIds?: string[] }>()
    .action(async ({ input }) => {
      snoozeAgentSessionsAndHidePanelWindow(input.sessionIds)
      return { success: true }
    }),

  resetFloatingPanel: t.procedure.action(async () => {
    resetFloatingPanelPositionAndSize(true)
    return { success: true }
  }),

  resizePanelForAgentMode: t.procedure.action(async () => {
    resizePanelForAgentMode()
  }),

  resizePanelToNormal: t.procedure.action(async () => {
    resizePanelToNormal()
  }),

  resizePanelForWaveformPreview: t.procedure
    .input<{ showPreview: boolean }>()
    .action(async ({ input }) => {
      resizePanelForWaveformPreview(input.showPreview)
    }),

  setPanelMode: t.procedure
    .input<{ mode: "normal" | "agent" | "textInput" }>()
    .action(async ({ input }) => {
      setPanelMode(input.mode)
      return { success: true }
    }),

  /**
   * Set the focusability of the panel window.
   * Used to enable input interaction when agent has completed or when user wants to queue messages.
   * @param focusable - Whether the panel should be focusable
   * @param andFocus - If true and focusable is true, also focus the window (needed for macOS)
   */
  setPanelFocusable: t.procedure
    .input<{ focusable: boolean; andFocus?: boolean }>()
    .action(async ({ input }) => {
      setPanelFocusable(input.focusable, input.andFocus ?? false)
      return { success: true }
    }),

  debugPanelState: t.procedure.action(async () => {
    const panel = WINDOWS.get("panel")
    const state = {
      exists: !!panel,
      isVisible: panel?.isVisible() || false,
      isDestroyed: panel?.isDestroyed() || false,
      bounds: panel?.getBounds() || null,
      isAlwaysOnTop: panel?.isAlwaysOnTop() || false,
    }
    return state
  }),

  // Panel position management
  setPanelPosition: t.procedure
    .input<{ position: PanelPosition }>()
    .action(async ({ input }) => {
      updatePanelPosition(input.position)

      // Update the panel position if it's currently visible
      const panel = WINDOWS.get("panel")
      if (panel && panel.isVisible()) {
        showPanelWindow()
      }
    }),

  savePanelCustomPosition: t.procedure
    .input<{ x: number; y: number }>()
    .action(async ({ input }) => {
      // Get current panel size to constrain position
      const panel = WINDOWS.get("panel")
      if (panel) {
        const bounds = panel.getBounds()
        const constrainedPosition = constrainPositionToScreen(
          { x: input.x, y: input.y },
          { width: bounds.width, height: bounds.height },
        )

        saveCustomPosition(constrainedPosition)

        // Update the panel position immediately
        panel.setPosition(constrainedPosition.x, constrainedPosition.y)
      }
    }),

  updatePanelPosition: t.procedure
    .input<{ x: number; y: number }>()
    .action(async ({ input }) => {
      const panel = WINDOWS.get("panel")
      if (panel) {
        const bounds = panel.getBounds()
        const constrainedPosition = constrainPositionToScreen(
          { x: input.x, y: input.y },
          { width: bounds.width, height: bounds.height },
        )

        panel.setPosition(constrainedPosition.x, constrainedPosition.y)
      }
    }),

  getPanelPosition: t.procedure.action(async () => {
    const panel = WINDOWS.get("panel")
    if (panel) {
      const bounds = panel.getBounds()
      return { x: bounds.x, y: bounds.y }
    }
    return { x: 0, y: 0 }
  }),

  emergencyStopAgent: t.procedure.action(async () => {
    await emergencyStopAgentMode()

    return { success: true, message: "Agent mode emergency stopped" }
  }),

  stopAllTts: t.procedure.action(async () => {
    let windowsNotified = 0
    for (const [id, win] of WINDOWS.entries()) {
      try {
        const stopAllTtsHandler = getRendererHandlers<RendererHandlers>(win.webContents).stopAllTts
        if (!stopAllTtsHandler) continue
        stopAllTtsHandler.send()
        windowsNotified += 1
      } catch (e) {
        logApp(`[tipc] stopAllTts send to ${id} failed:`, e)
      }
    }

    logApp("[tipc] stopAllTts broadcast complete", {
      windowsNotified,
      totalWindows: WINDOWS.size,
    })
    return { success: true, windowsNotified }
  }),

  clearAgentProgress: t.procedure.action(async () => {
    // Send to all windows so both main and panel can update their state
    for (const [id, win] of WINDOWS.entries()) {
      try {
        getRendererHandlers<RendererHandlers>(win.webContents).clearAgentProgress.send()
      } catch (e) {
        logApp(`[tipc] clearAgentProgress send to ${id} failed:`, e)
      }
    }

    return { success: true }
  }),

  clearAgentSessionProgress: t.procedure
    .input<{ sessionId: string }>()
    .action(async ({ input }) => {
      // Session is being explicitly dismissed from UI; clear persisted
      // respond_to_user state for this session.
      clearSessionUserResponse(input.sessionId)

      // Also remove from the tracker's completed sessions list so it
      // doesn't re-appear in the sidebar on the next agentSessionsUpdated.
      agentSessionTracker.removeCompletedSession(input.sessionId)

      // Send to all windows (panel and main) so both can update their state
      for (const [id, win] of WINDOWS.entries()) {
        try {
          getRendererHandlers<RendererHandlers>(win.webContents).clearAgentSessionProgress?.send(input.sessionId)
        } catch (e) {
          logApp(`[tipc] clearAgentSessionProgress send to ${id} failed:`, e)
        }
      }
      return { success: true }
    }),

  clearInactiveSessions: t.procedure.action(async () => {
    // Clear completed sessions from the tracker
    agentSessionTracker.clearCompletedSessions((session) => {
      if (!session.conversationId) return true
      return messageQueueService.getQueue(session.conversationId).length === 0
    })

    // Send to all windows so both main and panel can update their state
    for (const [id, win] of WINDOWS.entries()) {
      try {
        getRendererHandlers<RendererHandlers>(win.webContents).clearInactiveSessions?.send()
      } catch (e) {
        logApp(`[tipc] clearInactiveSessions send to ${id} failed:`, e)
      }
    }

    return { success: true }
  }),

  closeAgentModeAndHidePanelWindow: t.procedure.action(async () => {
    closeAgentModeAndHidePanelWindow()
    return { success: true }
  }),

  getAgentStatus: t.procedure.action(async () => {
    return {
      isAgentModeActive: state.isAgentModeActive,
      shouldStopAgent: state.shouldStopAgent,
      agentIterationCount: state.agentIterationCount,
      activeProcessCount: agentProcessManager.getActiveProcessCount(),
    }
  }),

  getAgentSessions: t.procedure.action(async () => {
      const activeSessions = await Promise.all(
        agentSessionTracker.getActiveSessions().map(withRepeatTaskSessionFlag),
      )
      const recentCompletedSessions = await Promise.all(
        agentSessionTracker.getRecentSessions(4).map(withRepeatTaskSessionFlag),
      )
      return {
      activeSessions,
      recentCompletedSessions,
      // Backward-compatible alias while renderer code migrates.
      recentSessions: recentCompletedSessions,
    }
  }),

  // List active + recent completed sessions for UI pickers (e.g. repeat-task
  // "continue from session" selector). Returns the shape the picker needs,
  // tolerant of an optional limit for completed sessions.
  listAgentSessionCandidates: t.procedure
    .input<{ limit?: number } | undefined>()
    .action(async ({ input }) => {
      // Guard against NaN / non-finite inputs; fall back to the default of 20.
      const rawLimit = input?.limit
      const limit = typeof rawLimit === "number" && Number.isFinite(rawLimit)
        ? Math.max(1, Math.min(100, Math.floor(rawLimit)))
        : 20
      const active = agentSessionTracker.getActiveSessions().map(s => ({
        id: s.id,
        conversationId: s.conversationId,
        conversationTitle: s.conversationTitle,
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
      }))
      const completed = agentSessionTracker.getRecentSessions(limit).map(s => ({
        id: s.id,
        conversationId: s.conversationId,
        conversationTitle: s.conversationTitle,
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
      }))
      return { activeSessions: active, completedSessions: completed }
    }),

  // Get the profile snapshot for a specific session
  // This allows the UI to display which profile a session is using
  getSessionProfileSnapshot: t.procedure
    .input<{ sessionId: string }>()
    .action(async ({ input }) => {
      return agentSessionStateManager.getSessionProfileSnapshot(input.sessionId)
        ?? agentSessionTracker.getSessionProfileSnapshot(input.sessionId)
    }),

  stopAgentSession: t.procedure
    .input<{ sessionId: string }>()
    .action(async ({ input }) => {
      return stopAgentSessionById(input.sessionId)
    }),

  snoozeAgentSession: t.procedure
    .input<{ sessionId: string }>()
    .action(async ({ input }) => {
      // Snooze the session (runs in background without stealing focus)
      setTrackedAgentSessionSnoozed(input.sessionId, true)

      return { success: true }
    }),

  unsnoozeAgentSession: t.procedure
    .input<{ sessionId: string }>()
    .action(async ({ input }) => {
      // Unsnooze the session (allow it to show progress UI again)
      setTrackedAgentSessionSnoozed(input.sessionId, false)

      return { success: true }
    }),

  // Respond to a tool approval request
  respondToToolApproval: t.procedure
    .input<{ approvalId: string; approved: boolean }>()
    .action(async ({ input }) => {
      logApp(`[Tool Approval] respondToToolApproval called: approvalId=${input.approvalId}, approved=${input.approved}`)
      const success = toolApprovalManager.respondToApproval(input.approvalId, input.approved)
      logApp(`[Tool Approval] respondToApproval result: success=${success}`)
      return { success }
    }),

  // Request the Panel window to focus a specific agent session
  focusAgentSession: t.procedure
    .input<{ sessionId: string }>()
    .action(async ({ input }) => {
      try {
        getWindowRendererHandlers("panel")?.focusAgentSession.send(input.sessionId)
      } catch (e) {
        logApp("[tipc] focusAgentSession send failed:", e)
      }
      return { success: true }
    }),

  writeClipboard: t.procedure
    .input<{ text: string }>()
    .action(async ({ input }) => {
      clipboard.writeText(input.text ?? "")
      return { success: true }
    }),

  showContextMenu: t.procedure
    .input<{
      x: number
      y: number
      selectedText?: string
      messageContext?: {
        content: string
        role: "user" | "assistant" | "tool"
        messageId: string
      }
    }>()
    .action(async ({ input, context }) => {
      const items: Electron.MenuItemConstructorOptions[] = []

      if (input.selectedText) {
        items.push({
          label: "Copy",
          click() {
            clipboard.writeText(input.selectedText || "")
          },
        })
      }

      // Add message-specific context menu items
      if (input.messageContext) {
        const { content, role } = input.messageContext

        // Add "Copy Message" option for all message types
        items.push({
          label: "Copy Message",
          click() {
            clipboard.writeText(content)
          },
        })

        // Add separator if we have other items
        if (items.length > 0) {
          items.push({ type: "separator" })
        }
      }

      if (import.meta.env.DEV) {
        items.push({
          label: "Inspect Element",
          click() {
            context.sender.inspectElement(input.x, input.y)
          },
        })
      }

      const panelWindow = WINDOWS.get("panel")
      const isPanelWindow = panelWindow?.webContents.id === context.sender.id

      if (isPanelWindow) {
        items.push({
          label: "Close",
          click() {
            hideFloatingPanelWindow()
          },
        })
      }

      const menu = Menu.buildFromTemplate(items)
      menu.popup({
        x: input.x,
        y: input.y,
      })
    }),

  getMicrophoneStatus: t.procedure.action(async () => {
    return systemPreferences.getMediaAccessStatus("microphone")
  }),

  isAccessibilityGranted: t.procedure.action(async () => {
    return isAccessibilityGranted()
  }),

  requestAccesssbilityAccess: t.procedure.action(async () => {
    if (process.platform === "win32") return true

    return systemPreferences.isTrustedAccessibilityClient(true)
  }),

  requestMicrophoneAccess: t.procedure.action(async () => {
    return systemPreferences.askForMediaAccess("microphone")
  }),

  showPanelWindow: t.procedure.action(async () => {
    showPanelWindow()
  }),

  showPanelWindowWithTextInput: t.procedure
    .input<{ initialText?: string }>()
    .action(async ({ input }) => {
      await showPanelWindowAndShowTextInput(input.initialText)
    }),

  triggerMcpRecording: t.procedure
    .input<{ conversationId?: string; sessionId?: string; fromTile?: boolean }>()
    .action(async ({ input }) => {
      // Always show the panel during recording for waveform feedback
      // The fromTile flag tells the panel to hide after recording ends
      // fromButtonClick=true indicates this was triggered via UI button (not keyboard shortcut)
      await showPanelWindowAndStartMcpRecording(input.conversationId, input.sessionId, input.fromTile, true)
    }),

  // Broadcast theme change to all windows (cross-window sync)
  broadcastThemeChange: t.procedure
    .input<{ themeMode: string }>()
    .action(async ({ input }) => {
      for (const [, win] of WINDOWS) {
        try {
          getRendererHandlers<RendererHandlers>(win.webContents)?.themeChanged.send(input.themeMode)
        } catch {}
      }
    }),

  showMainWindow: t.procedure
    .input<{ url?: string }>()
    .action(async ({ input }) => {
      showMainWindow(input.url)
    }),

  displayError: t.procedure
    .input<{ title?: string; message: string }>()
    .action(async ({ input }) => {
      if (isMissingApiKeyErrorMessage(input.message)) {
        const result = await dialog.showMessageBox({
          type: "error",
          title: input.title || "Error",
          message: input.message,
          detail: "Configure your API key in Settings > Models.",
          buttons: ["Open Model Settings", "Close"],
          defaultId: 0,
          cancelId: 1,
          noLink: true,
        })

        if (result.response === 0) {
          showMainWindow("/settings/models")
        }
        return
      }

      dialog.showErrorBox(input.title || "Error", input.message)
    }),

  // OAuth methods
  initiateOAuthFlow: t.procedure
    .input<string>()
    .action(async ({ input: serverName }) => {
      return mcpService.initiateOAuthFlow(serverName)
    }),

  completeOAuthFlow: t.procedure
    .input<{ serverName: string; code: string; state: string }>()
    .action(async ({ input }) => {
      return mcpService.completeOAuthFlow(input.serverName, input.code, input.state)
    }),

  getOAuthStatus: t.procedure
    .input<string>()
    .action(async ({ input: serverName }) => {
      return mcpService.getOAuthStatus(serverName)
    }),

  revokeOAuthTokens: t.procedure
    .input<string>()
    .action(async ({ input: serverName }) => {
      return mcpService.revokeOAuthTokens(serverName)
    }),

  // Parakeet (local) STT model management
  getParakeetModelStatus: t.procedure.action(async () => {
    return parakeetStt.getModelStatus()
  }),

  downloadParakeetModel: t.procedure.action(async () => {
    await parakeetStt.downloadModel()
    return { success: true }
  }),

  initializeParakeetRecognizer: t.procedure
    .input<{ numThreads?: number }>()
    .action(async ({ input }) => {
      await parakeetStt.initializeRecognizer(input.numThreads)
      return { success: true }
    }),

  // Kitten (local) TTS model management
  getKittenModelStatus: t.procedure.action(async () => {
    const { getKittenModelStatus } = await import('./kitten-tts')
    return getKittenModelStatus()
  }),

  downloadKittenModel: t.procedure.action(async () => {
    const { downloadKittenModel } = await import('./kitten-tts')
    await downloadKittenModel((progress) => {
      // Send progress to renderer via webContents, guarding against destroyed windows
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
          win.webContents.send('kitten-model-download-progress', progress)
        }
      })
    })
    return { success: true }
  }),

  synthesizeWithKitten: t.procedure
    .input<{
      text: string
      voiceId?: number
      speed?: number
    }>()
    .action(async ({ input }) => {
      const { synthesize } = await import('./kitten-tts')
      const result = await synthesize(input.text, input.voiceId, input.speed)
      // Convert Float32Array samples to WAV format
      const wavBuffer = float32ToWav(result.samples, result.sampleRate)
      return {
        audio: wavBuffer.toString('base64'),
        sampleRate: result.sampleRate
      }
    }),

  // Supertonic (local) TTS model management
  getSupertonicModelStatus: t.procedure.action(async () => {
    const { getSupertonicModelStatus } = await import('./supertonic-tts')
    return getSupertonicModelStatus()
  }),

  downloadSupertonicModel: t.procedure.action(async () => {
    const { downloadSupertonicModel } = await import('./supertonic-tts')
    await downloadSupertonicModel((progress) => {
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
          win.webContents.send('supertonic-model-download-progress', progress)
        }
      })
    })
    return { success: true }
  }),

  synthesizeWithSupertonic: t.procedure
    .input<{
      text: string
      voice?: string
      lang?: string
      speed?: number
      steps?: number
    }>()
    .action(async ({ input }) => {
      const { synthesize } = await import('./supertonic-tts')
      const result = await synthesize(
        input.text,
        input.voice,
        input.lang,
        input.speed,
        input.steps,
      )
      const wavBuffer = float32ToWav(result.samples, result.sampleRate)
      return {
        audio: wavBuffer.toString('base64'),
        sampleRate: result.sampleRate
      }
    }),

  createRecording: t.procedure
    .input<{
      recording: ArrayBuffer
      pcmRecording?: ArrayBuffer
      duration: number
    }>()
    .action(async ({ input }) => {
      fs.mkdirSync(recordingsFolder, { recursive: true })

      const config = configStore.get()
      let transcript: string

      if (config.sttProviderId === "parakeet") {
        // Use Parakeet (local) STT
        if (!parakeetStt.isModelReady()) {
          throw new Error("Parakeet model not downloaded. Please download it in Settings.")
        }

        // Initialize recognizer if needed
        await parakeetStt.initializeRecognizer(config.parakeetNumThreads)

        if (!input.pcmRecording) {
          throw new Error("Parakeet STT requires pre-decoded float32 PCM audio. pcmRecording was not provided.")
        }
        transcript = await parakeetStt.transcribe(input.pcmRecording, 16000)
        transcript = await postProcessTranscriptSafely(transcript, "createRecording")
      } else {
        // Use OpenAI or Groq for transcription
        const form = new FormData()
        form.append(
          "file",
          new File([input.recording], "recording.webm", { type: "audio/webm" }),
        )
        form.append(
          "model",
          getRemoteSttModel(config),
        )
        form.append("response_format", "json")

        // Add prompt parameter for Groq if provided
        if (config.sttProviderId === "groq" && config.groqSttPrompt?.trim()) {
          form.append("prompt", config.groqSttPrompt.trim())
        }

        // Add language parameter if specified
        const languageCode = config.sttProviderId === "groq"
          ? config.groqSttLanguage || config.sttLanguage
          : config.openaiSttLanguage || config.sttLanguage;

        if (languageCode && languageCode !== "auto") {
          form.append("language", languageCode)
        }

        const groqBaseUrl = config.groqBaseUrl || "https://api.groq.com/openai/v1"
        const openaiBaseUrl = config.openaiBaseUrl || "https://api.openai.com/v1"

        const transcriptResponse = await fetch(
          config.sttProviderId === "groq"
            ? `${groqBaseUrl}/audio/transcriptions`
            : `${openaiBaseUrl}/audio/transcriptions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.sttProviderId === "groq" ? config.groqApiKey : config.openaiApiKey}`,
            },
            body: form,
          },
        )

        if (!transcriptResponse.ok) {
          const message = `${transcriptResponse.statusText} ${(await transcriptResponse.text()).slice(0, 300)}`

          throw new Error(message)
        }

        const json: { text: string } = await transcriptResponse.json()
        transcript = await postProcessTranscriptSafely(json.text, "createRecording")
      }

      const history = getRecordingHistory()
      const item: RecordingHistoryItem = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        duration: input.duration,
        transcript,
      }
      history.push(item)
      saveRecordingsHitory(history)

      fs.writeFileSync(
        path.join(recordingsFolder, `${item.id}.webm`),
        Buffer.from(input.recording),
      )

      const main = WINDOWS.get("main")
      if (main) {
        getRendererHandlers<RendererHandlers>(
          main.webContents,
        ).refreshRecordingHistory.send()
      }

      const panel = WINDOWS.get("panel")
      if (panel) {
        // Clear the "opened with main" flag since panel is being hidden
        clearPanelOpenedWithMain()
        panel.hide()
      }

      // paste
      clipboard.writeText(transcript)
      if (isAccessibilityGranted()) {
        // Add a small delay for regular transcripts too to be less disruptive
        const pasteDelay = 500 // 0.5 second delay for regular transcripts
        setTimeout(async () => {
          try {
            await writeTextWithFocusRestore(transcript)
          } catch (error) {
            // Don't throw here, just log the error so the recording still gets saved
          }
        }, pasteDelay)
      }
    }),

  transcribeChunk: t.procedure
    .input<{
      recording: ArrayBuffer
      pcmRecording?: ArrayBuffer
    }>()
    .action(async ({ input }) => {
      const config = configStore.get()
      let transcript: string

      if (config.sttProviderId === "parakeet") {
        if (!parakeetStt.isModelReady()) {
          return { text: "" }
        }
        await parakeetStt.initializeRecognizer(config.parakeetNumThreads)
        // Use pcmRecording if provided, otherwise skip preview for Parakeet
        // (WebM buffer would fail validation)
        if (!input.pcmRecording) {
          return { text: "" }
        }
        transcript = await parakeetStt.transcribe(input.pcmRecording, 16000)
      } else {
        const form = new FormData()
        form.append(
          "file",
          new File([input.recording], "recording.webm", { type: "audio/webm" }),
        )
        form.append(
          "model",
          getRemoteSttModel(config),
        )
        form.append("response_format", "json")

        if (config.sttProviderId === "groq" && config.groqSttPrompt?.trim()) {
          form.append("prompt", config.groqSttPrompt.trim())
        }

        const languageCode = config.sttProviderId === "groq"
          ? config.groqSttLanguage || config.sttLanguage
          : config.openaiSttLanguage || config.sttLanguage;

        if (languageCode && languageCode !== "auto") {
          form.append("language", languageCode)
        }

        const groqBaseUrl = config.groqBaseUrl || "https://api.groq.com/openai/v1"
        const openaiBaseUrl = config.openaiBaseUrl || "https://api.openai.com/v1"

        const transcriptResponse = await fetch(
          config.sttProviderId === "groq"
            ? `${groqBaseUrl}/audio/transcriptions`
            : `${openaiBaseUrl}/audio/transcriptions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.sttProviderId === "groq" ? config.groqApiKey : config.openaiApiKey}`,
            },
            body: form,
          },
        )

        if (!transcriptResponse.ok) {
          const errBody = await transcriptResponse.text().catch(() => "<unreadable>")
          console.error(
            `[transcribeChunk] API error ${transcriptResponse.status} ${transcriptResponse.statusText}: ${errBody}`,
          )
          return { text: "" }
        }

        const json: { text: string } = await transcriptResponse.json()
        transcript = json.text || ""
      }

      return { text: transcript }
    }),

  createTextInput: t.procedure
    .input<{
      text: string
    }>()
    .action(async ({ input }) => {
      const config = configStore.get()
      let processedText = input.text

      // Apply post-processing if enabled
      if (config.transcriptPostProcessingEnabled ?? DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED) {
        try {
          processedText = await postProcessTranscript(input.text)
        } catch (error) {
          // Continue with original text if post-processing fails
        }
      }

      // Save to history
      const history = getRecordingHistory()
      const item: RecordingHistoryItem = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        duration: 0, // Text input has no duration
        transcript: processedText,
      }
      history.push(item)
      saveRecordingsHitory(history)

      const main = WINDOWS.get("main")
      if (main) {
        getRendererHandlers<RendererHandlers>(
          main.webContents,
        ).refreshRecordingHistory.send()
      }

      const panel = WINDOWS.get("panel")
      if (panel) {
        // Clear the "opened with main" flag since panel is being hidden
        clearPanelOpenedWithMain()
        panel.hide()
      }

      // Auto-paste if enabled
      if ((config.mcpAutoPasteEnabled ?? DEFAULT_MCP_AUTO_PASTE_ENABLED) && state.focusedAppBeforeRecording) {
        setTimeout(async () => {
          try {
            await writeText(processedText)
          } catch (error) {
            // Ignore paste errors
          }
        }, config.mcpAutoPasteDelay ?? DEFAULT_MCP_AUTO_PASTE_DELAY)
      }
    }),

  createMcpTextInput: t.procedure
    .input<{
      text: string
      conversationId?: string
      fromTile?: boolean // When true, session runs in background (snoozed) - panel won't show
    }>()
    .action(async ({ input }) => {
      const config = configStore.get()
      const queueEnabled = config.mcpMessageQueueEnabled ?? DEFAULT_MCP_MESSAGE_QUEUE_ENABLED

      logApp("[createMcpTextInput] Request received", {
        conversationId: input.conversationId ?? null,
        fromTile: input.fromTile ?? false,
        messageLength: input.text.length,
        queueEnabled,
      })

      // Defensive guard: when the caller explicitly asks for a snoozed session
      // (fromTile=true, e.g. SessionActionDialog inside the main window), also
      // time-suppress panel auto-show so an early progress update cannot race
      // the snoozed flag and briefly surface the floating panel.
      if (input.fromTile === true) {
        suppressPanelAutoShow(2000)
      }

      // Create or get conversation ID
      let conversationId = input.conversationId
      let agentInputText = input.text
      if (!conversationId) {
        const conversation = await conversationService.createConversation(
          input.text,
          "user",
        )
        conversationId = conversation.id
        agentInputText = getLatestStoredUserMessageContent(conversation, input.text)
      } else {
        // Check if message queuing is enabled and there's an active session
        if (queueEnabled) {
          const activeSessionId = agentSessionTracker.findSessionByConversationId(conversationId)
          if (activeSessionId) {
            const session = agentSessionTracker.getSession(activeSessionId)
            if (session && session.status === "active") {
              const queuedText = await conversationService.materializeInlineDataImagesInContent(conversationId, input.text)
              // Queue the message instead of starting a new session
              const queuedMessage = messageQueueService.enqueue(conversationId, queuedText, activeSessionId)
              logApp("[createMcpTextInput] Queued message for active session", {
                conversationId,
                queuedMessageId: queuedMessage.id,
                activeSessionId,
                activeSessionKind: describeAgentSessionId(activeSessionId),
                activeSessionStatus: session.status,
                fromTile: input.fromTile ?? false,
                messageLength: input.text.length,
                queueLength: messageQueueService.getQueue(conversationId).length,
              })
              return { conversationId, queued: true, queuedMessageId: queuedMessage.id }
            }

            logApp("[createMcpTextInput] Active session lookup did not queue message", {
              conversationId,
              activeSessionId,
              activeSessionKind: describeAgentSessionId(activeSessionId),
              trackerSessionFound: Boolean(session),
              activeSessionStatus: session?.status ?? null,
              fromTile: input.fromTile ?? false,
            })
          }
        }

        // Add user message to existing conversation
        const updatedConversation = await conversationService.addMessageToConversation(
          conversationId,
          input.text,
          "user",
        )
        agentInputText = getLatestStoredUserMessageContent(updatedConversation, input.text)
      }

      // Try to find and revive an existing session for this conversation
      // This handles the case where user continues from history
      let existingSessionId: string | undefined
      if (input.conversationId) {
        const foundSessionId = agentSessionTracker.findSessionByConversationId(input.conversationId)
        if (foundSessionId) {
          // Pass fromTile to reviveSession so it stays snoozed when continuing from a tile
          const revived = agentSessionTracker.reviveSession(foundSessionId, input.fromTile ?? false)
          if (revived) {
            existingSessionId = foundSessionId
            logApp("[createMcpTextInput] Revived existing session", {
              conversationId: input.conversationId,
              sessionId: foundSessionId,
              fromTile: input.fromTile ?? false,
            })
          } else {
            logApp("[createMcpTextInput] Found session but failed to revive", {
              conversationId: input.conversationId,
              sessionId: foundSessionId,
              fromTile: input.fromTile ?? false,
            })
          }
        } else {
          logApp("[createMcpTextInput] No runtime session found for conversation; starting new session", {
            conversationId: input.conversationId,
            fromTile: input.fromTile ?? false,
              messageLength: input.text.length,
              queueEnabled,
          })
        }
      }

      // Fire-and-forget: Start agent processing without blocking
      // This allows multiple sessions to run concurrently
      // Pass existingSessionId to reuse the session if found
      // When fromTile=true, start snoozed so the floating panel doesn't appear
      processWithAgentMode(agentInputText, conversationId, existingSessionId, input.fromTile ?? false)
        .then((finalResponse) => {
          // Save to history after completion
          const history = getRecordingHistory()
          const item: RecordingHistoryItem = {
            id: Date.now().toString(),
            createdAt: Date.now(),
            duration: 0, // Text input has no duration
            transcript: finalResponse,
          }
          history.push(item)
          saveRecordingsHitory(history)

          const main = WINDOWS.get("main")
          if (main) {
            getRendererHandlers<RendererHandlers>(
              main.webContents,
            ).refreshRecordingHistory.send()
          }

          // Auto-paste if enabled
          const pasteConfig = configStore.get()
          if ((pasteConfig.mcpAutoPasteEnabled ?? DEFAULT_MCP_AUTO_PASTE_ENABLED) && state.focusedAppBeforeRecording) {
            setTimeout(async () => {
              try {
                await writeText(finalResponse)
              } catch (error) {
                // Ignore paste errors
              }
            }, pasteConfig.mcpAutoPasteDelay ?? DEFAULT_MCP_AUTO_PASTE_DELAY)
          }
        })
        .catch((error) => {
          logLLM("[createMcpTextInput] Agent processing error:", error)
        })
        .finally(() => {
          // Process queued messages after this session completes (success or error)
          logLLM(`[createMcpTextInput] .finally() triggered for conversation ${conversationId}, calling processQueuedMessages`)
          processQueuedMessages(conversationId!).catch((err) => {
            logLLM("[createMcpTextInput] Error processing queued messages:", err)
          })
        })

      // Return immediately with conversation ID
      // Progress updates will be sent via emitAgentProgress
      return { conversationId }
    }),

  createMcpRecording: t.procedure
    .input<{
      recording: ArrayBuffer
      pcmRecording?: ArrayBuffer
      duration: number
      conversationId?: string
      sessionId?: string
      screenshot?: ScreenshotAttachmentInput
      fromTile?: boolean // When true, session runs in background (snoozed) - panel won't show
    }>()
    .action(async ({ input }) => {
      // Defensive guard: see matching comment in createMcpTextInput. When a
      // caller asks for a snoozed session, time-suppress panel auto-show to
      // cover the window where progress updates may race the snoozed flag.
      if (input.fromTile === true) {
        suppressPanelAutoShow(2000)
      }

      fs.mkdirSync(recordingsFolder, { recursive: true })

      const config = configStore.get()
      let transcript: string

      // Check if message queuing is enabled and there's an active session for this conversation
      // If so, we'll transcribe the audio and queue the transcript instead of processing immediately
      if (input.conversationId && (config.mcpMessageQueueEnabled ?? DEFAULT_MCP_MESSAGE_QUEUE_ENABLED)) {
        const activeSessionId = agentSessionTracker.findSessionByConversationId(input.conversationId)
        if (activeSessionId) {
          const session = agentSessionTracker.getSession(activeSessionId)
          if (session && session.status === "active") {
            // Active session exists - transcribe audio and queue the result
            logApp(`[createMcpRecording] Active session ${activeSessionId} found for conversation ${input.conversationId}, will queue transcript`)

            // Transcribe the audio first
            if (config.sttProviderId === "parakeet") {
              // Use Parakeet (local) STT
              if (!parakeetStt.isModelReady()) {
                throw new Error("Parakeet model not downloaded. Please download it in Settings.")
              }

              await parakeetStt.initializeRecognizer(config.parakeetNumThreads)

              if (!input.pcmRecording) {
                throw new Error("Parakeet STT requires pre-decoded float32 PCM audio. pcmRecording was not provided.")
              }
              transcript = await parakeetStt.transcribe(input.pcmRecording, 16000)
            } else {
              const form = new FormData()
              form.append(
                "file",
                new File([input.recording], "recording.webm", { type: "audio/webm" }),
              )
              form.append(
                "model",
                getRemoteSttModel(config),
              )
              form.append("response_format", "json")

              if (config.sttProviderId === "groq" && config.groqSttPrompt?.trim()) {
                form.append("prompt", config.groqSttPrompt.trim())
              }

              const languageCode = config.sttProviderId === "groq"
                ? config.groqSttLanguage || config.sttLanguage
                : config.openaiSttLanguage || config.sttLanguage

              if (languageCode && languageCode !== "auto") {
                form.append("language", languageCode)
              }

              const groqBaseUrl = config.groqBaseUrl || "https://api.groq.com/openai/v1"
              const openaiBaseUrl = config.openaiBaseUrl || "https://api.openai.com/v1"

              const transcriptResponse = await fetch(
                config.sttProviderId === "groq"
                  ? `${groqBaseUrl}/audio/transcriptions`
                  : `${openaiBaseUrl}/audio/transcriptions`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${config.sttProviderId === "groq" ? config.groqApiKey : config.openaiApiKey}`,
                  },
                  body: form,
                },
              )

              if (!transcriptResponse.ok) {
                const message = `${transcriptResponse.statusText} ${(await transcriptResponse.text()).slice(0, 300)}`
                throw new Error(message)
              }

              const json: { text: string } = await transcriptResponse.json()
              transcript = json.text
            }

            transcript = await postProcessTranscriptSafely(transcript, "createMcpRecording queued")

            // Save the recording file
            const recordingId = Date.now().toString()
            fs.writeFileSync(
              path.join(recordingsFolder, `${recordingId}.webm`),
              Buffer.from(input.recording),
            )

            const messageText = appendScreenshotToTranscript(transcript, input.screenshot)
            const queuedText = await conversationService.materializeInlineDataImagesInContent(input.conversationId, messageText)

            // Queue the transcript instead of processing immediately
            const queuedMessage = messageQueueService.enqueue(input.conversationId, queuedText, activeSessionId)
            logApp(`[createMcpRecording] Queued voice transcript ${queuedMessage.id} for active session ${activeSessionId}`)

            return { conversationId: input.conversationId, queued: true, queuedMessageId: queuedMessage.id }
          }
        }
      }

      // No active session or queuing disabled - proceed with normal processing
      // Emit initial loading progress immediately BEFORE transcription
      // This ensures users see feedback during the (potentially long) STT call
      const tempConversationId = input.conversationId || `temp_${Date.now()}`

      // Determine profile snapshot for session isolation
      // If reusing an existing session, use its stored snapshot to maintain isolation
      // Only capture a new snapshot from the current global profile when creating a new session
      let profileSnapshot: SessionProfileSnapshot | undefined

      if (input.sessionId) {
        // Try to get the stored profile snapshot from the existing session
        profileSnapshot = agentSessionStateManager.getSessionProfileSnapshot(input.sessionId)
          ?? agentSessionTracker.getSessionProfileSnapshot(input.sessionId)
      } else if (input.conversationId) {
        // Try to find existing session for this conversation and get its profile snapshot
        const existingSessionId = agentSessionTracker.findSessionByConversationId(input.conversationId)
        if (existingSessionId) {
          profileSnapshot = agentSessionStateManager.getSessionProfileSnapshot(existingSessionId)
            ?? agentSessionTracker.getSessionProfileSnapshot(existingSessionId)
        }
      }

      // Only capture a new snapshot if we don't have one from an existing session
      if (!profileSnapshot) {
        const currentProfile = agentProfileService.getCurrentProfile()
        if (currentProfile) {
          profileSnapshot = createSessionSnapshotFromProfile(currentProfile)
        }
      }

      // If sessionId is provided, try to revive that session.
      // Otherwise, if conversationId is provided, try to find and revive a session for that conversation.
      // This handles the case where user continues from history (only conversationId is set).
      // When fromTile=true, sessions start snoozed so the floating panel doesn't appear.
      const startSnoozed = input.fromTile ?? false
      let sessionId: string
      if (input.sessionId) {
        // Try to revive the existing session by ID
        // Pass startSnoozed so session stays snoozed when continuing from a tile
        const revived = agentSessionTracker.reviveSession(input.sessionId, startSnoozed)
        if (revived) {
          sessionId = input.sessionId
          // Update the session title while transcribing
          agentSessionTracker.updateSession(sessionId, {
            conversationTitle: "Transcribing...",
            lastActivity: "Transcribing audio...",
          })
        } else {
          // Session not found, create a new one with profile snapshot
          sessionId = agentSessionTracker.startSession(tempConversationId, "Transcribing...", startSnoozed, profileSnapshot)
        }
      } else if (input.conversationId) {
        // No sessionId but have conversationId - try to find existing session for this conversation
        const existingSessionId = agentSessionTracker.findSessionByConversationId(input.conversationId)
        if (existingSessionId) {
          // Pass startSnoozed so session stays snoozed when continuing from a tile
          const revived = agentSessionTracker.reviveSession(existingSessionId, startSnoozed)
          if (revived) {
            sessionId = existingSessionId
            // Update the session title while transcribing
            agentSessionTracker.updateSession(sessionId, {
              conversationTitle: "Transcribing...",
              lastActivity: "Transcribing audio...",
            })
          } else {
            // Revive failed, create new session with profile snapshot
            sessionId = agentSessionTracker.startSession(tempConversationId, "Transcribing...", startSnoozed, profileSnapshot)
          }
        } else {
          // No existing session for this conversation, create new with profile snapshot
          sessionId = agentSessionTracker.startSession(tempConversationId, "Transcribing...", startSnoozed, profileSnapshot)
        }
      } else {
        // No sessionId or conversationId provided, create a new session with profile snapshot
        sessionId = agentSessionTracker.startSession(tempConversationId, "Transcribing...", startSnoozed, profileSnapshot)
      }

      try {
        // Emit initial "initializing" progress update
        await emitAgentProgress({
          sessionId,
          conversationId: tempConversationId,
          currentIteration: 0,
          maxIterations: 1,
          steps: [{
            id: `transcribe_${Date.now()}`,
            type: "thinking",
            title: "Transcribing audio",
            description: "Processing audio input...",
            status: "in_progress",
            timestamp: Date.now(),
          }],
          isComplete: false,
          isSnoozed: startSnoozed,
          conversationTitle: "Transcribing...",
        })

        // First, transcribe the audio using the same logic as regular recording
        if (config.sttProviderId === "parakeet") {
          // Use Parakeet (local) STT
          if (!parakeetStt.isModelReady()) {
            throw new Error("Parakeet model not downloaded. Please download it in Settings.")
          }

          await parakeetStt.initializeRecognizer(config.parakeetNumThreads)

          if (!input.pcmRecording) {
            throw new Error("Parakeet STT requires pre-decoded float32 PCM audio. pcmRecording was not provided.")
          }
          transcript = await parakeetStt.transcribe(input.pcmRecording, 16000)
        } else {
          // Use OpenAI or Groq for transcription
          const form = new FormData()
          form.append(
            "file",
            new File([input.recording], "recording.webm", { type: "audio/webm" }),
          )
          form.append(
            "model",
            getRemoteSttModel(config),
          )
          form.append("response_format", "json")

          if (config.sttProviderId === "groq" && config.groqSttPrompt?.trim()) {
            form.append("prompt", config.groqSttPrompt.trim())
          }

          // Add language parameter if specified
          const languageCode = config.sttProviderId === "groq"
            ? config.groqSttLanguage || config.sttLanguage
            : config.openaiSttLanguage || config.sttLanguage;

          if (languageCode && languageCode !== "auto") {
            form.append("language", languageCode)
          }

          const groqBaseUrl = config.groqBaseUrl || "https://api.groq.com/openai/v1"
          const openaiBaseUrl = config.openaiBaseUrl || "https://api.openai.com/v1"

          const transcriptResponse = await fetch(
            config.sttProviderId === "groq"
              ? `${groqBaseUrl}/audio/transcriptions`
              : `${openaiBaseUrl}/audio/transcriptions`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${config.sttProviderId === "groq" ? config.groqApiKey : config.openaiApiKey}`,
              },
              body: form,
            },
          )

          if (!transcriptResponse.ok) {
            const message = `${transcriptResponse.statusText} ${(await transcriptResponse.text()).slice(0, 300)}`
            throw new Error(message)
          }

          const json: { text: string } = await transcriptResponse.json()
          transcript = json.text
        }

      transcript = await postProcessTranscriptSafely(transcript, "createMcpRecording")

      const messageText = appendScreenshotToTranscript(transcript, input.screenshot)
      let agentInputText = messageText

      // Create or continue conversation
      let conversationId = input.conversationId
      let conversation: Conversation | null = null

      if (!conversationId) {
        // Create new conversation with the transcript
        conversation = await conversationService.createConversation(
          messageText,
          "user",
        )
        conversationId = conversation.id
        agentInputText = getLatestStoredUserMessageContent(conversation, messageText)
      } else {
        // Load existing conversation and add user message
        conversation =
          await conversationService.loadConversation(conversationId)
        if (conversation) {
          const updatedConversation = await conversationService.addMessageToConversation(
            conversationId,
            messageText,
            "user",
          )
          conversation = updatedConversation ?? conversation
          agentInputText = getLatestStoredUserMessageContent(conversation, messageText)
        } else {
          conversation = await conversationService.createConversation(
            messageText,
            "user",
          )
          conversationId = conversation.id
          agentInputText = getLatestStoredUserMessageContent(conversation, messageText)
        }
      }

      // Update session with actual conversation ID and title after transcription
      const conversationTitle = transcript?.trim() || input.screenshot?.name || "Screen selection"
      agentSessionTracker.updateSession(sessionId, {
        conversationId,
        conversationTitle,
      })

      // Save the recording file immediately
      const recordingId = Date.now().toString()
      fs.writeFileSync(
        path.join(recordingsFolder, `${recordingId}.webm`),
        Buffer.from(input.recording),
      )

        // Fire-and-forget: Start agent processing without blocking.
        // Preserve the tile/background snooze state after transcription so
        // voice follow-ups from a session tile do not re-focus the panel.
        processWithAgentMode(agentInputText, conversationId, sessionId, startSnoozed)
        .then((finalResponse) => {
          // Save to history after completion
          const history = getRecordingHistory()
          const item: RecordingHistoryItem = {
            id: recordingId,
            createdAt: Date.now(),
            duration: input.duration,
            transcript: finalResponse,
          }
          history.push(item)
          saveRecordingsHitory(history)

          const main = WINDOWS.get("main")
          if (main) {
            getRendererHandlers<RendererHandlers>(
              main.webContents,
            ).refreshRecordingHistory.send()
          }
        })
          .catch((error) => {
            logLLM("[createMcpRecording] Agent processing error:", error)
          })
          .finally(() => {
            // Process queued messages after this session completes (success or error)
            processQueuedMessages(conversationId!).catch((err) => {
              logLLM("[createMcpRecording] Error processing queued messages:", err)
            })
          })

        // Return immediately with conversation ID
        // Progress updates will be sent via emitAgentProgress
        return { conversationId }
      } catch (error) {
        // Handle transcription or conversation creation errors
        logLLM("[createMcpRecording] Transcription error:", error)

        // Clean up the session and emit error state
        await emitAgentProgress({
          sessionId,
          conversationId: tempConversationId,
          currentIteration: 1,
          maxIterations: 1,
          steps: [{
            id: `transcribe_error_${Date.now()}`,
            type: "completion",
            title: "Transcription failed",
            description: getErrorMessage(error, "Unknown transcription error"),
            status: "error",
            timestamp: Date.now(),
          }],
          isComplete: true,
          isSnoozed: startSnoozed,
          conversationTitle: "Transcription Error",
          finalContent: `Transcription failed: ${getErrorMessage(error)}`,
        })

        // Mark the session as errored to clean up the UI
        agentSessionTracker.errorSession(sessionId, getErrorMessage(error, "Transcription failed"))

        // Re-throw the error so the caller knows transcription failed
        throw error
      }
    }),

  getRecordingHistory: t.procedure.action(async () => getRecordingHistory()),

  deleteRecordingItem: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
      const recordings = getRecordingHistory().filter(
        (item) => item.id !== input.id,
      )
      saveRecordingsHitory(recordings)
      fs.unlinkSync(path.join(recordingsFolder, `${input.id}.webm`))
    }),

  deleteRecordingHistory: t.procedure.action(async () => {
    fs.rmSync(recordingsFolder, { force: true, recursive: true })
  }),

  getConfig: t.procedure.action(async () => {
    return configStore.get()
  }),

  getChatGptWebAuthStatus: t.procedure.action(async () => {
    const { getChatGptWebAuthStatus } = await import("./chatgpt-web-provider")
    return getChatGptWebAuthStatus()
  }),

  loginChatGptWebOAuth: t.procedure.action(async () => {
    const { loginChatGptWebOAuth } = await import("./chatgpt-web-provider")
    return loginChatGptWebOAuth()
  }),

  logoutChatGptWebOAuth: t.procedure.action(async () => {
    const { logoutChatGptWebOAuth } = await import("./chatgpt-web-provider")
    await logoutChatGptWebOAuth()
    return { success: true }
  }),

  // ============================================================================
  // .agents (modular config) helpers
  // ============================================================================

  getAgentsFolders: t.procedure.action(async () => {
    const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
    const { getAgentsLayerPaths } = await import("./agents-files/modular-config")
    const { getAgentsKnowledgeDir } = await import("@dotagents/core")
    const { getAgentsSkillsDir } = await import("@dotagents/core")

    const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
    const workspaceLayer = workspaceAgentsFolder ? getAgentsLayerPaths(workspaceAgentsFolder) : null

    const workspaceSource = workspaceLayer ? "env" : null

    return {
      global: {
        agentsDir: globalLayer.agentsDir,
        skillsDir: getAgentsSkillsDir(globalLayer),
        knowledgeDir: getAgentsKnowledgeDir(globalLayer),
        memoriesDir: getAgentsKnowledgeDir(globalLayer),
      },
      workspace: workspaceLayer
        ? {
            agentsDir: workspaceLayer.agentsDir,
            skillsDir: getAgentsSkillsDir(workspaceLayer),
            knowledgeDir: getAgentsKnowledgeDir(workspaceLayer),
            memoriesDir: getAgentsKnowledgeDir(workspaceLayer),
          }
        : null,
      workspaceSource,
    }
  }),

  openAgentsFolder: t.procedure.action(async () => {
    const { globalAgentsFolder } = await import("./config")
    fs.mkdirSync(globalAgentsFolder, { recursive: true })
    const error = await shell.openPath(globalAgentsFolder)
    return { success: !error, error: error || undefined }
  }),

  openWorkspaceAgentsFolder: t.procedure.action(async () => {
    const { resolveWorkspaceAgentsFolder } = await import("./config")
    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
    if (!workspaceAgentsFolder) return { success: false, error: "No workspace .agents folder configured" }

    fs.mkdirSync(workspaceAgentsFolder, { recursive: true })
    const error = await shell.openPath(workspaceAgentsFolder)
    return { success: !error, error: error || undefined }
  }),

  openSystemPromptFile: t.procedure.action(async () => {
    const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
    const { getAgentsLayerPaths, writeAgentsPrompts } = await import("./agents-files/modular-config")
    const { DEFAULT_SYSTEM_PROMPT } = await import("./system-prompts-default")

    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
    const targetLayer = workspaceAgentsFolder
      ? getAgentsLayerPaths(workspaceAgentsFolder)
      : getAgentsLayerPaths(globalAgentsFolder)

    fs.mkdirSync(targetLayer.agentsDir, { recursive: true })

    const config = configStore.get()
    writeAgentsPrompts(
      targetLayer,
      config.mcpCustomSystemPrompt || "",
      config.mcpToolsSystemPrompt || "",
      DEFAULT_SYSTEM_PROMPT,
      { onlyIfMissing: true, maxBackups: 10 },
    )

    return revealFileInFolder(targetLayer.systemPromptMdPath)
  }),

  openAgentsGuidelinesFile: t.procedure.action(async () => {
    const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
    const { getAgentsLayerPaths, writeAgentsPrompts } = await import("./agents-files/modular-config")
    const { DEFAULT_SYSTEM_PROMPT } = await import("./system-prompts-default")

    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
    const targetLayer = workspaceAgentsFolder
      ? getAgentsLayerPaths(workspaceAgentsFolder)
      : getAgentsLayerPaths(globalAgentsFolder)

    fs.mkdirSync(targetLayer.agentsDir, { recursive: true })

    const config = configStore.get()
    writeAgentsPrompts(
      targetLayer,
      config.mcpCustomSystemPrompt || "",
      config.mcpToolsSystemPrompt || "",
      DEFAULT_SYSTEM_PROMPT,
      { onlyIfMissing: true, maxBackups: 10 },
    )

    return revealFileInFolder(targetLayer.agentsMdPath)
  }),

  openKnowledgeFolder: t.procedure.action(async () => {
    const { globalAgentsFolder } = await import("./config")
    const knowledgeDir = path.join(globalAgentsFolder, "knowledge")
    fs.mkdirSync(knowledgeDir, { recursive: true })
    const error = await shell.openPath(knowledgeDir)
    return { success: !error, error: error || undefined }
  }),

  openWorkspaceKnowledgeFolder: t.procedure.action(async () => {
    const { resolveWorkspaceAgentsFolder } = await import("./config")
    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
    if (!workspaceAgentsFolder) return { success: false, error: "No workspace .agents folder configured" }

    const knowledgeDir = path.join(workspaceAgentsFolder, "knowledge")
    fs.mkdirSync(knowledgeDir, { recursive: true })
    const error = await shell.openPath(knowledgeDir)
    return { success: !error, error: error || undefined }
  }),

  // Debug flags - exposed to renderer for synchronized debug logging
  getDebugFlags: t.procedure.action(async () => {
    return getDebugFlags()
  }),

  saveConfig: t.procedure
    .input<{ config: Config }>()
    .action(async ({ input }) => {
      const prev = configStore.get()
      const next = input.config
      const merged = { ...(prev as any), ...(next as any) } as Config

      // Persist merged config (ensures partial updates don't lose existing settings)
      configStore.save(merged)

      try {
        const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
        const { getAgentsLayerPaths } = await import("./agents-files/modular-config")
        const { cleanupInvalidMcpServerReferencesInLayers } = await import("./agent-profile-mcp-cleanup")

        const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
        const layers = workspaceAgentsFolder
          ? [getAgentsLayerPaths(globalAgentsFolder), getAgentsLayerPaths(workspaceAgentsFolder)]
          : [getAgentsLayerPaths(globalAgentsFolder)]

        const validServerNames = Object.keys(merged.mcpConfig?.mcpServers || {})
        const cleanupResult = cleanupInvalidMcpServerReferencesInLayers(layers, validServerNames)
        if (cleanupResult.updatedProfileIds.length > 0) {
          agentProfileService.reload()
        }
      } catch (_e) {
        // best-effort cleanup only
      }

      // Clear models cache if provider endpoints or API keys changed
      try {
        const providerConfigChanged =
          (prev as any)?.openaiBaseUrl !== (merged as any)?.openaiBaseUrl ||
          (prev as any)?.openaiApiKey !== (merged as any)?.openaiApiKey ||
          (prev as any)?.groqBaseUrl !== (merged as any)?.groqBaseUrl ||
          (prev as any)?.groqApiKey !== (merged as any)?.groqApiKey ||
          (prev as any)?.geminiBaseUrl !== (merged as any)?.geminiBaseUrl ||
          (prev as any)?.geminiApiKey !== (merged as any)?.geminiApiKey ||
          (prev as any)?.chatgptWebBaseUrl !== (merged as any)?.chatgptWebBaseUrl ||
          (prev as any)?.chatgptWebAccessToken !== (merged as any)?.chatgptWebAccessToken ||
          (prev as any)?.chatgptWebSessionToken !== (merged as any)?.chatgptWebSessionToken

        if (providerConfigChanged) {
          const { clearModelsCache } = await import("./models-service")
          clearModelsCache()
        }
      } catch (_e) {
        // best-effort only; cache will eventually expire
      }

      applyDesktopShellSettings(prev, merged)

      // Manage Remote Server lifecycle on config changes
      try {
        const prevEnabled = !!(prev as any)?.remoteServerEnabled
        const nextEnabled = !!(merged as any)?.remoteServerEnabled

        if (prevEnabled !== nextEnabled) {
          if (nextEnabled) {
            await startRemoteServer()
          } else {
            await stopRemoteServer()
          }
        } else if (nextEnabled) {
          const changed =
            (prev as any)?.remoteServerPort !== (merged as any)?.remoteServerPort ||
            (prev as any)?.remoteServerBindAddress !== (merged as any)?.remoteServerBindAddress ||
            (prev as any)?.remoteServerApiKey !== (merged as any)?.remoteServerApiKey ||
            (prev as any)?.remoteServerLogLevel !== (merged as any)?.remoteServerLogLevel

          if (changed) {
            await restartRemoteServer()
          }
        }
      } catch (_e) {
        // lifecycle is best-effort
      }

      try {
        const discordLifecycleAction = getDiscordLifecycleAction(prev, merged)
        if (discordLifecycleAction === "start") {
          await discordService.start()
        } else if (discordLifecycleAction === "restart") {
          await discordService.restart()
        } else if (discordLifecycleAction === "stop") {
          await discordService.stop()
        }
      } catch (_e) {
        // lifecycle is best-effort
      }

      // Manage WhatsApp MCP server auto-configuration
      // Note: The actual server path is determined at runtime in mcp-service.ts createTransport()
      // This ensures the correct internal bundled path is always used, regardless of what's in config
      try {
        const prevWhatsappEnabled = !!(prev as any)?.whatsappEnabled
        const nextWhatsappEnabled = !!(merged as any)?.whatsappEnabled

        if (prevWhatsappEnabled !== nextWhatsappEnabled) {
          const currentMcpConfig = merged.mcpConfig || { mcpServers: {} }
          const hasWhatsappServer = !!currentMcpConfig.mcpServers?.[WHATSAPP_SERVER_NAME]

          if (nextWhatsappEnabled) {
            // WhatsApp is being enabled
            const { mcpService } = await import("./mcp-service")
            if (!hasWhatsappServer) {
              // Auto-add WhatsApp MCP server config when enabled
              // The path in config is just a placeholder - the actual path is determined
              // at runtime in createTransport() to ensure the correct bundled path is used
              const updatedMcpConfig: MCPConfig = {
                ...currentMcpConfig,
                mcpServers: {
                  ...currentMcpConfig.mcpServers,
                  [WHATSAPP_SERVER_NAME]: {
                    command: "node",
                    args: [getInternalWhatsAppServerPath()],
                    transport: "stdio",
                  },
                },
              }
              merged.mcpConfig = updatedMcpConfig
              configStore.save(merged)
            }
            // Start/restart the WhatsApp server (handles both new and existing configs)
            await mcpService.restartServer(WHATSAPP_SERVER_NAME)
          } else if (!nextWhatsappEnabled && hasWhatsappServer) {
            // Stop the WhatsApp server when disabled (but keep config for re-enabling)
            const { mcpService } = await import("./mcp-service")
            await mcpService.stopServer(WHATSAPP_SERVER_NAME)
          }
        } else if (nextWhatsappEnabled) {
          // Check if WhatsApp settings changed - restart server to pick up new env vars
          // Also watch Remote Server settings since prepareEnvironment() derives callback URL/API key from them
          const whatsappSettingsChanged =
            JSON.stringify((prev as any)?.whatsappAllowFrom) !== JSON.stringify((merged as any)?.whatsappAllowFrom) ||
            (prev as any)?.whatsappAutoReply !== (merged as any)?.whatsappAutoReply ||
            (prev as any)?.whatsappLogMessages !== (merged as any)?.whatsappLogMessages

          // If auto-reply is enabled, also restart when Remote Server settings change
          // This includes remoteServerEnabled because prepareEnvironment() only enables
          // callback URL/API key injection when remote server is enabled
          const remoteServerSettingsChanged = (merged as any)?.whatsappAutoReply && (
            (prev as any)?.remoteServerEnabled !== (merged as any)?.remoteServerEnabled ||
            (prev as any)?.remoteServerPort !== (merged as any)?.remoteServerPort ||
            (prev as any)?.remoteServerApiKey !== (merged as any)?.remoteServerApiKey
          )

          if (whatsappSettingsChanged || remoteServerSettingsChanged) {
            const { mcpService } = await import("./mcp-service")
            const currentMcpConfig = merged.mcpConfig || { mcpServers: {} }
            if (currentMcpConfig.mcpServers?.[WHATSAPP_SERVER_NAME]) {
              await mcpService.restartServer(WHATSAPP_SERVER_NAME)
            }
          }
        }
      } catch (_e) {
        // lifecycle is best-effort
      }

      // Reinitialize observability helpers if their config fields changed.
      // This ensures config changes take effect without requiring app restart.
      try {
        const langfuseConfigChanged =
          (prev as any)?.langfuseEnabled !== (merged as any)?.langfuseEnabled ||
          (prev as any)?.langfuseSecretKey !== (merged as any)?.langfuseSecretKey ||
          (prev as any)?.langfusePublicKey !== (merged as any)?.langfusePublicKey ||
          (prev as any)?.langfuseBaseUrl !== (merged as any)?.langfuseBaseUrl
        const localTraceConfigChanged =
          (prev as any)?.localTraceLoggingEnabled !== (merged as any)?.localTraceLoggingEnabled ||
          (prev as any)?.localTraceLogPath !== (merged as any)?.localTraceLogPath

        if (langfuseConfigChanged) {
          const { reinitializeLangfuse } = await import("./langfuse-service")
          reinitializeLangfuse()
        } else if (localTraceConfigChanged) {
          const { resetLocalTraceLogger } = await import("./local-trace-logger")
          resetLocalTraceLogger()
        }
      } catch (_e) {
        // Observability reinitialization is best-effort
      }
    }),

  // Check if langfuse package is installed (for UI to show install instructions)
  isLangfuseInstalled: t.procedure.action(async () => {
    try {
      const { isLangfuseInstalled } = await import("./langfuse-service")
      return isLangfuseInstalled()
    } catch {
      return false
    }
  }),

  recordEvent: t.procedure
    .input<{ type: "start" | "end"; mcpMode?: boolean }>()
    .action(async ({ input }) => {
      if (input.type === "start") {
        state.isRecording = true
        // Track agent mode state so main process knows if we're in agent toggle mode
        if (input.mcpMode !== undefined) {
          state.isRecordingMcpMode = input.mcpMode
        }
      } else {
        state.isRecording = false
        state.isRecordingMcpMode = false
      }
      updateTrayIcon()
    }),

  clearTextInputState: t.procedure.action(async () => {
    logApp("[clearTextInputState] Clearing text input state", {
      panelMode: getCurrentPanelMode(),
      panelVisible: WINDOWS.get("panel")?.isVisible?.() ?? false,
      previousTextInputActive: state.isTextInputActive,
    })
    state.isTextInputActive = false
  }),

  // MCP Config File Operations
  loadMcpConfigFile: t.procedure.action(async () => {
    const result = await dialog.showOpenDialog({
      title: "Load MCP Configuration",
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
    })

    if (result.canceled || !result.filePaths.length) {
      return null
    }

    try {
      const configContent = fs.readFileSync(result.filePaths[0], "utf8")
      return parseMcpConfigImportBody(JSON.parse(configContent))
    } catch (error) {
      throw new Error(
        `Failed to load MCP config: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }),

  validateMcpConfigText: t.procedure
    .input<{ text: string }>()
    .action(async ({ input }) => {
      try {
        return parseMcpConfigImportBody(JSON.parse(input.text))
      } catch (error) {
        throw new Error(
          `Invalid MCP config: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }),

  saveMcpConfigFile: t.procedure
    .input<{ config: MCPConfig }>()
    .action(async ({ input }) => {
      const result = await dialog.showSaveDialog({
        title: "Save MCP Configuration",
        defaultPath: "mcp.json",
        filters: [
          { name: "JSON Files", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
      })

      if (result.canceled || !result.filePath) {
        return false
      }

      try {
        fs.writeFileSync(result.filePath, JSON.stringify(input.config, null, 2))
        return true
      } catch (error) {
        throw new Error(
          `Failed to save MCP config: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }),

  validateMcpConfig: t.procedure
    .input<{ config: MCPConfig }>()
    .action(async ({ input }) => {
      try {
        parseMcpConfigImportBody(input.config)
        return { valid: true }
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    }),

  getMcpServerStatus: t.procedure.action(async () => {
    return mcpService.getServerStatus()
  }),

  getMcpInitializationStatus: t.procedure.action(async () => {
    return mcpService.getInitializationStatus()
  }),

  getMcpDetailedToolList: t.procedure.action(async () => {
    return mcpService.getDetailedToolList()
  }),

  setMcpToolEnabled: t.procedure
    .input<{ toolName: string; enabled: boolean }>()
    .action(async ({ input }) => {
      const success = mcpService.setToolEnabled(input.toolName, input.enabled)
      return { success }
    }),

  setMcpServerRuntimeEnabled: t.procedure
    .input<{ serverName: string; enabled: boolean }>()
    .action(async ({ input }) => {
      const success = mcpService.setServerRuntimeEnabled(
        input.serverName,
        input.enabled,
      )
      return { success }
    }),

  getMcpServerRuntimeState: t.procedure
    .input<{ serverName: string }>()
    .action(async ({ input }) => {
      return {
        runtimeEnabled: mcpService.isServerRuntimeEnabled(input.serverName),
        available: mcpService.isServerAvailable(input.serverName),
      }
    }),

  getMcpDisabledTools: t.procedure.action(async () => {
    return mcpService.getDisabledTools()
  }),

  // Diagnostics endpoints
  getDiagnosticReport: t.procedure.action(async () => {
    try {
      return await diagnosticsService.generateDiagnosticReport()
    } catch (error) {
      diagnosticsService.logError(
        "tipc",
        "Failed to generate diagnostic report",
        error,
      )
      throw error
    }
  }),

  saveDiagnosticReport: t.procedure
    .input<{ filePath?: string }>()
    .action(async ({ input }) => {
      try {
        const savedPath = await diagnosticsService.saveDiagnosticReport(
          input.filePath,
        )
        return { success: true, filePath: savedPath }

      } catch (error) {
        diagnosticsService.logError(
          "tipc",
          "Failed to save diagnostic report",
          error,
        )
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    }),

  performHealthCheck: t.procedure.action(async () => {
    try {
      return await diagnosticsService.performHealthCheck()
    } catch (error) {
      diagnosticsService.logError(
        "tipc",
        "Failed to perform health check",
        error,
      )
      throw error
    }
  }),

  getRecentErrors: t.procedure
    .input<{ count?: number }>()

    .action(async ({ input }) => {
      return diagnosticsService.getRecentErrors(input.count || 10)
    }),

  clearErrorLog: t.procedure.action(async () => {
    diagnosticsService.clearErrorLog()
    return { success: true }
  }),

  testMcpServerConnection: t.procedure
    .input<{ serverName: string; serverConfig: MCPServerConfig }>()
    .action(async ({ input }) => {
      return mcpService.testServerConnection(
        input.serverName,
        input.serverConfig,
      )
    }),

  restartMcpServer: t.procedure
    .input<{ serverName: string }>()

    .action(async ({ input }) => {
      return mcpService.restartServer(input.serverName)
    }),

  stopMcpServer: t.procedure
    .input<{ serverName: string }>()
    .action(async ({ input }) => {
      return mcpService.stopServer(input.serverName)
    }),

  getMcpServerLogs: t.procedure
    .input<{ serverName: string }>()
    .action(async ({ input }) => {
      return mcpService.getServerLogs(input.serverName)
    }),

  clearMcpServerLogs: t.procedure
    .input<{ serverName: string }>()
    .action(async ({ input }) => {
      mcpService.clearServerLogs(input.serverName)
      return { success: true }
    }),

  // WhatsApp Integration
  whatsappConnect: t.procedure.action(async () => {
    const WHATSAPP_SERVER_NAME = "whatsapp"
    try {
      // Check if WhatsApp server is available
      const serverStatus = mcpService.getServerStatus()
      const whatsappServer = serverStatus[WHATSAPP_SERVER_NAME]
      if (!whatsappServer || !whatsappServer.connected) {
        return { success: false, error: "WhatsApp server is not running. Please enable WhatsApp in settings." }
      }

      // Call the whatsapp_connect tool
      const result = await mcpService.executeToolCall(
        { name: "whatsapp_connect", arguments: {} },
        undefined,
        true // skip approval check for internal calls
      )

      // Check if the tool returned an error result
      if (result.isError) {
        const errorText = result.content?.find((c: any) => c.type === "text")?.text || "Connection failed"
        return { success: false, error: errorText }
      }

      // Parse the result to extract QR code if present
      const textContent = result.content?.find((c: any) => c.type === "text")
      if (textContent?.text) {
        try {
          const parsed = JSON.parse(textContent.text)
          if (parsed.qrCode) {
            return { success: true, qrCode: parsed.qrCode, status: "qr_required" }
          } else if (parsed.status === "qr_required") {
            return { success: true, qrCode: parsed.qrCode, status: "qr_required" }
          }
        } catch {
          // Not JSON, check for connection success message
          if (textContent.text.includes("Connected successfully")) {
            return { success: true, status: "connected", message: textContent.text }
          }
          if (textContent.text.includes("Already connected")) {
            return { success: true, status: "connected", message: textContent.text }
          }
        }
        return { success: true, message: textContent.text }
      }

      return { success: true, message: "Connection initiated" }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }),

  whatsappGetStatus: t.procedure.action(async () => {
    const WHATSAPP_SERVER_NAME = "whatsapp"
    try {
      // Check if WhatsApp server is available
      const serverStatus = mcpService.getServerStatus()
      const whatsappServer = serverStatus[WHATSAPP_SERVER_NAME]
      if (!whatsappServer || !whatsappServer.connected) {
        return { available: false, connected: false, error: "WhatsApp server is not running" }
      }

      // Call the whatsapp_get_status tool
      const result = await mcpService.executeToolCall(
        { name: "whatsapp_get_status", arguments: {} },
        undefined,
        true // skip approval check for internal calls
      )

      // Check if the tool returned an error result
      if (result.isError) {
        const errorText = result.content?.find((c: any) => c.type === "text")?.text || "Failed to get status"
        return { available: true, connected: false, error: errorText }
      }

      // Parse the result
      const textContent = result.content?.find((c: any) => c.type === "text")
      if (textContent?.text) {
        try {
          const parsed = JSON.parse(textContent.text)
          return { available: true, ...parsed }
        } catch {
          return { available: true, message: textContent.text }
        }
      }

      return { available: true, connected: false }
    } catch (error) {
      return { available: false, connected: false, error: error instanceof Error ? error.message : String(error) }
    }
  }),

  whatsappDisconnect: t.procedure.action(async () => {
    const WHATSAPP_SERVER_NAME = "whatsapp"
    try {
      const result = await mcpService.executeToolCall(
        { name: "whatsapp_disconnect", arguments: {} },
        undefined,
        true
      )
      // Check if the tool returned an error result
      if (result.isError) {
        const errorText = result.content?.find((c: any) => c.type === "text")?.text || "Disconnect failed"
        return { success: false, error: errorText }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }),

  whatsappLogout: t.procedure.action(async () => {
    const WHATSAPP_SERVER_NAME = "whatsapp"
    try {
      const result = await mcpService.executeToolCall(
        { name: "whatsapp_logout", arguments: {} },
        undefined,
        true
      )
      // Check if the tool returned an error result
      if (result.isError) {
        const errorText = result.content?.find((c: any) => c.type === "text")?.text || "Logout failed"
        return { success: false, error: errorText }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }),

  // Discord Integration
  discordConnect: t.procedure.action(async () => {
    return discordService.start()
  }),

  discordDisconnect: t.procedure.action(async () => {
    return discordService.stop()
  }),

  discordGetStatus: t.procedure.action(async () => {
    return discordService.getStatus()
  }),

  discordGetLogs: t.procedure.action(async () => {
    return discordService.getLogs()
  }),

  discordClearLogs: t.procedure.action(async () => {
    discordService.clearLogs()
    return { success: true }
  }),

  // Text-to-Speech
  generateSpeech: t.procedure
    .input<{
      text: string
      providerId?: string
      voice?: string
      model?: string
      speed?: number
    }>()
    .action(async ({ input }) => {
      try {
        const config = configStore.get()
        // Desktop-local TTS respects the user's global toggle. Remote clients
        // (mobile via /v1/tts/speak) intentionally bypass this gate.
        if (!(config.ttsEnabled ?? DEFAULT_TTS_ENABLED)) {
          throw new Error("Text-to-Speech is not enabled")
        }
        return await generateTTS(input, config)
      } catch (error) {
        diagnosticsService.logError("tts", "TTS generation failed", error)
        throw error
      }
    }),

  // Models Management
  fetchAvailableModels: t.procedure
    .input<{ providerId: string }>()
    .action(async ({ input }) => {
      const { fetchAvailableModels } = await import("./models-service")
      return fetchAvailableModels(input.providerId)
    }),

  // Fetch models for a specific preset (base URL + API key)
  fetchModelsForPreset: t.procedure
    .input<{ baseUrl: string; apiKey: string }>()
    .action(async ({ input }) => {
      const { fetchModelsForPreset } = await import("./models-service")
      return fetchModelsForPreset(input.baseUrl, input.apiKey)
    }),

  // Get enhanced model info from models.dev
  getModelInfo: t.procedure
    .input<{ modelId: string; providerId?: string }>()
    .action(async ({ input }) => {
      // If providerId is given, use specific provider lookup
      if (input.providerId) {
        const model = getModelFromModelsDevByProviderId(input.modelId, input.providerId)
        return model || null
      }
      // Otherwise, search across ALL providers using fuzzy matching
      const matchResult = findBestModelMatch(input.modelId)
      return matchResult?.model || null
    }),

  // Get all models.dev data
  getModelsDevData: t.procedure.action(async () => {
    return await fetchModelsDevData()
  }),

  // Force refresh models.dev cache
  refreshModelsData: t.procedure.action(async () => {
    await refreshModelsDevCache()
    return { success: true }
  }),

  // Conversation Management
  getConversationHistory: t.procedure.action(async () => {
    logApp("[tipc] getConversationHistory called")
    const result = await conversationService.getConversationHistory()
    return result
  }),

  loadConversation: t.procedure
    .input<{ conversationId: string; messageLimit?: number }>()
    .action(async ({ input }) => {
      return conversationService.loadConversation(input.conversationId, {
        messageLimit: input.messageLimit,
      })
    }),

  saveConversation: t.procedure
    .input<{ conversation: Conversation }>()
    .action(async ({ input }) => {
      await conversationService.saveConversation(input.conversation)
    }),

  createConversation: t.procedure
    .input<{ firstMessage: string; role?: "user" | "assistant" }>()
    .action(async ({ input }) => {
      return conversationService.createConversation(
        input.firstMessage,
        input.role,
      )
    }),

  addMessageToConversation: t.procedure
    .input<{
      conversationId: string
      content: string
      role: "user" | "assistant" | "tool"
      toolCalls?: Array<{ name: string; arguments: any }>
      toolResults?: Array<{ success: boolean; content: string; error?: string }>
    }>()
    .action(async ({ input }) => {
      return conversationService.addMessageToConversation(
        input.conversationId,
        input.content,
        input.role,
        input.toolCalls,
        input.toolResults,
      )
    }),

  renameConversationTitle: t.procedure
    .input<{ conversationId: string; title: string }>()
    .action(async ({ input }) => {
      const conversation = await conversationService.renameConversationTitle(
        input.conversationId,
        input.title,
      )

      if (conversation) {
        const activeSession = agentSessionTracker
          .getActiveSessions()
          .find((session) => session.conversationId === input.conversationId)

        if (activeSession) {
          agentSessionTracker.updateSession(activeSession.id, {
            conversationTitle: conversation.title,
          })
        }
      }

      return conversation
    }),

  deleteConversation: t.procedure
    .input<{ conversationId: string }>()
    .action(async ({ input }) => {
      await conversationService.deleteConversation(input.conversationId)
    }),

  branchConversation: t.procedure
    .input<{ conversationId: string; messageIndex: number }>()
    .action(async ({ input }) => {
      return conversationService.branchConversation(input.conversationId, input.messageIndex)
    }),

  deleteAllConversations: t.procedure.action(async () => {
    await conversationService.deleteAllConversations()
  }),

  openConversationsFolder: t.procedure.action(async () => {
    await shell.openPath(conversationsFolder)
  }),

  // Panel resize endpoints
  getPanelSize: t.procedure.action(async () => {
    const win = WINDOWS.get("panel")
    if (!win) {
      throw new Error("Panel window not found")
    }
    const [width, height] = win.getSize()
    return { width, height }
  }),

  updatePanelSize: t.procedure
    .input<{ width: number; height: number }>()
    .action(async ({ input }) => {
      if (!isFinitePanelSize(input)) {
        throw new Error("Invalid panel size")
      }

      const win = WINDOWS.get("panel")
      if (!win) {
        throw new Error("Panel window not found")
      }

      const rawMode = getCurrentPanelMode()
      const mode = isPanelSizeMode(rawMode) ? rawMode : "normal"
      const minWidth = getPanelMinWidthForMode(mode)
      const minHeight = getPanelMinHeightForMode(mode)
      const { width: finalWidth, height: finalHeight } = normalizePanelSize(input, minWidth, minHeight)

      // Update size constraints to allow resizing
      win.setMinimumSize(minWidth, minHeight)

      // Set the actual size
      // Mark manual resize to avoid immediate mode re-apply fighting user
      markManualResize()
      win.setSize(finalWidth, finalHeight, false)
      return { width: finalWidth, height: finalHeight }
    }),

  savePanelCustomSize: t.procedure
    .input<{ width: number; height: number }>()
    .action(async ({ input }) => {
      if (!isFinitePanelSize(input)) {
        throw new Error("Invalid panel size")
      }

      const minWidth = getPanelMinWidthForMode("normal")
      const { width, height } = normalizePanelSize(input, minWidth, WAVEFORM_MIN_HEIGHT)

      const config = configStore.get()
      const updatedConfig = {
        ...config,
        panelCustomSize: { width, height },
      }
      configStore.save(updatedConfig)
      return updatedConfig.panelCustomSize
    }),

  // Save panel size with mode-specific persistence
  savePanelModeSize: t.procedure
    .input<{ mode: "normal" | "agent" | "textInput"; width: number; height: number }>()
    .action(async ({ input }) => {
      if (!isFinitePanelSize(input)) {
        throw new Error("Invalid panel size")
      }

      if (!isPanelSizeMode(input.mode)) {
        throw new Error("Invalid panel mode")
      }

      const minWidth = getPanelMinWidthForMode(input.mode)
      const minHeight = getPanelMinHeightForMode(input.mode)
      const { width, height } = normalizePanelSize(input, minWidth, minHeight)

      const config = configStore.get()
      const updatedConfig = { ...config }

      if (input.mode === "agent") {
        updatedConfig.panelProgressSize = { width, height }
      } else if (input.mode === "textInput") {
        updatedConfig.panelTextInputSize = { width, height }
      } else {
        updatedConfig.panelWaveformSize = { width, height }
      }

      configStore.save(updatedConfig)
      return { mode: input.mode, size: { width, height } }
    }),

  // Get current panel mode (from centralized window state)
  getPanelMode: t.procedure.action(async () => {
    return getCurrentPanelMode()
  }),

  initializePanelSize: t.procedure.action(async () => {
    const win = WINDOWS.get("panel")
    if (!win) {
      throw new Error("Panel window not found")
    }

    const config = configStore.get()
    const minWidth = getPanelMinWidthForMode("normal")
    const legacyCustomSize = config.panelCustomSize
    const savedWaveformSize =
      isBoundedPanelSize(config.panelWaveformSize) &&
      config.panelWaveformSize.width >= minWidth &&
      config.panelWaveformSize.height >= WAVEFORM_MIN_HEIGHT
        ? config.panelWaveformSize
        : undefined
    const isCompactLegacyWaveformSize =
      isFinitePanelSize(legacyCustomSize) &&
      legacyCustomSize.width <= LEGACY_WAVEFORM_SIZE_MAX_WIDTH &&
      legacyCustomSize.height <= LEGACY_WAVEFORM_SIZE_MAX_HEIGHT
    const initialWaveformSize = savedWaveformSize ?? (isCompactLegacyWaveformSize ? legacyCustomSize : undefined)

    if (
      initialWaveformSize &&
      Number.isFinite(initialWaveformSize.width) &&
      Number.isFinite(initialWaveformSize.height)
    ) {
      // Apply saved waveform size (use MIN_WAVEFORM_WIDTH to ensure visualizer bars aren't clipped)
      const { width, height } = initialWaveformSize
      const { width: finalWidth, height: finalHeight } = normalizePanelSize(
        { width, height },
        minWidth,
        WAVEFORM_MIN_HEIGHT,
      )

      win.setMinimumSize(minWidth, WAVEFORM_MIN_HEIGHT)
      win.setSize(finalWidth, finalHeight, false) // no animation on init
      return { width: finalWidth, height: finalHeight }
    }

    // Return current size if no custom size saved
    const [width, height] = win.getSize()
    return { width, height }
  }),

  // Profile Management
  getProfiles: t.procedure.action(async () => {
    return agentProfileService.getProfilesLegacy()
  }),

  getProfile: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
        return agentProfileService.getProfileLegacy(input.id)
    }),

  getCurrentProfile: t.procedure.action(async () => {
    return agentProfileService.getCurrentProfileLegacy()
  }),

  // Get the default system prompt for restore functionality
  getDefaultSystemPrompt: t.procedure.action(async () => {
    const { DEFAULT_SYSTEM_PROMPT } = await import("./system-prompts")
    return DEFAULT_SYSTEM_PROMPT
  }),

  createProfile: t.procedure
    .input<{ name: string; guidelines: string; systemPrompt?: string }>()
    .action(async ({ input }) => {
        const profile = agentProfileService.createUserProfile(input.name, input.guidelines, input.systemPrompt)
        return agentProfileService.getProfileLegacy(profile.id)
    }),

  updateProfile: t.procedure
    .input<{ id: string; name?: string; guidelines?: string; systemPrompt?: string }>()
    .action(async ({ input }) => {
        const updates: Partial<AgentProfile> = {}
      if (input.name !== undefined) { updates.displayName = input.name }
      if (input.guidelines !== undefined) updates.guidelines = input.guidelines
      if (input.systemPrompt !== undefined) updates.systemPrompt = input.systemPrompt
      agentProfileService.update(input.id, updates)

      return agentProfileService.getProfileLegacy(input.id)
    }),

  deleteProfile: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
        return agentProfileService.delete(input.id)
    }),

  setCurrentProfile: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
        const profile = agentProfileService.setCurrentProfileStrict(input.id)

      // Update the config with the profile's guidelines, system prompt, and model config
      const config = configStore.get()
      const updatedConfig = {
        ...config,
        mcpCurrentProfileId: profile.id,
        // Apply model config if it exists
        // Agent model settings
        ...((profile.modelConfig?.agentProviderId || profile.modelConfig?.mcpToolsProviderId) && {
          agentProviderId: profile.modelConfig.agentProviderId || profile.modelConfig.mcpToolsProviderId,
        }),
        ...((profile.modelConfig?.agentOpenaiModel || profile.modelConfig?.mcpToolsOpenaiModel) && {
          agentOpenaiModel: profile.modelConfig.agentOpenaiModel || profile.modelConfig.mcpToolsOpenaiModel,
        }),
        ...((profile.modelConfig?.agentGroqModel || profile.modelConfig?.mcpToolsGroqModel) && {
          agentGroqModel: profile.modelConfig.agentGroqModel || profile.modelConfig.mcpToolsGroqModel,
        }),
        ...((profile.modelConfig?.agentGeminiModel || profile.modelConfig?.mcpToolsGeminiModel) && {
          agentGeminiModel: profile.modelConfig.agentGeminiModel || profile.modelConfig.mcpToolsGeminiModel,
        }),
        ...((profile.modelConfig?.agentChatgptWebModel || profile.modelConfig?.mcpToolsChatgptWebModel) && {
          agentChatgptWebModel: profile.modelConfig.agentChatgptWebModel || profile.modelConfig.mcpToolsChatgptWebModel,
        }),
        ...(profile.modelConfig?.currentModelPresetId && {
          currentModelPresetId: profile.modelConfig.currentModelPresetId,
        }),
        // STT Provider settings
        ...(profile.modelConfig?.sttProviderId && {
          sttProviderId: profile.modelConfig.sttProviderId,
        }),
        ...(profile.modelConfig?.openaiSttModel && {
          openaiSttModel: profile.modelConfig.openaiSttModel,
        }),
        ...(profile.modelConfig?.groqSttModel && {
          groqSttModel: profile.modelConfig.groqSttModel,
        }),
        // Transcript Post-Processing settings
        ...(profile.modelConfig?.transcriptPostProcessingProviderId && {
          transcriptPostProcessingProviderId: profile.modelConfig.transcriptPostProcessingProviderId,
        }),
        ...(profile.modelConfig?.transcriptPostProcessingOpenaiModel && {
          transcriptPostProcessingOpenaiModel: profile.modelConfig.transcriptPostProcessingOpenaiModel,
        }),
        ...(profile.modelConfig?.transcriptPostProcessingGroqModel && {
          transcriptPostProcessingGroqModel: profile.modelConfig.transcriptPostProcessingGroqModel,
        }),
        ...(profile.modelConfig?.transcriptPostProcessingGeminiModel && {
          transcriptPostProcessingGeminiModel: profile.modelConfig.transcriptPostProcessingGeminiModel,
        }),
        ...(profile.modelConfig?.transcriptPostProcessingChatgptWebModel && {
          transcriptPostProcessingChatgptWebModel: profile.modelConfig.transcriptPostProcessingChatgptWebModel,
        }),
        // TTS Provider settings
        ...(profile.modelConfig?.ttsProviderId && {
          ttsProviderId: profile.modelConfig.ttsProviderId,
        }),
      }
      configStore.save(updatedConfig)

      // Apply the profile's MCP server configuration
      // If the profile has no toolConfig, we pass empty arrays to reset to default (all enabled)
      const mcpServerConfig = toolConfigToMcpServerConfig(profile.toolConfig)
      mcpService.applyProfileMcpConfig(
        mcpServerConfig?.disabledServers ?? [],
        mcpServerConfig?.disabledTools ?? [],
        mcpServerConfig?.allServersDisabledByDefault ?? false,

        mcpServerConfig?.enabledServers ?? [],
        mcpServerConfig?.enabledRuntimeTools ?? [],
      )

      return agentProfileService.getProfileLegacy(profile.id)
    }),

  exportProfile: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
        return agentProfileService.exportProfile(input.id)
    }),

  importProfile: t.procedure
    .input<{ profileJson: string }>()
    .action(async ({ input }) => {
        return agentProfileService.importProfile(input.profileJson)
    }),

  // Save current MCP server state to a profile
  saveCurrentMcpStateToProfile: t.procedure
    .input<{ profileId: string }>()
    .action(async ({ input }) => {

      const currentState = mcpService.getCurrentMcpConfigState()
      return agentProfileService.saveCurrentMcpStateToProfile(
        input.profileId,
        currentState.disabledServers,
        currentState.disabledTools,

        currentState.enabledServers,
        currentState.enabledRuntimeTools,
      )
    }),

  // Update profile MCP server configuration
  updateProfileMcpConfig: t.procedure

    .input<{
      profileId: string
      disabledServers?: string[]
      disabledTools?: string[]
      enabledServers?: string[]
      enabledRuntimeTools?: string[]
    }>()
    .action(async ({ input }) => {
      return agentProfileService.updateProfileMcpConfig(input.profileId, {
        disabledServers: input.disabledServers,
        disabledTools: input.disabledTools,
        enabledServers: input.enabledServers,
        enabledRuntimeTools: input.enabledRuntimeTools,
      })
    }),

  // Save current model state to a profile
  saveCurrentModelStateToProfile: t.procedure
    .input<{ profileId: string }>()
    .action(async ({ input }) => {
        const config = configStore.get()
      return agentProfileService.saveCurrentModelStateToProfile(input.profileId, {
        // Agent model settings
        agentProviderId: config.agentProviderId || config.mcpToolsProviderId,
        agentOpenaiModel: config.agentOpenaiModel || config.mcpToolsOpenaiModel,
        agentGroqModel: config.agentGroqModel || config.mcpToolsGroqModel,
        agentGeminiModel: config.agentGeminiModel || config.mcpToolsGeminiModel,
        agentChatgptWebModel: config.agentChatgptWebModel || config.mcpToolsChatgptWebModel,
        currentModelPresetId: config.currentModelPresetId,
        // STT Provider settings
        sttProviderId: config.sttProviderId,
        openaiSttModel: config.openaiSttModel,
        groqSttModel: config.groqSttModel,
        // Transcript Post-Processing settings
        transcriptPostProcessingProviderId: config.transcriptPostProcessingProviderId,
        transcriptPostProcessingOpenaiModel: config.transcriptPostProcessingOpenaiModel,
        transcriptPostProcessingGroqModel: config.transcriptPostProcessingGroqModel,
        transcriptPostProcessingGeminiModel: config.transcriptPostProcessingGeminiModel,
        transcriptPostProcessingChatgptWebModel: config.transcriptPostProcessingChatgptWebModel,
        // TTS Provider settings
        ttsProviderId: config.ttsProviderId,
      })
    }),

  // Update profile model configuration
  updateProfileModelConfig: t.procedure
    .input<{
      profileId: string
      // Agent model settings
      agentProviderId?: "openai" | "groq" | "gemini" | "chatgpt-web"
      agentOpenaiModel?: string
      agentGroqModel?: string
      agentGeminiModel?: string
      agentChatgptWebModel?: string
      mcpToolsProviderId?: "openai" | "groq" | "gemini" | "chatgpt-web"
      mcpToolsOpenaiModel?: string
      mcpToolsGroqModel?: string
      mcpToolsGeminiModel?: string
      mcpToolsChatgptWebModel?: string
      currentModelPresetId?: string
      // STT Provider settings
      sttProviderId?: "openai" | "groq" | "parakeet"
      openaiSttModel?: string
      groqSttModel?: string
      // Transcript Post-Processing settings
      transcriptPostProcessingProviderId?: "openai" | "groq" | "gemini" | "chatgpt-web"
      transcriptPostProcessingOpenaiModel?: string
      transcriptPostProcessingGroqModel?: string
      transcriptPostProcessingGeminiModel?: string
      transcriptPostProcessingChatgptWebModel?: string
      // TTS Provider settings
      ttsProviderId?: "openai" | "groq" | "gemini" | "edge" | "kitten" | "supertonic"
    }>()
    .action(async ({ input }) => {
        return agentProfileService.updateProfileModelConfig(input.profileId, {
        // Agent model settings
        agentProviderId: input.agentProviderId ?? input.mcpToolsProviderId,
        agentOpenaiModel: input.agentOpenaiModel ?? input.mcpToolsOpenaiModel,
        agentGroqModel: input.agentGroqModel ?? input.mcpToolsGroqModel,
        agentGeminiModel: input.agentGeminiModel ?? input.mcpToolsGeminiModel,
        agentChatgptWebModel: input.agentChatgptWebModel ?? input.mcpToolsChatgptWebModel,
        currentModelPresetId: input.currentModelPresetId,
        // STT Provider settings
        sttProviderId: input.sttProviderId,
        openaiSttModel: input.openaiSttModel,
        groqSttModel: input.groqSttModel,
        // Transcript Post-Processing settings
        transcriptPostProcessingProviderId: input.transcriptPostProcessingProviderId,
        transcriptPostProcessingOpenaiModel: input.transcriptPostProcessingOpenaiModel,
        transcriptPostProcessingGroqModel: input.transcriptPostProcessingGroqModel,
        transcriptPostProcessingGeminiModel: input.transcriptPostProcessingGeminiModel,
        transcriptPostProcessingChatgptWebModel: input.transcriptPostProcessingChatgptWebModel,
        // TTS Provider settings
        ttsProviderId: input.ttsProviderId,
      })
    }),

  saveProfileFile: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
        const profileJson = agentProfileService.exportProfile(input.id)

      const result = await dialog.showSaveDialog({
        title: "Export Profile",
        defaultPath: "profile.json",
        filters: [
          { name: "JSON Files", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
      })

      if (result.canceled || !result.filePath) {
        return false
      }

      try {
        fs.writeFileSync(result.filePath, profileJson)
        return true
      } catch (error) {
        throw new Error(
          `Failed to save profile: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }),

  loadProfileFile: t.procedure.action(async () => {
    const result = await dialog.showOpenDialog({
      title: "Import Profile",
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
    })

    if (result.canceled || !result.filePaths.length) {
      return null
    }

    try {
      const profileJson = fs.readFileSync(result.filePaths[0], "utf8")
        return agentProfileService.importProfile(profileJson)
    } catch (error) {
      throw new Error(
        `Failed to import profile: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }),

  // Cloudflare Tunnel handlers
  checkCloudflaredInstalled: t.procedure.action(async () => {
    const { checkCloudflaredInstalled } = await import("./cloudflare-tunnel")
    return checkCloudflaredInstalled()
  }),

  startCloudflareTunnel: t.procedure.action(async () => {
    const { startCloudflareTunnel } = await import("./cloudflare-tunnel")
    return startCloudflareTunnel()
  }),

  startNamedCloudflareTunnel: t.procedure
    .input<{
      tunnelId: string
      hostname: string
      credentialsPath?: string
    }>()
    .action(async ({ input }) => {
      const { startNamedCloudflareTunnel } = await import("./cloudflare-tunnel")
      return startNamedCloudflareTunnel(input)
    }),

  stopCloudflareTunnel: t.procedure.action(async () => {
    const { stopCloudflareTunnel } = await import("./cloudflare-tunnel")
    return stopCloudflareTunnel()
  }),

  getCloudflareTunnelStatus: t.procedure.action(async () => {
    const { getCloudflareTunnelStatus } = await import("./cloudflare-tunnel")
    return getCloudflareTunnelStatus()
  }),

  listCloudflareTunnels: t.procedure.action(async () => {
    const { listCloudflareTunnels } = await import("./cloudflare-tunnel")
    return listCloudflareTunnels()
  }),

  checkCloudflaredLoggedIn: t.procedure.action(async () => {
    const { checkCloudflaredLoggedIn } = await import("./cloudflare-tunnel")
    return checkCloudflaredLoggedIn()
  }),

  getRemoteServerStatus: t.procedure.action(async () => {
    return getRemoteServerStatus()
  }),

  getRemoteServerPairingApiKey: t.procedure.action(async () => {
    return getRemoteServerPairingApiKey()
  }),

  // Remote Server QR Code handler
  printRemoteServerQRCode: t.procedure.action(async () => {
    return printQRCodeToTerminal()
  }),

  // MCP Elicitation handlers (Protocol 2025-11-25)
  resolveElicitation: t.procedure
    .input<{
      requestId: string
      action: "accept" | "decline" | "cancel"
      content?: Record<string, string | number | boolean | string[]>
    }>()
    .action(async ({ input }) => {
      const { resolveElicitation } = await import("./mcp-elicitation")
      return resolveElicitation(input.requestId, {
        action: input.action,
        content: input.content,
      })
    }),

  // MCP Sampling handlers (Protocol 2025-11-25)
  resolveSampling: t.procedure
    .input<{
      requestId: string
      approved: boolean
    }>()
    .action(async ({ input }) => {
      const { resolveSampling } = await import("./mcp-sampling")
      return resolveSampling(input.requestId, input.approved)
    }),

  // Message Queue endpoints
  getMessageQueue: t.procedure
    .input<{ conversationId: string }>()
    .action(async ({ input }) => {
          return messageQueueService.getQueue(input.conversationId)
    }),

  getAllMessageQueues: t.procedure.action(async () => {
      const queues = messageQueueService.getAllQueues()
      // Include isPaused state for each queue
      return queues.map(q => ({
        ...q,
        isPaused: messageQueueService.isQueuePaused(q.conversationId),
      }))
  }),

  removeFromMessageQueue: t.procedure
    .input<{ conversationId: string; messageId: string }>()
    .action(async ({ input }) => {
          return removeQueuedMessageById(input.conversationId, input.messageId).success
    }),

  clearMessageQueue: t.procedure
    .input<{ conversationId: string }>()
    .action(async ({ input }) => {
          return messageQueueService.clearQueue(input.conversationId)
    }),

  reorderMessageQueue: t.procedure
    .input<{ conversationId: string; messageIds: string[] }>()
    .action(async ({ input }) => {
          return messageQueueService.reorderQueue(input.conversationId, input.messageIds)
    }),

  updateQueuedMessageText: t.procedure
    .input<{ conversationId: string; messageId: string; text: string }>()
    .action(async ({ input }) => {
      return updateQueuedMessageTextById(input.conversationId, input.messageId, input.text).success
    }),

  retryQueuedMessage: t.procedure
    .input<{ conversationId: string; messageId: string }>()
    .action(async ({ input }) => {
      return retryQueuedMessageById(input.conversationId, input.messageId).success
    }),

  isMessageQueuePaused: t.procedure
    .input<{ conversationId: string }>()
    .action(async ({ input }) => {
          return messageQueueService.isQueuePaused(input.conversationId)
    }),

  pauseMessageQueue: t.procedure
    .input<{ conversationId: string }>()
    .action(async ({ input }) => {
      return pauseMessageQueueByConversationId(input.conversationId).success
    }),

  resumeMessageQueue: t.procedure
    .input<{ conversationId: string }>()
    .action(async ({ input }) => {

      return resumeMessageQueueByConversationId(input.conversationId).success
    }),

  verifyExternalAgentCommand: t.procedure
    .input<{ command: string; args?: string[]; cwd?: string; probeArgs?: string[] }>()
    .action(async ({ input }) => {
      const { verifyExternalAgentCommand } = await import("./command-verification-service")
      return verifyExternalAgentCommand(input)
    }),

  // Get all subagent delegations with conversations for a session
  getSubagentDelegations: t.procedure
    .input<{ sessionId: string }>()
    .action(async ({ input }) => {
      const { getAllDelegationsForSession } = await import("./acp/acp-router-tools")
      return getAllDelegationsForSession(input.sessionId)
    }),

  // Get details of a specific subagent delegation
  getSubagentDelegationDetails: t.procedure
    .input<{ runId: string }>()
    .action(async ({ input }) => {
      const { getDelegatedRunDetails } = await import("./acp/acp-router-tools")
      return getDelegatedRunDetails(input.runId)
    }),

  // ============================================================================
  // Agent Profile Handlers (Unified Profile + ACP Agent)
  // ============================================================================

  getAgentProfiles: t.procedure.action(async () => {
    return agentProfileService.getAll()
  }),

  getAgentProfile: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
      return agentProfileService.getById(input.id)
    }),

  getAgentProfileByName: t.procedure
    .input<{ name: string }>()
    .action(async ({ input }) => {
      return agentProfileService.getByName(input.name)
    }),

  createAgentProfile: t.procedure
    .input<{
      profile: {
        name: string
        displayName: string
        description?: string
        systemPrompt?: string
        guidelines?: string

        properties?: Record<string, string>
        modelConfig?: ProfileModelConfig
        toolConfig?: AgentProfileToolConfig
        skillsConfig?: ProfileSkillsConfig
        connection: AgentProfileConnection
        isStateful?: boolean
        enabled: boolean
        isUserProfile?: boolean
        isAgentTarget?: boolean
        isDefault?: boolean
        autoSpawn?: boolean
      }
    }>()
    .action(async ({ input }) => {
      return agentProfileService.create(input.profile)
    }),

  updateAgentProfile: t.procedure
    .input<{
      id: string
      updates: Partial<AgentProfile>
    }>()
    .action(async ({ input }) => {
      return agentProfileService.update(input.id, input.updates)
    }),

  deleteAgentProfile: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
      return agentProfileService.delete(input.id)
    }),

  getUserProfiles: t.procedure.action(async () => {
    return agentProfileService.getUserProfiles()
  }),

  getAgentTargets: t.procedure.action(async () => {
    return agentProfileService.getAgentTargets()
  }),

  getEnabledAgentTargets: t.procedure.action(async () => {
    return agentProfileService.getEnabledAgentTargets()
  }),

  getCurrentAgentProfile: t.procedure.action(async () => {
    return agentProfileService.getCurrentProfile()
  }),

  setCurrentAgentProfile: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
      const profile = agentProfileService.getById(input.id)
      if (!profile || !profile.enabled) {
        return { success: false }
      }
      agentProfileService.setCurrentProfile(input.id)
      return { success: true }
    }),

  getAgentProfilesByRole: t.procedure
    .input<{ role: AgentProfileRole }>()
    .action(async ({ input }) => {
      return agentProfileService.getByRole(input.role)
    }),

  getExternalAgents: t.procedure.action(async () => {
    return agentProfileService.getExternalAgents()
  }),

  getAgentProfileConversation: t.procedure
    .input<{ profileId: string }>()
    .action(async ({ input }) => {
      return agentProfileService.getConversation(input.profileId)
    }),

  setAgentProfileConversation: t.procedure
    .input<{
      profileId: string
      messages: ConversationMessage[]
    }>()
    .action(async ({ input }) => {
      agentProfileService.setConversation(input.profileId, input.messages)
      return { success: true }
    }),

  clearAgentProfileConversation: t.procedure
    .input<{ profileId: string }>()
    .action(async ({ input }) => {
      agentProfileService.clearConversation(input.profileId)
      return { success: true }
    }),

  reloadAgentProfiles: t.procedure.action(async () => {
    agentProfileService.reload()
    return { success: true }
  }),

  // Agent Skills Management
  getSkills: t.procedure.action(async () => {
    const { skillsService } = await import("./skills-service")
    return skillsService.getSkills()
  }),

  getSkill: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
      const { skillsService } = await import("./skills-service")
      return skillsService.getSkill(input.id)
    }),

  createSkill: t.procedure
    .input<{ name: string; description: string; instructions: string }>()
    .action(async ({ input }) => {
      const { skillsService } = await import("./skills-service")
      const skill = skillsService.createSkill(input.name, input.description, input.instructions)
      // Auto-enable the new skill for the current profile so it's immediately usable
      agentProfileService.enableSkillForCurrentProfile(skill.id)
      return skill
    }),

  updateSkill: t.procedure
    .input<{ id: string; name?: string; description?: string; instructions?: string; enabled?: boolean }>()
    .action(async ({ input }) => {
      const { skillsService } = await import("./skills-service")
      const { id, ...updates } = input
      return skillsService.updateSkill(id, updates)
    }),

  deleteSkill: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
      const { skillsService } = await import("./skills-service")
      const success = skillsService.deleteSkill(input.id)
      if (!success) return false

      const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
      const { getAgentsLayerPaths } = await import("./agents-files/modular-config")
      const { cleanupInvalidSkillReferencesInLayers } = await import("./agent-profile-skill-cleanup")

      const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
      const layers = workspaceAgentsFolder
        ? [getAgentsLayerPaths(globalAgentsFolder), getAgentsLayerPaths(workspaceAgentsFolder)]
        : [getAgentsLayerPaths(globalAgentsFolder)]

      cleanupInvalidSkillReferencesInLayers(layers, skillsService.getSkills().map(skill => skill.id))
      agentProfileService.reload()
      return true
    }),

  deleteSkills: t.procedure
    .input<{ ids: string[] }>()
    .action(async ({ input }) => {
      const { skillsService } = await import("./skills-service")
      const results: { id: string; success: boolean }[] = []
      for (const id of input.ids) {
        const success = skillsService.deleteSkill(id)
        results.push({ id, success })
      }

      if (results.some(result => result.success)) {
        const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
        const { getAgentsLayerPaths } = await import("./agents-files/modular-config")
        const { cleanupInvalidSkillReferencesInLayers } = await import("./agent-profile-skill-cleanup")

        const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
        const layers = workspaceAgentsFolder
          ? [getAgentsLayerPaths(globalAgentsFolder), getAgentsLayerPaths(workspaceAgentsFolder)]
          : [getAgentsLayerPaths(globalAgentsFolder)]

        cleanupInvalidSkillReferencesInLayers(layers, skillsService.getSkills().map(skill => skill.id))
        agentProfileService.reload()
      }

      return results
    }),

  cleanupStaleSkillReferences: t.procedure.action(async () => {
    const { skillsService } = await import("./skills-service")
    const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
    const { getAgentsLayerPaths } = await import("./agents-files/modular-config")
    const { cleanupInvalidSkillReferencesInLayers } = await import("./agent-profile-skill-cleanup")

    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
    const layers = workspaceAgentsFolder
      ? [getAgentsLayerPaths(globalAgentsFolder), getAgentsLayerPaths(workspaceAgentsFolder)]
      : [getAgentsLayerPaths(globalAgentsFolder)]

    const result = cleanupInvalidSkillReferencesInLayers(layers, skillsService.getSkills().map(skill => skill.id))
    if (result.updatedProfileIds.length > 0) {
      agentProfileService.reload()
    }
    return result
  }),

  cleanupStaleMcpServerReferences: t.procedure.action(async () => {
    const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
    const { getAgentsLayerPaths } = await import("./agents-files/modular-config")
    const { cleanupInvalidMcpServerReferencesInLayers } = await import("./agent-profile-mcp-cleanup")

    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
    const layers = workspaceAgentsFolder
      ? [getAgentsLayerPaths(globalAgentsFolder), getAgentsLayerPaths(workspaceAgentsFolder)]
      : [getAgentsLayerPaths(globalAgentsFolder)]

    const validServerNames = Object.keys(configStore.get().mcpConfig?.mcpServers || {})
    const result = cleanupInvalidMcpServerReferencesInLayers(layers, validServerNames)
    if (result.updatedProfileIds.length > 0) {
      agentProfileService.reload()
    }
    return result
  }),

  importSkillFromMarkdown: t.procedure
    .input<{ content: string }>()
    .action(async ({ input }) => {
      const { skillsService } = await import("./skills-service")
      const skill = skillsService.importSkillFromMarkdown(input.content)
      // Auto-enable the imported skill for the current profile so it's immediately usable
      agentProfileService.enableSkillForCurrentProfile(skill.id)
      return skill
    }),

  exportSkillToMarkdown: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
      const { skillsService } = await import("./skills-service")
      return skillsService.exportSkillToMarkdown(input.id)
    }),

  // Import a single skill - can be a .md file or a folder containing SKILL.md
  importSkillFile: t.procedure.action(async () => {
    const { skillsService } = await import("./skills-service")
    const result = await dialog.showOpenDialog({
      title: "Import Skill",
      filters: [
        { name: "Skill Files", extensions: ["md"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile", "showHiddenFiles"],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const skill = skillsService.importSkillFromFile(result.filePaths[0])
    // Auto-enable the imported skill for the current profile so it's immediately usable
    agentProfileService.enableSkillForCurrentProfile(skill.id)
    return skill
  }),

  // Import a skill from a folder containing SKILL.md
  importSkillFolder: t.procedure.action(async () => {
    const { skillsService } = await import("./skills-service")
    const result = await dialog.showOpenDialog({
      title: "Import Skill Folder",
      message: "Select a folder containing SKILL.md",
      properties: ["openDirectory", "showHiddenFiles"],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const skill = skillsService.importSkillFromFolder(result.filePaths[0])
    // Auto-enable the imported skill for the current profile so it's immediately usable
    agentProfileService.enableSkillForCurrentProfile(skill.id)
    return skill
  }),

  // Bulk import all skill folders from a parent directory
  importSkillsFromParentFolder: t.procedure.action(async () => {
    const { skillsService } = await import("./skills-service")
    const result = await dialog.showOpenDialog({
      title: "Import Skills from Folder",
      message: "Select a folder containing multiple skill folders (each with SKILL.md)",
      properties: ["openDirectory", "showHiddenFiles"],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const importResult = skillsService.importSkillsFromParentFolder(result.filePaths[0])
    // Auto-enable all imported skills for the current profile so they're immediately usable
    for (const skill of importResult.imported) {
      agentProfileService.enableSkillForCurrentProfile(skill.id)
    }
    return importResult
  }),

  saveSkillFile: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
      const { skillsService } = await import("./skills-service")
      const skill = skillsService.getSkill(input.id)
      if (!skill) {
        throw new Error(`Skill with id ${input.id} not found`)
      }

      const result = await dialog.showSaveDialog({
        title: "Export Skill",
        defaultPath: `${skill.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`,
        filters: [
          { name: "Markdown Files", extensions: ["md"] },
        ],
      })

      if (result.canceled || !result.filePath) {
        return false
      }

      const content = skillsService.exportSkillToMarkdown(input.id)
      fs.writeFileSync(result.filePath, content)
      return true
    }),

  openSkillsFolder: t.procedure.action(async () => {
    const { globalAgentsFolder } = await import("./config")
    const { getAgentsLayerPaths } = await import("./agents-files/modular-config")
    const { getAgentsSkillsDir } = await import("@dotagents/core")

    // Canonical skills location is the global layer.
    const layer = getAgentsLayerPaths(globalAgentsFolder)
    const skillsDir = getAgentsSkillsDir(layer)

    fs.mkdirSync(skillsDir, { recursive: true })
    const error = await shell.openPath(skillsDir)
    return { success: !error, error: error || undefined }
  }),

  openWorkspaceSkillsFolder: t.procedure.action(async () => {
    const { resolveWorkspaceAgentsFolder } = await import("./config")
    const { getAgentsLayerPaths } = await import("./agents-files/modular-config")
    const { getAgentsSkillsDir } = await import("@dotagents/core")

    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
    if (!workspaceAgentsFolder) return { success: false, error: "No workspace .agents folder detected" }

    const layer = getAgentsLayerPaths(workspaceAgentsFolder)
    const skillsDir = getAgentsSkillsDir(layer)

    fs.mkdirSync(skillsDir, { recursive: true })
    const error = await shell.openPath(skillsDir)
    return { success: !error, error: error || undefined }
  }),

  openSkillFile: t.procedure
    .input<{ skillId: string }>()
    .action(async ({ input }) => {
      const { skillsService } = await import("./skills-service")

      const skill = skillsService.getSkill(input.skillId)
      if (!skill) {
        return { success: false, error: `Skill with id ${input.skillId} not found` }
      }

      const filePath = skillsService.getSkillCanonicalFilePath(input.skillId)
      if (!filePath) {
        return { success: false, error: `No file path found for skill ${input.skillId}` }
      }

      if (!fs.existsSync(filePath)) {
        try {
          fs.mkdirSync(path.dirname(filePath), { recursive: true })
          fs.writeFileSync(filePath, skillsService.exportSkillToMarkdown(input.skillId), "utf8")
        } catch (error) {
          return {
            success: false,
            path: filePath,
            error: error instanceof Error ? error.message : String(error),
          }
        }
      }

      return revealFileInFolder(filePath)
    }),

  scanSkillsFolder: t.procedure.action(async () => {
    const { skillsService } = await import("./skills-service")
    const importedSkills = skillsService.scanSkillsFolder()
    // Auto-enable all newly imported skills for the current profile so they're immediately usable
    for (const skill of importedSkills) {
      agentProfileService.enableSkillForCurrentProfile(skill.id)
    }
    return importedSkills
  }),

  // Import skill(s) from a GitHub repository
  importSkillFromGitHub: t.procedure
    .input<{ repoIdentifier: string }>()
    .action(async ({ input }) => {
      const { skillsService } = await import("./skills-service")
      const result = await skillsService.importSkillFromGitHub(input.repoIdentifier)
      // Auto-enable all imported skills for the current profile so they're immediately usable
      for (const skill of result.imported) {
        agentProfileService.enableSkillForCurrentProfile(skill.id)
      }
      return result
    }),

  // Per-profile skill management
  getProfileSkillsConfig: t.procedure
    .input<{ profileId: string }>()
    .action(async ({ input }) => {
      const profile = agentProfileService.getById(input.profileId)
      // When skillsConfig is undefined, all skills are enabled by default
      return profile?.skillsConfig ?? { enabledSkillIds: [], allSkillsDisabledByDefault: false }
    }),

  updateProfileSkillsConfig: t.procedure
    .input<{ profileId: string; enabledSkillIds?: string[]; allSkillsDisabledByDefault?: boolean }>()
    .action(async ({ input }) => {
      const { profileId, ...config } = input
      return agentProfileService.updateProfileSkillsConfig(profileId, config)
    }),

  toggleProfileSkill: t.procedure
    .input<{ profileId: string; skillId: string }>()
    .action(async ({ input }) => {
      // Pass all available skill IDs so the toggle can properly transition
      // from "all enabled by default" to explicit opt-in mode
      const { skillsService } = await import("./skills-service")
      const allSkillIds = skillsService.refreshFromDisk().map(s => s.id)
      return agentProfileService.toggleProfileSkill(input.profileId, input.skillId, allSkillIds)
    }),

  isSkillEnabledForProfile: t.procedure
    .input<{ profileId: string; skillId: string }>()
    .action(async ({ input }) => {
      return agentProfileService.isSkillEnabledForProfile(input.profileId, input.skillId)
    }),

  getEnabledSkillIdsForProfile: t.procedure
    .input<{ profileId: string }>()
    .action(async ({ input }) => {
      const enabledSkillIds = agentProfileService.getEnabledSkillIdsForProfile(input.profileId)
      if (enabledSkillIds === null) {
        // null means "all skills enabled" — return all available skill IDs
        const { skillsService } = await import("./skills-service")
        return skillsService.refreshFromDisk().map(s => s.id)
      }
      return enabledSkillIds
    }),

  // Get enabled skills instructions for a specific profile
  getEnabledSkillsInstructionsForProfile: t.procedure
    .input<{ profileId: string }>()
    .action(async ({ input }) => {
      const { skillsService } = await import("./skills-service")
      const enabledSkillIds = agentProfileService.getEnabledSkillIdsForProfile(input.profileId)
      if (enabledSkillIds === null) {
        // null means "all skills enabled" — use all available skill IDs
        const allSkillIds = skillsService.refreshFromDisk().map(s => s.id)
        return skillsService.getEnabledSkillsInstructionsForProfile(allSkillIds)
      }
      return skillsService.getEnabledSkillsInstructionsForProfile(enabledSkillIds)
    }),

  // ============================================================================
  // Bundle Export/Import (Issue #25: .dotagents bundles)
  // ============================================================================

  getBundleExportableItems: t.procedure.action(async () => {
    const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
    const { getBundleExportableItemsFromLayers } = await import("./bundle-service")
    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()

    return getBundleExportableItemsFromLayers(
      workspaceAgentsFolder
        ? [globalAgentsFolder, workspaceAgentsFolder]
        : [globalAgentsFolder]
    )
  }),

  exportBundle: t.procedure
    .input<{
      name?: string
      description?: string
      publicMetadata?: {
        summary: string
        author: {
          displayName: string
          handle?: string
          url?: string
        }
        tags: string[]
        compatibility?: {
          minDesktopVersion?: string
          notes?: string[]
        }
      }
      agentProfileIds?: string[]
      mcpServerNames?: string[]
      skillIds?: string[]
      repeatTaskIds?: string[]
      knowledgeNoteIds?: string[]
      components?: {
        agentProfiles?: boolean
        mcpServers?: boolean
        skills?: boolean
        repeatTasks?: boolean
        knowledgeNotes?: boolean
      }
    } | undefined>()
    .action(async ({ input }) => {
      const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
      const { exportBundleToFile, exportBundleToFileFromLayers } = await import("./bundle-service")
      const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
      const exportOptions = {
        name: input?.name,
        description: input?.description,
        publicMetadata: input?.publicMetadata,
        agentProfileIds: input?.agentProfileIds,
        mcpServerNames: input?.mcpServerNames,
        skillIds: input?.skillIds,
        repeatTaskIds: input?.repeatTaskIds,
        knowledgeNoteIds: input?.knowledgeNoteIds,
        components: input?.components,
      }

      // Export from merged layers when a workspace overlay exists (workspace wins on conflicts).
      if (workspaceAgentsFolder) {
        return exportBundleToFileFromLayers([globalAgentsFolder, workspaceAgentsFolder], exportOptions)
      }

      return exportBundleToFile(globalAgentsFolder, exportOptions)
    }),

  generatePublishPayload: t.procedure
    .input<{
      name?: string
      catalogId?: string
      artifactUrl?: string
      description?: string
      publicMetadata: {
        summary: string
        author: {
          displayName: string
          handle?: string
          url?: string
        }
        tags: string[]
        compatibility?: {
          minDesktopVersion?: string
          notes?: string[]
        }
      }
      components?: {
        agentProfiles?: boolean
        mcpServers?: boolean
        skills?: boolean
        repeatTasks?: boolean
        knowledgeNotes?: boolean
      }
      agentProfileIds?: string[]
      mcpServerNames?: string[]
      skillIds?: string[]
      repeatTaskIds?: string[]
      knowledgeNoteIds?: string[]
    }>()
    .action(async ({ input }) => {
      const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
      const { generatePublishPayload } = await import("./bundle-service")
      const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
      const dirs = workspaceAgentsFolder
        ? [globalAgentsFolder, workspaceAgentsFolder]
        : [globalAgentsFolder]
      return generatePublishPayload(dirs, {
        name: input.name,
        catalogId: input.catalogId,
        artifactUrl: input.artifactUrl,
        description: input.description,
        publicMetadata: input.publicMetadata,
        agentProfileIds: input.agentProfileIds,
        mcpServerNames: input.mcpServerNames,
        components: input.components,
        skillIds: input.skillIds,
        repeatTaskIds: input.repeatTaskIds,
        knowledgeNoteIds: input.knowledgeNoteIds,
      })
    }),

  saveHubPublishPayloadFile: t.procedure
    .input<{
      catalogId: string
      payloadJson: string
    }>()
    .action(async ({ input }) => {
      const safeBaseName = (input.catalogId || "hub-publish")
        .replace(/[^a-z0-9-_]+/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        || "hub-publish"

      const result = await dialog.showSaveDialog({
        title: "Save Hub Publish Package",
        defaultPath: `${safeBaseName}.hub-publish.json`,
        filters: [
          { name: "Hub Publish Package", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] },
        ],
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      fs.writeFileSync(result.filePath, input.payloadJson, "utf-8")
      return { success: true, canceled: false, filePath: result.filePath }
    }),

  previewBundle: t.procedure.action(async () => {
    const { previewBundleFromDialog } = await import("./bundle-service")
    return previewBundleFromDialog()
  }),

  previewBundleWithConflicts: t.procedure
    .input<{ filePath: string }>()
    .action(async ({ input }) => {
      const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
      const { previewBundleWithConflicts } = await import("./bundle-service")
      const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
      const targetDir = workspaceAgentsFolder || globalAgentsFolder
      const targetPreview = previewBundleWithConflicts(input.filePath, targetDir)

      // With workspace overlays, merge conflicts from global + workspace so preview
      // matches the merged UI view and catches shadowing collisions.
      if (!workspaceAgentsFolder || !targetPreview.success) {
        return targetPreview
      }

      const globalPreview = previewBundleWithConflicts(input.filePath, globalAgentsFolder)
      if (!globalPreview.success) {
        return targetPreview
      }

      const mergedConflicts = mergeConflictMaps(
        (globalPreview as BundleConflictPreview).conflicts,
        (targetPreview as BundleConflictPreview).conflicts
      )

      return {
        ...targetPreview,
        conflicts: mergedConflicts,
      }
    }),

  importBundle: t.procedure
    .input<{
      filePath: string
      conflictStrategy: "skip" | "overwrite" | "rename"
      components?: {
        agentProfiles?: boolean
        mcpServers?: boolean
        skills?: boolean
        repeatTasks?: boolean
        knowledgeNotes?: boolean
      }
    }>()
    .action(async ({ input }) => {
      const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
      const { importBundle } = await import("./bundle-service")
      // Use workspace layer if present, otherwise global
      const targetDir = resolveWorkspaceAgentsFolder() || globalAgentsFolder
      const result = await importBundle(input.filePath, targetDir, {
        conflictStrategy: input.conflictStrategy,
        components: input.components,
      })
      await refreshRuntimeAfterBundleImport()
      return result
    }),

  importBundleFromDialog: t.procedure
    .input<{
      conflictStrategy: "skip" | "overwrite" | "rename"
      components?: {
        agentProfiles?: boolean
        mcpServers?: boolean
        skills?: boolean
        repeatTasks?: boolean
        knowledgeNotes?: boolean
      }
    }>()
    .action(async ({ input }) => {
      const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
      const { importBundleFromDialog } = await import("./bundle-service")
      // Use workspace layer if present, otherwise global
      const targetDir = resolveWorkspaceAgentsFolder() || globalAgentsFolder
      const result = await importBundleFromDialog(targetDir, {
        conflictStrategy: input.conflictStrategy,
        components: input.components,
      })
      if (result) {
        await refreshRuntimeAfterBundleImport()
      }
      return result
    }),

  // ============================================================================
  // Sandbox Slots (Issue #141: bundle sandbox/profile slots)
  // ============================================================================
  getSandboxState: t.procedure.action(async () => {
    const { globalAgentsFolder } = await import("./config")
    const { getSandboxState } = await import("./sandbox-service")
    return getSandboxState(globalAgentsFolder)
  }),
  saveBaseline: t.procedure.action(async () => {
    const { globalAgentsFolder } = await import("./config")
    const { saveBaseline } = await import("./sandbox-service")
    return saveBaseline(globalAgentsFolder)
  }),
  saveCurrentAsSlot: t.procedure
    .input<{ name: string; sourceBundleName?: string }>()
    .action(async ({ input }) => {
      const { globalAgentsFolder } = await import("./config")
      const { saveCurrentAsSlot } = await import("./sandbox-service")
      return saveCurrentAsSlot(globalAgentsFolder, input.name, {
        sourceBundleName: input.sourceBundleName,
      })
    }),
  switchToSlot: t.procedure
    .input<{ name: string }>()
    .action(async ({ input }) => {
      const { globalAgentsFolder } = await import("./config")
      const { switchToSlot } = await import("./sandbox-service")
      const result = switchToSlot(globalAgentsFolder, input.name)
      if (result.success) {
        await refreshRuntimeAfterBundleImport()
      }
      return result
    }),
  restoreBaseline: t.procedure.action(async () => {
    const { globalAgentsFolder } = await import("./config")
    const { restoreBaseline } = await import("./sandbox-service")
    const result = restoreBaseline(globalAgentsFolder)
    if (result.success) {
      await refreshRuntimeAfterBundleImport()
    }
    return result
  }),
  deleteSlot: t.procedure
    .input<{ name: string }>()
    .action(async ({ input }) => {
      const { globalAgentsFolder } = await import("./config")
      const { deleteSlot } = await import("./sandbox-service")
      return deleteSlot(globalAgentsFolder, input.name)
    }),
  renameSlot: t.procedure
    .input<{ oldName: string; newName: string }>()
    .action(async ({ input }) => {
      const { globalAgentsFolder } = await import("./config")
      const { renameSlot } = await import("./sandbox-service")
      return renameSlot(globalAgentsFolder, input.oldName, input.newName)
    }),
  importBundleToSandbox: t.procedure
    .input<{
      filePath: string
      slotName: string
      conflictStrategy: "skip" | "overwrite" | "rename"
      components?: {
        agentProfiles?: boolean
        mcpServers?: boolean
        skills?: boolean
        repeatTasks?: boolean
        knowledgeNotes?: boolean
      }
    }>()
    .action(async ({ input }) => {
      const { globalAgentsFolder } = await import("./config")
      const { createSlotFromCurrentState, switchToSlot } = await import("./sandbox-service")
      const { importBundle, previewBundle } = await import("./bundle-service")

      // Get bundle name for the slot metadata
      const bundle = previewBundle(input.filePath)
      const sourceBundleName = bundle?.manifest.name

      // Reject reserved slot names to prevent overwriting the baseline
      const { sanitizeSlotName } = await import("./sandbox-service")
      if (sanitizeSlotName(input.slotName) === "default") {
        return { success: false, errors: ["Cannot import a bundle into the reserved \"default\" baseline slot"] }
      }

      // Save baseline if needed, then create the new slot from current state
      const slotResult = createSlotFromCurrentState(
        globalAgentsFolder,
        input.slotName,
        { sourceBundleName }
      )
      if (!slotResult.success) {
        return { success: false, errors: [slotResult.error || "Failed to create sandbox slot"] }
      }

      // Switch to the new slot
      const switchResult = switchToSlot(globalAgentsFolder, input.slotName)
      if (!switchResult.success) {
        return { success: false, errors: [switchResult.error || "Failed to switch to sandbox slot"] }
      }

      // Import the bundle into the now-active slot
      const importResult = await importBundle(input.filePath, globalAgentsFolder, {
        conflictStrategy: input.conflictStrategy,
        components: input.components,
      })

      // Re-save the slot with the imported bundle state
      const { saveCurrentAsSlot } = await import("./sandbox-service")
      const saveResult = saveCurrentAsSlot(globalAgentsFolder, input.slotName, { sourceBundleName })
      if (!saveResult.success) {
        return { success: false, errors: [saveResult.error || "Failed to save sandbox slot after importing bundle"] }
      }

      await refreshRuntimeAfterBundleImport()
      return importResult
    }),

  // Knowledge notes service handlers
  getAllKnowledgeNotes: t.procedure
    .input<{
      context?: KnowledgeNoteContext
      dateFilter?: KnowledgeNoteDateFilter
      sort?: KnowledgeNoteSort
      limit?: number
    }>()
    .action(async ({ input }) => {
      return knowledgeNotesService.getAllNotes({
        context: input?.context,
        dateFilter: input?.dateFilter,
        sort: input?.sort,
        limit: input?.limit,
      })
    }),

  getKnowledgeNotesOverview: t.procedure
    .input<{
      context?: KnowledgeNoteContext
      dateFilter?: KnowledgeNoteDateFilter
    }>()
    .action(async ({ input }) => {
      return knowledgeNotesService.getOverview({ context: input?.context, dateFilter: input?.dateFilter })
    }),

  getKnowledgeNotesByGroup: t.procedure
    .input<{
      groupKey: string
      seriesKey?: string
      context?: KnowledgeNoteContext
      dateFilter?: KnowledgeNoteDateFilter
      sort?: KnowledgeNoteSort
    }>()
    .action(async ({ input }) => {
      return knowledgeNotesService.getNotesByGroup(input)
    }),

  getKnowledgeNote: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
      return knowledgeNotesService.getNote(input.id)
    }),

  saveKnowledgeNoteFromSummary: t.procedure
    .input<{
      summary: AgentStepSummary
      title?: string
      userNotes?: string
      tags?: string[]
      conversationTitle?: string
      conversationId?: string
    }>()
    .action(async ({ input }) => {
      const note = knowledgeNotesService.createNoteFromSummary(
        input.summary,
        input.title,
        input.userNotes,
        input.tags,
        input.conversationTitle,
        input.conversationId,
      )
      if (!note) {
        return { success: true, note: null, reason: "no_durable_content" as const }
      }
      const success = await knowledgeNotesService.saveNote(note)
      return { success, note: success ? note : null }
    }),

  saveKnowledgeNote: t.procedure
    .input<{
      note: KnowledgeNote
    }>()
    .action(async ({ input }) => {
      return knowledgeNotesService.saveNote(input.note)
    }),

  updateKnowledgeNote: t.procedure
    .input<{
      id: string
      updates: Partial<Omit<KnowledgeNote, "id" | "createdAt">>
    }>()
    .action(async ({ input }) => {
      return knowledgeNotesService.updateNote(input.id, input.updates)
    }),

  deleteKnowledgeNote: t.procedure
    .input<{ id: string }>()
    .action(async ({ input }) => {
      return knowledgeNotesService.deleteNote(input.id)
    }),

  deleteMultipleKnowledgeNotes: t.procedure
    .input<{ ids: string[] }>()
    .action(async ({ input }) => {
      const result = await knowledgeNotesService.deleteMultipleNotes(input.ids)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.deletedCount
    }),

  deleteAllKnowledgeNotes: t.procedure
    .action(async () => {
      const result = await knowledgeNotesService.deleteAllNotes()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.deletedCount
    }),

  searchKnowledgeNotes: t.procedure
    .input<{
      query: string
      context?: KnowledgeNoteContext
      dateFilter?: KnowledgeNoteDateFilter
      sort?: KnowledgeNoteSort
      limit?: number
    }>()
    .action(async ({ input }) => {
      return knowledgeNotesService.searchNotes(input.query, {
        context: input.context,
        dateFilter: input.dateFilter,
        sort: input.sort,
        limit: input.limit,
      })
    }),

  // Summarization service handlers
  getSessionSummaries: t.procedure
    .input<{ sessionId: string }>()
    .action(async ({ input }) => {
      return summarizationService.getSummaries(input.sessionId)
    }),

  getImportantSummaries: t.procedure
    .input<{ sessionId: string }>()
    .action(async ({ input }) => {
      return summarizationService.getImportantSummaries(input.sessionId)
    }),

  // Repeat Tasks handlers
  getLoops: t.procedure.action(async () => {
    return loopService.getLoops()
  }),

  getLoopStatuses: t.procedure.action(async () => {
    return loopService.getLoopStatuses()
  }),

  openLoopTaskFile: t.procedure
    .input<{ loopId: string }>()
    .action(async ({ input }) => {
      const loop = loopService.getLoop(input.loopId)
      if (!loop) {
        return { success: false, error: `Task with id ${input.loopId} not found` }
      }

      const { globalAgentsFolder, resolveWorkspaceAgentsFolder } = await import("./config")
      const { getAgentsLayerPaths } = await import("./agents-files/modular-config")
      const { loadTasksLayer, taskIdToFilePath, writeTaskFile } = await import("@dotagents/core")

      const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
      const workspaceDir = resolveWorkspaceAgentsFolder()
      const workspaceLayer = workspaceDir ? getAgentsLayerPaths(workspaceDir) : null

      let filePath: string | undefined

      if (workspaceLayer) {
        const workspaceLoaded = loadTasksLayer(workspaceLayer)
        filePath = workspaceLoaded.originById.get(input.loopId)?.filePath
      }

      if (!filePath) {
        const globalLoaded = loadTasksLayer(globalLayer)
        filePath = globalLoaded.originById.get(input.loopId)?.filePath
      }

      if (!filePath) {
        writeTaskFile(globalLayer, loop, { maxBackups: 10 })
        filePath = taskIdToFilePath(globalLayer, input.loopId)
      }

      return revealFileInFolder(filePath)
    }),

  saveLoop: t.procedure
    .input<{ loop: LoopConfig }>()
    .action(async ({ input }) => {
      return { success: loopService.saveLoop(input.loop) }
    }),

  deleteLoop: t.procedure
    .input<{ loopId: string }>()
    .action(async ({ input }) => {
      return { success: loopService.deleteLoop(input.loopId) }
    }),

  startLoop: t.procedure
    .input<{ loopId: string }>()
    .action(async ({ input }) => {
      return { success: loopService.startLoop(input.loopId) }
    }),

  stopLoop: t.procedure
    .input<{ loopId: string }>()
    .action(async ({ input }) => {
      return { success: loopService.stopLoop(input.loopId) }
    }),

  triggerLoop: t.procedure
    .input<{ loopId: string }>()
    .action(async ({ input }) => {
      return { success: await loopService.triggerLoop(input.loopId) }
    }),

  startAllLoops: t.procedure.action(async () => {
    loopService.startAllLoops()
    return { success: true }
  }),

  stopAllLoops: t.procedure.action(async () => {
    loopService.stopAllLoops()
    return { success: true }
  }),
}

export type Router = typeof router
