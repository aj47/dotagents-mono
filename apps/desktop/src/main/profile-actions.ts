import {
  exportProfileAction,
  getCurrentProfileAction,
  getProfilesAction,
  importProfileAction,
  setCurrentProfileAction,
  type ProfileActionOptions,
} from "@dotagents/shared/profile-api"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { agentProfileService, toolConfigToMcpServerConfig } from "./agent-profile-service"
import { diagnosticsService } from "./diagnostics"
import { mcpService } from "./mcp-service"

export type ProfileActionResult = MobileApiActionResult
type DesktopProfileActionProfile = ReturnType<typeof agentProfileService.setCurrentProfileStrict>

const profileActionOptions: ProfileActionOptions<DesktopProfileActionProfile> = {
  service: {
    getUserProfiles: () => agentProfileService.getUserProfiles(),
    getCurrentProfile: () => agentProfileService.getCurrentProfile(),
    setCurrentProfileStrict: (profileId) => agentProfileService.setCurrentProfileStrict(profileId),
    exportProfile: (profileId) => agentProfileService.exportProfile(profileId),
    importProfile: (profileJson) => agentProfileService.importProfile(profileJson),
  },
  diagnostics: diagnosticsService,
  applyCurrentProfile: (profile) => {
    const mcpServerConfig = toolConfigToMcpServerConfig(profile.toolConfig)
    mcpService.applyProfileMcpConfig(
      mcpServerConfig?.disabledServers,
      mcpServerConfig?.disabledTools,
      mcpServerConfig?.allServersDisabledByDefault,
      mcpServerConfig?.enabledServers,
      mcpServerConfig?.enabledRuntimeTools,
    )
  },
}

export function getProfiles(): ProfileActionResult {
  return getProfilesAction(profileActionOptions)
}

export function getCurrentProfile(): ProfileActionResult {
  return getCurrentProfileAction(profileActionOptions)
}

export function setCurrentProfile(body: unknown): ProfileActionResult {
  return setCurrentProfileAction(body, profileActionOptions)
}

export function exportProfile(id: string | undefined): ProfileActionResult {
  return exportProfileAction(id, profileActionOptions)
}

export function importProfile(body: unknown): ProfileActionResult {
  return importProfileAction(body, profileActionOptions)
}
