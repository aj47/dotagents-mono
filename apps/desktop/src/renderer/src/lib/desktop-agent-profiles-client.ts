import type {
  VerifyExternalAgentCommandRequest,
  VerifyExternalAgentCommandResponse,
} from "@dotagents/shared/api-types"
import type { AgentProfile } from "@dotagents/shared/agent-profile-domain"
import type {
  AgentProfileCreateRouteRequest,
  AgentProfileUpdateRouteRequest,
} from "@dotagents/shared/profile-api"
import type { LegacyProfileRecord as Profile } from "@dotagents/shared/agent-profile-legacy-converters"
import type { DetailedToolInfo } from "@dotagents/shared/mcp-utils"
import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopMcpServerStatusEntry {
  connected: boolean
  toolCount: number
  runtimeEnabled?: boolean
  configDisabled?: boolean
}

export type DesktopMcpServerStatus = Record<string, DesktopMcpServerStatusEntry>

export type DesktopAgentProfileCreateRequest =
  Omit<AgentProfileCreateRouteRequest, "name" | "role"> &
  Partial<Pick<AgentProfileCreateRouteRequest, "name" | "role">> & {
    isDefault?: boolean
    isStateful?: boolean
  }

export type DesktopAgentProfileUpdateRequest = AgentProfileUpdateRouteRequest & {
  isAgentTarget?: boolean
  isDefault?: boolean
  isStateful?: boolean
  isUserProfile?: boolean
}

export interface DesktopAgentProfilesReloadResult {
  success: boolean
}

export interface DesktopSetCurrentAgentProfileResult {
  success: boolean
}

export const desktopAgentProfilesClient = {
  getAgentProfiles(): Promise<AgentProfile[]> {
    return tipcClient.getAgentProfiles() as Promise<AgentProfile[]>
  },

  getCurrentProfile(): Promise<AgentProfile | Profile | null | undefined> {
    return tipcClient.getCurrentProfile() as Promise<AgentProfile | Profile | null | undefined>
  },

  createAgentProfile(profile: DesktopAgentProfileCreateRequest): Promise<AgentProfile> {
    const payload = {
      ...profile,
      name: profile.name || profile.displayName,
      role: profile.role ?? "delegation-target",
    }
    return tipcClient.createAgentProfile({ profile: payload }) as Promise<AgentProfile>
  },

  updateAgentProfile(
    id: string,
    updates: DesktopAgentProfileUpdateRequest,
  ): Promise<AgentProfile | undefined> {
    return tipcClient.updateAgentProfile({ id, updates }) as Promise<AgentProfile | undefined>
  },

  deleteAgentProfile(id: string): Promise<boolean> {
    return tipcClient.deleteAgentProfile({ id }) as Promise<boolean>
  },

  setCurrentAgentProfile(id: string): Promise<DesktopSetCurrentAgentProfileResult> {
    return tipcClient.setCurrentAgentProfile({ id }) as Promise<DesktopSetCurrentAgentProfileResult>
  },

  reloadAgentProfiles(): Promise<DesktopAgentProfilesReloadResult> {
    return tipcClient.reloadAgentProfiles() as Promise<DesktopAgentProfilesReloadResult>
  },

  verifyExternalAgentCommand(
    request: VerifyExternalAgentCommandRequest,
  ): Promise<VerifyExternalAgentCommandResponse> {
    return tipcClient.verifyExternalAgentCommand(request) as Promise<VerifyExternalAgentCommandResponse>
  },

  getDefaultSystemPrompt(): Promise<string> {
    return tipcClient.getDefaultSystemPrompt() as Promise<string>
  },

  getMcpServerStatus(): Promise<DesktopMcpServerStatus> {
    return tipcClient.getMcpServerStatus() as Promise<DesktopMcpServerStatus>
  },

  getMcpDetailedToolList(): Promise<DetailedToolInfo[]> {
    return tipcClient.getMcpDetailedToolList() as Promise<DetailedToolInfo[]>
  },
}
