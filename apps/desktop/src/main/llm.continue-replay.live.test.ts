import fs from "fs"
import path from "path"
import { describe, expect, it, vi } from "vitest"
import { parseContinueReplayFixture, resolveContinueReplayMessages, type ContinueReplayFixture } from "./llm-verification-replay"

const liveReplayEnabled = process.env.LIVE_LLM_REPLAY === "1"
const fixtureInput = process.env.CONTINUE_REPLAY_FIXTURE
const liveProviderId = (process.env.LIVE_LLM_PROVIDER_ID || "openai") as "openai" | "groq" | "gemini"
const liveApiKey = process.env.LIVE_LLM_API_KEY || ""
const liveBaseUrl = process.env.LIVE_LLM_BASE_URL || ""
const liveModel = process.env.LIVE_LLM_MODEL || ""

vi.mock("./config", () => ({
  configStore: {
    get: () => ({
      apiRetryCount: 1,
      apiRetryBaseDelay: 50,
      apiRetryMaxDelay: 200,
      mcpToolsProviderId: liveProviderId,
      openaiApiKey: liveProviderId === "openai" ? liveApiKey : "",
      openaiBaseUrl: liveProviderId === "openai" ? liveBaseUrl || undefined : undefined,
      mcpToolsOpenaiModel: liveProviderId === "openai" ? liveModel : undefined,
      groqApiKey: liveProviderId === "groq" ? liveApiKey : "",
      groqBaseUrl: liveProviderId === "groq" ? liveBaseUrl || undefined : undefined,
      mcpToolsGroqModel: liveProviderId === "groq" ? liveModel : undefined,
      geminiApiKey: liveProviderId === "gemini" ? liveApiKey : "",
      geminiBaseUrl: liveProviderId === "gemini" ? liveBaseUrl || undefined : undefined,
      mcpToolsGeminiModel: liveProviderId === "gemini" ? liveModel : undefined,
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

vi.mock("./state", () => ({
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

const fixtures = liveReplayEnabled && fixtureInput ? loadReplayFixtures(fixtureInput) : []
const describeLiveReplay = liveReplayEnabled ? describe : describe.skip

describeLiveReplay("llm continue replay live regression harness", () => {
  it("has the required live replay env configured", () => {
    expect(fixtureInput).toBeTruthy()
    expect(liveApiKey).toBeTruthy()
    expect(liveModel).toBeTruthy()
    expect(fixtures.length).toBeGreaterThan(0)
  })

  for (const fixture of fixtures) {
    it(`replays ${fixture.id}`, async () => {
      const { verifyCompletionWithFetch } = await import("./llm-fetch")
      const { normalizeVerificationResultForCompletion } = await import("./llm-continuation-guards")
      const messages = resolveContinueReplayMessages(fixture)

      console.log(`[continue-replay] fixture=${fixture.id} provider=${liveProviderId} baseUrl=${liveBaseUrl || "(provider default)"} model=${liveModel}`)
      const rawResult = await verifyCompletionWithFetch(messages, liveProviderId)
      const result = normalizeVerificationResultForCompletion(rawResult, { verificationMessages: messages })
      console.log(`[continue-replay] raw=${JSON.stringify(rawResult)}`)
      console.log(`[continue-replay] result=${JSON.stringify(result)}`)

      expect(typeof result.conversationState).toBe("string")
      if (fixture.expected?.conversationState) {
        expect(result.conversationState).toBe(fixture.expected.conversationState)
      }
      if (typeof fixture.expected?.isComplete === "boolean") {
        expect(result.isComplete).toBe(fixture.expected.isComplete)
      }
    }, 120000)
  }
})