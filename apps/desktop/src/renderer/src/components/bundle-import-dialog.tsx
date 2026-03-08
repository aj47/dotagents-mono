import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import { Button } from "@renderer/components/ui/button"
import { Label } from "@renderer/components/ui/label"
import { Switch } from "@renderer/components/ui/switch"
import { Badge } from "@renderer/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@renderer/components/ui/select"
import { Loader2, AlertTriangle, Package, Bot, Server, Sparkles, Clock, Brain } from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { toast } from "sonner"

type ConflictStrategy = "skip" | "overwrite" | "rename"
type BundleComponentKey = "agentProfiles" | "mcpServers" | "skills" | "repeatTasks" | "memories"
type BundleComponentsState = Record<BundleComponentKey, boolean>

const DEFAULT_COMPONENTS: BundleComponentsState = {
  agentProfiles: true,
  mcpServers: true,
  skills: true,
  repeatTasks: true,
  memories: true,
}

const COMPONENT_KEYS: BundleComponentKey[] = ["agentProfiles", "mcpServers", "skills", "repeatTasks", "memories"]

function resolveComponents(initialComponents?: Partial<BundleComponentsState>): BundleComponentsState {
  return { ...DEFAULT_COMPONENTS, ...initialComponents }
}

interface BundleManifest {
  version: number
  name: string
  description?: string
  createdAt: string
  exportedFrom: string
  components: {
    agentProfiles: number
    mcpServers: number
    skills: number
    repeatTasks: number
    memories: number
  }
}

interface PreviewConflict {
  id: string
  name: string
  existingName?: string
}

interface BundlePreview {
  success: boolean
  filePath?: string
  bundle?: {
    manifest: BundleManifest
  }
  conflicts?: {
    agentProfiles: PreviewConflict[]
    mcpServers: PreviewConflict[]
    skills: PreviewConflict[]
    repeatTasks: PreviewConflict[]
    memories: PreviewConflict[]
  }
  error?: string
}

interface BundlePreviewDialogResult {
  canceled: boolean
  filePath: string | null
  error?: string
}

interface BundleImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
  initialFilePath?: string
  initialComponents?: Partial<BundleComponentsState>
  availableComponents?: Partial<Record<BundleComponentKey, boolean>>
  title?: string
  description?: string
}

export async function previewProvidedBundleFile(filePath: string): Promise<BundlePreview> {
  return (await tipcClient.previewBundleWithConflicts({ filePath })) as BundlePreview
}

export function BundleImportDialog({
  open,
  onOpenChange,
  onImportComplete,
  initialFilePath,
  initialComponents,
  availableComponents,
  title = "Import Bundle",
  description = "Preview and import a .dotagents bundle file.",
}: BundleImportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<BundlePreview | null>(null)
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>("skip")
  const [components, setComponents] = useState<BundleComponentsState>(() => resolveComponents(initialComponents))
  const isOpenRef = useRef(open)
  const previewRequestIdRef = useRef(0)
  isOpenRef.current = open

  const isComponentAvailable = (key: BundleComponentKey) => availableComponents?.[key] ?? true

  const normalizedComponents = COMPONENT_KEYS.reduce((acc, key) => {
    acc[key] = isComponentAvailable(key) ? components[key] : false
    return acc
  }, {} as BundleComponentsState)

  useEffect(() => {
    isOpenRef.current = open
    if (!open) {
      previewRequestIdRef.current += 1
      setPreview(null)
      setConflictStrategy("skip")
      setComponents(resolveComponents(initialComponents))
    }
  }, [initialComponents, open])

  // Reset state when dialog opens
  useEffect(() => {
    if (open && !preview) {
      if (initialFilePath) {
        void handlePreviewFile(initialFilePath)
      } else {
        void handleSelectFile()
      }
    }
  }, [initialFilePath, open, preview])

  const loadPreviewForFile = async (filePath: string, requestId: number) => {
    const fullResult = await previewProvidedBundleFile(filePath)
    if (previewRequestIdRef.current !== requestId || !isOpenRef.current) return
    setPreview(fullResult as BundlePreview)
  }

  const handleSelectFile = async () => {
    const requestId = ++previewRequestIdRef.current
    setLoading(true)
    try {
      // First, open file dialog and get basic preview
      const dialogResult = (await tipcClient.previewBundle()) as BundlePreviewDialogResult
      if (previewRequestIdRef.current !== requestId || !isOpenRef.current) return
      if (dialogResult.canceled) {
        // User cancelled file picker
        onOpenChange(false)
        return
      }
      if (dialogResult.error || !dialogResult.filePath) {
        setPreview({
          success: false,
          filePath: dialogResult.filePath ?? undefined,
          error: dialogResult.error || "Failed to parse bundle file",
        })
        return
      }
      await loadPreviewForFile(dialogResult.filePath, requestId)
    } catch (error) {
      if (previewRequestIdRef.current !== requestId || !isOpenRef.current) return
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to preview bundle: ${errorMessage}`)
      onOpenChange(false)
    } finally {
      if (previewRequestIdRef.current === requestId && isOpenRef.current) {
        setLoading(false)
      }
    }
  }

  const handlePreviewFile = async (filePath: string) => {
    const requestId = ++previewRequestIdRef.current
    setLoading(true)
    try {
      await loadPreviewForFile(filePath, requestId)
    } catch (error) {
      if (previewRequestIdRef.current !== requestId || !isOpenRef.current) return
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to preview bundle: ${errorMessage}`)
      onOpenChange(false)
    } finally {
      if (previewRequestIdRef.current === requestId && isOpenRef.current) {
        setLoading(false)
      }
    }
  }

  const handleImport = async () => {
    if (!preview?.success || !preview.filePath) return
    setImporting(true)
    try {
      const result = await tipcClient.importBundle({
        filePath: preview.filePath,
        conflictStrategy,
        components: normalizedComponents,
      })
      if (result.success) {
        const imported = [
          result.agentProfiles.filter(r => r.action !== "skipped").length,
          result.mcpServers.filter(r => r.action !== "skipped").length,
          result.skills.filter(r => r.action !== "skipped").length,
          result.repeatTasks.filter(r => r.action !== "skipped").length,
          result.memories.filter(r => r.action !== "skipped").length,
        ].reduce((a, b) => a + b, 0)
        toast.success(`Successfully imported ${imported} item(s)`)
        onImportComplete()
        handleClose()
      } else {
        toast.error(result.errors.join(", ") || "Import failed")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Import failed: ${errorMessage}`)
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    isOpenRef.current = false
    previewRequestIdRef.current += 1
    setLoading(false)
    setPreview(null)
    setConflictStrategy("skip")
    setComponents(resolveComponents(initialComponents))
    onOpenChange(false)
  }

  const manifest = preview?.bundle?.manifest
  const conflicts = preview?.conflicts
  const canImport = !!preview?.success && !!preview.filePath
  const hasConflicts = conflicts
    ? COMPONENT_KEYS.some(key => normalizedComponents[key] && conflicts[key].length > 0)
    : false

  const toggleComponent = (key: keyof typeof components) => {
    setComponents(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {preview?.error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {preview.error}
          </div>
        )}

        {manifest && (
          <div className="space-y-4">
            {/* Bundle info */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <h4 className="font-medium">{manifest.name}</h4>
              {manifest.description && (
                <p className="text-sm text-muted-foreground mt-1">{manifest.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Created: {new Date(manifest.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Component selection */}
            <div className="space-y-2">
              <Label>Components to import</Label>
              <div className="space-y-2 rounded-lg border p-3">
                {isComponentAvailable("agentProfiles") && (
                  <ComponentRow
                    icon={Bot}
                    label="Agent Profiles"
                    count={manifest.components.agentProfiles}
                    conflicts={conflicts?.agentProfiles.length ?? 0}
                    checked={components.agentProfiles}
                    onToggle={() => toggleComponent("agentProfiles")}
                  />
                )}
                {isComponentAvailable("mcpServers") && (
                  <ComponentRow
                    icon={Server}
                    label="MCP Servers"
                    count={manifest.components.mcpServers}
                    conflicts={conflicts?.mcpServers.length ?? 0}
                    checked={components.mcpServers}
                    onToggle={() => toggleComponent("mcpServers")}
                  />
                )}
                {isComponentAvailable("skills") && (
                  <ComponentRow
                    icon={Sparkles}
                    label="Skills"
                    count={manifest.components.skills}
                    conflicts={conflicts?.skills.length ?? 0}
                    checked={components.skills}
                    onToggle={() => toggleComponent("skills")}
                  />
                )}
                {isComponentAvailable("repeatTasks") && (
                  <ComponentRow
                    icon={Clock}
                    label="Repeat Tasks"
                    count={manifest.components.repeatTasks}
                    conflicts={conflicts?.repeatTasks.length ?? 0}
                    checked={components.repeatTasks}
                    onToggle={() => toggleComponent("repeatTasks")}
                  />
                )}
                {isComponentAvailable("memories") && (
                  <ComponentRow
                    icon={Brain}
                    label="Memories"
                    count={manifest.components.memories}
                    conflicts={conflicts?.memories.length ?? 0}
                    checked={components.memories}
                    onToggle={() => toggleComponent("memories")}
                  />
                )}
              </div>
            </div>

            {/* Conflict strategy */}
            {hasConflicts && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <Label>Handle conflicts</Label>
                </div>
                <Select value={conflictStrategy} onValueChange={(v) => setConflictStrategy(v as ConflictStrategy)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip existing items</SelectItem>
                    <SelectItem value="overwrite">Overwrite existing items</SelectItem>
                    <SelectItem value="rename">Rename imported items</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Some items already exist in your configuration.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          {manifest ? (
            <Button onClick={handleImport} disabled={!canImport || importing || loading}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>
          ) : (
            <Button onClick={() => void handleSelectFile()} disabled={loading || importing}>
              {preview?.error ? "Choose Another File" : "Choose File"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ComponentRowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  conflicts: number
  checked: boolean
  onToggle: () => void
}

function ComponentRow({ icon: Icon, label, count, conflicts, checked, onToggle }: ComponentRowProps) {
  if (count === 0) return null
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <Switch checked={checked} onCheckedChange={onToggle} disabled={count === 0} />
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
        {conflicts > 0 && (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
            {conflicts} conflict{conflicts > 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    </div>
  )
}
