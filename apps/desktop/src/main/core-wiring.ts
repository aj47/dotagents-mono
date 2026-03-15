/**
 * Core Service Wiring for Electron Desktop
 *
 * This module registers Electron-specific adapter implementations with the
 * @dotagents/core service container and wires all setter-injected dependencies.
 *
 * Must be imported early in the startup sequence (before any core services are used).
 */

import { app } from "electron"
import path from "path"

import {
  container,
  ServiceTokens,

  // Platform adapter setters — ProgressEmitter
  setEmitAgentProgressEmitter,
  setAgentSessionTrackerProgressEmitter,
  setMessageQueueServiceProgressEmitter,
  setACPServiceProgressEmitter,
  setACPMainAgentProgressEmitter,
  setLLMProgressEmitter,
  setRemoteServerProgressEmitter,
  setSamplingProgressEmitter,
  setElicitationProgressEmitter,
  setACPBackgroundNotifierProgressEmitter,
  setACPRouterToolsProgressEmitter,
  setInternalAgentProgressEmitter,

  // Platform adapter setters — UserInteraction
  setMCPServiceUserInteraction,
  setElicitationUserInteraction,
  setOAuthClientUserInteraction,
  setBundleServiceUserInteraction,

  // Platform adapter setters — PathResolver
  setMCPServicePathResolver,
  setKittenTTSPathResolver,
  setSupertonicTTSPathResolver,
  setParakeetSTTPathResolver,

  // Platform adapter setters — NotificationService
  setACPBackgroundNotifierNotificationService,

  // Cross-service wiring setters
  setBuiltinToolsSessionTracker,
  setBuiltinToolsMessageQueue,
  setBuiltinToolsEmergencyStop,
  setBuiltinToolsMcpService,
  setBuiltinToolsACPRouter,
  setLLMMemoryService,
  setLLMAgentSessionTracker,
  setLLMConversationService,
  setLLMSkillsService,
  setLLMAgentProfileService,
  setACPMainAgentConversationService,
  setACPBackgroundNotifierSessionTracker,
  setACPBackgroundNotifierRunAgentLoopSession,
  setInternalAgentSessionTracker,
  setBuiltinToolNamesProvider,
  setACPRegistry,
  setProfileBuiltinToolNamesProvider,
  setMCPServiceOAuthFactory,
  setMCPServiceOAuthStorage,
  setRemoteServerConversationService,
  setBundledSkillsPath,
  setLoopRunner,
  setLoopSessionTracker,
  setLoopConversationService,
  setCommandPathResolver,

  // Core service singletons
  agentSessionTracker,
  messageQueueService,
  mcpService,
  memoryService,
  skillsService,
  agentProfileService,
  loopService,
  acpRegistry,
  emergencyStopAll,
  getBuiltinToolNames,
  executeACPRouterTool,
  isACPRouterTool,
  OAuthClient,
} from "@dotagents/core"
import type {
  PathResolver,
  ProgressEmitter,
  UserInteraction,
  NotificationService,
} from "@dotagents/core"

// Import the desktop's conversation service singleton (wired with summarizeContent)
import { conversationService } from "./conversation-service"

import { ElectronPathResolver } from "./adapters/electron-path-resolver"
import {
  ElectronProgressEmitter,
  setProgressEmitterWindowsMap,
} from "./adapters/electron-progress-emitter"
import { ElectronUserInteraction } from "./adapters/electron-user-interaction"
import { ElectronNotificationService } from "./adapters/electron-notification-service"

// ---------------------------------------------------------------------------
// 1. Register platform adapters with the service container
// ---------------------------------------------------------------------------

// PathResolver — may already be registered by config.ts (eagerly imported).
if (!container.has(ServiceTokens.PathResolver)) {
  container.register(ServiceTokens.PathResolver, new ElectronPathResolver())
}

const pathResolver = container.resolve<PathResolver>(ServiceTokens.PathResolver)
const progressEmitter: ProgressEmitter = new ElectronProgressEmitter()
const userInteraction: UserInteraction = new ElectronUserInteraction()
const notificationService: NotificationService = new ElectronNotificationService()

container.register(ServiceTokens.ProgressEmitter, progressEmitter)
container.register(ServiceTokens.UserInteraction, userInteraction)
container.register(ServiceTokens.NotificationService, notificationService)

// ---------------------------------------------------------------------------
// 2. Wire ProgressEmitter into all core services
// ---------------------------------------------------------------------------

setEmitAgentProgressEmitter(progressEmitter)
setAgentSessionTrackerProgressEmitter(progressEmitter)
setMessageQueueServiceProgressEmitter(progressEmitter)
setACPServiceProgressEmitter(progressEmitter)
setACPMainAgentProgressEmitter(progressEmitter)
setLLMProgressEmitter(progressEmitter)
setRemoteServerProgressEmitter(progressEmitter)
setSamplingProgressEmitter(progressEmitter)
setElicitationProgressEmitter(progressEmitter)
setACPBackgroundNotifierProgressEmitter(progressEmitter)
setACPRouterToolsProgressEmitter(progressEmitter)
setInternalAgentProgressEmitter(progressEmitter)

// ---------------------------------------------------------------------------
// 3. Wire UserInteraction into all core services
// ---------------------------------------------------------------------------

setMCPServiceUserInteraction(userInteraction)
setElicitationUserInteraction(userInteraction)
setOAuthClientUserInteraction(userInteraction)
setBundleServiceUserInteraction(userInteraction)

// ---------------------------------------------------------------------------
// 4. Wire PathResolver into all core services
// ---------------------------------------------------------------------------

setMCPServicePathResolver(pathResolver)
setKittenTTSPathResolver(pathResolver)
setSupertonicTTSPathResolver(pathResolver)
setParakeetSTTPathResolver(pathResolver)

// ---------------------------------------------------------------------------
// 5. Wire NotificationService
// ---------------------------------------------------------------------------

setACPBackgroundNotifierNotificationService(notificationService)

// ---------------------------------------------------------------------------
// 6. Wire cross-service dependencies (circular dep breaking)
// ---------------------------------------------------------------------------

// Builtin tools need access to several services.
// Use 'as any' for structural type mismatches between full service types
// and the minimal interfaces expected by the setter functions.
// These are safe at runtime — the services satisfy the required behavior.
setBuiltinToolsSessionTracker(agentSessionTracker as any)
setBuiltinToolsMessageQueue(messageQueueService as any)
setBuiltinToolsEmergencyStop(emergencyStopAll)
setBuiltinToolsMcpService(mcpService as any)
setBuiltinToolsACPRouter({ executeACPRouterTool, isACPRouterTool })

// LLM engine needs services
setLLMMemoryService(memoryService as any)
setLLMAgentSessionTracker(agentSessionTracker as any)
setLLMConversationService(conversationService as any)
setLLMSkillsService(skillsService as any)
setLLMAgentProfileService(agentProfileService as any)

// ACP services
setACPMainAgentConversationService(conversationService as any)
setACPBackgroundNotifierSessionTracker(agentSessionTracker as any)
setInternalAgentSessionTracker(agentSessionTracker as any)

// Agent profile service needs builtin tool names and ACP registry
setBuiltinToolNamesProvider(getBuiltinToolNames)
setACPRegistry(acpRegistry as any)
setProfileBuiltinToolNamesProvider(getBuiltinToolNames)

// Remote server needs conversation service
setRemoteServerConversationService(conversationService as any)

// Loop service needs runner, session tracker, and conversation service
setLoopSessionTracker(agentSessionTracker as any)
setLoopConversationService(conversationService as any)

// Command verification needs a path resolver with resolveCommandPath
setCommandPathResolver({
  resolveCommandPath: async (cmd: string) => {
    const { execSync } = await import("child_process")
    try {
      return execSync(`which ${cmd}`, { encoding: "utf8" }).trim()
    } catch {
      return cmd
    }
  },
})

// Skills service — set bundled skills path (from app resources)
const bundledSkillsDir = app.isPackaged
  ? path.join(process.resourcesPath!, "bundled-skills")
  : path.join(app.getAppPath(), "resources", "bundled-skills")
setBundledSkillsPath(bundledSkillsDir)

// ---------------------------------------------------------------------------
// 7. Wire OAuth factory for MCP service
// ---------------------------------------------------------------------------

// The MCP service needs an OAuth client factory and storage.
// The factory receives (baseUrl, oauthConfig) and returns an MCPOAuthClient.
setMCPServiceOAuthFactory((baseUrl: string, config: any) => {
  return new OAuthClient(baseUrl, config) as any
})

// OAuth storage is Electron-specific (uses safeStorage). Set lazily.
// This is done via a dynamic import to avoid loading electron safeStorage too early.
import("./oauth-storage").then((mod) => {
  setMCPServiceOAuthStorage(mod.oauthStorage)
}).catch(() => {
  // OAuth storage unavailable — MCP OAuth features won't work
})

// ---------------------------------------------------------------------------
// Exports for desktop-specific wiring (called later by index.ts or tipc.ts)
// ---------------------------------------------------------------------------

/**
 * Finalize wiring that depends on runtime state (e.g., WINDOWS map).
 * Must be called after BrowserWindows are created.
 */
export function finalizeProgressEmitterWiring(windowsMap: Map<string, any>): void {
  setProgressEmitterWindowsMap(windowsMap)
}

/**
 * Wire the loop runner callback. This depends on tipc's processWithAgentMode,
 * so it must be called after tipc is loaded.
 */
export function wireLoopRunner(
  runner: (prompt: string, conversationId: string, sessionId: string) => Promise<void>,
): void {
  setLoopRunner(runner)
}

/**
 * Wire the ACP background notifier's runAgentLoopSession callback.
 * Depends on tipc's runAgentLoopSession, so it must be called after tipc is loaded.
 */
export function wireACPBackgroundNotifierRunner(
  fn: (text: string, conversationId: string, existingSessionId: string) => Promise<string>,
): void {
  // Wrap to match RunAgentLoopSessionFn signature (returns Promise<void>)
  setACPBackgroundNotifierRunAgentLoopSession(async (prompt, conversationId, sessionId) => {
    await fn(prompt, conversationId, sessionId)
  })
}

/**
 * Wire the system prompt additions callback for the LLM engine.
 * Depends on ACP service state, so must be called after ACP initialization.
 */
export { setSystemPromptAdditionsFn } from "@dotagents/core"
