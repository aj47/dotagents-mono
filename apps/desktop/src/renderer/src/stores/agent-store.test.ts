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
      pinnedSessionIdsRevision: 0,
      archivedSessionIds: new Set(),
      archivedSessionIdsRevision: 0,
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

  it('updates a delegated subagent title from title-only progress without clearing existing progress', () => {
    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      sessionId: 'subsession-1',
      parentSessionId: 'parent-session',
      conversationTitle: 'Initial title',
      steps: [
        { id: 'thinking-1', type: 'thinking', title: 'Thinking', status: 'in_progress', timestamp: 1 },
      ],
      conversationHistory: [
        { role: 'assistant', content: 'Working', timestamp: 1 },
      ],
    })

    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      sessionId: 'subsession-1',
      parentSessionId: 'parent-session',
      conversationTitle: 'Delegated research',
      steps: [],
      conversationHistory: [],
    })

    const stored = useAgentStore.getState().agentProgressById.get('subsession-1')
    expect(stored?.conversationTitle).toBe('Delegated research')
    expect(stored?.steps).toHaveLength(1)
    expect(stored?.conversationHistory).toHaveLength(1)
  })

  it('does not regress a terminal delegation back to running when stale progress arrives late', () => {
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
            resultSummary: 'Finished',
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
          title: 'Delegation stale update',
          status: 'in_progress',
          timestamp: 3,
          delegation: {
            runId: 'delegated-run-1',
            agentName: 'internal',
            task: 'Do work',
            status: 'running',
            startTime: 1,
            conversation: [{ role: 'assistant', content: 'Late transcript', timestamp: 3 }],
          },
        },
      ],
    })

    const stored = useAgentStore.getState().agentProgressById.get('session-1')
    const step = stored?.steps?.[0]

    expect(step?.status).toBe('completed')
    expect(step?.delegation?.status).toBe('completed')
    expect(step?.delegation?.endTime).toBe(2)
    expect(step?.delegation?.resultSummary).toBe('Finished')
    expect(step?.delegation?.conversation?.[0]?.content).toBe('Late transcript')
  })

  it('preserves terminal step metadata when stale non-terminal updates arrive', () => {
    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      steps: [
        {
          id: 'delegation-2',
          type: 'completion',
          title: 'Delegation completed',
          description: 'Terminal step metadata',
          status: 'completed',
          timestamp: 5,
          delegation: {
            runId: 'delegated-run-2',
            agentName: 'internal',
            task: 'Do work',
            status: 'completed',
            startTime: 1,
            endTime: 5,
          },
        },
      ],
    })

    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      steps: [
        {
          id: 'delegation-2',
          type: 'thinking',
          title: 'Delegation running',
          description: 'Stale non-terminal metadata',
          status: 'in_progress',
          timestamp: 6,
          delegation: {
            runId: 'delegated-run-2',
            agentName: 'internal',
            task: 'Do work',
            status: 'running',
            startTime: 1,
            conversation: [{ role: 'assistant', content: 'Late transcript', timestamp: 6 }],
          },
        },
      ],
    })

    const stored = useAgentStore.getState().agentProgressById.get('session-1')
    const step = stored?.steps?.[0]

    expect(step?.status).toBe('completed')
    expect(step?.type).toBe('completion')
    expect(step?.title).toBe('Delegation completed')
    expect(step?.description).toBe('Terminal step metadata')
    expect(step?.timestamp).toBe(5)
    expect(step?.delegation?.status).toBe('completed')
    expect(step?.delegation?.conversation?.[0]?.content).toBe('Late transcript')
  })

  it('does not clear terminal delegation transcript when stale updates provide an empty conversation array', () => {
    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      steps: [
        {
          id: 'delegation-3',
          type: 'completion',
          title: 'Delegation completed',
          status: 'completed',
          timestamp: 10,
          delegation: {
            runId: 'delegated-run-3',
            agentName: 'internal',
            task: 'Do work',
            status: 'completed',
            startTime: 1,
            endTime: 10,
            conversation: [{ role: 'assistant', content: 'Final transcript', timestamp: 10 }],
          },
        },
      ],
    })

    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      steps: [
        {
          id: 'delegation-3',
          type: 'thinking',
          title: 'Delegation stale update',
          status: 'in_progress',
          timestamp: 11,
          delegation: {
            runId: 'delegated-run-3',
            agentName: 'internal',
            task: 'Do work',
            status: 'running',
            startTime: 1,
            conversation: [],
          },
        },
      ],
    })

    const stored = useAgentStore.getState().agentProgressById.get('session-1')
    const step = stored?.steps?.[0]

    expect(step?.status).toBe('completed')
    expect(step?.delegation?.conversation).toEqual([
      { role: 'assistant', content: 'Final transcript', timestamp: 10 },
    ])
  })

  it('does not clear non-terminal delegation transcript when update provides an empty conversation array', () => {
    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      steps: [
        {
          id: 'delegation-4',
          type: 'thinking',
          title: 'Delegation running',
          status: 'in_progress',
          timestamp: 20,
          delegation: {
            runId: 'delegated-run-4',
            agentName: 'internal',
            task: 'Do work',
            status: 'running',
            startTime: 1,
            conversation: [{ role: 'assistant', content: 'Transcript chunk', timestamp: 20 }],
          },
        },
      ],
    })

    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      steps: [
        {
          id: 'delegation-4',
          type: 'thinking',
          title: 'Delegation running',
          status: 'in_progress',
          timestamp: 21,
          delegation: {
            runId: 'delegated-run-4',
            agentName: 'internal',
            task: 'Do work',
            status: 'running',
            startTime: 1,
            conversation: [],
          },
        },
      ],
    })

    const stored = useAgentStore.getState().agentProgressById.get('session-1')
    const step = stored?.steps?.[0]

    expect(step?.delegation?.conversation).toEqual([
      { role: 'assistant', content: 'Transcript chunk', timestamp: 20 },
    ])
  })

  it('replaces pinned session ids during hydration', () => {
    useAgentStore.getState().togglePinSession('session-1')

    useAgentStore.getState().setPinnedSessionIds(['session-2', 'session-2', 'session-3'])

    expect(Array.from(useAgentStore.getState().pinnedSessionIds)).toEqual(['session-2', 'session-3'])
  })

  it('tracks pin and archive mutations separately from hydration replacements', () => {
    expect(useAgentStore.getState().pinnedSessionIdsRevision).toBe(0)
    expect(useAgentStore.getState().archivedSessionIdsRevision).toBe(0)

    useAgentStore.getState().setPinnedSessionIds(['session-1'])
    useAgentStore.getState().setArchivedSessionIds(['session-2'])

    expect(useAgentStore.getState().pinnedSessionIdsRevision).toBe(0)
    expect(useAgentStore.getState().archivedSessionIdsRevision).toBe(0)

    useAgentStore.getState().togglePinSession('session-3')
    useAgentStore.getState().toggleArchiveSession('session-4')

    expect(useAgentStore.getState().pinnedSessionIdsRevision).toBe(1)
    expect(useAgentStore.getState().archivedSessionIdsRevision).toBe(1)
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

  it('does not create empty delegated subagent placeholders from title-only updates', () => {
    useAgentStore.getState().updateSessionProgress({
      ...createBaseUpdate(),
      sessionId: 'subsession-empty',
      parentSessionId: 'parent-session',
      conversationId: 'parent-conversation',
      conversationTitle: 'Delegated title',
      steps: [],
      conversationHistory: [],
    })

    expect(useAgentStore.getState().agentProgressById.has('subsession-empty')).toBe(false)
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
