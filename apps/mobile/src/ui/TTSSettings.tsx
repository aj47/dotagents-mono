import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';
import { speakRemoteTts, stopRemoteTts } from '../lib/remoteTts';
import {
  EDGE_TTS_VOICES,
} from '@dotagents/shared/providers';
import {
  createSpeechSelectorMobileStyleSheetSlots,
  getSpeechSelectorCopyState,
  getSpeechSelectorMobileCloseIconState,
  getSpeechSelectorMobileSurfaceColors,
  getSpeechSelectorMobileSurfaceState,
} from '@dotagents/shared/text-to-speech-settings';
import {
  isEnglishTtsVoice as isEnglishVoice,
  sortVoicesForTtsPicker,
} from '@dotagents/shared/tts-voice-picker';

const speechSelectorCopy = getSpeechSelectorCopyState();
const speechSelectorSurface = getSpeechSelectorMobileSurfaceState();
const speechSelectorCloseIcon = getSpeechSelectorMobileCloseIconState();

export type Voice = {
  identifier: string;
  name: string;
  quality: string;
  language: string;
};

type UnifiedVoice =
  | { provider: 'native'; identifier: string; name: string; quality: string; language: string }
  | { provider: 'edge'; identifier: string; name: string; language: string };

type TTSSettingsProps = {
  voiceId?: string;
  rate: number;
  pitch: number;
  ttsProvider?: 'native' | 'edge';
  edgeTtsVoice?: string;
  // Paired-desktop remote-server credentials. Edge TTS now goes through
  // /v1/tts/speak on the paired desktop, so without these the option is
  // disabled and the picker falls back to native voices.
  remoteBaseUrl?: string;
  remoteApiKey?: string;
  onVoiceChange: (voiceId: string | undefined) => void;
  onRateChange: (rate: number) => void;
  onPitchChange: (pitch: number) => void;
  onTtsProviderChange?: (provider: 'native' | 'edge') => void;
  onEdgeTtsVoiceChange?: (voice: string) => void;
};

export function TTSSettings({
  voiceId,
  rate,
  pitch,
  ttsProvider = 'native',
  edgeTtsVoice,
  remoteBaseUrl,
  remoteApiKey,
  onVoiceChange,
  onRateChange,
  onPitchChange,
  onTtsProviderChange,
  onEdgeTtsVoiceChange,
}: TTSSettingsProps) {
  const edgeTtsAvailable = Boolean(remoteBaseUrl && remoteApiKey);
  const { theme } = useTheme();
  const speechSelectorColors = useMemo(
    () => getSpeechSelectorMobileSurfaceColors(theme.colors),
    [theme.colors],
  );
  const styles = useMemo(() => createStyles(speechSelectorColors), [speechSelectorColors]);
  const [nativeVoices, setNativeVoices] = useState<Voice[]>([]);
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  // Edge TTS voices are available on all platforms (web via HTMLAudioElement,
  // native via expo-audio + expo-file-system).
  const edgeVoices: UnifiedVoice[] = useMemo(
    () =>
      EDGE_TTS_VOICES.map((v) => ({
        provider: 'edge' as const,
        identifier: v.value,
        name: v.label,
        language: v.value.split('-').slice(0, 2).join('-'),
      })),
    [],
  );

  const loadVoices = useCallback(async () => {
    try {
      const availableVoices = await Speech.getAvailableVoicesAsync();
      const englishVoices = availableVoices.filter(isEnglishVoice);
      const voicesForPicker = englishVoices.length > 0 ? englishVoices : availableVoices;
      const sortedVoices = sortVoicesForTtsPicker(voicesForPicker, {
        preferGoogleVoices: Platform.OS === 'web',
      });
      setNativeVoices(sortedVoices as Voice[]);
    } catch (error) {
      console.error('[TTS] Failed to load voices:', error);
    }
  }, []);

  useEffect(() => {
    void loadVoices();

    if (Platform.OS !== 'web') {
      return;
    }

    const speechSynthesisApi = (globalThis as any).speechSynthesis;
    if (!speechSynthesisApi?.addEventListener) {
      return;
    }

    const handleVoicesChanged = () => {
      void loadVoices();
    };

    speechSynthesisApi.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      speechSynthesisApi.removeEventListener?.('voiceschanged', handleVoicesChanged);
    };
  }, [loadVoices]);

  // Derive the currently-selected unified voice from props (no local state needed)
  const selectedVoice: UnifiedVoice | null = useMemo(() => {
    if (ttsProvider === 'edge' && edgeTtsVoice) {
      const match = edgeVoices.find((v) => v.identifier === edgeTtsVoice);
      if (match) return match;
    }
    if (voiceId) {
      const native = nativeVoices.find((v) => v.identifier === voiceId);
      if (native) {
        return {
          provider: 'native',
          identifier: native.identifier,
          name: native.name,
          quality: native.quality,
          language: native.language,
        };
      }
    }
    return null;
  }, [ttsProvider, edgeTtsVoice, edgeVoices, voiceId, nativeVoices]);

  const handleVoiceSelect = (voice: UnifiedVoice | null) => {
    if (!voice) {
      // System default -> native, clear voiceId
      onTtsProviderChange?.('native');
      onVoiceChange(undefined);
    } else if (voice.provider === 'edge') {
      onTtsProviderChange?.('edge');
      onEdgeTtsVoiceChange?.(voice.identifier);
      // Leave ttsVoiceId untouched so native fallback is preserved
    } else {
      onTtsProviderChange?.('native');
      onVoiceChange(voice.identifier);
    }
    setShowVoicePicker(false);
  };

  const testVoice = () => {
    // Stop any in-flight playback before testing
    Speech.stop();
    stopRemoteTts();

    if (selectedVoice?.provider === 'edge') {
      if (!edgeTtsAvailable || !remoteBaseUrl || !remoteApiKey) {
        Alert.alert(
          'Edge TTS unavailable',
          'Edge voices now play through your paired desktop. Pair a desktop with Remote Access enabled to use Edge TTS.',
        );
        return;
      }
      void speakRemoteTts('Hello! This is a test of the text to speech voice.', {
        baseUrl: remoteBaseUrl,
        apiKey: remoteApiKey,
        providerId: 'edge',
        voice: selectedVoice.identifier,
        rate,
        onError: () => {
          Alert.alert(
            'Edge TTS failed',
            'Could not reach the paired desktop to synthesize speech. Make sure the desktop app is running and reachable, then try again.',
          );
        },
      });
      return;
    }

    const options: Speech.SpeechOptions = {
      language: 'en-US',
      rate,
      pitch,
    };
    if (selectedVoice?.provider === 'native') {
      options.voice = selectedVoice.identifier;
    }
    Speech.speak('Hello! This is a test of the text to speech voice.', options);
  };

  return (
    <View style={styles.container}>
      {/* Voice Selection */}
      <View style={styles.row}>
        <Text style={styles.label}>{speechSelectorCopy.voice.label}</Text>
        <TouchableOpacity
          style={styles.voiceSelector}
          onPress={() => setShowVoicePicker(true)}
          activeOpacity={speechSelectorSurface.trigger.pressedOpacity}
          accessibilityRole={speechSelectorSurface.trigger.accessibilityRole}
        >
          <Text style={styles.voiceSelectorText} numberOfLines={speechSelectorSurface.trigger.textNumberOfLines}>
            {selectedVoice?.name || speechSelectorCopy.common.systemDefaultLabel}
          </Text>
          <Ionicons
            name={speechSelectorSurface.disclosureIcon.name}
            size={speechSelectorSurface.disclosureIcon.size}
            color={speechSelectorColors.disclosureIcon.color}
          />
        </TouchableOpacity>
      </View>

      {/* Speech Rate */}
      <View style={styles.sliderRow}>
        <View style={styles.sliderHeader}>
          <Text style={styles.label}>{speechSelectorCopy.voice.speedLabel}</Text>
          <Text style={styles.sliderValue}>{rate.toFixed(1)}x</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0.5}
          maximumValue={2.0}
          step={0.1}
          value={rate}
          onValueChange={onRateChange}
          minimumTrackTintColor={speechSelectorColors.slider.minimumTrackTintColor}
          maximumTrackTintColor={speechSelectorColors.slider.maximumTrackTintColor}
          thumbTintColor={speechSelectorColors.slider.thumbTintColor}
        />
      </View>

      {/* Pitch */}
      <View style={styles.sliderRow}>
        <View style={styles.sliderHeader}>
          <Text style={styles.label}>{speechSelectorCopy.voice.pitchLabel}</Text>
          <Text style={styles.sliderValue}>{pitch.toFixed(1)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0.5}
          maximumValue={2.0}
          step={0.1}
          value={pitch}
          onValueChange={onPitchChange}
          minimumTrackTintColor={speechSelectorColors.slider.minimumTrackTintColor}
          maximumTrackTintColor={speechSelectorColors.slider.maximumTrackTintColor}
          thumbTintColor={speechSelectorColors.slider.thumbTintColor}
        />
      </View>

      {/* Test Button */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={testVoice}
        activeOpacity={speechSelectorSurface.testButton.pressedOpacity}
        accessibilityRole={speechSelectorSurface.testButton.accessibilityRole}
        accessibilityLabel={speechSelectorCopy.voice.testVoiceAccessibilityLabel}
      >
        <Text style={styles.testButtonText}>{speechSelectorCopy.voice.testVoiceLabel}</Text>
      </TouchableOpacity>

      {/* Voice Picker Modal */}
      <Modal
        visible={showVoicePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoicePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{speechSelectorCopy.voice.pickerTitle}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowVoicePicker(false)}
                activeOpacity={speechSelectorSurface.closeButton.pressedOpacity}
                accessibilityRole={speechSelectorSurface.closeButton.accessibilityRole}
                accessibilityLabel={speechSelectorCopy.voice.closeAccessibilityLabel}
              >
                <Ionicons
                  name={speechSelectorCloseIcon.name}
                  size={speechSelectorCloseIcon.size}
                  color={speechSelectorColors.closeIcon.color}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.voiceList}>
              {/* System Default Option */}
              <TouchableOpacity
                style={[
                  styles.voiceItem,
                  !selectedVoice && styles.voiceItemSelected,
                ]}
                onPress={() => handleVoiceSelect(null)}
                activeOpacity={speechSelectorSurface.item.pressedOpacity}
                accessibilityRole={speechSelectorSurface.item.accessibilityRole}
                accessibilityState={{ selected: !selectedVoice }}
              >
                <Text style={[
                  styles.voiceItemText,
                  !selectedVoice && styles.voiceItemTextSelected,
                ]} numberOfLines={speechSelectorSurface.itemText.numberOfLines}>
                  {speechSelectorCopy.common.systemDefaultLabel}
                </Text>
              </TouchableOpacity>

              {/* Edge TTS voices — route through the paired desktop's /v1/tts/speak */}
              {edgeVoices.length > 0 && edgeTtsAvailable && (
                <>
                  <Text style={styles.voiceGroupHeader}>{speechSelectorCopy.voice.edgeGroupLabel}</Text>
                  {edgeVoices.map((voice) => {
                    const isSelected =
                      selectedVoice?.provider === 'edge' &&
                      selectedVoice.identifier === voice.identifier;
                    return (
                      <TouchableOpacity
                        key={`edge-${voice.identifier}`}
                        style={[styles.voiceItem, isSelected && styles.voiceItemSelected]}
                        onPress={() => handleVoiceSelect(voice)}
                        activeOpacity={speechSelectorSurface.item.pressedOpacity}
                        accessibilityRole={speechSelectorSurface.item.accessibilityRole}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View style={styles.voiceItemBody}>
                          <Text
                            style={[
                              styles.voiceItemText,
                              isSelected && styles.voiceItemTextSelected,
                            ]}
                            numberOfLines={speechSelectorSurface.itemText.numberOfLines}
                          >
                            {voice.name}
                          </Text>
                          <Text
                            style={styles.voiceItemSubtext}
                            numberOfLines={speechSelectorSurface.itemSubtext.numberOfLines}
                          >
                            {voice.language} • Neural
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons
                            name={speechSelectorSurface.selectedIcon.name}
                            size={speechSelectorSurface.selectedIcon.size}
                            color={speechSelectorColors.selectedIcon.color}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Native device voices */}
              {nativeVoices.length > 0 && (
                <Text style={styles.voiceGroupHeader}>{speechSelectorCopy.voice.nativeGroupLabel}</Text>
              )}
              {nativeVoices.map((voice) => {
                const isSelected =
                  selectedVoice?.provider === 'native' &&
                  selectedVoice.identifier === voice.identifier;
                return (
                  <TouchableOpacity
                    key={`native-${voice.identifier}`}
                    style={[styles.voiceItem, isSelected && styles.voiceItemSelected]}
                    activeOpacity={speechSelectorSurface.item.pressedOpacity}
                    accessibilityRole={speechSelectorSurface.item.accessibilityRole}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() =>
                      handleVoiceSelect({
                        provider: 'native',
                        identifier: voice.identifier,
                        name: voice.name,
                        quality: voice.quality,
                        language: voice.language,
                      })
                    }
                  >
                    <View style={styles.voiceItemBody}>
                      <Text
                        style={[
                          styles.voiceItemText,
                          isSelected && styles.voiceItemTextSelected,
                        ]}
                        numberOfLines={speechSelectorSurface.itemText.numberOfLines}
                      >
                        {voice.name}
                      </Text>
                      <Text
                        style={styles.voiceItemSubtext}
                        numberOfLines={speechSelectorSurface.itemSubtext.numberOfLines}
                      >
                        {voice.language} {voice.quality === 'Enhanced' ? '• Enhanced' : ''}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name={speechSelectorSurface.selectedIcon.name}
                        size={speechSelectorSurface.selectedIcon.size}
                        color={speechSelectorColors.selectedIcon.color}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
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
