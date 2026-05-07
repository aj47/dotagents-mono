import type { ModelInfo, ModelsDevModel } from "@dotagents/shared/api-types"
import { tipcClient } from "@renderer/lib/tipc-client"

export const desktopModelsClient = {
  fetchAvailableModels(providerId: string): Promise<ModelInfo[]> {
    return tipcClient.fetchAvailableModels({ providerId }) as Promise<ModelInfo[]>
  },

  fetchModelsForPreset(baseUrl: string, apiKey: string): Promise<ModelInfo[]> {
    return tipcClient.fetchModelsForPreset({ baseUrl, apiKey }) as Promise<
      ModelInfo[]
    >
  },

  getModelInfo(
    modelId: string,
    providerId?: string,
  ): Promise<ModelsDevModel | null> {
    return tipcClient.getModelInfo({ modelId, providerId }) as Promise<
      ModelsDevModel | null
    >
  },
}
