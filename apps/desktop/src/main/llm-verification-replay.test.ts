import { describe, expect, it } from "vitest"
import {
  buildVerificationMessagesFromAgentState,
  parseContinueReplayFixture,
  resolveContinueReplayMessages,
  VERIFICATION_SYSTEM_PROMPT,
} from "./llm-verification-replay"

describe("llm-verification-replay", () => {
  it("builds production-shaped verifier messages from captured agent state", () => {
    const messages = buildVerificationMessagesFromAgentState({
      version: 1,
      id: "needs-input-example",
      mode: "agent_state",
      transcript: "Update the PR and ask before merging.",
      finalAssistantText: "Do you want me to merge it now?",
      storedResponse: "I updated the PR. Do you want me to merge it now?",
      verificationFailCount: 1,
      conversationHistory: [
        { role: "user", content: "Update the PR and ask before merging." },
        { role: "assistant", content: "", toolCalls: [{ name: "respond_to_user", arguments: { text: "I updated the PR. Do you want me to merge it now?" } }] },
      ],
    })

    expect(messages[0]?.role).toBe("system")
    expect(messages[1]?.content).toContain("Original request:")
    expect(messages.map((message) => message.content).join("\n")).toContain("Latest explicit user-facing response from the agent")
    expect(messages.map((message) => message.content).join("\n")).toContain("verification attempt #2")
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

  it("includes guardrails against optional approval or preference questions ending unfinished work", () => {
    expect(VERIFICATION_SYSTEM_PROMPT).toContain("optional preference")
    expect(VERIFICATION_SYSTEM_PROMPT).toContain("no PR was opened yet")
    expect(VERIFICATION_SYSTEM_PROMPT).toContain("did not create the main requested artifact")
  })
})