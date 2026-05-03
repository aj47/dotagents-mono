import type { AgentProgressUpdate } from "@shared/types"
import { TASK_SESSION_TITLE_PREFIX, hasRepeatTaskTitlePrefix } from "@shared/repeat-tasks"

type SessionLike = {
  id: string
  conversationId?: string
}

type ParentSessionLike = SessionLike & {
  parentSessionId?: string | null
}

export type SidebarSessionNesting = {
  isSubagent: boolean
  nestingDepth: number
}

type TitledSessionLike = SessionLike & {
  parentSessionId?: string | null
  conversationTitle?: string
  isRepeatTask?: boolean
}

type ProgressTitleLike = Pick<
  AgentProgressUpdate,
  "conversationTitle" | "conversationHistory" | "latestSummary" | "steps"
>

type ProgressLifecycleLike = Pick<AgentProgressUpdate, "isComplete" | "steps">

type RepeatTaskTitleHints = ReadonlySet<string>

/**
 * Sessions started by the repeat-task loop service get the shared
 * `TASK_SESSION_TITLE_PREFIX` (see apps/desktop/src/shared/repeat-tasks.ts).
 * We use that prefix as the canonical signal for "task" entries in the
 * sidebar so they can be grouped separately from user-driven sessions.
 */
export function isTaskSession(session: TitledSessionLike): boolean {
  return isTaskSessionWithHints(session)
}

function isTaskSessionWithHints(
  session: TitledSessionLike,
  repeatTaskTitleHints?: RepeatTaskTitleHints,
): boolean {
  if (session.isRepeatTask) return true
  if (hasRepeatTaskTitlePrefix(session.conversationTitle)) return true
  const title = session.conversationTitle?.trim()
  return !!title && !!repeatTaskTitleHints?.has(title)
}

export function partitionTaskAndUserEntries<
  T extends { session: TitledSessionLike },
>(
  entries: T[],
  repeatTaskTitleHints?: RepeatTaskTitleHints,
): { userEntries: T[]; taskEntries: T[] } {
  const taskSessionIds = new Set(
    entries
      .filter((entry) => isTaskSessionWithHints(entry.session, repeatTaskTitleHints))
      .map((entry) => entry.session.id),
  )
  const userEntries: T[] = []
  const taskEntries: T[] = []
  for (const entry of entries) {
    const parentSessionId = entry.session.parentSessionId?.trim()
    if (
      isTaskSessionWithHints(entry.session, repeatTaskTitleHints) ||
      (parentSessionId && taskSessionIds.has(parentSessionId))
    ) {
      taskEntries.push(entry)
    } else {
      userEntries.push(entry)
    }
  }
  return { userEntries, taskEntries }
}

function getTaskEntryDedupeKey(session: TitledSessionLike): string | null {
  const title = session.conversationTitle?.trim()
  if (!title) return null
  return title.startsWith(TASK_SESSION_TITLE_PREFIX)
    ? title.slice(TASK_SESSION_TITLE_PREFIX.length).trim().toLowerCase()
    : title.toLowerCase()
}

function getTaskEntryTimestamp(session: TitledSessionLike & { startTime?: number; endTime?: number }): number {
  return Math.max(session.endTime ?? 0, session.startTime ?? 0)
}

function isBetterTaskEntry<T extends { session: TitledSessionLike & { status?: string; startTime?: number; endTime?: number } }>(
  candidate: T,
  current: T,
): boolean {
  const candidateIsActive = candidate.session.status === "active"
  const currentIsActive = current.session.status === "active"
  if (candidateIsActive !== currentIsActive) return candidateIsActive
  return getTaskEntryTimestamp(candidate.session) > getTaskEntryTimestamp(current.session)
}

export function dedupeTaskEntriesByTitle<
  T extends { session: TitledSessionLike & { status?: string; startTime?: number; endTime?: number } },
>(taskEntries: T[]): T[] {
  if (taskEntries.length <= 1) return taskEntries

  const selectedByTitle = new Map<string, T>()
  for (const entry of taskEntries) {
    const key = getTaskEntryDedupeKey(entry.session)
    if (!key) continue
    const current = selectedByTitle.get(key)
    if (!current || isBetterTaskEntry(entry, current)) {
      selectedByTitle.set(key, entry)
    }
  }

  return taskEntries.filter((entry) => {
    const key = getTaskEntryDedupeKey(entry.session)
    return !key || selectedByTitle.get(key) === entry
  })
}

export function partitionPinnedAndUnpinnedTaskEntries<
  T extends { session: ParentSessionLike },
>(
  taskEntries: T[],
  pinnedSessionIds: ReadonlySet<string>,
): { pinnedTaskEntries: T[]; unpinnedTaskEntries: T[] } {
  if (taskEntries.length === 0 || pinnedSessionIds.size === 0) {
    return { pinnedTaskEntries: [], unpinnedTaskEntries: taskEntries }
  }

  const pinnedTaskSessionIds = new Set(
    taskEntries
      .filter((entry) => {
        const conversationId = entry.session.conversationId
        return !!conversationId && pinnedSessionIds.has(conversationId)
      })
      .map((entry) => entry.session.id),
  )
  const pinnedTaskEntries: T[] = []
  const unpinnedTaskEntries: T[] = []
  for (const entry of taskEntries) {
    const conversationId = entry.session.conversationId
    const parentSessionId = entry.session.parentSessionId?.trim()
    if (
      (conversationId && pinnedSessionIds.has(conversationId)) ||
      (parentSessionId && pinnedTaskSessionIds.has(parentSessionId))
    ) {
      pinnedTaskEntries.push(entry)
    } else {
      unpinnedTaskEntries.push(entry)
    }
  }
  return { pinnedTaskEntries, unpinnedTaskEntries }
}

export function paginateSidebarEntries<
  T extends { session: ParentSessionLike; isSavedConversation: boolean },
>(
  entries: T[],
  _pinnedSessionIds: ReadonlySet<string>,
  visibleSavedEntryCount: number,
): { visibleEntries: T[]; hasMoreEntries: boolean } {
  const alwaysVisibleEntries: T[] = []
  const pageableEntries: T[] = []
  for (const entry of entries) {
    if (!entry.isSavedConversation) {
      alwaysVisibleEntries.push(entry)
    } else {
      pageableEntries.push(entry)
    }
  }

  const sliceCount = Math.max(visibleSavedEntryCount, 0)
  return {
    visibleEntries: [
      ...alwaysVisibleEntries,
      ...pageableEntries.slice(0, sliceCount),
    ],
    hasMoreEntries: pageableEntries.length > sliceCount,
  }
}

interface SidebarSessionViewState {
  isPast: boolean
  focusedSessionId?: string | null
  expandedSessionId?: string | null
  viewedConversationId?: string | null
}

export function orderActiveSessionsByPinnedFirst<T extends SessionLike>(
  sessions: T[],
  pinnedSessionIds: ReadonlySet<string>,
): T[] {
  if (sessions.length <= 1 || pinnedSessionIds.size === 0) {
    return sessions
  }

  const pinnedSessions: T[] = []
  const unpinnedSessions: T[] = []

  for (const session of sessions) {
    if (
      session.conversationId &&
      pinnedSessionIds.has(session.conversationId)
    ) {
      pinnedSessions.push(session)
    } else {
      unpinnedSessions.push(session)
    }
  }

  return [...pinnedSessions, ...unpinnedSessions]
}

export function getSubagentParentSessionIdMap(
  progressEntries: Iterable<[string, Pick<AgentProgressUpdate, "steps">]>,
): Map<string, string> {
  const parentSessionIdsByChildId = new Map<string, string>()

  for (const [parentSessionId, progress] of progressEntries) {
    for (const step of progress.steps ?? []) {
      const delegation = step.delegation
      if (!delegation) continue

      const possibleChildSessionIds = [
        delegation.subSessionId,
        delegation.acpSessionId,
        delegation.runId,
      ]

      for (const childSessionId of possibleChildSessionIds) {
        const normalizedChildSessionId = childSessionId?.trim()
        if (
          !normalizedChildSessionId ||
          normalizedChildSessionId === parentSessionId ||
          parentSessionIdsByChildId.has(normalizedChildSessionId)
        ) {
          continue
        }
        parentSessionIdsByChildId.set(normalizedChildSessionId, parentSessionId)
      }
    }
  }

  return parentSessionIdsByChildId
}

function getPossibleDelegationChildSessionIds(
  delegation: NonNullable<AgentProgressUpdate["steps"][number]["delegation"]>,
): string[] {
  return [
    delegation.subSessionId,
    delegation.acpSessionId,
    delegation.runId,
  ].flatMap((value) => {
    const normalized = value?.trim()
    return normalized ? [normalized] : []
  })
}

function getDelegationDisplayTitle(
  delegation: NonNullable<AgentProgressUpdate["steps"][number]["delegation"]>,
): string | null {
  const task = delegation.task?.trim()
  if (task) return task

  const agentName = delegation.agentName?.trim()
  return agentName ? `${agentName} subagent` : null
}

export function getSubagentTitleBySessionIdMap(
  progressEntries: Iterable<[string, Pick<AgentProgressUpdate, "steps">]>,
): Map<string, string> {
  const titlesByChildId = new Map<string, string>()

  for (const [, progress] of progressEntries) {
    for (const step of progress.steps ?? []) {
      const delegation = step.delegation
      if (!delegation) continue

      const title = getDelegationDisplayTitle(delegation)
      if (!title) continue

      for (const childSessionId of getPossibleDelegationChildSessionIds(
        delegation,
      )) {
        if (!titlesByChildId.has(childSessionId)) {
          titlesByChildId.set(childSessionId, title)
        }
      }
    }
  }

  return titlesByChildId
}

export function getSidebarProgressTitle(
  sessionId: string,
  progress: ProgressTitleLike,
  delegationTitlesBySessionId: ReadonlyMap<string, string>,
  fallback?: string,
): string | undefined {
  const explicitTitle = progress.conversationTitle?.trim()
  if (explicitTitle) return explicitTitle

  const delegationTitle = delegationTitlesBySessionId.get(sessionId)?.trim()
  if (delegationTitle) return delegationTitle

  const firstUserMessage = progress.conversationHistory?.find(
    (message) =>
      message.role === "user" &&
      typeof message.content === "string" &&
      message.content.trim(),
  )
  const userTitle = typeof firstUserMessage?.content === "string"
    ? firstUserMessage.content.trim()
    : undefined
  if (userTitle) return userTitle

  const summaryTitle = progress.latestSummary?.actionSummary?.trim()
  if (summaryTitle) return summaryTitle

  return fallback?.trim() || undefined
}

export function isProgressLiveForSidebar(progress: ProgressLifecycleLike): boolean {
  return !progress.isComplete || hasActiveDelegationProgress(progress)
}

export function shouldPromoteProgressToSidebarActiveSession(
  progress: ProgressLifecycleLike,
  options: { hasTrackedSession: boolean },
): boolean {
  return options.hasTrackedSession || isProgressLiveForSidebar(progress)
}

function isActiveDelegationStatus(status?: string): boolean {
  return status === "pending" || status === "spawning" || status === "running"
}

function hasActiveDelegationProgress(
  progress: Pick<AgentProgressUpdate, "steps">,
): boolean {
  return (progress.steps ?? []).some((step) =>
    isActiveDelegationStatus(step.delegation?.status),
  )
}

function isProgressActivelyRunning(
  progress: Pick<AgentProgressUpdate, "steps" | "isComplete">,
): boolean {
  return !progress.isComplete || hasActiveDelegationProgress(progress)
}

export function getSessionIdsWithActiveChildProgress(
  progressEntries: Iterable<[
    string,
    Pick<AgentProgressUpdate, "steps" | "isComplete" | "parentSessionId">,
  ]>,
): Set<string> {
  const entries = Array.from(progressEntries)
  const inferredParentIds = getSubagentParentSessionIdMap(entries)
  const parentByChildId = new Map(inferredParentIds)

  for (const [sessionId, progress] of entries) {
    const parentSessionId = progress.parentSessionId?.trim()
    if (parentSessionId && parentSessionId !== sessionId) {
      parentByChildId.set(sessionId, parentSessionId)
    }
  }

  const activeParentSessionIds = new Set<string>()

  const markSessionAndAncestorsActive = (sessionId: string) => {
    let currentSessionId: string | undefined = sessionId
    const visitedSessionIds = new Set<string>()
    while (currentSessionId && !visitedSessionIds.has(currentSessionId)) {
      visitedSessionIds.add(currentSessionId)
      activeParentSessionIds.add(currentSessionId)
      currentSessionId = parentByChildId.get(currentSessionId)
    }
  }

  for (const [sessionId, progress] of entries) {
    if (hasActiveDelegationProgress(progress)) {
      markSessionAndAncestorsActive(sessionId)
    }

    if (isProgressActivelyRunning(progress)) {
      const parentSessionId = parentByChildId.get(sessionId)
      if (parentSessionId) {
        markSessionAndAncestorsActive(parentSessionId)
      }
    }
  }

  return activeParentSessionIds
}

export function nestSubagentSessionEntries<
  T extends { session: ParentSessionLike },
>(entries: T[]): Array<T & SidebarSessionNesting> {
  if (entries.length === 0) return []

  const entryIds = new Set(entries.map((entry) => entry.session.id))
  const entriesByConversationId = new Map<string, T[]>()
  const childrenByParentId = new Map<string, T[]>()
  const topLevelEntries: T[] = []

  for (const entry of entries) {
    const conversationId = entry.session.conversationId?.trim()
    if (!conversationId) continue
    const conversationEntries = entriesByConversationId.get(conversationId) ?? []
    conversationEntries.push(entry)
    entriesByConversationId.set(conversationId, conversationEntries)
  }

  const resolveParentEntryId = (entry: T): string | null => {
    const parentSessionId = entry.session.parentSessionId?.trim()
    if (!parentSessionId || parentSessionId === entry.session.id) return null
    if (entryIds.has(parentSessionId)) return parentSessionId

    const conversationId = entry.session.conversationId?.trim()
    if (!conversationId) return null

    const conversationEntries = entriesByConversationId.get(conversationId) ?? []
    const parentCandidate =
      conversationEntries.find((candidate) =>
        candidate.session.id !== entry.session.id &&
        !candidate.session.parentSessionId?.trim(),
      ) ??
      conversationEntries.find((candidate) =>
        candidate.session.id !== entry.session.id &&
        candidate.session.id === conversationId,
      ) ??
      conversationEntries.find((candidate) => candidate.session.id !== entry.session.id)

    return parentCandidate?.session.id ?? null
  }

  for (const entry of entries) {
    const parentSessionId = resolveParentEntryId(entry)
    if (parentSessionId) {
      const children = childrenByParentId.get(parentSessionId) ?? []
      children.push(entry)
      childrenByParentId.set(parentSessionId, children)
    } else {
      topLevelEntries.push(entry)
    }
  }

  const orderedEntries: Array<T & SidebarSessionNesting> = []
  const visitedSessionIds = new Set<string>()

  const appendEntry = (entry: T, depth: number) => {
    if (visitedSessionIds.has(entry.session.id)) return
    visitedSessionIds.add(entry.session.id)
    orderedEntries.push({
      ...entry,
      isSubagent: depth > 0,
      nestingDepth: Math.min(depth, 2),
    })

    for (const child of childrenByParentId.get(entry.session.id) ?? []) {
      appendEntry(child, depth + 1)
    }
  }

  for (const entry of topLevelEntries) {
    appendEntry(entry, 0)
  }

  for (const entry of entries) {
    appendEntry(entry, 0)
  }

  return orderedEntries
}

export function filterPastSessionsAgainstActiveSessions<
  T extends { session: SessionLike },
>(pastSessions: T[], activeSessions: SessionLike[]): T[] {
  if (pastSessions.length === 0 || activeSessions.length === 0) {
    return pastSessions
  }

  const activeConversationIds = new Set(
    activeSessions
      .map((session) => session.conversationId)
      .filter((conversationId): conversationId is string => !!conversationId),
  )
  const activeSessionIds = new Set(activeSessions.map((session) => session.id))

  return pastSessions.filter((item) => {
    if (activeSessionIds.has(item.session.id)) {
      return false
    }

    const conversationId = item.session.conversationId
    return !conversationId || !activeConversationIds.has(conversationId)
  })
}

export function isSidebarSessionCurrentlyViewed(
  session: SessionLike,
  {
    isPast,
    focusedSessionId = null,
    expandedSessionId = null,
    viewedConversationId = null,
  }: SidebarSessionViewState,
): boolean {
  if (viewedConversationId) {
    if (session.conversationId) {
      return session.conversationId === viewedConversationId
    }

    return (
      !isPast &&
      (session.id === focusedSessionId || session.id === expandedSessionId)
    )
  }

  if (isPast) {
    return false
  }

  return session.id === focusedSessionId || session.id === expandedSessionId
}

export function getLatestAgentResponseTimestamp(
  progress?: AgentProgressUpdate | null,
): number | null {
  if (!progress) return null

  let latestTimestamp: number | null = null
  const recordTimestamp = (timestamp?: number) => {
    if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) return
    latestTimestamp = Math.max(latestTimestamp ?? 0, timestamp)
  }

  for (const event of progress.responseEvents ?? []) {
    if (event.text.trim()) {
      recordTimestamp(event.timestamp)
    }
  }

  for (const message of progress.conversationHistory ?? []) {
    if (message.role === "assistant" && message.content.trim()) {
      recordTimestamp(message.timestamp)
    }
  }

  return latestTimestamp
}

export function hasUnreadAgentResponse(
  progress: AgentProgressUpdate | null | undefined,
  lastReadTimestamp: number | undefined,
  isCurrentlyViewed: boolean,
): boolean {
  if (isCurrentlyViewed) return false

  const latestResponseTimestamp = getLatestAgentResponseTimestamp(progress)
  if (latestResponseTimestamp === null) return false

  return latestResponseTimestamp > (lastReadTimestamp ?? 0)
}
