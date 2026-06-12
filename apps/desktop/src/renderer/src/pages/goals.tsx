import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Activity, Bot, CheckCircle2, CircleAlert, ExternalLink, History, ListChecks, PauseCircle, Play, Radio, Square } from "lucide-react"
import type { Goal, GoalCreateRequest, GoalLevel, GoalStatus, Decision, GoalProgressEvent } from "@dotagents/shared"
import type { AgentProgressUpdate, LoopConfig } from "@shared/types"
import { Badge } from "@renderer/components/ui/badge"
import { Button } from "@renderer/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@renderer/components/ui/card"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Textarea } from "@renderer/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import { tipcClient, rendererHandlers } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { useAgentStore } from "@renderer/stores"

type GoalForm = {
  title: string
  description: string
  level: GoalLevel
  priority: string
  parentId: string
  successCriteria: string
  abandonIf: string
  body: string
}

interface AgentSessionRecord {
  id: string
  conversationId?: string
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  startTime?: number
  endTime?: number
  currentIteration?: number
  maxIterations?: number
  lastActivity?: string
  errorMessage?: string
  isSnoozed?: boolean
  isRepeatTask?: boolean
}

interface SessionListResponse {
  activeSessions: AgentSessionRecord[]
  recentCompletedSessions?: AgentSessionRecord[]
  recentSessions?: AgentSessionRecord[]
}

interface LoopStatus {
  id: string
  name: string
  enabled: boolean
  isRunning: boolean
  lastRunAt?: number
  nextRunAt?: number
  intervalMinutes: number
  schedule?: LoopConfig["schedule"]
}

const emptyForm: GoalForm = {
  title: "",
  description: "",
  level: "goal",
  priority: "3",
  parentId: "",
  successCriteria: "",
  abandonIf: "",
  body: "",
}

const LEVEL_LABELS: Record<GoalLevel, string> = {
  goal: "Big Goals",
  week: "This Week",
  today: "Today's Focus",
}

function priorityLabel(priority: number): string {
  return `P${priority}`
}

function statusTone(status: GoalStatus): string {
  if (status === "active") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
  if (status === "paused") return "bg-amber-500/15 text-amber-700 dark:text-amber-300"
  if (status === "done") return "bg-blue-500/15 text-blue-700 dark:text-blue-300"
  return "bg-muted text-muted-foreground"
}

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return "Never"
  const diffMs = Date.now() - timestamp
  const absMs = Math.abs(diffMs)
  const suffix = diffMs >= 0 ? "ago" : "from now"
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (absMs < minute) return diffMs >= 0 ? "just now" : "in under 1m"
  if (absMs < hour) return `${Math.round(absMs / minute)}m ${suffix}`
  if (absMs < day) return `${Math.round(absMs / hour)}h ${suffix}`
  return `${Math.round(absMs / day)}d ${suffix}`
}

function getLatestProgressText(progress?: AgentProgressUpdate): string {
  const latestStep = progress?.steps.at(-1)
  if (latestStep?.description) return latestStep.description
  if (latestStep?.title) return latestStep.title
  if (progress?.streamingContent?.text) return progress.streamingContent.text
  if (progress?.userResponse) return progress.userResponse
  return "Waiting for the next update."
}

function getSessionTimestamp(session: AgentSessionRecord, progress?: AgentProgressUpdate): number {
  const latestStepTimestamp = progress?.steps.at(-1)?.timestamp
  const latestMessageTimestamp = progress?.conversationHistory?.at(-1)?.timestamp
  return Math.max(
    latestStepTimestamp ?? 0,
    latestMessageTimestamp ?? 0,
    session.endTime ?? 0,
    session.startTime ?? 0,
  )
}

function sessionStatusTone(session: AgentSessionRecord, progress?: AgentProgressUpdate): string {
  if (progress?.pendingToolApproval) return "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  if (session.status === "error" || session.status === "stopped") return "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300"
  if (progress?.isComplete || session.status === "completed") return "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (session.isSnoozed || progress?.isSnoozed) return "border-muted-foreground/30 bg-muted text-muted-foreground"
  return "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300"
}

function SessionCard({
  session,
  progress,
  matchedGoal,
  onFocus,
  onStop,
}: {
  session: AgentSessionRecord
  progress?: AgentProgressUpdate
  matchedGoal?: Goal
  onFocus: (session: AgentSessionRecord) => void
  onStop: (session: AgentSessionRecord) => void
}) {
  const latestTimestamp = getSessionTimestamp(session, progress)
  const isActive = session.status === "active" && !progress?.isComplete

  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-500" />
            <div className="truncate text-sm font-semibold">
              {progress?.conversationTitle || session.conversationTitle || "Agent session"}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {matchedGoal ? `Goal: ${matchedGoal.title}` : session.isRepeatTask ? "Repeat task run" : "Manual session"}
          </div>
        </div>
        <Badge variant="outline" className={sessionStatusTone(session, progress)}>
          {progress?.pendingToolApproval ? "needs input" : progress?.isComplete ? "complete" : session.isSnoozed ? "background" : session.status}
        </Badge>
      </div>
      <div className="mt-3 line-clamp-2 text-sm text-muted-foreground">{getLatestProgressText(progress)}</div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          Updated {formatRelativeTime(latestTimestamp)}
          {progress?.currentIteration ? ` · Iteration ${progress.currentIteration}/${progress.maxIterations}` : ""}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onFocus(session)}>
            <ExternalLink className="mr-1 h-3.5 w-3.5" />
            Open
          </Button>
          {isActive && (
            <Button size="sm" variant="outline" onClick={() => onStop(session)}>
              <Square className="mr-1 h-3.5 w-3.5" />
              Stop
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function GoalLoopPanel({
  loop,
  status,
  isBusy,
  latestEvent,
  liveSessionCount,
  onArm,
  onPause,
  onCheckNow,
}: {
  loop?: LoopConfig
  status?: LoopStatus
  isBusy: boolean
  latestEvent?: GoalProgressEvent
  liveSessionCount: number
  onArm: () => void
  onPause: () => void
  onCheckNow: () => void
}) {
  const isArmed = Boolean(status?.enabled)
  const isOnline = isArmed && loop?.runContinuously === true
  const statusLabel = status?.isRunning ? "checking now" : isOnline ? "online 24/7" : isArmed ? "scheduled only" : "paused"
  const wakeLabel = status?.isRunning
    ? "Running now"
    : isOnline
      ? "Continuous"
      : status?.nextRunAt
      ? formatRelativeTime(status.nextRunAt)
      : isArmed
        ? "Timer pending"
        : "Not armed"
  const cadenceLabel = isOnline
    ? `Always on · sweep every ${loop?.intervalMinutes ?? 15}m`
    : loop?.schedule?.type === "daily"
    ? `Daily ${loop.schedule.times.join(", ")}`
    : `${loop?.intervalMinutes ?? 1440}m cadence`

  return (
    <Card className="overflow-hidden border-emerald-500/25 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.84)_42%,rgba(8,47,73,0.82))] text-white shadow-xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              <Radio className="h-3.5 w-3.5" />
              Goal agent
            </div>
            <CardTitle className="mt-2 text-2xl">24/7 supervisor</CardTitle>
            <CardDescription className="text-slate-300">
              Stays online, watches goal state, records evidence, and launches bounded checks without burning tokens in a tight no-op loop.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 border-white/20 bg-white/10 text-white",
              status?.isRunning && "border-blue-300 bg-blue-400/20 text-blue-100",
              isOnline && !status?.isRunning && "border-emerald-300 bg-emerald-400/20 text-emerald-100",
            )}
          >
            <span className={cn("mr-2 h-2 w-2 rounded-full", status?.isRunning ? "animate-pulse bg-blue-200" : isOnline ? "animate-pulse bg-emerald-200" : isArmed ? "bg-amber-200" : "bg-slate-400")} />
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
          {isOnline ? (
            <span>
              The goal agent is online 24/7. <span className="font-semibold text-white">0 live sessions</span> means standby between bounded checks, not off.
            </span>
          ) : isArmed ? (
            <span>
              The goal agent is only on a daily schedule right now. Switch it to 24/7 mode to keep the supervisor online.
            </span>
          ) : (
            <span>
              The goal agent is paused. Start 24/7 mode to bring the supervisor online and run an immediate check.
            </span>
          )}
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Supervisor</div>
            <div className="mt-1 font-medium">{isOnline ? "Online" : isArmed ? "Scheduled" : "Paused"}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Current run</div>
            <div className="mt-1 font-medium">{status?.isRunning ? "Live" : liveSessionCount > 0 ? `${liveSessionCount} live` : isOnline ? "Standby" : "Idle"}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Next check</div>
            <div className="mt-1 font-medium">{wakeLabel}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Last evidence</div>
            <div className="mt-1 truncate font-medium">{latestEvent ? formatRelativeTime(latestEvent.at) : "None yet"}</div>
          </div>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Last run</div>
            <div className="mt-1 font-medium">{formatRelativeTime(status?.lastRunAt)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Cadence</div>
            <div className="mt-1 font-medium">{cadenceLabel}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Conversation</div>
            <div className="mt-1 font-medium">{loop?.continueInSession ? "Reused memory" : "New each run"}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOnline ? (
            <Button className="bg-white text-slate-950 hover:bg-slate-100" onClick={onCheckNow} disabled={!loop || isBusy || status?.isRunning}>
              <Play className="mr-2 h-4 w-4" />
              Check now
            </Button>
          ) : (
            <Button className="bg-emerald-300 text-slate-950 hover:bg-emerald-200" onClick={onArm} disabled={!loop || isBusy || status?.isRunning}>
              <Radio className="mr-2 h-4 w-4" />
              Start 24/7 goal agent
            </Button>
          )}
          {!isOnline && (
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={onCheckNow} disabled={!loop || isBusy || status?.isRunning}>
              <Play className="mr-2 h-4 w-4" />
              Run one check
            </Button>
          )}
          {isArmed && (
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={onPause} disabled={!loop || isBusy}>
              <PauseCircle className="mr-2 h-4 w-4" />
              Pause supervisor
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getEventTone(type: GoalProgressEvent["type"]): string {
  if (type === "planner_run_noop") return "border-muted-foreground/30 bg-muted text-muted-foreground"
  if (type.includes("decision")) return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  if (type === "goal_status_changed" || type === "criterion_completed") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  return "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300"
}

function formatEventType(type: GoalProgressEvent["type"]): string {
  return type.replace(/^planner_run_/u, "goal agent ").replace(/^goal_/u, "goal ").replace(/^decision_/u, "decision ").replace(/_/gu, " ")
}

function formatEventTitle(event: GoalProgressEvent): string {
  return event.title
    .replace(/^Started planner:/u, "Started goal agent check:")
    .replace(/^Planner completed:/u, "Goal agent recorded progress:")
    .replace(/^Planner checked goals:/u, "Goal agent checked goals:")
}

function getEventSignature(event: GoalProgressEvent): string {
  return [
    event.type,
    event.goalId ?? "",
    event.parentGoalId ?? "",
    event.title,
    event.summary ?? "",
  ].join("|")
}

function compactGoalProgressEvents(events: GoalProgressEvent[]): GoalProgressEvent[] {
  const focusSelectedAtByGoalId = new Map<string, number>()
  for (const event of events) {
    if (event.type === "focus_selected" && event.goalId) {
      const current = focusSelectedAtByGoalId.get(event.goalId) ?? 0
      focusSelectedAtByGoalId.set(event.goalId, Math.max(current, event.at))
    }
  }

  const lastSeenBySignature = new Map<string, number>()
  const compacted: GoalProgressEvent[] = []
  for (const event of events) {
    if (event.type === "planner_run_noop") continue

    const focusSelectedAt = event.goalId ? focusSelectedAtByGoalId.get(event.goalId) : undefined
    if (
      event.type === "goal_updated" &&
      event.source === "loop_daily_planning" &&
      focusSelectedAt &&
      Math.abs(event.at - focusSelectedAt) < 10 * 60_000
    ) {
      continue
    }

    const signature = getEventSignature(event)
    const lastSeenAt = lastSeenBySignature.get(signature)
    if (lastSeenAt && Math.abs(lastSeenAt - event.at) < 10 * 60_000) continue

    lastSeenBySignature.set(signature, event.at)
    compacted.push(event)
  }

  return compacted
}

function ProgressLedger({
  events,
  goalsById,
}: {
  events: GoalProgressEvent[]
  goalsById: Map<string, Goal>
}) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Progress ledger</CardTitle>
            <CardDescription>Meaningful changes recorded by goals, decisions, and planner runs.</CardDescription>
          </div>
          <History className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No goal progress events recorded yet.
          </div>
        ) : (
          events.slice(0, 8).map((event) => {
            const goal = event.goalId ? goalsById.get(event.goalId) : undefined
            return (
              <div key={event.id} className="rounded-lg border border-border/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{formatEventTitle(event)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {goal?.title ?? event.goalId ?? "Goal agent"} · {formatRelativeTime(event.at)}
                    </div>
                  </div>
                  <Badge variant="outline" className={getEventTone(event.type)}>
                    {formatEventType(event.type)}
                  </Badge>
                </div>
                {event.summary && <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.summary}</div>}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function GoalCard({
  goal,
  pendingDecisionCount,
  onStatus,
  onPriority,
}: {
  goal: Goal
  pendingDecisionCount: number
  onStatus: (goal: Goal, status: GoalStatus) => void
  onPriority: (goal: Goal, priority: number) => void
}) {
  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{goal.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{goal.description || "No description yet."}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Badge className={statusTone(goal.status)} variant="secondary">{goal.status}</Badge>
            <Badge variant="outline">{priorityLabel(goal.priority)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 text-muted-foreground">
          <div><span className="font-medium text-foreground">Success:</span> {goal.successCriteria || "Hidden from loops until defined."}</div>
          {goal.abandonIf && <div><span className="font-medium text-foreground">Abandon if:</span> {goal.abandonIf}</div>}
          {pendingDecisionCount > 0 && (
            <div className="font-medium text-amber-700 dark:text-amber-300">
              {pendingDecisionCount} pending decision{pendingDecisionCount === 1 ? "" : "s"} blocking this goal
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {goal.status !== "paused" && <Button size="sm" variant="outline" onClick={() => onStatus(goal, "paused")}>Pause</Button>}
          {goal.status !== "active" && <Button size="sm" variant="outline" onClick={() => onStatus(goal, "active")}>Activate</Button>}
          {goal.status !== "done" && <Button size="sm" variant="outline" onClick={() => onStatus(goal, "done")}>Done</Button>}
          {goal.status !== "abandoned" && <Button size="sm" variant="outline" onClick={() => onStatus(goal, "abandoned")}>Abandon</Button>}
          {[1, 2, 3, 4, 5].map((priority) => (
            <Button
              key={priority}
              size="sm"
              variant={goal.priority === priority ? "default" : "ghost"}
              onClick={() => onPriority(goal, priority)}
            >
              P{priority}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function GoalsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<GoalForm>(emptyForm)
  const [loopBusy, setLoopBusy] = useState(false)
  const agentProgressById = useAgentStore((state) => state.agentProgressById)
  const focusedSessionId = useAgentStore((state) => state.focusedSessionId)
  const setFocusedSessionId = useAgentStore((state) => state.setFocusedSessionId)

  const goalsQuery = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: () => tipcClient.getGoals() as Promise<Goal[]>,
  })

  const pendingDecisionsQuery = useQuery<Decision[]>({
    queryKey: ["decisions", "pending"],
    queryFn: () => tipcClient.getDecisions({ status: "pending" }) as Promise<Decision[]>,
  })

  const sessionsQuery = useQuery<SessionListResponse>({
    queryKey: ["agentSessions"],
    queryFn: () => tipcClient.getAgentSessions() as Promise<SessionListResponse>,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  })

  const loopsQuery = useQuery<LoopConfig[]>({
    queryKey: ["loops"],
    queryFn: () => tipcClient.getLoops() as Promise<LoopConfig[]>,
  })

  const loopStatusesQuery = useQuery<LoopStatus[]>({
    queryKey: ["loopStatuses"],
    queryFn: () => tipcClient.getLoopStatuses() as Promise<LoopStatus[]>,
    refetchInterval: 5_000,
  })

  const goalEventsQuery = useQuery<GoalProgressEvent[]>({
    queryKey: ["goalProgressEvents"],
    queryFn: () => tipcClient.getGoalProgressEvents({ limit: 100 }) as Promise<GoalProgressEvent[]>,
    refetchInterval: 10_000,
  })

  useEffect(() => {
    const unlisten = rendererHandlers.agentSessionsUpdated.listen(() => {
      queryClient.invalidateQueries({ queryKey: ["agentSessions"] })
      queryClient.invalidateQueries({ queryKey: ["loopStatuses"] })
      queryClient.invalidateQueries({ queryKey: ["goalProgressEvents"] })
    })
    return unlisten
  }, [queryClient])

  const goals = goalsQuery.data ?? []
  const pendingDecisions = pendingDecisionsQuery.data ?? []
  const loops = loopsQuery.data ?? []
  const loopStatuses = loopStatusesQuery.data ?? []
  const goalEvents = goalEventsQuery.data ?? []
  const dashboardGoalEvents = useMemo(() => compactGoalProgressEvents(goalEvents), [goalEvents])
  const activeGoals = goals.filter((goal) => goal.status === "active")
  const blockedGoalIds = new Set(pendingDecisions.map((decision) => decision.goalId).filter(Boolean))
  const dailyGoalLoop = loops.find((loop) => loop.id === "daily-goal-planning" || loop.loopType === "daily_planning")
  const dailyGoalLoopStatus = dailyGoalLoop ? loopStatuses.find((status) => status.id === dailyGoalLoop.id) : undefined
  const goalsById = useMemo(() => new Map(goals.map((goal) => [goal.id, goal] as const)), [goals])
  const latestMeaningfulEvent = dashboardGoalEvents[0]

  const groupedGoals = useMemo(() => {
    const groups: Record<GoalLevel, Goal[]> = { goal: [], week: [], today: [] }
    for (const goal of goals) groups[goal.level].push(goal)
    for (const level of Object.keys(groups) as GoalLevel[]) {
      groups[level].sort((a, b) => a.priority - b.priority || b.updatedAt - a.updatedAt)
    }
    return groups
  }, [goals])

  const pendingCountByGoalId = useMemo(() => {
    const counts = new Map<string, number>()
    for (const decision of pendingDecisions) {
      if (!decision.goalId) continue
      counts.set(decision.goalId, (counts.get(decision.goalId) ?? 0) + 1)
    }
    return counts
  }, [pendingDecisions])

  const liveSessions = useMemo(() => {
    const merged = new Map<string, AgentSessionRecord>()
    for (const session of sessionsQuery.data?.activeSessions ?? []) {
      merged.set(session.id, session)
    }
    for (const [sessionId, progress] of agentProgressById.entries()) {
      if (progress.isComplete) continue
      const existing = merged.get(sessionId)
      merged.set(sessionId, {
        id: sessionId,
        conversationId: progress.conversationId ?? existing?.conversationId,
        conversationTitle: progress.conversationTitle ?? existing?.conversationTitle,
        status: existing?.status ?? "active",
        startTime: existing?.startTime ?? progress.conversationHistory?.[0]?.timestamp ?? Date.now(),
        currentIteration: progress.currentIteration,
        maxIterations: progress.maxIterations,
        isSnoozed: progress.isSnoozed ?? existing?.isSnoozed,
        isRepeatTask: existing?.isRepeatTask,
      })
    }
    return Array.from(merged.values()).sort((a, b) => {
      return getSessionTimestamp(b, agentProgressById.get(b.id)) - getSessionTimestamp(a, agentProgressById.get(a.id))
    })
  }, [agentProgressById, sessionsQuery.data?.activeSessions])

  const goalBySessionId = useMemo(() => {
    const matched = new Map<string, Goal>()
    for (const session of liveSessions) {
      const title = `${session.conversationTitle ?? ""} ${agentProgressById.get(session.id)?.conversationTitle ?? ""}`.toLowerCase()
      const goal = goals.find((item) => title.includes(item.title.toLowerCase()) || title.includes(item.id.toLowerCase()))
      if (goal) matched.set(session.id, goal)
    }
    return matched
  }, [agentProgressById, goals, liveSessions])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["goals"] })
    queryClient.invalidateQueries({ queryKey: ["decisions"] })
    queryClient.invalidateQueries({ queryKey: ["goalProgressEvents"] })
  }

  const handleCreate = async () => {
    const title = form.title.trim()
    if (!title) {
      toast.error("Goal title is required")
      return
    }

    const goal: GoalCreateRequest = {
      title,
      description: form.description.trim(),
      level: form.level,
      priority: Number(form.priority) || 3,
      status: "active",
      parentId: form.parentId.trim() || undefined,
      successCriteria: form.successCriteria.trim() || undefined,
      abandonIf: form.abandonIf.trim() || undefined,
      body: form.body.trim(),
      createdBy: "aj",
      createdFrom: "manual",
      linkedTaskIds: [],
    }

    try {
      await tipcClient.saveGoal({ goal })
      setForm(emptyForm)
      invalidate()
      toast.success("Goal created")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create goal")
    }
  }

  const updateGoal = async (goal: Goal, updates: Partial<Goal>) => {
    await tipcClient.updateGoal({ id: goal.id, updates })
    invalidate()
  }

  const runDailyGoalLoop = async () => {
    if (!dailyGoalLoop) {
      toast.error("Goal agent task is not installed")
      return
    }

    setLoopBusy(true)
    try {
      const result = await tipcClient.triggerLoop({ loopId: dailyGoalLoop.id })
      if (result && !result.success) {
        toast.error("Could not start the goal agent check right now")
        return
      }
      toast.success("Goal agent check started")
      queryClient.invalidateQueries({ queryKey: ["agentSessions"] })
      queryClient.invalidateQueries({ queryKey: ["loopStatuses"] })
      queryClient.invalidateQueries({ queryKey: ["goalProgressEvents"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start goal agent check")
    } finally {
      setLoopBusy(false)
    }
  }

  const armGoalAgent = async () => {
    if (!dailyGoalLoop) {
      toast.error("Goal agent task is not installed")
      return
    }

    setLoopBusy(true)
    try {
      await tipcClient.saveLoop({
        loop: {
          ...dailyGoalLoop,
          enabled: true,
          intervalMinutes: 15,
          runContinuously: true,
          continueInSession: true,
        },
      })
      await tipcClient.startLoop?.({ loopId: dailyGoalLoop.id })
      const result = await tipcClient.triggerLoop({ loopId: dailyGoalLoop.id })
      if (result && !result.success) {
        toast.error("Goal agent is online, but the immediate check could not start")
      } else {
        toast.success("24/7 goal agent online")
      }
      queryClient.invalidateQueries({ queryKey: ["loops"] })
      queryClient.invalidateQueries({ queryKey: ["loopStatuses"] })
      queryClient.invalidateQueries({ queryKey: ["agentSessions"] })
      queryClient.invalidateQueries({ queryKey: ["goalProgressEvents"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to arm goal agent")
    } finally {
      setLoopBusy(false)
    }
  }

  const pauseGoalAgent = async () => {
    if (!dailyGoalLoop) {
      toast.error("Goal agent task is not installed")
      return
    }

    setLoopBusy(true)
    try {
      await tipcClient.stopLoop?.({ loopId: dailyGoalLoop.id })
      await tipcClient.saveLoop({
        loop: {
          ...dailyGoalLoop,
          enabled: false,
          runContinuously: false,
        },
      })
      toast.success("Goal agent supervisor paused")
      queryClient.invalidateQueries({ queryKey: ["loops"] })
      queryClient.invalidateQueries({ queryKey: ["loopStatuses"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to pause goal agent")
    } finally {
      setLoopBusy(false)
    }
  }

  const focusSession = async (session: AgentSessionRecord) => {
    setFocusedSessionId(session.id)
    try {
      await tipcClient.focusAgentSession({ sessionId: session.id })
      await tipcClient.setPanelMode({ mode: "agent" })
      await tipcClient.showPanelWindow({})
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open agent session")
    }
  }

  const stopSession = async (session: AgentSessionRecord) => {
    try {
      await tipcClient.stopAgentSession({ sessionId: session.id })
      if (focusedSessionId === session.id) setFocusedSessionId(null)
      queryClient.invalidateQueries({ queryKey: ["agentSessions"] })
      toast.success("Agent session stopped")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to stop agent session")
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl">
        <div className="absolute right-8 top-6 h-28 w-28 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-24 w-48 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">
              <Activity className="h-4 w-4" />
              Goal command center
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Goals</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Manage goal state, keep the goal agent online, and inspect every live or standby run from one dashboard.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
              <div className="text-xs uppercase tracking-wide text-slate-300">Active goals</div>
              <div className="text-2xl font-semibold">{activeGoals.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
              <div className="text-xs uppercase tracking-wide text-slate-300">Agents live</div>
              <div className="text-2xl font-semibold">{liveSessions.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
              <div className="text-xs uppercase tracking-wide text-slate-300">Today</div>
              <div className="text-2xl font-semibold">{groupedGoals.today.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
              <div className="text-xs uppercase tracking-wide text-slate-300">Last change</div>
              <div className="truncate text-lg font-semibold">{latestMeaningfulEvent ? formatRelativeTime(latestMeaningfulEvent.at) : "None"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <GoalLoopPanel
          loop={dailyGoalLoop}
          status={dailyGoalLoopStatus}
          isBusy={loopBusy}
          latestEvent={latestMeaningfulEvent}
          liveSessionCount={liveSessions.length}
          onArm={() => void armGoalAgent()}
          onPause={() => void pauseGoalAgent()}
          onCheckNow={() => void runDailyGoalLoop()}
        />

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Live agents</CardTitle>
                <CardDescription>Active sessions working now, including goal-loop runs.</CardDescription>
              </div>
              <Badge variant={liveSessions.length > 0 ? "default" : "outline"}>{liveSessions.length} live</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CircleAlert className="h-4 w-4" />
                  No agents are running.
                </div>
                <p className="mt-2">
                  {dailyGoalLoopStatus?.enabled
                    ? "The supervisor is online; no live session means standby between bounded checks."
                    : "Start the 24/7 goal agent to run an immediate check and keep the supervisor online."}
                </p>
              </div>
            ) : (
              liveSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  progress={agentProgressById.get(session.id)}
                  matchedGoal={goalBySessionId.get(session.id)}
                  onFocus={(item) => void focusSession(item)}
                  onStop={(item) => void stopSession(item)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Current focus</CardTitle>
                <CardDescription>Today-level goals selected from larger goals.</CardDescription>
              </div>
              <ListChecks className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupedGoals.today.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No today focus selected yet.
              </div>
            ) : (
              groupedGoals.today.map((goal) => {
                const latestGoalEvent = dashboardGoalEvents.find((event) => event.goalId === goal.id || event.parentGoalId === goal.id)
                return (
                  <div key={goal.id} className="rounded-lg border border-border/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{goal.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Parent: {goal.parentId ? goalsById.get(goal.parentId)?.title ?? goal.parentId : "None"}
                        </div>
                      </div>
                      <Badge className={statusTone(goal.status)} variant="secondary">{goal.status}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{goal.successCriteria || "No success criteria yet."}</div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {latestGoalEvent ? `${formatEventType(latestGoalEvent.type)} · ${formatRelativeTime(latestGoalEvent.at)}` : "No event history yet"}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
        <ProgressLedger events={dashboardGoalEvents} goalsById={goalsById} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Goal</CardTitle>
          <CardDescription>Keep it concrete: success criteria are what make a goal loop-visible.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Level</Label>
            <Select value={form.level} onValueChange={(level: GoalLevel) => setForm({ ...form, level })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="goal">Goal</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="today">Today</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Input value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Parent Goal ID</Label>
            <Input value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Success Criteria</Label>
            <Input value={form.successCriteria} onChange={(event) => setForm({ ...form, successCriteria: event.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Abandon If</Label>
            <Input value={form.abandonIf} onChange={(event) => setForm({ ...form, abandonIf: event.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Context</Label>
            <Textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} rows={4} />
          </div>
          <div className="md:col-span-2">
            <Button onClick={() => void handleCreate()}>Create Goal</Button>
          </div>
        </CardContent>
      </Card>

      {(Object.keys(LEVEL_LABELS) as GoalLevel[]).map((level) => (
        <section key={level} className="space-y-3">
          <h2 className="text-lg font-semibold">{LEVEL_LABELS[level]}</h2>
          {groupedGoals[level].length === 0 ? (
            <Card><CardContent className="py-6 text-sm text-muted-foreground">No {LEVEL_LABELS[level].toLowerCase()} yet.</CardContent></Card>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {groupedGoals[level].map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  pendingDecisionCount={pendingCountByGoalId.get(goal.id) ?? 0}
                  onStatus={(item, status) => void updateGoal(item, { status })}
                  onPriority={(item, priority) => void updateGoal(item, { priority })}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

export const Component = GoalsPage
