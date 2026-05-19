import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FilePlus2,
  FileText,
  FolderOpen,
  FolderPlus,
  FolderUp,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { MarkdownRenderer } from "./markdown-renderer"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

type SessionFileRoot = { path: string; label: string }
type SessionFileEntry = { path: string; relativePath: string; name: string; kind: "file" | "directory"; size?: number; modifiedAt: number }
type SessionFileListing = { entries: SessionFileEntry[]; totalEntries: number; limit: number; truncated: boolean }
type SessionFileActivityKind = "read" | "edited"
type SessionFileActivity = { path: string; rootPath: string; relativePath: string; kind: SessionFileActivityKind; source: string; lastSeenAt: number }
type SessionFilePreview = {
  path: string
  relativePath: string
  name: string
  kind: "directory" | "text" | "markdown" | "image" | "binary"
  size: number
  modifiedAt: number
  content?: string
  dataUrl?: string
  truncated?: boolean
}
type FileDialogState =
  | { mode: "create-file" | "create-folder" | "move"; value: string }
  | { mode: "delete" }

const normalizePath = (value?: string | null) => (value ?? "").replace(/\\/g, "/")
const normalizeRelativePath = (value?: string | null) => normalizePath(value).replace(/^\/+/, "").replace(/\/$/, "")

function getRelativePath(rootPath: string, targetPath?: string | null) {
  const normalizedRoot = normalizePath(rootPath).replace(/\/$/, "")
  const normalizedTarget = normalizePath(targetPath)
  if (!normalizedTarget || normalizedTarget === normalizedRoot) return "."
  if (normalizedTarget.startsWith(`${normalizedRoot}/`)) return normalizedTarget.slice(normalizedRoot.length + 1)
  return normalizedTarget
}

function isWithinRootPath(rootPath: string, targetPath?: string | null) {
  const normalizedRoot = normalizePath(rootPath).replace(/\/$/, "")
  const normalizedTarget = normalizePath(targetPath)
  return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}/`)
}

function getParentRelativePath(relativePath?: string | null) {
  const normalized = normalizeRelativePath(relativePath)
  if (!normalized || normalized === ".") return ""
  const segments = normalized.split("/")
  segments.pop()
  return segments.join("/")
}

function buildDefaultCreatePath(baseRelativePath: string, kind: "file" | "directory") {
  const name = kind === "file" ? "new-file.txt" : "new-folder"
  return normalizeRelativePath(baseRelativePath) ? `${normalizeRelativePath(baseRelativePath)}/${name}` : name
}

function formatTimestamp(value: number) {
  return new Date(value).toLocaleString()
}

function formatBytes(size?: number) {
  if (typeof size !== "number" || Number.isNaN(size)) return "—"
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function SessionFileView({ sessionId, conversationId, className }: { sessionId?: string | null; conversationId?: string | null; className?: string }) {
  const [roots, setRoots] = useState<SessionFileRoot[]>([])
  const [isLoadingRoots, setIsLoadingRoots] = useState(false)
  const [rootsError, setRootsError] = useState<string | null>(null)
  const [selectedRootPath, setSelectedRootPath] = useState<string>("")
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [expandedDirectories, setExpandedDirectories] = useState<Record<string, boolean>>({})
  const [listingsByDirectory, setListingsByDirectory] = useState<Record<string, SessionFileListing>>({})
  const [fileActivity, setFileActivity] = useState<SessionFileActivity[]>([])
  const [loadingDirectories, setLoadingDirectories] = useState<Record<string, boolean>>({})
  const [preview, setPreview] = useState<SessionFilePreview | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [dialogState, setDialogState] = useState<FileDialogState | null>(null)
  const [isSubmittingDialog, setIsSubmittingDialog] = useState(false)

  const currentRoot = useMemo(
    () => roots.find((root) => root.path === selectedRootPath) ?? roots[0] ?? null,
    [roots, selectedRootPath],
  )
  const selectedRelativePath = currentRoot ? getRelativePath(currentRoot.path, selectedPath) : "."
  const selectedDirectoryBase = preview?.kind === "directory"
    ? preview.relativePath
    : getParentRelativePath(selectedRelativePath)

  const loadRoots = useCallback(async () => {
    if (!sessionId) {
      setRoots([])
      setSelectedRootPath("")
      setSelectedPath(null)
      setPreview(null)
      setRootsError(null)
      setFileActivity([])
      return
    }

    setIsLoadingRoots(true)
    setRootsError(null)
    try {
      const nextRoots = sessionId.startsWith("pending-") && conversationId
        ? await tipcClient.hydrateConversationFileActivity({ sessionId, conversationId }) as SessionFileRoot[]
        : await tipcClient.getTrackedSessionFileRoots({ sessionId }) as SessionFileRoot[]
      const nextActivity = await tipcClient.getTrackedSessionFileActivity({ sessionId }) as SessionFileActivity[]
      setRoots(nextRoots)
      setFileActivity(nextActivity)
      setSelectedRootPath((current) => nextRoots.some((root) => root.path === current) ? current : (nextRoots[0]?.path ?? ""))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load session files"
      setRootsError(message)
      setRoots([])
      setSelectedRootPath("")
      setFileActivity([])
    } finally {
      setIsLoadingRoots(false)
    }
  }, [conversationId, sessionId])

  useEffect(() => {
    if (!sessionId?.startsWith("pending-")) return undefined
    return () => {
      void tipcClient.clearTrackedSessionFileActivity({ sessionId }).catch((error: unknown) => {
        console.warn("Failed to clear temporary session file roots", error)
      })
    }
  }, [sessionId])

  const refreshFileActivity = useCallback(async () => {
    if (!sessionId) return
    try {
      setFileActivity(await tipcClient.getTrackedSessionFileActivity({ sessionId }) as SessionFileActivity[])
    } catch {
      // File activity is supplemental; keep the browser usable if it cannot load.
    }
  }, [sessionId])

  const loadDirectory = useCallback(async (directoryPath: string, options?: { force?: boolean }) => {
    if (!sessionId || !currentRoot) return
    if (!options?.force && listingsByDirectory[directoryPath]) return

    setLoadingDirectories((current) => ({ ...current, [directoryPath]: true }))
    try {
      const result = await tipcClient.listTrackedSessionFiles({
        sessionId,
        rootPath: currentRoot.path,
        directoryPath,
      }) as SessionFileEntry[] | SessionFileListing
      const listing = Array.isArray(result)
        ? { entries: result, totalEntries: result.length, limit: result.length, truncated: false }
        : result
      setListingsByDirectory((current) => ({ ...current, [directoryPath]: listing }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to list files")
    } finally {
      setLoadingDirectories((current) => ({ ...current, [directoryPath]: false }))
    }
  }, [currentRoot, listingsByDirectory, sessionId])

  const refreshLoadedDirectories = useCallback(async () => {
    if (!currentRoot) return
    const targets = Object.keys(listingsByDirectory)
      .filter((directoryPath) => isWithinRootPath(currentRoot.path, directoryPath))
      .filter((directoryPath) => directoryPath === currentRoot.path || expandedDirectories[directoryPath])
      .filter((directoryPath, index, values) => values.indexOf(directoryPath) === index)
    // Use allSettled so a single failing reload (e.g. a directory that was
    // just deleted or moved) cannot reject the whole refresh and make the
    // caller treat a successful filesystem mutation as a failure.
    await Promise.allSettled(targets.map((directoryPath) => loadDirectory(directoryPath, { force: true })))
  }, [currentRoot, listingsByDirectory, expandedDirectories, loadDirectory])

  useEffect(() => {
    setListingsByDirectory({})
    setExpandedDirectories({})
    setPreview(null)
    setPreviewError(null)
    void loadRoots()
  }, [loadRoots])

  useEffect(() => {
    if (!currentRoot) {
      setSelectedPath(null)
      return
    }
    setExpandedDirectories((current) => ({ ...current, [currentRoot.path]: true }))
    if (!selectedPath || !isWithinRootPath(currentRoot.path, selectedPath)) {
      setSelectedPath(currentRoot.path)
    }
    void loadDirectory(currentRoot.path)
  }, [currentRoot, loadDirectory, selectedPath])

  useEffect(() => {
    if (!sessionId || !currentRoot || !selectedPath) {
      setPreview(null)
      setPreviewError(null)
      return undefined
    }

    let cancelled = false
    setIsLoadingPreview(true)
    setPreviewError(null)
    void tipcClient.readTrackedSessionFilePreview({
      sessionId,
      rootPath: currentRoot.path,
      filePath: selectedPath,
    }).then((nextPreview: SessionFilePreview) => {
      if (!cancelled) {
        setPreview(nextPreview)
        void refreshFileActivity()
      }
    }).catch((error: unknown) => {
      if (!cancelled) {
        setPreview(null)
        setPreviewError(error instanceof Error ? error.message : "Failed to load file preview")
      }
    }).finally(() => {
      if (!cancelled) setIsLoadingPreview(false)
    })

    return () => {
      cancelled = true
    }
  }, [currentRoot, refreshFileActivity, selectedPath, sessionId])

  const handleToggleDirectory = useCallback((directoryPath: string) => {
    setExpandedDirectories((current) => {
      const nextExpanded = !current[directoryPath]
      if (nextExpanded) void loadDirectory(directoryPath)
      return { ...current, [directoryPath]: nextExpanded }
    })
  }, [loadDirectory])

  const handleOpenPath = useCallback(async (mode: "open" | "reveal") => {
    if (!sessionId || !currentRoot) return
    const targetPath = selectedPath ?? currentRoot.path
    try {
      const result = mode === "open"
        ? await tipcClient.openTrackedSessionPath({ sessionId, rootPath: currentRoot.path, targetPath })
        : await tipcClient.revealTrackedSessionPath({ sessionId, rootPath: currentRoot.path, targetPath })
      if (!result?.success) {
        toast.error(result?.error || `Failed to ${mode} path`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${mode} path`)
    }
  }, [currentRoot, selectedPath, sessionId])

  const handleSubmitDialog = useCallback(async () => {
    if (!sessionId || !currentRoot || !dialogState) return
    setIsSubmittingDialog(true)
    try {
      if (dialogState.mode === "create-file" || dialogState.mode === "create-folder") {
        const created = await tipcClient.createTrackedSessionFileEntry({
          sessionId,
          rootPath: currentRoot.path,
          targetPath: dialogState.value,
          kind: dialogState.mode === "create-file" ? "file" : "directory",
        })
        await refreshLoadedDirectories()
        await refreshFileActivity()
        setSelectedPath(created?.path ?? currentRoot.path)
        toast.success(dialogState.mode === "create-file" ? "File created" : "Folder created")
      } else if (dialogState.mode === "move" && selectedPath) {
        const moved = await tipcClient.moveTrackedSessionFileEntry({
          sessionId,
          rootPath: currentRoot.path,
          sourcePath: selectedPath,
          targetPath: dialogState.value,
        })
        await refreshLoadedDirectories()
        await refreshFileActivity()
        setSelectedPath(moved?.path ?? currentRoot.path)
        toast.success("Path updated")
      } else if (dialogState.mode === "delete" && selectedPath) {
        await tipcClient.deleteTrackedSessionFileEntry({
          sessionId,
          rootPath: currentRoot.path,
          targetPath: selectedPath,
        })
        await refreshLoadedDirectories()
        await refreshFileActivity()
        setSelectedPath(currentRoot.path)
        toast.success("Path deleted")
      }
      setDialogState(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File operation failed")
    } finally {
      setIsSubmittingDialog(false)
    }
  }, [currentRoot, dialogState, refreshFileActivity, refreshLoadedDirectories, selectedPath, sessionId])

  const renderDirectoryEntries = useCallback((directoryPath: string): React.ReactNode => {
    const listing = listingsByDirectory[directoryPath]
    const entries = listing?.entries ?? []
    if (loadingDirectories[directoryPath]) {
      return <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</div>
    }
    if (entries.length === 0) {
      return <div className="py-2 text-xs text-muted-foreground">No visible files yet.</div>
    }

    return entries.map((entry) => {
      const isDirectory = entry.kind === "directory"
      const isExpanded = !!expandedDirectories[entry.path]
      const isSelected = selectedPath === entry.path

      return (
        <div key={entry.path} className="min-w-0 space-y-1">
          <div className={cn(
            "flex min-w-0 items-center gap-1 rounded-md px-1 py-0.5",
            isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50",
          )}>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
              onClick={() => isDirectory && handleToggleDirectory(entry.path)}
              aria-label={isExpanded ? `Collapse ${entry.name}` : `Expand ${entry.name}`}
              disabled={!isDirectory}
            >
              {isDirectory ? (isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />) : <span className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap rounded px-1 py-1 text-left text-sm"
              onClick={() => {
                setSelectedPath(entry.path)
                if (isDirectory && !expandedDirectories[entry.path]) {
                  handleToggleDirectory(entry.path)
                }
              }}
            >
              {isDirectory ? <FolderOpen className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
              <span className="truncate" title={entry.name}>{entry.name}</span>
            </button>
          </div>
          {isDirectory && isExpanded && (
            <div className="ml-4 min-w-0 border-l border-border/40 pl-2">
              {renderDirectoryEntries(entry.path)}
            </div>
          )}
        </div>
      )
    }).concat(listing?.truncated ? (
      <div key={`${directoryPath}:truncated`} className="py-1.5 pl-8 text-xs text-muted-foreground">
        Showing first {listing.limit.toLocaleString()} of {listing.totalEntries.toLocaleString()} entries.
      </div>
    ) : [])
  }, [expandedDirectories, handleToggleDirectory, listingsByDirectory, loadingDirectories, selectedPath])

  const renderActivityGroup = useCallback((kind: SessionFileActivityKind, label: string) => {
    const entries = fileActivity.filter((entry) => entry.kind === kind)
    if (entries.length === 0) return null

    return (
      <div className="min-w-[12rem] flex-1">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>{label}</span>
          <span className="rounded-full border border-border/60 px-1.5 py-0 text-[10px]">{entries.length}</span>
        </div>
        <div className="max-h-24 space-y-1 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <button
              key={`${entry.kind}:${entry.path}`}
              type="button"
              className="flex w-full min-w-0 items-center gap-2 rounded px-1.5 py-1 text-left text-xs hover:bg-muted/60"
              title={`${entry.relativePath} (${entry.source})`}
              onClick={() => {
                setSelectedRootPath(entry.rootPath)
                setSelectedPath(entry.path)
              }}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{entry.relativePath}</span>
              <span className="shrink-0 truncate text-[10px] text-muted-foreground">{entry.source}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }, [fileActivity])

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto border-b border-border/40 px-3 py-2">
        <div className="min-w-[12rem] flex-1">
          <Select value={currentRoot?.path ?? ""} onValueChange={setSelectedRootPath} disabled={roots.length <= 1}>
            <SelectTrigger className="h-8 rounded-md border border-input bg-background px-2">
              <SelectValue placeholder={isLoadingRoots ? "Loading workspaces…" : "No workspaces yet"} />
            </SelectTrigger>
            <SelectContent>
              {roots.map((root) => <SelectItem key={root.path} value={root.path}>{root.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 whitespace-nowrap" onClick={() => void loadRoots()} disabled={isLoadingRoots}>
          <RefreshCw className={cn("h-3.5 w-3.5", isLoadingRoots && "animate-spin")} /> Refresh
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 whitespace-nowrap" onClick={() => setDialogState({ mode: "create-file", value: buildDefaultCreatePath(selectedDirectoryBase, "file") })} disabled={!currentRoot}>
          <FilePlus2 className="h-3.5 w-3.5" /> New file
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 whitespace-nowrap" onClick={() => setDialogState({ mode: "create-folder", value: buildDefaultCreatePath(selectedDirectoryBase, "directory") })} disabled={!currentRoot}>
          <FolderPlus className="h-3.5 w-3.5" /> New folder
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 whitespace-nowrap" onClick={() => setDialogState({ mode: "move", value: selectedRelativePath === "." ? "" : selectedRelativePath })} disabled={!selectedPath || selectedRelativePath === "."}>
          <Pencil className="h-3.5 w-3.5" /> Move / rename
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 whitespace-nowrap" onClick={() => void handleOpenPath("open")} disabled={!currentRoot}>
          <ExternalLink className="h-3.5 w-3.5" /> Open
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 whitespace-nowrap" onClick={() => void handleOpenPath("reveal")} disabled={!currentRoot}>
          <FolderUp className="h-3.5 w-3.5" /> Reveal
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 whitespace-nowrap text-destructive hover:text-destructive" onClick={() => setDialogState({ mode: "delete" })} disabled={!selectedPath || selectedRelativePath === "."}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>

      {fileActivity.length > 0 && (
        <div className="border-b border-border/40 px-3 py-2">
          <div className="mb-2 flex min-w-0 items-center justify-between gap-2 text-xs">
            <span className="font-medium text-foreground">Touched files</span>
            <span className="shrink-0 text-muted-foreground">
              {fileActivity.filter((entry) => entry.kind === "read").length} read · {fileActivity.filter((entry) => entry.kind === "edited").length} edited
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-3 md:flex-row">
            {renderActivityGroup("edited", "Edited")}
            {renderActivityGroup("read", "Read")}
          </div>
        </div>
      )}

      {!sessionId ? (
        <div className="m-3 rounded-lg border border-dashed bg-muted/20 px-5 py-6 text-center text-sm text-muted-foreground">
          File View becomes available once the session has a real session ID.
        </div>
      ) : rootsError ? (
        <div className="m-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {rootsError}
        </div>
      ) : roots.length === 0 ? (
        <div className="m-3 rounded-lg border border-dashed bg-muted/20 px-5 py-6 text-center">
          <h3 className="text-base font-medium">No tracked workspaces yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            File View will populate after the session works in a workspace or returns file paths in tool output.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-0 md:flex-row">
          <div className="flex max-h-[14rem] min-h-0 flex-col border-b border-border/40 md:max-h-none md:w-[18rem] md:border-b-0 md:border-r">
            <div className="border-b border-border/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="block truncate font-medium text-foreground" title={currentRoot?.label}>{currentRoot?.label}</span>
              <span className="block truncate" title={currentRoot?.path}>{currentRoot?.path}</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              <button
                type="button"
                className={cn(
                  "flex w-full min-w-0 items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-left text-sm font-medium",
                  selectedRelativePath === "." ? "bg-primary/10 text-primary" : "hover:bg-muted/50",
                )}
                onClick={() => setSelectedPath(currentRoot?.path ?? null)}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="truncate" title={currentRoot?.label}>{currentRoot?.label}</span>
              </button>
              <div className="ml-4 mt-1 min-w-0 border-l border-border/40 pl-2">{currentRoot ? renderDirectoryEntries(currentRoot.path) : null}</div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border/40 px-3 py-2">
              <div className="truncate text-sm font-medium">{selectedRelativePath === "." ? currentRoot?.label : selectedRelativePath}</div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Kind: {preview?.kind ?? "—"}</span>
                <span>Size: {formatBytes(preview?.size)}</span>
                <span>Updated: {preview ? formatTimestamp(preview.modifiedAt) : "—"}</span>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {isLoadingPreview ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading preview…</div>
              ) : previewError ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{previewError}</div>
              ) : preview?.kind === "markdown" ? (
                <div className="max-w-full overflow-x-hidden rounded-md border bg-background p-3 text-sm [overflow-wrap:anywhere]"><MarkdownRenderer content={preview.content ?? ""} /></div>
              ) : preview?.kind === "text" ? (
                <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md border bg-background p-3 text-xs leading-5 text-foreground [overflow-wrap:anywhere]">{preview.content}</pre>
              ) : preview?.kind === "image" && preview.dataUrl ? (
                <div className="flex min-h-full items-start justify-center overflow-auto"><img src={preview.dataUrl} alt={preview.name} className="max-h-full max-w-full rounded-md border bg-background" /></div>
              ) : preview?.kind === "binary" ? (
                <div className="rounded-lg border border-dashed bg-muted/20 px-5 py-6 text-center text-sm text-muted-foreground">Binary preview is not available in-app for this file yet. Use Open or Reveal to inspect it in the OS.</div>
              ) : preview?.kind === "directory" ? (
                <div className="rounded-lg border border-dashed bg-muted/20 px-5 py-6 text-center text-sm text-muted-foreground">Use the tree on the left to browse this workspace directory.</div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/20 px-5 py-6 text-center text-sm text-muted-foreground">Select a file or folder to inspect it.</div>
              )}
              {preview?.truncated && <div className="mt-2 text-xs text-muted-foreground">Preview truncated to keep File View responsive.</div>}
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!dialogState} onOpenChange={(open) => !open && setDialogState(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogState?.mode === "create-file" ? "Create file" : dialogState?.mode === "create-folder" ? "Create folder" : dialogState?.mode === "move" ? "Move or rename" : "Delete path"}
            </DialogTitle>
            <DialogDescription>
              {dialogState?.mode === "delete"
                ? `Delete ${selectedRelativePath}? This action cannot be undone.`
                : "Paths are relative to the selected workspace root."}
            </DialogDescription>
          </DialogHeader>

          {dialogState?.mode === "delete" ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{selectedRelativePath}</span>
            </div>
          ) : (
            <Input
              autoFocus
              value={dialogState?.value ?? ""}
              onChange={(event) => setDialogState((current) => current && current.mode !== "delete" ? { ...current, value: event.target.value } : current)}
              placeholder="relative/path"
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState(null)} disabled={isSubmittingDialog}>Cancel</Button>
            <Button variant={dialogState?.mode === "delete" ? "destructive" : "default"} onClick={() => void handleSubmitDialog()} disabled={isSubmittingDialog || (dialogState?.mode !== "delete" && !dialogState?.value?.trim())}>
              {isSubmittingDialog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {dialogState?.mode === "delete" ? "Delete" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
