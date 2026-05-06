import { describe, expect, it } from 'vitest';

import {
  AGENT_STOP_NOTE,
  AGENT_STOPPED_QUEUE_PAUSED_DESCRIPTION,
  DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
  appendAgentStopNote,
  buildAgentStoppedProgressUpdate,
  buildProfileContext,
  describeAgentSessionId,
  getPreferredDelegationOutput,
  resolveAgentIterationLimits,
} from './agent-run-utils';

describe('resolveAgentIterationLimits', () => {
  it('keeps infinite loop iterations but caps the guardrail budget', () => {
    expect(resolveAgentIterationLimits(Number.POSITIVE_INFINITY)).toEqual({
      loopMaxIterations: Number.POSITIVE_INFINITY,
      guardrailBudget: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
    });
  });

  it('falls back to the default guardrail budget for other non-finite values', () => {
    expect(resolveAgentIterationLimits(Number.NaN)).toEqual({
      loopMaxIterations: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
      guardrailBudget: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
    });
  });

  it('normalizes finite values to at least one whole iteration', () => {
    expect(resolveAgentIterationLimits(2.9)).toEqual({
      loopMaxIterations: 2,
      guardrailBudget: 2,
    });

    expect(resolveAgentIterationLimits(0)).toEqual({
      loopMaxIterations: 1,
      guardrailBudget: 1,
    });
  });
});

describe('appendAgentStopNote', () => {
  it('appends the emergency stop note once after trimming trailing whitespace', () => {
    expect(appendAgentStopNote('Finished work.   ')).toBe(
      `Finished work.\n\n${AGENT_STOP_NOTE}`,
    );
  });

  it('does not duplicate the emergency stop note', () => {
    expect(appendAgentStopNote(`Finished work\n\n${AGENT_STOP_NOTE}`)).toBe(
      `Finished work\n\n${AGENT_STOP_NOTE}`,
    );
  });
});

describe('buildAgentStoppedProgressUpdate', () => {
  it('builds the shared emergency-stop progress payload', () => {
    expect(buildAgentStoppedProgressUpdate({
      sessionId: 'session-1',
      runId: 3,
      conversationId: 'conv-1',
      conversationTitle: 'Planning',
      timestamp: 1234,
    })).toEqual({
      sessionId: 'session-1',
      runId: 3,
      conversationId: 'conv-1',
      conversationTitle: 'Planning',
      currentIteration: 0,
      maxIterations: 0,
      steps: [
        {
          id: 'stop_1234',
          type: 'completion',
          title: 'Agent stopped',
          description: AGENT_STOPPED_QUEUE_PAUSED_DESCRIPTION,
          status: 'error',
          timestamp: 1234,
        },
      ],
      isComplete: true,
      finalContent: AGENT_STOP_NOTE,
    });
  });

  it('can explicitly clear pending tool approval state', () => {
    expect(buildAgentStoppedProgressUpdate({
      sessionId: 'session-1',
      timestamp: 1234,
      clearPendingToolApproval: true,
    })).toHaveProperty('pendingToolApproval', undefined);
  });
});

describe('describeAgentSessionId', () => {
  it('classifies known desktop and ACP session ID families', () => {
    expect(describeAgentSessionId(undefined)).toBe('missing');
    expect(describeAgentSessionId(null)).toBe('missing');
    expect(describeAgentSessionId('')).toBe('missing');
    expect(describeAgentSessionId('pending-client-token')).toBe('pending');
    expect(describeAgentSessionId('subsession_123')).toBe('subsession');
    expect(describeAgentSessionId('session_123')).toBe('session');
    expect(describeAgentSessionId('acp-123')).toBe('unknown');
  });
});

describe('buildProfileContext', () => {
  it('combines existing context with display name, prompts, and delegation guardrails', () => {
    expect(buildProfileContext({
      profileName: 'fallback-name',
      displayName: '  Helpful Agent  ',
      systemPrompt: 'Be concise.',
      guidelines: 'Prefer bullets.',
      disableDelegation: true,
    }, 'Workspace context')).toBe(
      'Workspace context\n\n[Acting as: Helpful Agent]\n\nSystem Prompt: Be concise.\n\nGuidelines: Prefer bullets.\n\nDelegation rule: this is already a delegated run. Execute the task directly and do not delegate to other agents or sub-sessions.',
    );
  });

  it('returns undefined when neither profile nor existing context contributes content', () => {
    expect(buildProfileContext(undefined)).toBeUndefined();
  });
});

describe('getPreferredDelegationOutput', () => {
  it('prefers delegated respond_to_user content over assistant placeholder text', () => {
    expect(getPreferredDelegationOutput('', [
      {
        role: 'assistant',
        content: 'Working on it...',
        toolCalls: [{ name: 'respond_to_user', arguments: { text: 'Final delegated answer' } }],
      },
    ])).toBe('Final delegated answer');
  });

  it('prefers ACP-style respond_to_user tool messages over trailing fallback text', () => {
    expect(getPreferredDelegationOutput('Internal trailing completion text', [
      {
        role: 'tool',
        content: 'Final delegated answer',
        toolName: 'Tool: Respond to User',
        toolInput: { text: 'Final delegated answer' },
      },
    ])).toBe('Final delegated answer');
  });

  it('falls back to the latest assistant message when no explicit user response exists', () => {
    expect(getPreferredDelegationOutput('raw tool output', [
      { role: 'assistant', content: 'Assistant summary' },
    ])).toBe('Assistant summary');
  });
});
