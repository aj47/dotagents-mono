import { describe, it, expect, vi, beforeEach } from "vitest"
import type { AgentStepSummary } from "@shared/types"

let mockConfig: Record<string, unknown> = {
  dualModelEnabled: false,
  modelPresets: [],
}

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => "/tmp"),
  },
}))

// Avoid importing the real configStore (it touches disk + electron paths at module init).
vi.mock("./config", () => ({
  configStore: {
    get: () => mockConfig,
  },
  globalAgentsFolder: "/tmp/.agents",
  resolveWorkspaceAgentsFolder: () => null,
}))

vi.mock("./debug", () => ({
  isDebugLLM: () => false,
  logLLM: vi.fn(),
}))

// Not directly used by the units we test here, but summarization-service imports them.
vi.mock("ai", () => ({
  generateText: vi.fn(),
}))

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => ({
    chat: vi.fn(() => ({})),
  })),
}))

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => ({}))),
}))

vi.mock("./chatgpt-web-provider", () => ({
  makeChatGptWebCompletion: vi.fn(),
}))

function enableSummarization() {
  mockConfig = {
    dualModelEnabled: true,
    currentModelPresetId: "test-preset",
    modelPresets: [
      {
        id: "test-preset",
        name: "Test Preset",
        apiKey: "test-key",
        baseUrl: "https://api.example.com/v1",
        isBuiltIn: false,
      },
    ],
  }
}

describe("summarizeAgentStep", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockConfig = {
      dualModelEnabled: false,
      modelPresets: [],
    }
  })

  it("extracts and sanitizes noteCandidates (single-line, max 5)", async () => {
    enableSummarization()
    const { generateText } = await import("ai")
    const { summarizeAgentStep } = await import("./summarization-service")

    const input = {
      sessionId: "sess_1",
      stepNumber: 1,
      assistantResponse: "ok",
    }

    const response = JSON.stringify({
      actionSummary: "did stuff",
      keyFindings: [],
      nextSteps: "",
      decisionsMade: [],
      noteCandidates: [
        "preference:  user likes  pnpm\nand hates npm",
        123,
        "",
        "constraint:  don't run installs  without permission",
        "fact: repo uses tipc",
        "insight:    durable note candidates reduce bloat",
      ],
      importance: "high",
    })

    vi.mocked(generateText).mockResolvedValue({ text: response } as any)

    const summary = await summarizeAgentStep(input as any)

    expect(summary?.actionSummary).toBe("did stuff")
    expect(summary?.importance).toBe("high")
    expect(summary?.noteCandidates).toEqual([
      "preference: user likes pnpm and hates npm",
      "constraint: don't run installs without permission",
      "fact: repo uses tipc",
      "insight: durable note candidates reduce bloat",
    ])
  })

  it("truncates noteCandidates to 240 chars", async () => {
    enableSummarization()
    const { generateText } = await import("ai")
    const { summarizeAgentStep } = await import("./summarization-service")

    const long = `fact: ${"a".repeat(500)}`
    const response = JSON.stringify({
      actionSummary: "x",
      noteCandidates: [long],
      importance: "medium",
    })

    vi.mocked(generateText).mockResolvedValue({ text: response } as any)

    const summary = await summarizeAgentStep({ sessionId: "s", stepNumber: 1 } as any)
    expect(summary?.noteCandidates).toHaveLength(1)
    expect(summary?.noteCandidates?.[0]).toHaveLength(240)
    expect(summary?.noteCandidates?.[0].startsWith("fact: ")).toBe(true)
  })

  it("returns empty noteCandidates on parse failure", async () => {
    enableSummarization()
    const { generateText } = await import("ai")
    const { summarizeAgentStep } = await import("./summarization-service")

    vi.mocked(generateText).mockResolvedValue({ text: "not json" } as any)

    const summary = await summarizeAgentStep({
      sessionId: "sess",
      stepNumber: 2,
      assistantResponse: "hello world",
    } as any)

    expect(summary?.noteCandidates).toEqual([])
    expect(summary?.actionSummary).toBe("hello world")
    expect(summary?.importance).toBe("medium")
  })

  it("supports provider-level Groq summarization without a preset", async () => {
    mockConfig = {
      dualModelEnabled: true,
      dualModelWeakProviderId: "groq",
      dualModelWeakGroqModel: "llama-3.3-70b-versatile",
      groqApiKey: "groq-key",
      groqBaseUrl: "https://api.groq.com/openai/v1",
      modelPresets: [],
    }
    const { generateText } = await import("ai")
    const { createOpenAI } = await import("@ai-sdk/openai")
    const { summarizeAgentStep } = await import("./summarization-service")

    vi.mocked(generateText).mockResolvedValue({
      text: JSON.stringify({
        actionSummary: "summarized with groq",
        noteCandidates: [],
        importance: "medium",
      }),
    } as any)

    const summary = await summarizeAgentStep({ sessionId: "s", stepNumber: 3 } as any)

    expect(summary?.actionSummary).toBe("summarized with groq")
    expect(createOpenAI).toHaveBeenCalledWith({
      apiKey: "groq-key",
      baseURL: "https://api.groq.com/openai/v1",
    })
  })

  it("routes OpenAI Codex summarization through the summary model context", async () => {
    mockConfig = {
      dualModelEnabled: true,
      dualModelWeakProviderId: "chatgpt-web",
      dualModelWeakChatgptWebModel: "gpt-5.3-codex-spark",
      modelPresets: [],
    }
    const { makeChatGptWebCompletion } = await import("./chatgpt-web-provider")
    const { summarizeAgentStep } = await import("./summarization-service")

    vi.mocked(makeChatGptWebCompletion).mockResolvedValue(JSON.stringify({
      actionSummary: "summarized with codex",
      noteCandidates: [],
      importance: "medium",
    }))

    const summary = await summarizeAgentStep({ sessionId: "s", stepNumber: 4 } as any)

    expect(summary?.actionSummary).toBe("summarized with codex")
    expect(makeChatGptWebCompletion).toHaveBeenCalledWith(
      [{ role: "user", content: expect.stringContaining("Respond ONLY with valid JSON") }],
      { modelContext: "summary" },
    )
  })
})

describe("KnowledgeNotesService.createNoteFromSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it("returns null when there are no durable fields", async () => {
    const { knowledgeNotesService } = await import("./knowledge-notes-service")

    const summary: AgentStepSummary = {
      id: "summary_1",
      sessionId: "sess",
      stepNumber: 1,
      timestamp: Date.now(),
      actionSummary: "ran tools",
      importance: "medium",
    }

    expect(knowledgeNotesService.createNoteFromSummary(summary)).toBeNull()
  })

  it("filters out candidates without allowed type prefixes", async () => {
    const { knowledgeNotesService } = await import("./knowledge-notes-service")

    const summary: AgentStepSummary = {
      id: "summary_prefix",
      sessionId: "sess",
      stepNumber: 3,
      timestamp: Date.now(),
      actionSummary: "ran tools",
      importance: "medium",
      noteCandidates: [
        "preference: use pnpm",
        "telemetry: ran 5 tools",
        "random noise without colon",
        "fact:",
        "constraint",
        "insight:   ",
        "fact: repo uses vitest",
      ],
    }

    const note = knowledgeNotesService.createNoteFromSummary(summary)
    expect(note).not.toBeNull()
    expect(note?.summary).toBe("preference: use pnpm | fact: repo uses vitest")
    expect(note?.context).toBe("auto")
  })

  it("truncates fallback decisionsMade/keyFindings to 240 chars per item", async () => {
    const { knowledgeNotesService } = await import("./knowledge-notes-service")

    const longDecision = "a".repeat(500)
    const summary: AgentStepSummary = {
      id: "summary_trunc",
      sessionId: "sess",
      stepNumber: 4,
      timestamp: Date.now(),
      actionSummary: "ran tools",
      importance: "medium",
      decisionsMade: [longDecision],
    }

    const note = knowledgeNotesService.createNoteFromSummary(summary)
    expect(note).not.toBeNull()
    expect(note?.summary).toHaveLength(240)
  })

  it("prefers noteCandidates and derives tags", async () => {
    const { knowledgeNotesService } = await import("./knowledge-notes-service")

    const summary: AgentStepSummary = {
      id: "summary_2",
      sessionId: "sess",
      stepNumber: 2,
      timestamp: Date.now(),
      actionSummary: "ran tools",
      importance: "high",
      tags: ["existing"],
      decisionsMade: ["decision a"],
      keyFindings: ["finding a"],
      noteCandidates: [
        "preference: use pnpm",
        "constraint:  don't run installs without permission",
        "fact: repo uses tipc",
        "insight: should be ignored (only first 3 candidates used)",
      ],
    }

    const note = knowledgeNotesService.createNoteFromSummary(summary, undefined, undefined, ["manual"])
    expect(note).not.toBeNull()

    expect(note?.summary).toBe(
      "preference: use pnpm | constraint: don't run installs without permission | fact: repo uses tipc",
    )
    expect(note?.tags).toEqual(["existing", "manual", "preference", "constraint", "fact"])
    expect(note?.context).toBe("auto")
  })
})

describe("KnowledgeNotesService.createNoteFromSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it("creates an auto working note with readable note semantics", async () => {
    const { knowledgeNotesService } = await import("./knowledge-notes-service")

    const summary: AgentStepSummary = {
      id: "summary_note_1",
      sessionId: "sess",
      stepNumber: 5,
      timestamp: Date.now(),
      actionSummary: "captured durable context",
      importance: "high",
      tags: ["existing"],
      keyFindings: ["repo uses pnpm"],
      noteCandidates: [
        "preference: use pnpm",
        "constraint: don't install dependencies without permission",
      ],
    }

    const note = knowledgeNotesService.createNoteFromSummary(summary, undefined, "keep this handy", ["manual"], "Chat", "conv_1")

    expect(note).not.toBeNull()
    expect(note?.id.startsWith("memory_")).toBe(false)
    expect(note?.context).toBe("auto")
    expect(note?.summary).toContain("preference: use pnpm")
    expect(note?.tags).toEqual(["existing", "manual", "preference", "constraint"])
    expect(note?.body).toContain("## Notes")
    expect(note?.references).toEqual(["conv_1"])
  })

  it("infers grouped placement for recurring Discord recap notes", async () => {
    const { knowledgeNotesService } = await import("./knowledge-notes-service")

    const summary: AgentStepSummary = {
      id: "summary_discord_recap",
      sessionId: "sess",
      stepNumber: 6,
      timestamp: Date.now(),
      actionSummary: "captured discord recap",
      importance: "high",
      tags: ["discord", "summary"],
      noteCandidates: [
        "insight: Discord recap for the community and product updates",
      ],
    }

    const note = knowledgeNotesService.createNoteFromSummary(summary, "Discord recap for Mar 18")

    expect(note).not.toBeNull()
    expect(note?.group).toBe("discord")
    expect(note?.series).toBe("recaps")
    expect(note?.entryType).toBe("entry")
  })
})
