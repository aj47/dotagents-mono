import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';
import { Theme, spacing, radius } from './theme';
import { isEnglishVoice, sortVoicesForTtsPicker } from '../lib/ttsVoices';
import { speakRemoteTts } from '../lib/remoteTts';
import {
  beginGlobalTtsPlayback,
  completeGlobalTtsPlayback,
  markGlobalTtsPlaybackSpeaking,
  stopGlobalTtsPlayback,
} from '../store/ttsPlayback';

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
  { identifier: 'en-US-BrianNeural', name: 'Brian (Edge Neural)', language: 'en-US' },
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

const SPEECH_SELECTOR_ACTIVE_OPACITY = 0.78;
const SPEECH_SELECTOR_TEXT_LINES = 2;
const TTS_TEST_PHRASE = 'Hello! This is a test of the text to speech voice.';
const EDGE_TTS_UNAVAILABLE_TITLE = 'Edge TTS unavailable';
const EDGE_TTS_UNAVAILABLE_MESSAGE =
  'Edge voices now play through your paired desktop. Pair a desktop with Remote Access enabled to use Edge TTS.';
const EDGE_TTS_FAILED_TITLE = 'Edge TTS failed';
const EDGE_TTS_FAILED_MESSAGE =
  'Could not reach the paired desktop to synthesize speech. Make sure the desktop app is running and reachable, then try again.';

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
    stopGlobalTtsPlayback();

    if (selectedVoice?.provider === 'edge') {
      if (!edgeTtsAvailable || !remoteBaseUrl || !remoteApiKey) {
        Alert.alert(
          EDGE_TTS_UNAVAILABLE_TITLE,
          EDGE_TTS_UNAVAILABLE_MESSAGE,
        );
        return;
      }
      const playbackId = beginGlobalTtsPlayback({
        source: 'settings',
        status: 'loading',
        text: TTS_TEST_PHRASE,
      });
      void speakRemoteTts(TTS_TEST_PHRASE, {
        baseUrl: remoteBaseUrl,
        apiKey: remoteApiKey,
        providerId: 'edge',
        voice: selectedVoice.identifier,
        rate,
        onDone: () => completeGlobalTtsPlayback(playbackId),
        onStopped: () => completeGlobalTtsPlayback(playbackId),
        onError: () => {
          completeGlobalTtsPlayback(playbackId);
          Alert.alert(
            EDGE_TTS_FAILED_TITLE,
            EDGE_TTS_FAILED_MESSAGE,
          );
        },
      }).then((started) => {
        if (started) {
          markGlobalTtsPlaybackSpeaking(playbackId);
        }
      });
      return;
    }

    const playbackId = beginGlobalTtsPlayback({
      source: 'settings',
      text: TTS_TEST_PHRASE,
    });
    const options: Speech.SpeechOptions = {
      language: 'en-US',
      rate,
      pitch,
      onDone: () => completeGlobalTtsPlayback(playbackId),
      onStopped: () => completeGlobalTtsPlayback(playbackId),
      onError: () => completeGlobalTtsPlayback(playbackId),
    };
    if (selectedVoice?.provider === 'native') {
      options.voice = selectedVoice.identifier;
    }
    Speech.speak(TTS_TEST_PHRASE, options);
  };

  return (
    <View style={styles.container}>
      {/* Voice Selection */}
      <View style={styles.row}>
        <Text style={styles.label}>Voice</Text>
        <TouchableOpacity
          style={styles.voiceSelector}
          onPress={() => setShowVoicePicker(true)}
          activeOpacity={SPEECH_SELECTOR_ACTIVE_OPACITY}
          accessibilityRole="button"
          accessibilityLabel="Select text-to-speech voice"
        >
          <Text style={styles.voiceSelectorText} numberOfLines={SPEECH_SELECTOR_TEXT_LINES}>
            {selectedVoice?.name || 'System Default'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.mutedForeground} />
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
        activeOpacity={SPEECH_SELECTOR_ACTIVE_OPACITY}
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
                activeOpacity={SPEECH_SELECTOR_ACTIVE_OPACITY}
                accessibilityRole="button"
                accessibilityLabel="Close voice picker"
              >
                <Ionicons name="close" size={18} color={theme.colors.mutedForeground} />
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
                activeOpacity={SPEECH_SELECTOR_ACTIVE_OPACITY}
                accessibilityRole="button"
                accessibilityState={{ selected: !selectedVoice }}
              >
                <View style={styles.voiceItemBody}>
                  <Text style={[
                    styles.voiceItemText,
                    !selectedVoice && styles.voiceItemTextSelected,
                  ]} numberOfLines={SPEECH_SELECTOR_TEXT_LINES}>
                    System Default
                  </Text>
                </View>
                {!selectedVoice ? (
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                ) : null}
              </TouchableOpacity>

              {/* Edge TTS voices — route through the paired desktop's /v1/tts/speak */}
              {edgeVoices.length > 0 && edgeTtsAvailable && (
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
                        activeOpacity={SPEECH_SELECTOR_ACTIVE_OPACITY}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View style={styles.voiceItemBody}>
                          <Text
                            style={[
                              styles.voiceItemText,
                              isSelected && styles.voiceItemTextSelected,
                            ]}
                            numberOfLines={SPEECH_SELECTOR_TEXT_LINES}
                          >
                            {voice.name}
                          </Text>
                          <Text style={styles.voiceItemSubtext} numberOfLines={SPEECH_SELECTOR_TEXT_LINES}>
                            {voice.language} • Neural
                          </Text>
                        </View>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                        ) : null}
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
                    activeOpacity={SPEECH_SELECTOR_ACTIVE_OPACITY}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.voiceItemBody}>
                      <Text
                        style={[
                          styles.voiceItemText,
                          isSelected && styles.voiceItemTextSelected,
                        ]}
                        numberOfLines={SPEECH_SELECTOR_TEXT_LINES}
                      >
                        {voice.name}
                      </Text>
                      <Text style={styles.voiceItemSubtext} numberOfLines={SPEECH_SELECTOR_TEXT_LINES}>
                        {voice.language} {voice.quality === 'Enhanced' ? '• Enhanced' : ''}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                    ) : null}
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
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.muted,
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
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
    },
    voiceItemSelected: {
      backgroundColor: theme.colors.primary + '20',
    },
    voiceItemBody: {
      flex: 1,
      minWidth: 0,
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
  });
