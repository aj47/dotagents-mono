import { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createChatSessionStatusMobileChromeStyleSlots,
  createChatRuntimeAgentSelectorMobileStyleSlots,
  createChatRuntimeConnectionBannerMobileStyleSlots,
  createChatRuntimeDelegationCardMobileStyleSlots,
  createChatRuntimeHeaderActionsRowMobileStyleSlot,
  createChatRuntimeHeaderIconContainerMobileStyleSlot,
  createChatRuntimeHeaderPinButtonMobileStyleSlot,
  createChatRuntimeMessageHistoryBannerMobileStyleSlots,
  createChatRuntimeMessageActionButtonMobileStyleSlots,
  createChatRuntimeRetryStatusMobileStyleSlots,
  createChatRuntimeScrollToBottomMobileStyleSlots,
  createChatRuntimeStepSummaryMobileStyleSlots,
  createChatRuntimeStreamingContentMobileStyleSlots,
  createChatRuntimeToolActivityGroupMobileStyleSlots,
  createChatRuntimeToolApprovalMobileStyleSlots,
  createChatRuntimeTurnDurationHeaderMobileStyleSlots,
  createChatRuntimeTurnDurationMessageMobileStyleSlots,
  createChatRuntimeThemeSpinnerSource,
  createChatRuntimeViewportActivityMobileStyleSlots,
  createMessageQueuePanelMobileWrapperStyleSlots,
  getChatRuntimeMobileChromeStyleRenderState,
  getChatRuntimeMobileSafeAreaLayoutState,
  resolveChatRuntimeMobileFontFamily,
} from '@dotagents/shared/session-presentation';
import {
  createChatComposerRuntimeDockStyleSlots,
  createChatComposerStyleSlots,
  createChatConversationHomePromptEditorModalStyleSlots,
  createChatMessageConversationDockStyleSlots,
  createChatMessageConversationThreadStyleSlots,
  createChatMessageConversationViewportStyleSlots,
  createChatMessageRuntimeDockStyleSlots,
  createChatMessageRuntimeSurfaceStyleSlots,
  createChatMessageRuntimeViewportStyleSlots,
  createChatRuntimeHeaderStyleSlots,
  createChatRuntimeMobileSafeAreaStyleSlots,
  createChatRuntimeSafeAreaMergedStyleSlots,
} from './ChatMessageChrome';
import { useTheme } from './ThemeProvider';
import { radius, spacing, type Theme } from './theme';

const darkSpinnerSource = require('../../assets/loading-spinner.gif');
const lightSpinnerSource = require('../../assets/light-spinner.gif');

export type ChatRuntimeMobileChromeEnvironment = {
  colors: Theme['colors'];
  platform: typeof Platform.OS;
};

export function createChatRuntimeMobileChromeEnvironment(theme: Theme): ChatRuntimeMobileChromeEnvironment {
  return {
    colors: theme.colors,
    platform: Platform.OS,
  };
}

export function createChatRuntimeMobileStyles(theme: Theme) {
  const chatRuntimeChromeEnvironment = createChatRuntimeMobileChromeEnvironment(theme);
  const mobilePlatform = chatRuntimeChromeEnvironment.platform;
  const chatChromeStyleState = getChatRuntimeMobileChromeStyleRenderState(chatRuntimeChromeEnvironment);
  const headerChromeStyleState = chatChromeStyleState.header;
  const headerStyleState = headerChromeStyleState.header;
  const headerSurface = headerStyleState.surface;
  const headerAgentSelectorColors = headerStyleState.agentSelector;
  const headerAgentSelectorStyleSlots = createChatRuntimeAgentSelectorMobileStyleSlots({
    surface: headerSurface,
    colors: headerAgentSelectorColors,
  });
  const headerActionsRowStyleSlot = createChatRuntimeHeaderActionsRowMobileStyleSlot({
    surface: headerSurface.actionsRow,
  });
  const inactiveHeaderPinButtonColors = headerStyleState.pinButton.inactive;
  const activeHeaderPinButtonColors = headerStyleState.pinButton.active;
  const headerKillSwitchButtonColors = headerStyleState.killSwitchButton;
  const conversationChromeStyleState = chatChromeStyleState.conversation;
  const viewportStyleState = conversationChromeStyleState.viewport;
  const viewportSurface = viewportStyleState.surface;
  const viewportActivityStyleSlots = createChatRuntimeViewportActivityMobileStyleSlots({
    renderState: viewportStyleState,
  });
  const streamingContentStyleState = conversationChromeStyleState.streamingContent;
  const streamingContentStyleSlots = createChatRuntimeStreamingContentMobileStyleSlots({
    renderState: streamingContentStyleState,
    spacing,
    radius,
  });
  const connectionBannerStyleState = conversationChromeStyleState.connectionBanner;
  const connectionBannerStyleSlots = createChatRuntimeConnectionBannerMobileStyleSlots({
    renderState: connectionBannerStyleState,
    spacing,
    radius,
  });
  const retryStatusStyleState = conversationChromeStyleState.retryStatus;
  const retryStatusStyleSlots = createChatRuntimeRetryStatusMobileStyleSlots({
    renderState: retryStatusStyleState,
    spacing,
    radius,
  });
  const stepSummaryStyleState = conversationChromeStyleState.stepSummary;
  const stepSummaryStyleSlots = createChatRuntimeStepSummaryMobileStyleSlots({
    renderState: stepSummaryStyleState,
    spacing,
    radius,
  });
  const delegationCardStyleState = conversationChromeStyleState.delegationCard;
  const delegationCardStyleSlots = createChatRuntimeDelegationCardMobileStyleSlots({
    renderState: delegationCardStyleState,
    spacing,
    radius,
  });
  const scrollToBottomStyleState = conversationChromeStyleState.scrollToBottom;
  const scrollToBottomStyleSlots = createChatRuntimeScrollToBottomMobileStyleSlots({
    renderState: scrollToBottomStyleState,
    spacing,
  });
  const messageHistoryBannerStyleState = conversationChromeStyleState.messageHistoryBanner;
  const messageHistoryBannerStyleSlots = createChatRuntimeMessageHistoryBannerMobileStyleSlots({
    renderState: messageHistoryBannerStyleState,
    spacing,
    radius,
  });
  const composerChromeStyleState = chatChromeStyleState.composer;
  const composerStyleState = composerChromeStyleState.composer;
  const composerSurface = composerStyleState.surface;
  const composerTextInputSurface = composerSurface.input;
  const composerTextInputPlatform = composerStyleState.input;
  const mobileComposerSurfaceColors = composerStyleState.colors.surface;
  const mobileComposerTextColors = composerStyleState.colors.text;
  const inputAreaSurface = composerSurface.inputArea;
  const sttPreviewSurface = composerSurface.sttPreview;
  const voiceOverlaySurface = composerSurface.voiceOverlay;
  const imageAttachmentStyleState = composerChromeStyleState.imageAttachment;
  const imageAttachmentSurface = imageAttachmentStyleState.surface;
  const promptLibraryStyleState = composerChromeStyleState.promptLibrary;
  const promptLibrarySurface = promptLibraryStyleState.surface;
  const promptLibrarySurfaceColors = promptLibraryStyleState.colors;
  const promptEditorModalSurface = promptLibrarySurface.editorModal;
  const promptEditorInputPaddingVertical = composerChromeStyleState.promptEditorInputPaddingVertical;
  const messageQueuePanelWrapperState = chatChromeStyleState.messageQueuePanelWrapper;
  const messageQueuePanelWrapperStyleSlots = createMessageQueuePanelMobileWrapperStyleSlots({
    wrapper: messageQueuePanelWrapperState.wrapper,
    spacing,
  });
  const handsFreeStyleState = composerChromeStyleState.handsFree;
  const handsFreeSurface = handsFreeStyleState.surface;
  const headerActionButton = chatChromeStyleState.headerActionButton;
  const headerEdgeActionButton = chatChromeStyleState.headerEdgeActionButton;
  const headerPinButton = chatChromeStyleState.headerPinButton;
  const sessionStatusStyleState = headerChromeStyleState.sessionStatus;
  const sessionStatusSurface = sessionStatusStyleState.surface;
  const sessionStatusStyleSlots = createChatSessionStatusMobileChromeStyleSlots({
    surface: sessionStatusSurface,
  });
  const threadChromeStyleState = chatChromeStyleState.thread;
  const compactToolExecutionStyleState = threadChromeStyleState.compactToolExecution;
  const compactToolExecution = compactToolExecutionStyleState.surface;
  const toolExecutionDetailStyleState = threadChromeStyleState.toolExecutionDetail;
  const detailedToolExecution = toolExecutionDetailStyleState.surface;
  const viewportSurfaceColors = viewportStyleState.colors;
  const toolActivityGroupStyleState = threadChromeStyleState.toolActivityGroup;
  const toolActivityGroupStyleSlots = createChatRuntimeToolActivityGroupMobileStyleSlots({
    renderState: toolActivityGroupStyleState,
    spacing,
    radius,
    platform: mobilePlatform,
  });
  const imageAttachmentSurfaceColors = imageAttachmentStyleState.colors;
  const handsFreeSurfaceColors = handsFreeStyleState.colors;
  const toolApprovalStyleState = threadChromeStyleState.toolApproval;
  const toolApprovalStyleSlots = createChatRuntimeToolApprovalMobileStyleSlots({
    renderState: toolApprovalStyleState,
    spacing,
    radius,
    platform: mobilePlatform,
  });
  const mobileMessageThreadStyleState = threadChromeStyleState.messageThread;
  const mobileMessageStyleState = mobileMessageThreadStyleState.message;
  const mobileMessageSurface = mobileMessageStyleState.surface;
  const mobileMessageContentLayout = mobileMessageStyleState.contentLayout;
  const mobileMessageCollapsedPreview = mobileMessageStyleState.collapsedPreview;
  const mobileMessageCollapsedPreviewColors = mobileMessageStyleState.colors.collapsedPreview;
  const mobileMessageToneColors = mobileMessageStyleState.colors.tones;
  const toolExecutionDetailStyleColors = toolExecutionDetailStyleState.colors;
  const toolPayloadPreviewColors = toolExecutionDetailStyleColors.payloadPreview;
  const toolDetailCopyButtonColors = toolExecutionDetailStyleColors.copyButton;
  const toolResultBadgeSuccessColors = toolExecutionDetailStyleColors.badge.success;
  const toolResultBadgeErrorColors = toolExecutionDetailStyleColors.badge.error;
  const toolResultErrorColors = toolExecutionDetailStyleColors.error;
  const toolExecutionDetailContentColors = toolExecutionDetailStyleColors.content;
  const headerTurnDurationStyleState = headerChromeStyleState.turnDuration.standard;
  const headerTurnDurationLiveStyleState = headerChromeStyleState.turnDuration.live;
  const headerTurnDurationStyleSlots = createChatRuntimeTurnDurationHeaderMobileStyleSlots({
    renderState: headerTurnDurationStyleState,
    platform: mobilePlatform,
  });
  const headerTurnDurationLiveStyleSlots = createChatRuntimeTurnDurationHeaderMobileStyleSlots({
    renderState: headerTurnDurationLiveStyleState,
    platform: mobilePlatform,
  });
  const mobileMessageActionStyleState = mobileMessageThreadStyleState.action;
  const mobileMessageActionRow = mobileMessageActionStyleState.row;
  const mobileMessageExpansionButtonStyleSlots = createChatRuntimeMessageActionButtonMobileStyleSlots({
    renderState: mobileMessageActionStyleState.slotButtons.expansion,
  });
  const mobileMessageCopyButtonStyleSlots = createChatRuntimeMessageActionButtonMobileStyleSlots({
    renderState: mobileMessageActionStyleState.slotButtons.copy,
  });
  const mobileMessageBranchButtonStyleSlots = createChatRuntimeMessageActionButtonMobileStyleSlots({
    renderState: mobileMessageActionStyleState.slotButtons.branch,
  });
  const mobileMessageSpeechButtonStyleSlots = createChatRuntimeMessageActionButtonMobileStyleSlots({
    renderState: mobileMessageActionStyleState.slotButtons.speech,
  });
  const mobileMessageCopiedButtonStyleSlots = createChatRuntimeMessageActionButtonMobileStyleSlots({
    renderState: mobileMessageActionStyleState.activeSlotButtons.copy,
  });
  const mobileMessageSpeechActiveButtonStyleSlots = createChatRuntimeMessageActionButtonMobileStyleSlots({
    renderState: mobileMessageActionStyleState.activeSlotButtons.speech,
  });
  const mobileMessageTurnDurationRenderState = mobileMessageThreadStyleState.turnDuration.standard;
  const mobileMessageTurnDurationLiveRenderState = mobileMessageThreadStyleState.turnDuration.live;
  const mobileMessageTurnDurationStyleSlots = createChatRuntimeTurnDurationMessageMobileStyleSlots({
    renderState: mobileMessageTurnDurationRenderState,
    platform: mobilePlatform,
  });
  const mobileMessageTurnDurationLiveStyleSlots = createChatRuntimeTurnDurationMessageMobileStyleSlots({
    renderState: mobileMessageTurnDurationLiveRenderState,
    platform: mobilePlatform,
  });
  const toolExecutionStatusColors = compactToolExecutionStyleState.statusColors;
  const toolExecutionDetailColorsByState = toolExecutionDetailStyleColors.byState;
  const inactiveHeaderPinButtonStyleSlot = createChatRuntimeHeaderPinButtonMobileStyleSlot({
    touchTarget: headerPinButton,
    borderRadius: radius[headerSurface.pinButton.borderRadius],
    borderWidth: headerSurface.pinButton.borderWidth,
    colors: inactiveHeaderPinButtonColors.button,
  });
  const activeHeaderPinButtonStyleSlot = createChatRuntimeHeaderPinButtonMobileStyleSlot({
    touchTarget: headerPinButton,
    borderRadius: radius[headerSurface.pinButton.borderRadius],
    borderWidth: headerSurface.pinButton.borderWidth,
    colors: activeHeaderPinButtonColors.button,
  });
  return StyleSheet.create({
    keyboardAvoidingContainer: {
      flex: viewportSurface.flex,
      backgroundColor: viewportSurfaceColors.backgroundColor,
    },
    chatRoot: {
      flex: viewportSurface.flex,
    },
    chatScroll: {
      flex: viewportSurface.flex,
      paddingHorizontal: spacing[viewportSurface.paddingHorizontal],
      paddingVertical: spacing[viewportSurface.paddingVertical],
      backgroundColor: viewportSurfaceColors.backgroundColor,
    },
    chatScrollContent: {
      gap: spacing[viewportSurface.contentGap],
    },
    loadingState: {
      ...viewportActivityStyleSlots.loadingState,
    },
    loadingSpinner: {
      ...viewportActivityStyleSlots.loadingSpinner,
    },
    inlineActivityIndicator: {
      ...viewportActivityStyleSlots.inlineActivityIndicator,
    },
    inlineActivitySpinner: {
      ...viewportActivityStyleSlots.inlineActivitySpinner,
    },
    streamingContentHeader: {
      ...streamingContentStyleSlots.header,
    },
    streamingContentTitle: {
      ...streamingContentStyleSlots.title,
    },
    streamingContentSpinner: {
      ...streamingContentStyleSlots.spinner,
    },
    streamingContentBadge: {
      ...streamingContentStyleSlots.badge,
    },
    streamingContentBadgeText: {
      ...streamingContentStyleSlots.badgeText,
    },
    streamingContentBodyRow: {
      ...streamingContentStyleSlots.bodyRow,
    },
    streamingContentText: {
      ...streamingContentStyleSlots.text,
    },
    streamingContentCaret: {
      ...streamingContentStyleSlots.caret,
    },
    messageQueuePanelWrapper: {
      ...messageQueuePanelWrapperStyleSlots.wrapper,
    },
    headerAgentSelectorButton: {
      ...headerAgentSelectorStyleSlots.button,
    },
    headerAgentSelectorChip: {
      ...headerAgentSelectorStyleSlots.chip,
    },
    headerAgentSelectorText: {
      ...headerAgentSelectorStyleSlots.text,
    },
    headerActionsRow: {
      ...headerActionsRowStyleSlot,
    },
    headerConversationChip: {
      ...sessionStatusStyleSlots.chip,
    },
    headerConversationChipText: {
      ...sessionStatusStyleSlots.text,
    },
    headerConversationSpinner: {
      ...sessionStatusStyleSlots.spinner,
    },
    headerDurationChip: {
      ...headerTurnDurationStyleSlots.chip,
    },
    headerDurationChipLive: {
      ...headerTurnDurationLiveStyleSlots.chip,
    },
    headerDurationChipText: {
      ...headerTurnDurationStyleSlots.text,
    },
    headerDurationChipTextLive: {
      ...headerTurnDurationLiveStyleSlots.text,
    },
    headerActionButton,
    headerEdgeActionButton,
    headerPinButton: {
      ...inactiveHeaderPinButtonStyleSlot,
    },
    headerPinButtonActive: {
      ...activeHeaderPinButtonStyleSlot,
    },
    headerKillSwitchIconContainer: {
      ...createChatRuntimeHeaderIconContainerMobileStyleSlot({
        size: headerSurface.killSwitchButton.size,
        borderRadius: headerSurface.killSwitchButton.borderRadius,
        backgroundColor: headerKillSwitchButtonColors.button.backgroundColor,
        alignItems: headerSurface.killSwitchButton.alignItems,
        justifyContent: headerSurface.killSwitchButton.justifyContent,
      }),
    },
    headerHandsFreeIconContainer: {
      ...createChatRuntimeHeaderIconContainerMobileStyleSlot({
        size: headerSurface.handsFreeButton.size,
        alignItems: headerSurface.handsFreeButton.alignItems,
        justifyContent: headerSurface.handsFreeButton.justifyContent,
      }),
    },
    loadOlderContainer: {
      ...messageHistoryBannerStyleSlots.container,
    },
    loadOlderText: {
      ...messageHistoryBannerStyleSlots.summaryText,
    },
    loadOlderButton: {
      ...messageHistoryBannerStyleSlots.loadButton,
    },
    loadOlderButtonPressed: {
      ...messageHistoryBannerStyleSlots.loadButtonPressed,
    },
    loadOlderButtonText: {
      ...messageHistoryBannerStyleSlots.loadButtonText,
    },
    // Compact desktop-style messages: full-width role cards with shared tone semantics.
    msg: {
      paddingHorizontal: spacing[mobileMessageSurface.paddingHorizontal],
      paddingVertical: spacing[mobileMessageSurface.paddingVertical],
      marginBottom: spacing[mobileMessageSurface.marginBottom],
      width: mobileMessageSurface.width,
      borderWidth: theme[mobileMessageSurface.borderWidth],
      borderRadius: radius[mobileMessageSurface.borderRadius],
    },
    user: mobileMessageToneColors.user,
    assistant: mobileMessageToneColors.assistant,
    assistantFinal: mobileMessageToneColors.assistant_final,
    tool: mobileMessageToneColors.tool,
    retryStatusCard: {
      ...retryStatusStyleSlots.card,
    },
    retryStatusHeader: {
      ...retryStatusStyleSlots.header,
    },
    retryStatusTitle: {
      ...retryStatusStyleSlots.title,
    },
    retryStatusMetaRow: {
      ...retryStatusStyleSlots.metaRow,
    },
    retryStatusAttempt: {
      ...retryStatusStyleSlots.attempt,
    },
    retryStatusCountdown: {
      ...retryStatusStyleSlots.countdown,
    },
    retryStatusDescription: {
      ...retryStatusStyleSlots.description,
    },
    stepSummaryCard: {
      ...stepSummaryStyleSlots.card,
    },
    stepSummaryHeader: {
      ...stepSummaryStyleSlots.header,
    },
    stepSummaryTitle: {
      ...stepSummaryStyleSlots.title,
    },
    stepSummaryBadge: {
      ...stepSummaryStyleSlots.badge,
    },
    stepSummaryBadgeText: {
      ...stepSummaryStyleSlots.badgeText,
    },
    stepSummaryAction: {
      ...stepSummaryStyleSlots.action,
    },
    stepSummaryMeta: {
      ...stepSummaryStyleSlots.meta,
    },
    stepSummaryPreview: {
      ...stepSummaryStyleSlots.preview,
    },
    delegationCard: {
      ...delegationCardStyleSlots.card,
    },
    delegationHeader: {
      ...delegationCardStyleSlots.header,
    },
    delegationTitle: {
      ...delegationCardStyleSlots.title,
    },
    delegationStatusBadge: {
      ...delegationCardStyleSlots.statusBadge,
    },
    delegationStatusText: {
      ...delegationCardStyleSlots.statusText,
    },
    delegationLiveText: {
      ...delegationCardStyleSlots.liveText,
    },
    delegationSubtitle: {
      ...delegationCardStyleSlots.subtitle,
    },
    delegationMetaRow: {
      ...delegationCardStyleSlots.metaRow,
    },
    delegationMetaText: {
      ...delegationCardStyleSlots.metaText,
    },
    delegationConversationPreview: {
      ...delegationCardStyleSlots.conversationPreview,
    },
    delegationConversationPreviewLine: {
      ...delegationCardStyleSlots.conversationPreviewLine,
    },
    delegationConversationPreviewRole: {
      ...delegationCardStyleSlots.conversationPreviewRole,
    },
    delegationConversationPreviewContent: {
      ...delegationCardStyleSlots.conversationPreviewContent,
    },
    delegationConversationPreviewTimestamp: {
      ...delegationCardStyleSlots.conversationPreviewTimestamp,
    },
    delegationConversationPreviewMoreButton: {
      ...delegationCardStyleSlots.conversationPreviewMoreButton,
    },
    delegationConversationPreviewMoreButtonPressed: {
      ...delegationCardStyleSlots.conversationPreviewMoreButtonPressed,
    },
    delegationConversationPreviewMore: {
      ...delegationCardStyleSlots.conversationPreviewMore,
    },
    delegationToolPreview: {
      ...delegationCardStyleSlots.toolPreview,
    },
    delegationToolPreviewLabel: {
      ...delegationCardStyleSlots.toolPreviewLabel,
    },
    delegationToolPreviewLine: {
      ...delegationCardStyleSlots.toolPreviewLine,
    },
    delegationToolPreviewStatusIcon: {
      width: compactToolExecution.statusIcon.width,
      ...delegationCardStyleSlots.toolPreviewStatusIcon,
    },
    delegationToolPreviewName: {
      ...delegationCardStyleSlots.toolPreviewName,
    },
    delegationToolPreviewMoreButton: {
      ...delegationCardStyleSlots.toolPreviewMoreButton,
    },
    delegationToolPreviewMoreButtonPressed: {
      ...delegationCardStyleSlots.toolPreviewMoreButtonPressed,
    },
    delegationToolPreviewMore: {
      ...delegationCardStyleSlots.toolPreviewMore,
    },
    inputArea: {
      borderTopWidth: theme[inputAreaSurface.borderTopWidthToken],
      borderColor: mobileComposerSurfaceColors.inputArea.borderColor,
      backgroundColor: mobileComposerSurfaceColors.inputArea.backgroundColor,
    },
    pendingImagesRow: {
      paddingHorizontal: spacing[imageAttachmentSurface.row.paddingHorizontal],
      paddingTop: spacing[imageAttachmentSurface.row.paddingTop],
      paddingBottom: imageAttachmentSurface.row.paddingBottom,
      gap: spacing[imageAttachmentSurface.row.gap],
    },
    pendingImageCard: {
      width: imageAttachmentSurface.preview.size,
      height: imageAttachmentSurface.preview.size,
      borderRadius: radius[imageAttachmentSurface.preview.borderRadius],
      borderWidth: imageAttachmentSurface.preview.borderWidth,
      borderColor: imageAttachmentSurfaceColors.preview.borderColor,
      overflow: imageAttachmentSurface.preview.overflow,
      backgroundColor: imageAttachmentSurfaceColors.preview.backgroundColor,
      position: imageAttachmentSurface.preview.position,
    },
    pendingImagePreview: {
      width: imageAttachmentSurface.previewImage.width,
      height: imageAttachmentSurface.previewImage.height,
    },
    pendingImageRemoveButton: {
      position: imageAttachmentSurface.removeButton.position,
      top: imageAttachmentSurface.removeButton.top,
      right: imageAttachmentSurface.removeButton.right,
      width: imageAttachmentSurface.removeButton.size,
      height: imageAttachmentSurface.removeButton.size,
      borderRadius: imageAttachmentSurface.removeButton.borderRadius,
      backgroundColor: imageAttachmentSurfaceColors.removeButton.backgroundColor,
      alignItems: imageAttachmentSurface.removeButton.alignItems,
      justifyContent: imageAttachmentSurface.removeButton.justifyContent,
    },
    sttPreviewBox: {
      marginHorizontal: spacing[sttPreviewSurface.marginHorizontal],
      marginTop: spacing[sttPreviewSurface.marginTop],
      borderWidth: sttPreviewSurface.borderWidth,
      borderColor: mobileComposerSurfaceColors.sttPreview.borderColor,
      backgroundColor: mobileComposerSurfaceColors.sttPreview.backgroundColor,
      borderRadius: radius[sttPreviewSurface.borderRadius],
      paddingHorizontal: spacing[sttPreviewSurface.paddingHorizontal],
      paddingVertical: spacing[sttPreviewSurface.paddingVertical],
    },
    sttPreviewLabel: {
      color: mobileComposerTextColors.sttPreview.labelColor,
      marginBottom: sttPreviewSurface.labelMarginBottom,
      fontSize: sttPreviewSurface.labelFontSize,
      lineHeight: sttPreviewSurface.labelLineHeight,
      fontWeight: sttPreviewSurface.labelFontWeight,
    },
    sttPreviewText: {
      color: mobileComposerTextColors.sttPreview.textColor,
      fontSize: sttPreviewSurface.textFontSize,
      lineHeight: sttPreviewSurface.textLineHeight,
    },
    inputRow: {
      flexDirection: composerSurface.inputRow.flexDirection,
      alignItems: composerSurface.inputRow.alignItems,
      gap: spacing[composerSurface.inputRow.gap],
      paddingHorizontal: spacing[composerSurface.inputRow.paddingHorizontal],
      paddingVertical: spacing[composerSurface.inputRow.paddingVertical],
    },
    handsFreeStatusRow: {
      paddingHorizontal: spacing[handsFreeSurface.statusRow.paddingHorizontal],
      paddingTop: spacing[handsFreeSurface.statusRow.paddingTop],
    },
    handsFreeControlsRow: {
      flexDirection: handsFreeSurface.controlsRow.flexDirection,
      alignItems: handsFreeSurface.controlsRow.alignItems,
      gap: spacing[handsFreeSurface.controlsRow.gap],
      paddingHorizontal: spacing[handsFreeSurface.controlsRow.paddingHorizontal],
      paddingTop: spacing[handsFreeSurface.controlsRow.paddingTop],
    },
    handsFreeControlButton: {
      flex: handsFreeSurface.controlButton.flex,
      borderWidth: handsFreeSurface.controlButton.borderWidth,
      borderColor: handsFreeSurfaceColors.controlButton.borderColor,
      backgroundColor: handsFreeSurfaceColors.controlButton.backgroundColor,
      minHeight: handsFreeSurface.controlButton.minHeight,
      paddingHorizontal: spacing[handsFreeSurface.controlButton.paddingHorizontal],
      borderRadius: radius[handsFreeSurface.controlButton.borderRadius],
      alignItems: handsFreeSurface.controlButton.alignItems,
      justifyContent: handsFreeSurface.controlButton.justifyContent,
    },
    handsFreeControlButtonText: {
      color: handsFreeSurfaceColors.controlButtonText.color,
      fontWeight: handsFreeSurface.controlButtonText.fontWeight,
      fontSize: handsFreeSurface.controlButtonText.fontSize,
    },
    chatHomeCard: {
      marginHorizontal: spacing[promptLibrarySurface.quickStartCard.marginHorizontal],
      marginTop: spacing[promptLibrarySurface.quickStartCard.marginTop],
      padding: spacing[promptLibrarySurface.quickStartCard.padding],
      borderRadius: radius[promptLibrarySurface.quickStartCard.borderRadius],
      borderWidth: promptLibrarySurface.quickStartCard.borderWidth,
      borderColor: promptLibrarySurfaceColors.quickStartCard.borderColor,
      backgroundColor: promptLibrarySurfaceColors.quickStartCard.backgroundColor,
      gap: spacing[promptLibrarySurface.quickStartCard.gap],
    },
    chatHomeEmptyText: {
      color: promptLibrarySurfaceColors.emptyText.color,
      fontSize: promptLibrarySurface.emptyText.fontSize,
      lineHeight: promptLibrarySurface.emptyText.lineHeight,
      textAlign: promptLibrarySurface.emptyText.textAlign,
      paddingVertical: spacing[promptLibrarySurface.emptyText.paddingVertical],
    },
    chatHomeShortcutGrid: {
      flexDirection: promptLibrarySurface.shortcutGrid.flexDirection,
      flexWrap: promptLibrarySurface.shortcutGrid.flexWrap,
      gap: spacing[promptLibrarySurface.shortcutGrid.gap],
    },
    chatHomeShortcutCard: {
      minHeight: promptLibrarySurface.shortcutCard.minHeight,
      minWidth: promptLibrarySurface.shortcutCard.minWidth,
      flexGrow: promptLibrarySurface.shortcutCard.flexGrow,
      flexBasis: promptLibrarySurface.shortcutCard.flexBasis,
      paddingHorizontal: spacing[promptLibrarySurface.shortcutCard.paddingHorizontal],
      paddingVertical: spacing[promptLibrarySurface.shortcutCard.paddingVertical],
      borderRadius: radius[promptLibrarySurface.shortcutCard.borderRadius],
      borderWidth: promptLibrarySurface.shortcutCard.borderWidth,
      borderColor: promptLibrarySurfaceColors.shortcutCard.borderColor,
      backgroundColor: promptLibrarySurfaceColors.shortcutCard.backgroundColor,
      justifyContent: promptLibrarySurface.shortcutCard.justifyContent,
      gap: spacing[promptLibrarySurface.shortcutCard.gap],
    },
    chatHomeShortcutCardAdd: {
      borderStyle: promptLibrarySurface.addShortcutCard.borderStyle,
      borderColor: promptLibrarySurfaceColors.addShortcutCard.borderColor,
      backgroundColor: promptLibrarySurfaceColors.addShortcutCard.backgroundColor,
      alignItems: promptLibrarySurface.addShortcutCard.alignItems,
    },
    chatHomeShortcutAddIcon: {
      marginBottom: promptLibrarySurface.addShortcutIcon.marginBottom,
    },
    chatHomeShortcutCardDisabled: {
      opacity: promptLibrarySurface.shortcutCard.disabledOpacity,
    },
    chatHomeShortcutCardPressed: {
      opacity: promptLibrarySurface.shortcutCard.pressedOpacity,
      transform: [{ scale: promptLibrarySurface.shortcutCard.pressedScale }],
    },
    chatHomeShortcutSourcePill: {
      alignSelf: promptLibrarySurface.shortcutSourcePill.alignSelf,
      flexDirection: promptLibrarySurface.shortcutSourcePill.flexDirection,
      alignItems: promptLibrarySurface.shortcutSourcePill.alignItems,
      gap: spacing[promptLibrarySurface.shortcutSourcePill.gap],
      paddingHorizontal: spacing[promptLibrarySurface.shortcutSourcePill.paddingHorizontal],
      paddingVertical: promptLibrarySurface.shortcutSourcePill.paddingVertical,
      borderRadius: radius[promptLibrarySurface.shortcutSourcePill.borderRadius],
      backgroundColor: promptLibrarySurfaceColors.shortcutSourcePill.backgroundColor,
    },
    chatHomeShortcutSourceLabel: {
      color: promptLibrarySurfaceColors.shortcutSourceLabel.color,
      fontSize: promptLibrarySurface.shortcutSourceLabel.fontSize,
      fontWeight: promptLibrarySurface.shortcutSourceLabel.fontWeight,
      letterSpacing: promptLibrarySurface.shortcutSourceLabel.letterSpacing,
      textTransform: promptLibrarySurface.shortcutSourceLabel.textTransform,
    },
    chatHomeShortcutTitle: {
      color: promptLibrarySurfaceColors.shortcutTitle.color,
      fontSize: promptLibrarySurface.shortcutTitle.fontSize,
      lineHeight: promptLibrarySurface.shortcutTitle.lineHeight,
      fontWeight: promptLibrarySurface.shortcutTitle.fontWeight,
    },
    chatHomeShortcutTitleAdd: {
      color: promptLibrarySurfaceColors.addShortcutCard.titleColor,
      textAlign: promptLibrarySurface.addShortcutCard.titleTextAlign,
    },
    chatHomeShortcutDescription: {
      color: promptLibrarySurfaceColors.shortcutDescription.color,
      fontSize: promptLibrarySurface.shortcutDescription.fontSize,
      marginTop: promptLibrarySurface.shortcutDescription.marginTop,
      lineHeight: promptLibrarySurface.shortcutDescription.lineHeight,
    },
    chatHomeShortcutActions: {
      flexDirection: promptLibrarySurface.shortcutActions.flexDirection,
      flexWrap: promptLibrarySurface.shortcutActions.flexWrap,
      gap: spacing[promptLibrarySurface.shortcutActions.gap],
      marginTop: spacing[promptLibrarySurface.shortcutActions.marginTop],
    },
    chatHomeShortcutActionButton: {
      minHeight: promptLibrarySurface.shortcutActionButton.minHeight,
      paddingHorizontal: spacing[promptLibrarySurface.shortcutActionButton.paddingHorizontal],
      paddingVertical: promptLibrarySurface.shortcutActionButton.paddingVertical,
      borderRadius: radius[promptLibrarySurface.shortcutActionButton.borderRadius],
      borderWidth: promptLibrarySurface.shortcutActionButton.borderWidth,
      borderColor: promptLibrarySurfaceColors.shortcutActionButton.borderColor,
      backgroundColor: promptLibrarySurfaceColors.shortcutActionButton.backgroundColor,
      flexDirection: promptLibrarySurface.shortcutActionButton.flexDirection,
      alignItems: promptLibrarySurface.shortcutActionButton.alignItems,
      justifyContent: promptLibrarySurface.shortcutActionButton.justifyContent,
      gap: spacing[promptLibrarySurface.shortcutActionButton.gap],
    },
    chatHomeShortcutActionButtonPressed: {
      opacity: promptLibrarySurface.shortcutActionButton.pressedOpacity,
    },
    chatHomeShortcutActionText: {
      color: promptLibrarySurfaceColors.shortcutActionText.color,
      fontSize: promptLibrarySurface.shortcutActionText.fontSize,
      lineHeight: promptLibrarySurface.shortcutActionText.lineHeight,
      fontWeight: promptLibrarySurface.shortcutActionText.fontWeight,
    },
    chatHomeShortcutActionDangerText: {
      color: promptLibrarySurfaceColors.shortcutActionText.destructiveColor,
    },
    modalKeyboardAvoidingView: {
      flex: promptEditorModalSurface.keyboardAvoidingView.flex,
    },
    modalOverlay: {
      flex: promptEditorModalSurface.overlay.flex,
      backgroundColor: promptLibrarySurfaceColors.editorModal.overlay.backgroundColor,
      justifyContent: promptEditorModalSurface.overlay.justifyContent,
      padding: spacing[promptEditorModalSurface.overlay.padding],
    },
    modalContent: {
      backgroundColor: promptLibrarySurfaceColors.editorModal.content.backgroundColor,
      borderRadius: radius[promptEditorModalSurface.content.borderRadius],
      padding: spacing[promptEditorModalSurface.content.padding],
      borderWidth: promptEditorModalSurface.content.borderWidth,
      borderColor: promptLibrarySurfaceColors.editorModal.content.borderColor,
    },
    modalHeader: {
      flexDirection: promptEditorModalSurface.header.flexDirection,
      alignItems: promptEditorModalSurface.header.alignItems,
      justifyContent: promptEditorModalSurface.header.justifyContent,
      gap: spacing[promptEditorModalSurface.header.gap],
      marginBottom: spacing[promptEditorModalSurface.header.marginBottom],
    },
    modalTitle: {
      flex: promptEditorModalSurface.title.flex,
      fontSize: promptEditorModalSurface.title.fontSize,
      lineHeight: promptEditorModalSurface.title.lineHeight,
      fontWeight: promptEditorModalSurface.title.fontWeight,
      marginBottom: promptEditorModalSurface.title.marginBottom,
      color: promptLibrarySurfaceColors.editorModal.title.color,
    },
    modalCloseButton: {
      width: promptEditorModalSurface.closeButton.width,
      height: promptEditorModalSurface.closeButton.height,
      borderRadius: radius[promptEditorModalSurface.closeButton.borderRadius],
      alignItems: promptEditorModalSurface.closeButton.alignItems,
      justifyContent: promptEditorModalSurface.closeButton.justifyContent,
    },
    modalLabel: {
      fontSize: promptEditorModalSurface.label.fontSize,
      lineHeight: promptEditorModalSurface.label.lineHeight,
      fontWeight: promptEditorModalSurface.label.fontWeight,
      color: promptLibrarySurfaceColors.editorModal.label.color,
      marginBottom: spacing[promptEditorModalSurface.label.marginBottom],
    },
    modalInput: {
      borderWidth: promptEditorModalSurface.input.borderWidth,
      borderColor: promptLibrarySurfaceColors.editorModal.input.borderColor,
      borderRadius: radius[promptEditorModalSurface.input.borderRadius],
      paddingHorizontal: spacing[promptEditorModalSurface.input.paddingHorizontal],
      paddingVertical: promptEditorInputPaddingVertical,
      backgroundColor: promptLibrarySurfaceColors.editorModal.input.backgroundColor,
      marginBottom: spacing[promptEditorModalSurface.input.marginBottom],
      color: promptLibrarySurfaceColors.editorModal.input.color,
      fontSize: promptEditorModalSurface.input.fontSize,
    },
    modalInputMultiline: {
      height: promptEditorModalSurface.multilineInput.height,
      paddingTop: spacing[promptEditorModalSurface.multilineInput.paddingTop],
      paddingBottom: spacing[promptEditorModalSurface.multilineInput.paddingBottom],
    },
    modalActions: {
      flexDirection: promptEditorModalSurface.actions.flexDirection,
      justifyContent: promptEditorModalSurface.actions.justifyContent,
      gap: spacing[promptEditorModalSurface.actions.gap],
      marginTop: spacing[promptEditorModalSurface.actions.marginTop],
    },
    modalCancelButton: {
      paddingHorizontal: spacing[promptEditorModalSurface.cancelButton.paddingHorizontal],
      paddingVertical: spacing[promptEditorModalSurface.cancelButton.paddingVertical],
      borderRadius: radius[promptEditorModalSurface.cancelButton.borderRadius],
    },
    modalCancelButtonText: {
      color: promptLibrarySurfaceColors.editorModal.cancelButtonText.color,
      fontWeight: promptEditorModalSurface.actionText.fontWeight,
    },
    modalSaveButton: {
      paddingHorizontal: spacing[promptEditorModalSurface.saveButton.paddingHorizontal],
      paddingVertical: spacing[promptEditorModalSurface.saveButton.paddingVertical],
      borderRadius: radius[promptEditorModalSurface.saveButton.borderRadius],
      backgroundColor: promptLibrarySurfaceColors.editorModal.saveButton.backgroundColor,
      minWidth: promptEditorModalSurface.saveButton.minWidth,
      alignItems: promptEditorModalSurface.saveButton.alignItems,
    },
    modalSaveButtonDisabled: {
      opacity: promptEditorModalSurface.saveButton.disabledOpacity,
    },
    modalSaveButtonText: {
      color: promptLibrarySurfaceColors.editorModal.saveButtonText.color,
      fontWeight: promptEditorModalSurface.actionText.fontWeight,
    },
    input: {
      borderWidth: composerTextInputSurface.borderWidth,
      borderColor: mobileComposerSurfaceColors.input.borderColor,
      borderRadius: radius[composerTextInputSurface.borderRadius],
      paddingHorizontal: spacing[composerTextInputSurface.paddingHorizontal],
      paddingVertical: composerTextInputPlatform.paddingVertical,
      backgroundColor: mobileComposerSurfaceColors.input.backgroundColor,
      color: mobileComposerTextColors.input.color,
      fontSize: composerTextInputSurface.fontSize,
      flex: composerTextInputSurface.flex,
      maxHeight: composerTextInputSurface.maxHeight,
    },
    visuallyHiddenComposerHint: {
      position: composerSurface.visuallyHiddenComposerHint.position,
      left: composerSurface.visuallyHiddenComposerHint.left,
      width: composerSurface.visuallyHiddenComposerHint.width,
      height: composerSurface.visuallyHiddenComposerHint.height,
    },
    micWrapper: {
      paddingHorizontal: spacing[inputAreaSurface.micWrapperPaddingHorizontal],
      paddingBottom: spacing[inputAreaSurface.micWrapperPaddingBottom],
    },
    mic: {
      width: composerSurface.micButton.width,
      height: composerSurface.micButton.height,
      flexDirection: composerSurface.micButton.flexDirection,
      borderRadius: radius[composerSurface.micButton.borderRadius],
      borderWidth: composerSurface.micButton.borderWidth,
      borderColor: mobileComposerSurfaceColors.micButton.borderColor,
      backgroundColor: mobileComposerSurfaceColors.micButton.backgroundColor,
      alignItems: composerSurface.micButton.alignItems,
      justifyContent: composerSurface.micButton.justifyContent,
      gap: spacing[composerSurface.micButton.gap],
    },
    micOn: {
      backgroundColor: mobileComposerSurfaceColors.micButton.activeBackgroundColor,
      borderColor: mobileComposerSurfaceColors.micButton.activeBorderColor,
    },
    micLabel: {
      fontSize: composerSurface.micButton.labelFontSize,
      color: mobileComposerTextColors.micButton.color,
      fontWeight: composerSurface.micButton.labelFontWeight,
    },
    micLabelOn: {
      color: mobileComposerTextColors.micButton.activeColor,
    },
    ttsToggle: {
      width: composerSurface.accessoryButton.size,
      height: composerSurface.accessoryButton.size,
      borderRadius: composerSurface.accessoryButton.borderRadius,
      borderWidth: composerSurface.accessoryButton.borderWidth,
      borderColor: mobileComposerSurfaceColors.accessoryButton.borderColor,
      backgroundColor: mobileComposerSurfaceColors.accessoryButton.backgroundColor,
      alignItems: composerSurface.accessoryButton.alignItems,
      justifyContent: composerSurface.accessoryButton.justifyContent,
    },
    ttsToggleOn: {
      backgroundColor: mobileComposerSurfaceColors.accessoryButton.activeBackgroundColor,
      borderColor: mobileComposerSurfaceColors.accessoryButton.activeBorderColor,
    },
    sendButton: {
      backgroundColor: mobileComposerSurfaceColors.submitButton.backgroundColor,
      minHeight: composerSurface.submitButton.minHeight,
      minWidth: composerSurface.submitButton.minWidth,
      paddingHorizontal: spacing[composerSurface.submitButton.paddingHorizontal],
      paddingVertical: spacing[composerSurface.submitButton.paddingVertical],
      borderRadius: radius[composerSurface.submitButton.borderRadius],
      flexDirection: composerSurface.submitButton.flexDirection,
      alignItems: composerSurface.submitButton.alignItems,
      justifyContent: composerSurface.submitButton.justifyContent,
      gap: composerSurface.submitButton.gap,
    },
    queueButton: {
      borderWidth: composerSurface.queueButton.borderWidth,
      borderColor: mobileComposerSurfaceColors.queueButton.borderColor,
      backgroundColor: mobileComposerSurfaceColors.queueButton.backgroundColor,
      minHeight: composerSurface.submitButton.minHeight,
      minWidth: composerSurface.submitButton.minWidth,
      paddingHorizontal: spacing[composerSurface.submitButton.paddingHorizontal],
      paddingVertical: spacing[composerSurface.submitButton.paddingVertical],
      borderRadius: radius[composerSurface.submitButton.borderRadius],
      flexDirection: composerSurface.submitButton.flexDirection,
      alignItems: composerSurface.submitButton.alignItems,
      justifyContent: composerSurface.submitButton.justifyContent,
      gap: composerSurface.submitButton.gap,
    },
    sendButtonDisabled: {
      opacity: composerSurface.submitButton.disabledOpacity,
    },
    queueButtonText: {
      color: mobileComposerTextColors.queueButton.color,
      fontWeight: composerSurface.submitButton.fontWeight,
      fontSize: composerSurface.submitButton.fontSize,
    },
    sendButtonText: {
      color: mobileComposerTextColors.submitButton.color,
      fontWeight: composerSurface.submitButton.fontWeight,
      fontSize: composerSurface.submitButton.fontSize,
    },
    debugInfo: {
      backgroundColor: handsFreeSurfaceColors.debugPanel.backgroundColor,
      padding: spacing[handsFreeSurface.debugPanel.padding],
      margin: spacing[handsFreeSurface.debugPanel.margin],
      borderRadius: radius[handsFreeSurface.debugPanel.borderRadius],
      borderLeftWidth: handsFreeSurface.debugPanel.borderLeftWidth,
      borderLeftColor: handsFreeSurfaceColors.debugPanel.borderLeftColor,
    },
    debugText: {
      fontSize: handsFreeSurface.debugText.fontSize,
      color: handsFreeSurfaceColors.debugText.color,
      fontFamily: resolveChatRuntimeMobileFontFamily(handsFreeSurface.debugText.fontFamilyByPlatform, mobilePlatform),
    },
    connectionBanner: {
      ...connectionBannerStyleSlots.banner,
    },
    connectionBannerReconnecting: {
      ...connectionBannerStyleSlots.reconnecting,
    },
    connectionBannerFailed: {
      ...connectionBannerStyleSlots.failed,
    },
    connectionBannerContent: {
      ...connectionBannerStyleSlots.content,
    },
    connectionBannerIcon: {
      ...connectionBannerStyleSlots.icon,
    },
    connectionBannerTextContainer: {
      ...connectionBannerStyleSlots.textContainer,
    },
    connectionBannerText: {
      ...connectionBannerStyleSlots.title,
    },
    connectionBannerSubtext: {
      ...connectionBannerStyleSlots.subtitle,
    },
    retryButton: {
      ...connectionBannerStyleSlots.retryButton,
    },
    retryButtonText: {
      ...connectionBannerStyleSlots.retryButtonText,
    },
    scrollToBottomButton: {
      ...scrollToBottomStyleSlots.button,
    },
    overlay: {
      position: voiceOverlaySurface.position,
      left: voiceOverlaySurface.left,
      right: voiceOverlaySurface.right,
      bottom: voiceOverlaySurface.bottomOffset,
      // Ensure the live transcription overlay renders above the input area.
      zIndex: voiceOverlaySurface.zIndex,
      elevation: voiceOverlaySurface.elevation,
      alignItems: voiceOverlaySurface.alignItems,
      paddingHorizontal: spacing[voiceOverlaySurface.paddingHorizontal],
      paddingBottom: spacing[voiceOverlaySurface.paddingBottom],
    },
    overlayCard: {
      maxWidth: voiceOverlaySurface.cardMaxWidth,
      borderRadius: radius[voiceOverlaySurface.cardBorderRadius],
      backgroundColor: mobileComposerSurfaceColors.voiceOverlay.cardBackgroundColor,
      paddingHorizontal: voiceOverlaySurface.cardPaddingHorizontal,
      paddingVertical: voiceOverlaySurface.cardPaddingVertical,
    },
    overlayText: {
      color: mobileComposerTextColors.voiceOverlay.color,
      fontSize: voiceOverlaySurface.textFontSize,
      lineHeight: voiceOverlaySurface.textLineHeight,
      textAlign: voiceOverlaySurface.textAlign,
    },
    overlayTranscript: {
      color: mobileComposerTextColors.voiceOverlay.color,
      marginTop: voiceOverlaySurface.transcriptMarginTop,
      fontSize: voiceOverlaySurface.transcriptFontSize,
      lineHeight: voiceOverlaySurface.transcriptLineHeight,
      opacity: voiceOverlaySurface.transcriptOpacity,
    },
    toolApprovalCard: {
      ...toolApprovalStyleSlots.card,
    },
    toolApprovalHeader: {
      ...toolApprovalStyleSlots.header,
    },
    toolApprovalContent: {
      ...toolApprovalStyleSlots.content,
    },
    toolApprovalContentDisabled: {
      ...toolApprovalStyleSlots.contentDisabled,
    },
    toolApprovalTitle: {
      ...toolApprovalStyleSlots.title,
    },
    toolApprovalToolRow: {
      ...toolApprovalStyleSlots.toolRow,
    },
    toolApprovalToolLabel: {
      ...toolApprovalStyleSlots.toolLabel,
    },
    toolApprovalTool: {
      ...toolApprovalStyleSlots.tool,
    },
    toolApprovalArgumentsPreview: {
      ...toolApprovalStyleSlots.argumentsPreview,
    },
    toolApprovalArgumentsToggle: {
      ...toolApprovalStyleSlots.argumentsToggle,
    },
    toolApprovalArgumentsTogglePressed: {
      ...toolApprovalStyleSlots.argumentsTogglePressed,
    },
    toolApprovalArgumentsToggleText: {
      ...toolApprovalStyleSlots.argumentsToggleText,
    },
    toolApprovalArgumentsScroll: {
      ...toolApprovalStyleSlots.argumentsScroll,
    },
    toolApprovalArgumentsFull: {
      ...toolApprovalStyleSlots.argumentsFull,
    },
    toolApprovalActions: {
      ...toolApprovalStyleSlots.actions,
    },
    toolApprovalButton: {
      ...toolApprovalStyleSlots.button,
    },
    toolApprovalButtonDisabled: {
      ...toolApprovalStyleSlots.buttonDisabled,
    },
    toolApprovalApproveButton: {
      ...toolApprovalStyleSlots.approveButton,
    },
    toolApprovalApproveButtonText: {
      ...toolApprovalStyleSlots.approveButtonText,
    },
    toolApprovalDenyButton: {
      ...toolApprovalStyleSlots.denyButton,
    },
    toolApprovalDenyButtonText: {
      ...toolApprovalStyleSlots.denyButtonText,
    },
    // Unified Tool Execution Card styles - compact left-accent design matching desktop
    toolExecutionCard: {
      marginTop: detailedToolExecution.card.marginTop,
      borderRadius: radius[detailedToolExecution.card.borderRadius],
      borderLeftWidth: detailedToolExecution.card.borderLeftWidth,
      ...toolExecutionDetailColorsByState.idle,
      overflow: detailedToolExecution.card.overflow,
    },
    toolExecutionPending: toolExecutionDetailColorsByState.pending,
    toolExecutionSuccess: toolExecutionDetailColorsByState.success,
    toolExecutionError: toolExecutionDetailColorsByState.error,
    toolExecutionExpandedContainer: {
      position: detailedToolExecution.expandedContainer.position,
    },
    toolExecutionCollapseTopButton: {
      marginBottom: detailedToolExecution.collapseButton.topMarginBottom,
    },
    toolExecutionCollapseBottomButton: {
      marginTop: detailedToolExecution.collapseButton.bottomMarginTop,
    },
    toolCallCompactContainer: {
      paddingVertical: compactToolExecution.container.paddingVertical,
      paddingHorizontal: compactToolExecution.container.paddingHorizontal,
      borderRadius: radius[compactToolExecution.container.borderRadius],
      gap: compactToolExecution.container.gap,
    },
    toolCallCompactLine: {
      flexDirection: compactToolExecution.line.flexDirection,
      alignItems: compactToolExecution.line.alignItems,
      gap: compactToolExecution.line.gap,
      paddingVertical: compactToolExecution.line.paddingVertical,
      overflow: compactToolExecution.line.overflow,
    },
    toolCallCompactLeadingIcon: {
      width: compactToolExecution.toolIcon.width,
      alignItems: compactToolExecution.iconCell.alignItems,
      justifyContent: compactToolExecution.iconCell.justifyContent,
      flexShrink: compactToolExecution.iconCell.flexShrink,
    },
    toolCallCompactPressed: {
      opacity: compactToolExecution.pressedOpacity,
    },
    toolCallCompactName: {
      fontFamily: resolveChatRuntimeMobileFontFamily(compactToolExecution.name.fontFamilyByPlatform, mobilePlatform),
      fontSize: compactToolExecution.name.fontSize,
      fontWeight: compactToolExecution.name.fontWeight,
      flexShrink: compactToolExecution.name.flexShrink,
      minWidth: compactToolExecution.name.minWidth,
      color: toolExecutionStatusColors.idle,
    },
    toolCallCompactNamePending: {
      color: toolExecutionStatusColors.pending,
    },
    toolCallCompactNameSuccess: {
      color: toolExecutionStatusColors.success,
    },
    toolCallCompactNameError: {
      color: toolExecutionStatusColors.error,
    },
    toolCallCompactStatusIndicator: {
      width: compactToolExecution.statusIcon.width,
      alignItems: compactToolExecution.iconCell.alignItems,
      justifyContent: compactToolExecution.iconCell.justifyContent,
      flexShrink: compactToolExecution.iconCell.flexShrink,
    },
    toolCallCompactToggleIcon: {
      width: compactToolExecution.toggleIcon.width,
      alignItems: compactToolExecution.iconCell.alignItems,
      justifyContent: compactToolExecution.iconCell.justifyContent,
      flexShrink: compactToolExecution.iconCell.flexShrink,
    },
    toolCallCompactStatusPending: {
      color: toolExecutionStatusColors.pending,
    },
    toolCallCompactStatusSuccess: {
      color: toolExecutionStatusColors.success,
    },
    toolCallCompactStatusError: {
      color: toolExecutionStatusColors.error,
    },
    // Tool-activity group styles (collapsed-by-default grouping of consecutive tool calls)
    toolActivityGroupCollapsed: {
      ...toolActivityGroupStyleSlots.collapsed,
    },
    toolActivityGroupPressed: {
      ...toolActivityGroupStyleSlots.pressed,
    },
    toolActivityGroupHeaderRow: {
      ...toolActivityGroupStyleSlots.headerRow,
    },
    toolActivityGroupCountBadge: {
      ...toolActivityGroupStyleSlots.countBadge,
    },
    toolActivityGroupCountBadgeText: {
      ...toolActivityGroupStyleSlots.countBadgeText,
    },
    toolActivityGroupPreviewLine: {
      ...toolActivityGroupStyleSlots.previewLine,
    },
    toolActivityGroupFooterButton: {
      ...toolActivityGroupStyleSlots.footerButton,
    },
    toolActivityGroupFooterText: {
      ...toolActivityGroupStyleSlots.footerText,
    },
    toolParamsSection: {
      paddingHorizontal: spacing[detailedToolExecution.blockSection.paddingHorizontal],
      paddingVertical: detailedToolExecution.blockSection.paddingVertical,
    },
    toolCallSection: {
      marginBottom: spacing[detailedToolExecution.section.marginBottom],
      paddingBottom: spacing[detailedToolExecution.section.paddingBottom],
      borderBottomWidth: detailedToolExecution.section.borderBottomWidth,
      borderBottomColor: toolExecutionDetailContentColors.section.borderBottomColor,
    },
    toolName: {
      fontFamily: resolveChatRuntimeMobileFontFamily(detailedToolExecution.toolName.fontFamilyByPlatform, mobilePlatform),
      fontWeight: detailedToolExecution.toolName.fontWeight,
      color: toolExecutionDetailContentColors.toolName.color,
      fontSize: detailedToolExecution.toolName.fontSize,
      flex: detailedToolExecution.toolName.flex,
    },
    toolCallHeader: {
      flexDirection: detailedToolExecution.header.flexDirection,
      alignItems: detailedToolExecution.header.alignItems,
      justifyContent: detailedToolExecution.header.justifyContent,
      paddingVertical: spacing[detailedToolExecution.header.paddingVertical],
      marginBottom: spacing[detailedToolExecution.header.marginBottom],
      minHeight: detailedToolExecution.header.minHeight,
    },
    toolCallHeaderPressed: {
      opacity: detailedToolExecution.header.pressedOpacity,
    },
    toolCallExpandHint: {
      flexDirection: detailedToolExecution.expandHint.flexDirection,
      alignItems: detailedToolExecution.expandHint.alignItems,
      gap: detailedToolExecution.expandHint.gap,
    },
    toolCallExpandHintText: {
      fontSize: detailedToolExecution.expandHint.fontSize,
      color: toolExecutionDetailContentColors.expandHintText.color,
      fontWeight: detailedToolExecution.expandHint.fontWeight,
    },
    toolSectionLabel: {
      fontSize: detailedToolExecution.sectionLabel.fontSize,
      fontWeight: detailedToolExecution.sectionLabel.fontWeight,
      color: toolExecutionDetailContentColors.sectionLabel.color,
      marginBottom: detailedToolExecution.sectionLabel.marginBottom,
      textTransform: detailedToolExecution.sectionLabel.textTransform,
      letterSpacing: detailedToolExecution.sectionLabel.letterSpacing,
    },
    toolDetailHeaderRow: {
      flexDirection: detailedToolExecution.detailHeaderRow.flexDirection,
      alignItems: detailedToolExecution.detailHeaderRow.alignItems,
      justifyContent: detailedToolExecution.detailHeaderRow.justifyContent,
      gap: detailedToolExecution.detailHeaderRow.gap,
      marginBottom: detailedToolExecution.detailHeaderRow.marginBottom,
    },
    toolPayloadMetaRow: {
      flexDirection: detailedToolExecution.payloadMeta.flexDirection,
      alignItems: detailedToolExecution.payloadMeta.alignItems,
      minWidth: detailedToolExecution.payloadMeta.minWidth,
      gap: detailedToolExecution.payloadMeta.gap,
      marginBottom: detailedToolExecution.payloadMeta.marginBottom,
    },
    toolPayloadType: {
      fontSize: detailedToolExecution.payloadType.fontSize,
      fontWeight: detailedToolExecution.payloadType.fontWeight,
      opacity: detailedToolExecution.payloadType.opacity,
      color: toolExecutionDetailContentColors.payloadType.color,
    },
    toolPayloadPreview: {
      fontFamily: resolveChatRuntimeMobileFontFamily(detailedToolExecution.payloadPreview.fontFamilyByPlatform, mobilePlatform),
      fontSize: detailedToolExecution.payloadPreview.fontSize,
      lineHeight: detailedToolExecution.payloadPreview.lineHeight,
      paddingHorizontal: detailedToolExecution.payloadPreview.paddingHorizontal,
      paddingVertical: detailedToolExecution.payloadPreview.paddingVertical,
      borderRadius: radius[detailedToolExecution.payloadPreview.borderRadius],
      backgroundColor: toolPayloadPreviewColors.backgroundColor,
      color: toolPayloadPreviewColors.color,
      marginBottom: detailedToolExecution.result.headerMarginBottom,
    },
    toolDetailCopyButton: {
      minHeight: detailedToolExecution.copyButton.minHeight,
      paddingHorizontal: detailedToolExecution.copyButton.paddingHorizontal,
      paddingVertical: detailedToolExecution.copyButton.paddingVertical,
      borderRadius: radius[detailedToolExecution.copyButton.borderRadius],
      backgroundColor: toolDetailCopyButtonColors.backgroundColor,
      flexDirection: detailedToolExecution.copyButton.flexDirection,
      alignItems: detailedToolExecution.copyButton.alignItems,
      justifyContent: detailedToolExecution.copyButton.justifyContent,
      gap: detailedToolExecution.copyButton.gap,
      flexShrink: detailedToolExecution.copyButton.flexShrink,
    } as const,
    toolDetailCopyButtonPressed: {
      opacity: detailedToolExecution.copyButton.pressedOpacity,
    },
    toolDetailCopyButtonText: {
      fontSize: detailedToolExecution.copyButtonText.fontSize,
      fontWeight: detailedToolExecution.copyButtonText.fontWeight,
      color: toolDetailCopyButtonColors.textColor,
    },
    toolParamsScroll: {
      maxHeight: detailedToolExecution.scroll.collapsedMaxHeight,
      borderRadius: radius[detailedToolExecution.scroll.borderRadius],
      overflow: detailedToolExecution.scroll.overflow,
    },
    toolParamsScrollExpanded: {
      maxHeight: detailedToolExecution.scroll.expandedMaxHeight,
      borderRadius: radius[detailedToolExecution.scroll.borderRadius],
      overflow: detailedToolExecution.scroll.overflow,
    },
    toolParamsCode: {
      fontFamily: resolveChatRuntimeMobileFontFamily(detailedToolExecution.codeBlock.fontFamilyByPlatform, mobilePlatform),
      fontSize: detailedToolExecution.codeBlock.fontSize,
      color: toolExecutionDetailContentColors.codeBlock.color,
      backgroundColor: toolExecutionDetailContentColors.codeBlock.backgroundColor,
      padding: detailedToolExecution.codeBlock.padding,
      borderRadius: radius[detailedToolExecution.codeBlock.borderRadius],
    },
    toolResponsePendingText: {
      fontSize: detailedToolExecution.pendingText.fontSize,
      fontStyle: detailedToolExecution.pendingText.fontStyle,
      color: toolExecutionDetailContentColors.pendingText.color,
      textAlign: detailedToolExecution.pendingText.textAlign,
      paddingVertical: detailedToolExecution.pendingText.paddingVertical,
    },
    toolResponsePendingRow: {
      flexDirection: detailedToolExecution.pendingRow.flexDirection,
      alignItems: detailedToolExecution.pendingRow.alignItems,
      justifyContent: detailedToolExecution.pendingRow.justifyContent,
      gap: detailedToolExecution.pendingRow.gap,
      paddingVertical: detailedToolExecution.pendingRow.paddingVertical,
    },
    toolResultItem: {
      marginBottom: detailedToolExecution.result.itemMarginBottom,
    },
    toolResultHeader: {
      flexDirection: detailedToolExecution.resultHeader.flexDirection,
      alignItems: detailedToolExecution.resultHeader.alignItems,
      justifyContent: detailedToolExecution.resultHeader.justifyContent,
      marginBottom: detailedToolExecution.result.headerMarginBottom,
      gap: detailedToolExecution.resultHeader.gap,
    },
    toolResultHeaderMeta: {
      flexDirection: detailedToolExecution.resultHeaderMeta.flexDirection,
      alignItems: detailedToolExecution.resultHeaderMeta.alignItems,
      gap: detailedToolExecution.resultHeaderMeta.gap,
      flexShrink: detailedToolExecution.resultHeaderMeta.flexShrink,
      minWidth: detailedToolExecution.resultHeaderMeta.minWidth,
    },
    toolResultCharCount: {
      fontSize: detailedToolExecution.characterCount.fontSize,
      fontFamily: resolveChatRuntimeMobileFontFamily(detailedToolExecution.characterCount.fontFamilyByPlatform, mobilePlatform),
      color: toolExecutionDetailContentColors.characterCount.color,
      opacity: detailedToolExecution.characterCount.opacity,
    },
    toolResultBadge: {
      flexDirection: detailedToolExecution.badge.flexDirection,
      alignItems: detailedToolExecution.badge.alignItems,
      gap: detailedToolExecution.badge.gap,
      paddingHorizontal: detailedToolExecution.badge.paddingHorizontal,
      paddingVertical: detailedToolExecution.badge.paddingVertical,
      borderRadius: radius[detailedToolExecution.badge.borderRadius],
    },
    toolResultBadgeSuccess: {
      backgroundColor: toolResultBadgeSuccessColors.backgroundColor,
    },
    toolResultBadgeError: {
      backgroundColor: toolResultBadgeErrorColors.backgroundColor,
    },
    toolResultBadgeText: {
      fontSize: detailedToolExecution.badge.fontSize,
      fontWeight: detailedToolExecution.badge.fontWeight,
    },
    toolResultBadgeTextSuccess: {
      color: toolResultBadgeSuccessColors.color,
    },
    toolResultBadgeTextError: {
      color: toolResultBadgeErrorColors.color,
    },
    toolResultScroll: {
      maxHeight: detailedToolExecution.scroll.collapsedMaxHeight,
      borderRadius: radius[detailedToolExecution.scroll.borderRadius],
      overflow: detailedToolExecution.scroll.overflow,
    },
    toolResultScrollExpanded: {
      maxHeight: detailedToolExecution.scroll.expandedMaxHeight,
      borderRadius: radius[detailedToolExecution.scroll.borderRadius],
      overflow: detailedToolExecution.scroll.overflow,
    },
    toolResultCode: {
      fontFamily: resolveChatRuntimeMobileFontFamily(detailedToolExecution.codeBlock.fontFamilyByPlatform, mobilePlatform),
      fontSize: detailedToolExecution.codeBlock.fontSize,
      color: toolExecutionDetailContentColors.codeBlock.color,
      backgroundColor: toolExecutionDetailContentColors.codeBlock.backgroundColor,
      padding: detailedToolExecution.codeBlock.padding,
      borderRadius: radius[detailedToolExecution.codeBlock.borderRadius],
    },
    toolResultErrorSection: {
      marginTop: detailedToolExecution.result.errorSectionMarginTop,
    },
    toolResultErrorLabel: {
      fontSize: detailedToolExecution.error.labelFontSize,
      fontWeight: detailedToolExecution.error.labelFontWeight,
      color: toolResultErrorColors.color,
      marginBottom: detailedToolExecution.error.labelMarginBottom,
    },
    toolResultErrorText: {
      fontFamily: resolveChatRuntimeMobileFontFamily(detailedToolExecution.codeBlock.fontFamilyByPlatform, mobilePlatform),
      fontSize: detailedToolExecution.codeBlock.fontSize,
      color: toolResultErrorColors.color,
      backgroundColor: toolResultErrorColors.backgroundColor,
      padding: detailedToolExecution.codeBlock.padding,
      borderRadius: radius[detailedToolExecution.codeBlock.borderRadius],
    },
    messageContentRow: {
      flexDirection: mobileMessageContentLayout.row.flexDirection,
      alignItems: mobileMessageContentLayout.row.alignItems,
      gap: spacing[mobileMessageContentLayout.row.gap],
      width: mobileMessageContentLayout.row.width,
    },
    messageContentBody: {
      flex: mobileMessageContentLayout.body.flex,
      minWidth: mobileMessageContentLayout.body.minWidth,
    },
    collapsedMessagePreviewToggle: {
      flex: mobileMessageCollapsedPreview.flex,
      minWidth: mobileMessageCollapsedPreview.minWidth,
    },
    collapsedMessagePreviewTogglePressed: {
      opacity: mobileMessageCollapsedPreview.pressedOpacity,
    },
    collapsedMessagePreview: {
      color: mobileMessageCollapsedPreviewColors.text.color,
      fontSize: mobileMessageCollapsedPreview.fontSize,
      lineHeight: mobileMessageCollapsedPreview.lineHeight,
    },
    messageExpandButton: {
      ...mobileMessageExpansionButtonStyleSlots.button,
    },
    messageExpandButtonPressed: mobileMessageExpansionButtonStyleSlots.pressed,
    messageActionsRow: {
      flexDirection: mobileMessageActionRow.flexDirection,
      alignItems: mobileMessageActionRow.alignItems,
      justifyContent: mobileMessageActionRow.justifyContent,
      marginTop: mobileMessageActionRow.marginTop,
      gap: spacing[mobileMessageActionRow.gap],
    },
    messageTurnDurationBadge: {
      ...mobileMessageTurnDurationStyleSlots.badge,
    },
    messageTurnDurationBadgeLive: {
      ...mobileMessageTurnDurationLiveStyleSlots.badge,
    },
    messageTurnDurationText: {
      ...mobileMessageTurnDurationStyleSlots.text,
    },
    messageTurnDurationTextLive: {
      ...mobileMessageTurnDurationLiveStyleSlots.text,
    },
    messageBranchButton: {
      ...mobileMessageBranchButtonStyleSlots.button,
    },
    messageBranchButtonPressed: mobileMessageBranchButtonStyleSlots.pressed,
    messageBranchButtonDisabled: mobileMessageBranchButtonStyleSlots.disabled,
    messageCopyButton: {
      ...mobileMessageCopyButtonStyleSlots.button,
    },
    messageCopyButtonCopied: {
      ...mobileMessageCopiedButtonStyleSlots.button,
    },
    messageCopyButtonPressed: mobileMessageCopyButtonStyleSlots.pressed,
    // Per-message TTS button styles (#1078)
    speakButton: {
      ...mobileMessageSpeechButtonStyleSlots.button,
    },
    speakButtonActive: {
      ...mobileMessageSpeechActiveButtonStyleSlots.button,
    },
    speakButtonPressed: mobileMessageSpeechButtonStyleSlots.pressed,
  });
}

export function useChatRuntimeMobileStyleSlots() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const bottomInset = insets.bottom;
  const chatRuntimeChromeEnvironment = useMemo(
    () => createChatRuntimeMobileChromeEnvironment(theme),
    [theme],
  );
  const chatRuntimeChromeEnvironmentProps = useMemo(
    () => ({
      platform: chatRuntimeChromeEnvironment.platform,
    }),
    [chatRuntimeChromeEnvironment],
  );
  const chatRuntimeSpinnerSource = useMemo(
    () => createChatRuntimeThemeSpinnerSource({
      isDark,
      darkSource: darkSpinnerSource,
      lightSource: lightSpinnerSource,
    }),
    [isDark],
  );
  const styles = useMemo(() => createChatRuntimeMobileStyles(theme), [theme]);
  const chatMessageConversationThreadStyles = useMemo(
    () => createChatMessageConversationThreadStyleSlots(styles),
    [styles],
  );
  const chatRuntimeHeaderStyles = useMemo(
    () => createChatRuntimeHeaderStyleSlots(styles),
    [styles],
  );
  const chatComposerStyles = useMemo(
    () => createChatComposerStyleSlots(styles),
    [styles],
  );
  const conversationDockStyles = useMemo(
    () => createChatMessageConversationDockStyleSlots(styles),
    [styles],
  );
  const conversationViewportStyles = useMemo(
    () => createChatMessageConversationViewportStyleSlots(styles),
    [styles],
  );
  const promptEditorModalStyles = useMemo(
    () => createChatConversationHomePromptEditorModalStyleSlots(styles),
    [styles],
  );
  const chatMessageRuntimeChromeStyles = useMemo(
    () => ({
      actionStyles: chatMessageConversationThreadStyles.actionSet,
      threadStyles: chatMessageConversationThreadStyles.runtimeThread,
      promptEditorStyles: promptEditorModalStyles,
    }),
    [chatMessageConversationThreadStyles, promptEditorModalStyles],
  );
  const chatRuntimeHeaderChrome = useMemo(
    () => ({
      colors: chatRuntimeChromeEnvironment.colors,
      spinnerSource: chatRuntimeSpinnerSource,
      styles: chatRuntimeHeaderStyles,
    }),
    [chatRuntimeChromeEnvironment, chatRuntimeHeaderStyles, chatRuntimeSpinnerSource],
  );
  const chatMessageRuntimeChrome = useMemo(
    () => ({
      colors: chatRuntimeChromeEnvironment.colors,
      platform: chatRuntimeChromeEnvironment.platform,
      spinnerSource: chatRuntimeSpinnerSource,
      styles: chatMessageRuntimeChromeStyles,
    }),
    [chatMessageRuntimeChromeStyles, chatRuntimeChromeEnvironment, chatRuntimeSpinnerSource],
  );
  const mobileSafeAreaLayout = useMemo(
    () => getChatRuntimeMobileSafeAreaLayoutState(bottomInset),
    [bottomInset],
  );
  const mobileSafeAreaStyles = useMemo(
    () => createChatRuntimeMobileSafeAreaStyleSlots(mobileSafeAreaLayout),
    [mobileSafeAreaLayout],
  );
  const chatSafeAreaStyles = useMemo(
    () => createChatRuntimeSafeAreaMergedStyleSlots({
      chatComposerStyles,
      conversationDockStyles,
      conversationViewportStyles,
      safeAreaStyles: mobileSafeAreaStyles,
    }),
    [chatComposerStyles, conversationDockStyles, conversationViewportStyles, mobileSafeAreaStyles],
  );
  const chatComposerRuntimeDockStyles = useMemo(
    () => createChatComposerRuntimeDockStyleSlots({
      chatComposerStyles,
      safeAreaStyles: chatSafeAreaStyles,
    }),
    [chatComposerStyles, chatSafeAreaStyles],
  );
  const chatMessageRuntimeDockStyles = useMemo(
    () => createChatMessageRuntimeDockStyleSlots({
      conversationDockStyles,
      composerStyles: chatComposerRuntimeDockStyles,
      safeAreaStyles: chatSafeAreaStyles,
    }),
    [conversationDockStyles, chatComposerRuntimeDockStyles, chatSafeAreaStyles],
  );
  const chatMessageRuntimeViewportStyles = useMemo(
    () => createChatMessageRuntimeViewportStyleSlots({
      conversationViewportStyles,
      safeAreaStyles: chatSafeAreaStyles,
    }),
    [conversationViewportStyles, chatSafeAreaStyles],
  );
  const chatMessageRuntimeSurfaceStyles = useMemo(
    () => createChatMessageRuntimeSurfaceStyleSlots({
      conversationViewportStyles,
      dockStyles: chatMessageRuntimeDockStyles,
      viewportStyles: chatMessageRuntimeViewportStyles,
    }),
    [conversationViewportStyles, chatMessageRuntimeDockStyles, chatMessageRuntimeViewportStyles],
  );
  const chatMessageRuntimeSurfaceChrome = useMemo(
    () => ({
      surfaceStyles: chatMessageRuntimeSurfaceStyles,
    }),
    [chatMessageRuntimeSurfaceStyles],
  );
  const chatRuntimeChrome = useMemo(
    () => ({
      environment: chatRuntimeChromeEnvironmentProps,
      header: chatRuntimeHeaderChrome,
      messageRuntime: chatMessageRuntimeChrome,
      surface: chatMessageRuntimeSurfaceChrome,
    }),
    [
      chatMessageRuntimeChrome,
      chatMessageRuntimeSurfaceChrome,
      chatRuntimeChromeEnvironmentProps,
      chatRuntimeHeaderChrome,
    ],
  );

  return {
    chatRuntimeChrome,
  };
}
