/**
 * useSettings — React hook for managing CLI settings state.
 *
 * Provides read/write access to all settings categories via
 * @dotagents/core's configStore. Changes are persisted immediately
 * to disk (both config.json and ~/.agents/).
 *
 * Settings categories:
 * - Providers: API key management for model presets
 * - Models: Model preset selection and browsing
 * - TTS: Text-to-speech engine configuration
 * - STT: Speech-to-text engine configuration
 * - General: System prompt customization
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  configStore,
  globalAgentsFolder,
} from '@dotagents/core';
import type { Config } from '@dotagents/core';
import {
  getBuiltInModelPresets,
  DEFAULT_MODEL_PRESET_ID,
  STT_PROVIDERS,
  TTS_PROVIDERS,
  getTtsModelsForProvider,
  getTtsVoicesForProvider,
} from '@dotagents/shared';
import type { ModelPreset } from '@dotagents/shared';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

export type SettingsCategory = 'providers' | 'models' | 'tts' | 'stt' | 'general';

export const SETTINGS_CATEGORIES: { id: SettingsCategory; label: string }[] = [
  { id: 'providers', label: 'Providers' },
  { id: 'models', label: 'Models' },
  { id: 'tts', label: 'Text-to-Speech' },
  { id: 'stt', label: 'Speech-to-Text' },
  { id: 'general', label: 'General' },
];

export interface ProviderPresetInfo {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  isBuiltIn: boolean;
  isCurrent: boolean;
}

export interface TtsConfig {
  enabled: boolean;
  autoPlay: boolean;
  providerId: string;
  // OpenAI-specific
  openaiModel: string;
  openaiVoice: string;
  openaiSpeed: number;
  // Groq-specific
  groqModel: string;
  groqVoice: string;
  // Gemini-specific
  geminiModel: string;
  geminiVoice: string;
  // Supertonic-specific
  supertonicVoice: string;
  supertonicLanguage: string;
  supertonicSpeed: number;
}

export interface SttConfig {
  providerId: string;
  openaiModel: string;
  groqModel: string;
}

export interface UseSettingsReturn {
  /** Whether the settings panel is visible */
  isOpen: boolean;
  /** Open the settings panel */
  open: () => void;
  /** Close the settings panel */
  close: () => void;
  /** Currently selected category */
  activeCategory: SettingsCategory;
  /** Switch to a different category */
  setActiveCategory: (category: SettingsCategory) => void;
  /** Navigate to the next category */
  nextCategory: () => void;
  /** Navigate to the previous category */
  prevCategory: () => void;

  // --- Providers ---
  /** All model presets with current API key info */
  presets: ProviderPresetInfo[];
  /** Set an API key for a preset */
  setProviderApiKey: (presetId: string, apiKey: string) => void;
  /** Clear an API key for a preset */
  clearProviderApiKey: (presetId: string) => void;

  // --- Models ---
  /** Current model preset ID */
  currentPresetId: string;
  /** Select a model preset */
  selectPreset: (presetId: string) => void;

  // --- TTS ---
  /** Current TTS configuration */
  ttsConfig: TtsConfig;
  /** Update a TTS config field */
  updateTtsConfig: (updates: Partial<TtsConfig>) => void;

  // --- STT ---
  /** Current STT configuration */
  sttConfig: SttConfig;
  /** Update an STT config field */
  updateSttConfig: (updates: Partial<SttConfig>) => void;

  // --- General ---
  /** Current system prompt text */
  systemPrompt: string;
  /** Update the system prompt */
  setSystemPrompt: (prompt: string) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Load the current system prompt from ~/.agents/system-prompt.md.
 */
function loadSystemPrompt(): string {
  try {
    const promptPath = path.join(globalAgentsFolder, 'system-prompt.md');
    if (fs.existsSync(promptPath)) {
      return fs.readFileSync(promptPath, 'utf-8');
    }
  } catch {
    // Fall through to default
  }
  return '';
}

/**
 * Save the system prompt to ~/.agents/system-prompt.md.
 */
function saveSystemPrompt(prompt: string): void {
  try {
    const promptPath = path.join(globalAgentsFolder, 'system-prompt.md');
    fs.mkdirSync(path.dirname(promptPath), { recursive: true });
    fs.writeFileSync(promptPath, prompt, 'utf-8');
  } catch {
    // best-effort
  }
}

/**
 * Build the list of provider presets from config, merging built-in presets
 * with any saved API keys and custom presets.
 */
function buildPresetList(config: Config): ProviderPresetInfo[] {
  const builtIn = getBuiltInModelPresets();
  const savedPresets: ModelPreset[] = config.modelPresets || [];
  const currentPresetId = config.currentModelPresetId || DEFAULT_MODEL_PRESET_ID;

  const presets: ProviderPresetInfo[] = builtIn.map((preset) => {
    const saved = savedPresets.find((s: ModelPreset) => s.id === preset.id);
    return {
      id: preset.id,
      name: preset.name,
      baseUrl: preset.baseUrl,
      apiKey: saved?.apiKey ?? preset.apiKey ?? '',
      isBuiltIn: true,
      isCurrent: preset.id === currentPresetId,
    };
  });

  // Add custom (non-built-in) presets
  const customPresets = savedPresets.filter((p: ModelPreset) => !p.isBuiltIn);
  for (const custom of customPresets) {
    presets.push({
      id: custom.id,
      name: custom.name,
      baseUrl: custom.baseUrl,
      apiKey: custom.apiKey ?? '',
      isBuiltIn: false,
      isCurrent: custom.id === currentPresetId,
    });
  }

  return presets;
}

export function useSettings(): UseSettingsReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('providers');

  // Config state — reload from store whenever the panel opens
  const [config, setConfig] = useState<Config>(() => configStore.get());
  const [systemPrompt, setSystemPromptState] = useState<string>(() => loadSystemPrompt());

  // Derived state
  const presets = buildPresetList(config);
  const currentPresetId = config.currentModelPresetId || DEFAULT_MODEL_PRESET_ID;

  const ttsConfig: TtsConfig = {
    enabled: config.ttsEnabled ?? true,
    autoPlay: config.ttsAutoPlay ?? true,
    providerId: config.ttsProviderId ?? 'openai',
    openaiModel: config.openaiTtsModel ?? 'gpt-4o-mini-tts',
    openaiVoice: config.openaiTtsVoice ?? 'alloy',
    openaiSpeed: config.openaiTtsSpeed ?? 1.0,
    groqModel: config.groqTtsModel ?? 'canopylabs/orpheus-v1-english',
    groqVoice: config.groqTtsVoice ?? 'troy',
    geminiModel: config.geminiTtsModel ?? 'gemini-2.5-flash-preview-tts',
    geminiVoice: config.geminiTtsVoice ?? 'Kore',
    supertonicVoice: config.supertonicVoice ?? 'M1',
    supertonicLanguage: config.supertonicLanguage ?? 'en',
    supertonicSpeed: config.supertonicSpeed ?? 1.05,
  };

  const sttConfig: SttConfig = {
    providerId: config.sttProviderId ?? 'openai',
    openaiModel: config.openaiSttModel ?? 'whisper-1',
    groqModel: config.groqSttModel ?? 'whisper-large-v3-turbo',
  };

  // --- Open/close ---
  const open = useCallback(() => {
    // Reload config from disk when opening
    const freshConfig = configStore.reload();
    setConfig(freshConfig);
    setSystemPromptState(loadSystemPrompt());
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // --- Category navigation ---
  const nextCategory = useCallback(() => {
    setActiveCategory((current) => {
      const idx = SETTINGS_CATEGORIES.findIndex((c) => c.id === current);
      const nextIdx = (idx + 1) % SETTINGS_CATEGORIES.length;
      return SETTINGS_CATEGORIES[nextIdx].id;
    });
  }, []);

  const prevCategory = useCallback(() => {
    setActiveCategory((current) => {
      const idx = SETTINGS_CATEGORIES.findIndex((c) => c.id === current);
      const prevIdx = (idx - 1 + SETTINGS_CATEGORIES.length) % SETTINGS_CATEGORIES.length;
      return SETTINGS_CATEGORIES[prevIdx].id;
    });
  }, []);

  // --- Config save helper ---
  const saveConfig = useCallback((updated: Config) => {
    configStore.save(updated);
    setConfig(updated);
  }, []);

  // --- Provider API key management ---
  const setProviderApiKey = useCallback(
    (presetId: string, apiKey: string) => {
      const current = configStore.get();
      const savedPresets: ModelPreset[] = current.modelPresets || [];
      const existing = savedPresets.find((p: ModelPreset) => p.id === presetId);

      let updatedPresets: ModelPreset[];
      if (existing) {
        updatedPresets = savedPresets.map((p: ModelPreset) =>
          p.id === presetId ? { ...p, apiKey, updatedAt: Date.now() } : p,
        );
      } else {
        // Find the built-in preset info
        const builtIn = getBuiltInModelPresets().find((p) => p.id === presetId);
        if (builtIn) {
          updatedPresets = [
            ...savedPresets,
            { ...builtIn, apiKey, createdAt: Date.now(), updatedAt: Date.now() },
          ];
        } else {
          updatedPresets = savedPresets;
        }
      }

      saveConfig({ ...current, modelPresets: updatedPresets });
    },
    [saveConfig],
  );

  const clearProviderApiKey = useCallback(
    (presetId: string) => {
      setProviderApiKey(presetId, '');
    },
    [setProviderApiKey],
  );

  // --- Model preset selection ---
  const selectPreset = useCallback(
    (presetId: string) => {
      const current = configStore.get();
      saveConfig({ ...current, currentModelPresetId: presetId });
    },
    [saveConfig],
  );

  // --- TTS config ---
  const updateTtsConfig = useCallback(
    (updates: Partial<TtsConfig>) => {
      const current = configStore.get();
      const merged: Partial<Config> = { ...current };

      if (updates.enabled !== undefined) merged.ttsEnabled = updates.enabled;
      if (updates.autoPlay !== undefined) merged.ttsAutoPlay = updates.autoPlay;
      if (updates.providerId !== undefined) merged.ttsProviderId = updates.providerId;
      if (updates.openaiModel !== undefined) merged.openaiTtsModel = updates.openaiModel;
      if (updates.openaiVoice !== undefined) merged.openaiTtsVoice = updates.openaiVoice;
      if (updates.openaiSpeed !== undefined) merged.openaiTtsSpeed = updates.openaiSpeed;
      if (updates.groqModel !== undefined) merged.groqTtsModel = updates.groqModel;
      if (updates.groqVoice !== undefined) merged.groqTtsVoice = updates.groqVoice;
      if (updates.geminiModel !== undefined) merged.geminiTtsModel = updates.geminiModel;
      if (updates.geminiVoice !== undefined) merged.geminiTtsVoice = updates.geminiVoice;
      if (updates.supertonicVoice !== undefined) merged.supertonicVoice = updates.supertonicVoice;
      if (updates.supertonicLanguage !== undefined) merged.supertonicLanguage = updates.supertonicLanguage;
      if (updates.supertonicSpeed !== undefined) merged.supertonicSpeed = updates.supertonicSpeed;

      saveConfig(merged as Config);
    },
    [saveConfig],
  );

  // --- STT config ---
  const updateSttConfig = useCallback(
    (updates: Partial<SttConfig>) => {
      const current = configStore.get();
      const merged: Partial<Config> = { ...current };

      if (updates.providerId !== undefined) merged.sttProviderId = updates.providerId;
      if (updates.openaiModel !== undefined) merged.openaiSttModel = updates.openaiModel;
      if (updates.groqModel !== undefined) merged.groqSttModel = updates.groqModel;

      saveConfig(merged as Config);
    },
    [saveConfig],
  );

  // --- System prompt ---
  const setSystemPrompt = useCallback((prompt: string) => {
    setSystemPromptState(prompt);
    saveSystemPrompt(prompt);
  }, []);

  return {
    isOpen,
    open,
    close,
    activeCategory,
    setActiveCategory,
    nextCategory,
    prevCategory,
    presets,
    setProviderApiKey,
    clearProviderApiKey,
    currentPresetId,
    selectPreset,
    ttsConfig,
    updateTtsConfig,
    sttConfig,
    updateSttConfig,
    systemPrompt,
    setSystemPrompt,
  };
}
