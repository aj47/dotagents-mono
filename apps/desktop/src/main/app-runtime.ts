import { registerIpcMain } from "@egoist/tipc/main"
import { acpService } from "./acp-service"
import { agentProfileService } from "./agent-profile-service"
import { logApp } from "./debug"
import { loopService } from "./loop-service"
import { mcpService } from "./mcp-service"
import { initModelsDevService } from "./models-dev-service"
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
