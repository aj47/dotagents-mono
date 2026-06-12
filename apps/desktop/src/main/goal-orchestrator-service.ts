import { randomUUID } from "crypto"
import { join } from "path"
import { getRendererHandlers } from "@egoist/tipc/main"
import { dataFolder } from "./config"
import { conversationService } from "./conversation-service"
import { logApp } from "./debug"
import { emitAgentProgress } from "./emit-agent-progress"
import { agentSessionTracker } from "./agent-session-tracker"
import type { RendererHandlers } from "./renderer-handlers"
import { loadPersistedJson, savePersistedJson } from "./session-persistence"
import { agentSessionStateManager, toolApprovalManager } from "./state"
import { WINDOWS } from "./window"
import type {
  Decision,
  Goal,
  GoalActivityNote,
  GoalActivityType,
  GoalAgentRun,
  GoalAgentRunStatus,
  GoalOrchestratorRun,
  GoalOrchestratorSettings,
  GoalOrchestratorSnapshot,
  GoalOrchestratorRunStatus,
  GoalStatus,
  WorkItem,
  WorkItemStatus,
} from "../shared/types"

type PersistedGoalOrchestratorState = {
  version: 1
  goals: Goal[]
  workItems: WorkItem[]
  decisions: Decision[]
  agentRuns: GoalAgentRun[]
  orchestratorRuns: GoalOrchestratorRun[]
  activityNotes: GoalActivityNote[]
  settings: GoalOrchestratorSettings
}

type StartWorkItemOptions = {
  reason?: "manual" | "orchestrator"
  maxIterationsOverride?: number
}

type RunWakeCycleOptions = {
  maxIterationsOverride?: number
}

const GOAL_ORCHESTRATOR_STATE_PATH = join(dataFolder, "goal-orchestrator-state.json")
const MAX_ACTIVITY_NOTES = 250
const MAX_AGENT_RUNS = 200
const MAX_ORCHESTRATOR_RUNS = 100

const DEFAULT_SETTINGS: GoalOrchestratorSettings = {
  maxGlobalRunningSessions: 1,
  maxRunningSessionsPerGoal: 1,
  maxSessionRuntimeMinutes: 60,
  maxIterationsPerSession: undefined,
  maxSessionsPerWakeCycle: 1,
}

function now(): number {
  return Date.now()
}

function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

function truncateSummary(value: string, maxLength = 700): string {
  const normalized = value.trim().replace(/\s+/g, " ")
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 3).trim()}...`
}

function extractBlockedDecisionQuestion(content: string, workItem: WorkItem | undefined): string | null {
  const normalized = content.trim()
  if (!normalized) return null

  const lower = normalized.toLowerCase()
  const looksBlocked =
    lower.includes("blocked") ||
    lower.includes("decision needed") ||
    lower.includes("need user input") ||
    lower.includes("requires user input") ||
    lower.includes("waiting on")
  if (!looksBlocked) return null

  const questionLine = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.endsWith("?"))

  return questionLine || (
    workItem
      ? `What should happen next for "${workItem.title}"? Agent note: ${truncateSummary(normalized, 260)}`
      : `What should happen next? Agent note: ${truncateSummary(normalized, 260)}`
  )
}

function notifyGoalOrchestratorChanged(): void {
  const windows = [WINDOWS.get("main"), WINDOWS.get("panel")]
  for (const win of windows) {
    if (!win) continue
    try {
      getRendererHandlers<RendererHandlers>(win.webContents).goalOrchestratorChanged?.send()
    } catch {
      // Window may not be ready yet.
    }
  }
}

class GoalOrchestratorService {
  private static instance: GoalOrchestratorService | null = null
  private goals: Goal[] = []
  private workItems: WorkItem[] = []
  private decisions: Decision[] = []
  private agentRuns: GoalAgentRun[] = []
  private orchestratorRuns: GoalOrchestratorRun[] = []
  private activityNotes: GoalActivityNote[] = []
  private settings: GoalOrchestratorSettings = { ...DEFAULT_SETTINGS }

  static getInstance(): GoalOrchestratorService {
    if (!GoalOrchestratorService.instance) {
      GoalOrchestratorService.instance = new GoalOrchestratorService()
    }
    return GoalOrchestratorService.instance
  }

  private constructor() {
    this.restorePersistedState()
  }

  getSnapshot(): GoalOrchestratorSnapshot {
    return {
      goals: [...this.goals],
      workItems: [...this.workItems],
      decisions: [...this.decisions],
      agentRuns: [...this.agentRuns],
      orchestratorRuns: [...this.orchestratorRuns],
      activityNotes: [...this.activityNotes],
      settings: { ...this.settings },
    }
  }

  updateSettings(input: Partial<Omit<
    GoalOrchestratorSettings,
    "maxSessionRuntimeMinutes" | "maxIterationsPerSession"
  >> & {
    maxSessionRuntimeMinutes?: number | null
    maxIterationsPerSession?: number | null
  }): GoalOrchestratorSettings {
    this.settings = {
      maxGlobalRunningSessions: this.normalizePositiveInteger(
        input.maxGlobalRunningSessions,
        this.settings.maxGlobalRunningSessions,
      ),
      maxRunningSessionsPerGoal: this.normalizePositiveInteger(
        input.maxRunningSessionsPerGoal,
        this.settings.maxRunningSessionsPerGoal,
      ),
      maxSessionRuntimeMinutes: this.normalizeOptionalPositiveInteger(
        input.maxSessionRuntimeMinutes,
        this.settings.maxSessionRuntimeMinutes,
      ),
      maxIterationsPerSession: this.normalizeOptionalPositiveInteger(
        input.maxIterationsPerSession,
        this.settings.maxIterationsPerSession,
      ),
      maxSessionsPerWakeCycle: this.normalizePositiveInteger(
        input.maxSessionsPerWakeCycle,
        this.settings.maxSessionsPerWakeCycle,
      ),
    }
    this.addActivity("note_saved", "Updated orchestrator limits", {}, false)
    this.persistAndNotify()
    return { ...this.settings }
  }

  createGoal(input: { title: string; notes?: string; status?: GoalStatus }): Goal {
    const title = input.title.trim()
    if (!title) {
      throw new Error("Goal title is required")
    }

    const timestamp = now()
    const goal: Goal = {
      id: createId("goal"),
      title,
      status: input.status ?? "active",
      notes: this.cleanOptionalText(input.notes),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    this.goals.push(goal)
    this.addActivity("goal_created", `Created goal "${goal.title}"`, { goalId: goal.id }, false)
    this.persistAndNotify()
    return goal
  }

  updateGoal(input: { goalId: string; title?: string; notes?: string; status?: GoalStatus }): Goal {
    const goal = this.requireGoal(input.goalId)
    const nextTitle = input.title !== undefined ? input.title.trim() : goal.title
    if (!nextTitle) {
      throw new Error("Goal title is required")
    }

    const updated: Goal = {
      ...goal,
      title: nextTitle,
      ...(input.notes !== undefined ? { notes: this.cleanOptionalText(input.notes) } : {}),
      ...(input.status ? { status: input.status } : {}),
      updatedAt: now(),
    }

    this.goals = this.goals.map((candidate) => candidate.id === updated.id ? updated : candidate)
    this.addActivity("goal_updated", `Updated goal "${updated.title}"`, { goalId: updated.id }, false)
    this.persistAndNotify()
    return updated
  }

  createWorkItem(input: { goalId: string; title: string; notes?: string; status?: WorkItemStatus }): WorkItem {
    const goal = this.requireGoal(input.goalId)
    const title = input.title.trim()
    if (!title) {
      throw new Error("Work item title is required")
    }

    const timestamp = now()
    const workItem: WorkItem = {
      id: createId("work"),
      goalId: goal.id,
      title,
      status: input.status ?? "ready",
      notes: this.cleanOptionalText(input.notes),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    this.workItems.push(workItem)
    this.addActivity("work_created", `Created work item "${workItem.title}"`, {
      goalId: goal.id,
      workItemId: workItem.id,
    }, false)
    this.persistAndNotify()
    return workItem
  }

  updateWorkItem(input: {
    workItemId: string
    title?: string
    notes?: string
    status?: WorkItemStatus
  }): WorkItem {
    const workItem = this.requireWorkItem(input.workItemId)
    const nextTitle = input.title !== undefined ? input.title.trim() : workItem.title
    if (!nextTitle) {
      throw new Error("Work item title is required")
    }

    const updated: WorkItem = {
      ...workItem,
      title: nextTitle,
      ...(input.notes !== undefined ? { notes: this.cleanOptionalText(input.notes) } : {}),
      ...(input.status ? { status: input.status } : {}),
      updatedAt: now(),
    }

    this.workItems = this.workItems.map((candidate) => candidate.id === updated.id ? updated : candidate)
    this.addActivity("work_updated", `Updated work item "${updated.title}"`, {
      goalId: updated.goalId,
      workItemId: updated.id,
    }, false)
    this.persistAndNotify()
    return updated
  }

  createDecision(input: {
    goalId?: string
    workItemId?: string
    question: string
  }): Decision {
    const question = input.question.trim()
    if (!question) {
      throw new Error("Decision question is required")
    }

    const linkedWorkItem = input.workItemId ? this.requireWorkItem(input.workItemId) : undefined
    const goalId = input.goalId ?? linkedWorkItem?.goalId
    if (goalId) {
      this.requireGoal(goalId)
    }

    const timestamp = now()
    const decision: Decision = {
      id: createId("decision"),
      goalId,
      workItemId: linkedWorkItem?.id,
      question,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    this.decisions.push(decision)
    if (linkedWorkItem && linkedWorkItem.status !== "waiting") {
      this.setWorkItemStatus(linkedWorkItem.id, "waiting", linkedWorkItem.notes, false)
    }
    this.addActivity("decision_created", `Decision needed: ${decision.question}`, {
      goalId,
      workItemId: linkedWorkItem?.id,
      decisionId: decision.id,
    }, false)
    this.persistAndNotify()
    return decision
  }

  answerDecision(input: { decisionId: string; answer: string }): Decision {
    const decision = this.requireDecision(input.decisionId)
    const answer = input.answer.trim()
    if (!answer) {
      throw new Error("Decision answer is required")
    }

    const updated: Decision = {
      ...decision,
      status: "answered",
      answer,
      updatedAt: now(),
    }

    this.decisions = this.decisions.map((candidate) => candidate.id === updated.id ? updated : candidate)
    if (updated.workItemId) {
      const workItem = this.workItems.find((candidate) => candidate.id === updated.workItemId)
      if (workItem?.status === "waiting") {
        this.setWorkItemStatus(workItem.id, "ready", workItem.notes, false)
      }
    }
    this.addActivity("decision_answered", `Answered decision: ${answer}`, {
      goalId: updated.goalId,
      workItemId: updated.workItemId,
      decisionId: updated.id,
    }, false)
    this.persistAndNotify()
    return updated
  }

  dismissDecision(input: { decisionId: string }): Decision {
    const decision = this.requireDecision(input.decisionId)
    const updated: Decision = {
      ...decision,
      status: "dismissed",
      updatedAt: now(),
    }

    this.decisions = this.decisions.map((candidate) => candidate.id === updated.id ? updated : candidate)
    this.addActivity("decision_dismissed", `Dismissed decision: ${updated.question}`, {
      goalId: updated.goalId,
      workItemId: updated.workItemId,
      decisionId: updated.id,
    }, false)
    this.persistAndNotify()
    return updated
  }

  async runWakeCycle(options: RunWakeCycleOptions = {}): Promise<GoalOrchestratorRun> {
    const timestamp = now()
    const orchestratorRun: GoalOrchestratorRun = {
      id: createId("orun"),
      status: "running",
      startedAt: timestamp,
      createdSessionCount: 0,
    }
    this.orchestratorRuns.unshift(orchestratorRun)
    this.trimHistory()
    this.persistAndNotify()

    try {
      const activeGoals = this.goals.filter((goal) => goal.status === "active")
      if (activeGoals.length === 0) {
        return this.finishOrchestratorRun(orchestratorRun.id, "skipped", "No active goals")
      }

      await this.killExpiredAgentRuns()

      if (this.getRunningAgentRuns().length >= this.settings.maxGlobalRunningSessions) {
        return this.finishOrchestratorRun(orchestratorRun.id, "skipped", "Global running-session limit reached")
      }

      let createdSessionCount = 0
      const maxSessions = Math.max(1, this.settings.maxSessionsPerWakeCycle)

      while (createdSessionCount < maxSessions) {
        if (this.getRunningAgentRuns().length >= this.settings.maxGlobalRunningSessions) {
          break
        }

        let nextWorkItem = this.selectNextReadyWorkItem()
        if (!nextWorkItem) {
          this.proposeSeedWorkItems(activeGoals)
          nextWorkItem = this.selectNextReadyWorkItem()
        }

        if (!nextWorkItem) {
          break
        }

        const run = await this.startWorkItemAgentSession(nextWorkItem.id, {
          reason: "orchestrator",
          maxIterationsOverride: options.maxIterationsOverride,
        })
        if (!run) {
          break
        }
        createdSessionCount += 1
      }

      const summary = createdSessionCount === 0
        ? "No eligible ready work"
        : `Started ${createdSessionCount} agent session${createdSessionCount === 1 ? "" : "s"}`
      const status: GoalOrchestratorRunStatus = createdSessionCount === 0 ? "skipped" : "done"
      return this.finishOrchestratorRun(orchestratorRun.id, status, summary, createdSessionCount)
    } catch (error) {
      const summary = error instanceof Error ? error.message : String(error)
      return this.finishOrchestratorRun(orchestratorRun.id, "failed", summary)
    }
  }

  async startWorkItemAgentSession(
    workItemId: string,
    options: StartWorkItemOptions = {},
  ): Promise<GoalAgentRun | null> {
    const workItem = this.requireWorkItem(workItemId)
    const goal = this.requireGoal(workItem.goalId)
    if (goal.status !== "active") {
      throw new Error("Only active goals can run work items")
    }
    if (workItem.status === "done" || workItem.status === "discarded") {
      throw new Error("Completed or discarded work items cannot be started")
    }
    if (this.hasDuplicateRunningWork(workItem)) {
      throw new Error("A duplicate work item is already running")
    }
    if (this.getRunningAgentRuns().length >= this.settings.maxGlobalRunningSessions) {
      throw new Error("Global running-session limit reached")
    }
    if (this.getRunningAgentRunsForGoal(goal.id).length >= this.settings.maxRunningSessionsPerGoal) {
      throw new Error("Goal running-session limit reached")
    }

    const prompt = this.buildWorkItemPrompt(goal, workItem)
    const conversation = await conversationService.createConversation(prompt, "user")
    const conversationTitle = this.formatWorkItemConversationTitle(goal, workItem)
    await conversationService.renameConversationTitle(conversation.id, conversationTitle, "system")

    const sessionId = agentSessionTracker.startSession(
      conversation.id,
      conversationTitle,
      true,
    )
    const timestamp = now()
    const agentRun: GoalAgentRun = {
      id: createId("grun"),
      goalId: goal.id,
      workItemId: workItem.id,
      sessionId,
      conversationId: conversation.id,
      status: "running",
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    this.agentRuns.unshift(agentRun)
    this.setWorkItemStatus(workItem.id, "running", workItem.notes, false)
    this.addActivity("session_started", `Started session for "${workItem.title}"`, {
      goalId: goal.id,
      workItemId: workItem.id,
      agentRunId: agentRun.id,
      sessionId,
    }, false)
    this.trimHistory()
    this.persistAndNotify()

    void this.executeAgentRun(agentRun.id, prompt, conversation.id, sessionId, {
      maxIterationsOverride: options.maxIterationsOverride,
    })

    return agentRun
  }

  async killAgentRun(input: { agentRunId: string; decisionQuestion?: string }): Promise<GoalAgentRun> {
    const run = this.requireAgentRun(input.agentRunId)
    if (run.status !== "running") {
      return run
    }

    const workItem = this.requireWorkItem(run.workItemId)
    const goal = this.requireGoal(run.goalId)
    const timestamp = now()
    const summary = "Session stopped by user"
    const updatedRun: GoalAgentRun = {
      ...run,
      status: "killed",
      summary,
      updatedAt: timestamp,
    }
    this.agentRuns = this.agentRuns.map((candidate) => candidate.id === updatedRun.id ? updatedRun : candidate)
    this.setWorkItemStatus(workItem.id, "waiting", workItem.notes, false)

    const question = input.decisionQuestion?.trim() || `What should happen next for "${workItem.title}"?`
    const decision = this.createDecisionWithoutPersist({
      goalId: goal.id,
      workItemId: workItem.id,
      question,
    })

    try {
      agentSessionStateManager.stopSession(run.sessionId)
      toolApprovalManager.cancelSessionApprovals(run.sessionId)
      agentSessionTracker.stopSession(run.sessionId)
      const runId = agentSessionStateManager.getSessionRunId(run.sessionId)
      await emitAgentProgress({
        sessionId: run.sessionId,
        runId,
        conversationId: run.conversationId ?? "",
        currentIteration: 0,
        maxIterations: 0,
        steps: [{
          id: `goal_orchestrator_stop_${timestamp}`,
          type: "completion",
          title: "Session stopped",
          description: "Goal orchestrator session was stopped. A decision was created.",
          status: "error",
          timestamp,
        }],
        isComplete: true,
        finalContent: "(Goal orchestrator session stopped)",
      })
    } catch (error) {
      logApp("[GoalOrchestrator] Failed to stop agent run cleanly:", error)
    }

    this.addActivity("session_killed", `Stopped session for "${workItem.title}"`, {
      goalId: goal.id,
      workItemId: workItem.id,
      agentRunId: run.id,
      sessionId: run.sessionId,
      decisionId: decision.id,
    }, false)
    this.persistAndNotify()
    return updatedRun
  }

  private async executeAgentRun(
    agentRunId: string,
    prompt: string,
    conversationId: string,
    sessionId: string,
    options: { maxIterationsOverride?: number },
  ): Promise<void> {
    try {
      const { runAgentLoopSession } = await import("./tipc")
      const finalContent = await runAgentLoopSession(
        prompt,
        conversationId,
        sessionId,
        true,
        options.maxIterationsOverride ?? this.settings.maxIterationsPerSession,
      )
      const currentRun = this.agentRuns.find((candidate) => candidate.id === agentRunId)
      const workItem = currentRun ? this.workItems.find((candidate) => candidate.id === currentRun.workItemId) : undefined
      const blockedQuestion = extractBlockedDecisionQuestion(finalContent || "", workItem)
      if (blockedQuestion) {
        this.finishAgentRun(agentRunId, "blocked", truncateSummary(finalContent || "Blocked"), blockedQuestion)
      } else {
        this.finishAgentRun(agentRunId, "done", truncateSummary(finalContent || "Completed"))
      }
    } catch (error) {
      const currentRun = this.agentRuns.find((candidate) => candidate.id === agentRunId)
      if (!currentRun || currentRun.status === "killed" || currentRun.status === "blocked") {
        return
      }
      const summary = truncateSummary(error instanceof Error ? error.message : String(error))
      this.finishAgentRun(agentRunId, "failed", summary)
    } finally {
      agentSessionStateManager.cleanupSession(sessionId)
    }
  }

  private finishAgentRun(
    agentRunId: string,
    status: Exclude<GoalAgentRunStatus, "running">,
    summary: string,
    decisionQuestion?: string,
  ): void {
    const run = this.agentRuns.find((candidate) => candidate.id === agentRunId)
    if (!run || run.status !== "running") {
      return
    }

    const workItem = this.workItems.find((candidate) => candidate.id === run.workItemId)
    const timestamp = now()
    const updatedRun: GoalAgentRun = {
      ...run,
      status,
      summary,
      updatedAt: timestamp,
    }

    this.agentRuns = this.agentRuns.map((candidate) => candidate.id === updatedRun.id ? updatedRun : candidate)

    if (workItem) {
      const nextStatus: WorkItemStatus = status === "done" ? "done" : "waiting"
      const nextNotes = status === "done"
        ? summary
        : `Last run ${status}: ${summary}`
      this.setWorkItemStatus(workItem.id, nextStatus, nextNotes, false)
      if (status === "blocked" && decisionQuestion) {
        this.createDecisionWithoutPersist({
          goalId: run.goalId,
          workItemId: workItem.id,
          question: decisionQuestion,
        })
      }
      const activityType: GoalActivityType =
        status === "done" ? "session_completed" : status === "blocked" ? "session_blocked" : "session_failed"
      const activityMessage = status === "done"
        ? `Completed "${workItem.title}"`
        : status === "blocked"
          ? `Blocked on "${workItem.title}"`
          : `Session ${status} for "${workItem.title}"`
      this.addActivity(
        activityType,
        activityMessage,
        {
          goalId: run.goalId,
          workItemId: workItem.id,
          agentRunId: run.id,
          sessionId: run.sessionId,
        },
        false,
      )
    }

    this.persistAndNotify()
  }

  private finishOrchestratorRun(
    orchestratorRunId: string,
    status: GoalOrchestratorRunStatus,
    summary: string,
    createdSessionCount = 0,
  ): GoalOrchestratorRun {
    const run = this.orchestratorRuns.find((candidate) => candidate.id === orchestratorRunId)
    if (!run) {
      throw new Error(`Orchestrator run ${orchestratorRunId} not found`)
    }

    const updated: GoalOrchestratorRun = {
      ...run,
      status,
      summary,
      createdSessionCount,
      completedAt: now(),
    }

    this.orchestratorRuns = this.orchestratorRuns.map((candidate) => candidate.id === updated.id ? updated : candidate)
    this.addActivity("orchestrator_ran", `Orchestrator ${status}: ${summary}`, {}, false)
    this.persistAndNotify()
    return updated
  }

  private selectNextReadyWorkItem(): WorkItem | null {
    const activeGoalIds = new Set(this.goals.filter((goal) => goal.status === "active").map((goal) => goal.id))
    return [...this.workItems]
      .filter((workItem) => workItem.status === "ready")
      .filter((workItem) => activeGoalIds.has(workItem.goalId))
      .filter((workItem) => !this.hasDuplicateRunningWork(workItem))
      .filter((workItem) => this.getRunningAgentRunsForGoal(workItem.goalId).length < this.settings.maxRunningSessionsPerGoal)
      .sort((a, b) => a.createdAt - b.createdAt)[0] ?? null
  }

  private proposeSeedWorkItems(activeGoals: Goal[]): void {
    for (const goal of activeGoals) {
      const seedTitle = `Identify next useful work for ${goal.title}`
      const normalizedSeedTitle = normalizeTitle(seedTitle)
      const existing = this.workItems.some((workItem) =>
        workItem.goalId === goal.id &&
        (workItem.status === "ready" || workItem.status === "running" || workItem.status === "waiting") &&
        normalizeTitle(workItem.title) === normalizedSeedTitle
      )
      if (existing) continue

      const timestamp = now()
      const workItem: WorkItem = {
        id: createId("work"),
        goalId: goal.id,
        title: seedTitle,
        status: "ready",
        notes: "Created by the orchestrator because this goal had no ready work.",
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      this.workItems.push(workItem)
      this.addActivity("work_created", `Created seed work item "${workItem.title}"`, {
        goalId: goal.id,
        workItemId: workItem.id,
      }, false)
      return
    }
  }

  private hasDuplicateRunningWork(workItem: WorkItem): boolean {
    const workTitle = normalizeTitle(workItem.title)
    return this.getRunningAgentRuns().some((run) => {
      if (run.goalId !== workItem.goalId) return false
      const runningWork = this.workItems.find((candidate) => candidate.id === run.workItemId)
      return runningWork ? normalizeTitle(runningWork.title) === workTitle : false
    })
  }

  private getRunningAgentRuns(): GoalAgentRun[] {
    return this.agentRuns.filter((run) => run.status === "running")
  }

  private getRunningAgentRunsForGoal(goalId: string): GoalAgentRun[] {
    return this.getRunningAgentRuns().filter((run) => run.goalId === goalId)
  }

  private async killExpiredAgentRuns(): Promise<void> {
    const maxRuntimeMinutes = this.settings.maxSessionRuntimeMinutes
    if (!maxRuntimeMinutes || maxRuntimeMinutes <= 0) return

    const runtimeMs = maxRuntimeMinutes * 60 * 1000
    const cutoff = now() - runtimeMs
    const expiredRuns = this.getRunningAgentRuns().filter((run) => run.createdAt < cutoff)

    for (const run of expiredRuns) {
      const workItem = this.workItems.find((candidate) => candidate.id === run.workItemId)
      await this.killAgentRun({
        agentRunId: run.id,
        decisionQuestion: workItem
          ? `The session for "${workItem.title}" exceeded ${maxRuntimeMinutes} minutes. What should happen next?`
          : `Session ${run.sessionId} exceeded ${maxRuntimeMinutes} minutes. What should happen next?`,
      })
    }
  }

  private buildWorkItemPrompt(goal: Goal, workItem: WorkItem): string {
    const goalNotes = goal.notes?.trim() ? goal.notes.trim() : "None"
    const workNotes = workItem.notes?.trim() ? workItem.notes.trim() : "None"
    return [
      "You are running inside DotAgents Goal Orchestrator.",
      "",
      "Goal",
      `Title: ${goal.title}`,
      `Notes: ${goalNotes}`,
      "",
      "Work item",
      `Title: ${workItem.title}`,
      `Notes: ${workNotes}`,
      "",
      "Do concrete work for this work item only. If you finish, return a concise result note. If you are blocked on user input or an external dependency, state the exact decision needed and stop.",
    ].join("\n")
  }

  private formatWorkItemConversationTitle(goal: Goal, workItem: WorkItem): string {
    const rawTitle = `[Goal] ${goal.title}: ${workItem.title}`
    return rawTitle.length <= 120 ? rawTitle : `${rawTitle.slice(0, 117)}...`
  }

  private createDecisionWithoutPersist(input: { goalId?: string; workItemId?: string; question: string }): Decision {
    const timestamp = now()
    const decision: Decision = {
      id: createId("decision"),
      goalId: input.goalId,
      workItemId: input.workItemId,
      question: input.question,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.decisions.push(decision)
    this.addActivity("decision_created", `Decision needed: ${decision.question}`, {
      goalId: input.goalId,
      workItemId: input.workItemId,
      decisionId: decision.id,
    }, false)
    return decision
  }

  private setWorkItemStatus(workItemId: string, status: WorkItemStatus, notes: string | undefined, persist = true): void {
    this.workItems = this.workItems.map((workItem) => workItem.id === workItemId
      ? {
          ...workItem,
          status,
          notes: this.cleanOptionalText(notes),
          updatedAt: now(),
        }
      : workItem,
    )

    if (persist) {
      this.persistAndNotify()
    }
  }

  private addActivity(
    type: GoalActivityType,
    message: string,
    refs: Omit<GoalActivityNote, "id" | "type" | "message" | "createdAt"> = {},
    trim = true,
  ): void {
    this.activityNotes.unshift({
      id: createId("activity"),
      type,
      message,
      createdAt: now(),
      ...refs,
    })
    if (trim) {
      this.trimHistory()
    }
  }

  private requireGoal(goalId: string): Goal {
    const goal = this.goals.find((candidate) => candidate.id === goalId)
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`)
    }
    return goal
  }

  private requireWorkItem(workItemId: string): WorkItem {
    const workItem = this.workItems.find((candidate) => candidate.id === workItemId)
    if (!workItem) {
      throw new Error(`Work item ${workItemId} not found`)
    }
    return workItem
  }

  private requireDecision(decisionId: string): Decision {
    const decision = this.decisions.find((candidate) => candidate.id === decisionId)
    if (!decision) {
      throw new Error(`Decision ${decisionId} not found`)
    }
    return decision
  }

  private requireAgentRun(agentRunId: string): GoalAgentRun {
    const run = this.agentRuns.find((candidate) => candidate.id === agentRunId)
    if (!run) {
      throw new Error(`Agent run ${agentRunId} not found`)
    }
    return run
  }

  private cleanOptionalText(value: string | undefined): string | undefined {
    const cleaned = value?.trim()
    return cleaned ? cleaned : undefined
  }

  private normalizePositiveInteger(value: unknown, fallback: number): number {
    const parsed = typeof value === "number" && Number.isFinite(value)
      ? Math.floor(value)
      : fallback
    return Math.max(1, parsed)
  }

  private normalizeOptionalPositiveInteger(value: unknown, fallback: number | undefined): number | undefined {
    if (value === null) return undefined
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return fallback
    }
    const parsed = Math.floor(value)
    return parsed >= 1 ? parsed : undefined
  }

  private trimHistory(): void {
    this.activityNotes = this.activityNotes.slice(0, MAX_ACTIVITY_NOTES)
    this.agentRuns = this.agentRuns.slice(0, MAX_AGENT_RUNS)
    this.orchestratorRuns = this.orchestratorRuns.slice(0, MAX_ORCHESTRATOR_RUNS)
  }

  private persistAndNotify(): void {
    this.persistState()
    notifyGoalOrchestratorChanged()
  }

  private persistState(): void {
    this.trimHistory()
    savePersistedJson(
      GOAL_ORCHESTRATOR_STATE_PATH,
      {
        version: 1,
        goals: this.goals,
        workItems: this.workItems,
        decisions: this.decisions,
        agentRuns: this.agentRuns,
        orchestratorRuns: this.orchestratorRuns,
        activityNotes: this.activityNotes,
        settings: this.settings,
      } satisfies PersistedGoalOrchestratorState,
      "GoalOrchestrator",
    )
  }

  private restorePersistedState(): void {
    const persisted = loadPersistedJson<PersistedGoalOrchestratorState>(
      GOAL_ORCHESTRATOR_STATE_PATH,
      "GoalOrchestrator",
    )
    if (!persisted) return

    this.goals = Array.isArray(persisted.goals) ? persisted.goals : []
    this.workItems = Array.isArray(persisted.workItems) ? persisted.workItems : []
    this.decisions = Array.isArray(persisted.decisions) ? persisted.decisions : []
    this.agentRuns = Array.isArray(persisted.agentRuns) ? persisted.agentRuns : []
    this.orchestratorRuns = Array.isArray(persisted.orchestratorRuns) ? persisted.orchestratorRuns : []
    this.activityNotes = Array.isArray(persisted.activityNotes) ? persisted.activityNotes : []
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(persisted.settings ?? {}),
    }
  }
}

export const goalOrchestratorService = GoalOrchestratorService.getInstance()
