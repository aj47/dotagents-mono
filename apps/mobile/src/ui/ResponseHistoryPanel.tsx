/**
 * ResponseHistoryPanel - Shows all respond_to_user tool call responses
 * from the current agent session, with per-message TTS playback.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { preprocessTextForTTS } from '@dotagents/shared';
import { useTheme } from './ThemeProvider';
import { MarkdownRenderer } from './MarkdownRenderer';
import { spacing, radius } from './theme';
import { speakRemoteTts, stopRemoteTts } from '../lib/remoteTts';

export interface ResponseHistoryEntry {
  id?: string;
  text: string;
  timestamp: number;
}

interface ResponseHistoryPanelProps {
  responses: ResponseHistoryEntry[];
  ttsProvider?: 'native' | 'edge';
  edgeTtsVoice?: string;
  ttsRate?: number;
  ttsPitch?: number;
  ttsVoiceId?: string;
  remoteBaseUrl?: string;
  remoteApiKey?: string;
}

/**
 * Animated wrapper for response items - fades in when first rendered as newest
 */
function AnimatedResponseItem({
  children,
  isNewest,
}: {
  children: React.ReactNode;
  isNewest: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(isNewest ? 0 : 1)).current;

  useEffect(() => {
    if (isNewest) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [fadeAnim, isNewest]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
}

export function ResponseHistoryPanel({
  responses,
  ttsProvider = 'native',
  edgeTtsVoice = 'en-US-AriaNeural',
  ttsRate = 1.0,
  ttsPitch = 1.0,
  ttsVoiceId,
  remoteBaseUrl,
  remoteApiKey,
}: ResponseHistoryPanelProps) {
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const isMountedRef = useRef(true);
  const speechRequestIdRef = useRef(0);

  const nextSpeechRequestId = useCallback(() => {
    speechRequestIdRef.current += 1;
    return speechRequestIdRef.current;
  }, []);

  const safeSetSpeakingIndex = useCallback((index: number | null) => {
    if (isMountedRef.current) {
      setSpeakingIndex(index);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      nextSpeechRequestId();
      Speech.stop();
      stopRemoteTts();
    };
  }, [nextSpeechRequestId]);

  useEffect(() => {
    if (isCollapsed && speakingIndex !== null) {
      nextSpeechRequestId();
      Speech.stop();
      stopRemoteTts();
      safeSetSpeakingIndex(null);
    }
  }, [isCollapsed, speakingIndex, safeSetSpeakingIndex, nextSpeechRequestId]);

  if (responses.length === 0) {
    return null;
  }

  const handleSpeak = (text: string, index: number) => {
    // If already speaking this message, stop it
    if (speakingIndex === index) {
      nextSpeechRequestId();
      Speech.stop();
      stopRemoteTts();
      safeSetSpeakingIndex(null);
      return;
    }

    // Stop any current speech
    const requestId = nextSpeechRequestId();
    Speech.stop();
    stopRemoteTts();

    const processedText = preprocessTextForTTS(text);
    if (!processedText) {
      safeSetSpeakingIndex(null);
      return;
    }

    const clearIfCurrentRequest = () => {
      if (speechRequestIdRef.current === requestId) {
        safeSetSpeakingIndex(null);
      }
    };

    safeSetSpeakingIndex(index);
    if (ttsProvider === 'edge') {
      // Edge TTS on all platforms routes through the paired desktop's
      // /v1/tts/speak endpoint. Fall back to native Speech when no pairing.
      if (remoteBaseUrl && remoteApiKey) {
        void speakRemoteTts(processedText, {
          baseUrl: remoteBaseUrl,
          apiKey: remoteApiKey,
          providerId: 'edge',
          voice: edgeTtsVoice,
          rate: ttsRate,
          onDone: clearIfCurrentRequest,
          onStopped: clearIfCurrentRequest,
          onError: clearIfCurrentRequest,
        });
        return;
      }
      // Fall through to native Speech below when paired desktop is unavailable.
    }

    const speechOptions: Speech.SpeechOptions = {
      language: 'en-US',
      rate: ttsRate,
      pitch: ttsPitch,
      onDone: clearIfCurrentRequest,
      onStopped: clearIfCurrentRequest,
      onError: clearIfCurrentRequest,
    };
    if (ttsVoiceId) {
      speechOptions.voice = ttsVoiceId;
    }
    Speech.speak(processedText, speechOptions);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Track previous responses count to detect newly added entries.
  const prevCountRef = useRef(responses.length);
  const newestTimestamp = responses.length > 0 ? Math.max(...responses.map((r) => r.timestamp)) : null;
  const shouldAnimateNewest = responses.length > prevCountRef.current;

  useEffect(() => {
    prevCountRef.current = responses.length;
  }, [responses.length]);

  const styles = StyleSheet.create({
    container: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: `${theme.colors.muted}30`,
      overflow: 'hidden',
      marginHorizontal: spacing.sm,
      marginBottom: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: isCollapsed ? 0 : 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: `${theme.colors.muted}50`,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.foreground,
    },
    badge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.primaryForeground,
    },
    list: {
      maxHeight: 300,
    },
    responseItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    responseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    timestamp: {
      fontSize: 11,
      color: theme.colors.mutedForeground,
    },
    speakButton: {
      padding: 4,
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsCollapsed((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={isCollapsed ? 'Show agent responses' : 'Hide agent responses'}
        accessibilityState={{ expanded: !isCollapsed }}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="chatbubbles-outline" size={16} color={theme.colors.mutedForeground} />
          <Text style={styles.headerTitle}>Agent Responses</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{responses.length}</Text>
          </View>
        </View>
        <Ionicons
          name={isCollapsed ? 'chevron-down' : 'chevron-up'}
          size={16}
          color={theme.colors.mutedForeground}
        />
      </TouchableOpacity>
      {!isCollapsed && (
        <ScrollView style={styles.list}>
          {/* Show newest first */}
          {[...responses].reverse().map((response, index) => {
            const originalIndex = responses.length - 1 - index;
            const isSpeaking = speakingIndex === originalIndex;
            // Animate newest entry (shown at top after reverse)
            const isNewestEntry =
              shouldAnimateNewest && index === 0 && response.timestamp === newestTimestamp;
            return (
              <React.Fragment key={response.id ?? `${response.timestamp}-${index}`}>
                {index > 0 && <View style={styles.separator} />}
                <AnimatedResponseItem isNewest={isNewestEntry}>
                  <View style={styles.responseItem}>
                    <View style={styles.responseHeader}>
                      <Text style={styles.timestamp}>
                        {formatTime(response.timestamp)}
                      </Text>
                      <TouchableOpacity
                        style={styles.speakButton}
                        onPress={() => handleSpeak(response.text, originalIndex)}
                        accessibilityLabel={isSpeaking ? 'Stop speaking' : 'Speak this response'}
                      >
                        <Ionicons
                          name={isSpeaking ? 'stop-circle' : 'volume-medium'}
                          size={18}
                          color={isSpeaking ? theme.colors.primary : theme.colors.mutedForeground}
                        />
                      </TouchableOpacity>
                    </View>
                    <MarkdownRenderer
                      content={response.text}
                      assetBaseUrl={remoteBaseUrl}
                      assetAuthToken={remoteApiKey}
                    />
                  </View>
                </AnimatedResponseItem>
              </React.Fragment>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
