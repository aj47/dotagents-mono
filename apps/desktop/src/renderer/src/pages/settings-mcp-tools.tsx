import { useConfigQuery, useSaveConfigMutation } from "@renderer/lib/query-client"
import { Config, MCPConfig } from "@shared/types"
import { MCPConfigManager } from "@renderer/components/mcp-config-manager"

/**
 * Normalizes a collapsed servers value from persisted config.
 * - undefined → undefined (first-run sentinel: all collapsed by default)
 * - valid string[] → string[] (persisted state)
 * - null/non-array → undefined (treat as first-run to avoid crashes)
 */
function normalizeCollapsedServers(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined
  }
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
    return value as string[]
  }
  // Invalid value (null, non-array, array with non-strings) - treat as undefined
  return undefined
}

export function Component() {
  const configQuery = useConfigQuery()
  const config = configQuery.data || {}

  const saveConfigMutation = useSaveConfigMutation()

  const updateConfig = (updates: Partial<Config>) => {
    const newConfig = { ...config, ...updates }
    saveConfigMutation.mutate({ config: newConfig })
  }

  const updateMcpConfig = (mcpConfig: MCPConfig) => {
    updateConfig({ mcpConfig })
  }

  const handleCollapsedToolServersChange = (servers: string[]) => {
    updateConfig({ mcpToolsCollapsedServers: servers })
  }

  const handleCollapsedServersChange = (servers: string[]) => {
    updateConfig({ mcpServersCollapsedServers: servers })
  }

  return (
    <div className="modern-panel h-full min-w-0 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">
      <div className="min-w-0">
        <MCPConfigManager
          config={config.mcpConfig || { mcpServers: {} }}
          onConfigChange={updateMcpConfig}
          collapsedToolServers={normalizeCollapsedServers(config.mcpToolsCollapsedServers)}
          collapsedServers={normalizeCollapsedServers(config.mcpServersCollapsedServers)}
          onCollapsedToolServersChange={handleCollapsedToolServersChange}
          onCollapsedServersChange={handleCollapsedServersChange}
        />
      </div>
    </div>
  )
}
