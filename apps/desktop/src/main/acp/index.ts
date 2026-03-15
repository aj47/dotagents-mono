// Re-export from @dotagents/core — single source of truth
export {
  // Types
  type ACPAgentDefinition,
  type ACPAgentInstance,
  type ACPMessagePart,
  type ACPMessage,
  type ACPRunRequest,
  type ACPRunResult,
  type ACPSubAgentState,
  // Registry
  acpRegistry,
  ACPRegistry,
  configToDefinition,
  // Client Service
  acpClientService,
  ACPClientService,
  // Process Manager
  acpProcessManager,
  ACPProcessManager,
  // Router Tool Definitions
  acpRouterToolDefinitions,
  toolNameAliases,
  resolveToolName,
  isRouterTool,
  // Router Tools
  executeACPRouterTool,
  isACPRouterTool,
  getDelegatedRunsForSession,
  getDelegatedRunDetails,
  getAllDelegationsForSession,
  cleanupOldDelegatedRuns,
  setACPRouterToolsProgressEmitter,
  // Smart Router
  acpSmartRouter,
  ACPSmartRouter,
  // Background Notifier
  acpBackgroundNotifier,
  ACPBackgroundNotifier,
  setACPBackgroundNotifierProgressEmitter,
  setACPBackgroundNotifierNotificationService,
  setACPBackgroundNotifierSessionTracker,
  setACPBackgroundNotifierRunAgentLoopSession,
  // Internal Agent
  runInternalSubSession,
  cancelSubSession,
  getInternalAgentInfo,
  getSessionDepth,
  generateSubSessionId,
  setInternalAgentProgressEmitter,
  setInternalAgentSessionTracker,
} from '@dotagents/core'
export type {
  ACPBackgroundNotifierSessionTracker,
  RunAgentLoopSessionFn,
  InternalAgentSessionTracker,
  RunSubSessionOptions,
  SubSessionResult,
  InternalSubSession,
} from '@dotagents/core'
