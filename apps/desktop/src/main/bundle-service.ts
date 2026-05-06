/**
 * BundleService - Export/Import agent configurations as portable .dotagents bundles.
 *
 * Phase 1: JSON-based bundle format with automatic secret stripping.
 * A .dotagents file is a JSON document containing a manifest plus embedded
 * agent profiles, MCP server configs, skills, repeat tasks, and knowledge notes.
 */

import fs from "fs"
import path from "path"
import { dialog, BrowserWindow, type OpenDialogOptions, type SaveDialogOptions } from "electron"
import {
  loadAgentsSkillsLayer,
  loadTasksLayer,
  skillIdToDirPath,
  writeTaskFile,
  writeAgentsSkillFile,
  taskIdToFilePath,
  type AgentProfile,
  type AgentProfileConnection,
  type AgentSkill,
  type KnowledgeNote,
  type LoopConfig,
  type AgentProfileConnectionType,
  type AgentProfileRole,
} from "@dotagents/core"
import {
  buildHubBundleArtifactUrl,
  buildHubBundleInstallUrl,
  slugifyHubCatalogId,
  type HubCatalogAuthor,
  type HubCatalogCompatibility,
  type HubPublishPayload,
} from "@dotagents/shared/hub"
import { DEFAULT_BUNDLE_PUBLISH_COMPONENT_SELECTION } from "@dotagents/shared/bundle-api"
import { isAgentProfileConnectionTypeValue } from "@dotagents/shared/agent-profile-connection"
import { isAgentProfileRole } from "@dotagents/shared/agent-profile-role"
import { getAgentsLayerPaths, type AgentsLayerPaths } from "./agents-files/modular-config"
import { loadAgentProfilesLayer, writeAgentsProfileFiles } from "./agents-files/agent-profiles"
import { loadAgentsKnowledgeNotesLayer, writeKnowledgeNoteFile } from "./agents-files/knowledge-notes"
import { safeReadJsonFileSync, safeWriteJsonFileSync } from "@dotagents/core"
import { logApp } from "./debug"

// ============================================================================
// Types
// ============================================================================

export type BundlePublicMetadataAuthor = HubCatalogAuthor

export type BundlePublicMetadataCompatibility = HubCatalogCompatibility

export interface BundlePublicMetadata {
  summary: string
  author: BundlePublicMetadataAuthor
  tags: string[]
  compatibility?: BundlePublicMetadataCompatibility
}

export interface BundleManifest {
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

export interface BundleAgentProfile {
  id: string
  name: string
  displayName?: string
  description?: string
  enabled: boolean
  role?: AgentProfileRole
  systemPrompt?: string
  guidelines?: string
  connection: {
    type: AgentProfileConnectionType
    // Preserve non-secret connection fields to keep imported external agents functional.
    command?: string
    args?: string[]
    cwd?: string
    baseUrl?: string
  }
}

export interface BundleMCPServer {
  name: string
  command?: string
  args?: string[]
  transport?: string
  // URL/keys stripped
  enabled?: boolean
}

export interface BundleSkill {
  id: string
  name: string
  description?: string
  // Legacy v1 bundles may omit instructions (metadata-only skill entries).
  instructions?: string
  source?: string
}

export interface BundleRepeatTask {
  id: string
  name: string
  prompt: string
  intervalMinutes: number
  enabled: boolean
  runOnStartup?: boolean
  speakOnTrigger?: boolean
  continueInSession?: boolean
  runContinuously?: boolean
  schedule?: LoopConfig["schedule"]
  // profileId omitted — the profile may not exist in the target environment
  // lastSessionId omitted — installation-local, not meaningful across bundles
}

export interface BundleKnowledgeNote {
  id: string
  title: string
  context: KnowledgeNote["context"]
  body: string
  summary?: string
  tags: string[]
  references?: string[]
  createdAt?: number
  updatedAt: number
  group?: string
  series?: string
  entryType?: KnowledgeNote["entryType"]
}

export interface DotAgentsBundle {
  manifest: BundleManifest
  agentProfiles: BundleAgentProfile[]
  mcpServers: BundleMCPServer[]
  skills: BundleSkill[]
  repeatTasks: BundleRepeatTask[]
  knowledgeNotes: BundleKnowledgeNote[]
}

export interface ExportBundleToFileResult {
  success: boolean
  filePath: string | null
  canceled: boolean
  error?: string
}

export interface BundleComponentSelection {
  agentProfiles?: boolean
  mcpServers?: boolean
  skills?: boolean
  repeatTasks?: boolean
  knowledgeNotes?: boolean
}

export interface BundleItemSelectionOptions {
  agentProfileIds?: string[]
  mcpServerNames?: string[]
  skillIds?: string[]
  repeatTaskIds?: string[]
  knowledgeNoteIds?: string[]
}

export interface ExportableBundleAgentProfile {
  id: string
  name: string
  displayName?: string
  enabled: boolean
  role?: AgentProfileRole
  referencedMcpServerNames: string[]
  referencedSkillIds: string[]
}

export interface ExportableBundleMCPServer {
  name: string
  transport?: string
  enabled?: boolean
}

export interface ExportableBundleSkill {
  id: string
  name: string
  description?: string
}

export interface ExportableBundleRepeatTask {
  id: string
  name: string
  intervalMinutes: number
  enabled: boolean
}

export interface ExportableBundleKnowledgeNote {
  id: string
  title: string
  context: KnowledgeNote["context"]
  summary?: string
}

export interface ExportableBundleItems {
  agentProfiles: ExportableBundleAgentProfile[]
  mcpServers: ExportableBundleMCPServer[]
  skills: ExportableBundleSkill[]
  repeatTasks: ExportableBundleRepeatTask[]
  knowledgeNotes: ExportableBundleKnowledgeNote[]
}

export interface ExportBundleOptions extends BundleItemSelectionOptions {
  name?: string
  description?: string
  publicMetadata?: BundlePublicMetadata
  components?: BundleComponentSelection
}

export interface GeneratePublishPayloadOptions extends ExportBundleOptions {
  publicMetadata: BundlePublicMetadata
  catalogId?: string
  artifactUrl?: string
}

// ============================================================================
// Import Types
// ============================================================================

export type ImportConflictStrategy = "skip" | "overwrite" | "rename"

export interface ImportOptions {
  /** How to handle conflicts when an item with the same ID already exists */
  conflictStrategy: ImportConflictStrategy
  /** Components to import (defaults to all) */
  components?: {
    agentProfiles?: boolean
    mcpServers?: boolean
    skills?: boolean
    repeatTasks?: boolean
    knowledgeNotes?: boolean
  }
}

export interface ImportItemResult {
  id: string
  name: string
  action: "imported" | "skipped" | "renamed" | "overwritten"
  newId?: string // Only set if renamed
  error?: string
}

export interface ImportBundleResult {
  success: boolean
  agentProfiles: ImportItemResult[]
  mcpServers: ImportItemResult[]
  skills: ImportItemResult[]
  repeatTasks: ImportItemResult[]
  knowledgeNotes: ImportItemResult[]
  errors: string[]
}

// ============================================================================
// Preview Types
// ============================================================================

export interface PreviewConflict {
  id: string
  name: string
  existingName?: string
}

export interface BundlePreviewResult {
  success: boolean
  filePath?: string
  bundle?: DotAgentsBundle
  conflicts?: {
    agentProfiles: PreviewConflict[]
    mcpServers: PreviewConflict[]
    skills: PreviewConflict[]
    repeatTasks: PreviewConflict[]
    knowledgeNotes: PreviewConflict[]
  }
  error?: string
}

// ============================================================================
// Secret stripping
// ============================================================================

const SECRET_PATTERNS = [
  /key/i,
  /token/i,
  /secret/i,
  /password/i,
  /credential/i,
  /auth/i,
  /bearer/i,
]

const BUNDLE_FILE_EXTENSIONS = new Set([".dotagents", ".json"])
const HUB_BUNDLE_FILE_EXTENSION = ".dotagents"
const TOP_LEVEL_MCP_CONFIG_KEYS = [
  "mcpDisabledTools",
  "mcpRuntimeDisabledServers",
  "mcpToolsCollapsedServers",
  "mcpServersCollapsedServers",
] as const
const MCP_SERVER_CONFIG_KEYS = [
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
function isReservedTopLevelMcpKey(key: string): boolean {
  if (key === "mcpConfig" || key === "mcpServers") return true
  return (TOP_LEVEL_MCP_CONFIG_KEYS as readonly string[]).includes(key)
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function normalizeStringArray(values: string[] | undefined): string[] {
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

function sanitizeBundlePublicMetadata(
  publicMetadata: BundlePublicMetadata | undefined
): BundlePublicMetadata | undefined {
  if (!publicMetadata) return undefined

  const summary = normalizeOptionalString(publicMetadata.summary)
  if (!summary) {
    throw new Error("Bundle public metadata requires a non-empty summary")
  }

  const displayName = normalizeOptionalString(publicMetadata.author?.displayName)
  if (!displayName) {
    throw new Error("Bundle public metadata requires author.displayName")
  }

  const handle = normalizeOptionalString(publicMetadata.author.handle)
  const url = normalizeOptionalString(publicMetadata.author.url)
  const minDesktopVersion = normalizeOptionalString(publicMetadata.compatibility?.minDesktopVersion)
  const notes = normalizeStringArray(publicMetadata.compatibility?.notes)

  return {
    summary,
    author: {
      displayName,
      ...(handle ? { handle } : {}),
      ...(url ? { url } : {}),
    },
    tags: normalizeStringArray(publicMetadata.tags),
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

function normalizePublishCatalogId(catalogId: string | undefined, bundleName: string): string {
  const normalized = normalizeOptionalString(catalogId)
  return slugifyHubCatalogId(normalized || bundleName)
}

function normalizePublishArtifactUrl(artifactUrl: string | undefined, catalogId: string): string {
  const normalized = normalizeOptionalString(artifactUrl)
  if (!normalized) {
    return buildHubBundleArtifactUrl(catalogId)
  }

  try {
    const parsedUrl = new URL(normalized)
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("unsupported protocol")
    }
    return parsedUrl.toString()
  } catch {
    throw new Error("Publish payload requires artifactUrl to be a valid http(s) URL")
  }
}

function buildPublishArtifactFileName(bundleName: string, catalogId: string): string {
  const safeName = bundleName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim()
  return `${safeName || catalogId}.dotagents`
}

function isSecretKey(key: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(key))
}

function stripSecretsFromValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripSecretsFromValue(item))
  }

  if (typeof value === "object" && value !== null) {
    return stripSecretsFromObject(value as Record<string, unknown>)
  }

  return value
}

function stripSecretsFromObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (isSecretKey(key) && typeof value === "string" && value.length > 0) {
      result[key] = "<CONFIGURE_YOUR_KEY>"
    } else {
      result[key] = stripSecretsFromValue(value)
    }
  }
  return result
}

function isLikelyMcpServerConfig(value: unknown): value is Record<string, unknown> {
  if (!isRecordObject(value)) return false
  const keys = Object.keys(value)
  if (keys.length === 0) return false
  return keys.some((key) => (MCP_SERVER_CONFIG_KEYS as readonly string[]).includes(key))
}

function readLegacyTopLevelMcpServers(mcpJson: Record<string, unknown>): Record<string, unknown> {
  const legacyServers: Record<string, Record<string, unknown>> = {}

  for (const [key, value] of Object.entries(mcpJson)) {
    if (!isRecordObject(value)) continue
    if (isReservedTopLevelMcpKey(key)) continue

    const likelyServerConfig = isLikelyMcpServerConfig(value)

    // Reserve future top-level `mcp*` config keys unless this key clearly
    // looks like a legacy server entry (e.g. mcpGithub: { command, args }).
    if (key.startsWith("mcp") && !likelyServerConfig) continue

    // Backward compatibility: keep non-empty object entries even when their shape is unknown.
    // This avoids missing legacy servers in mixed configs that contain both known and unknown
    // server schemas during migration.
    if (Object.keys(value).length > 0) {
      legacyServers[key] = value
    }
  }

  return legacyServers
}

function readMcpServersFromConfig(mcpJson: Record<string, unknown>): Record<string, unknown> {
  const legacyServers = readLegacyTopLevelMcpServers(mcpJson)

  const nestedMcpConfig = mcpJson.mcpConfig
  let nestedServers: Record<string, unknown> = {}
  if (isRecordObject(nestedMcpConfig)) {
    const mcpConfigServers = (nestedMcpConfig as Record<string, unknown>).mcpServers
    if (isRecordObject(mcpConfigServers)) {
      nestedServers = mcpConfigServers as Record<string, unknown>
    }
  }

  const topLevelServers = mcpJson.mcpServers
  let directServers: Record<string, unknown> = {}
  if (isRecordObject(topLevelServers)) {
    directServers = topLevelServers as Record<string, unknown>
  }

  // Merge all known MCP server shapes to avoid dropping legacy servers in mixed configs.
  // Precedence: nested mcpConfig.mcpServers > top-level mcpServers > legacy top-level.
  return {
    ...legacyServers,
    ...directServers,
    ...nestedServers,
  }
}

function writeCanonicalMcpConfig(
  mcpJson: Record<string, unknown>,
  mcpServers: Record<string, unknown>
): Record<string, unknown> {
  const nextMcpJson = { ...mcpJson }
  delete nextMcpJson.mcpServers

  // Remove legacy top-level server entries so we only persist canonical mcpConfig.mcpServers.
  const legacyTopLevelServers = readLegacyTopLevelMcpServers(mcpJson)
  for (const legacyServerName of Object.keys(legacyTopLevelServers)) {
    delete nextMcpJson[legacyServerName]
  }

  const existingMcpConfig =
    isRecordObject(nextMcpJson.mcpConfig)
      ? { ...(nextMcpJson.mcpConfig as Record<string, unknown>) }
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

// ============================================================================
// Export
// ============================================================================

function sanitizeAgentProfile(profile: AgentProfile): BundleAgentProfile {
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

  const sanitized: BundleAgentProfile = {
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
  return sanitized
}

function toSelectionSet(values?: string[]): Set<string> | null {
  const normalized = (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean)

  return normalized.length > 0 ? new Set(normalized) : null
}

function summarizeAgentProfileForExport(profile: AgentProfile): ExportableBundleAgentProfile {
  return {
    id: profile.id,
    name: profile.name,
    displayName: profile.displayName,
    enabled: profile.enabled,
    role: profile.role,
    referencedMcpServerNames: (profile.toolConfig?.enabledServers ?? []).filter(isNonEmptyString),
    referencedSkillIds: (profile.skillsConfig?.enabledSkillIds ?? []).filter(isNonEmptyString),
  }
}

function loadAgentProfilesForBundle(
  layer: AgentsLayerPaths,
  options?: BundleItemSelectionOptions
): BundleAgentProfile[] {
  const selectedAgentProfileIds = toSelectionSet(options?.agentProfileIds)

  return loadAgentProfilesLayer(layer).profiles
    .filter((profile) => !selectedAgentProfileIds || selectedAgentProfileIds.has(profile.id))
    .map(sanitizeAgentProfile)
}

function loadMCPServersForBundle(
  layer: AgentsLayerPaths,
  options?: BundleItemSelectionOptions
): BundleMCPServer[] {
  const mcpConfig = safeReadJsonFileSync<Record<string, unknown>>(layer.mcpJsonPath, {
    defaultValue: {},
  })
  const selectedMcpServerNames = toSelectionSet(options?.mcpServerNames)

  const servers: BundleMCPServer[] = []
  const mcpServers = readMcpServersFromConfig(mcpConfig)

  if (typeof mcpServers === "object" && mcpServers !== null) {
    for (const [name, config] of Object.entries(mcpServers)) {
      if (selectedMcpServerNames && !selectedMcpServerNames.has(name)) continue
      if (typeof config !== "object" || config === null) continue
      const serverConfig = config as Record<string, unknown>

      // Strip secrets from the server config
      const stripped = stripSecretsFromObject(serverConfig)

      servers.push({
        name,
        command: typeof stripped.command === "string" ? stripped.command : undefined,
        args: Array.isArray(stripped.args) ? stripped.args.map(String) : undefined,
        transport: typeof stripped.transport === "string" ? stripped.transport : undefined,
        enabled: typeof stripped.disabled === "boolean" ? !stripped.disabled : true,
      })
    }
  }

  return servers
}

const DEFAULT_EXPORT_COMPONENTS: Required<BundleComponentSelection> = {
  agentProfiles: true,
  mcpServers: true,
  skills: true,
  repeatTasks: true,
  knowledgeNotes: true,
}

function loadSkillsForBundle(layer: AgentsLayerPaths, options?: BundleItemSelectionOptions): BundleSkill[] {
  const skillsResult = loadAgentsSkillsLayer(layer)
  const selectedSkillIds = toSelectionSet(options?.skillIds)

  return skillsResult.skills
    .filter(skill => !selectedSkillIds || selectedSkillIds.has(skill.id))
    .map((skill): BundleSkill => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    instructions: skill.instructions,
    source: skill.source || "local",
    }))
}

function normalizeBundleRepeatTask(task: BundleRepeatTask): BundleRepeatTask {
  const normalized = { ...task }
  if (normalized.runContinuously === true) {
    delete normalized.schedule
  }
  return normalized
}

function loadRepeatTasksForBundle(layer: AgentsLayerPaths, options?: BundleItemSelectionOptions): BundleRepeatTask[] {
  const tasksResult = loadTasksLayer(layer)
  const selectedRepeatTaskIds = toSelectionSet(options?.repeatTaskIds)

  return tasksResult.tasks
    .filter((task) => !selectedRepeatTaskIds || selectedRepeatTaskIds.has(task.id))
    .map((task): BundleRepeatTask =>
      normalizeBundleRepeatTask({
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
        // profileId intentionally omitted — may not exist in target environment
      })
    )
}

function loadKnowledgeNotesForBundle(layer: AgentsLayerPaths, options?: BundleItemSelectionOptions): BundleKnowledgeNote[] {
  const knowledgeNotesResult = loadAgentsKnowledgeNotesLayer(layer)
  const selectedKnowledgeNoteIds = toSelectionSet(options?.knowledgeNoteIds)

  return knowledgeNotesResult.notes
    .filter((note) => !selectedKnowledgeNoteIds || selectedKnowledgeNoteIds.has(note.id))
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

function listExportableBundleItemsForLayer(layer: AgentsLayerPaths): ExportableBundleItems {
  return {
    agentProfiles: loadAgentProfilesLayer(layer).profiles.map(summarizeAgentProfileForExport),
    mcpServers: loadMCPServersForBundle(layer).map((server) => ({
      name: server.name,
      transport: server.transport,
      enabled: server.enabled,
    })),
    skills: loadAgentsSkillsLayer(layer).skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
    })),
    repeatTasks: loadTasksLayer(layer).tasks.map((task) => ({
      id: task.id,
      name: task.name,
      intervalMinutes: task.intervalMinutes,
      enabled: task.enabled,
    })),
    knowledgeNotes: loadAgentsKnowledgeNotesLayer(layer).notes.map((note) => ({
      id: note.id,
      title: note.title,
      context: note.context,
      summary: note.summary,
    })),
  }
}

function sortExportableBundleItems(items: ExportableBundleItems): ExportableBundleItems {
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

export function getBundleExportableItems(agentsDir: string): ExportableBundleItems {
  const layer = getAgentsLayerPaths(agentsDir)
  return sortExportableBundleItems(listExportableBundleItemsForLayer(layer))
}

export function getBundleExportableItemsFromLayers(agentsDirs: string[]): ExportableBundleItems {
  const normalizedDirs = Array.from(
    new Set(agentsDirs.map((dir) => path.resolve(dir)).filter((dir) => dir.length > 0))
  )

  if (normalizedDirs.length === 0) {
    throw new Error("No agents directories provided for exportable item listing")
  }

  if (normalizedDirs.length === 1) {
    return getBundleExportableItems(normalizedDirs[0])
  }

  const layerItems = normalizedDirs.map((dir) => getBundleExportableItems(dir))

  return sortExportableBundleItems({
    agentProfiles: mergeByKey(
      layerItems.flatMap((items) => items.agentProfiles),
      (profile) => profile.id
    ),
    mcpServers: mergeByKey(
      layerItems.flatMap((items) => items.mcpServers),
      (server) => server.name
    ),
    skills: mergeByKey(
      layerItems.flatMap((items) => items.skills),
      (skill) => skill.id
    ),
    repeatTasks: mergeByKey(
      layerItems.flatMap((items) => items.repeatTasks),
      (task) => task.id
    ),
    knowledgeNotes: mergeByKey(
      layerItems.flatMap((items) => items.knowledgeNotes),
      (knowledgeNote) => knowledgeNote.id
    ),
  })
}

function buildBundle(
  options: ExportBundleOptions | undefined,
  data: {
    agentProfiles: BundleAgentProfile[]
    mcpServers: BundleMCPServer[]
    skills: BundleSkill[]
    repeatTasks: BundleRepeatTask[]
    knowledgeNotes: BundleKnowledgeNote[]
  }
): DotAgentsBundle {
  const publicMetadata = sanitizeBundlePublicMetadata(options?.publicMetadata)

  return {
    manifest: {
      version: 1,
      name: options?.name || "My Agent Configuration",
      description: options?.description,
      createdAt: new Date().toISOString(),
      exportedFrom: "dotagents-desktop",
      ...(publicMetadata ? { publicMetadata } : {}),
      components: {
        agentProfiles: data.agentProfiles.length,
        mcpServers: data.mcpServers.length,
        skills: data.skills.length,
        repeatTasks: data.repeatTasks.length,
        knowledgeNotes: data.knowledgeNotes.length,
      },
    },
    agentProfiles: data.agentProfiles,
    mcpServers: data.mcpServers,
    skills: data.skills,
    repeatTasks: data.repeatTasks,
    knowledgeNotes: data.knowledgeNotes,
  }
}

function mergeByKey<T>(
  values: T[],
  getKey: (value: T) => string
): T[] {
  const merged = new Map<string, T>()
  for (const value of values) {
    merged.set(getKey(value), value)
  }
  return Array.from(merged.values())
}

export async function exportBundle(
  agentsDir: string,
  options?: ExportBundleOptions
): Promise<DotAgentsBundle> {
  const layer = getAgentsLayerPaths(agentsDir)
  const components = { ...DEFAULT_EXPORT_COMPONENTS, ...options?.components }

  const profiles = components.agentProfiles
    ? loadAgentProfilesForBundle(layer, options)
    : []
  const mcpServers = components.mcpServers ? loadMCPServersForBundle(layer, options) : []
  const skills = components.skills ? loadSkillsForBundle(layer, options) : []
  const repeatTasks = components.repeatTasks ? loadRepeatTasksForBundle(layer, options) : []
  const knowledgeNotes = components.knowledgeNotes ? loadKnowledgeNotesForBundle(layer, options) : []

  const bundle = buildBundle(options, {
    agentProfiles: profiles,
    mcpServers,
    skills,
    repeatTasks,
    knowledgeNotes,
  })

  logApp("[bundle-service] Exported bundle", {
    profiles: profiles.length,
    mcpServers: mcpServers.length,
    skills: skills.length,
    repeatTasks: repeatTasks.length,
    knowledgeNotes: knowledgeNotes.length,
  })

  return bundle
}

export async function exportBundleFromLayers(
  agentsDirs: string[],
  options?: ExportBundleOptions
): Promise<DotAgentsBundle> {
  const normalizedDirs = Array.from(
    new Set(agentsDirs.map((dir) => path.resolve(dir)).filter((dir) => dir.length > 0))
  )

  if (normalizedDirs.length === 0) {
    throw new Error("No agents directories provided for bundle export")
  }

  if (normalizedDirs.length === 1) {
    return exportBundle(normalizedDirs[0], options)
  }

  // Layer order matters: later layers override earlier layers by id/name.
  const layerBundles = await Promise.all(
    normalizedDirs.map((dir) => exportBundle(dir, options))
  )

  const mergedAgentProfiles = mergeByKey(
    layerBundles.flatMap((bundle) => bundle.agentProfiles),
    (profile) => profile.id
  )
  const mergedMcpServers = mergeByKey(
    layerBundles.flatMap((bundle) => bundle.mcpServers),
    (server) => server.name
  )
  const mergedSkills = mergeByKey(
    layerBundles.flatMap((bundle) => bundle.skills),
    (skill) => skill.id
  )
  const mergedRepeatTasks = mergeByKey(
    layerBundles.flatMap((bundle) => bundle.repeatTasks),
    (task) => task.id
  )
  const mergedKnowledgeNotes = mergeByKey(
    layerBundles.flatMap((bundle) => bundle.knowledgeNotes),
    (knowledgeNote) => knowledgeNote.id
  )

  const mergedBundle = buildBundle(options, {
    agentProfiles: mergedAgentProfiles,
    mcpServers: mergedMcpServers,
    skills: mergedSkills,
    repeatTasks: mergedRepeatTasks,
    knowledgeNotes: mergedKnowledgeNotes,
  })

  logApp("[bundle-service] Exported merged bundle", {
    layers: normalizedDirs.length,
    profiles: mergedAgentProfiles.length,
    mcpServers: mergedMcpServers.length,
    skills: mergedSkills.length,
    repeatTasks: mergedRepeatTasks.length,
    knowledgeNotes: mergedKnowledgeNotes.length,
  })

  return mergedBundle
}

async function saveBundleToFile(bundle: DotAgentsBundle): Promise<ExportBundleToFileResult> {
  try {
    const bundleJson = JSON.stringify(bundle, null, 2)

    const saveDialogOptions: SaveDialogOptions = {
      title: "Export Agent Configuration",
      defaultPath: `${bundle.manifest.name.replace(/[^a-zA-Z0-9-_ ]/g, "")}.dotagents`,
      filters: [
        { name: "DotAgents Bundle", extensions: ["dotagents"] },
        { name: "JSON", extensions: ["json"] },
      ],
    }
    let result: Awaited<ReturnType<typeof dialog.showSaveDialog>>
    try {
      const win = BrowserWindow.getFocusedWindow()
      result = win
        ? await dialog.showSaveDialog(win, saveDialogOptions)
        : await dialog.showSaveDialog(saveDialogOptions)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logApp("[bundle-service] Failed to open save dialog", { error })
      return { success: false, filePath: null, canceled: false, error: errorMessage }
    }

    if (result.canceled || !result.filePath) {
      return { success: false, filePath: null, canceled: true }
    }

    try {
      fs.writeFileSync(result.filePath, bundleJson, "utf-8")
      logApp("[bundle-service] Bundle saved to", { filePath: result.filePath })
      return { success: true, filePath: result.filePath, canceled: false }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logApp("[bundle-service] Failed to save bundle", { filePath: result.filePath, error })
      return { success: false, filePath: null, canceled: false, error: errorMessage }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logApp("[bundle-service] Failed to serialize bundle for export", { error })
    return { success: false, filePath: null, canceled: false, error: errorMessage }
  }
}

export async function exportBundleToFile(
  agentsDir: string,
  options?: ExportBundleOptions
): Promise<ExportBundleToFileResult> {
  let bundle: DotAgentsBundle
  try {
    bundle = await exportBundle(agentsDir, options)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logApp("[bundle-service] Failed to prepare bundle export", { error })
    return { success: false, filePath: null, canceled: false, error: errorMessage }
  }

  return saveBundleToFile(bundle)
}

export async function exportBundleToFileFromLayers(
  agentsDirs: string[],
  options?: ExportBundleOptions
): Promise<ExportBundleToFileResult> {
  let bundle: DotAgentsBundle
  try {
    bundle = await exportBundleFromLayers(agentsDirs, options)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logApp("[bundle-service] Failed to prepare merged bundle export", { error })
    return { success: false, filePath: null, canceled: false, error: errorMessage }
  }

  return saveBundleToFile(bundle)
}

// ============================================================================
// Preview (for import)
// ============================================================================

function isSupportedBundleFile(filePath: string): boolean {
  const extension = path.extname(filePath).toLowerCase()
  return BUNDLE_FILE_EXTENSIONS.has(extension)
}

export function findHubBundleHandoffFilePath(candidates: readonly string[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.trim().length === 0) continue

    const normalizedPath = path.resolve(candidate)
    if (path.extname(normalizedPath).toLowerCase() !== HUB_BUNDLE_FILE_EXTENSION) {
      continue
    }

    try {
      const stats = fs.statSync(normalizedPath)
      if (stats.isFile()) {
        return normalizedPath
      }
    } catch {
      // Ignore missing/inaccessible candidates while scanning argv or OS handoff inputs.
    }
  }

  return null
}

type BundleManifestInputComponents = Omit<BundleManifest["components"], "repeatTasks" | "knowledgeNotes"> & {
  repeatTasks?: number
  knowledgeNotes?: number
}

type ParsedDotAgentsBundle = Omit<DotAgentsBundle, "manifest" | "repeatTasks" | "knowledgeNotes"> & {
  manifest: Omit<BundleManifest, "components"> & {
    components: BundleManifestInputComponents
  }
  repeatTasks?: BundleRepeatTask[]
  knowledgeNotes?: BundleKnowledgeNote[]
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

function isBundleMcpServer(value: unknown): value is BundleMCPServer {
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
  if (!value.times.every((t) => typeof t === "string")) return false
  if (value.type === "weekly") {
    if (!Array.isArray(value.daysOfWeek) || value.daysOfWeek.length === 0) return false
    if (!value.daysOfWeek.every((d) => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6)) {
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

function validateBundle(bundle: unknown): bundle is ParsedDotAgentsBundle {
  if (!bundle || typeof bundle !== "object") return false
  const b = bundle as Record<string, unknown>
  if (!b.manifest || typeof b.manifest !== "object") return false
  const m = b.manifest as Record<string, unknown>
  if (m.version !== 1) return false
  if (!isNonEmptyString(m.name)) return false
  if (!isOptionalString(m.description)) return false
  if (typeof m.createdAt !== "string" || Number.isNaN(Date.parse(m.createdAt))) return false
  if (!isNonEmptyString(m.exportedFrom)) return false
  if (m.publicMetadata !== undefined && !isBundlePublicMetadata(m.publicMetadata)) return false
  if (!hasValidManifestComponents(m.components)) return false
  if (!Array.isArray(b.agentProfiles) || !b.agentProfiles.every(isBundleAgentProfile)) return false
  if (!Array.isArray(b.mcpServers) || !b.mcpServers.every(isBundleMcpServer)) return false
  if (!Array.isArray(b.skills) || !b.skills.every(isBundleSkill)) return false
  if ("repeatTasks" in b && b.repeatTasks !== undefined) {
    if (!Array.isArray(b.repeatTasks) || !b.repeatTasks.every(isBundleRepeatTask)) return false
  }
  if ("knowledgeNotes" in b && b.knowledgeNotes !== undefined) {
    if (!Array.isArray(b.knowledgeNotes) || !b.knowledgeNotes.every(isBundleKnowledgeNote)) return false
  }
  return true
}

function normalizeBundle(bundle: ParsedDotAgentsBundle): DotAgentsBundle {
  const repeatTasks = Array.isArray(bundle.repeatTasks)
    ? bundle.repeatTasks.map(normalizeBundleRepeatTask)
    : []
  const knowledgeNotes = Array.isArray(bundle.knowledgeNotes) ? bundle.knowledgeNotes : []
  const rawComponents = isRecordObject(bundle.manifest.components)
    ? (bundle.manifest.components as Record<string, unknown>)
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

export function previewBundle(filePath: string): DotAgentsBundle | null {
  try {
    const normalizedPath = path.resolve(filePath)
    if (!isSupportedBundleFile(normalizedPath)) {
      throw new Error("Unsupported bundle file extension")
    }

    const stats = fs.statSync(normalizedPath)
    if (!stats.isFile()) {
      throw new Error("Bundle path must be a file")
    }

    const content = fs.readFileSync(normalizedPath, "utf-8")
    const parsed = JSON.parse(content) as unknown

    if (!validateBundle(parsed)) {
      throw new Error("Invalid bundle format or unsupported version")
    }

    return normalizeBundle(parsed)
  } catch (error) {
    logApp("[bundle-service] Failed to preview bundle", { filePath, error })
    return null
  }
}

/**
 * Preview a bundle and detect conflicts with existing items in the target layer.
 */
export function previewBundleWithConflicts(
  filePath: string,
  targetAgentsDir: string
): BundlePreviewResult {
  const bundle = previewBundle(filePath)
  if (!bundle) {
    return { success: false, error: "Failed to parse bundle file" }
  }

  const layer = getAgentsLayerPaths(targetAgentsDir)

  // Load existing items
  const existingProfiles = loadAgentProfilesLayer(layer)
  const existingSkills = loadAgentsSkillsLayer(layer)
  const existingTasks = loadTasksLayer(layer)
  const existingKnowledgeNotes = loadAgentsKnowledgeNotesLayer(layer)

  // Load existing MCP servers
  const mcpConfig = safeReadJsonFileSync<Record<string, unknown>>(layer.mcpJsonPath, {
    defaultValue: {},
  })
  const existingMcpServers = new Set(Object.keys(readMcpServersFromConfig(mcpConfig)))

  // Detect conflicts
  const conflicts = {
    agentProfiles: bundle.agentProfiles
      .filter(p => existingProfiles.originById.has(p.id))
      .map(p => {
        const existing = existingProfiles.profiles.find(ep => ep.id === p.id)
        return { id: p.id, name: p.name, existingName: existing?.name }
      }),
    mcpServers: bundle.mcpServers
      .filter(s => existingMcpServers.has(s.name))
      .map(s => ({ id: s.name, name: s.name })),
    skills: bundle.skills
      .filter(s => existingSkills.originById.has(s.id))
      .map(s => {
        const existing = existingSkills.skills.find(es => es.id === s.id)
        return { id: s.id, name: s.name, existingName: existing?.name }
      }),
    repeatTasks: bundle.repeatTasks
      .filter(t => existingTasks.originById.has(t.id))
      .map(t => {
        const existing = existingTasks.tasks.find(et => et.id === t.id)
        return { id: t.id, name: t.name, existingName: existing?.name }
      }),
    knowledgeNotes: bundle.knowledgeNotes
      .filter(note => existingKnowledgeNotes.originById.has(note.id))
      .map(note => {
        const existing = existingKnowledgeNotes.notes.find(existingNote => existingNote.id === note.id)
        return { id: note.id, name: note.title, existingName: existing?.title }
      }),
  }

  return { success: true, filePath, bundle, conflicts }
}

export async function previewBundleFromDialog(): Promise<{
  filePath: string
  bundle: DotAgentsBundle
} | null> {
  const openDialogOptions: OpenDialogOptions = {
    title: "Select Agent Configuration Bundle",
    properties: ["openFile"],
    filters: [{ name: "DotAgents Bundle", extensions: ["dotagents", "json"] }],
  }
  const win = BrowserWindow.getFocusedWindow()
  const result = win
    ? await dialog.showOpenDialog(win, openDialogOptions)
    : await dialog.showOpenDialog(openDialogOptions)

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const selectedPath = result.filePaths[0]
  const bundle = previewBundle(selectedPath)
  if (!bundle) {
    return null
  }

  return { filePath: selectedPath, bundle }
}

// ============================================================================
// Import
// ============================================================================

/**
 * Generate a unique ID by appending a suffix.
 * Used when renaming conflicting items during import.
 */
function generateUniqueId(baseId: string, existingIds: Set<string>): string {
  let counter = 1
  let newId = `${baseId}_imported`
  while (existingIds.has(newId)) {
    counter++
    newId = `${baseId}_imported_${counter}`
  }
  return newId
}

/**
 * Import a bundle into the target .agents directory.
 * Handles conflicts according to the specified strategy.
 */
export async function importBundle(
  filePath: string,
  targetAgentsDir: string,
  options: ImportOptions
): Promise<ImportBundleResult> {
  const result: ImportBundleResult = {
    success: false,
    agentProfiles: [],
    mcpServers: [],
    skills: [],
    repeatTasks: [],
    knowledgeNotes: [],
    errors: [],
  }

  // Parse bundle
  const bundle = previewBundle(filePath)
  if (!bundle) {
    result.errors.push("Failed to parse bundle file")
    return result
  }

  const layer = getAgentsLayerPaths(targetAgentsDir)
  const { conflictStrategy } = options
  const components = options.components ?? {
    agentProfiles: true,
    mcpServers: true,
    skills: true,
    repeatTasks: true,
    knowledgeNotes: true,
  }

  // Ensure directories exist
  fs.mkdirSync(targetAgentsDir, { recursive: true })

  // Import agent profiles
  if (components.agentProfiles !== false) {
    const existingProfiles = loadAgentProfilesLayer(layer)
    const existingIds = new Set(existingProfiles.profiles.map(p => p.id))

    for (const bundleProfile of bundle.agentProfiles) {
      try {
        const exists = existingIds.has(bundleProfile.id)

        if (exists && conflictStrategy === "skip") {
          result.agentProfiles.push({
            id: bundleProfile.id,
            name: bundleProfile.name,
            action: "skipped",
          })
          continue
        }

        let finalId = bundleProfile.id
        let action: ImportItemResult["action"] = "imported"

        if (exists && conflictStrategy === "rename") {
          finalId = generateUniqueId(bundleProfile.id, existingIds)
          action = "renamed"
        } else if (exists && conflictStrategy === "overwrite") {
          action = "overwritten"
        }

        // Convert bundle profile to full AgentProfile
        const now = Date.now()
        const connection: AgentProfileConnection = {
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

        const fullProfile: AgentProfile = {
          id: finalId,
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

        writeAgentsProfileFiles(layer, fullProfile)
        existingIds.add(finalId)

        result.agentProfiles.push({
          id: bundleProfile.id,
          name: bundleProfile.name,
          action,
          newId: action === "renamed" ? finalId : undefined,
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        result.agentProfiles.push({
          id: bundleProfile.id,
          name: bundleProfile.name,
          action: "skipped",
          error: msg,
        })
        result.errors.push(`Agent profile "${bundleProfile.name}": ${msg}`)
      }
    }
  }

  // Import MCP servers
  if (components.mcpServers !== false) {
    try {
      const mcpConfig = safeReadJsonFileSync<Record<string, unknown>>(layer.mcpJsonPath, {
        defaultValue: {},
      })
      const mcpServers = { ...readMcpServersFromConfig(mcpConfig) }
      const existingNames = new Set(Object.keys(mcpServers))
      let modified = false

      for (const bundleServer of bundle.mcpServers) {
        const exists = existingNames.has(bundleServer.name)

        if (exists && conflictStrategy === "skip") {
          result.mcpServers.push({
            id: bundleServer.name,
            name: bundleServer.name,
            action: "skipped",
          })
          continue
        }

        let finalName = bundleServer.name
        let action: ImportItemResult["action"] = "imported"

        if (exists && conflictStrategy === "rename") {
          finalName = generateUniqueId(bundleServer.name, existingNames)
          action = "renamed"
        } else if (exists && conflictStrategy === "overwrite") {
          action = "overwritten"
        }

        // Build server config
        const serverConfig: Record<string, unknown> = {}
        if (bundleServer.command) serverConfig.command = bundleServer.command
        if (bundleServer.args) serverConfig.args = bundleServer.args
        if (bundleServer.transport) serverConfig.transport = bundleServer.transport
        if (bundleServer.enabled === false) serverConfig.disabled = true

        mcpServers[finalName] = serverConfig
        existingNames.add(finalName)
        modified = true

        result.mcpServers.push({
          id: bundleServer.name,
          name: bundleServer.name,
          action,
          newId: action === "renamed" ? finalName : undefined,
        })
      }

      if (modified) {
        const newMcpConfig = writeCanonicalMcpConfig(mcpConfig, mcpServers)
        safeWriteJsonFileSync(layer.mcpJsonPath, newMcpConfig, {
          backupDir: layer.backupsDir,
          maxBackups: 10,
          pretty: true,
        })
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      result.errors.push(`MCP servers import failed: ${msg}`)
    }
  }

  // Import skills
  if (components.skills !== false) {
    const existingSkills = loadAgentsSkillsLayer(layer)
    const existingIds = new Set(existingSkills.skills.map(s => s.id))

    for (const bundleSkill of bundle.skills) {
      try {
        const exists = existingIds.has(bundleSkill.id)

        if (exists && conflictStrategy === "skip") {
          result.skills.push({
            id: bundleSkill.id,
            name: bundleSkill.name,
            action: "skipped",
          })
          continue
        }

        let finalId = bundleSkill.id
        let action: ImportItemResult["action"] = "imported"

        if (exists && conflictStrategy === "rename") {
          finalId = generateUniqueId(bundleSkill.id, existingIds)
          action = "renamed"
        } else if (exists && conflictStrategy === "overwrite") {
          action = "overwritten"
        }

        const now = Date.now()
        const fullSkill: AgentSkill = {
          id: finalId,
          name: bundleSkill.name,
          description: bundleSkill.description || "",
          instructions: bundleSkill.instructions || "",
          createdAt: now,
          updatedAt: now,
          source: "imported",
        }

        // Create skill directory and write file
        const skillDir = skillIdToDirPath(layer, finalId)
        fs.mkdirSync(skillDir, { recursive: true })
        writeAgentsSkillFile(layer, fullSkill)
        existingIds.add(finalId)

        result.skills.push({
          id: bundleSkill.id,
          name: bundleSkill.name,
          action,
          newId: action === "renamed" ? finalId : undefined,
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        result.skills.push({
          id: bundleSkill.id,
          name: bundleSkill.name,
          action: "skipped",
          error: msg,
        })
        result.errors.push(`Skill "${bundleSkill.name}": ${msg}`)
      }
    }
  }

  // Import repeat tasks
  if (components.repeatTasks !== false) {
    const existingTasks = loadTasksLayer(layer)
    const existingIds = new Set(existingTasks.tasks.map(t => t.id))

    for (const bundleTask of bundle.repeatTasks) {
      try {
        const exists = existingIds.has(bundleTask.id)

        if (exists && conflictStrategy === "skip") {
          result.repeatTasks.push({
            id: bundleTask.id,
            name: bundleTask.name,
            action: "skipped",
          })
          continue
        }

        let finalId = bundleTask.id
        let action: ImportItemResult["action"] = "imported"

        if (exists && conflictStrategy === "rename") {
          finalId = generateUniqueId(bundleTask.id, existingIds)
          action = "renamed"
        } else if (exists && conflictStrategy === "overwrite") {
          action = "overwritten"
        }

        const fullTask: LoopConfig = {
          id: finalId,
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
          // profileId intentionally not imported — may not exist in target
        }

        writeTaskFile(layer, fullTask)
        existingIds.add(finalId)

        result.repeatTasks.push({
          id: bundleTask.id,
          name: bundleTask.name,
          action,
          newId: action === "renamed" ? finalId : undefined,
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        result.repeatTasks.push({
          id: bundleTask.id,
          name: bundleTask.name,
          action: "skipped",
          error: msg,
        })
        result.errors.push(`Repeat task "${bundleTask.name}": ${msg}`)
      }
    }
  }

  // Import knowledge notes
  if (components.knowledgeNotes !== false) {
    const existingKnowledgeNotes = loadAgentsKnowledgeNotesLayer(layer)
    const existingIds = new Set(existingKnowledgeNotes.notes.map(note => note.id))

    for (const bundleKnowledgeNote of bundle.knowledgeNotes) {
      try {
        const exists = existingIds.has(bundleKnowledgeNote.id)

        if (exists && conflictStrategy === "skip") {
          result.knowledgeNotes.push({
            id: bundleKnowledgeNote.id,
            name: bundleKnowledgeNote.title,
            action: "skipped",
          })
          continue
        }

        let finalId = bundleKnowledgeNote.id
        let action: ImportItemResult["action"] = "imported"

        if (exists && conflictStrategy === "rename") {
          finalId = generateUniqueId(bundleKnowledgeNote.id, existingIds)
          action = "renamed"
        } else if (exists && conflictStrategy === "overwrite") {
          action = "overwritten"
        }

        const now = Date.now()
        const fullNote: KnowledgeNote = {
          id: finalId,
          title: bundleKnowledgeNote.title,
          context: bundleKnowledgeNote.context,
          body: bundleKnowledgeNote.body,
          summary: bundleKnowledgeNote.summary,
          tags: bundleKnowledgeNote.tags || [],
          references: bundleKnowledgeNote.references,
          group: bundleKnowledgeNote.group,
          series: bundleKnowledgeNote.series,
          entryType: bundleKnowledgeNote.entryType,
          createdAt: bundleKnowledgeNote.createdAt ?? now,
          updatedAt: now,
        }

        writeKnowledgeNoteFile(layer, fullNote, { slug: finalId })
        existingIds.add(finalId)

        result.knowledgeNotes.push({
          id: bundleKnowledgeNote.id,
          name: bundleKnowledgeNote.title,
          action,
          newId: action === "renamed" ? finalId : undefined,
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        result.knowledgeNotes.push({
          id: bundleKnowledgeNote.id,
          name: bundleKnowledgeNote.title,
          action: "skipped",
          error: msg,
        })
        result.errors.push(`Knowledge note "${bundleKnowledgeNote.title}": ${msg}`)
      }
    }
  }

  result.success = result.errors.length === 0

  logApp("[bundle-service] Import completed", {
    success: result.success,
    profiles: result.agentProfiles.length,
    mcpServers: result.mcpServers.length,
    skills: result.skills.length,
    repeatTasks: result.repeatTasks.length,
    knowledgeNotes: result.knowledgeNotes.length,
    errors: result.errors.length,
  })

  return result
}

/**
 * Import a bundle from a file dialog, with preview and conflict detection.
 */
export async function importBundleFromDialog(
  targetAgentsDir: string,
  options: ImportOptions
): Promise<{
  filePath: string
  result: ImportBundleResult
} | null> {
  const openDialogOptions: OpenDialogOptions = {
    title: "Import Agent Configuration Bundle",
    properties: ["openFile"],
    filters: [{ name: "DotAgents Bundle", extensions: ["dotagents", "json"] }],
  }

  const win = BrowserWindow.getFocusedWindow()
  const dialogResult = win
    ? await dialog.showOpenDialog(win, openDialogOptions)
    : await dialog.showOpenDialog(openDialogOptions)

  if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
    return null
  }

  const selectedPath = dialogResult.filePaths[0]
  const importResult = await importBundle(selectedPath, targetAgentsDir, options)

  return { filePath: selectedPath, result: importResult }
}

// ============================================================================
// Publish Payload Generation
// ============================================================================

/**
 * Generate a publish-ready payload from the local .agents layer(s).
 *
 * Returns both:
 * 1. A HubCatalogItemV1-shaped metadata object for Hub listing
 * 2. The serialized .dotagents bundle JSON for artifact upload/download
 *
 * Requires publicMetadata with at least summary and author.displayName.
 */
export async function generatePublishPayload(
  agentsDirs: string[],
  options: GeneratePublishPayloadOptions
): Promise<HubPublishPayload> {
  if (!options.publicMetadata?.summary) {
    throw new Error("Publish payload requires a summary in publicMetadata")
  }
  if (!options.publicMetadata?.author?.displayName) {
    throw new Error("Publish payload requires author.displayName in publicMetadata")
  }

  const {
    catalogId: requestedCatalogId,
    artifactUrl: requestedArtifactUrl,
    ...exportOptions
  } = options

  const publishOptions: ExportBundleOptions = {
    ...exportOptions,
    components: {
      ...DEFAULT_BUNDLE_PUBLISH_COMPONENT_SELECTION,
      ...options.components,
    },
  }

  const bundle = agentsDirs.length === 1
    ? await exportBundle(agentsDirs[0], publishOptions)
    : await exportBundleFromLayers(agentsDirs, publishOptions)

  const bundleJson = JSON.stringify(bundle, null, 2)
  const now = new Date().toISOString()
  const catalogId = normalizePublishCatalogId(requestedCatalogId, bundle.manifest.name)
  const artifactUrl = normalizePublishArtifactUrl(requestedArtifactUrl, catalogId)
  const artifactFileName = buildPublishArtifactFileName(bundle.manifest.name, catalogId)
  const publicMetadata = bundle.manifest.publicMetadata!

  return {
    catalogItem: {
      id: catalogId,
      name: bundle.manifest.name,
      summary: publicMetadata.summary,
      description: bundle.manifest.description,
      author: publicMetadata.author,
      tags: publicMetadata.tags,
      bundleVersion: 1,
      publishedAt: now,
      updatedAt: now,
      componentCounts: bundle.manifest.components,
      artifact: {
        url: artifactUrl,
        fileName: artifactFileName,
        sizeBytes: Buffer.byteLength(bundleJson, "utf-8"),
      },
      ...(publicMetadata.compatibility
        ? { compatibility: publicMetadata.compatibility }
        : {}),
    },
    bundleJson,
    installUrl: buildHubBundleInstallUrl(artifactUrl),
  }
}
