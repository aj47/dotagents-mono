import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(
  new URL("./agent-progress.tsx", import.meta.url),
  "utf8",
)
const tailwindSource = readFileSync(
  new URL("../css/tailwind.css", import.meta.url),
  "utf8",
)

describe("agent progress text selection", () => {
  it("restores selectable response text despite the global select-none baseline", () => {
    expect(tailwindSource).toContain(".markdown-selectable")
    expect(tailwindSource).toContain("user-select: text")
    expect(agentProgressSource).toContain(
      "function hasActiveTextSelection(container?: HTMLElement | null): boolean {",
    )
    expect(agentProgressSource).toContain(
      "hasActiveTextSelection(event.currentTarget)",
    )
    expect(agentProgressSource).toContain(
      'className="markdown-selectable whitespace-pre-wrap break-words [overflow-wrap:anywhere]"',
    )
  })
})
