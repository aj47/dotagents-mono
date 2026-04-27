import { describe, expect, it } from "vitest"

import {
  filterPastSessionsAgainstActiveSessions,
  getSubagentParentSessionIdMap,
  getSessionIdsWithActiveChildProgress,
  getLatestAgentResponseTimestamp,
  hasUnreadAgentResponse,
  isSidebarSessionCurrentlyViewed,
  isTaskSession,
  nestSubagentSessionEntries,
  orderActiveSessionsByPinnedFirst,
  partitionPinnedAndUnpinnedTaskEntries,
  partitionTaskAndUserEntries,
} from "./sidebar-sessions"

const activeSession = (id: string, conversationId?: string) => ({
  id,
  conversationId,
})
const pastSession = (id: string, conversationId?: string) => ({
  session: { id, conversationId },
})

describe("orderActiveSessionsByPinnedFirst", () => {
  it("moves pinned active sessions to the top while preserving each group's order", () => {
    const ordered = orderActiveSessionsByPinnedFirst(
      [
        activeSession("session-1", "conversation-1"),
        activeSession("session-2", "conversation-2"),
        activeSession("session-3", "conversation-3"),
      ],
      new Set(["conversation-2"]),
    )

    expect(ordered.map((session) => session.id)).toEqual([
      "session-2",
      "session-1",
      "session-3",
    ])
  })
})

describe("getSubagentParentSessionIdMap", () => {
  it("infers child session parents from delegation progress", () => {
    const parentMap = getSubagentParentSessionIdMap(
      new Map([
        [
          "parent-1",
          {
            steps: [
              {
                id: "delegation-subagent-1",
                type: "tool_call",
                title: "Delegation",
                status: "in_progress",
                timestamp: 1,
                delegation: {
                  runId: "subagent-run-1",
                  subSessionId: "subagent-1",
                  agentName: "Internal",
                  task: "Ping",
                  status: "running",
                  startTime: 1,
                },
              },
            ],
          },
        ],
      ]),
    )

    expect(parentMap.get("subagent-1")).toBe("parent-1")
    expect(parentMap.get("subagent-run-1")).toBe("parent-1")
  })
})

describe("getSessionIdsWithActiveChildProgress", () => {
  it("marks a parent active while an inferred delegation is still running", () => {
    const activeParents = getSessionIdsWithActiveChildProgress(
      new Map([
        [
          "parent-1",
          {
            isComplete: true,
            steps: [
              {
                id: "delegation-1",
                type: "tool_call",
                title: "Delegation",
                status: "in_progress",
                timestamp: 1,
                delegation: {
                  runId: "child-run-1",
                  subSessionId: "child-1",
                  agentName: "Internal",
                  task: "Keep working",
                  status: "running",
                  startTime: 1,
                },
              },
            ],
          },
        ],
      ]),
    )

    expect(activeParents.has("parent-1")).toBe(true)
  })

  it("bubbles active nested subagent progress up to the root parent", () => {
    const activeParents = getSessionIdsWithActiveChildProgress(
      new Map([
        ["root", { isComplete: true, steps: [] }],
        [
          "child-1",
          {
            parentSessionId: "root",
            isComplete: true,
            steps: [],
          },
        ],
        [
          "child-2",
          {
            parentSessionId: "child-1",
            isComplete: false,
            steps: [],
          },
        ],
      ]),
    )

    expect(activeParents.has("child-1")).toBe(true)
    expect(activeParents.has("root")).toBe(true)
    expect(activeParents.has("child-2")).toBe(false)
  })

  it("does not mark a parent active for completed child delegation progress", () => {
    const activeParents = getSessionIdsWithActiveChildProgress(
      new Map([
        [
          "parent-1",
          {
            isComplete: true,
            steps: [
              {
                id: "delegation-1",
                type: "completion",
                title: "Delegation",
                status: "completed",
                timestamp: 2,
                delegation: {
                  runId: "child-run-1",
                  subSessionId: "child-1",
                  agentName: "Internal",
                  task: "Finished work",
                  status: "completed",
                  startTime: 1,
                  endTime: 2,
                },
              },
            ],
          },
        ],
      ]),
    )

    expect(activeParents.has("parent-1")).toBe(false)
  })
})

describe("nestSubagentSessionEntries", () => {
  it("places subagent entries directly under their parent with nesting metadata", () => {
    const ordered = nestSubagentSessionEntries([
      { session: { id: "session-new" } },
      { session: { id: "subagent-1", parentSessionId: "parent-1" } },
      { session: { id: "parent-1" } },
      { session: { id: "subagent-2", parentSessionId: "parent-1" } },
    ])

    expect(ordered.map((entry) => entry.session.id)).toEqual([
      "session-new",
      "parent-1",
      "subagent-1",
      "subagent-2",
    ])
    expect(ordered.map((entry) => entry.nestingDepth)).toEqual([0, 0, 1, 1])
    expect(ordered.map((entry) => entry.isSubagent)).toEqual([
      false,
      false,
      true,
      true,
    ])
  })

  it("leaves orphaned subagent entries at the top level", () => {
    const ordered = nestSubagentSessionEntries([
      { session: { id: "orphan-subagent", parentSessionId: "missing-parent" } },
    ])

    expect(ordered[0]).toMatchObject({
      session: { id: "orphan-subagent" },
      isSubagent: false,
      nestingDepth: 0,
    })
  })
})

describe("filterPastSessionsAgainstActiveSessions", () => {
  it("removes past entries whose conversation is already active", () => {
    const filtered = filterPastSessionsAgainstActiveSessions(
      [
        pastSession("history-1", "conversation-1"),
        pastSession("history-2", "conversation-2"),
      ],
      [activeSession("session-1", "conversation-1")],
    )

    expect(filtered).toEqual([pastSession("history-2", "conversation-2")])
  })

  it("removes fallback past entries whose session id is already active", () => {
    const filtered = filterPastSessionsAgainstActiveSessions(
      [pastSession("session-1"), pastSession("session-2")],
      [activeSession("session-1")],
    )

    expect(filtered).toEqual([pastSession("session-2")])
  })
})

describe("isSidebarSessionCurrentlyViewed", () => {
  it("marks a past session as viewed when its conversation is open", () => {
    expect(
      isSidebarSessionCurrentlyViewed(
        activeSession("history-1", "conversation-1"),
        {
          isPast: true,
          viewedConversationId: "conversation-1",
        },
      ),
    ).toBe(true)
  })

  it("marks an active session as viewed when it is focused or expanded", () => {
    expect(
      isSidebarSessionCurrentlyViewed(
        activeSession("session-2", "conversation-2"),
        {
          isPast: false,
          focusedSessionId: "session-2",
        },
      ),
    ).toBe(true)

    expect(
      isSidebarSessionCurrentlyViewed(
        activeSession("session-3", "conversation-3"),
        {
          isPast: false,
          expandedSessionId: "session-3",
        },
      ),
    ).toBe(true)
  })

  it("does not mark unrelated past sessions as viewed", () => {
    expect(
      isSidebarSessionCurrentlyViewed(
        activeSession("history-4", "conversation-4"),
        {
          isPast: true,
          viewedConversationId: "conversation-1",
        },
      ),
    ).toBe(false)
  })

  it("prefers the explicitly viewed conversation over stale focused active rows", () => {
    expect(
      isSidebarSessionCurrentlyViewed(
        activeSession("session-5", "conversation-5"),
        {
          isPast: false,
          focusedSessionId: "session-5",
          viewedConversationId: "conversation-1",
        },
      ),
    ).toBe(false)
  })
})

describe("isTaskSession", () => {
  it("flags sessions whose title carries the [Repeat] prefix", () => {
    expect(
      isTaskSession({ id: "s", conversationTitle: "[Repeat] Daily standup" }),
    ).toBe(true)
  })

  it("ignores sessions without the prefix", () => {
    expect(isTaskSession({ id: "s", conversationTitle: "Daily standup" })).toBe(
      false,
    )
    expect(isTaskSession({ id: "s" })).toBe(false)
  })
})

describe("partitionTaskAndUserEntries", () => {
  it("splits entries into user and task lists while preserving order", () => {
    const entries = [
      { session: { id: "u1", conversationTitle: "Hello" } },
      { session: { id: "t1", conversationTitle: "[Repeat] Cron" } },
      { session: { id: "u2", conversationTitle: "Quick question" } },
      { session: { id: "t2", conversationTitle: "[Repeat] Reports" } },
    ]
    const { userEntries, taskEntries } = partitionTaskAndUserEntries(entries)

    expect(userEntries.map((e) => e.session.id)).toEqual(["u1", "u2"])
    expect(taskEntries.map((e) => e.session.id)).toEqual(["t1", "t2"])
  })

  it("keeps delegated subagents with their task parent", () => {
    const entries = [
      { session: { id: "parent-task", conversationTitle: "[Repeat] Cron" } },
      { session: { id: "task-subagent", parentSessionId: "parent-task" } },
      { session: { id: "u1", conversationTitle: "Hello" } },
    ]
    const { userEntries, taskEntries } = partitionTaskAndUserEntries(entries)

    expect(userEntries.map((e) => e.session.id)).toEqual(["u1"])
    expect(taskEntries.map((e) => e.session.id)).toEqual([
      "parent-task",
      "task-subagent",
    ])
  })
})

describe("partitionPinnedAndUnpinnedTaskEntries", () => {
  it("returns all entries as unpinned when no pins are set", () => {
    const entries = [
      { session: { id: "t1", conversationId: "c1" } },
      { session: { id: "t2", conversationId: "c2" } },
    ]
    const { pinnedTaskEntries, unpinnedTaskEntries } =
      partitionPinnedAndUnpinnedTaskEntries(entries, new Set())

    expect(pinnedTaskEntries).toEqual([])
    expect(unpinnedTaskEntries.map((e) => e.session.id)).toEqual(["t1", "t2"])
  })

  it("splits entries by conversation pin state while preserving order", () => {
    const entries = [
      { session: { id: "t1", conversationId: "c1" } },
      { session: { id: "t2", conversationId: "c2" } },
      { session: { id: "t3", conversationId: "c3" } },
      { session: { id: "t4" } },
    ]
    const { pinnedTaskEntries, unpinnedTaskEntries } =
      partitionPinnedAndUnpinnedTaskEntries(entries, new Set(["c1", "c3"]))

    expect(pinnedTaskEntries.map((e) => e.session.id)).toEqual(["t1", "t3"])
    expect(unpinnedTaskEntries.map((e) => e.session.id)).toEqual(["t2", "t4"])
  })

  it("keeps delegated subagents with their pinned task parent", () => {
    const entries = [
      { session: { id: "parent-task", conversationId: "c1" } },
      {
        session: {
          id: "task-subagent",
          conversationId: "c2",
          parentSessionId: "parent-task",
        },
      },
      { session: { id: "other-task", conversationId: "c3" } },
    ]
    const { pinnedTaskEntries, unpinnedTaskEntries } =
      partitionPinnedAndUnpinnedTaskEntries(entries, new Set(["c1"]))

    expect(pinnedTaskEntries.map((e) => e.session.id)).toEqual([
      "parent-task",
      "task-subagent",
    ])
    expect(unpinnedTaskEntries.map((e) => e.session.id)).toEqual(["other-task"])
  })
})

describe("agent response unread helpers", () => {
  it("uses response events and assistant history as unread response timestamps", () => {
    const latestTimestamp = getLatestAgentResponseTimestamp({
      sessionId: "session-1",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: false,
      responseEvents: [
        {
          id: "response-1",
          sessionId: "session-1",
          ordinal: 1,
          text: "First",
          timestamp: 100,
        },
      ],
      conversationHistory: [
        { role: "user", content: "Hello", timestamp: 200 },
        { role: "assistant", content: "Second", timestamp: 300 },
      ],
    })

    expect(latestTimestamp).toBe(300)
  })

  it("marks a newer unseen agent response as unread", () => {
    const progress = {
      sessionId: "session-2",
      currentIteration: 1,
      maxIterations: 1,
      steps: [],
      isComplete: false,
      responseEvents: [
        {
          id: "response-2",
          sessionId: "session-2",
          ordinal: 1,
          text: "Look at this",
          timestamp: 250,
        },
      ],
    }

    expect(hasUnreadAgentResponse(progress, 100, false)).toBe(true)
    expect(hasUnreadAgentResponse(progress, 250, false)).toBe(false)
    expect(hasUnreadAgentResponse(progress, 100, true)).toBe(false)
  })
})
