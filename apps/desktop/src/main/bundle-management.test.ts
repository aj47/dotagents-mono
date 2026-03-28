import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Config } from "../shared/types"

let currentConfig: Config = {}

const resolveWorkspaceAgentsFolderMock = vi.fn(
  () => "/tmp/workspace-agents",
)
const reloadConfigMock = vi.fn()
const getBundleExportableItemsMock = vi.fn(() => ({
  agentProfiles: [],
  mcpServers: [],
  skills: [],
  repeatTasks: [],
  knowledgeNotes: [],
}))
const getBundleExportableItemsFromLayersMock = vi.fn(() => ({
  agentProfiles: [],
  mcpServers: [],
  skills: [],
  repeatTasks: [],
  knowledgeNotes: [],
}))
const exportBundleMock = vi.fn(async () => ({
  manifest: {
    version: 1,
    name: "Exported Bundle",
    createdAt: "2026-03-28T00:00:00.000Z",
    exportedFrom: "dotagents-desktop",
    components: {
      agentProfiles: 0,
      mcpServers: 0,
      skills: 0,
      repeatTasks: 0,
      knowledgeNotes: 0,
    },
  },
  agentProfiles: [],
  mcpServers: [],
  skills: [],
  repeatTasks: [],
  knowledgeNotes: [],
}))
const exportBundleFromLayersMock = vi.fn(exportBundleMock)
const exportBundleToFileMock = vi.fn(async () => ({
  success: true,
  filePath: "/tmp/exported.dotagents",
  canceled: false,
}))
const exportBundleToFileFromLayersMock = vi.fn(exportBundleToFileMock)
const previewBundleWithConflictsMock = vi.fn()
const importBundleMock = vi.fn(async () => ({
  success: true,
  agentProfiles: [],
  mcpServers: [],
  skills: [],
  repeatTasks: [],
  knowledgeNotes: [],
  errors: [],
}))
const generatePublishPayloadMock = vi.fn(async () => ({
  catalogItem: {
    id: "bundle-id",
    name: "Bundle",
    summary: "Summary",
    author: { displayName: "AJ" },
    tags: [],
    bundleVersion: 1,
    publishedAt: "2026-03-28T00:00:00.000Z",
    updatedAt: "2026-03-28T00:00:00.000Z",
    componentCounts: {
      agentProfiles: 0,
      mcpServers: 0,
      skills: 0,
      repeatTasks: 0,
      knowledgeNotes: 0,
    },
    artifact: {
      url: "https://example.com/bundle.dotagents",
      fileName: "bundle.dotagents",
      sizeBytes: 2,
    },
  },
  bundleJson: "{}",
  installUrl: "dotagents://install?bundle=https%3A%2F%2Fexample.com%2Fbundle.dotagents",
}))
const agentProfileReloadMock = vi.fn()
const syncAgentProfilesToACPRegistryMock = vi.fn()
const knowledgeNotesReloadMock = vi.fn(async () => undefined)
const stopAllLoopsMock = vi.fn()
const loopReloadMock = vi.fn()
const resumeSchedulingMock = vi.fn()
const startAllLoopsMock = vi.fn()
const getServerStatusMock = vi.fn(() => ({}))
const stopServerMock = vi.fn(async () => ({ success: true }))
const restartServerMock = vi.fn(async () => ({ success: true }))
const initializeMcpMock = vi.fn(async () => undefined)
const scanSkillsFolderMock = vi.fn()

vi.mock("./config", () => ({
  configStore: {
    get: vi.fn(() => currentConfig),
    reload: reloadConfigMock,
  },
  globalAgentsFolder: "/tmp/global-agents",
  resolveWorkspaceAgentsFolder: resolveWorkspaceAgentsFolderMock,
}))

vi.mock("./bundle-service", () => ({
  getBundleExportableItems: getBundleExportableItemsMock,
  getBundleExportableItemsFromLayers: getBundleExportableItemsFromLayersMock,
  exportBundle: exportBundleMock,
  exportBundleFromLayers: exportBundleFromLayersMock,
  exportBundleToFile: exportBundleToFileMock,
  exportBundleToFileFromLayers: exportBundleToFileFromLayersMock,
  previewBundleWithConflicts: previewBundleWithConflictsMock,
  importBundle: importBundleMock,
  generatePublishPayload: generatePublishPayloadMock,
}))

vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    reload: agentProfileReloadMock,
    syncAgentProfilesToACPRegistry: syncAgentProfilesToACPRegistryMock,
  },
}))

vi.mock("./knowledge-notes-service", () => ({
  knowledgeNotesService: {
    reload: knowledgeNotesReloadMock,
  },
}))

vi.mock("./loop-service", () => ({
  loopService: {
    stopAllLoops: stopAllLoopsMock,
    reload: loopReloadMock,
    resumeScheduling: resumeSchedulingMock,
    startAllLoops: startAllLoopsMock,
  },
}))

vi.mock("./mcp-service", () => ({
  mcpService: {
    getServerStatus: getServerStatusMock,
    stopServer: stopServerMock,
    restartServer: restartServerMock,
    initialize: initializeMcpMock,
  },
}))

vi.mock("./skills-service", () => ({
  skillsService: {
    scanSkillsFolder: scanSkillsFolderMock,
  },
}))

const bundleManagementModule = import("./bundle-management")

describe("bundle management", () => {
  beforeEach(() => {
    currentConfig = {}
    resolveWorkspaceAgentsFolderMock.mockReset()
    resolveWorkspaceAgentsFolderMock.mockReturnValue("/tmp/workspace-agents")
    reloadConfigMock.mockReset()
    getBundleExportableItemsMock.mockClear()
    getBundleExportableItemsFromLayersMock.mockClear()
    exportBundleMock.mockClear()
    exportBundleFromLayersMock.mockClear()
    exportBundleToFileMock.mockClear()
    exportBundleToFileFromLayersMock.mockClear()
    previewBundleWithConflictsMock.mockReset()
    importBundleMock.mockReset()
    importBundleMock.mockResolvedValue({
      success: true,
      agentProfiles: [],
      mcpServers: [],
      skills: [],
      repeatTasks: [],
      knowledgeNotes: [],
      errors: [],
    })
    generatePublishPayloadMock.mockClear()
    agentProfileReloadMock.mockReset()
    syncAgentProfilesToACPRegistryMock.mockReset()
    knowledgeNotesReloadMock.mockReset()
    stopAllLoopsMock.mockReset()
    loopReloadMock.mockReset()
    resumeSchedulingMock.mockReset()
    startAllLoopsMock.mockReset()
    getServerStatusMock.mockReset()
    getServerStatusMock.mockReturnValue({})
    stopServerMock.mockReset()
    stopServerMock.mockResolvedValue({ success: true })
    restartServerMock.mockReset()
    restartServerMock.mockResolvedValue({ success: true })
    initializeMcpMock.mockReset()
    scanSkillsFolderMock.mockReset()
  })

  it("resolves bundle exportable items from the merged global and workspace layers", async () => {
    const { getManagedBundleExportableItems } = await bundleManagementModule

    getManagedBundleExportableItems()

    expect(getBundleExportableItemsFromLayersMock).toHaveBeenCalledWith([
      "/tmp/global-agents",
      "/tmp/workspace-agents",
    ])
    expect(getBundleExportableItemsMock).not.toHaveBeenCalled()
  })

  it("merges global and workspace conflict previews through one helper", async () => {
    const { previewManagedBundleWithConflicts } = await bundleManagementModule

    const sampleBundle = {
      manifest: {
        version: 1,
        name: "Sample Bundle",
        createdAt: "2026-03-28T00:00:00.000Z",
        exportedFrom: "dotagents-desktop",
        components: {
          agentProfiles: 1,
          mcpServers: 0,
          skills: 1,
          repeatTasks: 0,
          knowledgeNotes: 0,
        },
      },
      agentProfiles: [],
      mcpServers: [],
      skills: [],
      repeatTasks: [],
      knowledgeNotes: [],
    }

    previewBundleWithConflictsMock.mockImplementation(
      (_filePath: string, targetDir: string) => {
        if (targetDir === "/tmp/workspace-agents") {
          return {
            success: true,
            filePath: "/tmp/sample.dotagents",
            bundle: sampleBundle,
            conflicts: {
              agentProfiles: [
                {
                  id: "planner",
                  name: "Planner",
                  existingName: "Workspace Planner",
                },
              ],
              mcpServers: [],
              skills: [],
              repeatTasks: [],
              knowledgeNotes: [],
            },
          }
        }

        return {
          success: true,
          filePath: "/tmp/sample.dotagents",
          bundle: sampleBundle,
          conflicts: {
            agentProfiles: [
              {
                id: "planner",
                name: "Planner",
                existingName: "Global Planner",
              },
            ],
            mcpServers: [],
            skills: [{ id: "skill-a", name: "Skill A" }],
            repeatTasks: [],
            knowledgeNotes: [],
          },
        }
      },
    )

    const result = previewManagedBundleWithConflicts("/tmp/sample.dotagents")

    expect(previewBundleWithConflictsMock).toHaveBeenCalledWith(
      "/tmp/sample.dotagents",
      "/tmp/workspace-agents",
    )
    expect(previewBundleWithConflictsMock).toHaveBeenCalledWith(
      "/tmp/sample.dotagents",
      "/tmp/global-agents",
    )
    expect(result).toMatchObject({
      success: true,
      conflicts: {
        agentProfiles: [
          {
            id: "planner",
            existingName: "Workspace Planner",
          },
        ],
        skills: [{ id: "skill-a", name: "Skill A" }],
      },
    })
  })

  it("routes publish payload generation through the shared layered helper", async () => {
    const { generateManagedBundlePublishPayload } = await bundleManagementModule

    await generateManagedBundlePublishPayload({
      publicMetadata: {
        summary: "Shared bundle",
        author: { displayName: "AJ" },
        tags: ["shared"],
      },
    })

    expect(generatePublishPayloadMock).toHaveBeenCalledWith(
      ["/tmp/global-agents", "/tmp/workspace-agents"],
      {
        publicMetadata: {
          summary: "Shared bundle",
          author: { displayName: "AJ" },
          tags: ["shared"],
        },
      },
    )
  })

  it("refreshes config, profiles, loops, notes, and MCP runtime after a shared import", async () => {
    const { importManagedBundle } = await bundleManagementModule

    currentConfig = {
      mcpConfig: {
        mcpServers: {
          keep: { command: "node", args: ["keep.js"] },
          new: { command: "node", args: ["new.js"] },
          disabled: { command: "node", args: ["disabled.js"], disabled: true },
        },
      },
    }

    getServerStatusMock
      .mockReturnValueOnce({
        removed: { connected: true, toolCount: 1, runtimeEnabled: true },
        keep: { connected: true, toolCount: 2, runtimeEnabled: true },
        disabled: { connected: true, toolCount: 0, runtimeEnabled: true },
      })
      .mockReturnValueOnce({
        keep: { connected: true, toolCount: 2, runtimeEnabled: true },
        new: { connected: false, toolCount: 0, runtimeEnabled: true },
        disabled: { connected: false, toolCount: 0, runtimeEnabled: false },
      })

    await importManagedBundle("/tmp/import.dotagents", {
      conflictStrategy: "skip",
    })

    expect(importBundleMock).toHaveBeenCalledWith(
      "/tmp/import.dotagents",
      "/tmp/workspace-agents",
      { conflictStrategy: "skip" },
    )
    expect(reloadConfigMock).toHaveBeenCalled()
    expect(agentProfileReloadMock).toHaveBeenCalled()
    expect(syncAgentProfilesToACPRegistryMock).toHaveBeenCalled()
    expect(scanSkillsFolderMock).toHaveBeenCalled()
    expect(stopAllLoopsMock).toHaveBeenCalled()
    expect(loopReloadMock).toHaveBeenCalled()
    expect(resumeSchedulingMock).toHaveBeenCalled()
    expect(startAllLoopsMock).toHaveBeenCalled()
    expect(knowledgeNotesReloadMock).toHaveBeenCalled()
    expect(stopServerMock).toHaveBeenCalledWith("removed")
    expect(stopServerMock).toHaveBeenCalledWith("disabled")
    expect(restartServerMock).toHaveBeenCalledWith("keep")
    expect(restartServerMock).not.toHaveBeenCalledWith("new")
    expect(initializeMcpMock).toHaveBeenCalled()
  })
})
