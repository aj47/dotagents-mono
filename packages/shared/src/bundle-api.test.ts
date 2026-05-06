import { describe, expect, it } from "vitest"

import {
  BUNDLE_COMPONENT_OPTIONS,
  BUNDLE_IMPORT_CONFLICT_STRATEGY_OPTIONS,
  DEFAULT_BUNDLE_COMPONENT_SELECTION,
  EMPTY_BUNDLE_ITEM_SELECTION,
  buildBundleExportResponse,
  buildBundleExportableItemsResponse,
  buildBundleImportPreviewResponse,
  createBundleItemSelection,
  exportBundleAction,
  getBundleDependencyWarnings,
  getBundleExportableItemsAction,
  hasSelectedBundleComponent,
  importBundleAction,
  parseExportBundleRequestBody,
  parseImportBundleRequestBody,
  parsePreviewBundleImportRequestBody,
  previewBundleImportAction,
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

const importPreview = {
  bundle,
  conflicts: {
    agentProfiles: [{ id: "agent-1", name: "agent", existingName: "Existing agent" }],
    mcpServers: [],
    skills: [],
    repeatTasks: [],
    knowledgeNotes: [],
  },
}

const importResult = {
  success: true,
  agentProfiles: [{ id: "agent-1", name: "agent", action: "imported" as const }],
  mcpServers: [],
  skills: [],
  repeatTasks: [],
  knowledgeNotes: [],
  errors: [],
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

  it("parses bundle import requests", () => {
    const bundleJson = JSON.stringify(bundle)

    expect(parsePreviewBundleImportRequestBody({ bundleJson })).toEqual({
      ok: true,
      request: { bundleJson },
    })
    expect(parseImportBundleRequestBody({
      bundleJson,
      conflictStrategy: "rename",
      components: { skills: false, agentProfiles: true },
    })).toEqual({
      ok: true,
      request: {
        bundleJson,
        conflictStrategy: "rename",
        components: { skills: false, agentProfiles: true },
      },
    })
    expect(parseImportBundleRequestBody({ bundleJson })).toEqual({
      ok: true,
      request: {
        bundleJson,
        conflictStrategy: "skip",
      },
    })
    expect(parsePreviewBundleImportRequestBody({ bundleJson: "{bad" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "bundleJson must be valid JSON",
    })
    expect(parseImportBundleRequestBody({ bundleJson, conflictStrategy: "merge" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "conflictStrategy must be skip, overwrite, or rename",
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
    expect(buildBundleImportPreviewResponse(importPreview)).toEqual({
      success: true,
      preview: importPreview,
    })
  })

  it("builds shared bundle selection defaults and dependency warnings", () => {
    expect(DEFAULT_BUNDLE_COMPONENT_SELECTION).toEqual({
      agentProfiles: true,
      mcpServers: true,
      skills: true,
      repeatTasks: true,
      knowledgeNotes: true,
    })
    expect(EMPTY_BUNDLE_ITEM_SELECTION).toEqual({
      agentProfileIds: [],
      mcpServerNames: [],
      skillIds: [],
      repeatTaskIds: [],
      knowledgeNoteIds: [],
    })
    expect(BUNDLE_COMPONENT_OPTIONS.map((option) => option.key)).toEqual([
      "agentProfiles",
      "mcpServers",
      "skills",
      "repeatTasks",
      "knowledgeNotes",
    ])
    expect(BUNDLE_IMPORT_CONFLICT_STRATEGY_OPTIONS.map((option) => option.value)).toEqual([
      "skip",
      "rename",
      "overwrite",
    ])
    expect(createBundleItemSelection(exportableItems)).toEqual({
      agentProfileIds: ["agent-1"],
      mcpServerNames: [],
      skillIds: ["skill-1"],
      repeatTaskIds: [],
      knowledgeNoteIds: [],
    })
    expect(hasSelectedBundleComponent({ skills: false, agentProfiles: false })).toBe(false)
    expect(hasSelectedBundleComponent({ skills: true, agentProfiles: false })).toBe(true)

    expect(getBundleDependencyWarnings(exportableItems, DEFAULT_BUNDLE_COMPONENT_SELECTION, {
      agentProfileIds: ["agent-1"],
      mcpServerNames: [],
      skillIds: [],
      repeatTaskIds: [],
      knowledgeNoteIds: [],
    })).toEqual([
      'agent references skill "Skill", but it is not included.',
    ])
  })

  it("runs bundle actions through service adapters", async () => {
    const bundleJson = JSON.stringify(bundle)
    const logs: string[] = []
    const options = {
      service: {
        getExportableItems: () => exportableItems,
        exportBundle: async () => bundle,
        previewBundleImport: async () => importPreview,
        importBundle: async () => importResult,
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
    await expect(previewBundleImportAction({ bundleJson }, options)).resolves.toEqual({
      statusCode: 200,
      body: buildBundleImportPreviewResponse(importPreview),
    })
    await expect(importBundleAction({ bundleJson, conflictStrategy: "overwrite" }, options)).resolves.toEqual({
      statusCode: 200,
      body: importResult,
    })
    await expect(importBundleAction({ bundleJson, conflictStrategy: "merge" }, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "conflictStrategy must be skip, overwrite, or rename" },
    })
    expect(logs).toEqual([])
  })
})
