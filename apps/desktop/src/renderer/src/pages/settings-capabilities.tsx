import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { BundleImportDialog } from "@renderer/components/bundle-import-dialog"
import { Button } from "@renderer/components/ui/button"
import { copyTextToClipboard } from "@renderer/lib/clipboard"
import { tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { Copy, ExternalLink, FolderOpen, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Component as McpToolsPage } from "./settings-mcp-tools"
import { Component as SkillsPage } from "./settings-skills"

const tabs = [
  { id: "skills", label: "Skills", icon: "i-mingcute-sparkles-line" },
  { id: "mcp-servers", label: "MCP Servers", icon: "i-mingcute-tool-line" },
] as const

type TabId = (typeof tabs)[number]["id"]

function getRequestedTab(searchParams: URLSearchParams): TabId {
  const requestedTab = searchParams.get("tab")
  return tabs.some((tab) => tab.id === requestedTab)
    ? requestedTab as TabId
    : "skills"
}

interface RecentBackup {
  filePath: string
  fileName: string
  manifestName: string
  manifestDescription?: string
  createdAt: string
  modifiedAt: number
  backup?: {
    kind: "pre-import-snapshot"
    targetLayer: "global" | "workspace" | "custom"
    targetAgentsDir?: string
  }
  components: {
    agentProfiles: number
    mcpServers: number
    skills: number
    repeatTasks: number
    memories: number
  }
}

interface BundleSlotState {
  slotsFolder: string
  activeSlotId: string | null
  lastSwitchedAt: string | null
  precedence: string
  runtimeActivationEnabled: boolean
  slots: Array<{
    id: string
    slotDir: string
    isActive: boolean
  }>
}

function formatBackupComponentSummary(components: RecentBackup["components"]): string {
  const parts = [
    ["agents", components.agentProfiles],
    ["MCP", components.mcpServers],
    ["skills", components.skills],
    ["tasks", components.repeatTasks],
    ["memories", components.memories],
  ]
    .filter(([, count]) => count > 0)
    .map(([label, count]) => `${count} ${label}`)

  return parts.length > 0 ? parts.join(" · ") : "Empty backup"
}

function formatBackupTargetLabel(backup: RecentBackup["backup"]): string {
  switch (backup?.targetLayer) {
    case "global":
      return "Global layer"
    case "workspace":
      return "Workspace layer"
    case "custom":
      return "Custom layer"
    default:
      return "Unknown target"
  }
}

export function Component() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabId>(() => getRequestedTab(searchParams))

  useEffect(() => {
    const requestedTab = getRequestedTab(searchParams)
    setActiveTab((currentTab) => currentTab === requestedTab ? currentTab : requestedTab)
  }, [searchParams])

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId)

    const nextParams = new URLSearchParams(searchParams)
    if (tabId === "skills") {
      nextParams.delete("tab")
    } else {
      nextParams.set("tab", tabId)
    }

    setSearchParams(nextParams, { replace: true })
  }

  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [restoreFilePath, setRestoreFilePath] = useState<string>()
  const [isSelectingRestoreBackup, setIsSelectingRestoreBackup] = useState(false)
  const [isOpeningBackupsFolder, setIsOpeningBackupsFolder] = useState(false)
  const [isOpeningSlotsFolder, setIsOpeningSlotsFolder] = useState(false)
  const [revealingBackupPath, setRevealingBackupPath] = useState<string | null>(null)
  const recentBackupsQuery = useQuery({
    queryKey: ["bundle-import-backups"],
    queryFn: async () => (await tipcClient.listBundleBackups({ limit: 4 })) as RecentBackup[],
  })
  const bundleSlotStateQuery = useQuery({
    queryKey: ["bundle-slot-state"],
    queryFn: async () => (await tipcClient.getBundleSlotState()) as BundleSlotState,
  })

  const recentBackups = recentBackupsQuery.data ?? []
  const bundleSlotState = bundleSlotStateQuery.data
  const bundleSlots = bundleSlotState?.slots ?? []

  const openRestoreDialogForFile = (filePath: string) => {
    setRestoreFilePath(filePath)
    setIsRestoreDialogOpen(true)
  }

  const handleRestoreBackupClick = async () => {
    setIsSelectingRestoreBackup(true)
    try {
      const selectedBackup = await tipcClient.selectBundleBackupFile()
      if (!selectedBackup?.filePath) return

      openRestoreDialogForFile(selectedBackup.filePath)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to select backup bundle: ${errorMessage}`)
    } finally {
      setIsSelectingRestoreBackup(false)
    }
  }

  const handleOpenBackupsFolderClick = async () => {
    setIsOpeningBackupsFolder(true)
    try {
      const result = await tipcClient.openBundleBackupFolder()
      if (!result?.success) {
        throw new Error(result?.error || "Unknown error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to open backups folder: ${errorMessage}`)
    } finally {
      setIsOpeningBackupsFolder(false)
    }
  }

  const handleOpenSlotsFolderClick = async () => {
    setIsOpeningSlotsFolder(true)
    try {
      const result = await tipcClient.openBundleSlotsFolder()
      if (!result?.success) {
        throw new Error(result?.error || "Unknown error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to open bundle slots folder: ${errorMessage}`)
    } finally {
      setIsOpeningSlotsFolder(false)
    }
  }

  const handleRevealBackupFileClick = async (filePath: string) => {
    setRevealingBackupPath(filePath)
    try {
      const result = await tipcClient.revealBundleBackupFile({ filePath })
      if (!result?.success) {
        throw new Error(result?.error || "Unknown error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to reveal backup bundle: ${errorMessage}`)
    } finally {
      setRevealingBackupPath(currentPath => (currentPath === filePath ? null : currentPath))
    }
  }

  const handleCopyBackupPathClick = async (filePath: string) => {
    try {
      await copyTextToClipboard(filePath)
      toast.success("Backup path copied to clipboard")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to copy backup path: ${errorMessage}`)
    }
  }

  const handleRestoreDialogOpenChange = (open: boolean) => {
    setIsRestoreDialogOpen(open)
    if (!open) {
      setRestoreFilePath(undefined)
    }
  }

  const handleRestoreImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["skills"] })
    queryClient.invalidateQueries({ queryKey: ["config"] })
    queryClient.invalidateQueries({ queryKey: ["agentProfilesSidebar"] })
    queryClient.invalidateQueries({ queryKey: ["bundle-import-backups"] })
    queryClient.invalidateQueries({ queryKey: ["bundle-slot-state"] })
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 border-b bg-background">
        <div className="flex items-start justify-between gap-3 px-6 pb-3 pt-4">
          <div>
            <h1 className="text-lg font-semibold">Capabilities</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Manage skills and MCP servers, or restore a pre-import backup if a bundle changed your setup unexpectedly.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            onClick={handleRestoreBackupClick}
            disabled={isSelectingRestoreBackup}
          >
            {isSelectingRestoreBackup
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RotateCcw className="h-4 w-4" />}
            Restore Backup
          </Button>
        </div>

        <div className="px-6 pb-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">Recent backups</h2>
                <p className="text-xs text-muted-foreground">
                  DotAgents keeps automatic pre-import snapshots here so you can quickly roll back recent bundle changes.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 shrink-0"
                onClick={handleOpenBackupsFolderClick}
                disabled={isOpeningBackupsFolder}
              >
                {isOpeningBackupsFolder
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <FolderOpen className="h-4 w-4" />}
                Open Backups Folder
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              {recentBackupsQuery.isLoading && (
                <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading recent backups…
                </div>
              )}

              {recentBackupsQuery.isError && (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  Failed to load recent backups.
                </div>
              )}

              {!recentBackupsQuery.isLoading && !recentBackupsQuery.isError && recentBackups.length === 0 && (
                <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                  No automatic backups found yet. A backup will appear here after your first bundle import.
                </div>
              )}

              {recentBackups.map(backup => (
                <div key={backup.filePath} className="flex items-start justify-between gap-3 rounded-md border bg-background px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{backup.manifestName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(backup.createdAt).toLocaleString()} · {formatBackupTargetLabel(backup.backup)} · {formatBackupComponentSummary(backup.components)}
                    </p>
                    {backup.manifestDescription && (
                      <p className="truncate text-xs text-muted-foreground/80">{backup.manifestDescription}</p>
                    )}
                    <p
                      className="truncate font-mono text-[11px] text-muted-foreground/70"
                      title={backup.filePath}
                    >
                      {backup.filePath}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleCopyBackupPathClick(backup.filePath)}
                    >
                      <Copy className="h-4 w-4" />
                      Copy path
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleRevealBackupFileClick(backup.filePath)}
                      disabled={revealingBackupPath === backup.filePath}
                    >
                      {revealingBackupPath === backup.filePath
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <ExternalLink className="h-4 w-4" />}
                      Reveal
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => openRestoreDialogForFile(backup.filePath)}>
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">Bundle slots</h2>
                <p className="text-xs text-muted-foreground">
                  Active slots participate in runtime layer loading now. Merge order stays {bundleSlotState?.precedence ?? "global -> active slot -> workspace"} so workspace overrides remain intact.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 shrink-0"
                onClick={handleOpenSlotsFolderClick}
                disabled={isOpeningSlotsFolder}
              >
                {isOpeningSlotsFolder
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <FolderOpen className="h-4 w-4" />}
                Open Slots Folder
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              {bundleSlotStateQuery.isLoading && (
                <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading bundle slot state…
                </div>
              )}

              {bundleSlotStateQuery.isError && (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  Failed to load bundle slot state.
                </div>
              )}

              {!bundleSlotStateQuery.isLoading && !bundleSlotStateQuery.isError && (
                <>
                  <div className="rounded-md border bg-background px-3 py-2 text-sm">
                    <p className="font-medium">Active slot</p>
                    <p className="text-xs text-muted-foreground">
                      {bundleSlotState?.activeSlotId ?? "No active slot selected"}
                      {bundleSlotState?.lastSwitchedAt
                        ? ` · last switched ${new Date(bundleSlotState.lastSwitchedAt).toLocaleString()}`
                        : " · no switch timestamp recorded yet"}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground/70" title={bundleSlotState?.slotsFolder}>
                      {bundleSlotState?.slotsFolder}
                    </p>
                  </div>

                  {bundleSlots.length === 0 && (
                    <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                      No bundle slot directories found yet. Create or import a slot under this folder, then point `active-slot.json` at it to activate the middle overlay layer.
                    </div>
                  )}

                  {bundleSlots.map(slot => (
                    <div key={slot.id} className="rounded-md border bg-background px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{slot.id}</p>
                        <span className="text-xs text-muted-foreground">
                          {slot.isActive ? "Active pointer" : "Available slot"}
                        </span>
                      </div>
                      <p className="truncate font-mono text-[11px] text-muted-foreground/70" title={slot.slotDir}>
                        {slot.slotDir}
                      </p>
                    </div>
                  ))}

                  {bundleSlotState?.runtimeActivationEnabled && bundleSlotState?.activeSlotId && (
                    <div className="rounded-md border border-dashed bg-background px-3 py-2 text-xs text-muted-foreground">
                      Runtime overlay is active. The selected slot now sits between the global layer and any workspace `.agents` overrides.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-6 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <span className={cn(tab.icon, "shrink-0")} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — each page provides its own scroll container */}
      <div className="flex-1 min-h-0">
        {activeTab === "skills" && <SkillsPage />}
        {activeTab === "mcp-servers" && <McpToolsPage />}
      </div>

      <BundleImportDialog
        open={isRestoreDialogOpen}
        onOpenChange={handleRestoreDialogOpenChange}
        onImportComplete={handleRestoreImportComplete}
        initialFilePath={restoreFilePath}
        title="Restore Backup"
        description="Preview and restore a previously created .dotagents backup bundle. DotAgents will create a fresh safety snapshot before any restore writes."
        confirmLabel="Restore"
        successVerb="restored"
      />
    </div>
  )
}

