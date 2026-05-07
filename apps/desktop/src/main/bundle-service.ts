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
  DEFAULT_BUNDLE_PUBLISH_COMPONENT_SELECTION,
  buildAgentProfileFromBundleProfile,
  buildBundleFromSourceLoaders,
  buildBundleImportExistingItems,
  buildBundleImportPreviewConflicts,
  buildExportableBundleItemsFromSources,
  buildKnowledgeNoteFromBundleNote,
  buildRepeatTaskFromBundleTask,
  buildSkillFromBundleSkill,
  createBundleImportErrorResult,
  getBundleExportableItemsFromLayerDirs,
  importDotAgentsBundle,
  isHubBundleHandoffFilePath,
  isSupportedBundleFilePath,
  buildBundleFromLayerDirs,
  normalizeBundleLayerDirs,
  parseDotAgentsBundleJson,
  readBundleMcpServersFromConfig,
  sortExportableBundleItems,
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

function loadMcpConfigForBundle(layer: AgentsLayerPaths): Record<string, unknown> {
  return safeReadJsonFileSync<Record<string, unknown>>(layer.mcpJsonPath, {
    defaultValue: {},
  })
}

function listExportableBundleItemsForLayer(layer: AgentsLayerPaths): ExportableBundleItems {
  return buildExportableBundleItemsFromSources({
    agentProfiles: loadAgentProfilesLayer(layer).profiles,
    mcpConfig: loadMcpConfigForBundle(layer),
    skills: loadAgentsSkillsLayer(layer).skills,
    repeatTasks: loadTasksLayer(layer).tasks,
    knowledgeNotes: loadAgentsKnowledgeNotesLayer(layer).notes,
  })
}

export function getBundleExportableItems(agentsDir: string): ExportableBundleItems {
  const layer = getAgentsLayerPaths(agentsDir)
  return sortExportableBundleItems(listExportableBundleItemsForLayer(layer))
}

export function getBundleExportableItemsFromLayers(agentsDirs: string[]): ExportableBundleItems {
  return getBundleExportableItemsFromLayerDirs(
    agentsDirs,
    getBundleExportableItems,
    {
      resolveDir: (dir) => path.resolve(dir),
      emptyErrorMessage: "No agents directories provided for exportable item listing",
    },
  )
}

export async function exportBundle(
  agentsDir: string,
  options?: ExportBundleOptions
): Promise<DotAgentsBundle> {
  const layer = getAgentsLayerPaths(agentsDir)
  const bundle = buildBundleFromSourceLoaders(options, {
    loadAgentProfiles: () => loadAgentProfilesLayer(layer).profiles,
    loadMcpConfig: () => loadMcpConfigForBundle(layer),
    loadSkills: () => loadAgentsSkillsLayer(layer).skills,
    loadRepeatTasks: () => loadTasksLayer(layer).tasks,
    loadKnowledgeNotes: () => loadAgentsKnowledgeNotesLayer(layer).notes,
  }, {
    exportedFrom: "dotagents-desktop",
  })

  logApp("[bundle-service] Exported bundle", {
    profiles: bundle.agentProfiles.length,
    mcpServers: bundle.mcpServers.length,
    skills: bundle.skills.length,
    repeatTasks: bundle.repeatTasks.length,
    knowledgeNotes: bundle.knowledgeNotes.length,
  })

  return bundle
}

export async function exportBundleFromLayers(
  agentsDirs: string[],
  options?: ExportBundleOptions
): Promise<DotAgentsBundle> {
  const normalizedDirs = normalizeBundleLayerDirs(agentsDirs, (dir) => path.resolve(dir))
  const bundle = await buildBundleFromLayerDirs(
    normalizedDirs,
    (dir) => exportBundle(dir, options),
    options,
    {
      emptyErrorMessage: "No agents directories provided for bundle export",
      buildOptions: { exportedFrom: "dotagents-desktop" },
    },
  )

  if (normalizedDirs.length > 1) {
    logApp("[bundle-service] Exported merged bundle", {
      layers: normalizedDirs.length,
      profiles: bundle.agentProfiles.length,
      mcpServers: bundle.mcpServers.length,
      skills: bundle.skills.length,
      repeatTasks: bundle.repeatTasks.length,
      knowledgeNotes: bundle.knowledgeNotes.length,
    })
  }

  return bundle
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

  const mcpConfig = safeReadJsonFileSync<Record<string, unknown>>(layer.mcpJsonPath, {
    defaultValue: {},
  })
  const conflicts = buildBundleImportPreviewConflicts(
    bundle,
    buildBundleImportExistingItems({
      agentProfiles: loadAgentProfilesLayer(layer).profiles,
      mcpServerNames: Object.keys(readBundleMcpServersFromConfig(mcpConfig)),
      skills: loadAgentsSkillsLayer(layer).skills,
      repeatTasks: loadTasksLayer(layer).tasks,
      knowledgeNotes: loadAgentsKnowledgeNotesLayer(layer).notes,
    }),
  )

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
  const bundle = previewBundle(filePath)
  if (!bundle) {
    return createBundleImportErrorResult("Failed to parse bundle file")
  }

  const layer = getAgentsLayerPaths(targetAgentsDir)

  fs.mkdirSync(targetAgentsDir, { recursive: true })

  const finalResult = await importDotAgentsBundle(bundle, {
    conflictStrategy: options.conflictStrategy,
    components: options.components,
    handlers: {
      loadExistingAgentProfileIds: () => loadAgentProfilesLayer(layer).profiles.map((profile) => profile.id),
      importAgentProfile: (bundleProfile, importAction) => {
        const now = Date.now()
        const fullProfile = buildAgentProfileFromBundleProfile(bundleProfile, { id: importAction.finalId, now })

        writeAgentsProfileFiles(layer, fullProfile)
      },
      loadMcpConfig: () => safeReadJsonFileSync<Record<string, unknown>>(layer.mcpJsonPath, {
        defaultValue: {},
      }),
      saveMcpConfig: (mcpConfig) => {
        safeWriteJsonFileSync(layer.mcpJsonPath, mcpConfig, {
          backupDir: layer.backupsDir,
          maxBackups: 10,
          pretty: true,
        })
      },
      loadExistingSkillIds: () => loadAgentsSkillsLayer(layer).skills.map((skill) => skill.id),
      importSkill: (bundleSkill, importAction) => {
        const now = Date.now()
        const fullSkill = buildSkillFromBundleSkill(bundleSkill, { id: importAction.finalId, now })

        const skillDir = skillIdToDirPath(layer, importAction.finalId)
        fs.mkdirSync(skillDir, { recursive: true })
        writeAgentsSkillFile(layer, fullSkill)
      },
      loadExistingRepeatTaskIds: () => loadTasksLayer(layer).tasks.map((task) => task.id),
      importRepeatTask: (bundleTask, importAction) => {
        const fullTask = buildRepeatTaskFromBundleTask(bundleTask, { id: importAction.finalId })

        writeTaskFile(layer, fullTask)
      },
      loadExistingKnowledgeNoteIds: () => loadAgentsKnowledgeNotesLayer(layer).notes.map((note) => note.id),
      importKnowledgeNote: (bundleKnowledgeNote, importAction) => {
        const now = Date.now()
        const fullNote = buildKnowledgeNoteFromBundleNote(bundleKnowledgeNote, { id: importAction.finalId, now })

        writeKnowledgeNoteFile(layer, fullNote, { slug: importAction.finalId })
      },
    },
  })

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
