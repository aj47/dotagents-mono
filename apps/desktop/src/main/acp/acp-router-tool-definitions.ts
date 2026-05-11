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
    name: 'delegate_to_agent',
    description:
      'Delegate a sub-task to a specialized ACP agent. The agent will work autonomously and return results. Use this when a task is better suited for a specialist.',
    inputSchema: {
      type: 'object' as const,
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
];

/**
 * Check if a tool name is a router tool.
 */
export function isRouterTool(toolName: string): boolean {
  return acpRouterToolDefinitions.some(def => def.name === toolName);
}
