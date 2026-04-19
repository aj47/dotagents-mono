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
  Settings,
  SettingsUpdate,
  ServerConversationMessage,
  ServerConversation,
  ServerConversationFull,
  CreateConversationRequest,
  UpdateConversationRequest,
  PushTokenRegistration,
  PushStatusResponse,
  Skill,
  SkillsResponse,
  AgentProfileCreateRequest,
  AgentProfileUpdateRequest,
  Loop,
  LoopsResponse,
  LoopSchedule,
  OperatorRemoteServerStatus,
  OperatorTunnelStatus,
  OperatorHealthCheck,
  OperatorHealthSnapshot,
  OperatorRecentError,
  OperatorRecentErrorsResponse,
  OperatorLogSummary,
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
  OperatorLogsResponse,
  OperatorMCPStatusResponse,
  OperatorMCPServerSummary,
  OperatorActionResponse,
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

// Import types needed for the class implementation
import type {
  Profile,
  ProfilesResponse,
  MCPServer,
  MCPServersResponse,
  ModelInfo,
  ModelsResponse,
  Settings,
  SettingsUpdate,
  ServerConversation,
  ServerConversationFull,
  CreateConversationRequest,
  UpdateConversationRequest,
  PushTokenRegistration,
  PushStatusResponse,
  Skill,
  SkillsResponse,
  ApiAgentProfile,
  ApiAgentProfileFull,
  ApiAgentProfilesResponse,
  AgentProfileCreateRequest,
  AgentProfileUpdateRequest,
  Loop,
  LoopSchedule,
  LoopsResponse,
  OperatorRemoteServerStatus,
  OperatorTunnelStatus,
  OperatorHealthSnapshot,
  OperatorRecentErrorsResponse,
  OperatorDiscordIntegrationSummary,
  OperatorWhatsAppIntegrationSummary,
  OperatorIntegrationsSummary,
  OperatorUpdaterStatus,
  OperatorRuntimeStatus,
  OperatorActionResponse,
  OperatorAuditResponse,
  OperatorApiKeyRotationResponse,
  OperatorConversationsResponse,
  OperatorLogsResponse,
  OperatorMCPStatusResponse,
} from '@dotagents/shared';

// ModelPreset — re-exported from shared package (single source of truth)
export type { ModelPreset } from '@dotagents/shared';

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

export type KnowledgeNoteContext = 'auto' | 'search-only';

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
  runContinuously?: boolean;
  schedule?: LoopSchedule | null;
}

export interface LoopUpdateRequest {
  name?: string;
  prompt?: string;
  intervalMinutes?: number;
  enabled?: boolean;
  profileId?: string;
  runContinuously?: boolean;
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

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${this.apiKey}`);

    const deviceId = await getStableDeviceId();
    if (deviceId) {
      headers.set(DEVICE_ID_HEADER, deviceId);
    }

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

  async getOperatorLogs(count: number = 20, level?: 'error' | 'warning' | 'info'): Promise<OperatorLogsResponse> {
    const params = new URLSearchParams({ count: String(count) });
    if (level) params.set('level', level);
    return this.request<OperatorLogsResponse>(`/operator/logs?${params.toString()}`);
  }

  async getOperatorAudit(count: number = 20): Promise<OperatorAuditResponse> {
    const query = `?count=${encodeURIComponent(String(count))}`;
    return this.request<OperatorAuditResponse>(`/operator/audit${query}`);
  }

  async getOperatorMCP(): Promise<OperatorMCPStatusResponse> {
    return this.request<OperatorMCPStatusResponse>('/operator/mcp');
  }

  async restartMCPServer(server: string): Promise<{ success: boolean; error?: string }> {
    return this.request<{ success: boolean; error?: string }>('/operator/actions/mcp-restart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server }),
    });
  }

  async getOperatorConversations(count: number = 10): Promise<OperatorConversationsResponse> {
    const query = `?count=${encodeURIComponent(String(count))}`;
    return this.request<OperatorConversationsResponse>(`/operator/conversations${query}`);
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

  async toggleSkillForProfile(skillId: string): Promise<{ success: boolean; skillId: string; enabledForProfile: boolean }> {
    return this.request(`/skills/${encodeURIComponent(skillId)}/toggle-profile`, {
      method: 'POST',
    });
  }

  // ============================================
  // Knowledge Notes Management
  // ============================================

  async getKnowledgeNotes(): Promise<KnowledgeNotesResponse> {
    return this.request<KnowledgeNotesResponse>('/knowledge/notes');
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

  // ============================================
  // Agent Profiles Management
  // ============================================

  async getAgentProfiles(): Promise<ApiAgentProfilesResponse> {
    return this.request<ApiAgentProfilesResponse>('/agent-profiles');
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

  async runLoop(id: string): Promise<{ success: boolean; id: string }> {
    return this.request(`/loops/${encodeURIComponent(id)}/run`, {
      method: 'POST',
    });
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
