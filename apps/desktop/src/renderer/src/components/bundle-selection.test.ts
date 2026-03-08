import { describe, expect, it } from "vitest"
import {
  DEFAULT_EXPORT_COMPONENTS,
  createDetailedBundleSelection,
  getBundleDependencyWarnings,
  getBundleMemorySecretWarnings,
  type BundleExportableItems,
} from "./bundle-selection"

function createItems(): BundleExportableItems {
  return {
    agentProfiles: [
      {
        id: "agent-1",
        name: "agent-1",
        displayName: "Agent One",
        enabled: true,
        referencedMcpServerNames: ["github"],
        referencedSkillIds: ["skill-1"],
      },
    ],
    mcpServers: [{ name: "github", transport: "stdio", enabled: true }],
    skills: [{ id: "skill-1", name: "Skill One", description: "Test" }],
    repeatTasks: [{ id: "task-1", name: "Task One", intervalMinutes: 60, enabled: true }],
    memories: [{
      id: "memory-1",
      title: "Memory One",
      importance: "medium",
      containsPotentialSecret: false,
      secretWarningFields: [],
    }],
  }
}

describe("bundle-selection helpers", () => {
  it("creates an initial selection that includes every exportable item", () => {
    const items = createItems()

    expect(createDetailedBundleSelection(items)).toEqual({
      agentProfileIds: ["agent-1"],
      mcpServerNames: ["github"],
      skillIds: ["skill-1"],
      repeatTaskIds: ["task-1"],
      memoryIds: ["memory-1"],
    })
  })

  it("keeps memories opt-in by default for export dialogs", () => {
    const items = createItems()

    expect(DEFAULT_EXPORT_COMPONENTS.memories).toBe(false)
    expect(createDetailedBundleSelection(items, DEFAULT_EXPORT_COMPONENTS)).toEqual({
      agentProfileIds: ["agent-1"],
      mcpServerNames: ["github"],
      skillIds: ["skill-1"],
      repeatTaskIds: ["task-1"],
      memoryIds: [],
    })
  })

  it("warns when a selected agent references unselected skills or MCP servers", () => {
    const items = createItems()

    const warnings = getBundleDependencyWarnings(items, DEFAULT_EXPORT_COMPONENTS, {
      agentProfileIds: ["agent-1"],
      mcpServerNames: [],
      skillIds: [],
      repeatTaskIds: ["task-1"],
      memoryIds: ["memory-1"],
    })

    expect(warnings).toEqual([
      "Agent One references MCP server “github”, but it is not included.",
      "Agent One references skill “Skill One”, but it is not included.",
    ])
  })

  it("surfaces selected memory secret warnings only when memories stay included", () => {
    const items = createItems()
    items.memories[0] = {
      ...items.memories[0],
      containsPotentialSecret: true,
      secretWarningFields: ["content", "userNotes"],
    }

    expect(getBundleMemorySecretWarnings(items, {
      ...DEFAULT_EXPORT_COMPONENTS,
      memories: true,
    }, {
      agentProfileIds: ["agent-1"],
      mcpServerNames: ["github"],
      skillIds: ["skill-1"],
      repeatTaskIds: ["task-1"],
      memoryIds: ["memory-1"],
    })).toEqual([
      {
        id: "memory-1",
        title: "Memory One",
        fields: ["content", "userNotes"],
      },
    ])

    expect(getBundleMemorySecretWarnings(items, {
      ...DEFAULT_EXPORT_COMPONENTS,
      memories: false,
    }, {
      agentProfileIds: ["agent-1"],
      mcpServerNames: ["github"],
      skillIds: ["skill-1"],
      repeatTaskIds: ["task-1"],
      memoryIds: ["memory-1"],
    })).toEqual([])
  })
})