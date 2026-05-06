import { toast } from "sonner"
import {
  resolveAgentProfileIdForNextSession,
} from "@dotagents/shared/agent-selector-options"

import type { AgentProfile } from "@shared/types"

import { tipcClient } from "./tipc-client"

interface ApplySelectedAgentToNextSessionOptions {
  selectedAgentId: string | null
  setSelectedAgentId: (id: string | null) => void
  agentProfiles?: AgentProfile[]
  silent?: boolean
  onError?: (error: unknown) => void
}

export async function applySelectedAgentToNextSession({
  selectedAgentId,
  setSelectedAgentId,
  agentProfiles,
  silent = false,
  onError,
}: ApplySelectedAgentToNextSessionOptions): Promise<boolean> {
  try {
    const agents = agentProfiles && agentProfiles.length > 0
      ? agentProfiles
      : ((await tipcClient.getAgentProfiles()) as AgentProfile[])
    const selection = resolveAgentProfileIdForNextSession(
      agents,
      selectedAgentId,
    )

    if (selection.status === "stale-selection") {
      setSelectedAgentId(null)
      if (!silent) {
        toast.error("Selected agent is no longer available")
      }
      return false
    }

    if (selection.status === "no-agent") return true

    const result = await tipcClient.setCurrentAgentProfile({ id: selection.agentId })
    if (!result?.success) {
      throw new Error("setCurrentAgentProfile returned success=false")
    }

    return true
  } catch (error) {
    onError?.(error)
    if (!silent) {
      toast.error("Failed to apply selected agent")
    }
    return false
  }
}
