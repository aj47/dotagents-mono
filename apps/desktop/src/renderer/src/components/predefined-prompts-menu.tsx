import React, { useState } from "react"
import { cn } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Textarea } from "@renderer/components/ui/textarea"
import { Label } from "@renderer/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@renderer/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import { BookMarked, Plus, Pencil, Trash2, Sparkles, Clock3, Search } from "lucide-react"
import { queryClient, useConfigQuery, useSaveConfigMutation } from "@renderer/lib/queries"
import { PredefinedPrompt, LoopConfig } from "../../../shared/types"
import {
  createPredefinedPromptRecord,
  deletePredefinedPromptFromList,
  PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION,
  updatePredefinedPromptList,
} from "@dotagents/shared/predefined-prompts"
import { useQuery } from "@tanstack/react-query"
import { tipcClient } from "@renderer/lib/tipc-client"
import { toast } from "sonner"

interface PredefinedPromptsMenuProps {
  onSelectPrompt: (content: string) => void
  className?: string
  disabled?: boolean
  buttonSize?: "default" | "sm" | "icon" | "sm-icon" | "md-icon"
}

export function PredefinedPromptsMenu({
  onSelectPrompt,
  className,
  disabled = false,
  buttonSize = "icon",
}: PredefinedPromptsMenuProps) {
  // Map buttonSize prop to actual Button size
  const actualButtonSize = (buttonSize === "sm-icon" ? "sm-icon" : buttonSize === "md-icon" ? "md-icon" : "icon") as "icon" | "sm-icon" | "md-icon"
  const configQuery = useConfigQuery()
  const saveConfig = useSaveConfigMutation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PredefinedPrompt | null>(null)
  const [promptName, setPromptName] = useState("")
  const [promptContent, setPromptContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const prompts = configQuery.data?.predefinedPrompts || []

  const skillsQuery = useQuery({
    queryKey: ["skills"],
    queryFn: () => tipcClient.getSkills(),
  })
  const availableSkills = skillsQuery.data ?? []

  const loopsQuery = useQuery({
    queryKey: ["loops"],
    queryFn: () => tipcClient.getLoops() as Promise<LoopConfig[]>,
  })
  const availableTasks = loopsQuery.data ?? []
  const triggerButtonClassName = buttonSize === "default"
    ? "h-9 w-9"
    : buttonSize === "sm" || buttonSize === "md-icon"
      ? "h-7 w-7"
      : buttonSize === "sm-icon"
        ? "h-6 w-6"
        : "h-8 w-8"
  const triggerIconClassName = (buttonSize === "sm" || buttonSize === "sm-icon" || buttonSize === "md-icon") ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4 shrink-0"
  const sectionLabelClassName = "px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
  const menuContentClassName = "w-[min(26rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] max-h-[min(32rem,calc(100vh-2rem))] overflow-y-auto"
  const entryClassName = "flex min-w-0 items-start gap-2.5 py-2 cursor-pointer"
  const entryTextClassName = "min-w-0 flex-1 space-y-0.5"
  const secondaryTextClassName = "line-clamp-2 text-xs leading-4 text-muted-foreground [overflow-wrap:anywhere]"
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const matchesSearch = (...values: Array<string | undefined | null>) => {
    if (!normalizedSearchQuery) return true
    return values.some((value) => value?.toLowerCase().includes(normalizedSearchQuery))
  }
  const filteredPrompts = prompts.filter((prompt) => matchesSearch(prompt.name, prompt.content))
  const filteredSkills = availableSkills.filter((skill) => matchesSearch(
    skill.name,
    skill.description,
    skill.instructions,
  ))
  const filteredTasks = availableTasks.filter((task) => matchesSearch(task.name, task.prompt))

  const handleSelectPrompt = (prompt: PredefinedPrompt) => {
    onSelectPrompt(prompt.content)
  }

  const handleTriggerTask = async (task: LoopConfig) => {
    try {
      const result = await tipcClient.triggerLoop?.({ loopId: task.id })
      if (result && !result.success) {
        toast.error(`Could not trigger "${task.name}" right now`)
        return
      }
      queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
      toast.success(`Running "${task.name}"...`)
    } catch {
      toast.error("Failed to trigger task")
    }
  }

  const handleAddNew = () => {
    setEditingPrompt(null)
    setPromptName("")
    setPromptContent("")
    setIsDialogOpen(true)
  }

  const handleEdit = (e: React.MouseEvent | Event, prompt: PredefinedPrompt) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingPrompt(prompt)
    setPromptName(prompt.name)
    setPromptContent(prompt.content)
    setIsDialogOpen(true)
  }

  const handleDelete = (e: React.MouseEvent | Event, prompt: PredefinedPrompt) => {
    e.preventDefault()
    e.stopPropagation()
    if (!configQuery.data) return
    const updatedPrompts = deletePredefinedPromptFromList(prompts, prompt.id)
    saveConfig.mutate({
      config: {
        ...configQuery.data,
        predefinedPrompts: updatedPrompts,
      },
    })
  }

  const handleSave = () => {
    if (!promptName.trim() || !promptContent.trim()) return
    if (!configQuery.data) return

    const now = Date.now()
    const draft = {
      name: promptName,
      content: promptContent,
    }
    let updatedPrompts: PredefinedPrompt[]

    if (editingPrompt) {
      updatedPrompts = updatePredefinedPromptList(prompts, editingPrompt.id, draft, now)
    } else {
      const newPrompt: PredefinedPrompt = createPredefinedPromptRecord(draft, now)
      updatedPrompts = [...prompts, newPrompt]
    }

    saveConfig.mutate({
      config: {
        ...configQuery.data,
        predefinedPrompts: updatedPrompts,
      },
    })
    setIsDialogOpen(false)
  }

  return (
    <>
      <DropdownMenu onOpenChange={(open) => { if (!open) setSearchQuery("") }}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size={actualButtonSize}
            variant="ghost"
            className={cn("shrink-0", triggerButtonClassName, className)}
            disabled={disabled}
            title="Predefined prompts"
            aria-label="Open predefined prompts"
          >
            <BookMarked className={triggerIconClassName} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={menuContentClassName}>
          <div
            className="sticky top-0 z-10 border-b bg-popover p-2"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key !== "Escape") e.stopPropagation()
            }}
          >
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts, skills, tasks..."
              aria-label="Search prompts, skills, and tasks"
              wrapperClassName="h-8"
              className="text-xs"
              endContent={<Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            />
          </div>
          <DropdownMenuLabel className={sectionLabelClassName}>Predefined Prompts</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {filteredPrompts.length === 0 ? (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground [overflow-wrap:anywhere]">
              {prompts.length === 0 ? "No saved prompts yet" : "No matching prompts"}
            </div>
          ) : (
            filteredPrompts.map((prompt) => (
              <DropdownMenuItem
                key={prompt.id}
                className={entryClassName}
                onSelect={() => handleSelectPrompt(prompt)}
              >
                <div className={entryTextClassName}>
                  <div className="truncate font-medium" title={prompt.name}>{prompt.name}</div>
                  <p className={secondaryTextClassName}>{prompt.content}</p>
                </div>
                <div
                  className="mt-0.5 flex shrink-0 items-center gap-1 self-start"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="md-icon"
                    onClick={(e) => handleEdit(e, prompt)}
                    title="Edit"
                    aria-label={`Edit predefined prompt ${prompt.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md-icon"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => handleDelete(e, prompt)}
                    title="Delete"
                    aria-label={`Delete predefined prompt ${prompt.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleAddNew} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            Add new prompt
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className={sectionLabelClassName}>Skills</DropdownMenuLabel>
          {filteredSkills.length === 0 ? (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground [overflow-wrap:anywhere]">
              {availableSkills.length === 0 ? "No skills available" : "No matching skills"}
            </div>
          ) : (
            filteredSkills.map((skill) => (
              <DropdownMenuItem
                key={skill.id}
                className={entryClassName}
                onSelect={() => onSelectPrompt(skill.instructions)}
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className={entryTextClassName}>
                  <div className="truncate font-medium" title={skill.name}>{skill.name}</div>
                  <p className={secondaryTextClassName}>
                    {skill.description || PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className={sectionLabelClassName}>Tasks</DropdownMenuLabel>
          {filteredTasks.length === 0 ? (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground [overflow-wrap:anywhere]">
              {availableTasks.length === 0 ? "No tasks available" : "No matching tasks"}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <DropdownMenuItem
                key={task.id}
                className={entryClassName}
                onSelect={() => handleTriggerTask(task)}
              >
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className={entryTextClassName}>
                  <div className="truncate font-medium" title={task.name}>{task.name}</div>
                  <p className={secondaryTextClassName}>
                    {task.prompt || "Run this task now."}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? "Edit Prompt" : "Add New Prompt"}</DialogTitle>
            <DialogDescription>
              Save a frequently used prompt for quick access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-name">Name</Label>
              <Input
                id="prompt-name"
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
                placeholder="e.g., Code Review Request"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-content">Prompt Content</Label>
              <Textarea
                id="prompt-content"
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                placeholder="Enter your prompt text..."
                className="min-h-[120px] resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!promptName.trim() || !promptContent.trim()}>
              {editingPrompt ? "Save Changes" : "Add Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
