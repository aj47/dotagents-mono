import { beforeEach, describe, expect, it, vi } from "vitest"
import os from "os"
import path from "path"

const mockFsExistsSync = vi.fn(() => false)
const mockFsReadFileSync = vi.fn(() => "{}")
const mockFsReaddirSync = vi.fn(() => [])
const mockFsStatSync = vi.fn(() => ({ isDirectory: () => true }))
const mockFsMkdirSync = vi.fn()
const mockFindAgentsDirUpward = vi.fn(() => null)
const mockGetAgentsLayerPaths = vi.fn((agentsDir: string) => ({ agentsDir }))
const mockLoadMergedAgentsConfig = vi.fn(() => ({ merged: {}, hasAnyAgentsFiles: false }))
const mockWriteAgentsLayerFromConfig = vi.fn()
const mockSafeReadJsonFileSync = vi.fn(() => ({}))
const mockSafeWriteJsonFileSync = vi.fn()

vi.mock("fs", () => ({
  default: {
    existsSync: mockFsExistsSync,
    readFileSync: mockFsReadFileSync,
    readdirSync: mockFsReaddirSync,
    statSync: mockFsStatSync,
    mkdirSync: mockFsMkdirSync,
  },
  existsSync: mockFsExistsSync,
  readFileSync: mockFsReadFileSync,
  readdirSync: mockFsReaddirSync,
  statSync: mockFsStatSync,
  mkdirSync: mockFsMkdirSync,
}))

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
  findAgentsDirUpward: mockFindAgentsDirUpward,
  getAgentsLayerPaths: mockGetAgentsLayerPaths,
  loadMergedAgentsConfig: mockLoadMergedAgentsConfig,
  writeAgentsLayerFromConfig: mockWriteAgentsLayerFromConfig,
}))

vi.mock("./agents-files/safe-file", () => ({
  safeReadJsonFileSync: mockSafeReadJsonFileSync,
  safeWriteJsonFileSync: mockSafeWriteJsonFileSync,
}))

describe("getRuntimeAgentsLayers", () => {
  beforeEach(() => {
    process.env.APP_ID = "dotagents-test"
    delete process.env.DOTAGENTS_WORKSPACE_DIR
    vi.resetModules()
    vi.clearAllMocks()
    mockFsExistsSync.mockReset()
    mockFsExistsSync.mockReturnValue(false)
    mockFsReadFileSync.mockReset()
    mockFsReadFileSync.mockReturnValue("{}")
    mockFsReaddirSync.mockReset()
    mockFsReaddirSync.mockReturnValue([])
    mockFsStatSync.mockReset()
    mockFsStatSync.mockReturnValue({ isDirectory: () => true })
    mockFsMkdirSync.mockReset()
    mockFindAgentsDirUpward.mockReset()
    mockFindAgentsDirUpward.mockReturnValue(null)
    mockGetAgentsLayerPaths.mockReset()
    mockGetAgentsLayerPaths.mockImplementation((agentsDir: string) => ({ agentsDir }))
    mockLoadMergedAgentsConfig.mockReset()
    mockLoadMergedAgentsConfig.mockReturnValue({ merged: {}, hasAnyAgentsFiles: false })
    mockWriteAgentsLayerFromConfig.mockReset()
    mockSafeReadJsonFileSync.mockReset()
    mockSafeReadJsonFileSync.mockReturnValue({})
    mockSafeWriteJsonFileSync.mockReset()
  })

  it("returns only the global layer when no workspace overlay is available", async () => {
    const { getRuntimeAgentsLayers } = await import("./config")

    expect(getRuntimeAgentsLayers()).toMatchObject({
      globalLayer: {
        name: "global",
        paths: { agentsDir: path.join(os.homedir(), ".agents") },
      },
      workspaceLayer: null,
      orderedLayers: [{ name: "global" }],
      writableLayer: { name: "global" },
      workspaceSource: null,
    })
  })

  it("uses the DOTAGENTS_WORKSPACE_DIR overlay as the writable layer", async () => {
    process.env.DOTAGENTS_WORKSPACE_DIR = "/tmp/workspace-root"

    const { getRuntimeAgentsLayers } = await import("./config")

    expect(getRuntimeAgentsLayers()).toMatchObject({
      activeSlotLayer: null,
      workspaceLayer: {
        name: "workspace",
        paths: { agentsDir: "/tmp/workspace-root/.agents" },
      },
      orderedLayers: [{ name: "global" }, { name: "workspace" }],
      writableLayer: {
        name: "workspace",
        paths: { agentsDir: "/tmp/workspace-root/.agents" },
      },
      workspaceSource: "env",
    })
  })

  it("uses an upward-discovered workspace overlay when no env override is set", async () => {
    mockFindAgentsDirUpward.mockReturnValue("/tmp/project/.agents")

    const { getRuntimeAgentsLayers } = await import("./config")

    expect(getRuntimeAgentsLayers()).toMatchObject({
      activeSlotLayer: null,
      workspaceLayer: {
        name: "workspace",
        paths: { agentsDir: "/tmp/project/.agents" },
      },
      orderedLayers: [{ name: "global" }, { name: "workspace" }],
      writableLayer: {
        name: "workspace",
        paths: { agentsDir: "/tmp/project/.agents" },
      },
      workspaceSource: "upward",
    })
  })

  it("ignores env workspaces that resolve to the global agents folder", async () => {
    process.env.DOTAGENTS_WORKSPACE_DIR = os.homedir()

    const { getRuntimeAgentsLayers } = await import("./config")

    expect(getRuntimeAgentsLayers()).toMatchObject({
      workspaceLayer: null,
      orderedLayers: [{ name: "global" }],
      writableLayer: { name: "global" },
      workspaceSource: null,
    })
  })

  it("mounts the active bundle slot between global and workspace layers", async () => {
    process.env.DOTAGENTS_WORKSPACE_DIR = "/tmp/workspace-root"

    const slotsFolder = path.join(os.homedir(), ".agents", "bundle-slots")
    const activeStatePath = path.join(slotsFolder, "active-slot.json")
    const activeSlotDir = path.join(slotsFolder, "focus-mode")

    mockFsExistsSync.mockImplementation((candidate: unknown) => {
      const filePath = String(candidate)
      return filePath === slotsFolder || filePath === activeStatePath
    })
    mockFsReadFileSync.mockImplementation((candidate: unknown) => {
      const filePath = String(candidate)
      if (filePath === activeStatePath) {
        return JSON.stringify({ slotId: "focus-mode", lastSwitchedAt: "2026-03-08T12:00:00.000Z" })
      }
      return "{}"
    })
    mockFsReaddirSync.mockReturnValue([
      { name: "focus-mode", isDirectory: () => true },
      { name: "ignored.txt", isDirectory: () => false },
    ])

    const { getActiveBundleSlotState, getRuntimeAgentsLayers } = await import("./config")

    expect(getActiveBundleSlotState()).toMatchObject({
      activeSlotId: "focus-mode",
      lastSwitchedAt: "2026-03-08T12:00:00.000Z",
      precedence: "global -> active slot -> workspace",
      runtimeActivationEnabled: true,
    })

    expect(getRuntimeAgentsLayers()).toMatchObject({
      activeSlotLayer: {
        name: "slot",
        paths: { agentsDir: activeSlotDir },
      },
      orderedLayers: [{ name: "global" }, { name: "slot" }, { name: "workspace" }],
      writableLayer: {
        name: "workspace",
        paths: { agentsDir: "/tmp/workspace-root/.agents" },
      },
    })
  })

  it("persists explicit bundle slot switches with a fresh timestamp", async () => {
    const slotsFolder = path.join(os.homedir(), ".agents", "bundle-slots")
    const activeStatePath = path.join(slotsFolder, "active-slot.json")

    mockFsExistsSync.mockImplementation((candidate: unknown) => String(candidate) === slotsFolder)
    mockFsReaddirSync.mockReturnValue([
      { name: "focus-mode", isDirectory: () => true },
    ])

    const { setActiveBundleSlot } = await import("./config")
    const state = setActiveBundleSlot("focus-mode")

    expect(mockSafeWriteJsonFileSync).toHaveBeenCalledWith(
      activeStatePath,
      expect.objectContaining({ slotId: "focus-mode", lastSwitchedAt: expect.any(String) }),
      expect.objectContaining({
        backupDir: path.join(slotsFolder, ".backups"),
        maxBackups: 10,
        pretty: true,
      }),
    )
    expect(state).toMatchObject({
      activeSlotId: "focus-mode",
      slots: [{ id: "focus-mode", isActive: true }],
    })
    expect(state.lastSwitchedAt).toEqual(expect.any(String))
  })

  it("creates a new bundle slot directory without activating it", async () => {
    const slotsFolder = path.join(os.homedir(), ".agents", "bundle-slots")
    const newSlotDir = path.join(slotsFolder, "dev-powerpack")

    mockFsExistsSync.mockImplementation((candidate: unknown) => String(candidate) === slotsFolder)
    mockFsReaddirSync.mockReturnValue([])

    const { createBundleSlot } = await import("./config")
    const slot = createBundleSlot("dev-powerpack")

    expect(mockFsMkdirSync).toHaveBeenCalledWith(newSlotDir, { recursive: true })
    expect(slot).toEqual({
      id: "dev-powerpack",
      slotDir: newSlotDir,
      isActive: false,
    })
  })
})