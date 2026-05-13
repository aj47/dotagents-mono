import { describe, expect, it } from 'vitest';

import {
  MESSAGE_QUEUE_PANEL_PRESENTATION,
  MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION,
  buildQueuedMessage,
  buildOperatorMessageQueuesResponse,
  clearOperatorMessageQueueSummary,
  clearQueuedMessages,
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
  getMessageQueuePanelDesktopSurfaceState,
  getMessageQueuePanelMobileIconState,
  getMessageQueuePanelMobileRenderState,
  getMessageQueuePanelMobileSurfaceColors,
  getMessageQueuePanelMobileSurfaceRenderState,
  getMessageQueuePanelMobileSurfaceState,
  getMessageQueuePanelMobileWrapperRenderState,
  getMessageQueuePanelRenderItems,
  getMessageQueuePanelState,
  getOperatorMessageQueueTotalMessageCount,
  getQueuedMessageItemPresentation,
  getQueuedMessageItemMobileRenderState,
  getQueuedMessages,
  getQueuedMessageStatusLabel,
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
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.actions.retryAccessibilityLabel).toBe('Retry queued message');
    expect(MESSAGE_QUEUE_PANEL_PRESENTATION.actions.sendNextLabel).toBe('Send Next');
    expect(getMessageQueuePanelCopyState()).toBe(MESSAGE_QUEUE_PANEL_PRESENTATION);
    expect(getMessageQueuePanelMobileSurfaceState()).toBe(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile);
    expect(getMessageQueuePanelMobileWrapperRenderState()).toEqual({
      wrapper: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.wrapper,
    });
    expect(getMessageQueuePanelDesktopSurfaceState()).toBe(MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop);
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
      toggleIconName: 'chevron-down',
      hasProcessingMessage: false,
      canClear: true,
      canPause: true,
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
      toggleIconName: 'chevron-up',
      hasProcessingMessage: true,
      canClear: false,
      canPause: false,
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
      errorText: 'Error: timeout',
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
