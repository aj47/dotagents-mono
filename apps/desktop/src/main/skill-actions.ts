import {
  buildSkillToggleResponse,
  buildSkillsResponse,
} from "@dotagents/shared/skills-api"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { agentProfileService } from "./agent-profile-service"
import { diagnosticsService } from "./diagnostics"
import { skillsService } from "./skills-service"

export type SkillActionResult = MobileApiActionResult

function ok(body: unknown): SkillActionResult {
  return {
    statusCode: 200,
    body,
  }
}

function error(statusCode: number, message: string): SkillActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

export function getSkills(): SkillActionResult {
  try {
    const skills = skillsService.getSkills()
    const currentProfile = agentProfileService.getCurrentProfile()
    return ok(buildSkillsResponse(skills, currentProfile))
  } catch (caughtError) {
    diagnosticsService.logError("skill-actions", "Failed to get skills", caughtError)
    return error(500, "Failed to get skills")
  }
}

export function toggleProfileSkill(skillId: string | undefined): SkillActionResult {
  try {
    const skills = skillsService.getSkills()
    const skillExists = skills.some(s => s.id === skillId)
    if (!skillExists) {
      return error(404, "Skill not found")
    }

    const currentProfile = agentProfileService.getCurrentProfile()
    if (!currentProfile) {
      return error(400, "No current profile set")
    }

    const allSkillIds = skills.map(s => s.id)
    const updatedProfile = agentProfileService.toggleProfileSkill(currentProfile.id, skillId ?? "", allSkillIds)
    return ok(buildSkillToggleResponse(skillId ?? "", updatedProfile))
  } catch (caughtError: any) {
    diagnosticsService.logError("skill-actions", "Failed to toggle skill", caughtError)
    return error(500, caughtError?.message || "Failed to toggle skill")
  }
}
