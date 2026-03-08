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
import { tipcClient, rendererHandlers } from "@renderer/lib/tipc-client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AgentSkill } from "@shared/types"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Download, Upload, FolderOpen, RefreshCw, Sparkles, Loader2, ChevronDown, FolderUp, Github, CheckSquare, Square, X, FileText, Package, AlertTriangle } from "lucide-react"

type SkillDraft = Pick<AgentSkill, "name" | "description" | "instructions">

const EMPTY_SKILL_DRAFT: SkillDraft = {
  name: "",
  description: "",
  instructions: "",
}

function toSkillDraft(skill?: Partial<SkillDraft> | null): SkillDraft {
  return {
    name: skill?.name ?? "",
    description: skill?.description ?? "",
    instructions: skill?.instructions ?? "",
  }
}

function hasSkillDraftChanges(draft?: Partial<SkillDraft> | null, baseline?: Partial<SkillDraft> | null): boolean {
  const nextDraft = toSkillDraft(draft)
  const nextBaseline = toSkillDraft(baseline)

  return nextDraft.name !== nextBaseline.name
    || nextDraft.description !== nextBaseline.description
    || nextDraft.instructions !== nextBaseline.instructions
}

function DialogActionError({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-xs text-destructive"
    >
      {message}
    </div>
  )
}


export function Component() {
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<AgentSkill | null>(null)
  const [editingSkillBaseline, setEditingSkillBaseline] = useState<SkillDraft | null>(null)
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillDescription, setNewSkillDescription] = useState("")
  const [newSkillInstructions, setNewSkillInstructions] = useState("")
  const [isGitHubDialogOpen, setIsGitHubDialogOpen] = useState(false)
  const [isBundleImportDialogOpen, setIsBundleImportDialogOpen] = useState(false)
  const [gitHubRepoInput, setGitHubRepoInput] = useState("")
  const [createSkillError, setCreateSkillError] = useState<string | null>(null)
  const [editSkillError, setEditSkillError] = useState<string | null>(null)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set())
  const [deleteConfirmSkill, setDeleteConfirmSkill] = useState<AgentSkill | null>(null)
  const [deleteSkillError, setDeleteSkillError] = useState<string | null>(null)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null)

  const skillsQuery = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      return await tipcClient.getSkills()
    },
  })

  const agentsFoldersQuery = useQuery({
    queryKey: ["agentsFolders"],
    queryFn: async () => {
      return await tipcClient.getAgentsFolders()
    },
    staleTime: Infinity,
  })

  const skills = skillsQuery.data || []
  const selectedSkills = skills.filter((skill) => selectedSkillIds.has(skill.id))
  const selectedSkillCount = selectedSkills.length
  const deleteSkillLabel = deleteConfirmSkill ? `"${deleteConfirmSkill.name}"` : "this skill"

  // Listen for skills folder changes from the main process (file watcher)
  useEffect(() => {
    const unsubscribe = rendererHandlers.skillsFolderChanged.listen(async () => {
      try {
        // Auto-scan and refresh skills when folder changes
        const importedSkills = await tipcClient.scanSkillsFolder()
        queryClient.invalidateQueries({ queryKey: ["skills"] })
        if (importedSkills && importedSkills.length > 0) {
          toast.success(`Auto-imported ${importedSkills.length} skill(s)`)
        }
      } catch (error) {
        console.error("Failed to auto-refresh skills:", error)
        toast.error("Failed to auto-refresh skills")
      }
    })
    return () => unsubscribe()
  }, [queryClient])

  const resetNewSkillForm = () => {
    setNewSkillName("")
    setNewSkillDescription("")
    setNewSkillInstructions("")
    setCreateSkillError(null)
  }

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false)
    resetNewSkillForm()
  }

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingSkill(null)
    setEditingSkillBaseline(null)
    setEditSkillError(null)
  }

  const closeDeleteSkillDialog = () => {
    if (deleteSkillMutation.isPending) return
    setDeleteConfirmSkill(null)
    setDeleteSkillError(null)
  }

  const closeBulkDeleteDialog = () => {
    if (deleteSkillsMutation.isPending) return
    setBulkDeleteConfirm(false)
    setBulkDeleteError(null)
  }

  const createSkillMutation = useMutation({
    mutationFn: async ({ name, description, instructions }: { name: string; description: string; instructions: string }) => {
      return await tipcClient.createSkill({ name, description, instructions })
    },
  })

  const updateSkillMutation = useMutation({
    mutationFn: async ({ id, name, description, instructions }: { id: string; name?: string; description?: string; instructions?: string }) => {
      return await tipcClient.updateSkill({ id, name, description, instructions })
    },
  })

  const deleteSkillMutation = useMutation({
    mutationFn: async (id: string) => {
      return await tipcClient.deleteSkill({ id })
    },
  })

  const deleteSkillsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await tipcClient.deleteSkills({ ids })
    },
  })

  const importSkillMutation = useMutation({
    mutationFn: async () => {
      return await tipcClient.importSkillFile()
    },
    onSuccess: (skill: AgentSkill | null) => {
      if (skill) {
        queryClient.invalidateQueries({ queryKey: ["skills"] })
        toast.success(`Skill "${skill.name}" imported successfully`)
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to import skill: ${error.message}`)
    },
  })

  // Import a single skill folder containing SKILL.md
  const importSkillFolderMutation = useMutation({
    mutationFn: async () => {
      return await tipcClient.importSkillFolder()
    },
    onSuccess: (skill: AgentSkill | null) => {
      if (skill) {
        queryClient.invalidateQueries({ queryKey: ["skills"] })
        toast.success(`Skill "${skill.name}" imported successfully`)
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to import skill folder: ${error.message}`)
    },
  })

  // Bulk import all skill folders from a parent directory
  const importSkillsFromParentFolderMutation = useMutation({
    mutationFn: async () => {
      return await tipcClient.importSkillsFromParentFolder()
    },
    onSuccess: (result: { imported: AgentSkill[]; skipped: string[]; errors: Array<{ folder: string; error: string }> } | null) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ["skills"] })

        const messages: string[] = []
        if (result.imported.length > 0) {
          messages.push(`Imported ${result.imported.length} skill(s)`)
        }
        if (result.skipped.length > 0) {
          messages.push(`${result.skipped.length} already imported`)
        }
        if (result.errors.length > 0) {
          messages.push(`${result.errors.length} failed`)
        }
        if (result.imported.length > 0) {
          toast.success(messages.join(", "))
        } else if (result.skipped.length > 0) {
          toast.info(messages.join(", "))
        } else if (result.errors.length > 0) {
          toast.error(`Failed to import skills: ${result.errors.map(e => e.folder).join(", ")}`)
        } else {
          toast.info("No skill folders found")
        }
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to import skills: ${error.message}`)
    },
  })

  const exportSkillMutation = useMutation({
    mutationFn: async (id: string) => {
      return await tipcClient.saveSkillFile({ id })
    },
    onSuccess: (success: boolean) => {
      if (success) {
        toast.success("Skill exported successfully")
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to export skill: ${error.message}`)
    },
  })

  const exportBundleMutation = useMutation({
    mutationFn: async ({ skillIds, name }: { skillIds: string[]; name: string }) => {
      return await tipcClient.exportBundle({
        name,
        skillIds,
        components: {
          agentProfiles: false,
          mcpServers: false,
          skills: true,
          repeatTasks: false,
          memories: false,
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
      return await tipcClient.openSkillFile({ skillId })
    },
    onSuccess: (result) => {
      if (!result?.success) {
        toast.error(result?.error || "Failed to reveal skill file")
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to reveal skill file: ${error.message}`)
    },
  })

  const openSkillsFolderMutation = useMutation({
    mutationFn: async () => {
      return await tipcClient.openSkillsFolder()
    },
    onSuccess: (result) => {
      if (!result?.success) {
        toast.error(result?.error || "Failed to open skills folder")
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to open skills folder: ${error.message}`)
    },
  })

  const openWorkspaceSkillsFolderMutation = useMutation({
    mutationFn: async () => {
      return await tipcClient.openWorkspaceSkillsFolder()
    },
    onSuccess: (result) => {
      if (!result?.success) {
        toast.error(result?.error || "Failed to open workspace skills folder")
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to open workspace skills folder: ${error.message}`)
    },
  })

  const scanSkillsFolderMutation = useMutation({
    mutationFn: async () => {
      return await tipcClient.scanSkillsFolder()
    },
    onSuccess: (importedSkills: AgentSkill[]) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] })
      if (importedSkills.length > 0) {
        toast.success(`Imported ${importedSkills.length} skill(s) from folder`)
      } else {
        toast.info("No new skills found in folder")
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to scan skills folder: ${error.message}`)
    },
  })

  // Import skill from GitHub repository
  const importSkillFromGitHubMutation = useMutation({
    mutationFn: async (repoIdentifier: string) => {
      return await tipcClient.importSkillFromGitHub({ repoIdentifier })
    },
    onSuccess: (result) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ["skills"] })
        if (result.imported.length > 0) {
          toast.success(`Imported ${result.imported.length} skill(s) from GitHub: ${result.imported.map(s => s.name).join(", ")}`)
        } else if (result.errors.length > 0) {
          toast.error(`Failed to import: ${result.errors.join("; ")}`)
        } else {
          toast.info("No skills found in repository")
        }
        setIsGitHubDialogOpen(false)
        setGitHubRepoInput("")
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to import from GitHub: ${error.message}`)
    },
  })

  const handleImportFromGitHub = () => {
    if (!gitHubRepoInput.trim()) {
      toast.error("Please enter a GitHub repository (e.g., owner/repo)")
      return
    }
    importSkillFromGitHubMutation.mutate(gitHubRepoInput.trim())
  }

  const createSkillDraft = {
    name: newSkillName,
    description: newSkillDescription,
    instructions: newSkillInstructions,
  }
  const isCreateSkillDirty = hasSkillDraftChanges(createSkillDraft, EMPTY_SKILL_DRAFT)
  const isEditSkillDirty = hasSkillDraftChanges(editingSkill, editingSkillBaseline)
  const editingSkillLabel = editingSkillBaseline?.name || editingSkill?.name || "this skill"
  const trimmedNewSkillName = newSkillName.trim()
  const trimmedNewSkillInstructions = newSkillInstructions.trim()
  const trimmedEditingSkillName = editingSkill?.name.trim() ?? ""
  const trimmedEditingSkillInstructions = editingSkill?.instructions.trim() ?? ""
  const canCreateSkill = isCreateSkillDirty
  const canUpdateSkill = !!editingSkill && isEditSkillDirty

  const handleCreateDialogOpenChange = (open: boolean) => {
    if (open) {
      setCreateSkillError(null)
      setIsCreateDialogOpen(true)
      return
    }

    if (createSkillMutation.isPending) return
    if (isCreateSkillDirty && !confirm("Discard this new skill draft? Your unsaved changes will be lost.")) return

    closeCreateDialog()
  }

  const handleEditDialogOpenChange = (open: boolean) => {
    if (open) {
      setEditSkillError(null)
      setIsEditDialogOpen(true)
      return
    }

    if (updateSkillMutation.isPending) return
    if (isEditSkillDirty && !confirm(`Discard your changes to \"${editingSkillLabel}\"? Your unsaved edits will be lost.`)) return

    closeEditDialog()
  }

  const handleCreateSkill = async () => {
    setCreateSkillError(null)

    if (!trimmedNewSkillName) {
      setCreateSkillError("Skill name is required")
      return
    }
    if (!trimmedNewSkillInstructions) {
      setCreateSkillError("Skill instructions are required")
      return
    }

    try {
      await createSkillMutation.mutateAsync({
        name: trimmedNewSkillName,
        description: newSkillDescription,
        instructions: newSkillInstructions,
      })
      queryClient.invalidateQueries({ queryKey: ["skills"] })
      closeCreateDialog()
      toast.success("Skill created successfully")
    } catch (error) {
      console.error("[SettingsSkills] Failed to create skill", error)
      const errorMessage = error instanceof Error && error.message.trim()
        ? error.message
        : "Couldn't create this new skill yet. Your draft is still open, so you can review it and try again."
      setCreateSkillError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleUpdateSkill = async () => {
    if (!editingSkill) return
    setEditSkillError(null)

    if (!trimmedEditingSkillName) {
      setEditSkillError("Skill name is required")
      return
    }

    if (!trimmedEditingSkillInstructions) {
      setEditSkillError("Skill instructions are required")
      return
    }

    try {
      await updateSkillMutation.mutateAsync({
        id: editingSkill.id,
        name: trimmedEditingSkillName,
        description: editingSkill.description,
        instructions: editingSkill.instructions,
      })
      queryClient.invalidateQueries({ queryKey: ["skills"] })
      closeEditDialog()
      toast.success("Skill updated successfully")
    } catch (error) {
      console.error("[SettingsSkills] Failed to update skill", error)
      const errorMessage = error instanceof Error && error.message.trim()
        ? error.message
        : `Couldn't save your changes to "${editingSkillLabel}" yet. Your draft is still open, so you can review it and try again.`
      setEditSkillError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleDeleteSkill = (skill: AgentSkill) => {
    if (deleteSkillMutation.isPending || deleteSkillsMutation.isPending) return
    setDeleteSkillError(null)
    setDeleteConfirmSkill(skill)
  }

  const handleDeleteSelected = () => {
    if (selectedSkillCount === 0 || deleteSkillsMutation.isPending || deleteSkillMutation.isPending) return
    setBulkDeleteError(null)
    setBulkDeleteConfirm(true)
  }

  const handleConfirmDeleteSkill = async () => {
    if (!deleteConfirmSkill || deleteSkillMutation.isPending) return

    const skill = deleteConfirmSkill
    setDeleteSkillError(null)

    try {
      const deleted = await deleteSkillMutation.mutateAsync(skill.id)
      if (!deleted) {
        throw new Error(`Couldn't delete "${skill.name}" yet. The skill is still available, so you can try again.`)
      }

      queryClient.invalidateQueries({ queryKey: ["skills"] })
      setDeleteConfirmSkill(null)
      toast.success(`Deleted "${skill.name}"`)
    } catch (error) {
      console.error("[SettingsSkills] Failed to delete skill", error)
      setDeleteConfirmSkill(skill)
      setDeleteSkillError(
        error instanceof Error && error.message.trim()
          ? error.message
          : `Couldn't delete "${skill.name}" yet. The skill is still available, so you can try again.`,
      )
    }
  }

  const handleConfirmDeleteSelected = async () => {
    if (selectedSkillCount === 0 || deleteSkillsMutation.isPending) {
      if (selectedSkillCount === 0) {
        setBulkDeleteConfirm(false)
        setBulkDeleteError(null)
      }
      return
    }

    const idsToDelete = selectedSkills.map((skill) => skill.id)
    setBulkDeleteError(null)

    try {
      const results = await deleteSkillsMutation.mutateAsync(idsToDelete)
      queryClient.invalidateQueries({ queryKey: ["skills"] })

      const succeeded = results.filter((result) => result.success).length
      const failedResults = results.filter((result) => !result.success)

      if (succeeded > 0) {
        toast.success(`Deleted ${succeeded} skill(s)`)
      }

      if (failedResults.length === 0) {
        setSelectedSkillIds(new Set())
        setIsSelectMode(false)
        setBulkDeleteConfirm(false)
        return
      }

      const failedIds = new Set(failedResults.map((result) => result.id))
      setSelectedSkillIds(failedIds)
      setBulkDeleteError(
        failedResults.length === 1
          ? "Couldn't delete 1 selected skill yet. That skill stays selected so you can retry."
          : `Couldn't delete ${failedResults.length} selected skills yet. They stay selected so you can retry.`,
      )
      toast.error(`Failed to delete ${failedResults.length} skill(s)`)
    } catch (error) {
      console.error("[SettingsSkills] Failed to delete selected skills", error)
      setBulkDeleteError(
        error instanceof Error && error.message.trim()
          ? error.message
          : "Couldn't delete the selected skills yet. They stay selected so you can retry.",
      )
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
    setSelectedSkillIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
    setEditingSkillBaseline(toSkillDraft(skill))
    setEditSkillError(null)
    setIsEditDialogOpen(true)
  }

  const handleBundleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["skills"] })
    queryClient.invalidateQueries({ queryKey: ["agentProfilesSidebar"] })
  }

  const skillsFileTemplate = `---
kind: skill
id: my-skill
name: My Skill
description: A short description
enabled: true
---

Write your skill instructions here.
`

  return (
    <div className="modern-panel h-full min-w-0 overflow-y-auto overflow-x-hidden px-6 py-4">
      <div className="min-w-0 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            <h2 className="text-lg font-semibold">Agent Skills</h2>
          </div>
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
                  {selectedSkillIds.size === skills.length && skills.length > 0 ? "Deselect All" : "Select All"}
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
                  Export Bundle {selectedSkillIds.size > 0 ? `(${selectedSkillIds.size})` : ""}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleDeleteSelected}
                    disabled={selectedSkillCount === 0 || deleteSkillsMutation.isPending || deleteSkillMutation.isPending}
                >
                  {deleteSkillsMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                    Delete {selectedSkillCount > 0 ? `(${selectedSkillCount})` : "Selected"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={exitSelectMode}
                >
                  <X className="h-3 w-3" />
                  Cancel
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
                    Select
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => openSkillsFolderMutation.mutate()}
                >
                  <FolderOpen className="h-3 w-3" />
                  Open Folder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => openWorkspaceSkillsFolderMutation.mutate()}
                  disabled={!agentsFoldersQuery.data?.workspace?.skillsDir || openWorkspaceSkillsFolderMutation.isPending}
                >
                  <FolderUp className="h-3 w-3" />
                  Workspace
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => scanSkillsFolderMutation.mutate()}
                  disabled={scanSkillsFolderMutation.isPending}
                >
                  <RefreshCw className={`h-3 w-3 ${scanSkillsFolderMutation.isPending ? 'animate-spin' : ''}`} />
                  Scan Folder
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
                      Import
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsBundleImportDialogOpen(true)}>
                      <Package />
                      Import Bundle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsGitHubDialogOpen(true)}>
                      <Github />
                      Import from GitHub
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => importSkillMutation.mutate()}>
                      <Upload />
                      Import SKILL.md File
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => importSkillFolderMutation.mutate()}>
                      <FolderOpen />
                      Import Skill Folder
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => importSkillsFromParentFolderMutation.mutate()}>
                      <FolderUp />
                      Bulk Import from Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  New Skill
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Skills are specialized instructions that improve AI performance on specific tasks.
            Enable skills to include their instructions in the system prompt.
          </p>
        </div>

        <details className="rounded-lg border bg-card">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">
            Modular config (.agents) file template
          </summary>
          <div className="px-4 pb-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              You can hand-author skills in <span className="font-mono">.agents/skills/&lt;id&gt;/skill.md</span>. Frontmatter
              uses simple <span className="font-mono">key: value</span> lines (not YAML). If a workspace <span className="font-mono">.agents</span>
              folder exists, it can override the global layer by skill <span className="font-mono">id</span>.
            </p>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Global: <span className="font-mono break-all">{agentsFoldersQuery.data?.global?.skillsDir ?? "~/.agents/skills"}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Workspace:{" "}
                <span className="font-mono break-all">
                  {agentsFoldersQuery.data?.workspace?.skillsDir ?? "Not detected"}
                  {agentsFoldersQuery.data?.workspace?.skillsDir && agentsFoldersQuery.data?.workspaceSource
                    ? ` (${agentsFoldersQuery.data.workspaceSource})`
                    : ""}
                </span>
              </div>
            </div>
            <div className="rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">{skillsFileTemplate}</div>
          </div>
        </details>

        {/* Skills List */}
        <div className="space-y-1">
          {skillsQuery.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
              <p>Loading skills...</p>
            </div>
          ) : skillsQuery.isError ? (
            <div className="text-center py-8 text-destructive">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Failed to load skills. Please try again.</p>
            </div>
          ) : skills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No skills yet. Create your first skill or import one.</p>
            </div>
          ) : (
            skills.map((skill) => (
              <div
                key={skill.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border bg-card ${isSelectMode ? "cursor-pointer hover:bg-accent/50" : ""} ${isSelectMode && selectedSkillIds.has(skill.id) ? "border-primary bg-primary/5" : ""}`}
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
                  <span className="font-medium truncate">{skill.name}</span>
                </div>
                {!isSelectMode && (
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSkill(skill)}
                      disabled={deleteSkillMutation.isPending || deleteSkillsMutation.isPending}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openSkillFileMutation.mutate(skill.id)}
                      title="Reveal skill file in Finder/Explorer"
                      aria-label="Reveal skill file"
                      disabled={deleteSkillMutation.isPending || deleteSkillsMutation.isPending}
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportSkillMutation.mutate(skill.id)}
                      disabled={deleteSkillMutation.isPending || deleteSkillsMutation.isPending}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSkill(skill)}
                      disabled={deleteSkillMutation.isPending || deleteSkillsMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Create Skill Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogOpenChange}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Skill</DialogTitle>
              <DialogDescription>
                Create a skill with specialized instructions for the AI agent.
              </DialogDescription>
            </DialogHeader>
            {isCreateSkillDirty && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                You have unsaved changes. Save before closing to keep this draft.
              </div>
            )}
            <DialogActionError message={createSkillError} />
            <div className="space-y-4">
              <div>
                <Label htmlFor="skill-name">Name</Label>
                <Input
                  id="skill-name"
                  value={newSkillName}
                  onChange={(e) => {
                    setNewSkillName(e.target.value)
                    setCreateSkillError(null)
                  }}
                  placeholder="e.g., Code Review Expert"
                />
              </div>
              <div>
                <Label htmlFor="skill-description">Description</Label>
                <Input
                  id="skill-description"
                  value={newSkillDescription}
                  onChange={(e) => {
                    setNewSkillDescription(e.target.value)
                    setCreateSkillError(null)
                  }}
                  placeholder="Brief description of what this skill does"
                />
              </div>
              <div>
                <Label htmlFor="skill-instructions">Instructions</Label>
                <Textarea
                  id="skill-instructions"
                  value={newSkillInstructions}
                  onChange={(e) => {
                    setNewSkillInstructions(e.target.value)
                    setCreateSkillError(null)
                  }}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="Enter the instructions for this skill in markdown format..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleCreateDialogOpenChange(false)} disabled={createSkillMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={() => void handleCreateSkill()} disabled={createSkillMutation.isPending || !canCreateSkill}>
                {createSkillMutation.isPending ? "Creating..." : createSkillError ? "Retry create" : "Create Skill"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Skill Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Skill</DialogTitle>
              <DialogDescription>
                Update the skill name, description, and instructions.
              </DialogDescription>
            </DialogHeader>
            {isEditSkillDirty && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                You have unsaved changes. Save before closing to keep this draft.
              </div>
            )}
            <DialogActionError message={editSkillError} />
            {editingSkill && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-skill-name">Name</Label>
                  <Input
                    id="edit-skill-name"
                    value={editingSkill.name}
                    onChange={(e) => {
                      setEditingSkill({ ...editingSkill, name: e.target.value })
                      setEditSkillError(null)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-skill-description">Description</Label>
                  <Input
                    id="edit-skill-description"
                    value={editingSkill.description}
                    onChange={(e) => {
                      setEditingSkill({ ...editingSkill, description: e.target.value })
                      setEditSkillError(null)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-skill-instructions">Instructions</Label>
                  <Textarea
                    id="edit-skill-instructions"
                    value={editingSkill.instructions}
                    onChange={(e) => {
                      setEditingSkill({ ...editingSkill, instructions: e.target.value })
                      setEditSkillError(null)
                    }}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => handleEditDialogOpenChange(false)} disabled={updateSkillMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={() => void handleUpdateSkill()} disabled={updateSkillMutation.isPending || !canUpdateSkill}>
                {updateSkillMutation.isPending ? "Saving..." : editSkillError ? "Retry save" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!deleteConfirmSkill}
          onOpenChange={(open) => {
            if (open) return
            closeDeleteSkillDialog()
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Skill
              </DialogTitle>
              <DialogDescription>
                {`Are you sure you want to delete ${deleteSkillLabel}? This removes the skill from your available library. This action cannot be undone.`}
              </DialogDescription>
            </DialogHeader>
            {deleteSkillError && (
              <p role="alert" aria-live="polite" className="text-sm text-destructive">
                {deleteSkillError}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeDeleteSkillDialog} disabled={deleteSkillMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={handleConfirmDeleteSkill}
                disabled={deleteSkillMutation.isPending}
              >
                {deleteSkillMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleteSkillError ? "Retry delete skill" : "Delete skill"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={bulkDeleteConfirm}
          onOpenChange={(open) => {
            if (open) {
              setBulkDeleteConfirm(true)
              return
            }
            closeBulkDeleteDialog()
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {selectedSkillCount === 1 ? "Delete 1 Skill" : `Delete ${selectedSkillCount} Skills`}
              </DialogTitle>
              <DialogDescription>
                {selectedSkillCount === 1
                  ? "Are you sure you want to delete the selected skill? This action cannot be undone."
                  : `Are you sure you want to delete ${selectedSkillCount} selected skills? This action cannot be undone.`}
              </DialogDescription>
            </DialogHeader>
            {bulkDeleteError && (
              <p role="alert" aria-live="polite" className="text-sm text-destructive">
                {bulkDeleteError}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeBulkDeleteDialog} disabled={deleteSkillsMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={handleConfirmDeleteSelected}
                disabled={deleteSkillsMutation.isPending}
              >
                {deleteSkillsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {bulkDeleteError
                  ? "Retry delete selected"
                  : selectedSkillCount === 1
                    ? "Delete 1 Skill"
                    : `Delete ${selectedSkillCount} Skills`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <BundleImportDialog
          open={isBundleImportDialogOpen}
          onOpenChange={setIsBundleImportDialogOpen}
          onImportComplete={handleBundleImportComplete}
          title="Import Skill Bundle"
          description="Preview and import skills from a local .dotagents bundle file."
          initialComponents={{
            agentProfiles: false,
            mcpServers: false,
            skills: true,
            repeatTasks: false,
            memories: false,
          }}
          availableComponents={{
            agentProfiles: false,
            mcpServers: false,
            skills: true,
            repeatTasks: false,
            memories: false,
          }}
        />

        {/* GitHub Import Dialog */}
        <Dialog open={isGitHubDialogOpen} onOpenChange={setIsGitHubDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Skill from GitHub</DialogTitle>
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
                    Importing...
                  </>
                ) : (
                  <>
                    <Github className="h-3 w-3" />
                    Import
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

