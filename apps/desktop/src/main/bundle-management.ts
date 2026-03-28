import {
  exportBundle,
  exportBundleFromLayers,
  exportBundleToFile,
  exportBundleToFileFromLayers,
  generatePublishPayload,
  getBundleExportableItems,
  getBundleExportableItemsFromLayers,
  importBundle,
  previewBundleWithConflicts,
  type BundlePreviewResult,
  type DotAgentsBundle,
  type ExportBundleOptions,
  type ExportBundleToFileResult,
  type ExportableBundleItems,
  type GeneratePublishPayloadOptions,
  type ImportBundleResult,
  type ImportOptions,
  type PreviewConflict,
} from "./bundle-service"
import { configStore, globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { logApp } from "./debug"
import { agentProfileService } from "./agent-profile-service"
import { knowledgeNotesService } from "./knowledge-notes-service"
import { loopService } from "./loop-service"
import { mcpService } from "./mcp-service"
import type { MCPServerConfig } from "../shared/types"

type BundleConflictMap = NonNullable<BundlePreviewResult["conflicts"]>

const BUNDLE_CONFLICT_KEYS: Array<keyof BundleConflictMap> = [
  "agentProfiles",
  "mcpServers",
  "skills",
  "repeatTasks",
  "knowledgeNotes",
]

function mergeConflictItems(
  primary: PreviewConflict[] | undefined,
  secondary: PreviewConflict[] | undefined,
): PreviewConflict[] {
  const merged = new Map<string, PreviewConflict>()

  for (const item of primary || []) {
    if (!item?.id) continue
    merged.set(item.id, item)
  }
  for (const item of secondary || []) {
    if (!item?.id) continue
    merged.set(item.id, item)
  }

  return Array.from(merged.values())
}

function mergeConflictMaps(
  primary: BundleConflictMap | undefined,
  secondary: BundleConflictMap | undefined,
): BundleConflictMap | undefined {
  if (!primary && !secondary) return undefined

  const merged: BundleConflictMap = {
    agentProfiles: [],
    mcpServers: [],
    skills: [],
    repeatTasks: [],
    knowledgeNotes: [],
  }

  for (const key of BUNDLE_CONFLICT_KEYS) {
    merged[key] = mergeConflictItems(primary?.[key], secondary?.[key])
  }

  return merged
}

export function getManagedBundleLayerDirs(): string[] {
  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  return workspaceAgentsFolder
    ? [globalAgentsFolder, workspaceAgentsFolder]
    : [globalAgentsFolder]
}

export function getManagedBundleImportTargetDir(): string {
  return resolveWorkspaceAgentsFolder() || globalAgentsFolder
}

export function getManagedBundleExportableItems(): ExportableBundleItems {
  const agentsDirs = getManagedBundleLayerDirs()
  return agentsDirs.length === 1
    ? getBundleExportableItems(agentsDirs[0])
    : getBundleExportableItemsFromLayers(agentsDirs)
}

export async function exportManagedBundle(
  options?: ExportBundleOptions,
): Promise<DotAgentsBundle> {
  const agentsDirs = getManagedBundleLayerDirs()
  return agentsDirs.length === 1
    ? exportBundle(agentsDirs[0], options)
    : exportBundleFromLayers(agentsDirs, options)
}

export async function exportManagedBundleToFile(
  options?: ExportBundleOptions,
): Promise<ExportBundleToFileResult> {
  const agentsDirs = getManagedBundleLayerDirs()
  return agentsDirs.length === 1
    ? exportBundleToFile(agentsDirs[0], options)
    : exportBundleToFileFromLayers(agentsDirs, options)
}

export function previewManagedBundleWithConflicts(
  filePath: string,
): BundlePreviewResult {
  const targetDir = getManagedBundleImportTargetDir()
  const targetPreview = previewBundleWithConflicts(filePath, targetDir)
  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()

  if (!workspaceAgentsFolder || !targetPreview.success) {
    return targetPreview
  }

  const globalPreview = previewBundleWithConflicts(filePath, globalAgentsFolder)
  if (!globalPreview.success) {
    return targetPreview
  }

  return {
    ...targetPreview,
    conflicts: mergeConflictMaps(
      globalPreview.conflicts,
      targetPreview.conflicts,
    ),
  }
}

export async function importManagedBundle(
  filePath: string,
  options: ImportOptions,
): Promise<ImportBundleResult> {
  const result = await importBundle(
    filePath,
    getManagedBundleImportTargetDir(),
    options,
  )
  await refreshRuntimeAfterManagedBundleImport()
  return result
}

export async function generateManagedBundlePublishPayload(
  options: GeneratePublishPayloadOptions,
) {
  return generatePublishPayload(getManagedBundleLayerDirs(), options)
}

export async function refreshRuntimeAfterManagedBundleImport(): Promise<void> {
  try {
    configStore.reload()
  } catch (error) {
    logApp("[bundle-management] Failed to reload config after bundle load", {
      error,
    })
  }

  try {
    agentProfileService.reload()
    agentProfileService.syncAgentProfilesToACPRegistry()
  } catch (error) {
    logApp(
      "[bundle-management] Failed to reload agent profiles after bundle load",
      { error },
    )
  }

  try {
    const { skillsService } = await import("./skills-service")
    skillsService.scanSkillsFolder()
  } catch (error) {
    logApp("[bundle-management] Failed to reload skills after bundle load", {
      error,
    })
  }

  try {
    loopService.stopAllLoops()
    loopService.reload()
    loopService.resumeScheduling()
    loopService.startAllLoops()
  } catch (error) {
    logApp(
      "[bundle-management] Failed to reload repeat tasks after bundle load",
      { error },
    )
    try {
      loopService.resumeScheduling()
    } catch {
      // best-effort
    }
  }

  try {
    await knowledgeNotesService.reload()
  } catch (error) {
    logApp(
      "[bundle-management] Failed to reload knowledge notes after bundle load",
      { error },
    )
  }

  try {
    const config = configStore.get()
    const configuredServers = config.mcpConfig?.mcpServers || {}
    const serverStatusBeforeRefresh = mcpService.getServerStatus()

    for (const [serverName, status] of Object.entries(
      serverStatusBeforeRefresh,
    )) {
      const serverConfig = configuredServers[serverName]
      const shouldBeStopped =
        !serverConfig || !!(serverConfig as MCPServerConfig).disabled
      if (!shouldBeStopped) continue

      const stopResult = await mcpService.stopServer(serverName)
      if (!stopResult.success) {
        logApp("[bundle-management] Failed to stop MCP server after bundle load", {
          serverName,
          error: stopResult.error,
          wasConnected: status.connected,
        })
      }
    }

    const serverStatusAfterStops = mcpService.getServerStatus()

    for (const [serverName, serverConfig] of Object.entries(
      configuredServers,
    )) {
      if ((serverConfig as MCPServerConfig).disabled) continue
      const status = serverStatusAfterStops[serverName]
      if (status?.runtimeEnabled === false) continue
      if (!status?.connected) continue

      const restartResult = await mcpService.restartServer(serverName)
      if (!restartResult.success) {
        logApp(
          "[bundle-management] Failed to restart MCP server after bundle load",
          {
            serverName,
            error: restartResult.error,
          },
        )
      }
    }

    await mcpService.initialize()
  } catch (error) {
    logApp("[bundle-management] Failed to reinitialize MCP after bundle load", {
      error,
    })
  }
}
