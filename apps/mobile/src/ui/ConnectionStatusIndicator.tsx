import React, { memo, useRef, useEffect, useMemo } from 'react';
import { View, Text, Animated } from 'react-native';
import {
  createConnectionStatusIndicatorMobilePropsParts,
  type ConnectionStatus,
  type ConnectionStatusIndicatorMobilePropsParts,
} from '@dotagents/shared/session-presentation';
import {
  useConnectionStatusIndicatorMobileStyleSlots,
  type ConnectionStatusIndicatorStyles,
} from './ConnectionStatusIndicatorMobileStyles';

export interface ConnectionStatusIndicatorProps {
  state: ConnectionStatus;
  retryCount?: number;
  compact?: boolean;
}

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
export const ConnectionStatusIndicator = memo(function ConnectionStatusIndicator({
  state,
  retryCount = 0,
  compact = false,
}: ConnectionStatusIndicatorProps) {
  const { connectionStatusState, styles } = useConnectionStatusIndicatorMobileStyleSlots({
    state,
    retryCount,
    compact,
  });
  const connectionStatusAnimation = connectionStatusState.animation;
  const pulseAnim = useRef(new Animated.Value(connectionStatusAnimation.minOpacity)).current;
  const pulseAnimatedStyle = useMemo<ConnectionStatusPulseAnimatedStyle>(() => ({ opacity: pulseAnim }), [pulseAnim]);
  const connectionStatusParts = useMemo<ConnectionStatusIndicatorParts>(
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
});

export default ConnectionStatusIndicator;
