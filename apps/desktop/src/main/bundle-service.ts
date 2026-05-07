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
} from "@dotagents/core"
import {
  assertHubPublishPublicMetadata,
  buildHubPublishPayloadFromBundle,
  type HubPublishPayload,
} from "@dotagents/shared/hub"
import {
  DEFAULT_BUNDLE_COMPONENT_SELECTION,
  DEFAULT_BUNDLE_PUBLISH_COMPONENT_SELECTION,
  buildAgentProfileFromBundleProfile,
  buildBundleAgentProfilesFromProfiles,
  buildBundleImportPreviewConflicts,
  buildBundleKnowledgeNotesFromNotes,
  buildBundleImportItemErrorResult,
  buildBundleImportItemResult,
  buildBundleMcpServersFromConfig,
  buildBundleRepeatTasksFromTasks,
  buildBundleSkillsFromSkills,
  buildDotAgentsBundle,
  buildExportableBundleAgentProfiles,
  buildExportableBundleKnowledgeNotes,
  buildExportableBundleMcpServers,
  buildExportableBundleRepeatTasks,
  buildExportableBundleSkills,
  buildKnowledgeNoteFromBundleNote,
  buildMcpServerConfigFromBundleServer,
  buildRepeatTaskFromBundleTask,
  buildSkillFromBundleSkill,
  createBundleImportResult,
  finalizeBundleImportResult,
  formatBundleImportItemError,
  getBundleBuildItems,
  isHubBundleHandoffFilePath,
  isSupportedBundleFilePath,
  mergeBundleBuildItems,
  mergeExportableBundleItems,
  parseDotAgentsBundleJson,
  readBundleMcpServersFromConfig,
  resolveBundleImportItemAction,
  sortExportableBundleItems,
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
// Export
// ============================================================================

function loadAgentProfilesForBundle(
  layer: AgentsLayerPaths,
  options?: BundleItemSelectionOptions
): BundleAgentProfile[] {
  return buildBundleAgentProfilesFromProfiles(
    loadAgentProfilesLayer(layer).profiles,
    options?.agentProfileIds
  )
}

function loadMCPServersForBundle(
  layer: AgentsLayerPaths,
  options?: BundleItemSelectionOptions
): BundleMCPServer[] {
  const mcpConfig = safeReadJsonFileSync<Record<string, unknown>>(layer.mcpJsonPath, {
    defaultValue: {},
  })
  return buildBundleMcpServersFromConfig(mcpConfig, options?.mcpServerNames)
}

function loadSkillsForBundle(layer: AgentsLayerPaths, options?: BundleItemSelectionOptions): BundleSkill[] {
  return buildBundleSkillsFromSkills(
    loadAgentsSkillsLayer(layer).skills,
    options?.skillIds
  )
}

function loadRepeatTasksForBundle(layer: AgentsLayerPaths, options?: BundleItemSelectionOptions): BundleRepeatTask[] {
  return buildBundleRepeatTasksFromTasks(
    loadTasksLayer(layer).tasks,
    options?.repeatTaskIds
  )
}

function loadKnowledgeNotesForBundle(layer: AgentsLayerPaths, options?: BundleItemSelectionOptions): BundleKnowledgeNote[] {
  return buildBundleKnowledgeNotesFromNotes(
    loadAgentsKnowledgeNotesLayer(layer).notes,
    options?.knowledgeNoteIds
  )
}

function listExportableBundleItemsForLayer(layer: AgentsLayerPaths): ExportableBundleItems {
  return {
    agentProfiles: buildExportableBundleAgentProfiles(loadAgentProfilesLayer(layer).profiles),
    mcpServers: buildExportableBundleMcpServers(loadMCPServersForBundle(layer)),
    skills: buildExportableBundleSkills(loadAgentsSkillsLayer(layer).skills),
    repeatTasks: buildExportableBundleRepeatTasks(loadTasksLayer(layer).tasks),
    knowledgeNotes: buildExportableBundleKnowledgeNotes(loadAgentsKnowledgeNotesLayer(layer).notes),
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
  const components = { ...DEFAULT_BUNDLE_COMPONENT_SELECTION, ...options?.components }

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

export function findHubBundleHandoffFilePath(candidates: readonly string[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.trim().length === 0) continue

    const normalizedPath = path.resolve(candidate)
    if (!isHubBundleHandoffFilePath(normalizedPath)) {
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
    if (!isSupportedBundleFilePath(normalizedPath)) {
      throw new Error("Unsupported bundle file extension")
    }

    const stats = fs.statSync(normalizedPath)
    if (!stats.isFile()) {
      throw new Error("Bundle path must be a file")
    }

    const content = fs.readFileSync(normalizedPath, "utf-8")
    const bundle = parseDotAgentsBundleJson(content)

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
 * Import a bundle into the target .agents directory.
 * Handles conflicts according to the specified strategy.
 */
export async function importBundle(
  filePath: string,
  targetAgentsDir: string,
  options: ImportOptions
): Promise<ImportBundleResult> {
  const result = createBundleImportResult()

  // Parse bundle
  const bundle = previewBundle(filePath)
  if (!bundle) {
    result.errors.push("Failed to parse bundle file")
    return finalizeBundleImportResult(result)
  }

  const layer = getAgentsLayerPaths(targetAgentsDir)
  const { conflictStrategy } = options
  const components = options.components ?? DEFAULT_BUNDLE_COMPONENT_SELECTION

  // Ensure directories exist
  fs.mkdirSync(targetAgentsDir, { recursive: true })

  // Import agent profiles
  if (components.agentProfiles !== false) {
    const existingProfiles = loadAgentProfilesLayer(layer)
    const existingIds = new Set(existingProfiles.profiles.map(p => p.id))

    for (const bundleProfile of bundle.agentProfiles) {
      try {
        const importAction = resolveBundleImportItemAction(bundleProfile.id, existingIds, conflictStrategy)

        if (!importAction.shouldImport) {
          result.agentProfiles.push(buildBundleImportItemResult(bundleProfile.id, bundleProfile.name, importAction))
          continue
        }

        const now = Date.now()
        const fullProfile = buildAgentProfileFromBundleProfile(bundleProfile, { id: importAction.finalId, now })

        writeAgentsProfileFiles(layer, fullProfile)
        existingIds.add(importAction.finalId)

        result.agentProfiles.push(buildBundleImportItemResult(bundleProfile.id, bundleProfile.name, importAction))
      } catch (error) {
        result.agentProfiles.push(buildBundleImportItemErrorResult(bundleProfile.id, bundleProfile.name, error))
        result.errors.push(formatBundleImportItemError("Agent profile", bundleProfile.name, error))
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
        const importAction = resolveBundleImportItemAction(bundleServer.name, existingNames, conflictStrategy)

        if (!importAction.shouldImport) {
          result.mcpServers.push(buildBundleImportItemResult(bundleServer.name, bundleServer.name, importAction))
          continue
        }

        mcpServers[importAction.finalId] = buildMcpServerConfigFromBundleServer(bundleServer)
        existingNames.add(importAction.finalId)
        modified = true

        result.mcpServers.push(buildBundleImportItemResult(bundleServer.name, bundleServer.name, importAction))
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
        const importAction = resolveBundleImportItemAction(bundleSkill.id, existingIds, conflictStrategy)

        if (!importAction.shouldImport) {
          result.skills.push(buildBundleImportItemResult(bundleSkill.id, bundleSkill.name, importAction))
          continue
        }

        const now = Date.now()
        const fullSkill = buildSkillFromBundleSkill(bundleSkill, { id: importAction.finalId, now })

        // Create skill directory and write file
        const skillDir = skillIdToDirPath(layer, importAction.finalId)
        fs.mkdirSync(skillDir, { recursive: true })
        writeAgentsSkillFile(layer, fullSkill)
        existingIds.add(importAction.finalId)

        result.skills.push(buildBundleImportItemResult(bundleSkill.id, bundleSkill.name, importAction))
      } catch (error) {
        result.skills.push(buildBundleImportItemErrorResult(bundleSkill.id, bundleSkill.name, error))
        result.errors.push(formatBundleImportItemError("Skill", bundleSkill.name, error))
      }
    }
  }

  // Import repeat tasks
  if (components.repeatTasks !== false) {
    const existingTasks = loadTasksLayer(layer)
    const existingIds = new Set(existingTasks.tasks.map(t => t.id))

    for (const bundleTask of bundle.repeatTasks) {
      try {
        const importAction = resolveBundleImportItemAction(bundleTask.id, existingIds, conflictStrategy)

        if (!importAction.shouldImport) {
          result.repeatTasks.push(buildBundleImportItemResult(bundleTask.id, bundleTask.name, importAction))
          continue
        }

        const fullTask = buildRepeatTaskFromBundleTask(bundleTask, { id: importAction.finalId })

        writeTaskFile(layer, fullTask)
        existingIds.add(importAction.finalId)

        result.repeatTasks.push(buildBundleImportItemResult(bundleTask.id, bundleTask.name, importAction))
      } catch (error) {
        result.repeatTasks.push(buildBundleImportItemErrorResult(bundleTask.id, bundleTask.name, error))
        result.errors.push(formatBundleImportItemError("Repeat task", bundleTask.name, error))
      }
    }
  }

  // Import knowledge notes
  if (components.knowledgeNotes !== false) {
    const existingKnowledgeNotes = loadAgentsKnowledgeNotesLayer(layer)
    const existingIds = new Set(existingKnowledgeNotes.notes.map(note => note.id))

    for (const bundleKnowledgeNote of bundle.knowledgeNotes) {
      try {
        const importAction = resolveBundleImportItemAction(bundleKnowledgeNote.id, existingIds, conflictStrategy)

        if (!importAction.shouldImport) {
          result.knowledgeNotes.push(buildBundleImportItemResult(
            bundleKnowledgeNote.id,
            bundleKnowledgeNote.title,
            importAction,
          ))
          continue
        }

        const now = Date.now()
        const fullNote = buildKnowledgeNoteFromBundleNote(bundleKnowledgeNote, { id: importAction.finalId, now })

        writeKnowledgeNoteFile(layer, fullNote, { slug: importAction.finalId })
        existingIds.add(importAction.finalId)

        result.knowledgeNotes.push(buildBundleImportItemResult(
          bundleKnowledgeNote.id,
          bundleKnowledgeNote.title,
          importAction,
        ))
      } catch (error) {
        result.knowledgeNotes.push(buildBundleImportItemErrorResult(
          bundleKnowledgeNote.id,
          bundleKnowledgeNote.title,
          error,
        ))
        result.errors.push(formatBundleImportItemError("Knowledge note", bundleKnowledgeNote.title, error))
      }
    }
  }

  const finalResult = finalizeBundleImportResult(result)

  logApp("[bundle-service] Import completed", {
    success: finalResult.success,
    profiles: finalResult.agentProfiles.length,
    mcpServers: finalResult.mcpServers.length,
    skills: finalResult.skills.length,
    repeatTasks: finalResult.repeatTasks.length,
    knowledgeNotes: finalResult.knowledgeNotes.length,
    errors: finalResult.errors.length,
  })

  return finalResult
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
  assertHubPublishPublicMetadata(options.publicMetadata)

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

  return buildHubPublishPayloadFromBundle(bundle, {
    catalogId: requestedCatalogId,
    artifactUrl: requestedArtifactUrl,
  })
}
