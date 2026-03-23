/**
 * ACP Router Tool Definitions - Dependency-Free Module
 *
 * This module contains ONLY the static tool definitions for ACP router tools.
 * It is intentionally kept free of runtime dependencies to avoid circular
 * import issues when other modules need access to tool names/schemas.
 *
 * The tool execution handlers are in acp-router-tools.ts, which imports
 * from this file and adds runtime functionality.
 */

/**
 * Tool definitions for ACP router tools.
 * These are exposed as runtime tools for the main agent to use.
 */
export const acpRouterToolDefinitions = [
  {
    name: 'list_available_agents',
    description:
      'List all available specialized ACP agents that can be delegated to. Returns agent names, descriptions, and capabilities.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        capability: {
          type: 'string',
          description: 'Optional filter to only return agents with this capability',
        },
      },
      required: [],
    },
  },
  {
    name: 'delegate_to_agent',
    description:
      'Delegate a sub-task to a specialized ACP agent. Use this when a specialist has a clear advantage or the user explicitly asked for that agent; keep local repo/workspace coding and debugging in the current agent unless delegating a narrow parallel subtask.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agentName: {
          type: 'string',
          description: 'Name of the agent to delegate to (use the name or displayName from list_available_agents)',
        },
        task: {
          type: 'string',
          description: 'Description of the task to delegate. Required unless prepareOnly is true.',
        },
        context: {
          type: 'string',
          description: 'Optional additional context for the agent',
        },
        workingDirectory: {
          type: 'string',
          description: 'Optional working directory override for this delegation. Relative paths resolve from workspace root.',
        },
        prepareOnly: {
          type: 'boolean',
          description: 'If true, only prepare/spawn the agent without running the task (default: false).',
          default: false,
        },
        waitForResult: {
          type: 'boolean',
          description: 'Whether to wait for the agent to complete before continuing (default: false/background)',
          default: false,
        },
      },
      required: ['agentName'],
    },
  },
  {
    name: 'check_agent_status',
    description: 'Check the status of a running delegated agent task. If runId is omitted, checks the most recent delegated run (or filters by agentName if provided).',
    inputSchema: {
      type: 'object' as const,
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
      // Neither runId nor taskId is strictly required - falls back to most recent run
      required: [],
    },
  },
  {
    name: 'spawn_agent',
    description:
      'Prepare an ACP agent for delegation without executing a task. Compatibility wrapper around delegate_to_agent with prepareOnly=true.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agentName: {
          type: 'string',
          description: 'Name of the agent to spawn',
        },
        workingDirectory: {
          type: 'string',
          description: 'Optional working directory override for spawn. Relative paths resolve from workspace root.',
        },
      },
      required: ['agentName'],
    },
  },
  {
    name: 'stop_agent',
    description: 'Stop a running ACP agent process to free resources',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agentName: {
          type: 'string',
          description: 'Name of the agent to stop',
        },
      },
      required: ['agentName'],
    },
  },
  {
    name: 'cancel_agent_run',
    description: 'Cancel a running delegated agent task',
    inputSchema: {
      type: 'object' as const,
      properties: {
        runId: {
          type: 'string',
          description: 'The run ID returned from a previous delegate_to_agent call',
        },
        taskId: {
          type: 'string',
          description: 'Alternative name for runId (use either runId or taskId)',
        },
      },
      // Neither runId nor taskId is strictly required in schema since caller can use either
      // Runtime validation handles the case where neither is provided
      required: [],
    },
  },
  // Alias tool names for compatibility
  {
    name: 'send_to_agent',
    description:
      'Send a task to an agent. Alias for delegate_to_agent. Use this when a specialist has a clear advantage or the user explicitly asked for that agent; keep local repo/workspace coding and debugging in the current agent unless delegating a narrow parallel subtask.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agentName: {
          type: 'string',
          description: 'Name of the agent to send the task to (use the name or displayName from list_available_agents)',
        },
        task: {
          type: 'string',
          description: 'Description of the task to send. Required unless prepareOnly is true.',
        },
        context: {
          type: 'string',
          description: 'Optional additional context for the agent',
        },
        workingDirectory: {
          type: 'string',
          description: 'Optional working directory override for this delegation. Relative paths resolve from workspace root.',
        },
        prepareOnly: {
          type: 'boolean',
          description: 'If true, only prepare/spawn the agent without running the task (default: false).',
          default: false,
        },
        contextId: {
          type: 'string',
          description: 'Optional context ID to group related tasks',
        },
        waitForResult: {
          type: 'boolean',
          description: 'Whether to wait for the agent to complete before continuing (default: false/background)',
          default: false,
        },
      },
      required: ['agentName'],
    },
  },
];

/**
 * Mapping from alias tool names to their canonical equivalents.
 * Used for backward compatibility in the execution handler.
 */
export const toolNameAliases: Record<string, string> = {
  'send_to_agent': 'delegate_to_agent',
};

/**
 * Resolve a tool name to its canonical handler name.
 * This allows alias tool names to map to existing handlers.
 */
export function resolveToolName(toolName: string): string {
  return toolNameAliases[toolName] || toolName;
}

/**
 * Check if a tool name is a router tool (including aliases).
 */
export function isRouterTool(toolName: string): boolean {
  return acpRouterToolDefinitions.some(def => def.name === toolName);
}
