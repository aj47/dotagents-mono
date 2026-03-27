import type { AgentProfile } from "@shared/types"
import type { AgentsLayerPaths } from "./agents-files/modular-config"
import { loadAgentProfilesLayer, writeAgentsProfileFiles } from "./agents-files/agent-profiles"

export type McpServerReferenceCleanupSummary = {
  updatedProfileIds: string[]
  removedReferenceCount: number
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

function cleanupInvalidMcpServerReferencesInProfiles(
  profiles: AgentProfile[],
  validServerNames: Iterable<string>,
  now: number = Date.now(),
): { profiles: AgentProfile[] } & McpServerReferenceCleanupSummary {
  const validServerNameSet = new Set(Array.from(validServerNames))
  const updatedProfileIds: string[] = []
  let removedReferenceCount = 0

  const nextProfiles = profiles.map((profile) => {
    const currentServerNames = profile.toolConfig?.enabledServers ?? []
    if (currentServerNames.length === 0) return profile

    const nextServerNames = currentServerNames.filter((serverName) => validServerNameSet.has(serverName))
    if (nextServerNames.length === currentServerNames.length) return profile

    removedReferenceCount += currentServerNames.length - nextServerNames.length
    updatedProfileIds.push(profile.id)

    return {
      ...profile,
      updatedAt: now,
      toolConfig: {
        ...profile.toolConfig,
        enabledServers: nextServerNames,
      },
    }
  })

  return {
    profiles: nextProfiles,
    updatedProfileIds: uniqueSorted(updatedProfileIds),
    removedReferenceCount,
  }
}

export function cleanupInvalidMcpServerReferencesInLayers(
  layers: AgentsLayerPaths[],
  validServerNames: Iterable<string>,
  now: number = Date.now(),
): McpServerReferenceCleanupSummary {
  const combinedUpdatedProfileIds: string[] = []
  let removedReferenceCount = 0

  for (const layer of layers) {
    const loaded = loadAgentProfilesLayer(layer)
    const result = cleanupInvalidMcpServerReferencesInProfiles(loaded.profiles, validServerNames, now)

    if (result.updatedProfileIds.length === 0) continue

    const updatedProfilesById = new Map(result.profiles.map((profile) => [profile.id, profile]))
    for (const profileId of result.updatedProfileIds) {
      const profile = updatedProfilesById.get(profileId)
      if (!profile) continue
      writeAgentsProfileFiles(layer, profile, { maxBackups: 10 })
    }

    combinedUpdatedProfileIds.push(...result.updatedProfileIds)
    removedReferenceCount += result.removedReferenceCount
  }

  return {
    updatedProfileIds: uniqueSorted(combinedUpdatedProfileIds),
    removedReferenceCount,
  }
}
