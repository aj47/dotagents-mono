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
  createAgentResponseHistoryMobilePropsParts,
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
  const responseHistoryParts = createAgentResponseHistoryMobilePropsParts({
    renderState: responseHistoryRenderState,
    styles,
    onToggleCollapsed,
    onSpeakResponse,
  });

  return (
    <View style={responseHistoryParts.container.style}>
      <TouchableOpacity
        style={responseHistoryParts.header.touchable.style}
        onPress={responseHistoryParts.header.touchable.onPress}
        activeOpacity={responseHistoryParts.header.touchable.activeOpacity}
        accessibilityRole={responseHistoryParts.header.touchable.accessibilityRole}
        accessibilityLabel={responseHistoryParts.header.touchable.accessibilityLabel}
        accessibilityState={responseHistoryParts.header.touchable.accessibilityState}
      >
        <View style={responseHistoryParts.header.left.style}>
          <Ionicons
            name={responseHistoryParts.header.icon.name}
            size={responseHistoryParts.header.icon.size}
            color={responseHistoryParts.header.icon.color}
          />
          <Text style={responseHistoryParts.header.title.style}>
            {responseHistoryParts.header.title.text}
          </Text>
          <View style={responseHistoryParts.header.badge.style}>
            <Text style={responseHistoryParts.header.badge.text.style}>
              {responseHistoryParts.header.badge.text.value}
            </Text>
          </View>
        </View>
        <Ionicons
          name={responseHistoryParts.header.toggleIcon.name}
          size={responseHistoryParts.header.toggleIcon.size}
          color={responseHistoryParts.header.toggleIcon.color}
        />
      </TouchableOpacity>
      {responseHistoryParts.collapsedPreview && (
        <View style={responseHistoryParts.collapsedPreview.style}>
          <Text style={responseHistoryParts.collapsedPreview.timestamp.style}>
            {responseHistoryParts.collapsedPreview.timestamp.text}
          </Text>
          <Text
            style={responseHistoryParts.collapsedPreview.preview.style}
            numberOfLines={responseHistoryParts.collapsedPreview.preview.numberOfLines}
          >
            {responseHistoryParts.collapsedPreview.preview.text}
          </Text>
        </View>
      )}
      {responseHistoryParts.list && (
        <ScrollView style={responseHistoryParts.list.style}>
          {responseHistoryParts.list.items.map((item) => {
            return (
              <React.Fragment key={item.key}>
                {item.shouldRenderSeparator && <View style={item.separator.style} />}
                <AnimatedResponseItem
                  isNewest={item.animated.isNewest}
                  animation={item.animated.animation}
                >
                  <View style={item.container.style}>
                    <View style={item.header.style}>
                      <Text style={item.timestamp.style}>
                        {item.timestamp.text}
                      </Text>
                      <TouchableOpacity
                        style={item.speakButton.style}
                        onPress={item.speakButton.onPress}
                        activeOpacity={item.speakButton.activeOpacity}
                        accessibilityRole={item.speakButton.accessibilityRole}
                        accessibilityLabel={item.speakButton.accessibilityLabel}
                      >
                        <Ionicons
                          name={item.speakIcon.name}
                          size={item.speakIcon.size}
                          color={item.speakIcon.color}
                        />
                      </TouchableOpacity>
                    </View>
                    <MarkdownRenderer
                      content={item.entry.text}
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
