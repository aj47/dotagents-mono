import { describe, expect, it } from "vitest"

import {
  CHAT_COMPOSER_PRESENTATION,
  CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS,
  CHAT_COMPOSER_SURFACE_PRESENTATION,
  CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION,
  CHAT_RUNTIME_SURFACE_PRESENTATION,
  CHAT_SESSION_STATUS_SURFACE_PRESENTATION,
  CHAT_RUNTIME_PRESENTATION,
  TOOL_APPROVAL_SURFACE_PRESENTATION,
  appendChatMessageRuntimeAssistantDebugErrorMessage,
  appendChatMessageRuntimePendingTurnMessages,
  applyChatMessageRuntimeBlockedTurnStatusState,
  applyChatMessageRuntimeCompletedTurnStatusState,
  applyChatMessageRuntimeAutoExpansionState,
  applyChatMessageRuntimePendingTurnStatusState,
  applyChatMessageRuntimeProgressTurnStatusState,
  applyChatMessageRuntimeSettledTurnStatusState,
  applyChatMessageRuntimeToolActivityGroupExpansionInheritance,
  createChatSessionStatusMobileChromeStyleSlots,
  createChatMessageRuntimeActivityMessage,
  createChatMessageRuntimeAssistantFeedbackMessage,
  createChatMessageRuntimeAssistantDebugErrorMessage,
  createChatMessageRuntimeAssistantErrorMessage,
  createChatMessageRuntimeAssistantErrorTurnState,
  createChatMessageRuntimeAssistantPlaceholderMessage,
  createChatMessageRuntimeAssistantTextMessage,
  createChatMessageRuntimeCompletedConversationState,
  createChatMessageRuntimeCompletedTextTurnMessages,
  createChatMessageRuntimeCompletedTurnMessages,
  createChatMessageRuntimeConnectionErrorTurnState,
  createChatMessageConversationThreadStyleSlots,
  createChatMessageConversationThreadStyleSlotsFromStyleSource,
  computeChatMessageRuntimeTurnDurations,
  createChatMessageRuntimeFinalHistoryTurnMessages,
  createChatMessageRuntimeFinalResponseTurnState,
  createChatMessageRuntimeFinalResponseTextState,
  createChatMessageRuntimeHistoryDisplayMessage,
  createChatMessageRuntimeHistoryDisplayMessages,
  createChatMessageRuntimeLogMeta,
  createChatMessageRuntimeModelMessages,
  createChatMessageRuntimePendingTurnState,
  createChatMessageRuntimePendingTurnStatusState,
  createChatMessageRuntimeProgressMessages,
  createChatMessageRuntimeProgressResponseState,
  createChatMessageRuntimeProgressTurnState,
  createChatMessageRuntimeQueuedErrorState,
  createChatMessageRuntimeRecoveredHistoryMessages,
  createChatMessageRuntimeRecoverableHistoryMessages,
  createChatMessageRuntimeResponseHistoryEvents,
  createChatMessageRuntimeRetryMessage,
  createChatMessageRuntimeSessionDisplayMessages,
  createChatMessageRuntimeStreamingText,
  createChatMessageRuntimeStreamingTurnState,
  createChatMessageRuntimeToolApprovalRequiredMessage,
  createChatMessageRuntimeToolActivityGroups,
  createChatMessageRuntimeTurnDurationMessages,
  createChatMessageRuntimeUserResponseMessages,
  createChatMessageRuntimeUserTextMessage,
  createChatMessageActionStyleSlots,
  createChatMessageThreadBodyStyleSlots,
  createChatComposerStyleSlots,
  createChatComposerStyleSlotsFromStyleSource,
  getChatMessageActionMobileButtonStatesBySlot,
  createChatComposerHandsFreeControlsMobilePropsParts,
  createChatComposerIconButtonMobilePropsParts,
  createChatComposerInputDockMobilePropsParts,
  createChatComposerLabeledActionButtonMobilePropsParts,
  createChatComposerMicButtonMobilePropsParts,
  createChatComposerPendingImagesRailMobilePropsParts,
  createChatComposerSpeechPreviewMobilePropsParts,
  createChatComposerTextEntryMobilePropsParts,
  createChatComposerVoiceOverlayMobilePropsParts,
  createChatComposerRuntimeDockMobileChromeProps,
  createChatComposerRuntimeDockMobileProps,
  createChatComposerRuntimeDockMobilePropsParts,
  createChatComposerRuntimeDockStyleSlots,
  createChatMessageConnectionBannerStyleSlots,
  createChatMessageConversationDockStyleSlots,
  createChatMessageConversationDockStyleSlotsFromStyleSource,
  createChatMessageConversationViewportStyleSlots,
  createChatMessageConversationViewportStyleSlotsFromStyleSource,
  createChatMessageRuntimeDockStyleSlots,
  createChatMessageRuntimeThreadStyleSlots,
  createChatMessageToolActivityGroupBoundaryStyles,
  createChatMessageToolActivityGroupThreadSurfaceStyleSlots,
  createChatMessageRuntimeSurfaceStyleSlots,
  createChatMessageRuntimeViewportStyleSlots,
  createChatMessageRuntimeChromeSlots,
  createChatMessageRuntimeChromeStyleSlots,
  createChatMessageRuntimeSurfaceChromeSlots,
  createChatRuntimeChromeSlots,
  createChatRuntimeMobileChromeSlotsFromStyleSource,
  createChatRuntimeConversationMobileStyleSlots,
  createChatRuntimeConnectionBannerMobileStyleSlots,
  createChatRuntimeDelegationCardMobilePropsParts,
  createChatRuntimeDelegationCardMobileStyleSlots,
  createChatRuntimeDelegationCardMobileProps,
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
  createChatRuntimeConversationRuntimeThreadListMobilePropsParts,
  createChatRuntimeConversationRuntimeThreadMobilePropsParts,
  createChatRuntimeConversationDockMobilePropsParts,
  createChatRuntimeConversationSurfaceMobilePropsParts,
  createChatRuntimeConversationViewportMobilePropsParts,
  createChatRuntimeConversationRetryStatusMobileProps,
  createChatRuntimeConversationToolApprovalMobileProps,
  createChatRuntimeToolApprovalMobilePropsParts,
  createChatRuntimeConversationToolExecutionStackMobileProps,
  createChatRuntimeConversationBodyMobileProps,
  createChatRuntimeConversationBodyPanelMobilePropsParts,
  createChatRuntimeConversationThreadBodyStatusPanelMobilePropsParts,
  createChatRuntimeConversationThreadBodyMobilePropsParts,
  createChatRuntimeConversationThreadBodyMobileProps,
  createChatRuntimeConversationThreadBodyMobilePropsFromActionInput,
  createChatRuntimeConversationScrollViewportMobilePropsParts,
  createChatRuntimeConversationDockShellMobilePropsParts,
  createChatRuntimeConversationViewportContentMobilePropsParts,
  createChatRuntimeToolActivityGroupBoundaryMobilePropsParts,
  createChatRuntimeToolActivityGroupFooterMobilePropsParts,
  createChatRuntimeToolActivityGroupThreadSurfaceMobilePropsParts,
  createChatRuntimeToolActivityGroupToggleMobilePropsParts,
  createChatRuntimeDockChromeMobileProps,
  createChatRuntimeToolExecutionErrorBlockMobilePropsParts,
  createChatRuntimeToolExecutionPanelMobilePropsParts,
  createChatRuntimeToolExecutionPanelShellMobilePropsParts,
  createChatRuntimeCompletedDebugState,
  createChatRuntimeHeaderChromeSlots,
  createChatRuntimeHeaderStyleSlots,
  createChatRuntimeHeaderStyleSlotsFromStyleSource,
  createChatRuntimeAgentSelectorMobileStyleSlots,
  createChatRuntimeHeaderActionsRowMobileStyleSlot,
  createChatRuntimeHeaderIconContainerMobileStyleSlot,
  createChatRuntimeHeaderIconContainerMobileStyleSlots,
  createChatRuntimeHeaderMobileStyleSlots,
  createChatRuntimeMobileSafeAreaStyleSlots,
  createChatRuntimeSafeAreaMergedStyleSlots,
  createChatRuntimeHeaderPinButtonMobileStyleSlot,
  createChatRuntimeHeaderPinButtonMobileStyleSlots,
  createChatRuntimeNoSessionAvailableDebugState,
  createChatRuntimeProcessingQueuedMessageDebugState,
  createChatRuntimeRequestSentDebugState,
  createChatRuntimeRequestSupersededQueueFailureState,
  createChatRuntimeSessionChangedDuringProcessingQueueFailureState,
  createChatRuntimeStartingRequestDebugState,
  createChatRuntimeLoadingStateMobilePropsParts,
  createChatRuntimeDebugPanelStackMobilePropsParts,
  createChatRuntimeInlineActivityMobilePropsParts,
  createChatRuntimeConnectionBannerMobilePropsParts,
  createChatRuntimeRetryStatusMobilePropsParts,
  createChatRuntimeConversationFrameMobilePropsParts,
  createChatRuntimeConversationOverlaysMobilePropsParts,
  createChatRuntimeTurnDurationBadgeMobilePropsParts,
  createChatRuntimeConversationContentMobilePropsParts,
  createChatRuntimeConversationExpandedContentMobilePropsParts,
  createChatRuntimeConversationCollapsedPreviewMobilePropsParts,
  createChatRuntimeStepSummaryCardMobilePropsParts,
  createChatRuntimeRetryStatusMobileStyleSlots,
  createChatRuntimeScrollToBottomButtonMobilePropsParts,
  createChatRuntimeScrollToBottomMobileStyleSlots,
  createChatRuntimeStepSummaryMobileStyleSlots,
  createChatRuntimeStreamingContentMobileStyleSlots,
  createChatRuntimeSurfaceChromeMobileProps,
  createChatRuntimeToolActivityGroupMobileStyleSlots,
  createChatRuntimeToolApprovalMobileStyleSlots,
  createChatRuntimeToolExecutionCompactMobileStyleSlots,
  createChatRuntimeThreadMobileStyleSlots,
  createChatRuntimeToolExecutionCallDetailMobilePropsParts,
  createChatRuntimeToolExecutionCallListMobilePropsParts,
  createChatRuntimeToolExecutionCollapseControlMobilePropsParts,
  createChatRuntimeToolExecutionCompactGroupMobilePropsParts,
  createChatRuntimeToolExecutionCompactListMobilePropsParts,
  createChatRuntimeToolExecutionCompactRowMobilePropsParts,
  createChatRuntimeToolExecutionCopyButtonMobilePropsParts,
  createChatRuntimeToolExecutionDetailHeaderMobilePropsParts,
  createChatRuntimeToolExecutionCallSectionMobilePropsParts,
  createChatRuntimeToolExecutionDetailMobileStyleSlots,
  createChatRuntimeToolExecutionEmptyStateMobilePropsParts,
  createChatRuntimeToolExecutionExpandedGroupCollapseControlMobileStyleSlots,
  createChatRuntimeToolExecutionExpandedGroupMobilePropsParts,
  createChatRuntimeToolExecutionPayloadBlockMobilePropsParts,
  createChatRuntimeToolExecutionPayloadMetaMobilePropsParts,
  createChatRuntimeToolExecutionPayloadSectionMobilePropsParts,
  createChatRuntimeToolExecutionPendingResultMobilePropsParts,
  createChatRuntimeToolExecutionResultBadgeMobilePropsParts,
  createChatRuntimeToolExecutionResultHeaderMobilePropsParts,
  createChatRuntimeToolExecutionResultSectionMobilePropsParts,
  createChatRuntimeToolExecutionStackPanelMobilePropsParts,
  createChatRuntimeViewportChromeMobileProps,
  createChatRuntimeViewportActivityMobileStyleSlots,
  createChatRuntimeViewportChromeMobileStyleSlots,
  createChatRuntimeViewportMobileStyleSlots,
  createChatComposerRuntimeImagePickerLaunchOptions,
  createChatComposerImageAttachmentMobileStyleSlots,
  createChatRuntimeMessageActionMobileStyleSlots,
  createChatRuntimeMessageActionButtonMobileStyleSlots,
  createChatRuntimeMessageActionRowMobileStyleSlot,
  createChatRuntimeMessageMobileStyleSlots,
  createChatRuntimeTurnDurationHeaderMobileStyleSlotVariants,
  createChatRuntimeTurnDurationHeaderMobileStyleSlots,
  createChatRuntimeTurnDurationMessageMobileStyleSlotVariants,
  createChatRuntimeTurnDurationMessageMobileStyleSlots,
  createChatRuntimeThemeSpinnerSource,
  createMessageQueuePanelMobileWrapperStyleSlots,
  deriveAttentionState,
  deriveLifecycleState,
  formatChatRuntimeActivityContent,
  formatChatRuntimeAgentSelectorAccessibilityLabel,
  formatChatRuntimeAgentSelectorLabel,
  formatChatRuntimeAssistantErrorContent,
  formatChatRuntimeAssistantFeedbackContent,
  formatChatRuntimeBranchAccessibilityLabel,
  formatChatRuntimeConnectionErrorMessage,
  formatChatRuntimeConversationHistorySummary,
  formatChatRuntimeDebugError,
  formatChatRuntimeDelegationAccessibilityLabel,
  formatChatRuntimeEarlierDelegationMessagesLabel,
  formatChatRuntimeDelegationMessageCount,
  formatChatRuntimeDelegationMessagesLabel,
  formatChatRuntimeDelegationMoreToolActivityLabel,
  formatChatRuntimeDelegationToolCallActivityLabel,
  formatChatRuntimeDelegationToolActivityLabel,
  formatChatRuntimeLoadEarlierLabel,
  formatChatRuntimeModelPickerTitle,
  formatChatRuntimeRetryAccessibilityLabel,
  formatChatRuntimeRetryAttemptLabel,
  formatChatRuntimeRetryCountdownLabel,
  formatChatRuntimeThinkingPickerTitle,
  formatChatRuntimeStepSummaryAccessibilityLabel,
  formatChatRuntimeStepSummaryKeyFindingsLabel,
  formatChatRuntimeStepSummaryMeta,
  formatChatRuntimeStepSummaryPreview,
  formatChatRuntimeStepSummaryStepLabel,
  formatChatRuntimeStepSummaryTitle,
  formatChatRuntimeStartingRequestDebugMessage,
  formatChatRuntimeToolApprovalRequiredContent,
  formatChatRuntimeTurnDurationAccessibilityLabel,
  formatChatRuntimeToolApprovalFailureMessage,
  formatChatRuntimeVerbosityPickerTitle,
  formatChatRuntimeVisibleUpdatesSummary,
  formatChatRuntimeWebConfirmMessage,
  getChatComposerCopyState,
  getChatComposerDesktopSurfaceState,
  getChatComposerEditBeforeSendMobileIconState,
  getChatComposerEditBeforeSendMobileRenderState,
  getChatComposerImageAttachmentMobileIconState,
  getChatComposerImageAttachmentMobileRenderState,
  getChatComposerMicMobileActionState,
  getChatComposerMicMobileIconState,
  getChatComposerMicMobileRenderState,
  getChatComposerMicMobileWebPressStyleState,
  getChatComposerMobileActionAvailabilityRenderState,
  getChatComposerMobileControlState,
  getChatComposerMobileIconColors,
  getChatComposerMobileSurfaceRenderState,
  getChatComposerMobileSurfaceState,
  getChatComposerMobileSurfaceColors,
  getChatComposerMobileTextColors,
  getChatComposerMobileTextInputPlatformState,
  getChatComposerMobileVisibilityRenderState,
  getChatComposerQueueMobileActionState,
  getChatComposerQueueMobileIconState,
  getChatComposerQueueMobileRenderState,
  getChatComposerRuntimeChromeMobileStyleRenderState,
  getChatComposerRuntimeBase64ImageBytes,
  getChatComposerRuntimeControlMobileRenderState,
  createChatComposerRuntimeChromeMobileStyleSlots,
  createChatComposerHandsFreeMobileStyleSlots,
  getChatComposerRuntimeDraftMessageState,
  createChatComposerRuntimeHandsFreePermissionDeniedDebugState,
  createChatComposerRuntimeHandsFreeRecognizerErrorDebugState,
  createChatComposerRuntimeHandsFreeTranscriptAddedDebugState,
  createChatConversationHomePromptEditorModalStyleSlots,
  createChatConversationHomePromptEditorModalStyleSlotsFromStyleSource,
  createChatConversationHomePromptEditorMobileStyleSlots,
  createChatConversationHomePromptEditorModalMobilePropsParts,
  createChatConversationHomePromptLibraryMobileStyleSlots,
  formatChatComposerRuntimeHandsFreeSleepingDebugMessage,
  getChatComposerRuntimeFollowUpPresentationState,
  getChatComposerRuntimeHandsFreeDebugMessage,
  getChatComposerRuntimeHandsFreeControlsMobileRenderState,
  getChatComposerRuntimeTextEntryMobileRenderState,
  getChatComposerRuntimeImageDataUrlBytes,
  getChatComposerRuntimeDockMobileRenderState,
  createChatComposerMobileStyleSlots,
  getChatComposerSubmitMobileActionState,
  getChatComposerSubmitMobileIconState,
  getChatComposerSubmitMobileRenderState,
  getChatComposerTextToSpeechMobileIconState,
  getChatComposerTextToSpeechMobileRenderState,
  inferChatComposerRuntimeImageMimeType,
  getChatMessageCopyFailureAlertState,
  getChatMessageCopyFeedbackResetDelayMs,
  getChatMessageCopyFeedbackState,
  getChatMessageToolExecutionCopyFailureResolvedAlertState,
  createChatConversationHomePromptEditorSaveActionState,
  getChatConversationHomePromptDeleteConfirmAlertState,
  getChatConversationHomePromptDeleteFailedAlertState,
  getChatConversationHomePromptEditorDismissActionState,
  getChatConversationHomePromptEditorTitle,
  getChatConversationHomePromptSaveFailedAlertState,
  getChatConversationHomePromptSaveSuccessAlertState,
  getChatConversationHomePromptTaskRunFailedAlertState,
  getChatConversationHomePromptTaskStartedAlertState,
  getChatRuntimeCopyState,
  getChatRuntimeCurrentAgentLabel,
  getChatRuntimePrimaryAgentLabel,
  getChatRuntimeAgentSelectorMobileActionState,
  getChatRuntimeAgentSelectorMobileColors,
  getChatRuntimeAgentSelectorMobileIconState,
  getChatRuntimeAgentSelectorMobileRenderState,
  getChatRuntimeAgentSelectorAccessibilityHint,
  getChatRuntimeDebugState,
  getChatRuntimeBackMobileActionState,
  getChatRuntimeBackMobileColors,
  getChatRuntimeBackMobileIconState,
  getChatRuntimeBackMobileRenderState,
  getChatRuntimeConnectionBannerMobileColors,
  getChatRuntimeBranchActionAccessibilityLabel,
  getChatRuntimeBranchActionState,
  getChatRuntimeBranchActionTitle,
  getChatRuntimeBranchMobileAlertState,
  getChatRuntimeBranchMobileIconState,
  getChatRuntimeBranchMobileRenderState,
  getChatRuntimeConnectionBannerMobileState,
  getChatRuntimeConnectionBannerMobileRenderState,
  getChatRuntimeConnectionBannerFailedMobileIconState,
  getChatRuntimeConversationActionSetMobileState,
  getChatRuntimeBranchCreatedMobileResolvedAlertState,
  getChatRuntimeBranchFailedMobileResolvedAlertState,
  getChatRuntimeBranchUnavailableMobileResolvedAlertState,
  getChatRuntimeConversationContentMobileState,
  getChatRuntimeConversationItemThreadMobileState,
  getChatRuntimeConversationItemThreadMobileStateFromBodyInput,
  getChatRuntimeConversationMessageActionsMobileRenderState,
  getChatRuntimeConversationMessageRuntimeThreadState,
  getChatRuntimeConversationMessageRenderContextMobileState,
  getChatRuntimeConversationMessageThreadMobileState,
  getChatRuntimeConversationMessageThreadMobileStateFromBodyInput,
  getChatRuntimeConversationMessageMobileRenderState,
  getChatRuntimeConversationRuntimeThreadListMobileState,
  getChatRuntimeConversationRuntimeThreadState,
  getChatRuntimeConversationDelegationCardMobileState,
  getChatRuntimeConversationRetryStatusMobileState,
  getChatRuntimeConversationThreadListMobileState,
  getChatRuntimeConversationThreadBodyMobileDisplayMode,
  getChatRuntimeConversationThreadBodyMobileState,
  getChatRuntimeConversationToolApprovalMobileState,
  getChatRuntimeConversationToolExecutionStackMobileState,
  getChatRuntimeConversationTurnDurationMobileState,
  getChatRuntimeConversationToolActivityGroupRenderState,
  getChatRuntimeConversationToolActivityGroupRuntimeThreadState,
  getChatRuntimeConversationToolActivityGroupThreadRenderState,
  getChatRuntimeConversationToolActivityGroupThreadState,
  getChatRuntimeConversationChromeMobileStyleRenderState,
  getChatRuntimeDelegationCardMobileColors,
  getChatRuntimeDelegationCardMobilePresentationState,
  getChatRuntimeDelegationCardMobileRenderState,
  getChatRuntimeDelegationCardMobileState,
  getChatRuntimeDelegationConversationPreviewMoreActionState,
  getChatRuntimeDelegationConversationPreviewRoleMobileColors,
  getChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots,
  getChatRuntimeDelegationConversationPreviewRoleMobileStyleState,
  getChatRuntimeDelegationStatusDesktopClassNames,
  getChatRuntimeDelegationToolPreviewMoreActionState,
  getChatRuntimeDelegationToolPreviewRowsMobileRenderState,
  getChatRuntimeDesktopSurfaceState,
  getChatRuntimeDockChromeMobileRenderState,
  isChatRuntimeBranchableMessageRole,
  getChatComposerVoiceOverlayLabel,
  getChatRuntimeDebugPanelsMobileDisplayState,
  getChatRuntimeDebugPanelsMobileRenderState,
  getChatRuntimeDebugMessage,
  getChatRuntimeDelegationStatusMobileColors,
  getChatRuntimeDelegationStatusMobileRenderState,
  getChatRuntimeHandsFreeAccessibilityHint,
  getChatRuntimeHandsFreeAccessibilityLabel,
  getChatRuntimeHandsFreeMobileActionState,
  getChatRuntimeHandsFreeMobileColors,
  getChatRuntimeHandsFreeMobileIconState,
  getChatRuntimeHandsFreeMobileRenderState,
  getChatRuntimeHeaderChromeMobileStyleRenderState,
  getChatRuntimeHeaderMobileSurfaceState,
  getChatRuntimeHeaderMobileStyleRenderState,
  getChatRuntimeHomeQuickStartEmptyMobileRenderState,
  getChatRuntimeHomeQuickStartItemsMobileState,
  getChatRuntimeHomeQuickStartItemMobileRenderState,
  getChatRuntimeHomeQuickStartPressIntent,
  getChatRuntimeHomeQuickStartsMobileRenderState,
  createChatRuntimeHomeQuickStartsMobilePropsParts,
  getChatRuntimeInlineActivityMobileIndicatorState,
  getChatRuntimeInlineActivityMobileRenderState,
  getChatRuntimeInlineActivityMobileState,
  getChatRuntimeKillSwitchConfirmationMobileResolvedAlertState,
  getChatRuntimeKillSwitchConnectionFailedMobileResolvedAlertState,
  getChatRuntimeKillSwitchMobileActionState,
  getChatRuntimeKillSwitchMobileAlertState,
  getChatRuntimeKillSwitchMobileColors,
  getChatRuntimeKillSwitchMobileIconState,
  getChatRuntimeKillSwitchMobileRenderState,
  getChatRuntimeKillSwitchMobileVisibilityRenderState,
  getChatRuntimeKillSwitchResultMobileResolvedAlertState,
  getChatRuntimeLatestStepSummary,
  getChatRuntimeLoadingStateMobileRenderState,
  getChatRuntimeLoadingStateMobileState,
  getChatRuntimeMessageHistoryBannerMobileColors,
  getChatRuntimeMessageHistoryBannerMobileRenderState,
  getChatRuntimeMessageHistoryBannerMobileState,
  getChatRuntimeMessageHistoryLoadEarlierMobileIconState,
  getChatRuntimeMessageHistoryWindowMobileClampedVisibleCount,
  getChatRuntimeMessageHistoryWindowMobileDisplayState,
  getChatRuntimeMessageHistoryWindowMobileExpandedVisibleCount,
  getChatRuntimeMessageHistoryWindowMobileIsAtBottom,
  getChatRuntimeMessageHistoryWindowMobileShouldLoadEarlier,
  getChatRuntimeMessageHistoryWindowMobileState,
  getChatRuntimeMessageHistoryBannerState,
  createChatRuntimeMessageHistoryBannerMobilePropsParts,
  createChatRuntimeMessageHistoryBannerMobileStyleSlots,
  createChatRuntimeMobileChromeStyleSlots,
  getChatRuntimeMobileChromeStyleRenderState,
  getChatRuntimeMobileSafeAreaLayoutState,
  getChatRuntimeMobileActivityAccessibilityState,
  getChatRuntimeMessageThreadPresentationMobileRenderState,
  getChatRuntimeNavigationHeaderMobileRenderState,
  createChatRuntimeHeaderAgentSelectorMobilePropsParts,
  createChatRuntimeHeaderConversationStatusMobilePropsParts,
  createChatRuntimeHeaderIconButtonMobilePropsParts,
  createChatRuntimeHeaderTurnDurationMobilePropsParts,
  createChatRuntimeNavigationHeaderOptionsParts,
  createChatRuntimeNavigationHeaderOptionsMobilePropsParts,
  getChatRuntimePinAccessibilityHint,
  getChatRuntimePinAccessibilityLabel,
  getChatRuntimePinDisplayLabel,
  getChatRuntimePinMobileActionState,
  getChatRuntimePinMobileColors,
  getChatRuntimePinMobileIconState,
  getChatRuntimePinMobileRenderState,
  getChatRuntimeRetryStatusState,
  getChatRuntimeRetryStatusMobileColors,
  getChatRuntimeRetryStatusMobileState,
  getChatRuntimeRetryStatusMobileIconState,
  getChatRuntimeRetryStatusMobileRenderState,
  getChatRuntimeScrollToBottomMobileButtonState,
  getChatRuntimeScrollToBottomMobileColors,
  getChatRuntimeScrollToBottomMobileIconState,
  getChatRuntimeScrollToBottomMobileRenderState,
  getChatRuntimeStepSummaryMobileColors,
  getChatRuntimeStepSummaryMobileRenderState,
  getChatRuntimeStepSummaryMobileState,
  getChatRuntimeStepSummaryState,
  getChatRuntimeStreamingContentMobileColors,
  getChatRuntimeStreamingContentMobileRenderState,
  getChatRuntimeStreamingContentMobileState,
  getChatRuntimeStreamingContentMobileIconState,
  getChatRuntimeStreamingContentState,
  getChatRuntimeStreamingContentTitle,
  getChatRuntimeSurfaceChromeMobileRenderState,
  getChatRuntimeToolApprovalActionMobileIconColors,
  getChatRuntimeToolApprovalActionMobileIconState,
  getChatRuntimeToolApprovalAccessibilityLabel,
  getChatRuntimeToolApprovalArgumentsAccessibilityLabel,
  getChatRuntimeToolApprovalArgumentsToggleMobileIconColors,
  getChatRuntimeToolApprovalArgumentsToggleMobileIconState,
  getChatRuntimeToolApprovalButtonSpinnerMobileColors,
  getChatRuntimeToolApprovalDesktopSurfaceState,
  getChatRuntimeToolApprovalHeaderMobileIconColors,
  getChatRuntimeToolApprovalHeaderMobileIconState,
  getChatRuntimeToolApprovalInteractionState,
  getChatRuntimeToolApprovalCardMobileRenderState,
  getChatRuntimeToolApprovalConnectionRequiredMobileResolvedAlertState,
  getChatRuntimeToolApprovalFailedMobileResolvedAlertState,
  getChatRuntimeToolApprovalMobileAlertState,
  getChatRuntimeToolApprovalMobileRenderState,
  getChatRuntimeToolApprovalMobileSurfaceColors,
  getChatRuntimeToolApprovalMobileSurfaceState,
  getChatRuntimeToolApprovalSpinnerMobileColors,
  getChatRuntimeToolApprovalUnavailableMobileResolvedAlertState,
  getChatRuntimeThreadChromeMobileStyleRenderState,
  getChatRuntimeDelegationToolPreviewMobileVisibilityRenderState,
  getChatRuntimeToolExecutionCompactPreviewMobileRowState,
  getChatRuntimeToolExecutionDetailMobileRowState,
  getChatRuntimeToolExecutionResultOnlyFallbackLabel,
  getChatRuntimeToolExecutionResultOnlyFallbackRenderState,
  getChatRuntimeToolExecutionStackMobileRenderState,
  getChatRuntimeTurnDurationBadgeState,
  getChatRuntimeTurnDurationHeaderMobileBadgeColors,
  getChatRuntimeTurnDurationHeaderMobileBadgeState,
  getChatRuntimeTurnDurationHeaderMobileRenderState,
  getChatRuntimeMessageThreadMobileStyleRenderState,
  getChatRuntimeTurnDurationMessageMobileRenderState,
  getChatRuntimeTurnDurationMobileIconState,
  getChatRuntimeTurnDurationTitle,
  getChatRuntimeViewportAffordanceMobileRenderState,
  getChatRuntimeViewportChromeMobileRenderState,
  getChatRuntimeViewportContentMobileRenderState,
  getChatRuntimeViewportMobileColors,
  getChatRuntimeViewportMobileKeyboardAvoidingBehavior,
  getChatRuntimeViewportMobileRenderState,
  getChatRuntimeViewportMobileState,
  getChatRuntimeAlertMessage,
  getChatMessageRuntimeNextResponseEventOrdinal,
  findChatMessageRuntimeLastUserMessageIndex,
  hasChatMessageRuntimeAssistantContentAfter,
  hasChatMessageRuntimeLiveAgentTurn,
  hasChatMessageRuntimeMessagesAfter,
  hasChatMessageRuntimeRequestSessionChanged,
  isLastChatMessageRuntimeConversationContent,
  isChatMessageRuntimeActiveRequest,
  isChatMessageRuntimeLatestSessionRequest,
  mergeChatComposerRuntimeVoiceText,
  mergeChatMessageRuntimeFinalTurnMessagesWithProgress,
  mergeChatMessageRuntimeToolResultsIntoLastMessage,
  preserveChatMessageRuntimeDisplayContentFromProgress,
  removeChatMessageRuntimePendingTurnMessages,
  removeChatMessageRuntimeToolApprovalMessage,
  resolveChatRuntimeMobileFontFamily,
  sortChatMessageRuntimeResponseEvents,
  toggleChatMessageRuntimeMessageExpansionState,
  toggleChatMessageRuntimeToolActivityGroupExpansionState,
  toggleChatMessageRuntimeToolApprovalExpansionState,
  toggleChatMessageRuntimeToolCallExpansionState,
  replaceChatMessageRuntimeFinalTurnMessages,
  replaceChatMessageRuntimeTurnMessages,
  shouldSkipChatMessageRuntimeSyntheticToolSummary,
  updateLastChatMessageRuntimeAssistantErrorMessage,
  updateLastChatMessageRuntimeConversationContent,
  getChatSessionStatusMobileStyleState,
  getFollowUpInputPresentation,
  getSessionStatusMobileColors,
  getSessionStatusDesktopRenderState,
  getSessionStatusDesktopSurfaceState,
  getSessionStatusMobileRenderState,
  getSessionStatusMobileStyleRenderState,
  getSessionStatusMobileSurfaceState,
  getSessionPresentation,
  getSidebarStatusPresentation,
  shouldRenderChatRuntimeConversationThread,
  shouldRenderChatRuntimeActivityStep,
} from "./session-presentation"
import { HANDS_FREE_COMPOSER_PRESENTATION } from "./hands-free-controller"
import {
  CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION,
  getChatMessageActionMobileTurnDurationBadgeColors,
  getChatMessageActionMobileTurnDurationBadgeState,
} from "./message-display-utils"
import type {
  ToolActivityGroup,
  ToolActivityGroupMobileRenderState,
} from "./tool-activity-grouping"

describe("session presentation semantics", () => {
  it("keeps snoozed repeat tasks running and labels them as background work", () => {
    const presentation = getSessionPresentation({
      conversationState: "running",
      isComplete: false,
      isSnoozed: true,
      sessionStatus: "active",
    })
    const sidebar = getSidebarStatusPresentation({
      conversationState: "running",
      isSnoozed: true,
      sessionStatus: "active",
    })
    const input = getFollowUpInputPresentation({
      conversationState: "running",
      isSnoozed: true,
      sessionStatus: "active",
      isQueueEnabled: true,
    })

    expect(presentation.lifecycleState).toBe("running")
    expect(presentation.attentionState).toBe("background")
    expect(presentation.label).toBe("Running in background")
    expect(sidebar.railClassName).toBe("bg-muted-foreground/60")
    expect(sidebar.shouldPulse).toBe(false)
    expect(input.mode).toBe("queue")
    expect(input.placeholder).toBe("Queue next message...")
    expect(input.submitHint).toBe("Adds your message to the queue for this conversation.")
  })

  it("prioritizes pending approval and blocked state above running/background", () => {
    expect(deriveLifecycleState({ conversationState: "running", pendingToolApproval: { id: "approval" } })).toBe("needs_input")
    expect(deriveLifecycleState({ conversationState: "running", hasErrors: true })).toBe("blocked")
    expect(getSidebarStatusPresentation({ pendingToolApproval: true }).railClassName).toBe("bg-amber-500")
    expect(getSidebarStatusPresentation({ wasStopped: true }).railClassName).toBe("bg-red-500")
  })

  it("derives composer modes from lifecycle and queue availability", () => {
    expect(getFollowUpInputPresentation({ isInitializingSession: true }).mode).toBe("initializing")
    expect(getFollowUpInputPresentation({ conversationState: "running", isQueueEnabled: true })).toMatchObject({
      mode: "queue",
      placeholder: "Queue next message...",
      isDisabled: false,
    })
    expect(getFollowUpInputPresentation({ conversationState: "needs_input", isQueueEnabled: false })).toMatchObject({
      mode: "disabled",
      placeholder: "",
      isDisabled: true,
    })
    expect(getFollowUpInputPresentation({ conversationState: "complete", isQueueEnabled: true })).toMatchObject({
      mode: "send",
      placeholder: "Continue conversation...",
      isDisabled: false,
      submitHint: "Sends your message to the selected agent.",
    })
    expect(getFollowUpInputPresentation({ conversationState: "blocked", isQueueEnabled: true }).mode).toBe("send")
    expect(getChatComposerRuntimeFollowUpPresentationState({
      conversationState: null,
      isResponding: true,
      isQueueEnabled: true,
    })).toMatchObject({
      mode: "queue",
      submitTitle: "Queue next message",
    })
    expect(getChatComposerRuntimeFollowUpPresentationState({
      conversationState: null,
      isResponding: false,
      isQueueEnabled: true,
    })).toMatchObject({
      mode: "send",
      submitTitle: "Send message",
    })
    const textEntryRenderState = getChatComposerRuntimeTextEntryMobileRenderState({
      presentation: getFollowUpInputPresentation({ conversationState: "complete" }),
      handsFree: false,
      phase: "sleeping",
      listening: false,
      willCancel: false,
      wakePhrase: "hey agent",
      isWebPlatform: true,
      speechPreviewText: "draft transcript",
    })
    expect(textEntryRenderState.accessibilityHint).toContain("Shift+Enter")
    expect(textEntryRenderState.placeholder).toBe("Continue conversation...")
    expect(textEntryRenderState.voiceStatusLiveRegionAnnouncement)
      .toBe("Voice input captured. Transcript: draft transcript")

    const handsFreeControlsRenderState = getChatComposerRuntimeHandsFreeControlsMobileRenderState({
      phase: "listening",
      label: "Listening",
      isEnabled: true,
      wakePhrase: "hey agent",
      sleepPhrase: "sleep agent",
      lastError: null,
      foregroundOnly: false,
    })
    expect(handsFreeControlsRenderState.status).toMatchObject({
      phase: "listening",
      label: "Listening",
    })
    expect(handsFreeControlsRenderState.status.subtitle).toContain("sleep agent")
    expect(handsFreeControlsRenderState.controlState.primary.action).toBe("sleep")
    expect(handsFreeControlsRenderState.controlState.secondary.action).toBe("pause")
    expect(getChatComposerRuntimeHandsFreeDebugMessage("paused")).toBe("Handsfree paused.")
    expect(formatChatComposerRuntimeHandsFreeSleepingDebugMessage("hey agent"))
      .toContain("hey agent")
    expect(createChatComposerRuntimeHandsFreeTranscriptAddedDebugState().debugInfo)
      .toBe("Voice transcript added to the composer.")
    expect(createChatComposerRuntimeHandsFreePermissionDeniedDebugState().debugInfo)
      .toBe("Speech recognition permission denied.")
    expect(createChatComposerRuntimeHandsFreeRecognizerErrorDebugState("muted").debugInfo)
      .toBe("Voice error: muted")
  })

  it("treats active attention signals as foreground without changing lifecycle", () => {
    expect(deriveAttentionState({ conversationState: "running", isSnoozed: true, hasUnreadResponse: true })).toBe("foreground")
    expect(deriveAttentionState({ conversationState: "running", isSnoozed: true, hasAnalyzingOrPlanningProgress: true })).toBe("foreground")
    expect(deriveAttentionState({ conversationState: "running", isSnoozed: true, hasForegroundActivity: true })).toBe("foreground")
    expect(deriveAttentionState({ conversationState: "complete", hasRecentFinalResponse: true })).toBe("foreground")
    expect(deriveLifecycleState({ conversationState: "running", isSnoozed: true, hasUnreadResponse: true })).toBe("running")
  })

  it("centralizes chat runtime feedback copy", () => {
    expect(getChatRuntimeCopyState()).toBe(CHAT_RUNTIME_PRESENTATION)
    expect(CHAT_RUNTIME_PRESENTATION.killSwitch.title).toBe("Emergency Stop")
    expect(CHAT_RUNTIME_PRESENTATION.header.defaultAgentLabel).toBe("Default Agent")
    expect(CHAT_RUNTIME_PRESENTATION.header.agentSelectorDropdownGlyph).toBe("▼")
    expect(CHAT_RUNTIME_PRESENTATION.header.agentSelectorMobileIcon).toMatchObject({
      name: "chevron-down",
      size: 13,
    })
    expect(getChatRuntimeAgentSelectorAccessibilityHint()).toBe(
      CHAT_RUNTIME_PRESENTATION.header.agentSelectorAccessibilityHint,
    )
    expect(getChatRuntimeAgentSelectorMobileIconState()).toEqual({
      name: CHAT_RUNTIME_PRESENTATION.header.agentSelectorMobileIcon.name,
      size: CHAT_RUNTIME_PRESENTATION.header.agentSelectorMobileIcon.size,
      colorToken: "primary",
    })
    expect(getChatRuntimeAgentSelectorMobileActionState("Research")).toEqual({
      label: "Research",
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      accessibilityLabel: "Current agent: Research. Tap to change.",
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.header.agentSelectorAccessibilityHint,
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.header.agentSelectorMobileIcon.name,
        size: CHAT_RUNTIME_PRESENTATION.header.agentSelectorMobileIcon.size,
        colorToken: "primary",
      },
    })
    expect(getChatRuntimeAgentSelectorMobileRenderState({
      agentLabel: "Research",
      colors: { primary: "#2563eb" },
    })).toEqual({
      label: "Research",
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      accessibilityLabel: "Current agent: Research. Tap to change.",
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.header.agentSelectorAccessibilityHint,
      chip: {
        backgroundColor: "rgba(37, 99, 235, 0.2)",
      },
      text: {
        color: "#2563eb",
      },
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.header.agentSelectorMobileIcon.name,
        size: CHAT_RUNTIME_PRESENTATION.header.agentSelectorMobileIcon.size,
        color: "#2563eb",
      },
    })
    expect(CHAT_RUNTIME_PRESENTATION.header.backGlyph).toBe("←")
    expect(CHAT_RUNTIME_PRESENTATION.header.backMobileIcon).toMatchObject({
      name: "chevron-back",
      size: 22,
    })
    expect(getChatRuntimeBackMobileIconState()).toEqual({
      name: CHAT_RUNTIME_PRESENTATION.header.backMobileIcon.name,
      size: CHAT_RUNTIME_PRESENTATION.header.backMobileIcon.size,
      colorToken: "foreground",
    })
    expect(getChatRuntimeBackMobileActionState()).toEqual({
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      accessibilityLabel: CHAT_RUNTIME_PRESENTATION.header.backToHistoryAccessibilityLabel,
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.header.backToHistoryAccessibilityHint,
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.header.backMobileIcon.name,
        size: CHAT_RUNTIME_PRESENTATION.header.backMobileIcon.size,
        colorToken: "foreground",
      },
    })
    expect(getChatRuntimeBackMobileColors({
      foreground: "#0f172a",
    })).toEqual({
      icon: {
        color: "#0f172a",
      },
    })
    expect(getChatRuntimeBackMobileRenderState({
      colors: { foreground: "#0f172a" },
    })).toEqual({
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      accessibilityLabel: CHAT_RUNTIME_PRESENTATION.header.backToHistoryAccessibilityLabel,
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.header.backToHistoryAccessibilityHint,
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.header.backMobileIcon.name,
        size: CHAT_RUNTIME_PRESENTATION.header.backMobileIcon.size,
        color: "#0f172a",
      },
    })
    expect(CHAT_RUNTIME_PRESENTATION.header.handsFreeGlyph).toBe("🎙️")
    expect(CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon).toMatchObject({
      enabledName: "mic",
      disabledName: "mic-off-outline",
      size: 18,
    })
    expect(getChatRuntimeHandsFreeAccessibilityLabel()).toBe("Hands-free voice mode toggle")
    expect(getChatRuntimeHandsFreeAccessibilityHint()).toBe(
      CHAT_RUNTIME_PRESENTATION.header.handsFreeAccessibilityHint,
    )
    expect(getChatRuntimeHandsFreeMobileIconState(false)).toEqual({
      isEnabled: false,
      name: CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.disabledName,
      size: CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.size,
      colorToken: "mutedForeground",
    })
    expect(getChatRuntimeHandsFreeMobileIconState(true)).toEqual({
      isEnabled: true,
      name: CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.enabledName,
      size: CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.size,
      colorToken: "primary",
    })
    expect(getChatRuntimeHandsFreeMobileActionState({ isEnabled: false })).toEqual({
      isEnabled: false,
      accessibilityRole: "switch",
      pressedOpacity: 0.78,
      accessibilityLabel: "Hands-free voice mode toggle",
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.header.handsFreeAccessibilityHint,
      accessibilityState: { checked: false },
      ariaChecked: false,
      icon: {
        isEnabled: false,
        name: CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.disabledName,
        size: CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.size,
        colorToken: "mutedForeground",
      },
    })
    expect(getChatRuntimeHandsFreeMobileActionState({ isEnabled: true })).toMatchObject({
      isEnabled: true,
      accessibilityState: { checked: true },
      ariaChecked: true,
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.enabledName,
        colorToken: "primary",
      },
    })
    const handsFreeMobileColors = {
      mutedForeground: "#64748b",
      primary: "#2563eb",
    }
    expect(getChatRuntimeHandsFreeMobileColors(false, handsFreeMobileColors)).toEqual({
      icon: {
        color: "#64748b",
      },
    })
    expect(getChatRuntimeHandsFreeMobileColors(true, handsFreeMobileColors)).toEqual({
      icon: {
        color: "#2563eb",
      },
    })
    expect(getChatRuntimeHandsFreeMobileRenderState({
      isEnabled: true,
      colors: handsFreeMobileColors,
    })).toEqual({
      isEnabled: true,
      accessibilityRole: "switch",
      pressedOpacity: 0.78,
      accessibilityLabel: "Hands-free voice mode toggle",
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.header.handsFreeAccessibilityHint,
      accessibilityState: { checked: true },
      ariaChecked: true,
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.enabledName,
        size: CHAT_RUNTIME_PRESENTATION.header.handsFreeMobileIcon.size,
        color: "#2563eb",
      },
    })
    expect(getChatRuntimeKillSwitchMobileActionState()).toEqual({
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      accessibilityLabel: CHAT_RUNTIME_PRESENTATION.killSwitch.buttonAccessibilityLabel,
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.killSwitch.buttonAccessibilityHint,
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.killSwitch.mobileIcon.name,
        size: CHAT_RUNTIME_PRESENTATION.killSwitch.mobileIcon.size,
        color: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.iconColor,
      },
    })
    expect(getChatRuntimeKillSwitchMobileAlertState()).toEqual({
      confirmation: {
        title: CHAT_RUNTIME_PRESENTATION.killSwitch.title,
        message: CHAT_RUNTIME_PRESENTATION.killSwitch.message,
        confirmLabel: CHAT_RUNTIME_PRESENTATION.killSwitch.actionLabel,
        cancelLabel: CHAT_RUNTIME_PRESENTATION.common.cancel,
      },
      success: {
        title: CHAT_RUNTIME_PRESENTATION.common.successTitle,
        fallbackMessage: CHAT_RUNTIME_PRESENTATION.killSwitch.successFallback,
      },
      failed: {
        title: CHAT_RUNTIME_PRESENTATION.common.errorTitle,
        fallbackMessage: CHAT_RUNTIME_PRESENTATION.killSwitch.stopFailed,
      },
      connectionFailed: {
        title: CHAT_RUNTIME_PRESENTATION.common.errorTitle,
        fallbackMessage: CHAT_RUNTIME_PRESENTATION.killSwitch.connectionFailed,
      },
    })
    expect(getChatRuntimeKillSwitchConfirmationMobileResolvedAlertState()).toEqual({
      title: CHAT_RUNTIME_PRESENTATION.killSwitch.title,
      message: CHAT_RUNTIME_PRESENTATION.killSwitch.message,
      confirmLabel: CHAT_RUNTIME_PRESENTATION.killSwitch.actionLabel,
      cancelLabel: CHAT_RUNTIME_PRESENTATION.common.cancel,
      webMessage: formatChatRuntimeWebConfirmMessage(
        CHAT_RUNTIME_PRESENTATION.killSwitch.title,
        CHAT_RUNTIME_PRESENTATION.killSwitch.message,
      ),
    })
    expect(getChatRuntimeKillSwitchResultMobileResolvedAlertState({
      success: true,
      message: "Stopped",
    })).toEqual({
      title: CHAT_RUNTIME_PRESENTATION.common.successTitle,
      message: "Stopped",
      webMessage: "Stopped",
    })
    expect(getChatRuntimeKillSwitchResultMobileResolvedAlertState({
      success: false,
      error: "Denied",
    })).toEqual({
      title: CHAT_RUNTIME_PRESENTATION.common.errorTitle,
      message: "Denied",
      webMessage: `${CHAT_RUNTIME_PRESENTATION.common.errorTitle}: Denied`,
    })
    expect(getChatRuntimeKillSwitchConnectionFailedMobileResolvedAlertState(new Error("Offline"))).toEqual({
      title: CHAT_RUNTIME_PRESENTATION.common.errorTitle,
      message: "Offline",
      webMessage: `${CHAT_RUNTIME_PRESENTATION.common.errorTitle}: Offline`,
    })
    expect(CHAT_RUNTIME_PRESENTATION.header.renameConversationTitleLabel).toBe("Rename conversation title")
    expect(CHAT_RUNTIME_PRESENTATION.header.expandPanelTitle).toBe("Expand panel")
    expect(CHAT_RUNTIME_PRESENTATION.header.collapsePanelTitle).toBe("Collapse panel")
    expect(CHAT_RUNTIME_PRESENTATION.modelControls.model.updatedToast).toBe("Agent model updated")
    expect(CHAT_RUNTIME_PRESENTATION.modelControls.model.updateFailedToast).toBe("Failed to update model")
    expect(CHAT_RUNTIME_PRESENTATION.modelControls.model.changeAccessibilityLabel).toBe("Change agent model")
    expect(CHAT_RUNTIME_PRESENTATION.modelControls.model.loadingLabel).toBe("Loading models...")
    expect(CHAT_RUNTIME_PRESENTATION.modelControls.model.emptyLabel).toBe("No models available")
    expect(formatChatRuntimeModelPickerTitle("OpenAI", "gpt-5.2")).toBe("Change agent model (OpenAI/gpt-5.2)")
    expect(CHAT_RUNTIME_PRESENTATION.modelControls.thinking.updatedToast).toBe("Thinking level updated")
    expect(CHAT_RUNTIME_PRESENTATION.modelControls.thinking.updateFailedToast).toBe("Failed to update thinking level")
    expect(CHAT_RUNTIME_PRESENTATION.modelControls.thinking.changeAccessibilityLabel).toBe("Change thinking level")
    expect(formatChatRuntimeThinkingPickerTitle("High")).toBe("Thinking level (High)")
    expect(CHAT_RUNTIME_PRESENTATION.modelControls.verbosity.updatedToast).toBe("Verbosity updated")
    expect(CHAT_RUNTIME_PRESENTATION.modelControls.verbosity.updateFailedToast).toBe("Failed to update verbosity")
    expect(CHAT_RUNTIME_PRESENTATION.modelControls.verbosity.changeAccessibilityLabel).toBe("Change verbosity")
    expect(formatChatRuntimeVerbosityPickerTitle("Detailed")).toBe("Verbosity (Detailed)")
    expect(CHAT_RUNTIME_PRESENTATION.debug.noSessionAvailable).toBe("No session available")
    expect(CHAT_RUNTIME_PRESENTATION.debug.requestSent).toBe("Request sent, waiting for response...")
    expect(CHAT_RUNTIME_PRESENTATION.debug.completed).toBe("Completed!")
    expect(CHAT_RUNTIME_PRESENTATION.debug.processingQueuedMessage).toBe("Processing queued message...")
    expect(CHAT_RUNTIME_PRESENTATION.debug.sessionChangedDuringProcessing).toBe("Session changed during processing")
    expect(CHAT_RUNTIME_PRESENTATION.debug.requestSuperseded).toBe("Request superseded")
    expect(CHAT_RUNTIME_PRESENTATION.debug.unknownError).toBe("Unknown error")
    expect(getChatRuntimeDebugState()).toBe(CHAT_RUNTIME_PRESENTATION.debug)
    expect(getChatRuntimeDebugMessage("noSessionAvailable")).toBe(CHAT_RUNTIME_PRESENTATION.debug.noSessionAvailable)
    expect(createChatRuntimeNoSessionAvailableDebugState()).toEqual({
      message: CHAT_RUNTIME_PRESENTATION.debug.noSessionAvailable,
      debugInfo: "Error: No session available",
    })
    expect(createChatRuntimeStartingRequestDebugState("http://localhost:3000")).toEqual({
      debugInfo: "Starting request to http://localhost:3000...",
    })
    expect(createChatRuntimeRequestSentDebugState()).toEqual({
      debugInfo: CHAT_RUNTIME_PRESENTATION.debug.requestSent,
    })
    expect(createChatRuntimeCompletedDebugState()).toEqual({
      debugInfo: CHAT_RUNTIME_PRESENTATION.debug.completed,
    })
    expect(createChatRuntimeProcessingQueuedMessageDebugState()).toEqual({
      debugInfo: CHAT_RUNTIME_PRESENTATION.debug.processingQueuedMessage,
    })
    expect(createChatRuntimeSessionChangedDuringProcessingQueueFailureState()).toEqual({
      message: CHAT_RUNTIME_PRESENTATION.debug.sessionChangedDuringProcessing,
    })
    expect(createChatRuntimeRequestSupersededQueueFailureState()).toEqual({
      message: CHAT_RUNTIME_PRESENTATION.debug.requestSuperseded,
    })
    expect(formatChatRuntimeDebugError(CHAT_RUNTIME_PRESENTATION.debug.noSessionAvailable)).toBe("Error: No session available")
    expect(formatChatRuntimeStartingRequestDebugMessage("http://localhost:3000")).toBe(
      "Starting request to http://localhost:3000...",
    )
    expect(createChatMessageRuntimeUserTextMessage("Run this")).toEqual({
      role: "user",
      content: "Run this",
    })
    expect(createChatMessageRuntimeAssistantTextMessage("Done")).toEqual({
      role: "assistant",
      content: "Done",
    })
    expect(createChatMessageRuntimeAssistantPlaceholderMessage()).toEqual({
      role: "assistant",
      content: "",
    })
    expect(appendChatMessageRuntimePendingTurnMessages(
      [{ role: "assistant", content: "Ready" }],
      { role: "user", content: "Next" },
    )).toEqual([
      { role: "assistant", content: "Ready" },
      { role: "user", content: "Next" },
      { role: "assistant", content: "" },
    ])
    const pendingTurnState = createChatMessageRuntimePendingTurnState(
      [{ role: "assistant", content: "Ready" }],
      "Next",
    )
    expect(pendingTurnState).toMatchObject({
      userMessage: { role: "user", content: "Next" },
      messageCountBeforeTurn: 1,
      latestStepSummary: null,
      responding: true,
      conversationState: "running",
    })
    expect(pendingTurnState.updateMessages(pendingTurnState.currentMessages)).toEqual([
      { role: "assistant", content: "Ready" },
      { role: "user", content: "Next" },
      { role: "assistant", content: "" },
    ])
    expect(removeChatMessageRuntimePendingTurnMessages([
      { role: "assistant", content: "Ready" },
      { role: "user", content: "Next" },
      { role: "assistant", content: "" },
    ])).toEqual([{ role: "assistant", content: "Ready" }])
    expect(removeChatMessageRuntimePendingTurnMessages([{ role: "assistant", content: "Only" }])).toEqual([
      { role: "assistant", content: "Only" },
    ])
    expect(createChatMessageRuntimePendingTurnStatusState()).toEqual({
      latestStepSummary: null,
      responding: true,
      conversationState: "running",
    })
    const statusEvents: unknown[] = []
    applyChatMessageRuntimePendingTurnStatusState(pendingTurnState, {
      setLatestStepSummary: (value) => statusEvents.push(["latestStepSummary", value]),
      setResponding: (value) => statusEvents.push(["responding", value]),
      setConversationState: (value) => statusEvents.push(["conversationState", value]),
    })
    applyChatMessageRuntimeCompletedTurnStatusState("complete", {
      setConversationState: (value) => statusEvents.push(["conversationState", value]),
    })
    applyChatMessageRuntimeBlockedTurnStatusState({
      setConversationState: (value) => statusEvents.push(["conversationState", value]),
    })
    applyChatMessageRuntimeSettledTurnStatusState({
      setResponding: (value) => statusEvents.push(["responding", value]),
      setConnectionState: (value) => statusEvents.push(["connectionState", value]),
    })
    expect(statusEvents).toEqual([
      ["latestStepSummary", null],
      ["responding", true],
      ["conversationState", "running"],
      ["conversationState", "complete"],
      ["conversationState", "blocked"],
      ["responding", false],
      ["connectionState", null],
    ])
    expect(createChatMessageRuntimeCompletedConversationState("running")).toBe("complete")
    expect(createChatMessageRuntimeCompletedConversationState("needs_input")).toBe("needs_input")
    expect(replaceChatMessageRuntimeTurnMessages(
      [
        { role: "assistant", content: "Ready" },
        { role: "user", content: "Next" },
        { role: "assistant", content: "" },
      ],
      1,
      [{ role: "assistant", content: "Final" }],
    )).toEqual([
      { role: "assistant", content: "Ready" },
      { role: "user", content: "Next" },
      { role: "assistant", content: "Final" },
    ])
    expect(createChatMessageRuntimeCompletedTurnMessages(
      [{ role: "assistant", content: "Ready" }],
      1,
      { role: "user", content: "Next" },
      [{ role: "assistant", content: "Final" }],
    )).toEqual([
      { role: "assistant", content: "Ready" },
      { role: "user", content: "Next" },
      { role: "assistant", content: "Final" },
    ])
    expect(createChatMessageRuntimeCompletedTextTurnMessages(
      [{ role: "assistant", content: "Ready" }],
      1,
      { role: "user", content: "Next" },
      "Final",
    )).toEqual([
      { role: "assistant", content: "Ready" },
      { role: "user", content: "Next" },
      { role: "assistant", content: "Final" },
    ])
    const previousAssistantMessage = { role: "assistant" as const, content: "Old" }
    expect(isLastChatMessageRuntimeConversationContent([previousAssistantMessage])).toBe(true)
    expect(updateLastChatMessageRuntimeConversationContent([
      { role: "user", content: "Question" },
      { role: "assistant", content: "Old" },
    ], "New")).toEqual([
      { role: "user", content: "Question" },
      { role: "assistant", content: "New" },
    ])
    expect(createChatMessageRuntimeAssistantDebugErrorMessage("Queue failed")).toEqual({
      role: "assistant",
      content: "Error: Queue failed",
    })
    expect(appendChatMessageRuntimeAssistantDebugErrorMessage(
      [{ role: "user", content: "Next" }],
      "Queue failed",
    )).toEqual([
      { role: "user", content: "Next" },
      { role: "assistant", content: "Error: Queue failed" },
    ])
    expect(createChatMessageRuntimeAssistantErrorMessage("Lost", "Partial")).toEqual({
      role: "assistant",
      content: "Partial\n\n---\nConnection lost. Partial response shown above.\n\nError: Lost",
    })
    expect(updateLastChatMessageRuntimeAssistantErrorMessage([
      { role: "user", content: "Question" },
      { role: "assistant", content: "Partial" },
    ], "Lost", "Partial")).toEqual([
      { role: "user", content: "Question" },
      {
        role: "assistant",
        content: "Partial\n\n---\nConnection lost. Partial response shown above.\n\nError: Lost",
      },
    ])
    const assistantErrorTurnState = createChatMessageRuntimeAssistantErrorTurnState("Lost", "Partial")
    expect(assistantErrorTurnState.debugInfo).toBe("Error: Lost")
    expect(assistantErrorTurnState.updateMessages([
      { role: "user", content: "Question" },
      { role: "assistant", content: "Partial" },
    ])).toEqual([
      { role: "user", content: "Question" },
      {
        role: "assistant",
        content: "Partial\n\n---\nConnection lost. Partial response shown above.\n\nError: Lost",
      },
    ])
    const connectionErrorTurnState = createChatMessageRuntimeConnectionErrorTurnState({
      message: "Lost",
      recoveryState: { status: "reconnecting", retryCount: 2 },
      partialContent: "Partial",
    })
    expect(connectionErrorTurnState.debugInfo).toBe("Error: Connection lost. Attempted 2 reconnections. Lost")
    const queuedErrorState = createChatMessageRuntimeQueuedErrorState(new Error("Queue failed"))
    expect(queuedErrorState.message).toBe("Queue failed")
    expect(queuedErrorState.turnState.updateMessages([{ role: "user", content: "Next" }])).toEqual([
      { role: "user", content: "Next" },
      { role: "assistant", content: "Error: Queue failed" },
    ])
    expect(hasChatMessageRuntimeRequestSessionChanged({
      currentSessionId: "session-a",
      requestSessionId: "session-b",
    })).toBe(true)
    expect(hasChatMessageRuntimeRequestSessionChanged({
      currentSessionId: "session-a",
      requestSessionId: "session-a",
    })).toBe(false)
    expect(isChatMessageRuntimeLatestSessionRequest({
      requestId: 2,
      latestRequestId: 1,
    })).toBe(true)
    expect(isChatMessageRuntimeLatestSessionRequest({
      requestSessionId: "session-a",
      requestId: 2,
      latestRequestId: 2,
    })).toBe(true)
    expect(isChatMessageRuntimeLatestSessionRequest({
      requestSessionId: "session-a",
      requestId: 2,
      latestRequestId: 1,
    })).toBe(false)
    expect(isChatMessageRuntimeActiveRequest({
      requestId: 3,
      activeRequestId: 3,
    })).toBe(true)
    expect(isChatMessageRuntimeActiveRequest({
      requestId: 3,
      activeRequestId: 4,
    })).toBe(false)
    expect(createChatMessageRuntimeUserResponseMessages(
      [
        { role: "user", content: "Question" },
        { role: "assistant", content: "  " },
      ],
      "  Spoken response  ",
    )).toEqual([
      { role: "user", content: "Question" },
      { role: "assistant", content: "Spoken response", displayContent: undefined },
    ])
    expect(createChatMessageRuntimeUserResponseMessages(
      [{ role: "user", content: "Question" }],
      "Spoken response",
    )).toEqual([
      { role: "user", content: "Question" },
      { role: "assistant", content: "Spoken response" },
    ])
    expect(preserveChatMessageRuntimeDisplayContentFromProgress(
      [
        { role: "assistant", content: "Final" },
        { role: "user", content: "Next" },
      ],
      [
        { role: "assistant", content: "", displayContent: "Spoken preview" },
        { role: "user", content: "Next", displayContent: "Ignored" },
      ],
    )).toEqual([
      { role: "assistant", content: "Final", displayContent: "Spoken preview" },
      { role: "user", content: "Next" },
    ])
    expect(createChatMessageRuntimeStreamingText("Hel", "Hello")).toBe("Hello")
    expect(createChatMessageRuntimeStreamingText("Hello", " world")).toBe("Hello world")
    const streamingTurnState = createChatMessageRuntimeStreamingTurnState("Hel", "Hello")
    expect(streamingTurnState.streamingText).toBe("Hello")
    expect(streamingTurnState.updateMessages([{ role: "assistant", content: "Old" }])).toEqual([
      { role: "assistant", content: "Hello" },
    ])
    expect(createChatMessageRuntimeFinalResponseTextState({
      responseContent: "Final",
      streamingText: "Stream",
      conversationState: "running",
    })).toEqual({
      finalText: "Final",
      finalDisplayText: "Final",
      ttsText: "Final",
      userResponseText: undefined,
      alreadySpokenMidTurn: false,
      completedConversationState: "complete",
    })
    expect(createChatMessageRuntimeFinalResponseTextState({
      responseContent: "Final",
      streamingText: "Stream",
      conversationState: "needs_input",
      finalResponseEvent: { id: "response-2", text: "Spoken final" },
      playedResponseEventIds: new Set(["response-2"]),
    })).toEqual({
      finalText: "Final",
      finalDisplayText: "Spoken final",
      ttsText: "Spoken final",
      userResponseText: "Spoken final",
      alreadySpokenMidTurn: true,
      completedConversationState: "needs_input",
    })
    const unsortedResponseEvents = [
      { id: "run-2-first", sessionId: "session-a", runId: 2, ordinal: 1, text: "Run 2", timestamp: 2 },
      { id: "run-1-second", sessionId: "session-a", runId: 1, ordinal: 2, text: "Second", timestamp: 3 },
      { id: "run-1-first", sessionId: "session-a", runId: 1, ordinal: 1, text: "First", timestamp: 4 },
    ]
    expect(sortChatMessageRuntimeResponseEvents(unsortedResponseEvents).map((event) => event.id)).toEqual([
      "run-1-first",
      "run-1-second",
      "run-2-first",
    ])
    expect(getChatMessageRuntimeNextResponseEventOrdinal(unsortedResponseEvents)).toBe(3)
    const progressResponseEvents = [
      { id: "response-2", sessionId: "session-a", runId: 1, ordinal: 2, text: "Second", timestamp: 2 },
      { id: "response-1", sessionId: "session-a", runId: 1, ordinal: 1, text: "First", timestamp: 1 },
    ]
    expect(createChatMessageRuntimeProgressResponseState({
      update: { responseEvents: progressResponseEvents },
      requestSessionId: "session-a",
      lastUserResponse: "Old",
      createFallbackResponseEvent: (sessionId, runId, text) => ({
        id: `${sessionId ?? "missing"}-${runId ?? 0}-fallback`,
        sessionId: sessionId ?? "missing",
        runId,
        ordinal: 1,
        text,
        timestamp: 10,
      }),
    })).toEqual({
      hasResponseUpdate: true,
      responseEvents: [
        { id: "response-1", sessionId: "session-a", runId: 1, ordinal: 1, text: "First", timestamp: 1 },
        { id: "response-2", sessionId: "session-a", runId: 1, ordinal: 2, text: "Second", timestamp: 2 },
      ],
      speechQueueEvents: [
        { id: "response-1", sessionId: "session-a", runId: 1, ordinal: 1, text: "First", timestamp: 1 },
        { id: "response-2", sessionId: "session-a", runId: 1, ordinal: 2, text: "Second", timestamp: 2 },
      ],
      lastUserResponse: "Second",
      legacyResponseText: undefined,
    })
    expect(createChatMessageRuntimeProgressResponseState({
      update: { userResponse: "Legacy response", runId: 7 },
      requestSessionId: "session-b",
      lastUserResponse: "Old",
      createFallbackResponseEvent: (sessionId, runId, text) => ({
        id: `${sessionId ?? "missing"}-${runId ?? 0}-fallback`,
        sessionId: sessionId ?? "missing",
        runId,
        ordinal: 1,
        text,
        timestamp: 10,
      }),
    })).toEqual({
      hasResponseUpdate: true,
      responseEvents: [{
        id: "session-b-7-fallback",
        sessionId: "session-b",
        runId: 7,
        ordinal: 1,
        text: "Legacy response",
        timestamp: 10,
      }],
      speechQueueEvents: [],
      lastUserResponse: "Legacy response",
      legacyResponseText: "Legacy response",
    })
    expect(createChatMessageRuntimeProgressResponseState({
      update: { spokenContent: "Legacy response", runId: 7 },
      requestSessionId: "session-b",
      lastUserResponse: "Legacy response",
      createFallbackResponseEvent: (sessionId, runId, text) => ({
        id: `${sessionId ?? "missing"}-${runId ?? 0}-fallback`,
        sessionId: sessionId ?? "missing",
        runId,
        ordinal: 1,
        text,
        timestamp: 10,
      }),
    })).toEqual({
      hasResponseUpdate: true,
      responseEvents: [],
      speechQueueEvents: [],
      lastUserResponse: "Legacy response",
      legacyResponseText: "Legacy response",
    })
    expect(createChatMessageRuntimeProgressResponseState({
      update: {},
      requestSessionId: "session-b",
      lastUserResponse: "Previous",
      createFallbackResponseEvent: (sessionId, runId, text) => ({
        id: `${sessionId ?? "missing"}-${runId ?? 0}-fallback`,
        sessionId: sessionId ?? "missing",
        runId,
        ordinal: 1,
        text,
        timestamp: 10,
      }),
    })).toEqual({
      hasResponseUpdate: false,
      responseEvents: [],
      speechQueueEvents: [],
      lastUserResponse: "Previous",
      legacyResponseText: undefined,
    })
    const turnDurationMessages = createChatMessageRuntimeTurnDurationMessages([
      { role: "user", content: "Question", timestamp: 1_000 },
      { role: "assistant", content: "Answer", timestamp: 1_500 },
      { role: "assistant", content: "", timestamp: undefined },
    ])
    expect(turnDurationMessages).toEqual([
      { role: "user", timestamp: 1_000, isThinking: false },
      { role: "assistant", timestamp: 1_500, isThinking: false },
    ])
    const completedTurnDurations = computeChatMessageRuntimeTurnDurations(
      turnDurationMessages,
      true,
      2_500,
    )
    expect(completedTurnDurations.totalMs).toBe(500)
    expect(completedTurnDurations.hasLive).toBe(false)
    expect(completedTurnDurations.byUserTimestamp.get(1_000)).toEqual({
      durationMs: 500,
      isLive: false,
    })
    const liveTurnDurations = computeChatMessageRuntimeTurnDurations(
      createChatMessageRuntimeTurnDurationMessages([
        { role: "user", content: "Question", timestamp: 1_000 },
      ]),
      false,
      2_500,
    )
    expect(liveTurnDurations.totalMs).toBe(1_500)
    expect(liveTurnDurations.hasLive).toBe(true)
    expect(hasChatMessageRuntimeLiveAgentTurn({ conversationState: "running" })).toBe(true)
    expect(hasChatMessageRuntimeLiveAgentTurn({ conversationState: "needs_input" })).toBe(true)
    expect(hasChatMessageRuntimeLiveAgentTurn({ conversationState: "complete", isResponding: true })).toBe(true)
    expect(hasChatMessageRuntimeLiveAgentTurn({ conversationState: "complete" })).toBe(false)
    expect(mergeChatComposerRuntimeVoiceText("summarize my", "latest emails")).toBe("summarize my latest emails")
    expect(resolveChatRuntimeMobileFontFamily({
      ios: "Menlo",
      default: "monospace",
    }, "ios")).toBe("Menlo")
    expect(resolveChatRuntimeMobileFontFamily({
      ios: "Menlo",
      default: "monospace",
    }, "android")).toBe("monospace")
    expect(createChatMessageRuntimeLogMeta("hello")).toEqual({
      length: 5,
      inlineImageCount: 0,
    })
    expect(createChatMessageRuntimeModelMessages([
      { role: "user" as const, content: "![pic](data:image/png;base64,abc)" },
      { role: "assistant" as const, content: "ok" },
    ])).toEqual([
      { role: "user", content: "[Image: pic]" },
      { role: "assistant", content: "ok" },
    ])
    expect(toggleChatMessageRuntimeMessageExpansionState({ 1: false }, 1)).toEqual({ 1: true })
    expect(toggleChatMessageRuntimeToolCallExpansionState({}, "message-1", 2)).toEqual({
      "message-1-2": true,
    })
    expect(toggleChatMessageRuntimeToolApprovalExpansionState({}, "approval-1")).toEqual({
      "approval-1": true,
    })
    expect(applyChatMessageRuntimeAutoExpansionState({}, [
      { role: "assistant", content: "Visible" },
    ], { isResponding: false })).toEqual({ 0: true })
    const toolActivityGroups = createChatMessageRuntimeToolActivityGroups([
      {
        role: "assistant",
        content: "",
        toolCalls: [{ name: "search", arguments: {} }],
      },
      {
        role: "tool",
        content: "Result",
        toolResults: [{ success: true, content: "done" }],
      },
    ])
    expect(toolActivityGroups.groups).toHaveLength(1)
    const runtimeToolActivityGroup = toolActivityGroups.groups[0]
    expect(toggleChatMessageRuntimeToolActivityGroupExpansionState({}, runtimeToolActivityGroup)).toEqual({
      "tool-activity-group:0": true,
    })
    expect(applyChatMessageRuntimeToolActivityGroupExpansionInheritance({
      groupState: {},
      inheritedState: { 0: true },
      groups: [runtimeToolActivityGroup],
    })).toEqual({
      "tool-activity-group:0": true,
    })
    type RuntimeTestMessage = {
      id?: string
      role: "user" | "assistant" | "tool"
      content?: string
      displayContent?: string
      timestamp?: number
      toolCalls?: Array<{ name: string; arguments?: unknown }>
      toolResults?: Array<{ id: string }>
      branchMessageIndex?: number
    }
    const retryInfo = {
      isRetrying: true,
      attempt: 2,
      maxAttempts: 3,
      delaySeconds: 4,
      reason: "Retrying after rate limit",
      startedAt: 20,
    }
    expect(createChatMessageRuntimeRetryMessage(retryInfo)).toEqual({
      role: "assistant",
      content: "Retrying after rate limit",
      variant: "retry",
      retryInfo,
    })
    expect(createChatMessageRuntimeAssistantFeedbackMessage({
      thinkingContent: "Checking files",
      hasToolActivity: true,
      toolCalls: [{ name: "search" }],
      toolResults: [{ id: "search-result" }],
    })).toEqual({
      role: "assistant",
      content: formatChatRuntimeAssistantFeedbackContent("Checking files", true),
      toolCalls: [{ name: "search" }],
      toolResults: [{ id: "search-result" }],
    })
    const activeProgressStep = {
      id: "step-1",
      type: "thinking" as const,
      title: "Inspecting",
      status: "in_progress" as const,
      timestamp: 30,
    }
    expect(createChatMessageRuntimeActivityMessage(activeProgressStep)).toEqual({
      role: "assistant",
      content: formatChatRuntimeActivityContent(activeProgressStep),
    })
    const approvalMessage = createChatMessageRuntimeToolApprovalRequiredMessage({
      approvalId: "approval-1",
      toolName: "edit",
    })
    expect(approvalMessage).toEqual({
      role: "assistant",
      content: formatChatRuntimeToolApprovalRequiredContent("edit"),
      variant: "approval",
      toolApproval: {
        approvalId: "approval-1",
        toolName: "edit",
      },
    })
    const keptApprovalSiblingMessage = { role: "assistant" as const, content: "Keep" } as RuntimeTestMessage & {
      toolApproval?: { approvalId?: string } | null
    }
    const messagesWithApproval = [
      approvalMessage,
      keptApprovalSiblingMessage,
    ]
    expect(removeChatMessageRuntimeToolApprovalMessage(messagesWithApproval, "approval-1")).toEqual([
      { role: "assistant", content: "Keep" },
    ])
    const progressMessages = createChatMessageRuntimeProgressMessages<RuntimeTestMessage>({
      sessionId: "session-a",
      currentIteration: 1,
      maxIterations: 3,
      isComplete: false,
      steps: [
        {
          id: "thinking-1",
          type: "thinking",
          title: "Thinking",
          status: "completed",
          timestamp: 1,
          content: "Checking files",
        },
        {
          id: "tool-1",
          type: "tool_call",
          title: "Search",
          status: "completed",
          timestamp: 2,
          toolCall: { name: "search", arguments: {} },
        },
      ],
      streamingContent: {
        text: "Streaming answer",
        isStreaming: true,
      },
      pendingToolApproval: {
        approvalId: "approval-2",
        toolName: "write",
        arguments: {},
      },
    })
    expect(progressMessages).toMatchObject([
      {
        role: "assistant",
        content: "Streaming answer",
        toolCalls: [{ name: "search" }],
      },
      {
        role: "assistant",
        variant: "approval",
        toolApproval: { approvalId: "approval-2", toolName: "write" },
      },
    ])
    const progressTurnSummary = {
      id: "summary-1",
      sessionId: "session-a",
      stepNumber: 3,
      timestamp: 40,
      actionSummary: "Checked files",
    }
    const progressTurnState = createChatMessageRuntimeProgressTurnState<RuntimeTestMessage>({
      sessionId: "session-a",
      currentIteration: 1,
      maxIterations: 3,
      isComplete: false,
      steps: [activeProgressStep],
      latestSummary: progressTurnSummary,
    })
    expect(progressTurnState.conversationState).toBe("running")
    expect(progressTurnState.latestStepSummary).toBe(progressTurnSummary)
    expect(progressTurnState.updateMessages([
      { role: "assistant", content: "Ready" },
      { role: "user", content: "Question" },
      { role: "assistant", content: "" },
    ], 1).map((message) => message.content)).toEqual([
      "Ready",
      "Question",
      formatChatRuntimeActivityContent(activeProgressStep),
    ])
    let appliedConversationState: string | null = null
    let appliedStepSummary: unknown = undefined
    applyChatMessageRuntimeProgressTurnStatusState(progressTurnState, {
      setConversationState: (value) => {
        appliedConversationState = value
      },
      setLatestStepSummary: (value) => {
        appliedStepSummary = value
      },
    })
    expect(appliedConversationState).toBe("running")
    expect(appliedStepSummary).toBe(progressTurnSummary)
    const historyMessages: RuntimeTestMessage[] = [
      { id: "u1", role: "user", content: "Question", timestamp: 1 },
      {
        id: "a1",
        role: "assistant",
        content: "Thinking",
        timestamp: 2,
        toolCalls: [{ name: "search" }],
        branchMessageIndex: 4,
      },
      { role: "tool", content: "raw", timestamp: 3, toolResults: [{ id: "result-1" }] },
      { role: "tool", content: "synthetic", timestamp: 4 },
      { id: "a2", role: "assistant", content: "Final", displayContent: "Visible final", timestamp: 5 },
    ]
    expect(findChatMessageRuntimeLastUserMessageIndex(historyMessages, -1)).toBe(0)
    expect(findChatMessageRuntimeLastUserMessageIndex([{ role: "assistant", content: "Only" }], -1)).toBe(-1)
    expect(hasChatMessageRuntimeMessagesAfter(historyMessages, 0)).toBe(true)
    expect(hasChatMessageRuntimeAssistantContentAfter(historyMessages, 0)).toBe(true)
    expect(hasChatMessageRuntimeAssistantContentAfter(historyMessages, 4)).toBe(false)
    const displayMessages = createChatMessageRuntimeHistoryDisplayMessages(historyMessages, { includeId: true })
    expect(displayMessages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
    }))).toEqual([
      { id: "u1", role: "user", content: "Question" },
      { id: "a1", role: "assistant", content: "Thinking" },
      { id: "a2", role: "assistant", content: "Final" },
    ])
    expect(displayMessages[1]?.toolResults).toEqual([{ id: "result-1" }])
    expect(createChatMessageRuntimeHistoryDisplayMessage(
      { role: "tool", content: "Tool content" },
    )).toMatchObject({
      role: "assistant",
      content: "Tool content",
    })
    const mergeMessages = [{
      role: "assistant" as const,
      toolCalls: [{ name: "search" }],
      toolResults: [] as Array<{ id: string }>,
    }]
    expect(mergeChatMessageRuntimeToolResultsIntoLastMessage(
      mergeMessages,
      { role: "tool", toolResults: [{ id: "merged-result" }] },
    )).toBe(true)
    expect(mergeMessages[0]?.toolResults).toEqual([{ id: "merged-result" }])
    expect(shouldSkipChatMessageRuntimeSyntheticToolSummary({ role: "tool" })).toBe(true)
    expect(createChatMessageRuntimeFinalHistoryTurnMessages<RuntimeTestMessage>(
      historyMessages,
      { userResponse: "Spoken final" },
    ).map((message) => message.content)).toEqual(["Thinking", "Spoken final"])
    const historyTurnState = createChatMessageRuntimeFinalResponseTurnState<RuntimeTestMessage>({
      conversationHistory: historyMessages,
      userResponseText: "Spoken final",
    })
    expect(historyTurnState.kind).toBe("history")
    if (historyTurnState.kind === "history") {
      expect(historyTurnState.finalTurnMessages.map((message) => message.content)).toEqual([
        "Thinking",
        "Spoken final",
      ])
      expect(historyTurnState.updateMessages(
        [
          { role: "assistant", content: "Ready" },
          { role: "user", content: "Question" },
          { role: "assistant", content: "" },
        ],
        1,
        [{ role: "assistant", content: "Progress", displayContent: "Preview" }],
      ).map((message) => message.content)).toEqual(["Ready", "Question", "Thinking", "Spoken final"])
    }
    const textTurnState = createChatMessageRuntimeFinalResponseTurnState<RuntimeTestMessage>({
      finalDisplayText: "Only final",
    })
    expect(textTurnState.kind).toBe("text")
    if (textTurnState.kind === "text") {
      expect(textTurnState.updateMessages([{ role: "assistant", content: "Old" }])).toEqual([
        { role: "assistant", content: "Only final" },
      ])
      expect(textTurnState.createCompletedMessages(
        [{ role: "assistant", content: "Ready" }],
        1,
        { role: "user", content: "Question" },
      )).toEqual([
        { role: "assistant", content: "Ready" },
        { role: "user", content: "Question" },
        { role: "assistant", content: "Only final" },
      ])
    }
    expect(replaceChatMessageRuntimeFinalTurnMessages(
      [
        { role: "assistant", content: "Ready" },
        { role: "user", content: "Question" },
        { role: "assistant", content: "" },
      ],
      1,
      [{ role: "assistant", content: "Final" }],
    )).toEqual([
      { role: "assistant", content: "Ready" },
      { role: "user", content: "Question" },
      { role: "assistant", content: "Final" },
    ])
    expect(mergeChatMessageRuntimeFinalTurnMessagesWithProgress(
      [{ role: "assistant", content: "Final" }],
      [
        { role: "assistant", content: "Progress 1" },
        { role: "assistant", content: "Progress 2", displayContent: "Preview" },
      ],
    )).toEqual([
      { role: "assistant", content: "Progress 1" },
      { role: "assistant", content: "Final", displayContent: "Preview" },
    ])
    expect(createChatMessageRuntimeSessionDisplayMessages(historyMessages, { includeId: true })[0]).toMatchObject({
      id: "u1",
      role: "user",
      content: "Question",
      timestamp: 1,
    })
    expect(createChatMessageRuntimeResponseHistoryEvents([
      {
        role: "assistant",
        timestamp: 9,
        toolCalls: [{ name: "respond_to_user", arguments: { text: "Hello user" } }],
      },
    ])).toMatchObject([{
      id: "mobile-history-0-0-1",
      sessionId: "history",
      ordinal: 1,
      text: "Hello user",
      timestamp: 9,
    }])
    expect(createChatMessageRuntimeRecoveredHistoryMessages<RuntimeTestMessage>(
      historyMessages,
    ).map((message) => message.role)).toEqual(["user", "assistant", "assistant"])
    expect(createChatMessageRuntimeRecoverableHistoryMessages<RuntimeTestMessage>(
      historyMessages,
    )?.map((message) => message.content)).toEqual(["Question", "Thinking", "Final"])
    expect(createChatMessageRuntimeRecoverableHistoryMessages<RuntimeTestMessage>([
      { role: "assistant", content: "Old" },
      { role: "user", content: "Next" },
    ])).toBeNull()
    expect(CHAT_RUNTIME_PRESENTATION.killSwitch.buttonGlyph).toBe("⏹")
    expect(CHAT_RUNTIME_PRESENTATION.killSwitch.mobileIcon).toMatchObject({
      name: "stop-circle-outline",
      size: 18,
    })
    expect(getChatRuntimeKillSwitchMobileIconState()).toEqual({
      name: CHAT_RUNTIME_PRESENTATION.killSwitch.mobileIcon.name,
      size: CHAT_RUNTIME_PRESENTATION.killSwitch.mobileIcon.size,
      color: "#FFFFFF",
    })
    expect(getChatRuntimeKillSwitchMobileColors({
      destructive: "#dc2626",
    })).toEqual({
      button: {
        backgroundColor: "#dc2626",
      },
      icon: {
        color: "#FFFFFF",
      },
    })
    expect(getChatRuntimeKillSwitchMobileRenderState({
      colors: { destructive: "#dc2626" },
    })).toEqual({
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      accessibilityLabel: CHAT_RUNTIME_PRESENTATION.killSwitch.buttonAccessibilityLabel,
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.killSwitch.buttonAccessibilityHint,
      button: {
        backgroundColor: "#dc2626",
      },
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.killSwitch.mobileIcon.name,
        size: CHAT_RUNTIME_PRESENTATION.killSwitch.mobileIcon.size,
        color: "#FFFFFF",
      },
    })
    expect(getChatRuntimeKillSwitchMobileVisibilityRenderState({
      conversationState: "running",
    })).toEqual({
      shouldRender: true,
    })
    expect(getChatRuntimeKillSwitchMobileVisibilityRenderState({
      conversationState: "needs_input",
    })).toEqual({
      shouldRender: false,
    })
    expect(getChatRuntimeKillSwitchMobileVisibilityRenderState()).toEqual({
      shouldRender: false,
    })
    expect(CHAT_RUNTIME_PRESENTATION.killSwitch.buttonAccessibilityLabel).toContain("Emergency stop")
    expect(CHAT_RUNTIME_PRESENTATION.killSwitch.sessionTitle).toBe("Stop Agent Execution")
    expect(CHAT_RUNTIME_PRESENTATION.killSwitch.sessionActionLabel).toBe("Stop Agent")
    expect(CHAT_RUNTIME_PRESENTATION.killSwitch.sessionPendingActionLabel).toBe("Stopping...")
    expect(getChatComposerCopyState()).toBe(CHAT_COMPOSER_PRESENTATION)
    expect(getChatComposerRuntimeDraftMessageState({
      input: "  Describe this  ",
      pendingImages: [{
        name: "Diagram [v1]",
        dataUrl: "data:image/png;base64,abc",
      }],
    })).toEqual({
      content: "Describe this\n\n![Diagram v1](data:image/png;base64,abc)",
      hasContent: true,
    })
    expect(getChatComposerRuntimeDraftMessageState({
      input: "  ",
      pendingImages: [],
    })).toEqual({
      content: "",
      hasContent: false,
    })
    expect(CHAT_COMPOSER_RUNTIME_IMAGE_LIMITS).toEqual({
      maxImages: 4,
      maxFileBytes: 4 * 1024 * 1024,
      maxTotalEmbeddedBytes: 900 * 1024,
    })
    expect(createChatComposerRuntimeImagePickerLaunchOptions({
      mediaTypes: "images",
      selectionLimit: 3,
    })).toEqual({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: 3,
      quality: 0.8,
      base64: true,
    })
    expect(getChatComposerRuntimeImageDataUrlBytes("data:image/png;base64,YWJj")).toBe(3)
    expect(getChatComposerRuntimeImageDataUrlBytes("not-data")).toBe(0)
    expect(getChatComposerRuntimeBase64ImageBytes("YWJj")).toBe(3)
    expect(inferChatComposerRuntimeImageMimeType({ fileName: "sample.webp" })).toBe("image/webp")
    expect(createChatRuntimeThemeSpinnerSource({
      isDark: true,
      darkSource: "dark-spinner",
      lightSource: "light-spinner",
    })).toBe("dark-spinner")
    expect(createChatRuntimeThemeSpinnerSource({
      isDark: false,
      darkSource: "dark-spinner",
      lightSource: "light-spinner",
    })).toBe("light-spinner")
    expect(CHAT_COMPOSER_PRESENTATION.field.accessibilityLabel).toBe("Message composer")
    expect(CHAT_COMPOSER_PRESENTATION.imageAttachment.glyph).toBe("🖼️")
    expect(CHAT_COMPOSER_PRESENTATION.imageAttachment.mobileIcon).toMatchObject({
      name: "images-outline",
      size: 18,
    })
    expect(getChatComposerImageAttachmentMobileIconState(false)).toEqual({
      isActive: false,
      name: CHAT_COMPOSER_PRESENTATION.imageAttachment.mobileIcon.name,
      size: CHAT_COMPOSER_PRESENTATION.imageAttachment.mobileIcon.size,
      colorToken: "mutedForeground",
    })
    expect(getChatComposerImageAttachmentMobileIconState(true)).toEqual({
      isActive: true,
      name: CHAT_COMPOSER_PRESENTATION.imageAttachment.mobileIcon.name,
      size: CHAT_COMPOSER_PRESENTATION.imageAttachment.mobileIcon.size,
      colorToken: "primary",
    })
    expect(getChatComposerImageAttachmentMobileRenderState({
      hasImages: true,
      colors: {
        primary: "#2563eb",
        mutedForeground: "#64748b",
        primaryForeground: "#f8fafc",
      },
    })).toEqual({
      isActive: true,
      accessibilityRole: "button",
      accessibilityLabel: "Attach images button",
      accessibilityHint: CHAT_COMPOSER_PRESENTATION.imageAttachment.accessibilityHint,
      icon: {
        name: CHAT_COMPOSER_PRESENTATION.imageAttachment.mobileIcon.name,
        size: CHAT_COMPOSER_PRESENTATION.imageAttachment.mobileIcon.size,
        color: "#2563eb",
      },
    })
    expect(CHAT_COMPOSER_PRESENTATION.textToSpeech.enabledGlyph).toBe("🔊")
    expect(CHAT_COMPOSER_PRESENTATION.textToSpeech.mobileIcon).toMatchObject({
      enabledName: "volume-high-outline",
      disabledName: "volume-mute-outline",
      size: 18,
    })
    expect(getChatComposerTextToSpeechMobileIconState(false)).toEqual({
      isActive: false,
      name: CHAT_COMPOSER_PRESENTATION.textToSpeech.mobileIcon.disabledName,
      size: CHAT_COMPOSER_PRESENTATION.textToSpeech.mobileIcon.size,
      colorToken: "mutedForeground",
    })
    expect(getChatComposerTextToSpeechMobileIconState(true)).toEqual({
      isActive: true,
      name: CHAT_COMPOSER_PRESENTATION.textToSpeech.mobileIcon.enabledName,
      size: CHAT_COMPOSER_PRESENTATION.textToSpeech.mobileIcon.size,
      colorToken: "primary",
    })
    expect(getChatComposerTextToSpeechMobileRenderState({
      isEnabled: true,
      colors: {
        primary: "#2563eb",
        mutedForeground: "#64748b",
        primaryForeground: "#f8fafc",
      },
    })).toEqual({
      isActive: true,
      accessibilityRole: "switch",
      accessibilityLabel: "Text-to-Speech toggle",
      accessibilityHint: CHAT_COMPOSER_PRESENTATION.textToSpeech.accessibilityHint,
      accessibilityState: { checked: true },
      ariaChecked: true,
      icon: {
        name: CHAT_COMPOSER_PRESENTATION.textToSpeech.mobileIcon.enabledName,
        size: CHAT_COMPOSER_PRESENTATION.textToSpeech.mobileIcon.size,
        color: "#2563eb",
      },
    })
    expect(CHAT_COMPOSER_PRESENTATION.editBeforeSend.glyph).toBe("✏️")
    expect(CHAT_COMPOSER_PRESENTATION.editBeforeSend.mobileIcon.name).toBe("create-outline")
    expect(getChatComposerEditBeforeSendMobileIconState(false)).toEqual({
      isActive: false,
      name: CHAT_COMPOSER_PRESENTATION.editBeforeSend.mobileIcon.name,
      size: CHAT_COMPOSER_PRESENTATION.editBeforeSend.mobileIcon.size,
      colorToken: "mutedForeground",
    })
    expect(getChatComposerEditBeforeSendMobileIconState(true)).toEqual({
      isActive: true,
      name: CHAT_COMPOSER_PRESENTATION.editBeforeSend.mobileIcon.name,
      size: CHAT_COMPOSER_PRESENTATION.editBeforeSend.mobileIcon.size,
      colorToken: "primary",
    })
    expect(getChatComposerEditBeforeSendMobileRenderState({
      isEnabled: true,
      colors: {
        primary: "#2563eb",
        mutedForeground: "#64748b",
        primaryForeground: "#f8fafc",
      },
    })).toEqual({
      isActive: true,
      accessibilityRole: "switch",
      accessibilityLabel: "Edit before send toggle",
      accessibilityHint: CHAT_COMPOSER_PRESENTATION.editBeforeSend.accessibilityHint,
      accessibilityState: { checked: true },
      ariaChecked: true,
      icon: {
        name: CHAT_COMPOSER_PRESENTATION.editBeforeSend.mobileIcon.name,
        size: CHAT_COMPOSER_PRESENTATION.editBeforeSend.mobileIcon.size,
        color: "#2563eb",
      },
    })
    expect(CHAT_COMPOSER_PRESENTATION.queue.label).toBe("Queue")
    expect(CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.name).toBe("time-outline")
    expect(CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.size).toBe(
      CHAT_COMPOSER_PRESENTATION.imageAttachment.mobileIcon.size,
    )
    expect(getChatComposerQueueMobileActionState()).toEqual({
      isDisabled: false,
      label: CHAT_COMPOSER_PRESENTATION.queue.label,
      labelShouldRender: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.labelShouldRender,
      accessibilityRole: "button",
      accessibilityLabel: "Queue message button",
      accessibilityHint: CHAT_COMPOSER_PRESENTATION.queue.accessibilityHint,
      accessibilityState: { disabled: false },
      debugMessage: CHAT_COMPOSER_PRESENTATION.queue.debugMessage,
    })
    expect(getChatComposerQueueMobileActionState({ isDisabled: true })).toMatchObject({
      isDisabled: true,
      accessibilityState: { disabled: true },
    })
    expect(getChatComposerQueueMobileRenderState({
      isDisabled: true,
      colors: {
        primary: "#2563eb",
        mutedForeground: "#64748b",
        primaryForeground: "#f8fafc",
      },
    })).toEqual({
      isDisabled: true,
      label: CHAT_COMPOSER_PRESENTATION.queue.label,
      labelShouldRender: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.labelShouldRender,
      accessibilityRole: "button",
      accessibilityLabel: "Queue message button",
      accessibilityHint: CHAT_COMPOSER_PRESENTATION.queue.accessibilityHint,
      accessibilityState: { disabled: true },
      debugMessage: CHAT_COMPOSER_PRESENTATION.queue.debugMessage,
      icon: {
        name: CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.name,
        size: CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.size,
        color: "#2563eb",
      },
    })
    expect(getChatComposerMobileVisibilityRenderState({
      handsFree: true,
      listening: true,
      messageQueueEnabled: true,
    })).toEqual({
      voiceOverlay: {
        isVisible: true,
      },
      handsFreeControls: {
        isVisible: true,
      },
      editBeforeSendControl: {
        shouldRender: false,
      },
      queueAction: {
        shouldRender: true,
      },
      micButton: {
        shouldUsePushToTalk: false,
        shouldUseHandsFreePrimaryControl: true,
      },
    })
    expect(getChatComposerMobileVisibilityRenderState({
      handsFree: false,
      listening: false,
      messageQueueEnabled: true,
    })).toEqual({
      voiceOverlay: {
        isVisible: false,
      },
      handsFreeControls: {
        isVisible: false,
      },
      editBeforeSendControl: {
        shouldRender: true,
      },
      queueAction: {
        shouldRender: false,
      },
      micButton: {
        shouldUsePushToTalk: true,
        shouldUseHandsFreePrimaryControl: false,
      },
    })
    expect(getChatComposerMobileActionAvailabilityRenderState({
      hasContent: false,
      handsFree: false,
      presentation: { isDisabled: false },
    })).toEqual({
      queueAction: {
        isDisabled: true,
      },
      submitAction: {
        isDisabled: true,
      },
    })
    expect(getChatComposerMobileActionAvailabilityRenderState({
      hasContent: true,
      handsFree: false,
      presentation: { isDisabled: true },
    })).toEqual({
      queueAction: {
        isDisabled: false,
      },
      submitAction: {
        isDisabled: true,
      },
    })
    expect(getChatComposerMobileActionAvailabilityRenderState({
      hasContent: true,
      handsFree: true,
      presentation: { isDisabled: true },
    })).toEqual({
      queueAction: {
        isDisabled: false,
      },
      submitAction: {
        isDisabled: false,
      },
    })
    expect(getChatComposerMobileControlState()).toEqual({
      sttPreview: {
        label: CHAT_COMPOSER_PRESENTATION.sttPreview.label,
      },
      imageAttachment: {
        accessibilityRole: "button",
        accessibilityLabel: "Attach images button",
        accessibilityHint: CHAT_COMPOSER_PRESENTATION.imageAttachment.accessibilityHint,
      },
      textToSpeech: {
        accessibilityRole: "switch",
        accessibilityLabel: "Text-to-Speech toggle",
        accessibilityHint: CHAT_COMPOSER_PRESENTATION.textToSpeech.accessibilityHint,
        accessibilityState: { checked: false },
        ariaChecked: false,
      },
      editBeforeSend: {
        accessibilityRole: "switch",
        accessibilityLabel: "Edit before send toggle",
        accessibilityHint: CHAT_COMPOSER_PRESENTATION.editBeforeSend.accessibilityHint,
        accessibilityState: { checked: false },
        ariaChecked: false,
      },
      field: {
        accessibilityLabel: "Message composer input",
      },
    })
    expect(getChatComposerMobileControlState({
      textToSpeechEnabled: true,
      editBeforeSendEnabled: true,
    })).toMatchObject({
      textToSpeech: {
        accessibilityState: { checked: true },
        ariaChecked: true,
      },
      editBeforeSend: {
        accessibilityState: { checked: true },
        ariaChecked: true,
      },
    })
    expect(getChatComposerQueueMobileIconState()).toEqual({
      name: CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.name,
      size: CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.size,
      colorToken: "primary",
    })
    expect(getChatComposerMobileIconColors(getChatComposerQueueMobileIconState(), {
      mutedForeground: "#64748b",
      primary: "#2563eb",
      primaryForeground: "#ffffff",
    })).toEqual({
      icon: {
        color: "#2563eb",
      },
    })
    expect(getChatComposerMobileTextColors({
      background: "#f8fafc",
      foreground: "#0f172a",
      mutedForeground: "#64748b",
      primaryForeground: "#ffffff",
    })).toEqual({
      sttPreview: {
        labelColor: "#64748b",
        textColor: "#0f172a",
      },
      input: {
        color: "#0f172a",
        placeholderColor: "#64748b",
      },
      queueButton: {
        color: "#0f172a",
      },
      submitButton: {
        color: "#ffffff",
      },
      micButton: {
        color: "#64748b",
        activeColor: "#ffffff",
      },
      voiceOverlay: {
        color: "#f8fafc",
      },
    })
    expect(getChatComposerMobileSurfaceColors({
      background: "#f8fafc",
      border: "#cbd5e1",
      card: "#ffffff",
      foreground: "#0f172a",
      input: "#cbd5e1",
      muted: "#e2e8f0",
      primary: "#2563eb",
    })).toEqual({
      inputArea: {
        borderColor: "#cbd5e1",
        backgroundColor: "#ffffff",
      },
      input: {
        borderColor: "#cbd5e1",
        backgroundColor: "#f8fafc",
      },
      sttPreview: {
        borderColor: "#cbd5e1",
        backgroundColor: "#f8fafc",
      },
      accessoryButton: {
        borderColor: "#cbd5e1",
        backgroundColor: "#e2e8f0",
        activeBorderColor: "#2563eb",
        activeBackgroundColor: "#ffffff",
      },
      submitButton: {
        backgroundColor: "#2563eb",
      },
      queueButton: {
        borderColor: "#cbd5e1",
        backgroundColor: "#f8fafc",
      },
      micButton: {
        borderColor: "#cbd5e1",
        backgroundColor: "#ffffff",
        activeBorderColor: "#2563eb",
        activeBackgroundColor: "#2563eb",
      },
      voiceOverlay: {
        cardBackgroundColor: "rgba(15, 23, 42, 0.72)",
      },
    })
    const composerSurfaceRenderStateColors = {
      background: "#f8fafc",
      border: "#cbd5e1",
      card: "#ffffff",
      foreground: "#0f172a",
      input: "#cbd5e1",
      muted: "#e2e8f0",
      mutedForeground: "#64748b",
      primary: "#2563eb",
      primaryForeground: "#ffffff",
    }
    expect(getChatComposerMobileSurfaceRenderState({
      colors: composerSurfaceRenderStateColors,
      platform: "android",
    })).toEqual({
      surface: getChatComposerMobileSurfaceState(),
      input: getChatComposerMobileTextInputPlatformState("android"),
      colors: {
        surface: getChatComposerMobileSurfaceColors(composerSurfaceRenderStateColors),
        text: getChatComposerMobileTextColors(composerSurfaceRenderStateColors),
      },
    })
    const chatRuntimeMobileChromeColors = {
      ...composerSurfaceRenderStateColors,
      destructive: "#dc2626",
      info: "#0ea5e9",
      secondary: "#e0f2fe",
      success: "#16a34a",
      successForeground: "#ecfdf5",
      warning: "#d97706",
    }
    const composerChromeStyle = getChatComposerRuntimeChromeMobileStyleRenderState({
      colors: chatRuntimeMobileChromeColors,
      platform: "ios",
    })
    expect(composerChromeStyle.composer.input.paddingVertical).toBe(10)
    const composerChromeMobileSpacing = {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
    }
    const composerChromeMobileRadius = {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    }
    const composerChromeBorderWidths = {
      hairline: 0.5,
    }
    expect(createChatComposerRuntimeChromeMobileStyleSlots({
      renderState: composerChromeStyle,
      spacing: composerChromeMobileSpacing,
      radius: composerChromeMobileRadius,
      borderWidths: composerChromeBorderWidths,
      platform: "ios",
    })).toEqual({
      composer: createChatComposerMobileStyleSlots({
        renderState: composerChromeStyle.composer,
        spacing: composerChromeMobileSpacing,
        radius: composerChromeMobileRadius,
        borderWidths: composerChromeBorderWidths,
      }),
      imageAttachment: createChatComposerImageAttachmentMobileStyleSlots({
        renderState: composerChromeStyle.imageAttachment,
        spacing: composerChromeMobileSpacing,
        radius: composerChromeMobileRadius,
      }),
      promptLibrary: createChatConversationHomePromptLibraryMobileStyleSlots({
        renderState: composerChromeStyle.promptLibrary,
        spacing: composerChromeMobileSpacing,
        radius: composerChromeMobileRadius,
      }),
      promptEditorModal: createChatConversationHomePromptEditorMobileStyleSlots({
        renderState: composerChromeStyle.promptLibrary,
        inputPaddingVertical: composerChromeStyle.promptEditorInputPaddingVertical,
        spacing: composerChromeMobileSpacing,
        radius: composerChromeMobileRadius,
      }),
      handsFree: createChatComposerHandsFreeMobileStyleSlots({
        renderState: composerChromeStyle.handsFree,
        spacing: composerChromeMobileSpacing,
        radius: composerChromeMobileRadius,
        platform: "ios",
      }),
    })
    expect(createChatComposerMobileStyleSlots({
      renderState: composerChromeStyle.composer,
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
      },
      radius: {
        md: 8,
        lg: 12,
        xl: 16,
      },
      borderWidths: {
        hairline: 0.5,
      },
    })).toMatchObject({
      inputArea: {
        borderTopWidth: 0.5,
        borderColor: "#cbd5e1",
        backgroundColor: "#ffffff",
      },
      sttPreviewBox: {
        marginHorizontal: 8,
        marginTop: 4,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        backgroundColor: "#f8fafc",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
      },
      sttPreviewLabel: {
        color: "#64748b",
        marginBottom: 2,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "600",
      },
      sttPreviewText: {
        color: "#0f172a",
        fontSize: 16,
        lineHeight: 24,
      },
      inputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
      },
      input: {
        borderWidth: 1,
        borderColor: "#cbd5e1",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        fontSize: 16,
        flex: 1,
        maxHeight: 120,
      },
      visuallyHiddenComposerHint: {
        position: "absolute",
        left: -10000,
        width: 1,
        height: 1,
      },
      micWrapper: {
        paddingHorizontal: 8,
        paddingBottom: 8,
      },
      mic: {
        width: "100%",
        height: 56,
        flexDirection: "row",
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#cbd5e1",
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      },
      micOn: {
        backgroundColor: "#2563eb",
        borderColor: "#2563eb",
      },
      micLabel: {
        fontSize: 15,
        color: "#64748b",
        fontWeight: "600",
      },
      micLabelOn: {
        color: "#ffffff",
      },
      accessoryButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        backgroundColor: "#e2e8f0",
        alignItems: "center",
        justifyContent: "center",
      },
      accessoryButtonActive: {
        backgroundColor: "#ffffff",
        borderColor: "#2563eb",
      },
      submitButton: {
        backgroundColor: "#2563eb",
        minHeight: 44,
        minWidth: 44,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      },
      queueButton: {
        borderWidth: 1,
        borderColor: "#cbd5e1",
        backgroundColor: "#f8fafc",
        minHeight: 44,
        minWidth: 44,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      },
      submitButtonDisabled: {
        opacity: 0.5,
      },
      queueButtonText: {
        color: "#0f172a",
        fontWeight: "600",
        fontSize: 13,
      },
      submitButtonText: {
        color: "#ffffff",
        fontWeight: "600",
        fontSize: 13,
      },
      overlay: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 72,
        zIndex: 1000,
        elevation: 10,
        alignItems: "center",
        paddingHorizontal: 12,
        paddingBottom: 8,
      },
      overlayCard: {
        maxWidth: "88%",
        borderRadius: 16,
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        paddingHorizontal: 12,
        paddingVertical: 8,
      },
      overlayText: {
        color: "#f8fafc",
        fontSize: 12,
        lineHeight: 16,
        textAlign: "center",
      },
      overlayTranscript: {
        color: "#f8fafc",
        marginTop: 4,
        fontSize: 12,
        lineHeight: 16,
        opacity: 0.92,
      },
    })
    expect(composerChromeStyle.imageAttachment.colors.preview.borderColor).toBe("#cbd5e1")
    expect(createChatComposerImageAttachmentMobileStyleSlots({
      renderState: composerChromeStyle.imageAttachment,
      spacing: {
        xs: 4,
        sm: 8,
      },
      radius: {
        md: 8,
      },
    })).toMatchObject({
      row: {
        paddingHorizontal: 8,
        paddingTop: 4,
        paddingBottom: 2,
        gap: 4,
      },
      card: {
        width: 56,
        height: 56,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        overflow: "hidden",
        backgroundColor: "#e2e8f0",
        position: "relative",
      },
      preview: {
        width: "100%",
        height: "100%",
      },
      removeButton: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        alignItems: "center",
        justifyContent: "center",
      },
    })
    expect(composerChromeStyle.promptLibrary.colors.editorModal.saveButton.backgroundColor).toBe("#2563eb")
    expect(createChatConversationHomePromptLibraryMobileStyleSlots({
      renderState: composerChromeStyle.promptLibrary,
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
      },
      radius: {
        sm: 4,
        md: 8,
        lg: 12,
      },
    })).toMatchObject({
      chatHomeCard: {
        marginHorizontal: 8,
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        backgroundColor: "#ffffff",
        gap: 8,
      },
      chatHomeEmptyText: {
        color: "#64748b",
        fontSize: 12,
        lineHeight: 16,
        textAlign: "center",
        paddingVertical: 12,
      },
      chatHomeShortcutGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
      },
      chatHomeShortcutCard: {
        minHeight: 84,
        minWidth: "47%",
        flexGrow: 1,
        flexBasis: "47%",
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        backgroundColor: "#f8fafc",
        justifyContent: "center",
        gap: 4,
      },
      chatHomeShortcutCardAdd: {
        borderStyle: "dashed",
        borderColor: "#2563eb",
        backgroundColor: "transparent",
        alignItems: "center",
      },
      chatHomeShortcutCardPressed: {
        opacity: 0.88,
        transform: [{ scale: 0.99 }],
      },
      chatHomeShortcutSourcePill: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: "rgba(226, 232, 240, 0.45)",
      },
      chatHomeShortcutSourceLabel: {
        color: "#64748b",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0,
        textTransform: "uppercase",
      },
      chatHomeShortcutTitle: {
        color: "#0f172a",
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "600",
      },
      chatHomeShortcutTitleAdd: {
        color: "#2563eb",
        textAlign: "center",
      },
      chatHomeShortcutDescription: {
        color: "#64748b",
        fontSize: 12,
        marginTop: 3,
        lineHeight: 15,
      },
      chatHomeShortcutActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginTop: 4,
      },
      chatHomeShortcutActionButton: {
        minHeight: 32,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        backgroundColor: "#ffffff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      },
      chatHomeShortcutActionButtonPressed: {
        opacity: 0.78,
      },
      chatHomeShortcutActionText: {
        color: "#2563eb",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "600",
      },
      chatHomeShortcutActionDangerText: {
        color: "#dc2626",
      },
    })
    expect(createChatConversationHomePromptEditorMobileStyleSlots({
      renderState: composerChromeStyle.promptLibrary,
      inputPaddingVertical: composerChromeStyle.promptEditorInputPaddingVertical,
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
      },
      radius: {
        md: 8,
        lg: 12,
        xl: 16,
      },
    })).toMatchObject({
      modalKeyboardAvoidingView: {
        flex: 1,
      },
      modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        padding: 16,
      },
      modalContent: {
        backgroundColor: "#f8fafc",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#cbd5e1",
      },
      modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 12,
      },
      modalTitle: {
        flex: 1,
        fontSize: 18,
        lineHeight: 26,
        fontWeight: "600",
        marginBottom: 0,
        color: "#0f172a",
      },
      modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
      },
      modalLabel: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "600",
        color: "#0f172a",
        marginBottom: 4,
      },
      modalInput: {
        borderWidth: 1,
        borderColor: "#cbd5e1",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#f8fafc",
        marginBottom: 12,
        color: "#0f172a",
        fontSize: 16,
      },
      modalInputMultiline: {
        height: 120,
        paddingTop: 8,
        paddingBottom: 8,
      },
      modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
        marginTop: 8,
      },
      modalCancelButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
      },
      modalCancelButtonText: {
        color: "#64748b",
        fontWeight: "600",
      },
      modalSaveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#2563eb",
        minWidth: 100,
        alignItems: "center",
      },
      modalSaveButtonDisabled: {
        opacity: 0.5,
      },
      modalSaveButtonText: {
        color: "#ffffff",
        fontWeight: "600",
      },
    })
    expect(composerChromeStyle.promptEditorInputPaddingVertical).toBe(10)
    expect(createChatConversationHomePromptEditorModalStyleSlots({
      keyboardAvoidingViewStyle: "keyboard-view",
      overlayStyle: "overlay",
      contentStyle: "content",
      headerStyle: "header",
      titleStyle: "title",
      closeButtonStyle: "close-button",
      labelStyle: "label",
      inputStyle: "input",
      inputMultilineStyle: "input-multiline",
      actionsStyle: "actions",
      cancelButtonStyle: "cancel-button",
      cancelButtonTextStyle: "cancel-button-text",
      saveButtonStyle: "save-button",
      saveButtonDisabledStyle: "save-button-disabled",
      saveButtonTextStyle: "save-button-text",
    })).toEqual({
      keyboardAvoidingView: "keyboard-view",
      overlay: "overlay",
      content: "content",
      header: "header",
      title: "title",
      closeButton: "close-button",
      label: "label",
      input: "input",
      inputMultiline: "input-multiline",
      actions: "actions",
      cancelButton: "cancel-button",
      cancelButtonText: "cancel-button-text",
      saveButton: "save-button",
      saveButtonDisabled: "save-button-disabled",
      saveButtonText: "save-button-text",
    })
    const promptEditorModalStyleSlots = createChatConversationHomePromptEditorModalStyleSlotsFromStyleSource({
      styles: {
        modalKeyboardAvoidingView: "source-keyboard-view",
        modalOverlay: "source-overlay",
        modalContent: "source-content",
        modalHeader: "source-header",
        modalTitle: "source-title",
        modalCloseButton: "source-close-button",
        modalLabel: "source-label",
        modalInput: "source-input",
        modalInputMultiline: "source-input-multiline",
        modalActions: "source-actions",
        modalCancelButton: "source-cancel-button",
        modalCancelButtonText: "source-cancel-button-text",
        modalSaveButton: "source-save-button",
        modalSaveButtonDisabled: "source-save-button-disabled",
        modalSaveButtonText: "source-save-button-text",
      },
    })
    expect(promptEditorModalStyleSlots.keyboardAvoidingView).toBe("source-keyboard-view")
    expect(promptEditorModalStyleSlots.overlay).toBe("source-overlay")
    expect(promptEditorModalStyleSlots.content).toBe("source-content")
    expect(promptEditorModalStyleSlots.header).toBe("source-header")
    expect(promptEditorModalStyleSlots.title).toBe("source-title")
    expect(promptEditorModalStyleSlots.closeButton).toBe("source-close-button")
    expect(promptEditorModalStyleSlots.label).toBe("source-label")
    expect(promptEditorModalStyleSlots.input).toBe("source-input")
    expect(promptEditorModalStyleSlots.inputMultiline).toBe("source-input-multiline")
    expect(promptEditorModalStyleSlots.actions).toBe("source-actions")
    expect(promptEditorModalStyleSlots.cancelButton).toBe("source-cancel-button")
    expect(promptEditorModalStyleSlots.cancelButtonText).toBe("source-cancel-button-text")
    expect(promptEditorModalStyleSlots.saveButton).toBe("source-save-button")
    expect(promptEditorModalStyleSlots.saveButtonDisabled).toBe("source-save-button-disabled")
    expect(promptEditorModalStyleSlots.saveButtonText).toBe("source-save-button-text")
    expect(composerChromeStyle.handsFree.colors.controlButton.borderColor).toBe("#cbd5e1")
    expect(createChatComposerHandsFreeMobileStyleSlots({
      renderState: composerChromeStyle.handsFree,
      spacing: {
        xs: 4,
        sm: 8,
      },
      radius: {
        md: 8,
        lg: 12,
      },
      platform: "ios",
    })).toMatchObject({
      statusRow: {
        paddingHorizontal: 8,
        paddingTop: 4,
      },
      controlsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingTop: 4,
      },
      controlButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        backgroundColor: "#f8fafc",
        minHeight: 36,
        paddingHorizontal: 8,
        borderRadius: 8,
      },
      controlButtonText: {
        color: "#0f172a",
        fontWeight: "600",
        fontSize: 12,
      },
      debugPanel: {
        backgroundColor: "#e2e8f0",
        padding: 8,
        margin: 8,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#2563eb",
      },
      debugText: {
        fontSize: 12,
        color: "#64748b",
        fontFamily: "Menlo",
      },
    })
    const composerDockChrome = getChatComposerRuntimeDockMobileRenderState({
      colors: chatRuntimeMobileChromeColors,
      platform: "web",
    })
    expect(composerDockChrome.handsFreeControls.controlPressedOpacity).toBe(
      HANDS_FREE_COMPOSER_PRESENTATION.surface.mobile.controlButton.pressedOpacity,
    )
    expect(composerDockChrome.imageAttachmentControl.activeOpacity).toBe(
      CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.pressedOpacity,
    )
    expect(composerDockChrome.textToSpeechControl).toBe(composerDockChrome.imageAttachmentControl)
    expect(composerDockChrome.editBeforeSendControl).toBe(composerDockChrome.imageAttachmentControl)
    expect(composerDockChrome.textEntry.placeholderTextColor).toBe("#64748b")
    expect(composerDockChrome.textEntry.webAccessibility.isWebPlatform).toBe(true)
    expect(composerDockChrome.textEntry.webAccessibility.inputDescriptionNativeId).toBe("chat-composer-hint")
    expect(composerDockChrome.queueAction.activeOpacity).toBe(
      CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.pressedOpacity,
    )
    expect(composerDockChrome.submitAction.activeOpacity).toBe(
      CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.pressedOpacity,
    )
    expect(composerDockChrome.micButton.webPressedStyle).toEqual(getChatComposerMicMobileWebPressStyleState())
    expect(createChatComposerRuntimeDockMobileChromeProps<string>({
      colors: chatRuntimeMobileChromeColors,
      platform: "ios",
    }).micButton.webPressedStyle).toBeUndefined()
    expect(createChatComposerRuntimeDockMobileChromeProps({
      colors: chatRuntimeMobileChromeColors,
      platform: "web",
    })).toEqual(composerDockChrome)
    const composerDockProps = createChatComposerRuntimeDockMobileProps({
      chrome: {
        handsFreeControls: { controlPressedOpacity: 0.7 },
        imageAttachmentControl: { activeOpacity: 0.8 },
        textToSpeechControl: { activeOpacity: 0.81 },
        editBeforeSendControl: { activeOpacity: 0.82 },
        textEntry: {
          placeholderTextColor: "#64748b",
          webAccessibility: composerDockChrome.textEntry.webAccessibility,
        },
        queueAction: { activeOpacity: 0.83 },
        submitAction: { activeOpacity: 0.84 },
        micButton: { webPressedStyle: composerDockChrome.micButton.webPressedStyle },
      },
      speechPreviewText: "voice draft",
      pendingImages: ["image-1"],
      pendingImagesColors: chatRuntimeMobileChromeColors,
      onRemovePendingImage: "remove-image",
      handsFreeStatusPhase: "listening",
      handsFreeStatusLabel: "Listening",
      handsFreeStatusEnabled: true,
      handsFreeStatusWakePhrase: "wake up",
      handsFreeStatusSleepPhrase: "sleep now",
      handsFreeStatusLastError: null,
      handsFreeStatusForegroundOnly: false,
      onWakeHandsFree: "wake-hands-free",
      onSleepHandsFree: "sleep-hands-free",
      onResumeHandsFree: "resume-hands-free",
      onPauseHandsFree: "pause-hands-free",
      composerControlHasContent: true,
      composerControlConversationState: "complete",
      composerControlIsResponding: false,
      composerControlPendingImageCount: 1,
      composerControlTtsEnabled: true,
      composerControlEditBeforeSendEnabled: true,
      composerControlMicPhase: "listening",
      composerControlListening: true,
      composerControlMessageQueueEnabled: true,
      composerControlColors: chatRuntimeMobileChromeColors,
      onImageAttachmentPress: "attach-image",
      onTextToSpeechPress: "toggle-tts",
      onEditBeforeSendPress: "toggle-edit",
      textEntryInputRef: "input-ref",
      textEntryValue: "hello",
      onTextEntryChangeText: "change-text",
      onTextEntryKeyPress: "key-press",
      textEntryHandsFree: true,
      textEntryListening: true,
      textEntryWillCancel: false,
      textEntryLiveTranscript: "live words",
      textEntryWakePhrase: "wake up",
      textEntryPlaceholderFallback: "Fallback placeholder",
      onQueueActionPress: "queue-message",
      onSubmitActionPress: "send-message",
      onMicPressIn: "mic-in",
      onMicPressOut: "mic-out",
      onMicPress: "mic-primary",
      micWrapperRef: "mic-wrapper",
    })
    expect(composerDockProps.speechPreview).toEqual({
      label: CHAT_COMPOSER_PRESENTATION.sttPreview.label,
      text: "voice draft",
    })
    expect(composerDockProps.pendingImagesRail.images).toEqual(["image-1"])
    expect(composerDockProps.pendingImagesRail.onRemove).toBe("remove-image")
    expect(composerDockProps.handsFreeControls.controlPressedOpacity).toBe(0.7)
    expect(composerDockProps.handsFreeControls.onPause).toBe("pause-hands-free")
    expect(composerDockProps.imageAttachmentControl.onPress).toBe("attach-image")
    expect(composerDockProps.textToSpeechControl.renderState.accessibilityState.checked).toBe(true)
    expect(composerDockProps.editBeforeSendControl.shouldRender).toBe(false)
    expect(composerDockProps.textEntry.value).toBe("hello")
    expect(composerDockProps.textEntry.placeholderTextColor).toBe("#64748b")
    expect(composerDockProps.queueAction.shouldRender).toBe(true)
    expect(composerDockProps.submitAction.onPress).toBe("send-message")
    expect(composerDockProps.micButton.onPress).toBe("mic-primary")
    expect(composerDockProps.micButton.onPressIn).toBeUndefined()
    expect(composerDockProps.micWrapperRef).toBe("mic-wrapper")
    const runtimeChromeStyle = getChatRuntimeMobileChromeStyleRenderState({
      colors: chatRuntimeMobileChromeColors,
      platform: "android",
    })
    expect(runtimeChromeStyle.header.header.surface.agentSelectorButton.minHeight).toBe(44)
    expect(runtimeChromeStyle.composer.promptEditorInputPaddingVertical).toBe(8)
    expect(runtimeChromeStyle.messageQueuePanelWrapper.wrapper.paddingHorizontal).toBe("md")
    expect(runtimeChromeStyle.headerActionButton.minWidth).toBe(44)
    expect(runtimeChromeStyle.thread.toolApproval.title).toBe("Tool Approval Required")
    const chatRuntimeChromeMobileSpacing = {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
    }
    const chatRuntimeChromeMobileRadius = {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 999,
    }
    const chatRuntimeChromeMobileBorderWidths = {
      hairline: 0.5,
    }
    const expectedChatRuntimeThreadMobileStyleSlots = createChatRuntimeThreadMobileStyleSlots({
      renderState: runtimeChromeStyle.thread,
      spacing: chatRuntimeChromeMobileSpacing,
      radius: chatRuntimeChromeMobileRadius,
      borderWidths: chatRuntimeChromeMobileBorderWidths,
      platform: "android",
    })
    expect(createChatRuntimeMobileChromeStyleSlots({
      renderState: runtimeChromeStyle,
      spacing: chatRuntimeChromeMobileSpacing,
      radius: chatRuntimeChromeMobileRadius,
      borderWidths: chatRuntimeChromeMobileBorderWidths,
      platform: "android",
    })).toEqual({
      header: createChatRuntimeHeaderMobileStyleSlots({
        header: runtimeChromeStyle.header.header,
        sessionStatus: runtimeChromeStyle.header.sessionStatus,
        turnDuration: runtimeChromeStyle.header.turnDuration,
        headerPinButton: runtimeChromeStyle.headerPinButton,
        radius: chatRuntimeChromeMobileRadius,
        platform: "android",
      }),
      thread: expectedChatRuntimeThreadMobileStyleSlots,
      conversation: createChatRuntimeConversationMobileStyleSlots({
        renderState: runtimeChromeStyle.conversation,
        spacing: chatRuntimeChromeMobileSpacing,
        radius: chatRuntimeChromeMobileRadius,
        toolPreviewStatusIconWidth: expectedChatRuntimeThreadMobileStyleSlots.compactToolExecution.statusIndicator.width,
      }),
      composer: createChatComposerRuntimeChromeMobileStyleSlots({
        renderState: runtimeChromeStyle.composer,
        spacing: chatRuntimeChromeMobileSpacing,
        radius: chatRuntimeChromeMobileRadius,
        borderWidths: chatRuntimeChromeMobileBorderWidths,
        platform: "android",
      }),
      messageQueuePanelWrapper: createMessageQueuePanelMobileWrapperStyleSlots({
        wrapper: runtimeChromeStyle.messageQueuePanelWrapper.wrapper,
        spacing: chatRuntimeChromeMobileSpacing,
      }),
      headerActionButton: runtimeChromeStyle.headerActionButton,
      headerEdgeActionButton: runtimeChromeStyle.headerEdgeActionButton,
    })
    expect(createChatRuntimeToolActivityGroupMobileStyleSlots({
      renderState: runtimeChromeStyle.thread.toolActivityGroup,
      spacing: {
        xs: 4,
      },
      radius: {
        sm: 6,
      },
      platform: "android",
    })).toEqual({
      collapsed: {
        paddingVertical: 4,
        paddingHorizontal: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(14, 165, 233, 0.18)",
        borderLeftWidth: 2,
        borderLeftColor: "rgba(14, 165, 233, 0.42)",
        backgroundColor: "rgba(14, 165, 233, 0.04)",
        marginBottom: 2,
      },
      pressed: {
        opacity: 0.7,
      },
      headerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        overflow: "hidden",
      },
      countBadge: {
        minWidth: 18,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(14, 165, 233, 0.12)",
      },
      countBadgeText: {
        fontFamily: "monospace",
        fontSize: 9,
        fontWeight: "700",
        color: "#0ea5e9",
      },
      previewLine: {
        fontFamily: "monospace",
        fontSize: 10,
        color: "#64748b",
        flexShrink: 1,
        minWidth: 0,
      },
      footerButton: {
        alignSelf: "flex-end",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
        marginBottom: 2,
        paddingHorizontal: 4,
        paddingVertical: 3,
        borderRadius: 6,
      },
      footerText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#0ea5e9",
      },
    })
    expect(getChatComposerMobileTextInputPlatformState("ios")).toEqual({ paddingVertical: 10 })
    expect(getChatComposerMobileTextInputPlatformState("android")).toEqual({ paddingVertical: 8 })
    expect(getChatComposerMobileTextInputPlatformState("web")).toEqual({ paddingVertical: 10 })
    expect(CHAT_COMPOSER_PRESENTATION.submit.sendLabel).toBe("Send")
    expect(CHAT_COMPOSER_PRESENTATION.submit.mobileIcon.name).toBe("send-outline")
    expect(CHAT_COMPOSER_PRESENTATION.submit.mobileIcon.size).toBe(
      CHAT_COMPOSER_PRESENTATION.imageAttachment.mobileIcon.size,
    )
    expect(getChatComposerSubmitMobileActionState({
      presentation: {
        mode: "queue",
        submitAriaLabel: "Queue next message",
        submitHint: "Adds your message to the queue for this conversation.",
      },
      isHandsFree: false,
    })).toEqual({
      isQueueMode: true,
      isDisabled: false,
      label: CHAT_COMPOSER_PRESENTATION.queue.label,
      labelShouldRender: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.labelShouldRender,
      accessibilityRole: "button",
      accessibilityLabel: "Queue next message button",
      accessibilityHint: "Adds your message to the queue for this conversation.",
      accessibilityState: { disabled: false },
    })
    expect(getChatComposerSubmitMobileActionState({
      presentation: {
        mode: "queue",
        submitAriaLabel: "Queue next message",
        submitHint: "Adds your message to the queue for this conversation.",
      },
      isHandsFree: true,
      isDisabled: true,
    })).toEqual({
      isQueueMode: false,
      isDisabled: true,
      label: CHAT_COMPOSER_PRESENTATION.submit.sendLabel,
      labelShouldRender: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.labelShouldRender,
      accessibilityRole: "button",
      accessibilityLabel: "Send message button",
      accessibilityHint: CHAT_COMPOSER_PRESENTATION.submit.handsFreeAccessibilityHint,
      accessibilityState: { disabled: true },
    })
    expect(getChatComposerSubmitMobileIconState({ mode: "queue", isHandsFree: false })).toEqual({
      isQueueMode: true,
      name: CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.name,
      size: CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.size,
      colorToken: "primaryForeground",
    })
    expect(getChatComposerSubmitMobileIconState({ mode: "queue", isHandsFree: true })).toEqual({
      isQueueMode: false,
      name: CHAT_COMPOSER_PRESENTATION.submit.mobileIcon.name,
      size: CHAT_COMPOSER_PRESENTATION.submit.mobileIcon.size,
      colorToken: "primaryForeground",
    })
    expect(getChatComposerSubmitMobileRenderState({
      presentation: {
        mode: "queue",
        submitAriaLabel: "Queue next message",
        submitHint: "Adds your message to the queue for this conversation.",
      },
      isHandsFree: false,
      isDisabled: true,
      colors: {
        primary: "#2563eb",
        mutedForeground: "#64748b",
        primaryForeground: "#f8fafc",
      },
    })).toEqual({
      isQueueMode: true,
      isDisabled: true,
      label: CHAT_COMPOSER_PRESENTATION.queue.label,
      labelShouldRender: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.labelShouldRender,
      accessibilityRole: "button",
      accessibilityLabel: "Queue next message button",
      accessibilityHint: "Adds your message to the queue for this conversation.",
      accessibilityState: { disabled: true },
      icon: {
        name: CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.name,
        size: CHAT_COMPOSER_PRESENTATION.queue.mobileIcon.size,
        color: "#f8fafc",
      },
    })
    expect(CHAT_COMPOSER_PRESENTATION.mic.activeGlyph).toBe("🎙️")
    expect(CHAT_COMPOSER_PRESENTATION.mic.mobileIcon).toMatchObject({
      activeName: "mic",
      inactiveName: "mic-outline",
      size: 20,
    })
    expect(getChatComposerMicMobileIconState(false)).toEqual({
      isActive: false,
      name: CHAT_COMPOSER_PRESENTATION.mic.mobileIcon.inactiveName,
      size: CHAT_COMPOSER_PRESENTATION.mic.mobileIcon.size,
      colorToken: "mutedForeground",
    })
    expect(getChatComposerMicMobileIconState(true)).toEqual({
      isActive: true,
      name: CHAT_COMPOSER_PRESENTATION.mic.mobileIcon.activeName,
      size: CHAT_COMPOSER_PRESENTATION.mic.mobileIcon.size,
      colorToken: "primaryForeground",
    })
    expect(getChatComposerMicMobileActionState({
      label: "Hold to talk",
      handsFree: false,
      listening: false,
      willCancel: false,
    })).toEqual({
      label: "Hold to talk",
      accessibilityRole: "button",
      accessibilityLabel: "Voice input microphone button",
      accessibilityHint: "Press and hold to dictate your message. Release to send.",
      accessibilityState: {
        busy: false,
      },
      ariaBusy: false,
      labelSelectable: false,
    })
    expect(getChatComposerMicMobileActionState({
      label: "Listening",
      handsFree: false,
      listening: true,
      willCancel: true,
    })).toMatchObject({
      label: "Listening",
      accessibilityHint: "Voice input is active. Release to insert dictated text for editing.",
      accessibilityState: {
        busy: true,
      },
      ariaBusy: true,
      labelSelectable: false,
    })
    expect(getChatComposerMicMobileActionState({
      label: "Pause",
      handsFree: true,
      listening: false,
      willCancel: false,
    }).accessibilityHint).toBe("Double tap to start voice input. Double tap again to stop recording.")
    expect(getChatComposerMicMobileRenderState({
      label: "Listening",
      handsFree: false,
      listening: true,
      willCancel: true,
      colors: {
        primary: "#2563eb",
        mutedForeground: "#64748b",
        primaryForeground: "#f8fafc",
      },
    })).toEqual({
      isActive: true,
      label: "Listening",
      accessibilityRole: "button",
      accessibilityLabel: "Voice input microphone button",
      accessibilityHint: "Voice input is active. Release to insert dictated text for editing.",
      accessibilityState: {
        busy: true,
      },
      ariaBusy: true,
      labelSelectable: false,
      icon: {
        name: CHAT_COMPOSER_PRESENTATION.mic.mobileIcon.activeName,
        size: CHAT_COMPOSER_PRESENTATION.mic.mobileIcon.size,
        color: "#f8fafc",
      },
    })
    const composerControlRenderState = getChatComposerRuntimeControlMobileRenderState({
      hasContent: true,
      handsFree: false,
      presentation: getFollowUpInputPresentation({
        conversationState: "running",
        isQueueEnabled: true,
      }),
      pendingImageCount: 1,
      ttsEnabled: true,
      editBeforeSendEnabled: true,
      micPhase: "sleeping",
      listening: false,
      messageQueueEnabled: true,
      colors: {
        primary: "#2563eb",
        mutedForeground: "#64748b",
        primaryForeground: "#f8fafc",
      },
    })
    expect(composerControlRenderState.actionAvailability.queueAction.isDisabled).toBe(false)
    expect(composerControlRenderState.actionAvailability.submitAction.isDisabled).toBe(false)
    expect(composerControlRenderState.visibility.queueAction.shouldRender).toBe(false)
    expect(composerControlRenderState.controls).toEqual(getChatComposerMobileControlState({
      textToSpeechEnabled: true,
      editBeforeSendEnabled: true,
    }))
    expect(composerControlRenderState.imageAttachment.isActive).toBe(true)
    expect(composerControlRenderState.textToSpeech.isActive).toBe(true)
    expect(composerControlRenderState.editBeforeSend.isActive).toBe(true)
    expect(composerControlRenderState.queueAction.isDisabled).toBe(false)
    expect(composerControlRenderState.submitAction.isQueueMode).toBe(true)
    expect(composerControlRenderState.micButton.label).toBe("Hold")
    expect(CHAT_COMPOSER_PRESENTATION.voiceOverlay.releaseToEditLabel).toBe("Release to edit")
    expect(getChatComposerDesktopSurfaceState()).toBe(CHAT_COMPOSER_SURFACE_PRESENTATION.desktop)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.desktop.followUp.overlayFormClassName).toContain("bg-muted/30")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.desktop.followUp.tileFormClassName).toContain("bg-muted/20")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.desktop.followUp.textInputClassName).toContain("placeholder:text-muted-foreground/60")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.desktop.followUp.textareaClassName).toContain("resize-none")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.desktop.followUp.voiceButtonClassName).toContain("hover:text-red-600")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.desktop.followUp.killSwitchButtonClassName).toContain("text-red-500")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.desktop.followUp.iconClassName).toBe("h-3.5 w-3.5")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputArea.bottomInsetOffset).toBe(12)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputArea.micWrapperPaddingHorizontal).toBe("sm")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputArea.borderTopWidthToken).toBe("hairline")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputArea.backgroundColorToken).toBe("card")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.borderRadius).toBe("md")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.labelColorToken).toBe("mutedForeground")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.labelFontSize).toBe(12)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.labelLineHeight).toBe(16)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.labelFontWeight).toBe("600")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.textFontSize).toBe(16)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.textLineHeight).toBe(24)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputRow.flexDirection).toBe("row")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputRow.alignItems).toBe("center")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.flex).toBe(1)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.maxHeight).toBe(120)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.borderWidth).toBe(1)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.borderColorToken).toBe("input")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.borderRadius).toBe("lg")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.paddingHorizontal).toBe("md")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.paddingVerticalByPlatform).toEqual({
      ios: 10,
      android: 8,
      default: 10,
    })
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.backgroundColorToken).toBe("background")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.textColorToken).toBe("foreground")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.fontSize).toBe(16)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.visuallyHiddenComposerHint.position).toBe("absolute")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.visuallyHiddenComposerHint.left).toBe(-10000)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.visuallyHiddenComposerHint.width).toBe(1)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.visuallyHiddenComposerHint.height).toBe(1)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.webAccessibility.inputDescriptionNativeId).toBe("chat-composer-hint")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.webAccessibility.voiceStatusLiveRegionNativeId).toBe(
      "chat-voice-status-live-region",
    )
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.webAccessibility.voiceStatusLiveRegionPoliteness).toBe("polite")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.size).toBe(44)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.activeIconColorToken).toBe("primary")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.pressedOpacity).toBe(0.7)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.alignItems).toBe("center")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton.justifyContent).toBe("center")
    expect("glyphFontSize" in CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.accessoryButton).toBe(false)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.minWidth).toBe(44)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.foregroundColorToken).toBe("primaryForeground")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.pressedOpacity).toBe(0.7)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.labelShouldRender).toBe(false)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.flexDirection).toBe("row")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.alignItems).toBe("center")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.justifyContent).toBe("center")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.textColorToken).toBe("foreground")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.pressedOpacity).toBe(0.7)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.labelShouldRender).toBe(false)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.gap).toBe(4)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.width).toBe("100%")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.height).toBe(56)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.activeForegroundColorToken).toBe("primaryForeground")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.flexDirection).toBe("row")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.alignItems).toBe("center")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton.justifyContent).toBe("center")
    expect(getChatComposerMicMobileWebPressStyleState()).toEqual({
      userSelect: "none",
      WebkitUserSelect: "none",
      WebkitTouchCallout: "none",
      touchAction: "manipulation",
    })
    expect("glyphFontSize" in CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.micButton).toBe(false)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.position).toBe("absolute")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.left).toBe(0)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.right).toBe(0)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.alignItems).toBe("center")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.cardMaxWidth).toBe("88%")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.textColorToken).toBe("background")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.textAlign).toBe("center")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.textFontSize).toBe(12)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.textLineHeight).toBe(16)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.transcriptNumberOfLines).toBe(3)
    expect(getChatComposerMobileSurfaceState()).toBe(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile)
    expect(getChatRuntimeMobileSafeAreaLayoutState(21)).toEqual({
      chatScrollContent: {
        paddingBottom: 21,
      },
      scrollToBottomButton: {
        bottom: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.bottomOffset + 21,
      },
      voiceOverlay: {
        bottom: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.bottomOffset + 21,
      },
      inputArea: {
        paddingBottom: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputArea.bottomInsetOffset + 21,
      },
    })
    expect(createChatRuntimeMobileSafeAreaStyleSlots(getChatRuntimeMobileSafeAreaLayoutState(21))).toEqual({
      chatScrollContent: {
        paddingBottom: 21,
      },
      scrollToBottomButton: {
        bottom: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.bottomOffset + 21,
      },
      voiceOverlay: {
        bottom: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.bottomOffset + 21,
      },
      inputArea: {
        paddingBottom: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputArea.bottomInsetOffset + 21,
      },
    })
    expect(createChatRuntimeSafeAreaMergedStyleSlots({
      chatComposerStyles: {
        voiceOverlay: {
          overlay: "voice-overlay-base",
          card: "voice-card",
        },
        inputDock: {
          area: "input-area-base",
          row: "input-row",
        },
      },
      conversationDockStyles: {
        scrollToBottomButtonStyle: "scroll-button-base",
      },
      conversationViewportStyles: {
        scrollViewport: {
          contentContainerStyle: "scroll-content-base",
        },
      },
      safeAreaStyles: createChatRuntimeMobileSafeAreaStyleSlots(getChatRuntimeMobileSafeAreaLayoutState(21)),
    })).toEqual({
      scrollToBottomButtonStyle: [
        "scroll-button-base",
        {
          bottom: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.bottomOffset + 21,
        },
      ],
      scrollViewportContentContainerStyle: [
        "scroll-content-base",
        {
          paddingBottom: 21,
        },
      ],
      voiceOverlay: {
        overlay: [
          "voice-overlay-base",
          {
            bottom: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.voiceOverlay.bottomOffset + 21,
          },
        ],
        card: "voice-card",
      },
      inputDock: {
        area: [
          "input-area-base",
          {
            paddingBottom: CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputArea.bottomInsetOffset + 21,
          },
        ],
        row: "input-row",
      },
    })
    expect(createChatComposerRuntimeDockStyleSlots({
      chatComposerStyles: {
        inputDock: "composer-input-base",
        controls: "composer-controls",
      },
      safeAreaStyles: {
        inputDock: "composer-input-safe",
      },
    })).toEqual({
      inputDock: "composer-input-safe",
      controls: "composer-controls",
    })
    expect(createChatComposerStyleSlots({
      speechPreviewStyles: "speech-preview",
      pendingImagesRailStyles: "pending-images",
      voiceOverlayStyles: "voice-overlay",
      handsFreeControlsStyles: "hands-free-controls",
      accessoryButtonStyles: "accessory-button",
      textEntryStyles: "text-entry",
      queueActionStyles: "queue-action",
      submitActionStyles: "submit-action",
      micButtonStyles: "mic-button",
      inputDockStyles: "input-dock",
    })).toEqual({
      speechPreview: "speech-preview",
      pendingImagesRail: "pending-images",
      voiceOverlay: "voice-overlay",
      handsFreeControls: "hands-free-controls",
      accessoryButton: "accessory-button",
      textEntry: "text-entry",
      queueAction: "queue-action",
      submitAction: "submit-action",
      micButton: "mic-button",
      inputDock: "input-dock",
    })
    const composerStyleSlots = createChatComposerStyleSlotsFromStyleSource({
      styles: {
        sttPreviewBox: "source-stt-box",
        sttPreviewLabel: "source-stt-label",
        sttPreviewText: "source-stt-text",
        pendingImagesRow: "source-pending-row",
        pendingImageCard: "source-pending-card",
        pendingImagePreview: "source-pending-preview",
        pendingImageRemoveButton: "source-pending-remove",
        overlay: "source-overlay",
        overlayCard: "source-overlay-card",
        overlayText: "source-overlay-label",
        overlayTranscript: "source-overlay-transcript",
        handsFreeStatusRow: "source-handsfree-status-row",
        handsFreeControlsRow: "source-handsfree-controls-row",
        handsFreeControlButton: "source-handsfree-button",
        handsFreeControlButtonText: "source-handsfree-button-text",
        ttsToggle: "source-tts-toggle",
        ttsToggleOn: "source-tts-on",
        input: "source-input",
        visuallyHiddenComposerHint: "source-hidden-hint",
        queueButton: "source-queue-button",
        sendButtonDisabled: "source-send-disabled",
        queueButtonText: "source-queue-text",
        sendButton: "source-send-button",
        sendButtonText: "source-send-text",
        mic: "source-mic",
        micOn: "source-mic-on",
        micLabel: "source-mic-label",
        micLabelOn: "source-mic-label-on",
        inputArea: "source-input-area",
        inputRow: "source-input-row",
        micWrapper: "source-mic-wrapper",
      },
    })
    expect(composerStyleSlots.speechPreview.box).toBe("source-stt-box")
    expect(composerStyleSlots.pendingImagesRail.removeButton).toBe("source-pending-remove")
    expect(composerStyleSlots.voiceOverlay.transcript).toBe("source-overlay-transcript")
    expect(composerStyleSlots.handsFreeControls.controlButtonText).toBe("source-handsfree-button-text")
    expect(composerStyleSlots.accessoryButton.activeStyle).toBe("source-tts-on")
    expect(composerStyleSlots.textEntry.visuallyHiddenHint).toBe("source-hidden-hint")
    expect(composerStyleSlots.queueAction.disabledButton).toBe("source-send-disabled")
    expect(composerStyleSlots.submitAction.button).toBe("source-send-button")
    expect(composerStyleSlots.micButton.activeLabel).toBe("source-mic-label-on")
    expect(composerStyleSlots.inputDock.micWrapper).toBe("source-mic-wrapper")
    expect(createChatMessageConnectionBannerStyleSlots({
      bannerStyle: "banner",
      reconnectingStyle: "reconnecting",
      failedStyle: "failed",
      contentStyle: "content",
      iconStyle: "icon",
      textContainerStyle: "text-container",
      titleStyle: "title",
      subtitleStyle: "subtitle",
      retryButtonStyle: "retry-button",
      retryButtonTextStyle: "retry-button-text",
    })).toEqual({
      banner: "banner",
      reconnecting: "reconnecting",
      failed: "failed",
      content: "content",
      icon: "icon",
      textContainer: "text-container",
      title: "title",
      subtitle: "subtitle",
      retryButton: "retry-button",
      retryButtonText: "retry-button-text",
    })
    expect(createChatMessageConversationDockStyleSlots({
      scrollToBottomButtonStyle: "scroll-button",
      queuePanelStyle: "queue-panel",
      connectionBannerStyles: "connection-banner",
    })).toEqual({
      scrollToBottomButtonStyle: "scroll-button",
      queuePanelStyle: "queue-panel",
      connectionBanner: "connection-banner",
    })
    const conversationDockStyleSlots = createChatMessageConversationDockStyleSlotsFromStyleSource({
      styles: {
        scrollToBottomButton: "source-scroll-button",
        messageQueuePanelWrapper: "source-queue-panel",
        connectionBanner: "source-banner",
        connectionBannerReconnecting: "source-reconnecting",
        connectionBannerFailed: "source-failed",
        connectionBannerContent: "source-content",
        connectionBannerIcon: "source-icon",
        connectionBannerTextContainer: "source-text-container",
        connectionBannerText: "source-title",
        connectionBannerSubtext: "source-subtitle",
        retryButton: "source-retry-button",
        retryButtonText: "source-retry-button-text",
      },
    })
    expect(conversationDockStyleSlots.scrollToBottomButtonStyle).toBe("source-scroll-button")
    expect(conversationDockStyleSlots.queuePanelStyle).toBe("source-queue-panel")
    expect(conversationDockStyleSlots.connectionBanner).toEqual({
      banner: "source-banner",
      reconnecting: "source-reconnecting",
      failed: "source-failed",
      content: "source-content",
      icon: "source-icon",
      textContainer: "source-text-container",
      title: "source-title",
      subtitle: "source-subtitle",
      retryButton: "source-retry-button",
      retryButtonText: "source-retry-button-text",
    })
    expect(createChatMessageConversationViewportStyleSlots({
      frameStyles: "frame",
      scrollViewportStyles: "scroll-viewport",
      loadingStateStyles: "loading-state",
      homeQuickStartStyles: "home-quick-starts",
      historyBannerStyles: "history-banner",
      stepSummaryStyles: "step-summary",
      debugPanelStyles: "debug-panels",
    })).toEqual({
      frame: "frame",
      scrollViewport: "scroll-viewport",
      loadingState: "loading-state",
      homeQuickStarts: "home-quick-starts",
      historyBanner: "history-banner",
      stepSummary: "step-summary",
      debugPanels: "debug-panels",
    })
    const conversationViewportStyleSlots = createChatMessageConversationViewportStyleSlotsFromStyleSource({
      styles: {
        keyboardAvoidingContainer: "source-keyboard",
        chatRoot: "source-root",
        chatScroll: "source-scroll",
        chatScrollContent: "source-scroll-content",
        loadingState: "source-loading",
        loadingSpinner: "source-spinner",
        chatHomeCard: "source-home-card",
        chatHomeEmptyText: "source-home-empty",
        chatHomeShortcutGrid: "source-home-grid",
        chatHomeShortcutCard: "source-shortcut-card",
        chatHomeShortcutCardAdd: "source-shortcut-add",
        chatHomeShortcutCardDisabled: "source-shortcut-disabled",
        chatHomeShortcutCardPressed: "source-shortcut-pressed",
        chatHomeShortcutSourcePill: "source-pill",
        chatHomeShortcutSourceLabel: "source-label",
        chatHomeShortcutAddIcon: "source-add-icon",
        chatHomeShortcutTitle: "source-title",
        chatHomeShortcutTitleAdd: "source-title-add",
        chatHomeShortcutDescription: "source-description",
        chatHomeShortcutActions: "source-actions",
        chatHomeShortcutActionButton: "source-action-button",
        chatHomeShortcutActionButtonPressed: "source-action-button-pressed",
        chatHomeShortcutActionText: "source-action-text",
        chatHomeShortcutActionDangerText: "source-danger-text",
        loadOlderContainer: "source-history-container",
        loadOlderText: "source-history-summary",
        loadOlderButton: "source-history-button",
        loadOlderButtonPressed: "source-history-button-pressed",
        loadOlderButtonText: "source-history-button-text",
        stepSummaryCard: "source-step-card",
        stepSummaryHeader: "source-step-header",
        stepSummaryTitle: "source-step-title",
        stepSummaryBadge: "source-step-badge",
        stepSummaryBadgeText: "source-step-badge-text",
        stepSummaryAction: "source-step-action",
        stepSummaryMeta: "source-step-meta",
        stepSummaryPreview: "source-step-preview",
        debugInfo: "source-debug-panel",
        debugText: "source-debug-text",
      },
    })
    expect(conversationViewportStyleSlots.frame.keyboardAvoidingStyle).toBe("source-keyboard")
    expect(conversationViewportStyleSlots.scrollViewport.contentContainerStyle).toBe(
      "source-scroll-content",
    )
    expect(conversationViewportStyleSlots.loadingState.spinnerStyle).toBe("source-spinner")
    expect(conversationViewportStyleSlots.homeQuickStarts.shortcutCardPressed).toBe(
      "source-shortcut-pressed",
    )
    expect(conversationViewportStyleSlots.historyBanner.loadButtonPressed).toBe(
      "source-history-button-pressed",
    )
    expect(conversationViewportStyleSlots.stepSummary.badgeText).toBe("source-step-badge-text")
    expect(conversationViewportStyleSlots.debugPanels.textStyle).toBe("source-debug-text")
    expect(createChatMessageRuntimeDockStyleSlots({
      conversationDockStyles: {
        queuePanelStyle: "queue-panel",
        connectionBanner: "connection-banner",
      },
      composerStyles: "composer-dock",
      safeAreaStyles: {
        scrollToBottomButtonStyle: "scroll-safe",
        voiceOverlay: "voice-safe",
      },
    })).toEqual({
      scrollToBottomButtonStyle: "scroll-safe",
      voiceOverlay: "voice-safe",
      queuePanelStyle: "queue-panel",
      connectionBanner: "connection-banner",
      composer: "composer-dock",
    })
    expect(createChatMessageRuntimeViewportStyleSlots({
      conversationViewportStyles: {
        scrollViewport: {
          style: "scroll-frame",
          contentContainerStyle: "scroll-content-base",
        },
        loadingState: "loading-state",
        homeQuickStarts: "home-quick-starts",
        historyBanner: "history-banner",
        stepSummary: "step-summary",
        debugPanels: "debug-panels",
      },
      safeAreaStyles: {
        scrollViewportContentContainerStyle: "scroll-content-safe",
      },
    })).toEqual({
      scrollViewport: {
        style: "scroll-frame",
        contentContainerStyle: "scroll-content-safe",
      },
      loadingState: "loading-state",
      homeQuickStarts: "home-quick-starts",
      historyBanner: "history-banner",
      stepSummary: "step-summary",
      debugPanels: "debug-panels",
    })
    expect(createChatMessageRuntimeSurfaceStyleSlots({
      conversationViewportStyles: {
        frame: "conversation-frame",
      },
      dockStyles: "runtime-dock",
      viewportStyles: "runtime-viewport",
    })).toEqual({
      frame: "conversation-frame",
      dock: "runtime-dock",
      viewport: "runtime-viewport",
    })
    expect(createChatMessageRuntimeThreadStyleSlots({
      threadSurfaceStyles: "thread-surface",
      threadBodyStyles: "thread-body",
    })).toEqual({
      surface: "thread-surface",
      body: "thread-body",
    })
    expect(createChatMessageConversationThreadStyleSlots({
      threadSurfaceStyles: "thread-surface",
      threadBodyStyles: "thread-body",
      actionStyles: "message-actions",
    })).toEqual({
      runtimeThread: {
        surface: "thread-surface",
        body: "thread-body",
      },
      actionSet: "message-actions",
    })
    expect(createChatMessageRuntimeChromeStyleSlots({
      conversationThreadStyles: {
        actionSet: "message-actions",
        runtimeThread: "message-thread",
      },
      promptEditorStyles: "prompt-editor",
    })).toEqual({
      actionStyles: "message-actions",
      threadStyles: "message-thread",
      promptEditorStyles: "prompt-editor",
    })
    expect(createChatRuntimeHeaderStyleSlots({
      actionsRowStyle: "actions-row",
      agentSelectorStyles: "agent-selector",
      conversationStatusStyles: "conversation-status",
      turnDurationStyles: "turn-duration",
      iconButtonStyles: "icon-buttons",
    })).toEqual({
      actionsRowStyle: "actions-row",
      agentSelector: "agent-selector",
      conversationStatus: "conversation-status",
      turnDuration: "turn-duration",
      iconButtons: "icon-buttons",
    })
    const headerStyleSlots = createChatRuntimeHeaderStyleSlotsFromStyleSource({
      styles: {
        headerActionsRow: "source-actions-row",
        headerAgentSelectorButton: "source-agent-button",
        headerAgentSelectorChip: "source-agent-chip",
        headerAgentSelectorText: "source-agent-label",
        headerConversationChip: "source-conversation-chip",
        headerConversationChipText: "source-conversation-text",
        headerConversationSpinner: "source-conversation-spinner",
        headerDurationChip: "source-duration-chip",
        headerDurationChipLive: "source-duration-chip-live",
        headerDurationChipText: "source-duration-text",
        headerDurationChipTextLive: "source-duration-text-live",
        headerEdgeActionButton: "source-edge-button",
        headerPinButton: "source-pin-button",
        headerPinButtonActive: "source-pin-button-active",
        headerActionButton: "source-action-button",
        headerKillSwitchIconContainer: "source-kill-switch-icon",
        headerHandsFreeIconContainer: "source-hands-free-icon",
      },
    })
    expect(headerStyleSlots.actionsRowStyle).toBe("source-actions-row")
    expect(headerStyleSlots.agentSelector.label).toBe("source-agent-label")
    expect(headerStyleSlots.conversationStatus.spinner).toBe("source-conversation-spinner")
    expect(headerStyleSlots.turnDuration.liveText).toBe("source-duration-text-live")
    expect(headerStyleSlots.iconButtons.pinActiveStyle).toBe("source-pin-button-active")
    expect(headerStyleSlots.iconButtons.handsFreeIconContainerStyle).toBe(
      "source-hands-free-icon",
    )
    expect(createChatRuntimeHeaderChromeSlots({
      colors: "theme-colors",
      spinnerSource: "spinner-source",
      styles: "header-styles",
    })).toEqual({
      colors: "theme-colors",
      spinnerSource: "spinner-source",
      styles: "header-styles",
    })
    expect(createChatMessageRuntimeChromeSlots({
      colors: "theme-colors",
      platform: "ios",
      spinnerSource: "spinner-source",
      styles: "runtime-styles",
    })).toEqual({
      colors: "theme-colors",
      platform: "ios",
      spinnerSource: "spinner-source",
      styles: "runtime-styles",
    })
    expect(createChatMessageRuntimeSurfaceChromeSlots({
      surfaceStyles: "surface-styles",
    })).toEqual({
      runtimeSurface: {
        props: {
          styles: "surface-styles",
        },
      },
    })
    expect(createChatRuntimeChromeSlots({
      environment: "environment",
      header: "header",
      messageRuntime: "message-runtime",
      surface: "surface",
    })).toEqual({
      environment: "environment",
      header: "header",
      messageRuntime: "message-runtime",
      surface: "surface",
    })
    const mobileChromeStyleSource = {
      headerActionsRow: "header-actions-row",
      headerAgentSelectorButton: "header-agent-button",
      headerAgentSelectorChip: "header-agent-chip",
      headerAgentSelectorText: "header-agent-text",
      headerConversationChip: "header-conversation-chip",
      headerConversationChipText: "header-conversation-text",
      headerConversationSpinner: "header-conversation-spinner",
      headerDurationChip: "header-duration-chip",
      headerDurationChipLive: "header-duration-chip-live",
      headerDurationChipText: "header-duration-text",
      headerDurationChipTextLive: "header-duration-text-live",
      headerEdgeActionButton: "header-edge-button",
      headerPinButton: "header-pin-button",
      headerPinButtonActive: "header-pin-button-active",
      headerActionButton: "header-action-button",
      headerKillSwitchIconContainer: "header-kill-switch-icon",
      headerHandsFreeIconContainer: "header-hands-free-icon",
      modalKeyboardAvoidingView: "prompt-keyboard",
      modalOverlay: "prompt-overlay",
      modalContent: "prompt-content",
      modalHeader: "prompt-header",
      modalTitle: "prompt-title",
      modalCloseButton: "prompt-close",
      modalLabel: "prompt-label",
      modalInput: "prompt-input",
      modalInputMultiline: "prompt-input-multiline",
      modalActions: "prompt-actions",
      modalCancelButton: "prompt-cancel",
      modalCancelButtonText: "prompt-cancel-text",
      modalSaveButton: "prompt-save",
      modalSaveButtonDisabled: "prompt-save-disabled",
      modalSaveButtonText: "prompt-save-text",
      messageQueuePanelWrapper: "queue-wrapper",
      connectionBanner: "connection-banner",
      connectionBannerReconnecting: "connection-reconnecting",
      connectionBannerFailed: "connection-failed",
      connectionBannerContent: "connection-content",
      connectionBannerIcon: "connection-icon",
      connectionBannerTextContainer: "connection-text-container",
      connectionBannerText: "connection-text",
      connectionBannerSubtext: "connection-subtext",
      retryButton: "retry-button",
      retryButtonText: "retry-button-text",
      keyboardAvoidingContainer: "keyboard-container",
      chatRoot: "chat-root",
      chatScroll: "chat-scroll",
      chatScrollContent: "chat-scroll-content",
      loadingState: "loading-state",
      loadingSpinner: "loading-spinner",
      chatHomeCard: "home-card",
      chatHomeEmptyText: "home-empty",
      loadOlderContainer: "load-older",
      loadOlderText: "load-older-text",
      loadOlderButton: "load-older-button",
      loadOlderButtonPressed: "load-older-button-pressed",
      loadOlderButtonText: "load-older-button-text",
      stepSummaryCard: "step-card",
      stepSummaryHeader: "step-header",
      stepSummaryTitle: "step-title",
      stepSummaryBadge: "step-badge",
      stepSummaryBadgeText: "step-badge-text",
      stepSummaryAction: "step-action",
      stepSummaryMeta: "step-meta",
      stepSummaryPreview: "step-preview",
      debugInfo: "debug-panel",
      debugText: "debug-text",
      sttPreviewBox: "speech-preview",
      pendingImagesRow: "pending-images",
      overlay: "voice-overlay",
      inputArea: "input-area",
      inputRow: "input-row",
      micWrapper: "mic-wrapper",
      msg: "message-surface",
    } as any
    const mobileChromeSafeAreaLayout = getChatRuntimeMobileSafeAreaLayoutState(24)
    const getMobileChromeToneStyle = (toneStyleSlot: string) => mobileChromeStyleSource[toneStyleSlot]
    const mobileChromeConversationThreadStyles = createChatMessageConversationThreadStyleSlotsFromStyleSource({
      styles: mobileChromeStyleSource,
      getToneStyle: getMobileChromeToneStyle,
    })
    const mobileChromeComposerStyles = createChatComposerStyleSlotsFromStyleSource({
      styles: mobileChromeStyleSource,
    })
    const mobileChromeConversationDockStyles = createChatMessageConversationDockStyleSlotsFromStyleSource({
      styles: mobileChromeStyleSource,
    })
    const mobileChromeConversationViewportStyles = createChatMessageConversationViewportStyleSlotsFromStyleSource({
      styles: mobileChromeStyleSource,
    })
    const mobileChromeSafeAreaStyles = createChatRuntimeMobileSafeAreaStyleSlots(mobileChromeSafeAreaLayout)
    const mobileChromeMergedSafeAreaStyles = createChatRuntimeSafeAreaMergedStyleSlots({
      chatComposerStyles: mobileChromeComposerStyles,
      conversationDockStyles: mobileChromeConversationDockStyles,
      conversationViewportStyles: mobileChromeConversationViewportStyles,
      safeAreaStyles: mobileChromeSafeAreaStyles,
    })
    const mobileChromeComposerRuntimeDockStyles = createChatComposerRuntimeDockStyleSlots({
      chatComposerStyles: mobileChromeComposerStyles,
      safeAreaStyles: mobileChromeMergedSafeAreaStyles,
    })
    const mobileChromeRuntimeDockStyles = createChatMessageRuntimeDockStyleSlots({
      conversationDockStyles: mobileChromeConversationDockStyles,
      composerStyles: mobileChromeComposerRuntimeDockStyles,
      safeAreaStyles: mobileChromeMergedSafeAreaStyles,
    })
    const mobileChromeRuntimeViewportStyles = createChatMessageRuntimeViewportStyleSlots({
      conversationViewportStyles: mobileChromeConversationViewportStyles,
      safeAreaStyles: mobileChromeMergedSafeAreaStyles,
    })
    expect(createChatRuntimeMobileChromeSlotsFromStyleSource({
      colors: "theme-colors",
      platform: "ios",
      spinnerSource: "spinner-source",
      styles: mobileChromeStyleSource,
      safeAreaLayout: mobileChromeSafeAreaLayout,
      getToneStyle: getMobileChromeToneStyle,
    })).toEqual(createChatRuntimeChromeSlots({
      environment: {
        platform: "ios",
      },
      header: createChatRuntimeHeaderChromeSlots({
        colors: "theme-colors",
        spinnerSource: "spinner-source",
        styles: createChatRuntimeHeaderStyleSlotsFromStyleSource({
          styles: mobileChromeStyleSource,
        }),
      }),
      messageRuntime: createChatMessageRuntimeChromeSlots({
        colors: "theme-colors",
        platform: "ios",
        spinnerSource: "spinner-source",
        styles: createChatMessageRuntimeChromeStyleSlots({
          conversationThreadStyles: mobileChromeConversationThreadStyles,
          promptEditorStyles: createChatConversationHomePromptEditorModalStyleSlotsFromStyleSource({
            styles: mobileChromeStyleSource,
          }),
        }),
      }),
      surface: createChatMessageRuntimeSurfaceChromeSlots({
        surfaceStyles: createChatMessageRuntimeSurfaceStyleSlots({
          conversationViewportStyles: mobileChromeConversationViewportStyles,
          dockStyles: mobileChromeRuntimeDockStyles,
          viewportStyles: mobileChromeRuntimeViewportStyles,
        }),
      }),
    }))
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.alignItems).toBe("center")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.justifyContent).toBe("center")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.height).toBe("100%")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.minHeight).toBe(44)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.pressedOpacity).toBe(0.78)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.flexDirection).toBe("row")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.alignItems).toBe("center")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.backgroundColorToken).toBe("primary")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.backgroundAlpha).toBe(0.2)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.maxWidth).toBe(160)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorText.colorToken).toBe("primary")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorText.numberOfLines).toBe(1)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.accessibilityRole).toBe("button")
    expect(getChatRuntimeAgentSelectorMobileColors({
      primary: "#2563eb",
    })).toEqual({
      chip: {
        backgroundColor: "rgba(37, 99, 235, 0.2)",
      },
      text: {
        color: "#2563eb",
      },
      icon: {
        color: "#2563eb",
      },
    })
    expect(createChatRuntimeAgentSelectorMobileStyleSlots({
      surface: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile,
      colors: getChatRuntimeAgentSelectorMobileColors({
        primary: "#2563eb",
      }),
    })).toEqual({
      button: {
        alignItems: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.alignItems,
        justifyContent: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.justifyContent,
        height: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.height,
        minHeight: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorButton.minHeight,
      },
      chip: {
        flexDirection: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.flexDirection,
        alignItems: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.alignItems,
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        maxWidth: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.maxWidth,
        paddingHorizontal: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.paddingHorizontal,
        paddingVertical: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.paddingVertical,
        borderRadius: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.borderRadius,
        gap: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.gap,
      },
      text: {
        fontSize: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorText.fontSize,
        color: "#2563eb",
        fontWeight: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorText.fontWeight,
      },
    })
    expect(createChatRuntimeHeaderActionsRowMobileStyleSlot({
      surface: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.actionsRow,
    })).toEqual({
      flexDirection: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.actionsRow.flexDirection,
      alignItems: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.actionsRow.alignItems,
      gap: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.actionsRow.gap,
    })
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.edgeActionButton.accessibilityRole).toBe("button")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.edgeActionButton.pressedOpacity).toBe(0.78)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.backIcon.colorToken).toBe("foreground")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.accessibilityRole).toBe("button")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.pressedOpacity).toBe(0.78)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.backgroundColorToken).toBe("background")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.activeBackgroundColorToken).toBe("primary")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.activeBackgroundAlpha).toBe(0.09)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.inactiveIconColorToken).toBe("mutedForeground")
    const pinMobileColors = {
      background: "#ffffff",
      border: "#e2e8f0",
      mutedForeground: "#64748b",
      primary: "#2563eb",
    }
    const headerPinButtonTouchTarget = {
      minWidth: 44,
      minHeight: 44,
      paddingHorizontal: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.horizontalPadding,
      paddingVertical: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.verticalPadding,
      marginHorizontal: 4,
      alignItems: "center",
      justifyContent: "center",
    } as const
    expect(getChatRuntimePinMobileColors(false, pinMobileColors)).toEqual({
      button: {
        borderColor: "#e2e8f0",
        backgroundColor: "#ffffff",
      },
      icon: {
        color: "#64748b",
      },
    })
    expect(getChatRuntimePinMobileColors(true, pinMobileColors)).toEqual({
      button: {
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.09)",
      },
      icon: {
        color: "#2563eb",
      },
    })
    const pinnedHeaderButtonStyle = createChatRuntimeHeaderPinButtonMobileStyleSlot({
      touchTarget: headerPinButtonTouchTarget,
      borderRadius: 12,
      borderWidth: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.borderWidth,
      colors: getChatRuntimePinMobileColors(true, pinMobileColors).button,
    })
    expect(pinnedHeaderButtonStyle).toEqual({
      minWidth: 44,
      minHeight: 44,
      paddingHorizontal: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.horizontalPadding,
      paddingVertical: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.verticalPadding,
      marginHorizontal: 4,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.borderWidth,
      borderColor: "#2563eb",
      backgroundColor: "rgba(37, 99, 235, 0.09)",
    })
    const headerPinButtonStyleSlots = createChatRuntimeHeaderPinButtonMobileStyleSlots({
      surface: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile,
      touchTarget: headerPinButtonTouchTarget,
      colors: {
        inactive: getChatRuntimePinMobileColors(false, pinMobileColors),
        active: getChatRuntimePinMobileColors(true, pinMobileColors),
      },
      radius: {
        lg: 12,
      },
    })
    expect(headerPinButtonStyleSlots.active).toEqual(pinnedHeaderButtonStyle)
    expect(headerPinButtonStyleSlots.inactive).toEqual({
      minWidth: 44,
      minHeight: 44,
      paddingHorizontal: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.horizontalPadding,
      paddingVertical: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.verticalPadding,
      marginHorizontal: 4,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.borderWidth,
      borderColor: "#e2e8f0",
      backgroundColor: "#ffffff",
    })
    expect(getChatRuntimePinMobileRenderState({
      isPinned: true,
      colors: pinMobileColors,
    })).toEqual({
      isPinned: true,
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      accessibilityLabel: CHAT_RUNTIME_PRESENTATION.pin.unpinChatLabel,
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.pin.unpinChatHint,
      button: {
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.09)",
      },
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.pinnedName,
        size: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.size,
        color: "#2563eb",
      },
    })
    const headerMobileStyleColors = {
      ...pinMobileColors,
      foreground: "#0f172a",
      destructive: "#dc2626",
      info: "#0ea5e9",
      success: "#16a34a",
      warning: "#d97706",
    }
    expect(getChatRuntimeHeaderMobileStyleRenderState({
      colors: headerMobileStyleColors,
    })).toEqual({
      surface: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile,
      agentSelector: getChatRuntimeAgentSelectorMobileColors(headerMobileStyleColors),
      pinButton: {
        inactive: getChatRuntimePinMobileColors(false, headerMobileStyleColors),
        active: getChatRuntimePinMobileColors(true, headerMobileStyleColors),
      },
      killSwitchButton: getChatRuntimeKillSwitchMobileColors(headerMobileStyleColors),
    })
    expect(getChatRuntimeHeaderChromeMobileStyleRenderState({
      colors: headerMobileStyleColors,
    })).toEqual({
      header: getChatRuntimeHeaderMobileStyleRenderState({
        colors: headerMobileStyleColors,
      }),
      sessionStatus: getSessionStatusMobileStyleRenderState({
        colors: headerMobileStyleColors,
      }),
      turnDuration: {
        standard: getChatRuntimeTurnDurationHeaderMobileRenderState({
          durationMs: 1,
          colors: headerMobileStyleColors,
        }),
        live: getChatRuntimeTurnDurationHeaderMobileRenderState({
          durationMs: 1,
          isLive: true,
          colors: headerMobileStyleColors,
        }),
      },
    })
    const navigationHeaderState = getChatRuntimeNavigationHeaderMobileRenderState({
      agentName: "Research",
      isPinned: true,
      handsFree: true,
      isResponding: true,
      turnDurationMs: 1200,
      turnDurationIsLive: true,
      colors: headerMobileStyleColors,
    })
    expect(navigationHeaderState.agentSelectorRenderState.label).toBe("Research")
    expect(navigationHeaderState.agentSelectorLabelNumberOfLines).toBe(
      CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorText.numberOfLines,
    )
    expect(navigationHeaderState.backButtonRenderState.icon.color).toBe("#0f172a")
    expect(navigationHeaderState.pinButtonIsActive).toBe(true)
    expect(navigationHeaderState.conversationStatusRenderState).toEqual(getSessionStatusMobileRenderState({
      session: { conversationState: "running" },
      colors: headerMobileStyleColors,
    }))
    expect(navigationHeaderState.turnDurationRenderState).toEqual(getChatRuntimeTurnDurationHeaderMobileRenderState({
      durationMs: 1200,
      isLive: true,
      colors: headerMobileStyleColors,
    }))
    const headerDurationStyleSlots = createChatRuntimeTurnDurationHeaderMobileStyleSlots({
      renderState: navigationHeaderState.turnDurationRenderState,
      platform: "ios",
    })
    const headerDurationLiveColors = getChatRuntimeTurnDurationHeaderMobileBadgeColors(
      { isLive: true },
      headerMobileStyleColors,
    )
    expect(headerDurationStyleSlots.chip.backgroundColor).toBe(headerDurationLiveColors.chip.backgroundColor)
    expect(headerDurationStyleSlots.chip.maxWidth).toBe(
      CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.durationChip.maxWidth,
    )
    expect(headerDurationStyleSlots.text.fontFamily).toBe(
      CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontFamilyByPlatform.ios,
    )
    expect(headerDurationStyleSlots.text.color).toBe(headerDurationLiveColors.text.color)
    const headerDurationStyleSlotVariants = createChatRuntimeTurnDurationHeaderMobileStyleSlotVariants({
      renderState: getChatRuntimeHeaderChromeMobileStyleRenderState({
        colors: headerMobileStyleColors,
      }).turnDuration,
      platform: "ios",
    })
    expect(headerDurationStyleSlotVariants.live).toEqual(headerDurationStyleSlots)
    expect(headerDurationStyleSlotVariants.standard.chip.backgroundColor).toBe(
      getChatRuntimeTurnDurationHeaderMobileBadgeColors(
        {},
        headerMobileStyleColors,
      ).chip.backgroundColor,
    )
    expect(navigationHeaderState.killSwitchButtonShouldRender).toBe(true)
    expect(navigationHeaderState.handsFreeButtonRenderState.isEnabled).toBe(true)
    const navigationHeaderOptionParts = createChatRuntimeNavigationHeaderOptionsParts({
      ...navigationHeaderState,
      onAgentSelectorPress: "open-agent-selector",
      onBackButtonPress: "go-back",
      onPinButtonPress: "toggle-pin",
      conversationStatusSpinnerSource: "spinner-source",
      onKillSwitchButtonPress: "stop-run",
      onHandsFreeButtonPress: "toggle-hands-free",
    })
    expect(navigationHeaderOptionParts.agentSelector).toEqual({
      renderState: navigationHeaderState.agentSelectorRenderState,
      onPress: "open-agent-selector",
      labelNumberOfLines: navigationHeaderState.agentSelectorLabelNumberOfLines,
    })
    expect(navigationHeaderOptionParts.backButton).toEqual({
      renderState: navigationHeaderState.backButtonRenderState,
      onPress: "go-back",
    })
    expect(navigationHeaderOptionParts.pinButton).toEqual({
      renderState: navigationHeaderState.pinButtonRenderState,
      onPress: "toggle-pin",
      isActive: navigationHeaderState.pinButtonIsActive,
    })
    expect(navigationHeaderOptionParts.conversationStatus).toEqual({
      renderState: navigationHeaderState.conversationStatusRenderState,
      spinnerSource: "spinner-source",
    })
    expect(navigationHeaderOptionParts.turnDuration).toEqual({
      renderState: navigationHeaderState.turnDurationRenderState,
    })
    expect(navigationHeaderOptionParts.killSwitchButton).toEqual({
      shouldRender: navigationHeaderState.killSwitchButtonShouldRender,
      renderState: navigationHeaderState.killSwitchButtonRenderState,
      onPress: "stop-run",
    })
    expect(navigationHeaderOptionParts.handsFreeButton).toEqual({
      renderState: navigationHeaderState.handsFreeButtonRenderState,
      onPress: "toggle-hands-free",
    })
    const navigationHeaderMobileParts = createChatRuntimeNavigationHeaderOptionsMobilePropsParts({
      ...navigationHeaderOptionParts,
      styles: {
        actionsRowStyle: "header-actions-row",
        agentSelector: "agent-selector-styles",
        conversationStatus: "conversation-status-styles",
        turnDuration: "turn-duration-styles",
        iconButtons: {
          edgeStyle: "edge-button-style",
          pinStyle: "pin-button-style",
          pinActiveStyle: "pin-active-style",
          actionStyle: "action-button-style",
          killSwitchIconContainerStyle: "kill-switch-icon-container",
          handsFreeIconContainerStyle: "hands-free-icon-container",
        },
      },
    })
    expect(navigationHeaderMobileParts.actionsRow).toEqual({
      props: {
        style: "header-actions-row",
      },
    })
    expect(navigationHeaderMobileParts.agentSelector).toEqual({
      ...navigationHeaderOptionParts.agentSelector,
      styles: "agent-selector-styles",
    })
    expect(navigationHeaderMobileParts.backButton).toEqual({
      ...navigationHeaderOptionParts.backButton,
      style: "edge-button-style",
    })
    expect(navigationHeaderMobileParts.pinButton).toEqual({
      ...navigationHeaderOptionParts.pinButton,
      style: "pin-button-style",
      activeStyle: "pin-active-style",
    })
    expect(navigationHeaderMobileParts.conversationStatus).toEqual({
      ...navigationHeaderOptionParts.conversationStatus,
      styles: "conversation-status-styles",
    })
    expect(navigationHeaderMobileParts.turnDuration).toEqual({
      ...navigationHeaderOptionParts.turnDuration,
      styles: "turn-duration-styles",
    })
    expect(navigationHeaderMobileParts.killSwitchButton).toEqual({
      ...navigationHeaderOptionParts.killSwitchButton,
      style: "action-button-style",
      iconContainerStyle: "kill-switch-icon-container",
    })
    expect(navigationHeaderMobileParts.handsFreeButton).toEqual({
      ...navigationHeaderOptionParts.handsFreeButton,
      style: "action-button-style",
      iconContainerStyle: "hands-free-icon-container",
    })
    const headerAgentSelectorStyles = {
      button: "agent-selector-button",
      chip: "agent-selector-chip",
      label: "agent-selector-label",
    }
    expect(createChatRuntimeHeaderAgentSelectorMobilePropsParts({
      ...navigationHeaderOptionParts.agentSelector,
      styles: headerAgentSelectorStyles,
    })).toEqual({
      touchable: {
        props: {
          style: headerAgentSelectorStyles.button,
          onPress: "open-agent-selector",
          activeOpacity: navigationHeaderState.agentSelectorRenderState.pressedOpacity,
          accessibilityRole: navigationHeaderState.agentSelectorRenderState.accessibilityRole,
          accessibilityLabel: navigationHeaderState.agentSelectorRenderState.accessibilityLabel,
          accessibilityHint: navigationHeaderState.agentSelectorRenderState.accessibilityHint,
        },
        content: {
          chip: {
            props: {
              style: headerAgentSelectorStyles.chip,
            },
            content: {
              label: {
                props: {
                  props: {
                    style: headerAgentSelectorStyles.label,
                    numberOfLines: navigationHeaderState.agentSelectorLabelNumberOfLines,
                  },
                  text: navigationHeaderState.agentSelectorRenderState.label,
                },
              },
              icon: {
                props: navigationHeaderState.agentSelectorRenderState.icon,
              },
            },
          },
        },
      },
    })
    const headerIconButtonParts = createChatRuntimeHeaderIconButtonMobilePropsParts({
      ...navigationHeaderMobileParts.handsFreeButton,
      activeStyle: "hands-free-active-style",
      isActive: true,
    })
    expect(headerIconButtonParts).toEqual({
      shouldRender: true,
      touchable: {
        props: {
          onPress: "toggle-hands-free",
          activeOpacity: navigationHeaderState.handsFreeButtonRenderState.pressedOpacity,
          accessibilityRole: navigationHeaderState.handsFreeButtonRenderState.accessibilityRole,
          accessibilityLabel: navigationHeaderState.handsFreeButtonRenderState.accessibilityLabel,
          accessibilityHint: navigationHeaderState.handsFreeButtonRenderState.accessibilityHint,
          accessibilityState: navigationHeaderState.handsFreeButtonRenderState.accessibilityState,
          "aria-checked": navigationHeaderState.handsFreeButtonRenderState.ariaChecked,
          style: ["action-button-style", "hands-free-active-style"],
        },
        content: {
          iconContainer: {
            shouldRender: true,
            props: {
              style: "hands-free-icon-container",
            },
          },
          icon: {
            props: navigationHeaderState.handsFreeButtonRenderState.icon,
          },
        },
      },
    })
    expect(createChatRuntimeHeaderIconButtonMobilePropsParts({
      ...navigationHeaderMobileParts.killSwitchButton,
      shouldRender: false,
    }).shouldRender).toBe(false)
    const headerConversationStatusStyles = {
      chip: "conversation-status-chip",
      text: "conversation-status-text",
      spinner: "conversation-status-spinner",
    }
    expect(createChatRuntimeHeaderConversationStatusMobilePropsParts({
      ...navigationHeaderOptionParts.conversationStatus,
      styles: headerConversationStatusStyles,
    })).toEqual({
      shouldRender: navigationHeaderState.conversationStatusRenderState.shouldRender,
      container: {
        props: {
          style: [
            headerConversationStatusStyles.chip,
            navigationHeaderState.conversationStatusRenderState.styles.chip,
          ],
        },
        content: {
          runningIndicator: {
            shouldRender: navigationHeaderState.conversationStatusRenderState.runningIndicator.shouldRender,
            props: {
              source: "spinner-source",
              style: headerConversationStatusStyles.spinner,
              resizeMode: navigationHeaderState.conversationStatusRenderState.runningIndicator.resizeMode,
            },
          },
          label: {
            props: {
              props: {
                style: [
                  headerConversationStatusStyles.text,
                  navigationHeaderState.conversationStatusRenderState.styles.text,
                ],
              },
              text: navigationHeaderState.conversationStatusRenderState.label,
            },
          },
        },
      },
    })
    const headerTurnDurationStyles = {
      chip: "turn-duration-chip",
      liveChip: "turn-duration-live-chip",
      text: "turn-duration-text",
      liveText: "turn-duration-live-text",
    }
    expect(createChatRuntimeHeaderTurnDurationMobilePropsParts({
      ...navigationHeaderOptionParts.turnDuration,
      styles: headerTurnDurationStyles,
    })).toEqual({
      shouldRender: navigationHeaderState.turnDurationRenderState.shouldRender,
      container: {
        props: {
          accessible: true,
          accessibilityRole: navigationHeaderState.turnDurationRenderState.accessibilityRole,
          accessibilityLabel: navigationHeaderState.turnDurationRenderState.accessibilityLabel,
          style: [
            headerTurnDurationStyles.chip,
            headerTurnDurationStyles.liveChip,
          ],
        },
        content: {
          icon: {
            props: navigationHeaderState.turnDurationRenderState.icon,
          },
          label: {
            props: {
              props: {
                style: [
                  headerTurnDurationStyles.text,
                  headerTurnDurationStyles.liveText,
                ],
                numberOfLines: navigationHeaderState.turnDurationRenderState.badge.numberOfLines,
              },
              text: navigationHeaderState.turnDurationRenderState.label,
            },
          },
        },
      },
    })
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.durationChip.maxWidth).toBe(72)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.durationChip.numberOfLines).toBe(1)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.accessibilityRole).toBe("button")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.pressedOpacity).toBe(0.78)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.size).toBe(28)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.backgroundColorToken).toBe("destructive")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.iconColor).toBe("#FFFFFF")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.alignItems).toBe("center")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.justifyContent).toBe("center")
    const killSwitchIconContainerStyle = createChatRuntimeHeaderIconContainerMobileStyleSlot({
      size: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.size,
      borderRadius: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.borderRadius,
      backgroundColor: getChatRuntimeKillSwitchMobileColors(headerMobileStyleColors).button.backgroundColor,
      alignItems: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.alignItems,
      justifyContent: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.justifyContent,
    })
    expect(killSwitchIconContainerStyle).toEqual({
      width: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.size,
      height: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.size,
      borderRadius: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.borderRadius,
      backgroundColor: "#dc2626",
      alignItems: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.alignItems,
      justifyContent: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.justifyContent,
    })
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.accessibilityRole).toBe("switch")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.pressedOpacity).toBe(0.78)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.size).toBe(24)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.inactiveIconColorToken).toBe("mutedForeground")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.activeIconColorToken).toBe("primary")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.alignItems).toBe("center")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.justifyContent).toBe("center")
    const handsFreeIconContainerStyle = createChatRuntimeHeaderIconContainerMobileStyleSlot({
      size: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.size,
      alignItems: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.alignItems,
      justifyContent: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.justifyContent,
    })
    expect(handsFreeIconContainerStyle).toEqual({
      width: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.size,
      height: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.size,
      alignItems: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.alignItems,
      justifyContent: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.justifyContent,
    })
    const headerIconContainerStyleSlots = createChatRuntimeHeaderIconContainerMobileStyleSlots({
      surface: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile,
      colors: {
        killSwitchButton: getChatRuntimeKillSwitchMobileColors(headerMobileStyleColors),
      },
    })
    expect(headerIconContainerStyleSlots.killSwitch).toEqual(killSwitchIconContainerStyle)
    expect(headerIconContainerStyleSlots.handsFree).toEqual(handsFreeIconContainerStyle)
    const headerChromeMobileStyleState = getChatRuntimeHeaderChromeMobileStyleRenderState({
      colors: headerMobileStyleColors,
    })
    const headerMobileStyleSlots = createChatRuntimeHeaderMobileStyleSlots({
      header: headerChromeMobileStyleState.header,
      sessionStatus: headerChromeMobileStyleState.sessionStatus,
      turnDuration: headerChromeMobileStyleState.turnDuration,
      headerPinButton: headerPinButtonTouchTarget,
      radius: {
        lg: 12,
      },
      platform: "ios",
    })
    expect(headerMobileStyleSlots.agentSelector).toEqual(createChatRuntimeAgentSelectorMobileStyleSlots({
      surface: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile,
      colors: getChatRuntimeAgentSelectorMobileColors(headerMobileStyleColors),
    }))
    expect(headerMobileStyleSlots.actionsRow).toEqual(createChatRuntimeHeaderActionsRowMobileStyleSlot({
      surface: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.actionsRow,
    }))
    expect(headerMobileStyleSlots.pinButton).toEqual(headerPinButtonStyleSlots)
    expect(headerMobileStyleSlots.iconContainer).toEqual(headerIconContainerStyleSlots)
    expect(headerMobileStyleSlots.sessionStatus).toEqual(createChatSessionStatusMobileChromeStyleSlots({
      surface: headerChromeMobileStyleState.sessionStatus.surface,
    }))
    expect(headerMobileStyleSlots.turnDuration).toEqual(headerDurationStyleSlotVariants)
    expect(getChatRuntimeHeaderMobileSurfaceState()).toBe(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile)
    expect(CHAT_RUNTIME_PRESENTATION.connectionBanner.failedTitle).toBe("Message failed to send")
    expect(CHAT_RUNTIME_PRESENTATION.connectionBanner.mobileIcon).toMatchObject({
      reconnectingName: "sync-outline",
      failedName: "warning-outline",
      size: 16,
    })
    expect(getChatRuntimeConnectionBannerFailedMobileIconState()).toEqual({
      name: CHAT_RUNTIME_PRESENTATION.connectionBanner.mobileIcon.failedName,
      size: CHAT_RUNTIME_PRESENTATION.connectionBanner.mobileIcon.size,
      colorToken: "destructive",
    })
    expect(CHAT_RUNTIME_PRESENTATION.connectionBanner.retryLabel).toBe("Retry")
    expect(CHAT_RUNTIME_PRESENTATION.retryStatus.glyph).toBe("↻")
    expect(CHAT_RUNTIME_PRESENTATION.retryStatus.mobileIcon).toMatchObject({
      name: "time-outline",
      size: 14,
    })
    expect(getChatRuntimeRetryStatusMobileIconState()).toEqual({
      name: CHAT_RUNTIME_PRESENTATION.retryStatus.mobileIcon.name,
      size: CHAT_RUNTIME_PRESENTATION.retryStatus.mobileIcon.size,
      colorToken: "warning",
    })
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.spinner.colorToken).toBe("warning")
    const retryStatusPalette = {
      warning: "#d97706",
      mutedForeground: "#64748b",
    }
    expect(getChatRuntimeRetryStatusMobileColors(retryStatusPalette)).toEqual({
      icon: {
        color: "#d97706",
      },
      spinner: {
        color: "#d97706",
      },
      card: {
        borderColor: "rgba(217, 119, 6, 0.35)",
        backgroundColor: "rgba(217, 119, 6, 0.1)",
      },
      title: {
        color: "#d97706",
      },
      attempt: {
        color: "#64748b",
      },
      countdown: {
        color: "#d97706",
        backgroundColor: "rgba(217, 119, 6, 0.14)",
      },
      description: {
        color: "#64748b",
      },
    })
    expect(getChatRuntimeRetryStatusMobileRenderState({
      retryInfo: {
        attempt: 2,
        maxAttempts: 5,
        delaySeconds: 7,
        reason: "Rate limit reached",
      },
      colors: retryStatusPalette,
    })).toEqual({
      shouldRender: true,
      surface: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus,
      colors: getChatRuntimeRetryStatusMobileColors(retryStatusPalette),
      title: "Rate limit reached",
      attemptLabel: "Attempt 2/5",
      countdownLabel: "Retrying in 7s",
      description: CHAT_RUNTIME_PRESENTATION.retryStatus.autoRetryDescription,
      accessibilityRole: "text",
      accessibilityLabel: "Rate limit reached. Attempt 2/5. Retrying in 7s. The agent will automatically retry when the API is available.",
      icon: {
        name: "time-outline",
        size: 14,
        color: "#d97706",
      },
      spinner: {
        size: "small",
        color: "#d97706",
      },
    })
    const retryStatusRenderState = getChatRuntimeRetryStatusMobileRenderState({
      retryInfo: {
        attempt: 2,
        maxAttempts: 5,
        delaySeconds: 7,
        reason: "Rate limit reached",
      },
      colors: retryStatusPalette,
    })
    expect(createChatRuntimeConversationRetryStatusMobileProps({
      renderState: retryStatusRenderState,
    })).toEqual({
      renderState: retryStatusRenderState,
    })
    expect(createChatRuntimeConversationRetryStatusMobileProps({
      renderState: null,
    })).toBeNull()
    const retryStatusStyles = {
      card: "retry-card-style",
      header: "retry-header-style",
      title: "retry-title-style",
      metaRow: "retry-meta-style",
      attempt: "retry-attempt-style",
      countdown: "retry-countdown-style",
      description: "retry-description-style",
    }
    expect(createChatRuntimeRetryStatusMobilePropsParts({
      renderState: retryStatusRenderState,
      styles: retryStatusStyles,
    })).toEqual({
      shouldRenderRetryStatus: true,
      card: {
        props: {
          accessible: true,
          accessibilityRole: "text",
          accessibilityLabel: "Rate limit reached. Attempt 2/5. Retrying in 7s. The agent will automatically retry when the API is available.",
          style: "retry-card-style",
        },
      },
      header: {
        props: {
          style: "retry-header-style",
        },
        content: {
          icon: {
            props: {
              name: "time-outline",
              size: 14,
              color: "#d97706",
            },
          },
          title: {
            props: {
              style: "retry-title-style",
              numberOfLines: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.titleNumberOfLines,
              text: "Rate limit reached",
            },
          },
          spinner: {
            props: {
              size: "small",
              color: "#d97706",
            },
          },
        },
      },
      meta: {
        props: {
          style: "retry-meta-style",
        },
        content: {
          attempt: {
            props: {
              style: "retry-attempt-style",
              text: "Attempt 2/5",
            },
          },
          countdown: {
            props: {
              style: "retry-countdown-style",
              text: "Retrying in 7s",
            },
          },
        },
      },
      description: {
        props: {
          style: "retry-description-style",
          text: CHAT_RUNTIME_PRESENTATION.retryStatus.autoRetryDescription,
        },
      },
    })
    expect(createChatRuntimeRetryStatusMobilePropsParts({
      renderState: {
        ...retryStatusRenderState,
        shouldRender: false,
      },
      styles: retryStatusStyles,
    }).shouldRenderRetryStatus).toBe(false)
    expect(createChatRuntimeRetryStatusMobileStyleSlots({
      renderState: getChatRuntimeRetryStatusMobileRenderState({
        retryInfo: {
          attempt: 2,
          maxAttempts: 5,
          delaySeconds: 7,
          reason: "Rate limit reached",
        },
        colors: retryStatusPalette,
      }),
      spacing: {
        xs: 4,
        sm: 8,
      },
      radius: {
        sm: 6,
      },
    })).toEqual({
      card: {
        gap: 4,
        padding: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(217, 119, 6, 0.35)",
        backgroundColor: "rgba(217, 119, 6, 0.1)",
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      },
      title: {
        flex: 1,
        minWidth: 0,
        color: "#d97706",
        fontSize: 13,
        fontWeight: "700",
      },
      metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
      },
      attempt: {
        color: "#64748b",
        fontSize: 11,
      },
      countdown: {
        color: "#d97706",
        fontSize: 11,
        fontWeight: "700",
        paddingHorizontal: 4,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: "rgba(217, 119, 6, 0.14)",
        overflow: "hidden",
      },
      description: {
        color: "#64748b",
        fontSize: 11,
        lineHeight: 15,
        marginTop: 2,
      },
    })
    expect(getChatRuntimeRetryStatusMobileRenderState({
      colors: retryStatusPalette,
    })).toMatchObject({
      shouldRender: false,
      title: "",
      attemptLabel: "",
      countdownLabel: "",
      accessibilityLabel: "",
    })
    expect(CHAT_RUNTIME_PRESENTATION.retryStatus.autoRetryDescription).toContain("automatically retry")
    expect(CHAT_RUNTIME_PRESENTATION.scrollToBottom.accessibilityLabel).toBe("Scroll to bottom")
    expect(CHAT_RUNTIME_PRESENTATION.scrollToBottom.latestLabel).toBe("Latest")
    expect(CHAT_RUNTIME_PRESENTATION.scrollToBottom.mobileIcon).toMatchObject({
      name: "arrow-down",
      size: 20,
    })
    expect(getChatRuntimeScrollToBottomMobileIconState()).toEqual({
      name: CHAT_RUNTIME_PRESENTATION.scrollToBottom.mobileIcon.name,
      size: CHAT_RUNTIME_PRESENTATION.scrollToBottom.mobileIcon.size,
      colorToken: "primaryForeground",
    })
    expect(CHAT_RUNTIME_PRESENTATION.streamingContent.generatingTitle).toBe("Generating response...")
    expect(CHAT_RUNTIME_PRESENTATION.streamingContent.streamingBadgeLabel).toBe("Streaming")
    expect(CHAT_RUNTIME_PRESENTATION.stepSummary.latestTitle).toBe("Latest activity")
    expect(CHAT_RUNTIME_PRESENTATION.stepSummary.summaryTitle).toBe("Summary")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.summaryTitle).toBe("Delegations")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.detailActionLabel).toBe("Details")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.toolActivityLabel).toBe("Tool activity")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.moreToolActivityLabel).toBe("more")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.activityLabel).toBe("Activity")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.copyConversationLabel).toBe("Copy conversation")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.taskRoleLabel).toBe("Task")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.updateRoleLabel).toBe("Update")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.resultRoleLabel).toBe("Result")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.errorRoleLabel).toBe("Error")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.toolRoleFallbackLabel).toBe("Tool")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.messageRoleFallbackLabel).toBe("Message")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.toolInputLabel).toBe("Tool Input")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.rawPayloadLabel).toBe("Raw Payload")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.messageSingularLabel).toBe("message")
    expect(CHAT_RUNTIME_PRESENTATION.delegation.messagePluralLabel).toBe("messages")
    expect(CHAT_RUNTIME_PRESENTATION.messageHistory.loadingEarlierLabel).toBe("Loading...")
    expect(getChatRuntimeDesktopSurfaceState()).toBe(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.visibleUpdatesSummaryClassName).toContain("uppercase")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.turnDurationBadge.compactClassName).toContain("whitespace-nowrap")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.turnDurationBadge.fullClassName).toContain("text-muted-foreground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.turnDurationBadge.liveClassName).toContain("text-amber-600")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.turnDurationBadge.compactIconClassName).toBe("h-2.5 w-2.5")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.turnDurationBadge.fullIconClassName).toBe("h-3 w-3")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.conversationHistoryBanner.loadButtonClassName).toContain("disabled:opacity-60")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.conversationHistoryBanner.pageSize).toBe(120)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.scrollToBottom.buttonClassName).toContain("bottom-3")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.scrollToBottom.compactButtonClassName).toContain("bottom-1.5")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.streamingContent.containerClassName).toContain("border-blue-300")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.streamingContent.liveTextClassName).toContain("whitespace-pre-wrap")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.killSwitchDialog.overlayClassName).toContain("backdrop-blur-sm")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.killSwitchDialog.actionsClassName).toContain("justify-end")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.retryStatus.containerClassName).toContain("border-amber-300")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.retryStatus.countdownClassName).toContain("font-mono")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationMessage.containerBaseClassName).toContain("transition-all")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationMessage.roleClassNames.assistant).toContain("purple")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationMessage.badgeRoleClassNames.tool).toContain("amber")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationMessage.contentBaseClassName).toContain("whitespace-pre-wrap")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationMessage.contentClampCompactClassName).toBe("line-clamp-3")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationMessage.toolInputCodeClassName).toContain("max-h-28")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationMessage.rawPayloadCodeClassName).toContain("bg-muted/40")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationMessage.copyButtonClassName).toContain("h-7")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.compactSubtitleMaxLength).toBe(72)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.defaultSubtitleMaxLength).toBe(120)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.containerBaseClassName).toContain("overflow-hidden")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.headerBaseClassName).toContain("hover:opacity-90")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.statusSpinnerClassName).toContain("animate-spin")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.contentClassName).toBe("px-2 py-2 space-y-2")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.transcriptButtonClassName).toContain("text-purple-700")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.detailsButtonClassName).toContain("border-border")
    expect(getChatRuntimeDelegationStatusDesktopClassNames("running")).toBe(
      CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.statusClassNames.active,
    )
    expect(getChatRuntimeDelegationStatusDesktopClassNames("completed")).toBe(
      CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.statusClassNames.completed,
    )
    expect(getChatRuntimeDelegationStatusDesktopClassNames("failed")).toBe(
      CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.statusClassNames.failed,
    )
    expect(getChatRuntimeDelegationStatusDesktopClassNames("cancelled")).toBe(
      CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationBubble.statusClassNames.cancelled,
    )
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationPanel.recentMessagesLimit).toBe(3)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationPanel.compactPreviewMaxLength).toBe(72)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationPanel.defaultPreviewMaxLength).toBe(120)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationPanel.compactScrollMaxHeight).toBe("min(32vh, 220px)")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationPanel.defaultScrollMaxHeight).toBe("min(36vh, 280px)")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationPanel.headerBaseClassName).toContain("flex-wrap")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationPanel.headerInteractiveClassName).toContain("hover:bg-gray-100")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationPanel.showEarlierButtonClassName).toContain("border-b")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.desktop.delegationConversationPanel.scrollContainerClassName).toContain("overflow-y-auto")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.paddingHorizontal).toBe("sm")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.backgroundColorToken).toBe("background")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.contentGap).toBe("xs")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.keyboardAvoidingBehaviorByPlatform.ios).toBe("padding")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.keyboardAvoidingBehaviorByPlatform.default).toBe("height")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.keyboardShouldPersistTaps).toBe("handled")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.contentInsetAdjustmentBehavior).toBe("automatic")
    expect(getChatRuntimeViewportMobileState()).toBe(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport)
    expect(getChatRuntimeViewportMobileKeyboardAvoidingBehavior("ios")).toBe("padding")
    expect(getChatRuntimeViewportMobileKeyboardAvoidingBehavior("android")).toBe("height")
    expect(getChatRuntimeViewportMobileKeyboardAvoidingBehavior("web")).toBe("height")
    expect(getChatRuntimeViewportMobileColors({
      background: "#ffffff",
    })).toEqual({
      backgroundColor: "#ffffff",
    })
    expect(getChatRuntimeViewportMobileRenderState({
      colors: {
        background: "#ffffff",
      },
    })).toEqual({
      surface: getChatRuntimeViewportMobileState(),
      loadingState: getChatRuntimeLoadingStateMobileState(),
      inlineActivity: getChatRuntimeInlineActivityMobileState(),
      colors: getChatRuntimeViewportMobileColors({
        background: "#ffffff",
      }),
    })
    expect(createChatRuntimeViewportMobileStyleSlots({
      renderState: getChatRuntimeViewportMobileRenderState({
        colors: {
          background: "#ffffff",
        },
      }),
      spacing: {
        sm: 8,
        xs: 4,
      },
    })).toEqual({
      keyboardAvoidingContainer: {
        flex: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.flex,
        backgroundColor: "#ffffff",
      },
      root: {
        flex: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.flex,
      },
      scroll: {
        flex: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.viewport.flex,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: "#ffffff",
      },
      scrollContent: {
        gap: 4,
      },
    })
    expect(createChatRuntimeViewportActivityMobileStyleSlots({
      renderState: getChatRuntimeViewportMobileRenderState({
        colors: {
          background: "#ffffff",
        },
      }),
    })).toEqual({
      loadingState: {
        flex: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.flex,
        justifyContent: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.justifyContent,
        alignItems: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.alignItems,
        paddingVertical: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.paddingVertical,
      },
      loadingSpinner: {
        width: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.spinnerSize,
        height: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.spinnerSize,
      },
      inlineActivityIndicator: {
        flexDirection: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.flexDirection,
        alignItems: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.alignItems,
      },
      inlineActivitySpinner: {
        width: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.spinnerSize,
        height: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.spinnerSize,
      },
    })
    const viewportMobileRenderState = getChatRuntimeViewportMobileRenderState({
      colors: {
        background: "#ffffff",
      },
    })
    const viewportMobileSpacing = {
      sm: 8,
      xs: 4,
    }
    expect(createChatRuntimeViewportChromeMobileStyleSlots({
      renderState: viewportMobileRenderState,
      spacing: viewportMobileSpacing,
    })).toEqual({
      viewport: createChatRuntimeViewportMobileStyleSlots({
        renderState: viewportMobileRenderState,
        spacing: viewportMobileSpacing,
      }),
      activity: createChatRuntimeViewportActivityMobileStyleSlots({
        renderState: viewportMobileRenderState,
      }),
    })
    const conversationChromeStyleColors = {
      background: "#ffffff",
      foreground: "#0f172a",
      mutedForeground: "#64748b",
      info: "#2563eb",
      warning: "#d97706",
      destructive: "#dc2626",
      primary: "#111827",
      primaryForeground: "#f8fafc",
      border: "#e2e8f0",
      muted: "#f1f5f9",
    }
    const conversationChromeMobileStyleState = getChatRuntimeConversationChromeMobileStyleRenderState({
      colors: conversationChromeStyleColors,
    })
    expect(conversationChromeMobileStyleState).toEqual({
      viewport: getChatRuntimeViewportMobileRenderState({
        colors: conversationChromeStyleColors,
      }),
      streamingContent: getChatRuntimeStreamingContentMobileRenderState({
        colors: conversationChromeStyleColors,
      }),
      connectionBanner: getChatRuntimeConnectionBannerMobileRenderState({
        colors: conversationChromeStyleColors,
      }),
      retryStatus: getChatRuntimeRetryStatusMobileRenderState({
        colors: conversationChromeStyleColors,
      }),
      stepSummary: getChatRuntimeStepSummaryMobileRenderState({
        colors: conversationChromeStyleColors,
      }),
      delegationCard: getChatRuntimeDelegationCardMobileRenderState({
        colors: conversationChromeStyleColors,
      }),
      scrollToBottom: getChatRuntimeScrollToBottomMobileRenderState({
        colors: conversationChromeStyleColors,
      }),
      messageHistoryBanner: getChatRuntimeMessageHistoryBannerMobileRenderState({
        colors: conversationChromeStyleColors,
      }),
    })
    const conversationMobileSpacing = {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
    }
    const conversationMobileRadius = {
      sm: 4,
      md: 8,
    }
    expect(createChatRuntimeConversationMobileStyleSlots({
      renderState: conversationChromeMobileStyleState,
      spacing: conversationMobileSpacing,
      radius: conversationMobileRadius,
      toolPreviewStatusIconWidth: 20,
    })).toEqual({
      viewport: createChatRuntimeViewportChromeMobileStyleSlots({
        renderState: conversationChromeMobileStyleState.viewport,
        spacing: conversationMobileSpacing,
      }).viewport,
      activity: createChatRuntimeViewportChromeMobileStyleSlots({
        renderState: conversationChromeMobileStyleState.viewport,
        spacing: conversationMobileSpacing,
      }).activity,
      streamingContent: createChatRuntimeStreamingContentMobileStyleSlots({
        renderState: conversationChromeMobileStyleState.streamingContent,
        spacing: conversationMobileSpacing,
        radius: conversationMobileRadius,
      }),
      connectionBanner: createChatRuntimeConnectionBannerMobileStyleSlots({
        renderState: conversationChromeMobileStyleState.connectionBanner,
        spacing: conversationMobileSpacing,
        radius: conversationMobileRadius,
      }),
      retryStatus: createChatRuntimeRetryStatusMobileStyleSlots({
        renderState: conversationChromeMobileStyleState.retryStatus,
        spacing: conversationMobileSpacing,
        radius: conversationMobileRadius,
      }),
      stepSummary: createChatRuntimeStepSummaryMobileStyleSlots({
        renderState: conversationChromeMobileStyleState.stepSummary,
        spacing: conversationMobileSpacing,
        radius: conversationMobileRadius,
      }),
      delegationCard: createChatRuntimeDelegationCardMobileStyleSlots({
        renderState: conversationChromeMobileStyleState.delegationCard,
        spacing: conversationMobileSpacing,
        radius: conversationMobileRadius,
        toolPreviewStatusIconWidth: 20,
      }),
      scrollToBottom: createChatRuntimeScrollToBottomMobileStyleSlots({
        renderState: conversationChromeMobileStyleState.scrollToBottom,
        spacing: conversationMobileSpacing,
      }),
      messageHistoryBanner: createChatRuntimeMessageHistoryBannerMobileStyleSlots({
        renderState: conversationChromeMobileStyleState.messageHistoryBanner,
        spacing: conversationMobileSpacing,
        radius: conversationMobileRadius,
      }),
    })
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.spinnerSize).toBe(32)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.spinnerResizeMode).toBe("contain")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.accessibilityRole).toBe("progressbar")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.accessibilityState).toEqual({ busy: true })
    expect(getChatRuntimeLoadingStateMobileState()).toBe(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState)
    expect(getChatRuntimeLoadingStateMobileRenderState({
      isLoadingMessages: true,
      messageCount: 0,
    })).toEqual({
      shouldRender: true,
      accessibilityRole: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.accessibilityRole,
      accessibilityLabel: CHAT_RUNTIME_PRESENTATION.activity.loadingMessagesAccessibilityLabel,
      accessibilityState: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.accessibilityState,
      spinnerResizeMode: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.spinnerResizeMode,
    })
    const loadingStateParts = createChatRuntimeLoadingStateMobilePropsParts({
      renderState: {
        shouldRender: true,
        accessibilityRole: "progressbar",
        accessibilityLabel: "Loading messages",
        accessibilityState: { busy: true },
        spinnerResizeMode: "contain",
      },
      spinnerSource: "spinner-source",
      style: "loading-style",
      spinnerStyle: "spinner-style",
    })
    expect(loadingStateParts).toEqual({
      shouldRenderLoadingState: true,
      container: {
        props: {
          accessible: true,
          accessibilityRole: "progressbar",
          accessibilityLabel: "Loading messages",
          accessibilityState: { busy: true },
          style: "loading-style",
        },
        content: {
          spinner: {
            props: {
              source: "spinner-source",
              style: "spinner-style",
              resizeMode: "contain",
            },
          },
        },
      },
    })
    expect(createChatRuntimeLoadingStateMobilePropsParts({
      renderState: {
        shouldRender: false,
        accessibilityRole: "progressbar",
        accessibilityLabel: "Loading messages",
        accessibilityState: { busy: true },
        spinnerResizeMode: "contain",
      },
      spinnerSource: "spinner-source",
      style: "loading-style",
      spinnerStyle: "spinner-style",
    }).shouldRenderLoadingState).toBe(false)
    expect(getChatRuntimeLoadingStateMobileRenderState({
      isLoadingMessages: true,
      messageCount: 1,
    }).shouldRender).toBe(false)
    expect(getChatRuntimeLoadingStateMobileRenderState({
      isLoadingMessages: false,
      messageCount: 0,
    }).shouldRender).toBe(false)
    expect(getChatRuntimeHomeQuickStartsMobileRenderState({
      isLoadingMessages: false,
      messageCount: 0,
    })).toEqual({
      shouldRender: true,
    })
    expect(getChatRuntimeHomeQuickStartsMobileRenderState({
      isLoadingMessages: true,
      messageCount: 0,
    }).shouldRender).toBe(false)
    expect(getChatRuntimeHomeQuickStartsMobileRenderState({
      isLoadingMessages: false,
      messageCount: 1,
    }).shouldRender).toBe(false)
    expect(getChatRuntimeViewportContentMobileRenderState({
      isLoadingMessages: true,
      messageCount: 0,
    })).toEqual({
      loading: getChatRuntimeLoadingStateMobileRenderState({
        isLoadingMessages: true,
        messageCount: 0,
      }),
      homeQuickStarts: getChatRuntimeHomeQuickStartsMobileRenderState({
        isLoadingMessages: true,
        messageCount: 0,
      }),
    })
    const quickStartPrompt = {
      id: "prompt-1",
      name: "Summarize",
      content: "Summarize this thread.",
      createdAt: 1,
      updatedAt: 2,
    }
    const viewportChromeColors = {
      background: "#f8fafc",
      border: "#cbd5e1",
      card: "#ffffff",
      destructive: "#dc2626",
      foreground: "#0f172a",
      info: "#0ea5e9",
      input: "#cbd5e1",
      muted: "#e2e8f0",
      mutedForeground: "#64748b",
      primary: "#2563eb",
      primaryForeground: "#ffffff",
      secondary: "#e0f2fe",
      success: "#16a34a",
      successForeground: "#ecfdf5",
      warning: "#d97706",
    }
    const quickStartItems = getChatRuntimeHomeQuickStartItemsMobileState({
      prompts: [quickStartPrompt],
      canAddPrompt: true,
    })
    expect(quickStartItems.map((item) => item.id)).toEqual(["prompt-1", "action-add-prompt"])
    expect(quickStartItems[0]?.source).toBe("saved-prompt")
    expect(quickStartItems[1]?.source).toBe("action")
    expect(getChatRuntimeHomeQuickStartPressIntent(quickStartItems[0]!)).toEqual({
      kind: "insert-content",
      content: "Summarize this thread.",
    })
    expect(getChatRuntimeHomeQuickStartPressIntent(quickStartItems[1]!)).toEqual({
      kind: "add-prompt",
    })
    const taskQuickStartItems = getChatRuntimeHomeQuickStartItemsMobileState({
      tasks: [{ id: "task-1", name: "Daily", prompt: "Run the daily brief." }],
    })
    expect(getChatRuntimeHomeQuickStartPressIntent(taskQuickStartItems[0]!)).toEqual({
      kind: "run-task",
      task: { id: "task-1", name: "Daily", prompt: "Run the daily brief." },
    })
    const viewportChrome = getChatRuntimeViewportChromeMobileRenderState({
      isLoadingMessages: false,
      messageCount: 0,
      quickStartPrompts: [quickStartPrompt],
      quickStartCanAddPrompt: true,
      visibleMessageCount: 1,
      totalMessageCount: 3,
      hiddenMessageCount: 2,
      messageHistoryLoadIncrement: 20,
      latestStepSummary: {
        stepNumber: 2,
        actionSummary: "Reviewed shared state",
      },
      requestDebugText: "Request sent",
      voiceDebugEnabled: true,
      voiceEvents: [{
        id: "voice-1",
        at: 0,
        type: "recognizer-start",
        summary: "Recognizer started",
      }],
      colors: viewportChromeColors,
    })
    expect(viewportChrome.viewport.surface.keyboardShouldPersistTaps).toBe("handled")
    expect(viewportChrome.viewport.surface.contentInsetAdjustmentBehavior).toBe("automatic")
    expect(viewportChrome.content.homeQuickStarts.shouldRender).toBe(true)
    expect(viewportChrome.quickStartItems.map((item) => item.id)).toEqual(["prompt-1", "action-add-prompt"])
    expect(viewportChrome.shortcutRenderState.copy.loadingLabel).toBe("Loading desktop library...")
    expect(getChatRuntimeHomeQuickStartEmptyMobileRenderState(
      viewportChrome.shortcutRenderState,
      true,
    ).label).toBe("Loading desktop library...")
    expect(getChatRuntimeHomeQuickStartEmptyMobileRenderState(
      viewportChrome.shortcutRenderState,
      false,
    ).label).toBe("No prompts, skills, or tasks available from your connected desktop app.")
    const quickStartPromptRenderState = getChatRuntimeHomeQuickStartItemMobileRenderState(
      viewportChrome.quickStartItems[0]!,
      viewportChrome.shortcutRenderState,
      null,
    )
    expect(quickStartPromptRenderState.sourceLabel).toBe("prompt")
    expect(quickStartPromptRenderState.interaction.isDisabled).toBe(false)
    expect(quickStartPromptRenderState.promptActions?.edit.label).toBe("Edit")
    const addPromptRenderState = getChatRuntimeHomeQuickStartItemMobileRenderState(
      viewportChrome.quickStartItems[1]!,
      viewportChrome.shortcutRenderState,
      null,
    )
    expect(addPromptRenderState.interaction.isAddPrompt).toBe(true)
    expect(addPromptRenderState.addAction?.icon.name).toBe("add-circle-outline")
    const quickStartStyles = {
      card: "card",
      emptyText: "emptyText",
      grid: "grid",
      shortcutCard: "shortcutCard",
      shortcutCardAdd: "shortcutCardAdd",
      shortcutCardDisabled: "shortcutCardDisabled",
      shortcutCardPressed: "shortcutCardPressed",
      sourcePill: "sourcePill",
      sourceLabel: "sourceLabel",
      addIcon: "addIcon",
      title: "title",
      titleAdd: "titleAdd",
      description: "description",
      actions: "actions",
      actionButton: "actionButton",
      actionButtonPressed: "actionButtonPressed",
      actionText: "actionText",
      actionDangerText: "actionDangerText",
    }
    let pressedQuickStartId: string | null = null
    let editedPromptId: string | null = null
    let deletedPromptId: string | null = null
    const quickStartPropsParts = createChatRuntimeHomeQuickStartsMobilePropsParts({
      shouldRender: true,
      items: viewportChrome.quickStartItems,
      isLoading: false,
      runningTaskId: null,
      onPress: (item) => {
        pressedQuickStartId = item.id
      },
      onEditPrompt: (prompt) => {
        editedPromptId = prompt.id
      },
      onDeletePrompt: (prompt) => {
        deletedPromptId = prompt.id
      },
      shortcutRenderState: viewportChrome.shortcutRenderState,
      styles: quickStartStyles,
    })
    expect(quickStartPropsParts.container.props.style).toBe("card")
    expect(quickStartPropsParts.emptyState.shouldRender).toBe(false)
    expect(quickStartPropsParts.grid.shouldRender).toBe(true)
    expect(quickStartPropsParts.grid.props.style).toBe("grid")
    const promptItemParts = quickStartPropsParts.grid.items[0]!
    expect(promptItemParts.key).toBe("prompt-1")
    expect(promptItemParts.pressable.props.style({ pressed: true })).toEqual([
      "shortcutCard",
      false,
      false,
      "shortcutCardPressed",
    ])
    promptItemParts.pressable.props.onPress()
    expect(pressedQuickStartId).toBe("prompt-1")
    expect(promptItemParts.sourcePill.shouldRender).toBe(true)
    if (!promptItemParts.sourcePill.shouldRender) {
      throw new Error("expected prompt quick start to render a source pill")
    }
    expect(promptItemParts.sourcePill.label.text).toBe("prompt")
    expect(promptItemParts.sourcePill.label.props.numberOfLines).toBe(1)
    expect(promptItemParts.addIcon.shouldRender).toBe(false)
    expect(promptItemParts.title.text).toBe("Summarize")
    expect(promptItemParts.title.props.numberOfLines).toBe(2)
    expect(promptItemParts.description.shouldRender).toBe(true)
    if (!promptItemParts.description.shouldRender) {
      throw new Error("expected prompt quick start to render a description")
    }
    expect(promptItemParts.description.props.numberOfLines).toBe(2)
    expect(promptItemParts.actions.shouldRender).toBe(true)
    if (!promptItemParts.actions.shouldRender) {
      throw new Error("expected prompt quick start to render prompt actions")
    }
    expect(promptItemParts.actions.edit.label.text).toBe("Edit")
    expect(promptItemParts.actions.delete.label.props.style).toEqual([
      "actionText",
      "actionDangerText",
    ])
    let stoppedPropagationCount = 0
    promptItemParts.actions.edit.pressable.props.onPress({
      stopPropagation: () => {
        stoppedPropagationCount += 1
      },
    })
    expect(stoppedPropagationCount).toBe(1)
    expect(editedPromptId).toBe("prompt-1")
    promptItemParts.actions.delete.pressable.props.onPress({
      stopPropagation: () => {
        stoppedPropagationCount += 1
      },
    })
    expect(stoppedPropagationCount).toBe(2)
    expect(deletedPromptId).toBe("prompt-1")
    const addPromptItemParts = quickStartPropsParts.grid.items[1]!
    expect(addPromptItemParts.sourcePill.shouldRender).toBe(false)
    expect(addPromptItemParts.addIcon.shouldRender).toBe(true)
    if (!addPromptItemParts.addIcon.shouldRender) {
      throw new Error("expected add prompt quick start to render an add icon")
    }
    expect(addPromptItemParts.addIcon.props.style).toBe("addIcon")
    expect(addPromptItemParts.title.props.style).toEqual([
      "title",
      "titleAdd",
    ])
    const emptyQuickStartPropsParts = createChatRuntimeHomeQuickStartsMobilePropsParts({
      shouldRender: true,
      items: [],
      isLoading: false,
      onPress: () => undefined,
      onEditPrompt: () => undefined,
      onDeletePrompt: () => undefined,
      shortcutRenderState: viewportChrome.shortcutRenderState,
      styles: quickStartStyles,
    })
    expect(emptyQuickStartPropsParts.grid.shouldRender).toBe(false)
    expect(emptyQuickStartPropsParts.emptyState.shouldRender).toBe(true)
    expect(emptyQuickStartPropsParts.emptyState.props.style).toBe("emptyText")
    expect(emptyQuickStartPropsParts.emptyState.text).toBe(
      "No prompts, skills, or tasks available from your connected desktop app.",
    )
    const hiddenQuickStartPropsParts = createChatRuntimeHomeQuickStartsMobilePropsParts({
      shouldRender: false,
      items: viewportChrome.quickStartItems,
      isLoading: false,
      onPress: () => undefined,
      onEditPrompt: () => undefined,
      onDeletePrompt: () => undefined,
      shortcutRenderState: viewportChrome.shortcutRenderState,
      styles: quickStartStyles,
    })
    expect(hiddenQuickStartPropsParts.grid.shouldRender).toBe(false)
    expect(hiddenQuickStartPropsParts.emptyState.shouldRender).toBe(false)
    expect(viewportChrome.affordance.historyBanner.renderState.shouldRender).toBe(true)
    expect(viewportChrome.affordance.stepSummary.renderState.shouldRender).toBe(true)
    expect(viewportChrome.debugPanels.requestShouldRender).toBe(true)
    expect(viewportChrome.debugPanels.voiceShouldRender).toBe(true)
    const viewportChromeProps = createChatRuntimeViewportChromeMobileProps({
      viewportContentIsLoadingMessages: false,
      viewportContentMessageCount: 0,
      loadingSpinnerSource: "spinner-source",
      quickStartPrompts: [quickStartPrompt],
      quickStartSkills: undefined,
      quickStartTasks: undefined,
      quickStartCanAddPrompt: true,
      isLoadingQuickStartPrompts: false,
      runningPromptTaskId: null,
      onQuickStartPress: "quick-start-press",
      onEditPrompt: "edit-prompt",
      onDeletePrompt: "delete-prompt",
      visibleMessageCount: 1,
      totalMessageCount: 3,
      hiddenMessageCount: 2,
      messageHistoryLoadIncrement: 20,
      latestStepSummary: {
        stepNumber: 2,
        actionSummary: "Reviewed shared state",
      },
      colors: viewportChromeColors,
      onLoadEarlierMessages: "load-earlier",
      requestDebugText: "Request sent",
      voiceDebugEnabled: true,
      voiceEvents: [{
        id: "voice-1",
        at: 0,
        type: "recognizer-start",
        summary: "Recognizer started",
      }],
      scrollEnabled: true,
    })
    expect(viewportChromeProps.scrollEnabled).toBe(true)
    expect(viewportChromeProps.keyboardShouldPersistTaps).toBe("handled")
    expect(viewportChromeProps.contentInsetAdjustmentBehavior).toBe("automatic")
    expect(viewportChromeProps.loadingState.spinnerSource).toBe("spinner-source")
    expect(viewportChromeProps.homeQuickStarts.items.map((item) => item.id)).toEqual(["prompt-1", "action-add-prompt"])
    expect(viewportChromeProps.homeQuickStarts.onPress).toBe("quick-start-press")
    expect(viewportChromeProps.historyBanner.onLoadEarlier).toBe("load-earlier")
    expect(viewportChromeProps.stepSummary.renderState.shouldRender).toBe(true)
    expect(viewportChromeProps.debugPanels.requestShouldRender).toBe(true)
    const surfaceChrome = getChatRuntimeSurfaceChromeMobileRenderState({
      colors: viewportChromeColors,
      platform: "ios",
    })
    expect(surfaceChrome.frame.keyboardAvoidingBehavior).toBe("padding")
    expect(surfaceChrome.promptEditor.renderState.keyboardAvoidingBehavior).toBe("padding")
    expect(surfaceChrome.promptEditor.renderState.copy.nameLabel).toBe("Name")
    const surfaceChromeProps = createChatRuntimeSurfaceChromeMobileProps({
      platform: "ios",
      colors: viewportChromeColors,
      keyboardVerticalOffset: 24,
      dock: "runtime-dock",
      viewport: "runtime-viewport",
      threadStates: ["thread-state"],
      threadStyles: "thread-styles",
      agentSelectorVisible: true,
      onAgentSelectorClose: "close-agent-selector",
      promptEditorVisible: true,
      promptEditorIsEditing: false,
      promptEditorNameValue: "Saved prompt",
      onPromptEditorNameChange: "change-prompt-name",
      promptEditorContentValue: "Prompt body",
      onPromptEditorContentChange: "change-prompt-content",
      promptEditorIsSaving: false,
      onPromptEditorClose: "close-prompt-editor",
      onPromptEditorSave: "save-prompt",
      promptEditorStyles: "prompt-editor-styles",
    })
    expect(surfaceChromeProps.frame.keyboardAvoidingBehavior).toBe("padding")
    expect(surfaceChromeProps.frame.keyboardVerticalOffset).toBe(24)
    expect(surfaceChromeProps.dock).toBe("runtime-dock")
    expect(surfaceChromeProps.viewport).toBe("runtime-viewport")
    expect(surfaceChromeProps.threadList).toEqual({
      threadStates: ["thread-state"],
      styles: "thread-styles",
    })
    expect(surfaceChromeProps.overlays.agentSelector.visible).toBe(true)
    expect(surfaceChromeProps.overlays.agentSelector.onClose).toBe("close-agent-selector")
    expect(surfaceChromeProps.overlays.promptEditor.renderState.copy.nameLabel).toBe("Name")
    expect(surfaceChromeProps.overlays.promptEditor.styles).toBe("prompt-editor-styles")
    const promptEditorModalStyles = {
      keyboardAvoidingView: "keyboardAvoidingView",
      overlay: "overlay",
      content: "content",
      header: "header",
      title: "title",
      closeButton: "closeButton",
      label: "label",
      input: "input",
      inputMultiline: "inputMultiline",
      actions: "actions",
      cancelButton: "cancelButton",
      cancelButtonText: "cancelButtonText",
      saveButton: "saveButton",
      saveButtonDisabled: "saveButtonDisabled",
      saveButtonText: "saveButtonText",
    }
    const onPromptEditorNameChange = (value: string) => value
    const onPromptEditorContentChange = (value: string) => value
    const onPromptEditorClose = () => undefined
    const onPromptEditorSave = () => undefined
    const promptEditorModalPropsParts = createChatConversationHomePromptEditorModalMobilePropsParts({
      visible: true,
      isEditing: true,
      nameValue: "Saved prompt",
      onNameChange: onPromptEditorNameChange,
      contentValue: "Prompt body",
      onContentChange: onPromptEditorContentChange,
      isSaving: false,
      onClose: onPromptEditorClose,
      onSave: onPromptEditorSave,
      renderState: surfaceChrome.promptEditor.renderState,
      styles: promptEditorModalStyles,
    })
    expect(promptEditorModalPropsParts.modal.props).toEqual({
      visible: true,
      transparent: true,
      animationType: "slide",
      onRequestClose: onPromptEditorClose,
    })
    expect(promptEditorModalPropsParts.keyboardAvoidingView.props).toEqual({
      style: "keyboardAvoidingView",
      behavior: "padding",
    })
    expect(promptEditorModalPropsParts.title).toEqual({
      text: "Edit Prompt",
      props: {
        style: "title",
      },
    })
    expect(promptEditorModalPropsParts.closeButton.props.disabled).toBe(false)
    expect(promptEditorModalPropsParts.closeButton.props.accessibilityLabel).toBe("Close prompt editor")
    expect(promptEditorModalPropsParts.closeIcon.props.name).toBe("close")
    expect(promptEditorModalPropsParts.nameInput.props).toMatchObject({
      style: "input",
      value: "Saved prompt",
      onChangeText: onPromptEditorNameChange,
      accessibilityLabel: "Name input",
      placeholder: "e.g., Code Review Request",
    })
    expect(promptEditorModalPropsParts.contentInput.props).toMatchObject({
      style: ["input", "inputMultiline"],
      value: "Prompt body",
      onChangeText: onPromptEditorContentChange,
      accessibilityLabel: "Prompt Content input",
      multiline: true,
      textAlignVertical: "top",
    })
    expect(promptEditorModalPropsParts.cancelButton.props).toMatchObject({
      style: "cancelButton",
      onPress: onPromptEditorClose,
      disabled: false,
      accessibilityLabel: "Cancel button",
    })
    expect(promptEditorModalPropsParts.saveButton.props.style).toEqual([
      "saveButton",
      false,
    ])
    expect(promptEditorModalPropsParts.saveButton.props.disabled).toBe(false)
    expect(promptEditorModalPropsParts.saveButton.props.onPress).toBe(onPromptEditorSave)
    expect(promptEditorModalPropsParts.saveLabel).toEqual({
      text: "Save Changes",
      props: {
        style: "saveButtonText",
      },
    })
    const savingPromptEditorModalPropsParts = createChatConversationHomePromptEditorModalMobilePropsParts({
      visible: true,
      isEditing: false,
      nameValue: "",
      onNameChange: onPromptEditorNameChange,
      contentValue: "",
      onContentChange: onPromptEditorContentChange,
      isSaving: true,
      onClose: onPromptEditorClose,
      onSave: onPromptEditorSave,
      renderState: surfaceChrome.promptEditor.renderState,
      styles: promptEditorModalStyles,
    })
    expect(savingPromptEditorModalPropsParts.closeButton.props.disabled).toBe(true)
    expect(savingPromptEditorModalPropsParts.closeButton.props.accessibilityState).toEqual({ disabled: true })
    expect(savingPromptEditorModalPropsParts.saveButton.props.style).toEqual([
      "saveButton",
      "saveButtonDisabled",
    ])
    expect(savingPromptEditorModalPropsParts.saveLabel.text).toBe("Saving...")
    const dockChrome = getChatRuntimeDockChromeMobileRenderState({
      scrollToBottomVisible: true,
      voiceOverlayListening: true,
      voiceOverlayHandsFree: false,
      voiceOverlayWillCancel: true,
      queuePanelEnabled: true,
      queuePanelMessageCount: 2,
      connectionState: {
        status: "reconnecting",
        retryCount: 1,
        lastError: "Network offline",
        isAppActive: true,
      },
      lastFailedMessage: "Retry this later",
      isResponding: true,
      colors: viewportChromeColors,
    })
    expect(dockChrome.scrollToBottom.shouldRender).toBe(true)
    expect(dockChrome.voiceOverlay.isVisible).toBe(true)
    expect(dockChrome.voiceOverlay.label).toBe("Release to edit")
    expect(dockChrome.queuePanel.shouldRender).toBe(true)
    expect(dockChrome.connectionBanner.reconnecting.shouldRender).toBe(true)
    const dockChromeProps = createChatRuntimeDockChromeMobileProps({
      responseHistoryResponses: ["response-1"],
      responseHistoryTtsProvider: "openai",
      responseHistoryRemoteTtsVoice: "voice-1",
      responseHistoryRemoteTtsModel: "model-1",
      responseHistoryTtsRate: 1,
      responseHistoryTtsPitch: 1,
      responseHistoryTtsVoiceId: "native-voice",
      responseHistoryRemoteBaseUrl: "https://example.test",
      responseHistoryRemoteApiKey: "api-key",
      speakNative: "speak-native",
      stopNativeSpeech: "stop-native",
      speakRemote: "speak-remote",
      stopRemoteSpeech: "stop-remote",
      scrollToBottomVisible: true,
      onScrollToBottom: "scroll-bottom",
      voiceOverlayListening: true,
      voiceOverlayHandsFree: false,
      voiceOverlayWillCancel: true,
      voiceOverlayTranscript: "draft transcript",
      queuePanelEnabled: true,
      queuePanelConversationId: "conversation-1",
      queuedMessages: ["queued-message-1", "queued-message-2"],
      onRemoveQueuedMessage: "remove-queued",
      onUpdateQueuedMessage: "update-queued",
      onRetryQueuedMessage: "retry-queued",
      onProcessNextQueuedMessage: "process-next",
      canProcessNextQueuedMessage: true,
      onClearQueuedMessages: "clear-queued",
      isMessageQueuePaused: false,
      onPauseMessageQueue: "pause-queue",
      onResumeMessageQueue: "resume-queue",
      connectionState: {
        status: "reconnecting",
        retryCount: 1,
        lastError: "Network offline",
        isAppActive: true,
      },
      lastFailedMessage: "Retry this later",
      isResponding: true,
      colors: viewportChromeColors,
      onConnectionBannerRetry: "retry-connection",
      composer: "runtime-composer",
    })
    expect(dockChromeProps.responseHistoryPanel.responses).toEqual(["response-1"])
    expect(dockChromeProps.responseHistoryPanel.speakRemote).toBe("speak-remote")
    expect(dockChromeProps.scrollToBottomButton.renderState.shouldRender).toBe(true)
    expect(dockChromeProps.scrollToBottomButton.onPress).toBe("scroll-bottom")
    expect(dockChromeProps.voiceOverlay.label).toBe("Release to edit")
    expect(dockChromeProps.voiceOverlay.transcript).toBe("draft transcript")
    expect(dockChromeProps.queuePanel.shouldRender).toBe(true)
    expect(dockChromeProps.queuePanel.panel.messages).toEqual(["queued-message-1", "queued-message-2"])
    expect(dockChromeProps.connectionBanner.onRetry).toBe("retry-connection")
    expect(dockChromeProps.composer).toBe("runtime-composer")
    expect(getChatRuntimeDebugPanelsMobileRenderState({
      requestDebugText: "Request sent",
      voiceDebugEnabled: true,
      voiceEntryCount: 1,
      voiceRows: [{ key: "voice-1", text: "Listening" }],
    })).toEqual({
      requestShouldRender: true,
      requestRows: [{ key: "request-debug", text: "Request sent" }],
      voiceShouldRender: true,
      voiceRows: [{ key: "voice-1", text: "Listening" }],
    })
    expect(getChatRuntimeDebugPanelsMobileRenderState({
      requestDebugText: "",
      voiceDebugEnabled: true,
      voiceEntryCount: 0,
      voiceRows: [{ key: "voice-title", text: "Voice events" }],
    })).toEqual({
      requestShouldRender: false,
      requestRows: [],
      voiceShouldRender: false,
      voiceRows: [{ key: "voice-title", text: "Voice events" }],
    })
    const debugPanelsDisplayState = getChatRuntimeDebugPanelsMobileDisplayState({
      requestDebugText: "Request sent",
      voiceDebugEnabled: true,
      voiceEvents: [{
        id: "voice-1",
        at: 0,
        type: "recognizer-start",
        summary: "Recognizer started",
      }],
    })
    expect(debugPanelsDisplayState.requestRows).toEqual([{ key: "request-debug", text: "Request sent" }])
    expect(debugPanelsDisplayState.voiceShouldRender).toBe(true)
    expect(debugPanelsDisplayState.voiceRows[0]).toEqual({
      key: "voice-debug-title",
      text: "Voice debug",
    })
    expect(debugPanelsDisplayState.voiceRows[1]?.key).toBe("voice-1")
    expect(debugPanelsDisplayState.voiceRows[1]?.text).toContain("Recognizer started")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.spinnerSize).toBe(14)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.spinnerResizeMode).toBe("contain")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.alignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.accessibilityRole).toBe("progressbar")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.accessibilityState).toEqual({ busy: true })
    expect(getChatRuntimeInlineActivityMobileState()).toBe(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity)
    expect(getChatRuntimeInlineActivityMobileRenderState({
      isResponding: true,
      message: {
        role: "assistant",
        content: "",
        toolCalls: [],
        toolResults: [],
      },
    })).toEqual({
      shouldRender: true,
      accessibilityRole: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.accessibilityRole,
      accessibilityLabel: CHAT_RUNTIME_PRESENTATION.activity.thinkingAccessibilityLabel,
      accessibilityState: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.accessibilityState,
      spinnerResizeMode: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.spinnerResizeMode,
    })
    const inlineActivityParts = createChatRuntimeInlineActivityMobilePropsParts({
      renderState: {
        shouldRender: true,
        accessibilityRole: "progressbar",
        accessibilityLabel: "Assistant is thinking",
        accessibilityState: { busy: true },
        spinnerResizeMode: "contain",
      },
      spinnerSource: "spinner-source",
      style: "inline-style",
      spinnerStyle: "inline-spinner-style",
    })
    expect(inlineActivityParts).toEqual({
      shouldRenderInlineActivity: true,
      container: {
        props: {
          accessible: true,
          accessibilityRole: "progressbar",
          accessibilityLabel: "Assistant is thinking",
          accessibilityState: { busy: true },
          style: "inline-style",
        },
        content: {
          spinner: {
            props: {
              source: "spinner-source",
              style: "inline-spinner-style",
              resizeMode: "contain",
            },
          },
        },
      },
    })
    expect(createChatRuntimeInlineActivityMobilePropsParts({
      renderState: {
        shouldRender: false,
        accessibilityRole: "progressbar",
        accessibilityLabel: "Assistant is thinking",
        accessibilityState: { busy: true },
        spinnerResizeMode: "contain",
      },
      spinnerSource: "spinner-source",
      style: "inline-style",
      spinnerStyle: "inline-spinner-style",
    }).shouldRenderInlineActivity).toBe(false)
    expect(getChatRuntimeInlineActivityMobileRenderState({
      isResponding: false,
      message: { role: "assistant", content: "" },
    }).shouldRender).toBe(false)
    expect(getChatRuntimeInlineActivityMobileRenderState({
      isResponding: true,
      message: { role: "assistant", content: "Done" },
    }).shouldRender).toBe(false)
    expect(getChatRuntimeInlineActivityMobileRenderState({
      isResponding: true,
      message: { role: "assistant", content: "", toolCalls: [{ name: "search" }] },
    }).shouldRender).toBe(false)
    expect(getChatRuntimeInlineActivityMobileIndicatorState({
      isResponding: true,
      message: {
        role: "assistant",
        content: "",
        toolCalls: [],
        toolResults: [],
      },
      spinnerSource: "spinner.png",
    })).toEqual({
      renderState: getChatRuntimeInlineActivityMobileRenderState({
        isResponding: true,
        message: {
          role: "assistant",
          content: "",
          toolCalls: [],
          toolResults: [],
        },
      }),
      spinnerSource: "spinner.png",
    })
    expect(getChatRuntimeInlineActivityMobileIndicatorState({
      isResponding: false,
      message: { role: "assistant", content: "" },
      spinnerSource: "spinner.png",
    })).toBeNull()
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.mobileIcon).toMatchObject({
      name: "pulse-outline",
      size: 13,
    })
    expect(getChatRuntimeStreamingContentMobileIconState()).toEqual({
      name: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.mobileIcon.name,
      size: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.mobileIcon.size,
      colorToken: "info",
    })
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.headerFlexDirection).toBe("row")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.headerAlignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.titleMinWidth).toBe(0)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.titleFlexShrink).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.titleNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.accessibilityRole).toBe("text")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.badgeMarginLeft).toBe("auto")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.bodyRowFlexDirection).toBe("row")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.bodyRowAlignItems).toBe("flex-end")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.textFlex).toBe(1)
    expect("glyph" in CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent).toBe(false)
    expect("glyphFontSize" in CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent).toBe(false)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.titleColorToken).toBe("info")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.textColorToken).toBe("foreground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.badgeTextFontWeight).toBe("700")
    expect(getChatRuntimeStreamingContentMobileState()).toBe(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent)
    expect(getChatRuntimeStreamingContentMobileColors({
      info: "#2563eb",
      foreground: "#0f172a",
    })).toEqual({
      icon: {
        color: "#2563eb",
      },
      title: {
        color: "#2563eb",
      },
      badge: {
        backgroundColor: "rgba(37, 99, 235, 0.12)",
      },
      badgeText: {
        color: "#2563eb",
      },
      text: {
        color: "#0f172a",
      },
      caret: {
        backgroundColor: "#2563eb",
      },
    })
    expect(getChatRuntimeStreamingContentState({
      isStreaming: true,
      content: "Hello live",
    })).toEqual({
      shouldRender: true,
      hasContent: true,
      isStreaming: true,
      title: "Generating response...",
      accessibilityLabel: "Generating response...",
      badgeLabel: "Streaming",
      content: "Hello live",
    })
    expect(getChatRuntimeStreamingContentState()).toEqual({
      shouldRender: false,
      hasContent: false,
      isStreaming: false,
      title: "Response",
      accessibilityLabel: "Response",
      badgeLabel: "Streaming",
      content: "",
    })
    expect(getChatRuntimeStreamingContentMobileRenderState({
      isStreaming: true,
      content: "Hello live",
      colors: {
        info: "#2563eb",
        foreground: "#0f172a",
      },
    })).toEqual({
      shouldRender: true,
      surface: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent,
      colors: getChatRuntimeStreamingContentMobileColors({
        info: "#2563eb",
        foreground: "#0f172a",
      }),
      title: "Generating response...",
      accessibilityRole: "text",
      accessibilityLabel: "Generating response...",
      badgeLabel: "Streaming",
      content: "Hello live",
      icon: {
        name: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.mobileIcon.name,
        size: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.mobileIcon.size,
        color: "#2563eb",
      },
      spinner: {
        size: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.spinnerSize,
        resizeMode: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.spinnerResizeMode,
      },
    })
    expect(createChatRuntimeStreamingContentMobileStyleSlots({
      renderState: getChatRuntimeStreamingContentMobileRenderState({
        isStreaming: true,
        content: "Hello live",
        colors: {
          info: "#2563eb",
          foreground: "#0f172a",
        },
      }),
      spacing: {
        xs: 4,
      },
      radius: {
        sm: 6,
      },
    })).toMatchObject({
      header: {
        flexDirection: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.headerFlexDirection,
        alignItems: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.headerAlignItems,
        gap: 4,
        marginBottom: 4,
      },
      title: {
        color: "#2563eb",
        fontWeight: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.titleFontWeight,
      },
      spinner: {
        width: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.spinnerSize,
        height: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.spinnerSize,
      },
      badge: {
        paddingHorizontal: 4,
        borderRadius: 6,
        backgroundColor: "rgba(37, 99, 235, 0.12)",
      },
      badgeText: {
        color: "#2563eb",
        fontWeight: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.badgeTextFontWeight,
      },
      bodyRow: {
        flexDirection: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.bodyRowFlexDirection,
        alignItems: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.streamingContent.bodyRowAlignItems,
      },
      text: {
        color: "#0f172a",
      },
      caret: {
        backgroundColor: "#2563eb",
      },
    })
    const expandedContentStyles = {
      header: "header-style",
      title: "title-style",
      spinner: "spinner-style",
      badge: "badge-style",
      badgeText: "badge-text-style",
      bodyRow: "body-row-style",
      text: "text-style",
      caret: "caret-style",
    }
    const expandedContentParts = createChatRuntimeConversationExpandedContentMobilePropsParts({
      streamingRenderState: {
        shouldRender: true,
        accessibilityRole: "text",
        accessibilityLabel: "Generating response...",
        title: "Generating response...",
        badgeLabel: "Streaming",
        content: "Hello live",
        icon: {
          name: "sparkles",
          size: 14,
          color: "#2563eb",
        },
        spinner: {
          resizeMode: "contain",
        },
        surface: {
          titleNumberOfLines: 1,
        },
      },
      markdownContent: "Markdown content",
      assetBaseUrl: "asset-base",
      assetAuthToken: "asset-token",
      spinnerSource: "spinner-source",
      streamingStyles: expandedContentStyles,
    })
    expect(expandedContentParts).toEqual({
      shouldRenderStreamingContent: true,
      markdown: {
        content: "Markdown content",
        assetBaseUrl: "asset-base",
        assetAuthToken: "asset-token",
      },
      header: {
        props: {
          accessible: true,
          accessibilityRole: "text",
          accessibilityLabel: "Generating response...",
          style: "header-style",
        },
      },
      icon: {
        props: {
          name: "sparkles",
          size: 14,
          color: "#2563eb",
        },
      },
      title: {
        text: "Generating response...",
        props: {
          style: "title-style",
          numberOfLines: 1,
        },
      },
      spinner: {
        props: {
          source: "spinner-source",
          style: "spinner-style",
          resizeMode: "contain",
        },
      },
      badge: {
        props: {
          style: "badge-style",
        },
      },
      badgeLabel: {
        text: "Streaming",
        props: {
          style: "badge-text-style",
        },
      },
      body: {
        props: {
          style: "body-row-style",
        },
      },
      text: {
        text: "Hello live",
        props: {
          style: "text-style",
        },
      },
      caret: {
        props: {
          style: "caret-style",
        },
      },
    })
    expect(createChatRuntimeConversationExpandedContentMobilePropsParts({
      streamingRenderState: {
        shouldRender: false,
        accessibilityRole: "text",
        accessibilityLabel: "Response",
        title: "Response",
        badgeLabel: "Streaming",
        content: "",
        icon: {
          name: "sparkles",
          size: 14,
          color: "#2563eb",
        },
        spinner: {
          resizeMode: "contain",
        },
        surface: {
          titleNumberOfLines: 1,
        },
      },
      markdownContent: "Markdown content",
      spinnerSource: "spinner-source",
      streamingStyles: expandedContentStyles,
    }).shouldRenderStreamingContent).toBe(false)
    const collapsedPreviewParts = createChatRuntimeConversationCollapsedPreviewMobilePropsParts({
      renderState: {
        accessibilityRole: "button",
        hitSlop: 8,
        numberOfLines: 2,
        text: "Preview text",
      },
      actionState: {
        disabled: false,
        accessibilityLabel: "Expand message",
        accessibilityHint: "Shows full message",
        accessibilityState: {
          expanded: false,
        },
        ariaExpanded: false,
      },
      onPress: "on-press",
      style: "preview-style",
      pressedStyle: "preview-pressed-style",
      textStyle: "preview-text-style",
    })
    expect(collapsedPreviewParts).toMatchObject({
      pressable: {
        props: {
          onPress: "on-press",
          disabled: false,
          accessibilityRole: "button",
          accessibilityLabel: "Expand message",
          accessibilityHint: "Shows full message",
          accessibilityState: {
            expanded: false,
          },
          "aria-expanded": false,
          hitSlop: 8,
        },
      },
      text: {
        text: "Preview text",
        props: {
          style: "preview-text-style",
          numberOfLines: 2,
        },
      },
    })
    expect(collapsedPreviewParts.pressable.props.style({ pressed: false })).toEqual([
      "preview-style",
      false,
    ])
    expect(collapsedPreviewParts.pressable.props.style({ pressed: true })).toEqual([
      "preview-style",
      "preview-pressed-style",
    ])
    const disabledCollapsedPreviewParts = createChatRuntimeConversationCollapsedPreviewMobilePropsParts({
      renderState: {
        accessibilityRole: "button",
        hitSlop: 8,
        numberOfLines: 2,
        text: "Preview text",
      },
      actionState: {
        disabled: true,
        accessibilityLabel: "Expand message",
        accessibilityState: {
          disabled: true,
        },
        ariaExpanded: false,
      },
      style: "preview-style",
      pressedStyle: "preview-pressed-style",
      textStyle: "preview-text-style",
    })
    expect(disabledCollapsedPreviewParts.pressable.props.style({ pressed: true })).toEqual([
      "preview-style",
      false,
    ])
    const conversationActionEntries = [
      { slot: "copy", item: "copy" },
    ]
    const conversationExpandedContentParts = createChatRuntimeConversationContentMobilePropsParts({
      contentDisplayMode: "expanded",
      rowStyle: "content-row-style",
      shouldRenderActionSlots: true,
      entries: conversationActionEntries,
      expanded: {
        streamingRenderState: expandedContentParts.header,
        markdownContent: "Markdown content",
        assetBaseUrl: "asset-base",
        assetAuthToken: "asset-token",
        spinnerSource: "spinner-source",
        streamingStyles: expandedContentStyles,
        bodyStyle: "expanded-body-style",
      },
      collapsed: collapsedPreviewParts,
    })
    expect(conversationExpandedContentParts).toEqual({
      expandedContent: {
        shouldRender: true,
        props: {
          row: {
            props: {
              rowStyle: "content-row-style",
              bodyStyle: "expanded-body-style",
              shouldRenderActionSlots: true,
              entries: conversationActionEntries,
            },
          },
          content: {
            props: {
              streamingRenderState: expandedContentParts.header,
              markdownContent: "Markdown content",
              assetBaseUrl: "asset-base",
              assetAuthToken: "asset-token",
              spinnerSource: "spinner-source",
              streamingStyles: expandedContentStyles,
            },
          },
        },
      },
      collapsedContent: {
        shouldRender: false,
        props: null,
      },
    })
    expect(createChatRuntimeConversationContentMobilePropsParts({
      contentDisplayMode: "collapsed",
      rowStyle: "content-row-style",
      shouldRenderActionSlots: false,
      entries: conversationActionEntries,
      expanded: {
        bodyStyle: "expanded-body-style",
      },
      collapsed: collapsedPreviewParts,
    })).toEqual({
      expandedContent: {
        shouldRender: false,
        props: null,
      },
      collapsedContent: {
        shouldRender: true,
        props: {
          row: {
            props: {
              rowStyle: "content-row-style",
              shouldRenderActionSlots: false,
              entries: conversationActionEntries,
            },
          },
          preview: {
            props: collapsedPreviewParts,
          },
        },
      },
    })
    expect(createChatRuntimeConversationContentMobilePropsParts({
      contentDisplayMode: "hidden",
      rowStyle: "content-row-style",
      shouldRenderActionSlots: false,
      entries: conversationActionEntries,
      expanded: {
        bodyStyle: "expanded-body-style",
      },
      collapsed: collapsedPreviewParts,
    })).toEqual({
      expandedContent: {
        shouldRender: false,
        props: null,
      },
      collapsedContent: {
        shouldRender: false,
        props: null,
      },
    })
    expect(getChatRuntimeStreamingContentMobileRenderState({
      colors: {
        info: "#2563eb",
        foreground: "#0f172a",
      },
    })).toMatchObject({
      shouldRender: false,
      title: "Response",
      content: "",
    })
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.paddingVertical).toBe("xs")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.flexDirection).toBe("row")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.summaryFontSize).toBe(12)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.summaryLineHeight).toBe(16)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.textColorToken).toBe("mutedForeground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.flexDirection).toBe("row")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.alignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.accessibilityRole).toBe("button")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.gap).toBe("xs")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.fontWeight).toBe("700")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.pressedOpacity).toBe(0.8)
    expect(CHAT_RUNTIME_PRESENTATION.messageHistory.mobileIcon.loadEarlierName).toBe("chevron-up")
    expect(getChatRuntimeMessageHistoryLoadEarlierMobileIconState()).toEqual({
      name: "chevron-up",
      size: 13,
      colorToken: "foreground",
    })
    expect(getChatRuntimeMessageHistoryBannerMobileState()).toBe(
      CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner,
    )
    expect(getChatRuntimeMessageHistoryBannerMobileColors({
      mutedForeground: "#64748b",
      border: "#e2e8f0",
      muted: "#f1f5f9",
      foreground: "#0f172a",
    })).toEqual({
      summary: {
        color: "#64748b",
      },
      loadButton: {
        borderColor: "#e2e8f0",
        backgroundColor: "rgba(241, 245, 249, 0.35)",
        color: "#0f172a",
      },
      loadIcon: {
        color: "#0f172a",
      },
    })
    expect(createChatRuntimeMessageHistoryBannerMobileStyleSlots({
      renderState: getChatRuntimeMessageHistoryBannerMobileRenderState({
        visibleCount: 40,
        totalCount: 100,
        hiddenCount: 60,
        loadIncrement: 30,
        colors: {
          mutedForeground: "#64748b",
          border: "#e2e8f0",
          muted: "#f1f5f9",
          foreground: "#0f172a",
        },
      }),
      spacing: {
        xs: 4,
        sm: 8,
      },
      radius: {
        sm: 6,
      },
    })).toMatchObject({
      container: {
        flexDirection: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.flexDirection,
        flexWrap: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.flexWrap,
        justifyContent: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.justifyContent,
        alignItems: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.alignItems,
        gap: 4,
        paddingVertical: 4,
      },
      summaryText: {
        color: "#64748b",
        fontSize: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.summaryFontSize,
        lineHeight: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.summaryLineHeight,
        textAlign: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.textAlign,
      },
      loadButton: {
        flexDirection: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.flexDirection,
        alignItems: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.alignItems,
        justifyContent: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.justifyContent,
        gap: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderColor: "#e2e8f0",
        backgroundColor: "rgba(241, 245, 249, 0.35)",
      },
      loadButtonPressed: {
        opacity: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.pressedOpacity,
      },
      loadButtonText: {
        color: "#0f172a",
        fontWeight: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.fontWeight,
      },
    })
    const historyBannerParts = createChatRuntimeMessageHistoryBannerMobilePropsParts({
      renderState: {
        shouldRender: true,
        summaryLabel: "Showing latest 40 of 100 messages",
        loadButton: {
          accessibilityRole: "button",
          accessibilityLabel: "Load 30 earlier messages",
          label: "Load earlier",
          icon: {
            name: "chevron-up",
            size: 13,
            color: "#0f172a",
          },
        },
      },
      onLoadEarlier: "load-earlier",
      styles: {
        container: "container-style",
        summary: "summary-style",
        loadButton: "load-button-style",
        loadButtonPressed: "load-button-pressed-style",
        loadButtonText: "load-button-text-style",
      },
    })
    expect(historyBannerParts).toMatchObject({
      shouldRenderBanner: true,
      container: {
        props: {
          style: "container-style",
        },
      },
      summary: {
        text: "Showing latest 40 of 100 messages",
        props: {
          style: "summary-style",
        },
      },
      loadButton: {
        props: {
          onPress: "load-earlier",
          accessibilityRole: "button",
          accessibilityLabel: "Load 30 earlier messages",
        },
      },
      icon: {
        props: {
          name: "chevron-up",
          size: 13,
          color: "#0f172a",
        },
      },
      loadButtonLabel: {
        text: "Load earlier",
        props: {
          style: "load-button-text-style",
        },
      },
    })
    expect(historyBannerParts.loadButton.props.style({ pressed: false })).toEqual([
      "load-button-style",
      false,
    ])
    expect(historyBannerParts.loadButton.props.style({ pressed: true })).toEqual([
      "load-button-style",
      "load-button-pressed-style",
    ])
    expect(createChatRuntimeMessageHistoryBannerMobilePropsParts({
      renderState: {
        shouldRender: false,
        summaryLabel: "Showing latest 40 of 100 messages",
        loadButton: {
          accessibilityRole: "button",
          accessibilityLabel: "Load 30 earlier messages",
          label: "Load earlier",
          icon: {
            name: "chevron-up",
            size: 13,
            color: "#0f172a",
          },
        },
      },
      styles: {
        container: "container-style",
        summary: "summary-style",
        loadButton: "load-button-style",
        loadButtonPressed: "load-button-pressed-style",
        loadButtonText: "load-button-text-style",
      },
    }).shouldRenderBanner).toBe(false)
    expect(getChatRuntimeMessageHistoryBannerState({
      visibleCount: 40,
      totalCount: 100,
      hiddenCount: 60,
      loadIncrement: 30,
      includeScrollHint: true,
    })).toEqual({
      shouldRender: true,
      visibleCount: 40,
      totalCount: 100,
      hiddenCount: 60,
      summaryLabel: "Showing latest 40 of 100 messages. Scroll up to load older messages.",
      loadEarlierLabel: "Load 30 earlier",
    })
    expect(getChatRuntimeMessageHistoryBannerState({
      visibleCount: 100,
      totalCount: 100,
    })).toEqual({
      shouldRender: false,
      visibleCount: 100,
      totalCount: 100,
      hiddenCount: 0,
      summaryLabel: "",
      loadEarlierLabel: "",
    })
    expect(getChatRuntimeMessageHistoryBannerMobileRenderState({
      visibleCount: 40,
      totalCount: 100,
      hiddenCount: 60,
      loadIncrement: 30,
      includeScrollHint: true,
      colors: {
        mutedForeground: "#64748b",
        border: "#e2e8f0",
        muted: "#f1f5f9",
        foreground: "#0f172a",
      },
    })).toEqual({
      shouldRender: true,
      surface: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner,
      colors: getChatRuntimeMessageHistoryBannerMobileColors({
        mutedForeground: "#64748b",
        border: "#e2e8f0",
        muted: "#f1f5f9",
        foreground: "#0f172a",
      }),
      summaryLabel: "Showing latest 40 of 100 messages. Scroll up to load older messages.",
      loadButton: {
        accessibilityRole: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.accessibilityRole,
        accessibilityLabel: "Load 30 earlier",
        label: "Load 30 earlier",
        icon: {
          name: CHAT_RUNTIME_PRESENTATION.messageHistory.mobileIcon.loadEarlierName,
          size: CHAT_RUNTIME_PRESENTATION.messageHistory.mobileIcon.size,
          color: "#0f172a",
        },
        pressedOpacity: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryBanner.loadButton.pressedOpacity,
      },
    })
    expect(getChatRuntimeMessageHistoryBannerMobileRenderState({
      visibleCount: 100,
      totalCount: 100,
      colors: {
        mutedForeground: "#64748b",
        border: "#e2e8f0",
        muted: "#f1f5f9",
        foreground: "#0f172a",
      },
    })).toMatchObject({
      shouldRender: false,
      summaryLabel: "",
      loadButton: {
        accessibilityLabel: "",
        label: "",
      },
    })
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryWindow.initialVisibleCount).toBe(80)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryWindow.loadIncrement).toBe(60)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryWindow.topLoadThresholdPx).toBe(120)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryWindow.bottomResumeThresholdPx).toBe(50)
    expect(getChatRuntimeMessageHistoryWindowMobileState()).toBe(
      CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.messageHistoryWindow,
    )
    expect(getChatRuntimeMessageHistoryWindowMobileDisplayState({
      messages: ["one", "two", "three", "four"],
      visibleMessageCount: 2,
    })).toEqual({
      firstVisibleMessageIndex: 2,
      visibleMessages: ["three", "four"],
      hiddenMessageCount: 2,
    })
    expect(getChatRuntimeMessageHistoryWindowMobileDisplayState({
      messages: ["one", "two"],
      visibleMessageCount: 80,
    })).toEqual({
      firstVisibleMessageIndex: 0,
      visibleMessages: ["one", "two"],
      hiddenMessageCount: 0,
    })
    expect(getChatRuntimeMessageHistoryWindowMobileExpandedVisibleCount({
      currentVisibleCount: 80,
      messageCount: 220,
      loadIncrement: 60,
    })).toBe(140)
    expect(getChatRuntimeMessageHistoryWindowMobileExpandedVisibleCount({
      currentVisibleCount: 190,
      messageCount: 220,
      loadIncrement: 60,
    })).toBe(220)
    expect(getChatRuntimeMessageHistoryWindowMobileClampedVisibleCount({
      currentVisibleCount: 20,
      messageCount: 140,
      initialVisibleCount: 80,
    })).toBe(80)
    expect(getChatRuntimeMessageHistoryWindowMobileClampedVisibleCount({
      currentVisibleCount: 120,
      messageCount: 90,
      initialVisibleCount: 80,
    })).toBe(90)
    expect(getChatRuntimeMessageHistoryWindowMobileClampedVisibleCount({
      currentVisibleCount: 120,
      messageCount: 0,
      initialVisibleCount: 80,
    })).toBe(80)
    expect(getChatRuntimeMessageHistoryWindowMobileIsAtBottom({
      viewportHeight: 600,
      scrollOffsetY: 350,
      contentHeight: 1000,
      bottomResumeThresholdPx: 50,
    })).toBe(true)
    expect(getChatRuntimeMessageHistoryWindowMobileIsAtBottom({
      viewportHeight: 600,
      scrollOffsetY: 349,
      contentHeight: 1000,
      bottomResumeThresholdPx: 50,
    })).toBe(false)
    expect(getChatRuntimeMessageHistoryWindowMobileShouldLoadEarlier({
      scrollOffsetY: 120,
      visibleMessageCount: 80,
      messageCount: 140,
      topLoadThresholdPx: 120,
    })).toBe(true)
    expect(getChatRuntimeMessageHistoryWindowMobileShouldLoadEarlier({
      scrollOffsetY: 121,
      visibleMessageCount: 80,
      messageCount: 140,
      topLoadThresholdPx: 120,
    })).toBe(false)
    expect(getChatRuntimeMessageHistoryWindowMobileShouldLoadEarlier({
      scrollOffsetY: 100,
      visibleMessageCount: 140,
      messageCount: 140,
      topLoadThresholdPx: 120,
    })).toBe(false)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.reconnecting.backgroundColorToken).toBe("info")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.reconnecting.spinnerSize).toBe("small")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.contentFlexDirection).toBe("row")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.contentAlignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.textContainerFlex).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.titleColorToken).toBe("foreground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.subtitleColorToken).toBe("mutedForeground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.subtitleNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.accessibilityRole).toBe("alert")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.retryButton.foregroundColorToken).toBe("primaryForeground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.retryButton.fontWeight).toBe("600")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.retryButton.accessibilityRole).toBe("button")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.retryButton.pressedOpacity).toBe(0.7)
    expect(getChatRuntimeConnectionBannerMobileState()).toBe(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner)
    const connectionBannerPalette = {
      info: "#2563eb",
      warning: "#d97706",
      destructive: "#dc2626",
      foreground: "#0f172a",
      mutedForeground: "#64748b",
      primary: "#111827",
      primaryForeground: "#f8fafc",
    }
    expect(getChatRuntimeConnectionBannerMobileColors(connectionBannerPalette)).toEqual({
      reconnecting: {
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        borderColor: "rgba(37, 99, 235, 0.3)",
        spinner: {
          color: "#d97706",
        },
      },
      failed: {
        backgroundColor: "rgba(220, 38, 38, 0.1)",
        borderColor: "rgba(220, 38, 38, 0.3)",
        icon: {
          color: "#dc2626",
        },
      },
      title: {
        color: "#0f172a",
      },
      subtitle: {
        color: "#64748b",
      },
      retryButton: {
        backgroundColor: "#111827",
        color: "#f8fafc",
      },
    })
    const reconnectingBanner = getChatRuntimeConnectionBannerMobileRenderState({
      connectionState: {
        status: "reconnecting",
        retryCount: 2,
        lastError: "Network offline",
        isAppActive: true,
      },
      lastFailedMessage: "Retry this later",
      isResponding: true,
      colors: connectionBannerPalette,
    })
    expect(reconnectingBanner.surface).toBe(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner)
    expect(reconnectingBanner.colors).toEqual(getChatRuntimeConnectionBannerMobileColors(connectionBannerPalette))
    expect(reconnectingBanner.reconnecting).toEqual({
      shouldRender: true,
      title: "Reconnecting... (attempt 2)",
      subtitle: "Network offline",
      accessibilityRole: "alert",
      accessibilityLabel: "Reconnecting... (attempt 2). Network offline",
      spinner: {
        size: "small",
        color: "#d97706",
      },
    })
    expect(reconnectingBanner.failed.shouldRender).toBe(false)
    const failedBanner = getChatRuntimeConnectionBannerMobileRenderState({
      lastFailedMessage: "Retry this now",
      isResponding: false,
      colors: connectionBannerPalette,
    })
    expect(failedBanner.reconnecting.shouldRender).toBe(false)
    expect(failedBanner.failed).toEqual({
      shouldRender: true,
      title: "Message failed to send",
      subtitle: "Tap retry to try again",
      accessibilityRole: "alert",
      accessibilityLabel: "Message failed to send. Tap retry to try again",
      icon: {
        name: "warning-outline",
        size: 16,
        color: "#dc2626",
      },
      retryButton: {
        label: "Retry",
        accessibilityRole: "button",
        accessibilityLabel: "Retry",
        pressedOpacity: 0.7,
      },
    })
    const connectionBannerStyles = {
      banner: "banner-style",
      reconnecting: "reconnecting-style",
      failed: "failed-style",
      content: "content-style",
      icon: "icon-style",
      textContainer: "text-container-style",
      title: "title-style",
      subtitle: "subtitle-style",
      retryButton: "retry-button-style",
      retryButtonText: "retry-button-text-style",
    }
    expect(createChatRuntimeConnectionBannerMobilePropsParts({
      renderState: reconnectingBanner,
      onRetry: "retry-handler",
      styles: connectionBannerStyles,
    })).toEqual({
      reconnecting: {
        shouldRender: true,
        container: {
          props: {
            accessible: true,
            accessibilityRole: "alert",
            accessibilityLabel: "Reconnecting... (attempt 2). Network offline",
            style: ["banner-style", "reconnecting-style"],
          },
        },
        content: {
          props: {
            style: "content-style",
          },
        },
        spinner: {
          props: {
            size: "small",
            color: "#d97706",
            style: "icon-style",
          },
        },
        textContainer: {
          props: {
            style: "text-container-style",
          },
        },
        title: {
          props: {
            text: "Reconnecting... (attempt 2)",
            props: {
              style: "title-style",
            },
          },
        },
        subtitle: {
          shouldRender: true,
          props: {
            text: "Network offline",
            props: {
              style: "subtitle-style",
              numberOfLines: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.subtitleNumberOfLines,
            },
          },
        },
      },
      failed: {
        shouldRender: false,
        container: {
          props: {
            accessible: true,
            accessibilityRole: "alert",
            accessibilityLabel: "Message failed to send. Tap retry to try again",
            style: ["banner-style", "failed-style"],
          },
        },
        content: {
          props: {
            style: "content-style",
          },
        },
        icon: {
          props: {
            name: "warning-outline",
            size: 16,
            color: "#dc2626",
            style: "icon-style",
          },
        },
        textContainer: {
          props: {
            style: "text-container-style",
          },
        },
        title: {
          props: {
            text: "Message failed to send",
            props: {
              style: "title-style",
            },
          },
        },
        subtitle: {
          props: {
            text: "Tap retry to try again",
            props: {
              style: "subtitle-style",
              numberOfLines: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.subtitleNumberOfLines,
            },
          },
        },
        retryButton: {
          props: {
            style: "retry-button-style",
            onPress: "retry-handler",
            accessibilityRole: "button",
            accessibilityLabel: "Retry",
            activeOpacity: 0.7,
          },
        },
        retryLabel: {
          props: {
            text: "Retry",
            props: {
              style: "retry-button-text-style",
            },
          },
        },
      },
    })
    expect(createChatRuntimeConnectionBannerMobilePropsParts({
      renderState: failedBanner,
      onRetry: "retry-handler",
      styles: connectionBannerStyles,
    })).toEqual({
      reconnecting: {
        shouldRender: false,
        container: {
          props: {
            accessible: true,
            accessibilityRole: "alert",
            accessibilityLabel: "",
            style: ["banner-style", "reconnecting-style"],
          },
        },
        content: {
          props: {
            style: "content-style",
          },
        },
        spinner: {
          props: {
            size: "small",
            color: "#d97706",
            style: "icon-style",
          },
        },
        textContainer: {
          props: {
            style: "text-container-style",
          },
        },
        title: {
          props: {
            text: "",
            props: {
              style: "title-style",
            },
          },
        },
        subtitle: {
          shouldRender: false,
          props: {
            text: "",
            props: {
              style: "subtitle-style",
              numberOfLines: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.subtitleNumberOfLines,
            },
          },
        },
      },
      failed: {
        shouldRender: true,
        container: {
          props: {
            accessible: true,
            accessibilityRole: "alert",
            accessibilityLabel: "Message failed to send. Tap retry to try again",
            style: ["banner-style", "failed-style"],
          },
        },
        content: {
          props: {
            style: "content-style",
          },
        },
        icon: {
          props: {
            name: "warning-outline",
            size: 16,
            color: "#dc2626",
            style: "icon-style",
          },
        },
        textContainer: {
          props: {
            style: "text-container-style",
          },
        },
        title: {
          props: {
            text: "Message failed to send",
            props: {
              style: "title-style",
            },
          },
        },
        subtitle: {
          props: {
            text: "Tap retry to try again",
            props: {
              style: "subtitle-style",
              numberOfLines: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.connectionBanner.subtitleNumberOfLines,
            },
          },
        },
        retryButton: {
          props: {
            style: "retry-button-style",
            onPress: "retry-handler",
            accessibilityRole: "button",
            accessibilityLabel: "Retry",
            activeOpacity: 0.7,
          },
        },
        retryLabel: {
          props: {
            text: "Retry",
            props: {
              style: "retry-button-text-style",
            },
          },
        },
      },
    })
    expect(createChatRuntimeConnectionBannerMobileStyleSlots({
      renderState: failedBanner,
      spacing: {
        sm: 8,
        md: 12,
      },
      radius: {
        md: 10,
      },
    })).toEqual({
      banner: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 10,
        borderWidth: 1,
      },
      reconnecting: {
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        borderColor: "rgba(37, 99, 235, 0.3)",
      },
      failed: {
        backgroundColor: "rgba(220, 38, 38, 0.1)",
        borderColor: "rgba(220, 38, 38, 0.3)",
      },
      content: {
        flexDirection: "row",
        alignItems: "center",
      },
      icon: {
        marginRight: 8,
      },
      textContainer: {
        flex: 1,
      },
      title: {
        fontSize: 13,
        fontWeight: "500",
        color: "#0f172a",
      },
      subtitle: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2,
      },
      retryButton: {
        backgroundColor: "#111827",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginLeft: 8,
      },
      retryButtonText: {
        color: "#f8fafc",
        fontSize: 13,
        fontWeight: "600",
      },
    })
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.borderColorToken).toBe("warning")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.headerFlexDirection).toBe("row")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.headerAlignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.titleFlex).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.titleMinWidth).toBe(0)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.titleNumberOfLines).toBe(2)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.metaFlexDirection).toBe("row")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.metaFlexWrap).toBe("wrap")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.metaAlignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.attemptColorToken).toBe("mutedForeground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.countdownOverflow).toBe("hidden")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.descriptionLineHeight).toBe(15)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.descriptionColorToken).toBe("mutedForeground")
    expect(getChatRuntimeRetryStatusMobileState()).toBe(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.borderColorToken).toBe("info")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.headerFlexDirection).toBe("row")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.headerAlignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.headerMinWidth).toBe(0)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.titleFlexShrink).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.titleMinWidth).toBe(0)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.titleNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.badgeNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.actionNumberOfLines).toBe(2)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.metaNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.previewNumberOfLines).toBe(2)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.badgeMarginLeft).toBe("auto")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.badgeMaxWidth).toBe("56%")
    expect(getChatRuntimeStepSummaryMobileState()).toBe(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary)
    expect(getChatRuntimeStepSummaryMobileColors({
      info: "#2563eb",
      foreground: "#0f172a",
      mutedForeground: "#64748b",
    })).toEqual({
      card: {
        borderColor: "rgba(37, 99, 235, 0.3)",
        backgroundColor: "rgba(37, 99, 235, 0.08)",
      },
      title: {
        color: "#2563eb",
      },
      badge: {
        backgroundColor: "rgba(37, 99, 235, 0.12)",
      },
      badgeText: {
        color: "#2563eb",
      },
      action: {
        color: "#0f172a",
      },
      meta: {
        color: "#64748b",
      },
      preview: {
        color: "#64748b",
      },
    })
    expect(getChatRuntimeStepSummaryMobileRenderState({
      summary: {
        stepNumber: 3,
        actionSummary: "Compared mobile and desktop chat chrome",
        importance: "high",
        keyFindings: ["Mobile did not surface generated step summaries"],
      },
      colors: {
        info: "#2563eb",
        foreground: "#0f172a",
        mutedForeground: "#64748b",
      },
    })).toEqual({
      shouldRender: true,
      surface: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary,
      colors: getChatRuntimeStepSummaryMobileColors({
        info: "#2563eb",
        foreground: "#0f172a",
        mutedForeground: "#64748b",
      }),
      title: "Latest activity",
      badgeLabel: "Summary · Step 3",
      actionSummary: "Compared mobile and desktop chat chrome",
      meta: "Step 3 · High importance · 1 key finding",
      preview: "Mobile did not surface generated step summaries",
      accessibilityRole: "text",
      accessibilityLabel: "Latest activity. Step 3 · High importance · 1 key finding. Compared mobile and desktop chat chrome. Mobile did not surface generated step summaries",
    })
    expect(createChatRuntimeStepSummaryMobileStyleSlots({
      renderState: getChatRuntimeStepSummaryMobileRenderState({
        summary: {
          stepNumber: 3,
          actionSummary: "Compared mobile and desktop chat chrome",
          importance: "high",
          keyFindings: ["Mobile did not surface generated step summaries"],
        },
        colors: {
          info: "#2563eb",
          foreground: "#0f172a",
          mutedForeground: "#64748b",
        },
      }),
      spacing: {
        xs: 4,
        sm: 8,
      },
      radius: {
        sm: 6,
      },
    })).toEqual({
      card: {
        gap: 4,
        padding: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(37, 99, 235, 0.3)",
        backgroundColor: "rgba(37, 99, 235, 0.08)",
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        minWidth: 0,
      },
      title: {
        flexShrink: 1,
        minWidth: 0,
        color: "#2563eb",
        fontSize: 11,
        fontWeight: "700",
      },
      badge: {
        marginLeft: "auto",
        maxWidth: "56%",
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: "rgba(37, 99, 235, 0.12)",
      },
      badgeText: {
        color: "#2563eb",
        fontSize: 10,
        fontWeight: "700",
      },
      action: {
        color: "#0f172a",
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "600",
      },
      meta: {
        color: "#64748b",
        fontSize: 11,
        lineHeight: 15,
      },
      preview: {
        color: "#64748b",
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
      },
    })
    const stepSummaryCardParts = createChatRuntimeStepSummaryCardMobilePropsParts({
      renderState: {
        shouldRender: true,
        accessibilityRole: "text",
        accessibilityLabel: "Latest activity. Step 3 summary.",
        title: "Latest activity",
        badgeLabel: "Summary · Step 3",
        actionSummary: "Compared mobile and desktop chat chrome",
        meta: "Step 3 · High importance · 1 key finding",
        preview: "Mobile did not surface generated step summaries",
        surface: {
          titleNumberOfLines: 1,
          badgeNumberOfLines: 1,
          actionNumberOfLines: 2,
          metaNumberOfLines: 1,
          previewNumberOfLines: 2,
        },
      },
      styles: {
        card: "card-style",
        header: "header-style",
        title: "title-style",
        badge: "badge-style",
        badgeText: "badge-text-style",
        action: "action-style",
        meta: "meta-style",
        preview: "preview-style",
      },
    })
    expect(stepSummaryCardParts).toEqual({
      shouldRenderCard: true,
      card: {
        props: {
          accessible: true,
          accessibilityRole: "text",
          accessibilityLabel: "Latest activity. Step 3 summary.",
          style: "card-style",
        },
      },
      header: {
        props: {
          style: "header-style",
        },
      },
      title: {
        text: "Latest activity",
        props: {
          style: "title-style",
          numberOfLines: 1,
        },
      },
      badge: {
        props: {
          style: "badge-style",
        },
      },
      badgeLabel: {
        text: "Summary · Step 3",
        props: {
          style: "badge-text-style",
          numberOfLines: 1,
        },
      },
      action: {
        text: "Compared mobile and desktop chat chrome",
        props: {
          style: "action-style",
          numberOfLines: 2,
        },
      },
      meta: {
        text: "Step 3 · High importance · 1 key finding",
        props: {
          style: "meta-style",
          numberOfLines: 1,
        },
      },
      preview: {
        shouldRender: true,
        text: "Mobile did not surface generated step summaries",
        props: {
          style: "preview-style",
          numberOfLines: 2,
        },
      },
    })
    expect(createChatRuntimeStepSummaryCardMobilePropsParts({
      renderState: {
        shouldRender: false,
        accessibilityRole: "text",
        accessibilityLabel: "Latest activity. Step 3 summary.",
        title: "Latest activity",
        badgeLabel: "Summary · Step 3",
        actionSummary: "Compared mobile and desktop chat chrome",
        meta: "Step 3 · High importance · 1 key finding",
        preview: "",
        surface: {
          titleNumberOfLines: 1,
          badgeNumberOfLines: 1,
          actionNumberOfLines: 2,
          metaNumberOfLines: 1,
          previewNumberOfLines: 2,
        },
      },
      styles: {
        card: "card-style",
        header: "header-style",
        title: "title-style",
        badge: "badge-style",
        badgeText: "badge-text-style",
        action: "action-style",
        meta: "meta-style",
        preview: "preview-style",
      },
    })).toMatchObject({
      shouldRenderCard: false,
      preview: {
        shouldRender: false,
      },
    })
    expect(getChatRuntimeStepSummaryState({
      summary: {
        stepNumber: 3,
        actionSummary: "Compared mobile and desktop chat chrome",
        importance: "high",
        keyFindings: ["Mobile did not surface generated step summaries"],
      },
    })).toEqual({
      shouldRender: true,
      title: "Latest activity",
      badgeLabel: "Summary · Step 3",
      stepLabel: "Step 3",
      actionSummary: "Compared mobile and desktop chat chrome",
      meta: "Step 3 · High importance · 1 key finding",
      preview: "Mobile did not surface generated step summaries",
      keyFindingsLabel: "1 key finding",
      accessibilityLabel: "Latest activity. Step 3 · High importance · 1 key finding. Compared mobile and desktop chat chrome. Mobile did not surface generated step summaries",
    })
    expect(getChatRuntimeStepSummaryMobileRenderState({
      colors: {
        info: "#2563eb",
        foreground: "#0f172a",
        mutedForeground: "#64748b",
      },
    })).toMatchObject({
      shouldRender: false,
      badgeLabel: "",
      actionSummary: "",
      meta: "",
      preview: "",
      accessibilityLabel: "",
    })
    expect(getChatRuntimeViewportAffordanceMobileRenderState({
      visibleMessageCount: 40,
      totalMessageCount: 100,
      hiddenMessageCount: 60,
      messageHistoryLoadIncrement: 30,
      latestStepSummary: {
        stepNumber: 3,
        actionSummary: "Compared mobile and desktop chat chrome",
        importance: "high",
        keyFindings: ["Mobile did not surface generated step summaries"],
      },
      colors: conversationChromeStyleColors,
    })).toMatchObject({
      historyBanner: {
        renderState: {
          shouldRender: true,
          summaryLabel: "Showing latest 40 of 100 messages. Scroll up to load older messages.",
        },
      },
      stepSummary: {
        renderState: {
          shouldRender: true,
          badgeLabel: "Summary · Step 3",
        },
      },
    })
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.agentSelectorChip.gap).toBe(3)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.actionsRow.flexDirection).toBe("row")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.actionsRow.alignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.actionFontWeight).toBe("600")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.retryStatus.accessibilityRole).toBe("text")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.stepSummary.accessibilityRole).toBe("text")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.borderColorToken).toBe("info")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.accessibilityRole).toBe("text")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.headerFlexDirection).toBe("row")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.headerAlignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.headerMinWidth).toBe(0)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.titleFlex).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.titleMinWidth).toBe(0)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.titleNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.statusNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.subtitleNumberOfLines).toBe(2)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.metaNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.liveColorToken).toBe("info")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.statusFlexShrink).toBe(0)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.metaFlexDirection).toBe("row")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.metaFlexWrap).toBe("wrap")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.metaAlignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.statuses.completed.colorToken).toBe("success")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewMaxRows).toBe(3)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewLineFlexDirection).toBe("row")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewLineAlignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewLineMinWidth).toBe(0)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewStatusMinWidth).toBe(36)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewStatusAlignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewStatusJustifyContent).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewStatusFlexShrink).toBe(0)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewNameFlex).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewNameMinWidth).toBe(0)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewLabelNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewLabelColorToken).toBe("mutedForeground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewNameNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewNameEllipsizeMode).toBe("tail")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewNameColorToken).toBe("mutedForeground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewMoreNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewMoreFontSize).toBe(10)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewMoreFontWeight).toBe("700")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewMoreColorToken).toBe("mutedForeground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewMoreButtonAlignSelf).toBe("flex-start")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewMoreButtonPressedOpacity).toBe(0.78)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewMoreButtonAccessibilityRole).toBe("button")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMaxRows).toBe(2)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMaxLength).toBe(96)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewLineFlexDirection).toBe("row")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewLineAlignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRoleMinWidth).toBe(46)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRoleMaxWidth).toBe(82)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRoleNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRoleEllipsizeMode).toBe("tail")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRolePaddingHorizontal).toBe("xs")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRoleBorderWidth).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRoleOverflow).toBe("hidden")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRoleBackgroundAlpha).toBe(0.1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRoleBorderAlpha).toBe(0.26)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewRoleColorTokens).toEqual({
      user: "info",
      assistant: "foreground",
      tool: "warning",
    })
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewContentFlex).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewContentMinWidth).toBe(0)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewContentNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewContentEllipsizeMode).toBe("tail")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewContentColorToken).toBe("mutedForeground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewTimestampFlexShrink).toBe(0)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewTimestampNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewTimestampFontSize).toBe(10)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewTimestampColorToken).toBe("mutedForeground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMoreNumberOfLines).toBe(1)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMoreFontSize).toBe(10)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMoreFontWeight).toBe("700")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMoreColorToken).toBe("mutedForeground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMoreButtonAlignSelf).toBe("flex-start")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMoreButtonPressedOpacity).toBe(0.78)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMoreButtonAccessibilityRole).toBe("button")
    expect(getChatRuntimeDelegationCardMobileState()).toEqual({
      ...CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard,
      liveLabel: CHAT_RUNTIME_PRESENTATION.delegation.liveLabel,
    })
    expect(getChatRuntimeDelegationConversationPreviewMoreActionState(4)).toEqual({
      label: "Show 4 earlier messages",
      accessibilityRole: "button",
      accessibilityLabel: "Show 4 earlier messages",
      numberOfLines: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.conversationPreviewMoreNumberOfLines,
    })
    expect(getChatRuntimeDelegationToolPreviewMoreActionState(5)).toEqual({
      label: "+5 more",
      accessibilityRole: "button",
      accessibilityLabel: "+5 more",
      numberOfLines: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.delegationCard.toolPreviewMoreNumberOfLines,
    })
    expect(getChatRuntimeDelegationCardMobileColors({
      foreground: "#0f172a",
      info: "#2563eb",
      mutedForeground: "#64748b",
    })).toEqual({
      card: {
        borderColor: "rgba(37, 99, 235, 0.28)",
        backgroundColor: "rgba(37, 99, 235, 0.07)",
      },
      title: {
        color: "#0f172a",
      },
      liveText: {
        color: "#2563eb",
      },
      subtitle: {
        color: "#64748b",
      },
      meta: {
        color: "#64748b",
      },
      conversationPreview: {
        borderColor: "rgba(37, 99, 235, 0.18)",
        backgroundColor: "rgba(37, 99, 235, 0.06)",
      },
      conversationPreviewContent: {
        color: "#64748b",
      },
      conversationPreviewTimestamp: {
        color: "#64748b",
      },
      conversationPreviewMore: {
        color: "#64748b",
      },
      toolPreview: {
        borderColor: "rgba(37, 99, 235, 0.16)",
        backgroundColor: "rgba(37, 99, 235, 0.05)",
      },
      toolPreviewLabel: {
        color: "#64748b",
      },
      toolPreviewName: {
        color: "#64748b",
      },
      toolPreviewMore: {
        color: "#64748b",
      },
    })
    expect(getChatRuntimeDelegationCardMobileRenderState({
      colors: {
        foreground: "#0f172a",
        info: "#2563eb",
        mutedForeground: "#64748b",
      },
    })).toEqual({
      surface: getChatRuntimeDelegationCardMobileState(),
      colors: getChatRuntimeDelegationCardMobileColors({
        foreground: "#0f172a",
        info: "#2563eb",
        mutedForeground: "#64748b",
      }),
    })
    expect(createChatRuntimeDelegationCardMobileStyleSlots({
      renderState: getChatRuntimeDelegationCardMobileRenderState({
        colors: {
          foreground: "#0f172a",
          info: "#2563eb",
          mutedForeground: "#64748b",
        },
      }),
      spacing: {
        xs: 4,
        sm: 8,
      },
      radius: {
        sm: 6,
      },
      toolPreviewStatusIconWidth: 12,
    })).toEqual({
      card: {
        gap: 4,
        padding: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(37, 99, 235, 0.28)",
        backgroundColor: "rgba(37, 99, 235, 0.07)",
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        minWidth: 0,
      },
      title: {
        flex: 1,
        minWidth: 0,
        color: "#0f172a",
        fontSize: 13,
        fontWeight: "700",
      },
      statusBadge: {
        flexShrink: 0,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 2,
      },
      statusText: {
        fontSize: 10,
        fontWeight: "700",
      },
      liveText: {
        color: "#2563eb",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "700",
      },
      subtitle: {
        color: "#64748b",
        fontSize: 12,
        lineHeight: 17,
      },
      metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 4,
      },
      metaText: {
        color: "#64748b",
        fontSize: 10,
        lineHeight: 14,
      },
      conversationPreview: {
        gap: 4,
        marginTop: 2,
        paddingHorizontal: 4,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(37, 99, 235, 0.18)",
        backgroundColor: "rgba(37, 99, 235, 0.06)",
      },
      conversationPreviewLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        minWidth: 0,
      },
      conversationPreviewRole: {
        minWidth: 46,
        maxWidth: 82,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        overflow: "hidden",
        fontSize: 10,
        fontWeight: "700",
      },
      conversationPreviewContent: {
        flex: 1,
        minWidth: 0,
        color: "#64748b",
        fontSize: 11,
        lineHeight: 15,
      },
      conversationPreviewTimestamp: {
        flexShrink: 0,
        color: "#64748b",
        fontSize: 10,
      },
      conversationPreviewMoreButton: {
        alignSelf: "flex-start",
      },
      conversationPreviewMoreButtonPressed: {
        opacity: 0.78,
      },
      conversationPreviewMore: {
        color: "#64748b",
        fontSize: 10,
        fontWeight: "700",
      },
      toolPreview: {
        gap: 4,
        marginTop: 2,
        paddingHorizontal: 4,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(37, 99, 235, 0.16)",
        backgroundColor: "rgba(37, 99, 235, 0.05)",
      },
      toolPreviewLabel: {
        color: "#64748b",
        fontSize: 10,
        fontWeight: "700",
      },
      toolPreviewLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        minWidth: 0,
      },
      toolPreviewStatusIcon: {
        width: 12,
        minWidth: 36,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      },
      toolPreviewName: {
        flex: 1,
        minWidth: 0,
        color: "#64748b",
        fontSize: 11,
      },
      toolPreviewMoreButton: {
        alignSelf: "flex-start",
      },
      toolPreviewMoreButtonPressed: {
        opacity: 0.78,
      },
      toolPreviewMore: {
        color: "#64748b",
        fontSize: 10,
        fontWeight: "700",
      },
    })
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.position).toBe("absolute")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.accessibilityRole).toBe("button")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.size).toBe(44)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.backgroundColorToken).toBe("primary")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.foregroundColorToken).toBe("primaryForeground")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.alignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.justifyContent).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.pressedOpacity).toBe(0.8)
    expect("glyphFontSize" in CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom).toBe(false)
    expect("glyphFontWeight" in CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom).toBe(false)
    expect(getChatRuntimeScrollToBottomMobileButtonState()).toBe(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom)
    expect(getChatRuntimeScrollToBottomMobileColors({
      primary: "#111827",
      primaryForeground: "#f8fafc",
    })).toEqual({
      button: {
        backgroundColor: "#111827",
      },
      icon: {
        color: "#f8fafc",
      },
    })
    expect(getChatRuntimeScrollToBottomMobileRenderState({
      colors: {
        primary: "#111827",
        primaryForeground: "#f8fafc",
      },
    })).toEqual({
      shouldRender: true,
      surface: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom,
      colors: getChatRuntimeScrollToBottomMobileColors({
        primary: "#111827",
        primaryForeground: "#f8fafc",
      }),
      button: {
        accessibilityRole: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.accessibilityRole,
        accessibilityLabel: "Scroll to bottom",
        accessibilityHint: "Scrolls to the latest messages",
        icon: {
          name: CHAT_RUNTIME_PRESENTATION.scrollToBottom.mobileIcon.name,
          size: CHAT_RUNTIME_PRESENTATION.scrollToBottom.mobileIcon.size,
          color: "#f8fafc",
        },
        pressedOpacity: CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.scrollToBottom.pressedOpacity,
      },
    })
    expect(createChatRuntimeScrollToBottomMobileStyleSlots({
      renderState: getChatRuntimeScrollToBottomMobileRenderState({
        colors: {
          primary: "#111827",
          primaryForeground: "#f8fafc",
        },
      }),
      spacing: {
        lg: 16,
      },
    })).toEqual({
      button: {
        position: "absolute",
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
    })
    const scrollToBottomButtonParts = createChatRuntimeScrollToBottomButtonMobilePropsParts({
      renderState: {
        shouldRender: true,
        button: {
          pressedOpacity: 0.8,
          accessibilityRole: "button",
          accessibilityLabel: "Scroll to bottom",
          accessibilityHint: "Scrolls to the latest messages",
          icon: {
            name: "arrow-down",
            size: 18,
            color: "#fff",
          },
        },
      },
      onPress: "scroll-bottom",
      style: "scroll-button-style",
    })
    expect(scrollToBottomButtonParts).toEqual({
      shouldRenderButton: true,
      button: {
        props: {
          style: "scroll-button-style",
          onPress: "scroll-bottom",
          activeOpacity: 0.8,
          accessibilityRole: "button",
          accessibilityLabel: "Scroll to bottom",
          accessibilityHint: "Scrolls to the latest messages",
        },
        content: {
          icon: {
            props: {
              name: "arrow-down",
              size: 18,
              color: "#fff",
            },
          },
        },
      },
    })
    expect(createChatRuntimeScrollToBottomButtonMobilePropsParts({
      renderState: {
        shouldRender: false,
        button: {
          pressedOpacity: 0.8,
          accessibilityRole: "button",
          accessibilityLabel: "Scroll to bottom",
          accessibilityHint: "Scrolls to the latest messages",
          icon: {
            name: "arrow-down",
            size: 18,
            color: "#fff",
          },
        },
      },
      style: "scroll-button-style",
    }).shouldRenderButton).toBe(false)
    expect(getChatRuntimeScrollToBottomMobileRenderState({
      isVisible: false,
      colors: {
        primary: "#111827",
        primaryForeground: "#f8fafc",
      },
    }).shouldRender).toBe(false)
    expect(formatChatRuntimeAgentSelectorLabel("Research")).toBe("Research ▼")
    expect(getChatRuntimeCurrentAgentLabel("Research")).toBe("Research")
    expect(getChatRuntimeCurrentAgentLabel("  Research  ")).toBe("Research")
    expect(getChatRuntimeCurrentAgentLabel("")).toBe(CHAT_RUNTIME_PRESENTATION.header.defaultAgentLabel)
    expect(getChatRuntimeCurrentAgentLabel(null)).toBe(CHAT_RUNTIME_PRESENTATION.header.defaultAgentLabel)
    expect(getChatRuntimePrimaryAgentLabel({
      agentTitle: "  ACP Agent  ",
      agentName: "Internal",
      profileName: "Profile",
    })).toBe("ACP Agent")
    expect(getChatRuntimePrimaryAgentLabel({
      agentTitle: "",
      agentName: "  Internal  ",
      profileName: "Profile",
    })).toBe("Internal")
    expect(getChatRuntimePrimaryAgentLabel({
      agentTitle: null,
      agentName: "",
      profileName: "  Profile  ",
    })).toBe("Profile")
    expect(getChatRuntimePrimaryAgentLabel({
      agentTitle: "",
      agentName: "",
      profileName: "",
    })).toBe(CHAT_RUNTIME_PRESENTATION.header.defaultAgentLabel)
    expect(formatChatRuntimeAgentSelectorAccessibilityLabel("Research")).toBe(
      "Current agent: Research. Tap to change.",
    )
    expect(getChatComposerVoiceOverlayLabel({ handsFree: true, willCancel: false })).toBe("Listening...")
    expect(getChatComposerVoiceOverlayLabel({ handsFree: false, willCancel: true })).toBe("Release to edit")
    expect(getChatComposerVoiceOverlayLabel({ handsFree: false, willCancel: false })).toBe("Release to send")
    expect(formatChatRuntimeWebConfirmMessage("Title", "Body")).toBe("Title\n\nBody")
    expect(getChatRuntimeAlertMessage(new Error("Network"), "Fallback")).toBe("Network")
    expect(getChatRuntimeAlertMessage("", "Fallback")).toBe("Fallback")
    expect(getChatMessageCopyFeedbackState()).toEqual({
      feedbackResetDelayMs: 2000,
      failedTitle: "Copy Failed",
      failedMessage: "Could not copy this message.",
    })
    expect(getChatMessageCopyFeedbackResetDelayMs()).toBe(2000)
    expect(getChatMessageCopyFailureAlertState(new Error("Clipboard denied"))).toEqual({
      title: "Copy Failed",
      message: "Clipboard denied",
    })
    expect(getChatMessageToolExecutionCopyFailureResolvedAlertState("No payload")).toEqual({
      title: "Copy Failed",
      message: "No payload",
    })
    expect(getChatMessageToolExecutionCopyFailureResolvedAlertState(null)).toEqual({
      title: "Copy Failed",
      message: "Could not copy this tool payload.",
    })
    expect(getChatConversationHomePromptSaveSuccessAlertState(false)).toEqual({
      title: "Success",
      message: "Prompt saved to your desktop prompt library.",
    })
    expect(getChatConversationHomePromptSaveSuccessAlertState(true)).toEqual({
      title: "Success",
      message: "Prompt updated in your desktop prompt library.",
    })
    expect(getChatConversationHomePromptSaveFailedAlertState(new Error("No desktop"))).toEqual({
      title: "Error",
      message: "No desktop",
    })
    expect(getChatConversationHomePromptDeleteConfirmAlertState("Review")).toEqual({
      title: "Delete Prompt",
      message: 'Delete "Review" from your desktop prompt library?',
      cancelLabel: "Cancel",
      deleteLabel: "Delete",
      webMessage: 'Delete prompt "Review"?',
    })
    expect(getChatConversationHomePromptDeleteFailedAlertState("No desktop")).toEqual({
      title: "Error",
      message: "No desktop",
    })
    expect(getChatConversationHomePromptTaskStartedAlertState("Daily")).toEqual({
      title: "Task started",
      message: 'Running "Daily" on desktop.',
    })
    expect(getChatConversationHomePromptTaskRunFailedAlertState(null)).toEqual({
      title: "Error",
      message: "Failed to run task.",
    })
    expect(getChatConversationHomePromptEditorDismissActionState(false)).toEqual({
      isDisabled: false,
      accessibilityState: undefined,
    })
    expect(getChatConversationHomePromptEditorDismissActionState(true)).toEqual({
      isDisabled: true,
      accessibilityState: { disabled: true },
    })
    expect(getChatConversationHomePromptEditorTitle(false)).toBe("Add New Prompt")
    expect(getChatConversationHomePromptEditorTitle(true)).toBe("Edit Prompt")
    expect(createChatConversationHomePromptEditorSaveActionState({
      draft: { name: "", content: "" },
      isEditing: false,
      isSaving: false,
    })).toEqual({
      isDisabled: true,
      label: "Add Prompt",
      accessibilityLabel: "Add Prompt button",
      accessibilityState: { disabled: true },
    })
    expect(createChatConversationHomePromptEditorSaveActionState({
      draft: { name: "Review", content: "Summarize this." },
      isEditing: true,
      isSaving: true,
    })).toEqual({
      isDisabled: true,
      label: "Saving...",
      accessibilityLabel: "Saving... button",
      accessibilityState: { disabled: true },
    })
    expect(formatChatRuntimeToolApprovalFailureMessage("approve", new Error("Nope"))).toBe(
      "Failed to approve tool call. Nope",
    )
    expect(formatChatRuntimeToolApprovalFailureMessage("deny", null)).toBe(
      "Failed to deny tool call. Please try again.",
    )
    expect(getChatRuntimeToolApprovalMobileAlertState()).toEqual({
      connectionRequired: {
        title: CHAT_RUNTIME_PRESENTATION.approval.connectionRequiredTitle,
        message: CHAT_RUNTIME_PRESENTATION.approval.connectionRequiredMessage,
      },
      unavailable: {
        title: CHAT_RUNTIME_PRESENTATION.approval.unavailableTitle,
        message: CHAT_RUNTIME_PRESENTATION.approval.unavailableMessage,
      },
      failed: {
        title: CHAT_RUNTIME_PRESENTATION.approval.failedTitle,
        fallbackMessage: CHAT_RUNTIME_PRESENTATION.approval.responseFailedMessage,
      },
    })
    expect(getChatRuntimeToolApprovalConnectionRequiredMobileResolvedAlertState()).toEqual({
      title: CHAT_RUNTIME_PRESENTATION.approval.connectionRequiredTitle,
      message: CHAT_RUNTIME_PRESENTATION.approval.connectionRequiredMessage,
    })
    expect(getChatRuntimeToolApprovalUnavailableMobileResolvedAlertState()).toEqual({
      title: CHAT_RUNTIME_PRESENTATION.approval.unavailableTitle,
      message: CHAT_RUNTIME_PRESENTATION.approval.unavailableMessage,
    })
    expect(getChatRuntimeToolApprovalFailedMobileResolvedAlertState(new Error("Timed out"))).toEqual({
      title: CHAT_RUNTIME_PRESENTATION.approval.failedTitle,
      message: "Timed out",
    })
    expect(CHAT_RUNTIME_PRESENTATION.approval.title).toBe("Tool Approval Required")
    expect(CHAT_RUNTIME_PRESENTATION.approval.viewArgumentsGlyph).toBe("▶")
    expect(CHAT_RUNTIME_PRESENTATION.approval.hideArgumentsGlyph).toBe("▼")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.header.flexDirection).toBe("row")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.icon.name).toBe("shield-checkmark-outline")
    expect(getChatRuntimeToolApprovalHeaderMobileIconState()).toEqual({
      name: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.icon.name,
      size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.icon.size,
      colorToken: "warning",
    })
    const toolApprovalColors = {
      warning: "#d97706",
      destructive: "#dc2626",
      successForeground: "#ffffff",
    }
    expect(getChatRuntimeToolApprovalHeaderMobileIconColors(toolApprovalColors)).toEqual({
      color: "#d97706",
    })
    const toolApprovalSurfaceColors = {
      warning: "#d97706",
      foreground: "#0f172a",
      mutedForeground: "#64748b",
      success: "#16a34a",
      successForeground: "#ffffff",
      destructive: "#dc2626",
      background: "#020617",
    }
    expect(getChatRuntimeToolApprovalMobileSurfaceState()).toBe(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile)
    expect(getChatRuntimeToolApprovalMobileSurfaceColors(toolApprovalSurfaceColors)).toEqual({
      card: {
        borderColor: "rgba(217, 119, 6, 0.35)",
        backgroundColor: "rgba(217, 119, 6, 0.1)",
      },
      title: {
        color: "#d97706",
      },
      toolLabel: {
        color: "#d97706",
      },
      toolName: {
        color: "#0f172a",
      },
      argumentsPreview: {
        borderColor: "rgba(217, 119, 6, 0.25)",
        backgroundColor: "rgba(217, 119, 6, 0.08)",
        color: "#64748b",
      },
      argumentsToggleText: {
        color: "#d97706",
      },
      fullArguments: {
        backgroundColor: "rgba(217, 119, 6, 0.08)",
        color: "#0f172a",
      },
      approveButton: {
        backgroundColor: "#16a34a",
      },
      approveButtonText: {
        color: "#ffffff",
      },
      denyButton: {
        borderColor: "#dc2626",
        backgroundColor: "#020617",
      },
      denyButtonText: {
        color: "#dc2626",
      },
    })
    expect(createChatRuntimeToolApprovalMobileStyleSlots({
      renderState: getChatRuntimeToolApprovalMobileRenderState({
        toolName: "write_file",
        isArgumentsExpanded: false,
        isResponding: false,
        colors: toolApprovalSurfaceColors,
      }),
      spacing: { xs: 4, sm: 8, md: 12 },
      radius: { sm: 6 },
      platform: "android",
    })).toEqual({
      card: {
        gap: 4,
        padding: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(217, 119, 6, 0.35)",
        backgroundColor: "rgba(217, 119, 6, 0.1)",
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      },
      content: {
        gap: 4,
      },
      contentDisabled: {
        opacity: 0.6,
      },
      title: {
        flex: 1,
        minWidth: 0,
        fontSize: 13,
        fontWeight: "700",
        color: "#d97706",
      },
      toolRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 4,
        marginBottom: 2,
      },
      toolLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: "#d97706",
      },
      tool: {
        fontFamily: "monospace",
        fontSize: 12,
        color: "#0f172a",
        flexShrink: 1,
      },
      argumentsPreview: {
        fontFamily: "monospace",
        fontSize: 11,
        lineHeight: 15,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 4,
        borderColor: "rgba(217, 119, 6, 0.25)",
        backgroundColor: "rgba(217, 119, 6, 0.08)",
        color: "#64748b",
      },
      argumentsToggle: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 4,
        marginTop: 4,
        paddingVertical: 4,
      },
      argumentsTogglePressed: {
        opacity: 0.7,
      },
      argumentsToggleText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#d97706",
      },
      argumentsScroll: {
        marginTop: 4,
        maxHeight: 180,
        borderRadius: 6,
        backgroundColor: "rgba(217, 119, 6, 0.08)",
      },
      argumentsFull: {
        fontFamily: "monospace",
        fontSize: 10,
        lineHeight: 14,
        padding: 6,
        color: "#0f172a",
      },
      actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 4,
      },
      button: {
        minHeight: 36,
        minWidth: 84,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        flex: 1,
      },
      buttonDisabled: {
        opacity: 0.6,
      },
      approveButton: {
        backgroundColor: "#16a34a",
      },
      approveButtonText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "700",
      },
      denyButton: {
        borderWidth: 1,
        borderColor: "#dc2626",
        backgroundColor: "#020617",
      },
      denyButtonText: {
        color: "#dc2626",
        fontSize: 13,
        fontWeight: "700",
      },
    })
    expect(getChatRuntimeToolApprovalDesktopSurfaceState()).toBe(TOOL_APPROVAL_SURFACE_PRESENTATION.desktop)
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.desktop.contentDisabledClassName).toBe("opacity-60")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.desktop.argumentsToggleIconClassName).toContain("transition-transform")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.desktop.buttonIconClassName).toBe("mr-1 h-3 w-3")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.desktop.approveButtonSpinnerIconClassName).toContain("animate-spin")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.desktop.hotkeysSeparatorClassName).toBe("opacity-40")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggle.flexDirection).toBe("row")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon).toMatchObject({
      collapsedName: "chevron-forward",
      expandedName: "chevron-down",
      size: 14,
    })
    expect(getChatRuntimeToolApprovalArgumentsToggleMobileIconState(false)).toEqual({
      isExpanded: false,
      name: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.collapsedName,
      size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.size,
      colorToken: "warning",
    })
    expect(getChatRuntimeToolApprovalArgumentsToggleMobileIconState(true)).toEqual({
      isExpanded: true,
      name: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.expandedName,
      size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.size,
      colorToken: "warning",
    })
    expect(getChatRuntimeToolApprovalArgumentsToggleMobileIconColors(false, toolApprovalColors)).toEqual({
      color: "#d97706",
    })
    expect(getChatRuntimeToolApprovalArgumentsToggleMobileIconColors(true, toolApprovalColors)).toEqual({
      color: "#d97706",
    })
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.spinner.colorToken).toBe("warning")
    expect(getChatRuntimeToolApprovalSpinnerMobileColors(toolApprovalColors)).toEqual({
      color: "#d97706",
    })
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.content.gap).toBe("xs")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.title.numberOfLines).toBe(2)
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.toolName.colorToken).toBe("foreground")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.toolName.fontFamilyByPlatform.ios).toBe("Menlo")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.toolName.flexShrink).toBe(1)
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.toolName.numberOfLines).toBe(2)
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.toolRow.flexDirection).toBe("row")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.toolRow.alignItems).toBe("center")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.toolRow.flexWrap).toBe("wrap")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.approveName).toBe("checkmark-circle")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.button.accessibilityRole).toBe("button")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants.approve.backgroundColorToken).toBe("success")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants.approve.foregroundColorToken).toBe("successForeground")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants.deny.borderColorToken).toBe("destructive")
    expect(getChatRuntimeToolApprovalActionMobileIconState("approve")).toEqual({
      action: "approve",
      name: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.approveName,
      size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.size,
      colorToken: "successForeground",
    })
    expect(getChatRuntimeToolApprovalActionMobileIconState("deny")).toEqual({
      action: "deny",
      name: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.denyName,
      size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.size,
      colorToken: "destructive",
    })
    expect(getChatRuntimeToolApprovalActionMobileIconColors("approve", toolApprovalColors)).toEqual({
      color: "#ffffff",
    })
    expect(getChatRuntimeToolApprovalActionMobileIconColors("deny", toolApprovalColors)).toEqual({
      color: "#dc2626",
    })
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonSpinner.colorToken).toBe("successForeground")
    expect(getChatRuntimeToolApprovalButtonSpinnerMobileColors(toolApprovalColors)).toEqual({
      color: "#ffffff",
    })
    expect(getChatRuntimeToolApprovalMobileRenderState({
      toolName: "write_file",
      isArgumentsExpanded: false,
      isResponding: false,
      colors: toolApprovalSurfaceColors,
    })).toEqual({
      copy: CHAT_RUNTIME_PRESENTATION.approval,
      surface: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile,
      colors: getChatRuntimeToolApprovalMobileSurfaceColors(toolApprovalSurfaceColors),
      title: CHAT_RUNTIME_PRESENTATION.approval.title,
      headerIcon: {
        name: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.icon.name,
        size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.icon.size,
        color: "#d97706",
      },
      spinner: {
        size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.spinner.size,
        color: "#d97706",
      },
      argumentsToggle: {
        label: CHAT_RUNTIME_PRESENTATION.approval.viewArgumentsLabel,
        isDisabled: false,
        accessibilityRole: "button",
        accessibilityLabel: "View full arguments for write_file",
        accessibilityState: { expanded: false, disabled: false },
        ariaExpanded: false,
        pressedOpacity: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggle.pressedOpacity,
        icon: {
          name: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.collapsedName,
          size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.size,
          color: "#d97706",
        },
      },
      approveButton: {
        label: CHAT_RUNTIME_PRESENTATION.approval.approveLabel,
        isDisabled: false,
        accessibilityRole: "button",
        accessibilityLabel: "Approve tool call write_file",
        accessibilityState: { disabled: false },
        icon: {
          name: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.approveName,
          size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.size,
          color: "#ffffff",
        },
        spinner: {
          size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonSpinner.size,
          color: "#ffffff",
        },
      },
      denyButton: {
        label: CHAT_RUNTIME_PRESENTATION.approval.denyLabel,
        isDisabled: false,
        accessibilityRole: "button",
        accessibilityLabel: "Deny tool call write_file",
        accessibilityState: { disabled: false },
        icon: {
          name: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.denyName,
          size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.size,
          color: "#dc2626",
        },
      },
    })
    expect(getChatRuntimeToolApprovalMobileRenderState({
      toolName: "write_file",
      isArgumentsExpanded: true,
      isResponding: true,
      colors: toolApprovalSurfaceColors,
    })).toMatchObject({
      title: CHAT_RUNTIME_PRESENTATION.approval.processingTitle,
      argumentsToggle: {
        label: CHAT_RUNTIME_PRESENTATION.approval.hideArgumentsLabel,
        isDisabled: true,
        accessibilityLabel: "Hide full arguments for write_file",
        accessibilityState: { expanded: true, disabled: true },
        ariaExpanded: true,
        icon: {
          name: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggleIcon.expandedName,
        },
      },
      approveButton: {
        label: CHAT_RUNTIME_PRESENTATION.approval.processingLabel,
        isDisabled: true,
        accessibilityState: { disabled: true },
      },
      denyButton: {
        isDisabled: true,
        accessibilityState: { disabled: true },
      },
    })
    const toolApprovalCardRenderState = getChatRuntimeToolApprovalCardMobileRenderState({
      isApproval: true,
      toolApproval: {
        approvalId: "approval-1",
        toolName: "write_file",
        arguments: { path: "/test" },
      },
      expandedToolApprovals: { "approval-1": true },
      pendingApprovalResponseId: "approval-1",
      colors: toolApprovalSurfaceColors,
    })
    expect(toolApprovalCardRenderState).toMatchObject({
      approvalId: "approval-1",
      toolName: "write_file",
      argumentsPreview: "path: /test",
      argumentsContent: '{\n  "path": "/test"\n}',
      renderState: {
        title: CHAT_RUNTIME_PRESENTATION.approval.processingTitle,
        argumentsToggle: {
          isDisabled: true,
          ariaExpanded: true,
        },
      },
    })
    if (!toolApprovalCardRenderState) {
      throw new Error("Expected tool approval card render state")
    }
    const toolApprovalPropEvents: string[] = []
    const toolApprovalProps = createChatRuntimeConversationToolApprovalMobileProps({
      cardState: {
        ...toolApprovalCardRenderState,
        onToggleArguments: () => {
          toolApprovalPropEvents.push("toggle")
        },
        onDeny: () => {
          toolApprovalPropEvents.push("deny")
        },
        onApprove: () => {
          toolApprovalPropEvents.push("approve")
        },
      },
    })
    expect(toolApprovalProps?.toolName).toBe("write_file")
    expect(toolApprovalProps?.argumentsPreview).toBe("path: /test")
    toolApprovalProps?.onToggleArguments()
    toolApprovalProps?.onDeny()
    toolApprovalProps?.onApprove()
    expect(toolApprovalPropEvents).toEqual(["toggle", "deny", "approve"])
    if (!toolApprovalProps) {
      throw new Error("Expected tool approval props")
    }
    const toolApprovalParts = createChatRuntimeToolApprovalMobilePropsParts({
      ...toolApprovalProps,
      styles: {
        card: "tool-approval-card-style",
        header: "tool-approval-header-style",
        content: "tool-approval-content-style",
        contentDisabled: "tool-approval-content-disabled-style",
        title: "tool-approval-title-style",
        toolRow: "tool-approval-tool-row-style",
        toolLabel: "tool-approval-tool-label-style",
        toolName: "tool-approval-tool-name-style",
        argumentsPreview: "tool-approval-arguments-preview-style",
        argumentsToggle: "tool-approval-arguments-toggle-style",
        argumentsTogglePressed: "tool-approval-arguments-toggle-pressed-style",
        argumentsToggleText: "tool-approval-arguments-toggle-text-style",
        argumentsScroll: "tool-approval-arguments-scroll-style",
        argumentsFull: "tool-approval-arguments-full-style",
        actions: "tool-approval-actions-style",
        button: "tool-approval-button-style",
        buttonDisabled: "tool-approval-button-disabled-style",
        approveButton: "tool-approval-approve-button-style",
        approveButtonText: "tool-approval-approve-button-text-style",
        denyButton: "tool-approval-deny-button-style",
        denyButtonText: "tool-approval-deny-button-text-style",
      },
    })
    expect(toolApprovalParts.card).toEqual({
      props: {
        style: "tool-approval-card-style",
      },
    })
    expect(toolApprovalParts.header).toEqual({
      props: {
        style: "tool-approval-header-style",
      },
    })
    expect(toolApprovalParts.headerIcon).toEqual({
      props: toolApprovalProps.renderState.headerIcon,
    })
    expect(toolApprovalParts.title).toEqual({
      props: {
        props: {
          style: "tool-approval-title-style",
          numberOfLines: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.title.numberOfLines,
        },
        text: CHAT_RUNTIME_PRESENTATION.approval.processingTitle,
      },
    })
    expect(toolApprovalParts.headerSpinner).toEqual({
      shouldRender: true,
      props: toolApprovalProps.renderState.spinner,
    })
    expect(toolApprovalParts.content).toEqual({
      props: {
        style: [
          "tool-approval-content-style",
          "tool-approval-content-disabled-style",
        ],
      },
    })
    expect(toolApprovalParts.toolRow).toEqual({
      props: {
        style: "tool-approval-tool-row-style",
      },
    })
    expect(toolApprovalParts.toolLabel).toEqual({
      props: {
        props: {
          style: "tool-approval-tool-label-style",
        },
        text: `${CHAT_RUNTIME_PRESENTATION.approval.toolLabel}:`,
      },
    })
    expect(toolApprovalParts.toolName).toEqual({
      props: {
        props: {
          style: "tool-approval-tool-name-style",
          numberOfLines: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.toolName.numberOfLines,
        },
        text: "write_file",
      },
    })
    expect(toolApprovalParts.argumentsPreview).toEqual({
      shouldRender: true,
      props: {
        props: {
          style: "tool-approval-arguments-preview-style",
          numberOfLines: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsPreview.numberOfLines,
        },
        text: "path: /test",
      },
    })
    expect(toolApprovalParts.argumentsToggle.props.style({ pressed: true })).toEqual([
      "tool-approval-arguments-toggle-style",
      "tool-approval-arguments-toggle-pressed-style",
      "tool-approval-button-disabled-style",
    ])
    expect(toolApprovalParts.argumentsToggle).toMatchObject({
      props: {
        disabled: true,
        accessibilityRole: "button",
        accessibilityLabel: "Hide full arguments for write_file",
        accessibilityState: {
          expanded: true,
          disabled: true,
        },
        "aria-expanded": true,
      },
      content: {
        icon: {
          props: toolApprovalProps.renderState.argumentsToggle.icon,
        },
        label: {
          props: {
            props: {
              style: "tool-approval-arguments-toggle-text-style",
            },
            text: CHAT_RUNTIME_PRESENTATION.approval.hideArgumentsLabel,
          },
        },
      },
    })
    expect(toolApprovalParts.argumentsToggle.props.onPress).toBe(toolApprovalProps.onToggleArguments)
    expect(toolApprovalParts.fullArguments).toEqual({
      shouldRender: true,
      scroll: {
        props: {
          style: "tool-approval-arguments-scroll-style",
          nestedScrollEnabled: true,
        },
      },
      text: {
        props: {
          props: {
            style: "tool-approval-arguments-full-style",
          },
          text: '{\n  "path": "/test"\n}',
        },
      },
    })
    expect(toolApprovalParts.actions).toEqual({
      props: {
        style: "tool-approval-actions-style",
      },
    })
    expect(toolApprovalParts.denyButton).toMatchObject({
      props: {
        style: [
          "tool-approval-button-style",
          "tool-approval-deny-button-style",
          "tool-approval-button-disabled-style",
        ],
        disabled: true,
        accessibilityRole: "button",
        accessibilityLabel: "Deny tool call write_file",
        accessibilityState: {
          disabled: true,
        },
      },
      content: {
        icon: {
          props: toolApprovalProps.renderState.denyButton.icon,
        },
        label: {
          props: {
            props: {
              style: "tool-approval-deny-button-text-style",
            },
            text: CHAT_RUNTIME_PRESENTATION.approval.denyLabel,
          },
        },
      },
    })
    expect(toolApprovalParts.denyButton.props.onPress).toBe(toolApprovalProps.onDeny)
    expect(toolApprovalParts.approveButton).toMatchObject({
      props: {
        style: [
          "tool-approval-button-style",
          "tool-approval-approve-button-style",
          "tool-approval-button-disabled-style",
        ],
        disabled: true,
        accessibilityRole: "button",
        accessibilityLabel: "Approve tool call write_file",
        accessibilityState: {
          disabled: true,
        },
      },
      content: {
        icon: {
          shouldRender: false,
          props: toolApprovalProps.renderState.approveButton.icon,
        },
        spinner: {
          shouldRender: true,
          props: toolApprovalProps.renderState.approveButton.spinner,
        },
        label: {
          props: {
            props: {
              style: "tool-approval-approve-button-text-style",
            },
            text: CHAT_RUNTIME_PRESENTATION.approval.processingLabel,
          },
        },
      },
    })
    expect(toolApprovalParts.approveButton.props.onPress).toBe(toolApprovalProps.onApprove)
    expect(createChatRuntimeConversationToolApprovalMobileProps({
      cardState: null,
    })).toBeNull()
    expect(getChatRuntimeToolApprovalCardMobileRenderState({
      isApproval: false,
      toolApproval: null,
      expandedToolApprovals: {},
      colors: toolApprovalSurfaceColors,
    })).toBeNull()
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsPreview.borderColorToken).toBe("warning")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsPreview.textColorToken).toBe("mutedForeground")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsPreview.fontFamilyByPlatform.default).toBe("monospace")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggle.alignSelf).toBe("flex-start")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsToggle.accessibilityRole).toBe("button")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.fullArguments.backgroundColorToken).toBe("warning")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.fullArguments.textColorToken).toBe("foreground")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.fullArguments.fontFamilyByPlatform.ios).toBe("Menlo")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.actions.flexDirection).toBe("row")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.actions.justifyContent).toBe("flex-end")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.actions.flexWrap).toBe("wrap")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.button.flex).toBe(1)
    expect(CHAT_RUNTIME_PRESENTATION.branch.buttonGlyph).toBe("↳")
    expect(CHAT_RUNTIME_PRESENTATION.branch.pendingGlyph).toBe("…")
    expect(CHAT_RUNTIME_PRESENTATION.branch.mobileIcon).toMatchObject({
      name: "git-branch-outline",
      size: 13,
      pendingSize: 12,
    })
    expect(getChatRuntimeBranchMobileIconState()).toEqual({
      isPending: false,
      name: CHAT_RUNTIME_PRESENTATION.branch.mobileIcon.name,
      size: CHAT_RUNTIME_PRESENTATION.branch.mobileIcon.size,
      colorToken: "primary",
    })
    expect(getChatRuntimeBranchMobileIconState({ isPending: true })).toEqual({
      isPending: true,
      name: CHAT_RUNTIME_PRESENTATION.branch.mobileIcon.name,
      size: CHAT_RUNTIME_PRESENTATION.branch.mobileIcon.pendingSize,
      colorToken: "primary",
    })
    expect(CHAT_RUNTIME_PRESENTATION.turnDuration.glyph).toBe("◷")
    expect(CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon).toMatchObject({
      name: "time-outline",
      size: 11,
    })
    expect(getChatRuntimeTurnDurationHeaderMobileBadgeState()).toEqual({
      numberOfLines: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.durationChip.numberOfLines,
      flexDirection: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.flexDirection,
      alignItems: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.alignItems,
      justifyContent: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.justifyContent,
      gap: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.gap,
      minHeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.minHeight,
      maxWidth: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.durationChip.maxWidth,
      paddingHorizontal: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.paddingHorizontal,
      borderRadius: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.borderRadius,
      backgroundColorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.backgroundColorToken,
      backgroundAlpha: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.backgroundAlpha,
      marginHorizontal: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.durationChip.marginHorizontal,
      flexShrink: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.flexShrink,
      opacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.opacity,
      fontFamilyByPlatform: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontFamilyByPlatform,
      fontSize: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontSize,
      lineHeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.lineHeight,
      fontWeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontWeight,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.colorToken,
    })
    expect(getChatRuntimeTurnDurationHeaderMobileBadgeState({ isLive: true })).toEqual({
      numberOfLines: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.durationChip.numberOfLines,
      flexDirection: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.flexDirection,
      alignItems: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.alignItems,
      justifyContent: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.justifyContent,
      gap: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.gap,
      minHeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.minHeight,
      maxWidth: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.durationChip.maxWidth,
      paddingHorizontal: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.paddingHorizontal,
      borderRadius: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.borderRadius,
      backgroundColorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveBackgroundColorToken,
      backgroundAlpha: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveBackgroundAlpha,
      marginHorizontal: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.durationChip.marginHorizontal,
      flexShrink: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.flexShrink,
      opacity: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveOpacity,
      fontFamilyByPlatform: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontFamilyByPlatform,
      fontSize: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontSize,
      lineHeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.lineHeight,
      fontWeight: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontWeight,
      colorToken: CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.liveColorToken,
    })
    const headerTurnDurationColors = {
      mutedForeground: "#64748b",
      warning: "#d97706",
    }
    expect(getChatRuntimeTurnDurationHeaderMobileBadgeColors({}, headerTurnDurationColors)).toEqual({
      chip: {
        backgroundColor: "rgba(100, 116, 139, 0.08)",
      },
      text: {
        color: "#64748b",
      },
      icon: {
        color: "#64748b",
      },
    })
    expect(getChatRuntimeTurnDurationHeaderMobileBadgeColors({ isLive: true }, headerTurnDurationColors)).toEqual({
      chip: {
        backgroundColor: "rgba(217, 119, 6, 0.13)",
      },
      text: {
        color: "#d97706",
      },
      icon: {
        color: "#d97706",
      },
    })
    expect(getChatRuntimeTurnDurationMobileIconState()).toEqual({
      isLive: false,
      name: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.name,
      size: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.size,
      colorToken: "mutedForeground",
    })
    expect(getChatRuntimeTurnDurationMobileIconState({ isLive: true })).toEqual({
      isLive: true,
      name: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.name,
      size: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.size,
      colorToken: "warning",
    })
    expect(getChatRuntimeTurnDurationHeaderMobileRenderState({
      durationMs: 0,
      colors: headerTurnDurationColors,
    })).toEqual({
      shouldRender: false,
      badge: getChatRuntimeTurnDurationHeaderMobileBadgeState({ isLive: false }),
      colors: getChatRuntimeTurnDurationHeaderMobileBadgeColors({}, headerTurnDurationColors),
      label: "",
      accessibilityRole: "text",
      accessibilityLabel: "",
      isLive: false,
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.name,
        size: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.size,
        color: "#64748b",
      },
    })
    expect(getChatRuntimeTurnDurationHeaderMobileRenderState({
      durationMs: 60_000,
      isLive: true,
      colors: headerTurnDurationColors,
    })).toEqual({
      shouldRender: true,
      badge: getChatRuntimeTurnDurationHeaderMobileBadgeState({ isLive: true }),
      colors: getChatRuntimeTurnDurationHeaderMobileBadgeColors({ isLive: true }, headerTurnDurationColors),
      label: "1m",
      accessibilityRole: "text",
      accessibilityLabel: "Total agent time (running): 1m",
      isLive: true,
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.name,
        size: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.size,
        color: "#d97706",
      },
    })
    const messageTurnDurationColors = {
      mutedForeground: "#64748b",
      primary: "#2563eb",
      success: "#16a34a",
      warning: "#d97706",
    }
    expect(getChatRuntimeTurnDurationMessageMobileRenderState({
      role: "assistant",
      durationMs: 12_000,
      colors: messageTurnDurationColors,
    })).toEqual({
      shouldRender: false,
      badge: getChatMessageActionMobileTurnDurationBadgeState({ isLive: false }),
      colors: getChatMessageActionMobileTurnDurationBadgeColors({}, messageTurnDurationColors),
      label: "",
      accessibilityRole: "text",
      accessibilityLabel: "",
      isLive: false,
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.name,
        size: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.size,
        color: "#64748b",
      },
    })
    expect(getChatRuntimeTurnDurationMessageMobileRenderState({
      role: "user",
      durationMs: 12_000,
      isLive: true,
      colors: messageTurnDurationColors,
    })).toEqual({
      shouldRender: true,
      badge: getChatMessageActionMobileTurnDurationBadgeState({ isLive: true }),
      colors: getChatMessageActionMobileTurnDurationBadgeColors({ isLive: true }, messageTurnDurationColors),
      label: "12s",
      accessibilityRole: "text",
      accessibilityLabel: "Agent turn in progress: 12s",
      isLive: true,
      icon: {
        name: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.name,
        size: CHAT_RUNTIME_PRESENTATION.turnDuration.mobileIcon.size,
        color: "#d97706",
      },
    })
    const turnDurationBadgeParts = createChatRuntimeTurnDurationBadgeMobilePropsParts({
      renderState: {
        shouldRender: true,
        isLive: true,
        accessibilityRole: "text",
        accessibilityLabel: "Agent turn in progress: 12s",
        icon: {
          name: "time",
          size: 12,
          color: "#d97706",
        },
        label: "12s",
        badge: {
          numberOfLines: 1,
        },
      },
      style: "badge-style",
      liveStyle: "badge-live-style",
      textStyle: "text-style",
      liveTextStyle: "text-live-style",
    })
    expect(turnDurationBadgeParts).toEqual({
      shouldRenderBadge: true,
      container: {
        props: {
          accessible: true,
          accessibilityRole: "text",
          accessibilityLabel: "Agent turn in progress: 12s",
          style: ["badge-style", "badge-live-style"],
        },
        content: {
          icon: {
            props: {
              name: "time",
              size: 12,
              color: "#d97706",
            },
          },
          label: {
            props: {
              text: "12s",
              props: {
                style: ["text-style", "text-live-style"],
                numberOfLines: 1,
              },
            },
          },
        },
      },
    })
    expect(createChatRuntimeTurnDurationBadgeMobilePropsParts({
      renderState: {
        shouldRender: false,
        isLive: false,
        accessibilityRole: "text",
        accessibilityLabel: "",
        icon: {
          name: "time",
          size: 12,
          color: "#64748b",
        },
        label: "",
        badge: {
          numberOfLines: 1,
        },
      },
      style: "badge-style",
      liveStyle: "badge-live-style",
      textStyle: "text-style",
      liveTextStyle: "text-live-style",
    }).shouldRenderBadge).toBe(false)
    const messageThreadStyleColors = {
      ...messageTurnDurationColors,
      info: "#0ea5e9",
      border: "#cbd5e1",
      muted: "#f1f5f9",
      foreground: "#0f172a",
    }
    const messageThreadStyle = getChatRuntimeMessageThreadMobileStyleRenderState({
      colors: messageThreadStyleColors,
    })
    expect(messageThreadStyle.message.surface.paddingHorizontal).toBe("sm")
    expect(messageThreadStyle.message.colors.tones.assistant_final.backgroundColor).toBe("rgba(22, 163, 74, 0.08)")
    expect(createChatRuntimeMessageMobileStyleSlots({
      renderState: messageThreadStyle.message,
      spacing: {
        xs: 4,
        sm: 8,
      },
      radius: {
        md: 8,
      },
      borderWidths: {
        hairline: 0.5,
      },
    })).toMatchObject({
      message: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginBottom: 4,
        width: "100%",
        borderWidth: 0.5,
        borderRadius: 8,
      },
      user: {
        borderColor: "rgba(14, 165, 233, 0.36)",
        backgroundColor: "rgba(14, 165, 233, 0.08)",
      },
      assistantFinal: {
        borderColor: "rgba(22, 163, 74, 0.36)",
        backgroundColor: "rgba(22, 163, 74, 0.08)",
      },
      contentRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 4,
        width: "100%",
      },
      collapsedPreview: {
        color: "#0f172a",
        fontSize: 13,
        lineHeight: 18,
      },
    })
    expect(messageThreadStyle.action.row).toMatchObject({
      flexDirection: "row",
      justifyContent: "flex-end",
    })
    expect(createChatRuntimeMessageActionRowMobileStyleSlot({
      row: messageThreadStyle.action.row,
      spacing: {
        xs: 4,
      },
    })).toEqual({
      flexDirection: "row",
      alignItems: messageThreadStyle.action.row.alignItems,
      justifyContent: "flex-end",
      marginTop: messageThreadStyle.action.row.marginTop,
      gap: 4,
    })
    const expansionButtonStyleSlots = createChatRuntimeMessageActionButtonMobileStyleSlots({
      renderState: messageThreadStyle.action.slotButtons.expansion,
    })
    expect(expansionButtonStyleSlots.button.backgroundColor).toBe(
      messageThreadStyle.action.slotButtons.expansion.colors.backgroundColor,
    )
    expect(expansionButtonStyleSlots.button.width).toBe(
      messageThreadStyle.action.slotButtons.expansion.button.width,
    )
    expect(expansionButtonStyleSlots.pressed.opacity).toBe(
      messageThreadStyle.action.slotButtons.expansion.button.pressedOpacity,
    )
    expect(expansionButtonStyleSlots.disabled.opacity).toBe(
      messageThreadStyle.action.slotButtons.expansion.button.disabledOpacity,
    )
    const mobileMessageActionStyleSlots = createChatRuntimeMessageActionMobileStyleSlots({
      renderState: messageThreadStyle.action,
      spacing: {
        xs: 4,
      },
    })
    expect(mobileMessageActionStyleSlots.row).toEqual({
      flexDirection: "row",
      alignItems: messageThreadStyle.action.row.alignItems,
      justifyContent: "flex-end",
      marginTop: messageThreadStyle.action.row.marginTop,
      gap: 4,
    })
    expect(mobileMessageActionStyleSlots.buttons.expansion).toEqual(expansionButtonStyleSlots)
    expect(mobileMessageActionStyleSlots.buttons.copy.button.backgroundColor).toBe(
      messageThreadStyle.action.slotButtons.copy.colors.backgroundColor,
    )
    expect(mobileMessageActionStyleSlots.buttons.branch.button.backgroundColor).toBe(
      messageThreadStyle.action.slotButtons.branch.colors.backgroundColor,
    )
    expect(mobileMessageActionStyleSlots.buttons.speech.button.backgroundColor).toBe(
      messageThreadStyle.action.slotButtons.speech.colors.backgroundColor,
    )
    expect(mobileMessageActionStyleSlots.activeButtons.copy.button.backgroundColor).toBe(
      messageThreadStyle.action.activeSlotButtons.copy.colors.backgroundColor,
    )
    expect(mobileMessageActionStyleSlots.activeButtons.speech.button.backgroundColor).toBe(
      messageThreadStyle.action.activeSlotButtons.speech.colors.backgroundColor,
    )
    const threadBodyStyleKeys = [
      "retryStatusCard",
      "retryStatusHeader",
      "retryStatusTitle",
      "retryStatusMetaRow",
      "retryStatusAttempt",
      "retryStatusCountdown",
      "retryStatusDescription",
      "delegationCard",
      "delegationHeader",
      "delegationTitle",
      "delegationStatusBadge",
      "delegationStatusText",
      "delegationLiveText",
      "delegationSubtitle",
      "delegationMetaRow",
      "delegationMetaText",
      "delegationConversationPreview",
      "delegationConversationPreviewLine",
      "delegationConversationPreviewRole",
      "delegationConversationPreviewContent",
      "delegationConversationPreviewTimestamp",
      "delegationConversationPreviewMoreButton",
      "delegationConversationPreviewMoreButtonPressed",
      "delegationConversationPreviewMore",
      "delegationToolPreview",
      "delegationToolPreviewLabel",
      "delegationToolPreviewLine",
      "delegationToolPreviewStatusIcon",
      "delegationToolPreviewName",
      "toolCallCompactNamePending",
      "toolCallCompactNameSuccess",
      "toolCallCompactNameError",
      "delegationToolPreviewMoreButton",
      "delegationToolPreviewMoreButtonPressed",
      "delegationToolPreviewMore",
      "toolApprovalCard",
      "toolApprovalHeader",
      "toolApprovalContent",
      "toolApprovalContentDisabled",
      "toolApprovalTitle",
      "toolApprovalToolRow",
      "toolApprovalToolLabel",
      "toolApprovalTool",
      "toolApprovalArgumentsPreview",
      "toolApprovalArgumentsToggle",
      "toolApprovalArgumentsTogglePressed",
      "toolApprovalArgumentsToggleText",
      "toolApprovalArgumentsScroll",
      "toolApprovalArgumentsFull",
      "toolApprovalActions",
      "toolApprovalButton",
      "toolApprovalButtonDisabled",
      "toolApprovalApproveButton",
      "toolApprovalApproveButtonText",
      "toolApprovalDenyButton",
      "toolApprovalDenyButtonText",
      "inlineActivityIndicator",
      "inlineActivitySpinner",
      "messageContentRow",
      "messageContentBody",
      "streamingContentHeader",
      "streamingContentTitle",
      "streamingContentSpinner",
      "streamingContentBadge",
      "streamingContentBadgeText",
      "streamingContentBodyRow",
      "streamingContentText",
      "streamingContentCaret",
      "collapsedMessagePreviewToggle",
      "collapsedMessagePreviewTogglePressed",
      "collapsedMessagePreview",
      "toolCallCompactContainer",
      "toolCallCompactPressed",
      "toolCallCompactLine",
      "toolCallCompactLeadingIcon",
      "toolCallCompactName",
      "toolCallCompactStatusIndicator",
      "toolCallCompactToggleIcon",
      "toolExecutionExpandedContainer",
      "toolExecutionCard",
      "toolExecutionPending",
      "toolExecutionSuccess",
      "toolExecutionError",
      "toolExecutionCollapseTopButton",
      "toolExecutionCollapseBottomButton",
      "toolResponsePendingText",
      "toolCallSection",
      "toolCallHeader",
      "toolCallHeaderPressed",
      "toolName",
      "toolCallExpandHint",
      "toolCallExpandHintText",
      "toolParamsSection",
      "toolDetailHeaderRow",
      "toolPayloadMetaRow",
      "toolSectionLabel",
      "toolPayloadType",
      "toolDetailCopyButton",
      "toolDetailCopyButtonPressed",
      "toolDetailCopyButtonText",
      "toolPayloadPreview",
      "toolParamsScroll",
      "toolParamsScrollExpanded",
      "toolParamsCode",
      "toolResultItem",
      "toolResultHeader",
      "toolResultHeaderMeta",
      "toolResultBadge",
      "toolResultBadgeSuccess",
      "toolResultBadgeError",
      "toolResultBadgeText",
      "toolResultBadgeTextSuccess",
      "toolResultBadgeTextError",
      "toolResultCharCount",
      "toolResultScroll",
      "toolResultScrollExpanded",
      "toolResultCode",
      "toolResultErrorSection",
      "toolResultErrorLabel",
      "toolResultErrorText",
      "toolResponsePendingRow",
      "messageActionsRow",
    ] as const
    const threadBodyStyleSource = Object.fromEntries(
      threadBodyStyleKeys.map((key) => [key, key]),
    ) as Record<(typeof threadBodyStyleKeys)[number], string>
    const threadBodyStyleSlots = createChatMessageThreadBodyStyleSlots(threadBodyStyleSource)
    expect(threadBodyStyleSlots.retryStatus.card).toBe("retryStatusCard")
    expect(threadBodyStyleSlots.delegationCard.toolPreviewNamePending).toBe("toolCallCompactNamePending")
    expect(threadBodyStyleSlots.toolApproval.approveButton).toBe("toolApprovalApproveButton")
    expect(threadBodyStyleSlots.inlineActivity.spinnerStyle).toBe("inlineActivitySpinner")
    expect(threadBodyStyleSlots.content.streamingStyles.caret).toBe("streamingContentCaret")
    expect(
      threadBodyStyleSlots.toolExecutionStack.callDetail.resultSection.header.badge.textError,
    ).toBe("toolResultBadgeTextError")
    expect(threadBodyStyleSlots.standaloneActions.rowStyle).toBe("messageActionsRow")
    const threadSurfaceParts = createChatRuntimeToolActivityGroupThreadSurfaceMobilePropsParts({
      groupRenderState: {
        groupKey: "group-1",
        shouldRenderExpandedHeader: true,
        shouldRenderExpandedFooter: true,
      },
      onToggleGroup: "toggle-group",
      surfaceToneStyle: "assistant-surface-tone",
      styles: {
        surfaceStyle: "thread-surface",
        boundary: "activity-boundary",
      },
    })
    expect(threadSurfaceParts).toEqual({
      surface: {
        props: {
          surfaceStyle: "thread-surface",
          surfaceToneStyle: "assistant-surface-tone",
        },
      },
      leadingBoundary: {
        shouldRender: true,
        props: {
          renderState: {
            groupKey: "group-1",
            shouldRenderExpandedHeader: true,
            shouldRenderExpandedFooter: true,
          },
          kind: "expanded",
          onPress: "toggle-group",
          styles: "activity-boundary",
        },
      },
      trailingBoundary: {
        shouldRender: true,
        props: {
          renderState: {
            groupKey: "group-1",
            shouldRenderExpandedHeader: true,
            shouldRenderExpandedFooter: true,
          },
          kind: "footer",
          onPress: "toggle-group",
          styles: "activity-boundary",
        },
      },
    })
    expect(createChatRuntimeToolActivityGroupThreadSurfaceMobilePropsParts({
      groupRenderState: null,
      styles: {
        surfaceStyle: "thread-surface",
        boundary: "activity-boundary",
      },
    })).toEqual({
      surface: {
        props: {
          surfaceStyle: "thread-surface",
          surfaceToneStyle: undefined,
        },
      },
      leadingBoundary: {
        shouldRender: false,
        props: null,
      },
      trailingBoundary: {
        shouldRender: false,
        props: null,
      },
    })
    const activityGroupToggleRenderState = {
      collapsedHeader: {
        accessibilityRole: "button",
        accessibilityLabel: "Collapsed tool activities",
        accessibilityState: { expanded: false },
        ariaExpanded: false,
      },
      expandedHeader: {
        accessibilityRole: "button",
        accessibilityLabel: "Expanded tool activities",
        accessibilityState: { expanded: true },
        ariaExpanded: true,
      },
      summary: {
        shouldShowToolCallCount: true,
        toolCallCountLabel: "3 tool calls",
        toolCallCount: 3,
        previewText: "Read, edit, test",
      },
      leadingIcon: "leading-icon-state",
      headerToggleIcon: "toggle-icon-state",
      surface: {
        preview: {
          numberOfLines: 1,
          ellipsizeMode: "tail",
        },
      },
    }
    const activityGroupToggleParts = createChatRuntimeToolActivityGroupToggleMobilePropsParts({
      renderState: activityGroupToggleRenderState,
      headerKind: "collapsed",
      onPress: "toggle-group",
      styles: {
        container: "toggle-container",
        pressed: "toggle-pressed",
        headerRow: "toggle-header-row",
        countBadge: "toggle-count-badge",
        countBadgeText: "toggle-count-badge-text",
        previewLine: "toggle-preview-line",
      },
    })
    expect(activityGroupToggleParts.headerState).toBe(activityGroupToggleRenderState.collapsedHeader)
    expect(activityGroupToggleParts.pressable.props).toMatchObject({
      onPress: "toggle-group",
      accessibilityRole: "button",
      accessibilityLabel: "Collapsed tool activities",
      accessibilityState: { expanded: false },
      ariaExpanded: false,
    })
    expect(activityGroupToggleParts.pressable.props.style({ pressed: false })).toEqual([
      "toggle-container",
      false,
    ])
    expect(activityGroupToggleParts.pressable.props.style({ pressed: true })).toEqual([
      "toggle-container",
      "toggle-pressed",
    ])
    expect(activityGroupToggleParts.headerRow.props.style).toBe("toggle-header-row")
    expect(activityGroupToggleParts.headerRow.content.leadingIcon).toEqual({
      props: "leading-icon-state",
    })
    expect(activityGroupToggleParts.headerRow.content.countBadge).toEqual({
      shouldRender: true,
      props: {
        container: {
          props: {
            accessibilityLabel: "3 tool calls",
            style: "toggle-count-badge",
          },
        },
        label: {
          props: {
            style: "toggle-count-badge-text",
          },
          text: 3,
        },
      },
    })
    expect(activityGroupToggleParts.headerRow.content.preview).toEqual({
      props: {
        props: {
          style: "toggle-preview-line",
          numberOfLines: 1,
          ellipsizeMode: "tail",
        },
        text: "Read, edit, test",
      },
    })
    expect(activityGroupToggleParts.headerRow.content.toggleIcon).toEqual({
      props: "toggle-icon-state",
    })
    expect(createChatRuntimeToolActivityGroupToggleMobilePropsParts({
      renderState: {
        ...activityGroupToggleRenderState,
        summary: {
          ...activityGroupToggleRenderState.summary,
          shouldShowToolCallCount: false,
        },
      },
      headerKind: "expanded",
      styles: {
        container: "toggle-container",
        pressed: "toggle-pressed",
        headerRow: "toggle-header-row",
        countBadge: "toggle-count-badge",
        countBadgeText: "toggle-count-badge-text",
        previewLine: "toggle-preview-line",
      },
    }).headerState).toBe(activityGroupToggleRenderState.expandedHeader)
    expect(createChatRuntimeToolActivityGroupToggleMobilePropsParts({
      renderState: {
        ...activityGroupToggleRenderState,
        summary: {
          ...activityGroupToggleRenderState.summary,
          shouldShowToolCallCount: false,
        },
      },
      headerKind: "collapsed",
      styles: {
        container: "toggle-container",
        pressed: "toggle-pressed",
        headerRow: "toggle-header-row",
        countBadge: "toggle-count-badge",
        countBadgeText: "toggle-count-badge-text",
        previewLine: "toggle-preview-line",
      },
    }).headerRow.content.countBadge).toEqual({
      shouldRender: false,
      props: {
        container: {
          props: {
            accessibilityLabel: "3 tool calls",
            style: "toggle-count-badge",
          },
        },
        label: {
          props: {
            style: "toggle-count-badge-text",
          },
          text: 3,
        },
      },
    })
    const activityGroupFooterParts = createChatRuntimeToolActivityGroupFooterMobilePropsParts({
      renderState: {
        footerButton: {
          accessibilityRole: "button",
          accessibilityLabel: "Collapse tool activities",
          label: "Hide tool activities",
        },
        footerToggleIcon: "footer-icon-state",
      },
      onPress: "toggle-footer",
      styles: {
        button: "footer-button",
        pressed: "footer-pressed",
        text: "footer-text",
      },
    })
    expect(activityGroupFooterParts.button.props).toMatchObject({
      onPress: "toggle-footer",
      accessibilityRole: "button",
      accessibilityLabel: "Collapse tool activities",
    })
    expect(activityGroupFooterParts.button.props.style({ pressed: false })).toEqual([
      "footer-button",
      false,
    ])
    expect(activityGroupFooterParts.button.props.style({ pressed: true })).toEqual([
      "footer-button",
      "footer-pressed",
    ])
    expect(activityGroupFooterParts.button.content.icon).toEqual({
      props: "footer-icon-state",
    })
    expect(activityGroupFooterParts.button.content.label).toEqual({
      props: {
        props: {
          style: "footer-text",
        },
        text: "Hide tool activities",
      },
    })
    expect(createChatRuntimeToolActivityGroupBoundaryMobilePropsParts({
      renderState: "activity-group-state",
      kind: "footer",
      onPress: "toggle-group",
      styles: {
        toggle: "toggle-styles",
        footer: "footer-styles",
      },
    })).toEqual({
      toggle: {
        shouldRender: false,
        props: null,
      },
      footer: {
        shouldRender: true,
        props: {
          renderState: "activity-group-state",
          onPress: "toggle-group",
          styles: "footer-styles",
        },
      },
    })
    expect(createChatRuntimeToolActivityGroupBoundaryMobilePropsParts({
      renderState: "activity-group-state",
      kind: "collapsed",
      onPress: "toggle-group",
      styles: {
        toggle: "toggle-styles",
        footer: "footer-styles",
      },
    })).toEqual({
      toggle: {
        shouldRender: true,
        props: {
          renderState: "activity-group-state",
          headerKind: "collapsed",
          onPress: "toggle-group",
          styles: "toggle-styles",
        },
      },
      footer: {
        shouldRender: false,
        props: null,
      },
    })
    expect(createChatRuntimeConversationFrameMobilePropsParts({
      children: "viewport",
      dock: "dock",
      overlays: "overlays",
      keyboardAvoidingStyle: "keyboard-avoiding-style",
      keyboardAvoidingBehavior: "padding",
      keyboardVerticalOffset: 24,
      rootStyle: "root-style",
    })).toEqual({
      keyboardAvoidingView: {
        props: {
          style: "keyboard-avoiding-style",
          behavior: "padding",
          keyboardVerticalOffset: 24,
        },
      },
      root: {
        props: {
          style: "root-style",
        },
        content: {
          children: "viewport",
        },
        dock: {
          children: "dock",
        },
      },
      overlays: {
        children: "overlays",
      },
    })
    expect(createChatRuntimeConversationOverlaysMobilePropsParts({
      agentSelector: "agent-selector",
      promptEditor: "prompt-editor",
    })).toEqual({
      agentSelector: {
        children: "agent-selector",
      },
      promptEditor: {
        children: "prompt-editor",
      },
    })
    const runtimeThreadSurfaceStyles = {
      surfaceStyle: "thread-surface",
      boundary: "activity-boundary",
      getToneStyle: (toneStyleSlot: string) => `tone:${toneStyleSlot}`,
    }
    const runtimeThreadBody = {
      conversation: {
        surfaceToneStyleSlot: "assistant",
      },
    }
    const runtimeThreadParts = createChatRuntimeConversationRuntimeThreadMobilePropsParts({
      groupRenderState: {
        groupKey: "group-1",
        shouldSkipCollapsedItem: false,
        shouldRenderCollapsedHeader: false,
      },
      onToggleGroup: "toggle-group",
      body: runtimeThreadBody,
      styles: {
        surface: runtimeThreadSurfaceStyles,
        body: "thread-body-styles",
      },
    })
    expect(runtimeThreadParts.shouldSkipThread).toBe(false)
    expect(runtimeThreadParts.collapsedBoundary).toEqual({
      shouldRender: false,
      props: null,
    })
    expect(runtimeThreadParts.bodySurface.shouldRender).toBe(true)
    if (!runtimeThreadParts.bodySurface.shouldRender) {
      throw new Error("Expected runtime thread body surface")
    }
    expect(runtimeThreadParts.bodySurface.body.props).toBe(runtimeThreadBody)
    expect(runtimeThreadParts.bodySurface.bodyPanel.props).toEqual({
      styles: "thread-body-styles",
    })
    expect(runtimeThreadParts.bodySurface.surface).toEqual({
      props: {
        surfaceToneStyle: "tone:assistant",
        groupRenderState: {
          groupKey: "group-1",
          shouldSkipCollapsedItem: false,
          shouldRenderCollapsedHeader: false,
        },
        onToggleGroup: "toggle-group",
        styles: runtimeThreadSurfaceStyles,
      },
    })
    expect(createChatRuntimeConversationRuntimeThreadMobilePropsParts({
      groupRenderState: {
        groupKey: "group-1",
        shouldSkipCollapsedItem: false,
        shouldRenderCollapsedHeader: true,
      },
      onToggleGroup: "toggle-group",
      body: runtimeThreadBody,
      styles: {
        surface: runtimeThreadSurfaceStyles,
        body: "thread-body-styles",
      },
    })).toEqual({
      shouldSkipThread: false,
      collapsedBoundary: {
        shouldRender: true,
        props: {
          renderState: {
            groupKey: "group-1",
            shouldSkipCollapsedItem: false,
            shouldRenderCollapsedHeader: true,
          },
          kind: "collapsed",
          onPress: "toggle-group",
          styles: "activity-boundary",
        },
      },
      bodySurface: {
        shouldRender: false,
      },
    })
    expect(createChatRuntimeConversationRuntimeThreadMobilePropsParts({
      groupRenderState: {
        groupKey: "group-1",
        shouldSkipCollapsedItem: true,
        shouldRenderCollapsedHeader: true,
      },
      body: runtimeThreadBody,
      styles: {
        surface: runtimeThreadSurfaceStyles,
        body: "thread-body-styles",
      },
    })).toEqual({
      shouldSkipThread: true,
      collapsedBoundary: {
        shouldRender: false,
        props: null,
      },
      bodySurface: {
        shouldRender: false,
      },
    })
    const runtimeThreadListParts = createChatRuntimeConversationRuntimeThreadListMobilePropsParts({
      threadStates: [
        {
          threadKey: "thread-visible",
          shouldRenderThread: true,
          groupRenderState: {
            groupKey: "group-1",
            shouldRenderCollapsedHeader: false,
          },
          onToggleGroup: "toggle-group",
          body: runtimeThreadBody,
        },
        {
          threadKey: "thread-hidden",
          shouldRenderThread: false,
          groupRenderState: null,
          body: null,
        },
      ],
      styles: "runtime-thread-styles",
    })
    expect(runtimeThreadListParts).toEqual({
      threads: [
        {
          key: "thread-visible",
          props: {
            groupRenderState: {
              groupKey: "group-1",
              shouldRenderCollapsedHeader: false,
            },
            onToggleGroup: "toggle-group",
            body: runtimeThreadBody,
            styles: "runtime-thread-styles",
          },
        },
      ],
    })
    expect(createChatRuntimeConversationScrollViewportMobilePropsParts({
      children: "thread-list",
      scrollRef: "scroll-ref",
      style: "scroll-style",
      contentContainerStyle: "scroll-content-style",
      keyboardShouldPersistTaps: "handled",
      contentInsetAdjustmentBehavior: "automatic",
      onScroll: "on-scroll",
      onScrollBeginDrag: "on-scroll-begin-drag",
      onScrollEndDrag: "on-scroll-end-drag",
      scrollEventThrottle: 16,
    })).toEqual({
      scrollView: {
        props: {
          ref: "scroll-ref",
          style: "scroll-style",
          contentContainerStyle: "scroll-content-style",
          keyboardShouldPersistTaps: "handled",
          contentInsetAdjustmentBehavior: "automatic",
          onScroll: "on-scroll",
          onScrollBeginDrag: "on-scroll-begin-drag",
          onScrollEndDrag: "on-scroll-end-drag",
          scrollEventThrottle: 16,
        },
      },
      content: {
        children: "thread-list",
      },
    })
    expect(createChatRuntimeConversationViewportContentMobilePropsParts({
      loadingState: "loading-state",
      homeState: "home-state",
      historyBanner: "history-banner",
      stepSummary: "step-summary",
      children: "thread-list",
      debugPanels: "debug-panels",
    })).toEqual({
      loadingState: {
        children: "loading-state",
      },
      homeState: {
        children: "home-state",
      },
      historyBanner: {
        children: "history-banner",
      },
      stepSummary: {
        children: "step-summary",
      },
      content: {
        children: "thread-list",
      },
      debugPanels: {
        children: "debug-panels",
      },
    })
    const viewportParts = createChatRuntimeConversationViewportMobilePropsParts({
      loadingState: {
        renderState: "loading-render-state",
        spinnerSource: "spinner-source",
      },
      homeQuickStarts: {
        shouldRender: true,
        items: ["quick-start-item"],
      },
      historyBanner: {
        renderState: "history-banner-state",
      },
      stepSummary: {
        renderState: "step-summary-state",
      },
      debugPanels: {
        requestRows: ["request-row"],
        voiceRows: ["voice-row"],
      },
      styles: {
        scrollViewport: {
          style: "scroll-viewport-style",
          contentContainerStyle: "scroll-content-style",
        },
        loadingState: {
          style: "loading-state-style",
          spinnerStyle: "loading-spinner-style",
        },
        homeQuickStarts: "home-quick-starts-styles",
        historyBanner: "history-banner-styles",
        stepSummary: "step-summary-styles",
        debugPanels: {
          panelStyle: "debug-panel-style",
          textStyle: "debug-text-style",
        },
      },
    })
    expect(viewportParts).toEqual({
      scrollViewport: {
        props: {
          style: "scroll-viewport-style",
          contentContainerStyle: "scroll-content-style",
        },
      },
      loadingState: {
        props: {
          renderState: "loading-render-state",
          spinnerSource: "spinner-source",
          style: "loading-state-style",
          spinnerStyle: "loading-spinner-style",
        },
      },
      homeQuickStarts: {
        props: {
          shouldRender: true,
          items: ["quick-start-item"],
          styles: "home-quick-starts-styles",
        },
      },
      historyBanner: {
        props: {
          renderState: "history-banner-state",
          styles: "history-banner-styles",
        },
      },
      stepSummary: {
        props: {
          renderState: "step-summary-state",
          styles: "step-summary-styles",
        },
      },
      debugPanels: {
        props: {
          requestRows: ["request-row"],
          voiceRows: ["voice-row"],
          panelStyle: "debug-panel-style",
          textStyle: "debug-text-style",
        },
      },
    })
    expect(createChatRuntimeDebugPanelStackMobilePropsParts({
      requestShouldRender: true,
      requestRows: [{ key: "request-row-key", text: "request-row" }],
      voiceShouldRender: false,
      voiceRows: [{ key: "voice-row-key", text: "voice-row" }],
      panelStyle: "debug-panel-style",
      textStyle: "debug-text-style",
    })).toEqual({
      requestPanel: {
        shouldRender: true,
        rows: [{
          key: "request-row-key",
          text: "request-row",
          props: {
            style: "debug-text-style",
          },
        }],
        props: {
          style: "debug-panel-style",
        },
      },
      voicePanel: {
        shouldRender: false,
        rows: [{
          key: "voice-row-key",
          text: "voice-row",
          props: {
            style: "debug-text-style",
          },
        }],
        props: {
          style: "debug-panel-style",
        },
      },
    })
    const dockParts = createChatRuntimeConversationDockMobilePropsParts({
      responseHistoryPanel: {
        responses: ["response-event"],
      },
      scrollToBottomButton: {
        renderState: "scroll-button-state",
      },
      voiceOverlay: {
        renderState: "voice-overlay-state",
      },
      queuePanel: {
        renderState: "queue-panel-state",
      },
      connectionBanner: {
        renderState: "connection-banner-state",
      },
      composer: {
        value: "composer-value",
      },
      styles: {
        scrollToBottomButtonStyle: "scroll-button-style",
        voiceOverlay: "voice-overlay-styles",
        queuePanelStyle: "queue-panel-style",
        connectionBanner: "connection-banner-styles",
        composer: "composer-styles",
      },
    })
    expect(dockParts).toEqual({
      responseHistoryPanel: {
        props: {
          responses: ["response-event"],
        },
      },
      scrollToBottomButton: {
        props: {
          renderState: "scroll-button-state",
          style: "scroll-button-style",
        },
      },
      voiceOverlay: {
        props: {
          renderState: "voice-overlay-state",
          styles: "voice-overlay-styles",
        },
      },
      queuePanel: {
        props: {
          renderState: "queue-panel-state",
          container: {
            props: {
              style: "queue-panel-style",
            },
          },
        },
      },
      connectionBanner: {
        props: {
          renderState: "connection-banner-state",
          styles: "connection-banner-styles",
        },
      },
      composer: {
        props: {
          value: "composer-value",
          styles: "composer-styles",
        },
      },
    })
    expect(createChatRuntimeConversationDockShellMobilePropsParts({
      responseHistoryPanel: "response-history",
      scrollToBottomButton: "scroll-button",
      voiceOverlay: "voice-overlay",
      queuePanel: "queue-panel",
      connectionBanner: "connection-banner",
      composer: "composer",
    })).toEqual({
      responseHistoryPanel: {
        children: "response-history",
      },
      scrollToBottomButton: {
        children: "scroll-button",
      },
      voiceOverlay: {
        children: "voice-overlay",
      },
      queuePanel: {
        children: "queue-panel",
      },
      connectionBanner: {
        children: "connection-banner",
      },
      composer: {
        children: "composer",
      },
    })
    const composerDockParts = createChatComposerRuntimeDockMobilePropsParts({
      speechPreview: {
        text: "voice draft",
      },
      pendingImagesRail: {
        images: ["image-1"],
      },
      handsFreeControls: {
        status: {
          phase: "listening",
          label: "Listening",
        },
        controlState: "hands-free-controls",
      },
      imageAttachmentControl: {
        renderState: "image-attachment-state",
      },
      textToSpeechControl: {
        renderState: "tts-state",
      },
      editBeforeSendControl: {
        renderState: "edit-state",
      },
      textEntry: {
        value: "hello",
      },
      queueAction: {
        renderState: "queue-state",
      },
      submitAction: {
        renderState: "submit-state",
      },
      micButton: {
        renderState: "mic-state",
      },
      micWrapperRef: "mic-wrapper",
      styles: {
        speechPreview: "speech-preview-styles",
        pendingImagesRail: "pending-images-styles",
        handsFreeControls: "hands-free-control-styles",
        accessoryButton: {
          style: "accessory-style",
          activeStyle: "accessory-active-style",
        },
        textEntry: "text-entry-styles",
        queueAction: "queue-action-styles",
        submitAction: "submit-action-styles",
        micButton: "mic-button-styles",
        inputDock: "input-dock-styles",
      },
    })
    expect(composerDockParts).toEqual({
      speechPreview: {
        props: {
          text: "voice draft",
          styles: "speech-preview-styles",
        },
      },
      pendingImagesRail: {
        props: {
          images: ["image-1"],
          styles: "pending-images-styles",
        },
      },
      handsFreeControls: {
        props: {
          controlState: "hands-free-controls",
          styles: "hands-free-control-styles",
        },
        content: {
          status: {
            props: {
              phase: "listening",
              label: "Listening",
            },
          },
        },
      },
      imageAttachmentControl: {
        props: {
          renderState: "image-attachment-state",
          style: "accessory-style",
          activeStyle: "accessory-active-style",
        },
      },
      textToSpeechControl: {
        props: {
          renderState: "tts-state",
          style: "accessory-style",
          activeStyle: "accessory-active-style",
        },
      },
      editBeforeSendControl: {
        props: {
          renderState: "edit-state",
          style: "accessory-style",
          activeStyle: "accessory-active-style",
        },
      },
      textEntry: {
        props: {
          value: "hello",
          styles: "text-entry-styles",
        },
      },
      queueAction: {
        props: {
          renderState: "queue-state",
          styles: "queue-action-styles",
        },
      },
      submitAction: {
        props: {
          renderState: "submit-state",
          styles: "submit-action-styles",
        },
      },
      micButton: {
        props: {
          renderState: "mic-state",
          styles: "mic-button-styles",
        },
      },
      inputDock: {
        props: {
          micWrapperRef: "mic-wrapper",
          styles: "input-dock-styles",
        },
      },
    })
    expect(createChatComposerInputDockMobilePropsParts({
      speechPreview: "speech-preview",
      pendingImagesRail: "pending-images",
      handsFreeControls: "hands-free",
      imageAttachmentControl: "image-control",
      textToSpeechControl: "tts-control",
      editBeforeSendControl: "edit-control",
      textEntry: "text-entry",
      queueAction: "queue-action",
      submitAction: "submit-action",
      micButton: "mic-button",
      micWrapperRef: "mic-wrapper",
      styles: {
        area: "input-area",
        row: "input-row",
        micWrapper: "mic-wrapper-style",
      },
    })).toEqual({
      area: {
        props: {
          style: "input-area",
        },
        content: {
          speechPreview: {
            children: "speech-preview",
          },
          pendingImagesRail: {
            children: "pending-images",
          },
          handsFreeControls: {
            children: "hands-free",
          },
          row: {
            props: {
              style: "input-row",
            },
            content: {
              imageAttachmentControl: {
                children: "image-control",
              },
              textToSpeechControl: {
                children: "tts-control",
              },
              editBeforeSendControl: {
                children: "edit-control",
              },
              textEntry: {
                children: "text-entry",
              },
              queueAction: {
                children: "queue-action",
              },
              submitAction: {
                children: "submit-action",
              },
            },
          },
          micWrapper: {
            props: {
              ref: "mic-wrapper",
              style: "mic-wrapper-style",
            },
            content: {
              micButton: {
                children: "mic-button",
              },
            },
          },
        },
      },
    })
    expect(createChatComposerSpeechPreviewMobilePropsParts({
      label: "Speech preview",
      text: "voice draft",
      styles: {
        box: "speech-preview-box",
        label: "speech-preview-label",
        text: "speech-preview-text",
      },
    })).toEqual({
      shouldRender: true,
      container: {
        props: {
          style: "speech-preview-box",
        },
      },
      label: {
        props: {
          style: "speech-preview-label",
          text: "Speech preview",
        },
      },
      text: {
        props: {
          style: "speech-preview-text",
          text: "voice draft",
        },
      },
    })
    expect(createChatComposerSpeechPreviewMobilePropsParts({
      label: "Speech preview",
      text: "",
      styles: {
        box: "speech-preview-box",
        label: "speech-preview-label",
        text: "speech-preview-text",
      },
    }).shouldRender).toBe(false)
    const handsFreeControlStyles = {
      statusRow: "hands-free-status-row",
      controlsRow: "hands-free-controls-row",
      controlButton: "hands-free-control-button",
      controlButtonText: "hands-free-control-button-text",
    }
    const handsFreeControlsParts = createChatComposerHandsFreeControlsMobilePropsParts({
      isVisible: true,
      status: "hands-free-status",
      controlState: {
        primary: {
          action: "wake",
          label: "Wake",
          accessibilityRole: "button",
          accessibilityLabel: "Wake agent",
        },
        secondary: {
          action: "resume",
          label: "Resume",
          accessibilityRole: "button",
          accessibilityLabel: "Resume handsfree",
        },
      },
      onWake: "wake-handler",
      onSleep: "sleep-handler",
      onResume: "resume-handler",
      onPause: "pause-handler",
      controlPressedOpacity: 0.66,
      styles: handsFreeControlStyles,
    })
    expect(handsFreeControlsParts).toEqual({
      shouldRender: true,
      statusRow: {
        props: {
          style: "hands-free-status-row",
        },
        content: {
          status: {
            children: "hands-free-status",
          },
        },
      },
      controlsRow: {
        props: {
          style: "hands-free-controls-row",
        },
        content: {
          primaryControl: {
            touchable: {
              props: {
                style: "hands-free-control-button",
                onPress: "wake-handler",
                activeOpacity: 0.66,
                accessibilityRole: "button",
                accessibilityLabel: "Wake agent",
              },
            },
            content: {
              label: {
                props: {
                  style: "hands-free-control-button-text",
                  text: "Wake",
                },
              },
            },
          },
          secondaryControl: {
            touchable: {
              props: {
                style: "hands-free-control-button",
                onPress: "resume-handler",
                activeOpacity: 0.66,
                accessibilityRole: "button",
                accessibilityLabel: "Resume handsfree",
              },
            },
            content: {
              label: {
                props: {
                  style: "hands-free-control-button-text",
                  text: "Resume",
                },
              },
            },
          },
        },
      },
    })
    const sleepingHandsFreeControlsParts = createChatComposerHandsFreeControlsMobilePropsParts({
      isVisible: false,
      status: "hands-free-status",
      controlState: {
        primary: {
          action: "sleep",
          label: "Sleep",
          accessibilityRole: "button",
          accessibilityLabel: "Sleep agent",
        },
        secondary: {
          action: "pause",
          label: "Pause",
          accessibilityRole: "button",
          accessibilityLabel: "Pause handsfree",
        },
      },
      onWake: "wake-handler",
      onSleep: "sleep-handler",
      onResume: "resume-handler",
      onPause: "pause-handler",
      controlPressedOpacity: 0.66,
      styles: handsFreeControlStyles,
    })
    expect(sleepingHandsFreeControlsParts.shouldRender).toBe(false)
    expect(sleepingHandsFreeControlsParts.controlsRow.content.primaryControl.touchable.props.onPress)
      .toBe("sleep-handler")
    expect(sleepingHandsFreeControlsParts.controlsRow.content.secondaryControl.touchable.props.onPress)
      .toBe("pause-handler")
    expect(createChatComposerVoiceOverlayMobilePropsParts({
      isVisible: true,
      label: "Listening",
      transcript: "voice transcript",
      transcriptNumberOfLines: 2,
      styles: {
        overlay: "voice-overlay",
        card: "voice-overlay-card",
        label: "voice-overlay-label",
        transcript: "voice-overlay-transcript",
      },
    })).toEqual({
      shouldRender: true,
      overlay: {
        props: {
          style: "voice-overlay",
          pointerEvents: "none",
        },
      },
      card: {
        props: {
          style: "voice-overlay-card",
        },
      },
      label: {
        props: {
          style: "voice-overlay-label",
          text: "Listening",
        },
      },
      transcript: {
        shouldRender: true,
        props: {
          style: "voice-overlay-transcript",
          numberOfLines: 2,
          text: "voice transcript",
        },
      },
    })
    expect(createChatComposerVoiceOverlayMobilePropsParts({
      isVisible: false,
      label: "Listening",
      transcript: "",
      transcriptNumberOfLines: 2,
      styles: {
        overlay: "voice-overlay",
        card: "voice-overlay-card",
        label: "voice-overlay-label",
        transcript: "voice-overlay-transcript",
      },
    })).toMatchObject({
      shouldRender: false,
      transcript: {
        shouldRender: false,
        props: {
          style: "voice-overlay-transcript",
          numberOfLines: 2,
          text: "",
        },
      },
    })
    expect(createChatComposerTextEntryMobilePropsParts({
      inputRef: "input-ref",
      value: "hello",
      onChangeText: "change-text",
      onKeyPress: "key-press",
      accessibilityLabel: "Message",
      accessibilityHint: "Press Enter to send.",
      placeholder: "Message agent",
      placeholderTextColor: "#64748b",
      voiceStatusLiveRegionAnnouncement: "Voice transcript ready.",
      webAccessibility: {
        isWebPlatform: true,
        inputDescriptionNativeId: "chat-composer-hint",
        voiceStatusLiveRegionNativeId: "chat-composer-voice-status",
        voiceStatusLiveRegionPoliteness: "none",
      },
      styles: {
        input: "text-entry-input",
        visuallyHiddenHint: "visually-hidden-hint",
      },
    })).toEqual({
      input: {
        props: {
          ref: "input-ref",
          style: "text-entry-input",
          value: "hello",
          onChangeText: "change-text",
          onKeyPress: "key-press",
          accessibilityLabel: "Message",
          accessibilityHint: "Press Enter to send.",
          "aria-describedby": "chat-composer-hint",
          placeholder: "Message agent",
          placeholderTextColor: "#64748b",
          multiline: true,
        },
      },
      inputDescription: {
        shouldRender: true,
        props: {
          nativeID: "chat-composer-hint",
          style: "visually-hidden-hint",
          text: "Press Enter to send.",
        },
      },
      voiceStatusLiveRegion: {
        shouldRender: true,
        props: {
          nativeID: "chat-composer-voice-status",
          style: "visually-hidden-hint",
          accessibilityLiveRegion: "none",
          "aria-live": "off",
          text: "Voice transcript ready.",
        },
      },
    })
    expect(createChatComposerTextEntryMobilePropsParts({
      value: "hello",
      onChangeText: "change-text",
      accessibilityLabel: "Message",
      accessibilityHint: "Press Enter to send.",
      placeholder: "Message agent",
      placeholderTextColor: "#64748b",
      voiceStatusLiveRegionAnnouncement: "Voice transcript ready.",
      webAccessibility: {
        isWebPlatform: false,
        inputDescriptionNativeId: "chat-composer-hint",
        voiceStatusLiveRegionNativeId: "chat-composer-voice-status",
        voiceStatusLiveRegionPoliteness: "polite",
      },
      styles: {
        input: "text-entry-input",
        visuallyHiddenHint: "visually-hidden-hint",
      },
    })).toMatchObject({
      input: {
        props: {
          "aria-describedby": undefined,
          multiline: true,
        },
      },
      inputDescription: {
        shouldRender: false,
        props: {
          nativeID: "chat-composer-hint",
          style: "visually-hidden-hint",
          text: "Press Enter to send.",
        },
      },
      voiceStatusLiveRegion: {
        shouldRender: false,
        props: {
          nativeID: "chat-composer-voice-status",
          style: "visually-hidden-hint",
          accessibilityLiveRegion: "polite",
          "aria-live": "polite",
          text: "Voice transcript ready.",
        },
      },
    })
    const composerIconButtonParts = createChatComposerIconButtonMobilePropsParts({
      shouldRender: true,
      renderState: {
        isActive: true,
        accessibilityRole: "button",
        accessibilityLabel: "Attach image",
        accessibilityHint: null,
        accessibilityState: { checked: true },
        ariaChecked: true,
        icon: {
          name: "image",
          size: 18,
          color: "#ffffff",
        },
      },
      onPress: "press-accessory",
      activeOpacity: 0.72,
      style: "accessory-style",
      activeStyle: "accessory-active-style",
    })
    expect(composerIconButtonParts).toEqual({
      shouldRender: true,
      touchable: {
        props: {
          style: ["accessory-style", "accessory-active-style"],
          onPress: "press-accessory",
          activeOpacity: 0.72,
          accessibilityRole: "button",
          accessibilityLabel: "Attach image",
          accessibilityHint: undefined,
          accessibilityState: { checked: true },
          "aria-checked": true,
        },
        content: {
          icon: {
            props: {
              name: "image",
              size: 18,
              color: "#ffffff",
            },
          },
        },
      },
    })
    expect(createChatComposerIconButtonMobilePropsParts({
      shouldRender: false,
      renderState: {
        accessibilityRole: "button",
        accessibilityLabel: "Attach image",
        icon: {
          name: "image",
          size: 18,
          color: "#ffffff",
        },
      },
      style: "accessory-style",
    }).shouldRender).toBe(false)
    const composerLabeledActionButtonParts = createChatComposerLabeledActionButtonMobilePropsParts({
      shouldRender: true,
      renderState: {
        isDisabled: true,
        accessibilityRole: "button",
        accessibilityLabel: "Queue message",
        accessibilityHint: null,
        accessibilityState: { disabled: true },
        icon: {
          name: "albums",
          size: 16,
          color: "#ffffff",
        },
        label: "Queue",
      },
      onPress: "press-queue",
      activeOpacity: 0.68,
      styles: {
        button: "queue-button",
        disabledButton: "queue-disabled-button",
        text: "queue-button-text",
      },
    })
    expect(composerLabeledActionButtonParts).toEqual({
      shouldRender: true,
      touchable: {
        props: {
          style: ["queue-button", "queue-disabled-button"],
          onPress: "press-queue",
          activeOpacity: 0.68,
          disabled: true,
          accessibilityRole: "button",
          accessibilityLabel: "Queue message",
          accessibilityHint: undefined,
          accessibilityState: { disabled: true },
        },
        content: {
          icon: {
            props: {
              name: "albums",
              size: 16,
              color: "#ffffff",
            },
          },
          label: {
            shouldRender: true,
            props: {
              style: "queue-button-text",
              text: "Queue",
            },
          },
        },
      },
    })
    expect(createChatComposerLabeledActionButtonMobilePropsParts({
      shouldRender: false,
      renderState: {
        accessibilityRole: "button",
        accessibilityLabel: "Queue message",
        icon: {
          name: "albums",
          size: 16,
          color: "#ffffff",
        },
        label: "Queue",
      },
      styles: {
        button: "queue-button",
        text: "queue-button-text",
      },
    }).shouldRender).toBe(false)
    expect(createChatComposerMicButtonMobilePropsParts({
      renderState: {
        isActive: true,
        accessibilityRole: "button",
        accessibilityLabel: "Start voice input",
        accessibilityHint: null,
        accessibilityState: { busy: true },
        ariaBusy: true,
        icon: {
          name: "mic",
          size: 20,
          color: "#ffffff",
        },
        label: "Hold to talk",
        labelSelectable: false,
      },
      onPressIn: "press-in",
      onPressOut: "press-out",
      onPress: "press",
      webPressedStyle: "web-pressed",
      styles: {
        button: "mic-button",
        activeButton: "mic-active-button",
        label: "mic-label",
        activeLabel: "mic-active-label",
      },
    })).toEqual({
      pressable: {
        props: {
          style: ["mic-button", "mic-active-button", "web-pressed"],
          accessibilityRole: "button",
          accessibilityLabel: "Start voice input",
          accessibilityHint: undefined,
          accessibilityState: { busy: true },
          "aria-busy": true,
          onPressIn: "press-in",
          onPressOut: "press-out",
          onPress: "press",
        },
        content: {
          icon: {
            props: {
              name: "mic",
              size: 20,
              color: "#ffffff",
            },
          },
          label: {
            props: {
              style: ["mic-label", "mic-active-label"],
              selectable: false,
              text: "Hold to talk",
            },
          },
        },
      },
    })
    const removedImageIds: Array<string | number> = []
    const pendingImagesRailParts = createChatComposerPendingImagesRailMobilePropsParts({
      images: [{
        id: "image-1",
        previewUri: "file://preview-1.png",
      }],
      renderState: {
        surface: {
          row: {
            showsHorizontalScrollIndicator: false,
          },
        },
        removeButton: {
          pressedOpacity: 0.62,
          accessibilityRole: "button",
          accessibilityLabel: "Remove image",
        },
        removeIcon: {
          name: "close",
          size: 16,
          color: "#ffffff",
        },
      },
      onRemove: (imageId) => {
        removedImageIds.push(imageId)
      },
      styles: {
        row: "pending-row",
        card: "pending-card",
        preview: "pending-preview",
        removeButton: "pending-remove-button",
      },
    })
    expect(pendingImagesRailParts.shouldRender).toBe(true)
    expect(pendingImagesRailParts.scrollView).toEqual({
      props: {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: "pending-row",
      },
    })
    expect(pendingImagesRailParts.items).toHaveLength(1)
    const pendingImageItem = pendingImagesRailParts.items[0]!
    expect(pendingImageItem).toEqual({
      key: "image-1",
      card: {
        props: {
          style: "pending-card",
        },
      },
      preview: {
        props: {
          source: { uri: "file://preview-1.png" },
          style: "pending-preview",
        },
      },
      removeButton: {
        props: {
          style: "pending-remove-button",
          onPress: expect.any(Function),
          activeOpacity: 0.62,
          accessibilityRole: "button",
          accessibilityLabel: "Remove image",
        },
      },
      removeIcon: {
        props: {
          name: "close",
          size: 16,
          color: "#ffffff",
        },
      },
    })
    pendingImageItem.removeButton.props.onPress()
    expect(removedImageIds).toEqual(["image-1"])
    expect(createChatComposerPendingImagesRailMobilePropsParts({
      images: [],
      renderState: {
        surface: {
          row: {
            showsHorizontalScrollIndicator: false,
          },
        },
        removeButton: {
          pressedOpacity: 0.62,
          accessibilityRole: "button",
          accessibilityLabel: "Remove image",
        },
        removeIcon: {
          name: "close",
          size: 16,
          color: "#ffffff",
        },
      },
      onRemove: (imageId) => {
        removedImageIds.push(imageId)
      },
      styles: {
        row: "pending-row",
        card: "pending-card",
        preview: "pending-preview",
        removeButton: "pending-remove-button",
      },
    })).toMatchObject({
      shouldRender: false,
      items: [],
    })
    const surfaceParts = createChatRuntimeConversationSurfaceMobilePropsParts({
      frame: {
        keyboardAvoidingBehavior: "padding",
        keyboardVerticalOffset: 24,
      },
      dock: {
        scrollToBottomButton: "scroll-button-props",
      },
      overlays: {
        agentSelector: "agent-selector-props",
      },
      threadList: {
        items: ["thread-item"],
      },
      viewport: {
        scrollRef: "scroll-ref",
      },
      styles: {
        frame: {
          keyboardAvoidingStyle: "keyboard-avoiding-style",
          rootStyle: "root-style",
        },
        dock: "dock-styles",
        viewport: "viewport-styles",
      },
    })
    expect(surfaceParts).toEqual({
      frame: {
        props: {
          keyboardAvoidingBehavior: "padding",
          keyboardVerticalOffset: 24,
          keyboardAvoidingStyle: "keyboard-avoiding-style",
          rootStyle: "root-style",
        },
      },
      dock: {
        props: {
          scrollToBottomButton: "scroll-button-props",
          styles: "dock-styles",
        },
      },
      overlays: {
        props: {
          agentSelector: "agent-selector-props",
        },
      },
      viewport: {
        props: {
          scrollRef: "scroll-ref",
          styles: "viewport-styles",
        },
        content: {
          threadList: {
            props: {
              items: ["thread-item"],
            },
          },
        },
      },
    })
    const statusPanelParts = createChatRuntimeConversationThreadBodyStatusPanelMobilePropsParts({
      retryStatus: {
        renderState: "retry-render-state",
      },
      delegationCard: {
        renderState: "delegation-render-state",
      },
      toolApproval: {
        renderState: "approval-render-state",
      },
      inlineActivity: {
        renderState: "inline-activity-render-state",
        spinnerSource: "spinner-source",
      },
      styles: {
        retryStatus: "retry-status-styles",
        delegationCard: "delegation-card-styles",
        toolApproval: "tool-approval-styles",
        inlineActivity: {
          style: "inline-activity-style",
          spinnerStyle: "inline-activity-spinner-style",
        },
      },
    })
    expect(statusPanelParts).toEqual({
      retryStatus: {
        shouldRender: true,
        props: {
          renderState: "retry-render-state",
          styles: "retry-status-styles",
        },
      },
      delegationCard: {
        shouldRender: true,
        props: {
          renderState: "delegation-render-state",
          styles: "delegation-card-styles",
        },
      },
      toolApproval: {
        shouldRender: true,
        props: {
          renderState: "approval-render-state",
          styles: "tool-approval-styles",
        },
      },
      inlineActivity: {
        shouldRender: true,
        props: {
          renderState: "inline-activity-render-state",
          spinnerSource: "spinner-source",
          style: "inline-activity-style",
          spinnerStyle: "inline-activity-spinner-style",
        },
      },
    })
    expect(createChatRuntimeConversationThreadBodyStatusPanelMobilePropsParts({
      retryStatus: null,
      delegationCard: null,
      toolApproval: null,
      inlineActivity: null,
      styles: {
        retryStatus: "retry-status-styles",
        delegationCard: "delegation-card-styles",
        toolApproval: "tool-approval-styles",
        inlineActivity: {
          style: "inline-activity-style",
          spinnerStyle: "inline-activity-spinner-style",
        },
      },
    })).toEqual({
      retryStatus: {
        shouldRender: false,
        props: null,
      },
      delegationCard: {
        shouldRender: false,
        props: null,
      },
      toolApproval: {
        shouldRender: false,
        props: null,
      },
      inlineActivity: {
        shouldRender: false,
        props: null,
      },
    })
    const conversationBodyPanelParts = createChatRuntimeConversationBodyPanelMobilePropsParts({
      conversation: {
        content: {
          contentDisplayMode: "expanded",
          shouldRenderActionSlots: true,
          entries: ["message-action"],
          expanded: {
            markdownContent: "expanded message",
            spinnerSource: "spinner-source",
          },
          collapsed: {
            renderState: "collapsed-preview",
            onPress: "toggle-preview",
          },
        },
        toolExecutionStack: {
          shouldRender: true,
          detailRows: ["tool-detail-row"],
        },
        standaloneActions: {
          shouldRender: true,
          entries: ["standalone-action"],
        },
      },
      styles: {
        content: {
          rowStyle: "message-content-row",
          expandedBodyStyle: "message-content-body",
          streamingStyles: "streaming-content-styles",
          collapsedStyle: "collapsed-preview-style",
          collapsedPressedStyle: "collapsed-preview-pressed-style",
          collapsedTextStyle: "collapsed-preview-text-style",
        },
        toolExecutionStack: "tool-execution-stack-styles",
        standaloneActions: {
          rowStyle: "standalone-actions-row",
        },
      },
    })
    expect(conversationBodyPanelParts).toEqual({
      content: {
        contentDisplayMode: "expanded",
        shouldRenderActionSlots: true,
        entries: ["message-action"],
        rowStyle: "message-content-row",
        expanded: {
          markdownContent: "expanded message",
          spinnerSource: "spinner-source",
          bodyStyle: "message-content-body",
          streamingStyles: "streaming-content-styles",
        },
        collapsed: {
          renderState: "collapsed-preview",
          onPress: "toggle-preview",
          style: "collapsed-preview-style",
          pressedStyle: "collapsed-preview-pressed-style",
          textStyle: "collapsed-preview-text-style",
        },
      },
      toolExecutionStack: {
        shouldRender: true,
        detailRows: ["tool-detail-row"],
        styles: "tool-execution-stack-styles",
      },
      standaloneActions: {
        shouldRender: true,
        entries: ["standalone-action"],
        rowStyle: "standalone-actions-row",
      },
    })
    const threadBodyPartsStyles = {
      retryStatus: "retry-status-styles",
      delegationCard: "delegation-card-styles",
      toolApproval: "tool-approval-styles",
      inlineActivity: {
        style: "inline-activity-style",
        spinnerStyle: "inline-activity-spinner-style",
      },
      content: {
        rowStyle: "message-content-row",
        expandedBodyStyle: "message-content-body",
        streamingStyles: "streaming-content-styles",
        collapsedStyle: "collapsed-preview-style",
        collapsedPressedStyle: "collapsed-preview-pressed-style",
        collapsedTextStyle: "collapsed-preview-text-style",
      },
      toolExecutionStack: "tool-execution-stack-styles",
      standaloneActions: {
        rowStyle: "standalone-actions-row",
      },
    }
    const threadBodyConversation = {
      content: {
        contentDisplayMode: "expanded",
        shouldRenderActionSlots: true,
        entries: ["message-action"],
        expanded: {
          markdownContent: "expanded message",
          spinnerSource: "spinner-source",
        },
        collapsed: {
          renderState: "collapsed-preview",
          onPress: "toggle-preview",
        },
      },
      toolExecutionStack: {
        shouldRender: true,
        detailRows: ["tool-detail-row"],
      },
      standaloneActions: {
        shouldRender: true,
        entries: ["standalone-action"],
      },
    }
    expect(createChatRuntimeConversationThreadBodyMobilePropsParts({
      bodyDisplayMode: "retryStatus",
      retryStatus: {
        renderState: "retry-render-state",
      },
      delegationCard: null,
      toolApproval: null,
      inlineActivity: null,
      conversation: threadBodyConversation,
      styles: threadBodyPartsStyles,
    })).toEqual({
      retryStatus: {
        shouldRender: true,
        props: {
          renderState: "retry-render-state",
          styles: "retry-status-styles",
        },
      },
      delegationCard: {
        shouldRender: false,
        props: null,
      },
      toolApproval: {
        shouldRender: false,
        props: null,
      },
      inlineActivity: {
        shouldRender: false,
        props: null,
      },
      conversation: {
        shouldRender: false,
        props: null,
      },
      toolExecutionStack: {
        shouldRender: false,
        props: null,
      },
      standaloneActions: {
        shouldRender: false,
        props: null,
      },
    })
    expect(createChatRuntimeConversationThreadBodyMobilePropsParts({
      bodyDisplayMode: "inlineActivity",
      retryStatus: null,
      delegationCard: null,
      toolApproval: null,
      inlineActivity: {
        renderState: "inline-activity-render-state",
        spinnerSource: "spinner-source",
      },
      conversation: threadBodyConversation,
      styles: threadBodyPartsStyles,
    })).toEqual({
      retryStatus: {
        shouldRender: false,
        props: null,
      },
      delegationCard: {
        shouldRender: false,
        props: null,
      },
      toolApproval: {
        shouldRender: false,
        props: null,
      },
      inlineActivity: {
        shouldRender: true,
        props: {
          renderState: "inline-activity-render-state",
          spinnerSource: "spinner-source",
          style: "inline-activity-style",
          spinnerStyle: "inline-activity-spinner-style",
        },
      },
      conversation: {
        shouldRender: false,
        props: null,
      },
      toolExecutionStack: {
        shouldRender: false,
        props: null,
      },
      standaloneActions: {
        shouldRender: false,
        props: null,
      },
    })
    expect(createChatRuntimeConversationThreadBodyMobilePropsParts({
      bodyDisplayMode: "conversation",
      retryStatus: null,
      delegationCard: null,
      toolApproval: null,
      inlineActivity: null,
      conversation: threadBodyConversation,
      styles: threadBodyPartsStyles,
    })).toEqual({
      retryStatus: {
        shouldRender: false,
        props: null,
      },
      delegationCard: {
        shouldRender: false,
        props: null,
      },
      toolApproval: {
        shouldRender: false,
        props: null,
      },
      inlineActivity: {
        shouldRender: false,
        props: null,
      },
      conversation: {
        shouldRender: true,
        props: {
          contentDisplayMode: "expanded",
          shouldRenderActionSlots: true,
          entries: ["message-action"],
          rowStyle: "message-content-row",
          expanded: {
            markdownContent: "expanded message",
            spinnerSource: "spinner-source",
            bodyStyle: "message-content-body",
            streamingStyles: "streaming-content-styles",
          },
          collapsed: {
            renderState: "collapsed-preview",
            onPress: "toggle-preview",
            style: "collapsed-preview-style",
            pressedStyle: "collapsed-preview-pressed-style",
            textStyle: "collapsed-preview-text-style",
          },
        },
      },
      toolExecutionStack: {
        shouldRender: true,
        props: {
          shouldRender: true,
          detailRows: ["tool-detail-row"],
          styles: "tool-execution-stack-styles",
        },
      },
      standaloneActions: {
        shouldRender: true,
        props: {
          shouldRender: true,
          entries: ["standalone-action"],
          rowStyle: "standalone-actions-row",
        },
      },
    })
    const toolActivityGroupBoundaryStyles = createChatMessageToolActivityGroupBoundaryStyles({
      toggleContainerStyle: "toggle-container",
      togglePressedStyle: "toggle-pressed",
      toggleHeaderRowStyle: "toggle-header-row",
      toggleCountBadgeStyle: "toggle-count-badge",
      toggleCountBadgeTextStyle: "toggle-count-badge-text",
      togglePreviewLineStyle: "toggle-preview-line",
      footerButtonStyle: "footer-button",
      footerPressedStyle: "footer-pressed",
      footerTextStyle: "footer-text",
    })
    expect(toolActivityGroupBoundaryStyles).toEqual({
      toggle: {
        container: "toggle-container",
        pressed: "toggle-pressed",
        headerRow: "toggle-header-row",
        countBadge: "toggle-count-badge",
        countBadgeText: "toggle-count-badge-text",
        previewLine: "toggle-preview-line",
      },
      footer: {
        button: "footer-button",
        pressed: "footer-pressed",
        text: "footer-text",
      },
    })
    const toolActivityGroupThreadSurfaceStyles = createChatMessageToolActivityGroupThreadSurfaceStyleSlots({
      surfaceStyle: "thread-surface",
      boundaryStyles: toolActivityGroupBoundaryStyles,
      getToneStyle: (toneStyleSlot: "user" | "assistant") => `tone-${toneStyleSlot}`,
    })
    expect(toolActivityGroupThreadSurfaceStyles.surfaceStyle).toBe("thread-surface")
    expect(toolActivityGroupThreadSurfaceStyles.boundary).toBe(toolActivityGroupBoundaryStyles)
    expect(toolActivityGroupThreadSurfaceStyles.getToneStyle("assistant")).toBe("tone-assistant")
    const actionStyleSlots = createChatMessageActionStyleSlots({
      turnDurationStyles: "turn-duration",
      speechStyles: {
        style: "speech-button",
        activeStyle: "speech-active",
        pressedStyle: "speech-pressed",
      },
      branchStyles: {
        style: "branch-button",
        pressedStyle: "branch-pressed",
        disabledStyle: "branch-disabled",
      },
      copyStyles: {
        style: "copy-button",
        activeStyle: "copy-active",
        pressedStyle: "copy-pressed",
      },
      expansionStyles: {
        style: "expansion-button",
        pressedStyle: "expansion-pressed",
      },
    })
    expect(actionStyleSlots.turnDuration).toBe("turn-duration")
    expect(actionStyleSlots.speech).toEqual({
      hitSlop: getChatMessageActionMobileButtonStatesBySlot().speech.hitSlop,
      style: "speech-button",
      activeStyle: "speech-active",
      pressedStyle: "speech-pressed",
    })
    expect(actionStyleSlots.branch.hitSlop).toEqual(
      getChatMessageActionMobileButtonStatesBySlot().branch.hitSlop,
    )
    expect(actionStyleSlots.copy.hitSlop).toEqual(
      getChatMessageActionMobileButtonStatesBySlot().copy.hitSlop,
    )
    expect(actionStyleSlots.expansion.hitSlop).toEqual(
      getChatMessageActionMobileButtonStatesBySlot().expansion.hitSlop,
    )
    const conversationThreadStyleSlots = createChatMessageConversationThreadStyleSlotsFromStyleSource({
      styles: {
        ...threadBodyStyleSource,
        msg: "message-surface",
        toolActivityGroupCollapsed: "tool-activity-collapsed",
        toolActivityGroupPressed: "tool-activity-pressed",
        toolActivityGroupHeaderRow: "tool-activity-header-row",
        toolActivityGroupCountBadge: "tool-activity-count-badge",
        toolActivityGroupCountBadgeText: "tool-activity-count-badge-text",
        toolActivityGroupPreviewLine: "tool-activity-preview-line",
        toolActivityGroupFooterButton: "tool-activity-footer-button",
        toolActivityGroupFooterText: "tool-activity-footer-text",
        messageTurnDurationBadge: "message-turn-duration-badge",
        messageTurnDurationBadgeLive: "message-turn-duration-badge-live",
        messageTurnDurationText: "message-turn-duration-text",
        messageTurnDurationTextLive: "message-turn-duration-text-live",
        speakButton: "speak-button",
        speakButtonActive: "speak-button-active",
        speakButtonPressed: "speak-button-pressed",
        messageBranchButton: "message-branch-button",
        messageBranchButtonPressed: "message-branch-button-pressed",
        messageBranchButtonDisabled: "message-branch-button-disabled",
        messageCopyButton: "message-copy-button",
        messageCopyButtonCopied: "message-copy-button-copied",
        messageCopyButtonPressed: "message-copy-button-pressed",
        messageExpandButton: "message-expand-button",
        messageExpandButtonPressed: "message-expand-button-pressed",
      },
      getToneStyle: (toneStyleSlot: "user" | "assistant") => `tone-${toneStyleSlot}`,
    })
    expect(conversationThreadStyleSlots.runtimeThread.surface.surfaceStyle).toBe("message-surface")
    expect(
      conversationThreadStyleSlots.runtimeThread.surface.boundary.toggle.container,
    ).toBe("tool-activity-collapsed")
    expect(
      conversationThreadStyleSlots.runtimeThread.surface.boundary.footer.pressed,
    ).toBe("tool-activity-pressed")
    expect(conversationThreadStyleSlots.runtimeThread.surface.getToneStyle("assistant")).toBe(
      "tone-assistant",
    )
    expect(conversationThreadStyleSlots.runtimeThread.body.retryStatus.card).toBe("retryStatusCard")
    expect(conversationThreadStyleSlots.actionSet.turnDuration.style).toBe("message-turn-duration-badge")
    expect(conversationThreadStyleSlots.actionSet.speech.activeStyle).toBe("speak-button-active")
    expect(conversationThreadStyleSlots.actionSet.branch.disabledStyle).toBe(
      "message-branch-button-disabled",
    )
    expect(conversationThreadStyleSlots.actionSet.copy.activeStyle).toBe("message-copy-button-copied")
    expect(conversationThreadStyleSlots.actionSet.expansion.pressedStyle).toBe(
      "message-expand-button-pressed",
    )
    const threadBodyColors = {
      ...messageThreadStyleColors,
      background: "#ffffff",
      destructive: "#dc2626",
      successForeground: "#ecfdf5",
    }
    expect(messageThreadStyle.action.buttons.branch.colors.color).toBe("#2563eb")
    expect(messageThreadStyle.turnDuration.standard).toMatchObject({
      shouldRender: true,
      isLive: false,
      accessibilityRole: "text",
    })
    expect(messageThreadStyle.turnDuration.standard.colors).toEqual(
      getChatMessageActionMobileTurnDurationBadgeColors({}, messageThreadStyleColors),
    )
    expect(messageThreadStyle.turnDuration.live).toMatchObject({
      shouldRender: true,
      isLive: true,
      accessibilityRole: "text",
    })
    expect(messageThreadStyle.turnDuration.live.colors).toEqual(
      getChatMessageActionMobileTurnDurationBadgeColors({ isLive: true }, messageThreadStyleColors),
    )
    const messageDurationStyleSlots = createChatRuntimeTurnDurationMessageMobileStyleSlots({
      renderState: messageThreadStyle.turnDuration.live,
      platform: "ios",
    })
    const messageDurationLiveColors = getChatMessageActionMobileTurnDurationBadgeColors(
      { isLive: true },
      messageThreadStyleColors,
    )
    expect(messageDurationStyleSlots.badge.backgroundColor).toBe(messageDurationLiveColors.backgroundColor)
    expect(messageDurationStyleSlots.badge.alignSelf).toBe(
      CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.alignSelf,
    )
    expect(messageDurationStyleSlots.text.fontFamily).toBe(
      CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION.mobile.turnDurationBadge.fontFamilyByPlatform.ios,
    )
    expect(messageDurationStyleSlots.text.color).toBe(messageDurationLiveColors.color)
    const messageDurationStyleSlotVariants = createChatRuntimeTurnDurationMessageMobileStyleSlotVariants({
      renderState: messageThreadStyle.turnDuration,
      platform: "ios",
    })
    expect(messageDurationStyleSlotVariants.live).toEqual(messageDurationStyleSlots)
    expect(messageDurationStyleSlotVariants.standard.badge.backgroundColor).toBe(
      getChatMessageActionMobileTurnDurationBadgeColors(
        {},
        messageThreadStyleColors,
      ).backgroundColor,
    )
    const successfulConversationMessage = getChatRuntimeConversationMessageMobileRenderState({
      role: "assistant",
      isComplete: true,
      isLast: true,
      content: "Done",
      isExpanded: false,
      shouldCollapse: false,
      isToolOnly: false,
      isLiveStreaming: false,
      toolResults: [{ success: true, content: "ok" }],
      colors: messageThreadStyleColors,
    })
    expect(successfulConversationMessage.tone).toBe("assistant_final")
    const failedConversationMessage = getChatRuntimeConversationMessageMobileRenderState({
      role: "assistant",
      isComplete: true,
      isLast: true,
      content: "Done",
      isExpanded: false,
      shouldCollapse: false,
      isToolOnly: false,
      isLiveStreaming: false,
      toolResults: [{ success: false, content: "", error: "Nope" }],
      colors: messageThreadStyleColors,
    })
    expect(failedConversationMessage.tone).toBe("assistant")
    const conversationMessageActions = getChatRuntimeConversationMessageActionsMobileRenderState({
      message: successfulConversationMessage,
      turnDuration: {
        role: "assistant",
        durationMs: 12_000,
        colors: messageThreadStyleColors,
      },
      speech: {
        role: "assistant",
        content: "Done",
        ttsEnabled: true,
        isSpeaking: false,
        colors: messageThreadStyleColors,
      },
      branch: {
        conversationId: "conversation-1",
        role: "assistant",
        fallbackMessageIndex: 2,
        pendingMessageIndex: null,
        colors: messageThreadStyleColors,
      },
      copy: {
        role: "assistant",
        content: "Done",
        isAssistantComplete: true,
        isCopied: false,
        colors: messageThreadStyleColors,
      },
    })
    expect(conversationMessageActions.speech.canSpeak).toBe(true)
    expect(conversationMessageActions.branch.messageIndex).toBe(2)
    expect(conversationMessageActions.availability.turnDuration.canRender).toBe(false)
    expect(conversationMessageActions.availability.copy.canRender).toBe(true)
    expect(conversationMessageActions.layout.visibleSlots).toEqual([
      "speech",
      "branch",
      "copy",
    ])
    const liveConversationMessageContext = getChatRuntimeConversationMessageRenderContextMobileState({
      message: {
        role: "assistant",
        content: "Working",
      },
      messageIndex: 4,
      isResponding: true,
      lastConversationContentMessageIndex: 4,
      expandedMessages: { 4: true },
      resultOnlyToolLabel: "Tool",
      colors: messageThreadStyleColors,
    })
    expect(liveConversationMessageContext.visibleMessageContent).toBe("Working")
    expect(liveConversationMessageContext.isExpanded).toBe(true)
    expect(liveConversationMessageContext.isLiveStreamingAssistantMessage).toBe(true)
    expect(liveConversationMessageContext.messageRenderState.content.shouldRenderExpandedContent).toBe(true)
    expect(liveConversationMessageContext.shouldRenderSurface).toBe(true)
    let toggledMessageIndex: number | null = null
    const toggleableMessageRenderState = getChatRuntimeConversationMessageMobileRenderState({
      role: "assistant",
      isComplete: false,
      isLast: true,
      toolResults: [],
      content: "Working",
      isExpanded: true,
      shouldCollapse: true,
      isToolOnly: false,
      isLiveStreaming: true,
      colors: messageThreadStyleColors,
    })
    const contentState = getChatRuntimeConversationContentMobileState({
      messageIndex: 4,
      visibleMessageContent: "Working",
      isStreaming: true,
      contentState: liveConversationMessageContext.messageRenderState.content,
      collapsedPreview: toggleableMessageRenderState.collapsedPreview,
      collapsedPreviewAction: toggleableMessageRenderState.collapsedPreviewAction,
      colors: messageThreadStyleColors,
      assetBaseUrl: "http://localhost:3000/assets",
      assetAuthToken: "token",
      spinnerSource: "spinner.gif",
      onToggleMessageExpansion: (messageIndex) => {
        toggledMessageIndex = messageIndex
      },
    })
    expect(contentState.contentState).toMatchObject({
      shouldRenderExpandedContent: true,
      shouldRenderCollapsedTextPreview: false,
    })
    expect(contentState.contentDisplayMode).toBe("expanded")
    expect(contentState.collapsed).toMatchObject({
      renderState: toggleableMessageRenderState.collapsedPreview,
      actionState: toggleableMessageRenderState.collapsedPreviewAction,
    })
    expect(contentState.expanded).toMatchObject({
      streamingRenderState: {
        shouldRender: true,
        content: "Working",
      },
      markdownContent: "Working",
      assetBaseUrl: "http://localhost:3000/assets",
      assetAuthToken: "token",
      spinnerSource: "spinner.gif",
    })
    contentState.collapsed.onPress?.()
    expect(toggledMessageIndex).toBe(4)
    expect(getChatRuntimeConversationRetryStatusMobileState({
      message: {
        variant: "retry",
        retryInfo: {
          attempt: 2,
          maxAttempts: 3,
          delaySeconds: 10,
          reason: "rate_limit",
        },
      },
      colors: {
        warning: "#d97706",
        mutedForeground: "#64748b",
      },
    })).toMatchObject({
      renderState: {
        shouldRender: true,
        attemptLabel: "Attempt 2/3",
        countdownLabel: "Retrying in 10s",
      },
    })
    const approvalResponses: Array<{ approvalId: string; approved: boolean }> = []
    const approvalState = getChatRuntimeConversationToolApprovalMobileState({
      message: {
        variant: "approval",
        toolApproval: {
          approvalId: "approval-1",
          toolName: "write_file",
          arguments: { path: "/tmp/file" },
        },
      },
      expandedToolApprovals: {},
      pendingApprovalResponseId: null,
      colors: {
        warning: "#d97706",
        foreground: "#0f172a",
        mutedForeground: "#64748b",
        background: "#ffffff",
        success: "#16a34a",
        successForeground: "#ecfdf5",
        destructive: "#dc2626",
      },
      onToggleArguments: () => {},
      onRespondToToolApproval: (approvalId, approved) => {
        approvalResponses.push({ approvalId, approved })
      },
    })
    expect(approvalState).toMatchObject({
      cardState: {
        approvalId: "approval-1",
        toolName: "write_file",
      },
    })
    approvalState.cardState?.onDeny()
    approvalState.cardState?.onApprove()
    expect(approvalResponses).toEqual([
      { approvalId: "approval-1", approved: false },
      { approvalId: "approval-1", approved: true },
    ])
    let expandedDelegationConversationPreviews: Record<string, boolean> = {}
    let expandedDelegationToolPreviews: Record<string, boolean> = {}
    const delegationColors = {
      info: "#2563eb",
      foreground: "#0f172a",
      mutedForeground: "#64748b",
      warning: "#d97706",
      success: "#16a34a",
      destructive: "#dc2626",
    }
    const delegationCardState = getChatRuntimeConversationDelegationCardMobileState({
      message: {
        variant: "delegation",
        delegation: {
          runId: "run-1",
        },
      },
      surface: getChatRuntimeDelegationCardMobileState(),
      toolEntries: [],
      displayToolCallCount: 0,
      expandedDelegationConversationPreviews,
      expandedDelegationToolPreviews,
      roleStyles: getChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots(delegationColors),
      colors: delegationColors,
      setExpandedDelegationConversationPreviews: (updater) => {
        expandedDelegationConversationPreviews = updater(expandedDelegationConversationPreviews)
      },
      setExpandedDelegationToolPreviews: (updater) => {
        expandedDelegationToolPreviews = updater(expandedDelegationToolPreviews)
      },
    })
    expect(delegationCardState).toMatchObject({
      isDelegation: true,
      delegation: {
        runId: "run-1",
      },
    })
    const delegationProgress = {
      runId: "run-1",
      agentName: "Worker",
      task: "Inspect files",
      status: "running" as const,
      startTime: 1_700_000_000_000,
      conversation: [{
        role: "assistant" as const,
        content: "Looking through the changed files.",
        timestamp: 1_700_000_010_000,
      }],
    }
    const delegationToolEntries = [{
      toolCall: { name: "read_file", arguments: { path: "/tmp/file.ts" } },
      label: "read_file:/tmp/file.ts",
      origIdx: 0,
      result: { success: true, content: "ok" },
    }]
    const delegationPresentationState = getChatRuntimeDelegationCardMobilePresentationState({
      ...delegationCardState,
      delegation: delegationProgress,
      toolEntries: delegationToolEntries,
      displayToolCallCount: 1,
    })
    expect(delegationPresentationState).toMatchObject({
      runId: "run-1",
      agentName: "Worker",
      messageCountLabel: "1m",
      conversationPreview: {
        hiddenCount: 0,
        rows: [{
          role: "assistant",
          content: "Looking through the changed files.",
        }],
      },
      toolPreview: {
        shouldRender: true,
        label: "Tool activity · 1 tool call",
        hiddenCount: 0,
        rows: [{
          preview: "read_file:/tmp/file.ts",
          renderState: {
            state: "success",
          },
        }],
      },
    })
    expect(delegationPresentationState?.accessibilityLabel).toContain("Worker")
    expect(delegationPresentationState?.statusStyles.text.color).toBe("#2563eb")
    const delegationPropEvents: string[] = []
    const delegationCardProps = createChatRuntimeDelegationCardMobileProps({
      ...delegationCardState,
      delegation: delegationProgress,
      toolEntries: delegationToolEntries,
      displayToolCallCount: 1,
      onShowAllConversationPreview: (runId) => {
        delegationPropEvents.push(`conversation:${runId}`)
      },
      onShowAllToolPreview: (runId) => {
        delegationPropEvents.push(`tools:${runId}`)
      },
    })
    expect(delegationCardProps?.runId).toBe("run-1")
    expect(delegationCardProps?.conversationPreview.rows[0]?.content).toBe("Looking through the changed files.")
    delegationCardProps?.conversationPreview.onShowAll?.()
    delegationCardProps?.toolPreview.onShowAll?.()
    expect(delegationPropEvents).toEqual(["conversation:run-1", "tools:run-1"])
    if (!delegationCardProps) {
      throw new Error("Expected delegation card props")
    }
    delegationPropEvents.length = 0
    const delegationCardParts = createChatRuntimeDelegationCardMobilePropsParts({
      ...delegationCardProps,
      conversationPreview: {
        ...delegationCardProps.conversationPreview,
        hiddenCount: 2,
      },
      toolPreview: {
        ...delegationCardProps.toolPreview,
        hiddenCount: 3,
      },
      styles: {
        card: "delegation-card-style",
        header: "delegation-header-style",
        title: "delegation-title-style",
        statusBadge: "delegation-status-badge-style",
        statusText: "delegation-status-text-style",
        liveText: "delegation-live-text-style",
        subtitle: "delegation-subtitle-style",
        metaRow: "delegation-meta-row-style",
        metaText: "delegation-meta-text-style",
        conversationPreview: "delegation-conversation-preview-style",
        conversationPreviewLine: "delegation-conversation-preview-line-style",
        conversationPreviewRole: "delegation-conversation-preview-role-style",
        conversationPreviewContent: "delegation-conversation-preview-content-style",
        conversationPreviewTimestamp: "delegation-conversation-preview-timestamp-style",
        conversationPreviewMoreButton: "delegation-conversation-preview-more-button-style",
        conversationPreviewMoreButtonPressed: "delegation-conversation-preview-more-button-pressed-style",
        conversationPreviewMore: "delegation-conversation-preview-more-style",
        toolPreview: "delegation-tool-preview-style",
        toolPreviewLabel: "delegation-tool-preview-label-style",
        toolPreviewLine: "delegation-tool-preview-line-style",
        toolPreviewStatusIcon: "delegation-tool-preview-status-icon-style",
        toolPreviewName: "delegation-tool-preview-name-style",
        toolPreviewNamePending: "delegation-tool-preview-name-pending-style",
        toolPreviewNameSuccess: "delegation-tool-preview-name-success-style",
        toolPreviewNameError: "delegation-tool-preview-name-error-style",
        toolPreviewMoreButton: "delegation-tool-preview-more-button-style",
        toolPreviewMoreButtonPressed: "delegation-tool-preview-more-button-pressed-style",
        toolPreviewMore: "delegation-tool-preview-more-style",
      },
    })
    expect(delegationCardParts.card.props).toEqual({
      accessible: true,
      accessibilityRole: delegationCardProps.surface.accessibilityRole,
      accessibilityLabel: delegationCardProps.accessibilityLabel,
      style: "delegation-card-style",
    })
    const delegationCardContent = delegationCardParts.card.content
    expect(delegationCardContent.header.props.container).toEqual({
      props: {
        style: "delegation-header-style",
      },
    })
    expect(delegationCardContent.header.props.title).toEqual({
      props: {
        style: "delegation-title-style",
        numberOfLines: delegationCardProps.surface.titleNumberOfLines,
      },
      text: "Worker",
    })
    expect(delegationCardContent.header.props.statusBadge.props.style).toEqual([
      "delegation-status-badge-style",
      delegationCardProps.statusStyles.chip,
    ])
    expect(delegationCardContent.header.props.statusText).toEqual({
      props: {
        style: [
          "delegation-status-text-style",
          delegationCardProps.statusStyles.text,
        ],
        numberOfLines: delegationCardProps.surface.statusNumberOfLines,
      },
      text: delegationCardProps.presentation.statusLabel,
    })
    expect(delegationCardContent.header.props.liveText).toEqual({
      shouldRender: true,
      props: {
        style: "delegation-live-text-style",
      },
      text: delegationCardProps.surface.liveLabel,
    })
    expect(delegationCardContent.subtitle).toEqual({
      shouldRender: true,
      props: {
        props: {
          style: "delegation-subtitle-style",
          numberOfLines: delegationCardProps.surface.subtitleNumberOfLines,
        },
        text: delegationCardProps.presentation.subtitle,
      },
    })
    expect(delegationCardContent.meta.props.items.map((item) => item.props.text)).toEqual([
      delegationCardProps.presentation.sourceLabel,
      delegationCardProps.presentation.trackingLabel,
      delegationCardProps.messageCountLabel,
    ].filter(Boolean))
    expect(delegationCardContent.meta.props.container).toEqual({
      props: {
        style: "delegation-meta-row-style",
      },
    })
    expect(delegationCardContent.meta.props.items[0]).toMatchObject({
      key: "source",
      props: {
        props: {
          style: "delegation-meta-text-style",
          numberOfLines: delegationCardProps.surface.metaNumberOfLines,
        },
      },
    })
    const delegationConversationPreviewRow = delegationCardProps.conversationPreview.rows[0]
    if (!delegationConversationPreviewRow) {
      throw new Error("Expected a delegation conversation preview row")
    }
    expect(delegationCardContent.conversationPreview.shouldRender).toBe(true)
    expect(delegationCardContent.conversationPreview.props.container).toEqual({
      props: {
        style: "delegation-conversation-preview-style",
      },
      content: expect.any(Object),
    })
    const delegationConversationPreviewContent =
      delegationCardContent.conversationPreview.props.container.content
    const delegationConversationPreviewRowParts = delegationConversationPreviewContent.rows[0]
    if (!delegationConversationPreviewRowParts) {
      throw new Error("Expected delegation conversation preview row parts")
    }
    expect(delegationConversationPreviewRowParts).toMatchObject({
      key: `${delegationConversationPreviewRow.timestamp}-${delegationConversationPreviewRow.role}-0`,
      props: {
        line: {
          props: {
            style: "delegation-conversation-preview-line-style",
          },
        },
        role: {
          props: {
            style: [
              "delegation-conversation-preview-role-style",
              delegationCardProps.conversationPreview.roleStyles.assistant,
            ],
            numberOfLines: delegationCardProps.surface.conversationPreviewRoleNumberOfLines,
            ellipsizeMode: delegationCardProps.surface.conversationPreviewRoleEllipsizeMode,
          },
          text: delegationConversationPreviewRow.roleLabel,
        },
        content: {
          props: {
            style: "delegation-conversation-preview-content-style",
            numberOfLines: delegationCardProps.surface.conversationPreviewContentNumberOfLines,
            ellipsizeMode: delegationCardProps.surface.conversationPreviewContentEllipsizeMode,
          },
          text: delegationConversationPreviewRow.content,
        },
      },
    })
    expect(delegationConversationPreviewRowParts.props.timestamp.shouldRender).toBe(true)
    if (!delegationConversationPreviewRowParts.props.timestamp.shouldRender) {
      throw new Error("Expected delegation conversation preview timestamp parts")
    }
    expect(delegationConversationPreviewRowParts.props.timestamp).toMatchObject({
      props: {
        style: "delegation-conversation-preview-timestamp-style",
        numberOfLines: delegationCardProps.surface.conversationPreviewTimestampNumberOfLines,
      },
      text: delegationConversationPreviewRow.timestampLabel,
    })
    expect(delegationConversationPreviewContent.moreAction.shouldRender).toBe(true)
    if (!delegationConversationPreviewContent.moreAction.shouldRender) {
      throw new Error("Expected delegation conversation preview more action")
    }
    expect(delegationConversationPreviewContent.moreAction.props.button.props.style({ pressed: true })).toEqual([
      "delegation-conversation-preview-more-button-style",
      "delegation-conversation-preview-more-button-pressed-style",
    ])
    expect(delegationConversationPreviewContent.moreAction.props.label.props).toEqual({
      style: "delegation-conversation-preview-more-style",
      numberOfLines: delegationCardProps.conversationPreview.moreAction.numberOfLines,
    })
    delegationConversationPreviewContent.moreAction.props.button.props.onPress()
    expect(delegationCardContent.toolPreview.shouldRender).toBe(true)
    expect(delegationCardContent.toolPreview.props.container).toEqual({
      props: {
        style: "delegation-tool-preview-style",
      },
      content: expect.any(Object),
    })
    const delegationToolPreviewContent =
      delegationCardContent.toolPreview.props.container.content
    expect(delegationToolPreviewContent.label.props).toMatchObject({
      props: {
        style: "delegation-tool-preview-label-style",
        numberOfLines: delegationCardProps.surface.toolPreviewLabelNumberOfLines,
      },
      text: "Tool activity · 1 tool call",
    })
    const delegationToolPreviewRow = delegationCardProps.toolPreview.rows[0]
    if (!delegationToolPreviewRow) {
      throw new Error("Expected a delegation tool preview row")
    }
    expect(delegationToolPreviewContent.rows[0]).toMatchObject({
      key: delegationToolPreviewRow.key,
      props: {
        line: {
          props: {
            style: "delegation-tool-preview-line-style",
            accessibilityLabel: delegationToolPreviewRow.renderState.accessibilityLabel,
          },
        },
        statusIcon: {
          props: {
            style: "delegation-tool-preview-status-icon-style",
            accessibilityElementsHidden: true,
            importantForAccessibility: "no-hide-descendants",
          },
          spinner: {
            shouldRender: false,
            props: {
              size: delegationToolPreviewRow.renderState.statusIndicator.spinner.size,
              color: delegationToolPreviewRow.renderState.statusIndicator.spinner.color,
            },
          },
          icon: {
            shouldRender: true,
            props: {
              name: delegationToolPreviewRow.renderState.statusIndicator.icon.name,
              size: delegationToolPreviewRow.renderState.statusIndicator.icon.size,
              color: delegationToolPreviewRow.renderState.statusIndicator.icon.color,
            },
          },
        },
        name: {
          props: {
            style: [
              "delegation-tool-preview-name-style",
              false,
              "delegation-tool-preview-name-success-style",
              false,
            ],
            numberOfLines: delegationToolPreviewRow.renderState.name.numberOfLines,
            ellipsizeMode: delegationToolPreviewRow.renderState.name.ellipsizeMode,
          },
          text: delegationToolPreviewRow.preview,
        },
      },
    })
    expect(delegationToolPreviewContent.moreAction.shouldRender).toBe(true)
    if (!delegationToolPreviewContent.moreAction.shouldRender) {
      throw new Error("Expected delegation tool preview more action")
    }
    expect(delegationToolPreviewContent.moreAction.props.button.props.style({ pressed: true })).toEqual([
      "delegation-tool-preview-more-button-style",
      "delegation-tool-preview-more-button-pressed-style",
    ])
    expect(delegationToolPreviewContent.moreAction.props.label.props).toEqual({
      style: "delegation-tool-preview-more-style",
      numberOfLines: delegationCardProps.toolPreview.moreAction.numberOfLines,
    })
    delegationToolPreviewContent.moreAction.props.button.props.onPress()
    expect(delegationPropEvents).toEqual(["conversation:run-1", "tools:run-1"])
    delegationCardState.onShowAllConversationPreview("run-1")
    delegationCardState.onShowAllToolPreview("run-2")
    expect(expandedDelegationConversationPreviews).toEqual({ "run-1": true })
    expect(expandedDelegationToolPreviews).toEqual({ "run-2": true })
    const actionEvents: string[] = []
    const actionMessageRenderState = getChatRuntimeConversationMessageMobileRenderState({
      role: "assistant",
      isComplete: true,
      isLast: true,
      content: "Working",
      isExpanded: false,
      shouldCollapse: false,
      isToolOnly: false,
      isLiveStreaming: false,
      toolResults: [],
      colors: messageThreadStyleColors,
    })
    const actionSetState = getChatRuntimeConversationActionSetMobileState({
      message: {
        role: "assistant",
        branchMessageIndex: 3,
      },
      messageRenderState: actionMessageRenderState,
      messageIndex: 4,
      visibleMessageContent: "Working",
      turnDuration: {
        durationMs: 12000,
        isLive: true,
      },
      conversationId: "conversation-1",
      pendingBranchMessageIndex: null,
      isResponding: false,
      isSpeaking: false,
      isCopied: false,
      ttsEnabled: true,
      colors: messageThreadStyleColors,
      styles: {
        turnDuration: { styleId: "duration" },
        speech: { styleId: "speech" },
        branch: { styleId: "branch" },
        copy: { styleId: "copy" },
        expansion: { styleId: "expansion" },
      },
      onSpeakMessage: (messageIndex, content) => {
        actionEvents.push(`speak:${messageIndex}:${content}`)
      },
      onBranchMessage: (messageIndex) => {
        actionEvents.push(`branch:${messageIndex}`)
      },
      onCopyMessage: (messageIndex, content) => {
        actionEvents.push(`copy:${messageIndex}:${content}`)
      },
      onToggleMessageExpansion: (messageIndex) => {
        actionEvents.push(`expand:${messageIndex}`)
      },
    })
    expect(actionSetState).toMatchObject({
      renderState: {
        speech: {
          canSpeak: true,
        },
        branch: {
          messageIndex: 3,
        },
        copy: {
          canCopy: true,
        },
        layout: {
          visibleSlots: ["speech", "branch", "copy"],
        },
      },
      turnDuration: {
        role: "assistant",
        durationMs: 12000,
        isLive: true,
        styleId: "duration",
      },
      speech: {
        role: "assistant",
        content: "Working",
        ttsEnabled: true,
        styleId: "speech",
      },
      branch: {
        conversationId: "conversation-1",
        branchMessageIndex: 3,
        fallbackMessageIndex: 4,
        pendingMessageIndex: null,
        onPress: expect.any(Function),
        styleId: "branch",
      },
      copy: {
        content: "Working",
        isAssistantComplete: true,
        isCopied: false,
        styleId: "copy",
      },
      expansion: {
        styleId: "expansion",
      },
    })
    actionSetState.speech.onPress()
    actionSetState.branch.onPress()
    actionSetState.copy.onPress()
    actionSetState.expansion.onPress()
    expect(actionEvents).toEqual([
      "speak:4:Working",
      "branch:3",
      "copy:4:Working",
      "expand:4",
    ])
    const actionComponentProps = createChatRuntimeConversationActionComponentsMobileProps({
      renderState: actionSetState.renderState,
      turnDuration: actionSetState.turnDuration,
      speech: actionSetState.speech,
      branch: actionSetState.branch,
      copy: actionSetState.copy,
      expansion: actionSetState.expansion,
    })
    expect(actionComponentProps).toMatchObject({
      availability: actionSetState.renderState.availability,
      turnDuration: {
        renderState: actionSetState.renderState.turnDuration,
      },
      speech: {
        renderState: actionSetState.renderState.speech,
        isActive: false,
      },
      branch: {
        renderState: actionSetState.renderState.branch,
      },
      copy: {
        renderState: actionSetState.renderState.copy,
        isActive: false,
      },
      expansion: {
        renderState: actionSetState.renderState.expansion,
      },
    })
    expect(actionComponentProps.speech).not.toHaveProperty("isSpeaking")
    expect(actionComponentProps.copy).not.toHaveProperty("isCopied")
    const actionSetProps = createChatRuntimeConversationActionSetMobileProps({
      renderState: actionSetState.renderState,
      components: {
        turnDuration: "duration",
        speech: "speech",
        branch: "branch",
        copy: "copy",
        expansion: "expansion",
      },
    })
    expect(actionSetProps).toMatchObject({
      shouldRenderActionSlots: true,
      shouldRenderStandaloneActions: false,
      entries: [
        { slot: "speech", item: "speech" },
        { slot: "branch", item: "branch" },
        { slot: "copy", item: "copy" },
      ],
    })
    expect(createChatRuntimeMessageActionIconButtonMobileProps({
      spec: {
        renderState: {
          isDisabled: true,
          accessibilityRole: "button",
          accessibilityLabel: "Copy message",
          accessibilityHint: null,
          accessibilityState: { disabled: true },
          ariaExpanded: false,
          icon: {
            name: "copy",
            size: 16,
            color: "#ffffff",
          },
        },
        onPress: "press-action",
        hitSlop: 8,
        style: "button-style",
        activeStyle: "button-active-style",
        pressedStyle: "button-pressed-style",
        disabledStyle: "button-disabled-style",
        isActive: true,
      },
    })).toEqual({
      onPress: "press-action",
      disabled: true,
      accessibilityRole: "button",
      accessibilityLabel: "Copy message",
      accessibilityHint: undefined,
      accessibilityState: { disabled: true },
      ariaExpanded: false,
      hitSlop: 8,
      style: "button-style",
      activeStyle: "button-active-style",
      pressedStyle: "button-pressed-style",
      disabledStyle: "button-disabled-style",
      isActive: true,
      icon: {
        name: "copy",
        size: 16,
        color: "#ffffff",
      },
    })
    const actionIconButtonParts = createChatRuntimeMessageActionIconButtonMobilePropsParts({
      icon: {
        name: "copy",
        size: 16,
        color: "#ffffff",
      },
      onPress: "press-action",
      isActive: true,
      accessibilityRole: "button",
      accessibilityLabel: "Copy message",
      accessibilityHint: null,
      accessibilityState: { selected: true },
      ariaExpanded: false,
      hitSlop: 8,
      style: "button-style",
      activeStyle: "button-active-style",
      pressedStyle: "button-pressed-style",
      disabledStyle: "button-disabled-style",
    })
    expect(actionIconButtonParts.pressable.props).toMatchObject({
      onPress: "press-action",
      disabled: false,
      accessibilityRole: "button",
      accessibilityLabel: "Copy message",
      accessibilityHint: undefined,
      accessibilityState: { selected: true },
      "aria-expanded": false,
      hitSlop: 8,
    })
    expect(actionIconButtonParts.pressable.props.style({ pressed: false })).toEqual([
      "button-style",
      "button-active-style",
      false,
      false,
    ])
    expect(actionIconButtonParts.pressable.props.style({ pressed: true })).toEqual([
      "button-style",
      "button-active-style",
      "button-pressed-style",
      false,
    ])
    expect(actionIconButtonParts.pressable.content.activityIndicator).toEqual({
      shouldRender: false,
      props: {
        size: 16,
        color: "#ffffff",
      },
    })
    expect(actionIconButtonParts.pressable.content.icon).toEqual({
      shouldRender: true,
      props: {
        name: "copy",
        size: 16,
        color: "#ffffff",
      },
    })
    const disabledActionIconButtonParts = createChatRuntimeMessageActionIconButtonMobilePropsParts({
      icon: {
        name: "sync",
        size: 12,
        color: "#999999",
        isPending: true,
      },
      disabled: true,
      accessibilityRole: "button",
      accessibilityLabel: "Processing",
      accessibilityState: { busy: true },
      style: "button-style",
      pressedStyle: "button-pressed-style",
      disabledStyle: "button-disabled-style",
    })
    expect(disabledActionIconButtonParts.pressable.props.accessibilityState).toEqual({
      busy: true,
      disabled: true,
    })
    expect(disabledActionIconButtonParts.pressable.props.style({ pressed: true })).toEqual([
      "button-style",
      false,
      false,
      "button-disabled-style",
    ])
    expect(disabledActionIconButtonParts.pressable.content.activityIndicator).toEqual({
      shouldRender: true,
      props: {
        size: 12,
        color: "#999999",
      },
    })
    expect(disabledActionIconButtonParts.pressable.content.icon).toEqual({
      shouldRender: false,
      props: {
        name: "sync",
        size: 12,
        color: "#999999",
      },
    })
    expect(createChatRuntimeMessageActionSlotListMobilePropsParts({
      entries: actionSetProps.entries,
      rowStyle: "action-row-style",
    })).toEqual({
      shouldRenderList: true,
      items: [
        { key: "speech", item: "speech" },
        { key: "branch", item: "branch" },
        { key: "copy", item: "copy" },
      ],
      row: {
        shouldRender: true,
        props: {
          style: "action-row-style",
        },
      },
    })
    expect(createChatRuntimeMessageActionSlotListMobilePropsParts({
      shouldRender: false,
      entries: actionSetProps.entries,
    })).toEqual({
      shouldRenderList: false,
      items: [
        { key: "speech", item: "speech" },
        { key: "branch", item: "branch" },
        { key: "copy", item: "copy" },
      ],
      row: {
        shouldRender: false,
        props: null,
      },
    })
    expect(createChatRuntimeMessageSurfaceMobilePropsParts({
      style: "message-surface-style",
      toneStyle: "message-surface-tone-style",
    })).toEqual({
      container: {
        props: {
          style: [
            "message-surface-style",
            "message-surface-tone-style",
          ],
        },
      },
    })
    expect(createChatRuntimeMessageThreadItemMobilePropsParts({
      leadingActivity: "leading-activity",
      trailingActivity: "trailing-activity",
    })).toEqual({
      props: {
        leadingActivity: "leading-activity",
        trailingActivity: "trailing-activity",
      },
    })
    expect(createChatRuntimeMessageThreadSurfaceMobilePropsParts({
      leadingActivity: "leading-activity",
      trailingActivity: "trailing-activity",
      surfaceStyle: "message-surface-style",
      surfaceToneStyle: "message-surface-tone-style",
    })).toEqual({
      item: {
        props: {
          leadingActivity: "leading-activity",
          trailingActivity: "trailing-activity",
        },
      },
      surface: {
        props: {
          style: "message-surface-style",
          toneStyle: "message-surface-tone-style",
        },
      },
    })
    expect(createChatRuntimeMessageContentRowMobilePropsParts({
      shouldRenderActionSlots: true,
      entries: actionSetProps.entries,
      rowStyle: "content-row-style",
      bodyStyle: "content-body-style",
    })).toEqual({
      row: {
        props: {
          style: "content-row-style",
        },
      },
      body: {
        shouldRender: true,
        props: {
          style: "content-body-style",
        },
      },
      actionSlotList: {
        props: {
          shouldRender: true,
          entries: actionSetProps.entries,
        },
      },
    })
    expect(createChatRuntimeMessageContentRowMobilePropsParts({
      shouldRenderActionSlots: false,
      entries: actionSetProps.entries,
      rowStyle: "content-row-style",
    })).toEqual({
      row: {
        props: {
          style: "content-row-style",
        },
      },
      body: {
        shouldRender: false,
        props: {
          style: undefined,
        },
      },
      actionSlotList: {
        props: {
          shouldRender: false,
          entries: actionSetProps.entries,
        },
      },
    })
    expect(createChatRuntimeMessageStandaloneActionsMobilePropsParts({
      shouldRender: true,
      entries: actionSetProps.entries,
      rowStyle: "standalone-row-style",
    })).toEqual({
      actionSlotList: {
        props: {
          shouldRender: true,
          entries: actionSetProps.entries,
          rowStyle: "standalone-row-style",
        },
      },
    })
    expect(createChatRuntimeMessageStandaloneActionsMobilePropsParts({
      shouldRender: false,
      entries: actionSetProps.entries,
      rowStyle: "standalone-row-style",
    })).toEqual({
      actionSlotList: {
        props: {
          shouldRender: false,
          entries: actionSetProps.entries,
          rowStyle: "standalone-row-style",
        },
      },
    })
    const toolExecutionStackEvents: string[] = []
    const toolExecutionPresentation = getChatRuntimeMessageThreadPresentationMobileRenderState({
      colors: threadBodyColors,
    })
    const conversationToolExecutionStackState = getChatRuntimeConversationToolExecutionStackMobileState({
      message: {
        id: null,
      },
      messageIndex: 4,
      displayToolCallCount: 1,
      renderedToolEntries: [{
        toolCall: {
          name: "read_file",
          arguments: { path: "/tmp/file" },
        },
        label: "read_file",
        origIdx: 2,
        result: null,
      }],
      isExpanded: false,
      expandedToolCalls: { "4-2": true },
      previewNumberOfLines: 2,
      pendingResultRenderState: toolExecutionPresentation.pendingToolResultRenderState,
      emptyStateRenderState: toolExecutionPresentation.toolExecutionEmptyStateRenderState,
      colors: {
        info: "#0ea5e9",
        success: "#16a34a",
        destructive: "#dc2626",
        mutedForeground: "#64748b",
      },
      onToggleToolCall: (stableMessageKey, toolEntryIndex) => {
        toolExecutionStackEvents.push(`tool:${stableMessageKey}:${toolEntryIndex}`)
      },
      onCopyPayload: (content) => {
        toolExecutionStackEvents.push(`copy-payload:${content}`)
      },
      onToggleMessageExpansion: (messageIndex) => {
        toolExecutionStackEvents.push(`toggle-message:${messageIndex}`)
      },
    })
    expect(conversationToolExecutionStackState).toMatchObject({
      displayToolCallCount: 1,
      isExpanded: false,
      renderState: {
        shouldRender: true,
      },
    })
    expect(conversationToolExecutionStackState.compactRows).toHaveLength(1)
    expect(conversationToolExecutionStackState.detailRows).toHaveLength(1)
    expect(conversationToolExecutionStackState.detailRows[0]).toMatchObject({
      key: "4-2",
      toolName: "read_file",
      pendingResult: {
        renderState: toolExecutionPresentation.pendingToolResultRenderState,
      },
    })
    const toolExecutionStackProps = createChatRuntimeConversationToolExecutionStackMobileProps(
      conversationToolExecutionStackState,
    )
    expect(toolExecutionStackProps).toMatchObject({
      shouldRender: true,
      isExpanded: false,
      compact: {
        rows: conversationToolExecutionStackState.compactRows,
      },
      detailRows: conversationToolExecutionStackState.detailRows,
    })
    const conversationBodyProps = createChatRuntimeConversationBodyMobileProps({
      contentDisplayMode: contentState.contentDisplayMode,
      actionSet: actionSetProps,
      expanded: contentState.expanded,
      collapsed: contentState.collapsed,
      toolExecutionStack: conversationToolExecutionStackState,
    })
    expect(conversationBodyProps).toMatchObject({
      content: {
        contentDisplayMode: "expanded",
        shouldRenderActionSlots: true,
        entries: actionSetProps.entries,
        expanded: {
          markdownContent: "Working",
        },
      },
      standaloneActions: {
        shouldRender: false,
        entries: actionSetProps.entries,
      },
      toolExecutionStack: {
        shouldRender: true,
        detailRows: conversationToolExecutionStackState.detailRows,
      },
    })
    const threadBodyProps = createChatRuntimeConversationThreadBodyMobileProps({
      bodyDisplayMode: "delegationCard",
      retryStatus: {
        renderState: null,
      },
      delegationCard: {
        ...delegationCardState,
        delegation: delegationProgress,
        toolEntries: delegationToolEntries,
        displayToolCallCount: 1,
      },
      toolApproval: approvalState,
      inlineActivity: null,
      conversation: conversationBodyProps,
    })
    expect(threadBodyProps).toMatchObject({
      bodyDisplayMode: "delegationCard",
      retryStatus: null,
      delegationCard: {
        runId: "run-1",
      },
      toolApproval: {
        toolName: "write_file",
      },
      inlineActivity: null,
      conversation: conversationBodyProps,
    })
    const threadBodyPropsFromActionInput = createChatRuntimeConversationThreadBodyMobilePropsFromActionInput({
      bodyDisplayMode: "delegationCard",
      retryStatus: {
        renderState: null,
      },
      delegationCard: {
        ...delegationCardState,
        delegation: delegationProgress,
        toolEntries: delegationToolEntries,
        displayToolCallCount: 1,
      },
      toolApproval: approvalState,
      inlineActivity: null,
      conversation: {
        contentDisplayMode: contentState.contentDisplayMode,
        actionSet: "action-input",
        expanded: contentState.expanded,
        collapsed: contentState.collapsed,
        toolExecutionStack: conversationToolExecutionStackState,
      },
      createActionSet: (actionInput) => {
        expect(actionInput).toBe("action-input")
        return actionSetProps
      },
    })
    expect(threadBodyPropsFromActionInput).toMatchObject({
      bodyDisplayMode: threadBodyProps.bodyDisplayMode,
      retryStatus: threadBodyProps.retryStatus,
      delegationCard: {
        runId: "run-1",
      },
      toolApproval: {
        toolName: "write_file",
      },
      inlineActivity: null,
      conversation: {
        content: {
          contentDisplayMode: "expanded",
          shouldRenderActionSlots: true,
          entries: actionSetProps.entries,
          expanded: {
            markdownContent: "Working",
          },
        },
        standaloneActions: {
          shouldRender: false,
          entries: actionSetProps.entries,
        },
        toolExecutionStack: {
          shouldRender: true,
          detailRows: conversationToolExecutionStackState.detailRows,
        },
      },
    })
    conversationToolExecutionStackState.detailRows[0].onHeaderPress()
    conversationToolExecutionStackState.detailRows[0].input?.onCopyPress()
    conversationToolExecutionStackState.compact.onToggle()
    conversationToolExecutionStackState.expanded.onToggle()
    toolExecutionStackProps.compact.onPress()
    toolExecutionStackProps.expanded.onCollapsePress()
    expect(toolExecutionStackEvents).toEqual([
      "tool:4:2",
      "copy-payload:{\n  \"path\": \"/tmp/file\"\n}",
      "toggle-message:4",
      "toggle-message:4",
      "toggle-message:4",
      "toggle-message:4",
    ])
    const turnDurationsByUserTimestamp = new Map([
      [10, { durationMs: 12000, isLive: true }],
    ])
    expect(getChatRuntimeConversationTurnDurationMobileState({
      message: {
        timestamp: 10,
      },
      byUserTimestamp: turnDurationsByUserTimestamp,
    })).toEqual({ durationMs: 12000, isLive: true })
    expect(getChatRuntimeConversationTurnDurationMobileState({
      message: {},
      byUserTimestamp: turnDurationsByUserTimestamp,
    })).toBeUndefined()
    let bodyExpandedDelegationConversationPreviews: Record<string, boolean> = {}
    let bodyExpandedDelegationToolPreviews: Record<string, boolean> = {}
    const bodyEvents: string[] = []
    const threadBodyPresentation = getChatRuntimeMessageThreadPresentationMobileRenderState({
      colors: threadBodyColors,
    })
    const threadBodyState = getChatRuntimeConversationThreadBodyMobileState({
      message: {
        id: "message-1",
        role: "assistant",
        content: "Working",
        timestamp: 10,
        branchMessageIndex: 3,
      },
      messageIndex: 4,
      renderContext: {
        visibleMessageContent: "Working",
        renderedToolEntries: [{
          toolCall: {
            name: "read_file",
            arguments: { path: "/tmp/file" },
          },
          label: "read_file",
          origIdx: 2,
          result: null,
        }],
        displayToolCallCount: 1,
        isExpanded: false,
        isLiveStreamingAssistantMessage: false,
        messageRenderState: successfulConversationMessage,
        shouldRenderSurface: true,
      },
      turnDurationsByUserTimestamp,
      conversationId: "conversation-1",
      pendingBranchMessageIndex: null,
      isResponding: false,
      isSpeaking: false,
      isCopied: false,
      ttsEnabled: true,
      colors: threadBodyColors,
      actionStyles: {
        turnDuration: { styleId: "duration" },
        speech: { styleId: "speech" },
        branch: { styleId: "branch" },
        copy: { styleId: "copy" },
        expansion: { styleId: "expansion" },
      },
      assetBaseUrl: "https://assets.local",
      assetAuthToken: "asset-token",
      spinnerSource: "spinner",
      presentation: threadBodyPresentation,
      expandedDelegationConversationPreviews: bodyExpandedDelegationConversationPreviews,
      expandedDelegationToolPreviews: bodyExpandedDelegationToolPreviews,
      setExpandedDelegationConversationPreviews: (updater) => {
        bodyExpandedDelegationConversationPreviews = updater(bodyExpandedDelegationConversationPreviews)
      },
      setExpandedDelegationToolPreviews: (updater) => {
        bodyExpandedDelegationToolPreviews = updater(bodyExpandedDelegationToolPreviews)
      },
      expandedToolApprovals: {},
      pendingApprovalResponseId: null,
      onToggleToolApprovalArguments: (approvalId) => {
        bodyEvents.push(`approval:${approvalId}`)
      },
      onRespondToToolApproval: (approvalId, approved) => {
        bodyEvents.push(`approval-response:${approvalId}:${approved}`)
      },
      expandedToolCalls: {},
      onToggleToolCall: (stableMessageKey, toolEntryIndex) => {
        bodyEvents.push(`tool:${stableMessageKey}:${toolEntryIndex}`)
      },
      onCopyToolPayload: (content) => {
        bodyEvents.push(`payload:${content}`)
      },
      onSpeakMessage: (messageIndex, content) => {
        bodyEvents.push(`speak:${messageIndex}:${content}`)
      },
      onBranchMessage: (messageIndex) => {
        bodyEvents.push(`branch:${messageIndex}`)
      },
      onCopyMessage: (messageIndex, content) => {
        bodyEvents.push(`copy:${messageIndex}:${content}`)
      },
      onToggleMessageExpansion: (messageIndex) => {
        bodyEvents.push(`expand:${messageIndex}`)
      },
    })
    expect(threadBodyState).toMatchObject({
      bodyDisplayMode: "conversation",
      retryStatus: {
        renderState: null,
      },
      delegationCard: {
        isDelegation: false,
        displayToolCallCount: 1,
      },
      toolApproval: {
        cardState: null,
      },
      inlineActivity: null,
      conversation: {
        surfaceToneStyleSlot: successfulConversationMessage.toneStyleSlot,
        actionSet: {
          turnDuration: {
            durationMs: 12000,
            isLive: true,
            styleId: "duration",
          },
          speech: {
            content: "Working",
            styleId: "speech",
          },
          branch: {
            branchMessageIndex: 3,
            fallbackMessageIndex: 4,
            styleId: "branch",
          },
          copy: {
            content: "Working",
            styleId: "copy",
          },
        },
        contentDisplayMode: "expanded",
        expanded: {
          markdownContent: "Working",
          assetBaseUrl: "https://assets.local",
          assetAuthToken: "asset-token",
          spinnerSource: "spinner",
        },
        toolExecutionStack: {
          displayToolCallCount: 1,
          detailRows: [{
            key: "message-1-2",
            toolName: "read_file",
          }],
        },
      },
    })
    threadBodyState.conversation.actionSet.speech.onPress()
    threadBodyState.conversation.actionSet.branch.onPress()
    threadBodyState.conversation.actionSet.copy.onPress()
    expect(threadBodyState.conversation.collapsed.onPress).toBeUndefined()
    threadBodyState.conversation.collapsed.onPress?.()
    threadBodyState.conversation.toolExecutionStack.detailRows[0].onHeaderPress()
    threadBodyState.conversation.toolExecutionStack.detailRows[0].input?.onCopyPress()
    threadBodyState.conversation.toolExecutionStack.expanded.onToggle()
    expect(bodyEvents).toEqual([
      "speak:4:Working",
      "branch:3",
      "copy:4:Working",
      "tool:message-1:2",
      "payload:{\n  \"path\": \"/tmp/file\"\n}",
      "expand:4",
    ])
    const toolActivityGroup: ToolActivityGroup = {
      startIndex: 3,
      endIndex: 4,
      count: 2,
      toolCallCount: 2,
      previewLines: ["read_file"],
    }
    const computedGroupRenderState = getChatRuntimeConversationToolActivityGroupRenderState({
      group: toolActivityGroup,
      itemIndex: 3,
      groupState: {},
      inheritedState: {},
      groupKey: "tools-3",
      inheritedKey: 3,
      defaultExpanded: false,
      colors: {
        info: "#0ea5e9",
        mutedForeground: "#64748b",
      },
    })
    expect(computedGroupRenderState).toMatchObject({
      groupKey: "tools-3",
      shouldRenderCollapsedHeader: true,
    })
    if (!computedGroupRenderState) throw new Error("Expected a tool activity group render state")
    const collapsedGroupRenderState: ToolActivityGroupMobileRenderState = computedGroupRenderState
    let toggledGroup: ToolActivityGroup | null = null
    const collapsedGroupThreadState = getChatRuntimeConversationToolActivityGroupThreadState({
      group: toolActivityGroup,
      groupRenderState: collapsedGroupRenderState,
      itemKey: 3,
      onToggleGroup: (group) => {
        toggledGroup = group
      },
    })
    expect(collapsedGroupThreadState.groupOnlyThreadKey).toBe("group-tools-3")
    expect(collapsedGroupThreadState.shouldRenderGroupOnlyThread).toBe(true)
    collapsedGroupThreadState.onToggleGroup?.()
    expect(toggledGroup).toBe(toolActivityGroup)
    expect(getChatRuntimeConversationToolActivityGroupThreadRenderState({
      group: toolActivityGroup,
      itemIndex: 3,
      itemKey: 3,
      groupState: {},
      inheritedState: {},
      groupKey: "tools-3",
      inheritedKey: 3,
      defaultExpanded: false,
      colors: {
        info: "#0ea5e9",
        mutedForeground: "#64748b",
      },
      onToggleGroup: () => {},
    }).groupOnlyThreadState).toMatchObject({
      threadKey: "group-tools-3",
      shouldRenderThread: true,
    })
    let didCreateCollapsedMessageThread = false
    expect(getChatRuntimeConversationItemThreadMobileState({
      group: toolActivityGroup,
      itemIndex: 3,
      itemKey: 3,
      groupState: {},
      inheritedState: {},
      groupKey: "tools-3",
      inheritedKey: 3,
      defaultExpanded: false,
      colors: {
        info: "#0ea5e9",
        mutedForeground: "#64748b",
      },
      onToggleGroup: () => {},
      messageThreadInput: { messageId: "message-3" },
      createMessageThreadState: () => {
        didCreateCollapsedMessageThread = true
        return {
          threadKey: 3,
          groupRenderState: null,
          body: { bodyDisplayMode: "conversation" as const, messageId: "message-3" },
          shouldRenderThread: true,
        }
      },
    })).toMatchObject({
      threadKey: "group-tools-3",
      body: null,
      shouldRenderThread: true,
    })
    expect(didCreateCollapsedMessageThread).toBe(false)
    let createdMessageThreadItemKey: unknown = null
    expect(getChatRuntimeConversationItemThreadMobileState({
      group: null,
      itemIndex: 6,
      itemKey: 6,
      groupState: {},
      inheritedState: {},
      groupKey: "tools-6",
      inheritedKey: 6,
      defaultExpanded: false,
      colors: {
        info: "#0ea5e9",
        mutedForeground: "#64748b",
      },
      onToggleGroup: () => {},
      messageThreadInput: { messageId: "message-6" },
      createMessageThreadState: (input) => {
        createdMessageThreadItemKey = input.itemKey
        return {
          threadKey: input.itemKey,
          groupRenderState: input.groupRenderState,
          onToggleGroup: input.groupThreadState.onToggleGroup,
          body: { bodyDisplayMode: "conversation" as const, messageId: input.messageId },
          shouldRenderThread: true,
        }
      },
    })).toMatchObject({
      threadKey: 6,
      body: {
        bodyDisplayMode: "conversation",
        messageId: "message-6",
      },
      shouldRenderThread: true,
    })
    expect(createdMessageThreadItemKey).toBe(6)
    expect(getChatRuntimeConversationRuntimeThreadState({
      itemKey: 3,
      groupRenderState: collapsedGroupRenderState,
      groupThreadState: collapsedGroupThreadState,
      body: { inlineActivity: null, conversation: "body" },
    })).toMatchObject({
      threadKey: "group-tools-3",
      body: null,
    })
    expect(getChatRuntimeConversationToolActivityGroupRuntimeThreadState({
      itemKey: 3,
      groupRenderState: collapsedGroupRenderState,
      groupThreadState: collapsedGroupThreadState,
    })).toMatchObject({
      threadKey: "group-tools-3",
      body: null,
      shouldRenderThread: true,
    })
    expect(shouldRenderChatRuntimeConversationThread({
      renderContext: { shouldRenderSurface: false },
      body: { bodyDisplayMode: "inlineActivity" },
    })).toBe(true)
    expect(shouldRenderChatRuntimeConversationThread({
      renderContext: { shouldRenderSurface: false },
      body: { bodyDisplayMode: "toolApproval" },
    })).toBe(true)
    expect(shouldRenderChatRuntimeConversationThread({
      renderContext: { shouldRenderSurface: false },
      body: { bodyDisplayMode: "conversation" },
    })).toBe(false)
    expect(getChatRuntimeConversationThreadBodyMobileDisplayMode({
      retryStatus: { renderState: { shouldRender: true } as never },
      delegationCard: { isDelegation: true, delegation: { runId: "run-1" } },
      toolApproval: { cardState: { approvalId: "approval-1" } as never },
      inlineActivity: { renderState: "thinking" },
    })).toBe("retryStatus")
    expect(getChatRuntimeConversationThreadBodyMobileDisplayMode({
      retryStatus: { renderState: null },
      delegationCard: { isDelegation: true, delegation: { runId: "run-1" } },
      toolApproval: { cardState: { approvalId: "approval-1" } as never },
      inlineActivity: { renderState: "thinking" },
    })).toBe("delegationCard")
    expect(getChatRuntimeConversationThreadBodyMobileDisplayMode({
      retryStatus: { renderState: null },
      delegationCard: { isDelegation: false, delegation: null },
      toolApproval: { cardState: { approvalId: "approval-1" } as never },
      inlineActivity: { renderState: "thinking" },
    })).toBe("toolApproval")
    expect(getChatRuntimeConversationThreadBodyMobileDisplayMode({
      retryStatus: { renderState: null },
      delegationCard: { isDelegation: false, delegation: null },
      toolApproval: { cardState: null },
      inlineActivity: { renderState: "thinking" },
    })).toBe("inlineActivity")
    expect(getChatRuntimeConversationThreadBodyMobileDisplayMode({
      retryStatus: { renderState: null },
      delegationCard: { isDelegation: false, delegation: null },
      toolApproval: { cardState: null },
      inlineActivity: null,
    })).toBe("conversation")
    expect(getChatRuntimeConversationMessageRuntimeThreadState({
      itemKey: 5,
      groupRenderState: null,
      groupThreadState: getChatRuntimeConversationToolActivityGroupThreadState({
        group: null,
        groupRenderState: null,
        itemKey: 5,
        onToggleGroup: () => {},
      }),
      renderContext: { shouldRenderSurface: false },
      body: { bodyDisplayMode: "inlineActivity" },
    })).toMatchObject({
      threadKey: 5,
      shouldRenderThread: true,
    })
    expect(getChatRuntimeConversationMessageThreadMobileState({
      itemKey: 7,
      groupRenderState: null,
      groupThreadState: getChatRuntimeConversationToolActivityGroupThreadState({
        group: null,
        groupRenderState: null,
        itemKey: 7,
        onToggleGroup: () => {},
      }),
      lastConversationContentMessageIndex: 7,
      expandedMessages: { 7: true },
      resultOnlyToolLabel: "Tool result",
      bodyInput: {
        message: {
          role: "assistant" as const,
          content: "Shared message thread",
        },
        messageIndex: 7,
        isResponding: false,
        colors: messageThreadStyleColors,
      },
      createBodyState: ({ renderContext }) => ({
        bodyDisplayMode: renderContext.shouldRenderSurface ? "conversation" : "inlineActivity",
        visibleMessageContent: renderContext.visibleMessageContent,
      }),
    })).toMatchObject({
      threadKey: 7,
      shouldRenderThread: true,
      body: {
        bodyDisplayMode: "conversation",
        visibleMessageContent: "Shared message thread",
      },
    })
    const sharedMessageThreadStateInput = {
      itemKey: 8,
      groupRenderState: null,
      groupThreadState: getChatRuntimeConversationToolActivityGroupThreadState({
        group: null,
        groupRenderState: null,
        itemKey: 8,
        onToggleGroup: () => {},
      }),
      lastConversationContentMessageIndex: 8,
      expandedMessages: {},
      resultOnlyToolLabel: "Tool result",
      message: {
        id: "message-8",
        role: "assistant" as const,
        content: "Shared body input helper",
      },
      messageIndex: 8,
      turnDurationsByUserTimestamp: new Map(),
      conversationId: "conversation-1",
      pendingBranchMessageIndex: null,
      isResponding: false,
      isSpeaking: false,
      isCopied: false,
      ttsEnabled: true,
      colors: threadBodyColors,
      actionStyles: {
        turnDuration: { styleId: "duration" },
        speech: { styleId: "speech" },
        branch: { styleId: "branch" },
        copy: { styleId: "copy" },
        expansion: { styleId: "expansion" },
      },
      spinnerSource: "spinner",
      presentation: threadBodyPresentation,
      expandedDelegationConversationPreviews: {},
      expandedDelegationToolPreviews: {},
      setExpandedDelegationConversationPreviews: (
        _updater: (state: Record<string, boolean>) => Record<string, boolean>,
      ) => {},
      setExpandedDelegationToolPreviews: (
        _updater: (state: Record<string, boolean>) => Record<string, boolean>,
      ) => {},
      expandedToolApprovals: {},
      pendingApprovalResponseId: null,
      onToggleToolApprovalArguments: (_approvalId: string) => {},
      onRespondToToolApproval: (_approvalId: string, _approved: boolean) => {},
      expandedToolCalls: {},
      onToggleToolCall: (_stableMessageKey: string | number, _toolEntryIndex: number) => {},
      onCopyToolPayload: (_content: string) => {},
      onSpeakMessage: (_messageIndex: number, _content: string) => {},
      onBranchMessage: (_messageIndex: number) => {},
      onCopyMessage: (_messageIndex: number, _content: string) => {},
      onToggleMessageExpansion: (_messageIndex: number) => {},
    }
    expect(getChatRuntimeConversationMessageThreadMobileStateFromBodyInput(
      sharedMessageThreadStateInput,
    )).toMatchObject({
      threadKey: 8,
      shouldRenderThread: true,
      body: {
        bodyDisplayMode: "conversation",
        conversation: {
          expanded: {
            markdownContent: "Shared body input helper",
          },
        },
      },
    })
    expect(getChatRuntimeConversationItemThreadMobileStateFromBodyInput({
      ...sharedMessageThreadStateInput,
      group: null,
      itemIndex: 8,
      groupState: {},
      inheritedState: {},
      groupKey: "tools-8",
      inheritedKey: 8,
      defaultExpanded: false,
      onToggleGroup: () => {},
    })).toMatchObject({
      threadKey: 8,
      shouldRenderThread: true,
      body: {
        bodyDisplayMode: "conversation",
        conversation: {
          expanded: {
            markdownContent: "Shared body input helper",
          },
        },
      },
    })
    const threadListMessages = [
      { role: "user" as const, content: "Question" },
      { role: "assistant" as const, content: "" },
      { role: "assistant" as const, content: "Answer" },
    ]
    expect(getChatRuntimeConversationThreadListMobileState({
      allMessages: threadListMessages,
      messages: threadListMessages.slice(1),
      firstMessageIndex: 1,
      groupByIndex: new Map(),
      speakingMessageIndex: 2,
      copiedMessageIndex: null,
      createThreadState: (input) => ({
        messageIndex: input.messageIndex,
        isSpeaking: input.isSpeaking,
        lastConversationContentMessageIndex: input.lastConversationContentMessageIndex,
      }),
    })).toEqual([
      {
        messageIndex: 1,
        isSpeaking: false,
        lastConversationContentMessageIndex: 2,
      },
      {
        messageIndex: 2,
        isSpeaking: true,
        lastConversationContentMessageIndex: 2,
      },
    ])
    expect(getChatRuntimeConversationRuntimeThreadListMobileState({
      messages: threadListMessages,
      visibleMessageCount: 2,
      groupByIndex: new Map(),
      speakingMessageIndex: null,
      copiedMessageIndex: 2,
      colors: {
        ...messageThreadStyleColors,
        destructive: "#dc2626",
      },
      createThreadState: (input) => ({
        messageIndex: input.messageIndex,
        isCopied: input.isCopied,
        resultOnlyToolLabel: input.resultOnlyToolLabel,
        hasDelegationSurface: Boolean(input.presentation.delegationSurface),
      }),
    })).toMatchObject({
      visibleMessageCount: 2,
      totalMessageCount: 3,
      hiddenMessageCount: 1,
      threadStates: [
        {
          messageIndex: 1,
          isCopied: false,
          resultOnlyToolLabel: "Tool result",
          hasDelegationSurface: true,
        },
        {
          messageIndex: 2,
          isCopied: true,
          resultOnlyToolLabel: "Tool result",
          hasDelegationSurface: true,
        },
      ],
    })
    const messageThreadPresentation = getChatRuntimeMessageThreadPresentationMobileRenderState({
      colors: {
        ...messageThreadStyleColors,
        destructive: "#dc2626",
      },
    })
    expect(messageThreadPresentation.delegationSurface.conversationPreviewMaxRows).toBe(2)
    expect(messageThreadPresentation.delegationRoleStyles.user.color).toBe("#0ea5e9")
    expect(messageThreadPresentation.toolPayloadPreviewNumberOfLines).toBe(2)
    expect(messageThreadPresentation.pendingToolResultRenderState.label).toBe("Waiting...")
    expect(messageThreadPresentation.toolExecutionEmptyStateRenderState.label).toBe("No tool calls")
    const threadChromeStyle = getChatRuntimeThreadChromeMobileStyleRenderState({
      colors: {
        ...messageThreadStyleColors,
        background: "#ffffff",
        destructive: "#dc2626",
        successForeground: "#ecfdf5",
      },
    })
    expect(threadChromeStyle.compactToolExecution.statusColors.success).toBe("#16a34a")
    expect(createChatRuntimeToolExecutionCompactMobileStyleSlots({
      renderState: threadChromeStyle.compactToolExecution,
      radius: { sm: 6 },
      platform: "android",
    })).toEqual({
      container: {
        paddingVertical: 1,
        paddingHorizontal: 2,
        borderRadius: 6,
        gap: 1,
      },
      line: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 1,
        overflow: "hidden",
      },
      leadingIcon: {
        width: 14,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      },
      pressed: {
        opacity: 0.7,
      },
      name: {
        fontFamily: "monospace",
        fontSize: 10,
        fontWeight: "500",
        flexShrink: 1,
        minWidth: 0,
        color: "#64748b",
      },
      namePending: {
        color: "#0ea5e9",
      },
      nameSuccess: {
        color: "#16a34a",
      },
      nameError: {
        color: "#dc2626",
      },
      statusIndicator: {
        width: 14,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      },
      toggleIcon: {
        width: 12,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      },
      statusPending: {
        color: "#0ea5e9",
      },
      statusSuccess: {
        color: "#16a34a",
      },
      statusError: {
        color: "#dc2626",
      },
    })
    expect(threadChromeStyle.toolExecutionDetail.payloadPreview.numberOfLines).toBe(2)
    expect(createChatRuntimeToolExecutionDetailMobileStyleSlots({
      renderState: threadChromeStyle.toolExecutionDetail,
      spacing: { xs: 4 },
      radius: { sm: 6 },
      platform: "android",
    })).toMatchObject({
      card: {
        marginTop: 2,
        borderRadius: 6,
        borderLeftWidth: 1.5,
        borderLeftColor: "rgba(100, 116, 139, 0.5)",
        backgroundColor: "rgba(100, 116, 139, 0.02)",
        overflow: "hidden",
      },
      pending: {
        borderLeftColor: "rgba(14, 165, 233, 0.5)",
      },
      callSection: {
        marginBottom: 4,
        paddingBottom: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: "rgba(100, 116, 139, 0.15)",
      },
      toolName: {
        fontFamily: "monospace",
        fontWeight: "600",
        color: "#2563eb",
        fontSize: 10,
        flex: 1,
      },
      payloadPreview: {
        fontFamily: "monospace",
        fontSize: 8,
        lineHeight: 11,
        borderRadius: 6,
        backgroundColor: "rgba(100, 116, 139, 0.04)",
        color: "#64748b",
      },
      copyButton: {
        minHeight: 24,
        borderRadius: 6,
        backgroundColor: "rgba(100, 116, 139, 0.08)",
        flexDirection: "row",
        flexShrink: 0,
      },
      paramsCode: {
        fontFamily: "monospace",
        color: "#0f172a",
        backgroundColor: "#f1f5f9",
        borderRadius: 6,
      },
      resultCharCount: {
        fontFamily: "monospace",
        color: "#64748b",
        opacity: 0.6,
      },
      resultBadgeSuccess: {
        backgroundColor: "rgba(22, 163, 74, 0.12)",
      },
      resultBadgeTextError: {
        color: "#dc2626",
      },
      resultErrorText: {
        fontFamily: "monospace",
        color: "#dc2626",
        backgroundColor: "rgba(220, 38, 38, 0.06)",
        borderRadius: 6,
      },
    })
    expect(threadChromeStyle.toolActivityGroup.colors.countBadge.color).toBe("#0ea5e9")
    expect(threadChromeStyle.toolApproval.title).toBe("Tool Approval Required")
    expect(threadChromeStyle.messageThread.message.surface.paddingHorizontal).toBe("sm")
    const threadMobileStyleSpacing = {
      xs: 4,
      sm: 8,
      md: 12,
    }
    const threadMobileStyleRadius = {
      sm: 6,
      md: 10,
      full: 999,
    }
    const threadMobileBorderWidths = {
      hairline: 0.5,
    }
    expect(createChatRuntimeThreadMobileStyleSlots({
      renderState: threadChromeStyle,
      spacing: threadMobileStyleSpacing,
      radius: threadMobileStyleRadius,
      borderWidths: threadMobileBorderWidths,
      platform: "android",
    })).toEqual({
      compactToolExecution: createChatRuntimeToolExecutionCompactMobileStyleSlots({
        renderState: threadChromeStyle.compactToolExecution,
        radius: threadMobileStyleRadius,
        platform: "android",
      }),
      toolExecutionDetail: createChatRuntimeToolExecutionDetailMobileStyleSlots({
        renderState: threadChromeStyle.toolExecutionDetail,
        spacing: threadMobileStyleSpacing,
        radius: threadMobileStyleRadius,
        platform: "android",
      }),
      toolActivityGroup: createChatRuntimeToolActivityGroupMobileStyleSlots({
        renderState: threadChromeStyle.toolActivityGroup,
        spacing: threadMobileStyleSpacing,
        radius: threadMobileStyleRadius,
        platform: "android",
      }),
      toolApproval: createChatRuntimeToolApprovalMobileStyleSlots({
        renderState: threadChromeStyle.toolApproval,
        spacing: threadMobileStyleSpacing,
        radius: threadMobileStyleRadius,
        platform: "android",
      }),
      message: createChatRuntimeMessageMobileStyleSlots({
        renderState: threadChromeStyle.messageThread.message,
        spacing: threadMobileStyleSpacing,
        radius: threadMobileStyleRadius,
        borderWidths: threadMobileBorderWidths,
      }),
      action: createChatRuntimeMessageActionMobileStyleSlots({
        renderState: threadChromeStyle.messageThread.action,
        spacing: threadMobileStyleSpacing,
      }),
      turnDuration: createChatRuntimeTurnDurationMessageMobileStyleSlotVariants({
        renderState: threadChromeStyle.messageThread.turnDuration,
        platform: "android",
      }),
    })
    const compactToolPreviewColors = {
      ...messageThreadStyleColors,
      destructive: "#dc2626",
    }
    const compactToolPreviewRow = getChatRuntimeToolExecutionCompactPreviewMobileRowState({
      key: "tool-0",
      toolCall: { name: "read_file", arguments: { path: "/test" } },
      label: "read_file:/test",
      result: { success: true, content: "ok" },
      colors: compactToolPreviewColors,
    })
    expect(compactToolPreviewRow).toMatchObject({
      key: "tool-0",
      preview: "read_file:/test",
      renderState: {
        state: "success",
        preview: "read_file:/test",
        isSuccess: true,
      },
    })
    const delegationToolPreviewRows = getChatRuntimeDelegationToolPreviewRowsMobileRenderState({
      rows: [{
        toolCall: { name: "execute_command", arguments: { cmd: "pwd" } },
        result: null,
      }],
      colors: compactToolPreviewColors,
    })
    expect(delegationToolPreviewRows[0].key).toBe("execute_command-0")
    expect(delegationToolPreviewRows[0].renderState.state).toBe("pending")
    expect(getChatRuntimeDelegationToolPreviewMobileVisibilityRenderState({
      displayToolCallCount: 1,
    })).toEqual({
      shouldRender: true,
    })
    expect(getChatRuntimeDelegationToolPreviewMobileVisibilityRenderState({
      displayToolCallCount: 0,
    })).toEqual({
      shouldRender: false,
    })
    expect(getChatRuntimeToolExecutionResultOnlyFallbackRenderState()).toEqual({
      label: "Tool result",
    })
    expect(getChatRuntimeToolExecutionResultOnlyFallbackLabel()).toBe("Tool result")
    const toolDetailRow = getChatRuntimeToolExecutionDetailMobileRowState({
      key: "tool-detail-0",
      toolCall: { name: "read_file", arguments: { path: "/test" } },
      result: { success: false, content: "failed output", error: "Nope" },
      isExpanded: true,
      colors: compactToolPreviewColors,
      previewNumberOfLines: 2,
      pendingResultRenderState: messageThreadPresentation.pendingToolResultRenderState,
    })
    expect(toolDetailRow.key).toBe("tool-detail-0")
    expect(toolDetailRow.toolName).toBe("read_file")
    expect(toolDetailRow.renderState.resultBadge.state).toBe("error")
    expect(toolDetailRow.input?.payloadRenderState.kind).toBe("input")
    expect(toolDetailRow.input?.content).toBe('{\n  "path": "/test"\n}')
    expect(toolDetailRow.input?.copyButtonRenderState.kind).toBe("input")
    expect(toolDetailRow.result?.payloadRenderState.kind).toBe("output")
    expect(toolDetailRow.result?.resultBadge.state).toBe("error")
    expect(toolDetailRow.result?.resultContent).toBe("failed output")
    expect(toolDetailRow.result?.copyButtonRenderState.kind).toBe("output")
    expect(toolDetailRow.result?.errorRenderState.kind).toBe("error")
    expect(toolDetailRow.result?.error).toBe("Nope")
    expect(toolDetailRow.result?.errorCopyButtonRenderState.kind).toBe("error")
    expect(toolDetailRow.pendingResult).toBeNull()
    const pendingToolDetailRow = getChatRuntimeToolExecutionDetailMobileRowState({
      key: "tool-detail-pending",
      toolCall: { name: "execute_command", arguments: { cmd: "pwd" } },
      result: null,
      isExpanded: false,
      colors: compactToolPreviewColors,
      previewNumberOfLines: 2,
      pendingResultRenderState: messageThreadPresentation.pendingToolResultRenderState,
    })
    expect(pendingToolDetailRow.result).toBeNull()
    expect(pendingToolDetailRow.pendingResult).toEqual({
      renderState: messageThreadPresentation.pendingToolResultRenderState,
    })
    const toolExecutionStackState = getChatRuntimeToolExecutionStackMobileRenderState({
      displayToolCallCount: 2,
      results: [
        { success: true, content: "ok" },
        { success: false, content: "", error: "Nope" },
      ],
      colors: compactToolPreviewColors,
      emptyStateRenderState: messageThreadPresentation.toolExecutionEmptyStateRenderState,
    })
    expect(toolExecutionStackState.shouldRender).toBe(true)
    expect(toolExecutionStackState.compact.renderState.ariaExpanded).toBe(false)
    expect(toolExecutionStackState.expanded).toMatchObject({
      isPending: false,
      allSuccess: false,
      hasErrors: true,
      topCollapseRenderState: {
        placement: "top",
      },
      bottomCollapseRenderState: {
        placement: "bottom",
      },
      emptyState: {
        shouldRender: false,
        renderState: messageThreadPresentation.toolExecutionEmptyStateRenderState,
      },
    })
    const emptyToolExecutionStackState = getChatRuntimeToolExecutionStackMobileRenderState({
      displayToolCallCount: 0,
      results: [],
      colors: compactToolPreviewColors,
      emptyStateRenderState: messageThreadPresentation.toolExecutionEmptyStateRenderState,
    })
    expect(emptyToolExecutionStackState.shouldRender).toBe(false)
    expect(emptyToolExecutionStackState.expanded.emptyState.shouldRender).toBe(true)
    const collapseControlStyleSlots =
      createChatRuntimeToolExecutionExpandedGroupCollapseControlMobileStyleSlots({
        collapseButton: "collapse-button",
        collapsePressed: "collapse-pressed",
        collapseTopPlacement: "collapse-top",
        collapseBottomPlacement: "collapse-bottom",
        collapseText: "collapse-text",
      })
    expect(collapseControlStyleSlots).toEqual({
      top: {
        button: "collapse-button",
        pressed: "collapse-pressed",
        placement: "collapse-top",
        text: "collapse-text",
      },
      bottom: {
        button: "collapse-button",
        pressed: "collapse-pressed",
        placement: "collapse-bottom",
        text: "collapse-text",
      },
    })
    const expandedGroupParts = createChatRuntimeToolExecutionExpandedGroupMobilePropsParts({
      topCollapseRenderState: "top-collapse",
      bottomCollapseRenderState: "bottom-collapse",
      onCollapsePress: "collapse-expanded",
      isPending: true,
      allSuccess: false,
      hasErrors: true,
      emptyState: "empty-state-node",
      styles: {
        container: "expanded-container",
        card: "expanded-card",
        pending: "expanded-pending",
        success: "expanded-success",
        error: "expanded-error",
        collapseButton: "collapse-button",
        collapsePressed: "collapse-pressed",
        collapseTopPlacement: "collapse-top",
        collapseBottomPlacement: "collapse-bottom",
        collapseText: "collapse-text",
      },
    })
    expect(expandedGroupParts).toEqual({
      container: {
        props: {
          style: "expanded-container",
        },
        content: {
          card: {
            props: {
              style: [
                "expanded-card",
                "expanded-pending",
                false,
                "expanded-error",
              ],
            },
          },
          topCollapseControl: {
            props: {
              renderState: "top-collapse",
              onPress: "collapse-expanded",
              styles: {
                button: "collapse-button",
                pressed: "collapse-pressed",
                placement: "collapse-top",
                text: "collapse-text",
              },
            },
          },
          bottomCollapseControl: {
            props: {
              renderState: "bottom-collapse",
              onPress: "collapse-expanded",
              styles: {
                button: "collapse-button",
                pressed: "collapse-pressed",
                placement: "collapse-bottom",
                text: "collapse-text",
              },
            },
          },
          emptyState: {
            shouldRender: true,
            props: "empty-state-node",
          },
        },
      },
    })
    expect(createChatRuntimeToolExecutionExpandedGroupMobilePropsParts({
      topCollapseRenderState: "top-collapse",
      bottomCollapseRenderState: "bottom-collapse",
      onCollapsePress: "collapse-expanded",
      isPending: false,
      allSuccess: false,
      hasErrors: false,
      styles: {
        container: "expanded-container",
        card: "expanded-card",
        pending: "expanded-pending",
        success: "expanded-success",
        error: "expanded-error",
        collapseButton: "collapse-button",
        collapsePressed: "collapse-pressed",
        collapseTopPlacement: "collapse-top",
        collapseBottomPlacement: "collapse-bottom",
        collapseText: "collapse-text",
      },
    }).container.content.emptyState).toEqual({
      shouldRender: false,
      props: null,
    })
    const collapseControlParts = createChatRuntimeToolExecutionCollapseControlMobilePropsParts({
      renderState: {
        accessibilityRole: "button",
        accessibilityLabel: "Collapse tool details",
        accessibilityHint: "Hides tool details",
        icon: {
          name: "chevron-up",
          size: 12,
          color: "#555",
        },
        label: "Collapse",
      },
      onPress: "collapse-expanded",
      styles: {
        button: "collapse-button",
        pressed: "collapse-pressed",
        placement: "collapse-top",
        text: "collapse-text",
      },
    })
    expect(collapseControlParts).toMatchObject({
      container: {
        props: {
          onPress: "collapse-expanded",
          accessibilityRole: "button",
          accessibilityLabel: "Collapse tool details",
          accessibilityHint: "Hides tool details",
        },
        content: {
          icon: {
            props: {
              name: "chevron-up",
              size: 12,
              color: "#555",
            },
          },
          label: {
            props: {
              props: {
                style: "collapse-text",
              },
              text: "Collapse",
            },
          },
        },
      },
    })
    expect(collapseControlParts.container.props.style({ pressed: false })).toEqual([
      "collapse-button",
      false,
      "collapse-top",
    ])
    expect(collapseControlParts.container.props.style({ pressed: true })).toEqual([
      "collapse-button",
      "collapse-pressed",
      "collapse-top",
    ])
    const compactGroupParts = createChatRuntimeToolExecutionCompactGroupMobilePropsParts({
      renderState: {
        accessibilityRole: "button",
        accessibilityLabel: "Expand tool details",
        accessibilityHint: "Shows tool details",
        accessibilityState: {
          expanded: false,
        },
        ariaExpanded: false,
      },
      onPress: "expand-tools",
      styles: {
        container: "compact-group",
        pressed: "compact-group-pressed",
      },
    })
    expect(compactGroupParts).toMatchObject({
      container: {
        props: {
          onPress: "expand-tools",
          accessibilityRole: "button",
          accessibilityLabel: "Expand tool details",
          accessibilityHint: "Shows tool details",
          accessibilityState: {
            expanded: false,
          },
          "aria-expanded": false,
        },
      },
    })
    expect(compactGroupParts.container.props.style({ pressed: false })).toEqual([
      "compact-group",
      false,
    ])
    expect(compactGroupParts.container.props.style({ pressed: true })).toEqual([
      "compact-group",
      "compact-group-pressed",
    ])
    const compactRowParts = createChatRuntimeToolExecutionCompactRowMobilePropsParts({
      renderState: {
        accessibilityLabel: "Running: read_file",
        toolIcon: {
          name: "hammer-outline",
          size: 14,
          color: "#555",
        },
        isPending: true,
        isSuccess: false,
        isError: false,
        name: {
          numberOfLines: 1,
          ellipsizeMode: "tail",
        },
        preview: "read_file",
        statusIndicator: {
          spinner: {
            shouldRender: true,
            size: "small",
            color: "#888",
          },
          icon: {
            shouldRender: false,
            name: "checkmark-circle",
            size: 12,
            color: "#0f0",
          },
        },
        toggleIcon: {
          name: "chevron-forward",
          size: 16,
          color: "#999",
        },
      },
      styles: {
        line: "compact-line",
        leadingIcon: "compact-leading",
        name: "compact-name",
        namePending: "compact-name-pending",
        nameSuccess: "compact-name-success",
        nameError: "compact-name-error",
        statusIndicator: "compact-status",
        toggleIcon: "compact-toggle",
      },
    })
    expect(compactRowParts).toEqual({
      container: {
        props: {
          style: "compact-line",
          accessibilityLabel: "Running: read_file",
        },
        content: {
          leadingIcon: {
            container: {
              props: {
                style: "compact-leading",
              },
            },
            icon: {
              props: {
                name: "hammer-outline",
                size: 14,
                color: "#555",
              },
            },
          },
          name: {
            props: {
              text: "read_file",
              props: {
                style: [
                  "compact-name",
                  "compact-name-pending",
                  false,
                  false,
                ],
                numberOfLines: 1,
                ellipsizeMode: "tail",
              },
            },
          },
          statusIndicator: {
            container: {
              props: {
                style: "compact-status",
              },
            },
            spinner: {
              shouldRender: true,
              props: {
                size: "small",
                color: "#888",
              },
            },
            icon: {
              shouldRender: false,
              props: {
                name: "checkmark-circle",
                size: 12,
                color: "#0f0",
              },
            },
          },
          toggleIcon: {
            container: {
              props: {
                style: "compact-toggle",
              },
            },
            icon: {
              props: {
                name: "chevron-forward",
                size: 16,
                color: "#999",
              },
            },
          },
        },
      },
    })
    const compactRowIconParts = createChatRuntimeToolExecutionCompactRowMobilePropsParts({
      renderState: {
        accessibilityLabel: "Done: read_file",
        toolIcon: {
          name: "hammer-outline",
          size: 14,
          color: "#555",
        },
        isPending: false,
        isSuccess: true,
        isError: false,
        name: {
          numberOfLines: 1,
          ellipsizeMode: "tail",
        },
        preview: "read_file",
        statusIndicator: {
          spinner: {
            shouldRender: false,
            size: "small",
            color: "#888",
          },
          icon: {
            shouldRender: true,
            name: "checkmark-circle",
            size: 12,
            color: "#0f0",
          },
        },
        toggleIcon: {
          name: "chevron-forward",
          size: 16,
          color: "#999",
        },
      },
      styles: {
        line: "compact-line",
        leadingIcon: "compact-leading",
        name: "compact-name",
        namePending: "compact-name-pending",
        nameSuccess: "compact-name-success",
        nameError: "compact-name-error",
        statusIndicator: "compact-status",
        toggleIcon: "compact-toggle",
      },
    })
    expect(compactRowIconParts.container.content.statusIndicator).toEqual({
      container: {
        props: {
          style: "compact-status",
        },
      },
      spinner: {
        shouldRender: false,
        props: {
          size: "small",
          color: "#888",
        },
      },
      icon: {
        shouldRender: true,
        props: {
          name: "checkmark-circle",
          size: 12,
          color: "#0f0",
        },
      },
    })
    const compactListParts = createChatRuntimeToolExecutionCompactListMobilePropsParts({
      shouldRender: true,
      renderState: "compact-expand-state",
      rows: [
        {
          key: "read_file:0",
          renderState: "read-file-row-state",
        },
        {
          key: "write_file:1",
          renderState: "write-file-row-state",
        },
      ],
      onPress: "expand-tools",
      groupStyles: "compact-group-styles",
      rowStyles: "compact-row-styles",
    })
    expect(compactListParts).toEqual({
      shouldRenderList: true,
      group: {
        props: {
          renderState: "compact-expand-state",
          onPress: "expand-tools",
          styles: "compact-group-styles",
        },
      },
      rows: [
        {
          key: "read_file:0",
          props: {
            renderState: "read-file-row-state",
            styles: "compact-row-styles",
          },
        },
        {
          key: "write_file:1",
          props: {
            renderState: "write-file-row-state",
            styles: "compact-row-styles",
          },
        },
      ],
    })
    expect(createChatRuntimeToolExecutionCompactListMobilePropsParts({
      shouldRender: false,
      renderState: "compact-expand-state",
      rows: [],
      groupStyles: "compact-group-styles",
      rowStyles: "compact-row-styles",
    }).shouldRenderList).toBe(false)
    const callDetailParts = createChatRuntimeToolExecutionCallDetailMobilePropsParts({
      renderState: "detail-header-state",
      toolName: "read_file",
      onHeaderPress: "toggle-detail",
      input: {
        payloadRenderState: "input-payload-state",
        content: "input-content",
      },
      result: null,
      pendingResult: {
        renderState: "pending-result-state",
      },
      styles: {
        callSection: "call-section-styles",
        payloadSection: "payload-section-styles",
        resultSection: "result-section-styles",
        pendingResult: "pending-result-styles",
      },
    })
    expect(callDetailParts).toEqual({
      callSection: {
        props: {
          renderState: "detail-header-state",
          toolName: "read_file",
          onHeaderPress: "toggle-detail",
          styles: "call-section-styles",
        },
        content: {
          inputSection: {
            shouldRender: true,
            props: {
              payloadRenderState: "input-payload-state",
              content: "input-content",
              styles: "payload-section-styles",
            },
          },
          resultSection: {
            shouldRender: false,
            props: null,
          },
          pendingResult: {
            shouldRender: true,
            props: {
              renderState: "pending-result-state",
              styles: "pending-result-styles",
            },
          },
        },
      },
    })
    const resultCallDetailParts = createChatRuntimeToolExecutionCallDetailMobilePropsParts({
      renderState: "detail-header-state",
      toolName: "read_file",
      result: {
        resultContent: "result-content",
      },
      pendingResult: {
        renderState: "pending-result-state",
      },
      styles: {
        callSection: "call-section-styles",
        payloadSection: "payload-section-styles",
        resultSection: "result-section-styles",
        pendingResult: "pending-result-styles",
      },
    })
    expect(resultCallDetailParts.callSection.content.resultSection).toEqual({
      shouldRender: true,
      props: {
        resultContent: "result-content",
        styles: "result-section-styles",
      },
    })
    expect(resultCallDetailParts.callSection.content.pendingResult).toEqual({
      shouldRender: false,
      props: null,
    })
    expect(createChatRuntimeToolExecutionCallListMobilePropsParts({
      rows: [
        {
          key: "read_file:0",
          renderState: "read-file-header",
          toolName: "read_file",
          onHeaderPress: "toggle-read",
          input: "read-input",
          result: null,
          pendingResult: "read-pending",
        },
        {
          key: "write_file:1",
          renderState: "write-file-header",
          toolName: "write_file",
          onHeaderPress: "toggle-write",
          input: null,
          result: "write-result",
          pendingResult: null,
        },
      ],
      styles: "call-detail-styles",
    })).toEqual({
      rows: [
        {
          key: "read_file:0",
          props: {
            renderState: "read-file-header",
            toolName: "read_file",
            onHeaderPress: "toggle-read",
            input: "read-input",
            result: null,
            pendingResult: "read-pending",
            styles: "call-detail-styles",
          },
        },
        {
          key: "write_file:1",
          props: {
            renderState: "write-file-header",
            toolName: "write_file",
            onHeaderPress: "toggle-write",
            input: null,
            result: "write-result",
            pendingResult: null,
            styles: "call-detail-styles",
          },
        },
      ],
    })
    const detailHeaderParts = createChatRuntimeToolExecutionDetailHeaderMobilePropsParts({
      renderState: {
        accessibilityRole: "button",
        accessibilityLabel: "Expand read_file",
        accessibilityState: {
          expanded: false,
        },
        ariaExpanded: false,
        accessibilityHint: "Shows tool details",
        toggleIcon: {
          name: "chevron-down",
          size: 12,
          color: "#777",
        },
        toggleLabel: "Show",
      },
      toolName: "read_file",
      onPress: "toggle-detail",
      styles: {
        header: "detail-header",
        headerPressed: "detail-header-pressed",
        toolName: "detail-tool-name",
        expandHint: "detail-expand-hint",
        expandHintText: "detail-expand-hint-text",
      },
    })
    expect(detailHeaderParts).toMatchObject({
      container: {
        props: {
          onPress: "toggle-detail",
          accessibilityRole: "button",
          accessibilityLabel: "Expand read_file",
          accessibilityState: {
            expanded: false,
          },
          "aria-expanded": false,
          accessibilityHint: "Shows tool details",
        },
        content: {
          toolName: {
            props: {
              props: {
                style: "detail-tool-name",
              },
              text: "read_file",
            },
          },
          expandHint: {
            props: {
              style: "detail-expand-hint",
            },
            content: {
              icon: {
                props: {
                  name: "chevron-down",
                  size: 12,
                  color: "#777",
                },
              },
              label: {
                props: {
                  props: {
                    style: "detail-expand-hint-text",
                  },
                  text: "Show",
                },
              },
            },
          },
        },
      },
    })
    expect(detailHeaderParts.container.props.style({ pressed: false })).toEqual([
      "detail-header",
      false,
    ])
    expect(detailHeaderParts.container.props.style({ pressed: true })).toEqual([
      "detail-header",
      "detail-header-pressed",
    ])
    expect(createChatRuntimeToolExecutionCallSectionMobilePropsParts({
      renderState: "detail-header-state",
      toolName: "read_file",
      onHeaderPress: "toggle-detail",
      styles: {
        section: "call-section",
        header: "detail-header-styles",
      },
    })).toEqual({
      container: {
        props: {
          style: "call-section",
        },
        content: {
          header: {
            props: {
              renderState: "detail-header-state",
              toolName: "read_file",
              onPress: "toggle-detail",
              styles: "detail-header-styles",
            },
          },
        },
      },
    })
    const copyButtonParts = createChatRuntimeToolExecutionCopyButtonMobilePropsParts({
      renderState: {
        accessibilityRole: "button",
        accessibilityLabel: "Copy input payload",
        icon: {
          name: "copy-outline",
          size: 12,
          color: "#555",
        },
        label: "Copy",
      },
      onPress: "copy-payload",
      styles: {
        button: "copy-button",
        pressed: "copy-button-pressed",
        text: "copy-button-text",
      },
    })
    expect(copyButtonParts).toMatchObject({
      container: {
        props: {
          onPress: "copy-payload",
          accessibilityRole: "button",
          accessibilityLabel: "Copy input payload",
        },
        content: {
          icon: {
            props: {
              name: "copy-outline",
              size: 12,
              color: "#555",
            },
          },
          label: {
            props: {
              props: {
                style: "copy-button-text",
              },
              text: "Copy",
            },
          },
        },
      },
    })
    expect(copyButtonParts.container.props.style({ pressed: false })).toEqual([
      "copy-button",
      false,
    ])
    expect(copyButtonParts.container.props.style({ pressed: true })).toEqual([
      "copy-button",
      "copy-button-pressed",
    ])
    const payloadSectionParts = createChatRuntimeToolExecutionPayloadSectionMobilePropsParts({
      payloadRenderState: "payload-render-state",
      compactText: "preview",
      content: "payload-content",
      isExpanded: true,
      previewNumberOfLines: 3,
      copyButtonRenderState: "copy-button-state",
      onCopyPress: "copy-payload",
      styles: {
        section: "payload-section",
        headerRow: "payload-header-row",
        payloadMeta: "payload-meta-styles",
        copyButton: "copy-button-styles",
        payloadBlock: "payload-block-styles",
      },
    })
    expect(payloadSectionParts).toEqual({
      section: {
        props: {
          style: "payload-section",
        },
        content: {
          headerRow: {
            props: {
              style: "payload-header-row",
            },
            content: {
              payloadMeta: {
                props: {
                  renderState: "payload-render-state",
                  styles: "payload-meta-styles",
                },
              },
              copyButton: {
                props: {
                  renderState: "copy-button-state",
                  onPress: "copy-payload",
                  styles: "copy-button-styles",
                },
              },
            },
          },
          payloadBlock: {
            props: {
              compactText: "preview",
              content: "payload-content",
              isExpanded: true,
              previewNumberOfLines: 3,
              styles: "payload-block-styles",
            },
          },
        },
      },
    })
    const payloadMetaParts = createChatRuntimeToolExecutionPayloadMetaMobilePropsParts({
      renderState: {
        label: "Input",
        payloadTypeLabel: "JSON",
      },
      styles: {
        row: "payload-meta-row",
        label: "payload-meta-label",
        payloadType: "payload-type",
      },
    })
    expect(payloadMetaParts).toEqual({
      row: {
        shouldRender: true,
        props: {
          style: "payload-meta-row",
        },
      },
      content: {
        label: {
          props: {
            props: {
              style: "payload-meta-label",
            },
            text: "Input",
          },
        },
        payloadType: {
          shouldRender: true,
          props: {
            props: {
              style: "payload-type",
            },
            text: "JSON",
          },
        },
      },
    })
    expect(createChatRuntimeToolExecutionPayloadMetaMobilePropsParts({
      renderState: {
        label: "Output",
      },
      styles: {
        label: "payload-meta-label",
        payloadType: "payload-type",
      },
    })).toEqual({
      row: {
        shouldRender: false,
        props: null,
      },
      content: {
        label: {
          props: {
            props: {
              style: "payload-meta-label",
            },
            text: "Output",
          },
        },
        payloadType: {
          shouldRender: false,
          props: {
            props: {
              style: "payload-type",
            },
            text: "",
          },
        },
      },
    })
    const payloadBlockParts = createChatRuntimeToolExecutionPayloadBlockMobilePropsParts({
      compactText: "preview",
      content: "payload-content",
      isExpanded: true,
      previewNumberOfLines: 3,
      styles: {
        preview: "payload-preview",
        scroll: "payload-scroll",
        scrollExpanded: "payload-scroll-expanded",
        code: "payload-code",
      },
    })
    expect(payloadBlockParts).toEqual({
      content: {
        preview: {
          shouldRender: true,
          props: {
            props: {
              style: "payload-preview",
              numberOfLines: 3,
            },
            text: "preview",
          },
        },
        scroll: {
          props: {
            style: "payload-scroll-expanded",
            nestedScrollEnabled: true,
          },
        },
        code: {
          props: {
            props: {
              style: "payload-code",
            },
            text: "payload-content",
          },
        },
      },
    })
    expect(createChatRuntimeToolExecutionPayloadBlockMobilePropsParts({
      compactText: null,
      content: "payload-content",
      isExpanded: false,
      previewNumberOfLines: 2,
      styles: {
        preview: "payload-preview",
        scroll: "payload-scroll",
        scrollExpanded: "payload-scroll-expanded",
        code: "payload-code",
      },
    })).toEqual({
      content: {
        preview: {
          shouldRender: false,
          props: {
            props: {
              style: "payload-preview",
              numberOfLines: 2,
            },
            text: "",
          },
        },
        scroll: {
          props: {
            style: "payload-scroll",
            nestedScrollEnabled: true,
          },
        },
        code: {
          props: {
            props: {
              style: "payload-code",
            },
            text: "payload-content",
          },
        },
      },
    })
    const resultBadgeParts = createChatRuntimeToolExecutionResultBadgeMobilePropsParts({
      badge: {
        accessibilityRole: "text",
        accessibilityLabel: "Tool result succeeded",
        isSuccess: true,
        icon: {
          name: "checkmark-circle",
          size: 12,
          color: "#0f0",
        },
        label: "Succeeded",
      },
      styles: {
        badge: "result-badge",
        badgeSuccess: "result-badge-success",
        badgeError: "result-badge-error",
        text: "result-badge-text",
        textSuccess: "result-badge-text-success",
        textError: "result-badge-text-error",
      },
    })
    expect(resultBadgeParts).toEqual({
      container: {
        props: {
          accessible: true,
          accessibilityRole: "text",
          accessibilityLabel: "Tool result succeeded",
          style: [
            "result-badge",
            "result-badge-success",
          ],
        },
        content: {
          icon: {
            props: {
              name: "checkmark-circle",
              size: 12,
              color: "#0f0",
            },
          },
          label: {
            props: {
              props: {
                style: [
                  "result-badge-text",
                  "result-badge-text-success",
                ],
              },
              text: "Succeeded",
            },
          },
        },
      },
    })
    expect(createChatRuntimeToolExecutionResultBadgeMobilePropsParts({
      badge: {
        accessibilityRole: "text",
        accessibilityLabel: "Tool result failed",
        isSuccess: false,
        icon: {
          name: "alert-circle",
          size: 12,
          color: "#f00",
        },
        label: "Failed",
      },
      styles: {
        badge: "result-badge",
        badgeSuccess: "result-badge-success",
        badgeError: "result-badge-error",
        text: "result-badge-text",
        textSuccess: "result-badge-text-success",
        textError: "result-badge-text-error",
      },
    })).toMatchObject({
      container: {
        props: {
          style: [
            "result-badge",
            "result-badge-error",
          ],
        },
        content: {
          label: {
            props: {
              props: {
                style: [
                  "result-badge-text",
                  "result-badge-text-error",
                ],
              },
            },
          },
        },
      },
    })
    const pendingResultParts = createChatRuntimeToolExecutionPendingResultMobilePropsParts({
      renderState: {
        accessibilityRole: "text",
        accessibilityLabel: "Waiting for tool result",
        spinner: {
          size: "small",
          color: "#888",
        },
        label: "Waiting...",
      },
      styles: {
        row: "pending-row",
        text: "pending-text",
      },
    })
    expect(pendingResultParts).toEqual({
      container: {
        props: {
          accessible: true,
          accessibilityRole: "text",
          accessibilityLabel: "Waiting for tool result",
          style: "pending-row",
        },
        content: {
          spinner: {
            props: {
              size: "small",
              color: "#888",
            },
          },
          label: {
            props: {
              props: {
                style: "pending-text",
              },
              text: "Waiting...",
            },
          },
        },
      },
    })
    const emptyStateParts = createChatRuntimeToolExecutionEmptyStateMobilePropsParts({
      renderState: {
        accessibilityRole: "text",
        accessibilityLabel: "No tool calls",
        label: "No tool calls",
      },
      style: "empty-state-text",
    })
    expect(emptyStateParts).toEqual({
      content: {
        label: {
          props: {
            props: {
              accessibilityRole: "text",
              accessibilityLabel: "No tool calls",
              style: "empty-state-text",
            },
            text: "No tool calls",
          },
        },
      },
    })
    const resultHeaderParts = createChatRuntimeToolExecutionResultHeaderMobilePropsParts({
      payloadRenderState: "result-payload-state",
      resultBadge: "success-badge",
      characterCountLabel: "42 chars",
      copyButtonRenderState: "copy-result-state",
      onCopyPress: "copy-result",
      styles: {
        header: "result-header",
        meta: "result-meta",
        payloadMeta: "result-payload-meta",
        badge: "result-badge-styles",
        characterCount: "character-count-style",
        copyButton: "result-copy-button",
      },
    })
    expect(resultHeaderParts).toEqual({
      header: {
        props: {
          style: "result-header",
        },
        content: {
          meta: {
            props: {
              style: "result-meta",
            },
            content: {
              payloadMeta: {
                props: {
                  renderState: "result-payload-state",
                  styles: "result-payload-meta",
                },
              },
              resultBadge: {
                props: {
                  badge: "success-badge",
                  styles: "result-badge-styles",
                },
              },
              characterCount: {
                props: {
                  props: {
                    style: "character-count-style",
                  },
                  text: "42 chars",
                },
              },
            },
          },
          copyButton: {
            props: {
              renderState: "copy-result-state",
              onPress: "copy-result",
              styles: "result-copy-button",
            },
          },
        },
      },
    })
    const errorBlockParts = createChatRuntimeToolExecutionErrorBlockMobilePropsParts({
      renderState: {
        label: "Error",
      },
      error: "failed",
      copyButtonRenderState: "copy-error-state",
      onCopyPress: "copy-error",
      styles: {
        section: "error-section",
        headerRow: "error-header-row",
        label: "error-label-style",
        text: "error-text-style",
        copyButton: "error-copy-button",
      },
    })
    expect(errorBlockParts).toEqual({
      section: {
        props: {
          style: "error-section",
        },
      },
      headerRow: {
        props: {
          style: "error-header-row",
        },
      },
      content: {
        label: {
          props: {
            props: {
              style: "error-label-style",
            },
            text: "Error",
          },
        },
        copyButton: {
          props: {
            renderState: "copy-error-state",
            onPress: "copy-error",
            styles: "error-copy-button",
          },
        },
        error: {
          props: {
            props: {
              style: "error-text-style",
            },
            text: "failed",
          },
        },
      },
    })
    const resultSectionParts = createChatRuntimeToolExecutionResultSectionMobilePropsParts({
      payloadRenderState: "result-payload-state",
      resultBadge: "success-badge",
      characterCountLabel: "42 chars",
      resultCompactText: "compact-result",
      resultContent: "full-result",
      isExpanded: true,
      previewNumberOfLines: 3,
      copyButtonRenderState: "copy-result-state",
      onCopyPress: "copy-result",
      errorRenderState: "error-state",
      error: "failed",
      errorCopyButtonRenderState: "copy-error-state",
      onErrorCopyPress: "copy-error",
      styles: {
        item: "result-item",
        header: "result-header",
        payloadBlock: "result-payload-block",
        errorBlock: "result-error-block",
      },
    })
    expect(resultSectionParts).toEqual({
      item: {
        props: {
          style: "result-item",
        },
        content: {
          header: {
            props: {
              payloadRenderState: "result-payload-state",
              resultBadge: "success-badge",
              characterCountLabel: "42 chars",
              copyButtonRenderState: "copy-result-state",
              onCopyPress: "copy-result",
              styles: "result-header",
            },
          },
          payloadBlock: {
            props: {
              compactText: "compact-result",
              content: "full-result",
              isExpanded: true,
              previewNumberOfLines: 3,
              styles: "result-payload-block",
            },
          },
          errorBlock: {
            shouldRender: true,
            props: {
              renderState: "error-state",
              error: "failed",
              copyButtonRenderState: "copy-error-state",
              onCopyPress: "copy-error",
              styles: "result-error-block",
            },
          },
        },
      },
    })
    expect(createChatRuntimeToolExecutionResultSectionMobilePropsParts({
      payloadRenderState: "result-payload-state",
      resultBadge: "success-badge",
      characterCountLabel: "42 chars",
      resultContent: "full-result",
      isExpanded: false,
      previewNumberOfLines: 2,
      copyButtonRenderState: "copy-result-state",
      errorRenderState: "error-state",
      error: null,
      errorCopyButtonRenderState: "copy-error-state",
      styles: {
        item: "result-item",
        header: "result-header",
        payloadBlock: "result-payload-block",
        errorBlock: "result-error-block",
      },
    }).item.content.errorBlock).toEqual({
      shouldRender: false,
      props: null,
    })
    expect(createChatRuntimeToolExecutionPanelMobilePropsParts({
      shouldRender: true,
      isExpanded: false,
      compact: {
        renderState: "compact-render-state",
      },
      expanded: {
        renderState: "expanded-render-state",
      },
    })).toEqual({
      shouldRenderPanel: true,
      compact: {
        props: {
          renderState: "compact-render-state",
          shouldRender: true,
        },
      },
      expandedGroup: {
        shouldRender: false,
        props: null,
      },
    })
    expect(createChatRuntimeToolExecutionPanelMobilePropsParts({
      shouldRender: true,
      isExpanded: true,
      compact: {
        renderState: "compact-render-state",
      },
      expanded: {
        renderState: "expanded-render-state",
      },
    })).toEqual({
      shouldRenderPanel: true,
      compact: {
        props: {
          renderState: "compact-render-state",
          shouldRender: false,
        },
      },
      expandedGroup: {
        shouldRender: true,
        props: {
          renderState: "expanded-render-state",
        },
      },
    })
    expect(createChatRuntimeToolExecutionPanelMobilePropsParts({
      shouldRender: false,
      isExpanded: true,
      compact: {
        renderState: "compact-render-state",
      },
      expanded: {
        renderState: "expanded-render-state",
      },
    })).toEqual({
      shouldRenderPanel: false,
      compact: {
        props: {
          renderState: "compact-render-state",
          shouldRender: false,
        },
      },
      expandedGroup: {
        shouldRender: false,
        props: null,
      },
    })
    expect(createChatRuntimeToolExecutionPanelShellMobilePropsParts({
      compactList: "compact-list",
      expandedGroup: "expanded-group",
    })).toEqual({
      compactList: "compact-list",
      expandedGroup: {
        shouldRender: true,
        props: "expanded-group",
      },
    })
    expect(createChatRuntimeToolExecutionPanelShellMobilePropsParts({
      compactList: "compact-list",
      expandedGroup: null,
    })).toEqual({
      compactList: "compact-list",
      expandedGroup: {
        shouldRender: false,
        props: null,
      },
    })
    const toolExecutionPanelParts = createChatRuntimeToolExecutionStackPanelMobilePropsParts({
      compact: {
        renderState: "compact-render-state",
        rows: ["compact-row"],
        onPress: "toggle-compact",
      },
      expanded: {
        topCollapseRenderState: "top-collapse",
        bottomCollapseRenderState: "bottom-collapse",
        emptyState: {
          shouldRender: true,
          renderState: "empty-state",
        },
        onCollapsePress: "collapse-expanded",
      },
      detailRows: ["detail-row"],
      styles: {
        compactGroup: "compact-group-styles",
        compactRow: "compact-row-styles",
        expandedGroup: "expanded-group-styles",
        emptyStateText: "empty-state-text-styles",
        callDetail: "call-detail-styles",
      },
    })
    expect(toolExecutionPanelParts).toEqual({
      compact: {
        renderState: "compact-render-state",
        rows: ["compact-row"],
        onPress: "toggle-compact",
        groupStyles: "compact-group-styles",
        rowStyles: "compact-row-styles",
      },
      expandedGroup: {
        topCollapseRenderState: "top-collapse",
        bottomCollapseRenderState: "bottom-collapse",
        onCollapsePress: "collapse-expanded",
        styles: "expanded-group-styles",
      },
      emptyState: {
        shouldRender: true,
        props: {
          renderState: "empty-state",
          style: "empty-state-text-styles",
        },
      },
      callList: {
        rows: ["detail-row"],
        styles: "call-detail-styles",
      },
    })
    expect(createChatRuntimeToolExecutionStackPanelMobilePropsParts({
      compact: {
        renderState: "compact-render-state",
      },
      expanded: {
        emptyState: {
          shouldRender: false,
          renderState: "empty-state",
        },
      },
      detailRows: [],
      styles: {
        compactGroup: "compact-group-styles",
        compactRow: "compact-row-styles",
        expandedGroup: "expanded-group-styles",
        emptyStateText: "empty-state-text-styles",
        callDetail: "call-detail-styles",
      },
    }).emptyState).toEqual({
      shouldRender: false,
      props: null,
    })
    expect(CHAT_RUNTIME_PRESENTATION.turnDuration.messageTitle).toBe("Agent turn duration")
    expect(CHAT_RUNTIME_PRESENTATION.turnDuration.liveMessageTitle).toBe("Agent turn in progress")
    expect(CHAT_RUNTIME_PRESENTATION.turnDuration.totalTitle).toBe("Total agent time")
    expect(CHAT_RUNTIME_PRESENTATION.turnDuration.liveTotalTitle).toBe("Total agent time (running)")
    expect(getChatRuntimeTurnDurationTitle("message", false)).toBe("Agent turn duration")
    expect(getChatRuntimeTurnDurationTitle("message", true)).toBe("Agent turn in progress")
    expect(getChatRuntimeTurnDurationTitle("total", false)).toBe("Total agent time")
    expect(getChatRuntimeTurnDurationTitle("total", true)).toBe("Total agent time (running)")
    expect(formatChatRuntimeTurnDurationAccessibilityLabel("message", false, "12s")).toBe("Agent turn duration: 12s")
    expect(formatChatRuntimeTurnDurationAccessibilityLabel("total", true, "1m")).toBe("Total agent time (running): 1m")
    expect(formatChatRuntimeTurnDurationAccessibilityLabel("total", false, " ")).toBe("Total agent time")
    expect(getChatRuntimeTurnDurationBadgeState({
      scope: "message",
      role: "user",
      durationMs: 12_000,
      isLive: false,
    })).toEqual({
      canShow: true,
      label: "12s",
      title: "Agent turn duration",
      accessibilityRole: "text",
      accessibilityLabel: "Agent turn duration: 12s",
      isLive: false,
    })
    expect(getChatRuntimeTurnDurationBadgeState({
      scope: "total",
      durationMs: 60_000,
      isLive: true,
    })).toEqual({
      canShow: true,
      label: "1m",
      title: "Total agent time (running)",
      accessibilityRole: "text",
      accessibilityLabel: "Total agent time (running): 1m",
      isLive: true,
    })
    expect(getChatRuntimeTurnDurationBadgeState({
      scope: "message",
      role: "assistant",
      durationMs: 12_000,
    })).toEqual({
      canShow: false,
      label: null,
      title: null,
      accessibilityRole: "text",
      accessibilityLabel: null,
      isLive: false,
    })
    expect(getChatRuntimeTurnDurationBadgeState({
      scope: "total",
      durationMs: 0,
    }).canShow).toBe(false)
    expect(formatChatRuntimeToolApprovalRequiredContent("write_file")).toBe("Tool Approval Required: write_file")
    expect(getChatRuntimeToolApprovalAccessibilityLabel("approve", "write_file")).toBe(
      "Approve tool call write_file",
    )
    expect(getChatRuntimeToolApprovalAccessibilityLabel("deny", "write_file")).toBe(
      "Deny tool call write_file",
    )
    expect(getChatRuntimeToolApprovalArgumentsAccessibilityLabel("write_file", false)).toBe(
      "View full arguments for write_file",
    )
    expect(getChatRuntimeToolApprovalArgumentsAccessibilityLabel("write_file", true)).toBe(
      "Hide full arguments for write_file",
    )
    expect(getChatRuntimeToolApprovalInteractionState({
      toolName: "write_file",
      isArgumentsExpanded: true,
      isResponding: true,
    })).toEqual({
      copy: CHAT_RUNTIME_PRESENTATION.approval,
      title: CHAT_RUNTIME_PRESENTATION.approval.processingTitle,
      argumentsToggle: {
        label: CHAT_RUNTIME_PRESENTATION.approval.hideArgumentsLabel,
        isDisabled: true,
        accessibilityLabel: "Hide full arguments for write_file",
        accessibilityState: { expanded: true, disabled: true },
        ariaExpanded: true,
      },
      approveButton: {
        label: CHAT_RUNTIME_PRESENTATION.approval.processingLabel,
        isDisabled: true,
        accessibilityLabel: "Approve tool call write_file",
        accessibilityState: { disabled: true },
      },
      denyButton: {
        label: CHAT_RUNTIME_PRESENTATION.approval.denyLabel,
        isDisabled: true,
        accessibilityLabel: "Deny tool call write_file",
        accessibilityState: { disabled: true },
      },
    })
    expect(formatChatRuntimeRetryAttemptLabel({ attempt: 2 })).toBe("Attempt 2")
    expect(formatChatRuntimeRetryAttemptLabel({ attempt: 2, maxAttempts: 5 })).toBe("Attempt 2/5")
    expect(formatChatRuntimeRetryCountdownLabel(7)).toBe("Retrying in 7s")
    expect(formatChatRuntimeRetryCountdownLabel(-1)).toBe("Retrying in 0s")
    expect(formatChatRuntimeRetryAccessibilityLabel({
      attempt: 2,
      maxAttempts: 5,
      delaySeconds: 7,
      reason: "Rate limit",
    })).toContain("Rate limit")
    expect(getChatRuntimeRetryStatusState({
      retryInfo: {
        attempt: 2,
        maxAttempts: 5,
        delaySeconds: 7,
        reason: "Rate limit",
      },
      countdownSeconds: 3,
    })).toEqual({
      shouldRender: true,
      title: "Rate limit",
      attemptLabel: "Attempt 2/5",
      countdownLabel: "Retrying in 3s",
      description: CHAT_RUNTIME_PRESENTATION.retryStatus.autoRetryDescription,
      accessibilityLabel: "Rate limit. Attempt 2/5. Retrying in 3s. The agent will automatically retry when the API is available.",
    })
    expect(getChatRuntimeRetryStatusState()).toEqual({
      shouldRender: false,
      title: "",
      attemptLabel: "",
      countdownLabel: "",
      description: CHAT_RUNTIME_PRESENTATION.retryStatus.autoRetryDescription,
      accessibilityLabel: "",
    })
    expect(getChatRuntimeStreamingContentTitle(true)).toBe("Generating response...")
    expect(getChatRuntimeStreamingContentTitle(false)).toBe("Response")
    expect(getChatRuntimeStreamingContentState({
      isStreaming: true,
      content: "partial answer",
    })).toMatchObject({
      shouldRender: true,
      hasContent: true,
      isStreaming: true,
      title: "Generating response...",
      accessibilityLabel: "Generating response...",
      badgeLabel: CHAT_RUNTIME_PRESENTATION.streamingContent.streamingBadgeLabel,
      content: "partial answer",
    })
    const stepSummary = {
      stepNumber: 3,
      actionSummary: "Compared mobile and desktop chat chrome",
      importance: "high" as const,
      keyFindings: ["Mobile did not surface generated step summaries"],
    }
    expect(getChatRuntimeLatestStepSummary({ stepSummaries: [stepSummary] })).toBe(stepSummary)
    expect(getChatRuntimeLatestStepSummary({ latestSummary: stepSummary, stepSummaries: [] })).toBe(stepSummary)
    expect(formatChatRuntimeStepSummaryTitle(stepSummary)).toBe("Summary · Step 3")
    expect(formatChatRuntimeStepSummaryStepLabel(stepSummary)).toBe("Step 3")
    expect(formatChatRuntimeStepSummaryMeta(stepSummary)).toBe("Step 3 · High importance · 1 key finding")
    expect(formatChatRuntimeStepSummaryKeyFindingsLabel(stepSummary)).toBe("1 key finding")
    expect(formatChatRuntimeStepSummaryPreview(stepSummary)).toBe("Mobile did not surface generated step summaries")
    expect(formatChatRuntimeStepSummaryAccessibilityLabel(stepSummary)).toContain(
      "Compared mobile and desktop chat chrome",
    )
    expect(getChatRuntimeStepSummaryState({ summary: stepSummary })).toMatchObject({
      shouldRender: true,
      title: CHAT_RUNTIME_PRESENTATION.stepSummary.latestTitle,
      stepLabel: "Step 3",
      keyFindingsLabel: "1 key finding",
      actionSummary: "Compared mobile and desktop chat chrome",
    })
    expect(getChatRuntimeStepSummaryState()).toMatchObject({
      shouldRender: false,
      title: CHAT_RUNTIME_PRESENTATION.stepSummary.latestTitle,
      stepLabel: "",
      keyFindingsLabel: "",
      actionSummary: "",
    })
    expect(formatChatRuntimeDelegationMessageCount(4)).toBe("4m")
    expect(formatChatRuntimeDelegationMessagesLabel(1)).toBe("1 message")
    expect(formatChatRuntimeDelegationMessagesLabel(4)).toBe("4 messages")
    expect(formatChatRuntimeDelegationMessagesLabel(4, { includeCount: false })).toBe("messages")
    expect(formatChatRuntimeDelegationToolActivityLabel("3 tools")).toBe("Tool activity · 3 tools")
    expect(formatChatRuntimeDelegationToolActivityLabel("")).toBe("Tool activity")
    expect(formatChatRuntimeDelegationToolCallActivityLabel(1)).toBe("Tool activity · 1 tool call")
    expect(formatChatRuntimeDelegationToolCallActivityLabel(4)).toBe("Tool activity · 4 tool calls")
    expect(formatChatRuntimeDelegationMoreToolActivityLabel(12)).toBe("+12 more")
    expect(formatChatRuntimeEarlierDelegationMessagesLabel(1)).toBe("Show 1 earlier message")
    expect(formatChatRuntimeEarlierDelegationMessagesLabel(4)).toBe("Show 4 earlier messages")
    expect(formatChatRuntimeDelegationAccessibilityLabel({
      agentName: "Worker",
      statusLabel: "Running",
      subtitle: "Reading files",
      sourceLabel: "Internal session",
      messageCount: 4,
    })).toBe("Delegation. Worker. Running. Reading files. Internal session. 4m")
    const delegationStatusColorPalette = {
      info: "#2563eb",
      success: "#16a34a",
      warning: "#d97706",
      destructive: "#dc2626",
      mutedForeground: "#64748b",
    }
    expect(getChatRuntimeDelegationStatusMobileColors(
      "completed",
      delegationStatusColorPalette,
    ).textColor).toBe("#16a34a")
    expect(getChatRuntimeDelegationStatusMobileRenderState({
      status: "failed",
      colors: delegationStatusColorPalette,
    })).toEqual({
      colors: getChatRuntimeDelegationStatusMobileColors("failed", delegationStatusColorPalette),
      styles: getChatSessionStatusMobileStyleState(
        getChatRuntimeDelegationStatusMobileColors("failed", delegationStatusColorPalette),
      ),
    })
    expect(getChatRuntimeDelegationConversationPreviewRoleMobileColors("assistant", {
      info: "#2563eb",
      foreground: "#0f172a",
      warning: "#d97706",
    })).toEqual({
      backgroundColor: "rgba(15, 23, 42, 0.1)",
      borderColor: "rgba(15, 23, 42, 0.26)",
      textColor: "#0f172a",
    })
    expect(getChatRuntimeDelegationConversationPreviewRoleMobileStyleState({
      backgroundColor: "rgba(15, 23, 42, 0.1)",
      borderColor: "rgba(15, 23, 42, 0.26)",
      textColor: "#0f172a",
    })).toEqual({
      backgroundColor: "rgba(15, 23, 42, 0.1)",
      borderColor: "rgba(15, 23, 42, 0.26)",
      color: "#0f172a",
    })
    const delegationConversationPreviewRolePalette = {
      info: "#2563eb",
      foreground: "#0f172a",
      warning: "#d97706",
    }
    expect(getChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots(
      delegationConversationPreviewRolePalette,
    )).toEqual({
      user: getChatRuntimeDelegationConversationPreviewRoleMobileStyleState(
        getChatRuntimeDelegationConversationPreviewRoleMobileColors(
          "user",
          delegationConversationPreviewRolePalette,
        ),
      ),
      assistant: getChatRuntimeDelegationConversationPreviewRoleMobileStyleState(
        getChatRuntimeDelegationConversationPreviewRoleMobileColors(
          "assistant",
          delegationConversationPreviewRolePalette,
        ),
      ),
      tool: getChatRuntimeDelegationConversationPreviewRoleMobileStyleState(
        getChatRuntimeDelegationConversationPreviewRoleMobileColors(
          "tool",
          delegationConversationPreviewRolePalette,
        ),
      ),
    })
    expect(CHAT_RUNTIME_PRESENTATION.activity.thinkingAccessibilityLabel).toBe("Agent is thinking")
    expect(CHAT_RUNTIME_PRESENTATION.activity.loadingAgentActivityAccessibilityLabel).toBe("Loading agent activity")
    expect(getChatRuntimeMobileActivityAccessibilityState()).toEqual({
      loadingMessagesLabel: CHAT_RUNTIME_PRESENTATION.activity.loadingMessagesAccessibilityLabel,
      loadingAgentActivityLabel: CHAT_RUNTIME_PRESENTATION.activity.loadingAgentActivityAccessibilityLabel,
      thinkingLabel: CHAT_RUNTIME_PRESENTATION.activity.thinkingAccessibilityLabel,
    })
    expect(formatChatRuntimeActivityContent({ type: "tool_call", title: "Reading files" })).toBe("Reading files")
    expect(formatChatRuntimeActivityContent({ type: "tool_call" })).toBe("Running tool...")
    expect(formatChatRuntimeActivityContent({ description: "Planning" })).toBe("Planning")
    expect(formatChatRuntimeActivityContent()).toBe("Agent is thinking...")
    expect(shouldRenderChatRuntimeActivityStep()).toBe(true)
    expect(shouldRenderChatRuntimeActivityStep({ title: "Reading files" })).toBe(true)
    expect(shouldRenderChatRuntimeActivityStep({ title: "Verifying changes" })).toBe(false)
    expect(formatChatRuntimeVisibleUpdatesSummary(12)).toBe("Showing latest 12 updates")
    expect(formatChatRuntimeConversationHistorySummary(120, 240)).toBe("Showing latest 120 of 240 messages")
    expect(formatChatRuntimeConversationHistorySummary(40, 80, { includeScrollHint: true })).toBe(
      "Showing latest 40 of 80 messages. Scroll up to load older messages.",
    )
    expect(formatChatRuntimeLoadEarlierLabel(350, 120)).toBe("Load 120 earlier")
    expect(formatChatRuntimeLoadEarlierLabel(30, 120)).toBe("Load 30 earlier")
    expect(formatChatRuntimeLoadEarlierLabel(30, 120, true)).toBe("Loading...")
    expect(getChatRuntimeMessageHistoryBannerState({
      visibleCount: 120,
      totalCount: 240,
      loadIncrement: 50,
      isLoadingEarlier: true,
    })).toMatchObject({
      shouldRender: true,
      hiddenCount: 120,
      summaryLabel: "Showing latest 120 of 240 messages",
      loadEarlierLabel: "Loading...",
    })
    expect(formatChatRuntimeAssistantFeedbackContent("Reasoning", true)).toBe("Reasoning")
    expect(formatChatRuntimeAssistantFeedbackContent("First thought\nSecond thought", true)).toBe(
      "First thought\n\nSecond thought",
    )
    expect(formatChatRuntimeAssistantFeedbackContent("", true)).toBe("Executing tools...")
    expect(formatChatRuntimeAssistantFeedbackContent("", false)).toBe("")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.desktop.containerClassName).toContain("border-amber-300")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.desktop.argumentsPreviewClassName).toContain("line-clamp-2")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.card.borderColorToken).toBe("warning")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.argumentsPreview.numberOfLines).toBe(2)
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.fullArguments.maxHeight).toBe(180)
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.button.minHeight).toBe(36)
    expect(formatChatRuntimeBranchAccessibilityLabel("assistant", 3)).toBe(
      "Branch conversation from assistant message 3",
    )
    expect(isChatRuntimeBranchableMessageRole("user")).toBe(true)
    expect(isChatRuntimeBranchableMessageRole("assistant")).toBe(true)
    expect(isChatRuntimeBranchableMessageRole("tool")).toBe(false)
    expect(isChatRuntimeBranchableMessageRole(undefined)).toBe(false)
    expect(getChatRuntimeBranchActionState({
      conversationId: "conv-1",
      role: "assistant",
      branchMessageIndex: 2,
      fallbackMessageIndex: 9,
    })).toEqual({
      canBranch: true,
      messageIndex: 2,
      isPending: false,
      isDisabled: false,
      accessibilityLabel: "Branch conversation from assistant message 3",
      accessibilityState: { disabled: false },
    })
    expect(getChatRuntimeBranchActionAccessibilityLabel({
      accessibilityLabel: "Branch conversation from assistant message 3",
    })).toBe("Branch conversation from assistant message 3")
    expect(getChatRuntimeBranchActionAccessibilityLabel({
      accessibilityLabel: null,
    })).toBe(CHAT_RUNTIME_PRESENTATION.branch.buttonAccessibilityLabel)
    expect(getChatRuntimeBranchActionTitle()).toBe(CHAT_RUNTIME_PRESENTATION.branch.buttonTitle)
    expect(getChatRuntimeBranchMobileRenderState({
      conversationId: "conv-1",
      role: "assistant",
      branchMessageIndex: 2,
      colors: {
        mutedForeground: "#64748b",
        primary: "#2563eb",
        success: "#16a34a",
        warning: "#d97706",
      },
    })).toEqual({
      canBranch: true,
      messageIndex: 2,
      isPending: false,
      isDisabled: false,
      accessibilityRole: "button",
      accessibilityLabel: "Branch conversation from assistant message 3",
      accessibilityState: { disabled: false },
      icon: {
        isPending: false,
        name: CHAT_RUNTIME_PRESENTATION.branch.mobileIcon.name,
        size: CHAT_RUNTIME_PRESENTATION.branch.mobileIcon.size,
        color: "#2563eb",
      },
    })
    expect(getChatRuntimeBranchMobileAlertState()).toEqual({
      unavailable: {
        title: CHAT_RUNTIME_PRESENTATION.branch.unavailableTitle,
        message: CHAT_RUNTIME_PRESENTATION.branch.unavailableMessage,
      },
      created: {
        title: CHAT_RUNTIME_PRESENTATION.branch.createdTitle,
        message: CHAT_RUNTIME_PRESENTATION.branch.createdMessage,
      },
      failed: {
        title: CHAT_RUNTIME_PRESENTATION.branch.failedTitle,
        fallbackMessage: CHAT_RUNTIME_PRESENTATION.branch.failedMessage,
      },
    })
    expect(getChatRuntimeBranchUnavailableMobileResolvedAlertState()).toEqual({
      title: CHAT_RUNTIME_PRESENTATION.branch.unavailableTitle,
      message: CHAT_RUNTIME_PRESENTATION.branch.unavailableMessage,
    })
    expect(getChatRuntimeBranchCreatedMobileResolvedAlertState()).toEqual({
      title: CHAT_RUNTIME_PRESENTATION.branch.createdTitle,
      message: CHAT_RUNTIME_PRESENTATION.branch.createdMessage,
    })
    expect(getChatRuntimeBranchFailedMobileResolvedAlertState(new Error("No session"))).toEqual({
      title: CHAT_RUNTIME_PRESENTATION.branch.failedTitle,
      message: "No session",
    })
    expect(getChatRuntimeBranchActionState({
      conversationId: "conv-1",
      role: "user",
      fallbackMessageIndex: 4,
    })).toEqual({
      canBranch: true,
      messageIndex: 4,
      isPending: false,
      isDisabled: false,
      accessibilityLabel: "Branch conversation from user message 5",
      accessibilityState: { disabled: false },
    })
    expect(getChatRuntimeBranchActionState({
      conversationId: "conv-1",
      role: "assistant",
      branchMessageIndex: 2,
      pendingMessageIndex: 2,
    })).toEqual({
      canBranch: true,
      messageIndex: 2,
      isPending: true,
      isDisabled: true,
      accessibilityLabel: "Branch conversation from assistant message 3",
      accessibilityState: { disabled: true },
    })
    expect(getChatRuntimeBranchActionState({
      conversationId: "conv-1",
      role: "assistant",
      branchMessageIndex: 2,
      pendingMessageIndex: 4,
    })).toMatchObject({
      canBranch: true,
      messageIndex: 2,
      isPending: false,
      isDisabled: true,
      accessibilityState: { disabled: true },
    })
    expect(getChatRuntimeBranchActionState({
      conversationId: "conv-1",
      role: "tool",
      branchMessageIndex: 2,
    })).toEqual({
      canBranch: false,
      messageIndex: null,
      isPending: false,
      isDisabled: false,
      accessibilityLabel: null,
      accessibilityState: { disabled: false },
    })
    expect(getChatRuntimeBranchActionState({
      role: "assistant",
      branchMessageIndex: 2,
    }).canBranch).toBe(false)
    expect(getChatRuntimePinDisplayLabel(false)).toBe("Pin")
    expect(getChatRuntimePinDisplayLabel(true)).toBe("Pinned")
    expect(getChatRuntimePinAccessibilityLabel(false)).toBe("Pin chat")
    expect(getChatRuntimePinAccessibilityLabel(true)).toBe("Unpin chat")
    expect(getChatRuntimePinAccessibilityHint(false)).toBe("Keeps this chat at the top of the chats list.")
    expect(getChatRuntimePinAccessibilityHint(true)).toBe("Removes this chat from the pinned chats list.")
    expect(CHAT_RUNTIME_PRESENTATION.pin.mobileIcon).toMatchObject({
      pinnedName: "pin",
      unpinnedName: "pin-outline",
      size: 16,
    })
    expect(getChatRuntimePinMobileIconState(false)).toEqual({
      isPinned: false,
      name: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.unpinnedName,
      size: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.size,
      colorToken: "mutedForeground",
    })
    expect(getChatRuntimePinMobileIconState(true)).toEqual({
      isPinned: true,
      name: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.pinnedName,
      size: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.size,
      colorToken: "primary",
    })
    expect(getChatRuntimePinMobileActionState(false)).toEqual({
      isPinned: false,
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      accessibilityLabel: CHAT_RUNTIME_PRESENTATION.pin.pinChatLabel,
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.pin.pinChatHint,
      icon: {
        isPinned: false,
        name: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.unpinnedName,
        size: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.size,
        colorToken: "mutedForeground",
      },
    })
    expect(getChatRuntimePinMobileActionState(true)).toEqual({
      isPinned: true,
      accessibilityRole: "button",
      pressedOpacity: 0.78,
      accessibilityLabel: CHAT_RUNTIME_PRESENTATION.pin.unpinChatLabel,
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.pin.unpinChatHint,
      icon: {
        isPinned: true,
        name: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.pinnedName,
        size: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.size,
        colorToken: "primary",
      },
    })
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop.iconClassNames.needsInput).toBe(
      "h-3.5 w-3.5 text-amber-500 animate-pulse",
    )
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop.iconClassNames.blocked).toBe(
      "h-3.5 w-3.5 text-red-500",
    )
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop.iconClassNames.background).toBe(
      "h-3.5 w-3.5 text-muted-foreground",
    )
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop.iconClassNames.complete).toBe(
      "h-3.5 w-3.5 text-green-500",
    )
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop.loadingSpinnerClassName).toBe(
      "[&>div]:gap-0 [&_img]:h-3.5 [&_img]:w-3.5",
    )
    expect(getSessionStatusDesktopSurfaceState()).toBe(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop)
    expect(getSessionStatusDesktopRenderState(
      getSessionPresentation({ conversationState: "needs_input" }),
    )).toMatchObject({
      kind: "needs_input",
      iconClassName: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop.iconClassNames.needsInput,
      loadingSpinnerClassName: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop.loadingSpinnerClassName,
    })
    expect(getSessionStatusDesktopRenderState(
      getSessionPresentation({ conversationState: "blocked" }),
    )).toMatchObject({
      kind: "blocked",
      iconClassName: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop.iconClassNames.blocked,
    })
    expect(getSessionStatusDesktopRenderState(
      getSessionPresentation({ conversationState: "running", isSnoozed: true }),
    )).toMatchObject({
      kind: "background",
      iconClassName: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop.iconClassNames.background,
    })
    expect(getSessionStatusDesktopRenderState(
      getSessionPresentation({ conversationState: "running" }),
    )).toMatchObject({
      kind: "running",
      iconClassName: "",
      loadingSpinnerClassName: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop.loadingSpinnerClassName,
    })
    expect(getSessionStatusDesktopRenderState(
      getSessionPresentation({ conversationState: "complete", isComplete: true }),
    )).toMatchObject({
      kind: "complete",
      iconClassName: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.desktop.iconClassNames.complete,
    })
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.flexDirection).toBe("row")
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.alignItems).toBe("center")
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.borderRadius).toBe(999)
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chipText.fontSize).toBe(12)
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chipText.lineHeight).toBe(16)
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chipText.fontWeight).toBe("700")
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.runningIndicator.size).toBe(14)
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.runningIndicator.resizeMode).toBe("contain")
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.intents.active.colorToken).toBe("info")
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.intents.warning.colorToken).toBe("warning")
    expect(getSessionStatusMobileSurfaceState()).toBe(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile)
    const sessionStatusMobileColors = {
      info: "#3b82f6",
      success: "#22c55e",
      warning: "#f59e0b",
      destructive: "#ef4444",
      mutedForeground: "#737373",
    }
    expect(getSessionStatusMobileColors(
      { conversationState: "running" },
      sessionStatusMobileColors,
    )).toEqual({
      backgroundColor: "rgba(59, 130, 246, 0.12)",
      borderColor: "rgba(59, 130, 246, 0.35)",
      textColor: "#3b82f6",
    })
    expect(getChatSessionStatusMobileStyleState({
      backgroundColor: "rgba(59, 130, 246, 0.12)",
      borderColor: "rgba(59, 130, 246, 0.35)",
      textColor: "#3b82f6",
    })).toEqual({
      chip: {
        backgroundColor: "rgba(59, 130, 246, 0.12)",
        borderColor: "rgba(59, 130, 246, 0.35)",
      },
      text: {
        color: "#3b82f6",
      },
    })
    expect(createChatSessionStatusMobileChromeStyleSlots({
      surface: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile,
    })).toEqual({
      chip: {
        flexDirection: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.flexDirection,
        alignItems: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.alignItems,
        gap: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.gap,
        borderWidth: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.borderWidth,
        borderRadius: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.borderRadius,
        paddingHorizontal: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.paddingHorizontal,
        paddingVertical: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.paddingVertical,
        marginHorizontal: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.marginHorizontal,
      },
      text: {
        fontSize: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chipText.fontSize,
        lineHeight: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chipText.lineHeight,
        fontWeight: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chipText.fontWeight,
      },
      spinner: {
        width: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.runningIndicator.size,
        height: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.runningIndicator.size,
      },
    })
    expect(getSessionStatusMobileStyleRenderState({
      colors: sessionStatusMobileColors,
    })).toMatchObject({
      surface: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile,
      colors: {
        active: {
          backgroundColor: "rgba(59, 130, 246, 0.12)",
          borderColor: "rgba(59, 130, 246, 0.35)",
          textColor: "#3b82f6",
        },
        background: {
          textColor: "#737373",
        },
        success: {
          textColor: "#22c55e",
        },
        warning: {
          textColor: "#f59e0b",
        },
        danger: {
          textColor: "#ef4444",
        },
      },
      styles: {
        active: {
          chip: {
            backgroundColor: "rgba(59, 130, 246, 0.12)",
            borderColor: "rgba(59, 130, 246, 0.35)",
          },
          text: {
            color: "#3b82f6",
          },
        },
      },
    })
    expect(getSessionStatusMobileRenderState({
      session: { conversationState: "running" },
      colors: sessionStatusMobileColors,
    })).toMatchObject({
      shouldRender: true,
      presentation: getSessionPresentation({ conversationState: "running" }),
      label: "Running",
      surface: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile,
      colors: {
        backgroundColor: "rgba(59, 130, 246, 0.12)",
        borderColor: "rgba(59, 130, 246, 0.35)",
        textColor: "#3b82f6",
      },
      styles: {
        chip: {
          backgroundColor: "rgba(59, 130, 246, 0.12)",
          borderColor: "rgba(59, 130, 246, 0.35)",
        },
        text: {
          color: "#3b82f6",
        },
      },
      isRunning: true,
      runningIndicator: {
        shouldRender: true,
        size: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.runningIndicator.size,
        resizeMode: CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.runningIndicator.resizeMode,
      },
    })
    expect(getSessionStatusMobileRenderState({
      session: null,
      colors: sessionStatusMobileColors,
    })).toMatchObject({
      shouldRender: false,
      presentation: null,
      label: "",
      isRunning: false,
      runningIndicator: {
        shouldRender: false,
      },
    })
    expect(getSessionStatusMobileColors(
      { conversationState: "needs_input" },
      sessionStatusMobileColors,
    ).textColor).toBe("#f59e0b")
    expect(formatChatRuntimeConnectionErrorMessage("Lost", { status: "reconnecting", retryCount: 2 })).toBe(
      "Connection lost. Attempted 2 reconnections. Lost",
    )
    expect(formatChatRuntimeAssistantErrorContent("Lost")).toContain('tap "Retry"')
    expect(formatChatRuntimeAssistantErrorContent("Lost", "Partial")).toBe(
      "Partial\n\n---\nConnection lost. Partial response shown above.\n\nError: Lost",
    )
  })
})
