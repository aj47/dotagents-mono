import type {
  ApiAgentProfile,
  AgentProfileDeleteResponse,
  ApiAgentProfileFull,
  ApiAgentProfilesResponse,
  AgentProfileToggleResponse,
  VerifyExternalAgentCommandRequest,
  VerifyExternalAgentCommandResponse,
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

export type ProfileActionResult = {
  statusCode: number
  body: unknown
}

export interface ProfileActionDiagnostics {
  logInfo(source: string, message: string): void
  logError(source: string, message: string, error: unknown): void
}

export interface ProfileActionService<TProfile extends ProfileLike = ProfileLike> {
  getUserProfiles(): TProfile[]
  getCurrentProfile(): TProfile | null | undefined
  setCurrentProfileStrict(profileId: string): TProfile
  exportProfile(profileId: string): string
  importProfile(profileJson: string): TProfile
}

export interface ProfileActionOptions<TProfile extends ProfileLike = ProfileLike> {
  service: ProfileActionService<TProfile>
  diagnostics: ProfileActionDiagnostics
  applyCurrentProfile?: (profile: TProfile) => void
}

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

export type AgentProfileActionResult = ProfileActionResult

export interface AgentProfileActionService<TProfile extends AgentProfileApiLike = AgentProfileApiLike> {
  getAll(): TProfile[]
  getById(profileId: string): TProfile | null | undefined
  create(profile: AgentProfileCreateRouteRequest): TProfile
  update(profileId: string, updates: AgentProfileUpdateRouteRequest): TProfile | null | undefined
  deleteProfile(profileId: string): boolean
}

export interface AgentProfileActionOptions<TProfile extends AgentProfileApiLike = AgentProfileApiLike> {
  service: AgentProfileActionService<TProfile>
  diagnostics: ProfileActionDiagnostics
}

export interface ExternalAgentCommandVerificationActionService {
  verifyExternalAgentCommand(request: VerifyExternalAgentCommandRequest): Promise<VerifyExternalAgentCommandResponse>
}

export interface ExternalAgentCommandVerificationActionOptions {
  service: ExternalAgentCommandVerificationActionService
  diagnostics: ProfileActionDiagnostics
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

function parseOptionalStringArray(value: unknown, field: string): ProfileRequestParseResult<string[] | undefined> {
  if (value === undefined) return { ok: true, request: undefined }
  if (!Array.isArray(value)) {
    return { ok: false, statusCode: 400, error: `${field} must be an array of strings` }
  }

  const strings = value.filter((item): item is string => typeof item === "string")
  if (strings.length !== value.length) {
    return { ok: false, statusCode: 400, error: `${field} must be an array of strings` }
  }

  return { ok: true, request: strings }
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

export function parseVerifyExternalAgentCommandRequestBody(
  body: unknown,
): ProfileRequestParseResult<VerifyExternalAgentCommandRequest> {
  const requestBody = getRequestRecord(body)
  const command = requestBody.command
  const commandText = typeof command === "string" ? command.trim() : ""

  if (!commandText) {
    return { ok: false, statusCode: 400, error: "command is required and must be a non-empty string" }
  }

  const args = parseOptionalStringArray(requestBody.args, "args")
  if (args.ok === false) return args

  const probeArgs = parseOptionalStringArray(requestBody.probeArgs, "probeArgs")
  if (probeArgs.ok === false) return probeArgs

  if (requestBody.cwd !== undefined && typeof requestBody.cwd !== "string") {
    return { ok: false, statusCode: 400, error: "cwd must be a string" }
  }

  return {
    ok: true,
    request: {
      command: commandText,
      ...(args.request ? { args: args.request } : {}),
      ...(typeof requestBody.cwd === "string" ? { cwd: requestBody.cwd } : {}),
      ...(probeArgs.request ? { probeArgs: probeArgs.request } : {}),
    },
  }
}

function profileActionOk(body: unknown, statusCode = 200): ProfileActionResult {
  return {
    statusCode,
    body,
  }
}

function profileActionError(statusCode: number, message: string): ProfileActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message
  }
  return fallback
}

function isNotFoundError(error: unknown): boolean {
  return getUnknownErrorMessage(error, "").includes("not found")
}

function isProfileImportValidationError(error: unknown): boolean {
  const errorMessage = getUnknownErrorMessage(error, "").toLowerCase()
  return error instanceof SyntaxError ||
    errorMessage.includes("json") ||
    errorMessage.includes("invalid") ||
    errorMessage.includes("missing")
}

function getProfileDisplayLabel(profile: ProfileLike): string {
  return profile.displayName ?? profile.name ?? profile.id
}

export function getProfilesAction<TProfile extends ProfileLike>(
  options: ProfileActionOptions<TProfile>,
): ProfileActionResult {
  try {
    const profiles = options.service.getUserProfiles()
    const currentProfile = options.service.getCurrentProfile()
    return profileActionOk(buildProfilesResponse(profiles, currentProfile ?? undefined))
  } catch (caughtError) {
    options.diagnostics.logError("profile-actions", "Failed to get profiles", caughtError)
    return profileActionError(500, "Failed to get profiles")
  }
}

export function getCurrentProfileAction<TProfile extends ProfileLike>(
  options: ProfileActionOptions<TProfile>,
): ProfileActionResult {
  try {
    const profile = options.service.getCurrentProfile()
    if (!profile) {
      return profileActionError(404, "No current profile set")
    }

    return profileActionOk(formatProfileForApi(profile, { includeDetails: true }))
  } catch (caughtError) {
    options.diagnostics.logError("profile-actions", "Failed to get current profile", caughtError)
    return profileActionError(500, "Failed to get current profile")
  }
}

export function setCurrentProfileAction<TProfile extends ProfileLike>(
  body: unknown,
  options: ProfileActionOptions<TProfile>,
): ProfileActionResult {
  try {
    const parsedRequest = parseSetCurrentProfileRequestBody(body)
    if (parsedRequest.ok === false) {
      return profileActionError(parsedRequest.statusCode, parsedRequest.error)
    }

    const profile = options.service.setCurrentProfileStrict(parsedRequest.request.profileId)
    options.applyCurrentProfile?.(profile)
    options.diagnostics.logInfo("profile-actions", `Switched to profile: ${getProfileDisplayLabel(profile)}`)

    return profileActionOk(buildProfileMutationResponse(profile, { nameSource: "name" }))
  } catch (caughtError) {
    options.diagnostics.logError("profile-actions", "Failed to set current profile", caughtError)
    return profileActionError(
      isNotFoundError(caughtError) ? 404 : 500,
      getUnknownErrorMessage(caughtError, "Failed to set current profile"),
    )
  }
}

export function exportProfileAction<TProfile extends ProfileLike>(
  id: string | undefined,
  options: ProfileActionOptions<TProfile>,
): ProfileActionResult {
  try {
    const profileJson = options.service.exportProfile(id ?? "")
    return profileActionOk(buildProfileExportResponse(profileJson))
  } catch (caughtError) {
    options.diagnostics.logError("profile-actions", "Failed to export profile", caughtError)
    return profileActionError(
      isNotFoundError(caughtError) ? 404 : 500,
      getUnknownErrorMessage(caughtError, "Failed to export profile"),
    )
  }
}

export function importProfileAction<TProfile extends ProfileLike>(
  body: unknown,
  options: ProfileActionOptions<TProfile>,
): ProfileActionResult {
  try {
    const parsedRequest = parseImportProfileRequestBody(body)
    if (parsedRequest.ok === false) {
      return profileActionError(parsedRequest.statusCode, parsedRequest.error)
    }

    const profile = options.service.importProfile(parsedRequest.request.profileJson)
    options.diagnostics.logInfo("profile-actions", `Imported profile: ${getProfileDisplayLabel(profile)}`)
    return profileActionOk(buildProfileMutationResponse(profile))
  } catch (caughtError) {
    options.diagnostics.logError("profile-actions", "Failed to import profile", caughtError)
    return profileActionError(
      isProfileImportValidationError(caughtError) ? 400 : 500,
      getUnknownErrorMessage(caughtError, "Failed to import profile"),
    )
  }
}

export function getAgentProfilesAction<TProfile extends AgentProfileApiLike>(
  role: string | undefined,
  options: AgentProfileActionOptions<TProfile>,
): AgentProfileActionResult {
  try {
    let profiles = options.service.getAll()

    if (role) {
      profiles = filterAgentProfilesByRole(profiles, role)
    }

    return profileActionOk(buildAgentProfilesResponse(profiles))
  } catch (caughtError) {
    options.diagnostics.logError("agent-profile-actions", "Failed to get agent profiles", caughtError)
    return profileActionError(500, "Failed to get agent profiles")
  }
}

export function toggleAgentProfileAction<TProfile extends AgentProfileApiLike>(
  id: string | undefined,
  options: AgentProfileActionOptions<TProfile>,
): AgentProfileActionResult {
  try {
    const profileId = id ?? ""
    const profile = options.service.getById(profileId)

    if (!profile) {
      return profileActionError(404, "Agent profile not found")
    }

    const updated = options.service.update(profileId, {
      enabled: !profile.enabled,
    })

    return profileActionOk(buildAgentProfileToggleResponse(profileId, updated?.enabled ?? !profile.enabled))
  } catch (caughtError) {
    options.diagnostics.logError("agent-profile-actions", "Failed to toggle agent profile", caughtError)
    return profileActionError(500, getUnknownErrorMessage(caughtError, "Failed to toggle agent profile"))
  }
}

export function getAgentProfileAction<TProfile extends AgentProfileApiLike>(
  id: string | undefined,
  options: AgentProfileActionOptions<TProfile>,
): AgentProfileActionResult {
  try {
    const profile = options.service.getById(id ?? "")

    if (!profile) {
      return profileActionError(404, "Agent profile not found")
    }

    return profileActionOk(buildAgentProfileDetailResponse(profile))
  } catch (caughtError) {
    options.diagnostics.logError("agent-profile-actions", "Failed to get agent profile", caughtError)
    return profileActionError(500, getUnknownErrorMessage(caughtError, "Failed to get agent profile"))
  }
}

export function createAgentProfileAction<TProfile extends AgentProfileApiLike>(
  body: unknown,
  options: AgentProfileActionOptions<TProfile>,
): AgentProfileActionResult {
  try {
    const parsedRequest = parseAgentProfileCreateRequestBody(body)
    if (parsedRequest.ok === false) {
      return profileActionError(parsedRequest.statusCode, parsedRequest.error)
    }

    const newProfile = options.service.create(parsedRequest.request)
    return profileActionOk(buildAgentProfileDetailResponse(newProfile), 201)
  } catch (caughtError) {
    options.diagnostics.logError("agent-profile-actions", "Failed to create agent profile", caughtError)
    return profileActionError(500, getUnknownErrorMessage(caughtError, "Failed to create agent profile"))
  }
}

export function updateAgentProfileAction<TProfile extends AgentProfileApiLike>(
  id: string | undefined,
  body: unknown,
  options: AgentProfileActionOptions<TProfile>,
): AgentProfileActionResult {
  try {
    const profileId = id ?? ""
    const profile = options.service.getById(profileId)
    if (!profile) {
      return profileActionError(404, "Agent profile not found")
    }

    const parsedRequest = parseAgentProfileUpdateRequestBody(body, {
      isBuiltIn: profile.isBuiltIn,
      connection: profile.connection,
    })
    if (parsedRequest.ok === false) {
      return profileActionError(parsedRequest.statusCode, parsedRequest.error)
    }

    const updatedProfile = options.service.update(profileId, parsedRequest.request)
    if (!updatedProfile) {
      return profileActionError(500, "Failed to update agent profile")
    }

    return profileActionOk(buildAgentProfileMutationDetailResponse(updatedProfile))
  } catch (caughtError) {
    options.diagnostics.logError("agent-profile-actions", "Failed to update agent profile", caughtError)
    return profileActionError(500, getUnknownErrorMessage(caughtError, "Failed to update agent profile"))
  }
}

export function deleteAgentProfileAction<TProfile extends AgentProfileApiLike>(
  id: string | undefined,
  options: AgentProfileActionOptions<TProfile>,
): AgentProfileActionResult {
  try {
    const profileId = id ?? ""
    const profile = options.service.getById(profileId)

    if (!profile) {
      return profileActionError(404, "Agent profile not found")
    }

    if (profile.isBuiltIn) {
      return profileActionError(403, "Cannot delete built-in agent profiles")
    }

    const success = options.service.deleteProfile(profileId)
    if (!success) {
      return profileActionError(500, "Failed to delete agent profile")
    }

    return profileActionOk(buildAgentProfileDeleteResponse())
  } catch (caughtError) {
    options.diagnostics.logError("agent-profile-actions", "Failed to delete agent profile", caughtError)
    return profileActionError(500, getUnknownErrorMessage(caughtError, "Failed to delete agent profile"))
  }
}

export async function verifyExternalAgentCommandAction(
  body: unknown,
  options: ExternalAgentCommandVerificationActionOptions,
): Promise<AgentProfileActionResult> {
  try {
    const parsedRequest = parseVerifyExternalAgentCommandRequestBody(body)
    if (parsedRequest.ok === false) {
      return profileActionError(parsedRequest.statusCode, parsedRequest.error)
    }

    const result = await options.service.verifyExternalAgentCommand(parsedRequest.request)
    return profileActionOk(result)
  } catch (caughtError) {
    options.diagnostics.logError("agent-profile-actions", "Failed to verify external agent command", caughtError)
    return profileActionError(500, getUnknownErrorMessage(caughtError, "Failed to verify external agent command"))
  }
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
