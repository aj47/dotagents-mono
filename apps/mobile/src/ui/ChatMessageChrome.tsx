import { Fragment, forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type Dispatch, type ReactNode, type Ref, type RefObject, type SetStateAction } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type AppStateStatus,
  type GestureResponderEvent,
  type ImageSourcePropType,
  type ImageStyle,
  type Insets,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import { speakRemoteTts, stopRemoteTts } from '../lib/remoteTts';
import {
  CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS,
  applyChatMessageRuntimeAutoExpansionState,
  applyChatMessageRuntimeToolActivityGroupExpansionInheritance,
  createChatComposerRuntimeImagePickerLaunchOptions,
  createChatComposerRuntimeDockMobileProps,
  createChatComposerRuntimeDockMobilePropsParts,
  createChatComposerHandsFreeControlsMobilePropsParts,
  createChatComposerIconButtonMobilePropsParts,
  createChatComposerInputDockMobilePropsParts,
  createChatComposerLabeledActionButtonMobilePropsParts,
  createChatComposerMicButtonMobilePropsParts,
  createChatComposerPendingImagesRailMobilePropsParts,
  createChatComposerSpeechPreviewMobilePropsParts,
  createChatComposerTextEntryMobilePropsParts,
  createChatComposerVoiceOverlayMobilePropsParts,
  type ChatComposerHandsFreeControlsMobileControlStateLike,
  type ChatComposerHandsFreeControlsMobilePropsParts,
  type ChatComposerIconButtonMobilePropsParts,
  type ChatComposerInputDockMobilePropsParts,
  type ChatComposerLabeledActionButtonMobilePropsParts,
  type ChatComposerMicButtonMobilePropsParts,
  type ChatComposerPendingImagesRailMobilePropsParts,
  type ChatComposerSpeechPreviewMobilePropsParts,
  type ChatComposerTextEntryMobilePropsParts,
  type ChatComposerVoiceOverlayMobilePropsParts,
  createChatMessageRuntimeLogMeta,
  createChatMessageRuntimeModelMessages,
  createChatMessageRuntimeToolActivityGroups,
  getChatComposerQueueMobileActionState,
  getChatComposerRuntimeBase64ImageBytes,
  getChatComposerRuntimeDraftMessageState,
  getChatComposerRuntimeImageDataUrlBytes,
  inferChatComposerRuntimeImageMimeType,
  computeChatMessageRuntimeTurnDurations,
  createChatMessageRuntimeRecoverableHistoryMessages,
  createChatMessageRuntimeResponseHistoryEvents,
  createChatMessageRuntimeSessionDisplayMessages,
  createChatMessageRuntimeTurnDurationMessages,
  getChatMessageRuntimeNextResponseEventOrdinal,
  createChatMessageActionSlotRenderMap,
  getChatMessageCopyFailureAlertState,
  getChatMessageCopyFeedbackResetDelayMs,
  getChatMessageToolExecutionCopyFailureResolvedAlertState,
  createChatConversationHomePromptEditorSaveActionState,
  createChatConversationHomePromptEditorModalMobilePropsParts,
  createPredefinedPromptRecord,
  deletePredefinedPromptFromList,
  createChatRuntimeDockChromeMobileProps,
  getChatConversationHomePromptDeleteConfirmAlertState,
  getChatConversationHomePromptDeleteFailedAlertState,
  getChatConversationHomePromptSaveFailedAlertState,
  getChatConversationHomePromptSaveSuccessAlertState,
  getChatConversationHomePromptTaskRunFailedAlertState,
  getChatConversationHomePromptTaskStartedAlertState,
  createChatRuntimeHomeQuickStartsMobilePropsParts,
  getChatRuntimeHomeQuickStartPressIntent,
  getChatRuntimeMessageHistoryWindowMobileClampedVisibleCount,
  getChatRuntimeMessageHistoryWindowMobileExpandedVisibleCount,
  getChatRuntimeMessageHistoryWindowMobileIsAtBottom,
  getChatRuntimeMessageHistoryWindowMobileShouldLoadEarlier,
  getChatRuntimeMessageHistoryWindowMobileState,
  getChatRuntimeConversationItemThreadMobileStateFromBodyInput,
  getChatRuntimeConversationRuntimeThreadListMobileState,
  createChatRuntimeLoadingStateMobilePropsParts,
  createChatRuntimeInlineActivityMobilePropsParts,
  createChatRuntimeConnectionBannerMobilePropsParts,
  createChatRuntimeRetryStatusMobilePropsParts,
  createChatRuntimeToolApprovalMobilePropsParts,
  createChatRuntimeDelegationCardMobilePropsParts,
  createChatRuntimeTurnDurationBadgeMobilePropsParts,
  createChatRuntimeConversationContentMobilePropsParts,
  createChatRuntimeConversationExpandedContentMobilePropsParts,
  createChatRuntimeConversationCollapsedPreviewMobilePropsParts,
  createChatRuntimeMessageHistoryBannerMobilePropsParts,
  createChatRuntimeStepSummaryCardMobilePropsParts,
  createChatRuntimeScrollToBottomButtonMobilePropsParts,
  createChatRuntimeDebugPanelStackMobilePropsParts,
  createChatRuntimeConversationFrameMobilePropsParts,
  createChatRuntimeConversationActionComponentsMobileProps,
  createChatRuntimeConversationActionSetMobileProps,
  createChatRuntimeMessageActionIconButtonMobileProps,
  createChatRuntimeMessageActionIconButtonMobilePropsParts,
  createChatRuntimeMessageActionSlotListMobilePropsParts,
  createChatRuntimeMessageContentRowMobilePropsParts,
  createChatRuntimeMessageSurfaceMobilePropsParts,
  createChatRuntimeMessageStandaloneActionsMobilePropsParts,
  createChatRuntimeMessageThreadItemMobilePropsParts,
  createChatRuntimeMessageThreadSurfaceMobilePropsParts,
  createChatRuntimeConversationDockShellMobilePropsParts,
  createChatRuntimeConversationDockMobilePropsParts,
  createChatRuntimeConversationRuntimeThreadListMobilePropsParts,
  createChatRuntimeConversationRuntimeThreadMobilePropsParts,
  createChatRuntimeConversationScrollViewportMobilePropsParts,
  createChatRuntimeConversationViewportContentMobilePropsParts,
  createChatRuntimeConversationOverlaysMobilePropsParts,
  createChatRuntimeConversationSurfaceMobilePropsParts,
  createChatRuntimeConversationThreadBodyMobilePropsParts,
  createChatRuntimeConversationViewportMobilePropsParts,
  createChatRuntimeConversationThreadBodyMobilePropsFromActionInput,
  createChatRuntimeToolActivityGroupBoundaryMobilePropsParts,
  createChatRuntimeToolActivityGroupFooterMobilePropsParts,
  createChatRuntimeToolActivityGroupThreadSurfaceMobilePropsParts,
  createChatRuntimeToolActivityGroupToggleMobilePropsParts,
  createChatRuntimeToolExecutionCallSectionMobilePropsParts,
  createChatRuntimeToolExecutionCallDetailMobilePropsParts,
  createChatRuntimeToolExecutionCallListMobilePropsParts,
  createChatRuntimeToolExecutionCollapseControlMobilePropsParts,
  createChatRuntimeToolExecutionCompactGroupMobilePropsParts,
  createChatRuntimeToolExecutionCompactListMobilePropsParts,
  createChatRuntimeToolExecutionCompactRowMobilePropsParts,
  createChatRuntimeToolExecutionCopyButtonMobilePropsParts,
  createChatRuntimeToolExecutionDetailHeaderMobilePropsParts,
  createChatRuntimeToolExecutionEmptyStateMobilePropsParts,
  createChatRuntimeToolExecutionErrorBlockMobilePropsParts,
  createChatRuntimeToolExecutionExpandedGroupMobilePropsParts,
  createChatRuntimeToolExecutionPanelMobilePropsParts,
  createChatRuntimeToolExecutionPanelShellMobilePropsParts,
  createChatRuntimeToolExecutionPayloadBlockMobilePropsParts,
  createChatRuntimeToolExecutionPayloadMetaMobilePropsParts,
  createChatRuntimeToolExecutionPayloadSectionMobilePropsParts,
  createChatRuntimeToolExecutionPendingResultMobilePropsParts,
  createChatRuntimeToolExecutionResultBadgeMobilePropsParts,
  createChatRuntimeToolExecutionResultHeaderMobilePropsParts,
  createChatRuntimeToolExecutionResultSectionMobilePropsParts,
  createChatRuntimeToolExecutionStackPanelMobilePropsParts,
  getChatRuntimeMessageThreadMobileStyleRenderState,
  createChatComposerRuntimeDockMobileChromeProps,
  createChatRuntimeSurfaceChromeMobileProps,
  createChatRuntimeViewportChromeMobileProps,
  getChatRuntimeBranchCreatedMobileResolvedAlertState,
  getChatRuntimeBranchFailedMobileResolvedAlertState,
  getChatRuntimeBranchUnavailableMobileResolvedAlertState,
  getChatRuntimeKillSwitchConfirmationMobileResolvedAlertState,
  getChatRuntimeKillSwitchConnectionFailedMobileResolvedAlertState,
  getChatRuntimeKillSwitchResultMobileResolvedAlertState,
  getChatRuntimeNavigationHeaderMobileRenderState,
  createChatRuntimeNavigationHeaderOptionsParts,
  createChatRuntimeNavigationHeaderOptionsMobilePropsParts,
  createChatRuntimeHeaderAgentSelectorMobilePropsParts,
  createChatRuntimeHeaderConversationStatusMobilePropsParts,
  createChatRuntimeHeaderIconButtonMobilePropsParts,
  createChatRuntimeHeaderTurnDurationMobilePropsParts,
  hasChatMessageRuntimeLiveAgentTurn,
  removeChatMessageRuntimePendingTurnMessages,
  removeChatMessageRuntimeToolApprovalMessage,
  sortChatMessageRuntimeResponseEvents,
  toggleChatMessageRuntimeMessageExpansionState,
  toggleChatMessageRuntimeToolActivityGroupExpansionState,
  toggleChatMessageRuntimeToolApprovalExpansionState,
  toggleChatMessageRuntimeToolCallExpansionState,
  getChatRuntimeToolApprovalConnectionRequiredMobileResolvedAlertState,
  getChatRuntimeToolApprovalFailedMobileResolvedAlertState,
  getChatRuntimeToolApprovalUnavailableMobileResolvedAlertState,
  formatChatComposerRuntimeHandsFreeSleepingDebugMessage,
  getChatComposerRuntimeHandsFreeDebugMessage,
  mergeChatComposerRuntimeVoiceText,
  sortPredefinedPromptsByUpdatedAt,
  updatePredefinedPromptList,
  formatConnectionStatus,
  CHAT_RUNTIME_AUTO_TTS_DUPLICATE_SUPPRESSION_MS,
  createChatRuntimeSpeechTextState,
  createChatRuntimeRemoteSpeechSettingsState,
  DEFAULT_EDGE_TTS_VOICE,
  getChatRuntimeDefaultRemoteSpeechSettingsState,
  type ACPDelegationProgress,
  type AgentConversationState,
  type AgentRetryInfo,
  type AgentStepSummary,
  type AgentUserResponseEvent,
  type HandsFreePhase,
  type Loop,
  type PredefinedPromptSummary,
  type RecoveryState,
  type Settings,
  type Skill,
  type VoiceDebugEntry,
  type VoiceDebugLog,
  type ChatRuntimeRemoteSpeechProvider,
  type ChatRuntimeRemoteSpeechSettingsState,
  type ChatConversationHomePromptDeleteConfirmAlertState,
  type ChatRuntimeConversationDelegationCardMobileState,
  type PromptLibraryEditorMobileRenderState,
  type PromptLibraryLauncherShortcutSource,
  type PromptLibrarySkillLike,
  type PromptLibraryMobileShortcutRenderState,
  type PromptLibraryShortcutItem,
  type PromptLibraryTaskLike,
  type ChatRuntimeAgentSelectorMobileRenderState,
  type ChatRuntimeActivityStepLike,
  type ChatRuntimeBackMobileRenderState,
  type ChatRuntimeBranchMobileRenderState,
  type ChatRuntimeConnectionBannerMobileRenderState,
  type ChatRuntimeDockChromeMobileRenderStateInput,
  type ChatRuntimeConversationDockMobilePropsParts,
  type ChatRuntimeConversationDockMobilePropsPartsInput,
  type ChatRuntimeConversationDockShellMobilePropsParts,
  type ChatRuntimeConversationDockShellMobilePropsPartsInput,
  type ChatRuntimeConversationFrameMobilePropsParts,
  type ChatRuntimeConversationFrameMobilePropsPartsInput,
  type ChatRuntimeConversationOverlaysMobilePropsParts,
  type ChatRuntimeConversationOverlaysMobilePropsPartsInput,
  type ChatRuntimeConversationScrollViewportMobilePropsParts,
  type ChatRuntimeConversationScrollViewportMobilePropsPartsInput,
  type ChatRuntimeConversationSurfaceMobilePropsParts,
  type ChatRuntimeConversationSurfaceMobilePropsPartsInput,
  type ChatRuntimeConversationViewportMobilePropsParts,
  type ChatRuntimeConversationViewportMobilePropsPartsInput,
  type ChatRuntimeConversationViewportContentMobilePropsParts,
  type ChatRuntimeConversationViewportContentMobilePropsPartsInput,
  type ChatConversationHomePromptEditorModalMobilePropsParts,
  type ChatConversationHomePromptEditorModalStyleSlots as SharedChatConversationHomePromptEditorModalStyleSlots,
  type ChatRuntimeDebugPanelStackMobilePropsParts,
  type ChatRuntimeHandsFreeMobileRenderState,
  type ChatRuntimeKillSwitchConfirmationAlertState,
  type ChatRuntimeKillSwitchMobileRenderState,
  type ChatRuntimeKillSwitchResultLike,
  type ChatRuntimeLoadingStateMobilePropsParts,
  type ChatRuntimeMessageHistoryBannerMobileRenderState,
  type ChatRuntimeMessageHistoryBannerMobilePropsParts,
  type ChatRuntimeMessageHistoryBannerMobilePropsPartsInput,
  type ChatRuntimeMessageHistoryBannerMobilePropsStyleSlots as SharedChatMessageHistoryBannerStyleSlots,
  type ChatComposerHandsFreeControlsMobileStyleSlots as SharedChatComposerHandsFreeControlsStyleSlots,
  type ChatComposerInputDockMobileStyleSlots as SharedChatComposerInputDockStyleSlots,
  type ChatComposerLabeledActionButtonMobileStyleSlots as SharedChatComposerLabeledActionButtonStyleSlots,
  type ChatComposerMicButtonMobileStyleSlots as SharedChatComposerMicButtonStyleSlots,
  type ChatComposerPendingImagesRailMobileStyleSlots as SharedChatComposerPendingImagesRailStyleSlots,
  type ChatComposerRuntimeDockMobileRenderStateInput,
  type ChatComposerRuntimeDockMobilePropsInput,
  type ChatComposerRuntimeDockMobilePropsParts,
  type ChatComposerRuntimeDockMobilePropsPartsInput,
  type ChatComposerRuntimeHandsFreeControlsMobileRenderState,
  type ChatComposerSpeechPreviewMobileStyleSlots as SharedChatComposerSpeechPreviewStyleSlots,
  type ChatComposerStyleSlots as SharedChatComposerStyleSlots,
  type ChatComposerTextEntryMobileStyleSlots as SharedChatComposerTextEntryStyleSlots,
  type ChatComposerVoiceOverlayMobileStyleSlots as SharedChatComposerVoiceOverlayStyleSlots,
  type ChatRuntimePinMobileRenderState,
  type ChatRuntimeScrollToBottomButtonMobilePropsParts,
  type ChatRuntimeScrollToBottomButtonMobilePropsPartsInput,
  type ChatRuntimeScrollToBottomMobileRenderState,
  type ChatRuntimeSurfaceChromeMobileRenderStateInput,
  type ChatRuntimeStepSummaryCardMobilePropsParts,
  type ChatRuntimeStepSummaryCardMobilePropsPartsInput,
  type ChatRuntimeStepSummaryCardMobileStyleSlots as SharedChatMessageStepSummaryCardStyleSlots,
  type ChatRuntimeStepSummaryMobileRenderState,
  type ChatRuntimeLoadingStateMobilePropsPartsInput,
  type ChatRuntimeToolApprovalMobilePropsParts,
  type ChatRuntimeToolApprovalMobilePropsPartsInput,
  type ChatRuntimeDelegationCardMobilePropsParts,
  type ChatRuntimeDelegationCardMobilePropsPartsInput,
  type ChatRuntimeHeaderAgentSelectorMobilePropsParts,
  type ChatRuntimeHeaderAgentSelectorMobilePropsPartsInput,
  type ChatRuntimeHeaderAgentSelectorMobileStyleSlots as SharedChatRuntimeHeaderAgentSelectorStyleSlots,
  type ChatRuntimeHeaderConversationStatusMobilePropsParts,
  type ChatRuntimeHeaderConversationStatusMobilePropsPartsInput,
  type ChatRuntimeHeaderConversationStatusMobileStyleSlots as SharedChatRuntimeHeaderConversationStatusStyleSlots,
  type ChatRuntimeHeaderIconButtonMobileStyleSlots as SharedChatRuntimeHeaderIconButtonStyleSlots,
  type ChatRuntimeHeaderIconButtonMobilePropsParts,
  type ChatRuntimeHeaderIconButtonMobilePropsPartsInput,
  type ChatRuntimeHeaderStyleSlots as SharedChatRuntimeHeaderStyleSlots,
  type ChatRuntimeHeaderTurnDurationMobilePropsParts,
  type ChatRuntimeHeaderTurnDurationMobilePropsPartsInput,
  type ChatRuntimeHeaderTurnDurationMobileStyleSlots as SharedChatRuntimeHeaderTurnDurationStyleSlots,
  type ChatRuntimeTurnDurationBadgeMobilePropsParts,
  type ChatRuntimeTurnDurationBadgeMobilePropsPartsInput,
  type ChatRuntimeTurnDurationHeaderMobileRenderState,
  type ChatRuntimeTurnDurationMessageMobileRenderState,
  type ChatRuntimeDebugPanelStackMobilePropsPartsInput,
  type ChatRuntimeInlineActivityMobileRenderState,
  type ChatRuntimeLoadingStateMobileRenderState,
  getChatImageAttachmentMobileAlertState,
  type ChatImageAttachmentMobileAlertInput,
  type ChatImageAttachmentMessageInput,
  type ChatImageAttachmentMobileRenderState,
  type ImageMimeTypeSource,
  type ChatRuntimeHomeQuickStartItemsMobileStateInput,
  type ChatRuntimeHomeQuickStartsMobilePropsParts,
  type ChatRuntimeHomeQuickStartsMobileRenderState,
  type ChatRuntimeHomeQuickStartsMobileStyleSlots as SharedChatConversationHomeQuickStartsStyleSlots,
  type ChatRuntimeMessageHistoryWindowMobileDisplayStateInput,
  type ChatRuntimeNavigationHeaderMobileRenderState,
  type ChatRuntimeNavigationHeaderMobileRenderStateInput,
  type ChatRuntimeNavigationHeaderOptionsMobilePropsParts,
  type ChatRuntimeNavigationHeaderOptionsParts,
  type ChatRuntimeViewportChromeMobileRenderStateInput,
  type ChatSessionStatusMobileRenderState,
  type ChatRuntimeConversationMessageActionsMobileRenderState,
  type ChatRuntimeConversationMessageActionsMobileRenderStateInput,
  type ChatRuntimeConversationActionSetMobileProps,
  type ChatRuntimeConversationCollapsedPreviewMobilePropsParts,
  type ChatRuntimeConversationContentMobileDisplayMode,
  type ChatRuntimeConversationCollapsedPreviewMobileRenderState,
  type ChatRuntimeConversationExpandedContentMobilePropsParts,
  type ChatRuntimeConversationExpandedContentMobileStyleSlots as SharedChatMessageExpandedContentStyleSlots,
  type ChatRuntimeConversationContentMobilePropsParts,
  type ChatRuntimeConversationDelegationExpansionState,
  type ChatDisplayMessageLike,
  type ChatMessageDisplayStateMessageLike,
  type ChatRuntimeConversationMessageRenderContextMobileState,
  type ChatRuntimeConversationMessageRenderContextMobileStateInput,
  type ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots,
  type ChatRuntimeToolExecutionCompactPreviewMobileRowState,
  type ChatRuntimeConversationMessageMobileRenderStateInput,
  type ChatRuntimeConversationMessageMobileRenderState,
  type ChatRuntimeConversationRetryStatusMobileState,
  type ChatRuntimeConversationMessageRuntimeThreadStateInput,
  type ChatRuntimeConversationRenderableRuntimeThreadState,
  type ChatRuntimeConversationRuntimeThreadListMobilePropsParts,
  type ChatRuntimeConversationThreadBodyMobilePropsParts,
  type ChatRuntimeConversationThreadBodyMobileDisplayMode,
  type ChatRuntimeConversationThreadBodyMobileStateInput,
  type ChatRuntimeConversationSurfaceToneMobileStyleSlot,
  type ChatRuntimeConversationToolApprovalMobileState,
  type ChatRuntimeConversationToolExecutionDetailMobileRowState,
  type ChatRuntimeConversationToolExecutionStackMobileState,
  type ChatRuntimeConversationToolActivityGroupThreadRenderStateInput,
  type ChatRuntimeToolActivityGroupBoundaryMobileKind,
  type ChatRuntimeToolActivityGroupBoundaryMobilePropsParts,
  type ChatRuntimeToolActivityGroupBoundaryMobilePropsPartsInput,
  type ChatRuntimeToolActivityGroupFooterMobileStyleSlots as SharedChatMessageToolActivityGroupFooterStyleSlots,
  type ChatRuntimeToolActivityGroupFooterMobilePropsParts,
  type ChatRuntimeToolActivityGroupFooterMobilePropsPartsInput,
  type ChatRuntimeToolActivityGroupToggleMobileStyleSlots as SharedChatMessageToolActivityGroupToggleStyleSlots,
  type ChatRuntimeToolActivityGroupToggleMobilePropsParts,
  type ChatRuntimeToolActivityGroupToggleMobilePropsPartsInput,
  type ChatRuntimeMessageThreadPresentationMobileRenderState,
  type ChatRuntimeMessageThreadItemMobilePropsPartsInput,
  type ChatRuntimeMessageThreadItemMobilePropsParts,
  type ChatRuntimeMessageThreadSurfaceMobilePropsPartsInput,
  type ChatRuntimeMessageThreadSurfaceMobilePropsParts,
  type ChatRuntimeConversationActionComponentsMobileProps,
  type ChatRuntimeConversationActionComponentsMobilePropsInput,
  type ChatRuntimeMessageActionIconLike,
  type ChatRuntimeMessageActionIconButtonRenderState,
  type ChatRuntimeMessageActionIconButtonSpec,
  type ChatRuntimeMessageActionIconButtonMobileProps,
  type ChatRuntimeInlineActivityMobilePropsPartsInput,
  type ChatRuntimeInlineActivityMobilePropsParts,
  type ChatRuntimeMessageActionIconButtonMobilePropsParts,
  type ChatRuntimeMessageActionSlotListMobilePropsPartsInput,
  type ChatRuntimeMessageActionSlotListMobilePropsParts,
  type ChatRuntimeMessageStandaloneActionsMobilePropsPartsInput,
  type ChatRuntimeMessageContentRowMobilePropsPartsInput,
  type ChatRuntimeMessageContentRowMobilePropsParts,
  type ChatRuntimeConversationContentMobilePropsPartsInput,
  type ChatRuntimeMessageStandaloneActionsMobilePropsParts,
  type ChatRuntimeMessageSurfaceMobilePropsPartsInput,
  type ChatRuntimeMessageSurfaceMobilePropsParts,
  type ChatRuntimeConversationExpandedContentMobilePropsPartsInput,
  type ChatRuntimeConnectionBannerMobilePropsParts,
  type ChatRuntimeConnectionBannerMobilePropsPartsInput,
  type ChatRuntimeConversationCollapsedPreviewMobilePropsPartsInput,
  type ChatRuntimeRetryStatusMobilePropsParts,
  type ChatRuntimeRetryStatusMobilePropsPartsInput,
  type ChatRuntimeToolExecutionCallDetailMobilePropsParts,
  type ChatRuntimeToolExecutionCallDetailMobilePropsPartsInput,
  type ChatRuntimeToolExecutionCallDetailMobileStyleSlots as SharedChatMessageToolExecutionCallDetailStyleSlots,
  type ChatRuntimeToolExecutionCallListMobilePropsParts,
  type ChatRuntimeToolExecutionCallListMobilePropsPartsInput,
  type ChatRuntimeToolExecutionCallSectionMobilePropsParts,
  type ChatRuntimeToolExecutionCallSectionMobilePropsPartsInput,
  type ChatRuntimeToolExecutionCallSectionMobileStyleSlots as SharedChatMessageToolExecutionCallSectionStyleSlots,
  type ChatRuntimeToolExecutionCollapseControlMobilePropsParts,
  type ChatRuntimeToolExecutionCollapseControlMobilePropsPartsInput,
  type ChatRuntimeToolExecutionCollapseControlMobileStyleSlots as SharedChatMessageToolExecutionCollapseControlStyleSlots,
  type ChatRuntimeToolExecutionCompactGroupMobilePropsParts,
  type ChatRuntimeToolExecutionCompactGroupMobilePropsPartsInput,
  type ChatRuntimeToolExecutionCompactGroupMobileStyleSlots as SharedChatMessageToolExecutionCompactGroupStyleSlots,
  type ChatRuntimeToolExecutionCompactListMobilePropsParts,
  type ChatRuntimeToolExecutionCompactListMobilePropsPartsInput,
  type ChatRuntimeToolExecutionCompactRowMobilePropsParts,
  type ChatRuntimeToolExecutionCompactRowMobilePropsPartsInput,
  type ChatRuntimeToolExecutionCompactRowMobileStyleSlots as SharedChatMessageToolExecutionCompactRowStyleSlots,
  type ChatRuntimeToolExecutionCopyButtonMobilePropsParts,
  type ChatRuntimeToolExecutionCopyButtonMobilePropsPartsInput,
  type ChatRuntimeToolExecutionCopyButtonMobileStyleSlots as SharedChatMessageToolExecutionCopyButtonStyleSlots,
  type ChatRuntimeToolExecutionDetailHeaderMobilePropsParts,
  type ChatRuntimeToolExecutionDetailHeaderMobilePropsPartsInput,
  type ChatRuntimeToolExecutionDetailHeaderMobileStyleSlots as SharedChatMessageToolExecutionDetailHeaderStyleSlots,
  type ChatRuntimeToolExecutionEmptyStateMobilePropsParts,
  type ChatRuntimeToolExecutionEmptyStateMobilePropsPartsInput,
  type ChatRuntimeToolExecutionErrorBlockMobilePropsParts,
  type ChatRuntimeToolExecutionErrorBlockMobilePropsPartsInput,
  type ChatRuntimeToolExecutionErrorBlockMobileStyleSlots as SharedChatMessageToolExecutionErrorBlockStyleSlots,
  type ChatRuntimeToolExecutionExpandedGroupMobilePropsParts,
  type ChatRuntimeToolExecutionExpandedGroupMobilePropsPartsInput,
  type ChatRuntimeToolExecutionExpandedGroupMobileStyleSlotsBase as SharedChatMessageToolExecutionExpandedGroupStyleSlots,
  type ChatRuntimeToolExecutionPanelMobilePropsParts,
  type ChatRuntimeToolExecutionPanelMobilePropsPartsInput,
  type ChatRuntimeToolExecutionPanelShellMobilePropsParts,
  type ChatRuntimeToolExecutionPayloadBlockMobilePropsParts,
  type ChatRuntimeToolExecutionPayloadBlockMobilePropsPartsInput,
  type ChatRuntimeToolExecutionPayloadBlockMobileStyleSlots as SharedChatMessageToolExecutionPayloadBlockStyleSlots,
  type ChatRuntimeToolExecutionPayloadMetaMobilePropsParts,
  type ChatRuntimeToolExecutionPayloadMetaMobilePropsPartsInput,
  type ChatRuntimeToolExecutionPayloadMetaMobileStyleSlots as SharedChatMessageToolExecutionPayloadMetaStyleSlots,
  type ChatRuntimeToolExecutionPayloadSectionMobilePropsParts,
  type ChatRuntimeToolExecutionPayloadSectionMobilePropsPartsInput,
  type ChatRuntimeToolExecutionPayloadSectionMobileStyleSlots as SharedChatMessageToolExecutionPayloadSectionStyleSlots,
  type ChatRuntimeToolExecutionPendingResultMobilePropsParts,
  type ChatRuntimeToolExecutionPendingResultMobilePropsPartsInput,
  type ChatRuntimeToolExecutionPendingResultMobileStyleSlots as SharedChatMessageToolExecutionPendingResultStyleSlots,
  type ChatRuntimeToolExecutionResultBadgeMobilePropsParts,
  type ChatRuntimeToolExecutionResultBadgeMobilePropsPartsInput,
  type ChatRuntimeToolExecutionResultBadgeMobileStyleSlots as SharedChatMessageToolExecutionResultBadgeStyleSlots,
  type ChatRuntimeToolExecutionResultHeaderMobilePropsParts,
  type ChatRuntimeToolExecutionResultHeaderMobilePropsPartsInput,
  type ChatRuntimeToolExecutionResultHeaderMobileStyleSlots as SharedChatMessageToolExecutionResultHeaderStyleSlots,
  type ChatRuntimeToolExecutionResultSectionMobilePropsParts,
  type ChatRuntimeToolExecutionResultSectionMobilePropsPartsInput,
  type ChatRuntimeToolExecutionResultSectionMobileStyleSlots as SharedChatMessageToolExecutionResultSectionStyleSlots,
  type ChatRuntimeToolExecutionStackPanelMobilePropsParts,
  type ChatRuntimeToolExecutionStackPanelMobileStyleSlots as SharedChatMessageToolExecutionStackStyleSlots,
  type ChatRuntimeToolActivityGroupThreadSurfaceMobilePropsParts,
  type ChatRuntimeConversationRuntimeThreadMobilePropsParts,
  type ChatRuntimeRetryStatusMobileRenderState,
  type ChatRuntimeStreamingContentMobileRenderStateInput,
  type ChatRuntimeStreamingContentMobileRenderState,
  type ChatMessageRuntimeAssistantTextMessage,
  type ChatMessageRuntimeHistoryMessageLike,
  type ChatMessageRuntimeLogMeta,
  type ChatMessageRuntimeMessageExpansionState,
  type ChatMessageRuntimeResponseHistorySourceMessage,
  type ChatMessageRuntimeSessionMessageLike,
  type ChatMessageCollapsedPreviewMobileActionState,
  type ChatMessageExpansionMobileRenderState,
  type ChatMessageActionStyleSlots as SharedChatMessageActionStyleSlots,
  type ChatMessageConnectionBannerStyleSlots as SharedChatMessageConnectionBannerStyleSlots,
  type ChatMessageDelegationCardStyleSlots as SharedChatMessageDelegationCardStyleSlots,
  type ChatMessageConversationViewportStyleSlots as SharedChatMessageConversationViewportStyleSlots,
  type ChatMessageConversationThreadStyleSlots as SharedChatMessageConversationThreadStyleSlots,
  type ChatMessageRuntimeDockStyleSlots as SharedChatMessageRuntimeDockStyleSlots,
  type ChatMessageRetryStatusStyleSlots as SharedChatMessageRetryStatusStyleSlots,
  type ChatMessageRuntimeSurfaceStyleSlots as SharedChatMessageRuntimeSurfaceStyleSlots,
  type ChatMessageRuntimeThreadStyleSlots as SharedChatMessageRuntimeThreadStyleSlots,
  type ChatMessageRuntimeViewportStyleSlots as SharedChatMessageRuntimeViewportStyleSlots,
  type ChatMessageThreadBodyStyleSlots as SharedChatMessageThreadBodyStyleSlots,
  type ChatMessageToolApprovalStyleSlots as SharedChatMessageToolApprovalStyleSlots,
  type ChatMessageActionSlotRenderEntry,
  type ChatMessageActionSlotRenderMap,
  type ChatMessageRuntimeSessionDisplayMessagesOptions,
  type ChatMessageRuntimeToolActivityGroup,
  type ChatMessageRuntimeToolActivityGroups,
  type ChatMessageRuntimeToolActivityGroupExpansionState,
  type ChatMessageRuntimeToolApprovalExpansionState,
  type ChatMessageRuntimeToolApprovalStateMessageLike,
  type ChatMessageRuntimeToolCallExpansionState,
  type ChatMessageRuntimeTurnDurationStateInput,
  type ChatMessageToolActivityGroupBoundaryStyleSlots as SharedChatMessageToolActivityGroupBoundaryStyleSlots,
  type ChatMessageToolActivityGroupThreadSurfaceStyleSlots as SharedChatMessageToolActivityGroupThreadSurfaceStyleSlots,
  type ToolActivityGroupMobileRenderState,
  type ToolExecutionCompactMobileRenderState,
  type ToolExecutionDetailMobileCollapseControlRenderState,
  type ToolExecutionDetailMobileCopyButtonRenderState,
  type ToolExecutionDetailMobileEmptyStateRenderState,
  type ToolExecutionDetailMobileExpandControlRenderState,
  type ToolExecutionDetailMobileHeaderRenderState,
  type ToolExecutionDetailMobilePendingResultRenderState,
  type ToolExecutionDetailMobileSectionHeaderRenderState,
  type QueuedMessage,
} from '@dotagents/shared/session-presentation';
import { AgentSelectorSheet } from './AgentSelectorSheet';
import { HandsFreeStatusChip } from './HandsFreeStatusChip';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageQueuePanel, type MessageQueuePanelColors } from './MessageQueuePanel';
import { ResponseHistoryPanel, type ResponseHistoryEntry, type ResponseHistoryPanelColors } from './ResponseHistoryPanel';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ChatComposerTextEntryRef = TextInput;
export type ChatComposerTextEntryKeyPressEvent = Parameters<NonNullable<ComponentProps<typeof TextInput>['onKeyPress']>>[0];
type ChatComposerTextEntryChangeHandler = NonNullable<ComponentProps<typeof TextInput>['onChangeText']>;
type ChatComposerTextEntryKeyPressHandler = NonNullable<ComponentProps<typeof TextInput>['onKeyPress']>;
export type ChatComposerRuntimeImageAttachment = ChatImageAttachmentMessageInput & {
  id: string;
  previewUri: string;
};
export type ChatMessageScrollViewportRef = ScrollView;
export type ChatMessageScrollEvent = Parameters<NonNullable<ComponentProps<typeof ScrollView>['onScroll']>>[0];

type ChatMessageRuntimeRemoteSpeechSettingsHookState = {
  remoteTtsProvider: ChatRuntimeRemoteSpeechProvider;
  setRemoteTtsProvider: Dispatch<SetStateAction<ChatRuntimeRemoteSpeechProvider>>;
  remoteTtsVoice: string | undefined;
  setRemoteTtsVoice: Dispatch<SetStateAction<string | undefined>>;
  remoteTtsModel: string | undefined;
  setRemoteTtsModel: Dispatch<SetStateAction<string | undefined>>;
  remoteTtsRate: number;
  setRemoteTtsRate: Dispatch<SetStateAction<number>>;
  applyRemoteSpeechSettings: (settings: ChatRuntimeRemoteSpeechSettingsState) => void;
};

type ChatConversationHomePromptEditorSaveClient = {
  updateSettings: (settings: { predefinedPrompts: PredefinedPromptSummary[] }) => Promise<unknown>;
};

type ChatConversationHomePromptEditorSaveActionsStateInput<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
> = {
  promptClient?: TPromptEditorClient | null;
  predefinedPrompts: PredefinedPromptSummary[];
  editingPrompt?: PredefinedPromptSummary | null;
  promptName: string;
  promptContent: string;
  isSavingPrompt: boolean;
  setPredefinedPrompts: Dispatch<SetStateAction<PredefinedPromptSummary[]>>;
  beginPromptEditorSave: () => void;
  clearPromptEditorSave: () => void;
  dismissPromptEditor: () => void;
  showAlert: (title: string, message: string) => void;
};

type ChatConversationHomePromptEditorSaveChromeActionsStateInput<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
> = Omit<
  ChatConversationHomePromptEditorSaveActionsStateInput<TPromptEditorClient>,
  'showAlert'
>;

type ChatConversationHomePromptEditorSaveActionsState = {
  handleSavePrompt: () => Promise<void>;
};

type ChatConversationHomePromptEditorDeleteNativeConfirmInput = Pick<
  ChatConversationHomePromptDeleteConfirmAlertState,
  'title' | 'message' | 'cancelLabel' | 'deleteLabel'
> & {
  onConfirm: () => void;
};

type ChatConversationHomePromptEditorDeleteActionsStateInput<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
> = {
  promptClient?: TPromptEditorClient | null;
  predefinedPrompts: PredefinedPromptSummary[];
  setPredefinedPrompts: Dispatch<SetStateAction<PredefinedPromptSummary[]>>;
  beginPromptEditorSave: () => void;
  clearPromptEditorSave: () => void;
  platform: string;
  confirmWeb: (message: string) => boolean;
  confirmNative: (input: ChatConversationHomePromptEditorDeleteNativeConfirmInput) => void;
  showAlert: (title: string, message: string) => void;
};

type ChatConversationHomePromptEditorDeleteChromeActionsStateInput<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
> = Omit<
  ChatConversationHomePromptEditorDeleteActionsStateInput<TPromptEditorClient>,
  'confirmWeb' | 'confirmNative' | 'showAlert'
>;

type ChatConversationHomePromptEditorDeleteActionsState = {
  handleDeletePrompt: (prompt: PredefinedPromptSummary) => void;
};

type ChatRuntimeNativeConfirmAlertButton = {
  text: string;
  style: 'cancel' | 'destructive';
  onPress?: () => void;
};

type ChatRuntimeNativeConfirmAlertPresenter = (
  title: string,
  message: string,
  buttons: ChatRuntimeNativeConfirmAlertButton[],
) => void;

type ChatConversationHomePromptTaskRunState = {
  runningPromptTaskId: string | null;
  canRunPromptTask: boolean;
  beginPromptTaskRun: (taskId: string) => void;
  clearPromptTaskRun: () => void;
};

type ChatConversationHomePromptTaskRunClient = {
  runLoop: (taskId: string) => Promise<unknown>;
};

type ChatConversationHomePromptTaskRunActionsStateInput<
  TTaskRunClient extends ChatConversationHomePromptTaskRunClient,
> = {
  taskClient?: TTaskRunClient | null;
  canRunPromptTask: boolean;
  beginPromptTaskRun: (taskId: string) => void;
  clearPromptTaskRun: () => void;
  showAlert: (title: string, message: string) => void;
};

type ChatConversationHomePromptTaskRunChromeActionsStateInput<
  TTaskRunClient extends ChatConversationHomePromptTaskRunClient,
> = Omit<
  ChatConversationHomePromptTaskRunActionsStateInput<TTaskRunClient>,
  'showAlert'
>;

type ChatConversationHomePromptTaskRunActionsState<
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
> = {
  handleRunPromptTask: (task: TTask) => Promise<void>;
};

type ChatConversationHomeQuickStartCatalogState = {
  predefinedPrompts: PredefinedPromptSummary[];
  setPredefinedPrompts: Dispatch<SetStateAction<PredefinedPromptSummary[]>>;
  availableSkills: Skill[];
  setAvailableSkills: Dispatch<SetStateAction<Skill[]>>;
  availableTasks: Loop[];
  setAvailableTasks: Dispatch<SetStateAction<Loop[]>>;
  isLoadingQuickStartPrompts: boolean;
  beginQuickStartCatalogLoad: () => void;
  finishQuickStartCatalogLoad: () => void;
  clearQuickStartCatalog: () => void;
};

type ChatConversationHomeQuickStartCatalogClient = {
  getSettings: () => Promise<Settings>;
  getSkills: () => Promise<{ skills: Skill[] }>;
  getLoops: () => Promise<{ loops: Loop[] }>;
};

type ChatConversationHomeQuickStartCatalogLoadStateInput<
  TQuickStartCatalogClient extends ChatConversationHomeQuickStartCatalogClient,
> = {
  quickStartClient?: TQuickStartCatalogClient | null;
  isFocused: boolean;
  catalog: ChatConversationHomeQuickStartCatalogState;
  applyRemoteSpeechSettings: (settings: ChatRuntimeRemoteSpeechSettingsState) => void;
};

type ChatConversationHomePromptEditorState = {
  promptEditorVisible: boolean;
  promptEditorEditingPrompt: PredefinedPromptSummary | null;
  promptEditorIsEditing: boolean;
  promptEditorNameValue: string;
  setPromptEditorNameValue: Dispatch<SetStateAction<string>>;
  promptEditorContentValue: string;
  setPromptEditorContentValue: Dispatch<SetStateAction<string>>;
  promptEditorIsSaving: boolean;
  openAddPromptEditor: () => void;
  openEditPromptEditor: (prompt: PredefinedPromptSummary) => void;
  closePromptEditor: () => void;
  dismissPromptEditor: () => void;
  beginPromptEditorSave: () => void;
  clearPromptEditorSave: () => void;
};

type ChatRuntimeAgentSelectorOverlayState = {
  agentSelectorVisible: boolean;
  openAgentSelector: () => void;
  closeAgentSelector: () => void;
};

type ChatComposerRuntimeDraftState = {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  pendingImages: ChatComposerRuntimeImageAttachment[];
  setPendingImages: Dispatch<SetStateAction<ChatComposerRuntimeImageAttachment[]>>;
  inputRef: RefObject<ChatComposerTextEntryRef | null>;
  clearComposerInput: () => void;
  clearPendingImages: () => void;
  clearComposerDraft: () => void;
  focusComposerInput: () => void;
  mergeVoiceTextIntoComposer: (text: string) => void;
  removePendingImage: (attachmentId: string) => void;
};

type ChatComposerRuntimeImagePickerAsset = ImageMimeTypeSource & {
  uri: string;
  base64?: string | null;
  fileSize?: number | null;
};

type ChatComposerRuntimeImagePickerResult = {
  canceled: boolean;
  assets?: ChatComposerRuntimeImagePickerAsset[] | null;
};

type ChatComposerRuntimeImageAttachmentPickerStateInput = {
  pendingImages: ChatComposerRuntimeImageAttachment[];
  setPendingImages: Dispatch<SetStateAction<ChatComposerRuntimeImageAttachment[]>>;
  pickImages: (selectionLimit: number) => Promise<ChatComposerRuntimeImagePickerResult>;
  showAlert: (title: string, message: string) => void;
  now?: () => number;
};

type ChatComposerRuntimeImageLibraryPickerStateInput = Omit<
  ChatComposerRuntimeImageAttachmentPickerStateInput,
  'pickImages' | 'showAlert'
>;

type ChatComposerRuntimeImageAttachmentPickerState = {
  handlePickImages: () => Promise<void>;
};

type ChatComposerTextEntryModifierKeys = {
  shift: boolean;
  ctrl: boolean;
  meta: boolean;
};

type ChatComposerTextEntryWebKeyPressEvent = {
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  preventDefault?: () => void;
};

type ChatComposerRuntimeTextEntrySubmissionStateInput = {
  hasContent: boolean;
  platform: ChatComposerRuntimeDockChromeInput['platform'];
  onChangeText: ChatComposerTextEntryChangeHandler;
  onSubmit: () => void;
};

type ChatComposerRuntimeTextEntrySubmissionState = {
  onChangeText: ChatComposerTextEntryChangeHandler;
  onKeyPress: ChatComposerTextEntryKeyPressHandler;
};

type ChatComposerRuntimeSendActionOptions = {
  fromComposer?: boolean;
};

type ChatComposerRuntimeSendAction = (
  text: string,
  options?: ChatComposerRuntimeSendActionOptions,
) => void | Promise<void>;

type ChatComposerRuntimeQueueController = {
  enqueue: (conversationId: string, text: string, sourceConversationId?: string) => void;
};

type ChatComposerRuntimeSubmissionActionsStateInput = {
  input: string;
  pendingImages: readonly ChatComposerRuntimeImageAttachment[];
  currentConversationId: string;
  queue: ChatComposerRuntimeQueueController;
  send: ChatComposerRuntimeSendAction;
  clearComposerDraft: () => void;
  setDebugInfo: (message: string) => void;
};

type ChatComposerRuntimeSubmissionActionsState = {
  composerHasContent: boolean;
  sendComposerInput: () => void;
  queueComposerInput: () => void;
};

type ChatComposerRuntimeSubmissionChromeStateInput =
  & ChatComposerRuntimeSubmissionActionsStateInput
  & {
    platform: ChatComposerRuntimeTextEntrySubmissionStateInput['platform'];
    onTextEntryChangeText: ChatComposerRuntimeTextEntrySubmissionStateInput['onChangeText'];
  };

type ChatComposerRuntimeSubmissionChromeState =
  & ChatComposerRuntimeSubmissionActionsState
  & {
    textEntrySubmissionState: ChatComposerRuntimeTextEntrySubmissionState;
  };

type ChatComposerRuntimeHandsFreeController = {
  state: {
    phase: HandsFreePhase;
  };
  wakeByUser: () => void;
  sleepByUser: () => void;
  resumeByUser: () => void;
  pauseByUser: () => void;
};

type ChatComposerRuntimeHandsFreeControlActionsStateInput = {
  handsFreeController: ChatComposerRuntimeHandsFreeController;
  listening: boolean;
  wakePhrase: string;
  startRecording: () => void | Promise<void>;
  stopRecognitionOnly: () => void | Promise<void>;
  stopSpeech: () => void;
  setDebugInfo: (message: string) => void;
};

type ChatComposerRuntimeHandsFreeControlChromeActionsStateInput = Omit<
  ChatComposerRuntimeHandsFreeControlActionsStateInput,
  'stopSpeech'
>;

type ChatComposerRuntimeHandsFreeControlActionsState = {
  wakeHandsFreeByUser: () => void;
  sleepHandsFreeByUser: () => void;
  resumeHandsFreeByUser: () => void;
  pauseHandsFreeByUser: () => void;
  handleHandsFreePrimaryControl: () => void;
};

type ChatComposerRuntimeHandsFreeRecognizerLifecycleController = {
  state: {
    phase: HandsFreePhase;
  };
  shouldKeepRecognizerActive: boolean;
  resetError: () => void;
};

type ChatComposerRuntimeHandsFreeRecognizerLifecycleStateInput = {
  handsFree: boolean;
  handsFreeRuntimeActive: boolean;
  listening: boolean;
  handsFreeController: ChatComposerRuntimeHandsFreeRecognizerLifecycleController;
  startRecording: () => void | Promise<void>;
  stopRecognitionOnly: () => void | Promise<void>;
  setHandsFreePhaseRefValue: (phase: HandsFreePhase) => void;
  errorResetDelayMs?: number;
};

type ChatComposerRuntimeVoiceDebugResetStateInput = {
  isVoiceDebugEnabled: boolean;
  clearVoiceDebug: () => void;
};

type ChatRuntimeMutableRef<T> = {
  current: T;
};

type ChatMessageRuntimeMessageState<TMessage> = {
  messages: TMessage[];
  setMessages: Dispatch<SetStateAction<TMessage[]>>;
  messagesRef: ChatRuntimeMutableRef<TMessage[]>;
  progressMessagesRef: ChatRuntimeMutableRef<TMessage[]>;
};

type ChatMessageRuntimeSendCallback = (text: string) => Promise<void>;

type ChatMessageRuntimeSendRefState = {
  sendRef: ChatRuntimeMutableRef<ChatMessageRuntimeSendCallback>;
  syncSendRef: (send: ChatMessageRuntimeSendCallback) => void;
};

type ChatMessageRuntimeInitialMessageStateInput = {
  routeInitialMessage: unknown;
  currentSessionId?: string | null;
  initialMessageRef: ChatRuntimeMutableRef<string | null>;
  initialMessageSentRef: ChatRuntimeMutableRef<boolean>;
  sendRef: ChatRuntimeMutableRef<ChatMessageRuntimeSendCallback>;
  clearRouteInitialMessage?: () => void;
  voiceLog: VoiceDebugLog;
  autoSendDelayMs?: number;
};

type ChatMessageRuntimeSessionPersistStateInput<TMessage> = {
  messages: TMessage[];
  currentSessionId?: string | null;
  deletingSessionIds: ReadonlySet<string>;
  prevSessionIdRef: ChatRuntimeMutableRef<string | null>;
  prevMessagesLengthRef: ChatRuntimeMutableRef<number>;
  skipNextPersistRef: ChatRuntimeMutableRef<boolean>;
  persistMessages: (messages: TMessage[]) => unknown;
};

type ChatMessageRuntimeSessionLoadMessage =
  ChatMessageRuntimeSessionMessageLike<{ name: string; arguments: unknown }, unknown> &
  ChatMessageRuntimeResponseHistorySourceMessage;

type ChatMessageRuntimeSessionLoadSession<TMessage extends ChatMessageRuntimeSessionLoadMessage> = {
  id: string;
  messages: readonly TMessage[];
  serverConversationId?: string | null;
};

type ChatMessageRuntimeSessionLoadResult<TMessage extends ChatMessageRuntimeSessionLoadMessage> = {
  messages: readonly TMessage[];
};

type ChatMessageRuntimeSessionLoadStateInput<
  TMessage extends ChatMessageRuntimeSessionLoadMessage,
  TClient,
> = {
  currentSessionId?: string | null;
  currentSessionIdRef: ChatRuntimeMutableRef<string | null>;
  deletingSessionIdsSize: number;
  hasServerAuth: boolean;
  settingsClient?: TClient | null;
  createLazyLoadClient: () => TClient;
  getCurrentSession: () => ChatMessageRuntimeSessionLoadSession<TMessage> | null;
  createNewSession: () => ChatMessageRuntimeSessionLoadSession<TMessage>;
  loadSessionMessages: (
    sessionId: string,
    client: TClient,
  ) => Promise<ChatMessageRuntimeSessionLoadResult<TMessage> | null>;
  setMessages: Dispatch<SetStateAction<TMessage[]>>;
  setLatestStepSummary: Dispatch<SetStateAction<AgentStepSummary | null>>;
  lastLoadedSessionIdRef: ChatRuntimeMutableRef<string | null>;
  pendingLazyLoadSessionIdRef: ChatRuntimeMutableRef<string | null>;
  skipNextPersistRef: ChatRuntimeMutableRef<boolean>;
  resetThreadExpansionState: () => void;
  clearCopiedMessageFeedback: () => void;
  replaceResponseHistory: (events: AgentUserResponseEvent[]) => void;
  resetResponseSpeechPlaybackState: (playedEventIds?: Iterable<string>) => void;
  warn?: (message?: unknown, ...optionalParams: unknown[]) => void;
};

type ChatMessageRuntimeSessionRefStateInput = {
  initialMessage: string | null;
};

type ChatMessageRuntimeSessionRefState = {
  lastLoadedSessionIdRef: ChatRuntimeMutableRef<string | null>;
  pendingLazyLoadSessionIdRef: ChatRuntimeMutableRef<string | null>;
  skipNextPersistRef: ChatRuntimeMutableRef<boolean>;
  initialMessageRef: ChatRuntimeMutableRef<string | null>;
  initialMessageSentRef: ChatRuntimeMutableRef<boolean>;
  prevMessagesLengthRef: ChatRuntimeMutableRef<number>;
  prevSessionIdRef: ChatRuntimeMutableRef<string | null>;
  convoRef: ChatRuntimeMutableRef<string | undefined>;
};

type ChatMessageRuntimeResponseHistoryState = {
  respondToUserHistory: AgentUserResponseEvent[];
  playedResponseEventIdsRef: ChatRuntimeMutableRef<Set<string>>;
  queuedResponseEventsRef: ChatRuntimeMutableRef<AgentUserResponseEvent[]>;
  activeAutoSpeechEventIdRef: ChatRuntimeMutableRef<string | null>;
  recentAutoSpeechByTextRef: ChatRuntimeMutableRef<Map<string, number>>;
  replaceResponseHistory: (events: AgentUserResponseEvent[]) => void;
  createFallbackResponseEvent: (
    sessionId: string | null | undefined,
    runId: number | undefined,
    text: string,
  ) => AgentUserResponseEvent;
  mergeResponseEvents: (incomingEvents: AgentUserResponseEvent[]) => void;
  clearQueuedResponseSpeech: () => void;
  resetResponseSpeechPlaybackState: (playedEventIds?: Iterable<string>) => void;
};

type ChatMessageRuntimeResponseSpeechSpeaker = (
  content: string,
  reason: string,
  onSettled?: () => void,
) => boolean;

type ChatMessageRuntimeResponseSpeechQueueActionsStateInput = {
  isTextToSpeechEnabled: boolean;
  ttsEnabledRef: ChatRuntimeMutableRef<boolean>;
  playedResponseEventIdsRef: ChatRuntimeMutableRef<Set<string>>;
  queuedResponseEventsRef: ChatRuntimeMutableRef<AgentUserResponseEvent[]>;
  activeAutoSpeechEventIdRef: ChatRuntimeMutableRef<string | null>;
  speakAssistantResponse: ChatMessageRuntimeResponseSpeechSpeaker;
};

type ChatMessageRuntimeResponseSpeechQueueActionsState = {
  enqueueResponseEventsForSpeech: (events: AgentUserResponseEvent[]) => void;
  processResponseSpeechQueue: () => void;
};

type ChatMessageRuntimeAssistantSpeechActionsStateInput = {
  ttsEnabledRef: ChatRuntimeMutableRef<boolean>;
  recentAutoSpeechByTextRef: ChatRuntimeMutableRef<Map<string, number>>;
  config: ChatMessageRuntimeSpeechActionConfig;
  effectiveTtsProvider: string;
  effectiveRemoteTtsVoice?: string | null;
  effectiveRemoteTtsModel?: string | null;
  effectiveRemoteTtsRate?: number | null;
  handsFree: boolean;
  handsFreeController: ChatMessageRuntimeSpeechActionsController;
  speakNative: (text: string, options: ChatMessageRuntimeNativeSpeechOptions) => void;
  speakRemote: (text: string, options: ChatMessageRuntimeRemoteSpeechOptions) => unknown | Promise<unknown>;
  voiceLog: VoiceDebugLog;
  duplicateSuppressionMs?: number;
};

type ChatMessageRuntimeAssistantSpeechChromeActionsStateInput = Omit<
  ChatMessageRuntimeAssistantSpeechActionsStateInput,
  'speakNative' | 'speakRemote'
>;

type ChatMessageRuntimeAssistantSpeechActionsState = {
  speakAssistantResponse: ChatMessageRuntimeResponseSpeechSpeaker;
};

type ChatMessageRuntimeSpeechPlaybackState = {
  speakingMessageIndex: number | null;
  setSpeakingMessageIndex: Dispatch<SetStateAction<number | null>>;
  intendedSpeakingIndexRef: ChatRuntimeMutableRef<number | null>;
  setIntendedSpeakingMessage: (messageIndex: number) => void;
  startSpeakingMessage: (messageIndex: number) => void;
  clearSpeakingMessage: () => void;
  clearIntendedSpeakingMessage: () => void;
};

type ChatMessageRuntimeSpeechActionConfig = {
  baseUrl?: string | null;
  apiKey?: string | null;
  ttsRate?: number | null;
  ttsPitch?: number | null;
  ttsVoiceId?: string | null;
};

type ChatMessageRuntimeSpeechActionsController = {
  onSpeechStarted: () => void;
  onSpeechFinished: () => void;
};

type ChatMessageRuntimeNativeSpeechOptions = {
  language?: string;
  rate?: number;
  pitch?: number;
  voice?: string;
  onDone?: () => void;
  onError?: () => void;
  onStopped?: () => void;
};

type ChatMessageRuntimeRemoteSpeechOptions = {
  baseUrl: string;
  apiKey: string;
  providerId?: string;
  voice?: string;
  model?: string;
  rate?: number;
  onDone?: () => void;
  onError?: () => void;
  onStopped?: () => void;
};

type ChatMessageRuntimeSpeechActionsStateInput = {
  speakingMessageIndex: number | null;
  config: ChatMessageRuntimeSpeechActionConfig;
  effectiveTtsProvider: string;
  effectiveRemoteTtsVoice?: string | null;
  effectiveRemoteTtsModel?: string | null;
  effectiveRemoteTtsRate?: number | null;
  handsFree: boolean;
  handsFreeController: ChatMessageRuntimeSpeechActionsController;
  intendedSpeakingIndexRef: ChatRuntimeMutableRef<number | null>;
  setIntendedSpeakingMessage: (messageIndex: number) => void;
  startSpeakingMessage: (messageIndex: number) => void;
  clearSpeakingMessage: () => void;
  clearIntendedSpeakingMessage: () => void;
  speakNative: (text: string, options: ChatMessageRuntimeNativeSpeechOptions) => void;
  stopNativeSpeech: () => void;
  speakRemote: (text: string, options: ChatMessageRuntimeRemoteSpeechOptions) => unknown | Promise<unknown>;
  stopRemoteSpeech: () => void;
  voiceLog: VoiceDebugLog;
};

type ChatMessageRuntimeSpeechChromeActionsStateInput = Omit<
  ChatMessageRuntimeSpeechActionsStateInput,
  'speakNative' | 'stopNativeSpeech' | 'speakRemote' | 'stopRemoteSpeech'
>;

type ChatMessageRuntimeSpeechActionsState = {
  speakMessage: (messageIndex: number, content: string) => void;
};

type ChatMessageRuntimeSpeechCleanupStateInput = {
  stopNativeSpeech: () => void;
  stopRemoteSpeech: () => void;
};

type ChatMessageRuntimeSpeechChromeCleanupStateInput = Omit<
  ChatMessageRuntimeSpeechCleanupStateInput,
  'stopNativeSpeech' | 'stopRemoteSpeech'
>;

type ChatComposerRuntimeEditBeforeSendState = {
  editBeforeSendEnabled: boolean;
  toggleEditBeforeSend: () => void;
};

type ChatRuntimeStatusState = {
  responding: boolean;
  setResponding: Dispatch<SetStateAction<boolean>>;
  conversationState: AgentConversationState | null;
  setConversationState: Dispatch<SetStateAction<AgentConversationState | null>>;
  latestStepSummary: AgentStepSummary | null;
  setLatestStepSummary: Dispatch<SetStateAction<AgentStepSummary | null>>;
  connectionState: RecoveryState | null;
  setConnectionState: Dispatch<SetStateAction<RecoveryState | null>>;
};

type ChatRuntimeRequestDebugState = {
  requestDebugText: string;
  setRequestDebugText: Dispatch<SetStateAction<string>>;
  clearRequestDebugText: () => void;
};

type ChatRuntimeRequestTrackingStateInput = {
  currentSessionId: string | null;
};

type ChatRuntimeRequestTrackingState = {
  activeRequestIdRef: ChatRuntimeMutableRef<number>;
  currentSessionIdRef: ChatRuntimeMutableRef<string | null>;
};

type ChatRuntimeConnectionStatusManager = {
  getConnectionState: (sessionId: string) => RecoveryState | null | undefined;
  isConnectionActive: (sessionId: string) => boolean;
  getOrCreateConnection: (sessionId: string) => unknown;
  subscribeToConnectionStatus: (
    sessionId: string,
    onStatusChange: (state: RecoveryState) => void,
  ) => (() => void);
};

type ChatRuntimeConnectionStatusSubscriptionInput = {
  currentSessionId: string | null;
  connectionManager: ChatRuntimeConnectionStatusManager;
  currentSessionIdRef: ChatRuntimeMutableRef<string | null>;
  setConnectionState: Dispatch<SetStateAction<RecoveryState | null>>;
  setResponding: Dispatch<SetStateAction<boolean>>;
  setConversationState: Dispatch<SetStateAction<AgentConversationState | null>>;
  setLatestStepSummary: Dispatch<SetStateAction<AgentStepSummary | null>>;
  logConnectionStatus?: (statusMessage: string) => void;
};

type ChatRuntimeForegroundStateInput = {
  handsFree: boolean;
  isFocused: boolean;
};

type ChatRuntimeForegroundState = {
  appState: AppStateStatus;
  isAppActive: boolean;
  handsFreeRuntimeActive: boolean;
};

type ChatRuntimeHandsFreeMutableStateInput = {
  handsFree: boolean;
  ttsEnabled: boolean;
};

type ChatRuntimeHandsFreeMutableState = {
  handsFreeRef: ChatRuntimeMutableRef<boolean>;
  handsFreePhaseRef: ChatRuntimeMutableRef<HandsFreePhase>;
  ttsEnabledRef: ChatRuntimeMutableRef<boolean>;
  setHandsFreeRefValue: (value: boolean) => void;
  setHandsFreePhaseRefValue: (phase: HandsFreePhase) => void;
};

type ChatRuntimeHandsFreeToggleController = {
  reset: () => void;
};

type ChatRuntimeTextToSpeechToggleController = {
  onSpeechFinished: () => void;
};

type ChatRuntimeHandsFreeToggleActionsStateInput<TConfig extends object> = {
  config: TConfig;
  setConfig: (config: TConfig) => void;
  saveConfig: (config: TConfig) => unknown | Promise<unknown>;
  handsFreeController: ChatRuntimeHandsFreeToggleController;
  handsFreeRef: ChatRuntimeMutableRef<boolean>;
  setHandsFreeRefValue: (value: boolean) => void;
  stopRecognitionOnly: () => void | Promise<void>;
  stopSpeech: () => void;
  stopRemoteSpeech: () => void;
  setDebugInfo: (message: string) => void;
};

type ChatRuntimeHandsFreeToggleChromeActionsStateInput<TConfig extends object> = Omit<
  ChatRuntimeHandsFreeToggleActionsStateInput<TConfig>,
  'stopSpeech' | 'stopRemoteSpeech'
>;

type ChatRuntimeHandsFreeToggleActionsState = {
  toggleHandsFree: () => Promise<void>;
};

type ChatRuntimeTextToSpeechToggleActionsStateInput<TConfig extends object> = {
  ttsEnabled: boolean;
  config: TConfig;
  setConfig: (config: TConfig) => void;
  saveConfig: (config: TConfig) => unknown | Promise<unknown>;
  handsFreeController: ChatRuntimeTextToSpeechToggleController;
  handsFreeRef: ChatRuntimeMutableRef<boolean>;
  handsFreePhaseRef: ChatRuntimeMutableRef<HandsFreePhase>;
  clearIntendedSpeakingMessage: () => void;
  clearQueuedResponseSpeech: () => void;
  clearSpeakingMessage: () => void;
  stopSpeech: () => void;
  stopRemoteSpeech: () => void;
  voiceLog: VoiceDebugLog;
};

type ChatRuntimeTextToSpeechToggleChromeActionsStateInput<TConfig extends object> = Omit<
  ChatRuntimeTextToSpeechToggleActionsStateInput<TConfig>,
  'stopSpeech' | 'stopRemoteSpeech'
>;

type ChatRuntimeTextToSpeechToggleActionsState = {
  toggleTextToSpeech: () => Promise<void>;
};

type ChatRuntimeConnectionRetryState = {
  lastFailedMessage: string | null;
  setLastFailedMessage: Dispatch<SetStateAction<string | null>>;
  clearLastFailedMessage: () => void;
};

type ChatRuntimeConnectionRetryClient<TToolCall = unknown, TToolResult = unknown> = {
  getRecoveryConversationId: () => string | null | undefined;
  getConversation: (
    conversationId: string,
  ) => Promise<{
    messages: readonly ChatMessageRuntimeHistoryMessageLike<TToolCall, TToolResult>[];
  } | null | undefined>;
};

type ChatRuntimeConnectionRetrySessionStore<TMessage> = {
  setServerConversationId: (conversationId: string) => void | Promise<void>;
  setMessages: (messages: TMessage[]) => void | Promise<void>;
};

type ChatRuntimeConnectionRetryActionStateInput<
  TMessage extends ChatDisplayMessageLike,
  TToolCall = unknown,
  TToolResult = unknown,
> = {
  lastFailedMessage: string | null;
  clearLastFailedMessage: () => void;
  getSessionClient: () => ChatRuntimeConnectionRetryClient<TToolCall, TToolResult> | null;
  sessionStore: ChatRuntimeConnectionRetrySessionStore<TMessage>;
  setMessages: Dispatch<SetStateAction<TMessage[]>>;
  send: (text: string) => void | Promise<void>;
  retryDelayMs?: number;
};

type ChatRuntimeConnectionRetryActionState = {
  handleRetryLastFailedMessage: () => Promise<void>;
  handleRetryLastFailedMessagePress: () => void;
};

type ChatMessageActionIcon = ChatRuntimeMessageActionIconLike<IoniconName, number, string>;

type ChatMessageActionIconButtonProps =
  ChatRuntimeMessageActionIconButtonMobileProps<
    ChatMessageActionIcon,
    (event: GestureResponderEvent) => void,
    AccessibilityRole,
    AccessibilityState,
    boolean,
    number | Insets,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatMessageActionIconButtonParts =
  ChatRuntimeMessageActionIconButtonMobilePropsParts<
    ChatMessageActionIcon,
    (event: GestureResponderEvent) => void,
    AccessibilityRole,
    AccessibilityState,
    boolean,
    number | Insets,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatMessageActionIconButtonPressableState = {
  pressed: boolean;
};

type ChatMessageActionIconButtonPressableProps = {
  children: ReactNode;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  disabled: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint: string | undefined;
  accessibilityState: AccessibilityState | { disabled: true } | undefined;
  'aria-expanded': boolean | undefined;
  hitSlop: (number | Insets) | undefined;
  style: (state: ChatMessageActionIconButtonPressableState) => Array<
    | StyleProp<ViewStyle>
    | false
    | undefined
  >;
};

type ChatMessageActionIconButtonActivityIndicatorProps = {
  size: ChatMessageActionIcon['size'];
  color: ChatMessageActionIcon['color'];
};

type ChatMessageActionIconButtonIconProps = {
  name: ChatMessageActionIcon['name'];
  size: ChatMessageActionIcon['size'];
  color: ChatMessageActionIcon['color'];
};

type ChatMessageActionIconButtonPressableContentProps = {
  activityIndicator: {
    shouldRender: boolean;
    props: ChatMessageActionIconButtonActivityIndicatorProps;
  };
  icon: {
    shouldRender: boolean;
    props: ChatMessageActionIconButtonIconProps;
  };
};

type ChatMessageActionButtonRenderState =
  ChatRuntimeMessageActionIconButtonRenderState<
    ChatMessageActionIcon,
    AccessibilityRole,
    AccessibilityState,
    boolean
  >;

type ChatMessageActionButtonSpec =
  ChatRuntimeMessageActionIconButtonSpec<
    ChatMessageActionIcon,
    (event: GestureResponderEvent) => void,
    AccessibilityRole,
    AccessibilityState,
    boolean,
    number | Insets,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatMessageSpeechActionSpec = Omit<ChatMessageActionButtonSpec, 'renderState'> & {
  renderState: ChatMessageActionButtonRenderState;
};

type ChatMessageBranchActionSpec = Omit<ChatMessageActionButtonSpec, 'renderState'> & {
  renderState: ChatRuntimeBranchMobileRenderState;
};

type ChatMessageCopyActionSpec = Omit<ChatMessageActionButtonSpec, 'renderState'> & {
  renderState: ChatMessageActionButtonRenderState;
};

type ChatMessageBranchActionSpecInput =
  Omit<ChatMessageActionButtonSpec, 'renderState' | 'isActive'>
  & ChatRuntimeConversationMessageActionsMobileRenderStateInput['branch'];

type ChatMessageSpeechActionSpecInput =
  Omit<ChatMessageActionButtonSpec, 'renderState' | 'isActive'>
  & ChatRuntimeConversationMessageActionsMobileRenderStateInput['speech'];

type ChatMessageCopyActionSpecInput =
  Omit<ChatMessageActionButtonSpec, 'renderState' | 'isActive'>
  & ChatRuntimeConversationMessageActionsMobileRenderStateInput['copy'];

type ChatMessageExpansionActionSpec = Omit<ChatMessageActionButtonSpec, 'renderState'> & {
  renderState: ChatMessageExpansionMobileRenderState;
};

type ChatMessageExpansionActionSpecInput = Omit<ChatMessageExpansionActionSpec, 'renderState'>;

type ChatMessageTurnDurationActionSpec = ChatMessageTurnDurationBadgeProps;

type ChatMessageTurnDurationActionSpecInput =
  Omit<ChatMessageTurnDurationActionSpec, 'renderState'>
  & ChatRuntimeConversationMessageActionsMobileRenderStateInput['turnDuration'];

type ChatMessageActionComponentsInput =
  ChatRuntimeConversationActionComponentsMobileProps<
    ChatMessageTurnDurationActionSpec,
    ChatMessageSpeechActionSpec,
    ChatMessageBranchActionSpec,
    ChatMessageCopyActionSpec,
    ChatMessageExpansionActionSpec
  >;

type ChatMessageActionSetInput =
  ChatRuntimeConversationActionComponentsMobilePropsInput<
    ChatMessageTurnDurationActionSpecInput,
    ChatMessageSpeechActionSpecInput,
    ChatMessageBranchActionSpecInput,
    ChatMessageCopyActionSpecInput,
    ChatMessageExpansionActionSpecInput
  >;

type ChatMessageRuntimeClipboardActionsStateInput = {
  copyText: (content: string) => Promise<unknown>;
  showAlert: (title: string, message: string) => void;
  showCopiedMessageFeedback: (messageIndex: number) => void;
};

type ChatMessageRuntimeClipboardChromeActionsStateInput = Omit<
  ChatMessageRuntimeClipboardActionsStateInput,
  'copyText' | 'showAlert'
>;

type ChatMessageRuntimeClipboardActionsState = {
  handleCopyMessage: (messageIndex: number, content: string) => Promise<void>;
  handleCopyToolPayload: (content: string) => Promise<void>;
};

type ChatMessageConversationRenderContextInput =
  ChatRuntimeConversationMessageRenderContextMobileStateInput;

type ChatMessageConversationRenderContext =
  ChatRuntimeConversationMessageRenderContextMobileState;

type ChatMessageActionComponentMap = ChatMessageActionSlotRenderMap<ReactNode>;
type ChatMessageActionEntry = ChatMessageActionSlotRenderEntry<ReactNode>;

export type ChatMessageActionSet =
  ChatRuntimeConversationActionSetMobileProps<ChatMessageActionEntry>;

type ChatMessageTurnDurationActionStyles = Pick<
    ChatMessageTurnDurationActionSpec,
    'style' | 'liveStyle' | 'textStyle' | 'liveTextStyle'
  >;

type ChatMessageSpeechActionStyles =
  Pick<ChatMessageActionButtonSpec, 'style' | 'activeStyle' | 'pressedStyle'>;

type ChatMessageBranchActionStyles =
  Pick<ChatMessageActionButtonSpec, 'style' | 'pressedStyle' | 'disabledStyle'>;

type ChatMessageCopyActionStyles =
  Pick<ChatMessageActionButtonSpec, 'style' | 'activeStyle' | 'pressedStyle'>;

type ChatMessageExpansionActionStyles =
  Pick<ChatMessageActionButtonSpec, 'style' | 'pressedStyle'>;

export type ChatMessageActionStyleSlots = SharedChatMessageActionStyleSlots<
  ChatMessageTurnDurationActionStyles,
  ChatMessageSpeechActionStyles,
  ChatMessageBranchActionStyles,
  ChatMessageCopyActionStyles,
  ChatMessageExpansionActionStyles
>;

type ChatRuntimeHeaderAgentSelectorStyles =
  SharedChatRuntimeHeaderAgentSelectorStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatRuntimeHeaderAgentSelectorProps =
  ChatRuntimeHeaderAgentSelectorMobilePropsPartsInput<
    ChatRuntimeAgentSelectorMobileRenderState,
    (event: GestureResponderEvent) => void,
    number,
    ChatRuntimeHeaderAgentSelectorStyles
  >;

type ChatRuntimeHeaderAgentSelectorParts =
  ChatRuntimeHeaderAgentSelectorMobilePropsParts<
    ChatRuntimeAgentSelectorMobileRenderState,
    (event: GestureResponderEvent) => void,
    number,
    ChatRuntimeHeaderAgentSelectorStyles
  >;

type ChatRuntimeHeaderAgentSelectorTouchableProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  activeOpacity: number;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint: string | undefined;
};

type ChatRuntimeHeaderAgentSelectorChipProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
};

type ChatRuntimeHeaderAgentSelectorLabelProps = {
  props: {
    style: StyleProp<TextStyle>;
    numberOfLines: number;
  };
  text: string;
};

type ChatRuntimeHeaderAgentSelectorIconProps = {
  name: IoniconName;
  size: number;
  color: string;
};

type ChatRuntimeHeaderAgentSelectorChipContentProps = {
  label: {
    props: ChatRuntimeHeaderAgentSelectorLabelProps;
  };
  icon: {
    props: ChatRuntimeHeaderAgentSelectorIconProps;
  };
};

type ChatRuntimeHeaderAgentSelectorTouchableContentProps = {
  chip: {
    props: Omit<ChatRuntimeHeaderAgentSelectorChipProps, 'children'>;
    content: ChatRuntimeHeaderAgentSelectorChipContentProps;
  };
};

type ChatRuntimeHeaderActionsRowProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
};

type ChatRuntimeHeaderIconButtonRenderState =
  | ChatRuntimeBackMobileRenderState
  | ChatRuntimePinMobileRenderState
  | ChatRuntimeKillSwitchMobileRenderState
  | ChatRuntimeHandsFreeMobileRenderState;

type ChatRuntimeHeaderIconButtonProps =
  ChatRuntimeHeaderIconButtonMobilePropsPartsInput<
    ChatRuntimeHeaderIconButtonRenderState,
    (event: GestureResponderEvent) => void,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatRuntimeHeaderIconButtonParts =
  ChatRuntimeHeaderIconButtonMobilePropsParts<
    ChatRuntimeHeaderIconButtonRenderState,
    (event: GestureResponderEvent) => void,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatRuntimeHeaderIconButtonTouchableStyle =
  Array<StyleProp<ViewStyle> | false | undefined>;

type ChatRuntimeHeaderIconButtonTouchableProps = {
  children: ReactNode;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  activeOpacity: number;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint: string | undefined;
  accessibilityState: unknown;
  'aria-checked': unknown;
  style: ChatRuntimeHeaderIconButtonTouchableStyle;
};

type ChatRuntimeHeaderIconButtonIconContainerProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle> | undefined;
};

type ChatRuntimeHeaderIconButtonIconProps = {
  name: IoniconName;
  size: number;
  color: string;
};

type ChatRuntimeHeaderIconButtonTouchableContentProps = {
  iconContainer: {
    shouldRender: boolean;
    props: Omit<ChatRuntimeHeaderIconButtonIconContainerProps, 'children'>;
  };
  icon: {
    props: ChatRuntimeHeaderIconButtonIconProps;
  };
};

type ChatRuntimeHeaderConversationStatusStyles =
  SharedChatRuntimeHeaderConversationStatusStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ImageStyle>
  >;

type ChatRuntimeHeaderConversationStatusProps =
  ChatRuntimeHeaderConversationStatusMobilePropsPartsInput<
    ChatSessionStatusMobileRenderState,
    ImageSourcePropType,
    ChatRuntimeHeaderConversationStatusStyles
  >;

type ChatRuntimeHeaderConversationStatusParts =
  ChatRuntimeHeaderConversationStatusMobilePropsParts<
    ChatSessionStatusMobileRenderState,
    ImageSourcePropType,
    ChatRuntimeHeaderConversationStatusStyles
  >;

type ChatRuntimeHeaderConversationStatusContainerProps = {
  children: ReactNode;
  style: Array<StyleProp<ViewStyle>>;
};

type ChatRuntimeHeaderConversationStatusRunningIndicatorProps = {
  source: ImageSourcePropType;
  style: StyleProp<ImageStyle>;
  resizeMode: ComponentProps<typeof Image>['resizeMode'];
};

type ChatRuntimeHeaderConversationStatusLabelProps = {
  props: {
    style: Array<StyleProp<TextStyle>>;
  };
  text: string;
};

type ChatRuntimeHeaderConversationStatusContainerContentProps = {
  runningIndicator: {
    shouldRender: boolean;
    props: ChatRuntimeHeaderConversationStatusRunningIndicatorProps;
  };
  label: {
    props: ChatRuntimeHeaderConversationStatusLabelProps;
  };
};

type ChatRuntimeHeaderTurnDurationStyles =
  SharedChatRuntimeHeaderTurnDurationStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>
  >;

type ChatRuntimeHeaderTurnDurationProps =
  ChatRuntimeHeaderTurnDurationMobilePropsPartsInput<
    ChatRuntimeTurnDurationHeaderMobileRenderState,
    ChatRuntimeHeaderTurnDurationStyles
  >;

type ChatRuntimeHeaderTurnDurationParts =
  ChatRuntimeHeaderTurnDurationMobilePropsParts<
    ChatRuntimeTurnDurationHeaderMobileRenderState,
    ChatRuntimeHeaderTurnDurationStyles
  >;

type ChatRuntimeHeaderTurnDurationContainerStyle =
  Array<StyleProp<ViewStyle> | false | undefined>;

type ChatRuntimeHeaderTurnDurationContainerProps = {
  children: ReactNode;
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  style: ChatRuntimeHeaderTurnDurationContainerStyle;
};

type ChatRuntimeHeaderTurnDurationIconProps = {
  name: IoniconName;
  size: number;
  color: string;
};

type ChatRuntimeHeaderTurnDurationLabelProps = {
  props: {
    style: Array<StyleProp<TextStyle> | false | undefined>;
    numberOfLines: number;
  };
  text: string;
};

type ChatRuntimeHeaderTurnDurationContainerContentProps = {
  icon: {
    props: ChatRuntimeHeaderTurnDurationIconProps;
  };
  label: {
    props: ChatRuntimeHeaderTurnDurationLabelProps;
  };
};

type ChatRuntimeHeaderIconButtonStyles =
  SharedChatRuntimeHeaderIconButtonStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatRuntimeHeaderStyleSlots =
  SharedChatRuntimeHeaderStyleSlots<
    StyleProp<ViewStyle>,
    ChatRuntimeHeaderAgentSelectorStyles,
    ChatRuntimeHeaderConversationStatusStyles,
    ChatRuntimeHeaderTurnDurationStyles,
    ChatRuntimeHeaderIconButtonStyles
  >;

type ChatRuntimeNavigationHeaderOptionParts =
  ChatRuntimeNavigationHeaderOptionsParts<
    ChatRuntimeAgentSelectorMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatRuntimeBackMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatRuntimePinMobileRenderState,
    (event: GestureResponderEvent) => void,
    boolean,
    ChatSessionStatusMobileRenderState,
    ImageSourcePropType,
    ChatRuntimeTurnDurationHeaderMobileRenderState,
    boolean,
    ChatRuntimeKillSwitchMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatRuntimeHandsFreeMobileRenderState,
    (event: GestureResponderEvent) => void
  >;

type ChatRuntimeNavigationHeaderMobileOptionParts =
  ChatRuntimeNavigationHeaderOptionsMobilePropsParts<
    ChatRuntimeNavigationHeaderOptionParts & {
      styles: ChatRuntimeHeaderStyleSlots;
    }
  >;

type ChatRuntimeNavigationHeaderOptionsInput = {
  agentSelectorRenderState: ChatRuntimeAgentSelectorMobileRenderState;
  onAgentSelectorPress: (event: GestureResponderEvent) => void;
  agentSelectorLabelNumberOfLines: number;
  backButtonRenderState: ChatRuntimeBackMobileRenderState;
  onBackButtonPress: (event: GestureResponderEvent) => void;
  pinButtonRenderState: ChatRuntimePinMobileRenderState;
  onPinButtonPress: (event: GestureResponderEvent) => void;
  pinButtonIsActive: boolean;
  conversationStatusRenderState: ChatSessionStatusMobileRenderState;
  conversationStatusSpinnerSource: ImageSourcePropType;
  turnDurationRenderState: ChatRuntimeTurnDurationHeaderMobileRenderState;
  killSwitchButtonShouldRender: boolean;
  killSwitchButtonRenderState: ChatRuntimeKillSwitchMobileRenderState;
  onKillSwitchButtonPress: (event: GestureResponderEvent) => void;
  handsFreeButtonRenderState: ChatRuntimeHandsFreeMobileRenderState;
  onHandsFreeButtonPress: (event: GestureResponderEvent) => void;
  styles: ChatRuntimeHeaderStyleSlots;
};

type ChatRuntimeNavigationHeaderRenderStateInput =
  ChatRuntimeNavigationHeaderMobileRenderStateInput;

type ChatRuntimeNavigationHeaderRenderState =
  ChatRuntimeNavigationHeaderMobileRenderState;

type ChatRuntimeNavigationHeaderOptions = {
  headerTitle: () => ReactNode;
  headerLeft: () => ReactNode;
  headerRight: () => ReactNode;
};

type ChatRuntimeNavigationHeaderOptionsEffectInput = ChatRuntimeNavigationHeaderOptionsInput & {
  navigation?: {
    setOptions?: (options: ChatRuntimeNavigationHeaderOptions) => void;
  } | null;
};

type ChatRuntimeNavigationHeaderChromeOptionsInput =
  ChatRuntimeNavigationHeaderRenderStateInput
  & Pick<
    ChatRuntimeNavigationHeaderOptionsEffectInput,
    | 'navigation'
    | 'onAgentSelectorPress'
    | 'onBackButtonPress'
    | 'onPinButtonPress'
    | 'onKillSwitchButtonPress'
    | 'onHandsFreeButtonPress'
    | 'styles'
  >
  & {
    spinnerSource: ImageSourcePropType;
  };

export type ChatConversationHomeQuickStartSource = PromptLibraryLauncherShortcutSource;

export type ChatConversationHomeQuickStartItem<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = PromptLibraryShortcutItem<TPrompt, TTask>;

type ChatConversationHomeQuickStartActionsStateInput<
  TTask extends PromptLibraryTaskLike & { id: string },
> = {
  setComposerInput: Dispatch<SetStateAction<string>>;
  focusComposerInput: () => void;
  openAddPrompt: () => void;
  runPromptTask: (task: TTask) => void | Promise<void>;
};

type ChatConversationHomeQuickStartActionsState<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = {
  handleQuickStartPress: (item: ChatConversationHomeQuickStartItem<TPrompt, TTask>) => void;
};

export function showChatConversationHomePromptDeleteNativeConfirmAlert(
  input: ChatConversationHomePromptEditorDeleteNativeConfirmInput,
  showAlert: ChatRuntimeNativeConfirmAlertPresenter,
): void {
  showAlert(input.title, input.message, [
    { text: input.cancelLabel, style: 'cancel' },
    { text: input.deleteLabel, style: 'destructive', onPress: input.onConfirm },
  ]);
}

export function createChatConversationHomePromptDeleteNativeConfirmPresenter(
  showAlert: ChatRuntimeNativeConfirmAlertPresenter,
): (input: ChatConversationHomePromptEditorDeleteNativeConfirmInput) => void {
  return (input) => showChatConversationHomePromptDeleteNativeConfirmAlert(input, showAlert);
}

export function confirmChatRuntimeWebDialog(message: string): boolean {
  return Boolean((globalThis as { confirm?: (message?: string) => boolean }).confirm?.(message));
}

export function showChatRuntimeWebAlert(message: string): void {
  (globalThis as { alert?: (message?: string) => void }).alert?.(message);
}

export function useChatConversationHomeQuickStartActionsState<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>({
  setComposerInput,
  focusComposerInput,
  openAddPrompt,
  runPromptTask,
}: ChatConversationHomeQuickStartActionsStateInput<TTask>): ChatConversationHomeQuickStartActionsState<TPrompt, TTask> {
  const handleQuickStartPress = useCallback((item: ChatConversationHomeQuickStartItem<TPrompt, TTask>) => {
    const pressIntent = getChatRuntimeHomeQuickStartPressIntent(item);
    if (pressIntent.kind === 'add-prompt') {
      openAddPrompt();
      return;
    }
    if (pressIntent.kind === 'run-task') {
      void runPromptTask(pressIntent.task);
      return;
    }

    const trimmed = pressIntent.content.trim();
    if (!trimmed) return;

    setComposerInput((currentValue) => {
      const existing = currentValue.trim();
      return existing.length > 0 ? `${existing}\n\n${trimmed}` : trimmed;
    });
    focusComposerInput();
  }, [
    focusComposerInput,
    openAddPrompt,
    runPromptTask,
    setComposerInput,
  ]);

  return {
    handleQuickStartPress,
  };
}

type ChatConversationHomeQuickStartsStyles =
  SharedChatConversationHomeQuickStartsStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>
  >;

type ChatConversationHomeQuickStartsProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = {
  shouldRender: boolean;
  items: readonly ChatConversationHomeQuickStartItem<TPrompt, TTask>[];
  isLoading: boolean;
  runningTaskId?: string | null;
  onPress: (item: ChatConversationHomeQuickStartItem<TPrompt, TTask>) => void;
  onEditPrompt: (prompt: TPrompt) => void;
  onDeletePrompt: (prompt: TPrompt) => void;
  shortcutRenderState: PromptLibraryMobileShortcutRenderState;
  styles: ChatConversationHomeQuickStartsStyles;
};

type ChatConversationHomeQuickStartsParts<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = ChatRuntimeHomeQuickStartsMobilePropsParts<
  TPrompt,
  TTask,
  GestureResponderEvent,
  ChatConversationHomeQuickStartsStyles
>;

type ChatConversationHomeQuickStartsItemPart<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = ChatConversationHomeQuickStartsParts<
  TPrompt,
  TTask
>['grid']['content']['items'][number];

type ChatConversationHomeQuickStartActionsPart<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = ChatConversationHomeQuickStartsItemPart<TPrompt, TTask>['actions'];

type ChatConversationHomeQuickStartVisibleActionsPart<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = Extract<
  ChatConversationHomeQuickStartActionsPart<TPrompt, TTask>,
  { shouldRender: true }
>;

type ChatConversationHomeQuickStartsContainerProps<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = {
  container: ChatConversationHomeQuickStartsParts<TPrompt, TTask>['container'];
  children: ReactNode;
};

type ChatConversationHomeQuickStartLeadingAccessoryProps<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = Pick<
  ChatConversationHomeQuickStartsItemPart<TPrompt, TTask>,
  'sourcePill' | 'addIcon'
>;

type ChatConversationHomeQuickStartTextContentProps<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = Pick<
  ChatConversationHomeQuickStartsItemPart<TPrompt, TTask>,
  'title' | 'description'
>;

type ChatConversationHomeQuickStartActionButtonProps<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = Omit<
  ChatConversationHomeQuickStartVisibleActionsPart<TPrompt, TTask>['edit'],
  'prompt'
>;

type ChatConversationHomeQuickStartActionsProps<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = {
  actions: ChatConversationHomeQuickStartActionsPart<TPrompt, TTask>;
};

type ChatConversationHomeQuickStartsEmptyStateProps<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = {
  emptyState: ChatConversationHomeQuickStartsParts<TPrompt, TTask>['emptyState'];
};

type ChatConversationHomeQuickStartCardProps<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = Pick<
  ChatConversationHomeQuickStartsItemPart<TPrompt, TTask>,
  | 'pressable'
  | 'sourcePill'
  | 'addIcon'
  | 'title'
  | 'description'
  | 'actions'
>;

type ChatConversationHomeQuickStartsGridProps<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = {
  grid: ChatConversationHomeQuickStartsParts<TPrompt, TTask>['grid'];
};

type ChatConversationHomeQuickStartsContentProps<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = Pick<
  ChatConversationHomeQuickStartsParts<TPrompt, TTask>,
  'grid' | 'emptyState'
>;

type ChatConversationHomePromptEditorModalStyles =
  SharedChatConversationHomePromptEditorModalStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatConversationHomePromptEditorModalProps = {
  visible: boolean;
  isEditing: boolean;
  nameValue: string;
  onNameChange: (value: string) => void;
  contentValue: string;
  onContentChange: (value: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  renderState: PromptLibraryEditorMobileRenderState;
  styles: ChatConversationHomePromptEditorModalStyles;
};

type ChatConversationHomePromptEditorModalParts =
  ChatConversationHomePromptEditorModalMobilePropsParts<ChatConversationHomePromptEditorModalStyles>;

type ChatConversationHomePromptEditorModalModalPart = {
  props: ComponentProps<typeof Modal>;
};

type ChatConversationHomePromptEditorModalKeyboardAvoidingViewPart = {
  props: ComponentProps<typeof KeyboardAvoidingView>;
};

type ChatConversationHomePromptEditorModalViewPart = {
  props: ComponentProps<typeof View>;
};

type ChatConversationHomePromptEditorModalTouchablePart = {
  props: ComponentProps<typeof TouchableOpacity>;
};

type ChatConversationHomePromptEditorModalIconPart = {
  props: ComponentProps<typeof Ionicons>;
};

type ChatConversationHomePromptEditorModalTextPart = {
  text: string;
  props: ComponentProps<typeof Text>;
};

type ChatConversationHomePromptEditorModalInputPart = {
  props: ComponentProps<typeof TextInput>;
};

type ChatConversationHomePromptEditorModalFrameProps = {
  modal: ChatConversationHomePromptEditorModalModalPart;
  keyboardAvoidingView: ChatConversationHomePromptEditorModalKeyboardAvoidingViewPart;
  overlay: ChatConversationHomePromptEditorModalViewPart;
  content: ChatConversationHomePromptEditorModalViewPart;
  children: ReactNode;
};

type ChatConversationHomePromptEditorModalIconButtonProps = {
  button: ChatConversationHomePromptEditorModalTouchablePart;
  icon: ChatConversationHomePromptEditorModalIconPart;
};

type ChatConversationHomePromptEditorModalHeaderProps = {
  header: ChatConversationHomePromptEditorModalViewPart;
  title: ChatConversationHomePromptEditorModalTextPart;
  closeButton: ChatConversationHomePromptEditorModalTouchablePart;
  closeIcon: ChatConversationHomePromptEditorModalIconPart;
};

type ChatConversationHomePromptEditorModalFieldProps = {
  label: ChatConversationHomePromptEditorModalTextPart;
  input: ChatConversationHomePromptEditorModalInputPart;
};

type ChatConversationHomePromptEditorModalActionButtonProps = {
  button: ChatConversationHomePromptEditorModalTouchablePart;
  label: ChatConversationHomePromptEditorModalTextPart;
};

type ChatConversationHomePromptEditorModalActionsProps = {
  actions: ChatConversationHomePromptEditorModalViewPart;
  cancelButton: ChatConversationHomePromptEditorModalTouchablePart;
  cancelLabel: ChatConversationHomePromptEditorModalTextPart;
  saveButton: ChatConversationHomePromptEditorModalTouchablePart;
  saveLabel: ChatConversationHomePromptEditorModalTextPart;
};

type ChatConversationHomePromptEditorModalBodyProps =
  ChatConversationHomePromptEditorModalHeaderProps &
  ChatConversationHomePromptEditorModalActionsProps & {
    nameLabel: ChatConversationHomePromptEditorModalTextPart;
    nameInput: ChatConversationHomePromptEditorModalInputPart;
    contentLabel: ChatConversationHomePromptEditorModalTextPart;
    contentInput: ChatConversationHomePromptEditorModalInputPart;
  };

type ChatMessageRuntimeOverlaysProps = {
  agentSelector: ComponentProps<typeof AgentSelectorSheet>;
  promptEditor: ChatConversationHomePromptEditorModalProps;
};

type ChatMessageTurnDurationBadgeRenderState =
  ChatRuntimeTurnDurationMessageMobileRenderState;

type ChatMessageTurnDurationBadgeProps =
  ChatRuntimeTurnDurationBadgeMobilePropsPartsInput<
    ChatMessageTurnDurationBadgeRenderState,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle> | undefined,
    StyleProp<TextStyle>,
    StyleProp<TextStyle> | undefined
  >;

type ChatMessageTurnDurationBadgeParts =
  ChatRuntimeTurnDurationBadgeMobilePropsParts<
    ChatMessageTurnDurationBadgeRenderState,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle> | undefined,
    StyleProp<TextStyle>,
    StyleProp<TextStyle> | undefined
  >;

type ChatMessageTurnDurationBadgeIconProps = {
  name: IoniconName;
  size: number;
  color: string;
};

type ChatMessageTurnDurationBadgeLabelProps = {
  text: string;
  props: {
    style: [
      StyleProp<TextStyle>,
      false | StyleProp<TextStyle> | undefined
    ];
    numberOfLines: TextProps['numberOfLines'];
  };
};

type ChatMessageTurnDurationBadgeContainerContentProps = {
  icon: {
    props: ChatMessageTurnDurationBadgeIconProps;
  };
  label: {
    props: ChatMessageTurnDurationBadgeLabelProps;
  };
};

type ChatMessageTurnDurationBadgeContainerProps = {
  children: ReactNode;
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  style: [
    StyleProp<ViewStyle>,
    false | StyleProp<ViewStyle> | undefined
  ];
};

type ChatMessageActionSlotListProps =
  ChatRuntimeMessageActionSlotListMobilePropsPartsInput<
    ChatMessageActionEntry,
    StyleProp<ViewStyle>
  >;

type ChatMessageActionSlotListParts =
  ChatRuntimeMessageActionSlotListMobilePropsParts<
    ChatMessageActionEntry,
    StyleProp<ViewStyle>
  >;

type ChatMessageActionSlotListRowProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
};

type ChatMessageStandaloneActionsProps =
  ChatRuntimeMessageStandaloneActionsMobilePropsPartsInput<
    ChatMessageActionEntry,
    StyleProp<ViewStyle>
  >;

type ChatMessageStandaloneActionsParts =
  ChatRuntimeMessageStandaloneActionsMobilePropsParts<
    ChatMessageActionEntry,
    StyleProp<ViewStyle>
  >;

type ChatMessageRetryStatusStyles =
  SharedChatMessageRetryStatusStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageRetryStatusProps =
  ChatRuntimeRetryStatusMobilePropsPartsInput<
    ChatRuntimeRetryStatusMobileRenderState,
    ChatMessageRetryStatusStyles
  >;

type ChatMessageRetryStatusPropsInput = ChatRuntimeConversationRetryStatusMobileState;

type ChatMessageRetryStatusParts =
  ChatRuntimeRetryStatusMobilePropsParts<
    ChatRuntimeRetryStatusMobileRenderState,
    ChatMessageRetryStatusStyles
  >;

type ChatMessageRetryStatusCardProps = {
  children: ReactNode;
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  style: StyleProp<ViewStyle>;
};

type ChatMessageRetryStatusViewProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
};

type ChatMessageRetryStatusIconProps = {
  name: IoniconName;
  size: number;
  color: string;
};

type ChatMessageRetryStatusTitleProps = {
  text: string;
  style: StyleProp<TextStyle>;
  numberOfLines: number;
};

type ChatMessageRetryStatusSpinnerProps = {
  size: ComponentProps<typeof ActivityIndicator>['size'];
  color: string;
};

type ChatMessageRetryStatusTextProps = {
  text: string;
  style: StyleProp<TextStyle>;
};

type ChatMessageRetryStatusTextPart = {
  props: ChatMessageRetryStatusTextProps;
};

type ChatMessageRetryStatusHeaderContentProps = {
  icon: {
    props: ChatMessageRetryStatusIconProps;
  };
  title: {
    props: ChatMessageRetryStatusTitleProps;
  };
  spinner: {
    props: ChatMessageRetryStatusSpinnerProps;
  };
};

type ChatMessageRetryStatusHeaderPart = {
  props: Omit<ChatMessageRetryStatusViewProps, 'children'>;
  content: ChatMessageRetryStatusHeaderContentProps;
};

type ChatMessageRetryStatusHeaderProps = {
  header: ChatMessageRetryStatusHeaderPart;
};

type ChatMessageRetryStatusMetaContentProps = {
  attempt: ChatMessageRetryStatusTextPart;
  countdown: ChatMessageRetryStatusTextPart;
};

type ChatMessageRetryStatusMetaPart = {
  props: Omit<ChatMessageRetryStatusViewProps, 'children'>;
  content: ChatMessageRetryStatusMetaContentProps;
};

type ChatMessageRetryStatusMetaProps = {
  meta: ChatMessageRetryStatusMetaPart;
};

type ChatMessageRetryStatusCardContentProps = {
  header: ChatMessageRetryStatusHeaderPart;
  meta: ChatMessageRetryStatusMetaPart;
  description: ChatMessageRetryStatusTextPart;
};

type ChatMessageToolApprovalStyles =
  SharedChatMessageToolApprovalStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageToolApprovalProps =
  ChatRuntimeToolApprovalMobilePropsPartsInput<
    (event: GestureResponderEvent) => void,
    (event: GestureResponderEvent) => void,
    (event: GestureResponderEvent) => void,
    ChatMessageToolApprovalStyles
  >;

type ChatMessageToolApprovalParts =
  ChatRuntimeToolApprovalMobilePropsParts<
    (event: GestureResponderEvent) => void,
    (event: GestureResponderEvent) => void,
    (event: GestureResponderEvent) => void,
    ChatMessageToolApprovalStyles
  >;

type ChatMessageToolApprovalViewProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle> | Array<StyleProp<ViewStyle> | false>;
};

type ChatMessageToolApprovalIconProps = ComponentProps<typeof Ionicons>;

type ChatMessageToolApprovalArgumentsToggleProps =
  Omit<ComponentProps<typeof Pressable>, 'children'> & {
    children: ReactNode;
  };

type ChatMessageToolApprovalTextProps = {
  props: {
    style: StyleProp<TextStyle>;
    numberOfLines?: TextProps['numberOfLines'];
  };
  text: string;
};

type ChatMessageToolApprovalViewPart = {
  props: Omit<ChatMessageToolApprovalViewProps, 'children'>;
};

type ChatMessageToolApprovalIconPart = {
  props: ChatMessageToolApprovalIconProps;
};

type ChatMessageToolApprovalSpinnerPart = {
  shouldRender: boolean;
  props: ChatMessageToolApprovalSpinnerProps;
};

type ChatMessageToolApprovalTextPart = {
  props: ChatMessageToolApprovalTextProps;
};

type ChatMessageToolApprovalConditionalTextPart =
  ChatMessageToolApprovalTextPart & {
    shouldRender: boolean;
  };

type ChatMessageToolApprovalArgumentsToggleContentPart = {
  icon: ChatMessageToolApprovalIconPart;
  label: ChatMessageToolApprovalTextPart;
};

type ChatMessageToolApprovalArgumentsTogglePart = {
  props: Omit<ChatMessageToolApprovalArgumentsToggleProps, 'children'>;
  content: ChatMessageToolApprovalArgumentsToggleContentPart;
};

type ChatMessageToolApprovalFullArgumentsPart = {
  shouldRender: boolean;
  scroll: {
    props: Omit<ChatMessageToolApprovalFullArgumentsScrollProps, 'children'>;
  };
  text: ChatMessageToolApprovalTextPart;
};

type ChatMessageToolApprovalActionsPart = {
  props: Omit<ChatMessageToolApprovalActionsProps, 'children'>;
};

type ChatMessageToolApprovalDenyActionContentPart = {
  icon: ChatMessageToolApprovalIconPart;
  label: ChatMessageToolApprovalTextPart;
};

type ChatMessageToolApprovalApproveActionContentPart = {
  icon: ChatMessageToolApprovalIconPart & {
    shouldRender: boolean;
  };
  spinner: ChatMessageToolApprovalSpinnerPart;
  label: ChatMessageToolApprovalTextPart;
};

type ChatMessageToolApprovalActionButtonPart<TContent> = {
  props: Omit<ChatMessageToolApprovalActionButtonProps, 'children'>;
  content: TContent;
};

type ChatMessageToolApprovalHeaderProps = {
  header: ChatMessageToolApprovalViewPart;
  icon: ChatMessageToolApprovalIconPart;
  title: ChatMessageToolApprovalTextPart;
  spinner: ChatMessageToolApprovalSpinnerPart;
};

type ChatMessageToolApprovalContentProps = {
  content: ChatMessageToolApprovalViewPart;
  toolRow: ChatMessageToolApprovalViewPart;
  toolLabel: ChatMessageToolApprovalTextPart;
  toolName: ChatMessageToolApprovalTextPart;
  argumentsPreview: ChatMessageToolApprovalConditionalTextPart;
  argumentsToggle: ChatMessageToolApprovalArgumentsTogglePart;
  fullArguments: ChatMessageToolApprovalFullArgumentsPart;
  actions: ChatMessageToolApprovalActionsPart;
  denyButton: ChatMessageToolApprovalActionButtonPart<ChatMessageToolApprovalDenyActionContentPart>;
  approveButton: ChatMessageToolApprovalActionButtonPart<ChatMessageToolApprovalApproveActionContentPart>;
};

type ChatMessageToolApprovalToolRowProps = {
  row: ChatMessageToolApprovalViewPart;
  label: ChatMessageToolApprovalTextPart;
  name: ChatMessageToolApprovalTextPart;
};

type ChatMessageToolApprovalArgumentsToggleContentProps = {
  content: ChatMessageToolApprovalArgumentsToggleContentPart;
};

type ChatMessageToolApprovalArgumentsToggleBlockProps = {
  argumentsToggle: ChatMessageToolApprovalArgumentsTogglePart;
};

type ChatMessageToolApprovalArgumentsToggleLabelProps =
  ChatMessageToolApprovalTextProps;

type ChatMessageToolApprovalActionLabelProps =
  ChatMessageToolApprovalTextProps;

type ChatMessageToolApprovalSpinnerProps = ComponentProps<typeof ActivityIndicator>;

type ChatMessageToolApprovalTitleProps =
  ChatMessageToolApprovalTextProps;

type ChatMessageToolApprovalToolLabelProps =
  ChatMessageToolApprovalTextProps;

type ChatMessageToolApprovalToolNameProps =
  ChatMessageToolApprovalTextProps;

type ChatMessageToolApprovalArgumentsPreviewProps =
  ChatMessageToolApprovalTextProps;

type ChatMessageToolApprovalArgumentsPreviewBlockProps = {
  preview: ChatMessageToolApprovalConditionalTextPart;
};

type ChatMessageToolApprovalFullArgumentsProps =
  ChatMessageToolApprovalTextProps;

type ChatMessageToolApprovalFullArgumentsBlockProps = {
  fullArguments: ChatMessageToolApprovalFullArgumentsPart;
};

type ChatMessageToolApprovalFullArgumentsScrollProps =
  Omit<ComponentProps<typeof ScrollView>, 'children'> & {
    children: ReactNode;
  };

type ChatMessageToolApprovalActionsProps = {
  style: StyleProp<ViewStyle>;
  children: ReactNode;
};

type ChatMessageToolApprovalActionBarProps = {
  actions: ChatMessageToolApprovalActionsPart;
  denyButton: ChatMessageToolApprovalActionButtonPart<ChatMessageToolApprovalDenyActionContentPart>;
  approveButton: ChatMessageToolApprovalActionButtonPart<ChatMessageToolApprovalApproveActionContentPart>;
};

type ChatMessageToolApprovalActionButtonProps = {
  children: ReactNode;
} & Omit<ComponentProps<typeof TouchableOpacity>, 'children'>;

type ChatMessageToolApprovalDenyActionContentProps = {
  content: ChatMessageToolApprovalDenyActionContentPart;
};

type ChatMessageToolApprovalApproveActionContentProps = {
  content: ChatMessageToolApprovalApproveActionContentPart;
};

type ChatMessageToolApprovalPropsInput = ChatRuntimeConversationToolApprovalMobileState;

type ChatMessageDelegationCardStyles =
  SharedChatMessageDelegationCardStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageDelegationCardProps =
  ChatRuntimeDelegationCardMobilePropsPartsInput<
    (event: GestureResponderEvent) => void,
    (event: GestureResponderEvent) => void,
    ChatMessageDelegationCardStyles
  >;

type ChatMessageDelegationCardPropsInput =
  ChatRuntimeConversationDelegationCardMobileState<ACPDelegationProgress | null | undefined>;

type ChatMessageDelegationCardParts =
  ChatRuntimeDelegationCardMobilePropsParts<
    ((event: GestureResponderEvent) => void),
    ((event: GestureResponderEvent) => void),
    ChatMessageDelegationCardStyles
  >;

type ChatMessageDelegationContentProps = {
  header: {
    props: ChatMessageDelegationHeaderProps;
  };
  subtitle: ChatMessageDelegationSubtitleSlot;
  meta: {
    props: ChatMessageDelegationMetaRowProps;
  };
  conversationPreview: ChatMessageDelegationConversationPreviewSlot;
  toolPreview: ChatMessageDelegationToolPreviewSlot;
};

type ChatMessageDelegationHeaderProps = {
  container: {
    props: {
      style: ChatMessageDelegationCardStyles['header'];
    };
  };
  title: ChatMessageDelegationTitlePart;
  statusBadge: ChatMessageDelegationStatusBadgePart;
  statusText: ChatMessageDelegationStatusTextPart;
  liveText: ChatMessageDelegationLiveTextPart;
};

type ChatMessageDelegationTitlePart = {
  props: {
    style: ChatMessageDelegationCardStyles['title'];
    numberOfLines: number;
  };
  text: string;
};

type ChatMessageDelegationStatusBadgePart = {
  props: {
    style: Array<StyleProp<ViewStyle>>;
  };
};

type ChatMessageDelegationStatusTextPart = {
  props: {
    style: Array<StyleProp<TextStyle>>;
    numberOfLines: number;
  };
  text: string;
};

type ChatMessageDelegationLiveTextPart = {
  shouldRender: boolean;
  props: {
    style: ChatMessageDelegationCardStyles['liveText'];
  };
  text: string;
};

type ChatMessageDelegationTitleProps = {
  title: ChatMessageDelegationTitlePart;
};

type ChatMessageDelegationStatusBadgeProps = {
  badge: ChatMessageDelegationStatusBadgePart;
  text: ChatMessageDelegationStatusTextPart;
};

type ChatMessageDelegationLiveTextProps = {
  liveText: ChatMessageDelegationLiveTextPart;
};

type ChatMessageDelegationSubtitlePart = {
  props: {
    style: ChatMessageDelegationCardStyles['subtitle'];
    numberOfLines: number;
  };
  text: string;
};

type ChatMessageDelegationSubtitleSlot = {
  shouldRender: boolean;
  props: ChatMessageDelegationSubtitlePart;
};

type ChatMessageDelegationSubtitleProps = ChatMessageDelegationSubtitlePart;

type ChatMessageDelegationSubtitleBlockProps = {
  subtitle: ChatMessageDelegationSubtitleSlot;
};

type ChatMessageDelegationMetaItemPart = {
  props: {
    style: ChatMessageDelegationCardStyles['metaText'];
    numberOfLines: number;
  };
  text: string;
};

type ChatMessageDelegationMetaRowItemPart = {
  key: string;
  props: ChatMessageDelegationMetaItemPart;
};

type ChatMessageDelegationMetaRowProps = {
  container: {
    props: {
      style: ChatMessageDelegationCardStyles['metaRow'];
    };
  };
  items: ChatMessageDelegationMetaRowItemPart[];
};

type ChatMessageDelegationMetaItemProps = ChatMessageDelegationMetaItemPart;

type ChatMessageDelegationMorePreviewActionLabelPart<TStyle> = {
  props: {
    style: TStyle;
    numberOfLines: number;
  };
  text: string;
};

type ChatMessageDelegationMorePreviewActionPart<
  TButtonStyle,
  TButtonPressedStyle,
  TLabelStyle,
> = {
  button: {
    props: {
      onPress: (event: GestureResponderEvent) => void;
      accessibilityRole: AccessibilityRole;
      accessibilityLabel: string;
      style: (state: { pressed: boolean }) => Array<TButtonStyle | TButtonPressedStyle | false>;
    };
  };
  label: ChatMessageDelegationMorePreviewActionLabelPart<TLabelStyle>;
};

type ChatMessageDelegationMorePreviewActionSlot<
  TButtonStyle,
  TButtonPressedStyle,
  TLabelStyle,
> =
  | {
      shouldRender: true;
      props: ChatMessageDelegationMorePreviewActionPart<
        TButtonStyle,
        TButtonPressedStyle,
        TLabelStyle
      >;
    }
  | {
      shouldRender: false;
    };

type ChatMessageDelegationConversationMorePreviewActionSlot =
  ChatMessageDelegationMorePreviewActionSlot<
    ChatMessageDelegationCardStyles['conversationPreviewMoreButton'],
    ChatMessageDelegationCardStyles['conversationPreviewMoreButtonPressed'],
    ChatMessageDelegationCardStyles['conversationPreviewMore']
  >;

type ChatMessageDelegationToolMorePreviewActionSlot =
  ChatMessageDelegationMorePreviewActionSlot<
    ChatMessageDelegationCardStyles['toolPreviewMoreButton'],
    ChatMessageDelegationCardStyles['toolPreviewMoreButtonPressed'],
    ChatMessageDelegationCardStyles['toolPreviewMore']
  >;

type ChatMessageDelegationConversationPreviewRolePart = {
  props: {
    style: Array<
      | ChatMessageDelegationCardStyles['conversationPreviewRole']
      | ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots[
        keyof ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots
      ]
    >;
    numberOfLines: number;
    ellipsizeMode: TextProps['ellipsizeMode'];
  };
  text: string;
};

type ChatMessageDelegationConversationPreviewContentPart = {
  props: {
    style: ChatMessageDelegationCardStyles['conversationPreviewContent'];
    numberOfLines: number;
    ellipsizeMode: TextProps['ellipsizeMode'];
  };
  text: string;
};

type ChatMessageDelegationConversationPreviewTimestampPart =
  | {
      shouldRender: true;
      props: {
        style: ChatMessageDelegationCardStyles['conversationPreviewTimestamp'];
        numberOfLines: number;
      };
      text: string;
    }
  | {
      shouldRender: false;
    };

type ChatMessageDelegationConversationPreviewRowProps = {
  line: {
    props: {
      style: ChatMessageDelegationCardStyles['conversationPreviewLine'];
    };
  };
  role: ChatMessageDelegationConversationPreviewRolePart;
  content: ChatMessageDelegationConversationPreviewContentPart;
  timestamp: ChatMessageDelegationConversationPreviewTimestampPart;
};

type ChatMessageDelegationConversationPreviewRowPart = {
  key: string;
  props: ChatMessageDelegationConversationPreviewRowProps;
};

type ChatMessageDelegationConversationPreviewBodyProps = {
  rows: ChatMessageDelegationConversationPreviewRowPart[];
  moreAction: ChatMessageDelegationConversationMorePreviewActionSlot;
};

type ChatMessageDelegationConversationPreviewProps = {
  container: {
    props: {
      style: ChatMessageDelegationCardStyles['conversationPreview'];
    };
    content: ChatMessageDelegationConversationPreviewBodyProps;
  };
};

type ChatMessageDelegationConversationPreviewSlot = {
  shouldRender: boolean;
  props: ChatMessageDelegationConversationPreviewProps;
};

type ChatMessageDelegationConversationPreviewBlockProps = {
  conversationPreview: ChatMessageDelegationConversationPreviewSlot;
};

type ChatMessageDelegationConversationPreviewRoleProps =
  ChatMessageDelegationConversationPreviewRolePart;

type ChatMessageDelegationConversationPreviewContentProps =
  ChatMessageDelegationConversationPreviewContentPart;

type ChatMessageDelegationConversationPreviewTimestampProps = {
  timestamp: ChatMessageDelegationConversationPreviewTimestampPart;
};

type ChatMessageDelegationToolPreviewLabelPart = {
  props: {
    style: ChatMessageDelegationCardStyles['toolPreviewLabel'];
    numberOfLines: number;
  };
  text: string;
};

type ChatMessageDelegationToolPreviewStatusIconSpinnerPart = {
  shouldRender: boolean;
  props: {
    size: ComponentProps<typeof ActivityIndicator>['size'];
    color: string;
  };
};

type ChatMessageDelegationToolPreviewStatusIconGlyphPart = {
  shouldRender: boolean;
  props: {
    state: string;
    name: IoniconName;
    size: number;
    color: string;
  };
};

type ChatMessageDelegationToolPreviewStatusIconPart = {
  props: {
    style: ChatMessageDelegationCardStyles['toolPreviewStatusIcon'];
    accessibilityElementsHidden: true;
    importantForAccessibility: 'no-hide-descendants';
  };
  spinner: ChatMessageDelegationToolPreviewStatusIconSpinnerPart;
  icon: ChatMessageDelegationToolPreviewStatusIconGlyphPart;
};

type ChatMessageDelegationToolPreviewNamePart = {
  props: {
    style: Array<
      | ChatMessageDelegationCardStyles['toolPreviewName']
      | ChatMessageDelegationCardStyles['toolPreviewNamePending']
      | ChatMessageDelegationCardStyles['toolPreviewNameSuccess']
      | ChatMessageDelegationCardStyles['toolPreviewNameError']
      | false
    >;
    numberOfLines: number;
    ellipsizeMode: TextProps['ellipsizeMode'];
  };
  text: string;
};

type ChatMessageDelegationToolPreviewRowProps = {
  line: {
    props: {
      style: ChatMessageDelegationCardStyles['toolPreviewLine'];
      accessibilityLabel: string;
    };
  };
  statusIcon: ChatMessageDelegationToolPreviewStatusIconPart;
  name: ChatMessageDelegationToolPreviewNamePart;
};

type ChatMessageDelegationToolPreviewRowPart = {
  key: string;
  props: ChatMessageDelegationToolPreviewRowProps;
};

type ChatMessageDelegationToolPreviewBodyProps = {
  label: {
    props: ChatMessageDelegationToolPreviewLabelPart;
  };
  rows: ChatMessageDelegationToolPreviewRowPart[];
  moreAction: ChatMessageDelegationToolMorePreviewActionSlot;
};

type ChatMessageDelegationToolPreviewProps = {
  container: {
    props: {
      style: ChatMessageDelegationCardStyles['toolPreview'];
    };
    content: ChatMessageDelegationToolPreviewBodyProps;
  };
};

type ChatMessageDelegationToolPreviewSlot = {
  shouldRender: boolean;
  props: ChatMessageDelegationToolPreviewProps;
};

type ChatMessageDelegationToolPreviewBlockProps = {
  toolPreview: ChatMessageDelegationToolPreviewSlot;
};

type ChatMessageDelegationToolPreviewStatusIconProps = {
  statusIcon: ChatMessageDelegationToolPreviewStatusIconPart;
};

type ChatMessageDelegationToolPreviewNameProps =
  ChatMessageDelegationToolPreviewNamePart;

type ChatMessageDelegationToolPreviewLabelProps =
  ChatMessageDelegationToolPreviewLabelPart;

type ChatMessageDelegationMorePreviewActionBlockProps = {
  moreAction:
    | ChatMessageDelegationConversationMorePreviewActionSlot
    | ChatMessageDelegationToolMorePreviewActionSlot;
};

type ChatMessageDelegationMorePreviewActionProps =
  | ChatMessageDelegationMorePreviewActionPart<
      ChatMessageDelegationCardStyles['conversationPreviewMoreButton'],
      ChatMessageDelegationCardStyles['conversationPreviewMoreButtonPressed'],
      ChatMessageDelegationCardStyles['conversationPreviewMore']
    >
  | ChatMessageDelegationMorePreviewActionPart<
      ChatMessageDelegationCardStyles['toolPreviewMoreButton'],
      ChatMessageDelegationCardStyles['toolPreviewMoreButtonPressed'],
      ChatMessageDelegationCardStyles['toolPreviewMore']
    >;

type ChatMessageDelegationMorePreviewActionLabelProps =
  | ChatMessageDelegationMorePreviewActionLabelPart<
      ChatMessageDelegationCardStyles['conversationPreviewMore']
    >
  | ChatMessageDelegationMorePreviewActionLabelPart<
      ChatMessageDelegationCardStyles['toolPreviewMore']
    >;

type ChatMessageToolActivityGroupToggleStyles =
  SharedChatMessageToolActivityGroupToggleStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageToolActivityGroupToggleProps =
  ChatRuntimeToolActivityGroupToggleMobilePropsPartsInput<
    ToolActivityGroupMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolActivityGroupToggleStyles
  >;

type ChatMessageToolActivityGroupToggleParts =
  ChatRuntimeToolActivityGroupToggleMobilePropsParts<
    ToolActivityGroupMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolActivityGroupToggleStyles
  >;

type ChatMessageToolActivityGroupIconProps = ComponentProps<typeof Ionicons>;

type ChatMessageToolActivityGroupTextPart = {
  props: {
    style: StyleProp<TextStyle>;
    numberOfLines?: TextProps['numberOfLines'];
    ellipsizeMode?: TextProps['ellipsizeMode'];
  };
  text: ReactNode;
};

type ChatMessageToolActivityGroupIconPart = {
  props: ChatMessageToolActivityGroupIconProps;
};

type ChatMessageToolActivityGroupCountBadgePart = {
  shouldRender: boolean;
  props: ChatMessageToolActivityGroupCountBadgeProps;
};

type ChatMessageToolActivityGroupToggleHeaderContentProps = {
  leadingIcon: ChatMessageToolActivityGroupIconPart;
  countBadge: ChatMessageToolActivityGroupCountBadgePart;
  preview: {
    props: ChatMessageToolActivityGroupPreviewLineProps;
  };
  toggleIcon: ChatMessageToolActivityGroupIconPart;
};

type ChatMessageToolActivityGroupToggleHeaderRowProps = {
  props: {
    style: StyleProp<ViewStyle>;
  };
  content: ChatMessageToolActivityGroupToggleHeaderContentProps;
};

type ChatMessageToolActivityGroupOptionalCountBadgeProps = {
  countBadge: ChatMessageToolActivityGroupCountBadgePart;
};

type ChatMessageToolActivityGroupCountBadgeProps = {
  container: {
    props: {
      accessibilityLabel: string;
      style: StyleProp<ViewStyle>;
    };
  };
  label: ChatMessageToolActivityGroupTextPart;
};

type ChatMessageToolActivityGroupPreviewLineProps =
  ChatMessageToolActivityGroupTextPart;

type ChatMessageToolActivityGroupFooterStyles =
  SharedChatMessageToolActivityGroupFooterStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageToolActivityGroupFooterProps =
  ChatRuntimeToolActivityGroupFooterMobilePropsPartsInput<
    ToolActivityGroupMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolActivityGroupFooterStyles
  >;

type ChatMessageToolActivityGroupFooterParts =
  ChatRuntimeToolActivityGroupFooterMobilePropsParts<
    ToolActivityGroupMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolActivityGroupFooterStyles
  >;

type ChatMessageToolActivityGroupFooterContentProps = {
  icon: ChatMessageToolActivityGroupIconPart;
  label: {
    props: ChatMessageToolActivityGroupFooterLabelProps;
  };
};

type ChatMessageToolActivityGroupFooterLabelProps =
  ChatMessageToolActivityGroupTextPart;

type ChatMessageToolActivityGroupBoundaryKind = ChatRuntimeToolActivityGroupBoundaryMobileKind;

type ChatMessageToolActivityGroupBoundaryStyles =
  SharedChatMessageToolActivityGroupBoundaryStyleSlots<
    ChatMessageToolActivityGroupToggleStyles,
    ChatMessageToolActivityGroupFooterStyles
  >;

type ChatMessageToolActivityGroupBoundaryProps =
  ChatRuntimeToolActivityGroupBoundaryMobilePropsPartsInput<
    ToolActivityGroupMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolActivityGroupToggleStyles,
    ChatMessageToolActivityGroupFooterStyles
  >;

type ChatMessageToolActivityGroupBoundaryParts =
  ChatRuntimeToolActivityGroupBoundaryMobilePropsParts<
    ToolActivityGroupMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolActivityGroupToggleStyles,
    ChatMessageToolActivityGroupFooterStyles
  >;

type ChatMessageToolExecutionCompactRowStyles =
  SharedChatMessageToolExecutionCompactRowStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatMessageToolExecutionCompactRowProps =
  ChatRuntimeToolExecutionCompactRowMobilePropsPartsInput<
    ToolExecutionCompactMobileRenderState,
    ChatMessageToolExecutionCompactRowStyles
  >;

type ChatMessageToolExecutionCompactRowParts =
  ChatRuntimeToolExecutionCompactRowMobilePropsParts<
    ToolExecutionCompactMobileRenderState,
    ChatMessageToolExecutionCompactRowStyles
  >;

type ChatMessageToolExecutionCompactRowContainerProps = {
  style: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  children: ReactNode;
};

type ChatMessageToolExecutionCompactRowIconProps =
  ComponentProps<typeof Ionicons> & {
    state?: string;
  };

type ChatMessageToolExecutionCompactRowIconPart = {
  props: ChatMessageToolExecutionCompactRowIconProps;
};

type ChatMessageToolExecutionCompactRowIconSlotPart = {
  container: {
    props: Omit<ChatMessageToolExecutionCompactRowIconCellProps, 'children'>;
  };
  icon: ChatMessageToolExecutionCompactRowIconPart;
};

type ChatMessageToolExecutionCompactRowTextPart = {
  props: {
    style: Array<
      | ChatMessageToolExecutionCompactRowStyles['name']
      | ChatMessageToolExecutionCompactRowStyles['namePending']
      | ChatMessageToolExecutionCompactRowStyles['nameSuccess']
      | ChatMessageToolExecutionCompactRowStyles['nameError']
      | false
    >;
    numberOfLines: TextProps['numberOfLines'];
    ellipsizeMode: TextProps['ellipsizeMode'];
  };
  text: string;
};

type ChatMessageToolExecutionCompactRowStatusIndicatorIconPart =
  ChatMessageToolExecutionCompactRowIconPart & {
    shouldRender: boolean;
  };

type ChatMessageToolExecutionCompactRowStatusIndicatorSpinnerPart = {
  shouldRender: boolean;
  props: ChatMessageToolExecutionCompactRowSpinnerProps;
};

type ChatMessageToolExecutionCompactRowStatusIndicatorPart = {
  container: {
    props: Omit<ChatMessageToolExecutionCompactRowStatusIndicatorProps, 'children'>;
  };
  spinner: ChatMessageToolExecutionCompactRowStatusIndicatorSpinnerPart;
  icon: ChatMessageToolExecutionCompactRowStatusIndicatorIconPart;
};

type ChatMessageToolExecutionCompactRowContentProps = {
  leadingIcon: ChatMessageToolExecutionCompactRowIconSlotPart;
  name: {
    props: ChatMessageToolExecutionCompactRowNameProps;
  };
  statusIndicator: ChatMessageToolExecutionCompactRowStatusIndicatorPart;
  toggleIcon: ChatMessageToolExecutionCompactRowIconSlotPart;
};

type ChatMessageToolExecutionCompactRowIconSlotProps = {
  slot: ChatMessageToolExecutionCompactRowIconSlotPart;
};

type ChatMessageToolExecutionCompactRowIconCellProps = {
  style: StyleProp<ViewStyle>;
  children: ReactNode;
};

type ChatMessageToolExecutionCompactRowNameProps =
  ChatMessageToolExecutionCompactRowTextPart;

type ChatMessageToolExecutionCompactRowStatusIndicatorProps = {
  style: StyleProp<ViewStyle>;
  children: ReactNode;
};

type ChatMessageToolExecutionCompactRowStatusIndicatorBlockProps = {
  statusIndicator: ChatMessageToolExecutionCompactRowStatusIndicatorPart;
};

type ChatMessageToolExecutionCompactRowStatusIndicatorContentProps = {
  spinner: ChatMessageToolExecutionCompactRowStatusIndicatorSpinnerPart;
  icon: ChatMessageToolExecutionCompactRowStatusIndicatorIconPart;
};

type ChatMessageToolExecutionCompactRowSpinnerProps =
  ComponentProps<typeof ActivityIndicator>;

type ChatMessageToolExecutionCompactListRow = {
  key: string;
  renderState: ToolExecutionCompactMobileRenderState;
};

type ChatMessageToolExecutionCompactGroupStyles =
  SharedChatMessageToolExecutionCompactGroupStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatMessageToolExecutionCompactGroupProps =
  ChatRuntimeToolExecutionCompactGroupMobilePropsPartsInput<
    ToolExecutionDetailMobileExpandControlRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionCompactGroupStyles
  > & {
  children: ReactNode;
  };

type ChatMessageToolExecutionCompactGroupParts =
  ChatRuntimeToolExecutionCompactGroupMobilePropsParts<
    ToolExecutionDetailMobileExpandControlRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionCompactGroupStyles
  >;

type ChatMessageToolExecutionCompactGroupPressableState = {
  pressed: boolean;
};

type ChatMessageToolExecutionCompactGroupPressableProps = {
  children: ReactNode;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  accessibilityRole: ToolExecutionDetailMobileExpandControlRenderState['accessibilityRole'];
  accessibilityLabel: string;
  accessibilityHint: string;
  accessibilityState: ToolExecutionDetailMobileExpandControlRenderState['accessibilityState'];
  'aria-expanded': ToolExecutionDetailMobileExpandControlRenderState['ariaExpanded'];
  style: (state: ChatMessageToolExecutionCompactGroupPressableState) => Array<
    | ChatMessageToolExecutionCompactGroupStyles['container']
    | ChatMessageToolExecutionCompactGroupStyles['pressed']
    | false
  >;
};

type ChatMessageToolExecutionCompactListProps =
  ChatRuntimeToolExecutionCompactListMobilePropsPartsInput<
    ToolExecutionDetailMobileExpandControlRenderState,
    ChatMessageToolExecutionCompactListRow,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionCompactGroupStyles,
    ChatMessageToolExecutionCompactRowStyles
  >;

type ChatMessageToolExecutionCompactListParts =
  ChatRuntimeToolExecutionCompactListMobilePropsParts<
    ToolExecutionDetailMobileExpandControlRenderState,
    ChatMessageToolExecutionCompactListRow,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionCompactGroupStyles,
    ChatMessageToolExecutionCompactRowStyles
  >;

type ChatMessageToolExecutionCompactListRowPart = {
  key: ChatMessageToolExecutionCompactListRow['key'];
  props: ChatMessageToolExecutionCompactRowProps;
};

type ChatMessageToolExecutionCompactListContentProps = {
  rows: ChatMessageToolExecutionCompactListRowPart[];
};

type ChatMessageToolExecutionCollapseControlStyles =
  SharedChatMessageToolExecutionCollapseControlStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageToolExecutionCollapseControlProps =
  ChatRuntimeToolExecutionCollapseControlMobilePropsPartsInput<
    ToolExecutionDetailMobileCollapseControlRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionCollapseControlStyles
  >;

type ChatMessageToolExecutionCollapseControlParts =
  ChatRuntimeToolExecutionCollapseControlMobilePropsParts<
    ToolExecutionDetailMobileCollapseControlRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionCollapseControlStyles
  >;

type ChatMessageToolExecutionCollapseControlPressableState = {
  pressed: boolean;
};

type ChatMessageToolExecutionCollapseControlPressableProps = {
  children: ReactNode;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  accessibilityRole: ToolExecutionDetailMobileCollapseControlRenderState['accessibilityRole'];
  accessibilityLabel: string;
  accessibilityHint: string;
  style: (state: ChatMessageToolExecutionCollapseControlPressableState) => Array<
    | ChatMessageToolExecutionCollapseControlStyles['button']
    | ChatMessageToolExecutionCollapseControlStyles['pressed']
    | ChatMessageToolExecutionCollapseControlStyles['placement']
    | false
    | undefined
  >;
};

type ChatMessageToolExecutionCollapseControlIconProps =
  ComponentProps<typeof Ionicons>;

type ChatMessageToolExecutionCollapseControlIconPart = {
  props: ChatMessageToolExecutionCollapseControlIconProps;
};

type ChatMessageToolExecutionCollapseControlLabelProps = {
  props: {
    style: ChatMessageToolExecutionCollapseControlStyles['text'];
  };
  text: string;
};

type ChatMessageToolExecutionCollapseControlLabelPart = {
  props: ChatMessageToolExecutionCollapseControlLabelProps;
};

type ChatMessageToolExecutionCollapseControlContentProps = {
  icon: ChatMessageToolExecutionCollapseControlIconPart;
  label: ChatMessageToolExecutionCollapseControlLabelPart;
};

type ChatMessageToolExecutionExpandedGroupStyles =
  SharedChatMessageToolExecutionExpandedGroupStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageToolExecutionExpandedGroupProps =
  ChatRuntimeToolExecutionExpandedGroupMobilePropsPartsInput<
    ToolExecutionDetailMobileCollapseControlRenderState,
    ToolExecutionDetailMobileCollapseControlRenderState,
    (event: GestureResponderEvent) => void,
    ReactNode,
    ChatMessageToolExecutionExpandedGroupStyles
  > & {
    children: ReactNode;
  };

type ChatMessageToolExecutionExpandedGroupParts =
  ChatRuntimeToolExecutionExpandedGroupMobilePropsParts<
    ToolExecutionDetailMobileCollapseControlRenderState,
    ToolExecutionDetailMobileCollapseControlRenderState,
    (event: GestureResponderEvent) => void,
    ReactNode,
    ChatMessageToolExecutionExpandedGroupStyles
  >;

type ChatMessageToolExecutionExpandedGroupContainerProps = {
  style: ChatMessageToolExecutionExpandedGroupStyles['container'];
  children: ReactNode;
};

type ChatMessageToolExecutionExpandedGroupCardProps = {
  style: Array<
    | ChatMessageToolExecutionExpandedGroupStyles['card']
    | ChatMessageToolExecutionExpandedGroupStyles['pending']
    | ChatMessageToolExecutionExpandedGroupStyles['success']
    | ChatMessageToolExecutionExpandedGroupStyles['error']
    | false
  >;
  children: ReactNode;
};

type ChatMessageToolExecutionExpandedGroupCardPart = {
  props: Omit<ChatMessageToolExecutionExpandedGroupCardProps, 'children'>;
};

type ChatMessageToolExecutionExpandedGroupCollapseControlPart = {
  props: ChatMessageToolExecutionCollapseControlProps;
};

type ChatMessageToolExecutionExpandedGroupEmptyStatePart =
  | {
      shouldRender: true;
      props: ReactNode;
    }
  | {
      shouldRender: false;
      props: null;
    };

type ChatMessageToolExecutionExpandedGroupContentProps = {
  topCollapseControl: ChatMessageToolExecutionExpandedGroupCollapseControlPart;
  bottomCollapseControl: ChatMessageToolExecutionExpandedGroupCollapseControlPart;
  card: ChatMessageToolExecutionExpandedGroupCardPart;
  emptyState: ChatMessageToolExecutionExpandedGroupEmptyStatePart;
  children: ReactNode;
};

type ChatMessageToolExecutionExpandedGroupEmptyStateBlockProps = {
  emptyState: ChatMessageToolExecutionExpandedGroupEmptyStatePart;
};

type ChatMessageToolExecutionPanelProps =
  ChatRuntimeToolExecutionPanelMobilePropsPartsInput<
    Omit<ChatMessageToolExecutionCompactListProps, 'shouldRender'>,
    Omit<ChatMessageToolExecutionExpandedGroupProps, 'children'>
  > & {
    children: ReactNode;
  };

type ChatMessageToolExecutionPanelParts =
  ChatRuntimeToolExecutionPanelMobilePropsParts<
    Omit<ChatMessageToolExecutionCompactListProps, 'shouldRender'>,
    Omit<ChatMessageToolExecutionExpandedGroupProps, 'children'>
  >;

type ChatMessageToolExecutionPanelCompactListPart = {
  props: Omit<ChatMessageToolExecutionCompactListProps, 'shouldRender'> & {
    shouldRender: boolean;
  };
};

type ChatMessageToolExecutionPanelExpandedGroupPart =
  | {
      shouldRender: true;
      props: Omit<ChatMessageToolExecutionExpandedGroupProps, 'children'>;
    }
  | {
      shouldRender: false;
      props: null;
    };

type ChatMessageToolExecutionPanelContentProps = {
  shouldRender: boolean;
  compactList: ChatMessageToolExecutionPanelCompactListPart;
  expandedGroup: ChatMessageToolExecutionPanelExpandedGroupPart;
  children: ReactNode;
};

type ChatMessageToolExecutionPanelShellParts =
  ChatRuntimeToolExecutionPanelShellMobilePropsParts<
    ReactNode,
    ReactNode
  >;

type ChatMessageToolExecutionPanelShellExpandedGroupPart =
  | {
      shouldRender: true;
      props: ReactNode;
    }
  | {
      shouldRender: false;
      props: null;
    };

type ChatMessageToolExecutionPanelShellContentProps = {
  compactList: ReactNode;
  expandedGroup: ChatMessageToolExecutionPanelShellExpandedGroupPart;
};

type ChatMessageToolExecutionStackStyles =
  SharedChatMessageToolExecutionStackStyleSlots<
    ChatMessageToolExecutionCompactGroupStyles,
    ChatMessageToolExecutionCompactRowStyles,
    ChatMessageToolExecutionExpandedGroupStyles,
    StyleProp<TextStyle>,
    ChatMessageToolExecutionCallDetailStyles
  >;

type ChatMessageToolExecutionStackProps = {
  shouldRender: boolean;
  isExpanded: boolean;
  compact: Omit<ChatMessageToolExecutionCompactListProps, 'shouldRender' | 'groupStyles' | 'rowStyles'>;
  expanded: Omit<ChatMessageToolExecutionExpandedGroupProps, 'children' | 'emptyState' | 'styles'> & {
    emptyState?: {
      shouldRender: boolean;
      renderState: ToolExecutionDetailMobileEmptyStateRenderState;
    } | null;
  };
  detailRows: readonly ChatMessageToolExecutionCallListRow[];
  styles: ChatMessageToolExecutionStackStyles;
};

type ChatMessageToolExecutionStackPropsInput = ChatRuntimeConversationToolExecutionStackMobileState;

type ChatMessageToolExecutionStackPanelParts =
  ChatRuntimeToolExecutionStackPanelMobilePropsParts<
    Omit<ChatMessageToolExecutionCompactListProps, 'shouldRender' | 'groupStyles' | 'rowStyles'>,
    Omit<ChatMessageToolExecutionExpandedGroupProps, 'children' | 'emptyState' | 'styles'> & {
      emptyState?: {
        shouldRender: boolean;
        renderState: ToolExecutionDetailMobileEmptyStateRenderState;
      } | null;
    },
    readonly ChatMessageToolExecutionCallListRow[],
    ChatMessageToolExecutionCompactGroupStyles,
    ChatMessageToolExecutionCompactRowStyles,
    ChatMessageToolExecutionExpandedGroupStyles,
    StyleProp<TextStyle>,
    ChatMessageToolExecutionCallDetailStyles
  >;

type ChatMessageToolExecutionStackContentProps =
  Pick<ChatMessageToolExecutionStackProps, 'shouldRender' | 'isExpanded'>
  & ChatMessageToolExecutionStackPanelParts;

type ChatMessageToolExecutionStackEmptyStateBlockPart =
  | {
      shouldRender: true;
      props: ChatMessageToolExecutionEmptyStateProps;
    }
  | {
      shouldRender: false;
      props: null;
    };

type ChatMessageToolExecutionStackEmptyStateBlockProps = {
  emptyState: ChatMessageToolExecutionStackEmptyStateBlockPart;
};

type ChatMessageToolExecutionCopyButtonStyles =
  SharedChatMessageToolExecutionCopyButtonStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageToolExecutionCopyButtonProps =
  ChatRuntimeToolExecutionCopyButtonMobilePropsPartsInput<
    ToolExecutionDetailMobileCopyButtonRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionCopyButtonStyles
  >;

type ChatMessageToolExecutionCopyButtonParts =
  ChatRuntimeToolExecutionCopyButtonMobilePropsParts<
    ToolExecutionDetailMobileCopyButtonRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionCopyButtonStyles
  >;

type ChatMessageToolExecutionCopyButtonPressableState = {
  pressed: boolean;
};

type ChatMessageToolExecutionCopyButtonPressableProps = {
  children: ReactNode;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  accessibilityRole: ToolExecutionDetailMobileCopyButtonRenderState['accessibilityRole'];
  accessibilityLabel: string;
  style: (state: ChatMessageToolExecutionCopyButtonPressableState) => Array<
    | ChatMessageToolExecutionCopyButtonStyles['button']
    | ChatMessageToolExecutionCopyButtonStyles['pressed']
    | false
  >;
};

type ChatMessageToolExecutionCopyButtonIconProps =
  ComponentProps<typeof Ionicons>;

type ChatMessageToolExecutionCopyButtonIconPart = {
  props: ChatMessageToolExecutionCopyButtonIconProps;
};

type ChatMessageToolExecutionCopyButtonLabelProps = {
  props: {
    style: ChatMessageToolExecutionCopyButtonStyles['text'];
  };
  text: string;
};

type ChatMessageToolExecutionCopyButtonLabelPart = {
  props: ChatMessageToolExecutionCopyButtonLabelProps;
};

type ChatMessageToolExecutionCopyButtonContentProps = {
  icon: ChatMessageToolExecutionCopyButtonIconPart;
  label: ChatMessageToolExecutionCopyButtonLabelPart;
};

type ChatMessageToolExecutionDetailHeaderStyles =
  SharedChatMessageToolExecutionDetailHeaderStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageToolExecutionDetailHeaderProps =
  ChatRuntimeToolExecutionDetailHeaderMobilePropsPartsInput<
    ToolExecutionDetailMobileHeaderRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionDetailHeaderStyles
  >;

type ChatMessageToolExecutionDetailHeaderParts =
  ChatRuntimeToolExecutionDetailHeaderMobilePropsParts<
    ToolExecutionDetailMobileHeaderRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionDetailHeaderStyles
  >;

type ChatMessageToolExecutionDetailHeaderPressableState = {
  pressed: boolean;
};

type ChatMessageToolExecutionDetailHeaderPressableProps = {
  children: ReactNode;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  style: (state: ChatMessageToolExecutionDetailHeaderPressableState) => Array<
    | ChatMessageToolExecutionDetailHeaderStyles['header']
    | ChatMessageToolExecutionDetailHeaderStyles['headerPressed']
    | false
  >;
  accessibilityRole: ToolExecutionDetailMobileHeaderRenderState['accessibilityRole'];
  accessibilityLabel: string;
  accessibilityState: ToolExecutionDetailMobileHeaderRenderState['accessibilityState'];
  'aria-expanded': ToolExecutionDetailMobileHeaderRenderState['ariaExpanded'];
  accessibilityHint: string;
};

type ChatMessageToolExecutionDetailHeaderToolNameProps = {
  props: {
    style: ChatMessageToolExecutionDetailHeaderStyles['toolName'];
  };
  text: string;
};

type ChatMessageToolExecutionDetailHeaderToolNamePart = {
  props: ChatMessageToolExecutionDetailHeaderToolNameProps;
};

type ChatMessageToolExecutionDetailHeaderExpandHintProps = {
  style: ChatMessageToolExecutionDetailHeaderStyles['expandHint'];
  children: ReactNode;
};

type ChatMessageToolExecutionDetailHeaderIconProps =
  ComponentProps<typeof Ionicons>;

type ChatMessageToolExecutionDetailHeaderIconPart = {
  props: ChatMessageToolExecutionDetailHeaderIconProps;
};

type ChatMessageToolExecutionDetailHeaderExpandLabelProps = {
  props: {
    style: ChatMessageToolExecutionDetailHeaderStyles['expandHintText'];
  };
  text: string;
};

type ChatMessageToolExecutionDetailHeaderExpandLabelPart = {
  props: ChatMessageToolExecutionDetailHeaderExpandLabelProps;
};

type ChatMessageToolExecutionDetailHeaderExpandHintContentProps = {
  icon: ChatMessageToolExecutionDetailHeaderIconPart;
  label: ChatMessageToolExecutionDetailHeaderExpandLabelPart;
};

type ChatMessageToolExecutionDetailHeaderExpandHintPart = {
  props: Omit<ChatMessageToolExecutionDetailHeaderExpandHintProps, 'children'>;
  content: ChatMessageToolExecutionDetailHeaderExpandHintContentProps;
};

type ChatMessageToolExecutionDetailHeaderContentProps = {
  toolName: ChatMessageToolExecutionDetailHeaderToolNamePart;
  expandHint: ChatMessageToolExecutionDetailHeaderExpandHintPart;
};

type ChatMessageToolExecutionCallSectionStyles =
  SharedChatMessageToolExecutionCallSectionStyleSlots<
    StyleProp<ViewStyle>,
    ChatMessageToolExecutionDetailHeaderStyles
  >;

type ChatMessageToolExecutionCallSectionProps =
  ChatRuntimeToolExecutionCallSectionMobilePropsPartsInput<
    ToolExecutionDetailMobileHeaderRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionCallSectionStyles
  > & {
    children: ReactNode;
  };

type ChatMessageToolExecutionCallSectionParts =
  ChatRuntimeToolExecutionCallSectionMobilePropsParts<
    ToolExecutionDetailMobileHeaderRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionCallSectionStyles
  >;

type ChatMessageToolExecutionCallSectionContainerProps = {
  style: ChatMessageToolExecutionCallSectionStyles['section'];
  children: ReactNode;
};

type ChatMessageToolExecutionCallSectionHeaderPart = {
  props: ChatMessageToolExecutionDetailHeaderProps;
};

type ChatMessageToolExecutionCallSectionContentProps = {
  header: ChatMessageToolExecutionCallSectionHeaderPart;
  children: ReactNode;
};

type ChatMessageToolExecutionResultBadgeStyles =
  SharedChatMessageToolExecutionResultBadgeStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageToolExecutionResultBadgeProps =
  ChatRuntimeToolExecutionResultBadgeMobilePropsPartsInput<
    ChatMessageToolExecutionResultBadgeRenderState,
    ChatMessageToolExecutionResultBadgeStyles
  >;

type ChatMessageToolExecutionResultBadgeParts =
  ChatRuntimeToolExecutionResultBadgeMobilePropsParts<
    ChatMessageToolExecutionResultBadgeRenderState,
    ChatMessageToolExecutionResultBadgeStyles
  >;

type ChatMessageToolExecutionResultBadgeRenderState = {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  isSuccess: boolean;
  isError: boolean;
  icon: {
    name: IoniconName;
    size: number;
    color: string;
  };
  label: string;
};

type ChatMessageToolExecutionResultBadgeContainerProps = {
  accessible: true;
  accessibilityRole: ChatMessageToolExecutionResultBadgeRenderState['accessibilityRole'];
  accessibilityLabel: string;
  style: Array<
    | ChatMessageToolExecutionResultBadgeStyles['badge']
    | ChatMessageToolExecutionResultBadgeStyles['badgeSuccess']
    | ChatMessageToolExecutionResultBadgeStyles['badgeError']
  >;
  children: ReactNode;
};

type ChatMessageToolExecutionResultBadgeIconProps =
  ComponentProps<typeof Ionicons>;

type ChatMessageToolExecutionResultBadgeIconPart = {
  props: ChatMessageToolExecutionResultBadgeIconProps;
};

type ChatMessageToolExecutionResultBadgeLabelProps = {
  props: {
    style: Array<
      | ChatMessageToolExecutionResultBadgeStyles['text']
      | ChatMessageToolExecutionResultBadgeStyles['textSuccess']
      | ChatMessageToolExecutionResultBadgeStyles['textError']
    >;
  };
  text: string;
};

type ChatMessageToolExecutionResultBadgeLabelPart = {
  props: ChatMessageToolExecutionResultBadgeLabelProps;
};

type ChatMessageToolExecutionResultBadgeContentProps = {
  icon: ChatMessageToolExecutionResultBadgeIconPart;
  label: ChatMessageToolExecutionResultBadgeLabelPart;
};

type ChatMessageToolExecutionPendingResultStyles =
  SharedChatMessageToolExecutionPendingResultStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageToolExecutionPendingResultProps =
  ChatRuntimeToolExecutionPendingResultMobilePropsPartsInput<
    ToolExecutionDetailMobilePendingResultRenderState,
    ChatMessageToolExecutionPendingResultStyles
  >;

type ChatMessageToolExecutionPendingResultParts =
  ChatRuntimeToolExecutionPendingResultMobilePropsParts<
    ToolExecutionDetailMobilePendingResultRenderState,
    ChatMessageToolExecutionPendingResultStyles
  >;

type ChatMessageToolExecutionPendingResultContainerProps = {
  accessible: true;
  accessibilityRole: ToolExecutionDetailMobilePendingResultRenderState['accessibilityRole'];
  accessibilityLabel: string;
  style: ChatMessageToolExecutionPendingResultStyles['row'];
  children: ReactNode;
};

type ChatMessageToolExecutionPendingResultSpinnerProps =
  ComponentProps<typeof ActivityIndicator>;

type ChatMessageToolExecutionPendingResultSpinnerPart = {
  props: ChatMessageToolExecutionPendingResultSpinnerProps;
};

type ChatMessageToolExecutionPendingResultLabelProps = {
  props: {
    style: ChatMessageToolExecutionPendingResultStyles['text'];
  };
  text: string;
};

type ChatMessageToolExecutionPendingResultLabelPart = {
  props: ChatMessageToolExecutionPendingResultLabelProps;
};

type ChatMessageToolExecutionPendingResultContentProps = {
  spinner: ChatMessageToolExecutionPendingResultSpinnerPart;
  label: ChatMessageToolExecutionPendingResultLabelPart;
};

type ChatMessageToolExecutionEmptyStateProps =
  ChatRuntimeToolExecutionEmptyStateMobilePropsPartsInput<
    ToolExecutionDetailMobileEmptyStateRenderState,
    StyleProp<TextStyle>
  >;

type ChatMessageToolExecutionEmptyStateParts =
  ChatRuntimeToolExecutionEmptyStateMobilePropsParts<
    ToolExecutionDetailMobileEmptyStateRenderState,
    StyleProp<TextStyle>
  >;

type ChatMessageToolExecutionEmptyStateLabelProps = {
  props: {
    accessibilityRole: ToolExecutionDetailMobileEmptyStateRenderState['accessibilityRole'];
    accessibilityLabel: string;
    style: StyleProp<TextStyle>;
  };
  text: string;
};

type ChatMessageToolExecutionPayloadMetaStyles =
  SharedChatMessageToolExecutionPayloadMetaStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageToolExecutionPayloadMetaProps =
  ChatRuntimeToolExecutionPayloadMetaMobilePropsPartsInput<
    ToolExecutionDetailMobileSectionHeaderRenderState,
    ChatMessageToolExecutionPayloadMetaStyles
  >;

type ChatMessageToolExecutionPayloadMetaParts =
  ChatRuntimeToolExecutionPayloadMetaMobilePropsParts<
    ToolExecutionDetailMobileSectionHeaderRenderState,
    ChatMessageToolExecutionPayloadMetaStyles
  >;

type ChatMessageToolExecutionPayloadMetaTextProps = {
  props: {
    style: StyleProp<TextStyle>;
  };
  text: string;
};

type ChatMessageToolExecutionPayloadMetaPayloadTypePart = {
  shouldRender: boolean;
  props: ChatMessageToolExecutionPayloadMetaTextProps;
};

type ChatMessageToolExecutionPayloadMetaContentProps = {
  label: {
    props: ChatMessageToolExecutionPayloadMetaTextProps;
  };
  payloadType: ChatMessageToolExecutionPayloadMetaPayloadTypePart;
};

type ChatMessageToolExecutionPayloadMetaPayloadTypeBlockProps = {
  payloadType: ChatMessageToolExecutionPayloadMetaPayloadTypePart;
};

type ChatMessageToolExecutionPayloadMetaRowProps = {
  style: ChatMessageToolExecutionPayloadMetaStyles['row'];
  children: ReactNode;
};

type ChatMessageToolExecutionResultHeaderStyles =
  SharedChatMessageToolExecutionResultHeaderStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    Omit<ChatMessageToolExecutionPayloadMetaStyles, 'row'>,
    ChatMessageToolExecutionResultBadgeStyles,
    StyleProp<TextStyle>,
    ChatMessageToolExecutionCopyButtonStyles
  >;

type ChatMessageToolExecutionResultHeaderProps =
  ChatRuntimeToolExecutionResultHeaderMobilePropsPartsInput<
    ToolExecutionDetailMobileSectionHeaderRenderState,
    ChatMessageToolExecutionResultBadgeRenderState,
    ToolExecutionDetailMobileCopyButtonRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionResultHeaderStyles
  >;

type ChatMessageToolExecutionResultHeaderParts =
  ChatRuntimeToolExecutionResultHeaderMobilePropsParts<
    ToolExecutionDetailMobileSectionHeaderRenderState,
    ChatMessageToolExecutionResultBadgeRenderState,
    ToolExecutionDetailMobileCopyButtonRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionResultHeaderStyles
  >;

type ChatMessageToolExecutionResultCharacterCountProps = {
  props: {
    style: StyleProp<TextStyle>;
  };
  text: string;
};

type ChatMessageToolExecutionResultHeaderContainerProps = {
  style: StyleProp<ViewStyle>;
};

type ChatMessageToolExecutionResultHeaderViewProps =
  ChatMessageToolExecutionResultHeaderContainerProps & {
    children: ReactNode;
  };

type ChatMessageToolExecutionResultHeaderMetaContentProps = {
  payloadMeta: {
    props: ChatMessageToolExecutionPayloadMetaProps;
  };
  resultBadge: {
    props: ChatMessageToolExecutionResultBadgeProps;
  };
  characterCount: {
    props: ChatMessageToolExecutionResultCharacterCountProps;
  };
};

type ChatMessageToolExecutionResultHeaderMetaPart = {
  props: ChatMessageToolExecutionResultHeaderContainerProps;
  content: ChatMessageToolExecutionResultHeaderMetaContentProps;
};

type ChatMessageToolExecutionResultHeaderContentProps = {
  meta: ChatMessageToolExecutionResultHeaderMetaPart;
  copyButton: {
    props: ChatMessageToolExecutionCopyButtonProps;
  };
};

type ChatMessageToolExecutionPayloadBlockStyles =
  SharedChatMessageToolExecutionPayloadBlockStyleSlots<
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageToolExecutionPayloadBlockProps =
  ChatRuntimeToolExecutionPayloadBlockMobilePropsPartsInput<
    ChatMessageToolExecutionPayloadBlockStyles
  >;

type ChatMessageToolExecutionPayloadBlockParts =
  ChatRuntimeToolExecutionPayloadBlockMobilePropsParts<
    ChatMessageToolExecutionPayloadBlockStyles
  >;

type ChatMessageToolExecutionPayloadPreviewProps = {
  props: {
    style: StyleProp<TextStyle>;
    numberOfLines: number;
  };
  text: string;
};

type ChatMessageToolExecutionPayloadPreviewPart = {
  shouldRender: boolean;
  props: ChatMessageToolExecutionPayloadPreviewProps;
};

type ChatMessageToolExecutionPayloadCodeProps = {
  props: {
    style: StyleProp<TextStyle>;
  };
  text: string;
};

type ChatMessageToolExecutionPayloadScrollContainerProps = {
  style: StyleProp<ViewStyle>;
  nestedScrollEnabled: true;
};

type ChatMessageToolExecutionPayloadScrollContentProps = {
  code: {
    props: ChatMessageToolExecutionPayloadCodeProps;
  };
};

type ChatMessageToolExecutionPayloadBlockContentProps = {
  preview: ChatMessageToolExecutionPayloadPreviewPart;
  scroll: {
    props: ChatMessageToolExecutionPayloadScrollContainerProps;
    content: ChatMessageToolExecutionPayloadScrollContentProps;
  };
};

type ChatMessageToolExecutionPayloadPreviewBlockProps = {
  preview: ChatMessageToolExecutionPayloadPreviewPart;
};

type ChatMessageToolExecutionPayloadScrollProps =
  ChatMessageToolExecutionPayloadScrollContainerProps & {
    children: ReactNode;
  };

type ChatMessageToolExecutionPayloadSectionStyles =
  SharedChatMessageToolExecutionPayloadSectionStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    ChatMessageToolExecutionPayloadMetaStyles,
    ChatMessageToolExecutionCopyButtonStyles,
    ChatMessageToolExecutionPayloadBlockStyles
  >;

type ChatMessageToolExecutionPayloadSectionProps =
  ChatRuntimeToolExecutionPayloadSectionMobilePropsPartsInput<
    ToolExecutionDetailMobileSectionHeaderRenderState,
    ToolExecutionDetailMobileCopyButtonRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionPayloadSectionStyles
  >;

type ChatMessageToolExecutionPayloadSectionParts =
  ChatRuntimeToolExecutionPayloadSectionMobilePropsParts<
    ToolExecutionDetailMobileSectionHeaderRenderState,
    ToolExecutionDetailMobileCopyButtonRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionPayloadSectionStyles
  >;

type ChatMessageToolExecutionPayloadSectionContainerProps = {
  style: StyleProp<ViewStyle>;
};

type ChatMessageToolExecutionPayloadSectionHeaderContentProps = {
  payloadMeta: {
    props: ChatMessageToolExecutionPayloadMetaProps;
  };
  copyButton: {
    props: ChatMessageToolExecutionCopyButtonProps;
  };
};

type ChatMessageToolExecutionPayloadSectionContentProps = {
  headerRow: {
    props: ChatMessageToolExecutionPayloadSectionContainerProps;
    content: ChatMessageToolExecutionPayloadSectionHeaderContentProps;
  };
  payloadBlock: {
    props: ChatMessageToolExecutionPayloadBlockProps;
  };
};

type ChatMessageToolExecutionPayloadSectionViewProps =
  ChatMessageToolExecutionPayloadSectionContainerProps & {
    children: ReactNode;
  };

type ChatMessageToolExecutionErrorBlockStyles =
  SharedChatMessageToolExecutionErrorBlockStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    ChatMessageToolExecutionCopyButtonStyles
  >;

type ChatMessageToolExecutionErrorBlockProps =
  ChatRuntimeToolExecutionErrorBlockMobilePropsPartsInput<
    ToolExecutionDetailMobileSectionHeaderRenderState,
    ToolExecutionDetailMobileCopyButtonRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionErrorBlockStyles
  >;

type ChatMessageToolExecutionErrorBlockParts =
  ChatRuntimeToolExecutionErrorBlockMobilePropsParts<
    ToolExecutionDetailMobileSectionHeaderRenderState,
    ToolExecutionDetailMobileCopyButtonRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionErrorBlockStyles
  >;

type ChatMessageToolExecutionErrorBlockContainerProps = {
  style: StyleProp<ViewStyle>;
};

type ChatMessageToolExecutionErrorBlockTextProps = {
  props: {
    style: StyleProp<TextStyle>;
  };
  text: string;
};

type ChatMessageToolExecutionErrorBlockHeaderContentProps = {
  label: {
    props: ChatMessageToolExecutionErrorBlockTextProps;
  };
  copyButton: {
    props: ChatMessageToolExecutionCopyButtonProps;
  };
};

type ChatMessageToolExecutionErrorBlockContentProps = {
  headerRow: {
    props: ChatMessageToolExecutionErrorBlockContainerProps;
    content: ChatMessageToolExecutionErrorBlockHeaderContentProps;
  };
  error: {
    props: ChatMessageToolExecutionErrorBlockTextProps;
  };
};

type ChatMessageToolExecutionErrorBlockViewProps =
  ChatMessageToolExecutionErrorBlockContainerProps & {
    children: ReactNode;
  };

type ChatMessageToolExecutionResultSectionStyles =
  SharedChatMessageToolExecutionResultSectionStyleSlots<
    StyleProp<ViewStyle>,
    ChatMessageToolExecutionResultHeaderStyles,
    ChatMessageToolExecutionPayloadBlockStyles,
    ChatMessageToolExecutionErrorBlockStyles
  >;

type ChatMessageToolExecutionResultSectionProps =
  ChatRuntimeToolExecutionResultSectionMobilePropsPartsInput<
    ToolExecutionDetailMobileSectionHeaderRenderState,
    ChatMessageToolExecutionResultBadgeRenderState,
    ToolExecutionDetailMobileCopyButtonRenderState,
    (event: GestureResponderEvent) => void,
    ToolExecutionDetailMobileSectionHeaderRenderState,
    ToolExecutionDetailMobileCopyButtonRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionResultSectionStyles
  >;

type ChatMessageToolExecutionResultSectionParts =
  ChatRuntimeToolExecutionResultSectionMobilePropsParts<
    ToolExecutionDetailMobileSectionHeaderRenderState,
    ChatMessageToolExecutionResultBadgeRenderState,
    ToolExecutionDetailMobileCopyButtonRenderState,
    (event: GestureResponderEvent) => void,
    ToolExecutionDetailMobileSectionHeaderRenderState,
    ToolExecutionDetailMobileCopyButtonRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionResultSectionStyles
  >;

type ChatMessageToolExecutionResultSectionItemProps = {
  style: StyleProp<ViewStyle>;
  children: ReactNode;
};

type ChatMessageToolExecutionResultSectionErrorBlockPart =
  | {
      shouldRender: true;
      props: ChatMessageToolExecutionErrorBlockProps;
    }
  | {
      shouldRender: false;
      props: null;
    };

type ChatMessageToolExecutionResultSectionContentProps = {
  header: {
    props: ChatMessageToolExecutionResultHeaderProps;
  };
  payloadBlock: {
    props: ChatMessageToolExecutionPayloadBlockProps;
  };
  errorBlock: ChatMessageToolExecutionResultSectionErrorBlockPart;
};

type ChatMessageToolExecutionResultSectionErrorBlockProps = {
  errorBlock: ChatMessageToolExecutionResultSectionErrorBlockPart;
};

type ChatMessageToolExecutionCallDetailInput = {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  compactText?: string | null;
  content: string;
  isExpanded: boolean;
  previewNumberOfLines: number;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress: () => void;
};

type ChatMessageToolExecutionCallDetailResult = {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  resultBadge: ChatMessageToolExecutionResultBadgeRenderState;
  characterCountLabel: string;
  resultCompactText?: string | null;
  resultContent: string;
  isExpanded: boolean;
  previewNumberOfLines: number;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress: () => void;
  errorRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  error?: string | null;
  errorCopyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onErrorCopyPress: () => void;
};

type ChatMessageToolExecutionCallDetailPendingResult = {
  renderState: ToolExecutionDetailMobilePendingResultRenderState;
};

type ChatMessageToolExecutionCallDetailStyles =
  SharedChatMessageToolExecutionCallDetailStyleSlots<
    ChatMessageToolExecutionCallSectionStyles,
    ChatMessageToolExecutionPayloadSectionStyles,
    ChatMessageToolExecutionResultSectionStyles,
    ChatMessageToolExecutionPendingResultStyles
  >;

type ChatMessageToolExecutionCallDetailProps =
  ChatRuntimeToolExecutionCallDetailMobilePropsPartsInput<
    ToolExecutionDetailMobileHeaderRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionCallDetailInput,
    ChatMessageToolExecutionCallDetailResult,
    ChatMessageToolExecutionCallDetailPendingResult,
    ChatMessageToolExecutionCallDetailStyles
  >;

type ChatMessageToolExecutionCallDetailParts =
  ChatRuntimeToolExecutionCallDetailMobilePropsParts<
    ToolExecutionDetailMobileHeaderRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolExecutionCallDetailInput,
    ChatMessageToolExecutionCallDetailResult,
    ChatMessageToolExecutionCallDetailPendingResult,
    ChatMessageToolExecutionCallDetailStyles
  >;

type ChatMessageToolExecutionCallDetailInputSectionPart =
  | {
      shouldRender: true;
      props: ChatMessageToolExecutionPayloadSectionProps;
    }
  | {
      shouldRender: false;
      props: null;
    };

type ChatMessageToolExecutionCallDetailResultSectionPart =
  | {
      shouldRender: true;
      props: ChatMessageToolExecutionResultSectionProps;
    }
  | {
      shouldRender: false;
      props: null;
    };

type ChatMessageToolExecutionCallDetailPendingResultPart =
  | {
      shouldRender: true;
      props: ChatMessageToolExecutionPendingResultProps;
    }
  | {
      shouldRender: false;
      props: null;
    };

type ChatMessageToolExecutionCallDetailContentProps = {
  inputSection: ChatMessageToolExecutionCallDetailInputSectionPart;
  resultSection: ChatMessageToolExecutionCallDetailResultSectionPart;
  pendingResult: ChatMessageToolExecutionCallDetailPendingResultPart;
};

type ChatMessageToolExecutionCallDetailInputSectionProps = {
  inputSection: ChatMessageToolExecutionCallDetailInputSectionPart;
};

type ChatMessageToolExecutionCallDetailResultStateProps = {
  resultSection: ChatMessageToolExecutionCallDetailResultSectionPart;
  pendingResult: ChatMessageToolExecutionCallDetailPendingResultPart;
};

type ChatMessageToolExecutionCallListRow = ChatRuntimeConversationToolExecutionDetailMobileRowState;

type ChatMessageToolExecutionCallListProps =
  ChatRuntimeToolExecutionCallListMobilePropsPartsInput<
    ChatMessageToolExecutionCallListRow,
    ChatMessageToolExecutionCallDetailStyles
  >;

type ChatMessageToolExecutionCallListParts =
  ChatRuntimeToolExecutionCallListMobilePropsParts<
    ChatMessageToolExecutionCallListRow,
    ChatMessageToolExecutionCallDetailStyles
  >;

type ChatMessageToolExecutionCallListContentProps = {
  rows: Array<{
    key: ChatMessageToolExecutionCallListRow['key'];
    props: ChatMessageToolExecutionCallDetailProps;
  }>;
};

type ChatMessageHistoryBannerStyles =
  SharedChatMessageHistoryBannerStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageHistoryBannerProps =
  ChatRuntimeMessageHistoryBannerMobilePropsPartsInput<
    ChatRuntimeMessageHistoryBannerMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageHistoryBannerStyles
  >;

type ChatMessageHistoryBannerParts =
  ChatRuntimeMessageHistoryBannerMobilePropsParts<
    ChatRuntimeMessageHistoryBannerMobileRenderState,
    ((event: GestureResponderEvent) => void) | undefined,
    ChatMessageHistoryBannerStyles
  >;

type ChatMessageHistoryBannerTextPart = {
  text: string;
  props: {
    style: StyleProp<TextStyle>;
  };
};

type ChatMessageHistoryBannerIconProps = {
  icon: {
    props: {
      name: IoniconName;
      size: number;
      color: string;
    };
  };
};

type ChatMessageHistoryBannerTextProps = {
  part: ChatMessageHistoryBannerTextPart;
};

type ChatMessageHistoryBannerLoadButtonContentProps = {
  icon: ChatMessageHistoryBannerIconProps['icon'];
  label: ChatMessageHistoryBannerTextPart;
};

type ChatMessageHistoryBannerLoadButtonPart = {
  props: {
    onPress: ((event: GestureResponderEvent) => void) | undefined;
    accessibilityRole: AccessibilityRole;
    accessibilityLabel: string;
    style: ComponentProps<typeof Pressable>['style'];
  };
  content: ChatMessageHistoryBannerLoadButtonContentProps;
};

type ChatMessageHistoryBannerContainerContentProps = {
  summary: ChatMessageHistoryBannerTextPart;
  loadButton: ChatMessageHistoryBannerLoadButtonPart;
};

type ChatMessageHistoryBannerContainerPart = {
  shouldRender: boolean;
  props: {
    style: StyleProp<ViewStyle>;
  };
  content: ChatMessageHistoryBannerContainerContentProps;
};

type ChatMessageHistoryBannerContainerProps = {
  container: ChatMessageHistoryBannerContainerPart;
};

type ChatMessageHistoryBannerSummaryProps = {
  summary: ChatMessageHistoryBannerTextPart;
};

type ChatMessageHistoryBannerLoadButtonProps = {
  button: ChatMessageHistoryBannerLoadButtonPart;
};

type ChatMessageConversationFrameProps =
  ChatRuntimeConversationFrameMobilePropsPartsInput<
    ReactNode,
    ReactNode,
    ReactNode,
    StyleProp<ViewStyle>,
    ComponentProps<typeof KeyboardAvoidingView>['behavior'],
    number,
    StyleProp<ViewStyle>
  >;

type ChatMessageConversationFrameParts =
  ChatRuntimeConversationFrameMobilePropsParts<
    ReactNode,
    ReactNode,
    ReactNode,
    StyleProp<ViewStyle>,
    ComponentProps<typeof KeyboardAvoidingView>['behavior'],
    number,
    StyleProp<ViewStyle>
  >;

type ChatMessageConversationFrameRootProps = {
  style: StyleProp<ViewStyle>;
  children: ReactNode;
};

type ChatMessageConversationFrameRootContentProps = {
  children: ReactNode;
  dock: {
    children: ReactNode | undefined;
  };
};

type ChatMessageConversationFrameContentProps = {
  root: {
    props: Pick<ChatMessageConversationFrameRootProps, 'style'>;
    content: ChatMessageConversationFrameRootContentProps;
  };
  overlays: {
    children: ReactNode;
  };
};

type ChatMessageConversationOverlaysProps =
  ChatRuntimeConversationOverlaysMobilePropsPartsInput<
    ReactNode,
    ReactNode
  >;

type ChatMessageConversationOverlaysParts =
  ChatRuntimeConversationOverlaysMobilePropsParts<
    ReactNode,
    ReactNode
  >;

type ChatMessageConversationOverlaysContentProps = {
  agentSelector: {
    children: ReactNode | undefined;
  };
  promptEditor: {
    children: ReactNode | undefined;
  };
};

type ChatMessageScrollViewportProps =
  ChatRuntimeConversationScrollViewportMobilePropsPartsInput<
    ReactNode,
    Ref<ScrollView>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    ComponentProps<typeof ScrollView>['keyboardShouldPersistTaps'],
    ComponentProps<typeof ScrollView>['contentInsetAdjustmentBehavior'],
    ComponentProps<typeof ScrollView>['onScroll'],
    ComponentProps<typeof ScrollView>['onScrollBeginDrag'],
    ComponentProps<typeof ScrollView>['onScrollEndDrag'],
    number
  >;

type ChatMessageScrollViewportParts =
  ChatRuntimeConversationScrollViewportMobilePropsParts<
    ReactNode,
    Ref<ScrollView>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    ComponentProps<typeof ScrollView>['keyboardShouldPersistTaps'],
    ComponentProps<typeof ScrollView>['contentInsetAdjustmentBehavior'],
    ComponentProps<typeof ScrollView>['onScroll'],
    ComponentProps<typeof ScrollView>['onScrollBeginDrag'],
    ComponentProps<typeof ScrollView>['onScrollEndDrag'],
    number
  >;

type ChatMessageScrollViewportContentProps = {
  children: ReactNode;
};

type ChatMessageConversationViewportContentProps =
  ChatRuntimeConversationViewportContentMobilePropsPartsInput<
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode
  >;

type ChatMessageConversationViewportContentParts =
  ChatRuntimeConversationViewportContentMobilePropsParts<
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode
  >;

type ChatMessageConversationViewportContentPartProps = {
  loadingState: {
    children: ReactNode | undefined;
  };
  homeState: {
    children: ReactNode | undefined;
  };
  historyBanner: {
    children: ReactNode | undefined;
  };
  stepSummary: {
    children: ReactNode | undefined;
  };
  children: ReactNode;
  debugPanels: {
    children: ReactNode | undefined;
  };
};

type ChatMessageConversationViewportProps =
  Omit<ChatMessageScrollViewportProps, 'children'>
  & ChatMessageConversationViewportContentProps;

type ChatMessageStepSummaryCardStyles =
  SharedChatMessageStepSummaryCardStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageStepSummaryCardProps =
  ChatRuntimeStepSummaryCardMobilePropsPartsInput<
    ChatRuntimeStepSummaryMobileRenderState,
    ChatMessageStepSummaryCardStyles
  >;

type ChatMessageStepSummaryCardParts =
  ChatRuntimeStepSummaryCardMobilePropsParts<
    ChatRuntimeStepSummaryMobileRenderState,
    ChatMessageStepSummaryCardStyles
  >;

type ChatMessageStepSummaryTextPart = {
  text: string;
  props: {
    style: StyleProp<TextStyle>;
    numberOfLines: TextProps['numberOfLines'];
  };
};

type ChatMessageStepSummaryPreviewPart =
  ChatMessageStepSummaryTextPart & {
    shouldRender: boolean;
  };

type ChatMessageStepSummaryBadgeContentProps = {
  label: ChatMessageStepSummaryTextPart;
};

type ChatMessageStepSummaryBadgePart = {
  props: {
    style: StyleProp<ViewStyle>;
  };
  content: ChatMessageStepSummaryBadgeContentProps;
};

type ChatMessageStepSummaryHeaderContentProps = {
  title: ChatMessageStepSummaryTextPart;
  badge: ChatMessageStepSummaryBadgePart;
};

type ChatMessageStepSummaryHeaderPart = {
  props: {
    style: StyleProp<ViewStyle>;
  };
  content: ChatMessageStepSummaryHeaderContentProps;
};

type ChatMessageStepSummaryCardContentProps = {
  header: ChatMessageStepSummaryHeaderPart;
  action: ChatMessageStepSummaryTextPart;
  meta: ChatMessageStepSummaryTextPart;
  preview: ChatMessageStepSummaryPreviewPart;
};

type ChatMessageStepSummaryCardViewProps = {
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
};

type ChatMessageStepSummaryTextProps = {
  part: ChatMessageStepSummaryTextPart;
};

type ChatMessageStepSummaryBadgeProps = {
  badge: ChatMessageStepSummaryBadgePart;
};

type ChatMessageStepSummaryHeaderProps = {
  header: ChatMessageStepSummaryHeaderPart;
};

type ChatMessageStepSummaryPreviewBlockProps = {
  preview: ChatMessageStepSummaryPreviewPart;
};

type ChatMessageScrollToBottomButtonProps =
  ChatRuntimeScrollToBottomButtonMobilePropsPartsInput<
    ChatRuntimeScrollToBottomMobileRenderState,
    (event: GestureResponderEvent) => void,
    StyleProp<ViewStyle>
  >;

type ChatMessageScrollToBottomButtonParts =
  ChatRuntimeScrollToBottomButtonMobilePropsParts<
    ChatRuntimeScrollToBottomMobileRenderState,
    (event: GestureResponderEvent) => void,
    StyleProp<ViewStyle>
  >;

type ChatMessageScrollToBottomButtonIconProps = {
  name: IoniconName;
  size: number;
  color: string;
};

type ChatMessageScrollToBottomButtonContentProps = {
  icon: {
    props: ChatMessageScrollToBottomButtonIconProps;
  };
};

type ChatMessageScrollToBottomButtonTouchableProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  activeOpacity: number;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint: string;
};

type ChatMessageLoadingStateProps =
  ChatRuntimeLoadingStateMobilePropsPartsInput<
    ChatRuntimeLoadingStateMobileRenderState,
    ImageSourcePropType,
    StyleProp<ViewStyle>,
    StyleProp<ImageStyle>
  >;

type ChatMessageLoadingStateParts =
  ChatRuntimeLoadingStateMobilePropsParts<
    ChatRuntimeLoadingStateMobileRenderState,
    ImageSourcePropType,
    StyleProp<ViewStyle>,
    StyleProp<ImageStyle>
  >;

type ChatMessageLoadingStateSpinnerProps = {
  source: ImageSourcePropType;
  style: StyleProp<ImageStyle>;
  resizeMode: ComponentProps<typeof Image>['resizeMode'];
};

type ChatMessageLoadingStateContainerContentProps = {
  spinner: {
    props: ChatMessageLoadingStateSpinnerProps;
  };
};

type ChatMessageLoadingStateContainerProps = {
  children: ReactNode;
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityState: AccessibilityState;
  style: StyleProp<ViewStyle>;
};

type ChatMessageDebugPanelRow = {
  key: string;
  text: string;
};

type ChatMessageDebugPanelRowProps = ChatMessageDebugPanelRow & {
  props: {
    style: StyleProp<TextStyle>;
  };
};

type ChatMessageDebugPanelProps = {
  shouldRender: boolean;
  content: {
    rows: readonly ChatMessageDebugPanelRowProps[];
  };
  props: {
    style: StyleProp<ViewStyle>;
  };
};

type ChatMessageDebugPanelStackProps =
  ChatRuntimeDebugPanelStackMobilePropsPartsInput<
    boolean,
    readonly ChatMessageDebugPanelRow[],
    boolean,
    readonly ChatMessageDebugPanelRow[],
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageDebugPanelStackParts =
  ChatRuntimeDebugPanelStackMobilePropsParts<
    boolean,
    readonly ChatMessageDebugPanelRow[],
    boolean,
    readonly ChatMessageDebugPanelRow[],
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageConversationViewportStyleSlots =
  SharedChatMessageConversationViewportStyleSlots<
    Pick<ChatMessageConversationFrameProps, 'keyboardAvoidingStyle' | 'rootStyle'>,
    Pick<ChatMessageScrollViewportProps, 'style' | 'contentContainerStyle'>,
    Pick<ChatMessageLoadingStateProps, 'style' | 'spinnerStyle'>,
    ChatConversationHomeQuickStartsStyles,
    ChatMessageHistoryBannerStyles,
    ChatMessageStepSummaryCardStyles,
    Pick<ChatMessageDebugPanelStackProps, 'panelStyle' | 'textStyle'>
  >;

type ChatMessageRuntimeViewportStyleSlots =
  SharedChatMessageRuntimeViewportStyleSlots<
    ChatMessageConversationViewportStyleSlots['scrollViewport'],
    ChatMessageConversationViewportStyleSlots['loadingState'],
    ChatMessageConversationViewportStyleSlots['homeQuickStarts'],
    ChatMessageConversationViewportStyleSlots['historyBanner'],
    ChatMessageConversationViewportStyleSlots['stepSummary'],
    ChatMessageConversationViewportStyleSlots['debugPanels']
  >;

type ChatMessageRuntimeViewportProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = Omit<
  ChatMessageConversationViewportProps,
  | 'style'
  | 'contentContainerStyle'
  | 'loadingState'
  | 'homeState'
  | 'historyBanner'
  | 'stepSummary'
  | 'debugPanels'
> & ChatRuntimeConversationViewportMobilePropsPartsInput<
  Omit<ChatMessageLoadingStateProps, 'style' | 'spinnerStyle'>,
  Omit<ChatConversationHomeQuickStartsProps<TPrompt, TTask>, 'styles'>,
  Omit<ChatMessageHistoryBannerProps, 'styles'>,
  Omit<ChatMessageStepSummaryCardProps, 'styles'>,
  Omit<ChatMessageDebugPanelStackProps, 'panelStyle' | 'textStyle'>,
  ChatMessageRuntimeViewportStyleSlots['scrollViewport']['style'],
  ChatMessageRuntimeViewportStyleSlots['scrollViewport']['contentContainerStyle'],
  ChatMessageRuntimeViewportStyleSlots['loadingState']['style'],
  ChatMessageRuntimeViewportStyleSlots['loadingState']['spinnerStyle'],
  ChatMessageRuntimeViewportStyleSlots['homeQuickStarts'],
  ChatMessageRuntimeViewportStyleSlots['historyBanner'],
  ChatMessageRuntimeViewportStyleSlots['stepSummary'],
  ChatMessageRuntimeViewportStyleSlots['debugPanels']['panelStyle'],
  ChatMessageRuntimeViewportStyleSlots['debugPanels']['textStyle']
>;

type ChatMessageRuntimeViewportParts<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> =
  ChatRuntimeConversationViewportMobilePropsParts<
    Omit<ChatMessageLoadingStateProps, 'style' | 'spinnerStyle'>,
    Omit<ChatConversationHomeQuickStartsProps<TPrompt, TTask>, 'styles'>,
    Omit<ChatMessageHistoryBannerProps, 'styles'>,
    Omit<ChatMessageStepSummaryCardProps, 'styles'>,
    Omit<ChatMessageDebugPanelStackProps, 'panelStyle' | 'textStyle'>,
    ChatMessageRuntimeViewportStyleSlots['scrollViewport']['style'],
    ChatMessageRuntimeViewportStyleSlots['scrollViewport']['contentContainerStyle'],
    ChatMessageRuntimeViewportStyleSlots['loadingState']['style'],
    ChatMessageRuntimeViewportStyleSlots['loadingState']['spinnerStyle'],
    ChatMessageRuntimeViewportStyleSlots['homeQuickStarts'],
    ChatMessageRuntimeViewportStyleSlots['historyBanner'],
    ChatMessageRuntimeViewportStyleSlots['stepSummary'],
    ChatMessageRuntimeViewportStyleSlots['debugPanels']['panelStyle'],
    ChatMessageRuntimeViewportStyleSlots['debugPanels']['textStyle']
  >;

type ChatMessageRuntimeViewportChromeProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = Omit<ChatMessageRuntimeViewportProps<TPrompt, TTask>, 'children' | 'styles'>;

type ChatMessageRuntimeViewportChromePropsInput<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
> =
  Omit<
    ChatMessageRuntimeViewportChromeProps<TPrompt, TTask>,
    | 'loadingState'
    | 'homeQuickStarts'
    | 'historyBanner'
    | 'stepSummary'
    | 'debugPanels'
    | 'keyboardShouldPersistTaps'
    | 'contentInsetAdjustmentBehavior'
  >
  & {
    viewportContentIsLoadingMessages: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['isLoadingMessages'];
    viewportContentMessageCount: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['messageCount'];
    loadingSpinnerSource: ImageSourcePropType;
    quickStartPrompts: ChatRuntimeHomeQuickStartItemsMobileStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['prompts'];
    quickStartSkills: ChatRuntimeHomeQuickStartItemsMobileStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['skills'];
    quickStartTasks: ChatRuntimeHomeQuickStartItemsMobileStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['tasks'];
    quickStartCanAddPrompt: ChatRuntimeHomeQuickStartItemsMobileStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['canAddPrompt'];
    isLoadingQuickStartPrompts: boolean;
    runningPromptTaskId?: string | null;
    onQuickStartPress: (item: ChatConversationHomeQuickStartItem<TPrompt, TTask>) => void;
    onEditPrompt: (prompt: TPrompt) => void;
    onDeletePrompt: (prompt: TPrompt) => void;
    visibleMessageCount: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['visibleMessageCount'];
    totalMessageCount: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['totalMessageCount'];
    hiddenMessageCount: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['hiddenMessageCount'];
    messageHistoryLoadIncrement: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['messageHistoryLoadIncrement'];
    latestStepSummary: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['latestStepSummary'];
    colors: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['colors'];
    onLoadEarlierMessages?: (event: GestureResponderEvent) => void;
    requestDebugText?: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['requestDebugText'];
    voiceDebugEnabled?: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['voiceDebugEnabled'];
    voiceEvents?: ChatRuntimeViewportChromeMobileRenderStateInput<
      TPrompt,
      PromptLibrarySkillLike & { id: string },
      TTask
    >['voiceEvents'];
  };

type ChatMessageResponseHistoryPanelViewProps = ComponentProps<typeof ResponseHistoryPanel>;

type ChatMessageResponseHistoryPanelDockProps = Pick<
  ChatMessageResponseHistoryPanelViewProps,
  'responses' | 'colors' | 'remoteBaseUrl' | 'remoteApiKey'
> & {
  ttsProvider?: ChatMessageRuntimeRemoteSpeechOptions['providerId'];
  edgeTtsVoice?: ChatMessageRuntimeRemoteSpeechOptions['voice'];
  remoteTtsVoice?: ChatMessageRuntimeRemoteSpeechOptions['voice'] | null;
  remoteTtsModel?: ChatMessageRuntimeRemoteSpeechOptions['model'] | null;
  ttsRate?: ChatMessageRuntimeRemoteSpeechOptions['rate'] | null;
  ttsPitch?: ChatMessageRuntimeNativeSpeechOptions['pitch'] | null;
  ttsVoiceId?: ChatMessageRuntimeNativeSpeechOptions['voice'] | null;
  speakNative: ChatMessageRuntimeSpeechActionsStateInput['speakNative'];
  stopNativeSpeech: ChatMessageRuntimeSpeechActionsStateInput['stopNativeSpeech'];
  speakRemote: ChatMessageRuntimeSpeechActionsStateInput['speakRemote'];
  stopRemoteSpeech: ChatMessageRuntimeSpeechActionsStateInput['stopRemoteSpeech'];
};

type ChatMessageRuntimeResponseHistoryPanelChromeStateInput = ChatMessageResponseHistoryPanelDockProps;

type ChatMessageRuntimeResponseHistoryPanelChromeState = Pick<
  ChatMessageResponseHistoryPanelViewProps,
  'isCollapsed' | 'shouldAnimateNewest' | 'speakingIndex' | 'onToggleCollapsed' | 'onSpeakResponse'
>;

type ChatMessageQueuePanelViewProps = ComponentProps<typeof MessageQueuePanel>;

type ChatMessageQueuePanelDockPanelProps = Omit<
  ChatMessageQueuePanelViewProps,
  'isListCollapsed' | 'onToggleListCollapsed'
> & {
  conversationId: string;
};

type ChatMessageRuntimeQueuePanelDockChromeStateInput = Pick<
  ChatMessageQueuePanelDockPanelProps,
  'conversationId'
>;

type ChatMessageRuntimeQueuePanelDockChromeState = Pick<
  ChatMessageQueuePanelViewProps,
  'isListCollapsed' | 'onToggleListCollapsed'
>;

type ChatMessageQueuePanelDockContainerProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
};

type ChatMessageQueuePanelDockProps = {
  shouldRender: boolean;
  panel: ChatMessageQueuePanelDockPanelProps;
  container: {
    props: Omit<ChatMessageQueuePanelDockContainerProps, 'children'>;
  };
};

type ChatMessageConversationDockProps =
  ChatRuntimeConversationDockShellMobilePropsPartsInput<
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode
  >;

type ChatMessageConversationDockParts =
  ChatRuntimeConversationDockShellMobilePropsParts<
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode
  >;

type ChatMessageConversationDockContentProps = {
  responseHistoryPanel: {
    children: ReactNode | undefined;
  };
  scrollToBottomButton: {
    children: ReactNode | undefined;
  };
  voiceOverlay: {
    children: ReactNode | undefined;
  };
  queuePanel: {
    children: ReactNode | undefined;
  };
  connectionBanner: {
    children: ReactNode | undefined;
  };
  composer: {
    children: ReactNode | undefined;
  };
};

type ChatMessageConnectionBannerStyles =
  SharedChatMessageConnectionBannerStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageConnectionBannerProps =
  ChatRuntimeConnectionBannerMobilePropsPartsInput<
    ChatRuntimeConnectionBannerMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageConnectionBannerStyles
  >;

type ChatMessageConnectionBannerParts =
  ChatRuntimeConnectionBannerMobilePropsParts<
    ChatRuntimeConnectionBannerMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageConnectionBannerStyles
  >;

type ChatMessageConnectionBannerTextPart<TStyle> = {
  props: {
    style: TStyle;
    numberOfLines?: TextProps['numberOfLines'];
  };
  text: string;
};

type ChatMessageConnectionBannerTitlePart = {
  props: ChatMessageConnectionBannerTextPart<ChatMessageConnectionBannerStyles['title']>;
};

type ChatMessageConnectionBannerSubtitlePart = {
  props: ChatMessageConnectionBannerTextPart<ChatMessageConnectionBannerStyles['subtitle']>;
};

type ChatMessageConnectionBannerOptionalSubtitlePart = {
  shouldRender: boolean;
  props: ChatMessageConnectionBannerTextPart<ChatMessageConnectionBannerStyles['subtitle']>;
};

type ChatMessageConnectionBannerRetryLabelPart = {
  props: ChatMessageConnectionBannerTextPart<ChatMessageConnectionBannerStyles['retryButtonText']>;
};

type ChatMessageConnectionBannerTextContainerPart<TContent> = {
  props: {
    style: ChatMessageConnectionBannerStyles['textContainer'];
  };
  content: TContent;
};

type ChatMessageConnectionBannerContainerPart<TContent, TStateStyle, TRole> = {
  props: {
    accessible: true;
    accessibilityRole: TRole;
    accessibilityLabel: string;
    style: [
      ChatMessageConnectionBannerStyles['banner'],
      TStateStyle
    ];
  };
  content: TContent;
};

type ChatMessageConnectionBannerBodyPart<TContent> = {
  props: {
    style: ChatMessageConnectionBannerStyles['content'];
  };
  content: TContent;
};

type ChatMessageConnectionBannerSpinnerProps = {
  size: ComponentProps<typeof ActivityIndicator>['size'];
  color: string;
  style: ChatMessageConnectionBannerStyles['icon'];
};

type ChatMessageConnectionBannerIconProps = {
  name: IoniconName;
  size: number;
  color: string;
  style: ChatMessageConnectionBannerStyles['icon'];
};

type ChatMessageConnectionBannerRetryButtonPart = {
  props: {
    style: ChatMessageConnectionBannerStyles['retryButton'];
    onPress?: (event: GestureResponderEvent) => void;
    accessibilityRole: AccessibilityRole;
    accessibilityLabel: string;
    activeOpacity: number;
  };
  content: ChatMessageConnectionBannerRetryButtonContentProps;
};

type ChatMessageConnectionBannerReconnectingTextContentProps = {
  title: ChatMessageConnectionBannerTitlePart;
  subtitle: ChatMessageConnectionBannerOptionalSubtitlePart;
};

type ChatMessageConnectionBannerFailedTextContentProps = {
  title: ChatMessageConnectionBannerTitlePart;
  subtitle: ChatMessageConnectionBannerSubtitlePart;
};

type ChatMessageConnectionBannerRetryButtonContentProps = {
  label: ChatMessageConnectionBannerRetryLabelPart;
};

type ChatMessageConnectionBannerReconnectingBodyContent = {
  spinner: {
    props: ChatMessageConnectionBannerSpinnerProps;
  };
  textContainer: ChatMessageConnectionBannerTextContainerPart<
    ChatMessageConnectionBannerReconnectingTextContentProps
  >;
};

type ChatMessageConnectionBannerFailedBodyContent = {
  icon: {
    props: ChatMessageConnectionBannerIconProps;
  };
  textContainer: ChatMessageConnectionBannerTextContainerPart<
    ChatMessageConnectionBannerFailedTextContentProps
  >;
  retryButton: ChatMessageConnectionBannerRetryButtonPart;
};

type ChatMessageConnectionBannerReconnectingBody =
  ChatMessageConnectionBannerBodyPart<ChatMessageConnectionBannerReconnectingBodyContent>;

type ChatMessageConnectionBannerFailedBody =
  ChatMessageConnectionBannerBodyPart<ChatMessageConnectionBannerFailedBodyContent>;

type ChatMessageConnectionBannerReconnectingContentProps = {
  body: ChatMessageConnectionBannerReconnectingBody;
};

type ChatMessageConnectionBannerFailedContentProps = {
  body: ChatMessageConnectionBannerFailedBody;
};

type ChatMessageConnectionBannerReconnectingPart = {
  shouldRender: boolean;
  container: ChatMessageConnectionBannerContainerPart<
    ChatMessageConnectionBannerReconnectingContentProps,
    ChatMessageConnectionBannerStyles['reconnecting'],
    AccessibilityRole
  >;
};

type ChatMessageConnectionBannerFailedPart = {
  shouldRender: boolean;
  container: ChatMessageConnectionBannerContainerPart<
    ChatMessageConnectionBannerFailedContentProps,
    ChatMessageConnectionBannerStyles['failed'],
    AccessibilityRole
  >;
};

type ChatMessageConnectionBannerReconnectingProps = {
  reconnecting: ChatMessageConnectionBannerReconnectingPart;
};

type ChatMessageConnectionBannerFailedProps = {
  failed: ChatMessageConnectionBannerFailedPart;
};

type ChatMessageConnectionBannerContainerProps = {
  children: ReactNode;
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  style: [
    ChatMessageConnectionBannerStyles['banner'],
    ChatMessageConnectionBannerStyles['reconnecting'] | ChatMessageConnectionBannerStyles['failed']
  ];
};

type ChatMessageConnectionBannerContentProps = {
  children: ReactNode;
  style: ChatMessageConnectionBannerStyles['content'];
};

type ChatMessageConnectionBannerTextContainerProps = {
  children: ReactNode;
  style: ChatMessageConnectionBannerStyles['textContainer'];
};

type ChatMessageConnectionBannerTextProps =
  | ChatMessageConnectionBannerTextPart<ChatMessageConnectionBannerStyles['title']>
  | ChatMessageConnectionBannerTextPart<ChatMessageConnectionBannerStyles['subtitle']>
  | ChatMessageConnectionBannerTextPart<ChatMessageConnectionBannerStyles['retryButtonText']>;

type ChatMessageConnectionBannerRetryButtonProps =
  ChatMessageConnectionBannerRetryButtonPart['props'] & {
    children: ReactNode;
  };

type ChatMessageRuntimeDockStyleSlots =
  SharedChatMessageRuntimeDockStyleSlots<
    StyleProp<ViewStyle>,
    ChatComposerVoiceOverlayStyles,
    StyleProp<ViewStyle>,
    ChatMessageConnectionBannerStyles,
    ChatComposerRuntimeDockStyleSlots
  >;

type ChatMessageRuntimeDockProps =
  ChatRuntimeConversationDockMobilePropsPartsInput<
    ChatMessageResponseHistoryPanelDockProps,
    Omit<ChatMessageScrollToBottomButtonProps, 'style'>,
    Omit<ChatComposerVoiceOverlayProps, 'styles'>,
    Omit<ChatMessageQueuePanelDockProps, 'container'>,
    Omit<ChatMessageConnectionBannerProps, 'styles'>,
    Omit<ChatComposerRuntimeDockProps, 'styles'>,
    StyleProp<ViewStyle>,
    ChatComposerVoiceOverlayStyles,
    StyleProp<ViewStyle>,
    ChatMessageConnectionBannerStyles,
    ChatComposerRuntimeDockStyleSlots
  >;

type ChatMessageRuntimeDockParts =
  ChatRuntimeConversationDockMobilePropsParts<
    ChatMessageResponseHistoryPanelDockProps,
    Omit<ChatMessageScrollToBottomButtonProps, 'style'>,
    Omit<ChatComposerVoiceOverlayProps, 'styles'>,
    Omit<ChatMessageQueuePanelDockProps, 'container'>,
    Omit<ChatMessageConnectionBannerProps, 'styles'>,
    Omit<ChatComposerRuntimeDockProps, 'styles'>,
    StyleProp<ViewStyle>,
    ChatComposerVoiceOverlayStyles,
    StyleProp<ViewStyle>,
    ChatMessageConnectionBannerStyles,
    ChatComposerRuntimeDockStyleSlots
  >;

type ChatMessageRuntimeDockChromeProps = Omit<ChatMessageRuntimeDockProps, 'styles'>;

type ChatMessageRuntimeDockColors =
  & ChatRuntimeDockChromeMobileRenderStateInput['colors']
  & ResponseHistoryPanelColors
  & MessageQueuePanelColors;

type ChatMessageRuntimeDockChromePropsInput = {
  responseHistoryResponses: ResponseHistoryEntry[];
  responseHistoryTtsProvider: ChatMessageRuntimeRemoteSpeechOptions['providerId'] | undefined;
  responseHistoryRemoteTtsVoice: ChatMessageRuntimeRemoteSpeechOptions['voice'] | null | undefined;
  responseHistoryRemoteTtsModel: ChatMessageRuntimeRemoteSpeechOptions['model'] | null | undefined;
  responseHistoryTtsRate: ChatMessageRuntimeRemoteSpeechOptions['rate'] | null | undefined;
  responseHistoryTtsPitch: ChatMessageRuntimeNativeSpeechOptions['pitch'] | null | undefined;
  responseHistoryTtsVoiceId: ChatMessageRuntimeNativeSpeechOptions['voice'] | null | undefined;
  responseHistoryRemoteBaseUrl: string | undefined;
  responseHistoryRemoteApiKey: string | undefined;
  scrollToBottomVisible: ChatRuntimeDockChromeMobileRenderStateInput['scrollToBottomVisible'];
  onScrollToBottom?: (event: GestureResponderEvent) => void;
  voiceOverlayListening: boolean;
  voiceOverlayHandsFree: ChatRuntimeDockChromeMobileRenderStateInput['voiceOverlayHandsFree'];
  voiceOverlayWillCancel: ChatRuntimeDockChromeMobileRenderStateInput['voiceOverlayWillCancel'];
  voiceOverlayTranscript: string | null | undefined;
  queuePanelEnabled: ChatRuntimeDockChromeMobileRenderStateInput['queuePanelEnabled'];
  queuePanelConversationId: string;
  queuedMessages: QueuedMessage[];
  onRemoveQueuedMessage: (messageId: string) => void;
  onUpdateQueuedMessage: (messageId: string, text: string) => void;
  onRetryQueuedMessage: (messageId: string) => void;
  onProcessNextQueuedMessage: (() => void) | undefined;
  canProcessNextQueuedMessage: boolean | undefined;
  onClearQueuedMessages: () => void;
  isMessageQueuePaused: boolean | undefined;
  onPauseMessageQueue: (() => void) | undefined;
  onResumeMessageQueue: (() => void) | undefined;
  connectionState: ChatRuntimeDockChromeMobileRenderStateInput['connectionState'];
  lastFailedMessage: ChatRuntimeDockChromeMobileRenderStateInput['lastFailedMessage'];
  isResponding: ChatRuntimeDockChromeMobileRenderStateInput['isResponding'];
  colors: ChatMessageRuntimeDockColors;
  onConnectionBannerRetry?: (event: GestureResponderEvent) => void;
  composer: Omit<ChatComposerRuntimeDockProps, 'styles'>;
};

type ChatMessageRuntimeSurfaceStyleSlots =
  SharedChatMessageRuntimeSurfaceStyleSlots<
    ChatMessageConversationViewportStyleSlots['frame'],
    ChatMessageRuntimeDockStyleSlots,
    ChatMessageRuntimeViewportStyleSlots
  >;

type ChatMessageRuntimeSurfaceProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> =
  ChatRuntimeConversationSurfaceMobilePropsPartsInput<
    Pick<ChatMessageConversationFrameProps, 'keyboardAvoidingBehavior' | 'keyboardVerticalOffset'>,
    Omit<ChatMessageRuntimeDockProps, 'styles'>,
    ChatMessageRuntimeOverlaysProps,
    ChatMessageConversationRuntimeThreadListProps,
    Omit<ChatMessageRuntimeViewportProps<TPrompt, TTask>, 'children' | 'styles'>,
    ChatMessageRuntimeSurfaceStyleSlots['frame']['keyboardAvoidingStyle'],
    ChatMessageRuntimeSurfaceStyleSlots['frame']['rootStyle'],
    ChatMessageRuntimeSurfaceStyleSlots['dock'],
    ChatMessageRuntimeSurfaceStyleSlots['viewport']
  >;

type ChatMessageRuntimeSurfaceParts<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> =
  ChatRuntimeConversationSurfaceMobilePropsParts<
    Pick<ChatMessageConversationFrameProps, 'keyboardAvoidingBehavior' | 'keyboardVerticalOffset'>,
    Omit<ChatMessageRuntimeDockProps, 'styles'>,
    ChatMessageRuntimeOverlaysProps,
    ChatMessageConversationRuntimeThreadListProps,
    Omit<ChatMessageRuntimeViewportProps<TPrompt, TTask>, 'children' | 'styles'>,
    ChatMessageRuntimeSurfaceStyleSlots['frame']['keyboardAvoidingStyle'],
    ChatMessageRuntimeSurfaceStyleSlots['frame']['rootStyle'],
    ChatMessageRuntimeSurfaceStyleSlots['dock'],
    ChatMessageRuntimeSurfaceStyleSlots['viewport']
  >;

type ChatMessageRuntimeSurfaceChromeProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = Omit<ChatMessageRuntimeSurfaceProps<TPrompt, TTask>, 'children' | 'styles'>;

type ChatMessageRuntimeSurfaceChromePropsInput<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = {
  platform: ChatRuntimeSurfaceChromeMobileRenderStateInput['platform'];
  colors: ChatRuntimeSurfaceChromeMobileRenderStateInput['colors'];
  keyboardVerticalOffset: number;
  dock: ChatMessageRuntimeDockChromeProps;
  viewport: ChatMessageRuntimeViewportChromeProps<TPrompt, TTask>;
  threadStates: readonly ChatMessageConversationRenderableRuntimeThreadState[];
  threadStyles: ChatMessageRuntimeThreadStyleSlots;
  agentSelectorVisible: boolean;
  onAgentSelectorClose: () => void;
  promptEditorVisible: boolean;
  promptEditorIsEditing: boolean;
  promptEditorNameValue: string;
  onPromptEditorNameChange: (value: string) => void;
  promptEditorContentValue: string;
  onPromptEditorContentChange: (value: string) => void;
  promptEditorIsSaving: boolean;
  onPromptEditorClose: () => void;
  onPromptEditorSave: () => void;
  promptEditorStyles: ChatConversationHomePromptEditorModalStyles;
};

export type ChatMessageRuntimeChromePropsInput<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
> = {
  colors:
    & ChatComposerRuntimeDockChromeInput['colors']
    & ChatComposerRuntimeDockChromePropsInput['pendingImagesColors']
    & ChatComposerRuntimeDockChromePropsInput['composerControlColors']
    & ChatMessageRuntimeDockChromePropsInput['colors']
    & ChatMessageConversationRuntimeThreadListRenderStateInput['colors']
    & ChatMessageRuntimeViewportChromePropsInput<TPrompt, TTask>['colors']
    & ChatMessageRuntimeSurfaceChromePropsInput<TPrompt, TTask>['colors'];
  platform:
    & ChatComposerRuntimeDockChromeInput['platform']
    & ChatMessageRuntimeSurfaceChromePropsInput<TPrompt, TTask>['platform'];
  spinnerSource: ImageSourcePropType;
  styles: {
    actionStyles: ChatMessageActionStyleSlots;
    threadStyles: ChatMessageRuntimeThreadStyleSlots;
    promptEditorStyles: ChatConversationHomePromptEditorModalStyles;
  };
  composer: Omit<ChatComposerRuntimeDockChromePropsInput, 'chrome' | 'pendingImagesColors' | 'composerControlColors'>;
  dock: Omit<ChatMessageRuntimeDockChromePropsInput, 'composer' | 'colors'>;
  threadList: Omit<ChatMessageConversationRuntimeThreadListRenderStateInput, 'spinnerSource' | 'colors' | 'actionStyles'>;
  viewport: Omit<
    ChatMessageRuntimeViewportChromePropsInput<TPrompt, TTask>,
    'visibleMessageCount' | 'totalMessageCount' | 'hiddenMessageCount' | 'loadingSpinnerSource' | 'colors'
  >;
  surface: Omit<
    ChatMessageRuntimeSurfaceChromePropsInput<TPrompt, TTask>,
    'dock' | 'viewport' | 'threadStates' | 'threadStyles' | 'colors' | 'platform' | 'promptEditorStyles'
  >;
};

export type ChatMessageRuntimeChromeSurfaceProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
> = ChatMessageRuntimeChromePropsInput<TPrompt, TTask> & {
  runtimeSurface: {
    props: {
      styles: ChatMessageRuntimeSurfaceProps<TPrompt, TTask>['styles'];
    };
  };
};

type ChatComposerSpeechPreviewStyles =
  SharedChatComposerSpeechPreviewStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>
  >;

type ChatComposerSpeechPreviewProps = {
  label: string;
  text?: string | null;
  styles: ChatComposerSpeechPreviewStyles;
};

type ChatComposerSpeechPreviewParts =
  ChatComposerSpeechPreviewMobilePropsParts<
    string | null | undefined,
    ChatComposerSpeechPreviewStyles
  >;

type ChatComposerSpeechPreviewContainerProps = {
  style: ChatComposerSpeechPreviewStyles['box'];
  children: ReactNode;
};

type ChatComposerSpeechPreviewLabelProps = {
  style: ChatComposerSpeechPreviewStyles['label'];
  text: string;
};

type ChatComposerSpeechPreviewTextProps = {
  style: ChatComposerSpeechPreviewStyles['text'];
  text: string | null | undefined;
};

type ChatComposerPendingImageItem = {
  id: string;
  previewUri: string;
};

type ChatComposerPendingImagesRailStyles =
  SharedChatComposerPendingImagesRailStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ImageStyle>,
    StyleProp<ViewStyle>
  >;

type ChatComposerPendingImagesRailProps = {
  images: readonly ChatComposerPendingImageItem[];
  renderState: ChatImageAttachmentMobileRenderState;
  onRemove: (imageId: string) => void;
  styles: ChatComposerPendingImagesRailStyles;
};

type ChatComposerPendingImagesRailParts =
  ChatComposerPendingImagesRailMobilePropsParts<
    ChatComposerPendingImageItem,
    ChatImageAttachmentMobileRenderState,
    ChatComposerPendingImagesRailStyles
  >;

type ChatComposerPendingImagesRailScrollViewProps = {
  horizontal: true;
  showsHorizontalScrollIndicator: boolean;
  contentContainerStyle: ChatComposerPendingImagesRailStyles['row'];
  children: ReactNode;
};

type ChatComposerPendingImagesRailScrollViewContentProps = {
  items: ChatComposerPendingImagesRailItemPart[];
};

type ChatComposerPendingImagesRailItemPart = {
  key: string;
  card: {
    props: Omit<ChatComposerPendingImageCardProps, 'children'>;
  };
  preview: {
    props: ChatComposerPendingImagePreviewProps;
  };
  removeButton: {
    props: Omit<ChatComposerPendingImageRemoveButtonProps, 'children'>;
  };
  removeIcon: {
    props: ChatComposerPendingImageRemoveIconProps;
  };
};

type ChatComposerPendingImageCardProps = {
  style: ChatComposerPendingImagesRailStyles['card'];
  children: ReactNode;
};

type ChatComposerPendingImagePreviewProps = {
  source: {
    uri: string;
  };
  style: ChatComposerPendingImagesRailStyles['preview'];
};

type ChatComposerPendingImageRemoveButtonProps = {
  style: ChatComposerPendingImagesRailStyles['removeButton'];
  onPress: () => void;
  activeOpacity: number;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  children: ReactNode;
};

type ChatComposerPendingImageRemoveIconProps = ChatMessageActionIcon;

type ChatComposerVoiceOverlayStyles =
  SharedChatComposerVoiceOverlayStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>
  >;

type ChatComposerVoiceOverlayProps = {
  isVisible: boolean;
  label: string;
  transcript?: string | null;
  transcriptNumberOfLines: number;
  styles: ChatComposerVoiceOverlayStyles;
};

type ChatComposerVoiceOverlayParts =
  ChatComposerVoiceOverlayMobilePropsParts<
    string | null | undefined,
    number,
    ChatComposerVoiceOverlayStyles
  >;

type ChatComposerVoiceOverlayContainerProps = {
  style: ChatComposerVoiceOverlayStyles['overlay'];
  pointerEvents: 'none';
  children: ReactNode;
};

type ChatComposerVoiceOverlayCardProps = {
  style: ChatComposerVoiceOverlayStyles['card'];
  children: ReactNode;
};

type ChatComposerVoiceOverlayLabelProps = {
  style: ChatComposerVoiceOverlayStyles['label'];
  text: string;
};

type ChatComposerVoiceOverlayTranscriptProps = {
  style: ChatComposerVoiceOverlayStyles['transcript'];
  numberOfLines: number;
  text: string | null | undefined;
};

type ChatComposerHandsFreeControlsStyles =
  SharedChatComposerHandsFreeControlsStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatComposerHandsFreeControlState =
  ChatComposerHandsFreeControlsMobileControlStateLike & {
    primary: { accessibilityRole: AccessibilityRole };
    secondary: { accessibilityRole: AccessibilityRole };
  };

type ChatComposerHandsFreeControlsProps = {
  isVisible: boolean;
  status: ReactNode;
  controlState: ChatComposerHandsFreeControlState;
  onWake: (event: GestureResponderEvent) => void;
  onSleep: (event: GestureResponderEvent) => void;
  onResume: (event: GestureResponderEvent) => void;
  onPause: (event: GestureResponderEvent) => void;
  controlPressedOpacity: number;
  styles: ChatComposerHandsFreeControlsStyles;
};

type ChatComposerHandsFreeControlsParts =
  ChatComposerHandsFreeControlsMobilePropsParts<
    ReactNode,
    ChatComposerHandsFreeControlState,
    (event: GestureResponderEvent) => void,
    (event: GestureResponderEvent) => void,
    (event: GestureResponderEvent) => void,
    (event: GestureResponderEvent) => void,
    number,
    ChatComposerHandsFreeControlsStyles
  >;

type ChatComposerHandsFreeStatusRowProps = {
  style: ChatComposerHandsFreeControlsStyles['statusRow'];
  children: ReactNode;
};

type ChatComposerHandsFreeStatusRowContentProps = {
  status: {
    children: ReactNode;
  };
};

type ChatComposerHandsFreeControlsRowProps = {
  style: ChatComposerHandsFreeControlsStyles['controlsRow'];
  children: ReactNode;
};

type ChatComposerHandsFreeControlLabelProps = {
  style: ChatComposerHandsFreeControlsStyles['controlButtonText'];
  text: string;
};

type ChatComposerHandsFreeControlButtonProps = {
  style: ChatComposerHandsFreeControlsStyles['controlButton'];
  onPress: (event: GestureResponderEvent) => void;
  activeOpacity: number;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  children: ReactNode;
};

type ChatComposerHandsFreeControlPart = {
  touchable: {
    props: Omit<ChatComposerHandsFreeControlButtonProps, 'children'>;
  };
  content: {
    label: {
      props: ChatComposerHandsFreeControlLabelProps;
    };
  };
};

type ChatComposerHandsFreeControlsRowContentProps = {
  primaryControl: ChatComposerHandsFreeControlPart;
  secondaryControl: ChatComposerHandsFreeControlPart;
};

type ChatComposerHandsFreeRuntimeStatusProps = ComponentProps<typeof HandsFreeStatusChip>;

type ChatComposerRuntimeHandsFreeControlsProps =
  Omit<ChatComposerHandsFreeControlsProps, 'status' | 'styles'>
  & {
    status: ChatComposerHandsFreeRuntimeStatusProps;
  };

type ChatComposerIconButtonRenderState = {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string | null;
  accessibilityState?: AccessibilityState;
  ariaChecked?: boolean;
  isActive?: boolean;
  icon: ChatMessageActionIcon;
};

type ChatComposerIconButtonProps = {
  shouldRender?: boolean;
  renderState: ChatComposerIconButtonRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  activeOpacity: number;
  style: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
};

type ChatComposerIconButtonParts =
  ChatComposerIconButtonMobilePropsParts<
    ChatComposerIconButtonRenderState,
    (event: GestureResponderEvent) => void,
    number,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatComposerIconButtonTouchableProps = {
  style: Array<StyleProp<ViewStyle> | false | undefined>;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  activeOpacity: number | undefined;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint: string | undefined;
  accessibilityState: AccessibilityState | undefined;
  'aria-checked': boolean | undefined;
  children: ReactNode;
};

type ChatComposerIconButtonTouchableContentProps = {
  icon: {
    props: ChatComposerIconButtonIconProps;
  };
};

type ChatComposerIconButtonIconProps = ChatMessageActionIcon;

type ChatComposerLabeledActionRenderState = {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string | null;
  accessibilityState?: AccessibilityState;
  isDisabled?: boolean;
  label: string;
  icon: ChatMessageActionIcon;
};

type ChatComposerLabeledActionButtonStyles =
  SharedChatComposerLabeledActionButtonStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatComposerLabeledActionButtonProps = {
  shouldRender?: boolean;
  renderState: ChatComposerLabeledActionRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  activeOpacity: number;
  styles: ChatComposerLabeledActionButtonStyles;
};

type ChatComposerLabeledActionButtonParts =
  ChatComposerLabeledActionButtonMobilePropsParts<
    ChatComposerLabeledActionRenderState,
    (event: GestureResponderEvent) => void,
    number,
    ChatComposerLabeledActionButtonStyles
  >;

type ChatComposerLabeledActionButtonTouchableProps = {
  style: Array<StyleProp<ViewStyle> | false | undefined>;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  activeOpacity: number | undefined;
  disabled: boolean | undefined;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint: string | undefined;
  accessibilityState: AccessibilityState | undefined;
  children: ReactNode;
};

type ChatComposerLabeledActionButtonTouchableContentProps = {
  icon: {
    props: ChatComposerLabeledActionButtonIconProps;
  };
  label: {
    shouldRender: boolean;
    props: ChatComposerLabeledActionButtonLabelProps;
  };
};

type ChatComposerLabeledActionButtonIconProps = ChatMessageActionIcon;

type ChatComposerLabeledActionButtonLabelProps = {
  style: ChatComposerLabeledActionButtonStyles['text'];
  text: string;
};

type ChatComposerMicButtonRenderState = ChatComposerIconButtonRenderState & {
  ariaBusy?: boolean;
  label: string;
  labelSelectable?: boolean;
};

type ChatComposerMicButtonStyles =
  SharedChatComposerMicButtonStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<TextStyle>
  >;

type ChatComposerMicButtonWebPressedStyle = StyleProp<ViewStyle> | undefined;

type ChatComposerMicButtonProps = {
  renderState: ChatComposerMicButtonRenderState;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  onPress?: (event: GestureResponderEvent) => void;
  webPressedStyle?: ChatComposerMicButtonWebPressedStyle;
  styles: ChatComposerMicButtonStyles;
};

type ChatComposerMicButtonParts =
  ChatComposerMicButtonMobilePropsParts<
    ChatComposerMicButtonRenderState,
    (event: GestureResponderEvent) => void,
    (event: GestureResponderEvent) => void,
    (event: GestureResponderEvent) => void,
    StyleProp<ViewStyle>,
    ChatComposerMicButtonStyles
  >;

type ChatComposerMicButtonPressableProps = {
  style: Array<StyleProp<ViewStyle> | false | undefined>;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint: string | undefined;
  accessibilityState: AccessibilityState | undefined;
  'aria-busy': boolean | undefined;
  onPressIn: ((event: GestureResponderEvent) => void) | undefined;
  onPressOut: ((event: GestureResponderEvent) => void) | undefined;
  onPress: ((event: GestureResponderEvent) => void) | undefined;
  children: ReactNode;
};

type ChatComposerMicButtonPressableContentProps = {
  icon: {
    props: ChatComposerMicButtonIconProps;
  };
  label: {
    props: ChatComposerMicButtonLabelProps;
  };
};

type ChatComposerMicButtonIconProps = ChatMessageActionIcon;

type ChatComposerMicButtonLabelProps = {
  style: Array<StyleProp<TextStyle> | false | undefined>;
  selectable: boolean | undefined;
  text: string;
};

type ChatComposerTextEntryStyles =
  SharedChatComposerTextEntryStyleSlots<
    StyleProp<TextStyle>,
    StyleProp<TextStyle>
  >;

type ChatComposerTextEntryWebAccessibility = {
  isWebPlatform: boolean;
  inputDescriptionNativeId: string;
  voiceStatusLiveRegionNativeId: string;
  voiceStatusLiveRegionPoliteness: NonNullable<ComponentProps<typeof Text>['accessibilityLiveRegion']>;
};

type ChatComposerTextEntryProps = {
  inputRef?: Ref<TextInput>;
  value: string;
  onChangeText: ComponentProps<typeof TextInput>['onChangeText'];
  onKeyPress?: ComponentProps<typeof TextInput>['onKeyPress'];
  accessibilityLabel: string;
  accessibilityHint: string;
  placeholder: string;
  placeholderTextColor: string;
  voiceStatusLiveRegionAnnouncement: string;
  webAccessibility: ChatComposerTextEntryWebAccessibility;
  styles: ChatComposerTextEntryStyles;
};

type ChatComposerTextEntryParts =
  ChatComposerTextEntryMobilePropsParts<
    Ref<TextInput>,
    string,
    ComponentProps<typeof TextInput>['onChangeText'],
    ComponentProps<typeof TextInput>['onKeyPress'],
    string,
    ChatComposerTextEntryWebAccessibility,
    ChatComposerTextEntryStyles
  >;

type ChatComposerTextEntryInputProps = {
  ref: Ref<TextInput> | undefined;
  style: ChatComposerTextEntryStyles['input'];
  value: string;
  onChangeText: ComponentProps<typeof TextInput>['onChangeText'];
  onKeyPress: ComponentProps<typeof TextInput>['onKeyPress'] | undefined;
  accessibilityLabel: string;
  accessibilityHint: string;
  'aria-describedby': string | undefined;
  placeholder: string;
  placeholderTextColor: string;
  multiline: true;
};

type ChatComposerTextEntryInputDescriptionProps = {
  nativeID: string;
  style: ChatComposerTextEntryStyles['visuallyHiddenHint'];
  text: string;
};

type ChatComposerTextEntryVoiceStatusLiveRegionProps = {
  nativeID: string;
  style: ChatComposerTextEntryStyles['visuallyHiddenHint'];
  accessibilityLiveRegion: ChatComposerTextEntryWebAccessibility['voiceStatusLiveRegionPoliteness'];
  'aria-live': 'off' | 'polite' | 'assertive';
  text: string;
};

type ChatComposerInputDockStyles =
  SharedChatComposerInputDockStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatComposerInputDockProps = {
  speechPreview: ReactNode;
  pendingImagesRail: ReactNode;
  handsFreeControls: ReactNode;
  imageAttachmentControl: ReactNode;
  textToSpeechControl: ReactNode;
  editBeforeSendControl: ReactNode;
  textEntry: ReactNode;
  queueAction: ReactNode;
  submitAction: ReactNode;
  micButton: ReactNode;
  micWrapperRef?: Ref<View>;
  styles: ChatComposerInputDockStyles;
};

type ChatComposerInputDockParts =
  ChatComposerInputDockMobilePropsParts<
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    ReactNode,
    Ref<View>,
    ChatComposerInputDockStyles
  >;

type ChatComposerInputDockChildPart = {
  children: ReactNode;
};

type ChatComposerInputDockAreaProps = {
  style: ChatComposerInputDockStyles['area'];
  children: ReactNode;
};

type ChatComposerInputDockAreaContentProps = {
  speechPreview: ChatComposerInputDockChildPart;
  pendingImagesRail: ChatComposerInputDockChildPart;
  handsFreeControls: ChatComposerInputDockChildPart;
  row: {
    props: Omit<ChatComposerInputDockRowProps, 'children'>;
    content: ChatComposerInputDockRowContentProps;
  };
  micWrapper: {
    props: Omit<ChatComposerInputDockMicWrapperProps, 'children'> & {
      ref: Ref<View> | undefined;
    };
    content: ChatComposerInputDockMicWrapperContentProps;
  };
};

type ChatComposerInputDockRowProps = {
  style: ChatComposerInputDockStyles['row'];
  children: ReactNode;
};

type ChatComposerInputDockRowContentProps = {
  imageAttachmentControl: ChatComposerInputDockChildPart;
  textToSpeechControl: ChatComposerInputDockChildPart;
  editBeforeSendControl: ChatComposerInputDockChildPart;
  textEntry: ChatComposerInputDockChildPart;
  queueAction: ChatComposerInputDockChildPart;
  submitAction: ChatComposerInputDockChildPart;
};

type ChatComposerInputDockMicWrapperProps = {
  style: ChatComposerInputDockStyles['micWrapper'];
  children: ReactNode;
};

type ChatComposerInputDockMicWrapperContentProps = {
  micButton: ChatComposerInputDockChildPart;
};

type ChatMessageSurfaceProps =
  ChatRuntimeMessageSurfaceMobilePropsPartsInput<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  > & {
    children: ReactNode;
  };

type ChatMessageSurfaceParts =
  ChatRuntimeMessageSurfaceMobilePropsParts<
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatMessageSurfaceContainerProps = {
  style: Array<StyleProp<ViewStyle> | undefined>;
  children: ReactNode;
};

type ChatMessageThreadItemProps =
  ChatRuntimeMessageThreadItemMobilePropsPartsInput<
    ReactNode,
    ReactNode
  > & {
    children: ReactNode;
  };

type ChatMessageThreadItemParts =
  ChatRuntimeMessageThreadItemMobilePropsParts<
    ReactNode,
    ReactNode
  >;

type ChatMessageThreadSurfaceProps =
  ChatRuntimeMessageThreadSurfaceMobilePropsPartsInput<
    ReactNode,
    ReactNode,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  > & {
    children: ReactNode;
  };

type ChatMessageThreadSurfaceParts =
  ChatRuntimeMessageThreadSurfaceMobilePropsParts<
    ReactNode,
    ReactNode,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatMessageToolActivityGroupThreadSurfaceProps = Omit<
  ChatMessageThreadSurfaceProps,
  'leadingActivity' | 'trailingActivity' | 'surfaceStyle'
> & {
  groupRenderState?: ToolActivityGroupMobileRenderState | null;
  onToggleGroup?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolActivityGroupThreadSurfaceStyleSlots;
};

type ChatMessageToolActivityGroupThreadSurfaceParts =
  ChatRuntimeToolActivityGroupThreadSurfaceMobilePropsParts<
    ToolActivityGroupMobileRenderState,
    (event: GestureResponderEvent) => void,
    ChatMessageToolActivityGroupThreadSurfaceStyleSlots['surfaceStyle'],
    StyleProp<ViewStyle>,
    ChatMessageToolActivityGroupThreadSurfaceStyleSlots['boundary']
  >;

type ChatMessageInlineActivityProps =
  ChatRuntimeInlineActivityMobilePropsPartsInput<
    ChatRuntimeInlineActivityMobileRenderState,
    ImageSourcePropType,
    StyleProp<ViewStyle>,
    StyleProp<ImageStyle>
  >;

type ChatMessageInlineActivityParts =
  ChatRuntimeInlineActivityMobilePropsParts<
    ChatRuntimeInlineActivityMobileRenderState,
    ImageSourcePropType,
    StyleProp<ViewStyle>,
    StyleProp<ImageStyle>
  >;

type ChatMessageInlineActivitySpinnerProps = {
  source: ImageSourcePropType;
  style: StyleProp<ImageStyle>;
  resizeMode: ComponentProps<typeof Image>['resizeMode'];
};

type ChatMessageInlineActivityContainerContentProps = {
  spinner: {
    props: ChatMessageInlineActivitySpinnerProps;
  };
};

type ChatMessageInlineActivityContainerProps = {
  children: ReactNode;
  accessible: true;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityState: AccessibilityState;
  style: StyleProp<ViewStyle>;
};

type ChatMessageContentRowProps =
  ChatRuntimeMessageContentRowMobilePropsPartsInput<
    ChatMessageActionEntry,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  > & {
    children: ReactNode;
  };

type ChatMessageContentRowParts =
  ChatRuntimeMessageContentRowMobilePropsParts<
    ChatMessageActionEntry,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>
  >;

type ChatMessageContentRowContainerProps = {
  style: StyleProp<ViewStyle>;
  children: ReactNode;
};

type ChatMessageContentBodyProps = {
  style: StyleProp<ViewStyle>;
  children: ReactNode;
};

type ChatMessageExpandedContentStyles =
  SharedChatMessageExpandedContentStyleSlots<
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ImageStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>,
    StyleProp<ViewStyle>
  >;

type ChatMessageExpandedContentProps =
  ChatRuntimeConversationExpandedContentMobilePropsPartsInput<
    ChatRuntimeStreamingContentMobileRenderState,
    string,
    string,
    string,
    ImageSourcePropType,
    ChatMessageExpandedContentStyles
  >;

type ChatMessageExpandedContentParts =
  ChatRuntimeConversationExpandedContentMobilePropsParts<
    ChatRuntimeStreamingContentMobileRenderState,
    string,
    string,
    string,
    ImageSourcePropType,
    ChatMessageExpandedContentStyles
  >;

type ChatMessageExpandedContentTextPart<TStyle> = {
  text: string;
  props: {
    style: TStyle;
    numberOfLines?: TextProps['numberOfLines'];
  };
};

type ChatMessageExpandedContentTitlePart =
  ChatMessageExpandedContentTextPart<ChatMessageExpandedContentStyles['title']>;

type ChatMessageExpandedContentBadgeLabelPart =
  ChatMessageExpandedContentTextPart<ChatMessageExpandedContentStyles['badgeText']>;

type ChatMessageExpandedContentBodyTextPart =
  ChatMessageExpandedContentTextPart<ChatMessageExpandedContentStyles['text']>;

type ChatMessageExpandedContentTextProps = {
  part:
    | ChatMessageExpandedContentTitlePart
    | ChatMessageExpandedContentBadgeLabelPart
    | ChatMessageExpandedContentBodyTextPart;
};

type ChatMessageExpandedContentBadgeContentProps = {
  label: ChatMessageExpandedContentBadgeLabelPart;
};

type ChatMessageExpandedContentBadgePart = {
  props: {
    style: ChatMessageExpandedContentStyles['badge'];
  };
  content: ChatMessageExpandedContentBadgeContentProps;
};

type ChatMessageExpandedContentHeaderContentProps = {
  icon: {
    props: {
      name: IoniconName;
      size: number;
      color: string;
    };
  };
  title: ChatMessageExpandedContentTitlePart;
  spinner: {
    props: {
      source: ImageSourcePropType;
      style: ChatMessageExpandedContentStyles['spinner'];
      resizeMode: ComponentProps<typeof Image>['resizeMode'];
    };
  };
  badge: ChatMessageExpandedContentBadgePart;
};

type ChatMessageExpandedContentHeaderPart = {
  props: {
    accessible: true;
    accessibilityRole: AccessibilityRole;
    accessibilityLabel: string;
    style: ChatMessageExpandedContentStyles['header'];
  };
  content: ChatMessageExpandedContentHeaderContentProps;
};

type ChatMessageExpandedContentHeaderProps = {
  header: ChatMessageExpandedContentHeaderPart;
};

type ChatMessageExpandedContentBodyContentProps = {
  text: ChatMessageExpandedContentBodyTextPart;
  caret: {
    props: {
      style: ChatMessageExpandedContentStyles['caret'];
    };
  };
};

type ChatMessageExpandedContentBodyPart = {
  props: {
    style: ChatMessageExpandedContentStyles['bodyRow'];
  };
  content: ChatMessageExpandedContentBodyContentProps;
};

type ChatMessageExpandedContentBodyProps = {
  body: ChatMessageExpandedContentBodyPart;
};

type ChatMessageCollapsedPreviewProps =
  ChatRuntimeConversationCollapsedPreviewMobilePropsPartsInput<
    ChatMessageCollapsedPreviewNativeRenderState,
    ChatMessageCollapsedPreviewMobileActionState,
    (event: GestureResponderEvent) => void,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageCollapsedPreviewPropsInput = Pick<
  ChatMessageCollapsedPreviewProps,
  'renderState' | 'actionState' | 'onPress'
>;

type ChatMessageCollapsedPreviewParts =
  ChatRuntimeConversationCollapsedPreviewMobilePropsParts<
    ChatMessageCollapsedPreviewNativeRenderState,
    ChatMessageCollapsedPreviewMobileActionState,
    (event: GestureResponderEvent) => void,
    StyleProp<ViewStyle>,
    StyleProp<ViewStyle>,
    StyleProp<TextStyle>
  >;

type ChatMessageCollapsedPreviewNativeRenderState =
  ChatRuntimeConversationCollapsedPreviewMobileRenderState & {
    accessibilityRole: AccessibilityRole;
    hitSlop: ComponentProps<typeof Pressable>['hitSlop'];
    numberOfLines: TextProps['numberOfLines'];
    text: string;
  };

type ChatMessageCollapsedPreviewTextPart = {
  text: string;
  props: {
    style: StyleProp<TextStyle>;
    numberOfLines: TextProps['numberOfLines'];
  };
};

type ChatMessageCollapsedPreviewContentProps = {
  text: ChatMessageCollapsedPreviewTextPart;
};

type ChatMessageCollapsedPreviewTextProps = {
  part: ChatMessageCollapsedPreviewTextPart;
};

type ChatMessageConversationContentProps =
  ChatRuntimeConversationContentMobilePropsPartsInput<
    ChatMessageActionEntry,
    ChatMessageExpandedContentProps & {
      bodyStyle: StyleProp<ViewStyle>;
    },
    ChatMessageCollapsedPreviewProps,
    StyleProp<ViewStyle>
  >;

type ChatMessageConversationContentParts =
  ChatRuntimeConversationContentMobilePropsParts<
    ChatMessageActionEntry,
    ChatMessageExpandedContentProps & {
      bodyStyle: StyleProp<ViewStyle>;
    },
    ChatMessageCollapsedPreviewProps,
    StyleProp<ViewStyle>
  >;

type ChatMessageThreadBodyExpandedContentProps =
  Omit<ChatMessageExpandedContentProps, 'streamingStyles'>;

type ChatMessageThreadBodyCollapsedPreviewProps =
  Omit<ChatMessageCollapsedPreviewProps, 'style' | 'pressedStyle' | 'textStyle'>;

type ChatComposerStyleSlots =
  SharedChatComposerStyleSlots<
    ChatComposerSpeechPreviewStyles,
    ChatComposerPendingImagesRailStyles,
    ChatComposerVoiceOverlayStyles,
    ChatComposerHandsFreeControlsStyles,
    Pick<ChatComposerIconButtonProps, 'style' | 'activeStyle'>,
    ChatComposerTextEntryStyles,
    ChatComposerLabeledActionButtonStyles,
    ChatComposerLabeledActionButtonStyles,
    ChatComposerMicButtonStyles,
    ChatComposerInputDockStyles
  >;

type ChatComposerRuntimeDockStyleSlots = ChatComposerStyleSlots;

type ChatComposerRuntimeDockProps =
  ChatComposerRuntimeDockMobilePropsPartsInput<
    Omit<ChatComposerSpeechPreviewProps, 'styles'>,
    Omit<ChatComposerPendingImagesRailProps, 'styles'>,
    ChatComposerRuntimeHandsFreeControlsProps,
    Omit<ChatComposerIconButtonProps, 'style' | 'activeStyle'>,
    Omit<ChatComposerIconButtonProps, 'style' | 'activeStyle'>,
    Omit<ChatComposerIconButtonProps, 'style' | 'activeStyle'>,
    Omit<ChatComposerTextEntryProps, 'styles'>,
    Omit<ChatComposerLabeledActionButtonProps, 'styles'>,
    Omit<ChatComposerLabeledActionButtonProps, 'styles'>,
    Omit<ChatComposerMicButtonProps, 'styles'>,
    Ref<View>,
    ChatComposerSpeechPreviewStyles,
    ChatComposerPendingImagesRailStyles,
    ChatComposerHandsFreeControlsStyles,
    ChatComposerStyleSlots['accessoryButton']['style'],
    ChatComposerStyleSlots['accessoryButton']['activeStyle'],
    ChatComposerTextEntryStyles,
    ChatComposerLabeledActionButtonStyles,
    ChatComposerLabeledActionButtonStyles,
    ChatComposerMicButtonStyles,
    ChatComposerInputDockStyles
  >;

type ChatComposerRuntimeDockParts =
  ChatComposerRuntimeDockMobilePropsParts<
    Omit<ChatComposerSpeechPreviewProps, 'styles'>,
    Omit<ChatComposerPendingImagesRailProps, 'styles'>,
    ChatComposerRuntimeHandsFreeControlsProps,
    Omit<ChatComposerIconButtonProps, 'style' | 'activeStyle'>,
    Omit<ChatComposerIconButtonProps, 'style' | 'activeStyle'>,
    Omit<ChatComposerIconButtonProps, 'style' | 'activeStyle'>,
    Omit<ChatComposerTextEntryProps, 'styles'>,
    Omit<ChatComposerLabeledActionButtonProps, 'styles'>,
    Omit<ChatComposerLabeledActionButtonProps, 'styles'>,
    Omit<ChatComposerMicButtonProps, 'styles'>,
    Ref<View>,
    ChatComposerSpeechPreviewStyles,
    ChatComposerPendingImagesRailStyles,
    ChatComposerHandsFreeControlsStyles,
    ChatComposerStyleSlots['accessoryButton']['style'],
    ChatComposerStyleSlots['accessoryButton']['activeStyle'],
    ChatComposerTextEntryStyles,
    ChatComposerLabeledActionButtonStyles,
    ChatComposerLabeledActionButtonStyles,
    ChatComposerMicButtonStyles,
    ChatComposerInputDockStyles
  >;

type ChatComposerRuntimeDockChromeProps = {
  handsFreeControls: Pick<ChatComposerRuntimeHandsFreeControlsProps, 'controlPressedOpacity'>;
  imageAttachmentControl: Pick<ChatComposerIconButtonProps, 'activeOpacity'>;
  textToSpeechControl: Pick<ChatComposerIconButtonProps, 'activeOpacity'>;
  editBeforeSendControl: Pick<ChatComposerIconButtonProps, 'activeOpacity'>;
  textEntry: Pick<ChatComposerTextEntryProps, 'placeholderTextColor' | 'webAccessibility'>;
  queueAction: Pick<ChatComposerLabeledActionButtonProps, 'activeOpacity'>;
  submitAction: Pick<ChatComposerLabeledActionButtonProps, 'activeOpacity'>;
  micButton: {
    webPressedStyle?: ChatComposerMicButtonWebPressedStyle;
  };
};

type ChatComposerRuntimeDockChromeInput =
  ChatComposerRuntimeDockMobileRenderStateInput;

type ChatComposerRuntimeHandsFreeControlsRenderState =
  ChatComposerRuntimeHandsFreeControlsMobileRenderState;

type ChatComposerRuntimeDockChromePropsInput = {
  chrome: ChatComposerRuntimeDockChromeProps;
  speechPreviewText: string | null | undefined;
  pendingImages: readonly ChatComposerPendingImageItem[];
  pendingImagesColors: ChatComposerRuntimeDockMobilePropsInput['pendingImagesColors'];
  onRemovePendingImage: (imageId: string) => void;
  handsFreeStatusPhase: HandsFreePhase;
  handsFreeStatusLabel: string;
  handsFreeStatusEnabled: ChatComposerRuntimeDockMobilePropsInput['handsFreeStatusEnabled'];
  handsFreeStatusWakePhrase: ChatComposerRuntimeDockMobilePropsInput['handsFreeStatusWakePhrase'];
  handsFreeStatusSleepPhrase: ChatComposerRuntimeDockMobilePropsInput['handsFreeStatusSleepPhrase'];
  handsFreeStatusLastError: ChatComposerRuntimeDockMobilePropsInput['handsFreeStatusLastError'];
  handsFreeStatusForegroundOnly: ChatComposerRuntimeDockMobilePropsInput['handsFreeStatusForegroundOnly'];
  onWakeHandsFree: (event: GestureResponderEvent) => void;
  onSleepHandsFree: (event: GestureResponderEvent) => void;
  onResumeHandsFree: (event: GestureResponderEvent) => void;
  onPauseHandsFree: (event: GestureResponderEvent) => void;
  composerControlHasContent: ChatComposerRuntimeDockMobilePropsInput['composerControlHasContent'];
  composerControlConversationState: ChatComposerRuntimeDockMobilePropsInput['composerControlConversationState'];
  composerControlIsResponding: ChatComposerRuntimeDockMobilePropsInput['composerControlIsResponding'];
  composerControlPendingImageCount: ChatComposerRuntimeDockMobilePropsInput['composerControlPendingImageCount'];
  composerControlTtsEnabled: ChatComposerRuntimeDockMobilePropsInput['composerControlTtsEnabled'];
  composerControlEditBeforeSendEnabled: ChatComposerRuntimeDockMobilePropsInput['composerControlEditBeforeSendEnabled'];
  composerControlMicPhase: ChatComposerRuntimeDockMobilePropsInput['composerControlMicPhase'];
  composerControlListening: ChatComposerRuntimeDockMobilePropsInput['composerControlListening'];
  composerControlMessageQueueEnabled: ChatComposerRuntimeDockMobilePropsInput['composerControlMessageQueueEnabled'];
  composerControlColors: ChatComposerRuntimeDockMobilePropsInput['composerControlColors'];
  onImageAttachmentPress: ((event: GestureResponderEvent) => void) | undefined;
  onTextToSpeechPress: ((event: GestureResponderEvent) => void) | undefined;
  onEditBeforeSendPress: ((event: GestureResponderEvent) => void) | undefined;
  textEntryInputRef: Ref<TextInput> | undefined;
  textEntryValue: string;
  onTextEntryChangeText: ComponentProps<typeof TextInput>['onChangeText'];
  onTextEntryKeyPress: ComponentProps<typeof TextInput>['onKeyPress'];
  textEntryHandsFree: ChatComposerRuntimeDockMobilePropsInput['textEntryHandsFree'];
  textEntryListening: ChatComposerRuntimeDockMobilePropsInput['textEntryListening'];
  textEntryWillCancel: ChatComposerRuntimeDockMobilePropsInput['textEntryWillCancel'];
  textEntryLiveTranscript: ChatComposerRuntimeDockMobilePropsInput['textEntryLiveTranscript'];
  textEntryWakePhrase: ChatComposerRuntimeDockMobilePropsInput['textEntryWakePhrase'];
  textEntryPlaceholderFallback?: ChatComposerRuntimeDockMobilePropsInput['textEntryPlaceholderFallback'];
  onQueueActionPress: ((event: GestureResponderEvent) => void) | undefined;
  onSubmitActionPress: ((event: GestureResponderEvent) => void) | undefined;
  onMicPressIn: ((event: GestureResponderEvent) => void) | undefined;
  onMicPressOut: ((event: GestureResponderEvent) => void) | undefined;
  onMicPress: ((event: GestureResponderEvent) => void) | undefined;
  micWrapperRef?: Ref<View>;
};

export type ChatMessageThreadBodyStyleSlots =
  SharedChatMessageThreadBodyStyleSlots<
    ChatMessageRetryStatusStyles,
    ChatMessageDelegationCardStyles,
    ChatMessageToolApprovalStyles,
    Pick<ChatMessageInlineActivityProps, 'style' | 'spinnerStyle'>,
    {
      rowStyle: StyleProp<ViewStyle>;
      expandedBodyStyle: StyleProp<ViewStyle>;
      streamingStyles: ChatMessageExpandedContentStyles;
      collapsedStyle: StyleProp<ViewStyle>;
      collapsedPressedStyle: StyleProp<ViewStyle>;
      collapsedTextStyle: StyleProp<TextStyle>;
    },
    ChatMessageToolExecutionStackStyles,
    Pick<ChatMessageStandaloneActionsProps, 'rowStyle'>
  >;

type ChatMessageToolActivityGroupThreadSurfaceStyleSlots =
  SharedChatMessageToolActivityGroupThreadSurfaceStyleSlots<
    StyleProp<ViewStyle>,
    ChatMessageToolActivityGroupBoundaryStyles,
    ChatRuntimeConversationSurfaceToneMobileStyleSlot,
    StyleProp<ViewStyle>
  >;

type ChatMessageThreadBodyContentProps =
  Omit<ChatMessageConversationContentProps, 'rowStyle' | 'expanded' | 'collapsed'>
  & {
    expanded: ChatMessageThreadBodyExpandedContentProps;
    collapsed: ChatMessageThreadBodyCollapsedPreviewProps;
  };

type ChatMessageExpandedContentPropsInput = Pick<
  ChatMessageThreadBodyExpandedContentProps,
  'streamingRenderState' | 'markdownContent' | 'assetBaseUrl' | 'assetAuthToken' | 'spinnerSource'
>;

type ChatMessageConversationBodyProps = {
  content: ChatMessageThreadBodyContentProps;
  toolExecutionStack: Omit<ChatMessageToolExecutionStackProps, 'styles'>;
  standaloneActions: Omit<ChatMessageStandaloneActionsProps, 'rowStyle'>;
};

type ChatMessageThreadBodyProps = {
  bodyDisplayMode: ChatRuntimeConversationThreadBodyMobileDisplayMode;
  styles: ChatMessageThreadBodyStyleSlots;
  retryStatus?: Omit<ChatMessageRetryStatusProps, 'styles'> | null;
  delegationCard?: Omit<ChatMessageDelegationCardProps, 'styles'> | null;
  toolApproval?: Omit<ChatMessageToolApprovalProps, 'styles'> | null;
  inlineActivity?: Omit<ChatMessageInlineActivityProps, 'style' | 'spinnerStyle'> | null;
  conversation: ChatMessageConversationBodyProps;
};

type ChatMessageThreadBodyParts =
  ChatRuntimeConversationThreadBodyMobilePropsParts<
    Omit<ChatMessageRetryStatusProps, 'styles'>,
    Omit<ChatMessageDelegationCardProps, 'styles'>,
    Omit<ChatMessageToolApprovalProps, 'styles'>,
    Omit<ChatMessageInlineActivityProps, 'style' | 'spinnerStyle'>,
    ChatMessageThreadBodyContentProps,
    Omit<ChatMessageToolExecutionStackProps, 'styles'>,
    Omit<ChatMessageStandaloneActionsProps, 'rowStyle'>,
    ChatMessageThreadBodyStyleSlots['retryStatus'],
    ChatMessageThreadBodyStyleSlots['delegationCard'],
    ChatMessageThreadBodyStyleSlots['toolApproval'],
    ChatMessageThreadBodyStyleSlots['inlineActivity']['style'],
    ChatMessageThreadBodyStyleSlots['inlineActivity']['spinnerStyle'],
    ChatMessageThreadBodyStyleSlots['content']['rowStyle'],
    ChatMessageThreadBodyStyleSlots['content']['expandedBodyStyle'],
    ChatMessageThreadBodyStyleSlots['content']['streamingStyles'],
    ChatMessageThreadBodyStyleSlots['content']['collapsedStyle'],
    ChatMessageThreadBodyStyleSlots['content']['collapsedPressedStyle'],
    ChatMessageThreadBodyStyleSlots['content']['collapsedTextStyle'],
    ChatMessageThreadBodyStyleSlots['toolExecutionStack'],
    ChatMessageThreadBodyStyleSlots['standaloneActions']['rowStyle']
  >;

type ChatMessageConversationBodyPropsInput = {
  surfaceToneStyleSlot: ChatRuntimeConversationSurfaceToneMobileStyleSlot;
  contentDisplayMode: ChatRuntimeConversationContentMobileDisplayMode;
  actionSet: ChatMessageActionSetInput;
  expanded: ChatMessageExpandedContentPropsInput;
  collapsed: ChatMessageCollapsedPreviewPropsInput;
  toolExecutionStack: ChatMessageToolExecutionStackPropsInput;
};

type ChatMessageThreadBodyPropsInput =
  Pick<ChatMessageThreadBodyProps, 'bodyDisplayMode' | 'inlineActivity'>
  & {
    retryStatus: ChatMessageRetryStatusPropsInput;
    delegationCard: ChatMessageDelegationCardPropsInput;
    toolApproval: ChatMessageToolApprovalPropsInput;
    conversation: ChatMessageConversationBodyPropsInput;
  };

type ChatMessageConversationThreadBodySharedInput =
  ChatRuntimeConversationThreadBodyMobileStateInput<
    ChatMessageActionStyleSlots['turnDuration'],
    ChatMessageActionStyleSlots['speech'],
    ChatMessageActionStyleSlots['branch'],
    ChatMessageActionStyleSlots['copy'],
    ChatMessageActionStyleSlots['expansion'],
    ChatRuntimeStreamingContentMobileRenderStateInput['colors'],
    ChatMessageExpandedContentPropsInput['spinnerSource'],
    NonNullable<ChatMessageExpandedContentPropsInput['assetBaseUrl']>,
    NonNullable<ChatMessageExpandedContentPropsInput['assetAuthToken']>,
    AgentRetryInfo | null | undefined,
    ACPDelegationProgress | null | undefined
  >;

type ChatMessageConversationThreadBodyInput = ChatMessageConversationThreadBodySharedInput;

export type ChatMessageRuntimeThreadStyleSlots =
  SharedChatMessageRuntimeThreadStyleSlots<
    ChatMessageToolActivityGroupThreadSurfaceStyleSlots,
    ChatMessageThreadBodyStyleSlots
  >;

export type ChatMessageConversationThreadStyleSlots =
  SharedChatMessageConversationThreadStyleSlots<
    ChatMessageToolActivityGroupThreadSurfaceStyleSlots,
    ChatMessageThreadBodyStyleSlots,
    ChatMessageActionStyleSlots
  >;

type ChatMessageRuntimeThreadProps = Omit<
  ChatMessageToolActivityGroupThreadSurfaceProps,
  'children' | 'styles' | 'surfaceToneStyle'
> & {
  body?: ChatMessageThreadBodyPropsInput | null;
  styles: ChatMessageRuntimeThreadStyleSlots;
};

type ChatMessageRuntimeThreadParts =
  ChatRuntimeConversationRuntimeThreadMobilePropsParts<
    ToolActivityGroupMobileRenderState,
    ChatMessageThreadBodyPropsInput,
    (event: GestureResponderEvent) => void,
    ChatMessageRuntimeThreadStyleSlots['body'],
    ChatMessageRuntimeThreadStyleSlots['surface']
  >;

type ChatMessageConversationToolActivityGroupThreadRenderStateInput =
  ChatRuntimeConversationToolActivityGroupThreadRenderStateInput;

type ChatMessageConversationRenderableRuntimeThreadState =
  ChatRuntimeConversationRenderableRuntimeThreadState<ChatMessageThreadBodyPropsInput | null>;

type ChatMessageConversationMessageRuntimeThreadStateInput =
  ChatRuntimeConversationMessageRuntimeThreadStateInput<ChatMessageThreadBodyPropsInput>;

type ChatMessageConversationMessageThreadRenderStateInput =
  Omit<ChatMessageConversationThreadBodyInput, 'renderContext'>
  & Pick<
    ChatMessageConversationRenderContextInput,
    'lastConversationContentMessageIndex' | 'expandedMessages' | 'resultOnlyToolLabel'
  >
  & Pick<
    ChatMessageConversationMessageRuntimeThreadStateInput,
    'itemKey' | 'groupRenderState' | 'groupThreadState'
  >;

type ChatMessageConversationItemThreadRenderStateInput =
  ChatMessageConversationToolActivityGroupThreadRenderStateInput
  & Omit<
    ChatMessageConversationMessageThreadRenderStateInput,
    'itemKey' | 'groupRenderState' | 'groupThreadState'
  >;

type ChatMessageConversationThreadListRenderStateInput =
  Omit<
    ChatMessageConversationItemThreadRenderStateInput,
    | 'group'
    | 'itemIndex'
    | 'itemKey'
    | 'message'
    | 'messageIndex'
    | 'isSpeaking'
    | 'isCopied'
    | 'lastConversationContentMessageIndex'
  >
  & {
    allMessages: readonly ChatMessageConversationItemThreadRenderStateInput['message'][];
    messages: readonly ChatMessageConversationItemThreadRenderStateInput['message'][];
    firstMessageIndex: number;
    groupByIndex: ReadonlyMap<number, ChatMessageRuntimeToolActivityGroup>;
    speakingMessageIndex: number | null;
    copiedMessageIndex: number | null;
  };

type ChatMessageRuntimeHistoryWindowStateInput = {
  messageCount: number;
  sessionId?: string | null;
};

type ChatMessageRuntimeHistoryWindowState = ReturnType<typeof getChatRuntimeMessageHistoryWindowMobileState> & {
  visibleMessageCount: number;
  loadEarlierMessages: () => void;
};

type ChatMessageRuntimeBranchProgressStateInput = {
  sessionId?: string | null;
};

type ChatMessageRuntimeBranchProgressState = {
  pendingBranchMessageIndex: number | null;
  beginBranchMessage: (messageIndex: number) => void;
  clearBranchMessage: () => void;
};

type ChatMessageRuntimeBranchClient = {
  branchConversation: (
    conversationId: string,
    input: { messageIndex: number },
  ) => Promise<{ id: string }>;
};

type ChatMessageRuntimeBranchSession = {
  id: string;
};

type ChatMessageRuntimeBranchSessionStore<TBranchClient extends ChatMessageRuntimeBranchClient> = {
  syncWithServer: (client: TBranchClient) => unknown | Promise<unknown>;
  findSessionByServerConversationId: (conversationId: string) => ChatMessageRuntimeBranchSession | null | undefined;
  setCurrentSession: (sessionId: string) => void;
};

type ChatMessageRuntimeBranchActionsStateInput<TBranchClient extends ChatMessageRuntimeBranchClient> = {
  branchClient?: TBranchClient | null;
  serverConversationId?: string | null;
  sessionStore: ChatMessageRuntimeBranchSessionStore<TBranchClient>;
  beginBranchMessage: (messageIndex: number) => void;
  clearBranchMessage: () => void;
  navigateToChat: () => void;
  showAlert: (title: string, message: string) => void;
};

type ChatMessageRuntimeBranchChromeActionsStateInput<TBranchClient extends ChatMessageRuntimeBranchClient> = Omit<
  ChatMessageRuntimeBranchActionsStateInput<TBranchClient>,
  'showAlert'
>;

type ChatMessageRuntimeBranchActionsState = {
  handleBranchFromMessage: (messageIndex: number) => Promise<void>;
  handleBranchFromMessagePress: (messageIndex: number) => void;
};

type ChatRuntimeCurrentSessionPinSessionStore = {
  currentSessionId: string | null;
  toggleSessionPinned: (sessionId: string) => unknown | Promise<unknown>;
};

type ChatRuntimeCurrentSessionPinActionsStateInput = {
  sessionStore: ChatRuntimeCurrentSessionPinSessionStore;
};

type ChatRuntimeCurrentSessionPinActionsState = {
  handleToggleCurrentSessionPinned: () => void;
};

type ChatRuntimeBackToSessionsNavigation = {
  navigate: (screenName: 'Sessions') => void;
};

type ChatRuntimeNavigateToChatNavigation = {
  navigate: (screenName: 'Chat') => void;
};

type ChatRuntimeBackToSessionsActionsStateInput = {
  navigation: ChatRuntimeBackToSessionsNavigation;
};

type ChatRuntimeNavigateToChatActionsStateInput = {
  navigation: ChatRuntimeNavigateToChatNavigation;
};

type ChatRuntimeBackToSessionsActionsState = {
  handleBackToSessions: () => void;
};

type ChatRuntimeNavigateToChatActionsState = {
  navigateToChat: () => void;
};

type ChatMessageRuntimeKillSwitchClient = {
  killSwitch: () => Promise<ChatRuntimeKillSwitchResultLike>;
};

type ChatMessageRuntimeKillSwitchNativeConfirmInput = Pick<
  ChatRuntimeKillSwitchConfirmationAlertState,
  'title' | 'message' | 'cancelLabel' | 'confirmLabel'
> & {
  onConfirm: () => void;
};

type ChatMessageRuntimeKillSwitchActionsStateInput<
  TKillSwitchClient extends ChatMessageRuntimeKillSwitchClient,
> = {
  platform: string;
  getKillSwitchClient: () => TKillSwitchClient | null | undefined;
  confirmWeb: (message: string) => boolean;
  showWebAlert: (message: string) => void;
  confirmNative: (input: ChatMessageRuntimeKillSwitchNativeConfirmInput) => void;
  showAlert: (title: string, message: string) => void;
};

type ChatMessageRuntimeKillSwitchChromeActionsStateInput<
  TKillSwitchClient extends ChatMessageRuntimeKillSwitchClient,
> = Omit<
  ChatMessageRuntimeKillSwitchActionsStateInput<TKillSwitchClient>,
  'confirmWeb' | 'showWebAlert' | 'confirmNative' | 'showAlert'
>;

type ChatMessageRuntimeKillSwitchActionsState = {
  handleKillSwitch: () => Promise<void>;
};

export function showChatMessageRuntimeKillSwitchNativeConfirmAlert(
  input: ChatMessageRuntimeKillSwitchNativeConfirmInput,
  showAlert: ChatRuntimeNativeConfirmAlertPresenter,
): void {
  showAlert(input.title, input.message, [
    { text: input.cancelLabel, style: 'cancel' },
    {
      text: input.confirmLabel,
      style: 'destructive',
      onPress: input.onConfirm,
    },
  ]);
}

export function createChatMessageRuntimeKillSwitchNativeConfirmPresenter(
  showAlert: ChatRuntimeNativeConfirmAlertPresenter,
): (input: ChatMessageRuntimeKillSwitchNativeConfirmInput) => void {
  return (input) => showChatMessageRuntimeKillSwitchNativeConfirmAlert(input, showAlert);
}

type ChatMessageRuntimeToolApprovalResponseStateInput = {
  sessionId?: string | null;
};

type ChatMessageRuntimeToolApprovalResponseState = {
  pendingToolApprovalResponseId: string | null;
  beginToolApprovalResponse: (approvalId: string) => void;
  clearToolApprovalResponse: () => void;
};

type ChatMessageRuntimeToolApprovalResponseClient = {
  respondToToolApproval: (approvalId: string, approved: boolean) => Promise<{ success: boolean }>;
};

type ChatMessageRuntimeToolApprovalActionsStateInput<
  TMessage extends ChatMessageRuntimeToolApprovalStateMessageLike,
> = {
  approvalClient?: ChatMessageRuntimeToolApprovalResponseClient | null;
  beginToolApprovalResponse: (approvalId: string) => void;
  clearToolApprovalResponse: () => void;
  setMessages: Dispatch<SetStateAction<TMessage[]>>;
  showAlert: (title: string, message: string) => void;
};

type ChatMessageRuntimeToolApprovalChromeActionsStateInput<
  TMessage extends ChatMessageRuntimeToolApprovalStateMessageLike,
> = Omit<ChatMessageRuntimeToolApprovalActionsStateInput<TMessage>, 'showAlert'>;

type ChatMessageRuntimeToolApprovalActionsState = {
  respondToToolApproval: (approvalId: string, approved: boolean) => Promise<void>;
};

type ChatMessageRuntimeQueueMessage = {
  id: string;
};

type ChatMessageRuntimeQueueController<TQueuedMessage extends ChatMessageRuntimeQueueMessage> = {
  getQueue: (conversationId: string) => TQueuedMessage[];
  isQueuePaused: (conversationId: string) => boolean;
  peek: (conversationId: string) => TQueuedMessage | null;
  markProcessing: (conversationId: string, messageId: string) => boolean;
  pauseQueue: (conversationId: string) => void;
  resumeQueue: (conversationId: string) => void;
  removeFromQueue: (conversationId: string, messageId: string) => boolean;
  updateText: (conversationId: string, messageId: string, text: string) => boolean;
  resetToPending: (conversationId: string, messageId: string) => boolean;
  clearQueue: (conversationId: string) => void;
};

type ChatMessageRuntimeQueuePanelStateInput<
  TQueuedMessage extends ChatMessageRuntimeQueueMessage,
> = {
  currentConversationId: string;
  queue: ChatMessageRuntimeQueueController<TQueuedMessage>;
  responding: boolean;
  handsFree: boolean;
  handsFreePhase: HandsFreePhase;
  handsFreeRef: ChatRuntimeMutableRef<boolean>;
  handsFreePhaseRef: ChatRuntimeMutableRef<HandsFreePhase>;
  processQueuedMessage: (queuedMessage: TQueuedMessage) => void | Promise<void>;
  processDelayMs?: number;
};

type ChatMessageRuntimeNextQueuedMessageSchedulerInput<
  TQueuedMessage extends ChatMessageRuntimeQueueMessage,
> = {
  currentConversationId: string;
  queue: Pick<ChatMessageRuntimeQueueController<TQueuedMessage>, 'isQueuePaused' | 'peek' | 'markProcessing'>;
  canProcessQueue?: boolean;
  handsFree: boolean;
  handsFreePhase?: HandsFreePhase;
  handsFreeRef: ChatRuntimeMutableRef<boolean>;
  handsFreePhaseRef: ChatRuntimeMutableRef<HandsFreePhase>;
  processQueuedMessage: (queuedMessage: TQueuedMessage) => void | Promise<void>;
  processDelayMs?: number;
  log?: (message?: unknown, ...optionalParams: unknown[]) => void;
  logMessage?: string;
};

type ChatMessageRuntimeQueuePanelState<TQueuedMessage extends ChatMessageRuntimeQueueMessage> = {
  queuedMessages: TQueuedMessage[];
  isMessageQueuePaused: boolean;
  nextQueuedMessage: TQueuedMessage | null;
  handleProcessNextQueuedMessage: () => void;
  handlePauseMessageQueue: () => void;
  handleResumeMessageQueue: () => void;
  handleRemoveQueuedMessage: (messageId: string) => void;
  handleUpdateQueuedMessage: (messageId: string, text: string) => void;
  handleRetryQueuedMessage: (messageId: string) => void;
  handleClearQueuedMessages: () => void;
};

type ChatMessageRuntimeScrollControllerInput = {
  messages: readonly unknown[];
  sessionId?: string | null;
  visibleMessageCount: number;
  bottomResumeThresholdPx: number;
  topLoadThresholdPx: number;
  dragEndDebounceMs: number;
  onLoadEarlierMessages: () => void;
  autoScrollDelayMs?: number;
  sessionResetScrollDelayMs?: number;
};

type ChatMessageConversationRuntimeThreadListRenderStateInput =
  Omit<
    ChatMessageConversationThreadListRenderStateInput,
    'allMessages' | 'messages' | 'firstMessageIndex' | 'presentation' | 'resultOnlyToolLabel'
  >
  & {
    resultOnlyToolLabel?: ChatMessageConversationThreadListRenderStateInput['resultOnlyToolLabel'];
  }
  & ChatRuntimeMessageHistoryWindowMobileDisplayStateInput<
    ChatMessageConversationThreadListRenderStateInput['messages'][number]
  >;

type ChatMessageConversationRuntimeThreadListProps = {
  threadStates: readonly ChatMessageConversationRenderableRuntimeThreadState[];
  styles: ChatMessageRuntimeThreadStyleSlots;
};

type ChatMessageConversationRuntimeThreadListParts =
  ChatRuntimeConversationRuntimeThreadListMobilePropsParts<
    ChatMessageConversationRenderableRuntimeThreadState,
    ChatMessageRuntimeThreadStyleSlots
  >;

type ChatMessageConversationRuntimeThreadListThreadProps = {
  groupRenderState: ToolActivityGroupMobileRenderState | null;
  onToggleGroup: (() => void) | undefined;
  body: ChatMessageThreadBodyPropsInput | null;
  styles: ChatMessageRuntimeThreadStyleSlots;
};

type ChatMessageConversationRuntimeThreadListContentProps = {
  threads: Array<{
    key: string | number;
    props: ChatMessageConversationRuntimeThreadListThreadProps;
  }>;
};

export function ChatMessageActionIconButton(props: ChatMessageActionIconButtonProps) {
  const actionIconButtonParts: ChatMessageActionIconButtonParts =
    createChatRuntimeMessageActionIconButtonMobilePropsParts(props);

  return (
    <ChatMessageActionIconButtonPressable
      {...actionIconButtonParts.pressable.props}
    >
      <ChatMessageActionIconButtonPressableContent
        {...actionIconButtonParts.pressable.content}
      />
    </ChatMessageActionIconButtonPressable>
  );
}

export function ChatMessageActionIconButtonPressableContent({
  activityIndicator,
  icon,
}: ChatMessageActionIconButtonPressableContentProps) {
  if (activityIndicator.shouldRender) {
    return (
      <ChatMessageActionIconButtonActivityIndicator
        {...activityIndicator.props}
      />
    );
  }

  if (icon.shouldRender) {
    return (
      <ChatMessageActionIconButtonIcon
        {...icon.props}
      />
    );
  }

  return null;
}

export function ChatMessageActionIconButtonPressable({
  children,
  ...props
}: ChatMessageActionIconButtonPressableProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatMessageActionIconButtonActivityIndicator(
  props: ChatMessageActionIconButtonActivityIndicatorProps
) {
  return <ActivityIndicator {...props} />;
}

export function ChatMessageActionIconButtonIcon(
  props: ChatMessageActionIconButtonIconProps
) {
  return <Ionicons {...props} />;
}

function renderChatMessageActionButton(spec: ChatMessageActionButtonSpec) {
  const actionButtonProps = createChatRuntimeMessageActionIconButtonMobileProps({
    spec,
  });

  return (
    <ChatMessageActionIconButton
      {...actionButtonProps}
    />
  );
}

export function useChatMessageRuntimeHistoryWindowState({
  messageCount,
  sessionId,
}: ChatMessageRuntimeHistoryWindowStateInput): ChatMessageRuntimeHistoryWindowState {
  const historyWindow = useMemo(() => getChatRuntimeMessageHistoryWindowMobileState(), []);
  const [visibleMessageCount, setVisibleMessageCount] = useState<number>(
    historyWindow.initialVisibleCount,
  );
  const loadEarlierMessages = useCallback(() => {
    setVisibleMessageCount((currentVisibleCount) =>
      getChatRuntimeMessageHistoryWindowMobileExpandedVisibleCount({
        currentVisibleCount,
        messageCount,
        loadIncrement: historyWindow.loadIncrement,
      }),
    );
  }, [historyWindow.loadIncrement, messageCount]);

  useEffect(() => {
    setVisibleMessageCount(historyWindow.initialVisibleCount);
  }, [historyWindow.initialVisibleCount, sessionId]);

  useEffect(() => {
    setVisibleMessageCount((currentVisibleCount) =>
      getChatRuntimeMessageHistoryWindowMobileClampedVisibleCount({
        currentVisibleCount,
        messageCount,
        initialVisibleCount: historyWindow.initialVisibleCount,
      }),
    );
  }, [historyWindow.initialVisibleCount, messageCount]);

  return {
    ...historyWindow,
    visibleMessageCount,
    loadEarlierMessages,
  };
}

export function useChatMessageRuntimeScrollController({
  messages,
  sessionId,
  visibleMessageCount,
  bottomResumeThresholdPx,
  topLoadThresholdPx,
  dragEndDebounceMs,
  onLoadEarlierMessages,
  autoScrollDelayMs = 50,
  sessionResetScrollDelayMs = 100,
}: ChatMessageRuntimeScrollControllerInput) {
  const scrollRef = useRef<ChatMessageScrollViewportRef>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const isUserDraggingRef = useRef(false);
  const dragEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    shouldAutoScrollRef.current = shouldAutoScroll;
    if (!shouldAutoScroll && scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, [shouldAutoScroll]);

  const onScrollBeginDrag = useCallback(() => {
    if (dragEndTimeoutRef.current) {
      clearTimeout(dragEndTimeoutRef.current);
      dragEndTimeoutRef.current = null;
    }
    isUserDraggingRef.current = true;
  }, []);

  const onScrollEndDrag = useCallback(() => {
    if (dragEndTimeoutRef.current) {
      clearTimeout(dragEndTimeoutRef.current);
    }
    dragEndTimeoutRef.current = setTimeout(() => {
      isUserDraggingRef.current = false;
      dragEndTimeoutRef.current = null;
    }, dragEndDebounceMs);
  }, [dragEndDebounceMs]);

  const onScroll = useCallback((event: ChatMessageScrollEvent) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = getChatRuntimeMessageHistoryWindowMobileIsAtBottom({
      viewportHeight: layoutMeasurement.height,
      scrollOffsetY: contentOffset.y,
      contentHeight: contentSize.height,
      bottomResumeThresholdPx,
    });
    const shouldLoadEarlier = getChatRuntimeMessageHistoryWindowMobileShouldLoadEarlier({
      scrollOffsetY: contentOffset.y,
      visibleMessageCount,
      messageCount: messages.length,
      topLoadThresholdPx,
    });

    if (isAtBottom && !shouldAutoScroll) {
      setShouldAutoScroll(true);
    } else if (!isAtBottom && shouldAutoScroll && isUserDraggingRef.current) {
      setShouldAutoScroll(false);
    }
    if (shouldLoadEarlier) {
      onLoadEarlierMessages();
    }
  }, [
    bottomResumeThresholdPx,
    messages.length,
    onLoadEarlierMessages,
    shouldAutoScroll,
    topLoadThresholdPx,
    visibleMessageCount,
  ]);

  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        if (shouldAutoScrollRef.current && scrollRef.current) {
          scrollRef.current.scrollToEnd({ animated: true });
        }
      }, autoScrollDelayMs);
    }
  }, [autoScrollDelayMs, messages, shouldAutoScroll]);

  useEffect(() => {
    setShouldAutoScroll(true);
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, sessionResetScrollDelayMs);
    return () => clearTimeout(timeoutId);
  }, [sessionId, sessionResetScrollDelayMs]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
      }
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    setShouldAutoScroll(true);
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  return {
    scrollRef,
    shouldAutoScroll,
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    scrollToBottom,
  };
}

export function useChatComposerRuntimeImageAttachmentPickerState({
  pendingImages,
  setPendingImages,
  pickImages,
  showAlert,
  now = Date.now,
}: ChatComposerRuntimeImageAttachmentPickerStateInput): ChatComposerRuntimeImageAttachmentPickerState {
  const showImageAttachmentAlert = useCallback((input: ChatImageAttachmentMobileAlertInput) => {
    const alertState = getChatImageAttachmentMobileAlertState(input);
    showAlert(alertState.title, alertState.message);
  }, [showAlert]);

  const handlePickImages = useCallback(async () => {
    if (pendingImages.length >= CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxImages) {
      showImageAttachmentAlert({
        reason: 'limitReached',
        maxImages: CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxImages,
      });
      return;
    }

    const existingEmbeddedBytes = pendingImages.reduce(
      (sum, image) => sum + getChatComposerRuntimeImageDataUrlBytes(image.dataUrl),
      0
    );
    if (existingEmbeddedBytes >= CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxTotalEmbeddedBytes) {
      showImageAttachmentAlert({
        reason: 'budgetReached',
        maxBytes: CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxTotalEmbeddedBytes,
      });
      return;
    }

    try {
      const slotsRemaining = CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxImages - pendingImages.length;
      const result = await pickImages(slotsRemaining);

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const selectedAssets = result.assets.slice(0, slotsRemaining);
      const nextImages: ChatComposerRuntimeImageAttachment[] = [];
      const missingBase64Names: string[] = [];
      const oversizedImageNames: string[] = [];
      const unknownMimeNames: string[] = [];
      const budgetExceededNames: string[] = [];
      let runningEmbeddedBytes = existingEmbeddedBytes;

      selectedAssets.forEach((asset, index) => {
        const displayName = asset.fileName || `Image ${index + 1}`;
        if (!asset.base64) {
          missingBase64Names.push(displayName);
          return;
        }

        const inferredBytes = getChatComposerRuntimeBase64ImageBytes(asset.base64);
        const fileSizeBytes = typeof asset.fileSize === 'number' && asset.fileSize > 0
          ? asset.fileSize
          : inferredBytes;
        if (fileSizeBytes > CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxFileBytes) {
          oversizedImageNames.push(displayName);
          return;
        }

        const mimeType = inferChatComposerRuntimeImageMimeType(asset);
        if (!mimeType) {
          unknownMimeNames.push(displayName);
          return;
        }

        const dataUrl = `data:${mimeType};base64,${asset.base64}`;
        const embeddedBytes = getChatComposerRuntimeImageDataUrlBytes(dataUrl) || inferredBytes;
        if (runningEmbeddedBytes + embeddedBytes > CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxTotalEmbeddedBytes) {
          budgetExceededNames.push(displayName);
          return;
        }
        runningEmbeddedBytes += embeddedBytes;

        const timestamp = now();
        const fileName = asset.fileName || `image-${timestamp}-${index + 1}`;
        nextImages.push({
          id: `${timestamp}-${index}-${asset.uri}`,
          name: fileName,
          previewUri: asset.uri,
          dataUrl,
        });
      });

      if (nextImages.length > 0) {
        setPendingImages((prev) => [...prev, ...nextImages]);
      }

      if (missingBase64Names.length > 0) {
        showImageAttachmentAlert({
          reason: 'missingData',
          names: missingBase64Names,
        });
      }

      if (oversizedImageNames.length > 0) {
        showImageAttachmentAlert({
          reason: 'selectionTooLarge',
          names: oversizedImageNames,
          maxBytes: CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxFileBytes,
        });
      }

      if (unknownMimeNames.length > 0) {
        showImageAttachmentAlert({
          reason: 'unsupportedFormat',
          names: unknownMimeNames,
        });
      }

      if (budgetExceededNames.length > 0) {
        showImageAttachmentAlert({
          reason: 'budgetExceeded',
          names: budgetExceededNames,
          maxBytes: CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS.maxTotalEmbeddedBytes,
        });
      }
    } catch (error: unknown) {
      showImageAttachmentAlert({
        reason: 'pickerError',
        error,
      });
    }
  }, [now, pendingImages, pickImages, setPendingImages, showImageAttachmentAlert]);

  return {
    handlePickImages,
  };
}

export function useChatComposerRuntimeImageLibraryPickerState(
  input: ChatComposerRuntimeImageLibraryPickerStateInput,
): ChatComposerRuntimeImageAttachmentPickerState {
  const pickComposerImages = useCallback(
    (selectionLimit: number) => ImagePicker.launchImageLibraryAsync(
      createChatComposerRuntimeImagePickerLaunchOptions({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        selectionLimit,
      })
    ),
    []
  );

  return useChatComposerRuntimeImageAttachmentPickerState({
    ...input,
    pickImages: pickComposerImages,
    showAlert: Alert.alert,
  });
}

export function useChatMessageRuntimeTurnDurations({
  messages,
  conversationState,
  isResponding = false,
}: ChatMessageRuntimeTurnDurationStateInput): ReturnType<typeof computeChatMessageRuntimeTurnDurations> {
  const hasLiveAgentTurn = hasChatMessageRuntimeLiveAgentTurn({
    conversationState,
    isResponding,
  });
  const [turnNow, setTurnNow] = useState(() => Date.now());
  useEffect(() => {
    setTurnNow(Date.now());
    if (!hasLiveAgentTurn) return undefined;
    const id = setInterval(() => setTurnNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasLiveAgentTurn]);

  const turnDurationMessages = useMemo(
    () => createChatMessageRuntimeTurnDurationMessages(messages),
    [messages],
  );

  return useMemo(
    () => computeChatMessageRuntimeTurnDurations(turnDurationMessages, !hasLiveAgentTurn, turnNow),
    [hasLiveAgentTurn, turnDurationMessages, turnNow],
  );
}

export function useChatMessageRuntimeRemoteSpeechSettingsState(
  initialSettings: ChatRuntimeRemoteSpeechSettingsState = getChatRuntimeDefaultRemoteSpeechSettingsState(),
): ChatMessageRuntimeRemoteSpeechSettingsHookState {
  const [remoteTtsProvider, setRemoteTtsProvider] =
    useState<ChatRuntimeRemoteSpeechProvider>(initialSettings.provider);
  const [remoteTtsVoice, setRemoteTtsVoice] = useState<string | undefined>(initialSettings.voice);
  const [remoteTtsModel, setRemoteTtsModel] = useState<string | undefined>(initialSettings.model);
  const [remoteTtsRate, setRemoteTtsRate] = useState(initialSettings.rate);

  const applyRemoteSpeechSettings = useCallback((settings: ChatRuntimeRemoteSpeechSettingsState) => {
    setRemoteTtsProvider(settings.provider);
    setRemoteTtsVoice(settings.voice);
    setRemoteTtsModel(settings.model);
    setRemoteTtsRate(settings.rate);
  }, []);

  return {
    remoteTtsProvider,
    setRemoteTtsProvider,
    remoteTtsVoice,
    setRemoteTtsVoice,
    remoteTtsModel,
    setRemoteTtsModel,
    remoteTtsRate,
    setRemoteTtsRate,
    applyRemoteSpeechSettings,
  };
}

type ChatMessageRuntimeThreadExpansionMessage =
  & ChatDisplayMessageLike
  & Parameters<typeof createChatMessageRuntimeToolActivityGroups>[0][number];

type ChatMessageRuntimeThreadExpansionStateInput<TMessage extends ChatMessageRuntimeThreadExpansionMessage> = {
  messages: TMessage[];
  isResponding: boolean;
};

export function useChatMessageRuntimeThreadExpansionState<TMessage extends ChatMessageRuntimeThreadExpansionMessage>({
  messages,
  isResponding,
}: ChatMessageRuntimeThreadExpansionStateInput<TMessage>) {
  const [expandedMessages, setExpandedMessages] = useState<ChatMessageRuntimeMessageExpansionState>({});
  const [expandedToolCalls, setExpandedToolCalls] = useState<ChatMessageRuntimeToolCallExpansionState>({});
  const [expandedGroups, setExpandedGroups] = useState<ChatMessageRuntimeToolActivityGroupExpansionState>({});
  const [expandedToolApprovals, setExpandedToolApprovals] = useState<ChatMessageRuntimeToolApprovalExpansionState>({});
  const [expandedDelegationConversationPreviews, setExpandedDelegationConversationPreviews] =
    useState<ChatRuntimeConversationDelegationExpansionState>({});
  const [expandedDelegationToolPreviews, setExpandedDelegationToolPreviews] =
    useState<ChatRuntimeConversationDelegationExpansionState>({});

  const resetThreadExpansionState = useCallback(() => {
    setExpandedMessages({});
    setExpandedToolCalls({});
    setExpandedGroups({});
    setExpandedToolApprovals({});
    setExpandedDelegationConversationPreviews({});
    setExpandedDelegationToolPreviews({});
  }, []);

  const toggleMessageExpansion = useCallback((index: number) => {
    setExpandedMessages((prev) => toggleChatMessageRuntimeMessageExpansionState(prev, index));
  }, []);

  const toggleToolCallExpansion = useCallback((messageId: string, toolCallIndex: number) => {
    setExpandedToolCalls((prev) =>
      toggleChatMessageRuntimeToolCallExpansionState(prev, messageId, toolCallIndex),
    );
  }, []);

  const toolActivityGroups = useMemo(
    () => createChatMessageRuntimeToolActivityGroups(messages),
    [messages],
  );

  const toggleGroupExpansion = useCallback((group: ChatMessageRuntimeToolActivityGroup) => {
    setExpandedGroups((prev) => toggleChatMessageRuntimeToolActivityGroupExpansionState(prev, group));
  }, []);

  useEffect(() => {
    setExpandedGroups((prev) => applyChatMessageRuntimeToolActivityGroupExpansionInheritance({
      groupState: prev,
      inheritedState: expandedMessages,
      groups: toolActivityGroups.groups,
    }));
  }, [expandedMessages, toolActivityGroups.groups]);

  const toggleToolApprovalArguments = useCallback((approvalId: string) => {
    setExpandedToolApprovals((prev) =>
      toggleChatMessageRuntimeToolApprovalExpansionState(prev, approvalId),
    );
  }, []);

  useEffect(() => {
    setExpandedMessages((prev) => applyChatMessageRuntimeAutoExpansionState(prev, messages, {
      isResponding,
    }));
  }, [isResponding, messages]);

  return {
    expandedMessages,
    expandedToolCalls,
    expandedGroups,
    expandedToolApprovals,
    expandedDelegationConversationPreviews,
    expandedDelegationToolPreviews,
    setExpandedDelegationConversationPreviews,
    setExpandedDelegationToolPreviews,
    toolActivityGroups,
    toggleMessageExpansion,
    toggleToolCallExpansion,
    toggleGroupExpansion,
    toggleToolApprovalArguments,
    resetThreadExpansionState,
  };
}

export function createChatMessageRuntimeChromeProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
>({
  colors,
  platform,
  spinnerSource,
  styles,
  composer,
  dock,
  threadList,
  viewport,
  surface,
}: ChatMessageRuntimeChromePropsInput<TPrompt, TTask>): ChatMessageRuntimeSurfaceChromeProps<TPrompt, TTask> {
  const {
    messages: threadListMessages,
    visibleMessageCount: threadListVisibleMessageCount,
    ...threadListInput
  } = threadList;
  const conversationThreadListState = getChatRuntimeConversationRuntimeThreadListMobileState({
    messages: threadListMessages,
    visibleMessageCount: threadListVisibleMessageCount,
    ...threadListInput,
    colors,
    createThreadState: (itemState) => getChatRuntimeConversationItemThreadMobileStateFromBodyInput({
      ...threadListInput,
      ...itemState,
      colors,
      actionStyles: styles.actionStyles,
      spinnerSource,
    }),
  });
  const chatComposerRuntimeDockChrome =
    createChatComposerRuntimeDockMobileChromeProps<ChatComposerMicButtonWebPressedStyle>({
      colors,
      platform,
    });
  const chatComposerRuntimeDock = createChatComposerRuntimeDockMobileProps({
    chrome: chatComposerRuntimeDockChrome,
    ...composer,
    pendingImagesColors: colors,
    composerControlColors: colors,
  });
  const chatMessageRuntimeViewport = createChatRuntimeViewportChromeMobileProps<
    TPrompt,
    PromptLibrarySkillLike & { id: string },
    TTask,
    ChatMessageRuntimeViewportChromePropsInput<TPrompt, TTask>
  >({
    ...viewport,
    colors,
    loadingSpinnerSource: spinnerSource,
    visibleMessageCount: conversationThreadListState.visibleMessageCount,
    totalMessageCount: conversationThreadListState.totalMessageCount,
    hiddenMessageCount: conversationThreadListState.hiddenMessageCount,
  });
  const chatMessageRuntimeDock = createChatRuntimeDockChromeMobileProps({
    ...dock,
    speakNative: Speech.speak,
    stopNativeSpeech: Speech.stop,
    speakRemote: speakRemoteTts,
    stopRemoteSpeech: stopRemoteTts,
    colors,
    composer: chatComposerRuntimeDock,
  });

  return createChatRuntimeSurfaceChromeMobileProps({
    ...surface,
    platform,
    colors,
    promptEditorStyles: styles.promptEditorStyles,
    dock: chatMessageRuntimeDock,
    viewport: chatMessageRuntimeViewport,
    threadStates: conversationThreadListState.threadStates,
    threadStyles: styles.threadStyles,
  });
}

export function ChatMessageRuntimeChromeSurface<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
>({
  runtimeSurface,
  ...chromePropsInput
}: ChatMessageRuntimeChromeSurfaceProps<TPrompt, TTask>) {
  const chatMessageRuntimeSurface = createChatMessageRuntimeChromeProps<TPrompt, TTask>(chromePropsInput);

  return (
    <ChatMessageRuntimeSurface
      {...chatMessageRuntimeSurface}
      {...runtimeSurface.props}
    />
  );
}

function createChatMessageActionRenderers({
  turnDuration,
  speech,
  branch,
  copy,
  expansion,
}: Omit<ChatMessageActionComponentsInput, 'availability'>) {
  return {
    turnDuration: () => <ChatMessageTurnDurationBadge {...turnDuration} />,
    speech: () => renderChatMessageActionButton(speech),
    branch: () => renderChatMessageActionButton(branch),
    copy: () => renderChatMessageActionButton(copy),
    expansion: () => renderChatMessageActionButton(expansion),
  };
}

function createChatMessageActionComponents({
  availability,
  ...input
}: ChatMessageActionComponentsInput): ChatMessageActionComponentMap {
  return createChatMessageActionSlotRenderMap<ReactNode>(
    availability,
    createChatMessageActionRenderers(input),
  );
}

function createChatMessageActionSet({
  renderState: actionRenderState,
  turnDuration,
  speech,
  branch,
  copy,
  expansion,
  ...input
}: ChatMessageActionSetInput): ChatMessageActionSet {
  const actionInput = createChatRuntimeConversationActionComponentsMobileProps({
    renderState: actionRenderState,
    ...input,
    turnDuration,
    speech,
    branch,
    copy,
    expansion,
  });
  const components = createChatMessageActionComponents({
    ...actionInput,
  });

  return createChatRuntimeConversationActionSetMobileProps({
    renderState: actionRenderState,
    components,
  });
}

export function useChatConversationHomePromptEditorSaveActionsState<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
>({
  promptClient,
  predefinedPrompts,
  editingPrompt,
  promptName,
  promptContent,
  isSavingPrompt,
  setPredefinedPrompts,
  beginPromptEditorSave,
  clearPromptEditorSave,
  dismissPromptEditor,
  showAlert,
}: ChatConversationHomePromptEditorSaveActionsStateInput<TPromptEditorClient>): ChatConversationHomePromptEditorSaveActionsState {
  const handleSavePrompt = useCallback(async () => {
    const draft = { name: promptName, content: promptContent };
    const saveActionState = createChatConversationHomePromptEditorSaveActionState({
      draft,
      isEditing: Boolean(editingPrompt),
      isSaving: isSavingPrompt,
    });
    if (!promptClient || saveActionState.isDisabled) return;

    const wasEditingPrompt = Boolean(editingPrompt);
    beginPromptEditorSave();
    try {
      const now = Date.now();
      const updatedPrompts = editingPrompt
        ? updatePredefinedPromptList(predefinedPrompts, editingPrompt.id, draft, now)
        : [
          createPredefinedPromptRecord(draft, now),
          ...predefinedPrompts,
        ];

      await promptClient.updateSettings({ predefinedPrompts: updatedPrompts });
      setPredefinedPrompts(sortPredefinedPromptsByUpdatedAt(updatedPrompts));
      dismissPromptEditor();
      const successAlert = getChatConversationHomePromptSaveSuccessAlertState(wasEditingPrompt);
      showAlert(successAlert.title, successAlert.message);
    } catch (error: any) {
      console.error('[ChatConversationHome] Error saving prompt:', error);
      const failedAlert = getChatConversationHomePromptSaveFailedAlertState(error);
      showAlert(failedAlert.title, failedAlert.message);
    } finally {
      clearPromptEditorSave();
    }
  }, [
    beginPromptEditorSave,
    clearPromptEditorSave,
    dismissPromptEditor,
    editingPrompt,
    isSavingPrompt,
    predefinedPrompts,
    promptClient,
    promptContent,
    promptName,
    setPredefinedPrompts,
    showAlert,
  ]);

  return {
    handleSavePrompt,
  };
}

export function useChatConversationHomePromptEditorSaveChromeActionsState<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
>(
  input: ChatConversationHomePromptEditorSaveChromeActionsStateInput<TPromptEditorClient>,
): ChatConversationHomePromptEditorSaveActionsState {
  return useChatConversationHomePromptEditorSaveActionsState({
    ...input,
    showAlert: Alert.alert,
  });
}

export function useChatConversationHomePromptEditorDeleteActionsState<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
>({
  promptClient,
  predefinedPrompts,
  setPredefinedPrompts,
  beginPromptEditorSave,
  clearPromptEditorSave,
  platform,
  confirmWeb,
  confirmNative,
  showAlert,
}: ChatConversationHomePromptEditorDeleteActionsStateInput<TPromptEditorClient>): ChatConversationHomePromptEditorDeleteActionsState {
  const handleDeletePrompt = useCallback((prompt: PredefinedPromptSummary) => {
    if (!promptClient) return;

    const deletePrompt = async () => {
      beginPromptEditorSave();
      try {
        const updatedPrompts = deletePredefinedPromptFromList(predefinedPrompts, prompt.id);
        await promptClient.updateSettings({ predefinedPrompts: updatedPrompts });
        setPredefinedPrompts(updatedPrompts);
      } catch (error: any) {
        console.error('[ChatConversationHome] Error deleting prompt:', error);
        const failedAlert = getChatConversationHomePromptDeleteFailedAlertState(error);
        showAlert(failedAlert.title, failedAlert.message);
      } finally {
        clearPromptEditorSave();
      }
    };

    const confirmAlert = getChatConversationHomePromptDeleteConfirmAlertState(prompt.name);
    if (platform === 'web') {
      if (confirmWeb(confirmAlert.webMessage)) {
        void deletePrompt();
      }
      return;
    }

    confirmNative({
      title: confirmAlert.title,
      message: confirmAlert.message,
      cancelLabel: confirmAlert.cancelLabel,
      deleteLabel: confirmAlert.deleteLabel,
      onConfirm: () => {
        void deletePrompt();
      },
    });
  }, [
    beginPromptEditorSave,
    clearPromptEditorSave,
    confirmNative,
    confirmWeb,
    platform,
    predefinedPrompts,
    promptClient,
    setPredefinedPrompts,
    showAlert,
  ]);

  return {
    handleDeletePrompt,
  };
}

export function useChatConversationHomePromptEditorDeleteChromeActionsState<
  TPromptEditorClient extends ChatConversationHomePromptEditorSaveClient,
>(
  input: ChatConversationHomePromptEditorDeleteChromeActionsStateInput<TPromptEditorClient>,
): ChatConversationHomePromptEditorDeleteActionsState {
  return useChatConversationHomePromptEditorDeleteActionsState({
    ...input,
    confirmWeb: confirmChatRuntimeWebDialog,
    confirmNative: createChatConversationHomePromptDeleteNativeConfirmPresenter(Alert.alert),
    showAlert: Alert.alert,
  });
}

export function useChatConversationHomePromptTaskRunState(): ChatConversationHomePromptTaskRunState {
  const [runningPromptTaskId, setRunningPromptTaskId] = useState<string | null>(null);

  const beginPromptTaskRun = useCallback((taskId: string) => {
    setRunningPromptTaskId(taskId);
  }, []);

  const clearPromptTaskRun = useCallback(() => {
    setRunningPromptTaskId(null);
  }, []);

  return {
    runningPromptTaskId,
    canRunPromptTask: runningPromptTaskId === null,
    beginPromptTaskRun,
    clearPromptTaskRun,
  };
}

export function useChatConversationHomePromptTaskRunActionsState<
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
  TTaskRunClient extends ChatConversationHomePromptTaskRunClient,
>({
  taskClient,
  canRunPromptTask,
  beginPromptTaskRun,
  clearPromptTaskRun,
  showAlert,
}: ChatConversationHomePromptTaskRunActionsStateInput<TTaskRunClient>): ChatConversationHomePromptTaskRunActionsState<TTask> {
  const handleRunPromptTask = useCallback(async (task: TTask) => {
    if (!taskClient || !canRunPromptTask) return;
    beginPromptTaskRun(task.id);
    try {
      await taskClient.runLoop(task.id);
      const taskStartedAlert = getChatConversationHomePromptTaskStartedAlertState(task.name);
      showAlert(taskStartedAlert.title, taskStartedAlert.message);
    } catch (error: any) {
      const failedAlert = getChatConversationHomePromptTaskRunFailedAlertState(error);
      showAlert(failedAlert.title, failedAlert.message);
    } finally {
      clearPromptTaskRun();
    }
  }, [
    beginPromptTaskRun,
    canRunPromptTask,
    clearPromptTaskRun,
    showAlert,
    taskClient,
  ]);

  return {
    handleRunPromptTask,
  };
}

export function useChatConversationHomePromptTaskRunChromeActionsState<
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
  TTaskRunClient extends ChatConversationHomePromptTaskRunClient,
>(
  input: ChatConversationHomePromptTaskRunChromeActionsStateInput<TTaskRunClient>,
): ChatConversationHomePromptTaskRunActionsState<TTask> {
  return useChatConversationHomePromptTaskRunActionsState<TTask, TTaskRunClient>({
    ...input,
    showAlert: Alert.alert,
  });
}

export function useChatConversationHomeQuickStartCatalogState(): ChatConversationHomeQuickStartCatalogState {
  const [predefinedPrompts, setPredefinedPrompts] = useState<PredefinedPromptSummary[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Loop[]>([]);
  const [isLoadingQuickStartPrompts, setIsLoadingQuickStartPrompts] = useState(false);

  const beginQuickStartCatalogLoad = useCallback(() => {
    setIsLoadingQuickStartPrompts(true);
  }, []);

  const finishQuickStartCatalogLoad = useCallback(() => {
    setIsLoadingQuickStartPrompts(false);
  }, []);

  const clearQuickStartCatalog = useCallback(() => {
    setPredefinedPrompts([]);
    setAvailableSkills([]);
    setAvailableTasks([]);
    setIsLoadingQuickStartPrompts(false);
  }, []);

  return {
    predefinedPrompts,
    setPredefinedPrompts,
    availableSkills,
    setAvailableSkills,
    availableTasks,
    setAvailableTasks,
    isLoadingQuickStartPrompts,
    beginQuickStartCatalogLoad,
    finishQuickStartCatalogLoad,
    clearQuickStartCatalog,
  };
}

export function useChatConversationHomeQuickStartCatalogLoadState<
  TQuickStartCatalogClient extends ChatConversationHomeQuickStartCatalogClient,
>({
  quickStartClient,
  isFocused,
  catalog,
  applyRemoteSpeechSettings,
}: ChatConversationHomeQuickStartCatalogLoadStateInput<TQuickStartCatalogClient>): void {
  const {
    setPredefinedPrompts,
    setAvailableSkills,
    setAvailableTasks,
    beginQuickStartCatalogLoad,
    finishQuickStartCatalogLoad,
    clearQuickStartCatalog,
  } = catalog;

  useEffect(() => {
    if (!quickStartClient || !isFocused) {
      if (!quickStartClient) {
        clearQuickStartCatalog();
      }
      return;
    }

    let cancelled = false;
    beginQuickStartCatalogLoad();

    Promise.allSettled([
      quickStartClient.getSettings(),
      quickStartClient.getSkills(),
      quickStartClient.getLoops(),
    ] as const)
      .then(([settingsResult, skillsResult, loopsResult]) => {
        if (cancelled) return;

        if (settingsResult.status === 'fulfilled') {
          const settings = settingsResult.value;
          const nextPrompts = sortPredefinedPromptsByUpdatedAt(settings.predefinedPrompts || []);
          const remoteSpeechSettings = createChatRuntimeRemoteSpeechSettingsState(settings);
          setPredefinedPrompts(nextPrompts);
          applyRemoteSpeechSettings(remoteSpeechSettings);
        } else {
          setPredefinedPrompts([]);
        }

        setAvailableSkills(skillsResult.status === 'fulfilled' ? skillsResult.value.skills : []);
        setAvailableTasks(loopsResult.status === 'fulfilled' ? loopsResult.value.loops : []);
      })
      .finally(() => {
        if (cancelled) return;
        finishQuickStartCatalogLoad();
      });

    return () => {
      cancelled = true;
    };
  }, [
    applyRemoteSpeechSettings,
    beginQuickStartCatalogLoad,
    clearQuickStartCatalog,
    finishQuickStartCatalogLoad,
    isFocused,
    quickStartClient,
    setAvailableSkills,
    setAvailableTasks,
    setPredefinedPrompts,
  ]);
}

export function useChatConversationHomePromptEditorState(): ChatConversationHomePromptEditorState {
  const [promptEditorVisible, setPromptEditorVisible] = useState(false);
  const [promptEditorEditingPrompt, setPromptEditorEditingPrompt] = useState<PredefinedPromptSummary | null>(null);
  const [promptEditorNameValue, setPromptEditorNameValue] = useState('');
  const [promptEditorContentValue, setPromptEditorContentValue] = useState('');
  const [promptEditorIsSaving, setPromptEditorIsSaving] = useState(false);

  const dismissPromptEditor = useCallback(() => {
    setPromptEditorVisible(false);
    setPromptEditorEditingPrompt(null);
    setPromptEditorNameValue('');
    setPromptEditorContentValue('');
  }, []);

  const openAddPromptEditor = useCallback(() => {
    setPromptEditorEditingPrompt(null);
    setPromptEditorNameValue('');
    setPromptEditorContentValue('');
    setPromptEditorVisible(true);
  }, []);

  const openEditPromptEditor = useCallback((prompt: PredefinedPromptSummary) => {
    setPromptEditorEditingPrompt(prompt);
    setPromptEditorNameValue(prompt.name);
    setPromptEditorContentValue(prompt.content);
    setPromptEditorVisible(true);
  }, []);

  const closePromptEditor = useCallback(() => {
    if (promptEditorIsSaving) return;
    dismissPromptEditor();
  }, [dismissPromptEditor, promptEditorIsSaving]);

  const beginPromptEditorSave = useCallback(() => {
    setPromptEditorIsSaving(true);
  }, []);

  const clearPromptEditorSave = useCallback(() => {
    setPromptEditorIsSaving(false);
  }, []);

  return {
    promptEditorVisible,
    promptEditorEditingPrompt,
    promptEditorIsEditing: Boolean(promptEditorEditingPrompt),
    promptEditorNameValue,
    setPromptEditorNameValue,
    promptEditorContentValue,
    setPromptEditorContentValue,
    promptEditorIsSaving,
    openAddPromptEditor,
    openEditPromptEditor,
    closePromptEditor,
    dismissPromptEditor,
    beginPromptEditorSave,
    clearPromptEditorSave,
  };
}

export function useChatRuntimeAgentSelectorOverlayState(): ChatRuntimeAgentSelectorOverlayState {
  const [agentSelectorVisible, setAgentSelectorVisible] = useState(false);

  const openAgentSelector = useCallback(() => {
    setAgentSelectorVisible(true);
  }, []);

  const closeAgentSelector = useCallback(() => {
    setAgentSelectorVisible(false);
  }, []);

  return {
    agentSelectorVisible,
    openAgentSelector,
    closeAgentSelector,
  };
}

export function useChatComposerRuntimeDraftState(): ChatComposerRuntimeDraftState {
  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState<ChatComposerRuntimeImageAttachment[]>([]);
  const inputRef = useRef<ChatComposerTextEntryRef>(null);

  const clearComposerInput = useCallback(() => {
    setInput('');
  }, []);

  const clearPendingImages = useCallback(() => {
    setPendingImages([]);
  }, []);

  const clearComposerDraft = useCallback(() => {
    setInput('');
    setPendingImages([]);
  }, []);

  const focusComposerInput = useCallback(() => {
    inputRef.current?.focus?.();
  }, []);

  const mergeVoiceTextIntoComposer = useCallback((text: string) => {
    setInput((current) => mergeChatComposerRuntimeVoiceText(current, text));
  }, []);

  const removePendingImage = useCallback((attachmentId: string) => {
    setPendingImages((current) => current.filter((image) => image.id !== attachmentId));
  }, []);

  return {
    input,
    setInput,
    pendingImages,
    setPendingImages,
    inputRef,
    clearComposerInput,
    clearPendingImages,
    clearComposerDraft,
    focusComposerInput,
    mergeVoiceTextIntoComposer,
    removePendingImage,
  };
}

export function useChatComposerRuntimeSubmissionActionsState({
  input,
  pendingImages,
  currentConversationId,
  queue,
  send,
  clearComposerDraft,
  setDebugInfo,
}: ChatComposerRuntimeSubmissionActionsStateInput): ChatComposerRuntimeSubmissionActionsState {
  const draftMessageState = useMemo(
    () => getChatComposerRuntimeDraftMessageState({
      input,
      pendingImages,
    }),
    [input, pendingImages],
  );
  const composerHasContent = draftMessageState.hasContent;

  const sendComposerInput = useCallback(() => {
    const composedMessage = draftMessageState.content;
    if (!composedMessage.trim()) return;
    void send(composedMessage, { fromComposer: true });
  }, [draftMessageState.content, send]);

  const queueComposerInput = useCallback(() => {
    const composedMessage = draftMessageState.content;
    if (!composedMessage.trim()) return;

    queue.enqueue(currentConversationId, composedMessage, currentConversationId);
    clearComposerDraft();
    setDebugInfo(getChatComposerQueueMobileActionState().debugMessage);
  }, [clearComposerDraft, currentConversationId, draftMessageState.content, queue, setDebugInfo]);

  return {
    composerHasContent,
    sendComposerInput,
    queueComposerInput,
  };
}

export function useChatComposerRuntimeSubmissionChromeState({
  platform,
  onTextEntryChangeText,
  ...submissionInput
}: ChatComposerRuntimeSubmissionChromeStateInput): ChatComposerRuntimeSubmissionChromeState {
  const submissionActions = useChatComposerRuntimeSubmissionActionsState(submissionInput);
  const textEntrySubmissionState = useChatComposerRuntimeTextEntrySubmissionState({
    hasContent: submissionActions.composerHasContent,
    platform,
    onChangeText: onTextEntryChangeText,
    onSubmit: submissionActions.sendComposerInput,
  });

  return {
    ...submissionActions,
    textEntrySubmissionState,
  };
}

export function useChatComposerRuntimeTextEntrySubmissionState({
  hasContent,
  platform,
  onChangeText,
  onSubmit,
}: ChatComposerRuntimeTextEntrySubmissionStateInput): ChatComposerRuntimeTextEntrySubmissionState {
  const modifierKeysRef = useRef<ChatComposerTextEntryModifierKeys>({
    shift: false,
    ctrl: false,
    meta: false,
  });
  const modifierTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextChangeRef = useRef(false);

  const clearModifierTimeout = useCallback(() => {
    if (modifierTimeoutRef.current) {
      clearTimeout(modifierTimeoutRef.current);
      modifierTimeoutRef.current = null;
    }
  }, []);

  const resetModifierKeys = useCallback(() => {
    modifierKeysRef.current = { shift: false, ctrl: false, meta: false };
  }, []);

  useEffect(() => clearModifierTimeout, [clearModifierTimeout]);

  const handleTextEntryKeyPress = useCallback((event: ChatComposerTextEntryKeyPressEvent) => {
    const key = event.nativeEvent.key;

    if (platform === 'web') {
      const webEvent = event.nativeEvent as ChatComposerTextEntryWebKeyPressEvent;
      const isEnter = key === 'Enter';
      const hasModifier = Boolean(webEvent.shiftKey || webEvent.ctrlKey || webEvent.metaKey);

      if (isEnter && hasModifier) {
        event.preventDefault?.();
        webEvent.preventDefault?.();
        if (hasContent) {
          onSubmit();
        }
      }
      return;
    }

    const setModifierWithTimeout = (modifier: keyof ChatComposerTextEntryModifierKeys) => {
      modifierKeysRef.current[modifier] = true;
      clearModifierTimeout();
      modifierTimeoutRef.current = setTimeout(() => {
        resetModifierKeys();
      }, 500);
    };

    if (key === 'Shift') {
      setModifierWithTimeout('shift');
      return;
    }

    if (key === 'Control') {
      setModifierWithTimeout('ctrl');
      return;
    }

    if (key === 'Meta') {
      setModifierWithTimeout('meta');
      return;
    }

    if (key === 'Enter') {
      clearModifierTimeout();
      const hasModifier =
        modifierKeysRef.current.shift ||
        modifierKeysRef.current.ctrl ||
        modifierKeysRef.current.meta;

      if (hasModifier) {
        suppressNextChangeRef.current = true;
        if (hasContent) {
          onSubmit();
        }
      }
      resetModifierKeys();
      return;
    }

    clearModifierTimeout();
    resetModifierKeys();
  }, [clearModifierTimeout, hasContent, onSubmit, platform, resetModifierKeys]);

  const handleTextEntryChangeText = useCallback((text: string) => {
    if (suppressNextChangeRef.current) {
      suppressNextChangeRef.current = false;
      return;
    }
    onChangeText(text);
  }, [onChangeText]);

  return {
    onChangeText: handleTextEntryChangeText,
    onKeyPress: handleTextEntryKeyPress,
  };
}

export function useChatComposerRuntimeHandsFreeControlActionsState({
  handsFreeController,
  listening,
  wakePhrase,
  startRecording,
  stopRecognitionOnly,
  stopSpeech,
  setDebugInfo,
}: ChatComposerRuntimeHandsFreeControlActionsStateInput): ChatComposerRuntimeHandsFreeControlActionsState {
  const {
    pauseByUser,
    resumeByUser,
    sleepByUser,
    state,
    wakeByUser,
  } = handsFreeController;

  const wakeHandsFreeByUser = useCallback(() => {
    wakeByUser();
    if (!listening) {
      void startRecording();
    }
    setDebugInfo(getChatComposerRuntimeHandsFreeDebugMessage('awake'));
  }, [listening, setDebugInfo, startRecording, wakeByUser]);

  const sleepHandsFreeByUser = useCallback(() => {
    sleepByUser();
    setDebugInfo(formatChatComposerRuntimeHandsFreeSleepingDebugMessage(wakePhrase));
  }, [setDebugInfo, sleepByUser, wakePhrase]);

  const resumeHandsFreeByUser = useCallback(() => {
    resumeByUser();
    if (!listening) {
      void startRecording();
    }
    setDebugInfo(getChatComposerRuntimeHandsFreeDebugMessage('resumed'));
  }, [listening, resumeByUser, setDebugInfo, startRecording]);

  const pauseHandsFreeByUser = useCallback(() => {
    pauseByUser();
    stopSpeech();
    void stopRecognitionOnly();
    setDebugInfo(getChatComposerRuntimeHandsFreeDebugMessage('paused'));
  }, [pauseByUser, setDebugInfo, stopRecognitionOnly, stopSpeech]);

  const handleHandsFreePrimaryControl = useCallback(() => {
    if (state.phase === 'sleeping') {
      wakeHandsFreeByUser();
      return;
    }
    if (state.phase === 'paused') {
      resumeHandsFreeByUser();
      return;
    }
    pauseHandsFreeByUser();
  }, [pauseHandsFreeByUser, resumeHandsFreeByUser, state.phase, wakeHandsFreeByUser]);

  return {
    wakeHandsFreeByUser,
    sleepHandsFreeByUser,
    resumeHandsFreeByUser,
    pauseHandsFreeByUser,
    handleHandsFreePrimaryControl,
  };
}

export function useChatComposerRuntimeHandsFreeControlChromeActionsState(
  input: ChatComposerRuntimeHandsFreeControlChromeActionsStateInput,
): ChatComposerRuntimeHandsFreeControlActionsState {
  return useChatComposerRuntimeHandsFreeControlActionsState({
    ...input,
    stopSpeech: Speech.stop,
  });
}

export function useChatComposerRuntimeHandsFreeRecognizerLifecycleState({
  handsFree,
  handsFreeRuntimeActive,
  listening,
  handsFreeController,
  startRecording,
  stopRecognitionOnly,
  setHandsFreePhaseRefValue,
  errorResetDelayMs = 2500,
}: ChatComposerRuntimeHandsFreeRecognizerLifecycleStateInput): void {
  useEffect(() => {
    setHandsFreePhaseRefValue(handsFreeController.state.phase);
  }, [handsFreeController.state.phase, setHandsFreePhaseRefValue]);

  useEffect(() => {
    if (!handsFree) {
      return;
    }
    if (!handsFreeRuntimeActive && listening) {
      void stopRecognitionOnly();
    }
  }, [handsFree, handsFreeRuntimeActive, listening, stopRecognitionOnly]);

  useEffect(() => {
    if (!handsFree) {
      return;
    }

    if (handsFreeController.state.phase === 'error') {
      const timer = setTimeout(() => {
        handsFreeController.resetError();
      }, errorResetDelayMs);
      return () => clearTimeout(timer);
    }

    if (handsFreeController.shouldKeepRecognizerActive && !listening) {
      void startRecording();
      return;
    }

    if (!handsFreeController.shouldKeepRecognizerActive && listening) {
      void stopRecognitionOnly();
    }
  }, [
    errorResetDelayMs,
    handsFree,
    handsFreeController.resetError,
    handsFreeController.shouldKeepRecognizerActive,
    handsFreeController.state.phase,
    listening,
    startRecording,
    stopRecognitionOnly,
  ]);
}

export function useChatComposerRuntimeVoiceDebugResetState({
  isVoiceDebugEnabled,
  clearVoiceDebug,
}: ChatComposerRuntimeVoiceDebugResetStateInput): void {
  useEffect(() => {
    if (!isVoiceDebugEnabled) {
      clearVoiceDebug();
    }
  }, [clearVoiceDebug, isVoiceDebugEnabled]);
}

export function useChatMessageRuntimeMessageState<TMessage>(): ChatMessageRuntimeMessageState<TMessage> {
  const [messages, setMessages] = useState<TMessage[]>([]);
  const messagesRef = useRef<TMessage[]>(messages);
  const progressMessagesRef = useRef<TMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  return {
    messages,
    setMessages,
    messagesRef,
    progressMessagesRef,
  };
}

export function useChatMessageRuntimeSendRef(): ChatMessageRuntimeSendRefState {
  const sendRef = useRef<ChatMessageRuntimeSendCallback>(async () => {});

  const syncSendRef = useCallback((send: ChatMessageRuntimeSendCallback) => {
    sendRef.current = send;
  }, []);

  return {
    sendRef,
    syncSendRef,
  };
}

export function useChatMessageRuntimeSessionRefState({
  initialMessage,
}: ChatMessageRuntimeSessionRefStateInput): ChatMessageRuntimeSessionRefState {
  const lastLoadedSessionIdRef = useRef<string | null>(null);
  const pendingLazyLoadSessionIdRef = useRef<string | null>(null);
  const skipNextPersistRef = useRef(false);
  const initialMessageRef = useRef<string | null>(initialMessage);
  const initialMessageSentRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);
  const prevSessionIdRef = useRef<string | null>(null);
  const convoRef = useRef<string | undefined>(undefined);

  return {
    lastLoadedSessionIdRef,
    pendingLazyLoadSessionIdRef,
    skipNextPersistRef,
    initialMessageRef,
    initialMessageSentRef,
    prevMessagesLengthRef,
    prevSessionIdRef,
    convoRef,
  };
}

export function useChatMessageRuntimeInitialMessageState({
  routeInitialMessage,
  currentSessionId,
  initialMessageRef,
  initialMessageSentRef,
  sendRef,
  clearRouteInitialMessage,
  voiceLog,
  autoSendDelayMs = 300,
}: ChatMessageRuntimeInitialMessageStateInput): void {
  useEffect(() => {
    const nextInitial = routeInitialMessage;
    if (!nextInitial || typeof nextInitial !== 'string') return;
    initialMessageRef.current = nextInitial;
    initialMessageSentRef.current = false;
    voiceLog('state-transition', 'Route initial message received.', { initialMessage: nextInitial });
  }, [initialMessageRef, initialMessageSentRef, routeInitialMessage, voiceLog]);

  useEffect(() => {
    if (!initialMessageRef.current || initialMessageSentRef.current) return undefined;
    if (!currentSessionId) return undefined;
    initialMessageSentRef.current = true;
    const msg = initialMessageRef.current;
    initialMessageRef.current = null;
    try {
      clearRouteInitialMessage?.();
    } catch {}

    const timer = setTimeout(() => {
      void sendRef.current(msg);
    }, autoSendDelayMs);
    return () => clearTimeout(timer);
  }, [
    autoSendDelayMs,
    clearRouteInitialMessage,
    currentSessionId,
    initialMessageRef,
    initialMessageSentRef,
    sendRef,
  ]);
}

export function useChatMessageRuntimeSessionLoadState<
  TMessage extends ChatMessageRuntimeSessionLoadMessage,
  TClient,
>({
  currentSessionId,
  currentSessionIdRef,
  deletingSessionIdsSize,
  hasServerAuth,
  settingsClient,
  createLazyLoadClient,
  getCurrentSession,
  createNewSession,
  loadSessionMessages,
  setMessages,
  setLatestStepSummary,
  lastLoadedSessionIdRef,
  pendingLazyLoadSessionIdRef,
  skipNextPersistRef,
  resetThreadExpansionState,
  clearCopiedMessageFeedback,
  replaceResponseHistory,
  resetResponseSpeechPlaybackState,
  warn = console.warn,
}: ChatMessageRuntimeSessionLoadStateInput<TMessage, TClient>): void {
  useEffect(() => {
    let currentSession = getCurrentSession();
    const shouldAttemptStubLoad = !!(
      currentSession &&
      currentSession.messages.length === 0 &&
      currentSession.serverConversationId &&
      hasServerAuth
    );

    if (lastLoadedSessionIdRef.current === currentSessionId && !shouldAttemptStubLoad) {
      return;
    }

    const applySessionMessages = (
      sessionMessages: readonly TMessage[],
      options?: ChatMessageRuntimeSessionDisplayMessagesOptions,
    ) => {
      const chatMessages = createChatMessageRuntimeSessionDisplayMessages<TMessage>(
        sessionMessages,
        options,
      );
      setMessages(chatMessages);
      const responseEvents = createChatMessageRuntimeResponseHistoryEvents(chatMessages);
      replaceResponseHistory(responseEvents);
      resetResponseSpeechPlaybackState(responseEvents.map((event) => event.id));
    };

    const clearSessionMessages = () => {
      setMessages([]);
      replaceResponseHistory([]);
    };

    const isSessionSwitch = lastLoadedSessionIdRef.current !== currentSessionId;
    if (isSessionSwitch) {
      resetThreadExpansionState();
      clearCopiedMessageFeedback();
      setLatestStepSummary(null);
      replaceResponseHistory([]);
      resetResponseSpeechPlaybackState();
      pendingLazyLoadSessionIdRef.current = null;
      skipNextPersistRef.current = false;
    }

    if (currentSession) {
      lastLoadedSessionIdRef.current = currentSession.id;

      if (currentSession.messages.length > 0) {
        applySessionMessages(currentSession.messages);
      } else if (currentSession.serverConversationId && hasServerAuth) {
        clearSessionMessages();
        const stubSessionId = currentSession.id;
        if (pendingLazyLoadSessionIdRef.current === stubSessionId) {
          return;
        }
        pendingLazyLoadSessionIdRef.current = stubSessionId;
        const client = settingsClient ?? createLazyLoadClient();
        loadSessionMessages(stubSessionId, client)
          .then((result) => {
            if (!result) return;
            if (currentSessionIdRef.current !== stubSessionId) return;
            if (result.messages.length > 0) {
              skipNextPersistRef.current = true;
            }
            applySessionMessages(result.messages, { includeId: true });
          })
          .catch((err) => {
            warn('[ChatScreen] Failed to lazy-load session messages:', err);
          })
          .finally(() => {
            if (pendingLazyLoadSessionIdRef.current === stubSessionId) {
              pendingLazyLoadSessionIdRef.current = null;
            }
          });
      } else {
        clearSessionMessages();
      }
      return;
    }

    if (deletingSessionIdsSize > 0) {
      return;
    }

    currentSession = createNewSession();
    lastLoadedSessionIdRef.current = currentSession.id;

    if (currentSession.messages.length > 0) {
      applySessionMessages(currentSession.messages);
    } else {
      clearSessionMessages();
    }
  }, [
    clearCopiedMessageFeedback,
    createLazyLoadClient,
    createNewSession,
    currentSessionId,
    currentSessionIdRef,
    deletingSessionIdsSize,
    getCurrentSession,
    hasServerAuth,
    lastLoadedSessionIdRef,
    loadSessionMessages,
    pendingLazyLoadSessionIdRef,
    replaceResponseHistory,
    resetResponseSpeechPlaybackState,
    resetThreadExpansionState,
    setLatestStepSummary,
    setMessages,
    settingsClient,
    skipNextPersistRef,
    warn,
  ]);
}

export function useChatMessageRuntimeSessionPersistState<TMessage>({
  messages,
  currentSessionId,
  deletingSessionIds,
  prevSessionIdRef,
  prevMessagesLengthRef,
  skipNextPersistRef,
  persistMessages,
}: ChatMessageRuntimeSessionPersistStateInput<TMessage>): void {
  useEffect(() => {
    if (currentSessionId && deletingSessionIds.has(currentSessionId)) {
      return;
    }

    const isSessionSwitch = prevSessionIdRef.current !== null && prevSessionIdRef.current !== currentSessionId;
    prevSessionIdRef.current = currentSessionId ?? null;

    if (isSessionSwitch) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    if (messages.length > 0 && messages.length !== prevMessagesLengthRef.current) {
      if (skipNextPersistRef.current) {
        // Lazy-loaded messages are already saved by the session store.
        skipNextPersistRef.current = false;
      } else {
        void persistMessages(messages);
      }
    } else if (skipNextPersistRef.current) {
      // Clear stale lazy-load skips when the hydrated count did not change.
      skipNextPersistRef.current = false;
    }
    prevMessagesLengthRef.current = messages.length;
  }, [
    currentSessionId,
    deletingSessionIds,
    messages,
    persistMessages,
    prevMessagesLengthRef,
    prevSessionIdRef,
    skipNextPersistRef,
  ]);
}

export function useChatMessageRuntimeResponseHistoryState(): ChatMessageRuntimeResponseHistoryState {
  const [respondToUserHistory, setRespondToUserHistory] = useState<AgentUserResponseEvent[]>([]);
  const respondToUserHistoryRef = useRef<AgentUserResponseEvent[]>([]);
  const nextResponseEventOrdinalRef = useRef(1);
  const playedResponseEventIdsRef = useRef<Set<string>>(new Set());
  const queuedResponseEventsRef = useRef<AgentUserResponseEvent[]>([]);
  const activeAutoSpeechEventIdRef = useRef<string | null>(null);
  const recentAutoSpeechByTextRef = useRef<Map<string, number>>(new Map());

  const syncResponseHistoryRefs = useCallback((events: AgentUserResponseEvent[]) => {
    respondToUserHistoryRef.current = events;
    nextResponseEventOrdinalRef.current = getChatMessageRuntimeNextResponseEventOrdinal(events);
  }, []);

  const replaceResponseHistory = useCallback((events: AgentUserResponseEvent[]) => {
    const sortedEvents = sortChatMessageRuntimeResponseEvents(events);
    syncResponseHistoryRefs(sortedEvents);
    setRespondToUserHistory(sortedEvents);
  }, [syncResponseHistoryRefs]);

  const createFallbackResponseEvent = useCallback((
    sessionId: string | null | undefined,
    runId: number | undefined,
    text: string,
  ): AgentUserResponseEvent => {
    const ordinal = nextResponseEventOrdinalRef.current;
    nextResponseEventOrdinalRef.current = ordinal + 1;
    const timestamp = Date.now();

    return {
      id: `legacy-progress-${sessionId ?? 'session'}-${runId ?? 'run'}-${ordinal}-${timestamp}`,
      sessionId: sessionId ?? 'session',
      runId,
      ordinal,
      text,
      timestamp,
    };
  }, []);

  const mergeResponseEvents = useCallback((incomingEvents: AgentUserResponseEvent[]) => {
    if (!incomingEvents.length) return;
    const merged = new Map(respondToUserHistoryRef.current.map((event) => [event.id, event]));
    for (const event of incomingEvents) {
      merged.set(event.id, event);
    }

    const mergedEvents = sortChatMessageRuntimeResponseEvents(Array.from(merged.values()));
    syncResponseHistoryRefs(mergedEvents);
    setRespondToUserHistory(mergedEvents);
  }, [syncResponseHistoryRefs]);

  const clearQueuedResponseSpeech = useCallback(() => {
    queuedResponseEventsRef.current = [];
    activeAutoSpeechEventIdRef.current = null;
  }, []);

  const resetResponseSpeechPlaybackState = useCallback((playedEventIds: Iterable<string> = []) => {
    playedResponseEventIdsRef.current = new Set(playedEventIds);
    queuedResponseEventsRef.current = [];
    activeAutoSpeechEventIdRef.current = null;
  }, []);

  return {
    respondToUserHistory,
    playedResponseEventIdsRef,
    queuedResponseEventsRef,
    activeAutoSpeechEventIdRef,
    recentAutoSpeechByTextRef,
    replaceResponseHistory,
    createFallbackResponseEvent,
    mergeResponseEvents,
    clearQueuedResponseSpeech,
    resetResponseSpeechPlaybackState,
  };
}

export function useChatMessageRuntimeResponseSpeechQueueActionsState({
  isTextToSpeechEnabled,
  ttsEnabledRef,
  playedResponseEventIdsRef,
  queuedResponseEventsRef,
  activeAutoSpeechEventIdRef,
  speakAssistantResponse,
}: ChatMessageRuntimeResponseSpeechQueueActionsStateInput): ChatMessageRuntimeResponseSpeechQueueActionsState {
  const processResponseSpeechQueue = useCallback(() => {
    if (activeAutoSpeechEventIdRef.current || queuedResponseEventsRef.current.length === 0) {
      return;
    }

    const nextEvent = queuedResponseEventsRef.current.shift();
    if (!nextEvent) return;
    activeAutoSpeechEventIdRef.current = nextEvent.id;

    const spoken = speakAssistantResponse(nextEvent.text, `response event ${nextEvent.ordinal}`, () => {
      activeAutoSpeechEventIdRef.current = null;
      processResponseSpeechQueue();
    });

    if (!spoken) {
      activeAutoSpeechEventIdRef.current = null;
      processResponseSpeechQueue();
      return;
    }

    playedResponseEventIdsRef.current.add(nextEvent.id);
  }, [
    activeAutoSpeechEventIdRef,
    playedResponseEventIdsRef,
    queuedResponseEventsRef,
    speakAssistantResponse,
  ]);

  const enqueueResponseEventsForSpeech = useCallback((events: AgentUserResponseEvent[]) => {
    if (!isTextToSpeechEnabled || !ttsEnabledRef.current || !events.length) return;

    const queuedIds = new Set(queuedResponseEventsRef.current.map((event) => event.id));
    const activeId = activeAutoSpeechEventIdRef.current;
    const unseenEvents = events.filter((event) => (
      !playedResponseEventIdsRef.current.has(event.id)
      && !queuedIds.has(event.id)
      && event.id !== activeId
    ));

    if (!unseenEvents.length) return;

    queuedResponseEventsRef.current = sortChatMessageRuntimeResponseEvents([
      ...queuedResponseEventsRef.current,
      ...unseenEvents,
    ]);

    processResponseSpeechQueue();
  }, [
    activeAutoSpeechEventIdRef,
    isTextToSpeechEnabled,
    playedResponseEventIdsRef,
    processResponseSpeechQueue,
    queuedResponseEventsRef,
    ttsEnabledRef,
  ]);

  return {
    enqueueResponseEventsForSpeech,
    processResponseSpeechQueue,
  };
}

export function useChatMessageRuntimeAssistantSpeechActionsState({
  ttsEnabledRef,
  recentAutoSpeechByTextRef,
  config,
  effectiveTtsProvider,
  effectiveRemoteTtsVoice,
  effectiveRemoteTtsModel,
  effectiveRemoteTtsRate,
  handsFree,
  handsFreeController,
  speakNative,
  speakRemote,
  voiceLog,
  duplicateSuppressionMs = CHAT_RUNTIME_AUTO_TTS_DUPLICATE_SUPPRESSION_MS,
}: ChatMessageRuntimeAssistantSpeechActionsStateInput): ChatMessageRuntimeAssistantSpeechActionsState {
  const speakAssistantResponse = useCallback((content: string, reason: string, onSettled?: () => void) => {
    if (!ttsEnabledRef.current) {
      onSettled?.();
      return false;
    }

    const speechText = createChatRuntimeSpeechTextState(content);
    if (!speechText) {
      onSettled?.();
      return false;
    }

    const ttsTextKey = speechText.autoTextKey;
    const processedText = speechText.processedText;
    const now = Date.now();
    const lastSpokenAt = recentAutoSpeechByTextRef.current.get(ttsTextKey) ?? 0;
    if (now - lastSpokenAt < duplicateSuppressionMs) {
      onSettled?.();
      return false;
    }

    recentAutoSpeechByTextRef.current.set(ttsTextKey, now);
    for (const [key, spokenAt] of recentAutoSpeechByTextRef.current) {
      if (now - spokenAt > duplicateSuppressionMs) {
        recentAutoSpeechByTextRef.current.delete(key);
      }
    }

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      onSettled?.();
      if (handsFree) {
        handsFreeController.onSpeechFinished();
        voiceLog('tts-stopped', `Assistant speech stopped (${reason}).`);
      }
    };

    if (handsFree) {
      handsFreeController.onSpeechStarted();
      voiceLog('tts-started', `Assistant speech started (${reason}).`);
    }

    if (effectiveTtsProvider !== 'native' && config.baseUrl && config.apiKey) {
      void speakRemote(processedText, {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        providerId: effectiveTtsProvider,
        voice: effectiveRemoteTtsVoice ?? undefined,
        model: effectiveRemoteTtsModel ?? undefined,
        rate: effectiveRemoteTtsRate ?? undefined,
        onDone: settle,
        onError: settle,
        onStopped: settle,
      });
      return true;
    }

    const speechOptions: ChatMessageRuntimeNativeSpeechOptions = {
      language: 'en-US',
      rate: config.ttsRate ?? 1.0,
      pitch: config.ttsPitch ?? 1.0,
      onDone: settle,
      onError: settle,
      onStopped: settle,
    };
    if (config.ttsVoiceId) {
      speechOptions.voice = config.ttsVoiceId;
    }
    speakNative(processedText, speechOptions);
    return true;
  }, [
    config.apiKey,
    config.baseUrl,
    config.ttsPitch,
    config.ttsRate,
    config.ttsVoiceId,
    duplicateSuppressionMs,
    effectiveRemoteTtsModel,
    effectiveRemoteTtsRate,
    effectiveRemoteTtsVoice,
    effectiveTtsProvider,
    handsFree,
    handsFreeController,
    recentAutoSpeechByTextRef,
    speakNative,
    speakRemote,
    ttsEnabledRef,
    voiceLog,
  ]);

  return {
    speakAssistantResponse,
  };
}

export function useChatMessageRuntimeAssistantSpeechChromeActionsState(
  input: ChatMessageRuntimeAssistantSpeechChromeActionsStateInput,
): ChatMessageRuntimeAssistantSpeechActionsState {
  return useChatMessageRuntimeAssistantSpeechActionsState({
    ...input,
    speakNative: Speech.speak,
    speakRemote: speakRemoteTts,
  });
}

export function useChatMessageRuntimeSpeechPlaybackState(): ChatMessageRuntimeSpeechPlaybackState {
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const intendedSpeakingIndexRef = useRef<number | null>(null);

  const clearSpeakingMessage = useCallback(() => {
    setSpeakingMessageIndex(null);
  }, []);

  const clearIntendedSpeakingMessage = useCallback(() => {
    intendedSpeakingIndexRef.current = null;
  }, []);

  const setIntendedSpeakingMessage = useCallback((messageIndex: number) => {
    intendedSpeakingIndexRef.current = messageIndex;
  }, []);

  const startSpeakingMessage = useCallback((messageIndex: number) => {
    intendedSpeakingIndexRef.current = messageIndex;
    setSpeakingMessageIndex(messageIndex);
  }, []);

  return {
    speakingMessageIndex,
    setSpeakingMessageIndex,
    intendedSpeakingIndexRef,
    setIntendedSpeakingMessage,
    startSpeakingMessage,
    clearSpeakingMessage,
    clearIntendedSpeakingMessage,
  };
}

export function useChatMessageRuntimeSpeechActionsState({
  speakingMessageIndex,
  config,
  effectiveTtsProvider,
  effectiveRemoteTtsVoice,
  effectiveRemoteTtsModel,
  effectiveRemoteTtsRate,
  handsFree,
  handsFreeController,
  intendedSpeakingIndexRef,
  setIntendedSpeakingMessage,
  startSpeakingMessage,
  clearSpeakingMessage,
  clearIntendedSpeakingMessage,
  speakNative,
  stopNativeSpeech,
  speakRemote,
  stopRemoteSpeech,
  voiceLog,
}: ChatMessageRuntimeSpeechActionsStateInput): ChatMessageRuntimeSpeechActionsState {
  const finishHandsFreeSpeech = useCallback((message: string) => {
    if (!handsFree) return;
    handsFreeController.onSpeechFinished();
    voiceLog('tts-stopped', message);
  }, [handsFree, handsFreeController, voiceLog]);

  const clearFinishedSpeechMessage = useCallback((message: string) => {
    clearIntendedSpeakingMessage();
    finishHandsFreeSpeech(message);
    clearSpeakingMessage();
  }, [clearIntendedSpeakingMessage, clearSpeakingMessage, finishHandsFreeSpeech]);

  const clearStoppedSpeechMessage = useCallback(() => {
    if (intendedSpeakingIndexRef.current !== null) return;
    finishHandsFreeSpeech('Assistant speech stopped during message playback.');
    clearSpeakingMessage();
  }, [clearSpeakingMessage, finishHandsFreeSpeech, intendedSpeakingIndexRef]);

  const speakMessage = useCallback((messageIndex: number, content: string) => {
    if (speakingMessageIndex === messageIndex) {
      clearIntendedSpeakingMessage();
      stopNativeSpeech();
      finishHandsFreeSpeech('Assistant speech stopped from message playback.');
      clearSpeakingMessage();
      return;
    }

    setIntendedSpeakingMessage(messageIndex);
    stopNativeSpeech();
    stopRemoteSpeech();

    const speechText = createChatRuntimeSpeechTextState(content);
    if (!speechText) {
      clearIntendedSpeakingMessage();
      return;
    }

    if (handsFree) {
      handsFreeController.onSpeechStarted();
      voiceLog('tts-started', 'Assistant speech started from message playback.');
    }

    startSpeakingMessage(messageIndex);
    const processedText = speechText.processedText;
    if (effectiveTtsProvider !== 'native' && config.baseUrl && config.apiKey) {
      void speakRemote(processedText, {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        providerId: effectiveTtsProvider,
        voice: effectiveRemoteTtsVoice ?? undefined,
        model: effectiveRemoteTtsModel ?? undefined,
        rate: effectiveRemoteTtsRate ?? undefined,
        onDone: () => clearFinishedSpeechMessage('Assistant speech finished from message playback.'),
        onError: () => clearFinishedSpeechMessage('Assistant speech errored during message playback.'),
        onStopped: clearStoppedSpeechMessage,
      });
      return;
    }

    const speechOptions: ChatMessageRuntimeNativeSpeechOptions = {
      language: 'en-US',
      rate: config.ttsRate ?? 1.0,
      pitch: config.ttsPitch ?? 1.0,
      onDone: () => clearFinishedSpeechMessage('Assistant speech finished from message playback.'),
      onError: () => clearFinishedSpeechMessage('Assistant speech errored during message playback.'),
      onStopped: clearStoppedSpeechMessage,
    };
    if (config.ttsVoiceId) {
      speechOptions.voice = config.ttsVoiceId;
    }
    speakNative(processedText, speechOptions);
  }, [
    clearFinishedSpeechMessage,
    clearIntendedSpeakingMessage,
    clearSpeakingMessage,
    clearStoppedSpeechMessage,
    config.apiKey,
    config.baseUrl,
    config.ttsPitch,
    config.ttsRate,
    config.ttsVoiceId,
    effectiveRemoteTtsModel,
    effectiveRemoteTtsRate,
    effectiveRemoteTtsVoice,
    effectiveTtsProvider,
    finishHandsFreeSpeech,
    handsFree,
    handsFreeController,
    setIntendedSpeakingMessage,
    speakNative,
    speakRemote,
    speakingMessageIndex,
    startSpeakingMessage,
    stopNativeSpeech,
    stopRemoteSpeech,
    voiceLog,
  ]);

  return {
    speakMessage,
  };
}

export function useChatMessageRuntimeSpeechChromeActionsState(
  input: ChatMessageRuntimeSpeechChromeActionsStateInput,
): ChatMessageRuntimeSpeechActionsState {
  return useChatMessageRuntimeSpeechActionsState({
    ...input,
    speakNative: Speech.speak,
    stopNativeSpeech: Speech.stop,
    speakRemote: speakRemoteTts,
    stopRemoteSpeech: stopRemoteTts,
  });
}

export function useChatMessageRuntimeSpeechCleanupState({
  stopNativeSpeech,
  stopRemoteSpeech,
}: ChatMessageRuntimeSpeechCleanupStateInput): void {
  useEffect(() => {
    return () => {
      stopNativeSpeech();
      stopRemoteSpeech();
    };
  }, [stopNativeSpeech, stopRemoteSpeech]);
}

export function useChatMessageRuntimeSpeechChromeCleanupState(
  _input: ChatMessageRuntimeSpeechChromeCleanupStateInput = {},
): void {
  useChatMessageRuntimeSpeechCleanupState({
    stopNativeSpeech: Speech.stop,
    stopRemoteSpeech: stopRemoteTts,
  });
}

export function useChatMessageRuntimeResponseHistoryPanelChromeState({
  responses,
  ttsProvider = 'native',
  edgeTtsVoice = DEFAULT_EDGE_TTS_VOICE,
  remoteTtsVoice,
  remoteTtsModel,
  ttsRate = 1.0,
  ttsPitch = 1.0,
  ttsVoiceId,
  remoteBaseUrl,
  remoteApiKey,
  speakNative,
  stopNativeSpeech,
  speakRemote,
  stopRemoteSpeech,
}: ChatMessageRuntimeResponseHistoryPanelChromeStateInput): ChatMessageRuntimeResponseHistoryPanelChromeState {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const isMountedRef = useRef(true);
  const speechRequestIdRef = useRef(0);
  const prevCountRef = useRef(responses.length);
  const shouldAnimateNewest = responses.length > prevCountRef.current;

  const nextSpeechRequestId = useCallback(() => {
    speechRequestIdRef.current += 1;
    return speechRequestIdRef.current;
  }, []);

  const safeSetSpeakingIndex = useCallback((index: number | null) => {
    if (isMountedRef.current) {
      setSpeakingIndex(index);
    }
  }, []);

  const stopCurrentSpeech = useCallback(() => {
    const requestId = nextSpeechRequestId();
    stopNativeSpeech();
    stopRemoteSpeech();
    return requestId;
  }, [nextSpeechRequestId, stopNativeSpeech, stopRemoteSpeech]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopCurrentSpeech();
    };
  }, [stopCurrentSpeech]);

  useEffect(() => {
    if (isCollapsed && speakingIndex !== null) {
      stopCurrentSpeech();
      safeSetSpeakingIndex(null);
    }
  }, [isCollapsed, safeSetSpeakingIndex, speakingIndex, stopCurrentSpeech]);

  useEffect(() => {
    prevCountRef.current = responses.length;
  }, [responses.length]);

  const onToggleCollapsed = useCallback(() => {
    setIsCollapsed((current) => !current);
  }, []);

  const onSpeakResponse = useCallback((text: string, index: number) => {
    if (speakingIndex === index) {
      stopCurrentSpeech();
      safeSetSpeakingIndex(null);
      return;
    }

    const requestId = stopCurrentSpeech();
    const speechText = createChatRuntimeSpeechTextState(text);
    if (!speechText) {
      safeSetSpeakingIndex(null);
      return;
    }
    const processedText = speechText.processedText;

    const clearIfCurrentRequest = () => {
      if (speechRequestIdRef.current === requestId) {
        safeSetSpeakingIndex(null);
      }
    };

    safeSetSpeakingIndex(index);
    if (ttsProvider !== 'native' && remoteBaseUrl && remoteApiKey) {
      void speakRemote(processedText, {
        baseUrl: remoteBaseUrl,
        apiKey: remoteApiKey,
        providerId: ttsProvider,
        voice: remoteTtsVoice ?? edgeTtsVoice,
        model: remoteTtsModel ?? undefined,
        rate: ttsRate ?? undefined,
        onDone: clearIfCurrentRequest,
        onStopped: clearIfCurrentRequest,
        onError: clearIfCurrentRequest,
      });
      return;
    }

    const speechOptions: ChatMessageRuntimeNativeSpeechOptions = {
      language: 'en-US',
      rate: ttsRate ?? 1.0,
      pitch: ttsPitch ?? 1.0,
      onDone: clearIfCurrentRequest,
      onStopped: clearIfCurrentRequest,
      onError: clearIfCurrentRequest,
    };
    if (ttsVoiceId) {
      speechOptions.voice = ttsVoiceId;
    }
    speakNative(processedText, speechOptions);
  }, [
    edgeTtsVoice,
    remoteApiKey,
    remoteBaseUrl,
    remoteTtsModel,
    remoteTtsVoice,
    safeSetSpeakingIndex,
    speakNative,
    speakRemote,
    speakingIndex,
    stopCurrentSpeech,
    ttsPitch,
    ttsProvider,
    ttsRate,
    ttsVoiceId,
  ]);

  return {
    isCollapsed,
    shouldAnimateNewest,
    speakingIndex,
    onToggleCollapsed,
    onSpeakResponse,
  };
}

export function useChatMessageRuntimeQueuePanelDockChromeState({
  conversationId,
}: ChatMessageRuntimeQueuePanelDockChromeStateInput): ChatMessageRuntimeQueuePanelDockChromeState {
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  useEffect(() => {
    setIsListCollapsed(false);
  }, [conversationId]);

  const onToggleListCollapsed = useCallback(() => {
    setIsListCollapsed((current) => !current);
  }, []);

  return {
    isListCollapsed,
    onToggleListCollapsed,
  };
}

export function useChatComposerRuntimeEditBeforeSendState(): ChatComposerRuntimeEditBeforeSendState {
  const [editBeforeSendEnabled, setEditBeforeSendEnabled] = useState(false);

  const toggleEditBeforeSend = useCallback(() => {
    setEditBeforeSendEnabled((current) => !current);
  }, []);

  return {
    editBeforeSendEnabled,
    toggleEditBeforeSend,
  };
}

export function useChatRuntimeStatusState(): ChatRuntimeStatusState {
  const [responding, setResponding] = useState(false);
  const [conversationState, setConversationState] = useState<AgentConversationState | null>(null);
  const [latestStepSummary, setLatestStepSummary] = useState<AgentStepSummary | null>(null);
  const [connectionState, setConnectionState] = useState<RecoveryState | null>(null);

  return {
    responding,
    setResponding,
    conversationState,
    setConversationState,
    latestStepSummary,
    setLatestStepSummary,
    connectionState,
    setConnectionState,
  };
}

export function useChatRuntimeRequestDebugState(): ChatRuntimeRequestDebugState {
  const [requestDebugText, setRequestDebugText] = useState('');

  const clearRequestDebugText = useCallback(() => {
    setRequestDebugText('');
  }, []);

  return {
    requestDebugText,
    setRequestDebugText,
    clearRequestDebugText,
  };
}

export function useChatRuntimeRequestTrackingState({
  currentSessionId,
}: ChatRuntimeRequestTrackingStateInput): ChatRuntimeRequestTrackingState {
  const activeRequestIdRef = useRef<number>(0);
  const currentSessionIdRef = useRef<string | null>(currentSessionId);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  return {
    activeRequestIdRef,
    currentSessionIdRef,
  };
}

export function useChatRuntimeConnectionStatusSubscription({
  currentSessionId,
  connectionManager,
  currentSessionIdRef,
  setConnectionState,
  setResponding,
  setConversationState,
  setLatestStepSummary,
  logConnectionStatus,
}: ChatRuntimeConnectionStatusSubscriptionInput): void {
  useEffect(() => {
    if (!currentSessionId) {
      setConnectionState(null);
      setResponding(false);
      setConversationState(null);
      setLatestStepSummary(null);
      return;
    }

    const existingState = connectionManager.getConnectionState(currentSessionId);
    setConnectionState(existingState ?? null);

    const isActive = connectionManager.isConnectionActive(currentSessionId);
    setResponding(isActive);
    setConversationState(isActive ? 'running' : null);

    connectionManager.getOrCreateConnection(currentSessionId);

    return connectionManager.subscribeToConnectionStatus(currentSessionId, (state) => {
      if (currentSessionIdRef.current !== currentSessionId) return;
      setConnectionState(state);
      logConnectionStatus?.(formatConnectionStatus(state));
    });
  }, [
    connectionManager,
    currentSessionId,
    currentSessionIdRef,
    logConnectionStatus,
    setConnectionState,
    setConversationState,
    setLatestStepSummary,
    setResponding,
  ]);
}

export function useChatRuntimeForegroundState({
  handsFree,
  isFocused,
}: ChatRuntimeForegroundStateInput): ChatRuntimeForegroundState {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
    });

    return () => subscription.remove();
  }, []);

  const isAppActive = appState === 'active';

  return {
    appState,
    isAppActive,
    handsFreeRuntimeActive: handsFree && isFocused && isAppActive,
  };
}

export function useChatRuntimeHandsFreeMutableState({
  handsFree,
  ttsEnabled,
}: ChatRuntimeHandsFreeMutableStateInput): ChatRuntimeHandsFreeMutableState {
  const handsFreeRef = useRef<boolean>(handsFree);
  const handsFreePhaseRef = useRef<HandsFreePhase>('sleeping');
  const ttsEnabledRef = useRef<boolean>(ttsEnabled);

  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);

  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  const setHandsFreeRefValue = useCallback((value: boolean) => {
    handsFreeRef.current = value;
  }, []);

  const setHandsFreePhaseRefValue = useCallback((phase: HandsFreePhase) => {
    handsFreePhaseRef.current = phase;
  }, []);

  return {
    handsFreeRef,
    handsFreePhaseRef,
    ttsEnabledRef,
    setHandsFreeRefValue,
    setHandsFreePhaseRefValue,
  };
}

export function useChatRuntimeHandsFreeToggleActionsState<TConfig extends object>({
  config,
  setConfig,
  saveConfig,
  handsFreeController,
  handsFreeRef,
  setHandsFreeRefValue,
  stopRecognitionOnly,
  stopSpeech,
  stopRemoteSpeech,
  setDebugInfo,
}: ChatRuntimeHandsFreeToggleActionsStateInput<TConfig>): ChatRuntimeHandsFreeToggleActionsState {
  const toggleHandsFree = useCallback(async () => {
    const next = !handsFreeRef.current;
    setHandsFreeRefValue(next);
    const nextConfig = { ...config, handsFree: next };
    setConfig(nextConfig);
    try { await saveConfig(nextConfig); } catch {}
    if (!next) {
      handsFreeController.reset();
      void stopRecognitionOnly();
      stopSpeech();
      stopRemoteSpeech();
      setDebugInfo(getChatComposerRuntimeHandsFreeDebugMessage('disabled'));
    } else {
      setDebugInfo(getChatComposerRuntimeHandsFreeDebugMessage('enabled'));
    }
  }, [
    config,
    handsFreeController,
    handsFreeRef,
    saveConfig,
    setConfig,
    setDebugInfo,
    setHandsFreeRefValue,
    stopRecognitionOnly,
    stopRemoteSpeech,
    stopSpeech,
  ]);

  return {
    toggleHandsFree,
  };
}

export function useChatRuntimeHandsFreeToggleChromeActionsState<TConfig extends object>(
  input: ChatRuntimeHandsFreeToggleChromeActionsStateInput<TConfig>,
): ChatRuntimeHandsFreeToggleActionsState {
  return useChatRuntimeHandsFreeToggleActionsState({
    ...input,
    stopSpeech: Speech.stop,
    stopRemoteSpeech: stopRemoteTts,
  });
}

export function useChatRuntimeTextToSpeechToggleActionsState<TConfig extends object>({
  ttsEnabled,
  config,
  setConfig,
  saveConfig,
  handsFreeController,
  handsFreeRef,
  handsFreePhaseRef,
  clearIntendedSpeakingMessage,
  clearQueuedResponseSpeech,
  clearSpeakingMessage,
  stopSpeech,
  stopRemoteSpeech,
  voiceLog,
}: ChatRuntimeTextToSpeechToggleActionsStateInput<TConfig>): ChatRuntimeTextToSpeechToggleActionsState {
  const toggleTextToSpeech = useCallback(async () => {
    const next = !ttsEnabled;
    if (!next) {
      clearIntendedSpeakingMessage();
      stopSpeech();
      stopRemoteSpeech();
      clearQueuedResponseSpeech();
      clearSpeakingMessage();
      if (handsFreeRef.current && handsFreePhaseRef.current === 'speaking') {
        handsFreeController.onSpeechFinished();
        voiceLog('tts-stopped', 'Assistant speech stopped from speaker toggle.');
      }
    }
    const nextConfig = { ...config, ttsEnabled: next };
    setConfig(nextConfig);
    try { await saveConfig(nextConfig); } catch {}
  }, [
    clearIntendedSpeakingMessage,
    clearQueuedResponseSpeech,
    clearSpeakingMessage,
    config,
    handsFreeController,
    handsFreePhaseRef,
    handsFreeRef,
    saveConfig,
    setConfig,
    stopRemoteSpeech,
    stopSpeech,
    ttsEnabled,
    voiceLog,
  ]);

  return {
    toggleTextToSpeech,
  };
}

export function useChatRuntimeTextToSpeechToggleChromeActionsState<TConfig extends object>(
  input: ChatRuntimeTextToSpeechToggleChromeActionsStateInput<TConfig>,
): ChatRuntimeTextToSpeechToggleActionsState {
  return useChatRuntimeTextToSpeechToggleActionsState({
    ...input,
    stopSpeech: Speech.stop,
    stopRemoteSpeech: stopRemoteTts,
  });
}

export function useChatRuntimeConnectionRetryState(): ChatRuntimeConnectionRetryState {
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const clearLastFailedMessage = useCallback(() => {
    setLastFailedMessage(null);
  }, []);

  return {
    lastFailedMessage,
    setLastFailedMessage,
    clearLastFailedMessage,
  };
}

export function useChatRuntimeConnectionRetryActionState<
  TMessage extends ChatDisplayMessageLike,
  TToolCall = unknown,
  TToolResult = unknown,
>({
  lastFailedMessage,
  clearLastFailedMessage,
  getSessionClient,
  sessionStore,
  setMessages,
  send,
  retryDelayMs = 0,
}: ChatRuntimeConnectionRetryActionStateInput<TMessage, TToolCall, TToolResult>): ChatRuntimeConnectionRetryActionState {
  const handleRetryLastFailedMessage = useCallback(async () => {
    const messageToRetry = lastFailedMessage;
    if (!messageToRetry) return;
    clearLastFailedMessage();

    const retryClient = getSessionClient();
    const recoveryConversationId = retryClient?.getRecoveryConversationId();

    if (recoveryConversationId && retryClient) {
      console.log('[ChatRuntime] Retry: Checking server conversation state:', recoveryConversationId);
      try {
        const serverConversation = await retryClient.getConversation(recoveryConversationId);
        if (serverConversation && serverConversation.messages.length > 0) {
          const serverMessages = serverConversation.messages;
          const recoveredMessages = createChatMessageRuntimeRecoverableHistoryMessages<
            TMessage,
            TToolCall,
            TToolResult
          >(serverMessages);

          if (recoveredMessages) {
            console.log('[ChatRuntime] Retry: Server already has response, syncing state');

            await sessionStore.setServerConversationId(recoveryConversationId);

            setMessages(recoveredMessages);
            await sessionStore.setMessages(recoveredMessages);

            console.log('[ChatRuntime] Retry: Successfully recovered', recoveredMessages.length, 'messages from server');
            return;
          }
        }
      } catch (error) {
        console.log('[ChatRuntime] Retry: Could not fetch server state, will retry message:', error);
      }

      console.log('[ChatRuntime] Retry: Using recovery conversationId:', recoveryConversationId);
      await sessionStore.setServerConversationId(recoveryConversationId);
    }

    setMessages((messages) => removeChatMessageRuntimePendingTurnMessages(messages));
    // Let React commit the message removal before send() reads current state.
    setTimeout(() => {
      void send(messageToRetry);
    }, retryDelayMs);
  }, [
    clearLastFailedMessage,
    getSessionClient,
    lastFailedMessage,
    retryDelayMs,
    send,
    sessionStore,
    setMessages,
  ]);

  const handleRetryLastFailedMessagePress = useCallback(() => {
    void handleRetryLastFailedMessage();
  }, [handleRetryLastFailedMessage]);

  return {
    handleRetryLastFailedMessage,
    handleRetryLastFailedMessagePress,
  };
}

export function useChatMessageRuntimeBranchProgressState({
  sessionId,
}: ChatMessageRuntimeBranchProgressStateInput = {}): ChatMessageRuntimeBranchProgressState {
  const [pendingBranchMessageIndex, setPendingBranchMessageIndex] = useState<number | null>(null);

  useEffect(() => {
    setPendingBranchMessageIndex(null);
  }, [sessionId]);

  const beginBranchMessage = useCallback((messageIndex: number) => {
    setPendingBranchMessageIndex(messageIndex);
  }, []);

  const clearBranchMessage = useCallback(() => {
    setPendingBranchMessageIndex(null);
  }, []);

  return {
    pendingBranchMessageIndex,
    beginBranchMessage,
    clearBranchMessage,
  };
}

export function useChatMessageRuntimeBranchActionsState<
  TBranchClient extends ChatMessageRuntimeBranchClient,
>({
  branchClient,
  serverConversationId,
  sessionStore,
  beginBranchMessage,
  clearBranchMessage,
  navigateToChat,
  showAlert,
}: ChatMessageRuntimeBranchActionsStateInput<TBranchClient>): ChatMessageRuntimeBranchActionsState {
  const handleBranchFromMessage = useCallback(async (messageIndex: number) => {
    if (!branchClient || !serverConversationId) {
      const unavailableAlert = getChatRuntimeBranchUnavailableMobileResolvedAlertState();
      showAlert(unavailableAlert.title, unavailableAlert.message);
      return;
    }

    beginBranchMessage(messageIndex);
    try {
      const branchedConversation = await branchClient.branchConversation(serverConversationId, { messageIndex });
      await sessionStore.syncWithServer(branchClient);
      const branchedSession = sessionStore.findSessionByServerConversationId(branchedConversation.id);
      if (branchedSession) {
        sessionStore.setCurrentSession(branchedSession.id);
        navigateToChat();
        return;
      }

      const createdAlert = getChatRuntimeBranchCreatedMobileResolvedAlertState();
      showAlert(createdAlert.title, createdAlert.message);
    } catch (error: any) {
      const failedAlert = getChatRuntimeBranchFailedMobileResolvedAlertState(error);
      showAlert(failedAlert.title, failedAlert.message);
    } finally {
      clearBranchMessage();
    }
  }, [
    beginBranchMessage,
    branchClient,
    clearBranchMessage,
    navigateToChat,
    serverConversationId,
    sessionStore,
    showAlert,
  ]);

  const handleBranchFromMessagePress = useCallback((messageIndex: number) => {
    void handleBranchFromMessage(messageIndex);
  }, [handleBranchFromMessage]);

  return {
    handleBranchFromMessage,
    handleBranchFromMessagePress,
  };
}

export function useChatMessageRuntimeBranchChromeActionsState<
  TBranchClient extends ChatMessageRuntimeBranchClient,
>(
  input: ChatMessageRuntimeBranchChromeActionsStateInput<TBranchClient>,
): ChatMessageRuntimeBranchActionsState {
  return useChatMessageRuntimeBranchActionsState({
    ...input,
    showAlert: Alert.alert,
  });
}

export function useChatRuntimeCurrentSessionPinActionsState({
  sessionStore,
}: ChatRuntimeCurrentSessionPinActionsStateInput): ChatRuntimeCurrentSessionPinActionsState {
  const handleToggleCurrentSessionPinned = useCallback(() => {
    const currentSessionId = sessionStore.currentSessionId;
    if (!currentSessionId) return;
    void sessionStore.toggleSessionPinned(currentSessionId);
  }, [sessionStore]);

  return {
    handleToggleCurrentSessionPinned,
  };
}

export function useChatRuntimeBackToSessionsActionsState({
  navigation,
}: ChatRuntimeBackToSessionsActionsStateInput): ChatRuntimeBackToSessionsActionsState {
  const handleBackToSessions = useCallback(() => {
    navigation.navigate('Sessions');
  }, [navigation]);

  return {
    handleBackToSessions,
  };
}

export function useChatRuntimeNavigateToChatActionsState({
  navigation,
}: ChatRuntimeNavigateToChatActionsStateInput): ChatRuntimeNavigateToChatActionsState {
  const navigateToChat = useCallback(() => {
    navigation.navigate('Chat');
  }, [navigation]);

  return {
    navigateToChat,
  };
}

export function useChatMessageRuntimeKillSwitchActionsState<
  TKillSwitchClient extends ChatMessageRuntimeKillSwitchClient,
>({
  platform,
  getKillSwitchClient,
  confirmWeb,
  showWebAlert,
  confirmNative,
  showAlert,
}: ChatMessageRuntimeKillSwitchActionsStateInput<TKillSwitchClient>): ChatMessageRuntimeKillSwitchActionsState {
  const handleKillSwitch = useCallback(async () => {
    console.log('[ChatMessageRuntime] Kill switch button pressed');
    const client = getKillSwitchClient();
    if (!client) {
      console.error('[ChatMessageRuntime] No client available for kill switch');
      return;
    }

    const runKillSwitch = async () => {
      try {
        const result = await client.killSwitch();
        const resultAlert = getChatRuntimeKillSwitchResultMobileResolvedAlertState(result);
        if (platform === 'web') {
          showWebAlert(resultAlert.webMessage);
          return;
        }
        showAlert(resultAlert.title, resultAlert.message);
      } catch (error: any) {
        console.error('[ChatMessageRuntime] Kill switch error:', error);
        const failedAlert = getChatRuntimeKillSwitchConnectionFailedMobileResolvedAlertState(error);
        if (platform === 'web') {
          showWebAlert(failedAlert.webMessage);
          return;
        }
        showAlert(failedAlert.title, failedAlert.message);
      }
    };

    const confirmationAlert = getChatRuntimeKillSwitchConfirmationMobileResolvedAlertState();
    if (platform === 'web') {
      if (confirmWeb(confirmationAlert.webMessage)) {
        await runKillSwitch();
      }
      return;
    }

    confirmNative({
      title: confirmationAlert.title,
      message: confirmationAlert.message,
      cancelLabel: confirmationAlert.cancelLabel,
      confirmLabel: confirmationAlert.confirmLabel,
      onConfirm: () => {
        void runKillSwitch();
      },
    });
  }, [
    confirmNative,
    confirmWeb,
    getKillSwitchClient,
    platform,
    showAlert,
    showWebAlert,
  ]);

  return {
    handleKillSwitch,
  };
}

export function useChatMessageRuntimeKillSwitchChromeActionsState<
  TKillSwitchClient extends ChatMessageRuntimeKillSwitchClient,
>(
  input: ChatMessageRuntimeKillSwitchChromeActionsStateInput<TKillSwitchClient>,
): ChatMessageRuntimeKillSwitchActionsState {
  return useChatMessageRuntimeKillSwitchActionsState({
    ...input,
    confirmWeb: confirmChatRuntimeWebDialog,
    showWebAlert: showChatRuntimeWebAlert,
    confirmNative: createChatMessageRuntimeKillSwitchNativeConfirmPresenter(Alert.alert),
    showAlert: Alert.alert,
  });
}

export function useChatMessageRuntimeToolApprovalResponseState({
  sessionId,
}: ChatMessageRuntimeToolApprovalResponseStateInput = {}): ChatMessageRuntimeToolApprovalResponseState {
  const [pendingToolApprovalResponseId, setPendingToolApprovalResponseId] = useState<string | null>(null);

  useEffect(() => {
    setPendingToolApprovalResponseId(null);
  }, [sessionId]);

  const beginToolApprovalResponse = useCallback((approvalId: string) => {
    setPendingToolApprovalResponseId(approvalId);
  }, []);

  const clearToolApprovalResponse = useCallback(() => {
    setPendingToolApprovalResponseId(null);
  }, []);

  return {
    pendingToolApprovalResponseId,
    beginToolApprovalResponse,
    clearToolApprovalResponse,
  };
}

export function useChatMessageRuntimeToolApprovalActionsState<
  TMessage extends ChatMessageRuntimeToolApprovalStateMessageLike,
>({
  approvalClient,
  beginToolApprovalResponse,
  clearToolApprovalResponse,
  setMessages,
  showAlert,
}: ChatMessageRuntimeToolApprovalActionsStateInput<TMessage>): ChatMessageRuntimeToolApprovalActionsState {
  const respondToToolApproval = useCallback(async (approvalId: string, approved: boolean) => {
    if (!approvalClient) {
      const connectionRequiredAlert = getChatRuntimeToolApprovalConnectionRequiredMobileResolvedAlertState();
      showAlert(connectionRequiredAlert.title, connectionRequiredAlert.message);
      return;
    }

    beginToolApprovalResponse(approvalId);
    try {
      const response = await approvalClient.respondToToolApproval(approvalId, approved);
      setMessages((current) => removeChatMessageRuntimeToolApprovalMessage(current, approvalId));
      if (!response.success) {
        const unavailableAlert = getChatRuntimeToolApprovalUnavailableMobileResolvedAlertState();
        showAlert(unavailableAlert.title, unavailableAlert.message);
      }
    } catch (error: unknown) {
      const failedAlert = getChatRuntimeToolApprovalFailedMobileResolvedAlertState(error);
      showAlert(failedAlert.title, failedAlert.message);
    } finally {
      clearToolApprovalResponse();
    }
  }, [
    approvalClient,
    beginToolApprovalResponse,
    clearToolApprovalResponse,
    setMessages,
    showAlert,
  ]);

  return {
    respondToToolApproval,
  };
}

export function useChatMessageRuntimeToolApprovalChromeActionsState<
  TMessage extends ChatMessageRuntimeToolApprovalStateMessageLike,
>(
  input: ChatMessageRuntimeToolApprovalChromeActionsStateInput<TMessage>,
): ChatMessageRuntimeToolApprovalActionsState {
  return useChatMessageRuntimeToolApprovalActionsState({
    ...input,
    showAlert: Alert.alert,
  });
}

export function scheduleChatMessageRuntimeNextQueuedMessage<
  TQueuedMessage extends ChatMessageRuntimeQueueMessage,
>({
  currentConversationId,
  queue,
  canProcessQueue = true,
  handsFree,
  handsFreePhase,
  handsFreeRef,
  handsFreePhaseRef,
  processQueuedMessage,
  processDelayMs = 100,
  log = console.log,
  logMessage = '[ChatMessageRuntime] Processing next queued message:',
}: ChatMessageRuntimeNextQueuedMessageSchedulerInput<TQueuedMessage>): void {
  if (!canProcessQueue) return;
  if (queue.isQueuePaused(currentConversationId)) return;

  const nextMessage = queue.peek(currentConversationId);
  if (!nextMessage) return;

  if (handsFree && (handsFreePhase ?? handsFreePhaseRef.current) === 'paused') return;

  log(logMessage, nextMessage.id);
  setTimeout(() => {
    if (queue.isQueuePaused(currentConversationId)) {
      return;
    }
    if (handsFreeRef.current && handsFreePhaseRef.current === 'paused') {
      return;
    }
    queue.markProcessing(currentConversationId, nextMessage.id);
    void processQueuedMessage(nextMessage);
  }, processDelayMs);
}

export function useChatMessageRuntimeQueuePanelState<
  TQueuedMessage extends ChatMessageRuntimeQueueMessage,
>({
  currentConversationId,
  queue,
  responding,
  handsFree,
  handsFreePhase,
  handsFreeRef,
  handsFreePhaseRef,
  processQueuedMessage,
  processDelayMs = 100,
}: ChatMessageRuntimeQueuePanelStateInput<TQueuedMessage>): ChatMessageRuntimeQueuePanelState<TQueuedMessage> {
  const queuedMessages = queue.getQueue(currentConversationId);
  const isMessageQueuePaused = queue.isQueuePaused(currentConversationId);
  const nextQueuedMessage = !responding && !isMessageQueuePaused ? queue.peek(currentConversationId) : null;

  const handleProcessNextQueuedMessage = useCallback(() => {
    scheduleChatMessageRuntimeNextQueuedMessage({
      currentConversationId,
      queue,
      canProcessQueue: !responding,
      handsFree,
      handsFreePhase,
      handsFreeRef,
      handsFreePhaseRef,
      processQueuedMessage,
      processDelayMs,
      logMessage: '[ChatMessageRuntime] Processing queue while idle, next message:',
    });
  }, [
    currentConversationId,
    handsFree,
    handsFreePhase,
    handsFreePhaseRef,
    handsFreeRef,
    processDelayMs,
    processQueuedMessage,
    queue,
    responding,
  ]);

  const handlePauseMessageQueue = useCallback(() => {
    queue.pauseQueue(currentConversationId);
  }, [currentConversationId, queue]);

  const handleResumeMessageQueue = useCallback(() => {
    queue.resumeQueue(currentConversationId);
    if (!responding) {
      setTimeout(() => {
        handleProcessNextQueuedMessage();
      }, 0);
    }
  }, [currentConversationId, handleProcessNextQueuedMessage, queue, responding]);

  const handleRemoveQueuedMessage = useCallback((messageId: string) => {
    queue.removeFromQueue(currentConversationId, messageId);
  }, [currentConversationId, queue]);

  const handleUpdateQueuedMessage = useCallback((messageId: string, text: string) => {
    queue.updateText(currentConversationId, messageId, text);
  }, [currentConversationId, queue]);

  const handleRetryQueuedMessage = useCallback((messageId: string) => {
    queue.resetToPending(currentConversationId, messageId);
    if (!responding) {
      handleProcessNextQueuedMessage();
    }
  }, [currentConversationId, handleProcessNextQueuedMessage, queue, responding]);

  const handleClearQueuedMessages = useCallback(() => {
    queue.clearQueue(currentConversationId);
  }, [currentConversationId, queue]);

  return {
    queuedMessages,
    isMessageQueuePaused,
    nextQueuedMessage,
    handleProcessNextQueuedMessage,
    handlePauseMessageQueue,
    handleResumeMessageQueue,
    handleRemoveQueuedMessage,
    handleUpdateQueuedMessage,
    handleRetryQueuedMessage,
    handleClearQueuedMessages,
  };
}

export function useChatMessageCopyFeedbackState(
  feedbackResetDelayMs: number = getChatMessageCopyFeedbackResetDelayMs(),
) {
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const copiedMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedMessageTimeoutRef.current) {
        clearTimeout(copiedMessageTimeoutRef.current);
      }
    };
  }, []);

  const clearCopiedMessageFeedback = useCallback(() => {
    if (copiedMessageTimeoutRef.current) {
      clearTimeout(copiedMessageTimeoutRef.current);
      copiedMessageTimeoutRef.current = null;
    }
    setCopiedMessageIndex(null);
  }, []);

  const showCopiedMessageFeedback = useCallback((messageIndex: number) => {
    setCopiedMessageIndex(messageIndex);
    if (copiedMessageTimeoutRef.current) {
      clearTimeout(copiedMessageTimeoutRef.current);
    }
    copiedMessageTimeoutRef.current = setTimeout(() => {
      setCopiedMessageIndex((current) => (current === messageIndex ? null : current));
    }, feedbackResetDelayMs);
  }, [feedbackResetDelayMs]);

  return {
    copiedMessageIndex,
    clearCopiedMessageFeedback,
    showCopiedMessageFeedback,
  };
}

export function useChatMessageRuntimeClipboardActionsState({
  copyText,
  showAlert,
  showCopiedMessageFeedback,
}: ChatMessageRuntimeClipboardActionsStateInput): ChatMessageRuntimeClipboardActionsState {
  const handleCopyMessage = useCallback(async (messageIndex: number, content: string) => {
    const copyContent = content.trim();
    if (!copyContent) return;

    try {
      await copyText(copyContent);
      showCopiedMessageFeedback(messageIndex);
    } catch (error) {
      const failedAlert = getChatMessageCopyFailureAlertState(error);
      showAlert(failedAlert.title, failedAlert.message);
    }
  }, [copyText, showAlert, showCopiedMessageFeedback]);

  const handleCopyToolPayload = useCallback(async (content: string) => {
    const copyContent = content.trim();
    if (!copyContent) return;

    try {
      await copyText(copyContent);
    } catch (error) {
      const failedAlert = getChatMessageToolExecutionCopyFailureResolvedAlertState(error);
      showAlert(failedAlert.title, failedAlert.message);
    }
  }, [copyText, showAlert]);

  return {
    handleCopyMessage,
    handleCopyToolPayload,
  };
}

export function useChatMessageRuntimeClipboardChromeActionsState(
  input: ChatMessageRuntimeClipboardChromeActionsStateInput,
): ChatMessageRuntimeClipboardActionsState {
  return useChatMessageRuntimeClipboardActionsState({
    ...input,
    copyText: Clipboard.setStringAsync,
    showAlert: Alert.alert,
  });
}

export function createChatRuntimeNavigationHeaderOptions({
  agentSelectorRenderState,
  onAgentSelectorPress,
  agentSelectorLabelNumberOfLines,
  backButtonRenderState,
  onBackButtonPress,
  pinButtonRenderState,
  onPinButtonPress,
  pinButtonIsActive,
  conversationStatusRenderState,
  conversationStatusSpinnerSource,
  turnDurationRenderState,
  killSwitchButtonShouldRender,
  killSwitchButtonRenderState,
  onKillSwitchButtonPress,
  handsFreeButtonRenderState,
  onHandsFreeButtonPress,
  styles,
}: ChatRuntimeNavigationHeaderOptionsInput): ChatRuntimeNavigationHeaderOptions {
  const headerOptionParts: ChatRuntimeNavigationHeaderOptionParts =
    createChatRuntimeNavigationHeaderOptionsParts({
      agentSelectorRenderState,
      onAgentSelectorPress,
      agentSelectorLabelNumberOfLines,
      backButtonRenderState,
      onBackButtonPress,
      pinButtonRenderState,
      onPinButtonPress,
      pinButtonIsActive,
      conversationStatusRenderState,
      conversationStatusSpinnerSource,
      turnDurationRenderState,
      killSwitchButtonShouldRender,
      killSwitchButtonRenderState,
      onKillSwitchButtonPress,
      handsFreeButtonRenderState,
      onHandsFreeButtonPress,
    });
  const headerParts: ChatRuntimeNavigationHeaderMobileOptionParts =
    createChatRuntimeNavigationHeaderOptionsMobilePropsParts({
      ...headerOptionParts,
      styles,
    });

  return {
    headerTitle: () => (
      <ChatRuntimeHeaderAgentSelector
        {...headerParts.agentSelector}
      />
    ),
    headerLeft: () => (
      <ChatRuntimeHeaderActionsRow {...headerParts.actionsRow.props}>
        <ChatRuntimeHeaderIconButton
          {...headerParts.backButton}
        />
        <ChatRuntimeHeaderIconButton
          {...headerParts.pinButton}
        />
      </ChatRuntimeHeaderActionsRow>
    ),
    headerRight: () => (
      <ChatRuntimeHeaderActionsRow {...headerParts.actionsRow.props}>
        <ChatRuntimeHeaderConversationStatus
          {...headerParts.conversationStatus}
        />
        <ChatRuntimeHeaderTurnDuration
          {...headerParts.turnDuration}
        />
        <ChatRuntimeHeaderIconButton
          {...headerParts.killSwitchButton}
        />
        <ChatRuntimeHeaderIconButton
          {...headerParts.handsFreeButton}
        />
      </ChatRuntimeHeaderActionsRow>
    ),
  };
}

export function useChatRuntimeNavigationHeaderOptions({
  navigation,
  agentSelectorRenderState,
  onAgentSelectorPress,
  agentSelectorLabelNumberOfLines,
  backButtonRenderState,
  onBackButtonPress,
  pinButtonRenderState,
  onPinButtonPress,
  pinButtonIsActive,
  conversationStatusRenderState,
  conversationStatusSpinnerSource,
  turnDurationRenderState,
  killSwitchButtonShouldRender,
  killSwitchButtonRenderState,
  onKillSwitchButtonPress,
  handsFreeButtonRenderState,
  onHandsFreeButtonPress,
  styles,
}: ChatRuntimeNavigationHeaderOptionsEffectInput): void {
  useLayoutEffect(() => {
    navigation?.setOptions?.(createChatRuntimeNavigationHeaderOptions({
      agentSelectorRenderState,
      onAgentSelectorPress,
      agentSelectorLabelNumberOfLines,
      backButtonRenderState,
      onBackButtonPress,
      pinButtonRenderState,
      onPinButtonPress,
      pinButtonIsActive,
      conversationStatusRenderState,
      conversationStatusSpinnerSource,
      turnDurationRenderState,
      killSwitchButtonShouldRender,
      killSwitchButtonRenderState,
      onKillSwitchButtonPress,
      handsFreeButtonRenderState,
      onHandsFreeButtonPress,
      styles,
    }));
  }, [
    agentSelectorLabelNumberOfLines,
    agentSelectorRenderState,
    backButtonRenderState,
    conversationStatusRenderState,
    conversationStatusSpinnerSource,
    handsFreeButtonRenderState,
    killSwitchButtonRenderState,
    killSwitchButtonShouldRender,
    navigation,
    onAgentSelectorPress,
    onBackButtonPress,
    onHandsFreeButtonPress,
    onKillSwitchButtonPress,
    onPinButtonPress,
    pinButtonIsActive,
    pinButtonRenderState,
    styles,
    turnDurationRenderState,
  ]);
}

export function useChatRuntimeNavigationHeaderChromeOptions({
  navigation,
  colors,
  spinnerSource,
  agentName,
  isPinned = false,
  handsFree = false,
  conversationState = null,
  isResponding = false,
  turnDurationMs = null,
  turnDurationIsLive = false,
  onAgentSelectorPress,
  onBackButtonPress,
  onPinButtonPress,
  onKillSwitchButtonPress,
  onHandsFreeButtonPress,
  styles,
}: ChatRuntimeNavigationHeaderChromeOptionsInput): void {
  const headerRenderState = useMemo(
    () => getChatRuntimeNavigationHeaderMobileRenderState({
      agentName,
      isPinned,
      handsFree,
      conversationState,
      isResponding,
      turnDurationMs,
      turnDurationIsLive,
      colors,
    }),
    [
      agentName,
      isPinned,
      handsFree,
      conversationState,
      isResponding,
      turnDurationMs,
      turnDurationIsLive,
      colors,
    ],
  );

  useChatRuntimeNavigationHeaderOptions({
    navigation,
    ...headerRenderState,
    onAgentSelectorPress,
    onBackButtonPress,
    onPinButtonPress,
    conversationStatusSpinnerSource: spinnerSource,
    onKillSwitchButtonPress,
    onHandsFreeButtonPress,
    styles,
  });
}

export function ChatRuntimeHeaderAgentSelector({
  renderState,
  onPress,
  labelNumberOfLines,
  styles,
}: ChatRuntimeHeaderAgentSelectorProps) {
  const agentSelectorParts: ChatRuntimeHeaderAgentSelectorParts =
    createChatRuntimeHeaderAgentSelectorMobilePropsParts({
    renderState,
    onPress,
    labelNumberOfLines,
    styles,
  });

  return (
    <ChatRuntimeHeaderAgentSelectorTouchable
      {...agentSelectorParts.touchable.props}
    >
      <ChatRuntimeHeaderAgentSelectorTouchableContent
        {...agentSelectorParts.touchable.content}
      />
    </ChatRuntimeHeaderAgentSelectorTouchable>
  );
}

export function ChatRuntimeHeaderAgentSelectorTouchableContent({
  chip,
}: ChatRuntimeHeaderAgentSelectorTouchableContentProps) {
  return (
    <ChatRuntimeHeaderAgentSelectorChip
      {...chip.props}
    >
      <ChatRuntimeHeaderAgentSelectorChipContent
        {...chip.content}
      />
    </ChatRuntimeHeaderAgentSelectorChip>
  );
}

export function ChatRuntimeHeaderAgentSelectorChipContent({
  label,
  icon,
}: ChatRuntimeHeaderAgentSelectorChipContentProps) {
  return (
    <>
      <ChatRuntimeHeaderAgentSelectorLabel
        {...label.props}
      />
      <ChatRuntimeHeaderAgentSelectorIcon
        {...icon.props}
      />
    </>
  );
}

export function ChatRuntimeHeaderAgentSelectorTouchable({
  children,
  ...props
}: ChatRuntimeHeaderAgentSelectorTouchableProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatRuntimeHeaderAgentSelectorChip({
  children,
  ...props
}: ChatRuntimeHeaderAgentSelectorChipProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderAgentSelectorLabel({
  props,
  text,
}: ChatRuntimeHeaderAgentSelectorLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatRuntimeHeaderAgentSelectorIcon(props: ChatRuntimeHeaderAgentSelectorIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatRuntimeHeaderActionsRow({
  children,
  ...props
}: ChatRuntimeHeaderActionsRowProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderIconButton({
  shouldRender = true,
  renderState,
  onPress,
  style,
  activeStyle,
  iconContainerStyle,
  isActive,
}: ChatRuntimeHeaderIconButtonProps) {
  const iconButtonParts: ChatRuntimeHeaderIconButtonParts =
    createChatRuntimeHeaderIconButtonMobilePropsParts({
    shouldRender,
    renderState,
    onPress,
    style,
    activeStyle,
    iconContainerStyle,
    isActive,
  });
  const iconButtonTouchable = iconButtonParts.touchable;

  if (!iconButtonTouchable.shouldRender) return null;

  return (
    <ChatRuntimeHeaderIconButtonTouchable
      {...iconButtonTouchable.props}
    >
      <ChatRuntimeHeaderIconButtonTouchableContent
        {...iconButtonTouchable.content}
      />
    </ChatRuntimeHeaderIconButtonTouchable>
  );
}

export function ChatRuntimeHeaderIconButtonTouchableContent({
  icon,
  iconContainer,
}: ChatRuntimeHeaderIconButtonTouchableContentProps) {
  const iconContent = (
    <ChatRuntimeHeaderIconButtonIcon
      {...icon.props}
    />
  );

  if (iconContainer.shouldRender) {
    return (
      <ChatRuntimeHeaderIconButtonIconContainer
        {...iconContainer.props}
      >
        {iconContent}
      </ChatRuntimeHeaderIconButtonIconContainer>
    );
  }

  return iconContent;
}

export function ChatRuntimeHeaderIconButtonTouchable({
  'aria-checked': ariaChecked,
  accessibilityState,
  children,
  ...props
}: ChatRuntimeHeaderIconButtonTouchableProps) {
  return (
    <TouchableOpacity
      {...props}
      accessibilityState={accessibilityState as AccessibilityState | undefined}
      aria-checked={ariaChecked as boolean | 'mixed' | undefined}
    >
      {children}
    </TouchableOpacity>
  );
}

export function ChatRuntimeHeaderIconButtonIconContainer({
  children,
  ...props
}: ChatRuntimeHeaderIconButtonIconContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderIconButtonIcon(props: ChatRuntimeHeaderIconButtonIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatRuntimeHeaderConversationStatus({
  renderState,
  spinnerSource,
  styles,
}: ChatRuntimeHeaderConversationStatusProps) {
  const conversationStatusParts: ChatRuntimeHeaderConversationStatusParts =
    createChatRuntimeHeaderConversationStatusMobilePropsParts({
    renderState,
    spinnerSource,
    styles,
  });
  const conversationStatusContainer = conversationStatusParts.container;

  if (!conversationStatusContainer.shouldRender) return null;

  return (
    <ChatRuntimeHeaderConversationStatusContainer
      {...conversationStatusContainer.props}
    >
      <ChatRuntimeHeaderConversationStatusContainerContent
        {...conversationStatusContainer.content}
      />
    </ChatRuntimeHeaderConversationStatusContainer>
  );
}

export function ChatRuntimeHeaderConversationStatusContainerContent({
  runningIndicator,
  label,
}: ChatRuntimeHeaderConversationStatusContainerContentProps) {
  return (
    <>
      {runningIndicator.shouldRender ? (
        <ChatRuntimeHeaderConversationStatusRunningIndicator
          {...runningIndicator.props}
        />
      ) : null}
      <ChatRuntimeHeaderConversationStatusLabel
        {...label.props}
      />
    </>
  );
}

export function ChatRuntimeHeaderConversationStatusContainer({
  children,
  ...props
}: ChatRuntimeHeaderConversationStatusContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderConversationStatusRunningIndicator(
  props: ChatRuntimeHeaderConversationStatusRunningIndicatorProps,
) {
  return (
    <Image {...props} />
  );
}

export function ChatRuntimeHeaderConversationStatusLabel({
  props,
  text,
}: ChatRuntimeHeaderConversationStatusLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatRuntimeHeaderTurnDuration({
  renderState,
  styles,
}: ChatRuntimeHeaderTurnDurationProps) {
  const turnDurationParts: ChatRuntimeHeaderTurnDurationParts =
    createChatRuntimeHeaderTurnDurationMobilePropsParts({
    renderState,
    styles,
  });
  const turnDurationContainer = turnDurationParts.container;

  if (!turnDurationContainer.shouldRender) return null;

  return (
    <ChatRuntimeHeaderTurnDurationContainer
      {...turnDurationContainer.props}
    >
      <ChatRuntimeHeaderTurnDurationContainerContent
        {...turnDurationContainer.content}
      />
    </ChatRuntimeHeaderTurnDurationContainer>
  );
}

export function ChatRuntimeHeaderTurnDurationContainerContent({
  icon,
  label,
}: ChatRuntimeHeaderTurnDurationContainerContentProps) {
  return (
    <>
      <ChatRuntimeHeaderTurnDurationIcon
        {...icon.props}
      />
      <ChatRuntimeHeaderTurnDurationLabel
        {...label.props}
      />
    </>
  );
}

export function ChatRuntimeHeaderTurnDurationContainer({
  children,
  ...props
}: ChatRuntimeHeaderTurnDurationContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderTurnDurationIcon(props: ChatRuntimeHeaderTurnDurationIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatRuntimeHeaderTurnDurationLabel({
  props,
  text,
}: ChatRuntimeHeaderTurnDurationLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatConversationHomeQuickStarts<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>({
  shouldRender,
  items,
  isLoading,
  runningTaskId,
  onPress,
  onEditPrompt,
  onDeletePrompt,
  shortcutRenderState,
  styles,
}: ChatConversationHomeQuickStartsProps<TPrompt, TTask>) {
  const quickStartsParts: ChatConversationHomeQuickStartsParts<TPrompt, TTask> =
    createChatRuntimeHomeQuickStartsMobilePropsParts<
      TPrompt,
      TTask,
      GestureResponderEvent,
      ChatConversationHomeQuickStartsStyles
    >({
      shouldRender,
      items,
      isLoading,
      runningTaskId,
      onPress,
      onEditPrompt,
      onDeletePrompt,
      shortcutRenderState,
      styles,
    });
  const quickStartsContainer = quickStartsParts.container;

  if (!quickStartsContainer.shouldRender) return null;

  return (
    <ChatConversationHomeQuickStartsContainer
      container={quickStartsContainer}
    >
      <ChatConversationHomeQuickStartsContent
        grid={quickStartsParts.grid}
        emptyState={quickStartsParts.emptyState}
      />
    </ChatConversationHomeQuickStartsContainer>
  );
}

export function ChatConversationHomeQuickStartsContainer({
  container,
  children,
}: ChatConversationHomeQuickStartsContainerProps) {
  return (
    <View {...container.props}>
      {children}
    </View>
  );
}

export function ChatConversationHomeQuickStartsContent({
  grid,
  emptyState,
}: ChatConversationHomeQuickStartsContentProps) {
  if (grid.shouldRender) {
    return (
      <ChatConversationHomeQuickStartsGrid
        grid={grid}
      />
    );
  }

  return (
    <ChatConversationHomeQuickStartsEmptyState
      emptyState={emptyState}
    />
  );
}

export function ChatConversationHomeQuickStartsGrid({
  grid,
}: ChatConversationHomeQuickStartsGridProps) {
  if (!grid.shouldRender) return null;

  return (
    <View {...grid.props}>
      {grid.content.items.map((item) => (
        <ChatConversationHomeQuickStartCard
          key={item.key}
          pressable={item.pressable}
          sourcePill={item.sourcePill}
          addIcon={item.addIcon}
          title={item.title}
          description={item.description}
          actions={item.actions}
        />
      ))}
    </View>
  );
}

export function ChatConversationHomeQuickStartCard({
  pressable,
  sourcePill,
  addIcon,
  title,
  description,
  actions,
}: ChatConversationHomeQuickStartCardProps) {
  return (
    <Pressable {...pressable.props}>
      <ChatConversationHomeQuickStartLeadingAccessory
        sourcePill={sourcePill}
        addIcon={addIcon}
      />
      <ChatConversationHomeQuickStartTextContent
        title={title}
        description={description}
      />
      <ChatConversationHomeQuickStartActions
        actions={actions}
      />
    </Pressable>
  );
}

export function ChatConversationHomeQuickStartsEmptyState({
  emptyState,
}: ChatConversationHomeQuickStartsEmptyStateProps) {
  if (!emptyState.shouldRender) return null;

  return (
    <Text {...emptyState.props}>
      {emptyState.text}
    </Text>
  );
}

export function ChatConversationHomeQuickStartActions({
  actions,
}: ChatConversationHomeQuickStartActionsProps) {
  if (!actions.shouldRender) return null;

  return (
    <View {...actions.props}>
      <ChatConversationHomeQuickStartActionButton
        pressable={actions.edit.pressable}
        icon={actions.edit.icon}
        label={actions.edit.label}
      />
      <ChatConversationHomeQuickStartActionButton
        pressable={actions.delete.pressable}
        icon={actions.delete.icon}
        label={actions.delete.label}
      />
    </View>
  );
}

export function ChatConversationHomeQuickStartLeadingAccessory({
  sourcePill,
  addIcon,
}: ChatConversationHomeQuickStartLeadingAccessoryProps) {
  if (sourcePill.shouldRender) {
    return (
      <View {...sourcePill.props}>
        <Ionicons {...sourcePill.icon.props} />
        <Text {...sourcePill.label.props}>
          {sourcePill.label.text}
        </Text>
      </View>
    );
  }

  if (addIcon.shouldRender) {
    return (
      <Ionicons {...addIcon.props} />
    );
  }

  return null;
}

export function ChatConversationHomeQuickStartTextContent({
  title,
  description,
}: ChatConversationHomeQuickStartTextContentProps) {
  return (
    <>
      <Text {...title.props}>
        {title.text}
      </Text>
      {description.shouldRender ? (
        <Text {...description.props}>
          {description.text}
        </Text>
      ) : null}
    </>
  );
}

export function ChatConversationHomeQuickStartActionButton({
  pressable,
  icon,
  label,
}: ChatConversationHomeQuickStartActionButtonProps) {
  return (
    <Pressable {...pressable.props}>
      <Ionicons {...icon.props} />
      <Text {...label.props}>{label.text}</Text>
    </Pressable>
  );
}

export function ChatConversationHomePromptEditorModal({
  visible,
  isEditing,
  nameValue,
  onNameChange,
  contentValue,
  onContentChange,
  isSaving,
  onClose,
  onSave,
  renderState,
  styles,
}: ChatConversationHomePromptEditorModalProps) {
  const modalParts: ChatConversationHomePromptEditorModalParts =
    createChatConversationHomePromptEditorModalMobilePropsParts({
      visible,
      isEditing,
      nameValue,
      onNameChange,
      contentValue,
      onContentChange,
      isSaving,
      onClose,
      onSave,
      renderState,
      styles,
    });

  return (
    <ChatConversationHomePromptEditorModalFrame
      modal={modalParts.modal}
      keyboardAvoidingView={modalParts.keyboardAvoidingView}
      overlay={modalParts.overlay}
      content={modalParts.content}
    >
      <ChatConversationHomePromptEditorModalBody
        header={modalParts.header}
        title={modalParts.title}
        closeButton={modalParts.closeButton}
        closeIcon={modalParts.closeIcon}
        nameLabel={modalParts.nameLabel}
        nameInput={modalParts.nameInput}
        contentLabel={modalParts.contentLabel}
        contentInput={modalParts.contentInput}
        actions={modalParts.actions}
        cancelButton={modalParts.cancelButton}
        cancelLabel={modalParts.cancelLabel}
        saveButton={modalParts.saveButton}
        saveLabel={modalParts.saveLabel}
      />
    </ChatConversationHomePromptEditorModalFrame>
  );
}

export function ChatConversationHomePromptEditorModalBody({
  header,
  title,
  closeButton,
  closeIcon,
  nameLabel,
  nameInput,
  contentLabel,
  contentInput,
  actions,
  cancelButton,
  cancelLabel,
  saveButton,
  saveLabel,
}: ChatConversationHomePromptEditorModalBodyProps) {
  return (
    <>
      <ChatConversationHomePromptEditorModalHeader
        header={header}
        title={title}
        closeButton={closeButton}
        closeIcon={closeIcon}
      />

      <ChatConversationHomePromptEditorModalField
        label={nameLabel}
        input={nameInput}
      />

      <ChatConversationHomePromptEditorModalField
        label={contentLabel}
        input={contentInput}
      />

      <ChatConversationHomePromptEditorModalActions
        actions={actions}
        cancelButton={cancelButton}
        cancelLabel={cancelLabel}
        saveButton={saveButton}
        saveLabel={saveLabel}
      />
    </>
  );
}

export function ChatConversationHomePromptEditorModalFrame({
  modal,
  keyboardAvoidingView,
  overlay,
  content,
  children,
}: ChatConversationHomePromptEditorModalFrameProps) {
  return (
    <Modal {...modal.props}>
      <KeyboardAvoidingView {...keyboardAvoidingView.props}>
        <View {...overlay.props}>
          <View {...content.props}>
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ChatConversationHomePromptEditorModalActions({
  actions,
  cancelButton,
  cancelLabel,
  saveButton,
  saveLabel,
}: ChatConversationHomePromptEditorModalActionsProps) {
  return (
    <View {...actions.props}>
      <ChatConversationHomePromptEditorModalActionButton
        button={cancelButton}
        label={cancelLabel}
      />
      <ChatConversationHomePromptEditorModalActionButton
        button={saveButton}
        label={saveLabel}
      />
    </View>
  );
}

export function ChatConversationHomePromptEditorModalHeader({
  header,
  title,
  closeButton,
  closeIcon,
}: ChatConversationHomePromptEditorModalHeaderProps) {
  return (
    <View {...header.props}>
      <Text {...title.props}>{title.text}</Text>
      <ChatConversationHomePromptEditorModalIconButton
        button={closeButton}
        icon={closeIcon}
      />
    </View>
  );
}

export function ChatConversationHomePromptEditorModalIconButton({
  button,
  icon,
}: ChatConversationHomePromptEditorModalIconButtonProps) {
  return (
    <TouchableOpacity {...button.props}>
      <Ionicons {...icon.props} />
    </TouchableOpacity>
  );
}

export function ChatConversationHomePromptEditorModalField({
  label,
  input,
}: ChatConversationHomePromptEditorModalFieldProps) {
  return (
    <>
      <Text {...label.props}>{label.text}</Text>
      <TextInput {...input.props} />
    </>
  );
}

export function ChatConversationHomePromptEditorModalActionButton({
  button,
  label,
}: ChatConversationHomePromptEditorModalActionButtonProps) {
  return (
    <TouchableOpacity {...button.props}>
      <Text {...label.props}>{label.text}</Text>
    </TouchableOpacity>
  );
}

export function ChatMessageSurface({
  children,
  style,
  toneStyle,
}: ChatMessageSurfaceProps) {
  const surfaceParts: ChatMessageSurfaceParts =
    createChatRuntimeMessageSurfaceMobilePropsParts({
      style,
      toneStyle,
    });

  return (
    <ChatMessageSurfaceContainer
      {...surfaceParts.container.props}
    >
      {children}
    </ChatMessageSurfaceContainer>
  );
}

export function ChatMessageSurfaceContainer({
  children,
  ...props
}: ChatMessageSurfaceContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageThreadItem({
  children,
  leadingActivity,
  trailingActivity,
}: ChatMessageThreadItemProps) {
  const threadItemParts: ChatMessageThreadItemParts =
    createChatRuntimeMessageThreadItemMobilePropsParts({
      leadingActivity,
      trailingActivity,
    });

  return (
    <View>
      {threadItemParts.props.leadingActivity}
      {children}
      {threadItemParts.props.trailingActivity}
    </View>
  );
}

export function ChatMessageThreadSurface({
  children,
  leadingActivity,
  trailingActivity,
  surfaceStyle,
  surfaceToneStyle,
}: ChatMessageThreadSurfaceProps) {
  const threadSurfaceParts: ChatMessageThreadSurfaceParts =
    createChatRuntimeMessageThreadSurfaceMobilePropsParts({
      leadingActivity,
      trailingActivity,
      surfaceStyle,
      surfaceToneStyle,
    });

  return (
    <ChatMessageThreadItem
      {...threadSurfaceParts.item.props}
    >
      <ChatMessageSurface
        {...threadSurfaceParts.surface.props}
      >
        {children}
      </ChatMessageSurface>
    </ChatMessageThreadItem>
  );
}

export function ChatMessageToolActivityGroupThreadSurface({
  children,
  groupRenderState,
  onToggleGroup,
  styles,
  surfaceToneStyle,
}: ChatMessageToolActivityGroupThreadSurfaceProps) {
  const surfaceParts: ChatMessageToolActivityGroupThreadSurfaceParts =
    createChatRuntimeToolActivityGroupThreadSurfaceMobilePropsParts({
      groupRenderState,
      onToggleGroup,
      surfaceToneStyle,
      styles,
    });

  return (
    <ChatMessageThreadSurface
      {...surfaceParts.surface.props}
      leadingActivity={surfaceParts.leadingBoundary.shouldRender ? (
        <ChatMessageToolActivityGroupBoundary
          {...surfaceParts.leadingBoundary.props}
        />
      ) : null}
      trailingActivity={surfaceParts.trailingBoundary.shouldRender ? (
        <ChatMessageToolActivityGroupBoundary
          {...surfaceParts.trailingBoundary.props}
        />
      ) : null}
    >
      {children}
    </ChatMessageThreadSurface>
  );
}

export function ChatMessageRuntimeThread({
  groupRenderState,
  onToggleGroup,
  body,
  styles,
}: ChatMessageRuntimeThreadProps) {
  const runtimeThreadParts: ChatMessageRuntimeThreadParts =
    createChatRuntimeConversationRuntimeThreadMobilePropsParts({
      groupRenderState,
      onToggleGroup,
      body,
      styles,
    });

  if (runtimeThreadParts.shouldSkipThread) return null;

  if (runtimeThreadParts.collapsedBoundary.shouldRender) {
    return (
      <ChatMessageToolActivityGroupBoundary
        {...runtimeThreadParts.collapsedBoundary.props}
      />
    );
  }

  if (!runtimeThreadParts.bodySurface.shouldRender) return null;

  const resolvedBody = createChatRuntimeConversationThreadBodyMobilePropsFromActionInput({
    ...runtimeThreadParts.bodySurface.body.props,
    createActionSet: createChatMessageActionSet,
  });

  return (
    <ChatMessageToolActivityGroupThreadSurface
      {...runtimeThreadParts.bodySurface.surface.props}
    >
      <ChatMessageThreadBody
        {...resolvedBody}
        {...runtimeThreadParts.bodySurface.bodyPanel.props}
      />
    </ChatMessageToolActivityGroupThreadSurface>
  );
}

export function ChatMessageConversationRuntimeThreadList({
  threadStates,
  styles,
}: ChatMessageConversationRuntimeThreadListProps) {
  const threadListParts: ChatMessageConversationRuntimeThreadListParts =
    createChatRuntimeConversationRuntimeThreadListMobilePropsParts({
      threadStates,
      styles,
    });

  return (
    <ChatMessageConversationRuntimeThreadListContent
      {...threadListParts.content}
    />
  );
}

export function ChatMessageConversationRuntimeThreadListContent({
  threads,
}: ChatMessageConversationRuntimeThreadListContentProps) {
  return (
    <>
      {threads.map((thread) => (
        <ChatMessageRuntimeThread
          key={thread.key}
          {...thread.props}
        />
      ))}
    </>
  );
}

export function ChatMessageThreadBody({
  bodyDisplayMode,
  styles,
  retryStatus,
  delegationCard,
  toolApproval,
  inlineActivity,
  conversation,
}: ChatMessageThreadBodyProps) {
  const threadBodyParts: ChatMessageThreadBodyParts =
    createChatRuntimeConversationThreadBodyMobilePropsParts({
      bodyDisplayMode,
      retryStatus,
      delegationCard,
      toolApproval,
      inlineActivity,
      conversation,
      styles,
    });

  if (threadBodyParts.retryStatus.shouldRender) {
    return (
      <ChatMessageRetryStatus
        {...threadBodyParts.retryStatus.props}
      />
    );
  }

  if (threadBodyParts.delegationCard.shouldRender) {
    return (
      <ChatMessageDelegationCard
        {...threadBodyParts.delegationCard.props}
      />
    );
  }

  if (threadBodyParts.toolApproval.shouldRender) {
    return (
      <ChatMessageToolApproval
        {...threadBodyParts.toolApproval.props}
      />
    );
  }

  if (threadBodyParts.inlineActivity.shouldRender) {
    return (
      <ChatMessageInlineActivity
        {...threadBodyParts.inlineActivity.props}
      />
    );
  }

  if (
    !threadBodyParts.conversation.shouldRender
    || !threadBodyParts.toolExecutionStack.shouldRender
    || !threadBodyParts.standaloneActions.shouldRender
  ) return null;

  return (
    <>
      <ChatMessageConversationContent
        {...threadBodyParts.conversation.props}
      />
      <ChatMessageToolExecutionStack
        {...threadBodyParts.toolExecutionStack.props}
      />
      <ChatMessageStandaloneActions
        {...threadBodyParts.standaloneActions.props}
      />
    </>
  );
}

export function ChatMessageRetryStatus({
  renderState,
  styles,
}: ChatMessageRetryStatusProps) {
  const retryStatusParts: ChatMessageRetryStatusParts =
    createChatRuntimeRetryStatusMobilePropsParts({
      renderState,
      styles,
    });
  const retryStatusCard = retryStatusParts.card;

  if (!retryStatusCard.shouldRender) return null;

  return (
    <ChatMessageRetryStatusCard
      {...retryStatusCard.props}
    >
      <ChatMessageRetryStatusCardContent
        {...retryStatusCard.content}
      />
    </ChatMessageRetryStatusCard>
  );
}

export function ChatMessageRetryStatusCardContent({
  header,
  meta,
  description,
}: ChatMessageRetryStatusCardContentProps) {
  return (
    <>
      <ChatMessageRetryStatusHeader header={header} />
      <ChatMessageRetryStatusMeta meta={meta} />
      <ChatMessageRetryStatusText
        {...description.props}
      />
    </>
  );
}

export function ChatMessageRetryStatusHeader({
  header,
}: ChatMessageRetryStatusHeaderProps) {
  return (
    <ChatMessageRetryStatusView
      {...header.props}
    >
      <ChatMessageRetryStatusHeaderContent
        {...header.content}
      />
    </ChatMessageRetryStatusView>
  );
}

export function ChatMessageRetryStatusHeaderContent({
  icon,
  title,
  spinner,
}: ChatMessageRetryStatusHeaderContentProps) {
  return (
    <>
      <ChatMessageRetryStatusIcon
        {...icon.props}
      />
      <ChatMessageRetryStatusTitle
        {...title.props}
      />
      <ChatMessageRetryStatusSpinner
        {...spinner.props}
      />
    </>
  );
}

export function ChatMessageRetryStatusMeta({
  meta,
}: ChatMessageRetryStatusMetaProps) {
  return (
    <ChatMessageRetryStatusView
      {...meta.props}
    >
      <ChatMessageRetryStatusMetaContent
        {...meta.content}
      />
    </ChatMessageRetryStatusView>
  );
}

export function ChatMessageRetryStatusMetaContent({
  attempt,
  countdown,
}: ChatMessageRetryStatusMetaContentProps) {
  return (
    <>
      <ChatMessageRetryStatusText
        {...attempt.props}
      />
      <ChatMessageRetryStatusText
        {...countdown.props}
      />
    </>
  );
}

export function ChatMessageRetryStatusCard({
  children,
  ...props
}: ChatMessageRetryStatusCardProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageRetryStatusView({
  children,
  ...props
}: ChatMessageRetryStatusViewProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageRetryStatusIcon(
  props: ChatMessageRetryStatusIconProps
) {
  return <Ionicons {...props} />;
}

export function ChatMessageRetryStatusSpinner(
  props: ChatMessageRetryStatusSpinnerProps
) {
  return <ActivityIndicator {...props} />;
}

export function ChatMessageRetryStatusTitle({
  text,
  ...props
}: ChatMessageRetryStatusTitleProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageRetryStatusText({
  text,
  ...props
}: ChatMessageRetryStatusTextProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApproval({
  renderState,
  toolName,
  argumentsPreview,
  argumentsContent,
  onToggleArguments,
  onDeny,
  onApprove,
  styles,
}: ChatMessageToolApprovalProps) {
  const toolApprovalParts: ChatMessageToolApprovalParts =
    createChatRuntimeToolApprovalMobilePropsParts({
      renderState,
      toolName,
      argumentsPreview,
      argumentsContent,
      onToggleArguments,
      onDeny,
      onApprove,
      styles,
    });

  return (
    <ChatMessageToolApprovalView
      {...toolApprovalParts.card.props}
    >
      <ChatMessageToolApprovalHeader
        header={toolApprovalParts.header}
        icon={toolApprovalParts.headerIcon}
        title={toolApprovalParts.title}
        spinner={toolApprovalParts.headerSpinner}
      />
      <ChatMessageToolApprovalContent
        content={toolApprovalParts.content}
        toolRow={toolApprovalParts.toolRow}
        toolLabel={toolApprovalParts.toolLabel}
        toolName={toolApprovalParts.toolName}
        argumentsPreview={toolApprovalParts.argumentsPreview}
        argumentsToggle={toolApprovalParts.argumentsToggle}
        fullArguments={toolApprovalParts.fullArguments}
        actions={toolApprovalParts.actions}
        denyButton={toolApprovalParts.denyButton}
        approveButton={toolApprovalParts.approveButton}
      />
    </ChatMessageToolApprovalView>
  );
}

export function ChatMessageToolApprovalContent({
  content,
  toolRow,
  toolLabel,
  toolName,
  argumentsPreview,
  argumentsToggle,
  fullArguments,
  actions,
  denyButton,
  approveButton,
}: ChatMessageToolApprovalContentProps) {
  return (
    <ChatMessageToolApprovalView
      {...content.props}
    >
      <ChatMessageToolApprovalToolRow
        row={toolRow}
        label={toolLabel}
        name={toolName}
      />
      <ChatMessageToolApprovalArgumentsPreviewBlock
        preview={argumentsPreview}
      />
      <ChatMessageToolApprovalArgumentsToggleBlock
        argumentsToggle={argumentsToggle}
      />
      <ChatMessageToolApprovalFullArgumentsBlock
        fullArguments={fullArguments}
      />
      <ChatMessageToolApprovalActionBar
        actions={actions}
        denyButton={denyButton}
        approveButton={approveButton}
      />
    </ChatMessageToolApprovalView>
  );
}

export function ChatMessageToolApprovalToolRow({
  row,
  label,
  name,
}: ChatMessageToolApprovalToolRowProps) {
  return (
    <ChatMessageToolApprovalView
      {...row.props}
    >
      <ChatMessageToolApprovalToolLabel
        {...label.props}
      />
      <ChatMessageToolApprovalToolName
        {...name.props}
      />
    </ChatMessageToolApprovalView>
  );
}

export function ChatMessageToolApprovalArgumentsToggleBlock({
  argumentsToggle,
}: ChatMessageToolApprovalArgumentsToggleBlockProps) {
  return (
    <ChatMessageToolApprovalArgumentsToggle
      {...argumentsToggle.props}
    >
      <ChatMessageToolApprovalArgumentsToggleContent
        content={argumentsToggle.content}
      />
    </ChatMessageToolApprovalArgumentsToggle>
  );
}

export function ChatMessageToolApprovalArgumentsToggleContent({
  content,
}: ChatMessageToolApprovalArgumentsToggleContentProps) {
  return (
    <>
      <ChatMessageToolApprovalIcon
        {...content.icon.props}
      />
      <ChatMessageToolApprovalArgumentsToggleLabel
        {...content.label.props}
      />
    </>
  );
}

export function ChatMessageToolApprovalHeader({
  header,
  icon,
  title,
  spinner,
}: ChatMessageToolApprovalHeaderProps) {
  return (
    <ChatMessageToolApprovalView
      {...header.props}
    >
      <ChatMessageToolApprovalIcon
        {...icon.props}
      />
      <ChatMessageToolApprovalTitle
        {...title.props}
      />
      {spinner.shouldRender ? (
        <ChatMessageToolApprovalSpinner
          {...spinner.props}
        />
      ) : null}
    </ChatMessageToolApprovalView>
  );
}

export function ChatMessageToolApprovalDenyActionContent({
  content,
}: ChatMessageToolApprovalDenyActionContentProps) {
  return (
    <>
      <ChatMessageToolApprovalIcon
        {...content.icon.props}
      />
      <ChatMessageToolApprovalActionLabel
        {...content.label.props}
      />
    </>
  );
}

export function ChatMessageToolApprovalApproveActionContent({
  content,
}: ChatMessageToolApprovalApproveActionContentProps) {
  return (
    <>
      {content.spinner.shouldRender ? (
        <ChatMessageToolApprovalSpinner
          {...content.spinner.props}
        />
      ) : content.icon.shouldRender ? (
        <ChatMessageToolApprovalIcon
          {...content.icon.props}
        />
      ) : null}
      <ChatMessageToolApprovalActionLabel
        {...content.label.props}
      />
    </>
  );
}

export function ChatMessageToolApprovalView({
  children,
  ...props
}: ChatMessageToolApprovalViewProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolApprovalIcon(props: ChatMessageToolApprovalIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolApprovalSpinner(props: ChatMessageToolApprovalSpinnerProps) {
  return (
    <ActivityIndicator {...props} />
  );
}

export function ChatMessageToolApprovalTitle({
  props,
  text,
}: ChatMessageToolApprovalTitleProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalToolLabel({
  props,
  text,
}: ChatMessageToolApprovalToolLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalToolName({
  props,
  text,
}: ChatMessageToolApprovalToolNameProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalArgumentsPreview({
  props,
  text,
}: ChatMessageToolApprovalArgumentsPreviewProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalArgumentsPreviewBlock({
  preview,
}: ChatMessageToolApprovalArgumentsPreviewBlockProps) {
  if (!preview.shouldRender) {
    return null;
  }

  return (
    <ChatMessageToolApprovalArgumentsPreview
      {...preview.props}
    />
  );
}

export function ChatMessageToolApprovalFullArgumentsBlock({
  fullArguments,
}: ChatMessageToolApprovalFullArgumentsBlockProps) {
  if (!fullArguments.shouldRender) {
    return null;
  }

  return (
    <ChatMessageToolApprovalFullArgumentsScroll
      {...fullArguments.scroll.props}
    >
      <ChatMessageToolApprovalFullArguments
        {...fullArguments.text.props}
      />
    </ChatMessageToolApprovalFullArgumentsScroll>
  );
}

export function ChatMessageToolApprovalFullArguments({
  props,
  text,
}: ChatMessageToolApprovalFullArgumentsProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalFullArgumentsScroll({
  children,
  ...props
}: ChatMessageToolApprovalFullArgumentsScrollProps) {
  return (
    <ScrollView {...props}>
      {children}
    </ScrollView>
  );
}

export function ChatMessageToolApprovalActions({
  children,
  ...props
}: ChatMessageToolApprovalActionsProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolApprovalActionButton({
  children,
  ...props
}: ChatMessageToolApprovalActionButtonProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatMessageToolApprovalActionBar({
  actions,
  denyButton,
  approveButton,
}: ChatMessageToolApprovalActionBarProps) {
  return (
    <ChatMessageToolApprovalActions
      {...actions.props}
    >
      <ChatMessageToolApprovalActionButton
        {...denyButton.props}
      >
        <ChatMessageToolApprovalDenyActionContent
          content={denyButton.content}
        />
      </ChatMessageToolApprovalActionButton>
      <ChatMessageToolApprovalActionButton
        {...approveButton.props}
      >
        <ChatMessageToolApprovalApproveActionContent
          content={approveButton.content}
        />
      </ChatMessageToolApprovalActionButton>
    </ChatMessageToolApprovalActions>
  );
}

export function ChatMessageToolApprovalArgumentsToggle({
  children,
  ...props
}: ChatMessageToolApprovalArgumentsToggleProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatMessageToolApprovalArgumentsToggleLabel({
  props,
  text,
}: ChatMessageToolApprovalArgumentsToggleLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolApprovalActionLabel({
  props,
  text,
}: ChatMessageToolApprovalActionLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageDelegationConversationPreviewRow({
  line,
  role,
  content,
  timestamp,
}: ChatMessageDelegationConversationPreviewRowProps) {
  return (
    <View {...line.props}>
      <ChatMessageDelegationConversationPreviewRole
        {...role}
      />
      <ChatMessageDelegationConversationPreviewContent
        {...content}
      />
      <ChatMessageDelegationConversationPreviewTimestamp
        timestamp={timestamp}
      />
    </View>
  );
}

export function ChatMessageDelegationConversationPreviewRole({
  props,
  text,
}: ChatMessageDelegationConversationPreviewRoleProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationConversationPreviewContent({
  props,
  text,
}: ChatMessageDelegationConversationPreviewContentProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationConversationPreviewTimestamp({
  timestamp,
}: ChatMessageDelegationConversationPreviewTimestampProps) {
  if (!timestamp.shouldRender) return null;

  return (
    <Text
      {...timestamp.props}
    >
      {timestamp.text}
    </Text>
  );
}

export function ChatMessageDelegationConversationPreviewBlock({
  conversationPreview,
}: ChatMessageDelegationConversationPreviewBlockProps) {
  if (!conversationPreview.shouldRender) {
    return null;
  }

  return (
    <ChatMessageDelegationConversationPreview
      {...conversationPreview.props}
    />
  );
}

export function ChatMessageDelegationConversationPreview({
  container,
}: ChatMessageDelegationConversationPreviewProps) {
  return (
    <View {...container.props}>
      <ChatMessageDelegationConversationPreviewBody
        {...container.content}
      />
    </View>
  );
}

export function ChatMessageDelegationConversationPreviewBody({
  rows,
  moreAction,
}: ChatMessageDelegationConversationPreviewBodyProps) {
  return (
    <>
      {rows.map((row) => (
        <ChatMessageDelegationConversationPreviewRow
          key={row.key}
          {...row.props}
        />
      ))}
      <ChatMessageDelegationMorePreviewActionBlock
        moreAction={moreAction}
      />
    </>
  );
}

export function ChatMessageDelegationToolPreviewRow({
  line,
  statusIcon,
  name,
}: ChatMessageDelegationToolPreviewRowProps) {
  return (
    <View
      {...line.props}
    >
      <ChatMessageDelegationToolPreviewStatusIcon
        statusIcon={statusIcon}
      />
      <ChatMessageDelegationToolPreviewName
        {...name}
      />
    </View>
  );
}

export function ChatMessageDelegationToolPreviewName({
  props,
  text,
}: ChatMessageDelegationToolPreviewNameProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationToolPreviewStatusIcon({
  statusIcon,
}: ChatMessageDelegationToolPreviewStatusIconProps) {
  return (
    <View
      {...statusIcon.props}
    >
      {statusIcon.spinner.shouldRender ? (
        <ActivityIndicator
          {...statusIcon.spinner.props}
        />
      ) : statusIcon.icon.shouldRender ? (
        <Ionicons
          {...statusIcon.icon.props}
        />
      ) : null}
    </View>
  );
}

export function ChatMessageDelegationMorePreviewActionBlock({
  moreAction,
}: ChatMessageDelegationMorePreviewActionBlockProps) {
  if (!moreAction.shouldRender) {
    return null;
  }

  return (
    <ChatMessageDelegationMorePreviewAction
      {...moreAction.props}
    />
  );
}

export function ChatMessageDelegationMorePreviewAction({
  button,
  label,
}: ChatMessageDelegationMorePreviewActionProps) {
  return (
    <Pressable
      {...button.props}
    >
      <ChatMessageDelegationMorePreviewActionLabel
        {...label}
      />
    </Pressable>
  );
}

export function ChatMessageDelegationMorePreviewActionLabel({
  props,
  text,
}: ChatMessageDelegationMorePreviewActionLabelProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationHeader({
  container,
  title,
  statusBadge,
  statusText,
  liveText,
}: ChatMessageDelegationHeaderProps) {
  return (
    <View {...container.props}>
      <ChatMessageDelegationTitle
        title={title}
      />
      <ChatMessageDelegationStatusBadge
        badge={statusBadge}
        text={statusText}
      />
      <ChatMessageDelegationLiveText
        liveText={liveText}
      />
    </View>
  );
}

export function ChatMessageDelegationTitle({
  title,
}: ChatMessageDelegationTitleProps) {
  return (
    <Text
      {...title.props}
    >
      {title.text}
    </Text>
  );
}

export function ChatMessageDelegationStatusBadge({
  badge,
  text,
}: ChatMessageDelegationStatusBadgeProps) {
  return (
    <View {...badge.props}>
      <Text
        {...text.props}
      >
        {text.text}
      </Text>
    </View>
  );
}

export function ChatMessageDelegationLiveText({
  liveText,
}: ChatMessageDelegationLiveTextProps) {
  if (!liveText.shouldRender) {
    return null;
  }

  return (
    <Text {...liveText.props}>
      {liveText.text}
    </Text>
  );
}

export function ChatMessageDelegationMetaItem({
  props,
  text,
}: ChatMessageDelegationMetaItemProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationMetaRow({
  container,
  items,
}: ChatMessageDelegationMetaRowProps) {
  return (
    <View {...container.props}>
      {items.map((metaItem) => (
        <ChatMessageDelegationMetaItem
          key={metaItem.key}
          {...metaItem.props}
        />
      ))}
    </View>
  );
}

export function ChatMessageDelegationSubtitleBlock({
  subtitle,
}: ChatMessageDelegationSubtitleBlockProps) {
  if (!subtitle.shouldRender) {
    return null;
  }

  return (
    <ChatMessageDelegationSubtitle
      {...subtitle.props}
    />
  );
}

export function ChatMessageDelegationSubtitle({
  props,
  text,
}: ChatMessageDelegationSubtitleProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationToolPreviewLabel({
  props,
  text,
}: ChatMessageDelegationToolPreviewLabelProps) {
  return (
    <Text
      {...props}
    >
      {text}
    </Text>
  );
}

export function ChatMessageDelegationToolPreviewBlock({
  toolPreview,
}: ChatMessageDelegationToolPreviewBlockProps) {
  if (!toolPreview.shouldRender) {
    return null;
  }

  return (
    <ChatMessageDelegationToolPreview
      {...toolPreview.props}
    />
  );
}

export function ChatMessageDelegationToolPreview({
  container,
}: ChatMessageDelegationToolPreviewProps) {
  return (
    <View {...container.props}>
      <ChatMessageDelegationToolPreviewBody
        {...container.content}
      />
    </View>
  );
}

export function ChatMessageDelegationToolPreviewBody({
  label,
  rows,
  moreAction,
}: ChatMessageDelegationToolPreviewBodyProps) {
  return (
    <>
      <ChatMessageDelegationToolPreviewLabel
        {...label.props}
      />
      {rows.map((row) => (
        <ChatMessageDelegationToolPreviewRow
          key={row.key}
          {...row.props}
        />
      ))}
      <ChatMessageDelegationMorePreviewActionBlock
        moreAction={moreAction}
      />
    </>
  );
}

export function ChatMessageDelegationContent({
  header,
  subtitle,
  meta,
  conversationPreview,
  toolPreview,
}: ChatMessageDelegationContentProps) {
  return (
    <>
      <ChatMessageDelegationHeader
        {...header.props}
      />
      <ChatMessageDelegationSubtitleBlock
        subtitle={subtitle}
      />
      <ChatMessageDelegationMetaRow
        {...meta.props}
      />
      <ChatMessageDelegationConversationPreviewBlock
        conversationPreview={conversationPreview}
      />
      <ChatMessageDelegationToolPreviewBlock
        toolPreview={toolPreview}
      />
    </>
  );
}

export function ChatMessageDelegationCard({
  surface,
  agentName,
  presentation,
  accessibilityLabel,
  messageCountLabel,
  statusStyles,
  conversationPreview,
  toolPreview,
  styles,
}: ChatMessageDelegationCardProps) {
  const delegationCardParts: ChatMessageDelegationCardParts =
    createChatRuntimeDelegationCardMobilePropsParts({
      surface,
      agentName,
      presentation,
      accessibilityLabel,
      messageCountLabel,
      statusStyles,
      conversationPreview,
      toolPreview,
      styles,
    });

  return (
    <View
      {...delegationCardParts.card.props}
    >
      <ChatMessageDelegationContent
        {...delegationCardParts.card.content}
      />
    </View>
  );
}

export function ChatMessageToolActivityGroupToggle({
  renderState,
  headerKind,
  onPress,
  styles,
}: ChatMessageToolActivityGroupToggleProps) {
  const toggleParts: ChatMessageToolActivityGroupToggleParts =
    createChatRuntimeToolActivityGroupToggleMobilePropsParts({
      renderState,
      headerKind,
      onPress,
      styles,
    });

  return (
    <Pressable
      {...toggleParts.pressable.props}
    >
      <ChatMessageToolActivityGroupToggleHeaderRow
        {...toggleParts.headerRow}
      />
    </Pressable>
  );
}

export function ChatMessageToolActivityGroupToggleHeaderRow({
  props,
  content,
}: ChatMessageToolActivityGroupToggleHeaderRowProps) {
  return (
    <View {...props}>
      <ChatMessageToolActivityGroupToggleHeaderContent
        {...content}
      />
    </View>
  );
}

export function ChatMessageToolActivityGroupToggleHeaderContent({
  leadingIcon,
  countBadge,
  preview,
  toggleIcon,
}: ChatMessageToolActivityGroupToggleHeaderContentProps) {
  return (
    <>
      <ChatMessageToolActivityGroupIcon
        {...leadingIcon.props}
      />
      <ChatMessageToolActivityGroupOptionalCountBadge
        countBadge={countBadge}
      />
      <ChatMessageToolActivityGroupPreviewLine
        {...preview.props}
      />
      <ChatMessageToolActivityGroupIcon
        {...toggleIcon.props}
      />
    </>
  );
}

export function ChatMessageToolActivityGroupOptionalCountBadge({
  countBadge,
}: ChatMessageToolActivityGroupOptionalCountBadgeProps) {
  if (!countBadge.shouldRender) {
    return null;
  }

  return (
    <ChatMessageToolActivityGroupCountBadge
      {...countBadge.props}
    />
  );
}

export function ChatMessageToolActivityGroupIcon(props: ChatMessageToolActivityGroupIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolActivityGroupCountBadge({
  container,
  label,
}: ChatMessageToolActivityGroupCountBadgeProps) {
  return (
    <View {...container.props}>
      <Text {...label.props}>
        {label.text}
      </Text>
    </View>
  );
}

export function ChatMessageToolActivityGroupPreviewLine({
  props,
  text,
}: ChatMessageToolActivityGroupPreviewLineProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolActivityGroupFooter({
  renderState,
  onPress,
  styles,
}: ChatMessageToolActivityGroupFooterProps) {
  const footerParts: ChatMessageToolActivityGroupFooterParts =
    createChatRuntimeToolActivityGroupFooterMobilePropsParts({
      renderState,
      onPress,
      styles,
    });

  return (
    <Pressable
      {...footerParts.button.props}
    >
      <ChatMessageToolActivityGroupFooterContent
        {...footerParts.button.content}
      />
    </Pressable>
  );
}

export function ChatMessageToolActivityGroupFooterContent({
  icon,
  label,
}: ChatMessageToolActivityGroupFooterContentProps) {
  return (
    <>
      <ChatMessageToolActivityGroupIcon
        {...icon.props}
      />
      <ChatMessageToolActivityGroupFooterLabel
        {...label.props}
      />
    </>
  );
}

export function ChatMessageToolActivityGroupFooterLabel({
  props,
  text,
}: ChatMessageToolActivityGroupFooterLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolActivityGroupBoundary({
  renderState,
  kind,
  onPress,
  styles,
}: ChatMessageToolActivityGroupBoundaryProps) {
  const boundaryParts: ChatMessageToolActivityGroupBoundaryParts =
    createChatRuntimeToolActivityGroupBoundaryMobilePropsParts({
      renderState,
      kind,
      onPress,
      styles,
    });

  if (boundaryParts.footer.shouldRender) {
    return (
      <ChatMessageToolActivityGroupFooter
        {...boundaryParts.footer.props}
      />
    );
  }

  if (!boundaryParts.toggle.shouldRender) return null;

  return (
    <ChatMessageToolActivityGroupToggle
      {...boundaryParts.toggle.props}
    />
  );
}

export function ChatMessageToolExecutionCompactGroup({
  renderState,
  onPress,
  styles,
  children,
}: ChatMessageToolExecutionCompactGroupProps) {
  const compactGroupParts: ChatMessageToolExecutionCompactGroupParts =
    createChatRuntimeToolExecutionCompactGroupMobilePropsParts({
      renderState,
      onPress,
      styles,
    });

  return (
    <ChatMessageToolExecutionCompactGroupPressable
      {...compactGroupParts.container.props}
    >
      {children}
    </ChatMessageToolExecutionCompactGroupPressable>
  );
}

export function ChatMessageToolExecutionCompactGroupPressable({
  children,
  ...props
}: ChatMessageToolExecutionCompactGroupPressableProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatMessageToolExecutionCompactRow({
  renderState,
  styles,
}: ChatMessageToolExecutionCompactRowProps) {
  const compactRowParts: ChatMessageToolExecutionCompactRowParts =
    createChatRuntimeToolExecutionCompactRowMobilePropsParts({
      renderState,
      styles,
    });

  return (
    <ChatMessageToolExecutionCompactRowContainer
      {...compactRowParts.container.props}
    >
      <ChatMessageToolExecutionCompactRowContent
        {...compactRowParts.container.content}
      />
    </ChatMessageToolExecutionCompactRowContainer>
  );
}

export function ChatMessageToolExecutionCompactRowContent({
  leadingIcon,
  name,
  statusIndicator,
  toggleIcon,
}: ChatMessageToolExecutionCompactRowContentProps) {
  return (
    <>
      <ChatMessageToolExecutionCompactRowIconSlot
        slot={leadingIcon}
      />
      <ChatMessageToolExecutionCompactRowName
        {...name.props}
      />
      <ChatMessageToolExecutionCompactRowStatusIndicatorBlock
        statusIndicator={statusIndicator}
      />
      <ChatMessageToolExecutionCompactRowIconSlot
        slot={toggleIcon}
      />
    </>
  );
}

export function ChatMessageToolExecutionCompactRowIconSlot({
  slot,
}: ChatMessageToolExecutionCompactRowIconSlotProps) {
  return (
    <ChatMessageToolExecutionCompactRowIconCell
      {...slot.container.props}
    >
      <ChatMessageToolExecutionCompactRowIcon
        {...slot.icon.props}
      />
    </ChatMessageToolExecutionCompactRowIconCell>
  );
}

export function ChatMessageToolExecutionCompactRowStatusIndicatorBlock({
  statusIndicator,
}: ChatMessageToolExecutionCompactRowStatusIndicatorBlockProps) {
  return (
    <ChatMessageToolExecutionCompactRowStatusIndicator
      {...statusIndicator.container.props}
    >
      <ChatMessageToolExecutionCompactRowStatusIndicatorContent
        spinner={statusIndicator.spinner}
        icon={statusIndicator.icon}
      />
    </ChatMessageToolExecutionCompactRowStatusIndicator>
  );
}

export function ChatMessageToolExecutionCompactRowStatusIndicatorContent({
  spinner,
  icon,
}: ChatMessageToolExecutionCompactRowStatusIndicatorContentProps) {
  if (spinner.shouldRender) {
    return (
      <ChatMessageToolExecutionCompactRowSpinner
        {...spinner.props}
      />
    );
  }

  if (icon.shouldRender) {
    return (
      <ChatMessageToolExecutionCompactRowIcon
        {...icon.props}
      />
    );
  }

  return null;
}

export function ChatMessageToolExecutionCompactRowContainer({
  children,
  ...props
}: ChatMessageToolExecutionCompactRowContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionCompactRowIconCell({
  children,
  ...props
}: ChatMessageToolExecutionCompactRowIconCellProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionCompactRowIcon(props: ChatMessageToolExecutionCompactRowIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolExecutionCompactRowName({
  props,
  text,
}: ChatMessageToolExecutionCompactRowNameProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionCompactRowStatusIndicator({
  children,
  ...props
}: ChatMessageToolExecutionCompactRowStatusIndicatorProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionCompactRowSpinner(props: ChatMessageToolExecutionCompactRowSpinnerProps) {
  return (
    <ActivityIndicator {...props} />
  );
}

export function ChatMessageToolExecutionCompactList({
  shouldRender,
  renderState,
  rows,
  onPress,
  groupStyles,
  rowStyles,
}: ChatMessageToolExecutionCompactListProps) {
  const compactListParts: ChatMessageToolExecutionCompactListParts =
    createChatRuntimeToolExecutionCompactListMobilePropsParts({
      shouldRender,
      renderState,
      rows,
      onPress,
      groupStyles,
      rowStyles,
    });

  if (!compactListParts.group.shouldRender) return null;

  return (
    <ChatMessageToolExecutionCompactGroup
      {...compactListParts.group.props}
    >
      <ChatMessageToolExecutionCompactListContent
        {...compactListParts.group.content}
      />
    </ChatMessageToolExecutionCompactGroup>
  );
}

export function ChatMessageToolExecutionCompactListContent({
  rows,
}: ChatMessageToolExecutionCompactListContentProps) {
  return (
    <>
      {rows.map((row) => (
        <ChatMessageToolExecutionCompactRow
          key={row.key}
          {...row.props}
        />
      ))}
    </>
  );
}

export function ChatMessageToolExecutionCollapseControl({
  renderState,
  onPress,
  styles,
}: ChatMessageToolExecutionCollapseControlProps) {
  const collapseControlParts: ChatMessageToolExecutionCollapseControlParts =
    createChatRuntimeToolExecutionCollapseControlMobilePropsParts({
      renderState,
      onPress,
      styles,
    });

  return (
    <ChatMessageToolExecutionCollapseControlPressable
      {...collapseControlParts.container.props}
    >
      <ChatMessageToolExecutionCollapseControlContent
        {...collapseControlParts.container.content}
      />
    </ChatMessageToolExecutionCollapseControlPressable>
  );
}

export function ChatMessageToolExecutionCollapseControlPressable({
  children,
  ...props
}: ChatMessageToolExecutionCollapseControlPressableProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatMessageToolExecutionCollapseControlContent({
  icon,
  label,
}: ChatMessageToolExecutionCollapseControlContentProps) {
  return (
    <>
      <ChatMessageToolExecutionCollapseControlIcon
        {...icon.props}
      />
      <ChatMessageToolExecutionCollapseControlLabel
        {...label.props}
      />
    </>
  );
}

export function ChatMessageToolExecutionCollapseControlIcon(props: ChatMessageToolExecutionCollapseControlIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolExecutionCollapseControlLabel({
  props,
  text,
}: ChatMessageToolExecutionCollapseControlLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionExpandedGroup({
  topCollapseRenderState,
  bottomCollapseRenderState,
  onCollapsePress,
  isPending,
  allSuccess,
  hasErrors,
  emptyState,
  styles,
  children,
}: ChatMessageToolExecutionExpandedGroupProps) {
  const expandedGroupParts: ChatMessageToolExecutionExpandedGroupParts =
    createChatRuntimeToolExecutionExpandedGroupMobilePropsParts({
      topCollapseRenderState,
      bottomCollapseRenderState,
      onCollapsePress,
      isPending,
      allSuccess,
      hasErrors,
      emptyState,
      styles,
    });

  return (
    <ChatMessageToolExecutionExpandedGroupContainer
      {...expandedGroupParts.container.props}
    >
      <ChatMessageToolExecutionExpandedGroupContent
        {...expandedGroupParts.container.content}
      >
        {children}
      </ChatMessageToolExecutionExpandedGroupContent>
    </ChatMessageToolExecutionExpandedGroupContainer>
  );
}

export function ChatMessageToolExecutionExpandedGroupContent({
  topCollapseControl,
  bottomCollapseControl,
  card,
  emptyState,
  children,
}: ChatMessageToolExecutionExpandedGroupContentProps) {
  return (
    <>
      <ChatMessageToolExecutionCollapseControl
        {...topCollapseControl.props}
      />
      <ChatMessageToolExecutionExpandedGroupCard
        {...card.props}
      >
        {children}
        <ChatMessageToolExecutionExpandedGroupEmptyStateBlock
          emptyState={emptyState}
        />
      </ChatMessageToolExecutionExpandedGroupCard>
      <ChatMessageToolExecutionCollapseControl
        {...bottomCollapseControl.props}
      />
    </>
  );
}

export function ChatMessageToolExecutionExpandedGroupEmptyStateBlock({
  emptyState,
}: ChatMessageToolExecutionExpandedGroupEmptyStateBlockProps) {
  if (!emptyState.shouldRender) {
    return null;
  }

  return emptyState.props;
}

export function ChatMessageToolExecutionExpandedGroupContainer({
  children,
  ...props
}: ChatMessageToolExecutionExpandedGroupContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionExpandedGroupCard({
  children,
  ...props
}: ChatMessageToolExecutionExpandedGroupCardProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionPanel({
  shouldRender,
  isExpanded,
  compact,
  expanded,
  children,
}: ChatMessageToolExecutionPanelProps) {
  const panelParts: ChatMessageToolExecutionPanelParts =
    createChatRuntimeToolExecutionPanelMobilePropsParts({
      shouldRender,
      isExpanded,
      compact,
      expanded,
    });

  return (
    <ChatMessageToolExecutionPanelContent
      {...panelParts.content}
    >
      {children}
    </ChatMessageToolExecutionPanelContent>
  );
}

export function ChatMessageToolExecutionPanelContent({
  shouldRender,
  compactList,
  expandedGroup,
  children,
}: ChatMessageToolExecutionPanelContentProps) {
  if (!shouldRender) return null;

  const panelShellParts: ChatMessageToolExecutionPanelShellParts =
    createChatRuntimeToolExecutionPanelShellMobilePropsParts({
      compactList: (
        <ChatMessageToolExecutionCompactList
          {...compactList.props}
        />
      ),
      expandedGroup: expandedGroup.shouldRender ? (
        <ChatMessageToolExecutionExpandedGroup {...expandedGroup.props}>
          {children}
        </ChatMessageToolExecutionExpandedGroup>
      ) : null,
    });

  return (
    <ChatMessageToolExecutionPanelShellContent
      {...panelShellParts.content}
    />
  );
}

export function ChatMessageToolExecutionPanelShellContent({
  compactList,
  expandedGroup,
}: ChatMessageToolExecutionPanelShellContentProps) {
  return (
    <>
      {compactList}
      {expandedGroup.shouldRender ? expandedGroup.props : null}
    </>
  );
}

export function ChatMessageToolExecutionStack({
  shouldRender,
  isExpanded,
  compact,
  expanded,
  detailRows,
  styles,
}: ChatMessageToolExecutionStackProps) {
  const stackPanelParts: ChatMessageToolExecutionStackPanelParts =
    createChatRuntimeToolExecutionStackPanelMobilePropsParts({
      compact,
      expanded,
      detailRows,
      styles,
    });

  return (
    <ChatMessageToolExecutionStackContent
      shouldRender={shouldRender}
      isExpanded={isExpanded}
      {...stackPanelParts}
    />
  );
}

export function ChatMessageToolExecutionStackContent({
  shouldRender,
  isExpanded,
  compactList,
  expandedGroup,
}: ChatMessageToolExecutionStackContentProps) {
  return (
    <ChatMessageToolExecutionPanel
      shouldRender={shouldRender}
      isExpanded={isExpanded}
      compact={compactList.props}
      expanded={{
        ...expandedGroup.props,
        emptyState: expandedGroup.content.emptyState.shouldRender ? (
          <ChatMessageToolExecutionStackEmptyStateBlock
            emptyState={expandedGroup.content.emptyState}
          />
        ) : null,
      }}
    >
      <ChatMessageToolExecutionCallList
        {...expandedGroup.content.callList.props}
      />
    </ChatMessageToolExecutionPanel>
  );
}

export function ChatMessageToolExecutionStackEmptyStateBlock({
  emptyState,
}: ChatMessageToolExecutionStackEmptyStateBlockProps) {
  if (!emptyState.shouldRender) {
    return null;
  }

  return (
    <ChatMessageToolExecutionEmptyState
      {...emptyState.props}
    />
  );
}

export function ChatMessageToolExecutionCopyButton({
  renderState,
  onPress,
  styles,
}: ChatMessageToolExecutionCopyButtonProps) {
  const copyButtonParts: ChatMessageToolExecutionCopyButtonParts =
    createChatRuntimeToolExecutionCopyButtonMobilePropsParts({
      renderState,
      onPress,
      styles,
    });

  return (
    <ChatMessageToolExecutionCopyButtonPressable
      {...copyButtonParts.container.props}
    >
      <ChatMessageToolExecutionCopyButtonContent
        {...copyButtonParts.container.content}
      />
    </ChatMessageToolExecutionCopyButtonPressable>
  );
}

export function ChatMessageToolExecutionCopyButtonPressable({
  children,
  ...props
}: ChatMessageToolExecutionCopyButtonPressableProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatMessageToolExecutionCopyButtonContent({
  icon,
  label,
}: ChatMessageToolExecutionCopyButtonContentProps) {
  return (
    <>
      <ChatMessageToolExecutionCopyButtonIcon
        {...icon.props}
      />
      <ChatMessageToolExecutionCopyButtonLabel
        {...label.props}
      />
    </>
  );
}

export function ChatMessageToolExecutionCopyButtonIcon(props: ChatMessageToolExecutionCopyButtonIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolExecutionCopyButtonLabel({
  props,
  text,
}: ChatMessageToolExecutionCopyButtonLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionDetailHeader({
  renderState,
  toolName,
  onPress,
  styles,
}: ChatMessageToolExecutionDetailHeaderProps) {
  const detailHeaderParts: ChatMessageToolExecutionDetailHeaderParts =
    createChatRuntimeToolExecutionDetailHeaderMobilePropsParts({
      renderState,
      toolName,
      onPress,
      styles,
    });

  return (
    <ChatMessageToolExecutionDetailHeaderPressable
      {...detailHeaderParts.container.props}
    >
      <ChatMessageToolExecutionDetailHeaderContent
        {...detailHeaderParts.container.content}
      />
    </ChatMessageToolExecutionDetailHeaderPressable>
  );
}

export function ChatMessageToolExecutionDetailHeaderPressable({
  children,
  ...props
}: ChatMessageToolExecutionDetailHeaderPressableProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatMessageToolExecutionDetailHeaderContent({
  toolName,
  expandHint,
}: ChatMessageToolExecutionDetailHeaderContentProps) {
  return (
    <>
      <ChatMessageToolExecutionDetailHeaderToolName
        {...toolName.props}
      />
      <ChatMessageToolExecutionDetailHeaderExpandHint
        {...expandHint.props}
      >
        <ChatMessageToolExecutionDetailHeaderExpandHintContent
          {...expandHint.content}
        />
      </ChatMessageToolExecutionDetailHeaderExpandHint>
    </>
  );
}

export function ChatMessageToolExecutionDetailHeaderToolName({
  props,
  text,
}: ChatMessageToolExecutionDetailHeaderToolNameProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionDetailHeaderExpandHint({
  children,
  ...props
}: ChatMessageToolExecutionDetailHeaderExpandHintProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionDetailHeaderExpandHintContent({
  icon,
  label,
}: ChatMessageToolExecutionDetailHeaderExpandHintContentProps) {
  return (
    <>
      <ChatMessageToolExecutionDetailHeaderIcon
        {...icon.props}
      />
      <ChatMessageToolExecutionDetailHeaderExpandLabel
        {...label.props}
      />
    </>
  );
}

export function ChatMessageToolExecutionDetailHeaderIcon(props: ChatMessageToolExecutionDetailHeaderIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolExecutionDetailHeaderExpandLabel({
  props,
  text,
}: ChatMessageToolExecutionDetailHeaderExpandLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionCallSection({
  renderState,
  toolName,
  onHeaderPress,
  styles,
  children,
}: ChatMessageToolExecutionCallSectionProps) {
  const callSectionParts: ChatMessageToolExecutionCallSectionParts =
    createChatRuntimeToolExecutionCallSectionMobilePropsParts({
      renderState,
      toolName,
      onHeaderPress,
      styles,
    });

  return (
    <ChatMessageToolExecutionCallSectionContainer
      {...callSectionParts.container.props}
    >
      <ChatMessageToolExecutionCallSectionContent
        {...callSectionParts.container.content}
      >
        {children}
      </ChatMessageToolExecutionCallSectionContent>
    </ChatMessageToolExecutionCallSectionContainer>
  );
}

export function ChatMessageToolExecutionCallSectionContent({
  header,
  children,
}: ChatMessageToolExecutionCallSectionContentProps) {
  return (
    <>
      <ChatMessageToolExecutionDetailHeader
        {...header.props}
      />
      {children}
    </>
  );
}

export function ChatMessageToolExecutionCallSectionContainer({
  children,
  ...props
}: ChatMessageToolExecutionCallSectionContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionResultBadge({
  badge,
  styles,
}: ChatMessageToolExecutionResultBadgeProps) {
  const resultBadgeParts: ChatMessageToolExecutionResultBadgeParts =
    createChatRuntimeToolExecutionResultBadgeMobilePropsParts({
      badge,
      styles,
    });

  return (
    <ChatMessageToolExecutionResultBadgeContainer
      {...resultBadgeParts.container.props}
    >
      <ChatMessageToolExecutionResultBadgeContent
        {...resultBadgeParts.container.content}
      />
    </ChatMessageToolExecutionResultBadgeContainer>
  );
}

export function ChatMessageToolExecutionResultBadgeContainer({
  children,
  ...props
}: ChatMessageToolExecutionResultBadgeContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionResultBadgeContent({
  icon,
  label,
}: ChatMessageToolExecutionResultBadgeContentProps) {
  return (
    <>
      <ChatMessageToolExecutionResultBadgeIcon
        {...icon.props}
      />
      <ChatMessageToolExecutionResultBadgeLabel
        {...label.props}
      />
    </>
  );
}

export function ChatMessageToolExecutionResultBadgeIcon(props: ChatMessageToolExecutionResultBadgeIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageToolExecutionResultBadgeLabel({
  props,
  text,
}: ChatMessageToolExecutionResultBadgeLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionPendingResult({
  renderState,
  styles,
}: ChatMessageToolExecutionPendingResultProps) {
  const pendingResultParts: ChatMessageToolExecutionPendingResultParts =
    createChatRuntimeToolExecutionPendingResultMobilePropsParts({
      renderState,
      styles,
    });

  return (
    <ChatMessageToolExecutionPendingResultContainer
      {...pendingResultParts.container.props}
    >
      <ChatMessageToolExecutionPendingResultContent
        {...pendingResultParts.container.content}
      />
    </ChatMessageToolExecutionPendingResultContainer>
  );
}

export function ChatMessageToolExecutionPendingResultContainer({
  children,
  ...props
}: ChatMessageToolExecutionPendingResultContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionPendingResultContent({
  spinner,
  label,
}: ChatMessageToolExecutionPendingResultContentProps) {
  return (
    <>
      <ChatMessageToolExecutionPendingResultSpinner
        {...spinner.props}
      />
      <ChatMessageToolExecutionPendingResultLabel
        {...label.props}
      />
    </>
  );
}

export function ChatMessageToolExecutionPendingResultSpinner(props: ChatMessageToolExecutionPendingResultSpinnerProps) {
  return (
    <ActivityIndicator {...props} />
  );
}

export function ChatMessageToolExecutionPendingResultLabel({
  props,
  text,
}: ChatMessageToolExecutionPendingResultLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionEmptyState({
  renderState,
  style,
}: ChatMessageToolExecutionEmptyStateProps) {
  const emptyStateParts: ChatMessageToolExecutionEmptyStateParts =
    createChatRuntimeToolExecutionEmptyStateMobilePropsParts({
      renderState,
      style,
    });

  return (
    <ChatMessageToolExecutionEmptyStateLabel
      {...emptyStateParts.content.label.props}
    />
  );
}

export function ChatMessageToolExecutionEmptyStateLabel({
  props,
  text,
}: ChatMessageToolExecutionEmptyStateLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionPayloadMeta({
  renderState,
  styles,
}: ChatMessageToolExecutionPayloadMetaProps) {
  const payloadMetaParts: ChatMessageToolExecutionPayloadMetaParts =
    createChatRuntimeToolExecutionPayloadMetaMobilePropsParts({
      renderState,
      styles,
    });

  const content = (
    <ChatMessageToolExecutionPayloadMetaContent
      {...payloadMetaParts.content}
    />
  );

  if (!payloadMetaParts.row.shouldRender) {
    return content;
  }

  return (
    <ChatMessageToolExecutionPayloadMetaRow
      {...payloadMetaParts.row.props}
    >
      {content}
    </ChatMessageToolExecutionPayloadMetaRow>
  );
}

export function ChatMessageToolExecutionPayloadMetaContent({
  label,
  payloadType,
}: ChatMessageToolExecutionPayloadMetaContentProps) {
  return (
    <>
      <ChatMessageToolExecutionPayloadMetaText
        {...label.props}
      />
      <ChatMessageToolExecutionPayloadMetaPayloadTypeBlock
        payloadType={payloadType}
      />
    </>
  );
}

export function ChatMessageToolExecutionPayloadMetaPayloadTypeBlock({
  payloadType,
}: ChatMessageToolExecutionPayloadMetaPayloadTypeBlockProps) {
  if (!payloadType.shouldRender) {
    return null;
  }

  return (
    <ChatMessageToolExecutionPayloadMetaText
      {...payloadType.props}
    />
  );
}

export function ChatMessageToolExecutionPayloadMetaRow({
  children,
  ...props
}: ChatMessageToolExecutionPayloadMetaRowProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionPayloadMetaText({
  props,
  text,
}: ChatMessageToolExecutionPayloadMetaTextProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionResultHeader({
  payloadRenderState,
  resultBadge,
  characterCountLabel,
  copyButtonRenderState,
  onCopyPress,
  styles,
}: ChatMessageToolExecutionResultHeaderProps) {
  const resultHeaderParts: ChatMessageToolExecutionResultHeaderParts =
    createChatRuntimeToolExecutionResultHeaderMobilePropsParts({
      payloadRenderState,
      resultBadge,
      characterCountLabel,
      copyButtonRenderState,
      onCopyPress,
      styles,
    });

  return (
    <ChatMessageToolExecutionResultHeaderView
      {...resultHeaderParts.header.props}
    >
      <ChatMessageToolExecutionResultHeaderContent
        {...resultHeaderParts.header.content}
      />
    </ChatMessageToolExecutionResultHeaderView>
  );
}

export function ChatMessageToolExecutionResultHeaderContent({
  meta,
  copyButton,
}: ChatMessageToolExecutionResultHeaderContentProps) {
  return (
    <>
      <ChatMessageToolExecutionResultHeaderView
        {...meta.props}
      >
        <ChatMessageToolExecutionResultHeaderMetaContent
          {...meta.content}
        />
      </ChatMessageToolExecutionResultHeaderView>
      <ChatMessageToolExecutionCopyButton
        {...copyButton.props}
      />
    </>
  );
}

export function ChatMessageToolExecutionResultHeaderMetaContent({
  payloadMeta,
  resultBadge,
  characterCount,
}: ChatMessageToolExecutionResultHeaderMetaContentProps) {
  return (
    <>
      <ChatMessageToolExecutionPayloadMeta
        {...payloadMeta.props}
      />
      <ChatMessageToolExecutionResultBadge
        {...resultBadge.props}
      />
      <ChatMessageToolExecutionResultCharacterCount
        {...characterCount.props}
      />
    </>
  );
}

export function ChatMessageToolExecutionResultHeaderView({
  children,
  ...props
}: ChatMessageToolExecutionResultHeaderViewProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionResultCharacterCount({
  props,
  text,
}: ChatMessageToolExecutionResultCharacterCountProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionPayloadBlock({
  compactText,
  content,
  isExpanded,
  previewNumberOfLines,
  styles,
}: ChatMessageToolExecutionPayloadBlockProps) {
  const payloadBlockParts: ChatMessageToolExecutionPayloadBlockParts =
    createChatRuntimeToolExecutionPayloadBlockMobilePropsParts({
      compactText,
      content,
      isExpanded,
      previewNumberOfLines,
      styles,
    });

  return (
    <ChatMessageToolExecutionPayloadBlockContent
      {...payloadBlockParts.content}
    />
  );
}

export function ChatMessageToolExecutionPayloadBlockContent({
  preview,
  scroll,
}: ChatMessageToolExecutionPayloadBlockContentProps) {
  return (
    <>
      <ChatMessageToolExecutionPayloadPreviewBlock preview={preview} />
      <ChatMessageToolExecutionPayloadScroll {...scroll.props}>
        <ChatMessageToolExecutionPayloadScrollContent {...scroll.content} />
      </ChatMessageToolExecutionPayloadScroll>
    </>
  );
}

export function ChatMessageToolExecutionPayloadPreviewBlock({
  preview,
}: ChatMessageToolExecutionPayloadPreviewBlockProps) {
  if (!preview.shouldRender) {
    return null;
  }

  return (
    <ChatMessageToolExecutionPayloadPreview {...preview.props} />
  );
}

export function ChatMessageToolExecutionPayloadScrollContent({
  code,
}: ChatMessageToolExecutionPayloadScrollContentProps) {
  return (
    <ChatMessageToolExecutionPayloadCode {...code.props} />
  );
}

export function ChatMessageToolExecutionPayloadPreview({
  props,
  text,
}: ChatMessageToolExecutionPayloadPreviewProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionPayloadScroll({
  children,
  ...props
}: ChatMessageToolExecutionPayloadScrollProps) {
  return (
    <ScrollView {...props}>
      {children}
    </ScrollView>
  );
}

export function ChatMessageToolExecutionPayloadCode({
  props,
  text,
}: ChatMessageToolExecutionPayloadCodeProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionPayloadSection({
  payloadRenderState,
  compactText,
  content,
  isExpanded,
  previewNumberOfLines,
  copyButtonRenderState,
  onCopyPress,
  styles,
}: ChatMessageToolExecutionPayloadSectionProps) {
  const payloadSectionParts: ChatMessageToolExecutionPayloadSectionParts =
    createChatRuntimeToolExecutionPayloadSectionMobilePropsParts({
      payloadRenderState,
      compactText,
      content,
      isExpanded,
      previewNumberOfLines,
      copyButtonRenderState,
      onCopyPress,
      styles,
    });

  return (
    <ChatMessageToolExecutionPayloadSectionView
      {...payloadSectionParts.section.props}
    >
      <ChatMessageToolExecutionPayloadSectionContent
        {...payloadSectionParts.section.content}
      />
    </ChatMessageToolExecutionPayloadSectionView>
  );
}

export function ChatMessageToolExecutionPayloadSectionContent({
  headerRow,
  payloadBlock,
}: ChatMessageToolExecutionPayloadSectionContentProps) {
  return (
    <>
      <ChatMessageToolExecutionPayloadSectionView
        {...headerRow.props}
      >
        <ChatMessageToolExecutionPayloadSectionHeaderContent
          {...headerRow.content}
        />
      </ChatMessageToolExecutionPayloadSectionView>
      <ChatMessageToolExecutionPayloadBlock
        {...payloadBlock.props}
      />
    </>
  );
}

export function ChatMessageToolExecutionPayloadSectionHeaderContent({
  payloadMeta,
  copyButton,
}: ChatMessageToolExecutionPayloadSectionHeaderContentProps) {
  return (
    <>
      <ChatMessageToolExecutionPayloadMeta
        {...payloadMeta.props}
      />
      <ChatMessageToolExecutionCopyButton
        {...copyButton.props}
      />
    </>
  );
}

export function ChatMessageToolExecutionPayloadSectionView({
  children,
  ...props
}: ChatMessageToolExecutionPayloadSectionViewProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionErrorBlock({
  renderState,
  error,
  copyButtonRenderState,
  onCopyPress,
  styles,
}: ChatMessageToolExecutionErrorBlockProps) {
  const errorBlockParts: ChatMessageToolExecutionErrorBlockParts =
    createChatRuntimeToolExecutionErrorBlockMobilePropsParts({
      renderState,
      error,
      copyButtonRenderState,
      onCopyPress,
      styles,
    });

  return (
    <ChatMessageToolExecutionErrorBlockView
      {...errorBlockParts.section.props}
    >
      <ChatMessageToolExecutionErrorBlockContent
        {...errorBlockParts.section.content}
      />
    </ChatMessageToolExecutionErrorBlockView>
  );
}

export function ChatMessageToolExecutionErrorBlockContent({
  headerRow,
  error,
}: ChatMessageToolExecutionErrorBlockContentProps) {
  return (
    <>
      <ChatMessageToolExecutionErrorBlockView
        {...headerRow.props}
      >
        <ChatMessageToolExecutionErrorBlockHeaderContent
          {...headerRow.content}
        />
      </ChatMessageToolExecutionErrorBlockView>
      <ChatMessageToolExecutionErrorBlockText
        {...error.props}
      />
    </>
  );
}

export function ChatMessageToolExecutionErrorBlockHeaderContent({
  label,
  copyButton,
}: ChatMessageToolExecutionErrorBlockHeaderContentProps) {
  return (
    <>
      <ChatMessageToolExecutionErrorBlockText
        {...label.props}
      />
      <ChatMessageToolExecutionCopyButton
        {...copyButton.props}
      />
    </>
  );
}

export function ChatMessageToolExecutionErrorBlockView({
  children,
  ...props
}: ChatMessageToolExecutionErrorBlockViewProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionErrorBlockText({
  props,
  text,
}: ChatMessageToolExecutionErrorBlockTextProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageToolExecutionResultSection({
  payloadRenderState,
  resultBadge,
  characterCountLabel,
  resultCompactText,
  resultContent,
  isExpanded,
  previewNumberOfLines,
  copyButtonRenderState,
  onCopyPress,
  errorRenderState,
  error,
  errorCopyButtonRenderState,
  onErrorCopyPress,
  styles,
}: ChatMessageToolExecutionResultSectionProps) {
  const resultSectionParts: ChatMessageToolExecutionResultSectionParts =
    createChatRuntimeToolExecutionResultSectionMobilePropsParts({
      payloadRenderState,
      resultBadge,
      characterCountLabel,
      resultCompactText,
      resultContent,
      isExpanded,
      previewNumberOfLines,
      copyButtonRenderState,
      onCopyPress,
      errorRenderState,
      error,
      errorCopyButtonRenderState,
      onErrorCopyPress,
      styles,
    });

  return (
    <ChatMessageToolExecutionResultSectionItem
      {...resultSectionParts.item.props}
    >
      <ChatMessageToolExecutionResultSectionContent
        {...resultSectionParts.item.content}
      />
    </ChatMessageToolExecutionResultSectionItem>
  );
}

export function ChatMessageToolExecutionResultSectionContent({
  header,
  payloadBlock,
  errorBlock,
}: ChatMessageToolExecutionResultSectionContentProps) {
  return (
    <>
      <ChatMessageToolExecutionResultHeader
        {...header.props}
      />
      <ChatMessageToolExecutionPayloadBlock
        {...payloadBlock.props}
      />
      <ChatMessageToolExecutionResultSectionErrorBlock
        errorBlock={errorBlock}
      />
    </>
  );
}

export function ChatMessageToolExecutionResultSectionErrorBlock({
  errorBlock,
}: ChatMessageToolExecutionResultSectionErrorBlockProps) {
  if (!errorBlock.shouldRender) {
    return null;
  }

  return (
    <ChatMessageToolExecutionErrorBlock
      {...errorBlock.props}
    />
  );
}

export function ChatMessageToolExecutionResultSectionItem({
  children,
  ...props
}: ChatMessageToolExecutionResultSectionItemProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionCallDetail({
  renderState,
  toolName,
  onHeaderPress,
  input,
  result,
  pendingResult,
  styles,
}: ChatMessageToolExecutionCallDetailProps) {
  const callDetailParts: ChatMessageToolExecutionCallDetailParts =
    createChatRuntimeToolExecutionCallDetailMobilePropsParts({
      renderState,
      toolName,
      onHeaderPress,
      input,
      result,
      pendingResult,
      styles,
    });

  return (
    <ChatMessageToolExecutionCallSection
      {...callDetailParts.callSection.props}
    >
      <ChatMessageToolExecutionCallDetailContent
        {...callDetailParts.callSection.content}
      />
    </ChatMessageToolExecutionCallSection>
  );
}

export function ChatMessageToolExecutionCallDetailContent({
  inputSection,
  resultSection,
  pendingResult,
}: ChatMessageToolExecutionCallDetailContentProps) {
  return (
    <>
      <ChatMessageToolExecutionCallDetailInputSection
        inputSection={inputSection}
      />
      <ChatMessageToolExecutionCallDetailResultState
        resultSection={resultSection}
        pendingResult={pendingResult}
      />
    </>
  );
}

export function ChatMessageToolExecutionCallDetailInputSection({
  inputSection,
}: ChatMessageToolExecutionCallDetailInputSectionProps) {
  if (!inputSection.shouldRender) {
    return null;
  }

  return (
    <ChatMessageToolExecutionPayloadSection
      {...inputSection.props}
    />
  );
}

export function ChatMessageToolExecutionCallDetailResultState({
  resultSection,
  pendingResult,
}: ChatMessageToolExecutionCallDetailResultStateProps) {
  if (resultSection.shouldRender) {
    return (
      <ChatMessageToolExecutionResultSection
        {...resultSection.props}
      />
    );
  }

  if (pendingResult.shouldRender) {
    return (
      <ChatMessageToolExecutionPendingResult
        {...pendingResult.props}
      />
    );
  }

  return null;
}

export function ChatMessageToolExecutionCallList({
  rows,
  styles,
}: ChatMessageToolExecutionCallListProps) {
  const callListParts: ChatMessageToolExecutionCallListParts =
    createChatRuntimeToolExecutionCallListMobilePropsParts({
      rows,
      styles,
    });

  return (
    <ChatMessageToolExecutionCallListContent
      {...callListParts.content}
    />
  );
}

export function ChatMessageToolExecutionCallListContent({
  rows,
}: ChatMessageToolExecutionCallListContentProps) {
  return (
    <>
      {rows.map((row) => (
        <ChatMessageToolExecutionCallDetail
          key={row.key}
          {...row.props}
        />
      ))}
    </>
  );
}

export function ChatMessageConversationFrame({
  children,
  dock,
  overlays,
  keyboardAvoidingStyle,
  keyboardAvoidingBehavior,
  keyboardVerticalOffset,
  rootStyle,
}: ChatMessageConversationFrameProps) {
  const frameParts: ChatMessageConversationFrameParts =
    createChatRuntimeConversationFrameMobilePropsParts({
      children,
      dock,
      overlays,
      keyboardAvoidingStyle,
      keyboardAvoidingBehavior,
      keyboardVerticalOffset,
      rootStyle,
    });

  return (
    <KeyboardAvoidingView
      {...frameParts.keyboardAvoidingView.props}
    >
      <ChatMessageConversationFrameContent
        {...frameParts.keyboardAvoidingView.content}
      />
    </KeyboardAvoidingView>
  );
}

export function ChatMessageConversationFrameContent({
  root,
  overlays,
}: ChatMessageConversationFrameContentProps) {
  return (
    <>
      <ChatMessageConversationFrameRoot {...root.props}>
        <ChatMessageConversationFrameRootContent {...root.content} />
      </ChatMessageConversationFrameRoot>
      {overlays.children}
    </>
  );
}

export function ChatMessageConversationFrameRoot({
  children,
  ...props
}: ChatMessageConversationFrameRootProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageConversationFrameRootContent({
  children,
  dock,
}: ChatMessageConversationFrameRootContentProps) {
  return (
    <>
      {children}
      {dock.children}
    </>
  );
}

export function ChatMessageConversationOverlays({
  agentSelector,
  promptEditor,
}: ChatMessageConversationOverlaysProps) {
  const overlayParts: ChatMessageConversationOverlaysParts =
    createChatRuntimeConversationOverlaysMobilePropsParts({
      agentSelector,
      promptEditor,
    });

  return (
    <ChatMessageConversationOverlaysContent
      {...overlayParts.content}
    />
  );
}

export function ChatMessageConversationOverlaysContent({
  agentSelector,
  promptEditor,
}: ChatMessageConversationOverlaysContentProps) {
  return (
    <>
      {agentSelector.children}
      {promptEditor.children}
    </>
  );
}

export function ChatMessageRuntimeOverlays({
  agentSelector,
  promptEditor,
}: ChatMessageRuntimeOverlaysProps) {
  return (
    <ChatMessageConversationOverlays
      agentSelector={<AgentSelectorSheet {...agentSelector} />}
      promptEditor={(
        <ChatConversationHomePromptEditorModal {...promptEditor} />
      )}
    />
  );
}

export function ChatMessageScrollViewport({
  children,
  scrollRef,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps,
  contentInsetAdjustmentBehavior,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  scrollEventThrottle,
}: ChatMessageScrollViewportProps) {
  const scrollViewportParts: ChatMessageScrollViewportParts =
    createChatRuntimeConversationScrollViewportMobilePropsParts({
      children,
      scrollRef,
      style,
      contentContainerStyle,
      keyboardShouldPersistTaps,
      contentInsetAdjustmentBehavior,
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
      scrollEventThrottle,
    });

  return (
    <ScrollView
      {...scrollViewportParts.scrollView.props}
    >
      <ChatMessageScrollViewportContent
        {...scrollViewportParts.scrollView.content}
      />
    </ScrollView>
  );
}

export function ChatMessageScrollViewportContent({
  children,
}: ChatMessageScrollViewportContentProps) {
  return (
    <>
      {children}
    </>
  );
}

export function ChatMessageConversationViewportContent({
  loadingState,
  homeState,
  historyBanner,
  stepSummary,
  children,
  debugPanels,
}: ChatMessageConversationViewportContentProps) {
  const viewportContentParts: ChatMessageConversationViewportContentParts =
    createChatRuntimeConversationViewportContentMobilePropsParts({
      loadingState,
      homeState,
      historyBanner,
      stepSummary,
      children,
      debugPanels,
    });

  return (
    <ChatMessageConversationViewportContentPart
      {...viewportContentParts.content}
    />
  );
}

export function ChatMessageConversationViewportContentPart({
  loadingState,
  homeState,
  historyBanner,
  stepSummary,
  children,
  debugPanels,
}: ChatMessageConversationViewportContentPartProps) {
  return (
    <>
      {loadingState.children}
      {homeState.children}
      {historyBanner.children}
      {stepSummary.children}
      {children}
      {debugPanels.children}
    </>
  );
}

export function ChatMessageConversationViewport({
  children,
  loadingState,
  homeState,
  historyBanner,
  stepSummary,
  debugPanels,
  ...scrollViewportProps
}: ChatMessageConversationViewportProps) {
  return (
    <ChatMessageScrollViewport {...scrollViewportProps}>
      <ChatMessageConversationViewportContent
        loadingState={loadingState}
        homeState={homeState}
        historyBanner={historyBanner}
        stepSummary={stepSummary}
        debugPanels={debugPanels}
      >
        {children}
      </ChatMessageConversationViewportContent>
    </ChatMessageScrollViewport>
  );
}

export function ChatMessageRuntimeViewport<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>({
  children,
  loadingState,
  homeQuickStarts,
  historyBanner,
  stepSummary,
  debugPanels,
  styles,
  ...scrollViewportProps
}: ChatMessageRuntimeViewportProps<TPrompt, TTask>) {
  const viewportParts: ChatMessageRuntimeViewportParts<TPrompt, TTask> =
    createChatRuntimeConversationViewportMobilePropsParts({
      loadingState,
      homeQuickStarts,
      historyBanner,
      stepSummary,
      debugPanels,
      styles,
    });

  return (
    <ChatMessageConversationViewport
      {...scrollViewportProps}
      {...viewportParts.scrollViewport.props}
      loadingState={(
        <ChatMessageLoadingState
          {...viewportParts.loadingState.props}
        />
      )}
      homeState={(
        <ChatConversationHomeQuickStarts
          {...viewportParts.homeQuickStarts.props}
        />
      )}
      historyBanner={(
        <ChatMessageHistoryBanner
          {...viewportParts.historyBanner.props}
        />
      )}
      stepSummary={(
        <ChatMessageStepSummaryCard
          {...viewportParts.stepSummary.props}
        />
      )}
      debugPanels={(
        <ChatMessageDebugPanelStack
          {...viewportParts.debugPanels.props}
        />
      )}
    >
      {children}
    </ChatMessageConversationViewport>
  );
}

export function ChatMessageRuntimeSurface<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>({
  frame,
  dock,
  overlays,
  threadList,
  viewport,
  styles,
}: ChatMessageRuntimeSurfaceProps<TPrompt, TTask>) {
  const surfaceParts: ChatMessageRuntimeSurfaceParts<TPrompt, TTask> =
    createChatRuntimeConversationSurfaceMobilePropsParts({
      frame,
      dock,
      overlays,
      threadList,
      viewport,
      styles,
    });

  return (
    <ChatMessageConversationFrame
      {...surfaceParts.frame.props}
      dock={(
        <ChatMessageRuntimeDock
          {...surfaceParts.dock.props}
        />
      )}
      overlays={(
        <ChatMessageRuntimeOverlays
          {...surfaceParts.overlays.props}
        />
      )}
    >
      <ChatMessageRuntimeViewport
        {...surfaceParts.viewport.props}
      >
        <ChatMessageConversationRuntimeThreadList {...surfaceParts.viewport.content.threadList.props} />
      </ChatMessageRuntimeViewport>
    </ChatMessageConversationFrame>
  );
}

export function ChatMessageHistoryBanner({
  renderState,
  onLoadEarlier,
  styles,
}: ChatMessageHistoryBannerProps) {
  const historyBannerParts: ChatMessageHistoryBannerParts =
    createChatRuntimeMessageHistoryBannerMobilePropsParts({
      renderState,
      onLoadEarlier,
      styles,
    });

  if (!historyBannerParts.container.shouldRender) return null;

  return (
    <ChatMessageHistoryBannerContainer
      container={historyBannerParts.container}
    />
  );
}

export function ChatMessageHistoryBannerContainer({
  container,
}: ChatMessageHistoryBannerContainerProps) {
  return (
    <View {...container.props}>
      <ChatMessageHistoryBannerContainerContent
        {...container.content}
      />
    </View>
  );
}

export function ChatMessageHistoryBannerContainerContent({
  summary,
  loadButton,
}: ChatMessageHistoryBannerContainerContentProps) {
  return (
    <>
      <ChatMessageHistoryBannerSummary summary={summary} />
      <ChatMessageHistoryBannerLoadButton button={loadButton} />
    </>
  );
}

export function ChatMessageHistoryBannerSummary({
  summary,
}: ChatMessageHistoryBannerSummaryProps) {
  return (
    <ChatMessageHistoryBannerText part={summary} />
  );
}

export function ChatMessageHistoryBannerLoadButton({
  button,
}: ChatMessageHistoryBannerLoadButtonProps) {
  return (
    <Pressable
      {...button.props}
    >
      <ChatMessageHistoryBannerLoadButtonContent
        {...button.content}
      />
    </Pressable>
  );
}

export function ChatMessageHistoryBannerLoadButtonContent({
  icon,
  label,
}: ChatMessageHistoryBannerLoadButtonContentProps) {
  return (
    <>
      <ChatMessageHistoryBannerIcon icon={icon} />
      <ChatMessageHistoryBannerText part={label} />
    </>
  );
}

export function ChatMessageHistoryBannerIcon({
  icon,
}: ChatMessageHistoryBannerIconProps) {
  return (
    <Ionicons {...icon.props} />
  );
}

export function ChatMessageHistoryBannerText({
  part,
}: ChatMessageHistoryBannerTextProps) {
  return (
    <Text {...part.props}>
      {part.text}
    </Text>
  );
}

export function ChatMessageStepSummaryCard({
  renderState,
  styles,
}: ChatMessageStepSummaryCardProps) {
  const stepSummaryCardParts: ChatMessageStepSummaryCardParts =
    createChatRuntimeStepSummaryCardMobilePropsParts({
      renderState,
      styles,
    });
  const stepSummaryCardPart = stepSummaryCardParts.card;

  if (!stepSummaryCardPart.shouldRender) return null;

  return (
    <ChatMessageStepSummaryCardView {...stepSummaryCardPart.props}>
      <ChatMessageStepSummaryCardContent
        {...stepSummaryCardPart.content}
      />
    </ChatMessageStepSummaryCardView>
  );
}

export function ChatMessageStepSummaryCardView({
  children,
  ...props
}: ChatMessageStepSummaryCardViewProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageStepSummaryCardContent({
  header,
  action,
  meta,
  preview,
}: ChatMessageStepSummaryCardContentProps) {
  return (
    <>
      <ChatMessageStepSummaryHeader header={header} />
      <ChatMessageStepSummaryText part={action} />
      <ChatMessageStepSummaryText part={meta} />
      <ChatMessageStepSummaryPreviewBlock preview={preview} />
    </>
  );
}

export function ChatMessageStepSummaryPreviewBlock({
  preview,
}: ChatMessageStepSummaryPreviewBlockProps) {
  if (!preview.shouldRender) {
    return null;
  }

  return (
    <ChatMessageStepSummaryText part={preview} />
  );
}

export function ChatMessageStepSummaryHeader({
  header,
}: ChatMessageStepSummaryHeaderProps) {
  return (
    <View {...header.props}>
      <ChatMessageStepSummaryHeaderContent
        {...header.content}
      />
    </View>
  );
}

export function ChatMessageStepSummaryHeaderContent({
  title,
  badge,
}: ChatMessageStepSummaryHeaderContentProps) {
  return (
    <>
      <ChatMessageStepSummaryText part={title} />
      <ChatMessageStepSummaryBadge
        badge={badge}
      />
    </>
  );
}

export function ChatMessageStepSummaryBadge({
  badge,
}: ChatMessageStepSummaryBadgeProps) {
  return (
    <View {...badge.props}>
      <ChatMessageStepSummaryBadgeContent
        {...badge.content}
      />
    </View>
  );
}

export function ChatMessageStepSummaryBadgeContent({
  label,
}: ChatMessageStepSummaryBadgeContentProps) {
  return (
    <ChatMessageStepSummaryText part={label} />
  );
}

export function ChatMessageStepSummaryText({
  part,
}: ChatMessageStepSummaryTextProps) {
  return (
    <Text {...part.props}>
      {part.text}
    </Text>
  );
}

export function ChatMessageScrollToBottomButton({
  renderState,
  onPress,
  style,
}: ChatMessageScrollToBottomButtonProps) {
  const scrollToBottomButtonParts: ChatMessageScrollToBottomButtonParts =
    createChatRuntimeScrollToBottomButtonMobilePropsParts({
      renderState,
      onPress,
      style,
    });
  const scrollToBottomButton = scrollToBottomButtonParts.button;

  if (!scrollToBottomButton.shouldRender) return null;

  return (
    <ChatMessageScrollToBottomButtonTouchable
      {...scrollToBottomButton.props}
    >
      <ChatMessageScrollToBottomButtonContent
        {...scrollToBottomButton.content}
      />
    </ChatMessageScrollToBottomButtonTouchable>
  );
}

export function ChatMessageScrollToBottomButtonTouchable({
  children,
  ...props
}: ChatMessageScrollToBottomButtonTouchableProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatMessageScrollToBottomButtonContent({
  icon,
}: ChatMessageScrollToBottomButtonContentProps) {
  return (
    <ChatMessageScrollToBottomButtonIcon
      {...icon.props}
    />
  );
}

export function ChatMessageScrollToBottomButtonIcon(
  props: ChatMessageScrollToBottomButtonIconProps
) {
  return <Ionicons {...props} />;
}

export function ChatMessageLoadingState({
  renderState,
  spinnerSource,
  style,
  spinnerStyle,
}: ChatMessageLoadingStateProps) {
  const loadingStateParts: ChatMessageLoadingStateParts =
    createChatRuntimeLoadingStateMobilePropsParts({
      renderState,
      spinnerSource,
      style,
      spinnerStyle,
    });
  const loadingStateContainer = loadingStateParts.container;

  if (!loadingStateContainer.shouldRender) return null;

  return (
    <ChatMessageLoadingStateContainer
      {...loadingStateContainer.props}
    >
      <ChatMessageLoadingStateContainerContent
        {...loadingStateContainer.content}
      />
    </ChatMessageLoadingStateContainer>
  );
}

export function ChatMessageLoadingStateContainer({
  children,
  ...props
}: ChatMessageLoadingStateContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageLoadingStateContainerContent({
  spinner,
}: ChatMessageLoadingStateContainerContentProps) {
  return (
    <ChatMessageLoadingStateSpinner
      {...spinner.props}
    />
  );
}

export function ChatMessageLoadingStateSpinner(
  props: ChatMessageLoadingStateSpinnerProps
) {
  return <Image {...props} />;
}

export function ChatMessageDebugPanel({
  shouldRender,
  content,
  props,
}: ChatMessageDebugPanelProps) {
  const debugPanelContent = content;

  if (!shouldRender || debugPanelContent.rows.length === 0) return null;

  return (
    <View {...props}>
      {debugPanelContent.rows.map((row) => (
        <Text key={row.key} {...row.props}>
          {row.text}
        </Text>
      ))}
    </View>
  );
}

export function ChatMessageDebugPanelStack({
  requestShouldRender,
  requestRows,
  voiceShouldRender,
  voiceRows,
  panelStyle,
  textStyle,
}: ChatMessageDebugPanelStackProps) {
  const debugPanelStackParts: ChatMessageDebugPanelStackParts =
    createChatRuntimeDebugPanelStackMobilePropsParts({
      requestShouldRender,
      requestRows,
      voiceShouldRender,
      voiceRows,
      panelStyle,
      textStyle,
    });

  return (
    <>
      <ChatMessageDebugPanel
        {...debugPanelStackParts.requestPanel}
      />
      <ChatMessageDebugPanel
        {...debugPanelStackParts.voicePanel}
      />
    </>
  );
}

export function ChatMessageConversationDock({
  responseHistoryPanel,
  scrollToBottomButton,
  voiceOverlay,
  queuePanel,
  connectionBanner,
  composer,
}: ChatMessageConversationDockProps) {
  const dockShellParts: ChatMessageConversationDockParts =
    createChatRuntimeConversationDockShellMobilePropsParts({
      responseHistoryPanel,
      scrollToBottomButton,
      voiceOverlay,
      queuePanel,
      connectionBanner,
      composer,
    });

  return (
    <ChatMessageConversationDockContent
      {...dockShellParts.content}
    />
  );
}

export function ChatMessageConversationDockContent({
  responseHistoryPanel,
  scrollToBottomButton,
  voiceOverlay,
  queuePanel,
  connectionBanner,
  composer,
}: ChatMessageConversationDockContentProps) {
  return (
    <>
      {responseHistoryPanel.children}
      {scrollToBottomButton.children}
      {voiceOverlay.children}
      {queuePanel.children}
      {connectionBanner.children}
      {composer.children}
    </>
  );
}

export function ChatMessageRuntimeDock({
  responseHistoryPanel,
  scrollToBottomButton,
  voiceOverlay,
  queuePanel,
  connectionBanner,
  composer,
  styles,
}: ChatMessageRuntimeDockProps) {
  const dockParts: ChatMessageRuntimeDockParts =
    createChatRuntimeConversationDockMobilePropsParts({
      responseHistoryPanel,
      scrollToBottomButton,
      voiceOverlay,
      queuePanel,
      connectionBanner,
      composer,
      styles,
    });

  return (
    <ChatMessageConversationDock
      responseHistoryPanel={(
        <ChatMessageResponseHistoryPanelDock
          {...dockParts.responseHistoryPanel.props}
        />
      )}
      scrollToBottomButton={(
        <ChatMessageScrollToBottomButton
          {...dockParts.scrollToBottomButton.props}
        />
      )}
      voiceOverlay={(
        <ChatComposerVoiceOverlay
          {...dockParts.voiceOverlay.props}
        />
      )}
      queuePanel={(
        <ChatMessageQueuePanelDock
          {...dockParts.queuePanel.props}
        />
      )}
      connectionBanner={(
        <ChatMessageConnectionBanner
          {...dockParts.connectionBanner.props}
        />
      )}
      composer={(
        <ChatComposerRuntimeDock
          {...dockParts.composer.props}
        />
      )}
    />
  );
}

export function ChatMessageResponseHistoryPanelDock(panelProps: ChatMessageResponseHistoryPanelDockProps) {
  const {
    responses,
    colors,
    remoteBaseUrl,
    remoteApiKey,
  } = panelProps;
  const panelChromeState = useChatMessageRuntimeResponseHistoryPanelChromeState(panelProps);

  return (
    <ResponseHistoryPanel
      responses={responses}
      colors={colors}
      remoteBaseUrl={remoteBaseUrl}
      remoteApiKey={remoteApiKey}
      {...panelChromeState}
    />
  );
}

export function ChatMessageQueuePanelDock({
  shouldRender,
  panel,
  container,
}: ChatMessageQueuePanelDockProps) {
  const {
    conversationId,
    ...panelProps
  } = panel;
  const queuePanelChromeState = useChatMessageRuntimeQueuePanelDockChromeState({
    conversationId,
  });

  if (!shouldRender) return null;

  return (
    <ChatMessageQueuePanelDockContainer {...container.props}>
      <MessageQueuePanel
        {...panelProps}
        {...queuePanelChromeState}
      />
    </ChatMessageQueuePanelDockContainer>
  );
}

export function ChatMessageQueuePanelDockContainer({
  children,
  ...props
}: ChatMessageQueuePanelDockContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageConnectionBanner({
  renderState,
  onRetry,
  styles,
}: ChatMessageConnectionBannerProps) {
  const connectionBannerParts: ChatMessageConnectionBannerParts =
    createChatRuntimeConnectionBannerMobilePropsParts({
      renderState,
      onRetry,
      styles,
    });

  return (
    <>
      <ChatMessageConnectionBannerReconnecting
        reconnecting={connectionBannerParts.reconnecting}
      />
      <ChatMessageConnectionBannerFailed
        failed={connectionBannerParts.failed}
      />
    </>
  );
}

export function ChatMessageConnectionBannerReconnecting({
  reconnecting,
}: ChatMessageConnectionBannerReconnectingProps) {
  if (!reconnecting.shouldRender) return null;

  return (
    <ChatMessageConnectionBannerContainer
      {...reconnecting.container.props}
    >
      <ChatMessageConnectionBannerReconnectingContent
        {...reconnecting.container.content}
      />
    </ChatMessageConnectionBannerContainer>
  );
}

export function ChatMessageConnectionBannerReconnectingContent({
  body,
}: ChatMessageConnectionBannerReconnectingContentProps) {
  return (
    <ChatMessageConnectionBannerContent
      {...body.props}
    >
      <ChatMessageConnectionBannerSpinner
        {...body.content.spinner.props}
      />
      <ChatMessageConnectionBannerTextContainer
        {...body.content.textContainer.props}
      >
        <ChatMessageConnectionBannerReconnectingTextContent
          {...body.content.textContainer.content}
        />
      </ChatMessageConnectionBannerTextContainer>
    </ChatMessageConnectionBannerContent>
  );
}

export function ChatMessageConnectionBannerReconnectingTextContent({
  title,
  subtitle,
}: ChatMessageConnectionBannerReconnectingTextContentProps) {
  return (
    <>
      <ChatMessageConnectionBannerText
        {...title.props}
      />
      {subtitle.shouldRender ? (
        <ChatMessageConnectionBannerText
          {...subtitle.props}
        />
      ) : null}
    </>
  );
}

export function ChatMessageConnectionBannerFailed({
  failed,
}: ChatMessageConnectionBannerFailedProps) {
  if (!failed.shouldRender) return null;

  return (
    <ChatMessageConnectionBannerContainer
      {...failed.container.props}
    >
      <ChatMessageConnectionBannerFailedContent
        {...failed.container.content}
      />
    </ChatMessageConnectionBannerContainer>
  );
}

export function ChatMessageConnectionBannerFailedContent({
  body,
}: ChatMessageConnectionBannerFailedContentProps) {
  return (
    <ChatMessageConnectionBannerContent
      {...body.props}
    >
      <ChatMessageConnectionBannerIcon
        {...body.content.icon.props}
      />
      <ChatMessageConnectionBannerTextContainer
        {...body.content.textContainer.props}
      >
        <ChatMessageConnectionBannerFailedTextContent
          {...body.content.textContainer.content}
        />
      </ChatMessageConnectionBannerTextContainer>
      <ChatMessageConnectionBannerRetryButton
        {...body.content.retryButton.props}
      >
        <ChatMessageConnectionBannerRetryButtonContent
          {...body.content.retryButton.content}
        />
      </ChatMessageConnectionBannerRetryButton>
    </ChatMessageConnectionBannerContent>
  );
}

export function ChatMessageConnectionBannerFailedTextContent({
  title,
  subtitle,
}: ChatMessageConnectionBannerFailedTextContentProps) {
  return (
    <>
      <ChatMessageConnectionBannerText
        {...title.props}
      />
      <ChatMessageConnectionBannerText
        {...subtitle.props}
      />
    </>
  );
}

export function ChatMessageConnectionBannerRetryButtonContent({
  label,
}: ChatMessageConnectionBannerRetryButtonContentProps) {
  return (
    <ChatMessageConnectionBannerText
      {...label.props}
    />
  );
}

export function ChatMessageConnectionBannerContainer({
  children,
  ...props
}: ChatMessageConnectionBannerContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageConnectionBannerContent({
  children,
  ...props
}: ChatMessageConnectionBannerContentProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageConnectionBannerSpinner(props: ChatMessageConnectionBannerSpinnerProps) {
  return (
    <ActivityIndicator {...props} />
  );
}

export function ChatMessageConnectionBannerIcon(props: ChatMessageConnectionBannerIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageConnectionBannerTextContainer({
  children,
  ...props
}: ChatMessageConnectionBannerTextContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageConnectionBannerText({
  props,
  text,
}: ChatMessageConnectionBannerTextProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageConnectionBannerRetryButton({
  children,
  ...props
}: ChatMessageConnectionBannerRetryButtonProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerRuntimeDock({
  speechPreview,
  pendingImagesRail,
  handsFreeControls,
  imageAttachmentControl,
  textToSpeechControl,
  editBeforeSendControl,
  textEntry,
  queueAction,
  submitAction,
  micButton,
  micWrapperRef,
  styles,
}: ChatComposerRuntimeDockProps) {
  const composerDockParts: ChatComposerRuntimeDockParts =
    createChatComposerRuntimeDockMobilePropsParts({
      speechPreview,
      pendingImagesRail,
      handsFreeControls,
      imageAttachmentControl,
      textToSpeechControl,
      editBeforeSendControl,
      textEntry,
      queueAction,
      submitAction,
      micButton,
      micWrapperRef,
      styles,
    });

  return (
    <ChatComposerInputDock
      speechPreview={(
        <ChatComposerSpeechPreview
          {...composerDockParts.speechPreview.props}
        />
      )}
      pendingImagesRail={(
        <ChatComposerPendingImagesRail
          {...composerDockParts.pendingImagesRail.props}
        />
      )}
      handsFreeControls={(
        <ChatComposerHandsFreeControls
          {...composerDockParts.handsFreeControls.props}
          status={<HandsFreeStatusChip {...composerDockParts.handsFreeControls.content.status.props} />}
        />
      )}
      imageAttachmentControl={(
        <ChatComposerIconButton
          {...composerDockParts.imageAttachmentControl.props}
        />
      )}
      textToSpeechControl={(
        <ChatComposerIconButton
          {...composerDockParts.textToSpeechControl.props}
        />
      )}
      editBeforeSendControl={(
        <ChatComposerIconButton
          {...composerDockParts.editBeforeSendControl.props}
        />
      )}
      textEntry={(
        <ChatComposerTextEntry
          {...composerDockParts.textEntry.props}
        />
      )}
      queueAction={(
        <ChatComposerLabeledActionButton
          {...composerDockParts.queueAction.props}
        />
      )}
      submitAction={(
        <ChatComposerLabeledActionButton
          {...composerDockParts.submitAction.props}
        />
      )}
      micButton={(
        <ChatComposerMicButton
          {...composerDockParts.micButton.props}
        />
      )}
      {...composerDockParts.inputDock.props}
    />
  );
}

export function ChatComposerInputDock({
  speechPreview,
  pendingImagesRail,
  handsFreeControls,
  imageAttachmentControl,
  textToSpeechControl,
  editBeforeSendControl,
  textEntry,
  queueAction,
  submitAction,
  micButton,
  micWrapperRef,
  styles,
}: ChatComposerInputDockProps) {
  const inputDockParts: ChatComposerInputDockParts =
    createChatComposerInputDockMobilePropsParts({
      speechPreview,
      pendingImagesRail,
      handsFreeControls,
      imageAttachmentControl,
      textToSpeechControl,
      editBeforeSendControl,
      textEntry,
      queueAction,
      submitAction,
      micButton,
      micWrapperRef,
      styles,
    });

  return (
    <ChatComposerInputDockArea
      {...inputDockParts.area.props}
    >
      <ChatComposerInputDockAreaContent
        {...inputDockParts.area.content}
      />
    </ChatComposerInputDockArea>
  );
}

export function ChatComposerInputDockAreaContent({
  speechPreview,
  pendingImagesRail,
  handsFreeControls,
  row,
  micWrapper,
}: ChatComposerInputDockAreaContentProps) {
  return (
    <>
      {speechPreview.children}
      {pendingImagesRail.children}
      {handsFreeControls.children}
      <ChatComposerInputDockRow
        {...row.props}
      >
        <ChatComposerInputDockRowContent
          {...row.content}
        />
      </ChatComposerInputDockRow>
      <ChatComposerInputDockMicWrapper
        {...micWrapper.props}
      >
        <ChatComposerInputDockMicWrapperContent
          {...micWrapper.content}
        />
      </ChatComposerInputDockMicWrapper>
    </>
  );
}

export function ChatComposerInputDockArea({
  children,
  ...props
}: ChatComposerInputDockAreaProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerInputDockRow({
  children,
  ...props
}: ChatComposerInputDockRowProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerInputDockRowContent({
  imageAttachmentControl,
  textToSpeechControl,
  editBeforeSendControl,
  textEntry,
  queueAction,
  submitAction,
}: ChatComposerInputDockRowContentProps) {
  return (
    <>
      {imageAttachmentControl.children}
      {textToSpeechControl.children}
      {editBeforeSendControl.children}
      {textEntry.children}
      {queueAction.children}
      {submitAction.children}
    </>
  );
}

export const ChatComposerInputDockMicWrapper = forwardRef<View, ChatComposerInputDockMicWrapperProps>(function ChatComposerInputDockMicWrapper({
  children,
  ...props
}, ref) {
  return (
    <View
      ref={ref}
      {...props}
    >
      {children}
    </View>
  );
});

export function ChatComposerInputDockMicWrapperContent({
  micButton,
}: ChatComposerInputDockMicWrapperContentProps) {
  return (
    <>
      {micButton.children}
    </>
  );
}

export function ChatComposerSpeechPreview({
  label,
  text,
  styles,
}: ChatComposerSpeechPreviewProps) {
  const speechPreviewParts: ChatComposerSpeechPreviewParts =
    createChatComposerSpeechPreviewMobilePropsParts({
      label,
      text,
      styles,
    });
  const speechPreviewContainer = speechPreviewParts.container;

  if (!speechPreviewContainer.shouldRender) return null;

  return (
    <ChatComposerSpeechPreviewContainer
      {...speechPreviewContainer.props}
    >
      <ChatComposerSpeechPreviewLabel
        {...speechPreviewParts.label.props}
      />
      <ChatComposerSpeechPreviewText
        {...speechPreviewParts.text.props}
      />
    </ChatComposerSpeechPreviewContainer>
  );
}

export function ChatComposerSpeechPreviewContainer({
  children,
  ...props
}: ChatComposerSpeechPreviewContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerSpeechPreviewLabel({
  text,
  ...props
}: ChatComposerSpeechPreviewLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatComposerSpeechPreviewText({
  text,
  ...props
}: ChatComposerSpeechPreviewTextProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatComposerPendingImagesRail({
  images,
  renderState,
  onRemove,
  styles,
}: ChatComposerPendingImagesRailProps) {
  const pendingImagesRailParts: ChatComposerPendingImagesRailParts =
    createChatComposerPendingImagesRailMobilePropsParts({
      images,
      renderState,
      onRemove,
      styles,
    });
  const pendingImagesRailScrollView = pendingImagesRailParts.scrollView;

  if (!pendingImagesRailScrollView.shouldRender) return null;

  return (
    <ChatComposerPendingImagesRailScrollView
      {...pendingImagesRailScrollView.props}
    >
      <ChatComposerPendingImagesRailScrollViewContent {...pendingImagesRailScrollView.content} />
    </ChatComposerPendingImagesRailScrollView>
  );
}

export function ChatComposerPendingImagesRailScrollView({
  children,
  ...props
}: ChatComposerPendingImagesRailScrollViewProps) {
  return (
    <ScrollView {...props}>
      {children}
    </ScrollView>
  );
}

export function ChatComposerPendingImagesRailScrollViewContent({
  items,
}: ChatComposerPendingImagesRailScrollViewContentProps) {
  return (
    <>
      {items.map((item) => (
        <ChatComposerPendingImageCard
          key={item.key}
          {...item.card.props}
        >
          <ChatComposerPendingImagePreview
            {...item.preview.props}
          />
          <ChatComposerPendingImageRemoveButton
            {...item.removeButton.props}
          >
            <ChatComposerPendingImageRemoveIcon
              {...item.removeIcon.props}
            />
          </ChatComposerPendingImageRemoveButton>
        </ChatComposerPendingImageCard>
      ))}
    </>
  );
}

export function ChatComposerPendingImageCard({
  children,
  ...props
}: ChatComposerPendingImageCardProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerPendingImagePreview(props: ChatComposerPendingImagePreviewProps) {
  return (
    <Image {...props} />
  );
}

export function ChatComposerPendingImageRemoveButton({
  children,
  ...props
}: ChatComposerPendingImageRemoveButtonProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerPendingImageRemoveIcon(props: ChatComposerPendingImageRemoveIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatComposerVoiceOverlay({
  isVisible,
  label,
  transcript,
  transcriptNumberOfLines,
  styles,
}: ChatComposerVoiceOverlayProps) {
  const voiceOverlayParts: ChatComposerVoiceOverlayParts =
    createChatComposerVoiceOverlayMobilePropsParts({
      isVisible,
      label,
      transcript,
      transcriptNumberOfLines,
      styles,
    });
  const voiceOverlayContainer = voiceOverlayParts.overlay;

  if (!voiceOverlayContainer.shouldRender) return null;

  return (
    <ChatComposerVoiceOverlayContainer
      {...voiceOverlayContainer.props}
    >
      <ChatComposerVoiceOverlayCard
        {...voiceOverlayParts.card.props}
      >
        <ChatComposerVoiceOverlayLabel
          {...voiceOverlayParts.label.props}
        />
        {voiceOverlayParts.transcript.shouldRender ? (
          <ChatComposerVoiceOverlayTranscript
            {...voiceOverlayParts.transcript.props}
          />
        ) : null}
      </ChatComposerVoiceOverlayCard>
    </ChatComposerVoiceOverlayContainer>
  );
}

export function ChatComposerVoiceOverlayContainer({
  children,
  ...props
}: ChatComposerVoiceOverlayContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerVoiceOverlayCard({
  children,
  ...props
}: ChatComposerVoiceOverlayCardProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerVoiceOverlayLabel({
  text,
  ...props
}: ChatComposerVoiceOverlayLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatComposerVoiceOverlayTranscript({
  text,
  ...props
}: ChatComposerVoiceOverlayTranscriptProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatComposerHandsFreeControls({
  isVisible,
  status,
  controlState,
  onWake,
  onSleep,
  onResume,
  onPause,
  controlPressedOpacity,
  styles,
}: ChatComposerHandsFreeControlsProps) {
  const handsFreeControlsParts: ChatComposerHandsFreeControlsParts =
    createChatComposerHandsFreeControlsMobilePropsParts({
      isVisible,
      status,
      controlState,
      onWake,
      onSleep,
      onResume,
      onPause,
      controlPressedOpacity,
      styles,
    });
  const handsFreeStatusRow = handsFreeControlsParts.statusRow;
  const handsFreeControlsRow = handsFreeControlsParts.controlsRow;

  if (!handsFreeStatusRow.shouldRender && !handsFreeControlsRow.shouldRender) return null;

  return (
    <>
      {handsFreeStatusRow.shouldRender ? (
        <ChatComposerHandsFreeStatusRow
          {...handsFreeStatusRow.props}
        >
          <ChatComposerHandsFreeStatusRowContent {...handsFreeStatusRow.content} />
        </ChatComposerHandsFreeStatusRow>
      ) : null}
      {handsFreeControlsRow.shouldRender ? (
        <ChatComposerHandsFreeControlsRow
          {...handsFreeControlsRow.props}
        >
          <ChatComposerHandsFreeControlsRowContent {...handsFreeControlsRow.content} />
        </ChatComposerHandsFreeControlsRow>
      ) : null}
    </>
  );
}

export function ChatComposerHandsFreeStatusRow({
  children,
  ...props
}: ChatComposerHandsFreeStatusRowProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerHandsFreeStatusRowContent({
  status,
}: ChatComposerHandsFreeStatusRowContentProps) {
  return (
    <>
      {status.children}
    </>
  );
}

export function ChatComposerHandsFreeControlsRow({
  children,
  ...props
}: ChatComposerHandsFreeControlsRowProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatComposerHandsFreeControlsRowContent({
  primaryControl,
  secondaryControl,
}: ChatComposerHandsFreeControlsRowContentProps) {
  return (
    <>
      <ChatComposerHandsFreeControlButton
        {...primaryControl.touchable.props}
      >
        <ChatComposerHandsFreeControlLabel
          {...primaryControl.content.label.props}
        />
      </ChatComposerHandsFreeControlButton>
      <ChatComposerHandsFreeControlButton
        {...secondaryControl.touchable.props}
      >
        <ChatComposerHandsFreeControlLabel
          {...secondaryControl.content.label.props}
        />
      </ChatComposerHandsFreeControlButton>
    </>
  );
}

export function ChatComposerHandsFreeControlButton({
  children,
  ...props
}: ChatComposerHandsFreeControlButtonProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerHandsFreeControlLabel({
  text,
  ...props
}: ChatComposerHandsFreeControlLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatComposerIconButton({
  shouldRender = true,
  renderState,
  onPress,
  activeOpacity,
  style,
  activeStyle,
}: ChatComposerIconButtonProps) {
  const iconButtonParts: ChatComposerIconButtonParts =
    createChatComposerIconButtonMobilePropsParts({
      shouldRender,
      renderState,
      onPress,
      activeOpacity,
      style,
      activeStyle,
    });
  const iconButtonTouchable = iconButtonParts.touchable;

  if (!iconButtonTouchable.shouldRender) return null;

  return (
    <ChatComposerIconButtonTouchable
      {...iconButtonTouchable.props}
    >
      <ChatComposerIconButtonTouchableContent {...iconButtonTouchable.content} />
    </ChatComposerIconButtonTouchable>
  );
}

export function ChatComposerIconButtonTouchable({
  children,
  ...props
}: ChatComposerIconButtonTouchableProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerIconButtonTouchableContent({
  icon,
}: ChatComposerIconButtonTouchableContentProps) {
  return (
    <ChatComposerIconButtonIcon
      {...icon.props}
    />
  );
}

export function ChatComposerIconButtonIcon(props: ChatComposerIconButtonIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatComposerLabeledActionButton({
  shouldRender = true,
  renderState,
  onPress,
  activeOpacity,
  styles,
}: ChatComposerLabeledActionButtonProps) {
  const actionButtonParts: ChatComposerLabeledActionButtonParts =
    createChatComposerLabeledActionButtonMobilePropsParts({
      shouldRender,
      renderState,
      onPress,
      activeOpacity,
      styles,
    });
  const actionButtonTouchable = actionButtonParts.touchable;

  if (!actionButtonTouchable.shouldRender) return null;

  return (
    <ChatComposerLabeledActionButtonTouchable
      {...actionButtonTouchable.props}
    >
      <ChatComposerLabeledActionButtonTouchableContent {...actionButtonTouchable.content} />
    </ChatComposerLabeledActionButtonTouchable>
  );
}

export function ChatComposerLabeledActionButtonTouchable({
  children,
  ...props
}: ChatComposerLabeledActionButtonTouchableProps) {
  return (
    <TouchableOpacity {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function ChatComposerLabeledActionButtonTouchableContent({
  icon,
  label,
}: ChatComposerLabeledActionButtonTouchableContentProps) {
  return (
    <>
      <ChatComposerLabeledActionButtonIcon
        {...icon.props}
      />
      {label.shouldRender ? (
        <ChatComposerLabeledActionButtonLabel
          {...label.props}
        />
      ) : null}
    </>
  );
}

export function ChatComposerLabeledActionButtonIcon(props: ChatComposerLabeledActionButtonIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatComposerLabeledActionButtonLabel({
  text,
  ...props
}: ChatComposerLabeledActionButtonLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatComposerMicButton({
  renderState,
  onPressIn,
  onPressOut,
  onPress,
  webPressedStyle,
  styles,
}: ChatComposerMicButtonProps) {
  const micButtonParts: ChatComposerMicButtonParts =
    createChatComposerMicButtonMobilePropsParts({
      renderState,
      onPressIn,
      onPressOut,
      onPress,
      webPressedStyle,
      styles,
    });
  const micButtonPressable = micButtonParts.pressable;

  return (
    <ChatComposerMicButtonPressable
      {...micButtonPressable.props}
    >
      <ChatComposerMicButtonPressableContent {...micButtonPressable.content} />
    </ChatComposerMicButtonPressable>
  );
}

export function ChatComposerMicButtonPressable({
  children,
  ...props
}: ChatComposerMicButtonPressableProps) {
  return (
    <Pressable {...props}>
      {children}
    </Pressable>
  );
}

export function ChatComposerMicButtonPressableContent({
  icon,
  label,
}: ChatComposerMicButtonPressableContentProps) {
  return (
    <>
      <ChatComposerMicButtonIcon
        {...icon.props}
      />
      <ChatComposerMicButtonLabel
        {...label.props}
      />
    </>
  );
}

export function ChatComposerMicButtonIcon(props: ChatComposerMicButtonIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatComposerMicButtonLabel({
  text,
  ...props
}: ChatComposerMicButtonLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatComposerTextEntry({
  inputRef,
  value,
  onChangeText,
  onKeyPress,
  accessibilityLabel,
  accessibilityHint,
  placeholder,
  placeholderTextColor,
  voiceStatusLiveRegionAnnouncement,
  webAccessibility,
  styles,
}: ChatComposerTextEntryProps) {
  const textEntryParts: ChatComposerTextEntryParts =
    createChatComposerTextEntryMobilePropsParts({
      inputRef,
      value,
      onChangeText,
      onKeyPress,
      accessibilityLabel,
      accessibilityHint,
      placeholder,
      placeholderTextColor,
      voiceStatusLiveRegionAnnouncement,
      webAccessibility,
      styles,
    });
  const textEntryInput = textEntryParts.input;
  const textEntryInputDescription = textEntryParts.inputDescription;
  const textEntryVoiceStatusLiveRegion = textEntryParts.voiceStatusLiveRegion;

  return (
    <>
      <ChatComposerTextEntryInput
        {...textEntryInput.props}
      />
      {textEntryInputDescription.shouldRender ? (
        <ChatComposerTextEntryInputDescription
          {...textEntryInputDescription.props}
        />
      ) : null}
      {textEntryVoiceStatusLiveRegion.shouldRender ? (
        <ChatComposerTextEntryVoiceStatusLiveRegion
          {...textEntryVoiceStatusLiveRegion.props}
        />
      ) : null}
    </>
  );
}

export const ChatComposerTextEntryInput = forwardRef<TextInput, Omit<ChatComposerTextEntryInputProps, 'ref'>>(function ChatComposerTextEntryInput(props, ref) {
  return (
    <TextInput
      ref={ref}
      {...props}
    />
  );
});

export function ChatComposerTextEntryInputDescription({
  text,
  ...props
}: ChatComposerTextEntryInputDescriptionProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatComposerTextEntryVoiceStatusLiveRegion({
  text,
  ...props
}: ChatComposerTextEntryVoiceStatusLiveRegionProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageInlineActivity({
  renderState,
  spinnerSource,
  style,
  spinnerStyle,
}: ChatMessageInlineActivityProps) {
  const inlineActivityParts: ChatMessageInlineActivityParts =
    createChatRuntimeInlineActivityMobilePropsParts({
      renderState,
      spinnerSource,
      style,
      spinnerStyle,
    });

  if (!inlineActivityParts.container.shouldRender) return null;

  return (
    <ChatMessageInlineActivityContainer
      {...inlineActivityParts.container.props}
    >
      <ChatMessageInlineActivityContainerContent
        {...inlineActivityParts.container.content}
      />
    </ChatMessageInlineActivityContainer>
  );
}

export function ChatMessageInlineActivityContainer({
  children,
  ...props
}: ChatMessageInlineActivityContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageInlineActivityContainerContent({
  spinner,
}: ChatMessageInlineActivityContainerContentProps) {
  return (
    <ChatMessageInlineActivitySpinner
      {...spinner.props}
    />
  );
}

export function ChatMessageInlineActivitySpinner(props: ChatMessageInlineActivitySpinnerProps) {
  return (
    <Image {...props} />
  );
}

export function ChatMessageTurnDurationBadge({
  renderState,
  style,
  liveStyle,
  textStyle,
  liveTextStyle,
}: ChatMessageTurnDurationBadgeProps) {
  const turnDurationBadgeParts: ChatMessageTurnDurationBadgeParts =
    createChatRuntimeTurnDurationBadgeMobilePropsParts({
      renderState,
      style,
      liveStyle,
      textStyle,
      liveTextStyle,
    });

  if (!turnDurationBadgeParts.container.shouldRender) return null;

  return (
    <ChatMessageTurnDurationBadgeContainer
      {...turnDurationBadgeParts.container.props}
    >
      <ChatMessageTurnDurationBadgeContainerContent
        {...turnDurationBadgeParts.container.content}
      />
    </ChatMessageTurnDurationBadgeContainer>
  );
}

export function ChatMessageTurnDurationBadgeContainer({
  children,
  ...props
}: ChatMessageTurnDurationBadgeContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageTurnDurationBadgeContainerContent({
  icon,
  label,
}: ChatMessageTurnDurationBadgeContainerContentProps) {
  return (
    <>
      <ChatMessageTurnDurationBadgeIcon
        {...icon.props}
      />
      <ChatMessageTurnDurationBadgeLabel
        {...label.props}
      />
    </>
  );
}

export function ChatMessageTurnDurationBadgeIcon(props: ChatMessageTurnDurationBadgeIconProps) {
  return (
    <Ionicons {...props} />
  );
}

export function ChatMessageTurnDurationBadgeLabel({
  props,
  text,
}: ChatMessageTurnDurationBadgeLabelProps) {
  return (
    <Text {...props}>
      {text}
    </Text>
  );
}

export function ChatMessageExpandedContent({
  streamingRenderState,
  markdownContent,
  assetBaseUrl,
  assetAuthToken,
  spinnerSource,
  streamingStyles,
}: ChatMessageExpandedContentProps) {
  const expandedContentParts: ChatMessageExpandedContentParts =
    createChatRuntimeConversationExpandedContentMobilePropsParts({
      streamingRenderState,
      markdownContent,
      assetBaseUrl,
      assetAuthToken,
      spinnerSource,
      streamingStyles,
    });
  const expandedStreamingContent = expandedContentParts.streamingContent;

  if (!expandedStreamingContent.shouldRender) {
    return (
      <MarkdownRenderer
        content={expandedContentParts.markdown.content}
        assetBaseUrl={expandedContentParts.markdown.assetBaseUrl}
        assetAuthToken={expandedContentParts.markdown.assetAuthToken}
      />
    );
  }

  const expandedStreamingContentParts = expandedStreamingContent.content;

  return (
    <>
      <ChatMessageExpandedContentHeader
        header={expandedStreamingContentParts.header}
      />
      <ChatMessageExpandedContentBody
        body={expandedStreamingContentParts.body}
      />
    </>
  );
}

export function ChatMessageExpandedContentHeader({
  header,
}: ChatMessageExpandedContentHeaderProps) {
  return (
    <View {...header.props}>
      <ChatMessageExpandedContentHeaderContent
        {...header.content}
      />
    </View>
  );
}

export function ChatMessageExpandedContentHeaderContent({
  icon,
  title,
  spinner,
  badge,
}: ChatMessageExpandedContentHeaderContentProps) {
  return (
    <>
      <Ionicons {...icon.props} />
      <ChatMessageExpandedContentText part={title} />
      <Image {...spinner.props} />
      <View {...badge.props}>
        <ChatMessageExpandedContentBadgeContent
          {...badge.content}
        />
      </View>
    </>
  );
}

export function ChatMessageExpandedContentBadgeContent({
  label,
}: ChatMessageExpandedContentBadgeContentProps) {
  return (
    <ChatMessageExpandedContentText part={label} />
  );
}

export function ChatMessageExpandedContentBody({
  body,
}: ChatMessageExpandedContentBodyProps) {
  return (
    <View {...body.props}>
      <ChatMessageExpandedContentBodyContent
        {...body.content}
      />
    </View>
  );
}

export function ChatMessageExpandedContentBodyContent({
  text,
  caret,
}: ChatMessageExpandedContentBodyContentProps) {
  return (
    <>
      <ChatMessageExpandedContentText part={text} />
      <View {...caret.props} />
    </>
  );
}

export function ChatMessageExpandedContentText({
  part,
}: ChatMessageExpandedContentTextProps) {
  return (
    <Text {...part.props}>
      {part.text}
    </Text>
  );
}

export function ChatMessageCollapsedPreview({
  renderState,
  actionState,
  onPress,
  style,
  pressedStyle,
  textStyle,
}: ChatMessageCollapsedPreviewProps) {
  const collapsedPreviewParts: ChatMessageCollapsedPreviewParts =
    createChatRuntimeConversationCollapsedPreviewMobilePropsParts({
      renderState,
      actionState,
      onPress,
      style,
      pressedStyle,
      textStyle,
    });

  return (
    <Pressable
      {...collapsedPreviewParts.pressable.props}
    >
      <ChatMessageCollapsedPreviewContent
        {...collapsedPreviewParts.pressable.content}
      />
    </Pressable>
  );
}

export function ChatMessageCollapsedPreviewContent({
  text,
}: ChatMessageCollapsedPreviewContentProps) {
  return (
    <ChatMessageCollapsedPreviewText part={text} />
  );
}

export function ChatMessageCollapsedPreviewText({
  part,
}: ChatMessageCollapsedPreviewTextProps) {
  return (
    <Text {...part.props}>
      {part.text}
    </Text>
  );
}

export function ChatMessageConversationContent({
  contentDisplayMode,
  rowStyle,
  shouldRenderActionSlots,
  entries,
  expanded,
  collapsed,
}: ChatMessageConversationContentProps) {
  const conversationContentParts: ChatMessageConversationContentParts =
    createChatRuntimeConversationContentMobilePropsParts({
      contentDisplayMode,
      rowStyle,
      shouldRenderActionSlots,
      entries,
      expanded,
      collapsed,
    });

  if (conversationContentParts.expandedContent.shouldRender) {
    return (
      <ChatMessageContentRow
        {...conversationContentParts.expandedContent.props.row.props}
      >
        <ChatMessageExpandedContent
          {...conversationContentParts.expandedContent.props.content.props}
        />
      </ChatMessageContentRow>
    );
  }

  if (conversationContentParts.collapsedContent.shouldRender) {
    return (
      <ChatMessageContentRow
        {...conversationContentParts.collapsedContent.props.row.props}
      >
        <ChatMessageCollapsedPreview
          {...conversationContentParts.collapsedContent.props.preview.props}
        />
      </ChatMessageContentRow>
    );
  }

  return null;
}

export function ChatMessageContentRow({
  children,
  shouldRenderActionSlots,
  entries,
  rowStyle,
  bodyStyle,
}: ChatMessageContentRowProps) {
  const contentRowParts: ChatMessageContentRowParts =
    createChatRuntimeMessageContentRowMobilePropsParts({
      shouldRenderActionSlots,
      entries,
      rowStyle,
      bodyStyle,
    });

  return (
    <ChatMessageContentRowContainer
      {...contentRowParts.row.props}
    >
      {contentRowParts.body.shouldRender ? (
        <ChatMessageContentBody
          {...contentRowParts.body.props}
        >
          {children}
        </ChatMessageContentBody>
      ) : children}
      <ChatMessageActionSlotList
        {...contentRowParts.actionSlotList.props}
      />
    </ChatMessageContentRowContainer>
  );
}

export function ChatMessageContentRowContainer({
  children,
  ...props
}: ChatMessageContentRowContainerProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageContentBody({
  children,
  ...props
}: ChatMessageContentBodyProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}

export function ChatMessageStandaloneActions({
  shouldRender,
  entries,
  rowStyle,
}: ChatMessageStandaloneActionsProps) {
  const standaloneActionsParts: ChatMessageStandaloneActionsParts =
    createChatRuntimeMessageStandaloneActionsMobilePropsParts({
      shouldRender,
      entries,
      rowStyle,
    });

  return (
    <ChatMessageActionSlotList
      {...standaloneActionsParts.actionSlotList.props}
    />
  );
}

export function ChatMessageActionSlotList({
  shouldRender = true,
  entries,
  rowStyle,
}: ChatMessageActionSlotListProps) {
  const actionSlotListParts: ChatMessageActionSlotListParts =
    createChatRuntimeMessageActionSlotListMobilePropsParts({
      shouldRender,
      entries,
      rowStyle,
    });
  const actionSlotList = actionSlotListParts.list;

  if (!actionSlotList.shouldRender) return null;

  const content = actionSlotList.content.items.map(({ key, item }) => (
    <Fragment key={key}>
      {item}
    </Fragment>
  ));

  if (actionSlotListParts.row.shouldRender) {
    return (
      <ChatMessageActionSlotListRow
        {...actionSlotListParts.row.props}
      >
        {content}
      </ChatMessageActionSlotListRow>
    );
  }

  return <>{content}</>;
}

export function ChatMessageActionSlotListRow({
  children,
  ...props
}: ChatMessageActionSlotListRowProps) {
  return (
    <View {...props}>
      {children}
    </View>
  );
}
