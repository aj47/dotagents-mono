import {
  exportBundleAction,
  getBundleExportableItemsAction,
  type BundleActionOptions,
  type BundleActionResult,
  type ExportBundleRequest,
} from "@dotagents/shared/bundle-api"
import { exportBundleFromLayers, getBundleExportableItemsFromLayers } from "./bundle-service"
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
  },
  diagnostics: diagnosticsService,
}

export function getBundleExportableItems(): BundleActionResult {
  return getBundleExportableItemsAction(bundleActionOptions)
}

export function exportBundle(body: unknown): Promise<BundleActionResult> {
  return exportBundleAction(body, bundleActionOptions)
}
