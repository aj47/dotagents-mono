import { describe, expect, it } from "vitest"

import {
  assignSidebarSessionToGroup,
  dedupeTaskEntriesByTitle,
  filterPastSessionsAgainstActiveSessions,
  getSidebarSessionGroupKey,
  getSidebarActivityPresentation,
  getSidebarProgressTitle,
  getSubagentParentSessionIdMap,
  getSubagentTitleBySessionIdMap,
  groupSidebarSessionEntries,
  getSessionIdsWithActiveChildProgress,
  getLatestAgentResponseTimestamp,
  hasUnreadAgentResponse,
  isProgressLiveForSidebar,
  isSidebarSessionCurrentlyViewed,
  moveSidebarSessionToGroupPosition,
  isTaskSession,
  nestSubagentSessionEntries,
  normalizeSidebarSessionKeyOrder,
  normalizeSidebarSessionGroups,
  orderActiveSessionsByPinnedFirst,
  orderSidebarSessionEntriesByKeys,
  paginateSidebarEntries,
  partitionPinnedAndUnpinnedTaskEntries,
  partitionTaskAndUserEntries,
  reorderSidebarSessionGroups,
  reorderSidebarSessionKeys,
  summarizeSidebarSessionLifecycleStates,
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

describe("sidebar session groups", () => {
  it("uses conversation ids as stable group keys when available", () => {
    expect(getSidebarSessionGroupKey(activeSession("session-1", "conversation-1"))).toBe(
      "conversation:conversation-1",
    )
    expect(getSidebarSessionGroupKey(activeSession("session-2"))).toBe(
      "session:session-2",
    )
  })

  it("normalizes persisted groups and drops invalid duplicate data", () => {
    const groups = normalizeSidebarSessionGroups([
      {
        id: " group-1 ",
        name: "  Research ",
        expanded: false,
        sessionKeys: [" conversation:a ", "conversation:a", "", 42],
      },
      { id: "group-1", name: "Duplicate", sessionKeys: ["session:b"] },
      { id: "group-2", name: "", sessionKeys: ["session:c"] },
    ])

    expect(groups).toEqual([
      {
        id: "group-1",
        name: "Research",
        expanded: false,
        sessionKeys: ["conversation:a"],
      },
      {
        id: "group-2",
        name: "Untitled group",
        expanded: true,
        sessionKeys: ["session:c"],
      },
    ])
  })

  it("assigns a session to exactly one group and can ungroup it", () => {
    const groups = [
      { id: "group-a", name: "A", expanded: true, sessionKeys: ["session:one"] },
      { id: "group-b", name: "B", expanded: true, sessionKeys: [] },
    ]

    const assigned = assignSidebarSessionToGroup(groups, "session:one", "group-b")
    expect(assigned.map((group) => group.sessionKeys)).toEqual([[], ["session:one"]])

    const ungrouped = assignSidebarSessionToGroup(assigned, "session:one", null)
    expect(ungrouped.map((group) => group.sessionKeys)).toEqual([[], []])
  })

  it("reorders session keys before or after a target key", () => {
    expect(reorderSidebarSessionKeys(
      ["session:a", "session:b", "session:c"],
      "session:c",
      "session:a",
      "before",
    )).toEqual(["session:c", "session:a", "session:b"])

    expect(reorderSidebarSessionKeys(
      ["session:a", "session:b", "session:c"],
      "session:a",
      "session:c",
      "after",
    )).toEqual(["session:b", "session:c", "session:a"])
  })

  it("moves a session to a specific position in a target group", () => {
    const groups = [
      { id: "group-a", name: "A", expanded: true, sessionKeys: ["session:one"] },
      { id: "group-b", name: "B", expanded: true, sessionKeys: ["session:two", "session:three"] },
    ]

    const moved = moveSidebarSessionToGroupPosition(
      groups,
      "session:one",
      "group-b",
      "session:three",
      "before",
    )

    expect(moved.map((group) => group.sessionKeys)).toEqual([
      [],
      ["session:two", "session:one", "session:three"],
    ])
  })

  it("reorders groups before or after a target group", () => {
    const groups = [
      { id: "group-a", name: "A", expanded: true, sessionKeys: [] },
      { id: "group-b", name: "B", expanded: true, sessionKeys: [] },
      { id: "group-c", name: "C", expanded: true, sessionKeys: [] },
    ]

    expect(reorderSidebarSessionGroups(groups, "group-c", "group-a", "before").map((group) => group.id)).toEqual([
      "group-c",
      "group-a",
      "group-b",
    ])

    expect(reorderSidebarSessionGroups(groups, "group-a", "group-c", "after").map((group) => group.id)).toEqual([
      "group-b",
      "group-c",
      "group-a",
    ])
  })

  it("orders ungrouped entries by persisted session keys while preserving new entries", () => {
    const entries = [
      { session: activeSession("session-1", "conversation-1") },
      { session: activeSession("session-2") },
      { session: activeSession("session-3") },
    ]

    expect(orderSidebarSessionEntriesByKeys(entries, [
      "session:session-3",
      "conversation:conversation-1",
    ]).map((entry) => entry.session.id)).toEqual([
      "session-3",
      "session-1",
      "session-2",
    ])
  })

  it("normalizes persisted ungrouped session key order", () => {
    expect(normalizeSidebarSessionKeyOrder([
      " session:one ",
      "session:one",
      "",
      42,
      "conversation:two",
    ])).toEqual(["session:one", "conversation:two"])
  })

  it("builds grouped sections and leaves unmatched sessions ungrouped", () => {
    const entries = [
      { session: activeSession("session-1", "conversation-1") },
      { session: activeSession("session-2") },
      { session: activeSession("session-3") },
    ]
    const result = groupSidebarSessionEntries(entries, [
      {
        id: "group-a",
        name: "A",
        expanded: true,
        sessionKeys: ["session:2-missing", "session:session-2", "conversation:conversation-1"],
      },
    ])

    expect(result.groupedSections[0]?.entries.map((entry) => entry.session.id)).toEqual([
      "session-2",
      "session-1",
    ])
    expect(result.ungroupedEntries.map((entry) => entry.session.id)).toEqual([
      "session-3",
    ])
  })

  it("keeps a session in its first matching group when persisted data duplicates it", () => {
    const entries = [
      { session: activeSession("session-1") },
      { session: activeSession("session-2") },
    ]
    const result = groupSidebarSessionEntries(entries, [
      { id: "group-a", name: "A", expanded: true, sessionKeys: ["session:session-1"] },
      {
        id: "group-b",
        name: "B",
        expanded: true,
        sessionKeys: ["session:session-1", "session:session-2"],
      },
    ])

    expect(result.groupedSections.map((section) =>
      section.entries.map((entry) => entry.session.id),
    )).toEqual([["session-1"], ["session-2"]])
  })

  it("summarizes group lifecycle counts in urgency-first order", () => {
    expect(
      summarizeSidebarSessionLifecycleStates([
        "complete",
        "running",
        "needs_input",
        "complete",
        "blocked",
        "running",
      ]),
    ).toEqual([
      { state: "needs_input", count: 1 },
      { state: "blocked", count: 1 },
      { state: "running", count: 2 },
      { state: "complete", count: 2 },
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

describe("getSubagentTitleBySessionIdMap", () => {
  it("uses delegated task text as the title for subagent session ids", () => {
    const titles = getSubagentTitleBySessionIdMap(
      new Map([
        [
          "parent-1",
          {
            steps: [
              {
                id: "delegation-subagent-1",
                type: "tool_call",
                title: "Delegation",
                status: "completed",
                timestamp: 1,
                delegation: {
                  runId: "subagent-run-1",
                  subSessionId: "subagent-1",
                  agentName: "Internal",
                  task: "Summarize trace failures",
                  status: "completed",
                  startTime: 1,
                },
              },
            ],
          },
        ],
      ]),
    )

    expect(titles.get("subagent-1")).toBe("Summarize trace failures")
    expect(titles.get("subagent-run-1")).toBe("Summarize trace failures")
  })
})

describe("getSidebarProgressTitle", () => {
  it("prefers explicit title, then delegation task, then first user message", () => {
    const delegationTitles = new Map([["subagent-1", "Delegated research task"]])

    expect(
      getSidebarProgressTitle(
        "subagent-1",
        { conversationTitle: "Explicit", steps: [] },
        delegationTitles,
      ),
    ).toBe("Explicit")

    expect(
      getSidebarProgressTitle("subagent-1", { steps: [] }, delegationTitles),
    ).toBe("Delegated research task")

    expect(
      getSidebarProgressTitle(
        "session-1",
        {
          steps: [],
          conversationHistory: [
            { role: "user", content: "Find the root cause", timestamp: 1 },
          ],
        },
        delegationTitles,
      ),
    ).toBe("Find the root cause")
  })

  it("ignores generic continuation placeholders when real conversation text exists", () => {
    expect(
      getSidebarProgressTitle(
        "session-1",
        {
          conversationTitle: "Continue Conversation",
          steps: [],
          conversationHistory: [
            { role: "user", content: "Fix the failing sidebar error preview", timestamp: 1 },
          ],
        },
        new Map(),
      ),
    ).toBe("Fix the failing sidebar error preview")
  })
})

describe("getSidebarActivityPresentation", () => {
  it("prefers live tool-call state with the tool name over stale response text", () => {
    const activity = getSidebarActivityPresentation({
      isComplete: false,
      userResponse: "Older visible response",
      steps: [
        {
          id: "tool-1",
          type: "tool_call",
          title: "Reading file",
          description: "Inspecting active-agents-sidebar.tsx",
          status: "in_progress",
          timestamp: 2,
          toolCall: { name: "functions.view", arguments: { path: "file.ts" } },
        },
      ],
    })

    expect(activity).toMatchObject({
      kind: "tool_call",
      label: "Using view",
      detail: "Inspecting active-agents-sidebar.tsx",
      isForegroundActivity: true,
    })
  })

  it("prefers an active tool call over a newer thinking step", () => {
    const activity = getSidebarActivityPresentation({
      isComplete: false,
      steps: [
        {
          id: "tool-1",
          type: "tool_call",
          title: "Reading file",
          description: "Inspecting source",
          status: "in_progress",
          timestamp: 2,
          toolCall: { name: "functions.view", arguments: { path: "file.ts" } },
        },
        {
          id: "thinking-1",
          type: "thinking",
          title: "Thinking",
          description: "Agent is thinking...",
          status: "in_progress",
          timestamp: 3,
        },
      ],
    })

    expect(activity).toMatchObject({
      kind: "tool_call",
      label: "Using view",
      detail: "Inspecting source",
      isForegroundActivity: true,
    })
  })

  it("prefers concrete error text over generic errored thinking copy", () => {
    const activity = getSidebarActivityPresentation({
      isComplete: true,
      finalContent: "Error: MCP server failed to connect",
      steps: [
        {
          id: "thinking-1",
          type: "thinking",
          title: "Analyzing request",
          description: "Processing your request and determining next steps",
          status: "error",
          timestamp: 1,
        },
      ],
    })

    expect(activity).toMatchObject({
      kind: "blocked",
      label: "Error",
      detail: "MCP server failed to connect",
      isForegroundActivity: true,
    })
  })

  it("uses fallback session error text when session status is blocked but progress has no error step", () => {
    const activity = getSidebarActivityPresentation(
      {
        isComplete: false,
        steps: [
          {
            id: "thinking-1",
            type: "thinking",
            title: "Analyzing request",
            description: "Processing your request and determining next steps",
            status: "in_progress",
            timestamp: 1,
          },
        ],
      },
      { fallbackErrorText: "Request timed out while starting the run" },
    )

    expect(activity).toMatchObject({
      kind: "blocked",
      label: "Error",
      detail: "Request timed out while starting the run",
      isForegroundActivity: true,
    })
  })

  it("surfaces final user-facing responses before summaries or completed tool steps", () => {
    const activity = getSidebarActivityPresentation({
      isComplete: true,
      userResponse: "Here is the final answer.",
      latestSummary: {
        id: "summary-1",
        sessionId: "session-1",
        stepNumber: 3,
        timestamp: 3,
        actionSummary: "Updated files",
      },
      steps: [
        {
          id: "tool-1",
          type: "tool_call",
          title: "Edited code",
          status: "completed",
          timestamp: 2,
          toolCall: { name: "apply_patch", arguments: {} },
        },
      ],
    })

    expect(activity).toMatchObject({
      kind: "response",
      label: "Response",
      detail: "Here is the final answer.",
      isForegroundActivity: false,
    })
  })

  it("marks thinking and delegation as foreground activity", () => {
    expect(
      getSidebarActivityPresentation({
        isComplete: false,
        steps: [
          {
            id: "thinking-1",
            type: "thinking",
            title: "Thinking",
            description: "Planning the state model",
            status: "in_progress",
            timestamp: 1,
          },
        ],
      }),
    ).toMatchObject({ kind: "thinking", label: "Thinking", isForegroundActivity: true })

    expect(
      getSidebarActivityPresentation({
        isComplete: false,
        steps: [
          {
            id: "subagent-1",
            type: "tool_call",
            title: "Delegating",
            status: "in_progress",
            timestamp: 1,
            delegation: {
              runId: "run-1",
              agentName: "explore",
              task: "Find sidebar state code",
              status: "running",
              startTime: 1,
            },
          },
        ],
      }),
    ).toMatchObject({
      kind: "delegation",
      label: "Subagent",
      detail: "Find sidebar state code",
      isForegroundActivity: true,
    })
  })

  it("shows thinking detail for active sessions before the first step or stream arrives", () => {
    const activity = getSidebarActivityPresentation({
      isComplete: false,
      steps: [],
    })

    expect(activity).toMatchObject({
      kind: "thinking",
      label: "Thinking",
      detail: "Thinking...",
      isForegroundActivity: true,
    })
  })
})

describe("sidebar progress lifecycle helpers", () => {
  it("distinguishes live progress from completed progress", () => {
    const completedProgress = { isComplete: true, steps: [] }

    expect(isProgressLiveForSidebar(completedProgress)).toBe(false)
  })

  it("treats running progress as live", () => {
    expect(isProgressLiveForSidebar({ isComplete: false, steps: [] })).toBe(true)
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

  it("nests orphaned internal subsessions under the root session for the shared conversation", () => {
    const ordered = nestSubagentSessionEntries([
      {
        session: {
          id: "subsession_1",
          conversationId: "conversation-1",
        },
      },
      {
        session: {
          id: "session-1",
          conversationId: "conversation-1",
        },
      },
    ])

    expect(ordered.map((entry) => entry.session.id)).toEqual([
      "session-1",
      "subsession_1",
    ])
    expect(ordered.map((entry) => entry.isSubagent)).toEqual([false, true])
    expect(ordered.map((entry) => entry.nestingDepth)).toEqual([0, 1])
  })

  it("nests an active child under a saved pinned parent when both groups are combined", () => {
    const ordered = nestSubagentSessionEntries([
      {
        session: { id: "child", parentSessionId: "parent" },
        isSavedConversation: false,
      },
      {
        session: { id: "parent", conversationId: "parent-c" },
        isSavedConversation: true,
      },
    ])

    expect(ordered.map((entry) => entry.session.id)).toEqual(["parent", "child"])
    expect(ordered.map((entry) => entry.isSubagent)).toEqual([false, true])
    expect(ordered.map((entry) => entry.nestingDepth)).toEqual([0, 1])
  })

  it("falls back to a shared conversation when the saved parent uses the conversation id", () => {
    const ordered = nestSubagentSessionEntries([
      {
        session: {
          id: "child",
          parentSessionId: "runtime-parent",
          conversationId: "parent-c",
        },
        isSavedConversation: false,
      },
      {
        session: { id: "parent-c", conversationId: "parent-c" },
        isSavedConversation: true,
      },
    ])

    expect(ordered.map((entry) => entry.session.id)).toEqual(["parent-c", "child"])
    expect(ordered.map((entry) => entry.isSubagent)).toEqual([false, true])
    expect(ordered.map((entry) => entry.nestingDepth)).toEqual([0, 1])
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

  it("uses configured repeat-task titles as a fallback for sessions already retitled without the prefix", () => {
    const entries = [
      { session: { id: "t1", conversationTitle: "Conversation Knowledge Review" } },
      { session: { id: "u1", conversationTitle: "Hello" } },
    ]

    const { userEntries, taskEntries } = partitionTaskAndUserEntries(
      entries,
      new Set(["Conversation Knowledge Review"]),
    )

    expect(userEntries.map((e) => e.session.id)).toEqual(["u1"])
    expect(taskEntries.map((e) => e.session.id)).toEqual(["t1"])
  })

  it("uses the backend repeat-task flag when title matching is unavailable", () => {
    const entries = [
      { session: { id: "t1", conversationTitle: "Generated Title", isRepeatTask: true } },
      { session: { id: "u1", conversationTitle: "Generated Title" } },
    ]

    const { userEntries, taskEntries } = partitionTaskAndUserEntries(entries)

    expect(userEntries.map((e) => e.session.id)).toEqual(["u1"])
    expect(taskEntries.map((e) => e.session.id)).toEqual(["t1"])
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

describe("dedupeTaskEntriesByTitle", () => {
  it("keeps the active run when repeat-task history has the same title", () => {
    const entries = [
      { session: { id: "active", conversationTitle: "[Repeat] Chess Trainer", status: "active", startTime: 300 } },
      { session: { id: "stopped", conversationTitle: "[Repeat] Chess Trainer", status: "stopped", startTime: 200, endTime: 250 } },
      { session: { id: "completed", conversationTitle: "[Repeat] Chess Trainer", status: "completed", startTime: 100, endTime: 150 } },
    ]

    expect(dedupeTaskEntriesByTitle(entries).map((e) => e.session.id)).toEqual(["active"])
  })

  it("keeps the newest historical run when no active run exists", () => {
    const entries = [
      { session: { id: "older", conversationTitle: "Serendipity Engine Run", status: "completed", startTime: 100, endTime: 150 } },
      { session: { id: "newer", conversationTitle: "Serendipity Engine Run", status: "completed", startTime: 200, endTime: 250 } },
    ]

    expect(dedupeTaskEntriesByTitle(entries).map((e) => e.session.id)).toEqual(["newer"])
  })

  it("prefers the parent session over a newer subsession that adopted the same title", () => {
    const entries = [
      { session: { id: "session_parent", conversationTitle: "[Repeat] Fix Auth Sync", status: "active", startTime: 100 } },
      { session: { id: "subsession_child", conversationTitle: "[Repeat] Fix Auth Sync", status: "active", startTime: 200, parentSessionId: "session_parent" } },
    ]

    expect(dedupeTaskEntriesByTitle(entries).map((e) => e.session.id)).toEqual(["session_parent"])
  })

  it("prefers a top-level entry over an entry with a parentSessionId set", () => {
    const entries = [
      { session: { id: "child", conversationTitle: "Shared Title", status: "active", startTime: 300, parentSessionId: "parent" } },
      { session: { id: "top", conversationTitle: "Shared Title", status: "active", startTime: 100 } },
    ]

    expect(dedupeTaskEntriesByTitle(entries).map((e) => e.session.id)).toEqual(["top"])
  })
})

describe("paginateSidebarEntries", () => {
  it("always keeps active and pinned saved entries while limiting unpinned saved history", () => {
    const entries = [
      { session: { id: "active", conversationId: "active-c" }, isSavedConversation: false },
      { session: { id: "pinned", conversationId: "pinned-c" }, isSavedConversation: true },
      { session: { id: "saved-1", conversationId: "saved-c-1" }, isSavedConversation: true },
      { session: { id: "saved-2", conversationId: "saved-c-2" }, isSavedConversation: true },
    ]

    const paginated = paginateSidebarEntries(entries, new Set(["pinned-c"]), 1)

    expect(paginated.visibleEntries.map((entry) => entry.session.id)).toEqual([
      "active",
      "pinned",
      "saved-1",
    ])
    expect(paginated.hasMoreEntries).toBe(true)
  })

  it("keeps pinned saved entries visible when active rows fill the default page", () => {
    const entries = [
      { session: { id: "active-1", conversationId: "active-c-1" }, isSavedConversation: false },
      { session: { id: "active-2", conversationId: "active-c-2" }, isSavedConversation: false },
      { session: { id: "active-3", conversationId: "active-c-3" }, isSavedConversation: false },
      { session: { id: "active-4", conversationId: "active-c-4" }, isSavedConversation: false },
      { session: { id: "active-pin", conversationId: "active-pin-c" }, isSavedConversation: false },
      { session: { id: "pinned-1", conversationId: "pinned-c-1" }, isSavedConversation: true },
      { session: { id: "pinned-2", conversationId: "pinned-c-2" }, isSavedConversation: true },
      { session: { id: "saved-1", conversationId: "saved-c-1" }, isSavedConversation: true },
    ]

    const paginated = paginateSidebarEntries(
      entries,
      new Set(["active-pin-c", "pinned-c-1", "pinned-c-2"]),
      0,
    )

    expect(paginated.visibleEntries.map((entry) => entry.session.id)).toEqual([
      "active-1",
      "active-2",
      "active-3",
      "active-4",
      "active-pin",
      "pinned-1",
      "pinned-2",
    ])
    expect(paginated.hasMoreEntries).toBe(true)
  })

  it("counts saved subagents with their pinned parent against the saved limit", () => {
    const entries = [
      { session: { id: "parent", conversationId: "parent-c" }, isSavedConversation: true },
      { session: { id: "child", parentSessionId: "parent" }, isSavedConversation: true },
      { session: { id: "saved", conversationId: "saved-c" }, isSavedConversation: true },
    ]

    const paginated = paginateSidebarEntries(entries, new Set(["parent-c"]), 1)

    expect(paginated.visibleEntries.map((entry) => entry.session.id)).toEqual([
      "parent",
      "child",
    ])
    expect(paginated.hasMoreEntries).toBe(true)
  })

  it("keeps grouped pinned saved entries available before grouping", () => {
    const paginated = paginateSidebarEntries(
      [
        { session: { id: "active", conversationId: "active-c" }, isSavedConversation: false },
        { session: { id: "pinned", conversationId: "pinned-c" }, isSavedConversation: true },
      ],
      new Set(["pinned-c"]),
      0,
    )

    const grouped = groupSidebarSessionEntries(paginated.visibleEntries, [
      {
        id: "personal",
        name: "Personal",
        expanded: true,
        sessionKeys: ["conversation:pinned-c"],
      },
    ])

    expect(grouped.groupedSections[0]?.entries.map((entry) => entry.session.id)).toEqual([
      "pinned",
    ])
  })

  it("keeps grouped unpinned saved entries available before grouping", () => {
    const groupedSessionKeys = new Set(["conversation:personal-c"])
    const paginated = paginateSidebarEntries(
      [
        { session: { id: "active", conversationId: "active-c" }, isSavedConversation: false },
        { session: { id: "personal", conversationId: "personal-c" }, isSavedConversation: true },
        { session: { id: "hidden", conversationId: "hidden-c" }, isSavedConversation: true },
      ],
      new Set(),
      0,
      groupedSessionKeys,
    )

    const grouped = groupSidebarSessionEntries(paginated.visibleEntries, [
      {
        id: "personal",
        name: "Personal",
        expanded: true,
        sessionKeys: ["conversation:personal-c"],
      },
    ])

    expect(paginated.visibleEntries.map((entry) => entry.session.id)).toEqual([
      "active",
      "personal",
    ])
    expect(paginated.hasMoreEntries).toBe(true)
    expect(grouped.groupedSections[0]?.entries.map((entry) => entry.session.id)).toEqual([
      "personal",
    ])
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

  it("falls back to summary or step timestamps for untimestamped final responses", () => {
    const latestTimestamp = getLatestAgentResponseTimestamp({
      sessionId: "session-untimestamped",
      currentIteration: 1,
      maxIterations: 1,
      steps: [
        {
          id: "completion-1",
          type: "completion",
          title: "Done",
          status: "completed",
          timestamp: 450,
        },
      ],
      isComplete: true,
      userResponse: "Here is the final answer.",
      latestSummary: {
        id: "summary-untimestamped",
        sessionId: "session-untimestamped",
        stepNumber: 1,
        timestamp: 400,
        actionSummary: "Completed the run",
      },
    })

    expect(latestTimestamp).toBe(450)
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
