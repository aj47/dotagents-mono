import { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createAgentSelectorMobileStyleSheetSlots,
  createAgentResponseHistoryMobileStyleSheetSlots,
  createChatVideoAttachmentMobileStyleSheetSlots,
  createChatRuntimeMobileChromeSlotsFromStyleSource,
  createChatRuntimeMobileChromeStyleSlots,
  createChatRuntimeThemeSpinnerSource,
  createMessageQueuePanelMobileStyleSheetSlots,
  createQueuedMessageItemMobileStyleSheetSlots,
  createMarkdownContentMobileStyleSheetSlots,
  createMarkdownThinkSectionMobileStyleSheetSlots,
  createHandsFreeStatusChipMobileStyleSheetSlots,
  getAgentSelectorMobileRenderState,
  getChatRuntimeMobileChromeStyleRenderState,
  getChatRuntimeMobileSafeAreaLayoutState,
  getChatVideoAttachmentMobileRenderState,
  getHandsFreeStatusChipMobileRenderState,
  getMarkdownContentMobileSurfaceRenderState,
  getMarkdownThinkSectionMobileSurfaceRenderState,
  type AgentSelectorMobileRenderState as SharedAgentSelectorMobileRenderState,
  type AgentSelectorMobileRenderStateInput,
  type AgentSelectorMobileStyleSheetSlots,
  type AgentSelectorMobileStyleSheetSlotsInput,
  type AgentResponseHistoryMobileStyleSheetSlots,
  type AgentResponseHistoryMobileStyleSheetSlotsInput,
  type ChatRuntimeConversationSurfaceToneMobileStyleSlot,
  type ChatRuntimeMobileChromeSlotsFromStyleSource,
  type ChatVideoAttachmentMobileRenderState as SharedChatVideoAttachmentMobileRenderState,
  type ChatVideoAttachmentMobileRenderStateInput,
  type ChatVideoAttachmentMobileStyleSheetSlots,
  type ChatVideoAttachmentMobileStyleSheetSlotsInput,
  type HandsFreeStatusChipMobileRenderState as SharedHandsFreeStatusChipMobileRenderState,
  type HandsFreeStatusChipMobileRenderStateInput,
  type HandsFreeStatusChipMobileStyleSheetSlots,
  type HandsFreeStatusChipMobileStyleSheetSlotsInput,
  type MarkdownContentMobileStyleSheetSlots,
  type MarkdownContentMobileStyleSheetSlotsInput,
  type MarkdownContentMobileSurfaceRenderState,
  type MarkdownThinkSectionMobileStyleSheetSlots,
  type MarkdownThinkSectionMobileStyleSheetSlotsInput,
  type MarkdownThinkSectionMobileSurfaceRenderState,
  type MessageQueuePanelMobileStyleSheetSlots,
  type MessageQueuePanelMobileStyleSheetSlotsInput,
  type QueuedMessage,
  type QueuedMessageItemMobileStyleSheetSlots,
  type QueuedMessageItemMobileStyleSheetSlotsInput,
} from '@dotagents/shared/session-presentation';
import { useTheme } from './ThemeProvider';
import { radius, spacing, type Theme } from './theme';

const darkSpinnerSource: ImageSourcePropType = require('../../assets/loading-spinner.gif');
const lightSpinnerSource: ImageSourcePropType = require('../../assets/light-spinner.gif');

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
  const chatMobileStyleSlots = createChatRuntimeMobileChromeStyleSlots({
    renderState: chatChromeStyleState,
    spacing,
    radius,
    borderWidths: theme,
    platform: mobilePlatform,
  });
  const headerMobileStyleSlots = chatMobileStyleSlots.header;
  const threadMobileStyleSlots = chatMobileStyleSlots.thread;
  const conversationMobileStyleSlots = chatMobileStyleSlots.conversation;
  const composerChromeStyleSlots = chatMobileStyleSlots.composer;
  const composerStyleSlots = composerChromeStyleSlots.composer;
  const imageAttachmentStyleSlots = composerChromeStyleSlots.imageAttachment;
  const promptLibraryStyleSlots = composerChromeStyleSlots.promptLibrary;
  const promptEditorModalStyleSlots = composerChromeStyleSlots.promptEditorModal;
  const messageQueuePanelWrapperStyleSlots = chatMobileStyleSlots.messageQueuePanelWrapper;
  const handsFreeStyleSlots = composerChromeStyleSlots.handsFree;
  const headerActionButton = chatMobileStyleSlots.headerActionButton;
  const headerEdgeActionButton = chatMobileStyleSlots.headerEdgeActionButton;
  const compactToolExecutionStyleSlots = threadMobileStyleSlots.compactToolExecution;
  const toolExecutionDetailStyleSlots = threadMobileStyleSlots.toolExecutionDetail;
  const toolActivityGroupStyleSlots = threadMobileStyleSlots.toolActivityGroup;
  const toolApprovalStyleSlots = threadMobileStyleSlots.toolApproval;
  const mobileMessageStyleSlots = threadMobileStyleSlots.message;
  const mobileMessageActionStyleSlots = threadMobileStyleSlots.action;
  const mobileMessageActionButtonStyleSlots = mobileMessageActionStyleSlots.buttons;
  const mobileMessageActiveActionButtonStyleSlots = mobileMessageActionStyleSlots.activeButtons;
  const mobileMessageTurnDurationStyleSlots = threadMobileStyleSlots.turnDuration;
  return StyleSheet.create({
    keyboardAvoidingContainer: {
      ...conversationMobileStyleSlots.viewport.keyboardAvoidingContainer,
    },
    chatRoot: {
      ...conversationMobileStyleSlots.viewport.root,
    },
    chatScroll: {
      ...conversationMobileStyleSlots.viewport.scroll,
    },
    chatScrollContent: {
      ...conversationMobileStyleSlots.viewport.scrollContent,
    },
    loadingState: {
      ...conversationMobileStyleSlots.activity.loadingState,
    },
    loadingSpinner: {
      ...conversationMobileStyleSlots.activity.loadingSpinner,
    },
    inlineActivityIndicator: {
      ...conversationMobileStyleSlots.activity.inlineActivityIndicator,
    },
    inlineActivitySpinner: {
      ...conversationMobileStyleSlots.activity.inlineActivitySpinner,
    },
    streamingContentHeader: {
      ...conversationMobileStyleSlots.streamingContent.header,
    },
    streamingContentTitle: {
      ...conversationMobileStyleSlots.streamingContent.title,
    },
    streamingContentSpinner: {
      ...conversationMobileStyleSlots.streamingContent.spinner,
    },
    streamingContentBadge: {
      ...conversationMobileStyleSlots.streamingContent.badge,
    },
    streamingContentBadgeText: {
      ...conversationMobileStyleSlots.streamingContent.badgeText,
    },
    streamingContentBodyRow: {
      ...conversationMobileStyleSlots.streamingContent.bodyRow,
    },
    streamingContentText: {
      ...conversationMobileStyleSlots.streamingContent.text,
    },
    streamingContentCaret: {
      ...conversationMobileStyleSlots.streamingContent.caret,
    },
    messageQueuePanelWrapper: {
      ...messageQueuePanelWrapperStyleSlots.wrapper,
    },
    headerAgentSelectorButton: {
      ...headerMobileStyleSlots.agentSelector.button,
    },
    headerAgentSelectorChip: {
      ...headerMobileStyleSlots.agentSelector.chip,
    },
    headerAgentSelectorText: {
      ...headerMobileStyleSlots.agentSelector.text,
    },
    headerActionsRow: {
      ...headerMobileStyleSlots.actionsRow,
    },
    headerConversationChip: {
      ...headerMobileStyleSlots.sessionStatus.chip,
    },
    headerConversationChipText: {
      ...headerMobileStyleSlots.sessionStatus.text,
    },
    headerConversationSpinner: {
      ...headerMobileStyleSlots.sessionStatus.spinner,
    },
    headerDurationChip: {
      ...headerMobileStyleSlots.turnDuration.standard.chip,
    },
    headerDurationChipLive: {
      ...headerMobileStyleSlots.turnDuration.live.chip,
    },
    headerDurationChipText: {
      ...headerMobileStyleSlots.turnDuration.standard.text,
    },
    headerDurationChipTextLive: {
      ...headerMobileStyleSlots.turnDuration.live.text,
    },
    headerActionButton,
    headerEdgeActionButton,
    headerPinButton: {
      ...headerMobileStyleSlots.pinButton.inactive,
    },
    headerPinButtonActive: {
      ...headerMobileStyleSlots.pinButton.active,
    },
    headerKillSwitchIconContainer: {
      ...headerMobileStyleSlots.iconContainer.killSwitch,
    },
    headerHandsFreeIconContainer: {
      ...headerMobileStyleSlots.iconContainer.handsFree,
    },
    loadOlderContainer: {
      ...conversationMobileStyleSlots.messageHistoryBanner.container,
    },
    loadOlderText: {
      ...conversationMobileStyleSlots.messageHistoryBanner.summaryText,
    },
    loadOlderButton: {
      ...conversationMobileStyleSlots.messageHistoryBanner.loadButton,
    },
    loadOlderButtonPressed: {
      ...conversationMobileStyleSlots.messageHistoryBanner.loadButtonPressed,
    },
    loadOlderButtonText: {
      ...conversationMobileStyleSlots.messageHistoryBanner.loadButtonText,
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
      ...conversationMobileStyleSlots.retryStatus.card,
    },
    retryStatusHeader: {
      ...conversationMobileStyleSlots.retryStatus.header,
    },
    retryStatusTitle: {
      ...conversationMobileStyleSlots.retryStatus.title,
    },
    retryStatusMetaRow: {
      ...conversationMobileStyleSlots.retryStatus.metaRow,
    },
    retryStatusAttempt: {
      ...conversationMobileStyleSlots.retryStatus.attempt,
    },
    retryStatusCountdown: {
      ...conversationMobileStyleSlots.retryStatus.countdown,
    },
    retryStatusDescription: {
      ...conversationMobileStyleSlots.retryStatus.description,
    },
    stepSummaryCard: {
      ...conversationMobileStyleSlots.stepSummary.card,
    },
    stepSummaryHeader: {
      ...conversationMobileStyleSlots.stepSummary.header,
    },
    stepSummaryTitle: {
      ...conversationMobileStyleSlots.stepSummary.title,
    },
    stepSummaryBadge: {
      ...conversationMobileStyleSlots.stepSummary.badge,
    },
    stepSummaryBadgeText: {
      ...conversationMobileStyleSlots.stepSummary.badgeText,
    },
    stepSummaryAction: {
      ...conversationMobileStyleSlots.stepSummary.action,
    },
    stepSummaryMeta: {
      ...conversationMobileStyleSlots.stepSummary.meta,
    },
    stepSummaryPreview: {
      ...conversationMobileStyleSlots.stepSummary.preview,
    },
    delegationCard: {
      ...conversationMobileStyleSlots.delegationCard.card,
    },
    delegationHeader: {
      ...conversationMobileStyleSlots.delegationCard.header,
    },
    delegationTitle: {
      ...conversationMobileStyleSlots.delegationCard.title,
    },
    delegationStatusBadge: {
      ...conversationMobileStyleSlots.delegationCard.statusBadge,
    },
    delegationStatusText: {
      ...conversationMobileStyleSlots.delegationCard.statusText,
    },
    delegationLiveText: {
      ...conversationMobileStyleSlots.delegationCard.liveText,
    },
    delegationSubtitle: {
      ...conversationMobileStyleSlots.delegationCard.subtitle,
    },
    delegationMetaRow: {
      ...conversationMobileStyleSlots.delegationCard.metaRow,
    },
    delegationMetaText: {
      ...conversationMobileStyleSlots.delegationCard.metaText,
    },
    delegationConversationPreview: {
      ...conversationMobileStyleSlots.delegationCard.conversationPreview,
    },
    delegationConversationPreviewLine: {
      ...conversationMobileStyleSlots.delegationCard.conversationPreviewLine,
    },
    delegationConversationPreviewRole: {
      ...conversationMobileStyleSlots.delegationCard.conversationPreviewRole,
    },
    delegationConversationPreviewContent: {
      ...conversationMobileStyleSlots.delegationCard.conversationPreviewContent,
    },
    delegationConversationPreviewTimestamp: {
      ...conversationMobileStyleSlots.delegationCard.conversationPreviewTimestamp,
    },
    delegationConversationPreviewMoreButton: {
      ...conversationMobileStyleSlots.delegationCard.conversationPreviewMoreButton,
    },
    delegationConversationPreviewMoreButtonPressed: {
      ...conversationMobileStyleSlots.delegationCard.conversationPreviewMoreButtonPressed,
    },
    delegationConversationPreviewMore: {
      ...conversationMobileStyleSlots.delegationCard.conversationPreviewMore,
    },
    delegationToolPreview: {
      ...conversationMobileStyleSlots.delegationCard.toolPreview,
    },
    delegationToolPreviewLabel: {
      ...conversationMobileStyleSlots.delegationCard.toolPreviewLabel,
    },
    delegationToolPreviewLine: {
      ...conversationMobileStyleSlots.delegationCard.toolPreviewLine,
    },
    delegationToolPreviewStatusIcon: {
      ...conversationMobileStyleSlots.delegationCard.toolPreviewStatusIcon,
    },
    delegationToolPreviewName: {
      ...conversationMobileStyleSlots.delegationCard.toolPreviewName,
    },
    delegationToolPreviewMoreButton: {
      ...conversationMobileStyleSlots.delegationCard.toolPreviewMoreButton,
    },
    delegationToolPreviewMoreButtonPressed: {
      ...conversationMobileStyleSlots.delegationCard.toolPreviewMoreButtonPressed,
    },
    delegationToolPreviewMore: {
      ...conversationMobileStyleSlots.delegationCard.toolPreviewMore,
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
      ...conversationMobileStyleSlots.connectionBanner.banner,
    },
    connectionBannerReconnecting: {
      ...conversationMobileStyleSlots.connectionBanner.reconnecting,
    },
    connectionBannerFailed: {
      ...conversationMobileStyleSlots.connectionBanner.failed,
    },
    connectionBannerContent: {
      ...conversationMobileStyleSlots.connectionBanner.content,
    },
    connectionBannerIcon: {
      ...conversationMobileStyleSlots.connectionBanner.icon,
    },
    connectionBannerTextContainer: {
      ...conversationMobileStyleSlots.connectionBanner.textContainer,
    },
    connectionBannerText: {
      ...conversationMobileStyleSlots.connectionBanner.title,
    },
    connectionBannerSubtext: {
      ...conversationMobileStyleSlots.connectionBanner.subtitle,
    },
    retryButton: {
      ...conversationMobileStyleSlots.connectionBanner.retryButton,
    },
    retryButtonText: {
      ...conversationMobileStyleSlots.connectionBanner.retryButtonText,
    },
    scrollToBottomButton: {
      ...conversationMobileStyleSlots.scrollToBottom.button,
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
    toolExecutionStatsText: {
      ...toolExecutionDetailStyleSlots.statsText,
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
      ...mobileMessageActionButtonStyleSlots.expansion.button,
    },
    messageExpandButtonPressed: mobileMessageActionButtonStyleSlots.expansion.pressed,
    messageActionsRow: {
      ...mobileMessageActionStyleSlots.row,
    },
    messageTurnDurationBadge: {
      ...mobileMessageTurnDurationStyleSlots.standard.badge,
    },
    messageTurnDurationBadgeLive: {
      ...mobileMessageTurnDurationStyleSlots.live.badge,
    },
    messageTurnDurationText: {
      ...mobileMessageTurnDurationStyleSlots.standard.text,
    },
    messageTurnDurationTextLive: {
      ...mobileMessageTurnDurationStyleSlots.live.text,
    },
    messageBranchButton: {
      ...mobileMessageActionButtonStyleSlots.branch.button,
    },
    messageBranchButtonPressed: mobileMessageActionButtonStyleSlots.branch.pressed,
    messageBranchButtonDisabled: mobileMessageActionButtonStyleSlots.branch.disabled,
    messageCopyButton: {
      ...mobileMessageActionButtonStyleSlots.copy.button,
    },
    messageCopyButtonCopied: {
      ...mobileMessageActiveActionButtonStyleSlots.copy.button,
    },
    messageCopyButtonPressed: mobileMessageActionButtonStyleSlots.copy.pressed,
    // Per-message TTS button styles (#1078)
    speakButton: {
      ...mobileMessageActionButtonStyleSlots.speech.button,
    },
    speakButtonActive: {
      ...mobileMessageActiveActionButtonStyleSlots.speech.button,
    },
    speakButtonPressed: mobileMessageActionButtonStyleSlots.speech.pressed,
  });
}

export type ChatRuntimeMobileStyles = ReturnType<typeof createChatRuntimeMobileStyles>;

export type ChatRuntimeResponseHistoryPanelStyleSheetSlotsInput = Pick<
  AgentResponseHistoryMobileStyleSheetSlotsInput,
  'renderState'
>;

export function createChatRuntimeResponseHistoryPanelStyleSheetSlots({
  renderState,
}: ChatRuntimeResponseHistoryPanelStyleSheetSlotsInput): AgentResponseHistoryMobileStyleSheetSlots {
  return createAgentResponseHistoryMobileStyleSheetSlots({
    renderState,
    spacing,
    radius,
  });
}

export type ChatRuntimeMessageQueuePanelStyleSheetSlotsInput = Pick<
  MessageQueuePanelMobileStyleSheetSlotsInput<QueuedMessage>,
  'renderState'
>;

export type ChatRuntimeQueuedMessageItemStyleSheetSlotsInput = Pick<
  QueuedMessageItemMobileStyleSheetSlotsInput,
  'renderState'
>;

export function createChatRuntimeMessageQueuePanelStyleSheetSlots({
  renderState,
}: ChatRuntimeMessageQueuePanelStyleSheetSlotsInput): MessageQueuePanelMobileStyleSheetSlots {
  return createMessageQueuePanelMobileStyleSheetSlots({
    renderState,
  });
}

export function createChatRuntimeQueuedMessageItemStyleSheetSlots({
  renderState,
}: ChatRuntimeQueuedMessageItemStyleSheetSlotsInput): QueuedMessageItemMobileStyleSheetSlots {
  return createQueuedMessageItemMobileStyleSheetSlots({
    renderState,
  });
}

export type ChatRuntimeMarkdownContentStyleSheetSlotsInput = Pick<
  MarkdownContentMobileStyleSheetSlotsInput,
  'renderState'
>;

export type ChatRuntimeMarkdownThinkSectionStyleSheetSlotsInput = Pick<
  MarkdownThinkSectionMobileStyleSheetSlotsInput,
  'renderState'
>;

export function createChatRuntimeMarkdownContentStyleSheetSlots({
  renderState,
}: ChatRuntimeMarkdownContentStyleSheetSlotsInput): MarkdownContentMobileStyleSheetSlots {
  return createMarkdownContentMobileStyleSheetSlots({
    renderState,
    spacing,
    radius,
    platform: Platform.OS,
  });
}

export function createChatRuntimeMarkdownThinkSectionStyleSheetSlots({
  renderState,
}: ChatRuntimeMarkdownThinkSectionStyleSheetSlotsInput): MarkdownThinkSectionMobileStyleSheetSlots {
  return createMarkdownThinkSectionMobileStyleSheetSlots({
    renderState,
    spacing,
    radius,
  });
}

export type ChatRuntimeMarkdownMobileStyleSlots = {
  markdownContentRenderState: MarkdownContentMobileSurfaceRenderState;
  markdownContentStyles: MarkdownContentMobileStyleSheetSlots;
  markdownThinkSectionRenderState: MarkdownThinkSectionMobileSurfaceRenderState;
  markdownThinkSectionStyles: MarkdownThinkSectionMobileStyleSheetSlots;
};

export function useChatRuntimeMarkdownMobileStyleSlots(): ChatRuntimeMarkdownMobileStyleSlots {
  const { theme, isDark } = useTheme();
  const markdownContentRenderState = useMemo(
    () => getMarkdownContentMobileSurfaceRenderState({
      colors: theme.colors,
      isDark,
    }),
    [isDark, theme.colors],
  );
  const markdownContentStyleSheetSlots = useMemo(
    () => createChatRuntimeMarkdownContentStyleSheetSlots({
      renderState: markdownContentRenderState,
    }),
    [markdownContentRenderState],
  );
  const markdownContentStyles = useMemo(
    () => StyleSheet.create({ ...markdownContentStyleSheetSlots }),
    [markdownContentStyleSheetSlots],
  );
  const markdownThinkSectionRenderState = useMemo(
    () => getMarkdownThinkSectionMobileSurfaceRenderState({ isDark }),
    [isDark],
  );
  const markdownThinkSectionStyleSheetSlots = useMemo(
    () => createChatRuntimeMarkdownThinkSectionStyleSheetSlots({
      renderState: markdownThinkSectionRenderState,
    }),
    [markdownThinkSectionRenderState],
  );
  const markdownThinkSectionStyles = useMemo(
    () => StyleSheet.create({ ...markdownThinkSectionStyleSheetSlots }),
    [markdownThinkSectionStyleSheetSlots],
  );
  const markdownMobileStyleSlots = useMemo<ChatRuntimeMarkdownMobileStyleSlots>(
    () => ({
      markdownContentRenderState,
      markdownContentStyles,
      markdownThinkSectionRenderState,
      markdownThinkSectionStyles,
    }),
    [
      markdownContentRenderState,
      markdownContentStyles,
      markdownThinkSectionRenderState,
      markdownThinkSectionStyles,
    ],
  );

  return markdownMobileStyleSlots;
}

export type ChatRuntimeVideoAttachmentStyleSheetSlotsInput = Pick<
  ChatVideoAttachmentMobileStyleSheetSlotsInput,
  'renderState'
>;

export type ChatRuntimeVideoAttachmentMobileRenderState =
  SharedChatVideoAttachmentMobileRenderState;

export type ChatRuntimeVideoAttachmentMobileStyleSlotsInput = Pick<
  ChatVideoAttachmentMobileRenderStateInput,
  'sourceUrl' | 'label' | 'loading'
>;

export type ChatRuntimeVideoAttachmentMobileStyleSlots = {
  videoAttachmentRenderState: ChatRuntimeVideoAttachmentMobileRenderState;
  videoAttachmentStyles: ChatVideoAttachmentMobileStyleSheetSlots;
};

export function createChatRuntimeVideoAttachmentStyleSheetSlots({
  renderState,
}: ChatRuntimeVideoAttachmentStyleSheetSlotsInput): ChatVideoAttachmentMobileStyleSheetSlots {
  return createChatVideoAttachmentMobileStyleSheetSlots({
    renderState,
    spacing,
    radius,
  });
}

export function useChatRuntimeVideoAttachmentMobileStyleSlots({
  sourceUrl,
  label,
  loading,
}: ChatRuntimeVideoAttachmentMobileStyleSlotsInput): ChatRuntimeVideoAttachmentMobileStyleSlots {
  const { theme, isDark } = useTheme();
  const videoAttachmentRenderState = useMemo(
    () => getChatVideoAttachmentMobileRenderState({
      sourceUrl,
      label,
      colors: theme.colors,
      isDark,
      loading,
    }),
    [isDark, label, loading, sourceUrl, theme.colors],
  );
  const videoAttachmentStyleSheetSlots = useMemo(
    () => createChatRuntimeVideoAttachmentStyleSheetSlots({
      renderState: videoAttachmentRenderState,
    }),
    [videoAttachmentRenderState],
  );
  const videoAttachmentStyles = useMemo(
    () => StyleSheet.create({ ...videoAttachmentStyleSheetSlots }),
    [videoAttachmentStyleSheetSlots],
  );
  const videoAttachmentMobileStyleSlots = useMemo<ChatRuntimeVideoAttachmentMobileStyleSlots>(
    () => ({
      videoAttachmentRenderState,
      videoAttachmentStyles,
    }),
    [videoAttachmentRenderState, videoAttachmentStyles],
  );

  return videoAttachmentMobileStyleSlots;
}

export type ChatRuntimeHandsFreeStatusChipStyleSheetSlotsInput = Pick<
  HandsFreeStatusChipMobileStyleSheetSlotsInput,
  'renderState'
>;

export type ChatRuntimeHandsFreeStatusChipMobileRenderState =
  SharedHandsFreeStatusChipMobileRenderState;

export type ChatRuntimeHandsFreeStatusChipMobileStyleSlotsInput = Pick<
  HandsFreeStatusChipMobileRenderStateInput,
  'phase' | 'label' | 'subtitle'
>;

export type ChatRuntimeHandsFreeStatusChipMobileStyleSlots = {
  handsFreeStatusChipRenderState: ChatRuntimeHandsFreeStatusChipMobileRenderState;
  handsFreeStatusChipStyles: HandsFreeStatusChipMobileStyleSheetSlots;
};

export function createChatRuntimeHandsFreeStatusChipStyleSheetSlots({
  renderState,
}: ChatRuntimeHandsFreeStatusChipStyleSheetSlotsInput): HandsFreeStatusChipMobileStyleSheetSlots {
  return createHandsFreeStatusChipMobileStyleSheetSlots({
    renderState,
    spacing,
    radius,
  });
}

export function useChatRuntimeHandsFreeStatusChipMobileStyleSlots({
  phase,
  label,
  subtitle,
}: ChatRuntimeHandsFreeStatusChipMobileStyleSlotsInput): ChatRuntimeHandsFreeStatusChipMobileStyleSlots {
  const { theme } = useTheme();
  const handsFreeStatusChipRenderState = useMemo(
    () => getHandsFreeStatusChipMobileRenderState({
      phase,
      label,
      subtitle,
      colors: theme.colors,
    }),
    [label, phase, subtitle, theme.colors],
  );
  const handsFreeStatusChipStyleSheetSlots = useMemo(
    () => createChatRuntimeHandsFreeStatusChipStyleSheetSlots({
      renderState: handsFreeStatusChipRenderState,
    }),
    [handsFreeStatusChipRenderState],
  );
  const handsFreeStatusChipStyles = useMemo(
    () => StyleSheet.create({ ...handsFreeStatusChipStyleSheetSlots }),
    [handsFreeStatusChipStyleSheetSlots],
  );
  const handsFreeStatusChipStyleSlots = useMemo<ChatRuntimeHandsFreeStatusChipMobileStyleSlots>(
    () => ({
      handsFreeStatusChipRenderState,
      handsFreeStatusChipStyles,
    }),
    [handsFreeStatusChipRenderState, handsFreeStatusChipStyles],
  );

  return handsFreeStatusChipStyleSlots;
}

export type ChatRuntimeAgentSelectorSheetStyleSheetSlotsInput = Pick<
  AgentSelectorMobileStyleSheetSlotsInput,
  'renderState'
>;

export type ChatRuntimeAgentSelectorSheetMobileRenderState =
  SharedAgentSelectorMobileRenderState;

export type ChatRuntimeAgentSelectorSheetMobileStyleSlotsInput = Pick<
  AgentSelectorMobileRenderStateInput,
  'selectorMode'
>;

export type ChatRuntimeAgentSelectorSheetMobileStyleSlots = {
  agentSelectorRenderState: ChatRuntimeAgentSelectorSheetMobileRenderState;
  agentSelectorStyles: AgentSelectorMobileStyleSheetSlots;
  agentSelectorSheetBottomPadding: AgentSelectorMobileStyleSheetSlots['sheet']['paddingBottom'];
};

export function createChatRuntimeAgentSelectorSheetStyleSheetSlots({
  renderState,
}: ChatRuntimeAgentSelectorSheetStyleSheetSlotsInput): AgentSelectorMobileStyleSheetSlots {
  return createAgentSelectorMobileStyleSheetSlots({
    renderState,
    spacing,
    radius,
  });
}

export function useChatRuntimeAgentSelectorSheetMobileStyleSlots({
  selectorMode,
}: ChatRuntimeAgentSelectorSheetMobileStyleSlotsInput): ChatRuntimeAgentSelectorSheetMobileStyleSlots {
  const { theme } = useTheme();
  const agentSelectorRenderState = useMemo(
    () => getAgentSelectorMobileRenderState({
      selectorMode,
      colors: theme.colors,
    }),
    [selectorMode, theme.colors],
  );
  const agentSelectorStyleSheetSlots = useMemo(
    () => createChatRuntimeAgentSelectorSheetStyleSheetSlots({
      renderState: agentSelectorRenderState,
    }),
    [agentSelectorRenderState],
  );
  const agentSelectorStyles = useMemo(
    () => StyleSheet.create({ ...agentSelectorStyleSheetSlots }),
    [agentSelectorStyleSheetSlots],
  );
  const agentSelectorSheetBottomPadding = agentSelectorStyleSheetSlots.sheet.paddingBottom;
  const agentSelectorSheetStyleSlots = useMemo<ChatRuntimeAgentSelectorSheetMobileStyleSlots>(
    () => ({
      agentSelectorRenderState,
      agentSelectorStyles,
      agentSelectorSheetBottomPadding,
    }),
    [
      agentSelectorRenderState,
      agentSelectorSheetBottomPadding,
      agentSelectorStyles,
    ],
  );

  return agentSelectorSheetStyleSlots;
}

export type ChatRuntimeMobileChromeSlots = ChatRuntimeMobileChromeSlotsFromStyleSource<
  ChatRuntimeMobileStyles,
  ChatRuntimeConversationSurfaceToneMobileStyleSlot,
  ChatRuntimeMobileStyles[ChatRuntimeConversationSurfaceToneMobileStyleSlot],
  ChatRuntimeMobileChromeEnvironment['colors'],
  ChatRuntimeMobileChromeEnvironment['platform'],
  ImageSourcePropType
>;

export type ChatRuntimeMobileStyleSlots = {
  chatRuntimeChrome: ChatRuntimeMobileChromeSlots;
};

export function useChatRuntimeMobileStyleSlots(): ChatRuntimeMobileStyleSlots {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const bottomInset = insets.bottom;
  const chatRuntimeChromeEnvironment = useMemo(
    () => createChatRuntimeMobileChromeEnvironment(theme),
    [theme],
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
  const mobileSafeAreaLayout = useMemo(
    () => getChatRuntimeMobileSafeAreaLayoutState(bottomInset),
    [bottomInset],
  );
  const chatRuntimeChrome = useMemo(
    () => createChatRuntimeMobileChromeSlotsFromStyleSource({
      colors: chatRuntimeChromeEnvironment.colors,
      platform: chatRuntimeChromeEnvironment.platform,
      spinnerSource: chatRuntimeSpinnerSource,
      styles,
      safeAreaLayout: mobileSafeAreaLayout,
      getToneStyle: (toneStyleSlot: ChatRuntimeConversationSurfaceToneMobileStyleSlot) => styles[toneStyleSlot],
    }),
    [
      chatRuntimeChromeEnvironment,
      chatRuntimeSpinnerSource,
      mobileSafeAreaLayout,
      styles,
    ],
  );
  const styleSlots = useMemo<ChatRuntimeMobileStyleSlots>(
    () => ({
      chatRuntimeChrome,
    }),
    [chatRuntimeChrome],
  );

  return styleSlots;
}
