export type BundleComponentSelection = {
  agentProfiles?: boolean
  mcpServers?: boolean
  skills?: boolean
  repeatTasks?: boolean
  knowledgeNotes?: boolean
}

export type BundleItemSelectionOptions = {
  agentProfileIds?: string[]
  mcpServerNames?: string[]
  skillIds?: string[]
  repeatTaskIds?: string[]
  knowledgeNoteIds?: string[]
}

export type BundlePublicMetadataAuthor = {
  displayName: string
  handle?: string
  url?: string
}

export type BundlePublicMetadataCompatibility = {
  minDesktopVersion?: string
  notes?: string[]
}

export type BundlePublicMetadata = {
  summary: string
  author: BundlePublicMetadataAuthor
  tags: string[]
  compatibility?: BundlePublicMetadataCompatibility
}

export type ExportBundleRequest = BundleItemSelectionOptions & {
  name?: string
  description?: string
  publicMetadata?: BundlePublicMetadata
  components?: BundleComponentSelection
}

export type BundleManifest = {
  version: 1
  name: string
  description?: string
  createdAt: string
  exportedFrom: string
  publicMetadata?: BundlePublicMetadata
  components: {
    agentProfiles: number
    mcpServers: number
    skills: number
    repeatTasks: number
    knowledgeNotes: number
  }
}

export type BundleAgentProfile = {
  id: string
  name: string
  displayName?: string
  description?: string
  enabled: boolean
  role?: string
  systemPrompt?: string
  guidelines?: string
  connection: {
    type: string
    command?: string
    args?: string[]
    cwd?: string
    baseUrl?: string
  }
}

export type BundleMcpServer = {
  name: string
  command?: string
  args?: string[]
  transport?: string
  enabled?: boolean
}

export type BundleSkill = {
  id: string
  name: string
  description?: string
  instructions?: string
  source?: string
}

export type BundleRepeatTask = {
  id: string
  name: string
  prompt: string
  intervalMinutes: number
  enabled: boolean
  runOnStartup?: boolean
  speakOnTrigger?: boolean
  continueInSession?: boolean
  runContinuously?: boolean
  schedule?: unknown
}

export type BundleKnowledgeNote = {
  id: string
  title: string
  context: string
  body: string
  summary?: string
  tags: string[]
  references?: string[]
  createdAt?: number
  updatedAt: number
  group?: string
  series?: string
  entryType?: string
}

export type DotAgentsBundle = {
  manifest: BundleManifest
  agentProfiles: BundleAgentProfile[]
  mcpServers: BundleMcpServer[]
  skills: BundleSkill[]
  repeatTasks: BundleRepeatTask[]
  knowledgeNotes: BundleKnowledgeNote[]
}

export type ExportableBundleAgentProfile = {
  id: string
  name: string
  displayName?: string
  enabled: boolean
  role?: string
  referencedMcpServerNames: string[]
  referencedSkillIds: string[]
}

export type ExportableBundleMcpServer = {
  name: string
  transport?: string
  enabled?: boolean
}

export type ExportableBundleSkill = {
  id: string
  name: string
  description?: string
}

export type ExportableBundleRepeatTask = {
  id: string
  name: string
  intervalMinutes: number
  enabled: boolean
}

export type ExportableBundleKnowledgeNote = {
  id: string
  title: string
  context: string
  summary?: string
}

export type ExportableBundleItems = {
  agentProfiles: ExportableBundleAgentProfile[]
  mcpServers: ExportableBundleMcpServer[]
  skills: ExportableBundleSkill[]
  repeatTasks: ExportableBundleRepeatTask[]
  knowledgeNotes: ExportableBundleKnowledgeNote[]
}

export type BundleExportableItemsResponse = {
  success: true
  items: ExportableBundleItems
}

export type BundleExportResponse = {
  success: true
  bundle: DotAgentsBundle
  bundleJson: string
}

export type BundleActionResult = {
  statusCode: number
  body: unknown
}

export type BundleRequestParseError = { ok: false; statusCode: 400; error: string }

export type BundleRequestParseResult<T> =
  | { ok: true; request: T }
  | BundleRequestParseError

export interface BundleActionService {
  getExportableItems(): ExportableBundleItems
  exportBundle(request: ExportBundleRequest): Promise<DotAgentsBundle>
}

export interface BundleActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
}

export interface BundleActionOptions {
  service: BundleActionService
  diagnostics: BundleActionDiagnostics
}

function bundleActionOk(body: unknown): BundleActionResult {
  return {
    statusCode: 200,
    body,
  }
}

function bundleActionError(statusCode: number, message: string): BundleActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

function getRequestRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {}
}

function isBundleRequestParseError<T>(result: BundleRequestParseResult<T>): result is BundleRequestParseError {
  return !result.ok
}

function parseOptionalString(value: unknown, field: string): BundleRequestParseResult<string | undefined> {
  if (value === undefined) return { ok: true, request: undefined }
  if (typeof value !== "string") {
    return { ok: false, statusCode: 400, error: `${field} must be a string` }
  }
  const trimmed = value.trim()
  return { ok: true, request: trimmed || undefined }
}

function parseOptionalStringArray(value: unknown, field: string): BundleRequestParseResult<string[] | undefined> {
  if (value === undefined) return { ok: true, request: undefined }
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    return { ok: false, statusCode: 400, error: `${field} must be an array of strings` }
  }
  return {
    ok: true,
    request: value.map((entry) => entry.trim()).filter(Boolean),
  }
}

function parseComponents(value: unknown): BundleRequestParseResult<BundleComponentSelection | undefined> {
  if (value === undefined) return { ok: true, request: undefined }
  const input = getRequestRecord(value)
  if (Object.keys(input).length === 0 && value !== undefined) {
    return { ok: false, statusCode: 400, error: "components must be an object" }
  }

  const components: BundleComponentSelection = {}
  for (const key of ["agentProfiles", "mcpServers", "skills", "repeatTasks", "knowledgeNotes"] as const) {
    const componentValue = input[key]
    if (componentValue !== undefined) {
      if (typeof componentValue !== "boolean") {
        return { ok: false, statusCode: 400, error: `components.${key} must be a boolean` }
      }
      components[key] = componentValue
    }
  }

  return {
    ok: true,
    request: Object.keys(components).length > 0 ? components : undefined,
  }
}

function parsePublicMetadata(value: unknown): BundleRequestParseResult<BundlePublicMetadata | undefined> {
  if (value === undefined) return { ok: true, request: undefined }

  const input = getRequestRecord(value)
  const author = getRequestRecord(input.author)
  if (
    typeof input.summary !== "string"
    || typeof author.displayName !== "string"
    || !Array.isArray(input.tags)
    || !input.tags.every((tag) => typeof tag === "string")
  ) {
    return { ok: false, statusCode: 400, error: "publicMetadata is invalid" }
  }

  const compatibilityInput = input.compatibility === undefined ? undefined : getRequestRecord(input.compatibility)
  const compatibilityNotes = compatibilityInput?.notes === undefined
    ? undefined
    : Array.isArray(compatibilityInput.notes) && compatibilityInput.notes.every((note) => typeof note === "string")
      ? compatibilityInput.notes.map((note) => note.trim()).filter(Boolean)
      : null
  if (compatibilityNotes === null) {
    return { ok: false, statusCode: 400, error: "publicMetadata.compatibility.notes must be an array of strings" }
  }

  return {
    ok: true,
    request: {
      summary: input.summary.trim(),
      author: {
        displayName: author.displayName.trim(),
        ...(typeof author.handle === "string" && author.handle.trim() ? { handle: author.handle.trim() } : {}),
        ...(typeof author.url === "string" && author.url.trim() ? { url: author.url.trim() } : {}),
      },
      tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
      ...(compatibilityInput ? {
        compatibility: {
          ...(typeof compatibilityInput.minDesktopVersion === "string" && compatibilityInput.minDesktopVersion.trim()
            ? { minDesktopVersion: compatibilityInput.minDesktopVersion.trim() }
            : {}),
          ...(compatibilityNotes ? { notes: compatibilityNotes } : {}),
        },
      } : {}),
    },
  }
}

export function parseExportBundleRequestBody(body: unknown): BundleRequestParseResult<ExportBundleRequest> {
  const input = getRequestRecord(body)
  const request: ExportBundleRequest = {}

  const name = parseOptionalString(input.name, "name")
  if (isBundleRequestParseError(name)) return name
  if (name.request) request.name = name.request

  const description = parseOptionalString(input.description, "description")
  if (isBundleRequestParseError(description)) return description
  if (description.request) request.description = description.request

  const agentProfileIds = parseOptionalStringArray(input.agentProfileIds, "agentProfileIds")
  if (isBundleRequestParseError(agentProfileIds)) return agentProfileIds
  if (agentProfileIds.request) request.agentProfileIds = agentProfileIds.request

  const mcpServerNames = parseOptionalStringArray(input.mcpServerNames, "mcpServerNames")
  if (isBundleRequestParseError(mcpServerNames)) return mcpServerNames
  if (mcpServerNames.request) request.mcpServerNames = mcpServerNames.request

  const skillIds = parseOptionalStringArray(input.skillIds, "skillIds")
  if (isBundleRequestParseError(skillIds)) return skillIds
  if (skillIds.request) request.skillIds = skillIds.request

  const repeatTaskIds = parseOptionalStringArray(input.repeatTaskIds, "repeatTaskIds")
  if (isBundleRequestParseError(repeatTaskIds)) return repeatTaskIds
  if (repeatTaskIds.request) request.repeatTaskIds = repeatTaskIds.request

  const knowledgeNoteIds = parseOptionalStringArray(input.knowledgeNoteIds, "knowledgeNoteIds")
  if (isBundleRequestParseError(knowledgeNoteIds)) return knowledgeNoteIds
  if (knowledgeNoteIds.request) request.knowledgeNoteIds = knowledgeNoteIds.request

  const components = parseComponents(input.components)
  if (isBundleRequestParseError(components)) return components
  if (components.request) request.components = components.request

  const publicMetadata = parsePublicMetadata(input.publicMetadata)
  if (isBundleRequestParseError(publicMetadata)) return publicMetadata
  if (publicMetadata.request) request.publicMetadata = publicMetadata.request

  return { ok: true, request }
}

export function buildBundleExportableItemsResponse(
  items: ExportableBundleItems,
): BundleExportableItemsResponse {
  return {
    success: true,
    items,
  }
}

export function buildBundleExportResponse(bundle: DotAgentsBundle): BundleExportResponse {
  return {
    success: true,
    bundle,
    bundleJson: JSON.stringify(bundle, null, 2),
  }
}

function getUnknownErrorMessage(caughtError: unknown, fallback: string): string {
  return caughtError instanceof Error ? caughtError.message : fallback
}

export function getBundleExportableItemsAction(options: BundleActionOptions): BundleActionResult {
  try {
    return bundleActionOk(buildBundleExportableItemsResponse(options.service.getExportableItems()))
  } catch (caughtError) {
    options.diagnostics.logError("bundle-actions", "Failed to get bundle exportable items", caughtError)
    return bundleActionError(500, getUnknownErrorMessage(caughtError, "Failed to get bundle exportable items"))
  }
}

export async function exportBundleAction(
  body: unknown,
  options: BundleActionOptions,
): Promise<BundleActionResult> {
  const parsed = parseExportBundleRequestBody(body)
  if (isBundleRequestParseError(parsed)) {
    return bundleActionError(parsed.statusCode, parsed.error)
  }

  try {
    return bundleActionOk(buildBundleExportResponse(await options.service.exportBundle(parsed.request)))
  } catch (caughtError) {
    options.diagnostics.logError("bundle-actions", "Failed to export bundle", caughtError)
    return bundleActionError(500, getUnknownErrorMessage(caughtError, "Failed to export bundle"))
  }
}
