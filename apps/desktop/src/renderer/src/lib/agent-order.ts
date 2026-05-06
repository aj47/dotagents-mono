import type { AgentProfile } from "@shared/types"
import { sortAgentProfilesWithDefaultFirst } from "@dotagents/shared/agent-selector-options"

export function sortAgentsWithDefaultFirst(agents: AgentProfile[]): AgentProfile[] {
  return sortAgentProfilesWithDefaultFirst(agents)
}
