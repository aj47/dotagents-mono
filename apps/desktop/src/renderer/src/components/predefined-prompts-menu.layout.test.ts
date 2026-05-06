import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const predefinedPromptsMenuSource = readFileSync(new URL("./predefined-prompts-menu.tsx", import.meta.url), "utf8")

describe("predefined prompts menu layout", () => {
  it("keeps the trigger and dropdown content readable in dense desktop composer chrome", () => {
    expect(predefinedPromptsMenuSource).toContain('const triggerButtonClassName = buttonSize === "default"')
    expect(predefinedPromptsMenuSource).toContain('const menuContentClassName = "w-[min(26rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] max-h-[min(32rem,calc(100vh-2rem))] overflow-y-auto"')
    expect(predefinedPromptsMenuSource).toContain('const entryClassName = "flex min-w-0 items-start gap-2.5 py-2 cursor-pointer"')
    expect(predefinedPromptsMenuSource).toContain('const secondaryTextClassName = "line-clamp-2 text-xs leading-4 text-muted-foreground [overflow-wrap:anywhere]"')
    expect(predefinedPromptsMenuSource).toContain('aria-label="Open predefined prompts"')
    expect(predefinedPromptsMenuSource).toContain('? "h-7 w-7"')
    expect(predefinedPromptsMenuSource).toContain('className={cn("shrink-0", triggerButtonClassName, className)}')
  })

  it("shows prompt and skill previews instead of relying on single-line truncation", () => {
    expect(predefinedPromptsMenuSource).toContain('<p className={secondaryTextClassName}>{prompt.content}</p>')
    expect(predefinedPromptsMenuSource).toContain("{getPromptLibrarySkillDescription(skill)}")
    expect(predefinedPromptsMenuSource).toContain('className="truncate font-medium" title={prompt.name}')
    expect(predefinedPromptsMenuSource).toContain('className="truncate font-medium" title={skill.name}')
  })

  it("adds a top search filter for prompts, skills, and tasks", () => {
    expect(predefinedPromptsMenuSource).toContain('const [searchQuery, setSearchQuery] = useState("")')
    expect(predefinedPromptsMenuSource).toContain('placeholder="Search prompts, skills, tasks..."')
    expect(predefinedPromptsMenuSource).toContain('aria-label="Search prompts, skills, and tasks"')
    expect(predefinedPromptsMenuSource).toContain('const filteredPrompts = prompts.filter')
    expect(predefinedPromptsMenuSource).toContain('const filteredSkills = availableSkills.filter')
    expect(predefinedPromptsMenuSource).toContain('const filteredTasks = availableTasks.filter')
    expect(predefinedPromptsMenuSource).toContain('No matching prompts')
    expect(predefinedPromptsMenuSource).toContain('No matching skills')
    expect(predefinedPromptsMenuSource).toContain('No matching tasks')
  })

  it("uses shared predefined prompt mutation helpers", () => {
    expect(predefinedPromptsMenuSource).toContain("createPredefinedPromptRecord")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibrarySkillContent")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibrarySkillDescription")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryTaskDescription")
    expect(predefinedPromptsMenuSource).toContain("updatePredefinedPromptList(prompts, editingPrompt.id, draft, now)")
    expect(predefinedPromptsMenuSource).toContain("deletePredefinedPromptFromList(prompts, prompt.id)")
    expect(predefinedPromptsMenuSource).not.toContain("Math.random().toString(36)")
    expect(predefinedPromptsMenuSource).not.toContain("prompts.filter((p) => p.id !== prompt.id)")
  })
})
