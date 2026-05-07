import { randomUUID } from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { createMobileApiRouteActions } from "@dotagents/shared/remote-server-route-contracts"
import { getAgentsLayerPaths, type LoopConfig } from "@dotagents/core"
import {
  createAgentSessionCandidateService,
  createAgentSessionCandidateRouteActions,
  type AgentSessionCandidateActionOptions,
} from "@dotagents/shared/agent-session-candidates"
import { getEnabledAcpxAgentProfiles } from "@dotagents/shared/agent-profile-queries"
import {
  createTemporaryBundleFileImportService,
  createTemporaryBundleFileName,
  createLayeredBundleActionService,
  createBundleRouteActions,
  resolveBundleImportTargetDir,
  type ExportBundleRequest,
} from "@dotagents/shared/bundle-api"
import {
  createKnowledgeNoteActionService,
  createKnowledgeNoteRouteActions,
  type KnowledgeNoteActionOptions,
} from "@dotagents/shared/knowledge-note-form"
import {
  createChatTranscriptHistoryRecorder,
  createChatRouteActionBundle,
  type ChatCompletionActionOptions,
  type ModelActionOptions,
} from "@dotagents/shared/chat-utils"
import {
  createConversationActionService,
  createConversationRouteActions,
  type ConversationActionOptions,
} from "@dotagents/shared/conversation-sync"
import { getConversationIdValidationError } from "@dotagents/shared/conversation-id"
import {
  createConversationVideoAssetFileService,
  createConversationVideoAssetRouteActions,
  type ConversationVideoAssetActionOptions,
} from "@dotagents/shared/conversation-media-assets"
import {
  applyDiscordLifecycleActionToService,
  getDiscordLifecycleAction,
  getDiscordResolvedDefaultProfileId,
  getMaskedDiscordBotToken,
} from "@dotagents/shared/discord-config"
import {
  RESERVED_RUNTIME_TOOL_SERVER_NAMES,
  createMcpConfigActionService,
  createMcpRouteActions,
  type McpServerConfigActionOptions,
} from "@dotagents/shared/mcp-api"
import { getMaskedRemoteServerApiKey } from "@dotagents/shared/remote-pairing"
import {
  createTtsRouteActions,
  type TtsActionOptions,
} from "@dotagents/shared/tts-api"
import {
  createSettingsRouteActionBundle,
  type EmergencyStopActionOptions,
  type SettingsActionOptions,
} from "@dotagents/shared/settings-api-client"
import {
  createSkillActionService,
  createSkillRouteActions,
  type SkillActionOptions,
} from "@dotagents/shared/skills-api"
import {
  createPushConfigTokenStore,
  createPushRouteActions,
} from "@dotagents/shared/push-notifications"
import {
  createProfileRouteActionBundle,
} from "@dotagents/shared/profile-api"
import {
  createRepeatTaskRuntimeId,
  createRepeatTaskRouteActions,
  type RepeatTaskActionOptions,
  type RepeatTaskLoopService,
} from "@dotagents/shared/repeat-task-utils"
import { resolveAgentProfileReferenceCleanupLayers } from "@dotagents/shared/agent-profile-reference-cleanup"
import type { Config } from "../shared/types"
import {
  exportBundleFromLayers,
  getBundleExportableItemsFromLayers,
  importBundle as importBundleFromFile,
  previewBundleWithConflicts,
} from "./bundle-service"
import { conversationService } from "./conversation-service"
import { getConversationVideoAssetPath } from "./conversation-video-assets"
import { recordOperatorAuditEvent } from "./operator-audit-actions"
import { cleanupInvalidMcpServerReferencesInLayers } from "./agent-profile-mcp-cleanup"
import { cleanupInvalidSkillReferencesInLayers } from "./agent-profile-skill-cleanup"
import { agentProfileService, toolConfigToMcpServerConfig } from "./agent-profile-service"
import { agentSessionTracker } from "./agent-session-tracker"
import { verifyExternalAgentCommand as verifyExternalAgentCommandService } from "./command-verification-service"
import { configStore, globalAgentsFolder, recordingsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { applyDesktopShellSettings } from "./desktop-shell-settings"
import { diagnosticsService } from "./diagnostics"
import { discordService } from "./discord-service"
import { emergencyStopAll } from "./emergency-stop"
import { knowledgeNotesService } from "./knowledge-notes-service"
import { handleWhatsAppToggle, mcpService } from "./mcp-service"
import { clearBadgeCount, isPushEnabled, sendMessageNotification } from "./push-notification-service"
import { skillsService } from "./skills-service"
import { generateTTS } from "./tts-service"

type DesktopConversationActionConversation = NonNullable<Awaited<ReturnType<typeof conversationService.loadConversation>>>

const modelActionOptions: ModelActionOptions = {
  getConfig: () => configStore.get(),
  fetchAvailableModels: async (providerId) => {
    const { fetchAvailableModels } = await import("./models-service")
    return fetchAvailableModels(providerId)
  },
  diagnostics: diagnosticsService,
}

const historyPath = path.join(recordingsFolder, "history.json")
const recordHistory = createChatTranscriptHistoryRecorder({
  store: {
    ensureStorage: () => fs.mkdirSync(recordingsFolder, { recursive: true }),
    readHistoryText: () => fs.readFileSync(historyPath, "utf8"),
    writeHistoryText: (historyText) => fs.writeFileSync(historyPath, historyText),
  },
  diagnostics: diagnosticsService,
})

const chatCompletionActionOptions: ChatCompletionActionOptions = {
  diagnostics: diagnosticsService,
  getActiveModelConfig: () => configStore.get(),
  validateConversationId: getConversationIdValidationError,
  recordHistory,
  isPushEnabled,
  sendPushNotification: sendMessageNotification,
  logger: console,
}

const chatRouteActionBundle = createChatRouteActionBundle({
  models: modelActionOptions,
  chatCompletion: chatCompletionActionOptions,
})

const agentSessionCandidateActionOptions: AgentSessionCandidateActionOptions = {
  service: createAgentSessionCandidateService(agentSessionTracker),
  diagnostics: diagnosticsService,
}

const agentSessionCandidateRouteActions = createAgentSessionCandidateRouteActions(agentSessionCandidateActionOptions)

const ttsActionOptions: TtsActionOptions<Config> = {
  getConfig: () => configStore.get(),
  generateSpeech: generateTTS,
  encodeAudioBody: (audio) => Buffer.from(audio),
  diagnostics: diagnosticsService,
}

const ttsRouteActions = createTtsRouteActions(ttsActionOptions)

const emergencyStopActionOptions: EmergencyStopActionOptions = {
  stopAll: emergencyStopAll,
  diagnostics: diagnosticsService,
  logger: console,
}

const settingsActionOptions: SettingsActionOptions<Config> = {
  config: {
    get: () => configStore.get(),
    save: (config) => configStore.save(config),
  },
  diagnostics: diagnosticsService,
  getMaskedRemoteServerApiKey: (config) => getMaskedRemoteServerApiKey(config.remoteServerApiKey),
  getMaskedDiscordBotToken: (config) => getMaskedDiscordBotToken(config, process.env),
  getDiscordDefaultProfileId: (config) => getDiscordResolvedDefaultProfileId(config, process.env).profileId ?? "",
  getAcpxAgents: () => getEnabledAcpxAgentProfiles(agentProfileService.getAll())
    .map(p => ({ name: p.name, displayName: p.displayName })),
  getDiscordLifecycleAction: (prev, next) => getDiscordLifecycleAction(prev, next, process.env),
  applyDiscordLifecycleAction: (action) => applyDiscordLifecycleActionToService(action, discordService),
  applyWhatsappToggle: handleWhatsAppToggle,
  applyDesktopShellSettings,
}

const settingsRouteActionBundle = createSettingsRouteActionBundle({
  settings: settingsActionOptions,
  emergencyStop: emergencyStopActionOptions,
})

const pushActionOptions = {
  tokenStore: createPushConfigTokenStore({
    get: () => configStore.get(),
    save: (config) => configStore.save(config),
  }),
  diagnostics: diagnosticsService,
  badgeService: {
    clearBadgeCount,
  },
}

const pushRouteActions = createPushRouteActions(pushActionOptions)

function getBundleImportTargetDir(): string {
  return resolveBundleImportTargetDir(globalAgentsFolder, resolveWorkspaceAgentsFolder())
}

const temporaryBundleImportService = createTemporaryBundleFileImportService({
  temporaryFiles: {
    writeTemporaryBundleFile: (bundleJson) => {
      const tempDir = path.join(os.tmpdir(), "dotagents-bundle-import")
      fs.mkdirSync(tempDir, { recursive: true })
      const filePath = path.join(tempDir, createTemporaryBundleFileName({ createUniqueId: randomUUID }))
      fs.writeFileSync(filePath, bundleJson, "utf8")
      return filePath
    },
    deleteTemporaryBundleFile: (filePath) => {
      fs.unlinkSync(filePath)
    },
  },
  service: {
    getImportTargetDir: getBundleImportTargetDir,
    previewBundleFile: (filePath, targetDir) => previewBundleWithConflicts(filePath, targetDir),
    importBundleFile: (filePath, targetDir, request) =>
      importBundleFromFile(filePath, targetDir, request),
  },
})

const bundleActionService = createLayeredBundleActionService({
  getGlobalAgentsFolder: () => globalAgentsFolder,
  getWorkspaceAgentsFolder: resolveWorkspaceAgentsFolder,
  getExportableItemsFromLayers,
  exportBundleFromLayers: (layerDirs, request: ExportBundleRequest) => exportBundleFromLayers(layerDirs, request),
  previewBundleImport: temporaryBundleImportService.previewBundleImport,
  importBundle: temporaryBundleImportService.importBundle,
})

const bundleActionOptions = {
  service: bundleActionService,
  diagnostics: diagnosticsService,
}

const bundleRouteActions = createBundleRouteActions(bundleActionOptions)

const conversationActionOptions: ConversationActionOptions<DesktopConversationActionConversation> = {
  service: createConversationActionService({
    service: conversationService,
    generateConversationId: () => conversationService.generateConversationIdPublic(),
  }),
  diagnostics: diagnosticsService,
  validateConversationId: getConversationIdValidationError,
  now: () => Date.now(),
}

const conversationRouteActions = createConversationRouteActions(conversationActionOptions)

const conversationVideoAssetActionOptions: ConversationVideoAssetActionOptions = {
  service: createConversationVideoAssetFileService({
    resolveVideoAssetPath: getConversationVideoAssetPath,
    fileSystem: {
      getFileInfo: async (assetPath) => {
        const stat = await fs.promises.stat(assetPath)
        return { size: stat.size, isFile: stat.isFile() }
      },
      createReadBody: (assetPath, range) => range
        ? fs.createReadStream(assetPath, { start: range.start, end: range.end })
        : fs.createReadStream(assetPath),
    },
  }),
  validateConversationId: getConversationIdValidationError,
  diagnostics: diagnosticsService,
}

const conversationVideoAssetRouteActions = createConversationVideoAssetRouteActions(conversationVideoAssetActionOptions)

const profileRouteActionBundle = createProfileRouteActionBundle({
  services: {
    profile: {
      getUserProfiles: () => agentProfileService.getUserProfiles(),
      getCurrentProfile: () => agentProfileService.getCurrentProfile(),
      setCurrentProfileStrict: (profileId) => agentProfileService.setCurrentProfileStrict(profileId),
      exportProfile: (profileId) => agentProfileService.exportProfile(profileId),
      importProfile: (profileJson) => agentProfileService.importProfile(profileJson),
    },
    agentProfile: {
      getAll: () => agentProfileService.getAll(),
      getById: (profileId) => agentProfileService.getById(profileId),
      create: (profile) => agentProfileService.create(profile),
      update: (profileId, updates) => agentProfileService.update(profileId, updates),
      deleteProfile: (profileId) => agentProfileService.delete(profileId),
      reload: () => agentProfileService.reload(),
    },
    externalCommandVerification: {
      verifyExternalAgentCommand: verifyExternalAgentCommandService,
    },
  },
  diagnostics: diagnosticsService,
  applyCurrentProfile: (profile) => {
    const mcpServerConfig = toolConfigToMcpServerConfig(profile.toolConfig)
    mcpService.applyProfileMcpConfig(
      mcpServerConfig?.disabledServers,
      mcpServerConfig?.disabledTools,
      mcpServerConfig?.allServersDisabledByDefault,
      mcpServerConfig?.enabledServers,
      mcpServerConfig?.enabledRuntimeTools,
    )
  },
})

const knowledgeNoteActionOptions: KnowledgeNoteActionOptions = {
  service: createKnowledgeNoteActionService(knowledgeNotesService),
  diagnostics: diagnosticsService,
}

const knowledgeNoteRouteActions = createKnowledgeNoteRouteActions(knowledgeNoteActionOptions)

function getLoopProfileName(profileId?: string): string | undefined {
  return profileId ? agentProfileService.getById(profileId)?.displayName : undefined
}

async function loadLoopService(): Promise<RepeatTaskLoopService<LoopConfig> | null> {
  try {
    const { loopService } = await import("./loop-service")
    return loopService
  } catch {
    return null
  }
}

const repeatTaskActionOptions: RepeatTaskActionOptions<LoopConfig, ReturnType<typeof configStore.get>> = {
  loadLoopService,
  getConfig: () => configStore.get(),
  saveConfig: (config) => configStore.save(config),
  createId: createRepeatTaskRuntimeId,
  getProfileName: getLoopProfileName,
  diagnostics: diagnosticsService,
}

const repeatTaskRouteActions = createRepeatTaskRouteActions(repeatTaskActionOptions)

const mcpServerActionOptions = {
  service: mcpService,
  diagnostics: diagnosticsService,
}

function getAgentProfileReferenceCleanupLayers() {
  return resolveAgentProfileReferenceCleanupLayers(
    globalAgentsFolder,
    resolveWorkspaceAgentsFolder(),
    getAgentsLayerPaths,
  )
}

function cleanupInvalidAgentProfileMcpReferences(validServerNames: string[]): void {
  const layers = getAgentProfileReferenceCleanupLayers()
  const cleanupResult = cleanupInvalidMcpServerReferencesInLayers(layers, validServerNames)

  if (cleanupResult.updatedProfileIds.length > 0) {
    agentProfileService.reload()
    diagnosticsService.logInfo(
      "mobile-api-desktop-actions",
      `Cleaned ${cleanupResult.removedReferenceCount} stale MCP server reference(s) from ${cleanupResult.updatedProfileIds.length} agent profile(s)`,
    )
  }
}

const mcpServerConfigActionOptions = {
  service: createMcpConfigActionService({
    get: () => configStore.get(),
    save: (config) => configStore.save(config),
  }),
  diagnostics: diagnosticsService,
  reservedServerNames: RESERVED_RUNTIME_TOOL_SERVER_NAMES,
  onMcpServerDeleted: ({ availableServerNames }) => {
    cleanupInvalidAgentProfileMcpReferences(availableServerNames)
  },
} satisfies McpServerConfigActionOptions

const mcpRouteActions = createMcpRouteActions({
  server: mcpServerActionOptions,
  config: mcpServerConfigActionOptions,
})

function cleanupDeletedSkillReferences(validSkillIds: string[]): void {
  const layers = getAgentProfileReferenceCleanupLayers()

  cleanupInvalidSkillReferencesInLayers(layers, validSkillIds)
  agentProfileService.reload()
}

const skillActionOptions: SkillActionOptions = {
  service: createSkillActionService({
    skills: skillsService,
    profile: agentProfileService,
  }),
  diagnostics: diagnosticsService,
  onSkillDeleted: ({ availableSkillIds }) => {
    cleanupDeletedSkillReferences(availableSkillIds)
  },
}

const skillRouteActions = createSkillRouteActions(skillActionOptions)

export const mobileApiDesktopActions = createMobileApiRouteActions({
  chatCompletion: chatRouteActionBundle.chatCompletion,
  models: chatRouteActionBundle.models,
  profiles: profileRouteActionBundle.profiles,
  bundle: bundleRouteActions,
  mcp: mcpRouteActions,
  settings: settingsRouteActionBundle.settings,
  agentSessionCandidates: agentSessionCandidateRouteActions,
  audit: { recordOperatorAuditEvent },
  conversations: conversationRouteActions,
  conversationVideoAssets: conversationVideoAssetRouteActions,
  tts: ttsRouteActions,
  push: pushRouteActions,
  emergencyStop: settingsRouteActionBundle.emergencyStop,
  skills: skillRouteActions,
  knowledgeNotes: knowledgeNoteRouteActions,
  agentProfiles: profileRouteActionBundle.agentProfiles,
  repeatTasks: repeatTaskRouteActions,
})
