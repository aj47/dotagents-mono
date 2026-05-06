import {
  getAgentConversationStateLabel,
  normalizeAgentConversationState,
  type AgentConversationState,
} from "./conversation-state"

export type SessionLifecycleState = AgentConversationState
export type SessionAttentionState = "foreground" | "background"
export type SessionPresentationIntent = "active" | "background" | "success" | "warning" | "danger"
export type FollowUpInputMode = "initializing" | "queue" | "send" | "disabled"
export type SidebarStatusIntent = "active" | "background" | "success" | "needs_input" | "blocked" | "response"

export interface SessionPresentationInput {
  conversationState?: unknown
  isComplete?: boolean
  pendingToolApproval?: unknown
  hasErrors?: boolean
  wasStopped?: boolean
  sessionStatus?: "active" | "completed" | "complete" | "error" | "stopped" | "running" | string
  isSnoozed?: boolean
  isCurrentView?: boolean
  isFocused?: boolean
  isSessionExpanded?: boolean
  hasActiveChildProgress?: boolean
  hasUnreadResponse?: boolean
  hasAnalyzingOrPlanningProgress?: boolean
  hasForegroundActivity?: boolean
  hasRecentFinalResponse?: boolean
  isQueueEnabled?: boolean
  isInitializingSession?: boolean
}

export interface SessionPresentation {
  lifecycleState: SessionLifecycleState
  attentionState: SessionAttentionState
  intent: SessionPresentationIntent
  label: string
  badgeClassName: string
}

export interface FollowUpInputPresentation {
  mode: FollowUpInputMode
  placeholder: string
  isDisabled: boolean
  submitTitle: string
  submitAriaLabel: string
  voiceTitle: string
}

export interface SidebarStatusPresentation {
  lifecycleState: SessionLifecycleState
  attentionState: SessionAttentionState
  intent: SidebarStatusIntent
  railClassName: string
  pinnedIconClassName: string
  shouldPulse: boolean
  isForeground: boolean
}

export function deriveLifecycleState(input: SessionPresentationInput): SessionLifecycleState {
  const status = input.sessionStatus

  if (input.pendingToolApproval) return "needs_input"
  if (input.hasErrors || input.wasStopped || status === "error" || status === "stopped") return "blocked"
  if (input.isComplete || status === "completed" || status === "complete") return "complete"

  const fallback: SessionLifecycleState = "running"

  return input.conversationState
    ? normalizeAgentConversationState(input.conversationState, fallback)
    : fallback
}

export function deriveAttentionState(input: SessionPresentationInput): SessionAttentionState {
  const lifecycleState = deriveLifecycleState(input)
  const hasForegroundAttention = !!(
    input.isCurrentView ||
    input.isFocused ||
    input.isSessionExpanded ||
    input.hasActiveChildProgress ||
    input.hasUnreadResponse ||
    input.hasAnalyzingOrPlanningProgress ||
    input.hasForegroundActivity ||
    input.hasRecentFinalResponse
  )

  if (lifecycleState !== "running") return hasForegroundAttention ? "foreground" : "background"
  if (!input.isSnoozed || hasForegroundAttention) return "foreground"
  return "background"
}

export function getSessionPresentation(input: SessionPresentationInput): SessionPresentation {
  const lifecycleState = deriveLifecycleState(input)
  const attentionState = deriveAttentionState(input)
  const intent: SessionPresentationIntent = lifecycleState === "needs_input"
    ? "warning"
    : lifecycleState === "blocked"
      ? "danger"
      : lifecycleState === "complete"
        ? "success"
        : attentionState === "background"
          ? "background"
          : "active"
  const label = lifecycleState === "running" && input.isSnoozed
    ? "Running in background"
    : getAgentConversationStateLabel(lifecycleState)
  const badgeClassName = intent === "success"
    ? "border-green-500 text-green-700 dark:border-green-700 dark:text-green-300"
    : intent === "warning"
      ? "border-amber-500 text-amber-700 dark:border-amber-700 dark:text-amber-300"
      : intent === "danger"
        ? "border-red-500 text-red-700 dark:border-red-700 dark:text-red-300"
        : intent === "background"
          ? "border-muted-foreground/40 text-muted-foreground"
          : "border-blue-500 text-blue-700 dark:border-blue-700 dark:text-blue-300"

  return { lifecycleState, attentionState, intent, label, badgeClassName }
}

export function getFollowUpInputPresentation(input: SessionPresentationInput): FollowUpInputPresentation {
  const lifecycleState = deriveLifecycleState(input)
  const isActiveLifecycle = lifecycleState === "running" || lifecycleState === "needs_input"

  if (input.isInitializingSession) {
    return {
      mode: "initializing",
      placeholder: "",
      isDisabled: true,
      submitTitle: "Starting follow-up",
      submitAriaLabel: "Starting follow-up",
      voiceTitle: "Voice unavailable while session starts",
    }
  }

  if (isActiveLifecycle && input.isQueueEnabled) {
    return {
      mode: "queue",
      placeholder: "Queue next message...",
      isDisabled: false,
      submitTitle: "Queue next message",
      submitAriaLabel: "Queue next message",
      voiceTitle: "Record voice message (will be queued)",
    }
  }

  if (isActiveLifecycle) {
    return {
      mode: "disabled",
      placeholder: "",
      isDisabled: true,
      submitTitle: "Agent is processing",
      submitAriaLabel: "Agent is processing",
      voiceTitle: "Voice unavailable while agent is processing",
    }
  }

  return {
    mode: "send",
    placeholder: "Continue conversation...",
    isDisabled: false,
    submitTitle: "Send message",
    submitAriaLabel: "Send message",
    voiceTitle: "Continue with voice",
  }
}

export function getSidebarStatusPresentation(input: SessionPresentationInput): SidebarStatusPresentation {
  const { lifecycleState, attentionState } = getSessionPresentation(input)
  if (lifecycleState === "needs_input") {
    return { lifecycleState, attentionState, intent: "needs_input", railClassName: "bg-amber-500", pinnedIconClassName: "text-amber-500", shouldPulse: false, isForeground: true }
  }
  if (lifecycleState === "blocked") {
    return { lifecycleState, attentionState, intent: "blocked", railClassName: "bg-red-500", pinnedIconClassName: "text-red-500", shouldPulse: false, isForeground: true }
  }
  if (input.hasRecentFinalResponse) {
    return { lifecycleState, attentionState, intent: "response", railClassName: "bg-emerald-500", pinnedIconClassName: "text-emerald-500", shouldPulse: false, isForeground: true }
  }
  if (lifecycleState === "complete") {
    return { lifecycleState, attentionState, intent: "success", railClassName: "bg-green-500", pinnedIconClassName: "text-green-500", shouldPulse: false, isForeground: false }
  }
  if (attentionState === "foreground") {
    return { lifecycleState, attentionState, intent: "active", railClassName: "bg-blue-500", pinnedIconClassName: "text-blue-500", shouldPulse: true, isForeground: true }
  }
  return { lifecycleState, attentionState, intent: "background", railClassName: "bg-muted-foreground/60", pinnedIconClassName: "text-muted-foreground", shouldPulse: false, isForeground: false }
}
