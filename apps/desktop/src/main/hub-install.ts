import fs from "fs"
import os from "os"
import path from "path"
import { URL } from "url"

const HUB_INSTALL_PROTOCOL = "dotagents:"
const HUB_INSTALL_PATH = "/install"
const REMOTE_BUNDLE_PROTOCOLS = new Set(["http:", "https:"])

function normalizeDeepLinkPath(parsedUrl: URL): string {
  let fullPath = parsedUrl.pathname
  if (parsedUrl.hostname) {
    fullPath = `/${parsedUrl.hostname}${parsedUrl.pathname}`
  }
  return fullPath.replace(/^\/+/, "/") || "/"
}

function sanitizeBundleFileName(fileName: string): string {
  const sanitized = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return sanitized || "hub-bundle.dotagents"
}

function buildDownloadedBundleFileName(bundleUrl: string): string {
  try {
    const parsedUrl = new URL(bundleUrl)
    const baseName = path.basename(parsedUrl.pathname) || "hub-bundle.dotagents"
    const normalizedName = baseName.toLowerCase().endsWith(".dotagents")
      ? baseName
      : `${baseName}.dotagents`
    return sanitizeBundleFileName(normalizedName)
  } catch {
    return "hub-bundle.dotagents"
  }
}

function parseHubBundleInstallDeepLink(candidate: string): { bundleUrl: string } | null {
  if (typeof candidate !== "string" || !candidate.startsWith("dotagents://")) {
    return null
  }

  try {
    const parsedUrl = new URL(candidate)
    if (parsedUrl.protocol.toLowerCase() !== HUB_INSTALL_PROTOCOL) {
      return null
    }

    if (normalizeDeepLinkPath(parsedUrl) !== HUB_INSTALL_PATH) {
      return null
    }

    const bundleUrl = parsedUrl.searchParams.get("bundle")?.trim()
    if (!bundleUrl) {
      return null
    }

    const parsedBundleUrl = new URL(bundleUrl)
    if (!REMOTE_BUNDLE_PROTOCOLS.has(parsedBundleUrl.protocol.toLowerCase())) {
      return null
    }

    return { bundleUrl: parsedBundleUrl.toString() }
  } catch {
    return null
  }
}

export function findHubBundleInstallBundleUrl(candidates: readonly string[]): string | null {
  for (const candidate of candidates) {
    const parsed = parseHubBundleInstallDeepLink(candidate)
    if (parsed) {
      return parsed.bundleUrl
    }
  }

  return null
}

export async function downloadHubBundleToTempFile(bundleUrl: string): Promise<string> {
  const response = await fetch(bundleUrl)
  if (!response.ok) {
    const statusSuffix = response.statusText ? ` ${response.statusText}` : ""
    throw new Error(`Hub bundle download failed with ${response.status}${statusSuffix}`)
  }

  const bundleBuffer = Buffer.from(await response.arrayBuffer())
  if (bundleBuffer.byteLength === 0) {
    throw new Error("Hub bundle download returned an empty response")
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-hub-install-"))
  const filePath = path.join(tempDir, buildDownloadedBundleFileName(bundleUrl))
  fs.writeFileSync(filePath, bundleBuffer)
  return filePath
}
