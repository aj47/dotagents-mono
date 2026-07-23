import { describe, expect, it } from "vitest"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

describe("OpenAI-compatible prompt-cache wire contract", () => {
  it("serializes prompt_cache_key/session_id and maps cached usage without inflating input", async () => {
    let requestUrl = ""
    let requestBody: Record<string, unknown> | undefined
    let requestHeaders: Headers | undefined

    const provider = createOpenAI({
      apiKey: "wire-test-key",
      baseURL: "https://cliproxy.example.test/v1",
      fetch: async (input, init) => {
        requestUrl = String(input)
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>
        requestHeaders = new Headers(init?.headers)
        return new Response(JSON.stringify({
          id: "wire-test-response",
          object: "chat.completion",
          created: 1,
          model: "gpt-4.1-mini",
          choices: [{
            index: 0,
            message: { role: "assistant", content: "ok" },
            finish_reason: "stop",
          }],
          usage: {
            prompt_tokens: 1000,
            completion_tokens: 10,
            total_tokens: 1010,
            prompt_tokens_details: { cached_tokens: 800 },
          },
        }), {
          headers: { "content-type": "application/json" },
        })
      },
    }).chat("gpt-4.1-mini")

    const result = await generateText({
      model: provider,
      messages: [
        { role: "system", content: "stable system prefix" },
        { role: "user", content: "current turn" },
      ],
      headers: { session_id: "conversation-1" },
      providerOptions: { openai: { promptCacheKey: "conversation-1" } },
    })

    expect(requestUrl).toBe("https://cliproxy.example.test/v1/chat/completions")
    expect(requestBody?.prompt_cache_key).toBe("conversation-1")
    expect(requestBody?.messages).toEqual([
      { role: "system", content: "stable system prefix" },
      { role: "user", content: "current turn" },
    ])
    expect(requestHeaders?.get("session_id")).toBe("conversation-1")
    expect(requestHeaders?.get("authorization")).toBe("Bearer wire-test-key")
    expect(result.usage.inputTokens).toBe(1000)
    expect(result.usage.inputTokenDetails.cacheReadTokens).toBe(800)
    expect(result.usage.inputTokenDetails.cacheReadTokens).toBeLessThanOrEqual(result.usage.inputTokens ?? 0)
  })
})
