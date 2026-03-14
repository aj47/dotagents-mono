import { app } from "electron"
import path from "path"
import type { Config } from "@shared/types"
import { container, ServiceTokens, getConfigStore } from "@dotagents/core"
import { ElectronPathResolver } from "./adapters/electron-path-resolver"

// Register ElectronPathResolver if not already registered.
// This ensures PathResolver is available before any core config functions are called.
if (!container.has(ServiceTokens.PathResolver)) {
  container.register(ServiceTokens.PathResolver, new ElectronPathResolver())
}

// Backward-compatible module-level constants for existing desktop callers.
// These use Electron's app.getPath() directly to be available at module load time.
export const dataFolder = path.join(app.getPath("appData"), process.env.APP_ID!)
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

// Re-export other config functions from core
export {
  ConfigStore,
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
