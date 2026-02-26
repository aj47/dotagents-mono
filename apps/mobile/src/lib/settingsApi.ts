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
  Memory,
  MemoriesResponse,
  AgentProfileCreateRequest,
  AgentProfileUpdateRequest,
  Loop,
  LoopsResponse,
} from '@dotagents/shared';

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
  Memory,
  MemoriesResponse,
  ApiAgentProfile,
  ApiAgentProfileFull,
  ApiAgentProfilesResponse,
  AgentProfileCreateRequest,
  AgentProfileUpdateRequest,
  Loop,
  LoopsResponse,
} from '@dotagents/shared';

// Mobile-only type: ModelPreset with slightly different shape than shared
// Keep this local for now as the shared Settings.availablePresets uses a different shape
export interface ModelPreset {
  id: string;
  name: string;
  baseUrl: string;
  isBuiltIn: boolean;
}

export class SettingsApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = apiKey;
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.authHeaders(),
        ...options.headers,
      },
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
  async getModels(providerId: 'openai' | 'groq' | 'gemini'): Promise<ModelsResponse> {
    return this.request<ModelsResponse>(`/models/${providerId}`);
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
    return this.request<SkillsResponse>('/v1/skills');
  }

  async toggleSkillForProfile(skillId: string): Promise<{ success: boolean; skillId: string; enabledForProfile: boolean }> {
    return this.request(`/v1/skills/${encodeURIComponent(skillId)}/toggle-profile`, {
      method: 'POST',
    });
  }

  // ============================================
  // Memories Management
  // ============================================

  async getMemories(profileId?: string): Promise<MemoriesResponse> {
    const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
    return this.request<MemoriesResponse>(`/v1/memories${query}`);
  }

  async deleteMemory(id: string): Promise<{ success: boolean; id: string }> {
    return this.request(`/v1/memories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Agent Profiles Management
  // ============================================

  async getAgentProfiles(): Promise<ApiAgentProfilesResponse> {
    return this.request<ApiAgentProfilesResponse>('/v1/agent-profiles');
  }

  async getAgentProfile(id: string): Promise<{ profile: ApiAgentProfileFull }> {
    return this.request<{ profile: ApiAgentProfileFull }>(`/v1/agent-profiles/${encodeURIComponent(id)}`);
  }

  async createAgentProfile(data: AgentProfileCreateRequest): Promise<{ profile: ApiAgentProfileFull }> {
    return this.request<{ profile: ApiAgentProfileFull }>('/v1/agent-profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgentProfile(id: string, data: AgentProfileUpdateRequest): Promise<{ success: boolean; profile: ApiAgentProfileFull }> {
    return this.request<{ success: boolean; profile: ApiAgentProfileFull }>(`/v1/agent-profiles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAgentProfile(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/v1/agent-profiles/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async toggleAgentProfile(id: string): Promise<{ success: boolean; id: string; enabled: boolean }> {
    return this.request(`/v1/agent-profiles/${encodeURIComponent(id)}/toggle`, {
      method: 'POST',
    });
  }

  // ============================================
  // Agent Loops Management
  // ============================================

  async getLoops(): Promise<LoopsResponse> {
    return this.request<LoopsResponse>('/v1/loops');
  }

  async toggleLoop(id: string): Promise<{ success: boolean; id: string; enabled: boolean }> {
    return this.request(`/v1/loops/${encodeURIComponent(id)}/toggle`, {
      method: 'POST',
    });
  }

  async runLoop(id: string): Promise<{ success: boolean; id: string }> {
    return this.request(`/v1/loops/${encodeURIComponent(id)}/run`, {
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
