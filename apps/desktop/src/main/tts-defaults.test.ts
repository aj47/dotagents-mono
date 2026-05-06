import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getTipcSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "tipc.ts"), "utf8")
}

describe("desktop TTS defaults", () => {
  it("uses the shared enabled default for the desktop-local runtime gate", () => {
    const source = getTipcSource()

    expect(source).toContain("DEFAULT_TTS_ENABLED")
    expect(source).toContain("config.ttsEnabled ?? DEFAULT_TTS_ENABLED")
  })
})
