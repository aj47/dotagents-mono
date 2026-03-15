// Re-export from @dotagents/core — single source of truth
export {
  acpBackgroundNotifier,
  ACPBackgroundNotifier,
  setACPBackgroundNotifierProgressEmitter,
  setACPBackgroundNotifierNotificationService,
  setACPBackgroundNotifierSessionTracker,
  setACPBackgroundNotifierRunAgentLoopSession,
} from '@dotagents/core'
export type {
  ACPBackgroundNotifierSessionTracker,
  RunAgentLoopSessionFn,
} from '@dotagents/core'
