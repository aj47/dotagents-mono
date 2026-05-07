import { describe, expect, it } from 'vitest';

import {
  AGENT_STOP_NOTE,
  AGENT_STOPPED_QUEUE_PAUSED_DESCRIPTION,
  ABORTED_BY_EMERGENCY_STOP_REASON,
  DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
  SESSION_STOPPED_BY_KILL_SWITCH_REASON,
  appendAgentStopNote,
  buildAgentStoppedProgressUpdate,
  buildProfileContext,
  calculateLlmRetryBackoffDelay,
  createRemoteAgentRunExecutor,
  describeAgentSessionId,
  getExplicitAgentStopReason,
  getPreferredDelegationOutput,
  resolveExpectedAgentStopReason,
  resolveAgentModeMaxIterations,
  resolveAgentIterationLimits,
  runRemoteAgentAction,
  stopRemoteAgentSessionAction,
  type AgentRuntimeTuningConfig,
  type RemoteAgentConversationLike,
  type RemoteAgentRunActionService,
  type StopRemoteAgentSessionActionService,
} from './agent-run-utils';

function assertType<T>(_value: T): void {
  // Compile-time assertion only.
}

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

describe('resolveAgentModeMaxIterations', () => {
  it('prefers finite explicit overrides', () => {
    expect(resolveAgentModeMaxIterations({ mcpUnlimitedIterations: true }, 4)).toBe(4);
    expect(resolveAgentModeMaxIterations({ mcpMaxIterations: 20 }, 2.5)).toBe(2.5);
  });

  it('resolves unlimited, configured, and default iteration limits', () => {
    expect(resolveAgentModeMaxIterations({ mcpUnlimitedIterations: true, mcpMaxIterations: 3 })).toBe(Number.POSITIVE_INFINITY);
    expect(resolveAgentModeMaxIterations({ mcpMaxIterations: 12 })).toBe(12);
    expect(resolveAgentModeMaxIterations({})).toBe(Number.POSITIVE_INFINITY);
    expect(resolveAgentModeMaxIterations({ mcpUnlimitedIterations: false })).toBe(10);
  });
});

describe('agent runtime tuning config contracts', () => {
  it('accepts shared retry, context budget, tool response, and verification tuning settings', () => {
    const config: AgentRuntimeTuningConfig = {
      apiRetryCount: 3,
      apiRetryBaseDelay: 1000,
      apiRetryMaxDelay: 30000,
      mcpContextTargetRatio: 0.4,
      mcpContextLastNMessages: 3,
      mcpContextSummarizeCharThreshold: 2000,
      mcpMaxContextTokensOverride: 120000,
      mcpToolResponseLargeThreshold: 20000,
      mcpToolResponseCriticalThreshold: 50000,
      mcpToolResponseChunkSize: 15000,
      mcpToolResponseProgressUpdates: true,
      mcpVerifyContextMaxItems: 10,
      mcpVerifyRetryCount: 1,
    };

    assertType<AgentRuntimeTuningConfig>(config);
    expect(config.mcpToolResponseProgressUpdates).toBe(true);
  });
});

describe('calculateLlmRetryBackoffDelay', () => {
  it('applies exponential backoff before jitter', () => {
    expect(calculateLlmRetryBackoffDelay(0, 100, 1000, () => 0.5)).toBe(100);
    expect(calculateLlmRetryBackoffDelay(3, 100, 1000, () => 0.5)).toBe(800);
  });

  it('caps the exponential delay before applying jitter', () => {
    expect(calculateLlmRetryBackoffDelay(10, 1000, 30000, () => 0.5)).toBe(30000);
  });

  it('applies plus or minus 25 percent jitter', () => {
    expect(calculateLlmRetryBackoffDelay(1, 100, 1000, () => 0)).toBe(150);
    expect(calculateLlmRetryBackoffDelay(1, 100, 1000, () => 1)).toBe(250);
  });

  it('does not return negative delays', () => {
    expect(calculateLlmRetryBackoffDelay(0, 0, 1000, () => 0)).toBe(0);
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

describe('expected agent stop reasons', () => {
  it('detects explicit kill-switch and emergency-stop errors', () => {
    expect(getExplicitAgentStopReason(new Error('Session stopped by kill switch'))).toBe(
      SESSION_STOPPED_BY_KILL_SWITCH_REASON,
    );
    expect(getExplicitAgentStopReason('Aborted by emergency stop')).toBe(
      ABORTED_BY_EMERGENCY_STOP_REASON,
    );
    expect(getExplicitAgentStopReason(new Error('Provider failed'))).toBeNull();
  });

  it('resolves abort-like errors only when caller state confirms a stop', () => {
    const abortError = new Error('The request was aborted');
    abortError.name = 'AbortError';

    expect(resolveExpectedAgentStopReason(abortError)).toBeNull();
    expect(resolveExpectedAgentStopReason(abortError, { sessionShouldStop: true })).toBe(
      SESSION_STOPPED_BY_KILL_SWITCH_REASON,
    );
    expect(resolveExpectedAgentStopReason(abortError, { globalShouldStop: true })).toBe(
      ABORTED_BY_EMERGENCY_STOP_REASON,
    );
    expect(resolveExpectedAgentStopReason(new Error('Provider failed'), { sessionShouldStop: true })).toBeNull();
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

describe('stopRemoteAgentSessionAction', () => {
  function createStopSessionService(overrides: Partial<StopRemoteAgentSessionActionService> = {}) {
    const trackedSessions = new Map([
      ['session-1', { id: 'session-1', status: 'active', conversationId: 'conv-1' }],
      ['session-parent', { id: 'session-parent', status: 'active', conversationId: 'conv-parent' }],
    ])
    const stateStops: string[] = []
    const cancelledApprovals: string[] = []
    const cancelledSubSessions: string[] = []
    const pausedQueues: string[] = []
    const stoppedTrackedSessions: string[] = []
    const progressUpdates: unknown[] = []

    const service: StopRemoteAgentSessionActionService = {
      getAppSessionForAcpSession: (sessionId) => sessionId === 'subsession_1' ? 'session-parent' : undefined,
      getTrackedSession: (sessionId) => trackedSessions.get(sessionId),
      stopSessionState: (sessionId) => { stateStops.push(sessionId) },
      cancelSessionApprovals: (sessionId) => { cancelledApprovals.push(sessionId) },
      getChildSubSessions: () => [
        { id: 'subsession-a', status: 'running' },
        { id: 'subsession-b', status: 'complete' },
      ],
      cancelSubSession: (sessionId) => { cancelledSubSessions.push(sessionId) },
      pauseMessageQueue: (conversationId) => { pausedQueues.push(conversationId) },
      getMessageQueueLength: () => 2,
      getSessionRunId: () => 7,
      emitAgentProgress: async (update) => { progressUpdates.push(update) },
      stopTrackedSession: (sessionId) => { stoppedTrackedSessions.push(sessionId) },
      ...overrides,
    }

    return {
      cancelledApprovals,
      cancelledSubSessions,
      pausedQueues,
      progressUpdates,
      service,
      stateStops,
      stoppedTrackedSessions,
    }
  }

  it('stops session state, cancels running child sessions, pauses the queue, and emits progress', async () => {
    const appLogs: unknown[] = []
    const llmLogs: string[] = []
    const {
      cancelledApprovals,
      cancelledSubSessions,
      pausedQueues,
      progressUpdates,
      service,
      stateStops,
      stoppedTrackedSessions,
    } = createStopSessionService()

    await expect(stopRemoteAgentSessionAction('session-1', {
      service,
      diagnostics: {
        logApp: (_message, details) => { appLogs.push(details) },
        logLLM: (message) => { llmLogs.push(message) },
      },
    })).resolves.toEqual({
      success: true,
      sessionId: 'session-1',
      conversationId: 'conv-1',
    })

    expect(stateStops).toEqual(['session-1'])
    expect(cancelledApprovals).toEqual(['session-1'])
    expect(cancelledSubSessions).toEqual(['subsession-a'])
    expect(pausedQueues).toEqual(['conv-1'])
    expect(stoppedTrackedSessions).toEqual(['session-1'])
    expect(progressUpdates).toEqual([
      expect.objectContaining({
        sessionId: 'session-1',
        runId: 7,
        finalContent: AGENT_STOP_NOTE,
      }),
    ])
    expect(llmLogs).toContain('[stopAgentSession] Cancelled internal sub-session subsession-a')
    expect(llmLogs).toContain('[stopAgentSession] Paused queue for conversation conv-1')
    expect(appLogs).toContainEqual(expect.objectContaining({
      requestedSessionId: 'session-1',
      trackerSessionFound: true,
      trackerConversationId: 'conv-1',
    }))
  })

  it('continues cleanup when child session lookup fails and preserves mapped session diagnostics', async () => {
    const appLogMessages: string[] = []
    const appLogDetails: unknown[] = []
    const { pausedQueues, progressUpdates, service, stateStops, stoppedTrackedSessions } = createStopSessionService({
      getTrackedSession: (sessionId) => sessionId === 'session-parent'
        ? { id: 'session-parent', status: 'active', conversationId: 'conv-parent' }
        : undefined,
      getChildSubSessions: () => { throw new Error('child lookup failed') },
      getSessionRunId: () => undefined,
    })

    await expect(stopRemoteAgentSessionAction('subsession_1', {
      service,
      diagnostics: {
        logApp: (message, details) => {
          appLogMessages.push(message)
          appLogDetails.push(details)
        },
        logLLM: () => {},
      },
    })).resolves.toEqual({
      success: true,
      sessionId: 'subsession_1',
    })

    expect(stateStops).toEqual(['subsession_1'])
    expect(pausedQueues).toEqual([])
    expect(stoppedTrackedSessions).toEqual(['subsession_1'])
    expect(progressUpdates).toEqual([
      expect.objectContaining({
        sessionId: 'subsession_1',
        finalContent: AGENT_STOP_NOTE,
      }),
    ])
    expect(appLogMessages).toContain('[stopAgentSession] Error cancelling internal sub-sessions:')
    expect(appLogDetails).toContainEqual(expect.objectContaining({
      requestedSessionId: 'subsession_1',
      requestedSessionKind: 'subsession',
      mappedAppSessionId: 'session-parent',
      mappedConversationId: 'conv-parent',
    }))
  })
})

describe('runRemoteAgentAction', () => {
  function createRemoteAgentRunService(overrides: Partial<RemoteAgentRunActionService> = {}) {
    const conversations = new Map<string, RemoteAgentConversationLike>()
    conversations.set('conv-1', {
      id: 'conv-1',
      messages: [
        { role: 'user', content: 'previous', timestamp: 1 },
        { role: 'assistant', content: 'answer', timestamp: 2 },
      ],
    })

    const calls: string[] = []
    const revived: Array<{ sessionId: string; startSnoozed: boolean }> = []
    const stateChanges: unknown[] = []
    const service: RemoteAgentRunActionService = {
      getConfig: () => ({ remoteServerAutoShowPanel: false }),
      setAgentModeState: (state) => { stateChanges.push(state) },
      addMessageToConversation: async (conversationId, prompt, role) => {
        calls.push(`add:${conversationId}:${prompt}:${role}`)
        const conversation = conversations.get(conversationId)
        if (!conversation) return null
        conversation.messages.push({ role, content: prompt, timestamp: 3 })
        return conversation
      },
      createConversationWithId: async (conversationId, prompt, role) => {
        calls.push(`create:${conversationId}:${prompt}:${role}`)
        const conversation = {
          id: conversationId,
          messages: [{ role, content: prompt, timestamp: 1 }],
        }
        conversations.set(conversationId, conversation)
        return conversation
      },
      generateConversationId: () => 'generated-conv',
      findSessionByConversationId: (conversationId) => conversationId === 'conv-1' ? 'session-1' : undefined,
      getSession: () => ({ status: 'active', isSnoozed: true }),
      reviveSession: (sessionId, startSnoozed) => {
        revived.push({ sessionId, startSnoozed })
        return true
      },
      loadConversation: async (conversationId) => conversations.get(conversationId),
      processAgentMode: async (prompt, conversationId, existingSessionId, startSnoozed, options) => {
        calls.push(`process:${prompt}:${conversationId}:${existingSessionId ?? 'new'}:${startSnoozed}:${options.profileId ?? ''}`)
        return 'done'
      },
      notifyConversationHistoryChanged: () => { calls.push('notify') },
      ...overrides,
    }

    return { calls, conversations, revived, service, stateChanges }
  }

  it('continues existing conversations, revives active sessions, and returns formatted history', async () => {
    const logMessages: string[] = []
    const { calls, revived, service, stateChanges } = createRemoteAgentRunService()

    await expect(runRemoteAgentAction({
      prompt: 'next',
      conversationId: 'conv-1',
      profileId: 'profile-1',
    }, {
      service,
      diagnostics: {
        logInfo: (_source, message) => { logMessages.push(message) },
      },
    })).resolves.toEqual({
      content: 'done',
      conversationId: 'conv-1',
      conversationHistory: [
        { role: 'user', content: 'previous', timestamp: 1 },
        { role: 'assistant', content: 'answer', timestamp: 2 },
        { role: 'user', content: 'next', timestamp: 3 },
      ],
    })

    expect(calls).toEqual([
      'add:conv-1:next:user',
      'process:next:conv-1:session-1:true:profile-1',
      'notify',
    ])
    expect(revived).toEqual([{ sessionId: 'session-1', startSnoozed: true }])
    expect(logMessages).toContain('Continuing conversation conv-1 with 2 previous messages')
    expect(logMessages).toContain('Revived existing session session-1')
    expect(stateChanges).toEqual([
      { isAgentModeActive: true, shouldStopAgent: false, agentIterationCount: 0 },
      { isAgentModeActive: false, shouldStopAgent: false, agentIterationCount: 0 },
    ])
  })

  it('creates a generated conversation and notifies on agent failure before resetting state', async () => {
    const { calls, service, stateChanges } = createRemoteAgentRunService({
      processAgentMode: async () => { throw new Error('agent failed') },
    })

    await expect(runRemoteAgentAction({
      prompt: 'new prompt',
    }, {
      service,
      diagnostics: {
        logInfo: () => {},
      },
    })).rejects.toThrow('agent failed')

    expect(calls).toEqual([
      'create:generated-conv:new prompt:user',
      'notify',
    ])
    expect(stateChanges).toEqual([
      { isAgentModeActive: true, shouldStopAgent: false, agentIterationCount: 0 },
      { isAgentModeActive: false, shouldStopAgent: false, agentIterationCount: 0 },
    ])
  })

  it('builds remote agent run executors from injected action options', async () => {
    const { calls, service } = createRemoteAgentRunService({
      getConfig: () => ({ remoteServerAutoShowPanel: true }),
      findSessionByConversationId: () => undefined,
    })
    const executor = createRemoteAgentRunExecutor({
      service,
      diagnostics: {
        logInfo: () => {},
      },
    })

    await expect(executor({
      prompt: 'executor prompt',
      conversationId: 'missing-conv',
    })).resolves.toMatchObject({
      content: 'done',
      conversationId: 'missing-conv',
    })

    expect(calls).toEqual([
      'add:missing-conv:executor prompt:user',
      'create:missing-conv:executor prompt:user',
      'process:executor prompt:missing-conv:new:false:',
      'notify',
    ])
  })
})

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
