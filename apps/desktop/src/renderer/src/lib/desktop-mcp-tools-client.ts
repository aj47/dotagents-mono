import type { DetailedToolInfo } from "@dotagents/shared/mcp-utils"
import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopMcpToolEnabledResult {
  success: boolean
}

export const desktopMcpToolsClient = {
  getDetailedToolList(): Promise<DetailedToolInfo[]> {
    return tipcClient.getMcpDetailedToolList({}) as Promise<DetailedToolInfo[]>
  },

  setToolEnabled(
    toolName: string,
    enabled: boolean,
  ): Promise<DesktopMcpToolEnabledResult> {
    return tipcClient.setMcpToolEnabled({
      toolName,
      enabled,
    }) as Promise<DesktopMcpToolEnabledResult>
  },
}
