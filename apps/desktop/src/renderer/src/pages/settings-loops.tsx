import { useState } from "react"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Switch } from "@renderer/components/ui/switch"
import { Textarea } from "@renderer/components/ui/textarea"
import { buildUniqueLoopId } from "./settings-loops.ids"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@renderer/components/ui/card"
import { Badge } from "@renderer/components/ui/badge"
import { Trash2, Plus, Edit2, Save, X, Play, Clock, FileText, AlertTriangle, Loader2 } from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { LoopConfig } from "@shared/types"
import { toast } from "sonner"

interface EditingLoop {
  id?: string
  name: string
  prompt: string
  intervalMinutes: number
  enabled: boolean
  runOnStartup: boolean
}

interface LoopRuntimeStatus {
  id: string
  isRunning: boolean
  nextRunAt?: number
  lastRunAt?: number
}

type LoopPendingAction =
  | { kind: "run" }
  | { kind: "toggle"; targetEnabled: boolean }

type LoopActionFeedback =
  | { kind: "run"; tone: "error"; message: string }
  | { kind: "toggle"; tone: "warning" | "error"; targetEnabled: boolean; message: string }

const emptyLoop: EditingLoop = {
  name: "",
  prompt: "",
  intervalMinutes: 15,
  enabled: true,
  runOnStartup: false,
}

const INTERVAL_PRESETS = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "6 hours", value: 360 },
  { label: "24 hours", value: 1440 },
]

function formatLastRun(timestamp?: number): string {
  if (!timestamp) return "Never"
  const date = new Date(timestamp)
  return date.toLocaleString()
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) return `${hours}h`
    return `${hours}h ${remainingMinutes}m`
  }
  const days = Math.floor(minutes / 1440)
  const remainingMinutes = minutes % 1440
  if (remainingMinutes === 0) return `${days}d`
  const hours = Math.floor(remainingMinutes / 60)
  const mins = remainingMinutes % 60
  if (hours === 0) return `${days}d ${mins}m`
  if (mins === 0) return `${days}d ${hours}h`
  return `${days}d ${hours}h ${mins}m`
}

function getLoopQueryErrorMessage(error: unknown): string {
  const message = error instanceof Error
    ? error.message.trim()
    : typeof error === "string"
      ? error.trim()
      : ""

  if (!message) {
    return "Repeat tasks could not be loaded right now."
  }

  return /[.!?]$/.test(message) ? message : `${message}.`
}

function getLoopMutationErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error
    ? error.message.trim()
    : typeof error === "string"
      ? error.trim()
      : ""

  if (!message) {
    return fallback
  }

  return /[.!?]$/.test(message) ? message : `${message}.`
}

function cloneEditingLoop(loop: EditingLoop): EditingLoop {
  return { ...loop }
}

function toEditingLoop(loop: LoopConfig): EditingLoop {
  return {
    id: loop.id,
    name: loop.name,
    prompt: loop.prompt,
    intervalMinutes: loop.intervalMinutes,
    enabled: loop.enabled,
    runOnStartup: loop.runOnStartup ?? false,
  }
}

function hasLoopDraftChanges(editing: EditingLoop | null, baseline: EditingLoop | null): boolean {
  if (!editing || !baseline) return false

  return editing.name !== baseline.name
    || editing.prompt !== baseline.prompt
    || editing.intervalMinutes !== baseline.intervalMinutes
    || editing.enabled !== baseline.enabled
    || editing.runOnStartup !== baseline.runOnStartup
}

export function SettingsLoops() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<EditingLoop | null>(null)
  const [editingBaseline, setEditingBaseline] = useState<EditingLoop | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [deleteErrorById, setDeleteErrorById] = useState<Record<string, string>>({})
  const [pendingActionById, setPendingActionById] = useState<Record<string, LoopPendingAction>>({})
  const [actionFeedbackById, setActionFeedbackById] = useState<Record<string, LoopActionFeedback>>({})

  const loopsQuery = useQuery({
    queryKey: ["loops"],
    queryFn: async () => tipcClient.getLoops() as Promise<LoopConfig[]>,
  })

  const loopStatusesQuery = useQuery({
    queryKey: ["loop-statuses"],
    queryFn: async () => tipcClient.getLoopStatuses() as Promise<LoopRuntimeStatus[]>,
    refetchInterval: 5000,
  })

  const loops: LoopConfig[] = loopsQuery.data || []
  const statusByLoopId = new Map(
    (loopStatusesQuery.data || []).map((s) => [s.id, s] as const)
  )
  const isLoadingLoops = loopsQuery.isLoading && !loopsQuery.data
  const hasLoopLoadError = loopsQuery.isError && !loopsQuery.data
  const hasLoopStatusLoadError = loopStatusesQuery.isError && loops.length > 0
  const hasCachedLoopStatuses = Array.isArray(loopStatusesQuery.data) && loopStatusesQuery.data.length > 0

  const clearDeleteError = (loopId: string) => {
    setDeleteErrorById((prev) => {
      if (!(loopId in prev)) return prev

      const next = { ...prev }
      delete next[loopId]
      return next
    })
  }

  const clearPendingAction = (loopId: string) => {
    setPendingActionById((prev) => {
      if (!(loopId in prev)) return prev

      const next = { ...prev }
      delete next[loopId]
      return next
    })
  }

  const clearActionFeedback = (loopId: string) => {
    setActionFeedbackById((prev) => {
      if (!(loopId in prev)) return prev

      const next = { ...prev }
      delete next[loopId]
      return next
    })
  }

  const setPendingAction = (loopId: string, action: LoopPendingAction) => {
    setPendingActionById((prev) => ({
      ...prev,
      [loopId]: action,
    }))
  }

  const closeEditor = () => {
    setEditing(null)
    setEditingBaseline(null)
    setIsCreating(false)
  }

  const isEditingDirty = hasLoopDraftChanges(editing, editingBaseline)
  const editingLabel = editingBaseline?.name.trim() || editing?.name.trim() || "this task"

  const handleCreate = () => {
    if (isEditingDirty && !confirm("Start a new task and replace your current draft? Your unsaved changes will be overwritten.")) {
      return
    }

    setDeleteConfirmId(null)
    setDeleteErrorById({})
    setIsCreating(true)
    const nextEditing = cloneEditingLoop(emptyLoop)
    setEditing(nextEditing)
    setEditingBaseline(cloneEditingLoop(nextEditing))
  }

  const handleCancel = () => {
    if (isEditingDirty && !confirm(isCreating
      ? "Discard this new task draft? Your unsaved changes will be lost."
      : `Discard your changes to \"${editingLabel}\"? Your unsaved edits will be lost.`)) {
      return
    }

    setDeleteConfirmId(null)
    setDeleteErrorById({})
    closeEditor()
  }

  const handleEdit = (loop: LoopConfig) => {
    if (isEditingDirty && !confirm(`Discard your current draft and edit \"${loop.name}\" instead? Your unsaved changes will be overwritten.`)) {
      return
    }

    setDeleteConfirmId(null)
    setDeleteErrorById({})
    setIsCreating(false)
    const nextEditing = toEditingLoop(loop)
    setEditing(nextEditing)
    setEditingBaseline(cloneEditingLoop(nextEditing))
  }

  const handleDelete = async (loop: LoopConfig) => {
    setPendingDeleteId(loop.id)
    clearDeleteError(loop.id)

    try {
      const result = await tipcClient.deleteLoop({ loopId: loop.id })

      if (!result?.success) {
        setDeleteConfirmId(loop.id)
        setDeleteErrorById((prev) => ({
          ...prev,
          [loop.id]: `Couldn't delete "${loop.name}" right now. The task is still shown below until deletion succeeds.`,
        }))
        return
      }

      queryClient.invalidateQueries({ queryKey: ["loops"] })
      queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
      setDeleteConfirmId((current) => (current === loop.id ? null : current))
      clearDeleteError(loop.id)
      toast.success("Task deleted")
    } catch (error) {
      setDeleteConfirmId(loop.id)
      setDeleteErrorById((prev) => ({
        ...prev,
        [loop.id]: getLoopMutationErrorMessage(
          error,
          `Couldn't delete "${loop.name}" right now. The task is still shown below until deletion succeeds.`,
        ),
      }))
    } finally {
      setPendingDeleteId((current) => (current === loop.id ? null : current))
    }
  }

  const handleSave = async () => {
    if (!editing || !editing.name.trim() || !editing.prompt.trim()) {
      toast.error("Name and prompt are required")
      return
    }

    const sanitizedIntervalMinutes = Number.isFinite(editing.intervalMinutes) && editing.intervalMinutes >= 1
      ? Math.floor(editing.intervalMinutes)
      : 1
    const loopData: LoopConfig = {
      id: editing.id || buildUniqueLoopId(editing.name, loops.map((loop) => loop.id)),
      name: editing.name.trim(),
      prompt: editing.prompt.trim(),
      intervalMinutes: sanitizedIntervalMinutes,
      enabled: editing.enabled,
      runOnStartup: editing.runOnStartup,
    }

    try {
      await tipcClient.saveLoop({ loop: loopData })
      queryClient.invalidateQueries({ queryKey: ["loops"] })
      closeEditor()
      toast.success(isCreating ? "Task created" : "Task updated")

      // Start/stop loop based on enabled state
      if (loopData.enabled) {
        await tipcClient.startLoop?.({ loopId: loopData.id })
      } else {
        await tipcClient.stopLoop?.({ loopId: loopData.id })
      }
      queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
    } catch {
      toast.error("Failed to save task")
    }
  }

  const handleSetEnabled = async (loop: LoopConfig, targetEnabled: boolean) => {
    const updatedLoop = { ...loop, enabled: targetEnabled }
    setDeleteConfirmId((current) => (current === loop.id ? null : current))
    clearDeleteError(loop.id)
    clearActionFeedback(loop.id)
    setPendingAction(loop.id, { kind: "toggle", targetEnabled })

    try {
      await tipcClient.saveLoop({ loop: updatedLoop })
      await queryClient.invalidateQueries({ queryKey: ["loops"] })

      if (targetEnabled) {
        const startResult = await tipcClient.startLoop?.({ loopId: loop.id })

        if (startResult && !startResult.success) {
          setActionFeedbackById((prev) => ({
            ...prev,
            [loop.id]: {
              kind: "toggle",
              tone: "warning",
              targetEnabled,
              message: `\"${loop.name}\" was saved as enabled, but its schedule could not start yet. Retry enabling to start it again.`,
            },
          }))
        } else {
          toast.success("Task enabled")
        }
      } else {
        await tipcClient.stopLoop?.({ loopId: loop.id })
        toast.success("Task disabled")
      }

      await queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
    } catch (error) {
      setActionFeedbackById((prev) => ({
        ...prev,
        [loop.id]: {
          kind: "toggle",
          tone: "error",
          targetEnabled,
          message: getLoopMutationErrorMessage(
            error,
            targetEnabled
              ? `Couldn't enable \"${loop.name}\" right now. The saved task is still shown below.`
              : `Couldn't disable \"${loop.name}\" right now. The saved task is still shown below.`,
          ),
        },
      }))
    } finally {
      clearPendingAction(loop.id)
    }
  }

  const handleToggleEnabled = async (loop: LoopConfig) => {
    await handleSetEnabled(loop, !loop.enabled)
  }

  const handleRunNow = async (loop: LoopConfig) => {
    setDeleteConfirmId((current) => (current === loop.id ? null : current))
    clearDeleteError(loop.id)
    clearActionFeedback(loop.id)
    setPendingAction(loop.id, { kind: "run" })

    try {
      const result = await tipcClient.triggerLoop?.({ loopId: loop.id })

      if (result && !result.success) {
        setActionFeedbackById((prev) => ({
          ...prev,
          [loop.id]: {
            kind: "run",
            tone: "error",
            message: `Couldn't run \"${loop.name}\" right now. It may already be running, or the agent may be temporarily unavailable.`,
          },
        }))
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loops"] }),
        queryClient.invalidateQueries({ queryKey: ["loop-statuses"] }),
      ])
    } catch (error) {
      setActionFeedbackById((prev) => ({
        ...prev,
        [loop.id]: {
          kind: "run",
          tone: "error",
          message: getLoopMutationErrorMessage(
            error,
            `Couldn't run \"${loop.name}\" right now. It may already be running, or the agent may be temporarily unavailable.`,
          ),
        },
      }))
    } finally {
      clearPendingAction(loop.id)
    }
  }

  const handleOpenTaskFile = async (loop: LoopConfig) => {
    try {
      const result = await tipcClient.openLoopTaskFile({ loopId: loop.id })
      if (!result?.success) {
        toast.error(result?.error || "Failed to reveal task file")
      }
    } catch {
      toast.error("Failed to reveal task file")
    }
  }

  const renderLoopList = () => {
    if (isLoadingLoops) {
      return (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Loading repeat tasks...</p>
            <p className="text-xs text-muted-foreground">
              Checking your saved schedules and their latest run details.
            </p>
          </div>
        </div>
      )
    }

    if (hasLoopLoadError) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Couldn&apos;t load repeat tasks</p>
                <p className="text-xs text-muted-foreground">
                  This page is still waiting for your saved schedules, so it is not showing the empty-state placeholder yet.
                </p>
                <p className="break-words text-xs text-destructive">
                  {getLoopQueryErrorMessage(loopsQuery.error)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  void loopsQuery.refetch()
                }}
              >
                Retry loading
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {hasLoopStatusLoadError && (
          <div
            role="alert"
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Live repeat-task status is temporarily unavailable</p>
                  <p className="text-xs text-muted-foreground">
                    {hasCachedLoopStatuses
                      ? "Saved tasks are still shown below, but the last loaded Running / Next run details may be stale until status refresh succeeds."
                      : "Saved tasks are still shown below, but Running / Next run details are unavailable until status refresh succeeds."}
                  </p>
                  <p className="break-words text-xs text-amber-700 dark:text-amber-300">
                    {getLoopQueryErrorMessage(loopStatusesQuery.error)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    void loopStatusesQuery.refetch()
                  }}
                >
                  Retry status
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-1">
          {loops.map((loop) => {
            const runtime = statusByLoopId.get(loop.id)
            const isRunning = runtime?.isRunning ?? false
            const nextRunAt = runtime?.nextRunAt
            const lastRunAt = runtime?.lastRunAt ?? loop.lastRunAt
            const isDeleting = pendingDeleteId === loop.id
            const pendingAction = pendingActionById[loop.id]
            const actionFeedback = actionFeedbackById[loop.id]
            const deleteErrorMessage = deleteErrorById[loop.id]
            const isDeleteConfirming = deleteConfirmId === loop.id
            const isRowActionPending = Boolean(pendingAction)
            const isBusy = isDeleting || isRowActionPending
            const toggleStatusLabel = pendingAction?.kind === "toggle"
              ? pendingAction.targetEnabled
                ? "Enabling..."
                : "Disabling..."
              : loop.enabled
                ? "Enabled"
                : "Disabled"
            return (
              <div
                key={loop.id}
                className={cn(
                  "rounded-lg border bg-card px-3 py-2",
                  !loop.enabled && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{loop.name}</span>
                      {isRunning ? (
                        <Badge variant="secondary">Running</Badge>
                      ) : loop.enabled ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="outline">Disabled</Badge>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {loop.prompt}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 px-2"
                      disabled={isBusy}
                      onClick={() => handleRunNow(loop)}
                    >
                      {pendingAction?.kind === "run" ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />Running...
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />Run
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 px-2"
                      disabled={isBusy}
                      onClick={() => handleOpenTaskFile(loop)}
                    >
                      <FileText className="h-3.5 w-3.5" />File
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={isBusy}
                      title="Edit task"
                      onClick={() => handleEdit(loop)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={isBusy}
                      title={isDeleting ? "Deleting task" : isRowActionPending ? "Task action in progress" : "Delete task"}
                      onClick={() => {
                        setDeleteConfirmId(loop.id)
                        clearDeleteError(loop.id)
                        clearActionFeedback(loop.id)
                      }}
                    >
                      {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Every {formatInterval(loop.intervalMinutes)}
                  </div>
                  {loop.runOnStartup && <Badge variant="secondary">Run on startup</Badge>}
                  {typeof nextRunAt === "number" && (
                    <div>Next run: {formatLastRun(nextRunAt)}</div>
                  )}
                  <div>Last run: {formatLastRun(lastRunAt)}</div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <Switch
                    checked={loop.enabled}
                    disabled={isBusy}
                    onCheckedChange={() => handleToggleEnabled(loop)}
                  />
                  <Label className="text-xs">{toggleStatusLabel}</Label>
                </div>

                {(pendingAction || actionFeedback) && (
                  <div
                    className={cn(
                      "mt-3 rounded-md border px-3 py-3",
                      pendingAction && "border-border/60 bg-muted/30",
                      actionFeedback?.tone === "warning" && "border-amber-500/30 bg-amber-500/10",
                      actionFeedback?.tone === "error" && "border-destructive/30 bg-destructive/5",
                    )}
                    role={actionFeedback ? "alert" : "status"}
                  >
                    <div className="flex items-start gap-2">
                      {pendingAction ? (
                        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                      ) : (
                        <AlertTriangle
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            actionFeedback?.tone === "warning"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-destructive",
                          )}
                        />
                      )}
                      <div className="min-w-0 flex-1 space-y-2">
                        <p
                          className={cn(
                            "break-words text-xs",
                            pendingAction && "text-muted-foreground",
                            actionFeedback?.tone === "warning" && "text-amber-700 dark:text-amber-300",
                            actionFeedback?.tone === "error" && "text-destructive",
                          )}
                        >
                          {pendingAction
                            ? pendingAction.kind === "run"
                              ? `Running \"${loop.name}\" now. Other actions stay disabled until this request finishes.`
                              : pendingAction.targetEnabled
                                ? `Enabling \"${loop.name}\" and starting its schedule...`
                                : `Disabling \"${loop.name}\" and clearing its active schedule...`
                            : actionFeedback?.message}
                        </p>
                        {actionFeedback && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (actionFeedback.kind === "run") {
                                  void handleRunNow(loop)
                                  return
                                }

                                void handleSetEnabled(loop, actionFeedback.targetEnabled)
                              }}
                            >
                              {actionFeedback.kind === "run"
                                ? "Retry run"
                                : actionFeedback.targetEnabled
                                  ? "Retry enable"
                                  : "Retry disable"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => clearActionFeedback(loop.id)}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(isDeleteConfirming || deleteErrorMessage) && (
                  <div
                    className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3"
                    role={deleteErrorMessage ? "alert" : undefined}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Delete &quot;{loop.name}&quot;?</p>
                          <p className="text-xs text-muted-foreground">
                            This removes the saved schedule and its task file. The task is still shown below until deletion succeeds.
                          </p>
                          {deleteErrorMessage && (
                            <p className="break-words text-xs text-destructive">{deleteErrorMessage}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => {
                              setDeleteConfirmId((current) => (current === loop.id ? null : current))
                              clearDeleteError(loop.id)
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleDelete(loop)}
                          >
                            {isDeleting && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                            {isDeleting ? "Deleting..." : deleteErrorMessage ? "Retry delete" : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {loops.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No repeat tasks configured. Click &quot;Add Task&quot; to create one.
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderEditForm = () => {
    if (!editing) return null
    return (
      <Card className="max-w-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{isCreating ? "Add Repeat Task" : "Edit Repeat Task"}</CardTitle>
          <CardDescription>
            Configure a task to run automatically at regular intervals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditingDirty && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              You have unsaved changes. Save before leaving or replacing this task draft.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="e.g., Daily Summary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={editing.prompt}
              onChange={(e) => setEditing({ ...editing, prompt: e.target.value })}
              placeholder="Enter the prompt to send to the agent..."
              rows={4}
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interval">Interval</Label>
              <div className="flex gap-2">
                <Input
                  id="interval"
                  type="number"
                  min={1}
                  value={editing.intervalMinutes}
                  onChange={(e) => setEditing({ ...editing, intervalMinutes: parseInt(e.target.value) || 15 })}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground self-center">minutes</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {INTERVAL_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={editing.intervalMinutes === preset.value ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setEditing({ ...editing, intervalMinutes: preset.value })}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={editing.enabled}
                onCheckedChange={(v) => setEditing({ ...editing, enabled: v })}
              />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="runOnStartup"
                checked={editing.runOnStartup}
                onCheckedChange={(v) => setEditing({ ...editing, runOnStartup: v })}
              />
              <Label htmlFor="runOnStartup">Run on Startup</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" className="gap-2" onClick={handleCancel}>
              <X className="h-4 w-4" />Cancel
            </Button>
            <Button className="gap-2" onClick={handleSave}>
              <Save className="h-4 w-4" />Save
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b bg-background px-6 pb-2 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Repeat Tasks</h1>
            <p className="text-xs text-muted-foreground">
              Configure tasks to run automatically at regular intervals
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5" />Add Task
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
        {editing ? renderEditForm() : renderLoopList()}
      </div>
    </div>
  )
}

export { SettingsLoops as Component }
