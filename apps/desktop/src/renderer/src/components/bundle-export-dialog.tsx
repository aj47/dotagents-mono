import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@renderer/components/ui/dialog"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Textarea } from "@renderer/components/ui/textarea"
import { Download, AlertTriangle } from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { toast } from "sonner"
import {
  BundleDetailedSelectionCard,
  DEFAULT_EXPORT_COMPONENTS,
  EMPTY_BUNDLE_SELECTION,
  createDetailedBundleSelection,
  hasBundleComponentSelectionChanges,
  hasDetailedBundleSelectionChanges,
  type BundleComponentSelectionState,
  type BundleDetailedSelectionState,
} from "@renderer/components/bundle-selection"

interface BundleExportDialogProps { open: boolean; onOpenChange: (open: boolean) => void }
interface ExportForm { name: string; description: string }

const EMPTY: ExportForm = { name: "", description: "" }

function hasExportDraftChanges(
  form: ExportForm,
  components: BundleComponentSelectionState,
  selection: BundleDetailedSelectionState,
  selectionBaseline: BundleDetailedSelectionState | null,
): boolean {
  return !!(form.name.trim() || form.description.trim())
    || hasBundleComponentSelectionChanges(components, DEFAULT_EXPORT_COMPONENTS)
    || hasDetailedBundleSelectionChanges(selection, selectionBaseline || EMPTY_BUNDLE_SELECTION)
}

export function BundleExportDialog({ open, onOpenChange }: BundleExportDialogProps) {
  const [form, setForm] = useState<ExportForm>({ ...EMPTY })
  const [components, setComponents] = useState<BundleComponentSelectionState>({ ...DEFAULT_EXPORT_COMPONENTS })
  const [selection, setSelection] = useState<BundleDetailedSelectionState>({ ...EMPTY_BUNDLE_SELECTION })
  const [selectionBaseline, setSelectionBaseline] = useState<BundleDetailedSelectionState | null>(null)
  const [selectionInitialized, setSelectionInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const exportableItemsQuery = useQuery({
    queryKey: ["bundle-exportable-items"],
    queryFn: () => tipcClient.getBundleExportableItems(),
    enabled: open,
  })

  useEffect(() => {
    if (!open || !exportableItemsQuery.data || selectionInitialized) return
    const initialSelection = createDetailedBundleSelection(exportableItemsQuery.data)
    setSelection(initialSelection)
    setSelectionBaseline(initialSelection)
    setSelectionInitialized(true)
  }, [open, exportableItemsQuery.data, selectionInitialized])

  const isExportDirty = hasExportDraftChanges(form, components, selection, selectionBaseline)

  const closeDialog = () => {
    setForm({ ...EMPTY })
    setComponents({ ...DEFAULT_EXPORT_COMPONENTS })
    setSelection({ ...EMPTY_BUNDLE_SELECTION })
    setSelectionBaseline(null)
    setSelectionInitialized(false)
    setSaving(false)
    onOpenChange(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }

    if (saving) return
    if (isExportDirty && !confirm("Discard this bundle export draft? Your selected items and metadata will be lost.")) return

    closeDialog()
  }

  const saveBundle = async () => {
    setSaving(true)
    try {
      const result = await tipcClient.exportBundle({
        name: form.name.trim() || undefined,
        description: form.description.trim() || undefined,
        components,
        agentProfileIds: selection.agentProfileIds,
        mcpServerNames: selection.mcpServerNames,
        skillIds: selection.skillIds,
        repeatTaskIds: selection.repeatTaskIds,
        memoryIds: selection.memoryIds,
      })
      if (result.success) {
        toast.success("Bundle exported successfully")
        closeDialog()
      } else if (result.canceled) {
        toast.message("Bundle export canceled")
      } else {
        toast.error(result.error || "Failed to export bundle")
      }
    } catch (error) {
      toast.error(`Failed to export bundle: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Export Bundle</DialogTitle>
          <DialogDescription>Choose what to include in the local <code>.dotagents</code> export before saving the bundle.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {isExportDirty && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
              You have unsaved export changes. Save the bundle before closing to keep this selection and metadata.
            </div>
          )}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200 flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Secrets are stripped automatically, but any included memories, repeat tasks, and other content are saved into the exported bundle file.</p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="export-name">Bundle Name (optional)</Label>
              <Input id="export-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My Agent Setup" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="export-description">Description (optional)</Label>
              <Textarea id="export-description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What this bundle contains..." rows={3} />
            </div>
          </div>
          <BundleDetailedSelectionCard
            items={exportableItemsQuery.data}
            loading={exportableItemsQuery.isLoading}
            loadError={exportableItemsQuery.error instanceof Error ? exportableItemsQuery.error.message : null}
            components={components}
            setComponents={setComponents}
            selection={selection}
            setSelection={setSelection}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button
            onClick={saveBundle}
            disabled={saving || exportableItemsQuery.isLoading || !!exportableItemsQuery.error}
            className="gap-2"
          >
            <Download className="h-4 w-4" />Save .dotagents File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}