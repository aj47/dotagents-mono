import { describe, expect, it, vi } from "vitest"

vi.mock("./llm", () => ({
  processTranscriptWithAgentMode: vi.fn(),
}))

vi.mock("./mcp-service", () => ({
  mcpService: {},
}))

import { AgentRuntime, type AgentRuntimeToolService } from "./agent-runtime"
import type { MCPToolCall, MCPToolResult } from "./mcp-service"

function createToolService(overrides: Partial<AgentRuntimeToolService> = {}): AgentRuntimeToolService {
  return {
    initialize: vi.fn(async () => {}),
    registerExistingProcessesWithAgentManager: vi.fn(),
    getAvailableTools: vi.fn(() => [{ name: "global_tool", description: "", inputSchema: {} }]),
    getAvailableToolsForProfile: vi.fn(() => [{ name: "profile_tool", description: "", inputSchema: {} }]),
    executeToolCall: vi.fn(async () => ({
      content: [{ type: "text" as const, text: "tool result" }],
      isError: false,
    })),
    ...overrides,
  }
}

describe("AgentRuntime", () => {
  it("initializes tools, selects profile-filtered tools, and delegates to the existing loop", async () => {
    const toolService = createToolService()
    const runAgentLoop = vi.fn(async (
      transcript: string,
      availableTools: any[],
      executeToolCall: (toolCall: MCPToolCall) => Promise<MCPToolResult>,
      maxIterations?: number,
      _previousHistory?: unknown,
      conversationId?: string,
      sessionId?: string,
    ) => {
      const toolResult = await executeToolCall({ name: "profile_tool", arguments: { ok: true } })

      expect(transcript).toBe("hello")
      expect(availableTools).toEqual([{ name: "profile_tool", description: "", inputSchema: {} }])
      expect(toolResult.content[0].text).toBe("tool result")
      expect(maxIterations).toBe(3)
      expect(conversationId).toBe("conv-1")
      expect(sessionId).toBe("session-1")

      return { content: "done", conversationHistory: [], totalIterations: 1 }
    })

    const runtime = new AgentRuntime({ toolService, runAgentLoop: runAgentLoop as any })
    const profileSnapshot = { mcpServerConfig: { enabledServers: ["profile-server"] } } as any

    const result = await runtime.runAgentTurn({
      transcript: "hello",
      maxIterations: 3,
      conversationId: "conv-1",
      sessionId: "session-1",
      profileSnapshot,
    })

    expect(toolService.initialize).toHaveBeenCalledTimes(1)
    expect(toolService.registerExistingProcessesWithAgentManager).toHaveBeenCalledTimes(1)
    expect(toolService.getAvailableToolsForProfile).toHaveBeenCalledWith(profileSnapshot.mcpServerConfig)
    expect(toolService.executeToolCall).toHaveBeenCalledWith(
      { name: "profile_tool", arguments: { ok: true } },
      undefined,
      false,
      "session-1",
      profileSnapshot.mcpServerConfig,
    )
    expect(result.content).toBe("done")
  })

  it("allows hooks to short-circuit or observe tool execution", async () => {
    const toolService = createToolService()
    const afterExecuteToolCall = vi.fn()
    const runAgentLoop = vi.fn(async (_transcript, _tools, executeToolCall) => {
      const result = await executeToolCall({ name: "blocked_tool", arguments: {} })
      return { content: result.content[0].text, conversationHistory: [], totalIterations: 1 }
    })

    const runtime = new AgentRuntime({ toolService, runAgentLoop: runAgentLoop as any })
    const result = await runtime.runAgentTurn({
      transcript: "hello",
      initializeMcp: false,
      registerExistingProcesses: false,
      beforeExecuteToolCall: () => ({
        content: [{ type: "text", text: "blocked" }],
        isError: true,
      }),
      afterExecuteToolCall,
    })

    expect(toolService.initialize).not.toHaveBeenCalled()
    expect(toolService.registerExistingProcessesWithAgentManager).not.toHaveBeenCalled()
    expect(toolService.executeToolCall).not.toHaveBeenCalled()
    expect(afterExecuteToolCall).not.toHaveBeenCalled()
    expect(result.content).toBe("blocked")
  })

  it("uses a stored session profile snapshot for tools and agent loop when resuming", async () => {
    const toolService = createToolService()
    const passedProfileSnapshot = { mcpServerConfig: { enabledServers: ["passed-server"] } } as any
    const storedProfileSnapshot = { mcpServerConfig: { enabledServers: ["stored-server"] } } as any
    const getSessionProfileSnapshot = vi.fn(() => storedProfileSnapshot)
    const runAgentLoop = vi.fn(async (
      _transcript,
      _availableTools,
      executeToolCall: (toolCall: MCPToolCall) => Promise<MCPToolResult>,
    ) => {
      await executeToolCall({ name: "profile_tool", arguments: {} })
      return { content: "done", conversationHistory: [], totalIterations: 1 }
    })

    const runtime = new AgentRuntime({
      toolService,
      runAgentLoop: runAgentLoop as any,
      getSessionProfileSnapshot,
    })

    await runtime.runAgentTurn({
      transcript: "resume",
      sessionId: "session-1",
      profileSnapshot: passedProfileSnapshot,
    })

    expect(getSessionProfileSnapshot).toHaveBeenCalledWith("session-1")
    expect(toolService.getAvailableToolsForProfile).toHaveBeenCalledWith(
      storedProfileSnapshot.mcpServerConfig,
    )
    expect(toolService.executeToolCall).toHaveBeenCalledWith(
      { name: "profile_tool", arguments: {} },
      undefined,
      false,
      "session-1",
      storedProfileSnapshot.mcpServerConfig,
    )
    expect(runAgentLoop).toHaveBeenCalledWith(
      "resume",
      [{ name: "profile_tool", description: "", inputSchema: {} }],
      expect.any(Function),
      undefined,
      undefined,
      undefined,
      "session-1",
      undefined,
      storedProfileSnapshot,
      undefined,
      undefined,
    )
  })
})
