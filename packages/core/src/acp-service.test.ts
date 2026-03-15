/**
 * Tests for ACP Service (core extraction)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs"
import { homedir, tmpdir } from "os"
import { join } from "path"

// Mock child_process
const mockSpawn = vi.fn()
vi.mock("child_process", () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}))

// Mock fs/promises for file operations
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  realpath: vi.fn((p: string) => Promise.resolve(p)),
}))

// Mock state for toolApprovalManager
vi.mock("./state", () => ({
  toolApprovalManager: {
    requestApproval: vi.fn(() => ({
      approvalId: "test-approval-id",
      promise: Promise.resolve(true),
    })),
    respondToApproval: vi.fn(),
    getPendingApproval: vi.fn(),
    cancelSessionApprovals: vi.fn(),
    cancelAllApprovals: vi.fn(),
  },
  agentSessionStateManager: {
    getSessionRunId: vi.fn(() => 1),
  },
}))

// Mock config store
const mockConfig = {
  acpAgents: [
    {
      name: "test-agent",
      displayName: "Test Agent",
      description: "A test ACP agent",
      enabled: true,
      autoSpawn: false,
      connection: {
        type: "stdio" as const,
        command: "test-command",
        args: ["--test"],
        env: { TEST_VAR: "value" },
      },
    },
    {
      name: "disabled-agent",
      displayName: "Disabled Agent",
      enabled: false,
      connection: {
        type: "stdio" as const,
        command: "disabled-cmd",
      },
    },
  ],
}

const mockGetByName: any = vi.fn(() => null)

vi.mock("./config", () => ({
  configStore: {
    get: () => mockConfig,
  },
  globalAgentsFolder: process.env.TMPDIR || process.env.TEMP || process.env.TMP || "/tmp",
  resolveWorkspaceAgentsFolder: () => null,
}))

// Mock debug
vi.mock("./debug", () => ({
  logApp: vi.fn(),
  logACP: vi.fn(),
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getByName: mockGetByName,
    getExternalAgents: vi.fn(() => []),
  },
}))

vi.mock("./acp-session-state", () => ({
  clearAcpClientSessionTokenMapping: vi.fn(),
  getAppRunIdForAcpSession: vi.fn(),
  getAppSessionForAcpSession: vi.fn(),
  setPendingAcpClientSessionTokenMapping: vi.fn(),
  setAcpClientSessionTokenMapping: vi.fn(),
}))

describe("ACP Service (core)", () => {
  let mockProcess: {
    stdout: { on: ReturnType<typeof vi.fn> }
    stderr: { on: ReturnType<typeof vi.fn> }
    stdin: { write: ReturnType<typeof vi.fn> }
    on: ReturnType<typeof vi.fn>
    kill: ReturnType<typeof vi.fn>
    killed: boolean
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetByName.mockReset()
    mockGetByName.mockReturnValue(null)
    delete process.env.DOTAGENTS_WORKSPACE_DIR
    ;(mockConfig.acpAgents[0].connection as { cwd?: string }).cwd = undefined

    // Create mock process
    mockProcess = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn((_data: any, cb?: any) => cb && cb()) },
      on: vi.fn(),
      kill: vi.fn(),
      killed: false,
    }

    mockSpawn.mockReturnValue(mockProcess)
  })

  afterEach(() => {
    delete process.env.DOTAGENTS_WORKSPACE_DIR
    vi.resetModules()
  })

  describe("getAgents", () => {
    it("should return all configured agents with status", async () => {
      const { acpService } = await import("./acp-service")
      const agents = acpService.getAgents()

      expect(agents).toHaveLength(2)
      expect(agents[0]).toEqual({
        config: expect.objectContaining({ name: "test-agent" }),
        status: "stopped",
        error: undefined,
      })
    })
  })

  describe("spawnAgent", () => {
    it("should spawn an agent process", async () => {
      const { acpService } = await import("./acp-service")

      const spawnPromise = acpService.spawnAgent("test-agent")

      expect(mockSpawn).toHaveBeenCalledWith(
        "test-command",
        ["--test"],
        expect.objectContaining({
          env: expect.objectContaining({ TEST_VAR: "value" }),
          stdio: ["pipe", "pipe", "pipe"],
        })
      )

      await spawnPromise

      const status = acpService.getAgentStatus("test-agent")
      expect(status?.status).toBe("ready")
    })

    it("should throw error for non-existent agent", async () => {
      const { acpService } = await import("./acp-service")

      await expect(acpService.spawnAgent("nonexistent")).rejects.toThrow(
        "Agent nonexistent not found in configuration"
      )
    })

    it("should throw error for disabled agent", async () => {
      const { acpService } = await import("./acp-service")

      await expect(acpService.spawnAgent("disabled-agent")).rejects.toThrow(
        "Agent disabled-agent is disabled"
      )
    })

    it("should spawn an ACP agent defined in agent profiles", async () => {
      mockGetByName.mockReturnValue({
        name: "augustus",
        displayName: "augustus",
        description: "Augment Code's AI coding assistant",
        enabled: true,
        autoSpawn: false,
        isBuiltIn: false,
        connection: {
          type: "acp",
          command: "auggie",
          args: ["--acp"],
        },
      })

      const { acpService } = await import("./acp-service")

      await acpService.spawnAgent("augustus")

      expect(mockSpawn).toHaveBeenCalledWith(
        "auggie",
        ["--acp"],
        expect.objectContaining({
          stdio: ["pipe", "pipe", "pipe"],
        })
      )
      expect(acpService.getAgentStatus("augustus")?.status).toBe("ready")
    })
  })

  describe("getAgentStatus", () => {
    it("should return stopped for unspawned agent", async () => {
      const { acpService } = await import("./acp-service")
      const status = acpService.getAgentStatus("test-agent")
      expect(status).toEqual({ status: "stopped" })
    })
  })

  describe("session/update normalization", () => {
    it("normalizes plain text chunk payloads into text content blocks", async () => {
      const { acpService } = await import("./acp-service")

      const sessionUpdatePromise = new Promise<{
        sessionId: string
        content?: { type: string; text?: string }[]
      }>((resolve) => {
        acpService.once("sessionUpdate", (event) => resolve(event))
      })

      acpService.emit("notification", {
        agentName: "test-agent",
        method: "session/update",
        params: {
          sessionId: "session-text-chunk",
          update: {
            sessionUpdate: "agent_message_chunk",
            text: "streamed hello",
          },
        },
      })

      const event = await sessionUpdatePromise
      expect(event.sessionId).toBe("session-text-chunk")
      expect(event.content).toEqual([{ type: "text", text: "streamed hello" }])
    })
  })

  describe("no electron imports", () => {
    it("module loads without electron dependency", async () => {
      const acpModule = await import("./acp-service")
      expect(acpModule.acpService).toBeDefined()
      expect(acpModule.acpService.on).toBeDefined()
      expect(typeof acpModule.acpService.on).toBe("function")
    })
  })
})
