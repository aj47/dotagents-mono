import { describe, expect, it } from "vitest"

import {
  buildAgentSessionCandidateOptions,
  buildAgentSessionCandidatesResponse,
  createAgentSessionCandidateRouteActions,
  formatAgentSessionCandidateLabel,
  formatAgentSessionCandidateTime,
  formatAgentSessionCandidateTitle,
  getAgentSessionCandidatesAction,
  parseAgentSessionCandidateLimit,
} from "./agent-session-candidates"

describe("agent session candidates", () => {
  it("parses candidate limits safely", () => {
    expect(parseAgentSessionCandidateLimit(undefined)).toEqual({ ok: true, limit: 20 })
    expect(parseAgentSessionCandidateLimit({ limit: "5" })).toEqual({ ok: true, limit: 5 })
    expect(parseAgentSessionCandidateLimit({ limit: "500" })).toEqual({ ok: true, limit: 100 })
    expect(parseAgentSessionCandidateLimit({ limit: "0" })).toEqual({ ok: true, limit: 1 })
    expect(parseAgentSessionCandidateLimit({ limit: "nope" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Session candidate limit must be a number",
    })
  })

  it("builds active and completed session candidate responses", () => {
    const active = [{
      id: "active-1",
      conversationId: "conv-active",
      conversationTitle: "Active work",
      status: "active",
      startTime: 10,
    }]
    const completed = [{
      id: "done-1",
      conversationId: "conv-done",
      conversationTitle: "Done work",
      status: "completed",
      startTime: 1,
      endTime: 5,
    }]

    expect(buildAgentSessionCandidatesResponse(active, completed)).toEqual({
      activeSessions: active,
      completedSessions: completed,
    })
  })

  it("formats and merges active, recent, and selected session candidates", () => {
    const active = [{
      id: "active-1",
      conversationId: "conv-active",
      conversationTitle: " Active work ",
      status: "active",
      startTime: Date.UTC(2026, 4, 6, 12, 0, 0),
    }]
    const duplicateCompleted = {
      id: "active-1",
      conversationId: "conv-active-old",
      conversationTitle: "Older active work",
      status: "completed",
      startTime: Date.UTC(2026, 4, 5, 12, 0, 0),
    }
    const completed = [{
      id: "done-1",
      conversationId: "conv-done",
      status: "completed",
      startTime: Date.UTC(2026, 4, 4, 12, 0, 0),
      endTime: Date.UTC(2026, 4, 4, 13, 0, 0),
    }]

    expect(buildAgentSessionCandidateOptions({
      activeSessions: active,
      completedSessions: [duplicateCompleted, ...completed],
    }, "missing-session")).toEqual([
      { id: "missing-session", status: "unknown", startTime: 0, group: "Selected" },
      { ...active[0], group: "Active" },
      { ...completed[0], group: "Recent" },
    ])
    expect(formatAgentSessionCandidateTitle(active[0])).toBe("Active work")
    expect(formatAgentSessionCandidateTitle(completed[0])).toBe("conv-done")
    expect(formatAgentSessionCandidateTime({
      id: "missing-session",
      status: "unknown",
      startTime: 0,
    })).toBe("missing-session")
    expect(formatAgentSessionCandidateLabel(active[0], {
      locales: "en-US",
      dateTimeFormatOptions: { timeZone: "UTC", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
    })).toBe("Active work - May 6, 12:00 PM")
  })

  it("runs the route action against a session tracker adapter", () => {
    const active = [{
      id: "active-1",
      status: "active",
      startTime: 10,
    }]
    const completed = [{
      id: "done-1",
      status: "completed",
      startTime: 1,
      endTime: 5,
    }]
    const requestedLimits: number[] = []
    const diagnostics = {
      logError: () => {
        throw new Error("unexpected diagnostics log")
      },
    }

    expect(getAgentSessionCandidatesAction({ limit: "7" }, {
      service: {
        getActiveSessions: () => active,
        getRecentSessions: (limit) => {
          requestedLimits.push(limit)
          return completed
        },
      },
      diagnostics,
    })).toEqual({
      statusCode: 200,
      body: {
        activeSessions: active,
        completedSessions: completed,
      },
    })
    expect(requestedLimits).toEqual([7])

    const routeActions = createAgentSessionCandidateRouteActions({
      service: {
        getActiveSessions: () => active,
        getRecentSessions: (limit) => {
          requestedLimits.push(limit)
          return completed
        },
      },
      diagnostics,
    })
    expect(routeActions.getAgentSessionCandidates({ limit: "3" })).toEqual({
      statusCode: 200,
      body: {
        activeSessions: active,
        completedSessions: completed,
      },
    })
    expect(requestedLimits).toEqual([7, 3])
  })

  it("maps invalid limits and service failures to route errors", () => {
    const caughtFailure = new Error("tracker failed")
    const loggedErrors: unknown[] = []
    const diagnostics = {
      logError: (source: string, message: string, caughtError: unknown) => {
        loggedErrors.push({ source, message, caughtError })
      },
    }

    expect(getAgentSessionCandidatesAction({ limit: "bad" }, {
      service: {
        getActiveSessions: () => [],
        getRecentSessions: () => [],
      },
      diagnostics,
    })).toEqual({
      statusCode: 400,
      body: { error: "Session candidate limit must be a number" },
    })

    expect(getAgentSessionCandidatesAction(undefined, {
      service: {
        getActiveSessions: () => {
          throw caughtFailure
        },
        getRecentSessions: () => [],
      },
      diagnostics,
    })).toEqual({
      statusCode: 500,
      body: { error: "Failed to list agent session candidates" },
    })
    expect(loggedErrors).toEqual([{
      source: "agent-session-candidates",
      message: "Failed to list agent session candidates",
      caughtError: caughtFailure,
    }])
  })
})
