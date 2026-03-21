import { describe, expect, it } from 'vitest';
import type { AgentProgressStep } from '@dotagents/shared';
import {
  buildDelegationMessageContent,
  extractDelegationMessages,
  findLastUpdatableAssistantMessageIndex,
  mergeProgressMessagesWithFinalTurn,
} from './chat-progress-utils';

function makeDelegationStep(overrides: Partial<NonNullable<AgentProgressStep['delegation']>> = {}): AgentProgressStep {
  return {
    id: `step-${overrides.runId ?? 'run-1'}`,
    type: 'thinking',
    title: 'Delegation update',
    status: 'in_progress',
    timestamp: overrides.endTime ?? overrides.startTime ?? 1,
    delegation: {
      runId: 'run-1',
      agentName: 'Research Agent',
      task: 'Investigate the bug and report back',
      status: 'running',
      startTime: 1,
      progressMessage: 'Inspecting the mobile progress pipeline',
      ...overrides,
    },
  };
}

describe('chat-progress-utils', () => {
  it('formats delegation messages with agent name, status, task, and detail', () => {
    const content = buildDelegationMessageContent(
      makeDelegationStep({
        status: 'completed',
        resultSummary: 'Found the missing delegation rendering path.',
      }).delegation!
    );

    expect(content).toContain('Delegated to **Research Agent**');
    expect(content).toContain('Status: Completed');
    expect(content).toContain('Task: Investigate the bug and report back');
    expect(content).toContain('Found the missing delegation rendering path.');
  });

  it('keeps only the latest update per delegation run', () => {
    const messages = extractDelegationMessages([
      makeDelegationStep({
        runId: 'run-1',
        status: 'running',
        progressMessage: 'Booting sub-agent',
        startTime: 10,
      }),
      makeDelegationStep({
        runId: 'run-1',
        status: 'completed',
        resultSummary: 'Finished successfully',
        endTime: 30,
      }),
      makeDelegationStep({
        runId: 'run-2',
        agentName: 'Reviewer',
        task: 'Sanity check the fix',
        status: 'running',
        startTime: 20,
      }),
    ]);

    expect(messages).toHaveLength(2);
    expect(messages[0].delegationRunId).toBe('run-2');
    expect(messages[1].delegationRunId).toBe('run-1');
    expect(messages[1].content).toContain('Status: Completed');
    expect(messages[1].content).toContain('Finished successfully');
  });

  it('preserves delegation messages when final history drops them', () => {
    const progressMessages = [
      ...extractDelegationMessages([
        makeDelegationStep({
          runId: 'run-1',
          status: 'running',
          progressMessage: 'Collecting evidence',
          startTime: 10,
        }),
      ]),
      {
        role: 'assistant' as const,
        content: 'Executing tools...',
      },
    ];

    const merged = mergeProgressMessagesWithFinalTurn(progressMessages, [
      {
        role: 'assistant',
        content: 'Here is the final answer.',
      },
    ]);

    expect(merged).toHaveLength(2);
    expect(merged[0].kind).toBe('delegation');
    expect(merged[0].content).toContain('Collecting evidence');
    expect(merged[1].content).toBe('Here is the final answer.');
  });

  it('finds the last non-delegation assistant message for streaming updates', () => {
    const messages = [
      {
        role: 'assistant' as const,
        kind: 'delegation' as const,
        content: 'Delegated to **Research Agent**',
      },
      {
        role: 'assistant' as const,
        content: 'Draft response',
      },
      {
        role: 'assistant' as const,
        kind: 'delegation' as const,
        content: 'Delegated to **Reviewer**',
      },
    ];

    expect(findLastUpdatableAssistantMessageIndex(messages)).toBe(1);
  });
});
