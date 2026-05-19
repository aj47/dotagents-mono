import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';
import { Theme, spacing, radius } from './theme';
import { useAudioDevices, AudioInputDevice } from '../lib/voice/useAudioDevices';

type MicrophoneSelectorProps = {
  selectedDeviceId?: string;
  onDeviceChange: (deviceId: string | undefined) => void;
};

const SPEECH_SELECTOR_ACTIVE_OPACITY = 0.78;
const SPEECH_SELECTOR_TEXT_LINES = 2;

export function MicrophoneSelector({
  selectedDeviceId,
  onDeviceChange,
}: MicrophoneSelectorProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [showPicker, setShowPicker] = React.useState(false);
  const { inputDevices, error } = useAudioDevices(true);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.label}>Microphone</Text>
          <Text style={styles.nativeHint}>System Default</Text>
        </View>
        <Text style={styles.helperText}>
          Microphone selection is managed by your device's OS settings.
        </Text>
      </View>
    );
  }

  const selectedDevice = inputDevices.find((d) => d.deviceId === selectedDeviceId);

  const handleSelect = (device: AudioInputDevice | null) => {
    onDeviceChange(device?.deviceId);
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Microphone</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowPicker(true)}
          activeOpacity={SPEECH_SELECTOR_ACTIVE_OPACITY}
          accessibilityRole="button"
          accessibilityLabel="Select microphone"
        >
          <Text style={styles.selectorText} numberOfLines={SPEECH_SELECTOR_TEXT_LINES}>
            {selectedDevice?.label || 'System Default'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Microphone</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPicker(false)}
                activeOpacity={SPEECH_SELECTOR_ACTIVE_OPACITY}
                accessibilityRole="button"
                accessibilityLabel="Close microphone picker"
              >
                <Ionicons name="close" size={20} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.deviceList}>
              <TouchableOpacity
                style={[
                  styles.deviceItem,
                  !selectedDeviceId && styles.deviceItemSelected,
                ]}
                onPress={() => handleSelect(null)}
                activeOpacity={SPEECH_SELECTOR_ACTIVE_OPACITY}
                accessibilityRole="button"
                accessibilityState={{ selected: !selectedDeviceId }}
              >
                <Text
                  style={[
                    styles.deviceItemText,
                    !selectedDeviceId && styles.deviceItemTextSelected,
                  ]}
                  numberOfLines={SPEECH_SELECTOR_TEXT_LINES}
                >
                  System Default
                </Text>
                {!selectedDeviceId && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>

              {inputDevices
                .filter((d) => d.deviceId !== 'default')
                .map((device) => (
                  <TouchableOpacity
                    key={device.deviceId}
                    style={[
                      styles.deviceItem,
                      selectedDeviceId === device.deviceId &&
                        styles.deviceItemSelected,
                    ]}
                    onPress={() => handleSelect(device)}
                    activeOpacity={SPEECH_SELECTOR_ACTIVE_OPACITY}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedDeviceId === device.deviceId }}
                  >
                    <Text
                      style={[
                        styles.deviceItemText,
                        selectedDeviceId === device.deviceId &&
                          styles.deviceItemTextSelected,
                      ]}
                      numberOfLines={SPEECH_SELECTOR_TEXT_LINES}
                    >
                      {device.label}
                    </Text>
                    {selectedDeviceId === device.deviceId && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginTop: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    label: {
      fontSize: 16,
      color: theme.colors.foreground,
      flexGrow: 1,
      flexShrink: 1,
    },
    nativeHint: {
      fontSize: 14,
      color: theme.colors.mutedForeground,
    },
    helperText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: spacing.xs,
    },
    errorText: {
      fontSize: 12,
      color: '#ef4444',
      marginTop: spacing.xs,
    },
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.muted,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      flexGrow: 1,
      maxWidth: '100%',
      minWidth: 140,
    },
    selectorText: {
      fontSize: 14,
      color: theme.colors.foreground,
      marginRight: spacing.sm,
      flex: 1,
      flexShrink: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      flex: 1,
      flexShrink: 1,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.foreground,
      paddingRight: spacing.xs,
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: theme.colors.muted,
    },
    deviceList: {
      padding: spacing.md,
    },
    deviceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
    },
    deviceItemSelected: {
      backgroundColor: theme.colors.primary + '20',
    },
    deviceItemText: {
      fontSize: 16,
      color: theme.colors.foreground,
      flex: 1,
      paddingRight: spacing.sm,
    },
    deviceItemTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });
