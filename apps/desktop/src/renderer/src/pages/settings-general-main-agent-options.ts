import { getSelectableMainAcpAgents as getSharedSelectableMainAcpAgents } from "@dotagents/shared"
import type { ACPAgentConfig, AgentProfile } from "@shared/types"

export type MainAcpAgentOption = {
  name: string
  displayName: string
}

export function getSelectableMainAcpAgents(
  profileAgents: AgentProfile[] = [],
  legacyAgents: ACPAgentConfig[] = [],
): MainAcpAgentOption[] {
  return getSharedSelectableMainAcpAgents(profileAgents, legacyAgents).map(
    ({ name, displayName }) => ({
      name,
      displayName,
    }),
  )
}
