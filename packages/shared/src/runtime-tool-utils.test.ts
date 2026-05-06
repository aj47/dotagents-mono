import { describe, expect, it } from 'vitest';

import {
  acpRouterToolDefinitions,
  acpRouterToolNameAliases,
  baseRuntimeToolDefinitions,
  buildAgentSessionMissingConversationPayload,
  buildGetToolSchemaPayload,
  buildAgentSessionNotFoundPayload,
  buildKillAgentSessionPayload,
  buildKillAllAgentsNoopPayload,
  buildKillAllAgentsPayload,
  buildListRunningAgentsPayload,
  buildListServerToolsPayload,
  buildMarkWorkCompletePayload,
  buildRuntimeToolDefinitions,
  buildSetSessionTitleMissingConversationPayload,
  buildSetSessionTitlePayload,
  buildSetSessionTitleProgressUpdate,
  buildSetSessionTitleRenameFailedPayload,
  buildSendAgentMessageQueuedPayload,
  dotagentsRuntimeToolDefinitions,
  getRuntimeToolNames,
  isAcpRouterTool,
  parseReadMoreContextArgs,
  parseSendAgentMessageArgs,
  parseSetSessionTitleArgs,
  resolveAcpRouterToolName,
} from './runtime-tool-utils';

describe('runtime tool utils', () => {
  it('exports the base runtime tool schemas in prompt order', () => {
    expect(getRuntimeToolNames()).toEqual([
      'list_running_agents',
      'send_agent_message',
      'kill_agent',
      'respond_to_user',
      'set_session_title',
      'mark_work_complete',
      'execute_command',
      'list_server_tools',
      'get_tool_schema',
      'load_skill_instructions',
      'read_more_context',
    ]);
    expect(baseRuntimeToolDefinitions.find((tool) => tool.name === 'execute_command')?.inputSchema.required).toEqual(['command']);
  });

  it('composes inserted runtime tools after kill_agent', () => {
    const definitions = buildRuntimeToolDefinitions([{
      name: 'delegate_to_agent',
      description: 'Delegate a task to another agent.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    }]);

    expect(getRuntimeToolNames(definitions).slice(0, 5)).toEqual([
      'list_running_agents',
      'send_agent_message',
      'kill_agent',
      'delegate_to_agent',
      'respond_to_user',
    ]);
  });

  it('exports the shared DotAgents runtime tool list with ACP router tools inserted', () => {
    expect(dotagentsRuntimeToolDefinitions).toEqual(buildRuntimeToolDefinitions(acpRouterToolDefinitions));
    expect(getRuntimeToolNames(dotagentsRuntimeToolDefinitions)).toContain('delegate_to_agent');
    expect(getRuntimeToolNames(dotagentsRuntimeToolDefinitions)).toContain('respond_to_user');
  });

  it('exports ACP router tool schemas and aliases', () => {
    expect(getRuntimeToolNames(acpRouterToolDefinitions)).toEqual([
      'list_available_agents',
      'delegate_to_agent',
      'check_agent_status',
      'spawn_agent',
      'stop_agent',
      'cancel_agent_run',
      'send_to_agent',
    ]);
    expect(acpRouterToolNameAliases).toEqual({
      send_to_agent: 'delegate_to_agent',
    });
    expect(resolveAcpRouterToolName('send_to_agent')).toBe('delegate_to_agent');
    expect(resolveAcpRouterToolName('delegate_to_agent')).toBe('delegate_to_agent');
    expect(isAcpRouterTool('check_agent_status')).toBe(true);
    expect(isAcpRouterTool('missing_tool')).toBe(false);
  });

  it('builds an empty running-agent list payload', () => {
    expect(buildListRunningAgentsPayload([], 1000)).toEqual({
      agents: [],
      count: 0,
      message: 'No agents currently running',
    });
  });

  it('builds running-agent summaries with runtime seconds', () => {
    expect(buildListRunningAgentsPayload([{
      id: 'session-1',
      conversationId: 'conversation-1',
      conversationTitle: 'Refactor runtime tools',
      status: 'running',
      currentIteration: 2,
      maxIterations: 5,
      lastActivity: 1400,
      startTime: 1000,
      isSnoozed: false,
    }], 6500)).toEqual({
      agents: [{
        sessionId: 'session-1',
        conversationId: 'conversation-1',
        title: 'Refactor runtime tools',
        status: 'running',
        currentIteration: 2,
        maxIterations: 5,
        lastActivity: 1400,
        startTime: 1000,
        isSnoozed: false,
        runtimeSeconds: 5,
      }],
      count: 1,
    });
  });

  it('validates and clamps mark_work_complete payloads', () => {
    expect(buildMarkWorkCompletePayload({})).toEqual({
      success: false,
      error: 'summary must be a non-empty string',
    });
    expect(buildMarkWorkCompletePayload({ summary: 'Done', confidence: 'high' })).toEqual({
      success: false,
      error: 'confidence must be a number if provided',
    });
    expect(buildMarkWorkCompletePayload({ summary: ' Done ', confidence: 2 })).toEqual({
      success: true,
      markedComplete: true,
      summary: 'Done',
      confidence: 1,
      message: 'Completion signal recorded. The runtime will verify completion and finalize the turn without requiring another user-facing response.',
    });
    expect(buildMarkWorkCompletePayload({ summary: 'Done', confidence: -1 })).toEqual({
      success: true,
      markedComplete: true,
      summary: 'Done',
      confidence: 0,
      message: 'Completion signal recorded. The runtime will verify completion and finalize the turn without requiring another user-facing response.',
    });
  });

  it('parses send_agent_message arguments', () => {
    expect(parseSendAgentMessageArgs({})).toEqual({
      success: false,
      error: 'sessionId is required and must be a string',
    });
    expect(parseSendAgentMessageArgs({ sessionId: 'session-1' })).toEqual({
      success: false,
      error: 'message is required and must be a string',
    });
    expect(parseSendAgentMessageArgs({ sessionId: 'session-1', message: 'Please continue' })).toEqual({
      success: true,
      sessionId: 'session-1',
      message: 'Please continue',
    });
  });

  it('parses read_more_context arguments', () => {
    expect(parseReadMoreContextArgs({})).toEqual({
      success: false,
      error: 'contextRef must be a non-empty string',
    });
    expect(parseReadMoreContextArgs({
      contextRef: ' ctx_1 ',
      mode: 'window',
      offset: 50,
      length: 200,
      query: 'needle',
      maxChars: 1000,
    })).toEqual({
      success: true,
      contextRef: 'ctx_1',
      options: {
        mode: 'window',
        offset: 50,
        length: 200,
        query: 'needle',
        maxChars: 1000,
      },
    });
    expect(parseReadMoreContextArgs({
      contextRef: 'ctx_1',
      mode: 42,
      offset: '50',
    })).toEqual({
      success: true,
      contextRef: 'ctx_1',
      options: {
        mode: undefined,
        offset: undefined,
        length: undefined,
        query: undefined,
        maxChars: undefined,
      },
    });
  });

  it('parses set_session_title arguments and builds response payloads', () => {
    expect(parseSetSessionTitleArgs({})).toEqual({
      success: false,
      error: 'title must be a non-empty string',
    });
    expect(parseSetSessionTitleArgs({ title: '  ' })).toEqual({
      success: false,
      error: 'title must be a non-empty string',
    });
    expect(parseSetSessionTitleArgs({ title: ' New title ' })).toEqual({
      success: true,
      title: ' New title ',
    });
    expect(buildSetSessionTitleMissingConversationPayload()).toEqual({
      success: false,
      error: 'Current session is not linked to a conversation',
    });
    expect(buildSetSessionTitleRenameFailedPayload()).toEqual({
      success: false,
      error: 'Failed to update conversation title',
    });
    expect(buildSetSessionTitlePayload('New title')).toEqual({
      success: true,
      title: 'New title',
    });
  });

  it('builds set_session_title delegated progress updates', () => {
    expect(buildSetSessionTitleProgressUpdate({
      sessionId: 'delegated-session-1',
      parentSessionId: 'app-session-1',
      runId: 42,
      conversationTitle: 'Delegated title',
      sessionStatus: 'active',
    })).toEqual({
      sessionId: 'delegated-session-1',
      parentSessionId: 'app-session-1',
      runId: 42,
      conversationTitle: 'Delegated title',
      currentIteration: 0,
      maxIterations: 1,
      steps: [],
      isComplete: false,
      conversationState: 'running',
    });
    expect(buildSetSessionTitleProgressUpdate({
      sessionId: 'delegated-session-1',
      parentSessionId: 'app-session-1',
      conversationTitle: 'Delegated title',
      sessionStatus: 'completed',
    })).toEqual(expect.objectContaining({
      isComplete: true,
      conversationState: 'complete',
    }));
    expect(buildSetSessionTitleProgressUpdate({
      sessionId: 'delegated-session-1',
      parentSessionId: 'app-session-1',
      conversationTitle: 'Delegated title',
      sessionStatus: 'stopped',
    })).toEqual(expect.objectContaining({
      isComplete: true,
      conversationState: 'blocked',
    }));
  });

  it('builds send_agent_message payloads', () => {
    expect(buildAgentSessionNotFoundPayload('session-1')).toEqual({
      success: false,
      error: 'Agent session not found: session-1',
    });
    expect(buildAgentSessionMissingConversationPayload()).toEqual({
      success: false,
      error: 'Target agent session has no linked conversation',
    });
    expect(buildSendAgentMessageQueuedPayload({
      sessionId: 'session-1',
      conversationId: 'conversation-1',
      conversationTitle: 'Agent work',
      queuedMessageId: 'queued-1',
    })).toEqual({
      success: true,
      sessionId: 'session-1',
      conversationId: 'conversation-1',
      queuedMessageId: 'queued-1',
      message: 'Message queued for agent session session-1 (Agent work)',
    });
  });

  it('builds kill_agent payloads', () => {
    expect(buildKillAgentSessionPayload({
      sessionId: 'session-1',
      conversationTitle: 'Agent work',
    })).toEqual({
      success: true,
      sessionId: 'session-1',
      message: 'Agent session session-1 (Agent work) terminated',
    });
    expect(buildKillAllAgentsNoopPayload()).toEqual({
      success: true,
      message: 'No agents were running',
      sessionsTerminated: 0,
    });
    expect(buildKillAllAgentsPayload({
      sessionsTerminated: 3,
      processesBefore: 7,
      processesAfter: 2,
    })).toEqual({
      success: true,
      message: 'Emergency stop: 3 session(s) terminated',
      sessionsTerminated: 3,
      processesKilled: 5,
    });
  });

  it('validates and reports empty list_server_tools results', () => {
    expect(buildListServerToolsPayload({}, [], {})).toEqual({
      payload: {
        success: false,
        error: 'serverName must be a non-empty string',
      },
      isError: true,
    });
    expect(buildListServerToolsPayload({ serverName: 'docs' }, [], {
      docs: { connected: true, toolCount: 0 },
    })).toEqual({
      payload: {
        success: true,
        serverName: 'docs',
        connected: true,
        tools: [],
        count: 0,
        message: 'Server is connected but has no tools available',
      },
      isError: false,
    });
    expect(buildListServerToolsPayload({ serverName: 'docs' }, [], {})).toEqual({
      payload: {
        success: false,
        error: "Server 'docs' not found. Check the configured server list in the prompt, app UI, or .agents/mcp.json.",
      },
      isError: true,
    });
  });

  it('builds list_server_tools summaries', () => {
    expect(buildListServerToolsPayload({ serverName: 'docs' }, [
      { name: 'docs:search', description: 'Search docs', inputSchema: { type: 'object' } },
      { name: 'github:list_prs', description: 'List pull requests', inputSchema: { type: 'object' } },
      { name: 'docs:fetch', description: 'Fetch docs', inputSchema: { type: 'object' } },
    ], {})).toEqual({
      payload: {
        success: true,
        serverName: 'docs',
        tools: [
          { name: 'docs:search', shortName: 'search', description: 'Search docs' },
          { name: 'docs:fetch', shortName: 'fetch', description: 'Fetch docs' },
        ],
        count: 2,
        hint: 'Use get_tool_schema to get full parameter details for a specific tool',
      },
      isError: false,
    });
  });

  it('builds get_tool_schema payloads', () => {
    const tools = [
      { name: 'docs:search', description: 'Search docs', inputSchema: { type: 'object', properties: { q: { type: 'string' } } } },
      { name: 'github:search', description: 'Search GitHub', inputSchema: { type: 'object', properties: { query: { type: 'string' } } } },
      { name: 'github:list_prs', description: 'List pull requests', inputSchema: { type: 'object' } },
    ];

    expect(buildGetToolSchemaPayload({}, tools)).toEqual({
      payload: {
        success: false,
        error: 'toolName must be a non-empty string',
      },
      isError: true,
    });
    expect(buildGetToolSchemaPayload({ toolName: 'github:list_prs' }, tools)).toEqual({
      payload: {
        success: true,
        name: 'github:list_prs',
        description: 'List pull requests',
        inputSchema: { type: 'object' },
      },
      isError: false,
    });
    expect(buildGetToolSchemaPayload({ toolName: 'search' }, tools)).toEqual({
      payload: {
        success: false,
        error: "Ambiguous tool name 'search' - found in multiple servers. Please use the fully-qualified name.",
        matchingTools: ['docs:search', 'github:search'],
        hint: "Use one of the fully-qualified tool names listed above (e.g., 'server:tool_name')",
      },
      isError: true,
    });
  });

  it('reports get_tool_schema misses with available tools', () => {
    const tools = Array.from({ length: 12 }, (_, index) => ({
      name: `server:tool_${index + 1}`,
      description: `Tool ${index + 1}`,
      inputSchema: { type: 'object' },
    }));

    expect(buildGetToolSchemaPayload({ toolName: 'missing' }, tools)).toEqual({
      payload: {
        success: false,
        error: "Tool 'missing' not found. Use list_server_tools to see available tools for a server.",
        availableTools: [
          'server:tool_1',
          'server:tool_2',
          'server:tool_3',
          'server:tool_4',
          'server:tool_5',
          'server:tool_6',
          'server:tool_7',
          'server:tool_8',
          'server:tool_9',
          'server:tool_10',
        ],
        hint: '...and 2 more tools',
      },
      isError: true,
    });
  });
});
