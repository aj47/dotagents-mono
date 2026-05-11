import { useState, useEffect } from "react"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Textarea } from "@renderer/components/ui/textarea"
import { Switch } from "@renderer/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@renderer/components/ui/dropdown-menu"
import { BundleImportDialog } from "@renderer/components/bundle-import-dialog"
import { desktopAgentProfilesClient } from "@renderer/lib/desktop-agent-profiles-client"
import { desktopAgentsFolderClient } from "@renderer/lib/desktop-agents-folder-client"
import { desktopBundleClient } from "@renderer/lib/desktop-bundle-client"
import { desktopSkillsClient } from "@renderer/lib/desktop-skills-client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AgentProfile } from "@dotagents/shared/agent-profile-domain"
import type { LegacyProfileRecord as Profile } from "@dotagents/shared/agent-profile-legacy-converters"
import type { AgentSkill } from "@dotagents/shared/types"
import { toggleSetValue } from "@dotagents/shared/collection-state"
import { isSkillEnabledForProfile, sortSkillsByProfileEnablement } from "@dotagents/shared/skills-api"
import {
  APP_SHELL_SKILL_DELETE_PRESENTATION,
  APP_SHELL_SKILL_EDITOR_PRESENTATION,
  APP_SHELL_SKILL_FEEDBACK_PRESENTATION,
  formatAppShellSkillBulkActionLabel,
  formatAppShellSkillDeleteSelectedConfirmMessage,
  formatAppShellSkillFolderImportStatus,
  formatAppShellSkillGitHubImportStatus,
  formatAppShellSkillImportedSuccessMessage,
  formatAppShellSkillImportSummary,
  getAppShellEditorActionLabel,
  getAppShellEditorTitle,
  getAppShellSkillActionLabel,
  getAppShellSkillDeleteConfirmMessage,
  getAppShellSkillItemActionAccessibilityLabel,
} from "@dotagents/shared/app-shell"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Download, Upload, FolderOpen, RefreshCw, Loader2, ChevronDown, FolderUp, Github, CheckSquare, Square, X, FileText, Package, MoreHorizontal, AlertTriangle } from "lucide-react"

type ToggleProfileSkillVariables = {
  profileId: string
  skillId: string
  skillName: string
  willEnable: boolean
}

export function Component() {
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<AgentSkill | null>(null)
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillDescription, setNewSkillDescription] = useState("")
  const [newSkillInstructions, setNewSkillInstructions] = useState("")
  const [isGitHubDialogOpen, setIsGitHubDialogOpen] = useState(false)
  const [isBundleImportDialogOpen, setIsBundleImportDialogOpen] = useState(false)
  const [gitHubRepoInput, setGitHubRepoInput] = useState("")
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set())

  const skillsQuery = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      return await desktopSkillsClient.getSkills()
    },
  })

  const agentsFoldersQuery = useQuery({
    queryKey: ["agentsFolders"],
    queryFn: async () => {
      return await desktopAgentsFolderClient.getAgentsFolders()
    },
    staleTime: Infinity,
  })

  const currentProfileQuery = useQuery({
    queryKey: ["currentProfile"],
    queryFn: async () => {
      return await desktopAgentProfilesClient.getCurrentProfile()
    },
  })

  const skills = skillsQuery.data || []
  const currentProfile = currentProfileQuery.data as AgentProfile | Profile | null | undefined
  const currentAgentDisplayName = currentProfile
    ? "displayName" in currentProfile
      ? currentProfile.displayName
      : currentProfile.name
    : "this agent"
  const isSkillEnabledForCurrentProfile = (skillId: string): boolean | null => {
    if (!currentProfile) return null
    return isSkillEnabledForProfile(skillId, currentProfile)
  }
  const displaySkills = sortSkillsByProfileEnablement(skills, (skill) => isSkillEnabledForCurrentProfile(skill.id))

  // Listen for skills folder changes from the main process (file watcher)
  useEffect(() => {
    const unsubscribe = desktopSkillsClient.onSkillsFolderChanged(async () => {
      try {
        // Auto-scan and refresh skills when folder changes
        const importedSkills = await desktopSkillsClient.scanSkillsFolder()
        queryClient.invalidateQueries({ queryKey: ["skills"] })
        if (importedSkills && importedSkills.length > 0) {
          toast.success(formatAppShellSkillFolderImportStatus(importedSkills.length))
        }
      } catch (error) {
        console.error("Failed to auto-refresh skills:", error)
        toast.error(APP_SHELL_SKILL_FEEDBACK_PRESENTATION.autoRefreshFailed)
      }
    })
    return () => unsubscribe()
  }, [queryClient])

  const createSkillMutation = useMutation({
    mutationFn: async ({ name, description, instructions }: { name: string; description: string; instructions: string }) => {
      return await desktopSkillsClient.createSkill({ name, description, instructions })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] })
      setIsCreateDialogOpen(false)
      resetNewSkillForm()
      toast.success(APP_SHELL_SKILL_FEEDBACK_PRESENTATION.created)
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.createFailed}: ${error.message}`)
    },
  })

  const updateSkillMutation = useMutation({
    mutationFn: async ({ id, name, description, instructions }: { id: string; name?: string; description?: string; instructions?: string }) => {
      return await desktopSkillsClient.updateSkill({ id, name, description, instructions })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] })
      setIsEditDialogOpen(false)
      setEditingSkill(null)
      toast.success(APP_SHELL_SKILL_FEEDBACK_PRESENTATION.updated)
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.updateFailed}: ${error.message}`)
    },
  })

  const deleteSkillMutation = useMutation({
    mutationFn: async (id: string) => {
      return await desktopSkillsClient.deleteSkill(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] })
      toast.success(APP_SHELL_SKILL_FEEDBACK_PRESENTATION.deleted)
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_DELETE_PRESENTATION.deleteFailed}: ${error.message}`)
    },
  })

  const toggleProfileSkillMutation = useMutation({
    mutationFn: async ({ profileId, skillId }: ToggleProfileSkillVariables) => {
      return await desktopSkillsClient.toggleProfileSkill(profileId, skillId)
    },
    onSuccess: (_profile, { willEnable, skillName }) => {
      queryClient.invalidateQueries({ queryKey: ["currentProfile"] })
      queryClient.invalidateQueries({ queryKey: ["agentProfilesSidebar"] })
      toast.success(`${skillName} ${willEnable ? "enabled" : "disabled"}`)
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.updateAccessFailed}: ${error.message}`)
    },
  })

  const deleteSkillsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await desktopSkillsClient.deleteSkills(ids)
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] })
      const succeeded = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length
      if (succeeded > 0) toast.success(`Deleted ${succeeded} skill(s)`)
      if (failed > 0) toast.error(`Failed to delete ${failed} skill(s)`)
      setSelectedSkillIds(new Set())
      setIsSelectMode(false)
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_DELETE_PRESENTATION.deleteSelectedFailed}: ${error.message}`)
    },
  })

  const importSkillMutation = useMutation({
    mutationFn: async () => {
      return await desktopSkillsClient.importSkillFile()
    },
    onSuccess: (skill: AgentSkill | null) => {
      if (skill) {
        queryClient.invalidateQueries({ queryKey: ["skills"] })
        toast.success(formatAppShellSkillImportedSuccessMessage(skill.name))
      }
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.importFailed}: ${error.message}`)
    },
  })

  // Import a single skill folder containing SKILL.md
  const importSkillFolderMutation = useMutation({
    mutationFn: async () => {
      return await desktopSkillsClient.importSkillFolder()
    },
    onSuccess: (skill: AgentSkill | null) => {
      if (skill) {
        queryClient.invalidateQueries({ queryKey: ["skills"] })
        toast.success(formatAppShellSkillImportedSuccessMessage(skill.name))
      }
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.importFolderFailed}: ${error.message}`)
    },
  })

  // Bulk import all skill folders from a parent directory
  const importSkillsFromParentFolderMutation = useMutation({
    mutationFn: async () => {
      return await desktopSkillsClient.importSkillsFromParentFolder()
    },
    onSuccess: (result: { imported: AgentSkill[]; skipped: string[]; errors: Array<{ folder: string; error: string }> } | null) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ["skills"] })

        const message = formatAppShellSkillImportSummary(
          result.imported.length,
          result.skipped.length,
          result.errors.length,
        )
        if (result.imported.length > 0) {
          toast.success(message)
        } else if (result.skipped.length > 0) {
          toast.info(message)
        } else if (result.errors.length > 0) {
          toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.importSkillsFailed}: ${result.errors.map(e => e.folder).join(", ")}`)
        } else {
          toast.info(APP_SHELL_SKILL_FEEDBACK_PRESENTATION.noSkillFoldersFound)
        }
      }
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.importSkillsFailed}: ${error.message}`)
    },
  })

  const exportSkillMutation = useMutation({
    mutationFn: async (id: string) => {
      return await desktopSkillsClient.exportSkillFile(id)
    },
    onSuccess: (success: boolean) => {
      if (success) {
        toast.success(APP_SHELL_SKILL_FEEDBACK_PRESENTATION.exported)
      }
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.exportFailed}: ${error.message}`)
    },
  })

  const exportBundleMutation = useMutation({
    mutationFn: async ({ skillIds, name }: { skillIds: string[]; name: string }) => {
      return await desktopBundleClient.exportBundle({
        name,
        skillIds,
        components: {
          agentProfiles: false,
          mcpServers: false,
          skills: true,
          repeatTasks: false,
          knowledgeNotes: false,
        },
      })
    },
    onSuccess: (result: { success: boolean; canceled?: boolean; error?: string }) => {
      if (result.success) {
        toast.success("Bundle exported successfully")
        return
      }
      if (result.canceled) {
        toast.message("Bundle export canceled")
        return
      }
      toast.error(result.error || "Failed to export bundle")
    },
    onError: (error: Error) => {
      toast.error(`Failed to export bundle: ${error.message}`)
    },
  })

  const openSkillFileMutation = useMutation({
    mutationFn: async (skillId: string) => {
      return await desktopSkillsClient.openSkillFile(skillId)
    },
    onSuccess: (result) => {
      if (!result?.success) {
        toast.error(result?.error || APP_SHELL_SKILL_FEEDBACK_PRESENTATION.revealFileFailed)
      }
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.revealFileFailed}: ${error.message}`)
    },
  })

  const openSkillsFolderMutation = useMutation({
    mutationFn: async () => {
      return await desktopSkillsClient.openSkillsFolder()
    },
    onSuccess: (result) => {
      if (!result?.success) {
        toast.error(result?.error || APP_SHELL_SKILL_FEEDBACK_PRESENTATION.openFolderFailed)
      }
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.openFolderFailed}: ${error.message}`)
    },
  })

  const openWorkspaceSkillsFolderMutation = useMutation({
    mutationFn: async () => {
      return await desktopSkillsClient.openWorkspaceSkillsFolder()
    },
    onSuccess: (result) => {
      if (!result?.success) {
        toast.error(result?.error || APP_SHELL_SKILL_FEEDBACK_PRESENTATION.openWorkspaceFolderFailed)
      }
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.openWorkspaceFolderFailed}: ${error.message}`)
    },
  })

  const scanSkillsFolderMutation = useMutation({
    mutationFn: async () => {
      return await desktopSkillsClient.scanSkillsFolder()
    },
    onSuccess: (importedSkills: AgentSkill[]) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] })
      if (importedSkills.length > 0) {
        toast.success(formatAppShellSkillFolderImportStatus(importedSkills.length))
      } else {
        toast.info(APP_SHELL_SKILL_FEEDBACK_PRESENTATION.noNewSkillsFound)
      }
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.scanFolderFailed}: ${error.message}`)
    },
  })

  // Import skill from GitHub repository
  const importSkillFromGitHubMutation = useMutation({
    mutationFn: async (repoIdentifier: string) => {
      return await desktopSkillsClient.importSkillFromGitHub(repoIdentifier)
    },
    onSuccess: (result) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ["skills"] })
        if (result.imported.length > 0) {
          toast.success(formatAppShellSkillGitHubImportStatus(result.imported.length, result.imported.map(s => s.name)))
        } else if (result.errors.length > 0) {
          toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.importFailed}: ${result.errors.join("; ")}`)
        } else {
          toast.info(APP_SHELL_SKILL_FEEDBACK_PRESENTATION.noSkillsFoundInRepository)
        }
        setIsGitHubDialogOpen(false)
        setGitHubRepoInput("")
      }
    },
    onError: (error: Error) => {
      toast.error(`${APP_SHELL_SKILL_FEEDBACK_PRESENTATION.importGitHubFailed}: ${error.message}`)
    },
  })

  const handleImportFromGitHub = () => {
    if (!gitHubRepoInput.trim()) {
      toast.error(APP_SHELL_SKILL_FEEDBACK_PRESENTATION.gitHubRepositoryRequired)
      return
    }
    importSkillFromGitHubMutation.mutate(gitHubRepoInput.trim())
  }

  const resetNewSkillForm = () => {
    setNewSkillName("")
    setNewSkillDescription("")
    setNewSkillInstructions("")
  }

  const handleCreateSkill = () => {
    if (!newSkillName.trim()) {
      toast.error(APP_SHELL_SKILL_EDITOR_PRESENTATION.validation.nameRequired)
      return
    }
    if (!newSkillInstructions.trim()) {
      toast.error(APP_SHELL_SKILL_EDITOR_PRESENTATION.validation.instructionsRequired)
      return
    }
    createSkillMutation.mutate({
      name: newSkillName,
      description: newSkillDescription,
      instructions: newSkillInstructions,
    })
  }

  const handleUpdateSkill = () => {
    if (!editingSkill) return
    updateSkillMutation.mutate({
      id: editingSkill.id,
      name: editingSkill.name,
      description: editingSkill.description,
      instructions: editingSkill.instructions,
    })
  }

  const handleDeleteSkill = (skill: AgentSkill) => {
    if (confirm(getAppShellSkillDeleteConfirmMessage(skill.name))) {
      deleteSkillMutation.mutate(skill.id)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedSkillIds.size === 0) return
    const count = selectedSkillIds.size
    if (confirm(formatAppShellSkillDeleteSelectedConfirmMessage(count))) {
      deleteSkillsMutation.mutate(Array.from(selectedSkillIds))
    }
  }

  const handleExportSelectedBundle = () => {
    if (selectedSkillIds.size === 0) return
    const selectedSkills = skills.filter((skill) => selectedSkillIds.has(skill.id))
    const skillIds = selectedSkills.map((skill) => skill.id)
    const bundleName = selectedSkills.length === 1
      ? `${selectedSkills[0].name} Skill Bundle`
      : `${skillIds.length || selectedSkillIds.size} Skills Bundle`

    exportBundleMutation.mutate({ skillIds, name: bundleName })
  }

  const toggleSkillSelection = (id: string) => {
    setSelectedSkillIds((prev) => toggleSetValue(prev, id))
  }

  const toggleSelectAll = () => {
    if (selectedSkillIds.size === skills.length) {
      setSelectedSkillIds(new Set())
    } else {
      setSelectedSkillIds(new Set(skills.map((s) => s.id)))
    }
  }

  const exitSelectMode = () => {
    setIsSelectMode(false)
    setSelectedSkillIds(new Set())
  }

  const handleEditSkill = (skill: AgentSkill) => {
    setEditingSkill({ ...skill })
    setIsEditDialogOpen(true)
  }

  const handleBundleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["skills"] })
    queryClient.invalidateQueries({ queryKey: ["agentProfilesSidebar"] })
  }

  return (
    <div className="modern-panel h-full min-w-0 overflow-y-auto overflow-x-hidden px-6 py-4">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap justify-end gap-2">
          {isSelectMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={toggleSelectAll}
              >
                {selectedSkillIds.size === skills.length && skills.length > 0 ? (
                  <CheckSquare className="h-3 w-3" />
                ) : (
                  <Square className="h-3 w-3" />
                )}
                {selectedSkillIds.size === skills.length && skills.length > 0
                  ? getAppShellSkillActionLabel("deselectAll")
                  : getAppShellSkillActionLabel("selectAll")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExportSelectedBundle}
                disabled={selectedSkillIds.size === 0 || exportBundleMutation.isPending}
              >
                {exportBundleMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                {formatAppShellSkillBulkActionLabel("exportBundle", selectedSkillIds.size)}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={handleDeleteSelected}
                disabled={selectedSkillIds.size === 0 || deleteSkillsMutation.isPending}
              >
                {deleteSkillsMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                {formatAppShellSkillBulkActionLabel("deleteSelected", selectedSkillIds.size)}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={exitSelectMode}
              >
                <X className="h-3 w-3" />
                {getAppShellSkillActionLabel("cancel")}
              </Button>
            </>
          ) : (
            <>
              {skills.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setIsSelectMode(true)}
                >
                  <CheckSquare className="h-3 w-3" />
                  {getAppShellSkillActionLabel("select")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => openSkillsFolderMutation.mutate()}
              >
                <FolderOpen className="h-3 w-3" />
                {getAppShellSkillActionLabel("openFolder")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => openWorkspaceSkillsFolderMutation.mutate()}
                disabled={!agentsFoldersQuery.data?.workspace?.skillsDir || openWorkspaceSkillsFolderMutation.isPending}
              >
                <FolderUp className="h-3 w-3" />
                {getAppShellSkillActionLabel("workspaceFolder")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => scanSkillsFolderMutation.mutate()}
                disabled={scanSkillsFolderMutation.isPending}
              >
                <RefreshCw className={`h-3 w-3 ${scanSkillsFolderMutation.isPending ? 'animate-spin' : ''}`} />
                {getAppShellSkillActionLabel("scanFolder")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={importSkillMutation.isPending || importSkillFolderMutation.isPending || importSkillsFromParentFolderMutation.isPending || importSkillFromGitHubMutation.isPending}
                  >
                    <Upload className="h-3 w-3" />
                    {getAppShellSkillActionLabel("import")}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsBundleImportDialogOpen(true)}>
                    <Package />
                    {getAppShellSkillActionLabel("importBundle")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsGitHubDialogOpen(true)}>
                    <Github />
                    {getAppShellSkillActionLabel("importFromGitHub")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => importSkillMutation.mutate()}>
                    <Upload />
                    {getAppShellSkillActionLabel("importSkillMarkdownFile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => importSkillFolderMutation.mutate()}>
                    <FolderOpen />
                    {getAppShellSkillActionLabel("importSkillFolder")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => importSkillsFromParentFolderMutation.mutate()}>
                    <FolderUp />
                    {getAppShellSkillActionLabel("bulkImportFromFolder")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-3 w-3" />
                {getAppShellEditorActionLabel("skill", false)}
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Enabled skills are available to {currentAgentDisplayName} and are sorted first. Disabled skills are hidden from the agent and blocked at runtime.
        </p>

        {/* Skills List */}
        <div className="space-y-1">
          {skillsQuery.isLoading ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2 font-medium text-foreground/80">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span>Loading skills...</span>
              </div>
            </div>
          ) : skillsQuery.isError ? (
            <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-4 py-5 text-center">
              <p className="text-sm font-medium text-destructive">Failed to load skills.</p>
              <p className="mt-1 text-sm text-muted-foreground">Please try again.</p>
            </div>
          ) : skills.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-center">
              <p className="text-sm font-medium">No skills yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first skill or import one.</p>
            </div>
          ) : (
            <>
              {currentProfileQuery.isError && (
                <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>
                    <p className="font-medium">Failed to load this agent's skill access.</p>
                    <p className="mt-0.5 text-amber-700/80 dark:text-amber-300/80">
                      Skills remain visible, but enablement controls are unavailable until the profile loads.
                    </p>
                  </div>
                </div>
              )}
              {displaySkills.map((skill) => {
                const isEnabled = isSkillEnabledForCurrentProfile(skill.id)
                const isProfileUnavailable = currentProfileQuery.isError
                const isProfileLoading = !isProfileUnavailable && isEnabled === null
                const isToggleDisabled = isProfileLoading || isProfileUnavailable || currentProfileQuery.isLoading || toggleProfileSkillMutation.isPending
                const skillStatusLabel = isProfileUnavailable ? "Unavailable" : isProfileLoading ? "Loading" : isEnabled ? "Enabled" : "Disabled"
                const skillStatusClassName = isEnabled === true ? "text-emerald-600 dark:text-emerald-400" : isProfileUnavailable ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"

                return (
                  <div
                    key={skill.id}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg border bg-card ${isSelectMode ? "cursor-pointer hover:bg-accent/50" : ""} ${isSelectMode && selectedSkillIds.has(skill.id) ? "border-primary bg-primary/5" : ""}`}
                    onClick={isSelectMode ? () => toggleSkillSelection(skill.id) : undefined}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isSelectMode && (
                        <button
                          type="button"
                          className="shrink-0 flex items-center justify-center"
                          onClick={(e) => { e.stopPropagation(); toggleSkillSelection(skill.id) }}
                        >
                          {selectedSkillIds.has(skill.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium leading-5">{skill.name}</div>
                        {skill.description && (
                          <div className="truncate text-[11px] leading-4 text-muted-foreground">{skill.description}</div>
                        )}
                      </div>
                    </div>
                    {!isSelectMode && (
                      <div className="ml-3 flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[11px] font-medium ${skillStatusClassName}`}>
                          {skillStatusLabel}
                        </span>
                        {isProfileLoading ? (
                          <div className="h-5 w-9 rounded-full bg-muted/70" aria-hidden="true" />
                        ) : (
                          <Switch
                            checked={isEnabled === true}
                            disabled={isToggleDisabled}
                            onCheckedChange={(checked) => {
                              if (!currentProfile) return
                              toggleProfileSkillMutation.mutate({
                                profileId: currentProfile.id,
                                skillId: skill.id,
                                skillName: skill.name,
                                willEnable: checked,
                              })
                            }}
                            aria-label={isProfileUnavailable ? `Skill access unavailable for ${skill.name}` : `${isEnabled ? "Disable" : "Enable"} ${skill.name}`}
                          />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 shrink-0 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                              aria-label={getAppShellSkillItemActionAccessibilityLabel("actions", skill.name)}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                              <span>{getAppShellSkillActionLabel("actions")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSkill(skill)}>
                              <Pencil className="h-3.5 w-3.5" />
                              {getAppShellSkillActionLabel("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openSkillFileMutation.mutate(skill.id)}>
                              <FileText className="h-3.5 w-3.5" />
                              {getAppShellSkillActionLabel("revealFile")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportSkillMutation.mutate(skill.id)}>
                              <Download className="h-3.5 w-3.5" />
                              {getAppShellSkillActionLabel("export")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteSkill(skill)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {getAppShellSkillActionLabel("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Create Skill Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{getAppShellEditorTitle("skill", false)}</DialogTitle>
              <DialogDescription>
                {APP_SHELL_SKILL_EDITOR_PRESENTATION.createDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="skill-name">{APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.name.label}</Label>
                <Input
                  id="skill-name"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder={APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.name.placeholder}
                />
              </div>
              <div>
                <Label htmlFor="skill-description">{APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.description.label}</Label>
                <Input
                  id="skill-description"
                  value={newSkillDescription}
                  onChange={(e) => setNewSkillDescription(e.target.value)}
                  placeholder={APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.description.placeholder}
                />
              </div>
              <div>
                <Label htmlFor="skill-instructions">{APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.instructions.label}</Label>
                <Textarea
                  id="skill-instructions"
                  value={newSkillInstructions}
                  onChange={(e) => setNewSkillInstructions(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder={APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.instructions.placeholder}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSkill} disabled={createSkillMutation.isPending}>
                {createSkillMutation.isPending ? APP_SHELL_SKILL_EDITOR_PRESENTATION.pending.creatingLabel : getAppShellEditorActionLabel("skill", false)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Skill Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{getAppShellEditorTitle("skill", true)}</DialogTitle>
              <DialogDescription>
                {APP_SHELL_SKILL_EDITOR_PRESENTATION.editDescription}
              </DialogDescription>
            </DialogHeader>
            {editingSkill && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-skill-name">{APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.name.label}</Label>
                  <Input
                    id="edit-skill-name"
                    value={editingSkill.name}
                    onChange={(e) =>
                      setEditingSkill({ ...editingSkill, name: e.target.value })
                    }
                    placeholder={APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.name.placeholder}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-skill-description">{APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.description.label}</Label>
                  <Input
                    id="edit-skill-description"
                    value={editingSkill.description}
                    onChange={(e) =>
                      setEditingSkill({ ...editingSkill, description: e.target.value })
                    }
                    placeholder={APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.description.placeholder}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-skill-instructions">{APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.instructions.label}</Label>
                  <Textarea
                    id="edit-skill-instructions"
                    value={editingSkill.instructions}
                    onChange={(e) =>
                      setEditingSkill({ ...editingSkill, instructions: e.target.value })
                    }
                    rows={12}
                    className="font-mono text-sm"
                    placeholder={APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.instructions.placeholder}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSkill} disabled={updateSkillMutation.isPending}>
                {updateSkillMutation.isPending ? APP_SHELL_SKILL_EDITOR_PRESENTATION.pending.savingLabel : getAppShellEditorActionLabel("skill", true)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <BundleImportDialog
          open={isBundleImportDialogOpen}
          onOpenChange={setIsBundleImportDialogOpen}
          onImportComplete={handleBundleImportComplete}
          title={getAppShellSkillActionLabel("importBundle")}
          description="Preview and import skills from a local .dotagents bundle file."
          initialComponents={{
            agentProfiles: false,
            mcpServers: false,
            skills: true,
            repeatTasks: false,
            knowledgeNotes: false,
          }}
          availableComponents={{
            agentProfiles: false,
            mcpServers: false,
            skills: true,
            repeatTasks: false,
            knowledgeNotes: false,
          }}
        />

        {/* GitHub Import Dialog */}
        <Dialog open={isGitHubDialogOpen} onOpenChange={setIsGitHubDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{getAppShellSkillActionLabel("importSkillFromGitHubTitle")}</DialogTitle>
              <DialogDescription>
                Enter a GitHub repository to import skills from. Supports formats like "owner/repo" or full GitHub URLs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="github-repo">Repository</Label>
                <Input
                  id="github-repo"
                  value={gitHubRepoInput}
                  onChange={(e) => setGitHubRepoInput(e.target.value)}
                  placeholder="e.g., SawyerHood/dev-browser"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleImportFromGitHub()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Examples: owner/repo, owner/repo/skills/my-skill, or https://github.com/owner/repo
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsGitHubDialogOpen(false)
                setGitHubRepoInput("")
              }}>
                Cancel
              </Button>
              <Button className="gap-1.5" onClick={handleImportFromGitHub} disabled={importSkillFromGitHubMutation.isPending}>
                {importSkillFromGitHubMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {getAppShellSkillActionLabel("importing")}
                  </>
                ) : (
                  <>
                    <Github className="h-3 w-3" />
                    {getAppShellSkillActionLabel("import")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
