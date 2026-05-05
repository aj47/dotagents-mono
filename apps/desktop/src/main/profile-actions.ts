import {
  buildProfileExportResponse,
  buildProfileMutationResponse,
  buildProfilesResponse,
  formatProfileForApi,
  parseImportProfileRequestBody,
  parseSetCurrentProfileRequestBody,
} from "@dotagents/shared/profile-api"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { agentProfileService, toolConfigToMcpServerConfig } from "./agent-profile-service"
import { diagnosticsService } from "./diagnostics"
import { mcpService } from "./mcp-service"

export type ProfileActionResult = MobileApiActionResult

function ok(body: unknown, statusCode = 200): ProfileActionResult {
  return {
    statusCode,
    body,
  }
}

function error(statusCode: number, message: string): ProfileActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

export function getProfiles(): ProfileActionResult {
  try {
    const profiles = agentProfileService.getUserProfiles()
    const currentProfile = agentProfileService.getCurrentProfile()
    return ok(buildProfilesResponse(profiles, currentProfile))
  } catch (caughtError) {
    diagnosticsService.logError("profile-actions", "Failed to get profiles", caughtError)
    return error(500, "Failed to get profiles")
  }
}

export function getCurrentProfile(): ProfileActionResult {
  try {
    const profile = agentProfileService.getCurrentProfile()
    if (!profile) {
      return error(404, "No current profile set")
    }

    return ok(formatProfileForApi(profile, { includeDetails: true }))
  } catch (caughtError) {
    diagnosticsService.logError("profile-actions", "Failed to get current profile", caughtError)
    return error(500, "Failed to get current profile")
  }
}

export function setCurrentProfile(body: unknown): ProfileActionResult {
  try {
    const parsedRequest = parseSetCurrentProfileRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const profile = agentProfileService.setCurrentProfileStrict(parsedRequest.request.profileId)
    const mcpServerConfig = toolConfigToMcpServerConfig(profile.toolConfig)
    mcpService.applyProfileMcpConfig(
      mcpServerConfig?.disabledServers,
      mcpServerConfig?.disabledTools,
      mcpServerConfig?.allServersDisabledByDefault,
      mcpServerConfig?.enabledServers,
      mcpServerConfig?.enabledRuntimeTools,
    )
    diagnosticsService.logInfo("profile-actions", `Switched to profile: ${profile.displayName}`)

    return ok(buildProfileMutationResponse(profile, { nameSource: "name" }))
  } catch (caughtError: any) {
    diagnosticsService.logError("profile-actions", "Failed to set current profile", caughtError)
    const isNotFound = caughtError?.message?.includes("not found")
    return error(isNotFound ? 404 : 500, caughtError?.message || "Failed to set current profile")
  }
}

export function exportProfile(id: string | undefined): ProfileActionResult {
  try {
    const profileJson = agentProfileService.exportProfile(id ?? "")
    return ok(buildProfileExportResponse(profileJson))
  } catch (caughtError: any) {
    diagnosticsService.logError("profile-actions", "Failed to export profile", caughtError)
    const isNotFound = caughtError?.message?.includes("not found")
    return error(isNotFound ? 404 : 500, caughtError?.message || "Failed to export profile")
  }
}

export function importProfile(body: unknown): ProfileActionResult {
  try {
    const parsedRequest = parseImportProfileRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const profile = agentProfileService.importProfile(parsedRequest.request.profileJson)
    diagnosticsService.logInfo("profile-actions", `Imported profile: ${profile.displayName}`)
    return ok(buildProfileMutationResponse(profile))
  } catch (caughtError: any) {
    diagnosticsService.logError("profile-actions", "Failed to import profile", caughtError)
    const errorMessage = (caughtError?.message ?? "").toLowerCase()
    const isValidationError = caughtError instanceof SyntaxError ||
      errorMessage.includes("json") ||
      errorMessage.includes("invalid") ||
      errorMessage.includes("missing")

    return error(isValidationError ? 400 : 500, caughtError?.message || "Failed to import profile")
  }
}
