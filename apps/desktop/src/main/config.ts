import { app } from "electron"
import fs from "fs"
import path from "path"
import type { Config } from "@shared/types"
import {
  ConfigStore,
  container,
  ServiceTokens,
  getConfigStore,
  getDataFolder,
  getRecordingsFolder,
  getConversationsFolder,
  getConfigPath,
  globalAgentsFolder,
  resolveWorkspaceAgentsFolder,
  trySaveConfig,
  persistConfigToDisk,
} from "@dotagents/core"
import { ElectronPathResolver } from "./adapters/electron-path-resolver"

export const DEFAULT_APP_ID = "app.dotagents"

function resolveDesktopAppId(): string {
  return process.env.APP_ID?.trim() || DEFAULT_APP_ID
}

function resolveDesktopAppDataRoot(): string {
  return process.env.DOTAGENTS_APP_DATA_DIR?.trim() || app.getPath("appData")
}

function copyMissingRecursive(sourcePath: string, destinationPath: string): void {
  if (!fs.existsSync(sourcePath)) return

  const sourceStats = fs.statSync(sourcePath)
  if (sourceStats.isDirectory()) {
    fs.mkdirSync(destinationPath, { recursive: true })
    for (const entry of fs.readdirSync(sourcePath)) {
      copyMissingRecursive(path.join(sourcePath, entry), path.join(destinationPath, entry))
    }
    return
  }

  if (fs.existsSync(destinationPath)) return

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true })
  fs.copyFileSync(sourcePath, destinationPath)
}

function migrateLegacyDesktopAppData(activeAppId: string): void {
  const appDataRoot = resolveDesktopAppDataRoot()
  const targetDataFolder = path.join(appDataRoot, activeAppId)
  const knownAppIds = Array.from(new Set([DEFAULT_APP_ID, "dotagents", activeAppId]))

  for (const candidateAppId of knownAppIds) {
    if (candidateAppId === activeAppId) continue
    copyMissingRecursive(path.join(appDataRoot, candidateAppId), targetDataFolder)
  }
}

if (!process.env.APP_ID?.trim()) {
  process.env.APP_ID = DEFAULT_APP_ID
}

try {
  migrateLegacyDesktopAppData(resolveDesktopAppId())
} catch {
  // best-effort
}

export const appId = resolveDesktopAppId()

// Register ElectronPathResolver if not already registered.
// This ensures PathResolver is available before any core config functions are called.
if (!container.has(ServiceTokens.PathResolver)) {
  container.register(ServiceTokens.PathResolver, new ElectronPathResolver())
}

// Backward-compatible module-level constants for existing desktop callers.
// Keep these available at module load time; opt-in E2E can override the app-data root.
export const dataFolder = path.join(resolveDesktopAppDataRoot(), appId)
export const recordingsFolder = path.join(dataFolder, "recordings")
export const conversationsFolder = path.join(dataFolder, "conversations")
export const configPath = path.join(dataFolder, "config.json")

// Type-safe configStore for desktop consumers.
// Core's Config is Record<string, any>, but desktop expects the detailed Config type.
// We cast here to maintain full type safety for existing desktop callers.
const coreConfigStore = getConfigStore()
export const configStore = coreConfigStore as {
  config: Config | undefined
  get(): Config
  save(config: Config): void
  reload(): Config
}

// Keep core re-exports behind local bindings so the main-process bundle retains
// them when this module is loaded through a dynamic import namespace.
const CoreConfigStore = ConfigStore
const coreGetConfigStore = getConfigStore
const coreGetDataFolder = getDataFolder
const coreGetRecordingsFolder = getRecordingsFolder
const coreGetConversationsFolder = getConversationsFolder
const coreGetConfigPath = getConfigPath
const coreGlobalAgentsFolder = globalAgentsFolder
const coreResolveWorkspaceAgentsFolder = resolveWorkspaceAgentsFolder
const coreTrySaveConfig = trySaveConfig
const corePersistConfigToDisk = persistConfigToDisk

export {
  CoreConfigStore as ConfigStore,
  coreGetConfigStore as getConfigStore,
  coreGetDataFolder as getDataFolder,
  coreGetRecordingsFolder as getRecordingsFolder,
  coreGetConversationsFolder as getConversationsFolder,
  coreGetConfigPath as getConfigPath,
  coreGlobalAgentsFolder as globalAgentsFolder,
  coreResolveWorkspaceAgentsFolder as resolveWorkspaceAgentsFolder,
  coreTrySaveConfig as trySaveConfig,
  corePersistConfigToDisk as persistConfigToDisk,
}
