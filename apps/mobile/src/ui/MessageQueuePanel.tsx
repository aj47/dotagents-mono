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
  createMessageQueuePanelMobileStyleSheetSlots,
  createMessageQueuePanelMobilePropsParts,
  createQueuedMessageItemMobilePropsParts,
  createQueuedMessageItemMobileStyleSheetSlots,
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
  const editDraftState = getQueuedMessageEditDraftState(editText, message.text);
  const itemStyleSheetSlots = createQueuedMessageItemMobileStyleSheetSlots({
    renderState: queuedMessageRenderState,
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

  const styles = StyleSheet.create({ ...itemStyleSheetSlots });
  const {
    edit: editParts,
    actions: actionParts,
    expandButton: expandButtonParts,
    content: contentParts,
    chrome: itemChromeParts,
  } = createQueuedMessageItemMobilePropsParts({
    renderState: queuedMessageRenderState,
    message,
    editDraftState,
    isExpanded,
    styles,
    onRetry,
    onEdit: () => setIsEditing(true),
    onRemove,
    onToggleExpanded: () => setIsExpanded(!isExpanded),
    onCancelEdit: handleCancelEdit,
    onSaveEdit: handleSaveEdit,
  });

  if (isEditing) {
    return (
      <View style={itemChromeParts.container.style}>
        <View style={editParts.container.style}>
          <TextInput
            {...editParts.input.props}
            value={editText}
            onChangeText={setEditText}
          />
          <View style={editParts.actions.style}>
            <TouchableOpacity
              {...editParts.cancelButton.props}
            >
              <Text {...editParts.cancelButton.text.props}>
                {editParts.cancelButton.text.text}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              {...editParts.saveButton.props}
            >
              <Text {...editParts.saveButton.text.props}>
                {editParts.saveButton.text.text}
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
        {itemChromeParts.failedStatusIcon.shouldRender ? (
          <Ionicons
            {...itemChromeParts.failedStatusIcon.props}
          />
        ) : null}
        {itemChromeParts.processingStatusIndicator.shouldRender ? (
          <ActivityIndicator
            {...itemChromeParts.processingStatusIndicator.props}
          />
        ) : null}
        <View style={contentParts.container.style}>
          <Text {...contentParts.messageText.props}>
            {contentParts.messageText.text}
          </Text>
          {contentParts.errorText.shouldRender ? (
            <Text {...contentParts.errorText.props}>
              {contentParts.errorText.text}
            </Text>
          ) : null}
          <View style={contentParts.metaRow.style}>
            <Text {...contentParts.metaText.props}>
              {contentParts.metaText.text}
            </Text>
            {expandButtonParts.shouldRender ? (
              <TouchableOpacity
                {...expandButtonParts.pressable.props}
              >
                <Ionicons
                  {...expandButtonParts.icon.props}
                />
                <Text {...expandButtonParts.label.props}>
                  {expandButtonParts.label.text}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {itemChromeParts.actions.shouldRender ? (
            <View style={itemChromeParts.actions.style}>
              {actionParts.actions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  {...action.props}
                >
                  <Ionicons
                    {...action.icon.props}
                  />
                  <Text {...action.label.props}>{action.label.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
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
  const panelStyleSheetSlots = createMessageQueuePanelMobileStyleSheetSlots({
    renderState: queuePanelRenderState,
  });

  if (!queuePanelRenderState.shouldRender) {
    return null;
  }

  const styles = StyleSheet.create({ ...panelStyleSheetSlots });
  const {
    compactActions: compactActionParts,
    headerActions: headerActionParts,
    chrome: panelChromeParts,
    list: panelListParts,
  } = createMessageQueuePanelMobilePropsParts({
    renderState: queuePanelRenderState,
    styles,
    onPause,
    onResume,
    onProcessNext,
    onClear,
    onToggleListCollapsed,
    onRemove,
    onUpdate,
    onRetry,
  });

  if (compact) {
    return (
      <View style={panelChromeParts.compactContainer.style}>
        <Ionicons
          {...panelChromeParts.compactStatusIcon.props}
        />
        <Text {...panelChromeParts.compactLabel.props}>
          {panelChromeParts.compactLabel.text}
        </Text>
        {compactActionParts.actions.map((action) => (
          <TouchableOpacity
            key={action.key}
            {...action.props}
          >
            <Ionicons
              {...action.icon.props}
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
            {...panelChromeParts.headerStatusIcon.props}
          />
          <Text {...panelChromeParts.headerTitle.props}>
            {panelChromeParts.headerTitle.text}
          </Text>
        </View>
        <View style={panelChromeParts.headerActions.style}>
          {headerActionParts.actions.map((action) => (
            <TouchableOpacity
              key={action.key}
              {...action.props}
            >
              {action.label.shouldRender ? (
                <Text {...action.label.props}>{action.label.text}</Text>
              ) : null}
              {action.icon.shouldRender ? (
                <Ionicons
                  {...action.icon.props}
                />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {panelChromeParts.pausedNotice.shouldRender ? (
        <View style={panelChromeParts.pausedNotice.container.style}>
          <Text {...panelChromeParts.pausedNotice.message.props}>
            {panelChromeParts.pausedNotice.message.text}
          </Text>
        </View>
      ) : null}
      {panelChromeParts.list.shouldRender ? (
        <ScrollView
          {...panelChromeParts.list.props}
        >
          {panelListParts.items.map((item) => (
            <React.Fragment key={item.key}>
              {item.separator.shouldRender ? <View {...item.separator.props} /> : null}
              <QueuedMessageItem
                {...item.messageProps}
                colors={colors}
              />
            </React.Fragment>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
