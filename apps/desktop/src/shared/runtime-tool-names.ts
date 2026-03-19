// Constants for runtime tool names that may be referenced by both main and renderer code.

import { RESPOND_TO_USER_TOOL } from "@dotagents/shared"

// Re-export RESPOND_TO_USER_TOOL from shared — single source of truth
export { RESPOND_TO_USER_TOOL } from "@dotagents/shared"

// Name advertised to ACP agents when DotAgents runtime tools are injected over MCP.
export const RUNTIME_TOOLS_SERVER_NAME = "dotagents-runtime-tools"

// Reserved internal server names that should not be user-configurable as normal MCP servers.
export const RESERVED_RUNTIME_TOOL_SERVER_NAMES = [RUNTIME_TOOLS_SERVER_NAME] as const

// Internal MCP server identifier used by the embedded injected transport implementation.
export const INJECTED_RUNTIME_TOOL_TRANSPORT_NAME = "dotagents-injected-runtime-tools"

export const MARK_WORK_COMPLETE_TOOL = "mark_work_complete"
export const READ_MORE_CONTEXT_TOOL = "read_more_context"

// Internal completion nudge message: include in the LLM context, but hide from the progress UI.
// Keep this as a single canonical string so we can filter it via exact match (no false positives).
export const INTERNAL_COMPLETION_NUDGE_TEXT =
  `If all requested work is complete, use ${RESPOND_TO_USER_TOOL} to tell the user the result, then call ${MARK_WORK_COMPLETE_TOOL} with a concise summary. Otherwise continue working and call more tools.`
