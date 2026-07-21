import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../ui/ThemeProvider';
import { AppShellEditorLayout } from '../ui/AppShellEditorLayout';
import { getAppShellEditorTitle } from '../ui/appShell';
import { spacing, radius } from '../ui/theme';
import {
  ExtendedSettingsApiClient,
  AgentProfileFull,
  AgentProfileCreateRequest,
  AgentProfileUpdateRequest,
  MCPServer,
  Skill,
  OperatorMCPToolSummary,
  VerifyExternalAgentCommandResponse,
} from '../lib/settingsApi';
import { createButtonAccessibilityLabel, createMinimumTouchTargetStyle } from '../lib/accessibility';
import { applyConnectionTypeChange, buildAgentConnectionRequestFields, type AgentConnectionFormFields, type ConnectionType } from './agent-edit-connection-utils';
import { useConfigContext } from '../store/config';
import { parseShellCommand } from '@dotagents/shared';

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

type AgentModelProvider = 'openai' | 'groq' | 'gemini' | 'chatgpt-web';

type ProfileToolConfig = {
  disabledServers?: string[];
  enabledServers?: string[];
  disabledTools?: string[];
  enabledRuntimeTools?: string[];
  allServersDisabledByDefault?: boolean;
};

type ProfileSkillsConfig = {
  enabledSkillIds?: string[];
  allSkillsDisabledByDefault?: boolean;
};

type AgentProfilePresetKey = 'auggie' | 'claude-code' | 'codex' | 'opencode';

type AgentProfilePreset = {
  displayName: string;
  description: string;
  connectionCommand: string;
  connectionArgs: string;
  installCommand?: string;
  authHint?: string;
  cwdHint?: string;
  verifyArgs?: string[];
};

const AGENT_MODEL_PROVIDERS: { label: string; value: AgentModelProvider; placeholder: string }[] = [
  { label: 'OpenAI', value: 'openai', placeholder: 'gpt-4.1-mini' },
  { label: 'Groq', value: 'groq', placeholder: 'openai/gpt-oss-120b' },
  { label: 'Gemini', value: 'gemini', placeholder: 'gemini-2.5-flash' },
  { label: 'ChatGPT Web', value: 'chatgpt-web', placeholder: 'gpt-5.6' },
];

const MODEL_KEY_BY_PROVIDER: Record<AgentModelProvider, keyof AgentModelConfigFields> = {
  openai: 'agentOpenaiModel',
  groq: 'agentGroqModel',
  gemini: 'agentGeminiModel',
  'chatgpt-web': 'agentChatgptWebModel',
};

const MCP_MODEL_KEY_BY_PROVIDER: Record<AgentModelProvider, keyof AgentModelConfigFields> = {
  openai: 'mcpToolsOpenaiModel',
  groq: 'mcpToolsGroqModel',
  gemini: 'mcpToolsGeminiModel',
  'chatgpt-web': 'mcpToolsChatgptWebModel',
};

type AgentModelConfigFields = {
  agentProviderId?: AgentModelProvider;
  mcpToolsProviderId?: AgentModelProvider;
  agentOpenaiModel?: string;
  agentGroqModel?: string;
  agentGeminiModel?: string;
  agentChatgptWebModel?: string;
  mcpToolsOpenaiModel?: string;
  mcpToolsGroqModel?: string;
  mcpToolsGeminiModel?: string;
  mcpToolsChatgptWebModel?: string;
};

const AGENT_MODEL_VALUE_KEYS = [
  'agentOpenaiModel',
  'agentGroqModel',
  'agentGeminiModel',
  'agentChatgptWebModel',
  'mcpToolsOpenaiModel',
  'mcpToolsGroqModel',
  'mcpToolsGeminiModel',
  'mcpToolsChatgptWebModel',
] as const;

const AGENT_PROFILE_PRESETS: Record<AgentProfilePresetKey, AgentProfilePreset> = {
  auggie: {
    displayName: 'Auggie (Augment Code)',
    description: "Augment Code's AI coding assistant with native ACP support",
    connectionCommand: 'auggie',
    connectionArgs: '--acp',
    cwdHint: 'Point the working directory at the repo Auggie should operate in.',
    verifyArgs: ['--help'],
  },
  'claude-code': {
    displayName: 'Claude Code',
    description: "Anthropic's Claude for coding tasks through the ACP adapter",
    connectionCommand: 'claude-code-acp',
    connectionArgs: '',
    installCommand: 'npm install -g @zed-industries/claude-code-acp',
    authHint: 'Sign in to Claude Code in your terminal before verifying if this is your first run.',
    cwdHint: 'Use the repo root so Claude Code has the right project context.',
    verifyArgs: ['--help'],
  },
  codex: {
    displayName: 'Codex',
    description: 'OpenAI Codex through the official ACP adapter',
    connectionCommand: 'codex-acp',
    connectionArgs: '',
    installCommand: 'npm install -g @zed-industries/codex-acp',
    authHint: 'Run codex login first, or set CODEX_API_KEY / OPENAI_API_KEY before verifying.',
    cwdHint: 'Set the working directory to the project Codex should inspect and edit.',
    verifyArgs: ['--help'],
  },
  opencode: {
    displayName: 'OpenCode',
    description: "OpenCode's native ACP server for terminal-first agent workflows",
    connectionCommand: 'opencode',
    connectionArgs: 'acp',
    installCommand: 'npm install -g opencode-ai',
    authHint: 'OpenCode stores provider auth after you run opencode and complete /connect in the TUI.',
    cwdHint: 'Use your workspace root so opencode acp loads the right project and config.',
    verifyArgs: ['--help'],
  },
};

const DEFAULT_RUNTIME_TOOLS = [
  {
    name: 'set_session_title',
    description: 'Let the agent rename the active chat when the topic becomes clear.',
  },
  {
    name: 'execute_command',
    description: 'Let the agent run shell commands and repository automation.',
  },
  {
    name: 'read_more_context',
    description: 'Let the agent recover compacted context when it needs older details.',
  },
  {
    name: 'mark_work_complete',
    description: 'Required completion signal used by DotAgents.',
    essential: true,
  },
];

const ESSENTIAL_RUNTIME_TOOL_NAMES = ['mark_work_complete'];

interface AgentFormData extends AgentConnectionFormFields {
  displayName: string;
  description: string;
  avatarDataUrl: string | null;
  systemPrompt: string;
  guidelines: string;
  modelConfig: AgentModelConfigFields;
  toolConfig: ProfileToolConfig;
  skillsConfig: ProfileSkillsConfig;
  properties: Record<string, string>;
  enabled: boolean;
  autoSpawn: boolean;
}

const defaultFormData: AgentFormData = {
  displayName: '',
  description: '',
  avatarDataUrl: null,
  systemPrompt: '',
  guidelines: '',
  modelConfig: {},
  toolConfig: {},
  skillsConfig: {},
  properties: {},
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

const MAX_AGENT_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024;

function buildAgentAvatarDataUrl(base64: string, mimeType?: string | null): string {
  const resolvedMimeType = mimeType?.startsWith('image/') ? mimeType : 'image/jpeg';
  return `data:${resolvedMimeType};base64,${base64}`;
}

function getApproxBase64Bytes(base64: string): number {
  const normalized = base64.replace(/\s/g, '');
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value.map(item => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
  return strings.length > 0 ? strings : [];
}

function normalizeToolConfig(value: unknown): ProfileToolConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const config = value as Record<string, unknown>;
  return {
    disabledServers: normalizeStringArray(config.disabledServers),
    enabledServers: normalizeStringArray(config.enabledServers),
    disabledTools: normalizeStringArray(config.disabledTools),
    enabledRuntimeTools: normalizeStringArray(config.enabledRuntimeTools),
    allServersDisabledByDefault: config.allServersDisabledByDefault === true,
  };
}

function normalizeSkillsConfig(value: unknown): ProfileSkillsConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const config = value as Record<string, unknown>;
  return {
    enabledSkillIds: normalizeStringArray(config.enabledSkillIds),
    allSkillsDisabledByDefault: config.allSkillsDisabledByDefault === true,
  };
}

function normalizeModelConfig(value: unknown): AgentModelConfigFields {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const config = value as Record<string, unknown>;
  const provider = typeof config.agentProviderId === 'string'
    ? config.agentProviderId
    : typeof config.mcpToolsProviderId === 'string'
      ? config.mcpToolsProviderId
      : undefined;
  const modelConfig: AgentModelConfigFields = {};

  if (provider === 'openai' || provider === 'groq' || provider === 'gemini' || provider === 'chatgpt-web') {
    modelConfig.agentProviderId = provider;
    modelConfig.mcpToolsProviderId = provider;
  }

  for (const key of AGENT_MODEL_VALUE_KEYS) {
    const valueForKey = config[key];
    if (typeof valueForKey === 'string') modelConfig[key] = valueForKey;
  }

  return modelConfig;
}

function normalizeProperties(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, val]) => key.trim() && typeof val === 'string')
      .map(([key, val]) => [key.trim(), String(val)]),
  );
}

function isSkillEnabledForAgent(config: ProfileSkillsConfig, skillId: string): boolean {
  if (!config.allSkillsDisabledByDefault) return true;
  return (config.enabledSkillIds ?? []).includes(skillId);
}

function setAllSkillsEnabled(enabled: boolean): ProfileSkillsConfig {
  return {
    allSkillsDisabledByDefault: !enabled,
    enabledSkillIds: [],
  };
}

function toggleSkillConfig(config: ProfileSkillsConfig, skillId: string, allSkillIds: string[]): ProfileSkillsConfig {
  if (!config.allSkillsDisabledByDefault) {
    return {
      allSkillsDisabledByDefault: true,
      enabledSkillIds: allSkillIds.filter(id => id !== skillId),
    };
  }

  const enabled = new Set(config.enabledSkillIds ?? []);
  if (enabled.has(skillId)) {
    enabled.delete(skillId);
  } else {
    enabled.add(skillId);
  }

  if (allSkillIds.length > 0 && allSkillIds.every(id => enabled.has(id))) {
    return setAllSkillsEnabled(true);
  }

  return {
    allSkillsDisabledByDefault: true,
    enabledSkillIds: allSkillIds.filter(id => enabled.has(id)),
  };
}

function isMcpServerEnabledForAgent(config: ProfileToolConfig, serverName: string): boolean {
  if (config.allServersDisabledByDefault) {
    return (config.enabledServers ?? []).includes(serverName);
  }
  return !(config.disabledServers ?? []).includes(serverName);
}

function isMcpToolEnabledForAgent(config: ProfileToolConfig, toolName: string): boolean {
  return !(config.disabledTools ?? []).includes(toolName);
}

function countEnabledMcpTools(config: ProfileToolConfig, toolNames: string[]): number {
  return toolNames.filter(toolName => isMcpToolEnabledForAgent(config, toolName)).length;
}

function setAllMcpServersEnabled(enabled: boolean): ProfileToolConfig {
  return {
    allServersDisabledByDefault: !enabled,
    disabledServers: [],
    enabledServers: [],
  };
}

function toggleMcpServerConfig(config: ProfileToolConfig, serverName: string, allServerNames: string[]): ProfileToolConfig {
  if (config.allServersDisabledByDefault) {
    const enabled = new Set(config.enabledServers ?? []);
    if (enabled.has(serverName)) {
      enabled.delete(serverName);
    } else {
      enabled.add(serverName);
    }

    if (allServerNames.length > 0 && allServerNames.every(name => enabled.has(name))) {
      return {
        ...config,
        ...setAllMcpServersEnabled(true),
      };
    }

    return {
      ...config,
      allServersDisabledByDefault: true,
      enabledServers: allServerNames.filter(name => enabled.has(name)),
    };
  }

  const disabled = new Set(config.disabledServers ?? []);
  if (disabled.has(serverName)) {
    disabled.delete(serverName);
  } else {
    disabled.add(serverName);
  }

  return {
    ...config,
    allServersDisabledByDefault: false,
    disabledServers: allServerNames.filter(name => disabled.has(name)),
    enabledServers: [],
  };
}

function toggleMcpToolConfig(config: ProfileToolConfig, toolName: string): ProfileToolConfig {
  const disabledTools = new Set(config.disabledTools ?? []);
  if (disabledTools.has(toolName)) {
    disabledTools.delete(toolName);
  } else {
    disabledTools.add(toolName);
  }

  return {
    ...config,
    disabledTools: Array.from(disabledTools),
  };
}

function isRuntimeToolEnabledForAgent(config: ProfileToolConfig, toolName: string): boolean {
  if (ESSENTIAL_RUNTIME_TOOL_NAMES.includes(toolName)) return true;
  const enabledTools = config.enabledRuntimeTools;
  if (!enabledTools || enabledTools.length === 0) return true;
  return enabledTools.includes(toolName);
}

function setAllRuntimeToolsEnabled(config: ProfileToolConfig, enabled: boolean): ProfileToolConfig {
  return {
    ...config,
    enabledRuntimeTools: enabled ? [] : [...ESSENTIAL_RUNTIME_TOOL_NAMES],
  };
}

function toggleRuntimeToolConfig(config: ProfileToolConfig, toolName: string, allToolNames: string[]): ProfileToolConfig {
  if (ESSENTIAL_RUNTIME_TOOL_NAMES.includes(toolName)) return config;
  const currentEnabled = config.enabledRuntimeTools ?? [];

  if (currentEnabled.length === 0) {
    return {
      ...config,
      enabledRuntimeTools: allToolNames.filter(name => name !== toolName),
    };
  }

  const enabled = new Set(currentEnabled);
  if (enabled.has(toolName)) {
    enabled.delete(toolName);
  } else {
    enabled.add(toolName);
  }

  const nextEnabled = allToolNames.filter(name => enabled.has(name));
  return {
    ...config,
    enabledRuntimeTools: allToolNames.length > 0 && allToolNames.every(name => enabled.has(name)) ? [] : nextEnabled,
  };
}

function getSelectedModelProvider(modelConfig: AgentModelConfigFields): AgentModelProvider {
  return modelConfig.agentProviderId || modelConfig.mcpToolsProviderId || 'openai';
}

function getAgentModelValue(modelConfig: AgentModelConfigFields, provider: AgentModelProvider): string {
  return modelConfig[MODEL_KEY_BY_PROVIDER[provider]] || modelConfig[MCP_MODEL_KEY_BY_PROVIDER[provider]] || '';
}

function updateAgentModelProvider(modelConfig: AgentModelConfigFields, provider: AgentModelProvider): AgentModelConfigFields {
  return {
    ...modelConfig,
    agentProviderId: provider,
    mcpToolsProviderId: provider,
  };
}

function updateAgentModelValue(modelConfig: AgentModelConfigFields, provider: AgentModelProvider, model: string): AgentModelConfigFields {
  const agentKey = MODEL_KEY_BY_PROVIDER[provider];
  const mcpKey = MCP_MODEL_KEY_BY_PROVIDER[provider];
  return {
    ...modelConfig,
    agentProviderId: provider,
    mcpToolsProviderId: provider,
    [agentKey]: model,
    [mcpKey]: model,
  };
}

function detectPresetKey(formData: AgentConnectionFormFields): AgentProfilePresetKey | undefined {
  const args = formData.connectionArgs.trim();
  if (formData.connectionType === 'acpx' && formData.connectionCommand === 'auggie' && args === '--acp') return 'auggie';
  if (formData.connectionType === 'acpx' && formData.connectionCommand === 'claude-code-acp') return 'claude-code';
  if (formData.connectionType === 'acpx' && formData.connectionCommand === 'codex-acp') return 'codex';
  if (formData.connectionType === 'acpx' && formData.connectionCommand === 'opencode' && args === 'acp') return 'opencode';
  return undefined;
}

function parseAgentConnectionArgs(argsText: string): string[] {
  if (!argsText.trim()) return [];
  return parseShellCommand(`agent ${argsText}`).args;
}

export default function AgentEditScreen({ navigation, route }: any) {
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
  const [mcpToolsByServer, setMcpToolsByServer] = useState<Record<string, OperatorMCPToolSummary[]>>({});
  const [isLoadingCapabilities, setIsLoadingCapabilities] = useState(false);
  const [isMcpToolsLoading, setIsMcpToolsLoading] = useState(false);
  const [isVerifyingCommand, setIsVerifyingCommand] = useState(false);
  const [commandVerification, setCommandVerification] = useState<VerifyExternalAgentCommandResponse | null>(null);
  const [newPropertyKey, setNewPropertyKey] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');

  const styles = useMemo(() => createStyles(theme), [theme]);

  const settingsClient = useMemo(() => {
    if (config.baseUrl && config.apiKey) {
      return new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
    }
    return null;
  }, [config.baseUrl, config.apiKey]);
  const displaySkills = useMemo(() => [...skills].sort((a, b) => a.name.localeCompare(b.name)), [skills]);
  const displaySkillIds = useMemo(() => displaySkills.map(skill => skill.id), [displaySkills]);
  const displayMcpServers = useMemo(() => [...mcpServers].sort((a, b) => a.name.localeCompare(b.name)), [mcpServers]);
  const displayMcpServerNames = useMemo(() => displayMcpServers.map(server => server.name), [displayMcpServers]);
  const runtimeToolNames = useMemo(() => DEFAULT_RUNTIME_TOOLS.map(tool => tool.name), []);
  const selectedModelProvider = getSelectedModelProvider(formData.modelConfig);
  const selectedModelOption = AGENT_MODEL_PROVIDERS.find(provider => provider.value === selectedModelProvider) ?? AGENT_MODEL_PROVIDERS[0];
  const selectedPresetKey = detectPresetKey(formData);
  const selectedPreset = selectedPresetKey ? AGENT_PROFILE_PRESETS[selectedPresetKey] : null;

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
            avatarDataUrl: profile.avatarDataUrl ?? null,
            systemPrompt: profile.systemPrompt || '',
            guidelines: profile.guidelines || '',
            modelConfig: normalizeModelConfig(profile.modelConfig),
            toolConfig: normalizeToolConfig(profile.toolConfig),
            skillsConfig: normalizeSkillsConfig(profile.skillsConfig),
            properties: normalizeProperties(profile.properties),
            connectionType: normalizeConnectionType(profile.connection?.type || profile.connectionType),
            connectionCommand: profile.connection?.command || '',
            connectionArgs: profile.connection?.args?.join(' ') || '',
            connectionBaseUrl: profile.connection?.baseUrl || '',
            connectionCwd: profile.connection?.cwd || '',
            enabled: profile.enabled,
            autoSpawn: profile.autoSpawn || false,
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
    if (!settingsClient) return;

    let cancelled = false;
    setIsLoadingCapabilities(true);

    Promise.all([
      settingsClient.getSkills().catch(err => {
        console.warn('[AgentEdit] Failed to fetch skills:', err);
        return null;
      }),
      settingsClient.getMCPServers().catch(err => {
        console.warn('[AgentEdit] Failed to fetch MCP servers:', err);
        return null;
      }),
    ]).then(([skillsRes, serversRes]) => {
      if (cancelled) return;
      if (skillsRes) setSkills(skillsRes.skills);
      if (serversRes) setMcpServers(serversRes.servers);
    }).finally(() => {
      if (!cancelled) setIsLoadingCapabilities(false);
    });

    return () => {
      cancelled = true;
    };
  }, [settingsClient]);

  useEffect(() => {
    if (!settingsClient || displayMcpServers.length === 0) {
      setMcpToolsByServer({});
      setIsMcpToolsLoading(false);
      return;
    }

    let cancelled = false;
    setIsMcpToolsLoading(true);
    Promise.all(displayMcpServers.map(async (server) => {
      try {
        const res = await settingsClient.getOperatorMCPTools(server.name);
        const tools = res.tools
          .filter((tool) => tool.sourceKind === 'mcp')
          .sort((a, b) => a.name.localeCompare(b.name));
        return [server.name, tools] as const;
      } catch (err) {
        console.warn(`[AgentEdit] Failed to fetch MCP tools for ${server.name}:`, err);
        return [server.name, []] as const;
      }
    })).then((entries) => {
      if (!cancelled) setMcpToolsByServer(Object.fromEntries(entries));
    }).finally(() => {
      if (!cancelled) setIsMcpToolsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [displayMcpServers, settingsClient]);

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
            avatarDataUrl: formData.avatarDataUrl ?? null,
            systemPrompt: formData.systemPrompt.trim() || undefined,
            guidelines: formData.guidelines.trim() || undefined,
            modelConfig: formData.modelConfig,
            toolConfig: formData.toolConfig,
            skillsConfig: formData.skillsConfig,
            properties: normalizeProperties(formData.properties),
            ...connectionFields,
            enabled: formData.enabled,
            autoSpawn: formData.autoSpawn,
          };
        await settingsClient.updateAgentProfile(agentId, updateData);
      } else {
        const createData: AgentProfileCreateRequest = {
          displayName: formData.displayName.trim(),
          description: formData.description.trim() || undefined,
          avatarDataUrl: formData.avatarDataUrl ?? null,
          systemPrompt: formData.systemPrompt.trim() || undefined,
          guidelines: formData.guidelines.trim() || undefined,
          modelConfig: formData.modelConfig,
          toolConfig: formData.toolConfig,
          skillsConfig: formData.skillsConfig,
          properties: normalizeProperties(formData.properties),
          ...connectionFields,
          enabled: formData.enabled,
          autoSpawn: formData.autoSpawn,
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
  const isBuiltInAgent = originalProfile?.isBuiltIn === true;

  const pickAgentAvatar = useCallback(async () => {
    if (isBuiltInAgent) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const base64 = asset.base64;
      if (!base64) {
        Alert.alert('Avatar unavailable', 'The selected image did not include image data. Try another image.');
        return;
      }

      const fileSizeBytes = typeof asset.fileSize === 'number' && asset.fileSize > 0
        ? asset.fileSize
        : getApproxBase64Bytes(base64);
      if (fileSizeBytes > MAX_AGENT_AVATAR_FILE_SIZE_BYTES) {
        Alert.alert('Avatar too large', 'Choose an image smaller than 2 MB.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        avatarDataUrl: buildAgentAvatarDataUrl(base64, asset.mimeType),
      }));
    } catch (err: any) {
      console.error('[AgentEdit] Failed to pick avatar:', err);
      Alert.alert('Avatar unavailable', err?.message || 'Could not open the image picker.');
    }
  }, [isBuiltInAgent]);

  const removeAgentAvatar = useCallback(() => {
    if (isBuiltInAgent) return;
    setFormData(prev => ({ ...prev, avatarDataUrl: null }));
  }, [isBuiltInAgent]);

  const handleConnectionTypeSelect = useCallback((connectionType: ConnectionType) => {
    setFormData(prev => applyConnectionTypeChange(prev, connectionType));
    setCommandVerification(null);
  }, []);

  const applyAgentPreset = useCallback((presetKey: AgentProfilePresetKey) => {
    if (isBuiltInAgent) return;
    const preset = AGENT_PROFILE_PRESETS[presetKey];
    setCommandVerification(null);
    setFormData(prev => ({
      ...prev,
      displayName: preset.displayName,
      description: preset.description,
      connectionType: 'acpx',
      connectionCommand: preset.connectionCommand,
      connectionArgs: preset.connectionArgs,
      connectionBaseUrl: '',
      connectionCwd: '',
      enabled: true,
    }));
  }, [isBuiltInAgent]);

  const handleVerifyExternalAgentCommand = useCallback(async () => {
    if (!settingsClient || isBuiltInAgent) return;
    const command = formData.connectionCommand.trim();
    if (!command) {
      Alert.alert('Command required', 'Add a command before verifying this agent setup.');
      return;
    }

    setIsVerifyingCommand(true);
    setCommandVerification(null);
    try {
      const result = await settingsClient.verifyExternalAgentCommand({
        command,
        args: parseAgentConnectionArgs(formData.connectionArgs),
        cwd: formData.connectionCwd.trim() || undefined,
        probeArgs: selectedPreset?.verifyArgs,
      });
      setCommandVerification(result);
    } catch (err: any) {
      console.error('[AgentEdit] Failed to verify external agent command:', err);
      setCommandVerification({
        ok: false,
        error: err?.message || 'Failed to verify this command.',
      });
    } finally {
      setIsVerifyingCommand(false);
    }
  }, [formData.connectionArgs, formData.connectionCommand, formData.connectionCwd, isBuiltInAgent, selectedPreset?.verifyArgs, settingsClient]);

  const handleModelProviderSelect = useCallback((provider: AgentModelProvider) => {
    if (isBuiltInAgent) return;
    setFormData(prev => ({
      ...prev,
      modelConfig: updateAgentModelProvider(prev.modelConfig, provider),
    }));
  }, [isBuiltInAgent]);

  const handleModelValueChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      modelConfig: updateAgentModelValue(prev.modelConfig, getSelectedModelProvider(prev.modelConfig), value),
    }));
  }, []);

  const setAllSkills = useCallback((enabled: boolean) => {
    if (isBuiltInAgent) return;
    setFormData(prev => ({
      ...prev,
      skillsConfig: setAllSkillsEnabled(enabled),
    }));
  }, [isBuiltInAgent]);

  const toggleSkill = useCallback((skillId: string) => {
    if (isBuiltInAgent) return;
    setFormData(prev => ({
      ...prev,
      skillsConfig: toggleSkillConfig(prev.skillsConfig, skillId, displaySkillIds),
    }));
  }, [displaySkillIds, isBuiltInAgent]);

  const setAllMcpServers = useCallback((enabled: boolean) => {
    if (isBuiltInAgent) return;
    setFormData(prev => ({
      ...prev,
      toolConfig: {
        ...prev.toolConfig,
        ...setAllMcpServersEnabled(enabled),
      },
    }));
  }, [isBuiltInAgent]);

  const toggleMcpServer = useCallback((serverName: string) => {
    if (isBuiltInAgent) return;
    setFormData(prev => ({
      ...prev,
      toolConfig: toggleMcpServerConfig(prev.toolConfig, serverName, displayMcpServerNames),
    }));
  }, [displayMcpServerNames, isBuiltInAgent]);

  const toggleMcpTool = useCallback((toolName: string) => {
    if (isBuiltInAgent) return;
    setFormData(prev => ({
      ...prev,
      toolConfig: toggleMcpToolConfig(prev.toolConfig, toolName),
    }));
  }, [isBuiltInAgent]);

  const setAllRuntimeTools = useCallback((enabled: boolean) => {
    if (isBuiltInAgent) return;
    setFormData(prev => ({
      ...prev,
      toolConfig: setAllRuntimeToolsEnabled(prev.toolConfig, enabled),
    }));
  }, [isBuiltInAgent]);

  const toggleRuntimeTool = useCallback((toolName: string) => {
    if (isBuiltInAgent || ESSENTIAL_RUNTIME_TOOL_NAMES.includes(toolName)) return;
    setFormData(prev => ({
      ...prev,
      toolConfig: toggleRuntimeToolConfig(prev.toolConfig, toolName, runtimeToolNames),
    }));
  }, [isBuiltInAgent, runtimeToolNames]);

  const updatePropertyValue = useCallback((key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [key]: value,
      },
    }));
  }, []);

  const removeProperty = useCallback((key: string) => {
    if (isBuiltInAgent) return;
    setFormData(prev => {
      const nextProperties = { ...prev.properties };
      delete nextProperties[key];
      return { ...prev, properties: nextProperties };
    });
  }, [isBuiltInAgent]);

  const addProperty = useCallback(() => {
    if (isBuiltInAgent) return;
    const key = newPropertyKey.trim();
    if (!key) return;
    setFormData(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [key]: newPropertyValue.trim(),
      },
    }));
    setNewPropertyKey('');
    setNewPropertyValue('');
  }, [isBuiltInAgent, newPropertyKey, newPropertyValue]);

  const customSystemPromptActive = formData.systemPrompt.trim().length > 0;

  // Check if connection fields should be shown
  const showCommandFields = formData.connectionType === 'acpx';
  const showRemoteBaseUrlField = formData.connectionType === 'remote';
  const avatarInitial = (formData.displayName.trim() || 'A').slice(0, 1).toUpperCase();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading agent...</Text>
      </View>
    );
  }

  return (
    <AppShellEditorLayout
      title={getAppShellEditorTitle('agent', isEditing)}
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

      <View style={styles.avatarRow}>
        <View style={styles.avatarPreview}>
          {formData.avatarDataUrl ? (
            <Image
              source={{ uri: formData.avatarDataUrl }}
              style={styles.avatarImage}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Text style={styles.avatarInitial}>{avatarInitial}</Text>
          )}
        </View>
        <View style={styles.avatarControls}>
          <Text style={styles.avatarLabel}>Agent avatar</Text>
          <View style={styles.avatarButtonRow}>
            <TouchableOpacity
              style={[styles.chipButton, isBuiltInAgent && styles.chipButtonDisabled]}
              onPress={pickAgentAvatar}
              disabled={isBuiltInAgent}
              accessibilityRole="button"
              accessibilityState={{ disabled: isBuiltInAgent }}
              accessibilityLabel={createButtonAccessibilityLabel('Choose agent avatar')}
            >
              <Text style={styles.chipButtonText}>Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chipButton, (!formData.avatarDataUrl || isBuiltInAgent) && styles.chipButtonDisabled]}
              onPress={removeAgentAvatar}
              disabled={!formData.avatarDataUrl || isBuiltInAgent}
              accessibilityRole="button"
              accessibilityState={{ disabled: !formData.avatarDataUrl || isBuiltInAgent }}
              accessibilityLabel={createButtonAccessibilityLabel('Remove agent avatar')}
            >
              <Text style={styles.chipButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {!isEditing && (
        <View style={styles.capabilitySection}>
          <Text style={styles.sectionTitle}>Agent presets</Text>
          <Text style={styles.sectionHelperText}>Start from a known external agent setup, then adjust the command or working directory.</Text>
          <View style={styles.avatarButtonRow}>
            {Object.entries(AGENT_PROFILE_PRESETS).map(([key, preset]) => {
              const selected = selectedPresetKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chipButton, selected && styles.chipButtonActive, isBuiltInAgent && styles.chipButtonDisabled]}
                  onPress={() => applyAgentPreset(key as AgentProfilePresetKey)}
                  disabled={isBuiltInAgent}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: isBuiltInAgent }}
                  accessibilityLabel={createButtonAccessibilityLabel(`Use ${preset.displayName} agent preset`)}
                >
                  <Text style={[styles.chipButtonText, selected && styles.chipButtonTextActive]}>{preset.displayName}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
            onChangeText={v => {
              setCommandVerification(null);
              updateField('connectionCommand', v);
            }}
            placeholder="node"
            placeholderTextColor={theme.colors.mutedForeground}
            autoCapitalize="none"
            editable={!isBuiltInAgent}
          />
          <Text style={styles.label}>Arguments</Text>
          <TextInput
            style={styles.input}
            value={formData.connectionArgs}
            onChangeText={v => {
              setCommandVerification(null);
              updateField('connectionArgs', v);
            }}
            placeholder="agent.js --port 3000"
            placeholderTextColor={theme.colors.mutedForeground}
            autoCapitalize="none"
            editable={!isBuiltInAgent}
          />
          <Text style={styles.label}>Working Directory</Text>
          <TextInput
            style={styles.input}
            value={formData.connectionCwd}
            onChangeText={v => {
              setCommandVerification(null);
              updateField('connectionCwd', v);
            }}
            placeholder="/path/to/agent"
            placeholderTextColor={theme.colors.mutedForeground}
            autoCapitalize="none"
            editable={!isBuiltInAgent}
          />
          {selectedPreset && (
            <View style={styles.presetHintList}>
              <Text style={styles.skillDescription}>{selectedPreset.displayName} setup</Text>
              {selectedPreset.installCommand ? <Text style={styles.presetHintText}>Install: {selectedPreset.installCommand}</Text> : null}
              {selectedPreset.authHint ? <Text style={styles.presetHintText}>Auth: {selectedPreset.authHint}</Text> : null}
              {selectedPreset.cwdHint ? <Text style={styles.presetHintText}>Working directory: {selectedPreset.cwdHint}</Text> : null}
            </View>
          )}
          <View style={styles.verificationContainer}>
            <TouchableOpacity
              style={[styles.chipButton, (!formData.connectionCommand.trim() || isVerifyingCommand || isBuiltInAgent) && styles.chipButtonDisabled]}
              onPress={handleVerifyExternalAgentCommand}
              disabled={!formData.connectionCommand.trim() || isVerifyingCommand || isBuiltInAgent}
              accessibilityRole="button"
              accessibilityState={{ disabled: !formData.connectionCommand.trim() || isVerifyingCommand || isBuiltInAgent }}
              accessibilityLabel={createButtonAccessibilityLabel('Verify external agent setup')}
            >
              <Text style={styles.chipButtonText}>{isVerifyingCommand ? 'Verifying...' : 'Verify setup'}</Text>
            </TouchableOpacity>
            {commandVerification && (
              <View style={[
                styles.verificationResult,
                commandVerification.ok ? styles.verificationResultSuccess : styles.verificationResultWarning,
              ]}>
                <Text style={styles.verificationTitle}>
                  {commandVerification.ok ? 'Setup verified' : 'Setup needs attention'}
                </Text>
                <Text style={styles.verificationText}>
                  {commandVerification.details || commandVerification.error || 'No verification details returned.'}
                </Text>
                {commandVerification.resolvedCommand ? (
                  <Text style={styles.verificationMetaText}>Resolved command: {commandVerification.resolvedCommand}</Text>
                ) : null}
                {commandVerification.warnings?.map((warning, index) => (
                  <Text key={`${warning}-${index}`} style={styles.verificationMetaText}>{warning}</Text>
                ))}
              </View>
            )}
          </View>
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

      {customSystemPromptActive && !isBuiltInAgent && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>Custom system prompt active</Text>
          <Text style={styles.warningDetailText}>
            This agent is using a saved system prompt snapshot and will not receive DotAgents default system prompt updates until you reset it.
          </Text>
          <TouchableOpacity
            style={styles.warningActionButton}
            onPress={() => updateField('systemPrompt', '')}
            accessibilityRole="button"
            accessibilityLabel="Reset custom system prompt to default"
          >
            <Text style={styles.warningActionButtonText}>Reset to default</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={styles.sectionTitle}>Model override</Text>
          <Text style={styles.sectionHelperText}>Leave blank to use the desktop default. Set a value here when this agent needs a specific model.</Text>
          <View style={styles.avatarButtonRow}>
            {AGENT_MODEL_PROVIDERS.map(provider => {
              const selected = selectedModelProvider === provider.value;
              return (
                <TouchableOpacity
                  key={provider.value}
                  style={[styles.chipButton, selected && styles.chipButtonActive, isBuiltInAgent && styles.chipButtonDisabled]}
                  onPress={() => handleModelProviderSelect(provider.value)}
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
          <TextInput
            style={styles.input}
            value={getAgentModelValue(formData.modelConfig, selectedModelProvider)}
            onChangeText={handleModelValueChange}
            placeholder={selectedModelOption.placeholder}
            placeholderTextColor={theme.colors.mutedForeground}
            autoCapitalize="none"
            editable={!isBuiltInAgent}
          />
        </View>
      )}

      <View style={styles.capabilitySection}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <Text style={styles.sectionCountText}>{displaySkills.filter(skill => isSkillEnabledForAgent(formData.skillsConfig, skill.id)).length}/{displaySkills.length}</Text>
        </View>
        <View style={styles.skillBulkActions}>
          <TouchableOpacity
            style={[styles.chipButton, isBuiltInAgent && styles.chipButtonDisabled]}
            onPress={() => setAllSkills(true)}
            disabled={isBuiltInAgent}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel('Enable all agent skills')}
          >
            <Text style={styles.chipButtonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chipButton, isBuiltInAgent && styles.chipButtonDisabled]}
            onPress={() => setAllSkills(false)}
            disabled={isBuiltInAgent}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel('Disable all agent skills')}
          >
            <Text style={styles.chipButtonText}>None</Text>
          </TouchableOpacity>
        </View>
        {isLoadingCapabilities && displaySkills.length === 0 ? (
          <Text style={styles.sectionHelperText}>Loading skills...</Text>
        ) : displaySkills.length === 0 ? (
          <Text style={styles.sectionHelperText}>No skills configured.</Text>
        ) : displaySkills.map(skill => {
          const enabled = isSkillEnabledForAgent(formData.skillsConfig, skill.id);
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
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>MCP servers</Text>
          <Text style={styles.sectionCountText}>{displayMcpServers.filter(server => isMcpServerEnabledForAgent(formData.toolConfig, server.name)).length}/{displayMcpServers.length}</Text>
        </View>
        <View style={styles.skillBulkActions}>
          <TouchableOpacity
            style={[styles.chipButton, isBuiltInAgent && styles.chipButtonDisabled]}
            onPress={() => setAllMcpServers(true)}
            disabled={isBuiltInAgent}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel('Enable all agent MCP servers')}
          >
            <Text style={styles.chipButtonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chipButton, isBuiltInAgent && styles.chipButtonDisabled]}
            onPress={() => setAllMcpServers(false)}
            disabled={isBuiltInAgent}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel('Disable all agent MCP servers')}
          >
            <Text style={styles.chipButtonText}>None</Text>
          </TouchableOpacity>
        </View>
        {isLoadingCapabilities && displayMcpServers.length === 0 ? (
          <Text style={styles.sectionHelperText}>Loading MCP servers...</Text>
        ) : displayMcpServers.length === 0 ? (
          <Text style={styles.sectionHelperText}>No MCP servers configured.</Text>
        ) : displayMcpServers.map(server => {
          const enabled = isMcpServerEnabledForAgent(formData.toolConfig, server.name);
          const tools = mcpToolsByServer[server.name] ?? [];
          const enabledToolCount = countEnabledMcpTools(formData.toolConfig, tools.map(tool => tool.name));
          return (
            <View key={server.name}>
              <View style={styles.skillRow}>
                <View style={styles.skillInfo}>
                  <Text style={styles.skillName}>{server.name}</Text>
                  <Text style={styles.skillDescription} numberOfLines={2}>
                    {server.connected ? 'Connected' : 'Offline'} - {enabledToolCount}/{tools.length || server.toolCount} tool{server.toolCount === 1 ? '' : 's'} enabled
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
              {isMcpToolsLoading && tools.length === 0 ? (
                <Text style={styles.sectionHelperText}>Loading tools...</Text>
              ) : enabled && tools.length > 0 ? (
                <View style={styles.mcpToolList}>
                  {tools.map(tool => {
                    const toolEnabled = isMcpToolEnabledForAgent(formData.toolConfig, tool.name);
                    return (
                      <View key={tool.name} style={styles.mcpToolRow}>
                        <View style={styles.skillInfo}>
                          <Text style={styles.mcpToolName}>{tool.name}</Text>
                          {tool.description ? <Text style={styles.mcpToolDescription} numberOfLines={2}>{tool.description}</Text> : null}
                        </View>
                        <Switch
                          value={toolEnabled}
                          onValueChange={() => toggleMcpTool(tool.name)}
                          disabled={isBuiltInAgent || !enabled}
                          accessibilityLabel={createButtonAccessibilityLabel(`${toolEnabled ? 'Disable' : 'Enable'} ${tool.name} MCP tool for this agent`)}
                          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                          thumbColor={toolEnabled ? theme.colors.primaryForeground : theme.colors.background}
                        />
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.capabilitySection}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Runtime tools</Text>
          <Text style={styles.sectionCountText}>{DEFAULT_RUNTIME_TOOLS.filter(tool => isRuntimeToolEnabledForAgent(formData.toolConfig, tool.name)).length}/{DEFAULT_RUNTIME_TOOLS.length}</Text>
        </View>
        <View style={styles.skillBulkActions}>
          <TouchableOpacity
            style={[styles.chipButton, isBuiltInAgent && styles.chipButtonDisabled]}
            onPress={() => setAllRuntimeTools(true)}
            disabled={isBuiltInAgent}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel('Enable all agent runtime tools')}
          >
            <Text style={styles.chipButtonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chipButton, isBuiltInAgent && styles.chipButtonDisabled]}
            onPress={() => setAllRuntimeTools(false)}
            disabled={isBuiltInAgent}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel('Disable nonessential agent runtime tools')}
          >
            <Text style={styles.chipButtonText}>Essential</Text>
          </TouchableOpacity>
        </View>
        {DEFAULT_RUNTIME_TOOLS.map(tool => {
          const enabled = isRuntimeToolEnabledForAgent(formData.toolConfig, tool.name);
          const disabled = isBuiltInAgent || tool.essential === true;
          return (
            <View key={tool.name} style={styles.skillRow}>
              <View style={styles.skillInfo}>
                <Text style={styles.skillName}>{tool.name}{tool.essential ? ' (essential)' : ''}</Text>
                <Text style={styles.skillDescription} numberOfLines={2}>{tool.description}</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={() => toggleRuntimeTool(tool.name)}
                disabled={disabled}
                accessibilityLabel={createButtonAccessibilityLabel(`${enabled ? 'Disable' : 'Enable'} ${tool.name} runtime tool for this agent`)}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={enabled ? theme.colors.primaryForeground : theme.colors.background}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.capabilitySection}>
        <Text style={styles.sectionTitle}>Properties</Text>
        {Object.entries(formData.properties).length === 0 ? (
          <Text style={styles.sectionHelperText}>No custom properties.</Text>
        ) : Object.entries(formData.properties).map(([key, value]) => (
          <View key={key} style={styles.propertyRow}>
            <View style={styles.propertyInputs}>
              <Text style={styles.propertyKey}>{key}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={v => updatePropertyValue(key, v)}
                placeholder="Value"
                placeholderTextColor={theme.colors.mutedForeground}
                editable={!isBuiltInAgent}
              />
            </View>
            <TouchableOpacity
              style={[styles.propertyRemoveButton, isBuiltInAgent && styles.chipButtonDisabled]}
              onPress={() => removeProperty(key)}
              disabled={isBuiltInAgent}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(`Remove ${key} property`)}
            >
              <Text style={styles.propertyRemoveText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.propertyAddRow}>
          <TextInput
            style={[styles.input, styles.propertyAddInput]}
            value={newPropertyKey}
            onChangeText={setNewPropertyKey}
            placeholder="Key"
            placeholderTextColor={theme.colors.mutedForeground}
            autoCapitalize="none"
            editable={!isBuiltInAgent}
          />
          <TextInput
            style={[styles.input, styles.propertyAddInput]}
            value={newPropertyValue}
            onChangeText={setNewPropertyValue}
            placeholder="Value"
            placeholderTextColor={theme.colors.mutedForeground}
            editable={!isBuiltInAgent}
          />
        </View>
        <TouchableOpacity
          style={[styles.propertyAddButton, (!newPropertyKey.trim() || isBuiltInAgent) && styles.chipButtonDisabled]}
          onPress={addProperty}
          disabled={!newPropertyKey.trim() || isBuiltInAgent}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel('Add agent property')}
        >
          <Text style={styles.chipButtonText}>Add property</Text>
        </TouchableOpacity>
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
    </AppShellEditorLayout>
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
    warningDetailText: {
      color: '#92400e',
      fontSize: 13,
      lineHeight: 18,
      marginTop: spacing.xs,
    },
    warningActionButton: {
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: '#f59e0b',
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    warningActionButtonText: {
      color: '#92400e',
      fontSize: 13,
      fontWeight: '600',
    },
    avatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    avatarPreview: {
      width: 64,
      height: 64,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarInitial: {
      color: theme.colors.foreground,
      fontSize: 24,
      fontWeight: '700',
    },
    avatarControls: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    avatarLabel: {
      color: theme.colors.foreground,
      fontSize: 14,
      fontWeight: '600',
    },
    avatarButtonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    chipButton: {
      minHeight: 32,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    chipButtonDisabled: {
      opacity: 0.45,
    },
    chipButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipButtonText: {
      color: theme.colors.foreground,
      fontSize: 13,
      fontWeight: '600',
    },
    chipButtonTextActive: {
      color: theme.colors.primaryForeground,
    },
    capabilitySection: {
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: spacing.sm,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    sectionTitle: {
      color: theme.colors.foreground,
      fontSize: 15,
      fontWeight: '700',
    },
    sectionCountText: {
      color: theme.colors.mutedForeground,
      fontSize: 12,
      fontWeight: '600',
    },
    skillBulkActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    presetHintList: {
      gap: 2,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    presetHintText: {
      color: theme.colors.mutedForeground,
      fontSize: 12,
      lineHeight: 16,
    },
    verificationContainer: {
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    verificationResult: {
      padding: spacing.sm,
      borderWidth: 1,
      borderRadius: radius.md,
      gap: 2,
    },
    verificationResultSuccess: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    verificationResultWarning: {
      borderColor: '#f59e0b',
      backgroundColor: '#f59e0b12',
    },
    verificationTitle: {
      color: theme.colors.foreground,
      fontSize: 13,
      fontWeight: '700',
    },
    verificationText: {
      color: theme.colors.foreground,
      fontSize: 12,
      lineHeight: 16,
    },
    verificationMetaText: {
      color: theme.colors.mutedForeground,
      fontSize: 12,
      lineHeight: 16,
    },
    skillRow: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.xs,
    },
    skillInfo: {
      flex: 1,
      minWidth: 0,
    },
    skillName: {
      color: theme.colors.foreground,
      fontSize: 13,
      fontWeight: '600',
    },
    skillDescription: {
      color: theme.colors.mutedForeground,
      fontSize: 12,
      lineHeight: 16,
      marginTop: 2,
    },
    mcpToolList: {
      marginLeft: spacing.md,
      paddingLeft: spacing.sm,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
      gap: spacing.xs,
    },
    mcpToolRow: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.xs,
    },
    mcpToolName: {
      color: theme.colors.foreground,
      fontSize: 12,
      fontWeight: '600',
    },
    mcpToolDescription: {
      color: theme.colors.mutedForeground,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 2,
    },
    propertyRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    propertyInputs: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    propertyKey: {
      color: theme.colors.foreground,
      fontSize: 13,
      fontWeight: '700',
    },
    propertyRemoveButton: {
      ...createMinimumTouchTargetStyle({
        minSize: 44,
        horizontalPadding: spacing.sm,
        verticalPadding: spacing.xs,
        horizontalMargin: 0,
      }),
      alignSelf: 'flex-end',
    },
    propertyRemoveText: {
      color: theme.colors.destructive,
      fontSize: 12,
      fontWeight: '600',
    },
    propertyAddRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    propertyAddInput: {
      flex: 1,
      minWidth: 0,
    },
    propertyAddButton: {
      alignSelf: 'flex-start',
      minHeight: 36,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
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
