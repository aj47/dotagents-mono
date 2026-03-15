import { useState, useEffect, useCallback, useRef } from 'react';
import { mcpService } from '@dotagents/core';
import type { MCPTool } from '@dotagents/core';
import { initializeMcpServers, cleanupMcpService } from '../core-wiring';

export type McpStatus = 'idle' | 'initializing' | 'ready' | 'error';

export interface McpInitResult {
  toolCount: number;
  errors: string[];
}

export interface UseMcpServiceReturn {
  /** Current MCP initialization status */
  status: McpStatus;
  /** Available MCP tools (includes builtins) */
  tools: MCPTool[];
  /** Initialization warnings (e.g., failed server connections) */
  warnings: string[];
  /** Re-initialize MCP servers (e.g., after config change) */
  reinitialize: () => Promise<void>;
}

/**
 * useMcpService — React hook that manages MCP server lifecycle for the CLI.
 *
 * On mount, initializes MCP servers from the user's .agents config.
 * Provides the list of available tools (MCP + builtins) and handles
 * connection failures gracefully with warnings.
 */
export function useMcpService(): UseMcpServiceReturn {
  const [status, setStatus] = useState<McpStatus>('idle');
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const initRef = useRef(false);

  const doInitialize = useCallback(async () => {
    setStatus('initializing');
    setWarnings([]);

    try {
      const result = await initializeMcpServers();

      // Refresh tool list
      const availableTools = mcpService.getAvailableTools();
      setTools(availableTools);

      if (result.errors.length > 0) {
        setWarnings(result.errors);
      }

      setStatus('ready');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'MCP initialization failed';
      setWarnings([msg]);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    // Guard against double initialization in strict mode
    if (initRef.current) return;
    initRef.current = true;

    doInitialize();

    return () => {
      // Clean up MCP service on unmount
      cleanupMcpService();
    };
  }, [doInitialize]);

  return {
    status,
    tools,
    warnings,
    reinitialize: doInitialize,
  };
}
