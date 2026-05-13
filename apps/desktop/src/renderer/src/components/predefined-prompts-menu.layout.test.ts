import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const predefinedPromptsMenuSource = readFileSync(new URL("./predefined-prompts-menu.tsx", import.meta.url), "utf8")

describe("predefined prompts menu layout", () => {
  it("keeps the trigger and dropdown content readable in dense desktop composer chrome", () => {
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryCopyState")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryDesktopSurfaceState")
    expect(predefinedPromptsMenuSource).toContain("const promptCopy = getPromptLibraryCopyState()")
    expect(predefinedPromptsMenuSource).toContain("const promptSurface = getPromptLibraryDesktopSurfaceState()")
    expect(predefinedPromptsMenuSource).toContain("promptSurface.triggerButtonClassNameBySize[buttonSize]")
    expect(predefinedPromptsMenuSource).toContain("promptSurface.menuContentClassName")
    expect(predefinedPromptsMenuSource).toContain("promptSurface.entryClassName")
    expect(predefinedPromptsMenuSource).toContain("promptSurface.secondaryTextClassName")
    expect(predefinedPromptsMenuSource).toContain("promptCopy.triggerAccessibilityLabel")
    expect(predefinedPromptsMenuSource).toContain("promptSurface.triggerIconClassNameBySize[buttonSize]")
    expect(predefinedPromptsMenuSource).toContain("className={cn(promptSurface.triggerBaseClassName, triggerButtonClassName, className)}")
    expect(predefinedPromptsMenuSource).not.toContain("PROMPT_LIBRARY_PRESENTATION")
    expect(predefinedPromptsMenuSource).not.toContain("PROMPT_LIBRARY_SURFACE_PRESENTATION")
  })

  it("shows prompt and skill previews instead of relying on single-line truncation", () => {
    expect(predefinedPromptsMenuSource).toContain("{getPromptLibraryPromptDescription(prompt)}")
    expect(predefinedPromptsMenuSource).toContain("{getPromptLibrarySkillDescription(skill)}")
    expect(predefinedPromptsMenuSource).toContain("className={promptSurface.entryTitleClassName} title={prompt.name}")
    expect(predefinedPromptsMenuSource).toContain("className={promptSurface.entryTitleClassName} title={skill.name}")
  })

  it("adds a top search filter for prompts, skills, and tasks", () => {
    expect(predefinedPromptsMenuSource).toContain('const [searchQuery, setSearchQuery] = useState("")')
    expect(predefinedPromptsMenuSource).toContain("promptCopy.search.placeholder")
    expect(predefinedPromptsMenuSource).toContain("promptCopy.search.accessibilityLabel")
    expect(predefinedPromptsMenuSource).toContain('filterPromptLibraryItemsByQuery(prompts, searchQuery')
    expect(predefinedPromptsMenuSource).toContain('filterPromptLibraryItemsByQuery(availableSkills, searchQuery')
    expect(predefinedPromptsMenuSource).toContain('filterPromptLibraryItemsByQuery(availableTasks, searchQuery')
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryEmptyPromptLabel(prompts.length > 0)")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryEmptySkillLabel(availableSkills.length > 0)")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryEmptyTaskLabel(availableTasks.length > 0)")
  })

  it("uses shared predefined prompt mutation helpers", () => {
    expect(predefinedPromptsMenuSource).toContain("createPredefinedPromptRecord")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryPromptContent")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryPromptDescription")
    expect(predefinedPromptsMenuSource).toContain("filterPromptLibraryItemsByQuery")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibrarySkillContent")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibrarySkillDescription")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryTaskDescription")
    expect(predefinedPromptsMenuSource).toContain("promptCopy")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryEditorTitle(Boolean(editingPrompt))")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryEditorSaveActionLabel(Boolean(editingPrompt))")
    expect(predefinedPromptsMenuSource).toContain("isPromptLibraryEditorSaveDisabled")
    expect(predefinedPromptsMenuSource).toContain("disabled={isSaveDisabled}")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryEditPromptAccessibilityLabel(prompt.name)")
    expect(predefinedPromptsMenuSource).toContain("getPromptLibraryDeletePromptAccessibilityLabel(prompt.name)")
    expect(predefinedPromptsMenuSource).toContain("updatePredefinedPromptList(prompts, editingPrompt.id, draft, now)")
    expect(predefinedPromptsMenuSource).toContain("deletePredefinedPromptFromList(prompts, prompt.id)")
    expect(predefinedPromptsMenuSource).not.toContain("Math.random().toString(36)")
    expect(predefinedPromptsMenuSource).not.toContain("prompts.filter((p) => p.id !== prompt.id)")
  })
})
