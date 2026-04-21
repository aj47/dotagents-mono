/**
 * @dotagents/core
 *
 * Core agent engine for DotAgents — platform-agnostic services
 * extracted from the Electron desktop app.
 *
 * Provides abstraction interfaces for platform-specific functionality
 * and a service container for dependency injection.
 */

// Abstraction interfaces
export type {
  PathResolver,
} from './interfaces/path-resolver';
export type {
  ProgressEmitter,
} from './interfaces/progress-emitter';
export type {
  UserInteraction,
  FilePickerOptions,
  FileSaveOptions,
  ApprovalRequest,
} from './interfaces/user-interaction';
export type {
  NotificationService,
  NotificationOptions,
} from './interfaces/notification-service';

// Service container
export {
  ServiceContainer,
  ServiceTokens,
  container,
} from './service-container';

// Core domain types
export type {
  Config,
  KnowledgeNote,
  KnowledgeNoteContext,
  KnowledgeNoteEntryType,
  AgentSkill,
  LoopConfig,
  LoopSchedule,
  AgentProfile,
  AgentProfileConnection,
  AgentProfileConnectionType,
  AgentProfileRole,
  AgentProfileToolConfig,
  ProfileMcpServerConfig,
  ProfileModelConfig,
  ProfileSkillsConfig,
  SessionProfileSnapshot,
} from './types';

// Config module
export {
  ConfigStore,
  configStore,
  getConfigStore,
  getDataFolder,
  getRecordingsFolder,
  getConversationsFolder,
  getConfigPath,
  globalAgentsFolder,
  resolveWorkspaceAgentsFolder,
  trySaveConfig,
  persistConfigToDisk,
} from './config';

// State module
export {
  state,
  isHeadlessMode,
  setHeadlessMode,
  agentProcessManager,
  suppressPanelAutoShow,
  isPanelAutoShowSuppressed,
  llmRequestAbortManager,
  agentSessionStateManager,
  toolApprovalManager,
} from './state';
export type { AgentSessionState } from './state';

// Debug module
export {
  initDebugFlags,
  isDebugLLM,
  isDebugTools,
  isDebugKeybinds,
  isDebugApp,
  isDebugUI,
  isDebugMCP,
  isDebugACP,
  logLLM,
  logTools,
  logKeybinds,
  logApp,
  logUI,
  logMCP,
  logACP,
  getDebugFlags,
} from './debug';
export type { DebugFlags } from './debug';

// Error utilities
export {
  getErrorMessage,
  normalizeError,
} from './error-utils';

// Conversation ID utilities
export {
  sanitizeConversationId,
  getConversationIdValidationError,
  assertSafeConversationId,
  validateAndSanitizeConversationId,
} from './conversation-id';

// Agents files — frontmatter
export {
  parseFrontmatterDocument,
  parseFrontmatterOrBody,
  stringifyFrontmatterDocument,
} from './agents-files/frontmatter';
export type { FrontmatterDocument } from './agents-files/frontmatter';

// Agents files — safe-file
export {
  readTextFileIfExistsSync,
  safeWriteFileSync,
  safeWriteJsonFileSync,
  safeReadJsonFileSync,
} from './agents-files/safe-file';
export type { SafeWriteOptions } from './agents-files/safe-file';

// Agents files — modular-config
export {
  AGENTS_DIR_NAME,
  AGENTS_BACKUPS_DIR_NAME,
  AGENTS_SETTINGS_JSON,
  AGENTS_MCP_JSON,
  AGENTS_MODELS_JSON,
  AGENTS_SYSTEM_PROMPT_MD,
  AGENTS_AGENTS_MD,
  AGENTS_LAYOUTS_DIR,
  AGENTS_DEFAULT_LAYOUT_JSON,
  AGENTS_AGENT_PROFILES_DIR,
  AGENTS_TASKS_DIR,
  getAgentsLayerPaths,
  layerHasAnyAgentsConfig,
  loadAgentsLayerConfig,
  loadAgentsPrompts,
  loadMergedAgentsConfig,
  splitConfigIntoAgentsFiles,
  writeAgentsPrompts,
  writeAgentsLayerFromConfig,
  findAgentsDirUpward,
} from './agents-files/modular-config';
export type { AgentsLayerPaths, SplitAgentsConfig } from './agents-files/modular-config';

// Agents files — local secrets
export {
  AGENTS_SECRETS_LOCAL_JSON,
  SECRET_REF_PREFIX,
  getAgentsSecretsLocalPath,
  isSecretRef,
  makeSecretRef,
  extractSecretsForPersistence,
  prepareConfigForPersistence,
  migrateJsonFileSecretsToLocalStore,
  resolveSecretRefs,
} from './agents-files/secrets';

// Agents files — knowledge notes
export {
  AGENTS_KNOWLEDGE_DIR,
  getAgentsKnowledgeDir,
  getAgentsKnowledgeBackupDir,
  knowledgeNoteSlugToDirPath,
  knowledgeNoteSlugToFilePath,
  buildKnowledgeNoteStorageLocation,
  stringifyKnowledgeNoteMarkdown,
  parseKnowledgeNoteMarkdown,
  loadAgentsKnowledgeNotesLayer,
  writeKnowledgeNoteFile,
} from './agents-files/knowledge-notes';
export type { AgentsKnowledgeNoteOrigin, LoadedAgentsKnowledgeNotesLayer } from './agents-files/knowledge-notes';

// Agents files — skills
export {
  AGENTS_SKILLS_DIR,
  AGENTS_SKILL_CANONICAL_FILENAME,
  getAgentsSkillsDir,
  getAgentsSkillsBackupDir,
  skillIdToDirPath,
  skillIdToFilePath,
  stringifySkillMarkdown,
  parseSkillMarkdown,
  loadAgentsSkillsLayer,
  writeAgentsSkillFile,
} from './agents-files/skills';
export type { AgentsSkillOrigin, LoadedAgentsSkillsLayer } from './agents-files/skills';

// Agents files — tasks
export {
  TASK_CANONICAL_FILENAME,
  getTasksDir,
  getTasksBackupDir,
  taskIdToDirPath,
  taskIdToFilePath,
  stringifyTaskMarkdown,
  parseTaskMarkdown,
  loadTasksLayer,
  writeTaskFile,
  writeAllTaskFiles,
  deleteTaskFiles,
} from './agents-files/tasks';
export type { TaskOrigin, LoadedTasksLayer } from './agents-files/tasks';

// Agents files — agent-profiles
export {
  AGENTS_PROFILE_CANONICAL_FILENAME,
  AGENTS_PROFILE_CONFIG_FILENAME,
  AGENTS_PROFILE_AVATAR_FILENAME,
  getAgentProfilesDir,
  getAgentProfilesBackupDir,
  agentProfileIdToDirPath,
  agentProfileIdToFilePath,
  agentProfileIdToConfigJsonPath,
  stringifyAgentProfileMarkdown,
  parseAgentProfileMarkdown,
  loadAgentProfilesLayer,
  writeAgentsProfileFiles,
  writeAllAgentsProfileFiles,
  deleteAgentProfileFiles,
  loadMergedAgentProfiles,
} from './agents-files/agent-profiles';
export type { AgentProfileOrigin, LoadedAgentProfilesLayer, AgentProfileConfigJson } from './agents-files/agent-profiles';

// Testing utilities
export {
  MockPathResolver,
  createMockPathResolver,
} from './testing/mock-path-resolver';
export { MockProgressEmitter } from './testing/mock-progress-emitter';
export { MockUserInteraction } from './testing/mock-user-interaction';
export { MockNotificationService } from './testing/mock-notification-service';
