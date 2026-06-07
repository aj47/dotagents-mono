import type {
  Decision,
  DecisionCreateRequest,
  DecisionRespondRequest,
  DecisionStatus,
  DecisionUpdateRequest,
} from "@dotagents/shared"
import { globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { logApp } from "./debug"
import { getAgentsLayerPaths, type AgentsLayerPaths } from "./agents-files/modular-config"
import {
  deleteDecisionFiles,
  loadDecisionsLayer,
  writeDecisionFile,
  type DecisionOrigin,
} from "./agents-files/decisions"
import { goalService } from "./goal-service"
import { goalProgressService } from "./goal-progress-service"

type LayerName = "global" | "workspace"
type ServiceDecisionOrigin = DecisionOrigin & { layer: LayerName }

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80)
}

function buildDecisionId(question: string): string {
  return `d_${slugify(question) || Date.now().toString(36)}`
}

function shouldAskDecision(input: DecisionCreateRequest): boolean {
  return Boolean(input.irreversible || input.pathChanging || (input.revertEffortHours ?? 0) > 3)
}

function normalizeDecision(input: DecisionCreateRequest | Decision, existing?: Decision): Decision {
  const now = Date.now()
  const id = (input.id ?? existing?.id ?? buildDecisionId(input.question)).trim()
  const createdAt = existing?.createdAt ?? ("createdAt" in input && typeof input.createdAt === "number" ? input.createdAt : now)
  const status = input.status ?? existing?.status ?? "pending"
  const history = "history" in input && Array.isArray(input.history)
    ? input.history
    : existing?.history ?? [{ at: now, type: "created", by: "agent" as const }]

  return {
    id,
    type: input.type ?? existing?.type ?? "yn",
    status,
    question: (input.question ?? existing?.question ?? id).trim() || id,
    recommendation: input.recommendation ?? existing?.recommendation,
    why: input.why ?? existing?.why,
    risk: input.risk ?? existing?.risk,
    goalId: input.goalId ?? existing?.goalId,
    taskId: input.taskId ?? existing?.taskId,
    createdAt,
    updatedAt: now,
    answeredAt: "answeredAt" in input ? input.answeredAt : existing?.answeredAt,
    expiresAt: input.expiresAt ?? existing?.expiresAt,
    defaultAction: input.defaultAction ?? existing?.defaultAction,
    answer: "answer" in input ? input.answer : existing?.answer,
    answerSource: "answerSource" in input ? input.answerSource : existing?.answerSource,
    urgent: input.urgent ?? existing?.urgent ?? false,
    revertEffortHours: input.revertEffortHours ?? existing?.revertEffortHours ?? 0,
    pathChanging: input.pathChanging ?? existing?.pathChanging ?? false,
    irreversible: input.irreversible ?? existing?.irreversible ?? false,
    history,
    body: input.body ?? existing?.body ?? "",
  }
}

export class DecisionService {
  private decisions: Decision[] = []
  private originById = new Map<string, ServiceDecisionOrigin>()
  private initialized = false

  private getLayers(): { globalLayer: AgentsLayerPaths; workspaceLayer: AgentsLayerPaths | null } {
    const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
    const workspaceLayer = workspaceAgentsFolder ? getAgentsLayerPaths(workspaceAgentsFolder) : null
    return { globalLayer, workspaceLayer }
  }

  private async loadFromDisk(): Promise<void> {
    const { globalLayer, workspaceLayer } = this.getLayers()
    const globalLoaded = loadDecisionsLayer(globalLayer)
    const workspaceLoaded = workspaceLayer ? loadDecisionsLayer(workspaceLayer) : null

    const mergedById = new Map<string, Decision>()
    const originById = new Map<string, ServiceDecisionOrigin>()

    for (const decision of globalLoaded.decisions) {
      const origin = globalLoaded.originById.get(decision.id)
      mergedById.set(decision.id, decision)
      if (origin) originById.set(decision.id, { ...origin, layer: "global" })
    }

    if (workspaceLoaded) {
      for (const decision of workspaceLoaded.decisions) {
        const origin = workspaceLoaded.originById.get(decision.id)
        mergedById.set(decision.id, decision)
        if (origin) originById.set(decision.id, { ...origin, layer: "workspace" })
      }
    }

    this.decisions = Array.from(mergedById.values())
    this.originById = originById
  }

  private async persist(decision: Decision): Promise<Decision> {
    const { globalLayer, workspaceLayer } = this.getLayers()
    const origin = this.originById.get(decision.id)
    const targetLayerName = origin?.layer ?? "global"
    const targetLayer = targetLayerName === "workspace" && workspaceLayer ? workspaceLayer : globalLayer
    writeDecisionFile(targetLayer, decision, { maxBackups: 10 })

    const index = this.decisions.findIndex((item) => item.id === decision.id)
    if (index >= 0) this.decisions[index] = decision
    else this.decisions.push(decision)
    this.originById.set(decision.id, { layer: targetLayerName, filePath: origin?.filePath ?? "" })
    return decision
  }

  private async autoResolveExpired(): Promise<void> {
    const now = Date.now()
    const expired = this.decisions.filter((decision) =>
      decision.status === "pending" &&
      typeof decision.expiresAt === "number" &&
      decision.expiresAt <= now &&
      Boolean(decision.defaultAction),
    )

    for (const decision of expired) {
      await this.persist({
        ...decision,
        status: "auto_resolved",
        answer: decision.defaultAction ?? null,
        answerSource: "timeout",
        answeredAt: now,
        updatedAt: now,
        history: [...decision.history, { at: now, type: "auto_resolved", by: "timeout", note: decision.defaultAction }],
      })
      goalProgressService.appendEvent({
        type: "decision_answered",
        actor: "system",
        goalId: decision.goalId,
        decisionId: decision.id,
        title: `Auto-resolved decision: ${decision.question}`,
        summary: decision.defaultAction ?? undefined,
        source: "timeout",
      })
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    await this.loadFromDisk()
    await this.autoResolveExpired()
    this.initialized = true
  }

  async reload(): Promise<void> {
    await this.loadFromDisk()
    await this.autoResolveExpired()
    this.initialized = true
  }

  async listDecisions(status: "pending" | "history" | "all" = "all"): Promise<Decision[]> {
    await this.initialize()
    await this.loadFromDisk()
    await this.autoResolveExpired()

    const goalPriorityById = new Map((await goalService.listGoals()).map((goal) => [goal.id, goal.priority]))
    const filtered = this.decisions.filter((decision) => {
      if (status === "pending") return decision.status === "pending"
      if (status === "history") return decision.status !== "pending"
      return true
    })

    return [...filtered].sort((a, b) => {
      if (status !== "pending") return b.updatedAt - a.updatedAt
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
      const priorityDiff = (goalPriorityById.get(a.goalId ?? "") ?? 99) - (goalPriorityById.get(b.goalId ?? "") ?? 99)
      if (priorityDiff !== 0) return priorityDiff
      return a.createdAt - b.createdAt
    })
  }

  async getDecision(id: string): Promise<Decision | null> {
    await this.initialize()
    await this.loadFromDisk()
    await this.autoResolveExpired()
    return this.decisions.find((decision) => decision.id === id) ?? null
  }

  async saveDecision(input: DecisionCreateRequest | Decision): Promise<Decision> {
    await this.initialize()
    if (!("status" in input) && !shouldAskDecision(input)) {
      throw new Error("Decision does not meet ask threshold: irreversible, path-changing, or >3 effort-hours to revert.")
    }
    const existing = input.id ? this.decisions.find((decision) => decision.id === input.id) : undefined
    const normalized = normalizeDecision(input, existing)
    const saved = await this.persist(normalized)
    if (!existing) {
      goalProgressService.appendEvent({
        type: "decision_created",
        actor: "agent",
        goalId: saved.goalId,
        decisionId: saved.id,
        title: `Decision needed: ${saved.question}`,
        summary: saved.recommendation,
        source: saved.taskId,
        metadata: {
          urgent: saved.urgent,
          irreversible: saved.irreversible,
          pathChanging: saved.pathChanging,
          revertEffortHours: saved.revertEffortHours,
        },
      })
    }
    logApp(`[DecisionService] Saved decision ${saved.id}`)
    return saved
  }

  async updateDecision(id: string, updates: DecisionUpdateRequest): Promise<Decision | null> {
    const existing = await this.getDecision(id)
    if (!existing) return null
    return this.saveDecision({ ...existing, ...updates, id })
  }

  async respondToDecision(id: string, response: DecisionRespondRequest): Promise<Decision | null> {
    const existing = await this.getDecision(id)
    if (!existing) return null
    const now = Date.now()
    const decision = await this.persist({
      ...existing,
      status: "answered",
      answer: response.answer,
      answerSource: response.answerSource ?? "aj",
      answeredAt: now,
      updatedAt: now,
      history: [...existing.history, { at: now, type: "answered", by: response.answerSource ?? "aj", note: response.answer }],
    })
    goalProgressService.appendEvent({
      type: "decision_answered",
      actor: response.answerSource === "agent" ? "agent" : "aj",
      goalId: decision.goalId,
      decisionId: decision.id,
      title: `Answered decision: ${decision.question}`,
      summary: response.answer,
      source: response.answerSource ?? "aj",
    })
    return decision
  }

  async setStatus(id: string, status: Extract<DecisionStatus, "deferred" | "canceled">, note?: string): Promise<Decision | null> {
    const existing = await this.getDecision(id)
    if (!existing) return null
    const now = Date.now()
    const decision = await this.persist({
      ...existing,
      status,
      updatedAt: now,
      history: [...existing.history, { at: now, type: status, by: "aj", note }],
    })
    goalProgressService.appendEvent({
      type: status === "deferred" ? "decision_deferred" : "decision_canceled",
      actor: "aj",
      goalId: decision.goalId,
      decisionId: decision.id,
      title: `${status === "deferred" ? "Deferred" : "Canceled"} decision: ${decision.question}`,
      summary: note,
      source: "aj",
    })
    return decision
  }

  async deleteDecision(id: string): Promise<boolean> {
    await this.initialize()
    const index = this.decisions.findIndex((decision) => decision.id === id)
    if (index < 0) return false
    const { globalLayer, workspaceLayer } = this.getLayers()
    const origin = this.originById.get(id)
    const layer = origin?.layer === "workspace" && workspaceLayer ? workspaceLayer : globalLayer
    deleteDecisionFiles(layer, id)
    this.decisions.splice(index, 1)
    this.originById.delete(id)
    return true
  }
}

export const decisionService = new DecisionService()
