import {
  getSkillsAction,
  toggleProfileSkillAction,
  type SkillActionOptions,
} from "@dotagents/shared/skills-api"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { agentProfileService } from "./agent-profile-service"
import { diagnosticsService } from "./diagnostics"
import { skillsService } from "./skills-service"

export type SkillActionResult = MobileApiActionResult

const skillActionOptions: SkillActionOptions = {
  service: {
    getSkills: () => skillsService.getSkills(),
    getCurrentProfile: () => agentProfileService.getCurrentProfile(),
    toggleProfileSkill: (profileId, skillId, allSkillIds) =>
      agentProfileService.toggleProfileSkill(profileId, skillId, allSkillIds),
  },
  diagnostics: diagnosticsService,
}

export function getSkills(): SkillActionResult {
  return getSkillsAction(skillActionOptions)
}

export function toggleProfileSkill(skillId: string | undefined): SkillActionResult {
  return toggleProfileSkillAction(skillId, skillActionOptions)
}
