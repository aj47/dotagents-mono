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
  getAgentResponseHistoryMobileRenderState,
  type AgentResponseHistoryMobileAnimationState,
} from '@dotagents/shared/agent-user-response-store';
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

  if (!responseHistoryRenderState.shouldRender) {
    return null;
  }

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
