import type { AgentProgressUpdate } from './agent-progress';

export interface RuntimeToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
    [key: string]: unknown;
  };
}

export const SET_SESSION_TITLE_TOOL = 'set_session_title';
export const EXECUTE_COMMAND_TOOL = 'execute_command';
export const READ_MORE_CONTEXT_TOOL = 'read_more_context';
export const DEFAULT_AGENT_RUNTIME_TOOL_NAMES = [
  SET_SESSION_TITLE_TOOL,
  EXECUTE_COMMAND_TOOL,
  READ_MORE_CONTEXT_TOOL,
  'mark_work_complete',
] as const;

export const baseRuntimeToolDefinitions: RuntimeToolDefinition[] = [
  {
    name: 'respond_to_user',
    description:
      "Send a response through DotAgents' explicit delivery channel. Normal assistant text is valid for ordinary chat and simple final answers; use this tool when you specifically need voice/TTS or messaging-channel delivery semantics, or when sending images/videos. Provide at least one of: non-empty text, one/more images, or one/more videos.",
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description:
            'Optional response text for the user. Write naturally and conversationally. Markdown is allowed when helpful (for example links or image captions).',
        },
        images: {
          type: 'array',
          description:
            'Optional images to include in the message. Each image can be provided as a URL/data URL, or as a local file path that will be embedded automatically.',
          items: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'HTTP(S) URL or data:image URL for the image.',
              },
              path: {
                type: 'string',
                description: 'Local image file path (absolute, or relative to the current working directory).',
              },
              alt: {
                type: 'string',
                description: 'Optional alt text shown with markdown image syntax.',
              },
            },
            required: [],
          },
        },
        videos: {
          type: 'array',
          description:
            'Optional videos to include in the message. Each video can be provided as an HTTP(S) URL or as a local file path that will be stored as a conversation asset and streamed lazily by desktop/mobile.',
          items: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'HTTP(S) URL for the video.',
              },
              path: {
                type: 'string',
                description: 'Local video file path (absolute, or relative to the current working directory). Supported extensions: mp4, m4v, webm, mov, ogv.',
              },
              label: {
                type: 'string',
                description: 'Optional label shown on the video card.',
              },
            },
            required: [],
          },
        },
      },
      required: [],
    },
  },
  {
    name: SET_SESSION_TITLE_TOOL,
    description:
      'Set or update the current session title. Use this once the task is clear, early enough to make the UI useful, or later if the conversation topic shifts. Keep the title short, specific, and ideally under 10 words.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short session title, ideally under 10 words and without quotes.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'mark_work_complete',
    description: 'Signal explicit completion for the current task. Call this only when all requested work is actually finished and ready for final delivery.',
    inputSchema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Concise summary of what was completed for the user.',
        },
        confidence: {
          type: 'number',
          description: 'Optional confidence from 0 to 1 that the task is fully complete.',
        },
      },
      required: ['summary'],
    },
  },
  {
    name: 'execute_command',
    description: "Execute any shell command. This is the primary tool for filesystem operations, running scripts, and automation. Use for: searching files (rg/find), reading files in targeted ranges (wc/sed/head/tail/cat), editing files, listing directories (ls), creating directories (mkdir -p), git operations, package-manager/python/node commands, and any shell command. Respect the repo's lockfile/package-manager conventions: pnpm-lock.yaml => pnpm, package-lock.json => npm, yarn.lock => yarn, bun.lock/bun.lockb => bun. Prefer read-only inspection commands first for planning/context tasks. Only run package-manager install/test/build/lint/typecheck commands when the user explicitly asks for verification/package work, or when validating code changes you already made.",
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: "The shell command to execute. Examples: 'wc -l file.txt' (size), 'sed -n \\'1,120p\\' file.txt' (targeted read), 'rg TODO apps/desktop/src' (search), 'ls -la' (list), 'mkdir -p dir' (create dir), 'git status', 'python script.py'. Prefer read-only inspection commands unless the user asked you to run verification/package-manager work.",
        },
        timeout: {
          type: 'number',
          description: 'Command timeout in milliseconds (default: 30000). Set to 0 for no timeout.',
        },
      },
      required: ['command'],
    },
  },
  {
    name: READ_MORE_CONTEXT_TOOL,
    description: 'Read a specific slice of earlier compacted context using a Context ref shown in truncated or summarized messages. Prefer overview/search/window reads over fetching large heads or tails.',
    inputSchema: {
      type: 'object',
      properties: {
        contextRef: {
          type: 'string',
          description: "The Context ref token shown in a compacted message, for example 'ctx_ab12cd34'.",
        },
        mode: {
          type: 'string',
          description: 'Read mode: overview, head, tail, window, or search.',
          enum: ['overview', 'head', 'tail', 'window', 'search'],
        },
        offset: {
          type: 'number',
          description: 'For window mode: starting character offset into the original content.',
        },
        length: {
          type: 'number',
          description: 'For window mode: number of characters to return.',
        },
        query: {
          type: 'string',
          description: 'For search mode: text to search for within the original compacted content.',
        },
        maxChars: {
          type: 'number',
          description: 'Optional maximum characters to return, capped internally for safety.',
        },
      },
      required: ['contextRef'],
    },
  },
];

export const acpRouterToolDefinitions: RuntimeToolDefinition[] = [
  {
    name: 'delegate_to_agent',
    description:
      'Delegate a sub-task to a specialized ACP agent. The agent will work autonomously and return results. Use this when a task is better suited for a specialist.',
    inputSchema: {
      type: 'object',
      properties: {
        agentName: {
          type: 'string',
          description: 'Name of the agent to delegate to (use the name or displayName from the available agents prompt)',
        },
        task: {
          type: 'string',
          description: 'Description of the task to delegate.',
        },
        context: {
          type: 'string',
          description: 'Optional additional context for the agent',
        },
        workingDirectory: {
          type: 'string',
          description: 'Optional working directory override for this delegation. Relative paths resolve from workspace root.',
        },
        waitForResult: {
          type: 'boolean',
          description: 'Whether to wait for the agent to complete before continuing (default: false/background)',
          default: false,
        },
      },
      required: ['agentName', 'task'],
    },
  },
  {
    name: 'check_agent_status',
    description: 'Check the status of a delegated agent task. If runId is omitted, checks the most recent delegated run (or filters by agentName if provided). When the run is completed, the response includes the task and completed output on every poll.',
    inputSchema: {
      type: 'object',
      properties: {
        runId: {
          type: 'string',
          description: 'The run ID returned from a previous delegate_to_agent call. If omitted, the most recent run is checked.',
        },
        taskId: {
          type: 'string',
          description: 'Alternative name for runId (use either runId or taskId)',
        },
        agentName: {
          type: 'string',
          description: 'Optional agent name to filter by when runId is not provided',
        },
      },
      required: [],
    },
  },
];

export const acpRouterToolNameAliases: Record<string, string> = {};

export function resolveAcpRouterToolName(toolName: string): string {
  return acpRouterToolNameAliases[toolName] || toolName;
}

export function isAcpRouterTool(toolName: string): boolean {
  return acpRouterToolDefinitions.some((definition) => definition.name === toolName);
}

const RUNTIME_TOOL_INSERT_INDEX = 0;

export function buildRuntimeToolDefinitions(
  insertedDefinitions: readonly RuntimeToolDefinition[] = [],
): RuntimeToolDefinition[] {
  return [
    ...baseRuntimeToolDefinitions.slice(0, RUNTIME_TOOL_INSERT_INDEX),
    ...insertedDefinitions,
    ...baseRuntimeToolDefinitions.slice(RUNTIME_TOOL_INSERT_INDEX),
  ];
}

export const dotagentsRuntimeToolDefinitions: RuntimeToolDefinition[] = buildRuntimeToolDefinitions(acpRouterToolDefinitions);

export function getRuntimeToolNames(
  definitions: readonly RuntimeToolDefinition[] = baseRuntimeToolDefinitions,
): string[] {
  return definitions.map((tool) => tool.name);
}

export type RuntimeAgentSessionLike = {
  id: string;
  conversationId?: string;
  conversationTitle?: string;
  status?: string;
  currentIteration?: number;
  maxIterations?: number;
  lastActivity?: number | string;
  startTime: number;
  isSnoozed?: boolean;
};

export type RunningAgentSummary = {
  sessionId: string;
  conversationId?: string;
  title?: string;
  status?: string;
  currentIteration?: number;
  maxIterations?: number;
  lastActivity?: number | string;
  startTime: number;
  isSnoozed?: boolean;
  runtimeSeconds: number;
};

export type ListRunningAgentsPayload = {
  agents: RunningAgentSummary[];
  count: number;
  message?: string;
};

export type MarkWorkCompletePayload =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      markedComplete: true;
      summary: string;
      confidence?: number;
      message: string;
    };

export type SendAgentMessageArgs =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      sessionId: string;
      message: string;
    };

export type SendAgentMessageQueuedPayload = {
  success: true;
  sessionId: string;
  conversationId: string;
  queuedMessageId: string;
  message: string;
};

export type SetSessionTitleArgs =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      title: string;
    };

export type SetSessionTitlePayload =
  | RuntimeToolErrorPayload
  | {
      success: true;
      title: string;
    };

export type ReadMoreContextMode = 'overview' | 'head' | 'tail' | 'window' | 'search';

export type ReadMoreContextOptions = {
  mode?: ReadMoreContextMode;
  offset?: number;
  length?: number;
  query?: string;
  maxChars?: number;
};

export type ReadMoreContextArgs =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      contextRef: string;
      options: ReadMoreContextOptions;
    };

export type RuntimeToolErrorPayload = {
  success: false;
  error: string;
  [key: string]: unknown;
};

export type KillAgentPayload = {
  success: true;
  sessionId?: string;
  message: string;
  sessionsTerminated?: number;
  processesKilled?: number;
};

export type SetSessionTitleProgressInput = {
  sessionId: string;
  parentSessionId?: string;
  runId?: number;
  conversationTitle: string;
  sessionStatus?: string;
};

export type RuntimeMcpToolLike = {
  name: string;
  description?: string;
  inputSchema?: unknown;
};

export type RuntimeMcpServerStatusLike = {
  connected: boolean;
  toolCount?: number;
  error?: string;
  runtimeEnabled?: boolean;
  configDisabled?: boolean;
};

export type RuntimeMcpServerStatusMapLike = Record<string, RuntimeMcpServerStatusLike>;

export type RuntimeToolJsonPayloadResult<TPayload> = {
  payload: TPayload;
  isError: boolean;
};

export type RuntimeMcpToolSummary = {
  name: string;
  shortName: string;
  description?: string;
};

export type ListServerToolsPayload =
  | RuntimeToolErrorPayload
  | {
      success: true;
      serverName: string;
      connected: boolean;
      tools: [];
      count: 0;
      message: string;
    }
  | {
      success: true;
      serverName: string;
      tools: RuntimeMcpToolSummary[];
      count: number;
      hint: string;
    };

export type GetToolSchemaPayload =
  | RuntimeToolErrorPayload
  | {
      success: true;
      name: string;
      description?: string;
      inputSchema?: unknown;
    };

export function buildListRunningAgentsPayload(
  sessions: RuntimeAgentSessionLike[],
  nowMs: number = Date.now(),
): ListRunningAgentsPayload {
  if (sessions.length === 0) {
    return {
      agents: [],
      count: 0,
      message: 'No agents currently running',
    };
  }

  const agents = sessions.map((session) => ({
    sessionId: session.id,
    conversationId: session.conversationId,
    title: session.conversationTitle,
    status: session.status,
    currentIteration: session.currentIteration,
    maxIterations: session.maxIterations,
    lastActivity: session.lastActivity,
    startTime: session.startTime,
    isSnoozed: session.isSnoozed,
    runtimeSeconds: Math.floor((nowMs - session.startTime) / 1000),
  }));

  return {
    agents,
    count: agents.length,
  };
}

function getRuntimeMcpToolServerName(toolName: string): string {
  return toolName.includes(':') ? toolName.split(':')[0] : 'unknown';
}

function getRuntimeMcpToolShortName(toolName: string): string {
  return toolName.includes(':') ? toolName.split(':')[1] : toolName;
}

export function buildListServerToolsPayload(
  args: Record<string, unknown>,
  allTools: RuntimeMcpToolLike[],
  serverStatus: RuntimeMcpServerStatusMapLike,
): RuntimeToolJsonPayloadResult<ListServerToolsPayload> {
  if (typeof args.serverName !== 'string' || args.serverName.trim() === '') {
    return {
      payload: {
        success: false,
        error: 'serverName must be a non-empty string',
      },
      isError: true,
    };
  }

  const serverName = args.serverName.trim();
  const serverTools = allTools.filter((tool) => getRuntimeMcpToolServerName(tool.name) === serverName);

  if (serverTools.length === 0) {
    const status = serverStatus[serverName];
    if (status) {
      return {
        payload: {
          success: true,
          serverName,
          connected: status.connected,
          tools: [],
          count: 0,
          message: status.connected
            ? 'Server is connected but has no tools available'
            : 'Server is not connected',
        },
        isError: false,
      };
    }

    return {
      payload: {
        success: false,
        error: `Server '${serverName}' not found. Check the configured server list in the prompt, app UI, or .agents/mcp.json.`,
      },
      isError: true,
    };
  }

  const toolList = serverTools.map((tool) => ({
    name: tool.name,
    shortName: getRuntimeMcpToolShortName(tool.name),
    description: tool.description,
  }));

  return {
    payload: {
      success: true,
      serverName,
      tools: toolList,
      count: toolList.length,
      hint: 'Use get_tool_schema to get full parameter details for a specific tool',
    },
    isError: false,
  };
}

export function buildGetToolSchemaPayload(
  args: Record<string, unknown>,
  allTools: RuntimeMcpToolLike[],
): RuntimeToolJsonPayloadResult<GetToolSchemaPayload> {
  if (typeof args.toolName !== 'string' || args.toolName.trim() === '') {
    return {
      payload: {
        success: false,
        error: 'toolName must be a non-empty string',
      },
      isError: true,
    };
  }

  const toolName = args.toolName.trim();
  let tool = allTools.find((candidate) => candidate.name === toolName);

  if (!tool && !toolName.includes(':')) {
    const matchingTools = allTools.filter((candidate) => getRuntimeMcpToolShortName(candidate.name) === toolName);

    if (matchingTools.length > 1) {
      return {
        payload: {
          success: false,
          error: `Ambiguous tool name '${toolName}' - found in multiple servers. Please use the fully-qualified name.`,
          matchingTools: matchingTools.map((candidate) => candidate.name),
          hint: "Use one of the fully-qualified tool names listed above (e.g., 'server:tool_name')",
        },
        isError: true,
      };
    }

    tool = matchingTools[0];
  }

  if (!tool) {
    return {
      payload: {
        success: false,
        error: `Tool '${toolName}' not found. Use list_server_tools to see available tools for a server.`,
        availableTools: allTools.slice(0, 10).map((candidate) => candidate.name),
        hint: allTools.length > 10 ? `...and ${allTools.length - 10} more tools` : undefined,
      },
      isError: true,
    };
  }

  return {
    payload: {
      success: true,
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    },
    isError: false,
  };
}

export function parseSendAgentMessageArgs(args: Record<string, unknown>): SendAgentMessageArgs {
  if (!args.sessionId || typeof args.sessionId !== 'string') {
    return {
      success: false,
      error: 'sessionId is required and must be a string',
    };
  }

  if (!args.message || typeof args.message !== 'string') {
    return {
      success: false,
      error: 'message is required and must be a string',
    };
  }

  return {
    success: true,
    sessionId: args.sessionId,
    message: args.message,
  };
}

export function parseSetSessionTitleArgs(args: Record<string, unknown>): SetSessionTitleArgs {
  if (typeof args.title !== 'string' || args.title.trim() === '') {
    return {
      success: false,
      error: 'title must be a non-empty string',
    };
  }

  return {
    success: true,
    title: args.title,
  };
}

export function parseReadMoreContextArgs(args: Record<string, unknown>): ReadMoreContextArgs {
  if (typeof args.contextRef !== 'string' || args.contextRef.trim() === '') {
    return {
      success: false,
      error: 'contextRef must be a non-empty string',
    };
  }

  return {
    success: true,
    contextRef: args.contextRef.trim(),
    options: {
      mode: typeof args.mode === 'string' ? args.mode as ReadMoreContextMode : undefined,
      offset: typeof args.offset === 'number' ? args.offset : undefined,
      length: typeof args.length === 'number' ? args.length : undefined,
      query: typeof args.query === 'string' ? args.query : undefined,
      maxChars: typeof args.maxChars === 'number' ? args.maxChars : undefined,
    },
  };
}

export function buildSetSessionTitleMissingConversationPayload(): RuntimeToolErrorPayload {
  return {
    success: false,
    error: 'Current session is not linked to a conversation',
  };
}

export function buildSetSessionTitleRenameFailedPayload(): RuntimeToolErrorPayload {
  return {
    success: false,
    error: 'Failed to update conversation title',
  };
}

export function buildSetSessionTitlePayload(title: string): SetSessionTitlePayload {
  return {
    success: true,
    title,
  };
}

export function buildSetSessionTitleProgressUpdate(input: SetSessionTitleProgressInput): AgentProgressUpdate {
  const isSessionComplete = input.sessionStatus === 'completed'
    || input.sessionStatus === 'error'
    || input.sessionStatus === 'stopped';
  const conversationState = input.sessionStatus === 'completed'
    ? 'complete'
    : isSessionComplete
      ? 'blocked'
      : 'running';

  return {
    sessionId: input.sessionId,
    ...(input.parentSessionId && input.parentSessionId !== input.sessionId ? { parentSessionId: input.parentSessionId } : {}),
    ...(typeof input.runId === 'number' ? { runId: input.runId } : {}),
    conversationTitle: input.conversationTitle,
    currentIteration: 0,
    maxIterations: 1,
    steps: [],
    isComplete: isSessionComplete,
    conversationState,
  };
}

export function buildAgentSessionNotFoundPayload(sessionId: string): RuntimeToolErrorPayload {
  return {
    success: false,
    error: `Agent session not found: ${sessionId}`,
  };
}

export function buildAgentSessionMissingConversationPayload(): RuntimeToolErrorPayload {
  return {
    success: false,
    error: 'Target agent session has no linked conversation',
  };
}

export function buildSendAgentMessageQueuedPayload(input: {
  sessionId: string;
  conversationId: string;
  conversationTitle?: string;
  queuedMessageId: string;
}): SendAgentMessageQueuedPayload {
  return {
    success: true,
    sessionId: input.sessionId,
    conversationId: input.conversationId,
    queuedMessageId: input.queuedMessageId,
    message: `Message queued for agent session ${input.sessionId} (${input.conversationTitle})`,
  };
}

export function buildKillAgentSessionPayload(input: {
  sessionId: string;
  conversationTitle?: string;
}): KillAgentPayload {
  return {
    success: true,
    sessionId: input.sessionId,
    message: `Agent session ${input.sessionId} (${input.conversationTitle}) terminated`,
  };
}

export function buildKillAllAgentsNoopPayload(): KillAgentPayload {
  return {
    success: true,
    message: 'No agents were running',
    sessionsTerminated: 0,
  };
}

export function buildKillAllAgentsPayload(input: {
  sessionsTerminated: number;
  processesBefore: number;
  processesAfter: number;
}): KillAgentPayload {
  return {
    success: true,
    message: `Emergency stop: ${input.sessionsTerminated} session(s) terminated`,
    sessionsTerminated: input.sessionsTerminated,
    processesKilled: input.processesBefore - input.processesAfter,
  };
}

export function buildMarkWorkCompletePayload(args: Record<string, unknown>): MarkWorkCompletePayload {
  if (typeof args.summary !== 'string' || args.summary.trim() === '') {
    return {
      success: false,
      error: 'summary must be a non-empty string',
    };
  }

  if (args.confidence !== undefined && (typeof args.confidence !== 'number' || Number.isNaN(args.confidence))) {
    return {
      success: false,
      error: 'confidence must be a number if provided',
    };
  }

  const summary = args.summary.trim();
  const confidence = typeof args.confidence === 'number'
    ? Math.max(0, Math.min(1, args.confidence))
    : undefined;

  return {
    success: true,
    markedComplete: true,
    summary,
    confidence,
    message: 'Completion signal recorded. The runtime will verify completion and finalize the turn without requiring another user-facing response.',
  };
}
