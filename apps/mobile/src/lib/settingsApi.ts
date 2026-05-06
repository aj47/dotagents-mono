/**
 * Settings API client for communicating with the desktop app's remote server.
 *
 * The generic API client lives in @dotagents/shared. Mobile keeps this wrapper
 * to attach the stable device ID used by operator audit and allowlist checks.
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
  AgentSessionCandidate,
  AgentSessionCandidatesResponse,
  ServerConversationMessage,
  ServerConversation,
  ServerConversationFull,
  CreateConversationRequest,
  UpdateConversationRequest,
  PushTokenRegistration,
  PushStatusResponse,
  Skill,
  SkillCreateRequest,
  SkillDeleteResponse,
  SkillExportMarkdownResponse,
  SkillImportGitHubRequest,
  SkillImportGitHubResponse,
  SkillImportMarkdownRequest,
  SkillMutationResponse,
  SkillResponse,
  SkillToggleResponse,
  SkillsResponse,
  SkillUpdateRequest,
  KnowledgeNote,
  KnowledgeNoteContext,
  KnowledgeNoteDateFilter,
  KnowledgeNoteCreateRequest,
  KnowledgeNoteDeleteResponse,
  KnowledgeNoteMutationResponse,
  KnowledgeNoteResponse,
  KnowledgeNoteSearchRequest,
  KnowledgeNoteSort,
  KnowledgeNotesDeleteAllResponse,
  KnowledgeNotesDeleteMultipleRequest,
  KnowledgeNotesDeleteMultipleResponse,
  KnowledgeNotesResponse,
  KnowledgeNoteUpdateRequest,
  AgentProfileCreateRequest,
  AgentProfileDeleteResponse,
  AgentProfileToggleResponse,
  AgentProfileUpdateRequest,
  Loop,
  LoopCreateRequest,
  LoopDeleteResponse,
  LoopExportMarkdownResponse,
  LoopImportMarkdownRequest,
  LoopMutationResponse,
  LoopRuntimeActionResponse,
  LoopRuntimeStatus,
  LoopRunResponse,
  LoopStatusesResponse,
  LoopsResponse,
  LoopSchedule,
  LoopToggleResponse,
  LoopUpdateRequest,
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
  OperatorRunAgentRequest,
  OperatorRunAgentResponse,
  OperatorSystemMetrics,
  OperatorSessionsSummary,
  OperatorConversationItem,
  OperatorConversationsResponse,
  OperatorLogsResponse,
  OperatorMessageQueueSummary,
  OperatorMessageQueuesResponse,
  OperatorMCPServerLogEntry,
  OperatorMCPServerLogsResponse,
  OperatorMCPStatusResponse,
  OperatorMCPToolSummary,
  OperatorMCPToolsResponse,
  OperatorMCPToolToggleResponse,
  OperatorMCPServerSummary,
  OperatorTunnelSetupSummary,
  OperatorDiscordLogEntry,
  OperatorDiscordLogsResponse,
  OperatorActionResponse,
  OperatorAuditEntry,
  OperatorAuditResponse,
  OperatorApiKeyRotationResponse,
  EmergencyStopResponse,
  LocalSpeechModelProviderId,
  LocalSpeechModelStatus,
  LocalSpeechModelStatusesResponse,
  ModelPresetCreateRequest,
  ModelPresetMutationResponse,
  ModelPresetSummary,
  ModelPresetsResponse,
  ModelPresetUpdateRequest,
} from '@dotagents/shared/api-types';
export { DOTAGENTS_DEVICE_ID_HEADER } from '@dotagents/shared/settings-api-client';

// Re-export agent profile types with backward-compatible names.
// The shared package uses Api* prefix to avoid conflicts with desktop's AgentProfile.
export type {
  ApiAgentProfile as AgentProfile,
  ApiAgentProfileFull as AgentProfileFull,
  ApiAgentProfilesResponse as AgentProfilesResponse,
} from '@dotagents/shared/api-types';

// ModelPreset - re-exported from shared package (single source of truth)
export type { ModelPreset } from '@dotagents/shared/providers';

import {
  DOTAGENTS_DEVICE_ID_HEADER,
  ExtendedSettingsApiClient as SharedExtendedSettingsApiClient,
  SettingsApiClient as SharedSettingsApiClient,
  type SettingsApiClientOptions,
} from '@dotagents/shared/settings-api-client';
import { getDeviceIdentity } from './deviceIdentity';

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

function withMobileDeviceIdentity(options: SettingsApiClientOptions = {}): SettingsApiClientOptions {
  return {
    ...options,
    deviceIdHeaderName: options.deviceIdHeaderName ?? DOTAGENTS_DEVICE_ID_HEADER,
    getDeviceId: options.getDeviceId ?? getStableDeviceId,
  };
}

export class SettingsApiClient extends SharedSettingsApiClient {
  constructor(baseUrl: string, apiKey: string, options: SettingsApiClientOptions = {}) {
    super(baseUrl, apiKey, withMobileDeviceIdentity(options));
  }
}

export class ExtendedSettingsApiClient extends SharedExtendedSettingsApiClient {
  constructor(baseUrl: string, apiKey: string, options: SettingsApiClientOptions = {}) {
    super(baseUrl, apiKey, withMobileDeviceIdentity(options));
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
