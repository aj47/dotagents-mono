import { loadAgentProfilesLayer, writeAgentsProfileFiles, type AgentProfile } from "@dotagents/core"
import type { AgentsLayerPaths } from "@dotagents/core"
import {
  cleanupInvalidMcpServerReferencesInProfileLayers as cleanupSharedInvalidMcpServerReferencesInProfileLayers,
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
  return cleanupSharedInvalidMcpServerReferencesInProfileLayers<AgentsLayerPaths, AgentProfile>(
    layers,
    validServerNames,
    {
      loadProfiles: (layer) => loadAgentProfilesLayer(layer).profiles,
      writeProfile: (layer, profile) => writeAgentsProfileFiles(layer, profile, { maxBackups: 10 }),
    },
    now,
  )
}
