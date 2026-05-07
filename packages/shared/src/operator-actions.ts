import type {
  OperatorAuditEntry,
  OperatorAuditResponse,
  OperatorActionResponse,
  OperatorApiKeyRotationResponse,
  OperatorConversationItem,
  OperatorConversationsResponse,
  OperatorDiscordIntegrationSummary,
  OperatorDiscordLogEntry,
  OperatorDiscordLogsResponse,
  OperatorHealthSnapshot,
  OperatorIntegrationsSummary,
  OperatorLogSummary,
  OperatorLogsResponse,
  OperatorMCPServerTestResponse,
  OperatorPushNotificationsSummary,
  OperatorRecentError,
  OperatorRecentErrorsResponse,
  OperatorRemoteServerStatus,
  OperatorRunAgentRequest,
  OperatorRunAgentResponse,
  OperatorRuntimeStatus,
  OperatorSessionsSummary,
  OperatorSystemMetrics,
  OperatorTunnelSetupSummary,
  OperatorTunnelSetupTunnel,
  OperatorTunnelStatus,
  OperatorUpdaterStatus,
  OperatorWhatsAppIntegrationSummary,
} from "./api-types"
import { sanitizeConfigStringList } from "./config-list-input"
import type {
  AgentRunExecutor,
  AgentRunResult,
} from "./agent-run-utils"
import {
  buildOperatorMessageQueuesResponse,
  type MessageQueue,
} from "./message-queue-utils"
import {
  REMOTE_SERVER_API_PATHS,
  getRemoteServerApiRoutePath,
  getRemoteServerOperatorApiActionPath,
  isRemoteServerOperatorApiPath,
} from "./remote-server-api"
import { DEFAULT_CLOUDFLARE_TUNNEL_MODE, type CloudflareTunnelConfig } from "./remote-pairing"

export type OperatorActionParseResult<T> =
  | { ok: true; request: T }
  | { ok: false; statusCode: 400; error: string }

export type OperatorActionAuditContext = {
  action: string
  success: boolean
  details?: Record<string, unknown>
  failureReason?: string
}

export type OperatorResponseAuditContext = Partial<OperatorActionAuditContext>

export type OperatorHttpResponseLike = {
  statusCode: number
}

export type OperatorAuditActionResult = {
  statusCode: number
  body: unknown
}

export interface OperatorAuditActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
}

export interface OperatorAuditActionOptions {
  getEntries(): OperatorAuditEntry[]
  diagnostics: OperatorAuditActionDiagnostics
}

export interface OperatorAuditRouteActions {
  getOperatorAudit(count: string | number | undefined): OperatorAuditActionResult
}

export type OperatorMcpRestartRequest = {
  server: string
}

export type OperatorMcpServerActionRequest = {
  server: string
}

export type OperatorQueuedMessageUpdateRequest = {
  text: string
}

export type OperatorMessageQueueActionResult = {
  statusCode: number
  body: unknown
  auditContext?: OperatorActionAuditContext
}

export type OperatorMessageQueuePauseResultLike = {
  conversationId: string
}

export type OperatorMessageQueueResumeResultLike = {
  conversationId: string
  processingStarted: boolean
}

export type OperatorQueuedMessageMutationResultLike = {
  success: boolean
  processingStarted?: boolean
}

export interface OperatorMessageQueueActionService {
  getAllQueues(): MessageQueue[]
  isQueuePaused(conversationId: string): boolean
  clearQueue(conversationId: string): boolean
  pauseQueue(conversationId: string): OperatorMessageQueuePauseResultLike
  resumeQueue(conversationId: string): OperatorMessageQueueResumeResultLike
  removeQueuedMessage(conversationId: string, messageId: string): OperatorQueuedMessageMutationResultLike
  retryQueuedMessage(conversationId: string, messageId: string): OperatorQueuedMessageMutationResultLike
  updateQueuedMessageText(
    conversationId: string,
    messageId: string,
    text: string,
  ): OperatorQueuedMessageMutationResultLike
}

export interface OperatorMessageQueueStoreAdapter {
  getAllQueues(): MessageQueue[]
  isQueuePaused(conversationId: string): boolean
  clearQueue(conversationId: string): boolean
}

export interface OperatorMessageQueueMutationAdapter {
  pauseQueue(conversationId: string): OperatorMessageQueuePauseResultLike
  resumeQueue(conversationId: string): OperatorMessageQueueResumeResultLike
  removeQueuedMessage(conversationId: string, messageId: string): OperatorQueuedMessageMutationResultLike
  retryQueuedMessage(conversationId: string, messageId: string): OperatorQueuedMessageMutationResultLike
  updateQueuedMessageText(
    conversationId: string,
    messageId: string,
    text: string,
  ): OperatorQueuedMessageMutationResultLike
}

export interface OperatorMessageQueueActionServiceOptions {
  queue: OperatorMessageQueueStoreAdapter
  mutations: OperatorMessageQueueMutationAdapter
}

export function createOperatorMessageQueueActionService(
  options: OperatorMessageQueueActionServiceOptions,
): OperatorMessageQueueActionService {
  return {
    getAllQueues: () => options.queue.getAllQueues(),
    isQueuePaused: (conversationId) => options.queue.isQueuePaused(conversationId),
    clearQueue: (conversationId) => options.queue.clearQueue(conversationId),
    pauseQueue: (conversationId) => options.mutations.pauseQueue(conversationId),
    resumeQueue: (conversationId) => options.mutations.resumeQueue(conversationId),
    removeQueuedMessage: (conversationId, messageId) =>
      options.mutations.removeQueuedMessage(conversationId, messageId),
    retryQueuedMessage: (conversationId, messageId) =>
      options.mutations.retryQueuedMessage(conversationId, messageId),
    updateQueuedMessageText: (conversationId, messageId, text) =>
      options.mutations.updateQueuedMessageText(conversationId, messageId, text),
  }
}

export interface OperatorMessageQueueActionOptions {
  service: OperatorMessageQueueActionService
}

export interface OperatorMessageQueueRouteActions {
  getOperatorMessageQueues(): OperatorMessageQueueActionResult
  clearOperatorMessageQueue(conversationIdParam: string | undefined): OperatorMessageQueueActionResult
  pauseOperatorMessageQueue(conversationIdParam: string | undefined): OperatorMessageQueueActionResult
  resumeOperatorMessageQueue(conversationIdParam: string | undefined): OperatorMessageQueueActionResult
  removeOperatorQueuedMessage(
    conversationIdParam: string | undefined,
    messageIdParam: string | undefined,
  ): OperatorMessageQueueActionResult
  retryOperatorQueuedMessage(
    conversationIdParam: string | undefined,
    messageIdParam: string | undefined,
  ): OperatorMessageQueueActionResult
  updateOperatorQueuedMessage(
    conversationIdParam: string | undefined,
    messageIdParam: string | undefined,
    body: unknown,
  ): OperatorMessageQueueActionResult
}

export type OperatorRestartActionResult = {
  statusCode: number
  body: unknown
  auditContext: OperatorActionAuditContext
  shouldRestartRemoteServer?: boolean
  shouldRestartApp?: boolean
}

export interface OperatorRestartRouteActions {
  restartOperatorApp(appVersion: string): OperatorRestartActionResult
  restartOperatorRemoteServer(isRunning: boolean): OperatorRestartActionResult
}

export type OperatorApiKeyActionResult = {
  statusCode: number
  body: unknown
  auditContext?: OperatorActionAuditContext
  shouldRestartRemoteServer?: boolean
}

export interface OperatorApiKeyActionConfigLike {
  remoteServerApiKey?: string
}

export interface OperatorApiKeyActionConfigStore<TConfig extends OperatorApiKeyActionConfigLike = OperatorApiKeyActionConfigLike> {
  get(): TConfig
  save(config: TConfig): void
}

export interface OperatorApiKeyActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
}

export interface OperatorApiKeyActionService {
  rotateRemoteServerApiKey(): string
}

export interface OperatorApiKeyActionServiceOptions<TConfig extends OperatorApiKeyActionConfigLike = OperatorApiKeyActionConfigLike> {
  config: OperatorApiKeyActionConfigStore<TConfig>
  generateApiKey(): string
}

export function createOperatorApiKeyActionService<TConfig extends OperatorApiKeyActionConfigLike>(
  options: OperatorApiKeyActionServiceOptions<TConfig>,
): OperatorApiKeyActionService {
  return {
    rotateRemoteServerApiKey: () => {
      const cfg = options.config.get()
      const apiKey = options.generateApiKey()
      const nextConfig = { ...cfg, remoteServerApiKey: apiKey } as TConfig
      options.config.save(nextConfig)
      return apiKey
    },
  }
}

export interface OperatorApiKeyActionOptions {
  service: OperatorApiKeyActionService
  diagnostics: OperatorApiKeyActionDiagnostics
}

export interface OperatorApiKeyRouteActions {
  rotateOperatorRemoteServerApiKey(): OperatorApiKeyActionResult
}

export type OperatorUpdaterActionResult = {
  statusCode: number
  body: unknown
  auditContext?: OperatorActionAuditContext
}

export interface OperatorUpdaterActionService {
  getUpdateInfo(): OperatorUpdateInfoLike
  checkForUpdatesAndDownload(): Promise<{ updateInfo: OperatorUpdateInfoLike }>
  downloadLatestReleaseAsset(): Promise<OperatorUpdaterDownloadLatestResultLike>
  revealDownloadedReleaseAsset(): Promise<OperatorDownloadedReleaseAssetLike>
  openDownloadedReleaseAsset(): Promise<OperatorDownloadedReleaseAssetLike>
  openManualReleasesPage(): Promise<{ url: string }>
}

export interface OperatorUpdaterActionServiceOptions {
  getUpdateInfo(): OperatorUpdateInfoLike
  checkForUpdatesAndDownload(): Promise<{ updateInfo: OperatorUpdateInfoLike }>
  downloadLatestReleaseAsset(): Promise<OperatorUpdaterDownloadLatestResultLike>
  revealDownloadedReleaseAsset(): Promise<OperatorDownloadedReleaseAssetLike>
  openDownloadedReleaseAsset(): Promise<OperatorDownloadedReleaseAssetLike>
  openManualReleasesPage(): Promise<{ url: string }>
}

export function createOperatorUpdaterActionService(
  options: OperatorUpdaterActionServiceOptions,
): OperatorUpdaterActionService {
  return {
    getUpdateInfo: () => options.getUpdateInfo(),
    checkForUpdatesAndDownload: () => options.checkForUpdatesAndDownload(),
    downloadLatestReleaseAsset: () => options.downloadLatestReleaseAsset(),
    revealDownloadedReleaseAsset: () => options.revealDownloadedReleaseAsset(),
    openDownloadedReleaseAsset: () => options.openDownloadedReleaseAsset(),
    openManualReleasesPage: () => options.openManualReleasesPage(),
  }
}

export interface OperatorUpdaterActionOptions {
  service: OperatorUpdaterActionService
}

export interface OperatorUpdaterRouteActions {
  getOperatorUpdater(currentVersion: string): OperatorUpdaterActionResult
  checkOperatorUpdater(): Promise<OperatorUpdaterActionResult>
  downloadLatestOperatorUpdateAsset(): Promise<OperatorUpdaterActionResult>
  revealOperatorUpdateAsset(): Promise<OperatorUpdaterActionResult>
  openOperatorUpdateAsset(): Promise<OperatorUpdaterActionResult>
  openOperatorReleasesPage(): Promise<OperatorUpdaterActionResult>
}

export type OperatorTunnelActionResult = {
  statusCode: number
  body: unknown
  auditContext?: OperatorActionAuditContext
}

export interface OperatorTunnelActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
}

export interface OperatorTunnelActionService {
  getConfig(): OperatorTunnelSetupConfigLike
  getStatus(): OperatorTunnelStatusLike
  checkCloudflaredInstalled(): Promise<boolean>
  checkCloudflaredLoggedIn(): Promise<boolean>
  listCloudflareTunnels(): Promise<OperatorTunnelSetupListResultLike>
  startQuickTunnel(): Promise<OperatorActionResultLike & { url?: string }>
  startNamedTunnel(options: {
    tunnelId: string
    hostname: string
    credentialsPath?: string
  }): Promise<OperatorActionResultLike & { url?: string }>
  stopTunnel(): Promise<void>
}

export interface OperatorTunnelActionServiceOptions {
  getConfig(): OperatorTunnelSetupConfigLike
  getStatus(): OperatorTunnelStatusLike
  checkCloudflaredInstalled(): Promise<boolean>
  checkCloudflaredLoggedIn(): Promise<boolean>
  listCloudflareTunnels(): Promise<OperatorTunnelSetupListResultLike>
  startCloudflareTunnel(): Promise<OperatorActionResultLike & { url?: string }>
  startNamedCloudflareTunnel(options: {
    tunnelId: string
    hostname: string
    credentialsPath?: string
  }): Promise<OperatorActionResultLike & { url?: string }>
  stopCloudflareTunnel(): Promise<void>
}

export function createOperatorTunnelActionService(
  options: OperatorTunnelActionServiceOptions,
): OperatorTunnelActionService {
  return {
    getConfig: () => options.getConfig(),
    getStatus: () => options.getStatus(),
    checkCloudflaredInstalled: () => options.checkCloudflaredInstalled(),
    checkCloudflaredLoggedIn: () => options.checkCloudflaredLoggedIn(),
    listCloudflareTunnels: () => options.listCloudflareTunnels(),
    startQuickTunnel: () => options.startCloudflareTunnel(),
    startNamedTunnel: (tunnelOptions) => options.startNamedCloudflareTunnel(tunnelOptions),
    stopTunnel: () => options.stopCloudflareTunnel(),
  }
}

export interface OperatorTunnelActionOptions {
  diagnostics: OperatorTunnelActionDiagnostics
  service: OperatorTunnelActionService
}

export interface OperatorTunnelRouteActions {
  getOperatorTunnel(): OperatorTunnelActionResult
  getOperatorTunnelSetup(): Promise<OperatorTunnelActionResult>
  startOperatorTunnel(remoteServerRunning: boolean): Promise<OperatorTunnelActionResult>
  stopOperatorTunnel(): Promise<OperatorTunnelActionResult>
}

export type OperatorObservabilityActionResult = {
  statusCode: number
  body: unknown
}

export interface OperatorObservabilityActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
}

export interface OperatorObservabilityActionService {
  getCurrentVersion(): string
  getRecentErrors(count: number): OperatorRecentErrorLike[]
  performHealthCheck(): Promise<OperatorHealthLike>
  getTunnelStatus(): OperatorTunnelStatusLike
  getIntegrationsSummary(): Promise<OperatorIntegrationsSummary>
  getUpdateInfo(): OperatorUpdateInfoLike
  getSystemMetrics(): OperatorSystemMetricsLike
  getActiveSessions(): OperatorSessionSummaryLike[]
  getRecentSessions(count: number): OperatorSessionSummaryLike[]
  getConversationHistory(): Promise<OperatorConversationHistoryLike[]>
}

export interface OperatorObservabilityDiagnosticsServiceAdapter {
  getRecentErrors(count: number): OperatorRecentErrorLike[]
  performHealthCheck(): Promise<OperatorHealthLike>
}

export interface OperatorObservabilitySessionServiceAdapter {
  getActiveSessions(): OperatorSessionSummaryLike[]
  getRecentSessions(count: number): OperatorSessionSummaryLike[]
}

export interface OperatorObservabilityConversationServiceAdapter {
  getConversationHistory(): Promise<OperatorConversationHistoryLike[]>
}

export interface OperatorObservabilityActionServiceOptions {
  getCurrentVersion(): string
  diagnostics: OperatorObservabilityDiagnosticsServiceAdapter
  getTunnelStatus(): OperatorTunnelStatusLike
  getIntegrationsSummary(): Promise<OperatorIntegrationsSummary>
  getUpdateInfo(): OperatorUpdateInfoLike
  getSystemMetrics(): OperatorSystemMetricsLike
  sessions: OperatorObservabilitySessionServiceAdapter
  conversations: OperatorObservabilityConversationServiceAdapter
}

export function createOperatorObservabilityActionService(
  options: OperatorObservabilityActionServiceOptions,
): OperatorObservabilityActionService {
  return {
    getCurrentVersion: () => options.getCurrentVersion(),
    getRecentErrors: (count) => options.diagnostics.getRecentErrors(count),
    performHealthCheck: () => options.diagnostics.performHealthCheck(),
    getTunnelStatus: () => options.getTunnelStatus(),
    getIntegrationsSummary: () => options.getIntegrationsSummary(),
    getUpdateInfo: () => options.getUpdateInfo(),
    getSystemMetrics: () => options.getSystemMetrics(),
    getActiveSessions: () => options.sessions.getActiveSessions(),
    getRecentSessions: (count) => options.sessions.getRecentSessions(count),
    getConversationHistory: () => options.conversations.getConversationHistory(),
  }
}

export interface OperatorObservabilityActionOptions {
  manualReleasesUrl: string
  diagnostics: OperatorObservabilityActionDiagnostics
  service: OperatorObservabilityActionService
}

export interface OperatorObservabilityRouteActions {
  getOperatorStatus(remoteServerStatus: OperatorRemoteServerStatusLike): Promise<OperatorObservabilityActionResult>
  getOperatorHealth(): Promise<OperatorObservabilityActionResult>
  getOperatorErrors(count: string | number | undefined): OperatorObservabilityActionResult
  getOperatorLogs(count: string | number | undefined, level: string | undefined): OperatorObservabilityActionResult
  getOperatorConversations(count: string | number | undefined): Promise<OperatorObservabilityActionResult>
  getOperatorRemoteServer(remoteServerStatus: OperatorRemoteServerStatusLike): OperatorObservabilityActionResult
}

export type OperatorIntegrationActionResult = {
  statusCode: number
  body: unknown
  auditContext?: OperatorActionAuditContext
}

export type OperatorWhatsAppActionToolName = "whatsapp_connect" | "whatsapp_logout"

export type OperatorWhatsAppActionToolResultLike = OperatorMcpToolResultLike & {
  isError?: boolean
}

export interface OperatorIntegrationActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
  getErrorMessage(error: unknown): string
}

export interface OperatorIntegrationActionService {
  getIntegrationsSummary(): Promise<OperatorIntegrationsSummary>
  getDiscordStatus(): OperatorDiscordStatusLike
  getDiscordLogs(): OperatorDiscordLogLike[]
  startDiscord(): Promise<OperatorActionResultLike>
  stopDiscord(): Promise<OperatorActionResultLike>
  clearDiscordLogs(): void
  getWhatsAppSummary(): Promise<OperatorWhatsAppIntegrationSummary>
  isWhatsAppServerConnected(): boolean
  executeWhatsAppTool(toolName: OperatorWhatsAppActionToolName): Promise<OperatorWhatsAppActionToolResultLike>
}

export interface OperatorDiscordIntegrationServiceAdapter {
  getStatus(): OperatorDiscordStatusLike
  getLogs(): OperatorDiscordLogLike[]
  start(): Promise<OperatorActionResultLike>
  stop(): Promise<OperatorActionResultLike>
  clearLogs(): void
}

export interface OperatorIntegrationMcpToolCall {
  name: OperatorWhatsAppActionToolName
  arguments: Record<string, unknown>
}

export interface OperatorWhatsAppMcpServiceAdapter {
  getServerStatus(): Record<string, { connected?: boolean } | undefined>
  executeToolCall(
    toolCall: OperatorIntegrationMcpToolCall,
    sessionId?: string,
    allowBackground?: boolean,
  ): Promise<OperatorWhatsAppActionToolResultLike>
}

export interface OperatorIntegrationActionServiceOptions {
  getIntegrationsSummary(): Promise<OperatorIntegrationsSummary>
  discord: OperatorDiscordIntegrationServiceAdapter
  getWhatsAppSummary(): Promise<OperatorWhatsAppIntegrationSummary>
  whatsapp: {
    serverName: string
    mcp: OperatorWhatsAppMcpServiceAdapter
  }
}

export function createOperatorIntegrationActionService(
  options: OperatorIntegrationActionServiceOptions,
): OperatorIntegrationActionService {
  return {
    getIntegrationsSummary: () => options.getIntegrationsSummary(),
    getDiscordStatus: () => options.discord.getStatus(),
    getDiscordLogs: () => options.discord.getLogs(),
    startDiscord: () => options.discord.start(),
    stopDiscord: () => options.discord.stop(),
    clearDiscordLogs: () => options.discord.clearLogs(),
    getWhatsAppSummary: () => options.getWhatsAppSummary(),
    isWhatsAppServerConnected: () =>
      !!options.whatsapp.mcp.getServerStatus()[options.whatsapp.serverName]?.connected,
    executeWhatsAppTool: (toolName) => options.whatsapp.mcp.executeToolCall(
      { name: toolName, arguments: {} },
      undefined,
      true,
    ),
  }
}

export interface OperatorIntegrationActionOptions {
  diagnostics: OperatorIntegrationActionDiagnostics
  service: OperatorIntegrationActionService
}

export interface OperatorIntegrationRouteActions {
  getOperatorIntegrations(): Promise<OperatorIntegrationActionResult>
  getOperatorDiscord(): OperatorIntegrationActionResult
  getOperatorDiscordLogs(count: string | number | undefined): OperatorIntegrationActionResult
  connectOperatorDiscord(): Promise<OperatorIntegrationActionResult>
  disconnectOperatorDiscord(): Promise<OperatorIntegrationActionResult>
  clearOperatorDiscordLogs(): OperatorIntegrationActionResult
  getOperatorWhatsApp(): Promise<OperatorIntegrationActionResult>
  connectOperatorWhatsApp(): Promise<OperatorIntegrationActionResult>
  logoutOperatorWhatsApp(): Promise<OperatorIntegrationActionResult>
}

export type OperatorAgentActionResult = {
  statusCode: number
  body: unknown
  auditContext?: OperatorActionAuditContext
}

export interface OperatorAgentActionDiagnostics {
  logInfo(source: string, message: string): void
  logError(source: string, message: string, error: unknown): void
  getErrorMessage(error: unknown): string
}

export interface OperatorAgentActionService {
  stopAgentSessionById(sessionId: string): Promise<{
    sessionId: string
    conversationId?: string
  }>
}

export interface OperatorAgentActionServiceOptions {
  stopAgentSessionById(sessionId: string): Promise<{
    sessionId: string
    conversationId?: string
  }>
}

export function createOperatorAgentActionService(
  options: OperatorAgentActionServiceOptions,
): OperatorAgentActionService {
  return {
    stopAgentSessionById: (sessionId) => options.stopAgentSessionById(sessionId),
  }
}

export interface OperatorAgentActionOptions {
  diagnostics: OperatorAgentActionDiagnostics
  service: OperatorAgentActionService
}

export interface OperatorAgentRouteActions {
  runOperatorAgent(body: unknown, runAgent: AgentRunExecutor): Promise<OperatorAgentActionResult>
  stopOperatorAgentSession(sessionIdParam: string | undefined): Promise<OperatorAgentActionResult>
}

export type RunAgentResultLike = AgentRunResult

export type OperatorHealthLike = Pick<OperatorHealthSnapshot, "overall" | "checks">

export type OperatorRemoteServerStatusLike = {
  running: boolean
  bind: string
  port: number
  url?: string | null
  connectableUrl?: string | null
  lastError?: string | null
}

export type OperatorTunnelStatusLike = {
  running: boolean
  starting: boolean
  mode: "quick" | "named" | null
  url?: string | null
  error?: string | null
}

export type OperatorTunnelSetupConfigLike = Pick<
  CloudflareTunnelConfig,
  | "cloudflareTunnelMode"
  | "cloudflareTunnelAutoStart"
  | "cloudflareTunnelId"
  | "cloudflareTunnelHostname"
  | "cloudflareTunnelCredentialsPath"
>

export type OperatorTunnelSetupTunnelLike = {
  id: string
  name: string
  created_at?: string
  createdAt?: string
}

export type OperatorTunnelSetupListResultLike = {
  success: boolean
  tunnels?: OperatorTunnelSetupTunnelLike[]
  error?: string
}

export type OperatorTunnelStartPlan =
  | { ok: true; mode: "quick" }
  | {
    ok: true
    mode: "named"
    tunnelId: string
    hostname: string
    credentialsPath?: string
  }
  | {
    ok: false
    mode: "named"
    error: string
  }

export type OperatorRecentErrorLike = {
  timestamp: number
  level: "error" | "warning" | "info"
  component: string
  message: string
}

export type OperatorConversationHistoryLike = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  preview: string
}

export type OperatorDiscordLogLike = {
  id: string
  level: string
  message: string
  timestamp: number
}

export type OperatorDiscordStatusLike = {
  available: boolean
  enabled: boolean
  connected: boolean
  connecting: boolean
  tokenConfigured?: boolean
  defaultProfileId?: string
  defaultProfileName?: string
  botUsername?: string
  lastError?: string
  lastEventAt?: number
}

export type OperatorActionResultLike = {
  success: boolean
  error?: string
}

export type OperatorMcpTestResultLike = OperatorActionResultLike & {
  toolCount?: number
}

export type OperatorTunnelStartResultLike = OperatorActionResultLike & {
  mode: "quick" | "named"
  url?: string
}

export type OperatorLogSummaryEntryLike = {
  timestamp: number
  level?: string
}

export type OperatorPushTokenLike = {
  platform: string
}

export type OperatorUpdateInfoLike = {
  currentVersion?: string
  updateAvailable?: boolean
  latestRelease?: {
    tagName?: string
    name?: string
    publishedAt?: string
    url?: string
    assets?: unknown[]
  }
  preferredAsset?: {
    name?: string
    downloadUrl?: string
  }
  lastCheckedAt?: number
  error?: string
  lastDownloadedAsset?: {
    name?: string
    downloadedAt?: number
  }
} | null

export type OperatorDownloadedReleaseAssetLike = {
  name: string
  filePath: string
  downloadedAt?: number
}

export type OperatorUpdaterDownloadLatestResultLike = {
  downloadedAsset: OperatorDownloadedReleaseAssetLike
  updateInfo?: OperatorUpdateInfoLike
}

export type OperatorSystemMetricsLike = {
  platform: string
  arch: string
  nodeVersion: string
  electronVersion?: string
  appVersion?: string
  osUptimeSeconds: number
  processUptimeSeconds: number
  memoryUsageBytes: {
    heapUsed: number
    heapTotal: number
    rss: number
  }
  cpuCount: number
  totalMemoryBytes: number
  freeMemoryBytes: number
  hostname: string
}

export interface OperatorSystemMetricsCollectorAdapter {
  getPlatform(): string
  getArch(): string
  getNodeVersion(): string
  getElectronVersion(): string | undefined
  getAppVersion(): string | undefined
  getOsUptimeSeconds(): number
  getProcessUptimeSeconds(): number
  getMemoryUsageBytes(): OperatorSystemMetricsLike["memoryUsageBytes"]
  getCpuCount(): number
  getTotalMemoryBytes(): number
  getFreeMemoryBytes(): number
  getHostname(): string
}

export function createOperatorSystemMetricsCollector(
  adapter: OperatorSystemMetricsCollectorAdapter,
): () => OperatorSystemMetricsLike {
  return () => ({
    platform: adapter.getPlatform(),
    arch: adapter.getArch(),
    nodeVersion: adapter.getNodeVersion(),
    electronVersion: adapter.getElectronVersion(),
    appVersion: adapter.getAppVersion(),
    osUptimeSeconds: adapter.getOsUptimeSeconds(),
    processUptimeSeconds: adapter.getProcessUptimeSeconds(),
    memoryUsageBytes: adapter.getMemoryUsageBytes(),
    cpuCount: adapter.getCpuCount(),
    totalMemoryBytes: adapter.getTotalMemoryBytes(),
    freeMemoryBytes: adapter.getFreeMemoryBytes(),
    hostname: adapter.getHostname(),
  })
}

export type OperatorSessionSummaryLike = {
  id: string
  conversationTitle?: string
  status: string
  startTime: number
  currentIteration?: number
  maxIterations?: number
}

export type OperatorWhatsAppActionResponseOptions = {
  action: string
  text?: string
  successMessage: string
}

export type OperatorAuditHeadersLike = Record<string, string | string[] | undefined>

export type OperatorAuditRequestLike = {
  url: string
  ip?: string
  headers: OperatorAuditHeadersLike
}

export type RemoteServerAuthRequestLike = OperatorAuditRequestLike & {
  method: string
}

export type RemoteServerAuthDecision =
  | { ok: true; skipAuth?: boolean }
  | {
    ok: false
    statusCode: 401 | 403
    error: string
    auditFailureReason?: string
  }

export type OperatorAuditLogAppendResult = {
  entries: OperatorAuditEntry[]
  shouldRewrite: boolean
}

export type OperatorAuditEventOptions = {
  action: string
  path?: string
  success: boolean
  details?: Record<string, unknown>
  failureReason?: string
}

export interface OperatorAuditRecorderOptions {
  appendEntry(entry: OperatorAuditEntry): void
}

export interface OperatorAuditRecorder {
  recordRejectedDeviceAttempt(request: OperatorAuditRequestLike, failureReason: string): void
  recordAuditEvent(request: OperatorAuditRequestLike, options: OperatorAuditEventOptions): void
  recordResponseAuditEvent(
    request: RemoteServerAuthRequestLike,
    response: OperatorHttpResponseLike,
    context?: OperatorResponseAuditContext,
  ): void
}

export type OperatorMcpToolResultLike = {
  content?: Array<{
    type?: string
    text?: unknown
  }>
}

export type OperatorWhatsAppIntegrationSummaryOptions = {
  enabled: boolean
  serverConfigured: boolean
  serverConnected: boolean
  autoReplyEnabled: boolean
  logMessagesEnabled: boolean
  allowedSenderCount: number
  lastError?: string
  logs: OperatorLogSummaryEntryLike[]
}

export type OperatorWhatsAppIntegrationConfigLike = {
  whatsappEnabled?: boolean
  whatsappAutoReply?: boolean
  whatsappLogMessages?: boolean
  whatsappAllowFrom?: unknown[]
  mcpConfig?: {
    mcpServers?: Record<string, unknown>
  }
}

export type OperatorWhatsAppServerStatusLike = {
  connected?: boolean
  error?: string
}

export interface OperatorWhatsAppIntegrationSummaryActionDiagnostics {
  logWarning(source: string, message: string): void
  getErrorMessage(error: unknown): string
}

export interface OperatorWhatsAppIntegrationSummaryActionService {
  getConfig(): OperatorWhatsAppIntegrationConfigLike
  getServerStatus(): Record<string, OperatorWhatsAppServerStatusLike | undefined>
  getServerLogs(serverName: string): OperatorLogSummaryEntryLike[]
  executeStatusTool(): Promise<OperatorWhatsAppActionToolResultLike>
}

export interface OperatorWhatsAppIntegrationSummaryActionOptions {
  serverName: string
  diagnostics: OperatorWhatsAppIntegrationSummaryActionDiagnostics
  service: OperatorWhatsAppIntegrationSummaryActionService
}

export interface OperatorIntegrationsSummaryActionService {
  getDiscordStatus(): OperatorDiscordStatusLike
  getDiscordLogs(): OperatorLogSummaryEntryLike[]
  getWhatsAppSummary(): Promise<OperatorWhatsAppIntegrationSummary>
  getPushNotificationTokens(): OperatorPushTokenLike[]
}

export interface OperatorIntegrationsSummaryActionOptions {
  service: OperatorIntegrationsSummaryActionService
}

export type OperatorUpdaterStatusOptions = {
  currentVersion?: string
  updateInfo?: OperatorUpdateInfoLike
  manualReleasesUrl?: string
}

export type OperatorRuntimeStatusOptions = {
  timestamp?: number
  remoteServer: OperatorRemoteServerStatusLike
  health: OperatorHealthLike
  tunnel: OperatorTunnelStatusLike
  integrations: OperatorIntegrationsSummary
  updater: OperatorUpdaterStatusOptions
  system: OperatorSystemMetricsLike
  activeSessions: OperatorSessionSummaryLike[]
  recentSessions: OperatorSessionSummaryLike[]
  recentErrors: OperatorRecentErrorLike[]
  recentErrorWindowMs?: number
}

export const SENSITIVE_OPERATOR_SETTINGS_KEYS = [
  "remoteServerEnabled",
  "remoteServerPort",
  "remoteServerBindAddress",
  "remoteServerApiKey",
  "remoteServerLogLevel",
  "remoteServerCorsOrigins",
  "remoteServerOperatorAllowDeviceIds",
  "remoteServerAutoShowPanel",
  "remoteServerTerminalQrEnabled",
  "cloudflareTunnelMode",
  "cloudflareTunnelAutoStart",
  "cloudflareTunnelId",
  "cloudflareTunnelName",
  "cloudflareTunnelCredentialsPath",
  "cloudflareTunnelHostname",
  "openaiApiKey",
  "groqApiKey",
  "geminiApiKey",
  "whatsappEnabled",
  "whatsappAllowFrom",
  "whatsappOperatorAllowFrom",
  "whatsappAutoReply",
  "whatsappLogMessages",
  "discordEnabled",
  "discordBotToken",
  "discordDmEnabled",
  "discordRequireMention",
  "discordAllowUserIds",
  "discordAllowGuildIds",
  "discordAllowChannelIds",
  "discordAllowRoleIds",
  "discordDmAllowUserIds",
  "discordOperatorAllowUserIds",
  "discordOperatorAllowGuildIds",
  "discordOperatorAllowChannelIds",
  "discordOperatorAllowRoleIds",
  "discordDefaultProfileId",
  "discordLogMessages",
  "langfuseEnabled",
  "langfusePublicKey",
  "langfuseSecretKey",
  "langfuseBaseUrl",
] as const

export const OPERATOR_AUDIT_DEVICE_HEADER_KEYS = ["x-device-id", "x-dotagents-device-id"] as const

const SENSITIVE_OPERATOR_SETTINGS_KEY_SET = new Set<string>(SENSITIVE_OPERATOR_SETTINGS_KEYS)
const PROTECTED_OPERATOR_ACCESS_PATHS = new Set<string>([
  getRemoteServerApiRoutePath(REMOTE_SERVER_API_PATHS.settings),
  getRemoteServerApiRoutePath(REMOTE_SERVER_API_PATHS.emergencyStop),
])

function getRequestRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {}
}

export function isSensitiveOperatorSettingsKey(key: string): boolean {
  return SENSITIVE_OPERATOR_SETTINGS_KEY_SET.has(key)
}

export function getSensitiveOperatorSettingsKeys(input: object): string[] {
  return Object.keys(input).filter((key) => isSensitiveOperatorSettingsKey(key))
}

export function sanitizeOperatorAuditText(value: string | undefined, maxLength: number = 160): string | undefined {
  if (!value) {
    return undefined
  }

  const sanitized = value.replace(/\s+/g, " ").trim()
  if (!sanitized) {
    return undefined
  }

  return sanitized.length > maxLength ? sanitized.slice(0, maxLength) : sanitized
}

function sanitizeOperatorAuditValue(value: unknown, depth: number = 0): unknown {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return value
  }

  if (typeof value === "string") {
    return sanitizeOperatorAuditText(value)
  }

  if (Array.isArray(value)) {
    const sanitizedItems = value
      .slice(0, 20)
      .map((entry) => sanitizeOperatorAuditValue(entry, depth + 1))
      .filter((entry) => entry !== undefined)

    return sanitizedItems.length > 0 ? sanitizedItems : undefined
  }

  if (typeof value === "object" && depth < 2) {
    const sanitized: Record<string, unknown> = {}

    for (const [key, entry] of Object.entries(value)) {
      if (/(token|secret|api.?key|password|credential)/i.test(key)) {
        continue
      }

      const sanitizedEntry = sanitizeOperatorAuditValue(entry, depth + 1)
      if (sanitizedEntry !== undefined) {
        sanitized[key] = sanitizedEntry
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined
  }

  return undefined
}

export function sanitizeOperatorAuditDetails(details: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  const sanitized = sanitizeOperatorAuditValue(details)
  return sanitized && typeof sanitized === "object" && !Array.isArray(sanitized)
    ? sanitized as Record<string, unknown>
    : undefined
}

export function getOperatorRequestHeaderValue(
  headers: OperatorAuditHeadersLike,
  headerName: string,
  maxLength: number = 160,
): string | undefined {
  const rawValue = headers[headerName]
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue
  return typeof value === "string" ? sanitizeOperatorAuditText(value, maxLength) : undefined
}

export function getOperatorAuditPath(request: Pick<OperatorAuditRequestLike, "url">): string {
  return request.url.split("?")[0] || "/"
}

export function getOperatorAuditDeviceId(
  request: Pick<OperatorAuditRequestLike, "headers">,
): string | undefined {
  for (const headerName of OPERATOR_AUDIT_DEVICE_HEADER_KEYS) {
    const value = getOperatorRequestHeaderValue(request.headers, headerName, 80)
    if (value) {
      return value
    }
  }

  return undefined
}

export function getOperatorAuditSource(
  request: Pick<OperatorAuditRequestLike, "headers"> & { ip?: string },
): OperatorAuditEntry["source"] | undefined {
  const ip = sanitizeOperatorAuditText(request.ip, 80)
  const origin = getOperatorRequestHeaderValue(request.headers, "origin")
  const userAgent = getOperatorRequestHeaderValue(request.headers, "user-agent", 160)

  const source = {
    ...(ip ? { ip } : {}),
    ...(origin ? { origin } : {}),
    ...(userAgent ? { userAgent } : {}),
  }

  return Object.keys(source).length > 0 ? source : undefined
}

export function isOperatorAuditEntry(value: unknown): value is OperatorAuditEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false

  const entry = value as Record<string, unknown>
  return typeof entry.timestamp === "number"
    && typeof entry.action === "string"
    && typeof entry.path === "string"
    && typeof entry.success === "boolean"
}

export function parseOperatorAuditLogEntries(
  raw: string,
  limit: number = 200,
): OperatorAuditEntry[] {
  if (!raw.trim()) {
    return []
  }

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as unknown
      } catch {
        return null
      }
    })
    .filter((entry): entry is OperatorAuditEntry => isOperatorAuditEntry(entry))
    .slice(-limit)
}

export function serializeOperatorAuditLogEntries(entries: OperatorAuditEntry[]): string {
  const payload = entries.map((entry) => JSON.stringify(entry)).join("\n")
  return payload ? `${payload}\n` : ""
}

export function appendOperatorAuditLogEntry(
  entries: OperatorAuditEntry[],
  entry: OperatorAuditEntry,
  limit: number = 200,
): OperatorAuditLogAppendResult {
  const nextEntries = [...entries, entry]
  const shouldRewrite = nextEntries.length > limit

  return {
    entries: shouldRewrite ? nextEntries.slice(-limit) : nextEntries,
    shouldRewrite,
  }
}

export function isLoopbackOperatorAccessIp(ip: string | undefined): boolean {
  if (!ip) return false
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1"
}

export function isProtectedOperatorAccessPath(pathname: string): boolean {
  return PROTECTED_OPERATOR_ACCESS_PATHS.has(pathname) || isRemoteServerOperatorApiPath(pathname)
}

export function getRemoteServerBearerToken(headers: OperatorAuditHeadersLike): string {
  const rawAuth = headers.authorization
  const auth = Array.isArray(rawAuth) ? rawAuth[0] ?? "" : rawAuth ?? ""
  return auth.startsWith("Bearer ") ? auth.slice(7) : ""
}

export function authorizeRemoteServerRequest(
  request: RemoteServerAuthRequestLike,
  options: {
    currentApiKey?: string
    trustedDeviceIds?: readonly unknown[]
  },
): RemoteServerAuthDecision {
  if (request.method === "OPTIONS") {
    return { ok: true, skipAuth: true }
  }

  const token = getRemoteServerBearerToken(request.headers)
  if (!token || !options.currentApiKey || token !== options.currentApiKey) {
    return {
      ok: false,
      statusCode: 401,
      error: "Unauthorized",
    }
  }

  const pathname = getOperatorAuditPath(request)
  const trustedDeviceIds = sanitizeConfigStringList(options.trustedDeviceIds ?? [])
  if (
    trustedDeviceIds.length === 0
    || !isProtectedOperatorAccessPath(pathname)
    || isLoopbackOperatorAccessIp(request.ip)
  ) {
    return { ok: true }
  }

  const deviceId = getOperatorAuditDeviceId(request)
  if (!deviceId) {
    return {
      ok: false,
      statusCode: 403,
      error: "Trusted device ID required for operator access",
      auditFailureReason: "Missing trusted device ID",
    }
  }

  if (!trustedDeviceIds.includes(deviceId)) {
    return {
      ok: false,
      statusCode: 403,
      error: "Device not allowed for operator access",
      auditFailureReason: "Device is not allowed for operator access",
    }
  }

  return { ok: true }
}

export function buildRejectedOperatorDeviceAuditEntry(
  options: {
    timestamp?: number
    path: string
    deviceId?: string
    source?: OperatorAuditEntry["source"]
    failureReason: string
  },
): OperatorAuditEntry {
  return {
    timestamp: options.timestamp ?? Date.now(),
    action: "device-access-denied",
    path: options.path,
    success: false,
    ...(options.deviceId ? { deviceId: sanitizeOperatorAuditText(options.deviceId, 80) } : {}),
    ...(options.source ? { source: options.source } : {}),
    failureReason: sanitizeOperatorAuditText(options.failureReason, 120),
  }
}

export function buildOperatorAuditEventEntry(
  options: {
    timestamp?: number
    action: string
    path: string
    success: boolean
    deviceId?: string
    source?: OperatorAuditEntry["source"]
    details?: Record<string, unknown>
    failureReason?: string
  },
): OperatorAuditEntry {
  const details = sanitizeOperatorAuditDetails(options.details)

  return {
    timestamp: options.timestamp ?? Date.now(),
    action: options.action,
    path: options.path,
    success: options.success,
    ...(options.deviceId ? { deviceId: sanitizeOperatorAuditText(options.deviceId, 80) } : {}),
    ...(options.source ? { source: options.source } : {}),
    ...(details ? { details } : {}),
    ...(options.failureReason ? { failureReason: sanitizeOperatorAuditText(options.failureReason, 120) } : {}),
  }
}

export function parseOperatorJsonRecord(value: string | undefined): Record<string, unknown> | undefined {
  if (!value) {
    return undefined
  }

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined
  } catch {
    return undefined
  }
}

export function clampOperatorCount(value: unknown, fallback: number, max: number): number {
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string"
      ? Number.parseInt(value, 10)
      : Number.NaN

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.max(1, Math.min(Math.trunc(parsed), max))
}

export function normalizeOperatorLogLevel(value: unknown): "error" | "warning" | "info" | undefined {
  return value === "error" || value === "warning" || value === "info" ? value : undefined
}

export function parseOperatorRunAgentRequestBody(body: unknown): OperatorActionParseResult<OperatorRunAgentRequest> {
  const requestBody = getRequestRecord(body)
  const prompt = typeof requestBody.prompt === "string" ? requestBody.prompt.trim() : ""
  if (!prompt) {
    return { ok: false, statusCode: 400, error: "Missing prompt" }
  }

  return {
    ok: true,
    request: {
      prompt,
      conversationId: typeof requestBody.conversationId === "string" ? requestBody.conversationId : undefined,
      profileId: typeof requestBody.profileId === "string" ? requestBody.profileId : undefined,
    },
  }
}

export function buildOperatorRunAgentResponse(result: RunAgentResultLike): OperatorRunAgentResponse {
  return {
    success: true,
    action: "run-agent",
    conversationId: result.conversationId,
    content: result.content,
    messageCount: result.conversationHistory.length,
  }
}

export function parseOperatorMcpServerActionRequestBody(body: unknown): OperatorActionParseResult<OperatorMcpServerActionRequest> {
  const requestBody = getRequestRecord(body)
  const server = typeof requestBody.server === "string" ? requestBody.server.trim() : ""
  if (!server) {
    return { ok: false, statusCode: 400, error: "Missing server name" }
  }

  return { ok: true, request: { server } }
}

export function parseOperatorMcpRestartRequestBody(body: unknown): OperatorActionParseResult<OperatorMcpRestartRequest> {
  return parseOperatorMcpServerActionRequestBody(body)
}

export function buildOperatorMcpStartResponse(server: string): { success: true; action: "mcp-start"; server: string; message: string } {
  return { success: true, action: "mcp-start", server, message: `Started ${server}` }
}

export function buildOperatorMcpStopResponse(server: string): { success: true; action: "mcp-stop"; server: string; message: string } {
  return { success: true, action: "mcp-stop", server, message: `Stopped ${server}` }
}

export function buildOperatorMcpClearLogsResponse(server: string): OperatorActionResponse {
  return {
    success: true,
    action: "mcp-clear-logs",
    message: `Cleared logs for ${server}`,
    details: { server },
  }
}

export function buildOperatorMcpTestResponse(server: string, result: OperatorMcpTestResultLike): OperatorMCPServerTestResponse {
  return {
    success: result.success,
    action: "mcp-test",
    server,
    message: result.success ? `Connection test successful for ${server}` : result.error || "Connection test failed",
    ...(result.error ? { error: result.error } : {}),
    ...(typeof result.toolCount === "number" ? { toolCount: result.toolCount } : {}),
  }
}

export function buildOperatorMcpRestartResponse(server: string): { success: true; action: "mcp-restart"; server: string } {
  return { success: true, action: "mcp-restart", server }
}

export function buildOperatorMcpTestAuditContext(response: OperatorMCPServerTestResponse): OperatorActionAuditContext {
  return {
    action: "mcp-test",
    success: response.success,
    details: {
      server: response.server,
      ...(typeof response.toolCount === "number" ? { toolCount: response.toolCount } : {}),
    },
    ...(!response.success ? { failureReason: response.error || response.message } : {}),
  }
}

export function buildOperatorMcpClearLogsAuditContext(server: string): OperatorActionAuditContext {
  return {
    action: "mcp-clear-logs",
    success: true,
    details: { server },
  }
}

export function buildOperatorMcpStartAuditContext(server: string): OperatorActionAuditContext {
  return {
    action: "mcp-start",
    success: true,
    details: { server },
  }
}

export function buildOperatorMcpStopAuditContext(server: string): OperatorActionAuditContext {
  return {
    action: "mcp-stop",
    success: true,
    details: { server },
  }
}

export function buildOperatorMcpRestartAuditContext(server: string): OperatorActionAuditContext {
  return {
    action: "mcp-restart",
    success: true,
    details: { server },
  }
}

export function buildOperatorMcpTestFailureAuditContext(
  failureReason: string,
): OperatorActionAuditContext {
  return {
    action: "mcp-test",
    success: false,
    failureReason,
  }
}

export function buildOperatorMcpClearLogsFailureAuditContext(
  failureReason: string,
): OperatorActionAuditContext {
  return {
    action: "mcp-clear-logs",
    success: false,
    failureReason,
  }
}

export function buildOperatorMcpStartFailureAuditContext(
  failureReason: string,
): OperatorActionAuditContext {
  return {
    action: "mcp-start",
    success: false,
    failureReason,
  }
}

export function buildOperatorMcpStopFailureAuditContext(
  failureReason: string,
): OperatorActionAuditContext {
  return {
    action: "mcp-stop",
    success: false,
    failureReason,
  }
}

export function buildOperatorMcpRestartFailureAuditContext(
  failureReason: string,
): OperatorActionAuditContext {
  return {
    action: "mcp-restart",
    success: false,
    failureReason,
  }
}

export function buildOperatorActionAuditContext(
  response: Pick<OperatorActionResponse, "action" | "success" | "message" | "error" | "details">,
): OperatorActionAuditContext {
  return {
    action: response.action,
    success: response.success,
    ...(response.details ? { details: response.details } : {}),
    ...(!response.success ? { failureReason: response.error || response.message } : {}),
  }
}

export function buildOperatorHealthSnapshot(
  health: OperatorHealthLike,
  checkedAt: number = Date.now(),
): OperatorHealthSnapshot {
  return {
    checkedAt,
    overall: health.overall,
    checks: health.checks,
  }
}

export function buildOperatorRemoteServerStatus(
  status: OperatorRemoteServerStatusLike,
): OperatorRemoteServerStatus {
  return {
    running: status.running,
    bind: status.bind,
    port: status.port,
    ...(status.url ? { url: status.url } : {}),
    ...(status.connectableUrl ? { connectableUrl: status.connectableUrl } : {}),
    ...(status.lastError ? { lastError: status.lastError } : {}),
  }
}

export function buildOperatorTunnelStatus(
  status: OperatorTunnelStatusLike,
): OperatorTunnelStatus {
  return {
    running: status.running,
    starting: status.starting,
    mode: status.mode,
    ...(status.url ? { url: status.url } : {}),
    ...(status.error ? { error: status.error } : {}),
  }
}

export function buildOperatorTunnelSetupSummary(
  options: {
    config: OperatorTunnelSetupConfigLike
    installed: boolean
    loggedIn: boolean
    listResult?: OperatorTunnelSetupListResultLike
  },
): OperatorTunnelSetupSummary {
  const tunnels: OperatorTunnelSetupTunnel[] = options.listResult?.success
    ? (options.listResult.tunnels ?? []).map((tunnel) => ({
      id: tunnel.id,
      name: tunnel.name,
      ...(tunnel.created_at || tunnel.createdAt ? { createdAt: tunnel.created_at ?? tunnel.createdAt } : {}),
    }))
    : []

  return {
    installed: options.installed,
    loggedIn: options.loggedIn,
    mode: options.config.cloudflareTunnelMode ?? DEFAULT_CLOUDFLARE_TUNNEL_MODE,
    autoStart: !!options.config.cloudflareTunnelAutoStart,
    namedTunnelConfigured: !!options.config.cloudflareTunnelId && !!options.config.cloudflareTunnelHostname,
    ...(options.config.cloudflareTunnelId ? { configuredTunnelId: options.config.cloudflareTunnelId } : {}),
    ...(options.config.cloudflareTunnelHostname ? { configuredHostname: options.config.cloudflareTunnelHostname } : {}),
    credentialsPathConfigured: !!options.config.cloudflareTunnelCredentialsPath,
    tunnelCount: tunnels.length,
    tunnels,
    ...(!options.listResult?.success && options.listResult?.error ? { error: options.listResult.error } : {}),
  }
}

export function getConfiguredCloudflareTunnelStartPlan(
  config: OperatorTunnelSetupConfigLike,
): OperatorTunnelStartPlan {
  const mode = config.cloudflareTunnelMode ?? DEFAULT_CLOUDFLARE_TUNNEL_MODE

  if (mode !== "named") {
    return { ok: true, mode: "quick" }
  }

  const tunnelId = config.cloudflareTunnelId?.trim()
  const hostname = config.cloudflareTunnelHostname?.trim()

  if (!tunnelId || !hostname) {
    return {
      ok: false,
      mode,
      error: "Named tunnel requires cloudflareTunnelId and cloudflareTunnelHostname",
    }
  }

  return {
    ok: true,
    mode,
    tunnelId,
    hostname,
    ...(config.cloudflareTunnelCredentialsPath?.trim()
      ? { credentialsPath: config.cloudflareTunnelCredentialsPath.trim() }
      : {}),
  }
}

export function buildOperatorRecentErrorsResponse(
  entries: OperatorRecentErrorLike[],
): OperatorRecentErrorsResponse {
  const errors: OperatorRecentError[] = entries.map(({ timestamp, level, component, message }) => ({
    timestamp,
    level,
    component,
    message,
  }))

  return {
    count: errors.length,
    errors,
  }
}

export function buildOperatorRecentErrorSummary(
  entries: OperatorRecentErrorLike[],
  now: number = Date.now(),
  windowMs: number = 5 * 60 * 1000,
): OperatorRuntimeStatus["recentErrors"] {
  return {
    total: entries.length,
    errorsInLastFiveMinutes: entries.filter((entry) => now - entry.timestamp <= windowMs).length,
  }
}

export function buildOperatorLogsResponse(
  entries: OperatorRecentErrorLike[],
  level?: "error" | "warning" | "info",
): OperatorLogsResponse {
  const filtered = level ? entries.filter((entry) => entry.level === level) : entries

  return {
    count: filtered.length,
    level,
    logs: filtered.map(({ timestamp, level: entryLevel, component, message }) => ({
      timestamp,
      level: entryLevel,
      component,
      message,
    })),
  }
}

export function buildOperatorAuditResponse(
  entries: OperatorAuditEntry[],
  count: unknown = 20,
): OperatorAuditResponse {
  const limit = clampOperatorCount(count, 20, 100)
  const responseEntries = [...entries].slice(-limit).reverse()

  return {
    count: responseEntries.length,
    entries: responseEntries,
  }
}

function operatorAuditActionResult(statusCode: number, body: unknown): OperatorAuditActionResult {
  return {
    statusCode,
    body,
  }
}

export function getOperatorAuditAction(
  count: string | number | undefined,
  options: OperatorAuditActionOptions,
): OperatorAuditActionResult {
  try {
    return operatorAuditActionResult(200, buildOperatorAuditResponse(options.getEntries(), count))
  } catch (caughtError) {
    options.diagnostics.logError("operator-audit-actions", "Failed to build operator audit response", caughtError)
    return operatorAuditActionResult(500, { error: "Failed to build operator audit response" })
  }
}

export function createOperatorAuditRouteActions(
  options: OperatorAuditActionOptions,
): OperatorAuditRouteActions {
  return {
    getOperatorAudit: (count) => getOperatorAuditAction(count, options),
  }
}

export function buildOperatorAuditActionFromPath(pathname: string): string {
  const normalized = getRemoteServerOperatorApiActionPath(pathname)
  return normalized ? normalized.replace(/\//g, "-") : "operator-action"
}

export function buildOperatorResponseAuditContext(
  request: Pick<RemoteServerAuthRequestLike, "method" | "url">,
  response: OperatorHttpResponseLike,
  context: OperatorResponseAuditContext = {},
): OperatorActionAuditContext & { path: string } | undefined {
  if (request.method !== "POST") {
    return undefined
  }

  const path = getOperatorAuditPath(request)
  if (!isRemoteServerOperatorApiPath(path)) {
    return undefined
  }

  return {
    action: context.action ?? buildOperatorAuditActionFromPath(path),
    path,
    success: context.success ?? response.statusCode < 400,
    ...(context.details ? { details: context.details } : {}),
    failureReason: context.failureReason ?? (response.statusCode >= 400 ? `http-${response.statusCode}` : undefined),
  }
}

export function createOperatorAuditRecorder(
  options: OperatorAuditRecorderOptions,
): OperatorAuditRecorder {
  function recordAuditEvent(
    request: OperatorAuditRequestLike,
    event: OperatorAuditEventOptions,
  ): void {
    options.appendEntry(buildOperatorAuditEventEntry({
      action: event.action,
      path: event.path ?? getOperatorAuditPath(request),
      success: event.success,
      deviceId: getOperatorAuditDeviceId(request),
      source: getOperatorAuditSource(request),
      details: event.details,
      failureReason: event.failureReason,
    }))
  }

  return {
    recordRejectedDeviceAttempt: (request, failureReason) => {
      options.appendEntry(buildRejectedOperatorDeviceAuditEntry({
        path: getOperatorAuditPath(request),
        deviceId: getOperatorAuditDeviceId(request),
        source: getOperatorAuditSource(request),
        failureReason,
      }))
    },
    recordAuditEvent,
    recordResponseAuditEvent: (request, response, context) => {
      const auditContext = buildOperatorResponseAuditContext(request, response, context)
      if (auditContext) {
        recordAuditEvent(request, auditContext)
      }
    },
  }
}

export function getSanitizedWhatsAppOperatorDetails(
  parsed: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!parsed) {
    return undefined
  }

  const details: Record<string, unknown> = {}

  if (typeof parsed.status === "string") {
    details.status = parsed.status
  }
  if (typeof parsed.connected === "boolean") {
    details.connected = parsed.connected
  }
  if (typeof parsed.hasCredentials === "boolean") {
    details.hasCredentials = parsed.hasCredentials
  }
  if (typeof parsed.lastError === "string") {
    details.lastError = parsed.lastError
  }

  return Object.keys(details).length > 0 ? details : undefined
}

export function getOperatorMcpToolResultText(
  result: OperatorMcpToolResultLike,
): string | undefined {
  if (!Array.isArray(result.content)) {
    return undefined
  }

  const textEntry = result.content.find((entry) => (
    entry.type === "text" && typeof entry.text === "string"
  ))

  return typeof textEntry?.text === "string" ? textEntry.text : undefined
}

export function buildOperatorWhatsAppActionSuccessResponse(
  options: OperatorWhatsAppActionResponseOptions,
): OperatorActionResponse {
  const parsed = parseOperatorJsonRecord(options.text)
  const details = getSanitizedWhatsAppOperatorDetails(parsed)
  const message = typeof parsed?.status === "string"
    ? `WhatsApp ${parsed.status}`
    : options.text || options.successMessage

  return {
    success: true,
    action: options.action,
    message,
    ...(details ? { details } : {}),
  }
}

export function buildOperatorWhatsAppServerUnavailableActionResponse(
  action: string,
): OperatorActionResponse {
  return {
    success: false,
    action,
    message: "WhatsApp server is not running. Enable WhatsApp in settings first.",
    error: "WhatsApp server is not running",
  }
}

export function buildOperatorWhatsAppActionErrorResponse(
  action: string,
  message: string,
): OperatorActionResponse {
  return buildOperatorActionErrorResponse(action, message)
}

export function buildOperatorWhatsAppIntegrationSummary(
  options: OperatorWhatsAppIntegrationSummaryOptions,
): OperatorWhatsAppIntegrationSummary {
  return {
    enabled: options.enabled,
    available: options.serverConnected,
    connected: false,
    serverConfigured: options.serverConfigured,
    serverConnected: options.serverConnected,
    autoReplyEnabled: options.autoReplyEnabled,
    logMessagesEnabled: options.logMessagesEnabled,
    allowedSenderCount: options.allowedSenderCount,
    ...(options.lastError ? { lastError: options.lastError } : {}),
    logs: buildOperatorLogSummary(options.logs),
  }
}

export function mergeOperatorWhatsAppStatusPayload(
  summary: OperatorWhatsAppIntegrationSummary,
  textPayload: string | undefined,
): OperatorWhatsAppIntegrationSummary {
  const parsed = parseOperatorJsonRecord(textPayload)
  if (!parsed) {
    return summary
  }

  return {
    ...summary,
    connected: !!parsed.connected,
    ...(typeof parsed.hasCredentials === "boolean" ? { hasCredentials: parsed.hasCredentials } : {}),
    ...(typeof parsed.lastError === "string" && parsed.lastError ? { lastError: parsed.lastError } : {}),
  }
}

export async function getOperatorWhatsAppIntegrationSummaryAction(
  options: OperatorWhatsAppIntegrationSummaryActionOptions,
): Promise<OperatorWhatsAppIntegrationSummary> {
  const cfg = options.service.getConfig()
  const serverStatus = options.service.getServerStatus()[options.serverName]
  const summary = buildOperatorWhatsAppIntegrationSummary({
    enabled: !!cfg.whatsappEnabled,
    serverConfigured: !!cfg.mcpConfig?.mcpServers?.[options.serverName],
    serverConnected: !!serverStatus?.connected,
    autoReplyEnabled: !!cfg.whatsappAutoReply,
    logMessagesEnabled: !!cfg.whatsappLogMessages,
    allowedSenderCount: Array.isArray(cfg.whatsappAllowFrom) ? cfg.whatsappAllowFrom.length : 0,
    lastError: serverStatus?.error,
    logs: options.service.getServerLogs(options.serverName),
  })

  if (!serverStatus?.connected) {
    return summary
  }

  try {
    const statusResult = await options.service.executeStatusTool()

    if (statusResult.isError) {
      const lastError = getOperatorMcpToolResultText(statusResult)

      return {
        ...summary,
        ...(lastError ? { lastError } : {}),
      }
    }

    const textPayload = getOperatorMcpToolResultText(statusResult)
    if (!textPayload) {
      return summary
    }

    return mergeOperatorWhatsAppStatusPayload(summary, textPayload)
  } catch (caughtError) {
    const errorMessage = options.diagnostics.getErrorMessage(caughtError)
    options.diagnostics.logWarning(
      "operator-integration-summary",
      `Failed to summarize WhatsApp integration status: ${errorMessage}`,
    )

    return {
      ...summary,
      lastError: errorMessage,
    }
  }
}

export async function buildOperatorIntegrationsSummaryAction(
  options: OperatorIntegrationsSummaryActionOptions,
): Promise<OperatorIntegrationsSummary> {
  return {
    discord: buildOperatorDiscordIntegrationSummary(
      options.service.getDiscordStatus(),
      options.service.getDiscordLogs(),
    ),
    whatsapp: await options.service.getWhatsAppSummary(),
    pushNotifications: buildOperatorPushNotificationsSummary(options.service.getPushNotificationTokens()),
  }
}

export function buildOperatorConversationsResponse(
  history: OperatorConversationHistoryLike[],
  count: unknown = 10,
): OperatorConversationsResponse {
  const limit = clampOperatorCount(count, 10, 50)
  const conversations: OperatorConversationItem[] = history
    .slice(0, limit)
    .map(({ id, title, createdAt, updatedAt, messageCount, preview }) => ({
      id,
      title,
      createdAt,
      updatedAt,
      messageCount,
      preview: preview.length > 200 ? preview.slice(0, 200) + "\u2026" : preview,
    }))

  return {
    count: conversations.length,
    conversations,
  }
}

export function buildOperatorDiscordLogsResponse(
  entries: OperatorDiscordLogLike[],
  count: unknown = 20,
): OperatorDiscordLogsResponse {
  const limit = clampOperatorCount(count, 20, 50)
  const logs: OperatorDiscordLogEntry[] = entries
    .slice(-limit)
    .map(({ id, level, message, timestamp }) => ({ id, level, message, timestamp }))

  return {
    count: logs.length,
    logs,
  }
}

export function buildOperatorDiscordIntegrationSummary(
  status: OperatorDiscordStatusLike,
  logs: OperatorLogSummaryEntryLike[],
): OperatorDiscordIntegrationSummary {
  return {
    available: status.available,
    enabled: status.enabled,
    connected: status.connected,
    connecting: status.connecting,
    ...(typeof status.tokenConfigured === "boolean" ? { tokenConfigured: status.tokenConfigured } : {}),
    ...(status.defaultProfileId ? { defaultProfileId: status.defaultProfileId } : {}),
    ...(status.defaultProfileName ? { defaultProfileName: status.defaultProfileName } : {}),
    ...(status.botUsername ? { botUsername: status.botUsername } : {}),
    ...(status.lastError ? { lastError: status.lastError } : {}),
    ...(status.lastEventAt ? { lastEventAt: status.lastEventAt } : {}),
    logs: buildOperatorLogSummary(logs),
  }
}

export function buildOperatorPushNotificationsSummary(
  tokens: OperatorPushTokenLike[],
): OperatorPushNotificationsSummary {
  return {
    enabled: tokens.length > 0,
    tokenCount: tokens.length,
    platforms: [...new Set(tokens.map((token) => token.platform))].sort(),
  }
}

export function buildOperatorLogSummary(entries: OperatorLogSummaryEntryLike[]): OperatorLogSummary {
  const lastEntry = entries[entries.length - 1]
  let errorCount = 0
  let warningCount = 0
  let infoCount = 0

  for (const entry of entries) {
    if (entry.level === "error") {
      errorCount += 1
    } else if (entry.level === "warn" || entry.level === "warning") {
      warningCount += 1
    } else if (entry.level === "info") {
      infoCount += 1
    }
  }

  const hasLevelCounts = errorCount > 0 || warningCount > 0 || infoCount > 0

  return {
    total: entries.length,
    ...(lastEntry?.timestamp ? { lastTimestamp: lastEntry.timestamp } : {}),
    ...(hasLevelCounts ? { errorCount, warningCount, infoCount } : {}),
  }
}

export function buildOperatorUpdaterStatus(
  options: OperatorUpdaterStatusOptions,
): OperatorUpdaterStatus {
  const updateInfo = options.updateInfo ?? null

  return {
    enabled: false,
    mode: "manual",
    currentVersion: options.currentVersion,
    updateInfo,
    manualReleasesUrl: options.manualReleasesUrl,
    updateAvailable: updateInfo?.updateAvailable,
    lastCheckedAt: updateInfo?.lastCheckedAt,
    lastCheckError: updateInfo?.error,
    latestRelease: updateInfo?.latestRelease?.tagName && updateInfo.latestRelease.url
      ? {
        tagName: updateInfo.latestRelease.tagName,
        name: updateInfo.latestRelease.name,
        publishedAt: updateInfo.latestRelease.publishedAt,
        url: updateInfo.latestRelease.url,
        assetCount: Array.isArray(updateInfo.latestRelease.assets) ? updateInfo.latestRelease.assets.length : 0,
      }
      : undefined,
    preferredAsset: updateInfo?.preferredAsset?.name && updateInfo.preferredAsset.downloadUrl
      ? {
        name: updateInfo.preferredAsset.name,
        downloadUrl: updateInfo.preferredAsset.downloadUrl,
      }
      : undefined,
    lastDownloadedAt: updateInfo?.lastDownloadedAsset?.downloadedAt,
    lastDownloadedFileName: updateInfo?.lastDownloadedAsset?.name,
  }
}

export function buildOperatorActionErrorResponse(
  action: string,
  message: string,
): OperatorActionResponse {
  return {
    success: false,
    action,
    message,
    error: message,
  }
}

export function buildOperatorAgentSessionStopResponse(
  sessionId: string,
  conversationId?: string,
): OperatorActionResponse {
  return {
    success: true,
    action: "agent-session-stop",
    message: `Stopped agent session ${sessionId}`,
    details: {
      sessionId,
      ...(conversationId ? { conversationId } : {}),
    },
  }
}

export function buildOperatorMessageQueueClearResponse(
  conversationId: string,
  success: boolean,
): OperatorActionResponse {
  if (!success) {
    return buildOperatorActionErrorResponse("message-queue-clear", `Failed to clear message queue for ${conversationId}`)
  }

  return {
    success: true,
    action: "message-queue-clear",
    message: `Cleared message queue for ${conversationId}`,
    details: { conversationId },
  }
}

export function buildOperatorMessageQueuePauseResponse(conversationId: string): OperatorActionResponse {
  return {
    success: true,
    action: "message-queue-pause",
    message: `Paused message queue for ${conversationId}`,
    details: { conversationId },
  }
}

export function buildOperatorMessageQueueResumeResponse(
  conversationId: string,
  processingStarted: boolean,
): OperatorActionResponse {
  return {
    success: true,
    action: "message-queue-resume",
    message: processingStarted
      ? `Resumed message queue for ${conversationId} and started processing`
      : `Resumed message queue for ${conversationId}`,
    details: { conversationId, processingStarted },
  }
}

export function buildOperatorQueuedMessageRemoveResponse(
  conversationId: string,
  messageId: string,
  success: boolean,
): OperatorActionResponse {
  if (!success) {
    return buildOperatorActionErrorResponse("message-queue-message-remove", `Failed to remove queued message ${messageId}`)
  }

  return {
    success: true,
    action: "message-queue-message-remove",
    message: `Removed queued message ${messageId}`,
    details: { conversationId, messageId },
  }
}

export function buildOperatorQueuedMessageRetryResponse(
  conversationId: string,
  messageId: string,
  success: boolean,
  processingStarted: boolean,
): OperatorActionResponse {
  if (!success) {
    return buildOperatorActionErrorResponse("message-queue-message-retry", `Failed to retry queued message ${messageId}`)
  }

  return {
    success: true,
    action: "message-queue-message-retry",
    message: processingStarted
      ? `Retried queued message ${messageId} and started processing`
      : `Retried queued message ${messageId}`,
    details: { conversationId, messageId, processingStarted },
  }
}

export function buildOperatorQueuedMessageUpdateResponse(
  conversationId: string,
  messageId: string,
  success: boolean,
  processingStarted: boolean,
): OperatorActionResponse {
  if (!success) {
    return buildOperatorActionErrorResponse("message-queue-message-update", `Failed to update queued message ${messageId}`)
  }

  return {
    success: true,
    action: "message-queue-message-update",
    message: processingStarted
      ? `Updated queued message ${messageId} and started processing`
      : `Updated queued message ${messageId}`,
    details: { conversationId, messageId, processingStarted },
  }
}

export function parseOperatorQueuedMessageUpdateRequestBody(body: unknown): OperatorActionParseResult<OperatorQueuedMessageUpdateRequest> {
  if (!body || typeof body !== "object") {
    return { ok: false, statusCode: 400, error: "Request body must be an object" }
  }

  const record = body as Record<string, unknown>
  if (typeof record.text !== "string" || record.text.trim().length === 0) {
    return { ok: false, statusCode: 400, error: "Message text is required" }
  }

  return { ok: true, request: { text: record.text.trim() } }
}

export function normalizeOperatorPathParam(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function operatorAgentActionResult(
  statusCode: number,
  body: unknown,
  auditContext?: OperatorActionAuditContext,
): OperatorAgentActionResult {
  return {
    statusCode,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

export async function runOperatorAgentAction(
  body: unknown,
  runAgent: AgentRunExecutor,
  options: OperatorAgentActionOptions,
): Promise<OperatorAgentActionResult> {
  try {
    const parsedRequest = parseOperatorRunAgentRequestBody(body)
    if (parsedRequest.ok === false) {
      return operatorAgentActionResult(parsedRequest.statusCode, { error: parsedRequest.error })
    }
    const { prompt, conversationId, profileId } = parsedRequest.request

    options.diagnostics.logInfo(
      "operator-agent-actions",
      `Operator run-agent: ${prompt.length} chars${conversationId ? ` (conversation ${conversationId})` : ""}`,
    )

    const agentResult = await runAgent({
      prompt,
      conversationId,
      profileId,
    })

    return operatorAgentActionResult(
      200,
      buildOperatorRunAgentResponse(agentResult),
      {
        action: "run-agent",
        success: true,
        details: { promptLength: prompt.length, conversationId },
      },
    )
  } catch (caughtError) {
    const errorMessage = options.diagnostics.getErrorMessage(caughtError)
    options.diagnostics.logError("operator-agent-actions", `Operator run-agent failed: ${errorMessage}`, caughtError)
    return operatorAgentActionResult(
      500,
      { error: `Agent execution failed: ${errorMessage}` },
      {
        action: "run-agent",
        success: false,
        failureReason: "run-agent-error",
      },
    )
  }
}

export async function stopOperatorAgentSessionAction(
  sessionIdParam: string | undefined,
  options: OperatorAgentActionOptions,
): Promise<OperatorAgentActionResult> {
  const sessionId = normalizeOperatorPathParam(sessionIdParam)
  if (!sessionId) {
    const response = buildOperatorActionErrorResponse("agent-session-stop", "Missing session ID")
    return operatorAgentActionResult(400, response, buildOperatorActionAuditContext(response))
  }

  try {
    const stopResult = await options.service.stopAgentSessionById(sessionId)
    const response = buildOperatorAgentSessionStopResponse(stopResult.sessionId, stopResult.conversationId)
    return operatorAgentActionResult(200, response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    const errorMessage = options.diagnostics.getErrorMessage(caughtError)
    const response = buildOperatorActionErrorResponse("agent-session-stop", `Failed to stop agent session: ${errorMessage}`)
    options.diagnostics.logError("operator-agent-actions", `Failed to stop agent session ${sessionId}: ${errorMessage}`, caughtError)
    return operatorAgentActionResult(500, response, buildOperatorActionAuditContext(response))
  }
}

export function createOperatorAgentRouteActions(
  options: OperatorAgentActionOptions,
): OperatorAgentRouteActions {
  return {
    runOperatorAgent: (body, runAgent) => runOperatorAgentAction(body, runAgent, options),
    stopOperatorAgentSession: (sessionIdParam) => stopOperatorAgentSessionAction(sessionIdParam, options),
  }
}

function operatorObservabilityActionResult(
  statusCode: number,
  body: unknown,
): OperatorObservabilityActionResult {
  return {
    statusCode,
    body,
  }
}

function operatorObservabilityActionError(
  statusCode: number,
  message: string,
): OperatorObservabilityActionResult {
  return operatorObservabilityActionResult(statusCode, { error: message })
}

export async function getOperatorStatusAction(
  remoteServerStatus: OperatorRemoteServerStatusLike,
  options: OperatorObservabilityActionOptions,
): Promise<OperatorObservabilityActionResult> {
  try {
    const now = Date.now()
    const recentErrors = options.service.getRecentErrors(100)
    const health = await options.service.performHealthCheck()

    return operatorObservabilityActionResult(200, buildOperatorRuntimeStatus({
      timestamp: now,
      remoteServer: remoteServerStatus,
      health,
      tunnel: options.service.getTunnelStatus(),
      integrations: await options.service.getIntegrationsSummary(),
      updater: {
        currentVersion: options.service.getCurrentVersion(),
        updateInfo: options.service.getUpdateInfo(),
        manualReleasesUrl: options.manualReleasesUrl,
      },
      system: options.service.getSystemMetrics(),
      activeSessions: options.service.getActiveSessions(),
      recentSessions: options.service.getRecentSessions(10),
      recentErrors,
    }))
  } catch (caughtError) {
    options.diagnostics.logError("operator-observability-actions", "Failed to build operator runtime status", caughtError)
    return operatorObservabilityActionError(500, "Failed to build operator runtime status")
  }
}

export async function getOperatorHealthAction(
  options: OperatorObservabilityActionOptions,
): Promise<OperatorObservabilityActionResult> {
  try {
    const health = await options.service.performHealthCheck()
    return operatorObservabilityActionResult(200, buildOperatorHealthSnapshot(health))
  } catch (caughtError) {
    options.diagnostics.logError("operator-observability-actions", "Failed to build operator health snapshot", caughtError)
    return operatorObservabilityActionError(500, "Failed to build operator health snapshot")
  }
}

export function getOperatorErrorsAction(
  count: string | number | undefined,
  options: OperatorObservabilityActionOptions,
): OperatorObservabilityActionResult {
  try {
    const errors = options.service.getRecentErrors(clampOperatorCount(count, 10, 50))
    return operatorObservabilityActionResult(200, buildOperatorRecentErrorsResponse(errors))
  } catch (caughtError) {
    options.diagnostics.logError("operator-observability-actions", "Failed to build operator recent errors", caughtError)
    return operatorObservabilityActionError(500, "Failed to build operator recent errors")
  }
}

export function getOperatorLogsAction(
  count: string | number | undefined,
  level: string | undefined,
  options: OperatorObservabilityActionOptions,
): OperatorObservabilityActionResult {
  try {
    const normalizedCount = clampOperatorCount(count, 20, 100)
    const normalizedLevel = normalizeOperatorLogLevel(level)
    const allEntries = options.service.getRecentErrors(normalizedCount)
    return operatorObservabilityActionResult(200, buildOperatorLogsResponse(allEntries, normalizedLevel))
  } catch (caughtError) {
    options.diagnostics.logError("operator-observability-actions", "Failed to build operator logs", caughtError)
    return operatorObservabilityActionError(500, "Failed to build operator logs")
  }
}

export async function getOperatorConversationsAction(
  count: string | number | undefined,
  options: OperatorObservabilityActionOptions,
): Promise<OperatorObservabilityActionResult> {
  try {
    const history = await options.service.getConversationHistory()
    return operatorObservabilityActionResult(200, buildOperatorConversationsResponse(history, count))
  } catch (caughtError) {
    options.diagnostics.logError("operator-observability-actions", "Failed to build operator conversations response", caughtError)
    return operatorObservabilityActionError(500, "Failed to build operator conversations response")
  }
}

export function getOperatorRemoteServerAction(
  remoteServerStatus: OperatorRemoteServerStatusLike,
): OperatorObservabilityActionResult {
  return operatorObservabilityActionResult(200, buildOperatorRemoteServerStatus(remoteServerStatus))
}

export function createOperatorObservabilityRouteActions(
  options: OperatorObservabilityActionOptions,
): OperatorObservabilityRouteActions {
  return {
    getOperatorStatus: (remoteServerStatus) => getOperatorStatusAction(remoteServerStatus, options),
    getOperatorHealth: () => getOperatorHealthAction(options),
    getOperatorErrors: (count) => getOperatorErrorsAction(count, options),
    getOperatorLogs: (count, level) => getOperatorLogsAction(count, level, options),
    getOperatorConversations: (count) => getOperatorConversationsAction(count, options),
    getOperatorRemoteServer: (remoteServerStatus) => getOperatorRemoteServerAction(remoteServerStatus),
  }
}

function operatorMessageQueueActionResult(
  statusCode: number,
  body: unknown,
  auditContext?: OperatorActionAuditContext,
): OperatorMessageQueueActionResult {
  return {
    statusCode,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

function operatorMessageQueueResponseResult(
  statusCode: number,
  response: OperatorActionResponse,
): OperatorMessageQueueActionResult {
  return operatorMessageQueueActionResult(
    statusCode,
    response,
    buildOperatorActionAuditContext(response),
  )
}

export function getOperatorMessageQueuesAction(
  options: OperatorMessageQueueActionOptions,
): OperatorMessageQueueActionResult {
  return operatorMessageQueueActionResult(200, buildOperatorMessageQueuesResponse(
    options.service.getAllQueues().map((queue) => ({
      ...queue,
      isPaused: options.service.isQueuePaused(queue.conversationId),
    })),
  ))
}

export function clearOperatorMessageQueueAction(
  conversationIdParam: string | undefined,
  options: OperatorMessageQueueActionOptions,
): OperatorMessageQueueActionResult {
  const conversationId = normalizeOperatorPathParam(conversationIdParam)
  if (!conversationId) {
    return operatorMessageQueueResponseResult(
      400,
      buildOperatorActionErrorResponse("message-queue-clear", "Missing conversation ID"),
    )
  }

  const response = buildOperatorMessageQueueClearResponse(
    conversationId,
    options.service.clearQueue(conversationId),
  )
  return operatorMessageQueueResponseResult(response.success ? 200 : 409, response)
}

export function pauseOperatorMessageQueueAction(
  conversationIdParam: string | undefined,
  options: OperatorMessageQueueActionOptions,
): OperatorMessageQueueActionResult {
  const conversationId = normalizeOperatorPathParam(conversationIdParam)
  if (!conversationId) {
    return operatorMessageQueueResponseResult(
      400,
      buildOperatorActionErrorResponse("message-queue-pause", "Missing conversation ID"),
    )
  }

  const queueResult = options.service.pauseQueue(conversationId)
  return operatorMessageQueueResponseResult(
    200,
    buildOperatorMessageQueuePauseResponse(queueResult.conversationId),
  )
}

export function resumeOperatorMessageQueueAction(
  conversationIdParam: string | undefined,
  options: OperatorMessageQueueActionOptions,
): OperatorMessageQueueActionResult {
  const conversationId = normalizeOperatorPathParam(conversationIdParam)
  if (!conversationId) {
    return operatorMessageQueueResponseResult(
      400,
      buildOperatorActionErrorResponse("message-queue-resume", "Missing conversation ID"),
    )
  }

  const queueResult = options.service.resumeQueue(conversationId)
  return operatorMessageQueueResponseResult(
    200,
    buildOperatorMessageQueueResumeResponse(conversationId, queueResult.processingStarted),
  )
}

export function removeOperatorQueuedMessageAction(
  conversationIdParam: string | undefined,
  messageIdParam: string | undefined,
  options: OperatorMessageQueueActionOptions,
): OperatorMessageQueueActionResult {
  const conversationId = normalizeOperatorPathParam(conversationIdParam)
  const messageId = normalizeOperatorPathParam(messageIdParam)
  if (!conversationId || !messageId) {
    return operatorMessageQueueResponseResult(
      400,
      buildOperatorActionErrorResponse("message-queue-message-remove", "Missing conversation ID or message ID"),
    )
  }

  const queueResult = options.service.removeQueuedMessage(conversationId, messageId)
  const response = buildOperatorQueuedMessageRemoveResponse(conversationId, messageId, queueResult.success)
  return operatorMessageQueueResponseResult(response.success ? 200 : 409, response)
}

export function retryOperatorQueuedMessageAction(
  conversationIdParam: string | undefined,
  messageIdParam: string | undefined,
  options: OperatorMessageQueueActionOptions,
): OperatorMessageQueueActionResult {
  const conversationId = normalizeOperatorPathParam(conversationIdParam)
  const messageId = normalizeOperatorPathParam(messageIdParam)
  if (!conversationId || !messageId) {
    return operatorMessageQueueResponseResult(
      400,
      buildOperatorActionErrorResponse("message-queue-message-retry", "Missing conversation ID or message ID"),
    )
  }

  const queueResult = options.service.retryQueuedMessage(conversationId, messageId)
  const response = buildOperatorQueuedMessageRetryResponse(
    conversationId,
    messageId,
    queueResult.success,
    queueResult.processingStarted ?? false,
  )
  return operatorMessageQueueResponseResult(response.success ? 200 : 409, response)
}

export function updateOperatorQueuedMessageAction(
  conversationIdParam: string | undefined,
  messageIdParam: string | undefined,
  body: unknown,
  options: OperatorMessageQueueActionOptions,
): OperatorMessageQueueActionResult {
  const conversationId = normalizeOperatorPathParam(conversationIdParam)
  const messageId = normalizeOperatorPathParam(messageIdParam)
  if (!conversationId || !messageId) {
    return operatorMessageQueueResponseResult(
      400,
      buildOperatorActionErrorResponse("message-queue-message-update", "Missing conversation ID or message ID"),
    )
  }

  const parsed = parseOperatorQueuedMessageUpdateRequestBody(body)
  if (parsed.ok === false) {
    return operatorMessageQueueResponseResult(
      parsed.statusCode,
      buildOperatorActionErrorResponse("message-queue-message-update", parsed.error),
    )
  }

  const queueResult = options.service.updateQueuedMessageText(conversationId, messageId, parsed.request.text)
  const response = buildOperatorQueuedMessageUpdateResponse(
    conversationId,
    messageId,
    queueResult.success,
    queueResult.processingStarted ?? false,
  )
  return operatorMessageQueueResponseResult(response.success ? 200 : 409, response)
}

export function createOperatorMessageQueueRouteActions(
  options: OperatorMessageQueueActionOptions,
): OperatorMessageQueueRouteActions {
  return {
    getOperatorMessageQueues: () => getOperatorMessageQueuesAction(options),
    clearOperatorMessageQueue: (conversationIdParam) =>
      clearOperatorMessageQueueAction(conversationIdParam, options),
    pauseOperatorMessageQueue: (conversationIdParam) =>
      pauseOperatorMessageQueueAction(conversationIdParam, options),
    resumeOperatorMessageQueue: (conversationIdParam) =>
      resumeOperatorMessageQueueAction(conversationIdParam, options),
    removeOperatorQueuedMessage: (conversationIdParam, messageIdParam) =>
      removeOperatorQueuedMessageAction(conversationIdParam, messageIdParam, options),
    retryOperatorQueuedMessage: (conversationIdParam, messageIdParam) =>
      retryOperatorQueuedMessageAction(conversationIdParam, messageIdParam, options),
    updateOperatorQueuedMessage: (conversationIdParam, messageIdParam, body) =>
      updateOperatorQueuedMessageAction(conversationIdParam, messageIdParam, body, options),
  }
}

export function buildOperatorApiKeyRotationResponse(apiKey: string): OperatorApiKeyRotationResponse {
  return {
    success: true,
    action: "rotate-api-key",
    message: "Remote server API key rotated",
    scheduled: true,
    restartScheduled: true,
    apiKey,
  }
}

export function buildOperatorApiKeyRotationAuditContext(): OperatorActionAuditContext {
  return {
    action: "rotate-api-key",
    success: true,
    details: {
      restartScheduled: true,
    },
  }
}

export function buildOperatorApiKeyRotationFailureAuditContext(): OperatorActionAuditContext {
  return {
    action: "rotate-api-key",
    success: false,
    failureReason: "rotate-api-key-route-error",
  }
}

function operatorApiKeyActionResult(
  statusCode: number,
  body: unknown,
  auditContext?: OperatorActionAuditContext,
  shouldRestartRemoteServer = false,
): OperatorApiKeyActionResult {
  return {
    statusCode,
    body,
    shouldRestartRemoteServer,
    ...(auditContext ? { auditContext } : {}),
  }
}

export function rotateOperatorRemoteServerApiKeyAction(
  options: OperatorApiKeyActionOptions,
): OperatorApiKeyActionResult {
  try {
    const apiKey = options.service.rotateRemoteServerApiKey()

    return operatorApiKeyActionResult(
      200,
      buildOperatorApiKeyRotationResponse(apiKey),
      buildOperatorApiKeyRotationAuditContext(),
      true,
    )
  } catch (caughtError) {
    options.diagnostics.logError(
      "operator-api-key-actions",
      "Failed to rotate remote server API key",
      caughtError,
    )
    return operatorApiKeyActionResult(
      500,
      { error: "Failed to rotate remote server API key" },
      buildOperatorApiKeyRotationFailureAuditContext(),
    )
  }
}

export function createOperatorApiKeyRouteActions(
  options: OperatorApiKeyActionOptions,
): OperatorApiKeyRouteActions {
  return {
    rotateOperatorRemoteServerApiKey: () => rotateOperatorRemoteServerApiKeyAction(options),
  }
}

export function buildOperatorDiscordConnectActionResponse(
  result: OperatorActionResultLike,
  status: Pick<OperatorDiscordStatusLike, "connected">,
): OperatorActionResponse {
  if (result.success) {
    return {
      success: true,
      action: "discord-connect",
      message: "Discord connection started",
      details: {
        connected: status.connected,
      },
    }
  }

  return buildOperatorActionErrorResponse(
    "discord-connect",
    result.error || "Failed to start Discord integration",
  )
}

export function buildOperatorDiscordDisconnectActionResponse(
  result: OperatorActionResultLike,
): OperatorActionResponse {
  if (result.success) {
    return {
      success: true,
      action: "discord-disconnect",
      message: "Discord integration stopped",
    }
  }

  return buildOperatorActionErrorResponse(
    "discord-disconnect",
    result.error || "Failed to stop Discord integration",
  )
}

export function buildOperatorDiscordClearLogsActionResponse(): OperatorActionResponse {
  return {
    success: true,
    action: "discord-clear-logs",
    message: "Discord logs cleared",
  }
}

function operatorIntegrationActionResult(
  statusCode: number,
  body: unknown,
  auditContext?: OperatorActionAuditContext,
): OperatorIntegrationActionResult {
  return {
    statusCode,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

function operatorIntegrationActionError(
  statusCode: number,
  message: string,
  auditContext?: OperatorActionAuditContext,
): OperatorIntegrationActionResult {
  return operatorIntegrationActionResult(statusCode, { error: message }, auditContext)
}

function operatorIntegrationResponseResult(
  response: OperatorActionResponse,
): OperatorIntegrationActionResult {
  return operatorIntegrationActionResult(200, response, buildOperatorActionAuditContext(response))
}

async function runOperatorWhatsAppAction(
  toolName: OperatorWhatsAppActionToolName,
  action: string,
  successMessage: string,
  options: OperatorIntegrationActionOptions,
): Promise<OperatorActionResponse> {
  try {
    if (!options.service.isWhatsAppServerConnected()) {
      return buildOperatorWhatsAppServerUnavailableActionResponse(action)
    }

    const result = await options.service.executeWhatsAppTool(toolName)
    const text = getOperatorMcpToolResultText(result)
    if (result.isError) {
      const message = text || `${action} failed`
      return buildOperatorWhatsAppActionErrorResponse(action, message)
    }

    return buildOperatorWhatsAppActionSuccessResponse({ action, text, successMessage })
  } catch (caughtError) {
    return buildOperatorWhatsAppActionErrorResponse(action, options.diagnostics.getErrorMessage(caughtError))
  }
}

export async function getOperatorIntegrationsAction(
  options: OperatorIntegrationActionOptions,
): Promise<OperatorIntegrationActionResult> {
  try {
    return operatorIntegrationActionResult(200, await options.service.getIntegrationsSummary())
  } catch (caughtError) {
    options.diagnostics.logError("operator-integration-actions", "Failed to build operator integrations summary", caughtError)
    return operatorIntegrationActionError(500, "Failed to build operator integrations summary")
  }
}

export function getOperatorDiscordAction(
  options: OperatorIntegrationActionOptions,
): OperatorIntegrationActionResult {
  return operatorIntegrationActionResult(200, buildOperatorDiscordIntegrationSummary(
    options.service.getDiscordStatus(),
    options.service.getDiscordLogs(),
  ))
}

export function getOperatorDiscordLogsAction(
  count: string | number | undefined,
  options: OperatorIntegrationActionOptions,
): OperatorIntegrationActionResult {
  return operatorIntegrationActionResult(200, buildOperatorDiscordLogsResponse(options.service.getDiscordLogs(), count))
}

export async function connectOperatorDiscordAction(
  options: OperatorIntegrationActionOptions,
): Promise<OperatorIntegrationActionResult> {
  const result = await options.service.startDiscord()
  const response = buildOperatorDiscordConnectActionResponse(result, options.service.getDiscordStatus())
  return operatorIntegrationResponseResult(response)
}

export async function disconnectOperatorDiscordAction(
  options: OperatorIntegrationActionOptions,
): Promise<OperatorIntegrationActionResult> {
  const result = await options.service.stopDiscord()
  const response = buildOperatorDiscordDisconnectActionResponse(result)
  return operatorIntegrationResponseResult(response)
}

export function clearOperatorDiscordLogsAction(
  options: OperatorIntegrationActionOptions,
): OperatorIntegrationActionResult {
  options.service.clearDiscordLogs()
  const response = buildOperatorDiscordClearLogsActionResponse()
  return operatorIntegrationResponseResult(response)
}

export async function getOperatorWhatsAppAction(
  options: OperatorIntegrationActionOptions,
): Promise<OperatorIntegrationActionResult> {
  try {
    return operatorIntegrationActionResult(200, await options.service.getWhatsAppSummary())
  } catch (caughtError) {
    options.diagnostics.logError("operator-integration-actions", "Failed to build WhatsApp operator summary", caughtError)
    return operatorIntegrationActionError(500, "Failed to build WhatsApp operator summary")
  }
}

export async function connectOperatorWhatsAppAction(
  options: OperatorIntegrationActionOptions,
): Promise<OperatorIntegrationActionResult> {
  const response = await runOperatorWhatsAppAction(
    "whatsapp_connect",
    "whatsapp-connect",
    "WhatsApp connection initiated",
    options,
  )
  return operatorIntegrationResponseResult(response)
}

export async function logoutOperatorWhatsAppAction(
  options: OperatorIntegrationActionOptions,
): Promise<OperatorIntegrationActionResult> {
  const response = await runOperatorWhatsAppAction(
    "whatsapp_logout",
    "whatsapp-logout",
    "WhatsApp logout completed",
    options,
  )
  return operatorIntegrationResponseResult(response)
}

export function createOperatorIntegrationRouteActions(
  options: OperatorIntegrationActionOptions,
): OperatorIntegrationRouteActions {
  return {
    getOperatorIntegrations: () => getOperatorIntegrationsAction(options),
    getOperatorDiscord: () => getOperatorDiscordAction(options),
    getOperatorDiscordLogs: (count) => getOperatorDiscordLogsAction(count, options),
    connectOperatorDiscord: () => connectOperatorDiscordAction(options),
    disconnectOperatorDiscord: () => disconnectOperatorDiscordAction(options),
    clearOperatorDiscordLogs: () => clearOperatorDiscordLogsAction(options),
    getOperatorWhatsApp: () => getOperatorWhatsAppAction(options),
    connectOperatorWhatsApp: () => connectOperatorWhatsAppAction(options),
    logoutOperatorWhatsApp: () => logoutOperatorWhatsAppAction(options),
  }
}

export function buildOperatorTunnelStartRemoteServerRequiredResponse(): OperatorActionResponse {
  return {
    success: false,
    action: "tunnel-start",
    message: "Remote server must be running before a tunnel can be started",
    error: "Remote server is not running",
  }
}

export function buildOperatorTunnelStartActionResponse(
  result: OperatorTunnelStartResultLike,
): OperatorActionResponse {
  if (result.success) {
    return {
      success: true,
      action: "tunnel-start",
      message: result.mode === "named" ? "Cloudflare named tunnel started" : "Cloudflare quick tunnel started",
      details: {
        mode: result.mode,
        ...(result.url ? { url: result.url } : {}),
      },
    }
  }

  const message = result.error || "Failed to start Cloudflare tunnel"
  return {
    ...buildOperatorActionErrorResponse("tunnel-start", message),
    details: {
      mode: result.mode,
    },
  }
}

export function buildOperatorTunnelStopActionResponse(): OperatorActionResponse {
  return {
    success: true,
    action: "tunnel-stop",
    message: "Cloudflare tunnel stopped",
  }
}

function operatorTunnelActionResult(
  statusCode: number,
  body: unknown,
  auditContext?: OperatorActionAuditContext,
): OperatorTunnelActionResult {
  return {
    statusCode,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

function operatorTunnelActionError(
  statusCode: number,
  message: string,
  auditContext?: OperatorActionAuditContext,
): OperatorTunnelActionResult {
  return operatorTunnelActionResult(statusCode, { error: message }, auditContext)
}

export function getOperatorTunnelAction(options: OperatorTunnelActionOptions): OperatorTunnelActionResult {
  return operatorTunnelActionResult(200, buildOperatorTunnelStatus(options.service.getStatus()))
}

export async function getOperatorTunnelSetupAction(
  options: OperatorTunnelActionOptions,
): Promise<OperatorTunnelActionResult> {
  try {
    const cfg = options.service.getConfig()
    const installed = await options.service.checkCloudflaredInstalled()
    const loggedIn = installed ? await options.service.checkCloudflaredLoggedIn() : false
    const listResult = installed && loggedIn
      ? await options.service.listCloudflareTunnels()
      : undefined

    return operatorTunnelActionResult(200, buildOperatorTunnelSetupSummary({
      config: cfg,
      installed,
      loggedIn,
      listResult,
    }))
  } catch (caughtError) {
    options.diagnostics.logError("operator-tunnel-actions", "Failed to build tunnel setup summary", caughtError)
    return operatorTunnelActionError(500, "Failed to build tunnel setup summary")
  }
}

async function startConfiguredOperatorTunnel(
  options: OperatorTunnelActionOptions,
): Promise<OperatorTunnelStartResultLike> {
  const cfg = options.service.getConfig()
  const startPlan = getConfiguredCloudflareTunnelStartPlan(cfg)

  if (startPlan.ok === false) {
    return {
      success: false,
      mode: startPlan.mode,
      error: startPlan.error,
    }
  }

  if (startPlan.mode === "named") {
    const result = await options.service.startNamedTunnel({
      tunnelId: startPlan.tunnelId,
      hostname: startPlan.hostname,
      credentialsPath: startPlan.credentialsPath,
    })

    return {
      ...result,
      mode: startPlan.mode,
    }
  }

  const result = await options.service.startQuickTunnel()
  return {
    ...result,
    mode: startPlan.mode,
  }
}

export async function startOperatorTunnelAction(
  remoteServerRunning: boolean,
  options: OperatorTunnelActionOptions,
): Promise<OperatorTunnelActionResult> {
  try {
    if (!remoteServerRunning) {
      const response = buildOperatorTunnelStartRemoteServerRequiredResponse()
      return operatorTunnelActionResult(200, response, {
        action: response.action,
        success: false,
        failureReason: "remote-server-not-running",
      })
    }

    const result = await startConfiguredOperatorTunnel(options)
    const response = buildOperatorTunnelStartActionResponse(result)
    return operatorTunnelActionResult(200, response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    options.diagnostics.logError("operator-tunnel-actions", "Failed to start tunnel from operator route", caughtError)
    return operatorTunnelActionError(500, "Failed to start tunnel", {
      action: "tunnel-start",
      success: false,
      failureReason: "tunnel-start-route-error",
    })
  }
}

export async function stopOperatorTunnelAction(
  options: OperatorTunnelActionOptions,
): Promise<OperatorTunnelActionResult> {
  try {
    await options.service.stopTunnel()
    const response = buildOperatorTunnelStopActionResponse()
    return operatorTunnelActionResult(200, response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    options.diagnostics.logError("operator-tunnel-actions", "Failed to stop tunnel from operator route", caughtError)
    return operatorTunnelActionError(500, "Failed to stop tunnel", {
      action: "tunnel-stop",
      success: false,
      failureReason: "tunnel-stop-route-error",
    })
  }
}

export function createOperatorTunnelRouteActions(
  options: OperatorTunnelActionOptions,
): OperatorTunnelRouteActions {
  return {
    getOperatorTunnel: () => getOperatorTunnelAction(options),
    getOperatorTunnelSetup: () => getOperatorTunnelSetupAction(options),
    startOperatorTunnel: (remoteServerRunning) => startOperatorTunnelAction(remoteServerRunning, options),
    stopOperatorTunnel: () => stopOperatorTunnelAction(options),
  }
}

export function buildOperatorRestartRemoteServerActionResponse(wasRunning: boolean): OperatorActionResponse {
  return {
    success: true,
    action: "restart-remote-server",
    message: "Remote server restart scheduled",
    scheduled: true,
    details: {
      wasRunning,
    },
  }
}

export function buildOperatorRestartAppActionResponse(currentVersion: string): OperatorActionResponse {
  return {
    success: true,
    action: "restart-app",
    message: "Application restart scheduled",
    scheduled: true,
    details: {
      currentVersion,
    },
  }
}

function operatorRestartActionResult(
  body: OperatorActionResponse,
  options: Pick<OperatorRestartActionResult, "shouldRestartRemoteServer" | "shouldRestartApp">,
): OperatorRestartActionResult {
  return {
    statusCode: 200,
    body,
    auditContext: buildOperatorActionAuditContext(body),
    ...options,
  }
}

export function restartOperatorRemoteServerAction(isRunning: boolean): OperatorRestartActionResult {
  return operatorRestartActionResult(
    buildOperatorRestartRemoteServerActionResponse(isRunning),
    { shouldRestartRemoteServer: true },
  )
}

export function restartOperatorAppAction(appVersion: string): OperatorRestartActionResult {
  return operatorRestartActionResult(
    buildOperatorRestartAppActionResponse(appVersion),
    { shouldRestartApp: true },
  )
}

export function createOperatorRestartRouteActions(): OperatorRestartRouteActions {
  return {
    restartOperatorApp: (appVersion) => restartOperatorAppAction(appVersion),
    restartOperatorRemoteServer: (isRunning) => restartOperatorRemoteServerAction(isRunning),
  }
}

function operatorUpdaterActionResult(
  body: unknown,
  auditContext?: OperatorActionAuditContext,
): OperatorUpdaterActionResult {
  return {
    statusCode: 200,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

function getUnknownOperatorActionErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message
  }
  return "Unknown error"
}

export function getOperatorUpdaterAction(
  currentVersion: string,
  manualReleasesUrl: string,
  options: OperatorUpdaterActionOptions,
): OperatorUpdaterActionResult {
  return operatorUpdaterActionResult(buildOperatorUpdaterStatus({
    currentVersion,
    updateInfo: options.service.getUpdateInfo(),
    manualReleasesUrl,
  }))
}

export async function checkOperatorUpdaterAction(
  manualReleasesUrl: string,
  options: OperatorUpdaterActionOptions,
): Promise<OperatorUpdaterActionResult> {
  const result = await options.service.checkForUpdatesAndDownload()
  const response = buildOperatorUpdaterCheckActionResponse(result.updateInfo, manualReleasesUrl)
  return operatorUpdaterActionResult(response, buildOperatorActionAuditContext(response))
}

export async function downloadLatestOperatorUpdateAssetAction(
  options: OperatorUpdaterActionOptions,
): Promise<OperatorUpdaterActionResult> {
  try {
    const result = await options.service.downloadLatestReleaseAsset()
    const response = buildOperatorUpdaterDownloadLatestActionResponse(result)
    return operatorUpdaterActionResult(response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    const response = buildOperatorActionErrorResponse(
      "updater-download-latest",
      getUnknownOperatorActionErrorMessage(caughtError),
    )
    return operatorUpdaterActionResult(response, buildOperatorActionAuditContext(response))
  }
}

export async function revealOperatorUpdateAssetAction(
  options: OperatorUpdaterActionOptions,
): Promise<OperatorUpdaterActionResult> {
  try {
    const downloadedAsset = await options.service.revealDownloadedReleaseAsset()
    const response = buildOperatorDownloadedAssetActionResponse("updater-reveal-download", downloadedAsset)
    return operatorUpdaterActionResult(response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    const response = buildOperatorActionErrorResponse(
      "updater-reveal-download",
      getUnknownOperatorActionErrorMessage(caughtError),
    )
    return operatorUpdaterActionResult(response, buildOperatorActionAuditContext(response))
  }
}

export async function openOperatorUpdateAssetAction(
  options: OperatorUpdaterActionOptions,
): Promise<OperatorUpdaterActionResult> {
  try {
    const downloadedAsset = await options.service.openDownloadedReleaseAsset()
    const response = buildOperatorDownloadedAssetActionResponse("updater-open-download", downloadedAsset)
    return operatorUpdaterActionResult(response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    const response = buildOperatorActionErrorResponse(
      "updater-open-download",
      getUnknownOperatorActionErrorMessage(caughtError),
    )
    return operatorUpdaterActionResult(response, buildOperatorActionAuditContext(response))
  }
}

export async function openOperatorReleasesPageAction(
  options: OperatorUpdaterActionOptions,
): Promise<OperatorUpdaterActionResult> {
  try {
    const result = await options.service.openManualReleasesPage()
    const response = buildOperatorOpenReleasesActionResponse(result.url)
    return operatorUpdaterActionResult(response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    const response = buildOperatorActionErrorResponse(
      "updater-open-releases",
      getUnknownOperatorActionErrorMessage(caughtError),
    )
    return operatorUpdaterActionResult(response, buildOperatorActionAuditContext(response))
  }
}

export function createOperatorUpdaterRouteActions(
  manualReleasesUrl: string,
  options: OperatorUpdaterActionOptions,
): OperatorUpdaterRouteActions {
  return {
    getOperatorUpdater: (currentVersion) => getOperatorUpdaterAction(currentVersion, manualReleasesUrl, options),
    checkOperatorUpdater: () => checkOperatorUpdaterAction(manualReleasesUrl, options),
    downloadLatestOperatorUpdateAsset: () => downloadLatestOperatorUpdateAssetAction(options),
    revealOperatorUpdateAsset: () => revealOperatorUpdateAssetAction(options),
    openOperatorUpdateAsset: () => openOperatorUpdateAssetAction(options),
    openOperatorReleasesPage: () => openOperatorReleasesPageAction(options),
  }
}

export function buildOperatorUpdaterCheckActionResponse(
  updateInfo: OperatorUpdateInfoLike,
  manualReleasesUrl: string,
): OperatorActionResponse {
  if (updateInfo?.error) {
    return {
      success: false,
      action: "updater-check",
      message: `Update check failed: ${updateInfo.error}`,
      error: updateInfo.error,
      details: {
        currentVersion: updateInfo.currentVersion,
        checkedAt: updateInfo.lastCheckedAt,
        releaseUrl: manualReleasesUrl,
      },
    }
  }

  return {
    success: true,
    action: "updater-check",
    message: updateInfo?.updateAvailable
      ? `Update available: ${updateInfo.latestRelease?.tagName || "latest release found"}`
      : "No newer release found.",
    details: {
      currentVersion: updateInfo?.currentVersion,
      checkedAt: updateInfo?.lastCheckedAt,
      updateAvailable: updateInfo?.updateAvailable ?? false,
      latestReleaseTag: updateInfo?.latestRelease?.tagName,
      releaseUrl: updateInfo?.latestRelease?.url || manualReleasesUrl,
    },
  }
}

export function buildOperatorUpdaterDownloadLatestActionResponse(
  result: OperatorUpdaterDownloadLatestResultLike,
): OperatorActionResponse {
  return {
    success: true,
    action: "updater-download-latest",
    message: `Downloaded ${result.downloadedAsset.name} to ${result.downloadedAsset.filePath}`,
    details: {
      fileName: result.downloadedAsset.name,
      filePath: result.downloadedAsset.filePath,
      downloadedAt: result.downloadedAsset.downloadedAt,
      releaseTag: result.updateInfo?.latestRelease?.tagName,
    },
  }
}

export function buildOperatorDownloadedAssetActionResponse(
  action: "updater-reveal-download" | "updater-open-download",
  downloadedAsset: OperatorDownloadedReleaseAssetLike,
): OperatorActionResponse {
  const actionVerb = action === "updater-reveal-download" ? "Revealed" : "Opened"
  const actionTarget = action === "updater-reveal-download"
    ? "in the desktop file manager"
    : "on the desktop machine"

  return {
    success: true,
    action,
    message: `${actionVerb} ${downloadedAsset.name} ${actionTarget}.`,
    details: {
      fileName: downloadedAsset.name,
      filePath: downloadedAsset.filePath,
    },
  }
}

export function buildOperatorOpenReleasesActionResponse(url: string): OperatorActionResponse {
  return {
    success: true,
    action: "updater-open-releases",
    message: `Opened releases page: ${url}`,
    details: { url },
  }
}

function bytesToRoundedMegabytes(bytes: number): number {
  return Math.round(bytes / 1048576 * 100) / 100
}

export function buildOperatorSystemMetrics(
  metrics: OperatorSystemMetricsLike,
): OperatorSystemMetrics {
  return {
    platform: metrics.platform,
    arch: metrics.arch,
    nodeVersion: metrics.nodeVersion,
    electronVersion: metrics.electronVersion,
    appVersion: metrics.appVersion,
    uptimeSeconds: Math.floor(metrics.osUptimeSeconds),
    processUptimeSeconds: Math.floor(metrics.processUptimeSeconds),
    memoryUsage: {
      heapUsedMB: bytesToRoundedMegabytes(metrics.memoryUsageBytes.heapUsed),
      heapTotalMB: bytesToRoundedMegabytes(metrics.memoryUsageBytes.heapTotal),
      rssMB: bytesToRoundedMegabytes(metrics.memoryUsageBytes.rss),
    },
    cpuCount: metrics.cpuCount,
    totalMemoryMB: Math.round(metrics.totalMemoryBytes / 1048576),
    freeMemoryMB: Math.round(metrics.freeMemoryBytes / 1048576),
    hostname: metrics.hostname,
  }
}

export function buildOperatorSessionsSummary(
  activeSessions: OperatorSessionSummaryLike[],
  recentSessions: OperatorSessionSummaryLike[],
): OperatorSessionsSummary {
  return {
    activeSessions: activeSessions.length,
    recentSessions: recentSessions.length,
    activeSessionDetails: activeSessions.map((session) => ({
      id: session.id,
      title: session.conversationTitle,
      status: session.status,
      startTime: session.startTime,
      currentIteration: session.currentIteration,
      maxIterations: session.maxIterations,
    })),
  }
}

export function buildOperatorRuntimeStatus(
  options: OperatorRuntimeStatusOptions,
): OperatorRuntimeStatus {
  const timestamp = options.timestamp ?? Date.now()

  return {
    timestamp,
    remoteServer: buildOperatorRemoteServerStatus(options.remoteServer),
    health: buildOperatorHealthSnapshot(options.health, timestamp),
    tunnel: buildOperatorTunnelStatus(options.tunnel),
    integrations: options.integrations,
    updater: buildOperatorUpdaterStatus(options.updater),
    system: buildOperatorSystemMetrics(options.system),
    sessions: buildOperatorSessionsSummary(options.activeSessions, options.recentSessions),
    recentErrors: buildOperatorRecentErrorSummary(
      options.recentErrors,
      timestamp,
      options.recentErrorWindowMs,
    ),
  }
}
