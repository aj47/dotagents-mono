/**
 * Trace lifecycle tests for langfuse-service.
 *
 * These tests run in local-trace-only mode (langfuse package mocked to null),
 * so they exercise the per-run trace id wiring, span/generation link maps,
 * and force-close semantics without needing a real Langfuse server.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"

let currentConfig: Record<string, unknown> = {}
let tempDir: string

vi.mock("./config", () => ({
  configStore: { get: () => currentConfig },
  get dataFolder() { return tempDir },
}))

vi.mock("./debug", () => ({
  isDebugLLM: () => false,
  logLLM: vi.fn(),
}))

vi.mock("./langfuse-loader", () => ({
  Langfuse: null,
  isInstalled: false,
}))

const readTraceFile = (traceId: string): Array<Record<string, unknown>> => {
  const tracePath = path.join(tempDir, "traces", `${traceId}.jsonl`)
  if (!fs.existsSync(tracePath)) return []
  const raw = fs.readFileSync(tracePath, "utf8").trim()
  if (!raw) return []
  return raw.split("\n").map((line) => JSON.parse(line))
}

describe("langfuse-service trace lifecycle", () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-langfuse-lifecycle-"))
    currentConfig = { localTraceLoggingEnabled: true, langfuseEnabled: false }
    vi.resetModules()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it("two consecutive runs in the same conversation produce two distinct trace files", async () => {
    const mod = await import("./langfuse-service")

    // Run A
    const traceA = "trace-run-A"
    mod.createAgentTrace(traceA, {
      name: "Agent Session",
      sessionId: "conv-1",
      metadata: { runId: 1, agentSessionId: "agent-sess-A", conversationId: "conv-1" },
      input: "first run",
    })
    mod.createLLMGeneration(traceA, "gen-A", {
      name: "LLM Call",
      model: "test-model",
      input: { messages: [] },
    })
    mod.endLLMGeneration("gen-A", { output: "first answer" })
    mod.endAgentTrace(traceA, { output: "done A" })

    // Run B in the same DotAgents session/conversation
    const traceB = "trace-run-B"
    mod.createAgentTrace(traceB, {
      name: "Agent Session",
      sessionId: "conv-1",
      metadata: { runId: 2, agentSessionId: "agent-sess-A", conversationId: "conv-1" },
      input: "second run",
    })
    mod.createLLMGeneration(traceB, "gen-B", {
      name: "LLM Call",
      model: "test-model",
      input: { messages: [] },
    })
    mod.endLLMGeneration("gen-B", { output: "second answer" })
    mod.endAgentTrace(traceB, { output: "done B" })

    await mod.flushLangfuse()

    const fileA = path.join(tempDir, "traces", `${traceA}.jsonl`)
    const fileB = path.join(tempDir, "traces", `${traceB}.jsonl`)
    expect(fs.existsSync(fileA)).toBe(true)
    expect(fs.existsSync(fileB)).toBe(true)

    const linesA = readTraceFile(traceA)
    const linesB = readTraceFile(traceB)

    const startEventsA = linesA.filter((line) => line.type === "trace.start")
    const endEventsA = linesA.filter((line) => line.type === "trace.end")
    expect(startEventsA).toHaveLength(1)
    expect(endEventsA).toHaveLength(1)

    const startEventsB = linesB.filter((line) => line.type === "trace.start")
    const endEventsB = linesB.filter((line) => line.type === "trace.end")
    expect(startEventsB).toHaveLength(1)
    expect(endEventsB).toHaveLength(1)

    // Both runs share the conversation as Langfuse sessionId.
    expect((startEventsA[0].metadata as any)?.sessionId).toBe("conv-1")
    expect((startEventsB[0].metadata as any)?.sessionId).toBe("conv-1")
  })

  it("forceCloseActiveTrace emits ERROR-level span.end and generation.end", async () => {
    const mod = await import("./langfuse-service")
    const traceId = "trace-X"

    mod.createAgentTrace(traceId, {
      name: "Agent Session",
      sessionId: "conv-X",
      input: "in",
    })
    mod.createToolSpan(traceId, "span-1", {
      name: "Tool: search",
      input: { q: "hello" },
    })
    mod.createLLMGeneration(traceId, "gen-1", {
      name: "LLM Call",
      model: "test-model",
      input: {},
    })

    mod.forceCloseActiveTrace(traceId, { statusMessage: "aborted", level: "ERROR" })

    // Calling endToolSpan again should be a no-op (no duplicate span.end line).
    mod.endToolSpan("span-1", { output: { ok: false } })

    mod.endAgentTrace(traceId, { output: "" })

    await mod.flushLangfuse()

    const lines = readTraceFile(traceId)
    const spanEnds = lines.filter((l) => l.type === "span.end" && l.spanId === "span-1")
    const genEnds = lines.filter((l) => l.type === "generation.end" && l.generationId === "gen-1")

    expect(spanEnds).toHaveLength(1)
    expect(spanEnds[0].level).toBe("ERROR")
    expect(spanEnds[0].statusMessage).toBe("aborted")

    expect(genEnds).toHaveLength(1)
    expect(genEnds[0].level).toBe("ERROR")
    expect(genEnds[0].statusMessage).toBe("aborted")
  })

  it("trace metadata preservation: per-run + agent-session + conversation + profile info round-trip", async () => {
    const mod = await import("./langfuse-service")
    const traceId = "trace-meta-test"

    mod.createAgentTrace(traceId, {
      name: "Agent",
      sessionId: "conv-X",
      metadata: {
        agentSessionId: "s1",
        runId: 5,
        conversationId: "conv-X",
        profileId: "p1",
        profileName: "Profile One",
      },
    })
    mod.endAgentTrace(traceId, { output: "" })

    await mod.flushLangfuse()

    const lines = readTraceFile(traceId)
    const start = lines.find((l) => l.type === "trace.start")
    expect(start).toBeDefined()
    const metadata = start!.metadata as Record<string, unknown>
    expect(metadata.agentSessionId).toBe("s1")
    expect(metadata.runId).toBe(5)
    expect(metadata.conversationId).toBe("conv-X")
    expect(metadata.profileId).toBe("p1")
    expect(metadata.profileName).toBe("Profile One")
    // The Langfuse sessionId (group key) should be propagated too.
    expect(metadata.sessionId).toBe("conv-X")
  })

  it("shutdownLangfuse force-closes active spans and generations with ERROR level", async () => {
    const mod = await import("./langfuse-service")
    const traceId = "trace-shutdown"

    mod.createAgentTrace(traceId, {
      name: "Agent Session",
      sessionId: "conv-shutdown",
      input: "in",
    })
    mod.createToolSpan(traceId, "span-sd", {
      name: "Tool: search",
      input: {},
    })
    mod.createLLMGeneration(traceId, "gen-sd", {
      name: "LLM Call",
      model: "test-model",
      input: {},
    })

    await mod.shutdownLangfuse()

    const lines = readTraceFile(traceId)
    const spanEnd = lines.find((l) => l.type === "span.end" && l.spanId === "span-sd")
    const genEnd = lines.find((l) => l.type === "generation.end" && l.generationId === "gen-sd")

    expect(spanEnd).toBeDefined()
    expect(spanEnd!.level).toBe("ERROR")
    expect(spanEnd!.statusMessage).toBe("App shutdown")

    expect(genEnd).toBeDefined()
    expect(genEnd!.level).toBe("ERROR")
    expect(genEnd!.statusMessage).toBe("App shutdown")
  })
})
