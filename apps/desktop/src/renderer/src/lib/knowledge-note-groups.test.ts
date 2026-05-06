import { describe, expect, it } from "vitest"

import type { KnowledgeNote } from "@dotagents/shared/knowledge-note-domain"

import { buildKnowledgeNoteSections, getKnowledgeNoteGrouping } from "@dotagents/shared/knowledge-note-grouping"

function makeNote(id: string, overrides: Partial<KnowledgeNote> = {}): KnowledgeNote {
  return {
    id,
    title: id,
    context: "search-only",
    updatedAt: 1,
    tags: [],
    body: id,
    ...overrides,
  }
}

describe("knowledge note grouping", () => {
  it("uses explicit group and series metadata when present", () => {
    const note = makeNote("2026-03-18", { group: "discord", series: "recaps" })
    expect(getKnowledgeNoteGrouping(note)).toEqual({ group: "discord", series: "recaps" })
  })

  it("infers a discord recap grouping for legacy flat notes", () => {
    const note = makeNote("discord-recaps-2026-03-18", { title: "Discord recap" })
    expect(getKnowledgeNoteGrouping(note)).toEqual({ group: "discord", series: "recaps" })
  })

  it("builds grouped sections while preserving note order inside each bucket", () => {
    const sections = buildKnowledgeNoteSections([
      makeNote("discord-recaps-2026-03-19", { title: "Discord recap" }),
      makeNote("architecture-overview"),
      makeNote("x-feed-2026-03-18", { title: "X feed summary" }),
    ])

    expect(sections.map((section) => section.key)).toEqual(["discord", "__ungrouped__", "x-feed"])
    expect(sections[0].seriesSections[0].notes.map((note) => note.id)).toEqual(["discord-recaps-2026-03-19"])
    expect(sections[1].notes.map((note) => note.id)).toEqual(["architecture-overview"])
    expect(sections[2].seriesSections[0].label).toBe("Summaries")
  })
})
