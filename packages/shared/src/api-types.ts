/**
 * API types for DotAgents apps
 * These are interface/type definitions only - no implementation classes
 */

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
  // MCP Tools Model Configuration
  mcpToolsProviderId: 'openai' | 'groq' | 'gemini';
  mcpToolsOpenaiModel?: string;
  mcpToolsGroqModel?: string;
  mcpToolsGeminiModel?: string;
  currentModelPresetId?: string;
  availablePresets?: Array<{ id: string; name: string; baseUrl: string; isBuiltIn: boolean }>;
  predefinedPrompts?: PredefinedPromptSummary[];

  // Agent Execution Settings
  mcpRequireApprovalBeforeToolCall?: boolean;
  mcpMaxIterations?: number;
  mcpUnlimitedIterations?: boolean;
  mainAgentMode?: 'api' | 'acp';
  mainAgentName?: string;
  acpInjectBuiltinTools?: boolean;
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
  transcriptionPreviewEnabled?: boolean;

  // Transcript Post-Processing
  transcriptPostProcessingEnabled?: boolean;
  transcriptPostProcessingProviderId?: 'openai' | 'groq' | 'gemini';
  transcriptPostProcessingOpenaiModel?: string;
  transcriptPostProcessingGroqModel?: string;
  transcriptPostProcessingGeminiModel?: string;
  transcriptPostProcessingPrompt?: string;

  // Text-to-Speech Configuration
  ttsEnabled?: boolean;
  ttsAutoPlay?: boolean;
  ttsProviderId?: 'openai' | 'groq' | 'gemini' | 'kitten' | 'supertonic';
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
  discordOperatorAllowUserIds?: string[];
  discordOperatorAllowGuildIds?: string[];
  discordOperatorAllowChannelIds?: string[];
  discordDefaultProfileId?: string;
  discordLogMessages?: boolean;

  // Langfuse Observability
  langfuseEnabled?: boolean;
  langfusePublicKey?: string;
  langfuseSecretKey?: string;
  langfuseBaseUrl?: string;

  // Dual-Model Settings
  dualModelEnabled?: boolean;

  // Streamer Mode
  streamerModeEnabled?: boolean;

  // ACP Agents list (read-only, from GET only)
  acpAgents?: Array<{ name: string; displayName: string }>;
}

export interface SettingsUpdate {
  // MCP Tools Model Configuration
  mcpToolsProviderId?: 'openai' | 'groq' | 'gemini';
  mcpToolsOpenaiModel?: string;
  mcpToolsGroqModel?: string;
  mcpToolsGeminiModel?: string;
  currentModelPresetId?: string;

  // Agent Execution Settings
  mcpRequireApprovalBeforeToolCall?: boolean;
  mcpMaxIterations?: number;
  mcpUnlimitedIterations?: boolean;
  mainAgentMode?: 'api' | 'acp';
  mainAgentName?: string;
  acpInjectBuiltinTools?: boolean;
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
  transcriptionPreviewEnabled?: boolean;

  // Transcript Post-Processing
  transcriptPostProcessingEnabled?: boolean;
  transcriptPostProcessingProviderId?: 'openai' | 'groq' | 'gemini';
  transcriptPostProcessingOpenaiModel?: string;
  transcriptPostProcessingGroqModel?: string;
  transcriptPostProcessingGeminiModel?: string;
  transcriptPostProcessingPrompt?: string;

  // Text-to-Speech Configuration
  ttsEnabled?: boolean;
  ttsAutoPlay?: boolean;
  ttsProviderId?: 'openai' | 'groq' | 'gemini' | 'kitten' | 'supertonic';
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
  discordOperatorAllowUserIds?: string[];
  discordOperatorAllowGuildIds?: string[];
  discordOperatorAllowChannelIds?: string[];
  discordDefaultProfileId?: string;
  discordLogMessages?: boolean;

  // Langfuse Observability
  langfuseEnabled?: boolean;
  langfusePublicKey?: string;
  langfuseSecretKey?: string;
  langfuseBaseUrl?: string;

  // Dual-Model Settings
  dualModelEnabled?: boolean;

  // Streamer Mode
  streamerModeEnabled?: boolean;
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

// Skills Types
export interface Skill {
  id: string;
  name: string;
  description: string;
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

// Memories Types
export interface Memory {
  id: string;
  title: string;
  content: string;
  tags: string[];
  importance: 'low' | 'medium' | 'high' | 'critical';
  profileId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MemoriesResponse {
  memories: Memory[];
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
  role?: 'user-profile' | 'delegation-target' | 'external-agent';
  connectionType: 'internal' | 'acp' | 'stdio' | 'remote';
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
    type: 'internal' | 'acp' | 'stdio' | 'remote';
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
  systemPrompt?: string;
  guidelines?: string;
  connectionType?: 'internal' | 'acp' | 'stdio' | 'remote';
  connectionCommand?: string;
  connectionArgs?: string;
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
  connectionType?: 'internal' | 'acp' | 'stdio' | 'remote';
  connectionCommand?: string;
  connectionArgs?: string;
  connectionBaseUrl?: string;
  connectionCwd?: string;
  enabled?: boolean;
  autoSpawn?: boolean;
  properties?: Record<string, string>;
}

// Agent Loops Types
export interface Loop {
  id: string;
  name: string;
  prompt: string;
  intervalMinutes: number;
  enabled: boolean;
  profileId?: string;
  profileName?: string;
  runOnStartup?: boolean;
  lastRunAt?: number;
  isRunning: boolean;
  nextRunAt?: number;
}

export interface LoopsResponse {
  loops: Loop[];
}
