import { loadAgentProfilesLayer, writeAgentsProfileFiles, type AgentProfile } from "@dotagents/core"
import type { AgentsLayerPaths } from "@dotagents/core"
import {
  cleanupInvalidSkillReferencesInProfileLayers as cleanupSharedInvalidSkillReferencesInProfileLayers,
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
  return cleanupSharedInvalidSkillReferencesInProfileLayers<AgentsLayerPaths, AgentProfile>(
    layers,
    validSkillIds,
    {
      loadProfiles: (layer) => loadAgentProfilesLayer(layer).profiles,
      writeProfile: (layer, profile) => writeAgentsProfileFiles(layer, profile, { maxBackups: 10 }),
    },
    now,
  )
}
