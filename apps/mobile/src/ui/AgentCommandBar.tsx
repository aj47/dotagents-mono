import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from './ThemeProvider';
import { spacing, radius } from './theme';
import { useCommandQueueContext } from '../store/command-queue';

interface AgentCommandBarProps {
  onSend: (text: string, conversationId?: string, sessionId?: string) => Promise<void>;
  onDispatch: (text: string, onSubmitted: () => void) => void;
}

export function AgentCommandBar({ onSend, onDispatch }: AgentCommandBarProps) {
  const { theme } = useTheme();
  const {
    isActive,
    queue,
    index,
    current,
    exitCommandQueue,
    advanceQueue,
    goBackQueue,
    skipCurrent,
    appendNewSlot,
  } = useCommandQueueContext();

  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const actionConfig = {
    new: { placeholder: 'Describe a new task to dispatch...', button: 'Dispatch', color: '#10b981' },
    steer: { placeholder: 'Steer this agent mid-run...', button: 'Steer', color: '#3b82f6' },
    reply: { placeholder: 'Reply to this agent...', button: 'Reply', color: '#8b5cf6' },
  } as const;

  const cfg = actionConfig[current?.kind ?? 'new'];
  const progressPercent = queue.length > 0 ? index / queue.length : 0;

  useEffect(() => {
    if (isActive) {
      setText('');
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isActive, index]);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (current?.kind === 'new') {
        const captured = text;
        setText('');
        onDispatch(captured, () => advanceQueue());
        return;
      }
      await onSend(text, current?.conversationId, current?.sessionId);
      setText('');
      advanceQueue();
    } catch (e) {
      console.error('[AgentCommandBar] submit failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  }, [text, isSubmitting, current, onSend, onDispatch, advanceQueue]);

  if (!isActive) return null;

  const currentTitle = current?.title ?? 'Untitled';
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent * 100}%` as any }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.counter} numberOfLines={1}>
          {index + 1}/{queue.length}
        </Text>
        {current?.kind === 'new' ? (
          <Text style={[styles.actionLabel, { color: cfg.color }]} numberOfLines={1}>
            Dispatch new agent
          </Text>
        ) : (
          <Text style={styles.titleRow} numberOfLines={1}>
            <Text style={[styles.actionLabel, { color: cfg.color }]}>{cfg.button} · </Text>
            <Text style={styles.titleText}>{currentTitle}</Text>
          </Text>
        )}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={goBackQueue}
            style={styles.iconBtn}
            accessibilityLabel="Previous entry"
            disabled={index === 0}
          >
            <Text style={[styles.iconBtnText, index === 0 && styles.iconBtnDisabled]}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={advanceQueue}
            style={styles.iconBtn}
            accessibilityLabel="Next entry"
            disabled={index >= queue.length - 1}
          >
            <Text style={[styles.iconBtnText, index >= queue.length - 1 && styles.iconBtnDisabled]}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={skipCurrent} style={styles.iconBtn} accessibilityLabel="Skip">
            <Text style={styles.iconBtnText}>⇥</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={appendNewSlot} style={styles.iconBtn} accessibilityLabel="Add new task">
            <Text style={styles.iconBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={exitCommandQueue} style={styles.iconBtn} accessibilityLabel="Exit">
            <Text style={styles.iconBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.colors.foreground, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
          value={text}
          onChangeText={setText}
          placeholder={cfg.placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
          multiline
          editable={!isSubmitting}
          onSubmitEditing={handleSubmit}
          accessibilityLabel={cfg.placeholder}
        />
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.sendBtn, { backgroundColor: cfg.color, opacity: !text.trim() || isSubmitting ? 0.5 : 1 }]}
          disabled={!text.trim() || isSubmitting}
          accessibilityLabel={`${cfg.button} and advance`}
        >
          <Text style={styles.sendBtnText}>{cfg.button}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    container: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    progressTrack: {
      height: 2,
      backgroundColor: theme.colors.muted ?? theme.colors.border,
    },
    progressFill: {
      height: '100%' as any,
      backgroundColor: '#3b82f6',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 6,
    },
    counter: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.mutedForeground,
      minWidth: 28,
    },
    titleRow: {
      flex: 1,
      fontSize: 11,
    },
    titleText: {
      color: theme.colors.mutedForeground,
    },
    actionLabel: {
      fontWeight: '700',
      fontSize: 11,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 2,
      marginLeft: 'auto',
    },
    iconBtn: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnText: {
      fontSize: 14,
      color: theme.colors.mutedForeground,
    },
    iconBtnDisabled: {
      opacity: 0.3,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 14,
      maxHeight: 100,
    },
    sendBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 13,
    },
  });
}
