import type { KnowledgeNote, KnowledgeNoteEntryType } from "./types"

type GroupingInput = Pick<KnowledgeNote, "id" | "title" | "summary" | "tags" | "group" | "series" | "entryType">

function normalizePathLikeValue(value: string | undefined): string | undefined {
  const normalized = (value ?? "")
    .trim()
    .replace(/\\+/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/")

  return normalized || undefined
}

function inferEntryType(group: string | undefined, series: string | undefined, text: string): KnowledgeNoteEntryType | undefined {
  if (/(^|\b)(index|overview|current state|current-state)(\b|$)/.test(text)) return "overview"
  if (series) return "entry"
  if (group) return "note"
  return undefined
}

export function inferKnowledgeNoteGrouping(note: GroupingInput): {
  group?: string
  series?: string
  entryType?: KnowledgeNoteEntryType
} {
  const explicitGroup = normalizePathLikeValue(note.group)
  const explicitSeries = normalizePathLikeValue(note.series)
  const explicitEntryType = note.entryType
  const text = [note.id, note.title, note.summary ?? "", ...(note.tags ?? [])].join(" ").toLowerCase()

  if (explicitGroup || explicitSeries || explicitEntryType) {
    return {
      group: explicitGroup,
      series: explicitSeries,
      entryType: explicitEntryType ?? inferEntryType(explicitGroup, explicitSeries, text),
    }
  }

  if (text.includes("discord")) {
    const series = /recap|summary/.test(text) ? "recaps" : undefined
    return { group: "discord", series, entryType: inferEntryType("discord", series, text) }
  }

  if (text.includes("x-feed") || text.includes("x feed") || text.includes("xf feed")) {
    const series = text.includes("summary") ? "summaries" : undefined
    return { group: "x-feed", series, entryType: inferEntryType("x-feed", series, text) }
  }

  if (text.includes("tweet") || text.includes("tweets")) {
    const series = text.includes("thread") ? "threads" : undefined
    return { group: "tweets", series, entryType: inferEntryType("tweets", series, text) }
  }

  return { entryType: inferEntryType(undefined, undefined, text) }
}
