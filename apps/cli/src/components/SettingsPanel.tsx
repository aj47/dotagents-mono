/**
 * SettingsPanel — TUI settings management panel.
 *
 * Renders a navigable settings screen with categories:
 * - Providers: API key management for model presets
 * - Models: Model preset selection and browsing
 * - TTS: Text-to-speech engine configuration
 * - STT: Speech-to-text engine configuration
 * - General: System prompt customization
 *
 * Uses keyboard navigation (arrows, Tab, Enter, Escape)
 * and persists all changes via @dotagents/core configStore.
 */

import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import {
  STT_PROVIDERS,
  TTS_PROVIDERS,
  getTtsModelsForProvider,
  getTtsVoicesForProvider,
} from '@dotagents/shared';
import type {
  SettingsCategory,
  ProviderPresetInfo,
  TtsConfig,
  SttConfig,
} from '../hooks/useSettings';
import { SETTINGS_CATEGORIES } from '../hooks/useSettings';

// ============================================================================
// Types
// ============================================================================

export interface SettingsPanelProps {
  activeCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
  onNextCategory: () => void;
  onPrevCategory: () => void;
  onClose: () => void;

  // Providers
  presets: ProviderPresetInfo[];
  onSetApiKey: (presetId: string, apiKey: string) => void;
  onClearApiKey: (presetId: string) => void;

  // Models
  currentPresetId: string;
  onSelectPreset: (presetId: string) => void;

  // TTS
  ttsConfig: TtsConfig;
  onUpdateTts: (updates: Partial<TtsConfig>) => void;

  // STT
  sttConfig: SttConfig;
  onUpdateStt: (updates: Partial<SttConfig>) => void;

  // General
  systemPrompt: string;
  onSetSystemPrompt: (prompt: string) => void;
}

// ============================================================================
// Sub-views
// ============================================================================

/**
 * Category tabs — horizontal navigation at the top of the settings panel.
 */
function CategoryTabs({
  activeCategory,
}: {
  activeCategory: SettingsCategory;
}) {
  return (
    <box flexDirection="row" width="100%" gap={1} paddingX={1}>
      {SETTINGS_CATEGORIES.map((cat) => {
        const isActive = cat.id === activeCategory;
        return (
          <text
            key={cat.id}
            fg={isActive ? '#7aa2f7' : '#565f89'}
          >
            {isActive ? <strong>[{cat.label}]</strong> : ` ${cat.label} `}
          </text>
        );
      })}
    </box>
  );
}

/**
 * Providers settings — shows API key status and allows editing.
 */
function ProvidersView({
  presets,
  selectedIndex,
  editingKey,
  editValue,
  onEditValueChange,
}: {
  presets: ProviderPresetInfo[];
  selectedIndex: number;
  editingKey: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
}) {
  return (
    <box flexDirection="column" width="100%" gap={0}>
      <text fg="#7aa2f7">
        <strong>Provider API Keys</strong>
      </text>
      <text fg="#565f89">
        Navigate: ↑/↓ • Enter to edit • Delete/Backspace to clear • Escape to go back
      </text>
      <box height={1} />
      {presets.map((preset, idx) => {
        const isSelected = idx === selectedIndex;
        const maskedKey = preset.apiKey
          ? preset.apiKey.slice(0, 4) + '•'.repeat(Math.min(preset.apiKey.length - 4, 20)) + (preset.apiKey.length > 8 ? preset.apiKey.slice(-4) : '')
          : '(not set)';
        const indicator = isSelected ? '▸' : ' ';
        const statusColor = preset.apiKey ? '#9ece6a' : '#565f89';

        if (isSelected && editingKey) {
          return (
            <box key={preset.id} flexDirection="column" width="100%">
              <text fg="#7aa2f7">
                {indicator} {preset.name} ({preset.baseUrl})
              </text>
              <box flexDirection="row" paddingLeft={3} width="100%">
                <text fg="#e0af68">API Key: </text>
                <input
                  flexGrow={1}
                  value={editValue}
                  onChange={onEditValueChange}
                  placeholder="Enter API key..."
                  textColor="#a9b1d6"
                  focused
                />
              </box>
              <text fg="#565f89" paddingLeft={3}>
                Press Enter to save, Escape to cancel
              </text>
            </box>
          );
        }

        return (
          <box key={preset.id} flexDirection="row" width="100%">
            <text fg={isSelected ? '#7aa2f7' : '#a9b1d6'}>
              {indicator} {preset.name}
            </text>
            <text fg={statusColor}>
              {'  '}{maskedKey}
            </text>
            {preset.isCurrent && (
              <text fg="#e0af68"> ★ active</text>
            )}
          </box>
        );
      })}
    </box>
  );
}

/**
 * Models settings — browse and select model presets.
 */
function ModelsView({
  presets,
  currentPresetId,
  selectedIndex,
}: {
  presets: ProviderPresetInfo[];
  currentPresetId: string;
  selectedIndex: number;
}) {
  return (
    <box flexDirection="column" width="100%" gap={0}>
      <text fg="#7aa2f7">
        <strong>Model Presets</strong>
      </text>
      <text fg="#565f89">
        Navigate: ↑/↓ • Enter to select as active preset
      </text>
      <box height={1} />
      {presets.map((preset, idx) => {
        const isSelected = idx === selectedIndex;
        const isActive = preset.id === currentPresetId;
        const indicator = isSelected ? '▸' : ' ';
        const hasKey = preset.apiKey.length > 0;

        return (
          <box key={preset.id} flexDirection="row" width="100%">
            <text fg={isSelected ? '#7aa2f7' : '#a9b1d6'}>
              {indicator} {preset.name}
            </text>
            <text fg="#565f89">
              {'  '}{preset.baseUrl}
            </text>
            {isActive && (
              <text fg="#e0af68"> ★ active</text>
            )}
            <text fg={hasKey ? '#9ece6a' : '#f7768e'}>
              {'  '}{hasKey ? '✓ key set' : '✗ no key'}
            </text>
          </box>
        );
      })}
    </box>
  );
}

/**
 * TTS settings — configure text-to-speech engine.
 */
function TtsView({
  ttsConfig,
  selectedIndex,
}: {
  ttsConfig: TtsConfig;
  selectedIndex: number;
}) {
  const providerLabel =
    TTS_PROVIDERS.find((p) => p.value === ttsConfig.providerId)?.label ?? ttsConfig.providerId;

  const models = getTtsModelsForProvider(ttsConfig.providerId);
  const currentModelId =
    ttsConfig.providerId === 'openai'
      ? ttsConfig.openaiModel
      : ttsConfig.providerId === 'groq'
        ? ttsConfig.groqModel
        : ttsConfig.geminiModel;
  const modelLabel =
    models.find((m: { value: string }) => m.value === currentModelId)?.label ?? currentModelId;

  const voices = getTtsVoicesForProvider(ttsConfig.providerId, currentModelId);
  const currentVoiceId =
    ttsConfig.providerId === 'openai'
      ? ttsConfig.openaiVoice
      : ttsConfig.providerId === 'groq'
        ? ttsConfig.groqVoice
        : ttsConfig.providerId === 'gemini'
          ? ttsConfig.geminiVoice
          : ttsConfig.supertonicVoice;
  const voiceLabel =
    voices.find((v: { value: string | number }) => String(v.value) === String(currentVoiceId))?.label ?? String(currentVoiceId);

  const items = [
    { label: 'Enabled', value: ttsConfig.enabled ? 'Yes' : 'No' },
    { label: 'Auto Play', value: ttsConfig.autoPlay ? 'Yes' : 'No' },
    { label: 'Provider', value: providerLabel },
    { label: 'Model', value: modelLabel },
    { label: 'Voice', value: voiceLabel },
  ];

  return (
    <box flexDirection="column" width="100%" gap={0}>
      <text fg="#7aa2f7">
        <strong>Text-to-Speech Settings</strong>
      </text>
      <text fg="#565f89">
        Navigate: ↑/↓ • Enter to cycle through options
      </text>
      <box height={1} />
      {items.map((item, idx) => {
        const isSelected = idx === selectedIndex;
        const indicator = isSelected ? '▸' : ' ';
        return (
          <box key={item.label} flexDirection="row" width="100%">
            <text fg={isSelected ? '#7aa2f7' : '#a9b1d6'}>
              {indicator} {item.label}:
            </text>
            <text fg="#9ece6a">{'  '}{item.value}</text>
          </box>
        );
      })}
    </box>
  );
}

/**
 * STT settings — configure speech-to-text engine.
 */
function SttView({
  sttConfig,
  selectedIndex,
}: {
  sttConfig: SttConfig;
  selectedIndex: number;
}) {
  const providerLabel =
    STT_PROVIDERS.find((p) => p.value === sttConfig.providerId)?.label ?? sttConfig.providerId;

  const modelValue =
    sttConfig.providerId === 'openai'
      ? sttConfig.openaiModel
      : sttConfig.providerId === 'groq'
        ? sttConfig.groqModel
        : '(local)';

  const items = [
    { label: 'Provider', value: providerLabel },
    { label: 'Model', value: modelValue },
  ];

  return (
    <box flexDirection="column" width="100%" gap={0}>
      <text fg="#7aa2f7">
        <strong>Speech-to-Text Settings</strong>
      </text>
      <text fg="#565f89">
        Navigate: ↑/↓ • Enter to cycle through options
      </text>
      <box height={1} />
      {items.map((item, idx) => {
        const isSelected = idx === selectedIndex;
        const indicator = isSelected ? '▸' : ' ';
        return (
          <box key={item.label} flexDirection="row" width="100%">
            <text fg={isSelected ? '#7aa2f7' : '#a9b1d6'}>
              {indicator} {item.label}:
            </text>
            <text fg="#9ece6a">{'  '}{item.value}</text>
          </box>
        );
      })}
    </box>
  );
}

/**
 * General settings — system prompt editing.
 */
function GeneralView({
  systemPrompt,
  isEditing,
  editValue,
  onEditValueChange,
}: {
  systemPrompt: string;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
}) {
  const preview = systemPrompt
    ? systemPrompt.split('\n').slice(0, 5).join('\n') +
      (systemPrompt.split('\n').length > 5 ? '\n...' : '')
    : '(no system prompt set)';

  return (
    <box flexDirection="column" width="100%" gap={0}>
      <text fg="#7aa2f7">
        <strong>General Settings</strong>
      </text>
      <text fg="#565f89">
        Press Enter to edit system prompt • Escape to go back
      </text>
      <box height={1} />
      <text fg="#a9b1d6">▸ System Prompt:</text>
      {isEditing ? (
        <box flexDirection="column" width="100%" paddingLeft={2}>
          <input
            width="100%"
            value={editValue}
            onChange={onEditValueChange}
            placeholder="Enter system prompt..."
            textColor="#a9b1d6"
            focused
          />
          <text fg="#565f89">
            Press Enter to save, Escape to cancel
          </text>
        </box>
      ) : (
        <box paddingLeft={2} width="100%">
          <text fg="#565f89">{preview}</text>
        </box>
      )}
    </box>
  );
}

// ============================================================================
// Main SettingsPanel Component
// ============================================================================

export function SettingsPanel(props: SettingsPanelProps) {
  const {
    activeCategory,
    onCategoryChange,
    onNextCategory,
    onPrevCategory,
    onClose,
    presets,
    onSetApiKey,
    onClearApiKey,
    currentPresetId,
    onSelectPreset,
    ttsConfig,
    onUpdateTts,
    sttConfig,
    onUpdateStt,
    systemPrompt,
    onSetSystemPrompt,
  } = props;

  // Item selection index within the current category
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Whether we're editing a field (API key, system prompt)
  const [editing, setEditing] = useState(false);
  // Current edit value
  const [editValue, setEditValue] = useState('');

  // Count of items in the current category
  const getItemCount = useCallback((): number => {
    switch (activeCategory) {
      case 'providers':
        return presets.length;
      case 'models':
        return presets.length;
      case 'tts':
        return 5; // enabled, autoPlay, provider, model, voice
      case 'stt':
        return 2; // provider, model
      case 'general':
        return 1; // system prompt
      default:
        return 0;
    }
  }, [activeCategory, presets.length]);

  // Handle Enter key actions
  const handleEnter = useCallback(() => {
    if (editing) {
      // Save the edit
      switch (activeCategory) {
        case 'providers': {
          const preset = presets[selectedIndex];
          if (preset) {
            onSetApiKey(preset.id, editValue);
          }
          break;
        }
        case 'general': {
          onSetSystemPrompt(editValue);
          break;
        }
      }
      setEditing(false);
      setEditValue('');
      return;
    }

    // Start editing or cycle through options
    switch (activeCategory) {
      case 'providers': {
        const preset = presets[selectedIndex];
        if (preset) {
          setEditValue(preset.apiKey);
          setEditing(true);
        }
        break;
      }
      case 'models': {
        const preset = presets[selectedIndex];
        if (preset) {
          onSelectPreset(preset.id);
        }
        break;
      }
      case 'tts': {
        // Cycle through options
        handleTtsCycle();
        break;
      }
      case 'stt': {
        handleSttCycle();
        break;
      }
      case 'general': {
        setEditValue(systemPrompt);
        setEditing(true);
        break;
      }
    }
  }, [
    editing,
    activeCategory,
    selectedIndex,
    presets,
    editValue,
    onSetApiKey,
    onSelectPreset,
    onSetSystemPrompt,
    systemPrompt,
  ]);

  // TTS cycling through provider/model/voice options
  const handleTtsCycle = useCallback(() => {
    const ttsProviderIds = TTS_PROVIDERS.map((p) => p.value);
    switch (selectedIndex) {
      case 0: // enabled toggle
        onUpdateTts({ enabled: !ttsConfig.enabled });
        break;
      case 1: // autoPlay toggle
        onUpdateTts({ autoPlay: !ttsConfig.autoPlay });
        break;
      case 2: { // provider cycle
        const curIdx = ttsProviderIds.indexOf(ttsConfig.providerId as typeof ttsProviderIds[number]);
        const nextIdx = (curIdx + 1) % ttsProviderIds.length;
        onUpdateTts({ providerId: ttsProviderIds[nextIdx] });
        break;
      }
      case 3: { // model cycle
        const models = getTtsModelsForProvider(ttsConfig.providerId);
        if (models.length === 0) break;
        const currentModelId =
          ttsConfig.providerId === 'openai'
            ? ttsConfig.openaiModel
            : ttsConfig.providerId === 'groq'
              ? ttsConfig.groqModel
              : ttsConfig.geminiModel;
        const modelValues = models.map((m: { value: string }) => m.value);
        const curMIdx = modelValues.indexOf(currentModelId);
        const nextMIdx = (curMIdx + 1) % modelValues.length;
        const updateKey =
          ttsConfig.providerId === 'openai'
            ? 'openaiModel'
            : ttsConfig.providerId === 'groq'
              ? 'groqModel'
              : 'geminiModel';
        onUpdateTts({ [updateKey]: modelValues[nextMIdx] });
        break;
      }
      case 4: { // voice cycle
        const currentModelForVoice =
          ttsConfig.providerId === 'openai'
            ? ttsConfig.openaiModel
            : ttsConfig.providerId === 'groq'
              ? ttsConfig.groqModel
              : ttsConfig.geminiModel;
        const voices = getTtsVoicesForProvider(ttsConfig.providerId, currentModelForVoice);
        if (voices.length === 0) break;
        const currentVoiceId =
          ttsConfig.providerId === 'openai'
            ? ttsConfig.openaiVoice
            : ttsConfig.providerId === 'groq'
              ? ttsConfig.groqVoice
              : ttsConfig.providerId === 'gemini'
                ? ttsConfig.geminiVoice
                : ttsConfig.supertonicVoice;
        const voiceValues = voices.map((v: { value: string | number }) => String(v.value));
        const curVIdx = voiceValues.indexOf(String(currentVoiceId));
        const nextVIdx = (curVIdx + 1) % voiceValues.length;
        const voiceUpdateKey =
          ttsConfig.providerId === 'openai'
            ? 'openaiVoice'
            : ttsConfig.providerId === 'groq'
              ? 'groqVoice'
              : ttsConfig.providerId === 'gemini'
                ? 'geminiVoice'
                : 'supertonicVoice';
        onUpdateTts({ [voiceUpdateKey]: voiceValues[nextVIdx] });
        break;
      }
    }
  }, [selectedIndex, ttsConfig, onUpdateTts]);

  // STT cycling through provider/model options
  const handleSttCycle = useCallback(() => {
    const sttProviderIds = STT_PROVIDERS.map((p) => p.value);
    switch (selectedIndex) {
      case 0: { // provider cycle
        const curIdx = sttProviderIds.indexOf(sttConfig.providerId as typeof sttProviderIds[number]);
        const nextIdx = (curIdx + 1) % sttProviderIds.length;
        onUpdateStt({ providerId: sttProviderIds[nextIdx] });
        break;
      }
      case 1: { // model cycle (provider-specific)
        if (sttConfig.providerId === 'openai') {
          const models = ['whisper-1'];
          const curIdx = models.indexOf(sttConfig.openaiModel);
          const nextIdx = (curIdx + 1) % models.length;
          onUpdateStt({ openaiModel: models[nextIdx] });
        } else if (sttConfig.providerId === 'groq') {
          const models = ['whisper-large-v3-turbo', 'whisper-large-v3'];
          const curIdx = models.indexOf(sttConfig.groqModel);
          const nextIdx = (curIdx + 1) % models.length;
          onUpdateStt({ groqModel: models[nextIdx] });
        }
        break;
      }
    }
  }, [selectedIndex, sttConfig, onUpdateStt]);

  // Handle delete/backspace for clearing API keys
  const handleDelete = useCallback(() => {
    if (editing) return;
    if (activeCategory === 'providers') {
      const preset = presets[selectedIndex];
      if (preset && preset.apiKey) {
        onClearApiKey(preset.id);
      }
    }
  }, [editing, activeCategory, selectedIndex, presets, onClearApiKey]);

  // Keyboard navigation
  useKeyboard((key) => {
    if (editing) {
      if (key.name === 'escape') {
        setEditing(false);
        setEditValue('');
      } else if (key.name === 'return') {
        handleEnter();
      }
      return;
    }

    switch (key.name) {
      case 'escape':
        onClose();
        break;
      case 'tab':
        if (key.shift) {
          onPrevCategory();
        } else {
          onNextCategory();
        }
        // Reset selection when switching categories
        setSelectedIndex(0);
        break;
      case 'left':
        onPrevCategory();
        setSelectedIndex(0);
        break;
      case 'right':
        onNextCategory();
        setSelectedIndex(0);
        break;
      case 'up':
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        break;
      case 'down':
        setSelectedIndex((prev) => Math.min(getItemCount() - 1, prev + 1));
        break;
      case 'return':
        handleEnter();
        break;
      case 'delete':
      case 'backspace':
        handleDelete();
        break;
    }
  });

  return (
    <box
      flexDirection="column"
      width="100%"
      flexGrow={1}
      border
      borderStyle="single"
      borderColor="#7aa2f7"
      padding={1}
    >
      {/* Title */}
      <box flexDirection="row" width="100%">
        <text fg="#7aa2f7">
          <strong>⚙ Settings</strong>
        </text>
        <text fg="#565f89">
          {'  '}Tab/←/→ to switch categories • Escape to close
        </text>
      </box>

      {/* Category tabs */}
      <CategoryTabs activeCategory={activeCategory} />

      <box height={1} />

      {/* Category content */}
      <box flexDirection="column" width="100%" flexGrow={1} paddingX={1}>
        {activeCategory === 'providers' && (
          <ProvidersView
            presets={presets}
            selectedIndex={selectedIndex}
            editingKey={editing}
            editValue={editValue}
            onEditValueChange={setEditValue}
          />
        )}
        {activeCategory === 'models' && (
          <ModelsView
            presets={presets}
            currentPresetId={currentPresetId}
            selectedIndex={selectedIndex}
          />
        )}
        {activeCategory === 'tts' && (
          <TtsView
            ttsConfig={ttsConfig}
            selectedIndex={selectedIndex}
          />
        )}
        {activeCategory === 'stt' && (
          <SttView
            sttConfig={sttConfig}
            selectedIndex={selectedIndex}
          />
        )}
        {activeCategory === 'general' && (
          <GeneralView
            systemPrompt={systemPrompt}
            isEditing={editing}
            editValue={editValue}
            onEditValueChange={setEditValue}
          />
        )}
      </box>
    </box>
  );
}
