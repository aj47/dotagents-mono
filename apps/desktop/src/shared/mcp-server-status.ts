export interface McpServerStatusSnapshot {
  connected: boolean
  toolCount: number
  error?: string
  runtimeEnabled?: boolean
  configDisabled?: boolean
}

export type McpServerRuntimeState =
  | "disabled"
  | "stopped"
  | "connected"
  | "error"
  | "disconnected"

export interface McpServerStatusSummary extends McpServerStatusSnapshot {
  name: string
  enabled: boolean
  runtimeEnabled: boolean
  configDisabled: boolean
  state: McpServerRuntimeState
}

export function resolveMcpServerRuntimeState(
  status: McpServerStatusSnapshot | undefined,
): McpServerRuntimeState {
  if (status?.configDisabled) return "disabled"
  if (status?.runtimeEnabled === false) return "stopped"
  if (status?.connected) return "connected"
  if (status?.error) return "error"
  return "disconnected"
}

export function isMcpServerEnabled(
  status: McpServerStatusSnapshot | undefined,
): boolean {
  const state = resolveMcpServerRuntimeState(status)
  return state !== "disabled" && state !== "stopped"
}

export function countConnectedMcpServers(
  statusByServer: Record<string, McpServerStatusSnapshot>,
): number {
  return Object.values(statusByServer).filter(
    (status) => resolveMcpServerRuntimeState(status) === "connected",
  ).length
}

export function listMcpServerStatusSummaries(
  statusByServer: Record<string, McpServerStatusSnapshot>,
): McpServerStatusSummary[] {
  return Object.entries(statusByServer).map(([name, status]) => {
    const state = resolveMcpServerRuntimeState(status)

    return {
      name,
      connected: status.connected,
      toolCount: status.toolCount,
      error: status.error,
      runtimeEnabled: status.runtimeEnabled !== false,
      configDisabled: status.configDisabled === true,
      enabled: isMcpServerEnabled(status),
      state,
    }
  })
}
