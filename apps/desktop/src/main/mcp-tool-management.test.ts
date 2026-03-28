import { describe, expect, it, vi, type Mock } from "vitest"
import type { DetailedToolInfo } from "../shared/types"
import {
  getManagedMcpTool,
  getManagedMcpToolSources,
  getManagedMcpTools,
  resolveManagedMcpToolSelection,
  resolveManagedMcpToolSourceSelection,
  setManagedMcpToolEnabled,
  setManagedMcpToolSourceEnabled,
  type McpToolManagementStore,
} from "./mcp-tool-management"

function createMcpToolStore(
  tools: DetailedToolInfo[],
  options: {
    blockedTools?: string[]
  } = {},
): McpToolManagementStore & {
  setToolEnabled: Mock<[string, boolean], boolean>
} {
  const toolMap = new Map(
    tools.map((tool) => [tool.name, { ...tool } satisfies DetailedToolInfo]),
  )
  const blockedTools = new Set(options.blockedTools || [])

  return {
    getDetailedToolList: () => Array.from(toolMap.values()),
    setToolEnabled: vi.fn((toolName: string, enabled: boolean) => {
      const existingTool = toolMap.get(toolName)
      if (!existingTool || blockedTools.has(toolName)) {
        return false
      }

      toolMap.set(toolName, {
        ...existingTool,
        enabled,
      })
      return true
    }),
  }
}

describe("mcp tool management", () => {
  it("builds sorted tool and source summaries in one helper", () => {
    const store = createMcpToolStore([
      {
        name: "runtime:follow_up",
        description: "Follow up on work",
        sourceKind: "runtime",
        sourceName: "dotagents-runtime-tools",
        sourceLabel: "DotAgents Runtime Tools",
        enabled: true,
        serverEnabled: true,
        inputSchema: { type: "object" },
      },
      {
        name: "exa:search",
        description: "Search the web",
        sourceKind: "mcp",
        sourceName: "exa",
        sourceLabel: "exa",
        serverName: "exa",
        enabled: false,
        serverEnabled: true,
        inputSchema: { type: "object" },
      },
      {
        name: "exa:crawl",
        description: "Read a page",
        sourceKind: "mcp",
        sourceName: "exa",
        sourceLabel: "exa",
        serverName: "exa",
        enabled: true,
        serverEnabled: true,
        inputSchema: { type: "object" },
      },
    ])

    expect(getManagedMcpTools(store).map((tool) => tool.name)).toEqual([
      "runtime:follow_up",
      "exa:crawl",
      "exa:search",
    ])
    expect(getManagedMcpTool("exa:search", store)).toMatchObject({
      sourceName: "exa",
      enabled: false,
    })
    expect(getManagedMcpToolSources(store)).toEqual([
      {
        sourceName: "dotagents-runtime-tools",
        sourceLabel: "DotAgents Runtime Tools",
        sourceKind: "runtime",
        toolCount: 1,
        enabledToolCount: 1,
        serverEnabled: true,
      },
      {
        sourceName: "exa",
        sourceLabel: "exa",
        sourceKind: "mcp",
        toolCount: 2,
        enabledToolCount: 1,
        serverEnabled: true,
      },
    ])
  })

  it("resolves MCP tool and source selections by exact name or unique prefix", () => {
    const tools = [
      { name: "exa:search" },
      { name: "exa:search_news" },
      { name: "runtime:follow_up" },
    ]
    const sources = [
      { sourceName: "exa", sourceLabel: "Exa" },
      {
        sourceName: "dotagents-runtime-tools",
        sourceLabel: "DotAgents Runtime Tools",
      },
    ]

    expect(resolveManagedMcpToolSelection(tools, "runtime:follow")).toEqual({
      selectedTool: tools[2],
    })
    expect(resolveManagedMcpToolSelection(tools, "exa:search")).toEqual({
      selectedTool: tools[0],
    })
    expect(resolveManagedMcpToolSelection(tools, "exa:se")).toEqual({
      ambiguousTools: [tools[0], tools[1]],
    })

    expect(resolveManagedMcpToolSourceSelection(sources, "exa")).toEqual({
      selectedSource: sources[0],
    })
    expect(
      resolveManagedMcpToolSourceSelection(sources, "dotagents runtime"),
    ).toEqual({
      selectedSource: sources[1],
    })
  })

  it("toggles one MCP tool through one helper", () => {
    const store = createMcpToolStore([
      {
        name: "exa:search",
        description: "Search the web",
        sourceKind: "mcp",
        sourceName: "exa",
        sourceLabel: "exa",
        serverName: "exa",
        enabled: false,
        serverEnabled: true,
        inputSchema: { type: "object" },
      },
    ])

    const result = setManagedMcpToolEnabled("exa:search", true, store)

    expect(result).toMatchObject({
      success: true,
      tool: {
        name: "exa:search",
        enabled: true,
      },
    })
    expect(store.setToolEnabled).toHaveBeenCalledWith("exa:search", true)
  })

  it("shares source-level toggles and reports partial failures", () => {
    const store = createMcpToolStore(
      [
        {
          name: "runtime:follow_up",
          description: "Follow up on work",
          sourceKind: "runtime",
          sourceName: "dotagents-runtime-tools",
          sourceLabel: "DotAgents Runtime Tools",
          enabled: true,
          serverEnabled: true,
          inputSchema: { type: "object" },
        },
        {
          name: "runtime:mark_work_complete",
          description: "Mark work complete",
          sourceKind: "runtime",
          sourceName: "dotagents-runtime-tools",
          sourceLabel: "DotAgents Runtime Tools",
          enabled: true,
          serverEnabled: true,
          inputSchema: { type: "object" },
        },
      ],
      {
        blockedTools: ["runtime:mark_work_complete"],
      },
    )

    const result = setManagedMcpToolSourceEnabled(
      "dotagents-runtime-tools",
      false,
      store,
    )

    expect(result).toMatchObject({
      success: false,
      source: {
        sourceName: "dotagents-runtime-tools",
        enabledToolCount: 1,
      },
      updatedCount: 1,
      failedTools: ["runtime:mark_work_complete"],
    })
  })
})
