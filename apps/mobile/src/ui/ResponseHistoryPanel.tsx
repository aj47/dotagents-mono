/**
 * ResponseHistoryPanel - Shows all respond_to_user tool call responses
 * from the current agent session, with per-message TTS playback.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createAgentResponseHistoryMobileStyleSlots,
  getAgentResponseHistoryMobileRenderState,
  type AgentResponseHistoryMobileAnimationState,
} from '@dotagents/shared/session-presentation';
import { MarkdownRenderer } from './MarkdownRenderer';
import { spacing, radius } from './theme';

export interface ResponseHistoryEntry {
  id?: string;
  text: string;
  timestamp: number;
}

interface ResponseHistoryPanelProps {
  responses: ResponseHistoryEntry[];
  colors: Parameters<typeof getAgentResponseHistoryMobileRenderState>[0]['colors'];
  remoteBaseUrl?: string;
  remoteApiKey?: string;
  isCollapsed: boolean;
  shouldAnimateNewest: boolean;
  speakingIndex: number | null;
  onToggleCollapsed: () => void;
  onSpeakResponse: (text: string, index: number) => void;
}

/**
 * Animated wrapper for response items - fades in when first rendered as newest
 */
function AnimatedResponseItem({
  children,
  isNewest,
  animation,
}: {
  children: React.ReactNode;
  isNewest: boolean;
  animation: AgentResponseHistoryMobileAnimationState;
}) {
  const fadeAnim = useRef(
    new Animated.Value(
      isNewest
        ? animation.newestInitialOpacity
        : animation.visibleOpacity,
    ),
  ).current;
  const animatedStyle = useMemo(() => ({ opacity: fadeAnim }), [fadeAnim]);

  useEffect(() => {
    if (isNewest) {
      Animated.timing(fadeAnim, {
        toValue: animation.visibleOpacity,
        duration: animation.newestFadeDurationMs,
        useNativeDriver: true,
      }).start();
    }
  }, [animation.newestFadeDurationMs, animation.visibleOpacity, fadeAnim, isNewest]);

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}

export function ResponseHistoryPanel({
  responses,
  colors,
  remoteBaseUrl,
  remoteApiKey,
  isCollapsed,
  shouldAnimateNewest,
  speakingIndex,
  onToggleCollapsed,
  onSpeakResponse,
}: ResponseHistoryPanelProps) {
  const responseHistoryRenderState = getAgentResponseHistoryMobileRenderState({
    responses,
    colors,
    isCollapsed,
    animateNewest: shouldAnimateNewest,
    speakingIndex,
  });
  const responseHistoryPanelState = responseHistoryRenderState.panel;
  const responseHistorySurface = responseHistoryRenderState.surface;
  const responseHistorySurfaceColors = responseHistoryRenderState.colors;
  const responseHistoryIcons = responseHistoryRenderState.icons;
  const responseHistoryAnimation = responseHistoryRenderState.animation;
  const responseHistoryStyleSlots = createAgentResponseHistoryMobileStyleSlots({
    renderState: responseHistoryRenderState,
    spacing,
    radius,
  });

  if (!responseHistoryRenderState.shouldRender) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      ...responseHistoryStyleSlots.container,
    },
    header: {
      ...responseHistoryStyleSlots.header,
    },
    headerLeft: {
      ...responseHistoryStyleSlots.headerLeft,
    },
    headerTitle: {
      ...responseHistoryStyleSlots.headerTitle,
    },
    badge: {
      ...responseHistoryStyleSlots.badge,
    },
    badgeText: {
      ...responseHistoryStyleSlots.badgeText,
    },
    list: {
      ...responseHistoryStyleSlots.list,
    },
    responseItem: {
      ...responseHistoryStyleSlots.responseItem,
    },
    responseHeader: {
      ...responseHistoryStyleSlots.responseHeader,
    },
    timestamp: {
      ...responseHistoryStyleSlots.timestamp,
    },
    speakButton: {
      ...responseHistoryStyleSlots.speakButton,
    },
    separator: {
      ...responseHistoryStyleSlots.separator,
    },
    collapsedPreview: {
      ...responseHistoryStyleSlots.collapsedPreview,
    },
    collapsedPreviewTimestamp: {
      ...responseHistoryStyleSlots.collapsedPreviewTimestamp,
    },
    collapsedPreviewText: {
      ...responseHistoryStyleSlots.collapsedPreviewText,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={onToggleCollapsed}
        activeOpacity={responseHistorySurface.header.pressedOpacity}
        accessibilityRole={responseHistorySurface.header.accessibilityRole}
        accessibilityLabel={responseHistoryPanelState.toggleAccessibilityLabel}
        accessibilityState={responseHistoryPanelState.toggleAccessibilityState}
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
      {responseHistoryRenderState.shouldRenderList && (
        <ScrollView style={styles.list}>
          {responseHistoryRenderState.items.map((item) => {
            const response = item.entry;
            const speechActionState = item.speechActionState;
            return (
              <React.Fragment key={item.key}>
                {item.shouldRenderSeparator && <View style={styles.separator} />}
                <AnimatedResponseItem isNewest={item.isNewest} animation={responseHistoryAnimation}>
                  <View style={styles.responseItem}>
                    <View style={styles.responseHeader}>
                      <Text style={styles.timestamp}>
                        {item.timestampLabel}
                      </Text>
                      <TouchableOpacity
                        style={styles.speakButton}
                        onPress={() => onSpeakResponse(response.text, item.originalIndex)}
                        activeOpacity={responseHistorySurface.item.speakButtonPressedOpacity}
                        accessibilityRole={responseHistorySurface.item.speakButtonAccessibilityRole}
                        accessibilityLabel={speechActionState.accessibilityLabel}
                      >
                        <Ionicons
                          name={speechActionState.icon.name}
                          size={responseHistorySurface.item.speakIconSize}
                          color={speechActionState.icon.color}
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
