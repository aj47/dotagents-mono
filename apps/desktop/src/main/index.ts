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
import {
  listenToKeyboardEvents,
  stopListeningToKeyboardEvents,
} from "./keyboard"
import { registerServeSchema } from "./serve"
import { createAppMenu } from "./menu"
import { destroyTray, initTray } from "./tray"
import { isAccessibilityGranted } from "./utils"
import { mcpService } from "./mcp-service"
import { initDebugFlags, logApp } from "./debug"
import { launchSharedHeadlessMode } from "./headless-runtime"
import { initializeDeepLinkHandling } from "./oauth-deeplink-handler"
import { diagnosticsService } from "./diagnostics"
import { ensureAppSwitcherPresence } from "./app-switcher"

import { configStore } from "./config"
import { printQRCodeToTerminal } from "./remote-server"
import {
  startSharedRemoteAccessRuntime,
  syncConfiguredRemoteAccess,
} from "./remote-access-runtime"
import {
  initializeSharedRuntimeServices,
  registerSharedMainProcessInfrastructure,
  shutdownSharedRuntimeServices,
} from "./app-runtime"
import { findHubBundleHandoffFilePath } from "./bundle-service"
import {
  downloadHubBundleToTempFile,
  findHubBundleInstallBundleUrl,
} from "./hub-install"
import {
  buildHubBundleInstallUrl,
  resolveStartupMainWindowDecision,
} from "./startup-routing"

// Check for --qr flag (headless mode with QR code)
const isQRMode = process.argv.includes("--qr")
// Check for --headless flag (headless mode without GUI)
const isHeadlessMode = process.argv.includes("--headless")
const isNoGuiMode = isQRMode || isHeadlessMode

// Enable CDP remote debugging port if REMOTE_DEBUGGING_PORT env variable is set
// This must be called before app.whenReady()
// Usage: REMOTE_DEBUGGING_PORT=9222 pnpm dev
if (process.env.REMOTE_DEBUGGING_PORT) {
  app.commandLine.appendSwitch(
    "remote-debugging-port",
    process.env.REMOTE_DEBUGGING_PORT,
  )
}

// Linux/Wayland GPU compatibility fixes
// These must be set before app.whenReady()
if (process.platform === "linux") {
  // Enable Ozone platform for native Wayland support
  app.commandLine.appendSwitch(
    "enable-features",
    "UseOzonePlatform,WaylandWindowDecorations",
  )
  app.commandLine.appendSwitch("ozone-platform-hint", "auto")
  // Disable GPU acceleration to avoid GBM/EGL issues on some Wayland compositors
  app.commandLine.appendSwitch("disable-gpu")
  // Use software rendering
  app.commandLine.appendSwitch("disable-software-rasterizer")
}

registerServeSchema()

let pendingHubBundleHandoffPath = findHubBundleHandoffFilePath(process.argv)
const startupHubBundleInstallUrl = pendingHubBundleHandoffPath
  ? null
  : findHubBundleInstallBundleUrl(process.argv)
const shouldEnforceSingleInstance = !isNoGuiMode
const SHARED_RUNTIME_CLEANUP_TIMEOUT_MS = 5000
const GUI_SIGNAL_FORCE_EXIT_DELAY_MS = 500

function releaseAppSingleInstanceLock() {
  if (!shouldEnforceSingleInstance) return

  try {
    app.releaseSingleInstanceLock()
  } catch {}
}

function openPendingHubBundleInstall(): boolean {
  if (!pendingHubBundleHandoffPath) return false
  if (!isAccessibilityGranted()) {
    logApp(
      "[hub-install] Accessibility not granted; deferring bundle install handoff",
      {
        filePath: pendingHubBundleHandoffPath,
      },
    )
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
  const resolvedPath = filePath
    ? findHubBundleHandoffFilePath([filePath])
    : null
  if (!resolvedPath) return false

  pendingHubBundleHandoffPath = resolvedPath
  logApp("[hub-install] Queued Hub bundle install handoff", {
    filePath: resolvedPath,
  })

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

function handleHubBundleInstallCandidates(
  candidates: readonly string[],
): Promise<boolean> {
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

let gotSingleInstanceLock = true

if (shouldEnforceSingleInstance) {
  try {
    gotSingleInstanceLock = app.requestSingleInstanceLock()
  } catch (err) {
    // If the lock throws (e.g. corrupted lock file during rapid dev restarts),
    // refuse to start rather than running a duplicate instance.
    logApp("Failed to acquire single instance lock:", err)
    gotSingleInstanceLock = false
  }
}

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.whenReady().then(async () => {
    initDebugFlags(process.argv)
    logApp("DotAgents starting up...")

    if (startupHubBundleInstallUrl) {
      await queueHubBundleInstallFromUrl(startupHubBundleInstallUrl, {
        openIfReady: false,
      })
    }

    // Handle --qr mode: start remote server, start tunnel, print QR code, run headlessly
    if (isQRMode) {
      logApp("Running in --qr mode (headless with QR code)")
      await launchSharedHeadlessMode({
        label: "qr-runtime",
        shutdownLabel: "QR Mode",
        cloudflareTunnelActivation: "force",
        onStarted: async ({ cloudflareTunnelUrl }) => {
          // Print QR code to terminal (with tunnel URL if available)
          const printed = await printQRCodeToTerminal(cloudflareTunnelUrl)
          if (!printed) {
            console.error(
              "[QR Mode] Failed to print QR code. Ensure remoteServerApiKey is configured.",
            )
            console.log(
              "[QR Mode] You can set an API key in the config or run the app normally first.",
            )
          }

          console.log("[QR Mode] Server running. Press Ctrl+C to exit.")
        },
      })

      // Keep the process running - don't create any windows
      return
    }

    // Handle --headless mode: initialize services and start CLI without any GUI
    if (isHeadlessMode) {
      logApp("Running in --headless mode")
      await launchSharedHeadlessMode({
        label: "headless-runtime",
        shutdownLabel: "Headless",
        cloudflareTunnelActivation: "auto",
        terminationSignals: ["SIGTERM"],
        onStarted: async (runtimeHandle) => {
          // Start headless CLI
          const { startHeadlessCLI } = await import("./headless-cli")
          await startHeadlessCLI(async () => {
            await runtimeHandle.gracefulShutdown(0)
          })
        },
      })

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

    registerSharedMainProcessInfrastructure()
    logApp("Shared main-process infrastructure registered")

    try {
      if (
        (process.env.NODE_ENV === "production" ||
          !process.env.ELECTRON_RENDERER_URL) &&
        process.platform !== "linux"
      ) {
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

    if (accessibilityGranted) {
      const cfg = configStore.get()
      const launchDecision = resolveStartupMainWindowDecision(
        cfg,
        pendingHubBundleHandoffPath,
      )

      createMainWindow(
        launchDecision.url ? { url: launchDecision.url } : undefined,
      )

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

    initializeSharedRuntimeServices({
      label: "desktop-runtime",
      mcpStrategy: "background",
      acpStrategy: "background",
    }).catch((error) => {
      diagnosticsService.logError(
        "desktop-runtime",
        "Unexpected shared runtime startup failure",
        error,
      )
      logApp("Unexpected shared runtime startup failure:", error)
    })

    try {
      const cfg = configStore.get()
      void syncConfiguredRemoteAccess({
        label: "desktop-runtime",
        nextConfig: cfg,
      }).catch((err) =>
        logApp(
          `Remote access startup failed: ${err instanceof Error ? err.message : String(err)}`,
        ),
      )
    } catch (_e) {}

    import("./updater").then((res) => res.init()).catch(console.error)

    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    const MACOS_APP_ACTIVATION_DEDUPE_WINDOW_MS = 250
    let lastMacAppActivationAt = 0

    const handleAppActivation = (
      reason: "app.activate" | "app.did-become-active",
    ) => {
      const mainWin = WINDOWS.get("main")
      const cfg = configStore.get()

      if (process.platform === "darwin") {
        const now = Date.now()
        if (
          now - lastMacAppActivationAt <
          MACOS_APP_ACTIVATION_DEDUPE_WINDOW_MS
        ) {
          logApp(`[${reason}] Skipping duplicate macOS activation pulse`)
          return
        }
        lastMacAppActivationAt = now

        if (!cfg.hideDockIcon) {
          ensureAppSwitcherPresence(reason)
        }
      }

      if (accessibilityGranted) {
        if (mainWin) {
          // Window exists (may be hidden/minimized/behind another app).
          // Prefer opening any queued Hub install; otherwise restore and focus the main window.
          if (!openPendingHubBundleInstall()) {
            showMainWindow()
          }
        } else {
          const launchDecision = resolveStartupMainWindowDecision(
            cfg,
            pendingHubBundleHandoffPath,
          )

          createMainWindow(
            launchDecision.url ? { url: launchDecision.url } : undefined,
          )
          if (launchDecision.consumedPendingHubBundle) {
            pendingHubBundleHandoffPath = null
          }
        }
      } else {
        if (!WINDOWS.get("setup")) {
          createSetupWindow()
        }
      }
    }

    // macOS app switcher activation (Cmd+Tab) does not reliably emit `activate`.
    // Electron provides `did-become-active` specifically for all activation paths.
    app.on("activate", function () {
      handleAppActivation("app.activate")
    })

    app.on("did-become-active", function () {
      handleAppActivation("app.did-become-active")
    })

    // Track if we're already cleaning up to prevent re-entry
    let isCleaningUp = false
    app.on("before-quit", async (event) => {
      setAppQuitting()
      releaseAppSingleInstanceLock()
      destroyTray()
      makePanelWindowClosable()

      // Prevent re-entry during cleanup
      if (isCleaningUp) {
        return
      }

      // Prevent the quit from happening immediately so we can wait for cleanup
      event.preventDefault()
      isCleaningUp = true

      try {
        await shutdownSharedRuntimeServices({
          label: "desktop-runtime",
          cleanupTimeoutMs: SHARED_RUNTIME_CLEANUP_TIMEOUT_MS,
          keyboardCleanup: stopListeningToKeyboardEvents,
          stopRemoteServer: true,
        })
      } catch (error) {
        logApp("Unexpected error during service cleanup on quit:", error)
      }

      // Now actually quit the app
      app.quit()
    })
  })
}

app.on("window-all-closed", () => {
  // Don't quit in --qr or --headless mode (headless server)
  if (isQRMode || isHeadlessMode) {
    return
  }
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// Handle SIGTERM/SIGINT in GUI mode.
// SIGTERM is sent by electron-vite --watch on restart.
// SIGINT is sent by Ctrl+C in the terminal.
// On macOS, app.quit() alone doesn't terminate the process because
// window-all-closed intentionally skips quitting. Without these handlers,
// Electron processes leak as orphans.
if (!isNoGuiMode) {
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => {
      logApp(`Received ${signal}, forcing exit`)
      releaseAppSingleInstanceLock()
      destroyTray()
      // Synchronously kill MCP server processes to prevent orphans
      mcpService.emergencyStopAllProcesses()
      app.quit()
      // Short grace period: electron-vite --watch spawns a new process quickly,
      // so the old one must die fast to avoid duplicate Electron processes.
      setTimeout(() => process.exit(0), GUI_SIGNAL_FORCE_EXIT_DELAY_MS).unref()
    })
  }
}
