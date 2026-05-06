import { describe, expect, it } from "vitest"

import {
  buildKnowledgeNoteSections,
  getKnowledgeNoteGrouping,
  inferKnowledgeNoteGrouping,
  type KnowledgeNoteGroupingInput,
  type KnowledgeNotesOverview,
} from "./knowledge-note-grouping"

function makeNote(id: string, overrides: Partial<KnowledgeNoteGroupingInput> = {}): KnowledgeNoteGroupingInput {
  return {
    id,
    title: id,
    tags: [],
    ...overrides,
  }
}

describe("knowledge note grouping", () => {
  it("uses explicit group, series, and entry type metadata when present", () => {
    const note = makeNote("2026-03-18", {
      group: " discord\\recaps ",
      series: " weekly_summaries ",
      entryType: "overview",
    })

    expect(inferKnowledgeNoteGrouping(note)).toEqual({
      group: "discord/recaps",
      series: "weekly_summaries",
      entryType: "overview",
    })
  })

  it("infers a discord recap grouping for legacy flat notes", () => {
    const note = makeNote("discord-recaps-2026-03-18", { title: "Discord recap" })
    expect(getKnowledgeNoteGrouping(note)).toEqual({ group: "discord", series: "recaps" })
  })

  it("infers legacy feed and tweet groups from text", () => {
    expect(getKnowledgeNoteGrouping(makeNote("x-feed-2026-03-18", { title: "X feed summary" }))).toEqual({
      group: "x-feed",
      series: "summaries",
    })
    expect(getKnowledgeNoteGrouping(makeNote("tweet-thread-draft", { title: "Tweet thread ideas" }))).toEqual({
      group: "tweets",
      series: "threads",
    })
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

  it("exposes overview summary contracts for app surfaces", () => {
    const overview: KnowledgeNotesOverview = {
      total: 3,
      autoCount: 2,
      searchOnlyCount: 1,
      groups: [
        {
          key: "discord",
          label: "Discord",
          totalCount: 2,
          directCount: 1,
          seriesSummaries: [{ key: "discord:recaps", label: "Recaps", count: 1 }],
        },
      ],
    }

    expect(overview.groups[0].seriesSummaries[0].count).toBe(1)
  })
})
