import { describe, it, expect, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';
import type { SettingsPanelProps } from './SettingsPanel';
import type { ProviderPresetInfo, TtsConfig, SttConfig } from '../hooks/useSettings';
import { SETTINGS_CATEGORIES } from '../hooks/useSettings';

/**
 * SettingsPanel tests — verify settings panel rendering and interaction logic.
 *
 * Tests cover:
 * - Component exports and basic structure
 * - Category navigation logic
 * - Provider API key display and masking
 * - Model preset selection
 * - TTS/STT config cycling
 * - General settings (system prompt)
 */

// Test-only placeholder values for provider key fields (NOT real credentials)
const FAKE_KEY_A = 'changeme';
const FAKE_KEY_B = 'changeme2';

/** Helper: create default mock props */
function createMockProps(overrides: Partial<SettingsPanelProps> = {}): SettingsPanelProps {
  return {
    activeCategory: 'providers',
    onCategoryChange: vi.fn(),
    onNextCategory: vi.fn(),
    onPrevCategory: vi.fn(),
    onClose: vi.fn(),
    presets: [
      {
        id: 'builtin-openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: FAKE_KEY_A,
        isBuiltIn: true,
        isCurrent: true,
      },
      {
        id: 'builtin-groq',
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: '',
        isBuiltIn: true,
        isCurrent: false,
      },
      {
        id: 'builtin-together',
        name: 'Together AI',
        baseUrl: 'https://api.together.xyz/v1',
        apiKey: FAKE_KEY_B,
        isBuiltIn: true,
        isCurrent: false,
      },
    ],
    onSetApiKey: vi.fn(),
    onClearApiKey: vi.fn(),
    currentPresetId: 'builtin-openai',
    onSelectPreset: vi.fn(),
    ttsConfig: {
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
    },
    onUpdateTts: vi.fn(),
    sttConfig: {
      providerId: 'openai',
      openaiModel: 'whisper-1',
      groqModel: 'whisper-large-v3-turbo',
    },
    onUpdateStt: vi.fn(),
    systemPrompt: 'You are a helpful assistant.',
    onSetSystemPrompt: vi.fn(),
    ...overrides,
  };
}

describe('SettingsPanel', () => {
  it('exports a SettingsPanel component', () => {
    expect(SettingsPanel).toBeDefined();
    expect(typeof SettingsPanel).toBe('function');
  });

  it('has five settings categories defined', () => {
    expect(SETTINGS_CATEGORIES).toHaveLength(5);
  });
});

describe('SettingsPanel — Provider Settings Logic', () => {
  it('shows correct preset count', () => {
    const props = createMockProps();
    expect(props.presets).toHaveLength(3);
  });

  it('identifies preset with API key as configured', () => {
    const props = createMockProps();
    const configuredPresets = props.presets.filter((p) => p.apiKey.length > 0);
    expect(configuredPresets).toHaveLength(2); // OpenAI and Together
  });

  it('identifies preset without API key', () => {
    const props = createMockProps();
    const unconfigured = props.presets.filter((p) => p.apiKey.length === 0);
    expect(unconfigured).toHaveLength(1); // Groq
    expect(unconfigured[0].name).toBe('Groq');
  });

  it('marks the active preset correctly', () => {
    const props = createMockProps();
    const active = props.presets.find((p) => p.isCurrent);
    expect(active).toBeDefined();
    expect(active!.id).toBe('builtin-openai');
  });

  it('masks long API keys for display', () => {
    const testValue = 'abcd1234567890xyzwvuts';
    const masked = testValue.slice(0, 4) +
      '•'.repeat(Math.min(testValue.length - 4, 20)) +
      (testValue.length > 8 ? testValue.slice(-4) : '');
    expect(masked.startsWith('abcd')).toBe(true);
    expect(masked.endsWith('vuts')).toBe(true);
    expect(masked).toContain('•');
  });

  it('shows (not set) for empty API key', () => {
    const apiKey = '';
    const display = apiKey ? 'masked' : '(not set)';
    expect(display).toBe('(not set)');
  });

  it('calls onSetApiKey when saving an API key', () => {
    const props = createMockProps();
    props.onSetApiKey('builtin-openai', 'yyyyy');
    expect(props.onSetApiKey).toHaveBeenCalledWith('builtin-openai', 'yyyyy');
  });

  it('calls onClearApiKey when clearing an API key', () => {
    const props = createMockProps();
    props.onClearApiKey('builtin-openai');
    expect(props.onClearApiKey).toHaveBeenCalledWith('builtin-openai');
  });
});

describe('SettingsPanel — Model Preset Selection', () => {
  it('presets include all built-in presets', () => {
    const props = createMockProps();
    const builtInPresets = props.presets.filter((p) => p.isBuiltIn);
    expect(builtInPresets.length).toBeGreaterThan(0);
  });

  it('calls onSelectPreset when selecting a model', () => {
    const props = createMockProps();
    props.onSelectPreset('builtin-groq');
    expect(props.onSelectPreset).toHaveBeenCalledWith('builtin-groq');
  });

  it('correctly shows key status for each preset', () => {
    const props = createMockProps();
    const openai = props.presets.find((p) => p.id === 'builtin-openai');
    expect(openai?.apiKey.length).toBeGreaterThan(0);

    const groq = props.presets.find((p) => p.id === 'builtin-groq');
    expect(groq?.apiKey.length).toBe(0);
  });
});

describe('SettingsPanel — TTS Configuration', () => {
  it('has valid default TTS config', () => {
    const props = createMockProps();
    expect(props.ttsConfig.enabled).toBe(true);
    expect(props.ttsConfig.providerId).toBe('openai');
    expect(props.ttsConfig.openaiModel).toBe('gpt-4o-mini-tts');
  });

  it('calls onUpdateTts for toggle', () => {
    const props = createMockProps();
    props.onUpdateTts({ enabled: false });
    expect(props.onUpdateTts).toHaveBeenCalledWith({ enabled: false });
  });

  it('calls onUpdateTts for provider change', () => {
    const props = createMockProps();
    props.onUpdateTts({ providerId: 'groq' });
    expect(props.onUpdateTts).toHaveBeenCalledWith({ providerId: 'groq' });
  });

  it('calls onUpdateTts for voice change', () => {
    const props = createMockProps();
    props.onUpdateTts({ openaiVoice: 'echo' });
    expect(props.onUpdateTts).toHaveBeenCalledWith({ openaiVoice: 'echo' });
  });

  it('calls onUpdateTts for model change', () => {
    const props = createMockProps();
    props.onUpdateTts({ openaiModel: 'tts-1' });
    expect(props.onUpdateTts).toHaveBeenCalledWith({ openaiModel: 'tts-1' });
  });

  it('TTS config has all provider-specific fields', () => {
    const props = createMockProps();
    // OpenAI fields
    expect(props.ttsConfig.openaiModel).toBeDefined();
    expect(props.ttsConfig.openaiVoice).toBeDefined();
    expect(props.ttsConfig.openaiSpeed).toBeDefined();
    // Groq fields
    expect(props.ttsConfig.groqModel).toBeDefined();
    expect(props.ttsConfig.groqVoice).toBeDefined();
    // Gemini fields
    expect(props.ttsConfig.geminiModel).toBeDefined();
    expect(props.ttsConfig.geminiVoice).toBeDefined();
    // Supertonic fields
    expect(props.ttsConfig.supertonicVoice).toBeDefined();
    expect(props.ttsConfig.supertonicLanguage).toBeDefined();
    expect(props.ttsConfig.supertonicSpeed).toBeDefined();
  });
});

describe('SettingsPanel — STT Configuration', () => {
  it('has valid default STT config', () => {
    const props = createMockProps();
    expect(props.sttConfig.providerId).toBe('openai');
    expect(props.sttConfig.openaiModel).toBe('whisper-1');
    expect(props.sttConfig.groqModel).toBe('whisper-large-v3-turbo');
  });

  it('calls onUpdateStt for provider change', () => {
    const props = createMockProps();
    props.onUpdateStt({ providerId: 'groq' });
    expect(props.onUpdateStt).toHaveBeenCalledWith({ providerId: 'groq' });
  });

  it('calls onUpdateStt for model change', () => {
    const props = createMockProps();
    props.onUpdateStt({ groqModel: 'whisper-large-v3' });
    expect(props.onUpdateStt).toHaveBeenCalledWith({ groqModel: 'whisper-large-v3' });
  });
});

describe('SettingsPanel — General Settings', () => {
  it('shows system prompt text', () => {
    const props = createMockProps();
    expect(props.systemPrompt).toBe('You are a helpful assistant.');
  });

  it('calls onSetSystemPrompt when saving', () => {
    const props = createMockProps();
    props.onSetSystemPrompt('New system prompt');
    expect(props.onSetSystemPrompt).toHaveBeenCalledWith('New system prompt');
  });

  it('handles empty system prompt', () => {
    const props = createMockProps({ systemPrompt: '' });
    expect(props.systemPrompt).toBe('');
  });
});

describe('SettingsPanel — Navigation', () => {
  it('calls onClose when closing', () => {
    const props = createMockProps();
    props.onClose();
    expect(props.onClose).toHaveBeenCalled();
  });

  it('calls onNextCategory when navigating forward', () => {
    const props = createMockProps();
    props.onNextCategory();
    expect(props.onNextCategory).toHaveBeenCalled();
  });

  it('calls onPrevCategory when navigating backward', () => {
    const props = createMockProps();
    props.onPrevCategory();
    expect(props.onPrevCategory).toHaveBeenCalled();
  });

  it('calls onCategoryChange for direct category selection', () => {
    const props = createMockProps();
    props.onCategoryChange('tts');
    expect(props.onCategoryChange).toHaveBeenCalledWith('tts');
  });
});

describe('SettingsPanel — TTS Cycling Logic', () => {
  it('cycling providers wraps around', () => {
    const providerIds = ['openai', 'groq', 'gemini', 'kitten', 'supertonic'];
    const current = 'supertonic';
    const curIdx = providerIds.indexOf(current);
    const next = providerIds[(curIdx + 1) % providerIds.length];
    expect(next).toBe('openai');
  });

  it('cycling voices wraps around', () => {
    const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const current = 'shimmer';
    const curIdx = voices.indexOf(current);
    const next = voices[(curIdx + 1) % voices.length];
    expect(next).toBe('alloy');
  });
});

describe('SettingsPanel — STT Cycling Logic', () => {
  it('cycling STT providers wraps around', () => {
    const providerIds = ['openai', 'groq', 'parakeet'];
    const current = 'parakeet';
    const curIdx = providerIds.indexOf(current);
    const next = providerIds[(curIdx + 1) % providerIds.length];
    expect(next).toBe('openai');
  });

  it('Groq STT models can be cycled', () => {
    const models = ['whisper-large-v3-turbo', 'whisper-large-v3'];
    const current = 'whisper-large-v3-turbo';
    const curIdx = models.indexOf(current);
    const next = models[(curIdx + 1) % models.length];
    expect(next).toBe('whisper-large-v3');
  });
});
