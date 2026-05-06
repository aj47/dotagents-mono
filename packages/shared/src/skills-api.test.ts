import { describe, expect, it } from "vitest"

import {
  buildDisabledRuntimeSkillPayload,
  buildSkillDeleteResponse,
  buildSkillExportMarkdownResponse,
  buildSkillMutationResponse,
  buildSkillResponse,
  getSkillsAction,
  buildSkillsResponse,
  buildSkillToggleResponse,
  createSkillAction,
  deleteSkillAction,
  exportSkillToMarkdownAction,
  buildIgnoredExecuteCommandSkillIdWarning,
  buildRuntimeSkillInstructionsText,
  buildRuntimeSkillNotFoundPayload,
  getSkillAction,
  getGitHubSkillCandidateRelativePaths,
  getEnabledSkillIdsForProfile,
  getSkillFolderIdFromFilePath,
  getSkillRuntimeIds,
  importSkillFromMarkdownAction,
  isGitHubSkillMarkdownFileName,
  isSkillEnabledByConfig,
  isSkillEnabledForProfile,
  parseGitHubSkillIdentifier,
  parseSkillImportMarkdownRequestBody,
  parseRuntimeSkillIdArg,
  resolveRuntimeSkill,
  toggleProfileSkillAction,
  updateSkillAction,
  uniqueSkillIds,
  validateGitHubSkillIdentifierPart,
  validateGitHubSkillRef,
  validateGitHubSkillSubPath,
  type SkillActionService,
  type RuntimeSkillLike,
  type RuntimeSkillRegistryLike,
} from "./skills-api"

describe("skills API helpers", () => {
  const skills = [
    {
      id: "research",
      name: "Research",
      description: "Find context",
      instructions: "Use sources",
      source: "local" as const,
      createdAt: 1,
      updatedAt: 2,
    },
    {
      id: "writing",
      name: "Writing",
      description: "Draft copy",
      createdAt: 3,
      updatedAt: 4,
    },
  ]

  function createSkillActionService(overrides: Partial<SkillActionService> = {}): SkillActionService {
    return {
      getSkills: () => skills,
      getSkill: (id: string) => skills.find((skill) => skill.id === id),
      createSkill: () => {
        throw new Error("unexpected create")
      },
      importSkillFromMarkdown: () => {
        throw new Error("unexpected import")
      },
      exportSkillToMarkdown: () => {
        throw new Error("unexpected export")
      },
      updateSkill: () => {
        throw new Error("unexpected update")
      },
      deleteSkill: () => {
        throw new Error("unexpected delete")
      },
      getCurrentProfile: () => undefined,
      toggleProfileSkill: () => {
        throw new Error("unexpected toggle")
      },
      ...overrides,
    }
  }

  it("enables all skills when a profile has default skill semantics", () => {
    expect(getEnabledSkillIdsForProfile(skills, undefined)).toEqual(["research", "writing"])
    expect(isSkillEnabledForProfile("research", { skillsConfig: { allSkillsDisabledByDefault: false } })).toBe(true)
    expect(buildSkillsResponse(skills, { id: "profile-1" })).toEqual({
      currentProfileId: "profile-1",
      skills: [
        {
          id: "research",
          name: "Research",
          description: "Find context",
          instructions: "Use sources",
          enabled: true,
          enabledForProfile: true,
          source: "local",
          createdAt: 1,
          updatedAt: 2,
        },
        {
          id: "writing",
          name: "Writing",
          description: "Draft copy",
          instructions: undefined,
          enabled: true,
          enabledForProfile: true,
          source: undefined,
          createdAt: 3,
          updatedAt: 4,
        },
      ],
    })
  })

  it("marks only explicitly enabled skills when a profile disables skills by default", () => {
    const profile = {
      id: "profile-1",
      skillsConfig: {
        allSkillsDisabledByDefault: true,
        enabledSkillIds: ["writing"],
      },
    }

    expect(getEnabledSkillIdsForProfile(skills, profile)).toEqual(["writing"])
    expect(isSkillEnabledForProfile("research", profile)).toBe(false)
    expect(isSkillEnabledForProfile("writing", profile)).toBe(true)
    expect(buildSkillsResponse(skills, profile).skills.map((skill) => ({
      id: skill.id,
      enabledForProfile: skill.enabledForProfile,
    }))).toEqual([
      { id: "research", enabledForProfile: false },
      { id: "writing", enabledForProfile: true },
    ])
  })

  it("builds skill toggle responses from updated profile state", () => {
    expect(buildSkillResponse(skills[0], {
      skillsConfig: {
        allSkillsDisabledByDefault: true,
        enabledSkillIds: ["research"],
      },
    })).toEqual({
      skill: {
        id: "research",
        name: "Research",
        description: "Find context",
        instructions: "Use sources",
        enabled: true,
        enabledForProfile: true,
        source: "local",
        createdAt: 1,
        updatedAt: 2,
      },
    })
    expect(buildSkillMutationResponse(skills[0], {
      skillsConfig: {
        allSkillsDisabledByDefault: true,
        enabledSkillIds: [],
      },
    })).toEqual({
      success: true,
      skill: {
        id: "research",
        name: "Research",
        description: "Find context",
        instructions: "Use sources",
        enabled: true,
        enabledForProfile: false,
        source: "local",
        createdAt: 1,
        updatedAt: 2,
      },
    })
    expect(buildSkillExportMarkdownResponse("research", "---\nname: Research\n---\nUse sources")).toEqual({
      success: true,
      skillId: "research",
      markdown: "---\nname: Research\n---\nUse sources",
    })
    expect(buildSkillDeleteResponse("research")).toEqual({
      success: true,
      id: "research",
    })
    expect(buildSkillToggleResponse("research", {
      skillsConfig: {
        allSkillsDisabledByDefault: true,
        enabledSkillIds: ["research"],
      },
    })).toEqual({
      success: true,
      skillId: "research",
      enabledForProfile: true,
    })
  })

  it("runs shared skill list and toggle actions through service adapters", () => {
    const profile = {
      id: "profile-1",
      skillsConfig: {
        allSkillsDisabledByDefault: true,
        enabledSkillIds: ["writing"],
      },
    }
    const service = createSkillActionService({
      getCurrentProfile: () => profile,
      toggleProfileSkill: (profileId: string, skillId: string, allSkillIds: string[]) => {
        expect(profileId).toBe("profile-1")
        expect(skillId).toBe("research")
        expect(allSkillIds).toEqual(["research", "writing"])
        return {
          id: profileId,
          skillsConfig: {
            allSkillsDisabledByDefault: true,
            enabledSkillIds: ["research", "writing"],
          },
        }
      },
    })
    const diagnostics = {
      logError: () => {
        throw new Error("unexpected diagnostics log")
      },
    }

    expect(getSkillsAction({ service, diagnostics })).toEqual({
      statusCode: 200,
      body: buildSkillsResponse(skills, profile),
    })
    expect(toggleProfileSkillAction("research", { service, diagnostics })).toEqual({
      statusCode: 200,
      body: {
        success: true,
        skillId: "research",
        enabledForProfile: true,
      },
    })
  })

  it("runs shared skill CRUD actions through service adapters", () => {
    const profile = {
      id: "profile-1",
      skillsConfig: {
        allSkillsDisabledByDefault: true,
        enabledSkillIds: ["created"],
      },
    }
    const created = {
      id: "created",
      name: "Created",
      description: "New skill",
      instructions: "Do it",
      source: "local" as const,
      createdAt: 5,
      updatedAt: 5,
    }
    const updated = {
      ...skills[0],
      description: "Updated description",
      updatedAt: 6,
    }
    const service = createSkillActionService({
      getCurrentProfile: () => profile,
      createSkill: (name: string, description: string, instructions: string) => {
        expect({ name, description, instructions }).toEqual({
          name: "Created",
          description: "New skill",
          instructions: "Do it",
        })
        return created
      },
      enableSkillForCurrentProfile: (skillId: string) => {
        expect(skillId).toBe("created")
        return profile
      },
      importSkillFromMarkdown: (content: string) => {
        expect(content).toBe("---\nname: Created\n---\nDo it")
        return created
      },
      exportSkillToMarkdown: (skillId: string) => {
        expect(skillId).toBe("research")
        return "---\nname: Research\n---\nUse sources"
      },
      updateSkill: (skillId: string, updates: Record<string, unknown>) => {
        expect(skillId).toBe("research")
        expect(updates).toEqual({ description: "Updated description" })
        return updated
      },
      deleteSkill: (skillId: string) => {
        expect(skillId).toBe("research")
        return true
      },
    })
    const diagnostics = {
      logError: () => {
        throw new Error("unexpected diagnostics log")
      },
    }

    expect(getSkillAction("research", { service, diagnostics })).toEqual({
      statusCode: 200,
      body: buildSkillResponse(skills[0], profile),
    })
    expect(createSkillAction({
      name: " Created ",
      description: "New skill",
      instructions: "Do it",
    }, { service, diagnostics })).toEqual({
      statusCode: 200,
      body: buildSkillMutationResponse(created, profile),
    })
    expect(importSkillFromMarkdownAction({
      content: "---\nname: Created\n---\nDo it",
    }, { service, diagnostics })).toEqual({
      statusCode: 200,
      body: buildSkillMutationResponse(created, profile),
    })
    expect(exportSkillToMarkdownAction("research", { service, diagnostics })).toEqual({
      statusCode: 200,
      body: buildSkillExportMarkdownResponse("research", "---\nname: Research\n---\nUse sources"),
    })
    expect(updateSkillAction("research", {
      description: "Updated description",
    }, { service, diagnostics })).toEqual({
      statusCode: 200,
      body: buildSkillMutationResponse(updated, profile),
    })
    expect(deleteSkillAction("research", { service, diagnostics })).toEqual({
      statusCode: 200,
      body: buildSkillDeleteResponse("research"),
    })
  })

  it("returns shared skill action validation errors before mutating profile state", () => {
    const service = createSkillActionService({
      getCurrentProfile: () => null,
      deleteSkill: () => false,
      toggleProfileSkill: () => {
        throw new Error("unexpected toggle")
      },
    })
    const diagnostics = {
      logError: () => {
        throw new Error("unexpected diagnostics log")
      },
    }

    expect(toggleProfileSkillAction("missing", { service, diagnostics })).toEqual({
      statusCode: 404,
      body: { error: "Skill not found" },
    })
    expect(toggleProfileSkillAction("research", { service, diagnostics })).toEqual({
      statusCode: 400,
      body: { error: "No current profile set" },
    })
    expect(getSkillAction(undefined, { service, diagnostics })).toEqual({
      statusCode: 400,
      body: { error: "Skill id is required" },
    })
    expect(getSkillAction("missing", { service, diagnostics })).toEqual({
      statusCode: 404,
      body: { error: "Skill not found" },
    })
    expect(createSkillAction({ name: "" }, { service, diagnostics })).toEqual({
      statusCode: 400,
      body: { error: "Skill name is required" },
    })
    expect(importSkillFromMarkdownAction({ content: "   " }, { service, diagnostics })).toEqual({
      statusCode: 400,
      body: { error: "Skill Markdown content is required" },
    })
    expect(exportSkillToMarkdownAction(undefined, { service, diagnostics })).toEqual({
      statusCode: 400,
      body: { error: "Skill id is required" },
    })
    expect(exportSkillToMarkdownAction("missing", { service, diagnostics })).toEqual({
      statusCode: 404,
      body: { error: "Skill not found" },
    })
    expect(updateSkillAction("research", {}, { service, diagnostics })).toEqual({
      statusCode: 400,
      body: { error: "No skill updates provided" },
    })
    expect(updateSkillAction("missing", { name: "Missing" }, { service, diagnostics })).toEqual({
      statusCode: 404,
      body: { error: "Skill not found" },
    })
    expect(deleteSkillAction(undefined, { service, diagnostics })).toEqual({
      statusCode: 400,
      body: { error: "Skill id is required" },
    })
    expect(deleteSkillAction("missing", { service, diagnostics })).toEqual({
      statusCode: 404,
      body: { error: "Skill not found" },
    })
    expect(parseSkillImportMarkdownRequestBody({ content: "  ---\nname: Research\n---" })).toEqual({
      ok: true,
      request: { content: "  ---\nname: Research\n---" },
    })
  })

  it("logs shared skill action failures and returns route errors", () => {
    const error = new Error("toggle failed")
    const loggedErrors: unknown[] = []
    const service = createSkillActionService({
      getCurrentProfile: () => ({ id: "profile-1" }),
      toggleProfileSkill: () => {
        throw error
      },
    })
    const diagnostics = {
      logError: (source: string, message: string, caughtError: unknown) => {
        loggedErrors.push({ source, message, caughtError })
      },
    }

    expect(toggleProfileSkillAction("research", { service, diagnostics })).toEqual({
      statusCode: 500,
      body: { error: "toggle failed" },
    })
    expect(loggedErrors).toEqual([{
      source: "skill-actions",
      message: "Failed to toggle skill",
      caughtError: error,
    }])
  })

  it("parses GitHub skill identifiers and URLs", () => {
    expect(parseGitHubSkillIdentifier("owner/repo")).toEqual({
      owner: "owner",
      repo: "repo",
      ref: "main",
    })
    expect(parseGitHubSkillIdentifier("owner/repo/path/to/skill")).toEqual({
      owner: "owner",
      repo: "repo",
      path: "path/to/skill",
      ref: "main",
    })
    expect(parseGitHubSkillIdentifier("https://github.com/owner/repo")).toEqual({
      owner: "owner",
      repo: "repo",
      ref: "main",
    })
    expect(parseGitHubSkillIdentifier("https://github.com/owner/repo/tree/feature/foo/path/to/skill")).toEqual({
      owner: "owner",
      repo: "repo",
      path: "foo/path/to/skill",
      ref: "feature",
      refAndPath: ["feature", "foo", "path", "to", "skill"],
    })
    expect(parseGitHubSkillIdentifier("https://github.com/owner/repo/blob/main/SKILL.md")).toEqual({
      owner: "owner",
      repo: "repo",
      path: "SKILL.md",
      ref: "main",
      refAndPath: ["main", "SKILL.md"],
    })
    expect(() => parseGitHubSkillIdentifier("owner")).toThrow("Invalid GitHub identifier")
    expect(() => parseGitHubSkillIdentifier("https://github.com/owner")).toThrow("Invalid GitHub URL")
  })

  it("builds GitHub skill candidate paths in desktop-independent order", () => {
    expect(getGitHubSkillCandidateRelativePaths("repo")).toEqual([
      "SKILL.md",
      "skill.md",
      "skills/repo/SKILL.md",
      ".claude/skills/repo/SKILL.md",
      ".codex/skills/repo/SKILL.md",
    ])
    expect(isGitHubSkillMarkdownFileName("SKILL.md")).toBe(true)
    expect(isGitHubSkillMarkdownFileName("skill.md")).toBe(true)
    expect(isGitHubSkillMarkdownFileName("README.md")).toBe(false)
  })

  it("validates GitHub skill import path parts and refs", () => {
    expect(validateGitHubSkillIdentifierPart("owner-name", "owner")).toBe(true)
    expect(validateGitHubSkillIdentifierPart("repo.name_1", "repo")).toBe(true)
    expect(validateGitHubSkillIdentifierPart("-bad", "owner")).toBe(false)
    expect(validateGitHubSkillIdentifierPart("bad owner", "owner")).toBe(false)
    expect(validateGitHubSkillIdentifierPart("bad;repo", "repo")).toBe(false)

    expect(validateGitHubSkillRef("main")).toBe(true)
    expect(validateGitHubSkillRef("feature/foo-1")).toBe(true)
    expect(validateGitHubSkillRef("-delete")).toBe(false)
    expect(validateGitHubSkillRef("main;rm -rf")).toBe(false)

    expect(validateGitHubSkillSubPath("skills/my-skill")).toBe(true)
    expect(validateGitHubSkillSubPath("")).toBe(true)
    expect(validateGitHubSkillSubPath("../secret")).toBe(false)
    expect(validateGitHubSkillSubPath("skills/../secret")).toBe(false)
    expect(validateGitHubSkillSubPath("/absolute")).toBe(false)
    expect(validateGitHubSkillSubPath("C:\\absolute")).toBe(false)
    expect(validateGitHubSkillSubPath("\\\\server\\share")).toBe(false)
  })

  it("derives runtime skill ids from requested id, frontmatter id, and skill folder path", () => {
    expect(uniqueSkillIds([" research ", "", undefined, "research", "writing"])).toEqual(["research", "writing"])
    expect(getSkillFolderIdFromFilePath("/tmp/.agents/skills/youtube-analytics-cli/SKILL.md")).toBe("youtube-analytics-cli")
    expect(getSkillFolderIdFromFilePath("C:\\Users\\me\\.agents\\skills\\group\\nested\\skill.md")).toBe("group/nested")
    expect(getSkillFolderIdFromFilePath("github:owner/repo/SKILL.md")).toBeUndefined()
    expect(getSkillRuntimeIds({
      id: "youtube-studio-analytics",
      name: "YouTube Studio Analytics",
      filePath: "/tmp/.agents/skills/youtube-analytics-cli/SKILL.md",
    }, "youtube-analytics-cli")).toEqual(["youtube-analytics-cli", "youtube-studio-analytics"])
  })

  it("resolves runtime skills by exact id, display name, or folder id", () => {
    const registry: RuntimeSkillRegistryLike<RuntimeSkillLike> = {
      getSkill: (id: string) => id === "exact-id"
        ? { id: "exact-id", name: "Exact Skill" }
        : undefined,
      getSkills: () => [
        { id: "partial-legacy-skill" },
        { id: "display-id", name: "Display Name" },
        {
          id: "frontmatter-id",
          name: "Frontmatter Name",
          filePath: "/tmp/.agents/skills/folder-id/SKILL.md",
        },
      ],
    }

    expect(resolveRuntimeSkill("exact-id", registry)?.id).toBe("exact-id")
    expect(resolveRuntimeSkill("display name", registry)?.id).toBe("display-id")
    expect(resolveRuntimeSkill("folder-id", registry)?.id).toBe("frontmatter-id")
    expect(resolveRuntimeSkill("", registry)).toBeUndefined()
    expect(resolveRuntimeSkill("missing", registry)).toBeUndefined()
  })

  it("checks skill enablement against profile skill config", () => {
    expect(isSkillEnabledByConfig("research")).toBe(true)
    expect(isSkillEnabledByConfig("research", { allSkillsDisabledByDefault: false })).toBe(true)
    expect(isSkillEnabledByConfig("research", {
      allSkillsDisabledByDefault: true,
      enabledSkillIds: ["writing"],
    })).toBe(false)
    expect(isSkillEnabledByConfig(["research", "folder-id"], {
      allSkillsDisabledByDefault: true,
      enabledSkillIds: ["folder-id"],
    })).toBe(true)
  })

  it("builds ignored execute_command skill id warnings", () => {
    expect(buildIgnoredExecuteCommandSkillIdWarning("owner/repo", ["research"])).toEqual({
      ignoredInvalidSkillId: "owner/repo",
      warning: "Ignored invalid execute_command.skillId: owner/repo. Ran the command in the default workspace instead.",
      guidance: "skillId must be an exact loaded skill id from Available Skills. Omit skillId for normal workspace or repository commands. Never use repo names, file paths, URLs, or GitHub slugs as skillId.",
      retrySuggestion: "Retry the same command without skillId unless you explicitly need to run inside a loaded skill directory.",
      availableSkillIds: ["research"],
    })
  })

  it("parses runtime skill ids and builds runtime skill payloads", () => {
    expect(parseRuntimeSkillIdArg({})).toEqual({
      success: false,
      error: "skillId must be a non-empty string",
    })
    expect(parseRuntimeSkillIdArg({ skillId: "  research  " })).toEqual({
      success: true,
      skillId: "research",
    })
    expect(buildRuntimeSkillNotFoundPayload("missing-skill")).toEqual({
      success: false,
      error: "Skill 'missing-skill' not found. Check the Available Skills section in the system prompt for valid skill IDs.",
    })
    expect(buildDisabledRuntimeSkillPayload("disabled-skill", "load")).toEqual({
      success: false,
      skillId: "disabled-skill",
      error: "Skill 'disabled-skill' is disabled for this agent. Enable it in Settings > Skills before trying to load instructions for this skill.",
    })
    expect(buildDisabledRuntimeSkillPayload("disabled-skill", "execute").error).toContain("run commands inside this skill")
    expect(buildRuntimeSkillInstructionsText({
      id: "research",
      name: "Research",
      instructions: "Use sources",
    })).toBe("# Research\n\nUse sources")
  })
})
