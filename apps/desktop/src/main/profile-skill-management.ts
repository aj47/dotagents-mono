import {
  getEnabledSkillIdsForAgentProfile,
  isSkillEnabledForAgentProfile,
} from "@dotagents/shared"
import type { AgentProfile, AgentSkill } from "@shared/types"
import { agentProfileService } from "./agent-profile-service"
import { getManagedSkillsCatalog as getManagedSkillsCatalogInternal } from "./skill-management"
import { skillsService } from "./skills-service"

export interface ManagedProfileSkillSummary extends AgentSkill {
  enabledForProfile: boolean
}

export interface ManagedCurrentProfileSkills {
  currentProfile: AgentProfile | null
  skills: ManagedProfileSkillSummary[]
  allSkillIds: string[]
}

export type ManagedProfileSkillErrorCode =
  | "profile_not_found"
  | "skill_not_found"
  | "toggle_failed"

type ManagedProfileSkillFailure = {
  success: false
  errorCode: ManagedProfileSkillErrorCode
  error: string
}

type ManagedProfileSkillSuccess = {
  success: true
  profile: AgentProfile
  skill: AgentSkill
  enabledForProfile: boolean
}

export type ManagedProfileSkillToggleResult =
  | ManagedProfileSkillSuccess
  | ManagedProfileSkillFailure

function createManagedProfileSkillFailure(
  errorCode: ManagedProfileSkillErrorCode,
  error: string,
): ManagedProfileSkillFailure {
  return {
    success: false,
    errorCode,
    error,
  }
}

export function getManagedSkillsCatalog(): AgentSkill[] {
  return getManagedSkillsCatalogInternal()
}

export function getManagedCurrentProfileSkills(): ManagedCurrentProfileSkills {
  const currentProfile = agentProfileService.getCurrentProfile() ?? null
  const skills = getManagedSkillsCatalog()
  const allSkillIds = skills.map((skill) => skill.id)
  const enabledSkillIds = new Set(
    getEnabledSkillIdsForAgentProfile(currentProfile, allSkillIds),
  )

  return {
    currentProfile,
    skills: skills.map((skill) => ({
      ...skill,
      enabledForProfile: enabledSkillIds.has(skill.id),
    })),
    allSkillIds,
  }
}

export function toggleManagedSkillForProfile(
  profileId: string,
  skillId: string,
): ManagedProfileSkillToggleResult {
  const skill = skillsService.getSkill(skillId)
  if (!skill) {
    return createManagedProfileSkillFailure(
      "skill_not_found",
      `Skill not found: ${skillId}`,
    )
  }

  const profile = agentProfileService.getById(profileId)
  if (!profile) {
    return createManagedProfileSkillFailure(
      "profile_not_found",
      `Profile not found: ${profileId}`,
    )
  }

  const updatedProfile = agentProfileService.toggleProfileSkill(
    profileId,
    skill.id,
    getManagedSkillsCatalog().map((availableSkill) => availableSkill.id),
  )
  if (!updatedProfile) {
    return createManagedProfileSkillFailure(
      "toggle_failed",
      `Failed to toggle skill: ${skill.id}`,
    )
  }

  return {
    success: true,
    profile: updatedProfile,
    skill,
    enabledForProfile: isSkillEnabledForAgentProfile(updatedProfile, skill.id),
  }
}

export function toggleManagedSkillForCurrentProfile(
  skillId: string,
): ManagedProfileSkillToggleResult {
  const currentProfile = agentProfileService.getCurrentProfile()
  if (!currentProfile) {
    return createManagedProfileSkillFailure(
      "profile_not_found",
      "No current profile set",
    )
  }

  return toggleManagedSkillForProfile(currentProfile.id, skillId)
}
