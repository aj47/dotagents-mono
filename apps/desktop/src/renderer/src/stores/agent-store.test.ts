import { beforeEach, describe, expect, it } from 'vitest'
import type { AgentProgressUpdate } from '@shared/types'
import { clearSessionTTSTracking, hasTTSPlayed, markTTSPlayed } from '../lib/tts-tracking'
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
    clearSessionTTSTracking('session-1')
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

  it('clears stale userResponse state and TTS tracking when a follow-up user message is appended', () => {
    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      isComplete: true,
      userResponse: 'Old answer',
      userResponseHistory: ['Older answer'],
      conversationHistory: [
        { role: 'user', content: 'hello', timestamp: 1 },
      ],
    })

    markTTSPlayed('session-1:Old answer')
    markTTSPlayed('session-1:mid-turn:Old answer')

    useAgentStore.getState().appendUserMessageToSession('session-1', 'follow-up question')

    const stored = useAgentStore.getState().agentProgressById.get('session-1')

    expect(stored?.userResponse).toBeUndefined()
    expect(stored?.userResponseHistory).toBeUndefined()
    expect(stored?.conversationHistory?.at(-1)).toEqual(
      expect.objectContaining({ role: 'user', content: 'follow-up question' }),
    )
    expect(hasTTSPlayed('session-1:Old answer')).toBe(false)
    expect(hasTTSPlayed('session-1:mid-turn:Old answer')).toBe(false)
  })
})

