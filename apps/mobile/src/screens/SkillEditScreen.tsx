import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExtendedSettingsApiClient, Skill, SkillCreateRequest, SkillUpdateRequest } from '../lib/settingsApi';
import { createButtonAccessibilityLabel } from '../lib/accessibility';
import { useConfigContext } from '../store/config';
import { useTheme } from '../ui/ThemeProvider';
import { radius, spacing } from '../ui/theme';

type SkillFormData = {
  name: string;
  description: string;
  instructions: string;
};

const defaultFormData: SkillFormData = {
  name: '',
  description: '',
  instructions: '',
};

function skillToFormData(skill: Skill): SkillFormData {
  return {
    name: skill.name,
    description: skill.description || '',
    instructions: skill.instructions || '',
  };
}

export default function SkillEditScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { config } = useConfigContext();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const skillFromRoute = route.params?.skill as Skill | undefined;
  const skillId = route.params?.skillId as string | undefined;
  const effectiveSkillId = skillId ?? skillFromRoute?.id;
  const isEditing = !!effectiveSkillId;

  const [formData, setFormData] = useState<SkillFormData>(() =>
    skillFromRoute ? skillToFormData(skillFromRoute) : defaultFormData
  );
  const [isLoading, setIsLoading] = useState(isEditing && !skillFromRoute);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settingsClient = useMemo(() => {
    if (config.baseUrl && config.apiKey) {
      return new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
    }
    return null;
  }, [config.baseUrl, config.apiKey]);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Skill' : 'Create Skill' });
  }, [isEditing, navigation]);

  useEffect(() => {
    if (isEditing && !skillFromRoute && !settingsClient) {
      setIsLoading(false);
      setError('Configure Base URL and API key to load and save skills');
    }
  }, [isEditing, settingsClient, skillFromRoute]);

  useEffect(() => {
    if (!isEditing || skillFromRoute || !settingsClient || !effectiveSkillId) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    settingsClient.getSkill(effectiveSkillId)
      .then((res) => {
        if (!cancelled) {
          setFormData(skillToFormData(res.skill));
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load skill');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [effectiveSkillId, isEditing, settingsClient, skillFromRoute]);

  const updateField = useCallback(<K extends keyof SkillFormData>(key: K, value: SkillFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!settingsClient) {
      setError('Configure Base URL and API key in Settings before saving this skill');
      return;
    }

    const name = formData.name.trim();
    const description = formData.description.trim();
    const instructions = formData.instructions.trim();
    if (!name || !instructions) {
      setError('Name and instructions are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditing && effectiveSkillId) {
        const updatePayload: SkillUpdateRequest = { name, description, instructions };
        await settingsClient.updateSkill(effectiveSkillId, updatePayload);
      } else {
        const createPayload: SkillCreateRequest = { name, description, instructions };
        await settingsClient.createSkill(createPayload);
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to save skill');
    } finally {
      setIsSaving(false);
    }
  }, [effectiveSkillId, formData, isEditing, navigation, settingsClient]);

  const isSaveDisabled = isSaving || !settingsClient;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading skill...</Text>
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
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!settingsClient && (
          <Text style={styles.helperText}>Configure Base URL and API key in Settings to save skill changes.</Text>
        )}

        {isEditing && effectiveSkillId && (
          <>
            <Text style={styles.label}>Skill ID</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={effectiveSkillId}
              editable={false}
              autoCapitalize="none"
            />
            <Text style={styles.sectionHelperText}>Skill IDs are fixed after creation.</Text>
          </>
        )}

        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={value => updateField('name', value)}
          placeholder="Code review assistant"
          placeholderTextColor={theme.colors.mutedForeground}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          value={formData.description}
          onChangeText={value => updateField('description', value)}
          placeholder="Short skill summary"
          placeholderTextColor={theme.colors.mutedForeground}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Instructions *</Text>
        <TextInput
          style={[styles.input, styles.instructionsInput]}
          value={formData.instructions}
          onChangeText={value => updateField('instructions', value)}
          placeholder="Describe when and how the agent should use this skill."
          placeholderTextColor={theme.colors.mutedForeground}
          multiline
          numberOfLines={14}
          textAlignVertical="top"
          autoCapitalize="sentences"
        />
        <Text style={styles.sectionHelperText}>These instructions are saved to the desktop skill file.</Text>

        <TouchableOpacity
          style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaveDisabled}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel(isEditing ? 'Save skill' : 'Create skill')}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.colors.primaryForeground} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>{isEditing ? 'Save Skill' : 'Create Skill'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: { padding: spacing.lg },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: spacing.md, color: theme.colors.mutedForeground, fontSize: 14 },
    errorText: { color: theme.colors.destructive, marginBottom: spacing.sm },
    helperText: { fontSize: 12, color: theme.colors.mutedForeground, marginBottom: spacing.sm },
    label: { fontSize: 14, fontWeight: '500', color: theme.colors.foreground, marginBottom: spacing.xs, marginTop: spacing.md },
    sectionHelperText: { fontSize: 12, color: theme.colors.mutedForeground, marginBottom: spacing.sm },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 14,
      color: theme.colors.foreground,
      backgroundColor: theme.colors.background,
    },
    disabledInput: { opacity: 0.7 },
    descriptionInput: { minHeight: 72 },
    instructionsInput: {
      minHeight: 240,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: undefined }),
    },
    saveButton: {
      marginTop: spacing.xl,
      backgroundColor: theme.colors.primary,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: theme.colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  });
}
