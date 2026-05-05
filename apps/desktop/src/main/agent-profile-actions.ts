import {
  buildAgentProfileDeleteResponse,
  buildAgentProfileDetailResponse,
  buildAgentProfileMutationDetailResponse,
  buildAgentProfilesResponse,
  buildAgentProfileToggleResponse,
  filterAgentProfilesByRole,
  parseAgentProfileCreateRequestBody,
  parseAgentProfileUpdateRequestBody,
} from "@dotagents/shared/profile-api"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { agentProfileService } from "./agent-profile-service"
import { diagnosticsService } from "./diagnostics"

export type AgentProfileActionResult = MobileApiActionResult

function ok(body: unknown, statusCode = 200): AgentProfileActionResult {
  return {
    statusCode,
    body,
  }
}

function error(statusCode: number, message: string): AgentProfileActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

export function getAgentProfiles(role: string | undefined): AgentProfileActionResult {
  try {
    let profiles = agentProfileService.getAll()

    if (role) {
      profiles = filterAgentProfilesByRole(profiles, role)
    }

    return ok(buildAgentProfilesResponse(profiles))
  } catch (caughtError) {
    diagnosticsService.logError("agent-profile-actions", "Failed to get agent profiles", caughtError)
    return error(500, "Failed to get agent profiles")
  }
}

export function toggleAgentProfile(id: string | undefined): AgentProfileActionResult {
  try {
    const profile = agentProfileService.getById(id ?? "")

    if (!profile) {
      return error(404, "Agent profile not found")
    }

    const updated = agentProfileService.update(id ?? "", {
      enabled: !profile.enabled,
    })

    return ok(buildAgentProfileToggleResponse(id ?? "", updated?.enabled ?? !profile.enabled))
  } catch (caughtError: any) {
    diagnosticsService.logError("agent-profile-actions", "Failed to toggle agent profile", caughtError)
    return error(500, caughtError?.message || "Failed to toggle agent profile")
  }
}

export function getAgentProfile(id: string | undefined): AgentProfileActionResult {
  try {
    const profile = agentProfileService.getById(id ?? "")

    if (!profile) {
      return error(404, "Agent profile not found")
    }

    return ok(buildAgentProfileDetailResponse(profile))
  } catch (caughtError: any) {
    diagnosticsService.logError("agent-profile-actions", "Failed to get agent profile", caughtError)
    return error(500, caughtError?.message || "Failed to get agent profile")
  }
}

export function createAgentProfile(body: unknown): AgentProfileActionResult {
  try {
    const parsedRequest = parseAgentProfileCreateRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const newProfile = agentProfileService.create(parsedRequest.request)
    return ok(buildAgentProfileDetailResponse(newProfile), 201)
  } catch (caughtError: any) {
    diagnosticsService.logError("agent-profile-actions", "Failed to create agent profile", caughtError)
    return error(500, caughtError?.message || "Failed to create agent profile")
  }
}

export function updateAgentProfile(id: string | undefined, body: unknown): AgentProfileActionResult {
  try {
    const profile = agentProfileService.getById(id ?? "")
    if (!profile) {
      return error(404, "Agent profile not found")
    }

    const parsedRequest = parseAgentProfileUpdateRequestBody(body, {
      isBuiltIn: profile.isBuiltIn,
      connection: profile.connection,
    })
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const updatedProfile = agentProfileService.update(id ?? "", parsedRequest.request)
    if (!updatedProfile) {
      return error(500, "Failed to update agent profile")
    }

    return ok(buildAgentProfileMutationDetailResponse(updatedProfile))
  } catch (caughtError: any) {
    diagnosticsService.logError("agent-profile-actions", "Failed to update agent profile", caughtError)
    return error(500, caughtError?.message || "Failed to update agent profile")
  }
}

export function deleteAgentProfile(id: string | undefined): AgentProfileActionResult {
  try {
    const profile = agentProfileService.getById(id ?? "")

    if (!profile) {
      return error(404, "Agent profile not found")
    }

    if (profile.isBuiltIn) {
      return error(403, "Cannot delete built-in agent profiles")
    }

    const success = agentProfileService.delete(id ?? "")
    if (!success) {
      return error(500, "Failed to delete agent profile")
    }

    return ok(buildAgentProfileDeleteResponse())
  } catch (caughtError: any) {
    diagnosticsService.logError("agent-profile-actions", "Failed to delete agent profile", caughtError)
    return error(500, caughtError?.message || "Failed to delete agent profile")
  }
}
