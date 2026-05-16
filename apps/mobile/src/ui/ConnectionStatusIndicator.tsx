import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from './ThemeProvider';
import {
  getConnectionStatusIndicatorMobileRenderState,
  getConnectionStatusIndicatorMobileSurfaceState,
  type ConnectionStatus,
} from '@dotagents/shared/connection-recovery';

export interface ConnectionStatusIndicatorProps {
  state: ConnectionStatus;
  retryCount?: number;
  compact?: boolean;
}

const connectionStatusSurface = getConnectionStatusIndicatorMobileSurfaceState();

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
  const pulseAnim = useRef(new Animated.Value(connectionStatusSurface.pulse.minOpacity)).current;

  const connectionStatusState = useMemo(
    () => getConnectionStatusIndicatorMobileRenderState({
      status: state,
      retryCount,
      compact,
      colors: theme.colors,
    }),
    [compact, retryCount, state, theme.colors],
  );
  const colorStyles = useMemo(
    () => StyleSheet.create({
      dot: {
        backgroundColor: connectionStatusState.colors.dot.backgroundColor,
      },
      pulse: {
        backgroundColor: connectionStatusState.colors.pulse.backgroundColor,
      },
      text: {
        color: connectionStatusState.colors.text.color,
      },
    }),
    [connectionStatusState.colors],
  );
  const pulseAnimatedStyle = useMemo(() => ({ opacity: pulseAnim }), [pulseAnim]);

  useEffect(() => {
    if (connectionStatusState.isPulsing) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: connectionStatusSurface.pulse.maxOpacity,
            duration: connectionStatusSurface.pulse.durationMs,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: connectionStatusSurface.pulse.minOpacity,
            duration: connectionStatusSurface.pulse.durationMs,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(connectionStatusSurface.pulse.minOpacity);
    }
  }, [connectionStatusState.isPulsing, pulseAnim]);

  return (
    <View
      style={[styles.container, compact && styles.containerCompact]}
      accessibilityLabel={connectionStatusState.accessibilityLabel}
      accessibilityRole={connectionStatusState.accessibilityRole}
    >
      <View style={styles.dotContainer}>
        <View
          style={[
            styles.dot,
            colorStyles.dot,
            connectionStatusState.isPulsing && styles.dotPulsing,
          ]}
        />
        {connectionStatusState.shouldRenderPulse && (
          <Animated.View
            style={[
              styles.dotPulse,
              colorStyles.pulse,
              pulseAnimatedStyle,
            ]}
          />
        )}
      </View>
      {connectionStatusState.shouldRenderText && (
        <Text style={[styles.text, colorStyles.text]}>
          {connectionStatusState.statusText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: connectionStatusSurface.container.flexDirection,
    alignItems: connectionStatusSurface.container.alignItems,
    paddingVertical: connectionStatusSurface.container.paddingVertical,
    paddingHorizontal: connectionStatusSurface.container.paddingHorizontal,
  },
  containerCompact: {
    paddingVertical: connectionStatusSurface.container.compactPaddingVertical,
    paddingHorizontal: connectionStatusSurface.container.compactPaddingHorizontal,
  },
  dotContainer: {
    position: connectionStatusSurface.dotContainer.position,
    width: connectionStatusSurface.dotContainer.size,
    height: connectionStatusSurface.dotContainer.size,
    marginRight: connectionStatusSurface.dotContainer.marginRight,
  },
  dot: {
    width: connectionStatusSurface.dot.size,
    height: connectionStatusSurface.dot.size,
    borderRadius: connectionStatusSurface.dot.borderRadius,
    position: connectionStatusSurface.dot.position,
    top: connectionStatusSurface.dot.offset,
    left: connectionStatusSurface.dot.offset,
  },
  dotPulsing: {
    opacity: connectionStatusSurface.dot.pulsingOpacity,
  },
  dotPulse: {
    width: connectionStatusSurface.pulse.size,
    height: connectionStatusSurface.pulse.size,
    borderRadius: connectionStatusSurface.pulse.borderRadius,
    opacity: connectionStatusSurface.pulse.minOpacity,
    position: connectionStatusSurface.pulse.position,
    top: connectionStatusSurface.pulse.top,
    left: connectionStatusSurface.pulse.left,
  },
  text: {
    fontSize: connectionStatusSurface.text.fontSize,
    fontWeight: connectionStatusSurface.text.fontWeight,
  },
});

export default ConnectionStatusIndicator;
