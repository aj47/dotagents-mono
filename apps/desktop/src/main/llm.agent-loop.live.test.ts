import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { MCPToolCall, MCPToolResult } from "./mcp-service"

const liveHarness = vi.hoisted(() => {
  const tempRoot = "/tmp/dotagents-live-agent-loop-test"
  const config = {
    apiRetryCount: 1,
    apiRetryBaseDelay: 100,
    apiRetryMaxDelay: 500,
    chatgptWebAccessToken: "",
    chatgptWebAccountId: "",
    chatgptWebBaseUrl: "https://chatgpt.com",
    codexTextVerbosity: "low",
    currentModelPresetId: undefined,
    langfuseEnabled: false,
    mcpContextLastNMessages: 3,
    mcpContextReductionEnabled: true,
    mcpContextSummarizeCharThreshold: 800,
    mcpContextTargetRatio: 0.45,
    mcpFinalSummaryEnabled: false,
    mcpMaxContextTokensOverride: 2600,
    mcpToolsChatgptWebModel: process.env.LIVE_AGENT_LOOP_MODEL || "gpt-5.4-mini",
    mcpToolsProviderId: "chatgpt-web",
    mcpVerifyCompletionEnabled: true,
    modelPresets: [],
    openaiReasoningEffort: "low",
  }

  return {
    config,
    executedToolCalls: [] as Array<{ name: string; arguments: unknown }>,
    oauthTokens: new Map<string, unknown>(),
    progressUpdates: [] as unknown[],
    sessions: new Map<string, { id: string; conversationTitle: string; isSnoozed?: boolean }>(),
    tempRoot,
  }
})

vi.mock("./config", () => ({
  appId: "app.dotagents.live-agent-loop-test",
  configPath: `${liveHarness.tempRoot}/config.json`,
  configStore: {
    config: undefined,
    get: () => liveHarness.config,
    reload: () => liveHarness.config,
    save: vi.fn(),
  },
  conversationsFolder: `${liveHarness.tempRoot}/conversations`,
  dataFolder: liveHarness.tempRoot,
  globalAgentsFolder: `${liveHarness.tempRoot}/global-agents`,
  recordingsFolder: `${liveHarness.tempRoot}/recordings`,
  resolveWorkspaceAgentsFolder: () => `${liveHarness.tempRoot}/workspace-agents`,
}))

vi.mock("electron", () => ({
  app: {
    getAppPath: () => process.cwd(),
    getPath: () => liveHarness.tempRoot,
    getVersion: () => "0.0.0-live-test",
  },
  dialog: {},
  ipcMain: {},
  safeStorage: {
    decryptString: vi.fn(() => ""),
    encryptString: vi.fn(() => Buffer.from("")),
  },
  shell: {
    openExternal: vi.fn(async () => undefined),
  },
}))

vi.mock("@egoist/tipc/main", () => ({
  getRendererHandlers: vi.fn(() => ({})),
}))

vi.mock("./oauth-storage", () => ({
  oauthStorage: {
    clearTokens: vi.fn(async (key: string) => {
      liveHarness.oauthTokens.delete(key)
    }),
    getTokens: vi.fn(async (key: string) => liveHarness.oauthTokens.get(key) ?? null),
    storeTokens: vi.fn(async (key: string, tokens: unknown) => {
      liveHarness.oauthTokens.set(key, tokens)
    }),
  },
}))

vi.mock("./diagnostics", () => ({
  diagnosticsService: {
    logError: vi.fn(),
    logInfo: vi.fn(),
    logWarning: vi.fn(),
  },
}))

vi.mock("./mcp-service", () => ({}))

vi.mock("./message-queue-service", () => ({
  messageQueueService: {
    isQueuePaused: vi.fn(() => false),
    releaseProcessingLock: vi.fn(),
    tryAcquireProcessingLock: vi.fn(() => false),
  },
}))

vi.mock("./window", () => ({
  WINDOWS: new Map(),
  resizePanelForAgentMode: vi.fn(),
  showPanelWindow: vi.fn(),
}))

vi.mock("./emit-agent-progress", () => ({
  emitAgentProgress: vi.fn(async (update: unknown) => {
    liveHarness.progressUpdates.push(update)
  }),
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    completeSession: vi.fn((id: string) => {
      liveHarness.sessions.set(id, {
        id,
        conversationTitle: liveHarness.sessions.get(id)?.conversationTitle ?? "Live loop E2E",
        isSnoozed: liveHarness.sessions.get(id)?.isSnoozed,
      })
    }),
    errorSession: vi.fn(),
    getSession: vi.fn((id: string) => liveHarness.sessions.get(id) ?? {
      id,
      conversationTitle: "Live loop E2E",
      isSnoozed: false,
    }),
    isSessionSnoozed: vi.fn((id: string) => liveHarness.sessions.get(id)?.isSnoozed ?? false),
    updateSession: vi.fn((id: string, patch: Record<string, unknown>) => {
      const existing = liveHarness.sessions.get(id) ?? { id, conversationTitle: "Live loop E2E" }
      liveHarness.sessions.set(id, { ...existing, ...patch })
    }),
  },
}))

vi.mock("./conversation-service", () => ({
  conversationService: {
    addMessageToConversation: vi.fn(async () => undefined),
    maybeAutoGenerateConversationTitle: vi.fn(async () => undefined),
  },
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getCurrentProfile: vi.fn(() => undefined),
    getEnabledSkillIdsForProfile: vi.fn(() => []),
  },
}))

vi.mock("./skills-service", () => ({
  skillsService: {
    getEnabledSkillsInstructionsForProfile: vi.fn(() => ""),
    getSkills: vi.fn(() => []),
    refreshFromDisk: vi.fn(() => []),
  },
}))

vi.mock("./working-notes-runtime", () => ({
  loadWorkingKnowledgeNotesForPrompt: vi.fn(() => []),
}))

vi.mock("./summarization-service", () => ({
  isSummarizationEnabled: vi.fn(() => false),
  shouldSummarizeStep: vi.fn(() => false),
  summarizeAgentStep: vi.fn(),
  summarizationService: {
    addSummary: vi.fn(),
    getImportantSummaries: vi.fn(() => []),
    getLatestSummary: vi.fn(() => undefined),
    getSummaries: vi.fn(() => []),
  },
}))

vi.mock("./knowledge-notes-service", () => ({
  knowledgeNotesService: {
    createNoteFromSummary: vi.fn(() => null),
    reload: vi.fn(async () => undefined),
    saveNote: vi.fn(async () => undefined),
  },
}))

vi.mock("./langfuse-service", () => ({
  createAgentTrace: vi.fn(),
  createLLMGeneration: vi.fn(),
  endAgentTrace: vi.fn(),
  endLLMGeneration: vi.fn(),
  flushLangfuse: vi.fn(async () => undefined),
  isTracingEnabled: vi.fn(() => false),
}))

function hasLocalCodexChatGptAuth(): boolean {
  try {
    const authPath = path.join(process.env.CODEX_HOME || path.join(os.homedir(), ".codex"), "auth.json")
    const parsed = JSON.parse(fs.readFileSync(authPath, "utf8")) as {
      auth_mode?: string
      tokens?: { access_token?: unknown }
    }
    return (!parsed.auth_mode || parsed.auth_mode === "chatgpt") && typeof parsed.tokens?.access_token === "string"
  } catch {
    return false
  }
}

function makeHardCompactionHistory(hiddenToken: string) {
  const giantMiddle = [
    "A".repeat(5200),
    `HIDDEN_AUDIT_TOKEN=${hiddenToken}`,
    "B".repeat(5200),
  ].join("\n")

  return [
    { role: "user" as const, content: "Start a long audit trail. Keep exact recovery facts when compacting." },
    {
      role: "assistant" as const,
      content: "I will preserve exact recovery facts and use context refs when older payloads are compacted.",
    },
    {
      role: "tool" as const,
      content: [
        "[fixture:historical_audit] BEGIN",
        "The token requested later is intentionally buried in the middle of this oversized payload.",
        giantMiddle,
        "END historical_audit. If compacted, use read_more_context search for HIDDEN_AUDIT_TOKEN.",
      ].join("\n"),
    },
    ...Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 === 0 ? "assistant" as const : "user" as const,
      content: `Background filler ${index}: ${"context ".repeat(90)} keep working through the audit.`,
    })),
  ]
}

async function executeLiveSafeTool(
  toolCall: MCPToolCall,
  sessionId: string,
): Promise<MCPToolResult> {
  liveHarness.executedToolCalls.push({
    name: toolCall.name,
    arguments: toolCall.arguments,
  })

  if (toolCall.name === "read_more_context") {
    const { readMoreContext } = await import("./context-budget")
    const args = toolCall.arguments ?? {}
    const result = readMoreContext(sessionId, String(args.contextRef ?? ""), {
      length: typeof args.length === "number" ? args.length : undefined,
      maxChars: typeof args.maxChars === "number" ? args.maxChars : undefined,
      mode: typeof args.mode === "string" ? args.mode : undefined,
      offset: typeof args.offset === "number" ? args.offset : undefined,
      query: typeof args.query === "string" ? args.query : undefined,
    })
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      isError: result.success === false,
    }
  }

  return {
    content: [{ type: "text", text: JSON.stringify({ success: false, error: `Unexpected live test tool: ${toolCall.name}` }) }],
    isError: true,
  }
}

const liveAgentLoopEnabled = process.env.LIVE_AGENT_LOOP_E2E === "1"
const describeLiveAgentLoop = liveAgentLoopEnabled ? describe : describe.skip

describeLiveAgentLoop("live agent loop e2e with real ChatGPT Codex provider", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    liveHarness.executedToolCalls.length = 0
    liveHarness.oauthTokens.clear()
    liveHarness.progressUpdates.length = 0
    liveHarness.sessions.clear()
    fs.rmSync(liveHarness.tempRoot, { recursive: true, force: true })
    fs.mkdirSync(liveHarness.tempRoot, { recursive: true })

    const { state } = await import("./state")
    state.shouldStopAgent = false
    state.agentSessions.clear()
    state.llmAbortControllers.clear()
  })

  afterEach(async () => {
    const { clearSessionUserResponse } = await import("./session-user-response-store")
    clearSessionUserResponse("live-agent-loop-hard-compaction")
    fs.rmSync(liveHarness.tempRoot, { recursive: true, force: true })
  })

  it("retrieves a buried context-ref token through the real agent loop", async () => {
    expect(hasLocalCodexChatGptAuth()).toBe(true)

    const { processTranscriptWithAgentMode } = await import("./llm")
    const { runtimeToolDefinitions } = await import("./runtime-tool-definitions")
    const sessionId = "live-agent-loop-hard-compaction"
    const hiddenToken = "HX-7492-PRISM-RIVER"
    const safeToolNames = new Set(["read_more_context"])
    const availableTools = runtimeToolDefinitions.filter((tool) => safeToolNames.has(tool.name))

    liveHarness.sessions.set(sessionId, { id: sessionId, conversationTitle: "Live loop E2E" })

    const result = await processTranscriptWithAgentMode(
      [
        "Recover the exact HIDDEN_AUDIT_TOKEN value from the earlier historical_audit tool result.",
        'If the old payload is compacted and has a Context ref, call read_more_context with mode "search" and query "HIDDEN_AUDIT_TOKEN".',
        `Then answer exactly in this form: Recovered token: ${hiddenToken}`,
        "Do not continue after providing that exact answer.",
      ].join("\n"),
      availableTools as any,
      (toolCall) => executeLiveSafeTool(toolCall, sessionId),
      2,
      makeHardCompactionHistory(hiddenToken),
      undefined,
      sessionId,
      undefined,
      undefined,
      1,
    )

    expect(liveHarness.executedToolCalls.some((call) => call.name === "read_more_context")).toBe(true)
    expect(result.conversationHistory.some((entry) => (
      entry.role === "tool" &&
      entry.content.includes("HIDDEN_AUDIT_TOKEN") &&
      entry.content.includes(hiddenToken)
    ))).toBe(true)
    if (result.content.includes("Recovered token:")) {
      expect(result.content).toContain(`Recovered token: ${hiddenToken}`)
    }
  }, 180000)
})
