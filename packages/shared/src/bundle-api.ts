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

export type BundleImportConflictStrategy = "skip" | "overwrite" | "rename"

export type PreviewBundleImportRequest = {
  bundleJson: string
}

export type ImportBundleRequest = PreviewBundleImportRequest & {
  conflictStrategy?: BundleImportConflictStrategy
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

export type RequiredBundleComponentSelection = Required<BundleComponentSelection>

export type DetailedBundleItemSelection = Required<BundleItemSelectionOptions>

export type BundleComponentKey = keyof RequiredBundleComponentSelection

export type BundleComponentOption = {
  key: BundleComponentKey
  label: string
}

export type BundleImportConflictStrategyOption = {
  value: BundleImportConflictStrategy
  label: string
  importLabel: string
}

export const DEFAULT_BUNDLE_COMPONENT_SELECTION: RequiredBundleComponentSelection = {
  agentProfiles: true,
  mcpServers: true,
  skills: true,
  repeatTasks: true,
  knowledgeNotes: true,
}

export const DEFAULT_BUNDLE_PUBLISH_COMPONENT_SELECTION: RequiredBundleComponentSelection = {
  agentProfiles: true,
  mcpServers: true,
  skills: true,
  repeatTasks: false,
  knowledgeNotes: false,
}

export const EMPTY_BUNDLE_ITEM_SELECTION: DetailedBundleItemSelection = {
  agentProfileIds: [],
  mcpServerNames: [],
  skillIds: [],
  repeatTaskIds: [],
  knowledgeNoteIds: [],
}

export const BUNDLE_COMPONENT_KEYS: readonly BundleComponentKey[] = [
  "agentProfiles",
  "mcpServers",
  "skills",
  "repeatTasks",
  "knowledgeNotes",
]

export const BUNDLE_COMPONENT_OPTIONS: readonly BundleComponentOption[] = [
  { key: "agentProfiles", label: "Agents" },
  { key: "mcpServers", label: "MCP servers" },
  { key: "skills", label: "Skills" },
  { key: "repeatTasks", label: "Tasks" },
  { key: "knowledgeNotes", label: "Knowledge" },
]

export const BUNDLE_IMPORT_CONFLICT_STRATEGY_OPTIONS: readonly BundleImportConflictStrategyOption[] = [
  { value: "skip", label: "Skip", importLabel: "Skip existing items" },
  { value: "rename", label: "Rename", importLabel: "Rename imported items" },
  { value: "overwrite", label: "Overwrite", importLabel: "Overwrite existing items" },
]

export function resolveBundleComponentSelection(components?: BundleComponentSelection): RequiredBundleComponentSelection {
  return { ...DEFAULT_BUNDLE_COMPONENT_SELECTION, ...components }
}

export function getAvailableBundleComponentSelection(
  components: BundleComponentSelection,
  availableComponents?: BundleComponentSelection,
): RequiredBundleComponentSelection {
  const resolved = resolveBundleComponentSelection(components)
  const availableSelection = { ...DEFAULT_BUNDLE_COMPONENT_SELECTION }

  for (const key of BUNDLE_COMPONENT_KEYS) {
    availableSelection[key] = (availableComponents?.[key] ?? true) ? resolved[key] : false
  }

  return availableSelection
}

export function createBundleItemSelection(items: ExportableBundleItems): DetailedBundleItemSelection {
  return {
    agentProfileIds: items.agentProfiles.map((item) => item.id),
    mcpServerNames: items.mcpServers.map((item) => item.name),
    skillIds: items.skills.map((item) => item.id),
    repeatTaskIds: items.repeatTasks.map((item) => item.id),
    knowledgeNoteIds: items.knowledgeNotes.map((item) => item.id),
  }
}

export function hasSelectedBundleComponent(components: BundleComponentSelection): boolean {
  return BUNDLE_COMPONENT_KEYS.some((key) => components[key] === true)
}

export function getBundleDependencyWarnings(
  items: ExportableBundleItems | undefined,
  components: BundleComponentSelection,
  selection: BundleItemSelectionOptions,
): string[] {
  if (!items || !components.agentProfiles) return []

  const selectedAgentIds = new Set(selection.agentProfileIds ?? [])
  const selectedSkillIds = components.skills ? new Set(selection.skillIds ?? []) : new Set<string>()
  const selectedMcpServerNames = components.mcpServers ? new Set(selection.mcpServerNames ?? []) : new Set<string>()
  const skillNameById = new Map(items.skills.map((skill) => [skill.id, skill.name]))

  return items.agentProfiles.flatMap((agent) => {
    if (!selectedAgentIds.has(agent.id)) return []

    const agentLabel = agent.displayName || agent.name
    const warnings: string[] = []

    for (const serverName of agent.referencedMcpServerNames) {
      if (!selectedMcpServerNames.has(serverName)) {
        warnings.push(`${agentLabel} references MCP server "${serverName}", but it is not included.`)
      }
    }

    for (const skillId of agent.referencedSkillIds) {
      if (!selectedSkillIds.has(skillId)) {
        warnings.push(`${agentLabel} references skill "${skillNameById.get(skillId) || skillId}", but it is not included.`)
      }
    }

    return warnings
  })
}

export function resolveBundleExportLayerDirs(
  globalAgentsFolder: string,
  workspaceAgentsFolder?: string | null,
): string[] {
  return workspaceAgentsFolder
    ? [globalAgentsFolder, workspaceAgentsFolder]
    : [globalAgentsFolder]
}

export function resolveBundleImportTargetDir(
  globalAgentsFolder: string,
  workspaceAgentsFolder?: string | null,
): string {
  return workspaceAgentsFolder ?? globalAgentsFolder
}

export interface TemporaryBundleFileNameOptions {
  now?: () => number
  createUniqueId?: () => string
}

export function createTemporaryBundleFileName(options: TemporaryBundleFileNameOptions = {}): string {
  const now = options.now ?? Date.now
  const createUniqueId = options.createUniqueId ?? (() => Math.random().toString(36).slice(2, 11))
  return `${now()}-${createUniqueId()}.dotagents`
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

export type BundleImportPreviewConflict = {
  id: string
  name: string
  existingName?: string
}

export type BundleImportPreviewConflicts = {
  agentProfiles: BundleImportPreviewConflict[]
  mcpServers: BundleImportPreviewConflict[]
  skills: BundleImportPreviewConflict[]
  repeatTasks: BundleImportPreviewConflict[]
  knowledgeNotes: BundleImportPreviewConflict[]
}

export type BundleImportPreview = {
  bundle: DotAgentsBundle
  conflicts: BundleImportPreviewConflicts
}

export type BundleImportPreviewResponse = {
  success: true
  preview: BundleImportPreview
}

export type BundleImportItemResult = {
  id: string
  name: string
  action: "imported" | "skipped" | "renamed" | "overwritten"
  newId?: string
  error?: string
}

export type BundleImportResult = {
  success: boolean
  agentProfiles: BundleImportItemResult[]
  mcpServers: BundleImportItemResult[]
  skills: BundleImportItemResult[]
  repeatTasks: BundleImportItemResult[]
  knowledgeNotes: BundleImportItemResult[]
  errors: string[]
}

export function hasBundleImportConflicts(
  conflicts: BundleImportPreviewConflicts | undefined,
  components: BundleComponentSelection,
): boolean {
  if (!conflicts) return false
  const resolved = resolveBundleComponentSelection(components)
  return BUNDLE_COMPONENT_KEYS.some((key) => resolved[key] && conflicts[key].length > 0)
}

export function getBundleImportChangedItemCount(result: BundleImportResult): number {
  return BUNDLE_COMPONENT_KEYS
    .map((key) => result[key].filter((item) => item.action !== "skipped").length)
    .reduce((total, count) => total + count, 0)
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
  previewBundleImport(request: PreviewBundleImportRequest): Promise<BundleImportPreview | null>
  importBundle(request: ImportBundleRequest): Promise<BundleImportResult>
}

export type BundleTemporaryFilePreviewResult = {
  success: boolean
  bundle?: DotAgentsBundle
  conflicts?: BundleImportPreviewConflicts
}

export interface BundleTemporaryFileStore {
  writeTemporaryBundleFile(bundleJson: string): string | Promise<string>
  deleteTemporaryBundleFile(filePath: string): void | Promise<void>
}

export interface BundleTemporaryFileImportService {
  getImportTargetDir(): string
  previewBundleFile(filePath: string, targetDir: string): BundleTemporaryFilePreviewResult | Promise<BundleTemporaryFilePreviewResult>
  importBundleFile(
    filePath: string,
    targetDir: string,
    options: {
      conflictStrategy: BundleImportConflictStrategy
      components?: BundleComponentSelection
    },
  ): BundleImportResult | Promise<BundleImportResult>
}

export interface BundleTemporaryFileImportOptions {
  temporaryFiles: BundleTemporaryFileStore
  service: BundleTemporaryFileImportService
}

export interface BundleActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
}

export interface BundleActionOptions {
  service: BundleActionService
  diagnostics: BundleActionDiagnostics
}

export interface BundleRouteActions {
  getBundleExportableItems(): BundleActionResult
  exportBundle(body: unknown): Promise<BundleActionResult>
  previewBundleImport(body: unknown): Promise<BundleActionResult>
  importBundle(body: unknown): Promise<BundleActionResult>
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

function parseRequiredString(value: unknown, field: string): BundleRequestParseResult<string> {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, statusCode: 400, error: `${field} must be a non-empty string` }
  }
  return { ok: true, request: value.trim() }
}

function parseComponents(value: unknown): BundleRequestParseResult<BundleComponentSelection | undefined> {
  if (value === undefined) return { ok: true, request: undefined }
  const input = getRequestRecord(value)
  if (Object.keys(input).length === 0 && value !== undefined) {
    return { ok: false, statusCode: 400, error: "components must be an object" }
  }

  const components: BundleComponentSelection = {}
  for (const key of BUNDLE_COMPONENT_KEYS) {
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

export function parsePreviewBundleImportRequestBody(body: unknown): BundleRequestParseResult<PreviewBundleImportRequest> {
  const input = getRequestRecord(body)
  const bundleJson = parseRequiredString(input.bundleJson, "bundleJson")
  if (isBundleRequestParseError(bundleJson)) return bundleJson

  try {
    JSON.parse(bundleJson.request)
  } catch {
    return { ok: false, statusCode: 400, error: "bundleJson must be valid JSON" }
  }

  return { ok: true, request: { bundleJson: bundleJson.request } }
}

export function parseImportBundleRequestBody(body: unknown): BundleRequestParseResult<ImportBundleRequest> {
  const parsedPreview = parsePreviewBundleImportRequestBody(body)
  if (isBundleRequestParseError(parsedPreview)) return parsedPreview

  const input = getRequestRecord(body)
  const request: ImportBundleRequest = {
    bundleJson: parsedPreview.request.bundleJson,
  }

  const conflictStrategy = input.conflictStrategy ?? "skip"
  if (
    conflictStrategy !== "skip"
    && conflictStrategy !== "overwrite"
    && conflictStrategy !== "rename"
  ) {
    return { ok: false, statusCode: 400, error: "conflictStrategy must be skip, overwrite, or rename" }
  }
  request.conflictStrategy = conflictStrategy

  const components = parseComponents(input.components)
  if (isBundleRequestParseError(components)) return components
  if (components.request) request.components = components.request

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

export function buildBundleImportPreviewResponse(
  preview: BundleImportPreview,
): BundleImportPreviewResponse {
  return {
    success: true,
    preview,
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

export async function previewBundleImportAction(
  body: unknown,
  options: BundleActionOptions,
): Promise<BundleActionResult> {
  const parsed = parsePreviewBundleImportRequestBody(body)
  if (isBundleRequestParseError(parsed)) {
    return bundleActionError(parsed.statusCode, parsed.error)
  }

  try {
    const preview = await options.service.previewBundleImport(parsed.request)
    if (!preview) {
      return bundleActionError(400, "Failed to parse bundle")
    }
    return bundleActionOk(buildBundleImportPreviewResponse(preview))
  } catch (caughtError) {
    options.diagnostics.logError("bundle-actions", "Failed to preview bundle import", caughtError)
    return bundleActionError(500, getUnknownErrorMessage(caughtError, "Failed to preview bundle import"))
  }
}

export async function importBundleAction(
  body: unknown,
  options: BundleActionOptions,
): Promise<BundleActionResult> {
  const parsed = parseImportBundleRequestBody(body)
  if (isBundleRequestParseError(parsed)) {
    return bundleActionError(parsed.statusCode, parsed.error)
  }

  try {
    return bundleActionOk(await options.service.importBundle(parsed.request))
  } catch (caughtError) {
    options.diagnostics.logError("bundle-actions", "Failed to import bundle", caughtError)
    return bundleActionError(500, getUnknownErrorMessage(caughtError, "Failed to import bundle"))
  }
}

async function withTemporaryBundleFile<T>(
  bundleJson: string,
  options: BundleTemporaryFileImportOptions,
  run: (filePath: string) => T | Promise<T>,
): Promise<T> {
  const filePath = await options.temporaryFiles.writeTemporaryBundleFile(bundleJson)

  try {
    return await run(filePath)
  } finally {
    try {
      await options.temporaryFiles.deleteTemporaryBundleFile(filePath)
    } catch {
      // Temporary bundle-file cleanup should not hide the route operation result.
    }
  }
}

export async function previewBundleImportFromTemporaryFile(
  request: PreviewBundleImportRequest,
  options: BundleTemporaryFileImportOptions,
): Promise<BundleImportPreview | null> {
  return withTemporaryBundleFile(request.bundleJson, options, async (filePath) => {
    const preview = await options.service.previewBundleFile(filePath, options.service.getImportTargetDir())
    if (!preview.success || !preview.bundle || !preview.conflicts) return null
    return {
      bundle: preview.bundle,
      conflicts: preview.conflicts,
    }
  })
}

export async function importBundleFromTemporaryFile(
  request: ImportBundleRequest,
  options: BundleTemporaryFileImportOptions,
): Promise<BundleImportResult> {
  return withTemporaryBundleFile(request.bundleJson, options, (filePath) =>
    options.service.importBundleFile(filePath, options.service.getImportTargetDir(), {
      conflictStrategy: request.conflictStrategy ?? "skip",
      components: request.components,
    }),
  )
}

export function createTemporaryBundleFileImportService(
  options: BundleTemporaryFileImportOptions,
): Pick<BundleActionService, "previewBundleImport" | "importBundle"> {
  return {
    previewBundleImport: (request) => previewBundleImportFromTemporaryFile(request, options),
    importBundle: (request) => importBundleFromTemporaryFile(request, options),
  }
}

export function createBundleRouteActions(options: BundleActionOptions): BundleRouteActions {
  return {
    getBundleExportableItems: () => getBundleExportableItemsAction(options),
    exportBundle: (body) => exportBundleAction(body, options),
    previewBundleImport: (body) => previewBundleImportAction(body, options),
    importBundle: (body) => importBundleAction(body, options),
  }
}
