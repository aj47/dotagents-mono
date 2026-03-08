import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { BundleImportDialog } from "@renderer/components/bundle-import-dialog"
import { Button } from "@renderer/components/ui/button"
import { tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Component as McpToolsPage } from "./settings-mcp-tools"
import { Component as SkillsPage } from "./settings-skills"

const tabs = [
  { id: "skills", label: "Skills", icon: "i-mingcute-sparkles-line" },
  { id: "mcp-servers", label: "MCP Servers", icon: "i-mingcute-tool-line" },
] as const

type TabId = (typeof tabs)[number]["id"]

interface RecentBackup {
  filePath: string
  fileName: string
  manifestName: string
  manifestDescription?: string
  createdAt: string
  modifiedAt: number
  components: {
    agentProfiles: number
    mcpServers: number
    skills: number
    repeatTasks: number
    memories: number
  }
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

export function Component() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabId>("skills")
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [restoreFilePath, setRestoreFilePath] = useState<string>()
  const [isSelectingRestoreBackup, setIsSelectingRestoreBackup] = useState(false)
  const recentBackupsQuery = useQuery({
    queryKey: ["bundle-import-backups"],
    queryFn: async () => (await tipcClient.listBundleBackups({ limit: 4 })) as RecentBackup[],
  })

  const recentBackups = recentBackupsQuery.data ?? []

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
                <div key={backup.filePath} className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{backup.manifestName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(backup.createdAt).toLocaleString()} · {formatBackupComponentSummary(backup.components)}
                    </p>
                    {backup.manifestDescription && (
                      <p className="truncate text-xs text-muted-foreground/80">{backup.manifestDescription}</p>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => openRestoreDialogForFile(backup.filePath)}>
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-6 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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

