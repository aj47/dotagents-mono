/**
 * API types for DotAgents apps
 * These are interface/type definitions only - no implementation classes
 */

import type { ModelPreset } from './providers';
import type { TitleSource } from './session';
import type { QueuedMessage } from './types';

export type OpenAiReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
export type CodexTextVerbosity = 'low' | 'medium' | 'high';
export type CodexServiceTier = 'standard' | 'priority';

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

export interface ModelPresetSummary extends Omit<ModelPreset, 'apiKey'> {
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

export interface AgentSessionCandidate {
  id: string;
  conversationId?: string;
  conversationTitle?: string;
  status: string;
  startTime: number;
  endTime?: number;
}

export interface AgentSessionCandidatesResponse {
  activeSessions: AgentSessionCandidate[];
  completedSessions: AgentSessionCandidate[];
}

export interface ToolApprovalResponse {
  success: boolean;
  approvalId: string;
  approved: boolean;
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

export interface OperatorDiagnosticReportError extends OperatorRecentError {
  stack?: string;
}

export interface OperatorDiagnosticReport {
  timestamp: number;
  system: {
    platform: string;
    nodeVersion: string;
    electronVersion: string;
  };
  config: {
    mcpServersCount: number;
  };
  mcp: {
    availableTools: number;
    toolDiscoveryError?: string;
    serverStatus: Record<string, { connected: boolean; toolCount: number }>;
  };
  errors: OperatorDiagnosticReportError[];
}

export interface OperatorDiagnosticReportSaveResponse extends OperatorActionResponse {
  filePath?: string;
}

export interface OperatorMCPServerSummary {
  name: string;
  connected: boolean;
  toolCount: number;
  enabled: boolean;
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
    conversationId?: string;
    title?: string;
    status: string;
    startTime: number;
    currentIteration?: number;
    maxIterations?: number;
    isSnoozed?: boolean;
    profileId?: string;
    profileName?: string;
  }>;
  recentSessionDetails?: Array<{
    id: string;
    conversationId?: string;
    title?: string;
    status: string;
    startTime: number;
    endTime?: number;
    profileId?: string;
    profileName?: string;
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

export interface PredefinedPromptSummary {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

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
  openaiReasoningEffort?: OpenAiReasoningEffort;
  codexTextVerbosity?: CodexTextVerbosity;
  codexServiceTier?: CodexServiceTier;
  currentModelPresetId?: string;
  availablePresets?: ModelPresetSummary[];
  predefinedPrompts?: PredefinedPromptSummary[];
  knowledgeRoots?: string[];

  // Provider credentials and base URLs are returned masked when configured.
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  groqApiKey?: string;
  groqBaseUrl?: string;
  geminiApiKey?: string;
  geminiBaseUrl?: string;
  chatgptWebAccessToken?: string;
  chatgptWebSessionToken?: string;
  chatgptWebBaseUrl?: string;

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
  mcpAutoPasteEnabled?: boolean;
  mcpAutoPasteDelay?: number;

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

  // Desktop shell / panel settings exposed to mobile operator controls
  hideDockIcon?: boolean;
  launchAtLogin?: boolean;
  themePreference?: 'system' | 'light' | 'dark';
  textInputEnabled?: boolean;
  panelPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'custom';
  panelDragEnabled?: boolean;
  floatingPanelAutoShow?: boolean;
  hidePanelWhenMainFocused?: boolean;
  panelCustomPosition?: { x: number; y: number };
  panelCustomSize?: { width: number; height: number };
  panelProgressSize?: { width: number; height: number };
  panelTextInputSize?: { width: number; height: number };

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

  // Desktop conversation storage
  conversationsEnabled?: boolean;
  maxConversationsToKeep?: number;
  autoSaveConversations?: boolean;

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
  openaiReasoningEffort?: OpenAiReasoningEffort;
  codexTextVerbosity?: CodexTextVerbosity;
  codexServiceTier?: CodexServiceTier;
  currentModelPresetId?: string;

  // Provider credentials and base URLs.
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  groqApiKey?: string;
  groqBaseUrl?: string;
  geminiApiKey?: string;
  geminiBaseUrl?: string;
  chatgptWebAccessToken?: string;
  chatgptWebSessionToken?: string;
  chatgptWebBaseUrl?: string;

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
  mcpAutoPasteEnabled?: boolean;
  mcpAutoPasteDelay?: number;

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

  // Desktop shell / panel settings exposed to mobile operator controls
  hideDockIcon?: boolean;
  launchAtLogin?: boolean;
  themePreference?: 'system' | 'light' | 'dark';
  textInputEnabled?: boolean;
  panelPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'custom';
  panelDragEnabled?: boolean;
  floatingPanelAutoShow?: boolean;
  hidePanelWhenMainFocused?: boolean;
  panelCustomPosition?: { x: number; y: number };
  panelCustomSize?: { width: number; height: number };
  panelProgressSize?: { width: number; height: number };
  panelTextInputSize?: { width: number; height: number };

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

  // Desktop conversation storage
  conversationsEnabled?: boolean;
  maxConversationsToKeep?: number;
  autoSaveConversations?: boolean;

  // Predefined Prompts
  predefinedPrompts?: PredefinedPromptSummary[];
}

// Conversation Sync Types
export interface ServerConversationMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp?: number;
  toolCalls?: unknown[];
  toolResults?: unknown[];
}

export interface ServerConversation {
  id: string;
  clientSessionId?: string;
  title: string;
  titleSource?: TitleSource;
  createdAt: number;
  updatedAt: number;
  lastMessageAt?: number | null;
  messageCount: number;
  lastMessage?: string;
  preview?: string;
  searchText?: string;
}

export interface ServerConversationFull {
  id: string;
  clientSessionId?: string;
  title: string;
  titleSource?: TitleSource;
  createdAt: number;
  updatedAt: number;
  messages: ServerConversationMessage[];
  metadata?: Record<string, unknown>;
}

export interface CreateConversationRequest {
  clientSessionId?: string;
  title?: string;
  titleSource?: TitleSource;
  messages: ServerConversationMessage[];
  createdAt?: number;
  updatedAt?: number;
}

export interface UpdateConversationRequest {
  clientSessionId?: string;
  title?: string;
  titleSource?: TitleSource;
  messages?: ServerConversationMessage[];
  updatedAt?: number;
}

export interface BranchConversationRequest {
  messageIndex: number;
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

export interface RemoteSttTranscriptionRequest {
  audioBase64: string;
  mimeType?: string;
  fileName?: string;
  durationMs?: number;
}

export interface RemoteSttTranscriptionResponse {
  text: string;
  provider: 'openai' | 'groq' | 'parakeet';
  model?: string;
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

// Knowledge Note Types
export type KnowledgeNoteContext = 'auto' | 'search-only';
export type KnowledgeNoteEntryType = 'note' | 'entry' | 'overview';

export interface KnowledgeNote {
  id: string;
  title: string;
  context: KnowledgeNoteContext;
  body: string;
  summary?: string;
  tags: string[];
  references?: string[];
  createdAt?: number;
  updatedAt: number;
  group?: string;
  series?: string;
  entryType?: KnowledgeNoteEntryType;
}

export interface KnowledgeNotesResponse {
  notes: KnowledgeNote[];
}

// Agent Profiles Types (renamed to Api* to avoid conflict with desktop's AgentProfile)
export interface ApiAgentProfile {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  avatarDataUrl?: string | null;
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
  avatarDataUrl?: string | null;
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

export interface AgentProfileCreateRequest {
  displayName: string;
  description?: string;
  avatarDataUrl?: string | null;
  systemPrompt?: string;
  guidelines?: string;
  modelConfig?: Record<string, unknown>;
  toolConfig?: Record<string, unknown>;
  skillsConfig?: Record<string, unknown>;
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
  avatarDataUrl?: string | null;
  systemPrompt?: string;
  guidelines?: string;
  modelConfig?: Record<string, unknown>;
  toolConfig?: Record<string, unknown>;
  skillsConfig?: Record<string, unknown>;
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

export interface VerifyExternalAgentCommandRequest {
  command: string;
  args?: string[];
  cwd?: string;
  probeArgs?: string[];
}

export interface VerifyExternalAgentCommandResponse {
  ok: boolean;
  resolvedCommand?: string;
  details?: string;
  error?: string;
  warnings?: string[];
}

// Agent Loops Types
export type LoopSchedule =
  | { type: "daily"; times: string[] }
  | { type: "weekly"; times: string[]; daysOfWeek: number[] };

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
