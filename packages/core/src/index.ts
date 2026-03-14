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
  AgentMemory,
  AgentSkill,
  LoopConfig,
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

// Agents files — memories
export {
  AGENTS_MEMORIES_DIR,
  getAgentsMemoriesDir,
  getAgentsMemoriesBackupDir,
  memoryIdToFilePath,
  stringifyMemoryMarkdown,
  parseMemoryMarkdown,
  loadAgentsMemoriesLayer,
  writeAgentsMemoryFile,
} from './agents-files/memories';
export type { AgentsMemoryOrigin, LoadedAgentsMemoriesLayer } from './agents-files/memories';

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

// Conversation types
export type {
  Conversation,
  ConversationMessage,
  ConversationHistoryItem,
  ConversationCompactionMetadata,
} from './types';

// Conversation service
export {
  ConversationService,
} from './conversation-service';
export type { SummarizeContentFn } from './conversation-service';

// Langfuse loader
export {
  Langfuse,
  isInstalled as isLangfuseModuleInstalled,
} from './langfuse-loader';
export type {
  LangfuseInstance,
  LangfuseTraceClient,
  LangfuseSpanClient,
  LangfuseGenerationClient,
} from './langfuse-loader';

// Langfuse service
export {
  isLangfuseInstalled,
  isLangfuseEnabled,
  getLangfuse,
  reinitializeLangfuse,
  createAgentTrace,
  getAgentTrace,
  endAgentTrace,
  createToolSpan,
  endToolSpan,
  createLLMGeneration,
  endLLMGeneration,
  flushLangfuse,
  shutdownLangfuse,
} from './langfuse-service';

// Diagnostics service
export {
  DiagnosticsService,
  diagnosticsService,
} from './diagnostics';
export type {
  DiagnosticInfo,
  DiagnosticsMcpProvider,
} from './diagnostics';

// AI SDK Provider
export {
  createLanguageModel,
  getCurrentProviderId,
  getCurrentModelName,
  getTranscriptProviderId,
} from './ai-sdk-provider';
export type { ProviderType } from './ai-sdk-provider';

// Structured Output
export {
  makeStructuredToolCall,
  makeTextCompletion,
} from './structured-output';

// Summarization Service
export {
  isSummarizationEnabled,
  shouldSummarizeStep,
  summarizeAgentStep,
  summarizationService,
  parseSummaryResponse,
} from './summarization-service';
export type { SummarizationInput } from './summarization-service';

// System Prompts
export {
  DEFAULT_SYSTEM_PROMPT,
  getEffectiveSystemPrompt,
  AGENT_MODE_ADDITIONS,
  constructSystemPrompt,
  constructMinimalSystemPrompt,
} from './system-prompts';
export type { SystemPromptAdditions } from './system-prompts';

// Context Budget
export {
  shrinkMessagesForLLM,
  estimateTokensFromMessages,
  clearActualTokenUsage,
  clearIterativeSummary,
  recordActualTokenUsage,
} from './context-budget';

// LLM Fetch
export {
  makeLLMCallWithFetch,
  makeTextCompletionWithFetch,
  verifyCompletionWithFetch,
  makeLLMCallWithStreamingAndTools,
} from './llm-fetch';
export type {
  RetryProgressCallback,
  StreamingCallback,
} from './llm-fetch';

// LLM Continuation Guards
export {
  isDeliverableResponseContent,
  normalizeMissingItemsList,
  normalizeVerificationResultForCompletion,
  resolveIterationLimitFinalContent,
} from './llm-continuation-guards';

// LLM Verification Replay
export {
  VERIFICATION_SYSTEM_PROMPT,
  VERIFICATION_JSON_REQUEST_BASE,
  buildVerificationJsonRequest,
  buildVerificationMessagesFromAgentState,
  resolveContinueReplayMessages,
  parseContinueReplayFixture,
} from './llm-verification-replay';
export type {
  VerificationMessage,
  ExactVerifierMessagesReplayFixture,
  AgentStateReplayFixture,
  ContinueReplayFixture,
} from './llm-verification-replay';

// LLM Tool Gating
export {
  filterNamedItemsToAllowedTools,
} from './llm-tool-gating';
export type { ToolLike } from './llm-tool-gating';

// Agent Run Utils
export {
  DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
  AGENT_STOP_NOTE,
  resolveAgentIterationLimits,
  appendAgentStopNote,
  getLatestAssistantMessageContent,
  buildProfileContext,
  getPreferredDelegationOutput,
} from './agent-run-utils';
export type { AgentIterationLimits } from './agent-run-utils';

// Respond to User Utils
export {
  extractRespondToUserContentFromArgs,
  getLatestRespondToUserContentFromToolCalls,
  getLatestRespondToUserContentFromConversationHistory,
  resolveLatestUserFacingResponse,
} from './respond-to-user-utils';

// Session User Response Store
export {
  setSessionUserResponse,
  getSessionUserResponse,
  getSessionUserResponseHistory,
  clearSessionUserResponse,
  archiveSessionUserResponse,
} from './session-user-response-store';

// Main Agent Selection
export {
  resolveMainAcpAgentSelection,
} from './main-agent-selection';
export type { MainAcpAgentSelection } from './main-agent-selection';

// Conversation History Utils
export {
  filterEphemeralMessages,
  isEphemeralMessage,
} from './conversation-history-utils';

// TTS LLM Preprocessing
export {
  preprocessTextForTTSWithLLM,
  isLLMPreprocessingAvailable,
} from './tts-llm-preprocessing';

// Command Verification Service
export {
  verifyExternalAgentCommand,
  setCommandPathResolver,
} from './command-verification-service';
export type {
  ExternalAgentCommandVerificationInput,
  ExternalAgentCommandVerificationResult,
  CommandPathResolver,
} from './command-verification-service';

// LLM Engine (main agent loop)
export {
  postProcessTranscript,
  processTranscriptWithTools,
  processTranscriptWithAgentMode,
  MARK_WORK_COMPLETE_TOOL,
  INTERNAL_COMPLETION_NUDGE_TEXT,
  setLLMProgressEmitter,
  setLLMMemoryService,
  setLLMAgentSessionTracker,
  setLLMConversationService,
  setLLMSkillsService,
  setLLMAgentProfileService,
  setSystemPromptAdditionsFn,
} from './llm';
export type {
  LLMMemoryService,
  LLMAgentSessionTracker,
  LLMSkillsService,
  LLMAgentProfileService,
} from './llm';

// Additional types
export type {
  ACPConnectionType,
  ACPAgentConfig,
  MCPTool,
  MCPToolCall,
  MCPToolResult,
  LLMToolCallResponse,
  AgentProgressStep,
  AgentProgressUpdate,
  AgentStepSummary,
} from './types';

// Testing utilities
export {
  MockPathResolver,
  createMockPathResolver,
} from './testing/mock-path-resolver';
export { MockProgressEmitter } from './testing/mock-progress-emitter';
export { MockUserInteraction } from './testing/mock-user-interaction';
export { MockNotificationService } from './testing/mock-notification-service';
