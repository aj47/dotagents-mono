import type {
  AgentSessionCandidate,
  AgentSessionCandidatesResponse,
} from "./api-types"

export type AgentSessionCandidateLike = {
  id: string
  conversationId?: string
  conversationTitle?: string
  status: string
  startTime: number
  endTime?: number
}

export type AgentSessionCandidateQueryParseResult =
  | { ok: true; limit: number }
  | { ok: false; statusCode: 400; error: string }

export type AgentSessionCandidateActionResult = {
  statusCode: number
  body: unknown
}

export interface AgentSessionCandidateService {
  getActiveSessions(): AgentSessionCandidateLike[]
  getRecentSessions(limit: number): AgentSessionCandidateLike[]
}

export interface AgentSessionCandidateActionOptions {
  service: AgentSessionCandidateService
  diagnostics: {
    logError(source: string, message: string, error: unknown): void
  }
}

function actionOk(body: unknown): AgentSessionCandidateActionResult {
  return { statusCode: 200, body }
}

function actionError(statusCode: number, message: string): AgentSessionCandidateActionResult {
  return { statusCode, body: { error: message } }
}

export function parseAgentSessionCandidateLimit(query: unknown): AgentSessionCandidateQueryParseResult {
  const record = query && typeof query === "object" ? query as Record<string, unknown> : {}
  const rawLimit = record.limit

  if (rawLimit === undefined || rawLimit === null || rawLimit === "") {
    return { ok: true, limit: 20 }
  }

  const parsedLimit = typeof rawLimit === "number"
    ? rawLimit
    : typeof rawLimit === "string"
      ? Number(rawLimit)
      : Number.NaN

  if (!Number.isFinite(parsedLimit)) {
    return { ok: false, statusCode: 400, error: "Session candidate limit must be a number" }
  }

  return {
    ok: true,
    limit: Math.max(1, Math.min(100, Math.floor(parsedLimit))),
  }
}

export function formatAgentSessionCandidateForApi(
  candidate: AgentSessionCandidateLike,
): AgentSessionCandidate {
  return {
    id: candidate.id,
    conversationId: candidate.conversationId,
    conversationTitle: candidate.conversationTitle,
    status: candidate.status,
    startTime: candidate.startTime,
    endTime: candidate.endTime,
  }
}

export function buildAgentSessionCandidatesResponse(
  activeSessions: AgentSessionCandidateLike[],
  completedSessions: AgentSessionCandidateLike[],
): AgentSessionCandidatesResponse {
  return {
    activeSessions: activeSessions.map(formatAgentSessionCandidateForApi),
    completedSessions: completedSessions.map(formatAgentSessionCandidateForApi),
  }
}

export function getAgentSessionCandidatesAction(
  query: unknown,
  options: AgentSessionCandidateActionOptions,
): AgentSessionCandidateActionResult {
  const parsedLimit = parseAgentSessionCandidateLimit(query)
  if (parsedLimit.ok === false) {
    return actionError(parsedLimit.statusCode, parsedLimit.error)
  }

  try {
    return actionOk(buildAgentSessionCandidatesResponse(
      options.service.getActiveSessions(),
      options.service.getRecentSessions(parsedLimit.limit),
    ))
  } catch (caughtError) {
    options.diagnostics.logError("agent-session-candidates", "Failed to list agent session candidates", caughtError)
    return actionError(500, "Failed to list agent session candidates")
  }
}
