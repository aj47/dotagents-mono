import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';
import {
  createConnectionStatusIndicatorMobilePropsParts,
  createConnectionStatusIndicatorMobileStyleSlots,
  getConnectionStatusIndicatorMobileRenderState,
  type ConnectionStatus,
  type ConnectionStatusIndicatorMobilePropsParts,
} from '@dotagents/shared/session-presentation';

export interface ConnectionStatusIndicatorProps {
  state: ConnectionStatus;
  retryCount?: number;
  compact?: boolean;
}

type ConnectionStatusIndicatorStyles = {
  container: StyleProp<ViewStyle>;
  containerCompact: StyleProp<ViewStyle>;
  dotContainer: StyleProp<ViewStyle>;
  dot: StyleProp<ViewStyle>;
  dotPulsing: StyleProp<ViewStyle>;
  dotPulse: StyleProp<ViewStyle>;
  dotColor: StyleProp<ViewStyle>;
  pulseColor: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  textColor: StyleProp<TextStyle>;
};

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
  const connectionStatusStyleSlots = useMemo(
    () => createConnectionStatusIndicatorMobileStyleSlots({
      renderState: connectionStatusState,
    }),
    [connectionStatusState],
  );
  const styles = useMemo<ConnectionStatusIndicatorStyles>(
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
