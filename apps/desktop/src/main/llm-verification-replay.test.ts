import { describe, expect, it } from "vitest"
import {
  type AgentStateReplayFixture,
  buildVerificationMessagesFromAgentState,
  parseContinueReplayFixture,
  resolveContinueReplayMessages,
  VERIFICATION_SYSTEM_PROMPT,
} from "./llm-verification-replay"

function makeAgentStateFixture(overrides: Partial<AgentStateReplayFixture> = {}): AgentStateReplayFixture {
  return {
    version: 1 as const,
    id: "needs-input-example",
    mode: "agent_state" as const,
    transcript: "Update the PR and ask before merging.",
    finalAssistantText: "Do you want me to merge it now?",
    storedResponse: "I updated the PR. Do you want me to merge it now?",
    verificationFailCount: 1,
    conversationHistory: [
      { role: "user", content: "Update the PR and ask before merging." },
      { role: "assistant", content: "", toolCalls: [{ name: "respond_to_user", arguments: { text: "I updated the PR. Do you want me to merge it now?" } }] },
    ],
    ...overrides,
  }
}

describe("llm-verification-replay", () => {
  it("builds production-shaped verifier messages from captured agent state", () => {
    const messages = buildVerificationMessagesFromAgentState(makeAgentStateFixture())

    expect(messages[0]?.role).toBe("system")
    expect(messages[1]?.content).toContain("Original request:")
    expect(messages.map((message) => message.content).join("\n")).toContain("Latest explicit user-facing response from the agent")
    expect(messages.map((message) => message.content).join("\n")).toContain("verification attempt #2")
    expect(messages.map((message) => message.content).join("\n")).not.toContain("[Calling tools: respond_to_user]")
  })

  it("adds retry notes to the final verifier request only after a failed attempt", () => {
    const initialRequest = buildVerificationMessagesFromAgentState(
      makeAgentStateFixture({ verificationFailCount: 0 }),
    ).at(-1)?.content
    const retryRequest = buildVerificationMessagesFromAgentState(
      makeAgentStateFixture({ verificationFailCount: 2 }),
    ).at(-1)?.content

    expect(initialRequest).toContain("Return JSON only")
    expect(initialRequest).not.toContain("verification attempt")
    expect(retryRequest).toContain("verification attempt #3")
  })

  it("resolves agent_state fixtures into built verification messages", () => {
    const fixture = parseContinueReplayFixture(makeAgentStateFixture())
    expect(fixture.mode).toBe("agent_state")
    if (fixture.mode !== "agent_state") {
      throw new Error("Expected agent_state fixture")
    }

    const messages = resolveContinueReplayMessages(fixture)
    expect(messages.at(-1)?.content).toContain("Return JSON only")
    expect(messages.some((message) => message.content.includes("Latest explicit user-facing response from the agent"))).toBe(true)
  })

  it("passes exact verifier messages through unchanged", () => {
    const fixture = parseContinueReplayFixture({
      version: 1,
      id: "exact-messages",
      mode: "exact_verifier_messages",
      messages: [
        { role: "system", content: "Verifier system prompt" },
        { role: "user", content: "Original request" },
      ],
    })

    expect(fixture.mode).toBe("exact_verifier_messages")
    if (fixture.mode !== "exact_verifier_messages") {
      throw new Error("Expected exact verifier fixture")
    }

    expect(resolveContinueReplayMessages(fixture)).toEqual(fixture.messages)
  })

  it("rejects invalid exact-message fixtures early", () => {
    expect(() => parseContinueReplayFixture({
      version: 1,
      id: "broken-exact",
      mode: "exact_verifier_messages",
      expected: { conversationState: "not-a-state" },
      messages: [{ role: "tool", content: "bad role" }],
    })).toThrow(/expected\.conversationState|role must be user, assistant, or system/)
  })

  it("rejects invalid agent-state conversation history entries", () => {
    expect(() => parseContinueReplayFixture({
      ...makeAgentStateFixture(),
      conversationHistory: [{ role: "system", content: 42 }],
    })).toThrow(/conversationHistory\[0\]/)
  })

  it("includes guardrails against optional approval or preference questions ending unfinished work", () => {
    expect(VERIFICATION_SYSTEM_PROMPT).toContain("optional preference")
    expect(VERIFICATION_SYSTEM_PROMPT).toContain("no PR was opened yet")
    expect(VERIFICATION_SYSTEM_PROMPT).toContain("did not create the main requested artifact")
  })
})
