export const CONVERSATION_SEARCH_RESULT_LIMIT = 50
export const CONVERSATION_SEARCH_DEFAULT_FUZZY_THRESHOLD = 0.33

const TITLE_MATCH_WEIGHT = 0.6
const PREVIEW_MATCH_WEIGHT = 0.25
const LAST_MESSAGE_MATCH_WEIGHT = 0.15

export type SearchableConversationField = "title" | "preview" | "lastMessage"

export type SearchableConversation = {
  title: string
  preview: string
  lastMessage: string
}

export type SearchableConversationListEntry = SearchableConversation & {
  kind?: string
  updatedAt: number
}

export type ConversationSearchResult = {
  field: SearchableConversationField
  score: number
}

export interface FilterConversationSearchEntriesOptions<TEntry extends SearchableConversationListEntry> {
  limit?: number
  threshold?: number
  getKindPriority?: (entry: TEntry) => number
}

function getFieldWeight(field: SearchableConversationField): number {
  switch (field) {
    case "title":
      return TITLE_MATCH_WEIGHT
    case "preview":
      return PREVIEW_MATCH_WEIGHT
    case "lastMessage":
      return LAST_MESSAGE_MATCH_WEIGHT
    default:
      return 0
  }
}

function getFieldPriority(field: SearchableConversationField): number {
  switch (field) {
    case "title":
      return 0
    case "preview":
      return 1
    case "lastMessage":
      return 2
    default:
      return 3
  }
}

function getDefaultKindPriority(entry: SearchableConversationListEntry): number {
  return entry.kind === "active" ? 0 : 1
}

export function normalizeConversationSearchText(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim()
}

export function scoreConversationSearchField(fieldValue: string, query: string): number {
  const normalizedField = normalizeConversationSearchText(fieldValue)
  const normalizedQuery = normalizeConversationSearchText(query)

  if (!normalizedField || !normalizedQuery) {
    return 0
  }

  if (normalizedField.includes(normalizedQuery)) {
    const position = normalizedField.indexOf(normalizedQuery)
    const positionBonus = position === 0 ? 0.15 : Math.max(0, 0.08 - position * 0.002)
    const lengthPenalty = Math.min(0.15, normalizedField.length / 500)
    return Math.min(1, 0.85 + positionBonus - lengthPenalty)
  }

  let score = 0
  let lastMatchedIndex = -1
  for (const character of normalizedQuery) {
    const nextIndex = normalizedField.indexOf(character, lastMatchedIndex + 1)
    if (nextIndex === -1) {
      return 0
    }

    score += 1
    if (nextIndex === lastMatchedIndex + 1) {
      score += 0.35
    }
    if (nextIndex === 0 || normalizedField[nextIndex - 1] === " ") {
      score += 0.2
    }
    lastMatchedIndex = nextIndex
  }

  return Math.min(1, score / (normalizedQuery.length * 1.55))
}

export function getConversationSearchResult(
  conversation: SearchableConversation,
  query: string,
  threshold = CONVERSATION_SEARCH_DEFAULT_FUZZY_THRESHOLD,
): ConversationSearchResult | null {
  const normalizedQuery = normalizeConversationSearchText(query)
  if (!normalizedQuery) {
    return { field: "title", score: 1 }
  }

  const orderedFields: SearchableConversationField[] = ["title", "preview", "lastMessage"]
  let bestResult: ConversationSearchResult | null = null

  for (const field of orderedFields) {
    const rawScore = scoreConversationSearchField(conversation[field], normalizedQuery)
    if (rawScore <= 0) continue

    const weightedScore = rawScore * getFieldWeight(field)
    if (!bestResult || weightedScore > bestResult.score) {
      bestResult = { field, score: weightedScore }
    }
  }

  if (!bestResult || bestResult.score < threshold) {
    return null
  }

  return bestResult
}

export function filterConversationSearchEntries<TEntry extends SearchableConversationListEntry>(
  entries: readonly TEntry[],
  query: string,
  options: FilterConversationSearchEntriesOptions<TEntry> = {},
): TEntry[] {
  const limit = options.limit ?? CONVERSATION_SEARCH_RESULT_LIMIT
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return entries.slice(0, limit)
  }

  const getKindPriority = options.getKindPriority ?? getDefaultKindPriority

  return entries
    .map((entry) => {
      const result = getConversationSearchResult(entry, normalizedQuery, options.threshold)
      if (!result) return null

      return {
        entry,
        rank: result.score,
        kindPriority: getKindPriority(entry),
        fieldPriority: getFieldPriority(result.field),
      }
    })
    .filter((entry): entry is {
      entry: TEntry
      rank: number
      kindPriority: number
      fieldPriority: number
    } => entry !== null)
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank
      if (a.kindPriority !== b.kindPriority) return a.kindPriority - b.kindPriority
      if (a.fieldPriority !== b.fieldPriority) return a.fieldPriority - b.fieldPriority
      return b.entry.updatedAt - a.entry.updatedAt
    })
    .slice(0, limit)
    .map((entry) => entry.entry)
}
