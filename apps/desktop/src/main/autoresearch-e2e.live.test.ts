import fs from "fs"
import path from "path"
import { describe, expect, it, vi } from "vitest"

type Role = "user" | "assistant" | "tool"
type HistoryEntry = { role: Role; content: string; toolCalls?: Array<{ name: string; arguments?: unknown }> }

const trace = vi.hoisted(() => ({ llmCalls: [] as any[], progress: [] as any[], toolCalls: [] as any[] }))
const provider = process.env.AUTORESEARCH_LIVE_LLM_PROVIDER_ID || process.env.LIVE_LLM_PROVIDER_ID || "openai"
const apiKey = process.env.AUTORESEARCH_LIVE_LLM_API_KEY || process.env.LIVE_LLM_API_KEY || ""
const model = process.env.AUTORESEARCH_LIVE_LLM_MODEL || process.env.LIVE_LLM_MODEL || "gpt-4.1-mini"
const baseUrl = process.env.AUTORESEARCH_LIVE_LLM_BASE_URL || process.env.LIVE_LLM_BASE_URL || ""

vi.mock("./config", () => ({
  configStore: { save: vi.fn(), get: () => ({
    apiRetryCount: 1,
    apiRetryBaseDelay: 50,
    apiRetryMaxDelay: 200,
    mcpToolsProviderId: provider,
    mcpToolsOpenaiModel: provider === "openai" ? model : undefined,
    openaiApiKey: provider === "openai" ? apiKey : "",
    openaiBaseUrl: provider === "openai" && baseUrl ? baseUrl : undefined,
    mcpToolsGroqModel: provider === "groq" ? model : undefined,
    groqApiKey: provider === "groq" ? apiKey : "",
    groqBaseUrl: provider === "groq" && baseUrl ? baseUrl : undefined,
    mcpToolsGeminiModel: provider === "gemini" ? model : undefined,
    geminiApiKey: provider === "gemini" ? apiKey : "",
    geminiBaseUrl: provider === "gemini" && baseUrl ? baseUrl : undefined,
    mcpToolsChatgptWebModel: provider === "chatgpt-web" ? model : undefined,
    chatgptWebAccessToken: provider === "chatgpt-web" ? apiKey : "",
    chatgptWebBaseUrl: provider === "chatgpt-web" && baseUrl ? baseUrl : undefined,
    mcpVerifyCompletionEnabled: false,
    mcpFinalSummaryEnabled: false,
    currentModelPresetId: undefined,
    modelPresets: [],
  }) },
  globalAgentsFolder: "/tmp/autoresearch-global-agents",
  dataFolder: "/tmp/autoresearch-data",
  resolveWorkspaceAgentsFolder: () => undefined,
}))
vi.mock("./mcp-service", () => ({ MCPTool: undefined, MCPToolCall: undefined, LLMToolCallResponse: undefined, MCPToolResult: undefined }))
vi.mock("./state", () => ({ state: {}, agentSessionStateManager: { shouldStopSession: () => false, updateIterationCount: vi.fn(), cleanupSession: vi.fn(), isSessionRegistered: () => true, getSessionProfileSnapshot: () => undefined, createSession: vi.fn(), startSessionRun: () => 1, registerAbortController: vi.fn(), unregisterAbortController: vi.fn() }, llmRequestAbortManager: { register: vi.fn(), unregister: vi.fn() } }))
vi.mock("./debug", () => ({ isDebugLLM: () => false, isDebugTools: () => false, logLLM: vi.fn(), logTools: vi.fn(), logApp: vi.fn() }))
vi.mock("./diagnostics", () => ({ diagnosticsService: { logError: vi.fn(), logWarning: vi.fn(), logInfo: vi.fn() } }))
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: vi.fn(async (_sessionId: string, update: any) => trace.progress.push(update)) }))
vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: { getSession: (id: string) => ({ id, conversationTitle: "Autoresearch E2E" }), updateSession: vi.fn(), startSessionRun: () => 1, cleanupSession: vi.fn(), isSessionSnoozed: () => false, getSessionProfileSnapshot: () => undefined } }))
vi.mock("./conversation-service", () => ({ conversationService: { addMessageToConversation: vi.fn(async () => ({ id: "msg" })), maybeAutoGenerateConversationTitle: vi.fn() } }))
vi.mock("./langfuse-service", () => ({ isLangfuseEnabled: () => false, createAgentTrace: vi.fn(), endAgentTrace: vi.fn(), flushLangfuse: vi.fn() }))
vi.mock("./summarization-service", () => ({ isSummarizationEnabled: () => false, shouldSummarizeStep: () => false, summarizeAgentStep: vi.fn(), summarizationService: { getSummaries: () => [], getLatestSummary: () => undefined, addSummary: vi.fn() } }))
vi.mock("./knowledge-notes-service", () => ({ knowledgeNotesService: { createNoteFromSummary: vi.fn(), saveNote: vi.fn() } }))
vi.mock("./working-notes-runtime", () => ({ loadWorkingKnowledgeNotesForPrompt: () => [] }))
vi.mock("./agent-profile-service", () => ({ agentProfileService: { getCurrentProfile: () => undefined } }))
vi.mock("./skills-service", () => ({ skillsService: { getSkills: () => [], refreshFromDisk: () => [], getEnabledSkillsInstructionsForProfile: () => "" } }))
vi.mock("./oauth-storage", () => ({
  oauthStorage: {
    getTokens: vi.fn(async () => null),
    storeTokens: vi.fn(async () => undefined),
    clearTokens: vi.fn(async () => undefined),
    cleanup: vi.fn(async () => undefined),
  },
}))
vi.mock("./llm-fetch", async (importOriginal) => {
  if (process.env.AUTORESEARCH_E2E_MODE === "mock") {
    const fake = async (...args: any[]) => {
      trace.llmCalls.push({ kind: "mock", messages: args[0], providerId: args[2] || args[1], toolNames: args.at(-1)?.map?.((t: any) => t.name) || [] })
      return { content: process.env.AUTORESEARCH_MOCK_RESPONSE || "Mock autoresearch response", toolCalls: [] }
    }
    return { makeLLMCallWithFetch: fake, makeLLMCallWithStreamingAndTools: fake, verifyCompletionWithFetch: fake, makeTextCompletionWithFetch: fake }
  }
  const actual = await importOriginal<any>()
  const wrap = (kind: string, fn: any) => async (...args: any[]) => {
    trace.llmCalls.push({ kind, messages: args[0], providerId: args[2] || args[1], toolNames: args.at(-1)?.map?.((t: any) => t.name) || [] })
    if (process.env.AUTORESEARCH_E2E_MODE === "mock") return { content: process.env.AUTORESEARCH_MOCK_RESPONSE || "Mock autoresearch response", toolCalls: [] }
    return fn(...args)
  }
  return { ...actual, makeLLMCallWithFetch: wrap("fetch", actual.makeLLMCallWithFetch), makeLLMCallWithStreamingAndTools: wrap("stream", actual.makeLLMCallWithStreamingAndTools) }
})

function loadCase() {
  const repo = process.env.AUTORESEARCH_REPO_ROOT || path.resolve(process.cwd(), "../..")
  const casesPath = process.env.AUTORESEARCH_CASES_PATH || path.join(repo, "autoresearch/fixtures/topic-extraction-skill/cases.json")
  const caseId = process.env.AUTORESEARCH_CASE_ID || "case-a-approval-boundary"
  const pack = JSON.parse(fs.readFileSync(casesPath, "utf8"))
  const selected = pack.cases.find((c: any) => c.id === caseId)
  if (!selected) throw new Error(`Unknown AUTORESEARCH_CASE_ID=${caseId}`)
  return { repo, pack, selected, context: fs.readFileSync(path.resolve(repo, selected.context_file), "utf8") }
}

function parseHistory(markdown: string): HistoryEntry[] {
  const re = /^--- message ([0-9]+) \| role: (user|assistant|tool) ---$/gm
  const marks = [...markdown.matchAll(re)]
  return marks.map((m, i) => {
    let content = markdown.slice((m.index || 0) + m[0].length, i + 1 < marks.length ? marks[i + 1].index : markdown.length).trim()
    const toolCallsLine = content.match(/^\[toolCalls present: (.*)\]$/m)
    let toolCalls: HistoryEntry["toolCalls"] | undefined
    try {
      toolCalls = toolCallsLine ? JSON.parse(toolCallsLine[1]) : undefined
    } catch {
      toolCalls = undefined
    }
    content = content.replace(/^\[toolCalls present: .*\]$/gm, "").replace(/^\[toolResults present: .*\]$/gm, "").trim()
    if (content === "[empty content]") content = ""
    return { role: m[2] as Role, content, toolCalls }
  })
}

const runE2E = process.env.AUTORESEARCH_E2E === "1" ? describe : describe.skip

runE2E("autoresearch e2e current-tree replay", () => {
  it("runs one fixture case through processTranscriptWithAgentMode", async () => {
    if (process.env.AUTORESEARCH_E2E_MODE !== "mock") expect(apiKey, "live LLM API key is required").toBeTruthy()
    const { selected } = loadCase()
    const history = parseHistory(loadCase().context)
    const out = process.env.AUTORESEARCH_OUT || path.join(process.cwd(), "autoresearch-e2e-out")
    fs.mkdirSync(out, { recursive: true })
    const tools = ["execute_command", "load_skill_instructions", "set_session_title", "respond_to_user", "mark_work_complete"].map(name => ({ name, description: `Autoresearch sandbox tool: ${name}`, inputSchema: { type: "object", properties: {} } }))
    const { appendSessionUserResponse } = await import("./session-user-response-store")
    const executeToolCall = async (toolCall: any) => {
      trace.toolCalls.push(toolCall)
      if (toolCall.name === "respond_to_user") appendSessionUserResponse({ sessionId: "autoresearch-session", runId: 1, text: toolCall.arguments?.text || toolCall.arguments?.response || "" })
      return { content: [{ type: "text" as const, text: JSON.stringify({ success: true, sandboxed: true, tool: toolCall.name }) }], isError: false }
    }
    const { processTranscriptWithAgentMode } = await import("./llm")
    const result = await processTranscriptWithAgentMode(selected.prompt, tools as any, executeToolCall, 3, history as any, `autoresearch-${selected.id}`, "autoresearch-session", u => trace.progress.push(u), undefined, 1)
    fs.writeFileSync(path.join(out, "final_response.md"), result.content || "")
    fs.writeFileSync(path.join(out, "trace.json"), JSON.stringify({ case: selected.id, provider, model, result, trace }, null, 2))
    fs.writeFileSync(path.join(out, "prompt_snapshot.json"), JSON.stringify(trace.llmCalls.map(c => c.messages), null, 2))
    expect(result).toBeTruthy()
    expect(trace.llmCalls.length).toBeGreaterThan(0)
  }, 180000)
})