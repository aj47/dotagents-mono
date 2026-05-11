import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const runtimeFsMocks = vi.hoisted(() => ({
  dataFolder: "",
  getAgentTargets: vi.fn(),
  getAgents: vi.fn(),
}))

vi.mock("./config", () => ({
  dataFolder: runtimeFsMocks.dataFolder,
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getAgentTargets: runtimeFsMocks.getAgentTargets,
  },
}))

vi.mock("./acp-service", () => ({
  acpService: {
    getAgents: runtimeFsMocks.getAgents,
  },
}))

describe("runtime filesystem context", () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    runtimeFsMocks.dataFolder = await mkdtemp(path.join(os.tmpdir(), "dotagents-runtime-files-"))
    runtimeFsMocks.getAgentTargets.mockReturnValue([
      {
        id: "profile-1",
        name: "planner",
        displayName: "Planner",
        description: "Plans work",
        enabled: true,
        role: "delegation-target",
        connection: { type: "internal" },
      },
    ])
    runtimeFsMocks.getAgents.mockReturnValue([
      {
        status: "ready",
        config: {
          name: "external-agent",
          displayName: "External Agent",
          description: "External ACP agent",
          enabled: true,
          connection: { type: "acpx" },
        },
      },
    ])
  })

  afterEach(async () => {
    if (runtimeFsMocks.dataFolder) {
      await rm(runtimeFsMocks.dataFolder, { recursive: true, force: true })
      runtimeFsMocks.dataFolder = ""
    }
  })

  it("writes agent, tool, and schema manifests under the runtime directory", async () => {
    const {
      ensureRuntimeFilesystemContext,
      formatRuntimeFilesystemContextForPrompt,
    } = await import("./runtime-filesystem-context")

    const paths = ensureRuntimeFilesystemContext([
      {
        name: "execute_command",
        description: "Execute command",
        inputSchema: { type: "object", properties: { command: { type: "string" } }, required: ["command"] },
      },
      {
        name: "github:create_issue",
        description: "Create issue",
        inputSchema: { type: "object", properties: { title: { type: "string" } }, required: ["title"] },
      },
    ] as any, "session:1")

    const agents = JSON.parse(await readFile(paths.agentRegistryPath, "utf8"))
    const tools = JSON.parse(await readFile(paths.toolManifestPath, "utf8"))
    const executeSchema = JSON.parse(await readFile(path.join(paths.toolSchemaDir, "execute_command.schema.json"), "utf8"))
    const promptContext = formatRuntimeFilesystemContextForPrompt(paths)

    expect(paths.runtimeDir).toBe(path.join(runtimeFsMocks.dataFolder, "runtime"))
    expect(paths.sessionDir).toBe(path.join(runtimeFsMocks.dataFolder, "runtime", "sessions", "session_1"))
    expect(agents.agents).toEqual([
      expect.objectContaining({ name: "external-agent", source: "legacy-acp", acpStatus: "ready" }),
      expect.objectContaining({ name: "planner", source: "profile", connectionType: "internal" }),
    ])
    expect(tools.tools).toEqual([
      expect.objectContaining({ name: "execute_command", sourceKind: "runtime", schemaFile: "execute_command.schema.json" }),
      expect.objectContaining({ name: "github:create_issue", sourceKind: "mcp", serverName: "github", schemaFile: "github_create_issue.schema.json" }),
    ])
    expect(executeSchema.inputSchema.required).toEqual(["command"])
    expect(promptContext).toContain(`Agent registry: ${paths.agentRegistryPath}`)
    expect(promptContext).toContain(`Tool manifest: ${paths.toolManifestPath}`)
  })
})
