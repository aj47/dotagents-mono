import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsGeneralSource = readFileSync(new URL("./settings-general.tsx", import.meta.url), "utf8")

describe("desktop general settings draft behavior", () => {
  it("keeps Langfuse drafts local, debounces saves, and flushes on blur", () => {
    expect(settingsGeneralSource).toMatch(/const SETTINGS_TEXT_SAVE_DEBOUNCE_MS = 400/)
    expect(settingsGeneralSource).toMatch(/setLangfuseDrafts\(\(currentDrafts\) => \(\{/)
    expect(settingsGeneralSource).toMatch(/\.\.\.currentDrafts,\s*\[key\]: value/)
    expect(settingsGeneralSource).toMatch(/const pendingSave = langfuseSaveTimeoutsRef\.current\[key\]/)
    expect(settingsGeneralSource).toMatch(/langfuseSaveTimeoutsRef\.current\[key\] = setTimeout\(/)
    expect(settingsGeneralSource).toMatch(/saveConfig\(\{ \[key\]: value(?: \|\| undefined)? \} as Partial<Config>\)/)
    expect(settingsGeneralSource).toMatch(/onBlur=\{\(e\) => flushLangfuseSave\("langfusePublicKey", e\.currentTarget\.value\)\}/)
    expect(settingsGeneralSource).toMatch(/onBlur=\{\(e\) => flushLangfuseSave\("langfuseSecretKey", e\.currentTarget\.value\)\}/)
  })

  it("keeps MCP max-iterations drafts local and validates before saving", () => {
    expect(settingsGeneralSource).toMatch(/const MCP_MAX_ITERATIONS_MIN = 1/)
    expect(settingsGeneralSource).toMatch(/const MCP_MAX_ITERATIONS_MAX = 50/)
    expect(settingsGeneralSource).toMatch(/function parseMcpMaxIterationsDraft\(value: string\)/)
    expect(settingsGeneralSource).toMatch(/setMcpMaxIterationsDraft\(value\)/)
    expect(settingsGeneralSource).toMatch(/mcpMaxIterationsSaveTimeoutRef\.current = setTimeout\(/)
    expect(settingsGeneralSource).toMatch(/const parsedValue = parseMcpMaxIterationsDraft\(value\)/)
  })

  it("keeps the Groq STT prompt draft local with debounce and blur flush behavior", () => {
    expect(settingsGeneralSource).toMatch(/const \[groqSttPromptDraft, setGroqSttPromptDraft\] = useState/)
    expect(settingsGeneralSource).toMatch(/groqSttPromptSaveTimeoutRef\.current = setTimeout\(/)
    expect(settingsGeneralSource).toMatch(/saveConfig\(\{ groqSttPrompt: value(?: \|\| undefined)? \}\)/)
    expect(settingsGeneralSource).toMatch(/onBlur=\{\(e\) => \{\s*flushGroqSttPromptSave\(e\.currentTarget\.value\)\s*\}\}/)
  })
})
