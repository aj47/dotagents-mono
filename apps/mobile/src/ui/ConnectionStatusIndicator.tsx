import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from './ThemeProvider';
import {
  createConnectionStatusIndicatorMobilePropsParts,
  createConnectionStatusIndicatorMobileStyleSlots,
  getConnectionStatusIndicatorMobileRenderState,
  type ConnectionStatus,
} from '@dotagents/shared/session-presentation';

export interface ConnectionStatusIndicatorProps {
  state: ConnectionStatus;
  retryCount?: number;
  compact?: boolean;
}

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
  const connectionStatusStyleSlots = useMemo(
    () => createConnectionStatusIndicatorMobileStyleSlots({
      renderState: connectionStatusState,
    }),
    [connectionStatusState],
  );
  const styles = useMemo(
    () => StyleSheet.create({
      container: {
        ...connectionStatusStyleSlots.container,
      },
      containerCompact: {
        ...connectionStatusStyleSlots.containerCompact,
      },
      dotContainer: {
        ...connectionStatusStyleSlots.dotContainer,
      },
      dot: {
        ...connectionStatusStyleSlots.dot,
      },
      dotPulsing: {
        ...connectionStatusStyleSlots.dotPulsing,
      },
      dotPulse: {
        ...connectionStatusStyleSlots.dotPulse,
      },
      dotColor: {
        ...connectionStatusStyleSlots.dotColor,
      },
      pulseColor: {
        ...connectionStatusStyleSlots.pulseColor,
      },
      text: {
        ...connectionStatusStyleSlots.text,
      },
      textColor: {
        ...connectionStatusStyleSlots.textColor,
      },
    }),
    [connectionStatusStyleSlots],
  );
  const pulseAnimatedStyle = useMemo(() => ({ opacity: pulseAnim }), [pulseAnim]);
  const connectionStatusParts = useMemo(
    () => createConnectionStatusIndicatorMobilePropsParts({
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
