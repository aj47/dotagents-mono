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
import { desktopLoopsClient } from "@renderer/lib/desktop-loops-client"
import { cn } from "@renderer/lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { LoopConfig } from "@dotagents/shared/types"
import { toast } from "sonner"
import {
  buildAgentSessionCandidateOptions,
  formatAgentSessionCandidateLabel,
  type AgentSessionCandidateOption,
} from "@dotagents/shared/agent-session-candidates"
import type { AgentSessionCandidatesResponse, LoopRuntimeStatus } from "@dotagents/shared/api-types"
import {
  addRepeatTaskScheduleTime,
  buildRepeatTaskEditFormSavePayload,
  DEFAULT_REPEAT_TASK_EDIT_FORM_DATA,
  REPEAT_TASK_DAY_LABELS,
  createRepeatTaskIdFromName,
  describeLoopCadence,
  formatRepeatTaskRuntimeTimestampOrFallback,
  formatRepeatTaskEditFormData,
  parseLoopIntervalDraft,
  REPEAT_TASK_INTERVAL_PRESETS,
  removeRepeatTaskScheduleTimeAt,
  toggleRepeatTaskScheduleDayOfWeek,
  type RepeatTaskEditFormData,
  updateRepeatTaskScheduleTimeAt,
} from "@dotagents/shared/repeat-task-utils"
import {
  APP_SHELL_LOOP_DELETE_PRESENTATION,
  APP_SHELL_LOOP_EDITOR_PRESENTATION,
  APP_SHELL_LOOP_FEEDBACK_PRESENTATION,
  APP_SHELL_LOOP_LIST_PRESENTATION,
  formatAppShellLoopRunningMessage,
  formatAppShellLoopTriggerUnavailableMessage,
  formatAppShellLoopLastRunLabel,
  formatAppShellLoopNextRunLabel,
  getAppShellEditorTitle,
  getAppShellLoopActionLabel,
  getAppShellLoopDeleteConfirmMessage,
  getAppShellLoopFeatureLabels,
  getAppShellLoopStatusLabel,
  getAppShellLoopToggleAccessibilityLabel,
} from "@dotagents/shared/app-shell"

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
      <Label htmlFor="lastSessionId">{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.continueFromSession.label}</Label>
      <Select
        value={selectValue}
        onValueChange={(v) => onChange(v === AUTO_SESSION_VALUE ? undefined : v)}
      >
        <SelectTrigger id="lastSessionId" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={AUTO_SESSION_VALUE}>{APP_SHELL_LOOP_EDITOR_PRESENTATION.sessionPicker.autoDesktopLabel}</SelectItem>
          {options.map((candidate) => (
            <SelectItem key={`${candidate.group}:${candidate.id}`} value={candidate.id}>
              {getOptionLabel(candidate)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {APP_SHELL_LOOP_EDITOR_PRESENTATION.sessionPicker.desktopHelper}
      </p>
    </div>
  )
}

export function SettingsLoops() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<RepeatTaskEditFormData | null>(null)
  const [editingLoopId, setEditingLoopId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const loopsQuery = useQuery({
    queryKey: ["loops"],
    queryFn: async () => desktopLoopsClient.getLoops(),
  })

  const loopStatusesQuery = useQuery({
    queryKey: ["loop-statuses"],
    queryFn: async () => desktopLoopsClient.getLoopStatuses(),
    refetchInterval: 5000,
  })

  const sessionCandidatesQuery = useQuery({
    queryKey: ["loop-session-candidates"],
    queryFn: async () => desktopLoopsClient.listAgentSessionCandidates(20),
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    return desktopLoopsClient.onLoopsFolderChanged(() => {
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
    setEditing({ ...DEFAULT_REPEAT_TASK_EDIT_FORM_DATA })
    setEditingLoopId(null)
  }

  const handleCancel = () => {
    setEditing(null)
    setEditingLoopId(null)
    setIsCreating(false)
  }

  const handleEdit = (loop: LoopConfig) => {
    setIsCreating(false)
    setEditingLoopId(loop.id)
    setEditing(formatRepeatTaskEditFormData(loop))
  }

  const handleDelete = async (id: string, name?: string) => {
    if (!confirm(getAppShellLoopDeleteConfirmMessage(name))) return
    try {
      await desktopLoopsClient.deleteLoop(id)
      queryClient.invalidateQueries({ queryKey: ["loops"] })
      queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
      toast.success(APP_SHELL_LOOP_DELETE_PRESENTATION.deleted)
    } catch {
      toast.error(APP_SHELL_LOOP_DELETE_PRESENTATION.deleteFailed)
    }
  }

  const handleSave = async () => {
    if (!editing) return

    const existingIntervalMinutes = editingLoopId
      ? loops.find((loop) => loop.id === editingLoopId)?.intervalMinutes
      : undefined
    const savePayloadResult = buildRepeatTaskEditFormSavePayload(editing, {
      existingIntervalMinutes,
    })
    if (savePayloadResult.ok === false) {
      toast.error(savePayloadResult.message)
      return
    }

    const payload = savePayloadResult.payload
    const loopData: LoopConfig = {
      id: editingLoopId || createRepeatTaskIdFromName(payload.name, () => crypto.randomUUID()),
      name: payload.name,
      prompt: payload.prompt,
      intervalMinutes: payload.intervalMinutes,
      enabled: payload.enabled,
      ...(payload.profileId ? { profileId: payload.profileId } : {}),
      runOnStartup: payload.runOnStartup,
      speakOnTrigger: payload.speakOnTrigger,
      continueInSession: payload.continueInSession,
      runContinuously: payload.runContinuously,
      ...(payload.continueInSession && payload.lastSessionId
        ? { lastSessionId: payload.lastSessionId }
        : {}),
      ...(payload.maxIterations ? { maxIterations: payload.maxIterations } : {}),
      ...(payload.schedule ? { schedule: payload.schedule } : {}),
    }

    try {
      const saveResult = await desktopLoopsClient.saveLoop(loopData)
      if (saveResult?.success === false) {
        toast.error(APP_SHELL_LOOP_FEEDBACK_PRESENTATION.save.saveFailed)
        return
      }
      queryClient.invalidateQueries({ queryKey: ["loops"] })
      setEditing(null)
      setEditingLoopId(null)
      setIsCreating(false)
      toast.success(isCreating
        ? APP_SHELL_LOOP_FEEDBACK_PRESENTATION.save.created
        : APP_SHELL_LOOP_FEEDBACK_PRESENTATION.save.updated)

      // Start/stop loop based on enabled state
      if (loopData.enabled) {
        await desktopLoopsClient.startLoop(loopData.id)
      } else {
        await desktopLoopsClient.stopLoop(loopData.id)
      }
      queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
    } catch {
      toast.error(APP_SHELL_LOOP_FEEDBACK_PRESENTATION.save.saveFailed)
    }
  }

  const handleToggleEnabled = async (loop: LoopConfig) => {
    const updatedLoop = { ...loop, enabled: !loop.enabled }
    try {
      const saveResult = await desktopLoopsClient.saveLoop(updatedLoop)
      if (saveResult?.success === false) {
        toast.error(APP_SHELL_LOOP_FEEDBACK_PRESENTATION.save.updateFailed)
        return
      }
      queryClient.invalidateQueries({ queryKey: ["loops"] })

      if (updatedLoop.enabled) {
        await desktopLoopsClient.startLoop(loop.id)
      } else {
        await desktopLoopsClient.stopLoop(loop.id)
      }
      queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
      toast.success(updatedLoop.enabled
        ? APP_SHELL_LOOP_FEEDBACK_PRESENTATION.save.enabled
        : APP_SHELL_LOOP_FEEDBACK_PRESENTATION.save.disabled)
    } catch {
      toast.error(APP_SHELL_LOOP_FEEDBACK_PRESENTATION.save.updateFailed)
    }
  }

  const handleRunNow = async (loop: LoopConfig) => {
    try {
      const result = await desktopLoopsClient.runLoop(loop.id)
      if (result && !result.success) {
        toast.error(formatAppShellLoopTriggerUnavailableMessage(loop.name))
        return
      }
      toast.success(formatAppShellLoopRunningMessage(loop.name))
    } catch {
      toast.error(APP_SHELL_LOOP_FEEDBACK_PRESENTATION.runtime.triggerFailed)
    }
  }

  const handleOpenTaskFile = async (loop: LoopConfig) => {
    try {
      const result = await desktopLoopsClient.openLoopTaskFile(loop.id)
      if (!result?.success) {
        toast.error(result?.error || APP_SHELL_LOOP_FEEDBACK_PRESENTATION.runtime.revealFailed)
      }
    } catch {
      toast.error(APP_SHELL_LOOP_FEEDBACK_PRESENTATION.runtime.revealFailed)
    }
  }

  const renderLoopList = () => (
    <div className="space-y-1">
      {orderedLoops.map((loop) => {
        const runtime = statusByLoopId.get(loop.id)
        const isRunning = runtime?.isRunning ?? false
        const statusLabel = getAppShellLoopStatusLabel({
          enabled: loop.enabled,
          isRunning,
        })
        const nextRunAt = runtime?.nextRunAt
        const lastRunAt = runtime?.lastRunAt ?? loop.lastRunAt
        const featureLabels = getAppShellLoopFeatureLabels(loop)
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
                  {statusLabel && (
                    <Badge
                      variant={statusLabel === APP_SHELL_LOOP_LIST_PRESENTATION.status.disabled ? "outline" : "secondary"}
                      className="h-5 px-1.5 text-[10px]"
                    >
                      {statusLabel}
                    </Badge>
                  )}
                </div>
                <p className="line-clamp-1 text-[11px] leading-4 text-muted-foreground">
                  {loop.prompt}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Switch
                  aria-label={getAppShellLoopToggleAccessibilityLabel(loop.name, loop.enabled)}
                  checked={loop.enabled}
                  onCheckedChange={() => handleToggleEnabled(loop)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 gap-1 px-1.5 text-xs"
                  onClick={() => handleRunNow(loop)}
                >
                  <Play className="h-3.5 w-3.5" />{getAppShellLoopActionLabel("runNow")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 gap-1 px-1.5 text-xs"
                  onClick={() => handleOpenTaskFile(loop)}
                >
                  <FileText className="h-3.5 w-3.5" />{getAppShellLoopActionLabel("file")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title={getAppShellLoopActionLabel("editTask")}
                  onClick={() => handleEdit(loop)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title={getAppShellLoopActionLabel("deleteTask")}
                  onClick={() => handleDelete(loop.id, loop.name)}
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
              {featureLabels.map((label) => (
                <div key={label}>{label}</div>
              ))}
              {typeof nextRunAt === "number" && (
                <div>{formatAppShellLoopNextRunLabel(formatRepeatTaskRuntimeTimestampOrFallback(nextRunAt))}</div>
              )}
              <div>{formatAppShellLoopLastRunLabel(formatRepeatTaskRuntimeTimestampOrFallback(lastRunAt))}</div>
            </div>
          </div>
        )
      })}
      {loops.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          {APP_SHELL_LOOP_LIST_PRESENTATION.emptyTitle} {APP_SHELL_LOOP_LIST_PRESENTATION.emptyDescription}
        </div>
      )}
    </div>
  )

  const renderEditForm = () => {
    if (!editing) return null
    return (
      <Card className="max-w-3xl">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-lg">{getAppShellEditorTitle("loop", !isCreating)}</CardTitle>
          <CardDescription>{APP_SHELL_LOOP_EDITOR_PRESENTATION.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="name">{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.name.label}</Label>
            <Input
              id="name"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder={APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.name.placeholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.prompt.label}</Label>
            <Textarea
              id="prompt"
              value={editing.prompt}
              onChange={(e) => setEditing({ ...editing, prompt: e.target.value })}
              placeholder={APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.prompt.placeholder}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.schedule.label}</Label>
            <div className="flex flex-wrap gap-1.5">
              {([
                { mode: "interval", label: APP_SHELL_LOOP_EDITOR_PRESENTATION.scheduleModes.interval },
                { mode: "continuous", label: APP_SHELL_LOOP_EDITOR_PRESENTATION.scheduleModes.continuous },
                { mode: "daily", label: APP_SHELL_LOOP_EDITOR_PRESENTATION.scheduleModes.daily },
                { mode: "weekly", label: APP_SHELL_LOOP_EDITOR_PRESENTATION.scheduleModes.weekly },
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
              <Label htmlFor="interval">{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.interval.label}</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="interval"
                  type="number"
                  min={1}
                  value={editing.intervalMinutes}
                  onChange={(e) => setEditing({ ...editing, intervalMinutes: e.target.value })}
                  className="h-8 w-20"
                />
                <span className="self-center text-xs text-muted-foreground">{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.interval.unitLabel}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {REPEAT_TASK_INTERVAL_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={parseLoopIntervalDraft(editing.intervalMinutes) === preset.value ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setEditing({ ...editing, intervalMinutes: String(preset.value) })}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {editing.scheduleMode === "continuous" && (
            <p className="text-xs text-muted-foreground">
              {APP_SHELL_LOOP_EDITOR_PRESENTATION.schedule.continuousHelper}
            </p>
          )}
          {editing.scheduleMode !== "interval" && editing.scheduleMode !== "continuous" && (
            <div className="space-y-2">
              <Label>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.times.label}</Label>
              <div className="flex flex-wrap items-center gap-2">
                {editing.scheduleTimes.map((time, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        setEditing({
                          ...editing,
                          scheduleTimes: updateRepeatTaskScheduleTimeAt(editing.scheduleTimes, idx, e.target.value),
                        })
                      }}
                      className="h-8 w-28"
                    />
                    {editing.scheduleTimes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={APP_SHELL_LOOP_EDITOR_PRESENTATION.actions.removeTime}
                        onClick={() => {
                          setEditing({
                            ...editing,
                            scheduleTimes: removeRepeatTaskScheduleTimeAt(editing.scheduleTimes, idx),
                          })
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
                      scheduleTimes: addRepeatTaskScheduleTime(editing.scheduleTimes),
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" />{APP_SHELL_LOOP_EDITOR_PRESENTATION.actions.addTime}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.times.helper}</p>
            </div>
          )}
          {editing.scheduleMode === "weekly" && (
            <div className="space-y-2">
              <Label>{APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.daysOfWeek.label}</Label>
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
                        setEditing({
                          ...editing,
                          scheduleDaysOfWeek: toggleRepeatTaskScheduleDayOfWeek(editing.scheduleDaysOfWeek, dayIdx),
                        })
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
              <Label htmlFor="enabled">{APP_SHELL_LOOP_EDITOR_PRESENTATION.switches.enabled.label}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="runOnStartup"
                checked={editing.runOnStartup}
                onCheckedChange={(v) => setEditing({ ...editing, runOnStartup: v })}
              />
              <Label htmlFor="runOnStartup">{APP_SHELL_LOOP_EDITOR_PRESENTATION.switches.runOnStartup.label}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="speakOnTrigger"
                checked={editing.speakOnTrigger}
                onCheckedChange={(v) => setEditing({ ...editing, speakOnTrigger: v })}
              />
              <Label htmlFor="speakOnTrigger">{APP_SHELL_LOOP_EDITOR_PRESENTATION.switches.speakOnTrigger.label}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="continueInSession"
                checked={editing.continueInSession}
                onCheckedChange={(v) => setEditing({ ...editing, continueInSession: v })}
              />
              <Label htmlFor="continueInSession">{APP_SHELL_LOOP_EDITOR_PRESENTATION.switches.continueInSession.label}</Label>
            </div>
          </div>
          {editing.continueInSession && (
            <SessionPicker
              value={editing.lastSessionId || undefined}
              onChange={(v) => setEditing({ ...editing, lastSessionId: v || "" })}
              candidates={sessionCandidatesQuery.data}
            />
          )}
          <div className="flex justify-end gap-2 pt-3">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCancel}>
              <X className="h-4 w-4" />{getAppShellLoopActionLabel("cancel")}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleSave}>
              <Save className="h-4 w-4" />{getAppShellLoopActionLabel("save")}
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
          <Plus className="h-3.5 w-3.5" />{getAppShellLoopActionLabel("addTask")}
        </Button>
      </div>
      {editing ? renderEditForm() : renderLoopList()}
    </div>
  )
}

export { SettingsLoops as Component }
