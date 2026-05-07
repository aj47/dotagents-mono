import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopMcpOAuthStatus {
  configured: boolean
  authenticated: boolean
  tokenExpiry?: number
  error?: string
}

export interface DesktopMcpOAuthStartResult {
  authorizationUrl: string
  state: string
}

export interface DesktopMcpOAuthRevokeResult {
  success: boolean
  error?: string
}

export const desktopMcpOAuthClient = {
  initiateFlow(serverName: string): Promise<DesktopMcpOAuthStartResult> {
    return tipcClient.initiateOAuthFlow(serverName) as Promise<DesktopMcpOAuthStartResult>
  },

  getStatus(serverName: string): Promise<DesktopMcpOAuthStatus> {
    return tipcClient.getOAuthStatus(serverName) as Promise<DesktopMcpOAuthStatus>
  },

  revokeTokens(serverName: string): Promise<DesktopMcpOAuthRevokeResult> {
    return tipcClient.revokeOAuthTokens(serverName) as Promise<DesktopMcpOAuthRevokeResult>
  },
}
