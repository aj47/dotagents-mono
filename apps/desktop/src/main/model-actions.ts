import {
  getModelsAction,
  getProviderModelsAction,
  type ModelActionOptions,
} from "@dotagents/shared/chat-utils"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"

export type ModelActionResult = MobileApiActionResult

const modelActionOptions: ModelActionOptions = {
  getConfig: () => configStore.get(),
  fetchAvailableModels: async (providerId) => {
    const { fetchAvailableModels } = await import("./models-service")
    return fetchAvailableModels(providerId)
  },
  diagnostics: diagnosticsService,
}

export function getModels(): ModelActionResult {
  return getModelsAction(modelActionOptions)
}

export async function getProviderModels(providerId: string | undefined): Promise<ModelActionResult> {
  return getProviderModelsAction(providerId, modelActionOptions)
}
