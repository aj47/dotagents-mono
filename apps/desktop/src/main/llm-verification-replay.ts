// Re-export from @dotagents/core — single source of truth
export {
  VERIFICATION_SYSTEM_PROMPT,
  VERIFICATION_JSON_REQUEST_BASE,
  buildVerificationJsonRequest,
  buildVerificationMessagesFromAgentState,
  resolveContinueReplayMessages,
  parseContinueReplayFixture,
} from '@dotagents/core'
export type {
  VerificationMessage,
  ExactVerifierMessagesReplayFixture,
  AgentStateReplayFixture,
  ContinueReplayFixture,
} from '@dotagents/core'
