import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"

let currentConfig: { localTraceLoggingEnabled?: boolean; localTraceLogPath?: string } = {}
let tempDir: string

vi.mock("./config", () => ({
  configStore: { get: () => currentConfig },
  get dataFolder() { return tempDir },
}))
vi.mock("./debug", () => ({
  isDebugLLM: () => false,
  logLLM: vi.fn(),
}))

describe("local-trace-logger", () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-trace-"))
    currentConfig = {}
    vi.resetModules()
  })

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch {
      // best-effort cleanup
    }
  })

  it("is a no-op when local logging is disabled", async () => {
    const mod = await import("./local-trace-logger")
    currentConfig = { localTraceLoggingEnabled: false }

    expect(mod.isLocalTraceLoggingEnabled()).toBe(false)
    mod.appendLocalTraceEvent({ type: "trace.start", traceId: "t1", name: "Agent" })

    const expected = path.join(tempDir, "traces", "t1.jsonl")
    expect(fs.existsSync(expected)).toBe(false)
  })

  it("appends JSONL lines to a per-session default path when enabled", async () => {
    const mod = await import("./local-trace-logger")
    currentConfig = { localTraceLoggingEnabled: true }

    mod.appendLocalTraceEvent({ type: "trace.start", traceId: "t1", name: "Agent" })
    mod.appendLocalTraceEvent({
      type: "generation.start",
      traceId: "t1",
      generationId: "g1",
      name: "LLM",
      model: "test-model",
      input: "hello",
    })
    mod.appendLocalTraceEvent({
      type: "generation.end",
      generationId: "g1",
      output: "hello",
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    })
    await mod.flushLocalTraceLogger()

    const expected = path.join(tempDir, "traces", "t1.jsonl")
    expect(fs.existsSync(expected)).toBe(true)

    const lines = fs.readFileSync(expected, "utf8").trim().split("\n")
    expect(lines).toHaveLength(3)

    const first = JSON.parse(lines[0])
    expect(first.type).toBe("trace.start")
    expect(first.traceId).toBe("t1")
    expect(typeof first.timestamp).toBe("string")

    const third = JSON.parse(lines[2])
    expect(third.type).toBe("generation.end")
    expect(third.traceId).toBe("t1")
    expect(third.usage.totalTokens).toBe(15)
  })

  it("writes separate files for separate trace IDs", async () => {
    const mod = await import("./local-trace-logger")
    currentConfig = { localTraceLoggingEnabled: true }

    mod.appendLocalTraceEvent({ type: "trace.start", traceId: "session/one", name: "One" })
    mod.appendLocalTraceEvent({ type: "trace.start", traceId: "session:two", name: "Two" })
    await mod.flushLocalTraceLogger()

    const firstPath = path.join(tempDir, "traces", "session_one.jsonl")
    const secondPath = path.join(tempDir, "traces", "session_two.jsonl")

    expect(fs.existsSync(firstPath)).toBe(true)
    expect(fs.existsSync(secondPath)).toBe(true)
    expect(JSON.parse(fs.readFileSync(firstPath, "utf8").trim()).name).toBe("One")
    expect(JSON.parse(fs.readFileSync(secondPath, "utf8").trim()).name).toBe("Two")
  })

  it("honours a custom localTraceLogPath as a trace directory", async () => {
    const customPath = path.join(tempDir, "custom")
    currentConfig = { localTraceLoggingEnabled: true, localTraceLogPath: customPath }

    const mod = await import("./local-trace-logger")
    mod.resetLocalTraceLogger()
    mod.appendLocalTraceEvent({ type: "span.start", traceId: "t1", spanId: "s1", name: "tool" })
    await mod.flushLocalTraceLogger()

    const expected = path.join(customPath, "t1.jsonl")
    expect(fs.existsSync(expected)).toBe(true)
    const line = JSON.parse(fs.readFileSync(expected, "utf8").trim())
    expect(line.type).toBe("span.start")
    expect(line.traceId).toBe("t1")
    expect(line.spanId).toBe("s1")
  })

  it("uses the parent directory when custom localTraceLogPath is a legacy jsonl file path", async () => {
    const legacyFilePath = path.join(tempDir, "custom", "agent-traces.jsonl")
    currentConfig = { localTraceLoggingEnabled: true, localTraceLogPath: legacyFilePath }

    const mod = await import("./local-trace-logger")
    mod.resetLocalTraceLogger()
    mod.appendLocalTraceEvent({ type: "trace.start", traceId: "t1", name: "Agent" })
    await mod.flushLocalTraceLogger()

    expect(fs.existsSync(path.join(tempDir, "custom", "t1.jsonl"))).toBe(true)
    expect(fs.existsSync(legacyFilePath)).toBe(false)
  })

  it("uses an updated custom path after reset", async () => {
    const firstPath = path.join(tempDir, "first")
    const secondPath = path.join(tempDir, "second")
    currentConfig = { localTraceLoggingEnabled: true, localTraceLogPath: firstPath }

    const mod = await import("./local-trace-logger")
    mod.appendLocalTraceEvent({ type: "trace.start", traceId: "t1", name: "First" })
    await mod.flushLocalTraceLogger()

    currentConfig = { localTraceLoggingEnabled: true, localTraceLogPath: secondPath }
    mod.resetLocalTraceLogger()
    mod.appendLocalTraceEvent({ type: "trace.start", traceId: "t2", name: "Second" })
    await mod.flushLocalTraceLogger()

    expect(fs.existsSync(path.join(firstPath, "t1.jsonl"))).toBe(true)
    expect(fs.existsSync(path.join(secondPath, "t2.jsonl"))).toBe(true)
    expect(fs.existsSync(path.join(firstPath, "t2.jsonl"))).toBe(false)
  })

  it("recreates the trace directory if it is deleted while running", async () => {
    const mod = await import("./local-trace-logger")
    currentConfig = { localTraceLoggingEnabled: true }

    mod.appendLocalTraceEvent({ type: "trace.start", traceId: "t1", name: "Agent" })
    await mod.flushLocalTraceLogger()

    const tracesDir = path.join(tempDir, "traces")
    fs.rmSync(tracesDir, { recursive: true, force: true })

    mod.appendLocalTraceEvent({ type: "trace.end", traceId: "t1", output: "done" })
    await mod.flushLocalTraceLogger()

    const expected = path.join(tracesDir, "t1.jsonl")
    expect(fs.existsSync(expected)).toBe(true)
    const line = JSON.parse(fs.readFileSync(expected, "utf8").trim())
    expect(line.type).toBe("trace.end")
    expect(line.output).toBe("done")
  })
})
