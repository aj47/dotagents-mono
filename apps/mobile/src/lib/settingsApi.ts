/**
 * Settings API client for communicating with the desktop app's remote server.
 * Provides methods for managing profiles, MCP servers, and settings.
 *
 * Type definitions are imported from @dotagents/shared to avoid duplication.
 * Only the client classes (SettingsApiClient, ExtendedSettingsApiClient) are defined here.
 */

// Re-export all API types from shared package
export type {
  Profile,
  ProfilesResponse,
  MCPServer,
  MCPServersResponse,
  ModelInfo,
  ModelsResponse,
  ModelPreset,
  ModelPresetCreateRequest,
  ModelPresetMutationResponse,
  ModelPresetSummary,
  ModelPresetsResponse,
  ModelPresetUpdateRequest,
  OpenAiReasoningEffort,
  CodexTextVerbosity,
  CodexServiceTier,
  Settings,
  SettingsUpdate,
  ServerConversationMessage,
  ServerConversation,
  ServerConversationFull,
  CreateConversationRequest,
  UpdateConversationRequest,
  BranchConversationRequest,
  ToolApprovalResponse,
  PushTokenRegistration,
  PushStatusResponse,
  Skill,
  SkillCreateRequest,
  SkillResponse,
  SkillsResponse,
  SkillUpdateRequest,
  AgentProfileCreateRequest,
  AgentProfileUpdateRequest,
  VerifyExternalAgentCommandRequest,
  VerifyExternalAgentCommandResponse,
  AgentSessionCandidate,
  AgentSessionCandidatesResponse,
  Loop,
  LoopsResponse,
  LoopSchedule,
  OperatorRemoteServerStatus,
  OperatorTunnelStatus,
  OperatorHealthCheck,
  OperatorHealthSnapshot,
  OperatorRecentError,
  OperatorRecentErrorsResponse,
  OperatorDiagnosticReport,
  OperatorDiagnosticReportSaveResponse,
  OperatorLogSummary,
  OperatorLogsResponse,
  OperatorMessageQueuesResponse,
  OperatorMessageQueueSummary,
  OperatorDiscordIntegrationSummary,
  OperatorWhatsAppIntegrationSummary,
  OperatorPushNotificationsSummary,
  OperatorIntegrationsSummary,
  OperatorUpdaterStatus,
  OperatorRuntimeStatus,
  OperatorSystemMetrics,
  OperatorSessionsSummary,
  OperatorConversationItem,
  OperatorConversationsResponse,
  OperatorMCPStatusResponse,
  OperatorMCPServerSummary,
  OperatorActionResponse,
  OperatorRunAgentRequest,
  OperatorRunAgentResponse,
  OperatorAuditEntry,
  OperatorAuditResponse,
  OperatorApiKeyRotationResponse,
} from '@dotagents/shared';
import { normalizeApiBaseUrl } from '@dotagents/shared';
import { getDeviceIdentity } from './deviceIdentity';

// Re-export agent profile types with backward-compatible names
// The shared package uses Api* prefix to avoid conflicts with desktop's AgentProfile
export type {
  ApiAgentProfile as AgentProfile,
  ApiAgentProfileFull as AgentProfileFull,
  ApiAgentProfilesResponse as AgentProfilesResponse,
} from '@dotagents/shared';

export interface AgentProfilesReloadResponse {
  success: boolean;
  profiles: ApiAgentProfile[];
}

// Import types needed for the class implementation
import type {
  Profile,
  ProfilesResponse,
  MCPServer,
  MCPServersResponse,
  ModelInfo,
  ModelsResponse,
  ModelPresetCreateRequest as SharedModelPresetCreateRequest,
  ModelPresetMutationResponse as SharedModelPresetMutationResponse,
  ModelPresetsResponse as SharedModelPresetsResponse,
  ModelPresetUpdateRequest as SharedModelPresetUpdateRequest,
  OpenAiReasoningEffort,
  CodexTextVerbosity,
  CodexServiceTier,
  Settings,
  SettingsUpdate,
  ServerConversation,
  ServerConversationFull,
  CreateConversationRequest,
  UpdateConversationRequest,
  BranchConversationRequest,
  ToolApprovalResponse,
  PushTokenRegistration,
  PushStatusResponse,
  Skill,
  SkillCreateRequest,
  SkillResponse,
  SkillsResponse,
  SkillUpdateRequest,
  ApiAgentProfile,
  ApiAgentProfileFull,
  ApiAgentProfilesResponse,
  AgentProfileCreateRequest,
  AgentProfileUpdateRequest,
  VerifyExternalAgentCommandRequest,
  VerifyExternalAgentCommandResponse,
  AgentSessionCandidate,
  AgentSessionCandidatesResponse,
  Loop,
  LoopSchedule,
  LoopsResponse,
  OperatorRemoteServerStatus,
  OperatorTunnelStatus,
  OperatorHealthSnapshot,
  OperatorRecentErrorsResponse,
  OperatorDiagnosticReport,
  OperatorDiagnosticReportSaveResponse,
  OperatorLogsResponse,
  OperatorMessageQueuesResponse,
  OperatorMessageQueueSummary,
  OperatorDiscordIntegrationSummary,
  OperatorWhatsAppIntegrationSummary,
  OperatorIntegrationsSummary,
  OperatorUpdaterStatus,
  OperatorRuntimeStatus,
  OperatorActionResponse,
  OperatorRunAgentRequest,
  OperatorRunAgentResponse,
  OperatorAuditResponse,
  OperatorApiKeyRotationResponse,
  OperatorConversationsResponse,
  OperatorMCPStatusResponse,
} from '@dotagents/shared';

const DEVICE_ID_HEADER = 'x-dotagents-device-id';

let stableDeviceIdPromise: Promise<string | undefined> | null = null;

async function getStableDeviceId(): Promise<string | undefined> {
  if (!stableDeviceIdPromise) {
    stableDeviceIdPromise = getDeviceIdentity()
      .then((identity) => identity.deviceId)
      .catch((error) => {
        stableDeviceIdPromise = null;
        console.warn('[SettingsApiClient] Failed to load stable device identity:', error);
        return undefined;
      });
  }

  return stableDeviceIdPromise;
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

export interface OperatorMCPServerLogEntry {
  timestamp: number;
  message: string;
}

export interface OperatorMCPServerLogsResponse {
  server: string;
  count: number;
  logs: OperatorMCPServerLogEntry[];
}

export interface OperatorMCPToolToggleResponse extends OperatorActionResponse {
  tool?: OperatorMCPToolSummary;
}

export interface OperatorMCPServerTestResponse extends OperatorActionResponse {
  server?: string;
  toolCount?: number;
}

export type MCPTransportType = 'stdio' | 'websocket' | 'streamableHttp';

export interface OAuthConfig {
  scope?: string;
  clientId?: string;
  useDiscovery?: boolean;
  useDynamicRegistration?: boolean;
}

export interface MCPServerConfig {
  transport?: MCPTransportType;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  oauth?: OAuthConfig | null;
  timeout?: number;
  disabled?: boolean;
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export interface MCPServerConfigResponse {
  name: string;
  config: MCPServerConfig;
  server: MCPServer;
}

export interface MCPServerConfigImportResponse {
  success: true;
  importedCount: number;
  skippedReservedServerNames: string[];
}

export interface MCPServerConfigExportResponse {
  success: true;
  config: MCPConfig;
}

export interface McpOAuthStatusResponse {
  configured: boolean;
  authenticated: boolean;
  tokenExpiry?: number;
  error?: string;
}

export interface McpOAuthStartResponse {
  authorizationUrl: string;
  state: string;
}

export interface McpOAuthRevokeResponse {
  success: boolean;
  error?: string;
}

export interface ChatGptWebAuthStatus {
  authenticated: boolean;
  accountId?: string;
  email?: string;
  planType?: string;
  connectedAt?: number;
  expiresAt?: number;
  callbackUrl: string;
}

export interface ChatGptWebAuthActionResponse {
  success: boolean;
  status: ChatGptWebAuthStatus;
  message: string;
  error?: string;
}

export interface SkillImportGitHubResponse {
  imported: Skill[];
  errors: string[];
}

export interface SkillExportMarkdownResponse {
  markdown: string;
}

export interface SkillDeleteMultipleResponse {
  deletedCount: number;
  results: Array<{ id: string; success: boolean; error?: string }>;
}

export type BundleComponentKey = 'agentProfiles' | 'mcpServers' | 'skills' | 'repeatTasks' | 'knowledgeNotes';
export type BundleComponentSelection = Partial<Record<BundleComponentKey, boolean>>;
export type BundleImportConflictStrategy = 'skip' | 'overwrite' | 'rename';

export interface DotAgentsBundle {
  manifest: {
    version: 1;
    name: string;
    description?: string;
    createdAt: string;
    exportedFrom: string;
    components: Record<BundleComponentKey, number>;
  };
  agentProfiles: Array<Record<string, unknown>>;
  mcpServers: Array<Record<string, unknown>>;
  skills: Array<Record<string, unknown>>;
  repeatTasks: Array<Record<string, unknown>>;
  knowledgeNotes: Array<Record<string, unknown>>;
}

export interface BundleImportConflict {
  id: string;
  name: string;
  existingName?: string;
}

export interface BundleImportPreview {
  bundle: DotAgentsBundle;
  conflicts: Record<BundleComponentKey, BundleImportConflict[]>;
}

export interface BundleImportItemResult {
  id: string;
  name: string;
  action: 'imported' | 'skipped' | 'renamed' | 'overwritten';
  newId?: string;
  error?: string;
}

export interface BundleExportResponse {
  success: true;
  bundle: DotAgentsBundle;
  bundleJson: string;
}

export interface BundleImportPreviewResponse {
  success: true;
  preview: BundleImportPreview;
}

export interface BundleImportResponse {
  success: boolean;
  agentProfiles: BundleImportItemResult[];
  mcpServers: BundleImportItemResult[];
  skills: BundleImportItemResult[];
  repeatTasks: BundleImportItemResult[];
  knowledgeNotes: BundleImportItemResult[];
  errors: string[];
}

export interface LoopImportMarkdownRequest {
  content: string;
}

export interface LoopExportMarkdownResponse {
  success: true;
  loopId: string;
  markdown: string;
}

export type KnowledgeNoteContext = 'auto' | 'search-only';
export type KnowledgeNoteDateFilter = 'all' | '7d' | '30d' | '90d' | 'year';
export type KnowledgeNoteSort = 'relevance' | 'updated-desc' | 'updated-asc' | 'created-desc' | 'created-asc' | 'title-asc' | 'title-desc';

export interface KnowledgeNote {
  id: string;
  title: string;
  body: string;
  context: KnowledgeNoteContext;
  summary?: string;
  tags: string[];
  references?: string[];
  createdAt?: number;
  updatedAt: number;
}

export interface KnowledgeNotesResponse {
  notes: KnowledgeNote[];
}

export interface KnowledgeNotesQuery {
  query?: string;
  context?: KnowledgeNoteContext;
  dateFilter?: KnowledgeNoteDateFilter;
  sort?: KnowledgeNoteSort;
  limit?: number;
}

export interface KnowledgeNotesDeleteMultipleResponse {
  deletedCount: number;
}

export interface KnowledgeNoteResponse {
  note: KnowledgeNote;
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

export interface LoopCreateRequest {
  name: string;
  prompt: string;
  intervalMinutes: number;
  enabled: boolean;
  profileId?: string;
  runOnStartup?: boolean;
  pushNotificationsMuted?: boolean;
  speakOnTrigger?: boolean;
  continueInSession?: boolean;
  lastSessionId?: string;
  runContinuously?: boolean;
  critiquePass?: boolean;
  criticProfileId?: string;
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
  pushNotificationsMuted?: boolean;
  speakOnTrigger?: boolean;
  continueInSession?: boolean;
  lastSessionId?: string | null;
  runContinuously?: boolean;
  critiquePass?: boolean;
  criticProfileId?: string | null;
  maxIterations?: number | null;
  schedule?: LoopSchedule | null;
}

export interface EmergencyStopResponse {
  success: boolean;
  message?: string;
  error?: string;
  processesKilled?: number;
  processesRemaining?: number;
}

export class SettingsApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = normalizeApiBaseUrl(baseUrl);
    this.apiKey = apiKey;
  }

  async buildRequestHeaders(headersInit?: HeadersInit): Promise<Headers> {
    const headers = new Headers(headersInit);
    headers.set('Authorization', `Bearer ${this.apiKey}`);

    const deviceId = await getStableDeviceId();
    if (deviceId) {
      headers.set(DEVICE_ID_HEADER, deviceId);
    }

    return headers;
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.buildRequestHeaders(options.headers);

    // Only send a JSON content type when a request body exists. Fastify treats
    // an empty JSON body as a 400 for methods like DELETE/POST when the header is present.
    if (options.body !== undefined && options.body !== null && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  async getConversationImageAssetResponse(conversationId: string, fileName: string): Promise<Response> {
    return fetch(
      `${this.baseUrl}/conversations/${encodeURIComponent(conversationId)}/assets/images/${encodeURIComponent(fileName)}`,
      { headers: await this.buildRequestHeaders() },
    );
  }

  async getConversationVideoAssetResponse(conversationId: string, fileName: string): Promise<Response> {
    return fetch(
      `${this.baseUrl}/conversations/${encodeURIComponent(conversationId)}/assets/videos/${encodeURIComponent(fileName)}`,
      { headers: await this.buildRequestHeaders() },
    );
  }

  getChatCompletionsUrl(): string {
    return `${this.baseUrl}/chat/completions`;
  }

  async getOpenAICompatibleModels(): Promise<ModelsResponse> {
    return this.request<ModelsResponse>('/models');
  }

  // Profile Management
  async getProfiles(): Promise<ProfilesResponse> {
    return this.request<ProfilesResponse>('/profiles');
  }

  async getCurrentProfile(): Promise<Profile> {
    return this.request<Profile>('/profiles/current');
  }

  async setCurrentProfile(profileId: string): Promise<{ success: boolean; profile: Profile }> {
    return this.request('/profiles/current', {
      method: 'POST',
      body: JSON.stringify({ profileId }),
    });
  }

  async exportProfile(profileId: string): Promise<{ profileJson: string }> {
    return this.request<{ profileJson: string }>(`/profiles/${encodeURIComponent(profileId)}/export`);
  }

  async importProfile(profileJson: string): Promise<{ success: boolean; profile: Profile }> {
    return this.request('/profiles/import', {
      method: 'POST',
      body: JSON.stringify({ profileJson }),
    });
  }

  // MCP Server Management
  async getMCPServers(): Promise<MCPServersResponse> {
    return this.request<MCPServersResponse>('/mcp/servers');
  }

  async toggleMCPServer(serverName: string, enabled: boolean): Promise<{ success: boolean; server: string; enabled: boolean }> {
    return this.request(`/mcp/servers/${encodeURIComponent(serverName)}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  async getMCPServerConfig(serverName: string): Promise<MCPServerConfigResponse> {
    return this.request<MCPServerConfigResponse>(`/mcp/servers/${encodeURIComponent(serverName)}/config`);
  }

  async upsertMCPServerConfig(serverName: string, config: MCPServerConfig): Promise<MCPServerConfigResponse> {
    return this.request<MCPServerConfigResponse>(`/mcp/servers/${encodeURIComponent(serverName)}/config`, {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }

  async deleteMCPServerConfig(serverName: string): Promise<{ success: boolean; server: string }> {
    return this.request<{ success: boolean; server: string }>(`/mcp/servers/${encodeURIComponent(serverName)}`, {
      method: 'DELETE',
    });
  }

  async importMCPServerConfigs(config: MCPConfig): Promise<MCPServerConfigImportResponse> {
    return this.request<MCPServerConfigImportResponse>('/mcp/config/import', {
      method: 'POST',
      body: JSON.stringify({ config }),
    });
  }

  async exportMCPServerConfigs(): Promise<MCPServerConfigExportResponse> {
    return this.request<MCPServerConfigExportResponse>('/mcp/config/export');
  }

  async getMcpOAuthStatus(serverName: string): Promise<McpOAuthStatusResponse> {
    return this.request<McpOAuthStatusResponse>(`/mcp/servers/${encodeURIComponent(serverName)}/oauth`);
  }

  async initiateMcpOAuthFlow(serverName: string): Promise<McpOAuthStartResponse> {
    return this.request<McpOAuthStartResponse>(`/mcp/servers/${encodeURIComponent(serverName)}/oauth/start`, {
      method: 'POST',
    });
  }

  async revokeMcpOAuthTokens(serverName: string): Promise<McpOAuthRevokeResponse> {
    return this.request<McpOAuthRevokeResponse>(`/mcp/servers/${encodeURIComponent(serverName)}/oauth/revoke`, {
      method: 'POST',
    });
  }

  async getChatGptWebAuthStatus(): Promise<ChatGptWebAuthStatus> {
    return this.request<ChatGptWebAuthStatus>('/operator/providers/chatgpt-web/auth');
  }

  async loginChatGptWebOAuth(): Promise<ChatGptWebAuthActionResponse> {
    return this.request<ChatGptWebAuthActionResponse>('/operator/providers/chatgpt-web/auth/login', {
      method: 'POST',
    });
  }

  async logoutChatGptWebOAuth(): Promise<ChatGptWebAuthActionResponse> {
    return this.request<ChatGptWebAuthActionResponse>('/operator/providers/chatgpt-web/auth/logout', {
      method: 'POST',
    });
  }

  // Settings Management
  async getSettings(): Promise<Settings> {
    return this.request<Settings>('/settings');
  }

  async updateSettings(updates: SettingsUpdate): Promise<{ success: boolean; updated: string[] }> {
    return this.request('/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getModelPresets(): Promise<SharedModelPresetsResponse> {
    return this.request<SharedModelPresetsResponse>('/operator/model-presets');
  }

  async createModelPreset(preset: SharedModelPresetCreateRequest): Promise<SharedModelPresetMutationResponse> {
    return this.request<SharedModelPresetMutationResponse>('/operator/model-presets', {
      method: 'POST',
      body: JSON.stringify(preset),
    });
  }

  async updateModelPreset(presetId: string, updates: SharedModelPresetUpdateRequest): Promise<SharedModelPresetMutationResponse> {
    return this.request<SharedModelPresetMutationResponse>(`/operator/model-presets/${encodeURIComponent(presetId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteModelPreset(presetId: string): Promise<SharedModelPresetMutationResponse> {
    return this.request<SharedModelPresetMutationResponse>(`/operator/model-presets/${encodeURIComponent(presetId)}`, {
      method: 'DELETE',
    });
  }

  async respondToToolApproval(approvalId: string, approved: boolean): Promise<ToolApprovalResponse> {
    return this.request<ToolApprovalResponse>(`/agent-sessions/tool-approvals/${encodeURIComponent(approvalId)}/respond`, {
      method: 'POST',
      body: JSON.stringify({ approved }),
    });
  }

  // Models Management
  async getModels(providerId: 'openai' | 'groq' | 'gemini' | 'chatgpt-web'): Promise<ModelsResponse> {
    return this.request<ModelsResponse>(`/models/${providerId}`);
  }

  // Operator / Admin Management
  async getOperatorStatus(): Promise<OperatorRuntimeStatus> {
    return this.request<OperatorRuntimeStatus>('/operator/status');
  }

  async getOperatorHealth(): Promise<OperatorHealthSnapshot> {
    return this.request<OperatorHealthSnapshot>('/operator/health');
  }

  async getOperatorErrors(count: number = 10): Promise<OperatorRecentErrorsResponse> {
    const query = `?count=${encodeURIComponent(String(count))}`;
    return this.request<OperatorRecentErrorsResponse>(`/operator/errors${query}`);
  }

  async clearOperatorErrors(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/errors/clear', {
      method: 'POST',
    });
  }

  async getOperatorLogs(count: number = 20, level?: 'error' | 'warning' | 'info'): Promise<OperatorLogsResponse> {
    const params = new URLSearchParams({ count: String(count) });
    if (level) params.set('level', level);
    return this.request<OperatorLogsResponse>(`/operator/logs?${params.toString()}`);
  }

  async getOperatorDiagnosticReport(): Promise<OperatorDiagnosticReport> {
    return this.request<OperatorDiagnosticReport>('/operator/diagnostics/report');
  }

  async saveOperatorDiagnosticReport(filePath?: string): Promise<OperatorDiagnosticReportSaveResponse> {
    return this.request<OperatorDiagnosticReportSaveResponse>('/operator/diagnostics/report/save', {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    });
  }

  async getOperatorAudit(count: number = 20): Promise<OperatorAuditResponse> {
    const query = `?count=${encodeURIComponent(String(count))}`;
    return this.request<OperatorAuditResponse>(`/operator/audit${query}`);
  }

  async getOperatorMCP(): Promise<OperatorMCPStatusResponse> {
    return this.request<OperatorMCPStatusResponse>('/operator/mcp');
  }

  async getOperatorMCPTools(server?: string): Promise<OperatorMCPToolsResponse> {
    const query = server ? `?server=${encodeURIComponent(server)}` : '';
    return this.request<OperatorMCPToolsResponse>(`/operator/mcp/tools${query}`);
  }

  async setOperatorMCPToolEnabled(toolName: string, enabled: boolean): Promise<OperatorMCPToolToggleResponse> {
    return this.request<OperatorMCPToolToggleResponse>('/operator/mcp/tools/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName, enabled }),
    });
  }

  async getOperatorMCPServerLogs(server: string, count: number = 20): Promise<OperatorMCPServerLogsResponse> {
    const query = `?count=${encodeURIComponent(String(count))}`;
    return this.request<OperatorMCPServerLogsResponse>(`/operator/mcp/${encodeURIComponent(server)}/logs${query}`);
  }

  async clearOperatorMCPServerLogs(server: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(`/operator/mcp/${encodeURIComponent(server)}/logs/clear`, {
      method: 'POST',
    });
  }

  async startMCPServer(server: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/actions/mcp-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server }),
    });
  }

  async stopMCPServer(server: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/actions/mcp-stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server }),
    });
  }

  async testOperatorMCPServer(server: string): Promise<OperatorMCPServerTestResponse> {
    return this.request<OperatorMCPServerTestResponse>('/operator/actions/mcp-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server }),
    });
  }

  async restartMCPServer(server: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/actions/mcp-restart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server }),
    });
  }

  async getOperatorConversations(count: number = 10): Promise<OperatorConversationsResponse> {
    const query = `?count=${encodeURIComponent(String(count))}`;
    return this.request<OperatorConversationsResponse>(`/operator/conversations${query}`);
  }

  async getOperatorMessageQueues(): Promise<OperatorMessageQueuesResponse> {
    return this.request<OperatorMessageQueuesResponse>('/operator/message-queues');
  }

  async pauseOperatorMessageQueue(conversationId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(`/operator/message-queues/${encodeURIComponent(conversationId)}/pause`, {
      method: 'POST',
    });
  }

  async resumeOperatorMessageQueue(conversationId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(`/operator/message-queues/${encodeURIComponent(conversationId)}/resume`, {
      method: 'POST',
    });
  }

  async clearOperatorMessageQueue(conversationId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(`/operator/message-queues/${encodeURIComponent(conversationId)}/clear`, {
      method: 'POST',
    });
  }

  async removeOperatorQueuedMessage(conversationId: string, messageId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(
      `/operator/message-queues/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
      { method: 'DELETE' },
    );
  }

  async retryOperatorQueuedMessage(conversationId: string, messageId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(
      `/operator/message-queues/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/retry`,
      { method: 'POST' },
    );
  }

  async updateOperatorQueuedMessageText(conversationId: string, messageId: string, text: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(
      `/operator/message-queues/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ text }),
      },
    );
  }

  async getOperatorRemoteServer(): Promise<OperatorRemoteServerStatus> {
    return this.request<OperatorRemoteServerStatus>('/operator/remote-server');
  }

  async getOperatorTunnel(): Promise<OperatorTunnelStatus> {
    return this.request<OperatorTunnelStatus>('/operator/tunnel');
  }

  async getOperatorTunnelSetup(): Promise<OperatorTunnelSetupSummary> {
    return this.request<OperatorTunnelSetupSummary>('/operator/tunnel/setup');
  }

  async startOperatorTunnel(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/tunnel/start', {
      method: 'POST',
    });
  }

  async stopOperatorTunnel(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/tunnel/stop', {
      method: 'POST',
    });
  }

  async getOperatorIntegrations(): Promise<OperatorIntegrationsSummary> {
    return this.request<OperatorIntegrationsSummary>('/operator/integrations');
  }

  async getOperatorUpdater(): Promise<OperatorUpdaterStatus> {
    return this.request<OperatorUpdaterStatus>('/operator/updater');
  }

  async checkOperatorUpdater(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/updater/check', {
      method: 'POST',
    });
  }

  async downloadOperatorUpdateAsset(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/updater/download-latest', {
      method: 'POST',
    });
  }

  async revealOperatorUpdateAsset(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/updater/reveal-download', {
      method: 'POST',
    });
  }

  async openOperatorUpdateAsset(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/updater/open-download', {
      method: 'POST',
    });
  }

  async openOperatorReleasesPage(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/updater/open-releases', {
      method: 'POST',
    });
  }

  async getOperatorDiscord(): Promise<OperatorDiscordIntegrationSummary> {
    return this.request<OperatorDiscordIntegrationSummary>('/operator/discord');
  }

  async getOperatorDiscordLogs(count: number = 20): Promise<OperatorDiscordLogsResponse> {
    const query = `?count=${encodeURIComponent(String(count))}`;
    return this.request<OperatorDiscordLogsResponse>(`/operator/discord/logs${query}`);
  }

  async connectOperatorDiscord(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/discord/connect', {
      method: 'POST',
    });
  }

  async disconnectOperatorDiscord(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/discord/disconnect', {
      method: 'POST',
    });
  }

  async clearOperatorDiscordLogs(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/discord/logs/clear', {
      method: 'POST',
    });
  }

  async getOperatorWhatsApp(): Promise<OperatorWhatsAppIntegrationSummary> {
    return this.request<OperatorWhatsAppIntegrationSummary>('/operator/whatsapp');
  }

  async connectOperatorWhatsApp(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/whatsapp/connect', {
      method: 'POST',
    });
  }

  async logoutOperatorWhatsApp(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/whatsapp/logout', {
      method: 'POST',
    });
  }

  async emergencyStop(): Promise<EmergencyStopResponse> {
    return this.request<EmergencyStopResponse>('/emergency-stop', {
      method: 'POST',
    });
  }

  async restartRemoteServer(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/actions/restart-remote-server', {
      method: 'POST',
    });
  }

  async restartApp(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/actions/restart-app', {
      method: 'POST',
    });
  }

  async runOperatorAgent(request: OperatorRunAgentRequest): Promise<OperatorRunAgentResponse> {
    return this.request<OperatorRunAgentResponse>('/operator/actions/run-agent', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async stopOperatorTtsPlayback(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/actions/stop-tts', {
      method: 'POST',
    });
  }

  async showOperatorMainWindow(route?: '/' | '/settings' | '/settings/models' | '/sessions' | '/plugins'): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/windows/main/show', {
      method: 'POST',
      body: JSON.stringify({ route }),
    });
  }

  async showOperatorPanelWindow(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/windows/panel/show', {
      method: 'POST',
    });
  }

  async hideOperatorPanelWindow(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/windows/panel/hide', {
      method: 'POST',
    });
  }

  async resetOperatorPanelWindow(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/windows/panel/reset', {
      method: 'POST',
    });
  }

  async showOperatorAgentSession(sessionId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(`/operator/sessions/${encodeURIComponent(sessionId)}/show`, {
      method: 'POST',
    });
  }

  async snoozeOperatorAgentSession(sessionId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(`/operator/sessions/${encodeURIComponent(sessionId)}/snooze`, {
      method: 'POST',
    });
  }

  async unsnoozeOperatorAgentSession(sessionId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(`/operator/sessions/${encodeURIComponent(sessionId)}/unsnooze`, {
      method: 'POST',
    });
  }

  async stopOperatorAgentSession(sessionId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(`/operator/sessions/${encodeURIComponent(sessionId)}/stop`, {
      method: 'POST',
    });
  }

  async clearOperatorAgentSession(sessionId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(`/operator/sessions/${encodeURIComponent(sessionId)}/clear`, {
      method: 'POST',
    });
  }

  async clearInactiveOperatorAgentSessions(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/sessions/clear-inactive', {
      method: 'POST',
    });
  }

  async snoozeOperatorAgentSessionsAndHidePanel(sessionIds?: string[]): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>('/operator/sessions/snooze-and-hide-panel', {
      method: 'POST',
      body: JSON.stringify({ sessionIds }),
    });
  }

  async rotateOperatorApiKey(): Promise<OperatorApiKeyRotationResponse> {
    return this.request<OperatorApiKeyRotationResponse>('/operator/access/rotate-api-key', {
      method: 'POST',
    });
  }

  // Conversation Sync Management
  async getConversations(): Promise<{ conversations: ServerConversation[] }> {
    return this.request<{ conversations: ServerConversation[] }>('/conversations');
  }

  async getConversation(id: string): Promise<ServerConversationFull> {
    return this.request<ServerConversationFull>(`/conversations/${encodeURIComponent(id)}`);
  }

  async createConversation(data: CreateConversationRequest): Promise<ServerConversationFull> {
    return this.request<ServerConversationFull>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConversation(id: string, data: UpdateConversationRequest): Promise<ServerConversationFull> {
    return this.request<ServerConversationFull>(`/conversations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async branchConversation(id: string, data: BranchConversationRequest): Promise<ServerConversationFull> {
    return this.request<ServerConversationFull>(`/conversations/${encodeURIComponent(id)}/branch`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteConversation(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/conversations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async deleteAllConversations(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/conversations', {
      method: 'DELETE',
    });
  }
}

// Extended client with push notification methods
export class ExtendedSettingsApiClient extends SettingsApiClient {
  // Register push notification token
  async registerPushToken(registration: PushTokenRegistration): Promise<{ success: boolean; message: string; tokenCount: number }> {
    return this.request('/push/register', {
      method: 'POST',
      body: JSON.stringify(registration),
    });
  }

  // Unregister push notification token
  async unregisterPushToken(token: string): Promise<{ success: boolean; message: string; tokenCount: number }> {
    return this.request('/push/unregister', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Get push notification status
  async getPushStatus(): Promise<PushStatusResponse> {
    return this.request<PushStatusResponse>('/push/status');
  }

  // ============================================
  // Skills Management
  // ============================================

  async getSkills(): Promise<SkillsResponse> {
    return this.request<SkillsResponse>('/skills');
  }

  async getSkill(id: string): Promise<SkillResponse> {
    return this.request<SkillResponse>(`/skills/${encodeURIComponent(id)}`);
  }

  async createSkill(data: SkillCreateRequest): Promise<SkillResponse> {
    return this.request<SkillResponse>('/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSkill(id: string, data: SkillUpdateRequest): Promise<{ success: boolean; skill: Skill }> {
    return this.request<{ success: boolean; skill: Skill }>(`/skills/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async toggleSkillForProfile(skillId: string): Promise<{ success: boolean; skillId: string; enabledForProfile: boolean }> {
    return this.request(`/skills/${encodeURIComponent(skillId)}/toggle-profile`, {
      method: 'POST',
    });
  }

  async importSkillFromMarkdown(content: string): Promise<SkillResponse> {
    return this.request<SkillResponse>('/skills/import/markdown', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async importSkillFromGitHub(repoIdentifier: string): Promise<SkillImportGitHubResponse> {
    return this.request<SkillImportGitHubResponse>('/skills/import/github', {
      method: 'POST',
      body: JSON.stringify({ repoIdentifier }),
    });
  }

  async exportSkillToMarkdown(skillId: string): Promise<SkillExportMarkdownResponse> {
    return this.request<SkillExportMarkdownResponse>(`/skills/${encodeURIComponent(skillId)}/export/markdown`);
  }

  async deleteSkills(ids: string[]): Promise<SkillDeleteMultipleResponse> {
    return this.request<SkillDeleteMultipleResponse>('/skills/delete-multiple', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // ============================================
  // Bundle Management
  // ============================================

  async exportBundle(request: { name?: string; components?: BundleComponentSelection } = {}): Promise<BundleExportResponse> {
    return this.request<BundleExportResponse>('/bundles/export', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async previewBundleImport(request: { bundleJson: string }): Promise<BundleImportPreviewResponse> {
    return this.request<BundleImportPreviewResponse>('/bundles/import/preview', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async importBundle(request: {
    bundleJson: string;
    conflictStrategy: BundleImportConflictStrategy;
    components?: BundleComponentSelection;
  }): Promise<BundleImportResponse> {
    return this.request<BundleImportResponse>('/bundles/import', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // ============================================
  // Knowledge Notes Management
  // ============================================

  async getKnowledgeNotes(query?: KnowledgeNotesQuery): Promise<KnowledgeNotesResponse> {
    const params = new URLSearchParams();
    if (query?.context) params.set('context', query.context);
    if (query?.dateFilter) params.set('dateFilter', query.dateFilter);
    if (query?.sort) params.set('sort', query.sort);
    if (typeof query?.limit === 'number') params.set('limit', String(query.limit));
    const queryString = params.toString();
    return this.request<KnowledgeNotesResponse>(`/knowledge/notes${queryString ? `?${queryString}` : ''}`);
  }

  async searchKnowledgeNotes(query: KnowledgeNotesQuery): Promise<KnowledgeNotesResponse> {
    return this.request<KnowledgeNotesResponse>('/knowledge/notes/search', {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }

  async getKnowledgeNote(id: string): Promise<KnowledgeNoteResponse> {
    return this.request<KnowledgeNoteResponse>(`/knowledge/notes/${encodeURIComponent(id)}`);
  }

  async createKnowledgeNote(data: KnowledgeNoteCreateRequest): Promise<KnowledgeNoteResponse> {
    return this.request<KnowledgeNoteResponse>('/knowledge/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateKnowledgeNote(id: string, data: KnowledgeNoteUpdateRequest): Promise<{ success: boolean; note: KnowledgeNote }> {
    return this.request<{ success: boolean; note: KnowledgeNote }>(`/knowledge/notes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteKnowledgeNote(id: string): Promise<{ success: boolean; id: string }> {
    return this.request(`/knowledge/notes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async deleteKnowledgeNotes(ids: string[]): Promise<KnowledgeNotesDeleteMultipleResponse> {
    return this.request<KnowledgeNotesDeleteMultipleResponse>('/knowledge/notes/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async deleteAllKnowledgeNotes(): Promise<KnowledgeNotesDeleteMultipleResponse> {
    return this.request<KnowledgeNotesDeleteMultipleResponse>('/knowledge/notes/delete-all', {
      method: 'POST',
    });
  }

  // ============================================
  // Agent Profiles Management
  // ============================================

  async getAgentProfiles(): Promise<ApiAgentProfilesResponse> {
    return this.request<ApiAgentProfilesResponse>('/agent-profiles');
  }

  async reloadAgentProfiles(): Promise<AgentProfilesReloadResponse> {
    return this.request<AgentProfilesReloadResponse>('/agent-profiles/reload', {
      method: 'POST',
    });
  }

  async getAgentProfile(id: string): Promise<{ profile: ApiAgentProfileFull }> {
    return this.request<{ profile: ApiAgentProfileFull }>(`/agent-profiles/${encodeURIComponent(id)}`);
  }

  async createAgentProfile(data: AgentProfileCreateRequest): Promise<{ profile: ApiAgentProfileFull }> {
    return this.request<{ profile: ApiAgentProfileFull }>('/agent-profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgentProfile(id: string, data: AgentProfileUpdateRequest): Promise<{ success: boolean; profile: ApiAgentProfileFull }> {
    return this.request<{ success: boolean; profile: ApiAgentProfileFull }>(`/agent-profiles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async verifyExternalAgentCommand(data: VerifyExternalAgentCommandRequest): Promise<VerifyExternalAgentCommandResponse> {
    return this.request<VerifyExternalAgentCommandResponse>('/agent-profiles/verify-command', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAgentProfile(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/agent-profiles/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async toggleAgentProfile(id: string): Promise<{ success: boolean; id: string; enabled: boolean }> {
    return this.request(`/agent-profiles/${encodeURIComponent(id)}/toggle`, {
      method: 'POST',
    });
  }

  // ============================================
  // Agent Loops Management
  // ============================================

  async getLoops(): Promise<LoopsResponse> {
    return this.request<LoopsResponse>('/loops');
  }

  async getAgentSessionCandidates(limit?: number): Promise<AgentSessionCandidatesResponse> {
    const query = typeof limit === 'number' ? `?limit=${encodeURIComponent(String(limit))}` : '';
    return this.request<AgentSessionCandidatesResponse>(`/agent-sessions/candidates${query}`);
  }

  async createLoop(data: LoopCreateRequest): Promise<{ loop: Loop }> {
    return this.request<{ loop: Loop }>('/loops', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLoop(id: string, data: LoopUpdateRequest): Promise<{ success: boolean; loop: Loop }> {
    return this.request<{ success: boolean; loop: Loop }>(`/loops/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteLoop(id: string): Promise<{ success: boolean; id?: string }> {
    return this.request<{ success: boolean; id?: string }>(`/loops/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async toggleLoop(id: string): Promise<{ success: boolean; id: string; enabled: boolean }> {
    return this.request(`/loops/${encodeURIComponent(id)}/toggle`, {
      method: 'POST',
    });
  }

  async runLoop(id: string, options: { clientSessionId?: string } = {}): Promise<{ success: boolean; id: string; conversationId?: string; sessionId?: string }> {
    return this.request(`/loops/${encodeURIComponent(id)}/run`, {
      method: 'POST',
      body: JSON.stringify({
        clientSessionId: options.clientSessionId,
      }),
    });
  }

  async importLoopFromMarkdown(content: string): Promise<{ loop: Loop }> {
    return this.request<{ loop: Loop }>('/loops/import/markdown', {
      method: 'POST',
      body: JSON.stringify({ content } satisfies LoopImportMarkdownRequest),
    });
  }

  async exportLoopToMarkdown(id: string): Promise<LoopExportMarkdownResponse> {
    return this.request<LoopExportMarkdownResponse>(`/loops/${encodeURIComponent(id)}/export/markdown`);
  }
}

// Factory function to create a client from app config
export function createSettingsApiClient(baseUrl: string, apiKey: string): SettingsApiClient {
  return new SettingsApiClient(baseUrl, apiKey);
}

// Factory function to create an extended client with push notification support
export function createExtendedSettingsApiClient(baseUrl: string, apiKey: string): ExtendedSettingsApiClient {
  return new ExtendedSettingsApiClient(baseUrl, apiKey);
}
