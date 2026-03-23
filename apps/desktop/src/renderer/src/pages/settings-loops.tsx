import { useState } from "react"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Switch } from "@renderer/components/ui/switch"
import { Textarea } from "@renderer/components/ui/textarea"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@renderer/components/ui/card"
import { Badge } from "@renderer/components/ui/badge"
import { Trash2, Plus, Edit2, Save, X, Play, Clock, FileText } from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { LoopConfig } from "@shared/types"
import { toast } from "sonner"
import {
  formatFailureSummary,
  formatLoopIntervalDraft,
  getLoopEnabledLabel,
  getLoopFailureHeadline,
  parseLoopIntervalDraft,
} from "./settings-loops.helpers"

interface EditingLoop {
  id?: string
  name: string
  prompt: string
  intervalMinutesDraft: string
  enabled: boolean
  runOnStartup: boolean
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
    setEditing({
      id: loop.id,
      name: loop.name,
      prompt: loop.prompt,
      intervalMinutesDraft: formatLoopIntervalDraft(loop.intervalMinutes),
      enabled: loop.enabled,
      runOnStartup: loop.runOnStartup ?? false,
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

    const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || crypto.randomUUID()
    const loopData: LoopConfig = {
      id: editing.id || slugify(editing.name),
      name: editing.name.trim(),
      prompt: editing.prompt.trim(),
      intervalMinutes: parsedIntervalMinutes,
      enabled: editing.enabled,
      runOnStartup: editing.runOnStartup,
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
      queryClient.invalidateQueries({ queryKey: ["loops"] })
      queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
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
                  ) : loop.autoPausedAt ? (
                    <Badge variant="destructive">Auto-paused</Badge>
                  ) : !loop.enabled ? (
                    <Badge variant="outline">Disabled</Badge>
                  ) : null}
                  {(loop.consecutiveFailures ?? 0) > 0 && !isRunning ? (
                    <Badge variant="outline">
                      {loop.consecutiveFailures} failure{loop.consecutiveFailures === 1 ? "" : "s"}
                    </Badge>
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
                Every {formatInterval(loop.intervalMinutes)}
              </div>
              {loop.runOnStartup && <div>Runs on startup</div>}
              {typeof nextRunAt === "number" && (
                <div>Next run: {formatLastRun(nextRunAt)}</div>
              )}
              <div>Last run: {formatLastRun(lastRunAt)}</div>
              {loop.lastFailureAt ? (
                <div>Last failure: {formatLastRun(loop.lastFailureAt)}</div>
              ) : null}
            </div>

            {loop.lastFailureMessage ? (
              <div className="mt-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs">
                <p className="font-medium text-destructive">
                  {getLoopFailureHeadline(loop)}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {formatFailureSummary(loop.lastFailureMessage)}
                </p>
              </div>
            ) : null}

            <div className="mt-2 flex items-center gap-2">
              <Switch
                checked={loop.enabled}
                onCheckedChange={() => handleToggleEnabled(loop)}
              />
              <Label className="text-xs">{getLoopEnabledLabel(loop)}</Label>
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
          <CardDescription>Set the prompt, interval, and startup behavior.</CardDescription>
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
            <Label htmlFor="interval">Interval</Label>
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
