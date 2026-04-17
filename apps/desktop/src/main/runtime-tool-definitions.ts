/**
 * Runtime Tool Definitions - Dependency-Free Module
 *
 * This module contains the static definitions for DotAgents runtime tools.
 * It is intentionally kept free of dependencies on other app modules
 * to avoid circular import issues.
 *
 * The tool execution handlers are in runtime-tools.ts, which can safely
 * import from services that might also need access to these definitions.
 */

import { RUNTIME_TOOLS_SERVER_NAME } from '../shared/runtime-tool-names'
import { acpRouterToolDefinitions } from './acp/acp-router-tool-definitions'

export { RUNTIME_TOOLS_SERVER_NAME }

// Define a local type to avoid importing from mcp-service
export interface RuntimeToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, unknown>
    required: string[]
    [key: string]: unknown
  }
}

// Tool definitions — runtime tools use plain names (no server prefix)
export const runtimeToolDefinitions: RuntimeToolDefinition[] = [
  {
    name: "list_running_agents",
    description: "List all currently running agent sessions with their status, iteration count, and activity. Useful for monitoring active agents before terminating them.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "send_agent_message",
    description: "Send a message to another running agent session. The message will be queued and processed by the target agent's conversation. Use list_running_agents first to get session IDs. This enables agent coordination and task delegation.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID of the target agent (get this from list_running_agents)",
        },
        message: {
          type: "string",
          description: "The message to send to the target agent",
        },
      },
      required: ["sessionId", "message"],
    },
  },
  {
    name: "kill_agent",
    description: "Terminate agent sessions. Pass a sessionId to kill a specific agent, or omit it to kill ALL running agents. Aborts in-flight LLM requests, kills spawned processes, and stops agents immediately.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID of the agent to terminate (get this from list_running_agents). Omit to kill all agents.",
        },
      },
      required: [],
    },
  },
  // ACP router tools for agent delegation
  // These tools are logically distinct from settings management but are all treated as
  // runtime tools for execution purposes (see isRuntimeTool in runtime-tools.ts).
  ...acpRouterToolDefinitions,
  {
    name: "respond_to_user",
    description:
      "Send a response directly to the user. On voice interfaces this will be spoken aloud via TTS; on messaging channels (mobile, WhatsApp, etc.) it will be sent as a message. Regular assistant text is internal and not guaranteed to reach the user; use this tool to explicitly communicate with them. Provide at least one of: non-empty text or one/more images.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description:
            "Optional response text for the user. Write naturally and conversationally. Markdown is allowed when helpful (for example links or image captions).",
        },
        images: {
          type: "array",
          description:
            "Optional images to include in the message. Each image can be provided as a URL/data URL, or as a local file path that will be embedded automatically.",
          items: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "HTTP(S) URL or data:image URL for the image.",
              },
              path: {
                type: "string",
                description: "Local image file path (absolute, or relative to the current working directory).",
              },
              alt: {
                type: "string",
                description: "Optional alt text shown with markdown image syntax.",
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
    name: "set_session_title",
    description:
      "Set or update the current session title. Use this after the first substantive reply to replace a raw first-prompt title, or later if the conversation topic shifts. Keep the title short, specific, and ideally under 10 words.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short session title, ideally under 10 words and without quotes.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "mark_work_complete",
    description: "Signal explicit completion for the current task. Call this only when all requested work is actually finished and ready for final delivery.",
    inputSchema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Concise summary of what was completed for the user.",
        },
        confidence: {
          type: "number",
          description: "Optional confidence from 0 to 1 that the task is fully complete.",
        },
      },
      required: ["summary"],
    },
  },
  {
    name: "execute_command",
    description: "Execute any shell command. This is the primary tool for file operations, running scripts, and automation. Use for: reading files (cat), writing files (cat/echo with redirection), listing directories (ls), creating directories (mkdir -p), git operations, package-manager/python/node commands, and any shell command. Respect the repo's lockfile/package-manager conventions: pnpm-lock.yaml => pnpm, package-lock.json => npm, yarn.lock => yarn, bun.lock/bun.lockb => bun. Prefer read-only inspection commands first for planning/context tasks. Only run package-manager install/test/build/lint/typecheck commands when the user explicitly asks for verification/package work, or when validating code changes you already made. Omit skillId for normal workspace or repository commands. Only provide skillId when you need to run inside an exact loaded skill ID from Available Skills.",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The shell command to execute. Examples: 'cat file.txt' (read), 'echo content > file.txt' (write), 'ls -la' (list), 'mkdir -p dir' (create dir), 'git status', 'rg TODO apps/desktop/src', 'python script.py'. Prefer read-only inspection commands unless the user asked you to run verification/package-manager work.",
        },
        skillId: {
          type: "string",
          description: "Optional exact loaded skill ID to run the command in that skill's directory. Use only IDs from Available Skills. Never use repository names, paths, URLs, or GitHub slugs here; omit skillId for normal workspace commands.",
        },
        timeout: {
          type: "number",
          description: "Command timeout in milliseconds (default: 30000). Set to 0 for no timeout.",
        },
      },
      required: ["command"],
    },
  },

  {
    name: "list_server_tools",
    description: "List all tools available from a specific MCP server. Use this to discover what tools a server provides before calling them.",
    inputSchema: {
      type: "object",
      properties: {
        serverName: {
          type: "string",
          description: "The name of the MCP server to list tools from (e.g., 'github', 'filesystem'). Use the prompt, app UI, or .agents/mcp.json to find server names.",
        },
      },
      required: ["serverName"],
    },
  },
  {
    name: "get_tool_schema",
    description: "Get the full JSON schema for a specific tool, including all parameter details. Use this when you need to know the exact parameters to pass to a tool.",
    inputSchema: {
      type: "object",
      properties: {
        toolName: {
          type: "string",
          description: "The full tool name including server prefix (e.g., 'github:create_issue', 'filesystem:read_file')",
        },
      },
      required: ["toolName"],
    },
  },
  {
    name: "load_skill_instructions",
    description: "Load the full instructions for a skill. Pass the exact skill id shown in the Available Skills list (the value inside backticks before the dash).",
    inputSchema: {
      type: "object",
      properties: {
        skillId: {
          type: "string",
          description: "Exact skill id from the Available Skills list, e.g. \"api-testing\".",
        },
      },
      required: ["skillId"],
    },
  },
  {
    name: "read_more_context",
    description: "Read a specific slice of earlier compacted context using a Context ref shown in truncated or summarized messages. Prefer overview/search/window reads over fetching large heads or tails.",
    inputSchema: {
      type: "object",
      properties: {
        contextRef: {
          type: "string",
          description: "The Context ref token shown in a compacted message, for example 'ctx_ab12cd34'.",
        },
        mode: {
          type: "string",
          description: "Read mode: overview, head, tail, window, or search.",
          enum: ["overview", "head", "tail", "window", "search"],
        },
        offset: {
          type: "number",
          description: "For window mode: starting character offset into the original content.",
        },
        length: {
          type: "number",
          description: "For window mode: number of characters to return.",
        },
        query: {
          type: "string",
          description: "For search mode: text to search for within the original compacted content.",
        },
        maxChars: {
          type: "number",
          description: "Optional maximum characters to return, capped internally for safety.",
        },
      },
      required: ["contextRef"],
    },
  },
  {
    name: "create_artifact",
    description:
      "Create a new interactive HTML artifact on the user's Artifacts page. Use this to build a self-contained mini webapp (dashboard, form, visualization, game, etc.) that the user can run and interact with. The artifact renders in a sandboxed iframe: no network access, no access to host APIs. A form can post results back to the agent via <form data-dotagents-submit>. Provide a descriptive title. index.html is required. style.css and script.js are optional; inline <style>/<script> in index.html also work. Returns the artifact id.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short human-readable title." },
        files: {
          type: "object",
          description: "File contents. Keys: 'index.html' (required), 'style.css', 'script.js'.",
          properties: {
            "index.html": { type: "string" },
            "style.css": { type: "string" },
            "script.js": { type: "string" },
          },
          required: ["index.html"],
        },
        note: { type: "string", description: "Optional short note describing this version." },
        open: { type: "boolean", description: "If true, navigate the user to the artifact after creating it. Defaults to true." },
      },
      required: ["title", "files"],
    },
  },
  {
    name: "update_artifact",
    description:
      "Create a new version of an existing artifact with updated file contents. The previous version is preserved. Use this to iterate on an artifact based on user feedback.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The artifact id returned by create_artifact." },
        files: {
          type: "object",
          properties: {
            "index.html": { type: "string" },
            "style.css": { type: "string" },
            "script.js": { type: "string" },
          },
        },
        note: { type: "string", description: "Optional short note describing this version." },
      },
      required: ["id", "files"],
    },
  },
  {
    name: "read_artifact",
    description:
      "Read the current version of an artifact, including its files. Use this to inspect an artifact before updating it.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The artifact id." },
      },
      required: ["id"],
    },
  },
  {
    name: "list_artifacts",
    description: "List all existing artifacts (metadata only, not file contents).",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "open_artifact",
    description: "Navigate the user's window to an artifact so they can see it.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The artifact id." },
      },
      required: ["id"],
    },
  },
]

/**
 * Get all runtime tool names (for disabling by default)
 */
export function getRuntimeToolNames(): string[] {
  return runtimeToolDefinitions.map((tool) => tool.name)
}
