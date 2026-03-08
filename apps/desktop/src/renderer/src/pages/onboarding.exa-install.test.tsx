import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./onboarding.tsx", import.meta.url), "utf8")

describe("Onboarding Exa install recovery", () => {
  it("enables runtime and restarts Exa, surfacing success=false results as errors", () => {
    expect(source).toContain('const enableResult = await tipcClient.setMcpServerRuntimeEnabled({')
    expect(source).toContain('serverName: "exa"')
    expect(source).toContain('enabled: true,')
    expect(source).toContain('if (enableResult?.success === false) {')
    expect(source).toContain('throw new Error(enableResult.error || "Failed to enable Exa in runtime.")')
    expect(source).toContain('const restartResult = await tipcClient.restartMcpServer({ serverName: "exa" })')
    expect(source).toContain('throw new Error(restartResult.error || "Failed to start Exa server.")')
  })

  it("keeps Exa marked as installed and shows a recovery message if config save succeeded before startup failed", () => {
    expect(source).toContain("if (exaSavedToConfig) {")
    expect(source).toContain("setExaInstalled(true)")
    expect(source).toContain("setExaInstallError(")
    expect(source).toContain("Exa was added to Settings, but we couldn't start it.")
    expect(source).toContain("You can retry from Settings → MCP Tools.")
  })
})
