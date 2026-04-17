import { useEffect, useState } from "react"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Switch } from "@renderer/components/ui/switch"
import { Textarea } from "@renderer/components/ui/textarea"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@renderer/components/ui/card"
import { Badge } from "@renderer/components/ui/badge"
import { Trash2, Plus, Edit2, Save, X, Play, Clock, FileText } from "lucide-react"
import { tipcClient, rendererHandlers } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { LoopConfig, LoopSchedule, LoopTriggerConfig, LoopTriggerEvent } from "@shared/types"
import { toast } from "sonner"

type ScheduleMode = "interval" | "daily" | "weekly"

interface EditingLoop {
  id?: string
  name: string
  prompt: string
  intervalMinutesDraft: string
  enabled: boolean
  runOnStartup: boolean
  scheduleMode: ScheduleMode
  scheduleTimes: string[]       // HH:MM entries (used by daily + weekly)
  scheduleDaysOfWeek: number[]  // 0-6 Sun..Sat (used by weekly)
  triggers: LoopTriggerEvent[]  // event triggers (onSessionEnd, etc.)
  triggerToolName: string       // onToolCall: fire only when tool name matches (blank = any)
  /** Original triggerConfig fields not surfaced in the UI (profileId,
   *  minIntervalMs, maxRunsPerSession, maxTriggerDepth, excludeTriggered).
   *  Preserved so round-tripping through the form doesn't drop frontmatter
   *  config. `toolName` is ignored here — it is driven by triggerToolName. */
  triggerConfigExtras: Omit<LoopTriggerConfig, "toolName">
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const TRIGGER_EVENTS: { value: LoopTriggerEvent; label: string; description: string }[] = [
  { value: "onSessionEnd", label: "On session end", description: "After any agent conversation finishes" },
  { value: "onToolCall", label: "On tool call", description: "After each tool call completes" },
  { value: "onUserMessage", label: "On user message", description: "Each time the user submits a message" },
  { value: "onAppStart", label: "On app start", description: "Once when the desktop app starts" },
]

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
  scheduleMode: "interval",
  scheduleTimes: ["09:00"],
  scheduleDaysOfWeek: [1, 2, 3, 4, 5],
  triggers: [],
  triggerToolName: "",
  triggerConfigExtras: {},
}

const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/

function sanitizeScheduleTimes(times: string[]): string[] {
  const out: string[] = []
  for (const t of times) {
    const trimmed = t.trim()
    if (TIME_RE.test(trimmed) && !out.includes(trimmed)) out.push(trimmed)
  }
  return out.sort()
}

function describeSchedule(schedule: LoopSchedule): string {
  const times = schedule.times.join(", ")
  if (schedule.type === "daily") return `Daily at ${times}`
  const days = schedule.daysOfWeek.map((d) => DAY_LABELS[d] ?? String(d)).join(", ")
  return `${days} at ${times}`
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

function formatLoopIntervalDraft(minutes?: number): string {
  const normalizedMinutes = typeof minutes === "number" && Number.isFinite(minutes)
    ? Math.floor(minutes)
    : 0

  return normalizedMinutes >= 1 ? String(normalizedMinutes) : "1"
}

function parseLoopIntervalDraft(draft: string): number | null {
  const trimmedDraft = draft.trim()
  if (!/^[0-9]+$/.test(trimmedDraft)) return null

  const parsed = Number(trimmedDraft)
  if (!Number.isInteger(parsed) || parsed < 1) return null

  return parsed
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

  useEffect(() => {
    return rendererHandlers.loopsFolderChanged.listen(() => {
      queryClient.invalidateQueries({ queryKey: ["loops"] })
      queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
    })
  }, [queryClient])

  const loops: LoopConfig[] = loopsQuery.data || []
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
    const scheduleMode: ScheduleMode = loop.schedule?.type ?? "interval"
    const scheduleTimes = loop.schedule?.times.length ? [...loop.schedule.times] : ["09:00"]
    const scheduleDaysOfWeek = loop.schedule?.type === "weekly"
      ? [...loop.schedule.daysOfWeek]
      : [1, 2, 3, 4, 5]
    setEditing({
      id: loop.id,
      name: loop.name,
      prompt: loop.prompt,
      intervalMinutesDraft: formatLoopIntervalDraft(loop.intervalMinutes),
      enabled: loop.enabled,
      runOnStartup: loop.runOnStartup ?? false,
      scheduleMode,
      scheduleTimes,
      scheduleDaysOfWeek,
      triggers: loop.triggers ? [...loop.triggers] : [],
      triggerToolName: loop.triggerConfig?.toolName ?? "",
      // Snapshot everything except toolName (the form owns that field).
      triggerConfigExtras: (() => {
        if (!loop.triggerConfig) return {}
        const { toolName: _toolName, ...rest } = loop.triggerConfig
        void _toolName
        return rest
      })(),
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
    if (parsedIntervalMinutes === null) {
      toast.error("Interval must be a positive whole number of minutes")
      return
    }

    let schedule: LoopSchedule | undefined
    if (editing.scheduleMode !== "interval") {
      const times = sanitizeScheduleTimes(editing.scheduleTimes)
      if (times.length === 0) {
        toast.error("Add at least one time (HH:MM)")
        return
      }
      if (editing.scheduleMode === "weekly") {
        if (editing.scheduleDaysOfWeek.length === 0) {
          toast.error("Select at least one day of the week")
          return
        }
        schedule = { type: "weekly", times, daysOfWeek: [...editing.scheduleDaysOfWeek].sort() }
      } else {
        schedule = { type: "daily", times }
      }
    }

    const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || crypto.randomUUID()
    const trimmedToolName = editing.triggerToolName.trim()
    // Merge preserved non-UI fields with the UI-owned toolName. Leave
    // triggerConfig undefined only if nothing at all would be stored.
    const mergedTriggerConfig: LoopTriggerConfig = {
      ...editing.triggerConfigExtras,
      ...(editing.triggers.includes("onToolCall") && trimmedToolName
        ? { toolName: trimmedToolName }
        : {}),
    }
    const triggerConfig = Object.keys(mergedTriggerConfig).length > 0 ? mergedTriggerConfig : undefined
    const loopData: LoopConfig = {
      id: editing.id || slugify(editing.name),
      name: editing.name.trim(),
      prompt: editing.prompt.trim(),
      intervalMinutes: parsedIntervalMinutes,
      enabled: editing.enabled,
      runOnStartup: editing.runOnStartup,
      ...(schedule ? { schedule } : {}),
      ...(editing.triggers.length > 0 ? { triggers: editing.triggers } : {}),
      ...(triggerConfig ? { triggerConfig } : {}),
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
      {loops.map((loop) => {
        const runtime = statusByLoopId.get(loop.id)
        const isRunning = runtime?.isRunning ?? false
        const nextRunAt = runtime?.nextRunAt
        const lastRunAt = runtime?.lastRunAt ?? loop.lastRunAt
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
                  ) : !loop.enabled ? (
                    <Badge variant="outline">Disabled</Badge>
                  ) : null}
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
                  onClick={() => handleRunNow(loop)}
                >
                  <Play className="h-3.5 w-3.5" />Run
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2"
                  onClick={() => handleOpenTaskFile(loop)}
                >
                  <FileText className="h-3.5 w-3.5" />File
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Edit task"
                  onClick={() => handleEdit(loop)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Delete task"
                  onClick={() => handleDelete(loop.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {loop.schedule ? describeSchedule(loop.schedule) : `Every ${formatInterval(loop.intervalMinutes)}`}
              </div>
              {loop.runOnStartup && <div>Runs on startup</div>}
              {typeof nextRunAt === "number" && (
                <div>Next run: {formatLastRun(nextRunAt)}</div>
              )}
              <div>Last run: {formatLastRun(lastRunAt)}</div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Switch
                checked={loop.enabled}
                onCheckedChange={() => handleToggleEnabled(loop)}
              />
              <Label className="text-xs">{loop.enabled ? "Enabled" : "Disabled"}</Label>
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
          {editing.scheduleMode !== "interval" && (
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
                  onClick={() => setEditing({ ...editing, scheduleTimes: [...editing.scheduleTimes, "09:00"] })}
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
                {DAY_LABELS.map((label, dayIdx) => {
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
          <div className="space-y-2">
            <Label>Event triggers</Label>
            <p className="text-xs text-muted-foreground">
              Run this task in addition to its schedule when the selected events occur.
            </p>
            <div className="space-y-1.5">
              {TRIGGER_EVENTS.map((evt) => {
                const active = editing.triggers.includes(evt.value)
                return (
                  <div key={evt.value} className="flex items-start gap-2">
                    <Switch
                      id={`trigger-${evt.value}`}
                      checked={active}
                      onCheckedChange={(v) => {
                        const next = v
                          ? [...editing.triggers, evt.value]
                          : editing.triggers.filter((t) => t !== evt.value)
                        setEditing({ ...editing, triggers: next })
                      }}
                    />
                    <div className="min-w-0">
                      <Label htmlFor={`trigger-${evt.value}`} className="text-xs">
                        {evt.label}
                      </Label>
                      <p className="text-[11px] text-muted-foreground">{evt.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            {editing.triggers.includes("onToolCall") && (
              <div className="space-y-1 pt-1">
                <Label htmlFor="triggerToolName" className="text-xs">
                  Only fire for tool (optional)
                </Label>
                <Input
                  id="triggerToolName"
                  value={editing.triggerToolName}
                  onChange={(e) => setEditing({ ...editing, triggerToolName: e.target.value })}
                  placeholder="e.g. web_search (blank = any tool)"
                />
              </div>
            )}
          </div>
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
          </div>
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
