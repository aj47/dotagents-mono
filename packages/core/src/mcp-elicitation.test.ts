import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock dependencies before imports
vi.mock("./diagnostics", () => ({
  diagnosticsService: {
    logInfo: vi.fn(),
    logWarning: vi.fn(),
    logError: vi.fn(),
  },
}))

import {
  requestElicitation,
  resolveElicitation,
  handleElicitationComplete,
  cancelAllElicitations,
  getPendingElicitationCount,
  setElicitationUserInteraction,
  setElicitationProgressEmitter,
} from "./mcp-elicitation"
import type { ElicitationRequest, ElicitationFormRequest, ElicitationUrlRequest } from "./types"

describe("mcp-elicitation", () => {
  const mockProgressEmitter = {
    emitAgentProgress: vi.fn(),
    emitSessionUpdate: vi.fn(),
    emitQueueUpdate: vi.fn(),
    emitEvent: vi.fn(),
  }

  const mockUserInteraction = {
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    pickFile: vi.fn(),
    saveFile: vi.fn(),
    requestApproval: vi.fn(),
    openExternal: vi.fn(),
    confirm: vi.fn(),
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    setElicitationProgressEmitter(mockProgressEmitter)
    setElicitationUserInteraction(mockUserInteraction)
    // Cancel any leftover
    cancelAllElicitations()
  })

  afterEach(() => {
    vi.useRealTimers()
    cancelAllElicitations()
  })

  it("resolves a form elicitation when resolveElicitation is called", async () => {
    const request: ElicitationFormRequest = {
      mode: "form",
      serverName: "test-server",
      message: "Enter details",
      requestedSchema: { type: "object", properties: {}, required: [] },
      requestId: "elicit-1",
    }

    const promise = requestElicitation(request)

    expect(mockProgressEmitter.emitEvent).toHaveBeenCalledWith("mcp:elicitation-request", request)
    expect(getPendingElicitationCount()).toBe(1)

    resolveElicitation("elicit-1", { action: "accept", content: { name: "test" } })

    const result = await promise
    expect(result.action).toBe("accept")
    expect(result.content).toEqual({ name: "test" })
    expect(getPendingElicitationCount()).toBe(0)
  })

  it("opens URL for url mode elicitations", async () => {
    const request: ElicitationUrlRequest = {
      mode: "url",
      serverName: "test-server",
      message: "Open URL",
      url: "https://example.com/auth",
      elicitationId: "url-elicit-1",
      requestId: "elicit-2",
    }

    const promise = requestElicitation(request)

    expect(mockUserInteraction.openExternal).toHaveBeenCalledWith("https://example.com/auth")
    expect(mockProgressEmitter.emitEvent).toHaveBeenCalledWith("mcp:elicitation-request", request)

    resolveElicitation("elicit-2", { action: "accept" })
    const result = await promise
    expect(result.action).toBe("accept")
  })

  it("auto-resolves URL elicitation on handleElicitationComplete", async () => {
    const request: ElicitationUrlRequest = {
      mode: "url",
      serverName: "test-server",
      message: "Open URL",
      url: "https://example.com/auth",
      elicitationId: "url-complete-1",
      requestId: "elicit-3",
    }

    const promise = requestElicitation(request)
    handleElicitationComplete("url-complete-1")

    const result = await promise
    expect(result.action).toBe("accept")
    expect(getPendingElicitationCount()).toBe(0)
  })

  it("returns false when resolving non-existent elicitation", () => {
    const result = resolveElicitation("non-existent", { action: "cancel" })
    expect(result).toBe(false)
  })

  it("cancels elicitations by server name", async () => {
    const request1: ElicitationFormRequest = {
      mode: "form",
      serverName: "server-a",
      message: "Test",
      requestedSchema: { type: "object", properties: {}, required: [] },
      requestId: "elicit-4a",
    }
    const request2: ElicitationFormRequest = {
      mode: "form",
      serverName: "server-b",
      message: "Test",
      requestedSchema: { type: "object", properties: {}, required: [] },
      requestId: "elicit-4b",
    }

    const promise1 = requestElicitation(request1)
    const promise2 = requestElicitation(request2)

    cancelAllElicitations("server-a")

    const result1 = await promise1
    expect(result1.action).toBe("cancel")

    // server-b should still be pending
    expect(getPendingElicitationCount()).toBe(1)
    resolveElicitation("elicit-4b", { action: "accept" })
    const result2 = await promise2
    expect(result2.action).toBe("accept")
  })

  it("times out and cancels after timeout period", async () => {
    const request: ElicitationFormRequest = {
      mode: "form",
      serverName: "test-server",
      message: "Test",
      requestedSchema: { type: "object", properties: {}, required: [] },
      requestId: "elicit-timeout",
    }

    const promise = requestElicitation(request)

    // Advance past the 5-minute timeout
    vi.advanceTimersByTime(5 * 60 * 1000 + 1)

    const result = await promise
    expect(result.action).toBe("cancel")
    expect(getPendingElicitationCount()).toBe(0)
  })
})
