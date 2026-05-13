import { describe, expect, it } from "vitest"

import {
  CHAT_COMPOSER_PRESENTATION,
  CHAT_COMPOSER_SURFACE_PRESENTATION,
  CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION,
  CHAT_RUNTIME_SURFACE_PRESENTATION,
  CHAT_SESSION_STATUS_SURFACE_PRESENTATION,
  CHAT_RUNTIME_PRESENTATION,
  TOOL_APPROVAL_SURFACE_PRESENTATION,
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
  formatChatRuntimeStepSummaryMeta,
  formatChatRuntimeStepSummaryPreview,
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
  getChatComposerMobileControlState,
  getChatComposerMobileIconColors,
  getChatComposerMobileSurfaceRenderState,
  getChatComposerMobileSurfaceState,
  getChatComposerMobileSurfaceColors,
  getChatComposerMobileTextColors,
  getChatComposerQueueMobileActionState,
  getChatComposerQueueMobileIconState,
  getChatComposerQueueMobileRenderState,
  getChatComposerSubmitMobileActionState,
  getChatComposerSubmitMobileIconState,
  getChatComposerSubmitMobileRenderState,
  getChatComposerTextToSpeechMobileIconState,
  getChatComposerTextToSpeechMobileRenderState,
  getChatRuntimeCopyState,
  getChatRuntimeCurrentAgentLabel,
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
  getChatRuntimeBranchMobileAlertState,
  getChatRuntimeBranchMobileIconState,
  getChatRuntimeBranchMobileRenderState,
  getChatRuntimeConnectionBannerMobileState,
  getChatRuntimeConnectionBannerMobileRenderState,
  getChatRuntimeConnectionBannerFailedMobileIconState,
  getChatRuntimeDelegationCardMobileColors,
  getChatRuntimeDelegationCardMobileRenderState,
  getChatRuntimeDelegationCardMobileState,
  getChatRuntimeDelegationConversationPreviewMoreActionState,
  getChatRuntimeDelegationConversationPreviewRoleMobileColors,
  getChatRuntimeDelegationConversationPreviewRoleMobileStyleState,
  getChatRuntimeDelegationStatusDesktopClassNames,
  getChatRuntimeDelegationToolPreviewMoreActionState,
  getChatRuntimeDesktopSurfaceState,
  isChatRuntimeBranchableMessageRole,
  getChatComposerVoiceOverlayLabel,
  getChatRuntimeDelegationStatusMobileColors,
  getChatRuntimeDelegationStatusMobileRenderState,
  getChatRuntimeHandsFreeAccessibilityHint,
  getChatRuntimeHandsFreeAccessibilityLabel,
  getChatRuntimeHandsFreeMobileActionState,
  getChatRuntimeHandsFreeMobileColors,
  getChatRuntimeHandsFreeMobileIconState,
  getChatRuntimeHandsFreeMobileRenderState,
  getChatRuntimeHeaderMobileSurfaceState,
  getChatRuntimeInlineActivityMobileState,
  getChatRuntimeKillSwitchMobileActionState,
  getChatRuntimeKillSwitchMobileAlertState,
  getChatRuntimeKillSwitchMobileColors,
  getChatRuntimeKillSwitchMobileIconState,
  getChatRuntimeKillSwitchMobileRenderState,
  getChatRuntimeLatestStepSummary,
  getChatRuntimeLoadingStateMobileState,
  getChatRuntimeMessageHistoryBannerMobileColors,
  getChatRuntimeMessageHistoryBannerMobileRenderState,
  getChatRuntimeMessageHistoryBannerMobileState,
  getChatRuntimeMessageHistoryLoadEarlierMobileIconState,
  getChatRuntimeMessageHistoryWindowMobileState,
  getChatRuntimeMobileSafeAreaLayoutState,
  getChatRuntimeMobileActivityAccessibilityState,
  getChatRuntimePinAccessibilityHint,
  getChatRuntimePinAccessibilityLabel,
  getChatRuntimePinDisplayLabel,
  getChatRuntimePinMobileActionState,
  getChatRuntimePinMobileColors,
  getChatRuntimePinMobileIconState,
  getChatRuntimePinMobileRenderState,
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
  getChatRuntimeStreamingContentMobileColors,
  getChatRuntimeStreamingContentMobileRenderState,
  getChatRuntimeStreamingContentMobileState,
  getChatRuntimeStreamingContentMobileIconState,
  getChatRuntimeStreamingContentTitle,
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
  getChatRuntimeToolApprovalMobileAlertState,
  getChatRuntimeToolApprovalMobileRenderState,
  getChatRuntimeToolApprovalMobileSurfaceColors,
  getChatRuntimeToolApprovalMobileSurfaceState,
  getChatRuntimeToolApprovalSpinnerMobileColors,
  getChatRuntimeTurnDurationBadgeState,
  getChatRuntimeTurnDurationHeaderMobileBadgeColors,
  getChatRuntimeTurnDurationHeaderMobileBadgeState,
  getChatRuntimeTurnDurationHeaderMobileRenderState,
  getChatRuntimeTurnDurationMessageMobileRenderState,
  getChatRuntimeTurnDurationMobileIconState,
  getChatRuntimeTurnDurationTitle,
  getChatRuntimeViewportMobileColors,
  getChatRuntimeViewportMobileKeyboardAvoidingBehavior,
  getChatRuntimeViewportMobileRenderState,
  getChatRuntimeViewportMobileState,
  getChatRuntimeAlertMessage,
  getChatSessionStatusMobileStyleState,
  getFollowUpInputPresentation,
  getSessionStatusMobileColors,
  getSessionStatusMobileRenderState,
  getSessionStatusMobileSurfaceState,
  getSessionPresentation,
  getSidebarStatusPresentation,
} from "./session-presentation"
import {
  CHAT_MESSAGE_ACTION_SURFACE_PRESENTATION,
  getChatMessageActionMobileTurnDurationBadgeColors,
  getChatMessageActionMobileTurnDurationBadgeState,
} from "./message-display-utils"

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
    expect(formatChatRuntimeDebugError(CHAT_RUNTIME_PRESENTATION.debug.noSessionAvailable)).toBe("Error: No session available")
    expect(formatChatRuntimeStartingRequestDebugMessage("http://localhost:3000")).toBe(
      "Starting request to http://localhost:3000...",
    )
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
    expect(CHAT_RUNTIME_PRESENTATION.killSwitch.buttonAccessibilityLabel).toContain("Emergency stop")
    expect(CHAT_RUNTIME_PRESENTATION.killSwitch.sessionTitle).toBe("Stop Agent Execution")
    expect(CHAT_RUNTIME_PRESENTATION.killSwitch.sessionActionLabel).toBe("Stop Agent")
    expect(CHAT_RUNTIME_PRESENTATION.killSwitch.sessionPendingActionLabel).toBe("Stopping...")
    expect(getChatComposerCopyState()).toBe(CHAT_COMPOSER_PRESENTATION)
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
      muted: "#e2e8f0",
      primary: "#2563eb",
    })).toEqual({
      inputArea: {
        borderColor: "#cbd5e1",
        backgroundColor: "#ffffff",
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
      muted: "#e2e8f0",
      mutedForeground: "#64748b",
      primary: "#2563eb",
      primaryForeground: "#ffffff",
    }
    expect(getChatComposerMobileSurfaceRenderState({
      colors: composerSurfaceRenderStateColors,
    })).toEqual({
      surface: getChatComposerMobileSurfaceState(),
      colors: {
        surface: getChatComposerMobileSurfaceColors(composerSurfaceRenderStateColors),
        text: getChatComposerMobileTextColors(composerSurfaceRenderStateColors),
      },
    })
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
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputArea.backgroundColorToken).toBe("card")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.borderRadius).toBe("md")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.labelColorToken).toBe("mutedForeground")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.sttPreview.labelFontWeight).toBe("600")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputRow.flexDirection).toBe("row")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.inputRow.alignItems).toBe("center")
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.flex).toBe(1)
    expect(CHAT_COMPOSER_SURFACE_PRESENTATION.mobile.input.maxHeight).toBe(120)
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
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.edgeActionButton.accessibilityRole).toBe("button")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.backIcon.colorToken).toBe("foreground")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.pinButton.accessibilityRole).toBe("button")
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
    expect(getChatRuntimePinMobileRenderState({
      isPinned: true,
      colors: pinMobileColors,
    })).toEqual({
      isPinned: true,
      accessibilityRole: "button",
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
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.durationChip.maxWidth).toBe(72)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.durationChip.numberOfLines).toBe(1)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.accessibilityRole).toBe("button")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.size).toBe(28)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.backgroundColorToken).toBe("destructive")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.iconColor).toBe("#FFFFFF")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.alignItems).toBe("center")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.killSwitchButton.justifyContent).toBe("center")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.accessibilityRole).toBe("switch")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.size).toBe(24)
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.inactiveIconColorToken).toBe("mutedForeground")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.activeIconColorToken).toBe("primary")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.alignItems).toBe("center")
    expect(CHAT_RUNTIME_HEADER_SURFACE_PRESENTATION.mobile.handsFreeButton.justifyContent).toBe("center")
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
      colors: getChatRuntimeViewportMobileColors({
        background: "#ffffff",
      }),
    })
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.spinnerSize).toBe(32)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.spinnerResizeMode).toBe("contain")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.accessibilityRole).toBe("progressbar")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState.accessibilityState).toEqual({ busy: true })
    expect(getChatRuntimeLoadingStateMobileState()).toBe(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.loadingState)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.spinnerSize).toBe(14)
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.spinnerResizeMode).toBe("contain")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.alignItems).toBe("center")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.accessibilityRole).toBe("progressbar")
    expect(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity.accessibilityState).toEqual({ busy: true })
    expect(getChatRuntimeInlineActivityMobileState()).toBe(CHAT_RUNTIME_SURFACE_PRESENTATION.mobile.inlineActivity)
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
    expect(formatChatRuntimeAgentSelectorAccessibilityLabel("Research")).toBe(
      "Current agent: Research. Tap to change.",
    )
    expect(getChatComposerVoiceOverlayLabel({ handsFree: true, willCancel: false })).toBe("Listening...")
    expect(getChatComposerVoiceOverlayLabel({ handsFree: false, willCancel: true })).toBe("Release to edit")
    expect(getChatComposerVoiceOverlayLabel({ handsFree: false, willCancel: false })).toBe("Release to send")
    expect(formatChatRuntimeWebConfirmMessage("Title", "Body")).toBe("Title\n\nBody")
    expect(getChatRuntimeAlertMessage(new Error("Network"), "Fallback")).toBe("Network")
    expect(getChatRuntimeAlertMessage("", "Fallback")).toBe("Fallback")
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
      primaryForeground: "#ffffff",
    }
    expect(getChatRuntimeToolApprovalHeaderMobileIconColors(toolApprovalColors)).toEqual({
      color: "#d97706",
    })
    const toolApprovalSurfaceColors = {
      warning: "#d97706",
      foreground: "#0f172a",
      mutedForeground: "#64748b",
      primary: "#2563eb",
      primaryForeground: "#ffffff",
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
        backgroundColor: "#2563eb",
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
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants.approve.foregroundColorToken).toBe("primaryForeground")
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonVariants.deny.borderColorToken).toBe("destructive")
    expect(getChatRuntimeToolApprovalActionMobileIconState("approve")).toEqual({
      action: "approve",
      name: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.approveName,
      size: TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonIcon.size,
      colorToken: "primaryForeground",
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
    expect(TOOL_APPROVAL_SURFACE_PRESENTATION.mobile.buttonSpinner.colorToken).toBe("primaryForeground")
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
    expect(getChatRuntimeStreamingContentTitle(true)).toBe("Generating response...")
    expect(getChatRuntimeStreamingContentTitle(false)).toBe("Response")
    const stepSummary = {
      stepNumber: 3,
      actionSummary: "Compared mobile and desktop chat chrome",
      importance: "high" as const,
      keyFindings: ["Mobile did not surface generated step summaries"],
    }
    expect(getChatRuntimeLatestStepSummary({ stepSummaries: [stepSummary] })).toBe(stepSummary)
    expect(getChatRuntimeLatestStepSummary({ latestSummary: stepSummary, stepSummaries: [] })).toBe(stepSummary)
    expect(formatChatRuntimeStepSummaryTitle(stepSummary)).toBe("Summary · Step 3")
    expect(formatChatRuntimeStepSummaryMeta(stepSummary)).toBe("Step 3 · High importance · 1 key finding")
    expect(formatChatRuntimeStepSummaryPreview(stepSummary)).toBe("Mobile did not surface generated step summaries")
    expect(formatChatRuntimeStepSummaryAccessibilityLabel(stepSummary)).toContain(
      "Compared mobile and desktop chat chrome",
    )
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
    expect(formatChatRuntimeVisibleUpdatesSummary(12)).toBe("Showing latest 12 updates")
    expect(formatChatRuntimeConversationHistorySummary(120, 240)).toBe("Showing latest 120 of 240 messages")
    expect(formatChatRuntimeConversationHistorySummary(40, 80, { includeScrollHint: true })).toBe(
      "Showing latest 40 of 80 messages. Scroll up to load older messages.",
    )
    expect(formatChatRuntimeLoadEarlierLabel(350, 120)).toBe("Load 120 earlier")
    expect(formatChatRuntimeLoadEarlierLabel(30, 120)).toBe("Load 30 earlier")
    expect(formatChatRuntimeLoadEarlierLabel(30, 120, true)).toBe("Loading...")
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
      accessibilityLabel: CHAT_RUNTIME_PRESENTATION.pin.unpinChatLabel,
      accessibilityHint: CHAT_RUNTIME_PRESENTATION.pin.unpinChatHint,
      icon: {
        isPinned: true,
        name: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.pinnedName,
        size: CHAT_RUNTIME_PRESENTATION.pin.mobileIcon.size,
        colorToken: "primary",
      },
    })
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.flexDirection).toBe("row")
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.alignItems).toBe("center")
    expect(CHAT_SESSION_STATUS_SURFACE_PRESENTATION.mobile.chip.borderRadius).toBe(999)
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
