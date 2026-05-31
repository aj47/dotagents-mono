import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalTtsPlayback, stopGlobalTtsPlayback } from '../store/ttsPlayback';
import { useTheme } from './ThemeProvider';
import { Theme, hexToRgba, radius, spacing } from './theme';

type GlobalTtsStatusPillProps = {
  compact?: boolean;
  onOpenSession?: (sessionId: string) => void;
};

export function GlobalTtsStatusPill({
  compact = false,
  onOpenSession,
}: GlobalTtsStatusPillProps) {
  const playback = useGlobalTtsPlayback();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);

  if (!playback) {
    return null;
  }

  const canOpenSession = Boolean(playback.sessionId && onOpenSession);
  const title = playback.sessionTitle?.trim() || getSourceLabel(playback.source);
  const detail = playback.textPreview || 'Audio playback';
  const statusLabel = playback.status === 'loading' ? 'Loading TTS' : 'Speaking';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.openButton}
        onPress={() => {
          if (playback.sessionId) {
            onOpenSession?.(playback.sessionId);
          }
        }}
        disabled={!canOpenSession}
        accessibilityRole="button"
        accessibilityLabel={canOpenSession ? `Go to speech source: ${title}` : `Current TTS: ${title}`}
        accessibilityHint={canOpenSession ? 'Opens the chat that is currently speaking.' : undefined}
      >
        <Ionicons
          name={playback.status === 'loading' ? 'hourglass-outline' : 'volume-high-outline'}
          size={compact ? 12 : 14}
          color={theme.colors.primary}
        />
        <View style={styles.textColumn}>
          {!compact && (
            <Text style={styles.statusText} numberOfLines={1}>
              {statusLabel}
            </Text>
          )}
          <Text style={styles.titleText} numberOfLines={1}>
            {compact ? `${statusLabel}: ${title}` : title}
          </Text>
          {!compact && (
            <Text style={styles.detailText} numberOfLines={1}>
              {detail}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.skipButton}
        onPress={stopGlobalTtsPlayback}
        accessibilityRole="button"
        accessibilityLabel="Skip TTS"
        accessibilityHint="Stops the currently playing text to speech audio."
      >
        <Ionicons name="stop" size={compact ? 12 : 14} color={theme.colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

function getSourceLabel(source: string): string {
  if (source === 'history') return 'Agent response';
  if (source === 'settings') return 'Voice test';
  if (source === 'message') return 'Chat message';
  return 'Assistant';
}

function createStyles(theme: Theme, compact: boolean) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      maxWidth: compact ? 190 : 360,
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.primary, 0.35),
      backgroundColor: theme.colors.card,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    openButton: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: compact ? 4 : spacing.xs,
      paddingLeft: compact ? 7 : spacing.sm,
      paddingRight: compact ? 5 : spacing.xs,
      paddingVertical: compact ? 3 : spacing.xs,
    },
    textColumn: {
      flex: 1,
      minWidth: 0,
    },
    statusText: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      fontSize: 10,
      fontWeight: '700',
    },
    titleText: {
      ...theme.typography.caption,
      color: theme.colors.foreground,
      fontSize: compact ? 10 : 12,
      fontWeight: '700',
    },
    detailText: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      fontSize: 10,
    },
    skipButton: {
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: compact ? 7 : spacing.sm,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
  });
}
