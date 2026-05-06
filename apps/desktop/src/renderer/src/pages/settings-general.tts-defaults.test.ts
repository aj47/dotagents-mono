import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsGeneralSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-general.tsx"), "utf8")
}

describe("settings general TTS defaults", () => {
  it("uses the shared TTS boolean defaults", () => {
    const source = getSettingsGeneralSource()

    expect(source).toContain("DEFAULT_TTS_ENABLED")
    expect(source).toContain("DEFAULT_TTS_AUTO_PLAY")
    expect(source).toContain("DEFAULT_TTS_PREPROCESSING_ENABLED")
    expect(source).toContain("DEFAULT_TTS_REMOVE_CODE_BLOCKS")
    expect(source).toContain("DEFAULT_TTS_REMOVE_URLS")
    expect(source).toContain("DEFAULT_TTS_CONVERT_MARKDOWN")
    expect(source).toContain("DEFAULT_TTS_USE_LLM_PREPROCESSING")
    expect(source).toContain("ttsEnabled ?? DEFAULT_TTS_ENABLED")
    expect(source).toContain("ttsPreprocessingEnabled ?? DEFAULT_TTS_PREPROCESSING_ENABLED")
  })
})
