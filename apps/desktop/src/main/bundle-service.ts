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
  loadAgentProfilesLayer,
  loadAgentsKnowledgeNotesLayer,
  loadAgentsSkillsLayer,
  loadTasksLayer,
  skillIdToDirPath,
  writeAgentsProfileFiles,
  writeTaskFile,
  writeAgentsSkillFile,
  writeKnowledgeNoteFile,
  taskIdToFilePath,
  type AgentProfile,
  type AgentProfileConnection,
  type AgentSkill,
  type KnowledgeNote,
  type LoopConfig,
} from "@dotagents/core"
import {
  buildHubBundleInstallUrl,
  buildHubPublishArtifactFileName,
  normalizeHubPublishArtifactUrl,
  normalizeHubPublishCatalogId,
  type HubPublishPayload,
} from "@dotagents/shared/hub"
import {
  DEFAULT_BUNDLE_PUBLISH_COMPONENT_SELECTION,
  buildBundleImportPreviewConflicts,
  buildDotAgentsBundle,
  getBundleBuildItems,
  mergeBundleBuildItems,
  mergeExportableBundleItems,
  parseDotAgentsBundle,
  readBundleMcpServersFromConfig,
  sortExportableBundleItems,
  stripBundleSecretsFromObject,
  writeCanonicalBundleMcpConfig,
  type BundleAgentProfile,
  type BundleComponentSelection,
  type BundleImportConflictStrategy,
  type BundleImportItemResult,
  type BundleImportPreviewConflict,
  type BundleImportPreviewConflicts,
  type BundleImportResult,
  type BundleItemSelectionOptions,
  type BundleKnowledgeNote,
  type BundleManifest,
  type BundleMcpServer,
  type BundlePublicMetadata,
  type BundlePublicMetadataAuthor,
  type BundlePublicMetadataCompatibility,
  type BundleRepeatTask,
  type BundleSkill,
  type DotAgentsBundle,
  type ExportableBundleAgentProfile,
  type ExportableBundleItems,
  type ExportableBundleKnowledgeNote,
  type ExportableBundleMcpServer,
  type ExportableBundleRepeatTask,
  type ExportableBundleSkill,
  type ExportBundleRequest,
} from "@dotagents/shared/bundle-api"
import { getAgentsLayerPaths, type AgentsLayerPaths } from "@dotagents/core"
import { safeReadJsonFileSync, safeWriteJsonFileSync } from "@dotagents/core"
import { logApp } from "./debug"

// ============================================================================
// Types
// ============================================================================

export type {
  BundleAgentProfile,
  BundleComponentSelection,
  BundleItemSelectionOptions,
  BundleKnowledgeNote,
  BundleManifest,
  BundlePublicMetadata,
  BundlePublicMetadataAuthor,
  BundlePublicMetadataCompatibility,
  BundleRepeatTask,
  BundleSkill,
  DotAgentsBundle,
  ExportableBundleAgentProfile,
  ExportableBundleItems,
  ExportableBundleKnowledgeNote,
  ExportableBundleRepeatTask,
  ExportableBundleSkill,
}

export type BundleMCPServer = BundleMcpServer
export type ExportableBundleMCPServer = ExportableBundleMcpServer
export type ExportBundleOptions = ExportBundleRequest
export type GeneratePublishPayloadOptions = ExportBundleRequest & {
  publicMetadata: BundlePublicMetadata
  catalogId?: string
  artifactUrl?: string
}

export interface ExportBundleToFileResult {
  success: boolean
  filePath: string | null
  canceled: boolean
  error?: string
}

// ============================================================================
// Import Types
// ============================================================================

export type ImportConflictStrategy = BundleImportConflictStrategy

export interface ImportOptions {
  /** How to handle conflicts when an item with the same ID already exists */
  conflictStrategy: ImportConflictStrategy
  /** Components to import (defaults to all) */
  components?: BundleComponentSelection
}

export type ImportItemResult = BundleImportItemResult

export type ImportBundleResult = BundleImportResult

// ============================================================================
// Preview Types
// ============================================================================

export type PreviewConflict = BundleImportPreviewConflict

export interface BundlePreviewResult {
  success: boolean
  filePath?: string
  bundle?: DotAgentsBundle
  conflicts?: BundleImportPreviewConflicts
  error?: string
}

// ============================================================================
// Secret stripping
// ============================================================================

const BUNDLE_FILE_EXTENSIONS = new Set([".dotagents", ".json"])
const HUB_BUNDLE_FILE_EXTENSION = ".dotagents"

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
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
  const mcpServers = readBundleMcpServersFromConfig(mcpConfig)

  if (typeof mcpServers === "object" && mcpServers !== null) {
    for (const [name, config] of Object.entries(mcpServers)) {
      if (selectedMcpServerNames && !selectedMcpServerNames.has(name)) continue
      if (typeof config !== "object" || config === null) continue
      const serverConfig = config as Record<string, unknown>

      // Strip secrets from the server config
      const stripped = stripBundleSecretsFromObject(serverConfig)

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

  return mergeExportableBundleItems(layerItems)
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

  const bundle = buildDotAgentsBundle(options, {
    agentProfiles: profiles,
    mcpServers,
    skills,
    repeatTasks,
    knowledgeNotes,
  }, {
    exportedFrom: "dotagents-desktop",
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

  const mergedItems = mergeBundleBuildItems(layerBundles.map(getBundleBuildItems))
  const mergedBundle = buildDotAgentsBundle(options, mergedItems, {
    exportedFrom: "dotagents-desktop",
  })

  logApp("[bundle-service] Exported merged bundle", {
    layers: normalizedDirs.length,
    profiles: mergedItems.agentProfiles.length,
    mcpServers: mergedItems.mcpServers.length,
    skills: mergedItems.skills.length,
    repeatTasks: mergedItems.repeatTasks.length,
    knowledgeNotes: mergedItems.knowledgeNotes.length,
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
    const bundle = parseDotAgentsBundle(parsed)

    if (!bundle) {
      throw new Error("Invalid bundle format or unsupported version")
    }

    return bundle
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
  const existingMcpServers = Object.keys(readBundleMcpServersFromConfig(mcpConfig))
  const conflicts = buildBundleImportPreviewConflicts(bundle, {
    agentProfiles: existingProfiles.profiles.map((profile) => ({ id: profile.id, name: profile.name })),
    mcpServers: existingMcpServers.map((name) => ({ id: name })),
    skills: existingSkills.skills.map((skill) => ({ id: skill.id, name: skill.name })),
    repeatTasks: existingTasks.tasks.map((task) => ({ id: task.id, name: task.name })),
    knowledgeNotes: existingKnowledgeNotes.notes.map((note) => ({ id: note.id, name: note.title })),
  })

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
      const mcpServers = { ...readBundleMcpServersFromConfig(mcpConfig) }
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
        const newMcpConfig = writeCanonicalBundleMcpConfig(mcpConfig, mcpServers)
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
  const catalogId = normalizeHubPublishCatalogId(requestedCatalogId, bundle.manifest.name)
  const artifactUrl = normalizeHubPublishArtifactUrl(requestedArtifactUrl, catalogId)
  const artifactFileName = buildHubPublishArtifactFileName(bundle.manifest.name, catalogId)
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
