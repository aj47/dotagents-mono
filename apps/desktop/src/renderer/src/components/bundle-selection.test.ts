import { describe, expect, it } from "vitest"
import {
  DEFAULT_EXPORT_COMPONENTS,
  createDetailedBundleSelection,
  getBundleDependencyWarnings,
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
    knowledgeNotes: [{ id: "note-1", title: "Architecture", context: "search-only", summary: "Service boundaries" }],
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
      knowledgeNoteIds: ["note-1"],
    })
  })

  it("warns when a selected agent references unselected skills or MCP servers", () => {
    const items = createItems()

    const warnings = getBundleDependencyWarnings(items, DEFAULT_EXPORT_COMPONENTS, {
      agentProfileIds: ["agent-1"],
      mcpServerNames: [],
      skillIds: [],
      repeatTaskIds: ["task-1"],
      knowledgeNoteIds: ["note-1"],
    })

    expect(warnings).toEqual([
      'Agent One references MCP server "github", but it is not included.',
      'Agent One references skill "Skill One", but it is not included.',
    ])
  })
})
