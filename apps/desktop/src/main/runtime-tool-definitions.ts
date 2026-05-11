import {
  DEFAULT_AGENT_RUNTIME_TOOL_NAMES,
  dotagentsRuntimeToolDefinitions,
  getRuntimeToolNames as getSharedRuntimeToolNames,
  type RuntimeToolDefinition,
} from "@dotagents/shared/runtime-tool-utils"
import { RUNTIME_TOOLS_SERVER_NAME } from "@dotagents/shared/mcp-api"

export {
  DEFAULT_AGENT_RUNTIME_TOOL_NAMES,
  RUNTIME_TOOLS_SERVER_NAME,
}
export type { RuntimeToolDefinition }

export const runtimeToolDefinitions: RuntimeToolDefinition[] = dotagentsRuntimeToolDefinitions

export function getRuntimeToolNames(): string[] {
  return getSharedRuntimeToolNames(runtimeToolDefinitions)
}
