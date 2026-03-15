/**
 * useMcpManagement — React hook for MCP server management.
 *
 * Provides full CRUD operations for MCP servers:
 * - List servers with connection status and tool count
 * - Add new servers (stdio, websocket, streamable-http)
 * - Remove servers
 * - Trigger reconnection
 * - List all available tools across servers
 *
 * Uses @dotagents/core mcpService and configStore.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  mcpService,
  configStore,
  inferTransportType,
} from '@dotagents/core';
import type {
  MCPServerConfig,
  MCPTransportType,
} from '@dotagents/core';

// ============================================================================
// Types
// ============================================================================

/** Summary of a configured MCP server */
export interface McpServerInfo {
  name: string;
  connected: boolean;
  toolCount: number;
  transport: MCPTransportType;
  enabled: boolean;
  configDisabled: boolean;
  /** Command (for stdio) or URL (for ws/http) */
  endpoint: string;
  error?: string;
}

/** Detailed tool info across all servers */
export interface McpToolInfo {
  name: string;
  description: string;
  serverName: string;
  enabled: boolean;
  serverEnabled: boolean;
}

/** Result of an add/remove/reconnect operation */
export interface McpOperationResult {
  success: boolean;
  error?: string;
}

export interface UseMcpManagementReturn {
  /** List of configured MCP servers with status */
  servers: McpServerInfo[];
  /** All tools across all servers (detailed) */
  allTools: McpToolInfo[];
  /** Add a new MCP server */
  addServer: (name: string, config: Partial<MCPServerConfig>) => Promise<McpOperationResult>;
  /** Remove an existing MCP server */
  removeServer: (name: string) => Promise<McpOperationResult>;
  /** Trigger reconnection for a server */
  reconnectServer: (name: string) => Promise<McpOperationResult>;
  /** Refresh server/tool listings */
  refresh: () => void;
}

const BUILTIN_SERVER_NAME = 'dotagents-internal';

// ============================================================================
// Hook
// ============================================================================

export function useMcpManagement(): UseMcpManagementReturn {
  const [refreshCounter, setRefreshCounter] = useState(0);

  /**
   * Refresh triggers re-computation of servers and tools.
   */
  const refresh = useCallback(() => {
    setRefreshCounter((c: number) => c + 1);
  }, []);

  /**
   * Compute the list of servers by merging config and runtime status.
   */
  const servers = useMemo((): McpServerInfo[] => {
    // Touch refreshCounter to trigger re-computation
    void refreshCounter;

    const status = mcpService.getServerStatus();
    const config = configStore.get();
    const mcpConfig = config.mcpConfig || { mcpServers: {} };
    const configuredServers: Record<string, MCPServerConfig> = mcpConfig.mcpServers || {};

    const result: McpServerInfo[] = [];

    for (const [serverName, serverStatus] of Object.entries(status)) {
      // Skip built-in server
      if (serverName === BUILTIN_SERVER_NAME) continue;

      const serverConfig = configuredServers[serverName];
      const transport: MCPTransportType = serverConfig
        ? inferTransportType(serverConfig)
        : 'stdio';

      const endpoint = serverConfig
        ? serverConfig.url || serverConfig.command || '(unknown)'
        : '(unknown)';

      result.push({
        name: serverName,
        connected: serverStatus.connected,
        toolCount: serverStatus.toolCount,
        transport,
        enabled: serverStatus.runtimeEnabled !== false,
        configDisabled: serverStatus.configDisabled === true,
        endpoint,
        error: serverStatus.error,
      });
    }

    return result;
  }, [refreshCounter]);

  /**
   * Compute the full tool list across all servers.
   */
  const allTools = useMemo((): McpToolInfo[] => {
    void refreshCounter;

    return mcpService.getDetailedToolList().map((tool) => ({
      name: tool.name,
      description: tool.description,
      serverName: tool.serverName,
      enabled: tool.enabled,
      serverEnabled: tool.serverEnabled,
    }));
  }, [refreshCounter]);

  /**
   * Add a new MCP server to config and initialize it.
   */
  const addServer = useCallback(
    async (
      name: string,
      serverConfig: Partial<MCPServerConfig>,
    ): Promise<McpOperationResult> => {
      // Validate name
      const trimmedName = name.trim();
      if (!trimmedName) {
        return { success: false, error: 'Server name is required' };
      }

      // Check for duplicate
      const config = configStore.get();
      const mcpConfig = config.mcpConfig || { mcpServers: {} };
      const existingServers: Record<string, MCPServerConfig> = mcpConfig.mcpServers || {};

      if (existingServers[trimmedName]) {
        return { success: false, error: `Server "${trimmedName}" already exists` };
      }

      // Determine transport type
      const transport: MCPTransportType = serverConfig.transport || 'stdio';

      // Validate based on transport type
      if (transport === 'stdio') {
        if (!serverConfig.command) {
          return { success: false, error: 'A command is required for stdio transport' };
        }
      } else if (transport === 'websocket' || transport === 'streamableHttp') {
        if (!serverConfig.url) {
          return { success: false, error: 'A URL is required for websocket/HTTP transport' };
        }
      }

      // Build the server config
      const newConfig: MCPServerConfig = {
        transport,
        ...(serverConfig.command ? { command: serverConfig.command } : {}),
        ...(serverConfig.args ? { args: serverConfig.args } : {}),
        ...(serverConfig.env ? { env: serverConfig.env } : {}),
        ...(serverConfig.url ? { url: serverConfig.url } : {}),
        ...(serverConfig.headers ? { headers: serverConfig.headers } : {}),
      };

      // Save to config
      try {
        const updatedConfig = {
          ...config,
          mcpConfig: {
            ...mcpConfig,
            mcpServers: {
              ...existingServers,
              [trimmedName]: newConfig,
            },
          },
        };

        configStore.save(updatedConfig);
      } catch (err) {
        return {
          success: false,
          error: `Failed to save config: ${err instanceof Error ? err.message : String(err)}`,
        };
      }

      // Re-initialize MCP to pick up the new server
      try {
        await mcpService.initialize();
      } catch {
        // Server might fail to connect but config is saved
      }

      refresh();
      return { success: true };
    },
    [refresh],
  );

  /**
   * Remove an MCP server from config and clean up.
   */
  const removeServer = useCallback(
    async (name: string): Promise<McpOperationResult> => {
      const config = configStore.get();
      const mcpConfig = config.mcpConfig || { mcpServers: {} };
      const existingServers: Record<string, MCPServerConfig> = { ...(mcpConfig.mcpServers || {}) };

      if (!existingServers[name]) {
        return { success: false, error: `Server "${name}" not found in configuration` };
      }

      // Stop the server first
      try {
        await mcpService.stopServer(name);
      } catch {
        // Continue even if stop fails
      }

      // Remove from config
      delete existingServers[name];

      try {
        configStore.save({
          ...config,
          mcpConfig: {
            ...mcpConfig,
            mcpServers: existingServers,
          },
        });
      } catch (err) {
        return {
          success: false,
          error: `Failed to save config: ${err instanceof Error ? err.message : String(err)}`,
        };
      }

      refresh();
      return { success: true };
    },
    [refresh],
  );

  /**
   * Trigger reconnection for a specific server.
   */
  const reconnectServer = useCallback(
    async (name: string): Promise<McpOperationResult> => {
      const result = await mcpService.restartServer(name);
      refresh();
      return {
        success: result.success,
        error: result.error,
      };
    },
    [refresh],
  );

  return {
    servers,
    allTools,
    addServer,
    removeServer,
    reconnectServer,
    refresh,
  };
}
