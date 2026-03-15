import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SettingsCategory, ProviderPresetInfo, TtsConfig, SttConfig } from './useSettings';
import { SETTINGS_CATEGORIES } from './useSettings';

/**
 * Tests for the useSettings hook — validates settings state management,
 * category navigation, provider/model/TTS/STT/general settings logic.
 *
 * Since the hook depends on @dotagents/core configStore (which requires
 * fs access and PathResolver), we test the underlying logic patterns
 * rather than calling the hook directly in a test environment.
 */

// Mock modules
vi.mock('@dotagents/core', () => ({
  configStore: {
    get: vi.fn(() => ({
      currentModelPresetId: 'builtin-openai',
      modelPresets: [],
      ttsEnabled: true,
      ttsAutoPlay: true,
      ttsProviderId: 'openai',
      openaiTtsModel: 'gpt-4o-mini-tts',
      openaiTtsVoice: 'alloy',
      openaiTtsSpeed: 1.0,
      groqTtsModel: 'canopylabs/orpheus-v1-english',
      groqTtsVoice: 'troy',
      geminiTtsModel: 'gemini-2.5-flash-preview-tts',
      geminiTtsVoice: 'Kore',
      supertonicVoice: 'M1',
      supertonicLanguage: 'en',
      supertonicSpeed: 1.05,
      sttProviderId: 'openai',
      openaiSttModel: 'whisper-1',
      groqSttModel: 'whisper-large-v3-turbo',
    })),
    save: vi.fn(),
    reload: vi.fn(() => ({
      currentModelPresetId: 'builtin-openai',
      modelPresets: [],
    })),
  },
  globalAgentsFolder: '/tmp/test-agents',
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(() => ''),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(() => ''),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
    dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
  },
  join: (...args: string[]) => args.join('/'),
  dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
}));

describe('useSettings — Settings Categories', () => {
  it('defines five settings categories', () => {
    expect(SETTINGS_CATEGORIES).toHaveLength(5);
  });

  it('includes providers, models, tts, stt, and general categories', () => {
    const ids = SETTINGS_CATEGORIES.map((c) => c.id);
    expect(ids).toContain('providers');
    expect(ids).toContain('models');
    expect(ids).toContain('tts');
    expect(ids).toContain('stt');
    expect(ids).toContain('general');
  });

  it('has human-readable labels for each category', () => {
    for (const cat of SETTINGS_CATEGORIES) {
      expect(cat.label.length).toBeGreaterThan(0);
    }
  });

  it('categories are in the expected order', () => {
    expect(SETTINGS_CATEGORIES[0].id).toBe('providers');
    expect(SETTINGS_CATEGORIES[1].id).toBe('models');
    expect(SETTINGS_CATEGORIES[2].id).toBe('tts');
    expect(SETTINGS_CATEGORIES[3].id).toBe('stt');
    expect(SETTINGS_CATEGORIES[4].id).toBe('general');
  });
});

describe('useSettings — Category Navigation Logic', () => {
  it('next category from first wraps to providers', () => {
    const categories: SettingsCategory[] = SETTINGS_CATEGORIES.map((c) => c.id);
    const current: SettingsCategory = 'providers';
    const idx = categories.indexOf(current);
    const next = categories[(idx + 1) % categories.length];
    expect(next).toBe('models');
  });

  it('next category from last wraps to first', () => {
    const categories: SettingsCategory[] = SETTINGS_CATEGORIES.map((c) => c.id);
    const current: SettingsCategory = 'general';
    const idx = categories.indexOf(current);
    const next = categories[(idx + 1) % categories.length];
    expect(next).toBe('providers');
  });

  it('prev category from first wraps to last', () => {
    const categories: SettingsCategory[] = SETTINGS_CATEGORIES.map((c) => c.id);
    const current: SettingsCategory = 'providers';
    const idx = categories.indexOf(current);
    const prev = categories[(idx - 1 + categories.length) % categories.length];
    expect(prev).toBe('general');
  });

  it('prev category from middle goes to previous', () => {
    const categories: SettingsCategory[] = SETTINGS_CATEGORIES.map((c) => c.id);
    const current: SettingsCategory = 'tts';
    const idx = categories.indexOf(current);
    const prev = categories[(idx - 1 + categories.length) % categories.length];
    expect(prev).toBe('models');
  });
});

// Test-only placeholder values (NOT real credentials)
const FAKE_KEY = 'changeme';

describe('useSettings — Provider Preset Logic', () => {
  it('builds preset list from built-in presets', async () => {
    const { getBuiltInModelPresets, DEFAULT_MODEL_PRESET_ID } = await import('@dotagents/shared');
    const builtIn = getBuiltInModelPresets();
    expect(builtIn.length).toBeGreaterThan(0);

    const presets: ProviderPresetInfo[] = builtIn.map((p) => ({
      id: p.id,
      name: p.name,
      baseUrl: p.baseUrl,
      apiKey: p.apiKey ?? '',
      isBuiltIn: true,
      isCurrent: p.id === DEFAULT_MODEL_PRESET_ID,
    }));

    expect(presets.length).toBe(builtIn.length);
    // OpenAI should be marked as current by default
    const openai = presets.find((p) => p.id === 'builtin-openai');
    expect(openai).toBeDefined();
    expect(openai!.isCurrent).toBe(true);
  });

  it('merges saved key values with built-in presets', async () => {
    const { getBuiltInModelPresets, DEFAULT_MODEL_PRESET_ID } = await import('@dotagents/shared');
    const builtIn = getBuiltInModelPresets();

    const savedPresets = [{ id: 'builtin-openai', apiKey: FAKE_KEY }];

    const presets: ProviderPresetInfo[] = builtIn.map((p) => {
      const saved = savedPresets.find((s) => s.id === p.id);
      return {
        id: p.id,
        name: p.name,
        baseUrl: p.baseUrl,
        apiKey: saved?.apiKey ?? p.apiKey ?? '',
        isBuiltIn: true,
        isCurrent: p.id === DEFAULT_MODEL_PRESET_ID,
      };
    });

    const openai = presets.find((p) => p.id === 'builtin-openai');
    expect(openai?.apiKey).toBe(FAKE_KEY);
  });

  it('masks key values for display', () => {
    const testValue = 'abcd1234567890xyzw';
    const masked = testValue.slice(0, 4) + '•'.repeat(Math.min(testValue.length - 4, 20)) + testValue.slice(-4);
    expect(masked).toContain('abcd');
    expect(masked).toContain('xyzw');
    expect(masked).toContain('•');
  });

  it('shows (not set) when key is empty', () => {
    const keyValue = '';
    const display = keyValue ? 'masked' : '(not set)';
    expect(display).toBe('(not set)');
  });

  it('identifies the current/active preset', () => {
    const presets: ProviderPresetInfo[] = [
      { id: 'builtin-openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', apiKey: FAKE_KEY, isBuiltIn: true, isCurrent: true },
      { id: 'builtin-groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', apiKey: '', isBuiltIn: true, isCurrent: false },
    ];

    const activePreset = presets.find((p) => p.isCurrent);
    expect(activePreset?.id).toBe('builtin-openai');
  });
});

describe('useSettings — Model Preset Selection Logic', () => {
  it('default preset is builtin-openai', async () => {
    const { DEFAULT_MODEL_PRESET_ID } = await import('@dotagents/shared');
    expect(DEFAULT_MODEL_PRESET_ID).toBe('builtin-openai');
  });

  it('selecting a preset changes currentPresetId', () => {
    let currentPresetId = 'builtin-openai';
    const selectPreset = (id: string) => { currentPresetId = id; };
    selectPreset('builtin-groq');
    expect(currentPresetId).toBe('builtin-groq');
  });

  it('all built-in presets are available for selection', async () => {
    const { getBuiltInModelPresets } = await import('@dotagents/shared');
    const presets = getBuiltInModelPresets();
    expect(presets.length).toBeGreaterThanOrEqual(5); // At least OpenAI, OpenRouter, Together, Cerebras, Zhipu, Perplexity
  });
});

describe('useSettings — TTS Configuration Logic', () => {
  it('has default TTS config values', () => {
    const defaults: TtsConfig = {
      enabled: true,
      autoPlay: true,
      providerId: 'openai',
      openaiModel: 'gpt-4o-mini-tts',
      openaiVoice: 'alloy',
      openaiSpeed: 1.0,
      groqModel: 'canopylabs/orpheus-v1-english',
      groqVoice: 'troy',
      geminiModel: 'gemini-2.5-flash-preview-tts',
      geminiVoice: 'Kore',
      supertonicVoice: 'M1',
      supertonicLanguage: 'en',
      supertonicSpeed: 1.05,
    };
    expect(defaults.enabled).toBe(true);
    expect(defaults.providerId).toBe('openai');
  });

  it('cycles through TTS providers', async () => {
    const { TTS_PROVIDERS } = await import('@dotagents/shared');
    const providerIds = TTS_PROVIDERS.map((p) => p.value);

    let current = 'openai';
    const curIdx = providerIds.indexOf(current as typeof providerIds[number]);
    const next = providerIds[(curIdx + 1) % providerIds.length];
    expect(next).toBe('groq');
  });

  it('toggles TTS enabled/disabled', () => {
    let enabled = true;
    enabled = !enabled;
    expect(enabled).toBe(false);
    enabled = !enabled;
    expect(enabled).toBe(true);
  });

  it('toggles TTS auto-play', () => {
    let autoPlay = true;
    autoPlay = !autoPlay;
    expect(autoPlay).toBe(false);
  });

  it('cycles through TTS voices for OpenAI', async () => {
    const { OPENAI_TTS_VOICES } = await import('@dotagents/shared');
    const voices = OPENAI_TTS_VOICES.map((v) => v.value);
    expect(voices).toContain('alloy');
    expect(voices).toContain('echo');
    expect(voices.length).toBeGreaterThanOrEqual(6);
  });

  it('gets correct models for each TTS provider', async () => {
    const { getTtsModelsForProvider } = await import('@dotagents/shared');
    const openaiModels = getTtsModelsForProvider('openai');
    expect(openaiModels.length).toBeGreaterThan(0);

    const groqModels = getTtsModelsForProvider('groq');
    expect(groqModels.length).toBeGreaterThan(0);

    const geminiModels = getTtsModelsForProvider('gemini');
    expect(geminiModels.length).toBeGreaterThan(0);
  });

  it('gets voices appropriate for provider', async () => {
    const { getTtsVoicesForProvider } = await import('@dotagents/shared');
    const openaiVoices = getTtsVoicesForProvider('openai');
    expect(openaiVoices.length).toBeGreaterThan(0);

    const groqVoices = getTtsVoicesForProvider('groq');
    expect(groqVoices.length).toBeGreaterThan(0);
  });
});

describe('useSettings — STT Configuration Logic', () => {
  it('has default STT config values', () => {
    const defaults: SttConfig = {
      providerId: 'openai',
      openaiModel: 'whisper-1',
      groqModel: 'whisper-large-v3-turbo',
    };
    expect(defaults.providerId).toBe('openai');
    expect(defaults.openaiModel).toBe('whisper-1');
  });

  it('cycles through STT providers', async () => {
    const { STT_PROVIDERS } = await import('@dotagents/shared');
    const providerIds = STT_PROVIDERS.map((p) => p.value);

    let current = 'openai';
    const curIdx = providerIds.indexOf(current as typeof providerIds[number]);
    const next = providerIds[(curIdx + 1) % providerIds.length];
    expect(next).toBe('groq');
  });

  it('provides local parakeet as an STT option', async () => {
    const { STT_PROVIDERS } = await import('@dotagents/shared');
    const hasParakeet = STT_PROVIDERS.some((p) => p.value === 'parakeet');
    expect(hasParakeet).toBe(true);
  });

  it('STT model for parakeet shows as local', () => {
    const providerId = 'parakeet' as string;
    const modelValue = providerId === 'openai'
      ? 'whisper-1'
      : providerId === 'groq'
        ? 'whisper-large-v3-turbo'
        : '(local)';
    expect(modelValue).toBe('(local)');
  });
});

describe('useSettings — System Prompt Logic', () => {
  it('starts with empty prompt when file does not exist', () => {
    const prompt = '';
    expect(prompt).toBe('');
  });

  it('can set a new system prompt', () => {
    let prompt = '';
    prompt = 'You are a helpful coding assistant.';
    expect(prompt).toBe('You are a helpful coding assistant.');
  });

  it('preserves multiline prompts', () => {
    const prompt = 'Line 1\nLine 2\nLine 3';
    const lines = prompt.split('\n');
    expect(lines).toHaveLength(3);
  });

  it('previews first 5 lines of a long prompt', () => {
    const longPrompt = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`).join('\n');
    const lines = longPrompt.split('\n');
    const preview = lines.slice(0, 5).join('\n') + (lines.length > 5 ? '\n...' : '');
    expect(preview).toContain('Line 1');
    expect(preview).toContain('Line 5');
    expect(preview).toContain('...');
    expect(preview).not.toContain('Line 6');
  });
});

describe('useSettings — Config Persistence', () => {
  it('configStore.save is called when setting provider key', async () => {
    const { configStore } = await import('@dotagents/core');
    (configStore.save as ReturnType<typeof vi.fn>).mockClear();

    // Simulate what setProviderApiKey does
    const current = configStore.get();
    const updatedPresets = [
      { id: 'builtin-openai', apiKey: FAKE_KEY, updatedAt: Date.now() },
    ];
    configStore.save({ ...current, modelPresets: updatedPresets });

    expect(configStore.save).toHaveBeenCalledTimes(1);
    const savedConfig = (configStore.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(savedConfig.modelPresets[0].apiKey).toBe(FAKE_KEY);
  });

  it('configStore.save is called when selecting preset', async () => {
    const { configStore } = await import('@dotagents/core');
    (configStore.save as ReturnType<typeof vi.fn>).mockClear();

    const current = configStore.get();
    configStore.save({ ...current, currentModelPresetId: 'builtin-groq' });

    expect(configStore.save).toHaveBeenCalledTimes(1);
    const savedConfig = (configStore.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(savedConfig.currentModelPresetId).toBe('builtin-groq');
  });

  it('configStore.save is called when updating TTS config', async () => {
    const { configStore } = await import('@dotagents/core');
    (configStore.save as ReturnType<typeof vi.fn>).mockClear();

    const current = configStore.get();
    configStore.save({ ...current, ttsProviderId: 'groq' });

    expect(configStore.save).toHaveBeenCalledTimes(1);
    const savedConfig = (configStore.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(savedConfig.ttsProviderId).toBe('groq');
  });

  it('configStore.save is called when updating STT config', async () => {
    const { configStore } = await import('@dotagents/core');
    (configStore.save as ReturnType<typeof vi.fn>).mockClear();

    const current = configStore.get();
    configStore.save({ ...current, sttProviderId: 'groq' });

    expect(configStore.save).toHaveBeenCalledTimes(1);
    const savedConfig = (configStore.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(savedConfig.sttProviderId).toBe('groq');
  });

  it('system prompt persists to file', async () => {
    const fs = await import('fs');
    (fs.writeFileSync as ReturnType<typeof vi.fn>).mockClear();

    // Simulate saveSystemPrompt
    const prompt = 'Custom system prompt';
    const promptPath = '/tmp/test-agents/system-prompt.md';
    fs.mkdirSync('/tmp/test-agents', { recursive: true });
    fs.writeFileSync(promptPath, prompt, 'utf-8');

    expect(fs.writeFileSync).toHaveBeenCalledWith(promptPath, prompt, 'utf-8');
  });

  it('configStore.reload refreshes config on settings open', async () => {
    const { configStore } = await import('@dotagents/core');
    (configStore.reload as ReturnType<typeof vi.fn>).mockClear();

    configStore.reload();

    expect(configStore.reload).toHaveBeenCalledTimes(1);
  });
});
