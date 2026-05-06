import { describe, it, expect } from 'vitest'
import {
  getAgentDelegationChildSessionIds,
  getAgentDelegationDisplayTitle,
  getSubagentParentSessionIdMap,
  getSubagentTitleBySessionIdMap,
} from './agent-progress'
import type {
  AgentProgressUpdate,
  AgentProgressStep,
  AgentRetryInfo,
  AgentRetryProgressCallback,
  ACPDelegationProgress,
  ACPDelegationState,
  ACPSubAgentMessage,
  ACPConfigOption,
  ACPConfigOptionValue,
  AgentStepSummary,
  OnProgressCallback,
} from './agent-progress'

/**
 * Type-level tests for the unified agent progress types.
 *
 * These tests verify that the unified types are valid supersets of both the
 * desktop and mobile definitions — i.e. objects matching either platform's
 * shape can be assigned to the unified type without type errors.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Compile-time assertion that T is assignable. Returns a dummy value. */
function assertType<T>(_value: T): void {
  // intentionally empty — compile-time check only
}

// ── AgentProgressStep ────────────────────────────────────────────────────────

describe('AgentProgressStep', () => {
  it('accepts a minimal desktop-shaped step', () => {
    const step: AgentProgressStep = {
      id: 'step-1',
      type: 'tool_call',
      title: 'Reading file',
      status: 'completed',
      timestamp: Date.now(),
    }
    assertType<AgentProgressStep>(step)
    expect(step.id).toBe('step-1')
  })

  it('accepts desktop-specific fields (approvalRequest, delegation, executionStats)', () => {
    const step: AgentProgressStep = {
      id: 'step-2',
      type: 'tool_approval',
      title: 'Approve dangerous tool',
      status: 'awaiting_approval',
      timestamp: Date.now(),
      approvalRequest: {
        approvalId: 'ap-1',
        toolName: 'rm',
        arguments: { path: '/tmp/test' },
      },
      delegation: {
        runId: 'run-1',
        agentName: 'coder',
        task: 'Write tests',
        status: 'running',
        startTime: Date.now(),
      },
      executionStats: {
        durationMs: 1200,
        totalTokens: 500,
        inputTokens: 300,
        outputTokens: 200,
        cacheHitTokens: 50,
        toolUseCount: 2,
      },
      subagentId: 'sub-1',
    }
    assertType<AgentProgressStep>(step)
    expect(step.approvalRequest?.approvalId).toBe('ap-1')
    expect(step.executionStats?.totalTokens).toBe(500)
  })

  it('accepts mobile-specific step types (response, error, pending_approval)', () => {
    const responseStep: AgentProgressStep = {
      id: 'step-3',
      type: 'response',
      title: 'Agent response',
      status: 'completed',
      timestamp: Date.now(),
      content: 'Hello world',
    }
    assertType<AgentProgressStep>(responseStep)
    expect(responseStep.content).toBe('Hello world')

    const errorStep: AgentProgressStep = {
      id: 'step-4',
      type: 'error',
      title: 'Error',
      status: 'error',
      timestamp: Date.now(),
    }
    assertType<AgentProgressStep>(errorStep)
    expect(errorStep.type).toBe('error')
  })

  it('accepts all shared optional fields', () => {
    const step: AgentProgressStep = {
      id: 'step-5',
      type: 'tool_call',
      title: 'Calling tool',
      description: 'Calling the search tool',
      status: 'in_progress',
      timestamp: Date.now(),
      llmContent: 'Searching...',
      toolCall: { name: 'search', arguments: { query: 'hello' } },
      toolResult: { success: true, content: 'Found results' },
    }
    assertType<AgentProgressStep>(step)
    expect(step.toolCall?.name).toBe('search')
  })
})

// ── AgentProgressUpdate ──────────────────────────────────────────────────────

describe('AgentProgressUpdate', () => {
  const minimalUpdate: AgentProgressUpdate = {
    sessionId: 'sess-1',
    currentIteration: 1,
    maxIterations: 10,
    steps: [],
    isComplete: false,
  }

  it('accepts a minimal update (shared required fields only)', () => {
    assertType<AgentProgressUpdate>(minimalUpdate)
    expect(minimalUpdate.sessionId).toBe('sess-1')
  })

  it('accepts desktop-specific fields', () => {
    const retryInfo: AgentRetryInfo = {
      isRetrying: true,
      attempt: 2,
      maxAttempts: 5,
      delaySeconds: 30,
      reason: 'Rate limited',
      startedAt: Date.now(),
    }
    const retryProgressCallback: AgentRetryProgressCallback = (info) => {
      expect(info).toEqual(retryInfo)
    }

    const update: AgentProgressUpdate = {
      ...minimalUpdate,
      runId: 3,
      conversationTitle: 'Debug session',
      isSnoozed: true,
      userResponseHistory: ['hello', 'world'],
      sessionStartIndex: 5,
      pendingToolApproval: {
        approvalId: 'ap-1',
        toolName: 'shell',
        arguments: { cmd: 'ls' },
      },
      retryInfo,
      contextInfo: {
        estTokens: 3000,
        maxTokens: 8000,
      },
      modelInfo: {
        provider: 'openai',
        model: 'gpt-4',
      },
      profileName: 'my-profile',
      acpSessionInfo: {
        agentName: 'coder',
        agentTitle: 'Code Agent',
        agentVersion: '1.0.0',
        currentModel: 'gpt-4',
        currentMode: 'code',
        availableModels: [{ id: 'gpt-4', name: 'GPT-4' }],
        availableModes: [{ id: 'code', name: 'Code', description: 'Coding mode' }],
        configOptions: [],
      },
      stepSummaries: [],
      latestSummary: {
        id: 'sum-1',
        sessionId: 'sess-1',
        stepNumber: 1,
        timestamp: Date.now(),
        actionSummary: 'Read the file',
      },
    }
    assertType<AgentProgressUpdate>(update)
    retryProgressCallback(retryInfo)
    expect(update.runId).toBe(3)
    expect(update.retryInfo?.isRetrying).toBe(true)
    expect(update.acpSessionInfo?.agentName).toBe('coder')
  })

  it('accepts mobile-specific spokenContent field', () => {
    const update: AgentProgressUpdate = {
      ...minimalUpdate,
      spokenContent: 'I found some results for you.',
    }
    assertType<AgentProgressUpdate>(update)
    expect(update.spokenContent).toBe('I found some results for you.')
  })

  it('accepts shared optional fields (conversationState, finalContent, etc.)', () => {
    const update: AgentProgressUpdate = {
      ...minimalUpdate,
      conversationId: 'conv-1',
      conversationState: 'complete',
      finalContent: 'Done!',
      userResponse: 'Here is my response',
      conversationHistory: [
        { role: 'user', content: 'Hello', timestamp: Date.now() },
        { role: 'assistant', content: 'Hi there' },
      ],
      streamingContent: {
        text: 'Streaming...',
        isStreaming: true,
      },
    }
    assertType<AgentProgressUpdate>(update)
    expect(update.conversationState).toBe('complete')
    expect(update.conversationHistory).toHaveLength(2)
  })
})

// ── Supporting types ─────────────────────────────────────────────────────────

describe('ACPDelegationProgress', () => {
  it('accepts a full delegation object', () => {
    const delegation: ACPDelegationProgress = {
      runId: 'run-1',
      agentName: 'coder',
      connectionType: 'internal',
      task: 'Write tests',
      status: 'completed',
      progressMessage: 'Almost done',
      startTime: Date.now() - 5000,
      endTime: Date.now(),
      resultSummary: 'Tests written',
      acpSessionId: 'acp-sess-1',
      subSessionId: 'sub-sess-1',
      conversationId: 'conv-1',
      acpRunId: 'acp-run-1',
      conversation: [
        { role: 'user', content: 'Write tests', timestamp: Date.now() },
        { role: 'assistant', content: 'Done', timestamp: Date.now() },
      ],
    }
    assertType<ACPDelegationProgress>(delegation)
    expect(delegation.status).toBe('completed')
  })
})

describe('delegation session helpers', () => {
  it('normalizes child session IDs from every delegation identifier field', () => {
    expect(getAgentDelegationChildSessionIds({
      runId: ' run-1 ',
      subSessionId: ' sub-1 ',
      acpSessionId: ' acp-1 ',
      agentName: 'Coder',
      task: 'Implement',
      status: 'running',
      startTime: 1,
    })).toEqual(['sub-1', 'acp-1', 'run-1'])
  })

  it('prefers delegated task text and falls back to agent name for titles', () => {
    expect(getAgentDelegationDisplayTitle({
      runId: 'run-1',
      agentName: 'Coder',
      task: ' Summarize trace failures ',
      status: 'completed',
      startTime: 1,
    })).toBe('Summarize trace failures')

    expect(getAgentDelegationDisplayTitle({
      runId: 'run-2',
      agentName: ' Coder ',
      task: ' ',
      status: 'running',
      startTime: 1,
    })).toBe('Coder subagent')
  })

  it('infers child session parents from delegation progress', () => {
    const parentMap = getSubagentParentSessionIdMap(new Map([
      [
        'parent-1',
        {
          steps: [
            {
              id: 'delegation-subagent-1',
              type: 'tool_call',
              title: 'Delegation',
              status: 'in_progress',
              timestamp: 1,
              delegation: {
                runId: 'subagent-run-1',
                subSessionId: 'subagent-1',
                agentName: 'Internal',
                task: 'Ping',
                status: 'running',
                startTime: 1,
              },
            },
          ],
        },
      ],
    ]))

    expect(parentMap.get('subagent-1')).toBe('parent-1')
    expect(parentMap.get('subagent-run-1')).toBe('parent-1')
  })

  it('uses delegated task text as the title for subagent session ids', () => {
    const titles = getSubagentTitleBySessionIdMap(new Map([
      [
        'parent-1',
        {
          steps: [
            {
              id: 'delegation-subagent-1',
              type: 'tool_call',
              title: 'Delegation',
              status: 'completed',
              timestamp: 1,
              delegation: {
                runId: 'subagent-run-1',
                subSessionId: 'subagent-1',
                agentName: 'Internal',
                task: 'Summarize trace failures',
                status: 'completed',
                startTime: 1,
              },
            },
          ],
        },
      ],
    ]))

    expect(titles.get('subagent-1')).toBe('Summarize trace failures')
    expect(titles.get('subagent-run-1')).toBe('Summarize trace failures')
  })
})

describe('ACPDelegationState', () => {
  it('tracks delegation state correctly', () => {
    const state: ACPDelegationState = {
      parentSessionId: 'sess-1',
      delegations: [],
      activeCount: 0,
    }
    assertType<ACPDelegationState>(state)
    expect(state.activeCount).toBe(0)
  })
})

describe('ACPConfigOption', () => {
  it('accepts a config option with values', () => {
    const option: ACPConfigOption = {
      id: 'model',
      name: 'Model',
      description: 'Select the model',
      category: 'general',
      type: 'select',
      currentValue: 'gpt-4',
      options: [
        { value: 'gpt-4', name: 'GPT-4', description: 'Most capable' },
        { value: 'gpt-3.5', name: 'GPT-3.5' },
      ],
    }
    assertType<ACPConfigOption>(option)
    expect(option.options).toHaveLength(2)
  })
})

describe('OnProgressCallback', () => {
  it('is a function accepting AgentProgressUpdate', () => {
    const callback: OnProgressCallback = (update) => {
      expect(update.sessionId).toBeDefined()
    }
    assertType<OnProgressCallback>(callback)
    callback({
      sessionId: 'sess-1',
      currentIteration: 1,
      maxIterations: 10,
      steps: [],
      isComplete: false,
    })
  })
})
