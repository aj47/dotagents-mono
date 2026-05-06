import { describe, expect, it } from "vitest"

import {
  deriveAttentionState,
  deriveLifecycleState,
  getFollowUpInputPresentation,
  getSessionPresentation,
  getSidebarStatusPresentation,
} from "@dotagents/shared/session-presentation"

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
  })

  it("promotes selected snoozed running sessions to foreground sidebar treatment without changing copy", () => {
    const presentation = getSessionPresentation({
      conversationState: "running",
      isSnoozed: true,
      isCurrentView: true,
    })
    const sidebar = getSidebarStatusPresentation({
      conversationState: "running",
      isSnoozed: true,
      isCurrentView: true,
    })

    expect(presentation.lifecycleState).toBe("running")
    expect(presentation.label).toBe("Running in background")
    expect(sidebar.attentionState).toBe("foreground")
    expect(sidebar.railClassName).toBe("bg-blue-500")
    expect(sidebar.shouldPulse).toBe(true)
  })

  it("prioritizes pending approval and blocked state above running/background", () => {
    expect(deriveLifecycleState({ conversationState: "running", pendingToolApproval: { id: "approval" } })).toBe("needs_input")
    expect(deriveLifecycleState({ conversationState: "running", hasErrors: true })).toBe("blocked")
    expect(getSidebarStatusPresentation({ pendingToolApproval: true }).railClassName).toBe("bg-amber-500")
    expect(getSidebarStatusPresentation({ wasStopped: true }).railClassName).toBe("bg-red-500")
  })

  it("uses green only for complete/success sidebar state", () => {
    expect(getSidebarStatusPresentation({ conversationState: "running", isSnoozed: false }).railClassName).toBe("bg-blue-500")
    expect(getSidebarStatusPresentation({ conversationState: "running", isSnoozed: true }).railClassName).toBe("bg-muted-foreground/60")
    expect(getSidebarStatusPresentation({ conversationState: "complete" }).railClassName).toBe("bg-green-500")
  })

  it("keeps a recent final response visually prominent before settling to complete", () => {
    const sidebar = getSidebarStatusPresentation({
      conversationState: "complete",
      isComplete: true,
      hasRecentFinalResponse: true,
    })

    expect(sidebar.railClassName).toBe("bg-emerald-500")
    expect(sidebar.pinnedIconClassName).toBe("text-emerald-500")
    expect(sidebar.shouldPulse).toBe(false)
    expect(sidebar.isForeground).toBe(true)
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
})
