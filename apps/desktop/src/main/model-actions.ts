import {
  buildOpenAICompatibleModelsResponse,
  buildProviderModelsResponse,
} from "@dotagents/shared/chat-utils"
import {
  CHAT_PROVIDER_IDS,
  isChatProviderId,
} from "@dotagents/shared/providers"
import { resolveActiveModelId } from "@dotagents/shared/model-presets"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"

export type ModelActionResult = MobileApiActionResult

function ok(body: unknown): ModelActionResult {
  return {
    statusCode: 200,
    body,
  }
}

function error(statusCode: number, message: string): ModelActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

export function getModels(): ModelActionResult {
  const model = resolveActiveModelId(configStore.get())
  return ok(buildOpenAICompatibleModelsResponse([model]))
}

export async function getProviderModels(providerId: string | undefined): Promise<ModelActionResult> {
  try {
    if (!isChatProviderId(providerId)) {
      return error(400, `Invalid provider: ${providerId}. Valid providers: ${CHAT_PROVIDER_IDS.join(", ")}`)
    }

    const { fetchAvailableModels } = await import("./models-service")
    const models = await fetchAvailableModels(providerId)

    return ok(buildProviderModelsResponse(providerId, models))
  } catch (caughtError: any) {
    diagnosticsService.logError("model-actions", "Failed to fetch models", caughtError)
    return error(500, caughtError?.message || "Failed to fetch models")
  }
}
