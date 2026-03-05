import { useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@renderer/components/ui/dialog"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Textarea } from "@renderer/components/ui/textarea"
import { Badge } from "@renderer/components/ui/badge"
import { Loader2, Copy, Download, Globe, User, Tag, Info } from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { toast } from "sonner"

interface PublishDialogProps { open: boolean; onOpenChange: (open: boolean) => void }
interface PublishForm { name: string; description: string; summary: string; authorName: string; authorHandle: string; authorUrl: string; tags: string }
const EMPTY: PublishForm = { name: "", description: "", summary: "", authorName: "", authorHandle: "", authorUrl: "", tags: "" }

function buildMeta(f: PublishForm) {
  return {
    summary: f.summary.trim(),
    author: { displayName: f.authorName.trim(), ...(f.authorHandle.trim() ? { handle: f.authorHandle.trim() } : {}), ...(f.authorUrl.trim() ? { url: f.authorUrl.trim() } : {}) },
    tags: f.tags.split(",").map(t => t.trim()).filter(Boolean),
  }
}

export function BundlePublishDialog({ open, onOpenChange }: PublishDialogProps) {
  const [step, setStep] = useState<"metadata" | "preview">("metadata")
  const [form, setForm] = useState<PublishForm>({ ...EMPTY })
  const [loading, setLoading] = useState(false)
  const [payloadJson, setPayloadJson] = useState("")
  const [bundleJson, setBundleJson] = useState("")
  const close = (v: boolean) => { if (!v) { setStep("metadata"); setForm({ ...EMPTY }); setPayloadJson(""); setBundleJson("") }; onOpenChange(v) }
  const ok = !!(form.name.trim() && form.summary.trim() && form.authorName.trim())
  const copy = async (t: string, l: string) => { try { await navigator.clipboard.writeText(t); toast.success(`${l} copied`) } catch { toast.error("Copy failed") } }
  const generate = async () => {
    setLoading(true)
    try {
      const r = await tipcClient.generatePublishPayload({ name: form.name.trim(), description: form.description.trim() || undefined, publicMetadata: buildMeta(form) })
      setPayloadJson(JSON.stringify(r.catalogItem, null, 2)); setBundleJson(r.bundleJson); setStep("preview")
    } catch (e) { toast.error(`Failed: ${e instanceof Error ? e.message : String(e)}`) } finally { setLoading(false) }
  }
  const saveFile = async () => {
    try {
      const r = await tipcClient.exportBundle({ name: form.name.trim(), description: form.description.trim() || undefined, publicMetadata: buildMeta(form) })
      if (r.success) toast.success("Bundle saved"); else if (r.canceled) toast.message("Canceled"); else toast.error(r.error || "Failed")
    } catch (e) { toast.error(`Save failed: ${e instanceof Error ? e.message : String(e)}`) }
  }
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />{step === "metadata" ? "Publish to Hub" : "Publish Payload Preview"}</DialogTitle>
          <DialogDescription>{step === "metadata" ? "Enter metadata for your Hub listing. This information will be public." : "Review the generated payload. Copy metadata or save the bundle."}</DialogDescription>
        </DialogHeader>
        {step === "metadata" ? (
          <>
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 flex gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">Only agent configurations, skills, and non-secret settings are included. API keys and secrets are automatically stripped.</p>
              </div>
              <Fields form={form} set={setForm} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
              <Button onClick={generate} disabled={!ok || loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Generate Payload</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <PreviewBadges json={payloadJson} />
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Catalog Metadata (JSON)</Label>
                <div className="relative">
                  <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-auto max-h-[300px] border">{payloadJson}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-7 gap-1" onClick={() => copy(payloadJson, "Catalog metadata")}><Copy className="h-3.5 w-3.5" /> Copy</Button>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("metadata")}>← Back</Button>
              <Button variant="outline" className="gap-2" onClick={() => copy(bundleJson, "Bundle JSON")}><Copy className="h-4 w-4" /> Copy Bundle</Button>
              <Button className="gap-2" onClick={saveFile}><Download className="h-4 w-4" /> Save .dotagents File</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PreviewBadges({ json }: { json: string }) {
  let p: Record<string, unknown> = {}; try { p = JSON.parse(json) } catch {}
  const c = (p.componentCounts || {}) as Record<string, number>
  const a = (p.artifact || {}) as Record<string, unknown>
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(c).map(([k, v]) => v > 0 && <Badge key={k} variant="secondary" className="text-xs">{v} {k}</Badge>)}
      {a.sizeBytes && <Badge variant="outline" className="text-xs">{((a.sizeBytes as number) / 1024).toFixed(1)} KB</Badge>}
    </div>
  )
}

function Fields({ form, set }: { form: PublishForm; set: (f: PublishForm) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="pub-name" className="text-sm font-medium">Bundle Name <span className="text-destructive">*</span></Label>
        <Input id="pub-name" value={form.name} onChange={e => set({ ...form, name: e.target.value })} placeholder="My Agent Setup" />
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

