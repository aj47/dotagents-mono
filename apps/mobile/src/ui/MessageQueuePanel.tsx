/**
 * MessageQueuePanel - React Native version of the message queue panel UI
 * 
 * Displays queued messages with options to view, edit, remove, and retry.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  createMessageQueuePanelMobilePropsParts,
  createQueuedMessageItemMobilePropsParts,
  getMessageQueuePanelMobileRenderState,
  getQueuedMessageEditDraftState,
  getQueuedMessageItemMobileRenderState,
  type MessageQueuePanelMobilePropsParts,
  type MessageQueuePanelMobileStyleSheetSlots,
  type QueuedMessageItemMobilePropsParts,
  type QueuedMessageItemMobileStyleSheetSlots,
  type QueuedMessage,
} from '@dotagents/shared/session-presentation';

export type MessageQueuePanelColors =
  Parameters<typeof getMessageQueuePanelMobileRenderState>[0]['colors']
  & Parameters<typeof getQueuedMessageItemMobileRenderState>[0]['colors'];

export type MessageQueuePanelStyleSheetSlotsFactory = (input: {
  renderState: ReturnType<typeof getMessageQueuePanelMobileRenderState>;
}) => MessageQueuePanelMobileStyleSheetSlots;

export type QueuedMessageItemStyleSheetSlotsFactory = (input: {
  renderState: ReturnType<typeof getQueuedMessageItemMobileRenderState>;
}) => QueuedMessageItemMobileStyleSheetSlots;

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
  createStyleSheetSlots: MessageQueuePanelStyleSheetSlotsFactory;
  createItemStyleSheetSlots: QueuedMessageItemStyleSheetSlotsFactory;
}

interface QueuedMessageItemProps {
  message: QueuedMessage;
  colors: MessageQueuePanelColors;
  onRemove: () => void;
  onUpdate: (text: string) => void;
  onRetry: () => void;
  createStyleSheetSlots: QueuedMessageItemStyleSheetSlotsFactory;
}

type MessageQueuePanelParts =
  MessageQueuePanelMobilePropsParts<
    QueuedMessage,
    MessageQueuePanelMobileStyleSheetSlots,
    () => void
  >;

type QueuedMessageItemParts =
  QueuedMessageItemMobilePropsParts<QueuedMessageItemMobileStyleSheetSlots>;

type MessageQueuePanelActionButtonPart =
  | MessageQueuePanelParts['compactActions']['actions'][number]
  | MessageQueuePanelParts['headerActions']['actions'][number]
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

const MessageQueuePanelActionButton = React.memo(function MessageQueuePanelActionButton({
  action,
}: MessageQueuePanelActionButtonProps) {
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
});

const MessageQueuePanelEditButton = React.memo(function MessageQueuePanelEditButton({
  button,
}: MessageQueuePanelEditButtonProps) {
  return (
    <TouchableOpacity
      {...button.props}
    >
      <Text {...button.text.props}>
        {button.text.text}
      </Text>
    </TouchableOpacity>
  );
});

const QueuedMessageItem = React.memo(function QueuedMessageItem({
  message,
  colors,
  onRemove,
  onUpdate,
  onRetry,
  createStyleSheetSlots,
}: QueuedMessageItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const queuedMessageRenderState = useMemo(
    () => getQueuedMessageItemMobileRenderState({
      message,
      isExpanded,
      colors,
    }),
    [colors, isExpanded, message],
  );
  const messagePresentation = queuedMessageRenderState.presentation;
  const {
    isProcessing,
  } = messagePresentation;
  const editDraftState = useMemo(
    () => getQueuedMessageEditDraftState(editText, message.text),
    [editText, message.text],
  );
  const itemStyleSheetSlots = useMemo<QueuedMessageItemMobileStyleSheetSlots>(
    () => createStyleSheetSlots({
      renderState: queuedMessageRenderState,
    }),
    [createStyleSheetSlots, queuedMessageRenderState],
  );

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

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded((current) => !current);
  }, []);

  const handleSaveEdit = useCallback(() => {
    const editSubmitState = editDraftState.submitState;
    if (editSubmitState.shouldSubmit) {
      onUpdate(editSubmitState.trimmedText);
    }
    if (editSubmitState.shouldRestoreOriginalText) {
      setEditText(message.text);
    }
    setIsEditing(false);
  }, [editDraftState, message.text, onUpdate]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditText(message.text);
  }, [message.text]);

  const styles = useMemo(
    () => StyleSheet.create({ ...itemStyleSheetSlots }),
    [itemStyleSheetSlots],
  );
  const queuedMessageItemParts = useMemo(
    () => createQueuedMessageItemMobilePropsParts({
      renderState: queuedMessageRenderState,
      message,
      editDraftState,
      isExpanded,
      styles,
      onRetry,
      onEdit: handleStartEdit,
      onRemove,
      onToggleExpanded: handleToggleExpanded,
      onCancelEdit: handleCancelEdit,
      onSaveEdit: handleSaveEdit,
    }),
    [
      editDraftState,
      handleCancelEdit,
      handleSaveEdit,
      handleStartEdit,
      handleToggleExpanded,
      isExpanded,
      message,
      onRemove,
      onRetry,
      queuedMessageRenderState,
      styles,
    ],
  );
  const {
    edit: editParts,
    actions: actionParts,
    expandButton: expandButtonParts,
    content: contentParts,
    chrome: itemChromeParts,
  } = queuedMessageItemParts;
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
});

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
  createStyleSheetSlots,
  createItemStyleSheetSlots,
}: MessageQueuePanelProps) {
  const queuePanelRenderState = useMemo(
    () => getMessageQueuePanelMobileRenderState({
      messages,
      colors,
      isPaused,
      isListCollapsed,
      canProcessNext,
    }),
    [canProcessNext, colors, isListCollapsed, isPaused, messages],
  );
  const panelStyleSheetSlots = useMemo<MessageQueuePanelMobileStyleSheetSlots>(
    () => createStyleSheetSlots({
      renderState: queuePanelRenderState,
    }),
    [createStyleSheetSlots, queuePanelRenderState],
  );

  const styles = useMemo(
    () => StyleSheet.create({ ...panelStyleSheetSlots }),
    [panelStyleSheetSlots],
  );
  const messageQueuePanelParts = useMemo(
    () => createMessageQueuePanelMobilePropsParts({
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
    }),
    [
      onClear,
      onPause,
      onProcessNext,
      onRemove,
      onResume,
      onRetry,
      onToggleListCollapsed,
      onUpdate,
      queuePanelRenderState,
      styles,
    ],
  );
  const {
    compactActions: compactActionParts,
    headerActions: headerActionParts,
    chrome: panelChromeParts,
    list: panelListParts,
  } = messageQueuePanelParts;

  if (!queuePanelRenderState.shouldRender) {
    return null;
  }

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
                createStyleSheetSlots={createItemStyleSheetSlots}
              />
            </React.Fragment>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
