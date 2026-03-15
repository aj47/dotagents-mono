// Re-export from @dotagents/core — single source of truth
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
} from '@dotagents/core'
export type {
  InternalAgentSessionTracker,
  RunSubSessionOptions,
  SubSessionResult,
  InternalSubSession,
} from '@dotagents/core'
