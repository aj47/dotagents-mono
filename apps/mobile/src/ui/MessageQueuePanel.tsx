/**
 * MessageQueuePanel - React Native version of the message queue panel UI
 * 
 * Displays queued messages with options to view, edit, remove, and retry.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QueuedMessage } from '@dotagents/shared';
import {
  createButtonAccessibilityLabel,
  createExpandCollapseAccessibilityLabel,
  createMinimumTouchTargetStyle,
} from '../lib/accessibility';
import { useTheme } from './ThemeProvider';

interface MessageQueuePanelProps {
  conversationId: string;
  messages: QueuedMessage[];
  onRemove: (messageId: string) => void;
  onUpdate: (messageId: string, text: string) => void;
  onRetry: (messageId: string) => void;
  onClear: () => void;
  compact?: boolean;
}

interface QueuedMessageItemProps {
  message: QueuedMessage;
  onRemove: () => void;
  onUpdate: (text: string) => void;
  onRetry: () => void;
}

function QueuedMessageItem({ message, onRemove, onUpdate, onRetry }: QueuedMessageItemProps) {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const expandButtonTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: 4,
    verticalPadding: 4,
    horizontalMargin: 0,
  });
  const queueActionTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: 8,
    verticalPadding: 8,
    horizontalMargin: 0,
  });

  // Sync editText with message.text when it changes (only when not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditText(message.text);
    }
  }, [message.text, isEditing]);

  // Exit edit mode when the message starts processing
  useEffect(() => {
    if (message.status === 'processing') {
      setIsEditing(false);
      setEditText(message.text);
    }
  }, [message.status, message.text]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== message.text) {
      onUpdate(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text);
  };

  const isLongMessage = message.text.length > 100;
  const isFailed = message.status === 'failed';
  const isProcessing = message.status === 'processing';
  const isAddedToHistory = message.addedToHistory === true;

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: isFailed
        ? `${theme.colors.destructive}15`
        : isProcessing
        ? `${theme.colors.primary}15`
        : 'transparent',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    content: {
      flex: 1,
    },
    messageText: {
      fontSize: 14,
      color: isFailed
        ? theme.colors.destructive
        : isProcessing
        ? theme.colors.primary
        : theme.colors.foreground,
    },
    errorText: {
      fontSize: 12,
      color: `${theme.colors.destructive}CC`,
      marginTop: 4,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    metaText: {
      fontSize: 12,
      color: isFailed
        ? `${theme.colors.destructive}B3`
        : isProcessing
        ? `${theme.colors.primary}B3`
        : theme.colors.mutedForeground,
    },
    expandButton: {
      ...expandButtonTouchTarget,
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderRadius: 999,
    },
    expandText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginLeft: 2,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginLeft: 4,
      flexShrink: 0,
    },
    actionButton: {
      ...queueActionTouchTarget,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      flexShrink: 0,
    },
    actionButtonDanger: {
      borderColor: `${theme.colors.destructive}26`,
      backgroundColor: `${theme.colors.destructive}10`,
    },
    editContainer: {
      gap: 8,
    },
    editInput: {
      minHeight: 60,
      padding: 8,
      fontSize: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      color: theme.colors.foreground,
      textAlignVertical: 'top',
    },
    editActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    editButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    cancelButton: {
      backgroundColor: 'transparent',
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
    buttonText: {
      fontSize: 12,
      color: theme.colors.foreground,
    },
    saveButtonText: {
      fontSize: 12,
      color: theme.colors.primaryForeground,
    },
  });

  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.editButton, styles.cancelButton]}
              onPress={handleCancelEdit}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton]}
              onPress={handleSaveEdit}
              disabled={!editText.trim()}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {isFailed && (
          <Ionicons name="alert-circle" size={16} color={theme.colors.destructive} />
        )}
        {isProcessing && (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        )}
        <View style={styles.content}>
          <Text
            style={styles.messageText}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {message.text}
          </Text>
          {isFailed && message.errorMessage && (
            <Text style={styles.errorText}>Error: {message.errorMessage}</Text>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {formatTime(message.createdAt)} •{' '}
              {isFailed ? 'Failed' : isProcessing ? 'Processing...' : 'Queued'}
            </Text>
            {isLongMessage && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setIsExpanded(!isExpanded)}
                accessibilityRole="button"
                accessibilityLabel={createExpandCollapseAccessibilityLabel('queued message details', isExpanded)}
                accessibilityHint="Shows or hides the full queued message text."
                accessibilityState={{ expanded: isExpanded }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color={theme.colors.mutedForeground}
                />
                <Text style={styles.expandText}>
                  {isExpanded ? 'Less' : 'More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {!isProcessing && (
          <View style={styles.actions}>
            {isFailed && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onRetry}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Retry failed queued message')}
                accessibilityHint="Moves this failed message back into the queue so it can send again."
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color={theme.colors.foreground} />
              </TouchableOpacity>
            )}
            {!isAddedToHistory && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsEditing(true)}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel('Edit queued message')}
                accessibilityHint="Lets you revise this queued message before it sends."
                activeOpacity={0.7}
              >
                <Ionicons name="pencil" size={16} color={theme.colors.foreground} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Remove queued message')}
              accessibilityHint="Deletes this queued message without sending it."
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={16} color={theme.colors.destructive} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * Panel component for displaying and managing queued messages.
 */
export function MessageQueuePanel({
  conversationId,
  messages,
  onRemove,
  onUpdate,
  onRetry,
  onClear,
  compact = false,
}: MessageQueuePanelProps) {
  const { theme } = useTheme();
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  useEffect(() => {
    setIsListCollapsed(false);
  }, [conversationId]);

  const hasProcessingMessage = messages.some((m) => m.status === 'processing');
  const queuedMessageLabel = `${messages.length} queued message${messages.length > 1 ? 's' : ''}`;
  const compactSummaryText = hasProcessingMessage
    ? `${queuedMessageLabel} • Sending now`
    : queuedMessageLabel;
  const clearQueueAccessibilityHint = hasProcessingMessage
    ? 'Wait for the active queued message to finish before clearing the rest of this queue.'
    : 'Removes all queued messages for this conversation.';

  if (messages.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    headerActionTouchTarget: createMinimumTouchTargetStyle({
      minSize: 44,
      horizontalPadding: 8,
      verticalPadding: 6,
      horizontalMargin: 0,
    }),
    container: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: `${theme.colors.muted}30`,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: `${theme.colors.muted}50`,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.foreground,
      flexShrink: 1,
    },
    clearButton: {
      borderRadius: 8,
    },
    clearButtonDisabled: {
      opacity: 0.7,
    },
    clearButtonText: {
      fontSize: 12,
      color: hasProcessingMessage
        ? theme.colors.mutedForeground
        : theme.colors.foreground,
    },
    processingNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: `${theme.colors.primary}10`,
    },
    processingNoticeText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.primary,
    },
    list: {
      maxHeight: 200,
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
    compactContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 8,
    },
    compactText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.mutedForeground,
    },
  });

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name="time-outline" size={12} color={theme.colors.mutedForeground} />
        <Text style={styles.compactText} numberOfLines={1} ellipsizeMode="tail">
          {compactSummaryText}
        </Text>
        <TouchableOpacity
          style={[styles.headerActionTouchTarget, styles.clearButton, hasProcessingMessage && styles.clearButtonDisabled]}
          onPress={onClear}
          disabled={hasProcessingMessage}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel('Clear queued messages')}
          accessibilityHint={clearQueueAccessibilityHint}
          accessibilityState={{ disabled: hasProcessingMessage }}
        >
          <Ionicons
            name="trash-outline"
            size={14}
            color={hasProcessingMessage ? theme.colors.mutedForeground : theme.colors.foreground}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, isListCollapsed && { borderBottomWidth: 0 }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={16} color={theme.colors.mutedForeground} />
          <Text style={styles.headerTitle}>
            Queued Messages ({messages.length})
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {!isListCollapsed && (
            <TouchableOpacity
              style={[styles.headerActionTouchTarget, styles.clearButton, hasProcessingMessage && styles.clearButtonDisabled]}
              onPress={onClear}
              disabled={hasProcessingMessage}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Clear queued messages')}
              accessibilityHint={clearQueueAccessibilityHint}
              accessibilityState={{ disabled: hasProcessingMessage }}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.headerActionTouchTarget, styles.clearButton]}
            onPress={() => setIsListCollapsed((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={createExpandCollapseAccessibilityLabel('queued messages', !isListCollapsed)}
            accessibilityHint="Shows or hides queued messages for this conversation."
            accessibilityState={{ expanded: !isListCollapsed }}
          >
            <Ionicons
              name={isListCollapsed ? 'chevron-down' : 'chevron-up'}
              size={16}
              color={theme.colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      </View>
      {hasProcessingMessage && !isListCollapsed && (
        <View style={styles.processingNotice}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.processingNoticeText}>
            One queued message is sending now. Clear All stays disabled until it finishes.
          </Text>
        </View>
      )}
      {!isListCollapsed && (
        <ScrollView style={styles.list}>
          {messages.map((msg, index) => (
            <React.Fragment key={msg.id}>
              {index > 0 && <View style={styles.separator} />}
              <QueuedMessageItem
                message={msg}
                onRemove={() => onRemove(msg.id)}
                onUpdate={(text) => onUpdate(msg.id, text)}
                onRetry={() => onRetry(msg.id)}
              />
            </React.Fragment>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
