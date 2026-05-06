import { loadAgentProfilesLayer, writeAgentsProfileFiles, type AgentProfile } from "@dotagents/core"
import type { AgentsLayerPaths } from "./agents-files/modular-config"
import {
  cleanupInvalidSkillReferencesInProfiles as cleanupSharedInvalidSkillReferencesInProfiles,
  type AgentProfileSkillReferenceCleanupSummary,
} from "@dotagents/shared/agent-profile-reference-cleanup"

export {
  cleanupInvalidSkillReferencesInProfiles,
  type AgentProfileSkillReferenceCleanupSummary as SkillReferenceCleanupSummary,
} from "@dotagents/shared/agent-profile-reference-cleanup"

export function cleanupInvalidSkillReferencesInLayers(
  layers: AgentsLayerPaths[],
  validSkillIds: Iterable<string>,
  now: number = Date.now(),
): AgentProfileSkillReferenceCleanupSummary {
  const combinedUpdatedProfileIds: string[] = []
  let removedReferenceCount = 0

  for (const layer of layers) {
    const loaded = loadAgentProfilesLayer(layer)
    const result = cleanupSharedInvalidSkillReferencesInProfiles<AgentProfile>(loaded.profiles, validSkillIds, now)

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
