import fs from "fs"
import path from "path"
import type { AgentStepSummary, KnowledgeNote, KnowledgeNoteContext, KnowledgeNoteEntryType, KnowledgePageType } from "@shared/types"
import { logLLM, isDebugLLM } from "./debug"
import { globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { getAgentsLayerPaths, type AgentsLayerPaths } from "./agents-files/modular-config"
import {
  getAgentsKnowledgeBackupDir,
  knowledgeNoteSlugToFilePath,
  loadAgentsKnowledgeNotesLayer,
  writeKnowledgeNoteFile,
} from "./agents-files/knowledge-notes"
import { readTextFileIfExistsSync, safeWriteFileSync } from "./agents-files/safe-file"
import { inferKnowledgeNoteGrouping } from "@shared/knowledge-note-grouping"

function normalizeSingleLine(text: string): string {
  return text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim()
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}

function buildReadableId(...candidates: Array<string | undefined>): string {
  const base = candidates.map((value) => slugify(value ?? "")).find(Boolean) || "note"
  return `${base}-${Math.random().toString(36).slice(2, 8)}`
}

const DURABLE_NOTE_CANDIDATE_TYPES = new Set(["preference", "constraint", "decision", "fact", "insight"])
const VALID_CONTEXT_VALUES = new Set<KnowledgeNoteContext>(["auto", "search-only"])
const VALID_ENTRY_TYPE_VALUES = new Set<KnowledgeNoteEntryType>(["note", "entry", "overview"])
const VALID_PAGE_TYPE_VALUES = new Set<KnowledgePageType>(["note", "topic", "entity", "project", "idea", "opportunity", "daily", "source"])
const LEGACY_NOTE_META_PREFIX = "<!-- dotagents-memory-meta:"

type KnowledgeOrigin = {
  layer: "global" | "workspace"
  dirPath: string
  filePath: string
  slug: string
  assetFilePaths: string[]
}


type PromoteKnowledgeNoteInput = {
  id: string
  pageType: KnowledgePageType
  title?: string
  summary?: string
  aliases?: string[]
  group?: string
  series?: string
  status?: string
  importance?: number
}

function stripLegacyEmbeddedMetadata(body: string): string {
  const trimmed = body.trim()
  const prefixIndex = trimmed.lastIndexOf(LEGACY_NOTE_META_PREFIX)
  if (prefixIndex < 0) return trimmed

  const suffixIndex = trimmed.indexOf("-->", prefixIndex)
  if (suffixIndex < 0) return trimmed

  return trimmed.slice(0, prefixIndex).trim()
}

function normalizePathLikeValue(value: string | undefined): string | undefined {
  const normalized = (value ?? "")
    .trim()
    .replace(/\\+/g, "/")
    .split("/")
    .map(normalizeSingleLine)
    .filter(Boolean)
    .join("/")

  return normalized || undefined
}




function inferBacklinks(note: KnowledgeNote): string[] | undefined {
  const refs = Array.from(new Set(asStringArray(note.references).map(normalizeSingleLine).filter(Boolean)))
  return refs.length > 0 ? refs : undefined
}

function normalizeKnowledgeNoteForStorage(note: KnowledgeNote): KnowledgeNote {
  const now = Date.now()
  const providedId = normalizeSingleLine(note.id ?? "")
  const id = providedId || slugify(note.title || "note") || buildReadableId(note.title, note.summary)
  const visibleBody = stripLegacyEmbeddedMetadata(note.body ?? "")
  const title = normalizeSingleLine(note.title || visibleBody || note.summary || id).slice(0, 120) || id
  const context = VALID_CONTEXT_VALUES.has(note.context) ? note.context : "search-only"
  const createdAt = typeof note.createdAt === "number" && Number.isFinite(note.createdAt) ? note.createdAt : now
  const updatedAt = typeof note.updatedAt === "number" && Number.isFinite(note.updatedAt) ? note.updatedAt : createdAt
  const summary = normalizeSingleLine(note.summary ?? "") || undefined
  const body = visibleBody || summary || title
  const group = normalizePathLikeValue(note.group)
  const series = normalizePathLikeValue(note.series)
  const entryType = VALID_ENTRY_TYPE_VALUES.has(note.entryType as KnowledgeNoteEntryType)
    ? note.entryType
    : undefined
  const inferred = inferKnowledgeNoteGrouping({
    id,
    title,
    summary,
    tags: note.tags,
    group,
    series,
    entryType,
    pageType: note.pageType,
  })
  const pageType = VALID_PAGE_TYPE_VALUES.has(note.pageType as KnowledgePageType)
    ? note.pageType
    : inferred.pageType ?? "note"

  return {
    id,
    title,
    context,
    createdAt,
    updatedAt,
    tags: Array.from(new Set(asStringArray(note.tags))),
    body,
    summary,
    group: group ?? inferred.group,
    series: series ?? inferred.series,
    entryType: entryType ?? inferred.entryType,
    pageType,
    aliases: (() => {
      const aliases = Array.from(new Set(asStringArray(note.aliases)))
      return aliases.length > 0 ? aliases : undefined
    })(),
    backlinks: (() => {
      const backlinks = Array.from(new Set([...(asStringArray(note.backlinks)), ...(inferBacklinks(note) ?? [])]))
      return backlinks.length > 0 ? backlinks : undefined
    })(),
    status: normalizeSingleLine(note.status ?? "") || undefined,
    importance: typeof note.importance === "number" && Number.isFinite(note.importance) ? note.importance : undefined,
    references: (() => {
      const refs = Array.from(new Set(asStringArray(note.references)))
      return refs.length > 0 ? refs : undefined
    })(),
  }
}

function toPublicNote(note: KnowledgeNote): KnowledgeNote {
  return {
    ...note,
    body: stripLegacyEmbeddedMetadata(note.body),
  }
}

export class KnowledgeNotesService {
  private notes: KnowledgeNote[] = []
  private originById: Map<string, KnowledgeOrigin> = new Map()
  private initialized = false

  private getLayers(): { globalLayer: AgentsLayerPaths; workspaceLayer: AgentsLayerPaths | null } {
    const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
    const workspaceLayer = workspaceAgentsFolder ? getAgentsLayerPaths(workspaceAgentsFolder) : null
    return { globalLayer, workspaceLayer }
  }

  private backupThenDeleteNoteSync(origin: KnowledgeOrigin, backupDir: string): void {
    const raw = readTextFileIfExistsSync(origin.filePath, "utf8")
    if (raw !== null) {
      safeWriteFileSync(origin.filePath, raw, { encoding: "utf8", backupDir, maxBackups: 10 })
    }
    fs.rmSync(origin.dirPath, { recursive: true, force: true })
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const { globalLayer, workspaceLayer } = this.getLayers()
      const globalLoaded = loadAgentsKnowledgeNotesLayer(globalLayer)
      const workspaceLoaded = workspaceLayer ? loadAgentsKnowledgeNotesLayer(workspaceLayer) : null

      const mergedById = new Map<string, KnowledgeNote>()
      const originById = new Map<string, KnowledgeOrigin>()

      for (const note of globalLoaded.notes) {
        const origin = globalLoaded.originById.get(note.id)
        mergedById.set(note.id, normalizeKnowledgeNoteForStorage(note))
        if (origin) originById.set(note.id, { layer: "global", ...origin })
      }

      if (workspaceLoaded) {
        for (const note of workspaceLoaded.notes) {
          const origin = workspaceLoaded.originById.get(note.id)
          mergedById.set(note.id, normalizeKnowledgeNoteForStorage(note))
          if (origin) originById.set(note.id, { layer: "workspace", ...origin })
        }
      }

      this.notes = Array.from(mergedById.values())
      this.originById = originById
    } catch (error) {
      if (isDebugLLM()) {
        logLLM("[KnowledgeNotesService] Error loading notes:", error)
      }
      this.notes = []
      this.originById = new Map()
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    await this.loadFromDisk()
    this.initialized = true
  }

  async reload(): Promise<void> {
    await this.loadFromDisk()
    this.initialized = true
  }

  createNote(input: {
    id?: string
    title?: string
    body: string
    summary?: string
    context?: KnowledgeNoteContext
    tags?: string[]
    references?: string[]
  }): KnowledgeNote {
    const now = Date.now()
    const rawTitle = normalizeSingleLine(input.title ?? "")
    const fallbackTitle = normalizeSingleLine(input.body).split(" ").slice(0, 8).join(" ")
    const title = rawTitle || fallbackTitle || "Knowledge Note"

    return normalizeKnowledgeNoteForStorage({
      id: input.id ? normalizeSingleLine(input.id) : buildReadableId(input.id, title, input.summary),
      title,
      context: input.context ?? "search-only",
      createdAt: now,
      updatedAt: now,
      tags: input.tags ?? [],
      body: input.body,
      summary: input.summary,
      references: input.references,
    })
  }

  createNoteFromSummary(
    summary: AgentStepSummary,
    title?: string,
    userNotes?: string,
    tags?: string[],
    conversationTitle?: string,
    conversationId?: string,
  ): KnowledgeNote | null {
    const noteCandidates = (Array.isArray(summary.noteCandidates) ? summary.noteCandidates : [])
      .filter((c): c is string => typeof c === "string")
      .map(normalizeSingleLine)
      .filter(Boolean)
      .filter((candidate) => {
        const colonIdx = candidate.indexOf(":")
        if (colonIdx < 0) return false
        const prefix = candidate.slice(0, colonIdx).toLowerCase().trim()
        const payload = candidate.slice(colonIdx + 1).trim()
        return !!prefix && DURABLE_NOTE_CANDIDATE_TYPES.has(prefix) && payload.length > 0
      })

    const selectedCandidates = noteCandidates.slice(0, 3)
    const decisionsMade = Array.isArray(summary.decisionsMade)
      ? summary.decisionsMade.filter((d): d is string => typeof d === "string")
      : []
    const keyFindings = Array.isArray(summary.keyFindings)
      ? summary.keyFindings.filter((f): f is string => typeof f === "string")
      : []

    const MAX_ITEM_LENGTH = 240
    const chosenContent = normalizeSingleLine(
      selectedCandidates.length > 0
        ? selectedCandidates.map((item) => item.slice(0, MAX_ITEM_LENGTH)).join(" | ")
        : decisionsMade.length > 0
          ? decisionsMade.map(normalizeSingleLine).filter(Boolean).slice(0, 3).map((item) => item.slice(0, MAX_ITEM_LENGTH)).join(" | ")
          : keyFindings.map(normalizeSingleLine).filter(Boolean).slice(0, 3).map((item) => item.slice(0, MAX_ITEM_LENGTH)).join(" | "),
    )

    if (!chosenContent) return null

    const derivedTags = selectedCandidates
      .map((item) => item.split(":")[0]?.toLowerCase().trim())
      .filter((tag): tag is string => !!tag && DURABLE_NOTE_CANDIDATE_TYPES.has(tag))
    const mergedTags = Array.from(new Set([
      ...asStringArray(summary.tags),
      ...asStringArray(tags),
      ...derivedTags,
    ]))

    const resolvedTitle = normalizeSingleLine(title || chosenContent).slice(0, 120)
    const bodyParts = [chosenContent]
    if (userNotes?.trim()) bodyParts.push(`## Notes\n\n${userNotes.trim()}`)
    if (keyFindings.length > 0) {
      bodyParts.push(`## Key Findings\n\n${keyFindings.slice(0, 5).map((item) => `- ${item}`).join("\n")}`)
    }
    if (conversationTitle || conversationId) {
      const refs = [conversationTitle, conversationId].filter(Boolean).map(String)
      bodyParts.push(`## Source\n\n${refs.join(" · ")}`)
    }

    const grouped = inferKnowledgeNoteGrouping({
      id: buildReadableId(resolvedTitle, chosenContent),
      title: resolvedTitle,
      summary: chosenContent,
      tags: mergedTags,
    })

    return normalizeKnowledgeNoteForStorage({
      id: buildReadableId(resolvedTitle, chosenContent),
      title: resolvedTitle,
      context: "auto",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: mergedTags,
      summary: chosenContent,
      body: bodyParts.join("\n\n"),
      references: conversationId ? [conversationId] : undefined,
      group: grouped.group,
      series: grouped.series,
      entryType: grouped.entryType,
    })
  }

  private findRelatedSourceNotes(target: KnowledgeNote): KnowledgeNote[] {
    const targetTokens = new Set([
      target.title.toLowerCase(),
      ...(target.aliases ?? []).map((alias) => alias.toLowerCase()),
    ].filter(Boolean))

    return this.notes
      .filter((note) => note.id !== target.id)
      .filter((note) => {
        const haystack = [
          note.title,
          note.summary ?? "",
          note.body,
          ...(note.tags ?? []),
          ...(note.references ?? []),
        ].join(" ").toLowerCase()
        for (const token of targetTokens) {
          if (token && haystack.includes(token)) return true
        }
        return false
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 12)
  }

  async promoteNote(input: PromoteKnowledgeNoteInput): Promise<KnowledgeNote | null> {
    await this.initialize()
    const existing = this.notes.find((item) => item.id === input.id)
    if (!existing) return null

    const nextTitle = normalizeSingleLine(input.title ?? existing.title) || existing.title
    const nextAliases = Array.from(new Set([
      ...asStringArray(existing.aliases),
      ...asStringArray(input.aliases),
      existing.title,
    ].map(normalizeSingleLine).filter(Boolean))).filter((alias) => alias.toLowerCase() !== nextTitle.toLowerCase())

    const promoted = normalizeKnowledgeNoteForStorage({
      ...existing,
      title: nextTitle,
      summary: normalizeSingleLine(input.summary ?? existing.summary ?? "") || existing.summary,
      pageType: input.pageType,
      aliases: nextAliases,
      group: input.group ?? existing.group,
      series: input.series ?? existing.series,
      status: input.status ?? existing.status,
      importance: typeof input.importance === "number" ? input.importance : existing.importance,
      updatedAt: Date.now(),
    })

    const related = this.findRelatedSourceNotes(promoted)
    const backlinks = Array.from(new Set([
      ...(promoted.backlinks ?? []),
      ...related.map((note) => note.id),
    ]))

    const success = await this.saveNote({
      ...promoted,
      backlinks: backlinks.length > 0 ? backlinks : undefined,
    })

    if (!success) return null
    return this.getNote(promoted.id)
  }

  async createSynthesisNote(input: {
    title: string
    pageType?: KnowledgePageType
    sourceIds: string[]
    summary?: string
    group?: string
    series?: string
    context?: KnowledgeNoteContext
  }): Promise<KnowledgeNote | null> {
    await this.initialize()
    const sourceNotes = input.sourceIds
      .map((id) => this.notes.find((note) => note.id === id))
      .filter((note): note is KnowledgeNote => !!note)

    if (sourceNotes.length === 0) return null

    const body = [
      input.summary ? input.summary.trim() : undefined,
      "## Sources",
      ...sourceNotes.map((note) => `- ${note.title} (${note.id})`),
      "",
      "## Highlights",
      ...sourceNotes
        .slice(0, 8)
        .map((note) => `### ${note.title}\n${(note.summary ?? note.body).trim().slice(0, 400)}`),
    ].filter(Boolean).join("\n\n")

    const synthesized = this.createNote({
      title: input.title,
      body,
      summary: input.summary ?? `Synthesis from ${sourceNotes.length} source notes`,
      context: input.context ?? "search-only",
      tags: Array.from(new Set(sourceNotes.flatMap((note) => note.tags))).slice(0, 12),
      references: sourceNotes.map((note) => note.id),
    })

    const saved = await this.saveNote({
      ...synthesized,
      pageType: input.pageType ?? "daily",
      group: input.group,
      series: input.series,
      backlinks: sourceNotes.map((note) => note.id),
      importance: Math.min(100, sourceNotes.length * 10),
    })

    if (!saved) return null
    return this.getNote(synthesized.id)
  }

  async getNote(id: string): Promise<KnowledgeNote | null> {
    await this.initialize()
    const note = this.notes.find((item) => item.id === id)
    return note ? toPublicNote(note) : null
  }

  async getAllNotes(): Promise<KnowledgeNote[]> {
    await this.initialize()
    return [...this.notes].sort((a, b) => b.updatedAt - a.updatedAt).map(toPublicNote)
  }

  async searchNotes(query: string): Promise<KnowledgeNote[]> {
    const lowerQuery = query.toLowerCase()
    const notes = await this.getAllNotes()
    return notes.filter((note) =>
      note.title.toLowerCase().includes(lowerQuery)
      || note.body.toLowerCase().includes(lowerQuery)
      || (note.summary ?? "").toLowerCase().includes(lowerQuery)
      || (note.group ?? "").toLowerCase().includes(lowerQuery)
      || (note.series ?? "").toLowerCase().includes(lowerQuery)
      || (note.entryType ?? "").toLowerCase().includes(lowerQuery)
      || note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      || (note.references ?? []).some((ref) => ref.toLowerCase().includes(lowerQuery)),
    )
  }

  async saveNote(note: KnowledgeNote): Promise<boolean> {
    await this.initialize()

    const normalized = normalizeKnowledgeNoteForStorage(note)
    const existingIndex = this.notes.findIndex((item) => item.id === normalized.id)
    const previousNote = existingIndex >= 0 ? this.notes[existingIndex] : null
    const previousOrigin = this.originById.get(normalized.id)
    const { globalLayer, workspaceLayer } = this.getLayers()
    const targetLayerName = previousOrigin?.layer ?? "global"
    const targetLayer = targetLayerName === "workspace" && workspaceLayer ? workspaceLayer : globalLayer

    try {
      const { dirPath, filePath } = writeKnowledgeNoteFile(targetLayer, normalized, {
        filePathOverride: previousOrigin?.filePath,
        maxBackups: 10,
      })

      if (existingIndex >= 0) this.notes[existingIndex] = normalized
      else this.notes.push(normalized)

      this.originById.set(normalized.id, {
        layer: targetLayerName,
        dirPath,
        filePath,
        slug: path.basename(dirPath),
        assetFilePaths: previousOrigin?.assetFilePaths ?? [],
      })
      return true
    } catch (error) {
      if (previousNote && existingIndex >= 0) this.notes[existingIndex] = previousNote
      else if (existingIndex < 0) this.notes = this.notes.filter((item) => item.id !== normalized.id)

      if (previousOrigin) this.originById.set(normalized.id, previousOrigin)
      else this.originById.delete(normalized.id)

      if (isDebugLLM()) {
        logLLM("[KnowledgeNotesService] Error saving note:", error)
      }
      return false
    }
  }


  async updateNote(id: string, updates: Partial<Omit<KnowledgeNote, "id" | "createdAt">>): Promise<boolean> {
    await this.initialize()
    const existing = this.notes.find((item) => item.id === id)
    if (!existing) return false

    return this.saveNote({
      ...existing,
      ...updates,
      id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    })
  }

  async deleteNote(id: string): Promise<boolean> {
    await this.initialize()
    const index = this.notes.findIndex((item) => item.id === id)
    if (index < 0) return false

    const deletedNote = this.notes[index]
    const origin = this.originById.get(id)
    const { globalLayer, workspaceLayer } = this.getLayers()
    const layer = origin?.layer === "workspace" && workspaceLayer ? workspaceLayer : globalLayer
    const fallbackFilePath = knowledgeNoteSlugToFilePath(layer, id)
    const fallbackDirPath = path.dirname(fallbackFilePath)
    const backupDir = getAgentsKnowledgeBackupDir(layer)

    try {
      this.backupThenDeleteNoteSync(origin ?? {
        layer: "global",
        dirPath: fallbackDirPath,
        filePath: fallbackFilePath,
        slug: id,
        assetFilePaths: [],
      }, backupDir)
      this.notes.splice(index, 1)
      this.originById.delete(id)
      return true
    } catch (error) {
      this.notes.splice(index, 0, deletedNote)
      if (origin) this.originById.set(id, origin)
      if (isDebugLLM()) {
        logLLM("[KnowledgeNotesService] Error deleting note:", error)
      }
      return false
    }
  }

  async deleteMultipleNotes(ids: string[]): Promise<{ deletedCount: number; error?: string }> {
    let deletedCount = 0
    for (const id of ids) {
      if (!this.notes.some((note) => note.id === id)) continue
      const success = await this.deleteNote(id)
      if (!success) return { deletedCount, error: `Failed to delete note ${id}` }
      deletedCount++
    }
    return { deletedCount }
  }

  async deleteAllNotes(): Promise<{ deletedCount: number; error?: string }> {
    await this.initialize()
    return this.deleteMultipleNotes(this.notes.map((note) => note.id))
  }
}

export const knowledgeNotesService = new KnowledgeNotesService()
