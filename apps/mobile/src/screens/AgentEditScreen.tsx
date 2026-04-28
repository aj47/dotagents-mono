import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius } from '../ui/theme';
import { ExtendedSettingsApiClient, AgentProfileFull, AgentProfileCreateRequest, AgentProfileUpdateRequest } from '../lib/settingsApi';
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

interface AgentFormData extends AgentConnectionFormFields {
  displayName: string;
  description: string;
  systemPrompt: string;
  guidelines: string;
  enabled: boolean;
  autoSpawn: boolean;
}

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

  const styles = useMemo(() => createStyles(theme), [theme]);

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
          });
        })
        .catch(err => {
          console.error('[AgentEdit] Failed to fetch profile:', err);
          setError(err.message || 'Failed to load agent');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isEditing, settingsClient, agentId]);

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
