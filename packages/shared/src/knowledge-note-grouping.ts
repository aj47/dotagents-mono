import {
  normalizeKnowledgeNotePathValue,
  titleizeKnowledgeNotePath,
  type KnowledgeNoteEntryType,
} from "./knowledge-note-domain"

export type { KnowledgeNoteDateFilter, KnowledgeNoteSort } from "./knowledge-note-domain"

export type KnowledgeNoteGroupingInput = {
  id: string
  title: string
  summary?: string
  tags?: string[]
  group?: string
  series?: string
  entryType?: KnowledgeNoteEntryType
}

export type KnowledgeNoteGrouping = {
  group?: string
  series?: string
  entryType?: KnowledgeNoteEntryType
}

export type KnowledgeNoteSeriesSection<T extends KnowledgeNoteGroupingInput = KnowledgeNoteGroupingInput> = {
  key: string
  label: string
  notes: T[]
}

export type KnowledgeNoteSeriesSummary = {
  key: string
  label: string
  count: number
}

export type KnowledgeNoteGroupSection<T extends KnowledgeNoteGroupingInput = KnowledgeNoteGroupingInput> = {
  key: string
  label: string
  notes: T[]
  seriesSections: KnowledgeNoteSeriesSection<T>[]
}

export type KnowledgeNoteGroupSummary = {
  key: string
  label: string
  totalCount: number
  directCount: number
  seriesSummaries: KnowledgeNoteSeriesSummary[]
}

export type KnowledgeNotesOverview = {
  total: number
  autoCount: number
  searchOnlyCount: number
  groups: KnowledgeNoteGroupSummary[]
}

function inferEntryType(group: string | undefined, series: string | undefined, text: string): KnowledgeNoteEntryType | undefined {
  if (/(^|\b)(index|overview|current state|current-state)(\b|$)/.test(text)) return "overview"
  if (series) return "entry"
  if (group) return "note"
  return undefined
}

export function inferKnowledgeNoteGrouping(note: KnowledgeNoteGroupingInput): KnowledgeNoteGrouping {
  const explicitGroup = normalizeKnowledgeNotePathValue(note.group)
  const explicitSeries = normalizeKnowledgeNotePathValue(note.series)
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

export function getKnowledgeNoteGrouping(note: KnowledgeNoteGroupingInput): { group?: string; series?: string } {
  const grouping = inferKnowledgeNoteGrouping(note)
  return { group: grouping.group, series: grouping.series }
}

export function buildKnowledgeNoteSections<T extends KnowledgeNoteGroupingInput>(notes: T[]): KnowledgeNoteGroupSection<T>[] {
  const groups = new Map<string, { label: string; notes: T[]; series: Map<string, KnowledgeNoteSeriesSection<T>> }>()

  for (const note of notes) {
    const grouping = getKnowledgeNoteGrouping(note)
    const groupKey = grouping.group ?? "__ungrouped__"
    const groupLabel = grouping.group ? titleizeKnowledgeNotePath(grouping.group) : "Ungrouped"
    const group = groups.get(groupKey) ?? { label: groupLabel, notes: [], series: new Map<string, KnowledgeNoteSeriesSection<T>>() }

    if (grouping.series) {
      const existingSeries = group.series.get(grouping.series) ?? {
        key: `${groupKey}:${grouping.series}`,
        label: titleizeKnowledgeNotePath(grouping.series),
        notes: [],
      }
      existingSeries.notes.push(note)
      group.series.set(grouping.series, existingSeries)
    } else {
      group.notes.push(note)
    }

    groups.set(groupKey, group)
  }

  return Array.from(groups.entries()).map(([key, value]) => ({
    key,
    label: value.label,
    notes: value.notes,
    seriesSections: Array.from(value.series.values()),
  }))
}
