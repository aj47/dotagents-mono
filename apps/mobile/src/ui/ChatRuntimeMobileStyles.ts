import { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createChatComposerHandsFreeMobileStyleSlots,
  createChatComposerImageAttachmentMobileStyleSlots,
  createChatSessionStatusMobileChromeStyleSlots,
  createChatRuntimeAgentSelectorMobileStyleSlots,
  createChatRuntimeConnectionBannerMobileStyleSlots,
  createChatRuntimeDelegationCardMobileStyleSlots,
  createChatRuntimeHeaderActionsRowMobileStyleSlot,
  createChatRuntimeHeaderIconContainerMobileStyleSlot,
  createChatRuntimeHeaderPinButtonMobileStyleSlot,
  createChatRuntimeMessageHistoryBannerMobileStyleSlots,
  createChatRuntimeMessageActionButtonMobileStyleSlots,
  createChatRuntimeMessageMobileStyleSlots,
  createChatRuntimeRetryStatusMobileStyleSlots,
  createChatRuntimeScrollToBottomMobileStyleSlots,
  createChatRuntimeStepSummaryMobileStyleSlots,
  createChatRuntimeStreamingContentMobileStyleSlots,
  createChatRuntimeToolActivityGroupMobileStyleSlots,
  createChatRuntimeToolApprovalMobileStyleSlots,
  createChatRuntimeToolExecutionCompactMobileStyleSlots,
  createChatRuntimeToolExecutionDetailMobileStyleSlots,
  createChatRuntimeTurnDurationHeaderMobileStyleSlots,
  createChatRuntimeTurnDurationMessageMobileStyleSlots,
  createChatRuntimeThemeSpinnerSource,
  createChatRuntimeViewportActivityMobileStyleSlots,
  createMessageQueuePanelMobileWrapperStyleSlots,
  getChatRuntimeMobileChromeStyleRenderState,
  getChatRuntimeMobileSafeAreaLayoutState,
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
  const imageAttachmentStyleSlots = createChatComposerImageAttachmentMobileStyleSlots({
    renderState: imageAttachmentStyleState,
    spacing,
    radius,
  });
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
  const handsFreeStyleSlots = createChatComposerHandsFreeMobileStyleSlots({
    renderState: handsFreeStyleState,
    spacing,
    radius,
    platform: mobilePlatform,
  });
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
  const compactToolExecutionStyleSlots = createChatRuntimeToolExecutionCompactMobileStyleSlots({
    renderState: compactToolExecutionStyleState,
    radius,
    platform: mobilePlatform,
  });
  const toolExecutionDetailStyleState = threadChromeStyleState.toolExecutionDetail;
  const toolExecutionDetailStyleSlots = createChatRuntimeToolExecutionDetailMobileStyleSlots({
    renderState: toolExecutionDetailStyleState,
    spacing,
    radius,
    platform: mobilePlatform,
  });
  const viewportSurfaceColors = viewportStyleState.colors;
  const toolActivityGroupStyleState = threadChromeStyleState.toolActivityGroup;
  const toolActivityGroupStyleSlots = createChatRuntimeToolActivityGroupMobileStyleSlots({
    renderState: toolActivityGroupStyleState,
    spacing,
    radius,
    platform: mobilePlatform,
  });
  const toolApprovalStyleState = threadChromeStyleState.toolApproval;
  const toolApprovalStyleSlots = createChatRuntimeToolApprovalMobileStyleSlots({
    renderState: toolApprovalStyleState,
    spacing,
    radius,
    platform: mobilePlatform,
  });
  const mobileMessageThreadStyleState = threadChromeStyleState.messageThread;
  const mobileMessageStyleState = mobileMessageThreadStyleState.message;
  const mobileMessageStyleSlots = createChatRuntimeMessageMobileStyleSlots({
    renderState: mobileMessageStyleState,
    spacing,
    radius,
    borderWidths: theme,
  });
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
      ...mobileMessageStyleSlots.message,
    },
    user: mobileMessageStyleSlots.user,
    assistant: mobileMessageStyleSlots.assistant,
    assistantFinal: mobileMessageStyleSlots.assistantFinal,
    tool: mobileMessageStyleSlots.tool,
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
      width: compactToolExecutionStyleSlots.statusIndicator.width,
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
      ...imageAttachmentStyleSlots.row,
    },
    pendingImageCard: {
      ...imageAttachmentStyleSlots.card,
    },
    pendingImagePreview: {
      ...imageAttachmentStyleSlots.preview,
    },
    pendingImageRemoveButton: {
      ...imageAttachmentStyleSlots.removeButton,
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
      ...handsFreeStyleSlots.statusRow,
    },
    handsFreeControlsRow: {
      ...handsFreeStyleSlots.controlsRow,
    },
    handsFreeControlButton: {
      ...handsFreeStyleSlots.controlButton,
    },
    handsFreeControlButtonText: {
      ...handsFreeStyleSlots.controlButtonText,
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
      ...handsFreeStyleSlots.debugPanel,
    },
    debugText: {
      ...handsFreeStyleSlots.debugText,
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
      ...toolExecutionDetailStyleSlots.card,
    },
    toolExecutionPending: toolExecutionDetailStyleSlots.pending,
    toolExecutionSuccess: toolExecutionDetailStyleSlots.success,
    toolExecutionError: toolExecutionDetailStyleSlots.error,
    toolExecutionExpandedContainer: {
      ...toolExecutionDetailStyleSlots.expandedContainer,
    },
    toolExecutionCollapseTopButton: {
      ...toolExecutionDetailStyleSlots.collapseTopButton,
    },
    toolExecutionCollapseBottomButton: {
      ...toolExecutionDetailStyleSlots.collapseBottomButton,
    },
    toolCallCompactContainer: {
      ...compactToolExecutionStyleSlots.container,
    },
    toolCallCompactLine: {
      ...compactToolExecutionStyleSlots.line,
    },
    toolCallCompactLeadingIcon: {
      ...compactToolExecutionStyleSlots.leadingIcon,
    },
    toolCallCompactPressed: {
      ...compactToolExecutionStyleSlots.pressed,
    },
    toolCallCompactName: {
      ...compactToolExecutionStyleSlots.name,
    },
    toolCallCompactNamePending: {
      ...compactToolExecutionStyleSlots.namePending,
    },
    toolCallCompactNameSuccess: {
      ...compactToolExecutionStyleSlots.nameSuccess,
    },
    toolCallCompactNameError: {
      ...compactToolExecutionStyleSlots.nameError,
    },
    toolCallCompactStatusIndicator: {
      ...compactToolExecutionStyleSlots.statusIndicator,
    },
    toolCallCompactToggleIcon: {
      ...compactToolExecutionStyleSlots.toggleIcon,
    },
    toolCallCompactStatusPending: {
      ...compactToolExecutionStyleSlots.statusPending,
    },
    toolCallCompactStatusSuccess: {
      ...compactToolExecutionStyleSlots.statusSuccess,
    },
    toolCallCompactStatusError: {
      ...compactToolExecutionStyleSlots.statusError,
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
      ...toolExecutionDetailStyleSlots.paramsSection,
    },
    toolCallSection: {
      ...toolExecutionDetailStyleSlots.callSection,
    },
    toolName: {
      ...toolExecutionDetailStyleSlots.toolName,
    },
    toolCallHeader: {
      ...toolExecutionDetailStyleSlots.callHeader,
    },
    toolCallHeaderPressed: {
      ...toolExecutionDetailStyleSlots.callHeaderPressed,
    },
    toolCallExpandHint: {
      ...toolExecutionDetailStyleSlots.expandHint,
    },
    toolCallExpandHintText: {
      ...toolExecutionDetailStyleSlots.expandHintText,
    },
    toolSectionLabel: {
      ...toolExecutionDetailStyleSlots.sectionLabel,
    },
    toolDetailHeaderRow: {
      ...toolExecutionDetailStyleSlots.detailHeaderRow,
    },
    toolPayloadMetaRow: {
      ...toolExecutionDetailStyleSlots.payloadMetaRow,
    },
    toolPayloadType: {
      ...toolExecutionDetailStyleSlots.payloadType,
    },
    toolPayloadPreview: {
      ...toolExecutionDetailStyleSlots.payloadPreview,
    },
    toolDetailCopyButton: {
      ...toolExecutionDetailStyleSlots.copyButton,
    },
    toolDetailCopyButtonPressed: {
      ...toolExecutionDetailStyleSlots.copyButtonPressed,
    },
    toolDetailCopyButtonText: {
      ...toolExecutionDetailStyleSlots.copyButtonText,
    },
    toolParamsScroll: {
      ...toolExecutionDetailStyleSlots.paramsScroll,
    },
    toolParamsScrollExpanded: {
      ...toolExecutionDetailStyleSlots.paramsScrollExpanded,
    },
    toolParamsCode: {
      ...toolExecutionDetailStyleSlots.paramsCode,
    },
    toolResponsePendingText: {
      ...toolExecutionDetailStyleSlots.responsePendingText,
    },
    toolResponsePendingRow: {
      ...toolExecutionDetailStyleSlots.responsePendingRow,
    },
    toolResultItem: {
      ...toolExecutionDetailStyleSlots.resultItem,
    },
    toolResultHeader: {
      ...toolExecutionDetailStyleSlots.resultHeader,
    },
    toolResultHeaderMeta: {
      ...toolExecutionDetailStyleSlots.resultHeaderMeta,
    },
    toolResultCharCount: {
      ...toolExecutionDetailStyleSlots.resultCharCount,
    },
    toolResultBadge: {
      ...toolExecutionDetailStyleSlots.resultBadge,
    },
    toolResultBadgeSuccess: {
      ...toolExecutionDetailStyleSlots.resultBadgeSuccess,
    },
    toolResultBadgeError: {
      ...toolExecutionDetailStyleSlots.resultBadgeError,
    },
    toolResultBadgeText: {
      ...toolExecutionDetailStyleSlots.resultBadgeText,
    },
    toolResultBadgeTextSuccess: {
      ...toolExecutionDetailStyleSlots.resultBadgeTextSuccess,
    },
    toolResultBadgeTextError: {
      ...toolExecutionDetailStyleSlots.resultBadgeTextError,
    },
    toolResultScroll: {
      ...toolExecutionDetailStyleSlots.resultScroll,
    },
    toolResultScrollExpanded: {
      ...toolExecutionDetailStyleSlots.resultScrollExpanded,
    },
    toolResultCode: {
      ...toolExecutionDetailStyleSlots.resultCode,
    },
    toolResultErrorSection: {
      ...toolExecutionDetailStyleSlots.resultErrorSection,
    },
    toolResultErrorLabel: {
      ...toolExecutionDetailStyleSlots.resultErrorLabel,
    },
    toolResultErrorText: {
      ...toolExecutionDetailStyleSlots.resultErrorText,
    },
    messageContentRow: {
      ...mobileMessageStyleSlots.contentRow,
    },
    messageContentBody: {
      ...mobileMessageStyleSlots.contentBody,
    },
    collapsedMessagePreviewToggle: {
      ...mobileMessageStyleSlots.collapsedPreviewToggle,
    },
    collapsedMessagePreviewTogglePressed: {
      ...mobileMessageStyleSlots.collapsedPreviewTogglePressed,
    },
    collapsedMessagePreview: {
      ...mobileMessageStyleSlots.collapsedPreview,
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
