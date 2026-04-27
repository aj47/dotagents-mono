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
    // The onSuccess callback must check data?.queued and only append when NOT queued.
    // When a message is queued (session already active), it should NOT be appended
    // to the session's conversationHistory, preventing it from appearing in the
    // main chat during the analyzing/planning phase.
    expect(overlaySource).toContain("!data?.queued")
    expectQueuedGuardBeforeOptimisticAppend(overlaySource, "!data?.queued")
  })

  it("skips optimistic appendUserMessageToSession when tile message is queued", () => {
    expect(tileSource).toContain("!data?.queued")
    expectQueuedGuardBeforeOptimisticAppend(tileSource, "!data?.queued")
  })

  it("skips optimistic appendUserMessageToSession when session-action-dialog message is queued", () => {
    expect(sessionActionDialogSource).toContain("!result?.queued")
    expectQueuedGuardBeforeOptimisticAppend(sessionActionDialogSource, "!result?.queued")
  })
})
