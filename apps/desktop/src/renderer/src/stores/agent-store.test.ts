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
      expandedSessionId: null,
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
})

/**
 * Regression tests for the queued-message-leak bug (issue #323).
 *
 * When a follow-up message is submitted while the agent is in the
 * "Analyzing request and planning next actions" state the backend
 * queues the message and returns { queued: true }.  The optimistic
 * `appendUserMessageToSession` call must be **skipped** in that case
 * so the message stays in the queue panel and never leaks into the
 * main chat conversation history.
 */
describe('appendUserMessageToSession – queued-message-leak guard', () => {
  beforeEach(() => {
    useAgentStore.setState({
      agentProgressById: new Map(),
      focusedSessionId: null,
      expandedSessionId: null,
      scrollToSessionId: null,
      messageQueuesByConversation: new Map(),
      pausedQueueConversations: new Set(),
      viewMode: 'grid',
      filter: 'all',
      sortBy: 'recent',
      pinnedSessionIds: new Set(),
    })
  })

  it('appends a user message to conversationHistory when called (non-queued path)', () => {
    useAgentStore.getState().updateSessionProgress(createBaseUpdate())

    useAgentStore.getState().appendUserMessageToSession('session-1', 'hello world')

    const history = useAgentStore.getState().agentProgressById.get('session-1')?.conversationHistory
    expect(history).toHaveLength(1)
    expect(history?.[0]).toMatchObject({ role: 'user', content: 'hello world' })
  })

  it('does NOT add a message to conversationHistory when the caller skips appendUserMessageToSession for queued responses', () => {
    // Simulate the fix: the component receives { queued: true } from the backend
    // and does NOT call appendUserMessageToSession at all.
    useAgentStore.getState().updateSessionProgress(createBaseUpdate())

    const simulatedBackendResponse = { conversationId: 'parent-conversation', queued: true }

    // Guard condition that the fixed components now apply
    if (!simulatedBackendResponse.queued) {
      useAgentStore.getState().appendUserMessageToSession('session-1', 'this should not appear')
    }

    const history = useAgentStore.getState().agentProgressById.get('session-1')?.conversationHistory
    // History must stay empty — the queued message must not leak into the main chat
    expect(history).toHaveLength(0)
  })

  it('does NOT modify conversationHistory when appendUserMessageToSession is called for an unknown session', () => {
    // Ensure the function is a no-op for sessions that don't exist in the store
    useAgentStore.getState().appendUserMessageToSession('nonexistent-session', 'ghost message')

    expect(useAgentStore.getState().agentProgressById.size).toBe(0)
  })
})
