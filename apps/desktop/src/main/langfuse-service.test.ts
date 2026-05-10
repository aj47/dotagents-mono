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

describe("langfuse-service local tracing", () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-langfuse-trace-"))
    currentConfig = {}
    vi.resetModules()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it("runs trace instrumentation when only local trace logging is enabled", async () => {
    currentConfig = { localTraceLoggingEnabled: true, langfuseEnabled: false }

    const mod = await import("./langfuse-service")

    expect(mod.isLangfuseEnabled()).toBe(false)
    expect(mod.isTracingEnabled()).toBe(true)

    mod.createAgentTrace("session_local_only", {
      name: "Agent Session",
      sessionId: "conv_local_only",
      input: "hello",
    })

    await mod.flushLangfuse()

    const tracePath = path.join(tempDir, "traces", "session_local_only.jsonl")
    expect(fs.existsSync(tracePath)).toBe(true)

    const line = JSON.parse(fs.readFileSync(tracePath, "utf8").trim())
    expect(line.type).toBe("trace.start")
    expect(line.traceId).toBe("session_local_only")
    expect(line.metadata.sessionId).toBe("conv_local_only")
  })
})