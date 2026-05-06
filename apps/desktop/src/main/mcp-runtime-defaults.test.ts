import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const contextBudgetSource = readFileSync(new URL("./context-budget.ts", import.meta.url), "utf8")
const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")
const mcpServiceSource = readFileSync(new URL("./mcp-service.ts", import.meta.url), "utf8")

describe("MCP runtime shared defaults", () => {
  it("uses shared defaults for context reduction", () => {
    expect(contextBudgetSource).toContain("DEFAULT_MCP_CONTEXT_REDUCTION_ENABLED")
    expect(contextBudgetSource).toContain(
      "config.mcpContextReductionEnabled ?? DEFAULT_MCP_CONTEXT_REDUCTION_ENABLED",
    )
  })

  it("uses shared defaults for message queue runtime checks", () => {
    expect(tipcSource).toContain("DEFAULT_MCP_MESSAGE_QUEUE_ENABLED")
    expect(tipcSource).toContain("config.mcpMessageQueueEnabled ?? DEFAULT_MCP_MESSAGE_QUEUE_ENABLED")
    expect(tipcSource).not.toContain("mcpMessageQueueEnabled !== false")
  })

  it("uses shared defaults for large tool response processing", () => {
    expect(mcpServiceSource).toContain("DEFAULT_MCP_TOOL_RESPONSE_PROCESSING_ENABLED")
    expect(mcpServiceSource).toContain(
      "config.mcpToolResponseProcessingEnabled ?? DEFAULT_MCP_TOOL_RESPONSE_PROCESSING_ENABLED",
    )
  })
})
