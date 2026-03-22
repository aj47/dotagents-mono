import { app } from "electron"
import fs from "fs"
import path from "path"
import type { Config } from "@shared/types"
import {
  container,
  ServiceTokens,
  getConfigStore as getCoreConfigStore,
  getDataFolder,
  getRecordingsFolder,
  getConversationsFolder,
  getConfigPath,
  globalAgentsFolder,
  resolveWorkspaceAgentsFolder,
  persistConfigToDisk as persistCoreConfigToDisk,
  normalizeError,
  type ConfigStore as CoreConfigStore,
} from "@dotagents/core"
import type { AgentsLayerPaths } from "./agents-files/modular-config"
import {
  getAgentsLayerPaths,
  layerHasAnyAgentsConfig,
  loadAgentsLayerConfig,
  splitConfigIntoAgentsFiles,
} from "./agents-files/modular-config"
import { ElectronPathResolver } from "./adapters/electron-path-resolver"
import {
  ConfigSecretStorage,
  type ConfigSecrets,
  didConfigSecretsChange,
  didSanitizedConfigChange,
  mergeConfigSecrets,
  mergeStoredConfigSecrets,
  splitConfigSecrets,
} from "./config-secrets"

export const DEFAULT_APP_ID = "app.dotagents"

function resolveDesktopAppId(): string {
  return process.env.APP_ID?.trim() || DEFAULT_APP_ID
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
  if (process.env.DOTAGENTS_APP_DATA_PATH?.trim()) {
    return
  }

  const appDataRoot = app.getPath("appData")
  const targetDataFolder = path.join(appDataRoot, activeAppId)
  const knownAppIds = Array.from(new Set([DEFAULT_APP_ID, "dotagents", activeAppId]))

  for (const candidateAppId of knownAppIds) {
    if (candidateAppId === activeAppId) continue
    copyMissingRecursive(path.join(appDataRoot, candidateAppId), targetDataFolder)
  }
}

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath)
  } catch {
    return false
  }
}

function readJsonFileIfExists(filePath: string): unknown {
  if (!fileExists(filePath)) {
    return undefined
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
  } catch {
    return undefined
  }
}

function writeJsonFileWithoutBackup(filePath: string, value: unknown, pretty: boolean): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const json = pretty ? `${JSON.stringify(value, null, 2)}\n` : JSON.stringify(value)
  fs.writeFileSync(filePath, json, "utf8")
}

function sanitizeJsonFile(filePath: string, pretty: boolean): ConfigSecrets {
  const rawValue = readJsonFileIfExists(filePath)
  if (rawValue === undefined) {
    return {}
  }

  const { sanitizedConfig, secrets } = splitConfigSecrets(rawValue as Config)
  if (didSanitizedConfigChange(rawValue as Config, sanitizedConfig)) {
    writeJsonFileWithoutBackup(filePath, sanitizedConfig, pretty)
  }

  return secrets
}

function sanitizeJsonBackupDirectory(backupDir: string): void {
  if (!fileExists(backupDir)) {
    return
  }

  for (const entry of fs.readdirSync(backupDir, { withFileTypes: true })) {
    const entryPath = path.join(backupDir, entry.name)

    if (entry.isDirectory()) {
      sanitizeJsonBackupDirectory(entryPath)
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    if (!entry.name.endsWith(".json") && !entry.name.includes(".json.")) {
      continue
    }

    const rawValue = readJsonFileIfExists(entryPath)
    if (rawValue === undefined) {
      continue
    }

    const { sanitizedConfig } = splitConfigSecrets(rawValue as Config)
    if (didSanitizedConfigChange(rawValue as Config, sanitizedConfig)) {
      writeJsonFileWithoutBackup(entryPath, sanitizedConfig, true)
    }
  }
}

function writeSanitizedAgentsLayer(layer: AgentsLayerPaths, config: Config): void {
  const split = splitConfigIntoAgentsFiles(config)

  const writeSection = (filePath: string, value: Partial<Config>) => {
    if (!fileExists(filePath) && Object.keys(value).length === 0) {
      return
    }

    writeJsonFileWithoutBackup(filePath, value, true)
  }

  writeSection(layer.settingsJsonPath, split.settings)
  writeSection(layer.mcpJsonPath, split.mcp)
  writeSection(layer.modelsJsonPath, split.models)
  writeSection(layer.layoutJsonPath, split.layout)
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

if (!container.has(ServiceTokens.PathResolver)) {
  container.register(ServiceTokens.PathResolver, new ElectronPathResolver())
}

export const dataFolder = getDataFolder()
export const recordingsFolder = getRecordingsFolder()
export const conversationsFolder = getConversationsFolder()
export const configPath = getConfigPath()

function collectPlaintextSecretsFromDisk(): ConfigSecrets {
  let collectedSecrets: ConfigSecrets = {}

  collectedSecrets = mergeStoredConfigSecrets(
    collectedSecrets,
    sanitizeJsonFile(getConfigPath(), false),
  )

  sanitizeJsonBackupDirectory(path.join(getDataFolder(), ".backups"))

  const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  const workspaceLayer = workspaceAgentsFolder
    ? getAgentsLayerPaths(workspaceAgentsFolder)
    : null

  const sanitizeLayer = (layer: AgentsLayerPaths) => {
    if (layerHasAnyAgentsConfig(layer)) {
      const layerConfig = loadAgentsLayerConfig(layer) as Config
      const { sanitizedConfig, secrets } = splitConfigSecrets(layerConfig)
      collectedSecrets = mergeStoredConfigSecrets(collectedSecrets, secrets)

      if (didSanitizedConfigChange(layerConfig, sanitizedConfig)) {
        writeSanitizedAgentsLayer(layer, sanitizedConfig)
      }
    }

    sanitizeJsonBackupDirectory(layer.backupsDir)
  }

  sanitizeLayer(globalLayer)

  if (workspaceLayer) {
    sanitizeLayer(workspaceLayer)
  }

  return collectedSecrets
}

export class ConfigStore {
  config: Config | undefined

  private readonly coreConfigStore: CoreConfigStore
  private readonly secretStorage: ConfigSecretStorage

  constructor() {
    this.coreConfigStore = getCoreConfigStore()
    this.secretStorage = new ConfigSecretStorage(getDataFolder())
    this.config = this.reload()
  }

  private loadMergedConfig(): Config {
    const storedSecrets = this.secretStorage.load()
    const migratedSecrets = collectPlaintextSecretsFromDisk()
    const mergedSecrets = mergeStoredConfigSecrets(storedSecrets, migratedSecrets)

    if (didConfigSecretsChange(storedSecrets, mergedSecrets)) {
      this.secretStorage.save(mergedSecrets)
    }

    const sanitizedConfig = this.coreConfigStore.reload() as Config
    this.coreConfigStore.config = sanitizedConfig

    return mergeConfigSecrets(sanitizedConfig, mergedSecrets)
  }

  private persist(
    config: Config,
    options?: Parameters<typeof persistCoreConfigToDisk>[1],
  ): ReturnType<typeof persistCoreConfigToDisk> {
    const { sanitizedConfig, secrets } = splitConfigSecrets(config)

    this.secretStorage.save(secrets)
    const persistResult = persistCoreConfigToDisk(sanitizedConfig, options)

    this.coreConfigStore.config = sanitizedConfig
    this.config = mergeConfigSecrets(sanitizedConfig, secrets)

    return persistResult
  }

  get(): Config {
    if (!this.config) {
      this.config = this.loadMergedConfig()
    }

    return this.config
  }

  save(config: Config): void {
    this.persist(config)
  }

  persistToDisk(
    config: Config,
    options?: Parameters<typeof persistCoreConfigToDisk>[1],
  ): ReturnType<typeof persistCoreConfigToDisk> {
    return this.persist(config, options)
  }

  reload(): Config {
    this.config = this.loadMergedConfig()
    return this.config
  }
}

let _configStore: ConfigStore | null = null

export function getConfigStore(): ConfigStore {
  if (!_configStore) {
    _configStore = new ConfigStore()
  }

  return _configStore
}

export function trySaveConfig(config: Config): Error | null {
  try {
    getConfigStore().save(config)
    return null
  } catch (error) {
    return normalizeError(error, "Failed to save settings to disk")
  }
}

export function persistConfigToDisk(
  config: Config,
  options: Parameters<typeof persistCoreConfigToDisk>[1] = {},
): ReturnType<typeof persistCoreConfigToDisk> {
  return getConfigStore().persistToDisk(config, options)
}

export const configStore: ConfigStore = new Proxy({} as ConfigStore, {
  get(_target, prop) {
    const store = getConfigStore()
    const value = (store as unknown as Record<string | symbol, unknown>)[prop]

    if (typeof value === "function") {
      return value.bind(store)
    }

    return value
  },
  set(_target, prop, value) {
    const store = getConfigStore()
    ;(store as unknown as Record<string | symbol, unknown>)[prop] = value
    return true
  },
})

export {
  getDataFolder,
  getRecordingsFolder,
  getConversationsFolder,
  getConfigPath,
  globalAgentsFolder,
  resolveWorkspaceAgentsFolder,
}
