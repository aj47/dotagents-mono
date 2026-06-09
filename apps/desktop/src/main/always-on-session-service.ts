import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs"
import { basename, dirname, join } from "path"
import { getRendererHandlers } from "@egoist/tipc/main"
import { dataFolder } from "./config"
import { logApp } from "./debug"
import { loadPersistedJson, savePersistedJson } from "./session-persistence"
import { WINDOWS } from "./window"
import type { RendererHandlers } from "./renderer-handlers"
import type {
  AlwaysOnAuditFinding,
  AlwaysOnLogEntry,
  AlwaysOnLogEntryKind,
  AlwaysOnQuestion,
  AlwaysOnQuestionChoice,
  AlwaysOnRepeatedLogTitle,
  AlwaysOnSessionAuditSummary,
  AlwaysOnSessionStatus,
  AlwaysOnSessionSummary,
  LoopConfig,
} from "../shared/types"

type AlwaysOnSessionRecord = {
  id: string
  loopId: string
  name: string
  createdAt: number
  updatedAt: number
  currentSessionId?: string
  conversationId?: string
  logPath: string
  logCount: number
  latestLogEntry?: AlwaysOnLogEntry
  questions: AlwaysOnQuestion[]
}

type PersistedAlwaysOnState = {
  version: 1
  sessions: AlwaysOnSessionRecord[]
}

type LoopStatusLike = {
  id: string
  enabled: boolean
  isRunning: boolean
}

type AppendLogInput = {
  alwaysOnSessionId?: string
  loopId?: string
  runtimeSessionId?: string
  conversationId?: string
  runId?: number
  kind: AlwaysOnLogEntryKind
  title: string
  details?: string
  outcome?: string
}

type AskQuestionInput = {
  alwaysOnSessionId?: string
  loopId?: string
  runtimeSessionId?: string
  conversationId?: string
  sourceMessageIndex?: number
  prompt: string
  choices: AlwaysOnQuestionChoice[]
  allowCustom?: boolean
  reason?: "question" | "blocker"
}

const STATE_PATH = join(dataFolder, "always-on-sessions.json")
const LOG_DIR = join(dataFolder, "always-on-sessions")
const DEFAULT_ALWAYS_ON_NAME = "Always-on session"
const MAX_RECENT_QUESTIONS = 8
const MAX_RECENT_LOG_ENTRIES = 8
const MAX_AUDIT_LOG_ENTRIES = 1000
const ARTIFACT_TEXT_REGEX = /\b(?:created|wrote|saved|updated)\s+[`"']?((?:\/[^\s"'`]+|[A-Za-z0-9._/-]+\.(?:md|txt|json|tsx?|jsx?|py|sh|ya?ml|html|css|mp4|mov|png|jpe?g|webm)))[`"']?/iu

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

function sanitizeLogFileComponent(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function normalizeChoiceId(value: string, index: number): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
  return normalized || `choice-${index + 1}`
}

function normalizeQuestionChoices(rawChoices: AlwaysOnQuestionChoice[]): AlwaysOnQuestionChoice[] {
  const seen = new Set<string>()
  const choices: AlwaysOnQuestionChoice[] = []

  for (let index = 0; index < rawChoices.length && choices.length < 3; index += 1) {
    const raw = rawChoices[index]
    const label = typeof raw?.label === "string" ? raw.label.trim() : ""
    if (!label) continue

    let id = typeof raw.id === "string" ? raw.id.trim() : ""
    id = normalizeChoiceId(id || label, index)
    while (seen.has(id)) {
      id = `${id}-${choices.length + 1}`
    }
    seen.add(id)

    const description = typeof raw.description === "string" ? raw.description.trim() : ""
    choices.push({
      id,
      label,
      ...(description ? { description } : {}),
    })
  }

  return choices
}

function countLogLines(filePath: string): number {
  try {
    if (!existsSync(filePath)) return 0
    const raw = readFileSync(filePath, "utf8")
    if (!raw.trim()) return 0
    return raw.trimEnd().split(/\r?\n/u).length
  } catch {
    return 0
  }
}

function parseLogEntry(line: string): AlwaysOnLogEntry | null {
  try {
    const parsed = JSON.parse(line) as Partial<AlwaysOnLogEntry>
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.alwaysOnSessionId !== "string" ||
      typeof parsed.loopId !== "string" ||
      typeof parsed.kind !== "string" ||
      typeof parsed.title !== "string" ||
      typeof parsed.timestamp !== "number"
    ) {
      return null
    }

    return parsed as AlwaysOnLogEntry
  } catch {
    return null
  }
}

function normalizeAuditTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .replace(/\b(actual|actually|again|concrete|immediate|immediately|now|promised|real|the|with|for|and|to|a|an)\b/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

function hasMeaningfulOutcome(entry: AlwaysOnLogEntry): boolean {
  const outcome = entry.outcome?.trim()
  if (!outcome) return false
  if (entry.kind === "error") return false
  if (entry.kind !== "run_completed") return true
  return !/maximum iteration|iteration limit|emergency kill switch|stopped by/u.test(outcome.toLowerCase())
}

function isArtifactEntry(entry: AlwaysOnLogEntry): boolean {
  if (entry.kind === "artifact") return true
  const text = `${entry.title}\n${entry.details ?? ""}\n${entry.outcome ?? ""}`
  return ARTIFACT_TEXT_REGEX.test(text)
}

function getArtifactKeys(entry: AlwaysOnLogEntry): string[] {
  const text = `${entry.details ?? ""}\n${entry.outcome ?? ""}\n${entry.title}`
  const match = text.match(ARTIFACT_TEXT_REGEX)
  const primary = (match?.[1] ?? entry.title).trim().toLowerCase()
  const leaf = basename(primary)
  return leaf && leaf !== primary ? [primary, leaf] : [primary]
}

function hasSeenArtifact(keys: string[], seen: Set<string>): boolean {
  return keys.some((key) => seen.has(key))
}

function markSeenArtifact(keys: string[], seen: Set<string>): void {
  for (const key of keys) {
    seen.add(key)
  }
}

function hasUsefulRunCompletionSummary(entry: AlwaysOnLogEntry): boolean {
  if (entry.kind !== "run_completed") return false
  const outcome = entry.outcome?.trim()
  if (!outcome) return false
  const normalized = outcome.toLowerCase()
  if (/maximum iteration|iteration limit|emergency kill switch|stopped by/u.test(normalized)) return false
  return /\bknown:|\bsucceeded\b|\bcompleted\b|\bcreated\b|\bupdated\b/u.test(normalized)
}

function getDistinctRecentArtifacts(entries: AlwaysOnLogEntry[], limit: number = 5): AlwaysOnLogEntry[] {
  const seen = new Set<string>()
  const recentArtifacts: AlwaysOnLogEntry[] = []
  for (const entry of [...entries].reverse()) {
    if (!isArtifactEntry(entry)) continue
    const keys = getArtifactKeys(entry)
    if (hasSeenArtifact(keys, seen)) continue
    markSeenArtifact(keys, seen)
    recentArtifacts.push(entry)
    if (recentArtifacts.length >= limit) break
  }
  return recentArtifacts
}

function isMechanicalLogEntry(entry: AlwaysOnLogEntry): boolean {
  if (entry.kind === "run_started" || entry.kind === "resume") return true
  if (entry.kind === "run_completed") return !hasUsefulRunCompletionSummary(entry)
  if (entry.kind === "evidence" && normalizeAuditTitle(entry.title) === "command completed") return true
  return false
}

function isReadableWorkEntry(entry: AlwaysOnLogEntry): boolean {
  if (isMechanicalLogEntry(entry)) return false
  if (entry.kind === "evidence" && !entry.title.trim()) return false
  return true
}

function getRecentWorkEntries(entries: AlwaysOnLogEntry[], limit: number = 8): AlwaysOnLogEntry[] {
  return entries
    .filter(isReadableWorkEntry)
    .slice(-limit)
}

function isMaxIterationCompletion(entry: AlwaysOnLogEntry): boolean {
  if (entry.kind !== "run_completed") return false
  const text = `${entry.details ?? ""}\n${entry.outcome ?? ""}`.toLowerCase()
  return /maximum iteration|iteration limit/u.test(text)
}

function isIntentOnlyAttempt(entry: AlwaysOnLogEntry): boolean {
  if (entry.kind !== "attempt" || entry.outcome?.trim()) return false
  const text = `${entry.title} ${entry.details ?? ""}`.toLowerCase()
  return /\b(run|execute|inspect|probe|read|write|create|check|verify)\b/u.test(text)
}

function calculateLogOnlyScore(params: {
  analyzedLogEntries: number
  attemptCount: number
  repeatedAttemptCount: number
  verifiedOutcomeCount: number
  maxIterationCompletionCount: number
  longestIntentOnlyStreak: number
}): number {
  if (params.analyzedLogEntries === 0) return 0
  const attemptRatio = params.attemptCount / params.analyzedLogEntries
  const repeatedRatio = params.attemptCount > 0 ? params.repeatedAttemptCount / params.attemptCount : 0
  const streakPressure = Math.min(1, params.longestIntentOnlyStreak / 25)
  const maxIterationPressure = Math.min(1, params.maxIterationCompletionCount / 5)
  const noVerifiedOutcomePressure = params.verifiedOutcomeCount === 0 && params.attemptCount >= 10 ? 1 : 0

  return Math.round(Math.min(100, (
    attemptRatio * 35 +
    repeatedRatio * 25 +
    streakPressure * 15 +
    maxIterationPressure * 15 +
    noVerifiedOutcomePressure * 10
  )))
}

function buildAuditFindings(params: {
  verdict: AlwaysOnSessionAuditSummary["verdict"]
  verifiedOutcomeCount: number
  repeatedAttemptCount: number
  maxIterationCompletionCount: number
  questionCount: number
  blockerCount: number
  pauseLeakCount: number
  longestIntentOnlyStreak: number
  analyzedLogEntries: number
  totalLogEntries: number
}): AlwaysOnAuditFinding[] {
  const findings: AlwaysOnAuditFinding[] = []

  if (params.verifiedOutcomeCount === 0 && params.analyzedLogEntries > 0) {
    findings.push({
      severity: params.verdict === "wasteful" ? "critical" : "warning",
      title: "No verified outcomes in log",
      detail: "The durable log records intent, but it does not record a completed artifact or command result.",
    })
  }

  if (params.repeatedAttemptCount > 0) {
    findings.push({
      severity: params.repeatedAttemptCount >= 20 ? "critical" : "warning",
      title: "Repeated attempt loop",
      detail: `${params.repeatedAttemptCount} attempt logs repeat the same work class without durable new evidence.`,
    })
  }

  if (params.maxIterationCompletionCount > 0) {
    findings.push({
      severity: params.maxIterationCompletionCount >= 3 ? "critical" : "warning",
      title: "Runs hit the iteration cap",
      detail: `${params.maxIterationCompletionCount} continuous runs ended at the iteration limit instead of a clean outcome.`,
    })
  }

  if (params.questionCount === 0 && params.blockerCount === 0 && params.repeatedAttemptCount >= 10) {
    findings.push({
      severity: "warning",
      title: "No blocker or question trail",
      detail: "The agent kept retrying work instead of queueing a decision or marking a blocked branch.",
    })
  }

  if (params.pauseLeakCount > 0) {
    findings.push({
      severity: "critical",
      title: "Activity after pause",
      detail: `${params.pauseLeakCount} log entr${params.pauseLeakCount === 1 ? "y" : "ies"} appeared after a pause without a resume entry.`,
    })
  }

  if (params.longestIntentOnlyStreak >= 10) {
    findings.push({
      severity: params.longestIntentOnlyStreak >= 25 ? "critical" : "warning",
      title: "Long intent-only streak",
      detail: `The longest run of attempt logs without an outcome was ${params.longestIntentOnlyStreak}.`,
    })
  }

  if (params.totalLogEntries > params.analyzedLogEntries) {
    findings.push({
      severity: "info",
      title: "Audit window capped",
      detail: `Showing the latest ${params.analyzedLogEntries} of ${params.totalLogEntries} log entries.`,
    })
  }

  return findings.slice(0, 5)
}

function buildAuditSummary(totalLogEntries: number, entries: AlwaysOnLogEntry[]): AlwaysOnSessionAuditSummary {
  const analyzedLogEntries = entries.length
  if (analyzedLogEntries === 0) {
    return {
      verdict: "unknown",
      headline: "No log evidence yet",
      totalLogEntries,
      analyzedLogEntries,
      attemptCount: 0,
      blockerCount: 0,
      questionCount: 0,
      answerCount: 0,
      artifactCount: 0,
      runStartedCount: 0,
      runCompletedCount: 0,
      maxIterationCompletionCount: 0,
      outcomeCount: 0,
      verifiedOutcomeCount: 0,
      repeatedAttemptCount: 0,
      longestIntentOnlyStreak: 0,
      currentIntentOnlyStreak: 0,
      pauseLeakCount: 0,
      logOnlyScore: 0,
      topRepeatedTitles: [],
      recentArtifacts: [],
      findings: [],
    }
  }

  const titleStats = new Map<string, { title: string; count: number }>()
  let attemptCount = 0
  let blockerCount = 0
  let questionCount = 0
  let answerCount = 0
  const artifactKeys = new Set<string>()
  let artifactCount = 0
  let runStartedCount = 0
  let runCompletedCount = 0
  let maxIterationCompletionCount = 0
  let outcomeCount = 0
  let verifiedOutcomeCount = 0
  let longestIntentOnlyStreak = 0
  let currentIntentOnlyStreak = 0
  let pauseLeakCount = 0
  let paused = false

  for (const entry of entries) {
    if (paused && entry.kind !== "pause" && entry.kind !== "resume") {
      pauseLeakCount += 1
    }
    if (entry.kind === "pause") paused = true
    if (entry.kind === "resume") paused = false

    if (entry.kind === "attempt") {
      attemptCount += 1
      const normalizedTitle = normalizeAuditTitle(entry.title)
      if (normalizedTitle) {
        const existing = titleStats.get(normalizedTitle)
        if (existing) {
          existing.count += 1
        } else {
          titleStats.set(normalizedTitle, { title: entry.title, count: 1 })
        }
      }
    }
    if (entry.kind === "blocker") blockerCount += 1
    if (entry.kind === "question") questionCount += 1
    if (entry.kind === "answer") answerCount += 1
    if (isArtifactEntry(entry)) {
      const keys = getArtifactKeys(entry)
      if (!hasSeenArtifact(keys, artifactKeys)) {
        artifactCount += 1
        markSeenArtifact(keys, artifactKeys)
      }
    }
    if (entry.kind === "run_started") runStartedCount += 1
    if (entry.kind === "run_completed") runCompletedCount += 1
    if (isMaxIterationCompletion(entry)) maxIterationCompletionCount += 1
    if (entry.outcome?.trim()) outcomeCount += 1
    if (hasMeaningfulOutcome(entry)) verifiedOutcomeCount += 1

    if (isIntentOnlyAttempt(entry)) {
      currentIntentOnlyStreak += 1
      longestIntentOnlyStreak = Math.max(longestIntentOnlyStreak, currentIntentOnlyStreak)
    } else {
      currentIntentOnlyStreak = 0
    }
  }

  const topRepeatedTitles: AlwaysOnRepeatedLogTitle[] = [...titleStats.values()]
    .filter((item) => item.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const recentArtifacts = getDistinctRecentArtifacts(entries, 5)
  const repeatedAttemptCount = [...titleStats.values()]
    .filter((item) => item.count >= 3)
    .reduce((total, item) => total + item.count, 0)
  const logOnlyScore = calculateLogOnlyScore({
    analyzedLogEntries,
    attemptCount,
    repeatedAttemptCount,
    verifiedOutcomeCount,
    maxIterationCompletionCount,
    longestIntentOnlyStreak,
  })
  const verdict: AlwaysOnSessionAuditSummary["verdict"] = logOnlyScore >= 70
    ? "wasteful"
    : logOnlyScore >= 35 || maxIterationCompletionCount > 0 || repeatedAttemptCount > 0
    ? "mixed"
    : verifiedOutcomeCount > 0
    ? "productive"
    : "unknown"
  const headline = verdict === "wasteful"
    ? "High log-only risk"
    : verdict === "mixed"
    ? "Some progress, needs review"
    : verdict === "productive"
    ? "Verified progress in log"
    : "Insufficient evidence"
  const findings = buildAuditFindings({
    verdict,
    verifiedOutcomeCount,
    repeatedAttemptCount,
    maxIterationCompletionCount,
    questionCount,
    blockerCount,
    pauseLeakCount,
    longestIntentOnlyStreak,
    analyzedLogEntries,
    totalLogEntries,
  })

  return {
    verdict,
    headline,
    totalLogEntries,
    analyzedLogEntries,
    attemptCount,
    blockerCount,
    questionCount,
    answerCount,
    artifactCount,
    runStartedCount,
    runCompletedCount,
    maxIterationCompletionCount,
    outcomeCount,
    verifiedOutcomeCount,
    repeatedAttemptCount,
    longestIntentOnlyStreak,
    currentIntentOnlyStreak,
    pauseLeakCount,
    logOnlyScore,
    topRepeatedTitles,
    recentArtifacts,
    findings,
  }
}

function notifyAlwaysOnSessionsChanged(): void {
  for (const win of [WINDOWS.get("main"), WINDOWS.get("panel")]) {
    if (!win) continue
    try {
      getRendererHandlers<RendererHandlers>(win.webContents).alwaysOnSessionsChanged?.send()
    } catch {
      // Window may not be ready yet.
    }
  }
}

class AlwaysOnSessionService {
  private static instance: AlwaysOnSessionService | null = null
  private state: PersistedAlwaysOnState = { version: 1, sessions: [] }

  static getInstance(): AlwaysOnSessionService {
    if (!AlwaysOnSessionService.instance) {
      AlwaysOnSessionService.instance = new AlwaysOnSessionService()
    }
    return AlwaysOnSessionService.instance
  }

  private constructor() {
    this.load()
  }

  private load(): void {
    const persisted = loadPersistedJson<PersistedAlwaysOnState>(
      STATE_PATH,
      "AlwaysOnSessionService",
    )
    if (!persisted || !Array.isArray(persisted.sessions)) {
      return
    }

    this.state = {
      version: 1,
      sessions: persisted.sessions
        .filter((session): session is AlwaysOnSessionRecord =>
          typeof session?.id === "string" &&
          typeof session.loopId === "string" &&
          typeof session.name === "string",
        )
        .map((session) => ({
          ...session,
          questions: Array.isArray(session.questions) ? session.questions : [],
          logPath: session.logPath || this.getDefaultLogPath(session.id),
          logCount: typeof session.logCount === "number"
            ? session.logCount
            : countLogLines(session.logPath || this.getDefaultLogPath(session.id)),
        })),
    }
  }

  private save(): void {
    savePersistedJson(STATE_PATH, this.state, "AlwaysOnSessionService")
  }

  private getDefaultLogPath(alwaysOnSessionId: string): string {
    return join(LOG_DIR, sanitizeLogFileComponent(alwaysOnSessionId), "attempts.jsonl")
  }

  private ensureLogPath(record: AlwaysOnSessionRecord): string {
    const logPath = record.logPath || this.getDefaultLogPath(record.id)
    mkdirSync(dirname(logPath), { recursive: true })
    record.logPath = logPath
    return logPath
  }

  private touch(record: AlwaysOnSessionRecord): void {
    record.updatedAt = Date.now()
  }

  private findRecord(alwaysOnSessionId: string): AlwaysOnSessionRecord | undefined {
    return this.state.sessions.find((session) => session.id === alwaysOnSessionId)
  }

  private findRecordByLoopId(loopId: string): AlwaysOnSessionRecord | undefined {
    return this.state.sessions.find((session) => session.loopId === loopId)
  }

  private readRecentLogEntries(record: AlwaysOnSessionRecord, limit: number): AlwaysOnLogEntry[] {
    try {
      const logPath = record.logPath || this.getDefaultLogPath(record.id)
      if (!existsSync(logPath)) return []

      return readFileSync(logPath, "utf8")
        .trimEnd()
        .split(/\r?\n/u)
        .slice(-Math.max(1, limit))
        .flatMap((line) => {
          const entry = parseLogEntry(line)
          return entry ? [entry] : []
        })
    } catch {
      return []
    }
  }

  private resolveRecord(input: { alwaysOnSessionId?: string; loopId?: string; runtimeSessionId?: string }, loops: LoopConfig[] = []): AlwaysOnSessionRecord | undefined {
    if (input.alwaysOnSessionId) {
      const direct = this.findRecord(input.alwaysOnSessionId)
      if (direct) return direct
    }

    if (input.loopId) {
      const byLoop = this.findRecordByLoopId(input.loopId)
      if (byLoop) return byLoop
    }

    if (input.runtimeSessionId) {
      const matchingLoop = loops.find((loop) =>
        loop.alwaysOnSession === true && loop.lastSessionId === input.runtimeSessionId,
      )
      if (matchingLoop) {
        return this.findRecordByLoopId(matchingLoop.id)
      }
    }

    return undefined
  }

  private registerLoopIfMissing(loop: LoopConfig): AlwaysOnSessionRecord | undefined {
    if (!loop.alwaysOnSession) return undefined

    const existing = this.findRecordByLoopId(loop.id)
    if (existing) {
      if (existing.name !== loop.name) {
        existing.name = loop.name
        this.touch(existing)
        this.save()
      }
      return existing
    }

    const now = Date.now()
    const id = createId("always")
    const record: AlwaysOnSessionRecord = {
      id,
      loopId: loop.id,
      name: loop.name || DEFAULT_ALWAYS_ON_NAME,
      createdAt: now,
      updatedAt: now,
      currentSessionId: loop.lastSessionId,
      logPath: this.getDefaultLogPath(id),
      logCount: 0,
      questions: [],
    }
    this.state.sessions.push(record)
    this.save()
    return record
  }

  buildLoopPrompt(alwaysOnSessionId: string, name: string): string {
    return [
      `# ${name}`,
      "",
      "You are running as an always-on DotAgents session. Continue useful work until the user pauses this session.",
      "",
      "Operational rules:",
      "- Never stop only because one path is blocked. If blocked, log the blocker, ask a queued question if user input would help, then switch to another useful branch or task.",
      "- Before every concrete attempt, call log_always_on_attempt with a short title and the relevant details. Use kind=\"attempt\" for normal work and kind=\"blocker\" for blocked paths.",
      "- A kind=\"attempt\" entry is a promise to do concrete work. Do not write two attempt entries in a row without new evidence, a recorded outcome, a blocker, a branch switch, or a queued question between them.",
      "- Concrete runtime tool results are logged as kind=\"evidence\" automatically when possible. Created or updated files are logged as kind=\"artifact\". Use that evidence to decide the next step instead of restating intent.",
      "- Actual progress means a durable user-facing artifact, a verified change, a concrete decision, or a queued question that unblocks work. Treat status reports, planning notes, and log audits as support work, not the deliverable.",
      "- Prefer one short inspection step followed by a durable user-facing artifact or a queued question. Avoid long chains of audit/discovery/status updates.",
      "- When you create or update a durable file, document, checklist, script, plan, code change, or other output, log it with kind=\"artifact\" and include the path or exact output location.",
      "- If you create or update files with shell commands, make the command print `created /absolute/path` or `updated /absolute/path` for each durable output so the UI can surface the work directly.",
      "- Do not add a duplicate evidence log after an artifact unless it records a distinct decision, verification result, or next branch.",
      "- When you need user input, call ask_always_on_question with 2-3 choices. Keep allowCustom true unless custom answers would be unsafe.",
      "- Do not log questions manually; ask_always_on_question creates the durable question log entry.",
      "- After asking a question, continue with a different independent action. Do not wait idle for the answer.",
      "- When answered questions appear in the conversation, use them to continue the branch they unlock.",
      "- Do not loop on status/logging work. If the same attempt class appears twice without new evidence, run a concrete check, make a decision from the result, or switch to another branch.",
      "- If a path is blocked by approval, missing context, unclear priority, or a destructive choice, queue a question before switching branches.",
      "- Avoid retrying the same failed path unless new information changed the situation.",
      "- Treat guidance returned by log_always_on_attempt as part of your next-step policy.",
      "",
      `Always-on session id: ${alwaysOnSessionId}`,
    ].join("\n")
  }

  createSessionRecord(name: string = DEFAULT_ALWAYS_ON_NAME): {
    record: AlwaysOnSessionRecord
    loop: LoopConfig
  } {
    const now = Date.now()
    const recordId = createId("always")
    const loopId = createId("loop")
    const record: AlwaysOnSessionRecord = {
      id: recordId,
      loopId,
      name: name.trim() || DEFAULT_ALWAYS_ON_NAME,
      createdAt: now,
      updatedAt: now,
      logPath: this.getDefaultLogPath(recordId),
      logCount: 0,
      questions: [],
    }

    const loop: LoopConfig = {
      id: loopId,
      name: record.name,
      prompt: this.buildLoopPrompt(record.id, record.name),
      intervalMinutes: 1,
      enabled: true,
      runContinuously: true,
      continueInSession: true,
      alwaysOnSession: true,
      maxIterations: 25,
    }

    this.state.sessions.push(record)
    this.appendLog({
      alwaysOnSessionId: record.id,
      loopId,
      kind: "resume",
      title: "Always-on session created",
      details: record.name,
    })
    return { record, loop }
  }

  getSummaries(loops: LoopConfig[], statuses: LoopStatusLike[] = []): AlwaysOnSessionSummary[] {
    let createdMissingRecord = false
    for (const loop of loops) {
      if (loop.alwaysOnSession && !this.findRecordByLoopId(loop.id)) {
        this.registerLoopIfMissing(loop)
        createdMissingRecord = true
      }
    }
    if (createdMissingRecord) {
      this.save()
    }

    const loopById = new Map(loops.map((loop) => [loop.id, loop] as const))
    const statusById = new Map(statuses.map((status) => [status.id, status] as const))

    return this.state.sessions
      .filter((record) => loopById.get(record.loopId)?.alwaysOnSession === true)
      .map((record) => {
        const loop = loopById.get(record.loopId)
        const status = statusById.get(record.loopId)
        const enabled = loop?.enabled ?? status?.enabled ?? false
        const isRunning = status?.isRunning ?? false
        const summaryStatus: AlwaysOnSessionStatus = enabled
          ? (isRunning ? "running" : "idle")
          : "paused"
        const pendingQuestions = record.questions.filter((question) => question.status === "pending")
        const answeredQuestions = record.questions.filter((question) => question.status === "answered")
        const recentLogEntries = this.readRecentLogEntries(record, MAX_RECENT_LOG_ENTRIES)
        const auditEntries = this.readRecentLogEntries(record, MAX_AUDIT_LOG_ENTRIES)
        const recentWorkEntries = getRecentWorkEntries(auditEntries, MAX_RECENT_LOG_ENTRIES)
        return {
          id: record.id,
          loopId: record.loopId,
          name: loop?.name ?? record.name,
          status: summaryStatus,
          enabled,
          isRunning,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          currentSessionId: loop?.lastSessionId ?? record.currentSessionId,
          conversationId: record.conversationId,
          logPath: record.logPath,
          logCount: record.logCount,
          latestLogEntry: recentLogEntries[recentLogEntries.length - 1] ?? record.latestLogEntry,
          latestWorkEntry: recentWorkEntries[recentWorkEntries.length - 1],
          recentLogEntries,
          recentWorkEntries,
          auditSummary: buildAuditSummary(record.logCount, auditEntries),
          pendingQuestionCount: pendingQuestions.length,
          answeredQuestionCount: answeredQuestions.length,
          questions: [
            ...pendingQuestions,
            ...answeredQuestions.slice(-MAX_RECENT_QUESTIONS),
          ],
        }
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  getRecentLogEntries(alwaysOnSessionId: string, limit: number = 20): AlwaysOnLogEntry[] {
    const record = this.findRecord(alwaysOnSessionId)
    if (!record) return []
    return this.readRecentLogEntries(record, limit)
  }

  getLogEntries(alwaysOnSessionId: string): AlwaysOnLogEntry[] {
    const record = this.findRecord(alwaysOnSessionId)
    if (!record) return []
    return this.readRecentLogEntries(record, Number.MAX_SAFE_INTEGER)
  }

  getAuditSummary(alwaysOnSessionId: string, limit: number = MAX_AUDIT_LOG_ENTRIES): AlwaysOnSessionAuditSummary | undefined {
    const record = this.findRecord(alwaysOnSessionId)
    if (!record) return undefined
    return buildAuditSummary(record.logCount, this.readRecentLogEntries(record, limit))
  }

  recordRuntimeSession(loopId: string, runtimeSessionId: string, conversationId: string): void {
    const record = this.findRecordByLoopId(loopId)
    if (!record) return

    record.currentSessionId = runtimeSessionId
    record.conversationId = conversationId
    this.touch(record)
    this.save()
    notifyAlwaysOnSessionsChanged()
  }

  appendLog(input: AppendLogInput, loops: LoopConfig[] = []): AlwaysOnLogEntry | null {
    const record = this.resolveRecord(input, loops)
    if (!record) {
      logApp("[AlwaysOnSessionService] Could not append log; always-on session not found", input)
      return null
    }

    const entry: AlwaysOnLogEntry = {
      id: createId("aolog"),
      alwaysOnSessionId: record.id,
      loopId: record.loopId,
      ...(input.runtimeSessionId ? { runtimeSessionId: input.runtimeSessionId } : {}),
      ...(input.conversationId ? { conversationId: input.conversationId } : {}),
      ...(typeof input.runId === "number" ? { runId: input.runId } : {}),
      kind: input.kind,
      title: input.title.trim() || input.kind,
      ...(input.details?.trim() ? { details: input.details.trim() } : {}),
      ...(input.outcome?.trim() ? { outcome: input.outcome.trim() } : {}),
      timestamp: Date.now(),
    }

    const logPath = this.ensureLogPath(record)
    appendFileSync(logPath, `${JSON.stringify(entry)}\n`, "utf8")
    record.logCount += 1
    record.latestLogEntry = entry
    this.touch(record)
    this.save()
    notifyAlwaysOnSessionsChanged()
    return entry
  }

  askQuestion(input: AskQuestionInput, loops: LoopConfig[] = []): AlwaysOnQuestion | null {
    const record = this.resolveRecord(input, loops)
    if (!record) {
      logApp("[AlwaysOnSessionService] Could not create question; always-on session not found", input)
      return null
    }

    const choices = normalizeQuestionChoices(input.choices)
    if (choices.length < 2) {
      return null
    }

    const question: AlwaysOnQuestion = {
      id: createId("aoq"),
      alwaysOnSessionId: record.id,
      loopId: record.loopId,
      ...(input.runtimeSessionId ? { runtimeSessionId: input.runtimeSessionId } : {}),
      ...(input.conversationId ? { conversationId: input.conversationId } : {}),
      ...(typeof input.sourceMessageIndex === "number" ? { sourceMessageIndex: input.sourceMessageIndex } : {}),
      prompt: input.prompt.trim(),
      choices,
      allowCustom: input.allowCustom !== false,
      ...(input.reason ? { reason: input.reason } : {}),
      status: "pending",
      createdAt: Date.now(),
    }

    record.questions.push(question)
    this.touch(record)
    this.save()
    this.appendLog({
      alwaysOnSessionId: record.id,
      runtimeSessionId: input.runtimeSessionId,
      conversationId: input.conversationId,
      kind: "question",
      title: input.reason === "blocker" ? "Blocker question queued" : "Question queued",
      details: question.prompt,
    })
    notifyAlwaysOnSessionsChanged()
    return question
  }

  answerQuestion(params: {
    alwaysOnSessionId: string
    questionId: string
    answerText: string
    answerChoiceId?: string
  }): AlwaysOnQuestion | null {
    const record = this.findRecord(params.alwaysOnSessionId)
    if (!record) return null
    const question = record.questions.find((candidate) => candidate.id === params.questionId)
    if (!question || question.status !== "pending") return null

    const answerText = params.answerText.trim()
    if (!answerText) return null

    question.status = "answered"
    question.answeredAt = Date.now()
    question.answerText = answerText
    if (params.answerChoiceId) {
      question.answerChoiceId = params.answerChoiceId
    }
    this.touch(record)
    this.save()
    this.appendLog({
      alwaysOnSessionId: record.id,
      runtimeSessionId: question.runtimeSessionId,
      conversationId: question.conversationId,
      kind: "answer",
      title: "Question answered",
      details: question.prompt,
      outcome: answerText,
    })
    notifyAlwaysOnSessionsChanged()
    return question
  }

  setQuestionBranch(alwaysOnSessionId: string, questionId: string, branchConversationId: string): AlwaysOnQuestion | null {
    const record = this.findRecord(alwaysOnSessionId)
    if (!record) return null
    const question = record.questions.find((candidate) => candidate.id === questionId)
    if (!question) return null

    question.branchConversationId = branchConversationId
    this.touch(record)
    this.save()
    notifyAlwaysOnSessionsChanged()
    return question
  }

  dismissQuestion(alwaysOnSessionId: string, questionId: string): AlwaysOnQuestion | null {
    const record = this.findRecord(alwaysOnSessionId)
    if (!record) return null
    const question = record.questions.find((candidate) => candidate.id === questionId)
    if (!question || question.status !== "pending") return null

    question.status = "dismissed"
    this.touch(record)
    this.save()
    notifyAlwaysOnSessionsChanged()
    return question
  }
}

export const alwaysOnSessionService = AlwaysOnSessionService.getInstance()
