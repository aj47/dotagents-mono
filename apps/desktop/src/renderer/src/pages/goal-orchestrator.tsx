import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Activity,
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  Eye,
  Loader2,
  PauseCircle,
  Play,
  Plus,
  RotateCcw,
  Save,
  Square,
  Trash2,
  X,
} from "lucide-react"
import { Badge } from "@renderer/components/ui/badge"
import { Button } from "@renderer/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@renderer/components/ui/card"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs"
import { Textarea } from "@renderer/components/ui/textarea"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { useAgentStore } from "@renderer/stores"
import type {
  Decision,
  Goal,
  GoalAgentRun,
  GoalOrchestratorSnapshot,
  GoalStatus,
  WorkItem,
  WorkItemStatus,
} from "@shared/types"
import { toast } from "sonner"

type GoalFilter = "active" | "all"
type WorkTab = "ready" | "running" | "waiting" | "history"

const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  done: "Done",
}

const WORK_STATUS_LABEL: Record<WorkItemStatus, string> = {
  ready: "Ready",
  running: "Running",
  waiting: "Waiting",
  done: "Done",
  discarded: "Discarded",
}

function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return "Never"
  return new Date(timestamp).toLocaleString()
}

function statusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "active" || status === "ready" || status === "done") return "secondary"
  if (status === "running") return "default"
  if (status === "failed" || status === "killed" || status === "discarded") return "destructive"
  return "outline"
}

function getWorkForRun(run: GoalAgentRun, workById: Map<string, WorkItem>): WorkItem | undefined {
  return workById.get(run.workItemId)
}

export function GoalOrchestratorPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const setFocusedSessionId = useAgentStore((state) => state.setFocusedSessionId)
  const setScrollToSessionId = useAgentStore((state) => state.setScrollToSessionId)
  const [goalFilter, setGoalFilter] = useState<GoalFilter>("active")
  const [workTab, setWorkTab] = useState<WorkTab>("ready")
  const [goalDraft, setGoalDraft] = useState({ title: "", notes: "" })
  const [workDraft, setWorkDraft] = useState({ goalId: "", title: "", notes: "" })
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editingGoalDraft, setEditingGoalDraft] = useState({ title: "", notes: "" })
  const [decisionAnswers, setDecisionAnswers] = useState<Record<string, string>>({})
  const [isRunningOrchestrator, setIsRunningOrchestrator] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const snapshotQuery = useQuery<GoalOrchestratorSnapshot>({
    queryKey: ["goal-orchestrator"],
    queryFn: async () => tipcClient.getGoalOrchestratorSnapshot() as Promise<GoalOrchestratorSnapshot>,
    refetchInterval: 5000,
  })

  useEffect(() => {
    return rendererHandlers.goalOrchestratorChanged.listen(() => {
      queryClient.invalidateQueries({ queryKey: ["goal-orchestrator"] })
      queryClient.invalidateQueries({ queryKey: ["agentSessions"] })
    })
  }, [queryClient])

  const snapshot = snapshotQuery.data
  const goals = snapshot?.goals ?? []
  const workItems = snapshot?.workItems ?? []
  const decisions = snapshot?.decisions ?? []
  const agentRuns = snapshot?.agentRuns ?? []
  const activityNotes = snapshot?.activityNotes ?? []
  const activeGoals = goals.filter((goal) => goal.status === "active")
  const visibleGoals = goalFilter === "active" ? activeGoals : goals
  const pendingDecisions = decisions.filter((decision) => decision.status === "pending")
  const runningRuns = agentRuns.filter((run) => run.status === "running")

  const goalById = useMemo(
    () => new Map(goals.map((goal) => [goal.id, goal] as const)),
    [goals],
  )
  const workById = useMemo(
    () => new Map(workItems.map((workItem) => [workItem.id, workItem] as const)),
    [workItems],
  )

  useEffect(() => {
    if (!workDraft.goalId && activeGoals[0]?.id) {
      setWorkDraft((current) => ({ ...current, goalId: activeGoals[0].id }))
    }
  }, [activeGoals, workDraft.goalId])

  const runAction = async (key: string, action: () => Promise<void>, success?: string) => {
    setBusyAction(key)
    try {
      await action()
      if (success) toast.success(success)
      await queryClient.invalidateQueries({ queryKey: ["goal-orchestrator"] })
      await queryClient.invalidateQueries({ queryKey: ["agentSessions"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed")
    } finally {
      setBusyAction(null)
    }
  }

  const handleCreateGoal = async (event: FormEvent) => {
    event.preventDefault()
    if (!goalDraft.title.trim()) {
      toast.error("Goal title is required")
      return
    }
    await runAction("create-goal", async () => {
      await tipcClient.createGoal(goalDraft)
      setGoalDraft({ title: "", notes: "" })
    }, "Goal created")
  }

  const handleCreateWorkItem = async (event: FormEvent) => {
    event.preventDefault()
    if (!workDraft.goalId || !workDraft.title.trim()) {
      toast.error("Goal and title are required")
      return
    }
    await runAction("create-work", async () => {
      await tipcClient.createWorkItem(workDraft)
      setWorkDraft((current) => ({ ...current, title: "", notes: "" }))
    }, "Work item created")
  }

  const handleRunNow = async () => {
    setIsRunningOrchestrator(true)
    try {
      const run = await tipcClient.runGoalOrchestratorNow()
      await queryClient.invalidateQueries({ queryKey: ["goal-orchestrator"] })
      toast.success(run?.summary || "Orchestrator ran")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to run orchestrator")
    } finally {
      setIsRunningOrchestrator(false)
    }
  }

  const handleSaveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const readRequiredNumber = (name: string) => {
      const value = String(formData.get(name) ?? "").trim()
      const parsed = Number(value)
      return Number.isFinite(parsed) ? Math.floor(parsed) : undefined
    }
    const readOptionalNumber = (name: string) => {
      const value = String(formData.get(name) ?? "").trim()
      if (!value) return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? Math.floor(parsed) : undefined
    }

    await runAction("save-settings", async () => {
      await tipcClient.updateGoalOrchestratorSettings({
        maxGlobalRunningSessions: readRequiredNumber("maxGlobalRunningSessions"),
        maxRunningSessionsPerGoal: readRequiredNumber("maxRunningSessionsPerGoal"),
        maxSessionRuntimeMinutes: readOptionalNumber("maxSessionRuntimeMinutes"),
        maxIterationsPerSession: readOptionalNumber("maxIterationsPerSession"),
        maxSessionsPerWakeCycle: readRequiredNumber("maxSessionsPerWakeCycle"),
      })
    }, "Limits updated")
  }

  const startEditingGoal = (goal: Goal) => {
    setEditingGoalId(goal.id)
    setEditingGoalDraft({ title: goal.title, notes: goal.notes ?? "" })
  }

  const saveEditingGoal = async (goal: Goal) => {
    await runAction(`save-goal-${goal.id}`, async () => {
      await tipcClient.updateGoal({
        goalId: goal.id,
        title: editingGoalDraft.title,
        notes: editingGoalDraft.notes,
      })
      setEditingGoalId(null)
    }, "Goal updated")
  }

  const updateGoalStatus = async (goal: Goal, status: GoalStatus) => {
    await runAction(`goal-status-${goal.id}-${status}`, async () => {
      await tipcClient.updateGoal({ goalId: goal.id, status })
    }, "Goal updated")
  }

  const updateWorkStatus = async (workItem: WorkItem, status: WorkItemStatus) => {
    await runAction(`work-status-${workItem.id}-${status}`, async () => {
      await tipcClient.updateWorkItem({ workItemId: workItem.id, status })
    }, "Work item updated")
  }

  const startWorkItem = async (workItem: WorkItem) => {
    await runAction(`start-work-${workItem.id}`, async () => {
      await tipcClient.startGoalWorkItem({ workItemId: workItem.id })
    }, "Session started")
  }

  const killRun = async (run: GoalAgentRun) => {
    await runAction(`kill-run-${run.id}`, async () => {
      await tipcClient.killGoalAgentRun({ agentRunId: run.id })
    }, "Session stopped")
  }

  const answerDecision = async (decision: Decision) => {
    const answer = decisionAnswers[decision.id]?.trim()
    if (!answer) {
      toast.error("Answer is required")
      return
    }
    await runAction(`answer-decision-${decision.id}`, async () => {
      await tipcClient.answerDecision({ decisionId: decision.id, answer })
      setDecisionAnswers((current) => ({ ...current, [decision.id]: "" }))
    }, "Decision answered")
  }

  const dismissDecision = async (decision: Decision) => {
    await runAction(`dismiss-decision-${decision.id}`, async () => {
      await tipcClient.dismissDecision({ decisionId: decision.id })
    }, "Decision dismissed")
  }

  const inspectSession = (sessionId: string) => {
    navigate("/", { state: { clearPendingConversation: true } })
    setFocusedSessionId(sessionId)
    setScrollToSessionId(sessionId)
  }

  const workForTab = (tab: WorkTab) => {
    if (tab === "history") {
      return workItems.filter((workItem) => workItem.status === "done" || workItem.status === "discarded")
    }
    return workItems.filter((workItem) => workItem.status === tab)
  }

  const renderGoalCard = (goal: Goal) => {
    const isEditing = editingGoalId === goal.id
    const openWorkCount = workItems.filter((workItem) =>
      workItem.goalId === goal.id &&
      (workItem.status === "ready" || workItem.status === "running" || workItem.status === "waiting")
    ).length
    const runningCount = runningRuns.filter((run) => run.goalId === goal.id).length
    const decisionCount = pendingDecisions.filter((decision) => decision.goalId === goal.id).length

    return (
      <Card key={goal.id} id={`goal-${goal.id}`} className="rounded-md">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editingGoalDraft.title}
                  onChange={(event) => setEditingGoalDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Goal title"
                />
                <Textarea
                  value={editingGoalDraft.notes}
                  onChange={(event) => setEditingGoalDraft((current) => ({ ...current, notes: event.target.value }))}
                  rows={3}
                  placeholder="Notes"
                />
              </div>
            ) : (
              <>
                <CardTitle className="truncate text-sm">{goal.title}</CardTitle>
                {goal.notes && (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{goal.notes}</p>
                )}
              </>
            )}
          </div>
          <Badge variant={statusBadgeVariant(goal.status)} className="shrink-0">
            {GOAL_STATUS_LABEL[goal.status]}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            <span>{openWorkCount} open work</span>
            <span>{runningCount} running</span>
            <span>{decisionCount} decisions</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {(["active", "inactive", "done"] as GoalStatus[]).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={goal.status === status ? "secondary" : "ghost"}
                  className="h-7 px-2 text-xs"
                  disabled={busyAction === `goal-status-${goal.id}-${status}`}
                  onClick={() => updateGoalStatus(goal, status)}
                >
                  {GOAL_STATUS_LABEL[status]}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              {isEditing ? (
                <>
                  <Button size="sm-icon" variant="ghost" title="Cancel" onClick={() => setEditingGoalId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm-icon" variant="ghost" title="Save goal" onClick={() => saveEditingGoal(goal)}>
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <Button size="sm-icon" variant="ghost" title="Edit goal" onClick={() => startEditingGoal(goal)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderWorkRow = (workItem: WorkItem) => {
    const goal = goalById.get(workItem.goalId)
    const runningRun = runningRuns.find((run) => run.workItemId === workItem.id)
    return (
      <div key={workItem.id} className="rounded-md border bg-card px-3 py-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium">{workItem.title}</span>
              <Badge variant={statusBadgeVariant(workItem.status)} className="h-5 px-1.5 text-[10px]">
                {WORK_STATUS_LABEL[workItem.status]}
              </Badge>
            </div>
            <div className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              {goal?.title ?? "Missing goal"} - Updated {formatTimestamp(workItem.updatedAt)}
            </div>
            {workItem.notes && (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{workItem.notes}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {(workItem.status === "ready" || workItem.status === "waiting") && (
              <Button size="sm-icon" variant="ghost" title="Start session" onClick={() => startWorkItem(workItem)}>
                <Play className="h-3.5 w-3.5" />
              </Button>
            )}
            {runningRun && (
              <Button size="sm-icon" variant="ghost" title="Stop session" onClick={() => killRun(runningRun)}>
                <Square className="h-3.5 w-3.5" />
              </Button>
            )}
            {workItem.status !== "ready" && workItem.status !== "running" && (
              <Button size="sm-icon" variant="ghost" title="Mark ready" onClick={() => updateWorkStatus(workItem, "ready")}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
            {workItem.status !== "waiting" && workItem.status !== "done" && workItem.status !== "discarded" && (
              <Button size="sm-icon" variant="ghost" title="Mark waiting" onClick={() => updateWorkStatus(workItem, "waiting")}>
                <PauseCircle className="h-3.5 w-3.5" />
              </Button>
            )}
            {workItem.status !== "done" && (
              <Button size="sm-icon" variant="ghost" title="Mark done" onClick={() => updateWorkStatus(workItem, "done")}>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {workItem.status !== "discarded" && (
              <Button size="sm-icon" variant="ghost" title="Discard" onClick={() => updateWorkStatus(workItem, "discarded")}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-panel h-full overflow-y-auto overflow-x-hidden px-6 py-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-normal">Goal Orchestrator</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{activeGoals.length} active goals</span>
            <span>{runningRuns.length} running sessions</span>
            <span>{pendingDecisions.length} pending decisions</span>
          </div>
        </div>
        <Button className="gap-1.5" size="sm" onClick={handleRunNow} disabled={isRunningOrchestrator}>
          {isRunningOrchestrator ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Run Now
        </Button>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0 space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <form onSubmit={handleCreateGoal} className="rounded-md border bg-card p-3">
              <div className="mb-2 flex items-center gap-2">
                <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-sm font-medium">New Goal</h2>
              </div>
              <div className="space-y-2">
                <Input
                  value={goalDraft.title}
                  onChange={(event) => setGoalDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Goal title"
                />
                <Textarea
                  value={goalDraft.notes}
                  onChange={(event) => setGoalDraft((current) => ({ ...current, notes: event.target.value }))}
                  rows={3}
                  placeholder="Notes"
                />
                <div className="flex justify-end">
                  <Button size="sm" className="gap-1.5" type="submit" disabled={busyAction === "create-goal"}>
                    <Plus className="h-3.5 w-3.5" />Create
                  </Button>
                </div>
              </div>
            </form>

            <form onSubmit={handleCreateWorkItem} className="rounded-md border bg-card p-3">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-sm font-medium">New Work Item</h2>
              </div>
              <div className="space-y-2">
                <Select
                  value={workDraft.goalId}
                  onValueChange={(goalId) => setWorkDraft((current) => ({ ...current, goalId }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGoals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={workDraft.title}
                  onChange={(event) => setWorkDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Work item title"
                />
                <Textarea
                  value={workDraft.notes}
                  onChange={(event) => setWorkDraft((current) => ({ ...current, notes: event.target.value }))}
                  rows={3}
                  placeholder="Notes"
                />
                <div className="flex justify-end">
                  <Button size="sm" className="gap-1.5" type="submit" disabled={busyAction === "create-work" || activeGoals.length === 0}>
                    <Plus className="h-3.5 w-3.5" />Create
                  </Button>
                </div>
              </div>
            </form>
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">Goals</h2>
              <Tabs value={goalFilter} onValueChange={(value) => setGoalFilter(value as GoalFilter)}>
                <TabsList className="h-8">
                  <TabsTrigger value="active" className="h-6 px-2 text-xs">Active</TabsTrigger>
                  <TabsTrigger value="all" className="h-6 px-2 text-xs">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              {visibleGoals.map(renderGoalCard)}
              {visibleGoals.length === 0 && (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No goals
                </div>
              )}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">Work Queue</h2>
            </div>
            <Tabs value={workTab} onValueChange={(value) => setWorkTab(value as WorkTab)}>
              <TabsList className="h-8 flex-wrap">
                {(["ready", "running", "waiting", "history"] as WorkTab[]).map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="h-6 px-2 text-xs capitalize">
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
              {(["ready", "running", "waiting", "history"] as WorkTab[]).map((tab) => {
                const rows = workForTab(tab)
                return (
                  <TabsContent key={tab} value={tab} className="space-y-2">
                    {rows.map(renderWorkRow)}
                    {rows.length === 0 && (
                      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No {tab} work
                      </div>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          </section>
        </main>

        <aside className="min-w-0 space-y-4">
          {snapshot?.settings && (
            <section className="rounded-md border bg-card p-3">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-sm font-medium">Limits</h2>
              </div>
              <form
                key={JSON.stringify(snapshot.settings)}
                className="grid grid-cols-2 gap-2"
                onSubmit={handleSaveSettings}
              >
                <div className="space-y-1">
                  <Label htmlFor="maxGlobalRunningSessions" className="text-xs">Global</Label>
                  <Input
                    id="maxGlobalRunningSessions"
                    name="maxGlobalRunningSessions"
                    type="number"
                    min={1}
                    defaultValue={snapshot.settings.maxGlobalRunningSessions}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="maxRunningSessionsPerGoal" className="text-xs">Per Goal</Label>
                  <Input
                    id="maxRunningSessionsPerGoal"
                    name="maxRunningSessionsPerGoal"
                    type="number"
                    min={1}
                    defaultValue={snapshot.settings.maxRunningSessionsPerGoal}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="maxSessionsPerWakeCycle" className="text-xs">Per Wake</Label>
                  <Input
                    id="maxSessionsPerWakeCycle"
                    name="maxSessionsPerWakeCycle"
                    type="number"
                    min={1}
                    defaultValue={snapshot.settings.maxSessionsPerWakeCycle}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="maxSessionRuntimeMinutes" className="text-xs">Minutes</Label>
                  <Input
                    id="maxSessionRuntimeMinutes"
                    name="maxSessionRuntimeMinutes"
                    type="number"
                    min={1}
                    defaultValue={snapshot.settings.maxSessionRuntimeMinutes ?? ""}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="maxIterationsPerSession" className="text-xs">Iterations</Label>
                  <Input
                    id="maxIterationsPerSession"
                    name="maxIterationsPerSession"
                    type="number"
                    min={1}
                    defaultValue={snapshot.settings.maxIterationsPerSession ?? ""}
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button size="sm" className="h-7 gap-1.5 px-2 text-xs" type="submit" disabled={busyAction === "save-settings"}>
                    <Save className="h-3.5 w-3.5" />Save
                  </Button>
                </div>
              </form>
            </section>
          )}

          <section className="rounded-md border bg-card p-3">
            <div className="mb-2 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-sm font-medium">Active Sessions</h2>
            </div>
            <div className="space-y-2">
              {runningRuns.map((run) => {
                const workItem = getWorkForRun(run, workById)
                const goal = goalById.get(run.goalId)
                return (
                  <div key={run.id} className="rounded-md border bg-background px-2.5 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{workItem?.title ?? run.sessionId}</div>
                        <div className="text-[11px] text-muted-foreground">{goal?.title ?? "Missing goal"}</div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="sm-icon" variant="ghost" title="Inspect session" onClick={() => inspectSession(run.sessionId)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm-icon" variant="ghost" title="Stop session" onClick={() => killRun(run)}>
                          <Square className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">Started {formatTimestamp(run.createdAt)}</div>
                  </div>
                )
              })}
              {runningRuns.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No running sessions
                </div>
              )}
            </div>
          </section>

          <section className="rounded-md border bg-card p-3">
            <div className="mb-2 flex items-center gap-2">
              <PauseCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-sm font-medium">Decision Queue</h2>
            </div>
            <div className="space-y-2">
              {pendingDecisions.map((decision) => {
                const goal = decision.goalId ? goalById.get(decision.goalId) : undefined
                const workItem = decision.workItemId ? workById.get(decision.workItemId) : undefined
                return (
                  <div key={decision.id} className="rounded-md border bg-background px-2.5 py-2">
                    <div className="text-sm font-medium leading-5">{decision.question}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {[goal?.title, workItem?.title].filter(Boolean).join(" / ") || "Unlinked"}
                    </div>
                    <Textarea
                      className="mt-2"
                      rows={3}
                      value={decisionAnswers[decision.id] ?? ""}
                      onChange={(event) => setDecisionAnswers((current) => ({ ...current, [decision.id]: event.target.value }))}
                      placeholder="Answer"
                    />
                    <div className="mt-2 flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => dismissDecision(decision)}>
                        Dismiss
                      </Button>
                      <Button size="sm" className="h-7 px-2 text-xs" onClick={() => answerDecision(decision)}>
                        Answer
                      </Button>
                    </div>
                  </div>
                )
              })}
              {pendingDecisions.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No pending decisions
                </div>
              )}
            </div>
          </section>

          <section className="rounded-md border bg-card p-3">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-sm font-medium">Activity</h2>
            </div>
            <div className="space-y-2">
              {activityNotes.slice(0, 20).map((note) => (
                <div key={note.id} className="rounded-md border bg-background px-2.5 py-2">
                  <div className={cn("text-xs leading-5", note.type.includes("failed") || note.type.includes("killed") ? "text-destructive" : "text-foreground")}>
                    {note.message}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{formatTimestamp(note.createdAt)}</div>
                </div>
              ))}
              {activityNotes.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No activity
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export { GoalOrchestratorPage as Component }
