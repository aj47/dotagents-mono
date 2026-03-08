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

  const handleSelectPrompt = (prompt: PredefinedPrompt) => {
    onSelectPrompt(prompt.content)
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

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && saveConfig.isPending) return
    setIsDialogOpen(open)
  }

  const handleDelete = (e: React.MouseEvent | Event, prompt: PredefinedPrompt) => {
    e.preventDefault()
    e.stopPropagation()
    if (!configQuery.data) return
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

    try {
      await saveConfig.mutateAsync({
        config: {
          ...configQuery.data,
          predefinedPrompts: updatedPrompts,
        },
      })
      setIsDialogOpen(false)
    } catch {
      return
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
          <DropdownMenuItem onSelect={handleAddNew} className="cursor-pointer">
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
            <Button
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={saveConfig.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleSave()
              }}
              disabled={saveConfig.isPending || !promptName.trim() || !promptContent.trim()}
            >
              {saveConfig.isPending ? "Saving..." : editingPrompt ? "Save Changes" : "Add Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

