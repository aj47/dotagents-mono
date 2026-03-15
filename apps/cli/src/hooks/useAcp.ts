/**
 * useAcp — React hook for ACP multi-agent management in CLI.
 *
 * Provides:
 * - List configured ACP agents with status
 * - Add/remove/edit agent configurations
 * - Start/stop agents
 * - View delegation chain for active runs
 * - Sub-agent tool filtering enforcement
 *
 * Uses @dotagents/core acpService, acpRegistry, acpProcessManager, configStore.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  acpService,
  acpRegistry,
  configStore,
  getAllDelegationsForSession,
} from '@dotagents/core';
import type {
  ACPAgentConfig,
  ACPConnectionType,
} from '@dotagents/core';
import type { ACPDelegationProgress } from '@dotagents/shared';

// ============================================================================
// Types
// ============================================================================

/** Status of an ACP agent */
export type AcpAgentStatus = 'stopped' | 'starting' | 'ready' | 'error';

/** Summary of a configured ACP agent */
export interface AcpAgentInfo {
  name: string;
  displayName: string;
  description: string;
  connectionType: ACPConnectionType;
  status: AcpAgentStatus;
  enabled: boolean;
  autoSpawn: boolean;
  error?: string;
  /** Allowed tool patterns for sub-agent filtering */
  allowedTools?: string[];
}

/** Delegation chain entry visible in chat */
export interface DelegationEntry {
  runId: string;
  agentName: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  progress?: string;
}

/** Result of an ACP operation */
export interface AcpOperationResult {
  success: boolean;
  error?: string;
}

export interface UseAcpReturn {
  /** List of configured ACP agents with status */
  agents: AcpAgentInfo[];
  /** Start an agent by name */
  startAgent: (name: string) => Promise<AcpOperationResult>;
  /** Stop an agent by name */
  stopAgent: (name: string) => Promise<AcpOperationResult>;
  /** Add a new ACP agent config */
  addAgent: (config: Omit<ACPAgentConfig, 'name'> & { name: string }) => Promise<AcpOperationResult>;
  /** Remove an ACP agent config */
  removeAgent: (name: string) => Promise<AcpOperationResult>;
  /** Update an existing ACP agent config */
  updateAgent: (name: string, updates: Partial<ACPAgentConfig>) => Promise<AcpOperationResult>;
  /** Get active delegations for a session */
  getDelegations: (sessionId: string) => DelegationEntry[];
  /** Refresh agent list */
  refresh: () => void;
  /** Initialize ACP service (auto-spawn enabled agents) */
  initialize: () => Promise<void>;
  /** Cleanup ACP service */
  cleanup: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAcp(): UseAcpReturn {
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refresh = useCallback(() => {
    setRefreshCounter((c: number) => c + 1);
  }, []);

  /**
   * Compute the list of agents by merging config and runtime status.
   */
  const agents = useMemo((): AcpAgentInfo[] => {
    // Touch refreshCounter to trigger re-computation
    void refreshCounter;

    const agentList = acpService.getAgents();

    return agentList.map((agent) => ({
      name: agent.config.name,
      displayName: agent.config.displayName || agent.config.name,
      description: agent.config.description || '',
      connectionType: agent.config.connection.type,
      status: agent.status as AcpAgentStatus,
      enabled: agent.config.enabled !== false,
      autoSpawn: agent.config.autoSpawn === true,
      error: agent.error,
      allowedTools: undefined, // Tool filtering is handled by core
    }));
  }, [refreshCounter]);

  /**
   * Start an ACP agent.
   */
  const startAgent = useCallback(
    async (name: string): Promise<AcpOperationResult> => {
      try {
        await acpService.spawnAgent(name);
        refresh();
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        refresh();
        return { success: false, error: msg };
      }
    },
    [refresh],
  );

  /**
   * Stop an ACP agent.
   */
  const stopAgent = useCallback(
    async (name: string): Promise<AcpOperationResult> => {
      try {
        await acpService.stopAgent(name);
        refresh();
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        refresh();
        return { success: false, error: msg };
      }
    },
    [refresh],
  );

  /**
   * Add a new ACP agent to config.
   */
  const addAgent = useCallback(
    async (
      agentConfig: Omit<ACPAgentConfig, 'name'> & { name: string },
    ): Promise<AcpOperationResult> => {
      const trimmedName = agentConfig.name.trim();
      if (!trimmedName) {
        return { success: false, error: 'Agent name is required' };
      }

      const config = configStore.get();
      const acpAgents: ACPAgentConfig[] = [...(config.acpAgents || [])];

      // Check for duplicate
      if (acpAgents.some((a) => a.name === trimmedName)) {
        return { success: false, error: `Agent "${trimmedName}" already exists` };
      }

      // Validate connection config
      if (agentConfig.connection.type === 'stdio' && !agentConfig.connection.command) {
        return { success: false, error: 'A command is required for stdio agents' };
      }
      if (agentConfig.connection.type === 'remote' && !agentConfig.connection.baseUrl) {
        return { success: false, error: 'A base URL is required for remote agents' };
      }

      const newAgent: ACPAgentConfig = {
        ...agentConfig,
        name: trimmedName,
      };

      acpAgents.push(newAgent);

      try {
        configStore.save({ ...config, acpAgents });
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
   * Remove an ACP agent from config.
   */
  const removeAgent = useCallback(
    async (name: string): Promise<AcpOperationResult> => {
      const config = configStore.get();
      const acpAgents: ACPAgentConfig[] = [...(config.acpAgents || [])];

      const index = acpAgents.findIndex((a) => a.name === name);
      if (index === -1) {
        return { success: false, error: `Agent "${name}" not found` };
      }

      // Stop the agent first if running
      try {
        await acpService.stopAgent(name);
      } catch {
        // Continue even if stop fails
      }

      acpAgents.splice(index, 1);

      try {
        configStore.save({ ...config, acpAgents });
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
   * Update an existing ACP agent config.
   */
  const updateAgent = useCallback(
    async (
      name: string,
      updates: Partial<ACPAgentConfig>,
    ): Promise<AcpOperationResult> => {
      const config = configStore.get();
      const acpAgents: ACPAgentConfig[] = [...(config.acpAgents || [])];

      const index = acpAgents.findIndex((a) => a.name === name);
      if (index === -1) {
        return { success: false, error: `Agent "${name}" not found` };
      }

      acpAgents[index] = { ...acpAgents[index], ...updates };

      try {
        configStore.save({ ...config, acpAgents });
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
   * Get active delegations for a session — shows the delegation chain.
   */
  const getDelegations = useCallback(
    (sessionId: string): DelegationEntry[] => {
      try {
        const runs = getAllDelegationsForSession(sessionId);
        return runs.map((run: ACPDelegationProgress) => ({
          runId: run.runId,
          agentName: run.agentName,
          task: run.task,
          status: run.status as DelegationEntry['status'],
          startTime: run.startTime,
          progress: run.progressMessage,
        }));
      } catch {
        return [];
      }
    },
    [],
  );

  /**
   * Initialize ACP service — auto-spawns enabled agents.
   */
  const initialize = useCallback(async (): Promise<void> => {
    try {
      await acpService.initialize();
    } catch {
      // Silently ignore initialization failures
    }
    refresh();
  }, [refresh]);

  /**
   * Cleanup ACP service — stops all agents.
   */
  const cleanup = useCallback(async (): Promise<void> => {
    const agentList = acpService.getAgents();
    for (const agent of agentList) {
      if (agent.status !== 'stopped') {
        try {
          await acpService.stopAgent(agent.config.name);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }, []);

  return {
    agents,
    startAgent,
    stopAgent,
    addAgent,
    removeAgent,
    updateAgent,
    getDelegations,
    refresh,
    initialize,
    cleanup,
  };
}
