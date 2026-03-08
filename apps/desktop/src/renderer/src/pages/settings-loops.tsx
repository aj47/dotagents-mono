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
      intervalMinutes: loop.intervalMinutes,
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

    const sanitizedIntervalMinutes = Number.isFinite(editing.intervalMinutes) && editing.intervalMinutes >= 1
      ? Math.floor(editing.intervalMinutes)
      : 1
    const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || crypto.randomUUID()
    const loopData: LoopConfig = {
      id: editing.id || slugify(editing.name),
      name: editing.name.trim(),
      prompt: editing.prompt.trim(),
      intervalMinutes: sanitizedIntervalMinutes,
      enabled: editing.enabled,
      runOnStartup: editing.runOnStartup,
    }

    try {
      await tipcClient.saveLoop({ loop: loopData })
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
      await tipcClient.saveLoop({ loop: updatedLoop })
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
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-[min(100%,16rem)] flex-[1_1_16rem]">
                <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
                  <span className="min-w-[min(100%,12rem)] flex-[1_1_12rem] break-words font-medium leading-snug [overflow-wrap:anywhere]">
                    {loop.name}
                  </span>
                  {isRunning ? (
                    <Badge variant="secondary" className="shrink-0">Running</Badge>
                  ) : loop.enabled ? (
                    <Badge variant="default" className="shrink-0">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0">Disabled</Badge>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground break-words [overflow-wrap:anywhere]">
                  {loop.prompt}
                </p>
              </div>
              <div className="ml-auto flex max-w-full flex-[0_1_auto] flex-wrap items-center justify-end gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 gap-1.5 px-2"
                  onClick={() => handleRunNow(loop)}
                >
                  <Play className="h-3.5 w-3.5" />Run
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 gap-1.5 px-2"
                  onClick={() => handleOpenTaskFile(loop)}
                >
                  <FileText className="h-3.5 w-3.5" />File
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  title="Edit task"
                  onClick={() => handleEdit(loop)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  title="Delete task"
                  onClick={() => handleDelete(loop.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Every {formatInterval(loop.intervalMinutes)}
              </div>
              {loop.runOnStartup && <Badge variant="secondary" className="shrink-0">Run on startup</Badge>}
              {typeof nextRunAt === "number" && (
                <div className="break-words [overflow-wrap:anywhere]">Next run: {formatLastRun(nextRunAt)}</div>
              )}
              <div className="break-words [overflow-wrap:anywhere]">Last run: {formatLastRun(lastRunAt)}</div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
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
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{isCreating ? "Add Repeat Task" : "Edit Repeat Task"}</CardTitle>
          <CardDescription>
            Configure a task to run automatically at regular intervals
          </CardDescription>
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
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
            <div className="flex min-w-[min(100%,12rem)] flex-[1_1_12rem] items-center space-x-2">
              <Switch
                id="enabled"
                checked={editing.enabled}
                onCheckedChange={(v) => setEditing({ ...editing, enabled: v })}
              />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
            <div className="flex min-w-[min(100%,12rem)] flex-[1_1_12rem] items-center space-x-2">
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
