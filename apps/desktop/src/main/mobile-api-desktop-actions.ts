import type { MobileApiRouteActions } from "./mobile-api-routes"
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
  toggleAgentProfile,
  updateAgentProfile,
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
  deleteKnowledgeNote,
  getKnowledgeNote,
  getKnowledgeNotes,
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
import {
  getModels,
  getProviderModels,
} from "./model-actions"
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
  getRepeatTasks,
  importRepeatTaskFromMarkdown,
  runRepeatTask,
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
  importSkillFromMarkdown,
  toggleProfileSkill,
  updateSkill,
} from "./skill-actions"
import { synthesizeSpeech } from "./tts-actions"

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
  exportSkillToMarkdown,
  updateSkill,
  deleteSkill,
  toggleProfileSkill,
  getKnowledgeNotes,
  getKnowledgeNote,
  deleteKnowledgeNote,
  getAgentProfiles,
  toggleAgentProfile,
  getAgentProfile,
  createAgentProfile,
  updateAgentProfile,
  deleteAgentProfile,
  getRepeatTasks,
  toggleRepeatTask,
  runRepeatTask,
  importRepeatTaskFromMarkdown,
  exportRepeatTaskToMarkdown,
  createKnowledgeNote,
  updateKnowledgeNote,
  createRepeatTask,
  updateRepeatTask,
  deleteRepeatTask,
}
