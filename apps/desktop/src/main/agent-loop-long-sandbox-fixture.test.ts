import { describe, expect, it } from "vitest"
import {
  LONG_AGENT_LOOP_REQUIRED_TOOL_SEQUENCE,
  LONG_AGENT_LOOP_SANDBOX_DELAY_MS,
  createLongAgentLoopSandboxToolState,
  executeLongAgentLoopSandboxTool,
  getLongAgentLoopSandboxPacket,
  getLongAgentLoopSandboxToolDefinitions,
} from "./agent-loop-long-sandbox-fixture"

describe("long agent-loop sandbox fixture", () => {
  it("defines the delayed tools required by the long Electron E2E", () => {
    expect(LONG_AGENT_LOOP_SANDBOX_DELAY_MS).toBeGreaterThanOrEqual(12_000)
    expect(getLongAgentLoopSandboxToolDefinitions().map((tool) => tool.name)).toEqual([
      "list_cases",
      "read_case_file",
      "search_case_notes",
      "read_run_log",
      "summarize_findings",
      "write_final_audit",
    ])
    expect(LONG_AGENT_LOOP_REQUIRED_TOOL_SEQUENCE).toEqual([
      "list_cases",
      "read_case_file",
      "search_case_notes",
      "read_run_log",
      "summarize_findings",
    ])
  })

  it("keeps final audit evidence gated behind the discovery tools", async () => {
    const state = createLongAgentLoopSandboxToolState()
    const packet = getLongAgentLoopSandboxPacket("aurora")

    const earlyFinal = await executeLongAgentLoopSandboxTool(
      "aurora",
      "write_final_audit",
      { candidateId: packet.winningCandidateId, rationale: "too early" },
      { delayMs: 0, state },
    )
    expect(earlyFinal.isError).toBe(true)
    expect(earlyFinal.content[0].text).toContain("missingTools")

    await executeLongAgentLoopSandboxTool("aurora", "list_cases", {}, { delayMs: 0, state })
    await executeLongAgentLoopSandboxTool("aurora", "read_case_file", { candidateId: "RC-A17" }, { delayMs: 0, state })
    await executeLongAgentLoopSandboxTool("aurora", "search_case_notes", { query: "hidden constraints" }, { delayMs: 0, state })
    await executeLongAgentLoopSandboxTool("aurora", "read_run_log", { candidateId: "RC-A17" }, { delayMs: 0, state })
    await executeLongAgentLoopSandboxTool(
      "aurora",
      "summarize_findings",
      { candidateId: "RC-A17", evidence: "case and run evidence" },
      { delayMs: 0, state },
    )

    const finalAudit = await executeLongAgentLoopSandboxTool(
      "aurora",
      "write_final_audit",
      { candidateId: "RC-A17", rationale: "LOCK-AUR-771, iad-fallback, zephyr-green" },
      { delayMs: 0, state },
    )

    expect(finalAudit.isError).toBe(false)
    expect(finalAudit.content[0].text).toContain(packet.receipt)
    expect(finalAudit.content[0].text).toContain(packet.hiddenToken)
    expect(finalAudit.content[0].text).toContain("CASE-AUR-104")
  })
})
