import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsGeneralSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-general.tsx"), "utf8")
}

describe("settings general transcript defaults", () => {
  it("uses the shared transcript post-processing default", () => {
    const source = getSettingsGeneralSource()

    expect(source).toContain("DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED")
    expect(source).toContain("transcriptPostProcessingEnabled ?? DEFAULT_TRANSCRIPT_POST_PROCESSING_ENABLED")
    expect(source).toContain("DEFAULT_TRANSCRIPTION_PREVIEW_ENABLED")
    expect(source).toContain("transcriptionPreviewEnabled ?? DEFAULT_TRANSCRIPTION_PREVIEW_ENABLED")
  })
})
