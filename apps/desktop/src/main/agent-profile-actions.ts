import {
  createAgentProfileAction,
  deleteAgentProfileAction,
  getAgentProfileAction,
  getAgentProfilesAction,
  reloadAgentProfilesAction,
  toggleAgentProfileAction,
  updateAgentProfileAction,
  verifyExternalAgentCommandAction,
  type AgentProfileActionOptions,
  type AgentProfileReloadActionOptions,
  type ExternalAgentCommandVerificationActionOptions,
} from "@dotagents/shared/profile-api"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { agentProfileService } from "./agent-profile-service"
import { verifyExternalAgentCommand as verifyExternalAgentCommandService } from "./command-verification-service"
import { diagnosticsService } from "./diagnostics"

export type AgentProfileActionResult = MobileApiActionResult
type DesktopAgentProfileActionProfile = NonNullable<ReturnType<typeof agentProfileService.getById>>

const agentProfileActionOptions: AgentProfileActionOptions<DesktopAgentProfileActionProfile> = {
  service: {
    getAll: () => agentProfileService.getAll(),
    getById: (profileId) => agentProfileService.getById(profileId),
    create: (profile) => agentProfileService.create(profile),
    update: (profileId, updates) => agentProfileService.update(profileId, updates),
    deleteProfile: (profileId) => agentProfileService.delete(profileId),
  },
  diagnostics: diagnosticsService,
}

const agentProfileReloadActionOptions: AgentProfileReloadActionOptions<DesktopAgentProfileActionProfile> = {
  service: {
    ...agentProfileActionOptions.service,
    reload: () => agentProfileService.reload(),
  },
  diagnostics: diagnosticsService,
}

const externalAgentCommandVerificationActionOptions: ExternalAgentCommandVerificationActionOptions = {
  service: {
    verifyExternalAgentCommand: verifyExternalAgentCommandService,
  },
  diagnostics: diagnosticsService,
}

export function getAgentProfiles(role: string | undefined): AgentProfileActionResult {
  return getAgentProfilesAction(role, agentProfileActionOptions)
}

export function reloadAgentProfiles(): AgentProfileActionResult {
  return reloadAgentProfilesAction(agentProfileReloadActionOptions)
}

export function toggleAgentProfile(id: string | undefined): AgentProfileActionResult {
  return toggleAgentProfileAction(id, agentProfileActionOptions)
}

export function getAgentProfile(id: string | undefined): AgentProfileActionResult {
  return getAgentProfileAction(id, agentProfileActionOptions)
}

export function createAgentProfile(body: unknown): AgentProfileActionResult {
  return createAgentProfileAction(body, agentProfileActionOptions)
}

export function updateAgentProfile(id: string | undefined, body: unknown): AgentProfileActionResult {
  return updateAgentProfileAction(id, body, agentProfileActionOptions)
}

export function deleteAgentProfile(id: string | undefined): AgentProfileActionResult {
  return deleteAgentProfileAction(id, agentProfileActionOptions)
}

export function verifyExternalAgentCommand(body: unknown): Promise<AgentProfileActionResult> {
  return verifyExternalAgentCommandAction(body, externalAgentCommandVerificationActionOptions)
}
