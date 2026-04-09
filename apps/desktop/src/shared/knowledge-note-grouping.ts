import type { KnowledgeNote, KnowledgeNoteEntryType, KnowledgePageType } from "./types"

type GroupingInput = Pick<KnowledgeNote, "id" | "title" | "summary" | "tags" | "group" | "series" | "entryType" | "pageType">

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

function inferPageType(note: GroupingInput, text: string): KnowledgePageType | undefined {
  if (note.pageType) return note.pageType
  if (/(\bbrand\b|\bcompany\b|\bperson\b|\bpeople\b|\btool\b|\bentity\b)/.test(text)) return "entity"
  if (/(\bproject\b|vibe code cup|dotagents|wiki|crm|outreach)/.test(text)) return "project"
  if (/(\bidea\b|theory|hypothesis|experiment)/.test(text)) return "idea"
  if (/(\bopportunity\b|deal|partnership|brand deal|collab|event)/.test(text)) return "opportunity"
  if (/(\bdaily\b|weekly|recap|summary)/.test(text)) return "daily"
  if (/(\btopic\b|strategy|mindset|system|knowledge)/.test(text)) return "topic"
  return "note"
}

export function inferKnowledgeNoteGrouping(note: GroupingInput): {
  group?: string
  series?: string
  entryType?: KnowledgeNoteEntryType
  pageType?: KnowledgePageType
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
      pageType: inferPageType(note, text),
    }
  }

  if (text.includes("discord")) {
    const series = /recap|summary/.test(text) ? "recaps" : undefined
    return { group: "discord", series, entryType: inferEntryType("discord", series, text), pageType: inferPageType(note, text) }
  }

  if (text.includes("x-feed") || text.includes("x feed") || text.includes("xf feed")) {
    const series = text.includes("summary") ? "summaries" : undefined
    return { group: "x-feed", series, entryType: inferEntryType("x-feed", series, text), pageType: inferPageType(note, text) }
  }

  if (text.includes("tweet") || text.includes("tweets")) {
    const series = text.includes("thread") ? "threads" : undefined
    return { group: "tweets", series, entryType: inferEntryType("tweets", series, text), pageType: inferPageType(note, text) }
  }

  return { entryType: inferEntryType(undefined, undefined, text), pageType: inferPageType(note, text) }
}
