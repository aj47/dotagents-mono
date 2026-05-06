import {
  getAgentSessionCandidatesAction,
  type AgentSessionCandidateActionOptions,
} from "@dotagents/shared/agent-session-candidates"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { agentSessionTracker } from "./agent-session-tracker"
import { diagnosticsService } from "./diagnostics"

export type SessionCandidateActionResult = MobileApiActionResult

const sessionCandidateActionOptions: AgentSessionCandidateActionOptions = {
  service: {
    getActiveSessions: () => agentSessionTracker.getActiveSessions(),
    getRecentSessions: (limit) => agentSessionTracker.getRecentSessions(limit),
  },
  diagnostics: diagnosticsService,
}

export function getAgentSessionCandidates(query: unknown): SessionCandidateActionResult {
  return getAgentSessionCandidatesAction(query, sessionCandidateActionOptions)
}
