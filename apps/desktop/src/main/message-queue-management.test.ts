import { beforeEach, describe, expect, it, vi } from "vitest"

type MockQueuedMessage = {
  id: string
  conversationId: string
  sessionId?: string
  text: string
  createdAt: number
  status: "pending" | "processing" | "cancelled" | "failed"
  errorMessage?: string
  addedToHistory?: boolean
}

type MockSession = {
  id: string
  status: "active" | "completed" | "error" | "stopped"
}

let queueState = new Map<string, MockQueuedMessage[]>()
let pausedConversations = new Set<string>()
let processingConversations = new Set<string>()
let sessionIdByConversation = new Map<string, string>()
let sessionsById = new Map<string, MockSession>()

const getQueueMock = vi.fn((conversationId: string) =>
  queueState.get(conversationId) || [],
)
const getAllQueuesMock = vi.fn(() =>
  Array.from(queueState.entries())
    .filter(([, messages]) => messages.length > 0)
    .map(([conversationId, messages]) => ({ conversationId, messages })),
)
const isQueuePausedMock = vi.fn((conversationId: string) =>
  pausedConversations.has(conversationId),
)
const removeFromQueueMock = vi.fn((conversationId: string, messageId: string) => {
  const queue = queueState.get(conversationId)
  if (!queue) return false
  const index = queue.findIndex((message) => message.id === messageId)
  if (index < 0 || queue[index]?.status === "processing") {
    return false
  }
  queue.splice(index, 1)
  if (queue.length === 0) {
    queueState.delete(conversationId)
  }
  return true
})
const clearQueueMock = vi.fn((conversationId: string) => {
  const queue = queueState.get(conversationId)
  if (!queue) return true
  if (queue.some((message) => message.status === "processing")) {
    return false
  }
  queueState.delete(conversationId)
  return true
})
const reorderQueueMock = vi.fn((conversationId: string, messageIds: string[]) => {
  const queue = queueState.get(conversationId)
  if (!queue) return false
  const messagesById = new Map(queue.map((message) => [message.id, message]))
  const reordered = messageIds
    .map((messageId) => messagesById.get(messageId))
    .filter((message): message is MockQueuedMessage => !!message)
  for (const message of queue) {
    if (!reordered.includes(message)) {
      reordered.push(message)
    }
  }
  queueState.set(conversationId, reordered)
  return true
})
const updateMessageTextMock = vi.fn(
  (conversationId: string, messageId: string, text: string) => {
    const queue = queueState.get(conversationId)
    const message = queue?.find((entry) => entry.id === messageId)
    if (!message || message.status === "processing" || message.addedToHistory) {
      return false
    }
    message.text = text
    if (message.status === "failed") {
      message.status = "pending"
      delete message.errorMessage
    }
    return true
  },
)
const resetToPendingMock = vi.fn((conversationId: string, messageId: string) => {
  const queue = queueState.get(conversationId)
  const message = queue?.find((entry) => entry.id === messageId)
  if (!message || message.status !== "failed") {
    return false
  }
  message.status = "pending"
  delete message.errorMessage
  return true
})
const pauseQueueMock = vi.fn((conversationId: string) => {
  pausedConversations.add(conversationId)
})
const resumeQueueMock = vi.fn((conversationId: string) => {
  pausedConversations.delete(conversationId)
})
const tryAcquireProcessingLockMock = vi.fn((conversationId: string) => {
  if (
    pausedConversations.has(conversationId) ||
    processingConversations.has(conversationId)
  ) {
    return false
  }
  processingConversations.add(conversationId)
  return true
})
const releaseProcessingLockMock = vi.fn((conversationId: string) => {
  processingConversations.delete(conversationId)
})
const peekMock = vi.fn((conversationId: string) => {
  const queue = queueState.get(conversationId)
  if (!queue?.length) return null
  return queue[0]?.status === "pending" ? queue[0] : null
})
const markProcessingMock = vi.fn((conversationId: string, messageId: string) => {
  const queue = queueState.get(conversationId)
  const message = queue?.find((entry) => entry.id === messageId)
  if (!message) return false
  message.status = "processing"
  return true
})
const markAddedToHistoryMock = vi.fn(
  (conversationId: string, messageId: string) => {
    const queue = queueState.get(conversationId)
    const message = queue?.find((entry) => entry.id === messageId)
    if (!message) return false
    message.addedToHistory = true
    return true
  },
)
const markProcessedMock = vi.fn((conversationId: string, messageId: string) => {
  const queue = queueState.get(conversationId)
  if (!queue) return false
  const index = queue.findIndex((entry) => entry.id === messageId)
  if (index < 0) return false
  queue.splice(index, 1)
  if (queue.length === 0) {
    queueState.delete(conversationId)
  }
  return true
})
const markFailedMock = vi.fn(
  (conversationId: string, messageId: string, errorMessage: string) => {
    const queue = queueState.get(conversationId)
    const message = queue?.find((entry) => entry.id === messageId)
    if (!message) return false
    message.status = "failed"
    message.errorMessage = errorMessage
    return true
  },
)
const findSessionByConversationIdMock = vi.fn((conversationId: string) =>
  sessionIdByConversation.get(conversationId),
)
const getSessionMock = vi.fn((sessionId: string) => sessionsById.get(sessionId))
const addManagedMessageToConversationMock = vi.fn(async () => ({ id: "added" }))
const logLLMMock = vi.fn()
const getErrorMessageMock = vi.fn((error: unknown) =>
  error instanceof Error ? error.message : String(error),
)

vi.mock("./message-queue-service", () => ({
  messageQueueService: {
    getQueue: getQueueMock,
    getAllQueues: getAllQueuesMock,
    isQueuePaused: isQueuePausedMock,
    removeFromQueue: removeFromQueueMock,
    clearQueue: clearQueueMock,
    reorderQueue: reorderQueueMock,
    updateMessageText: updateMessageTextMock,
    resetToPending: resetToPendingMock,
    pauseQueue: pauseQueueMock,
    resumeQueue: resumeQueueMock,
    tryAcquireProcessingLock: tryAcquireProcessingLockMock,
    releaseProcessingLock: releaseProcessingLockMock,
    peek: peekMock,
    markProcessing: markProcessingMock,
    markAddedToHistory: markAddedToHistoryMock,
    markProcessed: markProcessedMock,
    markFailed: markFailedMock,
  },
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    findSessionByConversationId: findSessionByConversationIdMock,
    getSession: getSessionMock,
  },
}))

vi.mock("./conversation-management", () => ({
  addManagedMessageToConversation: addManagedMessageToConversationMock,
}))

vi.mock("./debug", () => ({
  logLLM: logLLMMock,
}))

vi.mock("./error-utils", () => ({
  getErrorMessage: getErrorMessageMock,
}))

const queueManagementModule = import("./message-queue-management")

describe("message queue management", () => {
  beforeEach(() => {
    queueState = new Map()
    pausedConversations = new Set()
    processingConversations = new Set()
    sessionIdByConversation = new Map()
    sessionsById = new Map()

    getQueueMock.mockClear()
    getAllQueuesMock.mockClear()
    isQueuePausedMock.mockClear()
    removeFromQueueMock.mockClear()
    clearQueueMock.mockClear()
    reorderQueueMock.mockClear()
    updateMessageTextMock.mockClear()
    resetToPendingMock.mockClear()
    pauseQueueMock.mockClear()
    resumeQueueMock.mockClear()
    tryAcquireProcessingLockMock.mockClear()
    releaseProcessingLockMock.mockClear()
    peekMock.mockClear()
    markProcessingMock.mockClear()
    markAddedToHistoryMock.mockClear()
    markProcessedMock.mockClear()
    markFailedMock.mockClear()
    findSessionByConversationIdMock.mockClear()
    getSessionMock.mockClear()
    addManagedMessageToConversationMock.mockClear()
    addManagedMessageToConversationMock.mockResolvedValue({ id: "added" })
    logLLMMock.mockClear()
    getErrorMessageMock.mockClear()
  })

  it("builds queue snapshots with paused state through one helper", async () => {
    const { getManagedMessageQueue, getManagedMessageQueues } =
      await queueManagementModule

    queueState.set("conversation-1", [
      {
        id: "msg-1",
        conversationId: "conversation-1",
        text: "Queued note",
        createdAt: 10,
        status: "pending",
      },
    ])
    pausedConversations.add("conversation-1")

    expect(getManagedMessageQueue("conversation-1")).toEqual({
      conversationId: "conversation-1",
      messages: queueState.get("conversation-1"),
      isPaused: true,
    })
    expect(getManagedMessageQueues()).toEqual([
      {
        conversationId: "conversation-1",
        messages: queueState.get("conversation-1"),
        isPaused: true,
      },
    ])
  })

  it("resolves queued messages by exact id, prefix, and ambiguity", async () => {
    const { resolveManagedQueuedMessageSelection } = await queueManagementModule
    const messages: MockQueuedMessage[] = [
      {
        id: "msg-alpha",
        conversationId: "conversation-1",
        text: "Alpha task",
        createdAt: 10,
        status: "pending",
      },
      {
        id: "msg-beta",
        conversationId: "conversation-1",
        text: "Beta follow-up",
        createdAt: 20,
        status: "failed",
      },
      {
        id: "msg-bonus",
        conversationId: "conversation-1",
        text: "Beta blocker",
        createdAt: 30,
        status: "pending",
      },
    ]

    expect(
      resolveManagedQueuedMessageSelection(messages, "msg-alpha"),
    ).toEqual({
      selectedMessage: messages[0],
    })
    expect(resolveManagedQueuedMessageSelection(messages, "msg-b")).toEqual({
      ambiguousMessages: [messages[1], messages[2]],
    })
    expect(
      resolveManagedQueuedMessageSelection(messages, "alpha"),
    ).toEqual({
      selectedMessage: messages[0],
    })
  })

  it("flags edited failed messages for reprocessing only when the conversation is idle", async () => {
    const { updateManagedQueuedMessageText } = await queueManagementModule

    queueState.set("conversation-1", [
      {
        id: "msg-1",
        conversationId: "conversation-1",
        text: "Needs retry",
        createdAt: 10,
        status: "failed",
        errorMessage: "boom",
      },
    ])

    expect(
      updateManagedQueuedMessageText("conversation-1", "msg-1", "Retry now"),
    ).toEqual({
      success: true,
      shouldProcessQueue: true,
    })

    queueState.set("conversation-1", [
      {
        id: "msg-1",
        conversationId: "conversation-1",
        text: "Still blocked",
        createdAt: 10,
        status: "failed",
        errorMessage: "boom",
      },
    ])
    sessionIdByConversation.set("conversation-1", "session-active")
    sessionsById.set("session-active", {
      id: "session-active",
      status: "active",
    })

    expect(
      updateManagedQueuedMessageText(
        "conversation-1",
        "msg-1",
        "Retry after active session",
      ),
    ).toEqual({
      success: true,
      shouldProcessQueue: false,
    })
  })

  it("processes queued messages through the shared resume launcher", async () => {
    const { processManagedQueuedMessages } = await queueManagementModule
    const onQueuedMessageStartMock = vi.fn()
    const onQueuedMessageCompleteMock = vi.fn()
    const startResumeRunMock = vi.fn(async () => ({
      preparedContext: {
        conversationId: "conversation-1",
        sessionId: "session-fallback",
        reusedExistingSession: true,
      },
      runPromise: Promise.resolve({
        content: "Completed queued task",
        conversationId: "conversation-1",
        sessionId: "runtime-session",
        runId: 42,
        usedAcp: false,
      }),
    }))

    queueState.set("conversation-1", [
      {
        id: "msg-1",
        conversationId: "conversation-1",
        sessionId: "session-preferred",
        text: "Queued note",
        createdAt: 10,
        status: "pending",
      },
    ])
    sessionIdByConversation.set("conversation-1", "session-fallback")

    await expect(
      processManagedQueuedMessages({
        conversationId: "conversation-1",
        startResumeRun: startResumeRunMock,
        resolveStartSnoozed: () => false,
        onQueuedMessageStart: onQueuedMessageStartMock,
        onQueuedMessageComplete: onQueuedMessageCompleteMock,
      }),
    ).resolves.toEqual({
      processedCount: 1,
      failedMessageId: undefined,
      failedErrorMessage: undefined,
    })

    expect(addManagedMessageToConversationMock).toHaveBeenCalledWith(
      "conversation-1",
      "Queued note",
      "user",
    )
    expect(startResumeRunMock).toHaveBeenCalledWith({
      text: "Queued note",
      conversationId: "conversation-1",
      candidateSessionIds: ["session-preferred", "session-fallback"],
      startSnoozed: false,
    })
    expect(onQueuedMessageStartMock).toHaveBeenCalledTimes(1)
    expect(onQueuedMessageCompleteMock).toHaveBeenCalledTimes(1)
    expect(queueState.get("conversation-1")).toBeUndefined()
  })

  it("marks the current queued message as failed when the shared runner errors", async () => {
    const { processManagedQueuedMessages } = await queueManagementModule
    const onQueuedMessageFailureMock = vi.fn()
    const startResumeRunMock = vi.fn(async () => ({
      preparedContext: {
        conversationId: "conversation-1",
        sessionId: "runtime-session",
        reusedExistingSession: false,
      },
      runPromise: Promise.reject(new Error("runner blew up")),
    }))

    queueState.set("conversation-1", [
      {
        id: "msg-1",
        conversationId: "conversation-1",
        text: "Queued note",
        createdAt: 10,
        status: "pending",
      },
    ])

    await expect(
      processManagedQueuedMessages({
        conversationId: "conversation-1",
        startResumeRun: startResumeRunMock,
        onQueuedMessageFailure: onQueuedMessageFailureMock,
      }),
    ).resolves.toEqual({
      processedCount: 0,
      failedMessageId: "msg-1",
      failedErrorMessage: "runner blew up",
    })

    expect(onQueuedMessageFailureMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "msg-1" }),
      "runner blew up",
    )
    expect(queueState.get("conversation-1")).toEqual([
      expect.objectContaining({
        id: "msg-1",
        status: "failed",
        errorMessage: "runner blew up",
        addedToHistory: true,
      }),
    ])
  })
})
