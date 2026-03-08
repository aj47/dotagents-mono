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

const COMPONENT_LABELS: Record<BundleComponentKey, string> = {
  agentProfiles: "Agent Profiles",
  mcpServers: "MCP Servers",
  skills: "Skills",
  repeatTasks: "Repeat Tasks",
  memories: "Memories",
}

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
  defaultStrategy: ConflictStrategy
  renameTargetId?: string
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

interface ImportItemResult {
  id: string
  name: string
  action: "imported" | "skipped" | "renamed" | "overwritten"
  error?: string
}

interface BundleImportResult {
  success: boolean
  backupFilePath: string | null
  agentProfiles: ImportItemResult[]
  mcpServers: ImportItemResult[]
  skills: ImportItemResult[]
  repeatTasks: ImportItemResult[]
  memories: ImportItemResult[]
  errors: string[]
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
  confirmLabel?: string
  successVerb?: string
}

export async function previewProvidedBundleFile(filePath: string): Promise<BundlePreview> {
  return (await tipcClient.previewBundleWithConflicts({ filePath })) as BundlePreview
}

function getSelectedConflictCount(
  conflicts: BundlePreview["conflicts"] | undefined,
  components: BundleComponentsState,
): number {
  if (!conflicts) return 0

  return COMPONENT_KEYS.reduce((total, key) => {
    if (!components[key]) return total
    return total + conflicts[key].length
  }, 0)
}

function formatCount(label: string, count: number): string {
  return `${count} ${label}${count === 1 ? "" : "s"}`
}

function formatExpectedConflictOutcome(conflictCount: number, strategy: ConflictStrategy): string | null {
  if (conflictCount === 0) return null

  if (strategy === "skip") {
    return `${formatCount("existing item", conflictCount)} will be skipped.`
  }

  if (strategy === "overwrite") {
    return `${formatCount("existing item", conflictCount)} will be overwritten.`
  }

  return `${formatCount("existing item", conflictCount)} will be imported with renamed IDs.`
}

function getConflictStrategyBadgeLabel(strategy: ConflictStrategy): string {
  if (strategy === "skip") return "Skip"
  if (strategy === "overwrite") return "Overwrite"
  return "Rename"
}

function formatConflictOutcome(conflict: PreviewConflict, strategy: ConflictStrategy): string {
  if (strategy === "skip") {
    return "Will keep the existing item and skip this bundle copy."
  }

  if (strategy === "overwrite") {
    return "Will replace the existing item with the version from this bundle."
  }

  if (conflict.renameTargetId) {
    return `Will import alongside the existing item as ${conflict.renameTargetId}.`
  }

  return "Will import alongside the existing item with a renamed ID."
}

function summarizeImportResult(result: BundleImportResult): {
  appliedCount: number
  outcomeLabel: string
  detailSummary: string
} {
  const counts = {
    imported: 0,
    renamed: 0,
    overwritten: 0,
    skipped: 0,
    failed: 0,
  }

  for (const key of COMPONENT_KEYS) {
    for (const item of result[key]) {
      if (item.error) {
        counts.failed += 1
        continue
      }

      counts[item.action] += 1
    }
  }

  const appliedCount = counts.imported + counts.renamed + counts.overwritten
  const detailSummary = [
    counts.imported > 0 ? formatCount("imported item", counts.imported) : null,
    counts.renamed > 0 ? formatCount("renamed item", counts.renamed) : null,
    counts.overwritten > 0 ? formatCount("overwritten item", counts.overwritten) : null,
    counts.skipped > 0 ? formatCount("skipped item", counts.skipped) : null,
    counts.failed > 0 ? formatCount("failed item", counts.failed) : null,
  ].filter(Boolean).join(", ")

  return {
    appliedCount,
    outcomeLabel: appliedCount > 0 ? formatCount("item", appliedCount) : "no new items",
    detailSummary,
  }
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
  confirmLabel = "Import",
  successVerb = "imported",
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
      const dialogResult = await tipcClient.previewBundle()
      if (previewRequestIdRef.current !== requestId || !isOpenRef.current) return
      if (!dialogResult) {
        // User cancelled file picker
        onOpenChange(false)
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
    if (!preview?.filePath) return
    setImporting(true)
    try {
      const result = await tipcClient.importBundle({
        filePath: preview.filePath,
        conflictStrategy,
        components: normalizedComponents,
      }) as BundleImportResult
      const backupMessage = result.backupFilePath
        ? ` Pre-import backup: ${result.backupFilePath}`
        : ""
      const importSummary = summarizeImportResult(result)
      if (result.success) {
        const detailMessage = importSummary.detailSummary
          ? ` (${importSummary.detailSummary})`
          : ""
        toast.success(`Successfully ${successVerb} ${importSummary.outcomeLabel}.${detailMessage}${backupMessage}`)
        onImportComplete()
        handleClose()
      } else {
        const detailMessage = importSummary.detailSummary
          ? ` Progress: ${importSummary.detailSummary}.`
          : ""
        toast.error(`${result.errors.join(", ") || "Import failed"}.${detailMessage}${backupMessage}`)
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
  const selectedConflictCount = getSelectedConflictCount(conflicts, normalizedComponents)
  const expectedConflictOutcome = formatExpectedConflictOutcome(selectedConflictCount, conflictStrategy)
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
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                  <div className="space-y-1">
                    <Label>Conflict preview</Label>
                    <p className="text-xs text-muted-foreground">
                      Review the exact items that already exist before importing anything.
                    </p>
                  </div>
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
                  Default conflict policy is <span className="font-medium">skip</span>; you can change it for this import before any writes occur.
                </p>
                {expectedConflictOutcome && (
                  <p className="text-xs text-muted-foreground">
                    Current selection: {expectedConflictOutcome}
                  </p>
                )}

                <div className="space-y-3">
                  {COMPONENT_KEYS.map((key) => {
                    if (!normalizedComponents[key] || !conflicts?.[key]?.length) {
                      return null
                    }

                    return (
                      <ConflictPreviewSection
                        key={key}
                        label={COMPONENT_LABELS[key]}
                        conflicts={conflicts[key]}
                        strategy={conflictStrategy}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!preview?.filePath || importing || loading}>
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
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

interface ConflictPreviewSectionProps {
  label: string
  conflicts: PreviewConflict[]
  strategy: ConflictStrategy
}

function ConflictPreviewSection({ label, conflicts, strategy }: ConflictPreviewSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Badge variant="secondary" className="text-xs">{conflicts.length}</Badge>
      </div>

      <div className="space-y-2">
        {conflicts.map((conflict) => {
          const showExistingName = conflict.existingName && conflict.existingName !== conflict.name

          return (
            <div key={`${label}:${conflict.id}`} className="rounded-md border bg-muted/20 p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{conflict.name}</p>
                  <p className="truncate text-xs text-muted-foreground">ID: {conflict.id}</p>
                  {showExistingName && (
                    <p className="truncate text-xs text-muted-foreground">
                      Existing name: {conflict.existingName}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {getConflictStrategyBadgeLabel(strategy)}
                </Badge>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {formatConflictOutcome(conflict, strategy)}
              </p>

              {strategy === "rename" && conflict.renameTargetId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Renamed ID preview: <span className="font-mono">{conflict.renameTargetId}</span>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
