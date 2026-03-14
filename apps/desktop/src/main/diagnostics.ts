/**
 * Desktop diagnostics — thin wrapper around @dotagents/core.
 * Wires in the desktop-specific MCP service as the MCP provider.
 */
import { DiagnosticsService } from "@dotagents/core"
import { mcpService } from "./mcp-service"

// Re-export types for existing desktop consumers
export type { DiagnosticInfo, DiagnosticsMcpProvider } from "@dotagents/core"

// Create the singleton instance with MCP service wired in
const service = new DiagnosticsService()
service.setMcpProvider(mcpService)

export { DiagnosticsService }
export const diagnosticsService = service
