import { describe, expect, it } from "vitest"

import {
  createAgentProfileAction,
  createAgentProfileRouteActions,
  createProfileActionServices,
  createProfileRouteActionBundle,
  createProfileRouteActions,
  deleteAgentProfileAction,
  buildAgentProfileDeleteResponse,
  buildAgentProfileDetailResponse,
  buildAgentProfileMutationDetailResponse,
  buildAgentProfilesReloadResponse,
  buildAgentProfilesResponse,
  buildAgentProfileToggleResponse,
  buildProfileExportResponse,
  buildProfileMutationResponse,
  buildProfilesResponse,
  exportProfileAction,
  filterAgentProfilesByRole,
  formatProfileForApi,
  getAgentProfileAction,
  getAgentProfilesAction,
  getCurrentProfileAction,
  getProfilesAction,
  importProfileAction,
  parseAgentProfileCreateRequestBody,
  parseAgentProfileUpdateRequestBody,
  parseImportProfileRequestBody,
  parseSetCurrentProfileRequestBody,
  parseVerifyExternalAgentCommandRequestBody,
  reloadAgentProfilesAction,
  setCurrentProfileAction,
  toggleAgentProfileAction,
  updateAgentProfileAction,
  verifyExternalAgentCommandAction,
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
      avatarDataUrl: "data:image/png;base64,abc",
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
        avatarDataUrl: "data:image/png;base64,abc",
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

  it("parses external agent command verification requests", () => {
    expect(parseVerifyExternalAgentCommandRequestBody({
      command: " codex-acp ",
      args: ["--stdio"],
      cwd: "/workspace",
      probeArgs: ["--help"],
    })).toEqual({
      ok: true,
      request: {
        command: "codex-acp",
        args: ["--stdio"],
        cwd: "/workspace",
        probeArgs: ["--help"],
      },
    })

    expect(parseVerifyExternalAgentCommandRequestBody({ command: " " })).toEqual({
      ok: false,
      statusCode: 400,
      error: "command is required and must be a non-empty string",
    })
    expect(parseVerifyExternalAgentCommandRequestBody({ command: "codex-acp", args: ["--stdio", 3] })).toEqual({
      ok: false,
      statusCode: 400,
      error: "args must be an array of strings",
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
    expect(parseAgentProfileCreateRequestBody({ displayName: "Agent", avatarDataUrl: 123 })).toEqual({
      ok: false,
      statusCode: 400,
      error: "avatarDataUrl must be a string or null",
    })
  })

  it("parses non-built-in agent profile updates", () => {
    const parsed = parseAgentProfileUpdateRequestBody(
      {
        displayName: " Updated Agent ",
        connectionType: "acpx",
        connectionCommand: " pnpm ",
        connectionArgs: " start agent ",
        avatarDataUrl: null,
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
        avatarDataUrl: null,
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
    expect(parseAgentProfileUpdateRequestBody(
      { avatarDataUrl: { data: "nope" } },
      { isBuiltIn: false, connection: { type: "internal" } },
    )).toEqual({
      ok: false,
      statusCode: 400,
      error: "avatarDataUrl must be a string or null",
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

    logs.length = 0
    appliedProfiles.length = 0
    const routeActions = createProfileRouteActions(options)
    expect(routeActions.getProfiles()).toEqual({
      statusCode: 200,
      body: buildProfilesResponse([profile], profile),
    })
    expect(routeActions.getCurrentProfile()).toEqual({
      statusCode: 200,
      body: formatProfileForApi(profile, { includeDetails: true }),
    })
    expect(routeActions.setCurrentProfile({ profileId: "profile-1" })).toEqual({
      statusCode: 200,
      body: buildProfileMutationResponse(profile, { nameSource: "name" }),
    })
    expect(routeActions.exportProfile("profile-1")).toEqual({
      statusCode: 200,
      body: buildProfileExportResponse("{\"profile\":true}"),
    })
    expect(routeActions.importProfile({ profileJson: "{\"id\":\"imported-profile\"}" })).toEqual({
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
        avatarDataUrl: "data:image/png;base64,abc",
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
    expect(buildAgentProfilesReloadResponse([agentProfile])).toEqual({
      success: true,
      profiles: [{
        id: "agent-1",
        name: "research-agent",
        displayName: "Research Agent",
        description: "Finds context",
        avatarDataUrl: "data:image/png;base64,abc",
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

  it("runs shared agent profile route actions through service adapters", async () => {
    const agentProfile = {
      id: "agent-1",
      name: "research-agent",
      displayName: "Research Agent",
      description: "Finds context",
      systemPrompt: "System",
      guidelines: "Guidelines",
      connection: { type: "internal" as const },
      enabled: true,
      isBuiltIn: false,
      isUserProfile: false,
      isAgentTarget: true,
      isDefault: false,
      autoSpawn: true,
      createdAt: 10,
      updatedAt: 20,
    }
    const createdProfile = {
      ...agentProfile,
      id: "agent-2",
      name: "New Agent",
      displayName: "New Agent",
      createdAt: 30,
      updatedAt: 30,
    }
    const updatedProfile = {
      ...agentProfile,
      name: "Renamed Agent",
      displayName: "Renamed Agent",
      updatedAt: 40,
    }
    const updateRequests: unknown[] = []
    const deletedProfileIds: string[] = []
    let reloadCount = 0
    const service = {
      getAll: () => [agentProfile],
      getById: (profileId: string) => profileId === "agent-1" ? agentProfile : undefined,
      create: (profileRequest: any) => {
        expect(profileRequest.displayName).toBe("New Agent")
        expect(profileRequest.role).toBe("delegation-target")
        return createdProfile
      },
      update: (profileId: string, updates: any) => {
        expect(profileId).toBe("agent-1")
        updateRequests.push(updates)
        if (updates.displayName === "Renamed Agent") return updatedProfile
        return { ...agentProfile, enabled: updates.enabled ?? agentProfile.enabled }
      },
      deleteProfile: (profileId: string) => {
        deletedProfileIds.push(profileId)
        return true
      },
      reload: () => {
        reloadCount += 1
      },
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

    expect(getAgentProfilesAction("delegation-target", options)).toEqual({
      statusCode: 200,
      body: buildAgentProfilesResponse([agentProfile]),
    })
    expect(getAgentProfileAction("agent-1", options)).toEqual({
      statusCode: 200,
      body: buildAgentProfileDetailResponse(agentProfile),
    })
    expect(toggleAgentProfileAction("agent-1", options)).toEqual({
      statusCode: 200,
      body: buildAgentProfileToggleResponse("agent-1", false),
    })
    expect(createAgentProfileAction({ displayName: " New Agent " }, options)).toEqual({
      statusCode: 201,
      body: buildAgentProfileDetailResponse(createdProfile),
    })
    expect(reloadAgentProfilesAction(options)).toEqual({
      statusCode: 200,
      body: buildAgentProfilesReloadResponse([agentProfile]),
    })
    expect(updateAgentProfileAction("agent-1", { displayName: " Renamed Agent " }, options)).toEqual({
      statusCode: 200,
      body: buildAgentProfileMutationDetailResponse(updatedProfile),
    })
    expect(deleteAgentProfileAction("agent-1", options)).toEqual({
      statusCode: 200,
      body: buildAgentProfileDeleteResponse(),
    })
    expect(updateRequests).toEqual([
      { enabled: false },
      { name: "Renamed Agent", displayName: "Renamed Agent" },
    ])
    expect(deletedProfileIds).toEqual(["agent-1"])
    expect(reloadCount).toBe(1)

    updateRequests.length = 0
    deletedProfileIds.length = 0
    reloadCount = 0
    const routeActions = createAgentProfileRouteActions({
      agentProfile: options,
      reload: options,
      externalCommandVerification: {
        diagnostics,
        service: {
          verifyExternalAgentCommand: async (request) => ({
            ok: true,
            resolvedCommand: request.command,
            details: "verified",
          }),
        },
      },
    })
    expect(routeActions.getAgentProfiles("delegation-target")).toEqual({
      statusCode: 200,
      body: buildAgentProfilesResponse([agentProfile]),
    })
    expect(routeActions.getAgentProfile("agent-1")).toEqual({
      statusCode: 200,
      body: buildAgentProfileDetailResponse(agentProfile),
    })
    expect(routeActions.toggleAgentProfile("agent-1")).toEqual({
      statusCode: 200,
      body: buildAgentProfileToggleResponse("agent-1", false),
    })
    expect(routeActions.createAgentProfile({ displayName: " New Agent " })).toEqual({
      statusCode: 201,
      body: buildAgentProfileDetailResponse(createdProfile),
    })
    expect(routeActions.reloadAgentProfiles()).toEqual({
      statusCode: 200,
      body: buildAgentProfilesReloadResponse([agentProfile]),
    })
    expect(routeActions.updateAgentProfile("agent-1", { displayName: " Renamed Agent " })).toEqual({
      statusCode: 200,
      body: buildAgentProfileMutationDetailResponse(updatedProfile),
    })
    expect(routeActions.deleteAgentProfile("agent-1")).toEqual({
      statusCode: 200,
      body: buildAgentProfileDeleteResponse(),
    })
    await expect(routeActions.verifyExternalAgentCommand({ command: "codex-acp" })).resolves.toEqual({
      statusCode: 200,
      body: {
        ok: true,
        resolvedCommand: "codex-acp",
        details: "verified",
      },
    })
    expect(updateRequests).toEqual([
      { enabled: false },
      { name: "Renamed Agent", displayName: "Renamed Agent" },
    ])
    expect(deletedProfileIds).toEqual(["agent-1"])
    expect(reloadCount).toBe(1)
  })

  it("creates profile action service bundles from desktop-style service adapters", async () => {
    const agentProfile = {
      id: "agent-1",
      name: "research-agent",
      displayName: "Research Agent",
      connection: { type: "internal" as const },
      enabled: true,
      isBuiltIn: false,
      isUserProfile: false,
      isAgentTarget: true,
      createdAt: 10,
      updatedAt: 20,
    }
    const calls: string[] = []
    const services = createProfileActionServices({
      profile: {
        getUserProfiles: () => {
          calls.push("getUserProfiles")
          return [profile]
        },
        getCurrentProfile: () => profile,
        setCurrentProfileStrict: (profileId) => {
          calls.push(`setCurrentProfileStrict:${profileId}`)
          return profile
        },
        exportProfile: (profileId) => `export:${profileId}`,
        importProfile: (profileJson) => ({
          ...profile,
          id: "imported-profile",
          name: profileJson,
        }),
      },
      agentProfile: {
        getAll: () => [agentProfile],
        getById: (profileId) => profileId === agentProfile.id ? agentProfile : undefined,
        create: () => agentProfile,
        update: () => agentProfile,
        delete: (profileId) => {
          calls.push(`delete:${profileId}`)
          return true
        },
        reload: () => {
          calls.push("reload")
        },
      },
      verifyExternalAgentCommand: async (request) => ({
        ok: true,
        resolvedCommand: request.command,
        details: "verified",
      }),
    })

    expect(services.profile.getUserProfiles()).toEqual([profile])
    expect(services.profile.setCurrentProfileStrict("profile-1")).toBe(profile)
    expect(services.profile.exportProfile("profile-1")).toBe("export:profile-1")
    expect(services.agentProfile.getAll()).toEqual([agentProfile])
    expect(services.agentProfile.getById("agent-1")).toBe(agentProfile)
    expect(services.agentProfile.deleteProfile("agent-1")).toBe(true)
    services.agentProfile.reload()
    await expect(services.externalCommandVerification.verifyExternalAgentCommand({ command: "codex-acp" })).resolves.toEqual({
      ok: true,
      resolvedCommand: "codex-acp",
      details: "verified",
    })
    expect(calls).toEqual([
      "getUserProfiles",
      "setCurrentProfileStrict:profile-1",
      "delete:agent-1",
      "reload",
    ])
  })

  it("creates profile route action bundles from shared service adapters", async () => {
    const agentProfile = {
      id: "agent-1",
      name: "research-agent",
      displayName: "Research Agent",
      connection: { type: "internal" as const },
      enabled: true,
      isBuiltIn: false,
      isUserProfile: false,
      isAgentTarget: true,
      createdAt: 10,
      updatedAt: 20,
    }
    const appliedProfiles: unknown[] = []
    const verifiedCommands: unknown[] = []
    let reloadCount = 0
    const diagnostics = {
      logInfo: () => {},
      logError: () => {
        throw new Error("unexpected error log")
      },
    }

    const routeActionBundle = createProfileRouteActionBundle({
      services: {
        profile: {
          getUserProfiles: () => [profile],
          getCurrentProfile: () => profile,
          setCurrentProfileStrict: () => profile,
          exportProfile: () => "{\"profile\":true}",
          importProfile: () => profile,
        },
        agentProfile: {
          getAll: () => [agentProfile],
          getById: (profileId) => profileId === "agent-1" ? agentProfile : undefined,
          create: () => agentProfile,
          update: () => agentProfile,
          deleteProfile: () => true,
          reload: () => {
            reloadCount += 1
          },
        },
        externalCommandVerification: {
          verifyExternalAgentCommand: async (request) => {
            verifiedCommands.push(request)
            return {
              ok: true,
              resolvedCommand: request.command,
              details: "verified",
            }
          },
        },
      },
      diagnostics,
      applyCurrentProfile: (updatedProfile) => appliedProfiles.push(updatedProfile),
    })

    expect(routeActionBundle.profiles.setCurrentProfile({ profileId: "profile-1" })).toEqual({
      statusCode: 200,
      body: buildProfileMutationResponse(profile, { nameSource: "name" }),
    })
    expect(routeActionBundle.agentProfiles.reloadAgentProfiles()).toEqual({
      statusCode: 200,
      body: buildAgentProfilesReloadResponse([agentProfile]),
    })
    await expect(routeActionBundle.agentProfiles.verifyExternalAgentCommand({ command: "codex-acp" })).resolves.toEqual({
      statusCode: 200,
      body: {
        ok: true,
        resolvedCommand: "codex-acp",
        details: "verified",
      },
    })
    expect(appliedProfiles).toEqual([profile])
    expect(reloadCount).toBe(1)
    expect(verifiedCommands).toEqual([{ command: "codex-acp" }])
  })

  it("runs external agent command verification through a shared action adapter", async () => {
    const verified = {
      ok: true,
      resolvedCommand: "/usr/local/bin/codex-acp",
      details: "Successfully ran codex-acp --help.",
    }
    const verificationRequests: unknown[] = []
    const diagnostics = {
      logInfo: () => {
        throw new Error("unexpected info log")
      },
      logError: () => {
        throw new Error("unexpected error log")
      },
    }

    await expect(verifyExternalAgentCommandAction({
      command: " codex-acp ",
      probeArgs: ["--help"],
    }, {
      diagnostics,
      service: {
        verifyExternalAgentCommand: async (request) => {
          verificationRequests.push(request)
          return verified
        },
      },
    })).resolves.toEqual({
      statusCode: 200,
      body: verified,
    })
    expect(verificationRequests).toEqual([{ command: "codex-acp", probeArgs: ["--help"] }])
  })

  it("returns shared agent profile route validation and state errors", () => {
    const agentProfile = {
      id: "agent-1",
      name: "research-agent",
      displayName: "Research Agent",
      connection: { type: "internal" as const },
      enabled: true,
      isBuiltIn: false,
      isUserProfile: false,
      isAgentTarget: true,
      createdAt: 10,
      updatedAt: 20,
    }
    const builtInProfile = {
      ...agentProfile,
      id: "built-in-agent",
      isBuiltIn: true,
    }
    const diagnostics = {
      logInfo: () => {
        throw new Error("unexpected info log")
      },
      logError: () => {
        throw new Error("unexpected error log")
      },
    }
    const options = {
      diagnostics,
      service: {
        getAll: () => [],
        getById: (profileId: string) => profileId === "agent-1"
          ? agentProfile
          : profileId === "built-in-agent"
            ? builtInProfile
            : undefined,
        create: () => agentProfile,
        update: () => undefined,
        deleteProfile: () => false,
      },
    }

    expect(getAgentProfileAction("missing", options)).toEqual({
      statusCode: 404,
      body: { error: "Agent profile not found" },
    })
    expect(toggleAgentProfileAction("missing", options)).toEqual({
      statusCode: 404,
      body: { error: "Agent profile not found" },
    })
    expect(createAgentProfileAction({}, options)).toEqual({
      statusCode: 400,
      body: { error: "displayName is required and must be a non-empty string" },
    })
    expect(updateAgentProfileAction("agent-1", { displayName: "" }, options)).toEqual({
      statusCode: 400,
      body: { error: "displayName must be a non-empty string" },
    })
    expect(updateAgentProfileAction("agent-1", { displayName: "Updated" }, options)).toEqual({
      statusCode: 500,
      body: { error: "Failed to update agent profile" },
    })
    expect(deleteAgentProfileAction("built-in-agent", options)).toEqual({
      statusCode: 403,
      body: { error: "Cannot delete built-in agent profiles" },
    })
    expect(deleteAgentProfileAction("agent-1", options)).toEqual({
      statusCode: 500,
      body: { error: "Failed to delete agent profile" },
    })
  })

  it("logs shared agent profile route failures and returns route errors", () => {
    const caughtFailure = new Error("storage failed")
    const loggedErrors: unknown[] = []
    const diagnostics = {
      logInfo: () => {
        throw new Error("unexpected info log")
      },
      logError: (source: string, message: string, caughtError: unknown) => {
        loggedErrors.push({ source, message, caughtError })
      },
    }

    expect(getAgentProfilesAction(undefined, {
      diagnostics,
      service: {
        getAll: () => {
          throw caughtFailure
        },
        getById: () => undefined,
        create: () => {
          throw new Error("unexpected create")
        },
        update: () => undefined,
        deleteProfile: () => false,
      },
    })).toEqual({
      statusCode: 500,
      body: { error: "Failed to get agent profiles" },
    })
    expect(loggedErrors).toEqual([
      {
        source: "agent-profile-actions",
        message: "Failed to get agent profiles",
        caughtError: caughtFailure,
      },
    ])
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
