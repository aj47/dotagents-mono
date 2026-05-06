import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  REMOTE_SERVER_API_ROUTE_PATHS,
  REMOTE_SERVER_API_ROUTES,
  REMOTE_SERVER_MCP_PATHS,
  REMOTE_SERVER_MCP_ROUTES,
  getRemoteServerApiRouteKey,
  type RemoteServerApiPathKey,
  type RemoteServerMcpPathKey,
} from "@dotagents/shared/remote-server-api"
import { describe, expect, it } from "vitest"

function getRemoteServerSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteServerPath = path.join(testDir, "remote-server.ts")
  return readFileSync(remoteServerPath, "utf8")
}

function getRemoteServerControllerSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteServerControllerPath = path.join(testDir, "remote-server-controller.ts")
  return readFileSync(remoteServerControllerPath, "utf8")
}

function getRemoteServerRouteBundleSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteServerRouteBundlePath = path.join(testDir, "remote-server-route-bundle.ts")
  return readFileSync(remoteServerRouteBundlePath, "utf8")
}

function getRemoteServerDesktopAdaptersSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteServerDesktopAdaptersPath = path.join(testDir, "remote-server-desktop-adapters.ts")
  return readFileSync(remoteServerDesktopAdaptersPath, "utf8")
}

function getAgentLoopRunnerSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const agentLoopRunnerPath = path.join(testDir, "agent-loop-runner.ts")
  return readFileSync(agentLoopRunnerPath, "utf8")
}

function getAgentRunActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const agentRunActionsPath = path.join(testDir, "agent-run-actions.ts")
  return readFileSync(agentRunActionsPath, "utf8")
}

function getSharedAgentRunUtilsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedAgentRunUtilsPath = path.join(testDir, "../../../../packages/shared/src/agent-run-utils.ts")
  return readFileSync(sharedAgentRunUtilsPath, "utf8")
}

function getSharedRemoteServerRouteContractsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedRemoteServerRouteContractsPath = path.join(
    testDir,
    "../../../../packages/shared/src/remote-server-route-contracts.ts",
  )
  return readFileSync(sharedRemoteServerRouteContractsPath, "utf8")
}

function getSharedRemoteServerControllerContractsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedRemoteServerControllerContractsPath = path.join(
    testDir,
    "../../../../packages/shared/src/remote-server-controller-contracts.ts",
  )
  return readFileSync(sharedRemoteServerControllerContractsPath, "utf8")
}

function getSharedOperatorAuditStoreSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedOperatorAuditStorePath = path.join(testDir, "../../../../packages/shared/src/operator-audit-store.ts")
  return readFileSync(sharedOperatorAuditStorePath, "utf8")
}

function getSharedOperatorActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedOperatorActionsPath = path.join(testDir, "../../../../packages/shared/src/operator-actions.ts")
  return readFileSync(sharedOperatorActionsPath, "utf8")
}

function getSharedMcpApiSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedMcpApiPath = path.join(testDir, "../../../../packages/shared/src/mcp-api.ts")
  return readFileSync(sharedMcpApiPath, "utf8")
}

function getSharedPushNotificationsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedPushNotificationsPath = path.join(testDir, "../../../../packages/shared/src/push-notifications.ts")
  return readFileSync(sharedPushNotificationsPath, "utf8")
}

function getSharedChatUtilsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedChatUtilsPath = path.join(testDir, "../../../../packages/shared/src/chat-utils.ts")
  return readFileSync(sharedChatUtilsPath, "utf8")
}

function getSharedTtsApiSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedTtsApiPath = path.join(testDir, "../../../../packages/shared/src/tts-api.ts")
  return readFileSync(sharedTtsApiPath, "utf8")
}

function getSharedSettingsApiClientSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedSettingsApiClientPath = path.join(testDir, "../../../../packages/shared/src/settings-api-client.ts")
  return readFileSync(sharedSettingsApiClientPath, "utf8")
}

function getSharedSkillsApiSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedSkillsApiPath = path.join(testDir, "../../../../packages/shared/src/skills-api.ts")
  return readFileSync(sharedSkillsApiPath, "utf8")
}

function getSharedProfileApiSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedProfileApiPath = path.join(testDir, "../../../../packages/shared/src/profile-api.ts")
  return readFileSync(sharedProfileApiPath, "utf8")
}

function getSharedMessageQueueStoreSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedMessageQueueStorePath = path.join(testDir, "../../../../packages/shared/src/message-queue-store.ts")
  return readFileSync(sharedMessageQueueStorePath, "utf8")
}

function getRemoteAgentRunnerSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteAgentRunnerPath = path.join(testDir, "remote-agent-runner.ts")
  return readFileSync(remoteAgentRunnerPath, "utf8")
}

function getChatCompletionActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const chatCompletionActionsPath = path.join(testDir, "chat-completion-actions.ts")
  return readFileSync(chatCompletionActionsPath, "utf8")
}

function getOperatorMcpActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorMcpActionsPath = path.join(testDir, "operator-mcp-actions.ts")
  return readFileSync(operatorMcpActionsPath, "utf8")
}

function getOperatorRoutesSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorRoutesPath = path.join(testDir, "operator-routes.ts")
  return readFileSync(operatorRoutesPath, "utf8")
}

function getOperatorRouteDesktopActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorRouteDesktopActionsPath = path.join(testDir, "operator-route-desktop-actions.ts")
  return readFileSync(operatorRouteDesktopActionsPath, "utf8")
}

function getMobileApiRoutesSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const mobileApiRoutesPath = path.join(testDir, "mobile-api-routes.ts")
  return readFileSync(mobileApiRoutesPath, "utf8")
}

function getMobileApiDesktopActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const mobileApiDesktopActionsPath = path.join(testDir, "mobile-api-desktop-actions.ts")
  return readFileSync(mobileApiDesktopActionsPath, "utf8")
}

function getInjectedMcpRoutesSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const injectedMcpRoutesPath = path.join(testDir, "injected-mcp-routes.ts")
  return readFileSync(injectedMcpRoutesPath, "utf8")
}

function getInjectedMcpDesktopActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const injectedMcpDesktopActionsPath = path.join(testDir, "injected-mcp-desktop-actions.ts")
  return readFileSync(injectedMcpDesktopActionsPath, "utf8")
}

function getRemoteServerRouteRegistrationSource(): string {
  return [
    getRemoteServerSource(),
    getRemoteServerControllerSource(),
    getRemoteServerRouteBundleSource(),
    getOperatorRoutesSource(),
    getMobileApiRoutesSource(),
    getInjectedMcpRoutesSource(),
  ].join("\n")
}

function getOperatorLocalSpeechActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorLocalSpeechActionsPath = path.join(testDir, "operator-local-speech-actions.ts")
  return readFileSync(operatorLocalSpeechActionsPath, "utf8")
}

function getOperatorModelPresetActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorModelPresetActionsPath = path.join(testDir, "operator-model-preset-actions.ts")
  return readFileSync(operatorModelPresetActionsPath, "utf8")
}

function getSharedModelPresetsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedModelPresetsPath = path.join(testDir, "../../../../packages/shared/src/model-presets.ts")
  return readFileSync(sharedModelPresetsPath, "utf8")
}

function getOperatorTunnelActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorTunnelActionsPath = path.join(testDir, "operator-tunnel-actions.ts")
  return readFileSync(operatorTunnelActionsPath, "utf8")
}

function getOperatorUpdaterActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorUpdaterActionsPath = path.join(testDir, "operator-updater-actions.ts")
  return readFileSync(operatorUpdaterActionsPath, "utf8")
}

function getOperatorIntegrationActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorIntegrationActionsPath = path.join(testDir, "operator-integration-actions.ts")
  return readFileSync(operatorIntegrationActionsPath, "utf8")
}

function getOperatorIntegrationSummarySource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorIntegrationSummaryPath = path.join(testDir, "operator-integration-summary.ts")
  return readFileSync(operatorIntegrationSummaryPath, "utf8")
}

function getOperatorMessageQueueActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorMessageQueueActionsPath = path.join(testDir, "operator-message-queue-actions.ts")
  return readFileSync(operatorMessageQueueActionsPath, "utf8")
}

function getMessageQueueActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const messageQueueActionsPath = path.join(testDir, "message-queue-actions.ts")
  return readFileSync(messageQueueActionsPath, "utf8")
}

function getMessageQueueServiceSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const messageQueueServicePath = path.join(testDir, "message-queue-service.ts")
  return readFileSync(messageQueueServicePath, "utf8")
}

function getOperatorAgentActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorAgentActionsPath = path.join(testDir, "operator-agent-actions.ts")
  return readFileSync(operatorAgentActionsPath, "utf8")
}

function getOperatorObservabilityActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorObservabilityActionsPath = path.join(testDir, "operator-observability-actions.ts")
  return readFileSync(operatorObservabilityActionsPath, "utf8")
}

function getOperatorAuditActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorAuditActionsPath = path.join(testDir, "operator-audit-actions.ts")
  return readFileSync(operatorAuditActionsPath, "utf8")
}

function getOperatorApiKeyActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorApiKeyActionsPath = path.join(testDir, "operator-api-key-actions.ts")
  return readFileSync(operatorApiKeyActionsPath, "utf8")
}

function getOperatorRestartActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorRestartActionsPath = path.join(testDir, "operator-restart-actions.ts")
  return readFileSync(operatorRestartActionsPath, "utf8")
}

function getProfileActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const profileActionsPath = path.join(testDir, "profile-actions.ts")
  return readFileSync(profileActionsPath, "utf8")
}

function getAgentProfileActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const agentProfileActionsPath = path.join(testDir, "agent-profile-actions.ts")
  return readFileSync(agentProfileActionsPath, "utf8")
}

function getKnowledgeNoteActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const knowledgeNoteActionsPath = path.join(testDir, "knowledge-note-actions.ts")
  return readFileSync(knowledgeNoteActionsPath, "utf8")
}

function getSharedKnowledgeNoteFormSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedKnowledgeNoteFormPath = path.join(testDir, "../../../../packages/shared/src/knowledge-note-form.ts")
  return readFileSync(sharedKnowledgeNoteFormPath, "utf8")
}

function getRepeatTaskActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const repeatTaskActionsPath = path.join(testDir, "repeat-task-actions.ts")
  return readFileSync(repeatTaskActionsPath, "utf8")
}

function getSharedRepeatTaskUtilsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedRepeatTaskUtilsPath = path.join(testDir, "../../../../packages/shared/src/repeat-task-utils.ts")
  return readFileSync(sharedRepeatTaskUtilsPath, "utf8")
}

function getSkillActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const skillActionsPath = path.join(testDir, "skill-actions.ts")
  return readFileSync(skillActionsPath, "utf8")
}

function getModelActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const modelActionsPath = path.join(testDir, "model-actions.ts")
  return readFileSync(modelActionsPath, "utf8")
}

function getMcpServerActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const mcpServerActionsPath = path.join(testDir, "mcp-server-actions.ts")
  return readFileSync(mcpServerActionsPath, "utf8")
}

function getTtsActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const ttsActionsPath = path.join(testDir, "tts-actions.ts")
  return readFileSync(ttsActionsPath, "utf8")
}

function getPushActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const pushActionsPath = path.join(testDir, "push-actions.ts")
  return readFileSync(pushActionsPath, "utf8")
}

function getConversationActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const conversationActionsPath = path.join(testDir, "conversation-actions.ts")
  return readFileSync(conversationActionsPath, "utf8")
}

function getSharedConversationSyncSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedConversationSyncPath = path.join(testDir, "../../../../packages/shared/src/conversation-sync.ts")
  return readFileSync(sharedConversationSyncPath, "utf8")
}

function getSettingsActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const settingsActionsPath = path.join(testDir, "settings-actions.ts")
  return readFileSync(settingsActionsPath, "utf8")
}

function getEmergencyStopActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const emergencyStopActionsPath = path.join(testDir, "emergency-stop-actions.ts")
  return readFileSync(emergencyStopActionsPath, "utf8")
}

function getInjectedMcpActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const injectedMcpActionsPath = path.join(testDir, "injected-mcp-actions.ts")
  return readFileSync(injectedMcpActionsPath, "utf8")
}

function getRemoteServerPairingActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteServerPairingActionsPath = path.join(testDir, "remote-server-pairing-actions.ts")
  return readFileSync(remoteServerPairingActionsPath, "utf8")
}

type RegisteredRoute = {
  method: string
  path: string
  line: number
}

function getRegisteredRoutes(source: string): RegisteredRoute[] {
  const routeRegex = /fastify\.(get|post|patch|delete|put)\((?:"([^"]+)"|API_ROUTES\.([A-Za-z0-9_]+)|MCP_ROUTES\.([A-Za-z0-9_]+))/g
  const routes: RegisteredRoute[] = []

  for (const match of source.matchAll(routeRegex)) {
    const method = match[1]?.toUpperCase() ?? ""
    const path = match[2]
      ?? REMOTE_SERVER_API_ROUTE_PATHS[match[3] as RemoteServerApiPathKey]
      ?? REMOTE_SERVER_MCP_PATHS[match[4] as RemoteServerMcpPathKey]
      ?? ""
    const matchIndex = match.index ?? 0
    const line = source.slice(0, matchIndex).split("\n").length
    routes.push({ method, path, line })
  }

  return routes
}

function getDuplicateRoutes(source: string): Array<{ key: string; lines: number[] }> {
  const linesByRoute = new Map<string, number[]>()

  for (const route of getRegisteredRoutes(source)) {
    const key = `${route.method} ${route.path}`
    linesByRoute.set(key, [...(linesByRoute.get(key) ?? []), route.line])
  }

  return [...linesByRoute.entries()]
    .filter(([, lines]) => lines.length > 1)
    .map(([key, lines]) => ({ key, lines }))
}

function getHardcodedApiRouteRegistrations(source: string): RegisteredRoute[] {
  const routeRegex = /fastify\.(get|post|patch|delete|put)\("(\/v1[^"]*)"/g
  const routes: RegisteredRoute[] = []

  for (const match of source.matchAll(routeRegex)) {
    const matchIndex = match.index ?? 0
    routes.push({
      method: match[1]?.toUpperCase() ?? "",
      path: match[2] ?? "",
      line: source.slice(0, matchIndex).split("\n").length,
    })
  }

  return routes
}

function getHardcodedMcpRouteRegistrations(source: string): RegisteredRoute[] {
  const routeRegex = /fastify\.(get|post|patch|delete|put)\("(\/mcp[^"]*)"/g
  const routes: RegisteredRoute[] = []

  for (const match of source.matchAll(routeRegex)) {
    const matchIndex = match.index ?? 0
    routes.push({
      method: match[1]?.toUpperCase() ?? "",
      path: match[2] ?? "",
      line: source.slice(0, matchIndex).split("\n").length,
    })
  }

  return routes
}

function getRouteKey(route: { method: string; path: string }): string {
  return `${route.method.toUpperCase()} ${route.path}`
}

function getSection(source: string, startMarker: string, endMarker: string): string {
  const startIndex = source.indexOf(startMarker)
  const endIndex = source.indexOf(endMarker)

  expect(startIndex).toBeGreaterThanOrEqual(0)
  expect(endIndex).toBeGreaterThan(startIndex)

  return source.slice(startIndex, endIndex)
}

function getApiRouteRegistrationMarker(source: string, method: string, key: RemoteServerApiPathKey): string {
  const lowerMethod = method.toLowerCase()
  const apiRoutesMarker = `fastify.${lowerMethod}(API_ROUTES.${key}`
  if (source.includes(apiRoutesMarker)) {
    return apiRoutesMarker
  }

  const literalMarker = `fastify.${lowerMethod}("${REMOTE_SERVER_API_ROUTE_PATHS[key]}"`
  expect(source).toContain(literalMarker)
  return literalMarker
}

function expectRegisteredApiRoute(source: string, method: string, key: RemoteServerApiPathKey): void {
  const routeSource = [
    source,
    getRemoteServerControllerSource(),
    getRemoteServerRouteBundleSource(),
    getOperatorRoutesSource(),
    getMobileApiRoutesSource(),
    getInjectedMcpRoutesSource(),
  ].join("\n")
  expect(getRegisteredRoutes(routeSource)).toEqual(expect.arrayContaining([
    expect.objectContaining({
      method: method.toUpperCase(),
      path: REMOTE_SERVER_API_ROUTE_PATHS[key],
    }),
  ]))
}

function getMcpRouteRegistrationMarker(source: string, method: string, key: RemoteServerMcpPathKey): string {
  const lowerMethod = method.toLowerCase()
  const mcpRoutesMarker = `fastify.${lowerMethod}(MCP_ROUTES.${key}`
  if (source.includes(mcpRoutesMarker)) {
    return mcpRoutesMarker
  }

  const literalMarker = `fastify.${lowerMethod}("${REMOTE_SERVER_MCP_PATHS[key]}"`
  expect(source).toContain(literalMarker)
  return literalMarker
}

function expectRegisteredMcpRoute(source: string, method: string, key: RemoteServerMcpPathKey): void {
  const routeSource = [
    source,
    getRemoteServerControllerSource(),
    getRemoteServerRouteBundleSource(),
    getOperatorRoutesSource(),
    getMobileApiRoutesSource(),
    getInjectedMcpRoutesSource(),
  ].join("\n")
  expect(getRegisteredRoutes(routeSource)).toEqual(expect.arrayContaining([
    expect.objectContaining({
      method: method.toUpperCase(),
      path: REMOTE_SERVER_MCP_PATHS[key],
    }),
  ]))
}

describe("remote-server route registration", () => {
  it("does not register duplicate Fastify method/path pairs", () => {
    const source = getRemoteServerRouteRegistrationSource()
    const duplicates = getDuplicateRoutes(source)

    expect(duplicates).toEqual([])
  })

  it("keeps registered /v1 routes aligned with the shared remote API contract", () => {
    const source = getRemoteServerRouteRegistrationSource()
    const registeredKeys = new Set(
      getRegisteredRoutes(source)
        .filter((route) => route.path.startsWith("/v1/"))
        .map(getRemoteServerApiRouteKey),
    )
    const expectedKeys = new Set(REMOTE_SERVER_API_ROUTES.map(getRemoteServerApiRouteKey))

    expect([...expectedKeys].filter((key) => !registeredKeys.has(key))).toEqual([])
    expect([...registeredKeys].filter((key) => !expectedKeys.has(key))).toEqual([])
  })

  it("uses shared route constants for registered /v1 routes", () => {
    const source = getRemoteServerRouteRegistrationSource()

    expect(getHardcodedApiRouteRegistrations(source)).toEqual([])
  })

  it("keeps registered injected MCP routes aligned with the shared remote MCP contract", () => {
    const source = getRemoteServerRouteRegistrationSource()
    const registeredKeys = new Set(
      getRegisteredRoutes(source)
        .filter((route) => route.path.startsWith("/mcp/"))
        .map(getRouteKey),
    )
    const expectedKeys = new Set(REMOTE_SERVER_MCP_ROUTES.map(getRouteKey))

    expect([...expectedKeys].filter((key) => !registeredKeys.has(key))).toEqual([])
    expect([...registeredKeys].filter((key) => !expectedKeys.has(key))).toEqual([])
  })

  it("uses shared route constants for registered injected MCP routes", () => {
    const source = getRemoteServerRouteRegistrationSource()

    expect(getHardcodedMcpRouteRegistrations(source)).toEqual([])
  })

  it("keeps the Electron remote server facade free of direct Fastify wiring", () => {
    const source = getRemoteServerSource()
    const controllerSource = getRemoteServerControllerSource()
    const routeBundleSource = getRemoteServerRouteBundleSource()
    const desktopAdaptersSource = getRemoteServerDesktopAdaptersSource()
    const operatorRoutesSource = getOperatorRoutesSource()
    const operatorRouteDesktopActionsSource = getOperatorRouteDesktopActionsSource()
    const injectedMcpRoutesSource = getInjectedMcpRoutesSource()
    const injectedMcpDesktopActionsSource = getInjectedMcpDesktopActionsSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedRouteContractsSource = getSharedRemoteServerRouteContractsSource()
    const sharedControllerContractsSource = getSharedRemoteServerControllerContractsSource()

    expect(source).toContain("createRemoteServerController({")
    expect(source).toContain("registerRoutes: registerDesktopRemoteServerRoutes")
    expect(source).toContain("adapters: remoteServerDesktopAdapters")
    expect(source).toContain("return remoteServerController.startRemoteServer()")
    expect(source).toContain("return remoteServerController.printQRCodeToTerminal(urlOverride)")
    expect(source).not.toContain('from "fastify"')
    expect(source).not.toContain('from "@fastify/cors"')
    expect(source).not.toContain("registerOperatorRoutes(")
    expect(source).not.toContain("registerMobileApiRoutes(")
    expect(source).not.toContain("registerInjectedMcpRoutes(")
    expect(source).not.toContain("fastify.get(")
    expect(source).not.toContain("fastify.post(")
    expect(controllerSource).toContain("Fastify({ logger: { level: logLevel }, bodyLimit: 50 * 1024 * 1024 })")
    expect(controllerSource).toContain("registerRoutes(fastify, {")
    expect(controllerSource).not.toContain("registerOperatorRoutes(fastify")
    expect(controllerSource).not.toContain("registerMobileApiRoutes(fastify")
    expect(controllerSource).not.toContain("registerInjectedMcpRoutes(fastify")
    expect(controllerSource).not.toContain('from "./operator-audit-actions"')
    expect(controllerSource).not.toContain('from "./operator-api-key-actions"')
    expect(controllerSource).not.toContain('from "./remote-server-pairing-actions"')
    expect(controllerSource).not.toContain('from "./chat-completion-actions"')
    expect(controllerSource).not.toContain('from "../shared/types"')
    expect(controllerSource).toContain('from "@dotagents/shared/remote-server-controller-contracts"')
    expect(controllerSource).not.toContain('from "@dotagents/shared/agent-run-utils"')
    expect(controllerSource).toContain("export type RemoteServerControllerConfig = RemoteServerControllerConfigLike")
    expect(controllerSource).toContain("RemoteServerRunAgentExecutor,")
    expect(controllerSource).toContain(
      "export type RemoteServerRouteRegistrar = SharedRemoteServerRouteRegistrar<FastifyInstance, FastifyReply>",
    )
    expect(controllerSource).toContain("adapters.authorizeRequest(req, {")
    expect(controllerSource).toContain("adapters.resolveConfiguredApiKey(current)")
    expect(controllerSource).toContain("adapters.recordOperatorResponseAuditEvent(req, reply)")
    expect(routeBundleSource).toContain("registerOperatorRoutes(fastify, {")
    expect(routeBundleSource).toContain("actions: operatorRouteDesktopActions")
    expect(routeBundleSource).toContain("registerMobileApiRoutes(fastify, {")
    expect(routeBundleSource).toContain("actions: mobileApiDesktopActions")
    expect(routeBundleSource).toContain("registerInjectedMcpRoutes(fastify, {")
    expect(routeBundleSource).toContain("actions: injectedMcpDesktopActions")
    expect(operatorRoutesSource).not.toContain('from "./operator-agent-actions"')
    expect(operatorRoutesSource).not.toContain('from "./operator-mcp-actions"')
    expect(operatorRoutesSource).not.toContain('from "./operator-local-speech-actions"')
    expect(operatorRoutesSource).not.toContain('from "./operator-model-preset-actions"')
    expect(operatorRoutesSource).not.toContain('from "./operator-tunnel-actions"')
    expect(operatorRoutesSource).not.toContain('from "./operator-updater-actions"')
    expect(operatorRoutesSource).not.toContain('from "./operator-integration-actions"')
    expect(operatorRoutesSource).not.toContain('from "./operator-message-queue-actions"')
    expect(operatorRoutesSource).not.toContain('from "./operator-observability-actions"')
    expect(operatorRoutesSource).not.toContain('from "./operator-audit-actions"')
    expect(operatorRoutesSource).not.toContain('from "./operator-restart-actions"')
    expect(operatorRoutesSource).not.toContain('from "./operator-api-key-actions"')
    expect(operatorRoutesSource).toContain('from "@dotagents/shared/remote-server-route-contracts"')
    expect(operatorRoutesSource).toContain("export type OperatorRouteActions = SharedOperatorRouteActions<FastifyRequest>")
    expect(operatorRoutesSource).toContain(
      "export type RegisterOperatorRoutesOptions = SharedOperatorRouteOptions<FastifyRequest, FastifyReply>",
    )
    expect(operatorRoutesSource).not.toContain("export interface OperatorRouteActions")
    expect(operatorRoutesSource).not.toContain("export interface RegisterOperatorRoutesOptions")
    expect(operatorRouteDesktopActionsSource).toContain("export const operatorRouteDesktopActions")
    expect(operatorRouteDesktopActionsSource).toContain("runOperatorAgent")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorStatus")
    expect(operatorRouteDesktopActionsSource).toContain("recordOperatorAuditEvent")
    expect(injectedMcpRoutesSource).not.toContain('from "./injected-mcp-actions"')
    expect(injectedMcpRoutesSource).toContain('from "@dotagents/shared/remote-server-route-contracts"')
    expect(injectedMcpRoutesSource).toContain(
      "export type InjectedMcpRouteActions = SharedInjectedMcpRouteActions<FastifyRequest, FastifyReply>",
    )
    expect(injectedMcpRoutesSource).toContain(
      "export type RegisterInjectedMcpRoutesOptions = SharedInjectedMcpRouteOptions<FastifyRequest, FastifyReply>",
    )
    expect(injectedMcpRoutesSource).not.toContain("export interface InjectedMcpRouteActions")
    expect(injectedMcpRoutesSource).not.toContain("export interface RegisterInjectedMcpRoutesOptions")
    expect(injectedMcpDesktopActionsSource).toContain("export const injectedMcpDesktopActions")
    expect(injectedMcpDesktopActionsSource).toContain("handleInjectedMcpProtocolRequest")
    expect(injectedMcpDesktopActionsSource).toContain("listInjectedMcpTools")
    expect(injectedMcpDesktopActionsSource).toContain("callInjectedMcpTool")
    expect(mobileApiRoutesSource).not.toContain('from "./model-actions"')
    expect(mobileApiRoutesSource).not.toContain('from "./conversation-actions"')
    expect(mobileApiRoutesSource).not.toContain('from "./settings-actions"')
    expect(mobileApiRoutesSource).not.toContain('from "./operator-audit-actions"')
    expect(mobileApiRoutesSource).toContain('from "@dotagents/shared/remote-server-route-contracts"')
    expect(mobileApiRoutesSource).toContain(
      "export type MobileApiRouteActions = SharedMobileApiRouteActions<FastifyRequest, FastifyReply>",
    )
    expect(mobileApiRoutesSource).toContain(
      "export type RegisterMobileApiRoutesOptions = SharedMobileApiRouteOptions<FastifyRequest, FastifyReply>",
    )
    expect(mobileApiRoutesSource).not.toContain("export interface MobileApiRouteActions")
    expect(mobileApiRoutesSource).not.toContain("export interface RegisterMobileApiRoutesOptions")
    expect(mobileApiDesktopActionsSource).toContain("export const mobileApiDesktopActions")
    expect(mobileApiDesktopActionsSource).toContain("handleChatCompletionRequest")
    expect(mobileApiDesktopActionsSource).toContain("getModels")
    expect(mobileApiDesktopActionsSource).toContain("recordOperatorAuditEvent")
    expect(desktopAdaptersSource).toContain("authorizeRequest: authorizeRemoteServerRequest")
    expect(desktopAdaptersSource).toContain("generateApiKey: generateRemoteServerApiKey")
    expect(desktopAdaptersSource).toContain("resolveApiKeyReference: readDotAgentsSecretReference")
    expect(desktopAdaptersSource).toContain("resolveConfiguredApiKey: getResolvedRemoteServerApiKey")
    expect(desktopAdaptersSource).toContain("printTerminalQRCode")
    expect(sharedRouteContractsSource).toContain("export interface MobileApiRouteActions<Request = unknown, Reply = unknown>")
    expect(sharedRouteContractsSource).toContain("export interface MobileApiRouteOptions<Request = unknown, Reply = unknown>")
    expect(sharedRouteContractsSource).toContain("export interface OperatorRouteActions<Request = unknown>")
    expect(sharedRouteContractsSource).toContain("export interface OperatorRouteOptions<Request = unknown, Reply = unknown>")
    expect(sharedRouteContractsSource).toContain("export interface InjectedMcpRouteActions<Request = unknown, Reply = unknown>")
    expect(sharedRouteContractsSource).toContain("export interface InjectedMcpRouteOptions<Request = unknown, Reply = unknown>")
    expect(sharedRouteContractsSource).toContain("export type MobileApiRunAgentExecutor = AgentRunExecutor")
    expect(sharedRouteContractsSource).toContain("export type OperatorRunAgentExecutor = AgentRunExecutor")
    expect(sharedRouteContractsSource).toContain("export type RemoteServerRouteAuditContext")
    expect(sharedRouteContractsSource).not.toContain("Fastify")
    expect(sharedRouteContractsSource).not.toContain("Electron")
    expect(sharedControllerContractsSource).toContain("export type RemoteServerControllerConfigLike")
    expect(sharedControllerContractsSource).toContain("export interface RemoteServerConfigStore<")
    expect(sharedControllerContractsSource).toContain("export interface RemoteServerControllerAdapters<")
    expect(sharedControllerContractsSource).toContain("Request = unknown")
    expect(sharedControllerContractsSource).toContain("Reply = unknown")
    expect(sharedControllerContractsSource).toContain("export type RemoteServerRouteRegistrar<Server = unknown, Reply = unknown>")
    expect(sharedControllerContractsSource).toContain("export interface RemoteServerControllerOptions<")
    expect(sharedControllerContractsSource).toContain("export type RemoteServerRunAgentExecutor = AgentRunExecutor")
    expect(sharedControllerContractsSource).toContain("export interface RemoteServerController")
    expect(sharedControllerContractsSource).not.toContain("Fastify")
    expect(sharedControllerContractsSource).not.toContain("Electron")
  })

  it("keeps remote route action result contracts shared", () => {
    const mobileActionSources = [
      getAgentProfileActionsSource(),
      getConversationActionsSource(),
      getEmergencyStopActionsSource(),
      getKnowledgeNoteActionsSource(),
      getMcpServerActionsSource(),
      getModelActionsSource(),
      getProfileActionsSource(),
      getPushActionsSource(),
      getRepeatTaskActionsSource(),
      getSettingsActionsSource(),
      getSkillActionsSource(),
      getTtsActionsSource(),
    ]
    const operatorActionSources = [
      getOperatorAgentActionsSource(),
      getOperatorApiKeyActionsSource(),
      getOperatorAuditActionsSource(),
      getOperatorIntegrationActionsSource(),
      getOperatorLocalSpeechActionsSource(),
      getOperatorMcpActionsSource(),
      getOperatorMessageQueueActionsSource(),
      getOperatorModelPresetActionsSource(),
      getOperatorObservabilityActionsSource(),
      getOperatorRestartActionsSource(),
      getOperatorTunnelActionsSource(),
      getOperatorUpdaterActionsSource(),
    ]

    for (const source of mobileActionSources) {
      expect(source).toContain('from "@dotagents/shared/remote-server-route-contracts"')
      expect(source).toContain("= MobileApiActionResult")
      expect(source).not.toMatch(/export type \w+ActionResult = \{/)
    }

    for (const source of operatorActionSources) {
      expect(source).toContain('from "@dotagents/shared/remote-server-route-contracts"')
      expect(source).toContain("= OperatorRouteActionResult")
      expect(source).not.toMatch(/export type \w+ActionResult = \{/)
    }

    expect(getMessageQueueActionsSource()).toContain("export type QueuedMessageActionResult = {")
  })

  it("routes mobile chat requests through the shared agent runner", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const agentRunActionsSource = getAgentRunActionsSource()
    const sharedAgentRunUtilsSource = getSharedAgentRunUtilsSource()
    const remoteAgentRunnerSource = getRemoteAgentRunnerSource()
    const agentLoopRunnerSource = getAgentLoopRunnerSource()
    const chatCompletionActionsSource = getChatCompletionActionsSource()

    expect(sharedAgentRunUtilsSource).toContain("export interface AgentRunOptions")
    expect(sharedAgentRunUtilsSource).toContain("export type AgentRunResult")
    expect(sharedAgentRunUtilsSource).toContain("export type AgentRunExecutor")
    expect(agentRunActionsSource).toContain("export type RunAgentOptions = AgentRunOptions")
    expect(agentRunActionsSource).toContain("export type RunAgentResult = AgentRunResult")
    expect(chatCompletionActionsSource).toContain("export type ChatCompletionRunAgentExecutor = AgentRunExecutor")
    expect(mobileApiRoutesSource).toContain("actions.handleChatCompletionRequest(req.body, req.headers.origin, reply, runAgent)")
    expect(chatCompletionActionsSource).toContain("const result = await runAgent({ prompt, conversationId, profileId, onProgress })")
    expect(chatCompletionActionsSource).toContain("const result = await runAgent({ prompt, conversationId, profileId })")
    expect(source).toContain("export { runAgent }")
    expect(remoteAgentRunnerSource).toContain("return runRemoteAgent(options, notifyConversationHistoryChanged)")
    expect(agentRunActionsSource).toContain("processWithAgentMode(")
    expect(agentRunActionsSource).toContain("{ profileId, onProgress }")
    expect(source).not.toContain('from "./agent-runtime"')
    expect(source).not.toContain('from "./acp-main-agent"')
    expect(source).not.toContain("agentRuntime.runAgentTurn")
    expect(chatCompletionActionsSource).toContain("buildDotAgentsChatCompletionResponse({")
    expect(chatCompletionActionsSource).toContain("conversationId: result.conversationId")
    expect(chatCompletionActionsSource).toContain("conversationHistory: result.conversationHistory")
    expect(chatCompletionActionsSource).toContain("buildChatCompletionProgressSsePayload(update)")
    expect(chatCompletionActionsSource).toContain("sendMessageNotification(conversationId, conversationTitle, content)")
    expect(agentLoopRunnerSource).toContain("resolvePreferredTopLevelAcpAgentSelection({")
    expect(agentLoopRunnerSource).toContain("mainAgentMode: config.mainAgentMode")
    expect(agentLoopRunnerSource).toContain("processTranscriptWithACPAgent(text, {")
    expect(agentLoopRunnerSource).toContain("onProgress: options.onProgress")
  })

  it("exposes full skill instructions to the mobile prompt picker", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const skillActionsSource = getSkillActionsSource()
    const sharedSkillsApiSource = getSharedSkillsApiSource()

    expectRegisteredApiRoute(source, "GET", "skills")
    expectRegisteredApiRoute(source, "GET", "skill")
    expectRegisteredApiRoute(source, "POST", "skills")
    expectRegisteredApiRoute(source, "PATCH", "skill")
    expectRegisteredApiRoute(source, "DELETE", "skill")
    expectRegisteredApiRoute(source, "POST", "skillToggleProfile")
    expect(mobileApiRoutesSource).toContain("actions.getSkills()")
    expect(mobileApiRoutesSource).toContain("actions.getSkill(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.createSkill(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.updateSkill(params.id, req.body)")
    expect(mobileApiRoutesSource).toContain("actions.deleteSkill(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.toggleProfileSkill(params.id)")
    expect(skillActionsSource).toContain("getSkillsAction(skillActionOptions)")
    expect(skillActionsSource).toContain("getSkillAction(skillId, skillActionOptions)")
    expect(skillActionsSource).toContain("createSkillAction(body, skillActionOptions)")
    expect(skillActionsSource).toContain("updateSkillAction(skillId, body, skillActionOptions)")
    expect(skillActionsSource).toContain("deleteSkillAction(skillId, skillActionOptions)")
    expect(skillActionsSource).toContain("toggleProfileSkillAction(skillId, skillActionOptions)")
    expect(sharedSkillsApiSource).toContain("export interface SkillActionOptions")
    expect(sharedSkillsApiSource).toContain("export function getSkillsAction")
    expect(sharedSkillsApiSource).toContain("export function getSkillAction")
    expect(sharedSkillsApiSource).toContain("export function createSkillAction")
    expect(sharedSkillsApiSource).toContain("export function updateSkillAction")
    expect(sharedSkillsApiSource).toContain("export function deleteSkillAction")
    expect(sharedSkillsApiSource).toContain("export function toggleProfileSkillAction")
    expect(sharedSkillsApiSource).toContain("buildSkillsResponse(skills, currentProfile)")
    expect(sharedSkillsApiSource).toContain("parseSkillCreateRequestBody(body)")
    expect(sharedSkillsApiSource).toContain("parseSkillUpdateRequestBody(body)")
    expect(sharedSkillsApiSource).toContain("buildSkillMutationResponse(skill")
    expect(sharedSkillsApiSource).toContain("buildSkillDeleteResponse(skillId)")
    expect(sharedSkillsApiSource).toContain("buildSkillToggleResponse(skillId ?? \"\", updatedProfile)")
    expect(sharedSkillsApiSource).toContain("options.service.toggleProfileSkill(currentProfile.id, skillId ?? \"\", allSkillIds)")
    expect(sharedSkillsApiSource).not.toContain('from "./agent-profile-service"')
    expect(sharedSkillsApiSource).not.toContain('from "./skills-service"')
  })

  it("exposes remote server, tunnel, and Discord settings in the remote settings GET/PATCH routes", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const settingsActionsSource = getSettingsActionsSource()
    const sharedSettingsApiClientSource = getSharedSettingsApiClientSource()
    const settingsGetSection = getSection(
      mobileApiRoutesSource,
      getApiRouteRegistrationMarker(mobileApiRoutesSource, "GET", "settings"),
      '// PATCH /v1/settings - Update settings',
    )
    const settingsPatchSection = getSection(
      mobileApiRoutesSource,
      getApiRouteRegistrationMarker(mobileApiRoutesSource, "PATCH", "settings"),
      '// GET /v1/conversations/:id - Fetch conversation state for recovery',
    )

    expect(source).toContain("providerSecretMask: PROVIDER_SECRET_MASK")
    expect(source).toContain("remoteServerSecretMask: REMOTE_SERVER_SECRET_MASK")
    expect(source).toContain("discordSecretMask: DISCORD_SECRET_MASK")
    expect(source).toContain("langfuseSecretMask: PROVIDER_SECRET_MASK")
    expect(settingsGetSection).toContain("const result = actions.getSettings(providerSecretMask)")
    expect(settingsGetSection).toContain("reply.code(result.statusCode).send(result.body)")
    expect(settingsActionsSource).toContain("getSettingsAction(providerSecretMask, settingsActionOptions)")
    expect(settingsActionsSource).toContain("getMaskedRemoteServerApiKey: (config) => getMaskedRemoteServerApiKey(config.remoteServerApiKey)")
    expect(settingsActionsSource).toContain("getMaskedDiscordBotToken")
    expect(settingsActionsSource).toContain("getDiscordDefaultProfileId: (config) => getDiscordResolvedDefaultProfileId(config).profileId ?? \"\"")
    expect(settingsActionsSource).toContain("getAcpxAgents: () => agentProfileService.getAll()")
    expect(settingsActionsSource).toContain("p.connection.type === 'acpx'")
    expect(sharedSettingsApiClientSource).toContain("export interface SettingsActionOptions")
    expect(sharedSettingsApiClientSource).toContain("export function getSettingsAction")
    expect(sharedSettingsApiClientSource).toContain("buildSettingsResponse(cfg, {")
    expect(sharedSettingsApiClientSource).toContain("remoteServerApiKey: options.getMaskedRemoteServerApiKey(cfg)")
    expect(sharedSettingsApiClientSource).toContain("discordBotToken: options.getMaskedDiscordBotToken(cfg)")
    expect(sharedSettingsApiClientSource).toContain("discordDefaultProfileId: options.getDiscordDefaultProfileId(cfg)")
    expect(sharedSettingsApiClientSource).toContain("acpxAgents: options.getAcpxAgents()")

    expect(settingsPatchSection).toContain("providerSecretMask")
    expect(settingsPatchSection).toContain("remoteServerSecretMask")
    expect(settingsPatchSection).toContain("discordSecretMask")
    expect(settingsPatchSection).toContain("langfuseSecretMask")
    expect(settingsPatchSection).toContain("const result = await actions.updateSettings(req.body, {")
    expect(settingsPatchSection).toContain("scheduleRemoteServerLifecycleActionAfterReply(reply, result.remoteServerLifecycleAction)")
    expect(settingsPatchSection).toContain("actions.recordOperatorAuditEvent(req, result.auditContext)")
    expect(settingsPatchSection).toContain("reply.code(result.statusCode).send(result.body)")
    expect(settingsActionsSource).toContain("updateSettingsAction(body, masks, settingsActionOptions)")
    expect(sharedSettingsApiClientSource).toContain("export async function updateSettingsAction")
    expect(sharedSettingsApiClientSource).toContain("const requestBody = getSettingsUpdateRequestRecord(body)")
    expect(sharedSettingsApiClientSource).toContain("buildSettingsUpdatePatch(requestBody, cfg, masks)")
    expect(sharedSettingsApiClientSource).toContain("const remoteServerLifecycleAction = getRemoteServerLifecycleAction(cfg, nextConfig)")
    expect(sharedSettingsApiClientSource).toContain("options.getDiscordLifecycleAction(cfg, nextConfig)")
    expect(sharedSettingsApiClientSource).toContain("await options.applyDiscordLifecycleAction(discordLifecycleAction)")
    expect(sharedSettingsApiClientSource).toContain("await options.applyWhatsappToggle(prevEnabled, updates.whatsappEnabled)")
    expect(sharedSettingsApiClientSource).not.toContain('from "./config"')
  })

  it("delegates emergency stop route behavior to emergency stop actions", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const emergencyStopActionsSource = getEmergencyStopActionsSource()
    const sharedSettingsApiClientSource = getSharedSettingsApiClientSource()

    expectRegisteredApiRoute(source, "POST", "emergencyStop")
    expect(mobileApiRoutesSource).toContain("actions.triggerEmergencyStop()")
    expect(emergencyStopActionsSource).toContain("triggerEmergencyStopAction(emergencyStopActionOptions)")
    expect(sharedSettingsApiClientSource).toContain("export interface EmergencyStopActionOptions")
    expect(sharedSettingsApiClientSource).toContain("export async function triggerEmergencyStopAction")
    expect(sharedSettingsApiClientSource).toContain("await options.stopAll()")
    expect(sharedSettingsApiClientSource).toContain("buildEmergencyStopResponse(before, after)")
    expect(sharedSettingsApiClientSource).toContain("buildEmergencyStopErrorResponse(caughtError)")
    expect(sharedSettingsApiClientSource).not.toContain('from "./emergency-stop"')
    expect(sharedSettingsApiClientSource).not.toContain("diagnosticsService")
  })

  it("delegates profile route behavior to profile actions", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const profileActionsSource = getProfileActionsSource()
    const sharedProfileApiSource = getSharedProfileApiSource()

    expectRegisteredApiRoute(source, "GET", "profiles")
    expectRegisteredApiRoute(source, "GET", "currentProfile")
    expectRegisteredApiRoute(source, "POST", "currentProfile")
    expectRegisteredApiRoute(source, "GET", "profileExport")
    expectRegisteredApiRoute(source, "POST", "profileImport")
    expect(mobileApiRoutesSource).toContain("actions.getProfiles()")
    expect(mobileApiRoutesSource).toContain("actions.getCurrentProfile()")
    expect(mobileApiRoutesSource).toContain("actions.setCurrentProfile(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.exportProfile(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.importProfile(req.body)")
    expect(profileActionsSource).toContain("getProfilesAction(profileActionOptions)")
    expect(profileActionsSource).toContain("getCurrentProfileAction(profileActionOptions)")
    expect(profileActionsSource).toContain("setCurrentProfileAction(body, profileActionOptions)")
    expect(profileActionsSource).toContain("exportProfileAction(id, profileActionOptions)")
    expect(profileActionsSource).toContain("importProfileAction(body, profileActionOptions)")
    expect(sharedProfileApiSource).toContain("export interface ProfileActionOptions")
    expect(sharedProfileApiSource).toContain("export function getProfilesAction")
    expect(sharedProfileApiSource).toContain("export function getCurrentProfileAction")
    expect(sharedProfileApiSource).toContain("export function setCurrentProfileAction")
    expect(sharedProfileApiSource).toContain("export function exportProfileAction")
    expect(sharedProfileApiSource).toContain("export function importProfileAction")
    expect(sharedProfileApiSource).toContain(
      "buildProfilesResponse(profiles, currentProfile ?? undefined)",
    )
    expect(sharedProfileApiSource).toContain("formatProfileForApi(profile, { includeDetails: true })")
    expect(sharedProfileApiSource).toContain("parseSetCurrentProfileRequestBody(body)")
    expect(sharedProfileApiSource).toContain("options.applyCurrentProfile?.(profile)")
    expect(sharedProfileApiSource).not.toContain('from "./agent-profile-service"')
    expect(sharedProfileApiSource).not.toContain('from "./mcp-service"')
    expect(profileActionsSource).toContain("toolConfigToMcpServerConfig(profile.toolConfig)")
    expect(profileActionsSource).toContain("mcpService.applyProfileMcpConfig(")
  })

  it("delegates agent profile route behavior to agent profile actions", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const agentProfileActionsSource = getAgentProfileActionsSource()
    const sharedProfileApiSource = getSharedProfileApiSource()

    expectRegisteredApiRoute(source, "GET", "agentProfiles")
    expectRegisteredApiRoute(source, "POST", "agentProfileToggle")
    expectRegisteredApiRoute(source, "GET", "agentProfile")
    expectRegisteredApiRoute(source, "POST", "agentProfiles")
    expectRegisteredApiRoute(source, "PATCH", "agentProfile")
    expectRegisteredApiRoute(source, "DELETE", "agentProfile")
    expect(mobileApiRoutesSource).toContain("actions.getAgentProfiles(query.role)")
    expect(mobileApiRoutesSource).toContain("actions.toggleAgentProfile(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.getAgentProfile(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.createAgentProfile(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.updateAgentProfile(params.id, req.body)")
    expect(mobileApiRoutesSource).toContain("actions.deleteAgentProfile(params.id)")
    expect(agentProfileActionsSource).toContain("getAgentProfilesAction(role, agentProfileActionOptions)")
    expect(agentProfileActionsSource).toContain("toggleAgentProfileAction(id, agentProfileActionOptions)")
    expect(agentProfileActionsSource).toContain("getAgentProfileAction(id, agentProfileActionOptions)")
    expect(agentProfileActionsSource).toContain("createAgentProfileAction(body, agentProfileActionOptions)")
    expect(agentProfileActionsSource).toContain("updateAgentProfileAction(id, body, agentProfileActionOptions)")
    expect(agentProfileActionsSource).toContain("deleteAgentProfileAction(id, agentProfileActionOptions)")
    expect(sharedProfileApiSource).toContain("export interface AgentProfileActionOptions")
    expect(sharedProfileApiSource).toContain("export function getAgentProfilesAction")
    expect(sharedProfileApiSource).toContain("export function toggleAgentProfileAction")
    expect(sharedProfileApiSource).toContain("export function getAgentProfileAction")
    expect(sharedProfileApiSource).toContain("export function createAgentProfileAction")
    expect(sharedProfileApiSource).toContain("export function updateAgentProfileAction")
    expect(sharedProfileApiSource).toContain("export function deleteAgentProfileAction")
    expect(sharedProfileApiSource).toContain("filterAgentProfilesByRole(profiles, role)")
    expect(sharedProfileApiSource).toContain("buildAgentProfilesResponse(profiles)")
    expect(sharedProfileApiSource).toContain("buildAgentProfileToggleResponse(profileId, updated?.enabled ?? !profile.enabled)")
    expect(sharedProfileApiSource).toContain("parseAgentProfileCreateRequestBody(body)")
    expect(sharedProfileApiSource).toContain("parseAgentProfileUpdateRequestBody(body")
    expect(sharedProfileApiSource).toContain("buildAgentProfileMutationDetailResponse(updatedProfile)")
    expect(sharedProfileApiSource).toContain("buildAgentProfileDeleteResponse()")
    expect(sharedProfileApiSource).not.toContain('from "./agent-profile-service"')
  })

  it("delegates model, MCP server, TTS, and push routes to action modules", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const modelActionsSource = getModelActionsSource()
    const mcpServerActionsSource = getMcpServerActionsSource()
    const sharedMcpApiSource = getSharedMcpApiSource()
    const sharedChatUtilsSource = getSharedChatUtilsSource()
    const ttsActionsSource = getTtsActionsSource()
    const sharedTtsApiSource = getSharedTtsApiSource()
    const pushActionsSource = getPushActionsSource()
    const sharedPushNotificationsSource = getSharedPushNotificationsSource()

    expectRegisteredApiRoute(source, "GET", "models")
    expectRegisteredApiRoute(source, "GET", "modelsByProvider")
    expectRegisteredApiRoute(source, "GET", "mcpServers")
    expectRegisteredApiRoute(source, "POST", "mcpServerToggle")
    expectRegisteredApiRoute(source, "POST", "ttsSpeak")
    expectRegisteredApiRoute(source, "POST", "pushRegister")
    expectRegisteredApiRoute(source, "POST", "pushUnregister")
    expectRegisteredApiRoute(source, "GET", "pushStatus")
    expectRegisteredApiRoute(source, "POST", "pushClearBadge")
    expect(mobileApiRoutesSource).toContain("actions.getModels()")
    expect(mobileApiRoutesSource).toContain("actions.getProviderModels(params.providerId)")
    expect(mobileApiRoutesSource).toContain("actions.getMcpServers()")
    expect(mobileApiRoutesSource).toContain("actions.toggleMcpServer(params.name, req.body)")
    expect(mobileApiRoutesSource).toContain("actions.synthesizeSpeech(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.registerPushToken(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.unregisterPushToken(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.getPushStatus()")
    expect(mobileApiRoutesSource).toContain("actions.clearPushBadge(req.body)")
    expect(modelActionsSource).toContain("getModelsAction(modelActionOptions)")
    expect(modelActionsSource).toContain("getProviderModelsAction(providerId, modelActionOptions)")
    expect(sharedChatUtilsSource).toContain("export interface ModelActionOptions")
    expect(sharedChatUtilsSource).toContain("export function getModelsAction")
    expect(sharedChatUtilsSource).toContain("export async function getProviderModelsAction")
    expect(sharedChatUtilsSource).toContain("resolveActiveModelId(options.getConfig())")
    expect(sharedChatUtilsSource).toContain("options.fetchAvailableModels(providerId)")
    expect(sharedChatUtilsSource).not.toContain("models-service")
    expect(sharedChatUtilsSource).not.toContain("configStore")
    expect(mcpServerActionsSource).toContain("getMcpServersAction(mcpServerActionOptions)")
    expect(mcpServerActionsSource).toContain("toggleMcpServerAction(serverName, body, mcpServerActionOptions)")
    expect(sharedMcpApiSource).toContain("export interface McpServerActionService")
    expect(sharedMcpApiSource).toContain("export function getMcpServersAction")
    expect(sharedMcpApiSource).toContain("export function toggleMcpServerAction")
    expect(sharedMcpApiSource).toContain("buildMcpServersResponse(options.service.getServerStatus())")
    expect(sharedMcpApiSource).toContain("options.service.setServerRuntimeEnabled(normalizedServerName, enabled)")
    expect(sharedMcpApiSource).not.toContain("mcpService")
    expect(sharedMcpApiSource).not.toContain("diagnosticsService")
    expect(ttsActionsSource).toContain("synthesizeSpeechAction(body, ttsActionOptions)")
    expect(sharedTtsApiSource).toContain("export interface TtsActionOptions")
    expect(sharedTtsApiSource).toContain("export async function synthesizeSpeechAction")
    expect(sharedTtsApiSource).toContain("parseTtsSpeakRequestBody(body)")
    expect(sharedTtsApiSource).toContain("options.generateSpeech(parsedRequest.request, options.getConfig())")
    expect(sharedTtsApiSource).toContain("options.encodeAudioBody(result.audio)")
    expect(sharedTtsApiSource).not.toContain("tts-service")
    expect(sharedTtsApiSource).not.toContain("configStore")
    expect(pushActionsSource).toContain("registerPushTokenAction(body, pushActionOptions)")
    expect(pushActionsSource).toContain("unregisterPushTokenAction(body, pushActionOptions)")
    expect(pushActionsSource).toContain("getPushStatusAction(pushActionOptions)")
    expect(pushActionsSource).toContain("clearPushBadgeAction(body, pushActionOptions)")
    expect(sharedPushNotificationsSource).toContain("export interface PushActionTokenStore")
    expect(sharedPushNotificationsSource).toContain("export function registerPushTokenAction")
    expect(sharedPushNotificationsSource).toContain("export function unregisterPushTokenAction")
    expect(sharedPushNotificationsSource).toContain("export function getPushStatusAction")
    expect(sharedPushNotificationsSource).toContain("export function clearPushBadgeAction")
    expect(sharedPushNotificationsSource).toContain("options.tokenStore.savePushNotificationTokens(registrationResult.tokens)")
    expect(sharedPushNotificationsSource).not.toContain("configStore")
    expect(sharedPushNotificationsSource).not.toContain("push-notification-service")
  })

  it("delegates conversation sync and media routes to conversation actions", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const conversationActionsSource = getConversationActionsSource()
    const sharedConversationSyncSource = getSharedConversationSyncSource()

    expectRegisteredApiRoute(source, "GET", "conversation")
    expectRegisteredApiRoute(source, "GET", "conversationVideoAsset")
    expectRegisteredApiRoute(source, "GET", "conversations")
    expectRegisteredApiRoute(source, "POST", "conversations")
    expectRegisteredApiRoute(source, "PUT", "conversation")
    expect(mobileApiRoutesSource).toContain("actions.getConversation(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.getConversationVideoAsset(params.id, params.fileName, req.headers.range)")
    expect(mobileApiRoutesSource).toContain("actions.getConversations()")
    expect(mobileApiRoutesSource).toContain("actions.createConversation(req.body, notifyConversationHistoryChanged)")
    expect(mobileApiRoutesSource).toContain("actions.updateConversation(params.id, req.body, notifyConversationHistoryChanged)")
    expect(conversationActionsSource).toContain("getConversationAction(id, conversationActionOptions)")
    expect(conversationActionsSource).toContain("getConversationsAction(conversationActionOptions)")
    expect(conversationActionsSource).toContain("createConversationAction(body, onChanged, conversationActionOptions)")
    expect(conversationActionsSource).toContain("updateConversationAction(id, body, onChanged, conversationActionOptions)")
    expect(sharedConversationSyncSource).toContain("export interface ConversationActionOptions")
    expect(sharedConversationSyncSource).toContain("export async function getConversationAction")
    expect(sharedConversationSyncSource).toContain("export async function getConversationsAction")
    expect(sharedConversationSyncSource).toContain("export async function createConversationAction")
    expect(sharedConversationSyncSource).toContain("export async function updateConversationAction")
    expect(sharedConversationSyncSource).toContain("options.validateConversationId(conversationId)")
    expect(sharedConversationSyncSource).toContain("options.service.loadConversation(conversationId)")
    expect(sharedConversationSyncSource).toContain("buildServerConversationFullResponse(conversation, { includeMetadata: true })")
    expect(sharedConversationSyncSource).toContain("buildServerConversationsResponse(conversations)")
    expect(sharedConversationSyncSource).toContain("parseCreateConversationRequestBody(body)")
    expect(sharedConversationSyncSource).toContain("buildNewServerConversation(conversationId, parsedRequest.request, timestamp)")
    expect(sharedConversationSyncSource).toContain("parseUpdateConversationRequestBody(body)")
    expect(sharedConversationSyncSource).toContain("applyServerConversationUpdate(conversation, parsedRequest.request, timestamp)")
    expect(sharedConversationSyncSource).not.toContain('from "./conversation-service"')
    expect(conversationActionsSource).toContain("getConversationVideoAssetPath(conversationId, fileName ?? \"\")")
    expect(conversationActionsSource).toContain("getConversationVideoByteRange(rangeHeader, stat.size)")
    expect(conversationActionsSource).toContain("fs.createReadStream(assetPath")
  })

  it("registers the operator remote-operations endpoints", () => {
    const source = getRemoteServerSource()
    const operatorRoutesSource = getOperatorRoutesSource()
    const operatorSection = getSection(
      operatorRoutesSource,
      '// Operator/Admin Endpoints',
      "  // GET /v1/operator/mcp - Operator-level MCP summary",
    )
    const operatorRoutes: Array<[string, RemoteServerApiPathKey]> = [
      ["GET", "operatorStatus"],
      ["GET", "operatorHealth"],
      ["GET", "operatorErrors"],
      ["GET", "operatorLogs"],
      ["GET", "operatorAudit"],
      ["GET", "operatorConversations"],
      ["GET", "operatorRemoteServer"],
      ["GET", "operatorTunnel"],
      ["GET", "operatorTunnelSetup"],
      ["GET", "operatorIntegrations"],
      ["GET", "operatorUpdater"],
      ["POST", "operatorUpdaterCheck"],
      ["POST", "operatorUpdaterDownloadLatest"],
      ["POST", "operatorUpdaterRevealDownload"],
      ["POST", "operatorUpdaterOpenDownload"],
      ["POST", "operatorUpdaterOpenReleases"],
      ["GET", "operatorDiscord"],
      ["GET", "operatorDiscordLogs"],
      ["POST", "operatorDiscordConnect"],
      ["POST", "operatorDiscordDisconnect"],
      ["POST", "operatorDiscordClearLogs"],
      ["GET", "operatorWhatsApp"],
      ["POST", "operatorWhatsAppConnect"],
      ["POST", "operatorWhatsAppLogout"],
      ["GET", "operatorLocalSpeechModels"],
      ["GET", "operatorLocalSpeechModel"],
      ["POST", "operatorLocalSpeechModelDownload"],
      ["GET", "operatorModelPresets"],
      ["POST", "operatorModelPresets"],
      ["PATCH", "operatorModelPreset"],
      ["DELETE", "operatorModelPreset"],
      ["POST", "operatorTunnelStart"],
      ["POST", "operatorTunnelStop"],
      ["POST", "operatorRestartRemoteServer"],
      ["POST", "operatorRestartApp"],
      ["POST", "operatorRunAgent"],
      ["POST", "operatorRotateApiKey"],
    ]

    for (const [method, routeKey] of operatorRoutes) {
      expect(operatorSection).toContain(getApiRouteRegistrationMarker(operatorRoutesSource, method, routeKey))
      expectRegisteredApiRoute(source, method, routeKey)
    }
  })

  it("keeps operator summaries redacted and restart actions scheduled", () => {
    const source = getRemoteServerSource()
    const controllerSource = getRemoteServerControllerSource()
    const desktopAdaptersSource = getRemoteServerDesktopAdaptersSource()
    const operatorLifecycleSection = getSection(
      controllerSource,
      "function scheduleRemoteServerLifecycleActionAfterReply",
      "async function startRemoteServerForced",
    )
    const operatorTaskSchedulerSection = getSection(
      controllerSource,
      "function scheduleTaskAfterReply",
      "function scheduleRemoteServerLifecycleActionAfterReply",
    )
    const operatorRoutesSource = getOperatorRoutesSource()
    const operatorSection = getSection(
      operatorRoutesSource,
      '// Operator/Admin Endpoints',
      "  // GET /v1/operator/mcp - Operator-level MCP summary",
    )
    const operatorTunnelActionsSource = getOperatorTunnelActionsSource()
    const operatorUpdaterActionsSource = getOperatorUpdaterActionsSource()
    const operatorIntegrationActionsSource = getOperatorIntegrationActionsSource()
    const operatorIntegrationSummarySource = getOperatorIntegrationSummarySource()
    const operatorObservabilityActionsSource = getOperatorObservabilityActionsSource()
    const operatorAuditActionsSource = getOperatorAuditActionsSource()
    const sharedOperatorAuditStoreSource = getSharedOperatorAuditStoreSource()
    const sharedOperatorActionsSource = getSharedOperatorActionsSource()
    const operatorApiKeyActionsSource = getOperatorApiKeyActionsSource()
    const operatorRestartActionsSource = getOperatorRestartActionsSource()

    expect(operatorRoutesSource).toContain("actions.getOperatorStatus(getRemoteServerStatus())")
    expect(operatorRoutesSource).toContain("actions.getOperatorHealth()")
    expect(operatorRoutesSource).toContain("actions.getOperatorErrors(query.count)")
    expect(operatorRoutesSource).toContain("actions.getOperatorLogs(query.count, query.level)")
    expect(operatorRoutesSource).toContain("actions.getOperatorConversations(query.count)")
    expect(operatorRoutesSource).toContain("actions.getOperatorRemoteServer(getRemoteServerStatus())")
    expect(operatorObservabilityActionsSource).toContain("getOperatorStatusAction(remoteServerStatus, observabilityActionOptions)")
    expect(operatorObservabilityActionsSource).toContain("getOperatorHealthAction(observabilityActionOptions)")
    expect(operatorObservabilityActionsSource).toContain("getOperatorErrorsAction(count, observabilityActionOptions)")
    expect(operatorObservabilityActionsSource).toContain("getOperatorLogsAction(count, level, observabilityActionOptions)")
    expect(operatorObservabilityActionsSource).toContain("getOperatorConversationsAction(count, observabilityActionOptions)")
    expect(operatorObservabilityActionsSource).toContain("getOperatorRemoteServerAction(remoteServerStatus)")
    expect(operatorObservabilityActionsSource).toContain("service: {")
    expect(operatorObservabilityActionsSource).toContain("getTunnelStatus: getCloudflareTunnelStatus")
    expect(operatorObservabilityActionsSource).toContain("getSystemMetrics: getOperatorSystemMetrics")
    expect(sharedOperatorActionsSource).toContain("export async function getOperatorStatusAction(")
    expect(sharedOperatorActionsSource).toContain("export async function getOperatorHealthAction(")
    expect(sharedOperatorActionsSource).toContain("export function getOperatorErrorsAction(")
    expect(sharedOperatorActionsSource).toContain("export function getOperatorLogsAction(")
    expect(operatorRoutesSource).toContain("actions.getOperatorAudit(query.count)")
    expect(controllerSource).toContain("adapters.recordOperatorResponseAuditEvent(req, reply)")
    expect(desktopAdaptersSource).toContain("recordOperatorResponseAuditEvent")
    expect(operatorAuditActionsSource).toContain("buildOperatorAuditResponse")
    expect(operatorAuditActionsSource).toContain("buildOperatorResponseAuditContext(request, reply, getOperatorAuditContext(request))")
    expect(operatorAuditActionsSource).toContain("recordOperatorAuditEvent(request, auditContext)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorConversationsResponse(history, count)")
    expect(sharedOperatorActionsSource).toContain("normalizeOperatorLogLevel(level)")
    expect(sharedOperatorActionsSource).toContain("clampOperatorCount(count")
    expect(operatorRoutesSource).toContain("actions.getOperatorIntegrations()")
    expect(operatorRoutesSource).toContain("actions.getOperatorDiscord()")
    expect(operatorRoutesSource).toContain("actions.getOperatorDiscordLogs(query.count)")
    expect(operatorRoutesSource).toContain("actions.connectOperatorDiscord()")
    expect(operatorRoutesSource).toContain("actions.disconnectOperatorDiscord()")
    expect(operatorRoutesSource).toContain("actions.clearOperatorDiscordLogs()")
    expect(operatorRoutesSource).toContain("actions.getOperatorWhatsApp()")
    expect(operatorRoutesSource).toContain("actions.connectOperatorWhatsApp()")
    expect(operatorRoutesSource).toContain("actions.logoutOperatorWhatsApp()")
    expect(operatorIntegrationActionsSource).toContain("discordService.start()")
    expect(operatorIntegrationActionsSource).toContain("discordService.stop()")
    expect(operatorIntegrationActionsSource).toContain("discordService.clearLogs()")
    expect(operatorIntegrationActionsSource).toContain("buildOperatorDiscordIntegrationSummary")
    expect(operatorIntegrationActionsSource).toContain("buildOperatorDiscordLogsResponse")
    expect(operatorIntegrationActionsSource).toContain("mcpService.executeToolCall")
    expect(operatorIntegrationActionsSource).toContain("WHATSAPP_SERVER_NAME")
    expect(operatorIntegrationActionsSource).toContain("getOperatorMcpToolResultText")
    expect(operatorIntegrationActionsSource).toContain("buildOperatorWhatsAppActionSuccessResponse")
    expect(operatorIntegrationSummarySource).toContain("buildOperatorIntegrationsSummary")
    expect(operatorIntegrationSummarySource).toContain("getOperatorWhatsAppIntegrationSummary")
    expect(operatorIntegrationSummarySource).toContain("buildOperatorWhatsAppIntegrationSummary")
    expect(operatorIntegrationSummarySource).toContain("mergeOperatorWhatsAppStatusPayload")
    expect(operatorObservabilityActionsSource).toContain('from "./operator-integration-summary"')
    expect(operatorObservabilityActionsSource).not.toContain('from "./operator-integration-actions"')
    expect(operatorLifecycleSection).toContain("scheduleRemoteServerRestartFromOperator")
    expect(operatorLifecycleSection).toContain("scheduleAppRestartFromOperator")
    expect(operatorLifecycleSection).toContain("scheduleRemoteServerLifecycleActionAfterReply")
    expect(operatorRoutesSource).toContain("actions.getOperatorTunnel()")
    expect(operatorRoutesSource).toContain("actions.getOperatorTunnelSetup()")
    expect(operatorRoutesSource).toContain("actions.startOperatorTunnel(getRemoteServerStatus().running)")
    expect(operatorRoutesSource).toContain("actions.stopOperatorTunnel()")
    expect(operatorTunnelActionsSource).toContain("getOperatorTunnelAction(tunnelActionOptions)")
    expect(operatorTunnelActionsSource).toContain("getOperatorTunnelSetupAction(tunnelActionOptions)")
    expect(operatorTunnelActionsSource).toContain("startOperatorTunnelAction(remoteServerRunning, tunnelActionOptions)")
    expect(operatorTunnelActionsSource).toContain("stopOperatorTunnelAction(tunnelActionOptions)")
    expect(operatorTunnelActionsSource).toContain("service: {")
    expect(operatorTunnelActionsSource).toContain("checkCloudflaredInstalled")
    expect(operatorTunnelActionsSource).toContain("listCloudflareTunnels")
    expect(operatorTunnelActionsSource).toContain("startNamedCloudflareTunnel")
    expect(operatorTunnelActionsSource).toContain("startCloudflareTunnel")
    expect(operatorTunnelActionsSource).toContain("stopCloudflareTunnel")
    expect(sharedOperatorActionsSource).toContain("export async function getOperatorTunnelSetupAction(")
    expect(sharedOperatorActionsSource).toContain("export async function startOperatorTunnelAction(")
    expect(sharedOperatorActionsSource).toContain("getConfiguredCloudflareTunnelStartPlan(cfg)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorTunnelStartActionResponse(result)")
    expect(operatorRoutesSource).toContain("actions.getOperatorUpdater(getAppVersion())")
    expect(operatorRoutesSource).toContain("actions.checkOperatorUpdater()")
    expect(operatorRoutesSource).toContain("actions.downloadLatestOperatorUpdateAsset()")
    expect(operatorRoutesSource).toContain("actions.revealOperatorUpdateAsset()")
    expect(operatorRoutesSource).toContain("actions.openOperatorUpdateAsset()")
    expect(operatorRoutesSource).toContain("actions.openOperatorReleasesPage()")
    expect(operatorUpdaterActionsSource).toContain("getOperatorUpdaterAction(currentVersion, MANUAL_RELEASES_URL, updaterActionOptions)")
    expect(operatorUpdaterActionsSource).toContain("checkOperatorUpdaterAction(MANUAL_RELEASES_URL, updaterActionOptions)")
    expect(operatorUpdaterActionsSource).toContain("downloadLatestOperatorUpdateAssetAction(updaterActionOptions)")
    expect(operatorUpdaterActionsSource).toContain("openOperatorReleasesPageAction(updaterActionOptions)")
    expect(operatorUpdaterActionsSource).toContain("service: {")
    expect(operatorUpdaterActionsSource).toContain("checkForUpdatesAndDownload")
    expect(operatorUpdaterActionsSource).toContain("downloadLatestReleaseAsset")
    expect(operatorUpdaterActionsSource).toContain("revealDownloadedReleaseAsset")
    expect(operatorUpdaterActionsSource).toContain("openDownloadedReleaseAsset")
    expect(operatorUpdaterActionsSource).toContain("openManualReleasesPage")
    expect(sharedOperatorActionsSource).toContain("export function getOperatorUpdaterAction(")
    expect(sharedOperatorActionsSource).toContain("export async function checkOperatorUpdaterAction(")
    expect(sharedOperatorActionsSource).toContain("buildOperatorUpdaterStatus({")
    expect(sharedOperatorActionsSource).toContain("buildOperatorUpdaterDownloadLatestActionResponse(result)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorActionErrorResponse(")
    expect(sharedOperatorActionsSource).toContain('"updater-download-latest"')
    expect(operatorAuditActionsSource).toContain("createOperatorAuditLogStore({")
    expect(operatorAuditActionsSource).toContain("limit: DEFAULT_OPERATOR_AUDIT_LOG_LIMIT")
    expect(operatorAuditActionsSource).toContain("operator-audit-log.jsonl")
    expect(operatorAuditActionsSource).toContain("function ensureOperatorAuditLogDirectory")
    expect(operatorAuditActionsSource).toContain("operatorAuditLogStore.append(")
    expect(operatorAuditActionsSource).toContain("operatorAuditLogStore.getEntries()")
    expect(sharedOperatorAuditStoreSource).toContain("export const DEFAULT_OPERATOR_AUDIT_LOG_LIMIT = 200")
    expect(sharedOperatorAuditStoreSource).toContain("export function createOperatorAuditLogStore")
    expect(sharedOperatorAuditStoreSource).toContain("parseOperatorAuditLogEntries(raw, limit)")
    expect(sharedOperatorAuditStoreSource).toContain("appendOperatorAuditLogEntry(entries, entry, limit)")
    expect(sharedOperatorAuditStoreSource).toContain("serializeOperatorAuditLogEntries(entries)")
    expect(sharedOperatorAuditStoreSource).not.toContain("fs.")
    expect(sharedOperatorAuditStoreSource).not.toContain("electron")
    expect(controllerSource).toContain("remoteServerOperatorAllowDeviceIds")
    expect(controllerSource).toContain("adapters.authorizeRequest(req, {")
    expect(controllerSource).toContain("currentApiKey: adapters.resolveConfiguredApiKey(current)")
    expect(controllerSource).toContain("trustedDeviceIds: current.remoteServerOperatorAllowDeviceIds ?? []")
    expect(desktopAdaptersSource).toContain("authorizeRequest: authorizeRemoteServerRequest")
    expect(desktopAdaptersSource).toContain("resolveConfiguredApiKey: getResolvedRemoteServerApiKey")
    expect(operatorAuditActionsSource).toContain("buildRejectedOperatorDeviceAuditEntry")
    expect(controllerSource).toContain("adapters.recordRejectedOperatorDeviceAttempt(req, authDecision.auditFailureReason)")
    expect(controllerSource).toContain("authDecision.auditFailureReason")
    expect(controllerSource).toContain("reply.code(authDecision.statusCode).send({ error: authDecision.error })")
    expect(operatorAuditActionsSource).toContain("fs.appendFileSync(operatorAuditLogPath")
    expect(operatorAuditActionsSource).toContain("getOperatorAuditDeviceId(request)")
    expect(operatorAuditActionsSource).toContain("getOperatorAuditSource(request)")
    expect(operatorAuditActionsSource).toContain("function recordOperatorAuditEvent")
    expect(operatorAuditActionsSource).toContain("buildOperatorAuditResponse(operatorAuditLogStore.getEntries(), count)")
    expect(operatorTaskSchedulerSection).toContain("reply.raw.once(\"finish\", run)")
    expect(operatorLifecycleSection).toContain("void restartRemoteServer().catch")
    expect(operatorLifecycleSection).toContain("relaunchApp()")
    expect(operatorLifecycleSection).toContain("quitApp()")
    expect(source).toContain("relaunchApp: () => app.relaunch()")
    expect(source).toContain("quitApp: () => app.quit()")
    expect(operatorSection).toContain("actions.restartOperatorRemoteServer(getRemoteServerStatus().running)")
    expect(operatorSection).toContain("actions.restartOperatorApp(getAppVersion())")
    expect(operatorSection).toContain("scheduleRemoteServerRestartFromOperator()")
    expect(operatorSection).toContain("scheduleAppRestartFromOperator()")
    expect(operatorRestartActionsSource).toContain("restartOperatorRemoteServerAction(isRunning)")
    expect(operatorRestartActionsSource).toContain("restartOperatorAppAction(appVersion)")
    expect(sharedOperatorActionsSource).toContain("export function restartOperatorRemoteServerAction(")
    expect(sharedOperatorActionsSource).toContain("buildOperatorRestartRemoteServerActionResponse(isRunning)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorRestartAppActionResponse(appVersion)")
    expect(sharedOperatorActionsSource).toContain("auditContext: buildOperatorActionAuditContext(body)")
    expect(operatorSection).toContain("actions.rotateOperatorRemoteServerApiKey()")
    expect(operatorSection).toContain("scheduleRemoteServerRestartAfterReply(reply)")
    expect(operatorApiKeyActionsSource).toContain("rotateOperatorRemoteServerApiKeyAction(apiKeyActionOptions)")
    expect(operatorApiKeyActionsSource).toContain("generateRemoteServerApiKey()")
    expect(operatorApiKeyActionsSource).toContain("generateApiKey: generateRemoteServerApiKey")
    expect(sharedOperatorActionsSource).toContain("buildOperatorApiKeyRotationResponse(apiKey)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorApiKeyRotationAuditContext()")
    expect(sharedOperatorActionsSource).toContain("buildOperatorApiKeyRotationFailureAuditContext()")
    // Runtime status shaping stays shared while desktop supplies process and service state.
    expect(sharedOperatorActionsSource).toContain("buildOperatorRuntimeStatus({")
    expect(sharedOperatorActionsSource).toContain("system: options.service.getSystemMetrics()")
    expect(operatorObservabilityActionsSource).toContain("function getOperatorSystemMetrics()")
    expect(operatorObservabilityActionsSource).toContain("os.platform()")
    expect(operatorObservabilityActionsSource).toContain("process.memoryUsage()")
    expect(operatorObservabilityActionsSource).toContain("os.hostname()")
    expect(operatorObservabilityActionsSource).toContain("getActiveSessions: () => agentSessionTracker.getActiveSessions()")
    expect(operatorObservabilityActionsSource).toContain("getRecentSessions: (count) => agentSessionTracker.getRecentSessions(count)")
    // Conversations endpoint
    expect(sharedOperatorActionsSource).toContain("buildOperatorConversationsResponse(history, count)")
    expect(operatorObservabilityActionsSource).toContain("getConversationHistory: () => conversationService.getConversationHistory()")
    expectRegisteredApiRoute(source, "GET", "operatorConversations")
    // Run-agent endpoint
    const agentRunActionsSource = getAgentRunActionsSource()
    expectRegisteredApiRoute(source, "POST", "operatorRunAgent")
    expect(agentRunActionsSource).toContain("processWithAgentMode(")
    expect(agentRunActionsSource).toContain("{ profileId, onProgress }")
    const operatorAgentActionsSource = getOperatorAgentActionsSource()
    expect(operatorRoutesSource).toContain("actions.runOperatorAgent(req.body, runAgent)")
    expect(operatorAgentActionsSource).toContain('from "@dotagents/shared/agent-run-utils"')
    expect(operatorAgentActionsSource).toContain("export type OperatorRunAgentExecutor = AgentRunExecutor")
    expect(operatorAgentActionsSource).toContain("parseOperatorRunAgentRequestBody(body)")
    expect(operatorAgentActionsSource).toContain("buildOperatorRunAgentResponse(agentResult)")
    // Agent session controls
    expectRegisteredApiRoute(source, "POST", "operatorAgentSessionStop")
    expect(operatorRoutesSource).toContain("actions.stopOperatorAgentSession(params.sessionId)")
    expect(operatorAgentActionsSource).toContain("stopAgentSessionById(sessionId)")
    expect(operatorAgentActionsSource).toContain("buildOperatorAgentSessionStopResponse(stopResult.sessionId, stopResult.conversationId)")
    // Message queue operator endpoints
    expectRegisteredApiRoute(source, "GET", "operatorMessageQueues")
    expectRegisteredApiRoute(source, "POST", "operatorMessageQueueClear")
    expectRegisteredApiRoute(source, "POST", "operatorMessageQueuePause")
    expectRegisteredApiRoute(source, "POST", "operatorMessageQueueResume")
    expectRegisteredApiRoute(source, "DELETE", "operatorMessageQueueMessage")
    expectRegisteredApiRoute(source, "POST", "operatorMessageQueueMessageRetry")
    expectRegisteredApiRoute(source, "PATCH", "operatorMessageQueueMessage")
    const operatorMessageQueueActionsSource = getOperatorMessageQueueActionsSource()
    expect(operatorRoutesSource).toContain("actions.getOperatorMessageQueues()")
    expect(operatorRoutesSource).toContain("actions.clearOperatorMessageQueue(params.conversationId)")
    expect(operatorRoutesSource).toContain("actions.pauseOperatorMessageQueue(params.conversationId)")
    expect(operatorRoutesSource).toContain("actions.resumeOperatorMessageQueue(params.conversationId)")
    expect(operatorRoutesSource).toContain("actions.removeOperatorQueuedMessage(params.conversationId, params.messageId)")
    expect(operatorRoutesSource).toContain("actions.retryOperatorQueuedMessage(params.conversationId, params.messageId)")
    expect(operatorRoutesSource).toContain("actions.updateOperatorQueuedMessage(params.conversationId, params.messageId, req.body)")
    expect(operatorMessageQueueActionsSource).toContain("getOperatorMessageQueuesAction(messageQueueActionOptions)")
    expect(operatorMessageQueueActionsSource).toContain("clearOperatorMessageQueueAction(conversationIdParam, messageQueueActionOptions)")
    expect(operatorMessageQueueActionsSource).toContain("getAllQueues: () => messageQueueService.getAllQueues()")
    expect(operatorMessageQueueActionsSource).toContain("clearQueue: (conversationId) => messageQueueService.clearQueue(conversationId)")
    expect(operatorMessageQueueActionsSource).toContain("pauseQueue: (conversationId) => pauseMessageQueueByConversationId(conversationId)")
    expect(operatorMessageQueueActionsSource).toContain("resumeQueue: (conversationId) => resumeMessageQueueByConversationId(conversationId)")
    expect(operatorMessageQueueActionsSource).toContain("removeQueuedMessage: (conversationId, messageId) => removeQueuedMessageById(conversationId, messageId)")
    expect(operatorMessageQueueActionsSource).toContain("retryQueuedMessage: (conversationId, messageId) => retryQueuedMessageById(conversationId, messageId)")
    expect(operatorMessageQueueActionsSource).toContain("updateQueuedMessageTextById(conversationId, messageId, text)")
    expect(sharedOperatorActionsSource).toContain("export function getOperatorMessageQueuesAction(")
    expect(sharedOperatorActionsSource).toContain("buildOperatorMessageQueuesResponse(")
    expect(sharedOperatorActionsSource).toContain("parseOperatorQueuedMessageUpdateRequestBody(body)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorQueuedMessageUpdateResponse(")
    const messageQueueServiceSource = getMessageQueueServiceSource()
    const sharedMessageQueueStoreSource = getSharedMessageQueueStoreSource()
    expect(messageQueueServiceSource).toContain('from "@dotagents/shared/message-queue-store"')
    expect(messageQueueServiceSource).toContain("createMessageQueueStore({")
    expect(messageQueueServiceSource).toContain("onQueueChanged: (conversationId) => this.emitQueueUpdate(conversationId)")
    expect(messageQueueServiceSource).not.toContain("private queues")
    expect(messageQueueServiceSource).not.toContain("processingConversations")
    expect(messageQueueServiceSource).not.toContain("pausedConversations")
    expect(sharedMessageQueueStoreSource).toContain("export function createMessageQueueStore")
    expect(sharedMessageQueueStoreSource).toContain("tryAcquireProcessingLock")
    expect(sharedMessageQueueStoreSource).toContain("pauseQueue")
    expect(sharedMessageQueueStoreSource).not.toContain("@egoist/tipc")
    expect(sharedMessageQueueStoreSource).not.toContain("WINDOWS")
    expect(sharedMessageQueueStoreSource).not.toContain("electron")
    // Logs endpoint
    expectRegisteredApiRoute(source, "GET", "operatorLogs")
    expect(operatorRoutesSource).toContain("query.level")
    // MCP operator endpoints
    const operatorMcpActionsSource = getOperatorMcpActionsSource()
    expectRegisteredApiRoute(source, "GET", "operatorMcp")
    expectRegisteredApiRoute(source, "POST", "operatorMcpServerTest")
    expectRegisteredApiRoute(source, "GET", "operatorMcpTools")
    expectRegisteredApiRoute(source, "POST", "operatorMcpToolToggle")
    expectRegisteredApiRoute(source, "GET", "operatorMcpServerLogs")
    expectRegisteredApiRoute(source, "POST", "operatorMcpServerLogsClear")
    expectRegisteredApiRoute(source, "POST", "operatorMcpStart")
    expectRegisteredApiRoute(source, "POST", "operatorMcpStop")
    expectRegisteredApiRoute(source, "POST", "operatorMcpRestart")
    expect(operatorRoutesSource).toContain("actions.getOperatorMcpStatus()")
    expect(operatorRoutesSource).toContain("actions.getOperatorMcpServerLogs(params.server, query.count)")
    expect(operatorRoutesSource).toContain("actions.clearOperatorMcpServerLogs(params.server)")
    expect(operatorRoutesSource).toContain("actions.testOperatorMcpServer(params.server)")
    expect(operatorRoutesSource).toContain("actions.getOperatorMcpTools(query.server)")
    expect(operatorRoutesSource).toContain("actions.setOperatorMcpToolEnabled(params.toolName, req.body)")
    expect(operatorRoutesSource).toContain("actions.startOperatorMcpServer(req.body)")
    expect(operatorRoutesSource).toContain("actions.stopOperatorMcpServer(req.body)")
    expect(operatorRoutesSource).toContain("actions.restartOperatorMcpServer(req.body)")
    expect(operatorMcpActionsSource).toContain("buildOperatorMcpServerLogsResponse(")
    expect(operatorMcpActionsSource).toContain("mcpService.testServerConnection(serverName, serverConfig)")
    expect(operatorMcpActionsSource).toContain("buildOperatorMcpTestResponse(serverName, result)")
    expect(operatorMcpActionsSource).toContain("buildOperatorMcpToolsResponse(")
    expect(operatorMcpActionsSource).toContain("mcpService.getDetailedToolList()")
    expect(operatorMcpActionsSource).toContain("mcpService.setToolEnabled(toolName, enabled)")
    expect(operatorMcpActionsSource).toContain("mcpService.getServerLogs(serverName)")
    expect(operatorMcpActionsSource).toContain("mcpService.clearServerLogs(serverName)")
    expect(operatorMcpActionsSource).toContain("mcpService.setServerRuntimeEnabled(serverName, true)")
    expect(operatorMcpActionsSource).toContain("mcpService.setServerRuntimeEnabled(serverName, false)")
    expect(operatorMcpActionsSource).toContain("mcpService.stopServer(serverName)")
    expect(operatorMcpActionsSource).toContain("mcpService.restartServer(")
    // Local speech model operator endpoints
    const operatorLocalSpeechActionsSource = getOperatorLocalSpeechActionsSource()
    expect(operatorRoutesSource).toContain("actions.getOperatorLocalSpeechModelStatuses()")
    expect(operatorRoutesSource).toContain("actions.getOperatorLocalSpeechModelStatus(params.providerId)")
    expect(operatorRoutesSource).toContain("actions.downloadOperatorLocalSpeechModel(params.providerId)")
    expect(operatorLocalSpeechActionsSource).toContain("buildLocalSpeechModelStatusesResponse(getLocalSpeechModelStatus)")
    expect(operatorLocalSpeechActionsSource).toContain("startLocalSpeechModelDownload(providerId)")
    expect(operatorLocalSpeechActionsSource).toContain("buildLocalSpeechModelDownloadResponse")
    expect(operatorLocalSpeechActionsSource).toContain("buildLocalSpeechModelDownloadErrorResponse")
    expect(operatorLocalSpeechActionsSource).toContain('await import("./parakeet-stt")')
    expect(operatorLocalSpeechActionsSource).toContain('await import("./kitten-tts")')
    expect(operatorLocalSpeechActionsSource).toContain('await import("./supertonic-tts")')
    const operatorModelPresetActionsSource = getOperatorModelPresetActionsSource()
    const sharedModelPresetsSource = getSharedModelPresetsSource()
    expect(source).toContain("providerSecretMask: PROVIDER_SECRET_MASK")
    expect(operatorRoutesSource).toContain("actions.getOperatorModelPresets(providerSecretMask)")
    expect(operatorRoutesSource).toContain("actions.createOperatorModelPreset(req.body, providerSecretMask)")
    expect(operatorRoutesSource).toContain("actions.updateOperatorModelPreset(params.presetId, req.body, providerSecretMask)")
    expect(operatorRoutesSource).toContain("actions.deleteOperatorModelPreset(params.presetId, providerSecretMask)")
    expect(operatorModelPresetActionsSource).toContain("getOperatorModelPresetsAction(secretMask, modelPresetActionOptions)")
    expect(operatorModelPresetActionsSource).toContain("createOperatorModelPresetAction(body, secretMask, modelPresetActionOptions)")
    expect(operatorModelPresetActionsSource).toContain("updateOperatorModelPresetAction(presetId, body, secretMask, modelPresetActionOptions)")
    expect(operatorModelPresetActionsSource).toContain("deleteOperatorModelPresetAction(presetId, secretMask, modelPresetActionOptions)")
    expect(source).toContain("PROVIDER_SECRET_MASK")
    expect(sharedModelPresetsSource).toContain("export interface ModelPresetActionOptions")
    expect(sharedModelPresetsSource).toContain("export async function getOperatorModelPresetsAction")
    expect(sharedModelPresetsSource).toContain("export async function createOperatorModelPresetAction")
    expect(sharedModelPresetsSource).toContain("export async function updateOperatorModelPresetAction")
    expect(sharedModelPresetsSource).toContain("export async function deleteOperatorModelPresetAction")
    expect(sharedModelPresetsSource).toContain("buildModelPresetsResponse(options.config.get(), secretMask)")
    expect(sharedModelPresetsSource).toContain("options.createPresetId()")
    expect(sharedModelPresetsSource).toContain("options.now()")
    expect(sharedModelPresetsSource).toContain("options.config.save(nextConfig)")
    expect(sharedModelPresetsSource).toContain("buildModelPresetMutationResponse")
    expect(sharedModelPresetsSource).toContain("getModelPresetActivationUpdates")
    expect(sharedModelPresetsSource).toContain("upsertModelPresetOverride")
    expect(sharedModelPresetsSource).toContain("buildModelPresetCreateAuditContext")
    expect(sharedModelPresetsSource).toContain("buildModelPresetUpdateAuditContext")
    expect(sharedModelPresetsSource).toContain("buildModelPresetDeleteAuditContext")
    expect(sharedModelPresetsSource).toContain("buildModelPresetMutationFailureAuditContext")
    expect(sharedModelPresetsSource).not.toContain('from "./config"')
  })

  it("audits sensitive settings updates without persisting secrets", () => {
    const source = getMobileApiRoutesSource()
    const settingsActionsSource = getSettingsActionsSource()
    const sharedSettingsApiClientSource = getSharedSettingsApiClientSource()
    const settingsPatchSection = getSection(
      source,
      getApiRouteRegistrationMarker(source, "PATCH", "settings"),
      '// GET /v1/conversations/:id - Fetch conversation state for recovery',
    )

    expect(settingsPatchSection).toContain("if (result.auditContext)")
    expect(settingsPatchSection).toContain("actions.recordOperatorAuditEvent(req, result.auditContext)")
    expect(settingsActionsSource).toContain("updateSettingsAction(body, masks, settingsActionOptions)")
    expect(sharedSettingsApiClientSource).toContain("let attemptedSensitiveSettingsKeys: string[] = []")
    expect(sharedSettingsApiClientSource).toContain("getSensitiveOperatorSettingsKeys(requestBody)")
    expect(sharedSettingsApiClientSource).toContain("const sensitiveUpdatedKeys = getSensitiveOperatorSettingsKeys(updates)")
    expect(sharedSettingsApiClientSource).toContain("buildSettingsSensitiveNoValidUpdateAuditContext(attemptedSensitiveSettingsKeys)")
    expect(sharedSettingsApiClientSource).toContain("buildSettingsSensitiveUpdateAuditContext(sensitiveUpdatedKeys")
    expect(sharedSettingsApiClientSource).toContain("buildSettingsSensitiveUpdateFailureAuditContext(attemptedSensitiveSettingsKeys)")
    expect(sharedSettingsApiClientSource).toContain("buildSettingsUpdateResponse(updates)")
    expect(sharedSettingsApiClientSource).toContain("remoteServerLifecycleAction")
    expect(sharedSettingsApiClientSource).toContain("discordLifecycleAction")
    expect(settingsPatchSection).not.toContain("details: { apiKey")
    expect(settingsPatchSection).not.toContain("details: { remoteServerApiKey")
    expect(settingsActionsSource).not.toContain("details: { apiKey")
    expect(settingsActionsSource).not.toContain("details: { remoteServerApiKey")
    expect(sharedSettingsApiClientSource).not.toContain("details: { apiKey")
    expect(sharedSettingsApiClientSource).not.toContain("details: { remoteServerApiKey")
  })

  it("resolves remote server secret references only for authenticated pairing surfaces", () => {
    const source = getRemoteServerSource()
    const controllerSource = getRemoteServerControllerSource()
    const desktopAdaptersSource = getRemoteServerDesktopAdaptersSource()
    const settingsActionsSource = getSettingsActionsSource()
    const remoteServerPairingActionsSource = getRemoteServerPairingActionsSource()
    const sharedSettingsApiClientSource = getSharedSettingsApiClientSource()

    expect(remoteServerPairingActionsSource).toContain("getDotAgentsSecretsRecord(parsed)")
    expect(remoteServerPairingActionsSource).toContain("resolveDotAgentsSecretReference(value, secrets)")
    expect(remoteServerPairingActionsSource).toContain('const DOTAGENTS_SECRETS_LOCAL_JSON = "secrets.local.json"')
    expect(remoteServerPairingActionsSource).toContain("function getResolvedRemoteServerApiKey")
    expect(remoteServerPairingActionsSource).toContain("function hasConfiguredRemoteServerApiKey")
    expect(controllerSource).toContain("const startupPlan = getRemoteServerStartupPlan(cfg, {")
    expect(controllerSource).toContain("resolveApiKey: adapters.resolveApiKeyReference")
    expect(controllerSource).toContain("startupPlan.apiKeyAction === \"generate\"")
    expect(controllerSource).toContain("Remote server API key is configured but could not be resolved; preserving configured value")
    expect(controllerSource).toContain("adapters.authorizeRequest(req, {")
    expect(controllerSource).toContain("currentApiKey: adapters.resolveConfiguredApiKey(current)")
    expect(desktopAdaptersSource).toContain("resolveApiKeyReference: readDotAgentsSecretReference")
    expect(desktopAdaptersSource).toContain("resolveConfiguredApiKey: getResolvedRemoteServerApiKey")
    expect(source).toContain("export function getRemoteServerPairingApiKey")
    expect(source).toContain("return remoteServerController.getRemoteServerPairingApiKey()")
    expect(controllerSource).toContain("return getRemoteServerPairingApiKeyFromConfig(cfg, adapters.resolveApiKeyReference)")
    expect(controllerSource).toContain("shouldAutoPrintRemoteServerPairingQr({")
    expect(controllerSource).toContain("adapters.printTerminalQRCode(serverUrl, apiKey)")
    expect(controllerSource).toContain("adapters.getConnectableBaseUrlForMobilePairing(bind, port)")
    expect(controllerSource).toContain("adapters.getNetworkAddresses()")
    expect(remoteServerPairingActionsSource).toContain("resolveConnectableRemoteServerPairingBaseUrl(bind, port, getRemoteNetworkAddresses())")
    expect(remoteServerPairingActionsSource).toContain("QRCode.toString(qrValue")
    expect(settingsActionsSource).toContain("getMaskedRemoteServerApiKey: (config) => getMaskedRemoteServerApiKey(config.remoteServerApiKey)")
    expect(sharedSettingsApiClientSource).toContain("remoteServerApiKey: options.getMaskedRemoteServerApiKey(cfg)")
  })

  it("applies session-aware ACP MCP filtering for injected tool routes", () => {
    const source = getRemoteServerSource()
    const injectedMcpRoutesSource = getInjectedMcpRoutesSource()
    const injectedMcpActionsSource = getInjectedMcpActionsSource()
    const listInjectedMcpToolsSection = getSection(injectedMcpActionsSource, "export async function listInjectedMcpTools", "export async function callInjectedMcpTool")
    const callInjectedMcpToolSection = getSection(injectedMcpActionsSource, "export async function callInjectedMcpTool", "export async function handleInjectedMcpProtocolRequest")
    const streamableMcpSection = getSection(injectedMcpActionsSource, "export async function handleInjectedMcpProtocolRequest", "if (!reply.sent)")

    expect(injectedMcpActionsSource).toContain("function getAcpMcpRequestContext")
    expect(injectedMcpActionsSource).toContain("function getInjectedRuntimeToolsForAcpSession")
    expect(injectedMcpActionsSource).toContain("getPendingAppSessionForClientSessionToken")
    expect(injectedMcpActionsSource).toContain("if (!profileSnapshot) return undefined")
    expectRegisteredMcpRoute(source, "POST", "session")
    expectRegisteredMcpRoute(source, "GET", "session")
    expectRegisteredMcpRoute(source, "DELETE", "session")
    expectRegisteredMcpRoute(source, "POST", "toolsList")
    expectRegisteredMcpRoute(source, "POST", "sessionToolsList")
    expectRegisteredMcpRoute(source, "POST", "toolsCall")
    expectRegisteredMcpRoute(source, "POST", "sessionToolsCall")
    expect(injectedMcpRoutesSource).toContain(getMcpRouteRegistrationMarker(injectedMcpRoutesSource, "POST", "session"))
    expect(injectedMcpRoutesSource).toContain(getMcpRouteRegistrationMarker(injectedMcpRoutesSource, "POST", "sessionToolsList"))
    expect(injectedMcpRoutesSource).toContain(getMcpRouteRegistrationMarker(injectedMcpRoutesSource, "POST", "sessionToolsCall"))
    expect(injectedMcpRoutesSource).toContain("actions.handleInjectedMcpProtocolRequest(req, reply, params?.acpSessionToken)")
    expect(injectedMcpRoutesSource).toContain("actions.listInjectedMcpTools(query?.acpSessionToken, reply)")
    expect(injectedMcpRoutesSource).toContain("actions.callInjectedMcpTool(req, reply, query?.acpSessionToken)")
    expect(injectedMcpActionsSource).toContain("INVALID_ACP_SESSION_CONTEXT_ERROR")
    expect(injectedMcpActionsSource).toContain("StreamableHTTPServerTransport")
    expect(injectedMcpActionsSource).toContain("isInitializeRequest(req.body)")
    expect(listInjectedMcpToolsSection).toContain("getInjectedRuntimeToolsForAcpSession(acpSessionToken)")
    expect(listInjectedMcpToolsSection).toContain("reply.code(401).send({ error: INVALID_ACP_SESSION_CONTEXT_ERROR })")
    expect(listInjectedMcpToolsSection).toContain("buildInjectedMcpToolsListResponse(injectedRuntimeTools.tools)")
    expect(listInjectedMcpToolsSection).not.toContain("mcpService.getAvailableTools()")
    expect(injectedMcpActionsSource).toContain("?? getPendingAppSessionForClientSessionToken(acpSessionToken)")
    expect(callInjectedMcpToolSection).toContain("getInjectedRuntimeToolsForAcpSession(acpSessionToken)")
    expect(callInjectedMcpToolSection).toContain("reply.code(401).send({ error: INVALID_ACP_SESSION_CONTEXT_ERROR })")
    expect(callInjectedMcpToolSection).toContain("injectedRuntimeTools.requestContext.appSessionId")
    expect(callInjectedMcpToolSection).toContain("injectedRuntimeTools.requestContext.profileSnapshot.mcpServerConfig")
    expect(callInjectedMcpToolSection).not.toContain("profileSnapshot?.mcpServerConfig")
    expect(streamableMcpSection).toContain("new StreamableHTTPServerTransport")
    expect(streamableMcpSection).toContain("reply.hijack()")
    expect(streamableMcpSection).toContain("transport.handleRequest(req.raw, reply.raw, req.body)")
  })

  it("registers note-only knowledge routes", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const knowledgeNoteActionsSource = getKnowledgeNoteActionsSource()
    const sharedKnowledgeNoteFormSource = getSharedKnowledgeNoteFormSource()

    expectRegisteredApiRoute(source, "GET", "knowledgeNotes")
    expectRegisteredApiRoute(source, "GET", "knowledgeNote")
    expectRegisteredApiRoute(source, "POST", "knowledgeNotes")
    expectRegisteredApiRoute(source, "PATCH", "knowledgeNote")
    expectRegisteredApiRoute(source, "DELETE", "knowledgeNote")
    expect(mobileApiRoutesSource).toContain("actions.getKnowledgeNotes()")
    expect(mobileApiRoutesSource).toContain("actions.getKnowledgeNote(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.createKnowledgeNote(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.updateKnowledgeNote(params.id, req.body)")
    expect(mobileApiRoutesSource).toContain("actions.deleteKnowledgeNote(params.id)")
    expect(knowledgeNoteActionsSource).toContain("getKnowledgeNotesAction(knowledgeNoteActionOptions)")
    expect(knowledgeNoteActionsSource).toContain("getKnowledgeNoteAction(id, knowledgeNoteActionOptions)")
    expect(knowledgeNoteActionsSource).toContain("createKnowledgeNoteAction(body, knowledgeNoteActionOptions)")
    expect(knowledgeNoteActionsSource).toContain("updateKnowledgeNoteAction(id, body, knowledgeNoteActionOptions)")
    expect(knowledgeNoteActionsSource).toContain("deleteKnowledgeNoteAction(id, knowledgeNoteActionOptions)")
    expect(sharedKnowledgeNoteFormSource).toContain("export interface KnowledgeNoteActionOptions")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function getKnowledgeNotesAction")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function getKnowledgeNoteAction")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function deleteKnowledgeNoteAction")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function createKnowledgeNoteAction")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function updateKnowledgeNoteAction")
    expect(sharedKnowledgeNoteFormSource).toContain("buildKnowledgeNotesResponse(notes)")
    expect(sharedKnowledgeNoteFormSource).toContain("buildKnowledgeNoteResponse(note)")
    expect(sharedKnowledgeNoteFormSource).toContain("buildKnowledgeNoteDeleteResponse(noteId)")
    expect(sharedKnowledgeNoteFormSource).toContain("parseKnowledgeNoteCreateRequestBody(body)")
    expect(sharedKnowledgeNoteFormSource).toContain("parseKnowledgeNoteUpdateRequestBody(body)")
    expect(sharedKnowledgeNoteFormSource).toContain("buildKnowledgeNoteMutationResponse(updated)")
    expect(sharedKnowledgeNoteFormSource).not.toContain('from "./knowledge-notes-service"')

    expect(mobileApiRoutesSource).not.toContain('fastify.get("/v1/memories"')
    expect(mobileApiRoutesSource).not.toContain('fastify.post("/v1/memories"')
    expect(mobileApiRoutesSource).not.toContain('fastify.patch("/v1/memories/:id"')
    expect(mobileApiRoutesSource).not.toContain('fastify.delete("/v1/memories/:id"')
  })

  it("delegates repeat task route behavior to repeat task actions", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const repeatTaskActionsSource = getRepeatTaskActionsSource()
    const sharedRepeatTaskUtilsSource = getSharedRepeatTaskUtilsSource()

    expectRegisteredApiRoute(source, "GET", "loops")
    expectRegisteredApiRoute(source, "POST", "loopToggle")
    expectRegisteredApiRoute(source, "POST", "loopRun")
    expectRegisteredApiRoute(source, "POST", "loops")
    expectRegisteredApiRoute(source, "PATCH", "loop")
    expectRegisteredApiRoute(source, "DELETE", "loop")
    expect(mobileApiRoutesSource).toContain("actions.getRepeatTasks()")
    expect(mobileApiRoutesSource).toContain("actions.toggleRepeatTask(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.runRepeatTask(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.createRepeatTask(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.updateRepeatTask(params.id, req.body)")
    expect(mobileApiRoutesSource).toContain("actions.deleteRepeatTask(params.id)")
    expect(repeatTaskActionsSource).toContain("await import(\"./loop-service\")")
    expect(repeatTaskActionsSource).toContain("getRepeatTasksAction(repeatTaskActionOptions)")
    expect(repeatTaskActionsSource).toContain("toggleRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(repeatTaskActionsSource).toContain("runRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(repeatTaskActionsSource).toContain("createRepeatTaskAction(body, repeatTaskActionOptions)")
    expect(repeatTaskActionsSource).toContain("updateRepeatTaskAction(id, body, repeatTaskActionOptions)")
    expect(repeatTaskActionsSource).toContain("deleteRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(sharedRepeatTaskUtilsSource).toContain("export interface RepeatTaskActionOptions")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function getRepeatTasksAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function toggleRepeatTaskAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function runRepeatTaskAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function createRepeatTaskAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function updateRepeatTaskAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function deleteRepeatTaskAction")
    expect(sharedRepeatTaskUtilsSource).toContain("buildRepeatTasksResponse(loops")
    expect(sharedRepeatTaskUtilsSource).toContain("buildRepeatTaskToggleResponse(taskId, updated.enabled)")
    expect(sharedRepeatTaskUtilsSource).toContain("buildRepeatTaskRunResponse(taskId)")
    expect(sharedRepeatTaskUtilsSource).toContain("parseRepeatTaskCreateRequestBody(body)")
    expect(sharedRepeatTaskUtilsSource).toContain("buildRepeatTaskFromCreateRequest(options.createId(), parsedRequest.request)")
    expect(sharedRepeatTaskUtilsSource).toContain("parseRepeatTaskUpdateRequestBody(body)")
    expect(sharedRepeatTaskUtilsSource).toContain("applyRepeatTaskUpdate(existing, parsedRequest.request)")
    expect(sharedRepeatTaskUtilsSource).toContain("buildRepeatTaskDeleteResponse(taskId)")
    expect(sharedRepeatTaskUtilsSource).not.toContain('from "./loop-service"')
  })

  it("does not report repeat task toggles as successful when loop persistence fails", () => {
    const source = getSharedRepeatTaskUtilsSource()
    const toggleLoopSection = getSection(source, "export async function toggleRepeatTaskAction", "export async function runRepeatTaskAction")

    expect(toggleLoopSection).toContain("const saved = loopService.saveLoop(updated)")
    expect(toggleLoopSection).toContain('if (!saved) {')
    expect(toggleLoopSection).toContain('return repeatTaskActionError(500, "Failed to persist repeat task toggle")')

    const saveIndex = toggleLoopSection.indexOf("const saved = loopService.saveLoop(updated)")
    const failureIndex = toggleLoopSection.indexOf('return repeatTaskActionError(500, "Failed to persist repeat task toggle")')
    const successIndex = toggleLoopSection.indexOf("return repeatTaskActionOk(buildRepeatTaskToggleResponse(")

    expect(saveIndex).toBeGreaterThanOrEqual(0)
    expect(failureIndex).toBeGreaterThan(saveIndex)
    expect(successIndex).toBeGreaterThan(failureIndex)
  })

  it("does not report repeat task creation as successful when loop persistence fails", () => {
    const source = getSharedRepeatTaskUtilsSource()
    const createLoopSection = getSection(source, "export async function createRepeatTaskAction", "export async function updateRepeatTaskAction")

    expect(createLoopSection).toContain("const saved = loopService.saveLoop(newLoop)")
    expect(createLoopSection).toContain('if (!saved) {')
    expect(createLoopSection).toContain('return repeatTaskActionError(500, "Failed to persist repeat task")')

    const saveIndex = createLoopSection.indexOf("const saved = loopService.saveLoop(newLoop)")
    const failureIndex = createLoopSection.indexOf('return repeatTaskActionError(500, "Failed to persist repeat task")')
    const successIndex = createLoopSection.indexOf("return repeatTaskActionOk(buildRepeatTaskResponse(savedLoop")

    expect(saveIndex).toBeGreaterThanOrEqual(0)
    expect(failureIndex).toBeGreaterThan(saveIndex)
    expect(successIndex).toBeGreaterThan(failureIndex)
  })

  it("does not report repeat task updates as successful when loop persistence fails", () => {
    const source = getSharedRepeatTaskUtilsSource()
    const updateLoopSection = getSection(source, "export async function updateRepeatTaskAction", "export async function deleteRepeatTaskAction")

    expect(updateLoopSection).toContain("const saved = loopService.saveLoop(updated)")
    expect(updateLoopSection).toContain('if (!saved) {')
    expect(updateLoopSection).toContain('return repeatTaskActionError(500, "Failed to persist repeat task")')

    const saveIndex = updateLoopSection.indexOf("const saved = loopService.saveLoop(updated)")
    const failureIndex = updateLoopSection.indexOf('return repeatTaskActionError(500, "Failed to persist repeat task")')
    const successIndex = updateLoopSection.indexOf("return repeatTaskActionOk(buildRepeatTaskMutationResponse(savedLoop")

    expect(saveIndex).toBeGreaterThanOrEqual(0)
    expect(failureIndex).toBeGreaterThan(saveIndex)
    expect(successIndex).toBeGreaterThan(failureIndex)
  })
})
