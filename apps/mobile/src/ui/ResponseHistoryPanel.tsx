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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { preprocessTextForTTS } from '@dotagents/shared';
import {
  createButtonAccessibilityLabel,
  createExpandCollapseAccessibilityLabel,
  createMinimumTouchTargetStyle,
} from '../lib/accessibility';
import { useTheme } from './ThemeProvider';
import { MarkdownRenderer } from './MarkdownRenderer';
import { spacing, radius } from './theme';

export interface ResponseHistoryEntry {
  text: string;
  timestamp: number;
}

const COLLAPSED_RESPONSE_PREVIEW_SCAN_LIMIT = 2048;
const COLLAPSED_RESPONSE_PREVIEW_LIMIT = 160;
const COLLAPSED_RESPONSE_PREVIEW_LINE_THRESHOLD = 2;

const hasMarkdownImagePreview = (text: string) => /!\[[^\]]*\]\((?:data:image[^)]*|[^)]*)\)/i.test(text);

const hasEmbeddedImagePreview = (text: string) => /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/i.test(text);

function formatResponseAccessibilityContext(text: string, timestampLabel: string): string {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  if (!normalizedText) return `from ${timestampLabel}`;

  const preview = normalizedText.length > 56
    ? `${normalizedText.slice(0, 53).replace(/\s+$/g, '')}…`
    : normalizedText;

  return `"${preview}" from ${timestampLabel}`;
}

function buildCollapsedResponsePreview(responseText: string): string {
  const boundedResponse = responseText.slice(0, COLLAPSED_RESPONSE_PREVIEW_SCAN_LIMIT);
  const preview = boundedResponse
    .replace(/!\[[^\]]*\]\((?:data:image[^)]*|[^)]*)\)/gi, '[image]')
    .replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, '[embedded image]')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!preview) return 'Image response';

  if (preview.length > COLLAPSED_RESPONSE_PREVIEW_LIMIT) {
    return `${preview.slice(0, COLLAPSED_RESPONSE_PREVIEW_LIMIT - 1).trimEnd()}…`;
  }

  if (responseText.length > COLLAPSED_RESPONSE_PREVIEW_SCAN_LIMIT) {
    return `${preview}…`;
  }

  return preview;
}

function shouldCollapseResponseByDefault(responseText: string): boolean {
  const normalizedResponse = responseText.replace(/\s+/g, ' ').trim();
  const nonEmptyLines = responseText.split(/\r?\n/).filter((line) => line.trim().length > 0);

  return hasMarkdownImagePreview(responseText)
    || hasEmbeddedImagePreview(responseText)
    || normalizedResponse.length > COLLAPSED_RESPONSE_PREVIEW_LIMIT
    || responseText.length > COLLAPSED_RESPONSE_PREVIEW_SCAN_LIMIT
    || nonEmptyLines.length > COLLAPSED_RESPONSE_PREVIEW_LINE_THRESHOLD;
}

interface ResponseHistoryPanelProps {
  conversationId: string;
  responses: ResponseHistoryEntry[];
  ttsRate?: number;
  ttsPitch?: number;
  ttsVoiceId?: string;
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
  conversationId,
  responses,
  ttsRate = 1.0,
  ttsPitch = 1.0,
  ttsVoiceId,
}: ResponseHistoryPanelProps) {
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [expandedResponses, setExpandedResponses] = useState<Record<string, boolean>>({});
  const isMountedRef = useRef(true);
  const previousConversationIdRef = useRef(conversationId);
  const speechRequestIdRef = useRef(0);
  const historyHeaderTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: 12,
    verticalPadding: 8,
    horizontalMargin: 0,
  });
  const responseSpeakTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalMargin: 0,
  });
  const responseExpandTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: 4,
    verticalPadding: 4,
    horizontalMargin: 0,
  });
  const responseHistoryDisclosureHint = 'Shows or hides recent respond-to-user outputs from the current agent session.';

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
    };
  }, [nextSpeechRequestId]);

  useEffect(() => {
    if (isCollapsed && speakingIndex !== null) {
      nextSpeechRequestId();
      Speech.stop();
      safeSetSpeakingIndex(null);
    }
  }, [isCollapsed, speakingIndex, safeSetSpeakingIndex, nextSpeechRequestId]);

  useEffect(() => {
    if (previousConversationIdRef.current === conversationId) {
      return;
    }

    previousConversationIdRef.current = conversationId;
    setIsCollapsed(true);
    setExpandedResponses({});
    nextSpeechRequestId();
    Speech.stop();
    safeSetSpeakingIndex(null);
  }, [conversationId, nextSpeechRequestId, safeSetSpeakingIndex]);

  if (responses.length === 0) {
    return null;
  }

  const handleSpeak = (text: string, index: number) => {
    // If already speaking this message, stop it
    if (speakingIndex === index) {
      nextSpeechRequestId();
      Speech.stop();
      safeSetSpeakingIndex(null);
      return;
    }

    // Stop any current speech
    const requestId = nextSpeechRequestId();
    Speech.stop();

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

    safeSetSpeakingIndex(index);
    Speech.speak(processedText, speechOptions);
  };

  const formatTime = (timestamp: number, includeSeconds = true) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {}),
    });
  };

  // Track previous responses count to detect newly added entries.
  const prevCountRef = useRef(responses.length);
  const newestTimestamp = responses.length > 0 ? Math.max(...responses.map((r) => r.timestamp)) : null;
  const shouldAnimateNewest = responses.length > prevCountRef.current;
  const newestOriginalIndex = responses.length - 1;
  const responseCountLabel = responses.length === 1 ? '1 response' : `${responses.length} responses`;
  const historyListMaxHeight = Math.min(300, Math.max(200, Math.round(windowHeight * 0.35)));
  const headerStatusText = speakingIndex !== null
    ? 'Speaking now'
    : newestTimestamp
      ? `Latest ${formatTime(newestTimestamp, false)}`
      : 'No responses yet';
  const responseHistoryDisclosureLabel = `${createExpandCollapseAccessibilityLabel('agent responses', !isCollapsed)}. ${responseCountLabel}. ${headerStatusText}.`;

  useEffect(() => {
    prevCountRef.current = responses.length;
  }, [responses.length]);

  const toggleResponseExpansion = useCallback((responseKey: string) => {
    setExpandedResponses((prev) => ({
      ...prev,
      [responseKey]: !prev[responseKey],
    }));
  }, []);

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
      ...historyHeaderTouchTarget,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: isCollapsed ? 0 : 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: `${theme.colors.muted}50`,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    headerTitleGroup: {
      flex: 1,
      minWidth: 0,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.foreground,
      flexShrink: 1,
      minWidth: 0,
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
    headerStatusText: {
      marginTop: 2,
      fontSize: 12,
      color: theme.colors.mutedForeground,
      lineHeight: 16,
      flexShrink: 1,
    },
    headerStatusTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    list: {
      maxHeight: historyListMaxHeight,
    },
    responseItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    responseHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    responseMeta: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
      flexShrink: 1,
    },
    timestamp: {
      fontSize: 11,
      color: theme.colors.mutedForeground,
    },
    timestampLatest: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    latestBadge: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}26`,
      backgroundColor: `${theme.colors.primary}12`,
      paddingHorizontal: 6,
      paddingVertical: 2,
      flexShrink: 0,
    },
    latestBadgeText: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    speakingBadge: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
      backgroundColor: `${theme.colors.primary}18`,
      paddingHorizontal: 6,
      paddingVertical: 2,
      flexShrink: 0,
    },
    speakingBadgeText: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    speakButton: {
      ...responseSpeakTouchTarget,
      borderRadius: 999,
      flexShrink: 0,
    },
    speakButtonActive: {
      backgroundColor: `${theme.colors.primary}18`,
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
    responsePreview: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.foreground,
    },
    responseExpandButton: {
      ...responseExpandTouchTarget,
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderRadius: 999,
      marginTop: 4,
    },
    responseExpandButtonText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginLeft: 2,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsCollapsed((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={responseHistoryDisclosureLabel}
        accessibilityHint={responseHistoryDisclosureHint}
        accessibilityState={{ expanded: !isCollapsed }}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="chatbubbles-outline" size={16} color={theme.colors.mutedForeground} />
          <View style={styles.headerTitleGroup}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">Agent Responses</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{responses.length}</Text>
              </View>
            </View>
            <Text
              style={[styles.headerStatusText, speakingIndex !== null && styles.headerStatusTextActive]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {headerStatusText}
            </Text>
          </View>
        </View>
        <Ionicons
          name={isCollapsed ? 'chevron-down' : 'chevron-up'}
          size={16}
          color={theme.colors.mutedForeground}
        />
      </TouchableOpacity>
      {!isCollapsed && (
        <ScrollView
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Show newest first */}
          {[...responses].reverse().map((response, index) => {
            const originalIndex = responses.length - 1 - index;
            const isSpeaking = speakingIndex === originalIndex;
            const isLatest = originalIndex === newestOriginalIndex;
            const shouldShowLatestBadge = isLatest && !isSpeaking;
            const responseKey = `${response.timestamp}-${originalIndex}`;
            const responseTimestampLabel = formatTime(response.timestamp, false);
            const responseAccessibilityContext = formatResponseAccessibilityContext(response.text, responseTimestampLabel);
            const responsePreview = buildCollapsedResponsePreview(response.text);
            const shouldCollapseResponse = shouldCollapseResponseByDefault(response.text);
            const isResponseExpanded = shouldCollapseResponse
              ? (expandedResponses[responseKey] ?? isLatest)
              : true;
            // Animate newest entry (shown at top after reverse)
            const isNewestEntry =
              shouldAnimateNewest && index === 0 && response.timestamp === newestTimestamp;
            return (
              <React.Fragment key={`${response.timestamp}-${index}`}>
                {index > 0 && <View style={styles.separator} />}
                <AnimatedResponseItem isNewest={isNewestEntry}>
                  <View style={styles.responseItem}>
                    <View style={styles.responseHeader}>
                      <View style={styles.responseMeta}>
                        <Text style={[styles.timestamp, isLatest && styles.timestampLatest]}>
                          {responseTimestampLabel}
                        </Text>
                        {isSpeaking ? (
                          <View style={styles.speakingBadge}>
                            <Text style={styles.speakingBadgeText}>Speaking</Text>
                          </View>
                        ) : null}
                        {shouldShowLatestBadge ? (
                          <View style={styles.latestBadge}>
                            <Text style={styles.latestBadgeText}>Latest</Text>
                          </View>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        style={[styles.speakButton, isSpeaking && styles.speakButtonActive]}
                        onPress={() => handleSpeak(response.text, originalIndex)}
                        accessibilityRole="button"
                        accessibilityLabel={createButtonAccessibilityLabel(
                          isSpeaking
                            ? `Stop speaking response ${responseAccessibilityContext}`
                            : `Speak response ${responseAccessibilityContext} aloud`
                        )}
                        accessibilityHint={isSpeaking
                          ? 'Stops text to speech for this agent response.'
                          : isLatest
                            ? 'Reads the latest agent response aloud with text to speech.'
                            : 'Reads this agent response aloud with text to speech.'}
                        accessibilityState={{ selected: isSpeaking }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isSpeaking ? 'stop-circle' : 'volume-medium'}
                          size={18}
                          color={isSpeaking ? theme.colors.primary : theme.colors.mutedForeground}
                        />
                      </TouchableOpacity>
                    </View>
                    {isResponseExpanded ? (
                      <MarkdownRenderer content={response.text} />
                    ) : (
                      <Text style={styles.responsePreview} numberOfLines={3} ellipsizeMode="tail">
                        {responsePreview}
                      </Text>
                    )}
                    {shouldCollapseResponse ? (
                      <TouchableOpacity
                        style={styles.responseExpandButton}
                        onPress={() => toggleResponseExpansion(responseKey)}
                        accessibilityRole="button"
                        accessibilityLabel={createExpandCollapseAccessibilityLabel(
                          `response details ${responseAccessibilityContext}`,
                          isResponseExpanded
                        )}
                        accessibilityHint={isResponseExpanded
                          ? 'Shows a shorter preview for this agent response.'
                          : 'Shows the full agent response with formatting.'}
                        accessibilityState={{ expanded: isResponseExpanded }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isResponseExpanded ? 'chevron-up' : 'chevron-down'}
                          size={12}
                          color={theme.colors.mutedForeground}
                        />
                        <Text style={styles.responseExpandButtonText}>
                          {isResponseExpanded ? 'Less' : 'More'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
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
