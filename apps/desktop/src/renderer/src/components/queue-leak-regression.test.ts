import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const overlaySource = readFileSync(
  new URL("./overlay-follow-up-input.tsx", import.meta.url),
  "utf8",
)

const tileSource = readFileSync(
  new URL("./tile-follow-up-input.tsx", import.meta.url),
  "utf8",
)

const sessionActionDialogSource = readFileSync(
  new URL("./session-action-dialog.tsx", import.meta.url),
  "utf8",
)

function expectQueuedModeDoesNotOptimisticallyAppend(source: string) {
  expect(source).toContain('const shouldAppendOptimistically = inputPresentation.mode === "send"')
  expect(source).toContain("const rollbackOptimisticAppend = sessionId && shouldAppendOptimistically")
  expect(source).toContain("if (data?.queued) {")
  expect(source).toContain("rollbackOptimisticAppend?.()")
  expect(source).toContain("} else if (sessionId && !rollbackOptimisticAppend) {")
}

function expectQueuedGuardBeforeOptimisticAppend(source: string, guard: string) {
  const lines = source.split("\n")
  const appendIndex = lines.findIndex((line) =>
    line.includes("appendUserMessageToSession"),
  )

  expect(appendIndex).toBeGreaterThan(-1)
  const surroundingBlock = lines.slice(Math.max(0, appendIndex - 5), appendIndex + 1).join("\n")
  expect(surroundingBlock).toContain(guard)
}

describe("queued messages do not leak into main chat during analyzing/planning phase (#323)", () => {
  it("skips optimistic appendUserMessageToSession when overlay message is queued", () => {
    // Queue-mode submissions must not optimistically append to conversationHistory.
    // If the UI thought the session was complete but the backend races and queues
    // the message anyway, the optimistic append is rolled back.
    expectQueuedModeDoesNotOptimisticallyAppend(overlaySource)
  })

  it("skips optimistic appendUserMessageToSession when tile message is queued", () => {
    expectQueuedModeDoesNotOptimisticallyAppend(tileSource)
  })

  it("skips optimistic appendUserMessageToSession when session-action-dialog message is queued", () => {
    expect(sessionActionDialogSource).toContain("!result?.queued")
    expectQueuedGuardBeforeOptimisticAppend(sessionActionDialogSource, "!result?.queued")
  })
})
