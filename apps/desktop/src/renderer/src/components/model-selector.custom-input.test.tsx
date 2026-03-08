import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./model-selector.tsx", import.meta.url), "utf8")

describe("ModelSelector custom input draft behavior", () => {
  it("keeps custom model edits local until blur commits them", () => {
    expect(source).toContain("const commitCustomInputDraft = (nextValue: string) => {")
    expect(source).toContain("logUI('[ModelSelector] Committing custom model draft:', nextValue)")
    expect(source).toContain("onValueChange(nextValue)")
    expect(source).toContain("value={customInputDraft}")
    expect(source).toContain("onChange={(e) => setCustomInputDraft(e.target.value)}")
  })

  it("skips blur commits when focus moves to the custom-mode toggle", () => {
    expect(source).toContain("const shouldSkipCustomBlurCommit = (relatedTarget: EventTarget | null) => {")
    expect(source).toContain('return maybeElement.getAttribute?.("data-custom-model-toggle") === "true"')
    expect(source).toContain("if (shouldSkipCustomBlurCommit(e.relatedTarget)) {")
    expect(source).toContain('data-custom-model-toggle="true"')
    expect(source).toContain('title={useCustomInput ? "Switch to model list" : "Use custom model name"}')
  })
})
