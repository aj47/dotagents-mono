import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@renderer/components/ui/dialog"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Textarea } from "@renderer/components/ui/textarea"
import { Badge } from "@renderer/components/ui/badge"
import { Loader2, Copy, Download, Globe, User, Tag, Info, AlertTriangle, FileJson } from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { copyTextToClipboard } from "@renderer/lib/clipboard"
import { buildHubBundleArtifactUrl, slugifyHubCatalogId, type HubPublishSubmission } from "@dotagents/shared"
import { toast } from "sonner"
import {
  BundleDetailedSelectionCard,
  EMPTY_BUNDLE_SELECTION,
  createDetailedBundleSelection,
  hasBundleComponentSelectionChanges,
  hasDetailedBundleSelectionChanges,
  type BundleComponentSelectionState,
  type BundleDetailedSelectionState,
} from "@renderer/components/bundle-selection"

interface PublishDialogProps { open: boolean; onOpenChange: (open: boolean) => void }
interface PublishForm { name: string; catalogId: string; artifactUrl: string; description: string; summary: string; authorName: string; authorHandle: string; authorUrl: string; tags: string }
interface PublishComponents extends BundleComponentSelectionState {}
interface PublishPreviewState { payloadJson: string; bundleJson: string; installUrl: string; submissionJson: string; catalogId: string }
const EMPTY: PublishForm = { name: "", catalogId: "", artifactUrl: "", description: "", summary: "", authorName: "", authorHandle: "", authorUrl: "", tags: "" }
const DEFAULT_PUBLISH_COMPONENTS: PublishComponents = { agentProfiles: true, mcpServers: true, skills: true, repeatTasks: false, memories: false }

function hasPublishFormChanges(form: PublishForm): boolean {
  return Object.values(form).some((value) => value.trim().length > 0)
}

function buildMeta(f: PublishForm) {
  return {
    summary: f.summary.trim(),
    author: { displayName: f.authorName.trim(), ...(f.authorHandle.trim() ? { handle: f.authorHandle.trim() } : {}), ...(f.authorUrl.trim() ? { url: f.authorUrl.trim() } : {}) },
    tags: f.tags.split(",").map(t => t.trim()).filter(Boolean),
  }
}

function getDraftCatalogId(f: PublishForm): string {
  return slugifyHubCatalogId(f.catalogId.trim() || f.name.trim())
}

function getDraftArtifactUrl(f: PublishForm): string {
  return f.artifactUrl.trim() || buildHubBundleArtifactUrl(getDraftCatalogId(f))
}

export function BundlePublishDialog({ open, onOpenChange }: PublishDialogProps) {
  const [step, setStep] = useState<"metadata" | "preview">("metadata")
  const [form, setForm] = useState<PublishForm>({ ...EMPTY })
  const [components, setComponents] = useState<PublishComponents>({ ...DEFAULT_PUBLISH_COMPONENTS })
  const [selection, setSelection] = useState<BundleDetailedSelectionState>({ ...EMPTY_BUNDLE_SELECTION })
  const [selectionBaseline, setSelectionBaseline] = useState<BundleDetailedSelectionState | null>(null)
  const [selectionInitialized, setSelectionInitialized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savingBundle, setSavingBundle] = useState(false)
  const [savingSubmission, setSavingSubmission] = useState(false)
  const [preview, setPreview] = useState<PublishPreviewState | null>(null)
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

  const isBusy = loading || savingBundle || savingSubmission
  const isPublishDirty = hasPublishFormChanges(form)
    || hasBundleComponentSelectionChanges(components, DEFAULT_PUBLISH_COMPONENTS)
    || hasDetailedBundleSelectionChanges(selection, selectionBaseline || EMPTY_BUNDLE_SELECTION)
    || preview !== null
  const discardMessage = preview
    ? "Discard this Hub publish draft? Your selected items, metadata, and generated preview will be lost."
    : "Discard this Hub publish draft? Your selected items and metadata will be lost."
  const draftNotice = preview
    ? "You have unsaved publish work. Save the bundle or Hub package before closing if you still need this generated preview."
    : "You have unsaved publish details. Generate the preview or save files before closing to keep this draft."

  const closeDialog = () => {
    setStep("metadata")
    setForm({ ...EMPTY })
    setComponents({ ...DEFAULT_PUBLISH_COMPONENTS })
    setSelection({ ...EMPTY_BUNDLE_SELECTION })
    setSelectionBaseline(null)
    setSelectionInitialized(false)
    setLoading(false)
    setSavingBundle(false)
    setSavingSubmission(false)
    setPreview(null)
    onOpenChange(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }

    if (isBusy) return
    if (isPublishDirty && !confirm(discardMessage)) return

    closeDialog()
  }
  const ok = !!(form.name.trim() && form.summary.trim() && form.authorName.trim() && exportableItemsQuery.data)
  const copy = async (t: string, l: string) => { try { await copyTextToClipboard(t); toast.success(`${l} copied`) } catch { toast.error("Copy failed") } }
  const generate = async () => {
    setLoading(true)
    try {
      const r = await tipcClient.generatePublishPayload({
        name: form.name.trim(),
        catalogId: form.catalogId.trim() || undefined,
        artifactUrl: form.artifactUrl.trim() || undefined,
        description: form.description.trim() || undefined,
        publicMetadata: buildMeta(form),
        components,
        agentProfileIds: selection.agentProfileIds,
        mcpServerNames: selection.mcpServerNames,
        skillIds: selection.skillIds,
        repeatTaskIds: selection.repeatTaskIds,
        memoryIds: selection.memoryIds,
      })
      const submission: HubPublishSubmission = {
        source: "dotagents-desktop",
        version: 1,
        payload: r,
      }
      setPreview({
        payloadJson: JSON.stringify(r.catalogItem, null, 2),
        bundleJson: r.bundleJson,
        installUrl: r.installUrl,
        submissionJson: JSON.stringify(submission, null, 2),
        catalogId: r.catalogItem.id,
      }); setStep("preview")
    } catch (e) { toast.error(`Failed: ${e instanceof Error ? e.message : String(e)}`) } finally { setLoading(false) }
  }
  const saveFile = async () => {
    setSavingBundle(true)
    try {
      const r = await tipcClient.exportBundle({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        publicMetadata: buildMeta(form),
        components,
        agentProfileIds: selection.agentProfileIds,
        mcpServerNames: selection.mcpServerNames,
        skillIds: selection.skillIds,
        repeatTaskIds: selection.repeatTaskIds,
        memoryIds: selection.memoryIds,
      })
      if (r.success) toast.success("Bundle saved"); else if (r.canceled) toast.message("Canceled"); else toast.error(r.error || "Failed")
    } catch (e) { toast.error(`Save failed: ${e instanceof Error ? e.message : String(e)}`) }
    finally { setSavingBundle(false) }
  }
  const saveSubmissionFile = async () => {
    if (!preview) return
    setSavingSubmission(true)
    try {
      const r = await tipcClient.saveHubPublishPayloadFile({
        catalogId: preview.catalogId,
        payloadJson: preview.submissionJson,
      })
      if (r.success) toast.success("Hub publish package saved")
      else if (r.canceled) toast.message("Canceled")
      else toast.error("Failed to save Hub publish package")
    } catch (e) { toast.error(`Save failed: ${e instanceof Error ? e.message : String(e)}`) }
    finally { setSavingSubmission(false) }
  }
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />{step === "metadata" ? "Export for Hub" : "Hub Export Preview"}</DialogTitle>
          <DialogDescription>{step === "metadata" ? "Choose what goes into the public artifact, then add listing metadata. Enabled content is public." : "Review the generated payload, artifact URL, install link, and submission package. Saving here prepares files for Hub submission but does not upload them yet."}</DialogDescription>
        </DialogHeader>
        {isPublishDirty && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
            {draftNotice}
          </div>
        )}
        {step === "metadata" ? (
          <>
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 flex gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">Anything enabled below becomes part of the public <code>.dotagents</code> artifact and publish handoff. Memories and repeat tasks are off by default. API keys and secrets are stripped automatically, but enabled content is still public. If you leave listing ID or artifact URL blank, DotAgents derives Hub-friendly defaults for you.</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 flex gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">DotAgents does not upload to the Hub yet. This flow prepares a sanitized bundle and submission metadata. Before sharing the install link, make sure the final <code>.dotagents</code> file is actually hosted at the artifact URL you plan to publish.</p>
              </div>
              <Fields form={form} set={setForm} />
              <BundleDetailedSelectionCard
                items={exportableItemsQuery.data}
                loading={exportableItemsQuery.isLoading}
                loadError={exportableItemsQuery.error instanceof Error ? exportableItemsQuery.error.message : null}
                components={components}
                setComponents={setComponents}
                selection={selection}
                setSelection={setSelection}
                title="Public artifact contents"
                description="Choose exactly which public items are included in the shared artifact and handoff metadata."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isBusy}>Cancel</Button>
              <Button onClick={generate} disabled={!ok || isBusy || exportableItemsQuery.isLoading || !!exportableItemsQuery.error} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Generate Payload</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <PreviewBadges json={preview?.payloadJson || ""} />
              <SubmissionChecklist />
              <PreviewLinks json={preview?.payloadJson || ""} installUrl={preview?.installUrl || ""} onCopy={copy} />
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Catalog Metadata (JSON)</Label>
                <div className="relative">
                  <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-auto max-h-[300px] border">{preview?.payloadJson || ""}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-7 gap-1" onClick={() => copy(preview?.payloadJson || "", "Catalog metadata")}><Copy className="h-3.5 w-3.5" /> Copy</Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Hub Submission Package (JSON)</Label>
                <div className="relative">
                  <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-auto max-h-[220px] border">{preview?.submissionJson || ""}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-7 gap-1" onClick={() => copy(preview?.submissionJson || "", "Submission package")}><Copy className="h-3.5 w-3.5" /> Copy</Button>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("metadata")} disabled={isBusy}>← Back</Button>
              <Button variant="outline" className="gap-2" onClick={saveSubmissionFile} disabled={isBusy}>{savingSubmission ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />} {savingSubmission ? "Saving Hub Package..." : "Save Hub Package"}</Button>
              <Button variant="outline" className="gap-2" onClick={() => copy(preview?.bundleJson || "", "Bundle JSON")} disabled={isBusy}><Copy className="h-4 w-4" /> Copy Bundle</Button>
              <Button className="gap-2" onClick={saveFile} disabled={isBusy}>{savingBundle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {savingBundle ? "Saving .dotagents File..." : "Save .dotagents File"}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SubmissionChecklist() {
  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900 dark:bg-amber-950/20">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-100">
        <AlertTriangle className="h-4 w-4" />
        Before publishing to Hub
      </div>
      <ul className="list-disc pl-5 text-xs text-amber-800 dark:text-amber-200 space-y-1">
        <li>Save the <code>.dotagents</code> bundle and upload/host it at the artifact URL.</li>
        <li>Use the Hub submission package JSON as the metadata handoff for the Hub workflow.</li>
        <li>Test the desktop install link after the bundle is hosted.</li>
      </ul>
    </div>
  )
}

function PreviewBadges({ json }: { json: string }) {
  let p: Record<string, unknown> = {}; try { p = JSON.parse(json) } catch {}
  const c = (p.componentCounts || {}) as Record<string, number>
  const a = (p.artifact || {}) as Record<string, unknown>
  return (
    <div className="flex flex-wrap gap-1.5">
      {p.id && <Badge variant="outline" className="text-xs">id: {String(p.id)}</Badge>}
      {Object.entries(c).map(([k, v]) => v > 0 && <Badge key={k} variant="secondary" className="text-xs">{v} {k}</Badge>)}
      {a.sizeBytes && <Badge variant="outline" className="text-xs">{((a.sizeBytes as number) / 1024).toFixed(1)} KB</Badge>}
    </div>
  )
}

function PreviewLinks({ json, installUrl, onCopy }: { json: string; installUrl: string; onCopy: (text: string, label: string) => Promise<void> }) {
  let p: Record<string, unknown> = {}; try { p = JSON.parse(json) } catch {}
  const artifactUrl = typeof (p.artifact as Record<string, unknown> | undefined)?.url === "string"
    ? String((p.artifact as Record<string, unknown>).url)
    : ""
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <PreviewLinkRow label="Artifact URL" value={artifactUrl} onCopy={onCopy} copyLabel="Artifact URL" />
      <PreviewLinkRow label="Desktop Install Link" value={installUrl} onCopy={onCopy} copyLabel="Install link" />
    </div>
  )
}

function PreviewLinkRow({ label, value, onCopy, copyLabel }: { label: string; value: string; onCopy: (text: string, label: string) => Promise<void>; copyLabel: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input value={value} readOnly className="h-8 text-xs font-mono" />
        <Button variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => onCopy(value, copyLabel)}><Copy className="h-3.5 w-3.5" /> Copy</Button>
      </div>
    </div>
  )
}

function Fields({ form, set }: { form: PublishForm; set: (f: PublishForm) => void }) {
  const derivedCatalogId = getDraftCatalogId(form)
  const derivedArtifactUrl = getDraftArtifactUrl(form)
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="pub-name" className="text-sm font-medium">Bundle Name <span className="text-destructive">*</span></Label>
        <Input id="pub-name" value={form.name} onChange={e => set({ ...form, name: e.target.value })} placeholder="My Agent Setup" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pub-id">Listing ID (optional)</Label>
          <Input id="pub-id" value={form.catalogId} onChange={e => set({ ...form, catalogId: e.target.value })} placeholder={derivedCatalogId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pub-artifact-url">Artifact URL (optional)</Label>
          <Input id="pub-artifact-url" value={form.artifactUrl} onChange={e => set({ ...form, artifactUrl: e.target.value })} placeholder={derivedArtifactUrl} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pub-summary" className="text-sm font-medium">Summary <span className="text-destructive">*</span></Label>
        <Input id="pub-summary" value={form.summary} onChange={e => set({ ...form, summary: e.target.value })} placeholder="A short description for the Hub listing" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pub-desc">Description (optional)</Label>
        <Textarea id="pub-desc" value={form.description} onChange={e => set({ ...form, description: e.target.value })} placeholder="Detailed description..." rows={3} />
      </div>
      <div className="border-t pt-3 space-y-3">
        <Label className="flex items-center gap-1.5 text-sm font-medium"><User className="h-3.5 w-3.5" /> Author</Label>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1"><Label htmlFor="pub-author" className="text-xs">Name <span className="text-destructive">*</span></Label><Input id="pub-author" value={form.authorName} onChange={e => set({ ...form, authorName: e.target.value })} placeholder="Your Name" className="h-8 text-sm" /></div>
          <div className="space-y-1"><Label htmlFor="pub-handle" className="text-xs">Handle</Label><Input id="pub-handle" value={form.authorHandle} onChange={e => set({ ...form, authorHandle: e.target.value })} placeholder="@handle" className="h-8 text-sm" /></div>
          <div className="space-y-1"><Label htmlFor="pub-url" className="text-xs">URL</Label><Input id="pub-url" value={form.authorUrl} onChange={e => set({ ...form, authorUrl: e.target.value })} placeholder="https://..." className="h-8 text-sm" /></div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pub-tags" className="flex items-center gap-1.5 text-sm font-medium"><Tag className="h-3.5 w-3.5" /> Tags</Label>
        <Input id="pub-tags" value={form.tags} onChange={e => set({ ...form, tags: e.target.value })} placeholder="coding, react, productivity (comma-separated)" />
      </div>
    </div>
  )
}