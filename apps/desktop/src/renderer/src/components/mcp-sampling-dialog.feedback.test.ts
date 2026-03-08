import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./mcp-sampling-dialog.tsx", import.meta.url), "utf8")

describe("desktop MCP sampling dialog failure feedback", () => {
  it("shows visible feedback when submitting a sampling action fails", () => {
    expect(source).toContain('import { toast } from "sonner"')
    expect(source).toContain("const [isSubmitting, setIsSubmitting] = useState(false)")
    expect(source).toContain('console.error(`[MCP Sampling] Failed to ${action} request:`, error)')
    expect(source).toContain('`Failed to ${action} request. ${getActionErrorMessage(error, "Please try again.")}`')
  })

  it("tells the user when the sampling request is already stale", () => {
    expect(source).toContain("const resolved = await tipcClient.resolveSampling({")
    expect(source).toContain("if (!resolved) {")
    expect(source).toContain('toast.error("This request is no longer pending.")')
    expect(source).toContain("if (!open && !isSubmitting) {")
  })
})