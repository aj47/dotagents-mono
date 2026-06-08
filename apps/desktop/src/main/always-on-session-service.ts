import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { getRendererHandlers } from "@egoist/tipc/main"
import { dataFolder } from "./config"
import { logApp } from "./debug"
import { loadPersistedJson, savePersistedJson } from "./session-persistence"
import { WINDOWS } from "./window"
import type { RendererHandlers } from "./renderer-handlers"
import type {
  AlwaysOnLogEntry,
  AlwaysOnLogEntryKind,
  AlwaysOnQuestion,
  AlwaysOnQuestionChoice,
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
      "- When you need user input, call ask_always_on_question with 2-3 choices. Keep allowCustom true unless custom answers would be unsafe.",
      "- After asking a question, continue with a different independent action. Do not wait idle for the answer.",
      "- When answered questions appear in the conversation, use them to continue the branch they unlock.",
      "- Avoid retrying the same failed path unless new information changed the situation.",
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
          latestLogEntry: record.latestLogEntry,
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
