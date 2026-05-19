import React, { memo, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from './ThemeProvider';
import { TunnelConnectionState } from '../lib/tunnelConnectionManager';

export interface ConnectionStatusIndicatorProps {
  state: TunnelConnectionState;
  retryCount?: number;
  compact?: boolean;
}

const STATUS_LABELS: Record<TunnelConnectionState, string> = {
  connected: 'Connected',
  connecting: 'Connecting...',
  reconnecting: 'Reconnecting...',
  disconnected: 'Disconnected',
  failed: 'Connection failed',
};

function formatConnectionStatusIndicatorLabel(state: TunnelConnectionState, retryCount: number): string {
  if (state === 'reconnecting' && retryCount > 0) {
    return `Reconnecting (${retryCount})...`;
  }
  return STATUS_LABELS[state] ?? 'Unknown';
}

function isConnectionStatusIndicatorPulsing(state: TunnelConnectionState): boolean {
  return state === 'connecting' || state === 'reconnecting';
}

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
  const isPulsing = isConnectionStatusIndicatorPulsing(state);
  const statusText = useMemo(() => formatConnectionStatusIndicatorLabel(state, retryCount), [retryCount, state]);
  const statusColor = useMemo(() => {
    switch (state) {
      case 'connected':
        return theme.colors.success;
      case 'connecting':
      case 'reconnecting':
        return theme.colors.warning;
      case 'failed':
        return theme.colors.destructive;
      case 'disconnected':
      default:
        return theme.colors.mutedForeground;
    }
  }, [state, theme.colors.destructive, theme.colors.mutedForeground, theme.colors.success, theme.colors.warning]);

  useEffect(() => {
    if (isPulsing) {
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
  }, [isPulsing, pulseAnim]);

  return (
    <View style={[styles.container, compact && styles.containerCompact]} accessibilityLabel={statusText} accessibilityRole="text">
      <View style={styles.dotContainer}>
        <View
          style={[
            styles.dot,
            { backgroundColor: statusColor },
            isPulsing && styles.dotPulsing,
          ]}
        />
        {isPulsing && (
          <Animated.View
            style={[
              styles.dotPulse,
              { backgroundColor: statusColor, opacity: pulseAnim },
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
