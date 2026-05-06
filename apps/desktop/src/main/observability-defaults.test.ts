import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getMainSource(fileName: string): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, fileName), "utf8")
}

describe("main observability defaults", () => {
  it("uses shared observability defaults", () => {
    const langfuseSource = getMainSource("langfuse-service.ts")
    const localTraceSource = getMainSource("local-trace-logger.ts")

    expect(langfuseSource).toContain("config.langfuseEnabled ?? DEFAULT_LANGFUSE_ENABLED")
    expect(localTraceSource).toContain("config.localTraceLoggingEnabled ?? DEFAULT_LOCAL_TRACE_LOGGING_ENABLED")
  })
})
