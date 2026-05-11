import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("desktop tool approval failure feedback", () => {
  it("shows visible approval failure feedback in AgentProgress", () => {
    expect(agentProgressSource).toContain('import { toast } from "sonner"')
    expect(agentProgressSource).toContain(
      'formatChatRuntimeToolApprovalFailureMessage',
    )
    expect(agentProgressSource).toContain(
      'console.error("[Tool Approval UI] Failed to approve tool call:", error)',
    )
    expect(agentProgressSource).toContain(
      'toast.error(formatChatRuntimeToolApprovalFailureMessage("approve", error))',
    )
    expect(agentProgressSource).toContain(
      'console.error("[Tool Approval UI] Failed to deny tool call:", error)',
    )
    expect(agentProgressSource).toContain(
      'toast.error(formatChatRuntimeToolApprovalFailureMessage("deny", error))',
    )
  })

})
