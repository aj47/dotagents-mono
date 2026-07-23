import { describe, expect, it } from "vitest"

import {
  isDeliverableResponseContent,
  isGarbledToolCallText,
  isProgressUpdateResponse,
  normalizeVerificationResultForCompletion,
  resolveIterationLimitFinalContent,
  sanitizeAssistantContentForToolCalls,
} from "./llm-continuation-guards"

describe("continuation guard helpers", () => {
  it("normalizes verifier output using explicit conversation states", () => {
    expect(normalizeVerificationResultForCompletion(
      { conversationState: "needs_input", isComplete: false, confidence: 0.92, missingItems: [" 2FA code ", ""] },
    )).toEqual(expect.objectContaining({
      conversationState: "needs_input",
      isComplete: true,
      missingItems: ["2FA code"],
    }))
  })

  it("falls back to complete when verifier only returns isComplete=true", () => {
    expect(normalizeVerificationResultForCompletion(
      { isComplete: true, confidence: 0.88, missingItems: [] },
    )).toEqual(expect.objectContaining({ isComplete: true }))
  })

  it("falls back to running when verifier output is incomplete", () => {
    expect(normalizeVerificationResultForCompletion(
      { reason: "More work remains", missingItems: ["summary"] },
    )).toEqual(expect.objectContaining({
      conversationState: "running",
      isComplete: false,
      missingItems: ["summary"],
    }))
  })

  it("downgrades optional approval after unfinished PR work from needs_input to running", () => {
    expect(normalizeVerificationResultForCompletion(
      {
        conversationState: "needs_input",
        isComplete: true,
        reason: "The assistant is waiting on user approval.",
        missingItems: ["User approval to proceed with the final QA rerun/push/open-PR steps"],
      },
      {
        verificationMessages: [
          { role: "system", content: "Verifier" },
          { role: "user", content: "Original request:\nCan you run the loop and submit a PR with screenshots?" },
          { role: "assistant", content: "I ran the checks, but no PR was created yet because QA approval was not reached. If you want, I can do those final steps now." },
          { role: "user", content: "Return JSON only." },
        ],
      },
    )).toEqual(expect.objectContaining({
      conversationState: "running",
      isComplete: false,
    }))
  })

  it("keeps explicit ask-first approvals as needs_input", () => {
    expect(normalizeVerificationResultForCompletion(
      {
        conversationState: "needs_input",
        isComplete: true,
        reason: "The assistant is waiting on user approval.",
        missingItems: ["User approval to merge the PR"],
      },
      {
        verificationMessages: [
          { role: "system", content: "Verifier" },
          { role: "user", content: "Original request:\nUpdate the PR and ask me before you merge it." },
          { role: "assistant", content: "The PR is updated and ready. Do you want me to merge it now?" },
          { role: "user", content: "Return JSON only." },
        ],
      },
    )).toEqual(expect.objectContaining({
      conversationState: "needs_input",
      isComplete: true,
    }))
  })

  it("downgrades optional style preference before creating requested agents to running", () => {
    expect(normalizeVerificationResultForCompletion(
      {
        conversationState: "needs_input",
        isComplete: true,
        reason: "The assistant is waiting on a style preference.",
        missingItems: ["User preference on agent style/tone before creating the agent profiles"],
      },
      {
        verificationMessages: [
          { role: "system", content: "Verifier" },
          { role: "user", content: "Original request:\nGather context, then create two agents for this workflow." },
          { role: "assistant", content: "I gathered the context. If you want, next I'll create both profiles. Quick preference before I do it: strict/accountability-heavy or collaborative/coaching?" },
          { role: "user", content: "Return JSON only." },
        ],
      },
    )).toEqual(expect.objectContaining({
      conversationState: "running",
      isComplete: false,
    }))
  })

  it("downgrades mid-analysis recovery strategy handoff to running", () => {
    expect(normalizeVerificationResultForCompletion(
      {
        conversationState: "needs_input",
        isComplete: true,
        reason: "The assistant asked for the user's chosen recovery strategy and clean baseline commit before continuing.",
        missingItems: [
          "User's chosen recovery strategy (hard reset, selective revert, or cherry-pick)",
          "The last clean commit hash before the loops ran",
        ],
      },
      {
        verificationMessages: [
          { role: "system", content: "Verifier" },
          { role: "user", content: "Original request:\nRecover the repo from the bad loops and get it back to a clean state." },
          { role: "assistant", content: "We're mid-analysis — I've laid out the three recovery options (hard reset, selective revert, cherry-pick onto clean base) and need your input on which approach to take, plus the last clean commit hash before the loops ran. What do you want to do?" },
          { role: "user", content: "Return JSON only." },
        ],
      },
    )).toEqual(expect.objectContaining({
      conversationState: "running",
      isComplete: false,
    }))
  })

  it("prefers stored respond_to_user content at iteration limit", () => {
    expect(resolveIterationLimitFinalContent({
      finalContent: "",
      storedResponse: "Done! Two new iTerm windows are open.",
      conversationHistory: [{ role: "assistant", content: "Let me also check PR details." }],
      hasRecentErrors: false,
    })).toEqual({
      content: "Done! Two new iTerm windows are open.",
      usedExplicitUserResponse: true,
    })
  })

  it("falls back to the latest assistant content when no explicit user response exists", () => {
    expect(resolveIterationLimitFinalContent({
      finalContent: "",
      conversationHistory: [{ role: "assistant", content: "Latest assistant summary" }],
      hasRecentErrors: false,
    })).toEqual({
      content: "Latest assistant summary",
      usedExplicitUserResponse: false,
    })
  })

  it("does not reuse assistant messages from before the current request", () => {
    expect(resolveIterationLimitFinalContent({
      finalContent: "",
      conversationHistory: [
        { role: "user", content: "Older request" },
        { role: "assistant", content: "Older assistant summary" },
        { role: "user", content: "Current request" },
      ],
      sinceIndex: 2,
      hasRecentErrors: false,
    })).toEqual({
      content: "Task reached maximum iteration limit while still in progress. Some actions may have been completed successfully - please review the tool results above.",
      usedExplicitUserResponse: false,
    })
  })

  it("ignores raw tool transcript final content and prefers a real assistant summary", () => {
    expect(resolveIterationLimitFinalContent({
      finalContent: '[execute_command] {"command":"pwd"}',
      conversationHistory: [{ role: "assistant", content: "I confirmed the working directory." }],
      hasRecentErrors: false,
    })).toEqual({
      content: "I confirmed the working directory.",
      usedExplicitUserResponse: false,
    })
  })

  it("does not surface progress-update text when iteration limit is reached", () => {
    expect(resolveIterationLimitFinalContent({
      finalContent: "Let me check one more thing.",
      conversationHistory: [{ role: "assistant", content: "I'll verify the final step." }],
      hasRecentErrors: false,
    })).toEqual({
      content: "Task reached maximum iteration limit while still in progress. Some actions may have been completed successfully - please review the tool results above.",
      usedExplicitUserResponse: false,
    })
  })

  it("rejects tool placeholders as non-deliverable content", () => {
    expect(isDeliverableResponseContent("[Calling tools: read_file]")).toBe(false)
  })

  it("rejects pure thinking blocks as non-deliverable content", () => {
    expect(isDeliverableResponseContent("<think>Need to inspect more chunks.</think>")).toBe(false)
    expect(isDeliverableResponseContent("<think>Need to inspect more chunks.")).toBe(false)
    expect(isDeliverableResponseContent("Need to inspect more chunks.</think>")).toBe(false)
    expect(resolveIterationLimitFinalContent({
      finalContent: "<think>Need to inspect more chunks.</think>",
      conversationHistory: [{ role: "assistant", content: "<think>Still planning.</think>" }],
      hasRecentErrors: false,
    })).toEqual({
      content: "Task reached maximum iteration limit while still in progress. Some actions may have been completed successfully - please review the tool results above.",
      usedExplicitUserResponse: false,
    })
  })

  it("rejects tool placeholders with trailing content (relaxed anchor)", () => {
    expect(isDeliverableResponseContent("[Calling tools: mark_work_complete] some trailing text")).toBe(false)
  })

  it("rejects garbled tool-call-as-text output (regression)", () => {
    // Real examples from production: model hallucinates tool call syntax as text
    expect(isDeliverableResponseContent(
      '[Calling tools: multi_tool_use.parallel] to=multi_tool_use.parallel  qq天天中彩票 json\n{"tool_uses":[{"recipient_name":"functions.save_note","parameters":{"body":"test"}}]}'
    )).toBe(false)
    expect(isDeliverableResponseContent(
      '[Calling tools: respond_to_user]ҩцәа to=functions.respond_to_user json\n{"text":"some response"}'
    )).toBe(false)
    expect(isDeliverableResponseContent(
      'multi_tool_use.parallel to=functions.execute_command'
    )).toBe(false)
  })

  it("treats mixed status-plus-intent responses as progress updates, not deliverable answers", () => {
    const content = "The new empty field is at @e33 (nth=4). Let me add the next item."
    expect(isProgressUpdateResponse(content)).toBe(true)
    expect(isDeliverableResponseContent(content)).toBe(false)
  })

  it("treats bare next-step continuation text as progress updates", () => {
    const content = 'Next: "Health insurance docs (Form 1095)".'
    expect(isProgressUpdateResponse(content)).toBe(true)
    expect(isDeliverableResponseContent(content)).toBe(false)
  })

  it("treats continuing/searching intent text as progress updates", () => {
    const content = "Continuing the audit search now."
    expect(isProgressUpdateResponse(content)).toBe(true)
    expect(isDeliverableResponseContent(content)).toBe(false)
  })

  it("only classifies actual placeholder-style tool text as garbled", () => {
    expect(isGarbledToolCallText('[Calling tools: execute_command]')).toBe(true)
    expect(isGarbledToolCallText('The new empty field is at @e33 (nth=4). Let me add the next item.')).toBe(false)
  })

  it("flags bare top-level functions.<name>({...}) wrappers as garbled", () => {
    // Real example from #401: model emitted plain-text function-call syntax alongside
    // a structured mark_work_complete tool call.
    expect(isGarbledToolCallText('functions.respond_to_user({"text":"All done."})')).toBe(true)
    expect(isGarbledToolCallText('functions.execute_command({ "command": "ls" })')).toBe(true)
    expect(isDeliverableResponseContent('functions.respond_to_user({"text":"All done."})')).toBe(false)
    // Prose mentioning the word "functions" without the call+object-literal shape
    // should not be flagged.
    expect(isGarbledToolCallText('The available functions include respond_to_user and execute_command.')).toBe(false)
  })

  it("strips garbled tool-call-as-text content when structured tool calls are present", () => {
    // Real example from #401: assistant emits a plain-text functions.respond_to_user
    // wrapper alongside a structured mark_work_complete tool call. The plain text
    // must not be persisted, or it replays back to the model as user-pasted text.
    expect(
      sanitizeAssistantContentForToolCalls(
        'functions.respond_to_user({"text":"All done."})',
        [{ name: "mark_work_complete", arguments: {} }],
      ),
    ).toBe("")
    // Without structured tool calls, the content is preserved (it's the regular
    // garbled-text-loop guard's job to detect that case via isGarbledToolCallText).
    expect(
      sanitizeAssistantContentForToolCalls(
        'functions.respond_to_user({"text":"All done."})',
        undefined,
      ),
    ).toBe('functions.respond_to_user({"text":"All done."})')
    // Legitimate prose alongside tool calls is preserved.
    expect(
      sanitizeAssistantContentForToolCalls(
        "Running the tests now.",
        [{ name: "execute_command", arguments: {} }],
      ),
    ).toBe("Running the tests now.")
    // Empty content passes through.
    expect(
      sanitizeAssistantContentForToolCalls("", [{ name: "execute_command", arguments: {} }]),
    ).toBe("")
    expect(sanitizeAssistantContentForToolCalls(undefined, undefined)).toBe("")
  })

  it("treats common sign-offs as deliverable content", () => {
    expect(isDeliverableResponseContent("Done — let me know if you need anything else.")).toBe(true)
    expect(resolveIterationLimitFinalContent({
      finalContent: "Done — let me know if you need anything else.",
      conversationHistory: [{ role: "assistant", content: "Let me check one more thing." }],
      hasRecentErrors: false,
    })).toEqual({
      content: "Done — let me know if you need anything else.",
      usedExplicitUserResponse: false,
    })
  })
})
