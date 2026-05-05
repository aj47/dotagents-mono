/**
 * Runtime Tool Definitions - Dependency-Free Module
 *
 * Desktop composes shared DotAgents runtime tool schemas with ACP router tool
 * schemas. Execution handlers stay in runtime-tools.ts, which can safely import
 * services that might also need access to these dependency-light definitions.
 */

import {
  buildRuntimeToolDefinitions,
  getRuntimeToolNames as getSharedRuntimeToolNames,
  type RuntimeToolDefinition,
} from '@dotagents/shared/runtime-tool-utils'
import { RUNTIME_TOOLS_SERVER_NAME } from '@dotagents/shared/mcp-api'
import { acpRouterToolDefinitions } from './acp/acp-router-tool-definitions'

export { RUNTIME_TOOLS_SERVER_NAME }
export type { RuntimeToolDefinition }

// Runtime tools use plain names (no server prefix). ACP router tools are
// exposed alongside core DotAgents runtime tools for execution purposes.
export const runtimeToolDefinitions: RuntimeToolDefinition[] = buildRuntimeToolDefinitions(acpRouterToolDefinitions)

/**
 * Get all runtime tool names (for disabling by default).
 */
export function getRuntimeToolNames(): string[] {
  return getSharedRuntimeToolNames(runtimeToolDefinitions)
}
