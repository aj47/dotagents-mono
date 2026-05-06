import type { MobileApiRouteActions } from "./mobile-api-routes"
import { getAgentsLayerPaths, type LoopConfig } from "@dotagents/core"
import {
  getAgentSessionCandidatesAction,
  type AgentSessionCandidateActionOptions,
} from "@dotagents/shared/agent-session-candidates"
import {
  createKnowledgeNoteAction,
  deleteAllKnowledgeNotesAction,
  deleteKnowledgeNoteAction,
  deleteMultipleKnowledgeNotesAction,
  getKnowledgeNoteAction,
  getKnowledgeNotesAction,
  searchKnowledgeNotesAction,
  updateKnowledgeNoteAction,
  type KnowledgeNoteActionOptions,
} from "@dotagents/shared/knowledge-note-form"
import {
  getModelsAction,
  getProviderModelsAction,
  type ModelActionOptions,
} from "@dotagents/shared/chat-utils"
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
import {
  synthesizeSpeechAction,
  type TtsActionOptions,
} from "@dotagents/shared/tts-api"
import {
  triggerEmergencyStopAction,
  type EmergencyStopActionOptions,
} from "@dotagents/shared/settings-api-client"
import {
  clearPushBadgeAction,
  getPushStatusAction,
  registerPushTokenAction,
  unregisterPushTokenAction,
  type PushTokenRecord,
} from "@dotagents/shared/push-notifications"
import {
  createAgentProfileAction,
  deleteAgentProfileAction,
  exportProfileAction,
  getAgentProfileAction,
  getAgentProfilesAction,
  getCurrentProfileAction,
  getProfilesAction,
  importProfileAction,
  reloadAgentProfilesAction,
  setCurrentProfileAction,
  toggleAgentProfileAction,
  updateAgentProfileAction,
  verifyExternalAgentCommandAction,
  type AgentProfileActionOptions,
  type AgentProfileReloadActionOptions,
  type ExternalAgentCommandVerificationActionOptions,
  type ProfileActionOptions,
} from "@dotagents/shared/profile-api"
import {
  createRepeatTaskAction,
  deleteRepeatTaskAction,
  exportRepeatTaskToMarkdownAction,
  getRepeatTaskStatusesAction,
  getRepeatTasksAction,
  importRepeatTaskFromMarkdownAction,
  runRepeatTaskAction,
  startRepeatTaskAction,
  stopRepeatTaskAction,
  toggleRepeatTaskAction,
  updateRepeatTaskAction,
  type RepeatTaskActionOptions,
  type RepeatTaskLoopService,
} from "@dotagents/shared/repeat-task-utils"
import type { Config } from "../shared/types"
import {
  exportBundle,
  getBundleExportableItems,
  importBundle,
  previewBundleImport,
} from "./bundle-actions"
import { handleChatCompletionRequest } from "./chat-completion-actions"
import {
  createConversation,
  getConversation,
  getConversations,
  getConversationVideoAsset,
  updateConversation,
} from "./conversation-actions"
import { recordOperatorAuditEvent } from "./operator-audit-actions"
import {
  getSettings,
  updateSettings,
} from "./settings-actions"
import {
  createSkill,
  deleteSkill,
  exportSkillToMarkdown,
  getSkill,
  getSkills,
  importSkillFromGitHub,
  importSkillFromMarkdown,
  toggleProfileSkill,
  updateSkill,
} from "./skill-actions"
import { cleanupInvalidMcpServerReferencesInLayers } from "./agent-profile-mcp-cleanup"
import { agentProfileService, toolConfigToMcpServerConfig } from "./agent-profile-service"
import { agentSessionTracker } from "./agent-session-tracker"
import { verifyExternalAgentCommand as verifyExternalAgentCommandService } from "./command-verification-service"
import { configStore, globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { diagnosticsService } from "./diagnostics"
import { emergencyStopAll } from "./emergency-stop"
import { knowledgeNotesService } from "./knowledge-notes-service"
import { mcpService } from "./mcp-service"
import { clearBadgeCount } from "./push-notification-service"
import { generateTTS } from "./tts-service"

type DesktopProfileActionProfile = ReturnType<typeof agentProfileService.setCurrentProfileStrict>
type DesktopAgentProfileActionProfile = NonNullable<ReturnType<typeof agentProfileService.getById>>

const modelActionOptions: ModelActionOptions = {
  getConfig: () => configStore.get(),
  fetchAvailableModels: async (providerId) => {
    const { fetchAvailableModels } = await import("./models-service")
    return fetchAvailableModels(providerId)
  },
  diagnostics: diagnosticsService,
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

function getProfiles() {
  return getProfilesAction(profileActionOptions)
}

function getCurrentProfile() {
  return getCurrentProfileAction(profileActionOptions)
}

function setCurrentProfile(body: unknown) {
  return setCurrentProfileAction(body, profileActionOptions)
}

function exportProfile(id: string | undefined) {
  return exportProfileAction(id, profileActionOptions)
}

function importProfile(body: unknown) {
  return importProfileAction(body, profileActionOptions)
}

function getAgentProfiles(role: string | undefined) {
  return getAgentProfilesAction(role, agentProfileActionOptions)
}

function reloadAgentProfiles() {
  return reloadAgentProfilesAction(agentProfileReloadActionOptions)
}

function toggleAgentProfile(id: string | undefined) {
  return toggleAgentProfileAction(id, agentProfileActionOptions)
}

function getAgentProfile(id: string | undefined) {
  return getAgentProfileAction(id, agentProfileActionOptions)
}

function createAgentProfile(body: unknown) {
  return createAgentProfileAction(body, agentProfileActionOptions)
}

function updateAgentProfile(id: string | undefined, body: unknown) {
  return updateAgentProfileAction(id, body, agentProfileActionOptions)
}

function deleteAgentProfile(id: string | undefined) {
  return deleteAgentProfileAction(id, agentProfileActionOptions)
}

function verifyExternalAgentCommand(body: unknown) {
  return verifyExternalAgentCommandAction(body, externalAgentCommandVerificationActionOptions)
}

async function getKnowledgeNotes(query?: unknown) {
  return getKnowledgeNotesAction(query, knowledgeNoteActionOptions)
}

async function getKnowledgeNote(id: string | undefined) {
  return getKnowledgeNoteAction(id, knowledgeNoteActionOptions)
}

async function searchKnowledgeNotes(body: unknown) {
  return searchKnowledgeNotesAction(body, knowledgeNoteActionOptions)
}

async function deleteKnowledgeNote(id: string | undefined) {
  return deleteKnowledgeNoteAction(id, knowledgeNoteActionOptions)
}

async function deleteMultipleKnowledgeNotes(body: unknown) {
  return deleteMultipleKnowledgeNotesAction(body, knowledgeNoteActionOptions)
}

async function deleteAllKnowledgeNotes() {
  return deleteAllKnowledgeNotesAction(knowledgeNoteActionOptions)
}

async function createKnowledgeNote(body: unknown) {
  return createKnowledgeNoteAction(body, knowledgeNoteActionOptions)
}

async function updateKnowledgeNote(id: string | undefined, body: unknown) {
  return updateKnowledgeNoteAction(id, body, knowledgeNoteActionOptions)
}

async function getRepeatTasks() {
  return getRepeatTasksAction(repeatTaskActionOptions)
}

async function getRepeatTaskStatuses() {
  return getRepeatTaskStatusesAction(repeatTaskActionOptions)
}

async function toggleRepeatTask(id: string | undefined) {
  return toggleRepeatTaskAction(id, repeatTaskActionOptions)
}

async function runRepeatTask(id: string | undefined) {
  return runRepeatTaskAction(id, repeatTaskActionOptions)
}

async function startRepeatTask(id: string | undefined) {
  return startRepeatTaskAction(id, repeatTaskActionOptions)
}

async function stopRepeatTask(id: string | undefined) {
  return stopRepeatTaskAction(id, repeatTaskActionOptions)
}

async function createRepeatTask(body: unknown) {
  return createRepeatTaskAction(body, repeatTaskActionOptions)
}

async function importRepeatTaskFromMarkdown(body: unknown) {
  return importRepeatTaskFromMarkdownAction(body, repeatTaskActionOptions)
}

async function exportRepeatTaskToMarkdown(id: string | undefined) {
  return exportRepeatTaskToMarkdownAction(id, repeatTaskActionOptions)
}

async function updateRepeatTask(id: string | undefined, body: unknown) {
  return updateRepeatTaskAction(id, body, repeatTaskActionOptions)
}

async function deleteRepeatTask(id: string | undefined) {
  return deleteRepeatTaskAction(id, repeatTaskActionOptions)
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

export const mobileApiDesktopActions: MobileApiRouteActions = {
  handleChatCompletionRequest,
  getModels,
  getProviderModels,
  getProfiles,
  getCurrentProfile,
  setCurrentProfile,
  exportProfile,
  importProfile,
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
  getKnowledgeNotes,
  getKnowledgeNote,
  searchKnowledgeNotes,
  deleteKnowledgeNote,
  deleteMultipleKnowledgeNotes,
  deleteAllKnowledgeNotes,
  getAgentProfiles,
  verifyExternalAgentCommand,
  reloadAgentProfiles,
  toggleAgentProfile,
  getAgentProfile,
  createAgentProfile,
  updateAgentProfile,
  deleteAgentProfile,
  getRepeatTasks,
  getRepeatTaskStatuses,
  toggleRepeatTask,
  runRepeatTask,
  startRepeatTask,
  stopRepeatTask,
  importRepeatTaskFromMarkdown,
  exportRepeatTaskToMarkdown,
  createKnowledgeNote,
  updateKnowledgeNote,
  createRepeatTask,
  updateRepeatTask,
  deleteRepeatTask,
}
