import { describe, expect, it } from "vitest"

import {
  acpRouterToolDefinitions,
  isRouterTool,
} from "./acp-router-tool-definitions"

describe("ACP router tool definitions", () => {
  it("advertises only the primary delegation flow tools", () => {
    const names = acpRouterToolDefinitions.map((tool) => tool.name)

    expect(names).toEqual(["delegate_to_agent", "check_agent_status"])
    expect(names).not.toContain("list_available_agents")
    expect(names).not.toContain("send_to_agent")
    expect(names).not.toContain("spawn_agent")
    expect(names).not.toContain("stop_agent")
    expect(names).not.toContain("cancel_agent_run")

    expect(isRouterTool("send_to_agent")).toBe(false)
    expect(isRouterTool("spawn_agent")).toBe(false)
  })
})
