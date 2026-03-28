import type { LoopConfig, LoopSummary } from "../shared/types"

interface LoopRuntimeStatusSnapshot {
  id: string
  isRunning?: boolean
  lastRunAt?: number
  nextRunAt?: number
}

interface SummarizeLoopOptions {
  profileName?: string
  status?: Omit<LoopRuntimeStatusSnapshot, "id">
}

interface SummarizeLoopsOptions {
  statuses?: Iterable<LoopRuntimeStatusSnapshot>
  getProfileName?: (profileId?: string) => string | undefined
}

export function summarizeLoop(
  loop: LoopConfig,
  options: SummarizeLoopOptions = {},
): LoopSummary {
  const status = options.status

  return {
    ...loop,
    profileName: options.profileName,
    lastRunAt: status?.lastRunAt ?? loop.lastRunAt,
    isRunning: status?.isRunning ?? false,
    nextRunAt: status?.nextRunAt,
  }
}

export function summarizeLoops(
  loops: LoopConfig[],
  options: SummarizeLoopsOptions = {},
): LoopSummary[] {
  const statusById = new Map<string, Omit<LoopRuntimeStatusSnapshot, "id">>()

  for (const status of options.statuses ?? []) {
    statusById.set(status.id, {
      isRunning: status.isRunning,
      lastRunAt: status.lastRunAt,
      nextRunAt: status.nextRunAt,
    })
  }

  return loops.map((loop) =>
    summarizeLoop(loop, {
      status: statusById.get(loop.id),
      profileName: options.getProfileName?.(loop.profileId),
    }),
  )
}
