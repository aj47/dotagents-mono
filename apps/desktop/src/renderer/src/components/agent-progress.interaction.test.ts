import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("agent progress interactions", () => {
  it("does not collapse expanded final response bodies or interactive controls", () => {
    expect(agentProgressSource).toContain(
      "typeof (target as HTMLElement).closest === \"function\""
    )
    expect(agentProgressSource).toContain(
      "(target as HTMLElement).closest(\"button, a, input, textarea, select, [role='button']\")"
    )
    expect(agentProgressSource).toContain("const shouldToggleFromContentClick = shouldCollapse && !isExpanded")
    expect(agentProgressSource).toContain("onClick={shouldToggleFromContentClick ? handleToggleExpand : undefined}")
    expect(agentProgressSource).toContain("e.stopPropagation()")
  })
})