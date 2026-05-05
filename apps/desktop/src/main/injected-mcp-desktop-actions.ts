import type { InjectedMcpRouteActions } from "./injected-mcp-routes"
import {
  callInjectedMcpTool,
  handleInjectedMcpProtocolRequest,
  listInjectedMcpTools,
} from "./injected-mcp-actions"

export const injectedMcpDesktopActions: InjectedMcpRouteActions = {
  callInjectedMcpTool,
  handleInjectedMcpProtocolRequest,
  listInjectedMcpTools,
}
