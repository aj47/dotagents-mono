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
  getAgentResponseHistoryMobileRenderState,
  type AgentResponseHistoryMobileAnimationState,
  type AgentResponseHistoryMobilePropsParts,
  type AgentResponseHistoryMobileStyleSheetSlots,
} from '@dotagents/shared/session-presentation';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface ResponseHistoryEntry {
  id?: string;
  text: string;
  timestamp: number;
}

type ResponseHistoryToggleHandler = () => void;
type ResponseHistorySpeakHandler = (text: string, index: number) => void;

export type ResponseHistoryPanelColors =
  Parameters<typeof getAgentResponseHistoryMobileRenderState>[0]['colors'];

export type ResponseHistoryPanelStyleSheetSlotsFactory = (input: {
  renderState: ReturnType<typeof getAgentResponseHistoryMobileRenderState>;
}) => AgentResponseHistoryMobileStyleSheetSlots;

interface ResponseHistoryPanelProps {
  responses: ResponseHistoryEntry[];
  colors: ResponseHistoryPanelColors;
  remoteBaseUrl?: string;
  remoteApiKey?: string;
  isCollapsed: boolean;
  shouldAnimateNewest: boolean;
  speakingIndex: number | null;
  createStyleSheetSlots: ResponseHistoryPanelStyleSheetSlotsFactory;
  onToggleCollapsed: ResponseHistoryToggleHandler;
  onSpeakResponse: ResponseHistorySpeakHandler;
}

type ResponseHistoryPanelStyles = AgentResponseHistoryMobileStyleSheetSlots;

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
  createStyleSheetSlots,
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
  const responseHistoryStyleSheetSlots = createStyleSheetSlots({
    renderState: responseHistoryRenderState,
  });

  if (!responseHistoryRenderState.shouldRender) {
    return null;
  }

  const styles: ResponseHistoryPanelStyles = StyleSheet.create({
    ...responseHistoryStyleSheetSlots,
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
