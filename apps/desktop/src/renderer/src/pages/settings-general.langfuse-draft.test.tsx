import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./settings-general.tsx", import.meta.url), "utf8")

describe("desktop general settings draft persistence", () => {
  it("tracks langfuse drafts separately from saved config and debounces saves", () => {
    expect(source).toContain('type LangfuseDraftKey = "langfusePublicKey" | "langfuseSecretKey" | "langfuseBaseUrl"')
    expect(source).toContain('const [langfuseDrafts, setLangfuseDrafts] = useState(() => getLangfuseDrafts(cfg))')
    expect(source).toContain('const langfuseSaveTimeoutsRef = useRef<Partial<Record<LangfuseDraftKey, ReturnType<typeof setTimeout>>>>({})')
    expect(source).toContain('const flushLangfuseSave = useCallback((key: LangfuseDraftKey, value: string) => {')
    expect(source).toContain('const scheduleLangfuseSave = useCallback((key: LangfuseDraftKey, value: string) => {')
    expect(source).toContain('langfuseSaveTimeoutsRef.current[key] = setTimeout(() => {')
    expect(source).toContain('updateLangfuseDraft("langfusePublicKey", e.currentTarget.value)')
    expect(source).toContain('flushLangfuseSave("langfuseSecretKey", e.currentTarget.value)')
  })

  it("keeps Groq STT and transcript post-processing prompts on local drafts before flushing", () => {
    expect(source).toContain('const groqSttPromptSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)')
    expect(source).toContain('const transcriptPostProcessingPromptSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)')
    expect(source).toContain('const scheduleGroqSttPromptSave = useCallback((value: string) => {')
    expect(source).toContain('const flushGroqSttPromptSave = useCallback((value: string) => {')
    expect(source).toContain('const scheduleTranscriptPostProcessingPromptSave = useCallback((value: string) => {')
    expect(source).toContain('const flushTranscriptPostProcessingPromptSave = useCallback((value: string) => {')
  })

  it("lets MCP max iterations keep a local draft, debounce valid saves, and reset invalid blur values", () => {
    expect(source).toContain('const mcpMaxIterationsSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)')
    expect(source).toContain('const parsedValue = parseMcpMaxIterationsDraft(value)')
    expect(source).toContain('if (parsedValue === null) {')
    expect(source).toContain('setMcpMaxIterationsDraft(String(cfgRef.current?.mcpMaxIterations ?? MCP_MAX_ITERATIONS_DEFAULT))')
    expect(source).toContain('saveConfig({ mcpMaxIterations: parsedValue })')
  })
})
