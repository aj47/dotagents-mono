import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type {
  RemoteServerController as SharedRemoteServerController,
  RemoteServerControllerAdapters as SharedRemoteServerControllerAdapters,
  RemoteServerControllerConfigLike,
  RemoteServerControllerOptions as SharedRemoteServerControllerOptions,
  RemoteServerConfigStore as SharedRemoteServerConfigStore,
  RemoteServerDiagnostics,
  RemoteServerRouteContext as SharedRemoteServerRouteContext,
  RemoteServerRouteRegistrar as SharedRemoteServerRouteRegistrar,
  RemoteServerRunAgentExecutor,
  StartRemoteServerOptions,
  StartRemoteServerResult,
} from "@dotagents/shared/remote-server-controller-contracts"
import type { RemoteServerLifecycleAction } from "@dotagents/shared/remote-pairing"
import {
  buildRemoteServerBaseUrl,
  buildRemoteServerStatusSnapshot,
  DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
  DEFAULT_REMOTE_SERVER_PORT,
  ensureRemoteServerV1BaseUrl,
  getRemoteServerPairingApiKey as getRemoteServerPairingApiKeyFromConfig,
  getRemoteServerStartupPlan,
  shouldAutoPrintRemoteServerPairingQr,
} from "@dotagents/shared/remote-pairing"

export type {
  RemoteServerDiagnostics,
  RemoteServerRunAgentExecutor,
  StartRemoteServerOptions,
  StartRemoteServerResult,
}

export type RemoteServerControllerConfig = RemoteServerControllerConfigLike
export type RemoteServerConfigStore = SharedRemoteServerConfigStore<RemoteServerControllerConfig>
export type RemoteServerControllerAdapters = SharedRemoteServerControllerAdapters<
  FastifyRequest,
  FastifyReply,
  RemoteServerControllerConfig,
  FastifyInstance
>
export type RemoteServerControllerOptions = SharedRemoteServerControllerOptions<
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  RemoteServerControllerConfig
>
export type RemoteServerRouteContext = SharedRemoteServerRouteContext<FastifyReply>
export type RemoteServerRouteRegistrar = SharedRemoteServerRouteRegistrar<FastifyInstance, FastifyReply>
export type RemoteServerController = SharedRemoteServerController

export function createRemoteServerController(options: RemoteServerControllerOptions): RemoteServerController {
  const {
    configStore,
    diagnosticsService,
    registerRoutes,
    adapters,
    providerSecretMask,
    remoteServerSecretMask,
    discordSecretMask,
    langfuseSecretMask,
    getAppVersion,
    isHeadlessEnvironment,
    relaunchApp,
    quitApp,
    runAgent,
    notifyConversationHistoryChanged,
  } = options

  let server: FastifyInstance | null = null
  let lastError: string | undefined

  function scheduleTaskAfterReply(
    reply: FastifyReply,
    description: string,
    task: () => Promise<void> | void,
  ): void {
    adapters.scheduleTaskAfterReply(reply, () => {
      void Promise.resolve(task()).catch((error) => {
        diagnosticsService.logError("remote-server", `Failed to ${description}`, error)
      })
    })
  }

  function scheduleRemoteServerLifecycleActionAfterReply(
    reply: FastifyReply,
    action: RemoteServerLifecycleAction,
  ): void {
    if (action === "noop") {
      return
    }

    scheduleTaskAfterReply(reply, `apply remote server lifecycle action (${action})`, async () => {
      if (action === "start") {
        await startRemoteServer()
        return
      }

      if (action === "stop") {
        await stopRemoteServer()
        return
      }

      await restartRemoteServer()
    })
  }

  function scheduleRemoteServerRestartFromOperator(): void {
    adapters.scheduleDelayedTask(50, () => {
      void restartRemoteServer().catch((error) => {
        diagnosticsService.logError(
          "remote-server",
          "Failed to restart remote server from operator action",
          error,
        )
      })
    }, 50)
  }

  function scheduleAppRestartFromOperator(): void {
    adapters.scheduleDelayedTask(100, () => {
      try {
        relaunchApp()
        quitApp()
      } catch (error) {
        diagnosticsService.logError(
          "remote-server",
          "Failed to restart app from operator action",
          error,
        )
      }
    }, 100)
  }

  async function startRemoteServerForced(controllerOptions: { bindAddressOverride?: string } = {}): Promise<StartRemoteServerResult> {
    return startRemoteServerInternal({
      forceEnabled: true,
      skipAutoPrintQR: true,
      bindAddressOverride: controllerOptions.bindAddressOverride,
    })
  }

  async function startRemoteServer(): Promise<StartRemoteServerResult> {
    return startRemoteServerInternal({ forceEnabled: false, skipAutoPrintQR: false })
  }

  async function startRemoteServerInternal(controllerOptions: StartRemoteServerOptions = {}): Promise<StartRemoteServerResult> {
    const { forceEnabled = false, skipAutoPrintQR = false, bindAddressOverride } = controllerOptions
    const cfg = configStore.get()
    const startupPlan = getRemoteServerStartupPlan(cfg, {
      forceEnabled,
      bindAddressOverride,
      resolveApiKey: adapters.resolveApiKeyReference,
    })

    if (!startupPlan.shouldStart) {
      diagnosticsService.logInfo(
        "remote-server",
        "Remote server not enabled in config; skipping start",
      )
      return { running: false }
    }

    if (startupPlan.apiKeyAction === "generate") {
      // Generate API key on first enable
      const key = adapters.generateApiKey()
      configStore.save({ ...cfg, remoteServerApiKey: key })
    } else if (startupPlan.apiKeyAction === "warn-unresolved") {
      diagnosticsService.logWarning(
        "remote-server",
        "Remote server API key is configured but could not be resolved; preserving configured value",
      )
    }

    if (server) {
      diagnosticsService.logInfo(
        "remote-server",
        "Remote server already running; restarting",
      )
      await stopRemoteServer()
    }

    lastError = undefined
    const { logLevel, bind, port } = startupPlan

    const httpServer = await adapters.createHttpServer({
      logLevel,
      // Fastify defaults the body limit to 1MB, which is too small for chat requests that
      // include long conversation histories. Raise it to 50MB to accommodate large payloads
      // (mobile clients send the full message history on each /v1/chat/completions call).
      bodyLimitBytes: 50 * 1024 * 1024,
      corsOrigins: startupPlan.corsOrigins,
    })

    // Auth hook (skip for OPTIONS preflight requests)
    await adapters.addRequestHook(httpServer, async (req, reply) => {
      const current = configStore.get()
      const authDecision = adapters.authorizeRequest(req, {
        currentApiKey: adapters.resolveConfiguredApiKey(current),
        trustedDeviceIds: current.remoteServerOperatorAllowDeviceIds ?? [],
      })

      if (authDecision.ok === false) {
        if (authDecision.auditFailureReason) {
          adapters.recordRejectedOperatorDeviceAttempt(req, authDecision.auditFailureReason)
        }

        adapters.sendAuthFailure(reply, {
          statusCode: authDecision.statusCode,
          error: authDecision.error,
        })
        // Must return — falling through here lets the request reach the route
        // handler and perform side effects despite operator access being denied.
        return
      }

      return
    })

    await adapters.addResponseHook(httpServer, async (req, reply) => {
      adapters.recordOperatorResponseAuditEvent(req, reply)
    })

    registerRoutes(httpServer, {
      providerSecretMask,
      remoteServerSecretMask,
      discordSecretMask,
      langfuseSecretMask,
      getRemoteServerStatus,
      getAppVersion,
      runAgent,
      notifyConversationHistoryChanged,
      scheduleRemoteServerLifecycleActionAfterReply,
      scheduleRemoteServerRestartFromOperator,
      scheduleAppRestartFromOperator,
      scheduleRemoteServerRestartAfterReply: (reply) => {
        scheduleTaskAfterReply(reply, "restart remote server after API key rotation", async () => {
          await restartRemoteServer()
        })
      },
    })

    try {
      await adapters.listenHttpServer(httpServer, { port, host: bind })
      diagnosticsService.logInfo(
        "remote-server",
        `Remote server listening at ${buildRemoteServerBaseUrl(bind, port)}`,
      )
      server = httpServer

      // Print QR code to terminal for mobile app pairing
      // Auto-print in headless environments, or when explicitly requested
      // Skip if caller handles QR printing separately (e.g., --qr mode)
      // Suppress when streamer mode is enabled to prevent credential leakage
      const currentCfg = configStore.get()
      const currentApiKey = adapters.resolveConfiguredApiKey(currentCfg)
      if (shouldAutoPrintRemoteServerPairingQr({
        skipAutoPrintQR,
        apiKey: currentApiKey,
        streamerModeEnabled: currentCfg.streamerModeEnabled,
        headlessEnvironment: isHeadlessEnvironment(),
        terminalQrEnabled: currentCfg.remoteServerTerminalQrEnabled,
      })) {
        const serverUrl = adapters.getConnectableBaseUrlForMobilePairing(bind, port)
        if (serverUrl) {
          await adapters.printTerminalQRCode(serverUrl, currentApiKey)
        } else {
          adapters.writeTerminalWarning(
            `[Remote Server] Warning: Could not resolve a LAN-reachable URL for bind ${bind}. Skipping terminal QR code output.`,
          )
        }
      }

      return { running: true, bind, port }
    } catch (err: any) {
      lastError = err?.message || String(err)
      diagnosticsService.logError("remote-server", "Failed to start server", err)
      server = null
      return { running: false, error: lastError }
    }
  }

  async function stopRemoteServer() {
    if (server) {
      try {
        await adapters.closeHttpServer(server)
        diagnosticsService.logInfo("remote-server", "Remote server stopped")
      } catch (err) {
        diagnosticsService.logError("remote-server", "Error stopping server", err)
      } finally {
        server = null
      }
    }
  }

  async function restartRemoteServer(): Promise<StartRemoteServerResult> {
    await stopRemoteServer()
    return startRemoteServer()
  }

  function getRemoteServerStatus() {
    const cfg = configStore.get()
    const bind = cfg.remoteServerBindAddress || DEFAULT_REMOTE_SERVER_BIND_ADDRESS
    const port = cfg.remoteServerPort || DEFAULT_REMOTE_SERVER_PORT
    const running = !!server
    return buildRemoteServerStatusSnapshot({
      running,
      bind,
      port,
      lastError,
      addresses: running ? adapters.getNetworkAddresses() : undefined,
    })
  }

  function getRemoteServerPairingApiKey(): string {
    const cfg = configStore.get()
    return getRemoteServerPairingApiKeyFromConfig(cfg, adapters.resolveApiKeyReference)
  }

  async function printQRCodeToTerminal(urlOverride?: string): Promise<boolean> {
    const cfg = configStore.get()
    const apiKey = adapters.resolveConfiguredApiKey(cfg)
    if (!server || !apiKey) {
      adapters.writeTerminalInfo(
        "[Remote Server] Cannot print QR code: server not running or no API key configured",
      )
      return false
    }

    // Suppress QR output when streamer mode is enabled to prevent credential leakage
    if (cfg.streamerModeEnabled) {
      adapters.writeTerminalInfo("[Remote Server] Cannot print QR code: streamer mode is enabled")
      return false
    }

    let serverUrl: string
    if (urlOverride) {
      // Use the override URL (e.g., Cloudflare tunnel URL)
      serverUrl = ensureRemoteServerV1BaseUrl(urlOverride)
    } else {
      const bind = cfg.remoteServerBindAddress || DEFAULT_REMOTE_SERVER_BIND_ADDRESS
      const port = cfg.remoteServerPort || DEFAULT_REMOTE_SERVER_PORT
      const connectableBaseUrl = adapters.getConnectableBaseUrlForMobilePairing(bind, port)
      if (!connectableBaseUrl) {
        adapters.writeTerminalInfo(
          "[Remote Server] Cannot print QR code: unable to resolve a LAN-reachable URL for the current bind address",
        )
        return false
      }
      serverUrl = connectableBaseUrl
    }

    // Return the actual result from printTerminalQRCode to indicate success/failure
    return await adapters.printTerminalQRCode(serverUrl, apiKey)
  }

  return {
    startRemoteServerForced,
    startRemoteServer,
    stopRemoteServer,
    restartRemoteServer,
    getRemoteServerStatus,
    getRemoteServerPairingApiKey,
    printQRCodeToTerminal,
  }
}
