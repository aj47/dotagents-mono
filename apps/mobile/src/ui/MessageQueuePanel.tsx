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
import { useTheme } from './ThemeProvider';

interface MessageQueuePanelProps {
  conversationId: string;
  messages: QueuedMessage[];
  onRemove: (messageId: string) => boolean | Promise<boolean>;
  onUpdate: (messageId: string, text: string) => boolean | Promise<boolean>;
  onRetry: (messageId: string) => boolean | Promise<boolean>;
  onClear: () => boolean | Promise<boolean>;
  compact?: boolean;
}

type QueuedMessageActionError = {
  kind: 'update' | 'remove' | 'retry';
  message: string;
};

type QueuePanelActionError = {
  kind: 'clear';
  message: string;
};

function getQueueActionErrorMessage(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error
    ? error.message.trim()
    : typeof error === 'string'
    ? error.trim()
    : '';

  const nextMessage = message || fallbackMessage;
  return /[.!?]$/.test(nextMessage) ? nextMessage : `${nextMessage}.`;
}

async function ensureQueueActionSuccess(result: boolean | Promise<boolean>, fallbackMessage: string) {
  const success = await Promise.resolve(result);
  if (!success) {
    throw new Error(fallbackMessage);
  }
}

function QueueActionError({
  message,
  recoveryHint,
  retryLabel,
  onRetry,
}: {
  message?: string | null;
  recoveryHint: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  const { theme } = useTheme();

  if (!message) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      marginTop: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: `${theme.colors.destructive}33`,
      backgroundColor: `${theme.colors.destructive}12`,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 6,
    },
    message: {
      fontSize: 12,
      color: theme.colors.destructive,
      lineHeight: 17,
    },
    retryButton: {
      alignSelf: 'flex-start',
      paddingVertical: 2,
    },
    retryText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.destructive,
    },
  });

  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.container}>
      <Text style={styles.message}>
        {message} {recoveryHint}
      </Text>
      {onRetry && retryLabel && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface QueuedMessageItemProps {
  message: QueuedMessage;
  onRemove: () => boolean | Promise<boolean>;
  onUpdate: (text: string) => boolean | Promise<boolean>;
  onRetry: () => boolean | Promise<boolean>;
}

function QueuedMessageItem({ message, onRemove, onUpdate, onRetry }: QueuedMessageItemProps) {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [actionError, setActionError] = useState<QueuedMessageActionError | null>(null);
  const [pendingAction, setPendingAction] = useState<QueuedMessageActionError['kind'] | null>(null);

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
      setActionError(null);
    }
  }, [message.status, message.text]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== message.text) {
      setPendingAction('update');
      setActionError(null);
      try {
        await ensureQueueActionSuccess(onUpdate(trimmed), "Couldn't save changes to this queued message yet");
        setActionError(null);
        setIsEditing(false);
        return;
      } catch (error) {
        setActionError({
          kind: 'update',
          message: getQueueActionErrorMessage(error, "Couldn't save changes to this queued message yet"),
        });
        return;
      } finally {
        setPendingAction(null);
      }
    }
    setActionError(null);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setActionError(null);
    setIsEditing(false);
    setEditText(message.text);
  };

  const handleRetry = async () => {
    setPendingAction('retry');
    setActionError(null);
    try {
      await ensureQueueActionSuccess(onRetry(), "Couldn't retry this queued message right now");
      setActionError(null);
    } catch (error) {
      setActionError({
        kind: 'retry',
        message: getQueueActionErrorMessage(error, "Couldn't retry this queued message right now"),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemove = async () => {
    setPendingAction('remove');
    setActionError(null);
    try {
      await ensureQueueActionSuccess(onRemove(), "Couldn't remove this queued message right now");
      setActionError(null);
    } catch (error) {
      setActionError({
        kind: 'remove',
        message: getQueueActionErrorMessage(error, "Couldn't remove this queued message right now"),
      });
    } finally {
      setPendingAction(null);
    }
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
      flexDirection: 'row',
      alignItems: 'center',
    },
    expandText: {
      fontSize: 12,
      color: theme.colors.mutedForeground,
      marginLeft: 2,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionButton: {
      padding: 4,
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
              disabled={pendingAction === 'update'}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton]}
              onPress={() => {
                void handleSaveEdit();
              }}
              disabled={!editText.trim() || pendingAction === 'update'}
            >
              <Text style={styles.saveButtonText}>{pendingAction === 'update' ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
          <QueueActionError
            message={actionError?.kind === 'update' ? actionError.message : null}
            recoveryHint="Your draft is still here, so you can review it and try again."
            retryLabel="Retry save"
            onRetry={() => {
              void handleSaveEdit();
            }}
          />
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
          <QueueActionError
            message={actionError?.kind === 'remove' || actionError?.kind === 'retry' ? actionError.message : null}
            recoveryHint={actionError?.kind === 'remove'
              ? 'The queued message is still here, so you can try again.'
              : 'The failed message is still blocking this queue, so you can try again.'}
            retryLabel={actionError?.kind === 'remove' ? 'Retry remove' : actionError?.kind === 'retry' ? 'Retry message' : undefined}
            onRetry={actionError?.kind === 'remove'
              ? () => {
                  void handleRemove();
                }
              : actionError?.kind === 'retry'
              ? () => {
                  void handleRetry();
                }
              : undefined}
          />
        </View>
        {!isProcessing && (
          <View style={styles.actions}>
            {isFailed && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  void handleRetry();
                }}
                disabled={pendingAction !== null}
              >
                <Ionicons name="refresh" size={16} color={theme.colors.foreground} />
              </TouchableOpacity>
            )}
            {!isAddedToHistory && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsEditing(true)}
                disabled={pendingAction !== null}
              >
                <Ionicons name="pencil" size={16} color={theme.colors.foreground} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                void handleRemove();
              }}
              disabled={pendingAction !== null}
            >
              <Ionicons name="close" size={16} color={theme.colors.foreground} />
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
  const [panelActionError, setPanelActionError] = useState<QueuePanelActionError | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    setIsListCollapsed(false);
    setPanelActionError(null);
  }, [conversationId]);

  const hasProcessingMessage = messages.some((m) => m.status === 'processing');

  const handleClear = async () => {
    setIsClearing(true);
    setPanelActionError(null);
    try {
      await ensureQueueActionSuccess(onClear(), "Couldn't clear queued messages right now");
      setPanelActionError(null);
    } catch (error) {
      setPanelActionError({
        kind: 'clear',
        message: getQueueActionErrorMessage(error, "Couldn't clear queued messages right now"),
      });
    } finally {
      setIsClearing(false);
    }
  };

  if (messages.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
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
    },
    clearButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    clearButtonText: {
      fontSize: 12,
      color: hasProcessingMessage
        ? theme.colors.mutedForeground
        : theme.colors.foreground,
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
      <View>
        <View style={styles.compactContainer}>
          <Ionicons name="time-outline" size={12} color={theme.colors.mutedForeground} />
          <Text style={styles.compactText}>
            {messages.length} queued message{messages.length > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            onPress={() => {
              void handleClear();
            }}
            disabled={hasProcessingMessage || isClearing}
          >
            <Ionicons
              name="trash-outline"
              size={14}
              color={hasProcessingMessage ? theme.colors.mutedForeground : theme.colors.foreground}
            />
          </TouchableOpacity>
        </View>
        <QueueActionError
          message={panelActionError?.message}
          recoveryHint="The queued list is unchanged, so you can review it and try again."
          retryLabel="Retry clear"
          onRetry={() => {
            void handleClear();
          }}
        />
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
              style={styles.clearButton}
              onPress={() => {
                void handleClear();
              }}
              disabled={hasProcessingMessage || isClearing}
            >
              <Text style={styles.clearButtonText}>{isClearing ? 'Clearing…' : 'Clear All'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setIsListCollapsed((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={isListCollapsed ? 'Expand queue' : 'Collapse queue'}
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
      {!isListCollapsed && (
        <View style={{ paddingHorizontal: 12, paddingBottom: panelActionError ? 8 : 0 }}>
          <QueueActionError
            message={panelActionError?.message}
            recoveryHint="The queued list is unchanged, so you can review it and try again."
            retryLabel="Retry clear"
            onRetry={() => {
              void handleClear();
            }}
          />
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
