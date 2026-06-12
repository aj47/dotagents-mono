import fs from "fs"
import path from "path"
import type { GoalProgressActor, GoalProgressEvent, GoalProgressEventType } from "@dotagents/shared"
import { globalAgentsFolder } from "./config"
import { logApp } from "./debug"

export interface GoalProgressEventInput {
  type: GoalProgressEventType
  actor: GoalProgressActor
  goalId?: string
  parentGoalId?: string
  decisionId?: string
  loopId?: string
  sessionId?: string
  conversationId?: string
  title: string
  summary?: string
  source?: string
  metadata?: Record<string, unknown>
}

export interface GoalProgressEventListOptions {
  goalId?: string
  parentGoalId?: string
  limit?: number
}

function createEventId(now: number): string {
  const suffix = Math.random().toString(36).slice(2, 10)
  return `gpe_${now}_${suffix}`
}

function getEventsDir(): string {
  return path.join(globalAgentsFolder, "goal-events")
}

function getEventsPath(): string {
  return path.join(getEventsDir(), "events.jsonl")
}

export class GoalProgressService {
  appendEvent(input: GoalProgressEventInput): GoalProgressEvent {
    const now = Date.now()
    const event: GoalProgressEvent = {
      id: createEventId(now),
      at: now,
      ...input,
    }

    try {
      fs.mkdirSync(getEventsDir(), { recursive: true })
      fs.appendFileSync(getEventsPath(), `${JSON.stringify(event)}\n`, "utf8")
    } catch (error) {
      logApp("[GoalProgressService] Failed to append goal progress event", error)
    }

    return event
  }

  listEvents(options: GoalProgressEventListOptions = {}): GoalProgressEvent[] {
    const filePath = getEventsPath()
    if (!fs.existsSync(filePath)) return []

    let lines: string[]
    try {
      lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/u).filter(Boolean)
    } catch (error) {
      logApp("[GoalProgressService] Failed to read goal progress events", error)
      return []
    }

    const events: GoalProgressEvent[] = []
    for (const line of lines) {
      try {
        const event = JSON.parse(line) as GoalProgressEvent
        if (options.goalId && event.goalId !== options.goalId && event.parentGoalId !== options.goalId) continue
        if (options.parentGoalId && event.parentGoalId !== options.parentGoalId) continue
        events.push(event)
      } catch {
        // Ignore malformed historical lines; the log remains append-only.
      }
    }

    const limit = Math.max(1, Math.min(500, Math.floor(options.limit ?? 100)))
    return events.sort((a, b) => b.at - a.at).slice(0, limit)
  }

  countEvents(): number {
    const filePath = getEventsPath()
    if (!fs.existsSync(filePath)) return 0
    try {
      return fs.readFileSync(filePath, "utf8").split(/\r?\n/u).filter(Boolean).length
    } catch {
      return 0
    }
  }

  hasEventForGoal(type: GoalProgressEvent["type"], goalId: string): boolean {
    return this.listEvents({ goalId, limit: 500 }).some((event) => event.type === type && event.goalId === goalId)
  }
}

export const goalProgressService = new GoalProgressService()
