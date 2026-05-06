/**
 * Runtime Tool Definitions - Dependency-Free Module
 *
 * Desktop composes shared DotAgents runtime tool schemas with ACP router tool
 * schemas. Execution handlers stay in runtime-tools.ts, which can safely import
 * services that might also need access to these dependency-light definitions.
 */

import {
  dotagentsRuntimeToolDefinitions,
  getRuntimeToolNames as getSharedRuntimeToolNames,
  type RuntimeToolDefinition,
} from '@dotagents/shared/runtime-tool-utils'
import { RUNTIME_TOOLS_SERVER_NAME } from '@dotagents/shared/mcp-api'

export { RUNTIME_TOOLS_SERVER_NAME }
export type { RuntimeToolDefinition }

// Desktop exposes the shared DotAgents runtime tool list, including ACP router
// schemas. Runtime tools use plain names (no server prefix) for execution.
export const runtimeToolDefinitions: RuntimeToolDefinition[] = dotagentsRuntimeToolDefinitions

/**
 * Get all runtime tool names (for disabling by default).
 */
export function getRuntimeToolNames(): string[] {
  return getSharedRuntimeToolNames(runtimeToolDefinitions)
}
