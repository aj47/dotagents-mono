import { describe, it, expect, beforeEach } from "vitest"
import {
  builtinToolDefinitions,
  getBuiltinToolNames,
  BUILTIN_SERVER_NAME,
  setAcpRouterToolDefinitions,
  getAcpRouterToolDefinitions,
} from "./builtin-tool-definitions"

describe("builtin-tool-definitions", () => {
  beforeEach(() => {
    // Reset ACP definitions
    setAcpRouterToolDefinitions([])
  })

  it("exports BUILTIN_SERVER_NAME", () => {
    expect(BUILTIN_SERVER_NAME).toBe("dotagents-internal")
  })

  it("has core builtin tool definitions", () => {
    const names = getBuiltinToolNames()
    expect(names).toContain("list_mcp_servers")
    expect(names).toContain("toggle_mcp_server")
    expect(names).toContain("execute_command")
    expect(names).toContain("save_memory")
    expect(names).toContain("respond_to_user")
    expect(names).toContain("mark_work_complete")
    expect(names).toContain("list_repeat_tasks")
    expect(names).toContain("save_repeat_task")
    expect(names).toContain("delete_repeat_task")
    expect(names).toContain("list_agent_profiles")
    expect(names).toContain("save_agent_profile")
    expect(names).toContain("delete_agent_profile")
  })

  it("includes ACP router tool definitions when injected", () => {
    const acpDefs = [
      {
        name: "list_available_agents",
        description: "List available agents",
        inputSchema: { type: "object" as const, properties: {}, required: [] as string[] },
      },
    ]
    setAcpRouterToolDefinitions(acpDefs)

    const names = getBuiltinToolNames()
    expect(names).toContain("list_available_agents")
    expect(getAcpRouterToolDefinitions()).toEqual(acpDefs)
  })

  it("each definition has required fields", () => {
    const names = getBuiltinToolNames()
    for (const name of names) {
      expect(typeof name).toBe("string")
      expect(name.length).toBeGreaterThan(0)
    }
  })
})
