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
import { desktopLoopsClient } from "@renderer/lib/desktop-loops-client"
import { desktopSkillsClient } from "@renderer/lib/desktop-skills-client"
import type { PredefinedPrompt } from "@dotagents/shared/api-types"
import type { LoopConfig } from "@dotagents/shared/types"
import {
  createPredefinedPromptRecord,
  deletePredefinedPromptFromList,
  filterPromptLibraryItemsByQuery,
  formatPromptLibraryTaskRunningToast,
  formatPromptLibraryTaskUnavailableMessage,
  getPromptLibraryCopyState,
  getPromptLibraryDeletePromptAccessibilityLabel,
  getPromptLibraryDesktopSurfaceState,
  getPromptLibraryEditPromptAccessibilityLabel,
  getPromptLibraryEditorSaveActionLabel,
  getPromptLibraryEditorTitle,
  getPromptLibraryEmptyPromptLabel,
  getPromptLibraryEmptySkillLabel,
  getPromptLibraryEmptyTaskLabel,
  getPromptLibraryPromptContent,
  getPromptLibraryPromptDescription,
  getPromptLibrarySkillContent,
  getPromptLibrarySkillDescription,
  getPromptLibraryTaskDescription,
  updatePredefinedPromptList,
} from "@dotagents/shared/predefined-prompts"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

const promptCopy = getPromptLibraryCopyState()
const promptSurface = getPromptLibraryDesktopSurfaceState()

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
    queryFn: () => desktopSkillsClient.getSkills(),
  })
  const availableSkills = skillsQuery.data ?? []

  const loopsQuery = useQuery({
    queryKey: ["loops"],
    queryFn: () => desktopLoopsClient.getLoops(),
  })
  const availableTasks = loopsQuery.data ?? []
  const triggerButtonClassName = promptSurface.triggerButtonClassNameBySize[buttonSize]
  const triggerIconClassName = promptSurface.triggerIconClassNameBySize[buttonSize]
  const sectionLabelClassName = promptSurface.sectionLabelClassName
  const menuContentClassName = promptSurface.menuContentClassName
  const entryClassName = promptSurface.entryClassName
  const entryTextClassName = promptSurface.entryTextClassName
  const secondaryTextClassName = promptSurface.secondaryTextClassName
  const filteredPrompts = filterPromptLibraryItemsByQuery(prompts, searchQuery, (prompt) => [
    prompt.name,
    prompt.content,
  ])
  const filteredSkills = filterPromptLibraryItemsByQuery(availableSkills, searchQuery, (skill) => [
    skill.name,
    skill.description,
    skill.instructions,
  ])
  const filteredTasks = filterPromptLibraryItemsByQuery(availableTasks, searchQuery, (task) => [
    task.name,
    task.prompt,
  ])

  const handleSelectPrompt = (prompt: PredefinedPrompt) => {
    onSelectPrompt(getPromptLibraryPromptContent(prompt))
  }

  const handleTriggerTask = async (task: LoopConfig) => {
    try {
      const result = await desktopLoopsClient.runLoop(task.id)
      if (result && !result.success) {
        toast.error(formatPromptLibraryTaskUnavailableMessage(task.name))
        return
      }
      queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })
      toast.success(formatPromptLibraryTaskRunningToast(task.name))
    } catch {
      toast.error(promptCopy.feedback.taskTriggerFailed)
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
            className={cn(promptSurface.triggerBaseClassName, triggerButtonClassName, className)}
            disabled={disabled}
            title={promptCopy.triggerTitle}
            aria-label={promptCopy.triggerAccessibilityLabel}
          >
            <BookMarked className={triggerIconClassName} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={menuContentClassName}>
          <div
            className={promptSurface.searchContainerClassName}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key !== "Escape") e.stopPropagation()
            }}
          >
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={promptCopy.search.placeholder}
              aria-label={promptCopy.search.accessibilityLabel}
              wrapperClassName={promptSurface.searchWrapperClassName}
              className={promptSurface.searchInputClassName}
              endContent={<Search className={promptSurface.searchIconClassName} />}
            />
          </div>
          <DropdownMenuLabel className={sectionLabelClassName}>{promptCopy.sections.prompts}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {filteredPrompts.length === 0 ? (
            <div className={promptSurface.emptyStateClassName}>
              {getPromptLibraryEmptyPromptLabel(prompts.length > 0)}
            </div>
          ) : (
            filteredPrompts.map((prompt) => (
              <DropdownMenuItem
                key={prompt.id}
                className={entryClassName}
                onSelect={() => handleSelectPrompt(prompt)}
              >
                <div className={entryTextClassName}>
                  <div className={promptSurface.entryTitleClassName} title={prompt.name}>{prompt.name}</div>
                  <p className={secondaryTextClassName}>{getPromptLibraryPromptDescription(prompt)}</p>
                </div>
                <div
                  className={promptSurface.itemActionsClassName}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="md-icon"
                    onClick={(e) => handleEdit(e, prompt)}
                    title={promptCopy.actions.edit}
                    aria-label={getPromptLibraryEditPromptAccessibilityLabel(prompt.name)}
                  >
                    <Pencil className={promptSurface.itemActionIconClassName} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md-icon"
                    className={promptSurface.destructiveActionClassName}
                    onClick={(e) => handleDelete(e, prompt)}
                    title={promptCopy.actions.delete}
                    aria-label={getPromptLibraryDeletePromptAccessibilityLabel(prompt.name)}
                  >
                    <Trash2 className={promptSurface.itemActionIconClassName} />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleAddNew} className={promptSurface.addItemClassName}>
            <Plus className={promptSurface.addItemIconClassName} />
            {promptCopy.actions.addNewPrompt}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className={sectionLabelClassName}>{promptCopy.sections.skills}</DropdownMenuLabel>
          {filteredSkills.length === 0 ? (
            <div className={promptSurface.emptyStateClassName}>
              {getPromptLibraryEmptySkillLabel(availableSkills.length > 0)}
            </div>
          ) : (
            filteredSkills.map((skill) => (
              <DropdownMenuItem
                key={skill.id}
                className={entryClassName}
                onSelect={() => onSelectPrompt(getPromptLibrarySkillContent(skill))}
              >
                <Sparkles className={promptSurface.sourceIconClassName} />
                <div className={entryTextClassName}>
                  <div className={promptSurface.entryTitleClassName} title={skill.name}>{skill.name}</div>
                  <p className={secondaryTextClassName}>
                    {getPromptLibrarySkillDescription(skill)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className={sectionLabelClassName}>{promptCopy.sections.tasks}</DropdownMenuLabel>
          {filteredTasks.length === 0 ? (
            <div className={promptSurface.emptyStateClassName}>
              {getPromptLibraryEmptyTaskLabel(availableTasks.length > 0)}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <DropdownMenuItem
                key={task.id}
                className={entryClassName}
                onSelect={() => handleTriggerTask(task)}
              >
                <Clock3 className={promptSurface.sourceIconClassName} />
                <div className={entryTextClassName}>
                  <div className={promptSurface.entryTitleClassName} title={task.name}>{task.name}</div>
                  <p className={secondaryTextClassName}>
                    {getPromptLibraryTaskDescription(task)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={promptSurface.dialogContentClassName}>
          <DialogHeader>
            <DialogTitle>{getPromptLibraryEditorTitle(Boolean(editingPrompt))}</DialogTitle>
            <DialogDescription>
              {promptCopy.editor.description}
            </DialogDescription>
          </DialogHeader>
          <div className={promptSurface.dialogBodyClassName}>
            <div className={promptSurface.dialogFieldClassName}>
              <Label htmlFor="prompt-name">{promptCopy.editor.nameLabel}</Label>
              <Input
                id="prompt-name"
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
                placeholder={promptCopy.editor.namePlaceholder}
              />
            </div>
            <div className={promptSurface.dialogFieldClassName}>
              <Label htmlFor="prompt-content">{promptCopy.editor.contentLabel}</Label>
              <Textarea
                id="prompt-content"
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                placeholder={promptCopy.editor.contentPlaceholder}
                className={promptSurface.dialogTextareaClassName}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {promptCopy.actions.cancel}
            </Button>
            <Button onClick={handleSave} disabled={!promptName.trim() || !promptContent.trim()}>
              {getPromptLibraryEditorSaveActionLabel(Boolean(editingPrompt))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
