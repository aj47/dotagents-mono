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
import { BookMarked, Plus, Pencil, Trash2, Sparkles } from "lucide-react"
import { useConfigQuery, useSaveConfigMutation } from "@renderer/lib/queries"
import { PredefinedPrompt } from "../../../shared/types"
import { useQuery } from "@tanstack/react-query"
import { tipcClient } from "@renderer/lib/tipc-client"

interface PromptDraft {
  name: string
  content: string
}

const EMPTY_PROMPT_DRAFT: PromptDraft = {
  name: "",
  content: "",
}

function toPromptDraft(prompt: Pick<PredefinedPrompt, "name" | "content">): PromptDraft {
  return {
    name: prompt.name,
    content: prompt.content,
  }
}

function hasPromptDraftChanges(draft: PromptDraft, baseline: PromptDraft | null): boolean {
  if (!baseline) return false

  return draft.name !== baseline.name || draft.content !== baseline.content
}

interface PredefinedPromptsMenuProps {
  onSelectPrompt: (content: string) => void
  className?: string
  disabled?: boolean
  buttonSize?: "default" | "sm" | "icon"
}

export function PredefinedPromptsMenu({
  onSelectPrompt,
  className,
  disabled = false,
  buttonSize = "icon",
}: PredefinedPromptsMenuProps) {
  // Map buttonSize prop to actual Button size - always use "icon" variant for icon-only buttons
  const actualButtonSize = "icon" as const
  const configQuery = useConfigQuery()
  const saveConfig = useSaveConfigMutation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PredefinedPrompt | null>(null)
  const [promptName, setPromptName] = useState("")
  const [promptContent, setPromptContent] = useState("")
  const [promptBaseline, setPromptBaseline] = useState<PromptDraft | null>(null)
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null)

  const prompts = configQuery.data?.predefinedPrompts || []

  const skillsQuery = useQuery({
    queryKey: ["skills"],
    queryFn: () => tipcClient.getSkills(),
  })
  const availableSkills = skillsQuery.data ?? []
  const triggerButtonClassName = buttonSize === "default"
    ? "h-9 w-9"
    : buttonSize === "sm"
      ? "h-7 w-7"
      : "h-8 w-8"
  const triggerIconClassName = buttonSize === "sm" ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4 shrink-0"
  const sectionLabelClassName = "px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
  const menuContentClassName = "w-[min(26rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] max-h-[min(32rem,calc(100vh-2rem))] overflow-y-auto"
  const entryClassName = "flex min-w-0 items-start gap-2.5 py-2 cursor-pointer"
  const entryTextClassName = "min-w-0 flex-1 space-y-0.5"
  const secondaryTextClassName = "line-clamp-2 text-xs leading-4 text-muted-foreground [overflow-wrap:anywhere]"
  const activeDraft = {
    name: promptName,
    content: promptContent,
  }
  const isPromptDirty = hasPromptDraftChanges(activeDraft, promptBaseline)
  const promptLabel = editingPrompt?.name || promptName.trim() || "this prompt"

  const handleSelectPrompt = (prompt: PredefinedPrompt) => {
    onSelectPrompt(prompt.content)
  }

  const resetPromptForm = () => {
    setEditingPrompt(null)
    setPromptName("")
    setPromptContent("")
    setPromptBaseline(null)
    setSaveErrorMessage(null)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    resetPromptForm()
  }

  const handleAddNew = () => {
    if (saveConfig.isPending) return
    setEditingPrompt(null)
    setPromptName("")
    setPromptContent("")
    setPromptBaseline(EMPTY_PROMPT_DRAFT)
    setSaveErrorMessage(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (e: React.MouseEvent | Event, prompt: PredefinedPrompt) => {
    e.preventDefault()
    e.stopPropagation()
    if (saveConfig.isPending) return
    setEditingPrompt(prompt)
    setPromptName(prompt.name)
    setPromptContent(prompt.content)
    setPromptBaseline(toPromptDraft(prompt))
    setSaveErrorMessage(null)
    setIsDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      setIsDialogOpen(true)
      return
    }

    if (saveConfig.isPending) return
    if (
      isPromptDirty
      && !confirm(
        editingPrompt
          ? `Discard your changes to "${promptLabel}"? Your unsaved edits will be lost.`
          : "Discard this new predefined prompt? Your unsaved changes will be lost.",
      )
    ) {
      return
    }

    closeDialog()
  }

  const handleDelete = (e: React.MouseEvent | Event, prompt: PredefinedPrompt) => {
    e.preventDefault()
    e.stopPropagation()
    if (saveConfig.isPending) return
    if (!configQuery.data) return
    if (!confirm(`Delete "${prompt.name}"? This saved prompt will be removed from quick access.`)) return

    const updatedPrompts = prompts.filter((p) => p.id !== prompt.id)
    saveConfig.mutate({
      config: {
        ...configQuery.data,
        predefinedPrompts: updatedPrompts,
      },
    })
  }

  const handleSave = async () => {
    if (!promptName.trim() || !promptContent.trim()) return
    if (!configQuery.data) return

    const now = Date.now()
    let updatedPrompts: PredefinedPrompt[]

    if (editingPrompt) {
      updatedPrompts = prompts.map((p) =>
        p.id === editingPrompt.id
          ? { ...p, name: promptName.trim(), content: promptContent.trim(), updatedAt: now }
          : p
      )
    } else {
      const newPrompt: PredefinedPrompt = {
        id: `prompt-${now}-${Math.random().toString(36).substr(2, 9)}`,
        name: promptName.trim(),
        content: promptContent.trim(),
        createdAt: now,
        updatedAt: now,
      }
      updatedPrompts = [...prompts, newPrompt]
    }

    setSaveErrorMessage(null)

    try {
      await saveConfig.mutateAsync({
        config: {
          ...configQuery.data,
          predefinedPrompts: updatedPrompts,
        },
      })
      closeDialog()
    } catch {
      setSaveErrorMessage(
        editingPrompt
          ? "Couldn't save your prompt changes yet. Your draft is still open, so you can try again."
          : "Couldn't save this new prompt yet. Your draft is still open, so you can try again.",
      )
    }
  }

  return (
    <>
      <DropdownMenu>
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
          <DropdownMenuLabel className={sectionLabelClassName}>Predefined Prompts</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {prompts.length === 0 ? (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground [overflow-wrap:anywhere]">
              No saved prompts yet
            </div>
          ) : (
            prompts.map((prompt) => (
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
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleEdit(e, prompt)}
                    disabled={saveConfig.isPending}
                    title="Edit"
                    aria-label={`Edit predefined prompt ${prompt.name}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => handleDelete(e, prompt)}
                    disabled={saveConfig.isPending}
                    title="Delete"
                    aria-label={`Delete predefined prompt ${prompt.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleAddNew} className="cursor-pointer" disabled={saveConfig.isPending}>
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            Add new prompt
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className={sectionLabelClassName}>Skills</DropdownMenuLabel>
          {availableSkills.length === 0 ? (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground [overflow-wrap:anywhere]">
              No skills available
            </div>
          ) : (
            availableSkills.map((skill) => (
              <DropdownMenuItem
                key={skill.id}
                className={entryClassName}
                onSelect={() => onSelectPrompt(skill.instructions)}
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className={entryTextClassName}>
                  <div className="truncate font-medium" title={skill.name}>{skill.name}</div>
                  <p className={secondaryTextClassName}>
                    {skill.description || "Use this skill as a reusable prompt."}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? "Edit Prompt" : "Add New Prompt"}</DialogTitle>
            <DialogDescription>
              Save a frequently used prompt for quick access.
            </DialogDescription>
          </DialogHeader>
          {isPromptDirty && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
              You have unsaved changes. Save before closing to keep this draft.
            </div>
          )}
          {saveErrorMessage && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive"
            >
              {saveErrorMessage}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-name">Name</Label>
              <Input
                id="prompt-name"
                value={promptName}
                onChange={(e) => {
                  setPromptName(e.target.value)
                  setSaveErrorMessage(null)
                }}
                placeholder="e.g., Code Review Request"
                disabled={saveConfig.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-content">Prompt Content</Label>
              <Textarea
                id="prompt-content"
                value={promptContent}
                onChange={(e) => {
                  setPromptContent(e.target.value)
                  setSaveErrorMessage(null)
                }}
                placeholder="Enter your prompt text..."
                className="min-h-[120px] resize-y"
                disabled={saveConfig.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={saveConfig.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveConfig.isPending || !promptName.trim() || !promptContent.trim()}>
              {saveConfig.isPending ? (editingPrompt ? "Saving..." : "Adding...") : editingPrompt ? "Save Changes" : "Add Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

