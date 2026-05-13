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
  toggleIconName: MessageQueuePanelToggleIconName;
  hasProcessingMessage: boolean;
  canClear: boolean;
  canPause: boolean;
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
  panel: MessageQueuePanelState<T>;
  surface: MessageQueuePanelMobileSurfaceRenderState['surface'];
  colors: MessageQueuePanelMobileSurfaceRenderState['colors'];
  icons: typeof MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon;
  copy: typeof MESSAGE_QUEUE_PANEL_PRESENTATION;
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
    toggleIconName: isListCollapsed
      ? MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.expandQueueName
      : MESSAGE_QUEUE_PANEL_PRESENTATION.mobileIcon.collapseQueueName,
    hasProcessingMessage,
    canClear: !hasProcessingMessage,
    canPause: !hasProcessingMessage,
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

  return {
    panel: getMessageQueuePanelState(messages, {
      isPaused,
      isListCollapsed,
      canProcessNext,
    }),
    surface: surfaceState.surface,
    colors: surfaceState.colors,
    icons: getMessageQueuePanelMobileIconState(),
    copy: getMessageQueuePanelCopyState(),
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
