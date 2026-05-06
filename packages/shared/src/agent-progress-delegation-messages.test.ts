import { describe, expect, it } from 'vitest'
import {
  createAgentDelegationProgressMessages,
  type AgentProgressStep,
} from './agent-progress'

describe('createAgentDelegationProgressMessages', () => {
  it('keeps the latest update for each delegated run and surfaces status details', () => {
    const steps: AgentProgressStep[] = [
      {
        id: 'delegation-1-start',
        type: 'thinking',
        title: 'Delegating',
        status: 'in_progress',
        timestamp: 100,
        delegation: {
          runId: 'run-1',
          agentName: 'Planner',
          task: 'Draft a plan',
          status: 'running',
          progressMessage: 'Searching sources',
          startTime: 100,
        },
      },
      {
        id: 'delegation-1-done',
        type: 'thinking',
        title: 'Delegating',
        status: 'completed',
        timestamp: 200,
        delegation: {
          runId: 'run-1',
          agentName: 'Planner',
          task: 'Draft a plan',
          status: 'completed',
          resultSummary: 'Built a 5-step plan',
          startTime: 100,
          endTime: 200,
        },
      },
      {
        id: 'delegation-2-fail',
        type: 'thinking',
        title: 'Delegating',
        status: 'error',
        timestamp: 210,
        delegation: {
          runId: 'run-2',
          agentName: 'Research',
          task: 'Find latest changelog',
          status: 'failed',
          error: 'Timeout',
          startTime: 205,
          endTime: 210,
        },
      },
    ]

    const messages = createAgentDelegationProgressMessages(steps)

    expect(messages).toHaveLength(2)
    expect(messages[0]).toMatchObject({
      id: 'delegation-run-1',
      role: 'assistant',
      variant: 'delegation',
      timestamp: 200,
    })
    expect(messages[0]?.content).toContain('Delegated to Planner · Completed')
    expect(messages[0]?.content).toContain('Built a 5-step plan')
    expect(messages[1]?.content).toContain('Delegated to Research · Failed')
    expect(messages[1]?.content).toContain('Timeout')
  })

  it('normalizes structured and legacy delegated tool metadata into one renderable stream', () => {
    const steps: AgentProgressStep[] = [
      {
        id: 'delegation-mixed',
        type: 'thinking',
        title: 'Delegating',
        status: 'in_progress',
        timestamp: 500,
        delegation: {
          runId: 'run-mixed',
          agentName: 'Worker',
          task: 'Investigate issue',
          status: 'running',
          startTime: 500,
          conversation: [
            {
              role: 'assistant',
              content: '',
              toolCalls: [
                { name: 'rg', arguments: { pattern: 'subagent' } },
                { name: 'read_file', arguments: { path: 'README.md' } },
              ],
              toolResults: [{ success: true, content: '1 hit' }],
              timestamp: 501,
            },
            {
              role: 'tool',
              content: 'Using tool: ls\nInput: {"path":"."}',
              timestamp: 502,
            },
            {
              role: 'tool',
              content: 'Tool result: {"files":["README.md"]}',
              timestamp: 503,
            },
          ],
        },
      },
    ]

    const messages = createAgentDelegationProgressMessages(steps)

    expect(messages[0]?.toolCalls).toEqual([
      { name: 'rg', arguments: { pattern: 'subagent' } },
      { name: 'read_file', arguments: { path: 'README.md' } },
      { name: 'ls', arguments: { path: '.' } },
    ])
    expect(messages[0]?.toolResults).toEqual([
      { success: true, content: '1 hit', error: undefined },
      { success: true, content: '{"files":["README.md"]}', error: undefined },
    ])
    expect(messages[0]?.toolExecutions).toEqual([
      { toolCall: { name: 'rg', arguments: { pattern: 'subagent' } }, result: { success: true, content: '1 hit', error: undefined } },
      { toolCall: { name: 'read_file', arguments: { path: 'README.md' } } },
      { toolCall: { name: 'ls', arguments: { path: '.' } }, result: { success: true, content: '{"files":["README.md"]}', error: undefined } },
    ])
  })

  it('keeps legacy tool messages with metadata and empty content pending', () => {
    const steps: AgentProgressStep[] = [
      {
        id: 'delegation-pending-legacy-tool',
        type: 'thinking',
        title: 'Delegating',
        status: 'in_progress',
        timestamp: 700,
        delegation: {
          runId: 'run-pending-legacy-tool',
          agentName: 'Worker',
          task: 'Run tool',
          status: 'running',
          startTime: 700,
          conversation: [
            {
              role: 'tool',
              toolName: 'read_file',
              toolInput: { path: 'README.md' },
              content: '',
              timestamp: 701,
            },
          ],
        },
      },
    ]

    const messages = createAgentDelegationProgressMessages(steps)

    expect(messages[0]?.toolCalls).toEqual([
      { name: 'read_file', arguments: { path: 'README.md' } },
    ])
    expect(messages[0]?.toolResults).toBeUndefined()
    expect(messages[0]?.toolExecutions).toEqual([
      { toolCall: { name: 'read_file', arguments: { path: 'README.md' } } },
    ])
  })
})
