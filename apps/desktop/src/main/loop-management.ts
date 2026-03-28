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

interface ManagedLoopInput {
  id?: unknown
  name?: unknown
  prompt?: unknown
  intervalMinutes?: unknown
  enabled?: unknown
  profileId?: unknown
  maxIterations?: unknown
  runOnStartup?: unknown
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

type ManagedLoopError =
  | "already_running"
  | "delete_failed"
  | "invalid_input"
  | "not_found"
  | "persist_failed"

export interface ManagedLoopResult {
  success: boolean
  error?: ManagedLoopError
  errorMessage?: string
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

function getTrimmedString(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean
    allowEmpty?: boolean
  } = {},
): { value?: string; errorMessage?: string } {
  if (value === undefined) {
    return options.required
      ? {
          errorMessage: `${fieldName} is required and must be a non-empty string`,
        }
      : {}
  }

  if (typeof value !== "string") {
    return {
      errorMessage: `${fieldName} must be a string when provided`,
    }
  }

  const trimmed = value.trim()
  if (!trimmed && !options.allowEmpty) {
    return options.required
      ? {
          errorMessage: `${fieldName} is required and must be a non-empty string`,
        }
      : {
          errorMessage: `${fieldName} must be a non-empty string when provided`,
        }
  }

  return { value: trimmed }
}

function getPositiveInteger(
  value: unknown,
  fieldName: string,
): { value?: number; errorMessage?: string } {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return {
      errorMessage: `${fieldName} must be a finite integer >= 1 when provided`,
    }
  }

  return { value }
}

function getOptionalBoolean(
  value: unknown,
  fieldName: string,
): { value?: boolean; errorMessage?: string } {
  if (value === undefined) {
    return {}
  }

  if (typeof value !== "boolean") {
    return {
      errorMessage: `${fieldName} must be a boolean when provided`,
    }
  }

  return { value }
}

function getOptionalProfileId(value: unknown): {
  value?: string
  errorMessage?: string
} {
  if (value === undefined || value === null) {
    return { value: undefined }
  }

  const parsed = getTrimmedString(value, "profileId", { allowEmpty: true })
  if (parsed.errorMessage) {
    return parsed
  }

  return { value: parsed.value || undefined }
}

function getOptionalMaxIterations(value: unknown): {
  value?: number
  errorMessage?: string
} {
  if (value === undefined || value === null) {
    return { value: undefined }
  }

  return getPositiveInteger(value, "maxIterations")
}

function getLoopInputErrorResult(errorMessage: string): ManagedLoopResult {
  return {
    success: false,
    error: "invalid_input",
    errorMessage,
  }
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

  const idPrefixMatches = loops.filter((loop) =>
    loop.id.startsWith(trimmedQuery),
  )
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

export function createManagedLoop(
  loopStore: Pick<
    LoopRuntimeStore,
    "getLoopStatus" | "saveLoop" | "startLoop" | "stopLoop"
  >,
  input: ManagedLoopInput,
): ManagedLoopResult {
  const idResult =
    input.id === undefined
      ? {
          value: `loop_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        }
      : getTrimmedString(input.id, "id", { required: true })
  if (idResult.errorMessage) {
    return getLoopInputErrorResult(idResult.errorMessage)
  }

  const nameResult = getTrimmedString(input.name, "name", { required: true })
  if (nameResult.errorMessage) {
    return getLoopInputErrorResult(nameResult.errorMessage)
  }

  const promptResult = getTrimmedString(input.prompt, "prompt", {
    required: true,
  })
  if (promptResult.errorMessage) {
    return getLoopInputErrorResult(promptResult.errorMessage)
  }

  const intervalMinutesResult =
    input.intervalMinutes === undefined
      ? { value: 60 }
      : getPositiveInteger(input.intervalMinutes, "intervalMinutes")
  if (intervalMinutesResult.errorMessage) {
    return getLoopInputErrorResult(intervalMinutesResult.errorMessage)
  }

  const enabledResult = getOptionalBoolean(input.enabled, "enabled")
  if (enabledResult.errorMessage) {
    return getLoopInputErrorResult(enabledResult.errorMessage)
  }

  const profileIdResult = getOptionalProfileId(input.profileId)
  if (profileIdResult.errorMessage) {
    return getLoopInputErrorResult(profileIdResult.errorMessage)
  }

  const maxIterationsResult = getOptionalMaxIterations(input.maxIterations)
  if (maxIterationsResult.errorMessage) {
    return getLoopInputErrorResult(maxIterationsResult.errorMessage)
  }

  const runOnStartupResult = getOptionalBoolean(
    input.runOnStartup,
    "runOnStartup",
  )
  if (runOnStartupResult.errorMessage) {
    return getLoopInputErrorResult(runOnStartupResult.errorMessage)
  }

  return saveManagedLoop(loopStore, {
    id: idResult.value!,
    name: nameResult.value!,
    prompt: promptResult.value!,
    intervalMinutes: intervalMinutesResult.value!,
    enabled: enabledResult.value ?? true,
    profileId: profileIdResult.value,
    maxIterations: maxIterationsResult.value,
    runOnStartup: runOnStartupResult.value ?? false,
  })
}

export function updateManagedLoop(
  loopStore: Pick<
    LoopRuntimeStore,
    "getLoop" | "getLoopStatus" | "saveLoop" | "startLoop" | "stopLoop"
  >,
  loopId: string,
  input: ManagedLoopInput,
): ManagedLoopResult {
  const existingLoop = loopStore.getLoop(loopId)
  if (!existingLoop) {
    return { success: false, error: "not_found" }
  }

  const nameResult = getTrimmedString(input.name, "name")
  if (nameResult.errorMessage) {
    return getLoopInputErrorResult(nameResult.errorMessage)
  }

  const promptResult = getTrimmedString(input.prompt, "prompt")
  if (promptResult.errorMessage) {
    return getLoopInputErrorResult(promptResult.errorMessage)
  }

  const intervalMinutesResult =
    input.intervalMinutes === undefined
      ? {}
      : getPositiveInteger(input.intervalMinutes, "intervalMinutes")
  if (intervalMinutesResult.errorMessage) {
    return getLoopInputErrorResult(intervalMinutesResult.errorMessage)
  }

  const enabledResult = getOptionalBoolean(input.enabled, "enabled")
  if (enabledResult.errorMessage) {
    return getLoopInputErrorResult(enabledResult.errorMessage)
  }

  const profileIdResult = getOptionalProfileId(input.profileId)
  if (profileIdResult.errorMessage) {
    return getLoopInputErrorResult(profileIdResult.errorMessage)
  }

  const maxIterationsResult = getOptionalMaxIterations(input.maxIterations)
  if (maxIterationsResult.errorMessage) {
    return getLoopInputErrorResult(maxIterationsResult.errorMessage)
  }

  const runOnStartupResult = getOptionalBoolean(
    input.runOnStartup,
    "runOnStartup",
  )
  if (runOnStartupResult.errorMessage) {
    return getLoopInputErrorResult(runOnStartupResult.errorMessage)
  }

  return saveManagedLoop(
    loopStore,
    {
      ...existingLoop,
      ...(input.name !== undefined && { name: nameResult.value! }),
      ...(input.prompt !== undefined && { prompt: promptResult.value! }),
      ...(input.intervalMinutes !== undefined && {
        intervalMinutes: intervalMinutesResult.value!,
      }),
      ...(input.enabled !== undefined && { enabled: enabledResult.value! }),
      ...(input.profileId !== undefined && {
        profileId: profileIdResult.value,
      }),
      ...(input.maxIterations !== undefined && {
        maxIterations: maxIterationsResult.value,
      }),
      ...(input.runOnStartup !== undefined && {
        runOnStartup: runOnStartupResult.value!,
      }),
    },
    { restartIfEnabled: true },
  )
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
  loopStore: Pick<
    LoopRuntimeStore,
    "getLoop" | "getLoopStatus" | "triggerLoop"
  >,
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
