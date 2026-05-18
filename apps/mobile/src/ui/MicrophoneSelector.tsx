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
import { spacing, radius } from './theme';
import { useAudioDevices, AudioInputDevice } from '../lib/voice/useAudioDevices';
import {
  createSpeechSelectorMobileStyleSheetSlots,
  getSpeechSelectorCopyState,
  getSpeechSelectorMobileCloseIconState,
  getSpeechSelectorMobileSurfaceColors,
  getSpeechSelectorMobileSurfaceState,
} from '@dotagents/shared/text-to-speech-settings';

const speechSelectorCopy = getSpeechSelectorCopyState();
const speechSelectorSurface = getSpeechSelectorMobileSurfaceState();
const speechSelectorCloseIcon = getSpeechSelectorMobileCloseIconState();

type MicrophoneSelectorProps = {
  selectedDeviceId?: string;
  onDeviceChange: (deviceId: string | undefined) => void;
};

export function MicrophoneSelector({
  selectedDeviceId,
  onDeviceChange,
}: MicrophoneSelectorProps) {
  const { theme } = useTheme();
  const speechSelectorColors = useMemo(
    () => getSpeechSelectorMobileSurfaceColors(theme.colors),
    [theme.colors],
  );
  const styles = useMemo(() => createStyles(speechSelectorColors), [speechSelectorColors]);
  const [showPicker, setShowPicker] = React.useState(false);
  const { inputDevices, error } = useAudioDevices(true);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.label}>{speechSelectorCopy.microphone.label}</Text>
          <Text style={styles.nativeHint}>{speechSelectorCopy.microphone.nativeHint}</Text>
        </View>
        <Text style={styles.helperText}>
          {speechSelectorCopy.microphone.nativeHelper}
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
        <Text style={styles.label}>{speechSelectorCopy.microphone.label}</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowPicker(true)}
          activeOpacity={speechSelectorSurface.trigger.pressedOpacity}
          accessibilityRole={speechSelectorSurface.trigger.accessibilityRole}
          accessibilityLabel={speechSelectorCopy.microphone.selectAccessibilityLabel}
        >
          <Text style={styles.selectorText} numberOfLines={speechSelectorSurface.trigger.textNumberOfLines}>
            {selectedDevice?.label || speechSelectorCopy.common.systemDefaultLabel}
          </Text>
          <Ionicons
            name={speechSelectorSurface.disclosureIcon.name}
            size={speechSelectorSurface.disclosureIcon.size}
            color={speechSelectorColors.disclosureIcon.color}
          />
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
              <Text style={styles.modalTitle}>{speechSelectorCopy.microphone.pickerTitle}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPicker(false)}
                activeOpacity={speechSelectorSurface.closeButton.pressedOpacity}
                accessibilityRole={speechSelectorSurface.closeButton.accessibilityRole}
                accessibilityLabel={speechSelectorCopy.microphone.closeAccessibilityLabel}
              >
                <Ionicons
                  name={speechSelectorCloseIcon.name}
                  size={speechSelectorCloseIcon.size}
                  color={speechSelectorColors.closeIcon.color}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.deviceList}>
              <TouchableOpacity
                style={[
                  styles.deviceItem,
                  !selectedDeviceId && styles.deviceItemSelected,
                ]}
                onPress={() => handleSelect(null)}
                activeOpacity={speechSelectorSurface.item.pressedOpacity}
                accessibilityRole={speechSelectorSurface.item.accessibilityRole}
                accessibilityState={{ selected: !selectedDeviceId }}
              >
                <Text
                  style={[
                    styles.deviceItemText,
                    !selectedDeviceId && styles.deviceItemTextSelected,
                  ]}
                  numberOfLines={speechSelectorSurface.itemText.numberOfLines}
                >
                  {speechSelectorCopy.common.systemDefaultLabel}
                </Text>
                {!selectedDeviceId && (
                  <Ionicons
                    name={speechSelectorSurface.selectedIcon.name}
                    size={speechSelectorSurface.selectedIcon.size}
                    color={speechSelectorColors.selectedIcon.color}
                  />
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
                    activeOpacity={speechSelectorSurface.item.pressedOpacity}
                    accessibilityRole={speechSelectorSurface.item.accessibilityRole}
                    accessibilityState={{ selected: selectedDeviceId === device.deviceId }}
                  >
                    <Text
                      style={[
                        styles.deviceItemText,
                        selectedDeviceId === device.deviceId &&
                          styles.deviceItemTextSelected,
                      ]}
                      numberOfLines={speechSelectorSurface.itemText.numberOfLines}
                    >
                      {device.label}
                    </Text>
                    {selectedDeviceId === device.deviceId && (
                      <Ionicons
                        name={speechSelectorSurface.selectedIcon.name}
                        size={speechSelectorSurface.selectedIcon.size}
                        color={speechSelectorColors.selectedIcon.color}
                      />
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


const createStyles = (
  speechSelectorColors: ReturnType<typeof getSpeechSelectorMobileSurfaceColors>,
) =>
  StyleSheet.create(createSpeechSelectorMobileStyleSheetSlots({
    colors: speechSelectorColors,
    spacing,
    radius,
  }));
