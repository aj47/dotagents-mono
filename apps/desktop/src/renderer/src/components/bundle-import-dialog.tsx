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
import { Loader2, AlertTriangle, Package, Bot, Server, Sparkles, Clock, Brain, ExternalLink } from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { toast } from "sonner"

type ConflictStrategy = "skip" | "overwrite" | "rename"
type BundleComponentKey = "agentProfiles" | "mcpServers" | "skills" | "repeatTasks" | "memories"
type ConflictStrategyOverrideKey = Exclude<BundleComponentKey, "memories">
type BundleComponentsState = Record<BundleComponentKey, boolean>
type BundleItemSelectionKey = "agentProfileIds" | "mcpServerNames" | "skillIds" | "repeatTaskIds" | "memoryIds"
type BundleItemSelectionState = Record<BundleItemSelectionKey, string[]>
type ConflictStrategyOverrideState = Partial<Record<ConflictStrategyOverrideKey, Record<string, ConflictStrategy>>>

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
const ITEM_SELECTION_KEYS: Record<BundleComponentKey, BundleItemSelectionKey> = {
  agentProfiles: "agentProfileIds",
  mcpServers: "mcpServerNames",
  skills: "skillIds",
  repeatTasks: "repeatTaskIds",
  memories: "memoryIds",
}

function resolveComponents(initialComponents?: Partial<BundleComponentsState>): BundleComponentsState {
  return { ...DEFAULT_COMPONENTS, ...initialComponents }
}

function createDefaultItemSelections(bundle?: BundlePreview["bundle"]): BundleItemSelectionState {
  return {
    agentProfileIds: (bundle?.agentProfiles ?? []).map((profile) => profile.id),
    mcpServerNames: (bundle?.mcpServers ?? []).map((server) => server.name),
    skillIds: (bundle?.skills ?? []).map((skill) => skill.id),
    repeatTaskIds: (bundle?.repeatTasks ?? []).map((task) => task.id),
    memoryIds: (bundle?.memories ?? []).map((memory) => memory.id),
  }
}

function createDefaultConflictStrategyOverrides(): ConflictStrategyOverrideState {
  return {}
}

function getSelectedItemIds(
  selectedItems: BundleItemSelectionState,
  key: BundleComponentKey,
): string[] {
  return selectedItems[ITEM_SELECTION_KEYS[key]]
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
    agentProfiles?: Array<{ id: string; name: string; displayName?: string }>
    mcpServers?: Array<{ name: string; redactedSecretFields?: string[] }>
    skills?: Array<{ id: string; name: string }>
    repeatTasks?: Array<{ id: string; name: string }>
    memories?: Array<{ id: string; title: string }>
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
  newId?: string
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
  sourceLabel?: string
  sourceUrl?: string
}

export async function previewProvidedBundleFile(filePath: string): Promise<BundlePreview> {
  return (await tipcClient.previewBundleWithConflicts({ filePath })) as BundlePreview
}

function getSelectedConflictCount(
  conflicts: BundlePreview["conflicts"] | undefined,
  components: BundleComponentsState,
  selectedItems: BundleItemSelectionState,
  keys: BundleComponentKey[] = COMPONENT_KEYS,
): number {
  if (!conflicts) return 0

  return keys.reduce((total, key) => {
    if (!components[key]) return total

    const selectedIds = new Set(getSelectedItemIds(selectedItems, key))
    return total + conflicts[key].filter((conflict) => selectedIds.has(conflict.id)).length
  }, 0)
}

function formatCount(label: string, count: number): string {
  return `${count} ${label}${count === 1 ? "" : "s"}`
}

function formatExpectedMemoryConflictOutcome(conflictCount: number): string | null {
  if (conflictCount === 0) return null
  return `${formatCount("existing memory", conflictCount)} will be skipped because memory imports are additive-only.`
}

function getConflictStrategyOverride(
  overrides: ConflictStrategyOverrideState,
  key: ConflictStrategyOverrideKey,
  id: string,
  defaultStrategy: ConflictStrategy,
): ConflictStrategy {
  return overrides[key]?.[id] ?? defaultStrategy
}

function formatRedactedSecretFields(fields: string[]): string {
  return fields.join(", ")
}

function getSelectedMcpServersRequiringConfiguration(
  bundle: BundlePreview["bundle"] | undefined,
  components: BundleComponentsState,
  selectedItems: BundleItemSelectionState,
): Array<{ name: string; redactedSecretFields: string[] }> {
  if (!components.mcpServers) return []

  const selectedNames = new Set(selectedItems.mcpServerNames)
  return (bundle?.mcpServers ?? [])
    .filter((server) => selectedNames.has(server.name) && (server.redactedSecretFields?.length ?? 0) > 0)
    .map((server) => ({
      name: server.name,
      redactedSecretFields: server.redactedSecretFields ?? [],
    }))
}

function getImportedMcpServersRequiringConfiguration(
  bundle: BundlePreview["bundle"] | undefined,
  result: BundleImportResult,
): string[] {
  const reconfigurationByServerName = new Map<string, true>(
    (bundle?.mcpServers ?? [])
      .filter((server) => (server.redactedSecretFields?.length ?? 0) > 0)
      .map((server) => [server.name, true] as const)
  )

  return result.mcpServers
    .filter((item) => !item.error && item.action !== "skipped" && reconfigurationByServerName.has(item.id))
    .map((item) => item.newId || item.name)
}

type ImportPlanAction = "add" | ConflictStrategy | "exclude"

interface ImportPlanItem {
  id: string
  name: string
  componentKey: BundleComponentKey
  existingName?: string
  action: ImportPlanAction
  selected: boolean
  renameTargetId?: string
}

function getBundleImportItems(
  bundle: BundlePreview["bundle"] | undefined,
  key: BundleComponentKey,
): Array<{ id: string; name: string }> {
  switch (key) {
    case "agentProfiles":
      return (bundle?.agentProfiles ?? []).map((profile) => ({
        id: profile.id,
        name: profile.displayName || profile.name,
      }))
    case "mcpServers":
      return (bundle?.mcpServers ?? []).map((server) => ({
        id: server.name,
        name: server.name,
      }))
    case "skills":
      return (bundle?.skills ?? []).map((skill) => ({
        id: skill.id,
        name: skill.name,
      }))
    case "repeatTasks":
      return (bundle?.repeatTasks ?? []).map((task) => ({
        id: task.id,
        name: task.name,
      }))
    case "memories":
      return (bundle?.memories ?? []).map((memory) => ({
        id: memory.id,
        name: memory.title,
      }))
  }
}

function buildImportPlanItems(
  preview: BundlePreview | null,
  key: BundleComponentKey,
  strategy: ConflictStrategy,
  conflictStrategyOverrides: ConflictStrategyOverrideState,
  selectedIds: string[],
): ImportPlanItem[] {
  const bundle = preview?.bundle
  const conflicts = new Map((preview?.conflicts?.[key] ?? []).map((conflict) => [conflict.id, conflict]))
  const selectedIdSet = new Set(selectedIds)
  const items = getBundleImportItems(bundle, key)

  return items.map((item) => {
    const conflict = conflicts.get(item.id)
    const selected = selectedIdSet.has(item.id)

    if (!selected) {
      return {
        ...item,
        componentKey: key,
        existingName: conflict?.existingName,
        action: "exclude",
        selected: false,
        renameTargetId: conflict?.renameTargetId,
      }
    }

    if (!conflict) {
      return {
        ...item,
        componentKey: key,
        action: "add",
        selected: true,
      }
    }

    const resolvedStrategy = key === "memories"
      ? "skip"
      : getConflictStrategyOverride(conflictStrategyOverrides, key as ConflictStrategyOverrideKey, item.id, strategy)

    if (key === "memories") {
      return {
        ...item,
        componentKey: key,
        existingName: conflict.existingName,
        action: "skip",
        selected: true,
      }
    }

    return {
      ...item,
      componentKey: key,
      existingName: conflict.existingName,
      action: resolvedStrategy,
      selected: true,
      renameTargetId: conflict.renameTargetId,
    }
  })
}

function summarizeSelectedConflictPlan(importPlanSections: Array<{ key: BundleComponentKey; items: ImportPlanItem[] }>): {
  skip: number
  overwrite: number
  rename: number
  memorySkips: number
} {
  const summary = { skip: 0, overwrite: 0, rename: 0, memorySkips: 0 }

  for (const section of importPlanSections) {
    for (const item of section.items) {
      if (!item.selected || !item.existingName) continue
      if (item.componentKey === "memories") {
        summary.memorySkips += 1
        continue
      }
      if (item.action === "skip") summary.skip += 1
      if (item.action === "overwrite") summary.overwrite += 1
      if (item.action === "rename") summary.rename += 1
    }
  }

  return summary
}

function formatExpectedConflictOutcome(summary: {
  skip: number
  overwrite: number
  rename: number
}): string | null {
  const parts = [
    summary.skip > 0 ? `${formatCount("existing item", summary.skip)} will be skipped.` : null,
    summary.overwrite > 0 ? `${formatCount("existing item", summary.overwrite)} will be overwritten.` : null,
    summary.rename > 0 ? `${formatCount("existing item", summary.rename)} will be imported with renamed IDs.` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(" ") : null
}

function getImportPlanActionBadgeLabel(action: ImportPlanAction): string {
  if (action === "add") return "Add new"
  if (action === "exclude") return "Excluded"
  if (action === "skip") return "Skip"
  if (action === "overwrite") return "Overwrite"
  return "Rename"
}

function getImportPlanActionBadgeClassName(action: ImportPlanAction): string | undefined {
  if (action === "add") return "border-emerald-300 text-emerald-700"
  if (action === "exclude") return "border-muted text-muted-foreground"
  if (action === "overwrite") return "border-amber-300 text-amber-700"
  if (action === "rename") return "border-sky-300 text-sky-700"
  return undefined
}

function formatImportPlanOutcome(item: ImportPlanItem): string {
  if (item.action === "exclude") {
    return "Will be skipped for this import. Existing items, if any, stay untouched."
  }

  if (item.action === "add") {
    return "Will be added as a new item."
  }

  if (item.action === "skip") {
    if (item.componentKey === "memories") {
      return "Will keep the existing memory and skip this bundle copy because memory imports are additive-only."
    }
    return "Will keep the existing item and skip this bundle copy."
  }

  if (item.action === "overwrite") {
    return "Will replace the existing item with the version from this bundle."
  }

  if (item.renameTargetId) {
    return `Will import alongside the existing item as ${item.renameTargetId}.`
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

function buildSourceOutcomeMessage(sourceLabel: string, sourceUrl?: string): string {
  if (!sourceUrl) return ""
  return ` ${sourceLabel}: ${sourceUrl}`
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
  sourceLabel = "Bundle source",
  sourceUrl,
}: BundleImportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<BundlePreview | null>(null)
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>("skip")
  const [components, setComponents] = useState<BundleComponentsState>(() => resolveComponents(initialComponents))
  const [selectedItems, setSelectedItems] = useState<BundleItemSelectionState>(() => createDefaultItemSelections())
  const [conflictStrategyOverrides, setConflictStrategyOverrides] = useState<ConflictStrategyOverrideState>(() => createDefaultConflictStrategyOverrides())
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
      setSelectedItems(createDefaultItemSelections())
      setConflictStrategyOverrides(createDefaultConflictStrategyOverrides())
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
    setSelectedItems(createDefaultItemSelections(fullResult.bundle))
    setConflictStrategyOverrides(createDefaultConflictStrategyOverrides())
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
        selectedItems,
        conflictStrategyOverrides,
      }) as BundleImportResult
      const backupMessage = result.backupFilePath
        ? ` Pre-import backup: ${result.backupFilePath}`
        : ""
      const sourceMessage = buildSourceOutcomeMessage(sourceLabel, sourceUrl)
      const importSummary = summarizeImportResult(result)
      const importedMcpServersRequiringConfiguration = getImportedMcpServersRequiringConfiguration(preview?.bundle, result)
      if (result.success) {
        const detailMessage = importSummary.detailSummary
          ? ` (${importSummary.detailSummary})`
          : ""
        toast.success(`Successfully ${successVerb} ${importSummary.outcomeLabel}.${detailMessage}${backupMessage}${sourceMessage}`)
        if (importedMcpServersRequiringConfiguration.length > 0) {
          toast.warning(
            `Reconfigure ${formatCount("MCP server", importedMcpServersRequiringConfiguration.length)} with <CONFIGURE_YOUR_KEY> placeholders in Settings → Capabilities: ${importedMcpServersRequiringConfiguration.join(", ")}.`
          )
        }
        onImportComplete()
        handleClose()
      } else {
        const detailMessage = importSummary.detailSummary
          ? ` Progress: ${importSummary.detailSummary}.`
          : ""
        toast.error(`${result.errors.join(", ") || "Import failed"}.${detailMessage}${backupMessage}${sourceMessage}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const sourceMessage = buildSourceOutcomeMessage(sourceLabel, sourceUrl)
      toast.error(`Import failed: ${errorMessage}.${sourceMessage}`)
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
    setSelectedItems(createDefaultItemSelections())
    setConflictStrategyOverrides(createDefaultConflictStrategyOverrides())
    onOpenChange(false)
  }

  const manifest = preview?.bundle?.manifest
  const conflicts = preview?.conflicts
  const selectedConflictCount = getSelectedConflictCount(conflicts, normalizedComponents, selectedItems)
  const hasConflicts = selectedConflictCount > 0
  const importPlanSections = COMPONENT_KEYS.map((key) => ({
    key,
    label: COMPONENT_LABELS[key],
    items: normalizedComponents[key]
      ? buildImportPlanItems(preview, key, conflictStrategy, conflictStrategyOverrides, getSelectedItemIds(selectedItems, key))
      : [],
  })).filter((section) => section.items.length > 0)
  const selectedConflictPlanSummary = summarizeSelectedConflictPlan(importPlanSections)
  const expectedConflictOutcome = formatExpectedConflictOutcome(selectedConflictPlanSummary)
  const expectedMemoryConflictOutcome = formatExpectedMemoryConflictOutcome(selectedConflictPlanSummary.memorySkips)
  const selectedPlanItemCount = importPlanSections.reduce(
    (total, section) => total + section.items.filter((item) => item.selected).length,
    0,
  )
  const selectedMcpServersRequiringConfiguration = getSelectedMcpServersRequiringConfiguration(
    preview?.bundle,
    normalizedComponents,
    selectedItems,
  )

  const toggleComponent = (key: keyof typeof components) => {
    setComponents(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleImportPlanItem = (key: BundleComponentKey, itemId: string) => {
    setSelectedItems((prev) => {
      const selectionKey = ITEM_SELECTION_KEYS[key]
      const currentIds = prev[selectionKey]
      const nextIds = currentIds.includes(itemId)
        ? currentIds.filter((id) => id !== itemId)
        : [...currentIds, itemId]

      return {
        ...prev,
        [selectionKey]: nextIds,
      }
    })
  }

  const setConflictOverride = (
    key: ConflictStrategyOverrideKey,
    itemId: string,
    nextStrategy: ConflictStrategy,
  ) => {
    setConflictStrategyOverrides((prev) => {
      const currentForKey = prev[key] ?? {}
      if (nextStrategy === conflictStrategy) {
        const { [itemId]: _removed, ...remainingForKey } = currentForKey
        if (Object.keys(remainingForKey).length === 0) {
          const { [key]: _removedKey, ...remaining } = prev
          return remaining
        }
        return { ...prev, [key]: remainingForKey }
      }

      return {
        ...prev,
        [key]: {
          ...currentForKey,
          [itemId]: nextStrategy,
        },
      }
    })
  }

  const setImportPlanSectionSelection = (key: BundleComponentKey, selected: boolean) => {
    setSelectedItems((prev) => {
      const selectionKey = ITEM_SELECTION_KEYS[key]
      const allIds = getBundleImportItems(preview?.bundle, key).map((item) => item.id)

      return {
        ...prev,
        [selectionKey]: selected ? allIds : [],
      }
    })
  }

  const importDisabled = !preview?.filePath || importing || loading || selectedPlanItemCount === 0

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

        {sourceUrl && (
          <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">{sourceLabel}</div>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 break-all text-primary underline underline-offset-2 hover:text-primary/80"
            >
              <span>{sourceUrl}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>
        )}

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

            {selectedMcpServersRequiringConfiguration.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                  <div className="space-y-2">
                    <Label>Credential reconfiguration required</Label>
                    <p className="text-xs text-muted-foreground">
                      {selectedMcpServersRequiringConfiguration.length === 1
                        ? "This selected MCP server contains redacted credentials and will import with "
                        : "These selected MCP servers contain redacted credentials and will import with "}
                      <span className="font-mono">&lt;CONFIGURE_YOUR_KEY&gt;</span>
                      {" placeholders. After import, open Settings → Capabilities and replace those placeholders before using the servers."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMcpServersRequiringConfiguration.map((server) => (
                        <Badge key={server.name} variant="outline" className="text-xs">
                          {server.name}
                          {server.redactedSecretFields.length > 0 && (
                            <span className="ml-1 text-muted-foreground">
                              · {formatRedactedSecretFields(server.redactedSecretFields)}
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Import plan */}
            {importPlanSections.length > 0 && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  {hasConflicts ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                  ) : (
                    <Package className="mt-0.5 h-4 w-4 text-emerald-600" />
                  )}
                  <div className="space-y-1">
                    <Label>Import plan</Label>
                    <p className="text-xs text-muted-foreground">
                      Review the exact items that will be added, skipped, overwritten, or renamed before importing anything. Memories always stay additive-only.
                    </p>
                  </div>
                </div>
                {hasConflicts ? (
                  <>
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
                      Choose the default policy for conflicting items, then override individual rows below when a bundle needs a mix of skip / overwrite / rename decisions.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No existing conflicts detected for the current selection. {formatCount("item", selectedPlanItemCount)} will be added as new items.
                  </p>
                )}
                {expectedConflictOutcome && (
                  <p className="text-xs text-muted-foreground">
                    Current selection: {expectedConflictOutcome}
                  </p>
                )}
                {expectedMemoryConflictOutcome && (
                  <p className="text-xs text-muted-foreground">
                    Memory selection: {expectedMemoryConflictOutcome}
                  </p>
                )}

                <div className="space-y-3">
                  {importPlanSections.map((section) => (
                    <ImportPlanSection
                      key={section.key}
                      label={section.label}
                      items={section.items}
                      defaultConflictStrategy={conflictStrategy}
                      selectedCount={section.items.filter((item) => item.selected).length}
                      onToggleItem={(itemId) => toggleImportPlanItem(section.key, itemId)}
                      onConflictStrategyChange={section.key === "memories"
                        ? undefined
                        : (itemId, nextStrategy) => setConflictOverride(section.key as ConflictStrategyOverrideKey, itemId, nextStrategy)}
                      onSelectAll={() => setImportPlanSectionSelection(section.key, true)}
                      onClearAll={() => setImportPlanSectionSelection(section.key, false)}
                    />
                  ))}
                </div>

                {selectedPlanItemCount === 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Select at least one item to import.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importDisabled}>
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

interface ImportPlanSectionProps {
  label: string
  items: ImportPlanItem[]
  defaultConflictStrategy: ConflictStrategy
  selectedCount: number
  onToggleItem: (itemId: string) => void
  onConflictStrategyChange?: (itemId: string, strategy: ConflictStrategy) => void
  onSelectAll: () => void
  onClearAll: () => void
}

function ImportPlanSection({
  label,
  items,
  defaultConflictStrategy,
  selectedCount,
  onToggleItem,
  onConflictStrategyChange,
  onSelectAll,
  onClearAll,
}: ImportPlanSectionProps) {
  const allSelected = items.length > 0 && selectedCount === items.length
  const noneSelected = selectedCount === 0

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Badge variant="secondary" className="text-xs">{items.length}</Badge>
        <Badge variant="outline" className="text-xs">{selectedCount} selected</Badge>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onSelectAll} disabled={allSelected}>
            Select all
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onClearAll} disabled={noneSelected}>
            Clear all
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const showExistingName = item.existingName && item.existingName !== item.name
          const canOverrideConflict = item.selected && Boolean(item.existingName) && item.componentKey !== "memories"
          const isUsingDefaultConflictStrategy = item.action === defaultConflictStrategy

          return (
            <div key={`${label}:${item.id}`} className="rounded-md border bg-muted/20 p-2">
              <div className="flex items-start gap-3">
                <Switch checked={item.selected} onCheckedChange={() => onToggleItem(item.id)} />
                <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">ID: {item.id}</p>
                    {showExistingName && (
                      <p className="truncate text-xs text-muted-foreground">
                        Existing name: {item.existingName}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs ${getImportPlanActionBadgeClassName(item.action) || ""}`.trim()}
                  >
                    {getImportPlanActionBadgeLabel(item.action)}
                  </Badge>
                </div>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {formatImportPlanOutcome(item)}
              </p>

              {canOverrideConflict && onConflictStrategyChange && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Conflict action</Label>
                  <Select value={item.action} onValueChange={(value) => onConflictStrategyChange(item.id, value as ConflictStrategy)}>
                    <SelectTrigger className="h-8 w-[210px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip existing item</SelectItem>
                      <SelectItem value="overwrite">Overwrite existing item</SelectItem>
                      <SelectItem value="rename">Rename imported item</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">
                    {isUsingDefaultConflictStrategy ? "Using import default" : "Overrides import default"}
                  </span>
                </div>
              )}

              {item.action === "rename" && item.renameTargetId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Renamed ID preview: <span className="font-mono">{item.renameTargetId}</span>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
