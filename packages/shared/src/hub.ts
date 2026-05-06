import type { BundlePublicMetadata } from "./bundle-api"

export interface HubCatalogAuthor {
  displayName: string
  handle?: string
  url?: string
}

export interface HubCatalogCompatibility {
  minDesktopVersion?: string
  notes?: string[]
}

interface HubCatalogComponentCounts {
  agentProfiles: number
  mcpServers: number
  skills: number
  repeatTasks: number
  knowledgeNotes: number
}

interface HubCatalogArtifact {
  url: string
  fileName: string
  sizeBytes: number
}

interface HubCatalogItem {
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

export interface HubPublishMetadataDraft {
  name?: string
  catalogId?: string
  artifactUrl?: string
  summary?: string
  authorName?: string
  authorHandle?: string
  authorUrl?: string
  tags?: string
}

const DEFAULT_HUB_BASE_URL = "https://hub.dotagentsprotocol.com"

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

export function buildHubBundlePublicMetadata(draft: HubPublishMetadataDraft): BundlePublicMetadata {
  return {
    summary: draft.summary?.trim() ?? "",
    author: {
      displayName: draft.authorName?.trim() ?? "",
      ...(draft.authorHandle?.trim() ? { handle: draft.authorHandle.trim() } : {}),
      ...(draft.authorUrl?.trim() ? { url: draft.authorUrl.trim() } : {}),
    },
    tags: draft.tags?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [],
  }
}

export function getHubDraftCatalogId(draft: HubPublishMetadataDraft): string {
  return slugifyHubCatalogId(draft.catalogId?.trim() || draft.name?.trim() || "")
}

export function getHubDraftArtifactUrl(draft: HubPublishMetadataDraft): string {
  return draft.artifactUrl?.trim() || buildHubBundleArtifactUrl(getHubDraftCatalogId(draft))
}

export function buildHubPublishSubmission(payload: HubPublishPayload): HubPublishSubmission {
  return {
    source: "dotagents-desktop",
    version: 1,
    payload,
  }
}
