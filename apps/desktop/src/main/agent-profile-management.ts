import { resolveAgentProfileSelection } from "@dotagents/shared"
import type {
  AgentProfile,
  AgentProfileConnection,
  AgentProfileRole,
  AgentProfileToolConfig,
  ProfileModelConfig,
  ProfileSkillsConfig,
} from "@shared/types"
import { agentProfileService } from "./agent-profile-service"
import { activateAgentProfileById } from "./agent-profile-activation"
import {
  sanitizeAgentProfileConnection,
  VALID_AGENT_PROFILE_CONNECTION_TYPES,
  type AgentProfileConnectionTypeValue,
} from "./agent-profile-connection-sanitize"

const VALID_AGENT_PROFILE_ROLES: AgentProfileRole[] = [
  "user-profile",
  "delegation-target",
  "external-agent",
]

export interface ManagedAgentProfileInput {
  name?: unknown
  displayName?: unknown
  description?: unknown
  avatarDataUrl?: unknown
  systemPrompt?: unknown
  guidelines?: unknown
  properties?: unknown
  modelConfig?: unknown
  toolConfig?: unknown
  skillsConfig?: unknown
  connection?: unknown
  connectionType?: unknown
  connectionCommand?: unknown
  connectionArgs?: unknown
  connectionBaseUrl?: unknown
  connectionCwd?: unknown
  isStateful?: unknown
  enabled?: unknown
  role?: unknown
  isUserProfile?: unknown
  isAgentTarget?: unknown
  isDefault?: unknown
  autoSpawn?: unknown
}

export type ManagedAgentProfileErrorCode =
  | "delete_forbidden"
  | "invalid_input"
  | "not_found"
  | "persist_failed"

type ManagedAgentProfileFailure = {
  success: false
  errorCode: ManagedAgentProfileErrorCode
  error: string
}

type ManagedAgentProfileMutationSuccess = {
  success: true
  profile: AgentProfile
}

type ManagedAgentProfileExportSuccess = {
  success: true
  profile: AgentProfile
  profileJson: string
}

type ManagedAgentProfileDeleteSuccess = {
  success: true
  id: string
}

export type ManagedAgentProfileMutationResult =
  | ManagedAgentProfileFailure
  | ManagedAgentProfileMutationSuccess

export type ManagedAgentProfileExportResult =
  | ManagedAgentProfileFailure
  | ManagedAgentProfileExportSuccess

export type ManagedAgentProfileDeleteResult =
  | ManagedAgentProfileFailure
  | ManagedAgentProfileDeleteSuccess

export interface ManagedAgentProfileSelectionCandidate {
  id: string
  name: string
  displayName?: string | null
}

function createManagedAgentProfileFailure(
  errorCode: ManagedAgentProfileErrorCode,
  error: string,
): ManagedAgentProfileFailure {
  return {
    success: false,
    errorCode,
    error,
  }
}

function hasOwnInputField(
  input: ManagedAgentProfileInput,
  fieldName: keyof ManagedAgentProfileInput,
): boolean {
  return Object.prototype.hasOwnProperty.call(input, fieldName)
}

function getOptionalNormalizedText(
  value: unknown,
  fieldName: string,
  options: {
    allowEmpty?: boolean
  } = {},
): {
  provided: boolean
  value?: string
  error?: string
} {
  if (value === undefined) {
    return { provided: false }
  }

  if (value === null) {
    return { provided: true, value: undefined }
  }

  if (typeof value !== "string") {
    return {
      provided: true,
      error: `${fieldName} must be a string when provided`,
    }
  }

  const trimmed = value.trim()
  if (!trimmed && !options.allowEmpty) {
    return {
      provided: true,
      value: undefined,
    }
  }

  return {
    provided: true,
    value: trimmed,
  }
}

function getRequiredNonEmptyString(
  value: unknown,
  fieldName: string,
): {
  value?: string
  error?: string
} {
  if (typeof value !== "string" || value.trim() === "") {
    return {
      error: `${fieldName} is required and must be a non-empty string`,
    }
  }

  return {
    value: value.trim(),
  }
}

function getOptionalBoolean(
  value: unknown,
  fieldName: string,
): {
  provided: boolean
  value?: boolean
  error?: string
} {
  if (value === undefined) {
    return { provided: false }
  }

  if (value === null) {
    return {
      provided: true,
      value: undefined,
    }
  }

  if (typeof value !== "boolean") {
    return {
      provided: true,
      error: `${fieldName} must be a boolean when provided`,
    }
  }

  return {
    provided: true,
    value,
  }
}

function getOptionalRole(
  value: unknown,
): {
  provided: boolean
  value?: AgentProfileRole
  error?: string
} {
  if (value === undefined) {
    return { provided: false }
  }

  if (value === null) {
    return {
      provided: true,
      value: undefined,
    }
  }

  if (typeof value !== "string") {
    return {
      provided: true,
      error: "role must be a string when provided",
    }
  }

  if (!VALID_AGENT_PROFILE_ROLES.includes(value as AgentProfileRole)) {
    return {
      provided: true,
      error: `role must be one of: ${VALID_AGENT_PROFILE_ROLES.join(", ")}`,
    }
  }

  return {
    provided: true,
    value: value as AgentProfileRole,
  }
}

function getOptionalRecordOfStrings(
  value: unknown,
  fieldName: string,
): {
  provided: boolean
  value?: Record<string, string>
  error?: string
} {
  if (value === undefined) {
    return { provided: false }
  }

  if (value === null) {
    return {
      provided: true,
      value: undefined,
    }
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return {
      provided: true,
      error: `${fieldName} must be an object with string values when provided`,
    }
  }

  const entries = Object.entries(value)
  if (!entries.every(([, entryValue]) => typeof entryValue === "string")) {
    return {
      provided: true,
      error: `${fieldName} must only contain string values`,
    }
  }

  return {
    provided: true,
    value: Object.fromEntries(entries),
  }
}

function getOptionalPlainObject<TValue>(
  value: unknown,
  fieldName: string,
): {
  provided: boolean
  value?: TValue
  error?: string
} {
  if (value === undefined) {
    return { provided: false }
  }

  if (value === null) {
    return {
      provided: true,
      value: undefined,
    }
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return {
      provided: true,
      error: `${fieldName} must be an object when provided`,
    }
  }

  return {
    provided: true,
    value: value as TValue,
  }
}

function getOptionalAvatarDataUrl(
  value: unknown,
): {
  provided: boolean
  value?: string | null
  error?: string
} {
  if (value === undefined) {
    return { provided: false }
  }

  if (value === null) {
    return {
      provided: true,
      value: null,
    }
  }

  if (typeof value !== "string") {
    return {
      provided: true,
      error: "avatarDataUrl must be a string or null when provided",
    }
  }

  const trimmed = value.trim()
  return {
    provided: true,
    value: trimmed || null,
  }
}

function getConnectionInputValue(
  draft: Record<string, unknown>,
  directFieldName: keyof AgentProfileConnection,
  flatFieldValue: unknown,
): unknown {
  if (flatFieldValue !== undefined) {
    return flatFieldValue
  }

  return draft[directFieldName]
}

function getOptionalManagedConnection(
  input: ManagedAgentProfileInput,
  existingConnection?: AgentProfileConnection,
): {
  provided: boolean
  value?: AgentProfileConnection
  error?: string
} {
  const connectionProvided = hasOwnInputField(input, "connection")
  const flatConnectionProvided =
    hasOwnInputField(input, "connectionType") ||
    hasOwnInputField(input, "connectionCommand") ||
    hasOwnInputField(input, "connectionArgs") ||
    hasOwnInputField(input, "connectionBaseUrl") ||
    hasOwnInputField(input, "connectionCwd")

  if (!connectionProvided && !flatConnectionProvided) {
    return {
      provided: false,
    }
  }

  let directConnectionDraft: Record<string, unknown> = {}
  if (connectionProvided) {
    if (
      input.connection !== null &&
      (typeof input.connection !== "object" || Array.isArray(input.connection))
    ) {
      return {
        provided: true,
        error: "connection must be an object when provided",
      }
    }

    directConnectionDraft =
      input.connection && typeof input.connection === "object"
        ? (input.connection as Record<string, unknown>)
        : {}
  }

  const connectionType = getConnectionInputValue(
    directConnectionDraft,
    "type",
    input.connectionType,
  )
  if (connectionType !== undefined && connectionType !== null) {
    if (
      typeof connectionType !== "string" ||
      !VALID_AGENT_PROFILE_CONNECTION_TYPES.includes(
        connectionType as AgentProfileConnectionTypeValue,
      )
    ) {
      return {
        provided: true,
        error: `connectionType must be one of: ${VALID_AGENT_PROFILE_CONNECTION_TYPES.join(", ")}`,
      }
    }
  }

  const connectionCommand = getConnectionInputValue(
    directConnectionDraft,
    "command",
    input.connectionCommand,
  )
  if (
    connectionCommand !== undefined &&
    connectionCommand !== null &&
    typeof connectionCommand !== "string"
  ) {
    return {
      provided: true,
      error: "connectionCommand must be a string when provided",
    }
  }

  const connectionBaseUrl = getConnectionInputValue(
    directConnectionDraft,
    "baseUrl",
    input.connectionBaseUrl,
  )
  if (
    connectionBaseUrl !== undefined &&
    connectionBaseUrl !== null &&
    typeof connectionBaseUrl !== "string"
  ) {
    return {
      provided: true,
      error: "connectionBaseUrl must be a string when provided",
    }
  }

  const connectionCwd = getConnectionInputValue(
    directConnectionDraft,
    "cwd",
    input.connectionCwd,
  )
  if (
    connectionCwd !== undefined &&
    connectionCwd !== null &&
    typeof connectionCwd !== "string"
  ) {
    return {
      provided: true,
      error: "connectionCwd must be a string when provided",
    }
  }

  const connectionArgs = getConnectionInputValue(
    directConnectionDraft,
    "args",
    input.connectionArgs,
  )
  if (
    connectionArgs !== undefined &&
    connectionArgs !== null &&
    typeof connectionArgs !== "string" &&
    (!Array.isArray(connectionArgs) ||
      !connectionArgs.every((entry) => typeof entry === "string"))
  ) {
    return {
      provided: true,
      error:
        "connectionArgs must be a string or string[] when provided",
    }
  }

  return {
    provided: true,
    value: sanitizeAgentProfileConnection(
      {
        connectionType:
          connectionType === null || connectionType === undefined
            ? undefined
            : (connectionType as AgentProfileConnectionTypeValue),
        connectionCommand:
          typeof connectionCommand === "string" ? connectionCommand : undefined,
        connectionArgs:
          typeof connectionArgs === "string" || Array.isArray(connectionArgs)
            ? connectionArgs
            : undefined,
        connectionBaseUrl:
          typeof connectionBaseUrl === "string"
            ? connectionBaseUrl
            : undefined,
        connectionCwd:
          typeof connectionCwd === "string" ? connectionCwd : undefined,
      },
      existingConnection,
    ),
  }
}

export function getManagedAgentProfiles(options: {
  role?: string | null
} = {}): AgentProfile[] {
  if (!options.role) {
    return agentProfileService.getAll()
  }

  if (VALID_AGENT_PROFILE_ROLES.includes(options.role as AgentProfileRole)) {
    return agentProfileService.getByRole(options.role as AgentProfileRole)
  }

  return []
}

export function getManagedUserAgentProfiles(): AgentProfile[] {
  return agentProfileService.getUserProfiles()
}

export function getManagedAgentTargets(): AgentProfile[] {
  return agentProfileService.getAgentTargets()
}

export function getManagedEnabledAgentTargets(): AgentProfile[] {
  return agentProfileService.getEnabledAgentTargets()
}

export function getManagedExternalAgents(): AgentProfile[] {
  return agentProfileService.getExternalAgents()
}

export function getManagedCurrentAgentProfile(): AgentProfile | undefined {
  return agentProfileService.getCurrentProfile()
}

export function getManagedAgentProfile(profileId: string): AgentProfile | undefined {
  return agentProfileService.getById(profileId)
}

export function resolveManagedAgentProfileSelection<
  TProfile extends ManagedAgentProfileSelectionCandidate,
>(profiles: readonly TProfile[], query: string) {
  return resolveAgentProfileSelection(profiles, query)
}

export function setManagedCurrentAgentProfile(
  profileId: string,
): ManagedAgentProfileMutationResult {
  const normalizedProfileId = profileId.trim()
  if (!normalizedProfileId) {
    return createManagedAgentProfileFailure(
      "invalid_input",
      "profileId is required and must be a non-empty string",
    )
  }

  const existingProfile = agentProfileService.getById(normalizedProfileId)
  if (!existingProfile) {
    return createManagedAgentProfileFailure(
      "not_found",
      `Agent profile not found: ${normalizedProfileId}`,
    )
  }

  if (!existingProfile.enabled) {
    return createManagedAgentProfileFailure(
      "invalid_input",
      `Agent profile is disabled: ${normalizedProfileId}`,
    )
  }

  try {
    return {
      success: true,
      profile: activateAgentProfileById(normalizedProfileId),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return createManagedAgentProfileFailure(
      message.toLowerCase().includes("not found")
        ? "not_found"
        : "persist_failed",
      message,
    )
  }
}

function isManagedAgentProfileValidationError(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes("json") ||
    normalized.includes("invalid") ||
    normalized.includes("missing")
  )
}

export function createManagedAgentProfile(
  input: ManagedAgentProfileInput,
): ManagedAgentProfileMutationResult {
  const displayNameInput = hasOwnInputField(input, "displayName")
    ? input.displayName
    : input.name
  const displayName = getRequiredNonEmptyString(displayNameInput, "displayName")
  if (displayName.error) {
    return createManagedAgentProfileFailure("invalid_input", displayName.error)
  }

  const description = getOptionalNormalizedText(input.description, "description")
  if (description.error) {
    return createManagedAgentProfileFailure("invalid_input", description.error)
  }

  const avatarDataUrl = getOptionalAvatarDataUrl(input.avatarDataUrl)
  if (avatarDataUrl.error) {
    return createManagedAgentProfileFailure(
      "invalid_input",
      avatarDataUrl.error,
    )
  }

  const systemPrompt = getOptionalNormalizedText(
    input.systemPrompt,
    "systemPrompt",
  )
  if (systemPrompt.error) {
    return createManagedAgentProfileFailure("invalid_input", systemPrompt.error)
  }

  const guidelines = getOptionalNormalizedText(input.guidelines, "guidelines")
  if (guidelines.error) {
    return createManagedAgentProfileFailure("invalid_input", guidelines.error)
  }

  const properties = getOptionalRecordOfStrings(input.properties, "properties")
  if (properties.error) {
    return createManagedAgentProfileFailure("invalid_input", properties.error)
  }

  const modelConfig = getOptionalPlainObject<ProfileModelConfig>(
    input.modelConfig,
    "modelConfig",
  )
  if (modelConfig.error) {
    return createManagedAgentProfileFailure("invalid_input", modelConfig.error)
  }

  const toolConfig = getOptionalPlainObject<AgentProfileToolConfig>(
    input.toolConfig,
    "toolConfig",
  )
  if (toolConfig.error) {
    return createManagedAgentProfileFailure("invalid_input", toolConfig.error)
  }

  const skillsConfig = getOptionalPlainObject<ProfileSkillsConfig>(
    input.skillsConfig,
    "skillsConfig",
  )
  if (skillsConfig.error) {
    return createManagedAgentProfileFailure("invalid_input", skillsConfig.error)
  }

  const connection = getOptionalManagedConnection(input)
  if (connection.error) {
    return createManagedAgentProfileFailure("invalid_input", connection.error)
  }

  const isStateful = getOptionalBoolean(input.isStateful, "isStateful")
  if (isStateful.error) {
    return createManagedAgentProfileFailure("invalid_input", isStateful.error)
  }

  const enabled = getOptionalBoolean(input.enabled, "enabled")
  if (enabled.error) {
    return createManagedAgentProfileFailure("invalid_input", enabled.error)
  }

  const role = getOptionalRole(input.role)
  if (role.error) {
    return createManagedAgentProfileFailure("invalid_input", role.error)
  }

  const isUserProfile = getOptionalBoolean(input.isUserProfile, "isUserProfile")
  if (isUserProfile.error) {
    return createManagedAgentProfileFailure(
      "invalid_input",
      isUserProfile.error,
    )
  }

  const isAgentTarget = getOptionalBoolean(input.isAgentTarget, "isAgentTarget")
  if (isAgentTarget.error) {
    return createManagedAgentProfileFailure(
      "invalid_input",
      isAgentTarget.error,
    )
  }

  const isDefault = getOptionalBoolean(input.isDefault, "isDefault")
  if (isDefault.error) {
    return createManagedAgentProfileFailure("invalid_input", isDefault.error)
  }

  const autoSpawn = getOptionalBoolean(input.autoSpawn, "autoSpawn")
  if (autoSpawn.error) {
    return createManagedAgentProfileFailure("invalid_input", autoSpawn.error)
  }

  const profile = agentProfileService.create({
    name: displayName.value!,
    displayName: displayName.value!,
    description: description.value,
    avatarDataUrl: avatarDataUrl.value,
    systemPrompt: systemPrompt.value,
    guidelines: guidelines.value,
    properties: properties.value,
    modelConfig: modelConfig.value,
    toolConfig: toolConfig.value,
    skillsConfig: skillsConfig.value,
    connection: connection.value ?? { type: "internal" },
    isStateful: isStateful.value,
    enabled: enabled.value ?? true,
    role: role.value ?? "delegation-target",
    isUserProfile: isUserProfile.value ?? false,
    isAgentTarget: isAgentTarget.value ?? true,
    isDefault: isDefault.value,
    autoSpawn: autoSpawn.value,
  })

  return {
    success: true,
    profile,
  }
}

export function updateManagedAgentProfile(
  profileId: string,
  input: ManagedAgentProfileInput,
): ManagedAgentProfileMutationResult {
  const existingProfile = agentProfileService.getById(profileId)
  if (!existingProfile) {
    return createManagedAgentProfileFailure(
      "not_found",
      `Agent profile not found: ${profileId}`,
    )
  }

  const updates: Partial<AgentProfile> = {}

  if (hasOwnInputField(input, "displayName") || hasOwnInputField(input, "name")) {
    const displayNameInput = hasOwnInputField(input, "displayName")
      ? input.displayName
      : input.name
    const displayName = getRequiredNonEmptyString(displayNameInput, "displayName")
    if (displayName.error) {
      return createManagedAgentProfileFailure(
        "invalid_input",
        displayName.error,
      )
    }
    updates.displayName = displayName.value
  }

  const description = getOptionalNormalizedText(input.description, "description")
  if (description.error) {
    return createManagedAgentProfileFailure("invalid_input", description.error)
  }
  if (description.provided) {
    updates.description = description.value
  }

  const avatarDataUrl = getOptionalAvatarDataUrl(input.avatarDataUrl)
  if (avatarDataUrl.error) {
    return createManagedAgentProfileFailure(
      "invalid_input",
      avatarDataUrl.error,
    )
  }
  if (avatarDataUrl.provided) {
    updates.avatarDataUrl = avatarDataUrl.value
  }

  const systemPrompt = getOptionalNormalizedText(
    input.systemPrompt,
    "systemPrompt",
  )
  if (systemPrompt.error) {
    return createManagedAgentProfileFailure("invalid_input", systemPrompt.error)
  }
  if (systemPrompt.provided) {
    updates.systemPrompt = systemPrompt.value
  }

  const guidelines = getOptionalNormalizedText(input.guidelines, "guidelines")
  if (guidelines.error) {
    return createManagedAgentProfileFailure("invalid_input", guidelines.error)
  }
  if (guidelines.provided) {
    updates.guidelines = guidelines.value
  }

  const properties = getOptionalRecordOfStrings(input.properties, "properties")
  if (properties.error) {
    return createManagedAgentProfileFailure("invalid_input", properties.error)
  }
  if (properties.provided) {
    updates.properties = properties.value
  }

  const modelConfig = getOptionalPlainObject<ProfileModelConfig>(
    input.modelConfig,
    "modelConfig",
  )
  if (modelConfig.error) {
    return createManagedAgentProfileFailure("invalid_input", modelConfig.error)
  }
  if (modelConfig.provided) {
    updates.modelConfig = modelConfig.value
  }

  const toolConfig = getOptionalPlainObject<AgentProfileToolConfig>(
    input.toolConfig,
    "toolConfig",
  )
  if (toolConfig.error) {
    return createManagedAgentProfileFailure("invalid_input", toolConfig.error)
  }
  if (toolConfig.provided) {
    updates.toolConfig = toolConfig.value
  }

  const skillsConfig = getOptionalPlainObject<ProfileSkillsConfig>(
    input.skillsConfig,
    "skillsConfig",
  )
  if (skillsConfig.error) {
    return createManagedAgentProfileFailure("invalid_input", skillsConfig.error)
  }
  if (skillsConfig.provided) {
    updates.skillsConfig = skillsConfig.value
  }

  const connection = getOptionalManagedConnection(input, existingProfile.connection)
  if (connection.error) {
    return createManagedAgentProfileFailure("invalid_input", connection.error)
  }
  if (connection.provided) {
    updates.connection = connection.value
  }

  const isStateful = getOptionalBoolean(input.isStateful, "isStateful")
  if (isStateful.error) {
    return createManagedAgentProfileFailure("invalid_input", isStateful.error)
  }
  if (isStateful.provided) {
    updates.isStateful = isStateful.value
  }

  const enabled = getOptionalBoolean(input.enabled, "enabled")
  if (enabled.error) {
    return createManagedAgentProfileFailure("invalid_input", enabled.error)
  }
  if (enabled.provided) {
    updates.enabled = enabled.value
  }

  const role = getOptionalRole(input.role)
  if (role.error) {
    return createManagedAgentProfileFailure("invalid_input", role.error)
  }
  if (role.provided) {
    updates.role = role.value
  }

  const isUserProfile = getOptionalBoolean(input.isUserProfile, "isUserProfile")
  if (isUserProfile.error) {
    return createManagedAgentProfileFailure(
      "invalid_input",
      isUserProfile.error,
    )
  }
  if (isUserProfile.provided) {
    updates.isUserProfile = isUserProfile.value
  }

  const isAgentTarget = getOptionalBoolean(input.isAgentTarget, "isAgentTarget")
  if (isAgentTarget.error) {
    return createManagedAgentProfileFailure(
      "invalid_input",
      isAgentTarget.error,
    )
  }
  if (isAgentTarget.provided) {
    updates.isAgentTarget = isAgentTarget.value
  }

  const isDefault = getOptionalBoolean(input.isDefault, "isDefault")
  if (isDefault.error) {
    return createManagedAgentProfileFailure("invalid_input", isDefault.error)
  }
  if (isDefault.provided) {
    updates.isDefault = isDefault.value
  }

  const autoSpawn = getOptionalBoolean(input.autoSpawn, "autoSpawn")
  if (autoSpawn.error) {
    return createManagedAgentProfileFailure("invalid_input", autoSpawn.error)
  }
  if (autoSpawn.provided) {
    updates.autoSpawn = autoSpawn.value
  }

  const updatedProfile = agentProfileService.update(profileId, updates)
  if (!updatedProfile) {
    return createManagedAgentProfileFailure(
      "persist_failed",
      `Failed to update agent profile: ${profileId}`,
    )
  }

  return {
    success: true,
    profile: updatedProfile,
  }
}

export function toggleManagedAgentProfileEnabled(
  profileId: string,
): ManagedAgentProfileMutationResult {
  const existingProfile = agentProfileService.getById(profileId)
  if (!existingProfile) {
    return createManagedAgentProfileFailure(
      "not_found",
      `Agent profile not found: ${profileId}`,
    )
  }

  const updatedProfile = agentProfileService.update(profileId, {
    enabled: !existingProfile.enabled,
  })
  if (!updatedProfile) {
    return createManagedAgentProfileFailure(
      "persist_failed",
      `Failed to toggle agent profile: ${profileId}`,
    )
  }

  return {
    success: true,
    profile: updatedProfile,
  }
}

export function exportManagedAgentProfile(
  profileId: string,
): ManagedAgentProfileExportResult {
  const existingProfile = agentProfileService.getById(profileId)
  if (!existingProfile) {
    return createManagedAgentProfileFailure(
      "not_found",
      `Agent profile not found: ${profileId}`,
    )
  }

  try {
    return {
      success: true,
      profile: existingProfile,
      profileJson: agentProfileService.exportProfile(profileId),
    }
  } catch (error) {
    return createManagedAgentProfileFailure(
      "persist_failed",
      error instanceof Error ? error.message : String(error),
    )
  }
}

export function importManagedAgentProfile(
  profileJson: string,
): ManagedAgentProfileMutationResult {
  if (typeof profileJson !== "string" || profileJson.trim() === "") {
    return createManagedAgentProfileFailure(
      "invalid_input",
      "profileJson is required and must be a non-empty string",
    )
  }

  try {
    return {
      success: true,
      profile: agentProfileService.importProfile(profileJson),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return createManagedAgentProfileFailure(
      isManagedAgentProfileValidationError(message)
        ? "invalid_input"
        : "persist_failed",
      message,
    )
  }
}

export function deleteManagedAgentProfile(
  profileId: string,
): ManagedAgentProfileDeleteResult {
  const existingProfile = agentProfileService.getById(profileId)
  if (!existingProfile) {
    return createManagedAgentProfileFailure(
      "not_found",
      `Agent profile not found: ${profileId}`,
    )
  }

  if (existingProfile.isBuiltIn) {
    return createManagedAgentProfileFailure(
      "delete_forbidden",
      "Cannot delete built-in agent profiles",
    )
  }

  const deleted = agentProfileService.delete(profileId)
  if (!deleted) {
    return createManagedAgentProfileFailure(
      "persist_failed",
      `Failed to delete agent profile: ${profileId}`,
    )
  }

  return {
    success: true,
    id: profileId,
  }
}
