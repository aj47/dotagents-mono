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
  getSpeechSelectorCopyState,
  getSpeechSelectorMobileCloseIconState,
  getSpeechSelectorMobileSurfaceColors,
  getSpeechSelectorMobileSurfaceState,
  type SpeechSelectorMobileSurfaceColors,
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
          accessibilityRole="button"
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
                accessibilityRole="button"
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


const createStyles = (speechSelectorColors: SpeechSelectorMobileSurfaceColors) =>
  StyleSheet.create({
    container: {
      marginTop: spacing[speechSelectorSurface.container.marginTop],
    },
    row: {
      flexDirection: speechSelectorSurface.row.flexDirection,
      flexWrap: speechSelectorSurface.row.flexWrap,
      justifyContent: speechSelectorSurface.row.justifyContent,
      alignItems: speechSelectorSurface.row.alignItems,
      gap: spacing[speechSelectorSurface.row.gap],
      paddingVertical: spacing[speechSelectorSurface.row.paddingVertical],
    },
    label: {
      fontSize: speechSelectorSurface.label.fontSize,
      color: speechSelectorColors.label.color,
      flexGrow: speechSelectorSurface.label.flexGrow,
      flexShrink: speechSelectorSurface.label.flexShrink,
    },
    nativeHint: {
      fontSize: speechSelectorSurface.nativeHint.fontSize,
      color: speechSelectorColors.nativeHint.color,
    },
    helperText: {
      fontSize: speechSelectorSurface.helperText.fontSize,
      color: speechSelectorColors.helperText.color,
      marginTop: spacing[speechSelectorSurface.helperText.marginTop],
    },
    errorText: {
      fontSize: speechSelectorSurface.errorText.fontSize,
      color: speechSelectorColors.errorText.color,
      marginTop: spacing[speechSelectorSurface.errorText.marginTop],
    },
    selector: {
      flexDirection: speechSelectorSurface.trigger.flexDirection,
      alignItems: speechSelectorSurface.trigger.alignItems,
      backgroundColor: speechSelectorColors.trigger.backgroundColor,
      paddingHorizontal: spacing[speechSelectorSurface.trigger.paddingHorizontal],
      paddingVertical: spacing[speechSelectorSurface.trigger.paddingVertical],
      borderRadius: radius[speechSelectorSurface.trigger.borderRadius],
      gap: spacing[speechSelectorSurface.trigger.gap],
      flexGrow: speechSelectorSurface.trigger.flexGrow,
      maxWidth: speechSelectorSurface.trigger.maxWidth,
      minWidth: speechSelectorSurface.trigger.minWidth,
    },
    selectorText: {
      fontSize: speechSelectorSurface.triggerText.fontSize,
      color: speechSelectorColors.triggerText.color,
      flex: speechSelectorSurface.triggerText.flex,
      flexShrink: speechSelectorSurface.triggerText.flexShrink,
    },
    modalOverlay: {
      flex: speechSelectorSurface.modalOverlay.flex,
      backgroundColor: speechSelectorColors.modalOverlay.backgroundColor,
      justifyContent: speechSelectorSurface.modalOverlay.justifyContent,
    },
    modalContent: {
      backgroundColor: speechSelectorColors.sheet.backgroundColor,
      borderTopLeftRadius: radius[speechSelectorSurface.sheet.borderTopRadius],
      borderTopRightRadius: radius[speechSelectorSurface.sheet.borderTopRadius],
      maxHeight: speechSelectorSurface.sheet.maxHeight,
    },
    modalHeader: {
      flexDirection: speechSelectorSurface.header.flexDirection,
      justifyContent: speechSelectorSurface.header.justifyContent,
      alignItems: speechSelectorSurface.header.alignItems,
      gap: spacing[speechSelectorSurface.header.gap],
      paddingHorizontal: spacing[speechSelectorSurface.header.paddingHorizontal],
      paddingVertical: spacing[speechSelectorSurface.header.paddingVertical],
      borderBottomWidth: speechSelectorSurface.header.borderBottomWidth,
      borderBottomColor: speechSelectorColors.header.borderBottomColor,
    },
    modalTitle: {
      flex: speechSelectorSurface.title.flex,
      flexShrink: speechSelectorSurface.title.flexShrink,
      fontSize: speechSelectorSurface.title.fontSize,
      fontWeight: speechSelectorSurface.title.fontWeight,
      color: speechSelectorColors.title.color,
      paddingRight: spacing[speechSelectorSurface.title.paddingRight],
    },
    modalCloseButton: {
      width: speechSelectorSurface.closeButton.width,
      height: speechSelectorSurface.closeButton.height,
      borderRadius: radius[speechSelectorSurface.closeButton.borderRadius],
      alignItems: speechSelectorSurface.closeButton.alignItems,
      justifyContent: speechSelectorSurface.closeButton.justifyContent,
      paddingHorizontal: spacing[speechSelectorSurface.closeButton.paddingHorizontal],
      paddingVertical: spacing[speechSelectorSurface.closeButton.paddingVertical],
    },
    deviceList: {
      padding: spacing[speechSelectorSurface.list.padding],
    },
    deviceItem: {
      flexDirection: speechSelectorSurface.item.flexDirection,
      justifyContent: speechSelectorSurface.item.justifyContent,
      alignItems: speechSelectorSurface.item.alignItems,
      paddingVertical: spacing[speechSelectorSurface.item.paddingVertical],
      paddingHorizontal: spacing[speechSelectorSurface.item.paddingHorizontal],
      borderRadius: radius[speechSelectorSurface.item.borderRadius],
      gap: spacing[speechSelectorSurface.item.gap],
    },
    deviceItemSelected: {
      backgroundColor: speechSelectorColors.selectedItem.backgroundColor,
    },
    deviceItemText: {
      fontSize: speechSelectorSurface.itemText.fontSize,
      color: speechSelectorColors.itemText.color,
      flex: 1,
      minWidth: 0,
    },
    deviceItemTextSelected: {
      color: speechSelectorColors.itemText.selectedColor,
      fontWeight: speechSelectorSurface.itemText.selectedFontWeight,
    },
  });
