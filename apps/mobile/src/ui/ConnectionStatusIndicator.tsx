import React, { memo, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from './ThemeProvider';
import { TunnelConnectionState } from '../lib/tunnelConnectionManager';

export interface ConnectionStatusIndicatorProps {
  state: TunnelConnectionState;
  retryCount?: number;
  compact?: boolean;
}

const STATUS_META: Record<TunnelConnectionState, { color: string; label: string; pulsing: boolean }> = {
  connected: { color: '#22c55e', label: 'Connected', pulsing: false },
  connecting: { color: '#f59e0b', label: 'Connecting...', pulsing: true },
  reconnecting: { color: '#f59e0b', label: 'Reconnecting...', pulsing: true },
  disconnected: { color: '#6b7280', label: 'Disconnected', pulsing: false },
  failed: { color: '#ef4444', label: 'Connection failed', pulsing: false },
};

/**
 * Visual indicator for tunnel connection status.
 * Shows a colored dot and optional status text.
 */
export const ConnectionStatusIndicator = memo(function ConnectionStatusIndicator({
  state,
  retryCount = 0,
  compact = false,
}: ConnectionStatusIndicatorProps) {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const status = STATUS_META[state] ?? STATUS_META.disconnected;
  const statusText = useMemo(
    () => state === 'reconnecting' && retryCount > 0
      ? `Reconnecting (${retryCount})...`
      : status.label,
    [retryCount, state, status.label],
  );

  useEffect(() => {
    if (status.pulsing) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(0.3);
    }
  }, [status.pulsing, pulseAnim]);

  return (
    <View style={[styles.container, compact && styles.containerCompact]} accessibilityLabel={statusText} accessibilityRole="text">
      <View style={styles.dotContainer}>
        <View
          style={[
            styles.dot,
            { backgroundColor: status.color },
            status.pulsing && styles.dotPulsing,
          ]}
        />
        {status.pulsing && (
          <Animated.View
            style={[
              styles.dotPulse,
              { backgroundColor: status.color, opacity: pulseAnim },
            ]}
          />
        )}
      </View>
      {!compact && (
        <Text style={[styles.text, { color: theme.colors.mutedForeground }]}>
          {statusText}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  containerCompact: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  dotContainer: {
    position: 'relative',
    width: 10,
    height: 10,
    marginRight: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 1,
    left: 1,
  },
  dotPulsing: {
    opacity: 1,
  },
  dotPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.3,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ConnectionStatusIndicator;
