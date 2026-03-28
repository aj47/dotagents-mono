import { registerIpcMain } from "@egoist/tipc/main"
import { acpService } from "./acp-service"
import { agentProfileService } from "./agent-profile-service"
import { logApp } from "./debug"
import { loopService } from "./loop-service"
import { mcpService } from "./mcp-service"
import { initModelsDevService } from "./models-dev-service"
import { stopRemoteServer } from "./remote-server"
import { registerServeProtocol } from "./serve"
import {
  initializeBundledSkills,
  startSkillsFolderWatcher,
} from "./skills-service"
import { router } from "./tipc"

type StartupStrategy = "await" | "background"

export interface SharedRuntimeStartupOptions {
  label: string
  mcpStrategy: StartupStrategy
  acpStrategy: StartupStrategy
}

export interface SharedRuntimeShutdownOptions {
  label: string
  cleanupTimeoutMs?: number
  keyboardCleanup?: () => Promise<void>
  stopRemoteServer?: boolean
}

interface SharedRuntimeCleanupTask {
  label: string
  cleanup: () => Promise<void>
}

export function registerSharedMainProcessInfrastructure(): void {
  registerIpcMain(router)
  registerServeProtocol()
}

async function runStartupTask(
  strategy: StartupStrategy,
  task: () => Promise<void>,
  onError: (error: unknown) => void,
): Promise<void> {
  if (strategy === "await") {
    await task()
    return
  }

  void task().catch(onError)
}

async function runCleanupTask(
  task: SharedRuntimeCleanupTask,
  timeoutMs?: number,
): Promise<void> {
  if (typeof timeoutMs !== "number" || timeoutMs <= 0) {
    await task.cleanup()
    return
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      task.cleanup(),
      new Promise<void>((_, reject) => {
        const id = setTimeout(
          () => reject(new Error(`${task.label} cleanup timeout`)),
          timeoutMs,
        )
        timeoutId = id
        // unref() ensures this timer won't keep the event loop alive
        // if cleanup finishes quickly (only available in Node.js)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (id && typeof (id as any).unref === "function") {
          ;(id as any).unref()
        }
      }),
    ])
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  }
}

async function initializeAcpRuntime(label: string): Promise<void> {
  await acpService.initialize()
  logApp(`[${label}] ACP service initialized`)

  try {
    agentProfileService.syncAgentProfilesToACPRegistry()
    logApp(`[${label}] Agent profiles synced to ACP registry`)
  } catch (error) {
    logApp(`[${label}] Failed to sync agent profiles to ACP registry:`, error)
  }
}

export async function initializeSharedRuntimeServices(
  options: SharedRuntimeStartupOptions,
): Promise<void> {
  const { label, mcpStrategy, acpStrategy } = options

  await runStartupTask(
    mcpStrategy,
    async () => {
      await mcpService.initialize()
      logApp(`[${label}] MCP service initialized`)
    },
    (error) => {
      logApp(`[${label}] Failed to initialize MCP service:`, error)
    },
  )

  try {
    loopService.startAllLoops()
    logApp(`[${label}] Repeat tasks started`)
  } catch (error) {
    logApp(`[${label}] Failed to start repeat tasks:`, error)
  }

  await runStartupTask(
    acpStrategy,
    () => initializeAcpRuntime(label),
    (error) => {
      logApp(`[${label}] Failed to initialize ACP service:`, error)
    },
  )

  try {
    const skillsResult = initializeBundledSkills()
    logApp(
      `[${label}] Bundled skills initialized: ` +
        `${skillsResult.copied.length} copied, ${skillsResult.skipped.length} skipped`,
    )
    startSkillsFolderWatcher()
  } catch (error) {
    logApp(`[${label}] Failed to initialize bundled skills:`, error)
  }

  try {
    initModelsDevService()
    logApp(`[${label}] Models.dev service initialized`)
  } catch (error) {
    logApp(`[${label}] Failed to initialize models.dev service:`, error)
  }
}

export async function shutdownSharedRuntimeServices(
  options: SharedRuntimeShutdownOptions,
): Promise<void> {
  const {
    label,
    cleanupTimeoutMs,
    keyboardCleanup,
    stopRemoteServer: shouldStopRemoteServer = false,
  } = options

  try {
    loopService.stopAllLoops()
  } catch (error) {
    logApp(`[${label}] Failed to stop repeat tasks:`, error)
  }

  const cleanupTasks: SharedRuntimeCleanupTask[] = [
    ...(keyboardCleanup
      ? [
          {
            label: "keyboard",
            cleanup: keyboardCleanup,
          },
        ]
      : []),
    {
      label: "ACP",
      cleanup: () => acpService.shutdown(),
    },
    {
      label: "MCP",
      cleanup: () => mcpService.cleanup(),
    },
    ...(shouldStopRemoteServer
      ? [
          {
            label: "remote server",
            cleanup: () => stopRemoteServer(),
          },
        ]
      : []),
  ]

  const cleanupResults = await Promise.allSettled(
    cleanupTasks.map((task) => runCleanupTask(task, cleanupTimeoutMs)),
  )

  for (const [index, result] of cleanupResults.entries()) {
    if (result.status === "rejected") {
      logApp(
        `[${label}] Error during ${cleanupTasks[index]?.label || "runtime"} cleanup:`,
        result.reason,
      )
    }
  }
}
