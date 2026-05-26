import { describe, expect, it } from "vitest"
import { buildOpenAIRealtimeWebSocketUrl, extractRealtimeErrorReason, resolveOpenAIRealtimeBaseUrl, sanitizeRealtimeModel } from "./realtime-proxy"

describe("realtime proxy helpers", () => {
  it("builds the default OpenAI Realtime WebSocket URL", () => {
    expect(buildOpenAIRealtimeWebSocketUrl(undefined, "gpt-realtime-mini"))
      .toBe("wss://api.openai.com/v1/realtime?model=gpt-realtime-mini")
  })

  it("normalizes custom OpenAI-compatible base URLs", () => {
    expect(buildOpenAIRealtimeWebSocketUrl("https://gateway.example.com/v1/", "model name"))
      .toBe("wss://gateway.example.com/v1/realtime?model=model%20name")
  })

  it("uses the official OpenAI Realtime base URL when text models are routed through localhost", () => {
    expect(resolveOpenAIRealtimeBaseUrl("http://localhost:8317/v1")).toBe("https://api.openai.com/v1")
    expect(buildOpenAIRealtimeWebSocketUrl("http://127.0.0.1:8317/v1", "gpt-realtime-mini"))
      .toBe("wss://api.openai.com/v1/realtime?model=gpt-realtime-mini")
  })

  it("uses the official OpenAI Realtime base URL when chat models are routed through OpenRouter", () => {
    expect(resolveOpenAIRealtimeBaseUrl("https://openrouter.ai/api/v1")).toBe("https://api.openai.com/v1")
    expect(buildOpenAIRealtimeWebSocketUrl("https://openrouter.ai/api/v1", "gpt-realtime-mini"))
      .toBe("wss://api.openai.com/v1/realtime?model=gpt-realtime-mini")
  })

  it("uses the official OpenAI Realtime base URL for placeholder example URLs", () => {
    expect(resolveOpenAIRealtimeBaseUrl("https://api.example.com/v1")).toBe("https://api.openai.com/v1")
    expect(buildOpenAIRealtimeWebSocketUrl("https://api.example.com/v1", "gpt-realtime-mini"))
      .toBe("wss://api.openai.com/v1/realtime?model=gpt-realtime-mini")
  })

  it("falls back to the realtime mini model for blank input", () => {
    expect(sanitizeRealtimeModel("   ")).toBe("gpt-realtime-mini")
  })

  it("extracts realtime upstream error messages", () => {
    expect(extractRealtimeErrorReason(JSON.stringify({ type: "error", error: { message: "Invalid API key" } })))
      .toBe("Invalid API key")
  })

  it("extracts OpenAI HTTP error response messages", () => {
    expect(extractRealtimeErrorReason(JSON.stringify({ error: { message: "Unauthorized" } })))
      .toBe("Unauthorized")
  })
})