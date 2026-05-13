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
import {
  formatQueuedMessageMetaLabel,
  getMessageQueuePanelCopyState,
  getMessageQueuePanelState,
  getMessageQueuePanelMobileIconState,
  getMessageQueuePanelMobileSurfaceRenderState,
  getQueuedMessageItemPresentation,
  type QueuedMessage,
} from '@dotagents/shared/message-queue-utils';
import { useTheme } from './ThemeProvider';

const mobileMessageQueuePanelCopy = getMessageQueuePanelCopyState();
const mobileMessageQueuePanelIcons = getMessageQueuePanelMobileIconState();

interface MessageQueuePanelProps {
  conversationId: string;
  messages: QueuedMessage[];
  onRemove: (messageId: string) => void;
  onUpdate: (messageId: string, text: string) => void;
  onRetry: (messageId: string) => void;
  onProcessNext?: () => void;
  onClear: () => void;
  canProcessNext?: boolean;
  compact?: boolean;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
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
  const messagePresentation = getQueuedMessageItemPresentation(message, isExpanded);
  const {
    isLongMessage,
    isFailed,
    isProcessing,
    canMutateMessage,
    canEditMessage,
    statusLabel,
    expansionLabel,
    errorText,
  } = messagePresentation;
  const queuePanelStyleState = getMessageQueuePanelMobileSurfaceRenderState({
    colors: theme.colors,
  });
  const itemSurface = queuePanelStyleState.surface.item;
  const actionSurface = queuePanelStyleState.surface.actions;
  const editSurface = queuePanelStyleState.surface.edit;
  const queuePanelColors = queuePanelStyleState.colors;
  const itemColors = queuePanelColors.item;
  const actionColors = queuePanelColors.actions;
  const editColors = queuePanelColors.edit;
  const queuePanelIcons = mobileMessageQueuePanelIcons;
  const statusColor = isFailed
    ? itemColors.failedColor
    : isProcessing
    ? itemColors.processingColor
    : itemColors.messageColor;
  const statusMetaColor = isFailed
    ? itemColors.failedMetaColor
    : isProcessing
    ? itemColors.processingMetaColor
    : itemColors.metaColor;

  // Sync editText with message.text when it changes (only when not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditText(message.text);
    }
  }, [message.text, isEditing]);

  // Exit edit mode when the message starts processing
  useEffect(() => {
    if (isProcessing) {
      setIsEditing(false);
      setEditText(message.text);
    }
  }, [isProcessing, message.text]);

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

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: itemSurface.paddingHorizontal,
      paddingVertical: itemSurface.paddingVertical,
      backgroundColor: isFailed
        ? itemColors.failedBackgroundColor
        : isProcessing
        ? itemColors.processingBackgroundColor
        : itemColors.transparentBackgroundColor,
    },
    row: {
      flexDirection: itemSurface.rowFlexDirection,
      alignItems: itemSurface.rowAlignItems,
      gap: itemSurface.rowGap,
    },
    content: {
      flex: itemSurface.contentFlex,
      minWidth: itemSurface.contentMinWidth,
    },
    messageText: {
      fontSize: itemSurface.message.fontSize,
      color: statusColor,
    },
    errorText: {
      fontSize: itemSurface.errorFontSize,
      color: itemColors.errorColor,
      marginTop: itemSurface.errorMarginTop,
    },
    metaRow: {
      flexDirection: itemSurface.metaFlexDirection,
      alignItems: itemSurface.metaAlignItems,
      flexWrap: itemSurface.metaFlexWrap,
      gap: itemSurface.metaGap,
      marginTop: itemSurface.metaMarginTop,
    },
    metaText: {
      fontSize: itemSurface.metaFontSize,
      color: statusMetaColor,
    },
    expandButton: {
      flexDirection: itemSurface.expandButtonFlexDirection,
      alignItems: itemSurface.expandButtonAlignItems,
    },
    expandText: {
      fontSize: itemSurface.expandTextFontSize,
      color: itemColors.expandTextColor,
      marginLeft: itemSurface.expandTextMarginLeft,
    },
    actions: {
      flexDirection: actionSurface.flexDirection,
      flexWrap: actionSurface.flexWrap,
      alignItems: actionSurface.alignItems,
      gap: actionSurface.gap,
      marginTop: actionSurface.marginTop,
    },
    actionButton: {
      alignSelf: actionSurface.buttonAlignSelf,
      minHeight: actionSurface.buttonMinHeight,
      paddingHorizontal: actionSurface.buttonPaddingHorizontal,
      paddingVertical: actionSurface.buttonPaddingVertical,
      borderRadius: actionSurface.buttonBorderRadius,
      borderWidth: actionSurface.buttonBorderWidth,
      borderColor: actionColors.buttonBorderColor,
      backgroundColor: actionColors.buttonBackgroundColor,
      justifyContent: actionSurface.buttonJustifyContent,
    },
    retryActionText: {
      color: actionColors.retryTextColor,
      fontSize: actionSurface.textFontSize,
      fontWeight: actionSurface.textFontWeight,
    },
    editActionText: {
      color: actionColors.editTextColor,
      fontSize: actionSurface.textFontSize,
      fontWeight: actionSurface.textFontWeight,
    },
    removeActionText: {
      color: actionColors.removeTextColor,
      fontSize: actionSurface.textFontSize,
      fontWeight: actionSurface.textFontWeight,
    },
    editContainer: {
      gap: editSurface.containerGap,
    },
    editInput: {
      minHeight: editSurface.inputMinHeight,
      padding: editSurface.inputPadding,
      fontSize: editSurface.inputFontSize,
      borderRadius: editSurface.inputBorderRadius,
      borderWidth: editSurface.inputBorderWidth,
      borderColor: editColors.inputBorderColor,
      backgroundColor: editColors.inputBackgroundColor,
      color: editColors.inputTextColor,
      textAlignVertical: editSurface.inputTextAlignVertical,
    },
    editActions: {
      flexDirection: editSurface.actionsFlexDirection,
      justifyContent: editSurface.actionsJustifyContent,
      gap: editSurface.actionsGap,
    },
    editButton: {
      paddingHorizontal: editSurface.buttonPaddingHorizontal,
      paddingVertical: editSurface.buttonPaddingVertical,
      borderRadius: editSurface.buttonBorderRadius,
    },
    cancelButton: {
      backgroundColor: editColors.cancelButtonBackgroundColor,
    },
    saveButton: {
      backgroundColor: editColors.saveButtonBackgroundColor,
    },
    buttonText: {
      fontSize: editSurface.buttonTextFontSize,
      color: editColors.buttonTextColor,
    },
    saveButtonText: {
      fontSize: editSurface.buttonTextFontSize,
      color: editColors.saveButtonTextColor,
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
              <Text style={styles.buttonText}>{mobileMessageQueuePanelCopy.actions.cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton]}
              onPress={handleSaveEdit}
              disabled={!editText.trim()}
            >
              <Text style={styles.saveButtonText}>{mobileMessageQueuePanelCopy.actions.saveLabel}</Text>
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
          <Ionicons name={queuePanelIcons.failedName} size={itemSurface.stateIconSize} color={itemColors.failedColor} />
        )}
        {isProcessing && (
          <ActivityIndicator size="small" color={itemColors.processingColor} />
        )}
        <View style={styles.content}>
          <Text
            style={styles.messageText}
            numberOfLines={isExpanded ? undefined : itemSurface.message.collapsedNumberOfLines}
          >
            {message.text}
          </Text>
          {errorText && (
            <Text style={styles.errorText}>{errorText}</Text>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {formatQueuedMessageMetaLabel(message.createdAt, statusLabel)}
            </Text>
            {isLongMessage && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setIsExpanded(!isExpanded)}
              >
                <Ionicons
                  name={isExpanded ? queuePanelIcons.collapseMessageName : queuePanelIcons.expandMessageName}
                  size={itemSurface.expandIconSize}
                  color={itemColors.expandTextColor}
                />
                <Text style={styles.expandText}>
                  {expansionLabel}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {canMutateMessage && (
            <View style={styles.actions}>
              {isFailed && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onRetry}
                  accessibilityRole="button"
                  accessibilityLabel={mobileMessageQueuePanelCopy.actions.retryAccessibilityLabel}
                  hitSlop={actionSurface.hitSlop}
                >
                  <Text style={styles.retryActionText}>{mobileMessageQueuePanelCopy.actions.retryLabel}</Text>
                </TouchableOpacity>
              )}
              {canEditMessage && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setIsEditing(true)}
                  accessibilityRole="button"
                  accessibilityLabel={mobileMessageQueuePanelCopy.actions.editAccessibilityLabel}
                  hitSlop={actionSurface.hitSlop}
                >
                  <Text style={styles.editActionText}>{mobileMessageQueuePanelCopy.actions.editLabel}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onRemove}
                accessibilityRole="button"
                accessibilityLabel={mobileMessageQueuePanelCopy.actions.removeAccessibilityLabel}
                hitSlop={actionSurface.hitSlop}
              >
                <Text style={styles.removeActionText}>{mobileMessageQueuePanelCopy.actions.removeLabel}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  onProcessNext,
  onClear,
  canProcessNext = false,
  compact = false,
  isPaused = false,
  onPause,
  onResume,
}: MessageQueuePanelProps) {
  const { theme } = useTheme();
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const queuePanelState = getMessageQueuePanelState(messages, {
    isPaused,
    isListCollapsed,
    canProcessNext,
  });
  const queuePanelStyleState = getMessageQueuePanelMobileSurfaceRenderState({
    colors: theme.colors,
  });
  const panelSurface = queuePanelStyleState.surface.panel;
  const queuePanelColors = queuePanelStyleState.colors;
  const panelColors = queuePanelColors.panel;
  const panelStatusColors = panelColors.status[queuePanelState.statusKey];
  const queuePanelIcons = mobileMessageQueuePanelIcons;

  useEffect(() => {
    setIsListCollapsed(false);
  }, [conversationId]);

  if (messages.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      borderRadius: panelSurface.borderRadius,
      borderWidth: panelSurface.borderWidth,
      borderColor: panelStatusColors.borderColor,
      backgroundColor: panelStatusColors.backgroundColor,
      overflow: panelSurface.overflow,
    },
    header: {
      flexDirection: panelSurface.headerFlexDirection,
      alignItems: panelSurface.headerAlignItems,
      justifyContent: panelSurface.headerJustifyContent,
      paddingHorizontal: panelSurface.headerPaddingHorizontal,
      paddingVertical: panelSurface.headerPaddingVertical,
      borderBottomWidth: panelSurface.headerBorderBottomWidth,
      borderBottomColor: panelStatusColors.headerBorderBottomColor,
      backgroundColor: panelStatusColors.headerBackgroundColor,
    },
    headerCollapsed: {
      borderBottomWidth: panelSurface.headerCollapsedBorderBottomWidth,
    },
    headerLeft: {
      flexDirection: panelSurface.headerLeftFlexDirection,
      alignItems: panelSurface.headerLeftAlignItems,
      gap: panelSurface.headerGap,
    },
    headerActions: {
      flexDirection: panelSurface.headerActionsFlexDirection,
      alignItems: panelSurface.headerActionsAlignItems,
      gap: panelSurface.headerActionGap,
    },
    headerTitle: {
      fontSize: panelSurface.titleFontSize,
      fontWeight: panelSurface.titleFontWeight,
      color: panelColors.titleColor,
    },
    clearButton: {
      paddingHorizontal: panelSurface.actionPaddingHorizontal,
      paddingVertical: panelSurface.actionPaddingVertical,
    },
    clearButtonText: {
      fontSize: panelSurface.actionFontSize,
      color: queuePanelState.hasProcessingMessage
        ? panelColors.disabledActionColor
        : panelStatusColors.color,
    },
    queueControlText: {
      fontSize: panelSurface.actionFontSize,
      color: queuePanelState.isPaused ? panelColors.resumeActionColor : panelStatusColors.color,
      fontWeight: panelSurface.processFontWeight,
    },
    queueControlTextDisabled: {
      color: panelColors.disabledActionColor,
    },
    processButton: {
      paddingHorizontal: panelSurface.actionPaddingHorizontal,
      paddingVertical: panelSurface.actionPaddingVertical,
    },
    processButtonText: {
      fontSize: panelSurface.actionFontSize,
      color: queuePanelState.canProcessNext ? panelColors.processReadyColor : panelColors.disabledActionColor,
      fontWeight: panelSurface.processFontWeight,
    },
    list: {
      maxHeight: panelSurface.listMaxHeight,
    },
    separator: {
      height: panelSurface.separatorHeight,
      backgroundColor: panelStatusColors.separatorColor,
    },
    pausedNotice: {
      paddingHorizontal: panelSurface.pausedNoticePaddingHorizontal,
      paddingVertical: panelSurface.pausedNoticePaddingVertical,
      backgroundColor: panelStatusColors.pausedNoticeBackgroundColor,
      borderBottomWidth: panelSurface.separatorHeight,
      borderBottomColor: panelStatusColors.pausedNoticeBorderBottomColor,
    },
    pausedNoticeText: {
      color: panelStatusColors.pausedNoticeTextColor,
      fontSize: panelSurface.pausedNoticeFontSize,
      lineHeight: panelSurface.pausedNoticeLineHeight,
    },
    compactContainer: {
      flexDirection: panelSurface.compactFlexDirection,
      alignItems: panelSurface.compactAlignItems,
      paddingHorizontal: panelSurface.compactPaddingHorizontal,
      paddingVertical: panelSurface.compactPaddingVertical,
      gap: panelSurface.compactGap,
      borderWidth: panelSurface.borderWidth,
      borderColor: panelStatusColors.borderColor,
      borderRadius: panelSurface.borderRadius,
      backgroundColor: panelStatusColors.backgroundColor,
    },
    compactText: {
      flex: panelSurface.compactTextFlex,
      fontSize: panelSurface.compactFontSize,
      color: panelStatusColors.color,
    },
    compactAction: {
      paddingHorizontal: panelSurface.actionPaddingHorizontal,
      paddingVertical: panelSurface.actionPaddingVertical,
    },
  });

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name={queuePanelState.statusIconName} size={panelSurface.compactIconSize} color={panelStatusColors.color} />
        <Text style={styles.compactText}>
          {queuePanelState.compactLabel}
        </Text>
        {isPaused && onResume ? (
          <TouchableOpacity
            style={styles.compactAction}
            onPress={onResume}
            accessibilityRole="button"
            accessibilityLabel={mobileMessageQueuePanelCopy.actions.resumeTitle}
          >
            <Ionicons
              name={queuePanelIcons.resumeName}
              size={panelSurface.compactActionIconSize}
              color={panelColors.resumeActionColor}
            />
          </TouchableOpacity>
        ) : null}
        {!isPaused && onPause ? (
          <TouchableOpacity
            style={styles.compactAction}
            onPress={onPause}
            disabled={!queuePanelState.canPause}
            accessibilityRole="button"
            accessibilityLabel={mobileMessageQueuePanelCopy.actions.pauseTitle}
          >
            <Ionicons
              name={queuePanelIcons.pauseName}
              size={panelSurface.compactActionIconSize}
              color={queuePanelState.canPause ? panelStatusColors.color : panelColors.disabledActionColor}
            />
          </TouchableOpacity>
        ) : null}
        {queuePanelState.shouldShowCompactProcessNext && onProcessNext ? (
          <TouchableOpacity
            style={styles.compactAction}
            onPress={onProcessNext}
            accessibilityRole="button"
            accessibilityLabel={mobileMessageQueuePanelCopy.actions.sendNextAccessibilityLabel}
          >
            <Ionicons
              name={queuePanelIcons.sendNextName}
              size={panelSurface.compactActionIconSize}
              color={panelColors.processReadyColor}
            />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.compactAction}
          onPress={onClear}
          disabled={!queuePanelState.canClear}
          accessibilityRole="button"
          accessibilityLabel={mobileMessageQueuePanelCopy.actions.clearQueueTitle}
        >
          <Ionicons
            name={queuePanelIcons.clearName}
            size={panelSurface.compactActionIconSize}
            color={queuePanelState.canClear ? panelStatusColors.color : panelColors.disabledActionColor}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, queuePanelState.isListCollapsed && styles.headerCollapsed]}>
        <View style={styles.headerLeft}>
          <Ionicons name={queuePanelState.statusIconName} size={panelSurface.headerIconSize} color={panelStatusColors.color} />
          <Text style={styles.headerTitle}>
            {queuePanelState.title}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {isPaused && onResume ? (
            <TouchableOpacity
              style={styles.processButton}
              onPress={onResume}
              accessibilityRole="button"
              accessibilityLabel={mobileMessageQueuePanelCopy.actions.resumeTitle}
            >
              <Text style={styles.queueControlText}>{mobileMessageQueuePanelCopy.actions.resumeLabel}</Text>
            </TouchableOpacity>
          ) : null}
          {!isPaused && onPause ? (
            <TouchableOpacity
              style={styles.processButton}
              onPress={onPause}
              disabled={!queuePanelState.canPause}
              accessibilityRole="button"
              accessibilityLabel={mobileMessageQueuePanelCopy.actions.pauseTitle}
            >
              <Text style={[styles.queueControlText, !queuePanelState.canPause && styles.queueControlTextDisabled]}>
                {mobileMessageQueuePanelCopy.actions.pauseLabel}
              </Text>
            </TouchableOpacity>
          ) : null}
          {queuePanelState.shouldShowProcessNext && onProcessNext ? (
            <TouchableOpacity
              style={styles.processButton}
              onPress={onProcessNext}
              accessibilityRole="button"
              accessibilityLabel={mobileMessageQueuePanelCopy.actions.sendNextAccessibilityLabel}
            >
              <Text style={styles.processButtonText}>{mobileMessageQueuePanelCopy.actions.sendNextLabel}</Text>
            </TouchableOpacity>
          ) : null}
          {queuePanelState.shouldRenderClear && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={onClear}
              disabled={!queuePanelState.canClear}
              accessibilityRole="button"
              accessibilityLabel={mobileMessageQueuePanelCopy.actions.clearQueueTitle}
            >
              <Text style={styles.clearButtonText}>{mobileMessageQueuePanelCopy.actions.clearAllLabel}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setIsListCollapsed((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={queuePanelState.listToggleLabel}
            accessibilityState={{ expanded: queuePanelState.isExpanded }}
          >
            <Ionicons
              name={queuePanelState.toggleIconName}
              size={panelSurface.headerToggleIconSize}
              color={panelColors.toggleIconColor}
            />
          </TouchableOpacity>
        </View>
      </View>
      {queuePanelState.shouldRenderPausedNotice && (
        <View style={styles.pausedNotice}>
          <Text style={styles.pausedNoticeText}>{mobileMessageQueuePanelCopy.pausedNotice}</Text>
        </View>
      )}
      {queuePanelState.shouldRenderList && (
        <ScrollView style={styles.list}>
          {queuePanelState.items.map((item) => {
            const msg = item.message;
            return (
              <React.Fragment key={item.key}>
                {item.shouldRenderSeparator && <View style={styles.separator} />}
                <QueuedMessageItem
                  message={msg}
                  onRemove={() => onRemove(msg.id)}
                  onUpdate={(text) => onUpdate(msg.id, text)}
                  onRetry={() => onRetry(msg.id)}
                />
              </React.Fragment>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
