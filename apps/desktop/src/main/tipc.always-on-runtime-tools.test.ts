import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

describe("tipc always-on runtime tool availability", () => {
  it("forces always-on log/question tools into always-on session manifests and execution allowlists", () => {
    expect(tipcSource).toContain("const ALWAYS_ON_REQUIRED_RUNTIME_TOOLS = [")
    expect(tipcSource).toContain("LOG_ALWAYS_ON_ATTEMPT_TOOL")
    expect(tipcSource).toContain("ASK_ALWAYS_ON_QUESTION_TOOL")
    expect(tipcSource).toContain("function withRequiredAlwaysOnRuntimeTools(")
    expect(tipcSource).toContain("function withRequiredAlwaysOnRuntimeToolAllowlist(")
    expect(tipcSource).toContain("alwaysOnSessionService.getRuntimeLinkedSessionId({")
    expect(tipcSource).toContain("const forceAlwaysOnRuntimeTools = isAlwaysOnBackedAgentSession(sessionId, conversationId)")
    expect(tipcSource).toContain("const availableTools = withRequiredAlwaysOnRuntimeTools(baseAvailableTools, forceAlwaysOnRuntimeTools)")
    expect(tipcSource).toContain("const executionProfileMcpConfig = withRequiredAlwaysOnRuntimeToolAllowlist(")
    expect(tipcSource).toContain("mcpService.executeToolCall(toolCall, onProgress, true, sessionId, executionProfileMcpConfig)")
  })
})
