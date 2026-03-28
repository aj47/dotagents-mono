import { beforeEach, describe, expect, it, vi } from "vitest"

const getSandboxStateMock = vi.fn()
const saveBaselineMock = vi.fn()
const saveCurrentAsSlotMock = vi.fn()
const switchToSlotMock = vi.fn()
const restoreBaselineMock = vi.fn()
const deleteSlotMock = vi.fn()
const renameSlotMock = vi.fn()
const createSlotFromCurrentStateMock = vi.fn()
const sanitizeSlotNameMock = vi.fn((value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-_ ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "slot",
)
const previewBundleMock = vi.fn()
const importBundleMock = vi.fn()
const refreshRuntimeAfterManagedBundleImportMock = vi.fn(async () => undefined)

vi.mock("./config", () => ({
  globalAgentsFolder: "/tmp/global-agents",
}))

vi.mock("./sandbox-service", () => ({
  getSandboxState: getSandboxStateMock,
  saveBaseline: saveBaselineMock,
  saveCurrentAsSlot: saveCurrentAsSlotMock,
  switchToSlot: switchToSlotMock,
  restoreBaseline: restoreBaselineMock,
  deleteSlot: deleteSlotMock,
  renameSlot: renameSlotMock,
  createSlotFromCurrentState: createSlotFromCurrentStateMock,
  sanitizeSlotName: sanitizeSlotNameMock,
}))

vi.mock("./bundle-service", () => ({
  previewBundle: previewBundleMock,
  importBundle: importBundleMock,
}))

vi.mock("./bundle-management", () => ({
  refreshRuntimeAfterManagedBundleImport:
    refreshRuntimeAfterManagedBundleImportMock,
}))

const sandboxManagementModule = import("./sandbox-management")

describe("sandbox management", () => {
  beforeEach(() => {
    getSandboxStateMock.mockReset()
    saveBaselineMock.mockReset()
    saveCurrentAsSlotMock.mockReset()
    switchToSlotMock.mockReset()
    restoreBaselineMock.mockReset()
    deleteSlotMock.mockReset()
    renameSlotMock.mockReset()
    createSlotFromCurrentStateMock.mockReset()
    previewBundleMock.mockReset()
    importBundleMock.mockReset()
    refreshRuntimeAfterManagedBundleImportMock.mockReset()
  })

  it("reads sandbox state from the shared global agents folder", async () => {
    getSandboxStateMock.mockReturnValue({
      activeSlot: "feature-a",
      slots: [],
    })

    const { getManagedSandboxState } = await sandboxManagementModule

    expect(getManagedSandboxState()).toEqual({
      activeSlot: "feature-a",
      slots: [],
    })
    expect(getSandboxStateMock).toHaveBeenCalledWith("/tmp/global-agents")
  })

  it("resolves sandbox slot selection by exact match or unique prefix", async () => {
    const { resolveManagedSandboxSlotSelection } = await sandboxManagementModule

    const slots = [
      { name: "default" },
      { name: "feature-alpha" },
      { name: "feature-beta" },
    ]

    expect(resolveManagedSandboxSlotSelection(slots, "feature-alpha")).toEqual({
      selectedSlot: { name: "feature-alpha" },
    })
    expect(resolveManagedSandboxSlotSelection(slots, "def")).toEqual({
      selectedSlot: { name: "default" },
    })
    expect(resolveManagedSandboxSlotSelection(slots, "feature")).toEqual({
      ambiguousSlots: [
        { name: "feature-alpha" },
        { name: "feature-beta" },
      ],
    })
  })

  it("refreshes runtime after switching or restoring the active sandbox slot", async () => {
    switchToSlotMock.mockReturnValue({
      success: true,
      previousSlot: "default",
      activeSlot: "feature-a",
    })
    restoreBaselineMock.mockReturnValue({
      success: true,
      previousSlot: "feature-a",
      activeSlot: "default",
    })

    const {
      switchManagedSandboxSlot,
      restoreManagedSandboxBaseline,
    } = await sandboxManagementModule

    await expect(switchManagedSandboxSlot("feature-a")).resolves.toEqual({
      success: true,
      previousSlot: "default",
      activeSlot: "feature-a",
    })
    await expect(restoreManagedSandboxBaseline()).resolves.toEqual({
      success: true,
      previousSlot: "feature-a",
      activeSlot: "default",
    })
    expect(switchToSlotMock).toHaveBeenCalledWith(
      "/tmp/global-agents",
      "feature-a",
    )
    expect(restoreBaselineMock).toHaveBeenCalledWith("/tmp/global-agents")
    expect(refreshRuntimeAfterManagedBundleImportMock).toHaveBeenCalledTimes(2)
  })

  it("rejects using the reserved baseline slot name for sandbox bundle imports", async () => {
    previewBundleMock.mockReturnValue({
      manifest: {
        name: "Sample Bundle",
      },
    })

    const { importManagedBundleToSandbox } = await sandboxManagementModule

    await expect(
      importManagedBundleToSandbox({
        filePath: "/tmp/sample.dotagents",
        slotName: "default",
        importOptions: { conflictStrategy: "skip" },
      }),
    ).resolves.toEqual({
      success: false,
      agentProfiles: [],
      mcpServers: [],
      skills: [],
      repeatTasks: [],
      knowledgeNotes: [],
      errors: [
        'Cannot import a bundle into the reserved "default" baseline slot',
      ],
      slotName: "default",
      sourceBundleName: "Sample Bundle",
    })
    expect(createSlotFromCurrentStateMock).not.toHaveBeenCalled()
    expect(importBundleMock).not.toHaveBeenCalled()
  })

  it("creates, switches, imports, re-snapshots, and refreshes sandbox bundle imports through one helper", async () => {
    previewBundleMock.mockReturnValue({
      manifest: {
        name: "Research Bundle",
      },
    })
    createSlotFromCurrentStateMock.mockReturnValue({
      success: true,
      slot: { name: "research" },
    })
    switchToSlotMock.mockReturnValue({
      success: true,
      previousSlot: "default",
      activeSlot: "research",
    })
    importBundleMock.mockResolvedValue({
      success: true,
      agentProfiles: [{ id: "planner", name: "Planner", action: "imported" }],
      mcpServers: [],
      skills: [],
      repeatTasks: [],
      knowledgeNotes: [],
      errors: [],
    })
    saveCurrentAsSlotMock.mockReturnValue({
      success: true,
      slot: { name: "research", sourceBundleName: "Research Bundle" },
    })

    const { importManagedBundleToSandbox } = await sandboxManagementModule

    await expect(
      importManagedBundleToSandbox({
        filePath: "/tmp/research.dotagents",
        slotName: "Research",
        importOptions: {
          conflictStrategy: "overwrite",
          components: { agentProfiles: true, skills: true },
        },
      }),
    ).resolves.toEqual({
      success: true,
      agentProfiles: [{ id: "planner", name: "Planner", action: "imported" }],
      mcpServers: [],
      skills: [],
      repeatTasks: [],
      knowledgeNotes: [],
      errors: [],
      slotName: "research",
      sourceBundleName: "Research Bundle",
    })
    expect(createSlotFromCurrentStateMock).toHaveBeenCalledWith(
      "/tmp/global-agents",
      "Research",
      { sourceBundleName: "Research Bundle" },
    )
    expect(switchToSlotMock).toHaveBeenCalledWith(
      "/tmp/global-agents",
      "Research",
    )
    expect(importBundleMock).toHaveBeenCalledWith(
      "/tmp/research.dotagents",
      "/tmp/global-agents",
      {
        conflictStrategy: "overwrite",
        components: { agentProfiles: true, skills: true },
      },
    )
    expect(saveCurrentAsSlotMock).toHaveBeenCalledWith(
      "/tmp/global-agents",
      "Research",
      { sourceBundleName: "Research Bundle" },
    )
    expect(refreshRuntimeAfterManagedBundleImportMock).toHaveBeenCalledTimes(1)
  })
})
