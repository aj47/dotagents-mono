import { describe, expect, it } from 'vitest';
import type { AgentProgressStep } from '@dotagents/shared';
import { createDelegationProgressMessages } from './delegationProgress';

describe('createDelegationProgressMessages', () => {
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
    ];

    const messages = createDelegationProgressMessages(steps);

    expect(messages).toHaveLength(2);
    expect(messages[0].id).toBe('delegation-run-1');
    expect(messages[0].variant).toBe('delegation');
    expect(messages[0].content).toContain('Delegated to Planner · Completed');
    expect(messages[0].content).toContain('Built a 5-step plan');

    expect(messages[1].content).toContain('Delegated to Research · Failed');
    expect(messages[1].content).toContain('Timeout');
  });

  it('maps delegated tool messages to structured tool metadata', () => {
    const steps: AgentProgressStep[] = [
      {
        id: 'delegation-tools',
        type: 'thinking',
        title: 'Delegating',
        status: 'in_progress',
        timestamp: 300,
        delegation: {
          runId: 'run-tools',
          agentName: 'Worker',
          task: 'Inspect files',
          status: 'running',
          startTime: 300,
          conversation: [
            {
              role: 'tool',
              toolName: 'read_file',
              toolInput: { path: 'README.md' },
              content: 'Using tool: read_file\nInput: {"path":"README.md"}',
              timestamp: 301,
            },
            {
              role: 'tool',
              toolName: 'read_file',
              content: 'Tool result: {"ok":true}',
              timestamp: 302,
            },
          ],
        },
      },
    ];

    const messages = createDelegationProgressMessages(steps);
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toContain('Delegated to Worker · Running');
    expect(messages[0].content).toContain('Tool result: {"ok":true}');
    expect(messages[0].toolCalls).toEqual([
      { name: 'read_file', arguments: { path: 'README.md' } },
    ]);
    expect(messages[0].toolResults).toEqual([
      { success: true, content: '{"ok":true}' },
    ]);
  });

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
    ];

    const messages = createDelegationProgressMessages(steps);
    expect(messages).toHaveLength(1);
    expect(messages[0].toolCalls).toEqual([
      { name: 'rg', arguments: { pattern: 'subagent' } },
      { name: 'read_file', arguments: { path: 'README.md' } },
      { name: 'ls', arguments: { path: '.' } },
    ]);
    expect(messages[0].toolResults).toEqual([
      { success: true, content: '1 hit' },
      undefined,
      { success: true, content: '{"files":["README.md"]}' },
    ]);
  });

  it('attaches structured result-only messages to prior pending structured calls', () => {
    const steps: AgentProgressStep[] = [
      {
        id: 'delegation-structured-split',
        type: 'thinking',
        title: 'Delegating',
        status: 'in_progress',
        timestamp: 550,
        delegation: {
          runId: 'run-structured-split',
          agentName: 'Worker',
          task: 'Run split tool stream',
          status: 'running',
          startTime: 550,
          conversation: [
            {
              role: 'assistant',
              content: '',
              toolCalls: [{ name: 'search', arguments: { query: 'tooling' } }],
              timestamp: 551,
            },
            {
              role: 'tool',
              content: '',
              toolResults: [{ success: true, content: 'found' }],
              timestamp: 552,
            },
          ],
        },
      },
    ];

    const messages = createDelegationProgressMessages(steps);
    expect(messages).toHaveLength(1);
    expect(messages[0].toolCalls).toEqual([
      { name: 'search', arguments: { query: 'tooling' } },
    ]);
    expect(messages[0].toolResults).toEqual([
      { success: true, content: 'found' },
    ]);
  });

  it('preserves empty tool output and avoids success fallback for failed structured results', () => {
    const steps: AgentProgressStep[] = [
      {
        id: 'delegation-empty-results',
        type: 'thinking',
        title: 'Delegating',
        status: 'in_progress',
        timestamp: 600,
        delegation: {
          runId: 'run-empty-results',
          agentName: 'Worker',
          task: 'Run tools',
          status: 'running',
          startTime: 600,
          conversation: [
            {
              role: 'assistant',
              content: '',
              toolCalls: [
                { name: 'first_tool', arguments: {} },
                { name: 'second_tool', arguments: {} },
              ],
              toolResults: [
                { success: true, content: '' },
                { success: false, error: 'boom' },
              ],
              timestamp: 601,
            },
          ],
        },
      },
    ];

    const messages = createDelegationProgressMessages(steps);
    expect(messages).toHaveLength(1);
    expect(messages[0].toolResults).toEqual([
      { success: true, content: '' },
      { success: false, content: 'Tool failed', error: 'boom' },
    ]);
  });
});
