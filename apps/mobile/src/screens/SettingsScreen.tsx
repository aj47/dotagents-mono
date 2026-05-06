import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, ScrollView, Modal, TouchableOpacity, Platform, Pressable, ActivityIndicator, RefreshControl, Share, Alert, LayoutAnimation, UIManager, KeyboardAvoidingView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppConfig,
  DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  saveConfig,
  useConfigContext,
} from '../store/config';
import { useSessionContext } from '../store/sessions';
import { useConnectionManager } from '../store/connectionManager';
import { useTheme, ThemeMode } from '../ui/ThemeProvider';
import { spacing, radius } from '../ui/theme';
import { useProfile } from '../store/profile';
import { usePushNotifications } from '../lib/pushNotifications';
import {
  createButtonAccessibilityLabel,
  createMcpServerSwitchAccessibilityLabel,
  createMinimumTouchTargetStyle,
  createSwitchAccessibilityLabel,
} from '../lib/accessibility';
import { ExtendedSettingsApiClient, Profile, MCPServer, Settings, ModelInfo, SettingsUpdate, Skill, KnowledgeNote, KnowledgeNoteContext, KnowledgeNoteDateFilter, KnowledgeNoteSort, AgentProfile, Loop, LocalSpeechModelProviderId, LocalSpeechModelStatus, ModelPresetSummary } from '../lib/settingsApi';
import { getAcpxMainAgentOptions } from '../lib/mainAgentOptions';
import { speakRemoteTts } from '../lib/remoteTts';
import { TTSSettings } from '../ui/TTSSettings';
import { MicrophoneSelector } from '../ui/MicrophoneSelector';
import Slider from '@react-native-community/slider';
import {
  buildKnowledgeNoteSections,
} from '@dotagents/shared/knowledge-note-grouping';
import {
  filterModelOptionsByQuery,
  getAgentModelPlaceholder,
  getAgentModelSettingKey,
  resolveAgentProviderId,
  resolveConfiguredAgentModel,
} from '@dotagents/shared/model-presets';
import {
  CHAT_PROVIDERS,
  DEFAULT_STT_PROVIDER_ID,
  DEFAULT_TRANSCRIPT_POST_PROCESSING_PROVIDER_ID,
  DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED,
  DEFAULT_TTS_PROVIDER_ID,
  STT_PROVIDERS,
  SUPERTONIC_TTS_LANGUAGES,
  TTS_PROVIDERS,
  getTtsModelSettingKey,
  getTtsModelsForProvider,
  getTtsVoiceSettingKey,
  getTtsVoicesForProvider,
  getTranscriptPostProcessingModelSettingKey,
  type CHAT_PROVIDER_ID,
} from '@dotagents/shared/providers';
import {
  applyRepeatTaskRuntimeStatus,
  describeLoopCadence,
  describeRepeatTaskRuntime,
  formatRepeatTaskRuntimeTimestamp,
} from '@dotagents/shared/repeat-task-utils';
import { parseConfigListInput } from '@dotagents/shared/config-list-input';
import {
  DEFAULT_PARAKEET_NUM_THREADS,
  DEFAULT_TRANSCRIPTION_PREVIEW_ENABLED,
  KNOWN_STT_MODEL_IDS,
  PARAKEET_NUM_THREAD_OPTIONS,
  getDefaultSttModel,
} from '@dotagents/shared/stt-models';
import {
  DEFAULT_MAIN_AGENT_MODE,
  MAIN_AGENT_MODE_OPTIONS,
  type MainAgentMode,
} from '@dotagents/shared/main-agent-selection';
import {
  DEFAULT_DISCORD_DM_ENABLED,
  DEFAULT_DISCORD_LOG_MESSAGES,
  DEFAULT_DISCORD_REQUIRE_MENTION,
} from '@dotagents/shared/discord-config';
import {
  DEFAULT_WHATSAPP_AUTO_REPLY,
  DEFAULT_WHATSAPP_ENABLED,
  DEFAULT_WHATSAPP_LOG_MESSAGES,
} from '@dotagents/shared/whatsapp-config';
import {
  DEFAULT_LANGFUSE_ENABLED,
  DEFAULT_LOCAL_TRACE_LOGGING_ENABLED,
} from '@dotagents/shared/observability-config';
import { getLocalSpeechModelLabel, getLocalTtsSpeechModelProviderId } from '@dotagents/shared/local-speech-models';
import {
  BUNDLE_COMPONENT_OPTIONS,
  BUNDLE_IMPORT_CONFLICT_STRATEGY_OPTIONS,
  DEFAULT_BUNDLE_COMPONENT_SELECTION,
  getBundleImportChangedItemCount,
  hasSelectedBundleComponent,
  type BundleComponentOption,
  type BundleImportConflictStrategy,
  type BundleImportPreview,
  type RequiredBundleComponentSelection,
} from '@dotagents/shared/bundle-api';
import {
  DEFAULT_MCP_CONTEXT_REDUCTION_ENABLED,
  DEFAULT_MCP_FINAL_SUMMARY_ENABLED,
  DEFAULT_MCP_MESSAGE_QUEUE_ENABLED,
  DEFAULT_MCP_PARALLEL_TOOL_EXECUTION,
  DEFAULT_MCP_REQUIRE_APPROVAL_BEFORE_TOOL_CALL,
  DEFAULT_MCP_TOOL_RESPONSE_PROCESSING_ENABLED,
  DEFAULT_MCP_UNLIMITED_ITERATIONS,
  DEFAULT_MCP_VERIFY_COMPLETION_ENABLED,
  RESERVED_RUNTIME_TOOL_SERVER_NAMES,
  formatMcpMaxIterationsValidationMessage,
  MCP_MAX_ITERATIONS_DEFAULT,
  parseMcpServerConfigImportRequestBody,
  parseMcpMaxIterationsDraft,
} from '@dotagents/shared/mcp-api';
import { isReservedMcpServerName, parseMcpKeyValueDraft, type MCPServerConfig, type MCPTransportType } from '@dotagents/shared/mcp-utils';
import {
  REMOTE_SETTINGS_SECRET_MASK as SECRET_MASK,
  buildRemoteSettingsInputDrafts,
} from '@dotagents/shared/remote-settings-input-drafts';
import { THEME_PREFERENCE_VALUES } from '@dotagents/shared/theme-preference';
import {
  DEFAULT_SUPERTONIC_TTS_LANGUAGE,
  DEFAULT_SUPERTONIC_TTS_STEPS,
  DEFAULT_TTS_AUTO_PLAY,
  DEFAULT_TTS_CONVERT_MARKDOWN,
  DEFAULT_TTS_ENABLED,
  DEFAULT_TTS_PREPROCESSING_ENABLED,
  DEFAULT_TTS_REMOVE_CODE_BLOCKS,
  DEFAULT_TTS_REMOVE_URLS,
  DEFAULT_TTS_USE_LLM_PREPROCESSING,
  MAX_SUPERTONIC_TTS_STEPS,
  MIN_SUPERTONIC_TTS_STEPS,
  formatLocalSpeechModelProgress as formatLocalModelProgress,
  getTextToSpeechModelValue as getRemoteTtsModelValue,
  getTextToSpeechSpeedSetting as getRemoteTtsSpeedSetting,
  getTextToSpeechSpeedValue as getRemoteTtsSpeedValue,
  getTextToSpeechVoiceDefault as getRemoteTtsVoiceDefault,
  getTextToSpeechVoiceValue as getRemoteTtsVoiceValue,
  normalizeTextToSpeechVoiceUpdateValue as normalizeTtsVoiceUpdateValue,
} from '@dotagents/shared/text-to-speech-settings';

type ProviderSecretSettingKey = 'openaiApiKey' | 'groqApiKey' | 'geminiApiKey';
type ProviderBaseUrlSettingKey = 'openaiBaseUrl' | 'groqBaseUrl' | 'geminiBaseUrl';
type DiscordListSettingKey =
  | 'discordAllowUserIds'
  | 'discordAllowGuildIds'
  | 'discordAllowChannelIds'
  | 'discordAllowRoleIds'
  | 'discordDmAllowUserIds';

type ModelPresetEditorMode = 'create' | 'edit';
type McpServerEditorMode = 'create' | 'replace';
type BundleImportComponentsState = RequiredBundleComponentSelection;
type BundleImportComponentKey = BundleComponentOption['key'];

type ModelPresetDraft = {
  id?: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  agentModel: string;
  transcriptProcessingModel: string;
  isBuiltIn: boolean;
  hasApiKey: boolean;
};

type McpServerDraft = {
  name: string;
  transport: MCPTransportType;
  command: string;
  args: string;
  url: string;
  env: string;
  headers: string;
  timeout: string;
  disabled: boolean;
};

const EMPTY_MCP_SERVER_DRAFT: McpServerDraft = {
  name: '',
  transport: 'stdio',
  command: '',
  args: '',
  url: '',
  env: '',
  headers: '',
  timeout: '',
  disabled: false,
};

type LoopRuntimeAction = {
  loopId: string;
  action: 'start' | 'stop';
};

const MOBILE_LOOP_RUNTIME_TIMESTAMP_FORMAT = {
  dateTimeFormatOptions: { hour: 'numeric', minute: '2-digit' },
} as const;

const KNOWLEDGE_CONTEXT_FILTER_OPTIONS: Array<{ label: string; value: 'all' | KnowledgeNoteContext }> = [
  { label: 'All', value: 'all' },
  { label: 'Search', value: 'search-only' },
  { label: 'Auto', value: 'auto' },
];

const KNOWLEDGE_DATE_FILTER_OPTIONS: Array<{ label: string; value: KnowledgeNoteDateFilter }> = [
  { label: 'Any time', value: 'all' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: 'Year', value: 'year' },
];

const KNOWLEDGE_SORT_OPTIONS: Array<{ label: string; value: KnowledgeNoteSort }> = [
  { label: 'Best', value: 'relevance' },
  { label: 'Updated', value: 'updated-desc' },
  { label: 'Oldest', value: 'updated-asc' },
  { label: 'Created', value: 'created-desc' },
  { label: 'A-Z', value: 'title-asc' },
  { label: 'Z-A', value: 'title-desc' },
];

const PROVIDER_CREDENTIAL_SECTIONS: Array<{
  id: string;
  label: string;
  apiKey: ProviderSecretSettingKey;
  baseUrl: ProviderBaseUrlSettingKey;
  apiKeyPlaceholder: string;
  baseUrlPlaceholder: string;
}> = [
  {
    id: 'openai',
    label: 'OpenAI Compatible',
    apiKey: 'openaiApiKey',
    baseUrl: 'openaiBaseUrl',
    apiKeyPlaceholder: 'sk-...',
    baseUrlPlaceholder: 'https://api.openai.com/v1',
  },
  {
    id: 'groq',
    label: 'Groq',
    apiKey: 'groqApiKey',
    baseUrl: 'groqBaseUrl',
    apiKeyPlaceholder: 'gsk_...',
    baseUrlPlaceholder: 'https://api.groq.com/openai/v1',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    apiKey: 'geminiApiKey',
    baseUrl: 'geminiBaseUrl',
    apiKeyPlaceholder: 'AIza...',
    baseUrlPlaceholder: 'https://generativelanguage.googleapis.com',
  },
];

const DISCORD_LIST_SETTING_KEYS: DiscordListSettingKey[] = [
  'discordAllowUserIds',
  'discordAllowGuildIds',
  'discordAllowChannelIds',
  'discordAllowRoleIds',
  'discordDmAllowUserIds',
];

const DISCORD_LIST_SETTING_SECTIONS: Array<{
  key: DiscordListSettingKey;
  label: string;
  placeholder: string;
  helper: string;
}> = [
  {
    key: 'discordAllowUserIds',
    label: 'Allowed User IDs',
    placeholder: 'One Discord user ID per line',
    helper: 'Leave blank to allow the bot owner and configured operator allowlists.',
  },
  {
    key: 'discordAllowGuildIds',
    label: 'Allowed Server IDs',
    placeholder: 'One Discord server ID per line',
    helper: 'Restrict server mention handling to specific Discord servers.',
  },
  {
    key: 'discordAllowChannelIds',
    label: 'Allowed Channel IDs',
    placeholder: 'One Discord channel or thread ID per line',
    helper: 'Restrict server mention handling to specific channels or threads.',
  },
  {
    key: 'discordAllowRoleIds',
    label: 'Allowed Role IDs',
    placeholder: 'One Discord role ID per line',
    helper: 'Allow users with these roles to interact with the bot in servers.',
  },
  {
    key: 'discordDmAllowUserIds',
    label: 'DM Allowed User IDs',
    placeholder: 'One Discord user ID per line',
    helper: 'Restrict direct-message access to specific Discord users.',
  },
];

const EMPTY_MODEL_PRESET_DRAFT: ModelPresetDraft = {
  name: '',
  baseUrl: '',
  apiKey: '',
  agentModel: '',
  transcriptProcessingModel: '',
  isBuiltIn: false,
  hasApiKey: false,
};

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const THEME_OPTION_LABELS: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = THEME_PREFERENCE_VALUES.map((value) => ({
  label: THEME_OPTION_LABELS[value],
  value,
}));

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { config, setConfig, ready } = useConfigContext();
  const [draft, setDraft] = useState<AppConfig>(config);
  const [handsFreeDebounceInput, setHandsFreeDebounceInput] = useState(
    String(config.handsFreeMessageDebounceMs ?? DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS),
  );
  const [hasPendingLocalSave, setHasPendingLocalSave] = useState(false);
  const [pendingRemoteSaveKeys, setPendingRemoteSaveKeys] = useState<string[]>([]);
  const [isSavingAllSettings, setIsSavingAllSettings] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const { setCurrentProfile: setProfileContext } = useProfile();
  const sessionStore = useSessionContext();
  const connectionManager = useConnectionManager();

  // Push notification state
  const {
    permissionStatus: notificationPermission,
    isSupported: notificationsSupported,
    isRegistered: notificationsRegistered,
    isLoading: isNotificationLoading,
    register: registerPush,
    unregister: unregisterPush,
  } = usePushNotifications();

  // Remote settings state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | undefined>();
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [remoteSettings, setRemoteSettings] = useState<Settings | null>(null);
  const [localSpeechModelStatuses, setLocalSpeechModelStatuses] = useState<Partial<Record<LocalSpeechModelProviderId, LocalSpeechModelStatus>>>({});
  const [pendingLocalSpeechModelAction, setPendingLocalSpeechModelAction] = useState<string | null>(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Track if the server is a DotAgents desktop server (supports our settings API)
  const [isDotAgentsServer, setIsDotAgentsServer] = useState(false);

  // Skills, Knowledge Notes, Agents, and Loops state
  const [skills, setSkills] = useState<Skill[]>([]);
  const [knowledgeNotes, setKnowledgeNotes] = useState<KnowledgeNote[]>([]);
  const [knowledgeNoteSearchQuery, setKnowledgeNoteSearchQuery] = useState('');
  const [knowledgeNoteSearchResults, setKnowledgeNoteSearchResults] = useState<KnowledgeNote[]>([]);
  const [selectedKnowledgeNoteIds, setSelectedKnowledgeNoteIds] = useState<Set<string>>(new Set());
  const [knowledgeNoteContextFilter, setKnowledgeNoteContextFilter] = useState<'all' | KnowledgeNoteContext>('all');
  const [knowledgeNoteDateFilter, setKnowledgeNoteDateFilter] = useState<KnowledgeNoteDateFilter>('all');
  const [knowledgeNoteSortOption, setKnowledgeNoteSortOption] = useState<KnowledgeNoteSort>('relevance');
  const [agentProfiles, setAgentProfiles] = useState<AgentProfile[]>([]);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isImportingSkillMarkdown, setIsImportingSkillMarkdown] = useState(false);
  const [isExportingSkillMarkdownId, setIsExportingSkillMarkdownId] = useState<string | null>(null);
  const [showSkillImportModal, setShowSkillImportModal] = useState(false);
  const [skillImportMarkdownText, setSkillImportMarkdownText] = useState('');
  const [isImportingSkillGitHub, setIsImportingSkillGitHub] = useState(false);
  const [showSkillGitHubImportModal, setShowSkillGitHubImportModal] = useState(false);
  const [skillGitHubImportText, setSkillGitHubImportText] = useState('');
  const [isLoadingKnowledgeNotes, setIsLoadingKnowledgeNotes] = useState(false);
  const [isSearchingKnowledgeNotes, setIsSearchingKnowledgeNotes] = useState(false);
  const [isLoadingAgentProfiles, setIsLoadingAgentProfiles] = useState(false);
  const [isReloadingAgentProfiles, setIsReloadingAgentProfiles] = useState(false);
  const [isLoadingLoops, setIsLoadingLoops] = useState(false);
  const [isImportingLoopMarkdown, setIsImportingLoopMarkdown] = useState(false);
  const [isExportingLoopMarkdownId, setIsExportingLoopMarkdownId] = useState<string | null>(null);
  const [loopRuntimeAction, setLoopRuntimeAction] = useState<LoopRuntimeAction | null>(null);
  const [showLoopImportModal, setShowLoopImportModal] = useState(false);
  const [loopImportMarkdownText, setLoopImportMarkdownText] = useState('');
  const displaySkills = useMemo(() => [...skills].sort((a, b) => {
    const enabledDiff = Number(b.enabledForProfile) - Number(a.enabledForProfile);
    if (enabledDiff !== 0) return enabledDiff;
    return a.name.localeCompare(b.name);
  }), [skills]);
  const trimmedKnowledgeNoteSearchQuery = knowledgeNoteSearchQuery.trim();
  const knowledgeNoteFilterRequest = useMemo(() => ({
    context: knowledgeNoteContextFilter === 'all' ? undefined : knowledgeNoteContextFilter,
    dateFilter: knowledgeNoteDateFilter,
    sort: knowledgeNoteSortOption,
    limit: 1000,
  }), [knowledgeNoteContextFilter, knowledgeNoteDateFilter, knowledgeNoteSortOption]);
  const displayedKnowledgeNotes = trimmedKnowledgeNoteSearchQuery ? knowledgeNoteSearchResults : knowledgeNotes;
  const displayedKnowledgeNoteIds = useMemo(
    () => new Set(displayedKnowledgeNotes.map((note) => note.id)),
    [displayedKnowledgeNotes]
  );
  const visibleSelectedKnowledgeNoteIds = useMemo(
    () => [...selectedKnowledgeNoteIds].filter((id) => displayedKnowledgeNoteIds.has(id)),
    [selectedKnowledgeNoteIds, displayedKnowledgeNoteIds]
  );
  const knowledgeNoteSections = useMemo(
    () => buildKnowledgeNoteSections(displayedKnowledgeNotes),
    [displayedKnowledgeNotes]
  );
  const availableAcpMainAgents = useMemo(
    () => getAcpxMainAgentOptions(remoteSettings, agentProfiles),
    [remoteSettings, agentProfiles]
  );
  const remoteTtsProviderId = remoteSettings?.ttsProviderId || DEFAULT_TTS_PROVIDER_ID;
  const remoteTtsSpeedSetting = getRemoteTtsSpeedSetting(remoteTtsProviderId);

  // Profile import/export state
  const [isExportingProfile, setIsExportingProfile] = useState(false);
  const [isImportingProfile, setIsImportingProfile] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [isExportingBundle, setIsExportingBundle] = useState(false);
  const [isPreviewingBundleImport, setIsPreviewingBundleImport] = useState(false);
  const [isImportingBundle, setIsImportingBundle] = useState(false);
  const [showBundleImportModal, setShowBundleImportModal] = useState(false);
  const [bundleImportJsonText, setBundleImportJsonText] = useState('');
  const [bundleImportPreview, setBundleImportPreview] = useState<BundleImportPreview | null>(null);
  const [bundleImportConflictStrategy, setBundleImportConflictStrategy] = useState<BundleImportConflictStrategy>('skip');
  const [bundleImportComponents, setBundleImportComponents] = useState<BundleImportComponentsState>(DEFAULT_BUNDLE_COMPONENT_SELECTION);

  // Model picker state
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [useCustomModel, setUseCustomModel] = useState(false);

  // Preset picker state
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showPresetEditor, setShowPresetEditor] = useState(false);
  const [presetEditorMode, setPresetEditorMode] = useState<ModelPresetEditorMode>('create');
  const [presetDraft, setPresetDraft] = useState<ModelPresetDraft>(EMPTY_MODEL_PRESET_DRAFT);
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  // MCP server editor state
  const [showMcpServerEditor, setShowMcpServerEditor] = useState(false);
  const [mcpServerEditorMode, setMcpServerEditorMode] = useState<McpServerEditorMode>('create');
  const [mcpServerDraft, setMcpServerDraft] = useState<McpServerDraft>(EMPTY_MCP_SERVER_DRAFT);
  const [isSavingMcpServer, setIsSavingMcpServer] = useState(false);
  const [showMcpImportModal, setShowMcpImportModal] = useState(false);
  const [mcpImportJsonText, setMcpImportJsonText] = useState('');
  const [isImportingMcpServers, setIsImportingMcpServers] = useState(false);
  const [isExportingMcpServers, setIsExportingMcpServers] = useState(false);

  // TTS voice/model picker state
  const [showTtsVoicePicker, setShowTtsVoicePicker] = useState(false);
  const [showTtsModelPicker, setShowTtsModelPicker] = useState(false);

  // Custom model input state (for debouncing)
  const [customModelDraft, setCustomModelDraft] = useState('');
  const modelUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Collapsible section state - all new sections start collapsed
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    providerSelection: false, // Provider selection section
    profileModel: true,  // Keep profile/model expanded by default since it was already visible
    bundles: false,
    mcpServers: true,    // Keep MCP servers expanded by default since it was already visible
    streamerMode: false,
    speechToText: false,
    textToSpeech: true,
    agentSettings: false,
    summarization: false,
    toolExecution: false,
    whatsapp: false,
    langfuse: false,
    skills: false,
    knowledgeNotes: false,
    agents: false,
    agentLoops: false,
    discord: false,
  });

  // Debounced input state for string/number fields
  const [inputDrafts, setInputDrafts] = useState<Record<string, string>>({});
  const inputTimeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    setDraft(config);
    setHandsFreeDebounceInput(
      String(config.handsFreeMessageDebounceMs ?? DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS),
    );
    setHasPendingLocalSave(false);
  }, [ready, config]);

  const markRemotePending = useCallback((key: string) => {
    setPendingRemoteSaveKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
  }, []);

  const clearRemotePending = useCallback((key: string) => {
    setPendingRemoteSaveKeys((prev) => prev.filter((entry) => entry !== key));
  }, []);

  const clearAllRemoteTimeouts = useCallback(() => {
    Object.entries(inputTimeoutRefs.current).forEach(([key, timeout]) => {
      clearTimeout(timeout);
      delete inputTimeoutRefs.current[key];
    });
    if (modelUpdateTimeoutRef.current) {
      clearTimeout(modelUpdateTimeoutRef.current);
      modelUpdateTimeoutRef.current = null;
    }
  }, []);

  const updateDraftField = useCallback((patch: Partial<AppConfig>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setHasPendingLocalSave(true);
    setSaveStatusMessage(null);
  }, []);

  // Keep a ref to the latest draft so multiple synchronous updateLocalConfig
  // calls within the same tick compose instead of clobbering each other.
  // This matters for flows like TTSSettings.handleVoiceSelect which calls
  // onTtsProviderChange + onEdgeTtsVoiceChange back-to-back: without the ref,
  // the second call would read a stale `draft` from closure and overwrite
  // the first call's patch.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const updateLocalConfig = useCallback((patch: Partial<AppConfig>) => {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraft(next);
    setConfig(next);
    void saveConfig(next);
    setHasPendingLocalSave(false);
    setSaveStatusMessage('Saved');
  }, [setConfig]);

  const handleHandsFreeDebounceInputChange = useCallback((value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    setHandsFreeDebounceInput(sanitized);
    updateDraftField({
      handsFreeMessageDebounceMs: sanitized ? Number(sanitized) : undefined,
    });
  }, [updateDraftField]);

  const commitHandsFreeDebounceInput = useCallback(() => {
    const trimmed = handsFreeDebounceInput.trim();
    const fallbackValue = draft.handsFreeMessageDebounceMs ?? DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS;

    if (!trimmed) {
      setHandsFreeDebounceInput(String(DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS));
      updateLocalConfig({ handsFreeMessageDebounceMs: DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS });
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setHandsFreeDebounceInput(String(fallbackValue));
      setDraft((current) => ({
        ...current,
        handsFreeMessageDebounceMs: fallbackValue,
      }));
      return;
    }

    const normalized = Math.round(parsed);
    setHandsFreeDebounceInput(String(normalized));
    updateLocalConfig({ handsFreeMessageDebounceMs: normalized });
  }, [draft.handsFreeMessageDebounceMs, handsFreeDebounceInput, updateLocalConfig]);

  // Create settings API client when we have valid credentials
  const settingsClient = useMemo(() => {
    if (config.baseUrl && config.apiKey) {
      return new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
    }
    return null;
  }, [config.baseUrl, config.apiKey]);

  // Clear pending model update timeout when settingsClient changes
  // to prevent sending updates to the previous server
  useEffect(() => {
    if (modelUpdateTimeoutRef.current) {
      clearTimeout(modelUpdateTimeoutRef.current);
      modelUpdateTimeoutRef.current = null;
    }
  }, [settingsClient]);

  // Fetch remote settings from desktop
  const fetchRemoteSettings = useCallback(async () => {
    if (!settingsClient) {
      setProfiles([]);
      setMcpServers([]);
      setRemoteSettings(null);
      setLocalSpeechModelStatuses({});
      setIsDotAgentsServer(false);
      return;
    }

    setIsLoadingRemote(true);
    setRemoteError(null);

    try {
      const errors: string[] = [];
      let successCount = 0;

      const [profilesRes, serversRes, settingsRes, localModelsRes] = await Promise.all([
        settingsClient.getProfiles().catch((e) => { errors.push('profiles'); return null; }),
        settingsClient.getMCPServers().catch((e) => { errors.push('MCP servers'); return null; }),
        settingsClient.getSettings().catch((e) => { errors.push('settings'); return null; }),
        settingsClient.getLocalSpeechModelStatuses().catch((e) => { errors.push('local speech models'); return null; }),
      ]);

      if (profilesRes) {
        setProfiles(profilesRes.profiles);
        setCurrentProfileId(profilesRes.currentProfileId);
        successCount++;
      }
      if (serversRes) {
        setMcpServers(serversRes.servers);
        successCount++;
      }
      if (settingsRes) {
        setRemoteSettings(settingsRes);
        // Sync input drafts from fetched settings (only on explicit fetch,
        // not on optimistic local updates, to avoid overwriting user's typing)
        setInputDrafts(buildRemoteSettingsInputDrafts(settingsRes));
        successCount++;
      }
      if (localModelsRes) {
        setLocalSpeechModelStatuses(localModelsRes.models);
        successCount++;
      }

      // Consider it a DotAgents server if at least one endpoint succeeded
      // This gates the Desktop Settings section for non-DotAgents endpoints (e.g., OpenAI)
      setIsDotAgentsServer(successCount > 0);

      // Show error if any endpoint failed but at least one succeeded
      if (errors.length > 0 && successCount > 0) {
        setRemoteError(`Failed to load: ${errors.join(', ')}`);
      } else if (successCount === 0) {
        // All endpoints failed - not a DotAgents server
        setIsDotAgentsServer(false);
      }
    } catch (error: any) {
      console.error('[Settings] Failed to fetch remote settings:', error);
      setRemoteError(error.message || 'Failed to load remote settings');
      setIsDotAgentsServer(false);
    } finally {
      setIsLoadingRemote(false);
    }
  }, [settingsClient]);

  const refreshRemoteSettingsSnapshot = useCallback(async () => {
    if (!settingsClient) return null;

    const settingsRes = await settingsClient.getSettings();
    setRemoteSettings(settingsRes);
    setInputDrafts(buildRemoteSettingsInputDrafts(settingsRes));
    return settingsRes;
  }, [settingsClient]);

  // Fetch skills from desktop
  const fetchSkills = useCallback(async () => {
    if (!settingsClient) return;
    setIsLoadingSkills(true);
    try {
      const res = await settingsClient.getSkills();
      setSkills(res.skills);
    } catch (error: any) {
      console.error('[Settings] Failed to fetch skills:', error);
    } finally {
      setIsLoadingSkills(false);
    }
  }, [settingsClient]);

  // Fetch knowledge notes from desktop
  const fetchKnowledgeNotes = useCallback(async () => {
    if (!settingsClient) return;
    setIsLoadingKnowledgeNotes(true);
    try {
      const res = await settingsClient.getKnowledgeNotes(knowledgeNoteFilterRequest);
      setKnowledgeNotes(res.notes);
    } catch (error: any) {
      console.error('[Settings] Failed to fetch knowledge notes:', error);
    } finally {
      setIsLoadingKnowledgeNotes(false);
    }
  }, [settingsClient, knowledgeNoteFilterRequest]);

  useEffect(() => {
    if (!settingsClient || !isDotAgentsServer || !trimmedKnowledgeNoteSearchQuery) {
      setKnowledgeNoteSearchResults([]);
      setIsSearchingKnowledgeNotes(false);
      return;
    }

    let cancelled = false;
    setIsSearchingKnowledgeNotes(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await settingsClient.searchKnowledgeNotes({
          query: trimmedKnowledgeNoteSearchQuery,
          context: knowledgeNoteFilterRequest.context,
          dateFilter: knowledgeNoteFilterRequest.dateFilter,
          sort: knowledgeNoteFilterRequest.sort,
          limit: 100,
        });
        if (!cancelled) {
          setKnowledgeNoteSearchResults(res.notes);
        }
      } catch (error: any) {
        console.error('[Settings] Failed to search knowledge notes:', error);
        if (!cancelled) {
          setKnowledgeNoteSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearchingKnowledgeNotes(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [settingsClient, isDotAgentsServer, trimmedKnowledgeNoteSearchQuery, knowledgeNoteFilterRequest]);

  useEffect(() => {
    setSelectedKnowledgeNoteIds(new Set());
  }, [trimmedKnowledgeNoteSearchQuery, knowledgeNoteContextFilter, knowledgeNoteDateFilter, knowledgeNoteSortOption]);

  // Fetch agent profiles from desktop
  const fetchAgentProfiles = useCallback(async () => {
    if (!settingsClient) return;
    setIsLoadingAgentProfiles(true);
    try {
      const res = await settingsClient.getAgentProfiles();
      setAgentProfiles(res.profiles);
    } catch (error: any) {
      console.error('[Settings] Failed to fetch agent profiles:', error);
    } finally {
      setIsLoadingAgentProfiles(false);
    }
  }, [settingsClient]);

  // Fetch loops from desktop
  const fetchLoops = useCallback(async () => {
    if (!settingsClient) return;
    setIsLoadingLoops(true);
    try {
      const res = await settingsClient.getLoops();
      setLoops(res.loops);
    } catch (error: any) {
      console.error('[Settings] Failed to fetch loops:', error);
    } finally {
      setIsLoadingLoops(false);
    }
  }, [settingsClient]);

  // Fetch remote settings when client becomes available
  useEffect(() => {
    if (settingsClient) {
      fetchRemoteSettings();
    }
  }, [settingsClient, fetchRemoteSettings]);

  // Fetch DotAgents-specific data only after confirming it's a DotAgents server
  useEffect(() => {
    if (settingsClient && isDotAgentsServer) {
      fetchSkills();
      fetchKnowledgeNotes();
      fetchAgentProfiles();
      fetchLoops();
    }
  }, [settingsClient, isDotAgentsServer, fetchSkills, fetchKnowledgeNotes, fetchAgentProfiles, fetchLoops]);

  // Refresh key remote data when returning from nested screens (e.g. agent editor)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!settingsClient) return;
      fetchRemoteSettings();
      if (isDotAgentsServer) {
        fetchSkills();
        fetchAgentProfiles();
        fetchKnowledgeNotes();
        fetchLoops();
      }
    });
    return unsubscribe;
  }, [navigation, settingsClient, isDotAgentsServer, fetchRemoteSettings, fetchSkills, fetchAgentProfiles, fetchKnowledgeNotes, fetchLoops]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const fetches: Promise<void>[] = [fetchRemoteSettings()];
    if (isDotAgentsServer) {
      fetches.push(fetchSkills(), fetchKnowledgeNotes(), fetchAgentProfiles(), fetchLoops());
    }
    await Promise.all(fetches);
    setIsRefreshing(false);
  }, [isDotAgentsServer, fetchRemoteSettings, fetchSkills, fetchKnowledgeNotes, fetchAgentProfiles, fetchLoops]);

  const refreshLocalSpeechModelStatuses = useCallback(async () => {
    if (!settingsClient) return;
    try {
      const response = await settingsClient.getLocalSpeechModelStatuses();
      setLocalSpeechModelStatuses(response.models);
    } catch (error: any) {
      console.warn('[Settings] Failed to refresh local speech model statuses:', error);
    }
  }, [settingsClient]);

  useEffect(() => {
    if (!settingsClient) return;
    const hasActiveDownload = Object.values(localSpeechModelStatuses).some(status => status?.downloading);
    if (!hasActiveDownload) return;

    const interval = setInterval(() => {
      void refreshLocalSpeechModelStatuses();
    }, 1000);
    return () => clearInterval(interval);
  }, [localSpeechModelStatuses, refreshLocalSpeechModelStatuses, settingsClient]);

  const handleLocalSpeechModelDownload = useCallback(async (providerId: LocalSpeechModelProviderId) => {
    if (!settingsClient) return;

    setPendingLocalSpeechModelAction(`${providerId}:download`);
    setRemoteError(null);
    setSaveStatusMessage(null);
    try {
      const response = await settingsClient.downloadLocalSpeechModel(providerId);
      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to start model download');
      }
      setSaveStatusMessage(response.message);
      const downloaded = response.details?.downloaded === true;
      setLocalSpeechModelStatuses((current) => ({
        ...current,
        [providerId]: {
          downloaded,
          downloading: !downloaded,
          progress: downloaded ? 1 : current[providerId]?.progress ?? 0,
          error: undefined,
          path: current[providerId]?.path,
        },
      }));
      await refreshLocalSpeechModelStatuses();
    } catch (error: any) {
      console.error('[Settings] Failed to start local speech model download:', error);
      setRemoteError(error.message || 'Failed to start model download');
    } finally {
      setPendingLocalSpeechModelAction(null);
    }
  }, [refreshLocalSpeechModelStatuses, settingsClient]);

  const handleRemoteTtsTest = useCallback(async () => {
    if (!remoteSettings?.ttsProviderId || !config.baseUrl || !config.apiKey) return;

    const localProviderId = getLocalTtsSpeechModelProviderId(remoteSettings?.ttsProviderId);
    if (localProviderId && !localSpeechModelStatuses[localProviderId]?.downloaded) {
      setRemoteError('Download the selected local TTS model before testing its voice.');
      return;
    }

    setPendingLocalSpeechModelAction(`${remoteSettings.ttsProviderId}:test`);
    setRemoteError(null);
    setSaveStatusMessage(null);
    try {
      const started = await speakRemoteTts('Hello. This is a test of the selected desktop text to speech voice.', {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        providerId: remoteSettings.ttsProviderId,
        voice: getRemoteTtsVoiceValue(remoteSettings) !== undefined ? String(getRemoteTtsVoiceValue(remoteSettings)) : undefined,
        model: getRemoteTtsModelValue(remoteSettings),
        rate: getRemoteTtsSpeedValue(remoteSettings),
      });
      if (!started) {
        throw new Error('The desktop did not return playable speech audio.');
      }
      setSaveStatusMessage('Test voice started');
    } catch (error: any) {
      console.error('[Settings] Failed to test desktop TTS voice:', error);
      setRemoteError(error.message || 'Failed to test desktop TTS voice');
    } finally {
      setPendingLocalSpeechModelAction(null);
    }
  }, [config.apiKey, config.baseUrl, localSpeechModelStatuses, remoteSettings]);

  // Handle profile switch
  const handleProfileSwitch = async (profileId: string) => {
    if (!settingsClient || profileId === currentProfileId) return;

    try {
      await settingsClient.setCurrentProfile(profileId);
      setCurrentProfileId(profileId);
      // Update the profile context so the header badge updates immediately
      const selectedProfile = profiles.find(p => p.id === profileId);
      if (selectedProfile) {
        setProfileContext(selectedProfile);
      }
      // Refresh MCP servers and skills as they may have changed with the profile
      const serversRes = await settingsClient.getMCPServers();
      setMcpServers(serversRes.servers);
      // Skills enabledForProfile is profile-specific, so refetch after switch
      if (isDotAgentsServer) {
        fetchSkills();
      }
    } catch (error: any) {
      console.error('[Settings] Failed to switch profile:', error);
      setRemoteError(error.message || 'Failed to switch profile');
    }
  };

  // Handle profile export
  const handleExportProfile = async () => {
    if (!settingsClient || !currentProfileId) return;

    setIsExportingProfile(true);
    try {
      const result = await settingsClient.exportProfile(currentProfileId);
      await Share.share({
        message: result.profileJson,
        title: 'Export Profile',
      });
    } catch (error: any) {
      console.error('[Settings] Failed to export profile:', error);
      Alert.alert('Export Failed', error.message || 'Failed to export profile');
    } finally {
      setIsExportingProfile(false);
    }
  };

  // Handle profile import
  const handleImportProfile = async () => {
    if (!settingsClient || !importJsonText.trim()) return;

    setIsImportingProfile(true);
    try {
      const result = await settingsClient.importProfile(importJsonText.trim());
      // Import succeeded - close modal and show success first
      setShowImportModal(false);
      setImportJsonText('');
      Alert.alert('Success', `Profile "${result.profile.name}" imported successfully`);

      // Refresh profiles list separately - don't show import failure if only refresh fails
      try {
        const profilesRes = await settingsClient.getProfiles();
        setProfiles(profilesRes.profiles);
        setCurrentProfileId(profilesRes.currentProfileId);
      } catch (refreshError: any) {
        console.error('[Settings] Failed to refresh profiles after import:', refreshError);
        // Don't show error alert - import was successful, just log the refresh issue
      }
    } catch (error: any) {
      console.error('[Settings] Failed to import profile:', error);
      Alert.alert('Import Failed', error.message || 'Failed to import profile');
    } finally {
      setIsImportingProfile(false);
    }
  };

  const shareBundleExport = async () => {
    if (!settingsClient) return;

    setIsExportingBundle(true);
    setRemoteError(null);
    try {
      const result = await settingsClient.exportBundle({ name: 'DotAgents Bundle' });
      const itemCount =
        result.bundle.agentProfiles.length
        + result.bundle.mcpServers.length
        + result.bundle.skills.length
        + result.bundle.repeatTasks.length
        + result.bundle.knowledgeNotes.length;
      await Share.share({
        message: result.bundleJson,
        title: `${result.bundle.manifest.name}.dotagents`,
      });
      setSaveStatusMessage(`Exported bundle with ${itemCount} item${itemCount === 1 ? '' : 's'}`);
    } catch (error: any) {
      console.error('[Settings] Failed to export bundle:', error);
      setRemoteError(error.message || 'Failed to export bundle');
      Alert.alert('Export Failed', error.message || 'Failed to export bundle');
    } finally {
      setIsExportingBundle(false);
    }
  };

  const handleBundleExport = () => {
    if (!settingsClient) return;

    const message = 'Bundles can include agents, MCP servers, skills, tasks, and knowledge notes. Share only with places you trust.';

    if (Platform.OS === 'web') {
      const confirmFn = (globalThis as { confirm?: (text?: string) => boolean }).confirm;
      if (!confirmFn || !confirmFn(`Export DotAgents Bundle\n\n${message}`)) {
        return;
      }
      void shareBundleExport();
      return;
    }

    Alert.alert('Export DotAgents Bundle', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: () => {
          void shareBundleExport();
        },
      },
    ]);
  };

  const closeBundleImportModal = useCallback(() => {
    if (isPreviewingBundleImport || isImportingBundle) return;
    setShowBundleImportModal(false);
    setBundleImportJsonText('');
    setBundleImportPreview(null);
    setBundleImportConflictStrategy('skip');
    setBundleImportComponents(DEFAULT_BUNDLE_COMPONENT_SELECTION);
  }, [isImportingBundle, isPreviewingBundleImport]);

  const handleBundleImportJsonChange = useCallback((value: string) => {
    setBundleImportJsonText(value);
    setBundleImportPreview(null);
  }, []);

  const handleBundleImportComponentToggle = useCallback((key: BundleImportComponentKey, value: boolean) => {
    setBundleImportComponents(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleBundleImportPreview = useCallback(async () => {
    if (!settingsClient || !bundleImportJsonText.trim()) return;

    try {
      JSON.parse(bundleImportJsonText.trim());
    } catch {
      setRemoteError('Bundle JSON is invalid');
      Alert.alert('Preview Failed', 'Bundle JSON is invalid');
      return;
    }

    setIsPreviewingBundleImport(true);
    setRemoteError(null);
    try {
      const result = await settingsClient.previewBundleImport({ bundleJson: bundleImportJsonText.trim() });
      setBundleImportPreview(result.preview);
      const components = result.preview.bundle.manifest.components;
      const itemCount = components.agentProfiles + components.mcpServers + components.skills + components.repeatTasks + components.knowledgeNotes;
      setSaveStatusMessage(`Previewed bundle with ${itemCount} item${itemCount === 1 ? '' : 's'}`);
    } catch (error: any) {
      console.error('[Settings] Failed to preview bundle import:', error);
      setRemoteError(error.message || 'Failed to preview bundle');
      Alert.alert('Preview Failed', error.message || 'Failed to preview bundle');
    } finally {
      setIsPreviewingBundleImport(false);
    }
  }, [bundleImportJsonText, settingsClient]);

  const refreshAfterBundleImport = useCallback(async () => {
    const refreshes: Promise<void>[] = [fetchRemoteSettings()];
    if (isDotAgentsServer) {
      refreshes.push(fetchSkills(), fetchKnowledgeNotes(), fetchAgentProfiles(), fetchLoops());
    }
    await Promise.allSettled(refreshes);
  }, [fetchAgentProfiles, fetchKnowledgeNotes, fetchLoops, fetchRemoteSettings, fetchSkills, isDotAgentsServer]);

  const handleBundleImport = useCallback(async () => {
    if (!settingsClient || !bundleImportJsonText.trim()) return;
    if (!hasSelectedBundleComponent(bundleImportComponents)) {
      setRemoteError('Select at least one bundle component to import');
      Alert.alert('Import Failed', 'Select at least one bundle component to import');
      return;
    }

    setIsImportingBundle(true);
    setRemoteError(null);
    try {
      const result = await settingsClient.importBundle({
        bundleJson: bundleImportJsonText.trim(),
        conflictStrategy: bundleImportConflictStrategy,
        components: bundleImportComponents,
      });

      if (!result.success) {
        throw new Error(result.errors.join(', ') || 'Import failed');
      }

      const importedCount = getBundleImportChangedItemCount(result);

      setShowBundleImportModal(false);
      setBundleImportJsonText('');
      setBundleImportPreview(null);
      setBundleImportConflictStrategy('skip');
      setBundleImportComponents(DEFAULT_BUNDLE_COMPONENT_SELECTION);
      setSaveStatusMessage(`Imported ${importedCount} bundle item${importedCount === 1 ? '' : 's'}`);
      await refreshAfterBundleImport();
      Alert.alert('Import Complete', `Imported ${importedCount} item${importedCount === 1 ? '' : 's'} from the bundle.`);
    } catch (error: any) {
      console.error('[Settings] Failed to import bundle:', error);
      setRemoteError(error.message || 'Failed to import bundle');
      Alert.alert('Import Failed', error.message || 'Failed to import bundle');
    } finally {
      setIsImportingBundle(false);
    }
  }, [
    bundleImportComponents,
    bundleImportConflictStrategy,
    bundleImportJsonText,
    refreshAfterBundleImport,
    settingsClient,
  ]);

  // Handle MCP server toggle
  const handleServerToggle = async (serverName: string, enabled: boolean) => {
    if (!settingsClient) return;

    try {
      await settingsClient.toggleMCPServer(serverName, enabled);
      // Update local state optimistically
      setMcpServers(prev => prev.map(s =>
        s.name === serverName ? { ...s, enabled, runtimeEnabled: enabled } : s
      ));
    } catch (error: any) {
      console.error('[Settings] Failed to toggle server:', error);
      setRemoteError(error.message || 'Failed to toggle server');
      // Refresh to get actual state
      fetchRemoteSettings();
    }
  };

  // Handle remote settings toggle
  const handleRemoteSettingToggle = async (key: keyof Settings, value: boolean) => {
    if (!settingsClient || !remoteSettings) return;

    try {
      await settingsClient.updateSettings({ [key]: value });
      setRemoteSettings(prev => prev ? { ...prev, [key]: value } : null);
    } catch (error: any) {
      console.error('[Settings] Failed to update setting:', error);
      setRemoteError(error.message || 'Failed to update setting');
    }
  };

  // Handle remote settings update for string/number fields (with debounce)
  const handleRemoteSettingUpdate = useCallback((key: keyof SettingsUpdate, value: string | number | string[]) => {
    // Update local draft immediately for responsive UI
    setInputDrafts(prev => ({ ...prev, [key]: String(value) }));
    setRemoteSettings(prev => prev ? { ...prev, [key]: value } : null);
    markRemotePending(String(key));
    setSaveStatusMessage(null);

    // Cancel any pending update for this key
    if (inputTimeoutRefs.current[key]) {
      clearTimeout(inputTimeoutRefs.current[key]);
    }

    // Debounce the actual API call by 1000ms
    inputTimeoutRefs.current[key] = setTimeout(async () => {
      if (!settingsClient) return;

      try {
        await settingsClient.updateSettings({ [key]: value });
        clearRemotePending(String(key));
        delete inputTimeoutRefs.current[key];
      } catch (error: any) {
        console.error(`[Settings] Failed to update ${key}:`, error);
        setRemoteError(error.message || `Failed to update ${key}`);
        // Refresh to get actual state
        fetchRemoteSettings();
      }
    }, 1000);
  }, [clearRemotePending, fetchRemoteSettings, markRemotePending, settingsClient]);

  const handleRemoteListSettingUpdate = useCallback((key: DiscordListSettingKey, value: string) => {
    markRemotePending(key);
    setSaveStatusMessage(null);
    setInputDrafts(prev => ({ ...prev, [key]: value }));

    const parsedValues = parseConfigListInput(value, { unique: true });
    if (inputTimeoutRefs.current[key]) {
      clearTimeout(inputTimeoutRefs.current[key]);
    }

    inputTimeoutRefs.current[key] = setTimeout(async () => {
      if (!settingsClient) return;

      try {
        await settingsClient.updateSettings({ [key]: parsedValues } as SettingsUpdate);
        setRemoteSettings(prev => prev ? { ...prev, [key]: parsedValues } : null);
        clearRemotePending(key);
        delete inputTimeoutRefs.current[key];
      } catch (error: any) {
        console.error(`[Settings] Failed to update ${key}:`, error);
        setRemoteError(error.message || `Failed to update ${key}`);
        fetchRemoteSettings();
      }
    }, 1000);
  }, [clearRemotePending, fetchRemoteSettings, markRemotePending, settingsClient]);

  const handleRemoteSecretDraftChange = useCallback((key: ProviderSecretSettingKey, value: string) => {
    markRemotePending(key);
    setSaveStatusMessage(null);
    setInputDrafts(prev => ({ ...prev, [key]: value }));
  }, [markRemotePending]);

  const commitRemoteSecretDraft = useCallback(async (key: ProviderSecretSettingKey) => {
    if (!settingsClient || !pendingRemoteSaveKeys.includes(key)) return;

    const value = inputDrafts[key] ?? '';
    try {
      await settingsClient.updateSettings({ [key]: value } as SettingsUpdate);
      setRemoteSettings(prev => prev ? { ...prev, [key]: value ? SECRET_MASK : '' } : null);
      clearRemotePending(key);
      setInputDrafts(prev => ({ ...prev, [key]: '' }));
      setSaveStatusMessage('Saved');
    } catch (error: any) {
      console.error(`[Settings] Failed to update ${key}:`, error);
      setRemoteError(error.message || `Failed to update ${key}`);
      fetchRemoteSettings();
    }
  }, [clearRemotePending, fetchRemoteSettings, inputDrafts, pendingRemoteSaveKeys, settingsClient]);

  // Cleanup input timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(inputTimeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  // Toggle section collapse state
  const toggleSection = useCallback((section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Handle skill toggle for current profile
  const handleSkillToggle = async (skillId: string) => {
    if (!settingsClient) return;
    try {
      const res = await settingsClient.toggleSkillForProfile(skillId);
      // Optimistically update the UI
      setSkills(prev =>
        prev.map(s => (s.id === skillId ? { ...s, enabledForProfile: res.enabledForProfile } : s))
      );
    } catch (error: any) {
      console.error('[Settings] Failed to toggle skill:', error);
      Alert.alert('Error', 'Failed to toggle skill');
    }
  };

  const closeSkillImportModal = useCallback(() => {
    if (isImportingSkillMarkdown) return;
    setShowSkillImportModal(false);
    setSkillImportMarkdownText('');
  }, [isImportingSkillMarkdown]);

  const closeSkillGitHubImportModal = useCallback(() => {
    if (isImportingSkillGitHub) return;
    setShowSkillGitHubImportModal(false);
    setSkillGitHubImportText('');
  }, [isImportingSkillGitHub]);

  const handleSkillMarkdownImport = useCallback(async () => {
    if (!settingsClient || !skillImportMarkdownText.trim()) return;

    setIsImportingSkillMarkdown(true);
    setRemoteError(null);
    try {
      const result = await settingsClient.importSkillFromMarkdown(skillImportMarkdownText.trim());
      setShowSkillImportModal(false);
      setSkillImportMarkdownText('');
      setSaveStatusMessage(`Imported skill "${result.skill.name}"`);
      await fetchSkills();
      Alert.alert('Import Complete', `Imported "${result.skill.name}".`);
    } catch (error: any) {
      console.error('[Settings] Failed to import skill Markdown:', error);
      setRemoteError(error.message || 'Failed to import skill');
      Alert.alert('Import Failed', error.message || 'Failed to import skill');
    } finally {
      setIsImportingSkillMarkdown(false);
    }
  }, [fetchSkills, settingsClient, skillImportMarkdownText]);

  const handleSkillGitHubImport = useCallback(async () => {
    if (!settingsClient || !skillGitHubImportText.trim()) return;

    setIsImportingSkillGitHub(true);
    setRemoteError(null);
    try {
      const result = await settingsClient.importSkillFromGitHub(skillGitHubImportText.trim());
      if (!result.success) {
        throw new Error(result.errors.join(', ') || 'No skills imported');
      }

      setShowSkillGitHubImportModal(false);
      setSkillGitHubImportText('');
      setSaveStatusMessage(`Imported ${result.imported.length} GitHub skill${result.imported.length === 1 ? '' : 's'}`);
      await fetchSkills();
      Alert.alert('Import Complete', `Imported ${result.imported.length} skill${result.imported.length === 1 ? '' : 's'} from GitHub.`);
    } catch (error: any) {
      console.error('[Settings] Failed to import GitHub skill:', error);
      setRemoteError(error.message || 'Failed to import GitHub skill');
      Alert.alert('Import Failed', error.message || 'Failed to import GitHub skill');
    } finally {
      setIsImportingSkillGitHub(false);
    }
  }, [fetchSkills, settingsClient, skillGitHubImportText]);

  const handleSkillMarkdownExport = useCallback(async (skill: Skill) => {
    if (!settingsClient) return;

    setIsExportingSkillMarkdownId(skill.id);
    setRemoteError(null);
    try {
      const result = await settingsClient.exportSkillToMarkdown(skill.id);
      await Share.share({
        message: result.markdown,
        title: `${skill.name}.md`,
      });
      setSaveStatusMessage(`Exported skill "${skill.name}"`);
    } catch (error: any) {
      console.error('[Settings] Failed to export skill Markdown:', error);
      setRemoteError(error.message || 'Failed to export skill');
      Alert.alert('Export Failed', error.message || 'Failed to export skill');
    } finally {
      setIsExportingSkillMarkdownId(null);
    }
  }, [settingsClient]);

  const confirmDestructiveAction = useCallback(
    (title: string, message: string, onConfirm: () => Promise<void> | void, confirmLabel: string = 'Delete') => {
      if (Platform.OS === 'web') {
        const confirmFn = (globalThis as { confirm?: (text?: string) => boolean }).confirm;
        if (!confirmFn) {
          return;
        }
        if (confirmFn(`${title}\n\n${message}`)) {
          void onConfirm();
        }
        return;
      }

      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: confirmLabel,
          style: 'destructive',
          onPress: () => {
            void onConfirm();
          },
        },
      ]);
    },
    []
  );

  const handleClearAllChats = useCallback(() => {
    confirmDestructiveAction(
      'Clear All Chats',
      'Are you sure you want to delete all chats from this mobile app? This cannot be undone.',
      async () => {
        connectionManager.manager.cleanupAll();
        await sessionStore.clearAllSessions();
      },
      'Delete All'
    );
  }, [confirmDestructiveAction, connectionManager, sessionStore]);

  const handleMcpServerDelete = useCallback((server: MCPServer) => {
    if (!settingsClient) return;

    confirmDestructiveAction(
      'Delete MCP Server',
      `Delete "${server.name}" from the connected desktop MCP config?`,
      async () => {
        try {
          await settingsClient.deleteMCPServerConfig(server.name);
          setMcpServers(prev => prev.filter(item => item.name !== server.name));
        } catch (error: any) {
          console.error('[Settings] Failed to delete MCP server:', error);
          Alert.alert('Error', error.message || 'Failed to delete MCP server');
          fetchRemoteSettings();
        }
      }
    );
  }, [confirmDestructiveAction, fetchRemoteSettings, settingsClient]);

  const openMcpServerEditor = useCallback(() => {
    setMcpServerEditorMode('create');
    setMcpServerDraft(EMPTY_MCP_SERVER_DRAFT);
    setShowMcpServerEditor(true);
  }, []);

  const openMcpServerReplaceEditor = useCallback((server: MCPServer) => {
    setMcpServerEditorMode('replace');
    setMcpServerDraft({
      ...EMPTY_MCP_SERVER_DRAFT,
      name: server.name,
      disabled: server.configDisabled,
    });
    setShowMcpServerEditor(true);
  }, []);

  const closeMcpServerEditor = useCallback(() => {
    if (isSavingMcpServer) return;
    setShowMcpServerEditor(false);
    setMcpServerEditorMode('create');
    setMcpServerDraft(EMPTY_MCP_SERVER_DRAFT);
  }, [isSavingMcpServer]);

  const closeMcpImportModal = useCallback(() => {
    if (isImportingMcpServers) return;
    setShowMcpImportModal(false);
    setMcpImportJsonText('');
  }, [isImportingMcpServers]);

  const handleMcpServerDraftChange = useCallback(<K extends keyof McpServerDraft>(
    key: K,
    value: McpServerDraft[K],
  ) => {
    setMcpServerDraft(prev => ({ ...prev, [key]: value }));
  }, []);

  const buildMcpServerConfigFromDraft = (): { name: string; config: MCPServerConfig } | null => {
    const name = mcpServerDraft.name.trim();
    if (!name) {
      setRemoteError('MCP server name is required');
      return null;
    }
    if (isReservedMcpServerName(name, RESERVED_RUNTIME_TOOL_SERVER_NAMES)) {
      setRemoteError(`MCP server name "${name}" is reserved`);
      return null;
    }
    if (mcpServerEditorMode === 'create' && mcpServers.some(server => server.name === name)) {
      setRemoteError(`MCP server "${name}" already exists`);
      return null;
    }

    const config: MCPServerConfig = {
      transport: mcpServerDraft.transport,
    };

    if (mcpServerDraft.transport === 'stdio') {
      const command = mcpServerDraft.command.trim();
      if (!command) {
        setRemoteError('Command is required for stdio MCP servers');
        return null;
      }
      config.command = command;
      const args = mcpServerDraft.args
        .split('\n')
        .map((arg) => arg.trim())
        .filter(Boolean);
      if (args.length > 0) config.args = args;

      const envResult = parseMcpKeyValueDraft(mcpServerDraft.env, 'Environment');
      if (envResult.error) {
        setRemoteError(envResult.error);
        return null;
      }
      if (envResult.value && Object.keys(envResult.value).length > 0) {
        config.env = envResult.value;
      }
    } else {
      const url = mcpServerDraft.url.trim();
      if (!url) {
        setRemoteError('URL is required for remote MCP servers');
        return null;
      }
      try {
        new URL(url);
      } catch {
        setRemoteError('MCP server URL is invalid');
        return null;
      }
      config.url = url;

      const headersResult = parseMcpKeyValueDraft(mcpServerDraft.headers, 'Header');
      if (headersResult.error) {
        setRemoteError(headersResult.error);
        return null;
      }
      if (headersResult.value && Object.keys(headersResult.value).length > 0) {
        config.headers = headersResult.value;
      }
    }

    const timeout = mcpServerDraft.timeout.trim();
    if (timeout) {
      const parsedTimeout = Number(timeout);
      if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0) {
        setRemoteError('Timeout must be a positive number');
        return null;
      }
      config.timeout = Math.floor(parsedTimeout);
    }
    if (mcpServerDraft.disabled) config.disabled = true;

    return { name, config };
  };

  const handleMcpServerEditorSave = async () => {
    if (!settingsClient) return;

    const draftConfig = buildMcpServerConfigFromDraft();
    if (!draftConfig) return;

    setIsSavingMcpServer(true);
    setRemoteError(null);
    try {
      await settingsClient.upsertMCPServerConfig(draftConfig.name, draftConfig.config);
      const serversRes = await settingsClient.getMCPServers();
      setMcpServers(serversRes.servers);
      setShowMcpServerEditor(false);
      setMcpServerEditorMode('create');
      setMcpServerDraft(EMPTY_MCP_SERVER_DRAFT);
      setSaveStatusMessage('Saved');
    } catch (error: any) {
      console.error('[Settings] Failed to save MCP server:', error);
      setRemoteError(error.message || 'Failed to save MCP server');
    } finally {
      setIsSavingMcpServer(false);
    }
  };

  const handleMcpServerImport = async () => {
    if (!settingsClient || !mcpImportJsonText.trim()) return;

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(mcpImportJsonText.trim());
    } catch {
      setRemoteError('MCP server JSON is invalid');
      Alert.alert('Import Failed', 'MCP server JSON is invalid');
      return;
    }

    const parsedRequest = parseMcpServerConfigImportRequestBody(parsedJson);
    if (parsedRequest.ok === false) {
      setRemoteError(parsedRequest.error);
      Alert.alert('Import Failed', parsedRequest.error);
      return;
    }

    setIsImportingMcpServers(true);
    setRemoteError(null);
    try {
      const result = await settingsClient.importMCPServerConfigs(parsedRequest.request.config);
      setShowMcpImportModal(false);
      setMcpImportJsonText('');
      setSaveStatusMessage('Saved');

      try {
        const serversRes = await settingsClient.getMCPServers();
        setMcpServers(serversRes.servers);
      } catch (refreshError: any) {
        console.error('[Settings] Failed to refresh MCP servers after import:', refreshError);
      }

      const importedLabel = `${result.importedCount} MCP server${result.importedCount === 1 ? '' : 's'}`;
      const skippedLabel = result.skippedReservedServerNames.length > 0
        ? ` Skipped reserved names: ${result.skippedReservedServerNames.join(', ')}.`
        : '';
      Alert.alert('Import Complete', `Imported ${importedLabel}.${skippedLabel}`);
    } catch (error: any) {
      console.error('[Settings] Failed to import MCP servers:', error);
      setRemoteError(error.message || 'Failed to import MCP servers');
      Alert.alert('Import Failed', error.message || 'Failed to import MCP servers');
    } finally {
      setIsImportingMcpServers(false);
    }
  };

  const shareMcpServerExport = async () => {
    if (!settingsClient) return;

    setIsExportingMcpServers(true);
    setRemoteError(null);
    try {
      const result = await settingsClient.exportMCPServerConfigs();
      const serverNames = Object.keys(result.config.mcpServers || {});
      await Share.share({
        message: JSON.stringify(result.config, null, 2),
        title: 'Export MCP Servers',
      });
      setSaveStatusMessage(`Exported ${serverNames.length} MCP server${serverNames.length === 1 ? '' : 's'}`);
    } catch (error: any) {
      console.error('[Settings] Failed to export MCP servers:', error);
      setRemoteError(error.message || 'Failed to export MCP servers');
      Alert.alert('Export Failed', error.message || 'Failed to export MCP servers');
    } finally {
      setIsExportingMcpServers(false);
    }
  };

  const handleMcpServerExport = () => {
    if (!settingsClient) return;

    const message = 'MCP config exports can include tokens, headers, and environment variables. Share only with places you trust.';

    if (Platform.OS === 'web') {
      const confirmFn = (globalThis as { confirm?: (text?: string) => boolean }).confirm;
      if (!confirmFn || !confirmFn(`Export MCP Servers\n\n${message}`)) {
        return;
      }
      void shareMcpServerExport();
      return;
    }

    Alert.alert('Export MCP Servers', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: () => {
          void shareMcpServerExport();
        },
      },
    ]);
  };

  // Handle knowledge note delete
  const handleKnowledgeNoteDelete = async (noteId: string) => {
    if (!settingsClient) return;
    confirmDestructiveAction('Delete Note', 'Are you sure you want to delete this note?', async () => {
      try {
        await settingsClient.deleteKnowledgeNote(noteId);
        setKnowledgeNotes(prev => prev.filter(note => note.id !== noteId));
        setKnowledgeNoteSearchResults(prev => prev.filter(note => note.id !== noteId));
        setSelectedKnowledgeNoteIds(prev => {
          const next = new Set(prev);
          next.delete(noteId);
          return next;
        });
      } catch (error: any) {
        console.error('[Settings] Failed to delete knowledge note:', error);
        Alert.alert('Error', 'Failed to delete note');
      }
    });
  };

  const handleKnowledgeNoteDeleteMultiple = async () => {
    if (!settingsClient || visibleSelectedKnowledgeNoteIds.length === 0) return;
    const ids = visibleSelectedKnowledgeNoteIds;
    confirmDestructiveAction(
      'Delete Selected Notes',
      `Delete ${ids.length} selected note${ids.length === 1 ? '' : 's'}? This cannot be undone.`,
      async () => {
        try {
          await settingsClient.deleteKnowledgeNotes(ids);
          const deletedIds = new Set(ids);
          setKnowledgeNotes(prev => prev.filter(note => !deletedIds.has(note.id)));
          setKnowledgeNoteSearchResults(prev => prev.filter(note => !deletedIds.has(note.id)));
          setSelectedKnowledgeNoteIds(prev => {
            const next = new Set(prev);
            ids.forEach((id) => next.delete(id));
            return next;
          });
        } catch (error: any) {
          console.error('[Settings] Failed to delete selected knowledge notes:', error);
          Alert.alert('Error', 'Failed to delete selected notes');
        }
      }
    );
  };

  const handleKnowledgeNoteDeleteAll = async () => {
    if (!settingsClient || knowledgeNotes.length === 0) return;
    confirmDestructiveAction(
      'Delete All Notes',
      'Delete every knowledge note on desktop? This cannot be undone.',
      async () => {
        try {
          await settingsClient.deleteAllKnowledgeNotes();
          setKnowledgeNotes([]);
          setKnowledgeNoteSearchResults([]);
          setSelectedKnowledgeNoteIds(new Set());
        } catch (error: any) {
          console.error('[Settings] Failed to delete all knowledge notes:', error);
          Alert.alert('Error', 'Failed to delete all notes');
        }
      }
    );
  };

  const handleKnowledgeNotePromote = useCallback(async (note: KnowledgeNote) => {
    if (!settingsClient || note.context === 'auto') return;
    try {
      await settingsClient.updateKnowledgeNote(note.id, { context: 'auto' });
      setKnowledgeNotes(prev =>
        prev.map(existing =>
          existing.id === note.id
            ? { ...existing, context: 'auto', updatedAt: Date.now() }
            : existing
        )
      );
      setKnowledgeNoteSearchResults(prev =>
        prev.map(existing =>
          existing.id === note.id
            ? { ...existing, context: 'auto', updatedAt: Date.now() }
            : existing
        )
      );
    } catch (error: any) {
      console.error('[Settings] Failed to promote knowledge note to auto context:', error);
      Alert.alert('Error', 'Failed to promote note to auto context');
    }
  }, [settingsClient]);

  // Navigate to knowledge note edit screen
  const handleKnowledgeNoteEdit = useCallback((note?: KnowledgeNote) => {
    navigation.navigate('KnowledgeNoteEdit', {
      noteId: note?.id,
      note,
    });
  }, [navigation]);

  const toggleKnowledgeNoteSelection = useCallback((noteId: string) => {
    setSelectedKnowledgeNoteIds(prev => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  }, []);

  const handleSkillEdit = useCallback((skill?: Skill) => {
    navigation.navigate('SkillEdit', {
      skillId: skill?.id,
      skill,
    });
  }, [navigation]);

  const handleSkillDelete = useCallback((skill: Skill) => {
    if (!settingsClient) return;
    confirmDestructiveAction('Delete Skill', `Are you sure you want to delete "${skill.name}"?`, async () => {
      try {
        await settingsClient.deleteSkill(skill.id);
        setSkills(prev => prev.filter(item => item.id !== skill.id));
      } catch (error: any) {
        console.error('[Settings] Failed to delete skill:', error);
        Alert.alert('Error', error.message || 'Failed to delete skill');
      }
    });
  }, [confirmDestructiveAction, settingsClient]);

  // Handle agent profile toggle
  const handleAgentProfileToggle = async (profileId: string) => {
    if (!settingsClient) return;
    try {
      const res = await settingsClient.toggleAgentProfile(profileId);
      setAgentProfiles(prev =>
        prev.map(p => (p.id === profileId ? { ...p, enabled: res.enabled } : p))
      );
    } catch (error: any) {
      console.error('[Settings] Failed to toggle agent profile:', error);
      Alert.alert('Error', 'Failed to toggle agent profile');
    }
  };

  const handleAgentProfilesReload = useCallback(async () => {
    if (!settingsClient || isReloadingAgentProfiles) return;

    setIsReloadingAgentProfiles(true);
    try {
      const res = await settingsClient.reloadAgentProfiles();
      setAgentProfiles(res.profiles);
    } catch (error: any) {
      console.error('[Settings] Failed to reload agent profiles:', error);
      Alert.alert('Error', error.message || 'Failed to rescan agent files');
    } finally {
      setIsReloadingAgentProfiles(false);
    }
  }, [isReloadingAgentProfiles, settingsClient]);

  // Handle agent profile delete
  const handleAgentProfileDelete = useCallback(async (profile: AgentProfile) => {
    if (!settingsClient) return;
    if (profile.isBuiltIn) {
      Alert.alert('Cannot Delete', 'Built-in agents cannot be deleted');
      return;
    }

    confirmDestructiveAction('Delete Agent', `Are you sure you want to delete "${profile.displayName}"?`, async () => {
      try {
        await settingsClient.deleteAgentProfile(profile.id);
        setAgentProfiles(prev => prev.filter(p => p.id !== profile.id));
      } catch (error: any) {
        console.error('[Settings] Failed to delete agent profile:', error);
        Alert.alert('Error', error.message || 'Failed to delete agent profile');
      }
    });
  }, [settingsClient, confirmDestructiveAction]);

  // Navigate to agent edit screen
  const handleAgentProfileEdit = useCallback((agentId?: string) => {
    navigation.navigate('AgentEdit', { agentId });
  }, [navigation]);

  // Navigate to loop edit screen
  const handleLoopEdit = useCallback((loop?: Loop) => {
    navigation.navigate('LoopEdit', {
      loopId: loop?.id,
      loop,
    });
  }, [navigation]);

  const closeLoopImportModal = useCallback(() => {
    if (isImportingLoopMarkdown) return;
    setShowLoopImportModal(false);
    setLoopImportMarkdownText('');
  }, [isImportingLoopMarkdown]);

  const handleLoopMarkdownImport = useCallback(async () => {
    if (!settingsClient || !loopImportMarkdownText.trim()) return;

    setIsImportingLoopMarkdown(true);
    setRemoteError(null);
    try {
      const result = await settingsClient.importLoopFromMarkdown(loopImportMarkdownText.trim());
      setShowLoopImportModal(false);
      setLoopImportMarkdownText('');
      setSaveStatusMessage(`Imported loop "${result.loop.name}"`);
      await fetchLoops();
      Alert.alert('Import Complete', `Imported "${result.loop.name}".`);
    } catch (error: any) {
      console.error('[Settings] Failed to import loop Markdown:', error);
      setRemoteError(error.message || 'Failed to import loop');
      Alert.alert('Import Failed', error.message || 'Failed to import loop');
    } finally {
      setIsImportingLoopMarkdown(false);
    }
  }, [fetchLoops, loopImportMarkdownText, settingsClient]);

  const handleLoopMarkdownExport = useCallback(async (loop: Loop) => {
    if (!settingsClient) return;

    setIsExportingLoopMarkdownId(loop.id);
    setRemoteError(null);
    try {
      const result = await settingsClient.exportLoopToMarkdown(loop.id);
      await Share.share({
        message: result.markdown,
        title: `${loop.name}.md`,
      });
      setSaveStatusMessage(`Exported loop "${loop.name}"`);
    } catch (error: any) {
      console.error('[Settings] Failed to export loop Markdown:', error);
      setRemoteError(error.message || 'Failed to export loop');
      Alert.alert('Export Failed', error.message || 'Failed to export loop');
    } finally {
      setIsExportingLoopMarkdownId(null);
    }
  }, [settingsClient]);

  const handleLoopDelete = useCallback((loop: Loop) => {
    if (!settingsClient) return;
    confirmDestructiveAction('Delete Loop', `Are you sure you want to delete "${loop.name}"?`, async () => {
      try {
        await settingsClient.deleteLoop(loop.id);
        setLoops(prev => prev.filter(item => item.id !== loop.id));
      } catch (error: any) {
        console.error('[Settings] Failed to delete loop:', error);
        Alert.alert('Error', error.message || 'Failed to delete loop');
      }
    });
  }, [settingsClient, confirmDestructiveAction]);

  // Handle loop toggle
  const handleLoopToggle = async (loopId: string) => {
    if (!settingsClient) return;
    try {
      const res = await settingsClient.toggleLoop(loopId);
      setLoops(prev =>
        prev.map(l => (l.id === loopId ? { ...l, enabled: res.enabled } : l))
      );
      void fetchLoops();
    } catch (error: any) {
      console.error('[Settings] Failed to toggle loop:', error);
      Alert.alert('Error', 'Failed to toggle loop');
    }
  };

  // Handle loop run
  const handleLoopRun = async (loopId: string) => {
    if (!settingsClient) return;
    try {
      await settingsClient.runLoop(loopId);
      Alert.alert('Success', 'Loop triggered successfully');
      // Refresh loops to get updated lastRunAt
      fetchLoops();
    } catch (error: any) {
      console.error('[Settings] Failed to run loop:', error);
      Alert.alert('Error', error.message || 'Failed to run loop');
    }
  };

  const handleLoopStart = async (loop: Loop) => {
    if (!settingsClient) return;
    setLoopRuntimeAction({ loopId: loop.id, action: 'start' });
    setRemoteError(null);
    try {
      const result = await settingsClient.startLoop(loop.id);
      setLoops(prev =>
        prev.map(item => (item.id === loop.id ? applyRepeatTaskRuntimeStatus(item, result.status) : item))
      );
      setSaveStatusMessage(`Started loop "${loop.name}"`);
      await fetchLoops();
    } catch (error: any) {
      console.error('[Settings] Failed to start loop:', error);
      setRemoteError(error.message || 'Failed to start loop');
      Alert.alert('Error', error.message || 'Failed to start loop');
    } finally {
      setLoopRuntimeAction(prev =>
        prev?.loopId === loop.id && prev.action === 'start' ? null : prev
      );
    }
  };

  const handleLoopStop = async (loop: Loop) => {
    if (!settingsClient) return;
    setLoopRuntimeAction({ loopId: loop.id, action: 'stop' });
    setRemoteError(null);
    try {
      const result = await settingsClient.stopLoop(loop.id);
      setLoops(prev =>
        prev.map(item => (item.id === loop.id ? applyRepeatTaskRuntimeStatus(item, result.status) : item))
      );
      setSaveStatusMessage(`Stopped loop "${loop.name}"`);
      await fetchLoops();
    } catch (error: any) {
      console.error('[Settings] Failed to stop loop:', error);
      setRemoteError(error.message || 'Failed to stop loop');
      Alert.alert('Error', error.message || 'Failed to stop loop');
    } finally {
      setLoopRuntimeAction(prev =>
        prev?.loopId === loop.id && prev.action === 'stop' ? null : prev
      );
    }
  };

  // Handle push notification toggle
  const handleNotificationToggle = async (enabled: boolean) => {
    if (!config.baseUrl || !config.apiKey) {
      Alert.alert('Configuration Required', 'Please configure your server connection first.');
      return;
    }

    if (enabled) {
      const success = await registerPush(config.baseUrl, config.apiKey);
      if (!success) {
        Alert.alert(
          'Permission Required',
          'Push notifications require permission. Please enable notifications in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } else {
      await unregisterPush(config.baseUrl, config.apiKey);
    }
  };

  // Fetch available models for the current provider
  const fetchModels = useCallback(async (providerId: CHAT_PROVIDER_ID) => {
    if (!settingsClient) return;

    setIsLoadingModels(true);
    try {
      const response = await settingsClient.getModels(providerId);
      setAvailableModels(response.models);
      // Check if current model is in the list, if not enable custom mode
      const currentModel = getCurrentModelValue();
      if (currentModel && response.models.length > 0) {
        const isInList = response.models.some(m => m.id === currentModel);
        setUseCustomModel(!isInList);
      }
    } catch (error: any) {
      console.error('[Settings] Failed to fetch models:', error);
      // Keep any existing models on error to avoid UI looking empty
      // Only log the error, don't clear the list
    } finally {
      setIsLoadingModels(false);
    }
  }, [settingsClient]);

  const getAgentProvider = (): CHAT_PROVIDER_ID => resolveAgentProviderId(remoteSettings);

  // Fetch models when remote settings load or provider changes
  useEffect(() => {
    const providerId = remoteSettings?.agentProviderId || remoteSettings?.mcpToolsProviderId;
    if (providerId && settingsClient) {
      fetchModels(providerId);
    }
  }, [remoteSettings?.agentProviderId, remoteSettings?.mcpToolsProviderId, settingsClient, fetchModels]);

  // Handle provider change
  const handleProviderChange = async (provider: CHAT_PROVIDER_ID) => {
    if (!settingsClient || !remoteSettings || getAgentProvider() === provider) return;

    // Cancel any pending model update to avoid writing to the wrong provider's model key
    if (modelUpdateTimeoutRef.current) {
      clearTimeout(modelUpdateTimeoutRef.current);
      modelUpdateTimeoutRef.current = null;
    }

    try {
      await settingsClient.updateSettings({ agentProviderId: provider });
      setRemoteSettings(prev => prev ? { ...prev, agentProviderId: provider } : null);
      // Reset custom model mode when switching providers
      setUseCustomModel(false);
      // Models will be fetched via the useEffect above
    } catch (error: any) {
      console.error('[Settings] Failed to change provider:', error);
      setRemoteError(error.message || 'Failed to change provider');
    }
  };

  // Handle preset change (OpenAI compatible providers)
  const handlePresetChange = async (presetId: string) => {
    if (!settingsClient || !remoteSettings || remoteSettings.currentModelPresetId === presetId) return;

    // Cancel any pending model update to avoid writing to the wrong preset's context
    if (modelUpdateTimeoutRef.current) {
      clearTimeout(modelUpdateTimeoutRef.current);
      modelUpdateTimeoutRef.current = null;
    }

    setShowPresetPicker(false);
    try {
      await settingsClient.updateSettings({ currentModelPresetId: presetId });
      const nextSettings = await refreshRemoteSettingsSnapshot();
      // Reset models and fetch new ones for the new preset
      setAvailableModels([]);
      setUseCustomModel(false);
      // Fetch models for the new preset
      if ((nextSettings?.agentProviderId || nextSettings?.mcpToolsProviderId || getAgentProvider()) === 'openai') {
        fetchModels('openai');
      }
    } catch (error: any) {
      console.error('[Settings] Failed to change preset:', error);
      setRemoteError(error.message || 'Failed to change preset');
    }
  };

  const getCurrentModelPreset = (): ModelPresetSummary | undefined => {
    if (!remoteSettings?.availablePresets || !remoteSettings.currentModelPresetId) return undefined;
    return remoteSettings.availablePresets.find(p => p.id === remoteSettings.currentModelPresetId);
  };

  // Get current preset display name
  const getCurrentPresetName = () => {
    if (!remoteSettings?.availablePresets || !remoteSettings.currentModelPresetId) return 'OpenAI';
    const preset = remoteSettings.availablePresets.find(p => p.id === remoteSettings.currentModelPresetId);
    return preset?.name || 'OpenAI';
  };

  const openPresetEditor = (mode: ModelPresetEditorMode, preset?: ModelPresetSummary) => {
    setPresetEditorMode(mode);
    if (mode === 'edit' && preset) {
      setPresetDraft({
        id: preset.id,
        name: preset.name,
        baseUrl: preset.baseUrl,
        apiKey: '',
        agentModel: preset.agentModel || preset.mcpToolsModel || '',
        transcriptProcessingModel: preset.transcriptProcessingModel || '',
        isBuiltIn: preset.isBuiltIn ?? false,
        hasApiKey: !!preset.hasApiKey,
      });
    } else {
      setPresetDraft(EMPTY_MODEL_PRESET_DRAFT);
    }
    setShowPresetEditor(true);
  };

  const closePresetEditor = () => {
    if (isSavingPreset) return;
    setShowPresetEditor(false);
    setPresetDraft(EMPTY_MODEL_PRESET_DRAFT);
  };

  const handlePresetDraftChange = (key: keyof ModelPresetDraft, value: string) => {
    setPresetDraft(prev => ({ ...prev, [key]: value }));
  };

  const refreshSettingsAfterPresetMutation = async () => {
    const nextSettings = await refreshRemoteSettingsSnapshot();
    if ((nextSettings?.agentProviderId || nextSettings?.mcpToolsProviderId) === 'openai') {
      setAvailableModels([]);
      fetchModels('openai');
    }
  };

  const handlePresetEditorSave = async () => {
    if (!settingsClient) return;

    const name = presetDraft.name.trim();
    const baseUrl = presetDraft.baseUrl.trim();
    if (!name) {
      setRemoteError('Endpoint name is required');
      return;
    }
    if (!baseUrl) {
      setRemoteError('Endpoint base URL is required');
      return;
    }

    setIsSavingPreset(true);
    setRemoteError(null);
    try {
      const payload = {
        name,
        baseUrl,
        apiKey: presetDraft.apiKey.trim(),
        agentModel: presetDraft.agentModel.trim(),
        transcriptProcessingModel: presetDraft.transcriptProcessingModel.trim(),
      };

      if (presetEditorMode === 'create') {
        await settingsClient.createModelPreset(payload);
      } else if (presetDraft.id) {
        await settingsClient.updateModelPreset(presetDraft.id, payload);
      }

      await refreshSettingsAfterPresetMutation();
      setShowPresetEditor(false);
      setPresetDraft(EMPTY_MODEL_PRESET_DRAFT);
      setSaveStatusMessage('Saved');
    } catch (error: any) {
      console.error('[Settings] Failed to save endpoint:', error);
      setRemoteError(error.message || 'Failed to save endpoint');
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handlePresetDelete = () => {
    if (!settingsClient || !presetDraft.id || presetDraft.isBuiltIn) return;

    confirmDestructiveAction(
      'Delete Endpoint',
      `Are you sure you want to delete "${presetDraft.name}"?`,
      async () => {
        setIsSavingPreset(true);
        setRemoteError(null);
        try {
          await settingsClient.deleteModelPreset(presetDraft.id!);
          await refreshSettingsAfterPresetMutation();
          setShowPresetEditor(false);
          setPresetDraft(EMPTY_MODEL_PRESET_DRAFT);
          setSaveStatusMessage('Saved');
        } catch (error: any) {
          console.error('[Settings] Failed to delete endpoint:', error);
          setRemoteError(error.message || 'Failed to delete endpoint');
        } finally {
          setIsSavingPreset(false);
        }
      },
      'Delete'
    );
  };

  // Handle model name change with debouncing to avoid request storms per keystroke
  const handleModelNameChange = useCallback((modelName: string) => {
    // Update draft state immediately for responsive UI
    setCustomModelDraft(modelName);
    if (remoteSettings) {
      const pendingModelKey = getAgentModelSettingKey(getAgentProvider());
      markRemotePending(pendingModelKey);
    }
    setSaveStatusMessage(null);

    // Cancel any pending update
    if (modelUpdateTimeoutRef.current) {
      clearTimeout(modelUpdateTimeoutRef.current);
    }

    // Debounce the actual API call by 500ms
    modelUpdateTimeoutRef.current = setTimeout(async () => {
      if (!settingsClient || !remoteSettings) return;

      const provider = getAgentProvider();
      const modelKey = getAgentModelSettingKey(provider);

      // Update local state
      setRemoteSettings(prev => prev ? { ...prev, [modelKey]: modelName } : null);

      try {
        await settingsClient.updateSettings({ [modelKey]: modelName });
        clearRemotePending(modelKey);
        modelUpdateTimeoutRef.current = null;
      } catch (error: any) {
        console.error('[Settings] Failed to update model:', error);
        setRemoteError(error.message || 'Failed to update model');
        // Refresh to get actual state
        fetchRemoteSettings();
      }
    }, 500);
  }, [clearRemotePending, fetchRemoteSettings, markRemotePending, remoteSettings, settingsClient]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (modelUpdateTimeoutRef.current) {
        clearTimeout(modelUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Sync customModelDraft with remoteSettings when it changes (e.g., on initial load or provider change)
  useEffect(() => {
    if (remoteSettings) {
      setCustomModelDraft(getCurrentModelValue());
    }
  }, [remoteSettings?.agentProviderId, remoteSettings?.mcpToolsProviderId, remoteSettings?.agentOpenaiModel, remoteSettings?.agentGroqModel, remoteSettings?.agentGeminiModel, remoteSettings?.agentChatgptWebModel, remoteSettings?.mcpToolsOpenaiModel, remoteSettings?.mcpToolsGroqModel, remoteSettings?.mcpToolsGeminiModel, remoteSettings?.mcpToolsChatgptWebModel]);

  // Get current model value based on provider
  const getCurrentModelValue = () => {
    if (!remoteSettings) return '';
    return resolveConfiguredAgentModel(remoteSettings, getAgentProvider(), {
      includeFallback: false,
      includeOpenAiPresetFallback: false,
    });
  };

  // Get placeholder based on provider
  const getModelPlaceholder = () => {
    if (!remoteSettings) return '';
    return getAgentModelPlaceholder(getAgentProvider());
  };

  // Get display name for current model
  const getCurrentModelDisplayName = () => {
    const currentValue = getCurrentModelValue();
    if (!currentValue) return 'Select a model';
    const model = availableModels.find(m => m.id === currentValue);
    return model?.name || currentValue;
  };

  // Handle model selection from picker
  const handleModelSelect = async (modelId: string) => {
    setShowModelPicker(false);
    setModelSearchQuery('');
    await handleModelNameChange(modelId);
  };

  // Filter models by search query
  const filteredModels = useMemo(() => {
    return filterModelOptionsByQuery(availableModels, modelSearchQuery);
  }, [availableModels, modelSearchQuery]);

  const flushAllSettingsSaves = useCallback(async () => {
    if (isSavingAllSettings) return;

    setIsSavingAllSettings(true);
    setSaveStatusMessage('Saving…');

    try {
      setConfig(draft);
      await saveConfig(draft);
      setHasPendingLocalSave(false);

      if (settingsClient && remoteSettings) {
        clearAllRemoteTimeouts();

        const updates: SettingsUpdate = {};
        const pendingKeys = new Set(pendingRemoteSaveKeys);

        if (pendingKeys.has('sttLanguage')) {
          updates.sttLanguage = inputDrafts.sttLanguage ?? '';
        }
        if (pendingKeys.has('openaiSttLanguage')) {
          updates.openaiSttLanguage = inputDrafts.openaiSttLanguage ?? '';
        }
        if (pendingKeys.has('groqSttLanguage')) {
          updates.groqSttLanguage = inputDrafts.groqSttLanguage ?? '';
        }
        if (pendingKeys.has('openaiSttModel')) {
          updates.openaiSttModel = inputDrafts.openaiSttModel ?? '';
        }
        if (pendingKeys.has('groqSttModel')) {
          updates.groqSttModel = inputDrafts.groqSttModel ?? '';
        }
        if (pendingKeys.has('groqSttPrompt')) {
          updates.groqSttPrompt = inputDrafts.groqSttPrompt ?? '';
        }
        if (pendingKeys.has('transcriptPostProcessingPrompt')) {
          updates.transcriptPostProcessingPrompt = inputDrafts.transcriptPostProcessingPrompt ?? '';
        }
        if (pendingKeys.has('transcriptPostProcessingOpenaiModel')) {
          updates.transcriptPostProcessingOpenaiModel = inputDrafts.transcriptPostProcessingOpenaiModel ?? '';
        }
        if (pendingKeys.has('transcriptPostProcessingGroqModel')) {
          updates.transcriptPostProcessingGroqModel = inputDrafts.transcriptPostProcessingGroqModel ?? '';
        }
        if (pendingKeys.has('transcriptPostProcessingGeminiModel')) {
          updates.transcriptPostProcessingGeminiModel = inputDrafts.transcriptPostProcessingGeminiModel ?? '';
        }
        if (pendingKeys.has('transcriptPostProcessingChatgptWebModel')) {
          updates.transcriptPostProcessingChatgptWebModel = inputDrafts.transcriptPostProcessingChatgptWebModel ?? '';
        }
        if (pendingKeys.has('langfusePublicKey')) {
          updates.langfusePublicKey = inputDrafts.langfusePublicKey ?? '';
        }
        if (pendingKeys.has('langfuseBaseUrl')) {
          updates.langfuseBaseUrl = inputDrafts.langfuseBaseUrl ?? '';
        }
        if (pendingKeys.has('localTraceLogPath')) {
          updates.localTraceLogPath = inputDrafts.localTraceLogPath ?? '';
        }
        if (pendingKeys.has('mcpMaxIterations')) {
          const parsedIterations = parseMcpMaxIterationsDraft(inputDrafts.mcpMaxIterations ?? '');
          if (parsedIterations === null) {
            throw new Error(formatMcpMaxIterationsValidationMessage());
          }
          updates.mcpMaxIterations = parsedIterations;
        }
        if (pendingKeys.has('whatsappAllowFrom')) {
          updates.whatsappAllowFrom = parseConfigListInput(inputDrafts.whatsappAllowFrom ?? '');
        }
        for (const key of DISCORD_LIST_SETTING_KEYS) {
          if (pendingKeys.has(key)) {
            updates[key] = parseConfigListInput(inputDrafts[key] ?? '', { unique: true });
          }
        }
        for (const section of PROVIDER_CREDENTIAL_SECTIONS) {
          if (pendingKeys.has(section.baseUrl)) {
            updates[section.baseUrl] = inputDrafts[section.baseUrl] ?? '';
          }
          if (pendingKeys.has(section.apiKey)) {
            updates[section.apiKey] = inputDrafts[section.apiKey] ?? '';
          }
        }

        const modelKey = getAgentModelSettingKey(getAgentProvider());
        if (pendingKeys.has(modelKey)) {
          if (modelKey === 'agentOpenaiModel') {
            updates.agentOpenaiModel = customModelDraft;
          } else if (modelKey === 'agentGroqModel') {
            updates.agentGroqModel = customModelDraft;
          } else if (modelKey === 'agentGeminiModel') {
            updates.agentGeminiModel = customModelDraft;
          } else {
            updates.agentChatgptWebModel = customModelDraft;
          }
        }

        const langfuseSecretDraft = inputDrafts.langfuseSecretKey?.trim();
        if (pendingKeys.has('langfuseSecretKey') && langfuseSecretDraft) {
          updates.langfuseSecretKey = langfuseSecretDraft;
        }
        if (pendingKeys.has('discordBotToken')) {
          updates.discordBotToken = inputDrafts.discordBotToken ?? '';
        }

        if (Object.keys(updates).length > 0) {
          await settingsClient.updateSettings(updates);
          setRemoteSettings((prev) => prev ? {
            ...prev,
            ...updates,
            ...(updates.openaiApiKey !== undefined ? { openaiApiKey: updates.openaiApiKey ? SECRET_MASK : '' } : {}),
            ...(updates.groqApiKey !== undefined ? { groqApiKey: updates.groqApiKey ? SECRET_MASK : '' } : {}),
            ...(updates.geminiApiKey !== undefined ? { geminiApiKey: updates.geminiApiKey ? SECRET_MASK : '' } : {}),
            ...(updates.discordBotToken !== undefined ? { discordBotToken: updates.discordBotToken ? SECRET_MASK : '' } : {}),
            ...(updates.langfuseSecretKey ? { langfuseSecretKey: '••••••••' } : {}),
          } : null);

          if (updates.langfuseSecretKey || updates.discordBotToken !== undefined || updates.openaiApiKey !== undefined || updates.groqApiKey !== undefined || updates.geminiApiKey !== undefined) {
            setInputDrafts((prev) => ({
              ...prev,
              ...(updates.langfuseSecretKey ? { langfuseSecretKey: '' } : {}),
              ...(updates.discordBotToken !== undefined ? { discordBotToken: '' } : {}),
              ...(updates.openaiApiKey !== undefined ? { openaiApiKey: '' } : {}),
              ...(updates.groqApiKey !== undefined ? { groqApiKey: '' } : {}),
              ...(updates.geminiApiKey !== undefined ? { geminiApiKey: '' } : {}),
            }));
          }
        }

        setPendingRemoteSaveKeys([]);
      }

      setSaveStatusMessage('Saved');
    } catch (error: any) {
      const message = error?.message || 'Failed to save settings';
      setRemoteError(message);
      setSaveStatusMessage(message);
    } finally {
      setIsSavingAllSettings(false);
    }
  }, [
    clearAllRemoteTimeouts,
    customModelDraft,
    draft,
    inputDrafts,
    isSavingAllSettings,
    pendingRemoteSaveKeys,
    remoteSettings,
    saveConfig,
    setConfig,
    settingsClient,
  ]);

  const hasPendingSaves = hasPendingLocalSave || pendingRemoteSaveKeys.length > 0;
  const saveButtonLabel = isSavingAllSettings
    ? 'Saving…'
    : hasPendingSaves
      ? 'Save changes'
      : 'Save settings now';
  const saveButtonHint = hasPendingSaves
    ? 'Save all current settings immediately, including typed edits that have not blurred yet.'
    : 'Save the current settings again if you want a clear confirmation.';


  // CollapsibleSection component
  const CollapsibleSection = ({
    id,
    title,
    children
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections[id] ?? false;
    return (
      <View style={styles.collapsibleSection}>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => toggleSection(id)}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
        >
          <Text style={styles.collapsibleTitle}>{title}</Text>
          <Text style={styles.collapsibleChevron}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.collapsibleContent}>
            {children}
          </View>
        )}
      </View>
    );
  };

  const renderKnowledgeNoteRow = (note: KnowledgeNote) => {
    const isSelected = selectedKnowledgeNoteIds.has(note.id);
    return (
      <View key={note.id} style={[styles.serverRow, { alignItems: 'flex-start' }]}>
        <TouchableOpacity
          style={styles.agentInfoPressable}
          onPress={() => handleKnowledgeNoteEdit(note)}
          activeOpacity={0.7}
        >
          <View style={[styles.serverInfo, { flex: 1 }]}>
            <Text style={styles.serverName}>{note.title}</Text>
            <Text style={styles.serverMeta} numberOfLines={2}>{note.summary || note.body}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
              {note.tags.map((tag, idx) => (
                <View key={idx} style={[styles.providerOption, { paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginTop: 2 }]}>
                  <Text style={[styles.providerOptionText, { fontSize: 10 }]}>{tag}</Text>
                </View>
              ))}
              <View style={[styles.providerOption, { paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginTop: 2 }]}>
                <Text style={[styles.providerOptionText, { fontSize: 10 }]}>{note.context}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.noteActions}>
          <TouchableOpacity
            style={[styles.noteSelectButton, isSelected && styles.noteSelectButtonSelected]}
            onPress={() => toggleKnowledgeNoteSelection(note.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} note ${note.title}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.noteSelectButtonText, isSelected && styles.noteSelectButtonTextSelected]}>
              {isSelected ? 'Selected' : 'Select'}
            </Text>
          </TouchableOpacity>
          {note.context === 'search-only' && (
            <TouchableOpacity
              style={styles.notePromoteButton}
              onPress={() => handleKnowledgeNotePromote(note)}
              accessibilityLabel={`Promote note ${note.title} to auto context`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.notePromoteButtonText}>Promote to auto</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.noteDeleteButton}
            onPress={() => handleKnowledgeNoteDelete(note.id)}
            accessibilityLabel={`Delete note ${note.title}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.noteDeleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!ready) return null;

  return (
    <>
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing['3xl'] + 120 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Connection Card - Tap to navigate to ConnectionSettings */}
        <TouchableOpacity
          style={styles.connectionCard}
          onPress={() => navigation.navigate('ConnectionSettings')}
          accessibilityRole="button"
          accessibilityLabel="Connection settings"
        >
          <View style={styles.connectionCardContent}>
            <View style={styles.connectionCardLeft}>
              <View style={styles.connectionStatusRow}>
                <View style={[
                  styles.statusDot,
                  { width: 10, height: 10, borderRadius: 5 },
                  config.baseUrl && config.apiKey
                    ? styles.statusConnected
                    : { backgroundColor: '#ef4444' }
                ]} />
                <Text style={styles.connectionCardTitle}>
                  {config.baseUrl && config.apiKey ? 'Connected' : 'Not connected'}
                </Text>
              </View>
              {config.baseUrl && (
                <Text style={styles.connectionCardUrl} numberOfLines={2}>
                  {config.baseUrl}
                </Text>
              )}
            </View>
            <Text style={styles.connectionCardChevron}>›</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.connectionCard, !(config.baseUrl && config.apiKey) && styles.primaryButtonDisabled]}
          onPress={() => navigation.navigate('Operations')}
          disabled={!(config.baseUrl && config.apiKey)}
          accessibilityRole="button"
          accessibilityLabel="Operator console"
        >
          <View style={styles.connectionCardContent}>
            <View style={styles.connectionCardLeft}>
              <Text style={styles.connectionCardTitle}>Operator Console</Text>
              <Text style={styles.connectionCardUrl}>
                Health, recent errors, and safe restart actions for the connected desktop.
              </Text>
            </View>
            <Text style={styles.connectionCardChevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Go to Chats button */}
        <TouchableOpacity
          style={[styles.primaryButton, !(config.baseUrl && config.apiKey) && styles.primaryButtonDisabled]}
          onPress={() => {
            if (navigation.canGoBack?.()) {
              navigation.goBack();
              return;
            }

            navigation.navigate('Sessions');
          }}
          disabled={!(config.baseUrl && config.apiKey)}
          accessibilityRole="button"
          accessibilityLabel="Go to Chats"
        >
          <Text style={styles.primaryButtonText}>Go to Chats</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Chats</Text>
        <View style={styles.serverRow}>
          <View style={styles.serverInfo}>
            <Text style={styles.serverName}>Clear all chats</Text>
            <Text style={styles.serverMeta}>
              Delete every chat saved in this mobile app, including pinned chats.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.dangerActionButton,
              sessionStore.sessions.length === 0 && styles.dangerActionButtonDisabled,
            ]}
            onPress={handleClearAllChats}
            disabled={sessionStore.sessions.length === 0}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel('Clear all chats')}
            accessibilityHint="Deletes every chat saved in this mobile app after confirmation."
          >
            <Text
              style={[
                styles.dangerActionButtonText,
                sessionStore.sessions.length === 0 && styles.dangerActionButtonTextDisabled,
              ]}
            >
              Clear All
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.themeSelector}>
          {THEME_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.themeOption,
                themeMode === option.value && styles.themeOptionActive,
              ]}
              onPress={() => setThemeMode(option.value)}
            >
              <Text style={[
                styles.themeOptionText,
                themeMode === option.value && styles.themeOptionTextActive,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Hands-free Voice Mode</Text>
          <Switch
            value={!!draft.handsFree}
            onValueChange={(v) => updateLocalConfig({ handsFree: v })}
            accessibilityLabel={createSwitchAccessibilityLabel('Hands-free Voice Mode')}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
            thumbColor={draft.handsFree ? theme.colors.primaryForeground : theme.colors.background}
          />
        </View>
        <Text style={styles.helperText}>
          Mobile v1 only works while the app stays open on the Chat screen in the foreground.
        </Text>

        <Text style={[styles.label, { marginTop: spacing.md }]}>Wake phrase</Text>
        <TextInput
          style={styles.input}
          value={draft.handsFreeWakePhrase || 'hey dot agents'}
          onChangeText={(value) => updateDraftField({ handsFreeWakePhrase: value })}
          onEndEditing={() => updateLocalConfig({ handsFreeWakePhrase: draft.handsFreeWakePhrase || 'hey dot agents' })}
          placeholder='hey dot agents'
          placeholderTextColor={theme.colors.mutedForeground}
          autoCapitalize='none'
          autoCorrect={false}
        />

        <Text style={[styles.label, { marginTop: spacing.md }]}>Sleep phrase</Text>
        <TextInput
          style={styles.input}
          value={draft.handsFreeSleepPhrase || 'go to sleep'}
          onChangeText={(value) => updateDraftField({ handsFreeSleepPhrase: value })}
          onEndEditing={() => updateLocalConfig({ handsFreeSleepPhrase: draft.handsFreeSleepPhrase || 'go to sleep' })}
          placeholder='go to sleep'
          placeholderTextColor={theme.colors.mutedForeground}
          autoCapitalize='none'
          autoCorrect={false}
        />

        <Text style={[styles.label, { marginTop: spacing.md }]}>Send after silence</Text>
        <TextInput
          style={styles.input}
          value={handsFreeDebounceInput}
          onChangeText={handleHandsFreeDebounceInputChange}
          onEndEditing={commitHandsFreeDebounceInput}
          placeholder={`${DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS}`}
          placeholderTextColor={theme.colors.mutedForeground}
          keyboardType='number-pad'
        />
        <Text style={styles.helperText}>
          Wait this many milliseconds without new speech before sending a hands-free message. Any value ≥ 0 works.
          Current: {Math.round((draft.handsFreeMessageDebounceMs ?? DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS) / 10) / 100}s.
        </Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Debug Voice State</Text>
            <Text style={[styles.helperText, { marginTop: 2 }]}>Show recent recognizer and handsfree events in Chat.</Text>
          </View>
          <Switch
            value={draft.handsFreeDebug === true}
            onValueChange={(v) => updateLocalConfig({ handsFreeDebug: v })}
            accessibilityLabel={createSwitchAccessibilityLabel('Debug Voice State')}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
            thumbColor={draft.handsFreeDebug ? theme.colors.primaryForeground : theme.colors.background}
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Foreground Only</Text>
            <Text style={[styles.helperText, { marginTop: 2 }]}>Keep this on for the mobile MVP safety boundary.</Text>
          </View>
          <Switch
            value={draft.handsFreeForegroundOnly !== false}
            onValueChange={(v) => updateLocalConfig({ handsFreeForegroundOnly: v })}
            accessibilityLabel={createSwitchAccessibilityLabel('Foreground Only')}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
            thumbColor={draft.handsFreeForegroundOnly !== false ? theme.colors.primaryForeground : theme.colors.background}
          />
        </View>

        {/* Microphone Device Selection */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Audio Input</Text>
        <MicrophoneSelector
          selectedDeviceId={draft.audioInputDeviceId}
          onDeviceChange={(deviceId) => updateLocalConfig({ audioInputDeviceId: deviceId })}
        />

        <View style={styles.row}>
          <Text style={styles.label}>Text-to-Speech</Text>
          <Switch
            value={draft.ttsEnabled !== false}
            onValueChange={(v) => updateLocalConfig({ ttsEnabled: v })}
            accessibilityLabel={createSwitchAccessibilityLabel('Text-to-Speech')}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
            thumbColor={draft.ttsEnabled !== false ? theme.colors.primaryForeground : theme.colors.background}
          />
        </View>

        {/* TTS Voice Settings - shown when TTS is enabled */}
        {draft.ttsEnabled !== false && (
          <>
            <TTSSettings
              voiceId={draft.ttsVoiceId}
              rate={draft.ttsRate ?? 1.0}
              pitch={draft.ttsPitch ?? 1.0}
              ttsProvider={draft.ttsProvider ?? 'native'}
              edgeTtsVoice={draft.edgeTtsVoice}
              remoteBaseUrl={draft.baseUrl}
              remoteApiKey={draft.apiKey}
              onVoiceChange={(v) => updateLocalConfig({ ttsVoiceId: v })}
              onRateChange={(r) => updateLocalConfig({ ttsRate: r })}
              onPitchChange={(p) => updateLocalConfig({ ttsPitch: p })}
              onTtsProviderChange={(p) => updateLocalConfig({ ttsProvider: p })}
              onEdgeTtsVoiceChange={(v) => updateLocalConfig({ edgeTtsVoice: v })}
            />
            <Text style={styles.helperText}>
              Edge TTS voices route through your paired desktop. OpenAI, Groq, and Gemini cloud voices are under the desktop-connected Text-to-Speech section below.
            </Text>
          </>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Message Queuing</Text>
          <Switch
            value={draft.messageQueueEnabled !== false}
            onValueChange={(v) => updateLocalConfig({ messageQueueEnabled: v })}
            accessibilityLabel={createSwitchAccessibilityLabel('Message Queuing')}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
            thumbColor={draft.messageQueueEnabled !== false ? theme.colors.primaryForeground : theme.colors.background}
          />
        </View>
        <Text style={styles.helperText}>
          Queue messages while the agent is busy processing
        </Text>

        {/* Push Notifications Section */}
        <View style={[styles.row, styles.sectionLeadRow]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Push Notifications</Text>
            {!notificationsSupported && (
              <Text style={[styles.helperText, { marginTop: 2 }]}>
                Only available on physical devices
              </Text>
            )}
            {notificationsSupported && notificationPermission === 'denied' && (
              <Text style={[styles.helperText, { marginTop: 2, color: theme.colors.destructive }]}>
                Permission denied - enable in device settings
              </Text>
            )}
          </View>
          <Switch
            value={notificationsRegistered}
            onValueChange={handleNotificationToggle}
            accessibilityLabel={createSwitchAccessibilityLabel('Push Notifications')}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
            thumbColor={notificationsRegistered ? theme.colors.primaryForeground : theme.colors.background}
            disabled={!notificationsSupported || isNotificationLoading}
          />
        </View>
        <Text style={styles.helperText}>
          Receive notifications when new messages arrive from your AI assistant
        </Text>

        {/* Remote Settings Section - only show when connected to a DotAgents desktop server */}
        {settingsClient && (isLoadingRemote || isDotAgentsServer) && (
          <>
            <Text style={styles.sectionTitle}>Desktop Settings</Text>

            {isLoadingRemote && !isRefreshing && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading remote settings...</Text>
              </View>
            )}

            {remoteError && (
              <View style={styles.warningContainer}>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Desktop settings need attention</Text>
                  <Text style={styles.warningText}>{remoteError}</Text>
                  <Text style={styles.warningDetailText}>
                    Some desktop sections may be out of date until the retry finishes.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.warningRetryButton}
                  onPress={fetchRemoteSettings}
                  accessibilityRole="button"
                  accessibilityLabel={createButtonAccessibilityLabel('Retry loading desktop settings')}
                  accessibilityHint="Reloads the desktop settings section and refreshes stale values."
                >
                  <Text style={styles.warningRetryButtonText}>Retry loading</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Provider Selection */}
            {remoteSettings && (
              <CollapsibleSection id="providerSelection" title="Provider Selection">
                {/* Voice Transcription (STT) Provider */}
                <Text style={styles.label}>Voice Transcription (STT)</Text>
                <View style={styles.providerSelector}>
                  {STT_PROVIDERS.map((provider) => (
                    <Pressable
                      key={provider.value}
                      style={[
                        styles.providerOption,
                        (remoteSettings.sttProviderId || DEFAULT_STT_PROVIDER_ID) === provider.value && styles.providerOptionActive,
                      ]}
                      onPress={() => handleRemoteSettingUpdate('sttProviderId', provider.value)}
                    >
                      <Text style={[
                        styles.providerOptionText,
                        (remoteSettings.sttProviderId || DEFAULT_STT_PROVIDER_ID) === provider.value && styles.providerOptionTextActive,
                      ]}>
                        {provider.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Agent Provider */}
                <Text style={[styles.label, { marginTop: spacing.md }]}>Agent</Text>
                <View style={styles.providerSelector}>
                  {CHAT_PROVIDERS.map((provider) => (
                    <Pressable
                      key={provider.value}
                      style={[
                        styles.providerOption,
                        getAgentProvider() === provider.value && styles.providerOptionActive,
                      ]}
                      onPress={() => handleProviderChange(provider.value as 'openai' | 'groq' | 'gemini' | 'chatgpt-web')}
                    >
                      <Text style={[
                        styles.providerOptionText,
                        getAgentProvider() === provider.value && styles.providerOptionTextActive,
                      ]}>
                        {provider.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Text-to-Speech (TTS) Provider */}
                <Text style={[styles.label, { marginTop: spacing.md }]}>Text-to-Speech (TTS)</Text>
                <View style={styles.providerSelector}>
                  {TTS_PROVIDERS.map((provider) => (
                    <Pressable
                      key={provider.value}
                      style={[
                        styles.providerOption,
                        (remoteSettings.ttsProviderId || DEFAULT_TTS_PROVIDER_ID) === provider.value && styles.providerOptionActive,
                      ]}
                      onPress={() => handleRemoteSettingUpdate('ttsProviderId', provider.value)}
                    >
                      <Text style={[
                        styles.providerOptionText,
                        (remoteSettings.ttsProviderId || DEFAULT_TTS_PROVIDER_ID) === provider.value && styles.providerOptionTextActive,
                      ]}>
                        {provider.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </CollapsibleSection>
            )}

            {/* Provider Setup */}
            {remoteSettings && (
              <CollapsibleSection id="providerSetup" title="Provider Setup">
                {PROVIDER_CREDENTIAL_SECTIONS.map((provider) => {
                  const hasConfiguredKey = remoteSettings[provider.apiKey] === SECRET_MASK;
                  return (
                    <View key={provider.id} style={styles.providerCredentialGroup}>
                      <Text style={styles.subsectionTitle}>{provider.label}</Text>

                      <Text style={styles.label}>API Key</Text>
                      <TextInput
                        style={styles.input}
                        value={inputDrafts[provider.apiKey] ?? ''}
                        onChangeText={(v) => handleRemoteSecretDraftChange(provider.apiKey, v)}
                        onBlur={() => { void commitRemoteSecretDraft(provider.apiKey); }}
                        placeholder={hasConfiguredKey ? 'Configured' : provider.apiKeyPlaceholder}
                        placeholderTextColor={theme.colors.mutedForeground}
                        autoCapitalize='none'
                        autoCorrect={false}
                        secureTextEntry
                      />

                      <Text style={styles.label}>Base URL</Text>
                      <TextInput
                        style={styles.input}
                        value={inputDrafts[provider.baseUrl] ?? ''}
                        onChangeText={(v) => handleRemoteSettingUpdate(provider.baseUrl, v)}
                        placeholder={provider.baseUrlPlaceholder}
                        placeholderTextColor={theme.colors.mutedForeground}
                        autoCapitalize='none'
                        autoCorrect={false}
                        keyboardType="url"
                      />
                    </View>
                  );
                })}
              </CollapsibleSection>
            )}

            {/* 4a. Profile & Model */}
            {remoteSettings && (
              <CollapsibleSection id="profileModel" title="Profile & Model">
                {/* Profile Switching */}
                {profiles.length > 0 && (
                  <>
                    <Text style={styles.label}>Profile</Text>
                    <View style={styles.profileList}>
                      {profiles.map((profile) => (
                        <TouchableOpacity
                          key={profile.id}
                          style={[
                            styles.profileItem,
                            currentProfileId === profile.id && styles.profileItemActive,
                          ]}
                          onPress={() => handleProfileSwitch(profile.id)}
                        >
                          <Text style={[
                            styles.profileName,
                            currentProfileId === profile.id && styles.profileNameActive,
                          ]} numberOfLines={2}>
                            {profile.name}
                            {profile.isDefault && ' (Default)'}
                          </Text>
                          {currentProfileId === profile.id && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.profileActions}>
                      <TouchableOpacity
                        style={[styles.profileActionButton, isImportingProfile && styles.profileActionButtonDisabled]}
                        onPress={() => setShowImportModal(true)}
                        disabled={isImportingProfile}
                      >
                        <Text style={styles.profileActionButtonText}>
                          {isImportingProfile ? 'Importing...' : 'Import'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.profileActionButton, (!currentProfileId || isExportingProfile) && styles.profileActionButtonDisabled]}
                        onPress={handleExportProfile}
                        disabled={!currentProfileId || isExportingProfile}
                      >
                        <Text style={styles.profileActionButtonText}>
                          {isExportingProfile ? 'Exporting...' : 'Export'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Model Settings */}
                <Text style={styles.label}>Provider</Text>
                <View style={styles.providerSelector}>
                  {(['openai', 'groq', 'gemini', 'chatgpt-web'] as const).map((provider) => (
                    <Pressable
                      key={provider}
                      style={[
                        styles.providerOption,
                        getAgentProvider() === provider && styles.providerOptionActive,
                      ]}
                      onPress={() => handleProviderChange(provider)}
                    >
                      <Text style={[
                        styles.providerOptionText,
                        getAgentProvider() === provider && styles.providerOptionTextActive,
                      ]}>
                        {provider === 'chatgpt-web' ? 'OpenAI Codex' : provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {getAgentProvider() === 'openai' && remoteSettings.availablePresets && remoteSettings.availablePresets.length > 0 && (
                  <>
                    <Text style={styles.label}>OpenAI Compatible Endpoint</Text>
                    <TouchableOpacity
                      style={styles.modelSelector}
                      onPress={() => setShowPresetPicker(true)}
                    >
                      <View style={styles.modelSelectorContent}>
                        <Text style={styles.modelSelectorText}>
                          {getCurrentPresetName()}
                        </Text>
                        <Text style={styles.modelSelectorChevron}>▼</Text>
                      </View>
                    </TouchableOpacity>
                    {(() => {
                      const currentPreset = getCurrentModelPreset();
                      return (
                        <View style={styles.endpointPanel}>
                          <View style={styles.endpointMetaRow}>
                            <Text style={styles.endpointBaseUrl} numberOfLines={1}>
                              {currentPreset?.baseUrl || 'No base URL set'}
                            </Text>
                            <Text style={[
                              styles.endpointKeyBadge,
                              currentPreset?.hasApiKey && styles.endpointKeyBadgeActive,
                            ]}>
                              {currentPreset?.hasApiKey ? 'Key set' : 'No key'}
                            </Text>
                          </View>
                          <View style={styles.profileActions}>
                            <TouchableOpacity
                              style={styles.profileActionButton}
                              onPress={() => currentPreset && openPresetEditor('edit', currentPreset)}
                              disabled={!currentPreset}
                              accessibilityRole="button"
                              accessibilityLabel={`Configure endpoint ${currentPreset?.name || getCurrentPresetName()}`}
                            >
                              <Text style={styles.profileActionButtonText}>
                                {currentPreset?.isBuiltIn ? 'Configure' : 'Edit Endpoint'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.profileActionButton}
                              onPress={() => openPresetEditor('create')}
                              accessibilityRole="button"
                              accessibilityLabel="Create endpoint"
                            >
                              <Text style={styles.profileActionButtonText}>New Endpoint</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })()}
                  </>
                )}

                <View style={styles.modelLabelRow}>
                  <Text style={styles.label}>Model Name</Text>
                  <View style={styles.modelActions}>
                    <TouchableOpacity
                      style={styles.modelActionButton}
                      onPress={() => setUseCustomModel(!useCustomModel)}
                      accessibilityRole="button"
                      accessibilityLabel={useCustomModel ? 'Show model list' : 'Enter custom model name'}
                    >
                      <Text style={styles.modelActionText}>
                        {useCustomModel ? 'List' : 'Custom'}
                      </Text>
                    </TouchableOpacity>
                    {!useCustomModel && (
                      <TouchableOpacity
                        style={[styles.modelActionButton, isLoadingModels && styles.modelActionButtonDisabled]}
                        onPress={() => remoteSettings && fetchModels(getAgentProvider())}
                        disabled={isLoadingModels}
                        accessibilityRole="button"
                        accessibilityLabel="Refresh available models"
                      >
                        <Text style={styles.modelActionText}>
                          {isLoadingModels ? 'Refreshing…' : 'Refresh'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {useCustomModel ? (
                  <TextInput
                    style={styles.input}
                    value={customModelDraft}
                    onChangeText={handleModelNameChange}
                    placeholder={getModelPlaceholder()}
                    placeholderTextColor={theme.colors.mutedForeground}
                    autoCapitalize='none'
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.modelSelector}
                    onPress={() => setShowModelPicker(true)}
                    disabled={isLoadingModels}
                  >
                    {isLoadingModels ? (
                      <View style={styles.modelSelectorContent}>
                        <ActivityIndicator size="small" color={theme.colors.mutedForeground} />
                        <Text style={styles.modelSelectorPlaceholder}>Loading models...</Text>
                      </View>
                    ) : (
                      <View style={styles.modelSelectorContent}>
                        <Text style={[
                          styles.modelSelectorText,
                          !getCurrentModelValue() && styles.modelSelectorPlaceholder
                        ]}>
                          {getCurrentModelDisplayName()}
                        </Text>
                        <Text style={styles.modelSelectorChevron}>▼</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                <Text style={[styles.label, { marginTop: spacing.lg }]}>Transcript Processing</Text>
                <Text style={styles.helperText}>
                  Clean up transcripts after speech-to-text and before they are used elsewhere.
                </Text>

                <View style={styles.row}>
                  <Text style={styles.label}>Enabled</Text>
                  <Switch
                    value={remoteSettings.transcriptPostProcessingEnabled ?? DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED}
                    onValueChange={(v) => handleRemoteSettingToggle('transcriptPostProcessingEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.transcriptPostProcessingEnabled ?? DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>

                <Text style={styles.label}>Provider</Text>
                <View style={styles.providerSelector}>
                  {CHAT_PROVIDERS.map((provider) => (
                    <Pressable
                      key={provider.value}
                      style={[
                        styles.providerOption,
                        (remoteSettings.transcriptPostProcessingProviderId || DEFAULT_TRANSCRIPT_POST_PROCESSING_PROVIDER_ID) === provider.value && styles.providerOptionActive,
                      ]}
                      onPress={() => handleRemoteSettingUpdate('transcriptPostProcessingProviderId', provider.value)}
                    >
                      <Text style={[
                        styles.providerOptionText,
                        (remoteSettings.transcriptPostProcessingProviderId || DEFAULT_TRANSCRIPT_POST_PROCESSING_PROVIDER_ID) === provider.value && styles.providerOptionTextActive,
                      ]}>
                        {provider.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {(remoteSettings.transcriptPostProcessingEnabled ?? DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED) && (
                  <>
                    {(() => {
                      const providerId = remoteSettings.transcriptPostProcessingProviderId || DEFAULT_TRANSCRIPT_POST_PROCESSING_PROVIDER_ID;
                      const modelKey = getTranscriptPostProcessingModelSettingKey(providerId);
                      if (!modelKey) return null;

                      return (
                        <>
                          <Text style={styles.label}>Model</Text>
                          <TextInput
                            style={styles.input}
                            value={inputDrafts[modelKey] ?? remoteSettings[modelKey] ?? ''}
                            onChangeText={(v) => handleRemoteSettingUpdate(modelKey, v)}
                            placeholder="Use provider default"
                            placeholderTextColor={theme.colors.mutedForeground}
                            autoCapitalize='none'
                          />
                          <Text style={styles.helperText}>
                            Provider model used to clean up speech-to-text transcripts.
                          </Text>
                        </>
                      );
                    })()}

                    <Text style={styles.label}>Prompt</Text>
                    <TextInput
                      style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                      value={inputDrafts.transcriptPostProcessingPrompt ?? ''}
                      onChangeText={(v) => handleRemoteSettingUpdate('transcriptPostProcessingPrompt', v)}
                      placeholder="Custom instructions for transcript processing..."
                      placeholderTextColor={theme.colors.mutedForeground}
                      multiline
                      numberOfLines={3}
                    />
                  </>
                )}
              </CollapsibleSection>
            )}

            {/* 4b. Bundles */}
            {isDotAgentsServer && (
              <CollapsibleSection id="bundles" title="Bundles">
                <View style={styles.profileActions}>
                  <TouchableOpacity
                    style={[styles.profileActionButton, isImportingBundle && styles.profileActionButtonDisabled]}
                    onPress={() => setShowBundleImportModal(true)}
                    disabled={isImportingBundle}
                    accessibilityRole="button"
                    accessibilityLabel={createButtonAccessibilityLabel('Import DotAgents bundle JSON')}
                  >
                    <Text style={styles.profileActionButtonText}>
                      {isImportingBundle ? 'Importing...' : 'Import Bundle'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.profileActionButton, isExportingBundle && styles.profileActionButtonDisabled]}
                    onPress={handleBundleExport}
                    disabled={isExportingBundle}
                    accessibilityRole="button"
                    accessibilityLabel={createButtonAccessibilityLabel('Export DotAgents bundle JSON')}
                  >
                    <Text style={styles.profileActionButtonText}>
                      {isExportingBundle ? 'Exporting...' : 'Export Bundle'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </CollapsibleSection>
            )}

            {/* 4b. Streamer Mode */}
            {remoteSettings && (
              <CollapsibleSection id="streamerMode" title="Streamer Mode">
                <View style={styles.row}>
                  <Text style={styles.label}>Streamer Mode</Text>
                  <Switch
                    value={remoteSettings.streamerModeEnabled ?? false}
                    onValueChange={(v) => handleRemoteSettingToggle('streamerModeEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={remoteSettings.streamerModeEnabled ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Hide sensitive information when streaming or sharing screen
                </Text>
              </CollapsibleSection>
            )}

            {/* 4c. Speech-to-Text */}
            {remoteSettings && (
              <CollapsibleSection id="speechToText" title="Speech-to-Text">
                <Text style={styles.label}>STT Language</Text>
                <TextInput
                  style={styles.input}
                  value={inputDrafts.sttLanguage ?? ''}
                  onChangeText={(v) => handleRemoteSettingUpdate('sttLanguage', v)}
                  placeholder="en (default)"
                  placeholderTextColor={theme.colors.mutedForeground}
                  autoCapitalize='none'
                />
                <Text style={styles.helperText}>
                  Language code for speech-to-text (e.g., en, es, fr)
                </Text>

                {(remoteSettings.sttProviderId === 'openai' || remoteSettings.sttProviderId === 'groq') && (() => {
                  const providerId = remoteSettings.sttProviderId;
                  const languageKey = providerId === 'openai' ? 'openaiSttLanguage' : 'groqSttLanguage';
                  const languageLabel = providerId === 'openai' ? 'OpenAI Language Override' : 'Groq Language Override';
                  const modelKey = providerId === 'openai' ? 'openaiSttModel' : 'groqSttModel';
                  const currentModel = remoteSettings[modelKey] || getDefaultSttModel(providerId) || '';

                  return (
                    <>
                      <Text style={styles.label}>{languageLabel}</Text>
                      <TextInput
                        style={styles.input}
                        value={inputDrafts[languageKey] ?? ''}
                        onChangeText={(v) => handleRemoteSettingUpdate(languageKey, v)}
                        placeholder="Use global language"
                        placeholderTextColor={theme.colors.mutedForeground}
                        autoCapitalize='none'
                      />
                      <Text style={styles.helperText}>
                        Leave blank to use STT Language.
                      </Text>

                      <Text style={styles.label}>STT Model</Text>
                      <View style={styles.providerSelector}>
                        {KNOWN_STT_MODEL_IDS[providerId].map((modelId) => (
                          <Pressable
                            key={modelId}
                            style={[
                              styles.providerOption,
                              currentModel === modelId && styles.providerOptionActive,
                            ]}
                            onPress={() => handleRemoteSettingUpdate(modelKey, modelId)}
                            accessibilityRole="button"
                            accessibilityLabel={`Use ${modelId} for ${providerId} speech-to-text`}
                          >
                            <Text style={[
                              styles.providerOptionText,
                              currentModel === modelId && styles.providerOptionTextActive,
                            ]}>
                              {modelId}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  );
                })()}

                {remoteSettings.sttProviderId === 'groq' && (
                  <>
                    <Text style={styles.label}>Groq Prompt</Text>
                    <TextInput
                      style={[styles.input, { minHeight: 88 }]}
                      value={inputDrafts.groqSttPrompt ?? ''}
                      onChangeText={(v) => handleRemoteSettingUpdate('groqSttPrompt', v)}
                      placeholder="Optional spelling or style hints for Groq transcription"
                      placeholderTextColor={theme.colors.mutedForeground}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                    <Text style={styles.helperText}>
                      Optional hints for spelling unfamiliar words or names.
                    </Text>
                  </>
                )}

                <View style={styles.row}>
                  <Text style={styles.label}>Transcription Preview</Text>
                  <Switch
                    value={remoteSettings.transcriptionPreviewEnabled ?? DEFAULT_TRANSCRIPTION_PREVIEW_ENABLED}
                    onValueChange={(v) => handleRemoteSettingToggle('transcriptionPreviewEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.transcriptionPreviewEnabled ?? DEFAULT_TRANSCRIPTION_PREVIEW_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Show live transcription while recording
                </Text>

                {remoteSettings.sttProviderId === 'parakeet' && (
                  <View style={styles.localSpeechModelBlock}>
                    {(() => {
                      const status = localSpeechModelStatuses.parakeet;
                      const progress = Math.max(0, Math.min(1, status?.progress ?? 0));
                      const isDownloading = !!status?.downloading || pendingLocalSpeechModelAction === 'parakeet:download';
                      const downloadDisabled = isDownloading || !!status?.downloaded;

                      return (
                        <>
                          <View style={styles.row}>
                            <View style={styles.rowCopy}>
                              <Text style={styles.label}>Parakeet Model</Text>
                              <Text style={styles.helperText}>{formatLocalModelProgress(status)}</Text>
                            </View>
                            <TouchableOpacity
                              style={[
                                styles.profileActionButton,
                                styles.localSpeechModelButton,
                                downloadDisabled && styles.profileActionButtonDisabled,
                              ]}
                              onPress={() => handleLocalSpeechModelDownload('parakeet')}
                              disabled={downloadDisabled}
                              accessibilityRole="button"
                              accessibilityLabel={createButtonAccessibilityLabel(`${status?.error ? 'Retry' : 'Download'} Parakeet model`)}
                            >
                              <Text style={styles.profileActionButtonText}>
                                {status?.downloaded
                                  ? 'Ready'
                                  : isDownloading
                                    ? 'Downloading...'
                                    : status?.error
                                      ? 'Retry'
                                      : 'Download'}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {(status?.downloading || isDownloading) && (
                            <View style={styles.localSpeechProgressTrack}>
                              <View style={[styles.localSpeechProgressFill, { width: `${Math.round(progress * 100)}%` }]} />
                            </View>
                          )}

                          {status?.error ? <Text style={styles.warningText}>{status.error}</Text> : null}
                        </>
                      );
                    })()}

                    <Text style={[styles.label, { marginTop: spacing.sm }]}>CPU Threads</Text>
                    <View style={styles.providerSelector}>
                      {PARAKEET_NUM_THREAD_OPTIONS.map((threadCount) => (
                        <Pressable
                          key={threadCount}
                          style={[
                            styles.providerOption,
                            (remoteSettings.parakeetNumThreads ?? DEFAULT_PARAKEET_NUM_THREADS) === threadCount && styles.providerOptionActive,
                          ]}
                          onPress={() => handleRemoteSettingUpdate('parakeetNumThreads', threadCount)}
                        >
                          <Text style={[
                            styles.providerOptionText,
                            (remoteSettings.parakeetNumThreads ?? DEFAULT_PARAKEET_NUM_THREADS) === threadCount && styles.providerOptionTextActive,
                          ]}>
                            {threadCount}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

              </CollapsibleSection>
            )}

            {/* 4d. Text-to-Speech */}
            {remoteSettings && (
              <CollapsibleSection id="textToSpeech" title="Text-to-Speech">
                <View style={styles.row}>
                  <Text style={styles.label}>TTS Enabled</Text>
                  <Switch
                    value={remoteSettings.ttsEnabled ?? DEFAULT_TTS_ENABLED}
                    onValueChange={(v) => handleRemoteSettingToggle('ttsEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.ttsEnabled ?? DEFAULT_TTS_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Enable text-to-speech for responses on desktop
                </Text>

                {(remoteSettings.ttsEnabled ?? DEFAULT_TTS_ENABLED) && (
                  <>
                    {/* TTS Provider Selector */}
                    <Text style={[styles.label, { marginTop: spacing.md }]}>TTS Provider</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: spacing.sm }}>
                      <View style={styles.providerSelector}>
                        {TTS_PROVIDERS.map((provider) => (
                          <Pressable
                            key={provider.value}
                            style={[
                              styles.providerOption,
                              remoteTtsProviderId === provider.value && styles.providerOptionActive,
                            ]}
                            onPress={() => handleRemoteSettingUpdate('ttsProviderId', provider.value)}
                          >
                            <Text style={[
                              styles.providerOptionText,
                              remoteTtsProviderId === provider.value && styles.providerOptionTextActive,
                            ]}>
                              {provider.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Per-provider Voice/Model Settings */}
                    {getTtsModelsForProvider(remoteTtsProviderId).length > 0 && (
                      <>
                        <Text style={[styles.label, { marginTop: spacing.sm }]}>Model</Text>
                        <TouchableOpacity
                          style={styles.modelSelector}
                          onPress={() => setShowTtsModelPicker(true)}
                        >
                          <View style={styles.modelSelectorContent}>
                            <Text style={styles.modelSelectorText}>
                              {(() => {
                                const models = getTtsModelsForProvider(remoteTtsProviderId);
                                const modelValue = getRemoteTtsModelValue(remoteSettings);
                                const model = models.find(m => m.value === modelValue);
                                return model?.label || modelValue || 'Select model';
                              })()}
                            </Text>
                            <Text style={styles.modelSelectorChevron}>▼</Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}

                    {getTtsVoicesForProvider(
                      remoteTtsProviderId,
                      remoteTtsProviderId === 'groq' ? remoteSettings.groqTtsModel : undefined,
                    ).length > 0 && (
                      <>
                        <Text style={[styles.label, { marginTop: spacing.sm }]}>Voice</Text>
                        <TouchableOpacity
                          style={styles.modelSelector}
                          onPress={() => setShowTtsVoicePicker(true)}
                        >
                          <View style={styles.modelSelectorContent}>
                            <Text style={styles.modelSelectorText}>
                              {(() => {
                                const ttsModel = remoteTtsProviderId === 'groq' ? remoteSettings.groqTtsModel : undefined;
                                const voices = getTtsVoicesForProvider(remoteTtsProviderId, ttsModel);
                                const voiceValue = getRemoteTtsVoiceValue(remoteSettings);
                                const voice = voices.find(v => String(v.value) === String(voiceValue));
                                return voice?.label || String(voiceValue ?? '') || 'Select voice';
                              })()}
                            </Text>
                            <Text style={styles.modelSelectorChevron}>▼</Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}

                    {(() => {
                      const localProviderId = getLocalTtsSpeechModelProviderId(remoteTtsProviderId);
                      if (!localProviderId) return null;

                      const status = localSpeechModelStatuses[localProviderId];
                      const progress = Math.max(0, Math.min(1, status?.progress ?? 0));
                      const isDownloading = !!status?.downloading || pendingLocalSpeechModelAction === `${localProviderId}:download`;
                      const isTesting = pendingLocalSpeechModelAction === `${localProviderId}:test`;
                      const downloadDisabled = isDownloading || !!status?.downloaded;

                      return (
                        <View style={styles.localSpeechModelBlock}>
                          <View style={styles.row}>
                            <View style={styles.rowCopy}>
                              <Text style={styles.label}>{getLocalSpeechModelLabel(localProviderId)} Model</Text>
                              <Text style={styles.helperText}>{formatLocalModelProgress(status)}</Text>
                            </View>
                            <TouchableOpacity
                              style={[
                                styles.profileActionButton,
                                styles.localSpeechModelButton,
                                downloadDisabled && styles.profileActionButtonDisabled,
                              ]}
                              onPress={() => handleLocalSpeechModelDownload(localProviderId)}
                              disabled={downloadDisabled}
                              accessibilityRole="button"
                              accessibilityLabel={createButtonAccessibilityLabel(`${status?.error ? 'Retry' : 'Download'} ${localProviderId} model`)}
                            >
                              <Text style={styles.profileActionButtonText}>
                                {status?.downloaded
                                  ? 'Ready'
                                  : isDownloading
                                    ? 'Downloading...'
                                    : status?.error
                                      ? 'Retry'
                                      : 'Download'}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {(status?.downloading || isDownloading) && (
                            <View style={styles.localSpeechProgressTrack}>
                              <View style={[styles.localSpeechProgressFill, { width: `${Math.round(progress * 100)}%` }]} />
                            </View>
                          )}

                          {status?.error ? <Text style={styles.warningText}>{status.error}</Text> : null}

                          {status?.downloaded && (
                            <TouchableOpacity
                              style={[
                                styles.profileActionButton,
                                styles.localSpeechTestButton,
                                isTesting && styles.profileActionButtonDisabled,
                              ]}
                              onPress={handleRemoteTtsTest}
                              disabled={isTesting}
                              accessibilityRole="button"
                              accessibilityLabel={createButtonAccessibilityLabel('Test selected desktop TTS voice')}
                            >
                              <Text style={styles.profileActionButtonText}>
                                {isTesting ? 'Testing...' : 'Test voice'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })()}

                    {remoteTtsProviderId === 'supertonic' && (
                      <View>
                        <Text style={[styles.label, { marginTop: spacing.sm }]}>Language</Text>
                        <View style={styles.providerSelector}>
                          {SUPERTONIC_TTS_LANGUAGES.map((language) => (
                            <Pressable
                              key={language.value}
                              style={[
                                styles.providerOption,
                                (remoteSettings.supertonicLanguage ?? DEFAULT_SUPERTONIC_TTS_LANGUAGE) === language.value && styles.providerOptionActive,
                              ]}
                              onPress={() => handleRemoteSettingUpdate('supertonicLanguage', language.value)}
                            >
                              <Text style={[
                                styles.providerOptionText,
                                (remoteSettings.supertonicLanguage ?? DEFAULT_SUPERTONIC_TTS_LANGUAGE) === language.value && styles.providerOptionTextActive,
                              ]}>
                                {language.label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}

                    {remoteTtsSpeedSetting && (
                      <View style={{ marginTop: spacing.sm }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.label}>Speed</Text>
                          <Text style={[styles.helperText, { marginTop: 0 }]}>
                            {(remoteSettings[remoteTtsSpeedSetting.key] ?? remoteTtsSpeedSetting.defaultValue).toFixed(remoteTtsSpeedSetting.fractionDigits)}x
                          </Text>
                        </View>
                        <Slider
                          style={{ width: '100%', height: 40 }}
                          minimumValue={remoteTtsSpeedSetting.minimumValue}
                          maximumValue={remoteTtsSpeedSetting.maximumValue}
                          step={remoteTtsSpeedSetting.step}
                          value={remoteSettings[remoteTtsSpeedSetting.key] ?? remoteTtsSpeedSetting.defaultValue}
                          onSlidingComplete={(v) => handleRemoteSettingUpdate(remoteTtsSpeedSetting.key, v)}
                          minimumTrackTintColor={theme.colors.primary}
                          maximumTrackTintColor={theme.colors.muted}
                          thumbTintColor={theme.colors.primary}
                        />
                      </View>
                    )}

                    {remoteTtsProviderId === 'supertonic' && (
                      <View style={{ marginTop: spacing.sm }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.label}>Quality Steps</Text>
                          <Text style={[styles.helperText, { marginTop: 0 }]}>
                            {Math.round(remoteSettings.supertonicSteps ?? DEFAULT_SUPERTONIC_TTS_STEPS)}
                          </Text>
                        </View>
                        <Slider
                          style={{ width: '100%', height: 40 }}
                          minimumValue={MIN_SUPERTONIC_TTS_STEPS}
                          maximumValue={MAX_SUPERTONIC_TTS_STEPS}
                          step={1}
                          value={remoteSettings.supertonicSteps ?? DEFAULT_SUPERTONIC_TTS_STEPS}
                          onSlidingComplete={(v) => handleRemoteSettingUpdate('supertonicSteps', Math.round(v))}
                          minimumTrackTintColor={theme.colors.primary}
                          maximumTrackTintColor={theme.colors.muted}
                          thumbTintColor={theme.colors.primary}
                        />
                      </View>
                    )}

                    <View style={[styles.row, { marginTop: spacing.md }]}>
                      <Text style={styles.label}>Auto-Play</Text>
                      <Switch
                        value={remoteSettings.ttsAutoPlay ?? DEFAULT_TTS_AUTO_PLAY}
                        onValueChange={(v) => handleRemoteSettingToggle('ttsAutoPlay', v)}
                        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                        thumbColor={(remoteSettings.ttsAutoPlay ?? DEFAULT_TTS_AUTO_PLAY) ? theme.colors.primaryForeground : theme.colors.background}
                      />
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>TTS Preprocessing</Text>
                      <Switch
                        value={remoteSettings.ttsPreprocessingEnabled ?? DEFAULT_TTS_PREPROCESSING_ENABLED}
                        onValueChange={(v) => handleRemoteSettingToggle('ttsPreprocessingEnabled', v)}
                        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                        thumbColor={(remoteSettings.ttsPreprocessingEnabled ?? DEFAULT_TTS_PREPROCESSING_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      Clean up text before speaking
                    </Text>

                    {(remoteSettings.ttsPreprocessingEnabled ?? DEFAULT_TTS_PREPROCESSING_ENABLED) && (
                      <>
                        <View style={[styles.row, { paddingLeft: spacing.md }]}>
                          <Text style={styles.label}>Remove Code Blocks</Text>
                          <Switch
                            value={remoteSettings.ttsRemoveCodeBlocks ?? DEFAULT_TTS_REMOVE_CODE_BLOCKS}
                            onValueChange={(v) => handleRemoteSettingToggle('ttsRemoveCodeBlocks', v)}
                            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                            thumbColor={(remoteSettings.ttsRemoveCodeBlocks ?? DEFAULT_TTS_REMOVE_CODE_BLOCKS) ? theme.colors.primaryForeground : theme.colors.background}
                          />
                        </View>

                        <View style={[styles.row, { paddingLeft: spacing.md }]}>
                          <Text style={styles.label}>Remove URLs</Text>
                          <Switch
                            value={remoteSettings.ttsRemoveUrls ?? DEFAULT_TTS_REMOVE_URLS}
                            onValueChange={(v) => handleRemoteSettingToggle('ttsRemoveUrls', v)}
                            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                            thumbColor={(remoteSettings.ttsRemoveUrls ?? DEFAULT_TTS_REMOVE_URLS) ? theme.colors.primaryForeground : theme.colors.background}
                          />
                        </View>

                        <View style={[styles.row, { paddingLeft: spacing.md }]}>
                          <Text style={styles.label}>Convert Markdown</Text>
                          <Switch
                            value={remoteSettings.ttsConvertMarkdown ?? DEFAULT_TTS_CONVERT_MARKDOWN}
                            onValueChange={(v) => handleRemoteSettingToggle('ttsConvertMarkdown', v)}
                            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                            thumbColor={(remoteSettings.ttsConvertMarkdown ?? DEFAULT_TTS_CONVERT_MARKDOWN) ? theme.colors.primaryForeground : theme.colors.background}
                          />
                        </View>

                        <View style={[styles.row, { paddingLeft: spacing.md }]}>
                          <Text style={styles.label}>Use LLM Preprocessing</Text>
                          <Switch
                            value={remoteSettings.ttsUseLLMPreprocessing ?? DEFAULT_TTS_USE_LLM_PREPROCESSING}
                            onValueChange={(v) => handleRemoteSettingToggle('ttsUseLLMPreprocessing', v)}
                            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                            thumbColor={(remoteSettings.ttsUseLLMPreprocessing ?? DEFAULT_TTS_USE_LLM_PREPROCESSING) ? theme.colors.primaryForeground : theme.colors.background}
                          />
                        </View>
                      </>
                    )}
                  </>
                )}
              </CollapsibleSection>
            )}

            {/* 4e. Agent Settings */}
            {remoteSettings && (
              <CollapsibleSection id="agentSettings" title="Agent Settings">
                <Text style={styles.label}>Main Agent Mode</Text>
                <View style={styles.providerSelector}>
                  {MAIN_AGENT_MODE_OPTIONS.map((mode) => (
                    <Pressable
                      key={mode}
                      style={[
                        styles.providerOption,
                        (remoteSettings.mainAgentMode ?? DEFAULT_MAIN_AGENT_MODE) === mode && styles.providerOptionActive,
                      ]}
                      onPress={() => handleRemoteSettingUpdate('mainAgentMode', mode as MainAgentMode)}
                    >
                      <Text style={[
                        styles.providerOptionText,
                        (remoteSettings.mainAgentMode ?? DEFAULT_MAIN_AGENT_MODE) === mode && styles.providerOptionTextActive,
                      ]}>
                        {mode.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.helperText}>
                  API uses external LLMs, acpx routes to an acpx-managed agent
                </Text>

                {/* acpx-specific settings - only show when acpx mode selected */}
                {(remoteSettings.mainAgentMode ?? DEFAULT_MAIN_AGENT_MODE) === 'acpx' && (
                  <>
                    <Text style={styles.label}>acpx Agent</Text>
                    {availableAcpMainAgents.length > 0 ? (
                      <View style={styles.providerSelector}>
                        {availableAcpMainAgents.map((agent) => (
                          <Pressable
                            key={agent.name}
                            style={[
                              styles.providerOption,
                              remoteSettings.mainAgentName === agent.name && styles.providerOptionActive,
                            ]}
                            onPress={() => handleRemoteSettingUpdate('mainAgentName', agent.name)}
                          >
                            <Text style={[
                              styles.providerOptionText,
                              remoteSettings.mainAgentName === agent.name && styles.providerOptionTextActive,
                            ]}>
                              {agent.displayName || agent.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.helperText}>No acpx agents available</Text>
                    )}
                    <Text style={styles.helperText}>
                      Select which acpx agent handles requests
                    </Text>
                  </>
                )}

                <View style={styles.row}>
                  <Text style={styles.label}>Message Queue</Text>
                  <Switch
                    value={remoteSettings.mcpMessageQueueEnabled ?? DEFAULT_MCP_MESSAGE_QUEUE_ENABLED}
                    onValueChange={(v) => handleRemoteSettingToggle('mcpMessageQueueEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.mcpMessageQueueEnabled ?? DEFAULT_MCP_MESSAGE_QUEUE_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Require Tool Approval</Text>
                  <Switch
                    value={remoteSettings.mcpRequireApprovalBeforeToolCall ?? DEFAULT_MCP_REQUIRE_APPROVAL_BEFORE_TOOL_CALL}
                    onValueChange={(v) => handleRemoteSettingToggle('mcpRequireApprovalBeforeToolCall', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.mcpRequireApprovalBeforeToolCall ?? DEFAULT_MCP_REQUIRE_APPROVAL_BEFORE_TOOL_CALL) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Require approval before executing MCP tools
                </Text>

                <View style={styles.row}>
                  <Text style={styles.label}>Verify Completion</Text>
                  <Switch
                    value={remoteSettings.mcpVerifyCompletionEnabled ?? DEFAULT_MCP_VERIFY_COMPLETION_ENABLED}
                    onValueChange={(v) => handleRemoteSettingToggle('mcpVerifyCompletionEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.mcpVerifyCompletionEnabled ?? DEFAULT_MCP_VERIFY_COMPLETION_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Final Summary</Text>
                  <Switch
                    value={remoteSettings.mcpFinalSummaryEnabled ?? DEFAULT_MCP_FINAL_SUMMARY_ENABLED}
                    onValueChange={(v) => handleRemoteSettingToggle('mcpFinalSummaryEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.mcpFinalSummaryEnabled ?? DEFAULT_MCP_FINAL_SUMMARY_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Generate a summary after completing a task
                </Text>

                <Text style={styles.label}>Max Iterations</Text>
                <TextInput
                  style={styles.input}
                  value={inputDrafts.mcpMaxIterations ?? String(MCP_MAX_ITERATIONS_DEFAULT)}
                  onChangeText={(v) => {
                    markRemotePending('mcpMaxIterations');
                    setSaveStatusMessage(null);
                    const num = parseMcpMaxIterationsDraft(v);
                    if (num !== null) {
                      handleRemoteSettingUpdate('mcpMaxIterations', num);
                    } else {
                      setInputDrafts(prev => ({ ...prev, mcpMaxIterations: v }));
                    }
                  }}
                  placeholder={String(MCP_MAX_ITERATIONS_DEFAULT)}
                  placeholderTextColor={theme.colors.mutedForeground}
                  keyboardType="number-pad"
                />

                <View style={styles.row}>
                  <Text style={styles.label}>Unlimited Iterations</Text>
                  <Switch
                    value={remoteSettings.mcpUnlimitedIterations ?? DEFAULT_MCP_UNLIMITED_ITERATIONS}
                    onValueChange={(v) => handleRemoteSettingToggle('mcpUnlimitedIterations', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.mcpUnlimitedIterations ?? DEFAULT_MCP_UNLIMITED_ITERATIONS) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
              </CollapsibleSection>
            )}

            {/* 4f. Tool Execution */}
            {remoteSettings && (
              <CollapsibleSection id="toolExecution" title="Tool Execution">
                <View style={styles.row}>
                  <Text style={styles.label}>Context Reduction</Text>
                  <Switch
                    value={remoteSettings.mcpContextReductionEnabled ?? DEFAULT_MCP_CONTEXT_REDUCTION_ENABLED}
                    onValueChange={(v) => handleRemoteSettingToggle('mcpContextReductionEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.mcpContextReductionEnabled ?? DEFAULT_MCP_CONTEXT_REDUCTION_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Reduce context size for tool responses
                </Text>

                <View style={styles.row}>
                  <Text style={styles.label}>Tool Response Processing</Text>
                  <Switch
                    value={remoteSettings.mcpToolResponseProcessingEnabled ?? DEFAULT_MCP_TOOL_RESPONSE_PROCESSING_ENABLED}
                    onValueChange={(v) => handleRemoteSettingToggle('mcpToolResponseProcessingEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.mcpToolResponseProcessingEnabled ?? DEFAULT_MCP_TOOL_RESPONSE_PROCESSING_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Parallel Tool Execution</Text>
                  <Switch
                    value={remoteSettings.mcpParallelToolExecution ?? DEFAULT_MCP_PARALLEL_TOOL_EXECUTION}
                    onValueChange={(v) => handleRemoteSettingToggle('mcpParallelToolExecution', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.mcpParallelToolExecution ?? DEFAULT_MCP_PARALLEL_TOOL_EXECUTION) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Execute multiple tools in parallel when possible
                </Text>
              </CollapsibleSection>
            )}

            {/* 4h. MCP Servers */}
            {isDotAgentsServer && (
              <CollapsibleSection id="mcpServers" title="MCP Servers">
                {mcpServers.length === 0 ? (
                  <Text style={styles.helperText}>No MCP servers configured</Text>
                ) : mcpServers.map((server) => {
                  const canDeleteServer = !isReservedMcpServerName(server.name, RESERVED_RUNTIME_TOOL_SERVER_NAMES);

                  return (
                    <View key={server.name} style={styles.serverRow}>
                      <View style={styles.serverInfo}>
                        <View style={styles.serverNameRow}>
                          <View style={[
                            styles.statusDot,
                            server.connected ? styles.statusConnected : styles.statusDisconnected,
                          ]} />
                          <Text style={styles.serverName}>{server.name}</Text>
                        </View>
                        <Text style={styles.serverMeta}>
                          {server.toolCount} tool{server.toolCount !== 1 ? 's' : ''}
                          {server.error && ` • ${server.error}`}
                        </Text>
                      </View>
                      <View style={styles.agentActions}>
                        <Switch
                          value={server.enabled}
                          onValueChange={(v) => handleServerToggle(server.name, v)}
                          accessibilityLabel={createMcpServerSwitchAccessibilityLabel(server.name)}
                          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                          thumbColor={server.enabled ? theme.colors.primaryForeground : theme.colors.background}
                          disabled={server.configDisabled}
                        />
                        {canDeleteServer && (
                          <>
                            <TouchableOpacity
                              style={styles.agentDeleteButton}
                              onPress={() => openMcpServerReplaceEditor(server)}
                              accessibilityRole="button"
                              accessibilityLabel={createButtonAccessibilityLabel(`Replace MCP server ${server.name} config`)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Text style={styles.notePromoteButtonText}>Replace</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.agentDeleteButton}
                              onPress={() => handleMcpServerDelete(server)}
                              accessibilityRole="button"
                              accessibilityLabel={createButtonAccessibilityLabel(`Delete MCP server ${server.name}`)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Text style={styles.agentDeleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  );
                })}
                <View style={styles.profileActions}>
                  <TouchableOpacity
                    style={[styles.profileActionButton, isImportingMcpServers && styles.profileActionButtonDisabled]}
                    onPress={() => setShowMcpImportModal(true)}
                    disabled={isImportingMcpServers}
                    accessibilityRole="button"
                    accessibilityLabel={createButtonAccessibilityLabel('Import MCP server JSON')}
                  >
                    <Text style={styles.profileActionButtonText}>
                      {isImportingMcpServers ? 'Importing...' : 'Import JSON'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.profileActionButton, isExportingMcpServers && styles.profileActionButtonDisabled]}
                    onPress={handleMcpServerExport}
                    disabled={isExportingMcpServers}
                    accessibilityRole="button"
                    accessibilityLabel={createButtonAccessibilityLabel('Export MCP server JSON')}
                  >
                    <Text style={styles.profileActionButtonText}>
                      {isExportingMcpServers ? 'Exporting...' : 'Export JSON'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.profileActionButton}
                    onPress={openMcpServerEditor}
                    accessibilityRole="button"
                    accessibilityLabel={createButtonAccessibilityLabel('Create MCP server')}
                  >
                    <Text style={styles.profileActionButtonText}>Create MCP Server</Text>
                  </TouchableOpacity>
                </View>
              </CollapsibleSection>
            )}

            {/* 4i. WhatsApp */}
            {remoteSettings && (
              <CollapsibleSection id="whatsapp" title="WhatsApp">
                <View style={styles.row}>
                  <Text style={styles.label}>WhatsApp Integration</Text>
                  <Switch
                    value={remoteSettings.whatsappEnabled ?? DEFAULT_WHATSAPP_ENABLED}
                    onValueChange={(v) => handleRemoteSettingToggle('whatsappEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.whatsappEnabled ?? DEFAULT_WHATSAPP_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>

                {(remoteSettings.whatsappEnabled ?? DEFAULT_WHATSAPP_ENABLED) && (
                  <>
                    <Text style={styles.label}>Allowed Numbers</Text>
                    <TextInput
                      style={styles.input}
                      value={inputDrafts.whatsappAllowFrom ?? ''}
                      onChangeText={(v) => {
                        markRemotePending('whatsappAllowFrom');
                        setSaveStatusMessage(null);
                        // Update the text draft immediately for responsive UI
                        setInputDrafts(prev => ({ ...prev, whatsappAllowFrom: v }));
                        // Parse comma-separated numbers and debounce the API update
                        // Don't update remoteSettings locally to avoid the sync effect
                        // rewriting the user's raw text (losing trailing commas/spaces)
                        const numbers = parseConfigListInput(v);
                        if (inputTimeoutRefs.current.whatsappAllowFrom) {
                          clearTimeout(inputTimeoutRefs.current.whatsappAllowFrom);
                        }
                        inputTimeoutRefs.current.whatsappAllowFrom = setTimeout(async () => {
                          if (!settingsClient) return;
                          try {
                            await settingsClient.updateSettings({ whatsappAllowFrom: numbers });
                            clearRemotePending('whatsappAllowFrom');
                            delete inputTimeoutRefs.current.whatsappAllowFrom;
                          } catch (error: any) {
                            console.error('[Settings] Failed to update whatsappAllowFrom:', error);
                            setRemoteError(error.message || 'Failed to update whatsappAllowFrom');
                            fetchRemoteSettings();
                          }
                        }, 1000);
                      }}
                      placeholder="1234567890, 0987654321"
                      placeholderTextColor={theme.colors.mutedForeground}
                      autoCapitalize='none'
                      keyboardType="phone-pad"
                    />
                    <Text style={styles.helperText}>
                      Comma-separated phone numbers (international format without +)
                    </Text>

                    <View style={styles.row}>
                      <Text style={styles.label}>Auto-Reply</Text>
                      <Switch
                        value={remoteSettings.whatsappAutoReply ?? DEFAULT_WHATSAPP_AUTO_REPLY}
                        onValueChange={(v) => handleRemoteSettingToggle('whatsappAutoReply', v)}
                        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                        thumbColor={(remoteSettings.whatsappAutoReply ?? DEFAULT_WHATSAPP_AUTO_REPLY) ? theme.colors.primaryForeground : theme.colors.background}
                      />
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>Log Messages</Text>
                      <Switch
                        value={remoteSettings.whatsappLogMessages ?? DEFAULT_WHATSAPP_LOG_MESSAGES}
                        onValueChange={(v) => handleRemoteSettingToggle('whatsappLogMessages', v)}
                        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                        thumbColor={(remoteSettings.whatsappLogMessages ?? DEFAULT_WHATSAPP_LOG_MESSAGES) ? theme.colors.primaryForeground : theme.colors.background}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      Log message content (privacy concern)
                    </Text>
                  </>
                )}
              </CollapsibleSection>
            )}

            {/* 4j. Discord */}
            {remoteSettings && (
              <CollapsibleSection id="discord" title="Discord">
                <View style={styles.row}>
                  <Text style={styles.label}>Discord Integration</Text>
                  <Switch
                    value={remoteSettings.discordEnabled ?? false}
                    onValueChange={(v) => handleRemoteSettingToggle('discordEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={remoteSettings.discordEnabled ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>

                {remoteSettings.discordEnabled && (
                  <>
                    <Text style={styles.label}>Bot Token</Text>
                    <TextInput
                      style={styles.input}
                      value={inputDrafts.discordBotToken ?? ''}
                      onChangeText={(v) => {
                        markRemotePending('discordBotToken');
                        setSaveStatusMessage(null);
                        setInputDrafts(prev => ({ ...prev, discordBotToken: v }));
                      }}
                      onBlur={() => {
                        if (!settingsClient || !pendingRemoteSaveKeys.includes('discordBotToken')) return;
                        const value = inputDrafts.discordBotToken ?? '';
                        settingsClient.updateSettings({ discordBotToken: value }).then(() => {
                          setRemoteSettings(prev => prev ? { ...prev, discordBotToken: value ? SECRET_MASK : '' } : null);
                          clearRemotePending('discordBotToken');
                          setInputDrafts(prev => ({ ...prev, discordBotToken: '' }));
                        }).catch((error: any) => {
                          console.error('[Settings] Failed to update discordBotToken:', error);
                          setRemoteError(error.message || 'Failed to update discordBotToken');
                        });
                      }}
                      placeholder={remoteSettings.discordBotToken === SECRET_MASK ? 'Configured' : 'Paste your Discord bot token'}
                      placeholderTextColor={theme.colors.mutedForeground}
                      autoCapitalize='none'
                      autoCorrect={false}
                      secureTextEntry
                    />
                    <Text style={styles.helperText}>
                      Leave unchanged to keep the existing desktop token.
                    </Text>

                    {profiles.length > 0 && (
                      <>
                        <Text style={styles.label}>Default Profile</Text>
                        <View style={styles.providerSelector}>
                          <Pressable
                            style={[
                              styles.providerOption,
                              !remoteSettings.discordDefaultProfileId && styles.providerOptionActive,
                            ]}
                            onPress={() => handleRemoteSettingUpdate('discordDefaultProfileId', '')}
                          >
                            <Text style={[
                              styles.providerOptionText,
                              !remoteSettings.discordDefaultProfileId && styles.providerOptionTextActive,
                            ]}>
                              None
                            </Text>
                          </Pressable>
                          {profiles.map((profile) => (
                            <Pressable
                              key={profile.id}
                              style={[
                                styles.providerOption,
                                remoteSettings.discordDefaultProfileId === profile.id && styles.providerOptionActive,
                              ]}
                              onPress={() => handleRemoteSettingUpdate('discordDefaultProfileId', profile.id)}
                            >
                              <Text style={[
                                styles.providerOptionText,
                                remoteSettings.discordDefaultProfileId === profile.id && styles.providerOptionTextActive,
                              ]}>
                                {profile.name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </>
                    )}

                    <View style={styles.row}>
                      <Text style={styles.label}>Allow Direct Messages</Text>
                      <Switch
                        value={remoteSettings.discordDmEnabled ?? DEFAULT_DISCORD_DM_ENABLED}
                        onValueChange={(v) => handleRemoteSettingToggle('discordDmEnabled', v)}
                        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                        thumbColor={(remoteSettings.discordDmEnabled ?? DEFAULT_DISCORD_DM_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                      />
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>Require Mention</Text>
                      <Switch
                        value={remoteSettings.discordRequireMention ?? DEFAULT_DISCORD_REQUIRE_MENTION}
                        onValueChange={(v) => handleRemoteSettingToggle('discordRequireMention', v)}
                        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                        thumbColor={(remoteSettings.discordRequireMention ?? DEFAULT_DISCORD_REQUIRE_MENTION) ? theme.colors.primaryForeground : theme.colors.background}
                      />
                    </View>

                    {DISCORD_LIST_SETTING_SECTIONS.map((section) => (
                      <View key={section.key} style={styles.providerCredentialGroup}>
                        <Text style={styles.label}>{section.label}</Text>
                        <TextInput
                          style={[styles.input, { minHeight: 76, textAlignVertical: 'top' }]}
                          value={inputDrafts[section.key] ?? ''}
                          onChangeText={(v) => handleRemoteListSettingUpdate(section.key, v)}
                          placeholder={section.placeholder}
                          placeholderTextColor={theme.colors.mutedForeground}
                          autoCapitalize='none'
                          autoCorrect={false}
                          multiline
                          numberOfLines={3}
                        />
                        <Text style={styles.helperText}>{section.helper}</Text>
                      </View>
                    ))}

                    <View style={styles.row}>
                      <Text style={styles.label}>Log Messages</Text>
                      <Switch
                        value={remoteSettings.discordLogMessages ?? DEFAULT_DISCORD_LOG_MESSAGES}
                        onValueChange={(v) => handleRemoteSettingToggle('discordLogMessages', v)}
                        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                        thumbColor={(remoteSettings.discordLogMessages ?? DEFAULT_DISCORD_LOG_MESSAGES) ? theme.colors.primaryForeground : theme.colors.background}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      Log Discord message content on the desktop.
                    </Text>
                  </>
                )}
              </CollapsibleSection>
            )}

            {/* 4k. Langfuse */}
            {remoteSettings && (
              <CollapsibleSection id="langfuse" title="Langfuse">
                <View style={styles.row}>
                  <Text style={styles.label}>Local trace logging</Text>
                  <Switch
                    value={remoteSettings.localTraceLoggingEnabled ?? DEFAULT_LOCAL_TRACE_LOGGING_ENABLED}
                    onValueChange={(v) => handleRemoteSettingToggle('localTraceLoggingEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.localTraceLoggingEnabled ?? DEFAULT_LOCAL_TRACE_LOGGING_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Write agent session traces to JSONL files on the desktop machine.
                </Text>

                {(remoteSettings.localTraceLoggingEnabled ?? DEFAULT_LOCAL_TRACE_LOGGING_ENABLED) && (
                  <>
                    <Text style={styles.label}>Trace Folder</Text>
                    <TextInput
                      style={styles.input}
                      value={inputDrafts.localTraceLogPath ?? ''}
                      onChangeText={(v) => handleRemoteSettingUpdate('localTraceLogPath', v)}
                      placeholder="Use default traces folder"
                      placeholderTextColor={theme.colors.mutedForeground}
                      autoCapitalize='none'
                    />
                    <Text style={styles.helperText}>
                      Optional desktop filesystem path for trace files.
                    </Text>
                  </>
                )}

                <View style={styles.row}>
                  <Text style={styles.label}>Langfuse tracing</Text>
                  <Switch
                    value={remoteSettings.langfuseEnabled ?? DEFAULT_LANGFUSE_ENABLED}
                    onValueChange={(v) => handleRemoteSettingToggle('langfuseEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={(remoteSettings.langfuseEnabled ?? DEFAULT_LANGFUSE_ENABLED) ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>

                {(remoteSettings.langfuseEnabled ?? DEFAULT_LANGFUSE_ENABLED) && (
                  <>
                    <Text style={styles.label}>Public Key</Text>
                    <TextInput
                      style={styles.input}
                      value={inputDrafts.langfusePublicKey ?? ''}
                      onChangeText={(v) => handleRemoteSettingUpdate('langfusePublicKey', v)}
                      placeholder="pk-..."
                      placeholderTextColor={theme.colors.mutedForeground}
                      autoCapitalize='none'
                    />

                    <Text style={styles.label}>Secret Key</Text>
                    <TextInput
                      style={styles.input}
                      value={inputDrafts.langfuseSecretKey ?? ''}
                      onChangeText={(v) => {
                        markRemotePending('langfuseSecretKey');
                        setSaveStatusMessage(null);
                        setInputDrafts(prev => ({ ...prev, langfuseSecretKey: v }));
                      }}
                      onBlur={() => {
                        const value = inputDrafts.langfuseSecretKey;
                        if (value !== undefined && value !== '' && settingsClient) {
                          settingsClient.updateSettings({ langfuseSecretKey: value }).then(() => {
                            setRemoteSettings(prev => prev ? { ...prev, langfuseSecretKey: '••••••••' } : null);
                            clearRemotePending('langfuseSecretKey');
                            setInputDrafts(prev => ({ ...prev, langfuseSecretKey: '' }));
                          }).catch((error: any) => {
                            console.error('[Settings] Failed to update langfuseSecretKey:', error);
                            setRemoteError(error.message || 'Failed to update langfuseSecretKey');
                          });
                        }
                      }}
                      placeholder="sk-..."
                      placeholderTextColor={theme.colors.mutedForeground}
                      autoCapitalize='none'
                      secureTextEntry
                    />

                    <Text style={styles.label}>Base URL</Text>
                    <TextInput
                      style={styles.input}
                      value={inputDrafts.langfuseBaseUrl ?? ''}
                      onChangeText={(v) => handleRemoteSettingUpdate('langfuseBaseUrl', v)}
                      placeholder="https://cloud.langfuse.com (default)"
                      placeholderTextColor={theme.colors.mutedForeground}
                      autoCapitalize='none'
                      keyboardType="url"
                    />
                    <Text style={styles.helperText}>
                      Leave empty for Langfuse Cloud
                    </Text>
                  </>
                )}
              </CollapsibleSection>
            )}

            {/* 4k. Skills */}
            {isDotAgentsServer && (
              <CollapsibleSection id="skills" title="Skills">
                {isLoadingSkills ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : skills.length === 0 ? (
                  <Text style={styles.helperText}>No skills configured</Text>
                ) : (
                  displaySkills.map((skill) => (
                    <View key={skill.id} style={[styles.serverRow, !skill.enabled && { opacity: 0.5 }]}>
                      <TouchableOpacity
                        style={styles.agentInfoPressable}
                        onPress={() => handleSkillEdit(skill)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(`Edit skill ${skill.name}`)}
                      >
                        <View style={styles.serverInfo}>
                          <View style={styles.serverNameRow}>
                            <Text style={styles.serverName}>{skill.name}</Text>
                            {skill.source && (
                              <View style={[styles.providerOption, { paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 }]}>
                                <Text style={[styles.providerOptionText, { fontSize: 10 }]}>{skill.source}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.serverMeta} numberOfLines={2}>
                            {!skill.enabled ? '(Globally disabled) ' : ''}{skill.description || 'No description'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.agentActions}>
                        <Switch
                          value={skill.enabledForProfile}
                          onValueChange={() => handleSkillToggle(skill.id)}
                          disabled={!skill.enabled}
                          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                          thumbColor={skill.enabledForProfile && skill.enabled ? theme.colors.primaryForeground : theme.colors.background}
                        />
                        <TouchableOpacity
                          style={[
                            styles.agentSecondaryButton,
                            isExportingSkillMarkdownId === skill.id && styles.agentActionButtonDisabled,
                          ]}
                          onPress={() => handleSkillMarkdownExport(skill)}
                          disabled={isExportingSkillMarkdownId === skill.id}
                          accessibilityRole="button"
                          accessibilityLabel={createButtonAccessibilityLabel(`Export skill ${skill.name} as Markdown`)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.agentSecondaryButtonText}>
                            {isExportingSkillMarkdownId === skill.id ? 'Exporting...' : 'Export'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.agentDeleteButton}
                          onPress={() => handleSkillDelete(skill)}
                          accessibilityRole="button"
                          accessibilityLabel={createButtonAccessibilityLabel(`Delete skill ${skill.name}`)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.agentDeleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
                <View style={styles.sectionActionRow}>
                  <TouchableOpacity
                    style={[styles.createAgentButton, styles.sectionActionButton]}
                    onPress={() => handleSkillEdit()}
                  >
                    <Text style={styles.createAgentButtonText}>+ Create New Skill</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.createAgentButton, styles.sectionActionButton]}
                    onPress={() => setShowSkillImportModal(true)}
                    accessibilityRole="button"
                    accessibilityLabel={createButtonAccessibilityLabel('Import skill Markdown')}
                  >
                    <Text style={styles.createAgentButtonText}>Import Skill</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.createAgentButton, styles.sectionActionButton]}
                    onPress={() => setShowSkillGitHubImportModal(true)}
                    accessibilityRole="button"
                    accessibilityLabel={createButtonAccessibilityLabel('Import skill from GitHub')}
                  >
                    <Text style={styles.createAgentButtonText}>Import GitHub</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>
                  Tap a skill to edit, or toggle to enable it for the Main Agent.
                </Text>
              </CollapsibleSection>
            )}

            {/* 4l. Knowledge Notes */}
            {isDotAgentsServer && (
              <CollapsibleSection id="knowledgeNotes" title="Knowledge Notes">
                <TextInput
                  style={[styles.input, styles.knowledgeNoteSearchInput]}
                  value={knowledgeNoteSearchQuery}
                  onChangeText={setKnowledgeNoteSearchQuery}
                  placeholder="Search notes"
                  placeholderTextColor={theme.colors.mutedForeground}
                  accessibilityLabel="Search knowledge notes"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                <View style={styles.knowledgeFilterGroup}>
                  {KNOWLEDGE_CONTEXT_FILTER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.knowledgeFilterButton,
                        knowledgeNoteContextFilter === option.value && styles.knowledgeFilterButtonActive,
                      ]}
                      onPress={() => setKnowledgeNoteContextFilter(option.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: knowledgeNoteContextFilter === option.value }}
                      accessibilityLabel={`Filter knowledge notes by ${option.label}`}
                    >
                      <Text
                        style={[
                          styles.knowledgeFilterButtonText,
                          knowledgeNoteContextFilter === option.value && styles.knowledgeFilterButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.knowledgeFilterGroup}>
                  {KNOWLEDGE_DATE_FILTER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.knowledgeFilterButton,
                        knowledgeNoteDateFilter === option.value && styles.knowledgeFilterButtonActive,
                      ]}
                      onPress={() => setKnowledgeNoteDateFilter(option.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: knowledgeNoteDateFilter === option.value }}
                      accessibilityLabel={`Filter knowledge notes by ${option.label}`}
                    >
                      <Text
                        style={[
                          styles.knowledgeFilterButtonText,
                          knowledgeNoteDateFilter === option.value && styles.knowledgeFilterButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.knowledgeFilterGroup}>
                  {KNOWLEDGE_SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.knowledgeFilterButton,
                        knowledgeNoteSortOption === option.value && styles.knowledgeFilterButtonActive,
                      ]}
                      onPress={() => setKnowledgeNoteSortOption(option.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: knowledgeNoteSortOption === option.value }}
                      accessibilityLabel={`Sort knowledge notes by ${option.label}`}
                    >
                      <Text
                        style={[
                          styles.knowledgeFilterButtonText,
                          knowledgeNoteSortOption === option.value && styles.knowledgeFilterButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {isLoadingKnowledgeNotes ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : isSearchingKnowledgeNotes ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : displayedKnowledgeNotes.length === 0 ? (
                  <Text style={styles.helperText}>
                    {trimmedKnowledgeNoteSearchQuery ? 'No matching notes' : 'No notes saved'}
                  </Text>
                ) : (
                  knowledgeNoteSections.map((section) => (
                    <View key={section.key}>
                      <Text style={styles.subsectionTitle}>{section.label}</Text>
                      {section.notes.map(renderKnowledgeNoteRow)}
                      {section.seriesSections.map((series) => (
                        <View key={series.key}>
                          <Text style={[styles.serverMeta, { marginTop: spacing.xs, marginBottom: spacing.xs }]}>
                            {series.label}
                          </Text>
                          {series.notes.map(renderKnowledgeNoteRow)}
                        </View>
                      ))}
                    </View>
                  ))
                )}
                <View style={styles.sectionActionRow}>
                  <TouchableOpacity
                    style={[styles.createAgentButton, styles.sectionActionButton]}
                    onPress={() => handleKnowledgeNoteEdit()}
                    accessibilityRole="button"
                    accessibilityLabel={createButtonAccessibilityLabel('Create knowledge note')}
                  >
                    <Text style={styles.createAgentButtonText}>+ Create Note</Text>
                  </TouchableOpacity>
                  {visibleSelectedKnowledgeNoteIds.length > 0 && (
                    <TouchableOpacity
                      style={[styles.createAgentButton, styles.sectionActionButton, styles.sectionDangerButton]}
                      onPress={handleKnowledgeNoteDeleteMultiple}
                      accessibilityRole="button"
                      accessibilityLabel={createButtonAccessibilityLabel(`Delete ${visibleSelectedKnowledgeNoteIds.length} selected knowledge notes`)}
                    >
                      <Text style={[styles.createAgentButtonText, styles.sectionDangerButtonText]}>
                        Delete Selected ({visibleSelectedKnowledgeNoteIds.length})
                      </Text>
                    </TouchableOpacity>
                  )}
                  {knowledgeNotes.length > 0 && (
                    <TouchableOpacity
                      style={[styles.createAgentButton, styles.sectionActionButton, styles.sectionDangerButton]}
                      onPress={handleKnowledgeNoteDeleteAll}
                      accessibilityRole="button"
                      accessibilityLabel={createButtonAccessibilityLabel('Delete all knowledge notes')}
                    >
                      <Text style={[styles.createAgentButtonText, styles.sectionDangerButtonText]}>
                        Delete All
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.helperText}>
                  Tap a note to edit it or create a new one. Canonical note fields are title, context, summary, body, tags, and references. Use auto context sparingly for high-signal notes.
                </Text>
              </CollapsibleSection>
            )}

            {/* 4m. Agents */}
            {isDotAgentsServer && (
              <CollapsibleSection id="agents" title="Agents">
                <View style={styles.sectionActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.profileActionButton,
                      styles.sectionActionButton,
                      isReloadingAgentProfiles && styles.profileActionButtonDisabled,
                    ]}
                    onPress={handleAgentProfilesReload}
                    disabled={isReloadingAgentProfiles}
                    accessibilityRole="button"
                    accessibilityLabel={createButtonAccessibilityLabel('Rescan agent files')}
                  >
                    <Text style={styles.profileActionButtonText}>
                      {isReloadingAgentProfiles ? 'Rescanning...' : 'Rescan Files'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {isLoadingAgentProfiles ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : agentProfiles.length === 0 ? (
                  <Text style={styles.helperText}>No agents configured</Text>
                ) : (
                  agentProfiles.map((profile) => (
                    <View
                      key={profile.id}
                      style={styles.serverRow}
                    >
                      <TouchableOpacity
                        style={styles.agentInfoPressable}
                        onPress={() => handleAgentProfileEdit(profile.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.agentListContent}>
                          <View style={styles.agentListAvatar}>
                            {profile.avatarDataUrl ? (
                              <Image
                                source={{ uri: profile.avatarDataUrl }}
                                style={styles.agentListAvatarImage}
                                accessibilityIgnoresInvertColors
                              />
                            ) : (
                              <Text style={styles.agentListAvatarInitial}>
                                {(profile.displayName || profile.name || 'A').slice(0, 1).toUpperCase()}
                              </Text>
                            )}
                          </View>
                          <View style={styles.serverInfo}>
                            <View style={styles.serverNameRow}>
                              <Text style={styles.serverName}>{profile.displayName}</Text>
                              {profile.isBuiltIn && (
                                <View style={[styles.providerOption, { paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 }]}>
                                  <Text style={[styles.providerOptionText, { fontSize: 10 }]}>Built-in</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.serverMeta}>
                              {profile.connectionType} • {profile.role || 'agent'}
                            </Text>
                            {profile.description && (
                              <Text style={styles.serverMeta} numberOfLines={2}>{profile.description}</Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.agentActions}>
                        <Switch
                          value={profile.enabled}
                          onValueChange={() => handleAgentProfileToggle(profile.id)}
                          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                          thumbColor={profile.enabled ? theme.colors.primaryForeground : theme.colors.background}
                        />
                        {!profile.isBuiltIn && (
                          <TouchableOpacity
                            style={styles.agentDeleteButton}
                            onPress={() => handleAgentProfileDelete(profile)}
                            accessibilityLabel={`Delete agent ${profile.displayName}`}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={styles.agentDeleteButtonText}>Delete</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                )}
                <TouchableOpacity
                  style={styles.createAgentButton}
                  onPress={() => handleAgentProfileEdit()}
                >
                  <Text style={styles.createAgentButtonText}>+ Create New Agent</Text>
                </TouchableOpacity>
                <Text style={styles.helperText}>
                  Tap an agent name to edit, toggle to enable or disable
                </Text>
              </CollapsibleSection>
            )}

            {/* 4n. Agent Loops */}
            {isDotAgentsServer && (
              <CollapsibleSection id="agentLoops" title="Agent Loops">
                {isLoadingLoops ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : loops.length === 0 ? (
                  <Text style={styles.helperText}>No agent loops configured</Text>
                ) : (
                  loops.map((loop) => {
                    const loopRuntimeLabel = describeRepeatTaskRuntime(loop, {
                      timestampFormatOptions: MOBILE_LOOP_RUNTIME_TIMESTAMP_FORMAT,
                    });
                    const isLoopStarting = loopRuntimeAction?.loopId === loop.id && loopRuntimeAction.action === 'start';
                    const isLoopStopping = loopRuntimeAction?.loopId === loop.id && loopRuntimeAction.action === 'stop';
                    const isLoopRuntimeBusy = isLoopStarting || isLoopStopping;

                    return (
                      <View key={loop.id} style={[styles.serverRow, { alignItems: 'flex-start' }]}>
                        <TouchableOpacity
                          style={styles.agentInfoPressable}
                          onPress={() => handleLoopEdit(loop)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.serverInfo, { flex: 1 }]}>
                            <View style={styles.serverNameRow}>
                              <View style={[
                                styles.statusDot,
                                loop.isRunning ? styles.statusConnected : styles.statusDisconnected,
                              ]} />
                              <Text style={styles.serverName}>{loop.name}</Text>
                            </View>
                            <Text style={styles.serverMeta} numberOfLines={2}>{loop.prompt}</Text>
                            <Text style={styles.serverMeta} numberOfLines={2}>
                              {describeLoopCadence(loop)}
                              {loop.profileName && ` • ${loop.profileName}`}
                              {loop.lastRunAt && ` • Last: ${formatRepeatTaskRuntimeTimestamp(loop.lastRunAt, MOBILE_LOOP_RUNTIME_TIMESTAMP_FORMAT)}`}
                            </Text>
                            <Text style={styles.loopRuntimeMeta} numberOfLines={1}>
                              {loopRuntimeLabel}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.loopActions}>
                          <Switch
                            value={loop.enabled}
                            onValueChange={() => handleLoopToggle(loop.id)}
                            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                            thumbColor={loop.enabled ? theme.colors.primaryForeground : theme.colors.background}
                          />
                          <TouchableOpacity
                            style={styles.loopActionButton}
                            onPress={() => handleLoopRun(loop.id)}
                            accessibilityRole="button"
                            accessibilityLabel={createButtonAccessibilityLabel(`Run ${loop.name} loop now`)}
                            accessibilityHint="Runs this loop immediately without waiting for the next scheduled interval."
                          >
                            <Text style={styles.loopActionButtonText}>Run now</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.loopActionButton,
                              (!loop.enabled || isLoopRuntimeBusy) && styles.agentActionButtonDisabled,
                            ]}
                            onPress={() => handleLoopStart(loop)}
                            disabled={!loop.enabled || isLoopRuntimeBusy}
                            accessibilityRole="button"
                            accessibilityLabel={createButtonAccessibilityLabel(`Start ${loop.name} loop schedule`)}
                            accessibilityHint="Starts scheduling this enabled loop on the desktop app."
                          >
                            <Text style={styles.loopActionButtonText}>
                              {isLoopStarting ? 'Starting...' : 'Start'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.loopActionButton,
                              isLoopRuntimeBusy && styles.agentActionButtonDisabled,
                            ]}
                            onPress={() => handleLoopStop(loop)}
                            disabled={isLoopRuntimeBusy}
                            accessibilityRole="button"
                            accessibilityLabel={createButtonAccessibilityLabel(`Stop ${loop.name} loop schedule`)}
                            accessibilityHint="Stops the scheduled timer for this loop on the desktop app."
                          >
                            <Text style={styles.loopActionButtonText}>
                              {isLoopStopping ? 'Stopping...' : 'Stop'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.loopActionButton, isExportingLoopMarkdownId === loop.id && styles.agentActionButtonDisabled]}
                            onPress={() => handleLoopMarkdownExport(loop)}
                            disabled={isExportingLoopMarkdownId === loop.id}
                            accessibilityRole="button"
                            accessibilityLabel={createButtonAccessibilityLabel(`Export ${loop.name} loop as Markdown`)}
                          >
                            <Text style={styles.loopActionButtonText}>
                              {isExportingLoopMarkdownId === loop.id ? 'Exporting...' : 'Export'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.loopActionButton, styles.loopActionButtonDanger]}
                            onPress={() => handleLoopDelete(loop)}
                            accessibilityRole="button"
                            accessibilityLabel={createButtonAccessibilityLabel(`Delete ${loop.name} loop`)}
                            accessibilityHint="Opens a confirmation prompt before permanently deleting this loop."
                          >
                            <Text style={[styles.loopActionButtonText, styles.loopActionButtonTextDanger]}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
                <View style={styles.sectionActionRow}>
                  <TouchableOpacity
                    style={[styles.createAgentButton, styles.sectionActionButton]}
                    onPress={() => handleLoopEdit()}
                  >
                    <Text style={styles.createAgentButtonText}>+ Create New Loop</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.createAgentButton, styles.sectionActionButton]}
                    onPress={() => setShowLoopImportModal(true)}
                    accessibilityRole="button"
                    accessibilityLabel={createButtonAccessibilityLabel('Import loop Markdown')}
                  >
                    <Text style={styles.createAgentButtonText}>Import Loop</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>
                  Tap a loop to edit, or run/toggle/delete from the actions
                </Text>
              </CollapsibleSection>
            )}
          </>
        )}

      </ScrollView>

	      <View style={[styles.saveBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
	        <TouchableOpacity
	          style={[styles.primaryButton, styles.saveBarButton, isSavingAllSettings && styles.primaryButtonDisabled]}
	          onPress={() => { void flushAllSettingsSaves(); }}
	          disabled={isSavingAllSettings}
	          activeOpacity={0.85}
	          accessibilityRole="button"
	          accessibilityLabel={saveButtonLabel}
	          accessibilityHint={saveButtonHint}
	        >
	          <Text style={styles.primaryButtonText}>{saveButtonLabel}</Text>
	        </TouchableOpacity>
	        <Text style={styles.saveBarHint}>
	          {saveStatusMessage || saveButtonHint}
	        </Text>
	      </View>
    </KeyboardAvoidingView>

      {/* Model Picker Modal */}
      <Modal
        visible={showModelPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowModelPicker(false);
          setModelSearchQuery('');
        }}
      >
        <View style={styles.modelPickerOverlay}>
          <View style={styles.modelPickerContainer}>
            <View style={styles.modelPickerHeader}>
              <Text style={styles.modelPickerTitle}>Select Model</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowModelPicker(false);
                  setModelSearchQuery('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Close model picker"
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.modelSearchContainer}>
              <TextInput
                style={styles.modelSearchInput}
                value={modelSearchQuery}
                onChangeText={setModelSearchQuery}
                placeholder="Search models..."
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Models List */}
            <ScrollView style={styles.modelList} keyboardShouldPersistTaps="handled">
              {filteredModels.length === 0 ? (
                <View style={styles.modelListEmpty}>
                  <Text style={styles.modelListEmptyText}>
                    {modelSearchQuery ? `No models match "${modelSearchQuery}"` : 'No models available'}
                  </Text>
                </View>
              ) : (
                filteredModels.map((model) => {
                  const isSelected = getCurrentModelValue() === model.id;
                  return (
                    <TouchableOpacity
                      key={model.id}
                      style={[
                        styles.modelItem,
                        isSelected && styles.modelItemActive,
                      ]}
                      onPress={() => handleModelSelect(model.id)}
                    >
                      <View style={styles.modelItemContent}>
                        <Text style={[
                          styles.modelItemName,
                          isSelected && styles.modelItemNameActive,
                        ]}>
                          {model.name}
                        </Text>
                        {model.id !== model.name && (
                          <Text style={styles.modelItemId}>{model.id}</Text>
                        )}
                      </View>
                      {isSelected && (
                        <Text style={styles.modelItemCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Footer with model count */}
            <View style={styles.modelPickerFooter}>
              <Text style={styles.modelPickerFooterText}>
                {modelSearchQuery
                  ? `${filteredModels.length} of ${availableModels.length} models`
                  : `${availableModels.length} model${availableModels.length !== 1 ? 's' : ''} available`}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Preset Picker Modal */}
      <Modal
        visible={showPresetPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPresetPicker(false)}
      >
        <View style={styles.modelPickerOverlay}>
          <View style={styles.modelPickerContainer}>
            <View style={styles.modelPickerHeader}>
              <Text style={styles.modelPickerTitle}>Select Endpoint</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPresetPicker(false)}
                accessibilityRole="button"
                accessibilityLabel="Close endpoint picker"
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modelList}>
              {remoteSettings?.availablePresets?.map((preset) => {
                const isSelected = remoteSettings.currentModelPresetId === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.modelItem,
                      isSelected && styles.modelItemActive,
                    ]}
                    onPress={() => handlePresetChange(preset.id)}
                  >
                    <View style={styles.modelItemContent}>
                      <Text style={[
                        styles.modelItemName,
                        isSelected && styles.modelItemNameActive,
                      ]}>
                        {preset.name}
                      </Text>
                      <Text style={styles.modelItemId}>{preset.baseUrl}</Text>
                    </View>
                    {isSelected && (
                      <Text style={styles.modelItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modelPickerFooter}>
              <Text style={styles.modelPickerFooterText}>
                {remoteSettings?.availablePresets?.length || 0} endpoint{(remoteSettings?.availablePresets?.length || 0) !== 1 ? 's' : ''} available
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Preset Editor Modal */}
      <Modal
        visible={showPresetEditor}
        animationType="slide"
        transparent={true}
        onRequestClose={closePresetEditor}
      >
        <View style={styles.importModalOverlay}>
          <View style={[styles.importModalContainer, styles.presetEditorContainer]}>
            <View style={styles.importModalHeader}>
              <Text style={styles.importModalTitle}>
                {presetEditorMode === 'create'
                  ? 'New Endpoint'
                  : presetDraft.isBuiltIn
                    ? 'Configure Endpoint'
                    : 'Edit Endpoint'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closePresetEditor}
                accessibilityRole="button"
                accessibilityLabel="Close endpoint editor"
                disabled={isSavingPreset}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.presetEditorBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[styles.input, presetDraft.isBuiltIn && styles.inputDisabled]}
                value={presetDraft.name}
                onChangeText={(v) => handlePresetDraftChange('name', v)}
                placeholder="My endpoint"
                placeholderTextColor={theme.colors.mutedForeground}
                editable={!presetDraft.isBuiltIn && !isSavingPreset}
              />

              <Text style={styles.label}>Base URL</Text>
              <TextInput
                style={[styles.input, presetDraft.isBuiltIn && styles.inputDisabled]}
                value={presetDraft.baseUrl}
                onChangeText={(v) => handlePresetDraftChange('baseUrl', v)}
                placeholder="https://api.example.com/v1"
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!presetDraft.isBuiltIn && !isSavingPreset}
              />

              <Text style={styles.label}>API Key</Text>
              <TextInput
                style={styles.input}
                value={presetDraft.apiKey}
                onChangeText={(v) => handlePresetDraftChange('apiKey', v)}
                placeholder={presetDraft.hasApiKey ? 'Configured' : 'sk-...'}
                placeholderTextColor={theme.colors.mutedForeground}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSavingPreset}
              />

              <Text style={styles.label}>Agent Model</Text>
              <TextInput
                style={styles.input}
                value={presetDraft.agentModel}
                onChangeText={(v) => handlePresetDraftChange('agentModel', v)}
                placeholder="gpt-4.1-mini"
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSavingPreset}
              />

              <Text style={styles.label}>Transcript Model</Text>
              <TextInput
                style={styles.input}
                value={presetDraft.transcriptProcessingModel}
                onChangeText={(v) => handlePresetDraftChange('transcriptProcessingModel', v)}
                placeholder="gpt-4.1-mini"
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSavingPreset}
              />
            </ScrollView>

            <View style={styles.importModalActions}>
              {presetEditorMode === 'edit' && !presetDraft.isBuiltIn && (
                <TouchableOpacity
                  style={[styles.dangerActionButton, styles.presetDeleteButton, isSavingPreset && styles.dangerActionButtonDisabled]}
                  onPress={handlePresetDelete}
                  disabled={isSavingPreset}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete endpoint ${presetDraft.name}`}
                >
                  <Text style={styles.dangerActionButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.importModalCancelButton}
                onPress={closePresetEditor}
                disabled={isSavingPreset}
              >
                <Text style={styles.importModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.importModalImportButton, isSavingPreset && styles.importModalImportButtonDisabled]}
                onPress={handlePresetEditorSave}
                disabled={isSavingPreset}
              >
                <Text style={styles.importModalImportText}>
                  {isSavingPreset ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MCP Server Editor Modal */}
      <Modal
        visible={showMcpServerEditor}
        animationType="slide"
        transparent={true}
        onRequestClose={closeMcpServerEditor}
      >
        <View style={styles.importModalOverlay}>
          <View style={[styles.importModalContainer, styles.presetEditorContainer]}>
            <View style={styles.importModalHeader}>
              <Text style={styles.importModalTitle}>
                {mcpServerEditorMode === 'create' ? 'New MCP Server' : 'Replace MCP Server'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeMcpServerEditor}
                accessibilityRole="button"
                accessibilityLabel="Close MCP server editor"
                disabled={isSavingMcpServer}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.presetEditorBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[styles.input, mcpServerEditorMode === 'replace' && styles.inputDisabled]}
                value={mcpServerDraft.name}
                onChangeText={(v) => handleMcpServerDraftChange('name', v)}
                placeholder="filesystem"
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                editable={mcpServerEditorMode === 'create' && !isSavingMcpServer}
              />

              <Text style={styles.label}>Transport</Text>
              <View style={styles.providerSelector}>
                {(['stdio', 'streamableHttp', 'websocket'] as MCPTransportType[]).map((transport) => (
                  <Pressable
                    key={transport}
                    style={[
                      styles.providerOption,
                      mcpServerDraft.transport === transport && styles.providerOptionActive,
                    ]}
                    onPress={() => handleMcpServerDraftChange('transport', transport)}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${transport} MCP transport`}
                    disabled={isSavingMcpServer}
                  >
                    <Text style={[
                      styles.providerOptionText,
                      mcpServerDraft.transport === transport && styles.providerOptionTextActive,
                    ]}>
                      {transport === 'streamableHttp' ? 'HTTP' : transport}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {mcpServerDraft.transport === 'stdio' ? (
                <>
                  <Text style={styles.label}>Command</Text>
                  <TextInput
                    style={styles.input}
                    value={mcpServerDraft.command}
                    onChangeText={(v) => handleMcpServerDraftChange('command', v)}
                    placeholder="npx"
                    placeholderTextColor={theme.colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSavingMcpServer}
                  />

                  <Text style={styles.label}>Arguments</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 88 }]}
                    value={mcpServerDraft.args}
                    onChangeText={(v) => handleMcpServerDraftChange('args', v)}
                    placeholder={"-y\n@modelcontextprotocol/server-filesystem"}
                    placeholderTextColor={theme.colors.mutedForeground}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSavingMcpServer}
                  />

                  <Text style={styles.label}>Environment</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 88 }]}
                    value={mcpServerDraft.env}
                    onChangeText={(v) => handleMcpServerDraftChange('env', v)}
                    placeholder="API_KEY=value"
                    placeholderTextColor={theme.colors.mutedForeground}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSavingMcpServer}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>URL</Text>
                  <TextInput
                    style={styles.input}
                    value={mcpServerDraft.url}
                    onChangeText={(v) => handleMcpServerDraftChange('url', v)}
                    placeholder={mcpServerDraft.transport === 'websocket' ? 'wss://example.com/mcp' : 'https://example.com/mcp'}
                    placeholderTextColor={theme.colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSavingMcpServer}
                  />

                  <Text style={styles.label}>Headers</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 88 }]}
                    value={mcpServerDraft.headers}
                    onChangeText={(v) => handleMcpServerDraftChange('headers', v)}
                    placeholder="Authorization=Bearer token"
                    placeholderTextColor={theme.colors.mutedForeground}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSavingMcpServer}
                  />
                </>
              )}

              <Text style={styles.label}>Timeout</Text>
              <TextInput
                style={styles.input}
                value={mcpServerDraft.timeout}
                onChangeText={(v) => handleMcpServerDraftChange('timeout', v)}
                placeholder="30"
                placeholderTextColor={theme.colors.mutedForeground}
                keyboardType="number-pad"
                editable={!isSavingMcpServer}
              />

              <View style={styles.row}>
                <Text style={styles.label}>Disabled</Text>
                <Switch
                  value={mcpServerDraft.disabled}
                  onValueChange={(v) => handleMcpServerDraftChange('disabled', v)}
                  trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                  thumbColor={mcpServerDraft.disabled ? theme.colors.primaryForeground : theme.colors.background}
                  disabled={isSavingMcpServer}
                />
              </View>
            </ScrollView>

            <View style={styles.importModalActions}>
              <TouchableOpacity
                style={styles.importModalCancelButton}
                onPress={closeMcpServerEditor}
                disabled={isSavingMcpServer}
              >
                <Text style={styles.importModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.importModalImportButton, isSavingMcpServer && styles.importModalImportButtonDisabled]}
                onPress={handleMcpServerEditorSave}
                disabled={isSavingMcpServer}
                accessibilityRole="button"
                accessibilityLabel="Save MCP server"
              >
                <Text style={styles.importModalImportText}>
                  {isSavingMcpServer ? 'Saving...' : mcpServerEditorMode === 'create' ? 'Save' : 'Replace'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bundle Import Modal */}
      <Modal
        visible={showBundleImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeBundleImportModal}
      >
        <View style={styles.importModalOverlay}>
          <View style={styles.importModalContainer}>
            <View style={styles.importModalHeader}>
              <Text style={styles.importModalTitle}>Import Bundle</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeBundleImportModal}
                accessibilityRole="button"
                accessibilityLabel="Close bundle import modal"
                disabled={isPreviewingBundleImport || isImportingBundle}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.bundleImportBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={styles.importJsonInput}
                value={bundleImportJsonText}
                onChangeText={handleBundleImportJsonChange}
                placeholder='{"manifest":{"version":1,"name":"Bundle"},"agentProfiles":[]}'
                placeholderTextColor={theme.colors.mutedForeground}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                editable={!isPreviewingBundleImport && !isImportingBundle}
              />

              <Text style={styles.label}>Handle conflicts</Text>
              <View style={styles.providerSelector}>
                {BUNDLE_IMPORT_CONFLICT_STRATEGY_OPTIONS.map((strategy) => (
                  <Pressable
                    key={strategy.value}
                    style={[
                      styles.providerOption,
                      bundleImportConflictStrategy === strategy.value && styles.providerOptionActive,
                    ]}
                    onPress={() => setBundleImportConflictStrategy(strategy.value)}
                    disabled={isImportingBundle}
                  >
                    <Text style={[
                      styles.providerOptionText,
                      bundleImportConflictStrategy === strategy.value && styles.providerOptionTextActive,
                    ]}>
                      {strategy.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Components</Text>
              {BUNDLE_COMPONENT_OPTIONS.map((component) => {
                const count = bundleImportPreview?.bundle.manifest.components[component.key] ?? 0;
                const conflicts = bundleImportPreview?.conflicts[component.key].length ?? 0;
                return (
                  <View key={component.key} style={styles.row}>
                    <View style={styles.serverInfo}>
                      <Text style={styles.serverName}>{component.label}</Text>
                      <Text style={styles.serverMeta}>
                        {bundleImportPreview
                          ? `${count} item${count === 1 ? '' : 's'}${conflicts > 0 ? `, ${conflicts} conflict${conflicts === 1 ? '' : 's'}` : ''}`
                          : 'Not previewed'}
                      </Text>
                    </View>
                    <Switch
                      value={bundleImportComponents[component.key]}
                      onValueChange={(value) => handleBundleImportComponentToggle(component.key, value)}
                      accessibilityLabel={createSwitchAccessibilityLabel(`Import bundle ${component.label}`)}
                      trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                      thumbColor={bundleImportComponents[component.key] ? theme.colors.primaryForeground : theme.colors.background}
                    />
                  </View>
                );
              })}

              {bundleImportPreview && (
                <View style={styles.bundlePreviewCard}>
                  <Text style={styles.serverName}>{bundleImportPreview.bundle.manifest.name}</Text>
                  {bundleImportPreview.bundle.manifest.description && (
                    <Text style={styles.serverMeta} numberOfLines={2}>
                      {bundleImportPreview.bundle.manifest.description}
                    </Text>
                  )}
                  <Text style={styles.serverMeta}>
                    Exported from {bundleImportPreview.bundle.manifest.exportedFrom}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.importModalActions}>
              <TouchableOpacity
                style={styles.importModalCancelButton}
                onPress={closeBundleImportModal}
                disabled={isPreviewingBundleImport || isImportingBundle}
              >
                <Text style={styles.importModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.importModalCancelButton,
                  (!bundleImportJsonText.trim() || isPreviewingBundleImport || isImportingBundle) && styles.importModalImportButtonDisabled,
                ]}
                onPress={handleBundleImportPreview}
                disabled={!bundleImportJsonText.trim() || isPreviewingBundleImport || isImportingBundle}
                accessibilityRole="button"
                accessibilityLabel="Preview DotAgents bundle JSON"
              >
                <Text style={styles.importModalCancelText}>
                  {isPreviewingBundleImport ? 'Previewing...' : 'Preview'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.importModalImportButton,
                  (!bundleImportPreview || isImportingBundle || isPreviewingBundleImport) && styles.importModalImportButtonDisabled,
                ]}
                onPress={handleBundleImport}
                disabled={!bundleImportPreview || isImportingBundle || isPreviewingBundleImport}
                accessibilityRole="button"
                accessibilityLabel="Import DotAgents bundle JSON"
              >
                <Text style={styles.importModalImportText}>
                  {isImportingBundle ? 'Importing...' : 'Import'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Skill Markdown Import Modal */}
      <Modal
        visible={showSkillImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeSkillImportModal}
      >
        <View style={styles.importModalOverlay}>
          <View style={styles.importModalContainer}>
            <View style={styles.importModalHeader}>
              <Text style={styles.importModalTitle}>Import Skill</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeSkillImportModal}
                accessibilityRole="button"
                accessibilityLabel="Close skill import modal"
                disabled={isImportingSkillMarkdown}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.importJsonInput}
              value={skillImportMarkdownText}
              onChangeText={setSkillImportMarkdownText}
              placeholder={'---\nname: research-helper\ndescription: Finds context\n---\nUse reliable sources.'}
              placeholderTextColor={theme.colors.mutedForeground}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              editable={!isImportingSkillMarkdown}
            />

            <View style={styles.importModalActions}>
              <TouchableOpacity
                style={styles.importModalCancelButton}
                onPress={closeSkillImportModal}
                disabled={isImportingSkillMarkdown}
              >
                <Text style={styles.importModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.importModalImportButton,
                  (!skillImportMarkdownText.trim() || isImportingSkillMarkdown) && styles.importModalImportButtonDisabled,
                ]}
                onPress={handleSkillMarkdownImport}
                disabled={!skillImportMarkdownText.trim() || isImportingSkillMarkdown}
                accessibilityRole="button"
                accessibilityLabel="Import skill Markdown"
              >
                <Text style={styles.importModalImportText}>
                  {isImportingSkillMarkdown ? 'Importing...' : 'Import'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Skill GitHub Import Modal */}
      <Modal
        visible={showSkillGitHubImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeSkillGitHubImportModal}
      >
        <View style={styles.importModalOverlay}>
          <View style={styles.importModalContainer}>
            <View style={styles.importModalHeader}>
              <Text style={styles.importModalTitle}>Import GitHub Skill</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeSkillGitHubImportModal}
                accessibilityRole="button"
                accessibilityLabel="Close GitHub skill import modal"
                disabled={isImportingSkillGitHub}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={skillGitHubImportText}
              onChangeText={setSkillGitHubImportText}
              placeholder="owner/repo"
              placeholderTextColor={theme.colors.mutedForeground}
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              editable={!isImportingSkillGitHub}
            />

            <View style={styles.importModalActions}>
              <TouchableOpacity
                style={styles.importModalCancelButton}
                onPress={closeSkillGitHubImportModal}
                disabled={isImportingSkillGitHub}
              >
                <Text style={styles.importModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.importModalImportButton,
                  (!skillGitHubImportText.trim() || isImportingSkillGitHub) && styles.importModalImportButtonDisabled,
                ]}
                onPress={handleSkillGitHubImport}
                disabled={!skillGitHubImportText.trim() || isImportingSkillGitHub}
                accessibilityRole="button"
                accessibilityLabel="Import GitHub skill"
              >
                <Text style={styles.importModalImportText}>
                  {isImportingSkillGitHub ? 'Importing...' : 'Import'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loop Markdown Import Modal */}
      <Modal
        visible={showLoopImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeLoopImportModal}
      >
        <View style={styles.importModalOverlay}>
          <View style={styles.importModalContainer}>
            <View style={styles.importModalHeader}>
              <Text style={styles.importModalTitle}>Import Loop</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeLoopImportModal}
                accessibilityRole="button"
                accessibilityLabel="Close loop import modal"
                disabled={isImportingLoopMarkdown}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.importJsonInput}
              value={loopImportMarkdownText}
              onChangeText={setLoopImportMarkdownText}
              placeholder={'---\nkind: task\nname: morning-check\nintervalMinutes: 60\nenabled: true\n---\nSummarize overnight work.'}
              placeholderTextColor={theme.colors.mutedForeground}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              editable={!isImportingLoopMarkdown}
            />

            <View style={styles.importModalActions}>
              <TouchableOpacity
                style={styles.importModalCancelButton}
                onPress={closeLoopImportModal}
                disabled={isImportingLoopMarkdown}
              >
                <Text style={styles.importModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.importModalImportButton,
                  (!loopImportMarkdownText.trim() || isImportingLoopMarkdown) && styles.importModalImportButtonDisabled,
                ]}
                onPress={handleLoopMarkdownImport}
                disabled={!loopImportMarkdownText.trim() || isImportingLoopMarkdown}
                accessibilityRole="button"
                accessibilityLabel="Import loop Markdown"
              >
                <Text style={styles.importModalImportText}>
                  {isImportingLoopMarkdown ? 'Importing...' : 'Import'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MCP Server Import Modal */}
      <Modal
        visible={showMcpImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeMcpImportModal}
      >
        <View style={styles.importModalOverlay}>
          <View style={styles.importModalContainer}>
            <View style={styles.importModalHeader}>
              <Text style={styles.importModalTitle}>Import MCP Servers</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeMcpImportModal}
                accessibilityRole="button"
                accessibilityLabel="Close MCP server import modal"
                disabled={isImportingMcpServers}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.importJsonInput}
              value={mcpImportJsonText}
              onChangeText={setMcpImportJsonText}
              placeholder={'{"mcpServers":{"github":{"command":"github-mcp"}}}'}
              placeholderTextColor={theme.colors.mutedForeground}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              editable={!isImportingMcpServers}
            />

            <View style={styles.importModalActions}>
              <TouchableOpacity
                style={styles.importModalCancelButton}
                onPress={closeMcpImportModal}
                disabled={isImportingMcpServers}
              >
                <Text style={styles.importModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.importModalImportButton,
                  (!mcpImportJsonText.trim() || isImportingMcpServers) && styles.importModalImportButtonDisabled,
                ]}
                onPress={handleMcpServerImport}
                disabled={!mcpImportJsonText.trim() || isImportingMcpServers}
                accessibilityRole="button"
                accessibilityLabel="Import MCP servers"
              >
                <Text style={styles.importModalImportText}>
                  {isImportingMcpServers ? 'Importing...' : 'Import'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TTS Model Picker Modal */}
      <Modal
        visible={showTtsModelPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTtsModelPicker(false)}
      >
        <View style={styles.modelPickerOverlay}>
          <View style={styles.modelPickerContainer}>
            <View style={styles.modelPickerHeader}>
              <Text style={styles.modelPickerTitle}>Select TTS Model</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTtsModelPicker(false)}
                accessibilityRole="button"
                accessibilityLabel="Close TTS model picker"
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modelList}>
              {getTtsModelsForProvider(remoteTtsProviderId).map((model) => {
                const currentValue = getRemoteTtsModelValue(remoteSettings);
                const isSelected = currentValue === model.value;
                return (
                  <TouchableOpacity
                    key={model.value}
                    style={[
                      styles.modelItem,
                      isSelected && styles.modelItemActive,
                    ]}
                    onPress={() => {
                      const key = getTtsModelSettingKey(remoteTtsProviderId);
                      if (key) {
                        handleRemoteSettingUpdate(key, model.value);
                        if (remoteTtsProviderId === 'groq') {
                          const voiceKey = getTtsVoiceSettingKey(remoteTtsProviderId);
                          const defaultVoice = getRemoteTtsVoiceDefault(remoteTtsProviderId, model.value);
                          if (voiceKey && defaultVoice !== undefined) {
                            handleRemoteSettingUpdate(voiceKey, normalizeTtsVoiceUpdateValue(voiceKey, defaultVoice));
                          }
                        }
                      }
                      setShowTtsModelPicker(false);
                    }}
                  >
                    <View style={styles.modelItemContent}>
                      <Text style={[
                        styles.modelItemName,
                        isSelected && styles.modelItemNameActive,
                      ]}>
                        {model.label}
                      </Text>
                      <Text style={styles.modelItemId}>{model.value}</Text>
                    </View>
                    {isSelected && (
                      <Text style={styles.modelItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modelPickerFooter}>
              <Text style={styles.modelPickerFooterText}>
                {getTtsModelsForProvider(remoteTtsProviderId).length} model{getTtsModelsForProvider(remoteTtsProviderId).length !== 1 ? 's' : ''} available
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* TTS Voice Picker Modal */}
      <Modal
        visible={showTtsVoicePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTtsVoicePicker(false)}
      >
        <View style={styles.modelPickerOverlay}>
          <View style={styles.modelPickerContainer}>
            <View style={styles.modelPickerHeader}>
              <Text style={styles.modelPickerTitle}>Select TTS Voice</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTtsVoicePicker(false)}
                accessibilityRole="button"
                accessibilityLabel="Close TTS voice picker"
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modelList}>
              {(() => {
                const ttsModel = remoteTtsProviderId === 'groq' ? remoteSettings?.groqTtsModel : undefined;
                const voices = getTtsVoicesForProvider(remoteTtsProviderId, ttsModel);
                return voices.map((voice) => {
                  const currentValue = getRemoteTtsVoiceValue(remoteSettings);
                  const isSelected = String(currentValue) === String(voice.value);
                  return (
                    <TouchableOpacity
                      key={voice.value}
                      style={[
                        styles.modelItem,
                        isSelected && styles.modelItemActive,
                      ]}
                      onPress={() => {
                        const key = getTtsVoiceSettingKey(remoteTtsProviderId);
                        if (key) {
                          handleRemoteSettingUpdate(key, normalizeTtsVoiceUpdateValue(key, voice.value));
                        }
                        setShowTtsVoicePicker(false);
                      }}
                    >
                      <View style={styles.modelItemContent}>
                        <Text style={[
                          styles.modelItemName,
                          isSelected && styles.modelItemNameActive,
                        ]}>
                          {voice.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <Text style={styles.modelItemCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>

            <View style={styles.modelPickerFooter}>
              <Text style={styles.modelPickerFooterText}>
                {(() => {
                  const ttsModel = remoteTtsProviderId === 'groq' ? remoteSettings?.groqTtsModel : undefined;
                  const count = getTtsVoicesForProvider(remoteTtsProviderId, ttsModel).length;
                  return `${count} voice${count !== 1 ? 's' : ''} available`;
                })()}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Import Modal */}
      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowImportModal(false);
          setImportJsonText('');
        }}
      >
        <View style={styles.importModalOverlay}>
          <View style={styles.importModalContainer}>
            <View style={styles.importModalHeader}>
              <Text style={styles.importModalTitle}>Import Profile</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowImportModal(false);
                  setImportJsonText('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Close import profile modal"
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.importModalDescription}>
              Paste the profile JSON below to import it.
            </Text>

            <TextInput
              style={styles.importJsonInput}
              value={importJsonText}
              onChangeText={setImportJsonText}
              placeholder='{"name": "My Profile", ...}'
              placeholderTextColor={theme.colors.mutedForeground}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
            />

            <View style={styles.importModalActions}>
              <TouchableOpacity
                style={styles.importModalCancelButton}
                onPress={() => {
                  setShowImportModal(false);
                  setImportJsonText('');
                }}
              >
                <Text style={styles.importModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.importModalImportButton,
                  (!importJsonText.trim() || isImportingProfile) && styles.importModalImportButtonDisabled,
                ]}
                onPress={handleImportProfile}
                disabled={!importJsonText.trim() || isImportingProfile}
              >
                <Text style={styles.importModalImportText}>
                  {isImportingProfile ? 'Importing...' : 'Import'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    // Connection card styles
    connectionCard: {
      backgroundColor: theme.colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    connectionCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    connectionCardLeft: {
      flex: 1,
      minWidth: 0,
    },
    connectionStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    connectionCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.foreground,
      flexShrink: 1,
    },
    connectionCardUrl: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: spacing.xs,
      lineHeight: 16,
    },
    connectionCardChevron: {
      fontSize: 24,
      color: theme.colors.mutedForeground,
      marginLeft: spacing.sm,
      flexShrink: 0,
    },
    sectionTitle: {
      ...theme.typography.label,
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
      fontSize: 12,
      letterSpacing: 0.5,
      color: theme.colors.mutedForeground,
    },
    label: {
      ...theme.typography.label,
      marginTop: spacing.sm,
      flexShrink: 1,
    },
    helperText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: -spacing.xs,
    },
    input: {
      ...theme.input,
    },
    knowledgeNoteSearchInput: {
      marginTop: 0,
      marginBottom: spacing.sm,
    },
    knowledgeFilterGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    knowledgeFilterButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      minHeight: 32,
      justifyContent: 'center',
    },
    knowledgeFilterButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    knowledgeFilterButtonText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.foreground,
    },
    knowledgeFilterButtonTextActive: {
      color: theme.colors.primaryForeground,
    },
    inputDisabled: {
      opacity: 0.65,
      backgroundColor: theme.colors.muted,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    rowCopy: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    sectionLeadRow: {
      marginTop: spacing.lg,
    },
    themeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    themeOption: {
      flexBasis: 76,
      flexGrow: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 76,
      minHeight: 44,
    },
    themeOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    themeOptionText: {
      fontSize: 13,
      lineHeight: 16,
      color: theme.colors.foreground,
      textAlign: 'center',
    },
    themeOptionTextActive: {
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
    providerSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    providerOption: {
      minWidth: 70,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
    },
    providerOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    providerOptionText: {
      fontSize: 14,
      color: theme.colors.foreground,
    },
    providerOptionTextActive: {
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
    providerCredentialGroup: {
      gap: spacing.xs,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      padding: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: theme.colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
    dangerActionButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.destructive,
      backgroundColor: theme.colors.destructive + '10',
    },
    dangerActionButtonDisabled: {
      opacity: 0.5,
    },
    dangerActionButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.destructive,
      textAlign: 'center',
    },
    dangerActionButtonTextDisabled: {
      color: theme.colors.mutedForeground,
    },
    saveBar: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -2 },
      elevation: 8,
    },
    saveBarButton: {
      marginTop: 0,
    },
    saveBarHint: {
      marginTop: spacing.xs,
      color: theme.colors.mutedForeground,
      fontSize: 12,
      textAlign: 'center',
    },
    // Remote settings styles
    subsectionTitle: {
      ...theme.typography.label,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    loadingText: {
      color: theme.colors.mutedForeground,
      fontSize: 14,
    },
    warningContainer: {
      backgroundColor: '#f59e0b20', // amber-500 with opacity
      borderWidth: 1,
      borderColor: '#f59e0b', // amber-500
      borderRadius: radius.md,
      padding: spacing.md,
      width: '100%' as const,
      gap: spacing.md,
      alignItems: 'stretch',
    },
    warningContent: {
      gap: spacing.xs,
    },
    warningTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#92400e', // amber-800
    },
    warningText: {
      color: '#d97706', // amber-600
      fontSize: 14,
      lineHeight: 20,
      alignSelf: 'stretch',
    },
    warningDetailText: {
      color: '#92400e', // amber-800
      fontSize: 14,
      lineHeight: 20,
    },
    warningRetryButton: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.md,
        verticalPadding: spacing.sm,
        horizontalMargin: 0,
      }),
      width: '100%' as const,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: '#f59e0b',
      backgroundColor: theme.colors.background,
    },
    warningRetryButtonText: {
      color: theme.colors.primary,
      textAlign: 'center',
      fontWeight: '600',
      fontSize: 14,
    },
    profileList: {
      gap: spacing.xs,
    },
    profileItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    profileItemActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    profileName: {
      fontSize: 14,
      color: theme.colors.foreground,
      flex: 1,
      flexShrink: 1,
      lineHeight: 18,
    },
    profileNameActive: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    checkmark: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
      flexShrink: 0,
      marginTop: 1,
    },
    profileActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    profileActionButton: {
      flexBasis: 132,
      flexGrow: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      minWidth: 132,
    },
    profileActionButtonDisabled: {
      opacity: 0.5,
    },
    profileActionButtonText: {
      fontSize: 14,
      color: theme.colors.foreground,
      fontWeight: '500',
      textAlign: 'center',
    },
    localSpeechModelBlock: {
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    localSpeechModelButton: {
      flexBasis: 104,
      minWidth: 104,
      flexGrow: 0,
      marginTop: spacing.sm,
    },
    localSpeechTestButton: {
      alignSelf: 'stretch',
      minWidth: 0,
      marginTop: 0,
      width: '100%' as const,
    },
    localSpeechProgressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.muted,
      overflow: 'hidden',
    },
    localSpeechProgressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
    },
    importModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    importModalContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: radius.lg,
      padding: spacing.lg,
      width: '100%',
      maxWidth: 400,
    },
    presetEditorContainer: {
      maxHeight: '82%',
    },
    presetEditorBody: {
      maxHeight: 460,
    },
    importModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    importModalTitle: {
      flex: 1,
      flexShrink: 1,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.foreground,
      paddingRight: spacing.xs,
    },
    importModalDescription: {
      fontSize: 14,
      color: theme.colors.mutedForeground,
      marginBottom: spacing.md,
    },
    importJsonInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 14,
      color: theme.colors.foreground,
      backgroundColor: theme.colors.muted,
      minHeight: 150,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    bundleImportBody: {
      maxHeight: 520,
    },
    bundlePreviewCard: {
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.muted,
    },
    importModalActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    presetDeleteButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    importModalCancelButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    importModalCancelText: {
      fontSize: 14,
      color: theme.colors.foreground,
      fontWeight: '500',
    },
    importModalImportButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    importModalImportButtonDisabled: {
      opacity: 0.5,
    },
    importModalImportText: {
      fontSize: 14,
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
    serverRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    serverInfo: {
      flex: 1,
      minWidth: 0,
    },
    serverNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    serverName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.foreground,
      flexShrink: 1,
      lineHeight: 18,
    },
    serverMeta: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: 2,
      lineHeight: 16,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      flexShrink: 0,
      marginTop: 4,
    },
    statusConnected: {
      backgroundColor: '#22c55e', // green-500
    },
    statusDisconnected: {
      backgroundColor: theme.colors.muted,
    },
    // Agent management styles
    agentInfoPressable: {
      flex: 1,
      minWidth: 0,
    },
    agentListContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      minWidth: 0,
    },
    agentListAvatar: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    },
    agentListAvatarImage: {
      width: '100%',
      height: '100%',
    },
    agentListAvatarInitial: {
      color: theme.colors.foreground,
      fontSize: 14,
      fontWeight: '700',
    },
    agentActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    agentSecondaryButton: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.sm,
        verticalPadding: spacing.xs,
        horizontalMargin: 0,
      }),
    },
    agentSecondaryButtonText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '500',
    },
    agentActionButtonDisabled: {
      opacity: 0.5,
    },
    agentDeleteButton: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.sm,
        verticalPadding: spacing.xs,
        horizontalMargin: 0,
      }),
    },
    agentDeleteButtonText: {
      color: theme.colors.destructive,
      fontSize: 12,
      fontWeight: '500',
    },
    noteDeleteButton: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.sm,
        verticalPadding: spacing.xs,
        horizontalMargin: 0,
      }),
      alignSelf: 'flex-start',
    },
    noteSelectButton: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.sm,
        verticalPadding: spacing.xs,
        horizontalMargin: 0,
      }),
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignSelf: 'flex-start',
    },
    noteSelectButtonSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    noteSelectButtonText: {
      color: theme.colors.foreground,
      fontSize: 12,
      fontWeight: '500',
    },
    noteSelectButtonTextSelected: {
      color: theme.colors.primaryForeground,
    },
    noteActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    notePromoteButton: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.sm,
        verticalPadding: spacing.xs,
        horizontalMargin: 0,
      }),
      alignSelf: 'flex-start',
    },
    notePromoteButtonText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '500',
    },
    noteDeleteButtonText: {
      color: theme.colors.destructive,
      fontSize: 12,
      fontWeight: '500',
    },
    loopRuntimeMeta: {
      fontSize: 12,
      color: theme.colors.foreground,
      marginTop: spacing.xs,
      lineHeight: 16,
      fontWeight: '500',
    },
    loopActions: {
      width: '100%' as const,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    loopActionButton: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.md,
        verticalPadding: spacing.sm,
        horizontalMargin: 0,
      }),
      minWidth: 92,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    loopActionButtonDanger: {
      borderColor: theme.colors.destructive,
      backgroundColor: theme.colors.destructive + '10',
    },
    loopActionButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
      textAlign: 'center',
    },
    loopActionButtonTextDanger: {
      color: theme.colors.destructive,
    },
    createAgentButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
      alignItems: 'center',
    },
    createAgentButtonText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    sectionActionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    sectionActionButton: {
      flex: 1,
      minWidth: 150,
      marginTop: 0,
    },
    sectionDangerButton: {
      borderColor: theme.colors.destructive,
    },
    sectionDangerButtonText: {
      color: theme.colors.destructive,
    },
    // Model picker styles
    modelLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    modelActions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    modelActionButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    modelActionButtonDisabled: {
      opacity: 0.5,
    },
    modelActionText: {
      fontSize: 12,
      color: theme.colors.primary,
    },
    endpointPanel: {
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    endpointMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    endpointBaseUrl: {
      flex: 1,
      minWidth: 0,
      color: theme.colors.mutedForeground,
      fontSize: 12,
      lineHeight: 16,
    },
    endpointKeyBadge: {
      flexShrink: 0,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      color: theme.colors.mutedForeground,
      fontSize: 11,
      fontWeight: '600',
    },
    endpointKeyBadgeActive: {
      borderColor: theme.colors.primary,
      color: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    modelSelector: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      backgroundColor: theme.colors.background,
      padding: spacing.md,
    },
    modelSelectorContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    modelSelectorText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.foreground,
    },
    modelSelectorPlaceholder: {
      color: theme.colors.mutedForeground,
    },
    modelSelectorChevron: {
      fontSize: 10,
      color: theme.colors.mutedForeground,
    },
    // Model Picker Modal styles
    modelPickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modelPickerContainer: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '80%',
    },
    modelPickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modelPickerTitle: {
      flex: 1,
      flexShrink: 1,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.foreground,
      paddingRight: spacing.xs,
    },
    modalCloseButton: {
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    modalCloseText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
    },
    modelSearchContainer: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modelSearchInput: {
      ...theme.input,
      marginTop: 0,
    },
    modelList: {
      maxHeight: 400,
    },
    modelListEmpty: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    modelListEmptyText: {
      color: theme.colors.mutedForeground,
      fontSize: 14,
    },
    modelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modelItemActive: {
      backgroundColor: theme.colors.primary + '10',
    },
    modelItemContent: {
      flex: 1,
    },
    modelItemName: {
      fontSize: 14,
      color: theme.colors.foreground,
    },
    modelItemNameActive: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    modelItemId: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    modelItemCheck: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginLeft: spacing.sm,
    },
    modelPickerFooter: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      alignItems: 'center',
    },
    modelPickerFooterText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
    },
    // Collapsible section styles
    collapsibleSection: {
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      backgroundColor: theme.colors.card,
      overflow: 'hidden',
    },
    collapsibleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: theme.colors.muted,
    },
    collapsibleTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    collapsibleChevron: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
    },
    collapsibleContent: {
      padding: spacing.md,
      paddingTop: spacing.sm,
    },
  });
}
