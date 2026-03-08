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
  findHubBundleHandoffFilePath,
  getBundleExportableItems,
  previewBundle,
  previewBundleWithConflicts,
  importBundle,
  generatePublishPayload,
  type DotAgentsBundle,
  type ImportConflictStrategy,
} from "./bundle-service"
import type { HubPublishPayload } from "@dotagents/shared"
import { getAgentsLayerPaths } from "./agents-files/modular-config"
import { loadAgentProfilesLayer, writeAgentsProfileFiles } from "./agents-files/agent-profiles"
import { loadAgentsSkillsLayer, writeAgentsSkillFile } from "./agents-files/skills"
import { loadAgentsMemoriesLayer, writeAgentsMemoryFile } from "./agents-files/memories"
import { loadTasksLayer, writeTaskFile } from "./agents-files/tasks"
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

    it("exports sanitized public metadata for sharing without changing the bundle format", async () => {
      const bundle = await exportBundle(agentsDir, {
        name: "Hub Ready Bundle",
        description: "Installable agent setup",
        publicMetadata: {
          summary: "  A shareable agent bundle for the Hub.  ",
          author: {
            displayName: "  AJ  ",
            handle: "  techfren  ",
            url: "  https://dotagents.org/authors/aj  ",
          },
          tags: [" productivity ", "agents", "productivity", ""],
          compatibility: {
            minDesktopVersion: " 0.0.1 ",
            notes: [" Works with workspace overlays ", "", "No secrets included", "Works with workspace overlays"],
          },
        },
      })

      expect(bundle.manifest).toMatchObject({
        version: 1,
        name: "Hub Ready Bundle",
        description: "Installable agent setup",
        publicMetadata: {
          summary: "A shareable agent bundle for the Hub.",
          author: {
            displayName: "AJ",
            handle: "techfren",
            url: "https://dotagents.org/authors/aj",
          },
          tags: ["productivity", "agents"],
          compatibility: {
            minDesktopVersion: "0.0.1",
            notes: ["Works with workspace overlays", "No secrets included"],
          },
        },
      })
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

    it("exports non-secret connection fields for external agent profiles", async () => {
      const layer = getAgentsLayerPaths(agentsDir)
      const now = Date.now()
      const profile: AgentProfile = {
        id: "external-agent",
        name: "external-agent",
        displayName: "External Agent",
        enabled: true,
        connection: {
          type: "stdio",
          command: "node",
          args: ["agent.js", "--mode", "safe"],
          cwd: "/tmp/external-agent",
          baseUrl: "https://agents.example.com",
          env: { API_KEY: "super-secret" },
        },
        createdAt: now,
        updatedAt: now,
      }
      writeAgentsProfileFiles(layer, profile)

      const bundle = await exportBundle(agentsDir)

      expect(bundle.agentProfiles).toHaveLength(1)
      expect(bundle.agentProfiles[0].connection).toEqual({
        type: "stdio",
        command: "node",
        args: ["agent.js", "--mode", "safe"],
        cwd: "/tmp/external-agent",
        baseUrl: "https://agents.example.com",
      })
      expect(bundle.agentProfiles[0].connection).not.toHaveProperty("env")
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

    it("does not export memories by default", async () => {
      const layer = getAgentsLayerPaths(agentsDir)
      const memory = createTestMemory("test-memory", "Test Memory")
      const memoriesDir = path.join(agentsDir, "memories")
      fs.mkdirSync(memoriesDir, { recursive: true })
      writeAgentsMemoryFile(layer, memory)

      const bundle = await exportBundle(agentsDir)

      expect(bundle.memories).toEqual([])
    })

    it("exports memories when explicitly opted in", async () => {
      const layer = getAgentsLayerPaths(agentsDir)
      const memory = createTestMemory("test-memory", "Test Memory")
      const memoriesDir = path.join(agentsDir, "memories")
      fs.mkdirSync(memoriesDir, { recursive: true })
      writeAgentsMemoryFile(layer, memory)

      const bundle = await exportBundle(agentsDir, {
        components: {
          memories: true,
        },
      })

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

    it("exports MCP servers from canonical mcpConfig with redacted placeholders for secret-bearing fields", async () => {
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
          config: {
            transport: "stdio",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
            env: {
              GITHUB_PERSONAL_ACCESS_TOKEN: "<CONFIGURE_YOUR_KEY>",
              SAFE_VALUE: "keep-out-of-bundle",
            },
            headers: {
              Authorization: "<CONFIGURE_YOUR_KEY>",
              "X-Api-Key": "<CONFIGURE_YOUR_KEY>",
            },
            oauth: {
              clientId: "client-id",
              clientSecret: "<CONFIGURE_YOUR_KEY>",
            },
            timeout: 30_000,
          },
          redactedSecretFields: ["env", "headers", "oauth"],
        },
        {
          name: "exa",
          transport: "streamableHttp",
          enabled: false,
          config: {
            transport: "streamableHttp",
            url: "https://mcp.exa.ai/mcp",
            headers: {
              Authorization: "<CONFIGURE_YOUR_KEY>",
            },
            disabled: true,
          },
          redactedSecretFields: ["headers"],
        },
      ])
    })

    it("supports per-item export selection across all bundle component types", async () => {
      const layer = getAgentsLayerPaths(agentsDir)

      const selectedAgent = createTestProfile("agent-selected", "Selected Agent")
      const skippedAgent = createTestProfile("agent-skipped", "Skipped Agent")
      writeAgentsProfileFiles(layer, selectedAgent)
      writeAgentsProfileFiles(layer, skippedAgent)

      writeAgentsSkillFile(layer, createTestSkill("skill-selected", "Selected Skill"))
      writeAgentsSkillFile(layer, createTestSkill("skill-skipped", "Skipped Skill"))
      writeTaskFile(layer, createTestTask("task-selected", "Selected Task"))
      writeTaskFile(layer, createTestTask("task-skipped", "Skipped Task"))
      writeAgentsMemoryFile(layer, createTestMemory("memory-selected", "Selected Memory"))
      writeAgentsMemoryFile(layer, createTestMemory("memory-skipped", "Skipped Memory"))

      writeTestMcpJson(agentsDir, {
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
            },
            exa: {
              transport: "streamableHttp",
              url: "https://mcp.exa.ai/mcp",
            },
          },
        },
      })

      const bundle = await exportBundle(agentsDir, {
        agentProfileIds: ["agent-selected"],
        mcpServerNames: ["exa"],
        skillIds: ["skill-selected"],
        repeatTaskIds: ["task-selected"],
        memoryIds: ["memory-selected"],
      })

      expect(bundle.agentProfiles.map((item) => item.id)).toEqual(["agent-selected"])
      expect(bundle.mcpServers.map((item) => item.name)).toEqual(["exa"])
      expect(bundle.skills.map((item) => item.id)).toEqual(["skill-selected"])
      expect(bundle.repeatTasks.map((item) => item.id)).toEqual(["task-selected"])
      expect(bundle.memories.map((item) => item.id)).toEqual(["memory-selected"])
    })
  })

  describe("getBundleExportableItems", () => {
    it("lists exportable items with agent dependency metadata", () => {
      const layer = getAgentsLayerPaths(agentsDir)
      const profile = createTestProfile("agent-deps", "Agent With Dependencies")
      profile.toolConfig = { enabledServers: ["github"] }
      profile.skillsConfig = { enabledSkillIds: ["skill-deps"] }
      writeAgentsProfileFiles(layer, profile)
      writeAgentsSkillFile(layer, createTestSkill("skill-deps", "Dependency Skill"))
      writeTaskFile(layer, createTestTask("task-deps", "Dependency Task"))
      writeAgentsMemoryFile(layer, createTestMemory("memory-deps", "Dependency Memory"))
      writeTestMcpJson(agentsDir, {
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
            },
          },
        },
      })

      const exportableItems = getBundleExportableItems(agentsDir)

      expect(exportableItems.agentProfiles[0]).toMatchObject({
        id: "agent-deps",
        referencedMcpServerNames: ["github"],
        referencedSkillIds: ["skill-deps"],
      })
      expect(exportableItems.mcpServers.map((item) => item.name)).toEqual(["github"])
      expect(exportableItems.skills.map((item) => item.id)).toEqual(["skill-deps"])
      expect(exportableItems.repeatTasks.map((item) => item.id)).toEqual(["task-deps"])
      expect(exportableItems.memories.map((item) => item.id)).toEqual(["memory-deps"])
    })

    it("flags memories that appear to contain secret-like values", () => {
      const layer = getAgentsLayerPaths(agentsDir)
      const memory = createTestMemory("memory-secret", "Potential Secret Memory")
      memory.content = "Bearer sk-proj-abcdefghijklmnopqrstuvwxyz123456"
      memory.keyFindings = ["refresh token: ghp_abcdefghijklmnopqrstuvwxyz123456"]
      memory.userNotes = "authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"
      writeAgentsMemoryFile(layer, memory)

      const exportableItems = getBundleExportableItems(agentsDir)

      expect(exportableItems.memories).toEqual([
        expect.objectContaining({
          id: "memory-secret",
          containsPotentialSecret: true,
          secretWarningFields: ["content", "keyFindings", "userNotes"],
        }),
      ])
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

    it("handles legacy bundles with metadata-only skills", async () => {
      const oldBundle = {
        manifest: {
          version: 1,
          name: "Legacy Skills Bundle",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 0, skills: 1 },
        },
        agentProfiles: [],
        mcpServers: [],
        skills: [
          {
            id: "legacy-skill",
            name: "Legacy Skill",
            description: "Metadata-only skill entry",
          },
        ],
      }

      const bundlePath = path.join(tempDir, "legacy-skills.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(oldBundle))

      const result = previewBundle(bundlePath)
      expect(result).not.toBeNull()
      expect(result?.skills).toEqual([
        {
          id: "legacy-skill",
          name: "Legacy Skill",
          description: "Metadata-only skill entry",
        },
      ])
    })

    it("preserves valid public metadata when previewing a shareable bundle", async () => {
      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "Public Bundle",
          description: "Previewable bundle",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          publicMetadata: {
            summary: "Preview this in the Hub",
            author: {
              displayName: "AJ",
              handle: "techfren",
            },
            tags: ["agents", "hub"],
            compatibility: {
              minDesktopVersion: "0.0.1",
              notes: ["Uses existing import flow"],
            },
          },
          components: { agentProfiles: 0, mcpServers: 0, skills: 0, repeatTasks: 0, memories: 0 },
        },
        agentProfiles: [],
        mcpServers: [],
        skills: [],
        repeatTasks: [],
        memories: [],
      }

      const bundlePath = path.join(tempDir, "public-metadata.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = previewBundle(bundlePath)
      expect(result?.manifest.publicMetadata).toEqual(bundle.manifest.publicMetadata)
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

    it("returns null when an agent profile has an unsupported connection type", async () => {
      const invalidBundle = {
        manifest: {
          version: 1,
          name: "Invalid Connection Type",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 1, mcpServers: 0, skills: 0 },
        },
        agentProfiles: [
          {
            id: "bad-connection",
            name: "Bad Connection",
            enabled: true,
            connection: { type: "custom" },
          },
        ],
        mcpServers: [],
        skills: [],
      }

      const bundlePath = path.join(tempDir, "invalid-connection-type.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(invalidBundle))

      expect(previewBundle(bundlePath)).toBeNull()
    })

    it("returns null when an agent profile has an unsupported role", async () => {
      const invalidBundle = {
        manifest: {
          version: 1,
          name: "Invalid Role",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 1, mcpServers: 0, skills: 0 },
        },
        agentProfiles: [
          {
            id: "bad-role",
            name: "Bad Role",
            enabled: true,
            role: "super-agent",
            connection: { type: "internal" },
          },
        ],
        mcpServers: [],
        skills: [],
      }

      const bundlePath = path.join(tempDir, "invalid-role.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(invalidBundle))

      expect(previewBundle(bundlePath)).toBeNull()
    })

    it("returns null when an agent profile has malformed connection metadata", async () => {
      const invalidBundle = {
        manifest: {
          version: 1,
          name: "Malformed Connection Metadata",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 1, mcpServers: 0, skills: 0 },
        },
        agentProfiles: [
          {
            id: "bad-connection-meta",
            name: "Bad Connection Meta",
            enabled: true,
            connection: {
              type: "stdio",
              command: "node",
              args: "--should-be-array",
            },
          },
        ],
        mcpServers: [],
        skills: [],
      }

      const bundlePath = path.join(tempDir, "invalid-connection-metadata.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(invalidBundle))

      expect(previewBundle(bundlePath)).toBeNull()
    })
  })

  describe("findHubBundleHandoffFilePath", () => {
    it("returns the first existing .dotagents file from argv-style candidates", () => {
      const bundlePath = path.join(tempDir, "hub-install.dotagents")
      const ignoredJsonPath = path.join(tempDir, "hub-install.json")

      fs.writeFileSync(bundlePath, JSON.stringify({ test: true }), "utf-8")
      fs.writeFileSync(ignoredJsonPath, JSON.stringify({ test: true }), "utf-8")

      expect(
        findHubBundleHandoffFilePath([
          "/Applications/DotAgents.app",
          "--inspect",
          ignoredJsonPath,
          bundlePath,
        ])
      ).toBe(path.resolve(bundlePath))
    })

    it("ignores missing files, directories, and non-.dotagents candidates", () => {
      const directoryPath = path.join(tempDir, "folder.dotagents")
      const jsonPath = path.join(tempDir, "bundle.json")

      fs.mkdirSync(directoryPath, { recursive: true })
      fs.writeFileSync(jsonPath, JSON.stringify({ test: true }), "utf-8")

      expect(
        findHubBundleHandoffFilePath([
          path.join(tempDir, "missing.dotagents"),
          directoryPath,
          jsonPath,
        ])
      ).toBeNull()
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
      expect(result.conflicts?.agentProfiles[0]).toMatchObject({
        defaultStrategy: "skip",
        renameTargetId: "conflict-id_imported",
      })
    })

    it("marks duplicate memories as skip-only conflicts even when the duplicate is by content", async () => {
      const layer = getAgentsLayerPaths(agentsDir)
      const existingById = createTestMemory("memory-id-conflict", "Existing Memory By Id")
      existingById.content = "Existing by id content"
      writeAgentsMemoryFile(layer, existingById)

      const existingByContent = createTestMemory("existing-memory", "Existing Memory By Content")
      existingByContent.content = "Shared duplicate content"
      writeAgentsMemoryFile(layer, existingByContent)

      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "Memory Conflict Bundle",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 0, skills: 0, repeatTasks: 0, memories: 3 },
        },
        agentProfiles: [],
        mcpServers: [],
        skills: [],
        repeatTasks: [],
        memories: [
          {
            id: "memory-id-conflict",
            title: "Bundle ID Conflict",
            content: "Replacement content",
            importance: "medium",
            tags: [],
          },
          {
            id: "memory-content-conflict",
            title: "Duplicate Content Memory",
            content: "Shared duplicate content",
            importance: "medium",
            tags: [],
          },
          {
            id: "memory-unique",
            title: "Unique Memory",
            content: "Fresh content",
            importance: "low",
            tags: [],
          },
        ],
      }

      const bundlePath = path.join(tempDir, "memory-conflict-preview.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = previewBundleWithConflicts(bundlePath, agentsDir)

      expect(result.success).toBe(true)
      expect(result.conflicts?.memories).toEqual([
        {
          id: "memory-id-conflict",
          name: "Bundle ID Conflict",
          existingName: "Existing Memory By Id",
          defaultStrategy: "skip",
        },
        {
          id: "memory-content-conflict",
          name: "Duplicate Content Memory",
          existingName: "Existing Memory By Content",
          defaultStrategy: "skip",
        },
      ])
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
      expect(result.conflicts).toMatchObject({
        agentProfiles: [],
        mcpServers: [{ id: "github", name: "github", defaultStrategy: "skip", renameTargetId: "github_imported" }],
        skills: [],
        repeatTasks: [],
        memories: [],
      })
    })

    it("detects conflicts from legacy top-level MCP servers when canonical mcpConfig.mcpServers also exists", async () => {
      writeTestMcpJson(agentsDir, {
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "canonical-github-server",
            },
          },
        },
        exa: {
          transport: "stdio",
          command: "legacy-exa-server",
        },
      })

      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "Mixed MCP Conflict Bundle",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 1, skills: 0, repeatTasks: 0, memories: 0 },
        },
        agentProfiles: [],
        mcpServers: [
          {
            name: "exa",
            transport: "stdio",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-exa"],
            enabled: true,
          },
        ],
        skills: [],
        repeatTasks: [],
        memories: [],
      }

      const bundlePath = path.join(tempDir, "mixed-mcp-conflict.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = previewBundleWithConflicts(bundlePath, agentsDir)

      expect(result.success).toBe(true)
      expect(result.conflicts?.mcpServers).toMatchObject([
        { id: "exa", name: "exa", defaultStrategy: "skip", renameTargetId: "exa_imported" },
      ])
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
      expect(result.conflicts?.mcpServers).toMatchObject([
        { id: "github", name: "github", defaultStrategy: "skip", renameTargetId: "github_imported" },
      ])
    })

    it("detects conflicts from legacy top-level MCP servers with unknown object shapes", async () => {
      writeTestMcpJson(agentsDir, {
        github: {
          executable: "node",
          launchArgs: ["server.js"],
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "Unknown Legacy MCP Conflict Bundle",
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

      const bundlePath = path.join(tempDir, "unknown-legacy-mcp-conflict.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = previewBundleWithConflicts(bundlePath, agentsDir)

      expect(result.success).toBe(true)
      expect(result.conflicts?.mcpServers).toMatchObject([
        { id: "github", name: "github", defaultStrategy: "skip", renameTargetId: "github_imported" },
      ])
    })

    it("detects unknown-shape legacy MCP conflicts even when known-shape legacy servers are present", async () => {
      writeTestMcpJson(agentsDir, {
        github: {
          transport: "stdio",
          command: "legacy-github-server",
        },
        exa: {
          executable: "node",
          launchArgs: ["server.js"],
        },
      })

      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "Mixed Legacy MCP Conflict Bundle",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 1, skills: 0, repeatTasks: 0, memories: 0 },
        },
        agentProfiles: [],
        mcpServers: [
          {
            name: "exa",
            transport: "stdio",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-exa"],
            enabled: true,
          },
        ],
        skills: [],
        repeatTasks: [],
        memories: [],
      }

      const bundlePath = path.join(tempDir, "mixed-unknown-legacy-mcp-conflict.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = previewBundleWithConflicts(bundlePath, agentsDir)

      expect(result.success).toBe(true)
      expect(result.conflicts?.mcpServers).toMatchObject([
        { id: "exa", name: "exa", defaultStrategy: "skip", renameTargetId: "exa_imported" },
      ])
    })

    it("detects conflicts from legacy top-level MCP servers whose names start with mcp", async () => {
      writeTestMcpJson(agentsDir, {
        mcpGithub: {
          transport: "stdio",
          command: "legacy-mcp-github-server",
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "mcp-prefixed Legacy MCP Conflict Bundle",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 1, skills: 0, repeatTasks: 0, memories: 0 },
        },
        agentProfiles: [],
        mcpServers: [
          {
            name: "mcpGithub",
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

      const bundlePath = path.join(tempDir, "mcp-prefixed-legacy-mcp-conflict.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = previewBundleWithConflicts(bundlePath, agentsDir)

      expect(result.success).toBe(true)
      expect(result.conflicts?.mcpServers).toMatchObject([
        { id: "mcpGithub", name: "mcpGithub", defaultStrategy: "skip", renameTargetId: "mcpGithub_imported" },
      ])
    })
  })

  describe("importBundle", () => {
    let targetDir: string

    beforeEach(() => {
      targetDir = path.join(tempDir, "target-agents")
      fs.mkdirSync(targetDir, { recursive: true })
    })

    async function importBundleForTest(
      bundlePath: string,
      options: Parameters<typeof importBundle>[2],
    ) {
      return importBundle(bundlePath, targetDir, {
        ...options,
        backup: {
          dir: path.join(tempDir, "bundle-backups"),
          maxBackups: 10,
          ...options.backup,
        },
      })
    }

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

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })

      expect(result.success).toBe(true)
      expect(result.backupFilePath).toBeTruthy()
      expect(result.backup).toMatchObject({
        filePath: result.backupFilePath,
        metadata: {
          kind: "pre-import-snapshot",
          sourceBundleName: "Import Test",
        },
      })
      expect(result.summary).toEqual({
        imported: 4,
        renamed: 0,
        overwritten: 0,
        skipped: 0,
        failed: 0,
        appliedCount: 4,
        processedCount: 4,
      })
      expect(result.agentProfiles[0].action).toBe("imported")
      expect(result.skills[0].action).toBe("imported")
      expect(result.repeatTasks[0].action).toBe("imported")
      expect(result.memories[0].action).toBe("imported")
    })

    it("keeps memory imports additive-only and skips duplicate content regardless of conflict strategy", async () => {
      const layer = getAgentsLayerPaths(targetDir)
      const existingById = createTestMemory("import-memory", "Existing Memory By Id")
      existingById.content = "Existing by id content"
      writeAgentsMemoryFile(layer, existingById)

      const existingByContent = createTestMemory("existing-memory", "Existing Memory By Content")
      existingByContent.content = "Shared duplicate content"
      writeAgentsMemoryFile(layer, existingByContent)

      const bundle = createTestBundle()
      bundle.memories = [
        {
          id: "import-memory",
          title: "Bundle ID Conflict",
          content: "Replacement content that should be ignored",
          importance: "medium",
          tags: [],
        },
        {
          id: "memory-content-conflict",
          title: "Duplicate Content Memory",
          content: "Shared duplicate content",
          importance: "medium",
          tags: [],
        },
        {
          id: "memory-unique",
          title: "Unique Memory",
          content: "Brand new unique content",
          importance: "medium",
          tags: [],
        },
        {
          id: "memory-duplicate-within-bundle",
          title: "Duplicate Within Bundle",
          content: "Brand new unique content",
          importance: "medium",
          tags: [],
        },
      ]

      const bundlePath = path.join(tempDir, "import-memories-additive.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "overwrite" })
      const importedMemories = loadAgentsMemoriesLayer(layer).memories

      expect(result.success).toBe(true)
      expect(result.memories).toEqual([
        { id: "import-memory", name: "Bundle ID Conflict", action: "skipped" },
        { id: "memory-content-conflict", name: "Duplicate Content Memory", action: "skipped" },
        { id: "memory-unique", name: "Unique Memory", action: "imported" },
        { id: "memory-duplicate-within-bundle", name: "Duplicate Within Bundle", action: "skipped" },
      ])
      expect(importedMemories.find((memory) => memory.id === "import-memory")?.content).toBe("Existing by id content")
      expect(importedMemories.some((memory) => memory.id === "memory-content-conflict")).toBe(false)
      expect(importedMemories.some((memory) => memory.id === "memory-unique")).toBe(true)
      expect(importedMemories.some((memory) => memory.id === "memory-duplicate-within-bundle")).toBe(false)
    })

    it("creates a pre-import backup before mutating the target layer", async () => {
      const layer = getAgentsLayerPaths(targetDir)
      writeAgentsProfileFiles(layer, createTestProfile("pre-import-agent", "Pre Import Agent"))
      const skillDir = path.join(targetDir, "skills", "pre-import-skill")
      fs.mkdirSync(skillDir, { recursive: true })
      writeAgentsSkillFile(layer, createTestSkill("pre-import-skill", "Pre Import Skill"))
      writeTaskFile(layer, createTestTask("pre-import-task", "Pre Import Task"))
      writeAgentsMemoryFile(layer, createTestMemory("pre-import-memory", "Pre Import Memory"))
      writeTestMcpJson(targetDir, {
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "existing-command",
            },
          },
        },
      })

      const bundle = createTestBundle()
      const bundlePath = path.join(tempDir, "import-with-backup.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })

      expect(result.success).toBe(true)
      expect(result.backupFilePath).toBeTruthy()
      expect(fs.existsSync(result.backupFilePath!)).toBe(true)

      const backupBundle = JSON.parse(
        fs.readFileSync(result.backupFilePath!, "utf-8"),
      ) as DotAgentsBundle

      expect(backupBundle.manifest.backup).toMatchObject({
        kind: "pre-import-snapshot",
        sourceBundleName: "Import Test",
        importResultSummary: result.summary,
      })
      expect(backupBundle.agentProfiles.map((profile) => profile.id)).toEqual(["pre-import-agent"])
      expect(backupBundle.skills.map((skill) => skill.id)).toEqual(["pre-import-skill"])
      expect(backupBundle.repeatTasks.map((task) => task.id)).toEqual(["pre-import-task"])
      expect(backupBundle.mcpServers.map((server) => server.name)).toEqual(["github"])
      expect(backupBundle.memories).toEqual([])
    })

    it("rotates pre-import backups down to the configured maximum", async () => {
      const backupDir = path.join(tempDir, "rotating-backups")
      fs.mkdirSync(backupDir, { recursive: true })

      const existingBackups = [
        "backup-2026-03-01T00-00-00-000Z.dotagents",
        "backup-2026-03-02T00-00-00-000Z.dotagents",
        "backup-2026-03-03T00-00-00-000Z.dotagents",
      ]

      existingBackups.forEach((fileName, index) => {
        const fullPath = path.join(backupDir, fileName)
        fs.writeFileSync(fullPath, JSON.stringify(createTestBundle()), "utf-8")
        const timestamp = new Date(Date.UTC(2026, 2, index + 1))
        fs.utimesSync(fullPath, timestamp, timestamp)
      })

      const bundle = createTestBundle()
      const bundlePath = path.join(tempDir, "import-with-rotation.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, {
        conflictStrategy: "skip",
        backup: { dir: backupDir, maxBackups: 2 },
      })

      const backupFiles = fs.readdirSync(backupDir)
        .filter((fileName) => fileName.endsWith(".dotagents"))
        .sort()

      expect(result.success).toBe(true)
      expect(result.backupFilePath).toBeTruthy()
      expect(backupFiles).toHaveLength(2)
      expect(backupFiles).toContain(path.basename(result.backupFilePath!))
      expect(backupFiles).not.toContain("backup-2026-03-01T00-00-00-000Z.dotagents")
    })

    it("aborts import if the pre-import backup cannot be created", async () => {
      const blockedBackupPath = path.join(tempDir, "blocked-backups")
      fs.writeFileSync(blockedBackupPath, "not-a-directory", "utf-8")

      const bundle = createTestBundle()
      const bundlePath = path.join(tempDir, "import-backup-failure.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, {
        conflictStrategy: "skip",
        backup: { dir: blockedBackupPath },
      })
      const layer = getAgentsLayerPaths(targetDir)

      expect(result.success).toBe(false)
      expect(result.backupFilePath).toBeNull()
      expect(result.errors[0]).toContain("Pre-import backup failed")
      expect(loadAgentProfilesLayer(layer).profiles).toEqual([])
      expect(loadAgentsSkillsLayer(layer).skills).toEqual([])
      expect(loadTasksLayer(layer).tasks).toEqual([])
      expect(loadAgentsMemoriesLayer(layer).memories).toEqual([])
    })

    it("imports legacy metadata-only bundle skills with empty instructions", async () => {
      const bundle = {
        manifest: {
          version: 1,
          name: "Legacy Skill Import",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 0, skills: 1 },
        },
        agentProfiles: [],
        mcpServers: [],
        skills: [{ id: "legacy-skill", name: "Legacy Skill", description: "No instructions field" }],
      }

      const bundlePath = path.join(tempDir, "import-legacy-skill.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })
      const layer = getAgentsLayerPaths(targetDir)
      const importedSkill = loadAgentsSkillsLayer(layer).skills.find((skill) => skill.id === "legacy-skill")

      expect(result.success).toBe(true)
      expect(result.skills).toEqual([{ id: "legacy-skill", name: "Legacy Skill", action: "imported" }])
      expect(importedSkill).toBeTruthy()
      expect(importedSkill?.instructions).toBe("")
    })

    it("imports bundles that include public metadata without affecting existing import behavior", async () => {
      const bundle = createTestBundle()
      bundle.manifest.publicMetadata = {
        summary: "Public Hub listing",
        author: {
          displayName: "AJ",
          handle: "techfren",
        },
        tags: ["hub", "agents"],
        compatibility: {
          minDesktopVersion: "0.0.1",
        },
      }

      const bundlePath = path.join(tempDir, "import-public-metadata.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })

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

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })

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

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "rename" })

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

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "overwrite" })

      expect(result.agentProfiles[0].action).toBe("overwritten")
    })

    it("allows per-item conflict strategy overrides during a mixed import", async () => {
      const layer = getAgentsLayerPaths(targetDir)
      writeAgentsProfileFiles(layer, createTestProfile("import-agent", "Existing Agent"))
      writeAgentsSkillFile(layer, createTestSkill("import-skill", "Existing Skill"))
      writeTaskFile(layer, createTestTask("import-task", "Existing Task"))
      writeTestMcpJson(targetDir, {
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "existing-command",
            },
          },
        },
      })

      const bundle = createTestBundle()
      bundle.manifest.components.mcpServers = 1
      bundle.mcpServers = createTestMcpBundle("github").mcpServers
      const bundlePath = path.join(tempDir, "import-mixed-conflict-overrides.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, {
        conflictStrategy: "skip",
        conflictStrategyOverrides: {
          agentProfiles: { "import-agent": "overwrite" },
          mcpServers: { github: "rename" },
          skills: { "import-skill": "rename" },
          repeatTasks: { "import-task": "overwrite" },
        },
      })
      const importedProfiles = loadAgentProfilesLayer(layer).profiles
      const importedSkills = loadAgentsSkillsLayer(layer).skills
      const importedTasks = loadTasksLayer(layer).tasks
      const mcpJson = readTestMcpJson(targetDir)

      expect(result.success).toBe(true)
      expect(result.agentProfiles).toEqual([{ id: "import-agent", name: "Import Agent", action: "overwritten" }])
      expect(result.mcpServers).toEqual([
        { id: "github", name: "github", action: "renamed", newId: "github_imported" },
      ])
      expect(result.skills).toEqual([
        { id: "import-skill", name: "Import Skill", action: "renamed", newId: "import-skill_imported" },
      ])
      expect(result.repeatTasks).toEqual([{ id: "import-task", name: "Import Task", action: "overwritten" }])

      expect(importedProfiles.find((profile) => profile.id === "import-agent")?.name).toBe("Import Agent")
      expect(importedSkills.map((skill) => skill.id).sort()).toEqual(["import-skill", "import-skill_imported"])
      expect(importedTasks.find((task) => task.id === "import-task")?.name).toBe("Import Task")
      expect(Object.keys(mcpJson.mcpConfig?.mcpServers ?? {}).sort()).toEqual(["github", "github_imported"])
    })

    it("imports agent profiles with non-secret connection fields intact", async () => {
      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "External Agent Import",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 1, mcpServers: 0, skills: 0, repeatTasks: 0, memories: 0 },
        },
        agentProfiles: [
          {
            id: "external-agent",
            name: "external-agent",
            displayName: "External Agent",
            enabled: true,
            connection: {
              type: "stdio",
              command: "node",
              args: ["agent.js", "--profile", "ops"],
              cwd: "/tmp/external-agent",
              baseUrl: "https://agents.example.com",
            },
          },
        ],
        mcpServers: [],
        skills: [],
        repeatTasks: [],
        memories: [],
      }

      const bundlePath = path.join(tempDir, "import-external-agent.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })
      const layer = getAgentsLayerPaths(targetDir)
      const imported = loadAgentProfilesLayer(layer).profiles.find((profile) => profile.id === "external-agent")

      expect(result.success).toBe(true)
      expect(result.agentProfiles).toHaveLength(1)
      expect(result.agentProfiles[0]).toMatchObject({
        id: "external-agent",
        name: "external-agent",
        action: "imported",
      })
      expect(imported).toBeTruthy()
      expect(imported?.connection).toEqual({
        type: "stdio",
        command: "node",
        args: ["agent.js", "--profile", "ops"],
        cwd: "/tmp/external-agent",
        baseUrl: "https://agents.example.com",
      })
      expect(imported?.connection.env).toBeUndefined()
    })

    it("respects component selection", async () => {
      const bundle = createTestBundle()
      const bundlePath = path.join(tempDir, "import.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, {
        conflictStrategy: "skip",
        components: { agentProfiles: true, skills: false, repeatTasks: false, memories: false },
      })

      expect(result.agentProfiles.length).toBe(1)
      expect(result.skills.length).toBe(0)
      expect(result.repeatTasks.length).toBe(0)
      expect(result.memories.length).toBe(0)
    })

    it("respects per-item selection within enabled components", async () => {
      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "Per-item Import Selection",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 2, mcpServers: 2, skills: 2, repeatTasks: 2, memories: 2 },
        },
        agentProfiles: [
          { id: "agent-selected", name: "Selected Agent", enabled: true, connection: { type: "internal" } },
          { id: "agent-skipped", name: "Skipped Agent", enabled: true, connection: { type: "internal" } },
        ],
        mcpServers: [
          { name: "github", command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], transport: "stdio", enabled: true },
          { name: "filesystem", command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem"], transport: "stdio", enabled: true },
        ],
        skills: [
          { id: "skill-selected", name: "Selected Skill", description: "Keep me", instructions: "# Selected" },
          { id: "skill-skipped", name: "Skipped Skill", description: "Skip me", instructions: "# Skipped" },
        ],
        repeatTasks: [
          { id: "task-selected", name: "Selected Task", prompt: "Run selected", intervalMinutes: 30, enabled: true },
          { id: "task-skipped", name: "Skipped Task", prompt: "Run skipped", intervalMinutes: 60, enabled: true },
        ],
        memories: [
          { id: "memory-selected", title: "Selected Memory", content: "Keep me", importance: "medium", tags: [] },
          { id: "memory-skipped", title: "Skipped Memory", content: "Skip me", importance: "low", tags: [] },
        ],
      }

      const bundlePath = path.join(tempDir, "import-per-item-selection.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, {
        conflictStrategy: "skip",
        selectedItems: {
          agentProfileIds: ["agent-selected"],
          mcpServerNames: ["github"],
          skillIds: ["skill-selected"],
          repeatTaskIds: ["task-selected"],
          memoryIds: ["memory-selected"],
        },
      })
      const layer = getAgentsLayerPaths(targetDir)
      const importedMcpJson = readTestMcpJson(targetDir)
      const importedMcpServers = Object.keys(((importedMcpJson.mcpConfig as { mcpServers?: Record<string, unknown> } | undefined)?.mcpServers) ?? {})

      expect(result.success).toBe(true)
      expect(result.agentProfiles).toEqual([
        { id: "agent-selected", name: "Selected Agent", action: "imported" },
        { id: "agent-skipped", name: "Skipped Agent", action: "skipped" },
      ])
      expect(result.mcpServers).toEqual([
        { id: "github", name: "github", action: "imported" },
        { id: "filesystem", name: "filesystem", action: "skipped" },
      ])
      expect(result.skills).toEqual([
        { id: "skill-selected", name: "Selected Skill", action: "imported" },
        { id: "skill-skipped", name: "Skipped Skill", action: "skipped" },
      ])
      expect(result.repeatTasks).toEqual([
        { id: "task-selected", name: "Selected Task", action: "imported" },
        { id: "task-skipped", name: "Skipped Task", action: "skipped" },
      ])
      expect(result.memories).toEqual([
        { id: "memory-selected", name: "Selected Memory", action: "imported" },
        { id: "memory-skipped", name: "Skipped Memory", action: "skipped" },
      ])
      expect(loadAgentProfilesLayer(layer).profiles.map((profile) => profile.id)).toEqual(["agent-selected"])
      expect(importedMcpServers).toEqual(["github"])
      expect(loadAgentsSkillsLayer(layer).skills.map((skill) => skill.id)).toEqual(["skill-selected"])
      expect(loadTasksLayer(layer).tasks.map((task) => task.id)).toEqual(["task-selected"])
      expect(loadAgentsMemoriesLayer(layer).memories.map((memory) => memory.id)).toEqual(["memory-selected"])
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

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })
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

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "overwrite" })
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

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "rename" })
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

    it("preserves redacted MCP config placeholders so imported servers can be reconfigured safely", async () => {
      const bundle: DotAgentsBundle = {
        manifest: {
          version: 1,
          name: "MCP Placeholder Import Test",
          createdAt: new Date().toISOString(),
          exportedFrom: "test",
          components: { agentProfiles: 0, mcpServers: 1, skills: 0, repeatTasks: 0, memories: 0 },
        },
        agentProfiles: [],
        mcpServers: [
          {
            name: "remote-secure",
            transport: "streamableHttp",
            enabled: true,
            config: {
              transport: "streamableHttp",
              url: "https://mcp.example.com/secure",
              headers: {
                Authorization: "<CONFIGURE_YOUR_KEY>",
              },
              oauth: {
                clientId: "desktop-app",
                clientSecret: "<CONFIGURE_YOUR_KEY>",
              },
              env: {
                API_TOKEN: "<CONFIGURE_YOUR_KEY>",
                SAFE_VALUE: "keep-me",
              },
              timeout: 45_000,
            },
          },
        ],
        skills: [],
        repeatTasks: [],
        memories: [],
      }
      const bundlePath = path.join(tempDir, "import-mcp-placeholders.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const preview = previewBundle(bundlePath)
      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })
      const mcpJson = readTestMcpJson(targetDir)

      expect(preview?.mcpServers[0].redactedSecretFields).toEqual(["env", "headers", "oauth"])
      expect(result.success).toBe(true)
      expect(result.mcpServers).toEqual([{ id: "remote-secure", name: "remote-secure", action: "imported" }])
      expect(mcpJson).toEqual({
        mcpConfig: {
          mcpServers: {
            "remote-secure": {
              transport: "streamableHttp",
              url: "https://mcp.example.com/secure",
              headers: {
                Authorization: "<CONFIGURE_YOUR_KEY>",
              },
              oauth: {
                clientId: "desktop-app",
                clientSecret: "<CONFIGURE_YOUR_KEY>",
              },
              env: {
                API_TOKEN: "<CONFIGURE_YOUR_KEY>",
                SAFE_VALUE: "keep-me",
              },
              timeout: 45_000,
            },
          },
        },
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

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })
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

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })
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

    it("canonicalizes unknown legacy top-level MCP servers and preserves top-level mcp config keys", async () => {
      writeTestMcpJson(targetDir, {
        github: {
          executable: "node",
          launchArgs: ["server.js"],
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle = createTestMcpBundle("github")
      const bundlePath = path.join(tempDir, "import-mcp-unknown-legacy.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "overwrite" })
      const mcpJson = readTestMcpJson(targetDir)

      expect(result.success).toBe(true)
      expect(result.mcpServers).toEqual([{ id: "github", name: "github", action: "overwritten" }])
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

    it("does not treat empty top-level objects as legacy MCP servers during canonicalization", async () => {
      writeTestMcpJson(targetDir, {
        localNotes: {},
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle = createTestMcpBundle("exa")
      const bundlePath = path.join(tempDir, "import-mcp-empty-object.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })
      const mcpJson = readTestMcpJson(targetDir)

      expect(result.success).toBe(true)
      expect(result.mcpServers).toEqual([{ id: "exa", name: "exa", action: "imported" }])
      expect(mcpJson).toEqual({
        localNotes: {},
        mcpConfig: {
          mcpServers: {
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

    it("preserves non-object top-level metadata keys even when they match imported server names", async () => {
      writeTestMcpJson(targetDir, {
        exa: "workspace-note",
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle = createTestMcpBundle("exa")
      const bundlePath = path.join(tempDir, "import-mcp-preserve-metadata.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })
      const mcpJson = readTestMcpJson(targetDir)

      expect(result.success).toBe(true)
      expect(result.mcpServers).toEqual([{ id: "exa", name: "exa", action: "imported" }])
      expect(mcpJson).toEqual({
        exa: "workspace-note",
        mcpConfig: {
          mcpServers: {
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

    it("merges canonical and legacy MCP server maps before canonicalization", async () => {
      writeTestMcpJson(targetDir, {
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "existing-github-command",
              args: ["existing-arg"],
            },
          },
        },
        exa: {
          transport: "stdio",
          command: "legacy-exa-command",
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle = createTestMcpBundle("filesystem")
      const bundlePath = path.join(tempDir, "import-mcp-merged.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })
      const mcpJson = readTestMcpJson(targetDir)

      expect(result.success).toBe(true)
      expect(result.mcpServers).toEqual([{ id: "filesystem", name: "filesystem", action: "imported" }])
      expect(mcpJson).toEqual({
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "existing-github-command",
              args: ["existing-arg"],
            },
            exa: {
              transport: "stdio",
              command: "legacy-exa-command",
            },
            filesystem: {
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

    it("keeps unknown-shape legacy MCP servers when known-shape legacy servers also exist", async () => {
      writeTestMcpJson(targetDir, {
        github: {
          transport: "stdio",
          command: "legacy-github-command",
        },
        exa: {
          executable: "node",
          launchArgs: ["server.js"],
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle = createTestMcpBundle("filesystem")
      const bundlePath = path.join(tempDir, "import-mcp-mixed-known-unknown-legacy.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })
      const mcpJson = readTestMcpJson(targetDir)

      expect(result.success).toBe(true)
      expect(result.mcpServers).toEqual([{ id: "filesystem", name: "filesystem", action: "imported" }])
      expect(mcpJson).toEqual({
        mcpConfig: {
          mcpServers: {
            github: {
              transport: "stdio",
              command: "legacy-github-command",
            },
            exa: {
              executable: "node",
              launchArgs: ["server.js"],
            },
            filesystem: {
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

    it("canonicalizes mcp-prefixed legacy top-level MCP servers into mcpConfig.mcpServers", async () => {
      writeTestMcpJson(targetDir, {
        mcpGithub: {
          transport: "stdio",
          command: "legacy-github-command",
          args: ["legacy-arg"],
        },
        mcpDisabledTools: ["github:create_issue"],
      })

      const bundle = createTestMcpBundle("exa")
      const bundlePath = path.join(tempDir, "import-mcp-prefixed-legacy.dotagents")
      fs.writeFileSync(bundlePath, JSON.stringify(bundle))

      const result = await importBundleForTest(bundlePath, { conflictStrategy: "skip" })
      const mcpJson = readTestMcpJson(targetDir)

      expect(result.success).toBe(true)
      expect(result.mcpServers).toEqual([{ id: "exa", name: "exa", action: "imported" }])
      expect(mcpJson).toEqual({
        mcpConfig: {
          mcpServers: {
            mcpGithub: {
              transport: "stdio",
              command: "legacy-github-command",
              args: ["legacy-arg"],
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

// ============================================================================
// generatePublishPayload tests
// ============================================================================

describe("generatePublishPayload", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir()
    const layer = getAgentsLayerPaths(tempDir)
    fs.mkdirSync(layer.agentsDir, { recursive: true })
    fs.mkdirSync(path.join(layer.agentsDir, "skills"), { recursive: true })
    writeAgentsProfileFiles(layer, createTestProfile("agent-pub-1", "Publish Agent"))
    writeAgentsSkillFile(layer, createTestSkill("skill-pub-1", "Pub Skill"))
    writeAgentsMemoryFile(layer, createTestMemory("memory-pub-1", "Publish Memory"))
    writeTaskFile(layer, createTestTask("task-pub-1", "Publish Task"))
  })

  afterEach(() => cleanupDir(tempDir))

  it("defaults publish output to the public-safe component set", async () => {
    const result = await generatePublishPayload([tempDir], {
      name: "Test Publish Bundle",
      description: "A test bundle for publish",
      publicMetadata: {
        summary: "Great agent setup",
        author: { displayName: "Test Author", handle: "@test" },
        tags: ["test", "demo"],
      },
    })

    // Catalog item shape
    expect(result.catalogItem).toBeDefined()
    expect(result.catalogItem.name).toBe("Test Publish Bundle")
    expect(result.catalogItem.summary).toBe("Great agent setup")
    expect(result.catalogItem.description).toBe("A test bundle for publish")
    expect(result.catalogItem.author.displayName).toBe("Test Author")
    expect(result.catalogItem.author.handle).toBe("@test")
    expect(result.catalogItem.tags).toEqual(["test", "demo"])
    expect(result.catalogItem.bundleVersion).toBe(1)
    expect(result.catalogItem.id).toBe("test-publish-bundle")
    expect(result.catalogItem.publishedAt).toBeTruthy()
    expect(result.catalogItem.updatedAt).toBeTruthy()
    expect(result.catalogItem.componentCounts.agentProfiles).toBe(1)
    expect(result.catalogItem.componentCounts.skills).toBe(1)
    expect(result.catalogItem.componentCounts.repeatTasks).toBe(0)
    expect(result.catalogItem.componentCounts.memories).toBe(0)
    expect(result.catalogItem.artifact.url).toBe(
      "https://hub.dotagentsprotocol.com/bundles/test-publish-bundle.dotagents",
    )
    expect(result.catalogItem.artifact.fileName).toBe("Test Publish Bundle.dotagents")
    expect(result.catalogItem.artifact.sizeBytes).toBeGreaterThan(0)
    expect(result.installUrl).toBe(
      "dotagents://install?bundle=https%3A%2F%2Fhub.dotagentsprotocol.com%2Fbundles%2Ftest-publish-bundle.dotagents",
    )

    // Bundle JSON is valid
    const bundle = JSON.parse(result.bundleJson)
    expect(bundle.manifest.version).toBe(1)
    expect(bundle.manifest.name).toBe("Test Publish Bundle")
    expect(bundle.agentProfiles).toHaveLength(1)
    expect(bundle.skills).toHaveLength(1)
    expect(bundle.repeatTasks).toHaveLength(0)
    expect(bundle.memories).toHaveLength(0)
  })

  it("includes opt-in repeat tasks and memories when explicitly selected", async () => {
    const result = await generatePublishPayload([tempDir], {
      name: "Opt In Bundle",
      publicMetadata: {
        summary: "With optional public content",
        author: { displayName: "Test Author" },
        tags: ["test"],
      },
      components: {
        repeatTasks: true,
        memories: true,
      },
    })

    expect(result.catalogItem.componentCounts.repeatTasks).toBe(1)
    expect(result.catalogItem.componentCounts.memories).toBe(1)

    const bundle = JSON.parse(result.bundleJson)
    expect(bundle.repeatTasks).toHaveLength(1)
    expect(bundle.repeatTasks[0].id).toBe("task-pub-1")
    expect(bundle.memories).toHaveLength(1)
    expect(bundle.memories[0].id).toBe("memory-pub-1")
  })

  it("applies item-level filters to the generated publish bundle", async () => {
    const layer = getAgentsLayerPaths(tempDir)
    writeAgentsProfileFiles(layer, createTestProfile("agent-pub-2", "Publish Agent Two"))
    writeAgentsSkillFile(layer, createTestSkill("skill-pub-2", "Pub Skill Two"))
    writeAgentsMemoryFile(layer, createTestMemory("memory-pub-2", "Publish Memory Two"))
    writeTaskFile(layer, createTestTask("task-pub-2", "Publish Task Two"))
    writeTestMcpJson(tempDir, {
      mcpConfig: {
        mcpServers: {
          github: {
            transport: "stdio",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
          },
          exa: {
            transport: "streamableHttp",
            url: "https://mcp.exa.ai/mcp",
          },
        },
      },
    })

    const result = await generatePublishPayload([tempDir], {
      name: "Filtered Publish Bundle",
      publicMetadata: {
        summary: "With filtered items",
        author: { displayName: "Test Author" },
        tags: ["test"],
      },
      components: {
        repeatTasks: true,
        memories: true,
      },
      agentProfileIds: ["agent-pub-2"],
      mcpServerNames: ["exa"],
      skillIds: ["skill-pub-2"],
      repeatTaskIds: ["task-pub-2"],
      memoryIds: ["memory-pub-2"],
    })

    expect(result.catalogItem.componentCounts).toMatchObject({
      agentProfiles: 1,
      mcpServers: 1,
      skills: 1,
      repeatTasks: 1,
      memories: 1,
    })

    const bundle = JSON.parse(result.bundleJson)
    expect(bundle.agentProfiles.map((item: { id: string }) => item.id)).toEqual(["agent-pub-2"])
    expect(bundle.mcpServers.map((item: { name: string }) => item.name)).toEqual(["exa"])
    expect(bundle.skills.map((item: { id: string }) => item.id)).toEqual(["skill-pub-2"])
    expect(bundle.repeatTasks.map((item: { id: string }) => item.id)).toEqual(["task-pub-2"])
    expect(bundle.memories.map((item: { id: string }) => item.id)).toEqual(["memory-pub-2"])
  })

  it("accepts explicit catalog ids and artifact urls for Hub catalog alignment", async () => {
    const result = await generatePublishPayload([tempDir], {
      name: "Aligned Bundle",
      catalogId: "featured-aligned-bundle",
      artifactUrl: "https://cdn.dotagentsprotocol.com/bundles/featured-aligned-bundle.dotagents",
      publicMetadata: {
        summary: "Aligned for the Hub catalog",
        author: { displayName: "Author" },
        tags: ["featured"],
      },
    })

    expect(result.catalogItem.id).toBe("featured-aligned-bundle")
    expect(result.catalogItem.artifact.url).toBe(
      "https://cdn.dotagentsprotocol.com/bundles/featured-aligned-bundle.dotagents",
    )
    expect(result.installUrl).toBe(
      "dotagents://install?bundle=https%3A%2F%2Fcdn.dotagentsprotocol.com%2Fbundles%2Ffeatured-aligned-bundle.dotagents",
    )
  })

  it("throws when summary is missing", async () => {
    await expect(
      generatePublishPayload([tempDir], {
        name: "No Summary",
        publicMetadata: {
          summary: "",
          author: { displayName: "Author" },
          tags: [],
        },
      })
    ).rejects.toThrow(/summary/)
  })

  it("throws when author displayName is missing", async () => {
    await expect(
      generatePublishPayload([tempDir], {
        name: "No Author",
        publicMetadata: {
          summary: "Has summary",
          author: { displayName: "" },
          tags: [],
        },
      })
    ).rejects.toThrow(/displayName/)
  })

  it("includes compatibility metadata when provided", async () => {
    const result = await generatePublishPayload([tempDir], {
      name: "Compat Bundle",
      publicMetadata: {
        summary: "With compat",
        author: { displayName: "Author" },
        tags: [],
        compatibility: { minDesktopVersion: "1.5.0", notes: ["Requires macOS"] },
      },
    })

    expect(result.catalogItem.compatibility).toBeDefined()
    expect(result.catalogItem.compatibility!.minDesktopVersion).toBe("1.5.0")
    expect(result.catalogItem.compatibility!.notes).toEqual(["Requires macOS"])
  })

  it("strips whitespace-only tags", async () => {
    const result = await generatePublishPayload([tempDir], {
      name: "Tag Test",
      publicMetadata: {
        summary: "Tags",
        author: { displayName: "Author" },
        tags: ["valid", " ", "  ", "also-valid"],
      },
    })

    expect(result.catalogItem.tags).toEqual(["valid", "also-valid"])
  })

  it("omits optional author fields when not provided", async () => {
    const result = await generatePublishPayload([tempDir], {
      name: "Minimal",
      publicMetadata: {
        summary: "Minimal author",
        author: { displayName: "Just Name" },
        tags: [],
      },
    })

    expect(result.catalogItem.author.displayName).toBe("Just Name")
    expect(result.catalogItem.author.handle).toBeUndefined()
    expect(result.catalogItem.author.url).toBeUndefined()
  })

  it("rejects non-http artifact urls", async () => {
    await expect(
      generatePublishPayload([tempDir], {
        name: "Bad Url",
        artifactUrl: "file:///tmp/bad.dotagents",
        publicMetadata: {
          summary: "Has a bad artifact URL",
          author: { displayName: "Author" },
          tags: [],
        },
      }),
    ).rejects.toThrow(/artifactUrl/)
  })
})
