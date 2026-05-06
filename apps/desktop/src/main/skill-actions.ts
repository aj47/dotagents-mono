import {
  createSkillAction,
  deleteSkillAction,
  exportSkillToMarkdownAction,
  getSkillAction,
  getSkillsAction,
  importSkillFromGitHubAction,
  importSkillFromMarkdownAction,
  toggleProfileSkillAction,
  updateSkillAction,
  type SkillActionOptions,
} from "@dotagents/shared/skills-api"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { cleanupInvalidSkillReferencesInLayers } from "./agent-profile-skill-cleanup"
import { agentProfileService } from "./agent-profile-service"
import { getAgentsLayerPaths } from "./agents-files/modular-config"
import { globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { diagnosticsService } from "./diagnostics"
import { skillsService } from "./skills-service"

export type SkillActionResult = MobileApiActionResult

const skillActionOptions: SkillActionOptions = {
  service: {
    getSkills: () => skillsService.getSkills(),
    getSkill: (id) => skillsService.getSkill(id),
    createSkill: (name, description, instructions) => skillsService.createSkill(name, description, instructions),
    importSkillFromMarkdown: (content) => skillsService.importSkillFromMarkdown(content),
    importSkillFromGitHub: (repoIdentifier) => skillsService.importSkillFromGitHub(repoIdentifier),
    exportSkillToMarkdown: (id) => skillsService.exportSkillToMarkdown(id),
    updateSkill: (id, updates) => skillsService.updateSkill(id, updates),
    deleteSkill: (id) => {
      const success = skillsService.deleteSkill(id)
      if (success) {
        cleanupDeletedSkillReferences()
      }
      return success
    },
    getCurrentProfile: () => agentProfileService.getCurrentProfile(),
    enableSkillForCurrentProfile: (skillId) => agentProfileService.enableSkillForCurrentProfile(skillId),
    toggleProfileSkill: (profileId, skillId, allSkillIds) =>
      agentProfileService.toggleProfileSkill(profileId, skillId, allSkillIds),
  },
  diagnostics: diagnosticsService,
}

function cleanupDeletedSkillReferences(): void {
  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  const layers = workspaceAgentsFolder
    ? [getAgentsLayerPaths(globalAgentsFolder), getAgentsLayerPaths(workspaceAgentsFolder)]
    : [getAgentsLayerPaths(globalAgentsFolder)]

  cleanupInvalidSkillReferencesInLayers(layers, skillsService.getSkills().map(skill => skill.id))
  agentProfileService.reload()
}

export function getSkills(): SkillActionResult {
  return getSkillsAction(skillActionOptions)
}

export function getSkill(skillId: string | undefined): SkillActionResult {
  return getSkillAction(skillId, skillActionOptions)
}

export function createSkill(body: unknown): SkillActionResult {
  return createSkillAction(body, skillActionOptions)
}

export function importSkillFromMarkdown(body: unknown): SkillActionResult {
  return importSkillFromMarkdownAction(body, skillActionOptions)
}

export async function importSkillFromGitHub(body: unknown): Promise<SkillActionResult> {
  return importSkillFromGitHubAction(body, skillActionOptions)
}

export function exportSkillToMarkdown(skillId: string | undefined): SkillActionResult {
  return exportSkillToMarkdownAction(skillId, skillActionOptions)
}

export function updateSkill(skillId: string | undefined, body: unknown): SkillActionResult {
  return updateSkillAction(skillId, body, skillActionOptions)
}

export function deleteSkill(skillId: string | undefined): SkillActionResult {
  return deleteSkillAction(skillId, skillActionOptions)
}

export function toggleProfileSkill(skillId: string | undefined): SkillActionResult {
  return toggleProfileSkillAction(skillId, skillActionOptions)
}
