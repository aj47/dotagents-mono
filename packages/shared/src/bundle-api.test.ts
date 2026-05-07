import { describe, expect, it } from "vitest"

import {
  BUNDLE_COMPONENT_KEYS,
  BUNDLE_COMPONENT_OPTIONS,
  BUNDLE_IMPORT_CONFLICT_STRATEGY_OPTIONS,
  DEFAULT_BUNDLE_COMPONENT_SELECTION,
  DEFAULT_BUNDLE_PUBLISH_COMPONENT_SELECTION,
  EMPTY_BUNDLE_ITEM_SELECTION,
  buildBundleAgentProfilesFromProfiles,
  buildBundleExportResponse,
  buildBundleExportableItemsResponse,
  buildBundleImportPreviewConflicts,
  buildBundleImportPreviewResponse,
  buildBundleKnowledgeNotesFromNotes,
  buildBundleMcpServersFromConfig,
  buildBundleRepeatTasksFromTasks,
  buildBundleSkillsFromSkills,
  buildDotAgentsBundle,
  buildExportableBundleAgentProfiles,
  buildExportableBundleKnowledgeNotes,
  buildExportableBundleMcpServers,
  buildExportableBundleRepeatTasks,
  buildExportableBundleSkills,
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
  mergeBundleBuildItems,
  mergeExportableBundleItems,
  parseDotAgentsBundle,
  parseExportBundleRequestBody,
  parseImportBundleRequestBody,
  parsePreviewBundleImportRequestBody,
  previewBundleImportAction,
  previewBundleImportFromTemporaryFile,
  readBundleMcpServersFromConfig,
  resolveBundleExportLayerDirs,
  resolveBundleComponentSelection,
  resolveBundleImportTargetDir,
  sanitizeBundlePublicMetadata,
  stripBundleSecretsFromObject,
  writeCanonicalBundleMcpConfig,
  type DotAgentsBundle,
  type ExportableBundleItems,
} from "./bundle-api"
import type { AgentProfile } from "./agent-profile-domain"
import type { KnowledgeNote } from "./knowledge-note-domain"
import type { AgentSkill, LoopConfig } from "./types"

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

  it("parses current and legacy DotAgents bundle payloads", () => {
    expect(parseDotAgentsBundle(bundle)).toEqual(bundle)

    const legacyBundle = {
      manifest: {
        ...bundle.manifest,
        components: {
          agentProfiles: 1,
          mcpServers: 0,
          skills: 1,
        },
      },
      agentProfiles: bundle.agentProfiles,
      mcpServers: bundle.mcpServers,
      skills: bundle.skills,
    }

    expect(parseDotAgentsBundle(legacyBundle)).toEqual(bundle)
    expect(parseDotAgentsBundle({ manifest: { version: 2 } })).toBeNull()
  })

  it("normalizes continuous bundle tasks without schedules", () => {
    const continuousBundle: DotAgentsBundle = {
      ...bundle,
      manifest: {
        ...bundle.manifest,
        components: {
          ...bundle.manifest.components,
          repeatTasks: 1,
        },
      },
      repeatTasks: [{
        id: "task-1",
        name: "Task",
        prompt: "Run continuously",
        intervalMinutes: 5,
        enabled: true,
        runContinuously: true,
        schedule: { type: "daily", times: ["09:00"] },
      }],
    }

    const parsed = parseDotAgentsBundle(continuousBundle)

    expect(parsed?.repeatTasks).toHaveLength(1)
    expect(parsed?.repeatTasks[0]).toMatchObject({
      id: "task-1",
      runContinuously: true,
    })
    expect(parsed?.repeatTasks[0]).not.toHaveProperty("schedule")
  })

  it("builds shared bundle import preview conflicts", () => {
    const conflictBundle: DotAgentsBundle = {
      ...bundle,
      manifest: {
        ...bundle.manifest,
        components: {
          agentProfiles: 1,
          mcpServers: 1,
          skills: 1,
          repeatTasks: 1,
          knowledgeNotes: 1,
        },
      },
      mcpServers: [{ name: "server-1" }],
      repeatTasks: [{
        id: "task-1",
        name: "Task",
        prompt: "Run",
        intervalMinutes: 15,
        enabled: true,
      }],
      knowledgeNotes: [{
        id: "note-1",
        title: "Note",
        context: "search-only",
        body: "Body",
        tags: [],
        updatedAt: 123,
      }],
    }

    expect(buildBundleImportPreviewConflicts(conflictBundle, {
      agentProfiles: [{ id: "agent-1", name: "Existing Agent" }],
      mcpServers: [{ id: "server-1" }],
      skills: [{ id: "skill-1", name: "Existing Skill" }],
      repeatTasks: [{ id: "task-1", name: "Existing Task" }],
      knowledgeNotes: [{ id: "note-1", name: "Existing Note" }],
    })).toEqual({
      agentProfiles: [{ id: "agent-1", name: "agent", existingName: "Existing Agent" }],
      mcpServers: [{ id: "server-1", name: "server-1" }],
      skills: [{ id: "skill-1", name: "Skill", existingName: "Existing Skill" }],
      repeatTasks: [{ id: "task-1", name: "Task", existingName: "Existing Task" }],
      knowledgeNotes: [{ id: "note-1", name: "Note", existingName: "Existing Note" }],
    })
  })

  it("normalizes bundle MCP config shapes for export and import", () => {
    const config = {
      legacyServer: { command: "legacy" },
      mcpFuturePreference: { collapsed: true },
      mcpGithub: { command: "node" },
      mcpServers: {
        legacyServer: { command: "direct" },
        topLevel: { transport: "stdio" },
      },
      mcpConfig: {
        mcpServers: {
          topLevel: { command: "nested" },
          nested: { command: "nested" },
        },
        metadata: { enabled: true },
      },
      mcpDisabledTools: { nested: ["tool"] },
    }

    expect(readBundleMcpServersFromConfig(config)).toEqual({
      legacyServer: { command: "direct" },
      mcpGithub: { command: "node" },
      topLevel: { command: "nested" },
      nested: { command: "nested" },
    })

    expect(writeCanonicalBundleMcpConfig(config, {
      finalServer: { command: "final" },
    })).toEqual({
      mcpFuturePreference: { collapsed: true },
      mcpConfig: {
        metadata: { enabled: true },
        mcpServers: {
          finalServer: { command: "final" },
        },
      },
      mcpDisabledTools: { nested: ["tool"] },
    })
  })

  it("strips secret-looking bundle MCP fields recursively", () => {
    expect(stripBundleSecretsFromObject({
      command: "node",
      env: {
        API_KEY: "secret",
        KEEP_ME: "visible",
      },
      headers: {
        Authorization: "Bearer token",
      },
      nested: [{ password: "pass", value: "ok" }],
    })).toEqual({
      command: "node",
      env: {
        API_KEY: "<CONFIGURE_YOUR_KEY>",
        KEEP_ME: "visible",
      },
      headers: {
        Authorization: "<CONFIGURE_YOUR_KEY>",
      },
      nested: [{ password: "<CONFIGURE_YOUR_KEY>", value: "ok" }],
    })
  })

  it("builds export-safe bundle MCP server entries from config", () => {
    expect(buildBundleMcpServersFromConfig({
      mcpConfig: {
        mcpServers: {
          filesystem: {
            command: "node",
            args: ["server.js", 1],
            transport: "stdio",
            disabled: true,
            env: {
              API_KEY: "secret",
            },
          },
          remote: {
            transport: "http",
            url: "https://example.com/mcp",
          },
          malformed: "skip-me",
        },
      },
    }, [" filesystem ", "missing", ""])).toEqual([{
      name: "filesystem",
      command: "node",
      args: ["server.js", "1"],
      transport: "stdio",
      enabled: false,
    }])

    expect(buildBundleMcpServersFromConfig({
      mcpConfig: {
        mcpServers: {
          remote: {
            transport: "http",
            disabled: false,
          },
        },
      },
    })).toEqual([{
      name: "remote",
      command: undefined,
      args: undefined,
      transport: "http",
      enabled: true,
    }])
  })

  it("builds bundle records from loaded app records", () => {
    const profile: AgentProfile = {
      id: "agent-1",
      name: "agent",
      displayName: "Agent",
      description: "Runs work",
      enabled: true,
      role: "external-agent",
      systemPrompt: "You are helpful",
      guidelines: "Be direct",
      connection: {
        type: "stdio",
        command: "node",
        args: ["agent.js"],
        cwd: "/tmp/agent",
        baseUrl: "https://agents.example.com",
        env: { API_KEY: "secret" },
      },
      toolConfig: { enabledServers: ["filesystem", ""] },
      skillsConfig: { enabledSkillIds: ["research", ""] },
      createdAt: 1,
      updatedAt: 2,
    }
    const skill: AgentSkill = {
      id: "skill-1",
      name: "Skill",
      description: "Skill description",
      instructions: "Follow the instructions",
      createdAt: 1,
      updatedAt: 2,
    }
    const task: LoopConfig = {
      id: "task-1",
      name: "Task",
      prompt: "Run it",
      intervalMinutes: 30,
      enabled: true,
      profileId: "agent-1",
      runOnStartup: true,
      speakOnTrigger: false,
      continueInSession: true,
      runContinuously: true,
      schedule: { type: "daily", times: ["09:00"] },
    }
    const note: KnowledgeNote = {
      id: "note-1",
      title: "Note",
      context: "search-only",
      body: "Useful context",
      summary: "Context summary",
      tags: ["context"],
      references: ["https://example.com"],
      createdAt: 1,
      updatedAt: 2,
      group: "work",
      series: "weekly",
      entryType: "note",
    }

    expect(buildBundleAgentProfilesFromProfiles([profile], [" agent-1 ", "missing", ""])).toEqual([{
      id: "agent-1",
      name: "agent",
      displayName: "Agent",
      description: "Runs work",
      enabled: true,
      role: "external-agent",
      systemPrompt: "You are helpful",
      guidelines: "Be direct",
      connection: {
        type: "stdio",
        command: "node",
        args: ["agent.js"],
        cwd: "/tmp/agent",
        baseUrl: "https://agents.example.com",
      },
    }])
    expect(buildBundleSkillsFromSkills([skill], [" skill-1 "])).toEqual([{
      id: "skill-1",
      name: "Skill",
      description: "Skill description",
      instructions: "Follow the instructions",
      source: "local",
    }])
    expect(buildBundleRepeatTasksFromTasks([task], ["task-1"])).toEqual([{
      id: "task-1",
      name: "Task",
      prompt: "Run it",
      intervalMinutes: 30,
      enabled: true,
      runOnStartup: true,
      speakOnTrigger: false,
      continueInSession: true,
      runContinuously: true,
    }])
    expect(buildBundleKnowledgeNotesFromNotes([note], ["note-1"])).toEqual([note])
  })

  it("builds exportable item summaries from loaded app records", () => {
    const profile: AgentProfile = {
      id: "agent-1",
      name: "agent",
      displayName: "Agent",
      enabled: true,
      role: "chat-agent",
      connection: { type: "internal" },
      toolConfig: { enabledServers: ["filesystem", ""] },
      skillsConfig: { enabledSkillIds: ["research", ""] },
      createdAt: 1,
      updatedAt: 2,
    }
    const skill: AgentSkill = {
      id: "skill-1",
      name: "Skill",
      description: "Skill description",
      instructions: "Follow the instructions",
      createdAt: 1,
      updatedAt: 2,
      source: "imported",
    }
    const task: LoopConfig = {
      id: "task-1",
      name: "Task",
      prompt: "Run it",
      intervalMinutes: 30,
      enabled: false,
    }
    const note: KnowledgeNote = {
      id: "note-1",
      title: "Note",
      context: "auto",
      body: "Useful context",
      summary: "Context summary",
      tags: [],
      updatedAt: 2,
    }

    expect(buildExportableBundleAgentProfiles([profile])).toEqual([{
      id: "agent-1",
      name: "agent",
      displayName: "Agent",
      enabled: true,
      role: "chat-agent",
      referencedMcpServerNames: ["filesystem"],
      referencedSkillIds: ["research"],
    }])
    expect(buildExportableBundleMcpServers([{
      name: "filesystem",
      command: "node",
      transport: "stdio",
      enabled: false,
    }])).toEqual([{
      name: "filesystem",
      transport: "stdio",
      enabled: false,
    }])
    expect(buildExportableBundleSkills([skill])).toEqual([{
      id: "skill-1",
      name: "Skill",
      description: "Skill description",
    }])
    expect(buildExportableBundleRepeatTasks([task])).toEqual([{
      id: "task-1",
      name: "Task",
      intervalMinutes: 30,
      enabled: false,
    }])
    expect(buildExportableBundleKnowledgeNotes([note])).toEqual([{
      id: "note-1",
      title: "Note",
      context: "auto",
      summary: "Context summary",
    }])
  })

  it("builds DotAgents bundles with shared manifest defaults", () => {
    expect(buildDotAgentsBundle({
      name: "Shared Bundle",
      description: "Portable setup",
      publicMetadata: {
        summary: "  Useful bundle  ",
        author: { displayName: " AJ " },
        tags: [" agents ", "agents"],
      },
    }, {
      agentProfiles: bundle.agentProfiles,
      mcpServers: [{ name: "server-1" }],
      skills: bundle.skills,
      repeatTasks: [],
      knowledgeNotes: [],
    }, {
      exportedFrom: "dotagents-desktop",
      now: () => new Date("2026-05-06T12:00:00.000Z"),
    })).toEqual({
      manifest: {
        version: 1,
        name: "Shared Bundle",
        description: "Portable setup",
        createdAt: "2026-05-06T12:00:00.000Z",
        exportedFrom: "dotagents-desktop",
        publicMetadata: {
          summary: "Useful bundle",
          author: { displayName: "AJ" },
          tags: ["agents"],
        },
        components: {
          agentProfiles: 1,
          mcpServers: 1,
          skills: 1,
          repeatTasks: 0,
          knowledgeNotes: 0,
        },
      },
      agentProfiles: bundle.agentProfiles,
      mcpServers: [{ name: "server-1" }],
      skills: bundle.skills,
      repeatTasks: [],
      knowledgeNotes: [],
    })
  })

  it("merges layered bundle items with later layers winning", () => {
    expect(mergeBundleBuildItems([
      {
        agentProfiles: [{ id: "agent-1", name: "Base", enabled: true, connection: { type: "internal" } }],
        mcpServers: [{ name: "server-1", command: "base" }],
        skills: [{ id: "skill-1", name: "Base Skill" }],
        repeatTasks: [{ id: "task-1", name: "Base Task", prompt: "base", intervalMinutes: 15, enabled: true }],
        knowledgeNotes: [{
          id: "note-1",
          title: "Base Note",
          context: "search-only",
          body: "base",
          tags: [],
          updatedAt: 1,
        }],
      },
      {
        agentProfiles: [{ id: "agent-1", name: "Workspace", enabled: false, connection: { type: "internal" } }],
        mcpServers: [{ name: "server-1", command: "workspace" }, { name: "server-2" }],
        skills: [{ id: "skill-1", name: "Workspace Skill" }, { id: "skill-2", name: "Second Skill" }],
        repeatTasks: [{ id: "task-1", name: "Workspace Task", prompt: "workspace", intervalMinutes: 30, enabled: false }],
        knowledgeNotes: [{
          id: "note-1",
          title: "Workspace Note",
          context: "auto",
          body: "workspace",
          tags: [],
          updatedAt: 2,
        }],
      },
    ])).toEqual({
      agentProfiles: [{ id: "agent-1", name: "Workspace", enabled: false, connection: { type: "internal" } }],
      mcpServers: [{ name: "server-1", command: "workspace" }, { name: "server-2" }],
      skills: [{ id: "skill-1", name: "Workspace Skill" }, { id: "skill-2", name: "Second Skill" }],
      repeatTasks: [{ id: "task-1", name: "Workspace Task", prompt: "workspace", intervalMinutes: 30, enabled: false }],
      knowledgeNotes: [{
        id: "note-1",
        title: "Workspace Note",
        context: "auto",
        body: "workspace",
        tags: [],
        updatedAt: 2,
      }],
    })
  })

  it("merges and sorts exportable bundle item summaries", () => {
    expect(mergeExportableBundleItems([
      {
        agentProfiles: [
          { id: "agent-1", name: "zeta", enabled: true, referencedMcpServerNames: [], referencedSkillIds: [] },
        ],
        mcpServers: [{ name: "z-server" }],
        skills: [{ id: "skill-1", name: "Z Skill" }],
        repeatTasks: [{ id: "task-1", name: "Z Task", intervalMinutes: 15, enabled: true }],
        knowledgeNotes: [{ id: "note-1", title: "Z Note", context: "search-only" }],
      },
      {
        agentProfiles: [
          { id: "agent-1", name: "alpha", enabled: false, referencedMcpServerNames: [], referencedSkillIds: [] },
          { id: "agent-2", name: "Beta", enabled: true, referencedMcpServerNames: [], referencedSkillIds: [] },
        ],
        mcpServers: [{ name: "a-server" }],
        skills: [{ id: "skill-2", name: "A Skill" }],
        repeatTasks: [{ id: "task-2", name: "A Task", intervalMinutes: 30, enabled: true }],
        knowledgeNotes: [{ id: "note-2", title: "A Note", context: "auto" }],
      },
    ])).toEqual({
      agentProfiles: [
        { id: "agent-1", name: "alpha", enabled: false, referencedMcpServerNames: [], referencedSkillIds: [] },
        { id: "agent-2", name: "Beta", enabled: true, referencedMcpServerNames: [], referencedSkillIds: [] },
      ],
      mcpServers: [{ name: "a-server" }, { name: "z-server" }],
      skills: [{ id: "skill-2", name: "A Skill" }, { id: "skill-1", name: "Z Skill" }],
      repeatTasks: [
        { id: "task-2", name: "A Task", intervalMinutes: 30, enabled: true },
        { id: "task-1", name: "Z Task", intervalMinutes: 15, enabled: true },
      ],
      knowledgeNotes: [
        { id: "note-2", title: "A Note", context: "auto" },
        { id: "note-1", title: "Z Note", context: "search-only" },
      ],
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
