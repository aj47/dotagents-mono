import { describe, expect, it } from "vitest"

import {
  formatToolExecutionDuration,
  formatToolExecutionTokens,
  truncateToolExecutionSubagentId,
} from "./tool-execution-display"

describe("tool execution display", () => {
  it("formats short, second-scale, and minute-scale durations", () => {
    expect(formatToolExecutionDuration(150)).toBe("150ms")
    expect(formatToolExecutionDuration(3062)).toBe("3.1s")
    expect(formatToolExecutionDuration(65000)).toBe("1m 5s")
    expect(formatToolExecutionDuration(120000)).toBe("2m")
  })

  it("formats token counts compactly", () => {
    expect(formatToolExecutionTokens(500)).toBe("500")
    expect(formatToolExecutionTokens(1700)).toBe("1.7k")
    expect(formatToolExecutionTokens(17000)).toBe("17k")
    expect(formatToolExecutionTokens(1500000)).toBe("1.5M")
  })

  it("truncates long subagent identifiers for compact display", () => {
    expect(truncateToolExecutionSubagentId("a6a4f4d8-1234-5678-abcd-ef1234567890")).toBe("agent:a6a4f4d")
    expect(truncateToolExecutionSubagentId("agent-1")).toBe("agent-1")
    expect(truncateToolExecutionSubagentId("longsubagentidentifier")).toBe("longsubage...")
  })
})
