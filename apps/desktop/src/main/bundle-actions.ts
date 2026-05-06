import { randomUUID } from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {
  exportBundleAction,
  getBundleExportableItemsAction,
  importBundleAction,
  previewBundleImportAction,
  type BundleActionOptions,
  type BundleActionResult,
  type BundleImportPreview,
  type ImportBundleRequest,
  type ExportBundleRequest,
  type PreviewBundleImportRequest,
} from "@dotagents/shared/bundle-api"
import {
  exportBundleFromLayers,
  getBundleExportableItemsFromLayers,
  importBundle as importBundleFromFile,
  previewBundleWithConflicts,
} from "./bundle-service"
import { globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { diagnosticsService } from "./diagnostics"

function getBundleLayerDirs(): string[] {
  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  return workspaceAgentsFolder
    ? [globalAgentsFolder, workspaceAgentsFolder]
    : [globalAgentsFolder]
}

const bundleActionOptions: BundleActionOptions = {
  service: {
    getExportableItems: () => getBundleExportableItemsFromLayers(getBundleLayerDirs()),
    exportBundle: (request: ExportBundleRequest) => exportBundleFromLayers(getBundleLayerDirs(), request),
    previewBundleImport: async (request: PreviewBundleImportRequest) => withTemporaryBundleFile(
      request.bundleJson,
      async (filePath) => {
        const preview = previewBundleWithConflicts(filePath, getBundleImportTargetDir())
        if (!preview.success || !preview.bundle || !preview.conflicts) return null
        return {
          bundle: preview.bundle,
          conflicts: preview.conflicts,
        } satisfies BundleImportPreview
      },
    ),
    importBundle: (request: ImportBundleRequest) => withTemporaryBundleFile(
      request.bundleJson,
      (filePath) => importBundleFromFile(filePath, getBundleImportTargetDir(), {
        conflictStrategy: request.conflictStrategy ?? "skip",
        components: request.components,
      }),
    ),
  },
  diagnostics: diagnosticsService,
}

function getBundleImportTargetDir(): string {
  return resolveWorkspaceAgentsFolder() ?? globalAgentsFolder
}

async function withTemporaryBundleFile<T>(
  bundleJson: string,
  run: (filePath: string) => T | Promise<T>,
): Promise<T> {
  const tempDir = path.join(os.tmpdir(), "dotagents-bundle-import")
  fs.mkdirSync(tempDir, { recursive: true })
  const filePath = path.join(tempDir, `${Date.now()}-${randomUUID()}.dotagents`)
  fs.writeFileSync(filePath, bundleJson, "utf8")

  try {
    return await run(filePath)
  } finally {
    try {
      fs.unlinkSync(filePath)
    } catch {
      // Temporary import previews should not fail if cleanup races with the OS.
    }
  }
}

export function getBundleExportableItems(): BundleActionResult {
  return getBundleExportableItemsAction(bundleActionOptions)
}

export function exportBundle(body: unknown): Promise<BundleActionResult> {
  return exportBundleAction(body, bundleActionOptions)
}

export function previewBundleImport(body: unknown): Promise<BundleActionResult> {
  return previewBundleImportAction(body, bundleActionOptions)
}

export function importBundle(body: unknown): Promise<BundleActionResult> {
  return importBundleAction(body, bundleActionOptions)
}
