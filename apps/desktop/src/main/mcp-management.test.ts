import { describe, expect, it, vi, type Mock } from "vitest"
import {
  getManagedMcpServerLogs,
  getManagedMcpServerSummaries,
  getManagedMcpServerSummary,
  resolveManagedMcpServerSelection,
  restartManagedMcpServer,
  setManagedMcpServerRuntimeEnabled,
  stopManagedMcpServer,
  type McpManagementStore,
} from "./mcp-management"
import type { MCPServerConfig, ServerLogEntry } from "../shared/types"
import type { McpServerStatusSnapshot } from "../shared/mcp-server-status"

function createMcpStore(
  serverConfigs: Record<string, MCPServerConfig>,
  options: {
    statusByServer?: Record<string, McpServerStatusSnapshot>
    logsByServer?: Record<string, ServerLogEntry[]>
    restartResultsByServer?: Record<string, { success: boolean; error?: string }>
    stopResultsByServer?: Record<string, { success: boolean; error?: string }>
  } = {},
): McpManagementStore & {
  setServerRuntimeEnabled: Mock<[string, boolean], boolean>
  restartServer: Mock<[string], Promise<{ success: boolean; error?: string }>>
  stopServer: Mock<[string], Promise<{ success: boolean; error?: string }>>
} {
  const statusByServer = { ...(options.statusByServer || {}) }

  return {
    getServerConfigs: () => serverConfigs,
    getServerStatus: () => statusByServer,
    setServerRuntimeEnabled: vi.fn((serverName: string, enabled: boolean) => {
      if (!serverConfigs[serverName]) {
        return false
      }

      const currentStatus = statusByServer[serverName] || {
        connected: false,
        toolCount: 0,
      }
      statusByServer[serverName] = {
        ...currentStatus,
        runtimeEnabled: enabled,
      }
      return true
    }),
    restartServer: vi.fn(async (serverName: string) => {
      return (
        options.restartResultsByServer?.[serverName] || {
          success: !!serverConfigs[serverName],
          error: serverConfigs[serverName]
            ? undefined
            : `Server '${serverName}' not found`,
        }
      )
    }),
    stopServer: vi.fn(async (serverName: string) => {
      const result =
        options.stopResultsByServer?.[serverName] || {
          success: !!serverConfigs[serverName],
          error: serverConfigs[serverName]
            ? undefined
            : `Server '${serverName}' not found`,
        }

      if (result.success && statusByServer[serverName]) {
        statusByServer[serverName] = {
          ...statusByServer[serverName],
          connected: false,
        }
      }

      return result
    }),
    getServerLogs: vi.fn((serverName: string) => {
      return options.logsByServer?.[serverName] || []
    }),
  }
}

describe("mcp management", () => {
  it("builds MCP server summaries with transport and config metadata in one helper", () => {
    const store = createMcpStore(
      {
        alpha: {
          command: "node",
          args: ["alpha.js"],
          env: { NODE_ENV: "production" },
        },
        beta: {
          transport: "streamableHttp",
          url: "https://example.com/mcp",
          headers: { Authorization: "Bearer token" },
          disabled: true,
        },
      },
      {
        statusByServer: {
          alpha: {
            connected: true,
            toolCount: 2,
            runtimeEnabled: true,
          },
          beta: {
            connected: false,
            toolCount: 0,
            runtimeEnabled: false,
            configDisabled: true,
          },
        },
      },
    )

    expect(getManagedMcpServerSummaries(store)).toEqual([
      {
        name: "alpha",
        connected: true,
        toolCount: 2,
        error: undefined,
        runtimeEnabled: true,
        configDisabled: false,
        enabled: true,
        state: "connected",
        transport: "stdio",
      },
      {
        name: "beta",
        connected: false,
        toolCount: 0,
        error: undefined,
        runtimeEnabled: false,
        configDisabled: true,
        enabled: false,
        state: "disabled",
        transport: "streamableHttp",
      },
    ])

    expect(getManagedMcpServerSummary("beta", store)).toMatchObject({
      name: "beta",
      config: {
        transport: "streamableHttp",
        url: "https://example.com/mcp",
        headers: { Authorization: "Bearer token" },
        disabled: true,
      },
      headerCount: 1,
      envCount: 0,
    })
  })

  it("resolves MCP server selections by exact name or unique prefix", () => {
    const servers = [
      { name: "alpha-server" },
      { name: "beta-server" },
      { name: "beta-tools" },
    ]

    expect(resolveManagedMcpServerSelection(servers, "ALPHA-SERVER")).toEqual({
      selectedServer: servers[0],
    })
    expect(resolveManagedMcpServerSelection(servers, "beta-s")).toEqual({
      selectedServer: servers[1],
    })
    expect(resolveManagedMcpServerSelection(servers, "beta")).toEqual({
      ambiguousServers: [servers[1], servers[2]],
    })
  })

  it("toggles runtime server enablement through one helper", () => {
    const store = createMcpStore(
      {
        alpha: {
          command: "node",
          args: ["alpha.js"],
        },
      },
      {
        statusByServer: {
          alpha: {
            connected: true,
            toolCount: 2,
            runtimeEnabled: true,
          },
        },
      },
    )

    const result = setManagedMcpServerRuntimeEnabled("alpha", false, store)

    expect(result).toMatchObject({
      success: true,
      server: {
        name: "alpha",
        runtimeEnabled: false,
        state: "stopped",
      },
    })
    expect(store.setServerRuntimeEnabled).toHaveBeenCalledWith("alpha", false)
  })

  it("shares restart, stop, and log lookups through one helper", async () => {
    const store = createMcpStore(
      {
        alpha: {
          command: "node",
          args: ["alpha.js"],
        },
      },
      {
        statusByServer: {
          alpha: {
            connected: true,
            toolCount: 1,
            runtimeEnabled: true,
          },
        },
        logsByServer: {
          alpha: [{ timestamp: 123, message: "Server started" }],
        },
        restartResultsByServer: {
          alpha: { success: false, error: "restart failed" },
        },
      },
    )

    const restartResult = await restartManagedMcpServer("alpha", store)
    expect(restartResult).toMatchObject({
      success: false,
      error: "restart failed",
      server: { name: "alpha" },
    })

    const stopResult = await stopManagedMcpServer("alpha", store)
    expect(stopResult).toMatchObject({
      success: true,
      server: {
        name: "alpha",
        connected: false,
      },
    })

    expect(getManagedMcpServerLogs("alpha", store)).toMatchObject({
      success: true,
      server: { name: "alpha" },
      logs: [{ timestamp: 123, message: "Server started" }],
    })
  })
})
