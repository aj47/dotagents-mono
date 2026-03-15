// Re-export from @dotagents/core — single source of truth
export {
  MCPService,
  mcpService,
  WHATSAPP_SERVER_NAME,
  WHATSAPP_DEFAULT_ENABLED_TOOLS,
  getInternalWhatsAppServerPaths,
  getInternalWhatsAppServerPath,
  isInternalServer,
  handleWhatsAppToggle,
  setMCPServicePathResolver,
  setMCPServiceUserInteraction,
  setMCPServiceOAuthFactory,
  setMCPServiceOAuthStorage,
} from "@dotagents/core"
export type {
  MCPOAuthClient,
  MCPOAuthStorage,
} from "@dotagents/core"

// Re-export types used by tipc.ts callers
export type {
  MCPTool,
  MCPToolResult,
} from "@dotagents/core"
