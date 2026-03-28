import { describe, expect, it, vi, type Mock } from "vitest"
import type { MCPServerConfig } from "../shared/types"
import {
  completeManagedMcpOAuthFlow,
  getManagedMcpOAuthServer,
  getManagedMcpOAuthServers,
  resolveManagedMcpOAuthServerSelection,
  revokeManagedMcpOAuthTokens,
  startManagedMcpOAuthFlow,
  type McpOAuthManagementStore,
} from "./mcp-oauth-management"

type OAuthStatus = {
  configured: boolean
  authenticated: boolean
  tokenExpiry?: number
  error?: string
}

function createMcpOAuthStore(
  serverConfigs: Record<string, MCPServerConfig>,
  statuses: Record<string, OAuthStatus>,
): McpOAuthManagementStore & {
  initiateOAuthFlow: Mock
  completeOAuthFlow: Mock
  revokeOAuthTokens: Mock
} {
  const mutableStatuses = new Map(
    Object.entries(statuses).map(([serverName, status]) => [serverName, { ...status }]),
  )

  return {
    getServerConfigs: () => serverConfigs,
    getOAuthStatus: async (serverName: string) =>
      mutableStatuses.get(serverName) || {
        configured: false,
        authenticated: false,
      },
    initiateOAuthFlow: vi.fn(async (serverName: string) => ({
      authorizationUrl: `https://auth.example.com/${serverName}`,
      state: `${serverName}-state`,
    })),
    completeOAuthFlow: vi.fn(async (serverName: string) => {
      mutableStatuses.set(serverName, {
        configured: true,
        authenticated: true,
        tokenExpiry: 42,
      })
      return { success: true }
    }),
    revokeOAuthTokens: vi.fn(async (serverName: string) => {
      mutableStatuses.set(serverName, {
        configured: true,
        authenticated: false,
      })
      return { success: true }
    }),
  }
}

describe("mcp oauth management", () => {
  it("lists only streamable HTTP MCP servers and merges OAuth status", async () => {
    const store = createMcpOAuthStore(
      {
        exa: {
          url: "https://exa.example.com/mcp",
          transport: "streamableHttp",
        },
        github: {
          url: "wss://github.example.com/mcp",
          transport: "websocket",
        },
        local: {
          command: "node",
          args: ["server.js"],
        },
      },
      {
        exa: {
          configured: true,
          authenticated: true,
          tokenExpiry: 123,
        },
      },
    )

    await expect(getManagedMcpOAuthServers(store)).resolves.toEqual([
      {
        name: "exa",
        url: "https://exa.example.com/mcp",
        transport: "streamableHttp",
        configured: true,
        authenticated: true,
        tokenExpiry: 123,
      },
    ])
    await expect(getManagedMcpOAuthServer("exa", store)).resolves.toMatchObject({
      name: "exa",
      configured: true,
      authenticated: true,
    })
    await expect(getManagedMcpOAuthServer("local", store)).resolves.toBeUndefined()
  })

  it("resolves OAuth servers by exact name or unique prefix", () => {
    const servers = [
      { name: "exa" },
      { name: "example-auth" },
      { name: "github" },
    ]

    expect(resolveManagedMcpOAuthServerSelection(servers, "github")).toEqual({
      selectedServer: servers[2],
    })
    expect(resolveManagedMcpOAuthServerSelection(servers, "exa")).toEqual({
      selectedServer: servers[0],
    })
    expect(resolveManagedMcpOAuthServerSelection(servers, "ex")).toEqual({
      ambiguousServers: [servers[0], servers[1]],
    })
  })

  it("starts OAuth flows without forcing a browser for headless callers", async () => {
    const store = createMcpOAuthStore(
      {
        exa: {
          url: "https://exa.example.com/mcp",
          transport: "streamableHttp",
          oauth: {},
        },
      },
      {
        exa: {
          configured: true,
          authenticated: false,
        },
      },
    )

    const result = await startManagedMcpOAuthFlow("exa", store, {
      openBrowser: false,
    })

    expect(result).toMatchObject({
      success: true,
      authorizationUrl: "https://auth.example.com/exa",
      state: "exa-state",
      server: {
        name: "exa",
        configured: true,
      },
    })
    expect(store.initiateOAuthFlow).toHaveBeenCalledWith("exa", {
      openBrowser: false,
    })
  })

  it("completes and revokes OAuth flows through one helper layer", async () => {
    const store = createMcpOAuthStore(
      {
        exa: {
          url: "https://exa.example.com/mcp",
          transport: "streamableHttp",
          oauth: {},
        },
      },
      {
        exa: {
          configured: true,
          authenticated: false,
        },
      },
    )

    const completed = await completeManagedMcpOAuthFlow(
      "exa",
      "auth-code",
      "auth-state",
      store,
    )
    expect(completed).toMatchObject({
      success: true,
      server: {
        name: "exa",
        authenticated: true,
        tokenExpiry: 42,
      },
    })
    expect(store.completeOAuthFlow).toHaveBeenCalledWith(
      "exa",
      "auth-code",
      "auth-state",
    )

    const revoked = await revokeManagedMcpOAuthTokens("exa", store)
    expect(revoked).toMatchObject({
      success: true,
      server: {
        name: "exa",
        configured: true,
        authenticated: false,
      },
    })
    expect(store.revokeOAuthTokens).toHaveBeenCalledWith("exa")
  })
})
