import type { CHAT_PROVIDER_ID, ModelPreset } from './providers';
import { DEFAULT_AGENT_PROVIDER_ID, DEFAULT_MODEL_PRESET_ID, getBuiltInModelPresets, isChatProviderId } from './providers';
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

export type ModelPresetActionResult = {
  statusCode: number;
  body: unknown;
  auditContext?: ModelPresetMutationAuditContext;
};

type ModelPresetMaybePromise<T> = T | Promise<T>;

export interface ModelPresetActionConfigLike extends ModelPresetConfigLike, Partial<ModelPresetActivationUpdates> {}

export interface ModelPresetActionStore<TConfig extends ModelPresetActionConfigLike = ModelPresetActionConfigLike> {
  get(): TConfig;
  save(config: TConfig): ModelPresetMaybePromise<void>;
}

export interface ModelPresetActionDiagnostics {
  logError(source: string, message: string, error: unknown): void;
}

export interface ModelPresetActionOptions<TConfig extends ModelPresetActionConfigLike = ModelPresetActionConfigLike> {
  config: ModelPresetActionStore<TConfig>;
  diagnostics: ModelPresetActionDiagnostics;
  createPresetId(): string;
  now(): number;
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

function modelPresetActionOk(
  body: unknown,
  auditContext?: ModelPresetMutationAuditContext,
): ModelPresetActionResult {
  return {
    statusCode: 200,
    body,
    ...(auditContext ? { auditContext } : {}),
  };
}

function modelPresetActionError(
  statusCode: number,
  message: string,
  auditContext?: ModelPresetMutationAuditContext,
): ModelPresetActionResult {
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

export async function getOperatorModelPresetsAction<TConfig extends ModelPresetActionConfigLike>(
  secretMask: string,
  options: ModelPresetActionOptions<TConfig>,
): Promise<ModelPresetActionResult> {
  try {
    return modelPresetActionOk(buildModelPresetsResponse(options.config.get(), secretMask));
  } catch (caughtError) {
    options.diagnostics.logError(
      'operator-model-preset-actions',
      'Failed to build model preset summaries',
      caughtError,
    );
    return modelPresetActionError(500, 'Failed to build model preset summaries');
  }
}

export async function createOperatorModelPresetAction<TConfig extends ModelPresetActionConfigLike>(
  body: unknown,
  secretMask: string,
  options: ModelPresetActionOptions<TConfig>,
): Promise<ModelPresetActionResult> {
  try {
    const parsedRequest = parseModelPresetCreateRequestBody(body);
    if (parsedRequest.ok === false) {
      return modelPresetActionError(parsedRequest.statusCode, parsedRequest.error);
    }

    const preset = buildCustomModelPresetFromRequest(
      options.createPresetId(),
      parsedRequest.request,
      options.now(),
    );

    const cfg = options.config.get();
    const nextConfig = {
      ...cfg,
      modelPresets: [...getSavedModelPresets(cfg), preset],
    } as TConfig;
    await options.config.save(nextConfig);

    return modelPresetActionOk(
      buildModelPresetMutationResponse(nextConfig, secretMask, { preset }),
      buildModelPresetCreateAuditContext(preset),
    );
  } catch (caughtError) {
    const message = getUnknownErrorMessage(caughtError, '');
    options.diagnostics.logError('operator-model-preset-actions', 'Failed to create model preset', caughtError);
    return modelPresetActionError(
      500,
      message || 'Failed to create model preset',
      buildModelPresetMutationFailureAuditContext('model-preset-create', message),
    );
  }
}

export async function updateOperatorModelPresetAction<TConfig extends ModelPresetActionConfigLike>(
  presetId: string | undefined,
  body: unknown,
  secretMask: string,
  options: ModelPresetActionOptions<TConfig>,
): Promise<ModelPresetActionResult> {
  if (!presetId) {
    return modelPresetActionError(400, 'Missing preset ID');
  }

  try {
    const cfg = options.config.get();
    const existingPreset = getMergedModelPresetById(cfg, presetId);
    if (!existingPreset) {
      return modelPresetActionError(404, 'Model preset not found');
    }

    const patch = buildModelPresetUpdatePatch(body, existingPreset, secretMask);
    const nextPresets = upsertModelPresetOverride(cfg, presetId, patch);
    const updatedPreset = getMergedModelPresetById({ ...cfg, modelPresets: nextPresets }, presetId);
    if (!updatedPreset) {
      return modelPresetActionError(404, 'Model preset not found');
    }

    const updates = { modelPresets: nextPresets } as Partial<TConfig>;
    if ((cfg.currentModelPresetId || DEFAULT_MODEL_PRESET_ID) === presetId) {
      Object.assign(updates, getModelPresetActivationUpdates(updatedPreset) as Partial<TConfig>);
    }

    const nextConfig = { ...cfg, ...updates } as TConfig;
    await options.config.save(nextConfig);

    return modelPresetActionOk(
      buildModelPresetMutationResponse(nextConfig, secretMask, { preset: updatedPreset }),
      buildModelPresetUpdateAuditContext(presetId, patch),
    );
  } catch (caughtError) {
    const message = getUnknownErrorMessage(caughtError, '');
    options.diagnostics.logError('operator-model-preset-actions', 'Failed to update model preset', caughtError);
    return modelPresetActionError(
      500,
      message || 'Failed to update model preset',
      buildModelPresetMutationFailureAuditContext('model-preset-update', message, presetId),
    );
  }
}

export async function deleteOperatorModelPresetAction<TConfig extends ModelPresetActionConfigLike>(
  presetId: string | undefined,
  secretMask: string,
  options: ModelPresetActionOptions<TConfig>,
): Promise<ModelPresetActionResult> {
  if (!presetId) {
    return modelPresetActionError(400, 'Missing preset ID');
  }

  try {
    const cfg = options.config.get();
    const preset = getMergedModelPresetById(cfg, presetId);
    if (!preset) {
      return modelPresetActionError(404, 'Model preset not found');
    }
    if (preset.isBuiltIn) {
      return modelPresetActionError(400, 'Built-in presets cannot be deleted');
    }

    const defaultPreset = getMergedModelPresetById(cfg, DEFAULT_MODEL_PRESET_ID);
    const updates = {
      modelPresets: getSavedModelPresets(cfg).filter((candidate) => candidate.id !== presetId),
    } as Partial<TConfig>;
    const switchedToDefault = (cfg.currentModelPresetId || DEFAULT_MODEL_PRESET_ID) === presetId;
    if (switchedToDefault && defaultPreset) {
      Object.assign(updates, getModelPresetActivationUpdates(defaultPreset) as Partial<TConfig>);
    }

    const nextConfig = { ...cfg, ...updates } as TConfig;
    await options.config.save(nextConfig);

    return modelPresetActionOk(
      buildModelPresetMutationResponse(nextConfig, secretMask, { deletedPresetId: presetId }),
      buildModelPresetDeleteAuditContext(presetId, switchedToDefault),
    );
  } catch (caughtError) {
    const message = getUnknownErrorMessage(caughtError, '');
    options.diagnostics.logError('operator-model-preset-actions', 'Failed to delete model preset', caughtError);
    return modelPresetActionError(
      500,
      message || 'Failed to delete model preset',
      buildModelPresetMutationFailureAuditContext('model-preset-delete', message, presetId),
    );
  }
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
  return DEFAULT_AGENT_PROVIDER_ID;
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
  const provider = cfg.agentProviderId || cfg.mcpToolsProviderId || DEFAULT_AGENT_PROVIDER_ID;
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
