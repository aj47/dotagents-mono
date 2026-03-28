import fs from "fs"
import path from "path"
import type { AgentSkill } from "@shared/types"
import type { SkillReferenceCleanupSummary } from "./agent-profile-skill-cleanup"
import { agentProfileService } from "./agent-profile-service"
import { skillsService } from "./skills-service"

type SkillSelectionCandidate = Pick<AgentSkill, "id" | "name">

export interface ManagedSkillSelectionResult<
  TSkill extends SkillSelectionCandidate,
> {
  selectedSkill?: TSkill
  ambiguousSkills?: TSkill[]
}

export interface ManagedSkillDeleteResult {
  success: boolean
  cleanupSummary?: SkillReferenceCleanupSummary
}

export interface ManagedSkillBulkDeleteResult {
  results: Array<{ id: string; success: boolean }>
  cleanupSummary?: SkillReferenceCleanupSummary
}

export interface ManagedSkillFileResult {
  success: boolean
  skill?: AgentSkill
  path?: string
  error?: string
}

export interface ManagedSkillCreateInput {
  name: string
  description?: string
  instructions: string
}

export interface ManagedSkillUpdateInput {
  name?: string
  description?: string
  instructions?: string
}

function normalizeRequiredSkillField(
  value: unknown,
  fieldName: "name" | "instructions",
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Skill ${fieldName} must be a non-empty string`)
  }

  return fieldName === "name" ? value.trim() : value
}

function normalizeOptionalSkillField(
  value: unknown,
  fieldName: "name" | "description" | "instructions",
): string | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== "string") {
    throw new Error(`Skill ${fieldName} must be a string`)
  }

  if (fieldName === "description") {
    return value.trim()
  }

  if (value.trim().length === 0) {
    throw new Error(`Skill ${fieldName} must be a non-empty string`)
  }

  return fieldName === "name" ? value.trim() : value
}

function normalizeCreateInput(input: ManagedSkillCreateInput): {
  name: string
  description: string
  instructions: string
} {
  return {
    name: normalizeRequiredSkillField(input.name, "name"),
    description:
      normalizeOptionalSkillField(input.description, "description") || "",
    instructions: normalizeRequiredSkillField(
      input.instructions,
      "instructions",
    ),
  }
}

function normalizeUpdateInput(
  updates: ManagedSkillUpdateInput,
): ManagedSkillUpdateInput {
  return {
    name: normalizeOptionalSkillField(updates.name, "name"),
    description: normalizeOptionalSkillField(
      updates.description,
      "description",
    ),
    instructions: normalizeOptionalSkillField(
      updates.instructions,
      "instructions",
    ),
  }
}

function buildSkillSelectionPool<TSkill extends SkillSelectionCandidate>(
  skills: TSkill[],
  query: string,
): TSkill[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return []

  const exactMatches = skills.filter((skill) => {
    const id = skill.id.trim().toLowerCase()
    const name = skill.name.trim().toLowerCase()
    return id === normalizedQuery || name === normalizedQuery
  })
  if (exactMatches.length > 0) {
    return exactMatches
  }

  return skills.filter((skill) => {
    const id = skill.id.trim().toLowerCase()
    const name = skill.name.trim().toLowerCase()
    return id.startsWith(normalizedQuery) || name.startsWith(normalizedQuery)
  })
}

export function getManagedSkillsCatalog(): AgentSkill[] {
  return [...skillsService.getSkills()].sort((left, right) =>
    left.name.localeCompare(right.name),
  )
}

export function getManagedSkill(skillId: string): AgentSkill | undefined {
  return skillsService.getSkill(skillId)
}

export function resolveManagedSkillSelection<
  TSkill extends SkillSelectionCandidate,
>(skills: TSkill[], query: string): ManagedSkillSelectionResult<TSkill> {
  const matches = buildSkillSelectionPool(skills, query)
  if (matches.length === 1) {
    return {
      selectedSkill: matches[0],
    }
  }

  if (matches.length > 1) {
    return {
      ambiguousSkills: matches,
    }
  }

  return {}
}

export function createManagedSkill(input: ManagedSkillCreateInput): AgentSkill {
  const normalized = normalizeCreateInput(input)
  const skill = skillsService.createSkill(
    normalized.name,
    normalized.description,
    normalized.instructions,
  )
  agentProfileService.enableSkillForCurrentProfile(skill.id)
  return skill
}

export function updateManagedSkill(
  skillId: string,
  updates: ManagedSkillUpdateInput,
): AgentSkill {
  return skillsService.updateSkill(skillId, normalizeUpdateInput(updates))
}

async function cleanupSkillReferencesAfterMutation(): Promise<SkillReferenceCleanupSummary> {
  const { globalAgentsFolder, resolveWorkspaceAgentsFolder } =
    await import("./config")
  const { getAgentsLayerPaths } = await import("./agents-files/modular-config")
  const { cleanupInvalidSkillReferencesInLayers } =
    await import("./agent-profile-skill-cleanup")

  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  const layers = workspaceAgentsFolder
    ? [
        getAgentsLayerPaths(globalAgentsFolder),
        getAgentsLayerPaths(workspaceAgentsFolder),
      ]
    : [getAgentsLayerPaths(globalAgentsFolder)]

  const cleanupSummary = cleanupInvalidSkillReferencesInLayers(
    layers,
    getManagedSkillsCatalog().map((skill) => skill.id),
  )
  if (cleanupSummary.updatedProfileIds.length > 0) {
    agentProfileService.reload()
  }

  return cleanupSummary
}

export async function cleanupManagedStaleSkillReferences(): Promise<SkillReferenceCleanupSummary> {
  return cleanupSkillReferencesAfterMutation()
}

export async function deleteManagedSkill(
  skillId: string,
): Promise<ManagedSkillDeleteResult> {
  const success = skillsService.deleteSkill(skillId)
  if (!success) {
    return { success: false }
  }

  return {
    success: true,
    cleanupSummary: await cleanupSkillReferencesAfterMutation(),
  }
}

export async function deleteManagedSkills(
  skillIds: string[],
): Promise<ManagedSkillBulkDeleteResult> {
  const results = skillIds.map((id) => ({
    id,
    success: skillsService.deleteSkill(id),
  }))

  if (!results.some((result) => result.success)) {
    return { results }
  }

  return {
    results,
    cleanupSummary: await cleanupSkillReferencesAfterMutation(),
  }
}

export function importManagedSkillFromMarkdown(content: string): AgentSkill {
  const skill = skillsService.importSkillFromMarkdown(content)
  agentProfileService.enableSkillForCurrentProfile(skill.id)
  return skill
}

export function importManagedSkillFromFile(filePath: string): AgentSkill {
  const skill = skillsService.importSkillFromFile(filePath)
  agentProfileService.enableSkillForCurrentProfile(skill.id)
  return skill
}

export function importManagedSkillFromFolder(folderPath: string): AgentSkill {
  const skill = skillsService.importSkillFromFolder(folderPath)
  agentProfileService.enableSkillForCurrentProfile(skill.id)
  return skill
}

export function importManagedSkillsFromParentFolder(parentFolderPath: string): {
  imported: AgentSkill[]
  skipped: string[]
  errors: Array<{ folder: string; error: string }>
} {
  const result = skillsService.importSkillsFromParentFolder(parentFolderPath)
  for (const skill of result.imported) {
    agentProfileService.enableSkillForCurrentProfile(skill.id)
  }
  return result
}

export function exportManagedSkillToMarkdown(skillId: string): string {
  return skillsService.exportSkillToMarkdown(skillId)
}

export function getManagedSkillCanonicalFilePath(
  skillId: string,
): string | null {
  return skillsService.getSkillCanonicalFilePath(skillId)
}

export function ensureManagedSkillFile(
  skillId: string,
): ManagedSkillFileResult {
  const skill = getManagedSkill(skillId)
  if (!skill) {
    return {
      success: false,
      error: `Skill with id ${skillId} not found`,
    }
  }

  const filePath = getManagedSkillCanonicalFilePath(skillId)
  if (!filePath) {
    return {
      success: false,
      skill,
      error: `No file path found for skill ${skillId}`,
    }
  }

  if (!fs.existsSync(filePath)) {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, exportManagedSkillToMarkdown(skillId), "utf8")
    } catch (error) {
      return {
        success: false,
        skill,
        path: filePath,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  return {
    success: true,
    skill,
    path: filePath,
  }
}

export function scanManagedSkillsFolder(): AgentSkill[] {
  return skillsService.scanSkillsFolder()
}

export async function importManagedSkillFromGitHub(
  repoIdentifier: string,
): Promise<{
  imported: AgentSkill[]
  errors: string[]
}> {
  const result = await skillsService.importSkillFromGitHub(repoIdentifier)
  for (const skill of result.imported) {
    agentProfileService.enableSkillForCurrentProfile(skill.id)
  }
  return result
}
