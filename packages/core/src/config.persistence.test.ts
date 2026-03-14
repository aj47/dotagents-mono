import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Config } from "./types"

const mockWriteAgentsLayerFromConfig = vi.fn()
const mockSafeWriteJsonFileSync = vi.fn()

vi.mock("./agents-files/modular-config", async () => {
  const actual = await vi.importActual("./agents-files/modular-config") as Record<string, unknown>
  return {
    ...actual,
    findAgentsDirUpward: vi.fn(() => null),
    loadMergedAgentsConfig: vi.fn(() => ({ merged: {}, hasAnyAgentsFiles: false })),
    writeAgentsLayerFromConfig: mockWriteAgentsLayerFromConfig,
  }
})

vi.mock("./agents-files/safe-file", async () => {
  const actual = await vi.importActual("./agents-files/safe-file") as Record<string, unknown>
  return {
    ...actual,
    safeReadJsonFileSync: vi.fn(() => ({})),
    safeWriteJsonFileSync: mockSafeWriteJsonFileSync,
  }
})

// Mock PathResolver so config module can resolve paths
vi.mock("./service-container", async () => {
  const actual = await vi.importActual("./service-container") as Record<string, unknown>
  const { ServiceContainer, ServiceTokens } = actual as {
    ServiceContainer: new () => { register: (token: string, instance: unknown) => void; resolve: <T>(token: string) => T; has: (token: string) => boolean; tryResolve: <T>(token: string) => T | undefined }
    ServiceTokens: Record<string, string>
  }
  const testContainer = new ServiceContainer()
  testContainer.register(ServiceTokens.PathResolver, {
    getUserDataPath: () => "/tmp/dotagents-test",
    getConfigPath: () => "/tmp/dotagents-test",
    getAppDataPath: () => "/tmp",
    getTempPath: () => "/tmp",
    getHomePath: () => "/tmp/home",
    getDesktopPath: () => "/tmp/home/Desktop",
    getDownloadsPath: () => "/tmp/home/Downloads",
    getLogsPath: () => "/tmp/logs",
  })
  return {
    ...actual,
    container: testContainer,
  }
})

describe("config persistence", () => {
  beforeEach(() => {
    process.env.APP_ID = "dotagents-test"
    vi.clearAllMocks()
    mockWriteAgentsLayerFromConfig.mockReset()
    mockSafeWriteJsonFileSync.mockReset()
  })

  it("falls back to the legacy config file when writing .agents files fails", async () => {
    mockWriteAgentsLayerFromConfig.mockImplementation(() => {
      throw new Error("EACCES: permission denied")
    })

    const { persistConfigToDisk } = await import("./config")

    const result = persistConfigToDisk({ launchAtLogin: true } as Config)

    expect(result).toEqual({
      savedToAgentsLayer: false,
      savedToLegacyConfig: true,
    })
    expect(mockSafeWriteJsonFileSync).toHaveBeenCalled()
  })

  it("throws when every persistence target fails", async () => {
    mockWriteAgentsLayerFromConfig.mockImplementation(() => {
      throw new Error("EACCES: permission denied")
    })
    mockSafeWriteJsonFileSync.mockImplementation(() => {
      throw new Error("ENOSPC: no space left on device")
    })

    const { persistConfigToDisk } = await import("./config")

    expect(() => persistConfigToDisk({ launchAtLogin: true } as Config)).toThrow(
      /Failed to save settings to disk/,
    )
  })

  it("succeeds when both persistence targets work", async () => {
    const { persistConfigToDisk } = await import("./config")

    const result = persistConfigToDisk({ launchAtLogin: true } as Config)

    expect(result).toEqual({
      savedToAgentsLayer: true,
      savedToLegacyConfig: true,
    })
    expect(mockWriteAgentsLayerFromConfig).toHaveBeenCalled()
    expect(mockSafeWriteJsonFileSync).toHaveBeenCalled()
  })
})
