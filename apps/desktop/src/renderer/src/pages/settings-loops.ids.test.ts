import { describe, expect, it, vi } from "vitest"
import { buildUniqueLoopId, slugifyLoopId } from "./settings-loops.ids"

describe("settings loop id helpers", () => {
  it("slugifies readable loop ids", () => {
    expect(slugifyLoopId("  Daily Summary / Inbox  ")).toBe("daily-summary-inbox")
  })

  it("reuses the base id when it is available", () => {
    expect(buildUniqueLoopId("Daily Summary", ["weekly-review"]))
      .toBe("daily-summary")
  })

  it("adds a numeric suffix when the slug already exists", () => {
    expect(buildUniqueLoopId("Daily Summary", ["daily-summary", "daily-summary-2"]))
      .toBe("daily-summary-3")
  })

  it("treats existing ids case-insensitively to avoid filesystem collisions", () => {
    expect(buildUniqueLoopId("Daily Summary", ["Daily-Summary"]))
      .toBe("daily-summary-2")
  })

  it("keeps suffixed ids within the length cap", () => {
    const longName = "a".repeat(80)
    const existingId = "a".repeat(64)

    expect(buildUniqueLoopId(longName, [existingId]))
      .toBe(`${"a".repeat(62)}-2`)
  })

  it("falls back to crypto for names without slug characters", () => {
    const randomUuidSpy = vi.spyOn(crypto, "randomUUID").mockReturnValue("generated-loop-id")

    expect(slugifyLoopId("!!!")).toBe("generated-loop-id")

    randomUuidSpy.mockRestore()
  })
})