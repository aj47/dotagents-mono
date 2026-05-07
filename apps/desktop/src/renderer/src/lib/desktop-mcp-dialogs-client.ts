import type {
  ElicitationRequest,
  ElicitationResult,
  SamplingRequest,
} from "@dotagents/shared/mcp-api"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"

export const desktopMcpDialogsClient = {
  onSamplingRequest(listener: (request: SamplingRequest) => void): () => void {
    return rendererHandlers["mcp:sampling-request"].listen(listener)
  },

  onElicitationRequest(listener: (request: ElicitationRequest) => void): () => void {
    return rendererHandlers["mcp:elicitation-request"].listen(listener)
  },

  onElicitationComplete(
    listener: (data: { elicitationId: string; requestId: string }) => void,
  ): () => void {
    return rendererHandlers["mcp:elicitation-complete"].listen(listener)
  },

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
