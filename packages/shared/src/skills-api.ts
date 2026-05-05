import type {
  Skill,
  SkillCreateRequest,
  SkillDeleteResponse,
  SkillMutationResponse,
  SkillResponse,
  SkillsResponse,
  SkillToggleResponse,
  SkillUpdateRequest,
} from "./api-types"

export type SkillApiLike = {
  id: string
  name: string
  description: string
  instructions?: string
  source?: "local" | "imported"
  createdAt: number
  updatedAt: number
}

export type SkillProfileLike = {
  id?: string
  skillsConfig?: {
    enabledSkillIds?: string[]
    allSkillsDisabledByDefault?: boolean
  }
}

export type SkillActionProfileLike = SkillProfileLike & {
  id: string
}

export type SkillActionResult = {
  statusCode: number
  body: unknown
}

export interface SkillActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
}

export interface SkillActionService {
  getSkills(): SkillApiLike[]
  getSkill(id: string): SkillApiLike | undefined
  createSkill(name: string, description: string, instructions: string): SkillApiLike
  updateSkill(
    id: string,
    updates: Partial<Pick<SkillApiLike, "name" | "description" | "instructions">>,
  ): SkillApiLike
  deleteSkill(id: string): boolean
  getCurrentProfile(): SkillActionProfileLike | null | undefined
  enableSkillForCurrentProfile?(skillId: string): SkillActionProfileLike | null | undefined
  toggleProfileSkill(profileId: string, skillId: string, allSkillIds: string[]): SkillActionProfileLike | null | undefined
}

export interface SkillActionOptions {
  service: SkillActionService
  diagnostics: SkillActionDiagnostics
}

export type GitHubSkillIdentifier = {
  owner: string
  repo: string
  path?: string
  ref: string
  refAndPath?: string[]
}

export type RuntimeSkillLike = {
  id: string
  name?: string
  filePath?: string
}

export type RuntimeSkillInstructionsLike = RuntimeSkillLike & {
  instructions?: string
}

export type RuntimeSkillRegistryLike<TSkill extends RuntimeSkillLike> = {
  getSkill: (id: string) => TSkill | undefined
  getSkills: () => TSkill[]
}

export type RuntimeSkillAction = "load" | "execute"

export type RuntimeSkillIdArgs =
  | {
      success: false
      error: string
    }
  | {
      success: true
      skillId: string
    }

export type RuntimeSkillErrorPayload = {
  success: false
  skillId?: string
  error: string
}

export type IgnoredExecuteCommandSkillIdWarning = {
  ignoredInvalidSkillId: string
  warning: string
  guidance: string
  retrySuggestion: string
  availableSkillIds: string[]
}

export const GITHUB_SKILL_MARKDOWN_FILENAMES = ["SKILL.md", "skill.md"] as const
export const GITHUB_SKILL_COLLECTION_DIRS = ["skills", ".claude/skills", ".codex/skills"] as const

export function isGitHubSkillMarkdownFileName(filename: string): boolean {
  return (GITHUB_SKILL_MARKDOWN_FILENAMES as readonly string[]).includes(filename)
}

export function getGitHubSkillCandidateRelativePaths(repo: string): string[] {
  const repoName = repo.trim()
  return [
    ...GITHUB_SKILL_MARKDOWN_FILENAMES,
    ...GITHUB_SKILL_COLLECTION_DIRS.map((dir) => `${dir}/${repoName}/SKILL.md`),
  ]
}

export function validateGitHubSkillRef(ref: string): boolean {
  if (ref.startsWith("-")) {
    return false
  }
  return /^[a-zA-Z0-9._\-/]+$/.test(ref)
}

export function validateGitHubSkillIdentifierPart(
  part: string,
  type: "owner" | "repo",
): boolean {
  void type
  if (!part || part.length === 0 || part.length > 100) {
    return false
  }
  if (part.startsWith("-")) {
    return false
  }
  return /^[a-zA-Z0-9._-]+$/.test(part)
}

export function validateGitHubSkillSubPath(subPath: string): boolean {
  if (!subPath) {
    return true
  }
  if (subPath.startsWith("/") || subPath.startsWith("\\") || /^[a-zA-Z]:[\\/]/.test(subPath)) {
    return false
  }

  const segments = subPath.split(/[/\\]/)
  return segments.every((segment) => segment !== "..")
}

export function parseGitHubSkillIdentifier(input: string): GitHubSkillIdentifier {
  const trimmedInput = input.trim().replace(/\/+$/, "")

  if (trimmedInput.startsWith("https://github.com/") || trimmedInput.startsWith("http://github.com/")) {
    const url = new URL(trimmedInput)
    const parts = url.pathname.split("/").filter(Boolean)

    if (parts.length < 2) {
      throw new Error("Invalid GitHub URL: must include owner and repo")
    }

    const owner = parts[0]
    const repo = parts[1]
    let ref = "main"
    let subPath: string | undefined
    let refAndPath: string[] | undefined

    if (parts.length > 2 && (parts[2] === "tree" || parts[2] === "blob")) {
      if (parts.length > 3) {
        refAndPath = parts.slice(3)
        ref = parts[3]
        if (parts.length > 4) {
          subPath = parts.slice(4).join("/")
        }
      }
    } else if (parts.length > 2) {
      subPath = parts.slice(2).join("/")
    }

    return { owner, repo, path: subPath, ref, refAndPath }
  }

  const parts = trimmedInput.split("/").filter(Boolean)

  if (parts.length < 2) {
    throw new Error("Invalid GitHub identifier: expected 'owner/repo' or 'owner/repo/path'")
  }

  const owner = parts[0]
  const repo = parts[1]
  const subPath = parts.length > 2 ? parts.slice(2).join("/") : undefined

  return { owner, repo, path: subPath, ref: "main" }
}

export function buildIgnoredExecuteCommandSkillIdWarning(
  skillId: string,
  availableSkillIds: string[],
): IgnoredExecuteCommandSkillIdWarning {
  return {
    ignoredInvalidSkillId: skillId,
    warning: `Ignored invalid execute_command.skillId: ${skillId}. Ran the command in the default workspace instead.`,
    guidance: "skillId must be an exact loaded skill id from Available Skills. Omit skillId for normal workspace or repository commands. Never use repo names, file paths, URLs, or GitHub slugs as skillId.",
    retrySuggestion: "Retry the same command without skillId unless you explicitly need to run inside a loaded skill directory.",
    availableSkillIds,
  }
}

export function parseRuntimeSkillIdArg(args: Record<string, unknown>): RuntimeSkillIdArgs {
  if (typeof args.skillId !== "string" || args.skillId.trim() === "") {
    return {
      success: false,
      error: "skillId must be a non-empty string",
    }
  }

  return {
    success: true,
    skillId: args.skillId.trim(),
  }
}

export function buildDisabledRuntimeSkillPayload(
  skillId: string,
  action: RuntimeSkillAction,
): RuntimeSkillErrorPayload {
  const actionText = action === "load" ? "load instructions for" : "run commands inside"
  return {
    success: false,
    skillId,
    error: `Skill '${skillId}' is disabled for this agent. Enable it in Settings > Skills before trying to ${actionText} this skill.`,
  }
}

export function buildRuntimeSkillNotFoundPayload(skillId: string): RuntimeSkillErrorPayload {
  return {
    success: false,
    error: `Skill '${skillId}' not found. Check the Available Skills section in the system prompt for valid skill IDs.`,
  }
}

export function buildRuntimeSkillInstructionsText(skill: RuntimeSkillInstructionsLike): string {
  return `# ${skill.name}\n\n${skill.instructions}`
}

export function uniqueSkillIds(ids: Array<string | undefined>): string[] {
  return Array.from(new Set(ids.map((id) => id?.trim()).filter((id): id is string => Boolean(id))))
}

export function getSkillFolderIdFromFilePath(filePath?: string): string | undefined {
  if (!filePath || filePath.startsWith("github:")) return undefined

  const segments = filePath
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
  const agentsIndex = segments.lastIndexOf(".agents")
  const skillsIndex = agentsIndex >= 0 && segments[agentsIndex + 1] === "skills"
    ? agentsIndex + 1
    : segments.lastIndexOf("skills")

  if (skillsIndex >= 0 && skillsIndex < segments.length - 2) {
    return segments.slice(skillsIndex + 1, -1).join("/")
  }

  return undefined
}

export function getSkillRuntimeIds(skill: RuntimeSkillLike, requestedSkillId?: string): string[] {
  return uniqueSkillIds([
    requestedSkillId,
    skill.id,
    getSkillFolderIdFromFilePath(skill.filePath),
  ])
}

export function resolveRuntimeSkill<TSkill extends RuntimeSkillLike>(
  skillId: string,
  skillsServiceLike: RuntimeSkillRegistryLike<TSkill>,
): TSkill | undefined {
  const trimmedSkillId = skillId.trim()
  if (!trimmedSkillId) return undefined

  const direct = skillsServiceLike.getSkill(trimmedSkillId)
  if (direct) return direct

  const normalizedSkillId = trimmedSkillId.toLowerCase()
  return skillsServiceLike.getSkills().find((skill) => {
    return (typeof skill.name === "string" && skill.name.toLowerCase() === normalizedSkillId)
      || getSkillFolderIdFromFilePath(skill.filePath)?.toLowerCase() === normalizedSkillId
  })
}

export function isSkillEnabledByConfig(
  skillIds: string | string[],
  skillsConfig?: SkillProfileLike["skillsConfig"],
): boolean {
  if (!skillsConfig || !skillsConfig.allSkillsDisabledByDefault) return true
  const ids = Array.isArray(skillIds) ? skillIds : [skillIds]
  return ids.some((id) => (skillsConfig.enabledSkillIds ?? []).includes(id))
}

export function getEnabledSkillIdsForProfile(
  skills: SkillApiLike[],
  profile?: SkillProfileLike | null,
): string[] {
  const skillsConfig = profile?.skillsConfig
  const allEnabledByDefault = !skillsConfig || !skillsConfig.allSkillsDisabledByDefault
  return allEnabledByDefault
    ? skills.map((skill) => skill.id)
    : skillsConfig.enabledSkillIds ?? []
}

export function isSkillEnabledForProfile(skillId: string, profile?: SkillProfileLike | null): boolean {
  const skillsConfig = profile?.skillsConfig
  return !skillsConfig || !skillsConfig.allSkillsDisabledByDefault
    ? true
    : (skillsConfig.enabledSkillIds ?? []).includes(skillId)
}

export function formatSkillForApi(skill: SkillApiLike, enabledForProfile: boolean): Skill {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    instructions: skill.instructions,
    enabled: true,
    enabledForProfile,
    source: skill.source,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
  }
}

export function buildSkillsResponse(
  skills: SkillApiLike[],
  currentProfile?: SkillProfileLike | null,
): SkillsResponse {
  const enabledSkillIds = getEnabledSkillIdsForProfile(skills, currentProfile)

  return {
    skills: skills.map((skill) => formatSkillForApi(skill, enabledSkillIds.includes(skill.id))),
    currentProfileId: currentProfile?.id,
  }
}

export function buildSkillResponse(skill: SkillApiLike, currentProfile?: SkillProfileLike | null): SkillResponse {
  return {
    skill: formatSkillForApi(skill, isSkillEnabledForProfile(skill.id, currentProfile)),
  }
}

export function buildSkillMutationResponse(
  skill: SkillApiLike,
  currentProfile?: SkillProfileLike | null,
): SkillMutationResponse {
  return {
    success: true,
    skill: formatSkillForApi(skill, isSkillEnabledForProfile(skill.id, currentProfile)),
  }
}

export function buildSkillDeleteResponse(skillId: string): SkillDeleteResponse {
  return {
    success: true,
    id: skillId,
  }
}

export function buildSkillToggleResponse(
  skillId: string,
  profile?: SkillProfileLike | null,
): SkillToggleResponse {
  return {
    success: true,
    skillId,
    enabledForProfile: isSkillEnabledForProfile(skillId, profile),
  }
}

function skillActionOk(body: unknown): SkillActionResult {
  return {
    statusCode: 200,
    body,
  }
}

function skillActionError(statusCode: number, message: string): SkillActionResult {
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

function getRequestRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {}
}

function getNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

export type SkillCreateParseResult =
  | { ok: true; request: SkillCreateRequest & { name: string; description: string; instructions: string } }
  | { ok: false; error: string }

export function parseSkillCreateRequestBody(body: unknown): SkillCreateParseResult {
  const record = getRequestRecord(body)
  const name = getNonEmptyString(record.name)
  if (!name) {
    return { ok: false, error: "Skill name is required" }
  }

  return {
    ok: true,
    request: {
      name,
      description: getOptionalString(record.description) ?? "",
      instructions: getOptionalString(record.instructions) ?? "",
    },
  }
}

export type SkillUpdateParseResult =
  | { ok: true; request: SkillUpdateRequest }
  | { ok: false; error: string }

export function parseSkillUpdateRequestBody(body: unknown): SkillUpdateParseResult {
  const record = getRequestRecord(body)
  const request: SkillUpdateRequest = {}

  if ("name" in record) {
    const name = getNonEmptyString(record.name)
    if (!name) {
      return { ok: false, error: "Skill name must be a non-empty string" }
    }
    request.name = name
  }

  if ("description" in record) {
    request.description = getOptionalString(record.description) ?? ""
  }

  if ("instructions" in record) {
    request.instructions = getOptionalString(record.instructions) ?? ""
  }

  if (Object.keys(request).length === 0) {
    return { ok: false, error: "No skill updates provided" }
  }

  return { ok: true, request }
}

export function getSkillsAction(options: SkillActionOptions): SkillActionResult {
  try {
    const skills = options.service.getSkills()
    const currentProfile = options.service.getCurrentProfile()
    return skillActionOk(buildSkillsResponse(skills, currentProfile))
  } catch (caughtError) {
    options.diagnostics.logError("skill-actions", "Failed to get skills", caughtError)
    return skillActionError(500, "Failed to get skills")
  }
}

export function getSkillAction(
  skillId: string | undefined,
  options: SkillActionOptions,
): SkillActionResult {
  try {
    if (!skillId) {
      return skillActionError(400, "Skill id is required")
    }

    const skill = options.service.getSkill(skillId)
    if (!skill) {
      return skillActionError(404, "Skill not found")
    }

    return skillActionOk(buildSkillResponse(skill, options.service.getCurrentProfile()))
  } catch (caughtError) {
    options.diagnostics.logError("skill-actions", "Failed to get skill", caughtError)
    return skillActionError(500, "Failed to get skill")
  }
}

export function createSkillAction(
  body: unknown,
  options: SkillActionOptions,
): SkillActionResult {
  const parsed = parseSkillCreateRequestBody(body)
  if (parsed.ok === false) {
    return skillActionError(400, parsed.error)
  }

  try {
    const skill = options.service.createSkill(
      parsed.request.name,
      parsed.request.description,
      parsed.request.instructions,
    )
    const currentProfile = options.service.enableSkillForCurrentProfile?.(skill.id)
      ?? options.service.getCurrentProfile()
    return skillActionOk(buildSkillMutationResponse(skill, currentProfile))
  } catch (caughtError) {
    options.diagnostics.logError("skill-actions", "Failed to create skill", caughtError)
    return skillActionError(500, getUnknownErrorMessage(caughtError, "Failed to create skill"))
  }
}

export function updateSkillAction(
  skillId: string | undefined,
  body: unknown,
  options: SkillActionOptions,
): SkillActionResult {
  if (!skillId) {
    return skillActionError(400, "Skill id is required")
  }

  const parsed = parseSkillUpdateRequestBody(body)
  if (parsed.ok === false) {
    return skillActionError(400, parsed.error)
  }

  try {
    const existing = options.service.getSkill(skillId)
    if (!existing) {
      return skillActionError(404, "Skill not found")
    }

    const skill = options.service.updateSkill(skillId, parsed.request)
    return skillActionOk(buildSkillMutationResponse(skill, options.service.getCurrentProfile()))
  } catch (caughtError) {
    options.diagnostics.logError("skill-actions", "Failed to update skill", caughtError)
    return skillActionError(500, getUnknownErrorMessage(caughtError, "Failed to update skill"))
  }
}

export function deleteSkillAction(
  skillId: string | undefined,
  options: SkillActionOptions,
): SkillActionResult {
  if (!skillId) {
    return skillActionError(400, "Skill id is required")
  }

  try {
    const success = options.service.deleteSkill(skillId)
    if (!success) {
      return skillActionError(404, "Skill not found")
    }

    return skillActionOk(buildSkillDeleteResponse(skillId))
  } catch (caughtError) {
    options.diagnostics.logError("skill-actions", "Failed to delete skill", caughtError)
    return skillActionError(500, getUnknownErrorMessage(caughtError, "Failed to delete skill"))
  }
}

export function toggleProfileSkillAction(
  skillId: string | undefined,
  options: SkillActionOptions,
): SkillActionResult {
  try {
    const skills = options.service.getSkills()
    const skillExists = skills.some((skill) => skill.id === skillId)
    if (!skillExists) {
      return skillActionError(404, "Skill not found")
    }

    const currentProfile = options.service.getCurrentProfile()
    if (!currentProfile) {
      return skillActionError(400, "No current profile set")
    }

    const allSkillIds = skills.map((skill) => skill.id)
    const updatedProfile = options.service.toggleProfileSkill(currentProfile.id, skillId ?? "", allSkillIds)
    return skillActionOk(buildSkillToggleResponse(skillId ?? "", updatedProfile))
  } catch (caughtError) {
    options.diagnostics.logError("skill-actions", "Failed to toggle skill", caughtError)
    return skillActionError(500, getUnknownErrorMessage(caughtError, "Failed to toggle skill"))
  }
}
