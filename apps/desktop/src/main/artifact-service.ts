import { createHash } from "crypto"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { shell } from "electron"
import type {
  ArtifactKind,
  ArtifactListResponse,
  ArtifactRecord,
  ArtifactReferenceSource,
  Conversation,
  ConversationMessage,
} from "../shared/types"
import { conversationService } from "./conversation-service"
import {
  CONVERSATION_IMAGE_ASSET_HOST,
  getConversationImageAssetPath,
} from "./conversation-image-assets"
import {
  CONVERSATION_VIDEO_ASSET_HOST,
  getConversationVideoAssetPath,
} from "./conversation-video-assets"

const TEXT_PREVIEW_DEFAULT_MAX_BYTES = 256 * 1024
const TEXT_PREVIEW_MAX_BYTES = 1024 * 1024
const ARTIFACT_SCAN_CONCURRENCY = 16
const MARKDOWN_LINK_OR_IMAGE_REGEX =
  /!?\[([^\]]*)\]\(([^)\s]+(?:\s+"[^"]*")?)\)/g
const URL_REGEX = /\b(?:https?|file|assets):\/\/[^\s<>"'`)\]]+/gi
const QUOTED_PATH_REGEX = /["'`]((?:~|\/)[^"'`\n]+?)["'`]/g
const ABSOLUTE_PATH_REGEX = /(^|[\s([{:])((?:~|\/)[^\s"'`<>),\]}]+)/g

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".apng",
  ".gif",
  ".jpg",
  ".jpeg",
  ".webp",
  ".bmp",
  ".avif",
  ".svg",
])
const VIDEO_EXTENSIONS = new Set([".mp4", ".m4v", ".webm", ".mov", ".ogv"])
const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".m4a",
  ".aac",
  ".flac",
  ".ogg",
  ".oga",
  ".opus",
  ".webm",
])
const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown", ".mdx"])
const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".log",
  ".json",
  ".jsonl",
  ".csv",
  ".tsv",
  ".xml",
  ".yaml",
  ".yml",
])
const HTML_EXTENSIONS = new Set([".html", ".htm"])
const PDF_EXTENSIONS = new Set([".pdf"])

type ArtifactReference = {
  raw: string
  label?: string
  source: ArtifactReferenceSource
  conversation: Conversation
  message: ConversationMessage
  text: string
}

type ListArtifactsInput = {
  query?: string
  kind?: ArtifactKind | "all"
  conversationId?: string
  maxConversations?: number
  limit?: number
  offset?: number
  forceRefresh?: boolean
}

type ArtifactCollection = {
  artifacts: ArtifactRecord[]
  scannedConversationCount: number
  totalConversationCount: number
}

function trimReference(raw: string): string {
  return raw
    .trim()
    .replace(/^[<([{]+/u, "")
    .replace(/[>.,;:!?)}\]]+$/u, "")
}

function expandHome(candidate: string): string {
  if (candidate === "~") return os.homedir()
  if (candidate.startsWith("~/"))
    return path.join(os.homedir(), candidate.slice(2))
  return candidate
}

function stableId(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 32)
}

function statNumber(value: number | bigint | undefined): number | undefined {
  if (typeof value === "bigint") return Number(value)
  return value
}

function classifyPath(filePath: string): ArtifactKind {
  const ext = path.extname(filePath).toLowerCase()
  if (MARKDOWN_EXTENSIONS.has(ext)) return "markdown"
  if (TEXT_EXTENSIONS.has(ext)) return "text"
  if (HTML_EXTENSIONS.has(ext)) return "html"
  if (PDF_EXTENSIONS.has(ext)) return "pdf"
  if (IMAGE_EXTENSIONS.has(ext)) return "image"
  if (VIDEO_EXTENSIONS.has(ext)) return "video"
  if (AUDIO_EXTENSIONS.has(ext)) return "audio"
  return ext ? "file" : "unknown"
}

function classifyUrl(rawUrl: string): ArtifactKind {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol === "assets:") {
      return classifyPath(parsed.pathname)
    }
    if (parsed.protocol === "file:") {
      return classifyPath(parsed.pathname)
    }
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      const pathKind = classifyPath(parsed.pathname)
      return pathKind === "unknown" || pathKind === "file" ? "url" : pathKind
    }
  } catch {
    return "url"
  }
  return "url"
}

function canReadText(kind: ArtifactKind): boolean {
  return kind === "markdown" || kind === "text" || kind === "html"
}

function canPreview(kind: ArtifactKind): boolean {
  return (
    canReadText(kind) ||
    kind === "image" ||
    kind === "video" ||
    kind === "audio" ||
    kind === "pdf"
  )
}

function shouldIgnoreLocalPath(filePath: string, raw: string): boolean {
  if (/^assets:\/\//i.test(raw)) return false
  const normalized = path.normalize(filePath)
  const parts = normalized.split(path.sep)
  const supportIndex = parts.findIndex(
    (part, index) =>
      part === "Application Support" &&
      ["app.dotagents", "dotagents"].includes(parts[index + 1] ?? ""),
  )
  if (supportIndex >= 0) return true
  return normalized.split(path.sep).includes(".git")
}

function getExcerpt(text: string, raw: string): string {
  const index = text.indexOf(raw)
  const start = index >= 0 ? Math.max(0, index - 90) : 0
  const end =
    index >= 0
      ? Math.min(text.length, index + raw.length + 360)
      : Math.min(text.length, 360)
  const nearby = text.slice(start, end).replace(/\s+/g, " ").trim()
  const highlights = nearby
    .match(/\bHighlights:\s*(.+)$/iu)?.[1]
    ?.replace(/\s*\[[^\]]+\]\([^)]+\).*$/u, "")
    .trim()
  if (highlights) return highlights

  return nearby
    .replace(/\{?"stderr":\s*""\s*\}?\s*/iu, "")
    .replace(/\[[^\]]+:[^\]]+\]\s*/u, "")
    .replace(/\bURL:\s*\S+\s*/iu, "")
    .replace(/\bPublished:\s*[^.]+?\s+(?=Author:|Highlights:|$)/iu, "")
    .replace(/\bAuthor:\s*[^.]+?\s+(?=Highlights:|$)/iu, "")
    .trim()
}

function isWeakArtifactLabel(label?: string): boolean {
  const trimmed = label?.trim()
  if (!trimmed) return true
  if (/^\d+$/.test(trimmed)) return true
  if (/^https?:\/\//i.test(trimmed)) return true
  if (/^(?:title|url|source|file|path)$/i.test(trimmed)) return true
  if (/^[a-z0-9]+(?:-[a-z0-9]+){3,}$/u.test(trimmed)) return true
  return trimmed.length > 80
}

function titleFromReferenceText(text: string, raw: string): string | null {
  const rawIndex = text.indexOf(raw)
  const normalizeTitle = (title?: string) => {
    const normalized = title
      ?.replace(/\s+\b(?:URL|Published|Author|Highlights):.*$/iu, "")
      .replace(/\s+/g, " ")
      .trim()
    return normalized && !isWeakArtifactLabel(normalized) ? normalized : null
  }
  const matchTitle = (value: string, pick: "first" | "last") => {
    const matches = Array.from(
      value.matchAll(/(?:^|[\s)])(?:Title|title):\s*([^"\n\r|{}[\]]{4,90})/gu),
    )
    return normalizeTitle(
      (pick === "first" ? matches.at(0) : matches.at(-1))?.[1],
    )
  }

  if (rawIndex >= 0) {
    const after = text.slice(rawIndex + raw.length, rawIndex + raw.length + 240)
    const afterTitle = matchTitle(after, "first")
    if (afterTitle) return afterTitle

    const before = text.slice(Math.max(0, rawIndex - 320), rawIndex)
    if (/\bURL:\s*$/iu.test(before)) {
      const beforeTitle = matchTitle(before, "last")
      if (beforeTitle) return beforeTitle
    }
    return null
  }

  return matchTitle(text.slice(0, 360), "first")
}

function titleFromUrlOrPath(
  raw: string,
  localPath?: string,
  url?: string,
): string {
  if (localPath) return path.basename(localPath)
  try {
    const parsed = new URL(url ?? raw)
    const lastPathSegment = parsed.pathname.split("/").filter(Boolean).pop()
    const decoded = decodeURIComponent(lastPathSegment || parsed.hostname)
    if (/^\d+$/.test(decoded)) return parsed.hostname || decoded || raw
    if (/^[a-z0-9]+(?:-[a-z0-9]+){2,}$/u.test(decoded)) {
      return decoded
        .split("-")
        .filter(Boolean)
        .map((part) => {
          if (part === "youtube") return "YouTube"
          return part.length <= 3
            ? part.toUpperCase()
            : part[0].toUpperCase() + part.slice(1)
        })
        .join(" ")
    }
    return decoded || parsed.hostname || raw
  } catch {
    return raw
  }
}

function collectStringValues(value: unknown, depth = 0): string[] {
  if (depth > 5) return []
  if (typeof value === "string") return [value]
  if (!value || typeof value !== "object") return []
  if (Array.isArray(value))
    return value.flatMap((entry) => collectStringValues(entry, depth + 1))
  return Object.values(value as Record<string, unknown>).flatMap((entry) =>
    collectStringValues(entry, depth + 1),
  )
}

function maybeParseJsonStrings(value: string): string[] {
  const trimmed = value.trim()
  if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[")) return []
  try {
    return collectStringValues(JSON.parse(trimmed))
  } catch {
    return []
  }
}

function extractReferencesFromText(
  text: string,
  source: ArtifactReferenceSource,
  conversation: Conversation,
  message: ConversationMessage,
): ArtifactReference[] {
  const references: ArtifactReference[] = []
  const add = (raw: string, label?: string) => {
    const trimmed = trimReference(raw)
    if (!trimmed) return
    references.push({
      raw: trimmed,
      label,
      source,
      conversation,
      message,
      text,
    })
  }

  for (const match of text.matchAll(MARKDOWN_LINK_OR_IMAGE_REGEX)) {
    const urlPart = match[2]?.split(/\s+"[^"]*"$/u)[0]
    if (urlPart) add(urlPart, match[1])
  }

  for (const match of text.matchAll(URL_REGEX)) {
    add(match[0])
  }

  for (const match of text.matchAll(QUOTED_PATH_REGEX)) {
    add(match[1])
  }

  for (const match of text.matchAll(ABSOLUTE_PATH_REGEX)) {
    add(match[2])
  }

  return references
}

function extractReferences(conversation: Conversation): ArtifactReference[] {
  const references: ArtifactReference[] = []
  const messages = [
    ...(conversation.rawMessages ?? []),
    ...(conversation.messages ?? []),
  ]
  const seenMessages = new Set<string>()

  for (const message of messages) {
    const messageKey = `${message.id}:${message.timestamp}:${message.role}`
    if (seenMessages.has(messageKey)) continue
    seenMessages.add(messageKey)

    references.push(
      ...extractReferencesFromText(
        message.content,
        "content",
        conversation,
        message,
      ),
    )
    if (message.displayContent) {
      references.push(
        ...extractReferencesFromText(
          message.displayContent,
          "displayContent",
          conversation,
          message,
        ),
      )
    }

    for (const toolCall of message.toolCalls ?? []) {
      for (const value of collectStringValues(toolCall.arguments)) {
        references.push(
          ...extractReferencesFromText(
            value,
            "toolCall",
            conversation,
            message,
          ),
        )
        for (const nested of maybeParseJsonStrings(value)) {
          references.push(
            ...extractReferencesFromText(
              nested,
              "toolCall",
              conversation,
              message,
            ),
          )
        }
      }
    }

    for (const toolResult of message.toolResults ?? []) {
      const values = [toolResult.content, toolResult.error].filter(
        (value): value is string => typeof value === "string",
      )
      for (const value of values) {
        references.push(
          ...extractReferencesFromText(
            value,
            "toolResult",
            conversation,
            message,
          ),
        )
        for (const nested of maybeParseJsonStrings(value)) {
          references.push(
            ...extractReferencesFromText(
              nested,
              "toolResult",
              conversation,
              message,
            ),
          )
        }
      }
    }
  }

  return references
}

function resolveConversationAssetPath(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== "assets:") return null
    const segments = parsed.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment))
    const [conversationId, fileName] = segments
    if (!conversationId || !fileName) return null

    if (parsed.hostname === CONVERSATION_IMAGE_ASSET_HOST) {
      return getConversationImageAssetPath(conversationId, fileName)
    }
    if (parsed.hostname === CONVERSATION_VIDEO_ASSET_HOST) {
      return getConversationVideoAssetPath(conversationId, fileName)
    }
  } catch {
    return null
  }
  return null
}

async function resolveReference(
  reference: ArtifactReference,
): Promise<ArtifactRecord | null> {
  const raw = reference.raw
  const timestamp = reference.message.timestamp
  let localPath: string | undefined
  let url: string | undefined
  let normalizedReference = raw
  let kind: ArtifactKind = "unknown"
  let stat: Awaited<ReturnType<typeof fs.stat>> | null = null
  let previewUrl: string | undefined

  if (/^https?:\/\//i.test(raw)) {
    url = raw
    normalizedReference = raw
    kind = classifyUrl(raw)
  } else if (/^file:\/\//i.test(raw)) {
    try {
      localPath = decodeURIComponent(new URL(raw).pathname)
      normalizedReference = localPath
    } catch {
      return null
    }
  } else if (/^assets:\/\//i.test(raw)) {
    url = raw
    localPath = resolveConversationAssetPath(raw) ?? undefined
    normalizedReference = raw
    kind = classifyUrl(raw)
    previewUrl = raw
  } else if (raw.startsWith("/") || raw.startsWith("~/")) {
    localPath = expandHome(raw)
    normalizedReference = localPath
  } else {
    return null
  }

  if (localPath) {
    if (shouldIgnoreLocalPath(localPath, raw)) return null
    try {
      stat = await fs.stat(localPath)
      if (!stat.isFile()) return null
    } catch {
      return null
    }
    kind = classifyPath(localPath)
  }

  const id = stableId(normalizedReference)
  if (localPath && !previewUrl && canPreview(kind)) {
    previewUrl = `assets://artifact/${id}`
  }

  const referenceTitle = titleFromUrlOrPath(raw, localPath, url)
  const nearbyTitle = titleFromReferenceText(reference.text, raw)
  const labelTitle = isWeakArtifactLabel(reference.label)
    ? null
    : reference.label!.trim()
  const name = labelTitle || nearbyTitle || referenceTitle

  const sizeBytes = statNumber(stat?.size)
  const modifiedAt = statNumber(stat?.mtimeMs)

  return {
    id,
    kind,
    name,
    title: name,
    originalReference: raw,
    normalizedReference,
    ...(localPath ? { localPath } : {}),
    ...(url ? { url } : {}),
    ...(previewUrl ? { previewUrl } : {}),
    ...(sizeBytes !== undefined ? { sizeBytes } : {}),
    ...(modifiedAt !== undefined ? { modifiedAt } : {}),
    createdAt: timestamp,
    updatedAt: modifiedAt ?? timestamp,
    conversationId: reference.conversation.id,
    conversationTitle: reference.conversation.title,
    messageId: reference.message.id,
    messageRole: reference.message.role,
    messageTimestamp: timestamp,
    source: reference.source,
    excerpt: getExcerpt(reference.text, raw),
    canPreview: canPreview(kind) && (!!previewUrl || !!url),
    canReadText: canReadText(kind) && !!localPath,
    canOpen: !!localPath || !!url,
    canReveal: !!localPath,
  }
}

function matchesQuery(artifact: ArtifactRecord, query?: string): boolean {
  const normalized = query?.trim().toLowerCase()
  if (!normalized) return true
  return [
    artifact.name,
    artifact.originalReference,
    artifact.normalizedReference,
    artifact.conversationTitle,
    artifact.excerpt,
  ].some((value) => value?.toLowerCase().includes(normalized))
}

class ArtifactService {
  private cachedArtifacts: ArtifactRecord[] = []
  private cachedCollection:
    | (ArtifactCollection & {
        cacheKey: string
      })
    | null = null

  private getCollectionCacheKey(input: {
    conversationId?: string
    maxConversations?: number
  }): string {
    return `${input.conversationId ?? "recent"}:${input.maxConversations ?? 200}`
  }

  private getHistoryCacheSignature(
    conversations: Awaited<
      ReturnType<typeof conversationService.getConversationHistory>
    >,
  ): string {
    return conversations
      .map((item) => `${item.id}:${item.updatedAt}:${item.messageCount}`)
      .join("|")
  }

  private async collectArtifacts(
    input: {
      conversationId?: string
      maxConversations?: number
      forceRefresh?: boolean
    } = {},
  ): Promise<ArtifactCollection> {
    const history = await conversationService.getConversationHistory()
    const conversationsToScan = input.conversationId
      ? history.filter((item) => item.id === input.conversationId)
      : history.slice(0, Math.max(1, input.maxConversations ?? 200))
    const cacheKey = `${this.getCollectionCacheKey(input)}:${this.getHistoryCacheSignature(conversationsToScan)}`
    if (!input.forceRefresh && this.cachedCollection?.cacheKey === cacheKey) {
      return this.cachedCollection
    }

    const records = new Map<string, ArtifactRecord>()
    let nextIndex = 0
    const scanWorker = async () => {
      while (nextIndex < conversationsToScan.length) {
        const item = conversationsToScan[nextIndex++]
        const conversation =
          await conversationService.loadConversationForDisplay(item.id)
        if (!conversation) continue

        for (const reference of extractReferences(conversation)) {
          const artifact = await resolveReference(reference)
          if (!artifact) continue

          const existing = records.get(artifact.id)
          if (
            !existing ||
            (artifact.updatedAt ?? 0) > (existing.updatedAt ?? 0)
          ) {
            records.set(artifact.id, artifact)
          }
        }
      }
    }

    await Promise.all(
      Array.from(
        {
          length: Math.min(
            ARTIFACT_SCAN_CONCURRENCY,
            conversationsToScan.length,
          ),
        },
        scanWorker,
      ),
    )

    const collection = {
      artifacts: Array.from(records.values()).sort(
        (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
      ),
      scannedConversationCount: conversationsToScan.length,
      totalConversationCount: history.length,
    }
    this.cachedCollection = {
      ...collection,
      cacheKey,
    }
    return collection
  }

  async listArtifacts(
    input: ListArtifactsInput = {},
  ): Promise<ArtifactListResponse> {
    const collected = await this.collectArtifacts({
      conversationId: input.conversationId,
      maxConversations: input.maxConversations,
      forceRefresh: input.forceRefresh,
    })
    this.cachedArtifacts = collected.artifacts
    const filtered = collected.artifacts.filter((artifact) => {
      if (
        input.conversationId &&
        artifact.conversationId !== input.conversationId
      )
        return false
      if (input.kind && input.kind !== "all" && artifact.kind !== input.kind)
        return false
      return matchesQuery(artifact, input.query)
    })
    const countsByKind: Partial<Record<ArtifactKind, number>> = {}
    for (const artifact of filtered) {
      countsByKind[artifact.kind] = (countsByKind[artifact.kind] ?? 0) + 1
    }

    const offset = Math.max(0, input.offset ?? 0)
    const limit = Math.min(500, Math.max(1, input.limit ?? 200))
    return {
      artifacts: filtered.slice(offset, offset + limit),
      total: filtered.length,
      scannedConversationCount: collected.scannedConversationCount,
      totalConversationCount: collected.totalConversationCount,
      countsByKind,
    }
  }

  async getArtifact(id: string): Promise<ArtifactRecord | null> {
    const cached = this.cachedArtifacts.find((artifact) => artifact.id === id)
    if (cached) return cached

    const collected = await this.collectArtifacts()
    this.cachedArtifacts = collected.artifacts
    return collected.artifacts.find((artifact) => artifact.id === id) ?? null
  }

  async resolvePreviewPath(id: string): Promise<string | null> {
    const artifact = await this.getArtifact(id)
    if (!artifact?.localPath || !canPreview(artifact.kind)) return null
    return artifact.localPath
  }

  async readArtifactText(input: { id: string; maxBytes?: number }): Promise<{
    content: string
    truncated: boolean
    artifact: ArtifactRecord
  }> {
    const artifact = await this.getArtifact(input.id)
    if (!artifact?.localPath || !artifact.canReadText) {
      throw new Error("Artifact is not a readable text artifact")
    }

    const maxBytes = Math.min(
      TEXT_PREVIEW_MAX_BYTES,
      Math.max(1, input.maxBytes ?? TEXT_PREVIEW_DEFAULT_MAX_BYTES),
    )
    const file = await fs.open(artifact.localPath, "r")
    try {
      const buffer = Buffer.alloc(maxBytes + 1)
      const { bytesRead } = await file.read(buffer, 0, maxBytes + 1, 0)
      const truncated = bytesRead > maxBytes
      return {
        content: buffer
          .subarray(0, Math.min(bytesRead, maxBytes))
          .toString("utf8"),
        truncated,
        artifact,
      }
    } finally {
      await file.close()
    }
  }

  async openArtifact(id: string): Promise<void> {
    const artifact = await this.getArtifact(id)
    if (!artifact) throw new Error("Artifact not found")
    if (artifact.localPath) {
      const error = await shell.openPath(artifact.localPath)
      if (error) throw new Error(error)
      return
    }
    if (artifact.url) {
      await shell.openExternal(artifact.url)
      return
    }
    throw new Error("Artifact cannot be opened")
  }

  async openArtifactPath(filePath: string): Promise<void> {
    const normalizedPath = filePath.startsWith("~/")
      ? path.join(os.homedir(), filePath.slice(2))
      : filePath
    const error = await shell.openPath(normalizedPath)
    if (error) throw new Error(error)
  }

  async showArtifactInFolder(id: string): Promise<void> {
    const artifact = await this.getArtifact(id)
    if (!artifact?.localPath) throw new Error("Artifact has no local file")
    shell.showItemInFolder(artifact.localPath)
  }
}

export const artifactService = new ArtifactService()
export { extractReferencesFromText, classifyPath, classifyUrl }
