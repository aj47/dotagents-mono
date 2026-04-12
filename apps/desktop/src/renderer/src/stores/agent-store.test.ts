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
      agentResponseReadAtBySessionId: new Map(),
      focusedSessionId: null,
      expandedSessionId: null,
      scrollToSessionId: null,
      messageQueuesByConversation: new Map(),
      pausedQueueConversations: new Set(),
      viewMode: 'grid',
      filter: 'all',
      sortBy: 'recent',
      pinnedSessionIds: new Set(),
      archivedSessionIds: new Set(),
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

  it('clears focus when snoozing the focused session with no visible alternative', () => {
    useAgentStore.setState({
      agentProgressById: new Map([
        ['session-1', createBaseUpdate()],
      ]),
      focusedSessionId: 'session-1',
    })

    useAgentStore.getState().setSessionSnoozed('session-1', true)

    expect(useAgentStore.getState().agentProgressById.get('session-1')?.isSnoozed).toBe(true)
    expect(useAgentStore.getState().focusedSessionId).toBeNull()
  })

  it('moves focus to the next visible session when snoozing the focused session', () => {
    useAgentStore.setState({
      agentProgressById: new Map([
        ['session-1', createBaseUpdate()],
        ['session-2', { ...createBaseUpdate(), sessionId: 'session-2', conversationId: 'conversation-2' }],
      ]),
      focusedSessionId: 'session-1',
    })

    useAgentStore.getState().setSessionSnoozed('session-1', true)

    expect(useAgentStore.getState().focusedSessionId).toBe('session-2')
    expect(useAgentStore.getState().agentProgressById.get('session-1')?.isSnoozed).toBe(true)
  })

  it('clears expanded session when removing that session directly', () => {
    useAgentStore.setState({
      agentProgressById: new Map([
        ['session-1', createBaseUpdate()],
      ]),
      expandedSessionId: 'session-1',
    })

    useAgentStore.getState().clearSessionProgress('session-1')

    expect(useAgentStore.getState().expandedSessionId).toBeNull()
  })

  it('clears expanded session when clearing inactive sessions removes it', () => {
    useAgentStore.setState({
      agentProgressById: new Map([
        ['session-1', { ...createBaseUpdate(), isComplete: true }],
        ['session-2', { ...createBaseUpdate(), sessionId: 'session-2', conversationId: 'conversation-2' }],
      ]),
      expandedSessionId: 'session-1',
    })

    useAgentStore.getState().clearInactiveSessions()

    expect(useAgentStore.getState().agentProgressById.has('session-1')).toBe(false)
    expect(useAgentStore.getState().expandedSessionId).toBeNull()
  })

  it('clears expanded session when clearing all progress', () => {
    useAgentStore.setState({
      agentProgressById: new Map([
        ['session-1', createBaseUpdate()],
      ]),
      expandedSessionId: 'session-1',
    })

    useAgentStore.getState().clearAllProgress()

    expect(useAgentStore.getState().expandedSessionId).toBeNull()
  })

  it('marks the latest agent response read when a viewed session receives progress', () => {
    useAgentStore.setState({
      agentResponseReadAtBySessionId: new Map(),
      focusedSessionId: 'session-1',
    })

    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      responseEvents: [
        { id: 'response-1', sessionId: 'session-1', ordinal: 1, text: 'Done', timestamp: 123 },
      ],
    })

    expect(useAgentStore.getState().agentResponseReadAtBySessionId.get('session-1')).toBe(123)
  })

  it('does not mark background agent responses read until the session is opened', () => {
    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      isSnoozed: true,
      responseEvents: [
        { id: 'response-2', sessionId: 'session-1', ordinal: 1, text: 'Background answer', timestamp: 456 },
      ],
    })

    expect(useAgentStore.getState().agentResponseReadAtBySessionId.has('session-1')).toBe(false)

    useAgentStore.getState().setFocusedSessionId('session-1')

    expect(useAgentStore.getState().agentResponseReadAtBySessionId.get('session-1')).toBe(456)
  })

  it('does not steal focus for a newly delegated subagent session', () => {
    useAgentStore.setState({
      agentProgressById: new Map([
        ['current-session', { ...createBaseUpdate(), sessionId: 'current-session', isComplete: true }],
      ]),
      focusedSessionId: 'current-session',
    })

    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      sessionId: 'subsession-1',
      parentSessionId: 'parent-session',
      conversationId: 'subagent-conversation',
      steps: [
        { id: 'thinking-1', type: 'thinking', title: 'Thinking', status: 'in_progress', timestamp: 1 },
      ],
    })

    expect(useAgentStore.getState().focusedSessionId).toBe('current-session')
  })

  it('does not steal focus for delegation-only parent progress updates', () => {
    useAgentStore.setState({
      agentProgressById: new Map([
        ['current-session', { ...createBaseUpdate(), sessionId: 'current-session', isComplete: true }],
      ]),
      focusedSessionId: 'current-session',
    })

    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      sessionId: 'parent-session',
      conversationId: 'parent-conversation',
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
            task: 'Do delegated work',
            status: 'running',
            startTime: 1,
            subSessionId: 'subsession-1',
          },
        },
      ],
    })

    expect(useAgentStore.getState().focusedSessionId).toBe('current-session')
  })
})
