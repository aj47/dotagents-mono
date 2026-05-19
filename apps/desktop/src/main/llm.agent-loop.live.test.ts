import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  autoresearchContinuationCases,
  type AutoresearchContinuationCase,
} from "./agent-loop-autoresearch-cases"
import {
  recordAgentLoopMetric,
  summarizePromptBatches,
  summarizeToolCalls,
} from "./agent-loop-test-metrics"
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
    executeCommandScenario: undefined as undefined | "immigration-context",
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

function makeLiveAutoresearchTranscript(traceCase: AutoresearchContinuationCase): string {
  return [
    `CURRENT REQUEST: ${traceCase.transcript}`,
    "",
    "CURRENT-TURN ACCEPTANCE CRITERIA:",
    traceCase.requiredLiveResponseEvidence
      .map((group, index) => `${index + 1}. Must cover one of: ${group.join(" | ")}`)
      .join("\n"),
    "",
    "Write the answer so every acceptance-criteria number above is visibly satisfied.",
    "Older conversation may contain stale tasks. Do not fulfill older tasks; use them only as evidence for the current request.",
    "The prior conversation and tool messages are fixture evidence already available to you; do not refuse because you cannot access the filesystem.",
    "This is a status/continuation check, not an implementation request.",
    "If the current request or criteria name a local recovery source such as notes/conversations, state that source as the next safe action instead of asking the user to provide the missing value.",
    "Preserve named recovery-source wording literally; do not replace notes/conversations with generic wording like prior context.",
    "Do not draft, rewrite, create, or output skill files, commands, or code unless the current request explicitly asks for that.",
    "Answer from the existing conversation and tool history only.",
    "Do not claim you need to run a new command when the prior tool evidence already answers the question.",
    "Preserve any approval or no-mutation boundary from previous turns.",
    "For verify/debate/debug-the-main-issue requests, answer the current issue directly; do not append a next-safe-action line unless the request asks for one.",
    "If the current request says it is not asking you to do an older task now, do not answer that older task.",
    "If the criteria mention a stale prior conclusion, describe it only as the prior mistake being debugged; do not reassert it as the current answer.",
    "Be concise and include the current state plus the next safest action when relevant.",
  ].join("\n")
}

function findMissingEvidenceGroups(content: string, evidenceGroups: string[][]): string[][] {
  const normalizedContent = content.toLowerCase()
  return evidenceGroups.filter((group) =>
    !group.some((item) => normalizedContent.includes(item.toLowerCase()))
  )
}

function buildIntentJudgeMessages(traceCase: AutoresearchContinuationCase, actualAnswer: string) {
  return [
    {
      role: "system",
      content: [
        "You are a strict evaluator for an agent-loop e2e test.",
        "Judge whether the assistant's ACTUAL ANSWER satisfies the CURRENT REQUEST and user intent.",
        "Use the prior context only as evidence; do not require exact wording from the reference answer.",
        "Pass only if the actual answer addresses the latest user request, does not answer a stale older task, and does not use an internal completion summary as the user-facing answer.",
        "Return JSON only with: conversationState, confidence, missingItems, reason.",
        "Use conversationState=\"complete\" for pass and conversationState=\"running\" for fail.",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `Case: ${traceCase.caseId} - ${traceCase.name}`,
        "",
        "CURRENT REQUEST:",
        traceCase.transcript,
        "",
        "REFERENCE ANSWER / INTENT:",
        traceCase.response,
        "",
        "KEY SEMANTIC REQUIREMENTS:",
        traceCase.requiredLiveResponseEvidence
          .map((group, index) => `${index + 1}. One of: ${group.join(" | ")}`)
          .join("\n"),
        "",
        "ACTUAL ANSWER:",
        actualAnswer,
        "",
        "Return JSON only. If any key semantic requirement is missing or the answer addresses stale context instead of the current request, return conversationState=\"running\" and list missingItems.",
      ].join("\n"),
    },
  ]
}

async function judgeLiveIntentMatch(
  traceCase: AutoresearchContinuationCase,
  actualAnswer: string,
) {
  const { normalizeVerificationResultForCompletion } = await import("@dotagents/shared/llm-continuation-guards")
  const { verifyCompletionWithFetch } = await import("./llm-fetch")
  const messages = buildIntentJudgeMessages(traceCase, actualAnswer)
  const rawResult = await verifyCompletionWithFetch(
    messages,
    liveHarness.config.mcpToolsProviderId,
    traceCase.sessionId,
  )
  return normalizeVerificationResultForCompletion(rawResult, { verificationMessages: messages })
}

function executeImmigrationContextCommand(toolCall: MCPToolCall): MCPToolResult {
  const args = toolCall.arguments && typeof toolCall.arguments === "object" && !Array.isArray(toolCall.arguments)
    ? toolCall.arguments as Record<string, unknown>
    : {}
  const command = typeof args.command === "string" ? args.command : ""

  if (!command.trim()) {
    return {
      content: [{ type: "text", text: JSON.stringify({ success: false, error: "execute_command requires command" }) }],
      isError: true,
    }
  }

  const normalized = command.toLowerCase()
  const searchedKnowledge = /\bknowledge\b|\.agents|notes?|memory/.test(normalized)
  const searchedConversations = /\bconversation\b|\bconversations\b|conv_|app\.dotagents|dotagents|application support/.test(normalized)
  const stdout: string[] = [`command=${command}`]

  if (searchedKnowledge) {
    stdout.push([
      "SYNTHETIC_IMMIGRATION_KNOWLEDGE_CONTEXT:",
      "/tmp/dotagents-live-agent-loop-test/global-agents/knowledge/synthetic-advisor-prep/synthetic-advisor-prep.md",
      "Synthetic fixture note: example consultation prep should cover route comparison such as O-1 vs EB-1, status-maintenance questions, filing timeline, evidence packet, recommendation letters, travel constraints, work authorization, family implications, costs, and risk questions.",
    ].join("\n"))
  }

  if (searchedConversations) {
    stdout.push([
      "SYNTHETIC_LATEST_DOTAGENTS_CONVERSATIONS:",
      "index.json latest two matching conversations:",
      "synthetic_conv_route_comparison.json: Fixture says to ask counsel to compare O-1, EB-1, and possible employer sponsorship routes; clarify status-maintenance risk and processing/timeline tradeoffs.",
      "synthetic_conv_document_questions.json: Fixture says to bring a document checklist, evidence examples, recommendation-letter plan, travel/work authorization questions, family implications, fees, deadlines, and risk questions.",
    ].join("\n"))
  }

  if (!searchedKnowledge && !searchedConversations) {
    stdout.push("No local immigration context returned: this fixture only returns details after inspecting knowledge notes and/or DotAgents conversations.")
  }

  return {
    content: [{ type: "text", text: JSON.stringify({ success: true, command, stdout: stdout.join("\n\n"), stderr: "" }) }],
    isError: false,
  }
}

async function executeLiveSafeTool(
  toolCall: MCPToolCall,
  sessionId: string,
  runId: number,
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
    const serializedResult = JSON.stringify(result, null, 2)
    const hiddenTokenMatch = serializedResult.match(/HIDDEN_AUDIT_TOKEN=([A-Z0-9-]+)/)
    const toolText = hiddenTokenMatch
      ? `${serializedResult}\n\nThe exact requested answer is: Recovered token: ${hiddenTokenMatch[1]}. Do not call read_more_context again.`
      : serializedResult
    return {
      content: [{ type: "text", text: toolText }],
      isError: result.success === false,
    }
  }

  if (toolCall.name === "respond_to_user") {
    const { appendSessionUserResponse } = await import("./session-user-response-store")
    const { extractRespondToUserContentFromArgs } = await import("@dotagents/shared/chat-utils")
    const responseContent = extractRespondToUserContentFromArgs(toolCall.arguments)

    if (!responseContent) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: "respond_to_user requires text" }) }],
        isError: true,
      }
    }

    appendSessionUserResponse({ sessionId, runId, text: responseContent })
    return {
      content: [{ type: "text", text: JSON.stringify({ success: true, message: "Response recorded for delivery to user." }) }],
      isError: false,
    }
  }

  if (toolCall.name === "mark_work_complete") {
    return {
      content: [{ type: "text", text: JSON.stringify({ success: true, message: "Work marked complete." }) }],
      isError: false,
    }
  }

  if (toolCall.name === "execute_command") {
    if (liveHarness.executeCommandScenario === "immigration-context") {
      return executeImmigrationContextCommand(toolCall)
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ success: false, error: "Unexpected execute_command in live test" }) }],
      isError: true,
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
    liveHarness.executeCommandScenario = undefined
    liveHarness.oauthTokens.clear()
    liveHarness.progressUpdates.length = 0
    liveHarness.sessions.clear()
    fs.rmSync(liveHarness.tempRoot, { recursive: true, force: true })
    fs.mkdirSync(liveHarness.tempRoot, { recursive: true })

    const { state } = await import("@dotagents/core")
    state.shouldStopAgent = false
    state.agentSessions.clear()
    state.llmAbortControllers.clear()
  })

  afterEach(async () => {
    const { clearSessionUserResponse } = await import("./session-user-response-store")
    clearSessionUserResponse("live-agent-loop-hard-compaction")
    for (const traceCase of autoresearchContinuationCases) {
      clearSessionUserResponse(traceCase.sessionId)
    }
    fs.rmSync(liveHarness.tempRoot, { recursive: true, force: true })
  })

  it.each(autoresearchContinuationCases)(
    "runs AutoResearch $caseId: $name through the live agent-loop harness",
    async (traceCase) => {
      expect(hasLocalCodexChatGptAuth()).toBe(true)
      expect(traceCase.previousHistory).toHaveLength(traceCase.expectedHistoryLength)

      const llmFetch = await import("./llm-fetch")
      const llmSpy = vi.spyOn(llmFetch, "makeLLMCallWithStreamingAndTools")
      const verifierSpy = vi.spyOn(llmFetch, "verifyCompletionWithFetch")
      const { processTranscriptWithAgentMode } = await import("./llm")
      const { runtimeToolDefinitions } = await import("./runtime-tool-definitions")
      const runId = 1
      const maxIterations = 4
      const safeToolNames = new Set(["respond_to_user"])
      const availableTools = runtimeToolDefinitions.filter((tool) => safeToolNames.has(tool.name))

      liveHarness.sessions.set(traceCase.sessionId, { id: traceCase.sessionId, conversationTitle: `AutoResearch ${traceCase.caseId}` })

      const startedAt = performance.now()
      const result = await processTranscriptWithAgentMode(
        makeLiveAutoresearchTranscript(traceCase),
        availableTools as any,
        (toolCall) => executeLiveSafeTool(toolCall, traceCase.sessionId, runId),
        maxIterations,
        traceCase.previousHistory as any,
        undefined,
        traceCase.sessionId,
        undefined,
        undefined,
        runId,
      )

      const missingResponseEvidenceGroups = findMissingEvidenceGroups(result.content, traceCase.requiredLiveResponseEvidence)
      const finalAnswerAvoidedStaleMarker = !result.content.includes("STALE_LONG_CONTEXT_SHOULD_NOT_REPLAY")
      const structuralPass = result.content.trim().length > 0 && finalAnswerAvoidedStaleMarker
      const reachedIterationLimit = result.totalIterations >= maxIterations
      const agentVerifierCalls = verifierSpy.mock.calls.length
      const llmJudgeEnabled = process.env.LIVE_AGENT_LOOP_LLM_JUDGE !== "0"
      const llmJudgeRequired = process.env.LIVE_AGENT_LOOP_LLM_JUDGE_REQUIRED === "1"
      const llmJudge = llmJudgeEnabled
        ? await judgeLiveIntentMatch(traceCase, result.content)
        : undefined
      const llmJudgePassed = llmJudge
        ? llmJudge.conversationState === "complete" && llmJudge.isComplete === true
        : undefined
      const status = structuralPass && (!llmJudgeRequired || llmJudgePassed === true)
        ? "pass"
        : "fail"

      recordAgentLoopMetric({
        suite: "agent-loop-autoresearch-live-e2e",
        caseId: traceCase.caseId,
        caseName: traceCase.name,
        status,
        semanticEvidencePassed: missingResponseEvidenceGroups.length === 0,
        durationMs: Math.round(performance.now() - startedAt),
        provider: liveHarness.config.mcpToolsProviderId,
        model: liveHarness.config.mcpToolsChatgptWebModel,
        llmCalls: llmSpy.mock.calls.length,
        verifierCalls: agentVerifierCalls,
        llmJudgeEnabled,
        llmJudgeCalls: llmJudgeEnabled ? 1 : 0,
        llmJudgePassed,
        llmJudgeConversationState: llmJudge?.conversationState,
        llmJudgeConfidence: llmJudge?.confidence,
        llmJudgeMissingItems: llmJudge?.missingItems,
        llmJudgeReason: llmJudge?.reason,
        toolCallsTotal: liveHarness.executedToolCalls.length,
        toolCallsByName: summarizeToolCalls(liveHarness.executedToolCalls),
        finalContentChars: result.content.length,
        conversationHistoryLength: result.conversationHistory.length,
        totalIterations: result.totalIterations,
        expectedHistoryLength: traceCase.expectedHistoryLength,
        missingResponseEvidenceGroups,
        finalAnswerAvoidedStaleMarker,
        reachedIterationLimit,
        ...summarizePromptBatches(llmSpy.mock.calls.map((call) => call[0])),
      })

      expect(result.content.trim().length).toBeGreaterThan(0)
      expect(finalAnswerAvoidedStaleMarker).toBe(true)
      if (llmJudgeRequired) {
        expect(llmJudgePassed, llmJudge?.reason || "LLM judge did not pass").toBe(true)
      }
    },
    180000,
  )

  it("gathers knowledge and conversation context before immigration advisor prep advice", async () => {
    expect(hasLocalCodexChatGptAuth()).toBe(true)

    const llmFetch = await import("./llm-fetch")
    const llmSpy = vi.spyOn(llmFetch, "makeLLMCallWithStreamingAndTools")
    const verifierSpy = vi.spyOn(llmFetch, "verifyCompletionWithFetch")
    const { processTranscriptWithAgentMode } = await import("./llm")
    const { runtimeToolDefinitions } = await import("./runtime-tool-definitions")
    const sessionId = "live-agent-loop-immigration-context"
    const runId = 1
    const maxIterations = 6
    const safeToolNames = new Set(["execute_command", "respond_to_user", "mark_work_complete"])
    const availableTools = runtimeToolDefinitions.filter((tool) => safeToolNames.has(tool.name))
    const requiredEvidenceGroups = [
      ["O-1", "O1", "EB-1", "EB1", "visa strategy", "employer sponsorship"],
      ["evidence", "documents", "document checklist", "recommendation letters"],
      ["travel", "work authorization", "family"],
      ["timeline", "deadlines", "premium processing", "fees", "risks"],
    ]

    liveHarness.executeCommandScenario = "immigration-context"
    liveHarness.sessions.set(sessionId, { id: sessionId, conversationTitle: "Synthetic Advisor Prep" })

    const startedAt = performance.now()
    const result = await processTranscriptWithAgentMode(
      "Need prep for a high-context legal/immigration advisor meeting today. What should be asked based on local context?",
      availableTools as any,
      (toolCall) => executeLiveSafeTool(toolCall, sessionId, runId),
      maxIterations,
      [],
      undefined,
      sessionId,
      undefined,
      undefined,
      runId,
    )

    const executeCommandCalls = liveHarness.executedToolCalls.filter((call) => call.name === "execute_command")
    const commandText = executeCommandCalls
      .map((call) => {
        const args = call.arguments && typeof call.arguments === "object" && !Array.isArray(call.arguments)
          ? call.arguments as Record<string, unknown>
          : {}
        return typeof args.command === "string" ? args.command : ""
      })
      .join("\n")
      .toLowerCase()
    const knowledgeSearchAttempted = /\bknowledge\b|\.agents|notes?|memory/.test(commandText)
    const conversationSearchAttempted = /\bconversation\b|\bconversations\b|conv_|app\.dotagents|dotagents|application support/.test(commandText)
    const contextEvidenceGathered = result.conversationHistory.some((entry) =>
      entry.role === "tool" &&
      entry.content.includes("SYNTHETIC_IMMIGRATION_KNOWLEDGE_CONTEXT") &&
      entry.content.includes("SYNTHETIC_LATEST_DOTAGENTS_CONVERSATIONS")
    )
    const missingResponseEvidenceGroups = findMissingEvidenceGroups(result.content, requiredEvidenceGroups)
    const status = executeCommandCalls.length > 0 &&
      knowledgeSearchAttempted &&
      conversationSearchAttempted &&
      contextEvidenceGathered &&
      missingResponseEvidenceGroups.length === 0
      ? "pass"
      : "fail"

    recordAgentLoopMetric({
      suite: "agent-loop-live-context-gathering",
      caseId: "immigration-advisor-local-context",
      status,
      durationMs: Math.round(performance.now() - startedAt),
      provider: liveHarness.config.mcpToolsProviderId,
      model: liveHarness.config.mcpToolsChatgptWebModel,
      llmCalls: llmSpy.mock.calls.length,
      verifierCalls: verifierSpy.mock.calls.length,
      toolCallsTotal: liveHarness.executedToolCalls.length,
      toolCallsByName: summarizeToolCalls(liveHarness.executedToolCalls),
      executeCommandCalls: executeCommandCalls.length,
      knowledgeSearchAttempted,
      conversationSearchAttempted,
      contextEvidenceGathered,
      missingResponseEvidenceGroups,
      finalContentChars: result.content.length,
      conversationHistoryLength: result.conversationHistory.length,
      totalIterations: result.totalIterations,
      reachedIterationLimit: result.totalIterations >= maxIterations,
      ...summarizePromptBatches(llmSpy.mock.calls.map((call) => call[0])),
    })

    expect(executeCommandCalls.length).toBeGreaterThan(0)
    expect(knowledgeSearchAttempted).toBe(true)
    expect(conversationSearchAttempted).toBe(true)
    expect(contextEvidenceGathered).toBe(true)
    expect(missingResponseEvidenceGroups).toEqual([])
  }, 180000)

  it("retrieves a buried context-ref token through the real agent loop", async () => {
    expect(hasLocalCodexChatGptAuth()).toBe(true)

    const llmFetch = await import("./llm-fetch")
    const llmSpy = vi.spyOn(llmFetch, "makeLLMCallWithStreamingAndTools")
    const verifierSpy = vi.spyOn(llmFetch, "verifyCompletionWithFetch")
    const { processTranscriptWithAgentMode } = await import("./llm")
    const { runtimeToolDefinitions } = await import("./runtime-tool-definitions")
    const sessionId = "live-agent-loop-hard-compaction"
    const hiddenToken = "HX-7492-PRISM-RIVER"
    const runId = 1
    const maxIterations = 6
    const safeToolNames = new Set(["read_more_context", "respond_to_user", "mark_work_complete"])
    const availableTools = runtimeToolDefinitions.filter((tool) => safeToolNames.has(tool.name))

    liveHarness.sessions.set(sessionId, { id: sessionId, conversationTitle: "Live loop E2E" })

    const startedAt = performance.now()
    const result = await processTranscriptWithAgentMode(
      [
        "Recover the exact HIDDEN_AUDIT_TOKEN value from the earlier historical_audit tool result.",
        'If the old payload is compacted and has a Context ref, call read_more_context with mode "search" and query "HIDDEN_AUDIT_TOKEN".',
        "After read_more_context returns a result containing HIDDEN_AUDIT_TOKEN, do not search again.",
        `Then answer exactly in this form: Recovered token: ${hiddenToken}`,
        "Do not continue after providing that exact answer.",
      ].join("\n"),
      availableTools as any,
      (toolCall) => executeLiveSafeTool(toolCall, sessionId, runId),
      maxIterations,
      makeHardCompactionHistory(hiddenToken),
      undefined,
      sessionId,
      undefined,
      undefined,
      runId,
    )

    const contextEvidenceRecovered = result.conversationHistory.some((entry) => (
      entry.role === "tool" &&
      entry.content.includes("HIDDEN_AUDIT_TOKEN") &&
      entry.content.includes(hiddenToken)
    ))
    const finalAnswerContainsHiddenToken = result.content.includes(hiddenToken)
    const finalAnswerMatchesRequestedForm = result.content.includes(`Recovered token: ${hiddenToken}`)

    recordAgentLoopMetric({
      suite: "agent-loop-live-e2e",
      caseId: "live-hard-compaction-read-more-context",
      status: contextEvidenceRecovered && finalAnswerContainsHiddenToken ? "pass" : "fail",
      durationMs: Math.round(performance.now() - startedAt),
      provider: liveHarness.config.mcpToolsProviderId,
      model: liveHarness.config.mcpToolsChatgptWebModel,
      llmCalls: llmSpy.mock.calls.length,
      verifierCalls: verifierSpy.mock.calls.length,
      toolCallsTotal: liveHarness.executedToolCalls.length,
      toolCallsByName: summarizeToolCalls(liveHarness.executedToolCalls),
      readMoreContextCalls: liveHarness.executedToolCalls.filter((call) => call.name === "read_more_context").length,
      finalContentChars: result.content.length,
      conversationHistoryLength: result.conversationHistory.length,
      totalIterations: result.totalIterations,
      contextEvidenceRecovered,
      finalAnswerContainsHiddenToken,
      finalAnswerMatchesRequestedForm,
      reachedIterationLimit: result.totalIterations >= maxIterations,
      ...summarizePromptBatches(llmSpy.mock.calls.map((call) => call[0])),
    })

    expect(liveHarness.executedToolCalls.some((call) => call.name === "read_more_context")).toBe(true)
    expect(contextEvidenceRecovered).toBe(true)
    if (result.content.includes("Recovered token:")) {
      expect(result.content).toContain(`Recovered token: ${hiddenToken}`)
    }
    expect(result.content).toContain(hiddenToken)
  }, 180000)
})
