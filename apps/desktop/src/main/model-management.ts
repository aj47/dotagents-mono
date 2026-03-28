import {
  fetchModelsDevData,
  findBestModelMatch,
  getModelFromModelsDevByProviderId,
  refreshModelsDevCache,
  type ModelsDevData,
  type ModelsDevModel,
} from "./models-dev-service"
import {
  fetchAvailableModels,
  fetchModelsForPreset,
  type ModelInfo,
} from "./models-service"

export const MANAGED_MODEL_PROVIDER_IDS = ["openai", "groq", "gemini"] as const

export type ManagedModelProviderId = (typeof MANAGED_MODEL_PROVIDER_IDS)[number]

export function isManagedModelProviderId(
  providerId: string,
): providerId is ManagedModelProviderId {
  return MANAGED_MODEL_PROVIDER_IDS.includes(
    providerId as ManagedModelProviderId,
  )
}

export async function getManagedAvailableModels(
  providerId: string,
): Promise<ModelInfo[]> {
  if (!isManagedModelProviderId(providerId)) {
    throw new Error(
      `Invalid provider: ${providerId}. Valid providers: ${MANAGED_MODEL_PROVIDER_IDS.join(", ")}`,
    )
  }

  return fetchAvailableModels(providerId)
}

export async function getManagedPresetModels(
  baseUrl: string,
  apiKey: string,
): Promise<ModelInfo[]> {
  return fetchModelsForPreset(baseUrl, apiKey)
}

export function getManagedModelInfo(
  modelId: string,
  providerId?: string,
): ModelsDevModel | null {
  if (providerId) {
    return getModelFromModelsDevByProviderId(modelId, providerId) || null
  }

  return findBestModelMatch(modelId)?.model || null
}

export async function getManagedModelsDevData(): Promise<ModelsDevData> {
  return fetchModelsDevData()
}

export async function refreshManagedModelsDevData(): Promise<{
  success: true
}> {
  await refreshModelsDevCache()
  return { success: true }
}
