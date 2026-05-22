import type { AgentProgressUpdate } from "@shared/types"
import { tipcClient } from "@renderer/lib/tipc-client"
import { useAgentStore } from "@renderer/stores"

type SyntheticSessionUseCase = {
  id?: string
  title?: string
  finalContent?: string
  conversationHistory?: AgentProgressUpdate["conversationHistory"]
  steps?: Array<Partial<AgentProgressUpdate["steps"][number]>>
}

type CreateSyntheticSessionsOptions = {
  count?: number
  prefix?: string
  completed?: boolean
  messageRepeat?: number
  clearExisting?: boolean
  scenario?: string
  cases?: SyntheticSessionUseCase[]
}

type SessionE2EState = {
  sessionIds: string[]
  sessionCount: number
  focusedSessionId: string | null
  domNodes: number
  visibleRemoveButtons: number
  visibleStopButtons: number
}

type SessionE2EHarness = {
  ready: true
  createSyntheticSessions: (options?: CreateSyntheticSessionsOptions) => Promise<{
    sessionIds: string[]
    createMs: number
    firstPaintMs: number
  }>
  clearSyntheticSessions: () => void
  focusSession: (sessionId: string) => Promise<{ focusMs: number; focusedSessionId: string | null }>
  getState: () => SessionE2EState
}

declare global {
  interface Window {
    __dotagentsSessionE2E?: SessionE2EHarness
  }
}

const nextAnimationFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })

const waitForPaint = async () => {
  await nextAnimationFrame()
  await nextAnimationFrame()
}

const waitForSessionCount = async (count: number, timeoutMs = 5000) => {
  const deadline = performance.now() + timeoutMs
  while (performance.now() < deadline) {
    if (useAgentStore.getState().agentProgressById.size >= count) return true
    await new Promise<void>((resolve) => setTimeout(resolve, 25))
  }
  return useAgentStore.getState().agentProgressById.size >= count
}

function makeSyntheticProgress(
  sessionId: string,
  index: number,
  options: Required<Pick<CreateSyntheticSessionsOptions, "completed" | "messageRepeat">>,
  useCase?: SyntheticSessionUseCase,
): AgentProgressUpdate {
  const now = Date.now()
  const timestamp = now - index * 1000
  const title = useCase?.title || `E2E Session ${index + 1}`
  const body = `Synthetic session lifecycle payload ${index + 1}. `.repeat(options.messageRepeat)
  const completed = options.completed
  const baseStep: AgentProgressUpdate["steps"][number] = {
    id: `${sessionId}-step-1`,
    type: "thinking",
    title: completed ? "Completed synthetic work" : "Prepared synthetic work",
    description: body.slice(0, 180),
    status: "completed",
    timestamp,
    ...useCase?.steps?.[0],
  }
  const steps: AgentProgressUpdate["steps"] = completed
    ? [baseStep]
    : [
        {
          ...baseStep,
          status: (baseStep.status === "error" ? "error" : "completed") as AgentProgressUpdate["steps"][number]["status"],
        },
        {
          id: `${sessionId}-active-step`,
          type: "thinking",
          title: "Running synthetic use case",
          description: `Keeping ${title} active while switching between sessions. ${body.slice(0, 120)}`,
          status: "in_progress" as const,
          timestamp: timestamp + 1,
        },
      ]

  return {
    sessionId,
    runId: 1,
    conversationId: `e2e-conversation-${sessionId}`,
    conversationTitle: title,
    currentIteration: completed ? 1 : 0,
    maxIterations: 1,
    steps,
    isComplete: completed,
    finalContent: completed ? (useCase?.finalContent ?? `Done: ${body}`) : undefined,
    conversationHistory: useCase?.conversationHistory ?? [
      {
        role: "user",
        content: `Create synthetic session ${index + 1}`,
        timestamp: timestamp - 10,
      },
      {
        role: "assistant",
        content: completed ? `Synthetic response ${index + 1}. ${body}` : "Working…",
        timestamp,
      },
    ],
    conversationHistoryStartIndex: 0,
    conversationHistoryTotalCount: 2,
    streamingContent: completed
      ? undefined
      : {
          text: `Running ${title}. ${body.slice(0, 120)}`,
          isStreaming: true,
        },
    isSnoozed: false,
  }
}

function getSessionE2EState(): SessionE2EState {
  const state = useAgentStore.getState()
  return {
    sessionIds: Array.from(state.agentProgressById.keys()),
    sessionCount: state.agentProgressById.size,
    focusedSessionId: state.focusedSessionId,
    domNodes: document.getElementsByTagName("*").length,
    visibleRemoveButtons: document.querySelectorAll('[aria-label="Remove from sidebar"]').length,
    visibleStopButtons: document.querySelectorAll('[aria-label="Stop this agent session"]').length,
  }
}

export function installSessionE2EHarness(): void {
  if (typeof window === "undefined" || window.__dotagentsSessionE2E) return

  window.__dotagentsSessionE2E = {
    ready: true,

    async createSyntheticSessions(options = {}) {
      const count = Math.max(1, Math.floor(options.count ?? 12))
      const prefix = options.prefix?.trim() || `e2e-session-${Date.now()}`
      const completed = options.completed ?? true
      const messageRepeat = Math.max(1, Math.min(80, Math.floor(options.messageRepeat ?? 8)))
      const store = useAgentStore.getState()

      if (options.clearExisting) {
        store.clearAllProgress()
      }

      const startedAt = performance.now()
      let sessionIds = Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`)

      try {
        const result = await tipcClient.createSyntheticAgentSessionsForE2E({
          count,
          prefix,
          completed,
          messageRepeat,
          scenario: options.scenario,
          cases: options.cases,
        })
        if (Array.isArray(result?.sessionIds)) {
          sessionIds = result.sessionIds
        }
        await waitForSessionCount(count)
      } catch (error) {
        console.warn("[session-e2e-harness] Falling back to renderer-only synthetic sessions", error)
        for (const [index, sessionId] of sessionIds.entries()) {
          useAgentStore.getState().updateSessionProgress(
            makeSyntheticProgress(sessionId, index, { completed, messageRepeat }, options.cases?.[index]),
          )
        }
      }

      useAgentStore.getState().setFocusedSessionId(sessionIds[0] ?? null)
      useAgentStore.getState().setExpandedSessionId(sessionIds[0] ?? null)
      const createdAt = performance.now()
      await waitForPaint()

      return {
        sessionIds,
        createMs: createdAt - startedAt,
        firstPaintMs: performance.now() - startedAt,
      }
    },

    clearSyntheticSessions() {
      useAgentStore.getState().clearAllProgress()
    },

    async focusSession(sessionId: string) {
      const startedAt = performance.now()
      useAgentStore.getState().setFocusedSessionId(sessionId)
      useAgentStore.getState().setExpandedSessionId(sessionId)
      await waitForPaint()
      return {
        focusMs: performance.now() - startedAt,
        focusedSessionId: useAgentStore.getState().focusedSessionId,
      }
    },

    getState: getSessionE2EState,
  }
}
