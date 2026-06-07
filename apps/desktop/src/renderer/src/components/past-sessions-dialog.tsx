import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import dayjs from "dayjs"
import {
  AlertTriangle,
  Archive,
  Clock,
  Loader2,
  Pin,
  Search,
  Trash2,
} from "lucide-react"

import { cn } from "@renderer/lib/utils"
import { orderConversationHistoryByPinnedFirst } from "@renderer/lib/pinned-session-history"
import { getSidebarStatusPresentation } from "@renderer/lib/session-presentation"
import {
  getLatestUserFacingResponse,
  getSidebarActivityPresentation,
} from "@renderer/lib/sidebar-sessions"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import {
  useSavedConversationsQuery,
  useDeleteSavedConversationMutation,
  useDeleteAllSavedConversationsMutation,
} from "@renderer/lib/queries"
import { Input } from "@renderer/components/ui/input"
import { Button } from "@renderer/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import { toast } from "sonner"
import { useAgentStore } from "@renderer/stores"
import type { AgentProgressUpdate } from "@shared/types"
import { normalizeMessagePreviewText } from "@dotagents/shared/message-display-utils"

const INITIAL_SAVED_CONVERSATIONS = 20
const SEARCH_RESULT_LIMIT = 50
const SEARCH_DEBOUNCE_MS = 120
const DEFAULT_FUZZY_THRESHOLD = 0.33
const MIN_SEARCH_TEXT_QUERY_CHARS = 2
const MAX_FUZZY_FIELD_LENGTH = 1000
const MAX_CONVERSATION_SEARCH_TEXT_CHARS = 8000
const MAX_CONVERSATION_SEARCH_SOURCE_CHARS = 8000
const MAX_CONVERSATION_PREVIEW_SOURCE_CHARS = 2000
const TITLE_MATCH_WEIGHT = 0.6
const PREVIEW_MATCH_WEIGHT = 0.25
const LAST_MESSAGE_MATCH_WEIGHT = 0.15
const SEARCH_TEXT_MATCH_WEIGHT = 0.1
const KEYBOARD_SHORTCUT_HINT = navigator.platform.toLowerCase().includes("mac")
  ? "⌘K"
  : "Ctrl+K"
const PIN_SHORTCUT_HINT = navigator.platform.toLowerCase().includes("mac")
  ? "⌘P"
  : "Ctrl+P"
const VOICE_SHORTCUT_HINT = "V"

type SearchableConversationField =
  | "title"
  | "preview"
  | "lastMessage"
  | "searchText"

type SearchableConversation = {
  title: string
  preview: string
  lastMessage: string
  searchText: string
}

type ConversationSearchResult = {
  field: SearchableConversationField
  rawScore: number
  score: number
}

type GetConversationSearchIndex = () => SearchableConversation

type ActiveSearchIndexCacheEntry = {
  signature: string
  searchIndex: SearchableConversation
}

interface AgentSessionRecord {
  id: string
  conversationId?: string
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  startTime: number
  endTime?: number
  lastActivity?: string
  errorMessage?: string
  isSnoozed?: boolean
}

interface SessionListResponse {
  activeSessions: AgentSessionRecord[]
  recentCompletedSessions?: AgentSessionRecord[]
  recentSessions?: AgentSessionRecord[]
}

type ConversationListEntryKind = "active" | "saved"

type ConversationListEntry = {
  key: string
  kind: ConversationListEntryKind
  title: string
  conversationId?: string
  sessionId?: string
  updatedAt: number
  preview: string
  lastMessage: string
  getSearchIndex: GetConversationSearchIndex
  statusLabel: string
  statusRailClassName: string
  isPinned: boolean
  isArchived: boolean
}

function formatTimestamp(timestamp: number): string {
  const now = dayjs()
  const date = dayjs(timestamp)
  // Clamp to 0 to handle clock skew (when timestamp is slightly in the future)
  const diffSeconds = Math.max(0, now.diff(date, "second"))
  const diffMinutes = Math.max(0, now.diff(date, "minute"))
  const diffHours = Math.max(0, now.diff(date, "hour"))

  if (diffHours < 24) {
    if (diffSeconds < 60) return `${diffSeconds}s`
    if (diffMinutes < 60) return `${diffMinutes}m`
    return `${diffHours}h`
  }

  if (diffHours < 168) return date.format("ddd h:mm A")
  return date.format("MMM D")
}

function getFieldWeight(field: SearchableConversationField): number {
  switch (field) {
    case "title":
      return TITLE_MATCH_WEIGHT
    case "preview":
      return PREVIEW_MATCH_WEIGHT
    case "lastMessage":
      return LAST_MESSAGE_MATCH_WEIGHT
    case "searchText":
      return SEARCH_TEXT_MATCH_WEIGHT
    default:
      return 0
  }
}

function normalizeSearchText(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim()
}

function truncateText(
  value: string | undefined,
  maxChars: number,
): string | undefined {
  if (!value || value.length <= maxChars) return value
  return value.slice(0, maxChars)
}

function normalizeConversationText(
  value: string | undefined,
  maxSourceChars = MAX_CONVERSATION_PREVIEW_SOURCE_CHARS,
): string {
  return normalizeMessagePreviewText(truncateText(value, maxSourceChars)) ?? ""
}

function buildConversationSearchIndex(
  conversation: SearchableConversation,
): SearchableConversation {
  return {
    title: normalizeSearchText(conversation.title),
    preview: normalizeSearchText(conversation.preview),
    lastMessage: normalizeSearchText(conversation.lastMessage),
    searchText: normalizeSearchText(conversation.searchText),
  }
}

function createLazySearchIndex(
  buildSearchableConversation: () => SearchableConversation,
): GetConversationSearchIndex {
  let cachedSearchIndex: SearchableConversation | null = null
  return () => {
    if (!cachedSearchIndex) {
      cachedSearchIndex = buildConversationSearchIndex(
        buildSearchableConversation(),
      )
    }
    return cachedSearchIndex
  }
}

function textFingerprint(value: string | undefined): string {
  if (!value) return "0"
  return `${value.length}:${value.slice(0, 24)}:${value.slice(-48)}`
}

function textArrayFingerprint(
  values: Array<string | undefined> | undefined,
): string {
  if (!values?.length) return "0"
  let totalLength = 0
  let firstFingerprint = ""
  let lastFingerprint = ""
  for (const value of values) {
    if (!value) continue
    totalLength += value.length
    if (!firstFingerprint) {
      firstFingerprint = textFingerprint(value)
    }
    lastFingerprint = textFingerprint(value)
  }
  return `${values.length}:${totalLength}:${firstFingerprint}:${lastFingerprint}`
}

function conversationHistorySearchFingerprint(
  progress?: AgentProgressUpdate | null,
): string {
  const messages = progress?.conversationHistory
  if (!messages?.length) return "0"

  let searchableCount = 0
  let totalLength = 0
  let latestTimestamp = 0
  let firstFingerprint = ""
  let lastFingerprint = ""

  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") continue
    const text = message.displayContent ?? message.content
    searchableCount += 1
    totalLength += text?.length ?? 0
    if (
      typeof message.timestamp === "number" &&
      Number.isFinite(message.timestamp)
    ) {
      latestTimestamp = Math.max(latestTimestamp, message.timestamp)
    }
    if (text && !firstFingerprint) {
      firstFingerprint = textFingerprint(text)
    }
    if (text) {
      lastFingerprint = textFingerprint(text)
    }
  }

  return [
    messages.length,
    searchableCount,
    totalLength,
    latestTimestamp,
    firstFingerprint,
    lastFingerprint,
  ].join(":")
}

function responseEventsSearchFingerprint(
  progress?: AgentProgressUpdate | null,
): string {
  const events = progress?.responseEvents
  if (!events?.length) return "0"

  let totalLength = 0
  let latestTimestamp = 0
  let firstFingerprint = ""
  let lastFingerprint = ""
  for (const event of events) {
    totalLength += event.text?.length ?? 0
    if (
      typeof event.timestamp === "number" &&
      Number.isFinite(event.timestamp)
    ) {
      latestTimestamp = Math.max(latestTimestamp, event.timestamp)
    }
    if (event.text && !firstFingerprint) {
      firstFingerprint = textFingerprint(event.text)
    }
    if (event.text) {
      lastFingerprint = textFingerprint(event.text)
    }
  }

  return [
    events.length,
    totalLength,
    latestTimestamp,
    firstFingerprint,
    lastFingerprint,
  ].join(":")
}

function buildActiveSearchIndexSignature(
  session: AgentSessionRecord,
  progress: AgentProgressUpdate | null | undefined,
  title: string,
  lastMessage: string,
): string {
  return [
    session.id,
    progress?.runId ?? "",
    progress?.conversationId ?? session.conversationId ?? "",
    title,
    lastMessage,
    session.lastActivity ?? "",
    session.errorMessage ?? "",
    conversationHistorySearchFingerprint(progress),
    responseEventsSearchFingerprint(progress),
    textArrayFingerprint(progress?.userResponseHistory),
    textFingerprint(progress?.userResponse),
    textFingerprint(progress?.finalContent),
  ].join("\u0000")
}

function getCachedActiveSearchIndex(
  cache: Map<string, ActiveSearchIndexCacheEntry>,
  session: AgentSessionRecord,
  progress: AgentProgressUpdate | null | undefined,
  title: string,
  lastMessage: string,
): SearchableConversation {
  const signature = buildActiveSearchIndexSignature(
    session,
    progress,
    title,
    lastMessage,
  )
  const cached = cache.get(session.id)
  if (cached?.signature === signature) {
    return cached.searchIndex
  }

  const searchText = getConversationSearchText(
    progress,
    session.lastActivity,
    session.errorMessage,
  )
  const searchIndex = buildConversationSearchIndex({
    title,
    preview: lastMessage,
    lastMessage,
    searchText,
  })
  cache.set(session.id, { signature, searchIndex })
  return searchIndex
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs)
    return () => window.clearTimeout(timeoutId)
  }, [delayMs, value])

  return debouncedValue
}

function getConversationSnippet(
  progress?: AgentProgressUpdate | null,
  ...fallbacks: Array<string | undefined>
): string {
  const latestUserFacingResponse = progress
    ? getLatestUserFacingResponse(progress)
    : null
  if (latestUserFacingResponse) return latestUserFacingResponse

  for (
    let index = (progress?.conversationHistory?.length ?? 0) - 1;
    index >= 0;
    index -= 1
  ) {
    const message = progress?.conversationHistory?.[index]
    if (message?.role === "tool") continue
    const normalizedMessage = normalizeConversationText(message?.content)
    if (normalizedMessage) return normalizedMessage
  }

  for (const fallback of fallbacks) {
    const normalizedFallback = normalizeConversationText(fallback)
    if (normalizedFallback) return normalizedFallback
  }

  return "No messages yet"
}

function getConversationSearchText(
  progress?: AgentProgressUpdate | null,
  ...fallbacks: Array<string | undefined>
): string {
  const searchParts: string[] = []
  const seen = new Set<string>()
  let searchTextLength = 0
  const appendSearchPart = (value: string | undefined) => {
    if (searchTextLength >= MAX_CONVERSATION_SEARCH_TEXT_CHARS) return

    const remainingChars = MAX_CONVERSATION_SEARCH_TEXT_CHARS - searchTextLength
    const normalized = normalizeConversationText(
      truncateText(
        value,
        Math.min(MAX_CONVERSATION_SEARCH_SOURCE_CHARS, remainingChars),
      ),
      MAX_CONVERSATION_SEARCH_SOURCE_CHARS,
    )
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    searchParts.push(normalized)
    searchTextLength += normalized.length + (searchParts.length > 1 ? 1 : 0)
  }

  for (const message of progress?.conversationHistory ?? []) {
    if (message.role === "user" || message.role === "assistant") {
      appendSearchPart(message.displayContent ?? message.content)
    }
  }

  for (const event of progress?.responseEvents ?? []) {
    appendSearchPart(event.text)
  }
  for (const response of progress?.userResponseHistory ?? []) {
    appendSearchPart(response)
  }
  appendSearchPart(progress?.userResponse)
  appendSearchPart(progress?.finalContent)

  for (const fallback of fallbacks) {
    appendSearchPart(fallback)
  }

  const searchText = searchParts.join(" ")
  return searchText.length > MAX_CONVERSATION_SEARCH_TEXT_CHARS
    ? searchText.slice(0, MAX_CONVERSATION_SEARCH_TEXT_CHARS).trim()
    : searchText
}

function getLatestTimestamp(
  entries?: Array<{ timestamp?: number }> | null,
): number {
  if (!entries?.length) return 0

  let latestTimestamp = 0
  for (const entry of entries) {
    if (
      typeof entry.timestamp !== "number" ||
      !Number.isFinite(entry.timestamp)
    ) {
      continue
    }
    latestTimestamp = Math.max(latestTimestamp, entry.timestamp)
  }
  return latestTimestamp
}

function getSessionUpdatedAt(
  session: AgentSessionRecord,
  progress?: AgentProgressUpdate | null,
): number {
  return Math.max(
    getLatestTimestamp(progress?.conversationHistory),
    getLatestTimestamp(progress?.steps),
    getLatestTimestamp(progress?.responseEvents),
    session.endTime ?? 0,
    session.startTime,
  )
}

function scoreSearchField(
  normalizedField: string,
  normalizedQuery: string,
  options: { allowFuzzy?: boolean } = {},
): number {
  if (!normalizedField || !normalizedQuery) {
    return 0
  }

  if (normalizedField.includes(normalizedQuery)) {
    const position = normalizedField.indexOf(normalizedQuery)
    const positionBonus =
      position === 0 ? 0.15 : Math.max(0, 0.08 - position * 0.002)
    const lengthPenalty = Math.min(0.15, normalizedField.length / 500)
    return Math.min(1, 0.85 + positionBonus - lengthPenalty)
  }

  if (
    options.allowFuzzy === false ||
    normalizedField.length > MAX_FUZZY_FIELD_LENGTH
  ) {
    return 0
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

function getConversationSearchResult(
  searchIndex: SearchableConversation,
  normalizedQuery: string,
): ConversationSearchResult | null {
  if (!normalizedQuery) {
    return { field: "title", rawScore: 1, score: 1 }
  }

  const orderedFields: SearchableConversationField[] = [
    "title",
    "preview",
    "lastMessage",
    "searchText",
  ]
  let bestPassingResult: ConversationSearchResult | null = null

  for (const field of orderedFields) {
    if (
      field === "searchText" &&
      normalizedQuery.length < MIN_SEARCH_TEXT_QUERY_CHARS
    ) {
      continue
    }

    const rawScore = scoreSearchField(searchIndex[field], normalizedQuery, {
      allowFuzzy: field !== "searchText",
    })
    if (rawScore <= 0) continue

    const weightedScore = rawScore * getFieldWeight(field)
    if (
      rawScore >= DEFAULT_FUZZY_THRESHOLD &&
      (!bestPassingResult || weightedScore > bestPassingResult.score)
    ) {
      bestPassingResult = { field, rawScore, score: weightedScore }
    }
  }

  if (!bestPassingResult) {
    return null
  }

  return bestPassingResult
}

export function SavedConversationsDialog({
  open,
  onOpenChange,
  autoFocusSearch = false,
  initialArchivedOnly = false,
  onAutoFocusSearchHandled,
  onStartVoiceConversation,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  autoFocusSearch?: boolean
  initialArchivedOnly?: boolean
  onAutoFocusSearchHandled?: () => void
  onStartVoiceConversation?: (conversation: {
    id: string
    title: string
  }) => void
}) {
  const navigate = useNavigate()
  const savedConversationsQuery = useSavedConversationsQuery(open)
  const activeConversationsQuery = useQuery<SessionListResponse>({
    queryKey: ["agentSessions"],
    queryFn: async () => {
      return await tipcClient.getAgentSessions()
    },
    enabled: open,
    refetchOnWindowFocus: false,
  })
  const refetchActiveConversations = activeConversationsQuery.refetch
  const deleteSavedConversationMutation = useDeleteSavedConversationMutation()
  const deleteAllSavedConversationsMutation =
    useDeleteAllSavedConversationsMutation()
  const agentProgressById = useAgentStore((state) => state.agentProgressById)
  const pinnedSessionIds = useAgentStore((state) => state.pinnedSessionIds)
  const togglePinSession = useAgentStore((state) => state.togglePinSession)
  const archivedSessionIds = useAgentStore((state) => state.archivedSessionIds)
  const toggleArchiveSession = useAgentStore(
    (state) => state.toggleArchiveSession,
  )
  const setFocusedSessionId = useAgentStore(
    (state) => state.setFocusedSessionId,
  )
  const setExpandedSessionId = useAgentStore(
    (state) => state.setExpandedSessionId,
  )
  const setViewedConversationId = useAgentStore(
    (state) => state.setViewedConversationId,
  )
  const setScrollToSessionId = useAgentStore(
    (state) => state.setScrollToSessionId,
  )

  const [searchQuery, setSearchQuery] = useState("")
  const [visibleConversationCount, setVisibleConversationCount] = useState(
    INITIAL_SAVED_CONVERSATIONS,
  )
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [showArchivedOnly, setShowArchivedOnly] = useState(initialArchivedOnly)
  const [highlightedConversationId, setHighlightedConversationId] = useState<
    string | null
  >(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const activeSearchIndexCacheRef = useRef<
    Map<string, ActiveSearchIndexCacheEntry>
  >(new Map())
  const debouncedSearchQuery = useDebouncedValue(
    searchQuery,
    SEARCH_DEBOUNCE_MS,
  )
  const normalizedSearchQuery = useMemo(
    () => normalizeSearchText(searchQuery.trim() ? debouncedSearchQuery : ""),
    [debouncedSearchQuery, searchQuery],
  )

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setVisibleConversationCount(INITIAL_SAVED_CONVERSATIONS)
      setShowDeleteAllConfirm(false)
      setHighlightedConversationId(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setShowArchivedOnly(initialArchivedOnly)
  }, [initialArchivedOnly, open])

  useEffect(() => {
    if (!open) return
    // When searching, reset the lazy-load count so results feel predictable.
    setVisibleConversationCount(INITIAL_SAVED_CONVERSATIONS)
  }, [open, normalizedSearchQuery, showArchivedOnly])

  useEffect(() => {
    if (!open) return undefined

    const unlisten = rendererHandlers.agentSessionsUpdated.listen(() => {
      void refetchActiveConversations()
    })

    return unlisten
  }, [open, refetchActiveConversations])

  useEffect(() => {
    const cache = activeSearchIndexCacheRef.current
    if (!open) {
      cache.clear()
      return
    }

    const activeSessionIds = new Set(
      (activeConversationsQuery.data?.activeSessions ?? []).map(
        (session) => session.id,
      ),
    )
    for (const sessionId of agentProgressById.keys()) {
      activeSessionIds.add(sessionId)
    }
    for (const sessionId of cache.keys()) {
      if (!activeSessionIds.has(sessionId)) {
        cache.delete(sessionId)
      }
    }
  }, [open, activeConversationsQuery.data?.activeSessions, agentProgressById])

  useEffect(() => {
    if (!open) return undefined

    const focusSearchInput = () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    }

    focusSearchInput()
    const timeoutId = window.setTimeout(focusSearchInput, 0)
    return () => window.clearTimeout(timeoutId)
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      if (event.key.toLowerCase() !== "k") return

      const activeElement = document.activeElement as HTMLElement | null
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.isContentEditable

      if (isEditable && activeElement !== searchInputRef.current) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  useEffect(() => {
    if (!open || !autoFocusSearch) return undefined

    const focusSearch = () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
      onAutoFocusSearchHandled?.()
    }

    const frameId = window.requestAnimationFrame(() => {
      window.setTimeout(focusSearch, 0)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [open, autoFocusSearch, onAutoFocusSearchHandled])

  const activeConversationEntries = useMemo<ConversationListEntry[]>(() => {
    const trackedActiveSessions =
      activeConversationsQuery.data?.activeSessions ?? []
    const mergedSessions = new Map(
      trackedActiveSessions.map((session) => [session.id, session] as const),
    )

    for (const [sessionId, progress] of agentProgressById.entries()) {
      const existingSession = mergedSessions.get(sessionId)
      const firstHistoryTimestamp = progress.conversationHistory?.[0]?.timestamp
      const lastHistoryTimestamp =
        progress.conversationHistory?.[progress.conversationHistory.length - 1]
          ?.timestamp

      mergedSessions.set(sessionId, {
        id: sessionId,
        conversationId:
          progress.conversationId ?? existingSession?.conversationId,
        conversationTitle:
          progress.conversationTitle ?? existingSession?.conversationTitle,
        status: progress.isComplete
          ? "completed"
          : (existingSession?.status ?? "active"),
        startTime:
          existingSession?.startTime ??
          firstHistoryTimestamp ??
          lastHistoryTimestamp ??
          Date.now(),
        endTime:
          existingSession?.endTime ??
          (progress.isComplete ? lastHistoryTimestamp : undefined),
        lastActivity: existingSession?.lastActivity,
        errorMessage: existingSession?.errorMessage,
        isSnoozed: progress.isSnoozed ?? existingSession?.isSnoozed,
      })
    }

    return Array.from(mergedSessions.values())
      .map((session) => {
        const progress = agentProgressById.get(session.id)
        const sidebarActivity = getSidebarActivityPresentation(progress, {
          fallbackErrorText:
            session.status === "error" ? session.errorMessage : null,
        })
        const hasProgressErrors = !!progress?.steps?.some(
          (step) => step.status === "error" || step.toolResult?.error,
        )
        const sidebarStatus = getSidebarStatusPresentation({
          conversationState: progress?.conversationState,
          isComplete: progress?.isComplete,
          pendingToolApproval: progress?.pendingToolApproval,
          hasErrors: hasProgressErrors,
          sessionStatus: session.status,
          isSnoozed: progress?.isSnoozed ?? session.isSnoozed ?? false,
          hasForegroundActivity: sidebarActivity.isForegroundActivity,
          hasRecentFinalResponse: sidebarActivity.kind === "response",
        })
        const conversationId =
          progress?.conversationId ?? session.conversationId
        const title =
          progress?.conversationTitle?.trim() ||
          session.conversationTitle?.trim() ||
          "Untitled conversation"
        const lastMessage = getConversationSnippet(
          progress,
          session.lastActivity,
          session.errorMessage,
        )

        return {
          key: `active:${session.id}`,
          kind: "active" as const,
          title,
          conversationId,
          sessionId: session.id,
          updatedAt: getSessionUpdatedAt(session, progress),
          preview: lastMessage,
          lastMessage,
          getSearchIndex: () =>
            getCachedActiveSearchIndex(
              activeSearchIndexCacheRef.current,
              session,
              progress,
              title,
              lastMessage,
            ),
          statusLabel:
            session.status === "error"
              ? "Error"
              : session.status === "stopped"
                ? "Stopped"
                : sidebarActivity.label,
          statusRailClassName: sidebarStatus.railClassName,
          isPinned: conversationId
            ? pinnedSessionIds.has(conversationId)
            : false,
          isArchived: conversationId
            ? archivedSessionIds.has(conversationId)
            : false,
        }
      })
      .sort((a, b) => {
        const pinOrder = Number(b.isPinned) - Number(a.isPinned)
        if (pinOrder !== 0) return pinOrder
        return b.updatedAt - a.updatedAt
      })
  }, [
    activeConversationsQuery.data?.activeSessions,
    agentProgressById,
    archivedSessionIds,
    pinnedSessionIds,
  ])

  const baseSavedConversationEntries = useMemo<ConversationListEntry[]>(() => {
    const all = savedConversationsQuery.data ?? []

    return orderConversationHistoryByPinnedFirst(all, pinnedSessionIds).map(
      (conversation) => {
        const preview = getConversationSnippet(
          undefined,
          conversation.lastMessage,
          conversation.preview,
        )
        const lastMessage =
          normalizeConversationText(conversation.lastMessage) ||
          normalizeConversationText(conversation.preview)

        return {
          key: `saved:${conversation.id}`,
          kind: "saved" as const,
          title: conversation.title,
          conversationId: conversation.id,
          updatedAt: conversation.updatedAt,
          preview,
          lastMessage,
          getSearchIndex: createLazySearchIndex(() => ({
            title: conversation.title,
            preview,
            lastMessage,
            searchText: normalizeConversationText(
              conversation.searchText,
              MAX_CONVERSATION_SEARCH_SOURCE_CHARS,
            ),
          })),
          statusLabel: archivedSessionIds.has(conversation.id)
            ? "Archived"
            : "Saved",
          statusRailClassName: archivedSessionIds.has(conversation.id)
            ? "bg-muted-foreground/60"
            : "bg-green-500",
          isPinned: pinnedSessionIds.has(conversation.id),
          isArchived: archivedSessionIds.has(conversation.id),
        }
      },
    )
  }, [archivedSessionIds, pinnedSessionIds, savedConversationsQuery.data])

  const activeConversationIds = useMemo(() => {
    return new Set(
      activeConversationEntries
        .map((entry) => entry.conversationId)
        .filter((conversationId): conversationId is string => !!conversationId),
    )
  }, [activeConversationEntries])

  const savedConversationEntries = useMemo<ConversationListEntry[]>(() => {
    return baseSavedConversationEntries.filter(
      (conversation) =>
        !conversation.conversationId ||
        !activeConversationIds.has(conversation.conversationId),
    )
  }, [activeConversationIds, baseSavedConversationEntries])

  const allConversationEntries = useMemo(
    () => [...activeConversationEntries, ...savedConversationEntries],
    [activeConversationEntries, savedConversationEntries],
  )

  const archivedConversationCount = useMemo(
    () => allConversationEntries.filter((entry) => entry.isArchived).length,
    [allConversationEntries],
  )

  const filteredConversationEntries = useMemo(() => {
    const all = allConversationEntries.filter((conversation) =>
      showArchivedOnly ? conversation.isArchived : !conversation.isArchived,
    )

    if (!normalizedSearchQuery) {
      return all.slice(0, SEARCH_RESULT_LIMIT)
    }

    const rankedConversations = all
      .map((conversation) => {
        const result = getConversationSearchResult(
          conversation.getSearchIndex(),
          normalizedSearchQuery,
        )

        if (!result) return null

        return {
          conversation,
          rank: result.score,
          kindPriority: conversation.kind === "active" ? 0 : 1,
          fieldPriority:
            result.field === "title"
              ? 0
              : result.field === "preview"
                ? 1
                : result.field === "lastMessage"
                  ? 2
                  : 3,
        }
      })
      .filter(
        (
          entry,
        ): entry is {
          conversation: ConversationListEntry
          rank: number
          kindPriority: number
          fieldPriority: number
        } => entry !== null,
      )
      .sort((a, b) => {
        if (a.kindPriority !== b.kindPriority)
          return a.kindPriority - b.kindPriority
        if (b.conversation.updatedAt !== a.conversation.updatedAt) {
          return b.conversation.updatedAt - a.conversation.updatedAt
        }
        if (b.rank !== a.rank) return b.rank - a.rank
        if (a.fieldPriority !== b.fieldPriority)
          return a.fieldPriority - b.fieldPriority
        return a.conversation.title.localeCompare(b.conversation.title)
      })
      .map((entry) => entry.conversation)

    return rankedConversations.slice(0, SEARCH_RESULT_LIMIT)
  }, [
    allConversationEntries,
    normalizedSearchQuery,
    showArchivedOnly,
  ])

  const visibleConversationEntries = useMemo(
    () => filteredConversationEntries.slice(0, visibleConversationCount),
    [filteredConversationEntries, visibleConversationCount],
  )

  useEffect(() => {
    if (!open) return

    setHighlightedConversationId((current) => {
      if (visibleConversationEntries.length === 0) {
        return null
      }

      if (
        current &&
        visibleConversationEntries.some(
          (conversation) => conversation.key === current,
        )
      ) {
        return current
      }

      return visibleConversationEntries[0]?.key ?? null
    })
  }, [open, visibleConversationEntries])

  const hasMoreConversations =
    filteredConversationEntries.length > visibleConversationCount

  const moveHighlight = useCallback(
    (direction: 1 | -1) => {
      if (visibleConversationEntries.length === 0) return

      setHighlightedConversationId((current) => {
        const currentIndex = visibleConversationEntries.findIndex(
          (conversation) => conversation.key === current,
        )
        const fallbackIndex =
          direction > 0 ? 0 : visibleConversationEntries.length - 1
        const baseIndex = currentIndex === -1 ? fallbackIndex : currentIndex
        const nextIndex = Math.max(
          0,
          Math.min(
            visibleConversationEntries.length - 1,
            baseIndex + direction,
          ),
        )
        return visibleConversationEntries[nextIndex]?.key ?? current
      })
    },
    [visibleConversationEntries],
  )

  const highlightedConversation = useMemo(
    () =>
      visibleConversationEntries.find(
        (conversation) => conversation.key === highlightedConversationId,
      ) ?? null,
    [visibleConversationEntries, highlightedConversationId],
  )

  const handleVoiceConversation = useCallback(
    (conversationId: string, title: string) => {
      onStartVoiceConversation?.({ id: conversationId, title })
      onOpenChange(false)
    },
    [onOpenChange, onStartVoiceConversation],
  )

  const handleOpenConversation = useCallback(
    (entry: ConversationListEntry) => {
      if (entry.kind === "active" && entry.sessionId) {
        setViewedConversationId(null)
        navigate("/", { state: { clearPendingConversation: true } })
        setFocusedSessionId(entry.sessionId)
        setExpandedSessionId(entry.sessionId)
        setScrollToSessionId(entry.sessionId)
        onOpenChange(false)
        return
      }

      if (entry.conversationId) {
        setFocusedSessionId(null)
        setExpandedSessionId(null)
        setViewedConversationId(entry.conversationId)
        navigate(`/${entry.conversationId}`)
        onOpenChange(false)
      }
    },
    [
      navigate,
      onOpenChange,
      setExpandedSessionId,
      setFocusedSessionId,
      setScrollToSessionId,
      setViewedConversationId,
    ],
  )

  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    try {
      await deleteSavedConversationMutation.mutateAsync(conversationId)
    } catch (error) {
      console.error("Failed to delete conversation:", error)
      toast.error("Failed to delete conversation")
    }
  }

  const handleTogglePinnedConversation = (
    conversationId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    togglePinSession(conversationId)
  }

  const stopConversationRowKeyPropagation = (
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation()
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllSavedConversationsMutation.mutateAsync()
      toast.success("All saved conversations deleted")
      setShowDeleteAllConfirm(false)
    } catch (error) {
      toast.error("Failed to delete saved conversations")
    }
  }

  const isLoadingConversations =
    visibleConversationEntries.length === 0 &&
    (savedConversationsQuery.isLoading || activeConversationsQuery.isLoading)
  const failedToLoadConversations =
    visibleConversationEntries.length === 0 &&
    (savedConversationsQuery.isError || activeConversationsQuery.isError)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm grid-cols-1 overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Conversations
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            Browse active and saved conversations. Use ↑↓ to move, Enter to
            open, {PIN_SHORTCUT_HINT} to pin, and {VOICE_SHORTCUT_HINT} for
            voice.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-3">
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted-foreground absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search active and saved conversations by title, response, or message..."
                aria-label="Search active and saved conversations"
                className="w-full pl-7 pr-12 text-xs"
              />
              <span className="text-muted-foreground border-border/60 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[10px] font-medium">
                {KEYBOARD_SHORTCUT_HINT}
              </span>
            </div>
            <Button
              variant={showArchivedOnly ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowArchivedOnly((value) => !value)}
              className="h-8 shrink-0 text-xs"
              title="Show archived conversations"
              aria-pressed={showArchivedOnly}
            >
              <Archive className="mr-1 h-3 w-3" />
              Archived
              {archivedConversationCount > 0 && (
                <span className="ml-1 rounded-full bg-muted-foreground/15 px-1.5 py-px text-[10px] tabular-nums">
                  {archivedConversationCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAllConfirm(true)}
              disabled={!savedConversationsQuery.data?.length}
              className="text-muted-foreground hover:border-destructive/50 hover:text-destructive h-8 shrink-0 text-xs"
              title="Delete all saved conversations"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete All
            </Button>
          </div>

          {showDeleteAllConfirm && (
            <div className="border-destructive/50 bg-destructive/5 space-y-2 rounded-md border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="text-destructive h-4 w-4" />
                Delete all saved conversations?
              </div>
              <p className="text-muted-foreground text-xs">
                This action cannot be undone.
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowDeleteAllConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleDeleteAll}
                  disabled={deleteAllSavedConversationsMutation.isPending}
                >
                  {deleteAllSavedConversationsMutation.isPending
                    ? "Deleting..."
                    : "Delete All"}
                </Button>
              </div>
            </div>
          )}

          <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1 sm:max-h-[60vh]">
            {isLoadingConversations ? (
              <div className="text-muted-foreground flex items-center gap-2 px-2 py-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading conversations...</span>
              </div>
            ) : failedToLoadConversations ? (
              <p className="text-destructive px-2 py-2 text-xs">
                Failed to load conversations
              </p>
            ) : visibleConversationEntries.length === 0 ? (
              <p className="text-muted-foreground px-2 py-2 text-xs">
                {showArchivedOnly
                  ? "No archived conversations found"
                  : "No conversations found"}
              </p>
            ) : (
              <>
                {visibleConversationEntries.map((entry, index) => {
                  const canPinConversation = !!entry.conversationId
                  const canArchiveConversation = !!entry.conversationId
                  const canDeleteConversation =
                    entry.kind === "saved" && !!entry.conversationId
                  const showSectionTitle =
                    index === 0 ||
                    visibleConversationEntries[index - 1]?.kind !== entry.kind

                  return (
                    <div key={entry.key}>
                      {showSectionTitle && (
                        <p className="text-muted-foreground px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide">
                          {entry.kind === "active"
                            ? "Active conversations"
                            : showArchivedOnly
                              ? "Archived conversations"
                              : "Saved conversations"}
                        </p>
                      )}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenConversation(entry)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleOpenConversation(entry)
                          }
                        }}
                        onFocus={() => setHighlightedConversationId(entry.key)}
                        className={cn(
                          "group flex w-full cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                          "hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                          highlightedConversationId === entry.key &&
                            "bg-accent/50 ring-ring/40 ring-1",
                        )}
                        onMouseEnter={() =>
                          setHighlightedConversationId(entry.key)
                        }
                        data-highlighted={
                          highlightedConversationId === entry.key
                            ? "true"
                            : undefined
                        }
                        title={`${entry.preview}\n${dayjs(entry.updatedAt).format("MMM D, h:mm A")}`}
                      >
                        <span
                          className={cn(
                            "mt-0.5 h-8 w-1 shrink-0 rounded-full",
                            entry.statusRailClassName,
                          )}
                        />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex flex-wrap items-start gap-2">
                            <span className="min-w-0 flex-1 truncate font-medium">
                              {entry.title}
                            </span>
                            <div className="ml-auto grid shrink-0 place-items-center self-start">
                              <span className="text-muted-foreground col-start-1 row-start-1 text-[10px] tabular-nums transition-opacity group-focus-within:opacity-0 group-hover:opacity-0">
                                {formatTimestamp(entry.updatedAt)}
                              </span>
                              <div className="pointer-events-none col-start-1 row-start-1 flex items-center gap-0.5 opacity-0 transition-all group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
                                {canPinConversation && entry.conversationId && (
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleTogglePinnedConversation(
                                        entry.conversationId!,
                                        e,
                                      )
                                    }
                                    onKeyDown={
                                      stopConversationRowKeyPropagation
                                    }
                                    className="hover:bg-accent focus-visible:ring-ring rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                                    title={
                                      entry.isPinned
                                        ? "Unpin conversation"
                                        : "Pin conversation"
                                    }
                                    aria-label={`${entry.isPinned ? "Unpin" : "Pin"} ${entry.title}`}
                                    aria-pressed={entry.isPinned}
                                  >
                                    <Pin
                                      className={cn(
                                        "h-3.5 w-3.5",
                                        entry.isPinned &&
                                          "text-foreground fill-current",
                                      )}
                                    />
                                  </button>
                                )}
                                {canArchiveConversation &&
                                  entry.conversationId && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleArchiveSession(
                                          entry.conversationId!,
                                        )
                                      }}
                                      onKeyDown={
                                        stopConversationRowKeyPropagation
                                      }
                                      className="hover:bg-accent focus-visible:ring-ring rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                                      title={
                                        entry.isArchived
                                          ? "Unarchive conversation"
                                          : "Archive conversation"
                                      }
                                      aria-label={`${entry.isArchived ? "Unarchive" : "Archive"} ${entry.title}`}
                                      aria-pressed={entry.isArchived}
                                    >
                                      <Archive
                                        className={cn(
                                          "h-3.5 w-3.5",
                                          entry.isArchived &&
                                            "text-foreground fill-current",
                                        )}
                                      />
                                    </button>
                                  )}
                                {canDeleteConversation &&
                                  entry.conversationId && (
                                    <button
                                      type="button"
                                      onClick={(e) =>
                                        handleDeleteConversation(
                                          entry.conversationId!,
                                          e,
                                        )
                                      }
                                      onKeyDown={
                                        stopConversationRowKeyPropagation
                                      }
                                      disabled={
                                        deleteSavedConversationMutation.isPending
                                      }
                                      className="hover:bg-destructive/20 hover:text-destructive focus-visible:ring-ring rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                                      title="Delete conversation"
                                      aria-label={`Delete ${entry.title}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                              </div>
                            </div>
                          </div>
                          {entry.isPinned && (
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span className="border-border/60 text-muted-foreground inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                                <Pin className="h-3 w-3 shrink-0 fill-current" />
                                <span>Pinned</span>
                              </span>
                            </div>
                          )}
                          <p className="text-muted-foreground mt-0.5 line-clamp-2 break-words text-xs leading-relaxed [overflow-wrap:anywhere]">
                            {entry.preview}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {hasMoreConversations && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleConversationCount(
                        (prev) => prev + INITIAL_SAVED_CONVERSATIONS,
                      )
                    }
                    className="text-muted-foreground hover:bg-accent/50 hover:text-foreground w-full rounded-md px-3 py-2 text-xs transition-colors"
                  >
                    Load more (
                    {filteredConversationEntries.length -
                      visibleConversationCount}{" "}
                    remaining)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const PastSessionsDialog = SavedConversationsDialog
