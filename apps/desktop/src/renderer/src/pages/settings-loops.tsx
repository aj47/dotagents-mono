import { useEffect, useState } from "react"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Switch } from "@renderer/components/ui/switch"
import { Textarea } from "@renderer/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@renderer/components/ui/card"
import { Badge } from "@renderer/components/ui/badge"
import { Trash2, Plus, Edit2, Save, X, Play, Clock, FileText } from "lucide-react"
import { tipcClient, rendererHandlers } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { LoopConfig } from "@shared/types"
import { toast } from "sonner"
import {
  buildAgentSessionCandidateOptions,
  formatAgentSessionCandidateLabel,
  type AgentSessionCandidateOption,
} from "@dotagents/shared/agent-session-candidates"
import type { AgentSessionCandidatesResponse } from "@dotagents/shared/api-types"
import {
  buildRepeatTaskScheduleFromDraft,
  DEFAULT_REPEAT_TASK_SCHEDULE_TIMES,
  DEFAULT_REPEAT_TASK_WEEKDAYS,
  REPEAT_TASK_DAY_LABELS,
  describeLoopCadence,
  formatLoopIntervalDraft,
  getLoopScheduleDaysOfWeek,
  getLoopScheduleMode,
  getLoopScheduleTimes,
  parseLoopIntervalDraft,
  type RepeatTaskScheduleMode,
} from "@dotagents/shared/repeat-task-utils"

interface EditingLoop {
  id?: string
  name: string
  prompt: string
  intervalMinutesDraft: string
  enabled: boolean
  runOnStartup: boolean
  speakOnTrigger: boolean
  continueInSession: boolean
  lastSessionId?: string
  scheduleMode: RepeatTaskScheduleMode
  scheduleTimes: string[]       // HH:MM entries (used by daily + weekly)
  scheduleDaysOfWeek: number[]  // 0-6 Sun..Sat (used by weekly)
}

interface LoopRuntimeStatus {
  id: string
  isRunning: boolean
  nextRunAt?: number
  lastRunAt?: number
}

const emptyLoop: EditingLoop = {
  name: "",
  prompt: "",
  intervalMinutesDraft: "15",
  enabled: true,
  runOnStartup: false,
  speakOnTrigger: false,
  continueInSession: false,
  scheduleMode: "interval",
  scheduleTimes: [...DEFAULT_REPEAT_TASK_SCHEDULE_TIMES],
  scheduleDaysOfWeek: [...DEFAULT_REPEAT_TASK_WEEKDAYS],
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

// Sentinel used by the session picker to represent "no pinned session";
// Radix Select does not accept an empty string as an item value.
const AUTO_SESSION_VALUE = "__auto__"

function SessionPicker({
  value,
  onChange,
  candidates,
}: {
  value: string | undefined
  onChange: (value: string | undefined) => void
  candidates: AgentSessionCandidatesResponse | null | undefined
}) {
  const options = buildAgentSessionCandidateOptions(candidates, value)
  const selectValue = value ?? AUTO_SESSION_VALUE
  const getOptionLabel = (candidate: AgentSessionCandidateOption) =>
    candidate.group === "Selected"
      ? `${candidate.id} (no longer available)`
      : formatAgentSessionCandidateLabel(candidate)

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="lastSessionId">Continue from session</Label>
      <Select
        value={selectValue}
        onValueChange={(v) => onChange(v === AUTO_SESSION_VALUE ? undefined : v)}
      >
        <SelectTrigger id="lastSessionId" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={AUTO_SESSION_VALUE}>Auto — most recent run of this task</SelectItem>
          {options.map((candidate) => (
            <SelectItem key={`${candidate.group}:${candidate.id}`} value={candidate.id}>
              {getOptionLabel(candidate)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        When left on Auto, this task appends to whichever session it last created. Pick a specific session to resume it on the next run. If the selected session can no longer be revived (e.g. its conversation was deleted), this task falls back to a new session and tracks that one instead.
      </p>
    </div>
  )
}

export function SettingsLoops() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<EditingLoop | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const loopsQuery = useQuery({
    queryKey: ["loops"],
    queryFn: async () => tipcClient.getLoops() as Promise<LoopConfig[]>,
  })

  const loopStatusesQuery = useQuery({
    queryKey: ["loop-statuses"],
    queryFn: async () => tipcClient.getLoopStatuses() as Promise<LoopRuntimeStatus[]>,
    refetchInterval: 5000,
  })

  const sessionCandidatesQuery = useQuery({
    queryKey: ["loop-session-candidates"],
    queryFn: async () => tipcClient.listAgentSessionCandidates({ limit: 20 }),
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    return rendererHandlers.loopsFolderChanged.listen(() => {
      queryClient.invalidateQueries({ queryKey: ["loops"] })
      queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
    })
  }, [queryClient])

  const loops: LoopConfig[] = loopsQuery.data || []
  const orderedLoops = [...loops].sort(
    (a, b) => Number(b.enabled) - Number(a.enabled),
  )
  const statusByLoopId = new Map(
    (loopStatusesQuery.data || []).map((s) => [s.id, s] as const)
  )

  const handleCreate = () => {
    setIsCreating(true)
    setEditing({ ...emptyLoop })
  }

  const handleCancel = () => {
    setEditing(null)
    setIsCreating(false)
  }

  const handleEdit = (loop: LoopConfig) => {
    setIsCreating(false)
    const scheduleMode = getLoopScheduleMode(loop)
    const scheduleTimes = getLoopScheduleTimes(loop)
    const scheduleDaysOfWeek = getLoopScheduleDaysOfWeek(loop)
    setEditing({
      id: loop.id,
      name: loop.name,
      prompt: loop.prompt,
      intervalMinutesDraft: formatLoopIntervalDraft(loop.intervalMinutes),
      enabled: loop.enabled,
      runOnStartup: loop.runOnStartup ?? false,
      speakOnTrigger: loop.speakOnTrigger ?? false,
      continueInSession: loop.continueInSession ?? false,
      lastSessionId: loop.lastSessionId,
      scheduleMode,
      scheduleTimes,
      scheduleDaysOfWeek,
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this repeat task?")) return
    try {
      await tipcClient.deleteLoop({ loopId: id })
      queryClient.invalidateQueries({ queryKey: ["loops"] })
      queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
      toast.success("Task deleted")
    } catch {
      toast.error("Failed to delete task")
    }
  }

  const handleSave = async () => {
    if (!editing || !editing.name.trim() || !editing.prompt.trim()) {
      toast.error("Name and prompt are required")
      return
    }

    const parsedIntervalMinutes = parseLoopIntervalDraft(editing.intervalMinutesDraft)
    if (editing.scheduleMode === "interval" && parsedIntervalMinutes === null) {
      toast.error("Interval must be a positive whole number of minutes")
      return
    }

    const scheduleResult = buildRepeatTaskScheduleFromDraft({
      scheduleMode: editing.scheduleMode,
      scheduleTimes: editing.scheduleTimes,
      scheduleDaysOfWeek: editing.scheduleDaysOfWeek,
    })
    if (scheduleResult.ok === false) {
      const message = scheduleResult.error === "missing-schedule-times"
        ? "Add at least one time (HH:MM)"
        : "Select at least one day of the week"
      toast.error(message)
      return
    }

    const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || crypto.randomUUID()
    const existingIntervalMinutes = editing.id
      ? loops.find((loop) => loop.id === editing.id)?.intervalMinutes
      : undefined
    const savedIntervalMinutes = parsedIntervalMinutes ?? existingIntervalMinutes ?? 15
    const loopData: LoopConfig = {
      id: editing.id || slugify(editing.name),
      name: editing.name.trim(),
      prompt: editing.prompt.trim(),
      intervalMinutes: savedIntervalMinutes,
      enabled: editing.enabled,
      runOnStartup: editing.runOnStartup,
      speakOnTrigger: editing.speakOnTrigger,
      continueInSession: editing.continueInSession,
      runContinuously: scheduleResult.runContinuously,
      ...(editing.continueInSession && editing.lastSessionId
        ? { lastSessionId: editing.lastSessionId }
        : {}),
      ...(scheduleResult.schedule ? { schedule: scheduleResult.schedule } : {}),
    }

    try {
      const saveResult = await tipcClient.saveLoop({ loop: loopData })
      if (saveResult?.success === false) {
        toast.error("Failed to save task")
        return
      }
      queryClient.invalidateQueries({ queryKey: ["loops"] })
      setEditing(null)
      setIsCreating(false)
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

  const handleToggleEnabled = async (loop: LoopConfig) => {
    const updatedLoop = { ...loop, enabled: !loop.enabled }
    try {
      const saveResult = await tipcClient.saveLoop({ loop: updatedLoop })
      if (saveResult?.success === false) {
        toast.error("Failed to update task")
        return
      }
      queryClient.invalidateQueries({ queryKey: ["loops"] })

      if (updatedLoop.enabled) {
        await tipcClient.startLoop?.({ loopId: loop.id })
      } else {
        await tipcClient.stopLoop?.({ loopId: loop.id })
      }
      queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
      toast.success(updatedLoop.enabled ? "Task enabled" : "Task disabled")
    } catch {
      toast.error("Failed to update task")
    }
  }

  const handleRunNow = async (loop: LoopConfig) => {
    try {
      const result = await tipcClient.triggerLoop?.({ loopId: loop.id })
      if (result && !result.success) {
        toast.error(`Could not trigger "${loop.name}" right now`)
        return
      }
      toast.success(`Running "${loop.name}"...`)
    } catch {
      toast.error("Failed to trigger task")
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

  const renderLoopList = () => (
    <div className="space-y-1">
      {orderedLoops.map((loop) => {
        const runtime = statusByLoopId.get(loop.id)
        const isRunning = runtime?.isRunning ?? false
        const nextRunAt = runtime?.nextRunAt
        const lastRunAt = runtime?.lastRunAt ?? loop.lastRunAt
        return (
          <div
            key={loop.id}
            className={cn(
              "rounded-md border bg-card px-2.5 py-1.5 transition-colors hover:bg-muted/20",
              !loop.enabled && "opacity-60",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium leading-5">{loop.name}</span>
                  {isRunning ? (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                      Running
                    </Badge>
                  ) : !loop.enabled ? (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                      Disabled
                    </Badge>
                  ) : null}
                </div>
                <p className="line-clamp-1 text-[11px] leading-4 text-muted-foreground">
                  {loop.prompt}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Switch
                  aria-label={`${loop.enabled ? "Disable" : "Enable"} ${loop.name}`}
                  checked={loop.enabled}
                  onCheckedChange={() => handleToggleEnabled(loop)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 gap-1 px-1.5 text-xs"
                  onClick={() => handleRunNow(loop)}
                >
                  <Play className="h-3.5 w-3.5" />Run
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 gap-1 px-1.5 text-xs"
                  onClick={() => handleOpenTaskFile(loop)}
                >
                  <FileText className="h-3.5 w-3.5" />File
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Edit task"
                  onClick={() => handleEdit(loop)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Delete task"
                  onClick={() => handleDelete(loop.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {describeLoopCadence(loop)}
              </div>
              {loop.runOnStartup && <div>Runs on startup</div>}
              {loop.speakOnTrigger && <div>Speaks on trigger</div>}
              {loop.continueInSession && <div>Continues in same session</div>}
              {typeof nextRunAt === "number" && (
                <div>Next run: {formatLastRun(nextRunAt)}</div>
              )}
              <div>Last run: {formatLastRun(lastRunAt)}</div>
            </div>
          </div>
        )
      })}
      {loops.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No repeat tasks configured. Click &quot;Add Task&quot; to create one.
        </div>
      )}
    </div>
  )

  const renderEditForm = () => {
    if (!editing) return null
    return (
      <Card className="max-w-3xl">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-lg">{isCreating ? "Add Repeat Task" : "Edit Repeat Task"}</CardTitle>
          <CardDescription>Set the prompt, schedule, and startup behavior.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <div className="space-y-2">
            <Label>Schedule</Label>
            <div className="flex flex-wrap gap-1.5">
              {([
                { mode: "interval", label: "Interval" },
                { mode: "continuous", label: "Continuous" },
                { mode: "daily", label: "Daily" },
                { mode: "weekly", label: "Weekly" },
              ] as const).map(({ mode, label }) => (
                <Button
                  key={mode}
                  variant={editing.scheduleMode === mode ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setEditing({ ...editing, scheduleMode: mode })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          {editing.scheduleMode === "interval" && (
            <div className="space-y-2">
              <Label htmlFor="interval">Every</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="interval"
                  type="number"
                  min={1}
                  value={editing.intervalMinutesDraft}
                  onChange={(e) => setEditing({ ...editing, intervalMinutesDraft: e.target.value })}
                  className="h-8 w-20"
                />
                <span className="self-center text-xs text-muted-foreground">minutes</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {INTERVAL_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={parseLoopIntervalDraft(editing.intervalMinutesDraft) === preset.value ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setEditing({ ...editing, intervalMinutesDraft: String(preset.value) })}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {editing.scheduleMode === "continuous" && (
            <p className="text-xs text-muted-foreground">
              Starts the next run as soon as the previous run finishes. Only one run of this task executes at a time.
            </p>
          )}
          {editing.scheduleMode !== "interval" && editing.scheduleMode !== "continuous" && (
            <div className="space-y-2">
              <Label>Time(s)</Label>
              <div className="flex flex-wrap items-center gap-2">
                {editing.scheduleTimes.map((time, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const next = [...editing.scheduleTimes]
                        next[idx] = e.target.value
                        setEditing({ ...editing, scheduleTimes: next })
                      }}
                      className="h-8 w-28"
                    />
                    {editing.scheduleTimes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Remove time"
                        onClick={() => {
                          const next = editing.scheduleTimes.filter((_, i) => i !== idx)
                          setEditing({ ...editing, scheduleTimes: next })
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      scheduleTimes: [...editing.scheduleTimes, DEFAULT_REPEAT_TASK_SCHEDULE_TIMES[0]],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" />Add time
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Local time, 24-hour format.</p>
            </div>
          )}
          {editing.scheduleMode === "weekly" && (
            <div className="space-y-2">
              <Label>Days of week</Label>
              <div className="flex flex-wrap gap-1.5">
                {REPEAT_TASK_DAY_LABELS.map((label, dayIdx) => {
                  const active = editing.scheduleDaysOfWeek.includes(dayIdx)
                  return (
                    <Button
                      key={dayIdx}
                      variant={active ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        const next = active
                          ? editing.scheduleDaysOfWeek.filter((d) => d !== dayIdx)
                          : [...editing.scheduleDaysOfWeek, dayIdx].sort()
                        setEditing({ ...editing, scheduleDaysOfWeek: next })
                      }}
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
            <div className="flex items-center space-x-2">
              <Switch
                id="speakOnTrigger"
                checked={editing.speakOnTrigger}
                onCheckedChange={(v) => setEditing({ ...editing, speakOnTrigger: v })}
              />
              <Label htmlFor="speakOnTrigger">Speak on Trigger</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="continueInSession"
                checked={editing.continueInSession}
                onCheckedChange={(v) => setEditing({ ...editing, continueInSession: v })}
              />
              <Label htmlFor="continueInSession">Continue in Same Session</Label>
            </div>
          </div>
          {editing.continueInSession && (
            <SessionPicker
              value={editing.lastSessionId}
              onChange={(v) => setEditing({ ...editing, lastSessionId: v })}
              candidates={sessionCandidatesQuery.data}
            />
          )}
          <div className="flex justify-end gap-2 pt-3">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCancel}>
              <X className="h-4 w-4" />Cancel
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleSave}>
              <Save className="h-4 w-4" />Save
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="modern-panel h-full overflow-y-auto overflow-x-hidden px-6 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" className="gap-1.5" onClick={handleCreate}>
          <Plus className="h-3.5 w-3.5" />Add Task
        </Button>
      </div>
      {editing ? renderEditForm() : renderLoopList()}
    </div>
  )
}

export { SettingsLoops as Component }
