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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QueuedMessage } from '@dotagents/shared';
import {
  createButtonAccessibilityLabel,
  createExpandCollapseAccessibilityLabel,
  createMinimumTouchTargetStyle,
  createTextInputAccessibilityLabel,
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

function formatQueuedMessageAccessibilityContext(text: string, timestampLabel: string): string {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  if (!normalizedText) return `from ${timestampLabel}`;

  const preview = normalizedText.length > 48
    ? `${normalizedText.slice(0, 45).replace(/\s+$/g, '')}…`
    : normalizedText;

  return `"${preview}" from ${timestampLabel}`;
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
  const queueEditActionTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: 14,
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

  const trimmedOriginalText = message.text.trim();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== trimmedOriginalText) {
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
  const rowTimestampLabel = formatTime(message.createdAt);
  const queuedMessageAccessibilityContext = formatQueuedMessageAccessibilityContext(message.text, rowTimestampLabel);
  const trimmedEditText = editText.trim();
  const queueStatusLabel = isFailed ? 'Failed - blocking queue' : isProcessing ? 'Processing...' : 'Queued';
  const queueMetaText = `${queueStatusLabel} • ${rowTimestampLabel}`;
  const historyLockDetailText = isAddedToHistory ? 'In chat history • Edit unavailable' : null;
  const retryAccessibilityHint = isFailed
    ? isAddedToHistory
      ? 'Moves this failed queued message back into the queue so it can send again and unblock later queued messages without duplicating the existing chat history entry.'
      : 'Moves this failed queued message back into the queue so it can send again and unblock later queued messages.'
    : isAddedToHistory
      ? 'Moves this queued message back into the queue so it can send again without duplicating the existing chat history entry.'
      : 'Moves this queued message back into the queue so it can send again.';
  const removeAccessibilityHint = isFailed
    ? isAddedToHistory
      ? 'Deletes this failed queued message from the queue so later queued messages can continue. The existing chat history entry stays in the conversation.'
      : 'Deletes this failed queued message so later queued messages can continue.'
    : isAddedToHistory
      ? 'Deletes this queued message from the queue. The existing chat history entry stays in the conversation.'
      : 'Deletes this queued message without sending it.';
  const editContextLabel = `${isFailed ? 'Editing failed queued message' : 'Editing queued message'} • ${rowTimestampLabel}`;
  const editValidationMessage = !trimmedEditText
    ? 'Enter message text to save your queued message changes.'
    : trimmedEditText === trimmedOriginalText
    ? 'Save stays disabled until you change the queued message text.'
    : null;
  const isSaveEditDisabled = !trimmedEditText || trimmedEditText === trimmedOriginalText;

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
    historyLockText: {
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.mutedForeground,
      marginTop: 4,
    },
    historyLockTextWarning: {
      color: `${theme.colors.destructive}CC`,
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
    editContextText: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.colors.mutedForeground,
      fontWeight: '600',
    },
    editContextTextWarning: {
      color: theme.colors.destructive,
    },
    editFailureText: {
      fontSize: 12,
      lineHeight: 17,
      color: `${theme.colors.destructive}CC`,
      marginTop: 2,
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
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
    },
    editHelperText: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.colors.mutedForeground,
    },
    editHelperTextWarning: {
      color: theme.colors.destructive,
    },
    editButton: {
      ...queueEditActionTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      flexShrink: 0,
    },
    cancelButton: {
      backgroundColor: theme.colors.background,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 12,
      color: theme.colors.foreground,
      fontWeight: '600',
    },
    saveButtonText: {
      fontSize: 12,
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
  });

  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.editContainer}>
          <View>
            <Text
              style={[
                styles.editContextText,
                isFailed && styles.editContextTextWarning,
              ]}
            >
              {editContextLabel}
            </Text>
            {isFailed && message.errorMessage ? (
              <Text style={styles.editFailureText} numberOfLines={2} ellipsizeMode="tail">
                Last error: {message.errorMessage}
              </Text>
            ) : null}
          </View>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            autoFocus
            accessibilityLabel={createTextInputAccessibilityLabel(`Queued message edit ${queuedMessageAccessibilityContext}`)}
            accessibilityHint={editValidationMessage ?? 'Revise this queued message before it sends.'}
          />
          {editValidationMessage && (
            <Text
              style={[
                styles.editHelperText,
                !trimmedEditText && styles.editHelperTextWarning,
              ]}
            >
              {editValidationMessage}
            </Text>
          )}
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.editButton, styles.cancelButton]}
              onPress={handleCancelEdit}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(`Cancel queued message edit ${queuedMessageAccessibilityContext}`)}
              accessibilityHint="Restores the original queued message text without saving your changes."
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton, isSaveEditDisabled && styles.saveButtonDisabled]}
              onPress={handleSaveEdit}
              disabled={isSaveEditDisabled}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(`Save queued message edit ${queuedMessageAccessibilityContext}`)}
              accessibilityHint={isSaveEditDisabled
                ? !trimmedEditText
                  ? 'Enter message text before saving your queued message changes.'
                  : 'Change the queued message text before saving.'
                : 'Applies your queued message edits before it sends.'}
              accessibilityState={{ disabled: isSaveEditDisabled }}
              activeOpacity={0.7}
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
          {historyLockDetailText && (
            <Text
              style={[
                styles.historyLockText,
                isFailed && styles.historyLockTextWarning,
              ]}
            >
              {historyLockDetailText}
            </Text>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {queueMetaText}
            </Text>
            {isLongMessage && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setIsExpanded(!isExpanded)}
                accessibilityRole="button"
                accessibilityLabel={createExpandCollapseAccessibilityLabel(`queued message details for ${queuedMessageAccessibilityContext}`, isExpanded)}
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
                accessibilityLabel={createButtonAccessibilityLabel(`Retry failed queued message ${queuedMessageAccessibilityContext}`)}
                accessibilityHint={retryAccessibilityHint}
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
                accessibilityLabel={createButtonAccessibilityLabel(`Edit queued message ${queuedMessageAccessibilityContext}`)}
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
              accessibilityLabel={createButtonAccessibilityLabel(`Remove queued message ${queuedMessageAccessibilityContext}`)}
              accessibilityHint={removeAccessibilityHint}
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
  const { height: windowHeight } = useWindowDimensions();
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  useEffect(() => {
    setIsListCollapsed(false);
  }, [conversationId]);

  const hasProcessingMessage = messages.some((m) => m.status === 'processing');
  const processingCount = messages.filter((m) => m.status === 'processing').length;
  const waitingCount = messages.filter((m) => m.status === 'pending').length;
  const failedCount = messages.filter((m) => m.status === 'failed').length;
  const queuedMessageLabel = `${messages.length} queued message${messages.length > 1 ? 's' : ''}`;
  const queueProcessingSummary = processingCount === 1 ? 'Sending now' : `${processingCount} sending now`;
  const queueFailureSummary = failedCount === 1 ? 'Blocked by 1 failed' : `Blocked by ${failedCount} failed`;
  const queueHeaderStatusParts: string[] = [];
  if (failedCount > 0) queueHeaderStatusParts.push(queueFailureSummary);
  if (processingCount > 0) queueHeaderStatusParts.push(queueProcessingSummary);
  if (waitingCount > 0) queueHeaderStatusParts.push(`${waitingCount} waiting`);
  const queueHeaderStatusText = queueHeaderStatusParts.join(' • ') || 'Queue activity updated';
  const compactSummaryText = hasProcessingMessage
    ? `${queuedMessageLabel} • ${queueProcessingSummary}`
    : queuedMessageLabel;
  const clearQueueAccessibilityHint = hasProcessingMessage
    ? processingCount === 1
      ? 'Wait for the active queued message to finish before clearing the rest of this queue.'
      : `Wait for the ${processingCount} queued messages that are sending now to finish before clearing the rest of this queue.`
    : 'Removes all queued messages for this conversation.';
  const processingNoticeText = processingCount === 1
    ? 'One queued message is sending now. Clear All stays disabled until it finishes.'
    : `${processingCount} queued messages are sending now. Clear All stays disabled until they finish.`;
  const queueDisclosureLabel = `${createExpandCollapseAccessibilityLabel('queued messages', !isListCollapsed)}. ${queuedMessageLabel}. ${queueHeaderStatusText}.`;
  const queueListMaxHeight = Math.min(200, Math.max(160, Math.round(windowHeight * 0.28)));

  if (messages.length === 0) {
    return null;
  }

  const headerActionTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: 8,
    verticalPadding: 6,
    horizontalMargin: 0,
  });
  const headerDisclosureTouchTarget = createMinimumTouchTargetStyle({
    minSize: 44,
    horizontalPadding: 0,
    verticalPadding: 0,
    horizontalMargin: 0,
  });

  const styles = StyleSheet.create({
    headerActionTouchTarget,
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
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: `${theme.colors.muted}50`,
    },
    headerCollapsed: {
      borderBottomWidth: 0,
    },
    headerDisclosureButton: {
      ...headerDisclosureTouchTarget,
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    headerTitleGroup: {
      flex: 1,
      minWidth: 0,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.foreground,
      flexShrink: 1,
      minWidth: 0,
    },
    badge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      flexShrink: 0,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.primaryForeground,
    },
    headerStatusText: {
      marginTop: 2,
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.mutedForeground,
      flexShrink: 1,
    },
    headerStatusTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    headerStatusTextDanger: {
      color: theme.colors.destructive,
      fontWeight: '600',
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
      maxHeight: queueListMaxHeight,
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
      <View style={[styles.header, isListCollapsed && styles.headerCollapsed]}>
        <TouchableOpacity
          style={styles.headerDisclosureButton}
          onPress={() => setIsListCollapsed((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={queueDisclosureLabel}
          accessibilityHint="Shows or hides queued messages for this conversation."
          accessibilityState={{ expanded: !isListCollapsed }}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <Ionicons name="time-outline" size={16} color={theme.colors.mutedForeground} />
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                  Queued Messages
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{messages.length}</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.headerStatusText,
                  failedCount > 0
                    ? styles.headerStatusTextDanger
                    : hasProcessingMessage
                      ? styles.headerStatusTextActive
                      : null,
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {queueHeaderStatusText}
              </Text>
            </View>
          </View>
          <Ionicons
            name={isListCollapsed ? 'chevron-down' : 'chevron-up'}
            size={16}
            color={theme.colors.mutedForeground}
          />
        </TouchableOpacity>
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
      </View>
      {hasProcessingMessage && !isListCollapsed && (
        <View style={styles.processingNotice}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.processingNoticeText}>
            {processingNoticeText}
          </Text>
        </View>
      )}
      {!isListCollapsed && (
        <ScrollView
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
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
