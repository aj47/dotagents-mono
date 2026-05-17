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
  createMessageQueuePanelMobileStyleSlots,
  createMessageQueuePanelCompactActionMobilePropsParts,
  createMessageQueuePanelHeaderActionMobilePropsParts,
  createMessageQueuePanelChromeMobilePropsParts,
  createMessageQueuePanelListMobilePropsParts,
  createQueuedMessageStatusIndicatorMobilePropsPart,
  createQueuedMessageItemChromeMobilePropsParts,
  createQueuedMessageContentMobilePropsParts,
  createQueuedMessageExpandButtonMobilePropsParts,
  createQueuedMessageActionButtonMobilePropsParts,
  createQueuedMessageActionButtonMobileStyleSlots,
  createQueuedMessageActionRowMobileStyleSlot,
  createQueuedMessageEditMobilePropsParts,
  createQueuedMessageEditMobileStyleSlots,
  createQueuedMessageItemMobileStyleSlots,
  getMessageQueuePanelMobileRenderState,
  getQueuedMessageEditDraftState,
  getQueuedMessageItemMobileRenderState,
  type QueuedMessage,
} from '@dotagents/shared/session-presentation';

type MessageQueuePanelColors =
  Parameters<typeof getMessageQueuePanelMobileRenderState>[0]['colors']
  & Parameters<typeof getQueuedMessageItemMobileRenderState>[0]['colors'];

interface MessageQueuePanelProps {
  messages: QueuedMessage[];
  colors: MessageQueuePanelColors;
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
  isListCollapsed: boolean;
  onToggleListCollapsed: () => void;
}

interface QueuedMessageItemProps {
  message: QueuedMessage;
  colors: MessageQueuePanelColors;
  onRemove: () => void;
  onUpdate: (text: string) => void;
  onRetry: () => void;
}

function QueuedMessageItem({ message, colors, onRemove, onUpdate, onRetry }: QueuedMessageItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const queuedMessageRenderState = getQueuedMessageItemMobileRenderState({
    message,
    isExpanded,
    colors,
  });
  const messagePresentation = queuedMessageRenderState.presentation;
  const {
    isProcessing,
  } = messagePresentation;
  const itemSurface = queuedMessageRenderState.surface.item;
  const actionSurface = queuedMessageRenderState.surface.actions;
  const editSurface = queuedMessageRenderState.surface.edit;
  const itemColors = queuedMessageRenderState.colors.item;
  const actionColors = queuedMessageRenderState.colors.actions;
  const editColors = queuedMessageRenderState.colors.edit;
  const queuePanelIcons = queuedMessageRenderState.icons;
  const queuePanelCopy = queuedMessageRenderState.copy;
  const statusColor = queuedMessageRenderState.statusColor;
  const statusMetaColor = queuedMessageRenderState.statusMetaColor;
  const editDraftState = getQueuedMessageEditDraftState(editText, message.text);
  const itemStyleSlots = createQueuedMessageItemMobileStyleSlots({
    surface: itemSurface,
    colors: itemColors,
    presentation: messagePresentation,
    statusColor,
    statusMetaColor,
  });
  const actionButtonStyleSlots = createQueuedMessageActionButtonMobileStyleSlots({
    surface: actionSurface,
    colors: actionColors,
  });
  const actionRowStyleSlot = createQueuedMessageActionRowMobileStyleSlot({
    surface: actionSurface,
  });
  const editStyleSlots = createQueuedMessageEditMobileStyleSlots({
    surface: editSurface,
    colors: editColors,
  });

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
    const editSubmitState = editDraftState.submitState;
    if (editSubmitState.shouldSubmit) {
      onUpdate(editSubmitState.trimmedText);
    }
    if (editSubmitState.shouldRestoreOriginalText) {
      setEditText(message.text);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text);
  };

  const styles = StyleSheet.create({
    container: {
      ...itemStyleSlots.container,
    },
    row: {
      ...itemStyleSlots.row,
    },
    content: {
      ...itemStyleSlots.content,
    },
    messageText: {
      ...itemStyleSlots.messageText,
    },
    errorText: {
      ...itemStyleSlots.errorText,
    },
    metaRow: {
      ...itemStyleSlots.metaRow,
    },
    metaText: {
      ...itemStyleSlots.metaText,
    },
    expandButton: {
      ...itemStyleSlots.expandButton,
    },
    expandText: {
      ...itemStyleSlots.expandText,
    },
    actions: {
      ...actionRowStyleSlot,
    },
    actionButton: {
      ...actionButtonStyleSlots.button,
    },
    retryActionText: {
      ...actionButtonStyleSlots.retryText,
    },
    editActionText: {
      ...actionButtonStyleSlots.editText,
    },
    removeActionText: {
      ...actionButtonStyleSlots.removeText,
    },
    editContainer: {
      ...editStyleSlots.container,
    },
    editInput: {
      ...editStyleSlots.input,
    },
    editActions: {
      ...editStyleSlots.actions,
    },
    editButton: {
      ...editStyleSlots.button,
    },
    cancelButton: {
      ...editStyleSlots.cancelButton,
    },
    saveButton: {
      ...editStyleSlots.saveButton,
    },
    buttonText: {
      ...editStyleSlots.buttonText,
    },
    saveButtonText: {
      ...editStyleSlots.saveButtonText,
    },
  });
  const editParts = createQueuedMessageEditMobilePropsParts({
    surface: editSurface,
    copy: queuePanelCopy,
    editDraftState,
    styles,
    onCancel: handleCancelEdit,
    onSave: handleSaveEdit,
  });
  const actionParts = createQueuedMessageActionButtonMobilePropsParts({
    surface: actionSurface,
    colors: actionColors,
    icons: queuePanelIcons,
    copy: queuePanelCopy,
    presentation: messagePresentation,
    styles,
    onRetry,
    onEdit: () => setIsEditing(true),
    onRemove,
  });
  const expandButtonParts = createQueuedMessageExpandButtonMobilePropsParts({
    surface: itemSurface,
    colors: itemColors,
    icons: queuePanelIcons,
    presentation: messagePresentation,
    isExpanded,
    styles,
    onToggleExpanded: () => setIsExpanded(!isExpanded),
  });
  const statusIndicatorPart = createQueuedMessageStatusIndicatorMobilePropsPart({
    surface: itemSurface,
    colors: itemColors,
    icons: queuePanelIcons,
    presentation: messagePresentation,
  });
  const contentParts = createQueuedMessageContentMobilePropsParts({
    surface: itemSurface,
    message,
    presentation: messagePresentation,
    isExpanded,
    styles,
  });
  const itemChromeParts = createQueuedMessageItemChromeMobilePropsParts({
    statusIndicatorPart,
    actionParts,
    styles,
  });

  if (isEditing) {
    return (
      <View style={itemChromeParts.container.style}>
        <View style={editParts.container.style}>
          <TextInput
            style={editParts.input.style}
            value={editText}
            onChangeText={setEditText}
            accessibilityLabel={editParts.input.accessibilityLabel}
            multiline
            autoFocus
          />
          <View style={editParts.actions.style}>
            <TouchableOpacity
              style={editParts.cancelButton.style}
              onPress={editParts.cancelButton.onPress}
              activeOpacity={editParts.cancelButton.activeOpacity}
              accessibilityRole={editParts.cancelButton.accessibilityRole}
              accessibilityLabel={editParts.cancelButton.accessibilityLabel}
            >
              <Text style={editParts.cancelButton.text.style}>
                {editParts.cancelButton.text.value}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={editParts.saveButton.style}
              onPress={editParts.saveButton.onPress}
              disabled={editParts.saveButton.disabled}
              activeOpacity={editParts.saveButton.activeOpacity}
              accessibilityRole={editParts.saveButton.accessibilityRole}
              accessibilityLabel={editParts.saveButton.accessibilityLabel}
              accessibilityState={editParts.saveButton.accessibilityState}
            >
              <Text style={editParts.saveButton.text.style}>
                {editParts.saveButton.text.value}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={itemChromeParts.container.style}>
      <View style={itemChromeParts.row.style}>
        {itemChromeParts.failedStatusIcon && (
          <Ionicons
            name={itemChromeParts.failedStatusIcon.name}
            size={itemChromeParts.failedStatusIcon.size}
            color={itemChromeParts.failedStatusIcon.color}
          />
        )}
        {itemChromeParts.processingStatusIndicator && (
          <ActivityIndicator
            size={itemChromeParts.processingStatusIndicator.size}
            color={itemChromeParts.processingStatusIndicator.color}
          />
        )}
        <View style={contentParts.container.style}>
          <Text
            style={contentParts.messageText.style}
            numberOfLines={contentParts.messageText.numberOfLines}
          >
            {contentParts.messageText.text}
          </Text>
          {contentParts.errorText && (
            <Text style={contentParts.errorText.style}>
              {contentParts.errorText.text}
            </Text>
          )}
          <View style={contentParts.metaRow.style}>
            <Text style={contentParts.metaText.style}>
              {contentParts.metaText.text}
            </Text>
            {expandButtonParts && (
              <TouchableOpacity
                style={expandButtonParts.pressable.style}
                onPress={expandButtonParts.pressable.onPress}
                activeOpacity={expandButtonParts.pressable.activeOpacity}
                accessibilityRole={expandButtonParts.pressable.accessibilityRole}
                accessibilityLabel={expandButtonParts.pressable.accessibilityLabel}
              >
                <Ionicons
                  name={expandButtonParts.icon.name}
                  size={expandButtonParts.icon.size}
                  color={expandButtonParts.icon.color}
                />
                <Text style={expandButtonParts.label.style}>
                  {expandButtonParts.label.text}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {itemChromeParts.actions && (
            <View style={itemChromeParts.actions.style}>
              {actionParts.actions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={action.style}
                  onPress={action.onPress}
                  activeOpacity={action.activeOpacity}
                  accessibilityRole={action.accessibilityRole}
                  accessibilityLabel={action.accessibilityLabel}
                  hitSlop={action.hitSlop}
                >
                  <Ionicons
                    name={action.icon.name}
                    size={action.icon.size}
                    color={action.icon.color}
                  />
                  <Text style={action.label.style}>{action.label.text}</Text>
                </TouchableOpacity>
              ))}
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
  messages,
  colors,
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
  isListCollapsed,
  onToggleListCollapsed,
}: MessageQueuePanelProps) {
  const queuePanelRenderState = getMessageQueuePanelMobileRenderState({
    messages,
    colors,
    isPaused,
    isListCollapsed,
    canProcessNext,
  });
  const queuePanelState = queuePanelRenderState.panel;
  const panelSurface = queuePanelRenderState.surface.panel;
  const queuePanelColors = queuePanelRenderState.colors;
  const panelColors = queuePanelColors.panel;
  const queuePanelIcons = queuePanelRenderState.icons;
  const queuePanelCopy = queuePanelRenderState.copy;
  const panelStyleSlots = createMessageQueuePanelMobileStyleSlots({
    surface: panelSurface,
    colors: panelColors,
    panel: queuePanelState,
  });

  if (!queuePanelRenderState.shouldRender) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      ...panelStyleSlots.container,
    },
    header: {
      ...panelStyleSlots.header,
    },
    headerCollapsed: {
      ...panelStyleSlots.headerCollapsed,
    },
    headerLeft: {
      ...panelStyleSlots.headerLeft,
    },
    headerActions: {
      ...panelStyleSlots.headerActions,
    },
    headerTitle: {
      ...panelStyleSlots.headerTitle,
    },
    clearButton: {
      ...panelStyleSlots.clearButton,
    },
    clearButtonText: {
      ...panelStyleSlots.clearButtonText,
    },
    queueControlText: {
      ...panelStyleSlots.queueControlText,
    },
    queueControlTextDisabled: {
      ...panelStyleSlots.queueControlTextDisabled,
    },
    processButton: {
      ...panelStyleSlots.processButton,
    },
    processButtonText: {
      ...panelStyleSlots.processButtonText,
    },
    list: {
      ...panelStyleSlots.list,
    },
    separator: {
      ...panelStyleSlots.separator,
    },
    pausedNotice: {
      ...panelStyleSlots.pausedNotice,
    },
    pausedNoticeText: {
      ...panelStyleSlots.pausedNoticeText,
    },
    compactContainer: {
      ...panelStyleSlots.compactContainer,
    },
    compactText: {
      ...panelStyleSlots.compactText,
    },
    compactAction: {
      ...panelStyleSlots.compactAction,
    },
  });
  const compactActionParts = createMessageQueuePanelCompactActionMobilePropsParts({
    surface: panelSurface,
    colors: panelColors,
    icons: queuePanelIcons,
    copy: queuePanelCopy,
    panel: queuePanelState,
    styles,
    onPause,
    onResume,
    onProcessNext,
    onClear,
  });
  const headerActionParts = createMessageQueuePanelHeaderActionMobilePropsParts({
    surface: panelSurface,
    colors: panelColors,
    copy: queuePanelCopy,
    panel: queuePanelState,
    styles,
    onPause,
    onResume,
    onProcessNext,
    onClear,
    onToggleListCollapsed,
  });
  const panelChromeParts = createMessageQueuePanelChromeMobilePropsParts({
    surface: panelSurface,
    colors: panelColors,
    copy: queuePanelCopy,
    panel: queuePanelState,
    styles,
  });
  const panelListParts = createMessageQueuePanelListMobilePropsParts({
    items: queuePanelState.items,
    styles,
    onRemove,
    onUpdate,
    onRetry,
  });

  if (compact) {
    return (
      <View style={panelChromeParts.compactContainer.style}>
        <Ionicons
          name={panelChromeParts.compactStatusIcon.name}
          size={panelChromeParts.compactStatusIcon.size}
          color={panelChromeParts.compactStatusIcon.color}
        />
        <Text style={panelChromeParts.compactLabel.style}>
          {panelChromeParts.compactLabel.text}
        </Text>
        {compactActionParts.actions.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={action.style}
            onPress={action.onPress}
            disabled={action.disabled}
            activeOpacity={action.activeOpacity}
            accessibilityRole={action.accessibilityRole}
            accessibilityLabel={action.accessibilityLabel}
            accessibilityState={action.accessibilityState}
          >
            <Ionicons
              name={action.icon.name}
              size={action.icon.size}
              color={action.icon.color}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={panelChromeParts.container.style}>
      <View style={panelChromeParts.headerContainer.style}>
        <View style={panelChromeParts.headerLeft.style}>
          <Ionicons
            name={panelChromeParts.headerStatusIcon.name}
            size={panelChromeParts.headerStatusIcon.size}
            color={panelChromeParts.headerStatusIcon.color}
          />
          <Text style={panelChromeParts.headerTitle.style}>
            {panelChromeParts.headerTitle.text}
          </Text>
        </View>
        <View style={panelChromeParts.headerActions.style}>
          {headerActionParts.actions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={action.style}
              onPress={action.onPress}
              disabled={action.disabled}
              activeOpacity={action.activeOpacity}
              accessibilityRole={action.accessibilityRole}
              accessibilityLabel={action.accessibilityLabel}
              accessibilityState={action.accessibilityState}
            >
              {action.type === 'text' ? (
                <Text style={action.label.style}>{action.label.text}</Text>
              ) : (
                <Ionicons
                  name={action.icon.name}
                  size={action.icon.size}
                  color={action.icon.color}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {panelChromeParts.pausedNotice && (
        <View style={panelChromeParts.pausedNotice.container.style}>
          <Text style={panelChromeParts.pausedNotice.message.style}>
            {panelChromeParts.pausedNotice.message.text}
          </Text>
        </View>
      )}
      {panelChromeParts.list && (
        <ScrollView style={panelChromeParts.list.style}>
          {panelListParts.items.map((item) => (
            <React.Fragment key={item.key}>
              {item.separator && <View style={item.separator.style} />}
              <QueuedMessageItem
                {...item.messageProps}
                colors={colors}
              />
            </React.Fragment>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
