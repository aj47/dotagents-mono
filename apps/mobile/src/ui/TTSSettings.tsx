import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Speech from 'expo-speech';
import { useTheme } from './ThemeProvider';
import { Theme, spacing, radius } from './theme';
import { isEnglishVoice, sortVoicesForTtsPicker } from '../lib/ttsVoices';
import { speakEdgeTts, stopEdgeTts } from '../lib/edgeTts';

export type Voice = {
  identifier: string;
  name: string;
  quality: string;
  language: string;
};

// Free Edge TTS neural voices (web-only playback via public Microsoft endpoint)
const EDGE_TTS_VOICE_OPTIONS: ReadonlyArray<{
  identifier: string;
  name: string;
  language: string;
}> = [
  { identifier: 'en-US-AriaNeural', name: 'Aria (Edge Neural)', language: 'en-US' },
  { identifier: 'en-US-GuyNeural', name: 'Guy (Edge Neural)', language: 'en-US' },
  { identifier: 'en-US-JennyNeural', name: 'Jenny (Edge Neural)', language: 'en-US' },
  { identifier: 'en-US-DavisNeural', name: 'Davis (Edge Neural)', language: 'en-US' },
  { identifier: 'en-GB-SoniaNeural', name: 'Sonia (Edge Neural)', language: 'en-GB' },
  { identifier: 'en-GB-RyanNeural', name: 'Ryan (Edge Neural)', language: 'en-GB' },
];

type UnifiedVoice =
  | { provider: 'native'; identifier: string; name: string; quality: string; language: string }
  | { provider: 'edge'; identifier: string; name: string; language: string };

type TTSSettingsProps = {
  voiceId?: string;
  rate: number;
  pitch: number;
  ttsProvider?: 'native' | 'edge';
  edgeTtsVoice?: string;
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
  onVoiceChange,
  onRateChange,
  onPitchChange,
  onTtsProviderChange,
  onEdgeTtsVoiceChange,
}: TTSSettingsProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [nativeVoices, setNativeVoices] = useState<Voice[]>([]);
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  // Edge TTS voices are available on all platforms (web via HTMLAudioElement,
  // native via expo-audio + expo-file-system).
  const edgeVoices: UnifiedVoice[] = useMemo(
    () =>
      EDGE_TTS_VOICE_OPTIONS.map((v) => ({
        provider: 'edge' as const,
        identifier: v.identifier,
        name: v.name,
        language: v.language,
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
    stopEdgeTts();

    if (selectedVoice?.provider === 'edge') {
      void speakEdgeTts('Hello! This is a test of the text to speech voice.', {
        voice: selectedVoice.identifier,
        rate,
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
        <Text style={styles.label}>Voice</Text>
        <TouchableOpacity
          style={styles.voiceSelector}
          onPress={() => setShowVoicePicker(true)}
        >
          <Text style={styles.voiceSelectorText} numberOfLines={2}>
            {selectedVoice?.name || 'System Default'}
          </Text>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Speech Rate */}
      <View style={styles.sliderRow}>
        <View style={styles.sliderHeader}>
          <Text style={styles.label}>Speed</Text>
          <Text style={styles.sliderValue}>{rate.toFixed(1)}x</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0.5}
          maximumValue={2.0}
          step={0.1}
          value={rate}
          onValueChange={onRateChange}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.muted}
          thumbTintColor={theme.colors.primary}
        />
      </View>

      {/* Pitch */}
      <View style={styles.sliderRow}>
        <View style={styles.sliderHeader}>
          <Text style={styles.label}>Pitch</Text>
          <Text style={styles.sliderValue}>{pitch.toFixed(1)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0.5}
          maximumValue={2.0}
          step={0.1}
          value={pitch}
          onValueChange={onPitchChange}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.muted}
          thumbTintColor={theme.colors.primary}
        />
      </View>

      {/* Test Button */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={testVoice}
        accessibilityRole="button"
        accessibilityLabel="Test text-to-speech voice"
      >
        <Text style={styles.testButtonText}>Test voice</Text>
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
              <Text style={styles.modalTitle}>Select Voice</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowVoicePicker(false)}
                accessibilityRole="button"
                accessibilityLabel="Close voice picker"
              >
                <Text style={styles.modalCloseText}>Close</Text>
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
              >
                <Text style={[
                  styles.voiceItemText,
                  !selectedVoice && styles.voiceItemTextSelected,
                ]}>
                  System Default
                </Text>
              </TouchableOpacity>

              {/* Edge TTS voices — free cloud neural voices (web + native) */}
              {edgeVoices.length > 0 && (
                <>
                  <Text style={styles.voiceGroupHeader}>Edge TTS (Free)</Text>
                  {edgeVoices.map((voice) => {
                    const isSelected =
                      selectedVoice?.provider === 'edge' &&
                      selectedVoice.identifier === voice.identifier;
                    return (
                      <TouchableOpacity
                        key={`edge-${voice.identifier}`}
                        style={[styles.voiceItem, isSelected && styles.voiceItemSelected]}
                        onPress={() => handleVoiceSelect(voice)}
                      >
                        <View>
                          <Text
                            style={[
                              styles.voiceItemText,
                              isSelected && styles.voiceItemTextSelected,
                            ]}
                          >
                            {voice.name}
                          </Text>
                          <Text style={styles.voiceItemSubtext}>
                            {voice.language} • Neural
                          </Text>
                        </View>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Native device voices */}
              {nativeVoices.length > 0 && (
                <Text style={styles.voiceGroupHeader}>Device Voices</Text>
              )}
              {nativeVoices.map((voice) => {
                const isSelected =
                  selectedVoice?.provider === 'native' &&
                  selectedVoice.identifier === voice.identifier;
                return (
                  <TouchableOpacity
                    key={`native-${voice.identifier}`}
                    style={[styles.voiceItem, isSelected && styles.voiceItemSelected]}
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
                    <View>
                      <Text
                        style={[
                          styles.voiceItemText,
                          isSelected && styles.voiceItemTextSelected,
                        ]}
                      >
                        {voice.name}
                      </Text>
                      <Text style={styles.voiceItemSubtext}>
                        {voice.language} {voice.quality === 'Enhanced' ? '• Enhanced' : ''}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
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
    voiceSelector: {
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
    voiceSelectorText: {
      fontSize: 14,
      color: theme.colors.foreground,
      marginRight: spacing.sm,
      flex: 1,
      flexShrink: 1,
    },
    chevron: {
      fontSize: 10,
      color: theme.colors.mutedForeground,
      flexShrink: 0,
    },
    sliderRow: {
      paddingVertical: spacing.sm,
    },
    sliderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    sliderValue: {
      fontSize: 14,
      color: theme.colors.mutedForeground,
    },
    slider: {
      width: '100%',
      height: 40,
    },
    testButton: {
      backgroundColor: theme.colors.muted,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    testButtonText: {
      fontSize: 14,
      color: theme.colors.foreground,
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
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    modalCloseText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
    },
    voiceList: {
      padding: spacing.md,
    },
    voiceGroupHeader: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    voiceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
    },
    voiceItemSelected: {
      backgroundColor: theme.colors.primary + '20',
    },
    voiceItemText: {
      fontSize: 16,
      color: theme.colors.foreground,
    },
    voiceItemTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    voiceItemSubtext: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    checkmark: {
      fontSize: 18,
      color: theme.colors.primary,
    },
  });

