import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"

/**
 * Per-run Langfuse trace identity tests (issue #441).
 *
 * Verifies that:
 * 1. `makeLangfuseTraceId` is stable per (sessionId, runId) and changes per run.
 * 2. Two consecutive runs of the same DotAgents agent session produce two
 *    distinct local trace files, not one reused trace bucket.
 * 3. `forceCloseTraceOperations` emits matching `span.end`/`generation.end`
 *    events with ERROR level for any operation still open at finalize time.
 * 4. `setActiveRunTrace`/`getActiveRunTrace` round-trip per session and clear
 *    only when the caller's trace ID still owns the slot (race-safe).
 * 5. Local trace logging works even when remote Langfuse upload is disabled.
 */

let currentConfig: {
  langfuseEnabled?: boolean
  langfuseSecretKey?: string
  langfusePublicKey?: string
  langfuseBaseUrl?: string
  localTraceLoggingEnabled?: boolean
  localTraceLogPath?: string
} = {}
let tempDir: string

vi.mock("./config", () => ({
  configStore: { get: () => currentConfig },
  get dataFolder() { return tempDir },
}))
vi.mock("./debug", () => ({
  isDebugLLM: () => false,
  logLLM: vi.fn(),
}))
// Avoid loading the optional langfuse package in tests; force not-installed.
vi.mock("./langfuse-loader", () => ({
  Langfuse: null,
  isInstalled: false,
  // Types are erased at runtime; placeholders are unused.
  LangfuseInstance: null,
  LangfuseTraceClient: null,
  LangfuseSpanClient: null,
  LangfuseGenerationClient: null,
}))

describe("langfuse-service per-run trace identity (#441)", () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-langfuse-"))
    currentConfig = { localTraceLoggingEnabled: true }
    vi.resetModules()
  })

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {
      // best-effort cleanup
    }
  })

  it("derives stable per-run trace IDs that differ across runs", async () => {
    const { makeLangfuseTraceId } = await import("./langfuse-service")
    const t1 = makeLangfuseTraceId({ agentSessionId: "session_abc", runId: 1 })
    const t1Again = makeLangfuseTraceId({ agentSessionId: "session_abc", runId: 1 })
    const t2 = makeLangfuseTraceId({ agentSessionId: "session_abc", runId: 2 })

    expect(t1).toBe(t1Again)
    expect(t1).not.toBe(t2)
    expect(t1).toContain("session_abc")
    expect(t1).toContain("run_1")
    expect(t2).toContain("run_2")
  })

  it("writes separate local trace files for two runs of the same agent session", async () => {
    const { makeLangfuseTraceId, createAgentTrace, endAgentTrace } = await import(
      "./langfuse-service"
    )
    const { flushLocalTraceLogger } = await import("./local-trace-logger")

    const agentSessionId = "session_xyz"
    const conversationId = "conv_123"

    const traceA = makeLangfuseTraceId({ agentSessionId, runId: 1 })
    createAgentTrace(traceA, { name: "Run A", sessionId: conversationId })
    endAgentTrace(traceA, { output: "done A" })

    const traceB = makeLangfuseTraceId({ agentSessionId, runId: 2 })
    createAgentTrace(traceB, { name: "Run B", sessionId: conversationId })
    endAgentTrace(traceB, { output: "done B" })

    await flushLocalTraceLogger()

    const fileA = path.join(tempDir, "traces", `${traceA}.jsonl`)
    const fileB = path.join(tempDir, "traces", `${traceB}.jsonl`)

    expect(fs.existsSync(fileA)).toBe(true)
    expect(fs.existsSync(fileB)).toBe(true)

    const linesA = fs.readFileSync(fileA, "utf8").trim().split("\n").map(JSON.parse)
    const linesB = fs.readFileSync(fileB, "utf8").trim().split("\n").map(JSON.parse)

    // Each per-run file should contain exactly one trace.start and one trace.end —
    // no reused-bucket pollution.
    expect(linesA.filter((l) => l.type === "trace.start")).toHaveLength(1)
    expect(linesA.filter((l) => l.type === "trace.end")).toHaveLength(1)
    expect(linesB.filter((l) => l.type === "trace.start")).toHaveLength(1)
    expect(linesB.filter((l) => l.type === "trace.end")).toHaveLength(1)

    // The Langfuse session ID (conversation) should be carried in metadata so
    // remote Langfuse can group the two runs under one Sessions view entry.
    expect(linesA[0].metadata.sessionId).toBe(conversationId)
    expect(linesB[0].metadata.sessionId).toBe(conversationId)
  })

  it("force-closes still-open spans and generations with ERROR level", async () => {
    const {
      createAgentTrace,
      endAgentTrace,
      createToolSpan,
      createLLMGeneration,
      forceCloseTraceOperations,
    } = await import("./langfuse-service")
    const { flushLocalTraceLogger } = await import("./local-trace-logger")

    const traceId = "trace_run_force_close"

    createAgentTrace(traceId, { name: "Agent" })
    createToolSpan(traceId, "span_1", { name: "Tool: search" })
    createLLMGeneration(traceId, "gen_1", {
      name: "LLM Call",
      model: "test-model",
      input: "hi",
    })

    const closed = forceCloseTraceOperations(traceId, {
      level: "ERROR",
      statusMessage: "Run aborted",
    })
    expect(closed.closedSpans).toBe(1)
    expect(closed.closedGenerations).toBe(1)

    endAgentTrace(traceId, { output: undefined, metadata: { wasAborted: true } })
    await flushLocalTraceLogger()

    const filePath = path.join(tempDir, "traces", `${traceId}.jsonl`)
    const lines = fs.readFileSync(filePath, "utf8").trim().split("\n").map(JSON.parse)

    const spanEnds = lines.filter((l) => l.type === "span.end")
    const genEnds = lines.filter((l) => l.type === "generation.end")
    const traceEnds = lines.filter((l) => l.type === "trace.end")

    expect(spanEnds).toHaveLength(1)
    expect(genEnds).toHaveLength(1)
    expect(traceEnds).toHaveLength(1)
    expect(spanEnds[0].level).toBe("ERROR")
    expect(spanEnds[0].statusMessage).toBe("Run aborted")
    expect(genEnds[0].level).toBe("ERROR")
    expect(traceEnds[0].metadata.wasAborted).toBe(true)
  })

  it("force-close after explicit end is a no-op for already-closed observations", async () => {
    const {
      createAgentTrace,
      endAgentTrace,
      createToolSpan,
      endToolSpan,
      forceCloseTraceOperations,
    } = await import("./langfuse-service")
    const { flushLocalTraceLogger } = await import("./local-trace-logger")

    const traceId = "trace_run_clean"
    createAgentTrace(traceId, { name: "Agent" })
    createToolSpan(traceId, "span_ok", { name: "Tool: ok" })
    endToolSpan("span_ok", { output: "result" })

    const closed = forceCloseTraceOperations(traceId)
    expect(closed.closedSpans).toBe(0)
    expect(closed.closedGenerations).toBe(0)

    endAgentTrace(traceId, { output: "done" })
    await flushLocalTraceLogger()

    const filePath = path.join(tempDir, "traces", `${traceId}.jsonl`)
    const lines = fs.readFileSync(filePath, "utf8").trim().split("\n").map(JSON.parse)

    // span.start + span.end + trace.start + trace.end = 4 events, no extras
    expect(lines.filter((l) => l.type === "span.end")).toHaveLength(1)
  })

  it("active run trace round-trips per session and clears race-safely", async () => {
    const { setActiveRunTrace, getActiveRunTrace, clearActiveRunTrace } = await import(
      "./langfuse-service"
    )

    setActiveRunTrace("session_a", "trace_run_1")
    expect(getActiveRunTrace("session_a")).toBe("trace_run_1")

    // A newer run claims the slot.
    setActiveRunTrace("session_a", "trace_run_2")
    expect(getActiveRunTrace("session_a")).toBe("trace_run_2")

    // Late finalizer for run 1 must not wipe the active run 2 entry.
    clearActiveRunTrace("session_a", "trace_run_1")
    expect(getActiveRunTrace("session_a")).toBe("trace_run_2")

    // Run 2 finalizes properly.
    clearActiveRunTrace("session_a", "trace_run_2")
    expect(getActiveRunTrace("session_a")).toBeUndefined()
  })

  it("shouldRecordObservations is true when local tracing is on even if remote langfuse is off", async () => {
    const { shouldRecordObservations, isLangfuseEnabled } = await import(
      "./langfuse-service"
    )
    currentConfig = { localTraceLoggingEnabled: true, langfuseEnabled: false }
    expect(isLangfuseEnabled()).toBe(false)
    expect(shouldRecordObservations()).toBe(true)
  })

  it("shouldRecordObservations is false when both remote and local tracing are off", async () => {
    const { shouldRecordObservations } = await import("./langfuse-service")
    currentConfig = { localTraceLoggingEnabled: false, langfuseEnabled: false }
    expect(shouldRecordObservations()).toBe(false)
  })
})
