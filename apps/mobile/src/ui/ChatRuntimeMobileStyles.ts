import { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
} from 'react-native';

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
  createChatRuntimeMobileChromeStyleState,
  createChatRuntimeMobileSafeAreaLayoutState,
  createChatRuntimeMobileSafeAreaStyleSlots,
  createChatRuntimeSafeAreaMergedStyleSlots,
  resolveChatRuntimeMobileFontFamily,
} from './ChatMessageChrome';
import { radius, spacing, type Theme } from './theme';

type ChatRuntimeMobileStyleSlotsInput = {
  theme: Theme;
  bottomInset: number;
};

export function createChatRuntimeMobileStyles(theme: Theme) {
  const chatChromeStyleState = createChatRuntimeMobileChromeStyleState({
    colors: theme.colors,
    platform: Platform.OS,
  });
  const headerChromeStyleState = chatChromeStyleState.header;
  const headerStyleState = headerChromeStyleState.header;
  const headerSurface = headerStyleState.surface;
  const headerAgentSelectorColors = headerStyleState.agentSelector;
  const inactiveHeaderPinButtonColors = headerStyleState.pinButton.inactive;
  const activeHeaderPinButtonColors = headerStyleState.pinButton.active;
  const headerKillSwitchButtonColors = headerStyleState.killSwitchButton;
  const conversationChromeStyleState = chatChromeStyleState.conversation;
  const viewportStyleState = conversationChromeStyleState.viewport;
  const viewportSurface = viewportStyleState.surface;
  const loadingStateSurface = viewportStyleState.loadingState;
  const inlineActivitySurface = viewportStyleState.inlineActivity;
  const streamingContentStyleState = conversationChromeStyleState.streamingContent;
  const streamingContentSurface = streamingContentStyleState.surface;
  const streamingContentSurfaceColors = streamingContentStyleState.colors;
  const streamingContentSpinnerSize = streamingContentStyleState.spinner.size;
  const connectionBannerStyleState = conversationChromeStyleState.connectionBanner;
  const connectionBannerSurface = connectionBannerStyleState.surface;
  const connectionBannerSurfaceColors = connectionBannerStyleState.colors;
  const retryStatusStyleState = conversationChromeStyleState.retryStatus;
  const retryStatusSurface = retryStatusStyleState.surface;
  const retryStatusSurfaceColors = retryStatusStyleState.colors;
  const stepSummaryStyleState = conversationChromeStyleState.stepSummary;
  const stepSummarySurface = stepSummaryStyleState.surface;
  const stepSummarySurfaceColors = stepSummaryStyleState.colors;
  const delegationCardStyleState = conversationChromeStyleState.delegationCard;
  const delegationCardSurface = delegationCardStyleState.surface;
  const delegationCardSurfaceColors = delegationCardStyleState.colors;
  const scrollToBottomStyleState = conversationChromeStyleState.scrollToBottom;
  const scrollToBottomSurface = scrollToBottomStyleState.surface;
  const scrollToBottomSurfaceColors = scrollToBottomStyleState.colors;
  const messageHistoryBannerStyleState = conversationChromeStyleState.messageHistoryBanner;
  const messageHistoryBannerSurface = messageHistoryBannerStyleState.surface;
  const messageHistoryBannerSurfaceColors = messageHistoryBannerStyleState.colors;
  const messageHistoryLoadButtonPressedOpacity = messageHistoryBannerStyleState.loadButton.pressedOpacity;
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
  const messageQueuePanelWrapper = messageQueuePanelWrapperState.wrapper;
  const handsFreeStyleState = composerChromeStyleState.handsFree;
  const handsFreeSurface = handsFreeStyleState.surface;
  const headerActionButton = chatChromeStyleState.headerActionButton;
  const headerEdgeActionButton = chatChromeStyleState.headerEdgeActionButton;
  const headerPinButton = chatChromeStyleState.headerPinButton;
  const sessionStatusStyleState = headerChromeStyleState.sessionStatus;
  const sessionStatusSurface = sessionStatusStyleState.surface;
  const threadChromeStyleState = chatChromeStyleState.thread;
  const compactToolExecutionStyleState = threadChromeStyleState.compactToolExecution;
  const compactToolExecution = compactToolExecutionStyleState.surface;
  const toolExecutionDetailStyleState = threadChromeStyleState.toolExecutionDetail;
  const detailedToolExecution = toolExecutionDetailStyleState.surface;
  const viewportSurfaceColors = viewportStyleState.colors;
  const toolActivityGroupStyleState = threadChromeStyleState.toolActivityGroup;
  const toolActivityGroupSurface = toolActivityGroupStyleState.surface;
  const toolActivityGroupSurfaceColors = toolActivityGroupStyleState.colors;
  const imageAttachmentSurfaceColors = imageAttachmentStyleState.colors;
  const handsFreeSurfaceColors = handsFreeStyleState.colors;
  const toolApprovalStyleState = threadChromeStyleState.toolApproval;
  const toolApprovalSurface = toolApprovalStyleState.surface;
  const toolApprovalSurfaceColors = toolApprovalStyleState.colors;
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
  const headerTurnDurationBadge = headerTurnDurationStyleState.badge;
  const headerTurnDurationLiveBadge = headerTurnDurationLiveStyleState.badge;
  const headerTurnDurationColors = headerTurnDurationStyleState.colors;
  const headerTurnDurationLiveColors = headerTurnDurationLiveStyleState.colors;
  const mobileMessageActionStyleState = mobileMessageThreadStyleState.action;
  const mobileMessageActionRow = mobileMessageActionStyleState.row;
  const mobileMessageActionButton = mobileMessageActionStyleState.buttons.standard.button;
  const mobileMessageBranchButton = mobileMessageActionStyleState.buttons.branch.button;
  const mobileMessageSpeechButton = mobileMessageActionStyleState.buttons.speech.button;
  const mobileMessageActionButtonColors = mobileMessageActionStyleState.buttons.standard.colors;
  const mobileMessageBranchButtonColors = mobileMessageActionStyleState.buttons.branch.colors;
  const mobileMessageCopiedButtonColors = mobileMessageActionStyleState.buttons.copied.colors;
  const mobileMessageSpeechButtonColors = mobileMessageActionStyleState.buttons.speech.colors;
  const mobileMessageSpeechActiveButtonColors = mobileMessageActionStyleState.buttons.speechActive.colors;
  const mobileMessageTurnDurationRenderState = mobileMessageThreadStyleState.turnDuration.standard;
  const mobileMessageTurnDurationLiveRenderState = mobileMessageThreadStyleState.turnDuration.live;
  const mobileMessageTurnDurationBadge = mobileMessageTurnDurationRenderState.badge;
  const mobileMessageTurnDurationLiveBadge = mobileMessageTurnDurationLiveRenderState.badge;
  const mobileMessageTurnDurationBadgeColors = mobileMessageTurnDurationRenderState.colors;
  const mobileMessageTurnDurationLiveBadgeColors = mobileMessageTurnDurationLiveRenderState.colors;
  const toolExecutionStatusColors = compactToolExecutionStyleState.statusColors;
  const toolExecutionDetailColorsByState = toolExecutionDetailStyleColors.byState;
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
      flex: loadingStateSurface.flex,
      justifyContent: loadingStateSurface.justifyContent,
      alignItems: loadingStateSurface.alignItems,
      paddingVertical: loadingStateSurface.paddingVertical,
    },
    loadingSpinner: {
      width: loadingStateSurface.spinnerSize,
      height: loadingStateSurface.spinnerSize,
    },
    inlineActivityIndicator: {
      flexDirection: inlineActivitySurface.flexDirection,
      alignItems: inlineActivitySurface.alignItems,
    },
    inlineActivitySpinner: {
      width: inlineActivitySurface.spinnerSize,
      height: inlineActivitySurface.spinnerSize,
    },
    streamingContentHeader: {
      flexDirection: streamingContentSurface.headerFlexDirection,
      alignItems: streamingContentSurface.headerAlignItems,
      gap: spacing[streamingContentSurface.headerGap],
      marginBottom: spacing[streamingContentSurface.headerMarginBottom],
    },
    streamingContentTitle: {
      minWidth: streamingContentSurface.titleMinWidth,
      flexShrink: streamingContentSurface.titleFlexShrink,
      color: streamingContentSurfaceColors.title.color,
      fontSize: streamingContentSurface.titleFontSize,
      fontWeight: streamingContentSurface.titleFontWeight,
    },
    streamingContentSpinner: {
      width: streamingContentSpinnerSize,
      height: streamingContentSpinnerSize,
    },
    streamingContentBadge: {
      marginLeft: streamingContentSurface.badgeMarginLeft,
      paddingHorizontal: spacing[streamingContentSurface.badgePaddingHorizontal],
      paddingVertical: streamingContentSurface.badgePaddingVertical,
      borderRadius: radius[streamingContentSurface.badgeBorderRadius],
      backgroundColor: streamingContentSurfaceColors.badge.backgroundColor,
    },
    streamingContentBadgeText: {
      color: streamingContentSurfaceColors.badgeText.color,
      fontSize: streamingContentSurface.badgeTextFontSize,
      fontWeight: streamingContentSurface.badgeTextFontWeight,
    },
    streamingContentBodyRow: {
      flexDirection: streamingContentSurface.bodyRowFlexDirection,
      alignItems: streamingContentSurface.bodyRowAlignItems,
      minWidth: streamingContentSurface.bodyRowMinWidth,
    },
    streamingContentText: {
      flex: streamingContentSurface.textFlex,
      minWidth: streamingContentSurface.textMinWidth,
      color: streamingContentSurfaceColors.text.color,
      fontSize: streamingContentSurface.textFontSize,
      lineHeight: streamingContentSurface.textLineHeight,
    },
    streamingContentCaret: {
      width: streamingContentSurface.caretWidth,
      height: streamingContentSurface.caretHeight,
      marginLeft: streamingContentSurface.caretMarginLeft,
      borderRadius: streamingContentSurface.caretBorderRadius,
      backgroundColor: streamingContentSurfaceColors.caret.backgroundColor,
    },
    messageQueuePanelWrapper: {
      paddingHorizontal: spacing[messageQueuePanelWrapper.paddingHorizontal],
      paddingTop: spacing[messageQueuePanelWrapper.paddingTop],
    },
    headerAgentSelectorButton: {
      alignItems: headerSurface.agentSelectorButton.alignItems,
      justifyContent: headerSurface.agentSelectorButton.justifyContent,
      height: headerSurface.agentSelectorButton.height,
      minHeight: headerSurface.agentSelectorButton.minHeight,
    },
    headerAgentSelectorChip: {
      flexDirection: headerSurface.agentSelectorChip.flexDirection,
      alignItems: headerSurface.agentSelectorChip.alignItems,
      backgroundColor: headerAgentSelectorColors.chip.backgroundColor,
      maxWidth: headerSurface.agentSelectorChip.maxWidth,
      paddingHorizontal: headerSurface.agentSelectorChip.paddingHorizontal,
      paddingVertical: headerSurface.agentSelectorChip.paddingVertical,
      borderRadius: headerSurface.agentSelectorChip.borderRadius,
      gap: headerSurface.agentSelectorChip.gap,
    },
    headerAgentSelectorText: {
      fontSize: headerSurface.agentSelectorText.fontSize,
      color: headerAgentSelectorColors.text.color,
      fontWeight: headerSurface.agentSelectorText.fontWeight,
    },
    headerActionsRow: {
      flexDirection: headerSurface.actionsRow.flexDirection,
      alignItems: headerSurface.actionsRow.alignItems,
      gap: headerSurface.actionsRow.gap,
    },
    headerConversationChip: {
      flexDirection: sessionStatusSurface.chip.flexDirection,
      alignItems: sessionStatusSurface.chip.alignItems,
      gap: sessionStatusSurface.chip.gap,
      borderWidth: sessionStatusSurface.chip.borderWidth,
      borderRadius: sessionStatusSurface.chip.borderRadius,
      paddingHorizontal: sessionStatusSurface.chip.paddingHorizontal,
      paddingVertical: sessionStatusSurface.chip.paddingVertical,
      marginHorizontal: sessionStatusSurface.chip.marginHorizontal,
    },
    headerConversationChipText: {
      fontSize: sessionStatusSurface.chipText.fontSize,
      lineHeight: sessionStatusSurface.chipText.lineHeight,
      fontWeight: sessionStatusSurface.chipText.fontWeight,
    },
    headerConversationSpinner: {
      width: sessionStatusSurface.runningIndicator.size,
      height: sessionStatusSurface.runningIndicator.size,
    },
    headerDurationChip: {
      flexDirection: headerTurnDurationBadge.flexDirection,
      alignItems: headerTurnDurationBadge.alignItems,
      justifyContent: headerTurnDurationBadge.justifyContent,
      gap: headerTurnDurationBadge.gap,
      minHeight: headerTurnDurationBadge.minHeight,
      maxWidth: headerTurnDurationBadge.maxWidth,
      paddingHorizontal: headerTurnDurationBadge.paddingHorizontal,
      borderRadius: headerTurnDurationBadge.borderRadius,
      backgroundColor: headerTurnDurationColors.chip.backgroundColor,
      marginHorizontal: headerTurnDurationBadge.marginHorizontal,
      flexShrink: headerTurnDurationBadge.flexShrink,
      opacity: headerTurnDurationBadge.opacity,
    } as const,
    headerDurationChipLive: {
      backgroundColor: headerTurnDurationLiveColors.chip.backgroundColor,
      opacity: headerTurnDurationLiveBadge.opacity,
    } as const,
    headerDurationChipText: {
      fontFamily: resolveChatRuntimeMobileFontFamily(headerTurnDurationBadge.fontFamilyByPlatform),
      fontSize: headerTurnDurationBadge.fontSize,
      lineHeight: headerTurnDurationBadge.lineHeight,
      fontWeight: headerTurnDurationBadge.fontWeight,
      color: headerTurnDurationColors.text.color,
    },
    headerDurationChipTextLive: {
      color: headerTurnDurationLiveColors.text.color,
    },
    headerActionButton,
    headerEdgeActionButton,
    headerPinButton: {
      ...headerPinButton,
      borderRadius: radius[headerSurface.pinButton.borderRadius],
      borderWidth: headerSurface.pinButton.borderWidth,
      borderColor: inactiveHeaderPinButtonColors.button.borderColor,
      backgroundColor: inactiveHeaderPinButtonColors.button.backgroundColor,
    },
    headerPinButtonActive: {
      borderColor: activeHeaderPinButtonColors.button.borderColor,
      backgroundColor: activeHeaderPinButtonColors.button.backgroundColor,
    },
    headerKillSwitchIconContainer: {
      width: headerSurface.killSwitchButton.size,
      height: headerSurface.killSwitchButton.size,
      borderRadius: headerSurface.killSwitchButton.borderRadius,
      backgroundColor: headerKillSwitchButtonColors.button.backgroundColor,
      alignItems: headerSurface.killSwitchButton.alignItems,
      justifyContent: headerSurface.killSwitchButton.justifyContent,
    },
    headerHandsFreeIconContainer: {
      width: headerSurface.handsFreeButton.size,
      height: headerSurface.handsFreeButton.size,
      alignItems: headerSurface.handsFreeButton.alignItems,
      justifyContent: headerSurface.handsFreeButton.justifyContent,
    },
    loadOlderContainer: {
      flexDirection: messageHistoryBannerSurface.flexDirection,
      flexWrap: messageHistoryBannerSurface.flexWrap,
      justifyContent: messageHistoryBannerSurface.justifyContent,
      alignItems: messageHistoryBannerSurface.alignItems,
      gap: spacing[messageHistoryBannerSurface.gap],
      paddingVertical: spacing[messageHistoryBannerSurface.paddingVertical],
    },
    loadOlderText: {
      color: messageHistoryBannerSurfaceColors.summary.color,
      fontSize: messageHistoryBannerSurface.summaryFontSize,
      lineHeight: messageHistoryBannerSurface.summaryLineHeight,
      textAlign: messageHistoryBannerSurface.textAlign,
    },
    loadOlderButton: {
      flexDirection: messageHistoryBannerSurface.loadButton.flexDirection,
      alignItems: messageHistoryBannerSurface.loadButton.alignItems,
      justifyContent: messageHistoryBannerSurface.loadButton.justifyContent,
      gap: spacing[messageHistoryBannerSurface.loadButton.gap],
      paddingHorizontal: spacing[messageHistoryBannerSurface.loadButton.paddingHorizontal],
      paddingVertical: messageHistoryBannerSurface.loadButton.paddingVertical,
      borderRadius: radius[messageHistoryBannerSurface.loadButton.borderRadius],
      borderWidth: messageHistoryBannerSurface.loadButton.borderWidth,
      borderColor: messageHistoryBannerSurfaceColors.loadButton.borderColor,
      backgroundColor: messageHistoryBannerSurfaceColors.loadButton.backgroundColor,
    },
    loadOlderButtonPressed: {
      opacity: messageHistoryLoadButtonPressedOpacity,
    },
    loadOlderButtonText: {
      color: messageHistoryBannerSurfaceColors.loadButton.color,
      fontSize: messageHistoryBannerSurface.loadButton.fontSize,
      fontWeight: messageHistoryBannerSurface.loadButton.fontWeight,
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
      gap: spacing[retryStatusSurface.gap],
      padding: spacing[retryStatusSurface.padding],
      borderRadius: radius[retryStatusSurface.borderRadius],
      borderWidth: retryStatusSurface.borderWidth,
      borderColor: retryStatusSurfaceColors.card.borderColor,
      backgroundColor: retryStatusSurfaceColors.card.backgroundColor,
    },
    retryStatusHeader: {
      flexDirection: retryStatusSurface.headerFlexDirection,
      alignItems: retryStatusSurface.headerAlignItems,
      gap: spacing[retryStatusSurface.headerGap],
    },
    retryStatusTitle: {
      flex: retryStatusSurface.titleFlex,
      minWidth: retryStatusSurface.titleMinWidth,
      color: retryStatusSurfaceColors.title.color,
      fontSize: retryStatusSurface.titleFontSize,
      fontWeight: retryStatusSurface.titleFontWeight,
    },
    retryStatusMetaRow: {
      flexDirection: retryStatusSurface.metaFlexDirection,
      flexWrap: retryStatusSurface.metaFlexWrap,
      alignItems: retryStatusSurface.metaAlignItems,
      gap: spacing[retryStatusSurface.metaGap],
      marginTop: retryStatusSurface.metaMarginTop,
    },
    retryStatusAttempt: {
      color: retryStatusSurfaceColors.attempt.color,
      fontSize: retryStatusSurface.attemptFontSize,
    },
    retryStatusCountdown: {
      color: retryStatusSurfaceColors.countdown.color,
      fontSize: retryStatusSurface.countdownFontSize,
      fontWeight: retryStatusSurface.countdownFontWeight,
      paddingHorizontal: spacing[retryStatusSurface.countdownPaddingHorizontal],
      paddingVertical: retryStatusSurface.countdownPaddingVertical,
      borderRadius: radius[retryStatusSurface.countdownBorderRadius],
      backgroundColor: retryStatusSurfaceColors.countdown.backgroundColor,
      overflow: retryStatusSurface.countdownOverflow,
    },
    retryStatusDescription: {
      color: retryStatusSurfaceColors.description.color,
      fontSize: retryStatusSurface.descriptionFontSize,
      lineHeight: retryStatusSurface.descriptionLineHeight,
      marginTop: retryStatusSurface.descriptionMarginTop,
    },
    stepSummaryCard: {
      gap: spacing[stepSummarySurface.gap],
      padding: spacing[stepSummarySurface.padding],
      borderRadius: radius[stepSummarySurface.borderRadius],
      borderWidth: stepSummarySurface.borderWidth,
      borderColor: stepSummarySurfaceColors.card.borderColor,
      backgroundColor: stepSummarySurfaceColors.card.backgroundColor,
    },
    stepSummaryHeader: {
      flexDirection: stepSummarySurface.headerFlexDirection,
      alignItems: stepSummarySurface.headerAlignItems,
      gap: spacing[stepSummarySurface.headerGap],
      minWidth: stepSummarySurface.headerMinWidth,
    },
    stepSummaryTitle: {
      flexShrink: stepSummarySurface.titleFlexShrink,
      minWidth: stepSummarySurface.titleMinWidth,
      color: stepSummarySurfaceColors.title.color,
      fontSize: stepSummarySurface.titleFontSize,
      fontWeight: stepSummarySurface.titleFontWeight,
    },
    stepSummaryBadge: {
      marginLeft: stepSummarySurface.badgeMarginLeft,
      maxWidth: stepSummarySurface.badgeMaxWidth,
      paddingHorizontal: spacing[stepSummarySurface.badgePaddingHorizontal],
      paddingVertical: stepSummarySurface.badgePaddingVertical,
      borderRadius: radius[stepSummarySurface.badgeBorderRadius],
      backgroundColor: stepSummarySurfaceColors.badge.backgroundColor,
    },
    stepSummaryBadgeText: {
      color: stepSummarySurfaceColors.badgeText.color,
      fontSize: stepSummarySurface.badgeTextFontSize,
      fontWeight: stepSummarySurface.badgeTextFontWeight,
    },
    stepSummaryAction: {
      color: stepSummarySurfaceColors.action.color,
      fontSize: stepSummarySurface.actionFontSize,
      lineHeight: stepSummarySurface.actionLineHeight,
      fontWeight: stepSummarySurface.actionFontWeight,
    },
    stepSummaryMeta: {
      color: stepSummarySurfaceColors.meta.color,
      fontSize: stepSummarySurface.metaFontSize,
      lineHeight: stepSummarySurface.metaLineHeight,
    },
    stepSummaryPreview: {
      color: stepSummarySurfaceColors.preview.color,
      fontSize: stepSummarySurface.previewFontSize,
      lineHeight: stepSummarySurface.previewLineHeight,
      marginTop: stepSummarySurface.previewMarginTop,
    },
    delegationCard: {
      gap: spacing[delegationCardSurface.gap],
      padding: spacing[delegationCardSurface.padding],
      borderRadius: radius[delegationCardSurface.borderRadius],
      borderWidth: delegationCardSurface.borderWidth,
      borderColor: delegationCardSurfaceColors.card.borderColor,
      backgroundColor: delegationCardSurfaceColors.card.backgroundColor,
    },
    delegationHeader: {
      flexDirection: delegationCardSurface.headerFlexDirection,
      alignItems: delegationCardSurface.headerAlignItems,
      gap: spacing[delegationCardSurface.headerGap],
      minWidth: delegationCardSurface.headerMinWidth,
    },
    delegationTitle: {
      flex: delegationCardSurface.titleFlex,
      minWidth: delegationCardSurface.titleMinWidth,
      color: delegationCardSurfaceColors.title.color,
      fontSize: delegationCardSurface.titleFontSize,
      fontWeight: delegationCardSurface.titleFontWeight,
    },
    delegationStatusBadge: {
      flexShrink: delegationCardSurface.statusFlexShrink,
      borderWidth: delegationCardSurface.statusBorderWidth,
      borderRadius: radius[delegationCardSurface.statusBorderRadius],
      paddingHorizontal: spacing[delegationCardSurface.statusPaddingHorizontal],
      paddingVertical: delegationCardSurface.statusPaddingVertical,
    },
    delegationStatusText: {
      fontSize: delegationCardSurface.statusFontSize,
      fontWeight: delegationCardSurface.statusFontWeight,
    },
    delegationLiveText: {
      color: delegationCardSurfaceColors.liveText.color,
      fontSize: delegationCardSurface.metaFontSize,
      lineHeight: delegationCardSurface.metaLineHeight,
      fontWeight: delegationCardSurface.statusFontWeight,
    },
    delegationSubtitle: {
      color: delegationCardSurfaceColors.subtitle.color,
      fontSize: delegationCardSurface.subtitleFontSize,
      lineHeight: delegationCardSurface.subtitleLineHeight,
    },
    delegationMetaRow: {
      flexDirection: delegationCardSurface.metaFlexDirection,
      flexWrap: delegationCardSurface.metaFlexWrap,
      alignItems: delegationCardSurface.metaAlignItems,
      gap: spacing[delegationCardSurface.metaGap],
    },
    delegationMetaText: {
      color: delegationCardSurfaceColors.meta.color,
      fontSize: delegationCardSurface.metaFontSize,
      lineHeight: delegationCardSurface.metaLineHeight,
    },
    delegationConversationPreview: {
      gap: delegationCardSurface.conversationPreviewGap,
      marginTop: delegationCardSurface.conversationPreviewMarginTop,
      paddingHorizontal: spacing[delegationCardSurface.conversationPreviewPaddingHorizontal],
      paddingVertical: delegationCardSurface.conversationPreviewPaddingVertical,
      borderRadius: radius[delegationCardSurface.conversationPreviewBorderRadius],
      borderWidth: delegationCardSurface.conversationPreviewBorderWidth,
      borderColor: delegationCardSurfaceColors.conversationPreview.borderColor,
      backgroundColor: delegationCardSurfaceColors.conversationPreview.backgroundColor,
    },
    delegationConversationPreviewLine: {
      flexDirection: delegationCardSurface.conversationPreviewLineFlexDirection,
      alignItems: delegationCardSurface.conversationPreviewLineAlignItems,
      gap: spacing[delegationCardSurface.conversationPreviewLineGap],
      minWidth: delegationCardSurface.conversationPreviewLineMinWidth,
    },
    delegationConversationPreviewRole: {
      minWidth: delegationCardSurface.conversationPreviewRoleMinWidth,
      maxWidth: delegationCardSurface.conversationPreviewRoleMaxWidth,
      paddingHorizontal: spacing[delegationCardSurface.conversationPreviewRolePaddingHorizontal],
      paddingVertical: delegationCardSurface.conversationPreviewRolePaddingVertical,
      borderRadius: radius[delegationCardSurface.conversationPreviewRoleBorderRadius],
      borderWidth: delegationCardSurface.conversationPreviewRoleBorderWidth,
      overflow: delegationCardSurface.conversationPreviewRoleOverflow,
      fontSize: delegationCardSurface.conversationPreviewRoleFontSize,
      fontWeight: delegationCardSurface.conversationPreviewRoleFontWeight,
    },
    delegationConversationPreviewContent: {
      flex: delegationCardSurface.conversationPreviewContentFlex,
      minWidth: delegationCardSurface.conversationPreviewContentMinWidth,
      color: delegationCardSurfaceColors.conversationPreviewContent.color,
      fontSize: delegationCardSurface.conversationPreviewContentFontSize,
      lineHeight: delegationCardSurface.conversationPreviewContentLineHeight,
    },
    delegationConversationPreviewTimestamp: {
      flexShrink: delegationCardSurface.conversationPreviewTimestampFlexShrink,
      color: delegationCardSurfaceColors.conversationPreviewTimestamp.color,
      fontSize: delegationCardSurface.conversationPreviewTimestampFontSize,
    },
    delegationConversationPreviewMoreButton: {
      alignSelf: delegationCardSurface.conversationPreviewMoreButtonAlignSelf,
    },
    delegationConversationPreviewMoreButtonPressed: {
      opacity: delegationCardSurface.conversationPreviewMoreButtonPressedOpacity,
    },
    delegationConversationPreviewMore: {
      color: delegationCardSurfaceColors.conversationPreviewMore.color,
      fontSize: delegationCardSurface.conversationPreviewMoreFontSize,
      fontWeight: delegationCardSurface.conversationPreviewMoreFontWeight,
    },
    delegationToolPreview: {
      gap: delegationCardSurface.toolPreviewGap,
      marginTop: delegationCardSurface.toolPreviewMarginTop,
      paddingHorizontal: spacing[delegationCardSurface.toolPreviewPaddingHorizontal],
      paddingVertical: delegationCardSurface.toolPreviewPaddingVertical,
      borderRadius: radius[delegationCardSurface.toolPreviewBorderRadius],
      borderWidth: delegationCardSurface.toolPreviewBorderWidth,
      borderColor: delegationCardSurfaceColors.toolPreview.borderColor,
      backgroundColor: delegationCardSurfaceColors.toolPreview.backgroundColor,
    },
    delegationToolPreviewLabel: {
      color: delegationCardSurfaceColors.toolPreviewLabel.color,
      fontSize: delegationCardSurface.toolPreviewLabelFontSize,
      fontWeight: delegationCardSurface.toolPreviewLabelFontWeight,
    },
    delegationToolPreviewLine: {
      flexDirection: delegationCardSurface.toolPreviewLineFlexDirection,
      alignItems: delegationCardSurface.toolPreviewLineAlignItems,
      gap: spacing[delegationCardSurface.toolPreviewLineGap],
      minWidth: delegationCardSurface.toolPreviewLineMinWidth,
    },
    delegationToolPreviewStatusIcon: {
      width: compactToolExecution.statusIcon.width,
      minWidth: delegationCardSurface.toolPreviewStatusMinWidth,
      alignItems: delegationCardSurface.toolPreviewStatusAlignItems,
      justifyContent: delegationCardSurface.toolPreviewStatusJustifyContent,
      flexShrink: delegationCardSurface.toolPreviewStatusFlexShrink,
    },
    delegationToolPreviewName: {
      flex: delegationCardSurface.toolPreviewNameFlex,
      minWidth: delegationCardSurface.toolPreviewNameMinWidth,
      color: delegationCardSurfaceColors.toolPreviewName.color,
      fontSize: delegationCardSurface.toolPreviewNameFontSize,
    },
    delegationToolPreviewMoreButton: {
      alignSelf: delegationCardSurface.toolPreviewMoreButtonAlignSelf,
    },
    delegationToolPreviewMoreButtonPressed: {
      opacity: delegationCardSurface.toolPreviewMoreButtonPressedOpacity,
    },
    delegationToolPreviewMore: {
      color: delegationCardSurfaceColors.toolPreviewMore.color,
      fontSize: delegationCardSurface.toolPreviewMoreFontSize,
      fontWeight: delegationCardSurface.toolPreviewMoreFontWeight,
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
      fontFamily: resolveChatRuntimeMobileFontFamily(handsFreeSurface.debugText.fontFamilyByPlatform),
    },
    connectionBanner: {
      paddingHorizontal: spacing[connectionBannerSurface.paddingHorizontal],
      paddingVertical: spacing[connectionBannerSurface.paddingVertical],
      marginHorizontal: spacing[connectionBannerSurface.marginHorizontal],
      marginBottom: spacing[connectionBannerSurface.marginBottom],
      borderRadius: radius[connectionBannerSurface.borderRadius],
      borderWidth: connectionBannerSurface.borderWidth,
    },
    connectionBannerReconnecting: {
      backgroundColor: connectionBannerSurfaceColors.reconnecting.backgroundColor,
      borderColor: connectionBannerSurfaceColors.reconnecting.borderColor,
    },
    connectionBannerFailed: {
      backgroundColor: connectionBannerSurfaceColors.failed.backgroundColor,
      borderColor: connectionBannerSurfaceColors.failed.borderColor,
    },
    connectionBannerContent: {
      flexDirection: connectionBannerSurface.contentFlexDirection,
      alignItems: connectionBannerSurface.contentAlignItems,
    },
    connectionBannerIcon: {
      marginRight: spacing[connectionBannerSurface.iconMarginRight],
    },
    connectionBannerTextContainer: {
      flex: connectionBannerSurface.textContainerFlex,
    },
    connectionBannerText: {
      fontSize: connectionBannerSurface.titleFontSize,
      fontWeight: connectionBannerSurface.titleFontWeight,
      color: connectionBannerSurfaceColors.title.color,
    },
    connectionBannerSubtext: {
      fontSize: connectionBannerSurface.subtitleFontSize,
      color: connectionBannerSurfaceColors.subtitle.color,
      marginTop: connectionBannerSurface.subtitleMarginTop,
    },
    retryButton: {
      backgroundColor: connectionBannerSurfaceColors.retryButton.backgroundColor,
      paddingHorizontal: spacing[connectionBannerSurface.retryButton.paddingHorizontal],
      paddingVertical: spacing[connectionBannerSurface.retryButton.paddingVertical],
      borderRadius: radius[connectionBannerSurface.retryButton.borderRadius],
      marginLeft: spacing[connectionBannerSurface.retryButton.marginLeft],
    },
    retryButtonText: {
      color: connectionBannerSurfaceColors.retryButton.color,
      fontSize: connectionBannerSurface.retryButton.fontSize,
      fontWeight: connectionBannerSurface.retryButton.fontWeight,
    },
    scrollToBottomButton: {
      position: scrollToBottomSurface.position,
      right: spacing[scrollToBottomSurface.right],
      width: scrollToBottomSurface.size,
      height: scrollToBottomSurface.size,
      borderRadius: scrollToBottomSurface.borderRadius,
      backgroundColor: scrollToBottomSurfaceColors.button.backgroundColor,
      alignItems: scrollToBottomSurface.alignItems,
      justifyContent: scrollToBottomSurface.justifyContent,
      shadowColor: scrollToBottomSurface.shadowColor,
      shadowOffset: scrollToBottomSurface.shadowOffset,
      shadowOpacity: scrollToBottomSurface.shadowOpacity,
      shadowRadius: scrollToBottomSurface.shadowRadius,
      elevation: scrollToBottomSurface.elevation,
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
	      gap: spacing[toolApprovalSurface.card.gap],
	      padding: spacing[toolApprovalSurface.card.padding],
	      borderRadius: radius[toolApprovalSurface.card.borderRadius],
	      borderWidth: toolApprovalSurface.card.borderWidth,
	      borderColor: toolApprovalSurfaceColors.card.borderColor,
	      backgroundColor: toolApprovalSurfaceColors.card.backgroundColor,
	    },
	    toolApprovalHeader: {
	      flexDirection: toolApprovalSurface.header.flexDirection,
	      alignItems: toolApprovalSurface.header.alignItems,
	      gap: spacing[toolApprovalSurface.header.gap],
	    },
	    toolApprovalContent: {
	      gap: spacing[toolApprovalSurface.content.gap],
	    },
	    toolApprovalContentDisabled: {
	      opacity: toolApprovalSurface.content.disabledOpacity,
	    },
	    toolApprovalTitle: {
	      flex: toolApprovalSurface.title.flex,
	      minWidth: toolApprovalSurface.title.minWidth,
	      fontSize: toolApprovalSurface.title.fontSize,
	      fontWeight: toolApprovalSurface.title.fontWeight,
	      color: toolApprovalSurfaceColors.title.color,
    },
    toolApprovalToolRow: {
      flexDirection: toolApprovalSurface.toolRow.flexDirection,
      alignItems: toolApprovalSurface.toolRow.alignItems,
      flexWrap: toolApprovalSurface.toolRow.flexWrap,
      gap: spacing[toolApprovalSurface.toolRow.gap],
      marginBottom: toolApprovalSurface.toolRow.marginBottom,
    },
    toolApprovalToolLabel: {
      fontSize: toolApprovalSurface.toolLabel.fontSize,
      fontWeight: toolApprovalSurface.toolLabel.fontWeight,
      color: toolApprovalSurfaceColors.toolLabel.color,
    },
    toolApprovalTool: {
      fontFamily: resolveChatRuntimeMobileFontFamily(toolApprovalSurface.toolName.fontFamilyByPlatform),
      fontSize: toolApprovalSurface.toolName.fontSize,
      color: toolApprovalSurfaceColors.toolName.color,
      flexShrink: toolApprovalSurface.toolName.flexShrink,
    },
    toolApprovalArgumentsPreview: {
      fontFamily: resolveChatRuntimeMobileFontFamily(toolApprovalSurface.argumentsPreview.fontFamilyByPlatform),
      fontSize: toolApprovalSurface.argumentsPreview.fontSize,
      lineHeight: toolApprovalSurface.argumentsPreview.lineHeight,
      borderWidth: toolApprovalSurface.argumentsPreview.borderWidth,
      borderRadius: radius[toolApprovalSurface.argumentsPreview.borderRadius],
      paddingHorizontal: spacing[toolApprovalSurface.argumentsPreview.paddingHorizontal],
      paddingVertical: toolApprovalSurface.argumentsPreview.paddingVertical,
      borderColor: toolApprovalSurfaceColors.argumentsPreview.borderColor,
      backgroundColor: toolApprovalSurfaceColors.argumentsPreview.backgroundColor,
      color: toolApprovalSurfaceColors.argumentsPreview.color,
    },
    toolApprovalArgumentsToggle: {
      flexDirection: toolApprovalSurface.argumentsToggle.flexDirection,
      alignItems: toolApprovalSurface.argumentsToggle.alignItems,
      alignSelf: toolApprovalSurface.argumentsToggle.alignSelf,
      gap: toolApprovalSurface.argumentsToggle.gap,
      marginTop: spacing[toolApprovalSurface.argumentsToggle.marginTop],
      paddingVertical: toolApprovalSurface.argumentsToggle.paddingVertical,
    },
    toolApprovalArgumentsTogglePressed: {
      opacity: toolApprovalSurface.argumentsToggle.pressedOpacity,
    },
    toolApprovalArgumentsToggleText: {
      fontSize: toolApprovalSurface.argumentsToggleText.fontSize,
      fontWeight: toolApprovalSurface.argumentsToggleText.fontWeight,
      color: toolApprovalSurfaceColors.argumentsToggleText.color,
    },
    toolApprovalArgumentsScroll: {
      marginTop: toolApprovalSurface.fullArguments.marginTop,
      maxHeight: toolApprovalSurface.fullArguments.maxHeight,
      borderRadius: radius[toolApprovalSurface.fullArguments.borderRadius],
      backgroundColor: toolApprovalSurfaceColors.fullArguments.backgroundColor,
    },
    toolApprovalArgumentsFull: {
      fontFamily: resolveChatRuntimeMobileFontFamily(toolApprovalSurface.fullArguments.fontFamilyByPlatform),
      fontSize: toolApprovalSurface.fullArguments.fontSize,
      lineHeight: toolApprovalSurface.fullArguments.lineHeight,
      padding: toolApprovalSurface.fullArguments.padding,
      color: toolApprovalSurfaceColors.fullArguments.color,
    },
    toolApprovalActions: {
      flexDirection: toolApprovalSurface.actions.flexDirection,
      justifyContent: toolApprovalSurface.actions.justifyContent,
      flexWrap: toolApprovalSurface.actions.flexWrap,
      gap: spacing[toolApprovalSurface.actions.gap],
      marginTop: spacing[toolApprovalSurface.actions.marginTop],
    },
	    toolApprovalButton: {
	      minHeight: toolApprovalSurface.button.minHeight,
	      minWidth: toolApprovalSurface.button.minWidth,
	      borderRadius: radius[toolApprovalSurface.button.borderRadius],
	      paddingHorizontal: spacing[toolApprovalSurface.button.paddingHorizontal],
	      paddingVertical: spacing[toolApprovalSurface.button.paddingVertical],
	      flexDirection: toolApprovalSurface.button.flexDirection,
	      alignItems: toolApprovalSurface.button.alignItems,
	      justifyContent: toolApprovalSurface.button.justifyContent,
	      gap: toolApprovalSurface.button.gap,
	      flex: toolApprovalSurface.button.flex,
	    },
    toolApprovalButtonDisabled: {
      opacity: toolApprovalSurface.disabledOpacity,
    },
	    toolApprovalApproveButton: {
	      backgroundColor: toolApprovalSurfaceColors.approveButton.backgroundColor,
	    },
	    toolApprovalApproveButtonText: {
	      color: toolApprovalSurfaceColors.approveButtonText.color,
	      fontSize: toolApprovalSurface.buttonText.fontSize,
	      fontWeight: toolApprovalSurface.buttonText.fontWeight,
	    },
	    toolApprovalDenyButton: {
	      borderWidth: toolApprovalSurface.buttonVariants.deny.borderWidth,
	      borderColor: toolApprovalSurfaceColors.denyButton.borderColor,
	      backgroundColor: toolApprovalSurfaceColors.denyButton.backgroundColor,
	    },
	    toolApprovalDenyButtonText: {
	      color: toolApprovalSurfaceColors.denyButtonText.color,
	      fontSize: toolApprovalSurface.buttonText.fontSize,
	      fontWeight: toolApprovalSurface.buttonText.fontWeight,
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
      fontFamily: resolveChatRuntimeMobileFontFamily(compactToolExecution.name.fontFamilyByPlatform),
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
      paddingVertical: toolActivityGroupSurface.collapsed.paddingVertical,
      paddingHorizontal: spacing[toolActivityGroupSurface.collapsed.paddingHorizontal],
      borderRadius: radius[toolActivityGroupSurface.collapsed.borderRadius],
      borderWidth: toolActivityGroupSurface.collapsed.borderWidth,
      borderColor: toolActivityGroupSurfaceColors.collapsed.borderColor,
      borderLeftWidth: toolActivityGroupSurface.collapsed.borderLeftWidth,
      borderLeftColor: toolActivityGroupSurfaceColors.collapsed.borderLeftColor,
      backgroundColor: toolActivityGroupSurfaceColors.collapsed.backgroundColor,
      marginBottom: toolActivityGroupSurface.collapsed.marginBottom,
    },
    toolActivityGroupPressed: {
      opacity: toolActivityGroupSurface.pressedOpacity,
    },
    toolActivityGroupHeaderRow: {
      flexDirection: toolActivityGroupSurface.headerRow.flexDirection,
      alignItems: toolActivityGroupSurface.headerRow.alignItems,
      gap: toolActivityGroupSurface.headerRow.gap,
      overflow: toolActivityGroupSurface.headerRow.overflow,
    },
    toolActivityGroupCountBadge: {
      minWidth: toolActivityGroupSurface.countBadge.minWidth,
      paddingHorizontal: toolActivityGroupSurface.countBadge.paddingHorizontal,
      paddingVertical: toolActivityGroupSurface.countBadge.paddingVertical,
      borderRadius: radius[toolActivityGroupSurface.countBadge.borderRadius],
      alignItems: toolActivityGroupSurface.countBadge.alignItems,
      justifyContent: toolActivityGroupSurface.countBadge.justifyContent,
      backgroundColor: toolActivityGroupSurfaceColors.countBadge.backgroundColor,
    },
    toolActivityGroupCountBadgeText: {
      fontFamily: resolveChatRuntimeMobileFontFamily(toolActivityGroupSurface.countBadge.fontFamilyByPlatform),
      fontSize: toolActivityGroupSurface.countBadge.fontSize,
      fontWeight: toolActivityGroupSurface.countBadge.fontWeight,
      color: toolActivityGroupSurfaceColors.countBadge.color,
    },
    toolActivityGroupPreviewLine: {
      fontFamily: resolveChatRuntimeMobileFontFamily(toolActivityGroupSurface.preview.fontFamilyByPlatform),
      fontSize: toolActivityGroupSurface.preview.fontSize,
      color: toolActivityGroupSurfaceColors.preview.color,
      flexShrink: toolActivityGroupSurface.preview.flexShrink,
      minWidth: toolActivityGroupSurface.preview.minWidth,
    },
    toolActivityGroupFooterButton: {
      alignSelf: toolActivityGroupSurface.footerButton.alignSelf,
      flexDirection: toolActivityGroupSurface.footerButton.flexDirection,
      alignItems: toolActivityGroupSurface.footerButton.alignItems,
      gap: toolActivityGroupSurface.footerButton.gap,
      marginTop: toolActivityGroupSurface.footerButton.marginTop,
      marginBottom: toolActivityGroupSurface.footerButton.marginBottom,
      paddingHorizontal: spacing[toolActivityGroupSurface.footerButton.paddingHorizontal],
      paddingVertical: toolActivityGroupSurface.footerButton.paddingVertical,
      borderRadius: radius[toolActivityGroupSurface.footerButton.borderRadius],
    },
    toolActivityGroupFooterText: {
      fontSize: toolActivityGroupSurface.footerText.fontSize,
      fontWeight: toolActivityGroupSurface.footerText.fontWeight,
      color: toolActivityGroupSurfaceColors.footerText.color,
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
      fontFamily: resolveChatRuntimeMobileFontFamily(detailedToolExecution.toolName.fontFamilyByPlatform),
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
      fontFamily: resolveChatRuntimeMobileFontFamily(detailedToolExecution.payloadPreview.fontFamilyByPlatform),
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
      fontFamily: resolveChatRuntimeMobileFontFamily(detailedToolExecution.codeBlock.fontFamilyByPlatform),
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
      fontFamily: resolveChatRuntimeMobileFontFamily(detailedToolExecution.characterCount.fontFamilyByPlatform),
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
      fontFamily: resolveChatRuntimeMobileFontFamily(detailedToolExecution.codeBlock.fontFamilyByPlatform),
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
      fontFamily: resolveChatRuntimeMobileFontFamily(detailedToolExecution.codeBlock.fontFamilyByPlatform),
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
      alignSelf: mobileMessageActionButton.alignSelf,
      width: mobileMessageActionButton.width,
      height: mobileMessageActionButton.height,
      marginTop: mobileMessageActionButton.marginTop,
      borderRadius: mobileMessageActionButton.borderRadius,
      backgroundColor: mobileMessageActionButtonColors.backgroundColor,
      alignItems: mobileMessageActionButton.alignItems,
      justifyContent: mobileMessageActionButton.justifyContent,
      flexShrink: mobileMessageActionButton.flexShrink,
    } as const,
    messageExpandButtonPressed: {
      opacity: mobileMessageActionButton.pressedOpacity,
    },
    messageActionsRow: {
      flexDirection: mobileMessageActionRow.flexDirection,
      alignItems: mobileMessageActionRow.alignItems,
      justifyContent: mobileMessageActionRow.justifyContent,
      marginTop: mobileMessageActionRow.marginTop,
      gap: spacing[mobileMessageActionRow.gap],
    },
    messageTurnDurationBadge: {
      alignSelf: mobileMessageTurnDurationBadge.alignSelf,
      flexDirection: mobileMessageTurnDurationBadge.flexDirection,
      minHeight: mobileMessageTurnDurationBadge.minHeight,
      marginTop: mobileMessageTurnDurationBadge.marginTop,
      paddingHorizontal: mobileMessageTurnDurationBadge.paddingHorizontal,
      borderRadius: mobileMessageTurnDurationBadge.borderRadius,
      backgroundColor: mobileMessageTurnDurationBadgeColors.backgroundColor,
      alignItems: mobileMessageTurnDurationBadge.alignItems,
      justifyContent: mobileMessageTurnDurationBadge.justifyContent,
      gap: mobileMessageTurnDurationBadge.gap,
      flexShrink: mobileMessageTurnDurationBadge.flexShrink,
      opacity: mobileMessageTurnDurationBadge.opacity,
    } as const,
    messageTurnDurationBadgeLive: {
      backgroundColor: mobileMessageTurnDurationLiveBadgeColors.backgroundColor,
      opacity: mobileMessageTurnDurationLiveBadge.opacity,
    } as const,
    messageTurnDurationText: {
      fontFamily: resolveChatRuntimeMobileFontFamily(mobileMessageTurnDurationBadge.fontFamilyByPlatform),
      fontSize: mobileMessageTurnDurationBadge.fontSize,
      lineHeight: mobileMessageTurnDurationBadge.lineHeight,
      fontWeight: mobileMessageTurnDurationBadge.fontWeight,
      color: mobileMessageTurnDurationBadgeColors.color,
    },
    messageTurnDurationTextLive: {
      color: mobileMessageTurnDurationLiveBadgeColors.color,
    },
    messageBranchButton: {
      alignSelf: mobileMessageBranchButton.alignSelf,
      width: mobileMessageBranchButton.width,
      height: mobileMessageBranchButton.height,
      marginTop: mobileMessageBranchButton.marginTop,
      borderRadius: mobileMessageBranchButton.borderRadius,
      backgroundColor: mobileMessageBranchButtonColors.backgroundColor,
      alignItems: mobileMessageBranchButton.alignItems,
      justifyContent: mobileMessageBranchButton.justifyContent,
      flexShrink: mobileMessageBranchButton.flexShrink,
    } as const,
    messageBranchButtonPressed: {
      opacity: mobileMessageBranchButton.pressedOpacity,
    } as const,
    messageBranchButtonDisabled: {
      opacity: mobileMessageBranchButton.disabledOpacity,
    },
    messageCopyButton: {
      alignSelf: mobileMessageActionButton.alignSelf,
      width: mobileMessageActionButton.width,
      height: mobileMessageActionButton.height,
      marginTop: mobileMessageActionButton.marginTop,
      borderRadius: mobileMessageActionButton.borderRadius,
      backgroundColor: mobileMessageActionButtonColors.backgroundColor,
      alignItems: mobileMessageActionButton.alignItems,
      justifyContent: mobileMessageActionButton.justifyContent,
      flexShrink: mobileMessageActionButton.flexShrink,
    } as const,
    messageCopyButtonCopied: {
      backgroundColor: mobileMessageCopiedButtonColors.backgroundColor,
    } as const,
    messageCopyButtonPressed: {
      opacity: mobileMessageActionButton.pressedOpacity,
    } as const,
    // Per-message TTS button styles (#1078)
    speakButton: {
      alignSelf: mobileMessageSpeechButton.alignSelf,
      width: mobileMessageSpeechButton.width,
      height: mobileMessageSpeechButton.height,
      marginTop: mobileMessageSpeechButton.marginTop,
      borderRadius: mobileMessageSpeechButton.borderRadius,
      backgroundColor: mobileMessageSpeechButtonColors.backgroundColor,
      alignItems: mobileMessageSpeechButton.alignItems,
      justifyContent: mobileMessageSpeechButton.justifyContent,
      flexShrink: mobileMessageSpeechButton.flexShrink,
    } as const,
    speakButtonActive: {
      backgroundColor: mobileMessageSpeechActiveButtonColors.backgroundColor,
    } as const,
    speakButtonPressed: {
      opacity: mobileMessageSpeechButton.pressedOpacity,
    } as const,
  });
}

export function useChatRuntimeMobileStyleSlots({
  theme,
  bottomInset,
}: ChatRuntimeMobileStyleSlotsInput) {
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
  const mobileSafeAreaLayout = useMemo(
    () => createChatRuntimeMobileSafeAreaLayoutState(bottomInset),
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

  return {
    chatMessageConversationThreadStyles,
    chatMessageRuntimeSurfaceStyles,
    chatRuntimeHeaderStyles,
    promptEditorModalStyles,
    styles,
  };
}
