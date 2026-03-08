import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, ScrollView, Modal, TouchableOpacity, Platform, Pressable, ActivityIndicator, RefreshControl, Share, Alert, LayoutAnimation, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppConfig, saveConfig, useConfigContext } from '../store/config';
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
import { ExtendedSettingsApiClient, Profile, MCPServer, Settings, ModelInfo, SettingsUpdate, Skill, Memory, AgentProfile, Loop } from '../lib/settingsApi';
import { getAcpMainAgentOptions } from '../lib/mainAgentOptions';
import { TTSSettings } from '../ui/TTSSettings';
import Slider from '@react-native-community/slider';

// STT Provider Options
const STT_PROVIDERS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Groq', value: 'groq' },
  { label: 'Parakeet (Local)', value: 'parakeet' },
] as const;

// Chat/Agent Provider Options (for Agent/MCP Tools and Transcript Post-Processing)
const CHAT_PROVIDERS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Groq', value: 'groq' },
  { label: 'Gemini', value: 'gemini' },
] as const;

// TTS Provider Options
const TTS_PROVIDERS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Groq', value: 'groq' },
  { label: 'Gemini', value: 'gemini' },
  { label: 'Kitten', value: 'kitten' },
  { label: 'Supertonic', value: 'supertonic' },
] as const;

// OpenAI TTS Voice Options
const OPENAI_TTS_VOICES = [
  { label: 'Alloy', value: 'alloy' },
  { label: 'Echo', value: 'echo' },
  { label: 'Fable', value: 'fable' },
  { label: 'Onyx', value: 'onyx' },
  { label: 'Nova', value: 'nova' },
  { label: 'Shimmer', value: 'shimmer' },
] as const;

const OPENAI_TTS_MODELS = [
  { label: 'TTS-1 (Standard)', value: 'tts-1' },
  { label: 'TTS-1-HD (High Quality)', value: 'tts-1-hd' },
] as const;

// Groq TTS Voice Options (English) - Orpheus model voices
const GROQ_TTS_VOICES_ENGLISH = [
  { label: 'Autumn', value: 'autumn' },
  { label: 'Diana', value: 'diana' },
  { label: 'Hannah', value: 'hannah' },
  { label: 'Austin', value: 'austin' },
  { label: 'Daniel', value: 'daniel' },
  { label: 'Troy', value: 'troy' },
] as const;

// Groq TTS Voice Options (Arabic Saudi) - Orpheus model voices
const GROQ_TTS_VOICES_ARABIC = [
  { label: 'Fahad', value: 'fahad' },
  { label: 'Sultan', value: 'sultan' },
  { label: 'Lulwa', value: 'lulwa' },
  { label: 'Noura', value: 'noura' },
] as const;

const GROQ_TTS_MODELS = [
  { label: 'Orpheus TTS (English)', value: 'canopylabs/orpheus-v1-english' },
  { label: 'Orpheus TTS (Arabic Saudi)', value: 'canopylabs/orpheus-arabic-saudi' },
] as const;

// Gemini TTS Voice Options (30 voices)
const GEMINI_TTS_VOICES = [
  { label: 'Zephyr (Bright)', value: 'Zephyr' },
  { label: 'Puck (Upbeat)', value: 'Puck' },
  { label: 'Charon (Informative)', value: 'Charon' },
  { label: 'Kore (Firm)', value: 'Kore' },
  { label: 'Fenrir (Excitable)', value: 'Fenrir' },
  { label: 'Leda (Young)', value: 'Leda' },
  { label: 'Orus (Corporate)', value: 'Orus' },
  { label: 'Aoede (Breezy)', value: 'Aoede' },
  { label: 'Callirrhoe (Casual)', value: 'Callirrhoe' },
  { label: 'Autonoe (Bright)', value: 'Autonoe' },
  { label: 'Enceladus (Breathy)', value: 'Enceladus' },
  { label: 'Iapetus (Clear)', value: 'Iapetus' },
  { label: 'Umbriel (Calm)', value: 'Umbriel' },
  { label: 'Algieba (Smooth)', value: 'Algieba' },
  { label: 'Despina (Smooth)', value: 'Despina' },
  { label: 'Erinome (Serene)', value: 'Erinome' },
  { label: 'Algenib (Gravelly)', value: 'Algenib' },
  { label: 'Rasalgethi (Informative)', value: 'Rasalgethi' },
  { label: 'Laomedeia (Upbeat)', value: 'Laomedeia' },
  { label: 'Achernar (Soft)', value: 'Achernar' },
  { label: 'Alnilam (Firm)', value: 'Alnilam' },
  { label: 'Schedar (Even)', value: 'Schedar' },
  { label: 'Gacrux (Mature)', value: 'Gacrux' },
  { label: 'Pulcherrima (Forward)', value: 'Pulcherrima' },
  { label: 'Achird (Friendly)', value: 'Achird' },
  { label: 'Zubenelgenubi (Casual)', value: 'Zubenelgenubi' },
  { label: 'Vindemiatrix (Gentle)', value: 'Vindemiatrix' },
  { label: 'Sadachbia (Lively)', value: 'Sadachbia' },
  { label: 'Sadaltager (Knowledgeable)', value: 'Sadaltager' },
  { label: 'Sulafat (Warm)', value: 'Sulafat' },
] as const;

const GEMINI_TTS_MODELS = [
  { label: 'Gemini 2.5 Flash TTS', value: 'gemini-2.5-flash-preview-tts' },
  { label: 'Gemini 2.5 Pro TTS', value: 'gemini-2.5-pro-preview-tts' },
] as const;

// Helper to get TTS voices for a provider
const getTtsVoicesForProvider = (providerId: string, ttsModel?: string): readonly { label: string; value: string }[] => {
  switch (providerId) {
    case 'openai':
      return OPENAI_TTS_VOICES;
    case 'groq':
      // Groq voices depend on the selected model (English vs Arabic)
      return ttsModel === 'canopylabs/orpheus-arabic-saudi' ? GROQ_TTS_VOICES_ARABIC : GROQ_TTS_VOICES_ENGLISH;
    case 'gemini':
      return GEMINI_TTS_VOICES;
    default:
      return [];
  }
};

// Helper to get TTS models for a provider
const getTtsModelsForProvider = (providerId: string): readonly { label: string; value: string }[] => {
  switch (providerId) {
    case 'openai':
      return OPENAI_TTS_MODELS;
    case 'groq':
      return GROQ_TTS_MODELS;
    case 'gemini':
      return GEMINI_TTS_MODELS;
    default:
      return [];
  }
};

function formatLoopIntervalLabel(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 1) return 'Every minute';
  if (minutes === 1) return 'Every minute';
  if (minutes === 60) return 'Hourly';
  if (minutes === 1440) return 'Daily';
  if (minutes === 10080) return 'Weekly';
  if (minutes < 60) return `Every ${minutes} min`;

  if (minutes < 1440 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `Every ${hours} hr`;
  }

  if (minutes < 10080 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `Every ${days} day${days === 1 ? '' : 's'}`;
  }

  if (minutes % 10080 === 0) {
    const weeks = minutes / 10080;
    return `Every ${weeks} week${weeks === 1 ? '' : 's'}`;
  }

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;
  const parts = [
    days > 0 ? `${days}d` : null,
    hours > 0 ? `${hours}h` : null,
    remainingMinutes > 0 ? `${remainingMinutes}m` : null,
  ].filter(Boolean);

  return `Every ${parts.join(' ')}`;
}

function formatLoopLastRunLabel(timestamp: number): string {
  return `Last ${new Date(timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: '☀️ Light', value: 'light' },
  { label: '🌙 Dark', value: 'dark' },
  { label: '⚙️ System', value: 'system' },
];

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { config, setConfig, ready } = useConfigContext();
  const [draft, setDraft] = useState<AppConfig>(config);
  const { setCurrentProfile: setProfileContext } = useProfile();

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
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Track if the server is a DotAgents desktop server (supports our settings API)
  const [isDotAgentsServer, setIsDotAgentsServer] = useState(false);

  // Skills, Memories, Agents, and Loops state
  const [skills, setSkills] = useState<Skill[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [agentProfiles, setAgentProfiles] = useState<AgentProfile[]>([]);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [isLoadingAgentProfiles, setIsLoadingAgentProfiles] = useState(false);
  const [isLoadingLoops, setIsLoadingLoops] = useState(false);
  const availableAcpMainAgents = useMemo(
    () => getAcpMainAgentOptions(remoteSettings, agentProfiles),
    [remoteSettings, agentProfiles]
  );

  // Profile import/export state
  const [isExportingProfile, setIsExportingProfile] = useState(false);
  const [isImportingProfile, setIsImportingProfile] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Model picker state
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [useCustomModel, setUseCustomModel] = useState(false);

  // Preset picker state
  const [showPresetPicker, setShowPresetPicker] = useState(false);

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
    mcpServers: true,    // Keep MCP servers expanded by default since it was already visible
    streamerMode: false,
    speechToText: false,
    textToSpeech: false,
    agentSettings: false,
    summarization: false,
    toolExecution: false,
    whatsapp: false,
    langfuse: false,
    skills: false,
    memories: false,
    agents: false,
    agentLoops: false,
  });

  // Debounced input state for string/number fields
  const [inputDrafts, setInputDrafts] = useState<Record<string, string>>({});
  const inputTimeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const styles = useMemo(() => createStyles(theme), [theme]);

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
      setIsDotAgentsServer(false);
      return;
    }

    setIsLoadingRemote(true);
    setRemoteError(null);

    try {
      const errors: string[] = [];
      let successCount = 0;

      const [profilesRes, serversRes, settingsRes] = await Promise.all([
        settingsClient.getProfiles().catch((e) => { errors.push('profiles'); return null; }),
        settingsClient.getMCPServers().catch((e) => { errors.push('MCP servers'); return null; }),
        settingsClient.getSettings().catch((e) => { errors.push('settings'); return null; }),
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
        setInputDrafts({
          sttLanguage: settingsRes.sttLanguage || '',
          transcriptPostProcessingPrompt: settingsRes.transcriptPostProcessingPrompt || '',
          mcpMaxIterations: String(settingsRes.mcpMaxIterations ?? 10),
          whatsappAllowFrom: (settingsRes.whatsappAllowFrom || []).join(', '),
          langfusePublicKey: settingsRes.langfusePublicKey || '',
          langfuseSecretKey: settingsRes.langfuseSecretKey === '••••••••' ? '' : (settingsRes.langfuseSecretKey || ''),
          langfuseBaseUrl: settingsRes.langfuseBaseUrl || '',
        });
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

  // Fetch memories from desktop
  const fetchMemories = useCallback(async () => {
    if (!settingsClient) return;
    setIsLoadingMemories(true);
    try {
      const res = await settingsClient.getMemories();
      setMemories(res.memories);
    } catch (error: any) {
      console.error('[Settings] Failed to fetch memories:', error);
    } finally {
      setIsLoadingMemories(false);
    }
  }, [settingsClient]);

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
      fetchMemories();
      fetchAgentProfiles();
      fetchLoops();
    }
  }, [settingsClient, isDotAgentsServer, fetchSkills, fetchMemories, fetchAgentProfiles, fetchLoops]);

  // Refresh key remote data when returning from nested screens (e.g. agent editor)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!settingsClient) return;
      fetchRemoteSettings();
      if (isDotAgentsServer) {
        fetchAgentProfiles();
        fetchMemories();
        fetchLoops();
      }
    });
    return unsubscribe;
  }, [navigation, settingsClient, isDotAgentsServer, fetchRemoteSettings, fetchAgentProfiles, fetchMemories, fetchLoops]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const fetches: Promise<void>[] = [fetchRemoteSettings()];
    if (isDotAgentsServer) {
      fetches.push(fetchSkills(), fetchMemories(), fetchAgentProfiles(), fetchLoops());
    }
    await Promise.all(fetches);
    setIsRefreshing(false);
  }, [isDotAgentsServer, fetchRemoteSettings, fetchSkills, fetchMemories, fetchAgentProfiles, fetchLoops]);

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

    // Cancel any pending update for this key
    if (inputTimeoutRefs.current[key]) {
      clearTimeout(inputTimeoutRefs.current[key]);
    }

    // Debounce the actual API call by 1000ms
    inputTimeoutRefs.current[key] = setTimeout(async () => {
      if (!settingsClient) return;

      try {
        await settingsClient.updateSettings({ [key]: value });
      } catch (error: any) {
        console.error(`[Settings] Failed to update ${key}:`, error);
        setRemoteError(error.message || `Failed to update ${key}`);
        // Refresh to get actual state
        fetchRemoteSettings();
      }
    }, 1000);
  }, [settingsClient, fetchRemoteSettings]);

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

  const confirmDestructiveAction = useCallback(
    (title: string, message: string, onConfirm: () => Promise<void> | void) => {
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
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void onConfirm();
          },
        },
      ]);
    },
    []
  );

  // Handle memory delete
  const handleMemoryDelete = async (memoryId: string) => {
    if (!settingsClient) return;
    confirmDestructiveAction('Delete Memory', 'Are you sure you want to delete this memory?', async () => {
      try {
        await settingsClient.deleteMemory(memoryId);
        setMemories(prev => prev.filter(m => m.id !== memoryId));
      } catch (error: any) {
        console.error('[Settings] Failed to delete memory:', error);
        Alert.alert('Error', 'Failed to delete memory');
      }
    });
  };

  // Navigate to memory edit screen
  const handleMemoryEdit = useCallback((memory?: Memory) => {
    navigation.navigate('MemoryEdit', {
      memoryId: memory?.id,
      memory,
    });
  }, [navigation]);

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

  const renderInlineEditAffordance = useCallback(() => (
    <View style={styles.editAffordance} pointerEvents="none">
      <Text style={styles.editAffordanceText}>Edit</Text>
      <Text style={styles.editAffordanceChevron}>›</Text>
    </View>
  ), [styles]);

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
  const fetchModels = useCallback(async (providerId: 'openai' | 'groq' | 'gemini') => {
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

  // Fetch models when remote settings load or provider changes
  useEffect(() => {
    if (remoteSettings?.mcpToolsProviderId && settingsClient) {
      fetchModels(remoteSettings.mcpToolsProviderId);
    }
  }, [remoteSettings?.mcpToolsProviderId, settingsClient, fetchModels]);

  // Handle provider change
  const handleProviderChange = async (provider: 'openai' | 'groq' | 'gemini') => {
    if (!settingsClient || !remoteSettings || remoteSettings.mcpToolsProviderId === provider) return;

    // Cancel any pending model update to avoid writing to the wrong provider's model key
    if (modelUpdateTimeoutRef.current) {
      clearTimeout(modelUpdateTimeoutRef.current);
      modelUpdateTimeoutRef.current = null;
    }

    try {
      await settingsClient.updateSettings({ mcpToolsProviderId: provider });
      setRemoteSettings(prev => prev ? { ...prev, mcpToolsProviderId: provider } : null);
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
      setRemoteSettings(prev => prev ? { ...prev, currentModelPresetId: presetId } : null);
      // Reset models and fetch new ones for the new preset
      setAvailableModels([]);
      setUseCustomModel(false);
      // Fetch models for the new preset
      if (remoteSettings.mcpToolsProviderId === 'openai') {
        fetchModels('openai');
      }
    } catch (error: any) {
      console.error('[Settings] Failed to change preset:', error);
      setRemoteError(error.message || 'Failed to change preset');
    }
  };

  // Get current preset display name
  const getCurrentPresetName = () => {
    if (!remoteSettings?.availablePresets || !remoteSettings.currentModelPresetId) return 'OpenAI';
    const preset = remoteSettings.availablePresets.find(p => p.id === remoteSettings.currentModelPresetId);
    return preset?.name || 'OpenAI';
  };

  // Handle model name change with debouncing to avoid request storms per keystroke
  const handleModelNameChange = useCallback((modelName: string) => {
    // Update draft state immediately for responsive UI
    setCustomModelDraft(modelName);

    // Cancel any pending update
    if (modelUpdateTimeoutRef.current) {
      clearTimeout(modelUpdateTimeoutRef.current);
    }

    // Debounce the actual API call by 500ms
    modelUpdateTimeoutRef.current = setTimeout(async () => {
      if (!settingsClient || !remoteSettings) return;

      const provider = remoteSettings.mcpToolsProviderId;
      const modelKey = provider === 'openai' ? 'mcpToolsOpenaiModel'
        : provider === 'groq' ? 'mcpToolsGroqModel'
        : 'mcpToolsGeminiModel';

      // Update local state
      setRemoteSettings(prev => prev ? { ...prev, [modelKey]: modelName } : null);

      try {
        await settingsClient.updateSettings({ [modelKey]: modelName });
      } catch (error: any) {
        console.error('[Settings] Failed to update model:', error);
        setRemoteError(error.message || 'Failed to update model');
        // Refresh to get actual state
        fetchRemoteSettings();
      }
    }, 500);
  }, [settingsClient, remoteSettings, fetchRemoteSettings]);

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
  }, [remoteSettings?.mcpToolsProviderId, remoteSettings?.mcpToolsOpenaiModel, remoteSettings?.mcpToolsGroqModel, remoteSettings?.mcpToolsGeminiModel]);

  // Get current model value based on provider
  const getCurrentModelValue = () => {
    if (!remoteSettings) return '';
    const provider = remoteSettings.mcpToolsProviderId;
    if (provider === 'openai') return remoteSettings.mcpToolsOpenaiModel || '';
    if (provider === 'groq') return remoteSettings.mcpToolsGroqModel || '';
    return remoteSettings.mcpToolsGeminiModel || '';
  };

  // Get placeholder based on provider
  const getModelPlaceholder = () => {
    if (!remoteSettings) return '';
    const provider = remoteSettings.mcpToolsProviderId;
    if (provider === 'openai') return 'gpt-4o-mini';
    if (provider === 'groq') return 'llama-3.3-70b-versatile';
    return 'gemini-1.5-flash-002';
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
    if (!modelSearchQuery.trim()) return availableModels;
    const query = modelSearchQuery.toLowerCase();
    return availableModels.filter(
      m => m.id.toLowerCase().includes(query) || m.name.toLowerCase().includes(query)
    );
  }, [availableModels, modelSearchQuery]);

  useEffect(() => {
    setDraft(config);
  }, [ready, config]);


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

  const renderActionRailSwitchVisual = (enabled: boolean) => {
    if (Platform.OS === 'web') {
      return (
        <View
          style={[
            styles.actionRailSwitchTrack,
            enabled && styles.actionRailSwitchTrackActive,
          ]}
          accessible={false}
        >
          <View
            style={[
              styles.actionRailSwitchThumb,
              enabled && styles.actionRailSwitchThumbActive,
            ]}
            accessible={false}
          />
        </View>
      );
    }

    return (
      <Switch
        accessible={false}
        value={enabled}
        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
        thumbColor={enabled ? theme.colors.primaryForeground : theme.colors.background}
      />
    );
  };

  if (!ready) return null;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <Text style={styles.h1}>Settings</Text>

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

        {/* Go to Chats button */}
        <TouchableOpacity
          style={[styles.primaryButton, !(config.baseUrl && config.apiKey) && styles.primaryButtonDisabled]}
          onPress={() => navigation.navigate('Sessions')}
          disabled={!(config.baseUrl && config.apiKey)}
          accessibilityRole="button"
          accessibilityLabel="Go to Chats"
        >
          <Text style={styles.primaryButtonText}>Go to Chats</Text>
        </TouchableOpacity>

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
            onValueChange={(v) => setDraft({ ...draft, handsFree: v })}
            accessibilityLabel={createSwitchAccessibilityLabel('Hands-free Voice Mode')}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
            thumbColor={draft.handsFree ? theme.colors.primaryForeground : theme.colors.background}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Text-to-Speech</Text>
          <Switch
            value={draft.ttsEnabled !== false}
            onValueChange={(v) => setDraft({ ...draft, ttsEnabled: v })}
            accessibilityLabel={createSwitchAccessibilityLabel('Text-to-Speech')}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
            thumbColor={draft.ttsEnabled !== false ? theme.colors.primaryForeground : theme.colors.background}
          />
        </View>

        {/* TTS Voice Settings - shown when TTS is enabled */}
        {draft.ttsEnabled !== false && (
          <TTSSettings
            voiceId={draft.ttsVoiceId}
            rate={draft.ttsRate ?? 1.0}
            pitch={draft.ttsPitch ?? 1.0}
            onVoiceChange={(v) => setDraft({ ...draft, ttsVoiceId: v })}
            onRateChange={(r) => setDraft({ ...draft, ttsRate: r })}
            onPitchChange={(p) => setDraft({ ...draft, ttsPitch: p })}
          />
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Message Queuing</Text>
          <Switch
            value={draft.messageQueueEnabled !== false}
            onValueChange={(v) => setDraft({ ...draft, messageQueueEnabled: v })}
            accessibilityLabel={createSwitchAccessibilityLabel('Message Queuing')}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
            thumbColor={draft.messageQueueEnabled !== false ? theme.colors.primaryForeground : theme.colors.background}
          />
        </View>
        <Text style={styles.helperText}>
          Queue messages while the agent is busy processing
        </Text>

        {/* Push Notifications Section */}
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.row}>
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
                <Text style={styles.warningText}>⚠️ {remoteError}</Text>
                <TouchableOpacity onPress={fetchRemoteSettings} accessibilityRole="button" accessibilityLabel="Retry">
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Provider Selection */}
            {remoteSettings && (
              <CollapsibleSection id="providerSelection" title="Provider Selection">
                <Text style={styles.helperText}>
                  Select which AI provider to use for each feature.
                </Text>

                {/* Voice Transcription (STT) Provider */}
                <Text style={styles.label}>🎤 Voice Transcription (STT)</Text>
                <View style={styles.providerSelector}>
                  {STT_PROVIDERS.map((provider) => (
                    <Pressable
                      key={provider.value}
                      style={[
                        styles.providerOption,
                        (remoteSettings.sttProviderId || 'openai') === provider.value && styles.providerOptionActive,
                      ]}
                      onPress={() => handleRemoteSettingUpdate('sttProviderId', provider.value)}
                    >
                      <Text style={[
                        styles.providerOptionText,
                        (remoteSettings.sttProviderId || 'openai') === provider.value && styles.providerOptionTextActive,
                      ]}>
                        {provider.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Transcript Post-Processing Provider */}
                <Text style={[styles.label, { marginTop: spacing.md }]}>📝 Transcript Post-Processing</Text>
                <View style={styles.providerSelector}>
                  {CHAT_PROVIDERS.map((provider) => (
                    <Pressable
                      key={provider.value}
                      style={[
                        styles.providerOption,
                        (remoteSettings.transcriptPostProcessingProviderId || 'openai') === provider.value && styles.providerOptionActive,
                      ]}
                      onPress={() => handleRemoteSettingUpdate('transcriptPostProcessingProviderId', provider.value)}
                    >
                      <Text style={[
                        styles.providerOptionText,
                        (remoteSettings.transcriptPostProcessingProviderId || 'openai') === provider.value && styles.providerOptionTextActive,
                      ]}>
                        {provider.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Agent/MCP Tools Provider */}
                <Text style={[styles.label, { marginTop: spacing.md }]}>🤖 Agent/MCP Tools</Text>
                <View style={styles.providerSelector}>
                  {CHAT_PROVIDERS.map((provider) => (
                    <Pressable
                      key={provider.value}
                      style={[
                        styles.providerOption,
                        (remoteSettings.mcpToolsProviderId || 'openai') === provider.value && styles.providerOptionActive,
                      ]}
                      onPress={() => handleProviderChange(provider.value as 'openai' | 'groq' | 'gemini')}
                    >
                      <Text style={[
                        styles.providerOptionText,
                        (remoteSettings.mcpToolsProviderId || 'openai') === provider.value && styles.providerOptionTextActive,
                      ]}>
                        {provider.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Text-to-Speech (TTS) Provider */}
                <Text style={[styles.label, { marginTop: spacing.md }]}>🔊 Text-to-Speech (TTS)</Text>
                <View style={styles.providerSelector}>
                  {TTS_PROVIDERS.map((provider) => (
                    <Pressable
                      key={provider.value}
                      style={[
                        styles.providerOption,
                        (remoteSettings.ttsProviderId || 'openai') === provider.value && styles.providerOptionActive,
                      ]}
                      onPress={() => handleRemoteSettingUpdate('ttsProviderId', provider.value)}
                    >
                      <Text style={[
                        styles.providerOptionText,
                        (remoteSettings.ttsProviderId || 'openai') === provider.value && styles.providerOptionTextActive,
                      ]}>
                        {provider.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
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
                          {isImportingProfile ? 'Importing...' : '📥 Import'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.profileActionButton, (!currentProfileId || isExportingProfile) && styles.profileActionButtonDisabled]}
                        onPress={handleExportProfile}
                        disabled={!currentProfileId || isExportingProfile}
                      >
                        <Text style={styles.profileActionButtonText}>
                          {isExportingProfile ? 'Exporting...' : '📤 Export'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Model Settings */}
                <Text style={styles.label}>Provider</Text>
                <View style={styles.providerSelector}>
                  {(['openai', 'groq', 'gemini'] as const).map((provider) => (
                    <Pressable
                      key={provider}
                      style={[
                        styles.providerOption,
                        remoteSettings.mcpToolsProviderId === provider && styles.providerOptionActive,
                      ]}
                      onPress={() => handleProviderChange(provider)}
                    >
                      <Text style={[
                        styles.providerOptionText,
                        remoteSettings.mcpToolsProviderId === provider && styles.providerOptionTextActive,
                      ]}>
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {remoteSettings.mcpToolsProviderId === 'openai' && remoteSettings.availablePresets && remoteSettings.availablePresets.length > 0 && (
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
                  </>
                )}

                <View style={styles.modelLabelRow}>
                  <Text style={styles.label}>Model Name</Text>
                  <View style={styles.modelActions}>
                    <TouchableOpacity
                      style={styles.modelActionButton}
                      onPress={() => setUseCustomModel(!useCustomModel)}
                    >
                      <Text style={styles.modelActionText}>
                        {useCustomModel ? '📋 List' : '✏️ Custom'}
                      </Text>
                    </TouchableOpacity>
                    {!useCustomModel && (
                      <TouchableOpacity
                        style={styles.modelActionButton}
                        onPress={() => remoteSettings?.mcpToolsProviderId && fetchModels(remoteSettings.mcpToolsProviderId)}
                        disabled={isLoadingModels}
                      >
                        <Text style={styles.modelActionText}>
                          {isLoadingModels ? '⏳' : '🔄'}
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

                <View style={styles.row}>
                  <Text style={styles.label}>Transcription Preview</Text>
                  <Switch
                    value={remoteSettings.transcriptionPreviewEnabled ?? true}
                    onValueChange={(v) => handleRemoteSettingToggle('transcriptionPreviewEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={remoteSettings.transcriptionPreviewEnabled ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Show live transcription while recording
                </Text>

                <View style={styles.row}>
                  <Text style={styles.label}>Post-Processing</Text>
                  <Switch
                    value={remoteSettings.transcriptPostProcessingEnabled ?? false}
                    onValueChange={(v) => handleRemoteSettingToggle('transcriptPostProcessingEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={remoteSettings.transcriptPostProcessingEnabled ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Clean up transcripts before sending to LLM
                </Text>

                {remoteSettings.transcriptPostProcessingEnabled && (
                  <>
                    <Text style={styles.label}>Post-Processing Prompt</Text>
                    <TextInput
                      style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                      value={inputDrafts.transcriptPostProcessingPrompt ?? ''}
                      onChangeText={(v) => handleRemoteSettingUpdate('transcriptPostProcessingPrompt', v)}
                      placeholder="Custom instructions for transcript cleanup..."
                      placeholderTextColor={theme.colors.mutedForeground}
                      multiline
                      numberOfLines={3}
                    />
                  </>
                )}
              </CollapsibleSection>
            )}

            {/* 4d. Text-to-Speech */}
            {remoteSettings && (
              <CollapsibleSection id="textToSpeech" title="Text-to-Speech">
                <View style={styles.row}>
                  <Text style={styles.label}>TTS Enabled</Text>
                  <Switch
                    value={remoteSettings.ttsEnabled ?? false}
                    onValueChange={(v) => handleRemoteSettingToggle('ttsEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={remoteSettings.ttsEnabled ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Enable text-to-speech for responses on desktop
                </Text>

                {remoteSettings.ttsEnabled && (
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
                              remoteSettings.ttsProviderId === provider.value && styles.providerOptionActive,
                            ]}
                            onPress={() => handleRemoteSettingUpdate('ttsProviderId', provider.value)}
                          >
                            <Text style={[
                              styles.providerOptionText,
                              remoteSettings.ttsProviderId === provider.value && styles.providerOptionTextActive,
                            ]}>
                              {provider.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Per-provider Voice/Model Settings */}
                    {(remoteSettings.ttsProviderId === 'openai' || remoteSettings.ttsProviderId === 'groq' || remoteSettings.ttsProviderId === 'gemini') && (
                      <>
                        {/* TTS Model Selector */}
                        <Text style={[styles.label, { marginTop: spacing.sm }]}>Model</Text>
                        <TouchableOpacity
                          style={styles.modelSelector}
                          onPress={() => setShowTtsModelPicker(true)}
                        >
                          <View style={styles.modelSelectorContent}>
                            <Text style={styles.modelSelectorText}>
                              {(() => {
                                const models = getTtsModelsForProvider(remoteSettings.ttsProviderId || 'openai');
                                const modelValue = remoteSettings.ttsProviderId === 'openai' ? remoteSettings.openaiTtsModel
                                  : remoteSettings.ttsProviderId === 'groq' ? remoteSettings.groqTtsModel
                                  : remoteSettings.geminiTtsModel;
                                const model = models.find(m => m.value === modelValue);
                                return model?.label || modelValue || 'Select model';
                              })()}
                            </Text>
                            <Text style={styles.modelSelectorChevron}>▼</Text>
                          </View>
                        </TouchableOpacity>

                        {/* TTS Voice Selector */}
                        <Text style={[styles.label, { marginTop: spacing.sm }]}>Voice</Text>
                        <TouchableOpacity
                          style={styles.modelSelector}
                          onPress={() => setShowTtsVoicePicker(true)}
                        >
                          <View style={styles.modelSelectorContent}>
                            <Text style={styles.modelSelectorText}>
                              {(() => {
                                const ttsModel = remoteSettings.ttsProviderId === 'groq' ? remoteSettings.groqTtsModel : undefined;
                                const voices = getTtsVoicesForProvider(remoteSettings.ttsProviderId || 'openai', ttsModel);
                                const voiceValue = remoteSettings.ttsProviderId === 'openai' ? remoteSettings.openaiTtsVoice
                                  : remoteSettings.ttsProviderId === 'groq' ? remoteSettings.groqTtsVoice
                                  : remoteSettings.geminiTtsVoice;
                                const voice = voices.find(v => v.value === voiceValue);
                                return voice?.label || voiceValue || 'Select voice';
                              })()}
                            </Text>
                            <Text style={styles.modelSelectorChevron}>▼</Text>
                          </View>
                        </TouchableOpacity>

                        {/* OpenAI Speed Slider */}
                        {remoteSettings.ttsProviderId === 'openai' && (
                          <View style={{ marginTop: spacing.sm }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={styles.label}>Speed</Text>
                              <Text style={[styles.helperText, { marginTop: 0 }]}>
                                {(remoteSettings.openaiTtsSpeed ?? 1.0).toFixed(1)}x
                              </Text>
                            </View>
                            <Slider
                              style={{ width: '100%', height: 40 }}
                              minimumValue={0.25}
                              maximumValue={4.0}
                              step={0.25}
                              value={remoteSettings.openaiTtsSpeed ?? 1.0}
                              onSlidingComplete={(v) => handleRemoteSettingUpdate('openaiTtsSpeed', v)}
                              minimumTrackTintColor={theme.colors.primary}
                              maximumTrackTintColor={theme.colors.muted}
                              thumbTintColor={theme.colors.primary}
                            />
                          </View>
                        )}
                      </>
                    )}

                    {/* Kitten/Supertonic notice */}
                    {(remoteSettings.ttsProviderId === 'kitten' || remoteSettings.ttsProviderId === 'supertonic') && (
                      <Text style={[styles.helperText, { marginTop: spacing.sm }]}>
                        {remoteSettings.ttsProviderId === 'kitten'
                          ? 'Kitten uses local TTS. Configure voice in desktop settings.'
                          : 'Supertonic uses local TTS. Configure voice in desktop settings.'}
                      </Text>
                    )}

                    <View style={[styles.row, { marginTop: spacing.md }]}>
                      <Text style={styles.label}>Auto-Play</Text>
                      <Switch
                        value={remoteSettings.ttsAutoPlay ?? true}
                        onValueChange={(v) => handleRemoteSettingToggle('ttsAutoPlay', v)}
                        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                        thumbColor={remoteSettings.ttsAutoPlay ? theme.colors.primaryForeground : theme.colors.background}
                      />
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>TTS Preprocessing</Text>
                      <Switch
                        value={remoteSettings.ttsPreprocessingEnabled ?? true}
                        onValueChange={(v) => handleRemoteSettingToggle('ttsPreprocessingEnabled', v)}
                        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                        thumbColor={remoteSettings.ttsPreprocessingEnabled ? theme.colors.primaryForeground : theme.colors.background}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      Clean up text before speaking
                    </Text>

                    {remoteSettings.ttsPreprocessingEnabled && (
                      <>
                        <View style={[styles.row, { paddingLeft: spacing.md }]}>
                          <Text style={styles.label}>Remove Code Blocks</Text>
                          <Switch
                            value={remoteSettings.ttsRemoveCodeBlocks ?? true}
                            onValueChange={(v) => handleRemoteSettingToggle('ttsRemoveCodeBlocks', v)}
                            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                            thumbColor={remoteSettings.ttsRemoveCodeBlocks ? theme.colors.primaryForeground : theme.colors.background}
                          />
                        </View>

                        <View style={[styles.row, { paddingLeft: spacing.md }]}>
                          <Text style={styles.label}>Remove URLs</Text>
                          <Switch
                            value={remoteSettings.ttsRemoveUrls ?? true}
                            onValueChange={(v) => handleRemoteSettingToggle('ttsRemoveUrls', v)}
                            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                            thumbColor={remoteSettings.ttsRemoveUrls ? theme.colors.primaryForeground : theme.colors.background}
                          />
                        </View>

                        <View style={[styles.row, { paddingLeft: spacing.md }]}>
                          <Text style={styles.label}>Convert Markdown</Text>
                          <Switch
                            value={remoteSettings.ttsConvertMarkdown ?? true}
                            onValueChange={(v) => handleRemoteSettingToggle('ttsConvertMarkdown', v)}
                            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                            thumbColor={remoteSettings.ttsConvertMarkdown ? theme.colors.primaryForeground : theme.colors.background}
                          />
                        </View>

                        <View style={[styles.row, { paddingLeft: spacing.md }]}>
                          <Text style={styles.label}>Use LLM Preprocessing</Text>
                          <Switch
                            value={remoteSettings.ttsUseLLMPreprocessing ?? false}
                            onValueChange={(v) => handleRemoteSettingToggle('ttsUseLLMPreprocessing', v)}
                            trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                            thumbColor={remoteSettings.ttsUseLLMPreprocessing ? theme.colors.primaryForeground : theme.colors.background}
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
                  {(['api', 'acp'] as const).map((mode) => (
                    <Pressable
                      key={mode}
                      style={[
                        styles.agentSettingsOption,
                        remoteSettings.mainAgentMode === mode && styles.agentSettingsOptionActive,
                      ]}
                      onPress={() => handleRemoteSettingUpdate('mainAgentMode', mode)}
                      accessibilityRole="button"
                      accessibilityLabel={createButtonAccessibilityLabel(`Use ${mode.toUpperCase()} main agent mode`)}
                      accessibilityHint={
                        mode === 'acp'
                          ? 'Routes new chats through a selected ACP agent as the main agent.'
                          : 'Uses the configured API model directly as the main agent for new chats.'
                      }
                      accessibilityState={{ selected: remoteSettings.mainAgentMode === mode }}
                    >
                      <Text
                        style={[
                          styles.agentSettingsOptionText,
                          remoteSettings.mainAgentMode === mode && styles.agentSettingsOptionTextActive,
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {mode.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.helperText}>
                  API uses external LLMs, ACP routes to an ACP agent
                </Text>

                {/* ACP-specific settings - only show when ACP mode selected */}
                {remoteSettings.mainAgentMode === 'acp' && (
                  <>
                    <Text style={styles.label}>ACP Agent</Text>
                    {availableAcpMainAgents.length > 0 ? (
                      <View style={styles.providerSelector}>
                        {availableAcpMainAgents.map((agent) => (
                          <Pressable
                            key={agent.name}
                            style={[
                              styles.agentSettingsOption,
                              remoteSettings.mainAgentName === agent.name && styles.agentSettingsOptionActive,
                            ]}
                            onPress={() => handleRemoteSettingUpdate('mainAgentName', agent.name)}
                            accessibilityRole="button"
                            accessibilityLabel={createButtonAccessibilityLabel(`Use ${agent.displayName || agent.name} as ACP main agent`)}
                            accessibilityHint="Routes main-agent requests through this ACP agent."
                            accessibilityState={{ selected: remoteSettings.mainAgentName === agent.name }}
                          >
                            <Text
                              style={[
                                styles.agentSettingsOptionText,
                                remoteSettings.mainAgentName === agent.name && styles.agentSettingsOptionTextActive,
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {agent.displayName || agent.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.helperText}>No ACP agents available</Text>
                    )}
                    <Text style={styles.helperText}>
                      Select which ACP agent handles requests
                    </Text>

                    <View style={styles.row}>
                      <Text style={styles.label}>Inject Builtin Tools</Text>
                      <TouchableOpacity
                        style={styles.agentSettingsSwitchButton}
                        onPress={() => handleRemoteSettingToggle('acpInjectBuiltinTools', !(remoteSettings.acpInjectBuiltinTools ?? true))}
                        accessibilityRole="switch"
                        accessibilityLabel={createSwitchAccessibilityLabel('Inject Builtin Tools')}
                        accessibilityHint="Adds DotAgents tools like delegation and settings to ACP sessions."
                        accessibilityState={{ checked: remoteSettings.acpInjectBuiltinTools ?? true }}
                        activeOpacity={0.7}
                      >
                        <View
                          pointerEvents="none"
                          accessibilityElementsHidden
                          importantForAccessibility="no-hide-descendants"
                        >
                          {renderActionRailSwitchVisual(remoteSettings.acpInjectBuiltinTools ?? true)}
                        </View>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.helperText}>
                      Add DotAgents tools (delegation, settings) to ACP sessions
                    </Text>
                  </>
                )}

                <View style={styles.row}>
                  <Text style={styles.label}>Message Queue</Text>
                  <TouchableOpacity
                    style={styles.agentSettingsSwitchButton}
                    onPress={() => handleRemoteSettingToggle('mcpMessageQueueEnabled', !(remoteSettings.mcpMessageQueueEnabled ?? true))}
                    accessibilityRole="switch"
                    accessibilityLabel={createSwitchAccessibilityLabel('Message Queue')}
                    accessibilityHint="Queues incoming messages while the agent is already working on another step."
                    accessibilityState={{ checked: remoteSettings.mcpMessageQueueEnabled ?? true }}
                    activeOpacity={0.7}
                  >
                    <View
                      pointerEvents="none"
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    >
                      {renderActionRailSwitchVisual(remoteSettings.mcpMessageQueueEnabled ?? true)}
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Require Tool Approval</Text>
                  <TouchableOpacity
                    style={styles.agentSettingsSwitchButton}
                    onPress={() => handleRemoteSettingToggle('mcpRequireApprovalBeforeToolCall', !(remoteSettings.mcpRequireApprovalBeforeToolCall ?? false))}
                    accessibilityRole="switch"
                    accessibilityLabel={createSwitchAccessibilityLabel('Require Tool Approval')}
                    accessibilityHint="Requires approval before an agent can execute an MCP tool."
                    accessibilityState={{ checked: remoteSettings.mcpRequireApprovalBeforeToolCall ?? false }}
                    activeOpacity={0.7}
                  >
                    <View
                      pointerEvents="none"
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    >
                      {renderActionRailSwitchVisual(remoteSettings.mcpRequireApprovalBeforeToolCall ?? false)}
                    </View>
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>
                  Require approval before executing MCP tools
                </Text>

                <View style={styles.row}>
                  <Text style={styles.label}>Verify Completion</Text>
                  <TouchableOpacity
                    style={styles.agentSettingsSwitchButton}
                    onPress={() => handleRemoteSettingToggle('mcpVerifyCompletionEnabled', !(remoteSettings.mcpVerifyCompletionEnabled ?? true))}
                    accessibilityRole="switch"
                    accessibilityLabel={createSwitchAccessibilityLabel('Verify Completion')}
                    accessibilityHint="Checks whether the agent actually finished the task before stopping."
                    accessibilityState={{ checked: remoteSettings.mcpVerifyCompletionEnabled ?? true }}
                    activeOpacity={0.7}
                  >
                    <View
                      pointerEvents="none"
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    >
                      {renderActionRailSwitchVisual(remoteSettings.mcpVerifyCompletionEnabled ?? true)}
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Final Summary</Text>
                  <TouchableOpacity
                    style={styles.agentSettingsSwitchButton}
                    onPress={() => handleRemoteSettingToggle('mcpFinalSummaryEnabled', !(remoteSettings.mcpFinalSummaryEnabled ?? false))}
                    accessibilityRole="switch"
                    accessibilityLabel={createSwitchAccessibilityLabel('Final Summary')}
                    accessibilityHint="Generates a summary after the agent finishes the task."
                    accessibilityState={{ checked: remoteSettings.mcpFinalSummaryEnabled ?? false }}
                    activeOpacity={0.7}
                  >
                    <View
                      pointerEvents="none"
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    >
                      {renderActionRailSwitchVisual(remoteSettings.mcpFinalSummaryEnabled ?? false)}
                    </View>
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>
                  Generate a summary after completing a task
                </Text>

                <View style={styles.row}>
                  <Text style={styles.label}>Unlimited Iterations</Text>
                  <TouchableOpacity
                    style={styles.agentSettingsSwitchButton}
                    onPress={() => handleRemoteSettingToggle('mcpUnlimitedIterations', !(remoteSettings.mcpUnlimitedIterations ?? false))}
                    accessibilityRole="switch"
                    accessibilityLabel={createSwitchAccessibilityLabel('Unlimited Iterations')}
                    accessibilityHint="Removes the max-iteration limit so the agent can keep working until it finishes or you stop it."
                    accessibilityState={{ checked: remoteSettings.mcpUnlimitedIterations ?? false }}
                    activeOpacity={0.7}
                  >
                    <View
                      pointerEvents="none"
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    >
                      {renderActionRailSwitchVisual(remoteSettings.mcpUnlimitedIterations ?? false)}
                    </View>
                  </TouchableOpacity>
                </View>
                {remoteSettings.mcpUnlimitedIterations ? (
                  <Text style={styles.helperText}>
                    No iteration limit. The agent will keep working until it finishes or you stop it.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.label}>Max Iterations</Text>
                    <TextInput
                      style={styles.input}
                      value={inputDrafts.mcpMaxIterations ?? '10'}
                      onChangeText={(v) => {
                        const num = parseInt(v, 10);
                        if (!isNaN(num) && num >= 1 && num <= 100) {
                          handleRemoteSettingUpdate('mcpMaxIterations', num);
                        } else {
                          setInputDrafts(prev => ({ ...prev, mcpMaxIterations: v }));
                        }
                      }}
                      placeholder="10"
                      placeholderTextColor={theme.colors.mutedForeground}
                      keyboardType="number-pad"
                    />
                  </>
                )}
              </CollapsibleSection>
            )}

            {/* 4f. Summarization */}
            {remoteSettings && (
              <CollapsibleSection id="summarization" title="Summarization">
                <View style={styles.row}>
                  <Text style={styles.label}>Summarization</Text>
                  <Switch
                    value={remoteSettings.dualModelEnabled ?? false}
                    onValueChange={(v) => handleRemoteSettingToggle('dualModelEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={remoteSettings.dualModelEnabled ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Generate summaries of agent steps for the UI
                </Text>
              </CollapsibleSection>
            )}

            {/* 4g. Tool Execution */}
            {remoteSettings && (
              <CollapsibleSection id="toolExecution" title="Tool Execution">
                <View style={styles.row}>
                  <Text style={styles.label}>Context Reduction</Text>
                  <Switch
                    value={remoteSettings.mcpContextReductionEnabled ?? false}
                    onValueChange={(v) => handleRemoteSettingToggle('mcpContextReductionEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={remoteSettings.mcpContextReductionEnabled ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Reduce context size for tool responses
                </Text>

                <View style={styles.row}>
                  <Text style={styles.label}>Tool Response Processing</Text>
                  <Switch
                    value={remoteSettings.mcpToolResponseProcessingEnabled ?? false}
                    onValueChange={(v) => handleRemoteSettingToggle('mcpToolResponseProcessingEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={remoteSettings.mcpToolResponseProcessingEnabled ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Parallel Tool Execution</Text>
                  <Switch
                    value={remoteSettings.mcpParallelToolExecution ?? false}
                    onValueChange={(v) => handleRemoteSettingToggle('mcpParallelToolExecution', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={remoteSettings.mcpParallelToolExecution ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Execute multiple tools in parallel when possible
                </Text>
              </CollapsibleSection>
            )}

            {/* 4h. MCP Servers */}
            {mcpServers.length > 0 && (
              <CollapsibleSection id="mcpServers" title="MCP Servers">
                {mcpServers.map((server) => (
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
                    <Switch
                      value={server.enabled}
                      onValueChange={(v) => handleServerToggle(server.name, v)}
                      accessibilityLabel={createMcpServerSwitchAccessibilityLabel(server.name)}
                      trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                      thumbColor={server.enabled ? theme.colors.primaryForeground : theme.colors.background}
                      disabled={server.configDisabled}
                    />
                  </View>
                ))}
              </CollapsibleSection>
            )}

            {/* 4i. WhatsApp */}
            {remoteSettings && (
              <CollapsibleSection id="whatsapp" title="WhatsApp">
                <View style={styles.row}>
                  <Text style={styles.label}>WhatsApp Integration</Text>
                  <Switch
                    value={remoteSettings.whatsappEnabled ?? false}
                    onValueChange={(v) => handleRemoteSettingToggle('whatsappEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={remoteSettings.whatsappEnabled ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>

                {remoteSettings.whatsappEnabled && (
                  <>
                    <Text style={styles.label}>Allowed Numbers</Text>
                    <TextInput
                      style={styles.input}
                      value={inputDrafts.whatsappAllowFrom ?? ''}
                      onChangeText={(v) => {
                        // Update the text draft immediately for responsive UI
                        setInputDrafts(prev => ({ ...prev, whatsappAllowFrom: v }));
                        // Parse comma-separated numbers and debounce the API update
                        // Don't update remoteSettings locally to avoid the sync effect
                        // rewriting the user's raw text (losing trailing commas/spaces)
                        const numbers = v.split(',').map(n => n.trim()).filter(n => n);
                        if (inputTimeoutRefs.current.whatsappAllowFrom) {
                          clearTimeout(inputTimeoutRefs.current.whatsappAllowFrom);
                        }
                        inputTimeoutRefs.current.whatsappAllowFrom = setTimeout(async () => {
                          if (!settingsClient) return;
                          try {
                            await settingsClient.updateSettings({ whatsappAllowFrom: numbers });
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
                        value={remoteSettings.whatsappAutoReply ?? false}
                        onValueChange={(v) => handleRemoteSettingToggle('whatsappAutoReply', v)}
                        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                        thumbColor={remoteSettings.whatsappAutoReply ? theme.colors.primaryForeground : theme.colors.background}
                      />
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>Log Messages</Text>
                      <Switch
                        value={remoteSettings.whatsappLogMessages ?? false}
                        onValueChange={(v) => handleRemoteSettingToggle('whatsappLogMessages', v)}
                        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                        thumbColor={remoteSettings.whatsappLogMessages ? theme.colors.primaryForeground : theme.colors.background}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      Log message content (privacy concern)
                    </Text>
                  </>
                )}
              </CollapsibleSection>
            )}

            {/* 4j. Langfuse */}
            {remoteSettings && (
              <CollapsibleSection id="langfuse" title="Langfuse">
                <View style={styles.row}>
                  <Text style={styles.label}>Langfuse Observability</Text>
                  <Switch
                    value={remoteSettings.langfuseEnabled ?? false}
                    onValueChange={(v) => handleRemoteSettingToggle('langfuseEnabled', v)}
                    trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                    thumbColor={remoteSettings.langfuseEnabled ? theme.colors.primaryForeground : theme.colors.background}
                  />
                </View>
                <Text style={styles.helperText}>
                  Enable tracing and observability via Langfuse
                </Text>

                {remoteSettings.langfuseEnabled && (
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
                      onChangeText={(v) => setInputDrafts(prev => ({ ...prev, langfuseSecretKey: v }))}
                      onBlur={() => {
                        const value = inputDrafts.langfuseSecretKey;
                        if (value !== undefined && value !== '' && settingsClient) {
                          settingsClient.updateSettings({ langfuseSecretKey: value }).then(() => {
                            setRemoteSettings(prev => prev ? { ...prev, langfuseSecretKey: '••••••••' } : null);
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
                  skills.map((skill) => (
                    <View key={skill.id} style={[styles.serverRow, !skill.enabled && { opacity: 0.5 }]}>
                      <View style={styles.serverInfo}>
                        <Text style={styles.serverName}>{skill.name}</Text>
                        <Text style={styles.serverMeta}>
                          {!skill.enabled ? '(Globally disabled) ' : ''}{skill.description}
                        </Text>
                      </View>
                      <Switch
                        value={skill.enabledForProfile}
                        onValueChange={() => handleSkillToggle(skill.id)}
                        disabled={!skill.enabled}
                        trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                        thumbColor={skill.enabledForProfile && skill.enabled ? theme.colors.primaryForeground : theme.colors.background}
                      />
                    </View>
                  ))
                )}
                <Text style={styles.helperText}>
                  Toggle skills for the current profile
                </Text>
              </CollapsibleSection>
            )}

            {/* 4l. Memories */}
            {isDotAgentsServer && (
              <CollapsibleSection id="memories" title="Memories">
                {isLoadingMemories ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : memories.length === 0 ? (
                  <Text style={styles.helperText}>No memories saved</Text>
                ) : (
                  memories.map((memory) => (
                    <View key={memory.id} style={[styles.serverRow, { alignItems: 'flex-start' }]}>
                      <TouchableOpacity
                        style={styles.agentInfoPressable}
                        onPress={() => handleMemoryEdit(memory)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.serverInfo, { flex: 1 }]}> 
                          <Text style={styles.serverName}>{memory.title}</Text>
                          <Text style={styles.serverMeta} numberOfLines={2}>{memory.content}</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                            {memory.tags.map((tag, idx) => (
                              <View key={idx} style={[styles.providerOption, { paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginTop: 2 }]}>
                                <Text style={[styles.providerOptionText, { fontSize: 10 }]}>{tag}</Text>
                              </View>
                            ))}
                            <View style={[
                              styles.providerOption,
                              { paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginTop: 2 },
                              memory.importance === 'critical' && { backgroundColor: theme.colors.destructive },
                              memory.importance === 'high' && { backgroundColor: theme.colors.primary },
                            ]}>
                              <Text style={[styles.providerOptionText, { fontSize: 10 }]}>{memory.importance}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ padding: 8 }}
                        onPress={() => handleMemoryDelete(memory.id)}
                      >
                        <Text style={{ color: theme.colors.destructive, fontSize: 16 }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
                <TouchableOpacity
                  style={styles.createAgentButton}
                  onPress={() => handleMemoryEdit()}
                >
                  <Text style={styles.createAgentButtonText}>+ Create Memory</Text>
                </TouchableOpacity>
                <Text style={styles.helperText}>
                  Tap a memory to edit or create a new one
                </Text>
              </CollapsibleSection>
            )}

            {/* 4m. Agents */}
            {isDotAgentsServer && (
              <CollapsibleSection id="agents" title="Agents">
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
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(`Edit ${profile.displayName} agent`)}
                        accessibilityHint="Opens this agent so you can review and change its settings."
                        activeOpacity={0.7}
                      >
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
                          {renderInlineEditAffordance()}
                        </View>
                      </TouchableOpacity>
                      <View style={styles.agentActions}>
                        <TouchableOpacity
                          style={styles.agentSwitchButton}
                          onPress={() => handleAgentProfileToggle(profile.id)}
                          accessibilityRole="switch"
                          accessibilityLabel={createSwitchAccessibilityLabel(`${profile.displayName} agent`)}
                          accessibilityHint="Enables or disables this agent for delegation."
                          accessibilityState={{ checked: profile.enabled }}
                          activeOpacity={0.7}
                        >
                          <View
                            pointerEvents="none"
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                          >
                            {renderActionRailSwitchVisual(profile.enabled)}
                          </View>
                        </TouchableOpacity>
                        {!profile.isBuiltIn && (
                          <TouchableOpacity
                            style={styles.agentDeleteButton}
                            onPress={() => handleAgentProfileDelete(profile)}
                            accessibilityRole="button"
                            accessibilityLabel={createButtonAccessibilityLabel(`Delete ${profile.displayName} agent`)}
                            accessibilityHint="Removes this agent after confirmation."
                            activeOpacity={0.7}
                          >
                            <Text style={{ color: theme.colors.destructive, fontSize: 16 }}>🗑️</Text>
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
                  loops.map((loop) => (
                    <View key={loop.id} style={[styles.serverRow, { alignItems: 'flex-start' }]}>
                      <TouchableOpacity
                        style={styles.agentInfoPressable}
                        onPress={() => handleLoopEdit(loop)}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(`Edit ${loop.name} loop`)}
                        accessibilityHint="Opens this loop so you can review and change its schedule or prompt."
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
                          <Text style={styles.serverMeta} numberOfLines={2}>
                            {formatLoopIntervalLabel(loop.intervalMinutes)}
                            {loop.profileName && ` • ${loop.profileName}`}
                            {loop.lastRunAt && ` • ${formatLoopLastRunLabel(loop.lastRunAt)}`}
                          </Text>
                          <Text style={styles.loopPromptPreview} numberOfLines={1}>{loop.prompt}</Text>
                          {renderInlineEditAffordance()}
                        </View>
                      </TouchableOpacity>
                      <View style={styles.loopActions}>
                        <TouchableOpacity
                          style={styles.loopSwitchButton}
                          onPress={() => handleLoopToggle(loop.id)}
                          accessibilityRole="switch"
                          accessibilityLabel={createSwitchAccessibilityLabel(`${loop.name} loop`)}
                          accessibilityHint="Enables or pauses this scheduled loop."
                          accessibilityState={{ checked: loop.enabled }}
                          activeOpacity={0.7}
                        >
                          <View
                            pointerEvents="none"
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                          >
                            {renderActionRailSwitchVisual(loop.enabled)}
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.loopActionButton}
                          onPress={() => handleLoopRun(loop.id)}
                          accessibilityRole="button"
                          accessibilityLabel={createButtonAccessibilityLabel(`Run ${loop.name} loop now`)}
                          accessibilityHint="Triggers this loop immediately."
                          activeOpacity={0.7}
                        >
                          <Text style={styles.loopRunText}>▶ Run</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.loopActionButton}
                          onPress={() => handleLoopDelete(loop)}
                          accessibilityRole="button"
                          accessibilityLabel={createButtonAccessibilityLabel(`Delete ${loop.name} loop`)}
                          accessibilityHint="Removes this scheduled loop after confirmation."
                          activeOpacity={0.7}
                        >
                          <Text style={styles.loopDeleteText}>🗑 Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
                <TouchableOpacity
                  style={styles.createAgentButton}
                  onPress={() => handleLoopEdit()}
                >
                  <Text style={styles.createAgentButtonText}>+ Create New Loop</Text>
                </TouchableOpacity>
                <Text style={styles.helperText}>
                  Tap a loop to edit, or run/toggle/delete from the actions
                </Text>
              </CollapsibleSection>
            )}
          </>
        )}

      </ScrollView>

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
                onPress={() => {
                  setShowModelPicker(false);
                  setModelSearchQuery('');
                }}
              >
                <Text style={styles.modelPickerClose}>✕</Text>
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
              <TouchableOpacity onPress={() => setShowPresetPicker(false)}>
                <Text style={styles.modelPickerClose}>✕</Text>
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
              <TouchableOpacity onPress={() => setShowTtsModelPicker(false)}>
                <Text style={styles.modelPickerClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modelList}>
              {getTtsModelsForProvider(remoteSettings?.ttsProviderId || 'openai').map((model) => {
                const currentValue = remoteSettings?.ttsProviderId === 'openai' ? remoteSettings.openaiTtsModel
                  : remoteSettings?.ttsProviderId === 'groq' ? remoteSettings.groqTtsModel
                  : remoteSettings?.geminiTtsModel;
                const isSelected = currentValue === model.value;
                return (
                  <TouchableOpacity
                    key={model.value}
                    style={[
                      styles.modelItem,
                      isSelected && styles.modelItemActive,
                    ]}
                    onPress={() => {
                      const key = remoteSettings?.ttsProviderId === 'openai' ? 'openaiTtsModel'
                        : remoteSettings?.ttsProviderId === 'groq' ? 'groqTtsModel'
                        : 'geminiTtsModel';
                      handleRemoteSettingUpdate(key, model.value);
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
                {getTtsModelsForProvider(remoteSettings?.ttsProviderId || 'openai').length} model{getTtsModelsForProvider(remoteSettings?.ttsProviderId || 'openai').length !== 1 ? 's' : ''} available
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
              <TouchableOpacity onPress={() => setShowTtsVoicePicker(false)}>
                <Text style={styles.modelPickerClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modelList}>
              {(() => {
                const ttsModel = remoteSettings?.ttsProviderId === 'groq' ? remoteSettings.groqTtsModel : undefined;
                const voices = getTtsVoicesForProvider(remoteSettings?.ttsProviderId || 'openai', ttsModel);
                return voices.map((voice) => {
                  const currentValue = remoteSettings?.ttsProviderId === 'openai' ? remoteSettings.openaiTtsVoice
                    : remoteSettings?.ttsProviderId === 'groq' ? remoteSettings.groqTtsVoice
                    : remoteSettings?.geminiTtsVoice;
                  const isSelected = currentValue === voice.value;
                  return (
                    <TouchableOpacity
                      key={voice.value}
                      style={[
                        styles.modelItem,
                        isSelected && styles.modelItemActive,
                      ]}
                      onPress={() => {
                        const key = remoteSettings?.ttsProviderId === 'openai' ? 'openaiTtsVoice'
                          : remoteSettings?.ttsProviderId === 'groq' ? 'groqTtsVoice'
                          : 'geminiTtsVoice';
                        handleRemoteSettingUpdate(key, voice.value);
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
                  const ttsModel = remoteSettings?.ttsProviderId === 'groq' ? remoteSettings?.groqTtsModel : undefined;
                  const count = getTtsVoicesForProvider(remoteSettings?.ttsProviderId || 'openai', ttsModel).length;
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
                onPress={() => {
                  setShowImportModal(false);
                  setImportJsonText('');
                }}
              >
                <Text style={styles.importModalClose}>✕</Text>
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
  const compactActionTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: spacing.sm,
    verticalPadding: spacing.xs,
    horizontalMargin: 0,
  });

  return StyleSheet.create({
    container: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    h1: {
      ...theme.typography.h1,
      marginBottom: spacing.sm,
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
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginTop: spacing.sm,
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
    agentSettingsOption: {
      ...compactActionTouchTarget,
      minWidth: 84,
      maxWidth: '100%',
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      alignSelf: 'flex-start',
    },
    agentSettingsOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    agentSettingsOptionText: {
      fontSize: 14,
      color: theme.colors.foreground,
      maxWidth: '100%',
      flexShrink: 1,
      textAlign: 'center',
    },
    agentSettingsOptionTextActive: {
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
    agentSettingsSwitchButton: {
      ...compactActionTouchTarget,
      borderRadius: radius.full,
      backgroundColor: theme.colors.secondary,
      alignSelf: 'center',
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    warningText: {
      color: '#d97706', // amber-600
      fontSize: 14,
      flex: 1,
    },
    retryText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: spacing.sm,
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
    importModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    importModalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    importModalClose: {
      fontSize: 20,
      color: theme.colors.mutedForeground,
      padding: spacing.xs,
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
    importModalActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
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
    loopPromptPreview: {
      fontSize: 11,
      color: theme.colors.mutedForeground,
      marginTop: spacing.xs,
      lineHeight: 15,
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
    editAffordance: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
      backgroundColor: theme.colors.primary + '14',
    },
    editAffordanceText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    editAffordanceChevron: {
      marginLeft: 4,
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 12,
      color: theme.colors.primary,
    },
    agentActions: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: spacing.xs,
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    agentSwitchButton: {
      ...compactActionTouchTarget,
      borderRadius: radius.full,
      backgroundColor: theme.colors.secondary,
    },
    agentDeleteButton: {
      ...compactActionTouchTarget,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
    },
    loopActions: {
      alignItems: 'stretch',
      gap: spacing.xs,
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    loopSwitchButton: {
      ...compactActionTouchTarget,
      borderRadius: radius.full,
      backgroundColor: theme.colors.secondary,
    },
    loopActionButton: {
      ...compactActionTouchTarget,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.secondary,
    },
    loopRunText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    loopDeleteText: {
      color: theme.colors.destructive,
      fontSize: 12,
      fontWeight: '600',
    },
    actionRailSwitchTrack: {
      width: 36,
      height: 20,
      borderRadius: radius.full,
      padding: 2,
      justifyContent: 'center',
      backgroundColor: theme.colors.muted,
    },
    actionRailSwitchTrackActive: {
      backgroundColor: theme.colors.primary,
    },
    actionRailSwitchThumb: {
      width: 16,
      height: 16,
      borderRadius: radius.full,
      backgroundColor: theme.colors.background,
      transform: [{ translateX: 0 }],
    },
    actionRailSwitchThumbActive: {
      backgroundColor: theme.colors.primaryForeground,
      transform: [{ translateX: 16 }],
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
    modelActionText: {
      fontSize: 12,
      color: theme.colors.primary,
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
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modelPickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    modelPickerClose: {
      fontSize: 20,
      color: theme.colors.mutedForeground,
      padding: spacing.sm,
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
