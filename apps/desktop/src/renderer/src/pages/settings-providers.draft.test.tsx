import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./settings-providers.tsx", import.meta.url), "utf8")

describe("desktop provider settings draft persistence", () => {
  it("keeps provider credential drafts local and debounces merged config saves", () => {
    expect(source).toContain('const providerSaveTimeoutsRef = useRef<Partial<Record<ProviderDraftKey, ReturnType<typeof setTimeout>>>>({})')
    expect(source).toContain('const [providerDrafts, setProviderDrafts] = useState(() => getProviderDrafts(configQuery.data))')
    expect(source).toContain('const flushProviderSave = useCallback((key: ProviderDraftKey, value: string) => {')
    expect(source).toContain('const scheduleProviderSave = useCallback((key: ProviderDraftKey, value: string) => {')
    expect(source).toContain('providerSaveTimeoutsRef.current[key] = setTimeout(() => {')
    expect(source).toContain('setProviderDrafts((currentDrafts) => ({')
  })

  it("keeps OpenAI TTS speed drafts local and resets invalid blur states", () => {
    expect(source).toContain('const openAiTtsSpeedSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)')
    expect(source).toContain('const parsed = parseOpenAiTtsSpeedDraft(value)')
    expect(source).toContain('setOpenAiTtsSpeedDraft(getOpenAiTtsSpeedDraft(cfgRef.current))')
    expect(source).toContain('saveConfig({ openaiTtsSpeed: parsed })')
  })

  it("shows visible toast failures for provider downloads and voice tests", () => {
    expect(source).toContain('toast.error(getProviderActionErrorMessage("Failed to download Parakeet model", error))')
    expect(source).toContain('toast.error(getProviderActionErrorMessage("Failed to download Kitten model", error))')
    expect(source).toContain('toast.error(getProviderActionErrorMessage("Failed to download Supertonic model", error))')
    expect(source).toContain('toast.error(getProviderActionErrorMessage("Failed to test Kitten voice", error))')
    expect(source).toContain('toast.error(getProviderActionErrorMessage("Failed to test Supertonic voice", error))')
  })
})
