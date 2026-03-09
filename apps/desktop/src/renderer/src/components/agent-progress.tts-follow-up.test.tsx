import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { AgentProgressUpdate } from "../../../shared/types"
import { clearSessionTTSTracking } from "../lib/tts-tracking"

type EffectRecord = { callback?: () => void | (() => void); deps?: any[]; nextDeps?: any[]; cleanup?: void | (() => void); hasRun: boolean }

function createHookRuntime() {
  const states: any[] = []; const refs: Array<{ current: any }> = []; const effects: EffectRecord[] = []
  let stateIndex = 0; let refIndex = 0; let effectIndex = 0
  const depsChanged = (prev?: any[], next?: any[]) => !prev || !next || prev.length !== next.length || prev.some((value, index) => !Object.is(value, next[index]))
  const useState = <T,>(initial: T | (() => T)) => { const idx = stateIndex++; if (states[idx] === undefined) states[idx] = typeof initial === "function" ? (initial as () => T)() : initial; return [states[idx] as T, (update: T | ((prev: T) => T)) => { states[idx] = typeof update === "function" ? (update as (prev: T) => T)(states[idx]) : update }] as const }
  const useRef = <T,>(initial: T) => { const idx = refIndex++; refs[idx] ??= { current: initial }; return refs[idx] as { current: T } }
  const useEffectImpl = (callback: () => void | (() => void), deps?: any[]) => { const idx = effectIndex++; const record = effects[idx] ?? { hasRun: false }; record.callback = callback; record.nextDeps = deps; effects[idx] = record }
  const reactMock: any = { __esModule: true, default: {} as any, useState, useRef, useEffect: useEffectImpl, useLayoutEffect: useEffectImpl, useMemo: (factory: any) => factory(), useCallback: (fn: any) => fn, memo: (component: any) => component }
  reactMock.default = reactMock
  const Fragment = Symbol.for("react.fragment")
  const invoke = (type: any, props: any) => type === Fragment ? props?.children ?? null : typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {} }
  return {
    render<P,>(Component: (props: P) => any, props: P) { stateIndex = 0; refIndex = 0; effectIndex = 0; return Component(props) },
    commitEffects() { for (const record of effects) { if (!record?.callback) continue; const shouldRun = !record.hasRun || depsChanged(record.deps, record.nextDeps); if (!shouldRun) continue; if (typeof record.cleanup === "function") record.cleanup(); record.cleanup = record.callback(); record.deps = record.nextDeps; record.hasRun = true } },
    reactMock,
    jsxRuntimeMock: { __esModule: true, Fragment, jsx: invoke, jsxs: invoke, jsxDEV: invoke },
  }
}

async function flushPromises() { await Promise.resolve(); await Promise.resolve() }

async function loadAgentProgress(runtime: ReturnType<typeof createHookRuntime>) {
  vi.resetModules()
  const Null = () => null
  const audioPlayerProps: any[] = []
  const generateSpeech = vi.fn(async ({ text }: { text: string }) => ({ audio: new TextEncoder().encode(text).buffer }))
  const storeState = { agentProgressById: new Map(), setFocusedSessionId: vi.fn(), setSessionSnoozed: vi.fn() }
  const tipcClientMock = { tipcClient: { generateSpeech, setPanelFocusable: vi.fn(), stopAgentSession: vi.fn(), emergencyStopAgent: vi.fn(), snoozeAgentSession: vi.fn(), hidePanelWindow: vi.fn(), clearAgentSessionProgress: vi.fn(), closeAgentModeAndHidePanelWindow: vi.fn(), respondToToolApproval: vi.fn(), unsnoozeAgentSession: vi.fn(), focusAgentSession: vi.fn() } }
  const clipboardMock = { copyTextToClipboard: vi.fn(async () => undefined) }
  const storesMock = { useAgentStore: (selector: any) => selector(storeState), useMessageQueue: () => [], useIsQueuePaused: () => false }
  const audioPlayerMock = { AudioPlayer: (props: any) => { audioPlayerProps.push(props); return { type: "AudioPlayer", props } } }
  const queriesMock = { useConfigQuery: () => ({ data: { ttsEnabled: true, ttsAutoPlay: true, dualModelEnabled: false } }) }
  const themeMock = { useTheme: () => ({ isDark: false }) }
  const debugMock = { logUI: vi.fn(), logExpand: vi.fn() }
  const messageQueueMock = { MessageQueuePanel: Null }
  const resizableMock = { useResizable: () => ({ height: 480, isResizing: false, handleHeightResizeStart: vi.fn() }), TILE_DIMENSIONS: { height: { default: 480, min: 240, max: 960 } } }
  const ttsManagerMock = { ttsManager: { stopAll: vi.fn() } }
  vi.doMock("react", () => runtime.reactMock)
  vi.doMock("react/jsx-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("react/jsx-dev-runtime", () => runtime.jsxRuntimeMock)
  vi.doMock("lucide-react", () => { const Icon = () => null; return { ChevronDown: Icon, ChevronUp: Icon, ChevronRight: Icon, X: Icon, AlertTriangle: Icon, Minimize2: Icon, Shield: Icon, Check: Icon, XCircle: Icon, Loader2: Icon, Clock: Icon, Copy: Icon, CheckCheck: Icon, GripHorizontal: Icon, Activity: Icon, Moon: Icon, Maximize2: Icon, RefreshCw: Icon, Bot: Icon, OctagonX: Icon, MessageSquare: Icon, Brain: Icon, Volume2: Icon, Wrench: Icon } })
  vi.doMock("@renderer/lib/utils", () => ({ cn: (...values: Array<string | undefined | false | null>) => values.filter(Boolean).join(" ") }))
  vi.doMock("@renderer/components/markdown-renderer", () => ({ MarkdownRenderer: (props: any) => ({ type: "MarkdownRenderer", props }) }))
  vi.doMock("./ui/button", () => ({ Button: (props: any) => ({ type: "button", props }) }))
  vi.doMock("./ui/badge", () => ({ Badge: (props: any) => ({ type: "Badge", props }) }))
  vi.doMock("./ui/dialog", () => ({ Dialog: (props: any) => props.children ?? null, DialogContent: (props: any) => props.children ?? null, DialogDescription: Null, DialogHeader: (props: any) => props.children ?? null, DialogTitle: Null }))
  vi.doMock("@renderer/lib/tipc-client", () => tipcClientMock)
  vi.doMock("../lib/tipc-client", () => tipcClientMock)
  vi.doMock("@renderer/lib/clipboard", () => clipboardMock)
  vi.doMock("../lib/clipboard", () => clipboardMock)
  vi.doMock("@renderer/stores", () => storesMock)
  vi.doMock("../stores", () => storesMock)
  vi.doMock("@renderer/components/audio-player", () => audioPlayerMock)
  vi.doMock("./audio-player", () => audioPlayerMock)
  vi.doMock("@renderer/lib/queries", () => queriesMock)
  vi.doMock("../lib/queries", () => queriesMock)
  vi.doMock("@renderer/contexts/theme-context", () => themeMock)
  vi.doMock("../contexts/theme-context", () => themeMock)
  vi.doMock("@renderer/lib/debug", () => debugMock)
  vi.doMock("../lib/debug", () => debugMock)
  vi.doMock("./tile-follow-up-input", () => ({ TileFollowUpInput: Null }))
  vi.doMock("./overlay-follow-up-input", () => ({ OverlayFollowUpInput: Null }))
  vi.doMock("@renderer/components/message-queue-panel", () => messageQueueMock)
  vi.doMock("./message-queue-panel", () => messageQueueMock)
  vi.doMock("@renderer/hooks/use-resizable", () => resizableMock)
  vi.doMock("../hooks/use-resizable", () => resizableMock)
  vi.doMock("@dotagents/shared", () => ({ getToolResultsSummary: () => "summary" }))
  vi.doMock("./tool-execution-stats", () => ({ ToolExecutionStats: Null }))
  vi.doMock("./acp-session-badge", () => ({ ACPSessionBadge: Null }))
  vi.doMock("./agent-summary-view", () => ({ AgentSummaryView: Null }))
  vi.doMock("@renderer/lib/tts-manager", () => ttsManagerMock)
  vi.doMock("../lib/tts-manager", () => ttsManagerMock)
  vi.doMock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() } }))
  const mod = await import("./agent-progress")
  return { AgentProgress: mod.AgentProgress, generateSpeech, audioPlayerProps }
}

const createProgress = (sessionId: string, conversationHistory: NonNullable<AgentProgressUpdate["conversationHistory"]>): AgentProgressUpdate => ({ sessionId, conversationId: `${sessionId}-conversation`, runId: 1, currentIteration: 1, maxIterations: 1, isComplete: false, steps: [], conversationHistory })

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 0 })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe("AgentProgress overlay TTS follow-up behavior", () => {
  it("does not render or autoplay stale respond_to_user content from the previous turn", async () => {
    clearSessionTTSTracking("session-stale")
    const runtime = createHookRuntime()
    const { AgentProgress, generateSpeech, audioPlayerProps } = await loadAgentProgress(runtime)

    runtime.render(AgentProgress, { variant: "overlay", progress: createProgress("session-stale", [
      { role: "user", content: "Original question", timestamp: 1 },
      { role: "assistant", content: "", timestamp: 2, toolCalls: [{ name: "respond_to_user", arguments: { text: "Old answer" } }] },
      { role: "user", content: "Follow-up question", timestamp: 3 },
    ]) } as any)
    runtime.commitEffects()
    await flushPromises()

    expect(audioPlayerProps.map((props) => props.text)).not.toContain("Old answer")
    expect(generateSpeech).not.toHaveBeenCalled()
  })

  it("still renders and autoplays the current turn's respond_to_user content", async () => {
    clearSessionTTSTracking("session-current")
    const runtime = createHookRuntime()
    const { AgentProgress, generateSpeech, audioPlayerProps } = await loadAgentProgress(runtime)

    runtime.render(AgentProgress, { variant: "overlay", progress: createProgress("session-current", [
      { role: "user", content: "Original question", timestamp: 1 },
      { role: "assistant", content: "", timestamp: 2, toolCalls: [{ name: "respond_to_user", arguments: { text: "Old answer" } }] },
      { role: "user", content: "Follow-up question", timestamp: 3 },
      { role: "assistant", content: "", timestamp: 4, toolCalls: [{ name: "respond_to_user", arguments: { text: "Fresh answer" } }] },
    ]) } as any)
    runtime.commitEffects()
    await flushPromises()

    expect(audioPlayerProps.map((props) => props.text)).toContain("Fresh answer")
    expect(generateSpeech).toHaveBeenCalledTimes(1)
    expect(generateSpeech).toHaveBeenCalledWith({ text: "Fresh answer" })
  })
})