import type { ACPAgentConfig, AgentProfile } from "@shared/types"

export type MainAcpAgentOption = {
  name: string
  displayName: string
}

export function getSelectableMainAcpAgents(
  profileAgents: AgentProfile[] = [],
  legacyAgents: ACPAgentConfig[] = []
): MainAcpAgentOption[] {
  const options: MainAcpAgentOption[] = []
  const seen = new Set<string>()

  const addOption = (name: string | undefined, displayName: string | undefined) => {
    const normalizedName = name?.trim()
    if (!normalizedName) return

    const dedupeKey = normalizedName.toLowerCase()
    if (seen.has(dedupeKey)) return
    seen.add(dedupeKey)

    options.push({
      name: normalizedName,
      displayName: displayName?.trim() || normalizedName,
    })
  }

  for (const agent of profileAgents) {
    if (agent.enabled === false) continue
    if (agent.connection.type !== 'acpx' && agent.connection.type !== 'acp' && agent.connection.type !== 'stdio') continue
    addOption(agent.name, agent.displayName)
  }

  for (const agent of legacyAgents) {
    if (agent.enabled === false) continue
    if (agent.connection.type !== 'stdio' && agent.connection.type !== 'acp') continue
    addOption(agent.name, agent.displayName)
  }

  return options
}