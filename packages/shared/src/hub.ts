import type { BundlePublicMetadata, DotAgentsBundle } from "./bundle-api"

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

export interface BuildHubPublishPayloadFromBundleOptions {
  catalogId?: string
  artifactUrl?: string
  now?: () => Date
  bundleJson?: string
  getBundleSizeBytes?: (bundleJson: string) => number
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

function normalizeHubPublishOptionalString(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

export function normalizeHubPublishCatalogId(catalogId: string | undefined, bundleName: string): string {
  const normalized = normalizeHubPublishOptionalString(catalogId)
  return slugifyHubCatalogId(normalized || bundleName)
}

export function normalizeHubPublishArtifactUrl(artifactUrl: string | undefined, catalogId: string): string {
  const normalized = normalizeHubPublishOptionalString(artifactUrl)
  if (!normalized) {
    return buildHubBundleArtifactUrl(catalogId)
  }

  try {
    const parsedUrl = new URL(normalized)
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("unsupported protocol")
    }
    return parsedUrl.toString()
  } catch {
    throw new Error("Publish payload requires artifactUrl to be a valid http(s) URL")
  }
}

export function buildHubPublishArtifactFileName(bundleName: string, catalogId: string): string {
  const safeName = bundleName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim()
  return `${safeName || catalogId}.dotagents`
}

export function buildHubBundleInstallUrl(bundleUrl: string): string {
  return `dotagents://install?bundle=${encodeURIComponent(bundleUrl)}`
}

export function assertHubPublishPublicMetadata(
  publicMetadata: BundlePublicMetadata | undefined,
): asserts publicMetadata is BundlePublicMetadata {
  if (!publicMetadata?.summary) {
    throw new Error("Publish payload requires a summary in publicMetadata")
  }
  if (!publicMetadata.author?.displayName) {
    throw new Error("Publish payload requires author.displayName in publicMetadata")
  }
}

export function getHubBundleJsonSizeBytes(bundleJson: string): number {
  return new TextEncoder().encode(bundleJson).length
}

export function buildHubPublishPayloadFromBundle(
  bundle: DotAgentsBundle,
  options: BuildHubPublishPayloadFromBundleOptions = {},
): HubPublishPayload {
  const bundleJson = options.bundleJson ?? JSON.stringify(bundle, null, 2)
  const publishedAt = (options.now?.() ?? new Date()).toISOString()
  const catalogId = normalizeHubPublishCatalogId(options.catalogId, bundle.manifest.name)
  const artifactUrl = normalizeHubPublishArtifactUrl(options.artifactUrl, catalogId)
  const artifactFileName = buildHubPublishArtifactFileName(bundle.manifest.name, catalogId)
  const publicMetadata = bundle.manifest.publicMetadata
  assertHubPublishPublicMetadata(publicMetadata)

  return {
    catalogItem: {
      id: catalogId,
      name: bundle.manifest.name,
      summary: publicMetadata.summary,
      description: bundle.manifest.description,
      author: publicMetadata.author,
      tags: publicMetadata.tags,
      bundleVersion: 1,
      publishedAt,
      updatedAt: publishedAt,
      componentCounts: bundle.manifest.components,
      artifact: {
        url: artifactUrl,
        fileName: artifactFileName,
        sizeBytes: (options.getBundleSizeBytes ?? getHubBundleJsonSizeBytes)(bundleJson),
      },
      ...(publicMetadata.compatibility
        ? { compatibility: publicMetadata.compatibility }
        : {}),
    },
    bundleJson,
    installUrl: buildHubBundleInstallUrl(artifactUrl),
  }
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
