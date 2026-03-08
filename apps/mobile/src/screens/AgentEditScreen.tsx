import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius } from '../ui/theme';
import {
  createButtonAccessibilityLabel,
  createMinimumTouchTargetStyle,
  createSwitchAccessibilityLabel,
  createTextInputAccessibilityLabel,
} from '../lib/accessibility';
import { ExtendedSettingsApiClient, AgentProfileFull, AgentProfileCreateRequest, AgentProfileUpdateRequest } from '../lib/settingsApi';
import { useConfigContext } from '../store/config';

const CONNECTION_TYPES = [
  { label: 'Internal', value: 'internal' },
  { label: 'ACP', value: 'acp' },
  { label: 'Stdio', value: 'stdio' },
  { label: 'Remote', value: 'remote' },
] as const;

type ConnectionType = 'internal' | 'acp' | 'stdio' | 'remote';

interface AgentFormData {
  displayName: string;
  description: string;
  systemPrompt: string;
  guidelines: string;
  connectionType: ConnectionType;
  connectionCommand: string;
  connectionArgs: string;
  connectionBaseUrl: string;
  connectionCwd: string;
  enabled: boolean;
  autoSpawn: boolean;
}

type AgentConnectionFields = Pick<
  AgentFormData,
  'connectionCommand' | 'connectionArgs' | 'connectionBaseUrl' | 'connectionCwd'
>;

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

const CONNECTION_TYPE_DETAILS: Record<ConnectionType, { helperText: string; accessibilityHint: string }> = {
  internal: {
    helperText: 'Uses the built-in DotAgents agent for this profile.',
    accessibilityHint: 'Uses the built-in DotAgents agent for this profile.',
  },
  acp: {
    helperText: 'Runs an ACP-compatible agent from a local command.',
    accessibilityHint: 'Runs an ACP-compatible agent from a local command.',
  },
  stdio: {
    helperText: 'Starts a local process and communicates over stdio.',
    accessibilityHint: 'Starts a local process and communicates over stdio.',
  },
  remote: {
    helperText: 'Connects to a remote HTTP agent endpoint.',
    accessibilityHint: 'Connects to a remote HTTP agent endpoint.',
  },
};

function getConnectionFieldsForType(
  connectionType: ConnectionType,
  fields: AgentConnectionFields,
): AgentConnectionFields {
  const trimmedFields: AgentConnectionFields = {
    connectionCommand: fields.connectionCommand.trim(),
    connectionArgs: fields.connectionArgs.trim(),
    connectionBaseUrl: fields.connectionBaseUrl.trim(),
    connectionCwd: fields.connectionCwd.trim(),
  };

  if (connectionType === 'remote') {
    return {
      connectionCommand: '',
      connectionArgs: '',
      connectionBaseUrl: trimmedFields.connectionBaseUrl,
      connectionCwd: '',
    };
  }

  if (connectionType === 'acp' || connectionType === 'stdio') {
    return {
      connectionCommand: trimmedFields.connectionCommand,
      connectionArgs: trimmedFields.connectionArgs,
      connectionBaseUrl: '',
      connectionCwd: trimmedFields.connectionCwd,
    };
  }

  return {
    connectionCommand: '',
    connectionArgs: '',
    connectionBaseUrl: '',
    connectionCwd: '',
  };
}

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
            connectionType: profile.connection?.type || profile.connectionType || 'internal',
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
    if (!settingsClient) {
      setError('Configure Base URL and API key in Settings before saving');
      return;
    }
    if (!formData.displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    const connectionFieldValues = getConnectionFieldsForType(formData.connectionType, {
      connectionCommand: formData.connectionCommand,
      connectionArgs: formData.connectionArgs,
      connectionBaseUrl: formData.connectionBaseUrl,
      connectionCwd: formData.connectionCwd,
    });

    setIsSaving(true);
    setError(null);

    try {
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
            connectionType: formData.connectionType,
            ...connectionFieldValues,
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
          connectionType: formData.connectionType,
          ...connectionFieldValues,
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

  const renderSwitchVisual = (enabled: boolean) => {
    if (Platform.OS === 'web') {
      return (
        <View
          style={[styles.switchTrack, enabled && styles.switchTrackActive]}
          accessible={false}
        >
          <View
            style={[styles.switchThumb, enabled && styles.switchThumbActive]}
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

  const isBuiltInAgent = originalProfile?.isBuiltIn === true;

  // Check if connection fields should be shown
  const showConnectionFields = formData.connectionType !== 'internal';
  const showCommandFields = formData.connectionType === 'acp' || formData.connectionType === 'stdio';
  const supportsAutoSpawn = showCommandFields;
  const showBaseUrlField = formData.connectionType === 'remote';
  const selectedConnectionTypeDetails = CONNECTION_TYPE_DETAILS[formData.connectionType];
  const commandPlaceholder = formData.connectionType === 'acp' ? 'claude-code-acp' : 'node';
  const argumentsPlaceholder = formData.connectionType === 'acp' ? '--acp' : 'agent.js --port 3000';
  const builtInWarningText = supportsAutoSpawn
    ? '⚠️ Built-in agents keep their name, connection, and prompts. You can still update guidelines, enabled, and auto spawn.'
    : '⚠️ Built-in agents keep their name, connection, and prompts. You can still update guidelines and enabled state.';
  const hasDisplayName = formData.displayName.trim().length > 0;
  const saveValidationMessage = !hasDisplayName
    ? 'Add a display name to enable saving.'
    : null;
  const isSaveDisabled = isSaving || !settingsClient || !!saveValidationMessage;
  const saveHelperMessage = !settingsClient
    ? 'Configure Base URL and API key in Settings to save this agent.'
    : saveValidationMessage;
  const saveButtonAccessibilityLabel = createButtonAccessibilityLabel(isEditing ? 'Save agent changes' : 'Create agent');
  const saveButtonAccessibilityHint = !settingsClient
    ? 'Configure Base URL and API key in Settings before saving this agent.'
    : isSaving
      ? 'Saving this agent now.'
      : saveValidationMessage
        ? saveValidationMessage
      : isEditing
        ? 'Saves your changes to this agent.'
        : 'Creates this agent with the current settings.';
  const saveButtonBusyText = isEditing ? 'Saving agent…' : 'Creating agent…';
  const handleOpenConnectionSettings = useCallback(() => {
    navigation.navigate('ConnectionSettings');
  }, [navigation]);

  const renderFieldLabel = (label: string, options?: { required?: boolean; readOnly?: boolean }) => (
    <Text style={styles.label}>
      {label}
      {options?.required ? ' *' : ''}
      {options?.readOnly ? <Text style={styles.labelReadOnlyText}> · Read only</Text> : null}
    </Text>
  );

  const getReadOnlyInputAccessibilityProps = (fieldName: string) => ({
    accessibilityLabel: `${createTextInputAccessibilityLabel(fieldName)}, read only`,
    accessibilityHint: 'Built-in agents keep this field fixed here.',
  });

  const getEditableInputAccessibilityProps = (fieldName: string, hint: string) => ({
    accessibilityLabel: createTextInputAccessibilityLabel(fieldName),
    accessibilityHint: hint,
  });

  const handleConnectionTypeChange = useCallback((connectionType: ConnectionType) => {
    setFormData(prev => {
      const nextConnectionFields = getConnectionFieldsForType(connectionType, {
        connectionCommand: prev.connectionCommand,
        connectionArgs: prev.connectionArgs,
        connectionBaseUrl: prev.connectionBaseUrl,
        connectionCwd: prev.connectionCwd,
      });

      return {
        ...prev,
        connectionType,
        ...nextConnectionFields,
        autoSpawn: connectionType === 'acp' || connectionType === 'stdio' ? prev.autoSpawn : false,
      };
    });
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading agent...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {!settingsClient && (
        <View style={styles.blockingNoticeContainer}>
          <Text style={styles.blockingNoticeText}>
            Saving is disabled until Base URL and API key are configured in Settings.
          </Text>
          <TouchableOpacity
            style={styles.blockingNoticeActionButton}
            onPress={handleOpenConnectionSettings}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel('Open connection settings')}
            accessibilityHint="Opens Connection settings so you can add Base URL and API key."
            activeOpacity={0.7}
          >
            <Text style={styles.blockingNoticeActionButtonText}>Open Connection Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {isBuiltInAgent && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>{builtInWarningText}</Text>
        </View>
      )}

      {renderFieldLabel('Display Name', { required: true, readOnly: isBuiltInAgent })}
      <TextInput
        style={[styles.input, isBuiltInAgent && styles.inputReadOnly]}
        value={formData.displayName}
        onChangeText={v => updateField('displayName', v)}
        placeholder="My Agent"
        placeholderTextColor={theme.colors.mutedForeground}
        {...(isBuiltInAgent
          ? getReadOnlyInputAccessibilityProps('Display Name')
          : getEditableInputAccessibilityProps('Display Name', 'Used in the UI when choosing or assigning this agent.'))}
        editable={!isBuiltInAgent}
      />

      {renderFieldLabel('Description', { readOnly: isBuiltInAgent })}
      <TextInput
        style={[styles.input, isBuiltInAgent && styles.inputReadOnly]}
        value={formData.description}
        onChangeText={v => updateField('description', v)}
        placeholder="What this agent does..."
        placeholderTextColor={theme.colors.mutedForeground}
        multiline
        {...(isBuiltInAgent
          ? getReadOnlyInputAccessibilityProps('Description')
          : getEditableInputAccessibilityProps('Description', 'Shown only in the UI. Use Guidelines for instructions the agent should follow.'))}
        editable={!isBuiltInAgent}
      />
      <Text style={styles.helperText}>Shown only in the UI. Use Guidelines for instructions the agent should follow.</Text>

      {renderFieldLabel('Connection Type', { readOnly: isBuiltInAgent })}
      <View style={styles.connectionTypeRow}>
        {CONNECTION_TYPES.map(ct => (
          <TouchableOpacity
            key={ct.value}
            style={[
              styles.connectionTypeOption,
              formData.connectionType === ct.value && styles.connectionTypeOptionActive,
              isBuiltInAgent && styles.connectionTypeOptionReadOnly,
              isBuiltInAgent && formData.connectionType === ct.value && styles.connectionTypeOptionReadOnlyActive,
            ]}
            onPress={() => handleConnectionTypeChange(ct.value)}
            disabled={isBuiltInAgent}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel(`Use ${ct.label} connection type`)}
            accessibilityHint={
              isBuiltInAgent
                ? 'Built-in agent connections are fixed and cannot be changed here.'
                : CONNECTION_TYPE_DETAILS[ct.value].accessibilityHint
            }
            accessibilityState={{ selected: formData.connectionType === ct.value, disabled: isBuiltInAgent }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.connectionTypeText,
              formData.connectionType === ct.value && styles.connectionTypeTextActive,
              isBuiltInAgent && styles.connectionTypeTextReadOnly,
              isBuiltInAgent && formData.connectionType === ct.value && styles.connectionTypeTextReadOnlyActive,
            ]}>
              {ct.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.connectionTypeHelperText}>{selectedConnectionTypeDetails.helperText}</Text>

      {showConnectionFields && (
        <>
          {showCommandFields && (
            <>
              {renderFieldLabel('Command', { readOnly: isBuiltInAgent })}
              <TextInput
                style={[styles.input, isBuiltInAgent && styles.inputReadOnly]}
                value={formData.connectionCommand}
                onChangeText={v => updateField('connectionCommand', v)}
                placeholder={commandPlaceholder}
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                {...(isBuiltInAgent
                  ? getReadOnlyInputAccessibilityProps('Command')
                  : getEditableInputAccessibilityProps('Command', 'Runs this local agent command when the agent starts.'))}
                editable={!isBuiltInAgent}
              />
              {renderFieldLabel('Arguments', { readOnly: isBuiltInAgent })}
              <TextInput
                style={[styles.input, isBuiltInAgent && styles.inputReadOnly]}
                value={formData.connectionArgs}
                onChangeText={v => updateField('connectionArgs', v)}
                placeholder={argumentsPlaceholder}
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                {...(isBuiltInAgent
                  ? getReadOnlyInputAccessibilityProps('Arguments')
                  : getEditableInputAccessibilityProps('Arguments', 'Optional command-line arguments for this agent process.'))}
                editable={!isBuiltInAgent}
              />
              {renderFieldLabel('Working Directory', { readOnly: isBuiltInAgent })}
              <TextInput
                style={[styles.input, isBuiltInAgent && styles.inputReadOnly]}
                value={formData.connectionCwd}
                onChangeText={v => updateField('connectionCwd', v)}
                placeholder="/path/to/agent"
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                {...(isBuiltInAgent
                  ? getReadOnlyInputAccessibilityProps('Working Directory')
                  : getEditableInputAccessibilityProps('Working Directory', 'Optional working directory used before starting this agent command.'))}
                editable={!isBuiltInAgent}
              />
            </>
          )}
          {showBaseUrlField && (
            <>
              {renderFieldLabel('Base URL', { readOnly: isBuiltInAgent })}
              <TextInput
                style={[styles.input, isBuiltInAgent && styles.inputReadOnly]}
                value={formData.connectionBaseUrl}
                onChangeText={v => updateField('connectionBaseUrl', v)}
                placeholder="http://localhost:3000"
                placeholderTextColor={theme.colors.mutedForeground}
                autoCapitalize="none"
                keyboardType="url"
                {...(isBuiltInAgent
                  ? getReadOnlyInputAccessibilityProps('Base URL')
                  : getEditableInputAccessibilityProps('Base URL', 'Remote HTTP base URL for this agent.'))}
                editable={!isBuiltInAgent}
              />
            </>
          )}
        </>
      )}

      {renderFieldLabel('System Prompt', { readOnly: isBuiltInAgent })}
      <TextInput
        style={[styles.input, styles.textArea, isBuiltInAgent && styles.inputReadOnly]}
        value={formData.systemPrompt}
        onChangeText={v => updateField('systemPrompt', v)}
        placeholder="You are a helpful assistant..."
        placeholderTextColor={theme.colors.mutedForeground}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        {...(isBuiltInAgent
          ? getReadOnlyInputAccessibilityProps('System Prompt')
          : getEditableInputAccessibilityProps('System Prompt', 'Sets the core instructions this agent follows.'))}
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
        {...getEditableInputAccessibilityProps('Guidelines', 'Adds extra instructions for this agent on top of the core tool-calling system prompt.')}
      />
      <Text style={styles.helperText}>Additional instructions for this agent. These are appended to the core tool-calling system prompt.</Text>

      <View style={styles.switchRow}>
        <View style={styles.switchLabelGroup}>
          <Text style={styles.switchLabel}>Enabled</Text>
          <Text style={styles.switchHelperText}>Show this agent in delegation and ACP main-agent choices</Text>
        </View>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => updateField('enabled', !formData.enabled)}
          accessibilityRole="switch"
          accessibilityLabel={createSwitchAccessibilityLabel('Agent enabled')}
          accessibilityHint="Shows or hides this agent in delegation and ACP main-agent choices."
          accessibilityState={{ checked: formData.enabled }}
          activeOpacity={0.7}
        >
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {renderSwitchVisual(formData.enabled)}
          </View>
        </TouchableOpacity>
      </View>

      {supportsAutoSpawn && (
        <View style={styles.switchRow}>
          <View style={styles.switchLabelGroup}>
            <Text style={styles.switchLabel}>Auto Spawn</Text>
            <Text style={styles.switchHelperText}>Start this command-based agent automatically when DotAgents starts</Text>
          </View>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => updateField('autoSpawn', !formData.autoSpawn)}
            accessibilityRole="switch"
            accessibilityLabel={createSwitchAccessibilityLabel('Auto spawn')}
            accessibilityHint="Starts this command-based agent automatically when DotAgents starts."
            accessibilityState={{ checked: formData.autoSpawn }}
            activeOpacity={0.7}
          >
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {renderSwitchVisual(formData.autoSpawn)}
            </View>
          </TouchableOpacity>
        </View>
      )}

      {saveHelperMessage && (
        <Text style={styles.saveHelperText}>{saveHelperMessage}</Text>
      )}

      <TouchableOpacity
        style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaveDisabled}
        accessibilityRole="button"
        accessibilityLabel={saveButtonAccessibilityLabel}
        accessibilityHint={saveButtonAccessibilityHint}
        accessibilityState={{ disabled: isSaveDisabled, busy: isSaving }}
      >
        {isSaving ? (
          <View style={styles.saveButtonContent}>
            <ActivityIndicator color={theme.colors.primaryForeground} size="small" />
            <Text style={styles.saveButtonText}>{saveButtonBusyText}</Text>
          </View>
        ) : (
          <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Create Agent'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}


function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const selectionChipTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: spacing.md,
    verticalPadding: spacing.xs,
    horizontalMargin: 0,
  });

  const switchTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: spacing.xs,
    verticalPadding: spacing.xs,
    horizontalMargin: 0,
  });

  const noticeActionTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: spacing.md,
    verticalPadding: spacing.xs,
    horizontalMargin: 0,
  });

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
    helperText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginBottom: spacing.xs,
    },
    saveHelperText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: spacing.md,
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
    blockingNoticeContainer: {
      backgroundColor: theme.colors.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    blockingNoticeText: {
      color: theme.colors.foreground,
      fontSize: 14,
      lineHeight: 20,
    },
    blockingNoticeActionButton: {
      ...noticeActionTouchTarget,
      marginTop: spacing.sm,
      alignSelf: 'stretch',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.primary + '26',
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    blockingNoticeActionButtonText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.foreground,
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    labelReadOnlyText: {
      fontSize: 12,
      fontWeight: '400',
      color: theme.colors.mutedForeground,
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
    inputReadOnly: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.input,
    },
    textArea: {
      minHeight: 100,
    },
    connectionTypeRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    connectionTypeHelperText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: spacing.xs,
      lineHeight: 17,
    },
    connectionTypeOption: {
      ...selectionChipTouchTarget,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    connectionTypeOptionActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    connectionTypeOptionReadOnly: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.input,
    },
    connectionTypeOptionReadOnlyActive: {
      backgroundColor: theme.colors.muted,
      borderColor: theme.colors.input,
    },
    connectionTypeText: {
      fontSize: 13,
      color: theme.colors.foreground,
    },
    connectionTypeTextActive: {
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
    connectionTypeTextReadOnly: {
      color: theme.colors.mutedForeground,
    },
    connectionTypeTextReadOnlyActive: {
      color: theme.colors.foreground,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    switchLabelGroup: {
      flex: 1,
      minWidth: 0,
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
      lineHeight: 17,
    },
    switchButton: {
      ...switchTouchTarget,
      borderRadius: radius.full,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    switchTrack: {
      width: 36,
      height: 20,
      borderRadius: radius.full,
      padding: 2,
      justifyContent: 'center',
      backgroundColor: theme.colors.muted,
    },
    switchTrackActive: {
      backgroundColor: theme.colors.primary,
    },
    switchThumb: {
      width: 16,
      height: 16,
      borderRadius: radius.full,
      backgroundColor: theme.colors.background,
      transform: [{ translateX: 0 }],
    },
    switchThumbActive: {
      backgroundColor: theme.colors.primaryForeground,
      transform: [{ translateX: 16 }],
    },
    saveButton: {
      marginTop: spacing.xl,
      backgroundColor: theme.colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    saveButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
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
