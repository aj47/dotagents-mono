import type { LoopConfig } from "@dotagents/core"
import {
  createRepeatTaskAction,
  deleteRepeatTaskAction,
  exportRepeatTaskToMarkdownAction,
  getRepeatTasksAction,
  importRepeatTaskFromMarkdownAction,
  runRepeatTaskAction,
  toggleRepeatTaskAction,
  updateRepeatTaskAction,
  type RepeatTaskActionOptions,
  type RepeatTaskLoopService,
} from "@dotagents/shared/repeat-task-utils"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { agentProfileService } from "./agent-profile-service"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"

export type RepeatTaskActionResult = MobileApiActionResult

function getLoopProfileName(profileId?: string): string | undefined {
  return profileId ? agentProfileService.getById(profileId)?.displayName : undefined
}

async function loadLoopService(): Promise<RepeatTaskLoopService<LoopConfig> | null> {
  try {
    const { loopService } = await import("./loop-service")
    return loopService
  } catch {
    return null
  }
}

const repeatTaskActionOptions: RepeatTaskActionOptions<LoopConfig, ReturnType<typeof configStore.get>> = {
  loadLoopService,
  getConfig: () => configStore.get(),
  saveConfig: (config) => configStore.save(config),
  createId: () => `loop_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
  getProfileName: getLoopProfileName,
  diagnostics: diagnosticsService,
}

export async function getRepeatTasks(): Promise<RepeatTaskActionResult> {
  return getRepeatTasksAction(repeatTaskActionOptions)
}

export async function toggleRepeatTask(id: string | undefined): Promise<RepeatTaskActionResult> {
  return toggleRepeatTaskAction(id, repeatTaskActionOptions)
}

export async function runRepeatTask(id: string | undefined): Promise<RepeatTaskActionResult> {
  return runRepeatTaskAction(id, repeatTaskActionOptions)
}

export async function createRepeatTask(body: unknown): Promise<RepeatTaskActionResult> {
  return createRepeatTaskAction(body, repeatTaskActionOptions)
}

export async function importRepeatTaskFromMarkdown(body: unknown): Promise<RepeatTaskActionResult> {
  return importRepeatTaskFromMarkdownAction(body, repeatTaskActionOptions)
}

export async function exportRepeatTaskToMarkdown(id: string | undefined): Promise<RepeatTaskActionResult> {
  return exportRepeatTaskToMarkdownAction(id, repeatTaskActionOptions)
}

export async function updateRepeatTask(id: string | undefined, body: unknown): Promise<RepeatTaskActionResult> {
  return updateRepeatTaskAction(id, body, repeatTaskActionOptions)
}

export async function deleteRepeatTask(id: string | undefined): Promise<RepeatTaskActionResult> {
  return deleteRepeatTaskAction(id, repeatTaskActionOptions)
}
