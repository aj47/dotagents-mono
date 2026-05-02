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

    const expected = path.join(tempDir, "traces", "traces.jsonl")
    expect(fs.existsSync(expected)).toBe(false)
  })

  it("appends JSONL lines to the default path when enabled", async () => {
    const mod = await import("./local-trace-logger")
    currentConfig = { localTraceLoggingEnabled: true }

    mod.appendLocalTraceEvent({ type: "trace.start", traceId: "t1", name: "Agent" })
    mod.appendLocalTraceEvent({
      type: "generation.end",
      generationId: "g1",
      output: "hello",
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    })

    const expected = path.join(tempDir, "traces", "traces.jsonl")
    expect(fs.existsSync(expected)).toBe(true)

    const lines = fs.readFileSync(expected, "utf8").trim().split("\n")
    expect(lines).toHaveLength(2)

    const first = JSON.parse(lines[0])
    expect(first.type).toBe("trace.start")
    expect(first.traceId).toBe("t1")
    expect(typeof first.timestamp).toBe("string")

    const second = JSON.parse(lines[1])
    expect(second.type).toBe("generation.end")
    expect(second.usage.totalTokens).toBe(15)
  })

  it("honours a custom localTraceLogPath", async () => {
    const customPath = path.join(tempDir, "custom", "agent-traces.jsonl")
    currentConfig = { localTraceLoggingEnabled: true, localTraceLogPath: customPath }

    const mod = await import("./local-trace-logger")
    mod.resetLocalTraceLogger()
    mod.appendLocalTraceEvent({ type: "span.start", spanId: "s1", name: "tool" })

    expect(fs.existsSync(customPath)).toBe(true)
    const line = JSON.parse(fs.readFileSync(customPath, "utf8").trim())
    expect(line.type).toBe("span.start")
    expect(line.spanId).toBe("s1")
  })
})
