import { parseFrontmatterOrBody, stringifyFrontmatterDocument } from './frontmatter'
import type { RepeatTaskApiRecord, RepeatTaskSchedule } from './repeat-task-utils'

export type RepeatTaskMarkdownParseOptions = {
  fallbackId?: string
  filePath?: string
}

function parseBoolean(raw: string | undefined, defaultValue: boolean): boolean {
  const trimmed = (raw ?? '').trim().toLowerCase()
  if (!trimmed) return defaultValue
  if (['1', 'true', 'yes', 'y', 'on'].includes(trimmed)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(trimmed)) return false
  return defaultValue
}

function parseNumber(raw: string | undefined, defaultValue: number): number {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return defaultValue
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : defaultValue
}

const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/

function normalizeTimes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const v of raw) {
    if (typeof v === 'string' && TIME_RE.test(v.trim())) {
      out.push(v.trim())
    }
  }
  return out
}

function normalizeDays(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  const out: number[] = []
  for (const v of raw) {
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isInteger(n) && n >= 0 && n <= 6 && !out.includes(n)) {
      out.push(n)
    }
  }
  return out.sort((a, b) => a - b)
}

function parseSchedule(raw: string | undefined): RepeatTaskSchedule | undefined {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return undefined
  }
  if (!parsed || typeof parsed !== 'object') return undefined
  const obj = parsed as Record<string, unknown>
  const times = normalizeTimes(obj.times)
  if (times.length === 0) return undefined
  if (obj.type === 'daily') {
    return { type: 'daily', times }
  }
  if (obj.type === 'weekly') {
    const daysOfWeek = normalizeDays(obj.daysOfWeek)
    if (daysOfWeek.length === 0) return undefined
    return { type: 'weekly', times, daysOfWeek }
  }
  return undefined
}

function stringifySchedule(schedule: RepeatTaskSchedule): string {
  return JSON.stringify(schedule)
}

export function stringifyTaskMarkdown(task: RepeatTaskApiRecord): string {
  const frontmatter: Record<string, string> = {
    kind: 'task',
    id: task.id,
    name: task.name,
    intervalMinutes: String(task.intervalMinutes),
    enabled: String(task.enabled),
  }

  if (task.profileId) frontmatter.profileId = task.profileId
  if (task.runOnStartup) frontmatter.runOnStartup = 'true'
  if (task.speakOnTrigger) frontmatter.speakOnTrigger = 'true'
  if (task.continueInSession) frontmatter.continueInSession = 'true'
  if (task.lastSessionId) frontmatter.lastSessionId = task.lastSessionId
  if (task.runContinuously) frontmatter.runContinuously = 'true'
  if (typeof task.maxIterations === 'number' && Number.isFinite(task.maxIterations)) {
    frontmatter.maxIterations = String(Math.max(1, Math.floor(task.maxIterations)))
  }
  if (task.lastRunAt) frontmatter.lastRunAt = String(task.lastRunAt)
  if (task.schedule) frontmatter.schedule = stringifySchedule(task.schedule)

  return stringifyFrontmatterDocument({ frontmatter, body: task.prompt || '' })
}

export function parseTaskMarkdown(
  markdown: string,
  options: RepeatTaskMarkdownParseOptions = {},
): RepeatTaskApiRecord | null {
  const { frontmatter: fm, body } = parseFrontmatterOrBody(markdown)

  const fallbackId = options.fallbackId?.trim()
  const id = (fm.id ?? '').trim() || fallbackId || (fm.name ?? '').trim()
  if (!id) return null

  const name = (fm.name ?? '').trim() || id
  const intervalMinutes = parseNumber(fm.intervalMinutes, 60)
  const schedule = parseSchedule(fm.schedule)

  return {
    id,
    name,
    prompt: body.trim(),
    intervalMinutes: Math.max(1, intervalMinutes),
    enabled: parseBoolean(fm.enabled, true),
    profileId: (fm.profileId ?? '').trim() || undefined,
    runOnStartup: parseBoolean(fm.runOnStartup, false) || undefined,
    speakOnTrigger: parseBoolean(fm.speakOnTrigger, false) || undefined,
    continueInSession: parseBoolean(fm.continueInSession, false) || undefined,
    lastSessionId: (fm.lastSessionId ?? '').trim() || undefined,
    runContinuously: parseBoolean(fm.runContinuously, false) || undefined,
    maxIterations: fm.maxIterations ? Math.max(1, Math.floor(parseNumber(fm.maxIterations, 0))) || undefined : undefined,
    lastRunAt: fm.lastRunAt ? parseNumber(fm.lastRunAt, 0) || undefined : undefined,
    schedule,
  }
}
