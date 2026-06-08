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

import {
  ANSWER_DECISION_TOOL,
  CREATE_REPEAT_TASK_TOOL,
  CREATE_DECISION_TOOL,
  CREATE_GOAL_TOOL,
  CREATE_WORK_ITEM_TOOL,
  DEFAULT_AGENT_RUNTIME_TOOL_NAMES,
  DISMISS_DECISION_TOOL,
  GET_REPEAT_TASKS_TOOL,
  GET_GOAL_ORCHESTRATOR_SNAPSHOT_TOOL,
  RUN_GOAL_ORCHESTRATOR_TOOL,
  RUN_REPEAT_TASK_TOOL,
  RUNTIME_TOOLS_SERVER_NAME,
  START_GOAL_WORK_ITEM_TOOL,
  UPDATE_REPEAT_TASK_TOOL,
  UPDATE_GOAL_TOOL,
  UPDATE_WORK_ITEM_TOOL,
} from '../shared/runtime-tool-names'
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
  {
    name: GET_GOAL_ORCHESTRATOR_SNAPSHOT_TOOL,
    description:
      "Read the current Goal Orchestrator state: goals, work items, pending decisions, running sessions, recent runs, activity, and limits. Use before creating or updating items when the user refers to an existing goal/work item by title.",
    inputSchema: {
      type: "object",
      properties: {
        includeHistory: {
          type: "boolean",
          description: "When true, include recent done/discarded work and completed agent runs. Defaults to false for a compact snapshot.",
        },
      },
      required: [],
    },
  },
  {
    name: CREATE_GOAL_TOOL,
    description:
      "Create a durable Goal Orchestrator goal from the user's spoken or typed request. Goals are persistent outcomes, not one-off tasks.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Goal title." },
        notes: { type: "string", description: "Optional durable context for the goal." },
        status: {
          type: "string",
          enum: ["active", "inactive", "done"],
          description: "Goal status. Defaults to active.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: UPDATE_GOAL_TOOL,
    description:
      "Update an existing Goal Orchestrator goal. Use goalId when available; otherwise use an exact goalTitle from the current snapshot.",
    inputSchema: {
      type: "object",
      properties: {
        goalId: { type: "string", description: "Existing goal id." },
        goalTitle: { type: "string", description: "Existing goal title to resolve when goalId is unknown." },
        title: { type: "string", description: "New title." },
        notes: { type: "string", description: "New notes. Replaces existing notes." },
        status: {
          type: "string",
          enum: ["active", "inactive", "done"],
          description: "New goal status.",
        },
      },
      required: [],
    },
  },
  {
    name: CREATE_WORK_ITEM_TOOL,
    description:
      "Create a concrete work item under a Goal Orchestrator goal. Use this when the user says to add a task/work item/action item to a goal.",
    inputSchema: {
      type: "object",
      properties: {
        goalId: { type: "string", description: "Existing goal id." },
        goalTitle: { type: "string", description: "Existing goal title to resolve when goalId is unknown." },
        title: { type: "string", description: "Work item title." },
        notes: { type: "string", description: "Optional work-item notes." },
        status: {
          type: "string",
          enum: ["ready", "running", "waiting", "done", "discarded"],
          description: "Initial work item status. Defaults to ready.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: UPDATE_WORK_ITEM_TOOL,
    description:
      "Update an existing Goal Orchestrator work item. Use workItemId when available; otherwise resolve by workItemTitle plus goalId or goalTitle.",
    inputSchema: {
      type: "object",
      properties: {
        workItemId: { type: "string", description: "Existing work item id." },
        workItemTitle: { type: "string", description: "Existing work item title to resolve when workItemId is unknown." },
        goalId: { type: "string", description: "Goal id to disambiguate workItemTitle." },
        goalTitle: { type: "string", description: "Goal title to disambiguate workItemTitle." },
        title: { type: "string", description: "New work item title." },
        notes: { type: "string", description: "New notes. Replaces existing notes." },
        status: {
          type: "string",
          enum: ["ready", "running", "waiting", "done", "discarded"],
          description: "New work-item status.",
        },
      },
      required: [],
    },
  },
  {
    name: CREATE_DECISION_TOOL,
    description:
      "Create a pending user decision for a goal or work item when progress needs clarification.",
    inputSchema: {
      type: "object",
      properties: {
        goalId: { type: "string", description: "Optional linked goal id." },
        goalTitle: { type: "string", description: "Optional linked goal title." },
        workItemId: { type: "string", description: "Optional linked work item id." },
        workItemTitle: { type: "string", description: "Optional linked work item title. Use with goalId or goalTitle when possible." },
        question: { type: "string", description: "The decision question for the user." },
      },
      required: ["question"],
    },
  },
  {
    name: ANSWER_DECISION_TOOL,
    description:
      "Record the user's answer to a pending Goal Orchestrator decision. Answering a linked waiting work item makes it ready again.",
    inputSchema: {
      type: "object",
      properties: {
        decisionId: { type: "string", description: "Existing decision id." },
        question: { type: "string", description: "Existing decision question to resolve when decisionId is unknown." },
        answer: { type: "string", description: "User's answer." },
      },
      required: ["answer"],
    },
  },
  {
    name: DISMISS_DECISION_TOOL,
    description: "Dismiss a pending Goal Orchestrator decision by id or exact question text.",
    inputSchema: {
      type: "object",
      properties: {
        decisionId: { type: "string", description: "Existing decision id." },
        question: { type: "string", description: "Existing decision question to resolve when decisionId is unknown." },
      },
      required: [],
    },
  },
  {
    name: RUN_GOAL_ORCHESTRATOR_TOOL,
    description:
      "Wake the Goal Orchestrator immediately. It selects ready work from active goals and starts agent sessions within configured limits.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: START_GOAL_WORK_ITEM_TOOL,
    description:
      "Start an agent session for a specific Goal Orchestrator work item. Use workItemId when available; otherwise resolve by workItemTitle plus goalId or goalTitle.",
    inputSchema: {
      type: "object",
      properties: {
        workItemId: { type: "string", description: "Existing work item id." },
        workItemTitle: { type: "string", description: "Existing work item title to resolve when workItemId is unknown." },
        goalId: { type: "string", description: "Goal id to disambiguate workItemTitle." },
        goalTitle: { type: "string", description: "Goal title to disambiguate workItemTitle." },
      },
      required: [],
    },
  },
  {
    name: GET_REPEAT_TASKS_TOOL,
    description:
      "List configured DotAgents repeat tasks. Use before creating or updating scheduled automation when the user may already have a matching task.",
    inputSchema: {
      type: "object",
      properties: {
        includeDisabled: {
          type: "boolean",
          description: "When true, include disabled repeat tasks. Defaults to true.",
        },
        includePrompt: {
          type: "boolean",
          description: "When true, include the full task prompt. Defaults to false for compact output.",
        },
      },
      required: [],
    },
  },
  {
    name: CREATE_REPEAT_TASK_TOOL,
    description:
      "Create a durable scheduled repeat task. Use this for spoken requests like scheduling a weekly orchestrator wake-up, recurring content planning, or running a task on a fixed cadence. For Goal Orchestrator scheduling, set goalOrchestrator=true; repeat tasks are the scheduler that wakes orchestration.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Display name for the repeat task." },
        prompt: {
          type: "string",
          description: "Prompt to run for normal repeat tasks. Optional when goalOrchestrator=true; then it defaults to 'Run goal orchestrator'.",
        },
        intervalMinutes: {
          type: "number",
          description: "Fallback interval in minutes when no wall-clock schedule is set. Defaults to 60 and must be >= 1.",
        },
        enabled: { type: "boolean", description: "Whether the repeat task is active. Defaults to true." },
        profileId: { type: "string", description: "Optional agent profile id to run the task as." },
        runOnStartup: { type: "boolean", description: "Run immediately when the app starts." },
        speakOnTrigger: { type: "boolean", description: "Speak/show the result when the task completes." },
        continueInSession: { type: "boolean", description: "Reuse the previous task session for stateful recurring work." },
        runContinuously: {
          type: "boolean",
          description: "Run back-to-back after completion. Do not combine with schedule.",
        },
        goalOrchestrator: {
          type: "boolean",
          description: "When true, this repeat task wakes the Goal Orchestrator instead of sending a prompt to a normal agent session.",
        },
        maxIterations: {
          type: "number",
          description: "Optional max agent-loop iterations for this task or orchestrator wake. Must be an integer >= 1.",
        },
        schedule: {
          type: "object",
          description: "Optional wall-clock schedule. Daily uses times. Weekly uses times plus daysOfWeek where 0=Sunday and 6=Saturday.",
          properties: {
            type: { type: "string", enum: ["daily", "weekly"] },
            times: { type: "array", items: { type: "string" }, description: "HH:MM 24-hour local times." },
            daysOfWeek: { type: "array", items: { type: "number" }, description: "Weekly days, 0=Sunday through 6=Saturday." },
          },
          required: ["type", "times"],
        },
        runNow: {
          type: "boolean",
          description: "When true, trigger the task immediately after creating it if it is enabled.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: UPDATE_REPEAT_TASK_TOOL,
    description:
      "Update an existing DotAgents repeat task. Use repeatTaskId when available; otherwise resolve by exact repeatTaskName from get_repeat_tasks.",
    inputSchema: {
      type: "object",
      properties: {
        repeatTaskId: { type: "string", description: "Existing repeat task id." },
        repeatTaskName: { type: "string", description: "Existing repeat task name to resolve when id is unknown." },
        name: { type: "string", description: "New display name." },
        prompt: { type: "string", description: "New prompt. Replaces existing prompt." },
        intervalMinutes: { type: "number", description: "New fallback interval in minutes. Must be >= 1." },
        enabled: { type: "boolean", description: "Enable or disable the task." },
        profileId: { type: "string", description: "Set or change the agent profile id. Empty string clears it." },
        runOnStartup: { type: "boolean", description: "Set run-on-startup behavior." },
        speakOnTrigger: { type: "boolean", description: "Set speak/show-on-completion behavior." },
        continueInSession: { type: "boolean", description: "Set same-session continuation behavior." },
        runContinuously: { type: "boolean", description: "Set back-to-back continuous execution. Clears schedule when true." },
        goalOrchestrator: { type: "boolean", description: "Set whether this task wakes the Goal Orchestrator." },
        maxIterations: { type: "number", description: "Set max iterations, or pass null to clear." },
        schedule: {
          type: "object",
          description: "Set wall-clock schedule, or pass null to clear. Weekly uses daysOfWeek where 0=Sunday and 6=Saturday.",
          properties: {
            type: { type: "string", enum: ["daily", "weekly"] },
            times: { type: "array", items: { type: "string" } },
            daysOfWeek: { type: "array", items: { type: "number" } },
          },
          required: ["type", "times"],
        },
      },
      required: [],
    },
  },
  {
    name: RUN_REPEAT_TASK_TOOL,
    description:
      "Trigger an existing repeat task immediately. Use repeatTaskId when available; otherwise resolve by exact repeatTaskName.",
    inputSchema: {
      type: "object",
      properties: {
        repeatTaskId: { type: "string", description: "Existing repeat task id." },
        repeatTaskName: { type: "string", description: "Existing repeat task name to resolve when id is unknown." },
      },
      required: [],
    },
  },
]

/**
 * Get all runtime tool names (for disabling by default)
 */
export function getRuntimeToolNames(): string[] {
  return runtimeToolDefinitions.map((tool) => tool.name)
}
