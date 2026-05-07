import { describe, expect, it } from "vitest"

import {
  BUNDLE_COMPONENT_KEYS,
  BUNDLE_COMPONENT_OPTIONS,
  BUNDLE_IMPORT_CONFLICT_STRATEGY_OPTIONS,
  DEFAULT_BUNDLE_COMPONENT_SELECTION,
  DEFAULT_BUNDLE_PUBLISH_COMPONENT_SELECTION,
  EMPTY_BUNDLE_ITEM_SELECTION,
  buildBundleExportResponse,
  buildBundleExportableItemsResponse,
  buildBundleImportPreviewResponse,
  createBundleItemSelection,
  createBundleRouteActions,
  createTemporaryBundleFileImportService,
  createTemporaryBundleFileName,
  exportBundleAction,
  getAvailableBundleComponentSelection,
  getBundleDependencyWarnings,
  getBundleExportableItemsAction,
  getBundleImportChangedItemCount,
  hasBundleImportConflicts,
  hasSelectedBundleComponent,
  importBundleAction,
  importBundleFromTemporaryFile,
  parseExportBundleRequestBody,
  parseImportBundleRequestBody,
  parsePreviewBundleImportRequestBody,
  previewBundleImportAction,
  previewBundleImportFromTemporaryFile,
  resolveBundleExportLayerDirs,
  resolveBundleComponentSelection,
  resolveBundleImportTargetDir,
  sanitizeBundlePublicMetadata,
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
    expect(DEFAULT_BUNDLE_PUBLISH_COMPONENT_SELECTION).toEqual({
      agentProfiles: true,
      mcpServers: true,
      skills: true,
      repeatTasks: false,
      knowledgeNotes: false,
    })
    expect(EMPTY_BUNDLE_ITEM_SELECTION).toEqual({
      agentProfileIds: [],
      mcpServerNames: [],
      skillIds: [],
      repeatTaskIds: [],
      knowledgeNoteIds: [],
    })
    expect(BUNDLE_COMPONENT_KEYS).toEqual([
      "agentProfiles",
      "mcpServers",
      "skills",
      "repeatTasks",
      "knowledgeNotes",
    ])
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
    expect(BUNDLE_IMPORT_CONFLICT_STRATEGY_OPTIONS.map((option) => option.importLabel)).toEqual([
      "Skip existing items",
      "Rename imported items",
      "Overwrite existing items",
    ])
    expect(resolveBundleComponentSelection({ agentProfiles: false, skills: true })).toEqual({
      agentProfiles: false,
      mcpServers: true,
      skills: true,
      repeatTasks: true,
      knowledgeNotes: true,
    })
    expect(getAvailableBundleComponentSelection(
      { agentProfiles: true, skills: true, mcpServers: true },
      { skills: true, mcpServers: false, agentProfiles: false },
    )).toEqual({
      agentProfiles: false,
      mcpServers: false,
      skills: true,
      repeatTasks: true,
      knowledgeNotes: true,
    })
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
    expect(hasBundleImportConflicts(importPreview.conflicts, DEFAULT_BUNDLE_COMPONENT_SELECTION)).toBe(true)
    expect(hasBundleImportConflicts(importPreview.conflicts, { agentProfiles: false })).toBe(false)
    expect(getBundleImportChangedItemCount({
      ...importResult,
      skills: [{ id: "skill-1", name: "Skill", action: "skipped" }],
      repeatTasks: [{ id: "task-1", name: "Task", action: "renamed" }],
      knowledgeNotes: [{ id: "note-1", name: "Note", action: "overwritten" }],
    })).toBe(3)
  })

  it("resolves layered bundle export and import target directories", () => {
    expect(resolveBundleExportLayerDirs("/global/.agents")).toEqual(["/global/.agents"])
    expect(resolveBundleExportLayerDirs("/global/.agents", "/workspace/.agents")).toEqual([
      "/global/.agents",
      "/workspace/.agents",
    ])
    expect(resolveBundleImportTargetDir("/global/.agents")).toBe("/global/.agents")
    expect(resolveBundleImportTargetDir("/global/.agents", "/workspace/.agents")).toBe("/workspace/.agents")
  })

  it("creates temporary bundle filenames with shared .dotagents naming", () => {
    expect(createTemporaryBundleFileName({
      now: () => 123456789,
      createUniqueId: () => "unique-id",
    })).toBe("123456789-unique-id.dotagents")
  })

  it("sanitizes public bundle metadata for shared Hub publishing", () => {
    expect(sanitizeBundlePublicMetadata({
      summary: "  Shareable bundle  ",
      author: {
        displayName: " AJ ",
        handle: " techfren ",
        url: " https://dotagents.org/aj ",
      },
      tags: [" agents ", "", "mobile", "agents"],
      compatibility: {
        minDesktopVersion: " 1.0.0 ",
        notes: [" Desktop server required ", "", "Desktop server required"],
      },
    })).toEqual({
      summary: "Shareable bundle",
      author: {
        displayName: "AJ",
        handle: "techfren",
        url: "https://dotagents.org/aj",
      },
      tags: ["agents", "mobile"],
      compatibility: {
        minDesktopVersion: "1.0.0",
        notes: ["Desktop server required"],
      },
    })

    expect(() => sanitizeBundlePublicMetadata({
      summary: " ",
      author: { displayName: "AJ" },
      tags: [],
    })).toThrow(/summary/)
    expect(() => sanitizeBundlePublicMetadata({
      summary: "Summary",
      author: { displayName: " " },
      tags: [],
    })).toThrow(/displayName/)
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

    const routeActions = createBundleRouteActions(options)
    expect(routeActions.getBundleExportableItems()).toEqual({
      statusCode: 200,
      body: buildBundleExportableItemsResponse(exportableItems),
    })
    await expect(routeActions.exportBundle({ skillIds: ["skill-1"] })).resolves.toEqual({
      statusCode: 200,
      body: buildBundleExportResponse(bundle),
    })
    await expect(routeActions.previewBundleImport({ bundleJson })).resolves.toEqual({
      statusCode: 200,
      body: buildBundleImportPreviewResponse(importPreview),
    })
    await expect(routeActions.importBundle({ bundleJson, conflictStrategy: "overwrite" })).resolves.toEqual({
      statusCode: 200,
      body: importResult,
    })
  })

  it("runs temporary bundle-file imports through shared adapters", async () => {
    const bundleJson = JSON.stringify(bundle)
    const calls: string[] = []
    const options = {
      temporaryFiles: {
        writeTemporaryBundleFile: async (json: string) => {
          calls.push(`write:${json}`)
          return "/tmp/import.dotagents"
        },
        deleteTemporaryBundleFile: async (filePath: string) => {
          calls.push(`delete:${filePath}`)
        },
      },
      service: {
        getImportTargetDir: () => {
          calls.push("target")
          return "/agents"
        },
        previewBundleFile: async (filePath: string, targetDir: string) => {
          calls.push(`preview:${filePath}:${targetDir}`)
          return {
            success: true,
            bundle,
            conflicts: importPreview.conflicts,
          }
        },
        importBundleFile: async (
          filePath: string,
          targetDir: string,
          request: { conflictStrategy: string; components?: unknown },
        ) => {
          calls.push(`import:${filePath}:${targetDir}:${request.conflictStrategy}:${JSON.stringify(request.components)}`)
          return importResult
        },
      },
    }

    await expect(previewBundleImportFromTemporaryFile({ bundleJson }, options)).resolves.toEqual(importPreview)
    await expect(importBundleFromTemporaryFile({
      bundleJson,
      conflictStrategy: "rename",
      components: { skills: false },
    }, options)).resolves.toEqual(importResult)

    expect(calls).toEqual([
      `write:${bundleJson}`,
      "target",
      "preview:/tmp/import.dotagents:/agents",
      "delete:/tmp/import.dotagents",
      `write:${bundleJson}`,
      "target",
      'import:/tmp/import.dotagents:/agents:rename:{"skills":false}',
      "delete:/tmp/import.dotagents",
    ])
  })

  it("normalizes failed temporary bundle previews and ignores cleanup errors", async () => {
    const calls: string[] = []
    const options = {
      temporaryFiles: {
        writeTemporaryBundleFile: () => {
          calls.push("write")
          return "/tmp/bad.dotagents"
        },
        deleteTemporaryBundleFile: () => {
          calls.push("delete")
          throw new Error("already gone")
        },
      },
      service: {
        getImportTargetDir: () => "/agents",
        previewBundleFile: () => {
          calls.push("preview")
          return { success: false }
        },
        importBundleFile: () => importResult,
      },
    }

    await expect(previewBundleImportFromTemporaryFile({
      bundleJson: JSON.stringify(bundle),
    }, options)).resolves.toBeNull()
    expect(calls).toEqual(["write", "preview", "delete"])
  })

  it("creates a bundle action service from temporary file adapters", async () => {
    const bundleJson = JSON.stringify(bundle)
    const routeService = createTemporaryBundleFileImportService({
      temporaryFiles: {
        writeTemporaryBundleFile: () => "/tmp/service.dotagents",
        deleteTemporaryBundleFile: () => undefined,
      },
      service: {
        getImportTargetDir: () => "/agents",
        previewBundleFile: () => ({
          success: true,
          bundle,
          conflicts: importPreview.conflicts,
        }),
        importBundleFile: (_filePath, _targetDir, request) => ({
          ...importResult,
          errors: [`strategy:${request.conflictStrategy}`],
        }),
      },
    })

    await expect(routeService.previewBundleImport({ bundleJson })).resolves.toEqual(importPreview)
    await expect(routeService.importBundle({ bundleJson })).resolves.toEqual({
      ...importResult,
      errors: ["strategy:skip"],
    })
  })
})
