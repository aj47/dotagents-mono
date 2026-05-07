import { describe, expect, it } from "vitest"

import {
  appendOperatorAuditLogEntry,
  authorizeRemoteServerRequest,
  clearOperatorMessageQueueAction,
  buildOperatorActionErrorResponse,
  buildOperatorActionAuditContext,
  buildOperatorAgentSessionStopResponse,
  buildOperatorApiKeyRotationAuditContext,
  buildOperatorApiKeyRotationFailureAuditContext,
  buildOperatorApiKeyRotationResponse,
  buildOperatorAuditActionFromPath,
  buildOperatorAuditEventEntry,
  buildOperatorAuditResponse,
  buildOperatorResponseAuditContext,
  buildRejectedOperatorDeviceAuditEntry,
  buildOperatorConversationsResponse,
  buildOperatorDiscordClearLogsActionResponse,
  buildOperatorDiscordConnectActionResponse,
  buildOperatorDiscordDisconnectActionResponse,
  buildOperatorDiscordIntegrationSummary,
  buildOperatorDiscordLogsResponse,
  buildOperatorDownloadedAssetActionResponse,
  buildOperatorIntegrationsSummaryAction,
  buildOperatorHealthSnapshot,
  buildOperatorLogSummary,
  buildOperatorLogsResponse,
  buildOperatorMessageQueueClearResponse,
  buildOperatorMessageQueuePauseResponse,
  buildOperatorMessageQueueResumeResponse,
  buildOperatorQueuedMessageRemoveResponse,
  buildOperatorQueuedMessageRetryResponse,
  buildOperatorQueuedMessageUpdateResponse,
  buildOperatorMcpClearLogsAuditContext,
  buildOperatorMcpClearLogsFailureAuditContext,
  buildOperatorMcpClearLogsResponse,
  buildOperatorMcpStartAuditContext,
  buildOperatorMcpStartFailureAuditContext,
  buildOperatorMcpStartResponse,
  buildOperatorMcpTestAuditContext,
  buildOperatorMcpTestFailureAuditContext,
  buildOperatorMcpTestResponse,
  buildOperatorMcpRestartAuditContext,
  buildOperatorMcpRestartFailureAuditContext,
  buildOperatorMcpRestartResponse,
  buildOperatorMcpStopAuditContext,
  buildOperatorMcpStopFailureAuditContext,
  buildOperatorMcpStopResponse,
  buildOperatorOpenReleasesActionResponse,
  buildOperatorPushNotificationsSummary,
  buildOperatorRecentErrorSummary,
  buildOperatorRecentErrorsResponse,
  buildOperatorRemoteServerStatus,
  buildOperatorRestartAppActionResponse,
  buildOperatorRestartRemoteServerActionResponse,
  buildOperatorRuntimeStatus,
  buildOperatorRunAgentResponse,
  buildOperatorSessionsSummary,
  buildOperatorSystemMetrics,
  buildOperatorTunnelStartActionResponse,
  buildOperatorTunnelStartRemoteServerRequiredResponse,
  buildOperatorTunnelStopActionResponse,
  buildOperatorTunnelSetupSummary,
  buildOperatorTunnelStatus,
  buildOperatorUpdaterCheckActionResponse,
  buildOperatorUpdaterDownloadLatestActionResponse,
  buildOperatorUpdaterStatus,
  buildOperatorWhatsAppActionErrorResponse,
  buildOperatorWhatsAppActionSuccessResponse,
  buildOperatorWhatsAppIntegrationSummary,
  buildOperatorWhatsAppServerUnavailableActionResponse,
  clampOperatorCount,
  clearOperatorDiscordLogsAction,
  connectOperatorDiscordAction,
  connectOperatorWhatsAppAction,
  createOperatorApiKeyRouteActions,
  createOperatorAgentRouteActions,
  createOperatorAuditRecorder,
  createOperatorAuditRouteActions,
  createOperatorIntegrationRouteActions,
  createOperatorMessageQueueRouteActions,
  createOperatorObservabilityRouteActions,
  createOperatorRestartRouteActions,
  createOperatorTunnelRouteActions,
  createOperatorUpdaterRouteActions,
  getConfiguredCloudflareTunnelStartPlan,
  getOperatorAuditAction,
  getOperatorDiscordAction,
  getOperatorDiscordLogsAction,
  getOperatorIntegrationsAction,
  getOperatorMessageQueuesAction,
  getOperatorWhatsAppAction,
  getRemoteServerBearerToken,
  getOperatorAuditDeviceId,
  getOperatorAuditPath,
  getOperatorAuditSource,
  getOperatorConversationsAction,
  getOperatorErrorsAction,
  getOperatorHealthAction,
  getOperatorLogsAction,
  getOperatorMcpToolResultText,
  getOperatorRemoteServerAction,
  getOperatorStatusAction,
  getOperatorTunnelAction,
  getOperatorTunnelSetupAction,
  getOperatorUpdaterAction,
  getOperatorWhatsAppIntegrationSummaryAction,
  getSanitizedWhatsAppOperatorDetails,
  getSensitiveOperatorSettingsKeys,
  isLoopbackOperatorAccessIp,
  isOperatorAuditEntry,
  isProtectedOperatorAccessPath,
  isSensitiveOperatorSettingsKey,
  disconnectOperatorDiscordAction,
  logoutOperatorWhatsAppAction,
  mergeOperatorWhatsAppStatusPayload,
  normalizeOperatorLogLevel,
  checkOperatorUpdaterAction,
  downloadLatestOperatorUpdateAssetAction,
  openOperatorReleasesPageAction,
  openOperatorUpdateAssetAction,
  pauseOperatorMessageQueueAction,
  OPERATOR_AUDIT_DEVICE_HEADER_KEYS,
  parseOperatorJsonRecord,
  parseOperatorAuditLogEntries,
  parseOperatorMcpRestartRequestBody,
  parseOperatorMcpServerActionRequestBody,
  parseOperatorQueuedMessageUpdateRequestBody,
  parseOperatorRunAgentRequestBody,
  removeOperatorQueuedMessageAction,
  restartOperatorAppAction,
  restartOperatorRemoteServerAction,
  resumeOperatorMessageQueueAction,
  rotateOperatorRemoteServerApiKeyAction,
  runOperatorAgentAction,
  retryOperatorQueuedMessageAction,
  revealOperatorUpdateAssetAction,
  sanitizeOperatorAuditDetails,
  sanitizeOperatorAuditText,
  serializeOperatorAuditLogEntries,
  stopOperatorAgentSessionAction,
  SENSITIVE_OPERATOR_SETTINGS_KEYS,
  updateOperatorQueuedMessageAction,
  type OperatorAgentActionOptions,
  type OperatorApiKeyActionOptions,
  type OperatorAuditActionOptions,
  type OperatorIntegrationActionOptions,
  type OperatorMessageQueueActionOptions,
  type OperatorObservabilityActionOptions,
  type OperatorTunnelActionOptions,
  type OperatorUpdaterActionOptions,
  startOperatorTunnelAction,
  stopOperatorTunnelAction,
} from "./operator-actions"

describe("operator action API helpers", () => {
  it("parses run-agent request bodies", () => {
    expect(parseOperatorRunAgentRequestBody({
      prompt: "  Do it  ",
      conversationId: "conv-1",
      profileId: "profile-1",
    })).toEqual({
      ok: true,
      request: {
        prompt: "Do it",
        conversationId: "conv-1",
        profileId: "profile-1",
      },
    })

    expect(parseOperatorRunAgentRequestBody({ prompt: " " })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Missing prompt",
    })
  })

  it("builds run-agent responses", () => {
    expect(buildOperatorRunAgentResponse({
      conversationId: "conv-1",
      content: "Done",
      conversationHistory: [{ role: "user", content: "Do it" }, { role: "assistant", content: "Done" }],
    })).toEqual({
      success: true,
      action: "run-agent",
      conversationId: "conv-1",
      content: "Done",
      messageCount: 2,
    })
  })

  it("runs agent route actions through a shared service adapter", async () => {
    const calls: string[] = []
    const options: OperatorAgentActionOptions = {
      diagnostics: {
        logInfo: (_source, message) => { calls.push(`info:${message}`) },
        logError: (_source, message) => { calls.push(`error:${message}`) },
        getErrorMessage: (error) => error instanceof Error ? error.message : String(error),
      },
      service: {
        stopAgentSessionById: async (sessionId) => {
          calls.push(`stop:${sessionId}`)
          return { sessionId, conversationId: "conv-1" }
        },
      },
    }

    const runAgent = async (request: { prompt: string; conversationId?: string; profileId?: string }) => {
      calls.push(`run:${request.prompt}:${request.conversationId}:${request.profileId}`)
      return {
        conversationId: request.conversationId ?? "conv-new",
        content: "Done",
        conversationHistory: [
          { role: "user" as const, content: request.prompt },
          { role: "assistant" as const, content: "Done" },
        ],
      }
    }

    expect(await runOperatorAgentAction({
      prompt: "  Do it  ",
      conversationId: "conv-1",
      profileId: "profile-1",
    }, runAgent, options)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "run-agent",
        conversationId: "conv-1",
        content: "Done",
        messageCount: 2,
      },
      auditContext: {
        action: "run-agent",
        success: true,
        details: {
          promptLength: 5,
          conversationId: "conv-1",
        },
      },
    })
    expect(await runOperatorAgentAction({ prompt: " " }, runAgent, options)).toEqual({
      statusCode: 400,
      body: { error: "Missing prompt" },
    })

    const failingRunAgent = async () => { throw new Error("runner denied") }
    expect(await runOperatorAgentAction({ prompt: "fail" }, failingRunAgent, options)).toEqual({
      statusCode: 500,
      body: { error: "Agent execution failed: runner denied" },
      auditContext: {
        action: "run-agent",
        success: false,
        failureReason: "run-agent-error",
      },
    })
    expect(await stopOperatorAgentSessionAction(" session-1 ", options)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "agent-session-stop",
        details: {
          sessionId: "session-1",
          conversationId: "conv-1",
        },
      },
      auditContext: {
        action: "agent-session-stop",
        success: true,
      },
    })
    expect(await stopOperatorAgentSessionAction(" ", options)).toMatchObject({
      statusCode: 400,
      body: {
        success: false,
        action: "agent-session-stop",
        error: "Missing session ID",
      },
      auditContext: {
        action: "agent-session-stop",
        success: false,
        failureReason: "Missing session ID",
      },
    })

    const routeActions = createOperatorAgentRouteActions(options)
    expect(await routeActions.runOperatorAgent({ prompt: "Route run" }, runAgent)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "run-agent",
        content: "Done",
      },
    })
    expect(await routeActions.stopOperatorAgentSession("session-1")).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "agent-session-stop",
      },
    })

    const failingStopOptions: OperatorAgentActionOptions = {
      ...options,
      service: {
        stopAgentSessionById: async () => { throw new Error("missing session") },
      },
    }
    expect(await stopOperatorAgentSessionAction("session-404", failingStopOptions)).toMatchObject({
      statusCode: 500,
      body: {
        success: false,
        action: "agent-session-stop",
        error: "Failed to stop agent session: missing session",
      },
      auditContext: {
        action: "agent-session-stop",
        success: false,
        failureReason: "Failed to stop agent session: missing session",
      },
    })
    expect(calls).toEqual(expect.arrayContaining([
      "info:Operator run-agent: 5 chars (conversation conv-1)",
      "run:Do it:conv-1:profile-1",
      "error:Operator run-agent failed: runner denied",
      "stop:session-1",
      "error:Failed to stop agent session session-404: missing session",
    ]))
  })

  it("parses queued message update bodies", () => {
    expect(parseOperatorQueuedMessageUpdateRequestBody({ text: "  retry this  " })).toEqual({
      ok: true,
      request: { text: "retry this" },
    })
    expect(parseOperatorQueuedMessageUpdateRequestBody({ text: " " })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Message text is required",
    })
    expect(parseOperatorQueuedMessageUpdateRequestBody(null)).toEqual({
      ok: false,
      statusCode: 400,
      error: "Request body must be an object",
    })
  })

  it("parses and formats MCP restart actions", () => {
    expect(parseOperatorMcpServerActionRequestBody({ server: " filesystem " })).toEqual({
      ok: true,
      request: { server: "filesystem" },
    })
    expect(parseOperatorMcpRestartRequestBody({ server: " filesystem " })).toEqual({
      ok: true,
      request: { server: "filesystem" },
    })
    expect(parseOperatorMcpRestartRequestBody({ server: "" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Missing server name",
    })
    expect(buildOperatorMcpRestartResponse("filesystem")).toEqual({
      success: true,
      action: "mcp-restart",
      server: "filesystem",
    })
    expect(buildOperatorMcpStartResponse("filesystem")).toEqual({
      success: true,
      action: "mcp-start",
      server: "filesystem",
      message: "Started filesystem",
    })
    expect(buildOperatorMcpStopResponse("filesystem")).toEqual({
      success: true,
      action: "mcp-stop",
      server: "filesystem",
      message: "Stopped filesystem",
    })
    expect(buildOperatorMcpClearLogsResponse("filesystem")).toEqual({
      success: true,
      action: "mcp-clear-logs",
      message: "Cleared logs for filesystem",
      details: { server: "filesystem" },
    })
    expect(buildOperatorMcpTestResponse("filesystem", { success: true, toolCount: 3 })).toEqual({
      success: true,
      action: "mcp-test",
      server: "filesystem",
      message: "Connection test successful for filesystem",
      toolCount: 3,
    })
    expect(buildOperatorMcpTestResponse("filesystem", { success: false, error: "Command missing" })).toEqual({
      success: false,
      action: "mcp-test",
      server: "filesystem",
      message: "Command missing",
      error: "Command missing",
    })
    expect(buildOperatorMcpRestartAuditContext("filesystem")).toEqual({
      action: "mcp-restart",
      success: true,
      details: { server: "filesystem" },
    })
    expect(buildOperatorMcpStartAuditContext("filesystem")).toEqual({
      action: "mcp-start",
      success: true,
      details: { server: "filesystem" },
    })
    expect(buildOperatorMcpStopAuditContext("filesystem")).toEqual({
      action: "mcp-stop",
      success: true,
      details: { server: "filesystem" },
    })
    expect(buildOperatorMcpClearLogsAuditContext("filesystem")).toEqual({
      action: "mcp-clear-logs",
      success: true,
      details: { server: "filesystem" },
    })
    expect(buildOperatorMcpTestAuditContext({
      success: false,
      action: "mcp-test",
      server: "filesystem",
      message: "Command missing",
      error: "Command missing",
    })).toEqual({
      action: "mcp-test",
      success: false,
      details: { server: "filesystem" },
      failureReason: "Command missing",
    })
    expect(buildOperatorMcpRestartFailureAuditContext("restart-failed")).toEqual({
      action: "mcp-restart",
      success: false,
      failureReason: "restart-failed",
    })
    expect(buildOperatorMcpStartFailureAuditContext("start-failed")).toEqual({
      action: "mcp-start",
      success: false,
      failureReason: "start-failed",
    })
    expect(buildOperatorMcpStopFailureAuditContext("stop-failed")).toEqual({
      action: "mcp-stop",
      success: false,
      failureReason: "stop-failed",
    })
    expect(buildOperatorMcpClearLogsFailureAuditContext("clear-failed")).toEqual({
      action: "mcp-clear-logs",
      success: false,
      failureReason: "clear-failed",
    })
    expect(buildOperatorMcpTestFailureAuditContext("test-failed")).toEqual({
      action: "mcp-test",
      success: false,
      failureReason: "test-failed",
    })
  })

  it("builds audit context from operator action responses", () => {
    expect(buildOperatorActionAuditContext({
      success: true,
      action: "restart-app",
      message: "Application restart scheduled",
      details: { scheduled: true },
    })).toEqual({
      action: "restart-app",
      success: true,
      details: { scheduled: true },
    })

    expect(buildOperatorActionAuditContext({
      success: false,
      action: "tunnel-start",
      message: "Failed to start Cloudflare tunnel",
      error: "cloudflared not found",
    })).toEqual({
      action: "tunnel-start",
      success: false,
      failureReason: "cloudflared not found",
    })
  })

  it("builds API key rotation responses and audit contexts without auditing the raw key", () => {
    expect(buildOperatorApiKeyRotationResponse("raw-api-key")).toEqual({
      success: true,
      action: "rotate-api-key",
      message: "Remote server API key rotated",
      scheduled: true,
      restartScheduled: true,
      apiKey: "raw-api-key",
    })

    expect(buildOperatorApiKeyRotationAuditContext()).toEqual({
      action: "rotate-api-key",
      success: true,
      details: {
        restartScheduled: true,
      },
    })

    expect(JSON.stringify(buildOperatorApiKeyRotationAuditContext())).not.toContain("raw-api-key")

    expect(buildOperatorApiKeyRotationFailureAuditContext()).toEqual({
      action: "rotate-api-key",
      success: false,
      failureReason: "rotate-api-key-route-error",
    })
  })

  it("rotates operator API keys through a shared config adapter", () => {
    let savedConfig = { remoteServerApiKey: "old-key", remoteServerPort: 3899 }
    const errors: string[] = []
    const options: OperatorApiKeyActionOptions<typeof savedConfig> = {
      config: {
        get: () => savedConfig,
        save: (config) => { savedConfig = config },
      },
      diagnostics: {
        logError: (_source, message) => { errors.push(message) },
      },
      generateApiKey: () => "new-key",
    }

    expect(rotateOperatorRemoteServerApiKeyAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "rotate-api-key",
        apiKey: "new-key",
        restartScheduled: true,
      },
      auditContext: {
        action: "rotate-api-key",
        success: true,
        details: { restartScheduled: true },
      },
      shouldRestartRemoteServer: true,
    })
    expect(savedConfig).toEqual({ remoteServerApiKey: "new-key", remoteServerPort: 3899 })
    expect(errors).toEqual([])

    const failingOptions: OperatorApiKeyActionOptions = {
      config: {
        get: () => ({ remoteServerApiKey: "old-key" }),
        save: () => { throw new Error("disk denied") },
      },
      diagnostics: {
        logError: (_source, message) => { errors.push(message) },
      },
      generateApiKey: () => "unused-key",
    }

    expect(rotateOperatorRemoteServerApiKeyAction(failingOptions)).toMatchObject({
      statusCode: 500,
      body: { error: "Failed to rotate remote server API key" },
      auditContext: {
        action: "rotate-api-key",
        success: false,
        failureReason: "rotate-api-key-route-error",
      },
      shouldRestartRemoteServer: false,
    })
    expect(errors).toContain("Failed to rotate remote server API key")
  })

  it("creates operator API key route actions through shared adapters", () => {
    let savedConfig = { remoteServerApiKey: "old-key", remoteServerPort: 3899 }
    const routeActions = createOperatorApiKeyRouteActions({
      config: {
        get: () => savedConfig,
        save: (config) => { savedConfig = config },
      },
      diagnostics: {
        logError: () => {},
      },
      generateApiKey: () => "route-key",
    })

    expect(routeActions.rotateOperatorRemoteServerApiKey()).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "rotate-api-key",
        apiKey: "route-key",
        restartScheduled: true,
      },
      auditContext: {
        action: "rotate-api-key",
        success: true,
        details: { restartScheduled: true },
      },
      shouldRestartRemoteServer: true,
    })
    expect(savedConfig).toEqual({ remoteServerApiKey: "route-key", remoteServerPort: 3899 })
  })

  it("clamps operator counts and normalizes log levels", () => {
    expect(clampOperatorCount(undefined, 20, 100)).toBe(20)
    expect(clampOperatorCount("12.8", 20, 100)).toBe(12)
    expect(clampOperatorCount(0, 20, 100)).toBe(1)
    expect(clampOperatorCount(150, 20, 100)).toBe(100)

    expect(normalizeOperatorLogLevel("warning")).toBe("warning")
    expect(normalizeOperatorLogLevel("debug")).toBeUndefined()
  })

  it("identifies sensitive operator settings keys", () => {
    expect(SENSITIVE_OPERATOR_SETTINGS_KEYS).toContain("remoteServerApiKey")
    expect(SENSITIVE_OPERATOR_SETTINGS_KEYS).toContain("discordBotToken")
    expect(isSensitiveOperatorSettingsKey("langfuseSecretKey")).toBe(true)
    expect(isSensitiveOperatorSettingsKey("theme")).toBe(false)
    expect(getSensitiveOperatorSettingsKeys({
      remoteServerApiKey: "masked",
      theme: "dark",
      whatsappEnabled: true,
    })).toEqual(["remoteServerApiKey", "whatsappEnabled"])
  })

  it("sanitizes operator audit text and details", () => {
    expect(sanitizeOperatorAuditText("  hello\n\nworld  ")).toBe("hello world")
    expect(sanitizeOperatorAuditText("x".repeat(5), 3)).toBe("xxx")
    expect(sanitizeOperatorAuditText("   ")).toBeUndefined()

    expect(sanitizeOperatorAuditDetails({
      prompt: "  run   diagnostics  ",
      apiKey: "raw-secret",
      nested: {
        ok: true,
        password: "hidden",
        deeper: { ignored: "too deep" },
      },
      items: Array.from({ length: 25 }, (_, index) => index),
    })).toEqual({
      prompt: "run diagnostics",
      nested: { ok: true },
      items: Array.from({ length: 20 }, (_, index) => index),
    })

    expect(sanitizeOperatorAuditDetails({ token: "raw-secret" })).toBeUndefined()
  })

  it("extracts sanitized operator audit request metadata", () => {
    const request = {
      url: "/v1/operator/status?verbose=true",
      ip: " 192.168.1.2\n",
      headers: {
        "x-dotagents-device-id": " device-1 ",
        origin: " https://mobile.example\n",
        "user-agent": " DotAgents Mobile ",
      },
    }

    expect(OPERATOR_AUDIT_DEVICE_HEADER_KEYS).toEqual(["x-device-id", "x-dotagents-device-id"])
    expect(getOperatorAuditPath(request)).toBe("/v1/operator/status")
    expect(getOperatorAuditDeviceId(request)).toBe("device-1")
    expect(getOperatorAuditSource(request)).toEqual({
      ip: "192.168.1.2",
      origin: "https://mobile.example",
      userAgent: "DotAgents Mobile",
    })
    expect(getOperatorAuditPath({ url: "" })).toBe("/")
    expect(getOperatorAuditDeviceId({ headers: {} })).toBeUndefined()
    expect(getOperatorAuditSource({ headers: {} })).toBeUndefined()
  })

  it("validates operator audit log entries", () => {
    const entry = {
      timestamp: 1,
      action: "settings-sensitive-update",
      path: "/v1/settings",
      success: true,
    }

    expect(isOperatorAuditEntry(entry)).toBe(true)

    expect(isOperatorAuditEntry({
      timestamp: "1",
      action: "settings-sensitive-update",
      path: "/v1/settings",
      success: true,
    })).toBe(false)

    expect(serializeOperatorAuditLogEntries([entry])).toBe(`${JSON.stringify(entry)}\n`)
    expect(serializeOperatorAuditLogEntries([])).toBe("")
    expect(parseOperatorAuditLogEntries([
      JSON.stringify({ timestamp: 0, action: "old", path: "/v1/operator/old", success: true }),
      "not-json",
      JSON.stringify(entry),
      "",
    ].join("\n"), 1)).toEqual([entry])
    expect(parseOperatorAuditLogEntries("  ")).toEqual([])

    expect(appendOperatorAuditLogEntry([{
      timestamp: 0,
      action: "old",
      path: "/v1/operator/old",
      success: true,
    }], entry, 1)).toEqual({
      entries: [entry],
      shouldRewrite: true,
    })
    expect(appendOperatorAuditLogEntry([], entry, 1)).toEqual({
      entries: [entry],
      shouldRewrite: false,
    })
  })

  it("identifies protected operator access paths and loopback IPs", () => {
    expect(isProtectedOperatorAccessPath("/v1/settings")).toBe(true)
    expect(isProtectedOperatorAccessPath("/v1/emergency-stop")).toBe(true)
    expect(isProtectedOperatorAccessPath("/v1/operator/status")).toBe(true)
    expect(isProtectedOperatorAccessPath("/v1/chat/completions")).toBe(false)

    expect(isLoopbackOperatorAccessIp("127.0.0.1")).toBe(true)
    expect(isLoopbackOperatorAccessIp("::1")).toBe(true)
    expect(isLoopbackOperatorAccessIp("::ffff:127.0.0.1")).toBe(true)
    expect(isLoopbackOperatorAccessIp("192.168.1.2")).toBe(false)
    expect(isLoopbackOperatorAccessIp(undefined)).toBe(false)
  })

  it("authorizes remote server bearer tokens and trusted operator devices", () => {
    expect(getRemoteServerBearerToken({ authorization: "Bearer api-key" })).toBe("api-key")
    expect(getRemoteServerBearerToken({ authorization: ["Bearer first", "Bearer second"] })).toBe("first")
    expect(getRemoteServerBearerToken({ authorization: "Basic api-key" })).toBe("")

    const baseRequest = {
      method: "GET",
      url: "/v1/operator/status",
      ip: "192.168.1.2",
      headers: {
        authorization: "Bearer api-key",
      },
    }

    expect(authorizeRemoteServerRequest({ ...baseRequest, method: "OPTIONS" }, {
      currentApiKey: undefined,
      trustedDeviceIds: ["device-1"],
    })).toEqual({ ok: true, skipAuth: true })

    expect(authorizeRemoteServerRequest(baseRequest, {
      currentApiKey: "other-key",
      trustedDeviceIds: ["device-1"],
    })).toEqual({
      ok: false,
      statusCode: 401,
      error: "Unauthorized",
    })

    expect(authorizeRemoteServerRequest(baseRequest, {
      currentApiKey: "api-key",
      trustedDeviceIds: [],
    })).toEqual({ ok: true })

    expect(authorizeRemoteServerRequest({
      ...baseRequest,
      url: "/v1/chat/completions",
    }, {
      currentApiKey: "api-key",
      trustedDeviceIds: ["device-1"],
    })).toEqual({ ok: true })

    expect(authorizeRemoteServerRequest({
      ...baseRequest,
      ip: "127.0.0.1",
    }, {
      currentApiKey: "api-key",
      trustedDeviceIds: ["device-1"],
    })).toEqual({ ok: true })

    expect(authorizeRemoteServerRequest(baseRequest, {
      currentApiKey: "api-key",
      trustedDeviceIds: ["device-1"],
    })).toEqual({
      ok: false,
      statusCode: 403,
      error: "Trusted device ID required for operator access",
      auditFailureReason: "Missing trusted device ID",
    })

    expect(authorizeRemoteServerRequest({
      ...baseRequest,
      headers: {
        ...baseRequest.headers,
        "x-dotagents-device-id": "device-2",
      },
    }, {
      currentApiKey: "api-key",
      trustedDeviceIds: ["device-1"],
    })).toEqual({
      ok: false,
      statusCode: 403,
      error: "Device not allowed for operator access",
      auditFailureReason: "Device is not allowed for operator access",
    })

    expect(authorizeRemoteServerRequest({
      ...baseRequest,
      headers: {
        ...baseRequest.headers,
        "x-dotagents-device-id": "device-1",
      },
    }, {
      currentApiKey: "api-key",
      trustedDeviceIds: [" device-1 "],
    })).toEqual({ ok: true })
  })

  it("builds rejected device audit entries", () => {
    expect(buildRejectedOperatorDeviceAuditEntry({
      timestamp: 10,
      path: "/v1/operator/status",
      deviceId: " device-1 ",
      source: { ip: "192.168.1.2" },
      failureReason: "x".repeat(140),
    })).toEqual({
      timestamp: 10,
      action: "device-access-denied",
      path: "/v1/operator/status",
      success: false,
      deviceId: "device-1",
      source: { ip: "192.168.1.2" },
      failureReason: "x".repeat(120),
    })
  })

  it("builds sanitized operator audit event entries", () => {
    expect(buildOperatorAuditEventEntry({
      timestamp: 10,
      action: "settings-sensitive-update",
      path: "/v1/settings",
      success: false,
      deviceId: " device-1 ",
      source: { ip: "192.168.1.2" },
      details: {
        prompt: " run diagnostics ",
        apiKey: "secret",
      },
      failureReason: "x".repeat(140),
    })).toEqual({
      timestamp: 10,
      action: "settings-sensitive-update",
      path: "/v1/settings",
      success: false,
      deviceId: "device-1",
      source: { ip: "192.168.1.2" },
      details: { prompt: "run diagnostics" },
      failureReason: "x".repeat(120),
    })
  })

  it("builds health, recent error, and log responses", () => {
    const entries = [
      { timestamp: 1, level: "info" as const, component: "remote", message: "Started" },
      { timestamp: 2, level: "error" as const, component: "mcp", message: "Failed" },
    ]

    expect(buildOperatorHealthSnapshot({
      overall: "warning",
      checks: { mcp: { status: "warning", message: "Needs attention" } },
    }, 123)).toEqual({
      checkedAt: 123,
      overall: "warning",
      checks: { mcp: { status: "warning", message: "Needs attention" } },
    })

    expect(buildOperatorRecentErrorsResponse(entries)).toEqual({
      count: 2,
      errors: entries,
    })
    expect(buildOperatorRecentErrorSummary(entries, 3, 1)).toEqual({
      total: 2,
      errorsInLastFiveMinutes: 1,
    })
    expect(buildOperatorLogsResponse(entries, "error")).toEqual({
      count: 1,
      level: "error",
      logs: [entries[1]],
    })
  })

  it("builds remote server and tunnel statuses without empty optional fields", () => {
    expect(buildOperatorRemoteServerStatus({
      running: true,
      bind: "0.0.0.0",
      port: 3210,
      url: "http://0.0.0.0:3210",
      connectableUrl: "http://192.168.1.2:3210",
      lastError: "",
    })).toEqual({
      running: true,
      bind: "0.0.0.0",
      port: 3210,
      url: "http://0.0.0.0:3210",
      connectableUrl: "http://192.168.1.2:3210",
    })

    expect(buildOperatorTunnelStatus({
      running: false,
      starting: true,
      mode: null,
      url: null,
      error: "Not installed",
    })).toEqual({
      running: false,
      starting: true,
      mode: null,
      error: "Not installed",
    })
  })

  it("builds tunnel setup summaries from desktop environment state", () => {
    expect(buildOperatorTunnelSetupSummary({
      config: {
        cloudflareTunnelMode: "named",
        cloudflareTunnelAutoStart: true,
        cloudflareTunnelId: "tunnel-1",
        cloudflareTunnelHostname: "agent.example.com",
        cloudflareTunnelCredentialsPath: "/tmp/creds.json",
      },
      installed: true,
      loggedIn: true,
      listResult: {
        success: true,
        tunnels: [
          { id: "tunnel-1", name: "agent", created_at: "2026-01-01T00:00:00Z" },
        ],
      },
    })).toEqual({
      installed: true,
      loggedIn: true,
      mode: "named",
      autoStart: true,
      namedTunnelConfigured: true,
      configuredTunnelId: "tunnel-1",
      configuredHostname: "agent.example.com",
      credentialsPathConfigured: true,
      tunnelCount: 1,
      tunnels: [{ id: "tunnel-1", name: "agent", createdAt: "2026-01-01T00:00:00Z" }],
    })

    expect(buildOperatorTunnelSetupSummary({
      config: {},
      installed: true,
      loggedIn: true,
      listResult: { success: false, error: "not authenticated" },
    })).toMatchObject({
      mode: "quick",
      autoStart: false,
      namedTunnelConfigured: false,
      tunnelCount: 0,
      tunnels: [],
      error: "not authenticated",
    })

    expect(getConfiguredCloudflareTunnelStartPlan({})).toEqual({
      ok: true,
      mode: "quick",
    })
    expect(getConfiguredCloudflareTunnelStartPlan({
      cloudflareTunnelMode: "named",
      cloudflareTunnelId: " tunnel-1 ",
      cloudflareTunnelHostname: " agent.example.com ",
      cloudflareTunnelCredentialsPath: " /tmp/creds.json ",
    })).toEqual({
      ok: true,
      mode: "named",
      tunnelId: "tunnel-1",
      hostname: "agent.example.com",
      credentialsPath: "/tmp/creds.json",
    })
    expect(getConfiguredCloudflareTunnelStartPlan({
      cloudflareTunnelMode: "named",
      cloudflareTunnelId: "tunnel-1",
      cloudflareTunnelHostname: " ",
    })).toEqual({
      ok: false,
      mode: "named",
      error: "Named tunnel requires cloudflareTunnelId and cloudflareTunnelHostname",
    })
  })

  it("runs tunnel route actions through a shared service adapter", async () => {
    const calls: string[] = []
    const options: OperatorTunnelActionOptions = {
      config: {
        get: () => ({
          cloudflareTunnelMode: "named",
          cloudflareTunnelId: " tunnel-1 ",
          cloudflareTunnelHostname: " agent.example.com ",
          cloudflareTunnelCredentialsPath: " /tmp/creds.json ",
        }),
      },
      diagnostics: {
        logError: (_source, message) => { calls.push(`error:${message}`) },
      },
      service: {
        getStatus: () => ({
          running: true,
          starting: false,
          mode: "named",
          url: "https://agent.example.com",
        }),
        checkCloudflaredInstalled: async () => {
          calls.push("installed")
          return true
        },
        checkCloudflaredLoggedIn: async () => {
          calls.push("logged-in")
          return true
        },
        listCloudflareTunnels: async () => {
          calls.push("list")
          return {
            success: true,
            tunnels: [{ id: "tunnel-1", name: "agent", created_at: "2026-01-01T00:00:00Z" }],
          }
        },
        startQuickTunnel: async () => {
          calls.push("quick")
          return { success: true, url: "https://quick.example.com" }
        },
        startNamedTunnel: async (startOptions) => {
          calls.push(`named:${startOptions.tunnelId}:${startOptions.hostname}:${startOptions.credentialsPath}`)
          return { success: true, url: "https://agent.example.com" }
        },
        stopTunnel: async () => {
          calls.push("stop")
        },
      },
    }

    expect(getOperatorTunnelAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        running: true,
        mode: "named",
        url: "https://agent.example.com",
      },
    })
    expect(await getOperatorTunnelSetupAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        installed: true,
        loggedIn: true,
        namedTunnelConfigured: true,
        configuredTunnelId: " tunnel-1 ",
        tunnelCount: 1,
      },
    })
    expect(await startOperatorTunnelAction(false, options)).toMatchObject({
      statusCode: 200,
      body: {
        success: false,
        action: "tunnel-start",
        error: "Remote server is not running",
      },
      auditContext: {
        action: "tunnel-start",
        success: false,
        failureReason: "remote-server-not-running",
      },
    })
    expect(await startOperatorTunnelAction(true, options)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "tunnel-start",
        details: {
          mode: "named",
          url: "https://agent.example.com",
        },
      },
      auditContext: {
        action: "tunnel-start",
        success: true,
        details: {
          mode: "named",
          url: "https://agent.example.com",
        },
      },
    })
    expect(await stopOperatorTunnelAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "tunnel-stop",
      },
      auditContext: {
        action: "tunnel-stop",
        success: true,
      },
    })
    expect(calls).toEqual([
      "installed",
      "logged-in",
      "list",
      "named:tunnel-1:agent.example.com:/tmp/creds.json",
      "stop",
    ])

    const routeActions = createOperatorTunnelRouteActions(options)
    expect(routeActions.getOperatorTunnel()).toMatchObject({
      statusCode: 200,
      body: {
        running: true,
        mode: "named",
      },
    })
    expect(await routeActions.getOperatorTunnelSetup()).toMatchObject({
      statusCode: 200,
      body: {
        installed: true,
        loggedIn: true,
      },
    })
    expect(await routeActions.startOperatorTunnel(false)).toMatchObject({
      statusCode: 200,
      body: {
        success: false,
        action: "tunnel-start",
      },
    })
    expect(await routeActions.startOperatorTunnel(true)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "tunnel-start",
      },
    })
    expect(await routeActions.stopOperatorTunnel()).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "tunnel-stop",
      },
    })

    const failingOptions: OperatorTunnelActionOptions = {
      ...options,
      service: {
        ...options.service,
        stopTunnel: async () => { throw new Error("stop denied") },
      },
    }
    expect(await stopOperatorTunnelAction(failingOptions)).toMatchObject({
      statusCode: 500,
      body: { error: "Failed to stop tunnel" },
      auditContext: {
        action: "tunnel-stop",
        success: false,
        failureReason: "tunnel-stop-route-error",
      },
    })
    expect(calls).toContain("error:Failed to stop tunnel from operator route")
  })

  it("builds audit, conversation, and Discord log responses", () => {
    const auditEntries = Array.from({ length: 3 }, (_, index) => ({
      timestamp: index + 1,
      action: `action-${index + 1}`,
      path: "/v1/operator/test",
      success: true,
    }))
    expect(buildOperatorAuditResponse(auditEntries, 2)).toEqual({
      count: 2,
      entries: [auditEntries[2], auditEntries[1]],
    })

    const longPreview = "x".repeat(205)
    expect(buildOperatorConversationsResponse([{
      id: "conv-1",
      title: "Conversation",
      createdAt: 1,
      updatedAt: 2,
      messageCount: 3,
      preview: longPreview,
    }], 10)).toEqual({
      count: 1,
      conversations: [{
        id: "conv-1",
        title: "Conversation",
        createdAt: 1,
        updatedAt: 2,
        messageCount: 3,
        preview: `${"x".repeat(200)}\u2026`,
      }],
    })

    const discordLogs = [
      { id: "log-1", level: "info", message: "one", timestamp: 1 },
      { id: "log-2", level: "error", message: "two", timestamp: 2 },
    ]
    expect(buildOperatorDiscordLogsResponse(discordLogs, 1)).toEqual({
      count: 1,
      logs: [discordLogs[1]],
    })
  })

  it("builds Discord integration summaries from service status and logs", () => {
    expect(buildOperatorDiscordIntegrationSummary({
      available: true,
      enabled: true,
      connected: false,
      connecting: true,
      tokenConfigured: true,
      defaultProfileId: "profile-1",
      defaultProfileName: "Operator",
      botUsername: "bot",
      lastError: "connecting",
      lastEventAt: 5,
    }, [
      { timestamp: 1, level: "info" },
      { timestamp: 2, level: "warn" },
    ])).toEqual({
      available: true,
      enabled: true,
      connected: false,
      connecting: true,
      tokenConfigured: true,
      defaultProfileId: "profile-1",
      defaultProfileName: "Operator",
      botUsername: "bot",
      lastError: "connecting",
      lastEventAt: 5,
      logs: {
        total: 2,
        lastTimestamp: 2,
        errorCount: 0,
        warningCount: 1,
        infoCount: 1,
      },
    })
  })

  it("builds Discord, tunnel, and restart action responses", () => {
    expect(buildOperatorDiscordConnectActionResponse({ success: true }, { connected: false })).toEqual({
      success: true,
      action: "discord-connect",
      message: "Discord connection started",
      details: {
        connected: false,
      },
    })

    expect(buildOperatorDiscordConnectActionResponse({ success: false, error: "token missing" }, { connected: false })).toEqual({
      success: false,
      action: "discord-connect",
      message: "token missing",
      error: "token missing",
    })

    expect(buildOperatorDiscordDisconnectActionResponse({ success: true })).toEqual({
      success: true,
      action: "discord-disconnect",
      message: "Discord integration stopped",
    })

    expect(buildOperatorDiscordDisconnectActionResponse({ success: false })).toEqual({
      success: false,
      action: "discord-disconnect",
      message: "Failed to stop Discord integration",
      error: "Failed to stop Discord integration",
    })

    expect(buildOperatorDiscordClearLogsActionResponse()).toEqual({
      success: true,
      action: "discord-clear-logs",
      message: "Discord logs cleared",
    })

    expect(buildOperatorTunnelStartRemoteServerRequiredResponse()).toEqual({
      success: false,
      action: "tunnel-start",
      message: "Remote server must be running before a tunnel can be started",
      error: "Remote server is not running",
    })

    expect(buildOperatorTunnelStartActionResponse({
      success: true,
      mode: "quick",
      url: "https://quick.example.com",
    })).toEqual({
      success: true,
      action: "tunnel-start",
      message: "Cloudflare quick tunnel started",
      details: {
        mode: "quick",
        url: "https://quick.example.com",
      },
    })

    expect(buildOperatorTunnelStartActionResponse({
      success: false,
      mode: "named",
      error: "credentials missing",
    })).toEqual({
      success: false,
      action: "tunnel-start",
      message: "credentials missing",
      error: "credentials missing",
      details: {
        mode: "named",
      },
    })

    expect(buildOperatorTunnelStopActionResponse()).toEqual({
      success: true,
      action: "tunnel-stop",
      message: "Cloudflare tunnel stopped",
    })

    expect(buildOperatorRestartRemoteServerActionResponse(true)).toEqual({
      success: true,
      action: "restart-remote-server",
      message: "Remote server restart scheduled",
      scheduled: true,
      details: {
        wasRunning: true,
      },
    })

    expect(buildOperatorRestartAppActionResponse("1.2.3")).toEqual({
      success: true,
      action: "restart-app",
      message: "Application restart scheduled",
      scheduled: true,
      details: {
        currentVersion: "1.2.3",
      },
    })

    expect(restartOperatorRemoteServerAction(false)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "restart-remote-server",
        details: { wasRunning: false },
      },
      auditContext: {
        action: "restart-remote-server",
        success: true,
        details: { wasRunning: false },
      },
      shouldRestartRemoteServer: true,
    })
    expect(restartOperatorAppAction("1.2.3")).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "restart-app",
        details: { currentVersion: "1.2.3" },
      },
      auditContext: {
        action: "restart-app",
        success: true,
        details: { currentVersion: "1.2.3" },
      },
      shouldRestartApp: true,
    })

    const routeActions = createOperatorRestartRouteActions()
    expect(routeActions.restartOperatorRemoteServer(false)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "restart-remote-server",
        details: { wasRunning: false },
      },
      shouldRestartRemoteServer: true,
    })
    expect(routeActions.restartOperatorApp("1.2.3")).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "restart-app",
        details: { currentVersion: "1.2.3" },
      },
      shouldRestartApp: true,
    })
  })

  it("builds push notification integration summaries", () => {
    expect(buildOperatorPushNotificationsSummary([
      { platform: "ios" },
      { platform: "android" },
      { platform: "ios" },
    ])).toEqual({
      enabled: true,
      tokenCount: 3,
      platforms: ["android", "ios"],
    })

    expect(buildOperatorPushNotificationsSummary([])).toEqual({
      enabled: false,
      tokenCount: 0,
      platforms: [],
    })
  })

  it("builds operator audit route action responses from injected storage", () => {
    const auditEntries = Array.from({ length: 2 }, (_, index) => ({
      timestamp: index + 1,
      action: `action-${index + 1}`,
      path: "/v1/operator/test",
      success: true,
    }))
    const errors: string[] = []
    const options: OperatorAuditActionOptions = {
      getEntries: () => auditEntries,
      diagnostics: {
        logError: (source, message, error) => {
          errors.push(`${source}:${message}:${error instanceof Error ? error.message : String(error)}`)
        },
      },
    }

    expect(getOperatorAuditAction(1, options)).toEqual({
      statusCode: 200,
      body: {
        count: 1,
        entries: [auditEntries[1]],
      },
    })
    expect(createOperatorAuditRouteActions(options).getOperatorAudit(1)).toEqual({
      statusCode: 200,
      body: {
        count: 1,
        entries: [auditEntries[1]],
      },
    })

    expect(getOperatorAuditAction(1, {
      ...options,
      getEntries: () => {
        throw new Error("storage unavailable")
      },
    })).toEqual({
      statusCode: 500,
      body: { error: "Failed to build operator audit response" },
    })
    expect(errors).toEqual([
      "operator-audit-actions:Failed to build operator audit response:storage unavailable",
    ])
  })

  it("builds audit action names from operator paths", () => {
    expect(buildOperatorAuditActionFromPath("/v1/operator/actions/restart-app")).toBe("actions-restart-app")
    expect(buildOperatorAuditActionFromPath("/v1/operator/runtime")).toBe("runtime")
    expect(buildOperatorAuditActionFromPath("/v1/operator")).toBe("operator-action")
    expect(buildOperatorAuditActionFromPath("/v1/operator/")).toBe("operator-action")
  })

  it("builds response audit contexts for mutating operator routes", () => {
    expect(buildOperatorResponseAuditContext(
      { method: "GET", url: "/v1/operator/status" },
      { statusCode: 200 },
    )).toBeUndefined()

    expect(buildOperatorResponseAuditContext(
      { method: "POST", url: "/v1/settings" },
      { statusCode: 200 },
    )).toBeUndefined()

    expect(buildOperatorResponseAuditContext(
      { method: "POST", url: "/v1/operator/actions/restart-app?x=1" },
      { statusCode: 202 },
    )).toEqual({
      action: "actions-restart-app",
      path: "/v1/operator/actions/restart-app",
      success: true,
      failureReason: undefined,
    })

    expect(buildOperatorResponseAuditContext(
      { method: "POST", url: "/v1/operator/actions/restart-app" },
      { statusCode: 500 },
      {
        action: "restart-app",
        success: false,
        details: { scheduled: false },
        failureReason: "restart-failed",
      },
    )).toEqual({
      action: "restart-app",
      path: "/v1/operator/actions/restart-app",
      success: false,
      details: { scheduled: false },
      failureReason: "restart-failed",
    })

    expect(buildOperatorResponseAuditContext(
      { method: "POST", url: "/v1/operator/actions/restart-app" },
      { statusCode: 500 },
    )).toEqual(expect.objectContaining({
      success: false,
      failureReason: "http-500",
    }))
  })

  it("records operator audit entries from request-like metadata", () => {
    const entries: Array<ReturnType<typeof buildOperatorAuditEventEntry>> = []
    const recorder = createOperatorAuditRecorder({
      appendEntry: (entry) => entries.push(entry),
    })
    const request = {
      method: "POST",
      url: "/v1/operator/actions/restart-app?x=1",
      ip: " 10.0.0.5 ",
      headers: {
        "x-device-id": " device-1 ",
        "user-agent": " DotAgents Mobile ",
      },
    }

    recorder.recordAuditEvent(request, {
      action: "manual-operator-event",
      success: true,
      details: { count: 2, token: "hidden" },
    })
    recorder.recordRejectedDeviceAttempt(request, " Missing allow-list entry ")
    recorder.recordResponseAuditEvent(request, { statusCode: 500 }, { details: { scheduled: false } })
    recorder.recordResponseAuditEvent({ ...request, method: "GET" }, { statusCode: 200 })

    expect(entries).toHaveLength(3)
    expect(entries[0]).toMatchObject({
      action: "manual-operator-event",
      path: "/v1/operator/actions/restart-app",
      success: true,
      deviceId: "device-1",
      source: {
        ip: "10.0.0.5",
        userAgent: "DotAgents Mobile",
      },
      details: { count: 2 },
    })
    expect(entries[1]).toMatchObject({
      action: "device-access-denied",
      path: "/v1/operator/actions/restart-app",
      success: false,
      deviceId: "device-1",
      failureReason: "Missing allow-list entry",
    })
    expect(entries[2]).toMatchObject({
      action: "actions-restart-app",
      path: "/v1/operator/actions/restart-app",
      success: false,
      failureReason: "http-500",
      details: { scheduled: false },
    })
  })

  it("parses operator JSON records defensively", () => {
    expect(parseOperatorJsonRecord('{"status":"connected"}')).toEqual({ status: "connected" })
    expect(parseOperatorJsonRecord("[1,2]")).toBeUndefined()
    expect(parseOperatorJsonRecord("not json")).toBeUndefined()
    expect(parseOperatorJsonRecord(undefined)).toBeUndefined()
  })

  it("builds sanitized WhatsApp action success responses", () => {
    const parsed = {
      status: "connected",
      connected: true,
      hasCredentials: false,
      lastError: "old error",
      token: "raw-secret",
    }

    expect(getSanitizedWhatsAppOperatorDetails(parsed)).toEqual({
      status: "connected",
      connected: true,
      hasCredentials: false,
      lastError: "old error",
    })

    expect(getOperatorMcpToolResultText({
      content: [
        { type: "image", text: "ignore" },
        { type: "text", text: "Connected" },
      ],
    })).toBe("Connected")
    expect(getOperatorMcpToolResultText({ content: [{ type: "text", text: 42 }] })).toBeUndefined()
    expect(getOperatorMcpToolResultText({})).toBeUndefined()

    expect(buildOperatorWhatsAppActionSuccessResponse({
      action: "whatsapp-connect",
      text: JSON.stringify(parsed),
      successMessage: "started",
    })).toEqual({
      success: true,
      action: "whatsapp-connect",
      message: "WhatsApp connected",
      details: {
        status: "connected",
        connected: true,
        hasCredentials: false,
        lastError: "old error",
      },
    })

    expect(buildOperatorWhatsAppActionSuccessResponse({
      action: "whatsapp-connect",
      text: "Connected",
      successMessage: "started",
    })).toEqual({
      success: true,
      action: "whatsapp-connect",
      message: "Connected",
    })

    expect(buildOperatorWhatsAppServerUnavailableActionResponse("whatsapp-connect")).toEqual({
      success: false,
      action: "whatsapp-connect",
      message: "WhatsApp server is not running. Enable WhatsApp in settings first.",
      error: "WhatsApp server is not running",
    })

    expect(buildOperatorWhatsAppActionErrorResponse("whatsapp-logout", "logout failed")).toEqual({
      success: false,
      action: "whatsapp-logout",
      message: "logout failed",
      error: "logout failed",
    })
  })

  it("merges WhatsApp status payloads into integration summaries", () => {
    const summary = buildOperatorWhatsAppIntegrationSummary({
      enabled: true,
      serverConfigured: true,
      serverConnected: true,
      autoReplyEnabled: false,
      logMessagesEnabled: true,
      allowedSenderCount: 2,
      logs: [{ timestamp: 1, level: "info" }],
    })

    expect(summary).toEqual({
      enabled: true,
      available: true,
      connected: false,
      serverConfigured: true,
      serverConnected: true,
      autoReplyEnabled: false,
      logMessagesEnabled: true,
      allowedSenderCount: 2,
      logs: {
        total: 1,
        lastTimestamp: 1,
        errorCount: 0,
        warningCount: 0,
        infoCount: 1,
      },
    })

    expect(mergeOperatorWhatsAppStatusPayload(summary, JSON.stringify({
      connected: true,
      hasCredentials: true,
      lastError: "stale session",
      token: "raw-secret",
    }))).toEqual({
      ...summary,
      connected: true,
      hasCredentials: true,
      lastError: "stale session",
    })

    expect(mergeOperatorWhatsAppStatusPayload(summary, "not json")).toBe(summary)
  })

  it("builds WhatsApp integration summaries through a shared service adapter", async () => {
    const warnings: string[] = []
    let connected = false
    let statusToolResult = {
      isError: false,
      content: [{ type: "text", text: JSON.stringify({ connected: true, hasCredentials: true }) }],
    }
    let shouldThrow = false
    const options = {
      serverName: "whatsapp",
      diagnostics: {
        logWarning: (_source: string, message: string) => { warnings.push(message) },
        getErrorMessage: (error: unknown) => error instanceof Error ? error.message : String(error),
      },
      service: {
        getConfig: () => ({
          whatsappEnabled: true,
          whatsappAutoReply: true,
          whatsappLogMessages: true,
          whatsappAllowFrom: ["+15550001", "+15550002"],
          mcpConfig: { mcpServers: { whatsapp: {} } },
        }),
        getServerStatus: () => ({
          whatsapp: {
            connected,
            error: connected ? undefined : "server down",
          },
        }),
        getServerLogs: () => [
          { timestamp: 1, level: "info" },
          { timestamp: 2, level: "error" },
        ],
        executeStatusTool: async () => {
          if (shouldThrow) throw new Error("status failed")
          return statusToolResult
        },
      },
    }

    expect(await getOperatorWhatsAppIntegrationSummaryAction(options)).toMatchObject({
      enabled: true,
      available: false,
      connected: false,
      serverConfigured: true,
      serverConnected: false,
      autoReplyEnabled: true,
      logMessagesEnabled: true,
      allowedSenderCount: 2,
      lastError: "server down",
      logs: {
        total: 2,
        errorCount: 1,
      },
    })

    connected = true
    expect(await getOperatorWhatsAppIntegrationSummaryAction(options)).toMatchObject({
      available: true,
      connected: true,
      hasCredentials: true,
    })

    statusToolResult = {
      isError: true,
      content: [{ type: "text", text: "status unavailable" }],
    }
    expect(await getOperatorWhatsAppIntegrationSummaryAction(options)).toMatchObject({
      available: true,
      connected: false,
      lastError: "status unavailable",
    })

    shouldThrow = true
    expect(await getOperatorWhatsAppIntegrationSummaryAction(options)).toMatchObject({
      available: true,
      connected: false,
      lastError: "status failed",
    })
    expect(warnings).toEqual([
      "Failed to summarize WhatsApp integration status: status failed",
    ])
  })

  it("builds full integration summaries through a shared service adapter", async () => {
    const whatsappSummary = buildOperatorWhatsAppIntegrationSummary({
      enabled: true,
      serverConfigured: true,
      serverConnected: true,
      autoReplyEnabled: false,
      logMessagesEnabled: true,
      allowedSenderCount: 1,
      logs: [],
    })

    await expect(buildOperatorIntegrationsSummaryAction({
      service: {
        getDiscordStatus: () => ({
          available: true,
          enabled: true,
          connected: true,
          connecting: false,
          tokenConfigured: true,
        }),
        getDiscordLogs: () => [
          { timestamp: 1, level: "info" },
          { timestamp: 2, level: "error" },
        ],
        getWhatsAppSummary: async () => whatsappSummary,
        getPushNotificationTokens: () => [
          { platform: "ios" },
          { platform: "android" },
          { platform: "ios" },
        ],
      },
    })).resolves.toEqual({
      discord: expect.objectContaining({
        available: true,
        connected: true,
        logs: expect.objectContaining({
          total: 2,
          errorCount: 1,
        }),
      }),
      whatsapp: whatsappSummary,
      pushNotifications: {
        enabled: true,
        tokenCount: 3,
        platforms: ["android", "ios"],
      },
    })
  })

  it("runs integration route actions through a shared service adapter", async () => {
    const calls: string[] = []
    const discordLogs = [
      { id: "log-1", level: "info", message: "one", timestamp: 1 },
      { id: "log-2", level: "error", message: "two", timestamp: 2 },
    ]
    const whatsappSummary = {
      enabled: true,
      available: true,
      connected: false,
      serverConfigured: true,
      serverConnected: true,
      autoReplyEnabled: false,
      logMessagesEnabled: true,
      allowedSenderCount: 1,
      logs: { total: 0 },
    }
    const integrationsSummary = {
      discord: {
        available: true,
        enabled: true,
        connected: false,
        connecting: false,
        logs: { total: 0 },
      },
      whatsapp: whatsappSummary,
      pushNotifications: {
        enabled: false,
        tokenCount: 0,
        platforms: [],
      },
    }
    let discordConnected = false
    let whatsappConnected = false
    let whatsappToolResult = {
      isError: false,
      content: [{ type: "text", text: JSON.stringify({ status: "connected", connected: true }) }],
    }
    const options: OperatorIntegrationActionOptions = {
      diagnostics: {
        logError: (_source, message) => { calls.push(`error:${message}`) },
        getErrorMessage: (error) => error instanceof Error ? error.message : String(error),
      },
      service: {
        getIntegrationsSummary: async () => integrationsSummary,
        getDiscordStatus: () => ({
          available: true,
          enabled: true,
          connected: discordConnected,
          connecting: false,
          tokenConfigured: true,
        }),
        getDiscordLogs: () => discordLogs,
        startDiscord: async () => {
          calls.push("discord:start")
          discordConnected = true
          return { success: true }
        },
        stopDiscord: async () => {
          calls.push("discord:stop")
          discordConnected = false
          return { success: true }
        },
        clearDiscordLogs: () => { calls.push("discord:clear") },
        getWhatsAppSummary: async () => whatsappSummary,
        isWhatsAppServerConnected: () => whatsappConnected,
        executeWhatsAppTool: async (toolName) => {
          calls.push(`whatsapp:${toolName}`)
          return whatsappToolResult
        },
      },
    }

    expect(await getOperatorIntegrationsAction(options)).toEqual({
      statusCode: 200,
      body: integrationsSummary,
    })
    expect(getOperatorDiscordAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        available: true,
        enabled: true,
        connected: false,
        logs: { total: 2 },
      },
    })
    expect(getOperatorDiscordLogsAction(1, options)).toEqual({
      statusCode: 200,
      body: {
        count: 1,
        logs: [discordLogs[1]],
      },
    })
    expect(await connectOperatorDiscordAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "discord-connect",
        details: { connected: true },
      },
      auditContext: {
        action: "discord-connect",
        success: true,
      },
    })
    expect(await disconnectOperatorDiscordAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "discord-disconnect",
      },
      auditContext: {
        action: "discord-disconnect",
        success: true,
      },
    })
    expect(clearOperatorDiscordLogsAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "discord-clear-logs",
      },
      auditContext: {
        action: "discord-clear-logs",
        success: true,
      },
    })
    expect(await getOperatorWhatsAppAction(options)).toEqual({
      statusCode: 200,
      body: whatsappSummary,
    })
    expect(await connectOperatorWhatsAppAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        success: false,
        action: "whatsapp-connect",
        error: "WhatsApp server is not running",
      },
      auditContext: {
        action: "whatsapp-connect",
        success: false,
        failureReason: "WhatsApp server is not running",
      },
    })

    whatsappConnected = true
    expect(await connectOperatorWhatsAppAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "whatsapp-connect",
        message: "WhatsApp connected",
        details: {
          status: "connected",
          connected: true,
        },
      },
      auditContext: {
        action: "whatsapp-connect",
        success: true,
      },
    })

    whatsappToolResult = {
      isError: true,
      content: [{ type: "text", text: "logout failed" }],
    }
    expect(await logoutOperatorWhatsAppAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        success: false,
        action: "whatsapp-logout",
        error: "logout failed",
      },
      auditContext: {
        action: "whatsapp-logout",
        success: false,
        failureReason: "logout failed",
      },
    })

    const routeActions = createOperatorIntegrationRouteActions(options)
    expect(await routeActions.getOperatorIntegrations()).toEqual({
      statusCode: 200,
      body: integrationsSummary,
    })
    expect(routeActions.getOperatorDiscord()).toMatchObject({
      statusCode: 200,
      body: {
        available: true,
        enabled: true,
      },
    })
    expect(routeActions.getOperatorDiscordLogs(1)).toMatchObject({
      statusCode: 200,
      body: {
        count: 1,
      },
    })
    expect(await routeActions.connectOperatorDiscord()).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "discord-connect",
      },
    })
    expect(await routeActions.disconnectOperatorDiscord()).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "discord-disconnect",
      },
    })
    expect(routeActions.clearOperatorDiscordLogs()).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "discord-clear-logs",
      },
    })
    expect(await routeActions.getOperatorWhatsApp()).toEqual({
      statusCode: 200,
      body: whatsappSummary,
    })
    whatsappToolResult = {
      isError: false,
      content: [{ type: "text", text: JSON.stringify({ status: "connected", connected: true }) }],
    }
    expect(await routeActions.connectOperatorWhatsApp()).toMatchObject({
      statusCode: 200,
      body: {
        action: "whatsapp-connect",
      },
    })
    expect(await routeActions.logoutOperatorWhatsApp()).toMatchObject({
      statusCode: 200,
      body: {
        action: "whatsapp-logout",
      },
    })
    expect(calls).toEqual(expect.arrayContaining([
      "discord:start",
      "discord:stop",
      "discord:clear",
      "whatsapp:whatsapp_connect",
      "whatsapp:whatsapp_logout",
    ]))

    const failingOptions: OperatorIntegrationActionOptions = {
      ...options,
      service: {
        ...options.service,
        getIntegrationsSummary: async () => { throw new Error("summary denied") },
      },
    }
    expect(await getOperatorIntegrationsAction(failingOptions)).toEqual({
      statusCode: 500,
      body: { error: "Failed to build operator integrations summary" },
    })
    expect(calls).toContain("error:Failed to build operator integrations summary")
  })

  it("builds compact operator log summaries", () => {
    expect(buildOperatorLogSummary([
      { timestamp: 1, level: "info" },
      { timestamp: 2, level: "warn" },
      { timestamp: 3, level: "warning" },
      { timestamp: 4, level: "error" },
      { timestamp: 5, level: "debug" },
    ])).toEqual({
      total: 5,
      lastTimestamp: 5,
      errorCount: 1,
      warningCount: 2,
      infoCount: 1,
    })

    expect(buildOperatorLogSummary([])).toEqual({ total: 0 })
  })

  it("builds updater status summaries from plain update info", () => {
    const updateInfo = {
      updateAvailable: true,
      latestRelease: {
        tagName: "v1.2.3",
        name: "Release",
        publishedAt: "2026-01-01T00:00:00Z",
        url: "https://example.com/releases/v1.2.3",
        assets: [{ name: "app.zip" }, { name: "notes.txt" }],
      },
      preferredAsset: {
        name: "app.zip",
        downloadUrl: "https://example.com/app.zip",
      },
      lastCheckedAt: 10,
      error: "download failed",
      lastDownloadedAsset: {
        name: "old.zip",
        downloadedAt: 20,
      },
    }

    expect(buildOperatorUpdaterStatus({
      currentVersion: "1.0.0",
      manualReleasesUrl: "https://example.com/releases",
      updateInfo,
    })).toEqual({
      enabled: false,
      mode: "manual",
      currentVersion: "1.0.0",
      updateInfo,
      manualReleasesUrl: "https://example.com/releases",
      updateAvailable: true,
      lastCheckedAt: 10,
      lastCheckError: "download failed",
      latestRelease: {
        tagName: "v1.2.3",
        name: "Release",
        publishedAt: "2026-01-01T00:00:00Z",
        url: "https://example.com/releases/v1.2.3",
        assetCount: 2,
      },
      preferredAsset: {
        name: "app.zip",
        downloadUrl: "https://example.com/app.zip",
      },
      lastDownloadedAt: 20,
      lastDownloadedFileName: "old.zip",
    })

    expect(buildOperatorUpdaterStatus({ updateInfo: null })).toMatchObject({
      enabled: false,
      mode: "manual",
      updateInfo: null,
    })
  })

  it("builds updater action responses from plain update results", () => {
    expect(buildOperatorUpdaterCheckActionResponse({
      currentVersion: "1.0.0",
      updateAvailable: true,
      latestRelease: {
        tagName: "v1.2.3",
        url: "https://example.com/releases/v1.2.3",
      },
      lastCheckedAt: 10,
    }, "https://example.com/releases")).toEqual({
      success: true,
      action: "updater-check",
      message: "Update available: v1.2.3",
      details: {
        currentVersion: "1.0.0",
        checkedAt: 10,
        updateAvailable: true,
        latestReleaseTag: "v1.2.3",
        releaseUrl: "https://example.com/releases/v1.2.3",
      },
    })

    expect(buildOperatorUpdaterCheckActionResponse({
      currentVersion: "1.0.0",
      updateAvailable: false,
      lastCheckedAt: 11,
    }, "https://example.com/releases")).toEqual({
      success: true,
      action: "updater-check",
      message: "No newer release found.",
      details: {
        currentVersion: "1.0.0",
        checkedAt: 11,
        updateAvailable: false,
        latestReleaseTag: undefined,
        releaseUrl: "https://example.com/releases",
      },
    })

    expect(buildOperatorUpdaterCheckActionResponse({
      currentVersion: "1.0.0",
      error: "network unavailable",
      lastCheckedAt: 12,
    }, "https://example.com/releases")).toEqual({
      success: false,
      action: "updater-check",
      message: "Update check failed: network unavailable",
      error: "network unavailable",
      details: {
        currentVersion: "1.0.0",
        checkedAt: 12,
        releaseUrl: "https://example.com/releases",
      },
    })

    expect(buildOperatorUpdaterDownloadLatestActionResponse({
      downloadedAsset: {
        name: "DotAgents.dmg",
        filePath: "/tmp/DotAgents.dmg",
        downloadedAt: 20,
      },
      updateInfo: {
        latestRelease: { tagName: "v1.2.3" },
      },
    })).toEqual({
      success: true,
      action: "updater-download-latest",
      message: "Downloaded DotAgents.dmg to /tmp/DotAgents.dmg",
      details: {
        fileName: "DotAgents.dmg",
        filePath: "/tmp/DotAgents.dmg",
        downloadedAt: 20,
        releaseTag: "v1.2.3",
      },
    })

    expect(buildOperatorDownloadedAssetActionResponse("updater-reveal-download", {
      name: "DotAgents.dmg",
      filePath: "/tmp/DotAgents.dmg",
    })).toEqual({
      success: true,
      action: "updater-reveal-download",
      message: "Revealed DotAgents.dmg in the desktop file manager.",
      details: {
        fileName: "DotAgents.dmg",
        filePath: "/tmp/DotAgents.dmg",
      },
    })

    expect(buildOperatorDownloadedAssetActionResponse("updater-open-download", {
      name: "DotAgents.dmg",
      filePath: "/tmp/DotAgents.dmg",
    })).toMatchObject({
      success: true,
      action: "updater-open-download",
      message: "Opened DotAgents.dmg on the desktop machine.",
    })

    expect(buildOperatorOpenReleasesActionResponse("https://example.com/releases")).toEqual({
      success: true,
      action: "updater-open-releases",
      message: "Opened releases page: https://example.com/releases",
      details: {
        url: "https://example.com/releases",
      },
    })

    expect(buildOperatorActionErrorResponse("updater-open-download", "No downloaded asset found")).toEqual({
      success: false,
      action: "updater-open-download",
      message: "No downloaded asset found",
      error: "No downloaded asset found",
    })

    expect(buildOperatorAgentSessionStopResponse("session-1", "conv-1")).toEqual({
      success: true,
      action: "agent-session-stop",
      message: "Stopped agent session session-1",
      details: {
        sessionId: "session-1",
        conversationId: "conv-1",
      },
    })

    expect(buildOperatorMessageQueueClearResponse("conv-1", true)).toEqual({
      success: true,
      action: "message-queue-clear",
      message: "Cleared message queue for conv-1",
      details: { conversationId: "conv-1" },
    })
    expect(buildOperatorMessageQueueClearResponse("conv-1", false)).toEqual({
      success: false,
      action: "message-queue-clear",
      message: "Failed to clear message queue for conv-1",
      error: "Failed to clear message queue for conv-1",
    })
    expect(buildOperatorMessageQueuePauseResponse("conv-1")).toEqual({
      success: true,
      action: "message-queue-pause",
      message: "Paused message queue for conv-1",
      details: { conversationId: "conv-1" },
    })
    expect(buildOperatorMessageQueueResumeResponse("conv-1", true)).toEqual({
      success: true,
      action: "message-queue-resume",
      message: "Resumed message queue for conv-1 and started processing",
      details: { conversationId: "conv-1", processingStarted: true },
    })
    expect(buildOperatorMessageQueueResumeResponse("conv-1", false)).toEqual({
      success: true,
      action: "message-queue-resume",
      message: "Resumed message queue for conv-1",
      details: { conversationId: "conv-1", processingStarted: false },
    })
    expect(buildOperatorQueuedMessageRemoveResponse("conv-1", "msg-1", true)).toEqual({
      success: true,
      action: "message-queue-message-remove",
      message: "Removed queued message msg-1",
      details: { conversationId: "conv-1", messageId: "msg-1" },
    })
    expect(buildOperatorQueuedMessageRemoveResponse("conv-1", "msg-1", false)).toEqual({
      success: false,
      action: "message-queue-message-remove",
      message: "Failed to remove queued message msg-1",
      error: "Failed to remove queued message msg-1",
    })
    expect(buildOperatorQueuedMessageRetryResponse("conv-1", "msg-1", true, true)).toEqual({
      success: true,
      action: "message-queue-message-retry",
      message: "Retried queued message msg-1 and started processing",
      details: { conversationId: "conv-1", messageId: "msg-1", processingStarted: true },
    })
    expect(buildOperatorQueuedMessageRetryResponse("conv-1", "msg-1", false, false)).toEqual({
      success: false,
      action: "message-queue-message-retry",
      message: "Failed to retry queued message msg-1",
      error: "Failed to retry queued message msg-1",
    })
    expect(buildOperatorQueuedMessageUpdateResponse("conv-1", "msg-1", true, false)).toEqual({
      success: true,
      action: "message-queue-message-update",
      message: "Updated queued message msg-1",
      details: { conversationId: "conv-1", messageId: "msg-1", processingStarted: false },
    })
  })

  it("runs updater route actions through a shared service adapter", async () => {
    const calls: string[] = []
    const options: OperatorUpdaterActionOptions = {
      service: {
        getUpdateInfo: () => ({
          currentVersion: "1.0.0",
          updateAvailable: true,
          lastCheckedAt: 10,
        }),
        checkForUpdatesAndDownload: async () => {
          calls.push("check")
          return {
            updateInfo: {
              currentVersion: "1.0.0",
              updateAvailable: false,
              lastCheckedAt: 11,
            },
          }
        },
        downloadLatestReleaseAsset: async () => {
          calls.push("download")
          return {
            downloadedAsset: {
              name: "DotAgents.dmg",
              filePath: "/tmp/DotAgents.dmg",
              downloadedAt: 12,
            },
            updateInfo: {
              latestRelease: { tagName: "v1.2.3" },
            },
          }
        },
        revealDownloadedReleaseAsset: async () => {
          calls.push("reveal")
          return { name: "DotAgents.dmg", filePath: "/tmp/DotAgents.dmg" }
        },
        openDownloadedReleaseAsset: async () => {
          calls.push("open")
          return { name: "DotAgents.dmg", filePath: "/tmp/DotAgents.dmg" }
        },
        openManualReleasesPage: async () => {
          calls.push("releases")
          return { url: "https://example.com/releases" }
        },
      },
    }

    expect(getOperatorUpdaterAction("1.0.0", "https://example.com/releases", options)).toMatchObject({
      statusCode: 200,
      body: {
        currentVersion: "1.0.0",
        manualReleasesUrl: "https://example.com/releases",
        updateAvailable: true,
      },
    })
    expect(await checkOperatorUpdaterAction("https://example.com/releases", options)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "updater-check",
        details: {
          currentVersion: "1.0.0",
          checkedAt: 11,
          updateAvailable: false,
        },
      },
      auditContext: {
        action: "updater-check",
        success: true,
      },
    })
    expect(await downloadLatestOperatorUpdateAssetAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "updater-download-latest",
        details: {
          fileName: "DotAgents.dmg",
          filePath: "/tmp/DotAgents.dmg",
          releaseTag: "v1.2.3",
        },
      },
    })
    expect(await revealOperatorUpdateAssetAction(options)).toMatchObject({
      body: {
        success: true,
        action: "updater-reveal-download",
      },
    })
    expect(await openOperatorUpdateAssetAction(options)).toMatchObject({
      body: {
        success: true,
        action: "updater-open-download",
      },
    })
    expect(await openOperatorReleasesPageAction(options)).toMatchObject({
      body: {
        success: true,
        action: "updater-open-releases",
        details: { url: "https://example.com/releases" },
      },
    })
    expect(calls).toEqual(["check", "download", "reveal", "open", "releases"])

    const routeActions = createOperatorUpdaterRouteActions("https://example.com/releases", options)
    expect(routeActions.getOperatorUpdater("1.0.0")).toMatchObject({
      statusCode: 200,
      body: {
        currentVersion: "1.0.0",
        manualReleasesUrl: "https://example.com/releases",
        updateAvailable: true,
      },
    })
    expect(await routeActions.checkOperatorUpdater()).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "updater-check",
      },
    })
    expect(await routeActions.downloadLatestOperatorUpdateAsset()).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "updater-download-latest",
      },
    })
    expect(await routeActions.revealOperatorUpdateAsset()).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "updater-reveal-download",
      },
    })
    expect(await routeActions.openOperatorUpdateAsset()).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "updater-open-download",
      },
    })
    expect(await routeActions.openOperatorReleasesPage()).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "updater-open-releases",
      },
    })

    const failingOptions: OperatorUpdaterActionOptions = {
      service: {
        ...options.service,
        downloadLatestReleaseAsset: async () => { throw new Error("No asset found") },
      },
    }

    expect(await downloadLatestOperatorUpdateAssetAction(failingOptions)).toMatchObject({
      statusCode: 200,
      body: {
        success: false,
        action: "updater-download-latest",
        error: "No asset found",
      },
      auditContext: {
        action: "updater-download-latest",
        success: false,
        failureReason: "No asset found",
      },
    })
  })

  it("runs message queue route actions through a shared service adapter", () => {
    const calls: string[] = []
    const options: OperatorMessageQueueActionOptions = {
      service: {
        getAllQueues: () => [{
          conversationId: "conv-1",
          messages: [{
            id: "msg-1",
            conversationId: "conv-1",
            text: "retry this",
            createdAt: 1,
            status: "failed",
            errorMessage: "timeout",
          }],
        }],
        isQueuePaused: (conversationId) => conversationId === "conv-1",
        clearQueue: (conversationId) => {
          calls.push(`clear:${conversationId}`)
          return conversationId === "conv-1"
        },
        pauseQueue: (conversationId) => {
          calls.push(`pause:${conversationId}`)
          return { conversationId }
        },
        resumeQueue: (conversationId) => {
          calls.push(`resume:${conversationId}`)
          return { conversationId, processingStarted: true }
        },
        removeQueuedMessage: (conversationId, messageId) => {
          calls.push(`remove:${conversationId}:${messageId}`)
          return { success: messageId === "msg-1" }
        },
        retryQueuedMessage: (conversationId, messageId) => {
          calls.push(`retry:${conversationId}:${messageId}`)
          return { success: true, processingStarted: true }
        },
        updateQueuedMessageText: (conversationId, messageId, text) => {
          calls.push(`update:${conversationId}:${messageId}:${text}`)
          return { success: true, processingStarted: false }
        },
      },
    }

    expect(getOperatorMessageQueuesAction(options)).toEqual({
      statusCode: 200,
      body: {
        count: 1,
        totalMessages: 1,
        queues: [{
          conversationId: "conv-1",
          isPaused: true,
          messageCount: 1,
          messages: [{
            id: "msg-1",
            conversationId: "conv-1",
            text: "retry this",
            createdAt: 1,
            status: "failed",
            errorMessage: "timeout",
          }],
        }],
      },
    })

    expect(clearOperatorMessageQueueAction(" conv-1 ", options)).toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        action: "message-queue-clear",
        details: { conversationId: "conv-1" },
      },
      auditContext: {
        action: "message-queue-clear",
        success: true,
        details: { conversationId: "conv-1" },
      },
    })
    expect(clearOperatorMessageQueueAction(" ", options)).toMatchObject({
      statusCode: 400,
      body: {
        success: false,
        action: "message-queue-clear",
        error: "Missing conversation ID",
      },
      auditContext: {
        action: "message-queue-clear",
        success: false,
        failureReason: "Missing conversation ID",
      },
    })
    expect(pauseOperatorMessageQueueAction("conv-1", options).body).toMatchObject({
      success: true,
      action: "message-queue-pause",
    })
    expect(resumeOperatorMessageQueueAction("conv-1", options).body).toMatchObject({
      success: true,
      action: "message-queue-resume",
      details: { conversationId: "conv-1", processingStarted: true },
    })
    expect(removeOperatorQueuedMessageAction("conv-1", "missing", options)).toMatchObject({
      statusCode: 409,
      body: {
        success: false,
        action: "message-queue-message-remove",
      },
    })
    expect(removeOperatorQueuedMessageAction("conv-1", "msg-1", options).body).toMatchObject({
      success: true,
      action: "message-queue-message-remove",
    })
    expect(retryOperatorQueuedMessageAction("conv-1", "msg-1", options).body).toMatchObject({
      success: true,
      action: "message-queue-message-retry",
      details: { conversationId: "conv-1", messageId: "msg-1", processingStarted: true },
    })
    expect(updateOperatorQueuedMessageAction("conv-1", "msg-1", { text: "  edited  " }, options).body).toMatchObject({
      success: true,
      action: "message-queue-message-update",
      details: { conversationId: "conv-1", messageId: "msg-1", processingStarted: false },
    })
    expect(updateOperatorQueuedMessageAction("conv-1", "msg-1", { text: " " }, options)).toMatchObject({
      statusCode: 400,
      body: {
        success: false,
        action: "message-queue-message-update",
        error: "Message text is required",
      },
    })
    expect(calls).toEqual([
      "clear:conv-1",
      "pause:conv-1",
      "resume:conv-1",
      "remove:conv-1:missing",
      "remove:conv-1:msg-1",
      "retry:conv-1:msg-1",
      "update:conv-1:msg-1:edited",
    ])

    const routeActions = createOperatorMessageQueueRouteActions(options)
    expect(routeActions.getOperatorMessageQueues()).toMatchObject({
      statusCode: 200,
      body: {
        count: 1,
        totalMessages: 1,
      },
    })
    expect(routeActions.clearOperatorMessageQueue("conv-1").body).toMatchObject({
      success: true,
      action: "message-queue-clear",
    })
    expect(routeActions.pauseOperatorMessageQueue("conv-1").body).toMatchObject({
      success: true,
      action: "message-queue-pause",
    })
    expect(routeActions.resumeOperatorMessageQueue("conv-1").body).toMatchObject({
      success: true,
      action: "message-queue-resume",
    })
    expect(routeActions.removeOperatorQueuedMessage("conv-1", "msg-1").body).toMatchObject({
      success: true,
      action: "message-queue-message-remove",
    })
    expect(routeActions.retryOperatorQueuedMessage("conv-1", "msg-1").body).toMatchObject({
      success: true,
      action: "message-queue-message-retry",
    })
    expect(routeActions.updateOperatorQueuedMessage("conv-1", "msg-1", { text: "updated" }).body).toMatchObject({
      success: true,
      action: "message-queue-message-update",
    })
  })

  it("builds system metrics from raw process and OS values", () => {
    expect(buildOperatorSystemMetrics({
      platform: "darwin",
      arch: "arm64",
      nodeVersion: "v20.0.0",
      electronVersion: "30.0.0",
      appVersion: "1.2.3",
      osUptimeSeconds: 123.9,
      processUptimeSeconds: 45.8,
      memoryUsageBytes: {
        heapUsed: 1_572_864,
        heapTotal: 2_097_152,
        rss: 10_485_760,
      },
      cpuCount: 8,
      totalMemoryBytes: 17_179_869_184,
      freeMemoryBytes: 4_294_967_296,
      hostname: "workstation",
    })).toEqual({
      platform: "darwin",
      arch: "arm64",
      nodeVersion: "v20.0.0",
      electronVersion: "30.0.0",
      appVersion: "1.2.3",
      uptimeSeconds: 123,
      processUptimeSeconds: 45,
      memoryUsage: {
        heapUsedMB: 1.5,
        heapTotalMB: 2,
        rssMB: 10,
      },
      cpuCount: 8,
      totalMemoryMB: 16384,
      freeMemoryMB: 4096,
      hostname: "workstation",
    })
  })

  it("builds active and recent session summaries", () => {
    expect(buildOperatorSessionsSummary([
      {
        id: "session-1",
        conversationTitle: "Research",
        status: "active",
        startTime: 1,
        currentIteration: 2,
        maxIterations: 5,
      },
    ], [
      {
        id: "session-2",
        status: "completed",
        startTime: 0,
      },
      {
        id: "session-3",
        status: "error",
        startTime: 3,
      },
    ])).toEqual({
      activeSessions: 1,
      recentSessions: 2,
      activeSessionDetails: [{
        id: "session-1",
        title: "Research",
        status: "active",
        startTime: 1,
        currentIteration: 2,
        maxIterations: 5,
      }],
    })
  })

  it("runs observability route actions through a shared service adapter", async () => {
    const now = Date.now()
    const recentErrors = [
      { timestamp: now - 10, level: "info" as const, component: "remote", message: "Started" },
      { timestamp: now - 1_000, level: "error" as const, component: "mcp", message: "Failed" },
    ]
    const calls: string[] = []
    const options: OperatorObservabilityActionOptions = {
      manualReleasesUrl: "https://example.com/releases",
      diagnostics: {
        logError: (_source, message) => { calls.push(`error:${message}`) },
      },
      service: {
        getCurrentVersion: () => "1.2.3",
        getRecentErrors: (count) => {
          calls.push(`errors:${count}`)
          return recentErrors.slice(0, count)
        },
        performHealthCheck: async () => {
          calls.push("health")
          return {
            overall: "warning",
            checks: { remote: { status: "warning", message: "Needs attention" } },
          }
        },
        getTunnelStatus: () => {
          calls.push("tunnel")
          return {
            running: false,
            starting: false,
            mode: null,
          }
        },
        getIntegrationsSummary: async () => {
          calls.push("integrations")
          return {
            discord: {
              available: true,
              enabled: true,
              connected: true,
              connecting: false,
              logs: { total: 0 },
            },
            whatsapp: {
              enabled: false,
              available: false,
              connected: false,
              serverConfigured: false,
              serverConnected: false,
              autoReplyEnabled: false,
              logMessagesEnabled: false,
              allowedSenderCount: 0,
              logs: { total: 0 },
            },
            pushNotifications: {
              enabled: false,
              tokenCount: 0,
              platforms: [],
            },
          }
        },
        getUpdateInfo: () => {
          calls.push("update")
          return null
        },
        getSystemMetrics: () => {
          calls.push("system")
          return {
            platform: "darwin",
            arch: "arm64",
            nodeVersion: "v20.0.0",
            electronVersion: "30.0.0",
            appVersion: "1.2.3",
            osUptimeSeconds: 10.9,
            processUptimeSeconds: 3.1,
            memoryUsageBytes: {
              heapUsed: 1_048_576,
              heapTotal: 2_097_152,
              rss: 3_145_728,
            },
            cpuCount: 8,
            totalMemoryBytes: 8_388_608,
            freeMemoryBytes: 4_194_304,
            hostname: "workstation",
          }
        },
        getActiveSessions: () => {
          calls.push("active-sessions")
          return [{ id: "session-1", conversationTitle: "Research", status: "active", startTime: now }]
        },
        getRecentSessions: (count) => {
          calls.push(`recent-sessions:${count}`)
          return [{ id: "session-2", status: "completed", startTime: now - 5 }]
        },
        getConversationHistory: async () => {
          calls.push("conversations")
          return [{
            id: "conversation-1",
            title: "Ops",
            createdAt: 1,
            updatedAt: 2,
            messageCount: 3,
            preview: "Ready",
          }]
        },
      },
    }
    const remoteServer = {
      running: true,
      bind: "0.0.0.0",
      port: 3210,
      url: "http://0.0.0.0:3210",
    }

    expect(await getOperatorStatusAction(remoteServer, options)).toMatchObject({
      statusCode: 200,
      body: {
        remoteServer: {
          running: true,
          bind: "0.0.0.0",
          port: 3210,
        },
        health: {
          overall: "warning",
        },
        updater: {
          currentVersion: "1.2.3",
          manualReleasesUrl: "https://example.com/releases",
        },
        system: {
          platform: "darwin",
          appVersion: "1.2.3",
          memoryUsage: {
            heapUsedMB: 1,
          },
        },
        sessions: {
          activeSessions: 1,
          recentSessions: 1,
        },
        recentErrors: {
          total: 2,
          errorsInLastFiveMinutes: 2,
        },
      },
    })
    expect(await getOperatorHealthAction(options)).toMatchObject({
      statusCode: 200,
      body: {
        checkedAt: expect.any(Number),
        overall: "warning",
      },
    })
    expect(getOperatorErrorsAction("1", options)).toEqual({
      statusCode: 200,
      body: {
        count: 1,
        errors: [recentErrors[0]],
      },
    })
    expect(getOperatorLogsAction(undefined, "error", options)).toEqual({
      statusCode: 200,
      body: {
        count: 1,
        level: "error",
        logs: [recentErrors[1]],
      },
    })
    expect(await getOperatorConversationsAction("1", options)).toEqual({
      statusCode: 200,
      body: {
        count: 1,
        conversations: [{
          id: "conversation-1",
          title: "Ops",
          createdAt: 1,
          updatedAt: 2,
          messageCount: 3,
          preview: "Ready",
        }],
      },
    })
    expect(getOperatorRemoteServerAction(remoteServer)).toMatchObject({
      statusCode: 200,
      body: {
        running: true,
        port: 3210,
      },
    })

    const routeActions = createOperatorObservabilityRouteActions(options)
    expect(await routeActions.getOperatorStatus(remoteServer)).toMatchObject({
      statusCode: 200,
      body: {
        remoteServer: {
          running: true,
          port: 3210,
        },
      },
    })
    expect(await routeActions.getOperatorHealth()).toMatchObject({
      statusCode: 200,
      body: {
        overall: "warning",
      },
    })
    expect(routeActions.getOperatorErrors("1")).toMatchObject({
      statusCode: 200,
      body: {
        count: 1,
      },
    })
    expect(routeActions.getOperatorLogs(undefined, "error")).toMatchObject({
      statusCode: 200,
      body: {
        level: "error",
      },
    })
    expect(await routeActions.getOperatorConversations("1")).toMatchObject({
      statusCode: 200,
      body: {
        count: 1,
      },
    })
    expect(routeActions.getOperatorRemoteServer(remoteServer)).toMatchObject({
      statusCode: 200,
      body: {
        running: true,
        port: 3210,
      },
    })
    expect(calls).toEqual(expect.arrayContaining([
      "errors:100",
      "health",
      "tunnel",
      "integrations",
      "update",
      "system",
      "active-sessions",
      "recent-sessions:10",
      "errors:1",
      "errors:20",
      "conversations",
    ]))

    const failingOptions: OperatorObservabilityActionOptions = {
      ...options,
      service: {
        ...options.service,
        performHealthCheck: async () => { throw new Error("health denied") },
      },
    }
    expect(await getOperatorHealthAction(failingOptions)).toEqual({
      statusCode: 500,
      body: { error: "Failed to build operator health snapshot" },
    })
    expect(calls).toContain("error:Failed to build operator health snapshot")
  })

  it("builds complete operator runtime status snapshots from plain inputs", () => {
    expect(buildOperatorRuntimeStatus({
      timestamp: 1_000,
      remoteServer: {
        running: true,
        bind: "0.0.0.0",
        port: 3210,
        url: "http://0.0.0.0:3210/v1",
        connectableUrl: "http://192.168.1.2:3210/v1",
      },
      health: {
        overall: "healthy",
        checks: {},
      },
      tunnel: {
        running: false,
        starting: false,
        mode: null,
      },
      integrations: {
        discord: {
          available: true,
          enabled: true,
          connected: true,
          connecting: false,
          logs: { total: 0 },
        },
        whatsapp: {
          enabled: false,
          available: false,
          connected: false,
          serverConfigured: false,
          serverConnected: false,
          autoReplyEnabled: false,
          logMessagesEnabled: false,
          allowedSenderCount: 0,
          logs: { total: 0 },
        },
        pushNotifications: {
          enabled: false,
          tokenCount: 0,
          platforms: [],
        },
      },
      updater: {
        currentVersion: "1.0.0",
        updateInfo: null,
        manualReleasesUrl: "https://example.com/releases",
      },
      system: {
        platform: "darwin",
        arch: "arm64",
        nodeVersion: "v20.0.0",
        electronVersion: "30.0.0",
        appVersion: "1.0.0",
        osUptimeSeconds: 10.9,
        processUptimeSeconds: 3.1,
        memoryUsageBytes: {
          heapUsed: 1_048_576,
          heapTotal: 2_097_152,
          rss: 3_145_728,
        },
        cpuCount: 8,
        totalMemoryBytes: 8_388_608,
        freeMemoryBytes: 4_194_304,
        hostname: "workstation",
      },
      activeSessions: [{
        id: "session-1",
        conversationTitle: "Research",
        status: "active",
        startTime: 900,
      }],
      recentSessions: [{ id: "session-1", status: "active", startTime: 900 }],
      recentErrors: [
        { timestamp: 100, level: "error", component: "old", message: "Old" },
        { timestamp: 950, level: "error", component: "new", message: "New" },
      ],
      recentErrorWindowMs: 100,
    })).toMatchObject({
      timestamp: 1_000,
      remoteServer: {
        running: true,
        bind: "0.0.0.0",
        port: 3210,
        url: "http://0.0.0.0:3210/v1",
        connectableUrl: "http://192.168.1.2:3210/v1",
      },
      health: {
        checkedAt: 1_000,
        overall: "healthy",
        checks: {},
      },
      tunnel: {
        running: false,
        starting: false,
        mode: null,
      },
      updater: {
        enabled: false,
        mode: "manual",
        currentVersion: "1.0.0",
        updateInfo: null,
        manualReleasesUrl: "https://example.com/releases",
      },
      system: {
        platform: "darwin",
        uptimeSeconds: 10,
        processUptimeSeconds: 3,
        memoryUsage: {
          heapUsedMB: 1,
          heapTotalMB: 2,
          rssMB: 3,
        },
      },
      sessions: {
        activeSessions: 1,
        recentSessions: 1,
      },
      recentErrors: {
        total: 2,
        errorsInLastFiveMinutes: 1,
      },
    })
  })
})
