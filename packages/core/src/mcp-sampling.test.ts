import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock dependencies before imports
vi.mock("./diagnostics", () => ({
  diagnosticsService: {
    logInfo: vi.fn(),
    logWarning: vi.fn(),
    logError: vi.fn(),
  },
}))

vi.mock("./config", () => ({
  configStore: {
    get: vi.fn(() => ({
      mcpRequireApprovalBeforeToolCall: false,
      mcpToolsProviderId: "openai",
      mcpToolsOpenaiModel: "gpt-4.1-mini",
    })),
    save: vi.fn(),
  },
  getDataFolder: vi.fn(() => "/tmp"),
  getConfigStore: vi.fn(),
  trySaveConfig: vi.fn(),
}))

vi.mock("./llm-fetch", () => ({
  makeLLMCallWithFetch: vi.fn(async () => ({
    content: "Hello from LLM",
  })),
}))

import {
  requestSampling,
  resolveSampling,
  cancelAllSamplingRequests,
  setSamplingProgressEmitter,
} from "./mcp-sampling"
import type { SamplingRequest } from "./types"

describe("mcp-sampling", () => {
  const mockProgressEmitter = {
    emitAgentProgress: vi.fn(),
    emitSessionUpdate: vi.fn(),
    emitQueueUpdate: vi.fn(),
    emitEvent: vi.fn(),
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    setSamplingProgressEmitter(mockProgressEmitter)
    cancelAllSamplingRequests()
  })

  afterEach(() => {
    vi.useRealTimers()
    cancelAllSamplingRequests()
  })

  it("auto-approves and executes sampling when tool approval is not required", async () => {
    const request: SamplingRequest = {
      serverName: "test-server",
      requestId: "sample-1",
      messages: [{ role: "user", content: { type: "text", text: "Hello" } }],
      maxTokens: 100,
    }

    const result = await requestSampling(request)
    expect(result.approved).toBe(true)
    expect(result.content?.text).toBe("Hello from LLM")
    expect(result.stopReason).toBe("endTurn")
  })

  it("sends to UI for approval when tool approval is required", async () => {
    const { configStore } = await import("./config")
    vi.mocked(configStore.get).mockReturnValueOnce({
      mcpRequireApprovalBeforeToolCall: true,
      mcpToolsProviderId: "openai",
      mcpToolsOpenaiModel: "gpt-4.1-mini",
    })

    const request: SamplingRequest = {
      serverName: "test-server",
      requestId: "sample-2",
      messages: [{ role: "user", content: { type: "text", text: "Hello" } }],
      maxTokens: 100,
    }

    const promise = requestSampling(request)
    expect(mockProgressEmitter.emitEvent).toHaveBeenCalledWith("mcp:sampling-request", request)

    // Resolve with approval
    await resolveSampling("sample-2", true)
    const result = await promise
    expect(result.approved).toBe(true)
  })

  it("returns not approved when denied", async () => {
    const { configStore } = await import("./config")
    vi.mocked(configStore.get).mockReturnValueOnce({
      mcpRequireApprovalBeforeToolCall: true,
    })

    const request: SamplingRequest = {
      serverName: "test-server",
      requestId: "sample-3",
      messages: [{ role: "user", content: { type: "text", text: "Hello" } }],
      maxTokens: 100,
    }

    const promise = requestSampling(request)

    await resolveSampling("sample-3", false)
    const result = await promise
    expect(result.approved).toBe(false)
  })

  it("cancels sampling by server name", async () => {
    const { configStore } = await import("./config")
    vi.mocked(configStore.get).mockReturnValue({
      mcpRequireApprovalBeforeToolCall: true,
    })

    const request: SamplingRequest = {
      serverName: "server-a",
      requestId: "sample-4",
      messages: [{ role: "user", content: { type: "text", text: "Hello" } }],
      maxTokens: 100,
    }

    const promise = requestSampling(request)
    cancelAllSamplingRequests("server-a")

    const result = await promise
    expect(result.approved).toBe(false)
  })

  it("returns false for resolving non-existent sampling", async () => {
    const result = await resolveSampling("non-existent", true)
    expect(result).toBe(false)
  })
})
