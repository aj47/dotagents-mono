import { loadAgentProfilesLayer, writeAgentsProfileFiles, type AgentProfile } from "@dotagents/core"
import type { AgentsLayerPaths } from "@dotagents/core"
import {
  cleanupInvalidMcpServerReferencesInProfiles as cleanupSharedInvalidMcpServerReferencesInProfiles,
  type AgentProfileMcpReferenceCleanupSummary,
} from "@dotagents/shared/agent-profile-reference-cleanup"

export {
  cleanupInvalidMcpServerReferencesInProfiles,
  type AgentProfileMcpReferenceCleanupSummary as McpServerReferenceCleanupSummary,
} from "@dotagents/shared/agent-profile-reference-cleanup"

export function cleanupInvalidMcpServerReferencesInLayers(
  layers: AgentsLayerPaths[],
  validServerNames: Iterable<string>,
  now: number = Date.now(),
): AgentProfileMcpReferenceCleanupSummary {
  const combinedUpdatedProfileIds: string[] = []
  let removedReferenceCount = 0

  for (const layer of layers) {
    const loaded = loadAgentProfilesLayer(layer)
    const result = cleanupSharedInvalidMcpServerReferencesInProfiles<AgentProfile>(loaded.profiles, validServerNames, now)

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
    updatedProfileIds: Array.from(new Set(combinedUpdatedProfileIds)).sort((a, b) => a.localeCompare(b)),
    removedReferenceCount,
  }
}
