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
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createAgentResponseHistoryMobilePropsParts,
  createAgentResponseHistoryMobileStyleSlots,
  getAgentResponseHistoryMobileRenderState,
  type AgentResponseHistoryMobileAnimationState,
  type AgentResponseHistoryMobilePropsParts,
} from '@dotagents/shared/session-presentation';
import { MarkdownRenderer } from './MarkdownRenderer';
import { spacing, radius } from './theme';

export interface ResponseHistoryEntry {
  id?: string;
  text: string;
  timestamp: number;
}

type ResponseHistoryToggleHandler = () => void;
type ResponseHistorySpeakHandler = (text: string, index: number) => void;

interface ResponseHistoryPanelProps {
  responses: ResponseHistoryEntry[];
  colors: Parameters<typeof getAgentResponseHistoryMobileRenderState>[0]['colors'];
  remoteBaseUrl?: string;
  remoteApiKey?: string;
  isCollapsed: boolean;
  shouldAnimateNewest: boolean;
  speakingIndex: number | null;
  onToggleCollapsed: ResponseHistoryToggleHandler;
  onSpeakResponse: ResponseHistorySpeakHandler;
}

type ResponseHistoryPanelStyles = {
  container: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  headerLeft: StyleProp<ViewStyle>;
  headerTitle: StyleProp<TextStyle>;
  badge: StyleProp<ViewStyle>;
  badgeText: StyleProp<TextStyle>;
  list: StyleProp<ViewStyle>;
  responseItem: StyleProp<ViewStyle>;
  responseHeader: StyleProp<ViewStyle>;
  timestamp: StyleProp<TextStyle>;
  speakButton: StyleProp<ViewStyle>;
  separator: StyleProp<ViewStyle>;
  collapsedPreview: StyleProp<ViewStyle>;
  collapsedPreviewTimestamp: StyleProp<TextStyle>;
  collapsedPreviewText: StyleProp<TextStyle>;
};

type ResponseHistoryPanelParts =
  AgentResponseHistoryMobilePropsParts<
    ResponseHistoryEntry,
    ResponseHistoryPanelStyles,
    ResponseHistoryToggleHandler
  >;

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
        useNativeDriver: animation.newestUseNativeDriver,
      }).start();
    }
  }, [
    animation.newestFadeDurationMs,
    animation.newestUseNativeDriver,
    animation.visibleOpacity,
    fadeAnim,
    isNewest,
  ]);

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

  const styles: ResponseHistoryPanelStyles = StyleSheet.create({
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
  const responseHistoryParts: ResponseHistoryPanelParts = createAgentResponseHistoryMobilePropsParts({
    renderState: responseHistoryRenderState,
    styles,
    onToggleCollapsed,
    onSpeakResponse,
  });

  return (
    <View {...responseHistoryParts.container.props}>
      <TouchableOpacity
        {...responseHistoryParts.header.touchable.props}
      >
        <View {...responseHistoryParts.header.left.props}>
          <Ionicons
            {...responseHistoryParts.header.icon.props}
          />
          <Text {...responseHistoryParts.header.title.props}>
            {responseHistoryParts.header.title.text}
          </Text>
          <View {...responseHistoryParts.header.badge.props}>
            <Text {...responseHistoryParts.header.badge.text.props}>
              {responseHistoryParts.header.badge.text.value}
            </Text>
          </View>
        </View>
        <Ionicons
          {...responseHistoryParts.header.toggleIcon.props}
        />
      </TouchableOpacity>
      {responseHistoryParts.collapsedPreview.shouldRender ? (
        <View {...responseHistoryParts.collapsedPreview.props}>
          <Text {...responseHistoryParts.collapsedPreview.timestamp.props}>
            {responseHistoryParts.collapsedPreview.timestamp.text}
          </Text>
          <Text
            {...responseHistoryParts.collapsedPreview.preview.props}
          >
            {responseHistoryParts.collapsedPreview.preview.text}
          </Text>
        </View>
      ) : null}
      {responseHistoryParts.list.shouldRender ? (
        <ScrollView
          {...responseHistoryParts.list.props}
        >
          {responseHistoryParts.list.items.map((item) => {
            return (
              <React.Fragment key={item.key}>
                {item.separator.shouldRender ? <View {...item.separator.props} /> : null}
                <AnimatedResponseItem
                  isNewest={item.animated.isNewest}
                  animation={item.animated.animation}
                >
                  <View {...item.container.props}>
                    <View {...item.header.props}>
                      <Text {...item.timestamp.props}>
                        {item.timestamp.text}
                      </Text>
                      <TouchableOpacity
                        {...item.speakButton.props}
                      >
                        <Ionicons
                          {...item.speakIcon.props}
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
      ) : null}
    </View>
  );
}
