import { describe, expect, it } from "vitest"

import {
  buildAgentProfileDeleteResponse,
  buildAgentProfileDetailResponse,
  buildAgentProfileMutationDetailResponse,
  buildAgentProfilesResponse,
  buildAgentProfileToggleResponse,
  buildProfileExportResponse,
  buildProfileMutationResponse,
  buildProfilesResponse,
  exportProfileAction,
  filterAgentProfilesByRole,
  formatProfileForApi,
  getCurrentProfileAction,
  getProfilesAction,
  importProfileAction,
  parseAgentProfileCreateRequestBody,
  parseAgentProfileUpdateRequestBody,
  parseImportProfileRequestBody,
  parseSetCurrentProfileRequestBody,
  setCurrentProfileAction,
} from "./profile-api"

describe("profile API helpers", () => {
  const profile = {
    id: "profile-1",
    name: "internal-name",
    displayName: "Display Name",
    isDefault: true,
    guidelines: "Be concise",
    systemPrompt: "System",
    createdAt: 1,
    updatedAt: 2,
  }

  it("parses set-current and import request bodies", () => {
    expect(parseSetCurrentProfileRequestBody({ profileId: "profile-1" })).toEqual({
      ok: true,
      request: { profileId: "profile-1" },
    })
    expect(parseImportProfileRequestBody({ profileJson: "{\"id\":\"profile-1\"}" })).toEqual({
      ok: true,
      request: { profileJson: "{\"id\":\"profile-1\"}" },
    })
  })

  it("returns route-compatible parse errors", () => {
    expect(parseSetCurrentProfileRequestBody({})).toEqual({
      ok: false,
      statusCode: 400,
      error: "Missing or invalid profileId",
    })
    expect(parseImportProfileRequestBody({ profileJson: "" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Missing or invalid profileJson",
    })
  })

  it("parses agent profile create requests into service-ready payloads", () => {
    const parsed = parseAgentProfileCreateRequestBody({
      displayName: " Research Agent ",
      description: "Finds context",
      connectionType: "remote",
      connectionBaseUrl: " https://agent.example.com ",
      enabled: false,
      autoSpawn: true,
      properties: { tone: "direct" },
    })

    expect(parsed).toEqual({
      ok: true,
      request: {
        name: "Research Agent",
        displayName: "Research Agent",
        description: "Finds context",
        connection: { type: "remote", baseUrl: "https://agent.example.com" },
        enabled: false,
        autoSpawn: true,
        properties: { tone: "direct" },
        role: "delegation-target",
        isUserProfile: false,
        isAgentTarget: true,
      },
    })
  })

  it("returns route-compatible agent profile create errors", () => {
    expect(parseAgentProfileCreateRequestBody({})).toEqual({
      ok: false,
      statusCode: 400,
      error: "displayName is required and must be a non-empty string",
    })
    expect(parseAgentProfileCreateRequestBody({ displayName: "Agent", connectionType: "bad" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "connectionType must be one of: internal, acpx, acp, stdio, remote",
    })
  })

  it("parses non-built-in agent profile updates", () => {
    const parsed = parseAgentProfileUpdateRequestBody(
      {
        displayName: " Updated Agent ",
        connectionType: "acpx",
        connectionCommand: " pnpm ",
        connectionArgs: " start agent ",
        enabled: true,
      },
      { isBuiltIn: false, connection: { type: "internal" } },
    )

    expect(parsed).toEqual({
      ok: true,
      request: {
        name: "Updated Agent",
        displayName: "Updated Agent",
        connection: {
          type: "acpx",
          command: "pnpm",
          args: ["start", "agent"],
        },
        enabled: true,
      },
    })
  })

  it("limits built-in agent profile updates to allowed fields", () => {
    expect(parseAgentProfileUpdateRequestBody(
      {
        displayName: "",
        enabled: false,
        guidelines: "Use the workspace conventions",
        modelConfig: { provider: "openai" },
      },
      { isBuiltIn: true, connection: { type: "internal" } },
    )).toEqual({
      ok: true,
      request: {
        enabled: false,
        guidelines: "Use the workspace conventions",
      },
    })
  })

  it("returns route-compatible agent profile update errors", () => {
    expect(parseAgentProfileUpdateRequestBody(
      { displayName: "" },
      { isBuiltIn: false, connection: { type: "internal" } },
    )).toEqual({
      ok: false,
      statusCode: 400,
      error: "displayName must be a non-empty string",
    })
    expect(parseAgentProfileUpdateRequestBody(
      { connectionType: "bad" },
      { isBuiltIn: false, connection: { type: "internal" } },
    )).toEqual({
      ok: false,
      statusCode: 400,
      error: "connectionType must be one of: internal, acpx, acp, stdio, remote",
    })
  })

  it("formats list and detailed profile responses", () => {
    expect(formatProfileForApi(profile)).toEqual({
      id: "profile-1",
      name: "Display Name",
      isDefault: true,
      createdAt: 1,
      updatedAt: 2,
    })

    expect(formatProfileForApi(profile, { includeDetails: true })).toEqual({
      id: "profile-1",
      name: "Display Name",
      isDefault: true,
      guidelines: "Be concise",
      systemPrompt: "System",
      createdAt: 1,
      updatedAt: 2,
    })
  })

  it("builds profile route responses while preserving legacy name source selection", () => {
    expect(buildProfilesResponse([profile], { id: "profile-1" })).toEqual({
      profiles: [{
        id: "profile-1",
        name: "Display Name",
        isDefault: true,
        createdAt: 1,
        updatedAt: 2,
      }],
      currentProfileId: "profile-1",
    })

    expect(buildProfileMutationResponse(profile, { nameSource: "name" })).toEqual({
      success: true,
      profile: {
        id: "profile-1",
        name: "internal-name",
        isDefault: true,
        createdAt: 1,
        updatedAt: 2,
      },
    })

    expect(buildProfileExportResponse("{\"profile\":true}")).toEqual({
      profileJson: "{\"profile\":true}",
    })
  })

  it("runs shared profile route actions through service adapters", () => {
    const logs: unknown[] = []
    const appliedProfiles: unknown[] = []
    const importedProfile = {
      ...profile,
      id: "imported-profile",
      name: "imported-profile",
      displayName: "Imported Profile",
    }
    const service = {
      getUserProfiles: () => [profile],
      getCurrentProfile: () => profile,
      setCurrentProfileStrict: (profileId: string) => {
        expect(profileId).toBe("profile-1")
        return profile
      },
      exportProfile: (profileId: string) => {
        expect(profileId).toBe("profile-1")
        return "{\"profile\":true}"
      },
      importProfile: (profileJson: string) => {
        expect(profileJson).toBe("{\"id\":\"imported-profile\"}")
        return importedProfile
      },
    }
    const diagnostics = {
      logInfo: (source: string, message: string) => logs.push({ level: "info", source, message }),
      logError: () => {
        throw new Error("unexpected diagnostics log")
      },
    }
    const options = {
      service,
      diagnostics,
      applyCurrentProfile: (updatedProfile: typeof profile) => appliedProfiles.push(updatedProfile),
    }

    expect(getProfilesAction(options)).toEqual({
      statusCode: 200,
      body: buildProfilesResponse([profile], profile),
    })
    expect(getCurrentProfileAction(options)).toEqual({
      statusCode: 200,
      body: formatProfileForApi(profile, { includeDetails: true }),
    })
    expect(setCurrentProfileAction({ profileId: "profile-1" }, options)).toEqual({
      statusCode: 200,
      body: buildProfileMutationResponse(profile, { nameSource: "name" }),
    })
    expect(exportProfileAction("profile-1", options)).toEqual({
      statusCode: 200,
      body: buildProfileExportResponse("{\"profile\":true}"),
    })
    expect(importProfileAction({ profileJson: "{\"id\":\"imported-profile\"}" }, options)).toEqual({
      statusCode: 200,
      body: buildProfileMutationResponse(importedProfile),
    })
    expect(appliedProfiles).toEqual([profile])
    expect(logs).toEqual([
      { level: "info", source: "profile-actions", message: "Switched to profile: Display Name" },
      { level: "info", source: "profile-actions", message: "Imported profile: Imported Profile" },
    ])
  })

  it("returns shared profile route validation and missing-current errors", () => {
    const service = {
      getUserProfiles: () => [profile],
      getCurrentProfile: () => null,
      setCurrentProfileStrict: () => {
        throw new Error("unexpected set")
      },
      exportProfile: () => "{}",
      importProfile: () => profile,
    }
    const diagnostics = {
      logInfo: () => {
        throw new Error("unexpected info log")
      },
      logError: () => {
        throw new Error("unexpected error log")
      },
    }
    const options = { service, diagnostics }

    expect(getCurrentProfileAction(options)).toEqual({
      statusCode: 404,
      body: { error: "No current profile set" },
    })
    expect(setCurrentProfileAction({}, options)).toEqual({
      statusCode: 400,
      body: { error: "Missing or invalid profileId" },
    })
    expect(importProfileAction({}, options)).toEqual({
      statusCode: 400,
      body: { error: "Missing or invalid profileJson" },
    })
  })

  it("logs shared profile route failures and preserves route status mapping", () => {
    const notFoundError = new Error("profile not found")
    const importError = new SyntaxError("Unexpected token")
    const loggedErrors: unknown[] = []
    const diagnostics = {
      logInfo: () => {
        throw new Error("unexpected info log")
      },
      logError: (source: string, message: string, caughtError: unknown) => {
        loggedErrors.push({ source, message, caughtError })
      },
    }

    expect(setCurrentProfileAction({ profileId: "missing" }, {
      diagnostics,
      service: {
        getUserProfiles: () => [],
        getCurrentProfile: () => null,
        setCurrentProfileStrict: () => {
          throw notFoundError
        },
        exportProfile: () => "{}",
        importProfile: () => profile,
      },
    })).toEqual({
      statusCode: 404,
      body: { error: "profile not found" },
    })
    expect(importProfileAction({ profileJson: "bad" }, {
      diagnostics,
      service: {
        getUserProfiles: () => [],
        getCurrentProfile: () => null,
        setCurrentProfileStrict: () => profile,
        exportProfile: () => "{}",
        importProfile: () => {
          throw importError
        },
      },
    })).toEqual({
      statusCode: 400,
      body: { error: "Unexpected token" },
    })
    expect(loggedErrors).toEqual([
      {
        source: "profile-actions",
        message: "Failed to set current profile",
        caughtError: notFoundError,
      },
      {
        source: "profile-actions",
        message: "Failed to import profile",
        caughtError: importError,
      },
    ])
  })

  it("formats agent profile list and detail responses", () => {
    const agentProfile = {
      id: "agent-1",
      name: "research-agent",
      displayName: "Research Agent",
      description: "Finds context",
      avatarDataUrl: "data:image/png;base64,abc",
      systemPrompt: "System",
      guidelines: "Guidelines",
      properties: { tone: "direct" },
      modelConfig: { provider: "openai" },
      toolConfig: { enabledServers: ["filesystem"] },
      skillsConfig: { skills: ["research"] },
      connection: { type: "remote" as const, baseUrl: "https://agent.example.com" },
      isStateful: true,
      conversationId: "conv-1",
      role: "user-profile",
      enabled: true,
      isBuiltIn: false,
      isUserProfile: true,
      isAgentTarget: false,
      isDefault: false,
      autoSpawn: true,
      createdAt: 10,
      updatedAt: 20,
    }

    expect(buildAgentProfilesResponse([agentProfile])).toEqual({
      profiles: [{
        id: "agent-1",
        name: "research-agent",
        displayName: "Research Agent",
        description: "Finds context",
        enabled: true,
        isBuiltIn: false,
        isUserProfile: true,
        isAgentTarget: false,
        isDefault: false,
        role: "chat-agent",
        connectionType: "remote",
        autoSpawn: true,
        guidelines: "Guidelines",
        systemPrompt: "System",
        createdAt: 10,
        updatedAt: 20,
      }],
    })

    expect(buildAgentProfileDetailResponse(agentProfile).profile).toMatchObject({
      id: "agent-1",
      role: "chat-agent",
      connectionType: "remote",
      connection: { type: "remote", baseUrl: "https://agent.example.com" },
      avatarDataUrl: "data:image/png;base64,abc",
      properties: { tone: "direct" },
      isStateful: true,
      conversationId: "conv-1",
    })
    expect(buildAgentProfileMutationDetailResponse(agentProfile).success).toBe(true)
    expect(buildAgentProfileToggleResponse("agent-1", false)).toEqual({
      success: true,
      id: "agent-1",
      enabled: false,
    })
    expect(buildAgentProfileDeleteResponse()).toEqual({ success: true })
  })

  it("filters agent profiles by preferred and legacy role names", () => {
    const profiles = [
      { role: "chat-agent", isUserProfile: true, isAgentTarget: false },
      { role: "delegation-target", isUserProfile: false, isAgentTarget: true },
      { role: "user-profile", isUserProfile: false, isAgentTarget: false },
    ]

    expect(filterAgentProfilesByRole(profiles, "chat-agent")).toEqual([profiles[0], profiles[2]])
    expect(filterAgentProfilesByRole(profiles, "user-profile")).toEqual([profiles[0], profiles[2]])
    expect(filterAgentProfilesByRole(profiles, "delegation-target")).toEqual([profiles[1]])
    expect(filterAgentProfilesByRole(profiles, undefined)).toEqual(profiles)
  })
})
