import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from './ThemeProvider';
import {
  createConnectionStatusIndicatorMobilePropsParts,
  createConnectionStatusIndicatorMobileStyleSheetSlots,
  getConnectionStatusIndicatorMobileRenderState,
  type ConnectionStatus,
  type ConnectionStatusIndicatorMobilePropsParts,
  type ConnectionStatusIndicatorMobileStyleSheetSlots,
} from '@dotagents/shared/session-presentation';

export interface ConnectionStatusIndicatorProps {
  state: ConnectionStatus;
  retryCount?: number;
  compact?: boolean;
}

type ConnectionStatusIndicatorStyles = ConnectionStatusIndicatorMobileStyleSheetSlots;

type ConnectionStatusPulseAnimatedStyle = {
  opacity: Animated.Value;
};

type ConnectionStatusIndicatorParts =
  ConnectionStatusIndicatorMobilePropsParts<
    ConnectionStatusIndicatorStyles,
    ConnectionStatusPulseAnimatedStyle
  >;

/**
 * Visual indicator for tunnel connection status.
 * Shows a colored dot and optional status text.
 */
export function ConnectionStatusIndicator({
  state,
  retryCount = 0,
  compact = false,
}: ConnectionStatusIndicatorProps) {
  const { theme } = useTheme();
  const connectionStatusState = useMemo(
    () => getConnectionStatusIndicatorMobileRenderState({
      status: state,
      retryCount,
      compact,
      colors: theme.colors,
    }),
    [compact, retryCount, state, theme.colors],
  );
  const connectionStatusAnimation = connectionStatusState.animation;
  const pulseAnim = useRef(new Animated.Value(connectionStatusAnimation.minOpacity)).current;
  const connectionStatusStyleSheetSlots = useMemo(
    () => createConnectionStatusIndicatorMobileStyleSheetSlots({
      renderState: connectionStatusState,
    }),
    [connectionStatusState],
  );
  const styles = useMemo<ConnectionStatusIndicatorStyles>(
    () => StyleSheet.create({ ...connectionStatusStyleSheetSlots }),
    [connectionStatusStyleSheetSlots],
  );
  const pulseAnimatedStyle = useMemo<ConnectionStatusPulseAnimatedStyle>(() => ({ opacity: pulseAnim }), [pulseAnim]);
  const connectionStatusParts = useMemo(
    (): ConnectionStatusIndicatorParts => createConnectionStatusIndicatorMobilePropsParts({
      renderState: connectionStatusState,
      styles,
      pulseAnimatedStyle,
      compact,
    }),
    [compact, connectionStatusState, pulseAnimatedStyle, styles],
  );

  useEffect(() => {
    if (connectionStatusState.isPulsing) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: connectionStatusAnimation.maxOpacity,
            duration: connectionStatusAnimation.durationMs,
            useNativeDriver: connectionStatusAnimation.useNativeDriver,
          }),
          Animated.timing(pulseAnim, {
            toValue: connectionStatusAnimation.minOpacity,
            duration: connectionStatusAnimation.durationMs,
            useNativeDriver: connectionStatusAnimation.useNativeDriver,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(connectionStatusAnimation.minOpacity);
    }
  }, [connectionStatusState.isPulsing, connectionStatusAnimation, pulseAnim]);

  return (
    <View {...connectionStatusParts.container.props}>
      <View {...connectionStatusParts.dotContainer.props}>
        <View {...connectionStatusParts.dot.props} />
        {connectionStatusParts.pulse && (
          <Animated.View {...connectionStatusParts.pulse.props} />
        )}
      </View>
      {connectionStatusParts.text && (
        <Text {...connectionStatusParts.text.props}>
          {connectionStatusParts.text.text}
        </Text>
      )}
    </View>
  );
}

export default ConnectionStatusIndicator;
