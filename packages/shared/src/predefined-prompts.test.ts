import { describe, expect, it } from "vitest"

import {
  PROMPT_LIBRARY_PRESENTATION,
  buildPromptLibraryCommandItems,
  createPredefinedPromptId,
  createPredefinedPromptRecord,
  deletePredefinedPromptFromList,
  filterPromptLibraryCommandItems,
  filterPromptLibraryItemsByQuery,
  formatPromptLibraryDeletePromptConfirmMessage,
  formatPromptLibraryDeletePromptWebConfirmMessage,
  formatPromptLibraryTaskRunningToast,
  formatPromptLibraryTaskStartedMessage,
  formatPromptLibraryTaskUnavailableMessage,
  getPromptLibraryDeletePromptAccessibilityLabel,
  getPromptLibraryEditPromptAccessibilityLabel,
  getPromptLibraryEditorSaveActionLabel,
  getPromptLibraryEditorTitle,
  getPromptLibraryEmptyPromptLabel,
  getPromptLibraryEmptySkillLabel,
  getPromptLibraryEmptyTaskLabel,
  getPromptLibraryPromptContent,
  getPromptLibraryPromptDescription,
  getPromptLibrarySaveSuccessMessage,
  getPromptLibrarySkillContent,
  getPromptLibrarySkillDescription,
  getPromptLibraryShortcutAccessibilityHint,
  getPromptLibraryShortcutAccessibilityLabel,
  getPromptLibraryTaskContent,
  getPromptLibraryTaskDescription,
  isSlashCommandPrompt,
  isSlashCommandPromptName,
  resolveSlashCommandInputState,
  PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION,
  PREDEFINED_PROMPT_TASK_FALLBACK_DESCRIPTION,
  sortPredefinedPromptsByUpdatedAt,
  updatePredefinedPromptList,
  updatePredefinedPromptRecord,
} from "./predefined-prompts"

describe("predefined prompt helpers", () => {
  it("shares prompt-library presentation across desktop and mobile shells", () => {
    expect(PROMPT_LIBRARY_PRESENTATION.triggerAccessibilityLabel).toBe("Open predefined prompts")
    expect(PROMPT_LIBRARY_PRESENTATION.search.placeholder).toBe("Search prompts, skills, tasks...")
    expect(PROMPT_LIBRARY_PRESENTATION.editor.namePlaceholder).toBe("e.g., Code Review Request")
    expect(getPromptLibraryEditorTitle(false)).toBe("Add New Prompt")
    expect(getPromptLibraryEditorTitle(true)).toBe("Edit Prompt")
    expect(getPromptLibraryEditorSaveActionLabel(false)).toBe("Add Prompt")
    expect(getPromptLibraryEditorSaveActionLabel(true)).toBe("Save Changes")
    expect(getPromptLibraryEditorSaveActionLabel(true, true)).toBe("Saving...")
    expect(getPromptLibrarySaveSuccessMessage(false)).toBe("Prompt saved to your desktop prompt library.")
    expect(getPromptLibrarySaveSuccessMessage(true)).toBe("Prompt updated in your desktop prompt library.")
    expect(getPromptLibraryEmptyPromptLabel(false)).toBe("No saved prompts yet")
    expect(getPromptLibraryEmptyPromptLabel(true)).toBe("No matching prompts")
    expect(getPromptLibraryEmptySkillLabel(false)).toBe("No skills available")
    expect(getPromptLibraryEmptySkillLabel(true)).toBe("No matching skills")
    expect(getPromptLibraryEmptyTaskLabel(false)).toBe("No tasks available")
    expect(getPromptLibraryEmptyTaskLabel(true)).toBe("No matching tasks")
    expect(getPromptLibraryEditPromptAccessibilityLabel("Review")).toBe("Edit predefined prompt Review")
    expect(getPromptLibraryDeletePromptAccessibilityLabel("Review")).toBe("Delete predefined prompt Review")
    expect(getPromptLibraryShortcutAccessibilityLabel("action", "+ Add Prompt", "add-prompt")).toBe("Add new prompt")
    expect(getPromptLibraryShortcutAccessibilityLabel("task", "Daily")).toBe("Run task Daily")
    expect(getPromptLibraryShortcutAccessibilityLabel("saved-prompt", "Review")).toBe("Insert prompt Review")
    expect(getPromptLibraryShortcutAccessibilityHint("action", "add-prompt")).toBe(
      "Create a predefined prompt and save it to desktop.",
    )
    expect(getPromptLibraryShortcutAccessibilityHint("task")).toBe("Runs this desktop task now.")
    expect(formatPromptLibraryDeletePromptWebConfirmMessage("Review")).toBe('Delete prompt "Review"?')
    expect(formatPromptLibraryDeletePromptConfirmMessage("Review")).toBe(
      'Delete "Review" from your desktop prompt library?',
    )
    expect(formatPromptLibraryTaskUnavailableMessage("Daily")).toBe('Could not trigger "Daily" right now')
    expect(formatPromptLibraryTaskRunningToast("Daily")).toBe('Running "Daily"...')
    expect(formatPromptLibraryTaskStartedMessage("Daily")).toBe('Running "Daily" on desktop.')
  })

  it("classifies slash command prompt names", () => {
    expect(PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION).toBe("Use this skill as a reusable prompt.")
    expect(PREDEFINED_PROMPT_TASK_FALLBACK_DESCRIPTION).toBe("Run this task now.")
    expect(isSlashCommandPromptName("/standup")).toBe(true)
    expect(isSlashCommandPromptName(" /standup ")).toBe(true)
    expect(isSlashCommandPromptName("/")).toBe(false)
    expect(isSlashCommandPromptName("standup")).toBe(false)
    expect(isSlashCommandPrompt({ name: "/ship" })).toBe(true)
  })

  it("resolves slash command input state", () => {
    expect(resolveSlashCommandInputState("hello")).toEqual({ mode: "inactive", query: "" })
    expect(resolveSlashCommandInputState("/")).toEqual({ mode: "active", query: "" })
    expect(resolveSlashCommandInputState("/review")).toEqual({ mode: "active", query: "review" })
    expect(resolveSlashCommandInputState("/review this")).toEqual({ mode: "complete", query: "review this" })
    expect(resolveSlashCommandInputState("/review\nbody")).toEqual({ mode: "complete", query: "review\nbody" })
  })

  it("builds shared prompt-library prompt labels and content", () => {
    const prompt = { content: "Review the latest implementation notes." }
    expect(getPromptLibraryPromptContent(prompt)).toBe("Review the latest implementation notes.")
    expect(getPromptLibraryPromptDescription(prompt)).toBe("Review the latest implementation notes.")
    expect(getPromptLibraryPromptDescription(prompt, 11)).toBe("Review the ")
  })

  it("builds shared prompt-library skill labels and content", () => {
    expect(getPromptLibrarySkillDescription({
      name: "Research",
      description: "  Find sources  ",
    })).toBe("Find sources")
    expect(getPromptLibrarySkillDescription({ name: "Research" })).toBe(PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION)
    expect(getPromptLibrarySkillContent({
      name: "Research",
      instructions: "  Use citations.  ",
      description: "Find sources",
    })).toBe("Use citations.")
    expect(getPromptLibrarySkillContent({
      name: "Research",
      description: "Find sources",
    })).toBe('Use the "Research" skill for this request.\n\nFind sources')
    expect(getPromptLibrarySkillContent({ name: "Research" })).toBe('Use the "Research" skill for this request.')
  })

  it("builds shared prompt-library task labels and content", () => {
    expect(getPromptLibraryTaskContent({ prompt: "  Review open PRs  " })).toBe("Review open PRs")
    expect(getPromptLibraryTaskContent({ prompt: "  " })).toBe("")
    expect(getPromptLibraryTaskDescription({ prompt: "  Review open PRs  " })).toBe("Review open PRs")
    expect(getPromptLibraryTaskDescription({ prompt: "" })).toBe(PREDEFINED_PROMPT_TASK_FALLBACK_DESCRIPTION)
    expect(getPromptLibraryTaskDescription({ prompt: "" }, "Run this desktop task now.")).toBe("Run this desktop task now.")
  })

  it("filters prompt-library items by normalized searchable fields", () => {
    const items = [
      { name: "Review", description: "Inspect a diff", prompt: "Check regressions" },
      { name: "Ship", description: null, prompt: "Prepare release notes" },
      { name: "Research", description: "Find citations", prompt: "" },
    ]

    expect(filterPromptLibraryItemsByQuery(items, "", (item) => [item.name, item.description, item.prompt])).toEqual(items)
    expect(filterPromptLibraryItemsByQuery(items, " RELEASE ", (item) => [item.name, item.description, item.prompt])).toEqual([
      items[1],
    ])
    expect(filterPromptLibraryItemsByQuery(items, "citation", (item) => [item.name, item.description, item.prompt])).toEqual([
      items[2],
    ])
  })

  it("builds and filters shared command menu items for prompts, skills, and tasks", () => {
    const items = buildPromptLibraryCommandItems({
      prompts: [{
        id: "prompt-1",
        name: "/review",
        content: "Review this diff for regressions.",
        createdAt: 1,
        updatedAt: 1,
      }],
      skills: [{
        id: "skill-1",
        name: "Research",
        description: "Find citations",
      }],
      tasks: [{
        id: "task-1",
        name: "Ship notes",
        prompt: "Draft release notes",
      }],
      getTaskDescription: (task) => `Run ${task.name}`,
    })

    expect(items).toEqual([
      {
        id: "prompt-1",
        name: "/review",
        description: "Review this diff for regressions.",
        content: "Review this diff for regressions.",
        type: "prompt",
      },
      {
        id: "skill-1",
        name: "Research",
        description: "Find citations",
        content: 'Use the "Research" skill for this request.\n\nFind citations',
        type: "skill",
      },
      {
        id: "task-1",
        name: "Ship notes",
        description: "Run Ship notes",
        type: "loop",
      },
    ])
    expect(filterPromptLibraryCommandItems(items, "citation").map((item) => item.id)).toEqual(["skill-1"])
    expect(filterPromptLibraryCommandItems(items, "ship").map((item) => item.id)).toEqual(["task-1"])
  })

  it("creates stable prompt ids and trimmed records", () => {
    expect(createPredefinedPromptId(123, () => 0.5)).toBe("prompt-123-i")
    expect(createPredefinedPromptRecord(
      { name: "  Standup  ", content: "  Share updates  " },
      123,
      (now) => `prompt-${now}`,
    )).toEqual({
      id: "prompt-123",
      name: "Standup",
      content: "Share updates",
      createdAt: 123,
      updatedAt: 123,
    })
  })

  it("updates and deletes prompt records without changing unrelated entries", () => {
    const prompts = [
      { id: "old", name: "Old", content: "Old content", createdAt: 1, updatedAt: 1 },
      { id: "keep", name: "Keep", content: "Keep content", createdAt: 2, updatedAt: 2 },
    ]

    expect(updatePredefinedPromptRecord(prompts[0], { name: " New ", content: " Body " }, 10)).toEqual({
      id: "old",
      name: "New",
      content: "Body",
      createdAt: 1,
      updatedAt: 10,
    })
    expect(updatePredefinedPromptList(prompts, "old", { name: " New ", content: " Body " }, 10)).toEqual([
      { id: "old", name: "New", content: "Body", createdAt: 1, updatedAt: 10 },
      prompts[1],
    ])
    expect(deletePredefinedPromptFromList(prompts, "old")).toEqual([prompts[1]])
  })

  it("sorts prompts by most recently updated first", () => {
    const prompts = [
      { id: "old", name: "Old", content: "Old", createdAt: 1, updatedAt: 1 },
      { id: "new", name: "New", content: "New", createdAt: 2, updatedAt: 5 },
    ]

    expect(sortPredefinedPromptsByUpdatedAt(prompts).map((prompt) => prompt.id)).toEqual(["new", "old"])
    expect(prompts.map((prompt) => prompt.id)).toEqual(["old", "new"])
  })
})
