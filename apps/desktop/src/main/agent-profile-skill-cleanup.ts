import type { AgentProfile } from "@shared/types"
import type { AgentsLayerPaths } from "./agents-files/modular-config"
import { loadAgentProfilesLayer, writeAgentsProfileFiles } from "./agents-files/agent-profiles"
import { cleanupInvalidReferenceValuesInLayers, cleanupInvalidReferenceValuesInProfiles } from "./agent-profile-reference-cleanup"

export type SkillReferenceCleanupSummary = {
  updatedProfileIds: string[]
  removedReferenceCount: number
}

export function cleanupInvalidSkillReferencesInProfiles(
  profiles: AgentProfile[],
  validSkillIds: Iterable<string>,
  now: number = Date.now(),
): { profiles: AgentProfile[] } & SkillReferenceCleanupSummary {
  return cleanupInvalidReferenceValuesInProfiles(
    profiles,
    validSkillIds,
    now,
    (profile) => profile.skillsConfig?.enabledSkillIds ?? [],
    (profile, nextSkillIds, updateTime) => {
      return {
        ...profile,
        updatedAt: updateTime,
        skillsConfig: {
          ...profile.skillsConfig,
          enabledSkillIds: nextSkillIds,
        },
      }
    },
  )
}

export function cleanupInvalidSkillReferencesInLayers(
  layers: AgentsLayerPaths[],
  validSkillIds: Iterable<string>,
  now: number = Date.now(),
): SkillReferenceCleanupSummary {
  return cleanupInvalidReferenceValuesInLayers(
    layers,
    validSkillIds,
    now,
    loadAgentProfilesLayer,
    (layer, profile) => writeAgentsProfileFiles(layer, profile, { maxBackups: 10 }),
    cleanupInvalidSkillReferencesInProfiles,
  )
}
