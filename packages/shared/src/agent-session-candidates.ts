import type {
  AgentSessionCandidate,
  AgentSessionCandidatesResponse,
  ToolApprovalResponse,
} from "./api-types"

export type AgentSessionCandidateLike = {
  id: string
  conversationId?: string
  conversationTitle?: string
  status: string
  startTime: number
  endTime?: number
}

export type AgentSessionCandidateGroup = "Active" | "Recent" | "Selected"

export type AgentSessionCandidateOption<TCandidate extends AgentSessionCandidateLike = AgentSessionCandidate> =
  TCandidate & {
    group: AgentSessionCandidateGroup
  }

export type AgentSessionCandidateTimeFormatOptions = {
  locales?: Intl.LocalesArgument
  dateTimeFormatOptions?: Intl.DateTimeFormatOptions
  fallback?: string
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

export interface ToolApprovalResponseService {
  respondToApproval(approvalId: string, approved: boolean): boolean
}

export interface AgentSessionCandidateTrackerLike {
  getActiveSessions(): AgentSessionCandidateLike[]
  getRecentSessions(limit: number): AgentSessionCandidateLike[]
}

export function createAgentSessionCandidateService(
  tracker: AgentSessionCandidateTrackerLike,
): AgentSessionCandidateService {
  return {
    getActiveSessions: () => tracker.getActiveSessions(),
    getRecentSessions: (limit) => tracker.getRecentSessions(limit),
  }
}

export interface AgentSessionCandidateActionOptions {
  service: AgentSessionCandidateService
  diagnostics: {
    logError(source: string, message: string, error: unknown): void
  }
}

export interface ToolApprovalResponseActionOptions {
  service: ToolApprovalResponseService
  diagnostics: {
    logError(source: string, message: string, error: unknown): void
  }
}

export interface AgentSessionCandidateRouteActions {
  getAgentSessionCandidates(query?: unknown): AgentSessionCandidateActionResult
}

export interface AgentSessionRouteActions extends AgentSessionCandidateRouteActions {
  respondToToolApproval(approvalId: string | undefined, body: unknown): AgentSessionCandidateActionResult
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

export function formatAgentSessionCandidateTitle(candidate: AgentSessionCandidateLike): string {
  return candidate.conversationTitle?.trim() || candidate.conversationId || candidate.id
}

export function formatAgentSessionCandidateTime(
  candidate: AgentSessionCandidateLike,
  options: AgentSessionCandidateTimeFormatOptions = {},
): string {
  const timestamp = candidate.endTime ?? candidate.startTime
  if (!timestamp) return options.fallback ?? candidate.id
  return new Date(timestamp).toLocaleString(options.locales, options.dateTimeFormatOptions)
}

export function formatAgentSessionCandidateLabel(
  candidate: AgentSessionCandidateLike,
  options?: AgentSessionCandidateTimeFormatOptions,
): string {
  return `${formatAgentSessionCandidateTitle(candidate)} - ${formatAgentSessionCandidateTime(candidate, options)}`
}

export function buildAgentSessionCandidateOptions<
  TCandidate extends AgentSessionCandidateLike = AgentSessionCandidate,
>(
  candidates: Pick<AgentSessionCandidatesResponse, "activeSessions" | "completedSessions"> | null | undefined,
  selectedSessionId?: string,
): AgentSessionCandidateOption<TCandidate>[] {
  const selectedId = selectedSessionId?.trim()
  const seen = new Set<string>()
  const options: AgentSessionCandidateOption<TCandidate>[] = []

  const addCandidates = (items: AgentSessionCandidateLike[] | undefined, group: AgentSessionCandidateGroup) => {
    for (const candidate of items ?? []) {
      if (seen.has(candidate.id)) continue
      seen.add(candidate.id)
      options.push({ ...(candidate as TCandidate), group })
    }
  }

  addCandidates(candidates?.activeSessions, "Active")
  addCandidates(candidates?.completedSessions, "Recent")

  if (selectedId && !seen.has(selectedId)) {
    options.unshift({
      id: selectedId,
      status: "unknown",
      startTime: 0,
      group: "Selected",
    } as AgentSessionCandidateOption<TCandidate>)
  }

  return options
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

export function createAgentSessionCandidateRouteActions(
  options: AgentSessionCandidateActionOptions,
): AgentSessionCandidateRouteActions {
  return {
    getAgentSessionCandidates: (query) => getAgentSessionCandidatesAction(query, options),
  }
}

export function buildToolApprovalResponse(
  approvalId: string,
  approved: boolean,
  success: boolean,
): ToolApprovalResponse {
  return {
    success,
    approvalId,
    approved,
  }
}

export function parseToolApprovalResponseBody(body: unknown):
  | { ok: true; approved: boolean }
  | { ok: false; statusCode: 400; error: string } {
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {}
  if (typeof record.approved !== "boolean") {
    return { ok: false, statusCode: 400, error: "Tool approval response must include boolean approved" }
  }
  return { ok: true, approved: record.approved }
}

export function respondToToolApprovalAction(
  approvalId: string | undefined,
  body: unknown,
  options: ToolApprovalResponseActionOptions,
): AgentSessionCandidateActionResult {
  const normalizedApprovalId = approvalId?.trim()
  if (!normalizedApprovalId) {
    return actionError(400, "Missing approval id")
  }

  const parsedBody = parseToolApprovalResponseBody(body)
  if (parsedBody.ok === false) {
    return actionError(parsedBody.statusCode, parsedBody.error)
  }

  try {
    const success = options.service.respondToApproval(normalizedApprovalId, parsedBody.approved)
    return actionOk(buildToolApprovalResponse(normalizedApprovalId, parsedBody.approved, success))
  } catch (caughtError) {
    options.diagnostics.logError("agent-session-tool-approval", "Failed to respond to tool approval", caughtError)
    return actionError(500, "Failed to respond to tool approval")
  }
}

export function createAgentSessionRouteActions(options: {
  candidates: AgentSessionCandidateActionOptions
  toolApproval: ToolApprovalResponseActionOptions
}): AgentSessionRouteActions {
  return {
    ...createAgentSessionCandidateRouteActions(options.candidates),
    respondToToolApproval: (approvalId, body) =>
      respondToToolApprovalAction(approvalId, body, options.toolApproval),
  }
}
