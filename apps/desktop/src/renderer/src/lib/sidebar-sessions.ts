import type { AgentProgressUpdate } from "@shared/types"
import { TASK_SESSION_TITLE_PREFIX, hasRepeatTaskTitlePrefix } from "@shared/repeat-tasks"
import { normalizeMessagePreviewText } from "@dotagents/shared/message-display-utils"
export type SessionLike = {
  id: string
  conversationId?: string
}

export interface SidebarSessionGroup {
  id: string
  name: string
  sessionKeys: string[]
  expanded: boolean
}

export interface SidebarSessionGroupSection<T> {
  group: SidebarSessionGroup
  entries: T[]
}

export type SidebarSessionDropPosition = "before" | "after"

export interface SidebarSessionStateSummary {
  state: SidebarBadgeLifecycleState
  count: number
}

export type SidebarBadgeLifecycleState =
  | "needs_input"
  | "blocked"
  | "running"
  | "complete"

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

type SidebarActivityProgressLike = Pick<
  AgentProgressUpdate,
  | "conversationHistory"
  | "finalContent"
  | "isComplete"
  | "latestSummary"
  | "pendingToolApproval"
  | "responseEvents"
  | "retryInfo"
  | "steps"
  | "streamingContent"
  | "userResponse"
>

type SidebarActivityOptions = {
  fallbackErrorText?: string | null
}

export type SidebarActivityKind =
  | "blocked"
  | "complete"
  | "delegation"
  | "response"
  | "retrying"
  | "running"
  | "streaming"
  | "summary"
  | "thinking"
  | "tool_call"
  | "tool_result"
  | "needs_input"

export interface SidebarActivityPresentation {
  kind: SidebarActivityKind
  label: string
  detail: string | null
  badgeClassName: string
  isForegroundActivity: boolean
}

type RepeatTaskTitleHints = ReadonlySet<string>

export function getSidebarSessionGroupKey(session: SessionLike): string {
  const conversationId = session.conversationId?.trim()
  return conversationId ? `conversation:${conversationId}` : `session:${session.id}`
}

export function normalizeSidebarSessionKeyOrder(input: unknown): string[] {
  if (!Array.isArray(input)) return []

  const seenSessionKeys = new Set<string>()
  return input.flatMap((sessionKey) => {
    if (typeof sessionKey !== "string") return []
    const normalized = sessionKey.trim()
    if (!normalized || seenSessionKeys.has(normalized)) return []
    seenSessionKeys.add(normalized)
    return [normalized]
  })
}

export function normalizeSidebarSessionGroups(input: unknown): SidebarSessionGroup[] {
  if (!Array.isArray(input)) return []

  const seenGroupIds = new Set<string>()
  return input.flatMap((value) => {
    const raw = value as Partial<SidebarSessionGroup> | null
    const id = typeof raw?.id === "string" ? raw.id.trim() : ""
    if (!id || seenGroupIds.has(id)) return []
    seenGroupIds.add(id)

    const sessionKeys = normalizeSidebarSessionKeyOrder(raw?.sessionKeys)

    const name = typeof raw?.name === "string" ? raw.name.trim() : ""
    return [{
      id,
      name: name || "Untitled group",
      sessionKeys,
      expanded: raw?.expanded !== false,
    }]
  })
}

export function assignSidebarSessionToGroup(
  groups: SidebarSessionGroup[],
  sessionKey: string,
  targetGroupId: string | null,
): SidebarSessionGroup[] {
  const normalizedSessionKey = sessionKey.trim()
  if (!normalizedSessionKey) return groups
  if (targetGroupId && !groups.some((group) => group.id === targetGroupId)) {
    return groups
  }

  return groups.map((group) => {
    const sessionKeys = group.sessionKeys.filter((key) => key !== normalizedSessionKey)
    if (group.id !== targetGroupId) {
      return sessionKeys.length === group.sessionKeys.length
        ? group
        : { ...group, sessionKeys }
    }

    return {
      ...group,
      sessionKeys: [...sessionKeys, normalizedSessionKey],
    }
  })
}

export function reorderSidebarSessionKeys(
  sessionKeys: string[],
  sessionKey: string,
  targetSessionKey: string | null,
  position: SidebarSessionDropPosition,
): string[] {
  const normalizedSessionKey = sessionKey.trim()
  const normalizedTargetSessionKey = targetSessionKey?.trim() || null
  if (!normalizedSessionKey) return normalizeSidebarSessionKeyOrder(sessionKeys)
  if (normalizedTargetSessionKey === normalizedSessionKey) {
    return normalizeSidebarSessionKeyOrder(sessionKeys)
  }

  const orderedKeys = normalizeSidebarSessionKeyOrder(sessionKeys)
    .filter((key) => key !== normalizedSessionKey)
  const targetIndex = normalizedTargetSessionKey
    ? orderedKeys.indexOf(normalizedTargetSessionKey)
    : -1
  const insertionIndex = targetIndex >= 0
    ? targetIndex + (position === "after" ? 1 : 0)
    : orderedKeys.length

  return [
    ...orderedKeys.slice(0, insertionIndex),
    normalizedSessionKey,
    ...orderedKeys.slice(insertionIndex),
  ]
}

export function moveSidebarSessionToGroupPosition(
  groups: SidebarSessionGroup[],
  sessionKey: string,
  targetGroupId: string,
  targetSessionKey: string | null,
  position: SidebarSessionDropPosition,
): SidebarSessionGroup[] {
  const normalizedSessionKey = sessionKey.trim()
  if (!normalizedSessionKey || !groups.some((group) => group.id === targetGroupId)) {
    return groups
  }

  return groups.map((group) => {
    const sessionKeysWithoutMovingKey = group.sessionKeys.filter(
      (key) => key !== normalizedSessionKey,
    )
    if (group.id !== targetGroupId) {
      return sessionKeysWithoutMovingKey.length === group.sessionKeys.length
        ? group
        : { ...group, sessionKeys: sessionKeysWithoutMovingKey }
    }

    return {
      ...group,
      sessionKeys: reorderSidebarSessionKeys(
        sessionKeysWithoutMovingKey,
        normalizedSessionKey,
        targetSessionKey,
        position,
      ),
    }
  })
}

export function reorderSidebarSessionGroups(
  groups: SidebarSessionGroup[],
  groupId: string,
  targetGroupId: string,
  position: SidebarSessionDropPosition,
): SidebarSessionGroup[] {
  const normalizedGroupId = groupId.trim()
  const normalizedTargetGroupId = targetGroupId.trim()
  if (!normalizedGroupId || !normalizedTargetGroupId || normalizedGroupId === normalizedTargetGroupId) {
    return groups
  }

  const movingGroup = groups.find((group) => group.id === normalizedGroupId)
  if (!movingGroup || !groups.some((group) => group.id === normalizedTargetGroupId)) {
    return groups
  }

  const remainingGroups = groups.filter((group) => group.id !== normalizedGroupId)
  const targetIndex = remainingGroups.findIndex((group) => group.id === normalizedTargetGroupId)
  if (targetIndex === -1) return groups

  const insertionIndex = targetIndex + (position === "after" ? 1 : 0)
  return [
    ...remainingGroups.slice(0, insertionIndex),
    movingGroup,
    ...remainingGroups.slice(insertionIndex),
  ]
}

export function groupSidebarSessionEntries<T extends { session: SessionLike }>(
  entries: T[],
  groups: SidebarSessionGroup[],
): { groupedSections: SidebarSessionGroupSection<T>[]; ungroupedEntries: T[] } {
  const entryBySessionKey = new Map<string, T>()
  for (const entry of entries) {
    const sessionKey = getSidebarSessionGroupKey(entry.session)
    if (!entryBySessionKey.has(sessionKey)) {
      entryBySessionKey.set(sessionKey, entry)
    }
  }

  const groupedSessionKeys = new Set<string>()
  const groupedSections = groups.map((group) => {
    const seenInGroup = new Set<string>()
    const groupedEntries = group.sessionKeys.flatMap((sessionKey) => {
      if (seenInGroup.has(sessionKey) || groupedSessionKeys.has(sessionKey)) return []
      seenInGroup.add(sessionKey)
      const entry = entryBySessionKey.get(sessionKey)
      if (!entry) return []
      groupedSessionKeys.add(sessionKey)
      return [entry]
    })
    return { group, entries: groupedEntries }
  })

  const ungroupedEntries = entries.filter(
    (entry) => !groupedSessionKeys.has(getSidebarSessionGroupKey(entry.session)),
  )

  return { groupedSections, ungroupedEntries }
}

export function orderSidebarSessionEntriesByKeys<T extends { session: SessionLike }>(
  entries: T[],
  orderedSessionKeys: string[],
): T[] {
  if (entries.length <= 1 || orderedSessionKeys.length === 0) return entries

  const entryBySessionKey = new Map<string, T>()
  for (const entry of entries) {
    const sessionKey = getSidebarSessionGroupKey(entry.session)
    if (!entryBySessionKey.has(sessionKey)) {
      entryBySessionKey.set(sessionKey, entry)
    }
  }

  const orderedEntries: T[] = []
  const seenSessionKeys = new Set<string>()
  for (const sessionKey of orderedSessionKeys) {
    const entry = entryBySessionKey.get(sessionKey)
    if (!entry || seenSessionKeys.has(sessionKey)) continue
    orderedEntries.push(entry)
    seenSessionKeys.add(sessionKey)
  }

  return [
    ...orderedEntries,
    ...entries.filter((entry) => !seenSessionKeys.has(getSidebarSessionGroupKey(entry.session))),
  ]
}

export function summarizeSidebarSessionLifecycleStates(
  states: Iterable<SidebarBadgeLifecycleState>,
): SidebarSessionStateSummary[] {
  const counts = new Map<SidebarBadgeLifecycleState, number>()

  for (const state of states) {
    counts.set(state, (counts.get(state) ?? 0) + 1)
  }

  return (["needs_input", "blocked", "running", "complete"] as const)
    .flatMap((state) => {
      const count = counts.get(state) ?? 0
      return count > 0 ? [{ state, count }] : []
    })
}

const SIDEBAR_ACTIVITY_BADGE_CLASSES: Record<SidebarActivityKind, string> = {
  blocked: "border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-300",
  complete: "border-green-500/35 bg-green-500/10 text-green-700 dark:text-green-300",
  delegation: "border-violet-500/35 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  response: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  retrying: "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  running: "border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  streaming: "border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  summary: "border-muted-foreground/25 bg-muted/40 text-muted-foreground",
  thinking: "border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  tool_call: "border-cyan-500/35 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  tool_result: "border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  needs_input: "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",
}

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

function isSubagentLikeEntry(session: TitledSessionLike): boolean {
  if (isLikelyInternalSubSessionId(session.id)) return true
  const parentSessionId = session.parentSessionId?.trim()
  return !!parentSessionId && parentSessionId !== session.id
}

function isBetterTaskEntry<T extends { session: TitledSessionLike & { status?: string; startTime?: number; endTime?: number } }>(
  candidate: T,
  current: T,
): boolean {
  // Prefer top-level entries over subagent/subsession entries that share the
  // same dedupe key. A running subsession inherits its parent's conversation
  // title, so without this bias dedup would drop the parent row and surface
  // the subsession's truncated context as the focused session.
  const candidateIsSubagent = isSubagentLikeEntry(candidate.session)
  const currentIsSubagent = isSubagentLikeEntry(current.session)
  if (candidateIsSubagent !== currentIsSubagent) return !candidateIsSubagent

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
  pinnedSessionIds: ReadonlySet<string>,
  visibleSavedEntryCount: number,
  alwaysVisibleSessionKeys: ReadonlySet<string> = new Set(),
): { visibleEntries: T[]; hasMoreEntries: boolean } {
  const alwaysVisibleEntries: T[] = []
  const pageableEntries: T[] = []
  for (const entry of entries) {
    const conversationId = entry.session.conversationId
    const sessionKey = getSidebarSessionGroupKey(entry.session)
    const isPinnedSavedConversation =
      entry.isSavedConversation &&
      !!conversationId &&
      pinnedSessionIds.has(conversationId)
    const isGroupedSavedConversation =
      entry.isSavedConversation && alwaysVisibleSessionKeys.has(sessionKey)

    if (!entry.isSavedConversation || isPinnedSavedConversation || isGroupedSavedConversation) {
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

      for (const normalizedChildSessionId of getPossibleDelegationChildSessionIds(delegation)) {
        if (
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

function isLikelyInternalSubSessionId(sessionId: string): boolean {
  return sessionId.startsWith("subsession_")
}

export function getSubagentTitleBySessionIdMap(
  progressEntries: Iterable<[string, Pick<AgentProgressUpdate, "steps">]>,
): Map<string, string> {
  const titlesByChildId = new Map<string, string>()

  for (const [parentSessionId, progress] of progressEntries) {
    for (const step of progress.steps ?? []) {
      const delegation = step.delegation
      if (!delegation) continue

      const title = getDelegationDisplayTitle(delegation)
      if (!title) continue

      for (const childSessionId of getPossibleDelegationChildSessionIds(
        delegation,
      )) {
        if (
          childSessionId === parentSessionId ||
          titlesByChildId.has(childSessionId)
        ) {
          continue
        }
        titlesByChildId.set(childSessionId, title)
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
  const explicitTitle = normalizeSidebarActivityText(progress.conversationTitle)
  if (explicitTitle && !isGenericSidebarConversationTitle(explicitTitle)) {
    return explicitTitle
  }

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

  const fallbackTitle = normalizeSidebarActivityText(fallback)
  if (fallbackTitle && !isGenericSidebarConversationTitle(fallbackTitle)) {
    return fallbackTitle
  }

  return explicitTitle ?? fallbackTitle ?? undefined
}

function normalizeSidebarActivityText(value?: string | null): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim()
  return normalized || null
}

function isGenericSidebarConversationTitle(value?: string | null): boolean {
  const normalized = normalizeSidebarActivityText(value)?.toLowerCase()
  return normalized === "continue conversation" || normalized === "untitled conversation"
}

function normalizeSidebarErrorText(value?: string | null): string | null {
  const normalized = normalizeSidebarActivityText(value)
  if (!normalized) return null
  return normalized.replace(/^error:\s*/iu, "").trim() || normalized
}

function getLatestSidebarStep(
  progress: Pick<AgentProgressUpdate, "steps">,
  predicate?: (step: AgentProgressUpdate["steps"][number]) => boolean,
): AgentProgressUpdate["steps"][number] | null {
  for (let index = (progress.steps?.length ?? 0) - 1; index >= 0; index -= 1) {
    const step = progress.steps[index]
    if (!step) continue
    if (!predicate || predicate(step)) return step
  }
  return null
}

function formatSidebarToolName(toolName?: string | null): string | null {
  const normalized = normalizeSidebarActivityText(toolName)
  if (!normalized) return null
  return normalized
    .replace(/^functions\./u, "")
    .replace(/[-_]+/g, " ")
}

function getStepDetail(step: AgentProgressUpdate["steps"][number]): string | null {
  return normalizeSidebarActivityText(
    normalizeMessagePreviewText(step.llmContent ?? step.content ?? step.description)
      ?? step.title,
  )
}

function getSidebarErrorDetail(
  progress: SidebarActivityProgressLike,
  erroredStep: AgentProgressUpdate["steps"][number],
  fallbackErrorText?: string | null,
): string | null {
  const latestToolErrorStep = getLatestSidebarStep(progress, (step) =>
    !!normalizeSidebarActivityText(step.toolResult?.error),
  )
  const latestToolError = normalizeSidebarErrorText(latestToolErrorStep?.toolResult?.error)
  if (latestToolError) return latestToolError

  const finalContent = normalizeSidebarActivityText(progress.finalContent)
  if (finalContent && /^error:/iu.test(finalContent)) {
    return normalizeSidebarErrorText(finalContent)
  }

  const userResponse = normalizeSidebarActivityText(progress.userResponse)
  if (userResponse && /^error:/iu.test(userResponse)) {
    return normalizeSidebarErrorText(userResponse)
  }

  const fallbackError = normalizeSidebarErrorText(fallbackErrorText)
  if (fallbackError) return fallbackError

  return normalizeSidebarErrorText(erroredStep.toolResult?.error) ?? getStepDetail(erroredStep)
}

export function getLatestUserFacingResponse(progress: SidebarActivityProgressLike): string | null {
  const latestResponseEvent = [...(progress.responseEvents ?? [])]
    .reverse()
    .find((event) => normalizeSidebarActivityText(event.text))
  const responseEventText = normalizeSidebarActivityText(
    normalizeMessagePreviewText(latestResponseEvent?.text),
  )
  if (responseEventText) return responseEventText

  const userResponse = normalizeSidebarActivityText(
    normalizeMessagePreviewText(progress.userResponse),
  )
  if (userResponse) return userResponse

  const finalContent = normalizeSidebarActivityText(
    normalizeMessagePreviewText(progress.finalContent),
  )
  if (finalContent) return finalContent

  for (let index = (progress.conversationHistory?.length ?? 0) - 1; index >= 0; index -= 1) {
    const message = progress.conversationHistory?.[index]
    if (message?.role !== "assistant") continue
    const assistantText = normalizeSidebarActivityText(
      normalizeMessagePreviewText(message.content),
    )
    if (assistantText) return assistantText
  }

  return null
}

function makeSidebarToolCallPresentation(
  step: AgentProgressUpdate["steps"][number],
  isActive: boolean,
): SidebarActivityPresentation {
  const toolName = formatSidebarToolName(step.toolCall?.name)
  const verb = isActive ? "Using" : "Used"
  return makeSidebarActivityPresentation(
    "tool_call",
    toolName ? `${verb} ${toolName}` : "Tool call",
    getStepDetail(step),
    isActive,
  )
}

function makeSidebarActivityPresentation(
  kind: SidebarActivityKind,
  label: string,
  detail: string | null,
  isForegroundActivity: boolean,
): SidebarActivityPresentation {
  return {
    kind,
    label,
    detail,
    badgeClassName: SIDEBAR_ACTIVITY_BADGE_CLASSES[kind],
    isForegroundActivity,
  }
}

export function getSidebarActivityPresentation(
  progress?: SidebarActivityProgressLike | null,
  options?: SidebarActivityOptions,
): SidebarActivityPresentation {
  if (!progress) {
    const fallbackError = normalizeSidebarErrorText(options?.fallbackErrorText)
    if (fallbackError) {
      return makeSidebarActivityPresentation("blocked", "Error", fallbackError, true)
    }
    return makeSidebarActivityPresentation("running", "Running", null, false)
  }

  const pendingApprovalTool = formatSidebarToolName(progress.pendingToolApproval?.toolName)
  if (pendingApprovalTool) {
    return makeSidebarActivityPresentation(
      "needs_input",
      "Needs input",
      pendingApprovalTool,
      true,
    )
  }

  const erroredStep = getLatestSidebarStep(progress, (step) =>
    step.status === "error" || !!step.toolResult?.error,
  )
  if (erroredStep) {
    return makeSidebarActivityPresentation(
      "blocked",
      "Error",
      getSidebarErrorDetail(progress, erroredStep, options?.fallbackErrorText),
      true,
    )
  }

  const fallbackError = normalizeSidebarErrorText(options?.fallbackErrorText)
  if (fallbackError) {
    return makeSidebarActivityPresentation("blocked", "Error", fallbackError, true)
  }

  if (progress.retryInfo?.isRetrying) {
    return makeSidebarActivityPresentation(
      "retrying",
      "Retrying",
      normalizeSidebarActivityText(progress.retryInfo.reason),
      true,
    )
  }

  const activeStep = getLatestSidebarStep(progress, (step) =>
    step.status === "in_progress" || step.status === "awaiting_approval",
  )
  if (activeStep?.status === "awaiting_approval") {
    const approvalTool = formatSidebarToolName(activeStep.approvalRequest?.toolName)
    return makeSidebarActivityPresentation(
      "needs_input",
      "Needs input",
      approvalTool ?? getStepDetail(activeStep),
      true,
    )
  }
  const activeDelegationStep = getLatestSidebarStep(progress, (step) =>
    (step.status === "in_progress" || step.status === "awaiting_approval") &&
    isActiveDelegationStatus(step.delegation?.status),
  )
  if (activeDelegationStep?.delegation) {
    return makeSidebarActivityPresentation(
      "delegation",
      "Subagent",
      getDelegationDisplayTitle(activeDelegationStep.delegation) ?? getStepDetail(activeDelegationStep),
      true,
    )
  }
  const activeToolCallStep = getLatestSidebarStep(progress, (step) =>
    step.status === "in_progress" && step.type === "tool_call",
  )
  if (activeToolCallStep) {
    return makeSidebarToolCallPresentation(activeToolCallStep, true)
  }
  if (activeStep?.type === "tool_result") {
    return makeSidebarActivityPresentation(
      "tool_result",
      "Tool result",
      getStepDetail(activeStep),
      true,
    )
  }
  if (activeStep?.type === "thinking") {
    return makeSidebarActivityPresentation(
      "thinking",
      "Thinking",
      getStepDetail(activeStep),
      true,
    )
  }
  if (activeStep) {
    return makeSidebarActivityPresentation(
      "running",
      "Running",
      getStepDetail(activeStep),
      true,
    )
  }

  const streamingText = progress.streamingContent?.isStreaming
    ? normalizeSidebarActivityText(progress.streamingContent.text)
    : null
  if (streamingText) {
    return makeSidebarActivityPresentation("streaming", "Responding", streamingText, true)
  }

  const responseText = getLatestUserFacingResponse(progress)
  if (responseText) {
    return makeSidebarActivityPresentation("response", "Response", responseText, false)
  }

  if (progress.isComplete) {
    return makeSidebarActivityPresentation("complete", "Complete", null, false)
  }

  const latestStep = getLatestSidebarStep(progress)
  if (latestStep?.type === "tool_call") {
    return makeSidebarToolCallPresentation(latestStep, false)
  }
  if (latestStep?.type === "tool_result") {
    return makeSidebarActivityPresentation(
      "tool_result",
      "Tool result",
      getStepDetail(latestStep),
      false,
    )
  }

  const summaryText = normalizeSidebarActivityText(progress.latestSummary?.actionSummary)
  if (summaryText) {
    return makeSidebarActivityPresentation("summary", "Updated", summaryText, false)
  }

  return makeSidebarActivityPresentation("thinking", "Thinking", "Thinking...", true)
}

export function isProgressLiveForSidebar(progress: ProgressLifecycleLike): boolean {
  return !progress.isComplete || hasActiveDelegationProgress(progress)
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
    const conversationId = entry.session.conversationId?.trim()
    if (parentSessionId && parentSessionId !== entry.session.id && entryIds.has(parentSessionId)) {
      return parentSessionId
    }
    if (
      (!parentSessionId || parentSessionId === entry.session.id) &&
      !isLikelyInternalSubSessionId(entry.session.id)
    ) {
      return null
    }
    if (!conversationId) return null

    const conversationEntries = entriesByConversationId.get(conversationId) ?? []
    const parentCandidate =
      conversationEntries.find((candidate) =>
        candidate.session.id !== entry.session.id &&
        !isLikelyInternalSubSessionId(candidate.session.id) &&
        !candidate.session.parentSessionId?.trim(),
      ) ??
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

  const hasUntimestampedUserFacingResponse = !!(
    normalizeSidebarActivityText(progress.userResponse) ||
    normalizeSidebarActivityText(progress.finalContent)
  )

  if (hasUntimestampedUserFacingResponse) {
    recordTimestamp(progress.latestSummary?.timestamp)
    recordTimestamp(progress.steps?.[progress.steps.length - 1]?.timestamp)
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
