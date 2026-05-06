import type { MobileApiRouteActions } from "./mobile-api-routes"
import {
  getAgentSessionCandidatesAction,
  type AgentSessionCandidateActionOptions,
} from "@dotagents/shared/agent-session-candidates"
import {
  getModelsAction,
  getProviderModelsAction,
  type ModelActionOptions,
} from "@dotagents/shared/chat-utils"
import {
  synthesizeSpeechAction,
  type TtsActionOptions,
} from "@dotagents/shared/tts-api"
import type { Config } from "../shared/types"
import {
  exportBundle,
  getBundleExportableItems,
  importBundle,
  previewBundleImport,
} from "./bundle-actions"
import { handleChatCompletionRequest } from "./chat-completion-actions"
import {
  createAgentProfile,
  deleteAgentProfile,
  getAgentProfile,
  getAgentProfiles,
  reloadAgentProfiles,
  toggleAgentProfile,
  updateAgentProfile,
  verifyExternalAgentCommand,
} from "./agent-profile-actions"
import {
  createConversation,
  getConversation,
  getConversations,
  getConversationVideoAsset,
  updateConversation,
} from "./conversation-actions"
import { triggerEmergencyStop } from "./emergency-stop-actions"
import {
  createKnowledgeNote,
  deleteAllKnowledgeNotes,
  deleteKnowledgeNote,
  deleteMultipleKnowledgeNotes,
  getKnowledgeNote,
  getKnowledgeNotes,
  searchKnowledgeNotes,
  updateKnowledgeNote,
} from "./knowledge-note-actions"
import {
  deleteMcpServerConfig,
  exportMcpServerConfigs,
  getMcpServers,
  importMcpServerConfigs,
  toggleMcpServer,
  upsertMcpServerConfig,
} from "./mcp-server-actions"
import { recordOperatorAuditEvent } from "./operator-audit-actions"
import {
  exportProfile,
  getCurrentProfile,
  getProfiles,
  importProfile,
  setCurrentProfile,
} from "./profile-actions"
import {
  clearPushBadge,
  getPushStatus,
  registerPushToken,
  unregisterPushToken,
} from "./push-actions"
import {
  createRepeatTask,
  deleteRepeatTask,
  exportRepeatTaskToMarkdown,
  getRepeatTaskStatuses,
  getRepeatTasks,
  importRepeatTaskFromMarkdown,
  runRepeatTask,
  startRepeatTask,
  stopRepeatTask,
  toggleRepeatTask,
  updateRepeatTask,
} from "./repeat-task-actions"
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
import { agentSessionTracker } from "./agent-session-tracker"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { generateTTS } from "./tts-service"

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
