import type {
  BundleComponentSelection,
  BundleImportConflictStrategy,
  BundleImportPreviewConflicts,
  BundleImportResult,
  DotAgentsBundle,
  ExportableBundleItems,
  ExportBundleRequest,
} from "@dotagents/shared/bundle-api"
import type { HubPublishBundleExportOptions, HubPublishPayload } from "@dotagents/shared/hub"
import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopBundlePreview {
  success: boolean
  filePath?: string
  bundle?: DotAgentsBundle | null
  conflicts?: BundleImportPreviewConflicts
  error?: string
}

export interface DesktopBundleDialogPreview {
  filePath: string
  bundle: DotAgentsBundle
}

export type DesktopBundleExportRequest = ExportBundleRequest

export interface DesktopBundleExportFileResult {
  success: boolean
  filePath: string | null
  canceled: boolean
  error?: string
}

export interface DesktopBundleImportFileRequest {
  filePath: string
  conflictStrategy: BundleImportConflictStrategy
  components?: BundleComponentSelection
}

export type DesktopBundlePublishPayloadRequest = HubPublishBundleExportOptions

export interface DesktopHubPublishPayloadFileRequest {
  catalogId: string
  payloadJson: string
}

export interface DesktopHubPublishPayloadFileResult {
  success: boolean
  canceled: boolean
  filePath?: string
}

export const desktopBundleClient = {
  getExportableItems(): Promise<ExportableBundleItems> {
    return tipcClient.getBundleExportableItems() as Promise<ExportableBundleItems>
  },

  exportBundle(request: DesktopBundleExportRequest): Promise<DesktopBundleExportFileResult> {
    return tipcClient.exportBundle(request) as Promise<DesktopBundleExportFileResult>
  },

  generatePublishPayload(request: DesktopBundlePublishPayloadRequest): Promise<HubPublishPayload> {
    return tipcClient.generatePublishPayload(request) as Promise<HubPublishPayload>
  },

  saveHubPublishPayloadFile(
    request: DesktopHubPublishPayloadFileRequest,
  ): Promise<DesktopHubPublishPayloadFileResult> {
    return tipcClient.saveHubPublishPayloadFile(request) as Promise<DesktopHubPublishPayloadFileResult>
  },

  previewBundleFromDialog(): Promise<DesktopBundleDialogPreview | null> {
    return tipcClient.previewBundle() as Promise<DesktopBundleDialogPreview | null>
  },

  previewBundleWithConflicts(filePath: string): Promise<DesktopBundlePreview> {
    return tipcClient.previewBundleWithConflicts({ filePath }) as Promise<DesktopBundlePreview>
  },

  importBundleFromFile(request: DesktopBundleImportFileRequest): Promise<BundleImportResult> {
    return tipcClient.importBundle(request) as Promise<BundleImportResult>
  },
}
