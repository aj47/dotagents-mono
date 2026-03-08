import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsAgentsSource = readFileSync(
  new URL("./settings-agents.tsx", import.meta.url),
  "utf8",
)

function compact(source: string) {
  return source.replace(/\s+/g, "")
}

describe("settings agents system prompt editor", () => {
  const compactSource = compact(settingsAgentsSource)

  it("keeps an empty system-prompt draft empty instead of reinserting the default prompt into the live value", () => {
    expect(compactSource).toContain(compact('value={editing.systemPrompt}'))
    expect(compactSource).toContain(compact('placeholder={defaultSystemPrompt}'))
    expect(compactSource).not.toContain(compact('value={editing.systemPrompt || defaultSystemPrompt}'))
  })
})