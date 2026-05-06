import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getMainSource(fileName: string): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, fileName), "utf8")
}

describe("main transcript post-processing defaults", () => {
  it("uses the shared transcript post-processing default", () => {
    const llmSource = getMainSource("llm.ts")
    const tipcSource = getMainSource("tipc.ts")

    expect(llmSource).toContain("transcriptPostProcessingEnabled ?? DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED")
    expect(tipcSource).toContain("transcriptPostProcessingEnabled ?? DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED")
  })
})
