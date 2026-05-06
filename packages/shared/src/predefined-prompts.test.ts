import { describe, expect, it } from "vitest"

import {
  createPredefinedPromptId,
  createPredefinedPromptRecord,
  deletePredefinedPromptFromList,
  getPromptLibrarySkillContent,
  getPromptLibrarySkillDescription,
  isSlashCommandPrompt,
  isSlashCommandPromptName,
  PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION,
  sortPredefinedPromptsByUpdatedAt,
  updatePredefinedPromptList,
  updatePredefinedPromptRecord,
} from "./predefined-prompts"

describe("predefined prompt helpers", () => {
  it("classifies slash command prompt names", () => {
    expect(PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION).toBe("Use this skill as a reusable prompt.")
    expect(isSlashCommandPromptName("/standup")).toBe(true)
    expect(isSlashCommandPromptName(" /standup ")).toBe(true)
    expect(isSlashCommandPromptName("/")).toBe(false)
    expect(isSlashCommandPromptName("standup")).toBe(false)
    expect(isSlashCommandPrompt({ name: "/ship" })).toBe(true)
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
