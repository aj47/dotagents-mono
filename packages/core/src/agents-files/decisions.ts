import fs from "fs"
import path from "path"
import type { Decision, DecisionAnswerSource, DecisionHistoryEntry, DecisionStatus, DecisionType } from "../types"
import type { AgentsLayerPaths } from "./modular-config"
import { AGENTS_DECISIONS_DIR } from "./modular-config"
import { parseFrontmatterOrBody, stringifyFrontmatterDocument } from "./frontmatter"
import { readTextFileIfExistsSync, safeWriteFileSync } from "./safe-file"

export const DECISION_CANONICAL_FILENAME = "decision.md"

export type DecisionOrigin = {
  filePath: string
}

export type LoadedDecisionsLayer = {
  decisions: Decision[]
  originById: Map<string, DecisionOrigin>
}

const VALID_TYPES = new Set<DecisionType>(["yn", "ab", "ranked", "edit", "defer"])
const VALID_STATUSES = new Set<DecisionStatus>(["pending", "answered", "deferred", "auto_resolved", "canceled"])
const VALID_SOURCES = new Set<DecisionAnswerSource>(["aj", "agent", "timeout", "system"])

function sanitizeFileComponent(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function parseBoolean(raw: string | undefined, defaultValue: boolean): boolean {
  const trimmed = (raw ?? "").trim().toLowerCase()
  if (!trimmed) return defaultValue
  if (["1", "true", "yes", "y", "on"].includes(trimmed)) return true
  if (["0", "false", "no", "n", "off"].includes(trimmed)) return false
  return defaultValue
}

function parseNumber(raw: string | undefined, defaultValue: number): number {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return defaultValue
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : defaultValue
}

function parseNullableNumber(raw: string | undefined): number | null | undefined {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return undefined
  if (trimmed === "null") return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseNullableString(raw: string | undefined): string | null | undefined {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return undefined
  if (trimmed === "null") return null
  return trimmed
}

function parseAnswerSource(raw: string | undefined): DecisionAnswerSource | null | undefined {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return undefined
  if (trimmed === "null") return null
  return VALID_SOURCES.has(trimmed as DecisionAnswerSource) ? (trimmed as DecisionAnswerSource) : undefined
}

function parseHistory(raw: string | undefined): DecisionHistoryEntry[] {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return []
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((entry): DecisionHistoryEntry[] => {
      if (!entry || typeof entry !== "object") return []
      const obj = entry as Record<string, unknown>
      const at = typeof obj.at === "number" && Number.isFinite(obj.at) ? obj.at : undefined
      const type = typeof obj.type === "string" ? obj.type.trim() : ""
      const by = typeof obj.by === "string" && VALID_SOURCES.has(obj.by as DecisionAnswerSource)
        ? (obj.by as DecisionAnswerSource)
        : undefined
      if (!at || !type || !by) return []
      const note = typeof obj.note === "string" && obj.note.trim() ? obj.note.trim() : undefined
      return [{ at, type, by, note }]
    })
  } catch {
    return []
  }
}

function stringifyHistory(history: DecisionHistoryEntry[]): string {
  return JSON.stringify(history)
}

function setIfPresent(frontmatter: Record<string, string>, key: string, value: string | number | boolean | undefined | null): void {
  if (value === undefined || value === "") return
  frontmatter[key] = value === null ? "null" : String(value)
}

export function getDecisionsDir(layer: AgentsLayerPaths): string {
  return path.join(layer.agentsDir, AGENTS_DECISIONS_DIR)
}

export function getDecisionsBackupDir(layer: AgentsLayerPaths): string {
  return path.join(layer.backupsDir, AGENTS_DECISIONS_DIR)
}

export function decisionIdToDirPath(layer: AgentsLayerPaths, id: string): string {
  return path.join(getDecisionsDir(layer), sanitizeFileComponent(id))
}

export function decisionIdToFilePath(layer: AgentsLayerPaths, id: string): string {
  return path.join(decisionIdToDirPath(layer, id), DECISION_CANONICAL_FILENAME)
}

export function stringifyDecisionMarkdown(decision: Decision): string {
  const frontmatter: Record<string, string> = {
    kind: "decision",
    id: decision.id,
    type: decision.type,
    status: decision.status,
    question: decision.question,
    createdAt: String(decision.createdAt),
    updatedAt: String(decision.updatedAt),
    urgent: String(decision.urgent),
    revertEffortHours: String(decision.revertEffortHours),
    pathChanging: String(decision.pathChanging),
    irreversible: String(decision.irreversible),
    history: stringifyHistory(decision.history),
  }

  setIfPresent(frontmatter, "recommendation", decision.recommendation)
  setIfPresent(frontmatter, "why", decision.why)
  setIfPresent(frontmatter, "risk", decision.risk)
  setIfPresent(frontmatter, "goalId", decision.goalId)
  setIfPresent(frontmatter, "taskId", decision.taskId)
  setIfPresent(frontmatter, "answeredAt", decision.answeredAt)
  setIfPresent(frontmatter, "expiresAt", decision.expiresAt)
  setIfPresent(frontmatter, "defaultAction", decision.defaultAction)
  setIfPresent(frontmatter, "answer", decision.answer)
  setIfPresent(frontmatter, "answerSource", decision.answerSource)

  return stringifyFrontmatterDocument({ frontmatter, body: decision.body || "" })
}

export function parseDecisionMarkdown(markdown: string, options: { fallbackId?: string; filePath?: string } = {}): Decision | null {
  const { frontmatter: fm, body } = parseFrontmatterOrBody(markdown)
  if ((fm.kind ?? "decision").trim() !== "decision") return null

  const now = Date.now()
  const fallbackId = options.fallbackId?.trim()
  const id = (fm.id ?? "").trim() || fallbackId
  if (!id) return null

  const type = VALID_TYPES.has(fm.type as DecisionType) ? (fm.type as DecisionType) : "yn"
  const status = VALID_STATUSES.has(fm.status as DecisionStatus) ? (fm.status as DecisionStatus) : "pending"
  const createdAt = parseNumber(fm.createdAt, now)
  const updatedAt = parseNumber(fm.updatedAt, createdAt)
  const answerSource = parseAnswerSource(fm.answerSource)

  return {
    id,
    type,
    status,
    question: (fm.question ?? "").trim() || id,
    recommendation: (fm.recommendation ?? "").trim() || undefined,
    why: (fm.why ?? "").trim() || undefined,
    risk: (fm.risk ?? "").trim() || undefined,
    goalId: (fm.goalId ?? "").trim() || undefined,
    taskId: (fm.taskId ?? "").trim() || undefined,
    createdAt,
    updatedAt,
    answeredAt: parseNullableNumber(fm.answeredAt),
    expiresAt: parseNullableNumber(fm.expiresAt),
    defaultAction: (fm.defaultAction ?? "").trim() || undefined,
    answer: parseNullableString(fm.answer),
    answerSource,
    urgent: parseBoolean(fm.urgent, false),
    revertEffortHours: parseNumber(fm.revertEffortHours, 0),
    pathChanging: parseBoolean(fm.pathChanging, false),
    irreversible: parseBoolean(fm.irreversible, false),
    history: parseHistory(fm.history),
    body: body.trim(),
  }
}

export function loadDecisionsLayer(layer: AgentsLayerPaths): LoadedDecisionsLayer {
  const decisions: Decision[] = []
  const originById = new Map<string, DecisionOrigin>()
  const decisionsDir = getDecisionsDir(layer)

  try {
    if (!fs.existsSync(decisionsDir) || !fs.statSync(decisionsDir).isDirectory()) {
      return { decisions, originById }
    }

    for (const entry of fs.readdirSync(decisionsDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue
      const filePath = path.join(decisionsDir, entry.name, DECISION_CANONICAL_FILENAME)
      const raw = readTextFileIfExistsSync(filePath, "utf8")
      if (raw === null) continue
      const decision = parseDecisionMarkdown(raw, { fallbackId: entry.name, filePath })
      if (!decision) continue
      decisions.push(decision)
      originById.set(decision.id, { filePath })
    }
  } catch {
    // best-effort
  }

  return { decisions, originById }
}

export function writeDecisionFile(layer: AgentsLayerPaths, decision: Decision, options: { maxBackups?: number } = {}): void {
  const decisionDir = decisionIdToDirPath(layer, decision.id)
  fs.mkdirSync(decisionDir, { recursive: true })
  safeWriteFileSync(decisionIdToFilePath(layer, decision.id), stringifyDecisionMarkdown(decision), {
    backupDir: getDecisionsBackupDir(layer),
    maxBackups: options.maxBackups ?? 10,
  })
}

export function deleteDecisionFiles(layer: AgentsLayerPaths, id: string): void {
  try {
    const decisionDir = decisionIdToDirPath(layer, id)
    if (fs.existsSync(decisionDir)) fs.rmSync(decisionDir, { recursive: true, force: true })
  } catch {
    // best-effort
  }
}
