import { useState } from "react"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import { Switch } from "@renderer/components/ui/switch"
import { Textarea } from "@renderer/components/ui/textarea"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card"
import { Badge } from "@renderer/components/ui/badge"
import {
  Trash2,
  Plus,
  Edit2,
  Save,
  X,
  Play,
  Clock,
  FileText,
} from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { AgentProfile, LoopConfig } from "@shared/types"
import { toast } from "sonner"

interface EditingLoop {
  id?: string
  name: string
  prompt: string
  intervalMinutesDraft: string
  enabled: boolean
  profileId: string
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
  profileId: "",
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

function formatLoopIntervalDraft(minutes?: number): string {
  const normalizedMinutes =
    typeof minutes === "number" && Number.isFinite(minutes)
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

const NO_DEDICATED_AGENT_VALUE = "none"

function encodeProfileSelectValue(profileId?: string): string {
  return profileId ? `profile:${profileId}` : NO_DEDICATED_AGENT_VALUE
}

function decodeProfileSelectValue(value: string): string {
  return value === NO_DEDICATED_AGENT_VALUE
    ? ""
    : value.startsWith("profile:")
      ? value.slice("profile:".length)
      : value
}

function getAgentProfileLabel(
  profile?: Pick<AgentProfile, "id" | "name" | "displayName">,
  fallbackId?: string,
): string {
  return profile?.displayName || profile?.name || fallbackId || ""
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
    queryFn: async () =>
      tipcClient.getLoopStatuses() as Promise<LoopRuntimeStatus[]>,
    refetchInterval: 5000,
  })

  const agentProfilesQuery = useQuery({
    queryKey: ["loop-agent-profiles"],
    queryFn: async () =>
      tipcClient.getAgentProfiles() as Promise<AgentProfile[]>,
  })

  const loops: LoopConfig[] = loopsQuery.data || []
  const allAgentProfiles = agentProfilesQuery.data || []
  const availableAgentProfiles = allAgentProfiles.filter(
    (profile) => profile.enabled,
  )
  const profileById = new Map(
    allAgentProfiles.map((profile) => [profile.id, profile] as const),
  )
  const statusByLoopId = new Map(
    (loopStatusesQuery.data || []).map((s) => [s.id, s] as const),
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
      profileId: loop.profileId ?? "",
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

    const parsedIntervalMinutes = parseLoopIntervalDraft(
      editing.intervalMinutesDraft,
    )
    if (parsedIntervalMinutes === null) {
      toast.error("Interval must be a positive whole number of minutes")
      return
    }

    const slugify = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 64) || crypto.randomUUID()
    const loopData: LoopConfig = {
      id: editing.id || slugify(editing.name),
      name: editing.name.trim(),
      prompt: editing.prompt.trim(),
      intervalMinutes: parsedIntervalMinutes,
      enabled: editing.enabled,
      profileId: editing.profileId.trim() || undefined,
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
        const assignedProfile = loop.profileId
          ? profileById.get(loop.profileId)
          : undefined
        const assignedProfileLabel = getAgentProfileLabel(
          assignedProfile,
          loop.profileId,
        )
        return (
          <div
            key={loop.id}
            className={cn(
              "bg-card rounded-lg border px-3 py-2",
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
                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                  {loop.prompt}
                </p>
                {assignedProfileLabel && (
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className="h-5 max-w-full truncate text-[11px] font-normal"
                      data-testid={`loop-profile-badge-${loop.id}`}
                      title={`Runs as ${assignedProfileLabel}`}
                    >
                      Agent: {assignedProfileLabel}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2"
                  onClick={() => handleRunNow(loop)}
                >
                  <Play className="h-3.5 w-3.5" />
                  Run
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2"
                  onClick={() => handleOpenTaskFile(loop)}
                >
                  <FileText className="h-3.5 w-3.5" />
                  File
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

            <div className="text-muted-foreground mt-2 flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Every {formatInterval(loop.intervalMinutes)}
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
              <Label className="text-xs">
                {loop.enabled ? "Enabled" : "Disabled"}
              </Label>
            </div>
          </div>
        )
      })}
      {loops.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          No repeat tasks configured. Click &quot;Add Task&quot; to create one.
        </div>
      )}
    </div>
  )

  const renderEditForm = () => {
    if (!editing) return null
    const selectedProfile = editing.profileId
      ? profileById.get(editing.profileId)
      : undefined
    const selectedProfileLabel = getAgentProfileLabel(
      selectedProfile,
      editing.profileId,
    )
    const selectedProfileValue = encodeProfileSelectValue(editing.profileId)
    const selectedProfileIsDisabled =
      !!selectedProfile && !selectedProfile.enabled
    const selectedProfileIsMissing = !!editing.profileId && !selectedProfile
    const selectedProfileIsUnavailable =
      selectedProfileIsDisabled || selectedProfileIsMissing
    const unavailableProfileLabel = selectedProfileIsMissing
      ? `Missing agent (${editing.profileId})`
      : `${selectedProfileLabel} (disabled)`
    return (
      <Card className="max-w-3xl">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-lg">
            {isCreating ? "Add Repeat Task" : "Edit Repeat Task"}
          </CardTitle>
          <CardDescription>
            Set the prompt, interval, and startup behavior.
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
              onChange={(e) =>
                setEditing({ ...editing, prompt: e.target.value })
              }
              placeholder="Enter the prompt to send to the agent..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loop-profile-trigger">Agent</Label>
            <Select
              value={selectedProfileValue}
              onValueChange={(value) =>
                setEditing({
                  ...editing,
                  profileId: decodeProfileSelectValue(value),
                })
              }
            >
              <SelectTrigger
                id="loop-profile-trigger"
                data-testid="loop-profile-select-trigger"
                className="w-full sm:max-w-sm"
              >
                <SelectValue placeholder="No dedicated agent" />
              </SelectTrigger>
              <SelectContent>
                {selectedProfileIsUnavailable && (
                  <SelectItem value={selectedProfileValue}>
                    {unavailableProfileLabel}
                  </SelectItem>
                )}
                <SelectItem value={NO_DEDICATED_AGENT_VALUE}>
                  No dedicated agent
                </SelectItem>
                {availableAgentProfiles.map((profile) => (
                  <SelectItem
                    key={profile.id}
                    value={encodeProfileSelectValue(profile.id)}
                  >
                    {getAgentProfileLabel(profile)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {selectedProfileIsMissing
                ? `This task still references agent "${editing.profileId}", but it is no longer available. Keeping this selection preserves the saved agent until you choose another agent or no dedicated agent.`
                : selectedProfileIsDisabled
                  ? `This task still references ${selectedProfileLabel}, but that agent is currently disabled. Keeping this selection preserves the saved agent until you choose another agent or no dedicated agent.`
                  : selectedProfile
                    ? `This task will run as ${selectedProfileLabel}, so it can use that agent's model and tools instead of the default active agent.`
                    : "Use the default active agent, or pick a dedicated agent if this repeat task should run with a cheaper model or different tools."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="interval">Interval</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="interval"
                type="number"
                min={1}
                value={editing.intervalMinutesDraft}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    intervalMinutesDraft: e.target.value,
                  })
                }
                className="h-8 w-20"
              />
              <span className="text-muted-foreground self-center text-xs">
                minutes
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {INTERVAL_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={
                    parseLoopIntervalDraft(editing.intervalMinutesDraft) ===
                    preset.value
                      ? "secondary"
                      : "ghost"
                  }
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      intervalMinutesDraft: String(preset.value),
                    })
                  }
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
                onCheckedChange={(v) =>
                  setEditing({ ...editing, runOnStartup: v })
                }
              />
              <Label htmlFor="runOnStartup">Run on Startup</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Save
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
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </Button>
      </div>
      {editing ? renderEditForm() : renderLoopList()}
    </div>
  )
}

export { SettingsLoops as Component }
