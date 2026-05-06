import { normalizeApiBaseUrl } from './connection-recovery';
import { DEFAULT_MODEL_PRESET_ID, isChatProviderId, isSttProviderId, isTtsProviderId } from './providers';
import type { CHAT_PROVIDER_ID, ModelPreset } from './providers';
import {
  buildModelPresetsResponse,
  getMergedModelPresetById,
  getModelPresetActivationUpdates,
  upsertModelPresetOverride,
} from './model-presets';
import {
  MCP_MAX_ITERATIONS_DEFAULT,
  normalizeMcpMaxIterationsValue,
  type McpServerConfigExportResponse,
  type McpServerConfigImportResponse,
  type McpServerConfigMutationResponse,
} from './mcp-api';
import {
  DEFAULT_PARAKEET_NUM_THREADS,
  getDefaultSttModel,
  isParakeetNumThreadsUpdateValue,
} from './stt-models';
import type {
  BundleExportResponse,
  BundleExportableItemsResponse,
  BundleImportPreviewResponse,
  BundleImportResult,
  ExportBundleRequest,
  ImportBundleRequest,
  PreviewBundleImportRequest,
} from './bundle-api';
import type { MCPConfig, MCPServerConfig } from './mcp-utils';
import { sanitizeConfigStringList } from './config-list-input';
import {
  buildRemoteServerApiQueryPath,
  REMOTE_SERVER_API_BUILDERS,
  REMOTE_SERVER_API_PATHS,
  getRemoteServerApiRoutePath,
} from './remote-server-api';
import {
  getRemoteServerLifecycleAction,
  type RemoteServerLifecycleAction,
  type RemoteServerLifecycleConfigLike,
} from './remote-pairing';
import { getSensitiveOperatorSettingsKeys } from './operator-actions';
import {
  DEFAULT_OPENAI_TTS_RESPONSE_FORMAT,
  DEFAULT_SUPERTONIC_TTS_LANGUAGE,
  DEFAULT_SUPERTONIC_TTS_STEPS,
  TEXT_TO_SPEECH_SPEED_SETTING_KEYS,
  getTextToSpeechModelDefault,
  getTextToSpeechSpeedDefault,
  getTextToSpeechVoiceDefault,
  isSupertonicLanguageUpdateValue,
  isSupertonicStepsUpdateValue,
  isOpenAITtsResponseFormatUpdateValue,
  isTextToSpeechModelUpdateValue,
  isTextToSpeechSpeedUpdateValue,
  isTextToSpeechVoiceUpdateValue,
} from './text-to-speech-settings';
import type {
  AgentModelSelectionConfig,
  ChatProviderCredentialsConfig,
  AgentSessionCandidatesResponse,
  AgentProfileCreateRequest,
  AgentProfileDeleteResponse,
  AgentProfilesReloadResponse,
  AgentProfileToggleResponse,
  AgentProfileUpdateRequest,
  ApiAgentProfile,
  ApiAgentProfileFull,
  ApiAgentProfilesResponse,
  VerifyExternalAgentCommandRequest,
  VerifyExternalAgentCommandResponse,
  CreateConversationRequest,
  EmergencyStopResponse,
  KnowledgeNoteCreateRequest,
  KnowledgeNoteDeleteResponse,
  KnowledgeNoteMutationResponse,
  KnowledgeNoteResponse,
  KnowledgeNoteSearchRequest,
  KnowledgeNotesDeleteAllResponse,
  KnowledgeNotesDeleteMultipleResponse,
  KnowledgeNotesListRequest,
  KnowledgeNoteUpdateRequest,
  KnowledgeNotesResponse,
  LocalSpeechModelProviderId,
  LocalSpeechModelStatus,
  LocalSpeechModelStatusesResponse,
  Loop,
  LoopCreateRequest,
  LoopDeleteResponse,
  LoopExportMarkdownResponse,
  LoopImportMarkdownRequest,
  LoopMutationResponse,
  LoopRuntimeActionResponse,
  LoopRunResponse,
  LoopStatusesResponse,
  LoopToggleResponse,
  LoopsResponse,
  LoopUpdateRequest,
  MCPServersResponse,
  ModelPresetCreateRequest,
  ModelPresetMutationResponse,
  ModelPresetsResponse,
  ModelPresetUpdateRequest,
  ModelsResponse,
  OpenAICompatibleModelsResponse,
  OperatorActionResponse,
  OperatorApiKeyRotationResponse,
  OperatorAuditResponse,
  OperatorConversationsResponse,
  OperatorDiscordIntegrationSummary,
  OperatorDiscordLogsResponse,
  OperatorHealthSnapshot,
  OperatorIntegrationsSummary,
  OperatorLogsResponse,
  OperatorMessageQueuesResponse,
  OperatorMCPServerLogsResponse,
  OperatorMCPServerTestResponse,
  OperatorMCPStatusResponse,
  OperatorMCPToolsResponse,
  OperatorMCPToolToggleResponse,
  OperatorRecentErrorsResponse,
  OperatorRemoteServerStatus,
  OperatorRunAgentRequest,
  OperatorRunAgentResponse,
  OperatorRuntimeStatus,
  OperatorTunnelSetupSummary,
  OperatorTunnelStatus,
  OperatorUpdaterStatus,
  OperatorWhatsAppIntegrationSummary,
  Profile,
  ProfilesResponse,
  PushStatusResponse,
  PushTokenRegistration,
  ServerConversation,
  ServerConversationFull,
  Settings,
  SettingsUpdate,
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
  TtsSpeakRequest,
  TtsSpeakResponse,
  UpdateConversationRequest,
} from './api-types';

export const DOTAGENTS_DEVICE_ID_HEADER = 'x-dotagents-device-id';

const API_PATHS = REMOTE_SERVER_API_PATHS;
const API_BUILDERS = REMOTE_SERVER_API_BUILDERS;
const SETTINGS_AUDIT_PATH = getRemoteServerApiRoutePath(API_PATHS.settings);

export type SettingsUpdatePatch = Record<string, any>;

export interface SettingsUpdateConfigLike extends Pick<AgentModelSelectionConfig, 'currentModelPresetId'>, Pick<ChatProviderCredentialsConfig, 'openaiApiKey'> {
  modelPresets?: ModelPreset[];
  groqTtsModel?: Settings['groqTtsModel'];
  groqTtsVoice?: Settings['groqTtsVoice'];
}

export type SettingsResponseConfigLike = Partial<Settings> & {
  modelPresets?: ModelPreset[];
};

export interface BuildSettingsResponseOptions {
  providerSecretMask: string;
  remoteServerApiKey: string;
  discordBotToken: string;
  discordDefaultProfileId?: string;
  acpxAgents?: Settings['acpxAgents'];
  langfuseSecretMask?: string;
}

export interface BuildSettingsUpdatePatchOptions {
  providerSecretMask: string;
  remoteServerSecretMask: string;
  discordSecretMask: string;
  langfuseSecretMask?: string;
}

export type SettingsLifecycleAction = 'noop' | 'start' | 'stop' | 'restart';

export interface SettingsUpdateResponse {
  success: true;
  updated: string[];
}

export interface SettingsSensitiveUpdateAuditContext {
  action: 'settings-sensitive-update';
  path: typeof SETTINGS_AUDIT_PATH;
  success: boolean;
  details?: Record<string, unknown>;
  failureReason?: string;
}

export type SettingsActionResult = {
  statusCode: number;
  body: unknown;
  remoteServerLifecycleAction?: RemoteServerLifecycleAction;
  auditContext?: SettingsSensitiveUpdateAuditContext;
};

export type SettingsActionConfigLike = SettingsResponseConfigLike
  & SettingsUpdateConfigLike
  & RemoteServerLifecycleConfigLike
  & {
    whatsappEnabled?: boolean;
    discordEnabled?: boolean;
  };

type SettingsMaybePromise<T> = T | Promise<T>;

export interface SettingsActionConfigStore<TConfig extends SettingsActionConfigLike = SettingsActionConfigLike> {
  get(): TConfig;
  save(config: TConfig): SettingsMaybePromise<void>;
}

export interface SettingsActionDiagnostics {
  logInfo(source: string, message: string): void;
  logError(source: string, message: string, error: unknown): void;
}

export interface SettingsActionOptions<TConfig extends SettingsActionConfigLike = SettingsActionConfigLike> {
  config: SettingsActionConfigStore<TConfig>;
  diagnostics: SettingsActionDiagnostics;
  getMaskedRemoteServerApiKey(config: TConfig): string;
  getMaskedDiscordBotToken(config: TConfig): string;
  getDiscordDefaultProfileId(config: TConfig): string;
  getAcpxAgents(): Settings['acpxAgents'];
  getDiscordLifecycleAction(prev: TConfig, next: TConfig): SettingsLifecycleAction;
  applyDiscordLifecycleAction(action: SettingsLifecycleAction): SettingsMaybePromise<void>;
  applyWhatsappToggle(prevEnabled: boolean, nextEnabled: boolean): SettingsMaybePromise<void>;
  applyDesktopShellSettings?(prev: TConfig, next: TConfig): SettingsMaybePromise<void>;
}

function getRequestRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
}

const PANEL_POSITIONS = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right', 'custom'] as const;

function getRecordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function normalizePanelPoint(value: unknown): { x: number; y: number } | undefined {
  const record = getRecordValue(value);
  if (!record || typeof record.x !== 'number' || typeof record.y !== 'number') return undefined;
  if (!Number.isFinite(record.x) || !Number.isFinite(record.y)) return undefined;
  return {
    x: Math.round(record.x),
    y: Math.round(record.y),
  };
}

function normalizePanelSizeValue(value: unknown): { width: number; height: number } | undefined {
  const record = getRecordValue(value);
  if (!record || typeof record.width !== 'number' || typeof record.height !== 'number') return undefined;
  if (!Number.isFinite(record.width) || !Number.isFinite(record.height)) return undefined;
  const width = Math.round(record.width);
  const height = Math.round(record.height);
  if (width < 1 || height < 1 || width > 10000 || height > 10000) return undefined;
  return { width, height };
}

export function getSettingsUpdateRequestRecord(body: unknown): Record<string, unknown> {
  return getRequestRecord(body);
}

export function buildSettingsUpdateResponse(updates: object | string[]): SettingsUpdateResponse {
  return {
    success: true,
    updated: Array.isArray(updates) ? updates : Object.keys(updates),
  };
}

export function buildSettingsResponse(
  cfg: SettingsResponseConfigLike,
  options: BuildSettingsResponseOptions,
): Settings {
  const modelPresetsResponse = buildModelPresetsResponse(cfg, options.providerSecretMask);
  const langfuseSecretMask = options.langfuseSecretMask ?? options.providerSecretMask;

  return {
    // Agent model settings (agent* preferred; mcpTools* legacy aliases)
    agentProviderId: cfg.agentProviderId || cfg.mcpToolsProviderId || 'openai',
    agentOpenaiModel: cfg.agentOpenaiModel || cfg.mcpToolsOpenaiModel,
    agentGroqModel: cfg.agentGroqModel || cfg.mcpToolsGroqModel,
    agentGeminiModel: cfg.agentGeminiModel || cfg.mcpToolsGeminiModel,
    agentChatgptWebModel: cfg.agentChatgptWebModel || cfg.mcpToolsChatgptWebModel,
    mcpToolsProviderId: cfg.mcpToolsProviderId || 'openai',
    mcpToolsOpenaiModel: cfg.mcpToolsOpenaiModel,
    mcpToolsGroqModel: cfg.mcpToolsGroqModel,
    mcpToolsGeminiModel: cfg.mcpToolsGeminiModel,
    mcpToolsChatgptWebModel: cfg.mcpToolsChatgptWebModel,
    currentModelPresetId: modelPresetsResponse.currentModelPresetId,
    availablePresets: modelPresetsResponse.presets,
    predefinedPrompts: (cfg.predefinedPrompts || []).map((prompt) => ({
      id: prompt.id,
      name: prompt.name,
      content: prompt.content,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    })),
    openaiApiKey: cfg.openaiApiKey ? options.providerSecretMask : '',
    openaiBaseUrl: cfg.openaiBaseUrl ?? '',
    groqApiKey: cfg.groqApiKey ? options.providerSecretMask : '',
    groqBaseUrl: cfg.groqBaseUrl ?? '',
    geminiApiKey: cfg.geminiApiKey ? options.providerSecretMask : '',
    geminiBaseUrl: cfg.geminiBaseUrl ?? '',
    openaiReasoningEffort: cfg.openaiReasoningEffort,
    codexTextVerbosity: cfg.codexTextVerbosity,
    themePreference: cfg.themePreference ?? 'system',
    floatingPanelAutoShow: cfg.floatingPanelAutoShow ?? true,
    hidePanelWhenMainFocused: cfg.hidePanelWhenMainFocused ?? true,
    hideDockIcon: cfg.hideDockIcon ?? false,
    launchAtLogin: cfg.launchAtLogin ?? false,
    panelPosition: cfg.panelPosition ?? 'top-right',
    panelCustomPosition: cfg.panelCustomPosition,
    panelDragEnabled: cfg.panelDragEnabled ?? true,
    panelCustomSize: cfg.panelCustomSize,
    panelWaveformSize: cfg.panelWaveformSize,
    panelTextInputSize: cfg.panelTextInputSize,
    panelProgressSize: cfg.panelProgressSize,
    textInputEnabled: cfg.textInputEnabled ?? true,
    conversationsEnabled: cfg.conversationsEnabled ?? true,
    maxConversationsToKeep: cfg.maxConversationsToKeep ?? 100,
    autoSaveConversations: cfg.autoSaveConversations ?? true,
    transcriptPostProcessingEnabled: cfg.transcriptPostProcessingEnabled ?? true,
    mcpRequireApprovalBeforeToolCall: cfg.mcpRequireApprovalBeforeToolCall ?? false,
    ttsEnabled: cfg.ttsEnabled ?? true,
    whatsappEnabled: cfg.whatsappEnabled ?? false,
    discordEnabled: cfg.discordEnabled ?? false,
    mcpMaxIterations: cfg.mcpMaxIterations ?? MCP_MAX_ITERATIONS_DEFAULT,
    streamerModeEnabled: cfg.streamerModeEnabled ?? false,
    sttLanguage: cfg.sttLanguage ?? '',
    transcriptionPreviewEnabled: cfg.transcriptionPreviewEnabled ?? true,
    parakeetNumThreads: cfg.parakeetNumThreads ?? DEFAULT_PARAKEET_NUM_THREADS,
    openaiSttLanguage: cfg.openaiSttLanguage ?? '',
    openaiSttModel: cfg.openaiSttModel || getDefaultSttModel('openai')!,
    groqSttLanguage: cfg.groqSttLanguage ?? '',
    groqSttModel: cfg.groqSttModel || getDefaultSttModel('groq')!,
    groqSttPrompt: cfg.groqSttPrompt ?? '',
    transcriptPostProcessingPrompt: cfg.transcriptPostProcessingPrompt ?? '',
    ttsAutoPlay: cfg.ttsAutoPlay ?? true,
    ttsPreprocessingEnabled: cfg.ttsPreprocessingEnabled ?? true,
    ttsRemoveCodeBlocks: cfg.ttsRemoveCodeBlocks ?? true,
    ttsRemoveUrls: cfg.ttsRemoveUrls ?? true,
    ttsConvertMarkdown: cfg.ttsConvertMarkdown ?? true,
    ttsUseLLMPreprocessing: cfg.ttsUseLLMPreprocessing ?? false,
    ttsLLMPreprocessingProviderId: cfg.ttsLLMPreprocessingProviderId,
    mainAgentMode: cfg.mainAgentMode ?? 'api',
    mcpMessageQueueEnabled: cfg.mcpMessageQueueEnabled ?? true,
    mcpVerifyCompletionEnabled: cfg.mcpVerifyCompletionEnabled ?? true,
    mcpFinalSummaryEnabled: cfg.mcpFinalSummaryEnabled ?? false,
    dualModelEnabled: cfg.dualModelEnabled ?? false,
    mcpUnlimitedIterations: cfg.mcpUnlimitedIterations ?? true,
    mcpContextReductionEnabled: cfg.mcpContextReductionEnabled ?? true,
    mcpToolResponseProcessingEnabled: cfg.mcpToolResponseProcessingEnabled ?? true,
    mcpParallelToolExecution: cfg.mcpParallelToolExecution ?? true,
    mcpAutoPasteEnabled: cfg.mcpAutoPasteEnabled ?? false,
    mcpAutoPasteDelay: cfg.mcpAutoPasteDelay ?? 1000,
    mcpRuntimeDisabledServers: sanitizeConfigStringList(cfg.mcpRuntimeDisabledServers),
    mcpDisabledTools: sanitizeConfigStringList(cfg.mcpDisabledTools),
    remoteServerEnabled: cfg.remoteServerEnabled ?? false,
    remoteServerPort: cfg.remoteServerPort ?? 3210,
    remoteServerBindAddress: cfg.remoteServerBindAddress ?? '127.0.0.1',
    remoteServerApiKey: options.remoteServerApiKey,
    remoteServerLogLevel: cfg.remoteServerLogLevel ?? 'info',
    remoteServerCorsOrigins: cfg.remoteServerCorsOrigins ?? ['*'],
    remoteServerOperatorAllowDeviceIds: cfg.remoteServerOperatorAllowDeviceIds ?? [],
    remoteServerAutoShowPanel: cfg.remoteServerAutoShowPanel ?? false,
    remoteServerTerminalQrEnabled: cfg.remoteServerTerminalQrEnabled ?? false,
    cloudflareTunnelMode: cfg.cloudflareTunnelMode ?? 'quick',
    cloudflareTunnelAutoStart: cfg.cloudflareTunnelAutoStart ?? false,
    cloudflareTunnelId: cfg.cloudflareTunnelId ?? '',
    cloudflareTunnelName: cfg.cloudflareTunnelName ?? '',
    cloudflareTunnelCredentialsPath: cfg.cloudflareTunnelCredentialsPath ?? '',
    cloudflareTunnelHostname: cfg.cloudflareTunnelHostname ?? '',
    whatsappAllowFrom: cfg.whatsappAllowFrom ?? [],
    whatsappOperatorAllowFrom: cfg.whatsappOperatorAllowFrom ?? [],
    whatsappAutoReply: cfg.whatsappAutoReply ?? false,
    whatsappLogMessages: cfg.whatsappLogMessages ?? false,
    discordBotToken: options.discordBotToken,
    discordDmEnabled: cfg.discordDmEnabled ?? true,
    discordRequireMention: cfg.discordRequireMention ?? true,
    discordAllowUserIds: cfg.discordAllowUserIds ?? [],
    discordAllowGuildIds: cfg.discordAllowGuildIds ?? [],
    discordAllowChannelIds: cfg.discordAllowChannelIds ?? [],
    discordAllowRoleIds: cfg.discordAllowRoleIds ?? [],
    discordDmAllowUserIds: cfg.discordDmAllowUserIds ?? [],
    discordOperatorAllowUserIds: cfg.discordOperatorAllowUserIds ?? [],
    discordOperatorAllowGuildIds: cfg.discordOperatorAllowGuildIds ?? [],
    discordOperatorAllowChannelIds: cfg.discordOperatorAllowChannelIds ?? [],
    discordOperatorAllowRoleIds: cfg.discordOperatorAllowRoleIds ?? [],
    discordDefaultProfileId: options.discordDefaultProfileId ?? '',
    discordLogMessages: cfg.discordLogMessages ?? false,
    langfuseEnabled: cfg.langfuseEnabled ?? false,
    langfusePublicKey: cfg.langfusePublicKey ?? '',
    langfuseSecretKey: cfg.langfuseSecretKey ? langfuseSecretMask : '',
    langfuseBaseUrl: cfg.langfuseBaseUrl ?? '',
    localTraceLoggingEnabled: cfg.localTraceLoggingEnabled ?? false,
    localTraceLogPath: cfg.localTraceLogPath ?? '',
    sttProviderId: cfg.sttProviderId || 'openai',
    ttsProviderId: cfg.ttsProviderId || 'openai',
    transcriptPostProcessingProviderId: cfg.transcriptPostProcessingProviderId || 'openai',
    transcriptPostProcessingOpenaiModel: cfg.transcriptPostProcessingOpenaiModel || '',
    transcriptPostProcessingGroqModel: cfg.transcriptPostProcessingGroqModel || '',
    transcriptPostProcessingGeminiModel: cfg.transcriptPostProcessingGeminiModel || '',
    transcriptPostProcessingChatgptWebModel: cfg.transcriptPostProcessingChatgptWebModel || '',
    mainAgentName: cfg.mainAgentName || '',
    openaiTtsModel: cfg.openaiTtsModel || getTextToSpeechModelDefault('openai')!,
    openaiTtsVoice: cfg.openaiTtsVoice || String(getTextToSpeechVoiceDefault('openai')),
    openaiTtsSpeed: cfg.openaiTtsSpeed ?? getTextToSpeechSpeedDefault('openai'),
    openaiTtsResponseFormat: cfg.openaiTtsResponseFormat || DEFAULT_OPENAI_TTS_RESPONSE_FORMAT,
    groqTtsModel: cfg.groqTtsModel || getTextToSpeechModelDefault('groq')!,
    groqTtsVoice: cfg.groqTtsVoice || String(getTextToSpeechVoiceDefault('groq', cfg.groqTtsModel)),
    geminiTtsModel: cfg.geminiTtsModel || getTextToSpeechModelDefault('gemini')!,
    geminiTtsVoice: cfg.geminiTtsVoice || String(getTextToSpeechVoiceDefault('gemini')),
    edgeTtsModel: cfg.edgeTtsModel || getTextToSpeechModelDefault('edge')!,
    edgeTtsVoice: cfg.edgeTtsVoice || String(getTextToSpeechVoiceDefault('edge')),
    edgeTtsRate: cfg.edgeTtsRate ?? getTextToSpeechSpeedDefault('edge'),
    kittenVoiceId: cfg.kittenVoiceId ?? Number(getTextToSpeechVoiceDefault('kitten')),
    supertonicVoice: cfg.supertonicVoice ?? String(getTextToSpeechVoiceDefault('supertonic')),
    supertonicLanguage: cfg.supertonicLanguage ?? DEFAULT_SUPERTONIC_TTS_LANGUAGE,
    supertonicSpeed: cfg.supertonicSpeed ?? getTextToSpeechSpeedDefault('supertonic'),
    supertonicSteps: cfg.supertonicSteps ?? DEFAULT_SUPERTONIC_TTS_STEPS,
    acpxAgents: options.acpxAgents ?? [],
    pinnedSessionIds: Array.isArray(cfg.pinnedSessionIds)
      ? cfg.pinnedSessionIds.filter((id): id is string => typeof id === 'string')
      : [],
    archivedSessionIds: Array.isArray(cfg.archivedSessionIds)
      ? cfg.archivedSessionIds.filter((id): id is string => typeof id === 'string')
      : [],
  };
}

export function buildSettingsSensitiveNoValidUpdateAuditContext(
  attemptedSensitiveSettingsKeys: string[],
): SettingsSensitiveUpdateAuditContext {
  return {
    action: 'settings-sensitive-update',
    path: SETTINGS_AUDIT_PATH,
    success: false,
    details: { attempted: attemptedSensitiveSettingsKeys },
    failureReason: 'no-valid-settings-to-update',
  };
}

export function buildSettingsSensitiveUpdateAuditContext(
  sensitiveUpdatedKeys: string[],
  lifecycleActions: {
    remoteServerLifecycleAction?: SettingsLifecycleAction;
    discordLifecycleAction?: SettingsLifecycleAction;
  } = {},
): SettingsSensitiveUpdateAuditContext {
  return {
    action: 'settings-sensitive-update',
    path: SETTINGS_AUDIT_PATH,
    success: true,
    details: {
      updated: sensitiveUpdatedKeys,
      ...(lifecycleActions.remoteServerLifecycleAction && lifecycleActions.remoteServerLifecycleAction !== 'noop'
        ? { remoteServerLifecycleAction: lifecycleActions.remoteServerLifecycleAction }
        : {}),
      ...(lifecycleActions.discordLifecycleAction && lifecycleActions.discordLifecycleAction !== 'noop'
        ? { discordLifecycleAction: lifecycleActions.discordLifecycleAction }
        : {}),
    },
  };
}

export function buildSettingsSensitiveUpdateFailureAuditContext(
  attemptedSensitiveSettingsKeys: string[],
): SettingsSensitiveUpdateAuditContext {
  return {
    action: 'settings-sensitive-update',
    path: SETTINGS_AUDIT_PATH,
    success: false,
    details: { attempted: attemptedSensitiveSettingsKeys },
    failureReason: 'settings-update-error',
  };
}

function settingsActionOk(
  body: unknown,
  options: Pick<SettingsActionResult, 'auditContext' | 'remoteServerLifecycleAction'> = {},
): SettingsActionResult {
  return {
    statusCode: 200,
    body,
    ...options,
  };
}

function settingsActionError(
  statusCode: number,
  message: string,
  auditContext?: SettingsSensitiveUpdateAuditContext,
): SettingsActionResult {
  return {
    statusCode,
    body: { error: message },
    ...(auditContext ? { auditContext } : {}),
  };
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return fallback;
}

export function getSettingsAction<TConfig extends SettingsActionConfigLike>(
  providerSecretMask: string,
  options: SettingsActionOptions<TConfig>,
): SettingsActionResult {
  try {
    const cfg = options.config.get();
    return settingsActionOk(buildSettingsResponse(cfg, {
      providerSecretMask,
      remoteServerApiKey: options.getMaskedRemoteServerApiKey(cfg),
      discordBotToken: options.getMaskedDiscordBotToken(cfg),
      discordDefaultProfileId: options.getDiscordDefaultProfileId(cfg),
      acpxAgents: options.getAcpxAgents(),
    }));
  } catch (caughtError) {
    options.diagnostics.logError('settings-actions', 'Failed to get settings', caughtError);
    return settingsActionError(500, 'Failed to get settings');
  }
}

export async function updateSettingsAction<TConfig extends SettingsActionConfigLike>(
  body: unknown,
  masks: BuildSettingsUpdatePatchOptions,
  options: SettingsActionOptions<TConfig>,
): Promise<SettingsActionResult> {
  let attemptedSensitiveSettingsKeys: string[] = [];

  try {
    const requestBody = getSettingsUpdateRequestRecord(body);
    attemptedSensitiveSettingsKeys = getSensitiveOperatorSettingsKeys(requestBody);
    const cfg = options.config.get();
    const updates = buildSettingsUpdatePatch(requestBody, cfg, masks) as Partial<TConfig>;

    if (Object.keys(updates).length === 0) {
      return settingsActionError(
        400,
        'No valid settings to update',
        attemptedSensitiveSettingsKeys.length > 0
          ? buildSettingsSensitiveNoValidUpdateAuditContext(attemptedSensitiveSettingsKeys)
          : undefined,
      );
    }

    const nextConfig = { ...cfg, ...updates } as TConfig;
    const remoteServerLifecycleAction = getRemoteServerLifecycleAction(cfg, nextConfig);
    const sensitiveUpdatedKeys = getSensitiveOperatorSettingsKeys(updates);
    await options.config.save(nextConfig);
    options.diagnostics.logInfo('settings-actions', `Updated settings: ${Object.keys(updates).join(', ')}`);

    if (updates.hideDockIcon !== undefined || updates.launchAtLogin !== undefined) {
      try {
        await options.applyDesktopShellSettings?.(cfg, nextConfig);
      } catch {
        // Desktop shell changes are best-effort; saved config remains authoritative.
      }
    }

    const discordLifecycleAction = options.getDiscordLifecycleAction(cfg, nextConfig);
    await options.applyDiscordLifecycleAction(discordLifecycleAction);

    if (updates.whatsappEnabled !== undefined) {
      try {
        const prevEnabled = cfg.whatsappEnabled ?? false;
        await options.applyWhatsappToggle(prevEnabled, updates.whatsappEnabled);
      } catch {
        // lifecycle is best-effort
      }
    }

    return settingsActionOk(buildSettingsUpdateResponse(updates), {
      remoteServerLifecycleAction,
      auditContext: sensitiveUpdatedKeys.length > 0
        ? buildSettingsSensitiveUpdateAuditContext(sensitiveUpdatedKeys, {
          remoteServerLifecycleAction,
          discordLifecycleAction,
        })
        : undefined,
    });
  } catch (caughtError) {
    options.diagnostics.logError('settings-actions', 'Failed to update settings', caughtError);
    return settingsActionError(
      500,
      getUnknownErrorMessage(caughtError, 'Failed to update settings'),
      attemptedSensitiveSettingsKeys.length > 0
        ? buildSettingsSensitiveUpdateFailureAuditContext(attemptedSensitiveSettingsKeys)
        : undefined,
    );
  }
}

export function buildEmergencyStopResponse(
  processesKilled: number,
  processesRemaining: number,
): EmergencyStopResponse {
  return {
    success: true,
    message: 'Emergency stop executed',
    processesKilled,
    processesRemaining,
  };
}

export function buildEmergencyStopErrorResponse(error: unknown): EmergencyStopResponse {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Emergency stop failed';
  return {
    success: false,
    error: message || 'Emergency stop failed',
  };
}

export type EmergencyStopActionResult = {
  statusCode: number;
  body: unknown;
};

export type EmergencyStopAllResult = {
  before: number;
  after: number;
};

export interface EmergencyStopActionDiagnostics {
  logInfo(source: string, message: string): void;
  logError(source: string, message: string, error: unknown): void;
}

export interface EmergencyStopActionLogger {
  log(message: string): void;
  error(message: string, error: unknown): void;
}

export interface EmergencyStopActionOptions {
  stopAll(): Promise<EmergencyStopAllResult>;
  diagnostics: EmergencyStopActionDiagnostics;
  logger?: EmergencyStopActionLogger;
}

function emergencyStopActionOk(body: unknown): EmergencyStopActionResult {
  return {
    statusCode: 200,
    body,
  };
}

function emergencyStopActionError(statusCode: number, body: unknown): EmergencyStopActionResult {
  return {
    statusCode,
    body,
  };
}

export async function triggerEmergencyStopAction(
  options: EmergencyStopActionOptions,
): Promise<EmergencyStopActionResult> {
  options.logger?.log('[KILLSWITCH] /v1/emergency-stop endpoint called');
  try {
    options.logger?.log('[KILLSWITCH] Loading emergency-stop module...');
    options.diagnostics.logInfo('remote-server', 'Emergency stop triggered via API');

    options.logger?.log('[KILLSWITCH] Calling emergency stop handler...');
    const { before, after } = await options.stopAll();

    options.logger?.log(`[KILLSWITCH] Emergency stop completed. Killed ${before} processes. Remaining: ${after}`);
    options.diagnostics.logInfo(
      'remote-server',
      `Emergency stop completed. Killed ${before} processes. Remaining: ${after}`,
    );

    return emergencyStopActionOk(buildEmergencyStopResponse(before, after));
  } catch (caughtError) {
    options.logger?.error('[KILLSWITCH] Error during emergency stop:', caughtError);
    options.diagnostics.logError('remote-server', 'Emergency stop error', caughtError);
    return emergencyStopActionError(500, buildEmergencyStopErrorResponse(caughtError));
  }
}

export function buildSettingsUpdatePatch(
  body: unknown,
  cfg: SettingsUpdateConfigLike,
  options: BuildSettingsUpdatePatchOptions,
): SettingsUpdatePatch {
  const requestBody = getRequestRecord(body);
  const updates: SettingsUpdatePatch = {};
  const providerSecretMask = options.providerSecretMask;
  const langfuseSecretMask = options.langfuseSecretMask ?? providerSecretMask;

  if (typeof requestBody.transcriptPostProcessingEnabled === 'boolean') {
    updates.transcriptPostProcessingEnabled = requestBody.transcriptPostProcessingEnabled;
  }
  if (typeof requestBody.mcpRequireApprovalBeforeToolCall === 'boolean') {
    updates.mcpRequireApprovalBeforeToolCall = requestBody.mcpRequireApprovalBeforeToolCall;
  }
  if (typeof requestBody.ttsEnabled === 'boolean') {
    updates.ttsEnabled = requestBody.ttsEnabled;
  }
  if (typeof requestBody.whatsappEnabled === 'boolean') {
    updates.whatsappEnabled = requestBody.whatsappEnabled;
  }
  if (typeof requestBody.discordEnabled === 'boolean') {
    updates.discordEnabled = requestBody.discordEnabled;
  }
  const mcpMaxIterations = normalizeMcpMaxIterationsValue(requestBody.mcpMaxIterations);
  if (mcpMaxIterations !== undefined) updates.mcpMaxIterations = mcpMaxIterations;

  const agentProviderId = typeof requestBody.agentProviderId === 'string' ? requestBody.agentProviderId : requestBody.mcpToolsProviderId;
  if (isChatProviderId(agentProviderId)) {
    updates.agentProviderId = agentProviderId;
    updates.mcpToolsProviderId = updates.agentProviderId;
  }
  const agentOpenaiModel = typeof requestBody.agentOpenaiModel === 'string' ? requestBody.agentOpenaiModel : requestBody.mcpToolsOpenaiModel;
  if (typeof agentOpenaiModel === 'string') {
    updates.agentOpenaiModel = agentOpenaiModel;
    updates.mcpToolsOpenaiModel = agentOpenaiModel;
  }
  const agentGroqModel = typeof requestBody.agentGroqModel === 'string' ? requestBody.agentGroqModel : requestBody.mcpToolsGroqModel;
  if (typeof agentGroqModel === 'string') {
    updates.agentGroqModel = agentGroqModel;
    updates.mcpToolsGroqModel = agentGroqModel;
  }
  const agentGeminiModel = typeof requestBody.agentGeminiModel === 'string' ? requestBody.agentGeminiModel : requestBody.mcpToolsGeminiModel;
  if (typeof agentGeminiModel === 'string') {
    updates.agentGeminiModel = agentGeminiModel;
    updates.mcpToolsGeminiModel = agentGeminiModel;
  }
  const agentChatgptWebModel = typeof requestBody.agentChatgptWebModel === 'string' ? requestBody.agentChatgptWebModel : requestBody.mcpToolsChatgptWebModel;
  if (typeof agentChatgptWebModel === 'string') {
    updates.agentChatgptWebModel = agentChatgptWebModel;
    updates.mcpToolsChatgptWebModel = agentChatgptWebModel;
  }
  if (typeof requestBody.chatgptWebAccessToken === 'string') updates.chatgptWebAccessToken = requestBody.chatgptWebAccessToken;
  if (typeof requestBody.chatgptWebSessionToken === 'string') updates.chatgptWebSessionToken = requestBody.chatgptWebSessionToken;
  if (typeof requestBody.chatgptWebAccountId === 'string') updates.chatgptWebAccountId = requestBody.chatgptWebAccountId;
  if (typeof requestBody.chatgptWebBaseUrl === 'string') updates.chatgptWebBaseUrl = requestBody.chatgptWebBaseUrl;
  if (typeof requestBody.openaiReasoningEffort === 'string' && ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'].includes(requestBody.openaiReasoningEffort)) {
    updates.openaiReasoningEffort = requestBody.openaiReasoningEffort;
  }
  if (typeof requestBody.codexTextVerbosity === 'string' && ['low', 'medium', 'high'].includes(requestBody.codexTextVerbosity)) {
    updates.codexTextVerbosity = requestBody.codexTextVerbosity;
  }
  if (typeof requestBody.themePreference === 'string' && ['system', 'light', 'dark'].includes(requestBody.themePreference)) {
    updates.themePreference = requestBody.themePreference;
  }
  if (typeof requestBody.floatingPanelAutoShow === 'boolean') updates.floatingPanelAutoShow = requestBody.floatingPanelAutoShow;
  if (typeof requestBody.hidePanelWhenMainFocused === 'boolean') updates.hidePanelWhenMainFocused = requestBody.hidePanelWhenMainFocused;
  if (typeof requestBody.hideDockIcon === 'boolean') updates.hideDockIcon = requestBody.hideDockIcon;
  if (typeof requestBody.launchAtLogin === 'boolean') updates.launchAtLogin = requestBody.launchAtLogin;
  if (typeof requestBody.panelPosition === 'string' && PANEL_POSITIONS.includes(requestBody.panelPosition as typeof PANEL_POSITIONS[number])) {
    updates.panelPosition = requestBody.panelPosition;
  }
  if (requestBody.panelCustomPosition === null) updates.panelCustomPosition = undefined;
  else {
    const panelCustomPosition = normalizePanelPoint(requestBody.panelCustomPosition);
    if (panelCustomPosition) updates.panelCustomPosition = panelCustomPosition;
  }
  if (typeof requestBody.panelDragEnabled === 'boolean') updates.panelDragEnabled = requestBody.panelDragEnabled;
  for (const key of ['panelCustomSize', 'panelWaveformSize', 'panelTextInputSize', 'panelProgressSize']) {
    if (requestBody[key] === null) {
      updates[key] = undefined;
      continue;
    }
    const size = normalizePanelSizeValue(requestBody[key]);
    if (size) updates[key] = size;
  }
  if (typeof requestBody.textInputEnabled === 'boolean') updates.textInputEnabled = requestBody.textInputEnabled;
  if (typeof requestBody.conversationsEnabled === 'boolean') updates.conversationsEnabled = requestBody.conversationsEnabled;
  if (typeof requestBody.autoSaveConversations === 'boolean') updates.autoSaveConversations = requestBody.autoSaveConversations;
  if (typeof requestBody.maxConversationsToKeep === 'number' && Number.isFinite(requestBody.maxConversationsToKeep)) {
    const maxConversationsToKeep = Math.floor(requestBody.maxConversationsToKeep);
    if (maxConversationsToKeep >= 1 && maxConversationsToKeep <= 10000) {
      updates.maxConversationsToKeep = maxConversationsToKeep;
    }
  }
  if (typeof requestBody.openaiApiKey === 'string' && requestBody.openaiApiKey !== providerSecretMask) updates.openaiApiKey = requestBody.openaiApiKey.trim();
  if (typeof requestBody.openaiBaseUrl === 'string') updates.openaiBaseUrl = requestBody.openaiBaseUrl.trim();
  if (typeof requestBody.groqApiKey === 'string' && requestBody.groqApiKey !== providerSecretMask) updates.groqApiKey = requestBody.groqApiKey.trim();
  if (typeof requestBody.groqBaseUrl === 'string') updates.groqBaseUrl = requestBody.groqBaseUrl.trim();
  if (typeof requestBody.geminiApiKey === 'string' && requestBody.geminiApiKey !== providerSecretMask) updates.geminiApiKey = requestBody.geminiApiKey.trim();
  if (typeof requestBody.geminiBaseUrl === 'string') updates.geminiBaseUrl = requestBody.geminiBaseUrl.trim();
  if (typeof requestBody.currentModelPresetId === 'string') {
    const preset = getMergedModelPresetById(cfg, requestBody.currentModelPresetId);
    if (preset) Object.assign(updates, getModelPresetActivationUpdates(preset));
  }
  if (typeof requestBody.streamerModeEnabled === 'boolean') updates.streamerModeEnabled = requestBody.streamerModeEnabled;
  if (typeof requestBody.sttLanguage === 'string') updates.sttLanguage = requestBody.sttLanguage;
  if (typeof requestBody.openaiSttLanguage === 'string') updates.openaiSttLanguage = requestBody.openaiSttLanguage || undefined;
  if (typeof requestBody.groqSttLanguage === 'string') updates.groqSttLanguage = requestBody.groqSttLanguage || undefined;
  if (typeof requestBody.transcriptionPreviewEnabled === 'boolean') updates.transcriptionPreviewEnabled = requestBody.transcriptionPreviewEnabled;
  if (typeof requestBody.transcriptPostProcessingPrompt === 'string') updates.transcriptPostProcessingPrompt = requestBody.transcriptPostProcessingPrompt;
  if (typeof requestBody.ttsAutoPlay === 'boolean') updates.ttsAutoPlay = requestBody.ttsAutoPlay;
  if (typeof requestBody.ttsPreprocessingEnabled === 'boolean') updates.ttsPreprocessingEnabled = requestBody.ttsPreprocessingEnabled;
  if (typeof requestBody.ttsRemoveCodeBlocks === 'boolean') updates.ttsRemoveCodeBlocks = requestBody.ttsRemoveCodeBlocks;
  if (typeof requestBody.ttsRemoveUrls === 'boolean') updates.ttsRemoveUrls = requestBody.ttsRemoveUrls;
  if (typeof requestBody.ttsConvertMarkdown === 'boolean') updates.ttsConvertMarkdown = requestBody.ttsConvertMarkdown;
  if (typeof requestBody.ttsUseLLMPreprocessing === 'boolean') updates.ttsUseLLMPreprocessing = requestBody.ttsUseLLMPreprocessing;
  if (typeof requestBody.ttsLLMPreprocessingProviderId === 'string') {
    const providerId = requestBody.ttsLLMPreprocessingProviderId.trim();
    if (providerId === '') {
      updates.ttsLLMPreprocessingProviderId = undefined;
    } else if (isChatProviderId(providerId)) {
      updates.ttsLLMPreprocessingProviderId = providerId;
    }
  }

  if (typeof requestBody.mainAgentMode === 'string' && ['api', 'acpx'].includes(requestBody.mainAgentMode)) updates.mainAgentMode = requestBody.mainAgentMode;
  if (typeof requestBody.mcpMessageQueueEnabled === 'boolean') updates.mcpMessageQueueEnabled = requestBody.mcpMessageQueueEnabled;
  if (typeof requestBody.mcpVerifyCompletionEnabled === 'boolean') updates.mcpVerifyCompletionEnabled = requestBody.mcpVerifyCompletionEnabled;
  if (typeof requestBody.mcpFinalSummaryEnabled === 'boolean') updates.mcpFinalSummaryEnabled = requestBody.mcpFinalSummaryEnabled;
  if (typeof requestBody.dualModelEnabled === 'boolean') updates.dualModelEnabled = requestBody.dualModelEnabled;
  if (typeof requestBody.mcpUnlimitedIterations === 'boolean') updates.mcpUnlimitedIterations = requestBody.mcpUnlimitedIterations;
  if (typeof requestBody.mcpContextReductionEnabled === 'boolean') updates.mcpContextReductionEnabled = requestBody.mcpContextReductionEnabled;
  if (typeof requestBody.mcpToolResponseProcessingEnabled === 'boolean') updates.mcpToolResponseProcessingEnabled = requestBody.mcpToolResponseProcessingEnabled;
  if (typeof requestBody.mcpParallelToolExecution === 'boolean') updates.mcpParallelToolExecution = requestBody.mcpParallelToolExecution;
  if (typeof requestBody.mcpAutoPasteEnabled === 'boolean') updates.mcpAutoPasteEnabled = requestBody.mcpAutoPasteEnabled;
  if (typeof requestBody.mcpAutoPasteDelay === 'number' && Number.isFinite(requestBody.mcpAutoPasteDelay)) {
    const mcpAutoPasteDelay = Math.round(requestBody.mcpAutoPasteDelay);
    if (mcpAutoPasteDelay >= 0 && mcpAutoPasteDelay <= 60000) {
      updates.mcpAutoPasteDelay = mcpAutoPasteDelay;
    }
  }
  if (Array.isArray(requestBody.mcpRuntimeDisabledServers)) updates.mcpRuntimeDisabledServers = sanitizeConfigStringList(requestBody.mcpRuntimeDisabledServers);
  if (Array.isArray(requestBody.mcpDisabledTools)) updates.mcpDisabledTools = sanitizeConfigStringList(requestBody.mcpDisabledTools);

  if (typeof requestBody.remoteServerEnabled === 'boolean') updates.remoteServerEnabled = requestBody.remoteServerEnabled;
  if (typeof requestBody.remoteServerPort === 'number' && Number.isInteger(requestBody.remoteServerPort) && requestBody.remoteServerPort >= 1 && requestBody.remoteServerPort <= 65535) {
    updates.remoteServerPort = requestBody.remoteServerPort;
  }
  if (typeof requestBody.remoteServerBindAddress === 'string' && ['127.0.0.1', '0.0.0.0'].includes(requestBody.remoteServerBindAddress)) {
    updates.remoteServerBindAddress = requestBody.remoteServerBindAddress;
  }
  if (typeof requestBody.remoteServerApiKey === 'string' && requestBody.remoteServerApiKey !== options.remoteServerSecretMask) {
    const trimmedKey = requestBody.remoteServerApiKey.trim();
    if (trimmedKey.length > 0) updates.remoteServerApiKey = trimmedKey;
  }
  if (typeof requestBody.remoteServerLogLevel === 'string' && ['error', 'info', 'debug'].includes(requestBody.remoteServerLogLevel)) {
    updates.remoteServerLogLevel = requestBody.remoteServerLogLevel;
  }
  if (Array.isArray(requestBody.remoteServerCorsOrigins)) {
    updates.remoteServerCorsOrigins = requestBody.remoteServerCorsOrigins
      .filter((value: unknown) => typeof value === 'string')
      .map((value: string) => value.trim())
      .filter(Boolean);
  }
  if (Array.isArray(requestBody.remoteServerOperatorAllowDeviceIds)) updates.remoteServerOperatorAllowDeviceIds = sanitizeConfigStringList(requestBody.remoteServerOperatorAllowDeviceIds);
  if (typeof requestBody.remoteServerAutoShowPanel === 'boolean') updates.remoteServerAutoShowPanel = requestBody.remoteServerAutoShowPanel;
  if (typeof requestBody.remoteServerTerminalQrEnabled === 'boolean') updates.remoteServerTerminalQrEnabled = requestBody.remoteServerTerminalQrEnabled;

  if (typeof requestBody.cloudflareTunnelMode === 'string' && ['quick', 'named'].includes(requestBody.cloudflareTunnelMode)) updates.cloudflareTunnelMode = requestBody.cloudflareTunnelMode;
  if (typeof requestBody.cloudflareTunnelAutoStart === 'boolean') updates.cloudflareTunnelAutoStart = requestBody.cloudflareTunnelAutoStart;
  if (typeof requestBody.cloudflareTunnelId === 'string') updates.cloudflareTunnelId = requestBody.cloudflareTunnelId.trim();
  if (typeof requestBody.cloudflareTunnelName === 'string') updates.cloudflareTunnelName = requestBody.cloudflareTunnelName.trim();
  if (typeof requestBody.cloudflareTunnelCredentialsPath === 'string') updates.cloudflareTunnelCredentialsPath = requestBody.cloudflareTunnelCredentialsPath.trim();
  if (typeof requestBody.cloudflareTunnelHostname === 'string') updates.cloudflareTunnelHostname = requestBody.cloudflareTunnelHostname.trim();

  if (Array.isArray(requestBody.whatsappAllowFrom)) updates.whatsappAllowFrom = sanitizeConfigStringList(requestBody.whatsappAllowFrom);
  if (Array.isArray(requestBody.whatsappOperatorAllowFrom)) updates.whatsappOperatorAllowFrom = sanitizeConfigStringList(requestBody.whatsappOperatorAllowFrom);
  if (typeof requestBody.whatsappAutoReply === 'boolean') updates.whatsappAutoReply = requestBody.whatsappAutoReply;
  if (typeof requestBody.whatsappLogMessages === 'boolean') updates.whatsappLogMessages = requestBody.whatsappLogMessages;

  if (typeof requestBody.discordBotToken === 'string' && requestBody.discordBotToken !== options.discordSecretMask) updates.discordBotToken = requestBody.discordBotToken;
  if (typeof requestBody.discordDmEnabled === 'boolean') updates.discordDmEnabled = requestBody.discordDmEnabled;
  if (typeof requestBody.discordRequireMention === 'boolean') updates.discordRequireMention = requestBody.discordRequireMention;
  if (Array.isArray(requestBody.discordAllowUserIds)) updates.discordAllowUserIds = sanitizeConfigStringList(requestBody.discordAllowUserIds);
  if (Array.isArray(requestBody.discordAllowGuildIds)) updates.discordAllowGuildIds = sanitizeConfigStringList(requestBody.discordAllowGuildIds);
  if (Array.isArray(requestBody.discordAllowChannelIds)) updates.discordAllowChannelIds = sanitizeConfigStringList(requestBody.discordAllowChannelIds);
  if (Array.isArray(requestBody.discordAllowRoleIds)) updates.discordAllowRoleIds = sanitizeConfigStringList(requestBody.discordAllowRoleIds);
  if (Array.isArray(requestBody.discordDmAllowUserIds)) updates.discordDmAllowUserIds = sanitizeConfigStringList(requestBody.discordDmAllowUserIds);
  if (Array.isArray(requestBody.discordOperatorAllowUserIds)) updates.discordOperatorAllowUserIds = sanitizeConfigStringList(requestBody.discordOperatorAllowUserIds);
  if (Array.isArray(requestBody.discordOperatorAllowGuildIds)) updates.discordOperatorAllowGuildIds = sanitizeConfigStringList(requestBody.discordOperatorAllowGuildIds);
  if (Array.isArray(requestBody.discordOperatorAllowChannelIds)) updates.discordOperatorAllowChannelIds = sanitizeConfigStringList(requestBody.discordOperatorAllowChannelIds);
  if (Array.isArray(requestBody.discordOperatorAllowRoleIds)) updates.discordOperatorAllowRoleIds = sanitizeConfigStringList(requestBody.discordOperatorAllowRoleIds);
  if (typeof requestBody.discordDefaultProfileId === 'string') updates.discordDefaultProfileId = requestBody.discordDefaultProfileId;
  if (typeof requestBody.discordLogMessages === 'boolean') updates.discordLogMessages = requestBody.discordLogMessages;

  if (typeof requestBody.langfuseEnabled === 'boolean') updates.langfuseEnabled = requestBody.langfuseEnabled;
  if (typeof requestBody.langfusePublicKey === 'string') updates.langfusePublicKey = requestBody.langfusePublicKey;
  if (typeof requestBody.langfuseSecretKey === 'string' && requestBody.langfuseSecretKey !== langfuseSecretMask) updates.langfuseSecretKey = requestBody.langfuseSecretKey;
  if (typeof requestBody.langfuseBaseUrl === 'string') updates.langfuseBaseUrl = requestBody.langfuseBaseUrl;
  if (typeof requestBody.localTraceLoggingEnabled === 'boolean') updates.localTraceLoggingEnabled = requestBody.localTraceLoggingEnabled;
  if (typeof requestBody.localTraceLogPath === 'string') updates.localTraceLogPath = requestBody.localTraceLogPath.trim() || undefined;

  if (isSttProviderId(requestBody.sttProviderId)) updates.sttProviderId = requestBody.sttProviderId;
  if (typeof requestBody.openaiSttModel === 'string') updates.openaiSttModel = requestBody.openaiSttModel;
  if (typeof requestBody.groqSttModel === 'string') updates.groqSttModel = requestBody.groqSttModel;
  if (typeof requestBody.groqSttPrompt === 'string') updates.groqSttPrompt = requestBody.groqSttPrompt || undefined;
  if (isParakeetNumThreadsUpdateValue(requestBody.parakeetNumThreads)) {
    updates.parakeetNumThreads = requestBody.parakeetNumThreads;
  }
  if (isTtsProviderId(requestBody.ttsProviderId)) updates.ttsProviderId = requestBody.ttsProviderId;
  if (isChatProviderId(requestBody.transcriptPostProcessingProviderId)) {
    updates.transcriptPostProcessingProviderId = requestBody.transcriptPostProcessingProviderId;
  }
  if (typeof requestBody.transcriptPostProcessingOpenaiModel === 'string') updates.transcriptPostProcessingOpenaiModel = requestBody.transcriptPostProcessingOpenaiModel;
  if (typeof requestBody.transcriptPostProcessingGroqModel === 'string') updates.transcriptPostProcessingGroqModel = requestBody.transcriptPostProcessingGroqModel;
  if (typeof requestBody.transcriptPostProcessingGeminiModel === 'string') updates.transcriptPostProcessingGeminiModel = requestBody.transcriptPostProcessingGeminiModel;
  if (typeof requestBody.transcriptPostProcessingChatgptWebModel === 'string') updates.transcriptPostProcessingChatgptWebModel = requestBody.transcriptPostProcessingChatgptWebModel;

  const activeOpenAiPresetId = updates.currentModelPresetId || cfg.currentModelPresetId || DEFAULT_MODEL_PRESET_ID;
  const openAiPresetModelPatch: Partial<ModelPreset> = {};
  if (typeof agentOpenaiModel === 'string') {
    updates.agentOpenaiModel = agentOpenaiModel;
    updates.mcpToolsOpenaiModel = agentOpenaiModel;
    openAiPresetModelPatch.agentModel = agentOpenaiModel;
  }
  if (typeof requestBody.transcriptPostProcessingOpenaiModel === 'string') {
    updates.transcriptPostProcessingOpenaiModel = requestBody.transcriptPostProcessingOpenaiModel;
    openAiPresetModelPatch.transcriptProcessingModel = requestBody.transcriptPostProcessingOpenaiModel;
  }
  if (Object.keys(openAiPresetModelPatch).length > 0) {
    updates.modelPresets = upsertModelPresetOverride(cfg, activeOpenAiPresetId, openAiPresetModelPatch);
  }

  if (typeof requestBody.mainAgentName === 'string') updates.mainAgentName = requestBody.mainAgentName;
  if (isTextToSpeechModelUpdateValue('openai', requestBody.openaiTtsModel)) updates.openaiTtsModel = requestBody.openaiTtsModel;
  if (isTextToSpeechVoiceUpdateValue('openai', requestBody.openaiTtsVoice)) updates.openaiTtsVoice = requestBody.openaiTtsVoice;
  if (isOpenAITtsResponseFormatUpdateValue(requestBody.openaiTtsResponseFormat)) {
    updates.openaiTtsResponseFormat = requestBody.openaiTtsResponseFormat;
  }
  const groqTtsModel = isTextToSpeechModelUpdateValue('groq', requestBody.groqTtsModel)
    ? requestBody.groqTtsModel
    : undefined;
  if (groqTtsModel) updates.groqTtsModel = groqTtsModel;
  const activeGroqTtsModel = groqTtsModel || cfg.groqTtsModel || getTextToSpeechModelDefault('groq');
  if (isTextToSpeechVoiceUpdateValue('groq', requestBody.groqTtsVoice, activeGroqTtsModel)) {
    updates.groqTtsVoice = requestBody.groqTtsVoice;
  } else if (groqTtsModel && !isTextToSpeechVoiceUpdateValue('groq', cfg.groqTtsVoice, groqTtsModel)) {
    const defaultGroqVoice = getTextToSpeechVoiceDefault('groq', groqTtsModel);
    if (typeof defaultGroqVoice === 'string') updates.groqTtsVoice = defaultGroqVoice;
  }
  if (isTextToSpeechModelUpdateValue('gemini', requestBody.geminiTtsModel)) updates.geminiTtsModel = requestBody.geminiTtsModel;
  if (isTextToSpeechVoiceUpdateValue('gemini', requestBody.geminiTtsVoice)) updates.geminiTtsVoice = requestBody.geminiTtsVoice;
  if (isTextToSpeechModelUpdateValue('edge', requestBody.edgeTtsModel)) updates.edgeTtsModel = requestBody.edgeTtsModel;
  if (isTextToSpeechVoiceUpdateValue('edge', requestBody.edgeTtsVoice)) updates.edgeTtsVoice = requestBody.edgeTtsVoice;
  if (isTextToSpeechVoiceUpdateValue('kitten', requestBody.kittenVoiceId)) updates.kittenVoiceId = requestBody.kittenVoiceId;
  if (isTextToSpeechVoiceUpdateValue('supertonic', requestBody.supertonicVoice)) updates.supertonicVoice = requestBody.supertonicVoice;
  if (isSupertonicLanguageUpdateValue(requestBody.supertonicLanguage)) updates.supertonicLanguage = requestBody.supertonicLanguage;
  for (const key of TEXT_TO_SPEECH_SPEED_SETTING_KEYS) {
    const value = requestBody[key];
    if (isTextToSpeechSpeedUpdateValue(key, value)) {
      updates[key] = value;
    }
  }
  if (isSupertonicStepsUpdateValue(requestBody.supertonicSteps)) updates.supertonicSteps = requestBody.supertonicSteps;

  if (Array.isArray(requestBody.pinnedSessionIds) && requestBody.pinnedSessionIds.every((id: unknown) => typeof id === 'string')) updates.pinnedSessionIds = requestBody.pinnedSessionIds;
  if (Array.isArray(requestBody.archivedSessionIds) && requestBody.archivedSessionIds.every((id: unknown) => typeof id === 'string')) updates.archivedSessionIds = requestBody.archivedSessionIds;
  if (Array.isArray(requestBody.predefinedPrompts)) updates.predefinedPrompts = requestBody.predefinedPrompts;

  return updates;
}

export interface SettingsApiClientOptions {
  deviceIdHeaderName?: string;
  getDeviceId?: () => Promise<string | undefined> | string | undefined;
}

export class SettingsApiClient {
  private baseUrl: string;
  private apiKey: string;
  private options: SettingsApiClientOptions;

  constructor(baseUrl: string, apiKey: string, options: SettingsApiClientOptions = {}) {
    this.baseUrl = normalizeApiBaseUrl(baseUrl);
    this.apiKey = apiKey;
    this.options = options;
  }

  protected async requestResponse(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${this.apiKey}`);

    const deviceId = await this.options.getDeviceId?.();
    if (deviceId) {
      headers.set(this.options.deviceIdHeaderName ?? DOTAGENTS_DEVICE_ID_HEADER, deviceId);
    }

    // Only send a JSON content type when a request body exists. Fastify treats
    // an empty JSON body as a 400 for methods like DELETE/POST when the header is present.
    if (options.body !== undefined && options.body !== null && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  protected async createResponseError(response: Response): Promise<Error> {
    const error = await response.clone().json().catch(async () => ({
      error: await response.text().catch(() => response.statusText),
    }));
    return new Error(error.error || `Request failed: ${response.status}`);
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await this.requestResponse(endpoint, options);
    if (!response.ok) {
      throw await this.createResponseError(response);
    }
    return response.json();
  }

  // Profile Management
  async getProfiles(): Promise<ProfilesResponse> {
    return this.request<ProfilesResponse>(API_PATHS.profiles);
  }

  async getCurrentProfile(): Promise<Profile> {
    return this.request<Profile>(API_PATHS.currentProfile);
  }

  async setCurrentProfile(profileId: string): Promise<{ success: boolean; profile: Profile }> {
    return this.request(API_PATHS.currentProfile, {
      method: 'POST',
      body: JSON.stringify({ profileId }),
    });
  }

  async exportProfile(profileId: string): Promise<{ profileJson: string }> {
    return this.request<{ profileJson: string }>(API_BUILDERS.profileExport(profileId));
  }

  async importProfile(profileJson: string): Promise<{ success: boolean; profile: Profile }> {
    return this.request(API_PATHS.profileImport, {
      method: 'POST',
      body: JSON.stringify({ profileJson }),
    });
  }

  // Bundle Management
  async getBundleExportableItems(): Promise<BundleExportableItemsResponse> {
    return this.request<BundleExportableItemsResponse>(API_PATHS.bundleExportableItems);
  }

  async exportBundle(request: ExportBundleRequest = {}): Promise<BundleExportResponse> {
    return this.request<BundleExportResponse>(API_PATHS.bundleExport, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async previewBundleImport(request: PreviewBundleImportRequest): Promise<BundleImportPreviewResponse> {
    return this.request<BundleImportPreviewResponse>(API_PATHS.bundleImportPreview, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async importBundle(request: ImportBundleRequest): Promise<BundleImportResult> {
    return this.request<BundleImportResult>(API_PATHS.bundleImport, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // MCP Server Management
  async getMCPServers(): Promise<MCPServersResponse> {
    return this.request<MCPServersResponse>(API_PATHS.mcpServers);
  }

  async toggleMCPServer(serverName: string, enabled: boolean): Promise<{ success: boolean; server: string; enabled: boolean }> {
    return this.request(API_BUILDERS.mcpServerToggle(serverName), {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  async importMCPServerConfigs(config: MCPConfig): Promise<McpServerConfigImportResponse> {
    return this.request<McpServerConfigImportResponse>(API_PATHS.mcpConfigImport, {
      method: 'POST',
      body: JSON.stringify({ config }),
    });
  }

  async exportMCPServerConfigs(): Promise<McpServerConfigExportResponse> {
    return this.request<McpServerConfigExportResponse>(API_PATHS.mcpConfigExport);
  }

  async upsertMCPServerConfig(serverName: string, config: MCPServerConfig): Promise<McpServerConfigMutationResponse> {
    return this.request<McpServerConfigMutationResponse>(API_BUILDERS.mcpConfigServer(serverName), {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }

  async deleteMCPServerConfig(serverName: string): Promise<McpServerConfigMutationResponse> {
    return this.request<McpServerConfigMutationResponse>(API_BUILDERS.mcpConfigServer(serverName), {
      method: 'DELETE',
    });
  }

  // Settings Management
  async getSettings(): Promise<Settings> {
    return this.request<Settings>(API_PATHS.settings);
  }

  async updateSettings(updates: SettingsUpdate): Promise<{ success: boolean; updated: string[] }> {
    return this.request(API_PATHS.settings, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getAgentSessionCandidates(limit?: number): Promise<AgentSessionCandidatesResponse> {
    return this.request<AgentSessionCandidatesResponse>(
      buildRemoteServerApiQueryPath(API_PATHS.agentSessionCandidates, { limit }),
    );
  }

  // Models Management
  async getOpenAICompatibleModels(): Promise<OpenAICompatibleModelsResponse> {
    return this.request<OpenAICompatibleModelsResponse>(API_PATHS.models);
  }

  async getModels(providerId: CHAT_PROVIDER_ID): Promise<ModelsResponse> {
    return this.request<ModelsResponse>(API_BUILDERS.modelsByProvider(providerId));
  }

  async getModelPresets(): Promise<ModelPresetsResponse> {
    return this.request<ModelPresetsResponse>(API_PATHS.operatorModelPresets);
  }

  async createModelPreset(request: ModelPresetCreateRequest): Promise<ModelPresetMutationResponse> {
    return this.request<ModelPresetMutationResponse>(API_PATHS.operatorModelPresets, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateModelPreset(presetId: string, request: ModelPresetUpdateRequest): Promise<ModelPresetMutationResponse> {
    return this.request<ModelPresetMutationResponse>(API_BUILDERS.operatorModelPreset(presetId), {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  async deleteModelPreset(presetId: string): Promise<ModelPresetMutationResponse> {
    return this.request<ModelPresetMutationResponse>(API_BUILDERS.operatorModelPreset(presetId), {
      method: 'DELETE',
    });
  }

  // Operator / Admin Management
  async getOperatorStatus(): Promise<OperatorRuntimeStatus> {
    return this.request<OperatorRuntimeStatus>(API_PATHS.operatorStatus);
  }

  async getOperatorHealth(): Promise<OperatorHealthSnapshot> {
    return this.request<OperatorHealthSnapshot>(API_PATHS.operatorHealth);
  }

  async getOperatorErrors(count: number = 10): Promise<OperatorRecentErrorsResponse> {
    return this.request<OperatorRecentErrorsResponse>(API_BUILDERS.operatorErrors(count));
  }

  async getOperatorLogs(count: number = 20, level?: 'error' | 'warning' | 'info'): Promise<OperatorLogsResponse> {
    return this.request<OperatorLogsResponse>(API_BUILDERS.operatorLogs(count, level));
  }

  async getOperatorAudit(count: number = 20): Promise<OperatorAuditResponse> {
    return this.request<OperatorAuditResponse>(API_BUILDERS.operatorAudit(count));
  }

  async getOperatorMCP(): Promise<OperatorMCPStatusResponse> {
    return this.request<OperatorMCPStatusResponse>(API_PATHS.operatorMcp);
  }

  async getOperatorMCPServerLogs(server: string, count: number = 50): Promise<OperatorMCPServerLogsResponse> {
    return this.request<OperatorMCPServerLogsResponse>(API_BUILDERS.operatorMcpServerLogs(server, count));
  }

  async clearOperatorMCPServerLogs(server: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_BUILDERS.operatorMcpServerLogsClear(server), {
      method: 'POST',
    });
  }

  async testOperatorMCPServer(server: string): Promise<OperatorMCPServerTestResponse> {
    return this.request<OperatorMCPServerTestResponse>(API_BUILDERS.operatorMcpServerTest(server), {
      method: 'POST',
    });
  }

  async getOperatorMCPTools(server?: string): Promise<OperatorMCPToolsResponse> {
    return this.request<OperatorMCPToolsResponse>(API_BUILDERS.operatorMcpTools(server));
  }

  async setOperatorMCPToolEnabled(toolName: string, enabled: boolean): Promise<OperatorMCPToolToggleResponse> {
    return this.request<OperatorMCPToolToggleResponse>(API_BUILDERS.operatorMcpToolToggle(toolName), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
  }

  async startMCPServer(server: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.request<{ success: boolean; message?: string; error?: string }>(API_PATHS.operatorMcpStart, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server }),
    });
  }

  async stopMCPServer(server: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.request<{ success: boolean; message?: string; error?: string }>(API_PATHS.operatorMcpStop, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server }),
    });
  }

  async restartMCPServer(server: string): Promise<{ success: boolean; error?: string }> {
    return this.request<{ success: boolean; error?: string }>(API_PATHS.operatorMcpRestart, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server }),
    });
  }

  async getOperatorConversations(count: number = 10): Promise<OperatorConversationsResponse> {
    return this.request<OperatorConversationsResponse>(API_BUILDERS.operatorConversations(count));
  }

  async stopOperatorAgentSession(sessionId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_BUILDERS.operatorAgentSessionStop(sessionId), {
      method: 'POST',
    });
  }

  async getOperatorMessageQueues(): Promise<OperatorMessageQueuesResponse> {
    return this.request<OperatorMessageQueuesResponse>(API_PATHS.operatorMessageQueues);
  }

  async clearOperatorMessageQueue(conversationId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_BUILDERS.operatorMessageQueueClear(conversationId), {
      method: 'POST',
    });
  }

  async pauseOperatorMessageQueue(conversationId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_BUILDERS.operatorMessageQueuePause(conversationId), {
      method: 'POST',
    });
  }

  async resumeOperatorMessageQueue(conversationId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_BUILDERS.operatorMessageQueueResume(conversationId), {
      method: 'POST',
    });
  }

  async removeOperatorQueuedMessage(conversationId: string, messageId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_BUILDERS.operatorMessageQueueMessage(conversationId, messageId), {
      method: 'DELETE',
    });
  }

  async retryOperatorQueuedMessage(conversationId: string, messageId: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_BUILDERS.operatorMessageQueueMessageRetry(conversationId, messageId), {
      method: 'POST',
    });
  }

  async updateOperatorQueuedMessageText(conversationId: string, messageId: string, text: string): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_BUILDERS.operatorMessageQueueMessage(conversationId, messageId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  }

  async getOperatorRemoteServer(): Promise<OperatorRemoteServerStatus> {
    return this.request<OperatorRemoteServerStatus>(API_PATHS.operatorRemoteServer);
  }

  async getOperatorTunnel(): Promise<OperatorTunnelStatus> {
    return this.request<OperatorTunnelStatus>(API_PATHS.operatorTunnel);
  }

  async getOperatorTunnelSetup(): Promise<OperatorTunnelSetupSummary> {
    return this.request<OperatorTunnelSetupSummary>(API_PATHS.operatorTunnelSetup);
  }

  async startOperatorTunnel(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorTunnelStart, {
      method: 'POST',
    });
  }

  async stopOperatorTunnel(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorTunnelStop, {
      method: 'POST',
    });
  }

  async getOperatorIntegrations(): Promise<OperatorIntegrationsSummary> {
    return this.request<OperatorIntegrationsSummary>(API_PATHS.operatorIntegrations);
  }

  async getOperatorUpdater(): Promise<OperatorUpdaterStatus> {
    return this.request<OperatorUpdaterStatus>(API_PATHS.operatorUpdater);
  }

  async checkOperatorUpdater(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorUpdaterCheck, {
      method: 'POST',
    });
  }

  async downloadOperatorUpdateAsset(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorUpdaterDownloadLatest, {
      method: 'POST',
    });
  }

  async revealOperatorUpdateAsset(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorUpdaterRevealDownload, {
      method: 'POST',
    });
  }

  async openOperatorUpdateAsset(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorUpdaterOpenDownload, {
      method: 'POST',
    });
  }

  async openOperatorReleasesPage(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorUpdaterOpenReleases, {
      method: 'POST',
    });
  }

  async getOperatorDiscord(): Promise<OperatorDiscordIntegrationSummary> {
    return this.request<OperatorDiscordIntegrationSummary>(API_PATHS.operatorDiscord);
  }

  async getOperatorDiscordLogs(count: number = 20): Promise<OperatorDiscordLogsResponse> {
    return this.request<OperatorDiscordLogsResponse>(API_BUILDERS.operatorDiscordLogs(count));
  }

  async connectOperatorDiscord(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorDiscordConnect, {
      method: 'POST',
    });
  }

  async disconnectOperatorDiscord(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorDiscordDisconnect, {
      method: 'POST',
    });
  }

  async clearOperatorDiscordLogs(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorDiscordClearLogs, {
      method: 'POST',
    });
  }

  async getOperatorWhatsApp(): Promise<OperatorWhatsAppIntegrationSummary> {
    return this.request<OperatorWhatsAppIntegrationSummary>(API_PATHS.operatorWhatsApp);
  }

  async connectOperatorWhatsApp(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorWhatsAppConnect, {
      method: 'POST',
    });
  }

  async logoutOperatorWhatsApp(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorWhatsAppLogout, {
      method: 'POST',
    });
  }

  async getLocalSpeechModelStatuses(): Promise<LocalSpeechModelStatusesResponse> {
    return this.request<LocalSpeechModelStatusesResponse>(API_PATHS.operatorLocalSpeechModels);
  }

  async getLocalSpeechModelStatus(providerId: LocalSpeechModelProviderId): Promise<LocalSpeechModelStatus> {
    return this.request<LocalSpeechModelStatus>(API_BUILDERS.operatorLocalSpeechModel(providerId));
  }

  async downloadLocalSpeechModel(providerId: LocalSpeechModelProviderId): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_BUILDERS.operatorLocalSpeechModelDownload(providerId), {
      method: 'POST',
    });
  }

  async emergencyStop(): Promise<EmergencyStopResponse> {
    return this.request<EmergencyStopResponse>(API_PATHS.emergencyStop, {
      method: 'POST',
    });
  }

  async restartRemoteServer(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorRestartRemoteServer, {
      method: 'POST',
    });
  }

  async restartApp(): Promise<OperatorActionResponse> {
    return this.request<OperatorActionResponse>(API_PATHS.operatorRestartApp, {
      method: 'POST',
    });
  }

  async runOperatorAgent(request: OperatorRunAgentRequest): Promise<OperatorRunAgentResponse> {
    return this.request<OperatorRunAgentResponse>(API_PATHS.operatorRunAgent, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async rotateOperatorApiKey(): Promise<OperatorApiKeyRotationResponse> {
    return this.request<OperatorApiKeyRotationResponse>(API_PATHS.operatorRotateApiKey, {
      method: 'POST',
    });
  }

  // Conversation Sync Management
  async getConversations(): Promise<{ conversations: ServerConversation[] }> {
    return this.request<{ conversations: ServerConversation[] }>(API_PATHS.conversations);
  }

  async getConversation(id: string): Promise<ServerConversationFull> {
    return this.request<ServerConversationFull>(API_BUILDERS.conversation(id));
  }

  async createConversation(data: CreateConversationRequest): Promise<ServerConversationFull> {
    return this.request<ServerConversationFull>(API_PATHS.conversations, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConversation(id: string, data: UpdateConversationRequest): Promise<ServerConversationFull> {
    return this.request<ServerConversationFull>(API_BUILDERS.conversation(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export class ExtendedSettingsApiClient extends SettingsApiClient {
  // Register push notification token
  async registerPushToken(registration: PushTokenRegistration): Promise<{ success: boolean; message: string; tokenCount: number }> {
    return this.request(API_PATHS.pushRegister, {
      method: 'POST',
      body: JSON.stringify(registration),
    });
  }

  // Unregister push notification token
  async unregisterPushToken(token: string): Promise<{ success: boolean; message: string; tokenCount: number }> {
    return this.request(API_PATHS.pushUnregister, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Get push notification status
  async getPushStatus(): Promise<PushStatusResponse> {
    return this.request<PushStatusResponse>(API_PATHS.pushStatus);
  }

  // Clear server-side badge count for a push notification token
  async clearPushBadge(token: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(API_PATHS.pushClearBadge, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Synthesize speech through the desktop remote server and return raw audio bytes
  async synthesizeSpeech(request: TtsSpeakRequest): Promise<TtsSpeakResponse> {
    const response = await this.requestResponse(API_PATHS.ttsSpeak, {
      method: 'POST',
      headers: { Accept: 'audio/*' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw await this.createResponseError(response);
    }

    return {
      audio: await response.arrayBuffer(),
      mimeType: response.headers.get('content-type') || 'audio/mpeg',
      provider: response.headers.get('x-tts-provider') || undefined,
    };
  }

  // Skills Management
  async getSkills(): Promise<SkillsResponse> {
    return this.request<SkillsResponse>(API_PATHS.skills);
  }

  async getSkill(id: string): Promise<SkillResponse> {
    return this.request<SkillResponse>(API_BUILDERS.skill(id));
  }

  async createSkill(data: SkillCreateRequest): Promise<SkillMutationResponse> {
    return this.request<SkillMutationResponse>(API_PATHS.skills, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async importSkillFromMarkdown(content: string): Promise<SkillMutationResponse> {
    const data: SkillImportMarkdownRequest = { content };
    return this.request<SkillMutationResponse>(API_PATHS.skillImportMarkdown, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async importSkillFromGitHub(repoIdentifier: string): Promise<SkillImportGitHubResponse> {
    const data: SkillImportGitHubRequest = { repoIdentifier };
    return this.request<SkillImportGitHubResponse>(API_PATHS.skillImportGitHub, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exportSkillToMarkdown(id: string): Promise<SkillExportMarkdownResponse> {
    return this.request<SkillExportMarkdownResponse>(API_BUILDERS.skillExportMarkdown(id));
  }

  async updateSkill(id: string, data: SkillUpdateRequest): Promise<SkillMutationResponse> {
    return this.request<SkillMutationResponse>(API_BUILDERS.skill(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSkill(id: string): Promise<SkillDeleteResponse> {
    return this.request<SkillDeleteResponse>(API_BUILDERS.skill(id), {
      method: 'DELETE',
    });
  }

  async toggleSkillForProfile(skillId: string): Promise<SkillToggleResponse> {
    return this.request<SkillToggleResponse>(API_BUILDERS.skillToggleProfile(skillId), {
      method: 'POST',
    });
  }

  // Knowledge Notes Management
  async getKnowledgeNotes(filter: KnowledgeNotesListRequest = {}): Promise<KnowledgeNotesResponse> {
    return this.request<KnowledgeNotesResponse>(buildRemoteServerApiQueryPath(API_PATHS.knowledgeNotes, {
      context: filter.context,
      dateFilter: filter.dateFilter,
      sort: filter.sort,
      limit: filter.limit,
    }));
  }

  async getKnowledgeNote(id: string): Promise<KnowledgeNoteResponse> {
    return this.request<KnowledgeNoteResponse>(API_BUILDERS.knowledgeNote(id));
  }

  async searchKnowledgeNotes(data: KnowledgeNoteSearchRequest): Promise<KnowledgeNotesResponse> {
    return this.request<KnowledgeNotesResponse>(API_PATHS.knowledgeNotesSearch, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createKnowledgeNote(data: KnowledgeNoteCreateRequest): Promise<KnowledgeNoteResponse> {
    return this.request<KnowledgeNoteResponse>(API_PATHS.knowledgeNotes, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateKnowledgeNote(id: string, data: KnowledgeNoteUpdateRequest): Promise<KnowledgeNoteMutationResponse> {
    return this.request<KnowledgeNoteMutationResponse>(API_BUILDERS.knowledgeNote(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteKnowledgeNote(id: string): Promise<KnowledgeNoteDeleteResponse> {
    return this.request<KnowledgeNoteDeleteResponse>(API_BUILDERS.knowledgeNote(id), {
      method: 'DELETE',
    });
  }

  async deleteKnowledgeNotes(ids: string[]): Promise<KnowledgeNotesDeleteMultipleResponse> {
    return this.request<KnowledgeNotesDeleteMultipleResponse>(API_PATHS.knowledgeNotesDeleteMultiple, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async deleteAllKnowledgeNotes(): Promise<KnowledgeNotesDeleteAllResponse> {
    return this.request<KnowledgeNotesDeleteAllResponse>(API_PATHS.knowledgeNotesDeleteAll, {
      method: 'POST',
    });
  }

  // Agent Profiles Management
  async getAgentProfiles(): Promise<ApiAgentProfilesResponse> {
    return this.request<ApiAgentProfilesResponse>(API_PATHS.agentProfiles);
  }

  async getAgentProfile(id: string): Promise<{ profile: ApiAgentProfileFull }> {
    return this.request<{ profile: ApiAgentProfileFull }>(API_BUILDERS.agentProfile(id));
  }

  async verifyExternalAgentCommand(data: VerifyExternalAgentCommandRequest): Promise<VerifyExternalAgentCommandResponse> {
    return this.request<VerifyExternalAgentCommandResponse>(API_PATHS.agentProfileVerifyCommand, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reloadAgentProfiles(): Promise<AgentProfilesReloadResponse> {
    return this.request<AgentProfilesReloadResponse>(API_PATHS.agentProfilesReload, {
      method: 'POST',
    });
  }

  async createAgentProfile(data: AgentProfileCreateRequest): Promise<{ profile: ApiAgentProfileFull }> {
    return this.request<{ profile: ApiAgentProfileFull }>(API_PATHS.agentProfiles, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgentProfile(id: string, data: AgentProfileUpdateRequest): Promise<{ success: boolean; profile: ApiAgentProfileFull }> {
    return this.request<{ success: boolean; profile: ApiAgentProfileFull }>(API_BUILDERS.agentProfile(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAgentProfile(id: string): Promise<AgentProfileDeleteResponse> {
    return this.request<AgentProfileDeleteResponse>(API_BUILDERS.agentProfile(id), {
      method: 'DELETE',
    });
  }

  async toggleAgentProfile(id: string): Promise<AgentProfileToggleResponse> {
    return this.request<AgentProfileToggleResponse>(API_BUILDERS.agentProfileToggle(id), {
      method: 'POST',
    });
  }

  // Agent Loops Management
  async getLoops(): Promise<LoopsResponse> {
    return this.request<LoopsResponse>(API_PATHS.loops);
  }

  async getLoopStatuses(): Promise<LoopStatusesResponse> {
    return this.request<LoopStatusesResponse>(API_PATHS.loopStatuses);
  }

  async createLoop(data: LoopCreateRequest): Promise<{ loop: Loop }> {
    return this.request<{ loop: Loop }>(API_PATHS.loops, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async importLoopFromMarkdown(content: string): Promise<LoopMutationResponse> {
    const data: LoopImportMarkdownRequest = { content };
    return this.request<LoopMutationResponse>(API_PATHS.loopImportMarkdown, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exportLoopToMarkdown(id: string): Promise<LoopExportMarkdownResponse> {
    return this.request<LoopExportMarkdownResponse>(API_BUILDERS.loopExportMarkdown(id));
  }

  async updateLoop(id: string, data: LoopUpdateRequest): Promise<LoopMutationResponse> {
    return this.request<LoopMutationResponse>(API_BUILDERS.loop(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteLoop(id: string): Promise<LoopDeleteResponse> {
    return this.request<LoopDeleteResponse>(API_BUILDERS.loop(id), {
      method: 'DELETE',
    });
  }

  async toggleLoop(id: string): Promise<LoopToggleResponse> {
    return this.request<LoopToggleResponse>(API_BUILDERS.loopToggle(id), {
      method: 'POST',
    });
  }

  async runLoop(id: string): Promise<LoopRunResponse> {
    return this.request<LoopRunResponse>(API_BUILDERS.loopRun(id), {
      method: 'POST',
    });
  }

  async startLoop(id: string): Promise<LoopRuntimeActionResponse> {
    return this.request<LoopRuntimeActionResponse>(API_BUILDERS.loopStart(id), {
      method: 'POST',
    });
  }

  async stopLoop(id: string): Promise<LoopRuntimeActionResponse> {
    return this.request<LoopRuntimeActionResponse>(API_BUILDERS.loopStop(id), {
      method: 'POST',
    });
  }
}

export function createSettingsApiClient(baseUrl: string, apiKey: string, options?: SettingsApiClientOptions): SettingsApiClient {
  return new SettingsApiClient(baseUrl, apiKey, options);
}

export function createExtendedSettingsApiClient(
  baseUrl: string,
  apiKey: string,
  options?: SettingsApiClientOptions,
): ExtendedSettingsApiClient {
  return new ExtendedSettingsApiClient(baseUrl, apiKey, options);
}
