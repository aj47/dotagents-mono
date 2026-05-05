import { describe, expect, it } from 'vitest';
import {
  AGENT_MODEL_FALLBACKS,
  buildAgentModelConfigUpdates,
  buildCustomModelPresetFromRequest,
  buildModelPresetDeleteUpdates,
  buildModelPresetEditUpdates,
  buildModelPresetCreateAuditContext,
  buildModelPresetDeleteAuditContext,
  buildModelPresetMutationFailureAuditContext,
  buildModelPresetMutationResponse,
  buildModelPresetUpdatePatch,
  buildModelPresetUpdateAuditContext,
  buildModelPresetsResponse,
  createOperatorModelPresetAction,
  deleteOperatorModelPresetAction,
  buildPresetModelSelectionUpdates,
  filterModelOptionsByQuery,
  formatModelPresetSummary,
  getActiveModelPreset,
  getAgentModelPlaceholder,
  getAgentModelSettingKey,
  getMergedModelPresetById,
  getMergedModelPresets,
  getMcpToolsModelSettingKey,
  getModelPresetActivationUpdates,
  getOperatorModelPresetsAction,
  normalizeModelPresetString,
  parseModelPresetCreateRequestBody,
  resolveActiveModelId,
  resolveAgentProviderId,
  resolveConfiguredAgentModel,
  updateOperatorModelPresetAction,
  upsertModelPresetOverride,
  type ModelPresetActionConfigLike,
  type ModelPresetActionOptions,
} from './model-presets';
import { DEFAULT_MODEL_PRESET_ID, type ModelPreset } from './providers';

describe('model preset helpers', () => {
  it('merges built-in presets with saved overrides and custom presets', () => {
    const presets = getMergedModelPresets({
      openaiApiKey: 'sk-legacy',
      modelPresets: [
        {
          id: DEFAULT_MODEL_PRESET_ID,
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: '',
          isBuiltIn: true,
          agentModel: 'gpt-4.1-mini',
        },
        {
          id: 'custom-local',
          name: 'Local',
          baseUrl: 'http://127.0.0.1:11434/v1',
          apiKey: 'local-key',
          isBuiltIn: false,
        },
      ],
    });

    expect(presets.find((preset) => preset.id === DEFAULT_MODEL_PRESET_ID)).toMatchObject({
      apiKey: 'sk-legacy',
      agentModel: 'gpt-4.1-mini',
      isBuiltIn: true,
    });
    expect(presets.find((preset) => preset.id === 'custom-local')).toMatchObject({
      baseUrl: 'http://127.0.0.1:11434/v1',
      isBuiltIn: false,
    });
  });

  it('redacts preset API keys in summaries', () => {
    expect(formatModelPresetSummary({
      id: 'custom-1',
      name: 'Custom',
      baseUrl: 'https://example.com/v1',
      apiKey: 'sk-test',
      isBuiltIn: false,
    }, '********')).toMatchObject({
      apiKey: '********',
      hasApiKey: true,
    });
  });

  it('builds the mobile-safe response with the selected preset id', () => {
    const response = buildModelPresetsResponse({
      currentModelPresetId: 'custom-1',
      modelPresets: [{
        id: 'custom-1',
        name: 'Custom',
        baseUrl: 'https://example.com/v1',
        apiKey: 'sk-test',
      }],
    }, 'MASK');

    expect(response.currentModelPresetId).toBe('custom-1');
    expect(response.presets.find((preset) => preset.id === 'custom-1')).toMatchObject({
      apiKey: 'MASK',
      hasApiKey: true,
    });
    expect(JSON.stringify(response)).not.toContain('sk-test');
  });

  it('builds mutation responses without leaking preset API keys', () => {
    const preset: ModelPreset = {
      id: 'custom-1',
      name: 'Custom',
      baseUrl: 'https://example.com/v1',
      apiKey: 'sk-test',
      isBuiltIn: false,
    };

    const response = buildModelPresetMutationResponse({
      currentModelPresetId: 'custom-1',
      modelPresets: [preset],
    }, 'MASK', { preset });

    expect(response).toMatchObject({
      success: true,
      currentModelPresetId: 'custom-1',
      preset: {
        id: 'custom-1',
        apiKey: 'MASK',
        hasApiKey: true,
      },
    });
    expect(JSON.stringify(response)).not.toContain('sk-test');

    expect(buildModelPresetMutationResponse({
      currentModelPresetId: DEFAULT_MODEL_PRESET_ID,
      modelPresets: [],
    }, 'MASK', { deletedPresetId: 'custom-1' })).toMatchObject({
      success: true,
      deletedPresetId: 'custom-1',
    });
  });

  it('builds model preset audit contexts for operator routes', () => {
    expect(buildModelPresetCreateAuditContext({
      id: 'custom-1',
      apiKey: 'sk-test',
    })).toEqual({
      action: 'model-preset-create',
      success: true,
      details: {
        presetId: 'custom-1',
        hasApiKey: true,
      },
    });

    expect(buildModelPresetUpdateAuditContext('custom-1', {
      name: 'Custom',
      apiKey: 'sk-new',
      agentModel: 'model-a',
    })).toEqual({
      action: 'model-preset-update',
      success: true,
      details: {
        presetId: 'custom-1',
        updated: ['name', 'agentModel'],
        apiKeyUpdated: true,
      },
    });

    expect(buildModelPresetDeleteAuditContext('custom-1', true)).toEqual({
      action: 'model-preset-delete',
      success: true,
      details: {
        presetId: 'custom-1',
        switchedToDefault: true,
      },
    });

    expect(buildModelPresetMutationFailureAuditContext(
      'model-preset-update',
      'failed',
      'custom-1',
    )).toEqual({
      action: 'model-preset-update',
      success: false,
      details: {
        presetId: 'custom-1',
      },
      failureReason: 'failed',
    });
  });

  it('returns activation updates for endpoint switching', () => {
    expect(getModelPresetActivationUpdates({
      id: 'custom-1',
      name: 'Custom',
      baseUrl: 'https://example.com/v1',
      apiKey: 'sk-test',
      agentModel: 'gpt-4.1-mini',
      transcriptProcessingModel: 'gpt-4.1',
    })).toEqual({
      currentModelPresetId: 'custom-1',
      openaiBaseUrl: 'https://example.com/v1',
      openaiApiKey: 'sk-test',
      agentOpenaiModel: 'gpt-4.1-mini',
      mcpToolsOpenaiModel: 'gpt-4.1-mini',
      transcriptPostProcessingOpenaiModel: 'gpt-4.1',
    });
  });

  it('resolves the active model id from current provider settings', () => {
    expect(resolveActiveModelId({
      agentProviderId: 'openai',
      agentOpenaiModel: 'gpt-5.4',
      mcpToolsOpenaiModel: 'gpt-5.4-mini',
    })).toBe('gpt-5.4');

    expect(resolveActiveModelId({
      agentProviderId: 'groq',
      mcpToolsGroqModel: 'llama-3.3',
    })).toBe('llama-3.3');

    expect(resolveActiveModelId({
      agentProviderId: 'chatgpt-web',
    })).toBe('gpt-5.4-mini');

    expect(resolveActiveModelId({
      mcpToolsProviderId: 'gemini',
      mcpToolsGeminiModel: 'gemini-2.5-pro',
    })).toBe('gemini-2.5-pro');

    expect(resolveActiveModelId({
      agentProviderId: 'custom-provider',
    })).toBe('custom-provider');
  });

  it('resolves shared agent provider, model keys, placeholders, and configured models', () => {
    expect(AGENT_MODEL_FALLBACKS.openai).toBe('gpt-4.1-mini');
    expect(resolveAgentProviderId({ agentProviderId: 'gemini', mcpToolsProviderId: 'openai' })).toBe('gemini');
    expect(resolveAgentProviderId({ agentProviderId: 'custom-provider', mcpToolsProviderId: 'groq' })).toBe('groq');
    expect(resolveAgentProviderId({ agentProviderId: 'custom-provider' })).toBe('openai');

    expect(getAgentModelSettingKey('openai')).toBe('agentOpenaiModel');
    expect(getAgentModelSettingKey('groq')).toBe('agentGroqModel');
    expect(getAgentModelSettingKey('unknown')).toBe('agentChatgptWebModel');
    expect(getMcpToolsModelSettingKey('gemini')).toBe('mcpToolsGeminiModel');
    expect(getAgentModelPlaceholder('chatgpt-web')).toBe('gpt-5.4-mini');

    const config = {
      currentModelPresetId: DEFAULT_MODEL_PRESET_ID,
      openaiApiKey: 'sk-legacy',
      modelPresets: [{
        id: DEFAULT_MODEL_PRESET_ID,
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        isBuiltIn: true,
        agentModel: 'preset-model',
      }],
    };

    expect(getActiveModelPreset(config)?.name).toBe('OpenAI');
    expect(resolveConfiguredAgentModel(config, 'openai')).toBe('preset-model');
    expect(resolveConfiguredAgentModel(config, 'openai', {
      includeFallback: false,
      includeOpenAiPresetFallback: false,
    })).toBe('');
    expect(resolveConfiguredAgentModel({ agentProviderId: 'groq', mcpToolsGroqModel: 'llama-3.3' }, 'groq'))
      .toBe('llama-3.3');
    expect(resolveConfiguredAgentModel(undefined, 'gemini', { includeFallback: false })).toBe('');
  });

  it('builds shared agent model config updates for session and settings surfaces', () => {
    expect(buildAgentModelConfigUpdates({
      currentModelPresetId: DEFAULT_MODEL_PRESET_ID,
      openaiApiKey: 'sk-legacy',
      modelPresets: [],
    }, 'openai', 'gpt-5.4', 123)).toEqual({
      agentOpenaiModel: 'gpt-5.4',
      mcpToolsOpenaiModel: 'gpt-5.4',
      modelPresets: [
        expect.objectContaining({
          id: DEFAULT_MODEL_PRESET_ID,
          apiKey: 'sk-legacy',
          agentModel: 'gpt-5.4',
          mcpToolsModel: 'gpt-5.4',
          updatedAt: 123,
        }),
      ],
    });

    expect(buildAgentModelConfigUpdates({}, 'groq', 'llama-3.3')).toEqual({
      agentGroqModel: 'llama-3.3',
      mcpToolsGroqModel: 'llama-3.3',
    });
    expect(buildAgentModelConfigUpdates({}, 'gemini', 'gemini-2.5-pro')).toEqual({
      agentGeminiModel: 'gemini-2.5-pro',
      mcpToolsGeminiModel: 'gemini-2.5-pro',
    });
    expect(buildAgentModelConfigUpdates({}, 'chatgpt-web', 'gpt-5.4')).toEqual({
      agentChatgptWebModel: 'gpt-5.4',
      mcpToolsChatgptWebModel: 'gpt-5.4',
    });
  });

  it('upserts saved overrides for built-in presets without seeding the legacy API key', () => {
    const presets = upsertModelPresetOverride({
      openaiApiKey: 'sk-legacy',
      modelPresets: [],
    }, DEFAULT_MODEL_PRESET_ID, {
      agentModel: 'gpt-4.1-mini',
    }, 123);

    expect(presets).toEqual([
      expect.objectContaining({
        id: DEFAULT_MODEL_PRESET_ID,
        apiKey: '',
        isBuiltIn: true,
        agentModel: 'gpt-4.1-mini',
        updatedAt: 123,
      }),
    ]);

    expect(getMergedModelPresetById({ openaiApiKey: 'sk-legacy', modelPresets: presets }, DEFAULT_MODEL_PRESET_ID)?.apiKey)
      .toBe('sk-legacy');
  });

  it('updates custom presets and leaves unknown ids unchanged', () => {
    const existing: ModelPreset = {
      id: 'custom-1',
      name: 'Custom',
      baseUrl: 'https://example.com/v1',
      apiKey: 'sk-test',
      isBuiltIn: false,
    };

    expect(upsertModelPresetOverride({ modelPresets: [existing] }, 'custom-1', {
      agentModel: 'model-a',
    }, 456)).toEqual([
      {
        ...existing,
        agentModel: 'model-a',
        updatedAt: 456,
      },
    ]);

    expect(upsertModelPresetOverride({ modelPresets: [existing] }, 'missing', {
      agentModel: 'model-a',
    }, 456)).toEqual([existing]);
  });

  it('builds preset model selection updates without duplicating UI logic', () => {
    const updates = buildPresetModelSelectionUpdates({
      modelPresets: [],
    }, DEFAULT_MODEL_PRESET_ID, 'agentModel', 'agentOpenaiModel', 'gpt-5.4', 789);

    expect(updates.agentOpenaiModel).toBe('gpt-5.4');
    expect(updates.modelPresets).toEqual([
      expect.objectContaining({
        id: DEFAULT_MODEL_PRESET_ID,
        apiKey: '',
        agentModel: 'gpt-5.4',
        updatedAt: 789,
      }),
    ]);
  });

  it('builds preset edit updates for saved and newly configured built-in presets', () => {
    const existing: ModelPreset = {
      id: 'custom-1',
      name: 'Custom',
      baseUrl: 'https://old.example/v1',
      apiKey: 'sk-old',
      isBuiltIn: false,
    };
    const edited: ModelPreset = {
      ...existing,
      baseUrl: 'https://new.example/v1',
      apiKey: 'sk-new',
    };

    expect(buildModelPresetEditUpdates({
      currentModelPresetId: 'custom-1',
      modelPresets: [existing],
    }, edited, 'custom-1', 123)).toEqual({
      modelPresets: [{ ...edited, updatedAt: 123 }],
      openaiBaseUrl: 'https://new.example/v1',
      openaiApiKey: 'sk-new',
    });

    expect(buildModelPresetEditUpdates({
      modelPresets: [],
    }, {
      id: DEFAULT_MODEL_PRESET_ID,
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-configured',
      isBuiltIn: true,
    }, DEFAULT_MODEL_PRESET_ID, 456)).toEqual({
      modelPresets: [{
        id: DEFAULT_MODEL_PRESET_ID,
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-configured',
        isBuiltIn: true,
        updatedAt: 456,
      }],
      openaiBaseUrl: 'https://api.openai.com/v1',
      openaiApiKey: 'sk-configured',
    });
  });

  it('builds preset delete updates and switches the active preset back to default', () => {
    const customPreset: ModelPreset = {
      id: 'custom-1',
      name: 'Custom',
      baseUrl: 'https://custom.example/v1',
      apiKey: 'sk-custom',
      isBuiltIn: false,
    };
    const defaultOverride: ModelPreset = {
      id: DEFAULT_MODEL_PRESET_ID,
      name: 'OpenAI',
      baseUrl: 'https://default.example/v1',
      apiKey: '',
      isBuiltIn: true,
    };

    expect(buildModelPresetDeleteUpdates({
      currentModelPresetId: 'custom-1',
      openaiApiKey: 'sk-legacy',
      modelPresets: [customPreset, defaultOverride],
    }, 'custom-1', 'custom-1')).toEqual({
      modelPresets: [defaultOverride],
      currentModelPresetId: DEFAULT_MODEL_PRESET_ID,
      openaiBaseUrl: 'https://default.example/v1',
      openaiApiKey: 'sk-legacy',
    });

    expect(buildModelPresetDeleteUpdates({
      currentModelPresetId: DEFAULT_MODEL_PRESET_ID,
      modelPresets: [customPreset],
    }, 'custom-1', DEFAULT_MODEL_PRESET_ID)).toEqual({
      modelPresets: [],
    });
  });

  it('filters model options by id or display name', () => {
    const models = [
      { id: 'gpt-4.1-mini', name: 'GPT 4.1 Mini' },
      { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B' },
      { id: 'gemini-2.5-flash', name: 'Flash' },
    ];

    expect(filterModelOptionsByQuery(models, '')).toBe(models);
    expect(filterModelOptionsByQuery(models, ' oss ')).toEqual([models[1]]);
    expect(filterModelOptionsByQuery(models, 'gemini')).toEqual([models[2]]);
  });

  it('normalizes model preset string inputs', () => {
    expect(normalizeModelPresetString('  abcdef  ', 3)).toBe('abc');
    expect(normalizeModelPresetString(42)).toBeUndefined();
  });

  it('parses create requests and builds custom presets', () => {
    const parsed = parseModelPresetCreateRequestBody({
      name: ' Custom ',
      baseUrl: ' https://example.com/v1 ',
      apiKey: ' sk-test ',
      mcpToolsModel: ' model-a ',
      transcriptProcessingModel: ' transcript-model ',
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.request).toEqual({
      name: 'Custom',
      baseUrl: 'https://example.com/v1',
      apiKey: 'sk-test',
      agentModel: 'model-a',
      transcriptProcessingModel: 'transcript-model',
    });
    expect(buildCustomModelPresetFromRequest('custom-1', parsed.request, 123)).toEqual({
      id: 'custom-1',
      name: 'Custom',
      baseUrl: 'https://example.com/v1',
      apiKey: 'sk-test',
      isBuiltIn: false,
      createdAt: 123,
      updatedAt: 123,
      agentModel: 'model-a',
      transcriptProcessingModel: 'transcript-model',
    });
  });

  it('returns route-compatible create request errors', () => {
    expect(parseModelPresetCreateRequestBody({ baseUrl: 'https://example.com/v1' })).toEqual({
      ok: false,
      statusCode: 400,
      error: 'Preset name is required',
    });
    expect(parseModelPresetCreateRequestBody({ name: 'Custom' })).toEqual({
      ok: false,
      statusCode: 400,
      error: 'Preset base URL is required',
    });
  });

  it('builds update patches while preserving built-in name/base URL fields', () => {
    expect(buildModelPresetUpdatePatch({
      name: ' New ',
      baseUrl: ' https://new.example/v1 ',
      apiKey: 'MASK',
      agentModel: ' model-a ',
      transcriptProcessingModel: ' transcript ',
    }, { isBuiltIn: false }, 'MASK')).toEqual({
      name: 'New',
      baseUrl: 'https://new.example/v1',
      agentModel: 'model-a',
      transcriptProcessingModel: 'transcript',
    });

    expect(buildModelPresetUpdatePatch({
      name: 'Ignored',
      baseUrl: 'https://ignored.example/v1',
      apiKey: ' sk-new ',
      mcpToolsModel: ' model-b ',
    }, { isBuiltIn: true }, 'MASK')).toEqual({
      apiKey: 'sk-new',
      agentModel: 'model-b',
    });
  });

  it('runs operator model preset actions through config adapters', async () => {
    let config: ModelPresetActionConfigLike = {
      openaiApiKey: 'sk-legacy',
      currentModelPresetId: DEFAULT_MODEL_PRESET_ID,
      modelPresets: [],
    };
    const savedConfigs: ModelPresetActionConfigLike[] = [];
    const options: ModelPresetActionOptions = {
      config: {
        get: () => config,
        save: async (nextConfig) => {
          config = nextConfig;
          savedConfigs.push(nextConfig);
        },
      },
      diagnostics: {
        logError: () => {
          throw new Error('unexpected diagnostics log');
        },
      },
      createPresetId: () => 'custom-1',
      now: () => 123,
    };

    await expect(getOperatorModelPresetsAction('MASK', options)).resolves.toEqual({
      statusCode: 200,
      body: buildModelPresetsResponse(config, 'MASK'),
    });

    await expect(createOperatorModelPresetAction({
      name: 'Custom',
      baseUrl: 'https://example.com/v1',
      apiKey: 'sk-test',
      agentModel: 'model-a',
    }, 'MASK', options)).resolves.toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        preset: {
          id: 'custom-1',
          apiKey: 'MASK',
          hasApiKey: true,
          agentModel: 'model-a',
        },
      },
      auditContext: {
        action: 'model-preset-create',
        success: true,
        details: {
          presetId: 'custom-1',
          hasApiKey: true,
        },
      },
    });

    config = { ...config, currentModelPresetId: 'custom-1' };

    await expect(updateOperatorModelPresetAction('custom-1', {
      agentModel: 'model-b',
    }, 'MASK', options)).resolves.toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        currentModelPresetId: 'custom-1',
        preset: {
          id: 'custom-1',
          agentModel: 'model-b',
        },
      },
      auditContext: {
        action: 'model-preset-update',
        success: true,
      },
    });
    expect(config).toMatchObject({
      currentModelPresetId: 'custom-1',
      openaiBaseUrl: 'https://example.com/v1',
      openaiApiKey: 'sk-test',
      agentOpenaiModel: 'model-b',
      mcpToolsOpenaiModel: 'model-b',
    });

    await expect(deleteOperatorModelPresetAction('custom-1', 'MASK', options)).resolves.toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        currentModelPresetId: DEFAULT_MODEL_PRESET_ID,
        deletedPresetId: 'custom-1',
      },
      auditContext: {
        action: 'model-preset-delete',
        success: true,
        details: {
          presetId: 'custom-1',
          switchedToDefault: true,
        },
      },
    });
    expect(config.modelPresets?.some((preset) => preset.id === 'custom-1')).toBe(false);
    expect(savedConfigs).toHaveLength(3);
  });

  it('returns operator model preset action validation errors', async () => {
    const options: ModelPresetActionOptions = {
      config: {
        get: () => ({
          modelPresets: [],
        }),
        save: async () => undefined,
      },
      diagnostics: {
        logError: () => {
          throw new Error('unexpected diagnostics log');
        },
      },
      createPresetId: () => 'custom-1',
      now: () => 123,
    };

    await expect(createOperatorModelPresetAction({}, 'MASK', options)).resolves.toEqual({
      statusCode: 400,
      body: { error: 'Preset name is required' },
    });
    await expect(updateOperatorModelPresetAction(undefined, {}, 'MASK', options)).resolves.toEqual({
      statusCode: 400,
      body: { error: 'Missing preset ID' },
    });
    await expect(updateOperatorModelPresetAction('missing', {}, 'MASK', options)).resolves.toEqual({
      statusCode: 404,
      body: { error: 'Model preset not found' },
    });
    await expect(deleteOperatorModelPresetAction(DEFAULT_MODEL_PRESET_ID, 'MASK', options)).resolves.toEqual({
      statusCode: 400,
      body: { error: 'Built-in presets cannot be deleted' },
    });
  });

  it('logs operator model preset action failures with audit context', async () => {
    const caughtFailure = new Error('save failed');
    const loggedErrors: unknown[] = [];
    const options: ModelPresetActionOptions = {
      config: {
        get: () => ({
          modelPresets: [],
        }),
        save: async () => {
          throw caughtFailure;
        },
      },
      diagnostics: {
        logError: (source: string, message: string, caughtError: unknown) => {
          loggedErrors.push({ source, message, caughtError });
        },
      },
      createPresetId: () => 'custom-1',
      now: () => 123,
    };

    await expect(createOperatorModelPresetAction({
      name: 'Custom',
      baseUrl: 'https://example.com/v1',
    }, 'MASK', options)).resolves.toEqual({
      statusCode: 500,
      body: { error: 'save failed' },
      auditContext: {
        action: 'model-preset-create',
        success: false,
        failureReason: 'save failed',
      },
    });
    expect(loggedErrors).toEqual([
      {
        source: 'operator-model-preset-actions',
        message: 'Failed to create model preset',
        caughtError: caughtFailure,
      },
    ]);
  });
});
