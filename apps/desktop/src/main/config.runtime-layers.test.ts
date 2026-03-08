import { beforeEach, describe, expect, it, vi } from "vitest"
import os from "os"
import path from "path"

const mockFindAgentsDirUpward = vi.fn(() => null)
const mockGetAgentsLayerPaths = vi.fn((agentsDir: string) => ({ agentsDir }))
const mockLoadMergedAgentsConfig = vi.fn(() => ({ merged: {}, hasAnyAgentsFiles: false }))
const mockWriteAgentsLayerFromConfig = vi.fn()

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
  safeReadJsonFileSync: vi.fn(() => ({})),
  safeWriteJsonFileSync: vi.fn(),
}))

describe("getRuntimeAgentsLayers", () => {
  beforeEach(() => {
    process.env.APP_ID = "dotagents-test"
    delete process.env.DOTAGENTS_WORKSPACE_DIR
    vi.resetModules()
    vi.clearAllMocks()
    mockFindAgentsDirUpward.mockReset()
    mockFindAgentsDirUpward.mockReturnValue(null)
    mockGetAgentsLayerPaths.mockReset()
    mockGetAgentsLayerPaths.mockImplementation((agentsDir: string) => ({ agentsDir }))
    mockLoadMergedAgentsConfig.mockReset()
    mockLoadMergedAgentsConfig.mockReturnValue({ merged: {}, hasAnyAgentsFiles: false })
    mockWriteAgentsLayerFromConfig.mockReset()
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
})