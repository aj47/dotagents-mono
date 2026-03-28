import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AgentProfile, AgentSkill } from "../shared/types"

const {
  getCurrentProfileMock,
  getByIdMock,
  toggleProfileSkillMock,
  getSkillsMock,
  getSkillMock,
} = vi.hoisted(() => ({
  getCurrentProfileMock: vi.fn<[], AgentProfile | undefined>(),
  getByIdMock: vi.fn<[string], AgentProfile | undefined>(),
  toggleProfileSkillMock: vi.fn<
    [string, string, string[] | undefined],
    AgentProfile | undefined
  >(),
  getSkillsMock: vi.fn<[], AgentSkill[]>(),
  getSkillMock: vi.fn<[string], AgentSkill | undefined>(),
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getCurrentProfile: getCurrentProfileMock,
    getById: getByIdMock,
    toggleProfileSkill: toggleProfileSkillMock,
  },
}))

vi.mock("./skills-service", () => ({
  skillsService: {
    getSkills: getSkillsMock,
    getSkill: getSkillMock,
  },
}))

import {
  getManagedCurrentProfileSkills,
  getManagedSkillsCatalog,
  toggleManagedSkillForCurrentProfile,
  toggleManagedSkillForProfile,
} from "./profile-skill-management"

function createSkill(
  id: string,
  name: string,
  description = `${name} description`,
): AgentSkill {
  return {
    id,
    name,
    description,
    instructions: `# ${name}`,
    createdAt: 1,
    updatedAt: 2,
    source: "local",
  }
}

function createProfile(
  id: string,
  skillsConfig?: AgentProfile["skillsConfig"],
): AgentProfile {
  return {
    id,
    name: id,
    displayName: id,
    connection: { type: "internal" },
    enabled: true,
    createdAt: 1,
    updatedAt: 2,
    skillsConfig,
  }
}

describe("profile skill management", () => {
  beforeEach(() => {
    getCurrentProfileMock.mockReset()
    getByIdMock.mockReset()
    toggleProfileSkillMock.mockReset()
    getSkillsMock.mockReset()
    getSkillMock.mockReset()
  })

  it("sorts skills and resolves current-profile enablement in one helper", () => {
    const alpha = createSkill("skill-alpha", "Alpha")
    const beta = createSkill("skill-beta", "Beta")
    const currentProfile = createProfile("profile-1", {
      enabledSkillIds: ["skill-beta"],
      allSkillsDisabledByDefault: true,
    })

    getSkillsMock.mockReturnValue([beta, alpha])
    getCurrentProfileMock.mockReturnValue(currentProfile)

    expect(getManagedSkillsCatalog().map((skill) => skill.id)).toEqual([
      "skill-alpha",
      "skill-beta",
    ])

    expect(getManagedCurrentProfileSkills()).toEqual({
      currentProfile,
      allSkillIds: ["skill-alpha", "skill-beta"],
      skills: [
        {
          ...alpha,
          enabledForProfile: false,
        },
        {
          ...beta,
          enabledForProfile: true,
        },
      ],
    })
  })

  it("toggles the current profile skill through one helper", () => {
    const alpha = createSkill("skill-alpha", "Alpha")
    const beta = createSkill("skill-beta", "Beta")
    const currentProfile = createProfile("profile-1")
    const updatedProfile = createProfile("profile-1", {
      enabledSkillIds: ["skill-beta"],
      allSkillsDisabledByDefault: true,
    })

    getCurrentProfileMock.mockReturnValue(currentProfile)
    getByIdMock.mockReturnValue(currentProfile)
    getSkillsMock.mockReturnValue([beta, alpha])
    getSkillMock.mockImplementation((skillId) =>
      [alpha, beta].find((skill) => skill.id === skillId),
    )
    toggleProfileSkillMock.mockReturnValue(updatedProfile)

    expect(toggleManagedSkillForCurrentProfile("skill-beta")).toEqual({
      success: true,
      profile: updatedProfile,
      skill: beta,
      enabledForProfile: true,
    })
    expect(toggleProfileSkillMock).toHaveBeenCalledWith(
      "profile-1",
      "skill-beta",
      ["skill-alpha", "skill-beta"],
    )
  })

  it("reports a missing current profile before toggling", () => {
    getCurrentProfileMock.mockReturnValue(undefined)

    expect(toggleManagedSkillForCurrentProfile("skill-alpha")).toEqual({
      success: false,
      errorCode: "profile_not_found",
      error: "No current profile set",
    })
  })

  it("reports missing profile and skill selections explicitly", () => {
    const alpha = createSkill("skill-alpha", "Alpha")

    getSkillMock.mockReturnValue(alpha)
    getByIdMock.mockReturnValue(undefined)
    expect(toggleManagedSkillForProfile("missing-profile", "skill-alpha")).toEqual(
      {
        success: false,
        errorCode: "profile_not_found",
        error: "Profile not found: missing-profile",
      },
    )

    getSkillMock.mockReturnValue(undefined)
    expect(toggleManagedSkillForProfile("profile-1", "missing-skill")).toEqual({
      success: false,
      errorCode: "skill_not_found",
      error: "Skill not found: missing-skill",
    })
  })
})
