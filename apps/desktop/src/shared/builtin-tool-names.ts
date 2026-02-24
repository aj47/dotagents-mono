// Dependency-free constants for built-in tool names that may be referenced by both
// main and renderer code.

// The virtual server name for built-in tools (single source of truth; imported by main + renderer)
// Built-in tools no longer use a prefix — they are registered as plain tool names.
// This constant is kept for backward compatibility (e.g., UI grouping, reserved name checks).
export const BUILTIN_SERVER_NAME = "dotagents-internal"

export const RESPOND_TO_USER_TOOL = "respond_to_user"
export const MARK_WORK_COMPLETE_TOOL = "mark_work_complete"

// Internal completion nudge message: include in the LLM context, but hide from the progress UI.
// Keep this as a single canonical string so we can filter it via exact match (no false positives).
export const INTERNAL_COMPLETION_NUDGE_TEXT =
  `If all requested work is complete, use ${RESPOND_TO_USER_TOOL} to tell the user the result, then call ${MARK_WORK_COMPLETE_TOOL} with a concise summary. Otherwise continue working and call more tools.`
