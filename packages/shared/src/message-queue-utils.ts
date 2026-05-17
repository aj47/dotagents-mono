import type { MessageQueue, QueuedMessage } from './types';
import type {
  OperatorMessageQueueSummary,
  OperatorMessageQueuesResponse,
} from './api-types';
import { hexToRgba } from './colors';

export type { MessageQueue, QueuedMessage } from './types';

export type MessageQueueMap = Map<string, QueuedMessage[]>;

export interface MessageQueueMutationResult {
  ok: boolean;
  queues: MessageQueueMap;
  message?: QueuedMessage;
  index?: number;
  reason?: 'not_found' | 'processing' | 'added_to_history' | 'not_failed';
  resetFailedToPending?: boolean;
}

export interface BuildQueuedMessageParams {
  id: string;
  conversationId: string;
  text: string;
  createdAt?: number;
  sessionId?: string;
  launchState?: QueuedMessage['launchState'];
}

export function buildQueuedMessage(params: BuildQueuedMessageParams): QueuedMessage {
  return {
    id: params.id,
    conversationId: params.conversationId,
    sessionId: params.sessionId,
    ...(params.launchState ? { launchState: params.launchState } : {}),
    text: params.text,
    createdAt: params.createdAt ?? Date.now(),
    status: 'pending',
  };
}

export function getQueuedMessages(queues: MessageQueueMap, conversationId: string): QueuedMessage[] {
  return [...(queues.get(conversationId) ?? [])];
}

export function getAllMessageQueues(queues: MessageQueueMap): MessageQueue[] {
  const result: MessageQueue[] = [];
  queues.forEach((messages, conversationId) => {
    if (messages.length > 0) {
      result.push({ conversationId, messages: [...messages] });
    }
  });
  return result;
}

export function buildOperatorMessageQueuesResponse(
  queues: Array<MessageQueue & { isPaused?: boolean }>,
): OperatorMessageQueuesResponse {
  const responseQueues: OperatorMessageQueueSummary[] = queues.map((queue) => ({
    conversationId: queue.conversationId,
    isPaused: queue.isPaused ?? false,
    messageCount: queue.messages.length,
    messages: [...queue.messages],
  }));

  return {
    count: responseQueues.length,
    totalMessages: responseQueues.reduce((sum, queue) => sum + queue.messageCount, 0),
    queues: responseQueues,
  };
}

export function getOperatorMessageQueueTotalMessageCount(
  queues: readonly Pick<OperatorMessageQueueSummary, 'messageCount'>[],
): number {
  return queues.reduce((sum, queue) => sum + queue.messageCount, 0);
}

export function hasQueuedMessages(queues: MessageQueueMap, conversationId: string): boolean {
  return (queues.get(conversationId)?.length ?? 0) > 0;
}

export function isQueuedMessagePending(message: Pick<QueuedMessage, 'status'>): boolean {
  return message.status === 'pending';
}

export function isQueuedMessageProcessing(message: Pick<QueuedMessage, 'status'>): boolean {
  return message.status === 'processing';
}

export function isQueuedMessageFailed(message: Pick<QueuedMessage, 'status'>): boolean {
  return message.status === 'failed';
}

export function isQueuedMessageCancelled(message: Pick<QueuedMessage, 'status'>): boolean {
  return message.status === 'cancelled';
}

export function canMutateQueuedMessage(message: Pick<QueuedMessage, 'status'>): boolean {
  return !isQueuedMessageProcessing(message);
}

export function canEditQueuedMessage(message: Pick<QueuedMessage, 'status' | 'addedToHistory'>): boolean {
  return canMutateQueuedMessage(message) && !message.addedToHistory;
}

export function hasProcessingQueuedMessage(messages: readonly Pick<QueuedMessage, 'status'>[]): boolean {
  return messages.some(isQueuedMessageProcessing);
}

export function getQueuedMessageStatusLabel(message: Pick<QueuedMessage, 'status'>): string {
  if (isQueuedMessageFailed(message)) return 'Failed';
  if (isQueuedMessageProcessing(message)) return 'Processing...';
  if (isQueuedMessageCancelled(message)) return 'Cancelled';
  return 'Queued';
}

export function formatQueuedMessageSummary(message: Pick<QueuedMessage, 'status' | 'text'>): string {
  return `${getQueuedMessageStatusLabel(message)}: ${message.text}`;
}

export const MESSAGE_QUEUE_PANEL_PRESENTATION = {
  longMessagePreviewCharacterLimit: 100,
  errorPrefix: 'Error',
  pausedNotice: 'Paused. Resume to continue.',
  meta: {
    separator: ' • ',
  },
  mobileIcon: {
    failedName: 'alert-circle',
    expandMessageName: 'chevron-down',
    collapseMessageName: 'chevron-up',
    expandQueueName: 'chevron-down',
    collapseQueueName: 'chevron-up',
    resumeName: 'play',
    pauseName: 'pause',
    sendNextName: 'play',
    clearName: 'trash-outline',
    retryName: 'refresh',
    editName: 'create-outline',
    removeName: 'trash-outline',
  },
  actions: {
    cancelLabel: 'Cancel',
    cancelAccessibilityLabel: 'Cancel queued message edit',
    saveLabel: 'Save',
    saveAccessibilityLabel: 'Save queued message edit',
    editInputAccessibilityLabel: 'Queued message edit input',
    retryLabel: 'Retry',
    retryAccessibilityLabel: 'Retry queued message',
    retryPendingAccessibilityLabel: 'Retrying queued message',
    editLabel: 'Edit',
    editAccessibilityLabel: 'Edit queued message',
    removeLabel: 'Remove',
    removeAccessibilityLabel: 'Remove queued message',
    removeFromQueueTitle: 'Remove from queue',
    clearAllLabel: 'Clear All',
    clearQueueTitle: 'Clear queue',
    clearWhileProcessingTitle: 'Cannot clear while processing',
    pauseLabel: 'Pause',
    pauseTitle: 'Pause queue',
    resumeLabel: 'Resume',
    resumeTitle: 'Resume queue execution',
    sendNextLabel: 'Send Next',
    sendNextAccessibilityLabel: 'Send next queued message',
  },
  expansion: {
    moreLabel: 'More',
    lessLabel: 'Less',
    expandMessageAccessibilityLabel: 'Expand queued message',
    collapseMessageAccessibilityLabel: 'Collapse queued message',
    expandQueueLabel: 'Expand queue',
    collapseQueueLabel: 'Collapse queue',
  },
} as const;

export const MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION = {
  mobile: {
    wrapper: {
      paddingHorizontal: 'md',
      paddingTop: 'sm',
    },
    item: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      transparentBackgroundColor: 'transparent',
      failedColorToken: 'destructive',
      processingColorToken: 'primary',
      messageColorToken: 'foreground',
      metaColorToken: 'mutedForeground',
      stateBackgroundAlpha: 0.08,
      rowFlexDirection: 'row',
      rowAlignItems: 'flex-start',
      rowGap: 8,
      contentFlex: 1,
      contentMinWidth: 0,
      stateIconSize: 16,
      processingIndicatorSize: 'small',
      message: {
        fontSize: 14,
        collapsedNumberOfLines: 2,
      },
      errorFontSize: 12,
      errorColorToken: 'destructive',
      errorTextAlpha: 0.8,
      errorMarginTop: 4,
      metaFlexDirection: 'row',
      metaAlignItems: 'center',
      metaFlexWrap: 'wrap',
      metaGap: 8,
      metaMarginTop: 4,
      metaFontSize: 12,
      metaTextAlpha: 0.7,
      expandButtonFlexDirection: 'row',
      expandButtonAlignItems: 'center',
      expandButtonAccessibilityRole: 'button',
      expandButtonPressedOpacity: 0.78,
      expandIconSize: 12,
      expandTextFontSize: 12,
      expandTextMarginLeft: 2,
      expandTextColorToken: 'mutedForeground',
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
      buttonAlignSelf: 'flex-start',
      buttonMinHeight: 28,
      buttonFlexDirection: 'row',
      buttonAlignItems: 'center',
      buttonPaddingHorizontal: 8,
      buttonPaddingVertical: 4,
      buttonGap: 4,
      buttonBorderRadius: 999,
      buttonBorderWidth: 1,
      buttonBorderColorToken: 'border',
      buttonBackgroundColorToken: 'background',
      buttonJustifyContent: 'center',
      buttonAccessibilityRole: 'button',
      buttonPressedOpacity: 0.78,
      actionIconSize: 13,
      retryTextColorToken: 'primary',
      editTextColorToken: 'foreground',
      removeTextColorToken: 'destructive',
      textFontSize: 12,
      textFontWeight: '500',
      hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
    },
    edit: {
      containerGap: 8,
      inputMinHeight: 60,
      inputPadding: 8,
      inputFontSize: 14,
      inputBorderRadius: 8,
      inputBorderWidth: 1,
      inputBorderColorToken: 'border',
      inputBackgroundColorToken: 'background',
      inputTextColorToken: 'foreground',
      inputTextAlignVertical: 'top',
      actionsFlexDirection: 'row',
      actionsJustifyContent: 'flex-end',
      actionsGap: 8,
      buttonPaddingHorizontal: 12,
      buttonPaddingVertical: 6,
      buttonBorderRadius: 6,
      buttonAccessibilityRole: 'button',
      buttonPressedOpacity: 0.78,
      buttonTextFontSize: 12,
      cancelButtonBackgroundColor: 'transparent',
      saveButtonBackgroundColorToken: 'primary',
      buttonTextColorToken: 'foreground',
      saveButtonTextColorToken: 'primaryForeground',
    },
    panel: {
      borderRadius: 8,
      borderWidth: 1,
      overflow: 'hidden',
      backgroundAlpha: 0.19,
      borderAlpha: 0.38,
      headerFlexDirection: 'row',
      headerAlignItems: 'center',
      headerJustifyContent: 'space-between',
      headerPaddingHorizontal: 12,
      headerPaddingVertical: 8,
      headerBorderBottomWidth: 1,
      headerCollapsedBorderBottomWidth: 0,
      headerBackgroundAlpha: 0.31,
      headerLeftFlexDirection: 'row',
      headerLeftAlignItems: 'center',
      headerGap: 8,
      headerActionsFlexDirection: 'row',
      headerActionsAlignItems: 'center',
      headerActionGap: 4,
      headerIconSize: 16,
      headerToggleIconSize: 16,
      titleFontSize: 14,
      titleFontWeight: '500',
      titleColorToken: 'foreground',
      actionPaddingHorizontal: 8,
      actionPaddingVertical: 4,
      actionAccessibilityRole: 'button',
      actionPressedOpacity: 0.78,
      actionFontSize: 12,
      processFontWeight: '600',
      disabledActionColorToken: 'mutedForeground',
      resumeActionColorToken: 'success',
      processReadyColorToken: 'primary',
      toggleIconColorToken: 'mutedForeground',
      listMaxHeight: 200,
      separatorHeight: 1,
      compactFlexDirection: 'row',
      compactAlignItems: 'center',
      compactPaddingHorizontal: 8,
      compactPaddingVertical: 4,
      compactGap: 8,
      compactIconSize: 12,
      compactActionIconSize: 14,
      compactTextFlex: 1,
      compactFontSize: 12,
      pausedNoticePaddingHorizontal: 12,
      pausedNoticePaddingVertical: 6,
      pausedNoticeFontSize: 11,
      pausedNoticeLineHeight: 15,
      pausedNoticeBackgroundAlpha: 0.09,
      status: {
        queued: {
          iconName: 'time-outline',
          colorToken: 'warning',
          backgroundAlpha: 0.07,
          borderAlpha: 0.27,
          headerBackgroundAlpha: 0.09,
        },
        paused: {
          iconName: 'pause-circle-outline',
          colorToken: 'warning',
          backgroundAlpha: 0.09,
          borderAlpha: 0.44,
          headerBackgroundAlpha: 0.13,
        },
      },
    },
  },
  desktop: {
    item: {
      containerBaseClassName: 'px-2.5 py-1.5 transition-colors',
      failedContainerClassName: 'bg-destructive/10 hover:bg-destructive/15',
      processingContainerClassName: 'bg-amber-100/50 dark:bg-amber-900/20',
      idleContainerClassName: 'hover:bg-amber-100/30 dark:hover:bg-amber-900/10',
      editContainerClassName: 'space-y-2',
      editInputClassName: 'w-full min-h-[60px] p-2 text-sm rounded border bg-background resize-y',
      editActionsClassName: 'flex flex-wrap items-center justify-end gap-2',
      editButtonClassName: 'h-6 text-xs',
      saveIconClassName: 'h-3 w-3 mr-1',
      rowClassName: 'flex min-w-0 items-start gap-2',
      failedIconClassName: 'h-4 w-4 text-destructive flex-shrink-0 mt-0.5',
      processingIconClassName: 'h-4 w-4 text-primary flex-shrink-0 mt-0.5 animate-spin',
      bodyClassName: 'flex min-w-0 flex-1 items-start gap-1.5',
      contentClassName: 'min-w-0 flex-1',
      messageBaseClassName: 'text-xs leading-snug',
      messageFailedClassName: 'text-destructive',
      messageProcessingClassName: 'text-primary',
      messageCollapsedClassName: 'line-clamp-2',
      errorClassName: 'text-[10px] text-destructive/80 mt-0.5',
      expandButtonClassName: 'mt-0.5 h-4 px-1 text-xs text-muted-foreground hover:text-foreground',
      expandIconClassName: 'h-3 w-3 mr-0.5',
      actionRailClassName: 'ml-auto flex shrink-0 items-center gap-0.5 self-start',
      retryButtonClassName: 'text-primary hover:bg-primary/10 hover:text-primary',
      removeButtonClassName: 'text-destructive hover:bg-destructive/10 hover:text-destructive',
      actionIconClassName: 'h-3.5 w-3.5',
      pendingIconClassName: 'animate-spin',
    },
    compact: {
      containerBaseClassName: 'flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-xs',
      queuedContainerClassName: 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800',
      pausedContainerClassName: 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800',
      queuedIconClassName: 'h-3 w-3 text-amber-600 dark:text-amber-400',
      pausedIconClassName: 'h-3 w-3 text-orange-600 dark:text-orange-400',
      labelBaseClassName: 'min-w-0 flex-1',
      queuedLabelClassName: 'text-amber-700 dark:text-amber-300',
      pausedLabelClassName: 'text-orange-700 dark:text-orange-300',
      actionsClassName: 'ml-auto flex shrink-0 items-center gap-1',
      resumeButtonClassName:
        'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/30',
      pauseButtonClassName:
        'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30',
      clearQueuedButtonClassName: 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200',
      clearPausedButtonClassName: 'text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200',
      actionIconClassName: 'h-3.5 w-3.5',
    },
    panel: {
      containerBaseClassName: 'rounded-md border overflow-hidden',
      queuedContainerClassName: 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30',
      pausedContainerClassName: 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/30',
      headerBaseClassName: 'flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5',
      headerExpandedClassName: 'border-b',
      queuedHeaderClassName: 'border-amber-200 dark:border-amber-800 bg-amber-100/50 dark:bg-amber-900/30',
      pausedHeaderClassName: 'border-orange-200 dark:border-orange-800 bg-orange-100/50 dark:bg-orange-900/30',
      titleGroupClassName: 'flex min-w-0 flex-1 items-center gap-1.5',
      queuedIconClassName: 'h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400',
      pausedIconClassName: 'h-3.5 w-3.5 shrink-0 text-orange-600 dark:text-orange-400',
      titleBaseClassName: 'min-w-0 text-xs font-medium',
      queuedTitleClassName: 'text-amber-800 dark:text-amber-200',
      pausedTitleClassName: 'text-orange-800 dark:text-orange-200',
      actionsClassName: 'ml-auto flex max-w-full flex-wrap items-center justify-end gap-1',
      resumeButtonClassName:
        'h-6 text-xs text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 hover:bg-green-200/50 dark:hover:bg-green-800/50',
      pauseButtonClassName:
        'h-6 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-200/50 dark:hover:bg-amber-800/50',
      inlineActionIconClassName: 'h-3 w-3 mr-1',
      clearButtonBaseClassName: 'h-6 text-xs',
      queuedControlButtonClassName:
        'text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-200/50 dark:hover:bg-amber-800/50',
      pausedControlButtonClassName:
        'text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 hover:bg-orange-200/50 dark:hover:bg-orange-800/50',
      toggleIconClassName: 'h-3.5 w-3.5',
      pausedNoticeClassName:
        'border-b border-orange-200 bg-orange-100/30 px-2.5 py-1 text-[10px] text-orange-700 break-words dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      listClassName: 'divide-y max-h-60 overflow-y-auto',
    },
  },
} as const;

export type MessageQueuePanelMobileSurfaceColorToken =
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.failedColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.processingColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.messageColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.metaColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.errorColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.item.expandTextColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.buttonBorderColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.buttonBackgroundColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.retryTextColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.editTextColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.actions.removeTextColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.inputBorderColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.inputBackgroundColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.inputTextColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.saveButtonBackgroundColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.buttonTextColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.edit.saveButtonTextColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.titleColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.disabledActionColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.resumeActionColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.processReadyColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.toggleIconColorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status.queued.colorToken
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status.paused.colorToken;

export type MessageQueuePanelMobileSurfaceColorPalette =
  Readonly<Record<MessageQueuePanelMobileSurfaceColorToken, string>>;

export type MessageQueuePanelStatusKey =
  keyof typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status;

export interface MessageQueuePanelMobileSurfaceColors {
  item: {
    failedBackgroundColor: string;
    processingBackgroundColor: string;
    transparentBackgroundColor: string;
    failedColor: string;
    processingColor: string;
    messageColor: string;
    failedMetaColor: string;
    processingMetaColor: string;
    metaColor: string;
    errorColor: string;
    expandTextColor: string;
  };
  actions: {
    buttonBorderColor: string;
    buttonBackgroundColor: string;
    retryTextColor: string;
    editTextColor: string;
    removeTextColor: string;
  };
  edit: {
    inputBorderColor: string;
    inputBackgroundColor: string;
    inputTextColor: string;
    cancelButtonBackgroundColor: string;
    saveButtonBackgroundColor: string;
    buttonTextColor: string;
    saveButtonTextColor: string;
  };
  panel: {
    titleColor: string;
    disabledActionColor: string;
    resumeActionColor: string;
    processReadyColor: string;
    toggleIconColor: string;
    status: Record<MessageQueuePanelStatusKey, {
      color: string;
      borderColor: string;
      backgroundColor: string;
      headerBorderBottomColor: string;
      headerBackgroundColor: string;
      separatorColor: string;
      pausedNoticeBackgroundColor: string;
      pausedNoticeBorderBottomColor: string;
      pausedNoticeTextColor: string;
    }>;
  };
}

export interface MessageQueuePanelMobileSurfaceRenderStateInput {
  colors: MessageQueuePanelMobileSurfaceColorPalette;
}

export interface MessageQueuePanelMobileSurfaceRenderState {
  surface: typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile;
  colors: MessageQueuePanelMobileSurfaceColors;
}

export interface MessageQueuePanelMobileWrapperRenderState {
  wrapper: typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.wrapper;
}

export type MessageQueuePanelMobileWrapperSpacingToken =
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.wrapper.paddingHorizontal
  | typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.wrapper.paddingTop;

export type MessageQueuePanelMobileWrapperSpacingScale =
  Readonly<Record<MessageQueuePanelMobileWrapperSpacingToken, number>>;

export interface MessageQueuePanelMobileWrapperStyleSlotsInput {
  wrapper: MessageQueuePanelMobileWrapperRenderState['wrapper'];
  spacing: MessageQueuePanelMobileWrapperSpacingScale;
}

export interface MessageQueuePanelMobileWrapperStyleSlots {
  wrapper: {
    paddingHorizontal: number;
    paddingTop: number;
  };
}

export interface MessageQueuePanelMobileDockRenderStateInput {
  isQueueEnabled?: boolean;
  messageCount?: number | null;
}

export interface MessageQueuePanelMobileDockRenderState {
  shouldRender: boolean;
}

export function getMessageQueuePanelMobileSurfaceColors(
  colors: MessageQueuePanelMobileSurfaceColorPalette,
): MessageQueuePanelMobileSurfaceColors {
  const surface = MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile;
  const getPanelStatusColors = (
    status: (typeof surface.panel.status)[MessageQueuePanelStatusKey],
  ) => {
    const statusColor = colors[status.colorToken];
    const borderColor = hexToRgba(statusColor, status.borderAlpha);
    const separatorColor = hexToRgba(statusColor, surface.panel.borderAlpha);

    return {
      color: statusColor,
      borderColor,
      backgroundColor: hexToRgba(statusColor, status.backgroundAlpha),
      headerBorderBottomColor: separatorColor,
      headerBackgroundColor: hexToRgba(statusColor, status.headerBackgroundAlpha),
      separatorColor,
      pausedNoticeBackgroundColor: hexToRgba(
        statusColor,
        surface.panel.pausedNoticeBackgroundAlpha,
      ),
      pausedNoticeBorderBottomColor: separatorColor,
      pausedNoticeTextColor: statusColor,
    };
  };

  return {
    item: {
      failedBackgroundColor: hexToRgba(
        colors[surface.item.failedColorToken],
        surface.item.stateBackgroundAlpha,
      ),
      processingBackgroundColor: hexToRgba(
        colors[surface.item.processingColorToken],
        surface.item.stateBackgroundAlpha,
      ),
      transparentBackgroundColor: surface.item.transparentBackgroundColor,
      failedColor: colors[surface.item.failedColorToken],
      processingColor: colors[surface.item.processingColorToken],
      messageColor: colors[surface.item.messageColorToken],
      failedMetaColor: hexToRgba(
        colors[surface.item.failedColorToken],
        surface.item.metaTextAlpha,
      ),
      processingMetaColor: hexToRgba(
        colors[surface.item.processingColorToken],
        surface.item.metaTextAlpha,
      ),
      metaColor: colors[surface.item.metaColorToken],
      errorColor: hexToRgba(
        colors[surface.item.errorColorToken],
        surface.item.errorTextAlpha,
      ),
      expandTextColor: colors[surface.item.expandTextColorToken],
    },
    actions: {
      buttonBorderColor: colors[surface.actions.buttonBorderColorToken],
      buttonBackgroundColor: colors[surface.actions.buttonBackgroundColorToken],
      retryTextColor: colors[surface.actions.retryTextColorToken],
      editTextColor: colors[surface.actions.editTextColorToken],
      removeTextColor: colors[surface.actions.removeTextColorToken],
    },
    edit: {
      inputBorderColor: colors[surface.edit.inputBorderColorToken],
      inputBackgroundColor: colors[surface.edit.inputBackgroundColorToken],
      inputTextColor: colors[surface.edit.inputTextColorToken],
      cancelButtonBackgroundColor: surface.edit.cancelButtonBackgroundColor,
      saveButtonBackgroundColor: colors[surface.edit.saveButtonBackgroundColorToken],
      buttonTextColor: colors[surface.edit.buttonTextColorToken],
      saveButtonTextColor: colors[surface.edit.saveButtonTextColorToken],
    },
    panel: {
      titleColor: colors[surface.panel.titleColorToken],
      disabledActionColor: colors[surface.panel.disabledActionColorToken],
      resumeActionColor: colors[surface.panel.resumeActionColorToken],
      processReadyColor: colors[surface.panel.processReadyColorToken],
      toggleIconColor: colors[surface.panel.toggleIconColorToken],
      status: {
        queued: getPanelStatusColors(surface.panel.status.queued),
        paused: getPanelStatusColors(surface.panel.status.paused),
      },
    },
  };
}

export function getMessageQueuePanelMobileSurfaceState(): typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile {
  return MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile;
}

export function getMessageQueuePanelMobileWrapperRenderState(): MessageQueuePanelMobileWrapperRenderState {
  return {
    wrapper: getMessageQueuePanelMobileSurfaceState().wrapper,
  };
}

export function createMessageQueuePanelMobileWrapperStyleSlots({
  wrapper,
  spacing,
}: MessageQueuePanelMobileWrapperStyleSlotsInput): MessageQueuePanelMobileWrapperStyleSlots {
  return {
    wrapper: {
      paddingHorizontal: spacing[wrapper.paddingHorizontal],
      paddingTop: spacing[wrapper.paddingTop],
    },
  };
}

export function getMessageQueuePanelMobileDockRenderState({
  isQueueEnabled = true,
  messageCount = 0,
}: MessageQueuePanelMobileDockRenderStateInput = {}): MessageQueuePanelMobileDockRenderState {
  return {
    shouldRender: isQueueEnabled === true && (messageCount ?? 0) > 0,
  };
}

export function getMessageQueuePanelMobileSurfaceRenderState({
  colors,
}: MessageQueuePanelMobileSurfaceRenderStateInput): MessageQueuePanelMobileSurfaceRenderState {
  return {
    surface: getMessageQueuePanelMobileSurfaceState(),
    colors: getMessageQueuePanelMobileSurfaceColors(colors),
  };
}

export function getMessageQueuePanelDesktopSurfaceState(): typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop {
  return MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop;
}

export function getMessageQueuePanelMobileIconState(): typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon {
  return MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon;
}

export function getMessageQueuePanelCopyState(): typeof MESSAGE_QUEUE_PANEL_PRESENTATION {
  return MESSAGE_QUEUE_PANEL_PRESENTATION;
}

export function formatMessageQueuePanelTitle(messageCount: number, isPaused = false): string {
  const stateLabel = isPaused ? 'Paused' : 'Queued';
  return `${stateLabel} Messages (${messageCount})`;
}

export function formatMessageQueueCompactLabel(messageCount: number, isPaused = false): string {
  const messageLabel = messageCount === 1 ? 'message' : 'messages';
  return `${messageCount} queued ${messageLabel}${isPaused ? ' (paused)' : ''}`;
}

export function formatQueuedMessageTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatQueuedMessageMetaLabel(timestamp: number, statusLabel: string): string {
  return `${formatQueuedMessageTimestamp(timestamp)}${MESSAGE_QUEUE_PANEL_PRESENTATION.meta.separator}${statusLabel}`;
}

export function formatQueuedMessageError(errorMessage: string): string {
  return `${MESSAGE_QUEUE_PANEL_PRESENTATION.errorPrefix}: ${errorMessage}`;
}

export function getQueuedMessageExpansionLabel(isExpanded: boolean): string {
  return isExpanded
    ? MESSAGE_QUEUE_PANEL_PRESENTATION.expansion.lessLabel
    : MESSAGE_QUEUE_PANEL_PRESENTATION.expansion.moreLabel;
}

export function getQueuedMessageExpansionAccessibilityLabel(isExpanded: boolean): string {
  return isExpanded
    ? MESSAGE_QUEUE_PANEL_PRESENTATION.expansion.collapseMessageAccessibilityLabel
    : MESSAGE_QUEUE_PANEL_PRESENTATION.expansion.expandMessageAccessibilityLabel;
}

export function getMessageQueueListToggleLabel(isListCollapsed: boolean): string {
  return isListCollapsed
    ? MESSAGE_QUEUE_PANEL_PRESENTATION.expansion.expandQueueLabel
    : MESSAGE_QUEUE_PANEL_PRESENTATION.expansion.collapseQueueLabel;
}

export type MessageQueuePanelToggleIconName =
  | typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.expandQueueName
  | typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.collapseQueueName;

export type MessageQueuePanelStatusIconName =
  (typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status)[MessageQueuePanelStatusKey]['iconName'];

export interface MessageQueuePanelRenderItem<T extends { id: string }> {
  key: string;
  message: T;
  index: number;
  shouldRenderSeparator: boolean;
}

export interface MessageQueuePanelActionAccessibilityState {
  disabled: boolean;
}

export interface MessageQueuePanelActionState {
  isDisabled: boolean;
  accessibilityState: MessageQueuePanelActionAccessibilityState;
}

export type QueuedMessageEditSaveActionState = MessageQueuePanelActionState;

export interface QueuedMessageEditSubmitState {
  trimmedText: string;
  shouldSubmit: boolean;
  shouldRestoreOriginalText: boolean;
}

export interface QueuedMessageEditDraftState {
  saveActionState: QueuedMessageEditSaveActionState;
  submitState: QueuedMessageEditSubmitState;
}

export interface MessageQueuePanelListToggleAccessibilityState {
  expanded: boolean;
}

export interface MessageQueuePanelStateInput {
  isPaused?: boolean;
  isListCollapsed?: boolean;
  canProcessNext?: boolean;
}

export interface MessageQueuePanelState<T extends Pick<QueuedMessage, 'id' | 'status'>> {
  messageCount: number;
  isPaused: boolean;
  isListCollapsed: boolean;
  isExpanded: boolean;
  statusKey: MessageQueuePanelStatusKey;
  statusIconName: MessageQueuePanelStatusIconName;
  compactLabel: string;
  title: string;
  listToggleLabel: string;
  listToggleAccessibilityState: MessageQueuePanelListToggleAccessibilityState;
  toggleIconName: MessageQueuePanelToggleIconName;
  hasProcessingMessage: boolean;
  canClear: boolean;
  canPause: boolean;
  clearActionState: MessageQueuePanelActionState;
  pauseActionState: MessageQueuePanelActionState;
  clearActionAccessibilityState: MessageQueuePanelActionAccessibilityState;
  pauseActionAccessibilityState: MessageQueuePanelActionAccessibilityState;
  canProcessNext: boolean;
  shouldShowCompactProcessNext: boolean;
  shouldShowProcessNext: boolean;
  shouldRenderClear: boolean;
  shouldRenderPausedNotice: boolean;
  shouldRenderList: boolean;
  items: MessageQueuePanelRenderItem<T>[];
}

export interface MessageQueuePanelMobileRenderStateInput<T extends Pick<QueuedMessage, 'id' | 'status'>>
  extends MessageQueuePanelStateInput {
  messages: readonly T[];
  colors: MessageQueuePanelMobileSurfaceColorPalette;
}

export interface MessageQueuePanelMobileRenderState<T extends Pick<QueuedMessage, 'id' | 'status'>> {
  shouldRender: boolean;
  panel: MessageQueuePanelState<T>;
  surface: MessageQueuePanelMobileSurfaceRenderState['surface'];
  colors: MessageQueuePanelMobileSurfaceRenderState['colors'];
  icons: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon;
  copy: typeof MESSAGE_QUEUE_PANEL_PRESENTATION;
}

export interface MessageQueuePanelDesktopRenderStateInput<T extends Pick<QueuedMessage, 'id' | 'status'>>
  extends MessageQueuePanelStateInput {
  messages: readonly T[];
}

export interface MessageQueuePanelDesktopRenderState<T extends Pick<QueuedMessage, 'id' | 'status'>> {
  shouldRender: boolean;
  panel: MessageQueuePanelState<T>;
  surface: typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop;
  copy: typeof MESSAGE_QUEUE_PANEL_PRESENTATION;
}

type MessageQueuePanelMobilePanelSurface =
  MessageQueuePanelMobileSurfaceRenderState['surface']['panel'];

export interface MessageQueuePanelMobileStyleSlotsInput<T extends Pick<QueuedMessage, 'id' | 'status'>> {
  surface: MessageQueuePanelMobilePanelSurface;
  colors: MessageQueuePanelMobileSurfaceRenderState['colors']['panel'];
  panel: Pick<MessageQueuePanelState<T>, 'statusKey' | 'hasProcessingMessage' | 'isPaused' | 'canProcessNext'>;
}

export interface MessageQueuePanelMobileStyleSlots {
  container: {
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    backgroundColor: string;
    overflow: MessageQueuePanelMobilePanelSurface['overflow'];
  };
  header: {
    flexDirection: MessageQueuePanelMobilePanelSurface['headerFlexDirection'];
    alignItems: MessageQueuePanelMobilePanelSurface['headerAlignItems'];
    justifyContent: MessageQueuePanelMobilePanelSurface['headerJustifyContent'];
    paddingHorizontal: number;
    paddingVertical: number;
    borderBottomWidth: number;
    borderBottomColor: string;
    backgroundColor: string;
  };
  headerCollapsed: {
    borderBottomWidth: number;
  };
  headerLeft: {
    flexDirection: MessageQueuePanelMobilePanelSurface['headerLeftFlexDirection'];
    alignItems: MessageQueuePanelMobilePanelSurface['headerLeftAlignItems'];
    gap: number;
  };
  headerActions: {
    flexDirection: MessageQueuePanelMobilePanelSurface['headerActionsFlexDirection'];
    alignItems: MessageQueuePanelMobilePanelSurface['headerActionsAlignItems'];
    gap: number;
  };
  headerTitle: {
    fontSize: number;
    fontWeight: MessageQueuePanelMobilePanelSurface['titleFontWeight'];
    color: string;
  };
  clearButton: {
    paddingHorizontal: number;
    paddingVertical: number;
  };
  clearButtonText: {
    fontSize: number;
    color: string;
  };
  queueControlText: {
    fontSize: number;
    color: string;
    fontWeight: MessageQueuePanelMobilePanelSurface['processFontWeight'];
  };
  queueControlTextDisabled: {
    color: string;
  };
  processButton: {
    paddingHorizontal: number;
    paddingVertical: number;
  };
  processButtonText: {
    fontSize: number;
    color: string;
    fontWeight: MessageQueuePanelMobilePanelSurface['processFontWeight'];
  };
  list: {
    maxHeight: number;
  };
  separator: {
    height: number;
    backgroundColor: string;
  };
  pausedNotice: {
    paddingHorizontal: number;
    paddingVertical: number;
    backgroundColor: string;
    borderBottomWidth: number;
    borderBottomColor: string;
  };
  pausedNoticeText: {
    color: string;
    fontSize: number;
    lineHeight: number;
  };
  compactContainer: {
    flexDirection: MessageQueuePanelMobilePanelSurface['compactFlexDirection'];
    alignItems: MessageQueuePanelMobilePanelSurface['compactAlignItems'];
    paddingHorizontal: number;
    paddingVertical: number;
    gap: number;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    backgroundColor: string;
  };
  compactText: {
    flex: number;
    fontSize: number;
    color: string;
  };
  compactAction: {
    paddingHorizontal: number;
    paddingVertical: number;
  };
}

export interface MessageQueuePanelCompactActionMobilePropsPartsStylesLike {
  compactAction: unknown;
}

export type MessageQueuePanelCompactActionMobilePropsPartKey =
  | 'resume'
  | 'pause'
  | 'sendNext'
  | 'clear';

export interface MessageQueuePanelCompactActionMobilePropsPartsInput<
  TStyles extends MessageQueuePanelCompactActionMobilePropsPartsStylesLike =
    MessageQueuePanelCompactActionMobilePropsPartsStylesLike,
  TOnPress = unknown,
> {
  surface: MessageQueuePanelMobilePanelSurface;
  colors: MessageQueuePanelMobileSurfaceRenderState['colors']['panel'];
  icons: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon;
  copy: typeof MESSAGE_QUEUE_PANEL_PRESENTATION;
  panel: Pick<
    MessageQueuePanelState<Pick<QueuedMessage, 'id' | 'status'>>,
    'statusKey' | 'isPaused' | 'pauseActionState' | 'clearActionState' | 'shouldShowCompactProcessNext'
  >;
  styles: TStyles;
  onPause?: TOnPress;
  onResume?: TOnPress;
  onProcessNext?: TOnPress;
  onClear: TOnPress;
}

export interface MessageQueuePanelCompactActionMobilePropsPart<TStyle, TOnPress> {
  key: MessageQueuePanelCompactActionMobilePropsPartKey;
  style: TStyle;
  onPress: TOnPress;
  disabled?: boolean;
  activeOpacity: MessageQueuePanelMobilePanelSurface['actionPressedOpacity'];
  accessibilityRole: MessageQueuePanelMobilePanelSurface['actionAccessibilityRole'];
  accessibilityLabel: string;
  accessibilityState?: MessageQueuePanelActionAccessibilityState;
  icon: {
    name: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon[keyof typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon];
    size: MessageQueuePanelMobilePanelSurface['compactActionIconSize'];
    color: string;
  };
}

export interface MessageQueuePanelCompactActionMobilePropsParts<
  TStyles extends MessageQueuePanelCompactActionMobilePropsPartsStylesLike =
    MessageQueuePanelCompactActionMobilePropsPartsStylesLike,
  TOnPress = unknown,
> {
  actions: MessageQueuePanelCompactActionMobilePropsPart<TStyles['compactAction'], TOnPress>[];
}

export interface MessageQueuePanelHeaderActionMobilePropsPartsStylesLike {
  processButton: unknown;
  clearButton: unknown;
  queueControlText: unknown;
  queueControlTextDisabled: unknown;
  processButtonText: unknown;
  clearButtonText: unknown;
}

export type MessageQueuePanelHeaderActionMobilePropsPartKey =
  | 'resume'
  | 'pause'
  | 'sendNext'
  | 'clear'
  | 'toggleList';

export interface MessageQueuePanelHeaderActionMobilePropsPartsInput<
  TStyles extends MessageQueuePanelHeaderActionMobilePropsPartsStylesLike =
    MessageQueuePanelHeaderActionMobilePropsPartsStylesLike,
  TOnPress = unknown,
> {
  surface: MessageQueuePanelMobilePanelSurface;
  colors: MessageQueuePanelMobileSurfaceRenderState['colors']['panel'];
  copy: typeof MESSAGE_QUEUE_PANEL_PRESENTATION;
  panel: Pick<
    MessageQueuePanelState<Pick<QueuedMessage, 'id' | 'status'>>,
    | 'isPaused'
    | 'pauseActionState'
    | 'clearActionState'
    | 'shouldShowProcessNext'
    | 'shouldRenderClear'
    | 'listToggleLabel'
    | 'listToggleAccessibilityState'
    | 'toggleIconName'
  >;
  styles: TStyles;
  onPause?: TOnPress;
  onResume?: TOnPress;
  onProcessNext?: TOnPress;
  onClear: TOnPress;
  onToggleListCollapsed: TOnPress;
}

export type MessageQueuePanelHeaderActionMobileLabelStyle<
  TStyles extends MessageQueuePanelHeaderActionMobilePropsPartsStylesLike,
> =
  | TStyles['queueControlText']
  | TStyles['processButtonText']
  | TStyles['clearButtonText']
  | Array<TStyles['queueControlText'] | TStyles['queueControlTextDisabled'] | false>;

interface MessageQueuePanelHeaderActionMobilePropsPartBase<TStyle, TOnPress> {
  key: MessageQueuePanelHeaderActionMobilePropsPartKey;
  style: TStyle;
  onPress: TOnPress;
  disabled?: boolean;
  activeOpacity: MessageQueuePanelMobilePanelSurface['actionPressedOpacity'];
  accessibilityRole: MessageQueuePanelMobilePanelSurface['actionAccessibilityRole'];
  accessibilityLabel: string;
  accessibilityState?: MessageQueuePanelActionAccessibilityState | MessageQueuePanelListToggleAccessibilityState;
}

export interface MessageQueuePanelHeaderTextActionMobilePropsPart<
  TStyle,
  TLabelStyle,
  TOnPress,
>
  extends MessageQueuePanelHeaderActionMobilePropsPartBase<TStyle, TOnPress> {
  type: 'text';
  label: {
    style: TLabelStyle;
    text: string;
  };
}

export interface MessageQueuePanelHeaderIconActionMobilePropsPart<TStyle, TOnPress>
  extends MessageQueuePanelHeaderActionMobilePropsPartBase<TStyle, TOnPress> {
  type: 'icon';
  icon: {
    name: MessageQueuePanelToggleIconName;
    size: MessageQueuePanelMobilePanelSurface['headerToggleIconSize'];
    color: string;
  };
}

export type MessageQueuePanelHeaderActionMobilePropsPart<TStyles extends MessageQueuePanelHeaderActionMobilePropsPartsStylesLike, TOnPress> =
  | MessageQueuePanelHeaderTextActionMobilePropsPart<
      TStyles['processButton'] | TStyles['clearButton'],
      MessageQueuePanelHeaderActionMobileLabelStyle<TStyles>,
      TOnPress
    >
  | MessageQueuePanelHeaderIconActionMobilePropsPart<TStyles['clearButton'], TOnPress>;

export interface MessageQueuePanelHeaderActionMobilePropsParts<
  TStyles extends MessageQueuePanelHeaderActionMobilePropsPartsStylesLike =
    MessageQueuePanelHeaderActionMobilePropsPartsStylesLike,
  TOnPress = unknown,
> {
  actions: Array<MessageQueuePanelHeaderActionMobilePropsPart<TStyles, TOnPress>>;
}

export interface MessageQueuePanelChromeMobilePropsPartsStylesLike {
  compactContainer: unknown;
  compactText: unknown;
  header: unknown;
  headerCollapsed: unknown;
  headerLeft: unknown;
  headerTitle: unknown;
  pausedNotice: unknown;
  pausedNoticeText: unknown;
  list: unknown;
}

export interface MessageQueuePanelChromeMobilePropsPartsInput<
  TStyles extends MessageQueuePanelChromeMobilePropsPartsStylesLike =
    MessageQueuePanelChromeMobilePropsPartsStylesLike,
> {
  surface: MessageQueuePanelMobilePanelSurface;
  colors: MessageQueuePanelMobileSurfaceRenderState['colors']['panel'];
  copy: typeof MESSAGE_QUEUE_PANEL_PRESENTATION;
  panel: Pick<
    MessageQueuePanelState<Pick<QueuedMessage, 'id' | 'status'>>,
    | 'statusKey'
    | 'statusIconName'
    | 'compactLabel'
    | 'title'
    | 'isListCollapsed'
    | 'shouldRenderPausedNotice'
    | 'shouldRenderList'
  >;
  styles: TStyles;
}

export interface MessageQueuePanelChromeMobilePropsParts<
  TStyles extends MessageQueuePanelChromeMobilePropsPartsStylesLike =
    MessageQueuePanelChromeMobilePropsPartsStylesLike,
> {
  compactContainer: {
    style: TStyles['compactContainer'];
  };
  compactStatusIcon: {
    name: MessageQueuePanelStatusIconName;
    size: MessageQueuePanelMobilePanelSurface['compactIconSize'];
    color: string;
  };
  compactLabel: {
    style: TStyles['compactText'];
    text: string;
  };
  headerContainer: {
    style: Array<TStyles['header'] | TStyles['headerCollapsed'] | false>;
  };
  headerLeft: {
    style: TStyles['headerLeft'];
  };
  headerStatusIcon: {
    name: MessageQueuePanelStatusIconName;
    size: MessageQueuePanelMobilePanelSurface['headerIconSize'];
    color: string;
  };
  headerTitle: {
    style: TStyles['headerTitle'];
    text: string;
  };
  pausedNotice: {
    containerStyle: TStyles['pausedNotice'];
    textStyle: TStyles['pausedNoticeText'];
    text: string;
  } | null;
  list: {
    style: TStyles['list'];
  } | null;
}

export interface MessageQueuePanelListMobilePropsPartsStylesLike {
  separator: unknown;
}

export interface MessageQueuePanelListMobilePropsPartsInput<
  T extends Pick<QueuedMessage, 'id' | 'status'>,
  TStyles extends MessageQueuePanelListMobilePropsPartsStylesLike =
    MessageQueuePanelListMobilePropsPartsStylesLike,
> {
  items: readonly MessageQueuePanelRenderItem<T>[];
  styles: TStyles;
  onRemove: (messageId: string) => void;
  onUpdate: (messageId: string, text: string) => void;
  onRetry: (messageId: string) => void;
}

export interface MessageQueuePanelListMobilePropsPart<
  T extends Pick<QueuedMessage, 'id' | 'status'>,
  TStyles extends MessageQueuePanelListMobilePropsPartsStylesLike =
    MessageQueuePanelListMobilePropsPartsStylesLike,
> {
  key: string;
  separator: {
    style: TStyles['separator'];
  } | null;
  messageProps: {
    message: T;
    onRemove: () => void;
    onUpdate: (text: string) => void;
    onRetry: () => void;
  };
}

export interface MessageQueuePanelListMobilePropsParts<
  T extends Pick<QueuedMessage, 'id' | 'status'>,
  TStyles extends MessageQueuePanelListMobilePropsPartsStylesLike =
    MessageQueuePanelListMobilePropsPartsStylesLike,
> {
  items: Array<MessageQueuePanelListMobilePropsPart<T, TStyles>>;
}

export function getMessageQueuePanelRenderItems<T extends { id: string }>(
  messages: readonly T[],
): MessageQueuePanelRenderItem<T>[] {
  return messages.map((message, index) => ({
    key: message.id,
    message,
    index,
    shouldRenderSeparator: index > 0,
  }));
}

export function getMessageQueuePanelActionState(isEnabled: boolean): MessageQueuePanelActionState {
  const isDisabled = !isEnabled;
  return {
    isDisabled,
    accessibilityState: { disabled: isDisabled },
  };
}

export function getMessageQueuePanelState<T extends Pick<QueuedMessage, 'id' | 'status'>>(
  messages: readonly T[],
  input: MessageQueuePanelStateInput = {},
): MessageQueuePanelState<T> {
  const isPaused = input.isPaused ?? false;
  const isListCollapsed = input.isListCollapsed ?? false;
  const canProcessNext = input.canProcessNext ?? false;
  const statusKey: MessageQueuePanelStatusKey = isPaused ? 'paused' : 'queued';
  const hasProcessingMessage = hasProcessingQueuedMessage(messages);
  const isExpanded = !isListCollapsed;
  const canClear = !hasProcessingMessage;
  const canPause = !hasProcessingMessage;
  const clearActionState = getMessageQueuePanelActionState(canClear);
  const pauseActionState = getMessageQueuePanelActionState(canPause);

  return {
    messageCount: messages.length,
    isPaused,
    isListCollapsed,
    isExpanded,
    statusKey,
    statusIconName: MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.mobile.panel.status[statusKey].iconName,
    compactLabel: formatMessageQueueCompactLabel(messages.length, isPaused),
    title: formatMessageQueuePanelTitle(messages.length, isPaused),
    listToggleLabel: getMessageQueueListToggleLabel(isListCollapsed),
    listToggleAccessibilityState: { expanded: isExpanded },
    toggleIconName: isListCollapsed
      ? MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.expandQueueName
      : MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.collapseQueueName,
    hasProcessingMessage,
    canClear,
    canPause,
    clearActionState,
    pauseActionState,
    clearActionAccessibilityState: clearActionState.accessibilityState,
    pauseActionAccessibilityState: pauseActionState.accessibilityState,
    canProcessNext,
    shouldShowCompactProcessNext: !isPaused && canProcessNext,
    shouldShowProcessNext: !isPaused && canProcessNext && isExpanded,
    shouldRenderClear: isExpanded,
    shouldRenderPausedNotice: isPaused && isExpanded,
    shouldRenderList: isExpanded,
    items: getMessageQueuePanelRenderItems(messages),
  };
}

export function getMessageQueuePanelMobileRenderState<T extends Pick<QueuedMessage, 'id' | 'status'>>({
  messages,
  colors,
  isPaused,
  isListCollapsed,
  canProcessNext,
}: MessageQueuePanelMobileRenderStateInput<T>): MessageQueuePanelMobileRenderState<T> {
  const surfaceState = getMessageQueuePanelMobileSurfaceRenderState({ colors });
  const panel = getMessageQueuePanelState(messages, {
    isPaused,
    isListCollapsed,
    canProcessNext,
  });

  return {
    shouldRender: getMessageQueuePanelMobileDockRenderState({
      messageCount: panel.messageCount,
    }).shouldRender,
    panel,
    surface: surfaceState.surface,
    colors: surfaceState.colors,
    icons: getMessageQueuePanelMobileIconState(),
    copy: getMessageQueuePanelCopyState(),
  };
}

export function getMessageQueuePanelDesktopRenderState<T extends Pick<QueuedMessage, 'id' | 'status'>>({
  messages,
  isPaused,
  isListCollapsed,
  canProcessNext,
}: MessageQueuePanelDesktopRenderStateInput<T>): MessageQueuePanelDesktopRenderState<T> {
  const panel = getMessageQueuePanelState(messages, {
    isPaused,
    isListCollapsed,
    canProcessNext,
  });

  return {
    shouldRender: panel.messageCount > 0,
    panel,
    surface: getMessageQueuePanelDesktopSurfaceState(),
    copy: getMessageQueuePanelCopyState(),
  };
}

export function createMessageQueuePanelMobileStyleSlots<T extends Pick<QueuedMessage, 'id' | 'status'>>({
  surface,
  colors,
  panel,
}: MessageQueuePanelMobileStyleSlotsInput<T>): MessageQueuePanelMobileStyleSlots {
  const statusColors = colors.status[panel.statusKey];
  const actionButtonStyle = {
    paddingHorizontal: surface.actionPaddingHorizontal,
    paddingVertical: surface.actionPaddingVertical,
  };

  return {
    container: {
      borderRadius: surface.borderRadius,
      borderWidth: surface.borderWidth,
      borderColor: statusColors.borderColor,
      backgroundColor: statusColors.backgroundColor,
      overflow: surface.overflow,
    },
    header: {
      flexDirection: surface.headerFlexDirection,
      alignItems: surface.headerAlignItems,
      justifyContent: surface.headerJustifyContent,
      paddingHorizontal: surface.headerPaddingHorizontal,
      paddingVertical: surface.headerPaddingVertical,
      borderBottomWidth: surface.headerBorderBottomWidth,
      borderBottomColor: statusColors.headerBorderBottomColor,
      backgroundColor: statusColors.headerBackgroundColor,
    },
    headerCollapsed: {
      borderBottomWidth: surface.headerCollapsedBorderBottomWidth,
    },
    headerLeft: {
      flexDirection: surface.headerLeftFlexDirection,
      alignItems: surface.headerLeftAlignItems,
      gap: surface.headerGap,
    },
    headerActions: {
      flexDirection: surface.headerActionsFlexDirection,
      alignItems: surface.headerActionsAlignItems,
      gap: surface.headerActionGap,
    },
    headerTitle: {
      fontSize: surface.titleFontSize,
      fontWeight: surface.titleFontWeight,
      color: colors.titleColor,
    },
    clearButton: actionButtonStyle,
    clearButtonText: {
      fontSize: surface.actionFontSize,
      color: panel.hasProcessingMessage ? colors.disabledActionColor : statusColors.color,
    },
    queueControlText: {
      fontSize: surface.actionFontSize,
      color: panel.isPaused ? colors.resumeActionColor : statusColors.color,
      fontWeight: surface.processFontWeight,
    },
    queueControlTextDisabled: {
      color: colors.disabledActionColor,
    },
    processButton: actionButtonStyle,
    processButtonText: {
      fontSize: surface.actionFontSize,
      color: panel.canProcessNext ? colors.processReadyColor : colors.disabledActionColor,
      fontWeight: surface.processFontWeight,
    },
    list: {
      maxHeight: surface.listMaxHeight,
    },
    separator: {
      height: surface.separatorHeight,
      backgroundColor: statusColors.separatorColor,
    },
    pausedNotice: {
      paddingHorizontal: surface.pausedNoticePaddingHorizontal,
      paddingVertical: surface.pausedNoticePaddingVertical,
      backgroundColor: statusColors.pausedNoticeBackgroundColor,
      borderBottomWidth: surface.separatorHeight,
      borderBottomColor: statusColors.pausedNoticeBorderBottomColor,
    },
    pausedNoticeText: {
      color: statusColors.pausedNoticeTextColor,
      fontSize: surface.pausedNoticeFontSize,
      lineHeight: surface.pausedNoticeLineHeight,
    },
    compactContainer: {
      flexDirection: surface.compactFlexDirection,
      alignItems: surface.compactAlignItems,
      paddingHorizontal: surface.compactPaddingHorizontal,
      paddingVertical: surface.compactPaddingVertical,
      gap: surface.compactGap,
      borderWidth: surface.borderWidth,
      borderColor: statusColors.borderColor,
      borderRadius: surface.borderRadius,
      backgroundColor: statusColors.backgroundColor,
    },
    compactText: {
      flex: surface.compactTextFlex,
      fontSize: surface.compactFontSize,
      color: statusColors.color,
    },
    compactAction: actionButtonStyle,
  };
}

export function createMessageQueuePanelCompactActionMobilePropsParts<
  TStyles extends MessageQueuePanelCompactActionMobilePropsPartsStylesLike,
  TOnPress,
>({
  surface,
  colors,
  icons,
  copy,
  panel,
  styles,
  onPause,
  onResume,
  onProcessNext,
  onClear,
}: MessageQueuePanelCompactActionMobilePropsPartsInput<TStyles, TOnPress>):
  MessageQueuePanelCompactActionMobilePropsParts<TStyles, TOnPress> {
  const statusColors = colors.status[panel.statusKey];
  const actions: MessageQueuePanelCompactActionMobilePropsPart<TStyles['compactAction'], TOnPress>[] = [];
  const baseAction = {
    style: styles.compactAction,
    activeOpacity: surface.actionPressedOpacity,
    accessibilityRole: surface.actionAccessibilityRole,
  };

  if (panel.isPaused && onResume) {
    actions.push({
      ...baseAction,
      key: 'resume',
      onPress: onResume,
      accessibilityLabel: copy.actions.resumeTitle,
      icon: {
        name: icons.resumeName,
        size: surface.compactActionIconSize,
        color: colors.resumeActionColor,
      },
    });
  }

  if (!panel.isPaused && onPause) {
    actions.push({
      ...baseAction,
      key: 'pause',
      onPress: onPause,
      disabled: panel.pauseActionState.isDisabled,
      accessibilityLabel: copy.actions.pauseTitle,
      accessibilityState: panel.pauseActionState.accessibilityState,
      icon: {
        name: icons.pauseName,
        size: surface.compactActionIconSize,
        color: panel.pauseActionState.isDisabled
          ? colors.disabledActionColor
          : statusColors.color,
      },
    });
  }

  if (panel.shouldShowCompactProcessNext && onProcessNext) {
    actions.push({
      ...baseAction,
      key: 'sendNext',
      onPress: onProcessNext,
      accessibilityLabel: copy.actions.sendNextAccessibilityLabel,
      icon: {
        name: icons.sendNextName,
        size: surface.compactActionIconSize,
        color: colors.processReadyColor,
      },
    });
  }

  actions.push({
    ...baseAction,
    key: 'clear',
    onPress: onClear,
    disabled: panel.clearActionState.isDisabled,
    accessibilityLabel: copy.actions.clearQueueTitle,
    accessibilityState: panel.clearActionState.accessibilityState,
    icon: {
      name: icons.clearName,
      size: surface.compactActionIconSize,
      color: panel.clearActionState.isDisabled
        ? colors.disabledActionColor
        : statusColors.color,
    },
  });

  return { actions };
}

export function createMessageQueuePanelHeaderActionMobilePropsParts<
  TStyles extends MessageQueuePanelHeaderActionMobilePropsPartsStylesLike,
  TOnPress,
>({
  surface,
  colors,
  copy,
  panel,
  styles,
  onPause,
  onResume,
  onProcessNext,
  onClear,
  onToggleListCollapsed,
}: MessageQueuePanelHeaderActionMobilePropsPartsInput<TStyles, TOnPress>):
  MessageQueuePanelHeaderActionMobilePropsParts<TStyles, TOnPress> {
  const actions: Array<MessageQueuePanelHeaderActionMobilePropsPart<TStyles, TOnPress>> = [];
  const baseAction = {
    activeOpacity: surface.actionPressedOpacity,
    accessibilityRole: surface.actionAccessibilityRole,
  };

  if (panel.isPaused && onResume) {
    actions.push({
      ...baseAction,
      key: 'resume',
      type: 'text',
      style: styles.processButton,
      onPress: onResume,
      accessibilityLabel: copy.actions.resumeTitle,
      label: {
        style: styles.queueControlText,
        text: copy.actions.resumeLabel,
      },
    });
  }

  if (!panel.isPaused && onPause) {
    actions.push({
      ...baseAction,
      key: 'pause',
      type: 'text',
      style: styles.processButton,
      onPress: onPause,
      disabled: panel.pauseActionState.isDisabled,
      accessibilityLabel: copy.actions.pauseTitle,
      accessibilityState: panel.pauseActionState.accessibilityState,
      label: {
        style: [
          styles.queueControlText,
          panel.pauseActionState.isDisabled && styles.queueControlTextDisabled,
        ],
        text: copy.actions.pauseLabel,
      },
    });
  }

  if (panel.shouldShowProcessNext && onProcessNext) {
    actions.push({
      ...baseAction,
      key: 'sendNext',
      type: 'text',
      style: styles.processButton,
      onPress: onProcessNext,
      accessibilityLabel: copy.actions.sendNextAccessibilityLabel,
      label: {
        style: styles.processButtonText,
        text: copy.actions.sendNextLabel,
      },
    });
  }

  if (panel.shouldRenderClear) {
    actions.push({
      ...baseAction,
      key: 'clear',
      type: 'text',
      style: styles.clearButton,
      onPress: onClear,
      disabled: panel.clearActionState.isDisabled,
      accessibilityLabel: copy.actions.clearQueueTitle,
      accessibilityState: panel.clearActionState.accessibilityState,
      label: {
        style: styles.clearButtonText,
        text: copy.actions.clearAllLabel,
      },
    });
  }

  actions.push({
    ...baseAction,
    key: 'toggleList',
    type: 'icon',
    style: styles.clearButton,
    onPress: onToggleListCollapsed,
    accessibilityLabel: panel.listToggleLabel,
    accessibilityState: panel.listToggleAccessibilityState,
    icon: {
      name: panel.toggleIconName,
      size: surface.headerToggleIconSize,
      color: colors.toggleIconColor,
    },
  });

  return { actions };
}

export function createMessageQueuePanelChromeMobilePropsParts<
  TStyles extends MessageQueuePanelChromeMobilePropsPartsStylesLike,
>({
  surface,
  colors,
  copy,
  panel,
  styles,
}: MessageQueuePanelChromeMobilePropsPartsInput<TStyles>): MessageQueuePanelChromeMobilePropsParts<TStyles> {
  const statusColors = colors.status[panel.statusKey];

  return {
    compactContainer: {
      style: styles.compactContainer,
    },
    compactStatusIcon: {
      name: panel.statusIconName,
      size: surface.compactIconSize,
      color: statusColors.color,
    },
    compactLabel: {
      style: styles.compactText,
      text: panel.compactLabel,
    },
    headerContainer: {
      style: [styles.header, panel.isListCollapsed && styles.headerCollapsed],
    },
    headerLeft: {
      style: styles.headerLeft,
    },
    headerStatusIcon: {
      name: panel.statusIconName,
      size: surface.headerIconSize,
      color: statusColors.color,
    },
    headerTitle: {
      style: styles.headerTitle,
      text: panel.title,
    },
    pausedNotice: panel.shouldRenderPausedNotice
      ? {
          containerStyle: styles.pausedNotice,
          textStyle: styles.pausedNoticeText,
          text: copy.pausedNotice,
        }
      : null,
    list: panel.shouldRenderList
      ? {
          style: styles.list,
        }
      : null,
  };
}

export function createMessageQueuePanelListMobilePropsParts<
  T extends Pick<QueuedMessage, 'id' | 'status'>,
  TStyles extends MessageQueuePanelListMobilePropsPartsStylesLike,
>({
  items,
  styles,
  onRemove,
  onUpdate,
  onRetry,
}: MessageQueuePanelListMobilePropsPartsInput<T, TStyles>): MessageQueuePanelListMobilePropsParts<T, TStyles> {
  return {
    items: items.map((item) => ({
      key: item.key,
      separator: item.shouldRenderSeparator
        ? {
            style: styles.separator,
          }
        : null,
      messageProps: {
        message: item.message,
        onRemove: () => onRemove(item.message.id),
        onUpdate: (text: string) => onUpdate(item.message.id, text),
        onRetry: () => onRetry(item.message.id),
      },
    })),
  };
}

export type QueuedMessageItemPresentation = {
  isLongMessage: boolean;
  isFailed: boolean;
  isProcessing: boolean;
  canMutateMessage: boolean;
  canEditMessage: boolean;
  statusLabel: string;
  expansionLabel: string;
  expansionAccessibilityLabel: string;
  errorText?: string;
}

export interface QueuedMessageItemMobileRenderStateInput {
  message: Pick<QueuedMessage, 'status' | 'addedToHistory' | 'text' | 'errorMessage'>;
  isExpanded: boolean;
  colors: MessageQueuePanelMobileSurfaceColorPalette;
}

export interface QueuedMessageItemMobileRenderState {
  presentation: QueuedMessageItemPresentation;
  surface: {
    item: MessageQueuePanelMobileSurfaceRenderState['surface']['item'];
    actions: MessageQueuePanelMobileSurfaceRenderState['surface']['actions'];
    edit: MessageQueuePanelMobileSurfaceRenderState['surface']['edit'];
  };
  colors: {
    item: MessageQueuePanelMobileSurfaceRenderState['colors']['item'];
    actions: MessageQueuePanelMobileSurfaceRenderState['colors']['actions'];
    edit: MessageQueuePanelMobileSurfaceRenderState['colors']['edit'];
  };
  icons: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon;
  copy: typeof MESSAGE_QUEUE_PANEL_PRESENTATION;
  statusColor: string;
  statusMetaColor: string;
}

type QueuedMessageMobileActionSurface =
  MessageQueuePanelMobileSurfaceRenderState['surface']['actions'];
type QueuedMessageMobileEditSurface =
  MessageQueuePanelMobileSurfaceRenderState['surface']['edit'];
type QueuedMessageMobileItemSurface =
  MessageQueuePanelMobileSurfaceRenderState['surface']['item'];

export interface QueuedMessageItemMobileStyleSlotsInput {
  surface: QueuedMessageMobileItemSurface;
  colors: MessageQueuePanelMobileSurfaceRenderState['colors']['item'];
  presentation: Pick<QueuedMessageItemPresentation, 'isFailed' | 'isProcessing'>;
  statusColor: string;
  statusMetaColor: string;
}

export interface QueuedMessageItemMobileStyleSlots {
  container: {
    paddingHorizontal: number;
    paddingVertical: number;
    backgroundColor: string;
  };
  row: {
    flexDirection: QueuedMessageMobileItemSurface['rowFlexDirection'];
    alignItems: QueuedMessageMobileItemSurface['rowAlignItems'];
    gap: number;
  };
  content: {
    flex: number;
    minWidth: number;
  };
  messageText: {
    fontSize: number;
    color: string;
  };
  errorText: {
    fontSize: number;
    color: string;
    marginTop: number;
  };
  metaRow: {
    flexDirection: QueuedMessageMobileItemSurface['metaFlexDirection'];
    alignItems: QueuedMessageMobileItemSurface['metaAlignItems'];
    flexWrap: QueuedMessageMobileItemSurface['metaFlexWrap'];
    gap: number;
    marginTop: number;
  };
  metaText: {
    fontSize: number;
    color: string;
  };
  expandButton: {
    flexDirection: QueuedMessageMobileItemSurface['expandButtonFlexDirection'];
    alignItems: QueuedMessageMobileItemSurface['expandButtonAlignItems'];
  };
  expandText: {
    fontSize: number;
    color: string;
    marginLeft: number;
  };
}

export interface QueuedMessageStatusIndicatorMobilePropsPartInput {
  surface: QueuedMessageMobileItemSurface;
  colors: MessageQueuePanelMobileSurfaceRenderState['colors']['item'];
  icons: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon;
  presentation: Pick<QueuedMessageItemPresentation, 'isFailed' | 'isProcessing'>;
}

export interface QueuedMessageContentMobilePropsPartsStylesLike {
  content: unknown;
  messageText: unknown;
  errorText: unknown;
  metaRow: unknown;
  metaText: unknown;
}

export interface QueuedMessageContentMobilePropsPartsInput<
  TStyles extends QueuedMessageContentMobilePropsPartsStylesLike =
    QueuedMessageContentMobilePropsPartsStylesLike,
> {
  surface: QueuedMessageMobileItemSurface;
  message: Pick<QueuedMessage, 'text' | 'createdAt'>;
  presentation: Pick<QueuedMessageItemPresentation, 'statusLabel' | 'errorText'>;
  isExpanded: boolean;
  styles: TStyles;
}

export interface QueuedMessageContentMobilePropsParts<
  TStyles extends QueuedMessageContentMobilePropsPartsStylesLike =
    QueuedMessageContentMobilePropsPartsStylesLike,
> {
  container: {
    style: TStyles['content'];
  };
  messageText: {
    style: TStyles['messageText'];
    numberOfLines: QueuedMessageMobileItemSurface['message']['collapsedNumberOfLines'] | undefined;
    text: string;
  };
  errorText: {
    style: TStyles['errorText'];
    text: string;
  } | null;
  metaRow: {
    style: TStyles['metaRow'];
  };
  metaText: {
    style: TStyles['metaText'];
    text: string;
  };
}

export type QueuedMessageStatusIndicatorMobilePropsPart =
  | {
      type: 'failed';
      icon: {
        name: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.failedName;
        size: QueuedMessageMobileItemSurface['stateIconSize'];
        color: string;
      };
    }
  | {
      type: 'processing';
      activityIndicator: {
        size: QueuedMessageMobileItemSurface['processingIndicatorSize'];
        color: string;
      };
    };

export interface QueuedMessageExpandButtonMobilePropsPartsStylesLike {
  expandButton: unknown;
  expandText: unknown;
}

export interface QueuedMessageExpandButtonMobilePropsPartsInput<
  TStyles extends QueuedMessageExpandButtonMobilePropsPartsStylesLike =
    QueuedMessageExpandButtonMobilePropsPartsStylesLike,
  TOnToggleExpanded = unknown,
> {
  surface: QueuedMessageMobileItemSurface;
  colors: MessageQueuePanelMobileSurfaceRenderState['colors']['item'];
  icons: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon;
  presentation: Pick<QueuedMessageItemPresentation, 'isLongMessage' | 'expansionLabel' | 'expansionAccessibilityLabel'>;
  isExpanded: boolean;
  styles: TStyles;
  onToggleExpanded: TOnToggleExpanded;
}

export interface QueuedMessageExpandButtonMobilePropsParts<
  TStyles extends QueuedMessageExpandButtonMobilePropsPartsStylesLike =
    QueuedMessageExpandButtonMobilePropsPartsStylesLike,
  TOnToggleExpanded = unknown,
> {
  pressable: {
    style: TStyles['expandButton'];
    onPress: TOnToggleExpanded;
    activeOpacity: QueuedMessageMobileItemSurface['expandButtonPressedOpacity'];
    accessibilityRole: QueuedMessageMobileItemSurface['expandButtonAccessibilityRole'];
    accessibilityLabel: string;
  };
  icon: {
    name:
      | typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.expandMessageName
      | typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.collapseMessageName;
    size: QueuedMessageMobileItemSurface['expandIconSize'];
    color: string;
  };
  label: {
    style: TStyles['expandText'];
    text: string;
  };
}

export interface QueuedMessageActionButtonMobileStyleSlotsInput {
  surface: QueuedMessageMobileActionSurface;
  colors: MessageQueuePanelMobileSurfaceRenderState['colors']['actions'];
}

export interface QueuedMessageActionRowMobileStyleSlotInput {
  surface: QueuedMessageMobileActionSurface;
}

export interface QueuedMessageActionRowMobileStyleSlot {
  flexDirection: QueuedMessageMobileActionSurface['flexDirection'];
  flexWrap: QueuedMessageMobileActionSurface['flexWrap'];
  alignItems: QueuedMessageMobileActionSurface['alignItems'];
  gap: number;
  marginTop: number;
}

export interface QueuedMessageActionButtonMobileStyleSlot {
  alignSelf: QueuedMessageMobileActionSurface['buttonAlignSelf'];
  minHeight: number;
  flexDirection: QueuedMessageMobileActionSurface['buttonFlexDirection'];
  alignItems: QueuedMessageMobileActionSurface['buttonAlignItems'];
  paddingHorizontal: number;
  paddingVertical: number;
  gap: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
  justifyContent: QueuedMessageMobileActionSurface['buttonJustifyContent'];
}

export interface QueuedMessageActionTextMobileStyleSlot {
  color: string;
  fontSize: number;
  fontWeight: QueuedMessageMobileActionSurface['textFontWeight'];
}

export interface QueuedMessageActionButtonMobileStyleSlots {
  button: QueuedMessageActionButtonMobileStyleSlot;
  retryText: QueuedMessageActionTextMobileStyleSlot;
  editText: QueuedMessageActionTextMobileStyleSlot;
  removeText: QueuedMessageActionTextMobileStyleSlot;
}

export type QueuedMessageActionButtonMobileActionKey = 'retry' | 'edit' | 'remove';

export interface QueuedMessageActionButtonMobilePropsPartsStylesLike {
  actionButton: unknown;
  retryActionText: unknown;
  editActionText: unknown;
  removeActionText: unknown;
}

export interface QueuedMessageActionButtonMobilePropsPartsInput<
  TStyles extends QueuedMessageActionButtonMobilePropsPartsStylesLike =
    QueuedMessageActionButtonMobilePropsPartsStylesLike,
> {
  surface: QueuedMessageMobileActionSurface;
  colors: MessageQueuePanelMobileSurfaceRenderState['colors']['actions'];
  icons: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon;
  copy: typeof MESSAGE_QUEUE_PANEL_PRESENTATION;
  presentation: Pick<QueuedMessageItemPresentation, 'isFailed' | 'canMutateMessage' | 'canEditMessage'>;
  styles: TStyles;
  onRetry: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

export interface QueuedMessageActionButtonMobilePropsPart<
  TStyles extends QueuedMessageActionButtonMobilePropsPartsStylesLike =
    QueuedMessageActionButtonMobilePropsPartsStylesLike,
> {
  key: QueuedMessageActionButtonMobileActionKey;
  style: TStyles['actionButton'];
  onPress: () => void;
  activeOpacity: QueuedMessageMobileActionSurface['buttonPressedOpacity'];
  accessibilityRole: QueuedMessageMobileActionSurface['buttonAccessibilityRole'];
  accessibilityLabel: string;
  hitSlop: QueuedMessageMobileActionSurface['hitSlop'];
  icon: {
    name:
      | typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.retryName
      | typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.editName
      | typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.removeName;
    size: QueuedMessageMobileActionSurface['actionIconSize'];
    color: string;
  };
  label: {
    style:
      | TStyles['retryActionText']
      | TStyles['editActionText']
      | TStyles['removeActionText'];
    text: string;
  };
}

export interface QueuedMessageActionButtonMobilePropsParts<
  TStyles extends QueuedMessageActionButtonMobilePropsPartsStylesLike =
    QueuedMessageActionButtonMobilePropsPartsStylesLike,
> {
  shouldRender: boolean;
  actions: Array<QueuedMessageActionButtonMobilePropsPart<TStyles>>;
}

export interface QueuedMessageItemChromeMobilePropsPartsStylesLike {
  container: unknown;
  row: unknown;
  actions: unknown;
}

export interface QueuedMessageItemChromeMobilePropsPartsInput<
  TStyles extends QueuedMessageItemChromeMobilePropsPartsStylesLike =
    QueuedMessageItemChromeMobilePropsPartsStylesLike,
> {
  statusIndicatorPart: QueuedMessageStatusIndicatorMobilePropsPart | null;
  actionParts: Pick<QueuedMessageActionButtonMobilePropsParts, 'shouldRender'>;
  styles: TStyles;
}

export interface QueuedMessageItemChromeMobilePropsParts<
  TStyles extends QueuedMessageItemChromeMobilePropsPartsStylesLike =
    QueuedMessageItemChromeMobilePropsPartsStylesLike,
> {
  container: {
    style: TStyles['container'];
  };
  row: {
    style: TStyles['row'];
  };
  failedStatusIcon: Extract<QueuedMessageStatusIndicatorMobilePropsPart, { type: 'failed' }>['icon'] | null;
  processingStatusIndicator: Extract<
    QueuedMessageStatusIndicatorMobilePropsPart,
    { type: 'processing' }
  >['activityIndicator'] | null;
  actions: {
    style: TStyles['actions'];
  } | null;
}

export interface QueuedMessageEditMobileStyleSlotsInput {
  surface: QueuedMessageMobileEditSurface;
  colors: MessageQueuePanelMobileSurfaceRenderState['colors']['edit'];
}

export interface QueuedMessageEditMobileStyleSlots {
  container: {
    gap: number;
  };
  input: {
    minHeight: number;
    padding: number;
    fontSize: number;
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    backgroundColor: string;
    color: string;
    textAlignVertical: QueuedMessageMobileEditSurface['inputTextAlignVertical'];
  };
  actions: {
    flexDirection: QueuedMessageMobileEditSurface['actionsFlexDirection'];
    justifyContent: QueuedMessageMobileEditSurface['actionsJustifyContent'];
    gap: number;
  };
  button: {
    paddingHorizontal: number;
    paddingVertical: number;
    borderRadius: number;
  };
  cancelButton: {
    backgroundColor: string;
  };
  saveButton: {
    backgroundColor: string;
  };
  buttonText: {
    fontSize: number;
    color: string;
  };
  saveButtonText: {
    fontSize: number;
    color: string;
  };
}

export interface QueuedMessageEditMobileStylesLike {
  editContainer: unknown;
  editInput: unknown;
  editActions: unknown;
  editButton: unknown;
  cancelButton: unknown;
  saveButton: unknown;
  buttonText: unknown;
  saveButtonText: unknown;
}

export interface QueuedMessageEditMobilePropsPartsInput<
  TStyles extends QueuedMessageEditMobileStylesLike = QueuedMessageEditMobileStylesLike,
  TOnCancel = unknown,
  TOnSave = unknown,
> {
  surface: QueuedMessageMobileEditSurface;
  copy: typeof MESSAGE_QUEUE_PANEL_PRESENTATION;
  editDraftState: QueuedMessageEditDraftState;
  styles: TStyles;
  onCancel: TOnCancel;
  onSave: TOnSave;
}

export interface QueuedMessageEditMobilePropsParts<
  TStyles extends QueuedMessageEditMobileStylesLike = QueuedMessageEditMobileStylesLike,
  TOnCancel = unknown,
  TOnSave = unknown,
> {
  container: {
    style: TStyles['editContainer'];
  };
  input: {
    style: TStyles['editInput'];
    accessibilityLabel: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.actions.editInputAccessibilityLabel;
  };
  actions: {
    style: TStyles['editActions'];
  };
  cancelButton: {
    style: Array<TStyles['editButton'] | TStyles['cancelButton']>;
    onPress: TOnCancel;
    activeOpacity: QueuedMessageMobileEditSurface['buttonPressedOpacity'];
    accessibilityRole: QueuedMessageMobileEditSurface['buttonAccessibilityRole'];
    accessibilityLabel: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.actions.cancelAccessibilityLabel;
    text: {
      style: TStyles['buttonText'];
      value: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.actions.cancelLabel;
    };
  };
  saveButton: {
    style: Array<TStyles['editButton'] | TStyles['saveButton']>;
    onPress: TOnSave;
    disabled: boolean;
    activeOpacity: QueuedMessageMobileEditSurface['buttonPressedOpacity'];
    accessibilityRole: QueuedMessageMobileEditSurface['buttonAccessibilityRole'];
    accessibilityLabel: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.actions.saveAccessibilityLabel;
    accessibilityState: QueuedMessageEditSaveActionState['accessibilityState'];
    text: {
      style: TStyles['saveButtonText'];
      value: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.actions.saveLabel;
    };
  };
}

export interface QueuedMessageItemDesktopRenderStateInput {
  message: Pick<QueuedMessage, 'status' | 'addedToHistory' | 'text' | 'errorMessage'>;
  isExpanded: boolean;
}

export interface QueuedMessageItemDesktopRenderState {
  presentation: QueuedMessageItemPresentation;
  surface: typeof MESSAGE_QUEUE_PANEL_SURFACE_PRESENTATION.desktop.item;
  copy: typeof MESSAGE_QUEUE_PANEL_PRESENTATION;
}

export function getQueuedMessageEditSaveActionState(text: string): QueuedMessageEditSaveActionState {
  return getMessageQueuePanelActionState(!!text.trim());
}

export function getQueuedMessageEditSubmitState(
  draftText: string,
  currentText: string,
): QueuedMessageEditSubmitState {
  const trimmedText = draftText.trim();
  const shouldSubmit = trimmedText.length > 0 && trimmedText !== currentText;

  return {
    trimmedText,
    shouldSubmit,
    shouldRestoreOriginalText: !shouldSubmit,
  };
}

export function getQueuedMessageEditDraftState(
  draftText: string,
  currentText: string,
): QueuedMessageEditDraftState {
  return {
    saveActionState: getQueuedMessageEditSaveActionState(draftText),
    submitState: getQueuedMessageEditSubmitState(draftText, currentText),
  };
}

export function getQueuedMessageItemPresentation(
  message: Pick<QueuedMessage, 'status' | 'addedToHistory' | 'text' | 'errorMessage'>,
  isExpanded: boolean,
): QueuedMessageItemPresentation {
  const isFailed = isQueuedMessageFailed(message);
  const isProcessing = isQueuedMessageProcessing(message);
  return {
    isLongMessage: message.text.length > MESSAGE_QUEUE_PANEL_PRESENTATION.longMessagePreviewCharacterLimit,
    isFailed,
    isProcessing,
    canMutateMessage: canMutateQueuedMessage(message),
    canEditMessage: canEditQueuedMessage(message),
    statusLabel: getQueuedMessageStatusLabel(message),
    expansionLabel: getQueuedMessageExpansionLabel(isExpanded),
    expansionAccessibilityLabel: getQueuedMessageExpansionAccessibilityLabel(isExpanded),
    errorText: isFailed && message.errorMessage
      ? formatQueuedMessageError(message.errorMessage)
      : undefined,
  };
}

export function getQueuedMessageItemMobileRenderState({
  message,
  isExpanded,
  colors,
}: QueuedMessageItemMobileRenderStateInput): QueuedMessageItemMobileRenderState {
  const presentation = getQueuedMessageItemPresentation(message, isExpanded);
  const surfaceState = getMessageQueuePanelMobileSurfaceRenderState({ colors });
  const itemColors = surfaceState.colors.item;

  return {
    presentation,
    surface: {
      item: surfaceState.surface.item,
      actions: surfaceState.surface.actions,
      edit: surfaceState.surface.edit,
    },
    colors: {
      item: itemColors,
      actions: surfaceState.colors.actions,
      edit: surfaceState.colors.edit,
    },
    icons: getMessageQueuePanelMobileIconState(),
    copy: getMessageQueuePanelCopyState(),
    statusColor: presentation.isFailed
      ? itemColors.failedColor
      : presentation.isProcessing
        ? itemColors.processingColor
        : itemColors.messageColor,
    statusMetaColor: presentation.isFailed
      ? itemColors.failedMetaColor
      : presentation.isProcessing
        ? itemColors.processingMetaColor
        : itemColors.metaColor,
  };
}

export function createQueuedMessageItemMobileStyleSlots({
  surface,
  colors,
  presentation,
  statusColor,
  statusMetaColor,
}: QueuedMessageItemMobileStyleSlotsInput): QueuedMessageItemMobileStyleSlots {
  return {
    container: {
      paddingHorizontal: surface.paddingHorizontal,
      paddingVertical: surface.paddingVertical,
      backgroundColor: presentation.isFailed
        ? colors.failedBackgroundColor
        : presentation.isProcessing
          ? colors.processingBackgroundColor
          : colors.transparentBackgroundColor,
    },
    row: {
      flexDirection: surface.rowFlexDirection,
      alignItems: surface.rowAlignItems,
      gap: surface.rowGap,
    },
    content: {
      flex: surface.contentFlex,
      minWidth: surface.contentMinWidth,
    },
    messageText: {
      fontSize: surface.message.fontSize,
      color: statusColor,
    },
    errorText: {
      fontSize: surface.errorFontSize,
      color: colors.errorColor,
      marginTop: surface.errorMarginTop,
    },
    metaRow: {
      flexDirection: surface.metaFlexDirection,
      alignItems: surface.metaAlignItems,
      flexWrap: surface.metaFlexWrap,
      gap: surface.metaGap,
      marginTop: surface.metaMarginTop,
    },
    metaText: {
      fontSize: surface.metaFontSize,
      color: statusMetaColor,
    },
    expandButton: {
      flexDirection: surface.expandButtonFlexDirection,
      alignItems: surface.expandButtonAlignItems,
    },
    expandText: {
      fontSize: surface.expandTextFontSize,
      color: colors.expandTextColor,
      marginLeft: surface.expandTextMarginLeft,
    },
  };
}

export function createQueuedMessageStatusIndicatorMobilePropsPart({
  surface,
  colors,
  icons,
  presentation,
}: QueuedMessageStatusIndicatorMobilePropsPartInput): QueuedMessageStatusIndicatorMobilePropsPart | null {
  if (presentation.isFailed) {
    return {
      type: 'failed',
      icon: {
        name: icons.failedName,
        size: surface.stateIconSize,
        color: colors.failedColor,
      },
    };
  }

  if (presentation.isProcessing) {
    return {
      type: 'processing',
      activityIndicator: {
        size: surface.processingIndicatorSize,
        color: colors.processingColor,
      },
    };
  }

  return null;
}

export function createQueuedMessageContentMobilePropsParts<
  TStyles extends QueuedMessageContentMobilePropsPartsStylesLike,
>({
  surface,
  message,
  presentation,
  isExpanded,
  styles,
}: QueuedMessageContentMobilePropsPartsInput<TStyles>): QueuedMessageContentMobilePropsParts<TStyles> {
  return {
    container: {
      style: styles.content,
    },
    messageText: {
      style: styles.messageText,
      numberOfLines: isExpanded ? undefined : surface.message.collapsedNumberOfLines,
      text: message.text,
    },
    errorText: presentation.errorText
      ? {
          style: styles.errorText,
          text: presentation.errorText,
        }
      : null,
    metaRow: {
      style: styles.metaRow,
    },
    metaText: {
      style: styles.metaText,
      text: formatQueuedMessageMetaLabel(message.createdAt, presentation.statusLabel),
    },
  };
}

export function createQueuedMessageExpandButtonMobilePropsParts<
  TStyles extends QueuedMessageExpandButtonMobilePropsPartsStylesLike,
  TOnToggleExpanded,
>({
  surface,
  colors,
  icons,
  presentation,
  isExpanded,
  styles,
  onToggleExpanded,
}: QueuedMessageExpandButtonMobilePropsPartsInput<TStyles, TOnToggleExpanded>): QueuedMessageExpandButtonMobilePropsParts<TStyles, TOnToggleExpanded> | null {
  if (!presentation.isLongMessage) {
    return null;
  }

  return {
    pressable: {
      style: styles.expandButton,
      onPress: onToggleExpanded,
      activeOpacity: surface.expandButtonPressedOpacity,
      accessibilityRole: surface.expandButtonAccessibilityRole,
      accessibilityLabel: presentation.expansionAccessibilityLabel,
    },
    icon: {
      name: isExpanded ? icons.collapseMessageName : icons.expandMessageName,
      size: surface.expandIconSize,
      color: colors.expandTextColor,
    },
    label: {
      style: styles.expandText,
      text: presentation.expansionLabel,
    },
  };
}

export function createQueuedMessageActionButtonMobileStyleSlots({
  surface,
  colors,
}: QueuedMessageActionButtonMobileStyleSlotsInput): QueuedMessageActionButtonMobileStyleSlots {
  const createTextStyle = (color: string): QueuedMessageActionTextMobileStyleSlot => ({
    color,
    fontSize: surface.textFontSize,
    fontWeight: surface.textFontWeight,
  });

  return {
    button: {
      alignSelf: surface.buttonAlignSelf,
      minHeight: surface.buttonMinHeight,
      flexDirection: surface.buttonFlexDirection,
      alignItems: surface.buttonAlignItems,
      paddingHorizontal: surface.buttonPaddingHorizontal,
      paddingVertical: surface.buttonPaddingVertical,
      gap: surface.buttonGap,
      borderRadius: surface.buttonBorderRadius,
      borderWidth: surface.buttonBorderWidth,
      borderColor: colors.buttonBorderColor,
      backgroundColor: colors.buttonBackgroundColor,
      justifyContent: surface.buttonJustifyContent,
    },
    retryText: createTextStyle(colors.retryTextColor),
    editText: createTextStyle(colors.editTextColor),
    removeText: createTextStyle(colors.removeTextColor),
  };
}

export function createQueuedMessageActionButtonMobilePropsParts<
  TStyles extends QueuedMessageActionButtonMobilePropsPartsStylesLike,
>({
  surface,
  colors,
  icons,
  copy,
  presentation,
  styles,
  onRetry,
  onEdit,
  onRemove,
}: QueuedMessageActionButtonMobilePropsPartsInput<TStyles>): QueuedMessageActionButtonMobilePropsParts<TStyles> {
  if (!presentation.canMutateMessage) {
    return {
      shouldRender: false,
      actions: [],
    };
  }

  const createAction = (
    key: QueuedMessageActionButtonMobileActionKey,
    params: {
      onPress: () => void;
      accessibilityLabel: string;
      iconName: QueuedMessageActionButtonMobilePropsPart<TStyles>['icon']['name'];
      iconColor: string;
      labelStyle: QueuedMessageActionButtonMobilePropsPart<TStyles>['label']['style'];
      labelText: string;
    },
  ): QueuedMessageActionButtonMobilePropsPart<TStyles> => ({
    key,
    style: styles.actionButton,
    onPress: params.onPress,
    activeOpacity: surface.buttonPressedOpacity,
    accessibilityRole: surface.buttonAccessibilityRole,
    accessibilityLabel: params.accessibilityLabel,
    hitSlop: surface.hitSlop,
    icon: {
      name: params.iconName,
      size: surface.actionIconSize,
      color: params.iconColor,
    },
    label: {
      style: params.labelStyle,
      text: params.labelText,
    },
  });

  const actions: Array<QueuedMessageActionButtonMobilePropsPart<TStyles>> = [];

  if (presentation.isFailed) {
    actions.push(createAction('retry', {
      onPress: onRetry,
      accessibilityLabel: copy.actions.retryAccessibilityLabel,
      iconName: icons.retryName,
      iconColor: colors.retryTextColor,
      labelStyle: styles.retryActionText,
      labelText: copy.actions.retryLabel,
    }));
  }

  if (presentation.canEditMessage) {
    actions.push(createAction('edit', {
      onPress: onEdit,
      accessibilityLabel: copy.actions.editAccessibilityLabel,
      iconName: icons.editName,
      iconColor: colors.editTextColor,
      labelStyle: styles.editActionText,
      labelText: copy.actions.editLabel,
    }));
  }

  actions.push(createAction('remove', {
    onPress: onRemove,
    accessibilityLabel: copy.actions.removeAccessibilityLabel,
    iconName: icons.removeName,
    iconColor: colors.removeTextColor,
    labelStyle: styles.removeActionText,
    labelText: copy.actions.removeLabel,
  }));

  return {
    shouldRender: actions.length > 0,
    actions,
  };
}

export function createQueuedMessageActionRowMobileStyleSlot({
  surface,
}: QueuedMessageActionRowMobileStyleSlotInput): QueuedMessageActionRowMobileStyleSlot {
  return {
    flexDirection: surface.flexDirection,
    flexWrap: surface.flexWrap,
    alignItems: surface.alignItems,
    gap: surface.gap,
    marginTop: surface.marginTop,
  };
}

export function createQueuedMessageItemChromeMobilePropsParts<
  TStyles extends QueuedMessageItemChromeMobilePropsPartsStylesLike,
>({
  statusIndicatorPart,
  actionParts,
  styles,
}: QueuedMessageItemChromeMobilePropsPartsInput<TStyles>): QueuedMessageItemChromeMobilePropsParts<TStyles> {
  return {
    container: {
      style: styles.container,
    },
    row: {
      style: styles.row,
    },
    failedStatusIcon: statusIndicatorPart?.type === 'failed'
      ? statusIndicatorPart.icon
      : null,
    processingStatusIndicator: statusIndicatorPart?.type === 'processing'
      ? statusIndicatorPart.activityIndicator
      : null,
    actions: actionParts.shouldRender
      ? {
          style: styles.actions,
        }
      : null,
  };
}

export function createQueuedMessageEditMobileStyleSlots({
  surface,
  colors,
}: QueuedMessageEditMobileStyleSlotsInput): QueuedMessageEditMobileStyleSlots {
  return {
    container: {
      gap: surface.containerGap,
    },
    input: {
      minHeight: surface.inputMinHeight,
      padding: surface.inputPadding,
      fontSize: surface.inputFontSize,
      borderRadius: surface.inputBorderRadius,
      borderWidth: surface.inputBorderWidth,
      borderColor: colors.inputBorderColor,
      backgroundColor: colors.inputBackgroundColor,
      color: colors.inputTextColor,
      textAlignVertical: surface.inputTextAlignVertical,
    },
    actions: {
      flexDirection: surface.actionsFlexDirection,
      justifyContent: surface.actionsJustifyContent,
      gap: surface.actionsGap,
    },
    button: {
      paddingHorizontal: surface.buttonPaddingHorizontal,
      paddingVertical: surface.buttonPaddingVertical,
      borderRadius: surface.buttonBorderRadius,
    },
    cancelButton: {
      backgroundColor: colors.cancelButtonBackgroundColor,
    },
    saveButton: {
      backgroundColor: colors.saveButtonBackgroundColor,
    },
    buttonText: {
      fontSize: surface.buttonTextFontSize,
      color: colors.buttonTextColor,
    },
    saveButtonText: {
      fontSize: surface.buttonTextFontSize,
      color: colors.saveButtonTextColor,
    },
  };
}

export function createQueuedMessageEditMobilePropsParts<
  TStyles extends QueuedMessageEditMobileStylesLike,
  TOnCancel,
  TOnSave,
>({
  surface,
  copy,
  editDraftState,
  styles,
  onCancel,
  onSave,
}: QueuedMessageEditMobilePropsPartsInput<TStyles, TOnCancel, TOnSave>): QueuedMessageEditMobilePropsParts<TStyles, TOnCancel, TOnSave> {
  return {
    container: {
      style: styles.editContainer,
    },
    input: {
      style: styles.editInput,
      accessibilityLabel: copy.actions.editInputAccessibilityLabel,
    },
    actions: {
      style: styles.editActions,
    },
    cancelButton: {
      style: [styles.editButton, styles.cancelButton],
      onPress: onCancel,
      activeOpacity: surface.buttonPressedOpacity,
      accessibilityRole: surface.buttonAccessibilityRole,
      accessibilityLabel: copy.actions.cancelAccessibilityLabel,
      text: {
        style: styles.buttonText,
        value: copy.actions.cancelLabel,
      },
    },
    saveButton: {
      style: [styles.editButton, styles.saveButton],
      onPress: onSave,
      disabled: editDraftState.saveActionState.isDisabled,
      activeOpacity: surface.buttonPressedOpacity,
      accessibilityRole: surface.buttonAccessibilityRole,
      accessibilityLabel: copy.actions.saveAccessibilityLabel,
      accessibilityState: editDraftState.saveActionState.accessibilityState,
      text: {
        style: styles.saveButtonText,
        value: copy.actions.saveLabel,
      },
    },
  };
}

export function getQueuedMessageItemDesktopRenderState({
  message,
  isExpanded,
}: QueuedMessageItemDesktopRenderStateInput): QueuedMessageItemDesktopRenderState {
  return {
    presentation: getQueuedMessageItemPresentation(message, isExpanded),
    surface: getMessageQueuePanelDesktopSurfaceState().item,
    copy: getMessageQueuePanelCopyState(),
  };
}

function setConversationQueue(
  queues: MessageQueueMap,
  conversationId: string,
  queue: QueuedMessage[],
): MessageQueueMap {
  const nextQueues = new Map(queues);
  if (queue.length === 0) {
    nextQueues.delete(conversationId);
  } else {
    nextQueues.set(conversationId, queue);
  }
  return nextQueues;
}

function findQueuedMessage(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
): { queue: QueuedMessage[]; message: QueuedMessage; index: number } | null {
  const queue = queues.get(conversationId);
  if (!queue) return null;

  const index = queue.findIndex((message) => message.id === messageId);
  if (index === -1) return null;

  return { queue, message: queue[index], index };
}

function replaceQueuedMessage(
  queues: MessageQueueMap,
  conversationId: string,
  queue: QueuedMessage[],
  index: number,
  message: QueuedMessage,
): MessageQueueMap {
  const nextQueue = [...queue];
  nextQueue[index] = message;
  return setConversationQueue(queues, conversationId, nextQueue);
}

function removeQueuedMessageAtIndex(
  queues: MessageQueueMap,
  conversationId: string,
  queue: QueuedMessage[],
  index: number,
): MessageQueueMap {
  return setConversationQueue(
    queues,
    conversationId,
    queue.filter((_, queueIndex) => queueIndex !== index),
  );
}

function resetMessageStatusToPending(message: QueuedMessage): QueuedMessage {
  const { errorMessage: _errorMessage, ...messageWithoutError } = message;
  return {
    ...messageWithoutError,
    status: 'pending',
  };
}

export function setOperatorMessageQueueSummaryPaused(
  queues: readonly OperatorMessageQueueSummary[],
  conversationId: string,
  isPaused: boolean,
): OperatorMessageQueueSummary[] {
  return queues.map((queue) => (
    queue.conversationId === conversationId
      ? { ...queue, isPaused }
      : queue
  ));
}

export function clearOperatorMessageQueueSummary(
  queues: readonly OperatorMessageQueueSummary[],
  conversationId: string,
): OperatorMessageQueueSummary[] {
  return queues.filter((queue) => queue.conversationId !== conversationId);
}

export function updateOperatorQueuedMessageSummaryText(
  queues: readonly OperatorMessageQueueSummary[],
  conversationId: string,
  messageId: string,
  text: string,
): OperatorMessageQueueSummary[] {
  const trimmedText = text.trim();

  return queues.map((queue) => (
    queue.conversationId === conversationId
      ? {
        ...queue,
        messages: queue.messages.map((message) => {
          if (message.id !== messageId) {
            return message;
          }

          const nextMessage = isQueuedMessageFailed(message)
            ? resetMessageStatusToPending(message)
            : message;

          return {
            ...nextMessage,
            text: trimmedText,
          };
        }),
      }
      : queue
  ));
}

export function retryOperatorQueuedMessageSummary(
  queues: readonly OperatorMessageQueueSummary[],
  conversationId: string,
  messageId: string,
): OperatorMessageQueueSummary[] {
  return queues.map((queue) => (
    queue.conversationId === conversationId
      ? {
        ...queue,
        messages: queue.messages.map((message) => (
          message.id === messageId
            ? resetMessageStatusToPending(message)
            : message
        )),
      }
      : queue
  ));
}

export function removeOperatorQueuedMessageSummary(
  queues: readonly OperatorMessageQueueSummary[],
  conversationId: string,
  messageId: string,
): OperatorMessageQueueSummary[] {
  return queues
    .map((queue) => {
      if (queue.conversationId !== conversationId) {
        return queue;
      }

      const messages = queue.messages.filter((message) => message.id !== messageId);
      const removedMessageCount = queue.messages.length - messages.length;

      return {
        ...queue,
        messageCount: Math.max(0, queue.messageCount - removedMessageCount),
        messages,
      };
    })
    .filter((queue) => queue.messageCount > 0);
}

export function enqueueQueuedMessage(
  queues: MessageQueueMap,
  message: QueuedMessage,
): MessageQueueMutationResult {
  const queue = [...(queues.get(message.conversationId) ?? []), message];
  return {
    ok: true,
    queues: setConversationQueue(queues, message.conversationId, queue),
    message,
  };
}

export function removeQueuedMessage(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };
  if (isQueuedMessageProcessing(found.message)) {
    return { ok: false, queues, message: found.message, index: found.index, reason: 'processing' };
  }

  return {
    ok: true,
    queues: removeQueuedMessageAtIndex(queues, conversationId, found.queue, found.index),
    message: found.message,
    index: found.index,
  };
}

export function clearQueuedMessages(
  queues: MessageQueueMap,
  conversationId: string,
): MessageQueueMutationResult {
  const queue = queues.get(conversationId);
  if (!queue) return { ok: true, queues };
  if (hasProcessingQueuedMessage(queue)) {
    return { ok: false, queues, reason: 'processing' };
  }

  return {
    ok: true,
    queues: setConversationQueue(queues, conversationId, []),
  };
}

export function updateQueuedMessageText(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
  text: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };
  if (isQueuedMessageProcessing(found.message)) {
    return { ok: false, queues, message: found.message, index: found.index, reason: 'processing' };
  }
  if (found.message.addedToHistory) {
    return { ok: false, queues, message: found.message, index: found.index, reason: 'added_to_history' };
  }

  const resetFailedToPending = isQueuedMessageFailed(found.message);
  const updatedMessage = resetFailedToPending
    ? { ...resetMessageStatusToPending(found.message), text }
    : { ...found.message, text };

  return {
    ok: true,
    queues: replaceQueuedMessage(queues, conversationId, found.queue, found.index, updatedMessage),
    message: updatedMessage,
    index: found.index,
    resetFailedToPending,
  };
}

export function peekNextQueuedMessage(queues: MessageQueueMap, conversationId: string): QueuedMessage | null {
  const firstMessage = queues.get(conversationId)?.[0];
  return firstMessage && isQueuedMessagePending(firstMessage) ? firstMessage : null;
}

export function markQueuedMessageProcessing(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };
  const updatedMessage: QueuedMessage = { ...found.message, status: 'processing' };

  return {
    ok: true,
    queues: replaceQueuedMessage(queues, conversationId, found.queue, found.index, updatedMessage),
    message: updatedMessage,
    index: found.index,
  };
}

export function markQueuedMessageProcessed(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };

  return {
    ok: true,
    queues: removeQueuedMessageAtIndex(queues, conversationId, found.queue, found.index),
    message: found.message,
    index: found.index,
  };
}

export function markQueuedMessageFailed(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
  errorMessage: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };
  const updatedMessage: QueuedMessage = { ...found.message, status: 'failed', errorMessage };

  return {
    ok: true,
    queues: replaceQueuedMessage(queues, conversationId, found.queue, found.index, updatedMessage),
    message: updatedMessage,
    index: found.index,
  };
}

export function markQueuedMessageAddedToHistory(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };
  const updatedMessage: QueuedMessage = { ...found.message, addedToHistory: true };

  return {
    ok: true,
    queues: replaceQueuedMessage(queues, conversationId, found.queue, found.index, updatedMessage),
    message: updatedMessage,
    index: found.index,
  };
}

export function resetQueuedMessageToPending(
  queues: MessageQueueMap,
  conversationId: string,
  messageId: string,
): MessageQueueMutationResult {
  const found = findQueuedMessage(queues, conversationId, messageId);
  if (!found) return { ok: false, queues, reason: 'not_found' };
  if (!isQueuedMessageFailed(found.message)) {
    return { ok: false, queues, message: found.message, index: found.index, reason: 'not_failed' };
  }

  const updatedMessage = resetMessageStatusToPending(found.message);
  return {
    ok: true,
    queues: replaceQueuedMessage(queues, conversationId, found.queue, found.index, updatedMessage),
    message: updatedMessage,
    index: found.index,
  };
}

export function reorderQueuedMessages(
  queues: MessageQueueMap,
  conversationId: string,
  messageIds: string[],
): MessageQueueMutationResult {
  const queue = queues.get(conversationId);
  if (!queue) return { ok: false, queues, reason: 'not_found' };

  const messageMap = new Map(queue.map((message) => [message.id, message]));
  const newQueue: QueuedMessage[] = [];
  for (const id of messageIds) {
    const message = messageMap.get(id);
    if (message) {
      newQueue.push(message);
      messageMap.delete(id);
    }
  }
  messageMap.forEach((message) => newQueue.push(message));

  return {
    ok: true,
    queues: setConversationQueue(queues, conversationId, newQueue),
  };
}
