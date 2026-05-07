import type {
  AgentSessionCandidatesResponse,
  LoopRuntimeStatus,
} from "@dotagents/shared/api-types"
import type { LoopConfig } from "@dotagents/shared/types"
import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopLoopActionResult {
  success: boolean
  error?: string
  path?: string
}

export const desktopLoopsClient = {
  getLoops(): Promise<LoopConfig[]> {
    return tipcClient.getLoops() as Promise<LoopConfig[]>
  },

  getLoopStatuses(): Promise<LoopRuntimeStatus[]> {
    return tipcClient.getLoopStatuses() as Promise<LoopRuntimeStatus[]>
  },

  listAgentSessionCandidates(limit: number): Promise<AgentSessionCandidatesResponse> {
    return tipcClient.listAgentSessionCandidates({ limit }) as Promise<AgentSessionCandidatesResponse>
  },

  saveLoop(loop: LoopConfig): Promise<DesktopLoopActionResult> {
    return tipcClient.saveLoop({ loop }) as Promise<DesktopLoopActionResult>
  },

  deleteLoop(loopId: string): Promise<DesktopLoopActionResult> {
    return tipcClient.deleteLoop({ loopId }) as Promise<DesktopLoopActionResult>
  },

  startLoop(loopId: string): Promise<DesktopLoopActionResult | undefined> {
    return tipcClient.startLoop?.({ loopId }) as Promise<DesktopLoopActionResult | undefined>
  },

  stopLoop(loopId: string): Promise<DesktopLoopActionResult | undefined> {
    return tipcClient.stopLoop?.({ loopId }) as Promise<DesktopLoopActionResult | undefined>
  },

  runLoop(loopId: string): Promise<DesktopLoopActionResult | undefined> {
    return tipcClient.triggerLoop?.({ loopId }) as Promise<DesktopLoopActionResult | undefined>
  },

  openLoopTaskFile(loopId: string): Promise<DesktopLoopActionResult> {
    return tipcClient.openLoopTaskFile({ loopId }) as Promise<DesktopLoopActionResult>
  },
}
