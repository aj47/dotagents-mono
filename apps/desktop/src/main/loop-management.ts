import { agentProfileService } from "./agent-profile-service"
import { summarizeLoop, summarizeLoops } from "./loop-summaries"
import type { LoopConfig, LoopSummary } from "../shared/types"

interface LoopStatusSnapshot {
  id: string
  isRunning?: boolean
  lastRunAt?: number
  nextRunAt?: number
}

interface LoopSelectionCandidate {
  id: string
  name: string
}

export interface LoopRuntimeStore {
  getLoops(): LoopConfig[]
  getLoop(loopId: string): LoopConfig | undefined
  getLoopStatuses(): LoopStatusSnapshot[]
  getLoopStatus(loopId: string): LoopStatusSnapshot | undefined
  saveLoop(loop: LoopConfig): boolean
  deleteLoop(loopId: string): boolean
  startLoop(loopId: string): boolean
  stopLoop(loopId: string): boolean
  triggerLoop(loopId: string): Promise<boolean>
}

interface SaveManagedLoopOptions {
  restartIfEnabled?: boolean
}

interface LoopSelectionResult<T extends LoopSelectionCandidate> {
  selectedLoop?: T
  ambiguousLoops?: T[]
}

type ManagedLoopError = "already_running" | "delete_failed" | "not_found" | "persist_failed"

interface ManagedLoopResult {
  success: boolean
  error?: ManagedLoopError
  loop?: LoopConfig
  summary?: LoopSummary
}

function getLoopProfileName(profileId?: string): string | undefined {
  return profileId
    ? agentProfileService.getById(profileId)?.displayName
    : undefined
}

function normalizeLoopSelector(value: string): string {
  return value.trim().toLowerCase()
}

function applyManagedLoopRuntimeState(
  loopStore: Pick<LoopRuntimeStore, "startLoop" | "stopLoop">,
  loop: LoopConfig,
  options: SaveManagedLoopOptions = {},
): void {
  if (loop.enabled) {
    if (options.restartIfEnabled) {
      loopStore.stopLoop(loop.id)
    }
    loopStore.startLoop(loop.id)
    return
  }

  loopStore.stopLoop(loop.id)
}

export function getManagedLoopSummary(
  loopStore: Pick<LoopRuntimeStore, "getLoopStatus">,
  loop: LoopConfig,
): LoopSummary {
  return summarizeLoop(loop, {
    status: loopStore.getLoopStatus(loop.id),
    profileName: getLoopProfileName(loop.profileId),
  })
}

export function getManagedLoopSummaries(
  loopStore: Pick<LoopRuntimeStore, "getLoops" | "getLoopStatuses">,
): LoopSummary[] {
  return summarizeLoops(loopStore.getLoops(), {
    statuses: loopStore.getLoopStatuses(),
    getProfileName: getLoopProfileName,
  })
}

export function resolveManagedLoopSelection<T extends LoopSelectionCandidate>(
  loops: T[],
  query: string,
): LoopSelectionResult<T> {
  const trimmedQuery = query.trim()
  const normalizedQuery = normalizeLoopSelector(query)

  if (!trimmedQuery) {
    return {}
  }

  const exactIdMatch = loops.find((loop) => loop.id === trimmedQuery)
  if (exactIdMatch) {
    return { selectedLoop: exactIdMatch }
  }

  const exactNameMatches = loops.filter(
    (loop) => normalizeLoopSelector(loop.name) === normalizedQuery,
  )
  if (exactNameMatches.length === 1) {
    return { selectedLoop: exactNameMatches[0] }
  }
  if (exactNameMatches.length > 1) {
    return { ambiguousLoops: exactNameMatches }
  }

  const idPrefixMatches = loops.filter((loop) => loop.id.startsWith(trimmedQuery))
  if (idPrefixMatches.length === 1) {
    return { selectedLoop: idPrefixMatches[0] }
  }
  if (idPrefixMatches.length > 1) {
    return { ambiguousLoops: idPrefixMatches }
  }

  const namePrefixMatches = loops.filter((loop) =>
    normalizeLoopSelector(loop.name).startsWith(normalizedQuery),
  )
  if (namePrefixMatches.length === 1) {
    return { selectedLoop: namePrefixMatches[0] }
  }
  if (namePrefixMatches.length > 1) {
    return { ambiguousLoops: namePrefixMatches }
  }

  return {}
}

export function saveManagedLoop(
  loopStore: Pick<
    LoopRuntimeStore,
    "getLoopStatus" | "saveLoop" | "startLoop" | "stopLoop"
  >,
  loop: LoopConfig,
  options: SaveManagedLoopOptions = {},
): ManagedLoopResult {
  const saved = loopStore.saveLoop(loop)
  if (!saved) {
    return { success: false, error: "persist_failed" }
  }

  applyManagedLoopRuntimeState(loopStore, loop, options)

  return {
    success: true,
    loop,
    summary: getManagedLoopSummary(loopStore, loop),
  }
}

export function toggleManagedLoopEnabled(
  loopStore: Pick<
    LoopRuntimeStore,
    "getLoop" | "getLoopStatus" | "saveLoop" | "startLoop" | "stopLoop"
  >,
  loopId: string,
): ManagedLoopResult {
  const existingLoop = loopStore.getLoop(loopId)
  if (!existingLoop) {
    return { success: false, error: "not_found" }
  }

  return saveManagedLoop(loopStore, {
    ...existingLoop,
    enabled: !existingLoop.enabled,
  })
}

export async function triggerManagedLoop(
  loopStore: Pick<LoopRuntimeStore, "getLoop" | "getLoopStatus" | "triggerLoop">,
  loopId: string,
): Promise<ManagedLoopResult> {
  const existingLoop = loopStore.getLoop(loopId)
  if (!existingLoop) {
    return { success: false, error: "not_found" }
  }

  const triggered = await loopStore.triggerLoop(loopId)
  if (!triggered) {
    return { success: false, error: "already_running", loop: existingLoop }
  }

  return {
    success: true,
    loop: existingLoop,
    summary: getManagedLoopSummary(loopStore, existingLoop),
  }
}

export function deleteManagedLoop(
  loopStore: Pick<LoopRuntimeStore, "deleteLoop" | "getLoop">,
  loopId: string,
): ManagedLoopResult {
  const existingLoop = loopStore.getLoop(loopId)
  if (!existingLoop) {
    return { success: false, error: "not_found" }
  }

  const deleted = loopStore.deleteLoop(loopId)
  if (!deleted) {
    return { success: false, error: "delete_failed" }
  }

  return {
    success: true,
    loop: existingLoop,
  }
}
