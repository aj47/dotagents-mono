import fs from "fs"
import path from "path"
import { app, dialog, type MenuItem } from "electron"

export const MANUAL_RELEASES_URL = "https://github.com/aj47/dotagents-mono/releases"
const GITHUB_LATEST_RELEASE_URL = "https://api.github.com/repos/aj47/dotagents-mono/releases/latest"
const UPDATE_CHECK_TIMEOUT_MS = 5000
const UPDATE_CHECK_CACHE_MS = 10 * 60 * 1000

interface ManualReleaseAssetInfo {
  name: string
  downloadUrl: string
}

interface ManualDownloadedAssetInfo {
  name: string
  filePath: string
  downloadedAt: number
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
  preferredAsset?: ManualReleaseAssetInfo
  lastCheckedAt?: number
  error?: string
  lastDownloadedAsset?: ManualDownloadedAssetInfo
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

function scoreReleaseAsset(asset: ManualReleaseAssetInfo): number {
  const name = asset.name.toLowerCase()
  let score = 0

  if (process.platform === "darwin") {
    if (name.includes("mac") || name.includes("darwin") || name.includes("osx")) score += 100
    if (process.arch === "arm64") {
      if (name.includes("arm64") || name.includes("aarch64") || name.includes("apple-silicon")) score += 30
      if (name.includes("x64") || name.includes("amd64")) score -= 20
    } else if (name.includes("x64") || name.includes("amd64")) {
      score += 30
    }
    if (name.endsWith(".dmg")) score += 40
    else if (name.endsWith(".zip")) score += 25
    else if (name.endsWith(".pkg")) score += 20
  } else if (process.platform === "win32") {
    if (name.includes("win") || name.includes("windows")) score += 100
    if (process.arch === "arm64") {
      if (name.includes("arm64")) score += 30
    } else if (name.includes("x64") || name.includes("amd64")) {
      score += 30
    }
    if (name.endsWith(".exe")) score += 40
    else if (name.endsWith(".msi")) score += 35
    else if (name.endsWith(".zip")) score += 15
  } else {
    if (name.includes("linux") || name.includes("appimage") || name.includes("deb") || name.includes("rpm")) score += 100
    if (process.arch === "arm64") {
      if (name.includes("arm64") || name.includes("aarch64")) score += 30
      if (name.includes("x64") || name.includes("amd64")) score -= 20
    } else if (name.includes("x64") || name.includes("amd64")) {
      score += 30
    }
    if (name.endsWith(".appimage")) score += 40
    else if (name.endsWith(".deb")) score += 35
    else if (name.endsWith(".rpm")) score += 30
    else if (name.endsWith(".tar.gz") || name.endsWith(".tgz")) score += 20
  }

  return score
}

function getPreferredReleaseAsset(assets: ManualReleaseAssetInfo[] | undefined): ManualReleaseAssetInfo | undefined {
  if (!assets || assets.length === 0) return undefined
  return [...assets].sort((left, right) => scoreReleaseAsset(right) - scoreReleaseAsset(left))[0]
}

function buildDownloadTargetPath(fileName: string): string {
  const downloadsDir = app.getPath("downloads") || app.getPath("temp")
  fs.mkdirSync(downloadsDir, { recursive: true })

  const parsed = path.parse(fileName)
  let candidate = path.join(downloadsDir, fileName)
  let suffix = 1
  while (fs.existsSync(candidate)) {
    candidate = path.join(downloadsDir, `${parsed.name}-${suffix}${parsed.ext}`)
    suffix += 1
  }
  return candidate
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
      preferredAsset: getPreferredReleaseAsset(latestRelease?.assets),
      updateAvailable: hasNewerRelease(currentVersion, latestRelease?.tagName),
      lastCheckedAt: Date.now(),
      lastDownloadedAsset: cachedUpdateInfo.lastDownloadedAsset,
    }
    return cachedUpdateInfo
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    cachedUpdateInfo = {
      mode: "manual",
      currentVersion,
      latestRelease: cachedUpdateInfo.latestRelease,
      preferredAsset: cachedUpdateInfo.preferredAsset,
      updateAvailable: cachedUpdateInfo.latestRelease
        ? hasNewerRelease(currentVersion, cachedUpdateInfo.latestRelease.tagName)
        : undefined,
      lastCheckedAt: Date.now(),
      error: message,
      lastDownloadedAsset: cachedUpdateInfo.lastDownloadedAsset,
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

export async function downloadLatestReleaseAsset() {
  const updateInfo = await fetchLatestReleaseInfo(true)
  const asset = updateInfo.preferredAsset

  if (!asset) {
    throw new Error("No matching release asset is available for this platform yet")
  }

  const response = await fetch(asset.downloadUrl, {
    headers: {
      "User-Agent": "DotAgents-Desktop-Updater",
    },
  })

  if (!response.ok) {
    throw new Error(`Release asset download failed with HTTP ${response.status}`)
  }

  const fileBuffer = Buffer.from(await response.arrayBuffer())
  if (fileBuffer.byteLength === 0) {
    throw new Error("Release asset download returned an empty response")
  }

  const filePath = buildDownloadTargetPath(asset.name)
  fs.writeFileSync(filePath, fileBuffer)

  const downloadedAsset: ManualDownloadedAssetInfo = {
    name: asset.name,
    filePath,
    downloadedAt: Date.now(),
  }

  cachedUpdateInfo = {
    ...updateInfo,
    lastDownloadedAsset: downloadedAsset,
  }

  return {
    updateInfo: cachedUpdateInfo,
    downloadedAsset,
  }
}

export function cancelDownloadUpdate() {
  // No-op - auto-updater is disabled
}
