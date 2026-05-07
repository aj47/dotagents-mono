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

function getDesktopRemoteServerControllerSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteServerControllerPath = path.join(testDir, "remote-server-controller.ts")
  return readFileSync(remoteServerControllerPath, "utf8")
}

function getRemoteServerControllerSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteServerControllerPath = path.join(testDir, "../../../../packages/shared/src/remote-server-controller.ts")
  return readFileSync(remoteServerControllerPath, "utf8")
}

function getRemoteServerRouteBundleSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteServerRouteBundlePath = path.join(testDir, "remote-server-route-bundle.ts")
  return readFileSync(remoteServerRouteBundlePath, "utf8")
}

function getSharedRemoteServerRouteBundleSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedRemoteServerRouteBundlePath = path.join(
    testDir,
    "../../../../packages/shared/src/remote-server-route-bundle.ts",
  )
  return readFileSync(sharedRemoteServerRouteBundlePath, "utf8")
}

function getRemoteServerDesktopAdaptersSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteServerDesktopAdaptersPath = path.join(testDir, "remote-server-desktop-adapters.ts")
  return readFileSync(remoteServerDesktopAdaptersPath, "utf8")
}

function getServeSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const servePath = path.join(testDir, "serve.ts")
  return readFileSync(servePath, "utf8")
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

function getSharedAgentProfileReferenceCleanupSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedAgentProfileReferenceCleanupPath = path.join(
    testDir,
    "../../../../packages/shared/src/agent-profile-reference-cleanup.ts",
  )
  return readFileSync(sharedAgentProfileReferenceCleanupPath, "utf8")
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

function getSharedRemotePairingSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedRemotePairingPath = path.join(testDir, "../../../../packages/shared/src/remote-pairing.ts")
  return readFileSync(sharedRemotePairingPath, "utf8")
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

function getSharedDiscordConfigSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedDiscordConfigPath = path.join(testDir, "../../../../packages/shared/src/discord-config.ts")
  return readFileSync(sharedDiscordConfigPath, "utf8")
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

function getSharedBundleApiSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedBundleApiPath = path.join(testDir, "../../../../packages/shared/src/bundle-api.ts")
  return readFileSync(sharedBundleApiPath, "utf8")
}

function getSharedMessageQueueStoreSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedMessageQueueStorePath = path.join(testDir, "../../../../packages/shared/src/message-queue-store.ts")
  return readFileSync(sharedMessageQueueStorePath, "utf8")
}

function getSharedOperatorRoutesSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedOperatorRoutesPath = path.join(
    testDir,
    "../../../../packages/shared/src/remote-server-operator-routes.ts",
  )
  return readFileSync(sharedOperatorRoutesPath, "utf8")
}

function getOperatorRoutesSource(): string {
  return getSharedOperatorRoutesSource()
}

function getOperatorRouteDesktopActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorRouteDesktopActionsPath = path.join(testDir, "operator-route-desktop-actions.ts")
  return readFileSync(operatorRouteDesktopActionsPath, "utf8")
}

function getSharedMobileApiRoutesSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedMobileApiRoutesPath = path.join(
    testDir,
    "../../../../packages/shared/src/remote-server-mobile-api-routes.ts",
  )
  return readFileSync(sharedMobileApiRoutesPath, "utf8")
}

function getMobileApiRoutesSource(): string {
  return getSharedMobileApiRoutesSource()
}

function getMobileApiDesktopActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const mobileApiDesktopActionsPath = path.join(testDir, "mobile-api-desktop-actions.ts")
  return readFileSync(mobileApiDesktopActionsPath, "utf8")
}

function getInjectedMcpRoutesSource(): string {
  return getSharedInjectedMcpRoutesSource()
}

function getSharedInjectedMcpRoutesSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedInjectedMcpRoutesPath = path.join(
    testDir,
    "../../../../packages/shared/src/remote-server-injected-mcp-routes.ts",
  )
  return readFileSync(sharedInjectedMcpRoutesPath, "utf8")
}

function getRemoteServerRouteRegistrationSource(): string {
  return [
    getRemoteServerSource(),
    getRemoteServerControllerSource(),
    getRemoteServerRouteBundleSource(),
    getSharedRemoteServerRouteBundleSource(),
    getOperatorRoutesSource(),
    getMobileApiRoutesSource(),
    getInjectedMcpRoutesSource(),
  ].join("\n")
}

function getSharedLocalSpeechModelsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedLocalSpeechModelsPath = path.join(testDir, "../../../../packages/shared/src/local-speech-models.ts")
  return readFileSync(sharedLocalSpeechModelsPath, "utf8")
}

function getSharedModelPresetsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedModelPresetsPath = path.join(testDir, "../../../../packages/shared/src/model-presets.ts")
  return readFileSync(sharedModelPresetsPath, "utf8")
}

function getOperatorIntegrationSummarySource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorIntegrationSummaryPath = path.join(testDir, "operator-integration-summary.ts")
  return readFileSync(operatorIntegrationSummaryPath, "utf8")
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

function getOperatorAuditActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorAuditActionsPath = path.join(testDir, "operator-audit-actions.ts")
  return readFileSync(operatorAuditActionsPath, "utf8")
}

function getSharedKnowledgeNoteFormSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedKnowledgeNoteFormPath = path.join(testDir, "../../../../packages/shared/src/knowledge-note-form.ts")
  return readFileSync(sharedKnowledgeNoteFormPath, "utf8")
}

function getSharedRepeatTaskUtilsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedRepeatTaskUtilsPath = path.join(testDir, "../../../../packages/shared/src/repeat-task-utils.ts")
  return readFileSync(sharedRepeatTaskUtilsPath, "utf8")
}

function getPushNotificationServiceSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const pushNotificationServicePath = path.join(testDir, "push-notification-service.ts")
  return readFileSync(pushNotificationServicePath, "utf8")
}

function getConversationImageAssetsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const conversationImageAssetsPath = path.join(testDir, "conversation-image-assets.ts")
  return readFileSync(conversationImageAssetsPath, "utf8")
}

function getConversationVideoAssetsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const conversationVideoAssetsPath = path.join(testDir, "conversation-video-assets.ts")
  return readFileSync(conversationVideoAssetsPath, "utf8")
}

function getSharedConversationSyncSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedConversationSyncPath = path.join(testDir, "../../../../packages/shared/src/conversation-sync.ts")
  return readFileSync(sharedConversationSyncPath, "utf8")
}

function getSharedConversationMediaAssetsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedConversationMediaAssetsPath = path.join(
    testDir,
    "../../../../packages/shared/src/conversation-media-assets.ts",
  )
  return readFileSync(sharedConversationMediaAssetsPath, "utf8")
}

function getSharedAgentSessionCandidatesSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedAgentSessionCandidatesPath = path.join(
    testDir,
    "../../../../packages/shared/src/agent-session-candidates.ts",
  )
  return readFileSync(sharedAgentSessionCandidatesPath, "utf8")
}

function getAgentSessionTrackerSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const agentSessionTrackerPath = path.join(testDir, "agent-session-tracker.ts")
  return readFileSync(agentSessionTrackerPath, "utf8")
}

function getSharedAgentSessionStoreSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sharedAgentSessionStorePath = path.join(testDir, "../../../../packages/shared/src/agent-session-store.ts")
  return readFileSync(sharedAgentSessionStorePath, "utf8")
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
    const desktopControllerSource = getDesktopRemoteServerControllerSource()
    const controllerSource = getRemoteServerControllerSource()
    const routeBundleSource = getRemoteServerRouteBundleSource()
    const sharedRouteBundleSource = getSharedRemoteServerRouteBundleSource()
    const desktopAdaptersSource = getRemoteServerDesktopAdaptersSource()
    const operatorRoutesSource = getOperatorRoutesSource()
    const sharedOperatorRoutesSource = getSharedOperatorRoutesSource()
    const operatorRouteDesktopActionsSource = getOperatorRouteDesktopActionsSource()
    const injectedMcpRoutesSource = getInjectedMcpRoutesSource()
    const sharedInjectedMcpRoutesSource = getSharedInjectedMcpRoutesSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const sharedMobileApiRoutesSource = getSharedMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedRouteContractsSource = getSharedRemoteServerRouteContractsSource()
    const sharedControllerContractsSource = getSharedRemoteServerControllerContractsSource()

    expect(source).toContain("createRemoteServerController({")
    expect(source).toContain("registerRoutes: registerDesktopRemoteServerRoutes")
    expect(source).toContain("adapters: remoteServerDesktopAdapters")
    expect(source).toContain("isHeadlessEnvironment: () =>")
    expect(source).toContain("isHeadlessRemoteServerEnvironment({")
    expect(source).toContain("return remoteServerController.startRemoteServer()")
    expect(source).toContain("return remoteServerController.printQRCodeToTerminal(urlOverride)")
    expect(source).not.toContain('from "fastify"')
    expect(source).not.toContain('from "@fastify/cors"')
    expect(source).not.toContain("registerOperatorRoutes(")
    expect(source).not.toContain("registerMobileApiRoutes(")
    expect(source).not.toContain("registerInjectedMcpRoutes(")
    expect(source).not.toContain("fastify.get(")
    expect(source).not.toContain("fastify.post(")
    expect(desktopControllerSource).toContain(
      'export { createRemoteServerController } from "@dotagents/shared/remote-server-controller"',
    )
    expect(desktopControllerSource).toContain('from "@dotagents/shared/remote-server-controller-contracts"')
    expect(desktopControllerSource).toContain("export type RemoteServerControllerConfig = RemoteServerControllerConfigLike")
    expect(desktopControllerSource).toContain(
      "export type RemoteServerRouteRegistrar = SharedRemoteServerRouteRegistrar<FastifyInstance, FastifyReply>",
    )
    expect(desktopControllerSource).not.toContain("getRemoteServerStartupPlan")
    expect(desktopControllerSource).not.toContain("adapters.createHttpServer")
    expect(desktopControllerSource).not.toContain("buildRemoteServerStatusSnapshot")
    expect(controllerSource).not.toContain("Fastify")
    expect(controllerSource).not.toContain("Electron")
    expect(controllerSource).not.toContain("import Fastify")
    expect(controllerSource).not.toContain('from "@fastify/cors"')
    expect(controllerSource).not.toContain("Fastify({")
    expect(controllerSource).not.toContain("fastify.addHook")
    expect(controllerSource).not.toContain("fastify.listen")
    expect(controllerSource).not.toContain("server.close()")
    expect(controllerSource).toContain("const httpServer = await adapters.createHttpServer({")
    expect(controllerSource).toContain("bodyLimitBytes: 50 * 1024 * 1024")
    expect(controllerSource).toContain("corsOrigins: startupPlan.corsOrigins")
    expect(controllerSource).toContain("await adapters.addRequestHook(httpServer, async (req, reply) => {")
    expect(controllerSource).toContain("adapters.sendAuthFailure(reply, {")
    expect(controllerSource).toContain("await adapters.addResponseHook(httpServer, async (req, reply) => {")
    expect(controllerSource).toContain("registerRoutes(httpServer, {")
    expect(controllerSource).toContain("await adapters.listenHttpServer(httpServer, { port, host: bind })")
    expect(controllerSource).toContain("await adapters.closeHttpServer(server)")
    expect(controllerSource).not.toContain("registerOperatorRoutes(fastify")
    expect(controllerSource).not.toContain("registerMobileApiRoutes(fastify")
    expect(controllerSource).not.toContain("registerInjectedMcpRoutes(fastify")
    expect(controllerSource).not.toContain('from "./operator-audit-actions"')
    expect(controllerSource).not.toContain('from "./operator-api-key-actions"')
    expect(controllerSource).not.toContain('from "./remote-server-pairing-actions"')
    expect(controllerSource).not.toContain('from "./chat-completion-actions"')
    expect(controllerSource).not.toContain('from "../shared/types"')
    expect(controllerSource).toContain("from './remote-server-controller-contracts'")
    expect(controllerSource).not.toContain('from "@dotagents/shared/agent-run-utils"')
    expect(controllerSource).not.toContain("process.platform")
    expect(controllerSource).not.toContain("process.env")
    expect(controllerSource).not.toContain("console.")
    expect(controllerSource).not.toContain("reply.raw.once")
    expect(controllerSource).not.toContain("setTimeout")
    expect(controllerSource).toContain("adapters.scheduleDelayedTask(50, () => {")
    expect(controllerSource).toContain("adapters.scheduleDelayedTask(100, () => {")
    expect(controllerSource).toContain("adapters.scheduleTaskAfterReply(reply, () => {")
    expect(controllerSource).toContain("headlessEnvironment: isHeadlessEnvironment()")
    expect(controllerSource).toContain("adapters.authorizeRequest(req, {")
    expect(controllerSource).toContain("adapters.resolveConfiguredApiKey(current)")
    expect(controllerSource).toContain("adapters.recordOperatorResponseAuditEvent(req, reply)")
    expect(routeBundleSource).toContain("registerRemoteServerRouteBundle(")
    expect(routeBundleSource).not.toContain('from "./remote-server-controller"')
    expect(routeBundleSource).not.toContain('from "./operator-routes"')
    expect(routeBundleSource).not.toContain('from "./mobile-api-routes"')
    expect(routeBundleSource).not.toContain('from "./injected-mcp-routes"')
    expect(routeBundleSource).toContain('from "@dotagents/shared/remote-server-controller-contracts"')
    expect(routeBundleSource).toContain('from "@dotagents/shared/remote-server-route-bundle"')
    expect(routeBundleSource).toContain("operatorRouteActions: operatorRouteDesktopActions")
    expect(routeBundleSource).toContain("mobileApiRouteActions: mobileApiDesktopActions")
    expect(routeBundleSource).toContain("injectedMcpRouteActions: injectedMcpDesktopActions")
    expect(sharedRouteBundleSource).toContain("registerOperatorRoutes(fastify, {")
    expect(sharedRouteBundleSource).toContain("registerMobileApiRoutes(fastify, {")
    expect(sharedRouteBundleSource).toContain("registerInjectedMcpRoutes(fastify, {")
    expect(sharedRouteBundleSource).toContain("operatorRouteActions: OperatorRouteActions<Request>")
    expect(sharedRouteBundleSource).toContain("mobileApiRouteActions: MobileApiRouteActions<Request, Reply>")
    expect(sharedRouteBundleSource).toContain("injectedMcpRouteActions: InjectedMcpRouteActions<Request, Reply>")
    expect(sharedRouteBundleSource).not.toContain("Fastify")
    expect(sharedRouteBundleSource).not.toContain("Electron")
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
    expect(sharedOperatorRoutesSource).toContain("from './remote-server-route-contracts'")
    expect(sharedOperatorRoutesSource).toContain("export interface RemoteServerOperatorRouteServer")
    expect(sharedOperatorRoutesSource).toContain("fastify.get(API_ROUTES.operatorStatus")
    expect(sharedOperatorRoutesSource).toContain("fastify.post(API_ROUTES.operatorRestartRemoteServer")
    expect(sharedOperatorRoutesSource).toContain("fastify.patch(API_ROUTES.operatorModelPreset")
    expect(sharedOperatorRoutesSource).toContain("fastify.delete(API_ROUTES.operatorMessageQueueMessage")
    expect(sharedOperatorRoutesSource).not.toContain("Fastify")
    expect(sharedOperatorRoutesSource).not.toContain("Electron")
    expect(operatorRouteDesktopActionsSource).toContain("export const operatorRouteDesktopActions = createOperatorRouteActions({")
    expect(operatorRouteDesktopActionsSource).not.toContain('from "./operator-routes"')
    expect(operatorRouteDesktopActionsSource).toContain('from "@dotagents/shared/remote-server-route-contracts"')
    expect(operatorRouteDesktopActionsSource).toContain("agent: operatorAgentRouteActions")
    expect(operatorRouteDesktopActionsSource).toContain("observability: operatorObservabilityRouteActions")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorAudit: operatorAuditRouteActions.getOperatorAudit")
    expect(operatorRouteDesktopActionsSource).toContain("recordOperatorAuditEvent")
    expect(injectedMcpRoutesSource).not.toContain('from "./injected-mcp-actions"')
    expect(injectedMcpRoutesSource).not.toContain("export interface InjectedMcpRouteActions")
    expect(injectedMcpRoutesSource).not.toContain("export interface RegisterInjectedMcpRoutesOptions")
    expect(sharedInjectedMcpRoutesSource).toContain("from './remote-server-route-contracts'")
    expect(sharedInjectedMcpRoutesSource).toContain("export interface RemoteServerInjectedMcpRouteServer")
    expect(sharedInjectedMcpRoutesSource).toContain("fastify.post(MCP_ROUTES.session")
    expect(sharedInjectedMcpRoutesSource).toContain("fastify.get(MCP_ROUTES.session")
    expect(sharedInjectedMcpRoutesSource).toContain("fastify.delete(MCP_ROUTES.session")
    expect(sharedInjectedMcpRoutesSource).toContain("fastify.post(MCP_ROUTES.toolsList")
    expect(sharedInjectedMcpRoutesSource).toContain("fastify.post(MCP_ROUTES.sessionToolsList")
    expect(sharedInjectedMcpRoutesSource).toContain("fastify.post(MCP_ROUTES.toolsCall")
    expect(sharedInjectedMcpRoutesSource).toContain("fastify.post(MCP_ROUTES.sessionToolsCall")
    expect(sharedInjectedMcpRoutesSource).not.toContain("Fastify")
    expect(sharedInjectedMcpRoutesSource).not.toContain("Electron")
    expect(routeBundleSource).toContain("const injectedMcpDesktopActions")
    expect(routeBundleSource).toContain("const handleInjectedMcpProtocolRequest = createInjectedMcpProtocolRouteAction<")
    expect(routeBundleSource).toContain("createTransport: (options) => new StreamableHTTPServerTransport(options)")
    expect(routeBundleSource).toContain("isInitializeRequest,")
    expect(routeBundleSource).not.toContain("const injectedMcpTransportsByToken")
    expect(routeBundleSource).not.toContain("getInjectedMcpTransportSessionMap")
    expect(routeBundleSource).toContain("const injectedMcpToolRouteActions = createInjectedMcpToolRouteActions<")
    expect(routeBundleSource).toContain("const injectedMcpDesktopActions = createInjectedMcpRouteActions<")
    expect(routeBundleSource).toContain("protocol: { handleInjectedMcpProtocolRequest }")
    expect(routeBundleSource).toContain("tools: injectedMcpToolRouteActions")
    expect(mobileApiRoutesSource).not.toContain('from "./model-actions"')
    expect(mobileApiRoutesSource).not.toContain('from "./conversation-actions"')
    expect(mobileApiRoutesSource).not.toContain('from "./settings-actions"')
    expect(mobileApiRoutesSource).not.toContain('from "./operator-audit-actions"')
    expect(mobileApiRoutesSource).not.toContain("export interface MobileApiRouteActions")
    expect(mobileApiRoutesSource).not.toContain("export interface RegisterMobileApiRoutesOptions")
    expect(sharedMobileApiRoutesSource).toContain("from './remote-server-route-contracts'")
    expect(sharedMobileApiRoutesSource).toContain("export interface RemoteServerMobileApiRouteServer")
    expect(sharedMobileApiRoutesSource).toContain("fastify.post(API_ROUTES.chatCompletions")
    expect(sharedMobileApiRoutesSource).toContain("fastify.get(API_ROUTES.models")
    expect(sharedMobileApiRoutesSource).toContain("fastify.patch(API_ROUTES.settings")
    expect(sharedMobileApiRoutesSource).toContain("fastify.put(API_ROUTES.conversation")
    expect(sharedMobileApiRoutesSource).toContain("fastify.delete(API_ROUTES.loop")
    expect(sharedMobileApiRoutesSource).not.toContain("Fastify")
    expect(sharedMobileApiRoutesSource).not.toContain("Electron")
    expect(mobileApiDesktopActionsSource).toContain("export const mobileApiDesktopActions = createMobileApiRouteActions({")
    expect(mobileApiDesktopActionsSource).not.toContain('from "./mobile-api-routes"')
    expect(mobileApiDesktopActionsSource).toContain('from "@dotagents/shared/remote-server-route-contracts"')
    expect(mobileApiDesktopActionsSource).toContain("chatCompletion: chatRouteActionBundle.chatCompletion")
    expect(mobileApiDesktopActionsSource).toContain("models: chatRouteActionBundle.models")
    expect(mobileApiDesktopActionsSource).toContain("audit: { recordOperatorAuditEvent }")
    expect(desktopAdaptersSource).toContain("authorizeRequest: authorizeRemoteServerRequest")
    expect(desktopAdaptersSource).not.toContain('from "./operator-api-key-actions"')
    expect(desktopAdaptersSource).not.toContain('from "./remote-server-pairing-actions"')
    expect(desktopAdaptersSource).not.toContain('from "./remote-server-controller"')
    expect(desktopAdaptersSource).toContain('from "@dotagents/shared/remote-server-controller-contracts"')
    expect(desktopAdaptersSource).toContain("import Fastify")
    expect(desktopAdaptersSource).toContain('from "@fastify/cors"')
    expect(desktopAdaptersSource).toContain("buildRemoteServerCorsOptions")
    expect(desktopAdaptersSource).toContain("async function createHttpServer")
    expect(desktopAdaptersSource).toContain("Fastify({")
    expect(desktopAdaptersSource).toContain("bodyLimit: options.bodyLimitBytes")
    expect(desktopAdaptersSource).toContain(
      "await server.register(cors, buildRemoteServerCorsOptions(options.corsOrigins))",
    )
    expect(desktopAdaptersSource).toContain('server.addHook("onRequest", handler)')
    expect(desktopAdaptersSource).toContain('server.addHook("onResponse", handler)')
    expect(desktopAdaptersSource).toContain("await server.listen({ port: options.port, host: options.host })")
    expect(desktopAdaptersSource).toContain("await server.close()")
    expect(desktopAdaptersSource).toContain("reply.code(response.statusCode).send({ error: response.error })")
    expect(desktopAdaptersSource).toContain("createHttpServer,")
    expect(desktopAdaptersSource).toContain("addRequestHook,")
    expect(desktopAdaptersSource).toContain("addResponseHook,")
    expect(desktopAdaptersSource).toContain("listenHttpServer,")
    expect(desktopAdaptersSource).toContain("closeHttpServer,")
    expect(desktopAdaptersSource).toContain("generateApiKey: generateRemoteServerApiKey")
    expect(desktopAdaptersSource).toContain("function generateRemoteServerApiKey()")
    expect(desktopAdaptersSource).toContain('crypto.randomBytes(32).toString("hex")')
    expect(desktopAdaptersSource).toContain("resolveApiKeyReference: readDotAgentsSecretReference")
    expect(desktopAdaptersSource).toContain("resolveConfiguredApiKey: getResolvedRemoteServerApiKey")
    expect(desktopAdaptersSource).toContain("printTerminalQRCode")
    expect(desktopAdaptersSource).toContain("function scheduleDelayedTask(delayMs: number")
    expect(desktopAdaptersSource).toContain("setTimeout(task, delayMs)")
    expect(desktopAdaptersSource).toContain("function scheduleTaskAfterReply(reply: FastifyReply")
    expect(desktopAdaptersSource).toContain('reply.raw.once("finish", run)')
    expect(desktopAdaptersSource).toContain('reply.raw.once("close", run)')
    expect(desktopAdaptersSource).toContain("writeTerminalInfo")
    expect(desktopAdaptersSource).toContain("writeTerminalWarning")
    expect(desktopAdaptersSource).toContain("console.log(message)")
    expect(desktopAdaptersSource).toContain("console.warn(message)")
    expect(sharedRouteContractsSource).toContain("export interface MobileApiRouteActions<Request = unknown, Reply = unknown>")
    expect(sharedRouteContractsSource).toContain("export interface MobileApiRouteActionGroups<Request = unknown, Reply = unknown>")
    expect(sharedRouteContractsSource).toContain("export function createMobileApiRouteActions")
    expect(sharedRouteContractsSource).toContain("...groups.chatCompletion")
    expect(sharedRouteContractsSource).toContain("export interface MobileApiRouteOptions<Request = unknown, Reply = unknown>")
    expect(sharedRouteContractsSource).toContain("export interface OperatorRouteActions<Request = unknown>")
    expect(sharedRouteContractsSource).toContain("export interface OperatorRouteActionGroups<Request = unknown>")
    expect(sharedRouteContractsSource).toContain("export function createOperatorRouteActions")
    expect(sharedRouteContractsSource).toContain("...groups.agent")
    expect(sharedRouteContractsSource).toContain("export interface OperatorRouteOptions<Request = unknown, Reply = unknown>")
    expect(sharedRouteContractsSource).toContain("export interface InjectedMcpRouteActions<Request = unknown, Reply = unknown>")
    expect(sharedRouteContractsSource).toContain("export interface InjectedMcpRouteActionGroups<Request = unknown, Reply = unknown>")
    expect(sharedRouteContractsSource).toContain("export function createInjectedMcpRouteActions")
    expect(sharedRouteContractsSource).toContain("export interface InjectedMcpRouteOptions<Request = unknown, Reply = unknown>")
    expect(sharedRouteContractsSource).toContain("export type MobileApiRunAgentExecutor = AgentRunExecutor")
    expect(sharedRouteContractsSource).toContain("export type OperatorRunAgentExecutor = AgentRunExecutor")
    expect(sharedRouteContractsSource).toContain("export type RemoteServerRouteAuditContext")
    expect(sharedRouteContractsSource).not.toContain("Fastify")
    expect(sharedRouteContractsSource).not.toContain("Electron")
    expect(sharedControllerContractsSource).toContain("export type RemoteServerControllerConfigLike")
    expect(sharedControllerContractsSource).toContain("export interface RemoteServerConfigStore<")
    expect(sharedControllerContractsSource).toContain("export type RemoteServerControllerMaybePromise<T> = T | Promise<T>")
    expect(sharedControllerContractsSource).toContain("export interface RemoteServerHttpServerOptions")
    expect(sharedControllerContractsSource).toContain("export interface RemoteServerHttpListenOptions")
    expect(sharedControllerContractsSource).toContain("export interface RemoteServerControllerAdapters<")
    expect(sharedControllerContractsSource).toContain("Server = unknown")
    expect(sharedControllerContractsSource).toContain("createHttpServer: (options: RemoteServerHttpServerOptions)")
    expect(sharedControllerContractsSource).toContain("addRequestHook: (")
    expect(sharedControllerContractsSource).toContain("addResponseHook: (")
    expect(sharedControllerContractsSource).toContain("listenHttpServer: (server: Server, options: RemoteServerHttpListenOptions)")
    expect(sharedControllerContractsSource).toContain("closeHttpServer: (server: Server) => Promise<void>")
    expect(sharedControllerContractsSource).toContain("scheduleDelayedTask: (delayMs: number, task: () => void) => void")
    expect(sharedControllerContractsSource).toContain("scheduleTaskAfterReply: (reply: Reply, task: () => void) => void")
    expect(sharedControllerContractsSource).toContain("sendAuthFailure: (reply: Reply")
    expect(sharedControllerContractsSource).toContain("writeTerminalInfo: (message: string) => void")
    expect(sharedControllerContractsSource).toContain("writeTerminalWarning: (message: string) => void")
    expect(sharedControllerContractsSource).toContain("Request = unknown")
    expect(sharedControllerContractsSource).toContain("Reply = unknown")
    expect(sharedControllerContractsSource).toContain("export type RemoteServerRouteRegistrar<Server = unknown, Reply = unknown>")
    expect(sharedControllerContractsSource).toContain("export interface RemoteServerControllerOptions<")
    expect(sharedControllerContractsSource).toContain("adapters: RemoteServerControllerAdapters<Request, Reply, Config, Server>")
    expect(sharedControllerContractsSource).toContain("isHeadlessEnvironment: () => boolean")
    expect(sharedControllerContractsSource).toContain("export type RemoteServerRunAgentExecutor = AgentRunExecutor")
    expect(sharedControllerContractsSource).toContain("export interface RemoteServerController")
    expect(sharedControllerContractsSource).not.toContain("Fastify")
    expect(sharedControllerContractsSource).not.toContain("Electron")
  })

  it("keeps remote route action result contracts shared", () => {
    const operatorActionSources = [
      getOperatorAuditActionsSource(),
    ]

    for (const source of operatorActionSources) {
      expect(source).toContain('from "@dotagents/shared/remote-server-route-contracts"')
      expect(source).toContain("= OperatorRouteActionResult")
      expect(source).not.toMatch(/export type \w+ActionResult = \{/)
    }

    const messageQueueActionsSource = getMessageQueueActionsSource()
    const sharedMessageQueueStoreSource = getSharedMessageQueueStoreSource()
    expect(messageQueueActionsSource).toContain('from "@dotagents/shared/message-queue-store"')
    expect(sharedMessageQueueStoreSource).toContain("export function pauseMessageQueueAction(")
    expect(sharedMessageQueueStoreSource).toContain("export function resumeMessageQueueAction(")
    expect(sharedMessageQueueStoreSource).toContain("export function removeQueuedMessageAction(")
    expect(sharedMessageQueueStoreSource).toContain("export function retryQueuedMessageAction(")
    expect(sharedMessageQueueStoreSource).toContain("export function updateQueuedMessageTextAction(")
    expect(sharedMessageQueueStoreSource).toContain("export function createMessageQueueActionOptionsBundle(")
    expect(messageQueueActionsSource).toContain("createMessageQueueActionOptionsBundle({")
    expect(messageQueueActionsSource).toContain("function createMessageQueueActionService(): MessageQueueActionService")
    expect(messageQueueActionsSource).not.toContain("function createQueuedMessagesActionOptions")
    expect(messageQueueActionsSource).not.toContain("function createMessageQueueRuntimeActionOptions")
    expect(messageQueueActionsSource).toContain("pauseMessageQueueAction(conversationId,")
    expect(messageQueueActionsSource).toContain("resumeMessageQueueAction(conversationId,")
    expect(messageQueueActionsSource).toContain("removeQueuedMessageAction(conversationId, messageId,")
    expect(messageQueueActionsSource).toContain("retryQueuedMessageAction(conversationId, messageId,")
    expect(messageQueueActionsSource).toContain("updateQueuedMessageTextAction(conversationId, messageId, text,")
    expect(messageQueueActionsSource).not.toContain("export type QueuedMessageActionResult = {")
  })

  it("routes mobile chat requests through the shared agent runner", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const agentRunActionsSource = getAgentRunActionsSource()
    const sharedAgentRunUtilsSource = getSharedAgentRunUtilsSource()
    const sharedChatUtilsSource = getSharedChatUtilsSource()
    const agentLoopRunnerSource = getAgentLoopRunnerSource()

    expect(sharedAgentRunUtilsSource).toContain("export interface AgentRunOptions")
    expect(sharedAgentRunUtilsSource).toContain("export type AgentRunResult")
    expect(sharedAgentRunUtilsSource).toContain("export type AgentRunExecutor")
    expect(sharedAgentRunUtilsSource).toContain("export async function runRemoteAgentAction")
    expect(sharedAgentRunUtilsSource).toContain("export function createRemoteAgentRunExecutor")
    expect(sharedAgentRunUtilsSource).toContain("export function resolveAgentModeMaxIterations(")
    expect(sharedAgentRunUtilsSource).toContain("formatConversationHistoryForApi(latestConversation?.messages || [])")
    expect(sharedAgentRunUtilsSource).toContain("service.notifyConversationHistoryChanged()")
    expect(agentRunActionsSource).toContain("export type RunAgentOptions = AgentRunOptions")
    expect(agentRunActionsSource).toContain("export type RunAgentResult = AgentRunResult")
    expect(agentRunActionsSource).toContain("createRemoteAgentRunExecutor(")
    expect(agentRunActionsSource).toContain("createRemoteAgentRunActionOptions(notifyConversationHistoryChanged)")
    expect(agentRunActionsSource).toContain("function createRemoteAgentRunActionService(")
    expect(agentRunActionsSource).not.toContain("const actionOptions: RemoteAgentRunActionOptions")
    expect(agentRunActionsSource).toContain("processAgentMode: (prompt, conversationId, existingSessionId, startSnoozed, runOptions) =>")
    expect(mobileApiDesktopActionsSource).not.toContain('from "./chat-completion-actions"')
    expect(mobileApiRoutesSource).toContain("actions.handleChatCompletionRequest(req.body, req.headers.origin, reply, runAgent)")
    expect(sharedChatUtilsSource).toContain("export function validateChatCompletionRequestBody(")
    expect(sharedChatUtilsSource).toContain("export function buildChatCompletionPushNotificationPlan(")
    expect(source).toContain("export { runAgent }")
    expect(agentRunActionsSource).toContain("return runRemoteAgent(options, notifyConversationHistoryChanged)")
    expect(agentRunActionsSource).toContain("processWithAgentMode(")
    expect(agentRunActionsSource).toContain("runOptions,")
    expect(agentLoopRunnerSource).toContain("resolveAgentModeMaxIterations(config")
    expect(source).not.toContain('from "./agent-runtime"')
    expect(source).not.toContain('from "./acp-main-agent"')
    expect(source).not.toContain("agentRuntime.runAgentTurn")
    expect(sharedChatUtilsSource).toContain("export async function handleChatCompletionRequestAction")
    expect(sharedChatUtilsSource).toContain("export interface ChatCompletionRouteActions")
    expect(sharedChatUtilsSource).toContain("export function createChatCompletionRouteActions")
    expect(sharedChatUtilsSource).toContain("export function createChatRouteActionBundle")
    expect(sharedChatUtilsSource).toContain("handleChatCompletionRequest: (body, origin, reply, runAgent) =>")
    expect(sharedChatUtilsSource).toContain("handleChatCompletionRequestAction(body, origin, reply, runAgent, options)")
    expect(sharedChatUtilsSource).toContain("chatCompletion: createChatCompletionRouteActions<Reply>(options.chatCompletion)")
    expect(sharedChatUtilsSource).toContain("validateChatCompletionRequestBody(body, {")
    expect(sharedChatUtilsSource).toContain("validateConversationId: options.validateConversationId")
    expect(sharedChatUtilsSource).toContain("return reply.code(validatedRequest.statusCode).send(validatedRequest.body)")
    expect(sharedChatUtilsSource).toContain("const result = await runAgent({ prompt, conversationId, profileId, onProgress })")
    expect(sharedChatUtilsSource).toContain("const result = await runAgent({ prompt, conversationId, profileId })")
    expect(sharedChatUtilsSource).toContain("buildDotAgentsChatCompletionResponse({")
    expect(sharedChatUtilsSource).toContain("conversationId: result.conversationId")
    expect(sharedChatUtilsSource).toContain("conversationHistory: result.conversationHistory")
    expect(sharedChatUtilsSource).toContain("buildChatCompletionProgressSsePayload(update)")
    expect(sharedChatUtilsSource).toContain("sendChatCompletionPushNotification(chatRequest, result.conversationId, result.content, options)")
    expect(sharedChatUtilsSource).toContain("export function createChatTranscriptHistoryRecorder(")
    expect(sharedChatUtilsSource).toContain("export function recordChatTranscriptHistory(")
    expect(sharedChatUtilsSource).toContain("history.push(buildChatTranscriptHistoryItem(transcript, options))")
    expect(mobileApiDesktopActionsSource).toContain("const chatRouteActionBundle = createChatRouteActionBundle({")
    expect(mobileApiDesktopActionsSource).toContain("chatCompletion: chatRouteActionBundle.chatCompletion")
    expect(mobileApiDesktopActionsSource).not.toContain("handleChatCompletionRequestAction(")
    expect(mobileApiDesktopActionsSource).toContain("const recordHistory = createChatTranscriptHistoryRecorder({")
    expect(mobileApiDesktopActionsSource).toContain("readHistoryText: () => fs.readFileSync(historyPath, \"utf8\")")
    expect(mobileApiDesktopActionsSource).toContain("writeHistoryText: (historyText) => fs.writeFileSync(historyPath, historyText)")
    expect(mobileApiDesktopActionsSource).toContain("chatCompletionActionOptions")
    expect(mobileApiDesktopActionsSource).toContain("validateConversationId: getConversationIdValidationError")
    expect(mobileApiDesktopActionsSource).toContain("recordHistory,")
    expect(mobileApiDesktopActionsSource).toContain("isPushEnabled,")
    expect(mobileApiDesktopActionsSource).toContain("sendPushNotification: sendMessageNotification")
    expect(mobileApiDesktopActionsSource).not.toContain("function recordHistory(transcript")
    expect(mobileApiDesktopActionsSource).not.toContain("history.push(item)")
    expect(mobileApiDesktopActionsSource).not.toContain("buildDotAgentsChatCompletionResponse({")
    expect(mobileApiDesktopActionsSource).not.toContain("buildChatCompletionProgressSsePayload(update)")
    expect(agentLoopRunnerSource).toContain("resolvePreferredTopLevelAcpAgentSelection({")
    expect(agentLoopRunnerSource).toContain("mainAgentMode: config.mainAgentMode")
    expect(agentLoopRunnerSource).toContain("processTranscriptWithACPAgent(text, {")
    expect(agentLoopRunnerSource).toContain("onProgress: options.onProgress")
  })

  it("exposes full skill instructions to the mobile prompt picker", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedSkillsApiSource = getSharedSkillsApiSource()
    const sharedAgentProfileReferenceCleanupSource = getSharedAgentProfileReferenceCleanupSource()

    expectRegisteredApiRoute(source, "GET", "skills")
    expectRegisteredApiRoute(source, "GET", "skill")
    expectRegisteredApiRoute(source, "POST", "skills")
    expectRegisteredApiRoute(source, "POST", "skillImportMarkdown")
    expectRegisteredApiRoute(source, "POST", "skillImportGitHub")
    expectRegisteredApiRoute(source, "GET", "skillExportMarkdown")
    expectRegisteredApiRoute(source, "PATCH", "skill")
    expectRegisteredApiRoute(source, "DELETE", "skill")
    expectRegisteredApiRoute(source, "POST", "skillToggleProfile")
    expect(mobileApiRoutesSource).toContain("actions.getSkills()")
    expect(mobileApiRoutesSource).toContain("actions.getSkill(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.createSkill(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.importSkillFromMarkdown(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.importSkillFromGitHub(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.exportSkillToMarkdown(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.updateSkill(params.id, req.body)")
    expect(mobileApiRoutesSource).toContain("actions.deleteSkill(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.toggleProfileSkill(params.id)")
    expect(mobileApiDesktopActionsSource).toContain("const skillRouteActions = createSkillRouteActions(skillActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("skills: skillRouteActions")
    expect(mobileApiDesktopActionsSource).toContain("service: createSkillActionService({")
    expect(mobileApiDesktopActionsSource).toContain("skills: skillsService")
    expect(mobileApiDesktopActionsSource).toContain("profile: agentProfileService")
    expect(mobileApiDesktopActionsSource).not.toContain("getSkillsAction(skillActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("getSkillAction(skillId, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("createSkillAction(body, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("importSkillFromMarkdownAction(body, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("importSkillFromGitHubAction(body, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("exportSkillToMarkdownAction(skillId, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("updateSkillAction(skillId, body, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("deleteSkillAction(skillId, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("toggleProfileSkillAction(skillId, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("onSkillDeleted: ({ availableSkillIds }) => {")
    expect(mobileApiDesktopActionsSource).toContain("const layers = getAgentProfileReferenceCleanupLayers()")
    expect(mobileApiDesktopActionsSource).not.toContain("const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()")
    expect(mobileApiDesktopActionsSource).toContain("cleanupInvalidSkillReferencesInLayers(")
    expect(mobileApiDesktopActionsSource).toContain("agentProfileService.reload()")
    expect(sharedAgentProfileReferenceCleanupSource).toContain(
      "export function resolveAgentProfileReferenceCleanupLayers",
    )
    expect(sharedSkillsApiSource).toContain("export interface SkillActionOptions")
    expect(sharedSkillsApiSource).toContain("export function createSkillActionService")
    expect(sharedSkillsApiSource).toContain("getSkills: () => skills.getSkills()")
    expect(sharedSkillsApiSource).toContain("getCurrentProfile: () => profile.getCurrentProfile()")
    expect(sharedSkillsApiSource).toContain("onSkillDeleted?(context: SkillDeletedContext): void")
    expect(sharedSkillsApiSource).toContain("export interface SkillRouteActions")
    expect(sharedSkillsApiSource).toContain("export function createSkillRouteActions")
    expect(sharedSkillsApiSource).toContain("getSkills: () => getSkillsAction(options)")
    expect(sharedSkillsApiSource).toContain("updateSkill: (id, body) => updateSkillAction(id, body, options)")
    expect(sharedSkillsApiSource).toContain("export function getSkillsAction")
    expect(sharedSkillsApiSource).toContain("export function getSkillAction")
    expect(sharedSkillsApiSource).toContain("export function createSkillAction")
    expect(sharedSkillsApiSource).toContain("export function importSkillFromMarkdownAction")
    expect(sharedSkillsApiSource).toContain("export async function importSkillFromGitHubAction")
    expect(sharedSkillsApiSource).toContain("export function exportSkillToMarkdownAction")
    expect(sharedSkillsApiSource).toContain("export function updateSkillAction")
    expect(sharedSkillsApiSource).toContain("export function deleteSkillAction")
    expect(sharedSkillsApiSource).toContain("options.onSkillDeleted({")
    expect(sharedSkillsApiSource).toContain("export function toggleProfileSkillAction")
    expect(sharedSkillsApiSource).toContain("buildSkillsResponse(skills, currentProfile)")
    expect(sharedSkillsApiSource).toContain("parseSkillCreateRequestBody(body)")
    expect(sharedSkillsApiSource).toContain("parseSkillImportMarkdownRequestBody(body)")
    expect(sharedSkillsApiSource).toContain("parseSkillImportGitHubRequestBody(body)")
    expect(sharedSkillsApiSource).toContain("parseSkillUpdateRequestBody(body)")
    expect(sharedSkillsApiSource).toContain("buildSkillMutationResponse(skill")
    expect(sharedSkillsApiSource).toContain("buildSkillImportGitHubResponse(result.imported, currentProfile, result.errors)")
    expect(sharedSkillsApiSource).toContain("buildSkillExportMarkdownResponse(skillId, markdown)")
    expect(sharedSkillsApiSource).toContain("buildSkillDeleteResponse(skillId)")
    expect(sharedSkillsApiSource).toContain("buildSkillToggleResponse(skillId ?? \"\", updatedProfile)")
    expect(sharedSkillsApiSource).toContain("options.service.toggleProfileSkill(currentProfile.id, skillId ?? \"\", allSkillIds)")
    expect(sharedSkillsApiSource).not.toContain('from "./agent-profile-service"')
    expect(sharedSkillsApiSource).not.toContain('from "./skills-service"')
  })

  it("exposes remote server, tunnel, and Discord settings in the remote settings GET/PATCH routes", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedSettingsApiClientSource = getSharedSettingsApiClientSource()
    const sharedDiscordConfigSource = getSharedDiscordConfigSource()
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
    expect(mobileApiDesktopActionsSource).toContain("const settingsRouteActionBundle = createSettingsRouteActionBundle({")
    expect(mobileApiDesktopActionsSource).toContain("settings: settingsRouteActionBundle.settings")
    expect(mobileApiDesktopActionsSource).not.toContain("getSettingsAction(providerSecretMask, settingsActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain(
      "getMaskedRemoteServerApiKey: (config) => getMaskedRemoteServerApiKey(config.remoteServerApiKey)",
    )
    expect(mobileApiDesktopActionsSource).toContain(
      "getMaskedDiscordBotToken: (config) => getMaskedDiscordBotToken(config, process.env)",
    )
    expect(mobileApiDesktopActionsSource).toContain(
      "getDiscordDefaultProfileId: (config) => getDiscordResolvedDefaultProfileId(config, process.env).profileId ?? \"\"",
    )
    expect(mobileApiDesktopActionsSource).toContain(
      "getAcpxAgents: () => getEnabledAcpxAgentProfiles(agentProfileService.getAll())",
    )
    expect(mobileApiDesktopActionsSource).toContain(
      "applyDiscordLifecycleAction: (action) => applyDiscordLifecycleActionToService(action, discordService)",
    )
    expect(mobileApiDesktopActionsSource).not.toContain("async function applyDiscordLifecycleAction(")
    expect(mobileApiDesktopActionsSource).not.toContain("p.connection.type === 'acpx'")
    expect(sharedDiscordConfigSource).toContain("export async function applyDiscordLifecycleActionToService(")
    expect(sharedDiscordConfigSource).toContain('if (action === "start")')
    expect(sharedDiscordConfigSource).toContain('} else if (action === "restart")')
    expect(sharedDiscordConfigSource).toContain('} else if (action === "stop")')
    expect(sharedSettingsApiClientSource).toContain("export interface SettingsActionOptions")
    expect(sharedSettingsApiClientSource).toContain("export interface SettingsRouteActions")
    expect(sharedSettingsApiClientSource).toContain("export function getSettingsAction")
    expect(sharedSettingsApiClientSource).toContain("export function createSettingsRouteActions")
    expect(sharedSettingsApiClientSource).toContain("export function createSettingsRouteActionBundle")
    expect(sharedSettingsApiClientSource).toContain("settings: createSettingsRouteActions(options.settings)")
    expect(sharedSettingsApiClientSource).toContain("getSettings: (providerSecretMask) => getSettingsAction(providerSecretMask, options)")
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
    expect(mobileApiDesktopActionsSource).not.toContain("updateSettingsAction(body, masks, settingsActionOptions)")
    expect(sharedSettingsApiClientSource).toContain("export async function updateSettingsAction")
    expect(sharedSettingsApiClientSource).toContain("updateSettings: (body, masks) => updateSettingsAction(body, masks, options)")
    expect(sharedSettingsApiClientSource).toContain("const requestBody = getSettingsUpdateRequestRecord(body)")
    expect(sharedSettingsApiClientSource).toContain("buildSettingsUpdatePatch(requestBody, cfg, masks)")
    expect(sharedSettingsApiClientSource).toContain("const remoteServerLifecycleAction = getRemoteServerLifecycleAction(cfg, nextConfig)")
    expect(sharedSettingsApiClientSource).toContain("options.getDiscordLifecycleAction(cfg, nextConfig)")
    expect(sharedSettingsApiClientSource).toContain("await options.applyDiscordLifecycleAction(discordLifecycleAction)")
    expect(sharedSettingsApiClientSource).toContain("await options.applyWhatsappToggle(prevEnabled, updates.whatsappEnabled)")
    expect(sharedSettingsApiClientSource).not.toContain('from "./config"')
  })

  it("delegates agent session candidate route behavior to shared session candidate actions", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedAgentSessionCandidatesSource = getSharedAgentSessionCandidatesSource()

    expectRegisteredApiRoute(source, "GET", "agentSessionCandidates")
    expect(mobileApiRoutesSource).toContain("actions.getAgentSessionCandidates(req.query)")
    expect(mobileApiDesktopActionsSource).toContain(
      "const agentSessionCandidateRouteActions = createAgentSessionCandidateRouteActions(agentSessionCandidateActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).toContain("agentSessionCandidates: agentSessionCandidateRouteActions")
    expect(mobileApiDesktopActionsSource).toContain("service: createAgentSessionCandidateService(agentSessionTracker)")
    expect(mobileApiDesktopActionsSource).not.toContain(
      "getAgentSessionCandidatesAction(query, agentSessionCandidateActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).not.toContain("agentSessionTracker.getActiveSessions()")
    expect(mobileApiDesktopActionsSource).not.toContain("agentSessionTracker.getRecentSessions(limit)")
    expect(sharedAgentSessionCandidatesSource).toContain("export interface AgentSessionCandidateRouteActions")
    expect(sharedAgentSessionCandidatesSource).toContain("export function createAgentSessionCandidateService")
    expect(sharedAgentSessionCandidatesSource).toContain("getActiveSessions: () => tracker.getActiveSessions()")
    expect(sharedAgentSessionCandidatesSource).toContain("getRecentSessions: (limit) => tracker.getRecentSessions(limit)")
    expect(sharedAgentSessionCandidatesSource).toContain("export function getAgentSessionCandidatesAction")
    expect(sharedAgentSessionCandidatesSource).toContain("export function createAgentSessionCandidateRouteActions")
    expect(sharedAgentSessionCandidatesSource).toContain(
      "getAgentSessionCandidates: (query) => getAgentSessionCandidatesAction(query, options)",
    )
    expect(sharedAgentSessionCandidatesSource).toContain("parseAgentSessionCandidateLimit(query)")
    expect(sharedAgentSessionCandidatesSource).toContain("buildAgentSessionCandidatesResponse(")
    expect(sharedAgentSessionCandidatesSource).not.toContain('from "./agent-session-tracker"')
  })

  it("keeps agent session tracker state transitions shared", () => {
    const agentSessionTrackerSource = getAgentSessionTrackerSource()
    const sharedAgentSessionStoreSource = getSharedAgentSessionStoreSource()

    expect(agentSessionTrackerSource).toContain('from "@dotagents/shared/agent-session-store"')
    expect(agentSessionTrackerSource).toContain("createAgentSessionStore({")
    expect(agentSessionTrackerSource).toContain("restoreAgentSessionStoreState(")
    expect(agentSessionTrackerSource).not.toContain("private sessions: Map")
    expect(agentSessionTrackerSource).not.toContain("private completedSessions")
    expect(sharedAgentSessionStoreSource).toContain("export interface AgentSession")
    expect(sharedAgentSessionStoreSource).toContain("export function createAgentSessionStore")
    expect(sharedAgentSessionStoreSource).toContain("export function restoreAgentSessionStoreState")
    expect(sharedAgentSessionStoreSource).toContain("DEFAULT_AGENT_SESSION_RESTART_ACTIVITY")
    expect(sharedAgentSessionStoreSource).not.toContain("@egoist/tipc")
    expect(sharedAgentSessionStoreSource).not.toContain("WINDOWS")
    expect(sharedAgentSessionStoreSource).not.toContain("electron")
  })

  it("delegates emergency stop route behavior to emergency stop actions", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedSettingsApiClientSource = getSharedSettingsApiClientSource()

    expectRegisteredApiRoute(source, "POST", "emergencyStop")
    expect(mobileApiRoutesSource).toContain("actions.triggerEmergencyStop()")
    expect(mobileApiDesktopActionsSource).toContain("emergencyStop: emergencyStopActionOptions")
    expect(mobileApiDesktopActionsSource).toContain("emergencyStop: settingsRouteActionBundle.emergencyStop")
    expect(mobileApiDesktopActionsSource).not.toContain("triggerEmergencyStopAction(emergencyStopActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("stopAll: emergencyStopAll")
    expect(sharedSettingsApiClientSource).toContain("export interface EmergencyStopActionOptions")
    expect(sharedSettingsApiClientSource).toContain("export interface EmergencyStopRouteActions")
    expect(sharedSettingsApiClientSource).toContain("export async function triggerEmergencyStopAction")
    expect(sharedSettingsApiClientSource).toContain("export function createEmergencyStopRouteActions")
    expect(sharedSettingsApiClientSource).toContain("emergencyStop: createEmergencyStopRouteActions(options.emergencyStop)")
    expect(sharedSettingsApiClientSource).toContain("triggerEmergencyStop: () => triggerEmergencyStopAction(options)")
    expect(sharedSettingsApiClientSource).toContain("await options.stopAll()")
    expect(sharedSettingsApiClientSource).toContain("buildEmergencyStopResponse(before, after)")
    expect(sharedSettingsApiClientSource).toContain("buildEmergencyStopErrorResponse(caughtError)")
    expect(sharedSettingsApiClientSource).not.toContain('from "./emergency-stop"')
    expect(sharedSettingsApiClientSource).not.toContain("diagnosticsService")
  })

  it("delegates profile route behavior to profile actions", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
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
    expect(mobileApiDesktopActionsSource).toContain("const profileRouteActionBundle = createProfileRouteActionBundle({")
    expect(mobileApiDesktopActionsSource).toContain("services: createProfileActionServices({")
    expect(mobileApiDesktopActionsSource).toContain("profile: agentProfileService")
    expect(mobileApiDesktopActionsSource).toContain("profiles: profileRouteActionBundle.profiles")
    expect(mobileApiDesktopActionsSource).not.toContain("getUserProfiles: () => agentProfileService.getUserProfiles()")
    expect(mobileApiDesktopActionsSource).not.toContain("setCurrentProfileStrict: (profileId) => agentProfileService.setCurrentProfileStrict(profileId)")
    expect(mobileApiDesktopActionsSource).not.toContain("getProfilesAction(profileActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("getCurrentProfileAction(profileActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("setCurrentProfileAction(body, profileActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("exportProfileAction(id, profileActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("importProfileAction(body, profileActionOptions)")
    expect(sharedProfileApiSource).toContain("export interface ProfileActionOptions")
    expect(sharedProfileApiSource).toContain("export interface ProfileRouteActions")
    expect(sharedProfileApiSource).toContain("export function createProfileActionServices")
    expect(sharedProfileApiSource).toContain("profile: {")
    expect(sharedProfileApiSource).toContain("getUserProfiles: () => options.profile.getUserProfiles()")
    expect(sharedProfileApiSource).toContain("export function createProfileRouteActions")
    expect(sharedProfileApiSource).toContain("export function createProfileRouteActionBundle")
    expect(sharedProfileApiSource).toContain("profiles: createProfileRouteActions(profileOptions)")
    expect(sharedProfileApiSource).toContain("getProfiles: () => getProfilesAction(options)")
    expect(sharedProfileApiSource).toContain("setCurrentProfile: (body) => setCurrentProfileAction(body, options)")
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
    expect(mobileApiDesktopActionsSource).toContain("toolConfigToMcpServerConfig(profile.toolConfig)")
    expect(mobileApiDesktopActionsSource).toContain("mcpService.applyProfileMcpConfig(")
  })

  it("delegates bundle export routes to shared bundle actions", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedBundleApiSource = getSharedBundleApiSource()

    expectRegisteredApiRoute(source, "GET", "bundleExportableItems")
    expectRegisteredApiRoute(source, "POST", "bundleExport")
    expectRegisteredApiRoute(source, "POST", "bundleImportPreview")
    expectRegisteredApiRoute(source, "POST", "bundleImport")
    expect(mobileApiRoutesSource).toContain("actions.getBundleExportableItems()")
    expect(mobileApiRoutesSource).toContain("actions.exportBundle(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.previewBundleImport(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.importBundle(req.body)")
    expect(mobileApiDesktopActionsSource).toContain("const bundleRouteActions = createBundleRouteActions(bundleActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("bundle: bundleRouteActions")
    expect(mobileApiDesktopActionsSource).not.toContain("getBundleExportableItemsAction(bundleActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("exportBundleAction(body, bundleActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("previewBundleImportAction(body, bundleActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("importBundleAction(body, bundleActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain(
      "return resolveBundleImportTargetDir(globalAgentsFolder, resolveWorkspaceAgentsFolder())",
    )
    expect(mobileApiDesktopActionsSource).toContain("const bundleActionService = createLayeredBundleActionService({")
    expect(mobileApiDesktopActionsSource).toContain("getGlobalAgentsFolder: () => globalAgentsFolder")
    expect(mobileApiDesktopActionsSource).toContain("getWorkspaceAgentsFolder: resolveWorkspaceAgentsFolder")
    expect(mobileApiDesktopActionsSource).toContain("getExportableItemsFromLayers")
    expect(mobileApiDesktopActionsSource).toContain("exportBundleFromLayers: (layerDirs, request: ExportBundleRequest) => exportBundleFromLayers(layerDirs, request)")
    expect(mobileApiDesktopActionsSource).toContain("service: bundleActionService")
    expect(mobileApiDesktopActionsSource).toContain("const temporaryBundleImportService = createTemporaryBundleFileImportService({")
    expect(mobileApiDesktopActionsSource).toContain("writeTemporaryBundleFile: (bundleJson) => {")
    expect(mobileApiDesktopActionsSource).toContain("createTemporaryBundleFileName({ createUniqueId: randomUUID })")
    expect(mobileApiDesktopActionsSource).not.toContain("`${Date.now()}-${randomUUID()}.dotagents`")
    expect(mobileApiDesktopActionsSource).toContain("deleteTemporaryBundleFile: (filePath) => {")
    expect(mobileApiDesktopActionsSource).toContain("previewBundleFile: (filePath, targetDir) => previewBundleWithConflicts(filePath, targetDir)")
    expect(mobileApiDesktopActionsSource).toContain("importBundleFromFile(filePath, targetDir, request)")
    expect(mobileApiDesktopActionsSource).toContain("previewBundleImport: temporaryBundleImportService.previewBundleImport")
    expect(mobileApiDesktopActionsSource).toContain("importBundle: temporaryBundleImportService.importBundle")
    expect(mobileApiDesktopActionsSource).not.toContain("async function withTemporaryBundleFile")
    expect(mobileApiDesktopActionsSource).not.toContain("return await run(filePath)")
    expect(sharedBundleApiSource).toContain("export interface BundleRouteActions")
    expect(sharedBundleApiSource).toContain("export function getBundleExportableItemsAction")
    expect(sharedBundleApiSource).toContain("export async function exportBundleAction")
    expect(sharedBundleApiSource).toContain("export async function previewBundleImportAction")
    expect(sharedBundleApiSource).toContain("export async function importBundleAction")
    expect(sharedBundleApiSource).toContain("export function resolveBundleExportLayerDirs(")
    expect(sharedBundleApiSource).toContain("export function resolveBundleImportTargetDir(")
    expect(sharedBundleApiSource).toContain("export function createLayeredBundleActionService(")
    expect(sharedBundleApiSource).toContain("getExportableItems: () => options.getExportableItemsFromLayers(getLayerDirs())")
    expect(sharedBundleApiSource).toContain("exportBundle: (request) => options.exportBundleFromLayers(getLayerDirs(), request)")
    expect(sharedBundleApiSource).toContain("export function createTemporaryBundleFileName(")
    expect(sharedBundleApiSource).toContain("export function createTemporaryBundleFileImportService(")
    expect(sharedBundleApiSource).toContain("export async function previewBundleImportFromTemporaryFile(")
    expect(sharedBundleApiSource).toContain("export async function importBundleFromTemporaryFile(")
    expect(sharedBundleApiSource).toContain("await options.temporaryFiles.deleteTemporaryBundleFile(filePath)")
    expect(sharedBundleApiSource).toContain("export function createBundleRouteActions")
    expect(sharedBundleApiSource).toContain("getBundleExportableItems: () => getBundleExportableItemsAction(options)")
    expect(sharedBundleApiSource).toContain("exportBundle: (body) => exportBundleAction(body, options)")
    expect(sharedBundleApiSource).toContain("previewBundleImport: (body) => previewBundleImportAction(body, options)")
    expect(sharedBundleApiSource).toContain("importBundle: (body) => importBundleAction(body, options)")
    expect(sharedBundleApiSource).toContain("parseExportBundleRequestBody(body)")
    expect(sharedBundleApiSource).toContain("parsePreviewBundleImportRequestBody(body)")
    expect(sharedBundleApiSource).toContain("parseImportBundleRequestBody(body)")
    expect(sharedBundleApiSource).toContain("buildBundleExportResponse(await options.service.exportBundle(parsed.request))")
    expect(sharedBundleApiSource).not.toContain("bundle-service")
    expect(sharedBundleApiSource).not.toContain("dialog")
  })

  it("delegates agent profile route behavior to agent profile actions", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedProfileApiSource = getSharedProfileApiSource()

    expectRegisteredApiRoute(source, "GET", "agentProfiles")
    expectRegisteredApiRoute(source, "POST", "agentProfileVerifyCommand")
    expectRegisteredApiRoute(source, "POST", "agentProfilesReload")
    expectRegisteredApiRoute(source, "POST", "agentProfileToggle")
    expectRegisteredApiRoute(source, "GET", "agentProfile")
    expectRegisteredApiRoute(source, "POST", "agentProfiles")
    expectRegisteredApiRoute(source, "PATCH", "agentProfile")
    expectRegisteredApiRoute(source, "DELETE", "agentProfile")
    expect(mobileApiRoutesSource).toContain("actions.getAgentProfiles(query.role)")
    expect(mobileApiRoutesSource).toContain("actions.verifyExternalAgentCommand(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.reloadAgentProfiles()")
    expect(mobileApiRoutesSource).toContain("actions.toggleAgentProfile(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.getAgentProfile(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.createAgentProfile(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.updateAgentProfile(params.id, req.body)")
    expect(mobileApiRoutesSource).toContain("actions.deleteAgentProfile(params.id)")
    expect(mobileApiDesktopActionsSource).toContain("const profileRouteActionBundle = createProfileRouteActionBundle({")
    expect(mobileApiDesktopActionsSource).toContain("agentProfile: agentProfileService")
    expect(mobileApiDesktopActionsSource).toContain("verifyExternalAgentCommand: verifyExternalAgentCommandService")
    expect(mobileApiDesktopActionsSource).toContain("agentProfiles: profileRouteActionBundle.agentProfiles")
    expect(mobileApiDesktopActionsSource).not.toContain("deleteProfile: (profileId) => agentProfileService.delete(profileId)")
    expect(mobileApiDesktopActionsSource).not.toContain("reload: () => agentProfileService.reload()")
    expect(mobileApiDesktopActionsSource).not.toContain("getAgentProfilesAction(role, agentProfileActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain(
      "verifyExternalAgentCommandAction(body, externalAgentCommandVerificationActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).not.toContain("reloadAgentProfilesAction(agentProfileReloadActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("toggleAgentProfileAction(id, agentProfileActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("getAgentProfileAction(id, agentProfileActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("createAgentProfileAction(body, agentProfileActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("updateAgentProfileAction(id, body, agentProfileActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("deleteAgentProfileAction(id, agentProfileActionOptions)")
    expect(sharedProfileApiSource).toContain("export interface AgentProfileActionOptions")
    expect(sharedProfileApiSource).toContain("export interface AgentProfileServiceAdapter")
    expect(sharedProfileApiSource).toContain("deleteProfile: (profileId) => options.agentProfile.delete(profileId)")
    expect(sharedProfileApiSource).toContain("verifyExternalAgentCommand: (request) => options.verifyExternalAgentCommand(request)")
    expect(sharedProfileApiSource).toContain("export interface AgentProfileRouteActions")
    expect(sharedProfileApiSource).toContain("export function createAgentProfileRouteActions")
    expect(sharedProfileApiSource).toContain("agentProfiles: createAgentProfileRouteActions({")
    expect(sharedProfileApiSource).toContain("externalCommandVerification: externalCommandVerificationOptions")
    expect(sharedProfileApiSource).toContain("getAgentProfiles: (role) => getAgentProfilesAction(role, options.agentProfile)")
    expect(sharedProfileApiSource).toContain("reloadAgentProfiles: () => reloadAgentProfilesAction(options.reload)")
    expect(sharedProfileApiSource).toContain("export function getAgentProfilesAction")
    expect(sharedProfileApiSource).toContain("export async function verifyExternalAgentCommandAction")
    expect(sharedProfileApiSource).toContain("export function reloadAgentProfilesAction")
    expect(sharedProfileApiSource).toContain("parseVerifyExternalAgentCommandRequestBody(body)")
    expect(sharedProfileApiSource).toContain("export function toggleAgentProfileAction")
    expect(sharedProfileApiSource).toContain("export function getAgentProfileAction")
    expect(sharedProfileApiSource).toContain("export function createAgentProfileAction")
    expect(sharedProfileApiSource).toContain("export function updateAgentProfileAction")
    expect(sharedProfileApiSource).toContain("export function deleteAgentProfileAction")
    expect(sharedProfileApiSource).toContain("filterAgentProfilesByRole(profiles, role)")
    expect(sharedProfileApiSource).toContain("buildAgentProfilesResponse(profiles)")
    expect(sharedProfileApiSource).toContain("buildAgentProfilesReloadResponse(options.service.getAll())")
    expect(sharedProfileApiSource).toContain("buildAgentProfileToggleResponse(profileId, updated?.enabled ?? !profile.enabled)")
    expect(sharedProfileApiSource).toContain("parseAgentProfileCreateRequestBody(body)")
    expect(sharedProfileApiSource).toContain("parseAgentProfileUpdateRequestBody(body")
    expect(sharedProfileApiSource).toContain("buildAgentProfileMutationDetailResponse(updatedProfile)")
    expect(sharedProfileApiSource).toContain("buildAgentProfileDeleteResponse()")
    expect(sharedProfileApiSource).not.toContain('from "./agent-profile-service"')
  })

  it("delegates model, MCP server, TTS, and push routes to shared action handlers", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedMcpApiSource = getSharedMcpApiSource()
    const sharedAgentProfileReferenceCleanupSource = getSharedAgentProfileReferenceCleanupSource()
    const sharedChatUtilsSource = getSharedChatUtilsSource()
    const sharedTtsApiSource = getSharedTtsApiSource()
    const pushNotificationServiceSource = getPushNotificationServiceSource()
    const sharedPushNotificationsSource = getSharedPushNotificationsSource()

    expectRegisteredApiRoute(source, "GET", "models")
    expectRegisteredApiRoute(source, "GET", "modelsByProvider")
    expectRegisteredApiRoute(source, "GET", "mcpServers")
    expectRegisteredApiRoute(source, "POST", "mcpServerToggle")
    expectRegisteredApiRoute(source, "PUT", "mcpConfigServer")
    expectRegisteredApiRoute(source, "DELETE", "mcpConfigServer")
    expectRegisteredApiRoute(source, "POST", "mcpConfigImport")
    expectRegisteredApiRoute(source, "GET", "mcpConfigExport")
    expectRegisteredApiRoute(source, "POST", "ttsSpeak")
    expectRegisteredApiRoute(source, "POST", "pushRegister")
    expectRegisteredApiRoute(source, "POST", "pushUnregister")
    expectRegisteredApiRoute(source, "GET", "pushStatus")
    expectRegisteredApiRoute(source, "POST", "pushClearBadge")
    expect(mobileApiRoutesSource).toContain("actions.getModels()")
    expect(mobileApiRoutesSource).toContain("actions.getProviderModels(params.providerId)")
    expect(mobileApiRoutesSource).toContain("actions.getMcpServers()")
    expect(mobileApiRoutesSource).toContain("actions.toggleMcpServer(params.name, req.body)")
    expect(mobileApiRoutesSource).toContain("actions.upsertMcpServerConfig(params.name, req.body)")
    expect(mobileApiRoutesSource).toContain("actions.deleteMcpServerConfig(params.name)")
    expect(mobileApiRoutesSource).toContain("actions.importMcpServerConfigs(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.exportMcpServerConfigs()")
    expect(mobileApiRoutesSource).toContain("actions.synthesizeSpeech(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.registerPushToken(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.unregisterPushToken(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.getPushStatus()")
    expect(mobileApiRoutesSource).toContain("actions.clearPushBadge(req.body)")
    expect(mobileApiDesktopActionsSource).toContain("models: modelActionOptions")
    expect(mobileApiDesktopActionsSource).toContain("models: chatRouteActionBundle.models")
    expect(mobileApiDesktopActionsSource).not.toContain("getModelsAction(modelActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("getProviderModelsAction(providerId, modelActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("fetchAvailableModels: async (providerId) =>")
    expect(sharedChatUtilsSource).toContain("export interface ModelActionOptions")
    expect(sharedChatUtilsSource).toContain("export interface ModelRouteActions")
    expect(sharedChatUtilsSource).toContain("export function createModelRouteActions")
    expect(sharedChatUtilsSource).toContain("models: createModelRouteActions(options.models)")
    expect(sharedChatUtilsSource).toContain("getModels: () => getModelsAction(options)")
    expect(sharedChatUtilsSource).toContain("getProviderModels: (providerId) => getProviderModelsAction(providerId, options)")
    expect(sharedChatUtilsSource).toContain("export function getModelsAction")
    expect(sharedChatUtilsSource).toContain("export async function getProviderModelsAction")
    expect(sharedChatUtilsSource).toContain("resolveActiveModelId(options.getConfig())")
    expect(sharedChatUtilsSource).toContain("options.fetchAvailableModels(providerId)")
    expect(sharedChatUtilsSource).not.toContain("models-service")
    expect(sharedChatUtilsSource).not.toContain("configStore")
    expect(mobileApiDesktopActionsSource).toContain("const mcpRouteActions = createMcpRouteActions({")
    expect(mobileApiDesktopActionsSource).toContain("server: mcpServerActionOptions")
    expect(mobileApiDesktopActionsSource).toContain("config: mcpServerConfigActionOptions")
    expect(mobileApiDesktopActionsSource).toContain("mcp: mcpRouteActions")
    expect(mobileApiDesktopActionsSource).toContain("service: createMcpConfigActionService({")
    expect(mobileApiDesktopActionsSource).toContain("save: (config) => configStore.save(config)")
    expect(mobileApiDesktopActionsSource).not.toContain("getMcpServersAction(mcpServerActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("toggleMcpServerAction(serverName, body, mcpServerActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain(
      "upsertMcpServerConfigAction(serverName, body, mcpServerConfigActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).not.toContain(
      "deleteMcpServerConfigAction(serverName, mcpServerConfigActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).not.toContain("importMcpServerConfigsAction(body, mcpServerConfigActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("exportMcpServerConfigsAction(mcpServerConfigActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("onMcpServerDeleted: ({ availableServerNames }) => {")
    expect(mobileApiDesktopActionsSource).toContain("function getAgentProfileReferenceCleanupLayers()")
    expect(mobileApiDesktopActionsSource).toContain("resolveAgentProfileReferenceCleanupLayers(")
    expect(mobileApiDesktopActionsSource).toContain("cleanupInvalidMcpServerReferencesInLayers(layers, validServerNames)")
    expect(mobileApiDesktopActionsSource).toContain("agentProfileService.reload()")
    expect(sharedAgentProfileReferenceCleanupSource).toContain(
      "export function resolveAgentProfileReferenceCleanupLayers",
    )
    expect(sharedMcpApiSource).toContain("export interface McpServerActionService")
    expect(sharedMcpApiSource).toContain("export interface McpServerConfigActionService")
    expect(sharedMcpApiSource).toContain("export function createMcpConfigActionService")
    expect(sharedMcpApiSource).toContain("getMcpConfig: () => store.get().mcpConfig || { mcpServers: {} }")
    expect(sharedMcpApiSource).toContain("store.save({ ...config, mcpConfig })")
    expect(sharedMcpApiSource).toContain("onMcpServerDeleted?(context: McpServerDeletedContext): void")
    expect(sharedMcpApiSource).toContain("export interface McpRouteActions")
    expect(sharedMcpApiSource).toContain("export function getMcpServersAction")
    expect(sharedMcpApiSource).toContain("export function toggleMcpServerAction")
    expect(sharedMcpApiSource).toContain("export function upsertMcpServerConfigAction")
    expect(sharedMcpApiSource).toContain("export function deleteMcpServerConfigAction")
    expect(sharedMcpApiSource).toContain("export function importMcpServerConfigsAction")
    expect(sharedMcpApiSource).toContain("export function exportMcpServerConfigsAction")
    expect(sharedMcpApiSource).toContain("export function createMcpRouteActions")
    expect(sharedMcpApiSource).toContain("getMcpServers: () => getMcpServersAction(options.server)")
    expect(sharedMcpApiSource).toContain(
      "toggleMcpServer: (serverName, body) => toggleMcpServerAction(serverName, body, options.server)",
    )
    expect(sharedMcpApiSource).toContain("exportMcpServerConfigs: () => exportMcpServerConfigsAction(options.config)")
    expect(sharedMcpApiSource).toContain("importMcpServerConfigs: (body) => importMcpServerConfigsAction(body, options.config)")
    expect(sharedMcpApiSource).toContain(
      "upsertMcpServerConfig: (serverName, body) => upsertMcpServerConfigAction(serverName, body, options.config)",
    )
    expect(sharedMcpApiSource).toContain(
      "deleteMcpServerConfig: (serverName) => deleteMcpServerConfigAction(serverName, options.config)",
    )
    expect(sharedMcpApiSource).toContain("buildMcpServersResponse(options.service.getServerStatus())")
    expect(sharedMcpApiSource).toContain("options.service.setServerRuntimeEnabled(normalizedServerName, enabled)")
    expect(sharedMcpApiSource).toContain("options.service.saveMcpConfig(nextMcpConfig)")
    expect(sharedMcpApiSource).toContain("mergeImportedMcpServers(currentMcpConfig, parsedRequest.request.config")
    expect(sharedMcpApiSource).toContain("buildMcpServerConfigExportResponse(options.service.getMcpConfig())")
    expect(sharedMcpApiSource).toContain("options.service.onMcpConfigSaved?.({")
    expect(sharedMcpApiSource).toContain("options.onMcpServerDeleted?.({")
    expect(sharedMcpApiSource).not.toContain("mcpService")
    expect(sharedMcpApiSource).not.toContain("diagnosticsService")
    expect(mobileApiDesktopActionsSource).toContain("const ttsRouteActions = createTtsRouteActions(ttsActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("tts: ttsRouteActions")
    expect(mobileApiDesktopActionsSource).not.toContain("synthesizeSpeechAction(body, ttsActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("generateSpeech: generateTTS")
    expect(mobileApiDesktopActionsSource).toContain("encodeAudioBody: (audio) => Buffer.from(audio)")
    expect(sharedTtsApiSource).toContain("export interface TtsActionOptions")
    expect(sharedTtsApiSource).toContain("export interface TtsRouteActions")
    expect(sharedTtsApiSource).toContain("export async function synthesizeSpeechAction")
    expect(sharedTtsApiSource).toContain("export function createTtsRouteActions")
    expect(sharedTtsApiSource).toContain("synthesizeSpeech: (body) => synthesizeSpeechAction(body, options)")
    expect(sharedTtsApiSource).toContain("parseTtsSpeakRequestBody(body)")
    expect(sharedTtsApiSource).toContain("options.generateSpeech(parsedRequest.request, options.getConfig())")
    expect(sharedTtsApiSource).toContain("options.encodeAudioBody(result.audio)")
    expect(sharedTtsApiSource).not.toContain("tts-service")
    expect(sharedTtsApiSource).not.toContain("configStore")
    expect(mobileApiDesktopActionsSource).toContain("const pushRouteActions = createPushRouteActions(pushActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("push: pushRouteActions")
    expect(mobileApiDesktopActionsSource).not.toContain("registerPushTokenAction(body, pushActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("unregisterPushTokenAction(body, pushActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("getPushStatusAction(pushActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("clearPushBadgeAction(body, pushActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("tokenStore: createPushConfigTokenStore({")
    expect(mobileApiDesktopActionsSource).toContain("save: (config) => configStore.save(config)")
    expect(mobileApiDesktopActionsSource).toContain("clearBadgeCount")
    expect(sharedPushNotificationsSource).toContain("export interface PushActionTokenStore")
    expect(sharedPushNotificationsSource).toContain("export function createPushConfigTokenStore")
    expect(sharedPushNotificationsSource).toContain("getPushNotificationTokens: () => store.get().pushNotificationTokens ?? []")
    expect(sharedPushNotificationsSource).toContain("store.save({ ...config, pushNotificationTokens: tokens })")
    expect(sharedPushNotificationsSource).toContain("export interface PushRouteActions")
    expect(sharedPushNotificationsSource).toContain("export function createPushRouteActions")
    expect(sharedPushNotificationsSource).toContain("registerPushToken: (body) => registerPushTokenAction(body, options)")
    expect(sharedPushNotificationsSource).toContain("getPushStatus: () => getPushStatusAction(options)")
    expect(sharedPushNotificationsSource).toContain("export function registerPushTokenAction")
    expect(sharedPushNotificationsSource).toContain("export function unregisterPushTokenAction")
    expect(sharedPushNotificationsSource).toContain("export function getPushStatusAction")
    expect(sharedPushNotificationsSource).toContain("export function clearPushBadgeAction")
    expect(sharedPushNotificationsSource).toContain("export function buildMessagePushNotificationPayload(")
    expect(sharedPushNotificationsSource).toContain("export function buildPushNotificationDispatchPlan")
    expect(sharedPushNotificationsSource).toContain("export function summarizeExpoPushTickets")
    expect(pushNotificationServiceSource).toContain("buildMessagePushNotificationPayload({")
    expect(pushNotificationServiceSource).toContain("buildPushNotificationDispatchPlan(tokens, payload)")
    expect(pushNotificationServiceSource).toContain("summarizeExpoPushTickets(tickets, tokens)")
    expect(sharedPushNotificationsSource).toContain("options.tokenStore.savePushNotificationTokens(registrationResult.tokens)")
    expect(sharedPushNotificationsSource).not.toContain("configStore")
    expect(sharedPushNotificationsSource).not.toContain("push-notification-service")
  })

  it("delegates conversation sync and media routes to conversation actions", () => {
    const source = getRemoteServerSource()
    const serveSource = getServeSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const conversationImageAssetsSource = getConversationImageAssetsSource()
    const conversationVideoAssetsSource = getConversationVideoAssetsSource()
    const sharedRemoteServerRouteContractsSource = getSharedRemoteServerRouteContractsSource()
    const sharedConversationSyncSource = getSharedConversationSyncSource()
    const sharedConversationMediaAssetsSource = getSharedConversationMediaAssetsSource()

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
    expect(mobileApiDesktopActionsSource).toContain("const conversationRouteActions = createConversationRouteActions(conversationActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("conversations: conversationRouteActions")
    expect(mobileApiDesktopActionsSource).toContain("service: createConversationActionService({")
    expect(mobileApiDesktopActionsSource).toContain("service: conversationService")
    expect(mobileApiDesktopActionsSource).toContain("generateConversationId: () => conversationService.generateConversationIdPublic()")
    expect(mobileApiDesktopActionsSource).not.toContain("conversationService.loadConversation(conversationId)")
    expect(mobileApiDesktopActionsSource).not.toContain("conversationService.getConversationHistory()")
    expect(mobileApiDesktopActionsSource).not.toContain("conversationService.saveConversation(conversation, preserveTimestamp)")
    expect(mobileApiDesktopActionsSource).not.toContain("getConversationAction(id, conversationActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("getConversationsAction(conversationActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain(
      "createConversationAction(body, onChanged, conversationActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).not.toContain(
      "updateConversationAction(id, body, onChanged, conversationActionOptions)",
    )
    expect(sharedConversationSyncSource).toContain("export interface ConversationActionOptions")
    expect(sharedConversationSyncSource).toContain("export function createConversationActionService")
    expect(sharedConversationSyncSource).toContain("loadConversation: (conversationId) => service.loadConversation(conversationId)")
    expect(sharedConversationSyncSource).toContain("saveConversation: (conversation, preserveTimestamp) => service.saveConversation(conversation, preserveTimestamp)")
    expect(sharedConversationSyncSource).toContain("export interface ConversationRouteActions")
    expect(sharedConversationSyncSource).toContain("export function createConversationRouteActions")
    expect(sharedConversationSyncSource).toContain("export async function getConversationAction")
    expect(sharedConversationSyncSource).toContain("export async function getConversationsAction")
    expect(sharedConversationSyncSource).toContain("export async function createConversationAction")
    expect(sharedConversationSyncSource).toContain("export async function updateConversationAction")
    expect(sharedConversationSyncSource).toContain("getConversation: (id) => getConversationAction(id, options)")
    expect(sharedConversationSyncSource).toContain("getConversations: () => getConversationsAction(options)")
    expect(sharedConversationSyncSource).toContain("createConversation: (body, onChanged) => createConversationAction(body, onChanged, options)")
    expect(sharedConversationSyncSource).toContain("updateConversation: (id, body, onChanged) => updateConversationAction(id, body, onChanged, options)")
    expect(sharedConversationSyncSource).toContain("options.validateConversationId(conversationId)")
    expect(sharedConversationSyncSource).toContain("options.service.loadConversation(conversationId)")
    expect(sharedConversationSyncSource).toContain("buildServerConversationFullResponse(conversation, { includeMetadata: true })")
    expect(sharedConversationSyncSource).toContain("buildServerConversationsResponse(conversations)")
    expect(sharedConversationSyncSource).toContain("parseCreateConversationRequestBody(body)")
    expect(sharedConversationSyncSource).toContain("buildNewServerConversation(conversationId, parsedRequest.request, timestamp)")
    expect(sharedConversationSyncSource).toContain("parseUpdateConversationRequestBody(body)")
    expect(sharedConversationSyncSource).toContain("applyServerConversationUpdate(conversation, parsedRequest.request, timestamp)")
    expect(sharedConversationSyncSource).not.toContain('from "./conversation-service"')
    expect(mobileApiDesktopActionsSource).toContain("const conversationVideoAssetActionOptions: ConversationVideoAssetActionOptions")
    expect(mobileApiDesktopActionsSource).toContain(
      "const conversationVideoAssetRouteActions = createConversationVideoAssetRouteActions(conversationVideoAssetActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).toContain("conversationVideoAssets: conversationVideoAssetRouteActions")
    expect(mobileApiDesktopActionsSource).toContain("service: createConversationVideoAssetFileService({")
    expect(mobileApiDesktopActionsSource).toContain("resolveVideoAssetPath: getConversationVideoAssetPath")
    expect(mobileApiDesktopActionsSource).toContain("const stat = await fs.promises.stat(assetPath)")
    expect(mobileApiDesktopActionsSource).toContain("fs.createReadStream(assetPath, { start: range.start, end: range.end })")
    expect(mobileApiDesktopActionsSource).not.toContain("getVideoAssetFile: async (conversationId, fileName) =>")
    expect(mobileApiDesktopActionsSource).not.toContain("return getConversationVideoAssetAction(")
    expect(mobileApiDesktopActionsSource).not.toContain("buildConversationVideoAssetStreamPlan(fileName ?? \"\", rangeHeader, stat.size)")
    expect(mobileApiDesktopActionsSource).not.toContain("buildMobileApiActionError(400, conversationIdError)")
    expect(mobileApiDesktopActionsSource).not.toContain("buildMobileApiActionResult(")
    expect(sharedRemoteServerRouteContractsSource).toContain("export function buildMobileApiActionResult(")
    expect(sharedRemoteServerRouteContractsSource).toContain("export function buildMobileApiActionError(")
    expect(sharedRemoteServerRouteContractsSource).toContain("return buildMobileApiActionResult({ error: message }, statusCode, headers)")
    expect(sharedConversationMediaAssetsSource).toContain("export function buildConversationVideoAssetStreamPlan(")
    expect(sharedConversationMediaAssetsSource).toContain("export async function getConversationVideoAssetAction")
    expect(sharedConversationMediaAssetsSource).toContain("export function createConversationVideoAssetFileService")
    expect(sharedConversationMediaAssetsSource).toContain("const assetPath = options.resolveVideoAssetPath(conversationId, fileName)")
    expect(sharedConversationMediaAssetsSource).toContain("const fileInfo = await options.fileSystem.getFileInfo(assetPath)")
    expect(sharedConversationMediaAssetsSource).toContain("createBody: (range) => options.fileSystem.createReadBody(assetPath, range)")
    expect(sharedConversationMediaAssetsSource).toContain("export interface ConversationVideoAssetRouteActions")
    expect(sharedConversationMediaAssetsSource).toContain("export function createConversationVideoAssetRouteActions")
    expect(sharedConversationMediaAssetsSource).toContain("getConversationVideoAsset: (id, fileName, rangeHeader) =>")
    expect(sharedConversationMediaAssetsSource).toContain("getConversationVideoAssetAction(id, fileName, rangeHeader, options)")
    expect(sharedConversationMediaAssetsSource).toContain("options.validateConversationId(conversationId)")
    expect(sharedConversationMediaAssetsSource).toContain("options.service.getVideoAssetFile(conversationId, assetFileName)")
    expect(sharedConversationMediaAssetsSource).toContain("buildConversationVideoAssetStreamPlan(assetFileName, rangeHeader, assetFile.size)")
    expect(sharedConversationMediaAssetsSource).toContain("getConversationVideoByteRange(rangeHeader, totalSize)")
    expect(sharedConversationMediaAssetsSource).toContain("export const CONVERSATION_IMAGE_ASSET_HOST = 'conversation-image'")
    expect(sharedConversationMediaAssetsSource).toContain("export const CONVERSATION_IMAGE_ASSETS_DIR_NAME = '_images'")
    expect(sharedConversationMediaAssetsSource).toContain("export function buildConversationImageAssetUrl(")
    expect(sharedConversationMediaAssetsSource).toContain("export function isSafeConversationImageAssetFileName(")
    expect(sharedConversationMediaAssetsSource).toContain("export interface ConversationMediaAssetPathAdapter")
    expect(sharedConversationMediaAssetsSource).toContain("export function getConversationImageAssetPath(")
    expect(sharedConversationMediaAssetsSource).toContain("export function getConversationVideoAssetPath(")
    expect(sharedConversationMediaAssetsSource).toContain("export function parseConversationImageAssetUrl(")
    expect(sharedConversationMediaAssetsSource).toContain("export function isConversationImageAssetUrl(")
    expect(conversationImageAssetsSource).toContain('from "@dotagents/shared/conversation-media-assets"')
    expect(conversationImageAssetsSource).toContain("getConversationImageAssetPath as getSharedConversationImageAssetPath")
    expect(conversationImageAssetsSource).toContain("pathAdapter: path")
    expect(conversationImageAssetsSource).not.toContain("SAFE_IMAGE_ASSET_FILE_REGEX")
    expect(conversationImageAssetsSource).not.toContain("isSafeConversationImageAssetFileName(fileName)")
    expect(conversationImageAssetsSource).not.toContain("assertSafeConversationId")
    expect(conversationVideoAssetsSource).toContain("getConversationVideoAssetPath as getSharedConversationVideoAssetPath")
    expect(conversationVideoAssetsSource).toContain("pathAdapter: path")
    expect(conversationVideoAssetsSource).not.toContain("isSafeConversationVideoAssetFileName(fileName)")
    expect(conversationVideoAssetsSource).not.toContain("assertSafeConversationId")
    expect(serveSource).toContain("parseConversationImageAssetUrl(request.url)")
    expect(serveSource).toContain("parseConversationVideoAssetUrl(request.url)")
    expect(mobileApiDesktopActionsSource).toContain("fs.createReadStream(assetPath")
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
    const operatorIntegrationSummarySource = getOperatorIntegrationSummarySource()
    const operatorAuditActionsSource = getOperatorAuditActionsSource()
    const sharedOperatorAuditStoreSource = getSharedOperatorAuditStoreSource()
    const sharedOperatorActionsSource = getSharedOperatorActionsSource()
    const operatorRouteDesktopActionsSource = getOperatorRouteDesktopActionsSource()

    expect(operatorRoutesSource).toContain("actions.getOperatorStatus(getRemoteServerStatus())")
    expect(operatorRoutesSource).toContain("actions.getOperatorHealth()")
    expect(operatorRoutesSource).toContain("actions.getOperatorErrors(query.count)")
    expect(operatorRoutesSource).toContain("actions.getOperatorLogs(query.count, query.level)")
    expect(operatorRoutesSource).toContain("actions.getOperatorConversations(query.count)")
    expect(operatorRoutesSource).toContain("actions.getOperatorRemoteServer(getRemoteServerStatus())")
    expect(operatorRouteDesktopActionsSource).toContain(
      "const operatorObservabilityRouteActions = createOperatorObservabilityRouteActions(observabilityActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("observability: operatorObservabilityRouteActions")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorStatusAction(remoteServerStatus, observabilityActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorHealthAction(observabilityActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorErrorsAction(count, observabilityActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorLogsAction(count, level, observabilityActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorConversationsAction(count, observabilityActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorRemoteServerAction(remoteServerStatus)")
    expect(operatorRouteDesktopActionsSource).toContain("service: createOperatorObservabilityActionService({")
    expect(operatorRouteDesktopActionsSource).toContain("getTunnelStatus: getCloudflareTunnelStatus")
    expect(operatorRouteDesktopActionsSource).toContain("getSystemMetrics: getOperatorSystemMetrics")
    expect(sharedOperatorActionsSource).toContain("export interface OperatorObservabilityRouteActions")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorObservabilityRouteActions")
    expect(sharedOperatorActionsSource).toContain("getOperatorStatus: (remoteServerStatus) => getOperatorStatusAction(remoteServerStatus, options)")
    expect(sharedOperatorActionsSource).toContain("getOperatorHealth: () => getOperatorHealthAction(options)")
    expect(sharedOperatorActionsSource).toContain("getOperatorErrors: (count) => getOperatorErrorsAction(count, options)")
    expect(sharedOperatorActionsSource).toContain("getOperatorLogs: (count, level) => getOperatorLogsAction(count, level, options)")
    expect(sharedOperatorActionsSource).toContain("getOperatorConversations: (count) => getOperatorConversationsAction(count, options)")
    expect(sharedOperatorActionsSource).toContain("getOperatorRemoteServer: (remoteServerStatus) => getOperatorRemoteServerAction(remoteServerStatus)")
    expect(sharedOperatorActionsSource).toContain("export async function getOperatorStatusAction(")
    expect(sharedOperatorActionsSource).toContain("export async function getOperatorHealthAction(")
    expect(sharedOperatorActionsSource).toContain("export function getOperatorErrorsAction(")
    expect(sharedOperatorActionsSource).toContain("export function getOperatorLogsAction(")
    expect(operatorRoutesSource).toContain("actions.getOperatorAudit(query.count)")
    expect(controllerSource).toContain("adapters.recordOperatorResponseAuditEvent(req, reply)")
    expect(desktopAdaptersSource).toContain("recordOperatorResponseAuditEvent")
    expect(operatorAuditActionsSource).toContain(
      "export const operatorAuditRouteActions = createOperatorAuditRouteActions(operatorAuditActionOptions)",
    )
    expect(operatorAuditActionsSource).not.toContain("getOperatorAuditAction(count, operatorAuditActionOptions)")
    expect(sharedOperatorActionsSource).toContain("export function getOperatorAuditAction(")
    expect(sharedOperatorActionsSource).toContain("export interface OperatorAuditRouteActions")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorAuditRouteActions")
    expect(sharedOperatorActionsSource).toContain("getOperatorAudit: (count) => getOperatorAuditAction(count, options)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorAuditResponse(options.getEntries(), count)")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorAuditRecorder(")
    expect(operatorAuditActionsSource).toContain(
      "operatorAuditRecorder.recordResponseAuditEvent(request, reply, getOperatorAuditContext(request))",
    )
    expect(operatorAuditActionsSource).not.toContain("buildOperatorResponseAuditContext(request")
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
    expect(operatorRouteDesktopActionsSource).toContain(
      "const operatorIntegrationRouteActions = createOperatorIntegrationRouteActions(integrationActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("integrations: operatorIntegrationRouteActions")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorIntegrationsAction(integrationActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorDiscordAction(integrationActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorDiscordLogsAction(count, integrationActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain("connectOperatorDiscordAction(integrationActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain("logoutOperatorWhatsAppAction(integrationActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("service: createOperatorIntegrationActionService({")
    expect(operatorRouteDesktopActionsSource).toContain("getIntegrationsSummary: buildOperatorIntegrationsSummary")
    expect(operatorRouteDesktopActionsSource).toContain("discord: discordService")
    expect(operatorRouteDesktopActionsSource).toContain("getWhatsAppSummary: getOperatorWhatsAppIntegrationSummary")
    expect(operatorRouteDesktopActionsSource).toContain("mcp: mcpService")
    expect(operatorRouteDesktopActionsSource).not.toContain("startDiscord: () => discordService.start()")
    expect(operatorRouteDesktopActionsSource).not.toContain("stopDiscord: () => discordService.stop()")
    expect(operatorRouteDesktopActionsSource).not.toContain("clearDiscordLogs: () => discordService.clearLogs()")
    expect(operatorRouteDesktopActionsSource).not.toContain("mcpService.executeToolCall")
    expect(operatorRouteDesktopActionsSource).toContain("WHATSAPP_SERVER_NAME")
    expect(sharedOperatorActionsSource).toContain("export interface OperatorIntegrationRouteActions")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorIntegrationActionService")
    expect(sharedOperatorActionsSource).toContain("getDiscordStatus: () => options.discord.getStatus()")
    expect(sharedOperatorActionsSource).toContain("isWhatsAppServerConnected: () =>")
    expect(sharedOperatorActionsSource).toContain("options.whatsapp.mcp.getServerStatus()[options.whatsapp.serverName]?.connected")
    expect(sharedOperatorActionsSource).toContain("{ name: toolName, arguments: {} }")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorIntegrationRouteActions")
    expect(sharedOperatorActionsSource).toContain("getOperatorIntegrations: () => getOperatorIntegrationsAction(options)")
    expect(sharedOperatorActionsSource).toContain("getOperatorDiscord: () => getOperatorDiscordAction(options)")
    expect(sharedOperatorActionsSource).toContain("getOperatorDiscordLogs: (count) => getOperatorDiscordLogsAction(count, options)")
    expect(sharedOperatorActionsSource).toContain("connectOperatorDiscord: () => connectOperatorDiscordAction(options)")
    expect(sharedOperatorActionsSource).toContain("disconnectOperatorDiscord: () => disconnectOperatorDiscordAction(options)")
    expect(sharedOperatorActionsSource).toContain("clearOperatorDiscordLogs: () => clearOperatorDiscordLogsAction(options)")
    expect(sharedOperatorActionsSource).toContain("getOperatorWhatsApp: () => getOperatorWhatsAppAction(options)")
    expect(sharedOperatorActionsSource).toContain("connectOperatorWhatsApp: () => connectOperatorWhatsAppAction(options)")
    expect(sharedOperatorActionsSource).toContain("logoutOperatorWhatsApp: () => logoutOperatorWhatsAppAction(options)")
    expect(sharedOperatorActionsSource).toContain("export async function getOperatorIntegrationsAction(")
    expect(sharedOperatorActionsSource).toContain("export function getOperatorDiscordAction(")
    expect(sharedOperatorActionsSource).toContain("export async function connectOperatorWhatsAppAction(")
    expect(sharedOperatorActionsSource).toContain("export async function getOperatorWhatsAppIntegrationSummaryAction(")
    expect(sharedOperatorActionsSource).toContain("export async function buildOperatorIntegrationsSummaryAction(")
    expect(sharedOperatorActionsSource).toContain("buildOperatorDiscordIntegrationSummary(")
    expect(sharedOperatorActionsSource).toContain("buildOperatorDiscordLogsResponse(options.service.getDiscordLogs(), count)")
    expect(sharedOperatorActionsSource).toContain("getOperatorMcpToolResultText(result)")
    expect(sharedOperatorActionsSource).toContain("mergeOperatorWhatsAppStatusPayload(summary, textPayload)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorWhatsAppActionSuccessResponse({ action, text, successMessage })")
    expect(operatorIntegrationSummarySource).toContain("buildOperatorIntegrationsSummary")
    expect(operatorIntegrationSummarySource).toContain("getOperatorWhatsAppIntegrationSummary")
    expect(operatorIntegrationSummarySource).toContain("buildOperatorIntegrationsSummaryAction({")
    expect(operatorIntegrationSummarySource).toContain("getOperatorWhatsAppIntegrationSummaryAction({")
    expect(operatorIntegrationSummarySource).not.toContain("buildOperatorWhatsAppIntegrationSummary")
    expect(operatorIntegrationSummarySource).not.toContain("buildOperatorDiscordIntegrationSummary")
    expect(operatorIntegrationSummarySource).not.toContain("buildOperatorPushNotificationsSummary")
    expect(operatorIntegrationSummarySource).not.toContain("mergeOperatorWhatsAppStatusPayload")
    expect(operatorRouteDesktopActionsSource).toContain('from "./operator-integration-summary"')
    expect(operatorRouteDesktopActionsSource).not.toContain('from "./operator-integration-actions"')
    expect(operatorLifecycleSection).toContain("scheduleRemoteServerRestartFromOperator")
    expect(operatorLifecycleSection).toContain("scheduleAppRestartFromOperator")
    expect(operatorLifecycleSection).toContain("scheduleRemoteServerLifecycleActionAfterReply")
    expect(operatorRoutesSource).toContain("actions.getOperatorTunnel()")
    expect(operatorRoutesSource).toContain("actions.getOperatorTunnelSetup()")
    expect(operatorRoutesSource).toContain("actions.startOperatorTunnel(getRemoteServerStatus().running)")
    expect(operatorRoutesSource).toContain("actions.stopOperatorTunnel()")
    expect(operatorRouteDesktopActionsSource).toContain(
      "const operatorTunnelRouteActions = createOperatorTunnelRouteActions(tunnelActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("tunnel: operatorTunnelRouteActions")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorTunnelAction(tunnelActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorTunnelSetupAction(tunnelActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "startOperatorTunnelAction(remoteServerRunning, tunnelActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain("stopOperatorTunnelAction(tunnelActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("service: createOperatorTunnelActionService({")
    expect(operatorRouteDesktopActionsSource).toContain("checkCloudflaredInstalled")
    expect(operatorRouteDesktopActionsSource).toContain("listCloudflareTunnels")
    expect(operatorRouteDesktopActionsSource).toContain("startNamedCloudflareTunnel")
    expect(operatorRouteDesktopActionsSource).toContain("startCloudflareTunnel")
    expect(operatorRouteDesktopActionsSource).toContain("stopCloudflareTunnel")
    expect(operatorRouteDesktopActionsSource).not.toContain("startQuickTunnel: startCloudflareTunnel")
    expect(operatorRouteDesktopActionsSource).not.toContain("startNamedTunnel: startNamedCloudflareTunnel")
    expect(operatorRouteDesktopActionsSource).not.toContain("stopTunnel: stopCloudflareTunnel")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorTunnelActionService")
    expect(sharedOperatorActionsSource).toContain("startQuickTunnel: () => options.startCloudflareTunnel()")
    expect(sharedOperatorActionsSource).toContain(
      "startNamedTunnel: (tunnelOptions) => options.startNamedCloudflareTunnel(tunnelOptions)",
    )
    expect(sharedOperatorActionsSource).toContain("export interface OperatorTunnelRouteActions")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorTunnelRouteActions")
    expect(sharedOperatorActionsSource).toContain("getOperatorTunnel: () => getOperatorTunnelAction(options)")
    expect(sharedOperatorActionsSource).toContain("getOperatorTunnelSetup: () => getOperatorTunnelSetupAction(options)")
    expect(sharedOperatorActionsSource).toContain("startOperatorTunnel: (remoteServerRunning) => startOperatorTunnelAction(remoteServerRunning, options)")
    expect(sharedOperatorActionsSource).toContain("stopOperatorTunnel: () => stopOperatorTunnelAction(options)")
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
    expect(operatorRouteDesktopActionsSource).toContain(
      "const operatorUpdaterRouteActions = createOperatorUpdaterRouteActions(MANUAL_RELEASES_URL, updaterActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("updater: operatorUpdaterRouteActions")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "getOperatorUpdaterAction(currentVersion, MANUAL_RELEASES_URL, updaterActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "checkOperatorUpdaterAction(MANUAL_RELEASES_URL, updaterActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain("downloadLatestOperatorUpdateAssetAction(updaterActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain("openOperatorReleasesPageAction(updaterActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("service: createOperatorUpdaterActionService({")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "const updaterActionOptions: OperatorUpdaterActionOptions = {\n  service: {\n    getUpdateInfo,",
    )
    expect(operatorRouteDesktopActionsSource).toContain("checkForUpdatesAndDownload")
    expect(operatorRouteDesktopActionsSource).toContain("downloadLatestReleaseAsset")
    expect(operatorRouteDesktopActionsSource).toContain("revealDownloadedReleaseAsset")
    expect(operatorRouteDesktopActionsSource).toContain("openDownloadedReleaseAsset")
    expect(operatorRouteDesktopActionsSource).toContain("openManualReleasesPage")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorUpdaterActionService")
    expect(sharedOperatorActionsSource).toContain("getUpdateInfo: () => options.getUpdateInfo()")
    expect(sharedOperatorActionsSource).toContain(
      "downloadLatestReleaseAsset: () => options.downloadLatestReleaseAsset()",
    )
    expect(sharedOperatorActionsSource).toContain("export interface OperatorUpdaterRouteActions")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorUpdaterRouteActions")
    expect(sharedOperatorActionsSource).toContain(
      "getOperatorUpdater: (currentVersion) => getOperatorUpdaterAction(currentVersion, manualReleasesUrl, options)",
    )
    expect(sharedOperatorActionsSource).toContain(
      "checkOperatorUpdater: () => checkOperatorUpdaterAction(manualReleasesUrl, options)",
    )
    expect(sharedOperatorActionsSource).toContain(
      "downloadLatestOperatorUpdateAsset: () => downloadLatestOperatorUpdateAssetAction(options)",
    )
    expect(sharedOperatorActionsSource).toContain("openOperatorReleasesPage: () => openOperatorReleasesPageAction(options)")
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
    expect(sharedOperatorActionsSource).toContain("buildRejectedOperatorDeviceAuditEntry({")
    expect(operatorAuditActionsSource).toContain("operatorAuditRecorder.recordRejectedDeviceAttempt(request, failureReason)")
    expect(controllerSource).toContain("adapters.recordRejectedOperatorDeviceAttempt(req, authDecision.auditFailureReason)")
    expect(controllerSource).toContain("authDecision.auditFailureReason")
    expect(controllerSource).toContain("adapters.sendAuthFailure(reply, {")
    expect(desktopAdaptersSource).toContain("reply.code(response.statusCode).send({ error: response.error })")
    expect(operatorAuditActionsSource).toContain("fs.appendFileSync(operatorAuditLogPath")
    expect(sharedOperatorActionsSource).toContain("getOperatorAuditDeviceId(request)")
    expect(sharedOperatorActionsSource).toContain("getOperatorAuditSource(request)")
    expect(operatorAuditActionsSource).not.toContain("getOperatorAuditDeviceId(request)")
    expect(operatorAuditActionsSource).not.toContain("getOperatorAuditSource(request)")
    expect(operatorAuditActionsSource).toContain("function recordOperatorAuditEvent")
    expect(operatorAuditActionsSource).toContain(
      "export const operatorAuditRouteActions = createOperatorAuditRouteActions(operatorAuditActionOptions)",
    )
    expect(operatorTaskSchedulerSection).toContain("adapters.scheduleTaskAfterReply(reply, () => {")
    expect(desktopAdaptersSource).toContain("reply.raw.once(\"finish\", run)")
    expect(operatorLifecycleSection).toContain("void restartRemoteServer().catch")
    expect(operatorLifecycleSection).toContain("relaunchApp()")
    expect(operatorLifecycleSection).toContain("quitApp()")
    expect(source).toContain("relaunchApp: () => app.relaunch()")
    expect(source).toContain("quitApp: () => app.quit()")
    expect(operatorSection).toContain("actions.restartOperatorRemoteServer(getRemoteServerStatus().running)")
    expect(operatorSection).toContain("actions.restartOperatorApp(getAppVersion())")
    expect(operatorSection).toContain("scheduleRemoteServerRestartFromOperator()")
    expect(operatorSection).toContain("scheduleAppRestartFromOperator()")
    expect(operatorRouteDesktopActionsSource).toContain(
      "const operatorRestartRouteActions = createOperatorRestartRouteActions()",
    )
    expect(operatorRouteDesktopActionsSource).toContain("restart: operatorRestartRouteActions")
    expect(operatorRouteDesktopActionsSource).not.toContain("restartOperatorRemoteServerAction as restartOperatorRemoteServer")
    expect(operatorRouteDesktopActionsSource).not.toContain("restartOperatorAppAction as restartOperatorApp")
    expect(sharedOperatorActionsSource).toContain("export function restartOperatorRemoteServerAction(")
    expect(sharedOperatorActionsSource).toContain("export interface OperatorRestartRouteActions")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorRestartRouteActions")
    expect(sharedOperatorActionsSource).toContain("restartOperatorApp: (appVersion) => restartOperatorAppAction(appVersion)")
    expect(sharedOperatorActionsSource).toContain(
      "restartOperatorRemoteServer: (isRunning) => restartOperatorRemoteServerAction(isRunning)",
    )
    expect(sharedOperatorActionsSource).toContain("buildOperatorRestartRemoteServerActionResponse(isRunning)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorRestartAppActionResponse(appVersion)")
    expect(sharedOperatorActionsSource).toContain("auditContext: buildOperatorActionAuditContext(body)")
    expect(operatorSection).toContain("actions.rotateOperatorRemoteServerApiKey()")
    expect(operatorSection).toContain("scheduleRemoteServerRestartAfterReply(reply)")
    expect(operatorRouteDesktopActionsSource).toContain(
      "const operatorApiKeyRouteActions = createOperatorApiKeyRouteActions(apiKeyActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("apiKey: operatorApiKeyRouteActions")
    expect(operatorRouteDesktopActionsSource).not.toContain("rotateOperatorRemoteServerApiKeyAction(apiKeyActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("service: createOperatorApiKeyActionService<Config>({")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "const apiKeyActionOptions: OperatorApiKeyActionOptions<Config> = {\n  config: {",
    )
    expect(operatorRouteDesktopActionsSource).toContain('generateApiKey: () => crypto.randomBytes(32).toString("hex")')
    expect(desktopAdaptersSource).toContain("generateApiKey: generateRemoteServerApiKey")
    expect(desktopAdaptersSource).toContain("function generateRemoteServerApiKey()")
    expect(sharedOperatorActionsSource).toContain("export interface OperatorApiKeyActionService")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorApiKeyActionService")
    expect(sharedOperatorActionsSource).toContain("rotateRemoteServerApiKey: () => {")
    expect(sharedOperatorActionsSource).toContain("const nextConfig = { ...cfg, remoteServerApiKey: apiKey } as TConfig")
    expect(sharedOperatorActionsSource).toContain("export interface OperatorApiKeyRouteActions")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorApiKeyRouteActions")
    expect(sharedOperatorActionsSource).toContain(
      "rotateOperatorRemoteServerApiKey: () => rotateOperatorRemoteServerApiKeyAction(options)",
    )
    expect(sharedOperatorActionsSource).toContain("buildOperatorApiKeyRotationResponse(apiKey)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorApiKeyRotationAuditContext()")
    expect(sharedOperatorActionsSource).toContain("buildOperatorApiKeyRotationFailureAuditContext()")
    // Runtime status shaping stays shared while desktop supplies process and service state.
    expect(sharedOperatorActionsSource).toContain("export function createOperatorSystemMetricsCollector(")
    expect(sharedOperatorActionsSource).toContain("buildOperatorRuntimeStatus({")
    expect(sharedOperatorActionsSource).toContain("system: options.service.getSystemMetrics()")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorObservabilityActionService")
    expect(sharedOperatorActionsSource).toContain("getRecentErrors: (count) => options.diagnostics.getRecentErrors(count)")
    expect(sharedOperatorActionsSource).toContain("getActiveSessions: () => options.sessions.getActiveSessions()")
    expect(sharedOperatorActionsSource).toContain("getConversationHistory: () => options.conversations.getConversationHistory()")
    expect(operatorRouteDesktopActionsSource).toContain("const getOperatorSystemMetrics = createOperatorSystemMetricsCollector({")
    expect(operatorRouteDesktopActionsSource).toContain("os.platform()")
    expect(operatorRouteDesktopActionsSource).toContain("process.memoryUsage()")
    expect(operatorRouteDesktopActionsSource).toContain("os.hostname()")
    expect(operatorRouteDesktopActionsSource).toContain("service: createOperatorObservabilityActionService({")
    expect(operatorRouteDesktopActionsSource).toContain("diagnostics: diagnosticsService")
    expect(operatorRouteDesktopActionsSource).toContain("sessions: agentSessionTracker")
    expect(operatorRouteDesktopActionsSource).not.toContain("getActiveSessions: () => agentSessionTracker.getActiveSessions()")
    expect(operatorRouteDesktopActionsSource).not.toContain("getRecentSessions: (count) => agentSessionTracker.getRecentSessions(count)")
    // Conversations endpoint
    expect(sharedOperatorActionsSource).toContain("buildOperatorConversationsResponse(history, count)")
    expect(operatorRouteDesktopActionsSource).toContain("conversations: conversationService")
    expect(operatorRouteDesktopActionsSource).not.toContain("getConversationHistory: () => conversationService.getConversationHistory()")
    expectRegisteredApiRoute(source, "GET", "operatorConversations")
    // Run-agent endpoint
    const agentRunActionsSource = getAgentRunActionsSource()
    expectRegisteredApiRoute(source, "POST", "operatorRunAgent")
    expect(agentRunActionsSource).toContain("createRemoteAgentRunExecutor(")
    expect(agentRunActionsSource).toContain("createRemoteAgentRunActionOptions(notifyConversationHistoryChanged)")
    expect(agentRunActionsSource).toContain("processWithAgentMode(")
    expect(agentRunActionsSource).toContain("runOptions,")
    expect(operatorRoutesSource).toContain("actions.runOperatorAgent(req.body, runAgent)")
    expect(operatorRouteDesktopActionsSource).not.toContain('from "@dotagents/shared/agent-run-utils"')
    expect(operatorRouteDesktopActionsSource).toContain(
      "const operatorAgentRouteActions = createOperatorAgentRouteActions(agentActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("agent: operatorAgentRouteActions")
    expect(operatorRouteDesktopActionsSource).not.toContain("runOperatorAgentAction(body, runAgent, agentActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("service: createOperatorAgentActionService({")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorAgentActionService")
    expect(sharedOperatorActionsSource).toContain(
      "stopAgentSessionById: (sessionId) => options.stopAgentSessionById(sessionId)",
    )
    expect(sharedOperatorActionsSource).toContain("export interface OperatorAgentRouteActions")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorAgentRouteActions")
    expect(sharedOperatorActionsSource).toContain(
      "runOperatorAgent: (body, runAgent) => runOperatorAgentAction(body, runAgent, options)",
    )
    expect(sharedOperatorActionsSource).toContain("export async function runOperatorAgentAction(")
    expect(sharedOperatorActionsSource).toContain("parseOperatorRunAgentRequestBody(body)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorRunAgentResponse(agentResult)")
    // Agent session controls
    expectRegisteredApiRoute(source, "POST", "operatorAgentSessionStop")
    expect(operatorRoutesSource).toContain("actions.stopOperatorAgentSession(params.sessionId)")
    expect(operatorRouteDesktopActionsSource).toContain("stopAgentSessionById")
    expect(operatorRouteDesktopActionsSource).not.toContain("stopOperatorAgentSessionAction(sessionIdParam, agentActionOptions)")
    expect(sharedOperatorActionsSource).toContain(
      "stopOperatorAgentSession: (sessionIdParam) => stopOperatorAgentSessionAction(sessionIdParam, options)",
    )
    expect(sharedOperatorActionsSource).toContain("export async function stopOperatorAgentSessionAction(")
    expect(sharedOperatorActionsSource).toContain("buildOperatorAgentSessionStopResponse(stopResult.sessionId, stopResult.conversationId)")
    // Message queue operator endpoints
    expectRegisteredApiRoute(source, "GET", "operatorMessageQueues")
    expectRegisteredApiRoute(source, "POST", "operatorMessageQueueClear")
    expectRegisteredApiRoute(source, "POST", "operatorMessageQueuePause")
    expectRegisteredApiRoute(source, "POST", "operatorMessageQueueResume")
    expectRegisteredApiRoute(source, "DELETE", "operatorMessageQueueMessage")
    expectRegisteredApiRoute(source, "POST", "operatorMessageQueueMessageRetry")
    expectRegisteredApiRoute(source, "PATCH", "operatorMessageQueueMessage")
    expect(operatorRoutesSource).toContain("actions.getOperatorMessageQueues()")
    expect(operatorRoutesSource).toContain("actions.clearOperatorMessageQueue(params.conversationId)")
    expect(operatorRoutesSource).toContain("actions.pauseOperatorMessageQueue(params.conversationId)")
    expect(operatorRoutesSource).toContain("actions.resumeOperatorMessageQueue(params.conversationId)")
    expect(operatorRoutesSource).toContain("actions.removeOperatorQueuedMessage(params.conversationId, params.messageId)")
    expect(operatorRoutesSource).toContain("actions.retryOperatorQueuedMessage(params.conversationId, params.messageId)")
    expect(operatorRoutesSource).toContain("actions.updateOperatorQueuedMessage(params.conversationId, params.messageId, req.body)")
    expect(operatorRouteDesktopActionsSource).toContain(
      "const operatorMessageQueueRouteActions = createOperatorMessageQueueRouteActions(messageQueueActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("messageQueue: operatorMessageQueueRouteActions")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorMessageQueuesAction(messageQueueActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("service: createOperatorMessageQueueActionService({")
    expect(operatorRouteDesktopActionsSource).toContain("queue: messageQueueService")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "clearQueue: (conversationId) => messageQueueService.clearQueue(conversationId)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain("getAllQueues: () => messageQueueService.getAllQueues()")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "clearOperatorMessageQueueAction(conversationIdParam, messageQueueActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("pauseQueue: pauseMessageQueueByConversationId")
    expect(operatorRouteDesktopActionsSource).toContain("resumeQueue: resumeMessageQueueByConversationId")
    expect(operatorRouteDesktopActionsSource).toContain("removeQueuedMessage: removeQueuedMessageById")
    expect(operatorRouteDesktopActionsSource).toContain("retryQueuedMessage: retryQueuedMessageById")
    expect(operatorRouteDesktopActionsSource).toContain("updateQueuedMessageText: updateQueuedMessageTextById")
    expect(sharedOperatorActionsSource).toContain("export interface OperatorMessageQueueRouteActions")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorMessageQueueActionService")
    expect(sharedOperatorActionsSource).toContain("getAllQueues: () => options.queue.getAllQueues()")
    expect(sharedOperatorActionsSource).toContain("pauseQueue: (conversationId) => options.mutations.pauseQueue(conversationId)")
    expect(sharedOperatorActionsSource).toContain("export function createOperatorMessageQueueRouteActions")
    expect(sharedOperatorActionsSource).toContain("getOperatorMessageQueues: () => getOperatorMessageQueuesAction(options)")
    expect(sharedOperatorActionsSource).toContain(
      "clearOperatorMessageQueue: (conversationIdParam) =>",
    )
    expect(sharedOperatorActionsSource).toContain(
      "updateOperatorQueuedMessageAction(conversationIdParam, messageIdParam, body, options)",
    )
    expect(sharedOperatorActionsSource).toContain("export function getOperatorMessageQueuesAction(")
    expect(sharedOperatorActionsSource).toContain("buildOperatorMessageQueuesResponse(")
    expect(sharedOperatorActionsSource).toContain("parseOperatorQueuedMessageUpdateRequestBody(body)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorQueuedMessageUpdateResponse(")
    const messageQueueServiceSource = getMessageQueueServiceSource()
    const sharedMessageQueueStoreSource = getSharedMessageQueueStoreSource()
    const messageQueueActionsSource = getMessageQueueActionsSource()
    expect(messageQueueServiceSource).toContain('from "@dotagents/shared/message-queue-store"')
    expect(messageQueueServiceSource).toContain("createMessageQueueStore({")
    expect(messageQueueServiceSource).toContain("onQueueChanged: (conversationId) => this.emitQueueUpdate(conversationId)")
    expect(messageQueueServiceSource).not.toContain("private queues")
    expect(messageQueueServiceSource).not.toContain("processingConversations")
    expect(messageQueueServiceSource).not.toContain("pausedConversations")
    expect(sharedMessageQueueStoreSource).toContain("export function createMessageQueueStore")
    expect(sharedMessageQueueStoreSource).toContain("export function buildMessageQueuePauseResult(")
    expect(sharedMessageQueueStoreSource).toContain("export function buildMessageQueueResumeResult(")
    expect(sharedMessageQueueStoreSource).toContain("export function buildQueuedMessageActionResult(")
    expect(sharedMessageQueueStoreSource).toContain("export function pauseMessageQueueAction(")
    expect(sharedMessageQueueStoreSource).toContain("export function resumeMessageQueueAction(")
    expect(sharedMessageQueueStoreSource).toContain("export function removeQueuedMessageAction(")
    expect(sharedMessageQueueStoreSource).toContain("export function retryQueuedMessageAction(")
    expect(sharedMessageQueueStoreSource).toContain("export function updateQueuedMessageTextAction(")
    expect(messageQueueActionsSource).toContain("pauseMessageQueueAction(conversationId,")
    expect(messageQueueActionsSource).toContain("resumeMessageQueueAction(conversationId,")
    expect(messageQueueActionsSource).toContain("removeQueuedMessageAction(conversationId, messageId,")
    expect(messageQueueActionsSource).toContain("retryQueuedMessageAction(conversationId, messageId,")
    expect(messageQueueActionsSource).toContain("updateQueuedMessageTextAction(conversationId, messageId, text,")
    expect(sharedMessageQueueStoreSource).toContain("tryAcquireProcessingLock")
    expect(sharedMessageQueueStoreSource).toContain("pauseQueue")
    expect(sharedMessageQueueStoreSource).not.toContain("@egoist/tipc")
    expect(sharedMessageQueueStoreSource).not.toContain("WINDOWS")
    expect(sharedMessageQueueStoreSource).not.toContain("electron")
    // Logs endpoint
    expectRegisteredApiRoute(source, "GET", "operatorLogs")
    expect(operatorRoutesSource).toContain("query.level")
    // MCP operator endpoints
    const sharedMcpApiSource = getSharedMcpApiSource()
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
    expect(operatorRouteDesktopActionsSource).toContain(
      "const operatorMcpRouteActions = createOperatorMcpRouteActions({",
    )
    expect(operatorRouteDesktopActionsSource).toContain("read: operatorMcpReadActionOptions")
    expect(operatorRouteDesktopActionsSource).toContain("mutation: operatorMcpMutationActionOptions")
    expect(operatorRouteDesktopActionsSource).toContain("test: operatorMcpTestActionOptions")
    expect(operatorRouteDesktopActionsSource).toContain("lifecycle: operatorMcpLifecycleActionOptions")
    expect(operatorRouteDesktopActionsSource).toContain("mcp: operatorMcpRouteActions")
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorMcpStatusAction(operatorMcpReadActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "getOperatorMcpServerLogsAction(serverName, count, operatorMcpReadActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain("getOperatorMcpToolsAction(server, operatorMcpReadActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "clearOperatorMcpServerLogsAction(serverName, operatorMcpMutationActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "setOperatorMcpToolEnabledAction(toolName, body, operatorMcpMutationActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain("testOperatorMcpServerAction(serverName, operatorMcpTestActionOptions)")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "startOperatorMcpServerAction(body, operatorMcpLifecycleActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "stopOperatorMcpServerAction(body, operatorMcpLifecycleActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "restartOperatorMcpServerAction(body, operatorMcpLifecycleActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("service: createOperatorMcpReadActionService({")
    expect(operatorRouteDesktopActionsSource).toContain("getServerLogs: (serverName) => mcpService.getServerLogs(serverName)")
    expect(operatorRouteDesktopActionsSource).toContain("getDetailedToolList: () => mcpService.getDetailedToolList()")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "const operatorMcpReadActionOptions: OperatorMcpReadActionOptions = {\n  diagnostics: {\n    logError: (...args) => diagnosticsService.logError(...args),\n    getErrorMessage,\n  },\n  service: {\n    getServerStatus: () => mcpService.getServerStatus(),",
    )
    expect(operatorRouteDesktopActionsSource).toContain("service: createOperatorMcpMutationActionService({")
    expect(operatorRouteDesktopActionsSource).toContain("clearServerLogs: (serverName) => mcpService.clearServerLogs(serverName)")
    expect(operatorRouteDesktopActionsSource).toContain("setToolEnabled: (toolName, enabled) => mcpService.setToolEnabled(toolName, enabled)")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "const operatorMcpMutationActionOptions: OperatorMcpMutationActionOptions<OperatorActionAuditContext> = {\n  diagnostics: {\n    logError: (...args) => diagnosticsService.logError(...args),\n    getErrorMessage,\n  },\n  service: {\n    getServerStatus: () => mcpService.getServerStatus(),",
    )
    expect(operatorRouteDesktopActionsSource).toContain("service: createOperatorMcpTestActionService<MCPServerConfig>({")
    expect(operatorRouteDesktopActionsSource).toContain("getServerConfig: (serverName) => configStore.get().mcpConfig?.mcpServers?.[serverName]")
    expect(operatorRouteDesktopActionsSource).toContain("testServerConnection: (serverName, serverConfig) => mcpService.testServerConnection(serverName, serverConfig)")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "const operatorMcpTestActionOptions: OperatorMcpTestActionOptions<MCPServerConfig, OperatorActionAuditContext> = {\n  diagnostics: {\n    logError: (...args) => diagnosticsService.logError(...args),\n    getErrorMessage,\n  },\n  service: {\n    getServerConfig: (serverName) => configStore.get().mcpConfig?.mcpServers?.[serverName]",
    )
    expect(operatorRouteDesktopActionsSource).toContain("service: createOperatorMcpLifecycleActionService({")
    expect(operatorRouteDesktopActionsSource).toContain("setServerRuntimeEnabled: (serverName, enabled) => mcpService.setServerRuntimeEnabled(serverName, enabled)")
    expect(operatorRouteDesktopActionsSource).toContain("restartServer: (serverName) => mcpService.restartServer(serverName)")
    expect(operatorRouteDesktopActionsSource).toContain("stopServer: (serverName) => mcpService.stopServer(serverName)")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "const operatorMcpLifecycleActionOptions: OperatorMcpLifecycleActionOptions<OperatorActionAuditContext> = {\n  diagnostics: {\n    logError: (...args) => diagnosticsService.logError(...args),\n    logInfo: (...args) => diagnosticsService.logInfo(...args),\n    getErrorMessage,\n  },\n  service: {\n    getServerStatus: () => mcpService.getServerStatus(),",
    )
    expect(sharedMcpApiSource).toContain("export function getOperatorMcpStatusAction(")
    expect(sharedMcpApiSource).toContain("export function getOperatorMcpServerLogsAction(")
    expect(sharedMcpApiSource).toContain("export function getOperatorMcpToolsAction(")
    expect(sharedMcpApiSource).toContain("export function createOperatorMcpReadActionService")
    expect(sharedMcpApiSource).toContain("getServerLogs: (serverName) => options.getServerLogs(serverName)")
    expect(sharedMcpApiSource).toContain("getDetailedToolList: () => options.getDetailedToolList()")
    expect(sharedMcpApiSource).toContain("export function createOperatorMcpMutationActionService")
    expect(sharedMcpApiSource).toContain("clearServerLogs: (serverName) => options.clearServerLogs(serverName)")
    expect(sharedMcpApiSource).toContain(
      "setToolEnabled: (toolName, enabled) => options.setToolEnabled(toolName, enabled)",
    )
    expect(sharedMcpApiSource).toContain("export function createOperatorMcpTestActionService")
    expect(sharedMcpApiSource).toContain("getServerConfig: (serverName) => options.getServerConfig(serverName)")
    expect(sharedMcpApiSource).toContain(
      "testServerConnection: (serverName, serverConfig) => options.testServerConnection(serverName, serverConfig)",
    )
    expect(sharedMcpApiSource).toContain("export function createOperatorMcpLifecycleActionService")
    expect(sharedMcpApiSource).toContain(
      "setServerRuntimeEnabled: (serverName, enabled) => options.setServerRuntimeEnabled(serverName, enabled)",
    )
    expect(sharedMcpApiSource).toContain("restartServer: (serverName) => options.restartServer(serverName)")
    expect(sharedMcpApiSource).toContain("stopServer: (serverName) => options.stopServer(serverName)")
    expect(sharedMcpApiSource).toContain("export function clearOperatorMcpServerLogsAction<")
    expect(sharedMcpApiSource).toContain("export function setOperatorMcpToolEnabledAction<")
    expect(sharedMcpApiSource).toContain("export async function testOperatorMcpServerAction<")
    expect(sharedMcpApiSource).toContain("export async function startOperatorMcpServerAction<")
    expect(sharedMcpApiSource).toContain("export async function stopOperatorMcpServerAction<")
    expect(sharedMcpApiSource).toContain("export async function restartOperatorMcpServerAction<")
    expect(sharedMcpApiSource).toContain("export interface OperatorMcpRouteActions")
    expect(sharedMcpApiSource).toContain("export function createOperatorMcpRouteActions")
    expect(sharedMcpApiSource).toContain("getOperatorMcpStatus: () => getOperatorMcpStatusAction(options.read)")
    expect(sharedMcpApiSource).toContain("setOperatorMcpToolEnabledAction(toolName, body, options.mutation)")
    expect(sharedMcpApiSource).toContain("restartOperatorMcpServerAction(body, options.lifecycle)")
    expect(sharedMcpApiSource).toContain("buildOperatorMcpServerLogsResponse(")
    expect(sharedMcpApiSource).toContain("buildOperatorMcpToolsResponse(")
    expect(sharedMcpApiSource).toContain("clearServerLogs(serverName)")
    expect(sharedMcpApiSource).toContain("setToolEnabled(toolName, enabled)")
    expect(sharedMcpApiSource).toContain("setServerRuntimeEnabled(serverName, true)")
    expect(sharedMcpApiSource).toContain("setServerRuntimeEnabled(serverName, false)")
    expect(sharedMcpApiSource).toContain("restartServer(serverName)")
    expect(sharedMcpApiSource).toContain("stopServer(serverName)")
    // Local speech model operator endpoints
    const sharedLocalSpeechModelsSource = getSharedLocalSpeechModelsSource()
    expect(operatorRoutesSource).toContain("actions.getOperatorLocalSpeechModelStatuses()")
    expect(operatorRoutesSource).toContain("actions.getOperatorLocalSpeechModelStatus(params.providerId)")
    expect(operatorRoutesSource).toContain("actions.downloadOperatorLocalSpeechModel(params.providerId)")
    expect(operatorRouteDesktopActionsSource).toContain(
      "const operatorLocalSpeechModelRouteActions = createOperatorLocalSpeechModelRouteActions(localSpeechModelActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("localSpeechModels: operatorLocalSpeechModelRouteActions")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "getOperatorLocalSpeechModelStatusesAction(localSpeechModelActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "getOperatorLocalSpeechModelStatusAction(providerId, localSpeechModelActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "downloadOperatorLocalSpeechModelAction(providerId, localSpeechModelActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain(
      "const localSpeechModelService = createLocalSpeechModelActionService({",
    )
    expect(operatorRouteDesktopActionsSource).toContain("service: localSpeechModelService")
    expect(sharedLocalSpeechModelsSource).toContain("export interface OperatorLocalSpeechModelRouteActions")
    expect(sharedLocalSpeechModelsSource).toContain("export function createLocalSpeechModelActionService")
    expect(sharedLocalSpeechModelsSource).toContain("export function createOperatorLocalSpeechModelRouteActions")
    expect(sharedLocalSpeechModelsSource).toContain(
      "getOperatorLocalSpeechModelStatuses: () => getOperatorLocalSpeechModelStatusesAction(options)",
    )
    expect(sharedLocalSpeechModelsSource).toContain(
      "getOperatorLocalSpeechModelStatusAction(providerId, options)",
    )
    expect(sharedLocalSpeechModelsSource).toContain("downloadOperatorLocalSpeechModelAction(providerId, options)")
    expect(sharedLocalSpeechModelsSource).toContain("export async function getOperatorLocalSpeechModelStatusesAction(")
    expect(sharedLocalSpeechModelsSource).toContain("export async function downloadOperatorLocalSpeechModelAction(")
    expect(sharedLocalSpeechModelsSource).toContain("buildLocalSpeechModelStatusesResponse((providerId) => (")
    expect(sharedLocalSpeechModelsSource).toContain("buildLocalSpeechModelDownloadResponse(providerId, status)")
    expect(sharedLocalSpeechModelsSource).toContain("buildLocalSpeechModelDownloadErrorResponse(providerId, message)")
    expect(operatorRouteDesktopActionsSource).toContain('await import("./parakeet-stt")')
    expect(operatorRouteDesktopActionsSource).toContain('await import("./kitten-tts")')
    expect(operatorRouteDesktopActionsSource).toContain('await import("./supertonic-tts")')
    const sharedModelPresetsSource = getSharedModelPresetsSource()
    expect(source).toContain("providerSecretMask: PROVIDER_SECRET_MASK")
    expect(operatorRoutesSource).toContain("actions.getOperatorModelPresets(providerSecretMask)")
    expect(operatorRoutesSource).toContain("actions.createOperatorModelPreset(req.body, providerSecretMask)")
    expect(operatorRoutesSource).toContain("actions.updateOperatorModelPreset(params.presetId, req.body, providerSecretMask)")
    expect(operatorRoutesSource).toContain("actions.deleteOperatorModelPreset(params.presetId, providerSecretMask)")
    expect(operatorRouteDesktopActionsSource).toContain(
      "const operatorModelPresetRouteActions = createOperatorModelPresetRouteActions(modelPresetActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("modelPresets: operatorModelPresetRouteActions")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "getOperatorModelPresetsAction(secretMask, modelPresetActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain(
      "createPresetId: () => createCustomModelPresetId(crypto.randomUUID)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain("`custom-${crypto.randomUUID()}`")
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "createOperatorModelPresetAction(body, secretMask, modelPresetActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "updateOperatorModelPresetAction(presetId, body, secretMask, modelPresetActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).not.toContain(
      "deleteOperatorModelPresetAction(presetId, secretMask, modelPresetActionOptions)",
    )
    expect(source).toContain("PROVIDER_SECRET_MASK")
    expect(sharedModelPresetsSource).toContain("export interface ModelPresetActionOptions")
    expect(sharedModelPresetsSource).toContain("export function createCustomModelPresetId(")
    expect(sharedModelPresetsSource).toContain("export interface OperatorModelPresetRouteActions")
    expect(sharedModelPresetsSource).toContain("export function createOperatorModelPresetRouteActions")
    expect(sharedModelPresetsSource).toContain("getOperatorModelPresets: (secretMask) => getOperatorModelPresetsAction(secretMask, options)")
    expect(sharedModelPresetsSource).toContain(
      "createOperatorModelPreset: (body, secretMask) => createOperatorModelPresetAction(body, secretMask, options)",
    )
    expect(sharedModelPresetsSource).toContain(
      "updateOperatorModelPresetAction(presetId, body, secretMask, options)",
    )
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
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedSettingsApiClientSource = getSharedSettingsApiClientSource()
    const settingsPatchSection = getSection(
      source,
      getApiRouteRegistrationMarker(source, "PATCH", "settings"),
      '// GET /v1/conversations/:id - Fetch conversation state for recovery',
    )

    expect(settingsPatchSection).toContain("if (result.auditContext)")
    expect(settingsPatchSection).toContain("actions.recordOperatorAuditEvent(req, result.auditContext)")
    expect(mobileApiDesktopActionsSource).toContain("settings: settingsRouteActionBundle.settings")
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
    expect(mobileApiDesktopActionsSource).not.toContain("details: { apiKey")
    expect(mobileApiDesktopActionsSource).not.toContain("details: { remoteServerApiKey")
    expect(sharedSettingsApiClientSource).not.toContain("details: { apiKey")
    expect(sharedSettingsApiClientSource).not.toContain("details: { remoteServerApiKey")
  })

  it("resolves remote server secret references only for authenticated pairing surfaces", () => {
    const source = getRemoteServerSource()
    const controllerSource = getRemoteServerControllerSource()
    const desktopAdaptersSource = getRemoteServerDesktopAdaptersSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedRemotePairingSource = getSharedRemotePairingSource()
    const sharedSettingsApiClientSource = getSharedSettingsApiClientSource()

    expect(desktopAdaptersSource).toContain("resolveDotAgentsSecretReferenceFromStore(value, () =>")
    expect(desktopAdaptersSource).toContain('const DOTAGENTS_SECRETS_LOCAL_JSON = "secrets.local.json"')
    expect(desktopAdaptersSource).toContain("function getResolvedRemoteServerApiKey")
    expect(sharedRemotePairingSource).toContain("export function resolveDotAgentsSecretReferenceFromStore(")
    expect(sharedRemotePairingSource).toContain("getDotAgentsSecretsRecord(loadStore())")
    expect(sharedRemotePairingSource).toContain("resolveDotAgentsSecretReference(value, secrets)")
    expect(controllerSource).toContain("const startupPlan = getRemoteServerStartupPlan(cfg, {")
    expect(controllerSource).toContain("resolveApiKey: adapters.resolveApiKeyReference")
    expect(controllerSource).toContain("startupPlan.apiKeyAction === 'generate'")
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
    expect(desktopAdaptersSource).toContain("resolveConnectableRemoteServerPairingBaseUrl(bind, port, getRemoteNetworkAddresses())")
    expect(desktopAdaptersSource).toContain("QRCode.toString(qrValue")
    expect(mobileApiDesktopActionsSource).toContain(
      "getMaskedRemoteServerApiKey: (config) => getMaskedRemoteServerApiKey(config.remoteServerApiKey)",
    )
    expect(sharedSettingsApiClientSource).toContain("remoteServerApiKey: options.getMaskedRemoteServerApiKey(cfg)")
  })

  it("applies session-aware ACP MCP filtering for injected tool routes", () => {
    const source = getRemoteServerSource()
    const injectedMcpRoutesSource = getInjectedMcpRoutesSource()
    const sharedInjectedMcpRoutesSource = getSharedInjectedMcpRoutesSource()
    const injectedMcpActionsSource = getRemoteServerRouteBundleSource()
    const sharedMcpApiSource = getSharedMcpApiSource()
    const streamableMcpSection = getSection(
      injectedMcpActionsSource,
      "const handleInjectedMcpProtocolRequest = createInjectedMcpProtocolRouteAction",
      "const injectedMcpDesktopActions",
    )

    expect(injectedMcpActionsSource).toContain("const injectedMcpRuntimeToolResolutionOptions: InjectedMcpRuntimeToolResolutionOptions<")
    expect(injectedMcpActionsSource).toContain("function getInjectedRuntimeToolsForAcpSession")
    expect(injectedMcpActionsSource).toContain("getPendingAppSessionForClientSessionToken")
    expect(injectedMcpActionsSource).toContain("resolveInjectedRuntimeToolsForAcpSession(acpSessionToken, injectedMcpRuntimeToolResolutionOptions)")
    expect(injectedMcpActionsSource).toContain("getActiveSessionProfileSnapshot: (appSessionId) =>")
    expect(injectedMcpActionsSource).toContain("getTrackedSessionProfileSnapshot: (appSessionId) =>")
    expect(injectedMcpActionsSource).toContain("getAvailableToolsForProfile: (profileSnapshot) =>")
    expect(injectedMcpActionsSource).toContain("isRuntimeToolName: isRuntimeTool")
    expect(injectedMcpActionsSource).not.toContain("function getAcpMcpRequestContext")
    expectRegisteredMcpRoute(source, "POST", "session")
    expectRegisteredMcpRoute(source, "GET", "session")
    expectRegisteredMcpRoute(source, "DELETE", "session")
    expectRegisteredMcpRoute(source, "POST", "toolsList")
    expectRegisteredMcpRoute(source, "POST", "sessionToolsList")
    expectRegisteredMcpRoute(source, "POST", "toolsCall")
    expectRegisteredMcpRoute(source, "POST", "sessionToolsCall")
    expect(injectedMcpRoutesSource).toContain("export function registerInjectedMcpRoutes")
    expect(sharedInjectedMcpRoutesSource).toContain(getMcpRouteRegistrationMarker(sharedInjectedMcpRoutesSource, "POST", "session"))
    expect(sharedInjectedMcpRoutesSource).toContain(getMcpRouteRegistrationMarker(sharedInjectedMcpRoutesSource, "POST", "sessionToolsList"))
    expect(sharedInjectedMcpRoutesSource).toContain(getMcpRouteRegistrationMarker(sharedInjectedMcpRoutesSource, "POST", "sessionToolsCall"))
    expect(sharedInjectedMcpRoutesSource).toContain("actions.handleInjectedMcpProtocolRequest(req, reply, getOptionalStringParam(req, 'acpSessionToken'))")
    expect(sharedInjectedMcpRoutesSource).toContain("actions.listInjectedMcpTools(getOptionalStringQuery(req, 'acpSessionToken'), reply)")
    expect(sharedInjectedMcpRoutesSource).toContain("actions.callInjectedMcpTool(req, reply, getOptionalStringQuery(req, 'acpSessionToken'))")
    expect(injectedMcpActionsSource).toContain("DEFAULT_INJECTED_MCP_INVALID_SESSION_CONTEXT_ERROR")
    expect(injectedMcpActionsSource).not.toContain("const INVALID_ACP_SESSION_CONTEXT_ERROR")
    expect(injectedMcpActionsSource).toContain("StreamableHTTPServerTransport")
    expect(injectedMcpActionsSource).toContain("createInjectedMcpProtocolRouteAction<")
    expect(injectedMcpActionsSource).toContain("isInitializeRequest,")
    expect(injectedMcpActionsSource).toContain("const injectedMcpToolRouteActions = createInjectedMcpToolRouteActions<")
    expect(injectedMcpActionsSource).toContain("const injectedMcpDesktopActions = createInjectedMcpRouteActions<")
    expect(injectedMcpActionsSource).toContain("protocol: { handleInjectedMcpProtocolRequest }")
    expect(injectedMcpActionsSource).toContain("tools: injectedMcpToolRouteActions")
    expect(injectedMcpActionsSource).toContain("getBody: (req) => req.body")
    expect(injectedMcpActionsSource).toContain(
      "sendActionResult: (reply, result) => reply.code(result.statusCode).send(result.body)",
    )
    expect(injectedMcpActionsSource).not.toContain("listInjectedMcpToolsAction(acpSessionToken, injectedMcpActionOptions)")
    expect(injectedMcpActionsSource).not.toContain("callInjectedMcpToolAction(acpSessionToken, req.body, injectedMcpActionOptions)")
    expect(injectedMcpActionsSource).toContain("getInjectedRuntimeTools: (acpSessionToken) => getInjectedRuntimeToolsForAcpSession(acpSessionToken)")
    expect(injectedMcpActionsSource).toContain("executeInjectedRuntimeTool: (toolCall, requestContext) => mcpService.executeToolCall(")
    expect(sharedMcpApiSource).toContain("export function listInjectedMcpToolsAction<")
    expect(sharedMcpApiSource).toContain("export async function callInjectedMcpToolAction<")
    expect(sharedMcpApiSource).toContain("export const DEFAULT_INJECTED_MCP_INVALID_SESSION_CONTEXT_ERROR")
    expect(sharedMcpApiSource).toContain("export interface InjectedMcpToolRouteActions")
    expect(sharedMcpApiSource).toContain("export function createInjectedMcpToolRouteActions")
    expect(sharedMcpApiSource).toContain("export function resolveInjectedMcpRequestContext<")
    expect(sharedMcpApiSource).toContain("export function resolveInjectedRuntimeToolsForAcpSession<")
    expect(sharedMcpApiSource).toContain("service.getPendingAppSessionForClientSessionToken(acpSessionToken)")
    expect(sharedMcpApiSource).toContain("service.getActiveSessionProfileSnapshot(appSessionId)")
    expect(sharedMcpApiSource).toContain("?? service.getTrackedSessionProfileSnapshot(appSessionId)")
    expect(sharedMcpApiSource).toContain("options.tools.getAvailableToolsForProfile(requestContext.profileSnapshot)")
    expect(sharedMcpApiSource).toContain(".filter((tool) => options.tools.isRuntimeToolName(tool.name))")
    expect(sharedMcpApiSource).toContain("export function createInjectedMcpProtocolRouteAction<")
    expect(sharedMcpApiSource).toContain("const transportsByToken = new Map")
    expect(sharedMcpApiSource).toContain("options.protocol.isInitializeRequest(body)")
    expect(sharedMcpApiSource).toContain("options.transport.handleRequest(")
    expect(sharedMcpApiSource).toContain("options.response.hijack(reply)")
    expect(sharedMcpApiSource).toContain("listInjectedMcpToolsAction(acpSessionToken, options.action)")
    expect(sharedMcpApiSource).toContain("options.request.getBody(request)")
    expect(sharedMcpApiSource).toContain("options.response.sendActionResult(reply, result)")
    expect(sharedMcpApiSource).toContain("buildInjectedMcpToolsListResponse(injectedRuntimeTools.tools)")
    expect(sharedMcpApiSource).toContain("parseInjectedMcpToolCallRequestBody(body)")
    expect(sharedMcpApiSource).toContain("buildInjectedMcpToolCallResponse(result)")
    expect(sharedMcpApiSource).toContain("buildInjectedMcpToolCallErrorResponse(")
    expect(injectedMcpActionsSource).toContain("requestContext.appSessionId")
    expect(injectedMcpActionsSource).toContain("requestContext.profileSnapshot.mcpServerConfig")
    expect(injectedMcpActionsSource).not.toContain("profileSnapshot?.mcpServerConfig")
    expect(streamableMcpSection).toContain("createTransport: (options) => new StreamableHTTPServerTransport(options)")
    expect(streamableMcpSection).toContain("setOnClose: (transport, onClose) => { transport.onclose = onClose }")
    expect(streamableMcpSection).toContain("transport.handleRequest(rawRequest as any, rawReply as any, body)")
    expect(streamableMcpSection).toContain("getRawRequest: (req) => req.raw")
    expect(streamableMcpSection).toContain("getRawReply: (reply) => reply.raw")
    expect(streamableMcpSection).toContain("hijack: (reply) => reply.hijack()")
  })

  it("registers note-only knowledge routes", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedKnowledgeNoteFormSource = getSharedKnowledgeNoteFormSource()

    expectRegisteredApiRoute(source, "GET", "knowledgeNotes")
    expectRegisteredApiRoute(source, "POST", "knowledgeNotesSearch")
    expectRegisteredApiRoute(source, "POST", "knowledgeNotesDeleteMultiple")
    expectRegisteredApiRoute(source, "POST", "knowledgeNotesDeleteAll")
    expectRegisteredApiRoute(source, "GET", "knowledgeNote")
    expectRegisteredApiRoute(source, "POST", "knowledgeNotes")
    expectRegisteredApiRoute(source, "PATCH", "knowledgeNote")
    expectRegisteredApiRoute(source, "DELETE", "knowledgeNote")
    expect(mobileApiRoutesSource).toContain("actions.getKnowledgeNotes(req.query)")
    expect(mobileApiRoutesSource).toContain("actions.searchKnowledgeNotes(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.deleteMultipleKnowledgeNotes(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.deleteAllKnowledgeNotes()")
    expect(mobileApiRoutesSource).toContain("actions.getKnowledgeNote(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.createKnowledgeNote(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.updateKnowledgeNote(params.id, req.body)")
    expect(mobileApiRoutesSource).toContain("actions.deleteKnowledgeNote(params.id)")
    expect(mobileApiDesktopActionsSource).toContain(
      "const knowledgeNoteRouteActions = createKnowledgeNoteRouteActions(knowledgeNoteActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).toContain("knowledgeNotes: knowledgeNoteRouteActions")
    expect(mobileApiDesktopActionsSource).toContain("service: createKnowledgeNoteActionService(knowledgeNotesService)")
    expect(mobileApiDesktopActionsSource).not.toContain("getKnowledgeNotesAction(query, knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("getKnowledgeNoteAction(id, knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("searchKnowledgeNotesAction(body, knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("deleteMultipleKnowledgeNotesAction(body, knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("deleteAllKnowledgeNotesAction(knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("createKnowledgeNoteAction(body, knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("updateKnowledgeNoteAction(id, body, knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("deleteKnowledgeNoteAction(id, knowledgeNoteActionOptions)")
    expect(sharedKnowledgeNoteFormSource).toContain("export interface KnowledgeNoteActionOptions")
    expect(sharedKnowledgeNoteFormSource).toContain("export function createKnowledgeNoteActionService")
    expect(sharedKnowledgeNoteFormSource).toContain("getAllNotes: (filter) => service.getAllNotes(filter)")
    expect(sharedKnowledgeNoteFormSource).toContain("saveNote: (note) => service.saveNote(note)")
    expect(sharedKnowledgeNoteFormSource).toContain("export interface KnowledgeNoteRouteActions")
    expect(sharedKnowledgeNoteFormSource).toContain("export function createKnowledgeNoteRouteActions")
    expect(sharedKnowledgeNoteFormSource).toContain("getKnowledgeNotes: (query) => getKnowledgeNotesAction(query, options)")
    expect(sharedKnowledgeNoteFormSource).toContain("deleteAllKnowledgeNotes: () => deleteAllKnowledgeNotesAction(options)")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function getKnowledgeNotesAction")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function getKnowledgeNoteAction")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function searchKnowledgeNotesAction")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function deleteKnowledgeNoteAction")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function deleteMultipleKnowledgeNotesAction")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function deleteAllKnowledgeNotesAction")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function createKnowledgeNoteAction")
    expect(sharedKnowledgeNoteFormSource).toContain("export async function updateKnowledgeNoteAction")
    expect(sharedKnowledgeNoteFormSource).toContain("buildKnowledgeNotesResponse(notes)")
    expect(sharedKnowledgeNoteFormSource).toContain("buildKnowledgeNoteResponse(note)")
    expect(sharedKnowledgeNoteFormSource).toContain("buildKnowledgeNoteDeleteResponse(noteId)")
    expect(sharedKnowledgeNoteFormSource).toContain("parseKnowledgeNoteCreateRequestBody(body)")
    expect(sharedKnowledgeNoteFormSource).toContain("parseKnowledgeNoteUpdateRequestBody(body)")
    expect(sharedKnowledgeNoteFormSource).toContain("parseKnowledgeNotesListRequestQuery(query)")
    expect(sharedKnowledgeNoteFormSource).toContain("parseKnowledgeNoteSearchRequestBody(body)")
    expect(sharedKnowledgeNoteFormSource).toContain("parseKnowledgeNotesDeleteMultipleRequestBody(body)")
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
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedRepeatTaskUtilsSource = getSharedRepeatTaskUtilsSource()

    expectRegisteredApiRoute(source, "GET", "loops")
    expectRegisteredApiRoute(source, "GET", "loopStatuses")
    expectRegisteredApiRoute(source, "POST", "loopImportMarkdown")
    expectRegisteredApiRoute(source, "POST", "loopStart")
    expectRegisteredApiRoute(source, "POST", "loopStop")
    expectRegisteredApiRoute(source, "POST", "loopToggle")
    expectRegisteredApiRoute(source, "POST", "loopRun")
    expectRegisteredApiRoute(source, "GET", "loopExportMarkdown")
    expectRegisteredApiRoute(source, "POST", "loops")
    expectRegisteredApiRoute(source, "PATCH", "loop")
    expectRegisteredApiRoute(source, "DELETE", "loop")
    expect(mobileApiRoutesSource).toContain("actions.getRepeatTasks()")
    expect(mobileApiRoutesSource).toContain("actions.getRepeatTaskStatuses()")
    expect(mobileApiRoutesSource).toContain("actions.importRepeatTaskFromMarkdown(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.startRepeatTask(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.stopRepeatTask(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.toggleRepeatTask(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.runRepeatTask(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.exportRepeatTaskToMarkdown(params.id)")
    expect(mobileApiRoutesSource).toContain("actions.createRepeatTask(req.body)")
    expect(mobileApiRoutesSource).toContain("actions.updateRepeatTask(params.id, req.body)")
    expect(mobileApiRoutesSource).toContain("actions.deleteRepeatTask(params.id)")
    expect(mobileApiDesktopActionsSource).toContain("await import(\"./loop-service\")")
    expect(mobileApiDesktopActionsSource).toContain("createId: createRepeatTaskRuntimeId")
    expect(mobileApiDesktopActionsSource).not.toContain("Math.random().toString(36)")
    expect(mobileApiDesktopActionsSource).toContain(
      "const repeatTaskRouteActions = createRepeatTaskRouteActions(repeatTaskActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).toContain("repeatTasks: repeatTaskRouteActions")
    expect(mobileApiDesktopActionsSource).not.toContain("getRepeatTasksAction(repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("getRepeatTaskStatusesAction(repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("importRepeatTaskFromMarkdownAction(body, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("startRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("stopRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("toggleRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("runRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("exportRepeatTaskToMarkdownAction(id, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("createRepeatTaskAction(body, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("updateRepeatTaskAction(id, body, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).not.toContain("deleteRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(sharedRepeatTaskUtilsSource).toContain("export interface RepeatTaskActionOptions")
    expect(sharedRepeatTaskUtilsSource).toContain("export interface RepeatTaskRouteActions")
    expect(sharedRepeatTaskUtilsSource).toContain("export function createRepeatTaskRuntimeId(")
    expect(sharedRepeatTaskUtilsSource).toContain("export function createRepeatTaskRouteActions")
    expect(sharedRepeatTaskUtilsSource).toContain("getRepeatTasks: () => getRepeatTasksAction(options)")
    expect(sharedRepeatTaskUtilsSource).toContain("updateRepeatTask: (id, body) => updateRepeatTaskAction(id, body, options)")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function getRepeatTasksAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function getRepeatTaskStatusesAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function importRepeatTaskFromMarkdownAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function startRepeatTaskAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function stopRepeatTaskAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function toggleRepeatTaskAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function runRepeatTaskAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function exportRepeatTaskToMarkdownAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function createRepeatTaskAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function updateRepeatTaskAction")
    expect(sharedRepeatTaskUtilsSource).toContain("export async function deleteRepeatTaskAction")
    expect(sharedRepeatTaskUtilsSource).toContain("buildRepeatTasksResponse(loops")
    expect(sharedRepeatTaskUtilsSource).toContain("buildRepeatTaskStatusesResponse(statuses)")
    expect(sharedRepeatTaskUtilsSource).toContain("buildRepeatTaskRuntimeActionResponse(taskId")
    expect(sharedRepeatTaskUtilsSource).toContain("buildRepeatTaskToggleResponse(taskId, updated.enabled)")
    expect(sharedRepeatTaskUtilsSource).toContain("buildRepeatTaskRunResponse(taskId)")
    expect(sharedRepeatTaskUtilsSource).toContain("parseRepeatTaskCreateRequestBody(body)")
    expect(sharedRepeatTaskUtilsSource).toContain("parseRepeatTaskImportMarkdownRequestBody(body)")
    expect(sharedRepeatTaskUtilsSource).toContain("buildRepeatTaskFromCreateRequest(options.createId(), parsedRequest.request)")
    expect(sharedRepeatTaskUtilsSource).toContain("buildRepeatTaskExportMarkdownResponse(taskId, stringifyTaskMarkdown(loop))")
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
