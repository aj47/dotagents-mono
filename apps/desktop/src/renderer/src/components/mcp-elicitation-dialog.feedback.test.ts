import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./mcp-elicitation-dialog.tsx", import.meta.url), "utf8")

describe("desktop MCP elicitation dialog failure feedback", () => {
  it("shows visible feedback when submitting an elicitation action fails", () => {
    expect(source).toContain('import { toast } from "sonner"')
    expect(source).toContain("const [isSubmitting, setIsSubmitting] = useState(false)")
    expect(source).toContain('console.error(`[MCP Elicitation] Failed to ${action} request:`, error)')
    expect(source).toContain('`Failed to ${action} request. ${getActionErrorMessage(error, "Please try again.")}`')
  })

  it("tells the user when the elicitation request is already stale", () => {
    expect(source).toContain("const resolved = await tipcClient.resolveElicitation({")
    expect(source).toContain('if (!resolved) {')
    expect(source).toContain('toast.error("This request is no longer pending.")')
    expect(source).toContain('if (!open && !isSubmitting) {')
  })
})