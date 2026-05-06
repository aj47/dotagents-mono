import fs from "fs"
import path from "path"
import { describe, expect, it, vi } from "vitest"
import { parseContinueReplayFixture, resolveContinueReplayMessages, type ContinueReplayFixture } from "./llm-verification-replay"

const liveReplayEnabled = process.env.LIVE_LLM_REPLAY === "1"
const liveReplayConfig = {
  fixtureInput: process.env.CONTINUE_REPLAY_FIXTURE,
  providerId: (process.env.LIVE_LLM_PROVIDER_ID || "openai") as "openai" | "groq" | "gemini" | "chatgpt-web",
  apiKey: process.env.LIVE_LLM_API_KEY || "",
  baseUrl: process.env.LIVE_LLM_BASE_URL || "",
  model: process.env.LIVE_LLM_MODEL || "",
}

function logReplayEvent(message: string): void {
  console.log(`[continue-replay] ${message}`)
}

function expectReplayResultToMatchFixture(result: { conversationState?: string, isComplete?: boolean }, fixture: ContinueReplayFixture): void {
  expect(typeof result.conversationState).toBe("string")
  if (fixture.expected?.conversationState) {
    expect(result.conversationState).toBe(fixture.expected.conversationState)
  }
  if (typeof fixture.expected?.isComplete === "boolean") {
    expect(result.isComplete).toBe(fixture.expected.isComplete)
  }
}

vi.mock("./config", () => ({
  configStore: {
    get: () => ({
      apiRetryCount: 1,
      apiRetryBaseDelay: 50,
      apiRetryMaxDelay: 200,
      mcpToolsProviderId: liveReplayConfig.providerId,
      openaiApiKey: liveReplayConfig.providerId === "openai" ? liveReplayConfig.apiKey : "",
      openaiBaseUrl: liveReplayConfig.providerId === "openai" ? liveReplayConfig.baseUrl || undefined : undefined,
      mcpToolsOpenaiModel: liveReplayConfig.providerId === "openai" ? liveReplayConfig.model : undefined,
      groqApiKey: liveReplayConfig.providerId === "groq" ? liveReplayConfig.apiKey : "",
      groqBaseUrl: liveReplayConfig.providerId === "groq" ? liveReplayConfig.baseUrl || undefined : undefined,
      mcpToolsGroqModel: liveReplayConfig.providerId === "groq" ? liveReplayConfig.model : undefined,
      geminiApiKey: liveReplayConfig.providerId === "gemini" ? liveReplayConfig.apiKey : "",
      geminiBaseUrl: liveReplayConfig.providerId === "gemini" ? liveReplayConfig.baseUrl || undefined : undefined,
      mcpToolsGeminiModel: liveReplayConfig.providerId === "gemini" ? liveReplayConfig.model : undefined,
      chatgptWebAccessToken: liveReplayConfig.providerId === "chatgpt-web" ? liveReplayConfig.apiKey : "",
      chatgptWebBaseUrl: liveReplayConfig.providerId === "chatgpt-web" ? liveReplayConfig.baseUrl || undefined : undefined,
      mcpToolsChatgptWebModel: liveReplayConfig.providerId === "chatgpt-web" ? liveReplayConfig.model : undefined,
      langfuseEnabled: false,
    }),
  },
}))

vi.mock("./diagnostics", () => ({
  diagnosticsService: {
    logError: vi.fn(),
    logWarning: vi.fn(),
    logInfo: vi.fn(),
  },
}))

vi.mock("./debug", () => ({
  isDebugLLM: () => false,
  logLLM: vi.fn(),
}))

vi.mock("@dotagents/core", () => ({
  state: {
    shouldStopAgent: false,
    isAgentModeActive: false,
    agentIterationCount: 0,
  },
  agentSessionStateManager: {
    isSessionRegistered: () => false,
    shouldStopSession: () => false,
    registerAbortController: vi.fn(),
    unregisterAbortController: vi.fn(),
  },
  llmRequestAbortManager: {
    register: vi.fn(),
    unregister: vi.fn(),
  },
}))

function loadReplayFixtures(inputPath: string): ContinueReplayFixture[] {
  const resolvedPath = path.resolve(process.cwd(), inputPath)
  const stat = fs.statSync(resolvedPath)
  const filePaths = stat.isDirectory()
    ? fs.readdirSync(resolvedPath).filter((fileName) => fileName.endsWith(".json")).sort().map((fileName) => path.join(resolvedPath, fileName))
    : [resolvedPath]

  return filePaths.map((filePath) => {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"))
    return parseContinueReplayFixture(raw, path.relative(process.cwd(), filePath))
  })
}

const fixtures = liveReplayEnabled && liveReplayConfig.fixtureInput
  ? loadReplayFixtures(liveReplayConfig.fixtureInput)
  : []
const describeLiveReplay = liveReplayEnabled ? describe : describe.skip

describeLiveReplay("llm continue replay live regression harness", () => {
  it("has the required live replay env configured", () => {
    expect(liveReplayConfig.fixtureInput).toBeTruthy()
    expect(liveReplayConfig.apiKey).toBeTruthy()
    expect(liveReplayConfig.model).toBeTruthy()
    expect(fixtures.length).toBeGreaterThan(0)
  })

  for (const fixture of fixtures) {
    it(`replays ${fixture.id}`, async () => {
      const { verifyCompletionWithFetch } = await import("./llm-fetch")
      const { normalizeVerificationResultForCompletion } = await import("@dotagents/shared/llm-continuation-guards")
      const messages = resolveContinueReplayMessages(fixture)

      logReplayEvent(`fixture=${fixture.id} provider=${liveReplayConfig.providerId} baseUrl=${liveReplayConfig.baseUrl || "(provider default)"} model=${liveReplayConfig.model}`)
      const rawResult = await verifyCompletionWithFetch(messages, liveReplayConfig.providerId)
      const result = normalizeVerificationResultForCompletion(rawResult, { verificationMessages: messages })
      logReplayEvent(`raw=${JSON.stringify(rawResult)}`)
      logReplayEvent(`result=${JSON.stringify(result)}`)

      expectReplayResultToMatchFixture(result, fixture)
    }, 120000)
  }
})
