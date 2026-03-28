import { beforeEach, describe, expect, it, vi } from "vitest"

type MockAgentSession = {
  id: string
  conversationId?: string
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  startTime: number
  endTime?: number
  isSnoozed?: boolean
}

let activeSessions: MockAgentSession[] = []
let recentSessions: MockAgentSession[] = []

const getActiveSessionsMock = vi.fn(() => activeSessions)
const getRecentSessionsMock = vi.fn((limit?: number) =>
  recentSessions.slice(0, limit ?? recentSessions.length),
)
const getSessionMock = vi.fn((sessionId: string) =>
  activeSessions.find((session) => session.id === sessionId),
)
const clearCompletedSessionsMock = vi.fn(
  (shouldClear: (session: MockAgentSession) => boolean) => {
    recentSessions = recentSessions.filter((session) => !shouldClear(session))
  },
)
const stopTrackedSessionMock = vi.fn((sessionId: string) => {
  const session = activeSessions.find((entry) => entry.id === sessionId)
  if (!session) {
    return
  }

  activeSessions = activeSessions.filter((entry) => entry.id !== sessionId)
  recentSessions = [
    {
      ...session,
      status: "stopped",
      endTime: Date.now(),
    },
    ...recentSessions,
  ]
})
const stopSessionMock = vi.fn()
const getSessionRunIdMock = vi.fn(() => 17)
const cancelSessionApprovalsMock = vi.fn()
const getQueueMock = vi.fn((conversationId: string) =>
  conversationId === "conversation-with-queue" ? [{ id: "queued-message" }] : [],
)
const pauseQueueMock = vi.fn()
const emitAgentProgressMock = vi.fn(async () => undefined)
const cancelRunsByParentSessionMock = vi.fn(() => 2)
const getChildSubSessionsMock = vi.fn(() => [
  { id: "child-running", status: "running" },
  { id: "child-stopped", status: "stopped" },
])
const cancelSubSessionMock = vi.fn()
const logAppMock = vi.fn()
const logLLMMock = vi.fn()

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    getActiveSessions: getActiveSessionsMock,
    getRecentSessions: getRecentSessionsMock,
    getSession: getSessionMock,
    clearCompletedSessions: clearCompletedSessionsMock,
    stopSession: stopTrackedSessionMock,
  },
}))

vi.mock("./state", () => ({
  agentSessionStateManager: {
    stopSession: stopSessionMock,
    getSessionRunId: getSessionRunIdMock,
  },
  toolApprovalManager: {
    cancelSessionApprovals: cancelSessionApprovalsMock,
  },
}))

vi.mock("./message-queue-service", () => ({
  messageQueueService: {
    getQueue: getQueueMock,
    pauseQueue: pauseQueueMock,
  },
}))

vi.mock("./emit-agent-progress", () => ({
  emitAgentProgress: emitAgentProgressMock,
}))

vi.mock("./acp", () => ({
  acpClientService: {
    cancelRunsByParentSession: cancelRunsByParentSessionMock,
  },
}))

vi.mock("./acp/internal-agent", () => ({
  getChildSubSessions: getChildSubSessionsMock,
  cancelSubSession: cancelSubSessionMock,
}))

vi.mock("./debug", () => ({
  logApp: logAppMock,
  logLLM: logLLMMock,
}))

const sessionManagementModule = import("./agent-session-management")

describe("agent session management", () => {
  beforeEach(() => {
    activeSessions = [
      {
        id: "session-active-1",
        conversationId: "conversation-1",
        conversationTitle: "Triage bug",
        status: "active",
        startTime: 100,
        isSnoozed: true,
      },
      {
        id: "session-active-2",
        conversationTitle: "Write docs",
        status: "active",
        startTime: 200,
      },
    ]
    recentSessions = [
      {
        id: "session-recent-1",
        conversationId: "conversation-with-queue",
        conversationTitle: "Needs follow-up",
        status: "completed",
        startTime: 50,
        endTime: 75,
      },
      {
        id: "session-recent-2",
        conversationId: "conversation-clearable",
        conversationTitle: "Finished work",
        status: "completed",
        startTime: 60,
        endTime: 80,
      },
    ]
    getActiveSessionsMock.mockClear()
    getRecentSessionsMock.mockClear()
    getSessionMock.mockClear()
    clearCompletedSessionsMock.mockClear()
    stopTrackedSessionMock.mockClear()
    stopSessionMock.mockClear()
    getSessionRunIdMock.mockClear()
    cancelSessionApprovalsMock.mockClear()
    getQueueMock.mockClear()
    pauseQueueMock.mockClear()
    emitAgentProgressMock.mockClear()
    cancelRunsByParentSessionMock.mockClear()
    getChildSubSessionsMock.mockClear()
    cancelSubSessionMock.mockClear()
    logAppMock.mockClear()
    logLLMMock.mockClear()
  })

  it("builds tracked active/recent session snapshots through one helper", async () => {
    const { getManagedAgentSessions } = await sessionManagementModule

    expect(getManagedAgentSessions({ recentLimit: 1 })).toEqual({
      activeSessions,
      recentSessions: [recentSessions[0]],
    })
    expect(getActiveSessionsMock).toHaveBeenCalledTimes(1)
    expect(getRecentSessionsMock).toHaveBeenCalledWith(1)
  })

  it("resolves tracked sessions by exact ID, title prefix, and ambiguity", async () => {
    const { resolveManagedAgentSessionSelection } = await sessionManagementModule

    expect(
      resolveManagedAgentSessionSelection(activeSessions, "session-active-1"),
    ).toEqual({
      selectedSession: activeSessions[0],
    })
    expect(
      resolveManagedAgentSessionSelection(activeSessions, "write"),
    ).toEqual({
      selectedSession: activeSessions[1],
    })
    expect(
      resolveManagedAgentSessionSelection(
        [
          activeSessions[0],
          {
            id: "session-active-3",
            conversationTitle: "Triage docs",
            status: "active",
            startTime: 300,
          },
        ],
        "triage",
      ),
    ).toEqual({
      ambiguousSessions: [
        activeSessions[0],
        {
          id: "session-active-3",
          conversationTitle: "Triage docs",
          status: "active",
          startTime: 300,
        },
      ],
    })
  })

  it("keeps queued inactive sessions out of cleanup", async () => {
    const { clearManagedInactiveAgentSessions } = await sessionManagementModule

    expect(clearManagedInactiveAgentSessions()).toEqual({ clearedCount: 1 })
    expect(getQueueMock).toHaveBeenCalledWith("conversation-with-queue")
    expect(getQueueMock).toHaveBeenCalledWith("conversation-clearable")
    expect(recentSessions.map((session) => session.id)).toEqual([
      "session-recent-1",
    ])
  })

  it("stops a tracked session through one helper path", async () => {
    const { stopManagedAgentSession } = await sessionManagementModule

    await expect(stopManagedAgentSession("session-active-1")).resolves.toEqual({
      pausedConversationId: "conversation-1",
      session: expect.objectContaining({
        id: "session-active-1",
        conversationId: "conversation-1",
      }),
    })

    expect(stopSessionMock).toHaveBeenCalledWith("session-active-1")
    expect(cancelSessionApprovalsMock).toHaveBeenCalledWith("session-active-1")
    expect(cancelRunsByParentSessionMock).toHaveBeenCalledWith(
      "session-active-1",
    )
    expect(getChildSubSessionsMock).toHaveBeenCalledWith("session-active-1")
    expect(cancelSubSessionMock).toHaveBeenCalledWith("child-running")
    expect(cancelSubSessionMock).toHaveBeenCalledTimes(1)
    expect(pauseQueueMock).toHaveBeenCalledWith("conversation-1")
    expect(stopTrackedSessionMock).toHaveBeenCalledWith("session-active-1")
    expect(emitAgentProgressMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-active-1",
        runId: 17,
        isComplete: true,
        finalContent: "(Agent mode was stopped by emergency kill switch)",
      }),
    )
  })
})
