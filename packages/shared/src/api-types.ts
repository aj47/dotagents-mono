/**
 * API types for DotAgents apps
 * These are interface/type definitions only - no implementation classes
 */

import type { QueuedMessage, ToolCall, ToolResult, LoopSchedule } from './types';
import type { ModelPreset } from './providers';
import type {
  KnowledgeNote,
  KnowledgeNoteContext,
  KnowledgeNoteEntryType,
} from './knowledge-note-domain';
export type { LoopSchedule } from './types';
export type {
  KnowledgeNote,
  KnowledgeNoteContext,
  KnowledgeNoteEntryType,
} from './knowledge-note-domain';

export interface Profile {
  id: string;
  name: string;
  isDefault?: boolean;
  guidelines?: string;
  systemPrompt?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ProfilesResponse {
  profiles: Profile[];
  currentProfileId?: string;
}

export interface MCPServer {
  name: string;
  connected: boolean;
  toolCount: number;
  enabled: boolean;
  runtimeEnabled: boolean;
  configDisabled: boolean;
  error?: string;
}

export interface MCPServersResponse {
  servers: MCPServer[];
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
}

export interface ModelsResponse {
  providerId: string;
  models: ModelInfo[];
}

export interface OpenAICompatibleModelSummary {
  id: string;
  object: 'model';
  owned_by?: string;
}

export interface OpenAICompatibleModelsResponse {
  object: 'list';
  data: OpenAICompatibleModelSummary[];
}

export type OperatorHealthStatus = 'pass' | 'warning' | 'fail';
export type OperatorHealthOverall = 'healthy' | 'warning' | 'critical';

export interface OperatorRemoteServerStatus {
  running: boolean;
  bind: string;
  port: number;
  url?: string;
  connectableUrl?: string;
  lastError?: string;
}

export interface OperatorTunnelStatus {
  running: boolean;
  starting: boolean;
  mode: 'quick' | 'named' | null;
  url?: string;
  error?: string;
}

export interface OperatorTunnelSetupTunnel {
  id: string;
  name: string;
  createdAt?: string;
}

export interface OperatorTunnelSetupSummary {
  installed: boolean;
  loggedIn: boolean;
  mode: 'quick' | 'named';
  autoStart: boolean;
  namedTunnelConfigured: boolean;
  configuredTunnelId?: string;
  configuredHostname?: string;
  credentialsPathConfigured: boolean;
  tunnelCount: number;
  tunnels: OperatorTunnelSetupTunnel[];
  error?: string;
}

export interface OperatorHealthCheck {
  status: OperatorHealthStatus;
  message: string;
}

export interface OperatorHealthSnapshot {
  checkedAt: number;
  overall: OperatorHealthOverall;
  checks: Record<string, OperatorHealthCheck>;
}

export interface OperatorRecentError {
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  component: string;
  message: string;
}

export interface OperatorRecentErrorsResponse {
  count: number;
  errors: OperatorRecentError[];
}

export interface OperatorLogsResponse {
  count: number;
  level?: 'error' | 'warning' | 'info';
  logs: OperatorRecentError[];
}

export interface OperatorMCPServerSummary {
  name: string;
  connected: boolean;
  toolCount: number;
  enabled: boolean;
  runtimeEnabled: boolean;
  configDisabled: boolean;
  error?: string;
}

export interface OperatorMCPServerLogEntry {
  timestamp: number;
  message: string;
}

export interface OperatorMCPServerLogsResponse {
  server: string;
  count: number;
  logs: OperatorMCPServerLogEntry[];
}

export interface OperatorMCPServerTestResponse {
  success: boolean;
  action: 'mcp-test';
  server: string;
  message: string;
  error?: string;
  toolCount?: number;
}

export interface OperatorMCPToolSummary {
  name: string;
  description: string;
  sourceKind: 'mcp' | 'runtime';
  sourceName: string;
  sourceLabel: string;
  serverName?: string;
  enabled: boolean;
  serverEnabled: boolean;
}

export interface OperatorMCPToolsResponse {
  count: number;
  server?: string;
  tools: OperatorMCPToolSummary[];
}

export interface OperatorMCPToolToggleResponse {
  success: boolean;
  action: 'mcp-tool-toggle';
  tool: string;
  enabled: boolean;
  message: string;
  error?: string;
}

export interface OperatorMCPStatusResponse {
  totalServers: number;
  connectedServers: number;
  totalTools: number;
  servers: OperatorMCPServerSummary[];
}

export interface OperatorConversationItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  preview: string;
}

export interface OperatorConversationsResponse {
  count: number;
  conversations: OperatorConversationItem[];
}

export interface OperatorMessageQueueSummary {
  conversationId: string;
  isPaused: boolean;
  messageCount: number;
  messages: QueuedMessage[];
}

export interface OperatorMessageQueuesResponse {
  count: number;
  totalMessages: number;
  queues: OperatorMessageQueueSummary[];
}

export interface OperatorLogSummary {
  total: number;
  lastTimestamp?: number;
  errorCount?: number;
  warningCount?: number;
  infoCount?: number;
}

export interface OperatorDiscordIntegrationSummary {
  available: boolean;
  enabled: boolean;
  connected: boolean;
  connecting: boolean;
  tokenConfigured?: boolean;
  defaultProfileId?: string;
  defaultProfileName?: string;
  botUsername?: string;
  lastError?: string;
  lastEventAt?: number;
  logs: OperatorLogSummary;
}

export interface OperatorDiscordLogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: number;
}

export interface OperatorDiscordLogsResponse {
  count: number;
  logs: OperatorDiscordLogEntry[];
}

export interface OperatorWhatsAppIntegrationSummary {
  enabled: boolean;
  available: boolean;
  connected: boolean;
  serverConfigured: boolean;
  serverConnected: boolean;
  autoReplyEnabled: boolean;
  logMessagesEnabled: boolean;
  allowedSenderCount: number;
  hasCredentials?: boolean;
  lastError?: string;
  logs: OperatorLogSummary;
}

export interface OperatorPushNotificationsSummary {
  enabled: boolean;
  tokenCount: number;
  platforms: string[];
}

export interface OperatorIntegrationsSummary {
  discord: OperatorDiscordIntegrationSummary;
  whatsapp: OperatorWhatsAppIntegrationSummary;
  pushNotifications: OperatorPushNotificationsSummary;
}

export interface OperatorUpdaterStatus {
  enabled: boolean;
  mode: 'disabled' | 'manual' | 'auto';
  currentVersion?: string;
  updateInfo?: unknown;
  manualReleasesUrl?: string;
  updateAvailable?: boolean;
  lastCheckedAt?: number;
  lastCheckError?: string;
  latestRelease?: {
    tagName: string;
    name?: string;
    publishedAt?: string;
    url: string;
    assetCount?: number;
  };
  preferredAsset?: {
    name: string;
    downloadUrl: string;
  };
  lastDownloadedAt?: number;
  lastDownloadedFileName?: string;
}

export interface OperatorSystemMetrics {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion?: string;
  appVersion?: string;
  uptimeSeconds: number;
  processUptimeSeconds: number;
  memoryUsage: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  cpuCount: number;
  totalMemoryMB: number;
  freeMemoryMB: number;
  hostname: string;
}

export interface OperatorSessionsSummary {
  activeSessions: number;
  recentSessions: number;
  activeSessionDetails: Array<{
    id: string;
    title?: string;
    status: string;
    startTime: number;
    currentIteration?: number;
    maxIterations?: number;
  }>;
}

export interface OperatorRuntimeStatus {
  timestamp: number;
  remoteServer: OperatorRemoteServerStatus;
  health: OperatorHealthSnapshot;
  tunnel: OperatorTunnelStatus;
  integrations: OperatorIntegrationsSummary;
  updater: OperatorUpdaterStatus;
  system: OperatorSystemMetrics;
  sessions: OperatorSessionsSummary;
  recentErrors: {
    total: number;
    errorsInLastFiveMinutes: number;
  };
}

export interface OperatorActionResponse {
  success: boolean;
  action: string;
  message: string;
  scheduled?: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

export interface OperatorRunAgentRequest {
  prompt: string;
  conversationId?: string;
  profileId?: string;
}

export interface OperatorRunAgentResponse {
  success: boolean;
  action: 'run-agent';
  conversationId: string;
  content: string;
  messageCount: number;
  error?: string;
}

export interface EmergencyStopResponse {
  success: boolean;
  message?: string;
  error?: string;
  processesKilled?: number;
  processesRemaining?: number;
}

export interface OperatorAuditSource {
  ip?: string;
  origin?: string;
  userAgent?: string;
}

export interface OperatorAuditEntry {
  timestamp: number;
  action: string;
  path: string;
  success: boolean;
  deviceId?: string;
  source?: OperatorAuditSource;
  details?: Record<string, unknown>;
  failureReason?: string;
}

export interface OperatorAuditResponse {
  count: number;
  entries: OperatorAuditEntry[];
}

export interface OperatorApiKeyRotationResponse extends OperatorActionResponse {
  apiKey: string;
  restartScheduled: boolean;
}

export type LocalSpeechModelProviderId = 'parakeet' | 'kitten' | 'supertonic';

export interface LocalSpeechModelStatus {
  downloaded: boolean;
  downloading: boolean;
  progress: number;
  error?: string;
  path?: string;
}

export interface LocalSpeechModelStatusesResponse {
  models: Record<LocalSpeechModelProviderId, LocalSpeechModelStatus>;
}

export interface ModelPresetSummary extends Omit<ModelPreset, 'apiKey'> {
  /**
   * Redacted API key value. Servers must never return the raw key here.
   */
  apiKey?: string;
  hasApiKey?: boolean;
}

export interface ModelPresetsResponse {
  currentModelPresetId: string;
  presets: ModelPresetSummary[];
}

export interface ModelPresetCreateRequest {
  name: string;
  baseUrl: string;
  apiKey?: string;
  agentModel?: string;
  mcpToolsModel?: string;
  transcriptProcessingModel?: string;
}

export interface ModelPresetUpdateRequest {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  agentModel?: string;
  mcpToolsModel?: string;
  transcriptProcessingModel?: string;
}

export interface ModelPresetMutationResponse {
  success: boolean;
  currentModelPresetId: string;
  presets: ModelPresetSummary[];
  preset?: ModelPresetSummary;
  deletedPresetId?: string;
}

export interface PredefinedPromptSummary {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type PredefinedPrompt = PredefinedPromptSummary;

export interface Settings {
  // Agent model configuration (mcpTools* fields are legacy compatibility aliases)
  agentProviderId: 'openai' | 'groq' | 'gemini' | 'chatgpt-web';
  agentOpenaiModel?: string;
  agentGroqModel?: string;
  agentGeminiModel?: string;
  agentChatgptWebModel?: string;
  mcpToolsProviderId: 'openai' | 'groq' | 'gemini' | 'chatgpt-web';
  mcpToolsOpenaiModel?: string;
  mcpToolsGroqModel?: string;
  mcpToolsGeminiModel?: string;
  mcpToolsChatgptWebModel?: string;
  currentModelPresetId?: string;
  availablePresets?: ModelPresetSummary[];
  predefinedPrompts?: PredefinedPromptSummary[];
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  groqApiKey?: string;
  groqBaseUrl?: string;
  geminiApiKey?: string;
  geminiBaseUrl?: string;

  // Agent Execution Settings
  mcpRequireApprovalBeforeToolCall?: boolean;
  mcpMaxIterations?: number;
  mcpUnlimitedIterations?: boolean;
  mainAgentMode?: 'api' | 'acpx';
  mainAgentName?: string;
  mcpVerifyCompletionEnabled?: boolean;
  mcpFinalSummaryEnabled?: boolean;

  // Context Reduction & Tool Response Processing
  mcpContextReductionEnabled?: boolean;
  mcpToolResponseProcessingEnabled?: boolean;
  mcpParallelToolExecution?: boolean;
  mcpMessageQueueEnabled?: boolean;

  // Speech-to-Text Configuration
  sttProviderId?: 'openai' | 'groq' | 'parakeet';
  sttLanguage?: string;
  openaiSttLanguage?: string;
  openaiSttModel?: string;
  groqSttLanguage?: string;
  groqSttModel?: string;
  groqSttPrompt?: string;
  transcriptionPreviewEnabled?: boolean;
  parakeetNumThreads?: number;

  // Transcript Post-Processing
  transcriptPostProcessingEnabled?: boolean;
  transcriptPostProcessingProviderId?: 'openai' | 'groq' | 'gemini' | 'chatgpt-web';
  transcriptPostProcessingOpenaiModel?: string;
  transcriptPostProcessingGroqModel?: string;
  transcriptPostProcessingGeminiModel?: string;
  transcriptPostProcessingChatgptWebModel?: string;
  transcriptPostProcessingPrompt?: string;

  // Text-to-Speech Configuration
  ttsEnabled?: boolean;
  ttsAutoPlay?: boolean;
  ttsProviderId?: 'openai' | 'groq' | 'gemini' | 'edge' | 'kitten' | 'supertonic';
  ttsPreprocessingEnabled?: boolean;
  ttsRemoveCodeBlocks?: boolean;
  ttsRemoveUrls?: boolean;
  ttsConvertMarkdown?: boolean;
  ttsUseLLMPreprocessing?: boolean;

  // TTS Voice/Model per Provider
  openaiTtsModel?: string;
  openaiTtsVoice?: string;
  openaiTtsSpeed?: number;
  groqTtsModel?: string;
  groqTtsVoice?: string;
  geminiTtsModel?: string;
  geminiTtsVoice?: string;
  edgeTtsModel?: string;
  edgeTtsVoice?: string;
  edgeTtsRate?: number;
  kittenVoiceId?: number;
  supertonicVoice?: string;
  supertonicLanguage?: string;
  supertonicSpeed?: number;
  supertonicSteps?: number;

  // Remote Server Configuration
  remoteServerEnabled?: boolean;
  remoteServerPort?: number;
  remoteServerBindAddress?: '127.0.0.1' | '0.0.0.0';
  remoteServerApiKey?: string;
  remoteServerLogLevel?: 'error' | 'info' | 'debug';
  remoteServerCorsOrigins?: string[];
  remoteServerOperatorAllowDeviceIds?: string[];
  remoteServerAutoShowPanel?: boolean;
  remoteServerTerminalQrEnabled?: boolean;

  // Cloudflare Tunnel Configuration
  cloudflareTunnelMode?: 'quick' | 'named';
  cloudflareTunnelAutoStart?: boolean;
  cloudflareTunnelId?: string;
  cloudflareTunnelName?: string;
  cloudflareTunnelCredentialsPath?: string;
  cloudflareTunnelHostname?: string;

  // WhatsApp Integration
  whatsappEnabled?: boolean;
  whatsappAllowFrom?: string[];
  whatsappOperatorAllowFrom?: string[];
  whatsappAutoReply?: boolean;
  whatsappLogMessages?: boolean;

  // Discord Integration
  discordEnabled?: boolean;
  discordBotToken?: string;
  discordDmEnabled?: boolean;
  discordRequireMention?: boolean;
  discordAllowUserIds?: string[];
  discordAllowGuildIds?: string[];
  discordAllowChannelIds?: string[];
  discordAllowRoleIds?: string[];
  discordDmAllowUserIds?: string[];
  discordOperatorAllowUserIds?: string[];
  discordOperatorAllowGuildIds?: string[];
  discordOperatorAllowChannelIds?: string[];
  discordOperatorAllowRoleIds?: string[];
  discordDefaultProfileId?: string;
  discordLogMessages?: boolean;

  // Langfuse Observability
  langfuseEnabled?: boolean;
  langfusePublicKey?: string;
  langfuseSecretKey?: string;
  langfuseBaseUrl?: string;

  // Local Trace Logging — opt-in per-session JSONL logs on disk (independent of Langfuse Cloud)
  localTraceLoggingEnabled?: boolean;
  localTraceLogPath?: string;

  // Dual-Model Settings
  dualModelEnabled?: boolean;

  // Streamer Mode
  streamerModeEnabled?: boolean;

  // Session History (pinned/archived conversation IDs)
  pinnedSessionIds?: string[];
  archivedSessionIds?: string[];

  // acpx-capable agent profile summaries (read-only, from GET only)
  acpxAgents?: Array<{ name: string; displayName: string }>;
}

export interface SettingsUpdate {
  // Agent model configuration (mcpTools* fields are legacy compatibility aliases)
  agentProviderId?: 'openai' | 'groq' | 'gemini' | 'chatgpt-web';
  agentOpenaiModel?: string;
  agentGroqModel?: string;
  agentGeminiModel?: string;
  agentChatgptWebModel?: string;
  mcpToolsProviderId?: 'openai' | 'groq' | 'gemini' | 'chatgpt-web';
  mcpToolsOpenaiModel?: string;
  mcpToolsGroqModel?: string;
  mcpToolsGeminiModel?: string;
  mcpToolsChatgptWebModel?: string;
  currentModelPresetId?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  groqApiKey?: string;
  groqBaseUrl?: string;
  geminiApiKey?: string;
  geminiBaseUrl?: string;

  // Agent Execution Settings
  mcpRequireApprovalBeforeToolCall?: boolean;
  mcpMaxIterations?: number;
  mcpUnlimitedIterations?: boolean;
  mainAgentMode?: 'api' | 'acpx';
  mainAgentName?: string;
  mcpVerifyCompletionEnabled?: boolean;
  mcpFinalSummaryEnabled?: boolean;

  // Context Reduction & Tool Response Processing
  mcpContextReductionEnabled?: boolean;
  mcpToolResponseProcessingEnabled?: boolean;
  mcpParallelToolExecution?: boolean;
  mcpMessageQueueEnabled?: boolean;

  // Speech-to-Text Configuration
  sttProviderId?: 'openai' | 'groq' | 'parakeet';
  sttLanguage?: string;
  openaiSttLanguage?: string;
  openaiSttModel?: string;
  groqSttLanguage?: string;
  groqSttModel?: string;
  groqSttPrompt?: string;
  transcriptionPreviewEnabled?: boolean;
  parakeetNumThreads?: number;

  // Transcript Post-Processing
  transcriptPostProcessingEnabled?: boolean;
  transcriptPostProcessingProviderId?: 'openai' | 'groq' | 'gemini' | 'chatgpt-web';
  transcriptPostProcessingOpenaiModel?: string;
  transcriptPostProcessingGroqModel?: string;
  transcriptPostProcessingGeminiModel?: string;
  transcriptPostProcessingChatgptWebModel?: string;
  transcriptPostProcessingPrompt?: string;

  // Text-to-Speech Configuration
  ttsEnabled?: boolean;
  ttsAutoPlay?: boolean;
  ttsProviderId?: 'openai' | 'groq' | 'gemini' | 'edge' | 'kitten' | 'supertonic';
  ttsPreprocessingEnabled?: boolean;
  ttsRemoveCodeBlocks?: boolean;
  ttsRemoveUrls?: boolean;
  ttsConvertMarkdown?: boolean;
  ttsUseLLMPreprocessing?: boolean;

  // TTS Voice/Model per Provider
  openaiTtsModel?: string;
  openaiTtsVoice?: string;
  openaiTtsSpeed?: number;
  groqTtsModel?: string;
  groqTtsVoice?: string;
  geminiTtsModel?: string;
  geminiTtsVoice?: string;
  edgeTtsModel?: string;
  edgeTtsVoice?: string;
  edgeTtsRate?: number;
  kittenVoiceId?: number;
  supertonicVoice?: string;
  supertonicLanguage?: string;
  supertonicSpeed?: number;
  supertonicSteps?: number;

  // Remote Server Configuration
  remoteServerEnabled?: boolean;
  remoteServerPort?: number;
  remoteServerBindAddress?: '127.0.0.1' | '0.0.0.0';
  remoteServerApiKey?: string;
  remoteServerLogLevel?: 'error' | 'info' | 'debug';
  remoteServerCorsOrigins?: string[];
  remoteServerOperatorAllowDeviceIds?: string[];
  remoteServerAutoShowPanel?: boolean;
  remoteServerTerminalQrEnabled?: boolean;

  // Cloudflare Tunnel Configuration
  cloudflareTunnelMode?: 'quick' | 'named';
  cloudflareTunnelAutoStart?: boolean;
  cloudflareTunnelId?: string;
  cloudflareTunnelName?: string;
  cloudflareTunnelCredentialsPath?: string;
  cloudflareTunnelHostname?: string;

  // WhatsApp Integration
  whatsappEnabled?: boolean;
  whatsappAllowFrom?: string[];
  whatsappOperatorAllowFrom?: string[];
  whatsappAutoReply?: boolean;
  whatsappLogMessages?: boolean;

  // Discord Integration
  discordEnabled?: boolean;
  discordBotToken?: string;
  discordDmEnabled?: boolean;
  discordRequireMention?: boolean;
  discordAllowUserIds?: string[];
  discordAllowGuildIds?: string[];
  discordAllowChannelIds?: string[];
  discordAllowRoleIds?: string[];
  discordDmAllowUserIds?: string[];
  discordOperatorAllowUserIds?: string[];
  discordOperatorAllowGuildIds?: string[];
  discordOperatorAllowChannelIds?: string[];
  discordOperatorAllowRoleIds?: string[];
  discordDefaultProfileId?: string;
  discordLogMessages?: boolean;

  // Langfuse Observability
  langfuseEnabled?: boolean;
  langfusePublicKey?: string;
  langfuseSecretKey?: string;
  langfuseBaseUrl?: string;

  // Local Trace Logging — opt-in per-session JSONL logs on disk (independent of Langfuse Cloud)
  localTraceLoggingEnabled?: boolean;
  localTraceLogPath?: string;

  // Dual-Model Settings
  dualModelEnabled?: boolean;

  // Streamer Mode
  streamerModeEnabled?: boolean;

  // Session History (pinned/archived conversation IDs)
  pinnedSessionIds?: string[];
  archivedSessionIds?: string[];

  // Predefined Prompts
  predefinedPrompts?: PredefinedPromptSummary[];
}

// Conversation Sync Types
export interface ServerConversationMessage {
  id?: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp?: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ServerConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessage?: string;
  preview?: string;
}

export interface ServerConversationFull {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ServerConversationMessage[];
  metadata?: Record<string, unknown>;
}

export interface CreateConversationRequest {
  title?: string;
  messages: ServerConversationMessage[];
  createdAt?: number;
  updatedAt?: number;
}

export interface UpdateConversationRequest {
  title?: string;
  messages?: ServerConversationMessage[];
  updatedAt?: number;
}

// Push notification registration/unregistration
export interface PushTokenRegistration {
  token: string;
  type: 'expo';
  platform: 'ios' | 'android';
  deviceId?: string;
}

export interface PushStatusResponse {
  enabled: boolean;
  tokenCount: number;
  platforms: string[];
}

export interface TtsSpeakRequest {
  text: string;
  providerId?: string;
  voice?: string;
  model?: string;
  speed?: number;
}

export interface TtsSpeakResponse {
  audio: ArrayBuffer;
  mimeType: string;
  provider?: string;
}

// Skills Types
export interface Skill {
  id: string;
  name: string;
  description: string;
  instructions?: string;
  enabled: boolean;
  enabledForProfile: boolean;
  source?: 'local' | 'imported';
  createdAt: number;
  updatedAt: number;
}

export interface SkillsResponse {
  skills: Skill[];
  currentProfileId?: string;
}

export interface SkillResponse {
  skill: Skill;
}

export interface SkillCreateRequest {
  name: string;
  description?: string;
  instructions?: string;
}

export interface SkillUpdateRequest {
  name?: string;
  description?: string;
  instructions?: string;
}

export interface SkillMutationResponse {
  success: true;
  skill: Skill;
}

export interface SkillDeleteResponse {
  success: true;
  id: string;
}

export interface SkillToggleResponse {
  success: true;
  skillId: string;
  enabledForProfile: boolean;
}

export interface KnowledgeNotesResponse {
  notes: KnowledgeNote[];
}

export interface KnowledgeNoteResponse {
  note: KnowledgeNote;
}

export interface KnowledgeNoteMutationResponse {
  success: true;
  note: KnowledgeNote;
}

export interface KnowledgeNoteDeleteResponse {
  success: true;
  id: string;
}

export interface KnowledgeNoteCreateRequest {
  id?: string;
  title?: string;
  body: string;
  summary?: string;
  context?: KnowledgeNoteContext;
  tags?: string[];
  references?: string[];
}

export interface KnowledgeNoteUpdateRequest {
  title?: string;
  body?: string;
  summary?: string;
  context?: KnowledgeNoteContext;
  tags?: string[];
  references?: string[];
}

// Agent Profiles Types (renamed to Api* to avoid conflict with desktop's AgentProfile)
export interface ApiAgentProfile {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  guidelines?: string;
  systemPrompt?: string;
  enabled: boolean;
  isBuiltIn?: boolean;
  isUserProfile?: boolean;
  isAgentTarget?: boolean;
  isDefault?: boolean;
  role?: 'chat-agent' | 'delegation-target' | 'external-agent' | 'user-profile';
  connectionType: 'internal' | 'acpx' | 'acp' | 'stdio' | 'remote';
  autoSpawn?: boolean;
  createdAt: number;
  updatedAt: number;
}

// Full agent profile detail (from GET /v1/agent-profiles/:id)
export interface ApiAgentProfileFull extends ApiAgentProfile {
  properties?: Record<string, string>;
  avatarDataUrl?: string;
  isStateful?: boolean;
  conversationId?: string;
  connection?: {
    type: 'internal' | 'acpx' | 'acp' | 'stdio' | 'remote';
    agent?: string;
    command?: string;
    args?: string[];
    baseUrl?: string;
    cwd?: string;
  };
  modelConfig?: Record<string, unknown>;
  toolConfig?: Record<string, unknown>;
  skillsConfig?: Record<string, unknown>;
}

export interface ApiAgentProfilesResponse {
  profiles: ApiAgentProfile[];
}

export interface AgentProfileToggleResponse {
  success: true;
  id: string;
  enabled: boolean;
}

export interface AgentProfileDeleteResponse {
  success: true;
}

export interface AgentProfileCreateRequest {
  displayName: string;
  description?: string;
  systemPrompt?: string;
  guidelines?: string;
  connectionType?: 'internal' | 'acpx' | 'acp' | 'stdio' | 'remote';
  connectionCommand?: string;
  connectionArgs?: string;
  connectionAgent?: string;
  connectionBaseUrl?: string;
  connectionCwd?: string;
  enabled?: boolean;
  autoSpawn?: boolean;
  properties?: Record<string, string>;
}

export interface AgentProfileUpdateRequest {
  displayName?: string;
  description?: string;
  systemPrompt?: string;
  guidelines?: string;
  connectionType?: 'internal' | 'acpx' | 'acp' | 'stdio' | 'remote';
  connectionCommand?: string;
  connectionArgs?: string;
  connectionAgent?: string;
  connectionBaseUrl?: string;
  connectionCwd?: string;
  enabled?: boolean;
  autoSpawn?: boolean;
  properties?: Record<string, string>;
}

export interface Loop {
  id: string;
  name: string;
  prompt: string;
  intervalMinutes: number;
  enabled: boolean;
  profileId?: string;
  profileName?: string;
  runOnStartup?: boolean;
  speakOnTrigger?: boolean;
  continueInSession?: boolean;
  lastSessionId?: string;
  runContinuously?: boolean;
  maxIterations?: number;
  lastRunAt?: number;
  isRunning: boolean;
  nextRunAt?: number;
  schedule?: LoopSchedule;
}

export interface LoopsResponse {
  loops: Loop[];
}

export interface LoopCreateRequest {
  name: string;
  prompt: string;
  intervalMinutes: number;
  enabled: boolean;
  profileId?: string;
  runOnStartup?: boolean;
  speakOnTrigger?: boolean;
  continueInSession?: boolean;
  lastSessionId?: string;
  runContinuously?: boolean;
  maxIterations?: number;
  schedule?: LoopSchedule | null;
}

export interface LoopUpdateRequest {
  name?: string;
  prompt?: string;
  intervalMinutes?: number;
  enabled?: boolean;
  profileId?: string | null;
  runOnStartup?: boolean;
  speakOnTrigger?: boolean;
  continueInSession?: boolean;
  lastSessionId?: string | null;
  runContinuously?: boolean;
  maxIterations?: number | null;
  schedule?: LoopSchedule | null;
}

export interface LoopMutationResponse {
  success: true;
  loop: Loop;
}

export interface LoopDeleteResponse {
  success: true;
  id: string;
}

export interface LoopToggleResponse {
  success: true;
  id: string;
  enabled: boolean;
}

export interface LoopRunResponse {
  success: true;
  id: string;
}
