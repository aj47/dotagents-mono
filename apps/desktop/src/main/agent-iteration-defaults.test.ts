import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentLoopRunnerSource = readFileSync(new URL("./agent-loop-runner.ts", import.meta.url), "utf8")
const headlessCliSource = readFileSync(new URL("./headless-cli.ts", import.meta.url), "utf8")
const internalAgentSource = readFileSync(new URL("./acp/internal-agent.ts", import.meta.url), "utf8")

describe("agent iteration default sharing", () => {
  it("routes desktop agent entrypoints through the shared max-iteration resolver", () => {
    expect(agentLoopRunnerSource).toContain('from "@dotagents/shared/agent-run-utils"')
    expect(headlessCliSource).toContain('from "@dotagents/shared/agent-run-utils"')
    expect(internalAgentSource).toContain("from '@dotagents/shared/agent-run-utils'")
    expect(agentLoopRunnerSource).toContain("resolveAgentModeMaxIterations(config)")
    expect(headlessCliSource).toContain("resolveAgentModeMaxIterations(cfg)")
    expect(internalAgentSource).toContain("resolveAgentModeMaxIterations(cfg, maxIterations)")
    expect(agentLoopRunnerSource).not.toContain("mcpUnlimitedIterations ? Infinity")
    expect(headlessCliSource).not.toContain("mcpUnlimitedIterations ? Infinity")
    expect(internalAgentSource).not.toContain("mcpUnlimitedIterations ? Infinity")
  })
})
