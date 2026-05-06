import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius } from '../ui/theme';
import { ExtendedSettingsApiClient, AgentProfileFull, AgentProfileCreateRequest, AgentProfileUpdateRequest, MCPServer, Skill } from '../lib/settingsApi';
import { createButtonAccessibilityLabel, createMinimumTouchTargetStyle } from '../lib/accessibility';
import { applyConnectionTypeChange, buildAgentConnectionRequestFields, type AgentConnectionFormFields, type ConnectionType } from './agent-edit-connection-utils';
import { useConfigContext } from '../store/config';

const CONNECTION_TYPES = [
  {
    label: 'Internal',
    value: 'internal',
    description: 'Uses the built-in DotAgents runtime with this profile’s prompts and settings.',
  },
  {
    label: 'acpx',
    value: 'acpx',
    description: 'Runs this external agent through the acpx CLI adapter.',
  },
  {
    label: 'Remote',
    value: 'remote',
    description: 'Connects to an external HTTP agent endpoint by URL.',
  },
] as const;

const AGENT_MODEL_PROVIDERS = [
  { label: 'Global', value: 'global' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Groq', value: 'groq' },
  { label: 'Gemini', value: 'gemini' },
  { label: 'ChatGPT Web', value: 'chatgpt-web' },
] as const;

type AgentModelProvider = Exclude<(typeof AGENT_MODEL_PROVIDERS)[number]['value'], 'global'>;

interface AgentFormData extends AgentConnectionFormFields {
  displayName: string;
  description: string;
  systemPrompt: string;
  guidelines: string;
  enabled: boolean;
  autoSpawn: boolean;
  modelConfig?: AgentModelConfig;
  toolConfig?: AgentToolConfig;
  skillsConfig?: AgentSkillsConfig;
}

type AgentModelConfig = {
  agentProviderId?: AgentModelProvider;
  agentOpenaiModel?: string;
  agentGroqModel?: string;
  agentGeminiModel?: string;
  agentChatgptWebModel?: string;
  mcpToolsProviderId?: AgentModelProvider;
  mcpToolsOpenaiModel?: string;
  mcpToolsGroqModel?: string;
  mcpToolsGeminiModel?: string;
  mcpToolsChatgptWebModel?: string;
};

type AgentToolConfig = {
  disabledServers?: string[];
  enabledServers?: string[];
  disabledTools?: string[];
  enabledRuntimeTools?: string[];
  allServersDisabledByDefault?: boolean;
};

type AgentSkillsConfig = {
  enabledSkillIds?: string[];
  allSkillsDisabledByDefault?: boolean;
};

const defaultFormData: AgentFormData = {
  displayName: '',
  description: '',
  systemPrompt: '',
  guidelines: '',
  connectionType: 'internal',
  connectionCommand: '',
  connectionArgs: '',
  connectionBaseUrl: '',
  connectionCwd: '',
  enabled: true,
  autoSpawn: false,
};

const normalizeConnectionType = (value?: string): ConnectionType => {
  if (value === 'acp') return 'acpx';
  if (value === 'acpx' || value === 'remote' || value === 'internal') return value;
  return 'internal';
};

const isAgentModelProvider = (value: unknown): value is AgentModelProvider => {
  return value === 'openai' || value === 'groq' || value === 'gemini' || value === 'chatgpt-web';
};

const normalizeSkillIds = (value: unknown): string[] => {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
};

const normalizeAgentSkillsConfig = (value?: Record<string, unknown>): AgentSkillsConfig | undefined => {
  if (!value) return undefined;
  return {
    enabledSkillIds: normalizeSkillIds(value.enabledSkillIds),
    allSkillsDisabledByDefault: value.allSkillsDisabledByDefault === true,
  };
};

const normalizeAgentModelConfig = (value?: Record<string, unknown>): AgentModelConfig | undefined => {
  if (!value) return undefined;
  const agentProviderId = isAgentModelProvider(value.agentProviderId)
    ? value.agentProviderId
    : isAgentModelProvider(value.mcpToolsProviderId)
      ? value.mcpToolsProviderId
      : undefined;

  return {
    agentProviderId,
    agentOpenaiModel: typeof value.agentOpenaiModel === 'string' ? value.agentOpenaiModel : typeof value.mcpToolsOpenaiModel === 'string' ? value.mcpToolsOpenaiModel : undefined,
    agentGroqModel: typeof value.agentGroqModel === 'string' ? value.agentGroqModel : typeof value.mcpToolsGroqModel === 'string' ? value.mcpToolsGroqModel : undefined,
    agentGeminiModel: typeof value.agentGeminiModel === 'string' ? value.agentGeminiModel : typeof value.mcpToolsGeminiModel === 'string' ? value.mcpToolsGeminiModel : undefined,
    agentChatgptWebModel: typeof value.agentChatgptWebModel === 'string' ? value.agentChatgptWebModel : typeof value.mcpToolsChatgptWebModel === 'string' ? value.mcpToolsChatgptWebModel : undefined,
  };
};

const normalizeAgentToolConfig = (value?: Record<string, unknown>): AgentToolConfig | undefined => {
  if (!value) return undefined;
  return {
    disabledServers: normalizeSkillIds(value.disabledServers),
    enabledServers: normalizeSkillIds(value.enabledServers),
    disabledTools: normalizeSkillIds(value.disabledTools),
    enabledRuntimeTools: normalizeSkillIds(value.enabledRuntimeTools),
    allServersDisabledByDefault: value.allServersDisabledByDefault === true,
  };
};

const isMcpServerEnabledByConfig = (serverName: string, toolConfig?: AgentToolConfig): boolean => {
  if (toolConfig?.allServersDisabledByDefault) return (toolConfig.enabledServers ?? []).includes(serverName);
  return !(toolConfig?.disabledServers ?? []).includes(serverName);
};

const isSkillEnabledByConfig = (skillId: string, skillsConfig?: AgentSkillsConfig): boolean => {
  if (!skillsConfig || !skillsConfig.allSkillsDisabledByDefault) return true;
  return (skillsConfig.enabledSkillIds ?? []).includes(skillId);
};

const countEnabledMcpServers = (servers: MCPServer[], toolConfig?: AgentToolConfig): number => {
  return servers.filter((server) => isMcpServerEnabledByConfig(server.name, toolConfig)).length;
};

const countEnabledSkills = (skills: Skill[], skillsConfig?: AgentSkillsConfig): number => {
  return skills.filter((skill) => isSkillEnabledByConfig(skill.id, skillsConfig)).length;
};

const getAgentModelProvider = (modelConfig?: AgentModelConfig): AgentModelProvider | undefined => {
  return modelConfig?.agentProviderId ?? modelConfig?.mcpToolsProviderId;
};

const getAgentModelField = (provider: AgentModelProvider): keyof AgentModelConfig => {
  if (provider === 'openai') return 'agentOpenaiModel';
  if (provider === 'groq') return 'agentGroqModel';
  if (provider === 'gemini') return 'agentGeminiModel';
  return 'agentChatgptWebModel';
};

const getAgentModelValue = (modelConfig: AgentModelConfig | undefined, provider: AgentModelProvider): string => {
  return String(modelConfig?.[getAgentModelField(provider)] ?? '');
};

const getAgentModelPlaceholder = (provider: AgentModelProvider): string => {
  if (provider === 'openai') return 'gpt-5.4-mini';
  if (provider === 'groq') return 'openai/gpt-oss-120b';
  if (provider === 'gemini') return 'gemini-2.5-flash';
  return 'gpt-5.4-mini';
};

const formatModelConfigForRequest = (modelConfig?: AgentModelConfig): Record<string, unknown> | undefined => {
  if (!modelConfig) return undefined;
  return { ...modelConfig };
};

const formatToolConfigForRequest = (toolConfig?: AgentToolConfig): Record<string, unknown> | undefined => {
  if (!toolConfig) return undefined;
  return {
    disabledServers: toolConfig.disabledServers,
    enabledServers: toolConfig.enabledServers,
    disabledTools: toolConfig.disabledTools,
    enabledRuntimeTools: toolConfig.enabledRuntimeTools,
    allServersDisabledByDefault: toolConfig.allServersDisabledByDefault === true,
  };
};

const formatSkillsConfigForRequest = (skillsConfig?: AgentSkillsConfig): Record<string, unknown> | undefined => {
  if (!skillsConfig) return undefined;
  return {
    enabledSkillIds: skillsConfig.enabledSkillIds ?? [],
    allSkillsDisabledByDefault: skillsConfig.allSkillsDisabledByDefault === true,
  };
};

export default function AgentEditScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { config } = useConfigContext();
  const agentId = route.params?.agentId as string | undefined;
  const isEditing = !!agentId;

  const [formData, setFormData] = useState<AgentFormData>(defaultFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalProfile, setOriginalProfile] = useState<AgentProfileFull | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [isSkillsLoading, setIsSkillsLoading] = useState(false);
  const [isMcpServersLoading, setIsMcpServersLoading] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const displayMcpServers = useMemo(() => [...mcpServers].sort((a, b) => a.name.localeCompare(b.name)), [mcpServers]);
  const displaySkills = useMemo(() => [...skills].sort((a, b) => a.name.localeCompare(b.name)), [skills]);
  const enabledMcpServerCount = useMemo(
    () => countEnabledMcpServers(displayMcpServers, formData.toolConfig),
    [displayMcpServers, formData.toolConfig],
  );
  const enabledSkillCount = useMemo(
    () => countEnabledSkills(displaySkills, formData.skillsConfig),
    [displaySkills, formData.skillsConfig],
  );
  const selectedModelProvider = getAgentModelProvider(formData.modelConfig);

  const settingsClient = useMemo(() => {
    if (config.baseUrl && config.apiKey) {
      return new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
    }
    return null;
  }, [config.baseUrl, config.apiKey]);

  // Fetch existing profile if editing
  useEffect(() => {
    if (isEditing && settingsClient && agentId) {
      setIsLoading(true);
      setError(null);
      settingsClient.getAgentProfile(agentId)
        .then(res => {
          const profile = res.profile;
          setOriginalProfile(profile);
          setFormData({
            displayName: profile.displayName || '',
            description: profile.description || '',
            systemPrompt: profile.systemPrompt || '',
            guidelines: profile.guidelines || '',
            connectionType: normalizeConnectionType(profile.connection?.type || profile.connectionType),
            connectionCommand: profile.connection?.command || '',
            connectionArgs: profile.connection?.args?.join(' ') || '',
            connectionBaseUrl: profile.connection?.baseUrl || '',
            connectionCwd: profile.connection?.cwd || '',
            enabled: profile.enabled,
            autoSpawn: profile.autoSpawn || false,
            modelConfig: normalizeAgentModelConfig(profile.modelConfig),
            toolConfig: normalizeAgentToolConfig(profile.toolConfig),
            skillsConfig: normalizeAgentSkillsConfig(profile.skillsConfig),
          });
        })
        .catch(err => {
          console.error('[AgentEdit] Failed to fetch profile:', err);
          setError(err.message || 'Failed to load agent');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isEditing, settingsClient, agentId]);

  useEffect(() => {
    if (!settingsClient) {
      setSkills([]);
      return;
    }

    setIsSkillsLoading(true);
    settingsClient.getSkills()
      .then((res) => {
        setSkills(res.skills);
      })
      .catch((err) => {
        console.error('[AgentEdit] Failed to fetch skills:', err);
        setError(err.message || 'Failed to load skills');
      })
      .finally(() => setIsSkillsLoading(false));
  }, [settingsClient]);

  useEffect(() => {
    if (!settingsClient) {
      setMcpServers([]);
      return;
    }

    setIsMcpServersLoading(true);
    settingsClient.getMCPServers()
      .then((res) => {
        setMcpServers(res.servers);
      })
      .catch((err) => {
        console.error('[AgentEdit] Failed to fetch MCP servers:', err);
        setError(err.message || 'Failed to load MCP servers');
      })
      .finally(() => setIsMcpServersLoading(false));
  }, [settingsClient]);

  // Set navigation title
  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Agent' : 'Create Agent',
    });
  }, [navigation, isEditing]);

  const handleSave = useCallback(async () => {
    if (!settingsClient) return;
    if (!formData.displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const connectionFields = buildAgentConnectionRequestFields(formData);

      if (isEditing && agentId) {
        const updateData: AgentProfileUpdateRequest = originalProfile?.isBuiltIn
          ? {
            guidelines: formData.guidelines.trim() || undefined,
            enabled: formData.enabled,
            autoSpawn: formData.autoSpawn,
          }
          : {
            displayName: formData.displayName.trim(),
            description: formData.description.trim() || undefined,
            systemPrompt: formData.systemPrompt.trim() || undefined,
            guidelines: formData.guidelines.trim() || undefined,
            ...connectionFields,
            enabled: formData.enabled,
            autoSpawn: formData.autoSpawn,
            modelConfig: formatModelConfigForRequest(formData.modelConfig),
            toolConfig: formatToolConfigForRequest(formData.toolConfig),
            skillsConfig: formatSkillsConfigForRequest(formData.skillsConfig),
          };
        await settingsClient.updateAgentProfile(agentId, updateData);
      } else {
        const createData: AgentProfileCreateRequest = {
          displayName: formData.displayName.trim(),
          description: formData.description.trim() || undefined,
          systemPrompt: formData.systemPrompt.trim() || undefined,
          guidelines: formData.guidelines.trim() || undefined,
          ...connectionFields,
          enabled: formData.enabled,
          autoSpawn: formData.autoSpawn,
          modelConfig: formatModelConfigForRequest(formData.modelConfig),
          toolConfig: formatToolConfigForRequest(formData.toolConfig),
          skillsConfig: formatSkillsConfigForRequest(formData.skillsConfig),
        };
        await settingsClient.createAgentProfile(createData);
      }
      navigation.goBack();
    } catch (err: any) {
      console.error('[AgentEdit] Failed to save:', err);
      setError(err.message || 'Failed to save agent');
    } finally {
      setIsSaving(false);
    }
  }, [settingsClient, formData, isEditing, agentId, navigation, originalProfile]);

  const updateField = useCallback(<K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleConnectionTypeSelect = useCallback((connectionType: ConnectionType) => {
    setFormData(prev => applyConnectionTypeChange(prev, connectionType));
  }, []);

  const setAgentModelProvider = useCallback((provider: AgentModelProvider | 'global') => {
    setFormData(prev => ({
      ...prev,
      modelConfig: provider === 'global'
        ? {}
        : {
          ...prev.modelConfig,
          agentProviderId: provider,
        },
    }));
  }, []);

  const updateAgentModel = useCallback((provider: AgentModelProvider, model: string) => {
    const modelField = getAgentModelField(provider);
    setFormData(prev => ({
      ...prev,
      modelConfig: {
        ...prev.modelConfig,
        agentProviderId: provider,
        [modelField]: model,
      },
    }));
  }, []);

  const setAllMcpServersEnabled = useCallback((enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      toolConfig: {
        ...prev.toolConfig,
        disabledServers: enabled ? [] : undefined,
        enabledServers: enabled ? undefined : [],
        allServersDisabledByDefault: !enabled,
      },
    }));
  }, []);

  const toggleMcpServer = useCallback((serverName: string) => {
    setFormData(prev => {
      const currentConfig = prev.toolConfig ?? {};
      if (currentConfig.allServersDisabledByDefault) {
        const currentEnabledServers = currentConfig.enabledServers ?? [];
        const enabledServers = currentEnabledServers.includes(serverName)
          ? currentEnabledServers.filter(name => name !== serverName)
          : [...currentEnabledServers, serverName];

        return {
          ...prev,
          toolConfig: {
            ...currentConfig,
            enabledServers,
            disabledServers: undefined,
            allServersDisabledByDefault: true,
          },
        };
      }

      const currentDisabledServers = currentConfig.disabledServers ?? [];
      const disabledServers = currentDisabledServers.includes(serverName)
        ? currentDisabledServers.filter(name => name !== serverName)
        : [...currentDisabledServers, serverName];

      return {
        ...prev,
        toolConfig: {
          ...currentConfig,
          disabledServers,
          enabledServers: undefined,
          allServersDisabledByDefault: false,
        },
      };
    });
  }, []);

  const setAllSkillsEnabled = useCallback((enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      skillsConfig: {
        enabledSkillIds: [],
        allSkillsDisabledByDefault: !enabled,
      },
    }));
  }, []);

  const toggleSkill = useCallback((skillId: string) => {
    setFormData(prev => {
      const allSkillIds = displaySkills.map(skill => skill.id);
      if (!prev.skillsConfig || !prev.skillsConfig.allSkillsDisabledByDefault) {
        return {
          ...prev,
          skillsConfig: {
            enabledSkillIds: allSkillIds.filter(id => id !== skillId),
            allSkillsDisabledByDefault: true,
          },
        };
      }

      const currentIds = prev.skillsConfig.enabledSkillIds ?? [];
      const enabledSkillIds = currentIds.includes(skillId)
        ? currentIds.filter(id => id !== skillId)
        : [...currentIds, skillId];

      return {
        ...prev,
        skillsConfig: {
          enabledSkillIds,
          allSkillsDisabledByDefault: true,
        },
      };
    });
  }, [displaySkills]);

  const isBuiltInAgent = originalProfile?.isBuiltIn === true;

  // Check if connection fields should be shown
  const showCommandFields = formData.connectionType === 'acpx';
  const showRemoteBaseUrlField = formData.connectionType === 'remote';

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading agent...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

      {isBuiltInAgent && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>Built-in agents have limited editing options</Text>
        </View>
      )}

      <Text style={styles.label}>Display Name *</Text>
      <TextInput
        style={styles.input}
        value={formData.displayName}
        onChangeText={v => updateField('displayName', v)}
        placeholder="My Agent"
        placeholderTextColor={theme.colors.mutedForeground}
        editable={!isBuiltInAgent}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={formData.description}
        onChangeText={v => updateField('description', v)}
        placeholder="What this agent does..."
        placeholderTextColor={theme.colors.mutedForeground}
        multiline
        editable={!isBuiltInAgent}
      />

      <Text style={styles.label}>Connection Type</Text>
      <Text style={styles.sectionHelperText}>Choose how DotAgents should reach this agent. The setup fields below change based on this choice.</Text>
      <View style={styles.connectionTypeOptions}>
        {CONNECTION_TYPES.map(ct => (
          <TouchableOpacity
            key={ct.value}
            style={[
              styles.connectionTypeOption,
              formData.connectionType === ct.value && styles.connectionTypeOptionActive,
            ]}
            onPress={() => handleConnectionTypeSelect(ct.value)}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel(`Use ${ct.label} connection for this agent`)}
            accessibilityHint={formData.connectionType === ct.value ? `Currently selected. ${ct.description}` : ct.description}
            accessibilityState={{ selected: formData.connectionType === ct.value, disabled: isBuiltInAgent }}
            disabled={isBuiltInAgent}
          >
            <View style={styles.connectionTypeOptionInfo}>
              <Text style={[
                styles.connectionTypeText,
                formData.connectionType === ct.value && styles.connectionTypeTextActive,
              ]}>
                {ct.label}
              </Text>
              <Text style={[
                styles.connectionTypeHelperText,
                formData.connectionType === ct.value && styles.connectionTypeHelperTextActive,
              ]}>
                {ct.description}
              </Text>
            </View>
            {formData.connectionType === ct.value && <Text style={styles.connectionTypeCheckmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {showCommandFields && (
        <>
          <Text style={styles.label}>Command</Text>
          <TextInput
            style={styles.input}
            value={formData.connectionCommand}
            onChangeText={v => updateField('connectionCommand', v)}
            placeholder="node"
            placeholderTextColor={theme.colors.mutedForeground}
            autoCapitalize="none"
            editable={!isBuiltInAgent}
          />
          <Text style={styles.label}>Arguments</Text>
          <TextInput
            style={styles.input}
            value={formData.connectionArgs}
            onChangeText={v => updateField('connectionArgs', v)}
            placeholder="agent.js --port 3000"
            placeholderTextColor={theme.colors.mutedForeground}
            autoCapitalize="none"
            editable={!isBuiltInAgent}
          />
          <Text style={styles.label}>Working Directory</Text>
          <TextInput
            style={styles.input}
            value={formData.connectionCwd}
            onChangeText={v => updateField('connectionCwd', v)}
            placeholder="/path/to/agent"
            placeholderTextColor={theme.colors.mutedForeground}
            autoCapitalize="none"
            editable={!isBuiltInAgent}
          />
        </>
      )}

      {showRemoteBaseUrlField && (
        <>
          <Text style={styles.label}>Base URL</Text>
          <TextInput
            style={styles.input}
            value={formData.connectionBaseUrl}
            onChangeText={v => updateField('connectionBaseUrl', v)}
            placeholder="http://localhost:3000"
            placeholderTextColor={theme.colors.mutedForeground}
            autoCapitalize="none"
            keyboardType="url"
            editable={!isBuiltInAgent}
          />
        </>
      )}

      <Text style={styles.label}>System Prompt</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.systemPrompt}
        onChangeText={v => updateField('systemPrompt', v)}
        placeholder="You are a helpful assistant..."
        placeholderTextColor={theme.colors.mutedForeground}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        editable={!isBuiltInAgent}
      />

      <Text style={styles.label}>Guidelines</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.guidelines}
        onChangeText={v => updateField('guidelines', v)}
        placeholder="Additional instructions for the agent..."
        placeholderTextColor={theme.colors.mutedForeground}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {formData.connectionType === 'internal' && (
        <View style={styles.capabilitySection}>
          <View style={styles.capabilityHeader}>
            <View style={styles.capabilityTitleBlock}>
              <Text style={styles.sectionTitle}>Model</Text>
              <Text style={styles.sectionHelperText}>{selectedModelProvider ?? 'Global default'}</Text>
            </View>
          </View>
          <View style={styles.providerChipGrid}>
            {AGENT_MODEL_PROVIDERS.map(provider => {
              const selected = (selectedModelProvider ?? 'global') === provider.value;
              return (
                <TouchableOpacity
                  key={provider.value}
                  style={[
                    styles.chipButton,
                    styles.providerChip,
                    selected && styles.chipButtonActive,
                    isBuiltInAgent && styles.chipButtonDisabled,
                  ]}
                  onPress={() => setAgentModelProvider(provider.value)}
                  disabled={isBuiltInAgent}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: isBuiltInAgent }}
                  accessibilityLabel={createButtonAccessibilityLabel(`Use ${provider.label} model for this agent`)}
                >
                  <Text style={[styles.chipButtonText, selected && styles.chipButtonTextActive]}>{provider.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedModelProvider && (
            <>
              <Text style={styles.label}>Agent Model</Text>
              <TextInput
                style={styles.input}
                value={getAgentModelValue(formData.modelConfig, selectedModelProvider)}
                onChangeText={v => updateAgentModel(selectedModelProvider, v)}
                placeholder={getAgentModelPlaceholder(selectedModelProvider)}
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                editable={!isBuiltInAgent}
              />
            </>
          )}
        </View>
      )}

      <View style={styles.capabilitySection}>
        <View style={styles.capabilityHeader}>
          <View style={styles.capabilityTitleBlock}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.sectionHelperText}>{enabledSkillCount} of {displaySkills.length} enabled</Text>
          </View>
          <View style={styles.skillBulkActions}>
            <TouchableOpacity
              style={[styles.chipButton, isBuiltInAgent && styles.chipButtonDisabled]}
              onPress={() => setAllSkillsEnabled(true)}
              disabled={isBuiltInAgent}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Enable all agent skills')}
            >
              <Text style={styles.chipButtonText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chipButton, isBuiltInAgent && styles.chipButtonDisabled]}
              onPress={() => setAllSkillsEnabled(false)}
              disabled={isBuiltInAgent}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Disable all agent skills')}
            >
              <Text style={styles.chipButtonText}>None</Text>
            </TouchableOpacity>
          </View>
        </View>
        {isSkillsLoading ? (
          <View style={styles.inlineLoadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.sectionHelperText}>Loading skills...</Text>
          </View>
        ) : displaySkills.length === 0 ? (
          <Text style={styles.sectionHelperText}>No skills available.</Text>
        ) : displaySkills.map(skill => {
          const enabled = isSkillEnabledByConfig(skill.id, formData.skillsConfig);
          return (
            <View key={skill.id} style={styles.skillRow}>
              <View style={styles.skillInfo}>
                <Text style={styles.skillName}>{skill.name}</Text>
                {skill.description ? <Text style={styles.skillDescription} numberOfLines={2}>{skill.description}</Text> : null}
              </View>
              <Switch
                value={enabled}
                onValueChange={() => toggleSkill(skill.id)}
                disabled={isBuiltInAgent}
                accessibilityLabel={createButtonAccessibilityLabel(`${enabled ? 'Disable' : 'Enable'} ${skill.name} for this agent`)}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={enabled ? theme.colors.primaryForeground : theme.colors.background}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.capabilitySection}>
        <View style={styles.capabilityHeader}>
          <View style={styles.capabilityTitleBlock}>
            <Text style={styles.sectionTitle}>MCP Servers</Text>
            <Text style={styles.sectionHelperText}>{enabledMcpServerCount} of {displayMcpServers.length} enabled</Text>
          </View>
          <View style={styles.skillBulkActions}>
            <TouchableOpacity
              style={[styles.chipButton, isBuiltInAgent && styles.chipButtonDisabled]}
              onPress={() => setAllMcpServersEnabled(true)}
              disabled={isBuiltInAgent}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Enable all agent MCP servers')}
            >
              <Text style={styles.chipButtonText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chipButton, isBuiltInAgent && styles.chipButtonDisabled]}
              onPress={() => setAllMcpServersEnabled(false)}
              disabled={isBuiltInAgent}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Disable all agent MCP servers')}
            >
              <Text style={styles.chipButtonText}>None</Text>
            </TouchableOpacity>
          </View>
        </View>
        {isMcpServersLoading ? (
          <View style={styles.inlineLoadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.sectionHelperText}>Loading MCP servers...</Text>
          </View>
        ) : displayMcpServers.length === 0 ? (
          <Text style={styles.sectionHelperText}>No MCP servers configured.</Text>
        ) : displayMcpServers.map(server => {
          const enabled = isMcpServerEnabledByConfig(server.name, formData.toolConfig);
          return (
            <View key={server.name} style={styles.skillRow}>
              <View style={styles.skillInfo}>
                <Text style={styles.skillName}>{server.name}</Text>
                <Text style={styles.skillDescription} numberOfLines={2}>
                  {server.connected ? 'Connected' : 'Offline'} - {server.toolCount} tool{server.toolCount === 1 ? '' : 's'}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={() => toggleMcpServer(server.name)}
                disabled={isBuiltInAgent}
                accessibilityLabel={createButtonAccessibilityLabel(`${enabled ? 'Disable' : 'Enable'} ${server.name} MCP server for this agent`)}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={enabled ? theme.colors.primaryForeground : theme.colors.background}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enabled</Text>
        <Switch
          value={formData.enabled}
          onValueChange={v => updateField('enabled', v)}
          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
          thumbColor={formData.enabled ? theme.colors.primaryForeground : theme.colors.background}
        />
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Auto Spawn</Text>
          <Text style={styles.switchHelperText}>Start agent automatically on app launch</Text>
        </View>
        <Switch
          value={formData.autoSpawn}
          onValueChange={v => updateField('autoSpawn', v)}
          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
          thumbColor={formData.autoSpawn ? theme.colors.primaryForeground : theme.colors.background}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color={theme.colors.primaryForeground} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Create Agent'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}


function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      padding: spacing.lg,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: spacing.md,
      color: theme.colors.mutedForeground,
      fontSize: 14,
    },
    errorContainer: {
      backgroundColor: theme.colors.destructive + '20',
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: 14,
    },
    warningContainer: {
      backgroundColor: '#f59e0b20',
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    warningText: {
      color: '#f59e0b',
      fontSize: 14,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.foreground,
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    sectionHelperText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 14,
      color: theme.colors.foreground,
      backgroundColor: theme.colors.background,
    },
    textArea: {
      minHeight: 100,
    },
    capabilitySection: {
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      backgroundColor: theme.colors.background,
      padding: spacing.md,
      gap: spacing.sm,
    },
    capabilityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    capabilityTitleBlock: {
      flex: 1,
      minWidth: 0,
    },
    skillBulkActions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    chipButton: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.sm,
        verticalPadding: spacing.xs,
        horizontalMargin: 0,
      }),
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.muted,
    },
    chipButtonDisabled: {
      opacity: 0.5,
    },
    chipButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    chipButtonText: {
      color: theme.colors.foreground,
      fontSize: 12,
      fontWeight: '600',
    },
    chipButtonTextActive: {
      color: theme.colors.primaryForeground,
    },
    providerChipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    providerChip: {
      flexGrow: 1,
    },
    inlineLoadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    skillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    skillInfo: {
      flex: 1,
      minWidth: 0,
    },
    skillName: {
      color: theme.colors.foreground,
      fontSize: 14,
      fontWeight: '500',
    },
    skillDescription: {
      color: theme.colors.mutedForeground,
      fontSize: 12,
      marginTop: 2,
    },
    connectionTypeOptions: {
      width: '100%' as const,
      gap: spacing.xs,
    },
    connectionTypeOption: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.md,
        verticalPadding: spacing.sm,
        horizontalMargin: 0,
      }),
      width: '100%' as const,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    connectionTypeOptionActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    connectionTypeOptionInfo: {
      flex: 1,
      minWidth: 0,
    },
    connectionTypeText: {
      fontSize: 14,
      color: theme.colors.foreground,
      fontWeight: '500',
    },
    connectionTypeTextActive: {
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
    connectionTypeHelperText: {
      marginTop: 2,
      fontSize: 12,
      color: theme.colors.mutedForeground,
    },
    connectionTypeHelperTextActive: {
      color: theme.colors.primaryForeground,
    },
    connectionTypeCheckmark: {
      color: theme.colors.primaryForeground,
      fontSize: 16,
      fontWeight: '700',
      marginLeft: spacing.sm,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    switchLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.foreground,
    },
    switchHelperText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    saveButton: {
      marginTop: spacing.xl,
      backgroundColor: theme.colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      color: theme.colors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
