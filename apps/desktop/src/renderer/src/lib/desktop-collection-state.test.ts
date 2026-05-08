import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsSkillsSource = readFileSync(new URL("../pages/settings-skills.tsx", import.meta.url), "utf8")
const knowledgeSource = readFileSync(new URL("../pages/knowledge.tsx", import.meta.url), "utf8")
const settingsAgentsSource = readFileSync(new URL("../pages/settings-agents.tsx", import.meta.url), "utf8")
const mcpToolManagerSource = readFileSync(new URL("../components/mcp-tool-manager.tsx", import.meta.url), "utf8")

describe("desktop collection state helpers", () => {
  it("uses shared helpers for desktop renderer selection and expansion state", () => {
    expect(settingsSkillsSource).toContain("setSelectedSkillIds((prev) => toggleSetValue(prev, id))")

    expect(knowledgeSource).toContain("setSelectedIds((prev) => toggleSetValue(prev, id))")
    expect(knowledgeSource).toContain("setCollapsedGroupKeys((prev) => toggleSetValue(prev, key))")
    expect(knowledgeSource).toContain("setCollapsedSeriesKeys((prev) => toggleSetValue(prev, key))")
    expect(knowledgeSource).toContain("getVisibleSelectedValues(selectedIds, visibleIds)")
    expect(knowledgeSource).toContain("removeSetValues(prev, visibleSelectedIds)")
    expect(knowledgeSource).toContain("addSetValues(prev, visibleNotes.map((note) => note.id))")
    expect(knowledgeSource).toContain("deleteMultipleMutation.mutate(visibleSelectedIds)")

    expect(settingsAgentsSource).toContain("setCollapsedSections(prev => toggleSetValue(prev, section))")
    expect(settingsAgentsSource).toContain("setExpandedServers(prev => toggleSetValue(prev, serverName))")
    expect(mcpToolManagerSource).toContain("setExpandedSources((prev) => toggleSetValue(prev, sourceName))")

    expect(settingsSkillsSource).not.toContain("const next = new Set(prev)\n      if (next.has(id))")
    expect(knowledgeSource).not.toContain("[...selectedIds].filter((id) => visibleIds.has(id))")
    expect(settingsAgentsSource).not.toContain("const next = new Set(prev)\n      if (next.has(section))")
    expect(mcpToolManagerSource).not.toContain("const newSet = new Set(prev)")
  })
})
