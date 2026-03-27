import { dialog, type MenuItem } from "electron"

export const MANUAL_RELEASES_URL = "https://github.com/aj47/dotagents-mono/releases"

/**
 * Auto-updater is disabled - updates are manual via GitHub releases.
 * This prevents 403 errors from the invalid update server (electron-releases.umida.co).
 */

export function init() {
  // Auto-updater is disabled - no initialization needed
}

export function getUpdateInfo() {
  return null
}

export async function checkForUpdatesMenuItem(_menuItem: MenuItem) {
  // Auto-updater is disabled - show message directing to GitHub releases
  await dialog.showMessageBox({
    type: "info",
    title: "Check for Updates",
    message: "Updates are currently manual.",
    detail: `To check for updates, please visit:\n${MANUAL_RELEASES_URL}`,
    buttons: ["OK"],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
  })
}

export async function checkForUpdatesAndDownload() {
  // Auto-updater is disabled - always return null
  return { updateInfo: null, downloadedUpdates: null }
}

export function quitAndInstall() {
  // No-op - auto-updater is disabled
}

export async function downloadUpdate() {
  // No-op - auto-updater is disabled
  return null
}
