import fs from "fs"
import path from "path"
import type { Goal, GoalCreatedBy, GoalLevel, GoalStatus } from "../types"
import type { AgentsLayerPaths } from "./modular-config"
import { AGENTS_GOALS_DIR } from "./modular-config"
import { parseFrontmatterOrBody, stringifyFrontmatterDocument } from "./frontmatter"
import { readTextFileIfExistsSync, safeWriteFileSync } from "./safe-file"

export const GOAL_CANONICAL_FILENAME = "goal.md"

export type GoalOrigin = {
  filePath: string
}

export type LoadedGoalsLayer = {
  goals: Goal[]
  originById: Map<string, GoalOrigin>
}

const VALID_LEVELS = new Set<GoalLevel>(["goal", "week", "today"])
const VALID_STATUSES = new Set<GoalStatus>(["active", "paused", "done", "abandoned"])
const VALID_CREATED_BY = new Set<GoalCreatedBy>(["aj", "agent"])

function sanitizeFileComponent(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function parseNumber(raw: string | undefined, defaultValue: number): number {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return defaultValue
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : defaultValue
}

function parseListValue(raw: string | undefined): string[] {
  const trimmed = (raw ?? "").trim()
  if (!trimmed) return []
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean)
      }
    } catch {
      // fall through to CSV
    }
  }
  return trimmed.split(",").map((value) => value.trim()).filter(Boolean)
}

function formatListValue(values: string[] | undefined): string {
  return Array.isArray(values) ? values.map((value) => value.trim()).filter(Boolean).join(", ") : ""
}

function setIfPresent(frontmatter: Record<string, string>, key: string, value: string | number | undefined | null): void {
  if (value === undefined || value === null || value === "") return
  frontmatter[key] = String(value)
}

export function getGoalsDir(layer: AgentsLayerPaths): string {
  return path.join(layer.agentsDir, AGENTS_GOALS_DIR)
}

export function getGoalsBackupDir(layer: AgentsLayerPaths): string {
  return path.join(layer.backupsDir, AGENTS_GOALS_DIR)
}

export function goalIdToDirPath(layer: AgentsLayerPaths, id: string): string {
  return path.join(getGoalsDir(layer), sanitizeFileComponent(id))
}

export function goalIdToFilePath(layer: AgentsLayerPaths, id: string): string {
  return path.join(goalIdToDirPath(layer, id), GOAL_CANONICAL_FILENAME)
}

export function stringifyGoalMarkdown(goal: Goal): string {
  const frontmatter: Record<string, string> = {
    kind: "goal",
    id: goal.id,
    title: goal.title,
    description: goal.description,
    level: goal.level,
    priority: String(goal.priority),
    status: goal.status,
    createdAt: String(goal.createdAt),
    updatedAt: String(goal.updatedAt),
    createdBy: goal.createdBy,
    createdFrom: goal.createdFrom,
  }

  setIfPresent(frontmatter, "parentId", goal.parentId)
  setIfPresent(frontmatter, "successCriteria", goal.successCriteria)
  setIfPresent(frontmatter, "signalToWatch", goal.signalToWatch)
  setIfPresent(frontmatter, "abandonIf", goal.abandonIf)
  setIfPresent(frontmatter, "lastTouchedAt", goal.lastTouchedAt)
  setIfPresent(frontmatter, "provenance", goal.provenance)
  if (goal.linkedTaskIds.length > 0) frontmatter.linkedTaskIds = formatListValue(goal.linkedTaskIds)
  setIfPresent(frontmatter, "notes", goal.notes)

  return stringifyFrontmatterDocument({ frontmatter, body: goal.body || "" })
}

export function parseGoalMarkdown(markdown: string, options: { fallbackId?: string; filePath?: string } = {}): Goal | null {
  const { frontmatter: fm, body } = parseFrontmatterOrBody(markdown)
  if ((fm.kind ?? "goal").trim() !== "goal") return null

  const now = Date.now()
  const fallbackId = options.fallbackId?.trim()
  const id = (fm.id ?? "").trim() || fallbackId
  if (!id) return null

  const level = VALID_LEVELS.has(fm.level as GoalLevel) ? (fm.level as GoalLevel) : "goal"
  const status = VALID_STATUSES.has(fm.status as GoalStatus) ? (fm.status as GoalStatus) : "active"
  const createdBy = VALID_CREATED_BY.has(fm.createdBy as GoalCreatedBy) ? (fm.createdBy as GoalCreatedBy) : "aj"
  const createdAt = parseNumber(fm.createdAt, now)
  const updatedAt = parseNumber(fm.updatedAt, createdAt)

  return {
    id,
    title: (fm.title ?? "").trim() || id,
    description: (fm.description ?? "").trim(),
    level,
    priority: parseNumber(fm.priority, 3),
    status,
    parentId: (fm.parentId ?? "").trim() || undefined,
    successCriteria: (fm.successCriteria ?? "").trim() || undefined,
    signalToWatch: (fm.signalToWatch ?? "").trim() || undefined,
    abandonIf: (fm.abandonIf ?? "").trim() || undefined,
    createdAt,
    updatedAt,
    lastTouchedAt: fm.lastTouchedAt ? parseNumber(fm.lastTouchedAt, updatedAt) : undefined,
    createdBy,
    createdFrom: (fm.createdFrom ?? "").trim() || "manual",
    provenance: (fm.provenance ?? "").trim() || undefined,
    linkedTaskIds: parseListValue(fm.linkedTaskIds),
    notes: (fm.notes ?? "").trim() || undefined,
    body: body.trim(),
  }
}

export function loadGoalsLayer(layer: AgentsLayerPaths): LoadedGoalsLayer {
  const goals: Goal[] = []
  const originById = new Map<string, GoalOrigin>()
  const goalsDir = getGoalsDir(layer)

  try {
    if (!fs.existsSync(goalsDir) || !fs.statSync(goalsDir).isDirectory()) {
      return { goals, originById }
    }

    for (const entry of fs.readdirSync(goalsDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue
      const filePath = path.join(goalsDir, entry.name, GOAL_CANONICAL_FILENAME)
      const raw = readTextFileIfExistsSync(filePath, "utf8")
      if (raw === null) continue
      const goal = parseGoalMarkdown(raw, { fallbackId: entry.name, filePath })
      if (!goal) continue
      goals.push(goal)
      originById.set(goal.id, { filePath })
    }
  } catch {
    // best-effort
  }

  return { goals, originById }
}

export function writeGoalFile(layer: AgentsLayerPaths, goal: Goal, options: { maxBackups?: number } = {}): void {
  const goalDir = goalIdToDirPath(layer, goal.id)
  fs.mkdirSync(goalDir, { recursive: true })
  safeWriteFileSync(goalIdToFilePath(layer, goal.id), stringifyGoalMarkdown(goal), {
    backupDir: getGoalsBackupDir(layer),
    maxBackups: options.maxBackups ?? 10,
  })
}

export function deleteGoalFiles(layer: AgentsLayerPaths, id: string): void {
  try {
    const goalDir = goalIdToDirPath(layer, id)
    if (fs.existsSync(goalDir)) fs.rmSync(goalDir, { recursive: true, force: true })
  } catch {
    // best-effort
  }
}
