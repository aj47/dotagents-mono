import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalTtsQueue, useTtsQueueState } from '../store/globalTtsQueue';
import type { TtsQueueItem } from '../store/ttsQueue';
import { useTheme } from './ThemeProvider';
import { Theme, hexToRgba, radius, spacing } from './theme';

type TtsQueueDockProps = {
  onOpenSession?: (sessionId: string) => void;
};

function agentLabel(item: TtsQueueItem | null): string {
  return item?.agentName || item?.sessionTitle || 'Agent';
}

/**
 * Compact-first multi-agent TTS control surface.
 *
 * Collapsed it is a single pill: the agent currently talking, a live icon,
 * a "+N" badge for queued utterances, and quick pause / stop-all controls.
 * Tapping expands an inline panel listing the queue with per-item controls
 * (play now, skip, mute that agent) plus global pause and stop-all.
 */
export function TtsQueueDock({ onOpenSession }: TtsQueueDockProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const state = useTtsQueueState();
  const [expanded, setExpanded] = useState(false);

  const hasAnything = !!state.active || state.queue.length > 0;
  if (!hasAnything && !state.paused) return null;

  const waiting = state.queue.length;
  const activeName = agentLabel(state.active);
  const withheld = state.deferred.filter((d) => !d.announceOnly).length;

  return (
    <View style={styles.container}>
      {/* Collapsed pill row (always visible). */}
      <View style={styles.pillRow}>
        <TouchableOpacity
          style={styles.pillMain}
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={
            state.paused
              ? 'Voice playback paused. Tap to expand controls.'
              : `${activeName} speaking${waiting ? `, ${waiting} waiting` : ''}. Tap to expand controls.`
          }
        >
          <View style={styles.iconWrap}>
            <Ionicons
              name={state.paused ? 'pause' : state.activeStatus === 'loading' ? 'hourglass-outline' : 'volume-high'}
              size={16}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {state.paused ? 'Playback paused' : activeName}
            </Text>
            <Text style={styles.detail} numberOfLines={1}>
              {state.active?.textPreview || (waiting ? `${waiting} waiting` : 'Tap for controls')}
            </Text>
          </View>
          {waiting > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>+{waiting}</Text>
            </View>
          )}
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-up'}
            size={16}
            color={theme.colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => globalTtsQueue.togglePause()}
          accessibilityRole="button"
          accessibilityLabel={state.paused ? 'Resume playback' : 'Pause playback'}
        >
          <Ionicons name={state.paused ? 'play' : 'pause'} size={16} color={theme.colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => globalTtsQueue.stopAll()}
          accessibilityRole="button"
          accessibilityLabel="Stop all playback"
        >
          <Ionicons name="stop" size={16} color={theme.colors.destructive} />
        </TouchableOpacity>
      </View>

      {/* Expanded queue panel. */}
      {expanded && (
        <View style={styles.panel}>
          {state.active && (
            <QueueRow
              styles={styles}
              theme={theme}
              item={state.active}
              isActive
              onSkip={() => globalTtsQueue.skip()}
              onMute={() => globalTtsQueue.muteAgent(agentLabel(state.active))}
              onOpen={state.active.sessionId && onOpenSession ? () => onOpenSession(state.active!.sessionId!) : undefined}
            />
          )}
          {state.queue.map((item) => (
            <QueueRow
              key={item.id}
              styles={styles}
              theme={theme}
              item={item}
              onPlayNow={() => globalTtsQueue.readAgent(agentLabel(item))}
              onMute={() => globalTtsQueue.muteAgent(agentLabel(item))}
              onOpen={item.sessionId && onOpenSession ? () => onOpenSession(item.sessionId!) : undefined}
            />
          ))}
          {withheld > 0 && (
            <TouchableOpacity
              style={styles.readAllButton}
              onPress={() => globalTtsQueue.readAllDeferred()}
              accessibilityRole="button"
              accessibilityLabel="Read all withheld messages"
            >
              <Ionicons name="albums-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.readAllText}>Read {withheld} withheld</Text>
            </TouchableOpacity>
          )}
          {state.mutedAgents.length > 0 && (
            <Text style={styles.mutedNote} numberOfLines={2}>
              Muted: {state.mutedAgents.join(', ')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function QueueRow({
  styles,
  theme,
  item,
  isActive,
  onSkip,
  onMute,
  onPlayNow,
  onOpen,
}: {
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
  item: TtsQueueItem;
  isActive?: boolean;
  onSkip?: () => void;
  onMute?: () => void;
  onPlayNow?: () => void;
  onOpen?: () => void;
}) {
  return (
    <View style={[styles.row, isActive && styles.rowActive]}>
      <Ionicons
        name={isActive ? 'volume-high' : 'ellipse-outline'}
        size={14}
        color={isActive ? theme.colors.primary : theme.colors.mutedForeground}
      />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>{agentLabel(item)}</Text>
        <Text style={styles.rowDetail} numberOfLines={1}>{item.textPreview}</Text>
      </View>
      {onPlayNow && (
        <TouchableOpacity style={styles.rowButton} onPress={onPlayNow} accessibilityRole="button" accessibilityLabel={`Play ${agentLabel(item)} now`}>
          <Ionicons name="play-skip-forward" size={15} color={theme.colors.foreground} />
        </TouchableOpacity>
      )}
      {onSkip && (
        <TouchableOpacity style={styles.rowButton} onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip current">
          <Ionicons name="play-forward" size={15} color={theme.colors.foreground} />
        </TouchableOpacity>
      )}
      {onOpen && (
        <TouchableOpacity style={styles.rowButton} onPress={onOpen} accessibilityRole="button" accessibilityLabel="Open agent chat">
          <Ionicons name="open-outline" size={15} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
      )}
      {onMute && (
        <TouchableOpacity style={styles.rowButton} onPress={onMute} accessibilityRole="button" accessibilityLabel={`Mute ${agentLabel(item)}`}>
          <Ionicons name="volume-mute" size={15} color={theme.colors.destructive} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      marginHorizontal: spacing.sm,
      marginBottom: spacing.xs,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      overflow: 'hidden',
    },
    pillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      gap: spacing.xs,
    },
    pillMain: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(theme.colors.primary, 0.12),
    },
    textWrap: { flex: 1, minWidth: 0 },
    title: { ...theme.typography.label, color: theme.colors.foreground, fontWeight: '700' },
    detail: { ...theme.typography.caption, color: theme.colors.mutedForeground },
    badge: {
      minWidth: 22,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { color: theme.colors.primaryForeground, fontSize: 11, fontWeight: '700' },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    panel: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: 4,
    },
    rowActive: {
      backgroundColor: hexToRgba(theme.colors.primary, 0.06),
      borderRadius: radius.sm,
      paddingHorizontal: 4,
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: { ...theme.typography.caption, color: theme.colors.foreground, fontWeight: '600' },
    rowDetail: { ...theme.typography.caption, color: theme.colors.mutedForeground, fontSize: 11 },
    rowButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    readAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: 4,
    },
    readAllText: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '600' },
    mutedNote: { ...theme.typography.caption, color: theme.colors.mutedForeground, fontStyle: 'italic' },
  });
}
