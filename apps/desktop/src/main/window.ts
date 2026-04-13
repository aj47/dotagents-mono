import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  shell,
  screen,
  app,
} from "electron"
import path from "path"
import { getRendererHandlers } from "@egoist/tipc/main"
import { RendererHandlers } from "./renderer-handlers"
import { logApp, logUI } from "./debug"
import { ensureAppSwitcherPresence, showAndFocusMainWindow } from "./app-switcher"
import { configStore } from "./config"
import { getFocusedAppInfo } from "./keyboard"
import { state, agentProcessManager, suppressPanelAutoShow, isHeadlessMode } from "./state"
import { calculatePanelPosition } from "./panel-position"
import { setupConsoleLogger } from "./console-logger"
import { emergencyStopAll } from "./emergency-stop"
import { setupRendererCrashRecovery } from "./dev-self-recovery/renderer-crash-recovery"

type WINDOW_ID = "main" | "panel" | "setup"

export const WINDOWS = new Map<WINDOW_ID, BrowserWindow>()

function getWindowIdForDebug(win: BrowserWindow | null | undefined): WINDOW_ID | "unknown" | "none" {
  if (!win) return "none"
  for (const [id, candidate] of WINDOWS.entries()) {
    if (candidate === win) return id
  }
  return "unknown"
}

function safeWindowFlag<T>(read: () => T, fallback: T): T {
  try {
    return read()
  } catch {
    return fallback
  }
}

function getWindowStateForDebug(win: BrowserWindow | undefined) {
  if (!win) return null

  return {
    visible: safeWindowFlag(() => win.isVisible(), false),
    focused: safeWindowFlag(() => win.isFocused(), false),
    minimized: safeWindowFlag(() => win.isMinimized(), false),
  }
}

export function getWindowFocusDebugSnapshot() {
  return {
    focusedWindow: getWindowIdForDebug(BrowserWindow.getFocusedWindow()),
    main: getWindowStateForDebug(WINDOWS.get("main")),
    panel: getWindowStateForDebug(WINDOWS.get("panel")),
    setup: getWindowStateForDebug(WINDOWS.get("setup")),
    panelHiddenByMainFocus,
    panelOpenedWithMain,
  }
}

// macOS: track whether the app is quitting so we allow the main window to actually close.
// Without this, the main window hides on close (standard macOS behavior) to stay in Cmd+Tab.
let isAppQuitting = false

/**
 * Call from `before-quit` to allow windows to actually close during app quit.
 */
export function setAppQuitting() {
  isAppQuitting = true
}

// Notify renderer of panel size changes from main process
function notifyPanelSizeChanged(width: number, height: number) {
  const win = WINDOWS.get("panel")
  if (!win) return

  whenPanelReady(() => {
    getRendererHandlers<RendererHandlers>(win.webContents).onPanelSizeChanged.send({ width, height })
  })
}

// Track panel webContents ready state to avoid sending IPC before renderer is ready
let panelWebContentsReady = false

/**
 * Ensures the panel webContents is ready before executing a callback.
 * If already ready (not loading), executes immediately.
 * If still loading (e.g., right after app launch), waits for did-finish-load.
 */
function whenPanelReady(callback: () => void): void {
  const win = WINDOWS.get("panel")
  if (!win) return

  // If webContents is not loading, it's ready to receive IPC messages
  // This handles both cases:
  // 1. panelWebContentsReady is true (normal case after did-finish-load)
  // 2. panelWebContentsReady is false but did-finish-load already fired before we attached listener
  if (!win.webContents.isLoading()) {
    // Mark as ready in case the flag wasn't set (handles the race condition
    // where did-finish-load fired before createPanelWindow's listener was attached)
    panelWebContentsReady = true
    callback()
  } else {
    // Still loading, wait for the renderer to finish
    win.webContents.once("did-finish-load", () => {
      panelWebContentsReady = true
      callback()
    })
  }
}


function createBaseWindow({
  id,
  url,
  showWhenReady = true,
  windowOptions,
}: {
  id: WINDOW_ID
  url?: string
  showWhenReady?: boolean
  windowOptions?: BrowserWindowConstructorOptions
}) {
  const win = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'win32' && {
      icon: path.join(process.resourcesPath, 'icon.ico')
    }),
    ...windowOptions,
    webPreferences: {
      ...windowOptions?.webPreferences,
      preload: path.join(__dirname, "../preload/index.cjs"),
      sandbox: true,
    },
  })

  WINDOWS.set(id, win)

  setupConsoleLogger(win, id)
  setupRendererCrashRecovery(win, id)

  const _label = id.toUpperCase()
  win.on("show", () => logUI(`[WINDOW ${_label}] show`))
  win.on("hide", () => logUI(`[WINDOW ${_label}] hide`))
  win.on("minimize", () => logUI(`[WINDOW ${_label}] minimize`))
  win.on("restore", () => logUI(`[WINDOW ${_label}] restore`))
  win.on("focus", () => {
    logUI(`[WINDOW ${_label}] focus`)
    logApp(`[window:${id}] focus`, getWindowFocusDebugSnapshot())
  })
  win.on("blur", () => {
    logUI(`[WINDOW ${_label}] blur`)
    logApp(`[window:${id}] blur`, getWindowFocusDebugSnapshot())
  })

  if (process.env.IS_MAC) {
    // Suppress accidental app hide (Cmd+H) for all windows, not just main.
    // Global modifier-heavy workflows make this easy to trigger by mistake.
    win.webContents.on("before-input-event", (event, input) => {
      if (input.type !== "keyDown") return
      if (!input.meta || input.control || input.shift) return
      const key = (input.key || "").toLowerCase()
      if (key === "h") {
        event.preventDefault()
      }
    })
  }

  if (showWhenReady) {
    win.on("ready-to-show", () => {
      logUI(`[WINDOW ${_label}] ready-to-show event fired`)
      win.show()
    })

    // Fallback for Linux/Wayland where ready-to-show may not fire reliably
    if (process.platform === "linux") {
      win.webContents.on("did-finish-load", () => {
        logUI(`[WINDOW ${_label}] did-finish-load event fired (Linux fallback)`)
        if (!win.isVisible()) {
          logUI(`[WINDOW ${_label}] Window not visible, forcing show`)
          win.show()
        }
      })
    }
  }

  // "close" can be prevented (e.g. macOS close-to-hide behavior), so only
  // remove from map once the window is actually destroyed.
  win.on("close", () => {
    logUI(`[WINDOW ${_label}] close`)
  })

  win.on("closed", () => {
    logUI(`[WINDOW ${_label}] closed`)
    WINDOWS.delete(id)
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  const baseUrl = import.meta.env.PROD
    ? "assets://app"
    : process.env["ELECTRON_RENDERER_URL"]

  const fullUrl = `${baseUrl}${url || ""}`
  win.loadURL(fullUrl)

  return win
}

// Track whether panel was hidden due to main window focus (for restore on blur)
let panelHiddenByMainFocus = false

// Track whether panel was intentionally opened alongside main window
// When this is true, we don't hide panel when main window gains focus
let panelOpenedWithMain = false

// macOS can emit a brief activation pulse when the floating text-input panel is
// intentionally hidden. Track a short suppression window so the global activation
// handler does not immediately re-show the main window and cause a flash.
const TEXT_INPUT_PANEL_HIDE_ACTIVATION_SUPPRESSION_WINDOW_MS = 300
let lastIntentionalTextInputPanelHideAt = 0

// Exported for use in panel show event to reset stale flag
export function clearPanelHiddenByMainFocus() {
  panelHiddenByMainFocus = false
}

// Clear the "opened with main" flag when panel is explicitly hidden
export function clearPanelOpenedWithMain() {
  panelOpenedWithMain = false
}

// One-shot flag for intentional main-window hide paths.
// If main is hidden without this flag, we treat it as accidental and recover.
let allowExpectedMainHide = false
let lastMainBlurWithoutAppFocusAt = 0
const MAIN_HIDE_RECOVERY_DEACTIVATION_WINDOW_MS = 250

function markIntentionalTextInputPanelHide(source: "hideFloatingPanelWindow" | "stopTextInputAndHidePanelWindow") {
  lastIntentionalTextInputPanelHideAt = Date.now()
  logApp(`[textInput.hide] Marked intentional text-input panel hide from ${source}`, {
    suppressionWindowMs: TEXT_INPUT_PANEL_HIDE_ACTIVATION_SUPPRESSION_WINDOW_MS,
    snapshot: getWindowFocusDebugSnapshot(),
  })
}

export function shouldSuppressMainWindowActivationForRecentTextInputHide() {
  return (
    lastIntentionalTextInputPanelHideAt > 0 &&
    Date.now() - lastIntentionalTextInputPanelHideAt <=
      TEXT_INPUT_PANEL_HIDE_ACTIVATION_SUPPRESSION_WINDOW_MS
  )
}

export function getTextInputPanelHideActivationSuppressionDebugState() {
  const ageMs =
    lastIntentionalTextInputPanelHideAt > 0 ? Date.now() - lastIntentionalTextInputPanelHideAt : null

  return {
    active:
      ageMs !== null && ageMs <= TEXT_INPUT_PANEL_HIDE_ACTIVATION_SUPPRESSION_WINDOW_MS,
    ageMs,
    windowMs: TEXT_INPUT_PANEL_HIDE_ACTIVATION_SUPPRESSION_WINDOW_MS,
  }
}

// Set the "opened with main" flag when panel is shown while main is visible
function setPanelOpenedWithMain() {
  const main = WINDOWS.get("main")
  if (main && main.isVisible()) {
    panelOpenedWithMain = true
  }
}

export function createMainWindow({ url }: { url?: string } = {}): BrowserWindow | undefined {
  // In headless mode, skip all window operations
  if (isHeadlessMode) {
    logApp("Skipping main window creation in headless mode")
    return undefined
  }

  logApp("Creating main window...")
  const win = createBaseWindow({
    id: "main",
    url,
    showWhenReady: true,
    windowOptions: {
      // titleBarStyle: "hiddenInset" is macOS-only, causes issues on Linux/Wayland
      ...(process.platform === "darwin" && { titleBarStyle: "hiddenInset" as const }),
    },
  })

  // Hide floating panel when main window is focused (if setting is enabled)
  // But skip hiding if panel was intentionally opened alongside main window
  win.on("focus", () => {
    lastMainBlurWithoutAppFocusAt = 0

    const config = configStore.get()
    if (config.hidePanelWhenMainFocused !== false) {
      const panel = WINDOWS.get("panel")
      if (panel && panel.isVisible()) {
        // Don't hide panel if it was intentionally opened while main window is visible
        // This prevents the panel from closing during drag/button interactions
        if (panelOpenedWithMain) {
          logApp(
            "[createMainWindow] Main window focused - skipping panel hide (panel opened with main)",
            getWindowFocusDebugSnapshot(),
          )
          return
        }
        logApp("[createMainWindow] Main window focused - hiding floating panel", getWindowFocusDebugSnapshot())
        panelHiddenByMainFocus = true
        panel.hide()
      }
    }
  })

  // Restore floating panel when main window loses focus (if it was hidden by focus)
  win.on("blur", () => {
    if (!BrowserWindow.getFocusedWindow()) {
      lastMainBlurWithoutAppFocusAt = Date.now()
    }

    const config = configStore.get()
    if (config.hidePanelWhenMainFocused !== false && panelHiddenByMainFocus) {
      logApp("[createMainWindow] Main window blur - evaluating panel restore", getWindowFocusDebugSnapshot())
      // Let the native app activation state settle before deciding whether to
      // restore the floating panel. On macOS, immediately re-showing our
      // always-on-top panel during app deactivation can re-activate the app,
      // which then triggers the global activation handler and steals focus
      // back to the main window.
      setTimeout(() => {
        if (!panelHiddenByMainFocus) return

        if (!BrowserWindow.getFocusedWindow()) {
          logApp(
            "[createMainWindow] Main window blurred while app deactivated - leaving floating panel hidden",
            getWindowFocusDebugSnapshot(),
          )
          panelHiddenByMainFocus = false
          return
        }

        const panel = WINDOWS.get("panel")
        if (panel && !panel.isVisible()) {
          logApp("[createMainWindow] Main window blurred - restoring floating panel", getWindowFocusDebugSnapshot())
          panelHiddenByMainFocus = false
          // Use showInactive() directly to avoid stealing focus from other apps.
          // showPanelWindow() would call win.focus() on Windows which is undesirable
          // when the user is switching away from the main app.
          panel.showInactive()
          ensurePanelZOrder(panel)
        }
      }, 0)
    }
  })

  // Clear "opened with main" flag when main window is hidden/closed
  // since the context of "panel opened alongside main" no longer applies
  win.on("hide", () => {
    clearPanelOpenedWithMain()

    if (!process.env.IS_MAC) return

    const cfg = configStore.get()
    const isAppHidden = app.isHidden()
    const blurredIntoAppDeactivation =
      lastMainBlurWithoutAppFocusAt > 0 &&
      Date.now() - lastMainBlurWithoutAppFocusAt <= MAIN_HIDE_RECOVERY_DEACTIVATION_WINDOW_MS
    const shouldRecoverFromUnexpectedHide =
      !isAppQuitting &&
      !cfg.hideDockIcon &&
      !allowExpectedMainHide &&
      !win.isMinimized() &&
      !isAppHidden &&
      !blurredIntoAppDeactivation

    if (blurredIntoAppDeactivation) {
      logApp(
        "[main.hide] Skipping unexpected-hide recovery because the app is deactivating",
        getWindowFocusDebugSnapshot(),
      )
    }

    if (shouldRecoverFromUnexpectedHide) {
      logApp(
        `[main.hide] Unexpected hide detected; recovering main window (dockVisible=${app.dock?.isVisible?.()})`,
      )

      try {
        ensureAppSwitcherPresence("main.hide.recover")
      } catch {
        // best-effort recovery
      }

      // Defer to avoid racing the native hide transition.
      setTimeout(() => {
        try {
          app.show()
          if (!win.isVisible()) {
            win.show()
          }
        } catch {
          // best-effort recovery
        }
      }, 0)
    }

    // Consume one-shot expectation regardless of hide cause.
    lastMainBlurWithoutAppFocusAt = 0
    allowExpectedMainHide = false
  })

  // Clear the flag on close for all platforms (not just macOS)
  // This ensures the flag doesn't stay true if main window is closed via tray on Windows/Linux
  win.on("close", () => {
    clearPanelOpenedWithMain()
  })

  if (process.env.IS_MAC) {
    // macOS: hide the main window instead of destroying it when the user closes it.
    // This keeps the app in the Cmd+Tab switcher and dock. The window is re-shown
    // via dock click (app "activate" event) or hotkey. Only allow actual close
    // during app quit (isAppQuitting).
    win.on("close", (e) => {
      const cfg = configStore.get()
      const shouldHideDock = cfg.hideDockIcon === true
      if (!isAppQuitting) {
        e.preventDefault()
        allowExpectedMainHide = true
        win.hide()
        if (shouldHideDock) {
          app.setActivationPolicy("accessory")
          app.dock.hide()
        } else {
          ensureAppSwitcherPresence("main.close")
        }
        return
      }
      // App is quitting — allow the close to proceed
      if (shouldHideDock) {
        app.setActivationPolicy("accessory")
        app.dock.hide()
      }
    })

    win.on("show", () => {
      // Always ensure dock icon and Cmd+Tab presence when main window is shown.
      // This fixes the icon going missing in the Cmd+Tab app switcher.
      // Even when hideDockIcon is enabled, we temporarily show the dock icon
      // while the window is visible so the user can Cmd+Tab to it.
      if (!app.dock.isVisible()) {
        app.dock.show()
        app.setActivationPolicy("regular")
      }
    })
  }

  return win
}

export function createSetupWindow(): BrowserWindow | undefined {
  // In headless mode, skip all window operations
  if (isHeadlessMode) {
    logApp("Skipping setup window creation in headless mode")
    return undefined
  }

  const win = createBaseWindow({
    id: "setup",
    url: "/setup",
    showWhenReady: true,
    windowOptions: {
      // titleBarStyle: "hiddenInset" is macOS-only, causes issues on Linux/Wayland
      ...(process.platform === "darwin" && { titleBarStyle: "hiddenInset" as const }),
      width: 800,
      height: 600,
      resizable: false,
    },
  })

  return win
}

export function showMainWindow(url?: string) {
  // In headless mode, skip all window operations
  if (isHeadlessMode) return

  const win = WINDOWS.get("main")

  if (win) {
    logApp("[showMainWindow] Reusing existing main window", getWindowFocusDebugSnapshot())
    showAndFocusMainWindow(win, "showMainWindow")
    if (url) {
      getRendererHandlers<RendererHandlers>(win.webContents).navigate.send(url)
    }
  } else {
    createMainWindow({ url })
  }
}

const VISUALIZER_BUFFER_LENGTH = 70
const WAVEFORM_BAR_WIDTH = 2
const WAVEFORM_GAP = 2 // gap-0.5 = 2px in Tailwind
const WAVEFORM_PADDING = 32 // px-4 = 16px on each side
const WAVEFORM_PANEL_CONTENT_MIN_WIDTH = 360

// Raw waveform width only accounts for the bar lane itself.
// Keep a slightly wider floor so the recording badge + submit hint do not feel cramped.
const calculateMinWaveformWidth = () => {
  const waveformWidth =
    (VISUALIZER_BUFFER_LENGTH * (WAVEFORM_BAR_WIDTH + WAVEFORM_GAP)) + WAVEFORM_PADDING
  return Math.max(waveformWidth, WAVEFORM_PANEL_CONTENT_MIN_WIDTH)
}

export const MIN_WAVEFORM_WIDTH = calculateMinWaveformWidth() // 360px floor for panel breathing room

// Minimum height for waveform panel:
// - Drag bar: 24px
// - Waveform: 64px (h-16)
// - Submit button + hint: 36px
// - Padding: ~26px
// Total: ~150px
export const WAVEFORM_MIN_HEIGHT = 150

// Minimum height for waveform panel with transcription preview:
// - Drag bar: 24px
// - Waveform (shrunk): 40px (h-10)
// - Preview text: ~32px (2 lines)
// - Submit button + hint: 36px
// - Padding/margins: ~28px
// Total: ~160px
export const WAVEFORM_WITH_PREVIEW_HEIGHT = 160

// Minimum height for text input panel:
// - Hint text row: ~20px
// - Textarea: ~80px minimum for usability
// - Bottom bar (char count + buttons): ~28px
// - Padding (p-3 = 12px top + 12px bottom + gap-3 = 12px between)
// Total: ~180px minimum once real panel chrome and wrapping are accounted for
export const TEXT_INPUT_MIN_HEIGHT = 180

// Minimum height for progress/agent view:
// - Header: ~40px
// - Progress content: ~100px
// - Follow-up input: ~40px
// - Padding: ~20px
// Total: ~200px
export const PROGRESS_MIN_HEIGHT = 200

const panelWindowSize = {
  width: Math.max(260, MIN_WAVEFORM_WIDTH),
  height: WAVEFORM_MIN_HEIGHT,
}

const agentPanelWindowSize = {
  width: 600,
  height: 400,
}

const textInputPanelWindowSize = {
  width: 380,
  height: 180,
}

export const TEXT_INPUT_MIN_WIDTH = textInputPanelWindowSize.width

type SavedPanelSizeMode = "waveform" | "progress" | "textInput"

const getPanelMinWidth = (mode: SavedPanelSizeMode | "normal" | "agent" | "textInput") => {
  if (mode === "textInput") {
    return TEXT_INPUT_MIN_WIDTH
  }
  return Math.max(200, MIN_WAVEFORM_WIDTH)
}

const getPanelMinHeight = (mode: SavedPanelSizeMode | "normal" | "agent" | "textInput") => {
  if (mode === "agent" || mode === "progress") {
    return PROGRESS_MIN_HEIGHT
  }
  if (mode === "textInput") {
    return TEXT_INPUT_MIN_HEIGHT
  }
  return WAVEFORM_MIN_HEIGHT
}

// Get the saved panel size (mode-aware)
const getSavedPanelSize = (mode: SavedPanelSizeMode = "waveform") => {
  const config = configStore.get()

  logApp(`[window.ts] getSavedPanelSize - checking config for mode: ${mode}...`)

  const validateSize = (
    savedSize: { width: number; height: number },
    minHeight: number,
    fallbackSize: { width: number; height: number } = panelWindowSize,
    minWidth: number = getPanelMinWidth(mode),
  ) => {
    const maxWidth = 3000
    const maxHeight = 2000

    if (savedSize.width > maxWidth || savedSize.height > maxHeight) {
      logApp(`[window.ts] Saved size too large (${savedSize.width}x${savedSize.height}), using default:`, fallbackSize)
      return fallbackSize
    }

    if (savedSize.width < minWidth || savedSize.height < minHeight) {
      logApp(`[window.ts] Saved size too small (${savedSize.width}x${savedSize.height}), using default:`, fallbackSize)
      return fallbackSize
    }

    return savedSize
  }

  if (mode === "progress") {
    if (config.panelProgressSize) {
      logApp(`[window.ts] Found saved progress size:`, config.panelProgressSize)
      return validateSize(config.panelProgressSize, PROGRESS_MIN_HEIGHT, agentPanelWindowSize)
    }

    if (config.panelCustomSize) {
      // Migration fallback for users that had a single shared panel size before
      // progress-mode persistence existed.
      const migratedProgressSize = {
        width: config.panelCustomSize.width,
        height: Math.max(config.panelCustomSize.height, PROGRESS_MIN_HEIGHT),
      }
      logApp(`[window.ts] No saved progress size; using migrated panel size:`, migratedProgressSize)
      return validateSize(migratedProgressSize, PROGRESS_MIN_HEIGHT, agentPanelWindowSize)
    }

    logApp(`[window.ts] No saved progress size, using agent default:`, agentPanelWindowSize)
    return agentPanelWindowSize
  }

  if (mode === "textInput") {
    if (config.panelTextInputSize) {
      logApp(`[window.ts] Found saved text input size:`, config.panelTextInputSize)
      return validateSize(config.panelTextInputSize, TEXT_INPUT_MIN_HEIGHT, textInputPanelWindowSize, TEXT_INPUT_MIN_WIDTH)
    }

    if (config.panelCustomSize) {
      const migratedTextInputSize = {
        width: Math.max(config.panelCustomSize.width, TEXT_INPUT_MIN_WIDTH),
        height: Math.max(config.panelCustomSize.height, TEXT_INPUT_MIN_HEIGHT),
      }
      logApp(`[window.ts] No saved text input size; using migrated panel size:`, migratedTextInputSize)
      return validateSize(migratedTextInputSize, TEXT_INPUT_MIN_HEIGHT, textInputPanelWindowSize, TEXT_INPUT_MIN_WIDTH)
    }

    logApp(`[window.ts] No saved text input size, using text input default:`, textInputPanelWindowSize)
    return textInputPanelWindowSize
  }

  // Waveform mode uses panelCustomSize
  if (config.panelCustomSize) {
    logApp(`[window.ts] Found saved panel size:`, config.panelCustomSize)
    return validateSize(config.panelCustomSize, WAVEFORM_MIN_HEIGHT, panelWindowSize, getPanelMinWidth("waveform"))
  }

  logApp(`[window.ts] No saved panel size, using default:`, panelWindowSize)
  return panelWindowSize
}

const getSavedSizeForMode = (mode: "normal" | "agent" | "textInput") => {
  if (mode === "agent") {
    return getSavedPanelSize("progress")
  }
  if (mode === "textInput") {
    return getSavedPanelSize("textInput")
  }
  return getSavedPanelSize("waveform")
}

function restorePanelSizeForMode(mode: "normal" | "agent" | "textInput", reason = "setPanelMode") {
  const win = WINDOWS.get("panel")
  if (!win) return

  try {
    const [currentWidth, currentHeight] = win.getSize()
    const savedSize = getSavedSizeForMode(mode)
    const targetWidth = Math.max(savedSize.width, getPanelMinWidth(mode))
    const targetHeight = Math.max(savedSize.height, getPanelMinHeight(mode))

    if (currentHeight !== targetHeight || currentWidth !== targetWidth) {
      logApp(`[${reason}] Restoring ${mode} size from ${currentWidth}x${currentHeight} to ${targetWidth}x${targetHeight}`)
      win.setSize(targetWidth, targetHeight)
      notifyPanelSizeChanged(targetWidth, targetHeight)
      const position = calculatePanelPosition({ width: targetWidth, height: targetHeight }, mode)
      win.setPosition(position.x, position.y)
    }
  } catch (e) {
    logApp(`[${reason}] Failed to restore panel size for ${mode} mode:`, e)
  }
}

const getPanelWindowPosition = (
  mode: "normal" | "agent" | "textInput" = "normal",
) => {
  const size = getSavedSizeForMode(mode)
  return calculatePanelPosition(size, mode)
}

// Ensure the panel stays above all windows and visible on all workspaces (esp. macOS)
function ensurePanelZOrder(win: BrowserWindow) {
  try {
    if (process.platform === "darwin") {
      // Show on all Spaces and above fullscreen apps
      try {
        // @ts-ignore - macOS-only options not in cross-platform typings
        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      } catch (e) {
        logApp("[window.ts] setVisibleOnAllWorkspaces not supported:", e)
      }
      try {
        // Prefer NSModalPanel-like level for WM compatibility (Aerospace)
        // @ts-ignore - level arg is macOS-specific
        win.setAlwaysOnTop(true, "modal-panel", 1)
      } catch (e) {
        logApp("[window.ts] setAlwaysOnTop('modal-panel') failed, trying 'screen-saver':", e)
        try {
          // @ts-ignore - level arg is macOS-specific
          win.setAlwaysOnTop(true, "screen-saver")
        } catch (e2) {
          logApp("[window.ts] setAlwaysOnTop('screen-saver') failed, falling back to default:", e2)
          win.setAlwaysOnTop(true)
        }
      }
    } else {
      // Windows/Linux
      win.setAlwaysOnTop(true)
      try {
        win.setVisibleOnAllWorkspaces(true)

      } catch {}
    }
  } catch (error) {
    logApp("[window.ts] ensurePanelZOrder error:", error)
  }
}


// Adjust focusability based on panel mode.
// Agent mode should remain non-stealing when shown via showInactive(), but it still
// needs to be focusable so users can click and interact with the floating panel
// without the main window immediately reclaiming focus and hiding it.
function setPanelFocusableForMode(win: BrowserWindow, mode: "normal"|"agent"|"textInput") {
  try {
    if (mode === "textInput" || mode === "agent") {
      win.setFocusable(true)
    } else {
      // Keep passive overlay modes non-focusable unless interaction is required.
      win.setFocusable(false)
    }
  } catch (e) {
    logApp("[window.ts] setPanelFocusableForMode failed:", e)
  }
}


// Centralized panel mode management and deduped resize/apply
let _currentPanelMode: "normal" | "agent" | "textInput" = "normal"

type PanelBounds = { width: number; height: number; x: number; y: number }
let _lastApplied: { mode: "normal" | "agent" | "textInput"; ts: number; bounds?: PanelBounds } = {
  mode: "normal",
  ts: 0,
  bounds: undefined,
}

let _lastManualResizeTs = 0
export function markManualResize() {
  _lastManualResizeTs = Date.now()
}

function applyPanelMode(mode: "normal" | "agent" | "textInput") {
  const win = WINDOWS.get("panel")
  if (!win) return

  const now = Date.now()

  const minWidth = getPanelMinWidth(mode)
  const minHeight = getPanelMinHeight(mode)
  try {
    win.setMinimumSize(minWidth, minHeight)
  } catch {}

  // Update focus behavior for the mode
  try {
    setPanelFocusableForMode(win, mode)
    ensurePanelZOrder(win)
  } catch {}

  // Track mode change for deduplication
  _lastApplied = {
    mode,
    ts: now,
    bounds: _lastApplied.bounds, // Keep existing bounds since we don't resize
  }
}

export function setPanelMode(mode: "normal" | "agent" | "textInput") {
  const previousMode = _currentPanelMode
  _currentPanelMode = mode
  applyPanelMode(mode)

  if (mode !== previousMode) {
    restorePanelSizeForMode(mode)
  }
}

export function getCurrentPanelMode(): "normal" | "agent" | "textInput" {
  return _currentPanelMode
}

function hidePanelTextInputInRenderer() {
  try {
    getWindowRendererHandlers("panel")?.hideTextInput.send()
  } catch (error) {
    logApp("[hidePanelTextInputInRenderer] Failed to send hideTextInput:", error)
  }
}

export function hideFloatingPanelWindow() {
  const panel = WINDOWS.get("panel")
  if (!panel) return

  const isHidingTextInputPanel =
    state.isTextInputActive === true || getCurrentPanelMode() === "textInput"

  logApp("[hideFloatingPanelWindow] Requested", {
    isHidingTextInputPanel,
    panelVisible: panel.isVisible(),
    panelMode: getCurrentPanelMode(),
    textInputActive: state.isTextInputActive,
    snapshot: getWindowFocusDebugSnapshot(),
  })

  if (isHidingTextInputPanel) {
    markIntentionalTextInputPanelHide("hideFloatingPanelWindow")
  }

  suppressPanelAutoShow(1000)
  clearPanelOpenedWithMain()
  clearPanelHiddenByMainFocus()
  state.isTextInputActive = false
  hidePanelTextInputInRenderer()

  // Persist the auto-show preference so the panel stays hidden across sessions
  // and is not re-shown by agent progress updates (#281)
  try {
    const config = configStore.get()
    if (config.floatingPanelAutoShow !== false) {
      configStore.save({ ...config, floatingPanelAutoShow: false })
      logApp("[hideFloatingPanelWindow] Persisted floatingPanelAutoShow=false")
    }
  } catch (err) {
    logApp("[hideFloatingPanelWindow] Failed to persist config", { err })
  }

  if (panel.isVisible()) {
    logApp("[hideFloatingPanelWindow] Hiding visible panel window", {
      panelMode: getCurrentPanelMode(),
      snapshot: getWindowFocusDebugSnapshot(),
    })
    panel.hide()
  }

  if (getCurrentPanelMode() === "textInput") {
    setPanelMode("normal")
  }

  logApp("[hideFloatingPanelWindow] Completed", {
    panelVisible: panel.isVisible(),
    panelMode: getCurrentPanelMode(),
    textInputActive: state.isTextInputActive,
    suppression: getTextInputPanelHideActivationSuppressionDebugState(),
    snapshot: getWindowFocusDebugSnapshot(),
  })
}

export function resetFloatingPanelPositionAndSize(showAfterReset = true) {
  const config = configStore.get()
  configStore.save({
    ...config,
    panelPosition: "top-right",
    panelCustomPosition: undefined,
    panelCustomSize: undefined,
    panelTextInputSize: undefined,
    panelProgressSize: undefined,
  })

  state.isTextInputActive = false
  hidePanelTextInputInRenderer()
  clearPanelHiddenByMainFocus()
  setPanelMode("normal")

  const panel = WINDOWS.get("panel")
  if (!panel) return

  const resetMode = "normal"
  const resetSize = getSavedSizeForMode(resetMode)
  const minWidth = getPanelMinWidth(resetMode)
  const minHeight = getPanelMinHeight(resetMode)
  const width = Math.max(resetSize.width, minWidth)
  const height = Math.max(resetSize.height, minHeight)

  try {
    panel.setMinimumSize(minWidth, minHeight)
    panel.setSize(width, height)
    notifyPanelSizeChanged(width, height)
    const position = calculatePanelPosition({ width, height }, resetMode)
    panel.setPosition(position.x, position.y)
  } catch (error) {
    logApp("[resetFloatingPanelPositionAndSize] Failed to reset panel:", error)
  }

  if (showAfterReset) {
    showPanelWindow()
  }
}


export function createPanelWindow(): BrowserWindow | undefined {
  // In headless mode, skip all window operations
  if (isHeadlessMode) {
    logApp("Skipping panel window creation in headless mode")
    return undefined
  }

  logApp("Creating panel window...")
  logApp("[window.ts] createPanelWindow - MIN_WAVEFORM_WIDTH:", MIN_WAVEFORM_WIDTH)

  const position = getPanelWindowPosition()
  logApp("[window.ts] createPanelWindow - position:", position)

  const savedSize = getSavedSizeForMode("normal")
  logApp("[window.ts] createPanelWindow - savedSize:", savedSize)

  const minWidth = Math.max(200, MIN_WAVEFORM_WIDTH)
  logApp("[window.ts] createPanelWindow - minWidth:", minWidth)


  const win = createBaseWindow({
    id: "panel",
    url: "/panel",
    showWhenReady: false,
    windowOptions: {
      // macOS-only options
      ...(process.platform === "darwin" && {
        hiddenInMissionControl: true,
        visualEffectState: "active" as const,
        vibrancy: "under-window" as const,
      }),
      skipTaskbar: true,
      closable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,

      frame: false,
      // transparent: true,
      paintWhenInitiallyHidden: true,
      // hasShadow: false,
      width: savedSize.width,
      height: savedSize.height,
      minWidth: minWidth, // Ensure minimum waveform width
      minHeight: WAVEFORM_MIN_HEIGHT, // Allow compact waveform panel with reduced negative space
      resizable: true, // Enable resizing
      focusable: process.platform === "linux" ? true : false, // Linux needs focusable for window to display

      alwaysOnTop: true,
      x: position.x,
      y: position.y,
    },
  })

  logApp("[window.ts] createPanelWindow - window created with size:", { width: savedSize.width, height: savedSize.height })

  // Track when the panel renderer is ready to receive IPC messages
  // Reset the ready flag since we're creating a new panel window
  panelWebContentsReady = false
  win.webContents.once("did-finish-load", () => {
    panelWebContentsReady = true
    logApp("[window.ts] Panel webContents finished loading, ready for IPC")
  })

  win.on("hide", () => {
    logApp("[window:panel] hide", {
      panelMode: getCurrentPanelMode(),
      textInputActive: state.isTextInputActive,
      suppression: getTextInputPanelHideActivationSuppressionDebugState(),
      snapshot: getWindowFocusDebugSnapshot(),
    })
    getRendererHandlers<RendererHandlers>(win.webContents).stopRecording.send()
  })

  // Reassert z-order on lifecycle changes and reset stale focus-hide flag
  win.on("show", () => {
    ensurePanelZOrder(win)
    // Clear the flag when panel becomes visible through any means.
    // This prevents stale state if user manually shows panel while main is focused.
    clearPanelHiddenByMainFocus()
  })
  win.on("blur", () => {
    // Skip z-order reassertion in textInput mode.
    // On macOS, calling setAlwaysOnTop during a focus/blur event while the
    // panel is the active keyboard target causes the window to lose keyboard
    // focus, so the textarea never receives it (Ctrl+T) or loses it on click.
    if (getCurrentPanelMode() !== "textInput") {
      ensurePanelZOrder(win)
    }
  })
  win.on("focus", () => {
    if (getCurrentPanelMode() !== "textInput") {
      ensurePanelZOrder(win)
    }
  })
  win.on("move", () => ensurePanelZOrder(win))
  win.on("resize", () => ensurePanelZOrder(win))


  // Ensure correct z-order for our panel-like window
  ensurePanelZOrder(win)

  return win
}

export function showPanelWindow(options: { markOpenedWithMain?: boolean } = {}) {
  // In headless mode, skip all window operations
  if (isHeadlessMode) return

  const win = WINDOWS.get("panel")
  if (win) {
    const mode = getCurrentPanelMode()

    logApp(`[showPanelWindow] Called. Current visibility: ${win.isVisible()}`, {
      mode,
      markOpenedWithMain: options.markOpenedWithMain !== false,
      snapshot: getWindowFocusDebugSnapshot(),
    })

    if (options.markOpenedWithMain === false) {
      clearPanelOpenedWithMain()
    } else {
      // Track that panel is being opened alongside main window (if main is visible)
      // This prevents the panel from being hidden when main window regains focus during interactions.
      // Auto-show paths should opt out so the panel stays out of the way while the user works in the main app.
      setPanelOpenedWithMain()
    }

    // Re-enable auto-show when user explicitly shows the panel (#281)
    try {
      const config = configStore.get()
      if (config.floatingPanelAutoShow === false) {
        configStore.save({ ...config, floatingPanelAutoShow: true })
        logApp("[showPanelWindow] Re-enabled floatingPanelAutoShow=true")
      }
    } catch (err) {
      logApp("[showPanelWindow] Failed to persist config", { err })
    }

    // Apply mode sizing/positioning just before showing
    try { applyPanelMode(mode) } catch {}

    if (mode === "textInput") {
      logApp(`[showPanelWindow] Showing panel with showInactive() for ${mode} mode`)
      win.showInactive()
    } else {
      logApp(`[showPanelWindow] Showing panel with showInactive() for ${mode} mode`)
      win.showInactive()
      if (process.platform === "win32") {
        win.focus()
      }
    }

    ensurePanelZOrder(win)
  }
}

export async function showPanelWindowAndStartRecording(fromButtonClick?: boolean) {
  // In headless mode, skip all window operations
  if (isHeadlessMode) return

  // Capture focus before showing panel
  try {
    const focusedApp = await getFocusedAppInfo()
    state.focusedAppBeforeRecording = focusedApp
  } catch (error) {
    state.focusedAppBeforeRecording = null
  }

  // Track button click state for global Enter key handling
  state.isRecordingFromButtonClick = fromButtonClick ?? false
  state.isRecordingMcpMode = false

  // Ensure consistent sizing by setting mode in main before showing
  // This prevents inheriting textInput mode's focus/show behavior from prior sessions
  setPanelMode("normal")

  // Resize panel to compact waveform size before showing
  // This fixes the issue where panel had too much negative space (#817)
  resizePanelForWaveform()

  // Start mic capture/recording as early as possible, but only after panel renderer is ready
  // This prevents lost IPC messages right after app launch when webContents may not have finished loading
  // Pass fromButtonClick so panel shows correct submit hint (Enter vs Release keys)
  whenPanelReady(() => {
    getWindowRendererHandlers("panel")?.startRecording.send({ fromButtonClick })
  })
  showPanelWindow()
}

export async function showPanelWindowAndStartMcpRecording(conversationId?: string, sessionId?: string, fromTile?: boolean, fromButtonClick?: boolean, conversationTitle?: string, isStillHeld?: () => boolean) {
  // In headless mode, skip all window operations
  if (isHeadlessMode) return

  // Capture focus before showing panel
  try {
    const focusedApp = await getFocusedAppInfo()
    state.focusedAppBeforeRecording = focusedApp
  } catch (error) {
    state.focusedAppBeforeRecording = null
  }

  // Track button click state for global Enter key handling
  state.isRecordingFromButtonClick = fromButtonClick ?? false
  state.isRecordingMcpMode = true

  // Ensure consistent sizing by setting mode in main before showing
  setPanelMode("normal")

  // Resize panel to compact waveform size before showing
  // This fixes the issue where panel had too much negative space (#817)
  resizePanelForWaveform()

  // Start mic capture/recording as early as possible, but only after panel renderer is ready
  // This prevents lost IPC messages right after app launch when webContents may not have finished loading
  // Pass fromTile and fromButtonClick flags so panel knows how to behave after recording ends
  whenPanelReady(() => {
    if (isStillHeld && !isStillHeld()) return
    getWindowRendererHandlers("panel")?.startMcpRecording.send({ conversationId, conversationTitle, sessionId, fromTile, fromButtonClick })
  })
  showPanelWindow()
}

export async function showPanelWindowAndShowTextInput(initialText?: string, conversationId?: string, conversationTitle?: string) {
  // In headless mode, skip all window operations
  if (isHeadlessMode) return

  // Capture focus before showing panel
  try {
    const focusedApp = await getFocusedAppInfo()
    state.focusedAppBeforeRecording = focusedApp
  } catch (error) {
    state.focusedAppBeforeRecording = null
  }

  // Set text input state first
  state.isTextInputActive = true

  const main = WINDOWS.get("main")
  const focusedWindow = BrowserWindow.getFocusedWindow()

  // Preserve the main window's current visibility across the text-input flow.
  // Previously we hid a visible-but-unfocused main window here to avoid macOS
  // surfacing it during the panel focus handoff; removing the hide restores the
  // user-visible state but relies on the renderer-side focus handoff in 2553e8d1
  // to keep the panel textarea from dragging main to the front.
  logApp("[textInput.open] Preparing floating text-input open", {
    hasFocusedWindow: Boolean(focusedWindow),
    mainVisible: main?.isVisible?.() ?? false,
    snapshot: getWindowFocusDebugSnapshot(),
  })

  // Resize panel for text input mode before showing
  // This fixes the issue where panel was too small after waveform recording (#840)
  resizePanelForTextInput()

  showPanelWindow() // This will now use textInput mode positioning
  // Make the panel focusable, but defer the actual focus handoff until the renderer
  // has mounted the textarea. This avoids a brief main-window flash on macOS caused
  // by stacking multiple activation/focus operations back-to-back.
  setPanelFocusable(true)
  // Guard against early IPC loss right after app launch (mirrors recording start paths)
  whenPanelReady(() => {
    getWindowRendererHandlers("panel")?.showTextInput.send({ initialText, conversationId, conversationTitle })
  })
}

export function makePanelWindowClosable() {
  const panel = WINDOWS.get("panel")
  if (panel && !panel.isClosable()) {
    panel.setClosable(true)
  }
}

export const getWindowRendererHandlers = (id: WINDOW_ID) => {
  const win = WINDOWS.get(id)
  if (!win) return undefined
  return getRendererHandlers<RendererHandlers>(win.webContents)
}

export const stopRecordingAndHidePanelWindow = () => {
  const win = WINDOWS.get("panel")
  if (win) {
    // Reset button click state
    state.isRecordingFromButtonClick = false
    state.isRecordingMcpMode = false

    getRendererHandlers<RendererHandlers>(win.webContents).stopRecording.send()

    if (win.isVisible()) {
      // Clear the "opened with main" flag since panel is being hidden
      clearPanelOpenedWithMain()
      win.hide()
    }
  }
}

export const stopTextInputAndHidePanelWindow = () => {
  const win = WINDOWS.get("panel")
  if (win) {
    logApp("[stopTextInputAndHidePanelWindow] Requested", {
      panelVisible: win.isVisible(),
      panelMode: getCurrentPanelMode(),
      textInputActive: state.isTextInputActive,
      snapshot: getWindowFocusDebugSnapshot(),
    })
    markIntentionalTextInputPanelHide("stopTextInputAndHidePanelWindow")
    state.isTextInputActive = false
    getRendererHandlers<RendererHandlers>(win.webContents).hideTextInput.send()

    if (win.isVisible()) {
      // Clear the "opened with main" flag since panel is being hidden
      clearPanelOpenedWithMain()
      win.hide()
    }

    setPanelMode("normal")
  }
}

export const closeAgentModeAndHidePanelWindow = () => {
  const win = WINDOWS.get("panel")
  if (win) {
    // Update agent state
    state.isAgentModeActive = false
    state.shouldStopAgent = false
    state.agentIterationCount = 0

    // Hide the panel immediately to avoid flash when mode changes
    if (win.isVisible()) {
      // Clear the "opened with main" flag since panel is being hidden
      clearPanelOpenedWithMain()
      win.hide()
    }

    // Clear agent progress after hiding to avoid triggering mode change while visible
    getRendererHandlers<RendererHandlers>(win.webContents).clearAgentProgress.send()
    // Suppress auto-show briefly to avoid immediate reopen from any trailing progress
    suppressPanelAutoShow(1000)
    setPanelMode("normal")
  }
}

export const minimizeAgentModeAndHidePanelWindow = () => {
  const win = WINDOWS.get("panel")
  if (win) {
    state.isAgentModeActive = false
    state.shouldStopAgent = false
    state.agentIterationCount = 0

    clearPanelHiddenByMainFocus()

    if (win.isVisible()) {
      clearPanelOpenedWithMain()
      win.hide()
    }

    suppressPanelAutoShow(1000)
    setPanelMode("normal")
  }
}

export const emergencyStopAgentMode = async () => {
  logApp("Emergency stop triggered for agent mode")

  const win = WINDOWS.get("panel")
  if (win) {
    // Notify renderer ASAP
    getRendererHandlers<RendererHandlers>(win.webContents).emergencyStopAgent?.send()
    // Do NOT clear agent progress here; let the session emit its final 'stopped' update
    // to avoid stale/empty completion panels racing with progress clear.
  }

  try {
    const { before, after } = await emergencyStopAll()
    logApp(`Emergency stop completed. Killed ${before} processes. Remaining: ${after}`)
  } catch (error) {
    logApp("Error during emergency stop:", error)
  }

  // Keep panel open after emergency stop so user can:
  // 1. See the stopped state and any error messages
  // 2. Send follow-up messages to continue the conversation
  // 3. Have more granular control to steer the agent when things go wrong
  // The panel will show the "Stopped" state and the follow-up input remains active
  if (win) {
    // Suppress auto-show briefly to avoid immediate reopen from any trailing progress
    suppressPanelAutoShow(1000)
    // Make panel focusable so user can interact with the follow-up input
    setPanelFocusable(true)
  }
}

export function resizePanelForAgentMode() {
  setPanelMode("agent")
}

/**
 * Resize the panel for text input mode.
 * This ensures the panel is at least TEXT_INPUT_MIN_HEIGHT tall for usability.
 * This fixes the issue where the panel was too small for text input after
 * being shrunk for waveform recording.
 * See: https://github.com/aj47/dotagents-mono/issues/840
 */
export function resizePanelForTextInput() {
  setPanelMode("textInput")
}

export function resizePanelToNormal() {
  setPanelMode("normal")
}

/**
 * Resize the panel to compact waveform size for recording.
 * This shrinks the panel height to WAVEFORM_MIN_HEIGHT while keeping the current width.
 * This fixes the issue where the panel had too much negative space when showing
 * the waveform after being sized for agent mode.
 * See: https://github.com/aj47/dotagents-mono/issues/817
 */
export function resizePanelForWaveform() {
  const win = WINDOWS.get("panel")
  if (!win) return

  try {
    const [currentWidth] = win.getSize()
    const targetHeight = WAVEFORM_MIN_HEIGHT

    // Keep the current width but shrink to waveform height
    const minWidth = Math.max(200, MIN_WAVEFORM_WIDTH)
    const newWidth = Math.max(currentWidth, minWidth)

    logApp(`[resizePanelForWaveform] Resizing panel from current size to ${newWidth}x${targetHeight}`)

    win.setSize(newWidth, targetHeight)
    // Notify renderer of the size change
    notifyPanelSizeChanged(newWidth, targetHeight)

    // Reposition to maintain the panel's anchor point (e.g., bottom-right of screen)
    const position = calculatePanelPosition({ width: newWidth, height: targetHeight }, "normal")
    win.setPosition(position.x, position.y)
  } catch (e) {
    logApp("[resizePanelForWaveform] Failed to resize panel:", e)
  }
}

/**
 * Resize the panel to accommodate transcription preview text during recording.
 * Grows the panel from WAVEFORM_MIN_HEIGHT to WAVEFORM_WITH_PREVIEW_HEIGHT.
 * When showPreview is false, shrinks back to WAVEFORM_MIN_HEIGHT.
 */
export function resizePanelForWaveformPreview(showPreview: boolean) {
  const win = WINDOWS.get("panel")
  if (!win) return

  // Waveform preview resizing is only valid while recording in normal mode.
  // Ignore stale calls so progress/text-input layouts remain unaffected.
  if (_currentPanelMode !== "normal") {
    return
  }

  try {
    const [currentWidth, currentHeight] = win.getSize()
    const targetHeight = showPreview ? WAVEFORM_WITH_PREVIEW_HEIGHT : WAVEFORM_MIN_HEIGHT

    // Skip if already at target height
    if (currentHeight === targetHeight) return

    const minWidth = Math.max(200, MIN_WAVEFORM_WIDTH)
    const newWidth = Math.max(currentWidth, minWidth)

    logApp(`[resizePanelForWaveformPreview] Resizing panel from ${currentWidth}x${currentHeight} to ${newWidth}x${targetHeight} (preview=${showPreview})`)

    win.setSize(newWidth, targetHeight)
    notifyPanelSizeChanged(newWidth, targetHeight)

    // Reposition to maintain the panel's anchor point
    const position = calculatePanelPosition({ width: newWidth, height: targetHeight }, "normal")
    win.setPosition(position.x, position.y)
  } catch (e) {
    logApp("[resizePanelForWaveformPreview] Failed to resize panel:", e)
  }
}

/**
 * Set the focusability of the panel window.
 * This is used when a flow needs to override the default per-mode focusability.
 * Agent mode is normally focusable so users can interact with the floating panel,
 * while showInactive() still prevents it from stealing focus on open.
 *
 * @param focusable - Whether the panel should be focusable
 * @param andFocus - If true and focusable is true, also focus the window. This is needed on macOS
 *                   because windows shown with showInactive() need to be explicitly focused to
 *                   receive input events, even after setFocusable(true).
 */
export function setPanelFocusable(focusable: boolean, andFocus: boolean = false) {
  const win = WINDOWS.get("panel")
  if (!win) return
  try {
    win.setFocusable(focusable)
    // On macOS, windows shown with showInactive() need explicit focus to receive input
    if (focusable && andFocus) {
      win.focus()
    }
  } catch (e) {
    logApp("[window.ts] setPanelFocusable failed:", e)
  }
}
