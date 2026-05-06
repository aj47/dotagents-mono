import { describe, expect, it } from "vitest"

import {
  buildBundleExportResponse,
  buildBundleExportableItemsResponse,
  exportBundleAction,
  getBundleExportableItemsAction,
  parseExportBundleRequestBody,
  type DotAgentsBundle,
  type ExportableBundleItems,
} from "./bundle-api"

const bundle: DotAgentsBundle = {
  manifest: {
    version: 1,
    name: "Test Bundle",
    createdAt: "2026-05-06T00:00:00.000Z",
    exportedFrom: "dotagents",
    components: {
      agentProfiles: 1,
      mcpServers: 0,
      skills: 1,
      repeatTasks: 0,
      knowledgeNotes: 0,
    },
  },
  agentProfiles: [{
    id: "agent-1",
    name: "agent",
    enabled: true,
    connection: { type: "internal" },
  }],
  mcpServers: [],
  skills: [{
    id: "skill-1",
    name: "Skill",
    instructions: "Do the thing",
  }],
  repeatTasks: [],
  knowledgeNotes: [],
}

const exportableItems: ExportableBundleItems = {
  agentProfiles: [{
    id: "agent-1",
    name: "agent",
    enabled: true,
    referencedMcpServerNames: [],
    referencedSkillIds: ["skill-1"],
  }],
  mcpServers: [],
  skills: [{
    id: "skill-1",
    name: "Skill",
    description: "Reusable workflow",
  }],
  repeatTasks: [],
  knowledgeNotes: [],
}

describe("bundle API helpers", () => {
  it("parses bundle export requests with optional selection filters", () => {
    expect(parseExportBundleRequestBody({
      name: "  Shared Bundle  ",
      description: "  Useful setup  ",
      agentProfileIds: [" agent-1 ", ""],
      skillIds: ["skill-1"],
      components: { agentProfiles: true, mcpServers: false },
      publicMetadata: {
        summary: "Useful setup",
        author: { displayName: "AJ", handle: "aj" },
        tags: [" ai ", ""],
        compatibility: { minDesktopVersion: "1.0.0", notes: ["Needs desktop"] },
      },
    })).toEqual({
      ok: true,
      request: {
        name: "Shared Bundle",
        description: "Useful setup",
        agentProfileIds: ["agent-1"],
        skillIds: ["skill-1"],
        components: { agentProfiles: true, mcpServers: false },
        publicMetadata: {
          summary: "Useful setup",
          author: { displayName: "AJ", handle: "aj" },
          tags: ["ai"],
          compatibility: { minDesktopVersion: "1.0.0", notes: ["Needs desktop"] },
        },
      },
    })

    expect(parseExportBundleRequestBody({ skillIds: "skill-1" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "skillIds must be an array of strings",
    })
    expect(parseExportBundleRequestBody({ components: { skills: "yes" } })).toEqual({
      ok: false,
      statusCode: 400,
      error: "components.skills must be a boolean",
    })
  })

  it("builds bundle responses", () => {
    expect(buildBundleExportableItemsResponse(exportableItems)).toEqual({
      success: true,
      items: exportableItems,
    })
    expect(buildBundleExportResponse(bundle)).toEqual({
      success: true,
      bundle,
      bundleJson: JSON.stringify(bundle, null, 2),
    })
  })

  it("runs bundle actions through service adapters", async () => {
    const logs: string[] = []
    const options = {
      service: {
        getExportableItems: () => exportableItems,
        exportBundle: async () => bundle,
      },
      diagnostics: {
        logError: (_source: string, message: string) => logs.push(message),
      },
    }

    expect(getBundleExportableItemsAction(options)).toEqual({
      statusCode: 200,
      body: buildBundleExportableItemsResponse(exportableItems),
    })
    await expect(exportBundleAction({ skillIds: ["skill-1"] }, options)).resolves.toEqual({
      statusCode: 200,
      body: buildBundleExportResponse(bundle),
    })
    await expect(exportBundleAction({ skillIds: "bad" }, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "skillIds must be an array of strings" },
    })
    expect(logs).toEqual([])
  })
})
