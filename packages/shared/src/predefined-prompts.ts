import type { PredefinedPromptSummary } from "./api-types"

export type PredefinedPromptDraft = {
  name: string
  content: string
}

export type PredefinedPromptIdGenerator = (now: number) => string

export const PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION = "Use this skill as a reusable prompt."

export type PromptLibrarySkillLike = {
  name: string
  description?: string | null
  instructions?: string | null
}

export function isSlashCommandPromptName(name: string): boolean {
  return /^\/\S+/.test(name.trim())
}

export function isSlashCommandPrompt(prompt: Pick<PredefinedPromptSummary, "name">): boolean {
  return isSlashCommandPromptName(prompt.name)
}

export function getPromptLibrarySkillDescription(skill: PromptLibrarySkillLike): string {
  return skill.description?.trim() || PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION
}

export function getPromptLibrarySkillContent(skill: PromptLibrarySkillLike): string {
  const instructions = skill.instructions?.trim()
  if (instructions) return instructions

  const description = skill.description?.trim()
  return `Use the "${skill.name}" skill for this request.${description ? `\n\n${description}` : ""}`
}

export function createPredefinedPromptId(now: number, random: () => number = Math.random): string {
  return `prompt-${now}-${random().toString(36).slice(2, 11)}`
}

export function createPredefinedPromptRecord(
  draft: PredefinedPromptDraft,
  now: number = Date.now(),
  createId: PredefinedPromptIdGenerator = createPredefinedPromptId,
): PredefinedPromptSummary {
  return {
    id: createId(now),
    name: draft.name.trim(),
    content: draft.content.trim(),
    createdAt: now,
    updatedAt: now,
  }
}

export function updatePredefinedPromptRecord(
  prompt: PredefinedPromptSummary,
  draft: PredefinedPromptDraft,
  now: number = Date.now(),
): PredefinedPromptSummary {
  return {
    ...prompt,
    name: draft.name.trim(),
    content: draft.content.trim(),
    updatedAt: now,
  }
}

export function updatePredefinedPromptList(
  prompts: readonly PredefinedPromptSummary[],
  promptId: string,
  draft: PredefinedPromptDraft,
  now: number = Date.now(),
): PredefinedPromptSummary[] {
  return prompts.map((prompt) =>
    prompt.id === promptId
      ? updatePredefinedPromptRecord(prompt, draft, now)
      : prompt
  )
}

export function deletePredefinedPromptFromList(
  prompts: readonly PredefinedPromptSummary[],
  promptId: string,
): PredefinedPromptSummary[] {
  return prompts.filter((prompt) => prompt.id !== promptId)
}

export function sortPredefinedPromptsByUpdatedAt(
  prompts: readonly PredefinedPromptSummary[],
): PredefinedPromptSummary[] {
  return [...prompts].sort((a, b) => b.updatedAt - a.updatedAt)
}
