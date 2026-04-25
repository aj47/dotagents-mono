import type { AgentProgressStep, AgentProgressUpdate, ConversationHistoryMessage } from "@shared/types"
import { useAgentStore } from "@renderer/stores"

export const DOTAGENTS_SESSION_SWITCH_PERF_HARNESS_KEY =
  "dotagents.sessionSwitchPerfHarness"
export const DOTAGENTS_SESSION_SWITCH_PERF_PRESEED_KEY =
  "dotagents.sessionSwitchPerfPreseed"

type SeedOptions = {
  sessionCount?: number
  messagesPerSession?: number
  messageChars?: number
  stepsPerSession?: number
  toolCallsEvery?: number
  titlePrefix?: string
}

type SwitchOptions = {
  framesToWait?: number
  maxFrameWaitMs?: number
}

type HarnessSnapshot = {
  sessionIds: string[]
  focusedSessionId: string | null
  expandedSessionId: string | null
  domNodes: number
  jsHeapUsedSize?: number
  jsHeapTotalSize?: number
  longTaskCount: number
}

type SwitchSample = HarnessSnapshot & {
  sessionId: string
  durationMs: number
  longTaskTotalMs: number
}

export type SessionSwitchPerfHarness = {
  seed: (options?: SeedOptions) => HarnessSnapshot
  clear: () => HarnessSnapshot
  snapshot: () => HarnessSnapshot
  switchTo: (sessionId: string, options?: SwitchOptions) => Promise<SwitchSample>
  getSessionIds: () => string[]
  drainLongTasks: () => Array<{ name: string; startTime: number; duration: number }>
}

declare global {
  interface Window {
    __DOTAGENTS_SESSION_SWITCH_PERF__?: SessionSwitchPerfHarness
  }
}

let installed = false
let longTasks: Array<{ name: string; startTime: number; duration: number }> = []
let longTaskObserver: PerformanceObserver | null = null

function isEnabled(): boolean {
  try {
    const params = new URLSearchParams(window.location.search)
    return (
      params.get("sessionSwitchPerfHarness") === "1" ||
      localStorage.getItem(DOTAGENTS_SESSION_SWITCH_PERF_HARNESS_KEY) === "true"
    )
  } catch {
    return false
  }
}

function parsePositiveInt(value: string | null | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined
}

function parsePreseedOptions(): SeedOptions | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const rawPreseed =
      params.get("sessionSwitchPerfPreseed") ??
      localStorage.getItem(DOTAGENTS_SESSION_SWITCH_PERF_PRESEED_KEY)
    if (!rawPreseed || rawPreseed === "false" || rawPreseed === "0") return null

    const fromJson = rawPreseed.trim().startsWith("{")
      ? JSON.parse(rawPreseed) as SeedOptions
      : {}
    const requestedMessages = parsePositiveInt(rawPreseed)
    const messagesPerSession =
      parsePositiveInt(params.get("sessionSwitchPerfMessages")) ??
      requestedMessages ??
      fromJson.messagesPerSession ??
      1000

    return {
      sessionCount: parsePositiveInt(params.get("sessionSwitchPerfSessions")) ?? fromJson.sessionCount ?? 1,
      messagesPerSession,
      messageChars: parsePositiveInt(params.get("sessionSwitchPerfMessageChars")) ?? fromJson.messageChars ?? 800,
      stepsPerSession: parsePositiveInt(params.get("sessionSwitchPerfSteps")) ?? fromJson.stepsPerSession ?? 80,
      toolCallsEvery: parsePositiveInt(params.get("sessionSwitchPerfToolCallsEvery")) ?? fromJson.toolCallsEvery ?? 8,
      titlePrefix: fromJson.titlePrefix ?? `Preseeded ${messagesPerSession}-message Session`,
    }
  } catch (error) {
    console.warn("[session-switch-perf] Ignoring invalid preseed options", error)
    return null
  }
}

function heapSnapshot(): Pick<HarnessSnapshot, "jsHeapUsedSize" | "jsHeapTotalSize"> {
  const memory = (performance as Performance & {
    memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number }
  }).memory
  return {
    jsHeapUsedSize: memory?.usedJSHeapSize,
    jsHeapTotalSize: memory?.totalJSHeapSize,
  }
}

function snapshot(): HarnessSnapshot {
  const state = useAgentStore.getState()
  return {
    sessionIds: Array.from(state.agentProgressById.keys()),
    focusedSessionId: state.focusedSessionId,
    expandedSessionId: state.expandedSessionId,
    domNodes: document.getElementsByTagName("*").length,
    longTaskCount: longTasks.length,
    ...heapSnapshot(),
  }
}

function makeText(label: string, targetLength: number): string {
  const chunk = `${label} lorem ipsum performance fixture with markdown **bold** and \`code\`. `
  return chunk.repeat(Math.max(1, Math.ceil(targetLength / chunk.length))).slice(0, targetLength)
}

function makeProgress(sessionIndex: number, options: Required<SeedOptions>): AgentProgressUpdate {
  const now = Date.now()
  const sessionId = `perf_session_${sessionIndex}_${now}`
  const conversationId = `perf_conversation_${sessionIndex}_${now}`
  const conversationHistory: ConversationHistoryMessage[] = Array.from({ length: options.messagesPerSession }, (_, messageIndex) => {
    const role: ConversationHistoryMessage["role"] = messageIndex % 2 === 0 ? "user" : "assistant"
    const hasToolCall = role === "assistant" && options.toolCallsEvery > 0 && messageIndex % options.toolCallsEvery === 1
    return {
      role,
      content: makeText(`${role} ${sessionIndex}.${messageIndex}`, options.messageChars),
      timestamp: now + messageIndex,
      branchMessageIndex: messageIndex,
      ...(hasToolCall
        ? {
            toolCalls: [{ name: "read_more_context", arguments: { query: `fixture ${messageIndex}` } }],
            toolResults: [{ success: true, content: makeText("tool result", Math.floor(options.messageChars / 2)) }],
          }
        : {}),
    }
  })
  const steps: AgentProgressStep[] = Array.from({ length: options.stepsPerSession }, (_, stepIndex) => ({
    id: `${sessionId}_step_${stepIndex}`,
    type: stepIndex % 5 === 0 ? "tool_call" : "thinking",
    title: stepIndex % 5 === 0 ? `Tool call ${stepIndex}` : `Thinking ${stepIndex}`,
    description: makeText(`step ${stepIndex}`, Math.min(240, options.messageChars)),
    status: stepIndex === options.stepsPerSession - 1 ? "in_progress" : "completed",
    timestamp: now + stepIndex,
  }))

  return {
    sessionId,
    conversationId,
    conversationTitle: `${options.titlePrefix} ${sessionIndex + 1}`,
    currentIteration: Math.max(1, options.stepsPerSession),
    maxIterations: Math.max(1, options.stepsPerSession + 10),
    steps,
    isComplete: false,
    conversationHistory,
    conversationHistoryTotalCount: conversationHistory.length,
    profileName: "Perf Harness",
    modelInfo: { provider: "fixture", model: "synthetic" },
    streamingContent: { text: makeText("streaming", Math.floor(options.messageChars / 3)), isStreaming: true },
  }
}

async function waitFrames(count: number, maxFrameWaitMs: number): Promise<void> {
  for (let index = 0; index < count; index++) {
    await new Promise<void>((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        resolve()
      }
      requestAnimationFrame(finish)
      setTimeout(finish, maxFrameWaitMs)
    })
  }
}

function installLongTaskObserver(): void {
  if (longTaskObserver || typeof PerformanceObserver === "undefined") return
  try {
    longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTasks.push({ name: entry.name, startTime: entry.startTime, duration: entry.duration })
      }
    })
    longTaskObserver.observe({ entryTypes: ["longtask"] })
  } catch {
    longTaskObserver = null
  }
}

export function initializeSessionSwitchPerfHarness(): () => void {
  if (installed || typeof window === "undefined" || !isEnabled()) return () => {}
  installed = true
  installLongTaskObserver()

  const harness: SessionSwitchPerfHarness = {
    seed: (rawOptions = {}) => {
      const options: Required<SeedOptions> = {
        sessionCount: rawOptions.sessionCount ?? 5,
        messagesPerSession: rawOptions.messagesPerSession ?? 100,
        messageChars: rawOptions.messageChars ?? 600,
        stepsPerSession: rawOptions.stepsPerSession ?? 50,
        toolCallsEvery: rawOptions.toolCallsEvery ?? 8,
        titlePrefix: rawOptions.titlePrefix ?? "Perf Session",
      }
      const state = useAgentStore.getState()
      state.clearAllProgress()
      longTasks = []
      const updates = Array.from({ length: options.sessionCount }, (_, index) => makeProgress(index, options))
      for (const update of updates) state.updateSessionProgress(update)
      const firstSessionId = updates[0]?.sessionId ?? null
      state.setFocusedSessionId(firstSessionId)
      state.setExpandedSessionId(firstSessionId)
      state.setViewedConversationId(updates[0]?.conversationId ?? null)
      return snapshot()
    },
    clear: () => {
      useAgentStore.getState().clearAllProgress()
      useAgentStore.getState().setViewedConversationId(null)
      longTasks = []
      return snapshot()
    },
    snapshot,
    switchTo: async (sessionId, options = {}) => {
      const beforeLongTaskCount = longTasks.length
      const start = performance.now()
      const state = useAgentStore.getState()
      const progress = state.agentProgressById.get(sessionId)
      if (!progress) throw new Error(`Unknown perf session: ${sessionId}`)
      state.setViewedConversationId(null)
      state.setFocusedSessionId(sessionId)
      state.setExpandedSessionId(sessionId)
      state.setViewedConversationId(progress.conversationId ?? null)
      await waitFrames(options.framesToWait ?? 2, options.maxFrameWaitMs ?? 250)
      const durationMs = performance.now() - start
      const newLongTasks = longTasks.slice(beforeLongTaskCount)
      return {
        ...snapshot(),
        sessionId,
        durationMs,
        longTaskTotalMs: newLongTasks.reduce((sum, entry) => sum + entry.duration, 0),
      }
    },
    getSessionIds: () => Array.from(useAgentStore.getState().agentProgressById.keys()),
    drainLongTasks: () => {
      const drained = longTasks
      longTasks = []
      return drained
    },
  }

  window.__DOTAGENTS_SESSION_SWITCH_PERF__ = harness
  console.info("[session-switch-perf] Harness installed")
  const preseedOptions = parsePreseedOptions()
  if (preseedOptions) {
    const seeded = harness.seed(preseedOptions)
    console.info("[session-switch-perf] Preseeded synthetic sessions", {
      sessionCount: seeded.sessionIds.length,
      messagesPerSession: preseedOptions.messagesPerSession,
    })
  }

  return () => {
    if (window.__DOTAGENTS_SESSION_SWITCH_PERF__ === harness) {
      delete window.__DOTAGENTS_SESSION_SWITCH_PERF__
    }
    longTaskObserver?.disconnect()
    longTaskObserver = null
    installed = false
  }
}