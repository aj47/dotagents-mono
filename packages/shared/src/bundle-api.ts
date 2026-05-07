import {
  isAgentProfileConnectionTypeValue,
  type AgentProfileConnectionTypeValue,
} from "./agent-profile-connection"
import type { AgentProfile } from "./agent-profile-domain"
import { isAgentProfileRole, type AgentProfileRole } from "./agent-profile-role"
import type { KnowledgeNote, KnowledgeNoteContext, KnowledgeNoteEntryType } from "./knowledge-note-domain"
import type { RepeatTaskSchedule } from "./repeat-task-utils"
import type { AgentSkill, LoopConfig } from "./types"

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

export type BundleImportItemAction = "imported" | "skipped" | "overwritten" | "renamed"

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
  role?: AgentProfileRole
  systemPrompt?: string
  guidelines?: string
  connection: {
    type: AgentProfileConnectionTypeValue
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
  schedule?: RepeatTaskSchedule
}

export type BundleKnowledgeNote = {
  id: string
  title: string
  context: KnowledgeNoteContext
  body: string
  summary?: string
  tags: string[]
  references?: string[]
  createdAt?: number
  updatedAt: number
  group?: string
  series?: string
  entryType?: KnowledgeNoteEntryType
}

export type DotAgentsBundle = {
  manifest: BundleManifest
  agentProfiles: BundleAgentProfile[]
  mcpServers: BundleMcpServer[]
  skills: BundleSkill[]
  repeatTasks: BundleRepeatTask[]
  knowledgeNotes: BundleKnowledgeNote[]
}

export const SUPPORTED_BUNDLE_FILE_EXTENSIONS = [".dotagents", ".json"] as const
export const HUB_BUNDLE_FILE_EXTENSION = ".dotagents"

const BUNDLE_SECRET_PATTERNS = [
  /key/i,
  /token/i,
  /secret/i,
  /password/i,
  /credential/i,
  /auth/i,
  /bearer/i,
]

const BUNDLE_TOP_LEVEL_MCP_CONFIG_KEYS = [
  "mcpDisabledTools",
  "mcpRuntimeDisabledServers",
  "mcpToolsCollapsedServers",
  "mcpServersCollapsedServers",
] as const

const BUNDLE_MCP_SERVER_CONFIG_KEYS = [
  "transport",
  "command",
  "args",
  "env",
  "url",
  "headers",
  "oauth",
  "timeout",
  "disabled",
] as const

export type BundleManifestInputComponents = Omit<BundleManifest["components"], "repeatTasks" | "knowledgeNotes"> & {
  repeatTasks?: number
  knowledgeNotes?: number
}

export type ParsedDotAgentsBundle = Omit<DotAgentsBundle, "manifest" | "repeatTasks" | "knowledgeNotes"> & {
  manifest: Omit<BundleManifest, "components"> & {
    components: BundleManifestInputComponents
  }
  repeatTasks?: BundleRepeatTask[]
  knowledgeNotes?: BundleKnowledgeNote[]
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string"
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function isBundlePublicMetadataAuthor(value: unknown): value is BundlePublicMetadataAuthor {
  if (!isRecordObject(value)) return false
  if (!isNonEmptyString(value.displayName)) return false
  if (!isOptionalString(value.handle)) return false
  return isOptionalString(value.url)
}

function isBundlePublicMetadataCompatibility(value: unknown): value is BundlePublicMetadataCompatibility {
  if (!isRecordObject(value)) return false
  if (!isOptionalString(value.minDesktopVersion)) return false
  return value.notes === undefined || isStringArray(value.notes)
}

function isBundlePublicMetadata(value: unknown): value is BundlePublicMetadata {
  if (!isRecordObject(value)) return false
  if (!isNonEmptyString(value.summary)) return false
  if (!isBundlePublicMetadataAuthor(value.author)) return false
  if (!isStringArray(value.tags)) return false
  return value.compatibility === undefined || isBundlePublicMetadataCompatibility(value.compatibility)
}

function isBundleAgentProfile(value: unknown): value is BundleAgentProfile {
  if (!isRecordObject(value)) return false
  if (!isNonEmptyString(value.id)) return false
  if (!isNonEmptyString(value.name)) return false
  if (typeof value.enabled !== "boolean") return false
  if (!isOptionalString(value.displayName)) return false
  if (!isOptionalString(value.description)) return false
  if (value.role !== undefined && !isAgentProfileRole(value.role)) return false
  if (!isOptionalString(value.systemPrompt)) return false
  if (!isOptionalString(value.guidelines)) return false
  if (!isRecordObject(value.connection)) return false
  if (!isAgentProfileConnectionTypeValue(value.connection.type)) return false
  if (!isOptionalString(value.connection.command)) return false
  if (value.connection.args !== undefined && !isStringArray(value.connection.args)) return false
  if (!isOptionalString(value.connection.cwd)) return false
  if (!isOptionalString(value.connection.baseUrl)) return false
  return true
}

function isBundleMcpServer(value: unknown): value is BundleMcpServer {
  if (!isRecordObject(value)) return false
  if (!isNonEmptyString(value.name)) return false
  if (!isOptionalString(value.command)) return false
  if (!isOptionalString(value.transport)) return false
  if (value.args !== undefined && !isStringArray(value.args)) return false
  if (value.enabled !== undefined && typeof value.enabled !== "boolean") return false
  return true
}

function isBundleSkill(value: unknown): value is BundleSkill {
  if (!isRecordObject(value)) return false
  if (!isNonEmptyString(value.id)) return false
  if (!isNonEmptyString(value.name)) return false
  if (!isOptionalString(value.description)) return false
  return isOptionalString(value.instructions)
}

function isBundleRepeatTaskSchedule(value: unknown): boolean {
  if (value === undefined) return true
  if (!isRecordObject(value)) return false
  if (value.type !== "daily" && value.type !== "weekly") return false
  if (!Array.isArray(value.times) || value.times.length === 0) return false
  if (!value.times.every((time) => typeof time === "string")) return false
  if (value.type === "weekly") {
    if (!Array.isArray(value.daysOfWeek) || value.daysOfWeek.length === 0) return false
    if (!value.daysOfWeek.every((day) => typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6)) {
      return false
    }
  }
  return true
}

function isBundleRepeatTask(value: unknown): value is BundleRepeatTask {
  if (!isRecordObject(value)) return false
  if (!isNonEmptyString(value.id)) return false
  if (!isNonEmptyString(value.name)) return false
  if (typeof value.prompt !== "string") return false
  if (!isNonNegativeFiniteNumber(value.intervalMinutes)) return false
  if (typeof value.enabled !== "boolean") return false
  if (value.runOnStartup !== undefined && typeof value.runOnStartup !== "boolean") return false
  if (value.speakOnTrigger !== undefined && typeof value.speakOnTrigger !== "boolean") return false
  if (value.continueInSession !== undefined && typeof value.continueInSession !== "boolean") return false
  if (value.runContinuously !== undefined && typeof value.runContinuously !== "boolean") return false
  return isBundleRepeatTaskSchedule(value.schedule)
}

function isBundleKnowledgeNote(value: unknown): value is BundleKnowledgeNote {
  if (!isRecordObject(value)) return false
  if (!isNonEmptyString(value.id)) return false
  if (!isNonEmptyString(value.title)) return false
  if (!["auto", "search-only"].includes(String(value.context))) return false
  if (typeof value.body !== "string") return false
  if (!isStringArray(value.tags)) return false
  if (value.summary !== undefined && typeof value.summary !== "string") return false
  if (value.references !== undefined && !isStringArray(value.references)) return false
  if (value.group !== undefined && typeof value.group !== "string") return false
  if (value.series !== undefined && typeof value.series !== "string") return false
  if (value.entryType !== undefined && !["note", "entry", "overview"].includes(String(value.entryType))) return false
  if (value.createdAt !== undefined && !isNonNegativeFiniteNumber(value.createdAt)) return false
  return isNonNegativeFiniteNumber(value.updatedAt)
}

function hasValidManifestComponents(value: unknown): value is BundleManifestInputComponents {
  if (!isRecordObject(value)) return false
  if (!isNonNegativeFiniteNumber(value.agentProfiles)) return false
  if (!isNonNegativeFiniteNumber(value.mcpServers)) return false
  if (!isNonNegativeFiniteNumber(value.skills)) return false
  if (value.repeatTasks !== undefined && !isNonNegativeFiniteNumber(value.repeatTasks)) return false
  if (value.knowledgeNotes !== undefined && !isNonNegativeFiniteNumber(value.knowledgeNotes)) return false
  return true
}

function normalizeDotAgentsBundleRepeatTask(task: BundleRepeatTask): BundleRepeatTask {
  const normalized = { ...task }
  if (normalized.runContinuously === true) {
    delete normalized.schedule
  }
  return normalized
}

export function validateDotAgentsBundle(bundle: unknown): bundle is ParsedDotAgentsBundle {
  if (!isRecordObject(bundle)) return false
  if (!isRecordObject(bundle.manifest)) return false
  const manifest = bundle.manifest
  if (manifest.version !== 1) return false
  if (!isNonEmptyString(manifest.name)) return false
  if (!isOptionalString(manifest.description)) return false
  if (typeof manifest.createdAt !== "string" || Number.isNaN(Date.parse(manifest.createdAt))) return false
  if (!isNonEmptyString(manifest.exportedFrom)) return false
  if (manifest.publicMetadata !== undefined && !isBundlePublicMetadata(manifest.publicMetadata)) return false
  if (!hasValidManifestComponents(manifest.components)) return false
  if (!Array.isArray(bundle.agentProfiles) || !bundle.agentProfiles.every(isBundleAgentProfile)) return false
  if (!Array.isArray(bundle.mcpServers) || !bundle.mcpServers.every(isBundleMcpServer)) return false
  if (!Array.isArray(bundle.skills) || !bundle.skills.every(isBundleSkill)) return false
  if ("repeatTasks" in bundle && bundle.repeatTasks !== undefined) {
    if (!Array.isArray(bundle.repeatTasks) || !bundle.repeatTasks.every(isBundleRepeatTask)) return false
  }
  if ("knowledgeNotes" in bundle && bundle.knowledgeNotes !== undefined) {
    if (!Array.isArray(bundle.knowledgeNotes) || !bundle.knowledgeNotes.every(isBundleKnowledgeNote)) return false
  }
  return true
}

export function normalizeDotAgentsBundle(bundle: ParsedDotAgentsBundle): DotAgentsBundle {
  const repeatTasks = Array.isArray(bundle.repeatTasks)
    ? bundle.repeatTasks.map(normalizeDotAgentsBundleRepeatTask)
    : []
  const knowledgeNotes = Array.isArray(bundle.knowledgeNotes) ? bundle.knowledgeNotes : []
  const rawComponents = isRecordObject(bundle.manifest.components)
    ? bundle.manifest.components as Record<string, unknown>
    : {}
  const countOrFallback = (value: unknown, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback

  return {
    ...bundle,
    manifest: {
      ...bundle.manifest,
      components: {
        agentProfiles: countOrFallback(rawComponents.agentProfiles, bundle.agentProfiles.length),
        mcpServers: countOrFallback(rawComponents.mcpServers, bundle.mcpServers.length),
        skills: countOrFallback(rawComponents.skills, bundle.skills.length),
        repeatTasks: countOrFallback(rawComponents.repeatTasks, repeatTasks.length),
        knowledgeNotes: countOrFallback(rawComponents.knowledgeNotes, knowledgeNotes.length),
      },
    },
    repeatTasks,
    knowledgeNotes,
  }
}

export function parseDotAgentsBundle(bundle: unknown): DotAgentsBundle | null {
  return validateDotAgentsBundle(bundle) ? normalizeDotAgentsBundle(bundle) : null
}

export function parseDotAgentsBundleJson(bundleJson: string): DotAgentsBundle | null {
  try {
    return parseDotAgentsBundle(JSON.parse(bundleJson) as unknown)
  } catch {
    return null
  }
}

export function getBundleFileExtension(filePath: string): string {
  const candidate = filePath.trim().split(/[?#]/, 1)[0] ?? ""
  const slashIndex = Math.max(candidate.lastIndexOf("/"), candidate.lastIndexOf("\\"))
  const fileName = candidate.slice(slashIndex + 1)
  const dotIndex = fileName.lastIndexOf(".")
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : ""
}

export function isSupportedBundleFilePath(filePath: string): boolean {
  const extension = getBundleFileExtension(filePath)
  return SUPPORTED_BUNDLE_FILE_EXTENSIONS.some((supportedExtension) => supportedExtension === extension)
}

export function isHubBundleHandoffFilePath(filePath: string): boolean {
  return getBundleFileExtension(filePath) === HUB_BUNDLE_FILE_EXTENSION
}

function isBundleSecretKey(key: string): boolean {
  return BUNDLE_SECRET_PATTERNS.some((pattern) => pattern.test(key))
}

function stripBundleSecretsFromValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripBundleSecretsFromValue(item))
  }

  if (isRecordObject(value)) {
    return stripBundleSecretsFromObject(value)
  }

  return value
}

export function stripBundleSecretsFromObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (isBundleSecretKey(key) && typeof value === "string" && value.length > 0) {
      result[key] = "<CONFIGURE_YOUR_KEY>"
    } else {
      result[key] = stripBundleSecretsFromValue(value)
    }
  }
  return result
}

function createBundleSelectionSet(values?: readonly string[]): Set<string> | null {
  const normalized = (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean)

  return normalized.length > 0 ? new Set(normalized) : null
}

export function buildBundleAgentProfilesFromProfiles(
  profiles: readonly AgentProfile[],
  selectedAgentProfileIds?: readonly string[],
): BundleAgentProfile[] {
  const selectedIds = createBundleSelectionSet(selectedAgentProfileIds)

  return profiles
    .filter((profile) => !selectedIds || selectedIds.has(profile.id))
    .map((profile): BundleAgentProfile => {
      const sanitizedConnection: BundleAgentProfile["connection"] = {
        type: profile.connection?.type || "internal",
      }
      if (isNonEmptyString(profile.connection?.command)) {
        sanitizedConnection.command = profile.connection.command
      }
      if (Array.isArray(profile.connection?.args)) {
        sanitizedConnection.args = profile.connection.args
          .filter((arg): arg is string => typeof arg === "string")
      }
      if (isNonEmptyString(profile.connection?.cwd)) {
        sanitizedConnection.cwd = profile.connection.cwd
      }
      if (isNonEmptyString(profile.connection?.baseUrl)) {
        sanitizedConnection.baseUrl = profile.connection.baseUrl
      }

      return {
        id: profile.id,
        name: profile.name,
        displayName: profile.displayName,
        description: profile.description,
        enabled: profile.enabled,
        role: profile.role,
        systemPrompt: profile.systemPrompt,
        guidelines: profile.guidelines,
        connection: sanitizedConnection,
      }
    })
}

export function buildExportableBundleAgentProfiles(
  profiles: readonly AgentProfile[],
): ExportableBundleAgentProfile[] {
  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    displayName: profile.displayName,
    enabled: profile.enabled,
    role: profile.role,
    referencedMcpServerNames: (profile.toolConfig?.enabledServers ?? []).filter(isNonEmptyString),
    referencedSkillIds: (profile.skillsConfig?.enabledSkillIds ?? []).filter(isNonEmptyString),
  }))
}

export function buildExportableBundleMcpServers(
  servers: readonly BundleMcpServer[],
): ExportableBundleMcpServer[] {
  return servers.map((server) => ({
    name: server.name,
    transport: server.transport,
    enabled: server.enabled,
  }))
}

export function buildBundleSkillsFromSkills(
  skills: readonly AgentSkill[],
  selectedSkillIds?: readonly string[],
): BundleSkill[] {
  const selectedIds = createBundleSelectionSet(selectedSkillIds)

  return skills
    .filter((skill) => !selectedIds || selectedIds.has(skill.id))
    .map((skill): BundleSkill => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      instructions: skill.instructions,
      source: skill.source || "local",
    }))
}

export function buildExportableBundleSkills(
  skills: readonly AgentSkill[],
): ExportableBundleSkill[] {
  return skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
  }))
}

export function buildBundleRepeatTasksFromTasks(
  tasks: readonly LoopConfig[],
  selectedRepeatTaskIds?: readonly string[],
): BundleRepeatTask[] {
  const selectedIds = createBundleSelectionSet(selectedRepeatTaskIds)

  return tasks
    .filter((task) => !selectedIds || selectedIds.has(task.id))
    .map((task): BundleRepeatTask =>
      normalizeDotAgentsBundleRepeatTask({
        id: task.id,
        name: task.name,
        prompt: task.prompt,
        intervalMinutes: task.intervalMinutes,
        enabled: task.enabled,
        runOnStartup: task.runOnStartup,
        speakOnTrigger: task.speakOnTrigger,
        continueInSession: task.continueInSession,
        runContinuously: task.runContinuously,
        schedule: task.schedule,
      })
    )
}

export function buildExportableBundleRepeatTasks(
  tasks: readonly LoopConfig[],
): ExportableBundleRepeatTask[] {
  return tasks.map((task) => ({
    id: task.id,
    name: task.name,
    intervalMinutes: task.intervalMinutes,
    enabled: task.enabled,
  }))
}

export function buildBundleKnowledgeNotesFromNotes(
  notes: readonly KnowledgeNote[],
  selectedKnowledgeNoteIds?: readonly string[],
): BundleKnowledgeNote[] {
  const selectedIds = createBundleSelectionSet(selectedKnowledgeNoteIds)

  return notes
    .filter((note) => !selectedIds || selectedIds.has(note.id))
    .map((note): BundleKnowledgeNote => ({
      id: note.id,
      title: note.title,
      context: note.context,
      body: note.body,
      summary: note.summary,
      tags: note.tags,
      references: note.references,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      group: note.group,
      series: note.series,
      entryType: note.entryType,
    }))
}

export function buildExportableBundleKnowledgeNotes(
  notes: readonly KnowledgeNote[],
): ExportableBundleKnowledgeNote[] {
  return notes.map((note) => ({
    id: note.id,
    title: note.title,
    context: note.context,
    summary: note.summary,
  }))
}

export function generateBundleImportUniqueId(baseId: string, existingIds: ReadonlySet<string>): string {
  let counter = 1
  let newId = `${baseId}_imported`
  while (existingIds.has(newId)) {
    counter++
    newId = `${baseId}_imported_${counter}`
  }
  return newId
}

export type BundleImportItemActionResolution = {
  action: BundleImportItemAction
  finalId: string
  newId?: string
  shouldImport: boolean
}

export function resolveBundleImportItemAction(
  id: string,
  existingIds: ReadonlySet<string>,
  conflictStrategy: BundleImportConflictStrategy,
): BundleImportItemActionResolution {
  if (!existingIds.has(id)) {
    return {
      action: "imported",
      finalId: id,
      shouldImport: true,
    }
  }

  if (conflictStrategy === "skip") {
    return {
      action: "skipped",
      finalId: id,
      shouldImport: false,
    }
  }

  if (conflictStrategy === "rename") {
    const finalId = generateBundleImportUniqueId(id, existingIds)
    return {
      action: "renamed",
      finalId,
      newId: finalId,
      shouldImport: true,
    }
  }

  return {
    action: "overwritten",
    finalId: id,
    shouldImport: true,
  }
}

export type BuildBundleImportedRecordOptions = {
  id: string
  now?: number
}

export function buildAgentProfileFromBundleProfile(
  bundleProfile: BundleAgentProfile,
  options: BuildBundleImportedRecordOptions,
): AgentProfile {
  const now = options.now ?? Date.now()
  const connection: AgentProfile["connection"] = {
    type: bundleProfile.connection.type,
  }
  if (isNonEmptyString(bundleProfile.connection.command)) {
    connection.command = bundleProfile.connection.command
  }
  if (Array.isArray(bundleProfile.connection.args)) {
    connection.args = bundleProfile.connection.args
      .filter((arg): arg is string => typeof arg === "string")
  }
  if (isNonEmptyString(bundleProfile.connection.cwd)) {
    connection.cwd = bundleProfile.connection.cwd
  }
  if (isNonEmptyString(bundleProfile.connection.baseUrl)) {
    connection.baseUrl = bundleProfile.connection.baseUrl
  }

  return {
    id: options.id,
    name: bundleProfile.name,
    displayName: bundleProfile.displayName || bundleProfile.name,
    description: bundleProfile.description,
    systemPrompt: bundleProfile.systemPrompt,
    guidelines: bundleProfile.guidelines,
    connection,
    role: bundleProfile.role,
    enabled: bundleProfile.enabled,
    createdAt: now,
    updatedAt: now,
  }
}

export function buildMcpServerConfigFromBundleServer(bundleServer: BundleMcpServer): Record<string, unknown> {
  const serverConfig: Record<string, unknown> = {}
  if (bundleServer.command) serverConfig.command = bundleServer.command
  if (bundleServer.args) serverConfig.args = bundleServer.args
  if (bundleServer.transport) serverConfig.transport = bundleServer.transport
  if (bundleServer.enabled === false) serverConfig.disabled = true
  return serverConfig
}

export function buildSkillFromBundleSkill(
  bundleSkill: BundleSkill,
  options: BuildBundleImportedRecordOptions,
): AgentSkill {
  const now = options.now ?? Date.now()

  return {
    id: options.id,
    name: bundleSkill.name,
    description: bundleSkill.description || "",
    instructions: bundleSkill.instructions || "",
    createdAt: now,
    updatedAt: now,
    source: "imported",
  }
}

export function buildRepeatTaskFromBundleTask(
  bundleTask: BundleRepeatTask,
  options: BuildBundleImportedRecordOptions,
): LoopConfig {
  return {
    id: options.id,
    name: bundleTask.name,
    prompt: bundleTask.prompt,
    intervalMinutes: bundleTask.intervalMinutes,
    enabled: bundleTask.enabled,
    runOnStartup: bundleTask.runOnStartup,
    speakOnTrigger: bundleTask.speakOnTrigger,
    continueInSession: bundleTask.continueInSession,
    runContinuously: bundleTask.runContinuously,
    ...(bundleTask.runContinuously === true || !bundleTask.schedule
      ? {}
      : { schedule: bundleTask.schedule }),
  }
}

export function buildKnowledgeNoteFromBundleNote(
  bundleNote: BundleKnowledgeNote,
  options: BuildBundleImportedRecordOptions,
): KnowledgeNote {
  const now = options.now ?? Date.now()

  return {
    id: options.id,
    title: bundleNote.title,
    context: bundleNote.context,
    body: bundleNote.body,
    summary: bundleNote.summary,
    tags: bundleNote.tags || [],
    references: bundleNote.references,
    group: bundleNote.group,
    series: bundleNote.series,
    entryType: bundleNote.entryType,
    createdAt: bundleNote.createdAt ?? now,
    updatedAt: now,
  }
}

function isReservedTopLevelBundleMcpKey(key: string): boolean {
  if (key === "mcpConfig" || key === "mcpServers") return true
  return (BUNDLE_TOP_LEVEL_MCP_CONFIG_KEYS as readonly string[]).includes(key)
}

function isLikelyBundleMcpServerConfig(value: unknown): value is Record<string, unknown> {
  if (!isRecordObject(value)) return false
  const keys = Object.keys(value)
  if (keys.length === 0) return false
  return keys.some((key) => (BUNDLE_MCP_SERVER_CONFIG_KEYS as readonly string[]).includes(key))
}

function readLegacyTopLevelBundleMcpServers(mcpJson: Record<string, unknown>): Record<string, unknown> {
  const legacyServers: Record<string, Record<string, unknown>> = {}

  for (const [key, value] of Object.entries(mcpJson)) {
    if (!isRecordObject(value)) continue
    if (isReservedTopLevelBundleMcpKey(key)) continue

    const likelyServerConfig = isLikelyBundleMcpServerConfig(value)
    if (key.startsWith("mcp") && !likelyServerConfig) continue

    if (Object.keys(value).length > 0) {
      legacyServers[key] = value
    }
  }

  return legacyServers
}

export function readBundleMcpServersFromConfig(mcpJson: Record<string, unknown>): Record<string, unknown> {
  const legacyServers = readLegacyTopLevelBundleMcpServers(mcpJson)

  const nestedMcpConfig = mcpJson.mcpConfig
  let nestedServers: Record<string, unknown> = {}
  if (isRecordObject(nestedMcpConfig)) {
    const mcpConfigServers = nestedMcpConfig.mcpServers
    if (isRecordObject(mcpConfigServers)) {
      nestedServers = mcpConfigServers
    }
  }

  const topLevelServers = mcpJson.mcpServers
  let directServers: Record<string, unknown> = {}
  if (isRecordObject(topLevelServers)) {
    directServers = topLevelServers
  }

  return {
    ...legacyServers,
    ...directServers,
    ...nestedServers,
  }
}

export function buildBundleMcpServersFromConfig(
  mcpJson: Record<string, unknown>,
  selectedMcpServerNames?: readonly string[],
): BundleMcpServer[] {
  const selectedNames = createBundleSelectionSet(selectedMcpServerNames)
  const servers: BundleMcpServer[] = []
  const mcpServers = readBundleMcpServersFromConfig(mcpJson)

  for (const [name, config] of Object.entries(mcpServers)) {
    if (selectedNames && !selectedNames.has(name)) continue
    if (!isRecordObject(config)) continue

    const stripped = stripBundleSecretsFromObject(config)

    servers.push({
      name,
      command: typeof stripped.command === "string" ? stripped.command : undefined,
      args: Array.isArray(stripped.args) ? stripped.args.map(String) : undefined,
      transport: typeof stripped.transport === "string" ? stripped.transport : undefined,
      enabled: typeof stripped.disabled === "boolean" ? !stripped.disabled : true,
    })
  }

  return servers
}

export function writeCanonicalBundleMcpConfig(
  mcpJson: Record<string, unknown>,
  mcpServers: Record<string, unknown>,
): Record<string, unknown> {
  const nextMcpJson = { ...mcpJson }
  delete nextMcpJson.mcpServers

  const legacyTopLevelServers = readLegacyTopLevelBundleMcpServers(mcpJson)
  for (const legacyServerName of Object.keys(legacyTopLevelServers)) {
    delete nextMcpJson[legacyServerName]
  }

  const existingMcpConfig =
    isRecordObject(nextMcpJson.mcpConfig)
      ? { ...nextMcpJson.mcpConfig }
      : {}

  delete existingMcpConfig.mcpServers

  return {
    ...nextMcpJson,
    mcpConfig: {
      ...existingMcpConfig,
      mcpServers,
    },
  }
}

function normalizeBundlePublicMetadataString(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function normalizeBundlePublicMetadataStringArray(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) return []

  const normalized = new Set<string>()
  for (const value of values) {
    if (typeof value !== "string") continue
    const trimmed = value.trim()
    if (trimmed.length === 0) continue
    normalized.add(trimmed)
  }

  return Array.from(normalized)
}

export function sanitizeBundlePublicMetadata(
  publicMetadata: BundlePublicMetadata | undefined,
): BundlePublicMetadata | undefined {
  if (!publicMetadata) return undefined

  const summary = normalizeBundlePublicMetadataString(publicMetadata.summary)
  if (!summary) {
    throw new Error("Bundle public metadata requires a non-empty summary")
  }

  const displayName = normalizeBundlePublicMetadataString(publicMetadata.author?.displayName)
  if (!displayName) {
    throw new Error("Bundle public metadata requires author.displayName")
  }

  const handle = normalizeBundlePublicMetadataString(publicMetadata.author.handle)
  const url = normalizeBundlePublicMetadataString(publicMetadata.author.url)
  const minDesktopVersion = normalizeBundlePublicMetadataString(publicMetadata.compatibility?.minDesktopVersion)
  const notes = normalizeBundlePublicMetadataStringArray(publicMetadata.compatibility?.notes)

  return {
    summary,
    author: {
      displayName,
      ...(handle ? { handle } : {}),
      ...(url ? { url } : {}),
    },
    tags: normalizeBundlePublicMetadataStringArray(publicMetadata.tags),
    ...((minDesktopVersion || notes.length > 0)
      ? {
          compatibility: {
            ...(minDesktopVersion ? { minDesktopVersion } : {}),
            ...(notes.length > 0 ? { notes } : {}),
          },
        }
      : {}),
  }
}

export type ExportableBundleAgentProfile = {
  id: string
  name: string
  displayName?: string
  enabled: boolean
  role?: AgentProfileRole
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
  context: KnowledgeNoteContext
  summary?: string
}

export type ExportableBundleItems = {
  agentProfiles: ExportableBundleAgentProfile[]
  mcpServers: ExportableBundleMcpServer[]
  skills: ExportableBundleSkill[]
  repeatTasks: ExportableBundleRepeatTask[]
  knowledgeNotes: ExportableBundleKnowledgeNote[]
}

export type BundleBuildItems = {
  agentProfiles: BundleAgentProfile[]
  mcpServers: BundleMcpServer[]
  skills: BundleSkill[]
  repeatTasks: BundleRepeatTask[]
  knowledgeNotes: BundleKnowledgeNote[]
}

export type BuildDotAgentsBundleOptions = {
  exportedFrom?: string
  createdAt?: string
  now?: () => Date
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

function mergeByKey<T>(
  values: readonly T[],
  getKey: (value: T) => string,
): T[] {
  const merged = new Map<string, T>()
  for (const value of values) {
    merged.set(getKey(value), value)
  }
  return Array.from(merged.values())
}

export function sortExportableBundleItems(items: ExportableBundleItems): ExportableBundleItems {
  return {
    agentProfiles: [...items.agentProfiles].sort((a, b) =>
      (a.displayName || a.name).localeCompare(b.displayName || b.name)
    ),
    mcpServers: [...items.mcpServers].sort((a, b) => a.name.localeCompare(b.name)),
    skills: [...items.skills].sort((a, b) => a.name.localeCompare(b.name)),
    repeatTasks: [...items.repeatTasks].sort((a, b) => a.name.localeCompare(b.name)),
    knowledgeNotes: [...items.knowledgeNotes].sort((a, b) => a.title.localeCompare(b.title)),
  }
}

export function mergeExportableBundleItems(layerItems: readonly ExportableBundleItems[]): ExportableBundleItems {
  return sortExportableBundleItems({
    agentProfiles: mergeByKey(
      layerItems.flatMap((items) => items.agentProfiles),
      (profile) => profile.id,
    ),
    mcpServers: mergeByKey(
      layerItems.flatMap((items) => items.mcpServers),
      (server) => server.name,
    ),
    skills: mergeByKey(
      layerItems.flatMap((items) => items.skills),
      (skill) => skill.id,
    ),
    repeatTasks: mergeByKey(
      layerItems.flatMap((items) => items.repeatTasks),
      (task) => task.id,
    ),
    knowledgeNotes: mergeByKey(
      layerItems.flatMap((items) => items.knowledgeNotes),
      (knowledgeNote) => knowledgeNote.id,
    ),
  })
}

export function mergeBundleBuildItems(layerItems: readonly BundleBuildItems[]): BundleBuildItems {
  return {
    agentProfiles: mergeByKey(
      layerItems.flatMap((items) => items.agentProfiles),
      (profile) => profile.id,
    ),
    mcpServers: mergeByKey(
      layerItems.flatMap((items) => items.mcpServers),
      (server) => server.name,
    ),
    skills: mergeByKey(
      layerItems.flatMap((items) => items.skills),
      (skill) => skill.id,
    ),
    repeatTasks: mergeByKey(
      layerItems.flatMap((items) => items.repeatTasks),
      (task) => task.id,
    ),
    knowledgeNotes: mergeByKey(
      layerItems.flatMap((items) => items.knowledgeNotes),
      (knowledgeNote) => knowledgeNote.id,
    ),
  }
}

export type BundleLayerDirResolver = (dir: string) => string

export interface BundleLayerDirOptions {
  resolveDir?: BundleLayerDirResolver
  emptyErrorMessage?: string
}

export function normalizeBundleLayerDirs(
  agentsDirs: readonly string[],
  resolveDir: BundleLayerDirResolver = (dir) => dir,
): string[] {
  return Array.from(
    new Set(agentsDirs.map((dir) => resolveDir(dir)).filter((dir) => dir.length > 0))
  )
}

export function getBundleExportableItemsFromLayerDirs(
  agentsDirs: readonly string[],
  loadLayerItems: (agentsDir: string) => ExportableBundleItems,
  options: BundleLayerDirOptions = {},
): ExportableBundleItems {
  const normalizedDirs = normalizeBundleLayerDirs(agentsDirs, options.resolveDir)

  if (normalizedDirs.length === 0) {
    throw new Error(options.emptyErrorMessage ?? "No agents directories provided for exportable item listing")
  }

  if (normalizedDirs.length === 1) {
    return loadLayerItems(normalizedDirs[0])
  }

  return mergeExportableBundleItems(normalizedDirs.map((dir) => loadLayerItems(dir)))
}

export interface BuildBundleFromLayerDirsOptions extends BundleLayerDirOptions {
  buildOptions?: BuildDotAgentsBundleOptions
}

export async function buildBundleFromLayerDirs(
  agentsDirs: readonly string[],
  loadLayerBundle: (agentsDir: string) => DotAgentsBundle | Promise<DotAgentsBundle>,
  request: ExportBundleRequest | undefined,
  options: BuildBundleFromLayerDirsOptions = {},
): Promise<DotAgentsBundle> {
  const normalizedDirs = normalizeBundleLayerDirs(agentsDirs, options.resolveDir)

  if (normalizedDirs.length === 0) {
    throw new Error(options.emptyErrorMessage ?? "No agents directories provided for bundle export")
  }

  if (normalizedDirs.length === 1) {
    return loadLayerBundle(normalizedDirs[0])
  }

  const layerBundles = await Promise.all(
    normalizedDirs.map((dir) => loadLayerBundle(dir))
  )
  const mergedItems = mergeBundleBuildItems(layerBundles.map(getBundleBuildItems))

  return buildDotAgentsBundle(request, mergedItems, options.buildOptions)
}

export function getBundleBuildItems(bundle: DotAgentsBundle): BundleBuildItems {
  return {
    agentProfiles: bundle.agentProfiles,
    mcpServers: bundle.mcpServers,
    skills: bundle.skills,
    repeatTasks: bundle.repeatTasks,
    knowledgeNotes: bundle.knowledgeNotes,
  }
}

export function buildDotAgentsBundle(
  request: ExportBundleRequest | undefined,
  items: BundleBuildItems,
  options: BuildDotAgentsBundleOptions = {},
): DotAgentsBundle {
  const publicMetadata = sanitizeBundlePublicMetadata(request?.publicMetadata)
  const createdAt = options.createdAt ?? (options.now ? options.now() : new Date()).toISOString()

  return {
    manifest: {
      version: 1,
      name: request?.name || "My Agent Configuration",
      description: request?.description,
      createdAt,
      exportedFrom: options.exportedFrom ?? "dotagents",
      ...(publicMetadata ? { publicMetadata } : {}),
      components: {
        agentProfiles: items.agentProfiles.length,
        mcpServers: items.mcpServers.length,
        skills: items.skills.length,
        repeatTasks: items.repeatTasks.length,
        knowledgeNotes: items.knowledgeNotes.length,
      },
    },
    agentProfiles: items.agentProfiles,
    mcpServers: items.mcpServers,
    skills: items.skills,
    repeatTasks: items.repeatTasks,
    knowledgeNotes: items.knowledgeNotes,
  }
}

export interface BundleComponentLoaders {
  loadAgentProfiles(): BundleAgentProfile[]
  loadMcpServers(): BundleMcpServer[]
  loadSkills(): BundleSkill[]
  loadRepeatTasks(): BundleRepeatTask[]
  loadKnowledgeNotes(): BundleKnowledgeNote[]
}

export function buildBundleFromComponentLoaders(
  request: ExportBundleRequest | undefined,
  loaders: BundleComponentLoaders,
  options: BuildDotAgentsBundleOptions = {},
): DotAgentsBundle {
  const components = { ...DEFAULT_BUNDLE_COMPONENT_SELECTION, ...request?.components }

  return buildDotAgentsBundle(request, {
    agentProfiles: components.agentProfiles ? loaders.loadAgentProfiles() : [],
    mcpServers: components.mcpServers ? loaders.loadMcpServers() : [],
    skills: components.skills ? loaders.loadSkills() : [],
    repeatTasks: components.repeatTasks ? loaders.loadRepeatTasks() : [],
    knowledgeNotes: components.knowledgeNotes ? loaders.loadKnowledgeNotes() : [],
  }, options)
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

export type BundleImportExistingItem = {
  id: string
  name?: string
}

export type BundleImportExistingItems = {
  agentProfiles: BundleImportExistingItem[]
  mcpServers: BundleImportExistingItem[]
  skills: BundleImportExistingItem[]
  repeatTasks: BundleImportExistingItem[]
  knowledgeNotes: BundleImportExistingItem[]
}

export type BundleImportExistingItemSources = {
  agentProfiles: readonly Pick<AgentProfile, "id" | "name">[]
  mcpServerNames: readonly string[]
  skills: readonly Pick<AgentSkill, "id" | "name">[]
  repeatTasks: readonly Pick<LoopConfig, "id" | "name">[]
  knowledgeNotes: readonly Pick<KnowledgeNote, "id" | "title">[]
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
  action: BundleImportItemAction
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

export function createBundleImportResult(): BundleImportResult {
  return {
    success: false,
    agentProfiles: [],
    mcpServers: [],
    skills: [],
    repeatTasks: [],
    knowledgeNotes: [],
    errors: [],
  }
}

export function buildBundleImportItemResult(
  id: string,
  name: string,
  action: BundleImportItemActionResolution,
): BundleImportItemResult {
  return {
    id,
    name,
    action: action.action,
    ...(action.newId ? { newId: action.newId } : {}),
  }
}

export function buildBundleImportItemErrorResult(
  id: string,
  name: string,
  error: unknown,
): BundleImportItemResult {
  return {
    id,
    name,
    action: "skipped",
    error: error instanceof Error ? error.message : String(error),
  }
}

export function formatBundleImportItemError(
  componentLabel: string,
  itemName: string,
  error: unknown,
): string {
  const message = error instanceof Error ? error.message : String(error)
  return `${componentLabel} "${itemName}": ${message}`
}

export function finalizeBundleImportResult(result: BundleImportResult): BundleImportResult {
  return {
    ...result,
    success: result.errors.length === 0,
  }
}

export interface BundleImportItemCollectionOptions<TItem> {
  result: BundleImportResult
  resultItems: BundleImportItemResult[]
  items: readonly TItem[]
  existingIds: Set<string>
  conflictStrategy: BundleImportConflictStrategy
  componentLabel: string
  getId(item: TItem): string
  getName(item: TItem): string
  importItem(item: TItem, action: BundleImportItemActionResolution): void | Promise<void>
}

export async function importBundleItemCollection<TItem>(
  options: BundleImportItemCollectionOptions<TItem>,
): Promise<void> {
  for (const item of options.items) {
    const id = options.getId(item)
    const name = options.getName(item)

    try {
      const importAction = resolveBundleImportItemAction(id, options.existingIds, options.conflictStrategy)

      if (!importAction.shouldImport) {
        options.resultItems.push(buildBundleImportItemResult(id, name, importAction))
        continue
      }

      await options.importItem(item, importAction)
      options.existingIds.add(importAction.finalId)

      options.resultItems.push(buildBundleImportItemResult(id, name, importAction))
    } catch (error) {
      options.resultItems.push(buildBundleImportItemErrorResult(id, name, error))
      options.result.errors.push(formatBundleImportItemError(options.componentLabel, name, error))
    }
  }
}

export interface BundleMcpServersImportOptions {
  result: BundleImportResult
  mcpConfig: Record<string, unknown>
  bundleServers: readonly BundleMcpServer[]
  conflictStrategy: BundleImportConflictStrategy
}

export interface BundleMcpServersImportResult {
  modified: boolean
  mcpConfig: Record<string, unknown>
}

export function importBundleMcpServersIntoConfig(
  options: BundleMcpServersImportOptions,
): BundleMcpServersImportResult {
  const mcpServers = { ...readBundleMcpServersFromConfig(options.mcpConfig) }
  const existingNames = new Set(Object.keys(mcpServers))
  let modified = false

  for (const bundleServer of options.bundleServers) {
    const importAction = resolveBundleImportItemAction(
      bundleServer.name,
      existingNames,
      options.conflictStrategy,
    )

    if (!importAction.shouldImport) {
      options.result.mcpServers.push(buildBundleImportItemResult(bundleServer.name, bundleServer.name, importAction))
      continue
    }

    mcpServers[importAction.finalId] = buildMcpServerConfigFromBundleServer(bundleServer)
    existingNames.add(importAction.finalId)
    modified = true

    options.result.mcpServers.push(buildBundleImportItemResult(bundleServer.name, bundleServer.name, importAction))
  }

  return {
    modified,
    mcpConfig: modified ? writeCanonicalBundleMcpConfig(options.mcpConfig, mcpServers) : options.mcpConfig,
  }
}

export function hasBundleImportConflicts(
  conflicts: BundleImportPreviewConflicts | undefined,
  components: BundleComponentSelection,
): boolean {
  if (!conflicts) return false
  const resolved = resolveBundleComponentSelection(components)
  return BUNDLE_COMPONENT_KEYS.some((key) => resolved[key] && conflicts[key].length > 0)
}

function createBundleImportConflict(
  id: string,
  name: string,
  existingName: string | undefined,
): BundleImportPreviewConflict {
  return {
    id,
    name,
    ...(existingName ? { existingName } : {}),
  }
}

function createBundleImportExistingItemMap(
  items: readonly BundleImportExistingItem[],
): Map<string, BundleImportExistingItem> {
  return new Map(items.map((item) => [item.id, item]))
}

export function buildBundleImportExistingItems(
  sources: BundleImportExistingItemSources,
): BundleImportExistingItems {
  return {
    agentProfiles: sources.agentProfiles.map((profile) => ({ id: profile.id, name: profile.name })),
    mcpServers: sources.mcpServerNames.map((name) => ({ id: name })),
    skills: sources.skills.map((skill) => ({ id: skill.id, name: skill.name })),
    repeatTasks: sources.repeatTasks.map((task) => ({ id: task.id, name: task.name })),
    knowledgeNotes: sources.knowledgeNotes.map((note) => ({ id: note.id, name: note.title })),
  }
}

export function buildBundleImportPreviewConflicts(
  bundle: DotAgentsBundle,
  existingItems: BundleImportExistingItems,
): BundleImportPreviewConflicts {
  const existingAgentProfiles = createBundleImportExistingItemMap(existingItems.agentProfiles)
  const existingMcpServers = createBundleImportExistingItemMap(existingItems.mcpServers)
  const existingSkills = createBundleImportExistingItemMap(existingItems.skills)
  const existingRepeatTasks = createBundleImportExistingItemMap(existingItems.repeatTasks)
  const existingKnowledgeNotes = createBundleImportExistingItemMap(existingItems.knowledgeNotes)

  return {
    agentProfiles: bundle.agentProfiles
      .filter((agent) => existingAgentProfiles.has(agent.id))
      .map((agent) => createBundleImportConflict(agent.id, agent.name, existingAgentProfiles.get(agent.id)?.name)),
    mcpServers: bundle.mcpServers
      .filter((server) => existingMcpServers.has(server.name))
      .map((server) => createBundleImportConflict(server.name, server.name, existingMcpServers.get(server.name)?.name)),
    skills: bundle.skills
      .filter((skill) => existingSkills.has(skill.id))
      .map((skill) => createBundleImportConflict(skill.id, skill.name, existingSkills.get(skill.id)?.name)),
    repeatTasks: bundle.repeatTasks
      .filter((task) => existingRepeatTasks.has(task.id))
      .map((task) => createBundleImportConflict(task.id, task.name, existingRepeatTasks.get(task.id)?.name)),
    knowledgeNotes: bundle.knowledgeNotes
      .filter((note) => existingKnowledgeNotes.has(note.id))
      .map((note) => createBundleImportConflict(note.id, note.title, existingKnowledgeNotes.get(note.id)?.name)),
  }
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
