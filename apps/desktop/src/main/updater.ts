import { app, dialog, type MenuItem } from "electron"

export const MANUAL_RELEASES_URL = "https://github.com/aj47/dotagents-mono/releases"
const GITHUB_LATEST_RELEASE_URL = "https://api.github.com/repos/aj47/dotagents-mono/releases/latest"
const UPDATE_CHECK_TIMEOUT_MS = 5000
const UPDATE_CHECK_CACHE_MS = 10 * 60 * 1000

interface ManualReleaseAssetInfo {
  name: string
  downloadUrl: string
}

interface ManualLatestReleaseInfo {
  tagName: string
  name?: string
  publishedAt?: string
  url: string
  assets: ManualReleaseAssetInfo[]
}

interface ManualUpdateInfo {
  mode: "manual"
  currentVersion: string
  updateAvailable?: boolean
  latestRelease?: ManualLatestReleaseInfo
  lastCheckedAt?: number
  error?: string
}

let cachedUpdateInfo: ManualUpdateInfo = {
  mode: "manual",
  currentVersion: app.getVersion(),
}

function getCurrentVersion(): string {
  return app.getVersion()
}

function normalizeVersion(value: string | undefined): string {
  return (value || "").trim().replace(/^v/i, "")
}

function hasNewerRelease(currentVersion: string, releaseTag: string | undefined): boolean {
  if (!releaseTag) return false
  return normalizeVersion(currentVersion) !== normalizeVersion(releaseTag)
}

async function fetchLatestReleaseInfo(force: boolean = false): Promise<ManualUpdateInfo> {
  const currentVersion = getCurrentVersion()
  if (!force && cachedUpdateInfo.lastCheckedAt && Date.now() - cachedUpdateInfo.lastCheckedAt < UPDATE_CHECK_CACHE_MS) {
    return {
      ...cachedUpdateInfo,
      currentVersion,
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), UPDATE_CHECK_TIMEOUT_MS)

  try {
    const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "DotAgents-Desktop-Updater",
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`GitHub latest release check failed with HTTP ${response.status}`)
    }

    const payload = await response.json() as {
      tag_name?: string
      name?: string
      html_url?: string
      published_at?: string
      assets?: Array<{ name?: string; browser_download_url?: string }>
    }

    const latestRelease: ManualLatestReleaseInfo | undefined = payload.tag_name && payload.html_url
      ? {
        tagName: payload.tag_name,
        name: payload.name,
        publishedAt: payload.published_at,
        url: payload.html_url,
        assets: (payload.assets ?? [])
          .filter((asset) => asset.name && asset.browser_download_url)
          .map((asset) => ({
            name: asset.name!,
            downloadUrl: asset.browser_download_url!,
          })),
      }
      : undefined

    cachedUpdateInfo = {
      mode: "manual",
      currentVersion,
      latestRelease,
      updateAvailable: hasNewerRelease(currentVersion, latestRelease?.tagName),
      lastCheckedAt: Date.now(),
    }
    return cachedUpdateInfo
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    cachedUpdateInfo = {
      mode: "manual",
      currentVersion,
      latestRelease: cachedUpdateInfo.latestRelease,
      updateAvailable: cachedUpdateInfo.latestRelease
        ? hasNewerRelease(currentVersion, cachedUpdateInfo.latestRelease.tagName)
        : undefined,
      lastCheckedAt: Date.now(),
      error: message,
    }
    return cachedUpdateInfo
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Auto-updater is disabled - updates are manual via GitHub releases.
 * This prevents 403 errors from the invalid update server (electron-releases.umida.co).
 */

export function init() {
  // Auto-updater is disabled - no initialization needed
}

export function getUpdateInfo() {
  return {
    ...cachedUpdateInfo,
    currentVersion: getCurrentVersion(),
  }
}

export async function checkForUpdatesMenuItem(_menuItem: MenuItem) {
  const updateInfo = await fetchLatestReleaseInfo(true)
  await dialog.showMessageBox({
    type: "info",
    title: "Check for Updates",
    message: updateInfo.updateAvailable
      ? `Update available: ${updateInfo.latestRelease?.tagName || "latest release found"}`
      : updateInfo.error
        ? "Unable to check for updates right now."
        : "You are already on the latest known release.",
    detail: updateInfo.error
      ? `${updateInfo.error}\n\nManual releases: ${MANUAL_RELEASES_URL}`
      : `Current version: ${updateInfo.currentVersion}\nLatest release: ${updateInfo.latestRelease?.tagName || "Unknown"}\nManual releases: ${updateInfo.latestRelease?.url || MANUAL_RELEASES_URL}`,
    buttons: ["OK"],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
  })
}

export async function checkForUpdatesAndDownload() {
  const updateInfo = await fetchLatestReleaseInfo(true)
  return { updateInfo, downloadedUpdates: null }
}

export function quitAndInstall() {
  // No-op - auto-updater is disabled
}

export async function downloadUpdate() {
  return fetchLatestReleaseInfo(true)
}

export function cancelDownloadUpdate() {
  // No-op - auto-updater is disabled
}
