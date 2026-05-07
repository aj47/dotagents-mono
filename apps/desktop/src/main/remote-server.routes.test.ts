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

function getOperatorRoutesFacadeSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorRoutesPath = path.join(testDir, "operator-routes.ts")
  return readFileSync(operatorRoutesPath, "utf8")
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
  return [
    getOperatorRoutesFacadeSource(),
    getSharedOperatorRoutesSource(),
  ].join("\n")
}

function getOperatorRouteDesktopActionsSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const operatorRouteDesktopActionsPath = path.join(testDir, "operator-route-desktop-actions.ts")
  return readFileSync(operatorRouteDesktopActionsPath, "utf8")
}

function getMobileApiRoutesFacadeSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const mobileApiRoutesPath = path.join(testDir, "mobile-api-routes.ts")
  return readFileSync(mobileApiRoutesPath, "utf8")
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
  return [
    getMobileApiRoutesFacadeSource(),
    getSharedMobileApiRoutesSource(),
  ].join("\n")
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
    getOperatorRoutesSource(),
    getMobileApiRoutesSource(),
    getInjectedMcpRoutesSource(),
    getSharedInjectedMcpRoutesSource(),
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
    getSharedInjectedMcpRoutesSource(),
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
    getSharedInjectedMcpRoutesSource(),
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
    const desktopAdaptersSource = getRemoteServerDesktopAdaptersSource()
    const operatorRoutesFacadeSource = getOperatorRoutesFacadeSource()
    const operatorRoutesSource = getOperatorRoutesSource()
    const sharedOperatorRoutesSource = getSharedOperatorRoutesSource()
    const operatorRouteDesktopActionsSource = getOperatorRouteDesktopActionsSource()
    const injectedMcpRoutesSource = getInjectedMcpRoutesSource()
    const sharedInjectedMcpRoutesSource = getSharedInjectedMcpRoutesSource()
    const mobileApiRoutesFacadeSource = getMobileApiRoutesFacadeSource()
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
    expect(routeBundleSource).toContain("registerOperatorRoutes(fastify, {")
    expect(routeBundleSource).not.toContain('from "./remote-server-controller"')
    expect(routeBundleSource).toContain('from "@dotagents/shared/remote-server-controller-contracts"')
    expect(routeBundleSource).toContain("actions: operatorRouteDesktopActions")
    expect(routeBundleSource).toContain("registerMobileApiRoutes(fastify, {")
    expect(routeBundleSource).toContain("actions: mobileApiDesktopActions")
    expect(routeBundleSource).toContain("registerInjectedMcpRoutes(fastify, {")
    expect(routeBundleSource).toContain("actions: injectedMcpDesktopActions")
    expect(operatorRoutesFacadeSource).not.toContain('from "./operator-agent-actions"')
    expect(operatorRoutesFacadeSource).not.toContain('from "./operator-mcp-actions"')
    expect(operatorRoutesFacadeSource).not.toContain('from "./operator-local-speech-actions"')
    expect(operatorRoutesFacadeSource).not.toContain('from "./operator-model-preset-actions"')
    expect(operatorRoutesFacadeSource).not.toContain('from "./operator-tunnel-actions"')
    expect(operatorRoutesFacadeSource).not.toContain('from "./operator-updater-actions"')
    expect(operatorRoutesFacadeSource).not.toContain('from "./operator-integration-actions"')
    expect(operatorRoutesFacadeSource).not.toContain('from "./operator-message-queue-actions"')
    expect(operatorRoutesFacadeSource).not.toContain('from "./operator-observability-actions"')
    expect(operatorRoutesFacadeSource).not.toContain('from "./operator-audit-actions"')
    expect(operatorRoutesFacadeSource).not.toContain('from "./operator-restart-actions"')
    expect(operatorRoutesFacadeSource).not.toContain('from "./operator-api-key-actions"')
    expect(operatorRoutesFacadeSource).toContain('from "@dotagents/shared/remote-server-operator-routes"')
    expect(operatorRoutesFacadeSource).toContain("registerOperatorRoutes as registerSharedOperatorRoutes")
    expect(operatorRoutesFacadeSource).toContain("export type OperatorRouteActions = SharedOperatorRouteActions<FastifyRequest>")
    expect(operatorRoutesFacadeSource).toContain(
      "export type RegisterOperatorRoutesOptions = SharedOperatorRouteOptions<FastifyRequest, FastifyReply>",
    )
    expect(operatorRoutesFacadeSource).not.toContain("export interface OperatorRouteActions")
    expect(operatorRoutesFacadeSource).not.toContain("export interface RegisterOperatorRoutesOptions")
    expect(sharedOperatorRoutesSource).toContain("from './remote-server-route-contracts'")
    expect(sharedOperatorRoutesSource).toContain("export interface RemoteServerOperatorRouteServer")
    expect(sharedOperatorRoutesSource).toContain("fastify.get(API_ROUTES.operatorStatus")
    expect(sharedOperatorRoutesSource).toContain("fastify.post(API_ROUTES.operatorRestartRemoteServer")
    expect(sharedOperatorRoutesSource).toContain("fastify.patch(API_ROUTES.operatorModelPreset")
    expect(sharedOperatorRoutesSource).toContain("fastify.delete(API_ROUTES.operatorMessageQueueMessage")
    expect(sharedOperatorRoutesSource).not.toContain("Fastify")
    expect(sharedOperatorRoutesSource).not.toContain("Electron")
    expect(operatorRouteDesktopActionsSource).toContain("export const operatorRouteDesktopActions")
    expect(operatorRouteDesktopActionsSource).toContain("runOperatorAgent")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorStatus")
    expect(operatorRouteDesktopActionsSource).toContain("recordOperatorAuditEvent")
    expect(injectedMcpRoutesSource).not.toContain('from "./injected-mcp-actions"')
    expect(injectedMcpRoutesSource).toContain('from "@dotagents/shared/remote-server-injected-mcp-routes"')
    expect(injectedMcpRoutesSource).toContain(
      "registerInjectedMcpRoutes as registerSharedInjectedMcpRoutes",
    )
    expect(injectedMcpRoutesSource).toContain(
      "export type InjectedMcpRouteActions = SharedInjectedMcpRouteActions<FastifyRequest, FastifyReply>",
    )
    expect(injectedMcpRoutesSource).toContain(
      "export type RegisterInjectedMcpRoutesOptions = SharedInjectedMcpRouteOptions<FastifyRequest, FastifyReply>",
    )
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
    expect(routeBundleSource).toContain("handleInjectedMcpProtocolRequest")
    expect(routeBundleSource).toContain("listInjectedMcpTools")
    expect(routeBundleSource).toContain("callInjectedMcpTool")
    expect(mobileApiRoutesFacadeSource).not.toContain('from "./model-actions"')
    expect(mobileApiRoutesFacadeSource).not.toContain('from "./conversation-actions"')
    expect(mobileApiRoutesFacadeSource).not.toContain('from "./settings-actions"')
    expect(mobileApiRoutesFacadeSource).not.toContain('from "./operator-audit-actions"')
    expect(mobileApiRoutesFacadeSource).toContain('from "@dotagents/shared/remote-server-mobile-api-routes"')
    expect(mobileApiRoutesFacadeSource).toContain(
      "registerMobileApiRoutes as registerSharedMobileApiRoutes",
    )
    expect(mobileApiRoutesFacadeSource).toContain(
      "export type MobileApiRouteActions = SharedMobileApiRouteActions<FastifyRequest, FastifyReply>",
    )
    expect(mobileApiRoutesFacadeSource).toContain(
      "export type RegisterMobileApiRoutesOptions = SharedMobileApiRouteOptions<FastifyRequest, FastifyReply>",
    )
    expect(mobileApiRoutesFacadeSource).not.toContain("export interface MobileApiRouteActions")
    expect(mobileApiRoutesFacadeSource).not.toContain("export interface RegisterMobileApiRoutesOptions")
    expect(sharedMobileApiRoutesSource).toContain("from './remote-server-route-contracts'")
    expect(sharedMobileApiRoutesSource).toContain("export interface RemoteServerMobileApiRouteServer")
    expect(sharedMobileApiRoutesSource).toContain("fastify.post(API_ROUTES.chatCompletions")
    expect(sharedMobileApiRoutesSource).toContain("fastify.get(API_ROUTES.models")
    expect(sharedMobileApiRoutesSource).toContain("fastify.patch(API_ROUTES.settings")
    expect(sharedMobileApiRoutesSource).toContain("fastify.put(API_ROUTES.conversation")
    expect(sharedMobileApiRoutesSource).toContain("fastify.delete(API_ROUTES.loop")
    expect(sharedMobileApiRoutesSource).not.toContain("Fastify")
    expect(sharedMobileApiRoutesSource).not.toContain("Electron")
    expect(mobileApiDesktopActionsSource).toContain("export const mobileApiDesktopActions")
    expect(mobileApiDesktopActionsSource).toContain("handleChatCompletionRequest")
    expect(mobileApiDesktopActionsSource).toContain("getModels")
    expect(mobileApiDesktopActionsSource).toContain("recordOperatorAuditEvent")
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
    expect(messageQueueActionsSource).toContain('from "@dotagents/shared/message-queue-store"')
    expect(messageQueueActionsSource).toContain("buildMessageQueuePauseResult(conversationId)")
    expect(messageQueueActionsSource).toContain("buildMessageQueueResumeResult(")
    expect(messageQueueActionsSource).toContain("buildQueuedMessageActionResult(")
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
    expect(sharedAgentRunUtilsSource).toContain("export function resolveAgentModeMaxIterations(")
    expect(sharedAgentRunUtilsSource).toContain("formatConversationHistoryForApi(latestConversation?.messages || [])")
    expect(sharedAgentRunUtilsSource).toContain("service.notifyConversationHistoryChanged()")
    expect(agentRunActionsSource).toContain("export type RunAgentOptions = AgentRunOptions")
    expect(agentRunActionsSource).toContain("export type RunAgentResult = AgentRunResult")
    expect(agentRunActionsSource).toContain("runRemoteAgentAction(options, actionOptions)")
    expect(agentRunActionsSource).toContain("processAgentMode: (prompt, conversationId, existingSessionId, startSnoozed, runOptions) =>")
    expect(mobileApiDesktopActionsSource).not.toContain('from "./chat-completion-actions"')
    expect(mobileApiDesktopActionsSource).toContain("type ChatCompletionRunAgentExecutor = AgentRunExecutor")
    expect(mobileApiRoutesSource).toContain("actions.handleChatCompletionRequest(req.body, req.headers.origin, reply, runAgent)")
    expect(sharedChatUtilsSource).toContain("export function validateChatCompletionRequestBody(")
    expect(mobileApiDesktopActionsSource).toContain("validateChatCompletionRequestBody(body, {")
    expect(mobileApiDesktopActionsSource).toContain("validateConversationId: getConversationIdValidationError")
    expect(mobileApiDesktopActionsSource).toContain("return reply.code(validatedRequest.statusCode).send(validatedRequest.body)")
    expect(sharedChatUtilsSource).toContain("export function buildChatCompletionPushNotificationPlan(")
    expect(mobileApiDesktopActionsSource).toContain("buildChatCompletionPushNotificationPlan({")
    expect(mobileApiDesktopActionsSource).toContain("const result = await runAgent({ prompt, conversationId, profileId, onProgress })")
    expect(mobileApiDesktopActionsSource).toContain("const result = await runAgent({ prompt, conversationId, profileId })")
    expect(source).toContain("export { runAgent }")
    expect(agentRunActionsSource).toContain("return runRemoteAgent(options, notifyConversationHistoryChanged)")
    expect(agentRunActionsSource).toContain("processWithAgentMode(")
    expect(agentRunActionsSource).toContain("runOptions,")
    expect(agentLoopRunnerSource).toContain("resolveAgentModeMaxIterations(config")
    expect(source).not.toContain('from "./agent-runtime"')
    expect(source).not.toContain('from "./acp-main-agent"')
    expect(source).not.toContain("agentRuntime.runAgentTurn")
    expect(mobileApiDesktopActionsSource).toContain("buildDotAgentsChatCompletionResponse({")
    expect(mobileApiDesktopActionsSource).toContain("conversationId: result.conversationId")
    expect(mobileApiDesktopActionsSource).toContain("conversationHistory: result.conversationHistory")
    expect(mobileApiDesktopActionsSource).toContain("buildChatCompletionProgressSsePayload(update)")
    expect(mobileApiDesktopActionsSource).toContain("sendMessageNotification(")
    expect(mobileApiDesktopActionsSource).toContain("notificationPlan.conversationTitle")
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
    expect(mobileApiDesktopActionsSource).toContain("getSkillsAction(skillActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("getSkillAction(skillId, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("createSkillAction(body, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("importSkillFromMarkdownAction(body, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("importSkillFromGitHubAction(body, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("exportSkillToMarkdownAction(skillId, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("updateSkillAction(skillId, body, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("deleteSkillAction(skillId, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("toggleProfileSkillAction(skillId, skillActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("cleanupInvalidSkillReferencesInLayers(")
    expect(mobileApiDesktopActionsSource).toContain("agentProfileService.reload()")
    expect(sharedSkillsApiSource).toContain("export interface SkillActionOptions")
    expect(sharedSkillsApiSource).toContain("export function getSkillsAction")
    expect(sharedSkillsApiSource).toContain("export function getSkillAction")
    expect(sharedSkillsApiSource).toContain("export function createSkillAction")
    expect(sharedSkillsApiSource).toContain("export function importSkillFromMarkdownAction")
    expect(sharedSkillsApiSource).toContain("export async function importSkillFromGitHubAction")
    expect(sharedSkillsApiSource).toContain("export function exportSkillToMarkdownAction")
    expect(sharedSkillsApiSource).toContain("export function updateSkillAction")
    expect(sharedSkillsApiSource).toContain("export function deleteSkillAction")
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
    expect(mobileApiDesktopActionsSource).toContain("getSettingsAction(providerSecretMask, settingsActionOptions)")
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
    expect(mobileApiDesktopActionsSource).not.toContain("p.connection.type === 'acpx'")
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
    expect(mobileApiDesktopActionsSource).toContain("updateSettingsAction(body, masks, settingsActionOptions)")
    expect(sharedSettingsApiClientSource).toContain("export async function updateSettingsAction")
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
      "getAgentSessionCandidatesAction(query, agentSessionCandidateActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).toContain("agentSessionTracker.getActiveSessions()")
    expect(mobileApiDesktopActionsSource).toContain("agentSessionTracker.getRecentSessions(limit)")
    expect(sharedAgentSessionCandidatesSource).toContain("export function getAgentSessionCandidatesAction")
    expect(sharedAgentSessionCandidatesSource).toContain("parseAgentSessionCandidateLimit(query)")
    expect(sharedAgentSessionCandidatesSource).toContain("buildAgentSessionCandidatesResponse(")
    expect(sharedAgentSessionCandidatesSource).not.toContain('from "./agent-session-tracker"')
  })

  it("delegates emergency stop route behavior to emergency stop actions", () => {
    const source = getRemoteServerSource()
    const mobileApiRoutesSource = getMobileApiRoutesSource()
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedSettingsApiClientSource = getSharedSettingsApiClientSource()

    expectRegisteredApiRoute(source, "POST", "emergencyStop")
    expect(mobileApiRoutesSource).toContain("actions.triggerEmergencyStop()")
    expect(mobileApiDesktopActionsSource).toContain("triggerEmergencyStopAction(emergencyStopActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("stopAll: emergencyStopAll")
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
    expect(mobileApiDesktopActionsSource).toContain("getProfilesAction(profileActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("getCurrentProfileAction(profileActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("setCurrentProfileAction(body, profileActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("exportProfileAction(id, profileActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("importProfileAction(body, profileActionOptions)")
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
    expect(mobileApiDesktopActionsSource).toContain("getBundleExportableItems")
    expect(mobileApiDesktopActionsSource).toContain("exportBundle")
    expect(mobileApiDesktopActionsSource).toContain("previewBundleImport")
    expect(mobileApiDesktopActionsSource).toContain("importBundle")
    expect(mobileApiDesktopActionsSource).toContain("getBundleExportableItemsAction(bundleActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("exportBundleAction(body, bundleActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("previewBundleImportAction(body, bundleActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("importBundleAction(body, bundleActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("getBundleExportableItemsFromLayers(getBundleLayerDirs())")
    expect(mobileApiDesktopActionsSource).toContain("exportBundleFromLayers(getBundleLayerDirs(), request)")
    expect(mobileApiDesktopActionsSource).toContain("previewBundleWithConflicts(filePath, getBundleImportTargetDir())")
    expect(mobileApiDesktopActionsSource).toContain("importBundleFromFile(filePath, getBundleImportTargetDir(), {")
    expect(sharedBundleApiSource).toContain("export function getBundleExportableItemsAction")
    expect(sharedBundleApiSource).toContain("export async function exportBundleAction")
    expect(sharedBundleApiSource).toContain("export async function previewBundleImportAction")
    expect(sharedBundleApiSource).toContain("export async function importBundleAction")
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
    expect(mobileApiDesktopActionsSource).toContain("getAgentProfilesAction(role, agentProfileActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain(
      "verifyExternalAgentCommandAction(body, externalAgentCommandVerificationActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).toContain("verifyExternalAgentCommand: verifyExternalAgentCommandService")
    expect(mobileApiDesktopActionsSource).toContain("reloadAgentProfilesAction(agentProfileReloadActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("reload: () => agentProfileService.reload()")
    expect(mobileApiDesktopActionsSource).toContain("toggleAgentProfileAction(id, agentProfileActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("getAgentProfileAction(id, agentProfileActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("createAgentProfileAction(body, agentProfileActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("updateAgentProfileAction(id, body, agentProfileActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("deleteAgentProfileAction(id, agentProfileActionOptions)")
    expect(sharedProfileApiSource).toContain("export interface AgentProfileActionOptions")
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
    expect(mobileApiDesktopActionsSource).toContain("getModelsAction(modelActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("getProviderModelsAction(providerId, modelActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("fetchAvailableModels: async (providerId) =>")
    expect(sharedChatUtilsSource).toContain("export interface ModelActionOptions")
    expect(sharedChatUtilsSource).toContain("export function getModelsAction")
    expect(sharedChatUtilsSource).toContain("export async function getProviderModelsAction")
    expect(sharedChatUtilsSource).toContain("resolveActiveModelId(options.getConfig())")
    expect(sharedChatUtilsSource).toContain("options.fetchAvailableModels(providerId)")
    expect(sharedChatUtilsSource).not.toContain("models-service")
    expect(sharedChatUtilsSource).not.toContain("configStore")
    expect(mobileApiDesktopActionsSource).toContain("getMcpServersAction(mcpServerActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("toggleMcpServerAction(serverName, body, mcpServerActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain(
      "upsertMcpServerConfigAction(serverName, body, mcpServerConfigActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).toContain(
      "deleteMcpServerConfigAction(serverName, mcpServerConfigActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).toContain("importMcpServerConfigsAction(body, mcpServerConfigActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("exportMcpServerConfigsAction(mcpServerConfigActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("cleanupInvalidMcpServerReferencesInLayers(layers, validServerNames)")
    expect(mobileApiDesktopActionsSource).toContain("agentProfileService.reload()")
    expect(sharedMcpApiSource).toContain("export interface McpServerActionService")
    expect(sharedMcpApiSource).toContain("export interface McpServerConfigActionService")
    expect(sharedMcpApiSource).toContain("export function getMcpServersAction")
    expect(sharedMcpApiSource).toContain("export function toggleMcpServerAction")
    expect(sharedMcpApiSource).toContain("export function upsertMcpServerConfigAction")
    expect(sharedMcpApiSource).toContain("export function deleteMcpServerConfigAction")
    expect(sharedMcpApiSource).toContain("export function importMcpServerConfigsAction")
    expect(sharedMcpApiSource).toContain("export function exportMcpServerConfigsAction")
    expect(sharedMcpApiSource).toContain("buildMcpServersResponse(options.service.getServerStatus())")
    expect(sharedMcpApiSource).toContain("options.service.setServerRuntimeEnabled(normalizedServerName, enabled)")
    expect(sharedMcpApiSource).toContain("options.service.saveMcpConfig(nextMcpConfig)")
    expect(sharedMcpApiSource).toContain("mergeImportedMcpServers(currentMcpConfig, parsedRequest.request.config")
    expect(sharedMcpApiSource).toContain("buildMcpServerConfigExportResponse(options.service.getMcpConfig())")
    expect(sharedMcpApiSource).toContain("options.service.onMcpConfigSaved?.({")
    expect(sharedMcpApiSource).not.toContain("mcpService")
    expect(sharedMcpApiSource).not.toContain("diagnosticsService")
    expect(mobileApiDesktopActionsSource).toContain("synthesizeSpeechAction(body, ttsActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("generateSpeech: generateTTS")
    expect(mobileApiDesktopActionsSource).toContain("encodeAudioBody: (audio) => Buffer.from(audio)")
    expect(sharedTtsApiSource).toContain("export interface TtsActionOptions")
    expect(sharedTtsApiSource).toContain("export async function synthesizeSpeechAction")
    expect(sharedTtsApiSource).toContain("parseTtsSpeakRequestBody(body)")
    expect(sharedTtsApiSource).toContain("options.generateSpeech(parsedRequest.request, options.getConfig())")
    expect(sharedTtsApiSource).toContain("options.encodeAudioBody(result.audio)")
    expect(sharedTtsApiSource).not.toContain("tts-service")
    expect(sharedTtsApiSource).not.toContain("configStore")
    expect(mobileApiDesktopActionsSource).toContain("registerPushTokenAction(body, pushActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("unregisterPushTokenAction(body, pushActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("getPushStatusAction(pushActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("clearPushBadgeAction(body, pushActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("savePushNotificationTokens: (tokens: PushTokenRecord[]) =>")
    expect(mobileApiDesktopActionsSource).toContain("clearBadgeCount")
    expect(sharedPushNotificationsSource).toContain("export interface PushActionTokenStore")
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
    expect(mobileApiDesktopActionsSource).toContain("getConversationAction(id, conversationActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("getConversationsAction(conversationActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain(
      "createConversationAction(body, onChanged, conversationActionOptions)",
    )
    expect(mobileApiDesktopActionsSource).toContain(
      "updateConversationAction(id, body, onChanged, conversationActionOptions)",
    )
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
    expect(mobileApiDesktopActionsSource).toContain("getConversationVideoAssetPath(conversationId, fileName ?? \"\")")
    expect(mobileApiDesktopActionsSource).toContain(
      "buildConversationVideoAssetStreamPlan(fileName ?? \"\", rangeHeader, stat.size)",
    )
    expect(mobileApiDesktopActionsSource).toContain("buildMobileApiActionError(400, conversationIdError)")
    expect(mobileApiDesktopActionsSource).toContain("buildMobileApiActionResult(")
    expect(sharedRemoteServerRouteContractsSource).toContain("export function buildMobileApiActionResult(")
    expect(sharedRemoteServerRouteContractsSource).toContain("export function buildMobileApiActionError(")
    expect(sharedRemoteServerRouteContractsSource).toContain("return buildMobileApiActionResult({ error: message }, statusCode, headers)")
    expect(sharedConversationMediaAssetsSource).toContain("export function buildConversationVideoAssetStreamPlan(")
    expect(sharedConversationMediaAssetsSource).toContain("getConversationVideoByteRange(rangeHeader, totalSize)")
    expect(sharedConversationMediaAssetsSource).toContain("export const CONVERSATION_IMAGE_ASSET_HOST = 'conversation-image'")
    expect(sharedConversationMediaAssetsSource).toContain("export const CONVERSATION_IMAGE_ASSETS_DIR_NAME = '_images'")
    expect(sharedConversationMediaAssetsSource).toContain("export function buildConversationImageAssetUrl(")
    expect(sharedConversationMediaAssetsSource).toContain("export function isSafeConversationImageAssetFileName(")
    expect(sharedConversationMediaAssetsSource).toContain("export function parseConversationImageAssetUrl(")
    expect(sharedConversationMediaAssetsSource).toContain("export function isConversationImageAssetUrl(")
    expect(conversationImageAssetsSource).toContain('from "@dotagents/shared/conversation-media-assets"')
    expect(conversationImageAssetsSource).toContain("isSafeConversationImageAssetFileName(fileName)")
    expect(conversationImageAssetsSource).not.toContain("SAFE_IMAGE_ASSET_FILE_REGEX")
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
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorStatusAction(remoteServerStatus, observabilityActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorHealthAction(observabilityActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorErrorsAction(count, observabilityActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorLogsAction(count, level, observabilityActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorConversationsAction(count, observabilityActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorRemoteServerAction(remoteServerStatus)")
    expect(operatorRouteDesktopActionsSource).toContain("service: {")
    expect(operatorRouteDesktopActionsSource).toContain("getTunnelStatus: getCloudflareTunnelStatus")
    expect(operatorRouteDesktopActionsSource).toContain("getSystemMetrics: getOperatorSystemMetrics")
    expect(sharedOperatorActionsSource).toContain("export async function getOperatorStatusAction(")
    expect(sharedOperatorActionsSource).toContain("export async function getOperatorHealthAction(")
    expect(sharedOperatorActionsSource).toContain("export function getOperatorErrorsAction(")
    expect(sharedOperatorActionsSource).toContain("export function getOperatorLogsAction(")
    expect(operatorRoutesSource).toContain("actions.getOperatorAudit(query.count)")
    expect(controllerSource).toContain("adapters.recordOperatorResponseAuditEvent(req, reply)")
    expect(desktopAdaptersSource).toContain("recordOperatorResponseAuditEvent")
    expect(operatorAuditActionsSource).toContain("getOperatorAuditAction(count, operatorAuditActionOptions)")
    expect(sharedOperatorActionsSource).toContain("export function getOperatorAuditAction(")
    expect(sharedOperatorActionsSource).toContain("buildOperatorAuditResponse(options.getEntries(), count)")
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
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorIntegrationsAction(integrationActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorDiscordAction(integrationActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorDiscordLogsAction(count, integrationActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("connectOperatorDiscordAction(integrationActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("logoutOperatorWhatsAppAction(integrationActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("service: {")
    expect(operatorRouteDesktopActionsSource).toContain("getIntegrationsSummary: buildOperatorIntegrationsSummary")
    expect(operatorRouteDesktopActionsSource).toContain("startDiscord: () => discordService.start()")
    expect(operatorRouteDesktopActionsSource).toContain("stopDiscord: () => discordService.stop()")
    expect(operatorRouteDesktopActionsSource).toContain("clearDiscordLogs: () => discordService.clearLogs()")
    expect(operatorRouteDesktopActionsSource).toContain("mcpService.executeToolCall")
    expect(operatorRouteDesktopActionsSource).toContain("WHATSAPP_SERVER_NAME")
    expect(sharedOperatorActionsSource).toContain("export async function getOperatorIntegrationsAction(")
    expect(sharedOperatorActionsSource).toContain("export function getOperatorDiscordAction(")
    expect(sharedOperatorActionsSource).toContain("export async function connectOperatorWhatsAppAction(")
    expect(sharedOperatorActionsSource).toContain("buildOperatorDiscordIntegrationSummary(")
    expect(sharedOperatorActionsSource).toContain("buildOperatorDiscordLogsResponse(options.service.getDiscordLogs(), count)")
    expect(sharedOperatorActionsSource).toContain("getOperatorMcpToolResultText(result)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorWhatsAppActionSuccessResponse({ action, text, successMessage })")
    expect(operatorIntegrationSummarySource).toContain("buildOperatorIntegrationsSummary")
    expect(operatorIntegrationSummarySource).toContain("getOperatorWhatsAppIntegrationSummary")
    expect(operatorIntegrationSummarySource).toContain("buildOperatorWhatsAppIntegrationSummary")
    expect(operatorIntegrationSummarySource).toContain("mergeOperatorWhatsAppStatusPayload")
    expect(operatorRouteDesktopActionsSource).toContain('from "./operator-integration-summary"')
    expect(operatorRouteDesktopActionsSource).not.toContain('from "./operator-integration-actions"')
    expect(operatorLifecycleSection).toContain("scheduleRemoteServerRestartFromOperator")
    expect(operatorLifecycleSection).toContain("scheduleAppRestartFromOperator")
    expect(operatorLifecycleSection).toContain("scheduleRemoteServerLifecycleActionAfterReply")
    expect(operatorRoutesSource).toContain("actions.getOperatorTunnel()")
    expect(operatorRoutesSource).toContain("actions.getOperatorTunnelSetup()")
    expect(operatorRoutesSource).toContain("actions.startOperatorTunnel(getRemoteServerStatus().running)")
    expect(operatorRoutesSource).toContain("actions.stopOperatorTunnel()")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorTunnelAction(tunnelActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorTunnelSetupAction(tunnelActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain(
      "startOperatorTunnelAction(remoteServerRunning, tunnelActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("stopOperatorTunnelAction(tunnelActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("service: {")
    expect(operatorRouteDesktopActionsSource).toContain("checkCloudflaredInstalled")
    expect(operatorRouteDesktopActionsSource).toContain("listCloudflareTunnels")
    expect(operatorRouteDesktopActionsSource).toContain("startNamedCloudflareTunnel")
    expect(operatorRouteDesktopActionsSource).toContain("startCloudflareTunnel")
    expect(operatorRouteDesktopActionsSource).toContain("stopCloudflareTunnel")
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
      "getOperatorUpdaterAction(currentVersion, MANUAL_RELEASES_URL, updaterActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain(
      "checkOperatorUpdaterAction(MANUAL_RELEASES_URL, updaterActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("downloadLatestOperatorUpdateAssetAction(updaterActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("openOperatorReleasesPageAction(updaterActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("service: {")
    expect(operatorRouteDesktopActionsSource).toContain("checkForUpdatesAndDownload")
    expect(operatorRouteDesktopActionsSource).toContain("downloadLatestReleaseAsset")
    expect(operatorRouteDesktopActionsSource).toContain("revealDownloadedReleaseAsset")
    expect(operatorRouteDesktopActionsSource).toContain("openDownloadedReleaseAsset")
    expect(operatorRouteDesktopActionsSource).toContain("openManualReleasesPage")
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
    expect(controllerSource).toContain("adapters.sendAuthFailure(reply, {")
    expect(desktopAdaptersSource).toContain("reply.code(response.statusCode).send({ error: response.error })")
    expect(operatorAuditActionsSource).toContain("fs.appendFileSync(operatorAuditLogPath")
    expect(operatorAuditActionsSource).toContain("getOperatorAuditDeviceId(request)")
    expect(operatorAuditActionsSource).toContain("getOperatorAuditSource(request)")
    expect(operatorAuditActionsSource).toContain("function recordOperatorAuditEvent")
    expect(operatorAuditActionsSource).toContain("getOperatorAuditAction(count, operatorAuditActionOptions)")
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
    expect(operatorRouteDesktopActionsSource).toContain("restartOperatorRemoteServerAction as restartOperatorRemoteServer")
    expect(operatorRouteDesktopActionsSource).toContain("restartOperatorAppAction as restartOperatorApp")
    expect(sharedOperatorActionsSource).toContain("export function restartOperatorRemoteServerAction(")
    expect(sharedOperatorActionsSource).toContain("buildOperatorRestartRemoteServerActionResponse(isRunning)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorRestartAppActionResponse(appVersion)")
    expect(sharedOperatorActionsSource).toContain("auditContext: buildOperatorActionAuditContext(body)")
    expect(operatorSection).toContain("actions.rotateOperatorRemoteServerApiKey()")
    expect(operatorSection).toContain("scheduleRemoteServerRestartAfterReply(reply)")
    expect(operatorRouteDesktopActionsSource).toContain("rotateOperatorRemoteServerApiKeyAction(apiKeyActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain('generateApiKey: () => crypto.randomBytes(32).toString("hex")')
    expect(desktopAdaptersSource).toContain("generateApiKey: generateRemoteServerApiKey")
    expect(desktopAdaptersSource).toContain("function generateRemoteServerApiKey()")
    expect(sharedOperatorActionsSource).toContain("buildOperatorApiKeyRotationResponse(apiKey)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorApiKeyRotationAuditContext()")
    expect(sharedOperatorActionsSource).toContain("buildOperatorApiKeyRotationFailureAuditContext()")
    // Runtime status shaping stays shared while desktop supplies process and service state.
    expect(sharedOperatorActionsSource).toContain("buildOperatorRuntimeStatus({")
    expect(sharedOperatorActionsSource).toContain("system: options.service.getSystemMetrics()")
    expect(operatorRouteDesktopActionsSource).toContain("function getOperatorSystemMetrics()")
    expect(operatorRouteDesktopActionsSource).toContain("os.platform()")
    expect(operatorRouteDesktopActionsSource).toContain("process.memoryUsage()")
    expect(operatorRouteDesktopActionsSource).toContain("os.hostname()")
    expect(operatorRouteDesktopActionsSource).toContain("getActiveSessions: () => agentSessionTracker.getActiveSessions()")
    expect(operatorRouteDesktopActionsSource).toContain("getRecentSessions: (count) => agentSessionTracker.getRecentSessions(count)")
    // Conversations endpoint
    expect(sharedOperatorActionsSource).toContain("buildOperatorConversationsResponse(history, count)")
    expect(operatorRouteDesktopActionsSource).toContain("getConversationHistory: () => conversationService.getConversationHistory()")
    expectRegisteredApiRoute(source, "GET", "operatorConversations")
    // Run-agent endpoint
    const agentRunActionsSource = getAgentRunActionsSource()
    expectRegisteredApiRoute(source, "POST", "operatorRunAgent")
    expect(agentRunActionsSource).toContain("runRemoteAgentAction(options, actionOptions)")
    expect(agentRunActionsSource).toContain("processWithAgentMode(")
    expect(agentRunActionsSource).toContain("runOptions,")
    expect(operatorRoutesSource).toContain("actions.runOperatorAgent(req.body, runAgent)")
    expect(operatorRouteDesktopActionsSource).toContain('from "@dotagents/shared/agent-run-utils"')
    expect(operatorRouteDesktopActionsSource).toContain("runOperatorAgentAction(body, runAgent, agentActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("service: {")
    expect(sharedOperatorActionsSource).toContain("export async function runOperatorAgentAction(")
    expect(sharedOperatorActionsSource).toContain("parseOperatorRunAgentRequestBody(body)")
    expect(sharedOperatorActionsSource).toContain("buildOperatorRunAgentResponse(agentResult)")
    // Agent session controls
    expectRegisteredApiRoute(source, "POST", "operatorAgentSessionStop")
    expect(operatorRoutesSource).toContain("actions.stopOperatorAgentSession(params.sessionId)")
    expect(operatorRouteDesktopActionsSource).toContain("stopAgentSessionById")
    expect(operatorRouteDesktopActionsSource).toContain("stopOperatorAgentSessionAction(sessionIdParam, agentActionOptions)")
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
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorMessageQueuesAction(messageQueueActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain(
      "clearOperatorMessageQueueAction(conversationIdParam, messageQueueActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("getAllQueues: () => messageQueueService.getAllQueues()")
    expect(operatorRouteDesktopActionsSource).toContain(
      "clearQueue: (conversationId) => messageQueueService.clearQueue(conversationId)",
    )
    expect(operatorRouteDesktopActionsSource).toContain(
      "pauseQueue: (conversationId) => pauseMessageQueueByConversationId(conversationId)",
    )
    expect(operatorRouteDesktopActionsSource).toContain(
      "resumeQueue: (conversationId) => resumeMessageQueueByConversationId(conversationId)",
    )
    expect(operatorRouteDesktopActionsSource).toContain(
      "removeQueuedMessage: (conversationId, messageId) => removeQueuedMessageById(conversationId, messageId)",
    )
    expect(operatorRouteDesktopActionsSource).toContain(
      "retryQueuedMessage: (conversationId, messageId) => retryQueuedMessageById(conversationId, messageId)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("updateQueuedMessageTextById(conversationId, messageId, text)")
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
    expect(messageQueueActionsSource).toContain("buildMessageQueuePauseResult(conversationId)")
    expect(messageQueueActionsSource).toContain("buildMessageQueueResumeResult(")
    expect(messageQueueActionsSource).toContain("buildQueuedMessageActionResult(")
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
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorMcpStatusAction(operatorMcpReadActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorMcpServerLogsAction(serverName, count, operatorMcpReadActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorMcpToolsAction(server, operatorMcpReadActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("clearOperatorMcpServerLogsAction(serverName, operatorMcpMutationActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("setOperatorMcpToolEnabledAction(toolName, body, operatorMcpMutationActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("testOperatorMcpServerAction(serverName, operatorMcpTestActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("startOperatorMcpServerAction(body, operatorMcpLifecycleActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("stopOperatorMcpServerAction(body, operatorMcpLifecycleActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("restartOperatorMcpServerAction(body, operatorMcpLifecycleActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain("getServerLogs: (serverName) => mcpService.getServerLogs(serverName)")
    expect(operatorRouteDesktopActionsSource).toContain("getDetailedToolList: () => mcpService.getDetailedToolList()")
    expect(operatorRouteDesktopActionsSource).toContain("clearServerLogs: (serverName) => mcpService.clearServerLogs(serverName)")
    expect(operatorRouteDesktopActionsSource).toContain("setToolEnabled: (toolName, enabled) => mcpService.setToolEnabled(toolName, enabled)")
    expect(operatorRouteDesktopActionsSource).toContain("getServerConfig: (serverName) => configStore.get().mcpConfig?.mcpServers?.[serverName]")
    expect(operatorRouteDesktopActionsSource).toContain("testServerConnection: (serverName, serverConfig) => mcpService.testServerConnection(serverName, serverConfig)")
    expect(operatorRouteDesktopActionsSource).toContain("setServerRuntimeEnabled: (serverName, enabled) => mcpService.setServerRuntimeEnabled(serverName, enabled)")
    expect(operatorRouteDesktopActionsSource).toContain("restartServer: (serverName) => mcpService.restartServer(serverName)")
    expect(operatorRouteDesktopActionsSource).toContain("stopServer: (serverName) => mcpService.stopServer(serverName)")
    expect(sharedMcpApiSource).toContain("export function getOperatorMcpStatusAction(")
    expect(sharedMcpApiSource).toContain("export function getOperatorMcpServerLogsAction(")
    expect(sharedMcpApiSource).toContain("export function getOperatorMcpToolsAction(")
    expect(sharedMcpApiSource).toContain("export function clearOperatorMcpServerLogsAction<")
    expect(sharedMcpApiSource).toContain("export function setOperatorMcpToolEnabledAction<")
    expect(sharedMcpApiSource).toContain("export async function testOperatorMcpServerAction<")
    expect(sharedMcpApiSource).toContain("export async function startOperatorMcpServerAction<")
    expect(sharedMcpApiSource).toContain("export async function stopOperatorMcpServerAction<")
    expect(sharedMcpApiSource).toContain("export async function restartOperatorMcpServerAction<")
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
      "getOperatorLocalSpeechModelStatusesAction(localSpeechModelActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain(
      "getOperatorLocalSpeechModelStatusAction(providerId, localSpeechModelActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain(
      "downloadOperatorLocalSpeechModelAction(providerId, localSpeechModelActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain("service: {")
    expect(operatorRouteDesktopActionsSource).toContain("getStatus: getLocalSpeechModelStatus")
    expect(operatorRouteDesktopActionsSource).toContain("startDownload: startLocalSpeechModelDownload")
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
    expect(operatorRouteDesktopActionsSource).toContain("getOperatorModelPresetsAction(secretMask, modelPresetActionOptions)")
    expect(operatorRouteDesktopActionsSource).toContain(
      "createOperatorModelPresetAction(body, secretMask, modelPresetActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain(
      "updateOperatorModelPresetAction(presetId, body, secretMask, modelPresetActionOptions)",
    )
    expect(operatorRouteDesktopActionsSource).toContain(
      "deleteOperatorModelPresetAction(presetId, secretMask, modelPresetActionOptions)",
    )
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
    const mobileApiDesktopActionsSource = getMobileApiDesktopActionsSource()
    const sharedSettingsApiClientSource = getSharedSettingsApiClientSource()
    const settingsPatchSection = getSection(
      source,
      getApiRouteRegistrationMarker(source, "PATCH", "settings"),
      '// GET /v1/conversations/:id - Fetch conversation state for recovery',
    )

    expect(settingsPatchSection).toContain("if (result.auditContext)")
    expect(settingsPatchSection).toContain("actions.recordOperatorAuditEvent(req, result.auditContext)")
    expect(mobileApiDesktopActionsSource).toContain("updateSettingsAction(body, masks, settingsActionOptions)")
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
    const listInjectedMcpToolsSection = getSection(injectedMcpActionsSource, "async function listInjectedMcpTools", "async function callInjectedMcpTool")
    const callInjectedMcpToolSection = getSection(injectedMcpActionsSource, "async function callInjectedMcpTool", "async function handleInjectedMcpProtocolRequest")
    const streamableMcpSection = getSection(injectedMcpActionsSource, "async function handleInjectedMcpProtocolRequest", "if (!reply.sent)")

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
    expect(injectedMcpRoutesSource).toContain("registerSharedInjectedMcpRoutes")
    expect(sharedInjectedMcpRoutesSource).toContain(getMcpRouteRegistrationMarker(sharedInjectedMcpRoutesSource, "POST", "session"))
    expect(sharedInjectedMcpRoutesSource).toContain(getMcpRouteRegistrationMarker(sharedInjectedMcpRoutesSource, "POST", "sessionToolsList"))
    expect(sharedInjectedMcpRoutesSource).toContain(getMcpRouteRegistrationMarker(sharedInjectedMcpRoutesSource, "POST", "sessionToolsCall"))
    expect(sharedInjectedMcpRoutesSource).toContain("actions.handleInjectedMcpProtocolRequest(req, reply, getOptionalStringParam(req, 'acpSessionToken'))")
    expect(sharedInjectedMcpRoutesSource).toContain("actions.listInjectedMcpTools(getOptionalStringQuery(req, 'acpSessionToken'), reply)")
    expect(sharedInjectedMcpRoutesSource).toContain("actions.callInjectedMcpTool(req, reply, getOptionalStringQuery(req, 'acpSessionToken'))")
    expect(injectedMcpActionsSource).toContain("INVALID_ACP_SESSION_CONTEXT_ERROR")
    expect(injectedMcpActionsSource).toContain("StreamableHTTPServerTransport")
    expect(injectedMcpActionsSource).toContain("isInitializeRequest(req.body)")
    expect(injectedMcpActionsSource).toContain("listInjectedMcpToolsAction(acpSessionToken, injectedMcpActionOptions)")
    expect(injectedMcpActionsSource).toContain("callInjectedMcpToolAction(acpSessionToken, req.body, injectedMcpActionOptions)")
    expect(injectedMcpActionsSource).toContain("getInjectedRuntimeTools: (acpSessionToken) => getInjectedRuntimeToolsForAcpSession(acpSessionToken)")
    expect(injectedMcpActionsSource).toContain("executeInjectedRuntimeTool: (toolCall, requestContext) => mcpService.executeToolCall(")
    expect(sharedMcpApiSource).toContain("export function listInjectedMcpToolsAction<")
    expect(sharedMcpApiSource).toContain("export async function callInjectedMcpToolAction<")
    expect(sharedMcpApiSource).toContain("buildInjectedMcpToolsListResponse(injectedRuntimeTools.tools)")
    expect(sharedMcpApiSource).toContain("parseInjectedMcpToolCallRequestBody(body)")
    expect(sharedMcpApiSource).toContain("buildInjectedMcpToolCallResponse(result)")
    expect(sharedMcpApiSource).toContain("buildInjectedMcpToolCallErrorResponse(")
    expect(listInjectedMcpToolsSection).toContain("reply.code(result.statusCode).send(result.body)")
    expect(listInjectedMcpToolsSection).not.toContain("mcpService.getAvailableTools()")
    expect(injectedMcpActionsSource).toContain("?? getPendingAppSessionForClientSessionToken(acpSessionToken)")
    expect(callInjectedMcpToolSection).toContain("reply.code(result.statusCode).send(result.body)")
    expect(injectedMcpActionsSource).toContain("requestContext.appSessionId")
    expect(injectedMcpActionsSource).toContain("requestContext.profileSnapshot.mcpServerConfig")
    expect(callInjectedMcpToolSection).not.toContain("profileSnapshot?.mcpServerConfig")
    expect(streamableMcpSection).toContain("new StreamableHTTPServerTransport")
    expect(streamableMcpSection).toContain("reply.hijack()")
    expect(streamableMcpSection).toContain("transport.handleRequest(req.raw, reply.raw, req.body)")
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
    expect(mobileApiDesktopActionsSource).toContain("getKnowledgeNotesAction(query, knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("getKnowledgeNoteAction(id, knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("searchKnowledgeNotesAction(body, knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("deleteMultipleKnowledgeNotesAction(body, knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("deleteAllKnowledgeNotesAction(knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("createKnowledgeNoteAction(body, knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("updateKnowledgeNoteAction(id, body, knowledgeNoteActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("deleteKnowledgeNoteAction(id, knowledgeNoteActionOptions)")
    expect(sharedKnowledgeNoteFormSource).toContain("export interface KnowledgeNoteActionOptions")
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
    expect(mobileApiDesktopActionsSource).toContain("getRepeatTasksAction(repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("getRepeatTaskStatusesAction(repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("importRepeatTaskFromMarkdownAction(body, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("startRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("stopRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("toggleRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("runRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("exportRepeatTaskToMarkdownAction(id, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("createRepeatTaskAction(body, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("updateRepeatTaskAction(id, body, repeatTaskActionOptions)")
    expect(mobileApiDesktopActionsSource).toContain("deleteRepeatTaskAction(id, repeatTaskActionOptions)")
    expect(sharedRepeatTaskUtilsSource).toContain("export interface RepeatTaskActionOptions")
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
