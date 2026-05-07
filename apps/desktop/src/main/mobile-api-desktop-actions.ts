import { randomUUID } from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { FastifyReply } from "fastify"
import type { MobileApiRouteActions } from "@dotagents/shared/remote-server-route-contracts"
import { getAgentsLayerPaths, type LoopConfig } from "@dotagents/core"
import type { AgentRunExecutor } from "@dotagents/shared/agent-run-utils"
import {
  getAgentSessionCandidatesAction,
  type AgentSessionCandidateActionOptions,
} from "@dotagents/shared/agent-session-candidates"
import { getEnabledAcpxAgentProfiles } from "@dotagents/shared/agent-profile-queries"
import {
  exportBundleAction,
  getBundleExportableItemsAction,
  importBundleAction,
  previewBundleImportAction,
  type BundleActionOptions,
  type BundleImportPreview,
  type ExportBundleRequest,
  type ImportBundleRequest,
  type PreviewBundleImportRequest,
} from "@dotagents/shared/bundle-api"
import {
  createKnowledgeNoteRouteActions,
  type KnowledgeNoteActionOptions,
} from "@dotagents/shared/knowledge-note-form"
import {
  getModelsAction,
  getProviderModelsAction,
  handleChatCompletionRequestAction,
  type ChatCompletionActionOptions,
  type ModelActionOptions,
} from "@dotagents/shared/chat-utils"
import {
  createConversationAction,
  getConversationAction,
  getConversationsAction,
  updateConversationAction,
  type ConversationActionOptions,
} from "@dotagents/shared/conversation-sync"
import { getConversationIdValidationError } from "@dotagents/shared/conversation-id"
import {
  getConversationVideoAssetAction,
  type ConversationVideoAssetActionOptions,
} from "@dotagents/shared/conversation-media-assets"
import {
  getDiscordLifecycleAction,
  getDiscordResolvedDefaultProfileId,
  getMaskedDiscordBotToken,
} from "@dotagents/shared/discord-config"
import {
  RESERVED_RUNTIME_TOOL_SERVER_NAMES,
  deleteMcpServerConfigAction,
  exportMcpServerConfigsAction,
  getMcpServersAction,
  importMcpServerConfigsAction,
  toggleMcpServerAction,
  upsertMcpServerConfigAction,
} from "@dotagents/shared/mcp-api"
import type { MCPConfig } from "@dotagents/shared/mcp-utils"
import { getMaskedRemoteServerApiKey } from "@dotagents/shared/remote-pairing"
import {
  synthesizeSpeechAction,
  type TtsActionOptions,
} from "@dotagents/shared/tts-api"
import {
  getSettingsAction,
  triggerEmergencyStopAction,
  updateSettingsAction,
  type EmergencyStopActionOptions,
  type SettingsActionOptions,
} from "@dotagents/shared/settings-api-client"
import {
  createSkillAction,
  deleteSkillAction,
  exportSkillToMarkdownAction,
  getSkillAction,
  getSkillsAction,
  importSkillFromGitHubAction,
  importSkillFromMarkdownAction,
  toggleProfileSkillAction,
  updateSkillAction,
  type SkillActionOptions,
} from "@dotagents/shared/skills-api"
import {
  clearPushBadgeAction,
  getPushStatusAction,
  registerPushTokenAction,
  unregisterPushTokenAction,
  type PushTokenRecord,
} from "@dotagents/shared/push-notifications"
import {
  createAgentProfileRouteActions,
  createProfileRouteActions,
  type AgentProfileActionOptions,
  type AgentProfileReloadActionOptions,
  type ExternalAgentCommandVerificationActionOptions,
  type ProfileActionOptions,
} from "@dotagents/shared/profile-api"
import {
  createRepeatTaskRouteActions,
  type RepeatTaskActionOptions,
  type RepeatTaskLoopService,
} from "@dotagents/shared/repeat-task-utils"
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

type DesktopProfileActionProfile = ReturnType<typeof agentProfileService.setCurrentProfileStrict>
type DesktopAgentProfileActionProfile = NonNullable<ReturnType<typeof agentProfileService.getById>>
type DesktopConversationActionConversation = NonNullable<Awaited<ReturnType<typeof conversationService.loadConversation>>>
type SettingsUpdateMasks = {
  providerSecretMask: string
  remoteServerSecretMask: string
  discordSecretMask: string
  langfuseSecretMask: string
}

const modelActionOptions: ModelActionOptions = {
  getConfig: () => configStore.get(),
  fetchAvailableModels: async (providerId) => {
    const { fetchAvailableModels } = await import("./models-service")
    return fetchAvailableModels(providerId)
  },
  diagnostics: diagnosticsService,
}

function recordHistory(transcript: string) {
  try {
    fs.mkdirSync(recordingsFolder, { recursive: true })
    const historyPath = path.join(recordingsFolder, "history.json")
    let history: Array<{ id: string; createdAt: number; duration: number; transcript: string }>
    try {
      history = JSON.parse(fs.readFileSync(historyPath, "utf8"))
    } catch {
      history = []
    }

    const item = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      duration: 0,
      transcript,
    }
    history.push(item)
    fs.writeFileSync(historyPath, JSON.stringify(history))
  } catch (caughtError) {
    diagnosticsService.logWarning(
      "remote-server",
      "Failed to record history item",
      caughtError,
    )
  }
}

const chatCompletionActionOptions: ChatCompletionActionOptions = {
  diagnostics: diagnosticsService,
  getActiveModelConfig: () => configStore.get(),
  validateConversationId: getConversationIdValidationError,
  recordHistory,
  isPushEnabled,
  sendPushNotification: sendMessageNotification,
  logger: console,
}

async function handleChatCompletionRequest(
  body: unknown,
  origin: string | string[] | undefined,
  reply: FastifyReply,
  runAgent: AgentRunExecutor,
) {
  return handleChatCompletionRequestAction(
    body,
    origin,
    reply,
    runAgent,
    chatCompletionActionOptions,
  )
}

const agentSessionCandidateActionOptions: AgentSessionCandidateActionOptions = {
  service: {
    getActiveSessions: () => agentSessionTracker.getActiveSessions(),
    getRecentSessions: (limit) => agentSessionTracker.getRecentSessions(limit),
  },
  diagnostics: diagnosticsService,
}

const ttsActionOptions: TtsActionOptions<Config> = {
  getConfig: () => configStore.get(),
  generateSpeech: generateTTS,
  encodeAudioBody: (audio) => Buffer.from(audio),
  diagnostics: diagnosticsService,
}

const emergencyStopActionOptions: EmergencyStopActionOptions = {
  stopAll: emergencyStopAll,
  diagnostics: diagnosticsService,
  logger: console,
}

async function applyDiscordLifecycleAction(discordLifecycleAction: ReturnType<typeof getDiscordLifecycleAction>): Promise<void> {
  if (discordLifecycleAction === "start") {
    await discordService.start()
  } else if (discordLifecycleAction === "restart") {
    await discordService.restart()
  } else if (discordLifecycleAction === "stop") {
    await discordService.stop()
  }
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
  applyDiscordLifecycleAction,
  applyWhatsappToggle: handleWhatsAppToggle,
  applyDesktopShellSettings,
}

const pushActionOptions = {
  tokenStore: {
    getPushNotificationTokens: () => configStore.get().pushNotificationTokens ?? [],
    savePushNotificationTokens: (tokens: PushTokenRecord[]) => {
      const cfg = configStore.get()
      configStore.save({ ...cfg, pushNotificationTokens: tokens })
    },
  },
  diagnostics: diagnosticsService,
  badgeService: {
    clearBadgeCount,
  },
}

function getBundleLayerDirs(): string[] {
  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  return workspaceAgentsFolder
    ? [globalAgentsFolder, workspaceAgentsFolder]
    : [globalAgentsFolder]
}

function getBundleImportTargetDir(): string {
  return resolveWorkspaceAgentsFolder() ?? globalAgentsFolder
}

async function withTemporaryBundleFile<T>(
  bundleJson: string,
  run: (filePath: string) => T | Promise<T>,
): Promise<T> {
  const tempDir = path.join(os.tmpdir(), "dotagents-bundle-import")
  fs.mkdirSync(tempDir, { recursive: true })
  const filePath = path.join(tempDir, `${Date.now()}-${randomUUID()}.dotagents`)
  fs.writeFileSync(filePath, bundleJson, "utf8")

  try {
    return await run(filePath)
  } finally {
    try {
      fs.unlinkSync(filePath)
    } catch {
      // Temporary import previews should not fail if cleanup races with the OS.
    }
  }
}

const bundleActionOptions: BundleActionOptions = {
  service: {
    getExportableItems: () => getBundleExportableItemsFromLayers(getBundleLayerDirs()),
    exportBundle: (request: ExportBundleRequest) => exportBundleFromLayers(getBundleLayerDirs(), request),
    previewBundleImport: async (request: PreviewBundleImportRequest) =>
      withTemporaryBundleFile(request.bundleJson, async (filePath) => {
        const preview = previewBundleWithConflicts(filePath, getBundleImportTargetDir())
        if (!preview.success || !preview.bundle || !preview.conflicts) return null
        return {
          bundle: preview.bundle,
          conflicts: preview.conflicts,
        } satisfies BundleImportPreview
      }),
    importBundle: (request: ImportBundleRequest) =>
      withTemporaryBundleFile(request.bundleJson, (filePath) =>
        importBundleFromFile(filePath, getBundleImportTargetDir(), {
          conflictStrategy: request.conflictStrategy ?? "skip",
          components: request.components,
        }),
      ),
  },
  diagnostics: diagnosticsService,
}

const conversationActionOptions: ConversationActionOptions<DesktopConversationActionConversation> = {
  service: {
    loadConversation: (conversationId) => conversationService.loadConversation(conversationId),
    getConversationHistory: () => conversationService.getConversationHistory(),
    generateConversationId: () => conversationService.generateConversationIdPublic(),
    saveConversation: (conversation, preserveTimestamp) =>
      conversationService.saveConversation(conversation, preserveTimestamp),
  },
  diagnostics: diagnosticsService,
  validateConversationId: getConversationIdValidationError,
  now: () => Date.now(),
}

const conversationVideoAssetActionOptions: ConversationVideoAssetActionOptions = {
  service: {
    getVideoAssetFile: async (conversationId, fileName) => {
      const assetPath = getConversationVideoAssetPath(conversationId, fileName)
      const stat = await fs.promises.stat(assetPath)
      if (!stat.isFile()) return null
      return {
        size: stat.size,
        createBody: (range) => range
          ? fs.createReadStream(assetPath, { start: range.start, end: range.end })
          : fs.createReadStream(assetPath),
      }
    },
  },
  validateConversationId: getConversationIdValidationError,
  diagnostics: diagnosticsService,
}

const profileActionOptions: ProfileActionOptions<DesktopProfileActionProfile> = {
  service: {
    getUserProfiles: () => agentProfileService.getUserProfiles(),
    getCurrentProfile: () => agentProfileService.getCurrentProfile(),
    setCurrentProfileStrict: (profileId) => agentProfileService.setCurrentProfileStrict(profileId),
    exportProfile: (profileId) => agentProfileService.exportProfile(profileId),
    importProfile: (profileJson) => agentProfileService.importProfile(profileJson),
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
}

const agentProfileActionOptions: AgentProfileActionOptions<DesktopAgentProfileActionProfile> = {
  service: {
    getAll: () => agentProfileService.getAll(),
    getById: (profileId) => agentProfileService.getById(profileId),
    create: (profile) => agentProfileService.create(profile),
    update: (profileId, updates) => agentProfileService.update(profileId, updates),
    deleteProfile: (profileId) => agentProfileService.delete(profileId),
  },
  diagnostics: diagnosticsService,
}

const agentProfileReloadActionOptions: AgentProfileReloadActionOptions<DesktopAgentProfileActionProfile> = {
  service: {
    ...agentProfileActionOptions.service,
    reload: () => agentProfileService.reload(),
  },
  diagnostics: diagnosticsService,
}

const externalAgentCommandVerificationActionOptions: ExternalAgentCommandVerificationActionOptions = {
  service: {
    verifyExternalAgentCommand: verifyExternalAgentCommandService,
  },
  diagnostics: diagnosticsService,
}

const profileRouteActions = createProfileRouteActions(profileActionOptions)

const agentProfileRouteActions = createAgentProfileRouteActions({
  agentProfile: agentProfileActionOptions,
  reload: agentProfileReloadActionOptions,
  externalCommandVerification: externalAgentCommandVerificationActionOptions,
})

const knowledgeNoteActionOptions: KnowledgeNoteActionOptions = {
  service: {
    getAllNotes: (filter) => knowledgeNotesService.getAllNotes(filter),
    getNote: (id) => knowledgeNotesService.getNote(id),
    searchNotes: (query, filter) => knowledgeNotesService.searchNotes(query, filter),
    deleteNote: (id) => knowledgeNotesService.deleteNote(id),
    deleteMultipleNotes: (ids) => knowledgeNotesService.deleteMultipleNotes(ids),
    deleteAllNotes: () => knowledgeNotesService.deleteAllNotes(),
    createNote: (request) => knowledgeNotesService.createNote(request),
    saveNote: (note) => knowledgeNotesService.saveNote(note),
    updateNote: (id, request) => knowledgeNotesService.updateNote(id, request),
  },
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
  createId: () => `loop_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
  getProfileName: getLoopProfileName,
  diagnostics: diagnosticsService,
}

const repeatTaskRouteActions = createRepeatTaskRouteActions(repeatTaskActionOptions)

const mcpServerActionOptions = {
  service: mcpService,
  diagnostics: diagnosticsService,
}

function cleanupInvalidAgentProfileMcpReferences(mcpConfig: MCPConfig): void {
  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  const layers = workspaceAgentsFolder
    ? [getAgentsLayerPaths(globalAgentsFolder), getAgentsLayerPaths(workspaceAgentsFolder)]
    : [getAgentsLayerPaths(globalAgentsFolder)]
  const validServerNames = Object.keys(mcpConfig.mcpServers || {})
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
  service: {
    getMcpConfig: () => configStore.get().mcpConfig || { mcpServers: {} },
    saveMcpConfig: (mcpConfig: MCPConfig) => {
      const config = configStore.get()
      configStore.save({ ...config, mcpConfig })
    },
    onMcpConfigSaved: ({ action, nextMcpConfig }) => {
      if (action === "deleted") {
        cleanupInvalidAgentProfileMcpReferences(nextMcpConfig)
      }
    },
  },
  diagnostics: diagnosticsService,
  reservedServerNames: RESERVED_RUNTIME_TOOL_SERVER_NAMES,
} satisfies Parameters<typeof upsertMcpServerConfigAction>[2]

function cleanupDeletedSkillReferences(): void {
  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  const layers = workspaceAgentsFolder
    ? [getAgentsLayerPaths(globalAgentsFolder), getAgentsLayerPaths(workspaceAgentsFolder)]
    : [getAgentsLayerPaths(globalAgentsFolder)]

  cleanupInvalidSkillReferencesInLayers(
    layers,
    skillsService.getSkills().map((skill) => skill.id),
  )
  agentProfileService.reload()
}

const skillActionOptions: SkillActionOptions = {
  service: {
    getSkills: () => skillsService.getSkills(),
    getSkill: (id) => skillsService.getSkill(id),
    createSkill: (name, description, instructions) => skillsService.createSkill(name, description, instructions),
    importSkillFromMarkdown: (content) => skillsService.importSkillFromMarkdown(content),
    importSkillFromGitHub: (repoIdentifier) => skillsService.importSkillFromGitHub(repoIdentifier),
    exportSkillToMarkdown: (id) => skillsService.exportSkillToMarkdown(id),
    updateSkill: (id, updates) => skillsService.updateSkill(id, updates),
    deleteSkill: (id) => {
      const success = skillsService.deleteSkill(id)
      if (success) {
        cleanupDeletedSkillReferences()
      }
      return success
    },
    getCurrentProfile: () => agentProfileService.getCurrentProfile(),
    enableSkillForCurrentProfile: (skillId) => agentProfileService.enableSkillForCurrentProfile(skillId),
    toggleProfileSkill: (profileId, skillId, allSkillIds) =>
      agentProfileService.toggleProfileSkill(profileId, skillId, allSkillIds),
  },
  diagnostics: diagnosticsService,
}

function getAgentSessionCandidates(query: unknown) {
  return getAgentSessionCandidatesAction(query, agentSessionCandidateActionOptions)
}

function getModels() {
  return getModelsAction(modelActionOptions)
}

async function getProviderModels(providerId: string | undefined) {
  return getProviderModelsAction(providerId, modelActionOptions)
}

async function synthesizeSpeech(body: unknown) {
  return synthesizeSpeechAction(body, ttsActionOptions)
}

async function triggerEmergencyStop() {
  return triggerEmergencyStopAction(emergencyStopActionOptions)
}

function getSettings(providerSecretMask: string) {
  return getSettingsAction(providerSecretMask, settingsActionOptions)
}

async function updateSettings(body: unknown, masks: SettingsUpdateMasks) {
  return updateSettingsAction(body, masks, settingsActionOptions)
}

function registerPushToken(body: unknown) {
  return registerPushTokenAction(body, pushActionOptions)
}

function unregisterPushToken(body: unknown) {
  return unregisterPushTokenAction(body, pushActionOptions)
}

function getPushStatus() {
  return getPushStatusAction(pushActionOptions)
}

function clearPushBadge(body: unknown) {
  return clearPushBadgeAction(body, pushActionOptions)
}

function getBundleExportableItems() {
  return getBundleExportableItemsAction(bundleActionOptions)
}

function exportBundle(body: unknown) {
  return exportBundleAction(body, bundleActionOptions)
}

function previewBundleImport(body: unknown) {
  return previewBundleImportAction(body, bundleActionOptions)
}

function importBundle(body: unknown) {
  return importBundleAction(body, bundleActionOptions)
}

async function getConversation(id: string | undefined) {
  return getConversationAction(id, conversationActionOptions)
}

async function getConversationVideoAsset(
  id: string | undefined,
  fileName: string | undefined,
  rangeHeader: string | undefined,
) {
  return getConversationVideoAssetAction(
    id,
    fileName,
    rangeHeader,
    conversationVideoAssetActionOptions,
  )
}

async function getConversations() {
  return getConversationsAction(conversationActionOptions)
}

async function createConversation(body: unknown, onChanged: () => void) {
  return createConversationAction(body, onChanged, conversationActionOptions)
}

async function updateConversation(id: string | undefined, body: unknown, onChanged: () => void) {
  return updateConversationAction(id, body, onChanged, conversationActionOptions)
}

function getMcpServers() {
  return getMcpServersAction(mcpServerActionOptions)
}

function toggleMcpServer(serverName: string | undefined, body: unknown) {
  return toggleMcpServerAction(serverName, body, mcpServerActionOptions)
}

function importMcpServerConfigs(body: unknown) {
  return importMcpServerConfigsAction(body, mcpServerConfigActionOptions)
}

function exportMcpServerConfigs() {
  return exportMcpServerConfigsAction(mcpServerConfigActionOptions)
}

function upsertMcpServerConfig(serverName: string | undefined, body: unknown) {
  return upsertMcpServerConfigAction(serverName, body, mcpServerConfigActionOptions)
}

function deleteMcpServerConfig(serverName: string | undefined) {
  return deleteMcpServerConfigAction(serverName, mcpServerConfigActionOptions)
}

function getSkills() {
  return getSkillsAction(skillActionOptions)
}

function getSkill(skillId: string | undefined) {
  return getSkillAction(skillId, skillActionOptions)
}

function createSkill(body: unknown) {
  return createSkillAction(body, skillActionOptions)
}

function importSkillFromMarkdown(body: unknown) {
  return importSkillFromMarkdownAction(body, skillActionOptions)
}

async function importSkillFromGitHub(body: unknown) {
  return importSkillFromGitHubAction(body, skillActionOptions)
}

function exportSkillToMarkdown(skillId: string | undefined) {
  return exportSkillToMarkdownAction(skillId, skillActionOptions)
}

function updateSkill(skillId: string | undefined, body: unknown) {
  return updateSkillAction(skillId, body, skillActionOptions)
}

function deleteSkill(skillId: string | undefined) {
  return deleteSkillAction(skillId, skillActionOptions)
}

function toggleProfileSkill(skillId: string | undefined) {
  return toggleProfileSkillAction(skillId, skillActionOptions)
}

export const mobileApiDesktopActions: MobileApiRouteActions = {
  handleChatCompletionRequest,
  getModels,
  getProviderModels,
  ...profileRouteActions,
  getBundleExportableItems,
  exportBundle,
  previewBundleImport,
  importBundle,
  getMcpServers,
  toggleMcpServer,
  exportMcpServerConfigs,
  importMcpServerConfigs,
  upsertMcpServerConfig,
  deleteMcpServerConfig,
  getSettings,
  updateSettings,
  getAgentSessionCandidates,
  recordOperatorAuditEvent,
  getConversation,
  getConversationVideoAsset,
  synthesizeSpeech,
  registerPushToken,
  unregisterPushToken,
  getPushStatus,
  clearPushBadge,
  getConversations,
  createConversation,
  updateConversation,
  triggerEmergencyStop,
  getSkills,
  getSkill,
  createSkill,
  importSkillFromMarkdown,
  importSkillFromGitHub,
  exportSkillToMarkdown,
  updateSkill,
  deleteSkill,
  toggleProfileSkill,
  ...knowledgeNoteRouteActions,
  ...agentProfileRouteActions,
  ...repeatTaskRouteActions,
}
