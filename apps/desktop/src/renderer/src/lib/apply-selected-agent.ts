import { toast } from "sonner"
import { getDefaultAgentProfile, getEnabledAgentProfiles } from "@dotagents/shared"

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
    const enabledAgents = getEnabledAgentProfiles(agents)

    let agentIdToApply: string | null
    if (selectedAgentId) {
      const selectedAgent = enabledAgents.find((agent) => agent.id === selectedAgentId)
      if (!selectedAgent) {
        setSelectedAgentId(null)
        if (!silent) {
          toast.error("Selected agent is no longer available")
        }
        return false
      }
      agentIdToApply = selectedAgent.id
    } else {
      const defaultAgent = getDefaultAgentProfile(enabledAgents)
      agentIdToApply = defaultAgent?.id ?? null
    }

    if (!agentIdToApply) return true

    const result = await tipcClient.setCurrentAgentProfile({ id: agentIdToApply })
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
