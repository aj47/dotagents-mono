import { getSelectableMainAcpAgents } from "@dotagents/shared"
import type { AgentProfile, Profile, Settings } from "./settingsApi"

export interface MainAgentOption {
  name: string
  displayName: string
}

export function getAcpMainAgentOptions(
  settings?: Settings | null,
  agentProfiles: AgentProfile[] = [],
): MainAgentOption[] {
  return getSelectableMainAcpAgents(
    agentProfiles,
    settings?.acpAgents || [],
  ).map(({ name, displayName }) => ({
    name,
    displayName,
  }))
}

export function toMainAgentProfile(option: MainAgentOption): Profile {
  return {
    id: `main-agent:${option.name}`,
    name: option.displayName,
    guidelines: "ACP main agent",
  }
}
