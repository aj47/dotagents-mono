// Compatibility re-exports for desktop code that still imports runtime-tool
// constants from @shared/runtime-tool-names.
export {
  MARK_WORK_COMPLETE_TOOL,
  RESPOND_TO_USER_TOOL,
} from "@dotagents/shared/chat-utils"
export {
  INTERNAL_COMPLETION_NUDGE_TEXT,
  INJECTED_RUNTIME_TOOL_TRANSPORT_NAME,
  RESERVED_RUNTIME_TOOL_SERVER_NAMES,
  RUNTIME_TOOLS_SERVER_NAME,
} from "@dotagents/shared/mcp-api"
export {
  DEFAULT_AGENT_RUNTIME_TOOL_NAMES,
  EXECUTE_COMMAND_TOOL,
  READ_MORE_CONTEXT_TOOL,
  SET_SESSION_TITLE_TOOL,
} from "@dotagents/shared/runtime-tool-utils"
