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
  type MessageQueuePanelMobilePropsParts,
  type MessageQueuePanelMobileStyleSheetSlots,
  type QueuedMessageItemMobilePropsParts,
  type QueuedMessageItemMobileStyleSheetSlots,
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

type QueuedMessageItemParts =
  QueuedMessageItemMobilePropsParts<QueuedMessageItemMobileStyleSheetSlots>;

type MessageQueuePanelActionButtonPart =
  | MessageQueuePanelMobilePropsParts<
      QueuedMessage,
      MessageQueuePanelMobileStyleSheetSlots,
      () => void
    >['compactActions']['actions'][number]
  | MessageQueuePanelMobilePropsParts<
      QueuedMessage,
      MessageQueuePanelMobileStyleSheetSlots,
      () => void
    >['headerActions']['actions'][number]
  | QueuedMessageItemParts['actions']['actions'][number];

interface MessageQueuePanelActionButtonProps {
  action: MessageQueuePanelActionButtonPart;
}

type MessageQueuePanelEditButtonPart =
  | QueuedMessageItemParts['edit']['cancelButton']
  | QueuedMessageItemParts['edit']['saveButton'];

interface MessageQueuePanelEditButtonProps {
  button: MessageQueuePanelEditButtonPart;
}

function MessageQueuePanelActionButton({ action }: MessageQueuePanelActionButtonProps) {
  const actionIcon = action.icon;
  const actionLabel = 'label' in action ? action.label : undefined;

  return (
    <TouchableOpacity
      {...action.props}
    >
      {actionIcon && 'props' in actionIcon ? (
        <Ionicons
          {...actionIcon.props}
        />
      ) : null}
      {actionLabel && 'props' in actionLabel ? (
        <Text {...actionLabel.props}>{actionLabel.text}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

function MessageQueuePanelEditButton({ button }: MessageQueuePanelEditButtonProps) {
  return (
    <TouchableOpacity
      {...button.props}
    >
      <Text {...button.text.props}>
        {button.text.text}
      </Text>
    </TouchableOpacity>
  );
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
  const expandButtonPressable = expandButtonParts.pressable;

  if (isEditing) {
    return (
      <View {...itemChromeParts.container.props}>
        <View {...editParts.container.props}>
          <TextInput
            {...editParts.input.props}
            value={editText}
            onChangeText={setEditText}
          />
          <View {...editParts.actions.props}>
            <MessageQueuePanelEditButton button={editParts.cancelButton} />
            <MessageQueuePanelEditButton button={editParts.saveButton} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View {...itemChromeParts.container.props}>
      <View {...itemChromeParts.row.props}>
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
        <View {...contentParts.container.props}>
          <Text {...contentParts.messageText.props}>
            {contentParts.messageText.text}
          </Text>
          {contentParts.errorText.shouldRender ? (
            <Text {...contentParts.errorText.props}>
              {contentParts.errorText.text}
            </Text>
          ) : null}
          <View {...contentParts.metaRow.props}>
            <Text {...contentParts.metaText.props}>
              {contentParts.metaText.text}
            </Text>
            {expandButtonPressable.shouldRender ? (
              <TouchableOpacity
                {...expandButtonPressable.props}
              >
                <Ionicons
                  {...expandButtonPressable.content.icon.props}
                />
                <Text {...expandButtonPressable.content.label.props}>
                  {expandButtonPressable.content.label.text}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {itemChromeParts.actions.shouldRender ? (
            <View {...itemChromeParts.actions.props}>
              {actionParts.actions.map((action) => (
                <MessageQueuePanelActionButton
                  key={action.key}
                  action={action}
                />
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
      <View {...panelChromeParts.compactContainer.props}>
        <Ionicons
          {...panelChromeParts.compactStatusIcon.props}
        />
        <Text {...panelChromeParts.compactLabel.props}>
          {panelChromeParts.compactLabel.text}
        </Text>
        {compactActionParts.actions.map((action) => (
          <MessageQueuePanelActionButton
            key={action.key}
            action={action}
          />
        ))}
      </View>
    );
  }

  return (
    <View {...panelChromeParts.container.props}>
      <View {...panelChromeParts.headerContainer.props}>
        <View {...panelChromeParts.headerLeft.props}>
          <Ionicons
            {...panelChromeParts.headerStatusIcon.props}
          />
          <Text {...panelChromeParts.headerTitle.props}>
            {panelChromeParts.headerTitle.text}
          </Text>
        </View>
        <View {...panelChromeParts.headerActions.props}>
          {headerActionParts.actions.map((action) => (
            <MessageQueuePanelActionButton
              key={action.key}
              action={action}
            />
          ))}
        </View>
      </View>
      {panelChromeParts.pausedNotice.shouldRender ? (
        <View {...panelChromeParts.pausedNotice.container.props}>
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
