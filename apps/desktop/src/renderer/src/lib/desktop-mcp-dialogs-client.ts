import type { ElicitationResult } from "@dotagents/shared/mcp-api"
import { tipcClient } from "@renderer/lib/tipc-client"

export const desktopMcpDialogsClient = {
  resolveSampling(requestId: string, approved: boolean): Promise<void> {
    return tipcClient.resolveSampling({ requestId, approved }) as Promise<void>
  },

  resolveElicitation(
    requestId: string,
    result: ElicitationResult,
  ): Promise<void> {
    return tipcClient.resolveElicitation({
      requestId,
      action: result.action,
      content: result.content,
    }) as Promise<void>
  },
}
