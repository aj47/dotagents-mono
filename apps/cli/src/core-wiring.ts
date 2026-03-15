/**
 * Core Service Wiring for CLI
 *
 * Registers CLI-specific adapter implementations with @dotagents/core
 * setter-injected dependencies. Mirrors desktop's core-wiring.ts but
 * with terminal-based adapters.
 *
 * Must be called during CLI startup before any core services are used.
 */

import type { PathResolver, ProgressEmitter, UserInteraction } from '@dotagents/core';
import {
  // MCP Service
  setMCPServicePathResolver,
  setMCPServiceUserInteraction,
  mcpService,

  // Builtin Tools
  setBuiltinToolsMcpService,
  setBuiltinToolsEmergencyStop,
  emergencyStopAll,

  // Agent Profile Service
  setBuiltinToolNamesProvider,
  setProfileBuiltinToolNamesProvider,
  getBuiltinToolNames,

  // LLM Engine
  setLLMProgressEmitter,

  // Bridge layer — ProgressEmitter
  setEmitAgentProgressEmitter,
  setAgentSessionTrackerProgressEmitter,
  setMessageQueueServiceProgressEmitter,

  // Bridge layer — elicitation/sampling
  setElicitationProgressEmitter,
  setElicitationUserInteraction,
  setSamplingProgressEmitter,

  // Command verification
  setCommandPathResolver,

  // TTS/STT PathResolver wiring
  setKittenTTSPathResolver,
  setSupertonicTTSPathResolver,
  setParakeetSTTPathResolver,

  // Remote server wiring
  setRemoteServerProgressEmitter,

  // OAuth client wiring
  setOAuthClientUserInteraction,
} from '@dotagents/core';

/**
 * Wire core service dependencies using the provided CLI adapters.
 *
 * This must be called after the service container is populated with
 * PathResolver, ProgressEmitter, UserInteraction, and NotificationService.
 */
export function wireCoreDependencies(
  pathResolver: PathResolver,
  progressEmitter: ProgressEmitter,
  userInteraction: UserInteraction,
): void {
  // --- ProgressEmitter wiring ---
  setEmitAgentProgressEmitter(progressEmitter);
  setAgentSessionTrackerProgressEmitter(progressEmitter);
  setMessageQueueServiceProgressEmitter(progressEmitter);
  setLLMProgressEmitter(progressEmitter);
  setElicitationProgressEmitter(progressEmitter);
  setSamplingProgressEmitter(progressEmitter);

  // --- UserInteraction wiring ---
  setMCPServiceUserInteraction(userInteraction);
  setElicitationUserInteraction(userInteraction);

  // --- PathResolver wiring ---
  setMCPServicePathResolver(pathResolver);

  // --- Cross-service wiring ---
  setBuiltinToolsMcpService(mcpService as any);
  setBuiltinToolsEmergencyStop(emergencyStopAll);
  setBuiltinToolNamesProvider(getBuiltinToolNames);
  setProfileBuiltinToolNamesProvider(getBuiltinToolNames);

  // --- TTS/STT PathResolver wiring ---
  setKittenTTSPathResolver(pathResolver);
  setSupertonicTTSPathResolver(pathResolver);
  setParakeetSTTPathResolver(pathResolver);

  // --- Remote server wiring ---
  setRemoteServerProgressEmitter(progressEmitter);

  // --- OAuth client wiring ---
  setOAuthClientUserInteraction(userInteraction);

  // --- Command verification ---
  setCommandPathResolver({
    resolveCommandPath: async (cmd: string) => {
      const { execSync } = await import('child_process');
      try {
        return execSync(`which ${cmd}`, { encoding: 'utf8' }).trim();
      } catch {
        return cmd;
      }
    },
  });
}

/**
 * Initialize the MCP service by loading servers from the user's .agents config.
 *
 * Returns the list of available MCP tools after initialization.
 * Connection failures are handled gracefully — failed servers are skipped
 * and a warning is logged, but the CLI continues to function.
 */
export async function initializeMcpServers(): Promise<{
  toolCount: number;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    await mcpService.initialize();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown MCP initialization error';
    errors.push(msg);
  }

  const tools = mcpService.getAvailableTools();
  return { toolCount: tools.length, errors };
}

/**
 * Clean up MCP service on exit.
 */
export async function cleanupMcpService(): Promise<void> {
  try {
    await mcpService.cleanup();
  } catch {
    // Ignore cleanup errors during shutdown
  }
}
