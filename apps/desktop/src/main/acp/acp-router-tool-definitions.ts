/**
 * ACP Router Tool Definitions - Dependency-Free Module
 *
 * Desktop keeps this module as a stable local import path, while the static
 * schemas and alias helpers live in @dotagents/shared for server/mobile reuse.
 */

import {
  acpRouterToolDefinitions,
  acpRouterToolNameAliases,
  isAcpRouterTool,
  resolveAcpRouterToolName,
} from '@dotagents/shared/runtime-tool-utils'

export { acpRouterToolDefinitions }

/**
 * Mapping from alias tool names to their canonical equivalents.
 * Used for backward compatibility in the execution handler.
 */
export const toolNameAliases: Record<string, string> = acpRouterToolNameAliases

/**
 * Resolve a tool name to its canonical handler name.
 * This allows alias tool names to map to existing handlers.
 */
export const resolveToolName = resolveAcpRouterToolName

/**
 * Check if a tool name is a router tool (including aliases).
 */
export const isRouterTool = isAcpRouterTool
