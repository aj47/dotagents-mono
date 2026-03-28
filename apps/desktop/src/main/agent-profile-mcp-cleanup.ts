import type { AgentProfile } from "@shared/types"
import type { AgentsLayerPaths } from "./agents-files/modular-config"
import { loadAgentProfilesLayer, writeAgentsProfileFiles } from "./agents-files/agent-profiles"
import { cleanupInvalidReferenceValuesInLayers, cleanupInvalidReferenceValuesInProfiles } from "./agent-profile-reference-cleanup"

export type McpServerReferenceCleanupSummary = {
  updatedProfileIds: string[]
  removedReferenceCount: number
}

function cleanupInvalidMcpServerReferencesInProfiles(
  profiles: AgentProfile[],
  validServerNames: Iterable<string>,
  now: number = Date.now(),
): { profiles: AgentProfile[] } & McpServerReferenceCleanupSummary {
  return cleanupInvalidReferenceValuesInProfiles(
    profiles,
    validServerNames,
    now,
    (profile) => profile.toolConfig?.enabledServers ?? [],
    (profile, nextServerNames, updateTime) => {
      return {
        ...profile,
        updatedAt: updateTime,
        toolConfig: {
          ...profile.toolConfig,
          enabledServers: nextServerNames,
        },
      }
    },
  )
}

export function cleanupInvalidMcpServerReferencesInLayers(
  layers: AgentsLayerPaths[],
  validServerNames: Iterable<string>,
  now: number = Date.now(),
): McpServerReferenceCleanupSummary {
  return cleanupInvalidReferenceValuesInLayers(
    layers,
    validServerNames,
    now,
    loadAgentProfilesLayer,
    (layer, profile) => writeAgentsProfileFiles(layer, profile, { maxBackups: 10 }),
    cleanupInvalidMcpServerReferencesInProfiles,
  )
}
