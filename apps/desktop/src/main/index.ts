import { app, Menu } from "electron"
import { electronApp, optimizer } from "@electron-toolkit/utils"
import {
  createMainWindow,
  createPanelWindow,
  createSetupWindow,
  makePanelWindowClosable,
  showMainWindow,
  setAppQuitting,
  WINDOWS,
} from "./window"
import { listenToKeyboardEvents } from "./keyboard"
import { registerIpcMain } from "@egoist/tipc/main"
import { router } from "./tipc"
import { registerServeProtocol, registerServeSchema } from "./serve"
import { createAppMenu } from "./menu"
import { initTray } from "./tray"
import { isAccessibilityGranted } from "./utils"
import { mcpService } from "./mcp-service"
import { initDebugFlags, logApp } from "./debug"
import { initializeDeepLinkHandling } from "./oauth-deeplink-handler"
import { diagnosticsService } from "./diagnostics"
import { ensureAppSwitcherPresence } from "./app-switcher"

import { configStore } from "./config"
import {
  startRemoteServer,
  printQRCodeToTerminal,
  startRemoteServerForced,
  stopRemoteServer,
} from "./remote-server"
import { acpService } from "./acp-service"
import { agentProfileService } from "./agent-profile-service"
import { initializeBundledSkills, skillsService, startSkillsFolderWatcher } from "./skills-service"
import {
  startCloudflareTunnel,
  startNamedCloudflareTunnel,
  checkCloudflaredInstalled,
} from "./cloudflare-tunnel"
import { initModelsDevService } from "./models-dev-service"
import { loopService } from "./loop-service"
import { setHeadlessMode } from "./state"
import { findHubBundleHandoffFilePath } from "./bundle-service"
import { downloadHubBundleToTempFile, findHubBundleInstallBundleUrl } from "./hub-install"
import { buildHubBundleInstallUrl, resolveStartupMainWindowDecision } from "./startup-routing"

// Check for --qr flag (headless mode with QR code)
const isQRMode = process.argv.includes("--qr")
// Check for --headless flag (headless mode without GUI)
const isHeadlessMode = process.argv.includes("--headless")
const CLEANUP_TIMEOUT_MS = 5000 // 5 second timeout for graceful cleanup

// Enable CDP remote debugging port if REMOTE_DEBUGGING_PORT env variable is set
// This must be called before app.whenReady()
// Usage: REMOTE_DEBUGGING_PORT=9222 pnpm dev
if (process.env.REMOTE_DEBUGGING_PORT) {
  app.commandLine.appendSwitch('remote-debugging-port', process.env.REMOTE_DEBUGGING_PORT)
}

// Linux/Wayland GPU compatibility fixes
// These must be set before app.whenReady()
if (process.platform === 'linux') {
  // Enable Ozone platform for native Wayland support
  app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform,WaylandWindowDecorations')
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto')
  // Disable GPU acceleration to avoid GBM/EGL issues on some Wayland compositors
  app.commandLine.appendSwitch('disable-gpu')
  // Use software rendering
  app.commandLine.appendSwitch('disable-software-rasterizer')
}

registerServeSchema()

let pendingHubBundleHandoffPath = findHubBundleHandoffFilePath(process.argv)
const startupHubBundleInstallUrl = pendingHubBundleHandoffPath
  ? null
  : findHubBundleInstallBundleUrl(process.argv)

function openPendingHubBundleInstall(): boolean {
  if (!pendingHubBundleHandoffPath) return false
  if (!isAccessibilityGranted()) {
    logApp("[hub-install] Accessibility not granted; deferring bundle install handoff", {
      filePath: pendingHubBundleHandoffPath,
    })
    return false
  }

  const installUrl = buildHubBundleInstallUrl(pendingHubBundleHandoffPath)
  pendingHubBundleHandoffPath = null
  showMainWindow(installUrl)
  return true
}

function queueHubBundleInstall(
  filePath: string | null | undefined,
  options: { openIfReady?: boolean } = {},
): boolean {
  const { openIfReady = true } = options
  const resolvedPath = filePath ? findHubBundleHandoffFilePath([filePath]) : null
  if (!resolvedPath) return false

  pendingHubBundleHandoffPath = resolvedPath
  logApp("[hub-install] Queued Hub bundle install handoff", { filePath: resolvedPath })

  if (openIfReady && app.isReady()) {
    openPendingHubBundleInstall()
  }

  return true
}

async function queueHubBundleInstallFromUrl(
  bundleUrl: string,
  options: { openIfReady?: boolean } = {},
): Promise<boolean> {
  try {
    logApp("[hub-install] Downloading Hub bundle", { bundleUrl })
    const downloadedPath = await downloadHubBundleToTempFile(bundleUrl)
    return queueHubBundleInstall(downloadedPath, options)
  } catch (error) {
    logApp("[hub-install] Failed to download Hub bundle", {
      bundleUrl,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

function handleHubBundleInstallCandidates(candidates: readonly string[]): Promise<boolean> {
  const bundlePath = findHubBundleHandoffFilePath(candidates)
  if (bundlePath) {
    return Promise.resolve(queueHubBundleInstall(bundlePath))
  }

  const bundleUrl = findHubBundleInstallBundleUrl(candidates)
  if (!bundleUrl) {
    return Promise.resolve(false)
  }

  return queueHubBundleInstallFromUrl(bundleUrl)
}

app.on("open-file", (event, filePath) => {
  event.preventDefault()
  queueHubBundleInstall(filePath)
})

app.on("open-url", (event, url) => {
  event.preventDefault()
  void handleHubBundleInstallCandidates([url])
})

app.on("second-instance", (_event, commandLine) => {
  void handleHubBundleInstallCandidates(commandLine)
})

app.whenReady().then(async () => {
  initDebugFlags(process.argv)
  logApp("DotAgents starting up...")

  if (startupHubBundleInstallUrl) {
    await queueHubBundleInstallFromUrl(startupHubBundleInstallUrl, { openIfReady: false })
  }

  // Handle --qr mode: start remote server, start tunnel, print QR code, run headlessly
  if (isQRMode) {
    logApp("Running in --qr mode (headless with QR code)")

    // Hide dock icon on macOS for headless mode
    if (process.platform === "darwin" && app.dock) {
      app.dock.hide()
    }

    try {
      // Start remote server (force enabled for --qr mode, bypassing config check)
      const serverResult = await startRemoteServerForced()
      if (!serverResult.running) {
        console.error("[QR Mode] Failed to start remote server:", serverResult.error || "Unknown error")
        process.exit(1)
      }
      logApp("Remote server started in --qr mode")

      // Start Cloudflare tunnel for remote access
      const cfg = configStore.get()
      let tunnelUrl: string | undefined

      // Check if cloudflared is installed
      const cloudflaredInstalled = await checkCloudflaredInstalled()
      if (!cloudflaredInstalled) {
        console.log("[QR Mode] cloudflared not installed - QR code will use local address")
        console.log("[QR Mode] Install cloudflared for remote access: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/")
      } else {
        // Prefer named tunnel if configured, otherwise use quick tunnel
        const tunnelMode = cfg.cloudflareTunnelMode || "quick"

        if (tunnelMode === "named" && cfg.cloudflareTunnelId && cfg.cloudflareTunnelHostname) {
          console.log("[QR Mode] Starting named Cloudflare tunnel...")
          const result = await startNamedCloudflareTunnel({
            tunnelId: cfg.cloudflareTunnelId,
            hostname: cfg.cloudflareTunnelHostname,
            credentialsPath: cfg.cloudflareTunnelCredentialsPath || undefined,
          })
          if (result.success && result.url) {
            tunnelUrl = result.url
            logApp(`Named tunnel started: ${tunnelUrl}`)
          } else {
            console.error(`[QR Mode] Named tunnel failed: ${result.error}`)
            console.log("[QR Mode] Falling back to quick tunnel...")
          }
        }

        // If named tunnel wasn't used or failed, try quick tunnel
        if (!tunnelUrl) {
          console.log("[QR Mode] Starting Cloudflare quick tunnel...")
          const result = await startCloudflareTunnel()
          if (result.success && result.url) {
            tunnelUrl = result.url
            logApp(`Quick tunnel started: ${tunnelUrl}`)
          } else {
            console.error(`[QR Mode] Quick tunnel failed: ${result.error}`)
            console.log("[QR Mode] QR code will use local address instead")
          }
        }
      }

      // Print QR code to terminal (with tunnel URL if available)
      const printed = await printQRCodeToTerminal(tunnelUrl)
      if (!printed) {
        console.error("[QR Mode] Failed to print QR code. Ensure remoteServerApiKey is configured.")
        console.log("[QR Mode] You can set an API key in the config or run the app normally first.")
      }

      console.log("[QR Mode] Server running. Press Ctrl+C to exit.")
    } catch (err) {
      console.error("[QR Mode] Failed to start remote server:", err instanceof Error ? err.message : String(err))
      process.exit(1)
    }

    // Keep the process running - don't create any windows
    return
  }

  // Handle --headless mode: initialize services and start CLI without any GUI
  if (isHeadlessMode) {
    setHeadlessMode(true)
    logApp("Running in --headless mode")

    // Hide dock icon on macOS for headless mode
    if (process.platform === "darwin" && app.dock) {
      app.dock.hide()
    }

    // Register IPC infrastructure (needed for remote-server agent execution)
    registerIpcMain(router)
    logApp("IPC main registered (headless)")

    // Register serve protocol (safe in headless mode)
    registerServeProtocol()
    logApp("Serve protocol registered (headless)")

    let isHeadlessShuttingDown = false
    const gracefulShutdown = async (exitCode: number) => {
      if (isHeadlessShuttingDown) return
      isHeadlessShuttingDown = true
      console.log("\n[Headless] Shutting down...")
      loopService.stopAllLoops()

      const cleanupTasks = [
        { label: "ACP service shutdown", run: () => acpService.shutdown() },
        { label: "MCP service cleanup", run: () => mcpService.cleanup() },
        { label: "remote server shutdown", run: () => stopRemoteServer() },
      ] as const

      const cleanupPromise = Promise.all(
        cleanupTasks.map(async ({ label, run }) => {
          try {
            await run()
          } catch (error) {
            console.error(`[Headless] Error during ${label}:`, error)
          }
        })
      )

      let timeoutId: ReturnType<typeof setTimeout> | undefined
      try {
        await Promise.race([
          cleanupPromise,
          new Promise<void>((_, reject) => {
            const id = setTimeout(
              () => reject(new Error("Headless cleanup timeout")),
              CLEANUP_TIMEOUT_MS
            )
            timeoutId = id
            // unref() ensures this timer won't keep the event loop alive
            // if cleanup finishes quickly (only available in Node.js)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (id && typeof (id as any).unref === "function") {
              (id as any).unref()
            }
          }),
        ])
      } catch (error) {
        logApp("Error during headless cleanup:", error)
      } finally {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId)
        }
      }

      process.exit(exitCode)
    }

    process.on("SIGTERM", () => {
      void gracefulShutdown(0)
    })

    try {
      // Initialize MCP service
      await mcpService.initialize()
      logApp("MCP service initialized (headless)")

      // Start all enabled repeat tasks
      loopService.startAllLoops()
      logApp("Loop service started (headless)")

      // Initialize ACP service
      await acpService.initialize()
      logApp("ACP service initialized (headless)")

      // Sync agent profiles to ACP registry
      try {
        agentProfileService.syncAgentProfilesToACPRegistry()
        logApp("Agent profiles synced to ACP registry (headless)")
      } catch (error) {
        logApp("Failed to sync agent profiles to ACP registry:", error)
      }

      // Initialize bundled skills
      try {
        const skillsResult = initializeBundledSkills()
        logApp(`Bundled skills: ${skillsResult.copied.length} copied, ${skillsResult.skipped.length} skipped (headless)`)
        startSkillsFolderWatcher()
      } catch (error) {
        logApp("Failed to initialize bundled skills:", error)
      }

      // Initialize models.dev service
      initModelsDevService()
      logApp("Models.dev service initialized (headless)")

      // Force-start remote server bound to 0.0.0.0 for external access.
      // Use a runtime override to avoid mutating persisted user config.
      const serverResult = await startRemoteServerForced({ bindAddressOverride: "0.0.0.0" })
      if (!serverResult.running) {
        console.error("[Headless] Failed to start remote server:", serverResult.error || "Unknown error")
        await gracefulShutdown(1)
        return
      }
      logApp("Remote server started on 0.0.0.0 (headless)")

      // Start headless CLI
      const { startHeadlessCLI } = await import("./headless-cli")
      await startHeadlessCLI(async () => {
        await gracefulShutdown(0)
      })

    } catch (err) {
      console.error("[Headless] Failed to initialize:", err instanceof Error ? err.message : String(err))
      await gracefulShutdown(1)
      return
    }

    // Keep the process running - don't create any windows
    return
  }

  initializeDeepLinkHandling()
  logApp("Deep link handling initialized")

  electronApp.setAppUserModelId(process.env.APP_ID)

  const accessibilityGranted = isAccessibilityGranted()
  logApp(`Accessibility granted: ${accessibilityGranted}`)

  Menu.setApplicationMenu(createAppMenu())
  logApp("Application menu created")

  registerIpcMain(router)
  logApp("IPC main registered")

  registerServeProtocol()

	  try {
	    if ((process.env.NODE_ENV === "production" || !process.env.ELECTRON_RENDERER_URL) && process.platform !== "linux") {
	      const cfg = configStore.get()
	      app.setLoginItemSettings({
	        openAtLogin: !!cfg.launchAtLogin,
	        openAsHidden: true,
	      })
	    }
	  } catch (_) {}

	  // Apply hideDockIcon setting on startup (macOS only)
	  if (process.platform === "darwin") {
	    try {
	      const cfg = configStore.get()
	      if (cfg.hideDockIcon) {
	        app.setActivationPolicy("accessory")
	        app.dock.hide()
	        logApp("Dock icon hidden on startup per user preference")
	      } else {
	        // Ensure dock is visible when hideDockIcon is false
	        // This handles the case where dock state persisted from a previous session
	        app.dock.show()
	        app.setActivationPolicy("regular")
	        logApp("Dock icon shown on startup per user preference")
	      }
	    } catch (e) {
	      logApp("Failed to apply hideDockIcon on startup:", e)
	    }
	  }


  logApp("Serve protocol registered")

  if (accessibilityGranted) {
    const cfg = configStore.get()
    const launchDecision = resolveStartupMainWindowDecision(cfg, pendingHubBundleHandoffPath)

    createMainWindow(launchDecision.url ? { url: launchDecision.url } : undefined)

    if (launchDecision.reason === "onboarding") {
      logApp("Main window created (showing onboarding)")
    } else if (launchDecision.reason === "hub-install") {
      logApp("Main window created (opening Hub bundle install)", {
        filePath: pendingHubBundleHandoffPath,
      })
    } else {
      logApp("Main window created")
    }

    if (launchDecision.consumedPendingHubBundle) {
      pendingHubBundleHandoffPath = null
    }
  } else {
    createSetupWindow()
    logApp("Setup window created (accessibility not granted)")
  }

  createPanelWindow()
  logApp("Panel window created")

  listenToKeyboardEvents()
  logApp("Keyboard event listener started")

  initTray()
  logApp("System tray initialized")

  mcpService
    .initialize()
    .then(() => {
      logApp("MCP service initialized successfully")
    })
    .catch((error) => {
      diagnosticsService.logError(
        "mcp-service",
        "Failed to initialize MCP service on startup",
        error
      )
      logApp("Failed to initialize MCP service on startup:", error)
    })

  // Start all enabled repeat tasks
  try {
    loopService.startAllLoops()
    logApp("Repeat tasks started")
  } catch (error) {
    logApp("Failed to start repeat tasks:", error)
  }

  // Initialize models.dev service (fetches model metadata in background)
  initModelsDevService()
  logApp("Models.dev service initialization started")

  // Initialize ACP service (spawns auto-start agents)
  acpService
    .initialize()
    .then(() => {
      logApp("ACP service initialized successfully")

      // Sync agent profiles to ACP registry (unified service - preferred)
      try {
        agentProfileService.syncAgentProfilesToACPRegistry()
        logApp("Agent profiles synced to ACP registry")
      } catch (error) {
        logApp("Failed to sync agent profiles to ACP registry:", error)
      }


    })
    .catch((error) => {
      logApp("Failed to initialize ACP service:", error)
    })

  // Initialize bundled skills (copy from app resources to .agents/skills/ if needed)
  try {
    const skillsResult = initializeBundledSkills()
    logApp(`Bundled skills: ${skillsResult.copied.length} copied, ${skillsResult.skipped.length} skipped`)

    // Start watching .agents/skills/ for changes (auto-refresh without app restart)
    startSkillsFolderWatcher()
  } catch (error) {
    logApp("Failed to initialize bundled skills:", error)
  }

		  try {
		    const cfg = configStore.get()
		    if (cfg.remoteServerEnabled) {
		      startRemoteServer()
		        .then(async (result) => {
		          if (!result.running) {
		            logApp(`Remote server failed to start: ${result.error || "Unknown error"}`)
		            return
		          }

		          logApp("Remote server started")

		          // Auto-start Cloudflare tunnel if enabled
		          // Wrapped in try/catch to isolate tunnel errors from remote server startup reporting
		          if (cfg.cloudflareTunnelAutoStart) {
		            try {
	              const cloudflaredInstalled = await checkCloudflaredInstalled()
	              if (!cloudflaredInstalled) {
	                logApp("Cloudflare tunnel auto-start skipped: cloudflared not installed")
	                return
	              }

	              const tunnelMode = cfg.cloudflareTunnelMode || "quick"

	              if (tunnelMode === "named") {
	                // For named tunnels, we need tunnel ID and hostname
	                if (!cfg.cloudflareTunnelId || !cfg.cloudflareTunnelHostname) {
	                  logApp("Cloudflare tunnel auto-start skipped: named tunnel requires tunnel ID and hostname")
	                  return
	                }
	                startNamedCloudflareTunnel({
	                  tunnelId: cfg.cloudflareTunnelId,
	                  hostname: cfg.cloudflareTunnelHostname,
	                  credentialsPath: cfg.cloudflareTunnelCredentialsPath || undefined,
	                })
	                  .then((result) => {
	                    if (result.success) {
	                      logApp(`Cloudflare named tunnel started: ${result.url}`)
	                    } else {
	                      logApp(`Cloudflare named tunnel failed to start: ${result.error}`)
	                    }
	                  })
	                  .catch((err) =>
	                    logApp(`Cloudflare named tunnel error: ${err instanceof Error ? err.message : String(err)}`)
	                  )
	              } else {
	                // Quick tunnel
	                startCloudflareTunnel()
	                  .then((result) => {
	                    if (result.success) {
	                      logApp(`Cloudflare quick tunnel started: ${result.url}`)
	                    } else {
	                      logApp(`Cloudflare quick tunnel failed to start: ${result.error}`)
	                    }
	                  })
	                  .catch((err) =>
	                    logApp(`Cloudflare quick tunnel error: ${err instanceof Error ? err.message : String(err)}`)
	                  )
	              }
	            } catch (err) {
	              logApp(`Cloudflare tunnel auto-start error: ${err instanceof Error ? err.message : String(err)}`)
	            }
	          }
	        })
	        .catch((err) =>
	          logApp(
	            `Remote server failed to start: ${err instanceof Error ? err.message : String(err)}`,
	          ),
	        )
	    }
	  } catch (_e) {}



  import("./updater").then((res) => res.init()).catch(console.error)

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  app.on("activate", function () {
    const mainWin = WINDOWS.get("main")
    const cfg = configStore.get()

    if (process.platform === "darwin" && !cfg.hideDockIcon) {
      ensureAppSwitcherPresence("app.activate")
    }

    if (accessibilityGranted) {
      if (mainWin) {
        // Window exists (may be hidden/minimized/behind another app).
        // Prefer opening any queued Hub install; otherwise restore and focus the main window.
        if (!openPendingHubBundleInstall()) {
          showMainWindow()
        }
      } else {
        const launchDecision = resolveStartupMainWindowDecision(cfg, pendingHubBundleHandoffPath)

        createMainWindow(launchDecision.url ? { url: launchDecision.url } : undefined)
        if (launchDecision.consumedPendingHubBundle) {
          pendingHubBundleHandoffPath = null
        }
      }
    } else {
      if (!WINDOWS.get("setup")) {
        createSetupWindow()
      }
    }
  })

  // Track if we're already cleaning up to prevent re-entry
  let isCleaningUp = false
  app.on("before-quit", async (event) => {
    setAppQuitting()
    makePanelWindowClosable()

    // Prevent re-entry during cleanup
    if (isCleaningUp) {
      return
    }

    // Prevent the quit from happening immediately so we can wait for cleanup
    event.preventDefault()
    isCleaningUp = true
    loopService.stopAllLoops()

    // Wait for long-lived child services to stop so quit does not leave behind
    // ACP child processes or a lingering local remote-server listener.
    const cleanupTasks = [
      { label: "ACP service shutdown", run: () => acpService.shutdown() },
      { label: "MCP service cleanup", run: () => mcpService.cleanup() },
      { label: "remote server shutdown", run: () => stopRemoteServer() },
    ] as const

    const cleanupPromise = Promise.all(
      cleanupTasks.map(async ({ label, run }) => {
        try {
          await run()
        } catch (error) {
          console.error(`[App] Error during ${label}:`, error)
        }
      })
    )

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([
        cleanupPromise,
        new Promise<void>((_, reject) => {
          const id = setTimeout(
            () => reject(new Error("App cleanup timeout")),
            CLEANUP_TIMEOUT_MS
          )
          timeoutId = id
          // unref() ensures this timer won't keep the event loop alive
          // if cleanup finishes quickly (only available in Node.js)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (id && typeof (id as any).unref === "function") {
            (id as any).unref()
          }
        }),
      ])
    } catch (error) {
      logApp("Error during app cleanup on quit:", error)
    } finally {
      // Clear the timeout to avoid any lingering references
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
    }

    // Now actually quit the app
    app.quit()
  })
})

app.on("window-all-closed", () => {
  // Don't quit in --qr or --headless mode (headless server)
  if (isQRMode || isHeadlessMode) {
    return
  }
  if (process.platform !== "darwin") {
    app.quit()
  }
})
