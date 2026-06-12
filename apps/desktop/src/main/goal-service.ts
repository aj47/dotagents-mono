import type { Goal, GoalCreateRequest, GoalUpdateRequest } from "@dotagents/shared"
import { globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { logApp } from "./debug"
import { getAgentsLayerPaths, type AgentsLayerPaths } from "./agents-files/modular-config"
import {
  deleteGoalFiles,
  loadGoalsLayer,
  writeGoalFile,
  type GoalOrigin,
} from "./agents-files/goals"
import { goalProgressService } from "./goal-progress-service"

type LayerName = "global" | "workspace"
type ServiceGoalOrigin = GoalOrigin & { layer: LayerName }

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80)
}

function buildGoalId(title: string): string {
  return `g_${slugify(title) || Date.now().toString(36)}`
}

function isValidAgentGoal(goal: Goal): boolean {
  if (goal.createdBy !== "agent") return true
  if (!goal.successCriteria || !goal.abandonIf || !goal.provenance) return false
  return goal.level === "goal" || Boolean(goal.parentId)
}

function sameStringArray(a?: string[], b?: string[]): boolean {
  const left = a ?? []
  const right = b ?? []
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

function hasMeaningfulGoalUpdate(existing: Goal, next: Goal): boolean {
  return (
    existing.title !== next.title ||
    existing.description !== next.description ||
    existing.level !== next.level ||
    existing.priority !== next.priority ||
    existing.parentId !== next.parentId ||
    existing.successCriteria !== next.successCriteria ||
    existing.signalToWatch !== next.signalToWatch ||
    existing.abandonIf !== next.abandonIf ||
    existing.createdBy !== next.createdBy ||
    existing.createdFrom !== next.createdFrom ||
    existing.provenance !== next.provenance ||
    existing.notes !== next.notes ||
    existing.body !== next.body ||
    !sameStringArray(existing.linkedTaskIds, next.linkedTaskIds)
  )
}

function normalizeGoal(input: GoalCreateRequest | Goal, existing?: Goal): Goal {
  const now = Date.now()
  const id = (input.id ?? existing?.id ?? buildGoalId(input.title)).trim()
  const createdAt = existing?.createdAt ?? ("createdAt" in input && typeof input.createdAt === "number" ? input.createdAt : now)
  const createdBy = input.createdBy ?? existing?.createdBy ?? "aj"
  const priority = typeof input.priority === "number" && Number.isFinite(input.priority)
    ? input.priority
    : existing?.priority ?? 3

  return {
    id,
    title: (input.title ?? existing?.title ?? id).trim() || id,
    description: (input.description ?? existing?.description ?? "").trim(),
    level: input.level ?? existing?.level ?? "goal",
    priority: Math.max(1, Math.min(5, Math.round(priority))),
    status: input.status ?? existing?.status ?? "active",
    parentId: input.parentId ?? existing?.parentId,
    successCriteria: input.successCriteria ?? existing?.successCriteria,
    signalToWatch: input.signalToWatch ?? existing?.signalToWatch,
    abandonIf: input.abandonIf ?? existing?.abandonIf,
    createdAt,
    updatedAt: now,
    lastTouchedAt: "lastTouchedAt" in input && typeof input.lastTouchedAt === "number"
      ? input.lastTouchedAt
      : existing?.lastTouchedAt,
    createdBy,
    createdFrom: input.createdFrom ?? existing?.createdFrom ?? "manual",
    provenance: input.provenance ?? existing?.provenance,
    linkedTaskIds: input.linkedTaskIds ?? existing?.linkedTaskIds ?? [],
    notes: input.notes ?? existing?.notes,
    body: input.body ?? existing?.body ?? "",
  }
}

export class GoalService {
  private goals: Goal[] = []
  private originById = new Map<string, ServiceGoalOrigin>()
  private initialized = false

  private getLayers(): { globalLayer: AgentsLayerPaths; workspaceLayer: AgentsLayerPaths | null } {
    const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
    const workspaceLayer = workspaceAgentsFolder ? getAgentsLayerPaths(workspaceAgentsFolder) : null
    return { globalLayer, workspaceLayer }
  }

  private async loadFromDisk(): Promise<void> {
    const { globalLayer, workspaceLayer } = this.getLayers()
    const globalLoaded = loadGoalsLayer(globalLayer)
    const workspaceLoaded = workspaceLayer ? loadGoalsLayer(workspaceLayer) : null

    const mergedById = new Map<string, Goal>()
    const originById = new Map<string, ServiceGoalOrigin>()

    for (const goal of globalLoaded.goals) {
      const origin = globalLoaded.originById.get(goal.id)
      mergedById.set(goal.id, goal)
      if (origin) originById.set(goal.id, { ...origin, layer: "global" })
    }

    if (workspaceLoaded) {
      for (const goal of workspaceLoaded.goals) {
        const origin = workspaceLoaded.originById.get(goal.id)
        mergedById.set(goal.id, goal)
        if (origin) originById.set(goal.id, { ...origin, layer: "workspace" })
      }
    }

    this.goals = Array.from(mergedById.values())
    this.originById = originById
    for (const goal of this.goals) {
      if (goal.createdFrom !== "loop_daily_planning") continue
      if (!goalProgressService.hasEventForGoal("goal_created", goal.id)) {
        goalProgressService.appendEvent({
          type: "goal_created",
          actor: goal.createdBy === "agent" ? "agent" : "aj",
          goalId: goal.id,
          parentGoalId: goal.parentId,
          title: `Created goal: ${goal.title}`,
          summary: goal.description || goal.successCriteria,
          source: goal.createdFrom,
          metadata: {
            level: goal.level,
            priority: goal.priority,
            status: goal.status,
            backfilled: true,
          },
        })
      }
      if (goal.level === "today" && goal.parentId && !goalProgressService.hasEventForGoal("focus_selected", goal.id)) {
        goalProgressService.appendEvent({
          type: "focus_selected",
          actor: goal.createdBy === "agent" ? "agent" : "aj",
          goalId: goal.id,
          parentGoalId: goal.parentId,
          title: `Selected today's focus: ${goal.title}`,
          summary: goal.successCriteria,
          source: goal.createdFrom,
          metadata: { backfilled: true },
        })
      }
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

  async listGoals(): Promise<Goal[]> {
    await this.initialize()
    await this.loadFromDisk()
    return [...this.goals].sort((a, b) => a.priority - b.priority || b.updatedAt - a.updatedAt)
  }

  async listLoopVisibleGoals(): Promise<Goal[]> {
    const goals = await this.listGoals()
    return goals.filter((goal) => goal.status === "active" && Boolean(goal.successCriteria))
  }

  async getGoal(id: string): Promise<Goal | null> {
    await this.initialize()
    await this.loadFromDisk()
    return this.goals.find((goal) => goal.id === id) ?? null
  }

  async saveGoal(input: GoalCreateRequest | Goal): Promise<Goal> {
    await this.initialize()
    const existing = input.id ? this.goals.find((goal) => goal.id === input.id) : undefined
    const normalized = normalizeGoal(input, existing)

    if (!isValidAgentGoal(normalized)) {
      throw new Error("Agent-created goals require successCriteria, abandonIf, provenance, and parentId unless top-level.")
    }

    const { globalLayer, workspaceLayer } = this.getLayers()
    const origin = this.originById.get(normalized.id)
    const targetLayerName = origin?.layer ?? "global"
    const targetLayer = targetLayerName === "workspace" && workspaceLayer ? workspaceLayer : globalLayer

    writeGoalFile(targetLayer, normalized, { maxBackups: 10 })

    const index = this.goals.findIndex((goal) => goal.id === normalized.id)
    if (index >= 0) this.goals[index] = normalized
    else this.goals.push(normalized)
    this.originById.set(normalized.id, { layer: targetLayerName, filePath: origin?.filePath ?? "" })
    const actor = normalized.createdBy === "agent" ? "agent" : "aj"
    const eventSource = normalized.createdFrom
    if (!existing) {
      goalProgressService.appendEvent({
        type: "goal_created",
        actor,
        goalId: normalized.id,
        parentGoalId: normalized.parentId,
        title: `Created goal: ${normalized.title}`,
        summary: normalized.description || normalized.successCriteria,
        source: eventSource,
        metadata: {
          level: normalized.level,
          priority: normalized.priority,
          status: normalized.status,
        },
      })
      if (normalized.level === "today" && normalized.parentId) {
        goalProgressService.appendEvent({
          type: "focus_selected",
          actor,
          goalId: normalized.id,
          parentGoalId: normalized.parentId,
          title: `Selected today's focus: ${normalized.title}`,
          summary: normalized.successCriteria,
          source: eventSource,
        })
      }
    } else if (existing.status !== normalized.status) {
      goalProgressService.appendEvent({
        type: "goal_status_changed",
        actor,
        goalId: normalized.id,
        parentGoalId: normalized.parentId,
        title: `Changed status: ${normalized.title}`,
        summary: `${existing.status} -> ${normalized.status}`,
        source: eventSource,
        metadata: { from: existing.status, to: normalized.status },
      })
    } else if (hasMeaningfulGoalUpdate(existing, normalized)) {
      goalProgressService.appendEvent({
        type: "goal_updated",
        actor,
        goalId: normalized.id,
        parentGoalId: normalized.parentId,
        title: `Updated goal: ${normalized.title}`,
        summary: normalized.successCriteria,
        source: eventSource,
      })
    }
    logApp(`[GoalService] Saved goal ${normalized.id}`)
    return normalized
  }

  async updateGoal(id: string, updates: GoalUpdateRequest): Promise<Goal | null> {
    const existing = await this.getGoal(id)
    if (!existing) return null
    return this.saveGoal({ ...existing, ...updates, id })
  }

  async touchGoal(id: string): Promise<Goal | null> {
    const goal = await this.updateGoal(id, { lastTouchedAt: Date.now() })
    if (goal) {
      goalProgressService.appendEvent({
        type: "goal_touched",
        actor: "aj",
        goalId: goal.id,
        parentGoalId: goal.parentId,
        title: `Touched goal: ${goal.title}`,
      })
    }
    return goal
  }

  async deleteGoal(id: string): Promise<boolean> {
    await this.initialize()
    const index = this.goals.findIndex((goal) => goal.id === id)
    if (index < 0) return false
    const deletedGoal = this.goals[index]

    const { globalLayer, workspaceLayer } = this.getLayers()
    const origin = this.originById.get(id)
    const layer = origin?.layer === "workspace" && workspaceLayer ? workspaceLayer : globalLayer
    deleteGoalFiles(layer, id)
    this.goals.splice(index, 1)
    this.originById.delete(id)
    goalProgressService.appendEvent({
      type: "goal_deleted",
      actor: "aj",
      goalId: id,
      parentGoalId: deletedGoal.parentId,
      title: `Deleted goal: ${deletedGoal.title}`,
    })
    logApp(`[GoalService] Deleted goal ${id}`)
    return true
  }
}

export const goalService = new GoalService()
