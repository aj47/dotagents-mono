// Re-export from @dotagents/core — single source of truth
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
} from '@dotagents/core'

// Re-export router tool definitions
export { acpRouterToolDefinitions } from '@dotagents/core'
