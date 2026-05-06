import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentRunUtilsSource = readFileSync(new URL("./agent-run-utils.ts", import.meta.url), "utf8")
const headlessCliSource = readFileSync(new URL("./headless-cli.ts", import.meta.url), "utf8")
const internalAgentSource = readFileSync(new URL("./acp/internal-agent.ts", import.meta.url), "utf8")

describe("agent iteration default sharing", () => {
  it("routes desktop agent entrypoints through the shared max-iteration resolver", () => {
    expect(agentRunUtilsSource).toContain("resolveAgentModeMaxIterations")
    expect(headlessCliSource).toContain("resolveAgentModeMaxIterations(cfg)")
    expect(internalAgentSource).toContain("resolveAgentModeMaxIterations(cfg, maxIterations)")
    expect(headlessCliSource).not.toContain("mcpUnlimitedIterations ? Infinity")
    expect(internalAgentSource).not.toContain("mcpUnlimitedIterations ? Infinity")
  })
})
