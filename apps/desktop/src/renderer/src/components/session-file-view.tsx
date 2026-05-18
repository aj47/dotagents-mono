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

export function SessionFileView({ sessionId, className }: { sessionId?: string | null; className?: string }) {
  const [roots, setRoots] = useState<SessionFileRoot[]>([])
  const [isLoadingRoots, setIsLoadingRoots] = useState(false)
  const [rootsError, setRootsError] = useState<string | null>(null)
  const [selectedRootPath, setSelectedRootPath] = useState<string>("")
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [expandedDirectories, setExpandedDirectories] = useState<Record<string, boolean>>({})
  const [entriesByDirectory, setEntriesByDirectory] = useState<Record<string, SessionFileEntry[]>>({})
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
      return
    }

    setIsLoadingRoots(true)
    setRootsError(null)
    try {
      const nextRoots = await tipcClient.getTrackedSessionFileRoots({ sessionId }) as SessionFileRoot[]
      setRoots(nextRoots)
      setSelectedRootPath((current) => nextRoots.some((root) => root.path === current) ? current : (nextRoots[0]?.path ?? ""))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load session files"
      setRootsError(message)
      setRoots([])
      setSelectedRootPath("")
    } finally {
      setIsLoadingRoots(false)
    }
  }, [sessionId])

  const loadDirectory = useCallback(async (directoryPath: string, options?: { force?: boolean }) => {
    if (!sessionId || !currentRoot) return
    if (!options?.force && entriesByDirectory[directoryPath]) return

    setLoadingDirectories((current) => ({ ...current, [directoryPath]: true }))
    try {
      const entries = await tipcClient.listTrackedSessionFiles({
        sessionId,
        rootPath: currentRoot.path,
        directoryPath,
      }) as SessionFileEntry[]
      setEntriesByDirectory((current) => ({ ...current, [directoryPath]: entries }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to list files")
    } finally {
      setLoadingDirectories((current) => ({ ...current, [directoryPath]: false }))
    }
  }, [currentRoot, entriesByDirectory, sessionId])

  const refreshLoadedDirectories = useCallback(async () => {
    if (!currentRoot) return
    const targets = Object.keys(entriesByDirectory)
      .filter((directoryPath) => isWithinRootPath(currentRoot.path, directoryPath))
      .filter((directoryPath) => directoryPath === currentRoot.path || expandedDirectories[directoryPath])
      .filter((directoryPath, index, values) => values.indexOf(directoryPath) === index)
    // Use allSettled so a single failing reload (e.g. a directory that was
    // just deleted or moved) cannot reject the whole refresh and make the
    // caller treat a successful filesystem mutation as a failure.
    await Promise.allSettled(targets.map((directoryPath) => loadDirectory(directoryPath, { force: true })))
  }, [currentRoot, entriesByDirectory, expandedDirectories, loadDirectory])

  useEffect(() => {
    setEntriesByDirectory({})
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
      return
    }

    let cancelled = false
    setIsLoadingPreview(true)
    setPreviewError(null)
    void tipcClient.readTrackedSessionFilePreview({
      sessionId,
      rootPath: currentRoot.path,
      filePath: selectedPath,
    }).then((nextPreview: SessionFilePreview) => {
      if (!cancelled) setPreview(nextPreview)
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
  }, [currentRoot, selectedPath, sessionId])

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
        setSelectedPath(moved?.path ?? currentRoot.path)
        toast.success("Path updated")
      } else if (dialogState.mode === "delete" && selectedPath) {
        await tipcClient.deleteTrackedSessionFileEntry({
          sessionId,
          rootPath: currentRoot.path,
          targetPath: selectedPath,
        })
        await refreshLoadedDirectories()
        setSelectedPath(currentRoot.path)
        toast.success("Path deleted")
      }
      setDialogState(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File operation failed")
    } finally {
      setIsSubmittingDialog(false)
    }
  }, [currentRoot, dialogState, refreshLoadedDirectories, selectedPath, sessionId])

  const renderDirectoryEntries = useCallback((directoryPath: string): React.ReactNode => {
    const entries = entriesByDirectory[directoryPath] ?? []
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
        <div key={entry.path} className="space-y-1">
          <div className={cn(
            "flex items-center gap-1 rounded-md px-1 py-0.5",
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
              className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left text-sm"
              onClick={() => {
                setSelectedPath(entry.path)
                if (isDirectory && !expandedDirectories[entry.path]) {
                  handleToggleDirectory(entry.path)
                }
              }}
            >
              {isDirectory ? <FolderOpen className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
              <span className="truncate">{entry.name}</span>
            </button>
          </div>
          {isDirectory && isExpanded && (
            <div className="ml-4 border-l border-border/40 pl-2">
              {renderDirectoryEntries(entry.path)}
            </div>
          )}
        </div>
      )
    })
  }, [entriesByDirectory, expandedDirectories, handleToggleDirectory, loadingDirectories, selectedPath])

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 px-3 py-2">
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
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void loadRoots()} disabled={isLoadingRoots}>
          <RefreshCw className={cn("h-3.5 w-3.5", isLoadingRoots && "animate-spin")} /> Refresh
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDialogState({ mode: "create-file", value: buildDefaultCreatePath(selectedDirectoryBase, "file") })} disabled={!currentRoot}>
          <FilePlus2 className="h-3.5 w-3.5" /> New file
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDialogState({ mode: "create-folder", value: buildDefaultCreatePath(selectedDirectoryBase, "directory") })} disabled={!currentRoot}>
          <FolderPlus className="h-3.5 w-3.5" /> New folder
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDialogState({ mode: "move", value: selectedRelativePath === "." ? "" : selectedRelativePath })} disabled={!selectedPath || selectedRelativePath === "."}>
          <Pencil className="h-3.5 w-3.5" /> Move / rename
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handleOpenPath("open")} disabled={!currentRoot}>
          <ExternalLink className="h-3.5 w-3.5" /> Open
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void handleOpenPath("reveal")} disabled={!currentRoot}>
          <FolderUp className="h-3.5 w-3.5" /> Reveal
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDialogState({ mode: "delete" })} disabled={!selectedPath || selectedRelativePath === "."}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>

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
          <div className="min-h-0 border-b border-border/40 md:w-[18rem] md:border-b-0 md:border-r">
            <div className="border-b border-border/40 px-3 py-2 text-xs text-muted-foreground">
              {currentRoot?.label} <span className="block truncate">{currentRoot?.path}</span>
            </div>
            <div className="min-h-0 overflow-y-auto px-2 py-2">
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium",
                  selectedRelativePath === "." ? "bg-primary/10 text-primary" : "hover:bg-muted/50",
                )}
                onClick={() => setSelectedPath(currentRoot?.path ?? null)}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="truncate">{currentRoot?.label}</span>
              </button>
              <div className="ml-4 mt-1 border-l border-border/40 pl-2">{currentRoot ? renderDirectoryEntries(currentRoot.path) : null}</div>
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
                <div className="rounded-lg border bg-background p-3"><MarkdownRenderer content={preview.content ?? ""} /></div>
              ) : preview?.kind === "text" ? (
                <pre className="rounded-lg border bg-background p-3 text-xs leading-5 text-foreground whitespace-pre-wrap break-words">{preview.content}</pre>
              ) : preview?.kind === "image" && preview.dataUrl ? (
                <div className="flex min-h-full items-start justify-center"><img src={preview.dataUrl} alt={preview.name} className="max-h-full max-w-full rounded-lg border bg-background" /></div>
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