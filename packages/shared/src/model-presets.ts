import type { CHAT_PROVIDER_ID, ModelPreset } from './providers';
import { DEFAULT_MODEL_PRESET_ID, getBuiltInModelPresets, isChatProviderId } from './providers';
import type {
  ModelPresetCreateRequest,
  ModelPresetMutationResponse,
  ModelPresetSummary,
  ModelPresetsResponse,
} from './api-types';

export interface ModelPresetConfigLike {
  modelPresets?: ModelPreset[];
  openaiApiKey?: string;
  currentModelPresetId?: string;
}

export interface ModelPresetActivationUpdates {
  currentModelPresetId: string;
  openaiBaseUrl: string;
  openaiApiKey: string;
  agentOpenaiModel?: string;
  mcpToolsOpenaiModel?: string;
  transcriptPostProcessingOpenaiModel?: string;
}

export interface ModelPresetConfigMutationUpdates {
  modelPresets: ModelPreset[];
  currentModelPresetId?: string;
  openaiBaseUrl?: string;
  openaiApiKey?: string;
}

export interface ActiveModelConfigLike {
  agentProviderId?: CHAT_PROVIDER_ID | string;
  mcpToolsProviderId?: CHAT_PROVIDER_ID | string;
  agentOpenaiModel?: string;
  mcpToolsOpenaiModel?: string;
  agentGroqModel?: string;
  mcpToolsGroqModel?: string;
  agentGeminiModel?: string;
  mcpToolsGeminiModel?: string;
  agentChatgptWebModel?: string;
  mcpToolsChatgptWebModel?: string;
}

export interface AgentModelConfigLike extends ActiveModelConfigLike, ModelPresetConfigLike {}

export type AgentModelSettingKey =
  | 'agentOpenaiModel'
  | 'agentGroqModel'
  | 'agentGeminiModel'
  | 'agentChatgptWebModel';

export type McpToolsModelSettingKey =
  | 'mcpToolsOpenaiModel'
  | 'mcpToolsGroqModel'
  | 'mcpToolsGeminiModel'
  | 'mcpToolsChatgptWebModel';

export type PresetModelSelectionType = 'agentModel' | 'transcriptProcessingModel';

export type OpenAiPresetModelSettingKey =
  | 'agentOpenaiModel'
  | 'mcpToolsOpenaiModel'
  | 'transcriptPostProcessingOpenaiModel';

export type ModelOptionLike = {
  id: string;
  name?: string;
};

export type ResolveConfiguredAgentModelOptions = {
  includeFallback?: boolean;
  includeOpenAiPresetFallback?: boolean;
};

export const AGENT_MODEL_FALLBACKS: Record<CHAT_PROVIDER_ID, string> = {
  openai: 'gpt-4.1-mini',
  groq: 'openai/gpt-oss-120b',
  gemini: 'gemini-2.5-flash',
  'chatgpt-web': 'gpt-5.4-mini',
};

export type ModelPresetCreateParseResult =
  | { ok: true; request: ModelPresetCreateRequest }
  | { ok: false; statusCode: 400; error: string };

export type ModelPresetMutationAuditAction =
  | 'model-preset-create'
  | 'model-preset-update'
  | 'model-preset-delete';

export interface ModelPresetMutationAuditContext {
  action: ModelPresetMutationAuditAction;
  success: boolean;
  details?: Record<string, unknown>;
  failureReason?: string;
}

function getRequestRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
}

export function getSavedModelPresets(cfg: Pick<ModelPresetConfigLike, 'modelPresets'>): ModelPreset[] {
  return Array.isArray(cfg.modelPresets) ? cfg.modelPresets : [];
}

export function getMergedModelPresets(
  cfg: Pick<ModelPresetConfigLike, 'modelPresets' | 'openaiApiKey'>,
): ModelPreset[] {
  const builtInPresets = getBuiltInModelPresets();
  const savedPresets = getSavedModelPresets(cfg);
  const builtInIds = new Set(builtInPresets.map((preset) => preset.id));

  const mergedBuiltIn = builtInPresets.map((builtIn) => {
    const savedOverride = savedPresets.find((preset) => preset.id === builtIn.id);
    const merged: ModelPreset = savedOverride
      ? { ...builtIn, ...savedOverride, isBuiltIn: true }
      : { ...builtIn, isBuiltIn: true };

    if (merged.id === DEFAULT_MODEL_PRESET_ID && !merged.apiKey && cfg.openaiApiKey) {
      return { ...merged, apiKey: cfg.openaiApiKey };
    }

    return merged;
  });

  const customPresets = savedPresets
    .filter((preset) => !builtInIds.has(preset.id))
    .map((preset) => ({ ...preset, isBuiltIn: false }));

  return [...mergedBuiltIn, ...customPresets];
}

export function getMergedModelPresetById(
  cfg: Pick<ModelPresetConfigLike, 'modelPresets' | 'openaiApiKey'>,
  presetId: string,
): ModelPreset | undefined {
  return getMergedModelPresets(cfg).find((preset) => preset.id === presetId);
}

export function formatModelPresetSummary(preset: ModelPreset, secretMask: string): ModelPresetSummary {
  const { apiKey: _apiKey, ...summary } = preset;
  const hasApiKey = !!(typeof preset.apiKey === 'string' && preset.apiKey.length > 0);

  return {
    ...summary,
    isBuiltIn: preset.isBuiltIn ?? false,
    apiKey: hasApiKey ? secretMask : '',
    hasApiKey,
  };
}

export function buildModelPresetsResponse(
  cfg: ModelPresetConfigLike,
  secretMask: string,
): ModelPresetsResponse {
  return {
    currentModelPresetId: cfg.currentModelPresetId || DEFAULT_MODEL_PRESET_ID,
    presets: getMergedModelPresets(cfg).map((preset) => formatModelPresetSummary(preset, secretMask)),
  };
}

export function buildModelPresetMutationResponse(
  cfg: ModelPresetConfigLike,
  secretMask: string,
  options: {
    preset?: ModelPreset;
    deletedPresetId?: string;
  } = {},
): ModelPresetMutationResponse {
  return {
    success: true,
    ...buildModelPresetsResponse(cfg, secretMask),
    ...(options.preset ? { preset: formatModelPresetSummary(options.preset, secretMask) } : {}),
    ...(options.deletedPresetId ? { deletedPresetId: options.deletedPresetId } : {}),
  };
}

export function buildModelPresetCreateAuditContext(
  preset: Pick<ModelPreset, 'id' | 'apiKey'>,
): ModelPresetMutationAuditContext {
  return {
    action: 'model-preset-create',
    success: true,
    details: {
      presetId: preset.id,
      hasApiKey: !!preset.apiKey,
    },
  };
}

export function buildModelPresetUpdateAuditContext(
  presetId: string,
  patch: Partial<ModelPreset>,
): ModelPresetMutationAuditContext {
  return {
    action: 'model-preset-update',
    success: true,
    details: {
      presetId,
      updated: Object.keys(patch).filter((key) => key !== 'apiKey'),
      ...(patch.apiKey !== undefined ? { apiKeyUpdated: true } : {}),
    },
  };
}

export function buildModelPresetDeleteAuditContext(
  presetId: string,
  switchedToDefault: boolean,
): ModelPresetMutationAuditContext {
  return {
    action: 'model-preset-delete',
    success: true,
    details: { presetId, switchedToDefault },
  };
}

export function buildModelPresetMutationFailureAuditContext(
  action: ModelPresetMutationAuditAction,
  failureReason: string,
  presetId?: string,
): ModelPresetMutationAuditContext {
  return {
    action,
    success: false,
    ...(presetId ? { details: { presetId } } : {}),
    failureReason,
  };
}

export function getModelPresetActivationUpdates(preset: ModelPreset): ModelPresetActivationUpdates {
  const updates: ModelPresetActivationUpdates = {
    currentModelPresetId: preset.id,
    openaiBaseUrl: preset.baseUrl,
    openaiApiKey: preset.apiKey || '',
  };

  const agentModel = preset.agentModel || preset.mcpToolsModel;
  if (agentModel) {
    updates.agentOpenaiModel = agentModel;
    updates.mcpToolsOpenaiModel = agentModel;
  }
  if (preset.transcriptProcessingModel) {
    updates.transcriptPostProcessingOpenaiModel = preset.transcriptProcessingModel;
  }

  return updates;
}

export function resolveAgentProviderId(cfg?: ActiveModelConfigLike | null): CHAT_PROVIDER_ID {
  const agentProviderId = cfg?.agentProviderId;
  if (isChatProviderId(agentProviderId)) return agentProviderId;
  const mcpToolsProviderId = cfg?.mcpToolsProviderId;
  if (isChatProviderId(mcpToolsProviderId)) return mcpToolsProviderId;
  return 'openai';
}

export function getAgentModelSettingKey(providerId: CHAT_PROVIDER_ID | string): AgentModelSettingKey {
  if (providerId === 'openai') return 'agentOpenaiModel';
  if (providerId === 'groq') return 'agentGroqModel';
  if (providerId === 'gemini') return 'agentGeminiModel';
  return 'agentChatgptWebModel';
}

export function getMcpToolsModelSettingKey(providerId: CHAT_PROVIDER_ID | string): McpToolsModelSettingKey {
  if (providerId === 'openai') return 'mcpToolsOpenaiModel';
  if (providerId === 'groq') return 'mcpToolsGroqModel';
  if (providerId === 'gemini') return 'mcpToolsGeminiModel';
  return 'mcpToolsChatgptWebModel';
}

export function getAgentModelPlaceholder(providerId: CHAT_PROVIDER_ID | string): string {
  const normalizedProviderId: CHAT_PROVIDER_ID = isChatProviderId(providerId) ? providerId : 'chatgpt-web';
  return AGENT_MODEL_FALLBACKS[normalizedProviderId];
}

export function getActiveModelPreset(
  cfg?: AgentModelConfigLike | null,
): ModelPreset | undefined {
  if (!cfg) return undefined;
  const currentPresetId = cfg.currentModelPresetId || DEFAULT_MODEL_PRESET_ID;
  return getMergedModelPresets(cfg).find((preset) => preset.id === currentPresetId);
}

export function resolveConfiguredAgentModel(
  cfg?: AgentModelConfigLike | null,
  providerId: CHAT_PROVIDER_ID | string = resolveAgentProviderId(cfg),
  options: ResolveConfiguredAgentModelOptions = {},
): string {
  if (!cfg) {
    return options.includeFallback === false ? '' : getAgentModelPlaceholder(providerId);
  }

  const includeFallback = options.includeFallback !== false;
  const normalizedProviderId = isChatProviderId(providerId) ? providerId : 'chatgpt-web';

  if (normalizedProviderId === 'openai') {
    const activePreset = options.includeOpenAiPresetFallback === false
      ? undefined
      : getActiveModelPreset(cfg);
    return cfg.agentOpenaiModel
      || cfg.mcpToolsOpenaiModel
      || activePreset?.agentModel
      || activePreset?.mcpToolsModel
      || (includeFallback ? AGENT_MODEL_FALLBACKS.openai : '');
  }
  if (normalizedProviderId === 'groq') {
    return cfg.agentGroqModel || cfg.mcpToolsGroqModel || (includeFallback ? AGENT_MODEL_FALLBACKS.groq : '');
  }
  if (normalizedProviderId === 'gemini') {
    return cfg.agentGeminiModel || cfg.mcpToolsGeminiModel || (includeFallback ? AGENT_MODEL_FALLBACKS.gemini : '');
  }
  return cfg.agentChatgptWebModel
    || cfg.mcpToolsChatgptWebModel
    || (includeFallback ? AGENT_MODEL_FALLBACKS['chatgpt-web'] : '');
}

export function resolveActiveModelId(cfg: ActiveModelConfigLike): string {
  const provider = cfg.agentProviderId || cfg.mcpToolsProviderId || 'openai';
  if (provider === 'openai') return cfg.agentOpenaiModel || cfg.mcpToolsOpenaiModel || 'openai';
  if (provider === 'groq') return cfg.agentGroqModel || cfg.mcpToolsGroqModel || 'groq';
  if (provider === 'gemini') return cfg.agentGeminiModel || cfg.mcpToolsGeminiModel || 'gemini';
  if (provider === 'chatgpt-web') return cfg.agentChatgptWebModel || cfg.mcpToolsChatgptWebModel || 'gpt-5.4-mini';
  return String(provider);
}

export function upsertModelPresetOverride(
  cfg: ModelPresetConfigLike,
  presetId: string,
  patch: Partial<ModelPreset>,
  now: number = Date.now(),
): ModelPreset[] {
  const savedPresets = getSavedModelPresets(cfg);
  const savedIndex = savedPresets.findIndex((preset) => preset.id === presetId);
  const savedPreset = savedIndex >= 0 ? savedPresets[savedIndex] : undefined;
  const builtInPreset = getBuiltInModelPresets().find((preset) => preset.id === presetId);
  const mergedPreset = getMergedModelPresetById(cfg, presetId);

  if (!savedPreset && !builtInPreset && !mergedPreset) {
    return savedPresets;
  }

  const basePreset: ModelPreset = savedPreset
    ? savedPreset
    : builtInPreset
      ? { ...builtInPreset, apiKey: '', isBuiltIn: true }
      : { ...mergedPreset!, isBuiltIn: false };

  const nextPreset: ModelPreset = {
    ...basePreset,
    ...patch,
    isBuiltIn: builtInPreset ? true : false,
    updatedAt: now,
  };

  if (savedIndex >= 0) {
    return savedPresets.map((preset) => (preset.id === presetId ? nextPreset : preset));
  }

  return [...savedPresets, nextPreset];
}

export function buildAgentModelConfigUpdates(
  cfg: AgentModelConfigLike,
  providerId: CHAT_PROVIDER_ID | string,
  modelId: string,
  now: number = Date.now(),
): Partial<AgentModelConfigLike> {
  if (providerId === 'openai') {
    const currentPresetId = cfg.currentModelPresetId || DEFAULT_MODEL_PRESET_ID;
    const existingPresets = getSavedModelPresets(cfg);
    const existingPreset = existingPresets.find((preset) => preset.id === currentPresetId);
    const builtInPreset = getBuiltInModelPresets().find((preset) => preset.id === currentPresetId);
    const presetBase = existingPreset || builtInPreset;
    const updatedPreset: ModelPreset | undefined = presetBase
      ? {
        ...presetBase,
        apiKey: presetBase.apiKey || (currentPresetId === DEFAULT_MODEL_PRESET_ID ? cfg.openaiApiKey || '' : ''),
        agentModel: modelId,
        mcpToolsModel: modelId,
        updatedAt: now,
      }
      : undefined;

    return {
      agentOpenaiModel: modelId,
      mcpToolsOpenaiModel: modelId,
      ...(updatedPreset
        ? {
          modelPresets: existingPreset
            ? existingPresets.map((preset) => (preset.id === currentPresetId ? updatedPreset : preset))
            : [...existingPresets, updatedPreset],
        }
        : {}),
    };
  }

  if (providerId === 'groq') {
    return { agentGroqModel: modelId, mcpToolsGroqModel: modelId };
  }
  if (providerId === 'gemini') {
    return { agentGeminiModel: modelId, mcpToolsGeminiModel: modelId };
  }
  return { agentChatgptWebModel: modelId, mcpToolsChatgptWebModel: modelId };
}

export function buildPresetModelSelectionUpdates(
  cfg: ModelPresetConfigLike,
  presetId: string,
  modelType: PresetModelSelectionType,
  globalConfigKey: OpenAiPresetModelSettingKey,
  modelId: string,
  now: number = Date.now(),
): Partial<ModelPresetConfigLike> & Partial<Record<OpenAiPresetModelSettingKey, string>> {
  return {
    [globalConfigKey]: modelId,
    modelPresets: upsertModelPresetOverride(cfg, presetId, {
      [modelType]: modelId,
    }, now),
  } as Partial<ModelPresetConfigLike> & Partial<Record<OpenAiPresetModelSettingKey, string>>;
}

export function buildModelPresetEditUpdates(
  cfg: ModelPresetConfigLike,
  editedPreset: ModelPreset,
  currentPresetId: string = cfg.currentModelPresetId || DEFAULT_MODEL_PRESET_ID,
  now: number = Date.now(),
): ModelPresetConfigMutationUpdates {
  const savedPresets = getSavedModelPresets(cfg);
  const nextPreset = { ...editedPreset, updatedAt: now };
  const savedIndex = savedPresets.findIndex((preset) => preset.id === editedPreset.id);
  const modelPresets = savedIndex >= 0
    ? savedPresets.map((preset) => (preset.id === editedPreset.id ? nextPreset : preset))
    : [...savedPresets, nextPreset];

  return {
    modelPresets,
    ...(editedPreset.id === currentPresetId
      ? {
        openaiBaseUrl: editedPreset.baseUrl,
        openaiApiKey: editedPreset.apiKey || '',
      }
      : {}),
  };
}

export function buildModelPresetDeleteUpdates(
  cfg: ModelPresetConfigLike,
  presetId: string,
  currentPresetId: string = cfg.currentModelPresetId || DEFAULT_MODEL_PRESET_ID,
): ModelPresetConfigMutationUpdates {
  const modelPresets = getSavedModelPresets(cfg).filter((preset) => preset.id !== presetId);

  if (presetId !== currentPresetId) {
    return { modelPresets };
  }

  const defaultPreset = getMergedModelPresetById({
    ...cfg,
    modelPresets,
  }, DEFAULT_MODEL_PRESET_ID);

  return {
    modelPresets,
    currentModelPresetId: DEFAULT_MODEL_PRESET_ID,
    openaiBaseUrl: defaultPreset?.baseUrl || '',
    openaiApiKey: defaultPreset?.apiKey || '',
  };
}

export function filterModelOptionsByQuery<T extends ModelOptionLike>(models: T[], searchQuery: string): T[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return models;
  return models.filter((model) => (
    model.id.toLowerCase().includes(query)
    || (model.name ?? '').toLowerCase().includes(query)
  ));
}

export function normalizeModelPresetString(value: unknown, maxLength: number = 500): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.trim().slice(0, maxLength);
}

export function parseModelPresetCreateRequestBody(body: unknown): ModelPresetCreateParseResult {
  const requestBody = getRequestRecord(body);
  const name = normalizeModelPresetString(requestBody.name, 120);
  const baseUrl = normalizeModelPresetString(requestBody.baseUrl, 500);

  if (!name) {
    return { ok: false, statusCode: 400, error: 'Preset name is required' };
  }
  if (!baseUrl) {
    return { ok: false, statusCode: 400, error: 'Preset base URL is required' };
  }

  return {
    ok: true,
    request: {
      name,
      baseUrl,
      apiKey: normalizeModelPresetString(requestBody.apiKey, 2000) || '',
      agentModel: normalizeModelPresetString(requestBody.agentModel ?? requestBody.mcpToolsModel, 300) || '',
      transcriptProcessingModel: normalizeModelPresetString(requestBody.transcriptProcessingModel, 300) || '',
    },
  };
}

export function buildCustomModelPresetFromRequest(
  id: string,
  request: ModelPresetCreateRequest,
  now: number,
): ModelPreset {
  return {
    id,
    name: request.name,
    baseUrl: request.baseUrl,
    apiKey: request.apiKey || '',
    isBuiltIn: false,
    createdAt: now,
    updatedAt: now,
    agentModel: request.agentModel || request.mcpToolsModel || '',
    transcriptProcessingModel: request.transcriptProcessingModel || '',
  };
}

export function buildModelPresetUpdatePatch(
  body: unknown,
  existingPreset: Pick<ModelPreset, 'isBuiltIn'>,
  secretMask: string,
): Partial<ModelPreset> {
  const requestBody = getRequestRecord(body);
  const patch: Partial<ModelPreset> = {};

  if (!existingPreset.isBuiltIn) {
    const name = normalizeModelPresetString(requestBody.name, 120);
    const baseUrl = normalizeModelPresetString(requestBody.baseUrl, 500);
    if (name !== undefined) patch.name = name;
    if (baseUrl !== undefined) patch.baseUrl = baseUrl;
  }

  const apiKey = normalizeModelPresetString(requestBody.apiKey, 2000);
  if (apiKey !== undefined && apiKey !== secretMask && apiKey.length > 0) {
    patch.apiKey = apiKey;
  }

  const agentModel = normalizeModelPresetString(requestBody.agentModel ?? requestBody.mcpToolsModel, 300);
  if (agentModel !== undefined) {
    patch.agentModel = agentModel;
  }

  const transcriptProcessingModel = normalizeModelPresetString(requestBody.transcriptProcessingModel, 300);
  if (transcriptProcessingModel !== undefined) {
    patch.transcriptProcessingModel = transcriptProcessingModel;
  }

  return patch;
}
