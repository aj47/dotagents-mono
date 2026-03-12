import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Config } from "@shared/types"

const mockWriteAgentsLayerFromConfig = vi.fn()
const mockSafeWriteJsonFileSync = vi.fn()

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => "/tmp/dotagents-test"),
    getAppPath: vi.fn(() => "/tmp/app"),
  },
}))

vi.mock("./system-prompts-default", () => ({
  DEFAULT_SYSTEM_PROMPT: "Default system prompt",
}))

vi.mock("./agents-files/modular-config", () => ({
  findAgentsDirUpward: vi.fn(() => null),
  getAgentsLayerPaths: vi.fn((agentsDir: string) => ({ agentsDir })),
  loadMergedAgentsConfig: vi.fn(() => ({ merged: {}, hasAnyAgentsFiles: false })),
  writeAgentsLayerFromConfig: mockWriteAgentsLayerFromConfig,
}))

vi.mock("./agents-files/safe-file", () => ({
  safeReadJsonFileSync: vi.fn(() => ({})),
  safeWriteJsonFileSync: mockSafeWriteJsonFileSync,
}))

describe("config persistence", () => {
  beforeEach(() => {
    process.env.APP_ID = "dotagents-test"
    delete process.env.DOTAGENTS_DATA_DIR
    delete process.env.DOTAGENTS_GLOBAL_AGENTS_DIR
    delete process.env.DOTAGENTS_WORKSPACE_AGENTS_DIR
    vi.resetModules()
    vi.clearAllMocks()
    mockWriteAgentsLayerFromConfig.mockReset()
    mockSafeWriteJsonFileSync.mockReset()
  })

  it("uses DOTAGENTS_DATA_DIR when provided", async () => {
    process.env.DOTAGENTS_DATA_DIR = "/tmp/custom-dotagents-data"

    const { dataFolder, configPath } = await import("./config")

    expect(dataFolder).toBe("/tmp/custom-dotagents-data")
    expect(configPath).toBe("/tmp/custom-dotagents-data/config.json")
  })

  it("uses DOTAGENTS_GLOBAL_AGENTS_DIR when provided", async () => {
    process.env.DOTAGENTS_GLOBAL_AGENTS_DIR = "/tmp/custom-global-agents"

    const { globalAgentsFolder } = await import("./config")

    expect(globalAgentsFolder).toBe("/tmp/custom-global-agents")
  })

  it("uses DOTAGENTS_WORKSPACE_AGENTS_DIR when provided", async () => {
    process.env.DOTAGENTS_WORKSPACE_AGENTS_DIR = "/tmp/custom-workspace-agents"

    const { resolveWorkspaceAgentsFolder } = await import("./config")

    expect(resolveWorkspaceAgentsFolder()).toBe("/tmp/custom-workspace-agents")
  })

  it("falls back to the legacy config file when writing .agents files fails", async () => {
    mockWriteAgentsLayerFromConfig.mockImplementation(() => {
      throw new Error("EACCES: permission denied")
    })

    const { persistConfigToDisk } = await import("./config")
    mockWriteAgentsLayerFromConfig.mockClear()
    mockSafeWriteJsonFileSync.mockClear()

    const result = persistConfigToDisk({ launchAtLogin: true } as Config)

    expect(result).toEqual({
      savedToAgentsLayer: false,
      savedToLegacyConfig: true,
    })
    expect(mockSafeWriteJsonFileSync).toHaveBeenCalledTimes(1)
  })

  it("throws when every persistence target fails", async () => {
    mockWriteAgentsLayerFromConfig.mockImplementation(() => {
      throw new Error("EACCES: permission denied")
    })
    mockSafeWriteJsonFileSync.mockImplementation(() => {
      throw new Error("ENOSPC: no space left on device")
    })

    const { persistConfigToDisk } = await import("./config")
    mockWriteAgentsLayerFromConfig.mockClear()
    mockSafeWriteJsonFileSync.mockClear()

    expect(() => persistConfigToDisk({ launchAtLogin: true } as Config)).toThrow(
      /Failed to save settings to disk\. Could not write the \.agents config files \(EACCES: permission denied\) Could not write the legacy config file \(ENOSPC: no space left on device\)/,
    )
  })

  it("keeps the in-memory config unchanged when persistence fails everywhere", async () => {
    const { configStore } = await import("./config")
    const original = configStore.get()

    mockWriteAgentsLayerFromConfig.mockClear()
    mockSafeWriteJsonFileSync.mockClear()
    mockWriteAgentsLayerFromConfig.mockImplementation(() => {
      throw new Error("EACCES: permission denied")
    })
    mockSafeWriteJsonFileSync.mockImplementation(() => {
      throw new Error("EROFS: read-only file system")
    })

    expect(() =>
      configStore.save({
        ...original,
        launchAtLogin: !(original.launchAtLogin ?? false),
      } as Config),
    ).toThrow(/Failed to save settings to disk/)

    expect(configStore.get()).toEqual(original)
  })

  describe("trySaveConfig", () => {
    it("returns null when persistence succeeds", async () => {
      const { trySaveConfig } = await import("./config")
      mockWriteAgentsLayerFromConfig.mockClear()
      mockSafeWriteJsonFileSync.mockClear()

      const result = trySaveConfig({ launchAtLogin: true } as Config)

      expect(result).toBeNull()
      expect(mockWriteAgentsLayerFromConfig).toHaveBeenCalledTimes(1)
      expect(mockSafeWriteJsonFileSync).toHaveBeenCalledTimes(1)
    })

    it("returns an Error when every persistence target fails", async () => {
      const { trySaveConfig } = await import("./config")
      mockWriteAgentsLayerFromConfig.mockClear()
      mockSafeWriteJsonFileSync.mockClear()
      mockWriteAgentsLayerFromConfig.mockImplementation(() => {
        throw new Error("EACCES: permission denied")
      })
      mockSafeWriteJsonFileSync.mockImplementation(() => {
        throw new Error("ENOSPC: no space left on device")
      })

      const result = trySaveConfig({ launchAtLogin: true } as Config)

      expect(result).toBeInstanceOf(Error)
      expect(result?.message).toMatch(
        /Failed to save settings to disk\. Could not write the \.agents config files \(EACCES: permission denied\) Could not write the legacy config file \(ENOSPC: no space left on device\)/,
      )
    })

    it("leaves the in-memory config unchanged on failure", async () => {
      const { configStore, trySaveConfig } = await import("./config")
      const original = configStore.get()

      mockWriteAgentsLayerFromConfig.mockClear()
      mockSafeWriteJsonFileSync.mockClear()
      mockWriteAgentsLayerFromConfig.mockImplementation(() => {
        throw new Error("EACCES: permission denied")
      })
      mockSafeWriteJsonFileSync.mockImplementation(() => {
        throw new Error("EROFS: read-only file system")
      })

      const result = trySaveConfig({
        ...original,
        launchAtLogin: !(original.launchAtLogin ?? false),
      } as Config)

      expect(result).toBeInstanceOf(Error)
      expect(configStore.get()).toEqual(original)
    })
  })
})