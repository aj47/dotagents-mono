import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@renderer/components/ui/button"
import { Badge } from "@renderer/components/ui/badge"
import { Input } from "@renderer/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import {
  Save,
  Trash2,
  RotateCcw,
  Loader2,
  Plus,
  CheckCircle2,
  Layers,
  Edit2,
} from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { toast } from "sonner"
import { cn } from "@renderer/lib/utils"

interface SandboxSlot {
  name: string
  createdAt: string
  updatedAt: string
  isDefault: boolean
  sourceBundleName?: string
}

interface SandboxState {
  activeSlot: string | null
  slots: SandboxSlot[]
}

const SANDBOX_QUERY_KEY = ["sandbox-state"]

function useSandboxState() {
  return useQuery<SandboxState>({
    queryKey: SANDBOX_QUERY_KEY,
    queryFn: () => tipcClient.getSandboxState(),
    staleTime: 5_000,
  })
}

export function SandboxSlotSwitcher() {
  const queryClient = useQueryClient()
  const { data: state, isLoading } = useSandboxState()
  const [switching, setSwitching] = useState<string | null>(null)
  const [showNewSlotDialog, setShowNewSlotDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [newSlotName, setNewSlotName] = useState("")
  const [renamingSlot, setRenamingSlot] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [saving, setSaving] = useState(false)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: SANDBOX_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ["config"] })
  }

  const handleSaveBaseline = async () => {
    setSaving(true)
    try {
      const result = await tipcClient.saveBaseline()
      if (result.success) {
        toast.success("Baseline saved")
        invalidate()
      } else {
        toast.error(result.error || "Failed to save baseline")
      }
    } catch (error) {
      toast.error("Failed to save baseline")
    } finally {
      setSaving(false)
    }
  }

  const handleSwitchSlot = async (slotName: string) => {
    setSwitching(slotName)
    try {
      const result = await tipcClient.switchToSlot({ name: slotName })
      if (result.success) {
        toast.success(`Switched to "${slotName}"`)
        invalidate()
      } else {
        toast.error(result.error || "Failed to switch slot")
      }
    } catch (error) {
      toast.error("Failed to switch slot")
    } finally {
      setSwitching(null)
    }
  }

  const handleRestoreBaseline = async () => {
    setSwitching("default")
    try {
      const result = await tipcClient.restoreBaseline()
      if (result.success) {
        toast.success("Restored to baseline")
        invalidate()
      } else {
        toast.error(result.error || "Failed to restore baseline")
      }
    } catch (error) {
      toast.error("Failed to restore baseline")
    } finally {
      setSwitching(null)
    }
  }

  const handleCreateSlot = async () => {
    if (!newSlotName.trim()) return

    // Reject names that would sanitize to "default" (reserved for baseline)
    const sanitized = newSlotName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-_ ]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      || "slot"
    if (sanitized === "default") {
      toast.error("\"default\" is reserved for the baseline slot. Please choose a different name.")
      return
    }

    setSaving(true)
    try {
      const result = await tipcClient.saveCurrentAsSlot({ name: newSlotName.trim() })
      if (result.success) {
        toast.success(`Slot "${result.slot?.name ?? newSlotName.trim()}" created`)
        setShowNewSlotDialog(false)
        setNewSlotName("")
        invalidate()
      } else {
        toast.error(result.error || "Failed to create slot")
      }
    } catch (error) {
      toast.error("Failed to create slot")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async (slotName: string) => {
    try {
      const result = await tipcClient.deleteSlot({ name: slotName })
      if (result.success) {
        toast.success(`Slot "${slotName}" deleted`)
        setShowDeleteConfirm(null)
        invalidate()
      } else {
        toast.error(result.error || "Failed to delete slot")
      }
    } catch (error) {
      toast.error("Failed to delete slot")
    }
  }

  const handleRenameSlot = async (oldName: string) => {
    if (!renameValue.trim()) return
    try {
      const result = await tipcClient.renameSlot({ oldName, newName: renameValue.trim() })
      if (result.success) {
        toast.success(`Slot renamed to "${result.slot?.name ?? renameValue.trim()}"`)
        setRenamingSlot(null)
        setRenameValue("")
        invalidate()
      } else {
        toast.error(result.error || "Failed to rename slot")
      }
    } catch (error) {
      toast.error("Failed to rename slot")
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading sandbox slots...
        </div>
      </div>
    )
  }

  const slots = state?.slots || []
  const activeSlot = state?.activeSlot
  const hasBaseline = slots.some((s) => s.isDefault)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Config Sandbox Slots</h3>
          {activeSlot && (
            <Badge variant="secondary" className="text-xs">
              Active: {activeSlot}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveBaseline}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            {hasBaseline ? "Update Baseline" : "Save Baseline"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewSlotDialog(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Slot
          </Button>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          No sandbox slots yet. Save your current config as a baseline, then
          import bundles into separate slots to try them without risk.
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => {
            const isActive = activeSlot === slot.name
            const isSwitching = switching === slot.name

            return (
              <div
                key={slot.name}
                className={cn(
                  "flex items-center justify-between rounded-md border p-3 transition-colors",
                  isActive && "border-primary bg-primary/5"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                    {renamingSlot === slot.name ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameSlot(slot.name)
                            if (e.key === "Escape") {
                              setRenamingSlot(null)
                              setRenameValue("")
                            }
                          }}
                          className="h-6 w-32 text-xs"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRenameSlot(slot.name)}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm font-medium truncate">
                        {slot.name}
                      </span>
                    )}
                    {slot.isDefault && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        baseline
                      </Badge>
                    )}
                    {slot.sourceBundleName && (
                      <Badge variant="secondary" className="text-[10px] shrink-0 max-w-[120px] truncate">
                        {slot.sourceBundleName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Updated {new Date(slot.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {!isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        slot.isDefault
                          ? handleRestoreBaseline()
                          : handleSwitchSlot(slot.name)
                      }
                      disabled={!!switching}
                    >
                      {isSwitching ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : slot.isDefault ? (
                        <RotateCcw className="mr-1 h-3 w-3" />
                      ) : null}
                      {slot.isDefault ? "Restore" : "Switch"}
                    </Button>
                  )}
                  {!slot.isDefault && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setRenamingSlot(slot.name)
                          setRenameValue(slot.name)
                        }}
                        title="Rename slot"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => setShowDeleteConfirm(slot.name)}
                        disabled={isActive}
                        title={isActive ? "Cannot delete active slot" : "Delete slot"}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {hasBaseline && activeSlot && activeSlot !== "default" && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestoreBaseline}
            disabled={!!switching}
          >
            {switching === "default" ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Restore Baseline
          </Button>
        </div>
      )}

      {/* New Slot Dialog */}
      <Dialog open={showNewSlotDialog} onOpenChange={setShowNewSlotDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Sandbox Slot</DialogTitle>
            <DialogDescription>
              Save the current configuration as a named slot. You can switch between
              slots to quickly try different bundle configurations.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Slot name (e.g. coding-assistant)"
            value={newSlotName}
            onChange={(e) => setNewSlotName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateSlot()
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSlotDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSlot} disabled={!newSlotName.trim() || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Slot</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the slot &quot;{showDeleteConfirm}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDeleteSlot(showDeleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Compact sandbox indicator for the sidebar. Shows the active slot name
 * with a quick restore-baseline button.
 */
export function SandboxSlotIndicator() {
  const { data: state } = useSandboxState()
  const queryClient = useQueryClient()
  const [restoring, setRestoring] = useState(false)

  const hasBaseline = state?.slots?.some((s) => s.isDefault) ?? false

  if (!state?.activeSlot || state.activeSlot === "default") return null

  const handleRestore = async () => {
    setRestoring(true)
    try {
      const result = await tipcClient.restoreBaseline()
      if (result.success) {
        toast.success("Restored to baseline")
        queryClient.invalidateQueries({ queryKey: SANDBOX_QUERY_KEY })
        queryClient.invalidateQueries({ queryKey: ["config"] })
      } else {
        toast.error(result.error || "Failed to restore baseline")
      }
    } catch {
      toast.error("Failed to restore baseline")
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs dark:border-amber-800 dark:bg-amber-950/30">
      <Layers className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="truncate text-amber-800 dark:text-amber-200">
        Sandbox: {state.activeSlot}
      </span>
      <button
        type="button"
        onClick={handleRestore}
        disabled={restoring || !hasBaseline}
        className="ml-auto shrink-0 rounded p-0.5 text-amber-600 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed dark:text-amber-400 dark:hover:bg-amber-900"
        title={hasBaseline ? "Restore baseline" : "No baseline saved yet"}
      >
        {restoring ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RotateCcw className="h-3 w-3" />
        )}
      </button>
    </div>
  )
}
