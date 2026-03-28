import {
  getDefaultAgentProfile,
  resolveAgentProfileSelection,
  sortAgentProfilesByPriority,
} from "@dotagents/shared"
import type { AgentProfile } from "@shared/types"
import { activateAgentProfile } from "./agent-profile-activation"
import { agentProfileService } from "./agent-profile-service"
import {
  sanitizeAgentProfileConnection,
  type AgentProfileConnectionInput,
  VALID_AGENT_PROFILE_CONNECTION_TYPES,
} from "./agent-profile-connection-sanitize"

interface ManagedAgentProfileInput {
  name?: unknown
  displayName?: unknown
  description?: unknown
  systemPrompt?: unknown
  guidelines?: unknown
  connection?: unknown
  connectionType?: unknown
  connectionCommand?: unknown
  connectionArgs?: unknown
  connectionBaseUrl?: unknown
  connectionCwd?: unknown
  enabled?: unknown
  autoSpawn?: unknown
  modelConfig?: unknown
  toolConfig?: unknown
  skillsConfig?: unknown
  properties?: unknown
  avatarDataUrl?: unknown
  isStateful?: unknown
  isUserProfile?: unknown
  isAgentTarget?: unknown
  isDefault?: unknown
  role?: unknown
}

interface ManagedAgentProfileSelectionResult<TProfile extends AgentProfile> {
  ambiguousProfiles?: TProfile[]
  selectedProfile?: TProfile
}

interface UpdateManagedAgentProfileOptions {
  allowBuiltInFieldUpdates?: boolean
}

type ManagedAgentProfileError =
  | "delete_failed"
  | "delete_forbidden"
  | "invalid_input"
  | "not_found"

export interface ManagedAgentProfileMutationResult {
  success: boolean
  error?: ManagedAgentProfileError
  errorMessage?: string
  profile?: AgentProfile
}

export interface ManagedAgentProfileDeleteResult {
  success: boolean
  error?: Exclude<ManagedAgentProfileError, "invalid_input">
  errorMessage?: string
  activatedProfile?: AgentProfile
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getOptionalString(
  value: unknown,
  fieldName: string,
  options: {
    trim?: boolean
  } = {},
): { value?: string; errorMessage?: string } {
  if (value === undefined) {
    return {}
  }

  if (typeof value !== "string") {
    return {
      errorMessage: `${fieldName} must be a string when provided`,
    }
  }

  return {
    value: options.trim === false ? value : value.trim(),
  }
}

function getRequiredDisplayName(value: unknown): {
  value?: string
  errorMessage?: string
} {
  if (typeof value !== "string" || value.trim() === "") {
    return {
      errorMessage: "displayName is required and must be a non-empty string",
    }
  }

  return { value: value.trim() }
}

function getUpdatedDisplayName(value: unknown): {
  value?: string
  errorMessage?: string
} {
  if (value === undefined) {
    return {}
  }

  if (typeof value !== "string" || value.trim() === "") {
    return {
      errorMessage: "displayName must be a non-empty string",
    }
  }

  return { value: value.trim() }
}

function getOptionalBoolean(
  value: unknown,
  fieldName: string,
): { value?: boolean; errorMessage?: string } {
  if (value === undefined) {
    return {}
  }

  if (typeof value !== "boolean") {
    return {
      errorMessage: `${fieldName} must be a boolean when provided`,
    }
  }

  return { value }
}

function getOptionalConnectionText(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function getOptionalConnectionArgs(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value) && value.every((part) => typeof part === "string")) {
    return value.join(" ")
  }

  return undefined
}

function getAgentProfileInputErrorResult(
  errorMessage: string,
): ManagedAgentProfileMutationResult {
  return {
    success: false,
    error: "invalid_input",
    errorMessage,
  }
}

function getConnectionInput(
  input: ManagedAgentProfileInput,
  existingProfile?: AgentProfile,
): { value?: AgentProfile["connection"]; errorMessage?: string } {
  const connectionRecord = isRecord(input.connection)
    ? input.connection
    : undefined
  const connectionType =
    connectionRecord?.type ??
    input.connectionType ??
    existingProfile?.connection.type

  if (
    connectionType !== undefined &&
    (typeof connectionType !== "string" ||
      !VALID_AGENT_PROFILE_CONNECTION_TYPES.includes(
        connectionType as (typeof VALID_AGENT_PROFILE_CONNECTION_TYPES)[number],
      ))
  ) {
    return {
      errorMessage: `connectionType must be one of: ${VALID_AGENT_PROFILE_CONNECTION_TYPES.join(", ")}`,
    }
  }

  const connectionInput: AgentProfileConnectionInput = {
    connectionType:
      connectionType as AgentProfileConnectionInput["connectionType"],
    connectionCommand: getOptionalConnectionText(
      connectionRecord?.command ?? input.connectionCommand,
    ),
    connectionArgs: getOptionalConnectionArgs(
      connectionRecord?.args ?? input.connectionArgs,
    ),
    connectionBaseUrl: getOptionalConnectionText(
      connectionRecord?.baseUrl ?? input.connectionBaseUrl,
    ),
    connectionCwd: getOptionalConnectionText(
      connectionRecord?.cwd ?? input.connectionCwd,
    ),
  }

  return {
    value: sanitizeAgentProfileConnection(
      connectionInput,
      existingProfile?.connection,
    ),
  }
}

function getSortedManagedAgentProfiles(
  profiles: readonly AgentProfile[],
): AgentProfile[] {
  return sortAgentProfilesByPriority(profiles, {
    priorityProfileId: agentProfileService.getCurrentProfile()?.id,
  })
}

function applyFallbackProfileAfterDelete(
  deletedProfileId: string,
): AgentProfile | undefined {
  const remainingProfiles = agentProfileService.getAll()
  if (remainingProfiles.length === 0) {
    return undefined
  }

  const fallbackProfile =
    getDefaultAgentProfile(remainingProfiles) ??
    getSortedManagedAgentProfiles(remainingProfiles).find(
      (profile) => profile.id !== deletedProfileId,
    ) ??
    remainingProfiles[0]

  return fallbackProfile ? activateAgentProfile(fallbackProfile) : undefined
}

export function getManagedAgentProfiles(): AgentProfile[] {
  return getSortedManagedAgentProfiles(agentProfileService.getAll())
}

export function getManagedAgentProfile(
  profileId: string,
): AgentProfile | undefined {
  return agentProfileService.getById(profileId)
}

export function resolveManagedAgentProfileSelection<
  TProfile extends AgentProfile,
>(
  profiles: readonly TProfile[],
  query: string,
): ManagedAgentProfileSelectionResult<TProfile> {
  return resolveAgentProfileSelection(profiles, query)
}

export function createManagedAgentProfile(
  input: ManagedAgentProfileInput,
): ManagedAgentProfileMutationResult {
  const displayName = getRequiredDisplayName(input.displayName)
  if (displayName.errorMessage) {
    return getAgentProfileInputErrorResult(displayName.errorMessage)
  }

  const connection = getConnectionInput(input)
  if (connection.errorMessage) {
    return getAgentProfileInputErrorResult(connection.errorMessage)
  }

  const enabled = getOptionalBoolean(input.enabled, "enabled")
  if (enabled.errorMessage) {
    return getAgentProfileInputErrorResult(enabled.errorMessage)
  }

  const autoSpawn = getOptionalBoolean(input.autoSpawn, "autoSpawn")
  if (autoSpawn.errorMessage) {
    return getAgentProfileInputErrorResult(autoSpawn.errorMessage)
  }

  const name = getOptionalString(input.name, "name")
  if (name.errorMessage) {
    return getAgentProfileInputErrorResult(name.errorMessage)
  }

  const description = getOptionalString(input.description, "description", {
    trim: false,
  })
  if (description.errorMessage) {
    return getAgentProfileInputErrorResult(description.errorMessage)
  }

  const systemPrompt = getOptionalString(input.systemPrompt, "systemPrompt", {
    trim: false,
  })
  if (systemPrompt.errorMessage) {
    return getAgentProfileInputErrorResult(systemPrompt.errorMessage)
  }

  const guidelines = getOptionalString(input.guidelines, "guidelines", {
    trim: false,
  })
  if (guidelines.errorMessage) {
    return getAgentProfileInputErrorResult(guidelines.errorMessage)
  }

  const profile = agentProfileService.create({
    name: name.value || displayName.value || "",
    displayName: displayName.value || "",
    description: description.value,
    systemPrompt: systemPrompt.value,
    guidelines: guidelines.value,
    connection: connection.value || { type: "internal" },
    enabled: enabled.value !== false,
    autoSpawn: autoSpawn.value,
    modelConfig: input.modelConfig as AgentProfile["modelConfig"],
    toolConfig: input.toolConfig as AgentProfile["toolConfig"],
    skillsConfig: input.skillsConfig as AgentProfile["skillsConfig"],
    properties: input.properties as AgentProfile["properties"],
    avatarDataUrl:
      (input.avatarDataUrl as AgentProfile["avatarDataUrl"]) ?? undefined,
    isStateful: input.isStateful as AgentProfile["isStateful"],
    role: (input.role as AgentProfile["role"]) || "delegation-target",
    isUserProfile:
      (input.isUserProfile as AgentProfile["isUserProfile"]) ?? false,
    isAgentTarget:
      (input.isAgentTarget as AgentProfile["isAgentTarget"]) ?? true,
    isDefault: input.isDefault as AgentProfile["isDefault"],
  })

  return {
    success: true,
    profile,
  }
}

export function updateManagedAgentProfile(
  profileId: string,
  input: ManagedAgentProfileInput,
  options: UpdateManagedAgentProfileOptions = {},
): ManagedAgentProfileMutationResult {
  const profile = agentProfileService.getById(profileId)
  if (!profile) {
    return {
      success: false,
      error: "not_found",
      errorMessage: "Agent profile not found",
    }
  }

  const updates: Partial<AgentProfile> = {}
  const allowFullBuiltInUpdates =
    options.allowBuiltInFieldUpdates || !profile.isBuiltIn

  const enabled = getOptionalBoolean(input.enabled, "enabled")
  if (enabled.errorMessage) {
    return getAgentProfileInputErrorResult(enabled.errorMessage)
  }
  if (enabled.value !== undefined) {
    updates.enabled = enabled.value
  }

  const autoSpawn = getOptionalBoolean(input.autoSpawn, "autoSpawn")
  if (autoSpawn.errorMessage) {
    return getAgentProfileInputErrorResult(autoSpawn.errorMessage)
  }
  if (autoSpawn.value !== undefined) {
    updates.autoSpawn = autoSpawn.value
  }

  const guidelines = getOptionalString(input.guidelines, "guidelines", {
    trim: false,
  })
  if (guidelines.errorMessage) {
    return getAgentProfileInputErrorResult(guidelines.errorMessage)
  }
  if (guidelines.value !== undefined) {
    updates.guidelines = guidelines.value
  }

  if (allowFullBuiltInUpdates) {
    const displayName = getUpdatedDisplayName(input.displayName)
    if (displayName.errorMessage) {
      return getAgentProfileInputErrorResult(displayName.errorMessage)
    }
    if (displayName.value) {
      updates.displayName = displayName.value
      updates.name = displayName.value
    }

    const description = getOptionalString(input.description, "description", {
      trim: false,
    })
    if (description.errorMessage) {
      return getAgentProfileInputErrorResult(description.errorMessage)
    }
    if (description.value !== undefined) {
      updates.description = description.value
    }

    const systemPrompt = getOptionalString(input.systemPrompt, "systemPrompt", {
      trim: false,
    })
    if (systemPrompt.errorMessage) {
      return getAgentProfileInputErrorResult(systemPrompt.errorMessage)
    }
    if (systemPrompt.value !== undefined) {
      updates.systemPrompt = systemPrompt.value
    }

    if (
      input.connection !== undefined ||
      input.connectionType !== undefined ||
      input.connectionCommand !== undefined ||
      input.connectionArgs !== undefined ||
      input.connectionBaseUrl !== undefined ||
      input.connectionCwd !== undefined
    ) {
      const connection = getConnectionInput(input, profile)
      if (connection.errorMessage) {
        return getAgentProfileInputErrorResult(connection.errorMessage)
      }
      if (connection.value) {
        updates.connection = connection.value
      }
    }

    if (input.modelConfig !== undefined) {
      updates.modelConfig = input.modelConfig as AgentProfile["modelConfig"]
    }
    if (input.toolConfig !== undefined) {
      updates.toolConfig = input.toolConfig as AgentProfile["toolConfig"]
    }
    if (input.skillsConfig !== undefined) {
      updates.skillsConfig = input.skillsConfig as AgentProfile["skillsConfig"]
    }
    if (input.properties !== undefined) {
      updates.properties = input.properties as AgentProfile["properties"]
    }
    if (input.avatarDataUrl !== undefined) {
      updates.avatarDataUrl =
        input.avatarDataUrl as AgentProfile["avatarDataUrl"]
    }
    if (input.isStateful !== undefined) {
      updates.isStateful = input.isStateful as AgentProfile["isStateful"]
    }
    if (input.role !== undefined) {
      updates.role = input.role as AgentProfile["role"]
    }
    if (input.isUserProfile !== undefined) {
      updates.isUserProfile =
        input.isUserProfile as AgentProfile["isUserProfile"]
    }
    if (input.isAgentTarget !== undefined) {
      updates.isAgentTarget =
        input.isAgentTarget as AgentProfile["isAgentTarget"]
    }
    if (input.isDefault !== undefined) {
      updates.isDefault = input.isDefault as AgentProfile["isDefault"]
    }
  }

  const updatedProfile = agentProfileService.update(profileId, updates)
  if (!updatedProfile) {
    return {
      success: false,
      error: "not_found",
      errorMessage: "Agent profile not found",
    }
  }

  return {
    success: true,
    profile: updatedProfile,
  }
}

export function toggleManagedAgentProfileEnabled(
  profileId: string,
): ManagedAgentProfileMutationResult {
  const profile = agentProfileService.getById(profileId)
  if (!profile) {
    return {
      success: false,
      error: "not_found",
      errorMessage: "Agent profile not found",
    }
  }

  return updateManagedAgentProfile(profileId, {
    enabled: !profile.enabled,
  })
}

export function deleteManagedAgentProfile(
  profileId: string,
): ManagedAgentProfileDeleteResult {
  const profile = agentProfileService.getById(profileId)
  if (!profile) {
    return {
      success: false,
      error: "not_found",
      errorMessage: "Agent profile not found",
    }
  }

  if (profile.isBuiltIn) {
    return {
      success: false,
      error: "delete_forbidden",
      errorMessage: "Cannot delete built-in agent profiles",
    }
  }

  const wasCurrentProfile =
    agentProfileService.getCurrentProfile()?.id === profile.id
  const deleted = agentProfileService.delete(profileId)
  if (!deleted) {
    return {
      success: false,
      error: "delete_failed",
      errorMessage: "Failed to delete agent profile",
    }
  }

  return {
    success: true,
    activatedProfile: wasCurrentProfile
      ? applyFallbackProfileAfterDelete(profileId)
      : undefined,
  }
}
