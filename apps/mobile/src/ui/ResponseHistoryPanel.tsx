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
  type AgentResponseHistoryMobileRenderState,
  type AgentResponseHistoryMobileSurfaceColorPalette,
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

export type ResponseHistoryPanelColors = AgentResponseHistoryMobileSurfaceColorPalette;

export type ResponseHistoryPanelStyleSheetSlotsFactory = (input: {
  renderState: AgentResponseHistoryMobileRenderState<ResponseHistoryEntry>;
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

type ResponseHistoryPanelListParts = Extract<
  ResponseHistoryPanelParts['list'],
  { shouldRender: true }
>;

type ResponseHistoryPanelListItemPart = ResponseHistoryPanelListParts['items'][number];

interface AnimatedResponseItemProps {
  children: React.ReactNode;
  isNewest: boolean;
  animation: AgentResponseHistoryMobileAnimationState;
}

/**
 * Animated wrapper for response items - fades in when first rendered as newest
 */
const AnimatedResponseItem = React.memo(function AnimatedResponseItem({
  children,
  isNewest,
  animation,
}: AnimatedResponseItemProps) {
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
});

interface ResponseHistoryListItemProps {
  item: ResponseHistoryPanelListItemPart;
  remoteBaseUrl?: string;
  remoteApiKey?: string;
}

const ResponseHistoryListItem = React.memo(function ResponseHistoryListItem({
  item,
  remoteBaseUrl,
  remoteApiKey,
}: ResponseHistoryListItemProps) {
  return (
    <>
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
    </>
  );
});

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
  const responseHistoryRenderState = useMemo(
    () => getAgentResponseHistoryMobileRenderState({
      responses,
      colors,
      isCollapsed,
      animateNewest: shouldAnimateNewest,
      speakingIndex,
    }),
    [colors, isCollapsed, responses, shouldAnimateNewest, speakingIndex],
  );
  const responseHistoryStyleSheetSlots = useMemo(
    () => createStyleSheetSlots({
      renderState: responseHistoryRenderState,
    }),
    [createStyleSheetSlots, responseHistoryRenderState],
  );
  const styles = useMemo<ResponseHistoryPanelStyles>(
    () => StyleSheet.create({
      ...responseHistoryStyleSheetSlots,
    }),
    [responseHistoryStyleSheetSlots],
  );
  const responseHistoryParts = useMemo<ResponseHistoryPanelParts>(
    () => createAgentResponseHistoryMobilePropsParts({
      renderState: responseHistoryRenderState,
      styles,
      onToggleCollapsed,
      onSpeakResponse,
    }),
    [onSpeakResponse, onToggleCollapsed, responseHistoryRenderState, styles],
  );

  if (!responseHistoryRenderState.shouldRender) {
    return null;
  }

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
          {responseHistoryParts.list.items.map((item) => (
            <ResponseHistoryListItem
              key={item.key}
              item={item}
              remoteBaseUrl={remoteBaseUrl}
              remoteApiKey={remoteApiKey}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
