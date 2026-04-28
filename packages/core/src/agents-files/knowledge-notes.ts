import fs from "fs"
import path from "path"
import type { KnowledgeNote, KnowledgeNoteContext, KnowledgeNoteEntryType } from "../types"
import type { AgentsLayerPaths } from "./modular-config"
import { parseFrontmatterOrBody, stringifyFrontmatterDocument } from "./frontmatter"
import { readTextFileIfExistsSync, safeWriteFileSync } from "./safe-file"

export const AGENTS_KNOWLEDGE_DIR = "knowledge"

export type AgentsKnowledgeNoteOrigin = {
  dirPath: string
  filePath: string
  slug: string
  assetFilePaths: string[]
}

export type LoadedAgentsKnowledgeNotesLayer = {
  notes: KnowledgeNote[]
  originById: Map<string, AgentsKnowledgeNoteOrigin>
}

const VALID_CONTEXT_VALUES = new Set<KnowledgeNoteContext>(["auto", "search-only"])
const VALID_ENTRY_TYPE_VALUES = new Set<KnowledgeNoteEntryType>(["note", "entry", "overview"])

type KnowledgeNoteParseOptions = {
  fallbackId?: string
  filePath?: string
  warnOnRepair?: boolean
}

type ParsedTimestamp = {
  value: number
  parsedAsDateString: boolean
}

function normalizeSingleLine(text: string): string {
  return text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim()
}

function sanitizeFileComponent(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function normalizePathLikeValue(raw: string | undefined): string | undefined {
  const normalized = (raw ?? "")
    .trim()
    .replace(/\\+/g, "/")
    .split("/")
    .map(normalizeSingleLine)
    .filter(Boolean)
    .join("/")

  return normalized || undefined
}

function sanitizeRelativeLocation(location: string): string {
  const normalized = normalizePathLikeValue(location)
  if (!normalized) return "note"
  const parts = normalized.split("/").map(sanitizeFileComponent).filter(Boolean)
  return parts.join(path.sep) || "note"
}

function splitLocationSegments(location: string): string[] {
  const normalized = normalizePathLikeValue(location)
  if (!normalized) return []
  return normalized.split("/").map(sanitizeFileComponent).filter(Boolean)
}

function inferEntryTypeFromLocation(relativeDirSegments: string[]): KnowledgeNoteEntryType | undefined {
  const leaf = relativeDirSegments[relativeDirSegments.length - 1]?.toLowerCase()
  if (!leaf) return undefined
  if (["index", "overview", "current-state"].includes(leaf)) return "overview"
  if (relativeDirSegments.length > 1) return "entry"
  return undefined
}

function applyInferredGrouping(note: KnowledgeNote, relativeDirSegments: string[]): KnowledgeNote {
  const group = normalizePathLikeValue(note.group)
  const series = normalizePathLikeValue(note.series)
  const inferredGroup = group ?? (relativeDirSegments.length > 1 ? relativeDirSegments[0] : undefined)
  const inferredSeries = series ?? (() => {
    if (relativeDirSegments.length <= 2) return undefined
    return normalizePathLikeValue(relativeDirSegments.slice(1, -1).join("/"))
  })()
  const entryType = VALID_ENTRY_TYPE_VALUES.has(note.entryType as KnowledgeNoteEntryType)
    ? note.entryType
    : inferEntryTypeFromLocation(relativeDirSegments)

  return {
    ...note,
    group: inferredGroup,
    series: inferredSeries,
    entryType,
  }
}

function parseListValue(raw: string | undefined): string[] {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return []

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      }
    } catch {
      // fall through to CSV
    }
  }

  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function formatListValue(values: string[] | undefined): string {
  const list = Array.isArray(values) ? values : []
  return list.map(normalizeSingleLine).filter(Boolean).join(", ")
}

function parseTimestamp(raw: string | undefined): ParsedTimestamp | undefined {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  if (Number.isFinite(parsed)) return { value: parsed, parsedAsDateString: false }

  const dateMs = Date.parse(trimmed)
  if (Number.isFinite(dateMs)) return { value: dateMs, parsedAsDateString: true }
  return undefined
}

function tryGetFileMtimeMs(filePath: string | undefined): number | undefined {
  if (!filePath) return undefined
  try {
    const stat = fs.statSync(filePath)
    const mtime = stat.mtimeMs
    if (!Number.isFinite(mtime)) return undefined
    return Math.floor(mtime)
  } catch {
    return undefined
  }
}

function warnRecoveredKnowledgeNote(options: KnowledgeNoteParseOptions, id: string, repairs: string[]): void {
  if (!options.warnOnRepair || repairs.length === 0) return
  const source = options.filePath ? ` at ${options.filePath}` : id ? ` ${id}` : ""
  console.warn(`[dotagents] Recovered knowledge note frontmatter${source}: ${repairs.join("; ")}`)
}

function hasOwn(obj: Record<string, string>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function collectNoteAssetFilePaths(noteDir: string, noteFilePath: string): string[] {
  const assetFilePaths: string[] = []
  const canonicalNotePath = path.normalize(noteFilePath)

  const scanDirectory = (dirPath: string): void => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue

      const entryPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        const nestedCanonicalFile = path.join(entryPath, `${entry.name}.md`)
        if (fs.existsSync(nestedCanonicalFile) && fs.statSync(nestedCanonicalFile).isFile()) {
          continue
        }
        scanDirectory(entryPath)
        continue
      }

      if (!entry.isFile()) continue
      if (path.normalize(entryPath) === canonicalNotePath) continue
      assetFilePaths.push(entryPath)
    }
  }

  scanDirectory(noteDir)
  return assetFilePaths.sort((a, b) => a.localeCompare(b))
}

export function getAgentsKnowledgeDir(layer: AgentsLayerPaths): string {
  return path.join(layer.agentsDir, AGENTS_KNOWLEDGE_DIR)
}

export function getAgentsKnowledgeBackupDir(layer: AgentsLayerPaths): string {
  return path.join(layer.backupsDir, AGENTS_KNOWLEDGE_DIR)
}

export function knowledgeNoteSlugToDirPath(layer: AgentsLayerPaths, slug: string): string {
  return path.join(getAgentsKnowledgeDir(layer), sanitizeRelativeLocation(slug))
}

export function knowledgeNoteSlugToFilePath(layer: AgentsLayerPaths, slug: string): string {
  const locationSegments = splitLocationSegments(slug)
  const fileName = locationSegments[locationSegments.length - 1] || "note"
  return path.join(knowledgeNoteSlugToDirPath(layer, slug), `${fileName}.md`)
}

export function buildKnowledgeNoteStorageLocation(note: Pick<KnowledgeNote, "id" | "group" | "series">, leafOverride?: string): string {
  const groupSegments = splitLocationSegments(note.group ?? "")
  const seriesSegments = splitLocationSegments(note.series ?? "")
  const leafSegments = splitLocationSegments(leafOverride ?? note.id)
  return [...groupSegments, ...seriesSegments, ...leafSegments].join("/")
}

export function stringifyKnowledgeNoteMarkdown(note: KnowledgeNote): string {
  const tags = formatListValue(note.tags)
  const references = formatListValue(note.references)

  const frontmatter: Record<string, string> = {
    kind: "note",
    id: note.id,
    title: normalizeSingleLine(note.title),
    context: note.context,
    updatedAt: String(note.updatedAt),
    tags,
  }

  if (typeof note.createdAt === "number" && Number.isFinite(note.createdAt)) {
    frontmatter.createdAt = String(note.createdAt)
  }

  const summary = normalizeSingleLine(note.summary ?? "")
  const group = normalizePathLikeValue(note.group)
  const series = normalizePathLikeValue(note.series)
  const entryType = VALID_ENTRY_TYPE_VALUES.has(note.entryType as KnowledgeNoteEntryType)
    ? note.entryType
    : undefined
  if (summary) frontmatter.summary = summary
  if (references) frontmatter.references = references
  if (group) frontmatter.group = group
  if (series) frontmatter.series = series
  if (entryType) frontmatter.entryType = entryType

  return stringifyFrontmatterDocument({
    frontmatter,
    body: note.body,
  })
}

export function parseKnowledgeNoteMarkdown(
  markdown: string,
  options: KnowledgeNoteParseOptions = {},
): KnowledgeNote | null {
  const doc = parseFrontmatterOrBody(markdown)
  const fm = doc.frontmatter

  const repairs: string[] = []
  const kind = (fm.kind ?? "").trim()
  if (kind && kind !== "note") return null
  if (!kind) repairs.push("missing kind; treated as note")

  const id = (fm.id ?? options.fallbackId ?? "").trim()
  const title = normalizeSingleLine(fm.title ?? "")
  const context = (fm.context ?? "").trim()
  const stableNow = tryGetFileMtimeMs(options.filePath) ?? Date.now()
  const createdRaw = hasOwn(fm, "createdAt") ? fm.createdAt : fm.created
  const updatedRaw = hasOwn(fm, "updatedAt") ? fm.updatedAt : fm.updated
  const parsedCreatedAt = parseTimestamp(createdRaw)
  const parsedUpdatedAt = parseTimestamp(updatedRaw)

  if (!id || !title || !VALID_CONTEXT_VALUES.has(context as KnowledgeNoteContext)) {
    return null
  }

  if (!hasOwn(fm, "createdAt") && hasOwn(fm, "created")) {
    repairs.push("used created alias for createdAt")
  }
  if (!hasOwn(fm, "updatedAt") && hasOwn(fm, "updated")) {
    repairs.push("used updated alias for updatedAt")
  }
  if (parsedCreatedAt?.parsedAsDateString) repairs.push("parsed non-numeric createdAt timestamp")
  if (parsedUpdatedAt?.parsedAsDateString) repairs.push("parsed non-numeric updatedAt timestamp")
  if (createdRaw?.trim() && !parsedCreatedAt) repairs.push("invalid createdAt; defaulted from updatedAt/file mtime/current time")
  if (updatedRaw?.trim() && !parsedUpdatedAt) repairs.push("invalid updatedAt; defaulted from createdAt/file mtime/current time")
  if (!updatedRaw?.trim()) repairs.push("missing updatedAt; defaulted from createdAt/file mtime/current time")
  if (!hasOwn(fm, "tags")) repairs.push("missing tags; defaulted to []")

  const updatedAt = parsedUpdatedAt?.value ?? parsedCreatedAt?.value ?? stableNow
  const createdAt = parsedCreatedAt?.value ?? updatedAt
  const summary = normalizeSingleLine(fm.summary ?? "") || undefined
  const tags = parseListValue(fm.tags)
  const references = parseListValue(fm.references)
  const group = normalizePathLikeValue(fm.group)
  const series = normalizePathLikeValue(fm.series)
  const entryType = VALID_ENTRY_TYPE_VALUES.has((fm.entryType ?? "").trim() as KnowledgeNoteEntryType)
    ? (fm.entryType ?? "").trim() as KnowledgeNoteEntryType
    : undefined

  warnRecoveredKnowledgeNote(options, id, repairs)

  return {
    id,
    title,
    context: context as KnowledgeNoteContext,
    updatedAt,
    tags,
    body: doc.body.trim(),
    summary,
    createdAt,
    references: references.length > 0 ? references : undefined,
    group,
    series,
    entryType,
  }
}

function discoverCanonicalNoteDirs(currentDir: string): string[] {
  const matches: string[] = []
  const entries = fs.readdirSync(currentDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith(".")) continue

    const entryPath = path.join(currentDir, entry.name)
    const canonicalFile = path.join(entryPath, `${entry.name}.md`)
    if (fs.existsSync(canonicalFile) && fs.statSync(canonicalFile).isFile()) {
      matches.push(entryPath)
    }

    matches.push(...discoverCanonicalNoteDirs(entryPath))
  }

  return matches
}

export function loadAgentsKnowledgeNotesLayer(layer: AgentsLayerPaths): LoadedAgentsKnowledgeNotesLayer {
  const notes: KnowledgeNote[] = []
  const originById = new Map<string, AgentsKnowledgeNoteOrigin>()

  const knowledgeDir = getAgentsKnowledgeDir(layer)

  try {
    if (!fs.existsSync(knowledgeDir) || !fs.statSync(knowledgeDir).isDirectory()) {
      return { notes, originById }
    }
    const noteDirs = discoverCanonicalNoteDirs(knowledgeDir)

    for (const noteDir of noteDirs) {
      const relativeDir = path.relative(knowledgeDir, noteDir)
      const relativeDirSegments = relativeDir.split(path.sep).filter(Boolean)
      const slug = relativeDirSegments[relativeDirSegments.length - 1]
      if (!slug) continue
      const noteFilePath = path.join(noteDir, `${slug}.md`)
      const raw = readTextFileIfExistsSync(noteFilePath, "utf8")
      if (raw === null) continue

      const parsed = parseKnowledgeNoteMarkdown(raw, { fallbackId: slug, filePath: noteFilePath, warnOnRepair: true })
      if (!parsed) continue
      const normalized = applyInferredGrouping(parsed, relativeDirSegments)

      const assetFilePaths = collectNoteAssetFilePaths(noteDir, noteFilePath)
      const existing = originById.get(normalized.id)
      if (existing) {
        const existingNote = notes.find((note) => note.id === normalized.id)
        if (existingNote && existingNote.updatedAt > normalized.updatedAt) continue
        const idx = notes.findIndex((note) => note.id === normalized.id)
        if (idx >= 0) notes[idx] = normalized
      } else {
        notes.push(normalized)
      }

      originById.set(normalized.id, {
        dirPath: noteDir,
        filePath: noteFilePath,
        slug,
        assetFilePaths,
      })
    }
  } catch {
    // best-effort
  }

  return { notes, originById }
}

export function writeKnowledgeNoteFile(
  layer: AgentsLayerPaths,
  note: KnowledgeNote,
  options: { slug?: string; filePathOverride?: string; maxBackups?: number } = {},
): { dirPath: string; filePath: string } {
  const resolvedLocation = options.slug && /[\\/]/.test(options.slug)
    ? options.slug
    : buildKnowledgeNoteStorageLocation(note, options.slug)
  const filePath = options.filePathOverride ?? knowledgeNoteSlugToFilePath(layer, resolvedLocation)
  const backupDir = getAgentsKnowledgeBackupDir(layer)
  const maxBackups = options.maxBackups ?? 10
  const markdown = stringifyKnowledgeNoteMarkdown(note)

  safeWriteFileSync(filePath, markdown, {
    encoding: "utf8",
    backupDir,
    maxBackups,
  })

  return {
    dirPath: path.dirname(filePath),
    filePath,
  }
}