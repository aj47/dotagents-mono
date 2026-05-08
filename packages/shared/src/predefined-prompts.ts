import type { PredefinedPromptSummary } from "./api-types"

export type PredefinedPromptDraft = {
  name: string
  content: string
}

export type PredefinedPromptIdGenerator = (now: number) => string

export const PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION = "Use this skill as a reusable prompt."
export const PREDEFINED_PROMPT_TASK_FALLBACK_DESCRIPTION = "Run this task now."

export type PromptLibraryPromptLike = {
  content: string
}

export type PromptLibrarySkillLike = {
  id?: string
  name: string
  description?: string | null
  instructions?: string | null
}

export type PromptLibraryTaskLike = {
  id?: string
  name?: string
  prompt?: string | null
}

export type PromptLibraryCommandItemType = "prompt" | "skill" | "loop"

export interface PromptLibraryCommandItem {
  id: string
  name: string
  description: string
  content?: string
  type: PromptLibraryCommandItemType
}

export type PromptLibrarySearchText = string | null | undefined

export type PromptLibrarySearchTextGetter<TItem> = (
  item: TItem,
) => PromptLibrarySearchText | PromptLibrarySearchText[]

export function isSlashCommandPromptName(name: string): boolean {
  return /^\/\S+/.test(name.trim())
}

export function isSlashCommandPrompt(prompt: Pick<PredefinedPromptSummary, "name">): boolean {
  return isSlashCommandPromptName(prompt.name)
}

export function getPromptLibraryPromptContent(prompt: PromptLibraryPromptLike): string {
  return prompt.content
}

export function getPromptLibraryPromptDescription(prompt: PromptLibraryPromptLike, maxLength?: number): string {
  const content = getPromptLibraryPromptContent(prompt)
  return typeof maxLength === "number" ? content.slice(0, maxLength) : content
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

export function getPromptLibraryTaskContent(task: PromptLibraryTaskLike): string {
  return task.prompt?.trim() || ""
}

export function getPromptLibraryTaskDescription(
  task: PromptLibraryTaskLike,
  fallbackDescription: string = PREDEFINED_PROMPT_TASK_FALLBACK_DESCRIPTION,
): string {
  return getPromptLibraryTaskContent(task) || fallbackDescription
}

function promptLibrarySearchTextMatches(value: PromptLibrarySearchText, normalizedQuery: string): boolean {
  return typeof value === "string" && value.toLowerCase().includes(normalizedQuery)
}

export function filterPromptLibraryItemsByQuery<TItem>(
  items: readonly TItem[],
  searchQuery: string,
  getSearchText: PromptLibrarySearchTextGetter<TItem>,
): TItem[] {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  if (!normalizedQuery) return [...items]

  return items.filter((item) => {
    const searchText = getSearchText(item)
    const values = Array.isArray(searchText) ? searchText : [searchText]
    return values.some((value) => promptLibrarySearchTextMatches(value, normalizedQuery))
  })
}

export interface BuildPromptLibraryCommandItemsOptions<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string } = PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string } = PromptLibraryTaskLike & { id: string; name: string },
> {
  prompts?: readonly TPrompt[]
  skills?: readonly TSkill[]
  tasks?: readonly TTask[]
  promptDescriptionMaxLength?: number
  getTaskDescription?: (task: TTask) => string
}

export function buildPromptLibraryCommandItems<
  TPrompt extends PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
>(
  options: BuildPromptLibraryCommandItemsOptions<TPrompt, TSkill, TTask>,
): PromptLibraryCommandItem[] {
  const promptDescriptionMaxLength = options.promptDescriptionMaxLength ?? 80
  const prompts = (options.prompts ?? []).map((prompt) => ({
    id: prompt.id,
    name: prompt.name,
    description: getPromptLibraryPromptDescription(prompt, promptDescriptionMaxLength),
    content: getPromptLibraryPromptContent(prompt),
    type: "prompt" as const,
  }))
  const skills = (options.skills ?? []).map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: getPromptLibrarySkillDescription(skill),
    content: getPromptLibrarySkillContent(skill),
    type: "skill" as const,
  }))
  const tasks = (options.tasks ?? []).map((task) => ({
    id: task.id,
    name: task.name,
    description: options.getTaskDescription?.(task) ?? getPromptLibraryTaskDescription(task),
    type: "loop" as const,
  }))

  return [...prompts, ...skills, ...tasks]
}

export function filterPromptLibraryCommandItems(
  items: readonly PromptLibraryCommandItem[],
  searchQuery: string,
): PromptLibraryCommandItem[] {
  return filterPromptLibraryItemsByQuery(items, searchQuery, (item) => [
    item.name,
    item.description,
  ])
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
