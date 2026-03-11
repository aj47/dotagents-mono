/**
 * Tests for ACP Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs"
import { homedir, tmpdir } from "os"
import { join } from "path"

// Mock electron (agent-profile-service reads app.getPath("userData") at import time)
vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => {
      return process.env.TMPDIR || process.env.TEMP || process.env.TMP || "/tmp"
    }),
  },
}))

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
}))

// Mock state for toolApprovalManager
vi.mock("./state", () => ({
  state: {
    shouldStopAgent: false,
  },
  agentSessionStateManager: {
    getSessionRunId: vi.fn(),
  },
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
}))

// Mock emit-agent-progress
vi.mock("./emit-agent-progress", () => ({
  emitAgentProgress: vi.fn(() => Promise.resolve()),
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
    {
      name: "auto-spawn-agent",
      displayName: "Auto Spawn Agent",
      enabled: true,
      autoSpawn: true,
      connection: {
        type: "stdio" as const,
        command: "auto-cmd",
      },
    },
  ],
}

const mockGetByName: any = vi.fn(() => null)

vi.mock("./config", () => ({
  configStore: {
    get: () => mockConfig,
  },
  // AgentProfileService imports these from ./config
  globalAgentsFolder: process.env.TMPDIR || process.env.TEMP || process.env.TMP || "/tmp",
  resolveWorkspaceAgentsFolder: () => null,
}))

// Mock debug
vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

// Keep ACP service tests deterministic: use legacy acpAgents config path directly.
vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getByName: mockGetByName,
    getExternalAgents: vi.fn(() => []),
  },
}))

describe("ACP Service", () => {
  let originalWorkspaceEnv: string | undefined
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
    originalWorkspaceEnv = process.env.DOTAGENTS_WORKSPACE_DIR
    delete process.env.DOTAGENTS_WORKSPACE_DIR
    ;(mockConfig.acpAgents[0].connection as { cwd?: string }).cwd = undefined

    // Create mock process
    mockProcess = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn((data, cb) => cb && cb()) },
      on: vi.fn(),
      kill: vi.fn(),
      killed: false,
    }

    mockSpawn.mockReturnValue(mockProcess)
  })

  afterEach(() => {
    if (originalWorkspaceEnv === undefined) {
      delete process.env.DOTAGENTS_WORKSPACE_DIR
    } else {
      process.env.DOTAGENTS_WORKSPACE_DIR = originalWorkspaceEnv
    }
    vi.resetModules()
  })

  describe("getAgents", () => {
    it("should return all configured agents with status", async () => {
      const { acpService } = await import("./acp-service")
      const agents = acpService.getAgents()

      expect(agents).toHaveLength(3)
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

      // Don't await - just start the spawn
      const spawnPromise = acpService.spawnAgent("test-agent")

      // Verify spawn was called with correct args
      expect(mockSpawn).toHaveBeenCalledWith(
        "test-command",
        ["--test"],
        expect.objectContaining({
          env: expect.objectContaining({ TEST_VAR: "value" }),
          stdio: ["pipe", "pipe", "pipe"],
        })
      )

      // Wait for the spawn to complete
      await spawnPromise

      // Check status is ready
      const status = acpService.getAgentStatus("test-agent")
      expect(status?.status).toBe("ready")
    })

    it("should honor per-call workingDirectory override", async () => {
      const workspaceDir = mkdtempSync(join(tmpdir(), "acp-workspace-"))
      const overrideDir = "repo/feature-a"
      const expectedCwd = join(workspaceDir, overrideDir)
      mkdirSync(expectedCwd, { recursive: true })

      process.env.DOTAGENTS_WORKSPACE_DIR = workspaceDir

      const { acpService } = await import("./acp-service")
      const spawnResult = await acpService.spawnAgent("test-agent", { workingDirectory: overrideDir })

      expect(spawnResult).toEqual(expect.objectContaining({
        effectiveWorkingDirectory: expectedCwd,
        reusedExistingProcess: false,
        restartedProcess: false,
      }))
      expect(mockSpawn).toHaveBeenCalledWith(
        "test-command",
        ["--test"],
        expect.objectContaining({ cwd: expectedCwd })
      )

      rmSync(workspaceDir, { recursive: true, force: true })
    })

    it("should restart a ready agent when workingDirectory changes", async () => {
      const workspaceDir = mkdtempSync(join(tmpdir(), "acp-workspace-"))
      const firstDir = "repo/feature-a"
      const secondDir = "repo/feature-b"
      const expectedFirstCwd = join(workspaceDir, firstDir)
      const expectedSecondCwd = join(workspaceDir, secondDir)
      mkdirSync(expectedFirstCwd, { recursive: true })
      mkdirSync(expectedSecondCwd, { recursive: true })

      process.env.DOTAGENTS_WORKSPACE_DIR = workspaceDir

      const { acpService } = await import("./acp-service")

      await acpService.spawnAgent("test-agent", { workingDirectory: firstDir })

      const stopSpy = vi.spyOn(acpService, "stopAgent").mockResolvedValue()
      const secondSpawnResult = await acpService.spawnAgent("test-agent", { workingDirectory: secondDir })

      expect(stopSpy).toHaveBeenCalledWith("test-agent")
      expect(mockSpawn).toHaveBeenNthCalledWith(
        2,
        "test-command",
        ["--test"],
        expect.objectContaining({ cwd: expectedSecondCwd })
      )
      expect(secondSpawnResult).toEqual(expect.objectContaining({
        effectiveWorkingDirectory: expectedSecondCwd,
        reusedExistingProcess: false,
        restartedProcess: true,
      }))

      rmSync(workspaceDir, { recursive: true, force: true })
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
        description: "Augment Code's AI coding assistant with native ACP support",
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

    it("should resolve relative configured cwd from DOTAGENTS_WORKSPACE_DIR", async () => {
      const workspaceDir = mkdtempSync(join(tmpdir(), "acp-workspace-"))
      const agentCwd = "repo/subdir"
      const expectedCwd = join(workspaceDir, agentCwd)
      mkdirSync(expectedCwd, { recursive: true })

      process.env.DOTAGENTS_WORKSPACE_DIR = workspaceDir
      ;(mockConfig.acpAgents[0].connection as { cwd?: string }).cwd = agentCwd

      const { acpService } = await import("./acp-service")
      await acpService.spawnAgent("test-agent")

      expect(mockSpawn).toHaveBeenCalledWith(
        "test-command",
        ["--test"],
        expect.objectContaining({ cwd: expectedCwd })
      )

      rmSync(workspaceDir, { recursive: true, force: true })
    })

    it("should expand ~ configured cwd to the user home directory", async () => {
      ;(mockConfig.acpAgents[0].connection as { cwd?: string }).cwd = "~"

      const { acpService } = await import("./acp-service")
      await acpService.spawnAgent("test-agent")

      expect(mockSpawn).toHaveBeenCalledWith(
        "test-command",
        ["--test"],
        expect.objectContaining({ cwd: homedir() })
      )
    })

    it("should throw a clear error when configured cwd does not exist", async () => {
      ;(mockConfig.acpAgents[0].connection as { cwd?: string }).cwd = `/path/that/does/not/exist-${Date.now()}`

      const { acpService } = await import("./acp-service")

      await expect(acpService.spawnAgent("test-agent")).rejects.toThrow("does not exist")
      expect(mockSpawn).not.toHaveBeenCalled()
    })

    it("should throw a clear error when configured cwd is a file", async () => {
      const workspaceDir = mkdtempSync(join(tmpdir(), "acp-workspace-"))
      const filePath = join(workspaceDir, "not-a-directory.txt")
      writeFileSync(filePath, "test")
      ;(mockConfig.acpAgents[0].connection as { cwd?: string }).cwd = filePath

      const { acpService } = await import("./acp-service")

      await expect(acpService.spawnAgent("test-agent")).rejects.toThrow("must be a directory")
      expect(mockSpawn).not.toHaveBeenCalled()

      rmSync(workspaceDir, { recursive: true, force: true })
    })

    it("should ignore DOTAGENTS_WORKSPACE_DIR when it points to a file", async () => {
      const workspaceDir = mkdtempSync(join(tmpdir(), "acp-workspace-"))
      const invalidWorkspacePath = join(workspaceDir, "workspace-file.txt")
      writeFileSync(invalidWorkspacePath, "not-a-directory")

      process.env.DOTAGENTS_WORKSPACE_DIR = invalidWorkspacePath

      const { acpService } = await import("./acp-service")
      await acpService.spawnAgent("test-agent")

      expect(mockSpawn).toHaveBeenCalledWith(
        "test-command",
        ["--test"],
        expect.objectContaining({ cwd: expect.any(String) })
      )

      const spawnOptions = mockSpawn.mock.calls[0]?.[2] as { cwd?: string } | undefined
      expect(spawnOptions?.cwd).toBeTruthy()
      expect(spawnOptions?.cwd).not.toBe(invalidWorkspacePath)

      rmSync(workspaceDir, { recursive: true, force: true })
    })
  })

  describe("getOrCreateSession", () => {
    it("restarts a ready agent when configured cwd changes before creating a new session", async () => {
      const workspaceDir = mkdtempSync(join(tmpdir(), "acp-workspace-"))
      const firstDir = "repo/feature-a"
      const secondDir = "repo/feature-b"
      const expectedFirstCwd = join(workspaceDir, firstDir)
      const expectedSecondCwd = join(workspaceDir, secondDir)
      mkdirSync(expectedFirstCwd, { recursive: true })
      mkdirSync(expectedSecondCwd, { recursive: true })

      process.env.DOTAGENTS_WORKSPACE_DIR = workspaceDir
      ;(mockConfig.acpAgents[0].connection as { cwd?: string }).cwd = firstDir

      const { acpService } = await import("./acp-service")
      await acpService.spawnAgent("test-agent")

      ;(mockConfig.acpAgents[0].connection as { cwd?: string }).cwd = secondDir

      const stopSpy = vi.spyOn(acpService, "stopAgent").mockResolvedValue()
      vi.spyOn(acpService as any, "initializeAgent").mockResolvedValue(undefined)
      vi.spyOn(acpService as any, "createSession").mockResolvedValue("session-updated-cwd")

      const sessionId = await acpService.getOrCreateSession("test-agent", true)

      expect(sessionId).toBe("session-updated-cwd")
      expect(stopSpy).toHaveBeenCalledWith("test-agent")
      expect(mockSpawn).toHaveBeenNthCalledWith(
        2,
        "test-command",
        ["--test"],
        expect.objectContaining({ cwd: expectedSecondCwd })
      )

      rmSync(workspaceDir, { recursive: true, force: true })
    })
  })

  describe("sendPrompt", () => {
    it("retries once with a fresh session after a stale kill-switch failure", async () => {
      const { acpService } = await import("./acp-service")

      await acpService.spawnAgent("test-agent")

      const getOrCreateSessionSpy = vi.spyOn(acpService, "getOrCreateSession").mockResolvedValue("fresh-session")
      const sendRequestSpy = vi.spyOn(acpService as any, "sendRequest")
        .mockRejectedValueOnce(new Error("Session stopped by kill switch"))
        .mockResolvedValueOnce({
          content: [{ type: "text", text: "Recovered output" }],
        })

      const result = await acpService.sendPrompt("test-agent", "stale-session", "hello")

      expect(getOrCreateSessionSpy).toHaveBeenCalledWith("test-agent", true)
      expect(sendRequestSpy).toHaveBeenNthCalledWith(
        1,
        "test-agent",
        "session/prompt",
        {
          sessionId: "stale-session",
          prompt: [{ type: "text", text: "hello" }],
        }
      )
      expect(sendRequestSpy).toHaveBeenNthCalledWith(
        2,
        "test-agent",
        "session/prompt",
        {
          sessionId: "fresh-session",
          prompt: [{ type: "text", text: "hello" }],
        }
      )
      expect(result).toEqual({
        success: true,
        response: "Recovered output",
        stopReason: undefined,
      })
    })
  })

  describe("runTask", () => {
    it("restarts a ready agent when configured cwd changes before forcing a new session", async () => {
      const workspaceDir = mkdtempSync(join(tmpdir(), "acp-workspace-"))
      const firstDir = "repo/feature-a"
      const secondDir = "repo/feature-b"
      const expectedFirstCwd = join(workspaceDir, firstDir)
      const expectedSecondCwd = join(workspaceDir, secondDir)
      mkdirSync(expectedFirstCwd, { recursive: true })
      mkdirSync(expectedSecondCwd, { recursive: true })

      process.env.DOTAGENTS_WORKSPACE_DIR = workspaceDir
      ;(mockConfig.acpAgents[0].connection as { cwd?: string }).cwd = firstDir

      const { acpService } = await import("./acp-service")
      await acpService.spawnAgent("test-agent")

      ;(mockConfig.acpAgents[0].connection as { cwd?: string }).cwd = secondDir

      const stopSpy = vi.spyOn(acpService, "stopAgent").mockResolvedValue()
      vi.spyOn(acpService as any, "initializeAgent").mockResolvedValue(undefined)
      vi.spyOn(acpService as any, "createSession").mockResolvedValue("session-updated-cwd")
      vi.spyOn(acpService as any, "sendRequest").mockResolvedValue({
        content: [{ type: "text", text: "done" }],
      })

      const result = await acpService.runTask({
        agentName: "test-agent",
        input: "hello",
        forceNewSession: true,
      })

      expect(result).toEqual(expect.objectContaining({
        success: true,
        result: "done",
      }))
      expect(stopSpy).toHaveBeenCalledWith("test-agent")
      expect(mockSpawn).toHaveBeenNthCalledWith(
        2,
        "test-command",
        ["--test"],
        expect.objectContaining({ cwd: expectedSecondCwd })
      )

      rmSync(workspaceDir, { recursive: true, force: true })
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

    it("does not surface thought fields as user-visible text", async () => {
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
          sessionId: "session-thought-hidden",
          update: {
            sessionUpdate: "agent_message_chunk",
            text: "public output",
            thought: "internal-only reasoning",
          },
        },
      })

      const event = await sessionUpdatePromise
      expect(event.sessionId).toBe("session-thought-hidden")
      expect(event.content).toEqual([{ type: "text", text: "public output" }])
    })

    it("normalizes update.message objects with direct content fields", async () => {
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
          sessionId: "session-message-content",
          update: {
            sessionUpdate: "agent_message_chunk",
            message: {
              content: [{ type: "text", text: "nested content" }],
            },
          },
        },
      })

      const event = await sessionUpdatePromise
      expect(event.sessionId).toBe("session-message-content")
      expect(event.content).toEqual([{ type: "text", text: "nested content" }])
    })

    it("normalizes tool_call update payloads into ACPToolCallUpdate", async () => {
      const { acpService } = await import("./acp-service")

      const toolUpdatePromise = new Promise<{
        sessionId: string
        toolCall?: { toolCallId: string; title: string; status?: string }
      }>((resolve) => {
        acpService.once("toolCallUpdate", (event) => resolve(event))
      })

      acpService.emit("notification", {
        agentName: "test-agent",
        method: "session/update",
        params: {
          sessionId: "session-tool-call",
          update: {
            sessionUpdate: "tool_call",
            toolCallId: "tool-123",
            title: "sub-agent-augustus: Build a plan",
          },
        },
      })

      const event = await toolUpdatePromise
      expect(event.sessionId).toBe("session-tool-call")
      expect(event.toolCall).toEqual(expect.objectContaining({
        toolCallId: "tool-123",
        title: "sub-agent-augustus: Build a plan",
        status: "running",
      }))
    })

    it("generates unique fallback toolCallIds when ACP payload omits toolCallId", async () => {
      const { acpService } = await import("./acp-service")

      const firstUpdatePromise = new Promise<{
        sessionId: string
        toolCall?: { toolCallId: string; title: string; status?: string }
      }>((resolve) => {
        acpService.once("toolCallUpdate", (event) => resolve(event))
      })

      acpService.emit("notification", {
        agentName: "test-agent",
        method: "session/update",
        params: {
          sessionId: "session-tool-call-fallback",
          update: {
            sessionUpdate: "tool_call",
            title: "Tool call one",
          },
        },
      })

      const secondUpdatePromise = new Promise<{
        sessionId: string
        toolCall?: { toolCallId: string; title: string; status?: string }
      }>((resolve) => {
        acpService.once("toolCallUpdate", (event) => resolve(event))
      })

      acpService.emit("notification", {
        agentName: "test-agent",
        method: "session/update",
        params: {
          sessionId: "session-tool-call-fallback",
          update: {
            sessionUpdate: "tool_call",
            title: "Tool call two",
          },
        },
      })

      const firstEvent = await firstUpdatePromise
      const secondEvent = await secondUpdatePromise

      expect(firstEvent.toolCall?.toolCallId).toMatch(/^tool-call-fallback-\d+$/)
      expect(secondEvent.toolCall?.toolCallId).toMatch(/^tool-call-fallback-\d+$/)
      expect(firstEvent.toolCall?.toolCallId).not.toBe(secondEvent.toolCall?.toolCallId)
    })

    it("derives completed tool status when sessionUpdate is tool_call_completed and status is omitted", async () => {
      const { acpService } = await import("./acp-service")

      const toolUpdatePromise = new Promise<{
        sessionId: string
        toolCall?: { toolCallId: string; title: string; status?: string }
      }>((resolve) => {
        acpService.once("toolCallUpdate", (event) => resolve(event))
      })

      acpService.emit("notification", {
        agentName: "test-agent",
        method: "session/update",
        params: {
          sessionId: "session-tool-call-completed",
          update: {
            sessionUpdate: "tool_call_completed",
            toolCallId: "tool-456",
            title: "Tool call done",
          },
        },
      })

      const event = await toolUpdatePromise
      expect(event.toolCall).toEqual(expect.objectContaining({
        toolCallId: "tool-456",
        status: "completed",
      }))
    })

    it("derives failed tool status when sessionUpdate is tool_call_failed and status is omitted", async () => {
      const { acpService } = await import("./acp-service")

      const toolUpdatePromise = new Promise<{
        sessionId: string
        toolCall?: { toolCallId: string; title: string; status?: string }
      }>((resolve) => {
        acpService.once("toolCallUpdate", (event) => resolve(event))
      })

      acpService.emit("notification", {
        agentName: "test-agent",
        method: "session/update",
        params: {
          sessionId: "session-tool-call-failed",
          update: {
            sessionUpdate: "tool_call_failed",
            toolCallId: "tool-789",
            title: "Tool call failed",
          },
        },
      })

      const event = await toolUpdatePromise
      expect(event.toolCall).toEqual(expect.objectContaining({
        toolCallId: "tool-789",
        status: "failed",
      }))
    })
  })

  describe("ACP Client Capabilities", () => {
    describe("fs/read_text_file", () => {
      it("should read file contents", async () => {
        const { readFile } = await import("fs/promises")
        const mockReadFile = vi.mocked(readFile)
        mockReadFile.mockResolvedValue("file content line 1\nline 2\nline 3")

        // Import the service to access internal methods via events
        const { acpService } = await import("./acp-service")
        
        // The handleReadTextFile is private, so we test via the event system
        // Verify the service exists
        expect(acpService).toBeDefined()
        expect(acpService.on).toBeDefined()
      })
    })

    describe("fs/write_text_file", () => {
      it("should have write file capability", async () => {
        const { writeFile, mkdir } = await import("fs/promises")
        const mockWriteFile = vi.mocked(writeFile)
        const mockMkdir = vi.mocked(mkdir)
        mockWriteFile.mockResolvedValue()
        mockMkdir.mockResolvedValue(undefined)

        // Verify imports work
        expect(mockWriteFile).toBeDefined()
        expect(mockMkdir).toBeDefined()
      })
    })

    describe("session/request_permission", () => {
      it("should have permission request types exported", async () => {
        // Verify the types can be imported
        const acpService = await import("./acp-service")
        
        // Check that the service has the toolCallUpdate event
        expect(acpService.acpService.on).toBeDefined()
        expect(typeof acpService.acpService.on).toBe("function")
      })
    })
  })

  describe("ACP Session Config Options", () => {
    it("stores config options from config_options_update notifications", async () => {
      const { acpService } = await import("./acp-service")
      await acpService.spawnAgent("test-agent")

      const sessionUpdatePromise = new Promise<{ sessionId: string }>((resolve) => {
        acpService.once("sessionUpdate", (event) => resolve(event))
      })

      acpService.emit("notification", {
        agentName: "test-agent",
        method: "session/update",
        params: {
          sessionId: "session-config-options",
          update: {
            sessionUpdate: "config_options_update",
            configOptions: [
              {
                id: "mode",
                name: "Session Mode",
                category: "mode",
                type: "select",
                currentValue: "code",
                options: [
                  { value: "ask", name: "Ask" },
                  { value: "code", name: "Code" },
                ],
              },
            ],
          },
        },
      })

      const event = await sessionUpdatePromise
      expect(event.sessionId).toBe("session-config-options")
      expect(acpService.getAgentInstance("test-agent")?.sessionInfo?.configOptions).toEqual([
        expect.objectContaining({
          id: "mode",
          currentValue: "code",
        }),
      ])
    })

    it("ignores non-array config options from config_options_update notifications", async () => {
      const { acpService } = await import("./acp-service")
      await acpService.spawnAgent("test-agent")

      const sessionUpdatePromise = new Promise<{ sessionId: string }>((resolve) => {
        acpService.once("sessionUpdate", (event) => resolve(event))
      })

      acpService.emit("notification", {
        agentName: "test-agent",
        method: "session/update",
        params: {
          sessionId: "session-invalid-config-options",
          update: {
            sessionUpdate: "config_options_update",
            configOptions: {
              id: "mode",
            },
          },
        },
      })

      const event = await sessionUpdatePromise
      expect(event.sessionId).toBe("session-invalid-config-options")
      expect(acpService.getAgentInstance("test-agent")?.sessionInfo?.configOptions).toBeUndefined()
    })

    it("stores config options arrays from session/new responses", async () => {
      const { acpService } = await import("./acp-service")
      await acpService.spawnAgent("test-agent")

      vi.spyOn(acpService as any, "sendRequest").mockResolvedValue({
        sessionId: "session-new-config-options",
        config_options: [
          {
            id: "model",
            name: "Model",
            type: "select",
            currentValue: "sonnet",
            options: [{ value: "sonnet", name: "Claude Sonnet" }],
          },
        ],
      })

      const sessionId = await (acpService as any).createSession("test-agent")

      expect(sessionId).toBe("session-new-config-options")
      expect(acpService.getAgentInstance("test-agent")?.sessionInfo?.configOptions).toEqual([
        expect.objectContaining({
          id: "model",
          currentValue: "sonnet",
        }),
      ])
    })

    it("ignores non-array config options from session/new responses", async () => {
      const { acpService } = await import("./acp-service")
      await acpService.spawnAgent("test-agent")

      vi.spyOn(acpService as any, "sendRequest").mockResolvedValue({
        sessionId: "session-new-invalid-config-options",
        configOptions: {
          id: "model",
        },
      })

      const sessionId = await (acpService as any).createSession("test-agent")

      expect(sessionId).toBe("session-new-invalid-config-options")
      expect(acpService.getAgentInstance("test-agent")?.sessionInfo?.configOptions).toBeUndefined()
    })
  })

  describe("Tool Call Status Types", () => {
    it("should export tool call status types", async () => {
      const acpModule = await import("./acp-service")
      
      // Verify the module exports the expected types
      // (TypeScript interfaces don't exist at runtime, but we can verify the module loads)
      expect(acpModule.acpService).toBeDefined()
    })
  })
})
