import { describe, expect, it } from "vitest"

import {
  filterConversationSearchEntries,
  getConversationSearchResult,
  normalizeConversationSearchText,
  scoreConversationSearchField,
} from "./conversation-list-search"

const entry = (overrides: Partial<{
  id: string
  kind: "active" | "saved"
  title: string
  preview: string
  lastMessage: string
  updatedAt: number
}> = {}) => ({
  id: overrides.id ?? "entry",
  kind: overrides.kind ?? "saved",
  title: overrides.title ?? "Untitled",
  preview: overrides.preview ?? "",
  lastMessage: overrides.lastMessage ?? "",
  updatedAt: overrides.updatedAt ?? 1,
})

describe("conversation list search", () => {
  it("normalizes query and field text consistently", () => {
    expect(normalizeConversationSearchText("  Ship\nThe\tFeature  ")).toBe("ship the feature")
  })

  it("scores direct prefix matches above later substring matches", () => {
    expect(scoreConversationSearchField("project notes", "project")).toBeGreaterThan(
      scoreConversationSearchField("notes for project", "project"),
    )
  })

  it("returns the best weighted search field", () => {
    expect(getConversationSearchResult({
      title: "Daily notes",
      preview: "Project prism status",
      lastMessage: "Done",
    }, "project", 0.1)).toEqual({
      field: "preview",
      score: expect.any(Number),
    })
  })

  it("preserves list order for empty queries and applies the result limit", () => {
    expect(filterConversationSearchEntries([
      entry({ id: "one", updatedAt: 1 }),
      entry({ id: "two", updatedAt: 2 }),
      entry({ id: "three", updatedAt: 3 }),
    ], " ", { limit: 2 }).map((item) => item.id)).toEqual(["one", "two"])
  })

  it("ranks stronger title matches before weaker preview matches", () => {
    expect(filterConversationSearchEntries([
      entry({ id: "preview-match", title: "Notes", preview: "Project launch", updatedAt: 20 }),
      entry({ id: "title-match", title: "Project launch", preview: "", updatedAt: 10 }),
    ], "project", { threshold: 0.1 }).map((item) => item.id)).toEqual(["title-match", "preview-match"])
  })

  it("uses active conversations as the default tie-breaker before saved conversations", () => {
    expect(filterConversationSearchEntries([
      entry({ id: "saved", kind: "saved", title: "Project", updatedAt: 20 }),
      entry({ id: "active", kind: "active", title: "Project", updatedAt: 10 }),
    ], "project").map((item) => item.id)).toEqual(["active", "saved"])
  })

  it("uses recency after rank, kind, and field ties", () => {
    expect(filterConversationSearchEntries([
      entry({ id: "older", kind: "saved", title: "Project", updatedAt: 10 }),
      entry({ id: "newer", kind: "saved", title: "Project", updatedAt: 20 }),
    ], "project").map((item) => item.id)).toEqual(["newer", "older"])
  })
})
