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
  createChatRuntimeConnectionBannerMobileStyleSlots,
  createChatRuntimeCompletedDebugState,
  createChatRuntimeAgentSelectorMobileStyleSlots,
  createChatRuntimeHeaderActionsRowMobileStyleSlot,
  createChatRuntimeHeaderIconContainerMobileStyleSlot,
  createChatRuntimeHeaderPinButtonMobileStyleSlot,
  createChatRuntimeNoSessionAvailableDebugState,
  createChatRuntimeProcessingQueuedMessageDebugState,
  createChatRuntimeRequestSentDebugState,
  createChatRuntimeRequestSupersededQueueFailureState,
  createChatRuntimeSessionChangedDuringProcessingQueueFailureState,
  createChatRuntimeStartingRequestDebugState,
  createChatRuntimeRetryStatusMobileStyleSlots,
  createChatRuntimeScrollToBottomMobileStyleSlots,
  createChatRuntimeStepSummaryMobileStyleSlots,
  createChatRuntimeStreamingContentMobileStyleSlots,
  createChatRuntimeViewportActivityMobileStyleSlots,
  createChatComposerRuntimeImagePickerLaunchOptions,
  createChatRuntimeMessageActionButtonMobileStyleSlots,
  createChatRuntimeTurnDurationHeaderMobileStyleSlots,
  createChatRuntimeTurnDurationMessageMobileStyleSlots,
  createChatRuntimeThemeSpinnerSource,
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
  getChatComposerRuntimeDraftMessageState,
  createChatComposerRuntimeHandsFreePermissionDeniedDebugState,
  createChatComposerRuntimeHandsFreeRecognizerErrorDebugState,
  createChatComposerRuntimeHandsFreeTranscriptAddedDebugState,
  formatChatComposerRuntimeHandsFreeSleepingDebugMessage,
  getChatComposerRuntimeFollowUpPresentationState,
  getChatComposerRuntimeHandsFreeDebugMessage,
  getChatComposerRuntimeHandsFreeControlsMobileRenderState,
  getChatComposerRuntimeTextEntryMobileRenderState,
  getChatComposerRuntimeImageDataUrlBytes,
  getChatComposerRuntimeDockMobileRenderState,
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
  getChatRuntimeConversationMessageActionsMobileRenderState,
  getChatRuntimeConversationMessageRuntimeThreadState,
  getChatRuntimeConversationMessageRenderContextMobileState,
  getChatRuntimeConversationMessageThreadMobileState,
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
  createChatRuntimeMessageHistoryBannerMobileStyleSlots,
  getChatRuntimeMobileChromeStyleRenderState,
  getChatRuntimeMobileSafeAreaLayoutState,
  getChatRuntimeMobileActivityAccessibilityState,
  getChatRuntimeMessageThreadPresentationMobileRenderState,
  getChatRuntimeNavigationHeaderMobileRenderState,
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
    expect(getChatComposerQueueMobileActionState()).toEqual({
      isDisabled: false,
      label: CHAT_COMPOSER_PRESENTATION.queue.label,
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
    expect(composerChromeStyle.imageAttachment.colors.preview.borderColor).toBe("#cbd5e1")
    expect(composerChromeStyle.promptLibrary.colors.editorModal.saveButton.backgroundColor).toBe("#2563eb")
    expect(composerChromeStyle.promptEditorInputPaddingVertical).toBe(10)
    expect(composerChromeStyle.handsFree.colors.controlButton.borderColor).toBe("#cbd5e1")
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
    const runtimeChromeStyle = getChatRuntimeMobileChromeStyleRenderState({
      colors: chatRuntimeMobileChromeColors,
      platform: "android",
    })
    expect(runtimeChromeStyle.header.header.surface.agentSelectorButton.minHeight).toBe(44)
    expect(runtimeChromeStyle.composer.promptEditorInputPaddingVertical).toBe(8)
    expect(runtimeChromeStyle.messageQueuePanelWrapper.wrapper.paddingHorizontal).toBe("md")
    expect(runtimeChromeStyle.headerActionButton.minWidth).toBe(44)
    expect(runtimeChromeStyle.thread.toolApproval.title).toBe("Tool Approval Required")
    expect(getChatComposerMobileTextInputPlatformState("ios")).toEqual({ paddingVertical: 10 })
    expect(getChatComposerMobileTextInputPlatformState("android")).toEqual({ paddingVertical: 8 })
    expect(getChatComposerMobileTextInputPlatformState("web")).toEqual({ paddingVertical: 10 })
    expect(CHAT_COMPOSER_PRESENTATION.submit.sendLabel).toBe("Send")
    expect(CHAT_COMPOSER_PRESENTATION.submit.mobileIcon.name).toBe("send-outline")
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
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.minWidth).toBe(64)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.foregroundColorToken).toBe("primaryForeground")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.pressedOpacity).toBe(0.7)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.flexDirection).toBe("row")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.alignItems).toBe("center")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.submitButton.justifyContent).toBe("center")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.textColorToken).toBe("foreground")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.queueButton.pressedOpacity).toBe(0.7)
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
      touchTarget: {
        minWidth: 44,
        minHeight: 44,
        paddingHorizontal: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.horizontalPadding,
        paddingVertical: CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.verticalPadding,
        marginHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
      },
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
    expect(navigationHeaderState.killSwitchButtonShouldRender).toBe(true)
    expect(navigationHeaderState.handsFreeButtonRenderState.isEnabled).toBe(true)
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
    expect(getChatRuntimeConversationChromeMobileStyleRenderState({
      colors: conversationChromeStyleColors,
    })).toEqual({
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
    expect(viewportChrome.affordance.historyBanner.renderState.shouldRender).toBe(true)
    expect(viewportChrome.affordance.stepSummary.renderState.shouldRender).toBe(true)
    expect(viewportChrome.debugPanels.requestShouldRender).toBe(true)
    expect(viewportChrome.debugPanels.voiceShouldRender).toBe(true)
    const surfaceChrome = getChatRuntimeSurfaceChromeMobileRenderState({
      colors: viewportChromeColors,
      platform: "ios",
    })
    expect(surfaceChrome.frame.keyboardAvoidingBehavior).toBe("padding")
    expect(surfaceChrome.promptEditor.renderState.keyboardAvoidingBehavior).toBe("padding")
    expect(surfaceChrome.promptEditor.renderState.copy.nameLabel).toBe("Name")
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
    expect(messageThreadStyle.action.row).toMatchObject({
      flexDirection: "row",
      justifyContent: "flex-end",
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
    const delegationPresentationState = getChatRuntimeDelegationCardMobilePresentationState({
      ...delegationCardState,
      delegation: {
        runId: "run-1",
        agentName: "Worker",
        task: "Inspect files",
        status: "running",
        startTime: 1_700_000_000_000,
        conversation: [{
          role: "assistant",
          content: "Looking through the changed files.",
          timestamp: 1_700_000_010_000,
        }],
      },
      toolEntries: [{
        toolCall: { name: "read_file", arguments: { path: "/tmp/file.ts" } },
        label: "read_file:/tmp/file.ts",
        origIdx: 0,
        result: { success: true, content: "ok" },
      }],
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
    conversationToolExecutionStackState.detailRows[0].onHeaderPress()
    conversationToolExecutionStackState.detailRows[0].input?.onCopyPress()
    conversationToolExecutionStackState.compact.onToggle()
    conversationToolExecutionStackState.expanded.onToggle()
    expect(toolExecutionStackEvents).toEqual([
      "tool:4:2",
      "copy-payload:{\n  \"path\": \"/tmp/file\"\n}",
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
    expect(threadChromeStyle.toolExecutionDetail.payloadPreview.numberOfLines).toBe(2)
    expect(threadChromeStyle.toolActivityGroup.colors.countBadge.color).toBe("#0ea5e9")
    expect(threadChromeStyle.toolApproval.title).toBe("Tool Approval Required")
    expect(threadChromeStyle.messageThread.message.surface.paddingHorizontal).toBe("sm")
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
