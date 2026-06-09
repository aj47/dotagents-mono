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

import { DEFAULT_AGENT_RUNTIME_TOOL_NAMES, RUNTIME_TOOLS_SERVER_NAME } from '../shared/runtime-tool-names'
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

export { DEFAULT_AGENT_RUNTIME_TOOL_NAMES }

// Tool definitions — runtime tools use plain names (no server prefix)
export const runtimeToolDefinitions: RuntimeToolDefinition[] = [
  // ACP router tools for agent delegation
  // These tools are logically distinct from settings management but are all treated as
  // runtime tools for execution purposes (see isRuntimeTool in runtime-tools.ts).
  ...acpRouterToolDefinitions,
  {
    name: "respond_to_user",
    description:
      "Send a response through DotAgents' explicit delivery channel. Normal assistant text is valid for ordinary chat and simple final answers; use this tool when you specifically need voice/TTS or messaging-channel delivery semantics, or when sending images/videos. Provide at least one of: non-empty text, one/more images, or one/more videos.",
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
        videos: {
          type: "array",
          description:
            "Optional videos to include in the message. Each video can be provided as an HTTP(S) URL or as a local file path that will be stored as a conversation asset and streamed lazily by desktop/mobile.",
          items: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "HTTP(S) URL for the video.",
              },
              path: {
                type: "string",
                description: "Local video file path (absolute, or relative to the current working directory). Supported extensions: mp4, m4v, webm, mov, ogv.",
              },
              label: {
                type: "string",
                description: "Optional label shown on the video card.",
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
      "Set or update the current session title. Use this once the task is clear, early enough to make the UI useful, or later if the conversation topic shifts. Keep the title short, specific, and ideally under 10 words.",
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
    name: "log_always_on_attempt",
    description:
      "Append an entry to the current always-on session's durable attempt log. Use only inside an always-on session. Call this before every concrete attempt, for blockers, and when recording outcomes.",
    inputSchema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["attempt", "evidence", "blocker", "branch", "error"],
          description: "Type of entry to append. Queue user questions with ask_always_on_question instead of manually logging question/answer entries.",
        },
        title: {
          type: "string",
          description: "Short title for what is being tried or recorded.",
        },
        details: {
          type: "string",
          description: "Optional details, evidence, command, hypothesis, or blocker context.",
        },
        outcome: {
          type: "string",
          description: "Optional result or outcome after the attempt.",
        },
      },
      required: ["kind", "title"],
    },
  },
  {
    name: "ask_always_on_question",
    description:
      "Queue a multiple-choice question for the user from an always-on session without stopping the worker. Provide 2-3 choices; the UI also allows a custom answer when allowCustom is true. After calling this, continue other useful work instead of waiting.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Question to show to the user.",
        },
        choices: {
          type: "array",
          minItems: 2,
          maxItems: 3,
          description: "Two or three mutually exclusive choices.",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Stable short choice id.",
              },
              label: {
                type: "string",
                description: "Short user-facing choice label.",
              },
              description: {
                type: "string",
                description: "Optional one-sentence tradeoff or impact.",
              },
            },
            required: ["label"],
          },
        },
        allowCustom: {
          type: "boolean",
          description: "Whether the user can provide a custom answer. Defaults to true.",
        },
        reason: {
          type: "string",
          enum: ["question", "blocker"],
          description: "Use blocker when the question records a blocked path.",
        },
      },
      required: ["prompt", "choices"],
    },
  },
  {
    name: "execute_command",
    description: "Execute any shell command. This is the primary tool for filesystem operations, running scripts, and automation. Use for: searching files (rg/find), reading files in targeted ranges (wc/sed/head/tail/cat), editing files, listing directories (ls), creating directories (mkdir -p), git operations, package-manager/python/node commands, and any shell command. Respect the repo's lockfile/package-manager conventions: pnpm-lock.yaml => pnpm, package-lock.json => npm, yarn.lock => yarn, bun.lock/bun.lockb => bun. Prefer read-only inspection commands first for planning/context tasks. Only run package-manager install/test/build/lint/typecheck commands when the user explicitly asks for verification/package work, or when validating code changes you already made.",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The shell command to execute. Examples: 'wc -l file.txt' (size), 'sed -n \\'1,120p\\' file.txt' (targeted read), 'rg TODO apps/desktop/src' (search), 'ls -la' (list), 'mkdir -p dir' (create dir), 'git status', 'python script.py'. Prefer read-only inspection commands unless the user asked you to run verification/package-manager work.",
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
    name: "read_more_context",
    description: "Read a specific slice of earlier compacted context using a Context ref shown in truncated or summarized messages. Acts as a scoped document navigator over the full underlying payload (not just the inline excerpt). Start with mode='overview' to see what the ref covers and get suggested next calls. Use mode='search' for case-, punctuation-, and underscore-insensitive lookup; each match is labeled with matchType and includes an expandCall for fetching surrounding text. head/tail/window results include nextWindow/previousWindow hints so you can keep paging without guessing offsets.",
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
]

/**
 * Get all runtime tool names (for disabling by default)
 */
export function getRuntimeToolNames(): string[] {
  return runtimeToolDefinitions.map((tool) => tool.name)
}
