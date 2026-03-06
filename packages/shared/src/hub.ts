export interface HubCatalogAuthor {
  displayName: string
  handle?: string
  url?: string
}

export interface HubCatalogCompatibility {
  minDesktopVersion?: string
  notes?: string[]
}

export interface HubCatalogComponentCounts {
  agentProfiles: number
  mcpServers: number
  skills: number
  repeatTasks: number
  memories: number
}

export interface HubCatalogArtifact {
  url: string
  fileName: string
  sizeBytes: number
}

export interface HubCatalogItem {
  id: string
  name: string
  summary: string
  description?: string
  author: HubCatalogAuthor
  tags: string[]
  bundleVersion: 1
  componentCounts: HubCatalogComponentCounts
  artifact: HubCatalogArtifact
  publishedAt: string
  updatedAt: string
  compatibility?: HubCatalogCompatibility
}

export interface HubPublishPayload {
  catalogItem: HubCatalogItem
  bundleJson: string
  installUrl: string
}

export interface HubPublishSubmission {
  source: "dotagents-desktop"
  version: 1
  payload: HubPublishPayload
}

export const DEFAULT_HUB_BASE_URL = "https://hub.dotagentsprotocol.com"

export function slugifyHubCatalogId(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "bundle"
}

export function buildHubBundleArtifactUrl(
  catalogId: string,
  hubBaseUrl: string = DEFAULT_HUB_BASE_URL,
): string {
  const baseUrl = new URL(hubBaseUrl)
  baseUrl.pathname = `/bundles/${catalogId}.dotagents`
  baseUrl.search = ""
  baseUrl.hash = ""
  return baseUrl.toString()
}

export function buildHubBundleInstallUrl(bundleUrl: string): string {
  return `dotagents://install?bundle=${encodeURIComponent(bundleUrl)}`
}