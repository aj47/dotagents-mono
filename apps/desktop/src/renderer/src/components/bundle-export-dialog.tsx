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
  getBundleMemorySecretWarnings,
  type BundleComponentSelectionState,
  type BundleDetailedSelectionState,
} from "@renderer/components/bundle-selection"

interface BundleExportDialogProps { open: boolean; onOpenChange: (open: boolean) => void }
interface ExportForm { name: string; description: string }

const EMPTY: ExportForm = { name: "", description: "" }

function formatMemoryWarningFields(fields: Array<"content" | "keyFindings" | "userNotes">): string {
  return fields.map((field) => {
    if (field === "keyFindings") return "key findings"
    if (field === "userNotes") return "user notes"
    return field
  }).join(", ")
}

export function BundleExportDialog({ open, onOpenChange }: BundleExportDialogProps) {
  const [form, setForm] = useState<ExportForm>({ ...EMPTY })
  const [components, setComponents] = useState<BundleComponentSelectionState>({ ...DEFAULT_EXPORT_COMPONENTS })
  const [selection, setSelection] = useState<BundleDetailedSelectionState>({ ...EMPTY_BUNDLE_SELECTION })
  const [selectionInitialized, setSelectionInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const exportableItemsQuery = useQuery({
    queryKey: ["bundle-exportable-items"],
    queryFn: () => tipcClient.getBundleExportableItems(),
    enabled: open,
  })

  useEffect(() => {
    if (!open || !exportableItemsQuery.data || selectionInitialized) return
    setSelection(createDetailedBundleSelection(exportableItemsQuery.data))
    setSelectionInitialized(true)
  }, [open, exportableItemsQuery.data, selectionInitialized])

  const memorySecretWarnings = getBundleMemorySecretWarnings(exportableItemsQuery.data, components, selection)

  const close = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm({ ...EMPTY })
      setComponents({ ...DEFAULT_EXPORT_COMPONENTS })
      setSelection({ ...EMPTY_BUNDLE_SELECTION })
      setSelectionInitialized(false)
      setSaving(false)
    }
    onOpenChange(nextOpen)
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
        close(false)
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
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Export Bundle</DialogTitle>
          <DialogDescription>Choose what to include in the local <code>.dotagents</code> export before saving the bundle.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200 flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Secrets are stripped automatically, but any included memories, repeat tasks, and other content are saved into the exported bundle file.</p>
          </div>
          {memorySecretWarnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-2">
                  <p>
                    Potential secret-like text was detected in {memorySecretWarnings.length} selected memor{memorySecretWarnings.length === 1 ? "y" : "ies"}. Review them before exporting because bundle files include memory text as-is.
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    {memorySecretWarnings.map((warning) => (
                      <li key={warning.id}>
                        <span className="font-medium">{warning.title}</span> ({formatMemoryWarningFields(warning.fields)})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
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
          <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
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