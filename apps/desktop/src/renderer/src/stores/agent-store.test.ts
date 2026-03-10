import { beforeEach, describe, expect, it } from 'vitest'
import type { AgentProgressUpdate } from '@shared/types'
import { useAgentStore } from './agent-store'

const createBaseUpdate = (): AgentProgressUpdate => ({
  sessionId: 'session-1',
  runId: 1,
  conversationId: 'parent-conversation',
  currentIteration: 1,
  maxIterations: 1,
  isComplete: false,
  steps: [],
  conversationHistory: [],
})

describe('agent-store delegation merge', () => {
  beforeEach(() => {
    useAgentStore.setState({
      agentProgressById: new Map(),
      focusedSessionId: null,
      scrollToSessionId: null,
      messageQueuesByConversation: new Map(),
      pausedQueueConversations: new Set(),
      viewMode: 'grid',
      filter: 'all',
      sortBy: 'recent',
      pinnedSessionIds: new Set(),
    })
  })

  it('preserves delegation conversationId when later updates omit it', () => {
    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      steps: [
        {
          id: 'delegation-1',
          type: 'completion',
          title: 'Delegation',
          status: 'in_progress',
          timestamp: 1,
          delegation: {
            runId: 'delegated-run-1',
            agentName: 'internal',
            task: 'Do work',
            status: 'running',
            startTime: 1,
            conversationId: 'delegated-conversation-1',
          },
        },
      ],
    })

    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      steps: [
        {
          id: 'delegation-1',
          type: 'completion',
          title: 'Delegation finished',
          status: 'completed',
          timestamp: 2,
          delegation: {
            runId: 'delegated-run-1',
            agentName: 'internal',
            task: 'Do work',
            status: 'completed',
            startTime: 1,
            endTime: 2,
          },
        },
      ],
    })

    const stored = useAgentStore.getState().agentProgressById.get('session-1')
    const delegation = stored?.steps?.[0]?.delegation

    expect(delegation?.status).toBe('completed')
    expect(delegation?.conversationId).toBe('delegated-conversation-1')
  })

  it('replaces pinned session ids during hydration', () => {
    useAgentStore.getState().togglePinSession('session-1')

    useAgentStore.getState().setPinnedSessionIds(['session-2', 'session-2', 'session-3'])

    expect(Array.from(useAgentStore.getState().pinnedSessionIds)).toEqual(['session-2', 'session-3'])
  })
})

