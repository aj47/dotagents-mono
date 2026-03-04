/**
 * Tests for bundle-service.ts
 * Phase 1: Local .dotagents bundle export/import/preview
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "fs"
import path from "path"
import os from "os"
import {
  exportBundle,
  previewBundle,
  previewBundleWithConflicts,
  importBundle,
  type DotAgentsBundle,
  type ImportConflictStrategy,
} from "./bundle-service"
import { getAgentsLayerPaths } from "./agents-files/modular-config"
import { writeAgentsProfileFiles } from "./agents-files/agent-profiles"
import { writeAgentsSkillFile } from "./agents-files/skills"
import { writeAgentsMemoryFile } from "./agents-files/memories"
import { writeTaskFile } from "./agents-files/tasks"
import type { AgentProfile, AgentSkill, AgentMemory, LoopConfig } from "@shared/types"

// ============================================================================
// Test Utilities
// ============================================================================

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "bundle-test-"))
}

function cleanupDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    // ignore
  }
}

function createTestProfile(id: string, name: string): AgentProfile {
  const now = Date.now()
  return {
    id,
    name,
    displayName: name,
    description: `Test profile ${name}`,
    enabled: true,
    connection: { type: "internal" },
    createdAt: now,
    updatedAt: now,
  }
}

function createTestSkill(id: string, name: string): AgentSkill {
  const now = Date.now()
  return {
    id,
    name,
    description: `Test skill ${name}`,
    instructions: `# ${name}\n\nTest instructions for ${name}`,
    createdAt: now,
    updatedAt: now,
    source: "local",
  }
}

function createTestMemory(id: string, title: string): AgentMemory {
  const now = Date.now()
  return {
    id,
    title,
    content: `Memory content for ${title}`,
    importance: "medium",
    tags: ["test"],
    createdAt: now,
    updatedAt: now,
  }
}

function createTestTask(id: string, name: string): LoopConfig {
  return {
    id,
    name,
    prompt: `Task prompt for ${name}`,
    intervalMinutes: 60,
    enabled: true,
  }
}

function writeTestMcpJson(
  agentsDir: string,
  mcpJson: Record<string, unknown> = {
    mcpConfig: { mcpServers: {} },
  }
): string {
  const layer = getAgentsLayerPaths(agentsDir)
  fs.writeFileSync(layer.mcpJsonPath, JSON.stringify(mcpJson, null, 2), "utf-8")
  return layer.mcpJsonPath
}

function readTestMcpJson(agentsDir: string): Record<string, unknown> {
  const layer = getAgentsLayerPaths(agentsDir)
  return JSON.parse(fs.readFileSync(layer.mcpJsonPath, "utf-8")) as Record<string, unknown>
}

// ============================================================================
// Tests
// ============================================================================

describe("bundle-service", () => {
  let tempDir: string
  let agentsDir: string

  beforeEach(() => {
    tempDir = createTempDir()
    agentsDir = path.join(tempDir, ".agents")
    fs.mkdirSync(agentsDir, { recursive: true })
  })

  afterEach(() => {
    cleanupDir(tempDir)
  })

  describe("exportBundle", () => {
    it("exports empty bundle when no items exist", async () => {
      const bundle = await exportBundle(agentsDir)
      
      expect(bundle.manifest.version).toBe(1)
      expect(bundle.manifest.exportedFrom).toBe("dotagents-desktop")
      expect(bundle.agentProfiles).toEqual([])
      expect(bundle.mcpServers).toEqual([])
      expect(bundle.skills).toEqual([])
      expect(bundle.repeatTasks).toEqual([])
      expect(bundle.memories).toEqual([])
    })

    it("exports agent profiles with secrets stripped", async () => {
      const layer = getAgentsLayerPaths(agentsDir)
      const profile = createTestProfile("test-agent", "Test Agent")
      writeAgentsProfileFiles(layer, profile)

      const bundle = await exportBundle(agentsDir)
      
      expect(bundle.agentProfiles.length).toBe(1)
      expect(bundle.agentProfiles[0].id).toBe("test-agent")
      expect(bundle.agentProfiles[0].name).toBe("Test Agent")
      expect(bundle.agentProfiles[0].connection.type).toBe("internal")
    })

    it("exports skills with full instructions", async () => {
      const layer = getAgentsLayerPaths(agentsDir)
      const skill = createTestSkill("test-skill", "Test Skill")
      const skillDir = path.join(agentsDir, "skills", skill.id)
      fs.mkdirSync(skillDir, { recursive: true })
      writeAgentsSkillFile(layer, skill)

      const bundle = await exportBundle(agentsDir)
      
      expect(bundle.skills.length).toBe(1)
      expect(bundle.skills[0].id).toBe("test-skill")
      expect(bundle.skills[0].instructions).toContain("Test instructions")
    })

    it("exports memories", async () => {
      const layer = getAgentsLayerPaths(agentsDir)
      const memory = createTestMemory("test-memory", "Test Memory")
      const memoriesDir = path.join(agentsDir, "memories")
      fs.mkdirSync(memoriesDir, { recursive: true })
      writeAgentsMemoryFile(layer, memory)

      const bundle = await exportBundle(agentsDir)
      
      expect(bundle.memories.length).toBe(1)
      expect(bundle.memories[0].id).toBe("test-memory")
      expect(bundle.memories[0].title).toBe("Test Memory")
    })

    it("exports repeat tasks without profileId", async () => {
      const layer = getAgentsLayerPaths(agentsDir)
      const task = createTestTask("test-task", "Test Task")
      task.profileId = "some-profile" // Should be stripped
      writeTaskFile(layer, task)

      const bundle = await exportBundle(agentsDir)

      expect(bundle.repeatTasks.length).toBe(1)
      expect(bundle.repeatTasks[0].id).toBe("test-task")
      expect((bundle.repeatTasks[0] as any).profileId).toBeUndefined()
    })

    it("exports MCP servers from canonical mcpConfig and omits secret-bearing fields", async () => {
      writeTestMcpJson(agentsDir, {
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_secret",
                SAFE_VALUE: "keep-out-of-bundle",
              },
              headers: {
                Authorization: "Bearer secret",
                "X-Api-Key": "api-secret",
              },
              oauth: {
                clientId: "client-id",
                clientSecret: "client-secret",
              },
              timeout: 30_000,
            },
            exa: {
              transport: "streamableHttp",
              url: "https://mcp.exa.ai/mcp",
              headers: {
                Authorization: "Bearer remote-secret",
              },
              disabled: true,
            },
          },
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle = await exportBundle(agentsDir)

      expect(bundle.manifest.components.mcpServers).toBe(2)
      expect(bundle.mcpServers).toEqual([
        {
          name: "github",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          transport: "stdio",
          enabled: true,
        },
        {
          name: "exa",
          transport: "streamableHttp",
          enabled: false,
        },
      ])

      expect(bundle.mcpServers[0]).not.toHaveProperty("env")
      expect(bundle.mcpServers[0]).not.toHaveProperty("headers")
      expect(bundle.mcpServers[0]).not.toHaveProperty("oauth")
      expect(bundle.mcpServers[0]).not.toHaveProperty("timeout")
      expect(bundle.mcpServers[1]).not.toHaveProperty("url")
    })
  })

  describe("previewBundle", () => {
    it("parses valid bundle file", async () => {
      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "Test Bundle",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: {
            agentProfiles: 1,
            mcpServers: 0,
            skills: 0,
            repeatTasks: 0,
            memories: 0,
          },
        },
        agentProfiles: [{ id: "test", name: "Test", enabled: true, connection: { type: "internal" } }],
        mcpServers: [],
        skills: [],
        repeatTasks: [],
        memories: [],
      }

      const bundlePath = path.join(tempDir, "test.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = previewBundle(bundlePath)
      expect(result).not.toBeNull()
      expect(result?.manifest.name).toBe("Test Bundle")
      expect(result?.agentProfiles.length).toBe(1)
    })

    it("returns null for invalid bundle", async () => {
      const bundlePath = path.join(tempDir, "invalid.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify({ invalid: true }))

      const result = previewBundle(bundlePath)
      expect(result).toBeNull()
    })

    it("returns null when required manifest fields are missing", async () => {
      const missingNameBundle = {
        manifest: {
          version: 1,
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 0, skills: 0 },
        },
        agentProfiles: [],
        mcpServers: [],
        skills: [],
      }

      const missingComponentsBundle = {
        manifest: {
          version: 1,
          name: "Missing Components",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
        },
        agentProfiles: [],
        mcpServers: [],
        skills: [],
      }

      const invalidCreatedAtBundle = {
        manifest: {
          version: 1,
          name: "Invalid Date",
          createdAt: "not-a-date",
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 0, skills: 0 },
        },
        agentProfiles: [],
        mcpServers: [],
        skills: [],
      }

      const missingNamePath = path.join(tempDir, "missing-name.dotagents")
      const missingComponentsPath = path.join(tempDir, "missing-components.dotagents")
      const invalidCreatedAtPath = path.join(tempDir, "invalid-created-at.dotagents")
      fs.writeFileSync(missingNamePath, JSON.stringify(missingNameBundle))
      fs.writeFileSync(missingComponentsPath, JSON.stringify(missingComponentsBundle))
      fs.writeFileSync(invalidCreatedAtPath, JSON.stringify(invalidCreatedAtBundle))

      expect(previewBundle(missingNamePath)).toBeNull()
      expect(previewBundle(missingComponentsPath)).toBeNull()
      expect(previewBundle(invalidCreatedAtPath)).toBeNull()
    })

    it("handles bundles without repeatTasks/memories (backwards compat)", async () => {
      const oldBundle = {
        manifest: {
          version: 1,
          name: "Old Bundle",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 0, skills: 0 },
        },
        agentProfiles: [],
        mcpServers: [],
        skills: [],
        // Missing repeatTasks and memories
      }

      const bundlePath = path.join(tempDir, "old.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(oldBundle))

      const result = previewBundle(bundlePath)
      expect(result).not.toBeNull()
      expect(result?.repeatTasks).toEqual([])
      expect(result?.memories).toEqual([])
      expect(result?.manifest.components.repeatTasks).toBe(0)
      expect(result?.manifest.components.memories).toBe(0)
    })

    it("returns null when optional collections are present but malformed", async () => {
      const invalidBundle = {
        manifest: {
          version: 1,
          name: "Invalid Optional Collections",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 0, skills: 0, repeatTasks: 1, memories: 1 },
        },
        agentProfiles: [],
        mcpServers: [],
        skills: [],
        repeatTasks: [{ id: "task-1", name: "Task", prompt: "Run", enabled: true }],
        memories: [{ id: "memory-1", title: "Memory", content: "Body", importance: "medium", tags: "oops" }],
      }

      const bundlePath = path.join(tempDir, "invalid-optional-collections.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(invalidBundle))

      expect(previewBundle(bundlePath)).toBeNull()
    })
  })

  describe("previewBundleWithConflicts", () => {
    it("detects conflicts with existing items", async () => {
      // Create existing profile
      const layer = getAgentsLayerPaths(agentsDir)
      const existingProfile = createTestProfile("conflict-id", "Existing Profile")
      writeAgentsProfileFiles(layer, existingProfile)

      // Create bundle with same ID
      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "Conflict Bundle",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 1, mcpServers: 0, skills: 0, repeatTasks: 0, memories: 0 },
        },
        agentProfiles: [{ id: "conflict-id", name: "New Profile", enabled: true, connection: { type: "internal" } }],
        mcpServers: [],
        skills: [],
        repeatTasks: [],
        memories: [],
      }

      const bundlePath = path.join(tempDir, "conflict.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = previewBundleWithConflicts(bundlePath, agentsDir)
      expect(result.success).toBe(true)
      expect(result.conflicts?.agentProfiles.length).toBe(1)
      expect(result.conflicts?.agentProfiles[0].id).toBe("conflict-id")
    })

    it("includes MCP server conflicts as structured conflict entries", async () => {
      writeTestMcpJson(agentsDir, {
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "old-github-server",
            },
          },
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "MCP Conflict Bundle",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 2, skills: 0, repeatTasks: 0, memories: 0 },
        },
        agentProfiles: [],
        mcpServers: [
          {
            name: "github",
            transport: "stdio",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
            enabled: true,
          },
          {
            name: "exa",
            transport: "streamableHttp",
            enabled: true,
          },
        ],
        skills: [],
        repeatTasks: [],
        memories: [],
      }

      const bundlePath = path.join(tempDir, "mcp-conflict.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = previewBundleWithConflicts(bundlePath, agentsDir)

      expect(result.success).toBe(true)
      expect(result.conflicts).toEqual({
        agentProfiles: [],
        mcpServers: [{ id: "github", name: "github" }],
        skills: [],
        repeatTasks: [],
        memories: [],
      })
    })

    it("detects conflicts from legacy top-level MCP servers even when mcp* config keys are present", async () => {
      writeTestMcpJson(agentsDir, {
        github: {
          transport: "stdio",
          command: "legacy-github-server",
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "Legacy MCP Conflict Bundle",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 1, skills: 0, repeatTasks: 0, memories: 0 },
        },
        agentProfiles: [],
        mcpServers: [
          {
            name: "github",
            transport: "stdio",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
            enabled: true,
          },
        ],
        skills: [],
        repeatTasks: [],
        memories: [],
      }

      const bundlePath = path.join(tempDir, "legacy-mcp-conflict.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = previewBundleWithConflicts(bundlePath, agentsDir)

      expect(result.success).toBe(true)
      expect(result.conflicts?.mcpServers).toEqual([{ id: "github", name: "github" }])
    })
  })

  describe("importBundle", () => {
    let targetDir: string

    beforeEach(() => {
      targetDir = path.join(tempDir, "target-agents")
      fs.mkdirSync(targetDir, { recursive: true })
    })

    function createTestBundle(): DotAgentsBundle {
      return {
        manifest: {
          version: 1,
          name: "Import Test",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 1, mcpServers: 0, skills: 1, repeatTasks: 1, memories: 1 },
        },
        agentProfiles: [{ id: "import-agent", name: "Import Agent", enabled: true, connection: { type: "internal" } }],
        mcpServers: [],
        skills: [{ id: "import-skill", name: "Import Skill", description: "Test", instructions: "# Test" }],
        repeatTasks: [{ id: "import-task", name: "Import Task", prompt: "Test", intervalMinutes: 30, enabled: true }],
        memories: [{ id: "import-memory", title: "Import Memory", content: "Test", importance: "low", tags: [] }],
      }
    }

    function createTestMcpBundle(serverName: string = "github"): DotAgentsBundle {
      return {
        manifest: {
          version: 1,
          name: "MCP Import Test",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 1, skills: 0, repeatTasks: 0, memories: 0 },
        },
        agentProfiles: [],
        mcpServers: [
          {
            name: serverName,
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
            transport: "stdio",
            enabled: false,
          },
        ],
        skills: [],
        repeatTasks: [],
        memories: [],
      }
    }

    it("imports all components with skip strategy", async () => {
      const bundle = createTestBundle()
      const bundlePath = path.join(tempDir, "import.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundle(bundlePath, targetDir, { conflictStrategy: "skip" })

      expect(result.success).toBe(true)
      expect(result.agentProfiles[0].action).toBe("imported")
      expect(result.skills[0].action).toBe("imported")
      expect(result.repeatTasks[0].action).toBe("imported")
      expect(result.memories[0].action).toBe("imported")
    })

    it("skips existing items with skip strategy", async () => {
      // Create existing profile
      const layer = getAgentsLayerPaths(targetDir)
      const existingProfile = createTestProfile("import-agent", "Existing")
      writeAgentsProfileFiles(layer, existingProfile)

      const bundle = createTestBundle()
      const bundlePath = path.join(tempDir, "import.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundle(bundlePath, targetDir, { conflictStrategy: "skip" })

      expect(result.agentProfiles[0].action).toBe("skipped")
    })

    it("renames conflicting items with rename strategy", async () => {
      // Create existing profile
      const layer = getAgentsLayerPaths(targetDir)
      const existingProfile = createTestProfile("import-agent", "Existing")
      writeAgentsProfileFiles(layer, existingProfile)

      const bundle = createTestBundle()
      const bundlePath = path.join(tempDir, "import.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundle(bundlePath, targetDir, { conflictStrategy: "rename" })

      expect(result.agentProfiles[0].action).toBe("renamed")
      expect(result.agentProfiles[0].newId).toBe("import-agent_imported")
    })

    it("overwrites existing items with overwrite strategy", async () => {
      // Create existing profile
      const layer = getAgentsLayerPaths(targetDir)
      const existingProfile = createTestProfile("import-agent", "Old Name")
      writeAgentsProfileFiles(layer, existingProfile)

      const bundle = createTestBundle()
      const bundlePath = path.join(tempDir, "import.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundle(bundlePath, targetDir, { conflictStrategy: "overwrite" })

      expect(result.agentProfiles[0].action).toBe("overwritten")
    })

    it("respects component selection", async () => {
      const bundle = createTestBundle()
      const bundlePath = path.join(tempDir, "import.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundle(bundlePath, targetDir, {
        conflictStrategy: "skip",
        components: { agentProfiles: true, skills: false, repeatTasks: false, memories: false },
      })

      expect(result.agentProfiles.length).toBe(1)
      expect(result.skills.length).toBe(0)
      expect(result.repeatTasks.length).toBe(0)
      expect(result.memories.length).toBe(0)
    })

    it("skips conflicting MCP servers and preserves canonical mcpConfig shape", async () => {
      writeTestMcpJson(targetDir, {
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "existing-command",
              args: ["existing-arg"],
            },
          },
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle = createTestMcpBundle()
      const bundlePath = path.join(tempDir, "import-mcp-skip.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundle(bundlePath, targetDir, { conflictStrategy: "skip" })
      const mcpJson = readTestMcpJson(targetDir)

      expect(result.success).toBe(true)
      expect(result.mcpServers).toEqual([{ id: "github", name: "github", action: "skipped" }])
      expect(mcpJson).toEqual({
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "existing-command",
              args: ["existing-arg"],
            },
          },
        },
        mcpDisabledTools: ["github:create_issue"],
      })
    })

    it("overwrites conflicting MCP servers in canonical mcpConfig", async () => {
      writeTestMcpJson(targetDir, {
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "existing-command",
              args: ["existing-arg"],
            },
          },
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle = createTestMcpBundle()
      const bundlePath = path.join(tempDir, "import-mcp-overwrite.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundle(bundlePath, targetDir, { conflictStrategy: "overwrite" })
      const mcpJson = readTestMcpJson(targetDir)

      expect(result.success).toBe(true)
      expect(result.mcpServers).toEqual([
        { id: "github", name: "github", action: "overwritten" },
      ])
      expect(mcpJson).toEqual({
        mcpConfig: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              transport: "stdio",
              disabled: true,
            },
          },
        },
        mcpDisabledTools: ["github:create_issue"],
      })
    })

    it("renames conflicting MCP servers in canonical mcpConfig", async () => {
      writeTestMcpJson(targetDir, {
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "existing-command",
            },
          },
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle = createTestMcpBundle()
      const bundlePath = path.join(tempDir, "import-mcp-rename.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundle(bundlePath, targetDir, { conflictStrategy: "rename" })
      const mcpJson = readTestMcpJson(targetDir)

      expect(result.success).toBe(true)
      expect(result.mcpServers).toEqual([
        {
          id: "github",
          name: "github",
          action: "renamed",
          newId: "github_imported",
        },
      ])
      expect(mcpJson).toEqual({
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "existing-command",
            },
            github_imported: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              transport: "stdio",
              disabled: true,
            },
          },
        },
        mcpDisabledTools: ["github:create_issue"],
      })
    })

    it("canonicalizes legacy bare MCP server maps without preserving duplicate top-level servers", async () => {
      writeTestMcpJson(targetDir, {
        github: {
          transport: "stdio",
          command: "existing-command",
          args: ["existing-arg"],
        },
      })

      const bundle = createTestMcpBundle("exa")
      const bundlePath = path.join(tempDir, "import-mcp-legacy.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundle(bundlePath, targetDir, { conflictStrategy: "skip" })
      const mcpJson = readTestMcpJson(targetDir)

      expect(result.success).toBe(true)
      expect(result.mcpServers).toEqual([{ id: "exa", name: "exa", action: "imported" }])
      expect(mcpJson).toEqual({
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "existing-command",
              args: ["existing-arg"],
            },
            exa: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              transport: "stdio",
              disabled: true,
            },
          },
        },
      })
    })

    it("canonicalizes mixed legacy MCP server maps with mcp* keys into mcpConfig.mcpServers only", async () => {
      writeTestMcpJson(targetDir, {
        github: {
          transport: "stdio",
          command: "existing-command",
          args: ["existing-arg"],
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle = createTestMcpBundle("exa")
      const bundlePath = path.join(tempDir, "import-mcp-mixed-legacy.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundle(bundlePath, targetDir, { conflictStrategy: "skip" })
      const mcpJson = readTestMcpJson(targetDir)

      expect(result.success).toBe(true)
      expect(result.mcpServers).toEqual([{ id: "exa", name: "exa", action: "imported" }])
      expect(mcpJson).toEqual({
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "existing-command",
              args: ["existing-arg"],
            },
            exa: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              transport: "stdio",
              disabled: true,
            },
          },
        },
        mcpDisabledTools: ["github:create_issue"],
      })
    })
  })
})
