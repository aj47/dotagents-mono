import { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createChatComposerHandsFreeMobileStyleSlots,
  createChatComposerImageAttachmentMobileStyleSlots,
  createChatComposerMobileStyleSlots,
  createChatSessionStatusMobileChromeStyleSlots,
  createChatRuntimeAgentSelectorMobileStyleSlots,
  createChatRuntimeConnectionBannerMobileStyleSlots,
  createChatRuntimeDelegationCardMobileStyleSlots,
  createChatRuntimeHeaderActionsRowMobileStyleSlot,
  createChatRuntimeHeaderIconContainerMobileStyleSlots,
  createChatRuntimeHeaderPinButtonMobileStyleSlots,
  createChatRuntimeMessageHistoryBannerMobileStyleSlots,
  createChatRuntimeMessageActionButtonMobileStyleSlots,
  createChatRuntimeMessageActionRowMobileStyleSlot,
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
  createChatRuntimeViewportMobileStyleSlots,
  createChatConversationHomePromptEditorMobileStyleSlots,
  createChatConversationHomePromptLibraryMobileStyleSlots,
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
  const headerPinButtonStyleSlots = createChatRuntimeHeaderPinButtonMobileStyleSlots({
    surface: headerSurface,
    touchTarget: chatChromeStyleState.headerPinButton,
    colors: headerStyleState.pinButton,
    radius,
  });
  const headerIconContainerStyleSlots = createChatRuntimeHeaderIconContainerMobileStyleSlots({
    surface: headerSurface,
    colors: {
      killSwitchButton: headerStyleState.killSwitchButton,
    },
  });
  const conversationChromeStyleState = chatChromeStyleState.conversation;
  const viewportStyleState = conversationChromeStyleState.viewport;
  const viewportStyleSlots = createChatRuntimeViewportMobileStyleSlots({
    renderState: viewportStyleState,
    spacing,
  });
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
  const composerStyleSlots = createChatComposerMobileStyleSlots({
    renderState: composerStyleState,
    spacing,
    radius,
    borderWidths: theme,
  });
  const imageAttachmentStyleState = composerChromeStyleState.imageAttachment;
  const imageAttachmentStyleSlots = createChatComposerImageAttachmentMobileStyleSlots({
    renderState: imageAttachmentStyleState,
    spacing,
    radius,
  });
  const promptLibraryStyleState = composerChromeStyleState.promptLibrary;
  const promptLibraryStyleSlots = createChatConversationHomePromptLibraryMobileStyleSlots({
    renderState: promptLibraryStyleState,
    spacing,
    radius,
  });
  const promptEditorModalStyleSlots = createChatConversationHomePromptEditorMobileStyleSlots({
    renderState: promptLibraryStyleState,
    inputPaddingVertical: composerChromeStyleState.promptEditorInputPaddingVertical,
    spacing,
    radius,
  });
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
  const mobileMessageActionRowStyleSlot = createChatRuntimeMessageActionRowMobileStyleSlot({
    row: mobileMessageActionStyleState.row,
    spacing,
  });
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
  return StyleSheet.create({
    keyboardAvoidingContainer: {
      ...viewportStyleSlots.keyboardAvoidingContainer,
    },
    chatRoot: {
      ...viewportStyleSlots.root,
    },
    chatScroll: {
      ...viewportStyleSlots.scroll,
    },
    chatScrollContent: {
      ...viewportStyleSlots.scrollContent,
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
      ...headerPinButtonStyleSlots.inactive,
    },
    headerPinButtonActive: {
      ...headerPinButtonStyleSlots.active,
    },
    headerKillSwitchIconContainer: {
      ...headerIconContainerStyleSlots.killSwitch,
    },
    headerHandsFreeIconContainer: {
      ...headerIconContainerStyleSlots.handsFree,
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
      ...composerStyleSlots.inputArea,
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
      ...composerStyleSlots.sttPreviewBox,
    },
    sttPreviewLabel: {
      ...composerStyleSlots.sttPreviewLabel,
    },
    sttPreviewText: {
      ...composerStyleSlots.sttPreviewText,
    },
    inputRow: {
      ...composerStyleSlots.inputRow,
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
      ...promptLibraryStyleSlots.chatHomeCard,
    },
    chatHomeEmptyText: {
      ...promptLibraryStyleSlots.chatHomeEmptyText,
    },
    chatHomeShortcutGrid: {
      ...promptLibraryStyleSlots.chatHomeShortcutGrid,
    },
    chatHomeShortcutCard: {
      ...promptLibraryStyleSlots.chatHomeShortcutCard,
    },
    chatHomeShortcutCardAdd: {
      ...promptLibraryStyleSlots.chatHomeShortcutCardAdd,
    },
    chatHomeShortcutAddIcon: {
      ...promptLibraryStyleSlots.chatHomeShortcutAddIcon,
    },
    chatHomeShortcutCardDisabled: {
      ...promptLibraryStyleSlots.chatHomeShortcutCardDisabled,
    },
    chatHomeShortcutCardPressed: {
      ...promptLibraryStyleSlots.chatHomeShortcutCardPressed,
    },
    chatHomeShortcutSourcePill: {
      ...promptLibraryStyleSlots.chatHomeShortcutSourcePill,
    },
    chatHomeShortcutSourceLabel: {
      ...promptLibraryStyleSlots.chatHomeShortcutSourceLabel,
    },
    chatHomeShortcutTitle: {
      ...promptLibraryStyleSlots.chatHomeShortcutTitle,
    },
    chatHomeShortcutTitleAdd: {
      ...promptLibraryStyleSlots.chatHomeShortcutTitleAdd,
    },
    chatHomeShortcutDescription: {
      ...promptLibraryStyleSlots.chatHomeShortcutDescription,
    },
    chatHomeShortcutActions: {
      ...promptLibraryStyleSlots.chatHomeShortcutActions,
    },
    chatHomeShortcutActionButton: {
      ...promptLibraryStyleSlots.chatHomeShortcutActionButton,
    },
    chatHomeShortcutActionButtonPressed: {
      ...promptLibraryStyleSlots.chatHomeShortcutActionButtonPressed,
    },
    chatHomeShortcutActionText: {
      ...promptLibraryStyleSlots.chatHomeShortcutActionText,
    },
    chatHomeShortcutActionDangerText: {
      ...promptLibraryStyleSlots.chatHomeShortcutActionDangerText,
    },
    modalKeyboardAvoidingView: {
      ...promptEditorModalStyleSlots.modalKeyboardAvoidingView,
    },
    modalOverlay: {
      ...promptEditorModalStyleSlots.modalOverlay,
    },
    modalContent: {
      ...promptEditorModalStyleSlots.modalContent,
    },
    modalHeader: {
      ...promptEditorModalStyleSlots.modalHeader,
    },
    modalTitle: {
      ...promptEditorModalStyleSlots.modalTitle,
    },
    modalCloseButton: {
      ...promptEditorModalStyleSlots.modalCloseButton,
    },
    modalLabel: {
      ...promptEditorModalStyleSlots.modalLabel,
    },
    modalInput: {
      ...promptEditorModalStyleSlots.modalInput,
    },
    modalInputMultiline: {
      ...promptEditorModalStyleSlots.modalInputMultiline,
    },
    modalActions: {
      ...promptEditorModalStyleSlots.modalActions,
    },
    modalCancelButton: {
      ...promptEditorModalStyleSlots.modalCancelButton,
    },
    modalCancelButtonText: {
      ...promptEditorModalStyleSlots.modalCancelButtonText,
    },
    modalSaveButton: {
      ...promptEditorModalStyleSlots.modalSaveButton,
    },
    modalSaveButtonDisabled: {
      ...promptEditorModalStyleSlots.modalSaveButtonDisabled,
    },
    modalSaveButtonText: {
      ...promptEditorModalStyleSlots.modalSaveButtonText,
    },
    input: {
      ...composerStyleSlots.input,
    },
    visuallyHiddenComposerHint: {
      ...composerStyleSlots.visuallyHiddenComposerHint,
    },
    micWrapper: {
      ...composerStyleSlots.micWrapper,
    },
    mic: {
      ...composerStyleSlots.mic,
    },
    micOn: {
      ...composerStyleSlots.micOn,
    },
    micLabel: {
      ...composerStyleSlots.micLabel,
    },
    micLabelOn: {
      ...composerStyleSlots.micLabelOn,
    },
    ttsToggle: {
      ...composerStyleSlots.accessoryButton,
    },
    ttsToggleOn: {
      ...composerStyleSlots.accessoryButtonActive,
    },
    sendButton: {
      ...composerStyleSlots.submitButton,
    },
    queueButton: {
      ...composerStyleSlots.queueButton,
    },
    sendButtonDisabled: {
      ...composerStyleSlots.submitButtonDisabled,
    },
    queueButtonText: {
      ...composerStyleSlots.queueButtonText,
    },
    sendButtonText: {
      ...composerStyleSlots.submitButtonText,
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
      ...composerStyleSlots.overlay,
    },
    overlayCard: {
      ...composerStyleSlots.overlayCard,
    },
    overlayText: {
      ...composerStyleSlots.overlayText,
    },
    overlayTranscript: {
      ...composerStyleSlots.overlayTranscript,
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
      ...mobileMessageActionRowStyleSlot,
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
