/**
 * ResponseHistoryPanel - Shows all respond_to_user tool call responses
 * from the current agent session, with per-message TTS playback.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { DEFAULT_EDGE_TTS_VOICE } from '@dotagents/shared/providers';
import { preprocessTextForTTS } from '@dotagents/shared/tts-preprocessing';
import {
  getAgentResponseHistoryMobileIconState,
  getAgentResponseHistoryMobileSurfaceColors,
  getAgentResponseHistoryMobileSurfaceState,
  getAgentResponseHistoryNewestFadeDurationMs,
  getAgentResponseHistoryNewestInitialOpacity,
  getAgentResponseHistoryPanelState,
  getAgentResponseHistorySpeechAccessibilityLabel,
  getAgentResponseHistoryVisibleOpacity,
} from '@dotagents/shared/agent-user-response-store';
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
  ttsProvider?: 'native' | 'openai' | 'groq' | 'gemini' | 'edge' | 'kitten' | 'supertonic';
  edgeTtsVoice?: string;
  remoteTtsVoice?: string;
  remoteTtsModel?: string;
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
  const fadeAnim = useRef(
    new Animated.Value(
      isNewest
        ? getAgentResponseHistoryNewestInitialOpacity()
        : getAgentResponseHistoryVisibleOpacity(),
    ),
  ).current;
  const animatedStyle = useMemo(() => ({ opacity: fadeAnim }), [fadeAnim]);

  useEffect(() => {
    if (isNewest) {
      Animated.timing(fadeAnim, {
        toValue: getAgentResponseHistoryVisibleOpacity(),
        duration: getAgentResponseHistoryNewestFadeDurationMs(),
        useNativeDriver: true,
      }).start();
    }
  }, [fadeAnim, isNewest]);

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}

export function ResponseHistoryPanel({
  responses,
  ttsProvider = 'native',
  edgeTtsVoice = DEFAULT_EDGE_TTS_VOICE,
  remoteTtsVoice,
  remoteTtsModel,
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
  const prevCountRef = useRef(responses.length);
  const responseHistorySurface = getAgentResponseHistoryMobileSurfaceState();
  const responseHistorySurfaceColors = getAgentResponseHistoryMobileSurfaceColors(theme.colors);
  const responseHistoryIcons = getAgentResponseHistoryMobileIconState();
  const shouldAnimateNewest = responses.length > prevCountRef.current;
  const responseHistoryPanelState = getAgentResponseHistoryPanelState(responses, {
    isCollapsed,
    animateNewest: shouldAnimateNewest,
  });

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

  useEffect(() => {
    prevCountRef.current = responses.length;
  }, [responses.length]);

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
    if (ttsProvider !== 'native') {
      // Remote desktop TTS routes through the paired desktop's /v1/tts/speak
      // endpoint. Fall back to native Speech when no pairing is available.
      if (remoteBaseUrl && remoteApiKey) {
        void speakRemoteTts(processedText, {
          baseUrl: remoteBaseUrl,
          apiKey: remoteApiKey,
          providerId: ttsProvider,
          voice: remoteTtsVoice ?? edgeTtsVoice,
          model: remoteTtsModel,
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

  const styles = StyleSheet.create({
    container: {
      borderRadius: radius[responseHistorySurface.container.borderRadius],
      borderWidth: responseHistorySurface.container.borderWidth,
      borderColor: responseHistorySurfaceColors.container.borderColor,
      backgroundColor: responseHistorySurfaceColors.container.backgroundColor,
      overflow: responseHistorySurface.container.overflow,
      marginHorizontal: spacing[responseHistorySurface.container.marginHorizontal],
      marginBottom: spacing[responseHistorySurface.container.marginBottom],
    },
    header: {
      flexDirection: responseHistorySurface.header.flexDirection,
      alignItems: responseHistorySurface.header.alignItems,
      justifyContent: responseHistorySurface.header.justifyContent,
      paddingHorizontal: responseHistorySurface.header.paddingHorizontal,
      paddingVertical: responseHistorySurface.header.paddingVertical,
      borderBottomWidth: responseHistoryPanelState.headerBorderBottomWidth,
      borderBottomColor: responseHistorySurfaceColors.header.borderBottomColor,
      backgroundColor: responseHistorySurfaceColors.header.backgroundColor,
    },
    headerLeft: {
      flexDirection: responseHistorySurface.header.leftFlexDirection,
      alignItems: responseHistorySurface.header.leftAlignItems,
      gap: responseHistorySurface.header.gap,
    },
    headerTitle: {
      fontSize: responseHistorySurface.header.titleFontSize,
      fontWeight: responseHistorySurface.header.titleFontWeight,
      color: responseHistorySurfaceColors.header.titleColor,
    },
    badge: {
      backgroundColor: responseHistorySurfaceColors.badge.backgroundColor,
      borderRadius: responseHistorySurface.badge.borderRadius,
      minWidth: responseHistorySurface.badge.minWidth,
      height: responseHistorySurface.badge.height,
      alignItems: responseHistorySurface.badge.alignItems,
      justifyContent: responseHistorySurface.badge.justifyContent,
      paddingHorizontal: responseHistorySurface.badge.paddingHorizontal,
    },
    badgeText: {
      fontSize: responseHistorySurface.badge.fontSize,
      fontWeight: responseHistorySurface.badge.fontWeight,
      color: responseHistorySurfaceColors.badge.textColor,
    },
    list: {
      maxHeight: responseHistorySurface.list.maxHeight,
    },
    responseItem: {
      paddingHorizontal: responseHistorySurface.item.paddingHorizontal,
      paddingVertical: responseHistorySurface.item.paddingVertical,
    },
    responseHeader: {
      flexDirection: responseHistorySurface.item.headerFlexDirection,
      alignItems: responseHistorySurface.item.headerAlignItems,
      justifyContent: responseHistorySurface.item.headerJustifyContent,
      marginBottom: responseHistorySurface.item.headerMarginBottom,
    },
    timestamp: {
      fontSize: responseHistorySurface.item.timestampFontSize,
      color: responseHistorySurfaceColors.item.timestampColor,
    },
    speakButton: {
      padding: responseHistorySurface.item.speakButtonPadding,
    },
    separator: {
      height: responseHistorySurface.list.separatorHeight,
      backgroundColor: responseHistorySurfaceColors.list.separatorColor,
    },
    collapsedPreview: {
      paddingHorizontal: responseHistorySurface.collapsedPreview.paddingHorizontal,
      paddingBottom: responseHistorySurface.collapsedPreview.paddingBottom,
      gap: responseHistorySurface.collapsedPreview.gap,
      backgroundColor: responseHistorySurfaceColors.collapsedPreview.backgroundColor,
    },
    collapsedPreviewTimestamp: {
      fontSize: responseHistorySurface.collapsedPreview.timestampFontSize,
      color: responseHistorySurfaceColors.collapsedPreview.timestampColor,
    },
    collapsedPreviewText: {
      fontSize: responseHistorySurface.collapsedPreview.previewFontSize,
      lineHeight: responseHistorySurface.collapsedPreview.previewLineHeight,
      color: responseHistorySurfaceColors.collapsedPreview.previewColor,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsCollapsed((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={responseHistoryPanelState.toggleAccessibilityLabel}
        accessibilityState={{ expanded: responseHistoryPanelState.isExpanded }}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name={responseHistoryIcons.headerName}
            size={responseHistorySurface.header.iconSize}
            color={responseHistorySurfaceColors.header.iconColor}
          />
          <Text style={styles.headerTitle}>{responseHistoryPanelState.title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{responseHistoryPanelState.countLabel}</Text>
          </View>
        </View>
        <Ionicons
          name={responseHistoryPanelState.toggleIconName}
          size={responseHistorySurface.header.toggleIconSize}
          color={responseHistorySurfaceColors.header.toggleIconColor}
        />
      </TouchableOpacity>
      {responseHistoryPanelState.collapsedPreview.shouldRender && (
        <View style={styles.collapsedPreview}>
          <Text style={styles.collapsedPreviewTimestamp}>
            {responseHistoryPanelState.collapsedPreview.timestampLabel}
          </Text>
          <Text
            style={styles.collapsedPreviewText}
            numberOfLines={responseHistorySurface.collapsedPreview.previewNumberOfLines}
          >
            {responseHistoryPanelState.collapsedPreview.text}
          </Text>
        </View>
      )}
      {!isCollapsed && (
        <ScrollView style={styles.list}>
          {responseHistoryPanelState.items.map((item) => {
            const response = item.entry;
            const isSpeaking = speakingIndex === item.originalIndex;
            return (
              <React.Fragment key={item.key}>
                {item.displayIndex > 0 && <View style={styles.separator} />}
                <AnimatedResponseItem isNewest={item.isNewest}>
                  <View style={styles.responseItem}>
                    <View style={styles.responseHeader}>
                      <Text style={styles.timestamp}>
                        {item.timestampLabel}
                      </Text>
                      <TouchableOpacity
                        style={styles.speakButton}
                        onPress={() => handleSpeak(response.text, item.originalIndex)}
                        accessibilityLabel={getAgentResponseHistorySpeechAccessibilityLabel(isSpeaking)}
                      >
                        <Ionicons
                          name={isSpeaking ? responseHistoryIcons.stopName : responseHistoryIcons.speakName}
                          size={responseHistorySurface.item.speakIconSize}
                          color={
                            isSpeaking
                              ? responseHistorySurfaceColors.item.activeSpeakIconColor
                              : responseHistorySurfaceColors.item.speakIconColor
                          }
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
