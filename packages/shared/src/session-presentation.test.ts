import { describe, expect, it } from "vitest"

import {
  CHAT_RUNTIME_PRESENTATION,
  deriveAttentionState,
  deriveLifecycleState,
  formatChatRuntimeAssistantErrorContent,
  formatChatRuntimeBranchAccessibilityLabel,
  formatChatRuntimeConnectionErrorMessage,
  formatChatRuntimeToolApprovalFailureMessage,
  formatChatRuntimeWebConfirmMessage,
  getChatRuntimeAlertMessage,
  getFollowUpInputPresentation,
  getSessionPresentation,
  getSidebarStatusPresentation,
} from "./session-presentation"

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
    expect(CHAT_RUNTIME_PRESENTATION.killSwitch.title).toBe("Emergency Stop")
    expect(formatChatRuntimeWebConfirmMessage("Title", "Body")).toBe("Title\n\nBody")
    expect(getChatRuntimeAlertMessage(new Error("Network"), "Fallback")).toBe("Network")
    expect(getChatRuntimeAlertMessage("", "Fallback")).toBe("Fallback")
    expect(formatChatRuntimeToolApprovalFailureMessage("approve", new Error("Nope"))).toBe(
      "Failed to approve tool call. Nope",
    )
    expect(formatChatRuntimeToolApprovalFailureMessage("deny", null)).toBe(
      "Failed to deny tool call. Please try again.",
    )
    expect(formatChatRuntimeBranchAccessibilityLabel("assistant", 3)).toBe(
      "Branch conversation from assistant message 3",
    )
    expect(formatChatRuntimeConnectionErrorMessage("Lost", { status: "reconnecting", retryCount: 2 })).toBe(
      "Connection lost. Attempted 2 reconnections. Lost",
    )
    expect(formatChatRuntimeAssistantErrorContent("Lost")).toContain('tap "Retry"')
    expect(formatChatRuntimeAssistantErrorContent("Lost", "Partial")).toBe(
      "Partial\n\n---\nConnection lost. Partial response shown above.\n\nError: Lost",
    )
  })
})
