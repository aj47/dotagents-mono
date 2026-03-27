import type { HubCatalogComponentCounts, HubCatalogItem } from "@dotagents/shared"
import { downloadHubBundleToTempFile } from "./hub-install"

export const HUB_CATALOG_URL = "https://raw.githubusercontent.com/aj47/dotagents-hub/main/catalog.json"

const HUB_RAW_BUNDLES_BASE_URL = "https://raw.githubusercontent.com/aj47/dotagents-hub/main/bundles/"

interface RawHubCatalogComponentCounts extends Partial<HubCatalogComponentCounts> {
  memories?: unknown
}

interface RawHubCatalogItem extends Omit<HubCatalogItem, "componentCounts"> {
  componentCounts?: RawHubCatalogComponentCounts
}

interface RawHubCatalogResponse {
  version?: unknown
  updatedAt?: unknown
  items?: unknown[]
}

export interface HubCatalogResponse {
  version: 1
  updatedAt: string
  items: HubCatalogItem[]
}

export interface DownloadHubCatalogBundleOptions {
  artifactUrl: string
  fileName?: string
  catalogId?: string
}

export interface DownloadHubCatalogBundleResult {
  filePath: string
  downloadedFrom: string
}

function toNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0
  }

  return Math.trunc(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return []
  }

  return tags
    .filter((tag): tag is string => isNonEmptyString(tag))
    .map((tag) => tag.trim())
}

function normalizeComponentCounts(
  componentCounts: RawHubCatalogComponentCounts | undefined,
): HubCatalogComponentCounts {
  return {
    agentProfiles: toNonNegativeInt(componentCounts?.agentProfiles),
    mcpServers: toNonNegativeInt(componentCounts?.mcpServers),
    skills: toNonNegativeInt(componentCounts?.skills),
    repeatTasks: toNonNegativeInt(componentCounts?.repeatTasks),
    knowledgeNotes: toNonNegativeInt(componentCounts?.knowledgeNotes ?? componentCounts?.memories),
  }
}

function normalizeCatalogItem(item: unknown): HubCatalogItem | null {
  if (!item || typeof item !== "object") {
    return null
  }

  const raw = item as RawHubCatalogItem

  if (
    !isNonEmptyString(raw.id) ||
    !isNonEmptyString(raw.name) ||
    !isNonEmptyString(raw.summary) ||
    !raw.author ||
    typeof raw.author !== "object" ||
    !isNonEmptyString(raw.author.displayName) ||
    !raw.artifact ||
    typeof raw.artifact !== "object" ||
    !isNonEmptyString(raw.artifact.url) ||
    !isNonEmptyString(raw.artifact.fileName) ||
    !isNonEmptyString(raw.publishedAt) ||
    !isNonEmptyString(raw.updatedAt)
  ) {
    return null
  }

  return {
    id: raw.id.trim(),
    name: raw.name.trim(),
    summary: raw.summary.trim(),
    description: isNonEmptyString(raw.description) ? raw.description.trim() : undefined,
    author: {
      displayName: raw.author.displayName.trim(),
      handle: isNonEmptyString(raw.author.handle) ? raw.author.handle.trim() : undefined,
      url: isNonEmptyString(raw.author.url) ? raw.author.url.trim() : undefined,
    },
    tags: normalizeTags(raw.tags),
    bundleVersion: 1,
    componentCounts: normalizeComponentCounts(raw.componentCounts),
    artifact: {
      url: raw.artifact.url.trim(),
      fileName: raw.artifact.fileName.trim(),
      sizeBytes: toNonNegativeInt(raw.artifact.sizeBytes),
    },
    publishedAt: raw.publishedAt.trim(),
    updatedAt: raw.updatedAt.trim(),
    compatibility: raw.compatibility,
  }
}

export function normalizeHubCatalogResponse(rawResponse: RawHubCatalogResponse): HubCatalogResponse {
  const items = Array.isArray(rawResponse.items)
    ? rawResponse.items
      .map((item) => normalizeCatalogItem(item))
      .filter((item): item is HubCatalogItem => item !== null)
    : []

  return {
    version: 1,
    updatedAt: isNonEmptyString(rawResponse.updatedAt)
      ? rawResponse.updatedAt.trim()
      : new Date(0).toISOString(),
    items,
  }
}

export function buildHubCatalogRawBundleUrl(fileName: string): string {
  return new URL(fileName, HUB_RAW_BUNDLES_BASE_URL).toString()
}

export function buildHubBundleDownloadUrls(
  options: DownloadHubCatalogBundleOptions,
): string[] {
  const artifactUrl = isNonEmptyString(options.artifactUrl) ? options.artifactUrl.trim() : ""
  const fileName = isNonEmptyString(options.fileName)
    ? options.fileName.trim()
    : isNonEmptyString(options.catalogId)
      ? `${options.catalogId.trim()}.dotagents`
      : ""
  const rawBundleUrl = fileName ? buildHubCatalogRawBundleUrl(fileName) : ""

  let preferRawBundleUrl = false
  if (artifactUrl) {
    try {
      preferRawBundleUrl = new URL(artifactUrl).hostname === "hub.dotagentsprotocol.com"
    } catch {
      preferRawBundleUrl = false
    }
  }

  const orderedUrls = preferRawBundleUrl
    ? [rawBundleUrl, artifactUrl]
    : [artifactUrl, rawBundleUrl]

  return orderedUrls.filter((url, index) => isNonEmptyString(url) && orderedUrls.indexOf(url) === index)
}

export async function fetchHubCatalog(catalogUrl: string = HUB_CATALOG_URL): Promise<HubCatalogResponse> {
  const response = await fetch(catalogUrl)
  if (!response.ok) {
    const statusSuffix = response.statusText ? ` ${response.statusText}` : ""
    throw new Error(`Hub catalog request failed with ${response.status}${statusSuffix}`)
  }

  const rawCatalog = await response.json()
  return normalizeHubCatalogResponse(rawCatalog as RawHubCatalogResponse)
}

export async function downloadHubCatalogBundle(
  options: DownloadHubCatalogBundleOptions,
): Promise<DownloadHubCatalogBundleResult> {
  const downloadUrls = buildHubBundleDownloadUrls(options)
  let lastError: unknown = null

  for (const downloadUrl of downloadUrls) {
    try {
      const filePath = await downloadHubBundleToTempFile(downloadUrl)
      return { filePath, downloadedFrom: downloadUrl }
    } catch (error) {
      lastError = error
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }

  throw new Error("Failed to download Hub bundle")
}
