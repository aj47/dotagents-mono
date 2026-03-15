/**
 * ACP (Agent Client Protocol) Module
 *
 * This module provides the infrastructure for delegating tasks to external AI agents
 * via the Agent Client Protocol (Zed ACP) for user-to-agent interaction.
 */

// Re-export all types
export * from './types'

// Re-export named exports from each module
export { acpRegistry, ACPRegistry, configToDefinition } from './acp-registry'
export { acpClientService, ACPClientService } from './acp-client-service'
export { acpProcessManager, ACPProcessManager } from './acp-process-manager'
export { 
  acpRouterToolDefinitions, 
  toolNameAliases, 
  resolveToolName, 
  isRouterTool 
} from './acp-router-tool-definitions'
export {
  executeACPRouterTool,
  isACPRouterTool,
  getDelegatedRunsForSession,
  getDelegatedRunDetails,
  getAllDelegationsForSession,
  cleanupOldDelegatedRuns,
  setACPRouterToolsProgressEmitter,
  getInternalAgentConfig,
  handleListAvailableAgents,
  handleDelegateToAgent,
  handleCheckAgentStatus,
  handleSpawnAgent,
  handleStopAgent,
  handleCancelAgentRun,
  getCurrentSessionDepth,
} from './acp-router-tools'
export { acpSmartRouter, ACPSmartRouter } from './acp-smart-router'
export {
  acpBackgroundNotifier,
  ACPBackgroundNotifier,
  setACPBackgroundNotifierProgressEmitter,
  setACPBackgroundNotifierNotificationService,
  setACPBackgroundNotifierSessionTracker,
  setACPBackgroundNotifierRunAgentLoopSession,
} from './acp-background-notifier'
export type {
  ACPBackgroundNotifierSessionTracker,
  RunAgentLoopSessionFn,
} from './acp-background-notifier'
export {
  runInternalSubSession,
  cancelSubSession,
  getInternalAgentInfo,
  getSessionDepth,
  generateSubSessionId,
  setInternalAgentProgressEmitter,
  setInternalAgentSessionTracker,
  getChildSubSessions,
  getSubSession,
  cleanupOldSubSessions,
} from './internal-agent'
export type {
  InternalAgentSessionTracker,
  RunSubSessionOptions,
  SubSessionResult,
  InternalSubSession,
} from './internal-agent'
