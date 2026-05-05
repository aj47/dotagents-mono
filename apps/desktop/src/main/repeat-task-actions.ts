import type { LoopConfig } from "@dotagents/core"
import {
  applyRepeatTaskUpdate,
  buildRepeatTaskDeleteResponse,
  buildRepeatTaskFromCreateRequest,
  buildRepeatTaskMutationResponse,
  buildRepeatTaskResponse,
  buildRepeatTaskRunResponse,
  buildRepeatTasksResponse,
  buildRepeatTaskToggleResponse,
  parseRepeatTaskCreateRequestBody,
  parseRepeatTaskUpdateRequestBody,
} from "@dotagents/shared/repeat-task-utils"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { agentProfileService } from "./agent-profile-service"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"

export type RepeatTaskActionResult = MobileApiActionResult

function ok(body: unknown, statusCode = 200): RepeatTaskActionResult {
  return {
    statusCode,
    body,
  }
}

function error(statusCode: number, message: string): RepeatTaskActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

function getLoopProfileName(profileId?: string): string | undefined {
  return profileId ? agentProfileService.getById(profileId)?.displayName : undefined
}

async function loadLoopService() {
  try {
    const { loopService } = await import("./loop-service")
    return loopService
  } catch {
    return null
  }
}

export async function getRepeatTasks(): Promise<RepeatTaskActionResult> {
  try {
    const loopService = await loadLoopService()
    const loops = loopService?.getLoops() ?? (configStore.get().loops || [])
    const statuses = loopService?.getLoopStatuses() ?? []

    return ok(buildRepeatTasksResponse(loops, {
      statuses,
      getProfileName: getLoopProfileName,
    }))
  } catch (caughtError) {
    diagnosticsService.logError("repeat-task-actions", "Failed to get repeat tasks", caughtError)
    return error(500, "Failed to get repeat tasks")
  }
}

export async function toggleRepeatTask(id: string | undefined): Promise<RepeatTaskActionResult> {
  try {
    const loopService = await loadLoopService()

    if (loopService) {
      const existing = loopService.getLoop(id ?? "")
      if (!existing) {
        return error(404, "Repeat task not found")
      }

      const updated = { ...existing, enabled: !existing.enabled }
      const saved = loopService.saveLoop(updated)
      if (!saved) {
        return error(500, "Failed to persist repeat task toggle")
      }

      if (updated.enabled) {
        loopService.startLoop(id ?? "")
      } else {
        loopService.stopLoop(id ?? "")
      }

      return ok(buildRepeatTaskToggleResponse(id ?? "", updated.enabled))
    }

    const cfg = configStore.get()
    const loops = cfg.loops || []
    const loopIndex = loops.findIndex(l => l.id === id)

    if (loopIndex === -1) {
      return error(404, "Repeat task not found")
    }

    const updatedLoops = [...loops]
    updatedLoops[loopIndex] = {
      ...updatedLoops[loopIndex],
      enabled: !updatedLoops[loopIndex].enabled,
    }

    configStore.save({ ...cfg, loops: updatedLoops })

    return ok(buildRepeatTaskToggleResponse(id ?? "", updatedLoops[loopIndex].enabled))
  } catch (caughtError: any) {
    diagnosticsService.logError("repeat-task-actions", "Failed to toggle repeat task", caughtError)
    return error(500, caughtError?.message || "Failed to toggle repeat task")
  }
}

export async function runRepeatTask(id: string | undefined): Promise<RepeatTaskActionResult> {
  try {
    const loopService = await loadLoopService()

    if (loopService) {
      const loopExists = loopService.getLoop(id ?? "")
      if (!loopExists) {
        return error(404, "Repeat task not found")
      }

      const triggered = await loopService.triggerLoop(id ?? "")

      if (!triggered) {
        return error(409, "Task is already running")
      }

      return ok(buildRepeatTaskRunResponse(id ?? ""))
    }

    return error(503, "Repeat task service is unavailable")
  } catch (caughtError: any) {
    diagnosticsService.logError("repeat-task-actions", "Failed to run repeat task", caughtError)
    return error(500, caughtError?.message || "Failed to run repeat task")
  }
}

export async function createRepeatTask(body: unknown): Promise<RepeatTaskActionResult> {
  try {
    const parsedRequest = parseRepeatTaskCreateRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const id = `loop_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    const newLoop: LoopConfig = buildRepeatTaskFromCreateRequest(id, parsedRequest.request)

    const loopService = await loadLoopService()
    if (loopService) {
      const saved = loopService.saveLoop(newLoop)
      if (!saved) {
        return error(500, "Failed to persist repeat task")
      }

      if (newLoop.enabled) {
        loopService.startLoop(newLoop.id)
      }
    } else {
      const cfg = configStore.get()
      const loops = [...(cfg.loops || []), newLoop]
      configStore.save({ ...cfg, loops })
    }

    const savedLoop = loopService?.getLoop(newLoop.id) ?? newLoop
    return ok(buildRepeatTaskResponse(savedLoop, {
      profileName: getLoopProfileName(savedLoop.profileId),
      status: loopService?.getLoopStatus(savedLoop.id),
    }))
  } catch (caughtError: any) {
    diagnosticsService.logError("repeat-task-actions", "Failed to create repeat task", caughtError)
    return error(500, caughtError?.message || "Failed to create repeat task")
  }
}

export async function updateRepeatTask(id: string | undefined, body: unknown): Promise<RepeatTaskActionResult> {
  try {
    const parsedRequest = parseRepeatTaskUpdateRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const loopService = await loadLoopService()
    let existing: LoopConfig | undefined
    let cfg: ReturnType<typeof configStore.get> | undefined
    let loops: LoopConfig[] = []
    let loopIndex = -1

    if (loopService) {
      existing = loopService.getLoop(id ?? "")
    } else {
      cfg = configStore.get()
      loops = cfg.loops || []
      loopIndex = loops.findIndex(l => l.id === id)
      existing = loopIndex >= 0 ? loops[loopIndex] : undefined
    }

    if (!existing) {
      return error(404, "Repeat task not found")
    }

    const updated: LoopConfig = applyRepeatTaskUpdate(existing, parsedRequest.request)

    if (loopService) {
      const saved = loopService.saveLoop(updated)
      if (!saved) {
        return error(500, "Failed to persist repeat task")
      }

      if (updated.enabled) {
        loopService.stopLoop(id ?? "")
        loopService.startLoop(id ?? "")
      } else {
        loopService.stopLoop(id ?? "")
      }
    } else if (cfg && loopIndex >= 0) {
      const updatedLoops = [...loops]
      updatedLoops[loopIndex] = updated
      configStore.save({ ...cfg, loops: updatedLoops })
    }

    const savedLoop = loopService?.getLoop(id ?? "") ?? updated
    return ok(buildRepeatTaskMutationResponse(savedLoop, {
      profileName: getLoopProfileName(savedLoop.profileId),
      status: loopService?.getLoopStatus(savedLoop.id),
    }))
  } catch (caughtError: any) {
    diagnosticsService.logError("repeat-task-actions", "Failed to update repeat task", caughtError)
    return error(500, caughtError?.message || "Failed to update repeat task")
  }
}

export async function deleteRepeatTask(id: string | undefined): Promise<RepeatTaskActionResult> {
  try {
    const loopService = await loadLoopService()

    if (loopService) {
      const existing = loopService.getLoop(id ?? "")
      if (!existing) {
        return error(404, "Repeat task not found")
      }

      const deleted = loopService.deleteLoop(id ?? "")
      if (!deleted) {
        return error(500, "Failed to delete repeat task")
      }

      return ok(buildRepeatTaskDeleteResponse(id ?? ""))
    }

    const cfg = configStore.get()
    const loops = cfg.loops || []
    const loopIndex = loops.findIndex(l => l.id === id)

    if (loopIndex === -1) {
      return error(404, "Repeat task not found")
    }

    const updatedLoops = loops.filter(l => l.id !== id)
    configStore.save({ ...cfg, loops: updatedLoops })

    return ok(buildRepeatTaskDeleteResponse(id ?? ""))
  } catch (caughtError: any) {
    diagnosticsService.logError("repeat-task-actions", "Failed to delete repeat task", caughtError)
    return error(500, caughtError?.message || "Failed to delete repeat task")
  }
}
