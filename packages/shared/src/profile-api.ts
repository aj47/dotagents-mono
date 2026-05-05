import type {
  ApiAgentProfile,
  AgentProfileDeleteResponse,
  ApiAgentProfileFull,
  ApiAgentProfilesResponse,
  AgentProfileToggleResponse,
  Profile,
  ProfilesResponse,
} from "./api-types"
import {
  sanitizeAgentProfileConnection,
  VALID_AGENT_PROFILE_CONNECTION_TYPES,
} from "./agent-profile-connection"
import type {
  AgentProfileConnectionDraft,
  AgentProfileConnectionInput,
  AgentProfileConnectionTypeValue,
} from "./agent-profile-connection"

export type SetCurrentProfileRequest = {
  profileId: string
}

export type ImportProfileRequest = {
  profileJson: string
}

export type AgentProfileCreateRouteRequest = {
  name: string
  displayName: string
  description?: string
  systemPrompt?: string
  guidelines?: string
  connection: AgentProfileConnectionDraft
  enabled: boolean
  autoSpawn?: boolean
  modelConfig?: any
  toolConfig?: any
  skillsConfig?: any
  properties?: Record<string, string>
  role: "delegation-target"
  isUserProfile: false
  isAgentTarget: true
}

export type AgentProfileUpdateRouteRequest = {
  name?: string
  displayName?: string
  description?: string
  systemPrompt?: string
  guidelines?: string
  connection?: AgentProfileConnectionDraft
  enabled?: boolean
  autoSpawn?: boolean
  modelConfig?: any
  toolConfig?: any
  skillsConfig?: any
  properties?: Record<string, string>
}

export type AgentProfileUpdateRouteContext = {
  isBuiltIn?: boolean
  connection: AgentProfileConnectionDraft
}

export type ProfileRequestParseResult<T> =
  | { ok: true; request: T }
  | { ok: false; statusCode: 400; error: string }

export type ProfileLike = {
  id: string
  name?: string
  displayName?: string
  isDefault?: boolean
  guidelines?: string
  systemPrompt?: string
  createdAt?: number
  updatedAt?: number
}

export type ProfileNameSource = "displayName" | "name"

export type ApiAgentProfileRole = "chat-agent" | "delegation-target" | "external-agent"

export type AgentProfileApiLike = {
  id: string
  name: string
  displayName: string
  description?: string
  avatarDataUrl?: string | null
  systemPrompt?: string
  guidelines?: string
  properties?: Record<string, string>
  modelConfig?: any
  toolConfig?: any
  skillsConfig?: any
  connection: AgentProfileConnectionDraft
  isStateful?: boolean
  conversationId?: string
  role?: string
  enabled: boolean
  isBuiltIn?: boolean
  isUserProfile?: boolean
  isAgentTarget?: boolean
  isDefault?: boolean
  autoSpawn?: boolean
  createdAt: number
  updatedAt: number
}

function getRequestRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {}
}

function getProfileName(profile: ProfileLike, nameSource: ProfileNameSource): string {
  return nameSource === "name"
    ? profile.name ?? profile.displayName ?? profile.id
    : profile.displayName ?? profile.name ?? profile.id
}

export function normalizeApiAgentProfileRole(role: string | undefined): ApiAgentProfileRole | undefined {
  if (role === "chat-agent" || role === "delegation-target" || role === "external-agent") return role
  if (role === "user-profile") return "chat-agent"
  return undefined
}

function getAgentProfileRole(profile: Pick<AgentProfileApiLike, "role" | "isUserProfile" | "isAgentTarget">): ApiAgentProfileRole {
  return normalizeApiAgentProfileRole(
    profile.role || (profile.isUserProfile ? "chat-agent" : profile.isAgentTarget ? "delegation-target" : "delegation-target"),
  ) ?? "delegation-target"
}

export function filterAgentProfilesByRole<T extends Pick<AgentProfileApiLike, "role" | "isUserProfile" | "isAgentTarget">>(
  profiles: T[],
  requestedRole: string | undefined,
): T[] {
  if (!requestedRole) return profiles
  const normalizedRequestedRole = normalizeApiAgentProfileRole(requestedRole)
  return profiles.filter(profile => getAgentProfileRole(profile) === normalizedRequestedRole)
}

function getConnectionTypeError(): string {
  return `connectionType must be one of: ${VALID_AGENT_PROFILE_CONNECTION_TYPES.join(", ")}`
}

function isAgentProfileConnectionType(value: unknown): value is AgentProfileConnectionTypeValue {
  return VALID_AGENT_PROFILE_CONNECTION_TYPES.includes(value as AgentProfileConnectionTypeValue)
}

function hasConnectionFields(requestBody: Record<string, unknown>): boolean {
  return requestBody.connectionType !== undefined
    || requestBody.connectionCommand !== undefined
    || requestBody.connectionArgs !== undefined
    || requestBody.connectionBaseUrl !== undefined
    || requestBody.connectionCwd !== undefined
}

function buildConnectionInput(
  requestBody: Record<string, unknown>,
  connectionType: AgentProfileConnectionTypeValue,
): AgentProfileConnectionInput {
  return {
    connectionType,
    connectionCommand: requestBody.connectionCommand as string | undefined,
    connectionArgs: requestBody.connectionArgs as string | undefined,
    connectionBaseUrl: requestBody.connectionBaseUrl as string | undefined,
    connectionCwd: requestBody.connectionCwd as string | undefined,
  }
}

export function parseSetCurrentProfileRequestBody(body: unknown): ProfileRequestParseResult<SetCurrentProfileRequest> {
  const requestBody = getRequestRecord(body)
  const profileId = requestBody.profileId

  if (!profileId || typeof profileId !== "string") {
    return { ok: false, statusCode: 400, error: "Missing or invalid profileId" }
  }

  return { ok: true, request: { profileId } }
}

export function parseImportProfileRequestBody(body: unknown): ProfileRequestParseResult<ImportProfileRequest> {
  const requestBody = getRequestRecord(body)
  const profileJson = requestBody.profileJson

  if (!profileJson || typeof profileJson !== "string") {
    return { ok: false, statusCode: 400, error: "Missing or invalid profileJson" }
  }

  return { ok: true, request: { profileJson } }
}

export function parseAgentProfileCreateRequestBody(
  body: unknown,
): ProfileRequestParseResult<AgentProfileCreateRouteRequest> {
  const requestBody = getRequestRecord(body)
  const displayName = typeof requestBody.displayName === "string" ? requestBody.displayName.trim() : ""
  if (!displayName) {
    return { ok: false, statusCode: 400, error: "displayName is required and must be a non-empty string" }
  }

  const rawConnectionType = requestBody.connectionType ?? "internal"
  if (!isAgentProfileConnectionType(rawConnectionType)) {
    return { ok: false, statusCode: 400, error: getConnectionTypeError() }
  }

  return {
    ok: true,
    request: {
      name: displayName,
      displayName,
      description: requestBody.description as string | undefined,
      systemPrompt: requestBody.systemPrompt as string | undefined,
      guidelines: requestBody.guidelines as string | undefined,
      connection: sanitizeAgentProfileConnection(buildConnectionInput(requestBody, rawConnectionType)),
      enabled: requestBody.enabled !== false,
      autoSpawn: requestBody.autoSpawn as boolean | undefined,
      modelConfig: requestBody.modelConfig as any,
      toolConfig: requestBody.toolConfig as any,
      skillsConfig: requestBody.skillsConfig as any,
      properties: requestBody.properties as Record<string, string> | undefined,
      role: "delegation-target",
      isUserProfile: false,
      isAgentTarget: true,
    },
  }
}

export function parseAgentProfileUpdateRequestBody(
  body: unknown,
  context: AgentProfileUpdateRouteContext,
): ProfileRequestParseResult<AgentProfileUpdateRouteRequest> {
  const requestBody = getRequestRecord(body)
  const request: AgentProfileUpdateRouteRequest = {}

  if (context.isBuiltIn) {
    if (requestBody.enabled !== undefined) request.enabled = requestBody.enabled as boolean
    if (requestBody.guidelines !== undefined) request.guidelines = requestBody.guidelines as string
    if (requestBody.autoSpawn !== undefined) request.autoSpawn = requestBody.autoSpawn as boolean
    return { ok: true, request }
  }

  if (
    requestBody.displayName !== undefined
    && (typeof requestBody.displayName !== "string" || requestBody.displayName.trim() === "")
  ) {
    return { ok: false, statusCode: 400, error: "displayName must be a non-empty string" }
  }

  if (typeof requestBody.displayName === "string") {
    request.displayName = requestBody.displayName.trim()
    request.name = requestBody.displayName.trim()
  }
  if (requestBody.description !== undefined) request.description = requestBody.description as string
  if (requestBody.systemPrompt !== undefined) request.systemPrompt = requestBody.systemPrompt as string
  if (requestBody.guidelines !== undefined) request.guidelines = requestBody.guidelines as string
  if (requestBody.enabled !== undefined) request.enabled = requestBody.enabled as boolean
  if (requestBody.autoSpawn !== undefined) request.autoSpawn = requestBody.autoSpawn as boolean
  if (requestBody.modelConfig !== undefined) request.modelConfig = requestBody.modelConfig as any
  if (requestBody.toolConfig !== undefined) request.toolConfig = requestBody.toolConfig as any
  if (requestBody.skillsConfig !== undefined) request.skillsConfig = requestBody.skillsConfig as any
  if (requestBody.properties !== undefined) request.properties = requestBody.properties as Record<string, string>

  if (hasConnectionFields(requestBody)) {
    const rawConnectionType = requestBody.connectionType ?? context.connection.type
    if (!isAgentProfileConnectionType(rawConnectionType)) {
      return { ok: false, statusCode: 400, error: getConnectionTypeError() }
    }

    request.connection = sanitizeAgentProfileConnection(
      buildConnectionInput(requestBody, rawConnectionType),
      context.connection,
    )
  }

  return { ok: true, request }
}

export function formatProfileForApi(
  profile: ProfileLike,
  options: { nameSource?: ProfileNameSource; includeDetails?: boolean } = {},
): Profile {
  const response: Profile = {
    id: profile.id,
    name: getProfileName(profile, options.nameSource ?? "displayName"),
    isDefault: profile.isDefault,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }

  if (options.includeDetails) {
    response.guidelines = profile.guidelines || ""
    response.systemPrompt = profile.systemPrompt
  }

  return response
}

export function buildProfilesResponse(
  profiles: ProfileLike[],
  currentProfile?: Pick<ProfileLike, "id">,
): ProfilesResponse {
  return {
    profiles: profiles.map(profile => formatProfileForApi(profile)),
    currentProfileId: currentProfile?.id,
  }
}

export function formatAgentProfileSummaryForApi(profile: AgentProfileApiLike): ApiAgentProfile {
  return {
    id: profile.id,
    name: profile.name,
    displayName: profile.displayName,
    description: profile.description,
    enabled: profile.enabled,
    isBuiltIn: profile.isBuiltIn,
    isUserProfile: profile.isUserProfile,
    isAgentTarget: profile.isAgentTarget,
    isDefault: profile.isDefault,
    role: getAgentProfileRole(profile),
    connectionType: profile.connection.type,
    autoSpawn: profile.autoSpawn,
    guidelines: profile.guidelines,
    systemPrompt: profile.systemPrompt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

export function formatAgentProfileFullForApi(profile: AgentProfileApiLike): ApiAgentProfileFull {
  return {
    ...formatAgentProfileSummaryForApi(profile),
    avatarDataUrl: profile.avatarDataUrl ?? undefined,
    properties: profile.properties,
    modelConfig: profile.modelConfig,
    toolConfig: profile.toolConfig,
    skillsConfig: profile.skillsConfig,
    connection: profile.connection,
    isStateful: profile.isStateful,
    conversationId: profile.conversationId,
  }
}

export function buildAgentProfilesResponse(profiles: AgentProfileApiLike[]): ApiAgentProfilesResponse {
  return { profiles: profiles.map(formatAgentProfileSummaryForApi) }
}

export function buildAgentProfileDetailResponse(profile: AgentProfileApiLike): { profile: ApiAgentProfileFull } {
  return { profile: formatAgentProfileFullForApi(profile) }
}

export function buildAgentProfileMutationDetailResponse(
  profile: AgentProfileApiLike,
): { success: true; profile: ApiAgentProfileFull } {
  return { success: true, profile: formatAgentProfileFullForApi(profile) }
}

export function buildAgentProfileToggleResponse(id: string, enabled: boolean): AgentProfileToggleResponse {
  return { success: true, id, enabled }
}

export function buildAgentProfileDeleteResponse(): AgentProfileDeleteResponse {
  return { success: true }
}

export function buildProfileMutationResponse(
  profile: ProfileLike,
  options: { nameSource?: ProfileNameSource } = {},
): { success: true; profile: Profile } {
  return {
    success: true,
    profile: formatProfileForApi(profile, { nameSource: options.nameSource }),
  }
}

export function buildProfileExportResponse(profileJson: string): { profileJson: string } {
  return { profileJson }
}
