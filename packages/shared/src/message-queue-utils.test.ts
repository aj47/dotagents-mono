import { describe, expect, it } from 'vitest';

import {
  MESSAGE_QUEUE_PANEL_PRESENTATION,
  MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION,
  buildQueuedMessage,
  buildOperatorMessageQueuesResponse,
  clearOperatorMessageQueueSummary,
  clearQueuedMessages,
  createMessageQueuePanelMobileStyleSlots,
  createMessageQueuePanelMobileStyleSheetSlots,
  createMessageQueuePanelMobilePropsParts,
  createMessageQueuePanelMobileWrapperStyleSlots,
  createMessageQueuePanelCompactActionMobilePropsParts,
  createMessageQueuePanelHeaderActionMobilePropsParts,
  createMessageQueuePanelChromeMobilePropsParts,
  createMessageQueuePanelListMobilePropsParts,
  createQueuedMessageItemMobilePropsParts,
  createQueuedMessageStatusIndicatorMobilePropsPart,
  createQueuedMessageItemChromeMobilePropsParts,
  createQueuedMessageContentMobilePropsParts,
  createQueuedMessageExpandButtonMobilePropsParts,
  createQueuedMessageActionButtonMobilePropsParts,
  createQueuedMessageActionButtonMobileStyleSlots,
  createQueuedMessageActionRowMobileStyleSlot,
  createQueuedMessageEditMobilePropsParts,
  createQueuedMessageEditMobileStyleSlots,
  createQueuedMessageItemMobileStyleSheetSlots,
  createQueuedMessageItemMobileStyleSlots,
  enqueueQueuedMessage,
  canEditQueuedMessage,
  canMutateQueuedMessage,
  formatMessageQueueCompactLabel,
  formatMessageQueuePanelTitle,
  formatQueuedMessageError,
  formatQueuedMessageMetaLabel,
  formatQueuedMessageSummary,
  formatQueuedMessageTimestamp,
  getAllMessageQueues,
  getMessageQueueListToggleLabel,
  getMessageQueuePanelCopyState,
  getMessageQueuePanelDesktopRenderState,
  getMessageQueuePanelDesktopSurfaceState,
  getMessageQueuePanelMobileDockRenderState,
  getMessageQueuePanelMobileIconState,
  getMessageQueuePanelMobileRenderState,
  getMessageQueuePanelMobileSurfaceColors,
  getMessageQueuePanelMobileSurfaceRenderState,
  getMessageQueuePanelMobileSurfaceState,
  getMessageQueuePanelMobileWrapperRenderState,
  getMessageQueuePanelActionState,
  getMessageQueuePanelRenderItems,
  getMessageQueuePanelState,
  getOperatorMessageQueueTotalMessageCount,
  getQueuedMessageEditDraftState,
  getQueuedMessageEditSubmitState,
  getQueuedMessageItemDesktopRenderState,
  getQueuedMessageItemPresentation,
  getQueuedMessageItemMobileRenderState,
  getQueuedMessageEditSaveActionState,
  getQueuedMessages,
  getQueuedMessageStatusLabel,
  getQueuedMessageExpansionAccessibilityLabel,
  getQueuedMessageExpansionLabel,
  hasProcessingQueuedMessage,
  hasQueuedMessages,
  isQueuedMessageCancelled,
  isQueuedMessageFailed,
  isQueuedMessagePending,
  isQueuedMessageProcessing,
  markQueuedMessageAddedToHistory,
  markQueuedMessageFailed,
  markQueuedMessageProcessed,
  markQueuedMessageProcessing,
  peekNextQueuedMessage,
  removeOperatorQueuedMessageSummary,
  removeQueuedMessage,
  reorderQueuedMessages,
  resetQueuedMessageToPending,
  retryOperatorQueuedMessageSummary,
  setOperatorMessageQueueSummaryPaused,
  updateOperatorQueuedMessageSummaryText,
  updateQueuedMessageText,
  type MessageQueueMap,
} from './message-queue-utils';

const makeMessage = (id: string, overrides: Partial<ReturnType<typeof buildQueuedMessage>> = {}) =>
  ({
    ...buildQueuedMessage({
      id,
      conversationId: 'conversation-1',
      text: id,
      createdAt: 1000,
    }),
    ...overrides,
  });

const mobileMessageQueuePalette = {
  background: '#ffffff',
  border: '#d4d4d4',
  destructive: '#dc2626',
  foreground: '#171717',
  mutedForeground: '#737373',
  primary: '#2563eb',
  primaryForeground: '#ffffff',
  success: '#16a34a',
  warning: '#f59e0b',
};

describe('message-queue-utils', () => {
  it('enqueues, lists, peeks, and removes messages by conversation', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1')).queues;
    queues = enqueueQueuedMessage(queues, makeMessage('msg-2')).queues;

    expect(hasQueuedMessages(queues, 'conversation-1')).toBe(true);
    expect(getQueuedMessages(queues, 'conversation-1').map((message) => message.id)).toEqual(['msg-1', 'msg-2']);
    expect(getAllMessageQueues(queues)).toEqual([
      {
        conversationId: 'conversation-1',
        messages: getQueuedMessages(queues, 'conversation-1'),
      },
    ]);
    expect(buildOperatorMessageQueuesResponse([{
      conversationId: 'conversation-1',
      isPaused: true,
      messages: getQueuedMessages(queues, 'conversation-1'),
    }])).toEqual({
      count: 1,
      totalMessages: 2,
      queues: [{
        conversationId: 'conversation-1',
        isPaused: true,
        messageCount: 2,
        messages: getQueuedMessages(queues, 'conversation-1'),
      }],
    });
    expect(peekNextQueuedMessage(queues, 'conversation-1')?.id).toBe('msg-1');

    const removed = removeQueuedMessage(queues, 'conversation-1', 'msg-1');
    queues = removed.queues;
    expect(removed.ok).toBe(true);
    expect(getQueuedMessages(queues, 'conversation-1').map((message) => message.id)).toEqual(['msg-2']);
  });

  it('updates operator message queue summaries for optimistic previews', () => {
    const failedMessage = makeMessage('msg-1', {
      status: 'failed',
      errorMessage: 'No session available',
    });
    const processingMessage = makeMessage('msg-2', {
      status: 'processing',
      text: 'running',
    });
    const summaries = [
      {
        conversationId: 'conversation-1',
        isPaused: true,
        messageCount: 2,
        messages: [failedMessage, processingMessage],
      },
      {
        conversationId: 'conversation-2',
        isPaused: false,
        messageCount: 1,
        messages: [
          {
            ...makeMessage('msg-3'),
            conversationId: 'conversation-2',
          },
        ],
      },
    ];

    expect(getOperatorMessageQueueTotalMessageCount(summaries)).toBe(3);
    expect(setOperatorMessageQueueSummaryPaused(summaries, 'conversation-1', false)[0].isPaused).toBe(false);
    expect(clearOperatorMessageQueueSummary(summaries, 'conversation-2')).toHaveLength(1);

    const updated = updateOperatorQueuedMessageSummaryText(summaries, 'conversation-1', 'msg-1', ' retry text ');
    expect(updated[0].messages[0]).toMatchObject({
      id: 'msg-1',
      status: 'pending',
      text: 'retry text',
    });
    expect(updated[0].messages[0].errorMessage).toBeUndefined();

    const retried = retryOperatorQueuedMessageSummary(summaries, 'conversation-1', 'msg-1');
    expect(retried[0].messages[0]).toMatchObject({
      id: 'msg-1',
      status: 'pending',
    });
    expect(retried[0].messages[0].errorMessage).toBeUndefined();

    const removed = removeOperatorQueuedMessageSummary(summaries, 'conversation-1', 'msg-1');
    expect(removed[0]).toMatchObject({
      conversationId: 'conversation-1',
      messageCount: 1,
    });
    expect(removed[0].messages.map((message) => message.id)).toEqual(['msg-2']);
    expect(removeOperatorQueuedMessageSummary(removed, 'conversation-1', 'msg-2')).toEqual([
      summaries[1],
    ]);
  });

  it('blocks remove and clear while a message is processing', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1', { status: 'processing' })).queues;
    const processingMessage = getQueuedMessages(queues, 'conversation-1')[0];

    expect(isQueuedMessageProcessing(processingMessage)).toBe(true);
    expect(hasProcessingQueuedMessage(getQueuedMessages(queues, 'conversation-1'))).toBe(true);
    expect(canMutateQueuedMessage(processingMessage)).toBe(false);
    expect(canEditQueuedMessage(processingMessage)).toBe(false);

    expect(removeQueuedMessage(queues, 'conversation-1', 'msg-1')).toMatchObject({
      ok: false,
      reason: 'processing',
    });
    expect(clearQueuedMessages(queues, 'conversation-1')).toMatchObject({
      ok: false,
      reason: 'processing',
    });
    expect(getQueuedMessages(queues, 'conversation-1')).toHaveLength(1);
  });

  it('reports queued message edit and retry eligibility', () => {
    const pendingMessage = makeMessage('msg-1');
    const failedMessage = makeMessage('msg-2', { status: 'failed', errorMessage: 'timeout' });
    const processingMessage = makeMessage('msg-4', { status: 'processing' });
    const cancelledMessage = makeMessage('msg-5', { status: 'cancelled' });
    const addedToHistoryMessage = makeMessage('msg-3', { addedToHistory: true });

    expect(isQueuedMessagePending(pendingMessage)).toBe(true);
    expect(isQueuedMessageFailed(failedMessage)).toBe(true);
    expect(isQueuedMessageCancelled(cancelledMessage)).toBe(true);
    expect(canMutateQueuedMessage(pendingMessage)).toBe(true);
    expect(canEditQueuedMessage(pendingMessage)).toBe(true);
    expect(canEditQueuedMessage(addedToHistoryMessage)).toBe(false);
    expect(getQueuedMessageStatusLabel(pendingMessage)).toBe('Queued');
    expect(getQueuedMessageStatusLabel(processingMessage)).toBe('Processing...');
    expect(getQueuedMessageStatusLabel(failedMessage)).toBe('Failed');
    expect(getQueuedMessageStatusLabel(cancelledMessage)).toBe('Cancelled');
    expect(formatQueuedMessageSummary(failedMessage)).toBe('Failed: msg-2');
  });

  it('formats queue panel presentation copy for desktop and mobile surfaces', () => {
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.longMessagePreviewCharacterLimit).toBe(100);
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.pausedNotice).toBe('Paused. Resume to continue.');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.meta.separator).toBe(' • ');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.failedName).toBe('alert-circle');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.expandMessageName).toBe('chevron-down');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.collapseMessageName).toBe('chevron-up');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.expandQueueName).toBe('chevron-down');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.collapseQueueName).toBe('chevron-up');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.resumeName).toBe('play');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.pauseName).toBe('pause');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.sendNextName).toBe('play');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.clearName).toBe('trash-outline');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.retryName).toBe('refresh');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.editName).toBe('create-outline');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.removeName).toBe('trash-outline');
    expect(getMessageQueuePanelMobileIconState()).toBe(MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon);
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.actions.cancelAccessibilityLabel).toBe('Cancel queued message edit');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.actions.saveAccessibilityLabel).toBe('Save queued message edit');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.actions.editInputAccessibilityLabel).toBe('Queued message edit input');
    expect(getQueuedMessageEditSaveActionState('')).toEqual({
      isDisabled: true,
      accessibilityState: { disabled: true },
    });
    expect(getQueuedMessageEditSaveActionState('  retry text  ')).toEqual({
      isDisabled: false,
      accessibilityState: { disabled: false },
    });
    expect(getQueuedMessageEditSubmitState('  retry text  ', 'old text')).toEqual({
      trimmedText: 'retry text',
      shouldSubmit: true,
      shouldRestoreOriginalText: false,
    });
    expect(getQueuedMessageEditSubmitState('   ', 'old text')).toEqual({
      trimmedText: '',
      shouldSubmit: false,
      shouldRestoreOriginalText: true,
    });
    expect(getQueuedMessageEditSubmitState(' old text ', 'old text')).toEqual({
      trimmedText: 'old text',
      shouldSubmit: false,
      shouldRestoreOriginalText: true,
    });
    expect(getQueuedMessageEditDraftState('  retry text  ', 'old text')).toEqual({
      saveActionState: {
        isDisabled: false,
        accessibilityState: { disabled: false },
      },
      submitState: {
        trimmedText: 'retry text',
        shouldSubmit: true,
        shouldRestoreOriginalText: false,
      },
    });
    expect(getMessageQueuePanelActionState(false)).toEqual({
      isDisabled: true,
      accessibilityState: { disabled: true },
    });
    expect(getMessageQueuePanelActionState(true)).toEqual({
      isDisabled: false,
      accessibilityState: { disabled: false },
    });
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.actions.retryAccessibilityLabel).toBe('Retry queued message');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.actions.sendNextLabel).toBe('Send Next');
    expect(getQueuedMessageExpansionAccessibilityLabel(false)).toBe('Expand queued message');
    expect(getQueuedMessageExpansionAccessibilityLabel(true)).toBe('Collapse queued message');
    expect(getMessageQueuePanelCopyState()).toBe(MESSAGE_QUEUE_PANEL_PRESENTATION);
    expect(getMessageQueuePanelMobileSurfaceState()).toBe(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile);
    expect(getMessageQueuePanelMobileWrapperRenderState()).toEqual({
      wrapper: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.wrapper,
    });
    expect(createMessageQueuePanelMobileWrapperStyleSlots({
      wrapper: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.wrapper,
      spacing: {
        md: 16,
        sm: 8,
      },
    })).toEqual({
      wrapper: {
        paddingHorizontal: 16,
        paddingTop: 8,
      },
    });
    expect(getMessageQueuePanelMobileDockRenderState({
      isQueueEnabled: true,
      messageCount: 1,
    })).toEqual({
      shouldRender: true,
    });
    expect(getMessageQueuePanelMobileDockRenderState({
      isQueueEnabled: false,
      messageCount: 1,
    }).shouldRender).toBe(false);
    expect(getMessageQueuePanelMobileDockRenderState({
      isQueueEnabled: true,
      messageCount: 0,
    }).shouldRender).toBe(false);
    expect(getMessageQueuePanelDesktopSurfaceState()).toBe(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop);
    const queuedDesktopRenderMessage = makeMessage('desktop-render-message');
    expect(getMessageQueuePanelDesktopRenderState({
      messages: [queuedDesktopRenderMessage],
      isPaused: true,
      isListCollapsed: true,
    })).toMatchObject({
      shouldRender: true,
      panel: {
        messageCount: 1,
        isPaused: true,
        statusKey: 'paused',
        compactLabel: '1 queued message (paused)',
        title: 'Paused Messages (1)',
        shouldRenderList: false,
      },
      surface: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop,
      copy: MESSAGE_QUEUE_PANEL_PRESENTATION,
    });
    expect(getMessageQueuePanelDesktopRenderState({
      messages: [],
    }).shouldRender).toBe(false);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.wrapper.paddingHorizontal).toBe('md');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.wrapper.paddingTop).toBe('sm');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.paddingHorizontal).toBe(12);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.failedColorToken).toBe('destructive');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.processingColorToken).toBe('primary');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.messageColorToken).toBe('foreground');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.stateBackgroundAlpha).toBe(0.08);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.errorTextAlpha).toBe(0.8);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.metaTextAlpha).toBe(0.7);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.rowFlexDirection).toBe('row');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.rowAlignItems).toBe('flex-start');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.contentFlex).toBe(1);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.contentMinWidth).toBe(0);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.stateIconSize).toBe(16);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.processingIndicatorSize).toBe('small');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.message.fontSize).toBe(14);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.message.collapsedNumberOfLines).toBe(2);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.metaFlexDirection).toBe('row');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.metaAlignItems).toBe('center');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.metaFlexWrap).toBe('wrap');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.expandButtonFlexDirection).toBe('row');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.expandButtonAlignItems).toBe('center');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.expandButtonAccessibilityRole).toBe('button');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.expandButtonPressedOpacity).toBe(0.78);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.flexDirection).toBe('row');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.flexWrap).toBe('wrap');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.alignItems).toBe('center');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.buttonAlignSelf).toBe('flex-start');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.buttonMinHeight).toBe(28);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.buttonFlexDirection).toBe('row');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.buttonAlignItems).toBe('center');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.buttonGap).toBe(4);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.buttonBackgroundColorToken).toBe('background');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.buttonJustifyContent).toBe('center');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.buttonAccessibilityRole).toBe('button');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.buttonPressedOpacity).toBe(0.78);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.actionIconSize).toBe(13);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.removeTextColorToken).toBe('destructive');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.inputTextColorToken).toBe('foreground');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.inputTextAlignVertical).toBe('top');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.actionsFlexDirection).toBe('row');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.actionsJustifyContent).toBe('flex-end');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.buttonAccessibilityRole).toBe('button');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.buttonPressedOpacity).toBe(0.78);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.saveButtonTextColorToken).toBe('primaryForeground');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.overflow).toBe('hidden');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.backgroundAlpha).toBe(0.19);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.borderAlpha).toBe(0.38);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.headerBackgroundAlpha).toBe(0.31);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.headerFlexDirection).toBe('row');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.headerAlignItems).toBe('center');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.headerJustifyContent).toBe('space-between');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.headerBorderBottomWidth).toBe(1);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.headerCollapsedBorderBottomWidth).toBe(0);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.headerLeftFlexDirection).toBe('row');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.headerLeftAlignItems).toBe('center');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.headerActionsFlexDirection).toBe('row');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.headerActionsAlignItems).toBe('center');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.actionAccessibilityRole).toBe('button');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.actionPressedOpacity).toBe(0.78);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.listMaxHeight).toBe(200);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.listShowsVerticalScrollIndicator).toBe(true);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.compactFlexDirection).toBe('row');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.compactAlignItems).toBe('center');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.compactTextFlex).toBe(1);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.titleColorToken).toBe('foreground');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.disabledActionColorToken).toBe('mutedForeground');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.processReadyColorToken).toBe('primary');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status.queued.iconName).toBe('time-outline');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status.queued.backgroundAlpha).toBe(0.07);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status.queued.borderAlpha).toBe(0.27);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status.queued.headerBackgroundAlpha).toBe(0.09);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status.paused.iconName).toBe('pause-circle-outline');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status.paused.backgroundAlpha).toBe(0.09);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status.paused.borderAlpha).toBe(0.44);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status.paused.headerBackgroundAlpha).toBe(0.13);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.pausedNoticeFontSize).toBe(11);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.pausedNoticeBackgroundAlpha).toBe(0.09);
    expect(getMessageQueuePanelMobileSurfaceColors(mobileMessageQueuePalette)).toEqual({
      item: {
        failedBackgroundColor: 'rgba(220, 38, 38, 0.08)',
        processingBackgroundColor: 'rgba(37, 99, 235, 0.08)',
        transparentBackgroundColor: 'transparent',
        failedColor: '#dc2626',
        processingColor: '#2563eb',
        messageColor: '#171717',
        failedMetaColor: 'rgba(220, 38, 38, 0.7)',
        processingMetaColor: 'rgba(37, 99, 235, 0.7)',
        metaColor: '#737373',
        errorColor: 'rgba(220, 38, 38, 0.8)',
        expandTextColor: '#737373',
      },
      actions: {
        buttonBorderColor: '#d4d4d4',
        buttonBackgroundColor: '#ffffff',
        retryTextColor: '#2563eb',
        editTextColor: '#171717',
        removeTextColor: '#dc2626',
      },
      edit: {
        inputBorderColor: '#d4d4d4',
        inputBackgroundColor: '#ffffff',
        inputTextColor: '#171717',
        cancelButtonBackgroundColor: 'transparent',
        saveButtonBackgroundColor: '#2563eb',
        buttonTextColor: '#171717',
        saveButtonTextColor: '#ffffff',
      },
      panel: {
        titleColor: '#171717',
        disabledActionColor: '#737373',
        resumeActionColor: '#16a34a',
        processReadyColor: '#2563eb',
        toggleIconColor: '#737373',
        status: {
          queued: {
            color: '#f59e0b',
            borderColor: 'rgba(245, 158, 11, 0.27)',
            backgroundColor: 'rgba(245, 158, 11, 0.07)',
            headerBorderBottomColor: 'rgba(245, 158, 11, 0.38)',
            headerBackgroundColor: 'rgba(245, 158, 11, 0.09)',
            separatorColor: 'rgba(245, 158, 11, 0.38)',
            pausedNoticeBackgroundColor: 'rgba(245, 158, 11, 0.09)',
            pausedNoticeBorderBottomColor: 'rgba(245, 158, 11, 0.38)',
            pausedNoticeTextColor: '#f59e0b',
          },
          paused: {
            color: '#f59e0b',
            borderColor: 'rgba(245, 158, 11, 0.44)',
            backgroundColor: 'rgba(245, 158, 11, 0.09)',
            headerBorderBottomColor: 'rgba(245, 158, 11, 0.38)',
            headerBackgroundColor: 'rgba(245, 158, 11, 0.13)',
            separatorColor: 'rgba(245, 158, 11, 0.38)',
            pausedNoticeBackgroundColor: 'rgba(245, 158, 11, 0.09)',
            pausedNoticeBorderBottomColor: 'rgba(245, 158, 11, 0.38)',
            pausedNoticeTextColor: '#f59e0b',
          },
        },
      },
    });
    expect(getMessageQueuePanelMobileSurfaceRenderState({
      colors: mobileMessageQueuePalette,
    })).toMatchObject({
      surface: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile,
      colors: {
        item: {
          failedColor: '#dc2626',
          processingColor: '#2563eb',
          messageColor: '#171717',
        },
        actions: {
          buttonBorderColor: '#d4d4d4',
          removeTextColor: '#dc2626',
        },
        panel: {
          titleColor: '#171717',
          status: {
            queued: {
              color: '#f59e0b',
              borderColor: 'rgba(245, 158, 11, 0.27)',
            },
          },
        },
      },
    });
    const mobileQueueSurfaceRenderState = getMessageQueuePanelMobileSurfaceRenderState({
      colors: mobileMessageQueuePalette,
    });
    expect(createMessageQueuePanelMobileStyleSlots({
      surface: mobileQueueSurfaceRenderState.surface.panel,
      colors: mobileQueueSurfaceRenderState.colors.panel,
      panel: getMessageQueuePanelState([makeMessage('panel-message')], {
        canProcessNext: true,
      }),
    })).toMatchObject({
      container: {
        borderRadius: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.borderRadius,
        borderWidth: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.borderWidth,
        borderColor: 'rgba(245, 158, 11, 0.27)',
        backgroundColor: 'rgba(245, 158, 11, 0.07)',
        overflow: 'hidden',
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(245, 158, 11, 0.09)',
      },
      headerTitle: {
        fontSize: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.titleFontSize,
        fontWeight: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.titleFontWeight,
        color: '#171717',
      },
      clearButton: {
        paddingHorizontal: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.actionPaddingHorizontal,
        paddingVertical: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.actionPaddingVertical,
      },
      clearButtonText: {
        color: '#f59e0b',
      },
      queueControlText: {
        color: '#f59e0b',
        fontWeight: '600',
      },
      processButtonText: {
        color: '#2563eb',
        fontWeight: '600',
      },
      pausedNotice: {
        backgroundColor: 'rgba(245, 158, 11, 0.09)',
        borderBottomColor: 'rgba(245, 158, 11, 0.38)',
      },
      compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: 'rgba(245, 158, 11, 0.27)',
      },
      compactText: {
        flex: 1,
        color: '#f59e0b',
      },
      compactAction: {
        paddingHorizontal: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.actionPaddingHorizontal,
        paddingVertical: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.actionPaddingVertical,
      },
    });
    expect(createMessageQueuePanelMobileStyleSheetSlots({
      renderState: getMessageQueuePanelMobileRenderState({
        messages: [makeMessage('panel-style-sheet-message')],
        colors: mobileMessageQueuePalette,
        canProcessNext: true,
      }),
    })).toMatchObject({
      container: {
        borderColor: 'rgba(245, 158, 11, 0.27)',
        backgroundColor: 'rgba(245, 158, 11, 0.07)',
      },
      header: {
        flexDirection: 'row',
        backgroundColor: 'rgba(245, 158, 11, 0.09)',
      },
      headerActions: {
        flexDirection: 'row',
      },
      processButtonText: {
        color: '#2563eb',
      },
      pausedNoticeText: {
        color: '#f59e0b',
      },
      compactContainer: {
        borderRadius: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.borderRadius,
      },
      compactAction: {
        paddingHorizontal: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.actionPaddingHorizontal,
      },
    });
    const compactActionCalls: string[] = [];
    const compactActionParts = createMessageQueuePanelCompactActionMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.panel,
      colors: mobileQueueSurfaceRenderState.colors.panel,
      icons: getMessageQueuePanelMobileIconState(),
      copy: getMessageQueuePanelCopyState(),
      panel: getMessageQueuePanelState([makeMessage('compact-panel-message')], {
        canProcessNext: true,
      }),
      styles: {
        compactAction: 'compactAction',
      },
      onPause: () => compactActionCalls.push('pause'),
      onResume: () => compactActionCalls.push('resume'),
      onProcessNext: () => compactActionCalls.push('sendNext'),
      onClear: () => compactActionCalls.push('clear'),
    });
    expect(compactActionParts.actions.map((action) => action.key)).toEqual(['pause', 'sendNext', 'clear']);
    expect(compactActionParts.actions[0]).toMatchObject({
      style: 'compactAction',
      activeOpacity: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.actionPressedOpacity,
      accessibilityRole: 'button',
      accessibilityLabel: 'Pause queue',
      disabled: false,
      accessibilityState: { disabled: false },
      icon: {
        name: 'pause',
        size: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.compactActionIconSize,
        color: '#f59e0b',
      },
    });
    expect(compactActionParts.actions[1]).toMatchObject({
      accessibilityLabel: 'Send next queued message',
      icon: {
        name: 'play',
        color: '#2563eb',
      },
    });
    compactActionParts.actions.forEach((action) => action.onPress());
    expect(compactActionCalls).toEqual(['pause', 'sendNext', 'clear']);
    expect(createMessageQueuePanelCompactActionMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.panel,
      colors: mobileQueueSurfaceRenderState.colors.panel,
      icons: getMessageQueuePanelMobileIconState(),
      copy: getMessageQueuePanelCopyState(),
      panel: getMessageQueuePanelState([makeMessage('paused-panel-message')], {
        isPaused: true,
      }),
      styles: {
        compactAction: 'compactAction',
      },
      onPause: () => compactActionCalls.push('pause'),
      onResume: () => compactActionCalls.push('resume'),
      onProcessNext: () => compactActionCalls.push('sendNext'),
      onClear: () => compactActionCalls.push('clear'),
    }).actions.map((action) => action.key)).toEqual(['resume', 'clear']);
    expect(createMessageQueuePanelCompactActionMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.panel,
      colors: mobileQueueSurfaceRenderState.colors.panel,
      icons: getMessageQueuePanelMobileIconState(),
      copy: getMessageQueuePanelCopyState(),
      panel: getMessageQueuePanelState([makeMessage('processing-panel-message', { status: 'processing' })]),
      styles: {
        compactAction: 'compactAction',
      },
      onPause: () => compactActionCalls.push('pause'),
      onClear: () => compactActionCalls.push('clear'),
    }).actions).toMatchObject([
      {
        key: 'pause',
        disabled: true,
        accessibilityState: { disabled: true },
        icon: {
          color: '#737373',
        },
      },
      {
        key: 'clear',
        disabled: true,
        accessibilityState: { disabled: true },
        icon: {
          color: '#737373',
        },
      },
    ]);
    const headerActionCalls: string[] = [];
    const headerActionParts = createMessageQueuePanelHeaderActionMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.panel,
      colors: mobileQueueSurfaceRenderState.colors.panel,
      copy: getMessageQueuePanelCopyState(),
      panel: getMessageQueuePanelState([makeMessage('header-panel-message')], {
        canProcessNext: true,
      }),
      styles: {
        processButton: 'processButton',
        clearButton: 'clearButton',
        queueControlText: 'queueControlText',
        queueControlTextDisabled: 'queueControlTextDisabled',
        processButtonText: 'processButtonText',
        clearButtonText: 'clearButtonText',
      },
      onPause: () => headerActionCalls.push('pause'),
      onResume: () => headerActionCalls.push('resume'),
      onProcessNext: () => headerActionCalls.push('sendNext'),
      onClear: () => headerActionCalls.push('clear'),
      onToggleListCollapsed: () => headerActionCalls.push('toggle'),
    });
    expect(headerActionParts.actions.map((action) => action.key)).toEqual([
      'pause',
      'sendNext',
      'clear',
      'toggleList',
    ]);
    expect(headerActionParts.actions[0]).toMatchObject({
      type: 'text',
      style: 'processButton',
      activeOpacity: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.actionPressedOpacity,
      accessibilityRole: 'button',
      accessibilityLabel: 'Pause queue',
      disabled: false,
      accessibilityState: { disabled: false },
      label: {
        shouldRender: true,
        style: ['queueControlText', false],
        text: 'Pause',
      },
      icon: {
        shouldRender: false,
      },
    });
    expect(headerActionParts.actions[1]).toMatchObject({
      type: 'text',
      label: {
        shouldRender: true,
        style: 'processButtonText',
        text: 'Send Next',
      },
      icon: {
        shouldRender: false,
      },
    });
    expect(headerActionParts.actions[3]).toMatchObject({
      type: 'icon',
      style: 'clearButton',
      accessibilityLabel: 'Collapse queue',
      accessibilityState: { expanded: true },
      label: {
        shouldRender: false,
      },
      icon: {
        shouldRender: true,
        name: 'chevron-up',
        size: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.headerToggleIconSize,
        color: '#737373',
      },
    });
    headerActionParts.actions.forEach((action) => action.onPress());
    expect(headerActionCalls).toEqual(['pause', 'sendNext', 'clear', 'toggle']);
    expect(createMessageQueuePanelHeaderActionMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.panel,
      colors: mobileQueueSurfaceRenderState.colors.panel,
      copy: getMessageQueuePanelCopyState(),
      panel: getMessageQueuePanelState([makeMessage('collapsed-paused-panel-message')], {
        isPaused: true,
        isListCollapsed: true,
      }),
      styles: {
        processButton: 'processButton',
        clearButton: 'clearButton',
        queueControlText: 'queueControlText',
        queueControlTextDisabled: 'queueControlTextDisabled',
        processButtonText: 'processButtonText',
        clearButtonText: 'clearButtonText',
      },
      onPause: () => headerActionCalls.push('pause'),
      onResume: () => headerActionCalls.push('resume'),
      onClear: () => headerActionCalls.push('clear'),
      onToggleListCollapsed: () => headerActionCalls.push('toggle'),
    }).actions).toMatchObject([
      {
        key: 'resume',
        type: 'text',
        label: {
          shouldRender: true,
          style: 'queueControlText',
          text: 'Resume',
        },
        icon: {
          shouldRender: false,
        },
      },
      {
        key: 'toggleList',
        type: 'icon',
        accessibilityLabel: 'Expand queue',
        accessibilityState: { expanded: false },
        label: {
          shouldRender: false,
        },
        icon: {
          shouldRender: true,
          name: 'chevron-down',
        },
      },
    ]);
    const chromeParts = createMessageQueuePanelChromeMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.panel,
      colors: mobileQueueSurfaceRenderState.colors.panel,
      copy: getMessageQueuePanelCopyState(),
      panel: getMessageQueuePanelState([makeMessage('paused-chrome-message')], {
        isPaused: true,
      }),
      styles: {
        container: 'container',
        compactContainer: 'compactContainer',
        compactText: 'compactText',
        header: 'header',
        headerCollapsed: 'headerCollapsed',
        headerLeft: 'headerLeft',
        headerActions: 'headerActions',
        headerTitle: 'headerTitle',
        pausedNotice: 'pausedNotice',
        pausedNoticeText: 'pausedNoticeText',
        list: 'list',
      },
    });
    expect(chromeParts).toMatchObject({
      container: {
        style: 'container',
      },
      compactContainer: {
        style: 'compactContainer',
      },
      compactStatusIcon: {
        name: 'pause-circle-outline',
        size: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.compactIconSize,
        color: '#f59e0b',
      },
      compactLabel: {
        style: 'compactText',
        text: '1 queued message (paused)',
      },
      headerContainer: {
        style: ['header', false],
      },
      headerLeft: {
        style: 'headerLeft',
      },
      headerActions: {
        style: 'headerActions',
      },
      headerStatusIcon: {
        name: 'pause-circle-outline',
        size: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.headerIconSize,
        color: '#f59e0b',
      },
      headerTitle: {
        style: 'headerTitle',
        text: 'Paused Messages (1)',
      },
      pausedNotice: {
        shouldRender: true,
        container: {
          style: 'pausedNotice',
        },
        message: {
          style: 'pausedNoticeText',
          text: MESSAGE_QUEUE_PANEL_PRESENTATION.pausedNotice,
        },
      },
      list: {
        shouldRender: true,
        style: 'list',
        showsVerticalScrollIndicator: true,
      },
    });
    expect(createMessageQueuePanelChromeMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.panel,
      colors: mobileQueueSurfaceRenderState.colors.panel,
      copy: getMessageQueuePanelCopyState(),
      panel: getMessageQueuePanelState([makeMessage('collapsed-chrome-message')], {
        isListCollapsed: true,
      }),
      styles: {
        container: 'container',
        compactContainer: 'compactContainer',
        compactText: 'compactText',
        header: 'header',
        headerCollapsed: 'headerCollapsed',
        headerLeft: 'headerLeft',
        headerActions: 'headerActions',
        headerTitle: 'headerTitle',
        pausedNotice: 'pausedNotice',
        pausedNoticeText: 'pausedNoticeText',
        list: 'list',
      },
    })).toMatchObject({
      headerContainer: {
        style: ['header', 'headerCollapsed'],
      },
      pausedNotice: {
        shouldRender: false,
      },
      list: {
        shouldRender: false,
      },
    });
    const listPendingMessage = makeMessage('list-pending-message');
    const listFailedMessage = makeMessage('list-failed-message', { status: 'failed' });
    const listPartCalls: string[] = [];
    const listParts = createMessageQueuePanelListMobilePropsParts({
      items: getMessageQueuePanelRenderItems([listPendingMessage, listFailedMessage]),
      styles: {
        separator: 'separator',
      },
      onRemove: (messageId) => listPartCalls.push(`remove:${messageId}`),
      onUpdate: (messageId, text) => listPartCalls.push(`update:${messageId}:${text}`),
      onRetry: (messageId) => listPartCalls.push(`retry:${messageId}`),
    });
    expect(listParts.items).toMatchObject([
      {
        key: 'list-pending-message',
        separator: {
          shouldRender: false,
        },
        messageProps: {
          message: listPendingMessage,
        },
      },
      {
        key: 'list-failed-message',
        separator: {
          shouldRender: true,
          style: 'separator',
        },
        messageProps: {
          message: listFailedMessage,
        },
      },
    ]);
    listParts.items[1].messageProps.onRemove();
    listParts.items[1].messageProps.onUpdate('updated text');
    listParts.items[1].messageProps.onRetry();
    expect(listPartCalls).toEqual([
      'remove:list-failed-message',
      'update:list-failed-message:updated text',
      'retry:list-failed-message',
    ]);
    const panelPartCalls: string[] = [];
    const panelParts = createMessageQueuePanelMobilePropsParts({
      renderState: getMessageQueuePanelMobileRenderState({
        messages: [listPendingMessage, listFailedMessage],
        colors: mobileMessageQueuePalette,
        canProcessNext: true,
      }),
      styles: {
        compactAction: 'compactAction',
        processButton: 'processButton',
        clearButton: 'clearButton',
        queueControlText: 'queueControlText',
        queueControlTextDisabled: 'queueControlTextDisabled',
        processButtonText: 'processButtonText',
        clearButtonText: 'clearButtonText',
        container: 'container',
        compactContainer: 'compactContainer',
        compactText: 'compactText',
        header: 'header',
        headerCollapsed: 'headerCollapsed',
        headerLeft: 'headerLeft',
        headerActions: 'headerActions',
        headerTitle: 'headerTitle',
        pausedNotice: 'pausedNotice',
        pausedNoticeText: 'pausedNoticeText',
        list: 'list',
        separator: 'separator',
      },
      onPause: () => panelPartCalls.push('pause'),
      onResume: () => panelPartCalls.push('resume'),
      onProcessNext: () => panelPartCalls.push('sendNext'),
      onClear: () => panelPartCalls.push('clear'),
      onToggleListCollapsed: () => panelPartCalls.push('toggle'),
      onRemove: (messageId) => panelPartCalls.push(`remove:${messageId}`),
      onUpdate: (messageId, text) => panelPartCalls.push(`update:${messageId}:${text}`),
      onRetry: (messageId) => panelPartCalls.push(`retry:${messageId}`),
    });
    expect(panelParts.compactActions.actions.map((action) => action.key)).toEqual(['pause', 'sendNext', 'clear']);
    expect(panelParts.headerActions.actions.map((action) => action.key)).toEqual([
      'pause',
      'sendNext',
      'clear',
      'toggleList',
    ]);
    expect(panelParts.chrome).toMatchObject({
      container: {
        style: 'container',
      },
      compactLabel: {
        style: 'compactText',
        text: '2 queued messages',
      },
      list: {
        shouldRender: true,
        style: 'list',
        showsVerticalScrollIndicator: true,
      },
    });
    expect(panelParts.list.items[1]).toMatchObject({
      key: 'list-failed-message',
      separator: {
        shouldRender: true,
        style: 'separator',
      },
      messageProps: {
        message: listFailedMessage,
      },
    });
    panelParts.compactActions.actions[0].onPress();
    panelParts.headerActions.actions[3].onPress();
    panelParts.list.items[1].messageProps.onRetry();
    expect(panelPartCalls).toEqual(['pause', 'toggle', 'retry:list-failed-message']);
    expect(createQueuedMessageItemMobileStyleSlots({
      surface: mobileQueueSurfaceRenderState.surface.item,
      colors: mobileQueueSurfaceRenderState.colors.item,
      presentation: {
        isFailed: true,
        isProcessing: false,
      },
      statusColor: mobileQueueSurfaceRenderState.colors.item.failedColor,
      statusMetaColor: mobileQueueSurfaceRenderState.colors.item.failedMetaColor,
    })).toEqual({
      container: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(220, 38, 38, 0.08)',
      },
      row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
      },
      content: {
        flex: 1,
        minWidth: 0,
      },
      messageText: {
        fontSize: 14,
        color: '#dc2626',
      },
      errorText: {
        fontSize: 12,
        color: 'rgba(220, 38, 38, 0.8)',
        marginTop: 4,
      },
      metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
      },
      metaText: {
        fontSize: 12,
        color: 'rgba(220, 38, 38, 0.7)',
      },
      expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      expandText: {
        fontSize: 12,
        color: '#737373',
        marginLeft: 2,
      },
    });
    expect(createQueuedMessageStatusIndicatorMobilePropsPart({
      surface: mobileQueueSurfaceRenderState.surface.item,
      colors: mobileQueueSurfaceRenderState.colors.item,
      icons: getMessageQueuePanelMobileIconState(),
      presentation: {
        isFailed: true,
        isProcessing: false,
      },
    })).toEqual({
      type: 'failed',
      icon: {
        name: 'alert-circle',
        size: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.stateIconSize,
        color: '#dc2626',
      },
    });
    expect(createQueuedMessageStatusIndicatorMobilePropsPart({
      surface: mobileQueueSurfaceRenderState.surface.item,
      colors: mobileQueueSurfaceRenderState.colors.item,
      icons: getMessageQueuePanelMobileIconState(),
      presentation: {
        isFailed: false,
        isProcessing: true,
      },
    })).toEqual({
      type: 'processing',
      activityIndicator: {
        size: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.processingIndicatorSize,
        color: '#2563eb',
      },
    });
    expect(createQueuedMessageStatusIndicatorMobilePropsPart({
      surface: mobileQueueSurfaceRenderState.surface.item,
      colors: mobileQueueSurfaceRenderState.colors.item,
      icons: getMessageQueuePanelMobileIconState(),
      presentation: {
        isFailed: false,
        isProcessing: false,
      },
    })).toBeNull();
    expect(createQueuedMessageItemChromeMobilePropsParts({
      statusIndicatorPart: {
        type: 'failed',
        icon: {
          name: 'alert-circle',
          size: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.stateIconSize,
          color: '#dc2626',
        },
      },
      actionParts: {
        shouldRender: true,
      },
      styles: {
        container: 'container',
        row: 'row',
        actions: 'actions',
      },
    })).toEqual({
      container: {
        style: 'container',
      },
      row: {
        style: 'row',
      },
      failedStatusIcon: {
        shouldRender: true,
        name: 'alert-circle',
        size: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.stateIconSize,
        color: '#dc2626',
      },
      processingStatusIndicator: {
        shouldRender: false,
      },
      actions: {
        shouldRender: true,
        style: 'actions',
      },
    });
    expect(createQueuedMessageItemChromeMobilePropsParts({
      statusIndicatorPart: {
        type: 'processing',
        activityIndicator: {
          size: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.processingIndicatorSize,
          color: '#2563eb',
        },
      },
      actionParts: {
        shouldRender: false,
      },
      styles: {
        container: 'container',
        row: 'row',
        actions: 'actions',
      },
    })).toMatchObject({
      failedStatusIcon: {
        shouldRender: false,
      },
      processingStatusIndicator: {
        shouldRender: true,
        size: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.processingIndicatorSize,
        color: '#2563eb',
      },
      actions: {
        shouldRender: false,
      },
    });
    expect(createQueuedMessageContentMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.item,
      message: makeMessage('failed', {
        status: 'failed',
        errorMessage: 'timeout',
      }),
      presentation: getQueuedMessageItemPresentation(makeMessage('failed', {
        status: 'failed',
        errorMessage: 'timeout',
      }), false),
      isExpanded: false,
      styles: {
        content: 'content',
        messageText: 'messageText',
        errorText: 'errorText',
        metaRow: 'metaRow',
        metaText: 'metaText',
      },
    })).toEqual({
      container: {
        style: 'content',
      },
      messageText: {
        style: 'messageText',
        numberOfLines: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.message.collapsedNumberOfLines,
        text: 'failed',
      },
      errorText: {
        shouldRender: true,
        style: 'errorText',
        text: 'Error: timeout',
      },
      metaRow: {
        style: 'metaRow',
      },
      metaText: {
        style: 'metaText',
        text: formatQueuedMessageMetaLabel(1000, 'Failed'),
      },
    });
    expect(createQueuedMessageContentMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.item,
      message: makeMessage('expanded'),
      presentation: getQueuedMessageItemPresentation(makeMessage('expanded'), true),
      isExpanded: true,
      styles: {
        content: 'content',
        messageText: 'messageText',
        errorText: 'errorText',
        metaRow: 'metaRow',
        metaText: 'metaText',
      },
    })).toMatchObject({
      messageText: {
        numberOfLines: undefined,
      },
      errorText: {
        shouldRender: false,
      },
    });
    const expandCalls: string[] = [];
    const expandButtonParts = createQueuedMessageExpandButtonMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.item,
      colors: mobileQueueSurfaceRenderState.colors.item,
      icons: getMessageQueuePanelMobileIconState(),
      presentation: getQueuedMessageItemPresentation(makeMessage('long', {
        text: 'x'.repeat(MESSAGE_QUEUE_PANEL_PRESENTATION.longMessagePreviewCharacterLimit + 1),
      }), false),
      isExpanded: false,
      styles: {
        expandButton: 'expandButton',
        expandText: 'expandText',
      },
      onToggleExpanded: () => expandCalls.push('toggle'),
    });
    expect(expandButtonParts).toMatchObject({
      shouldRender: true,
      pressable: {
        style: 'expandButton',
        activeOpacity: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.expandButtonPressedOpacity,
        accessibilityRole: 'button',
        accessibilityLabel: 'Expand queued message',
      },
      icon: {
        name: 'chevron-down',
        size: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.expandIconSize,
        color: '#737373',
      },
      label: {
        style: 'expandText',
        text: 'More',
      },
    });
    if (!expandButtonParts.shouldRender) {
      throw new Error('Expected long queued message expand button');
    }
    expandButtonParts.pressable.onPress();
    expect(expandCalls).toEqual(['toggle']);
    expect(createQueuedMessageExpandButtonMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.item,
      colors: mobileQueueSurfaceRenderState.colors.item,
      icons: getMessageQueuePanelMobileIconState(),
      presentation: getQueuedMessageItemPresentation(makeMessage('short'), false),
      isExpanded: false,
      styles: {
        expandButton: 'expandButton',
        expandText: 'expandText',
      },
      onToggleExpanded: () => expandCalls.push('short'),
    })).toEqual({
      shouldRender: false,
    });
    expect(createQueuedMessageActionButtonMobileStyleSlots({
      surface: mobileQueueSurfaceRenderState.surface.actions,
      colors: mobileQueueSurfaceRenderState.colors.actions,
    })).toEqual({
      button: {
        alignSelf: 'flex-start',
        minHeight: 28,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#d4d4d4',
        backgroundColor: '#ffffff',
        justifyContent: 'center',
      },
      retryText: {
        color: '#2563eb',
        fontSize: 12,
        fontWeight: '500',
      },
      editText: {
        color: '#171717',
        fontSize: 12,
        fontWeight: '500',
      },
      removeText: {
        color: '#dc2626',
        fontSize: 12,
        fontWeight: '500',
      },
    });
    const actionPartCalls: string[] = [];
    const actionParts = createQueuedMessageActionButtonMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.actions,
      colors: mobileQueueSurfaceRenderState.colors.actions,
      icons: getMessageQueuePanelMobileIconState(),
      copy: getMessageQueuePanelCopyState(),
      presentation: getQueuedMessageItemPresentation(makeMessage('failed', { status: 'failed' }), false),
      styles: {
        actionButton: 'actionButton',
        retryActionText: 'retryActionText',
        editActionText: 'editActionText',
        removeActionText: 'removeActionText',
      },
      onRetry: () => actionPartCalls.push('retry'),
      onEdit: () => actionPartCalls.push('edit'),
      onRemove: () => actionPartCalls.push('remove'),
    });
    expect(actionParts.shouldRender).toBe(true);
    expect(actionParts.actions.map((action) => action.key)).toEqual(['retry', 'edit', 'remove']);
    expect(actionParts.actions[0]).toMatchObject({
      style: 'actionButton',
      activeOpacity: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.buttonPressedOpacity,
      accessibilityRole: 'button',
      accessibilityLabel: 'Retry queued message',
      hitSlop: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.hitSlop,
      icon: {
        name: 'refresh',
        size: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.actionIconSize,
        color: '#2563eb',
      },
      label: {
        style: 'retryActionText',
        text: 'Retry',
      },
    });
    actionParts.actions.forEach((action) => action.onPress());
    expect(actionPartCalls).toEqual(['retry', 'edit', 'remove']);
    expect(createQueuedMessageActionButtonMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.actions,
      colors: mobileQueueSurfaceRenderState.colors.actions,
      icons: getMessageQueuePanelMobileIconState(),
      copy: getMessageQueuePanelCopyState(),
      presentation: getQueuedMessageItemPresentation(makeMessage('processing', { status: 'processing' }), false),
      styles: {
        actionButton: 'actionButton',
        retryActionText: 'retryActionText',
        editActionText: 'editActionText',
        removeActionText: 'removeActionText',
      },
      onRetry: () => actionPartCalls.push('retry'),
      onEdit: () => actionPartCalls.push('edit'),
      onRemove: () => actionPartCalls.push('remove'),
    })).toMatchObject({
      shouldRender: false,
      actions: [],
    });
    expect(createQueuedMessageActionRowMobileStyleSlot({
      surface: mobileQueueSurfaceRenderState.surface.actions,
    })).toEqual({
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    });
    const editStyleSlots = createQueuedMessageEditMobileStyleSlots({
      surface: mobileQueueSurfaceRenderState.surface.edit,
      colors: mobileQueueSurfaceRenderState.colors.edit,
    });
    expect(editStyleSlots).toEqual({
      container: {
        gap: 8,
      },
      input: {
        minHeight: 60,
        padding: 8,
        fontSize: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d4d4d4',
        backgroundColor: '#ffffff',
        color: '#171717',
        textAlignVertical: 'top',
      },
      actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
      },
      button: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
      },
      cancelButton: {
        backgroundColor: 'transparent',
      },
      saveButton: {
        backgroundColor: '#2563eb',
      },
      buttonText: {
        fontSize: 12,
        color: '#171717',
      },
      saveButtonText: {
        fontSize: 12,
        color: '#ffffff',
      },
    });
    expect(createQueuedMessageItemMobileStyleSheetSlots({
      renderState: getQueuedMessageItemMobileRenderState({
        message: makeMessage('style-sheet-message', { status: 'failed' }),
        isExpanded: false,
        colors: mobileMessageQueuePalette,
      }),
    })).toMatchObject({
      container: {
        paddingHorizontal: 12,
        backgroundColor: 'rgba(220, 38, 38, 0.08)',
      },
      row: {
        flexDirection: 'row',
        gap: 8,
      },
      messageText: {
        color: '#dc2626',
      },
      actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
      },
      actionButton: {
        minHeight: 28,
        borderColor: '#d4d4d4',
      },
      retryActionText: {
        color: '#2563eb',
      },
      removeActionText: {
        color: '#dc2626',
      },
      editInput: {
        minHeight: 60,
        textAlignVertical: 'top',
      },
      saveButtonText: {
        color: '#ffffff',
      },
    });
    const editPartCalls: string[] = [];
    const editParts = createQueuedMessageEditMobilePropsParts({
      surface: mobileQueueSurfaceRenderState.surface.edit,
      copy: getMessageQueuePanelCopyState(),
      editDraftState: getQueuedMessageEditDraftState('Updated text', 'Original text'),
      styles: {
        editContainer: 'editContainer',
        editInput: 'editInput',
        editActions: 'editActions',
        editButton: 'editButton',
        cancelButton: 'cancelButton',
        saveButton: 'saveButton',
        buttonText: 'buttonText',
        saveButtonText: 'saveButtonText',
      },
      onCancel: () => editPartCalls.push('cancel'),
      onSave: () => editPartCalls.push('save'),
    });
    expect(editParts).toMatchObject({
      container: {
        style: 'editContainer',
      },
      input: {
        style: 'editInput',
        accessibilityLabel: 'Queued message edit input',
        multiline: true,
        autoFocus: true,
      },
      actions: {
        style: 'editActions',
      },
      cancelButton: {
        style: ['editButton', 'cancelButton'],
        activeOpacity: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.buttonPressedOpacity,
        accessibilityRole: 'button',
        accessibilityLabel: 'Cancel queued message edit',
        text: {
          style: 'buttonText',
          value: 'Cancel',
        },
      },
      saveButton: {
        style: ['editButton', 'saveButton'],
        disabled: false,
        activeOpacity: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.buttonPressedOpacity,
        accessibilityRole: 'button',
        accessibilityLabel: 'Save queued message edit',
        accessibilityState: { disabled: false },
        text: {
          style: 'saveButtonText',
          value: 'Save',
        },
      },
    });
    editParts.cancelButton.onPress();
    editParts.saveButton.onPress();
    expect(editPartCalls).toEqual(['cancel', 'save']);
    const bundledPartCalls: string[] = [];
    const bundledMessage = makeMessage('bundled-message', {
      status: 'failed',
      errorMessage: 'offline',
      text: 'x'.repeat(MESSAGE_QUEUE_PANEL_PRESENTATION.longMessagePreviewCharacterLimit + 1),
    });
    const bundledParts = createQueuedMessageItemMobilePropsParts({
      renderState: getQueuedMessageItemMobileRenderState({
        message: bundledMessage,
        isExpanded: false,
        colors: mobileMessageQueuePalette,
      }),
      message: bundledMessage,
      editDraftState: getQueuedMessageEditDraftState('Bundled update', bundledMessage.text),
      isExpanded: false,
      styles: {
        container: 'container',
        row: 'row',
        content: 'content',
        messageText: 'messageText',
        errorText: 'errorText',
        metaRow: 'metaRow',
        metaText: 'metaText',
        expandButton: 'expandButton',
        expandText: 'expandText',
        actions: 'actions',
        actionButton: 'actionButton',
        retryActionText: 'retryActionText',
        editActionText: 'editActionText',
        removeActionText: 'removeActionText',
        editContainer: 'editContainer',
        editInput: 'editInput',
        editActions: 'editActions',
        editButton: 'editButton',
        cancelButton: 'cancelButton',
        saveButton: 'saveButton',
        buttonText: 'buttonText',
        saveButtonText: 'saveButtonText',
      },
      onRetry: () => bundledPartCalls.push('retry'),
      onEdit: () => bundledPartCalls.push('edit'),
      onRemove: () => bundledPartCalls.push('remove'),
      onToggleExpanded: () => bundledPartCalls.push('expand'),
      onCancelEdit: () => bundledPartCalls.push('cancel'),
      onSaveEdit: () => bundledPartCalls.push('save'),
    });
    expect(bundledParts.chrome).toMatchObject({
      container: {
        style: 'container',
      },
      row: {
        style: 'row',
      },
      actions: {
        shouldRender: true,
        style: 'actions',
      },
      failedStatusIcon: {
        shouldRender: true,
        name: 'alert-circle',
        color: '#dc2626',
      },
      processingStatusIndicator: {
        shouldRender: false,
      },
    });
    expect(bundledParts.content).toMatchObject({
      container: {
        style: 'content',
      },
      messageText: {
        style: 'messageText',
        numberOfLines: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.message.collapsedNumberOfLines,
      },
      errorText: {
        shouldRender: true,
        style: 'errorText',
        text: 'Error: offline',
      },
    });
    expect(bundledParts.expandButton).toMatchObject({
      shouldRender: true,
      pressable: {
        style: 'expandButton',
        accessibilityLabel: 'Expand queued message',
      },
      icon: {
        name: 'chevron-down',
      },
      label: {
        style: 'expandText',
        text: 'More',
      },
    });
    expect(bundledParts.actions.actions.map((action) => action.key)).toEqual(['retry', 'edit', 'remove']);
    expect(bundledParts.edit).toMatchObject({
      input: {
        style: 'editInput',
        accessibilityLabel: 'Queued message edit input',
      },
      saveButton: {
        disabled: false,
        accessibilityState: { disabled: false },
      },
    });
    bundledParts.actions.actions.forEach((action) => action.onPress());
    if (!bundledParts.expandButton.shouldRender) {
      throw new Error('Expected bundled queued message expand button');
    }
    bundledParts.expandButton.pressable.onPress();
    bundledParts.edit.cancelButton.onPress();
    bundledParts.edit.saveButton.onPress();
    expect(bundledPartCalls).toEqual(['retry', 'edit', 'remove', 'expand', 'cancel', 'save']);
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop.item.containerBaseClassName).toContain('transition-colors');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop.item.messageCollapsedClassName).toBe('line-clamp-2');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop.compact.containerBaseClassName).toContain('flex flex-wrap');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop.compact.queuedContainerClassName).toContain('border-amber-200');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop.panel.containerBaseClassName).toBe('rounded-md border overflow-hidden');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop.panel.headerBaseClassName).toContain('justify-between');
    expect(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop.panel.listClassName).toBe('divide-y max-h-60 overflow-y-auto');
    expect(formatMessageQueuePanelTitle(2)).toBe('Queued Messages (2)');
    expect(formatMessageQueuePanelTitle(1, true)).toBe('Paused Messages (1)');
    expect(formatMessageQueueCompactLabel(1)).toBe('1 queued message');
    expect(formatMessageQueueCompactLabel(2, true)).toBe('2 queued messages (paused)');
    expect(formatQueuedMessageTimestamp(0)).toMatch(/\d{1,2}:\d{2}/);
    expect(formatQueuedMessageMetaLabel(0, 'Queued')).toBe(`${formatQueuedMessageTimestamp(0)} • Queued`);
    expect(formatQueuedMessageError('timeout')).toBe('Error: timeout');
    expect(getQueuedMessageExpansionLabel(false)).toBe('More');
    expect(getQueuedMessageExpansionLabel(true)).toBe('Less');
    expect(getMessageQueueListToggleLabel(true)).toBe('Expand queue');
    expect(getMessageQueueListToggleLabel(false)).toBe('Collapse queue');

    const pendingMessage = makeMessage('msg-1');
    const failedMessage = makeMessage('msg-2', { status: 'failed' });
    expect(getMessageQueuePanelRenderItems([pendingMessage, failedMessage])).toEqual([
      {
        key: 'msg-1',
        message: pendingMessage,
        index: 0,
        shouldRenderSeparator: false,
      },
      {
        key: 'msg-2',
        message: failedMessage,
        index: 1,
        shouldRenderSeparator: true,
      },
    ]);
    expect(getMessageQueuePanelState([pendingMessage, failedMessage], {
      isPaused: true,
      isListCollapsed: true,
      canProcessNext: true,
    })).toMatchObject({
      messageCount: 2,
      isPaused: true,
      isListCollapsed: true,
      isExpanded: false,
      statusKey: 'paused',
      statusIconName: 'pause-circle-outline',
      compactLabel: '2 queued messages (paused)',
      title: 'Paused Messages (2)',
      listToggleLabel: 'Expand queue',
      listToggleAccessibilityState: { expanded: false },
      toggleIconName: 'chevron-down',
      hasProcessingMessage: false,
      canClear: true,
      canPause: true,
      clearActionState: { isDisabled: false, accessibilityState: { disabled: false } },
      pauseActionState: { isDisabled: false, accessibilityState: { disabled: false } },
      clearActionAccessibilityState: { disabled: false },
      pauseActionAccessibilityState: { disabled: false },
      canProcessNext: true,
      shouldShowCompactProcessNext: false,
      shouldShowProcessNext: false,
      shouldRenderClear: false,
      shouldRenderPausedNotice: false,
      shouldRenderList: false,
    });
    expect(getMessageQueuePanelState([
      makeMessage('msg-3', { status: 'processing' }),
    ], {
      canProcessNext: true,
    })).toMatchObject({
      messageCount: 1,
      isPaused: false,
      isExpanded: true,
      statusKey: 'queued',
      statusIconName: 'time-outline',
      compactLabel: '1 queued message',
      title: 'Queued Messages (1)',
      listToggleLabel: 'Collapse queue',
      listToggleAccessibilityState: { expanded: true },
      toggleIconName: 'chevron-up',
      hasProcessingMessage: true,
      canClear: false,
      canPause: false,
      clearActionState: { isDisabled: true, accessibilityState: { disabled: true } },
      pauseActionState: { isDisabled: true, accessibilityState: { disabled: true } },
      clearActionAccessibilityState: { disabled: true },
      pauseActionAccessibilityState: { disabled: true },
      canProcessNext: true,
      shouldShowCompactProcessNext: true,
      shouldShowProcessNext: true,
      shouldRenderClear: true,
      shouldRenderPausedNotice: false,
      shouldRenderList: true,
    });
    expect(getMessageQueuePanelMobileRenderState({
      messages: [pendingMessage, failedMessage],
      colors: mobileMessageQueuePalette,
      isPaused: true,
      isListCollapsed: true,
      canProcessNext: true,
    })).toMatchObject({
      shouldRender: true,
      panel: {
        messageCount: 2,
        isPaused: true,
        statusKey: 'paused',
        title: 'Paused Messages (2)',
        toggleIconName: 'chevron-down',
      },
      surface: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile,
      colors: {
        item: {
          failedColor: '#dc2626',
          messageColor: '#171717',
        },
        panel: {
          titleColor: '#171717',
          status: {
            paused: {
              borderColor: 'rgba(245, 158, 11, 0.44)',
            },
          },
        },
      },
      icons: MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon,
      copy: MESSAGE_QUEUE_PANEL_PRESENTATION,
    });
    expect(getMessageQueuePanelMobileRenderState({
      messages: [],
      colors: mobileMessageQueuePalette,
    }).shouldRender).toBe(false);

    const longFailedMessage = makeMessage('msg-1', {
      status: 'failed',
      text: 'x'.repeat(101),
      errorMessage: 'timeout',
    });
    expect(getQueuedMessageItemPresentation(longFailedMessage, false)).toMatchObject({
      isLongMessage: true,
      isFailed: true,
      isProcessing: false,
      canMutateMessage: true,
      canEditMessage: true,
      statusLabel: 'Failed',
      expansionLabel: 'More',
      expansionAccessibilityLabel: 'Expand queued message',
      errorText: 'Error: timeout',
    });
    expect(getQueuedMessageItemDesktopRenderState({
      message: longFailedMessage,
      isExpanded: false,
    })).toMatchObject({
      presentation: {
        isLongMessage: true,
        isFailed: true,
        statusLabel: 'Failed',
        errorText: 'Error: timeout',
      },
      surface: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop.item,
      copy: MESSAGE_QUEUE_PANEL_PRESENTATION,
    });
    expect(getQueuedMessageItemMobileRenderState({
      message: longFailedMessage,
      isExpanded: false,
      colors: mobileMessageQueuePalette,
    })).toMatchObject({
      presentation: {
        isLongMessage: true,
        isFailed: true,
        statusLabel: 'Failed',
        errorText: 'Error: timeout',
      },
      surface: {
        item: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item,
        actions: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions,
        edit: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit,
      },
      colors: {
        item: {
          failedColor: '#dc2626',
          failedMetaColor: 'rgba(220, 38, 38, 0.7)',
        },
        actions: {
          retryTextColor: '#2563eb',
          removeTextColor: '#dc2626',
        },
      },
      icons: MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon,
      copy: MESSAGE_QUEUE_PANEL_PRESENTATION,
      statusColor: '#dc2626',
      statusMetaColor: 'rgba(220, 38, 38, 0.7)',
    });
  });

  it('updates failed message text by resetting it to pending', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1', {
      status: 'failed',
      errorMessage: 'No session available',
    })).queues;

    const updated = updateQueuedMessageText(queues, 'conversation-1', 'msg-1', 'retry text');
    queues = updated.queues;

    expect(updated).toMatchObject({ ok: true, resetFailedToPending: true });
    expect(getQueuedMessages(queues, 'conversation-1')[0]).toMatchObject({
      id: 'msg-1',
      status: 'pending',
      text: 'retry text',
    });
    expect(getQueuedMessages(queues, 'conversation-1')[0].errorMessage).toBeUndefined();
  });

  it('blocks text edits after a message has been added to history', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1')).queues;
    queues = markQueuedMessageAddedToHistory(queues, 'conversation-1', 'msg-1').queues;

    expect(updateQueuedMessageText(queues, 'conversation-1', 'msg-1', 'changed')).toMatchObject({
      ok: false,
      reason: 'added_to_history',
    });
  });

  it('moves status through processing, failed, reset, and processed states', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1')).queues;
    queues = markQueuedMessageProcessing(queues, 'conversation-1', 'msg-1').queues;
    expect(peekNextQueuedMessage(queues, 'conversation-1')).toBeNull();

    queues = markQueuedMessageFailed(queues, 'conversation-1', 'msg-1', 'timeout').queues;
    expect(getQueuedMessages(queues, 'conversation-1')[0]).toMatchObject({
      status: 'failed',
      errorMessage: 'timeout',
    });

    queues = resetQueuedMessageToPending(queues, 'conversation-1', 'msg-1').queues;
    expect(peekNextQueuedMessage(queues, 'conversation-1')?.id).toBe('msg-1');

    queues = markQueuedMessageProcessed(queues, 'conversation-1', 'msg-1').queues;
    expect(getQueuedMessages(queues, 'conversation-1')).toEqual([]);
  });

  it('reorders known ids first and appends omitted messages in existing order', () => {
    let queues: MessageQueueMap = new Map();
    queues = enqueueQueuedMessage(queues, makeMessage('msg-1')).queues;
    queues = enqueueQueuedMessage(queues, makeMessage('msg-2')).queues;
    queues = enqueueQueuedMessage(queues, makeMessage('msg-3')).queues;

    queues = reorderQueuedMessages(queues, 'conversation-1', ['msg-3', 'missing', 'msg-1']).queues;
    expect(getQueuedMessages(queues, 'conversation-1').map((message) => message.id)).toEqual([
      'msg-3',
      'msg-1',
      'msg-2',
    ]);
  });
});
