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
  filterAgentProfilesByRole,
  formatProfileForApi,
  parseAgentProfileCreateRequestBody,
  parseAgentProfileUpdateRequestBody,
  parseImportProfileRequestBody,
  parseSetCurrentProfileRequestBody,
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
