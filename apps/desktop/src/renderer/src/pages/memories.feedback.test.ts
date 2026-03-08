import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const memoriesPageSource = readFileSync(new URL("./memories.tsx", import.meta.url), "utf8")

describe("desktop memories page failure feedback", () => {
  it("does not treat false delete or update results as success", () => {
    expect(memoriesPageSource).toContain(
      'function getMemoryMutationFailureMessage(action: "delete" | "update"): string',
    )
    expect(memoriesPageSource).toContain("onSuccess: (didDelete) => {")
    expect(memoriesPageSource).toContain("if (!didDelete) {")
    expect(memoriesPageSource).toContain('toast.error(getMemoryMutationFailureMessage("delete"))')
    expect(memoriesPageSource).toContain("onSuccess: (didUpdate) => {")
    expect(memoriesPageSource).toContain("if (!didUpdate) {")
    expect(memoriesPageSource).toContain('toast.error(getMemoryMutationFailureMessage("update"))')
  })
})