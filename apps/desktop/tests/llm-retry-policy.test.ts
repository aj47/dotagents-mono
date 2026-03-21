import test from "node:test"
import assert from "node:assert/strict"

import { classifyRetryDisposition } from "../src/main/llm-retry-policy.ts"

test("classifyRetryDisposition fails fast for credential cooldown exhaustion", () => {
  const error = Object.assign(
    new Error("All credentials for model claude-sonnet-4-6 are cooling down"),
    { statusCode: 429, isRetryable: true }
  )

  assert.deepEqual(classifyRetryDisposition(error), { kind: "credential-cooldown" })
})

test("classifyRetryDisposition fails fast for provider account rate limits", () => {
  const error = Object.assign(
    new Error("This request would exceed your account's rate limit. Please try again later."),
    { statusCode: 429, isRetryable: true }
  )

  assert.deepEqual(classifyRetryDisposition(error), { kind: "account-rate-limit" })
})

test("classifyRetryDisposition keeps generic 429 errors indefinitely retryable", () => {
  const error = Object.assign(new Error("Rate limited"), { statusCode: 429 })

  assert.deepEqual(classifyRetryDisposition(error), { kind: "retry-indefinitely" })
})

test("classifyRetryDisposition keeps empty responses on the immediate-retry path", () => {
  const error = new Error("LLM returned empty response")

  assert.deepEqual(classifyRetryDisposition(error), { kind: "retry-immediately" })
})