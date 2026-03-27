export type AgentConversationState = 'running' | 'complete' | 'needs_input' | 'blocked'

const VALID_AGENT_CONVERSATION_STATES = new Set<AgentConversationState>([
  'running',
  'complete',
  'needs_input',
  'blocked',
])

function isAgentConversationState(value: unknown): value is AgentConversationState {
  return typeof value === 'string' && VALID_AGENT_CONVERSATION_STATES.has(value as AgentConversationState)
}

export function normalizeAgentConversationState(
  value: unknown,
  fallback: AgentConversationState = 'running',
): AgentConversationState {
  return isAgentConversationState(value) ? value : fallback
}

export function getAgentConversationStateLabel(state: AgentConversationState): string {
  switch (state) {
    case 'running':
      return 'Running'
    case 'complete':
      return 'Complete'
    case 'needs_input':
      return 'Needs input'
    case 'blocked':
      return 'Blocked'
    default:
      return 'Running'
  }
}
